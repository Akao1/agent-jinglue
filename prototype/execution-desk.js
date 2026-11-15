'use strict';

const executionScenes = {
  approval: {label:'签批交接', task:'YL-012', initial:'ready', outcome:'waiting', owner:'礼部 / 演示模型'},
  completed: {label:'生成完成', task:'YL-019', initial:'complete', outcome:'complete', owner:'工部 / 演示模型'},
  timeout: {label:'连接超时', title:'检查维护记录', task:'YL-031', initial:'timeout', outcome:'timeout', owner:'工部 / 演示模型'},
  permission: {label:'权限不足', title:'读取复核材料', task:'YL-029', initial:'denied', outcome:'denied', owner:'门下省 / 演示校验'},
  'write-unknown': {label:'写入待核', task:'YL-031', initial:'unknown', outcome:'unknown', owner:'工部 / 演示模型'},
  stopped: {label:'中止记录', task:'YL-019', initial:'stopped', outcome:'complete', owner:'工部 / 演示模型'},
};

const executionCheckpoints = {
  queued:{label:'执行排队',initial:'queued',cursor:0,snapshot:true},
  streaming:{label:'流式生成',initial:'streaming',cursor:2,snapshot:true},
  paused:{label:'暂停续办',initial:'paused',cursor:2},
  waiting:{label:'签批交接',initial:'waiting',cursor:4},
};

const executionLabels = {
  ready:['可启动','已准备好，启动后可看到本次执行记录。'],
  queued:['排队中','已登记请求，正在分配演示执行者。'],
  streaming:['生成中','按处理顺序陆续返回结果。'],
  paused:['已暂停','已保留进度，可从下一条继续。'],
  stopped:['已中止','已保留本次产生的记录。重新演示会开启新的尝试。'],
  waiting:['等待人工','已整理材料，决策仍在原案。'],
  complete:['产物已生成','本次输出已齐，可在原案继续查看或办理。'],
  timeout:['连接超时','响应未完成，未提交写入，可另起一次重试。'],
  denied:['权限不足','未取得复核材料的读取授权，本次未发出执行请求。'],
  unknown:['写入结果待核','未收到模拟写入回执。先核对回执或查看原案。'],
};

function executionDemoRows() {
  return [
    ['ready','approval'],['queued','queued'],['streaming','streaming'],['paused','paused'],
    ['stopped','stopped'],['waiting','waiting'],['complete','completed'],['timeout','timeout'],
    ['denied','permission'],['unknown','write-unknown'],
  ].map(([key,scene]) => ({label:executionLabels[key][0],description:executionLabels[key][1],route:'desk/' + scene}));
}

function executionConfig(id, segment) {
  if (id === 'case') {
    const task = get(segment);
    return task && {key:'case:' + task.id,label:'案卷执行',task:task.id,initial:'ready',
      outcome:stageOf(task) === 'approval' ? 'waiting' : 'complete', owner:task.owner + ' / 演示模型'};
  }
  const key = id || 'approval';
  if (Object.hasOwn(executionCheckpoints,key)) {
    return {key,script:'approval',...executionScenes.approval,...executionCheckpoints[key]};
  }
  return Object.hasOwn(executionScenes,key) ? {key,...executionScenes[key]} : undefined;
}

function executionEvent(actor,title,text) {
  return {actor,title,text};
}

function executionPlan(config) {
  const task = get(config.task);
  const entry = executionEvent('经略受理','读取案卷摘要',task ? task.id + '　' + task.title : '当前演示案卷');
  if ((config.script || config.key) === 'approval') return [entry,
    executionEvent('礼部','整理交付范围','拟使用经核准的片段，待批范围限样片与发布说明。'),
    executionEvent('礼部','补齐验收条件','交付件包含样片和授权清单。保留版号与引用出处。'),
    executionEvent('门下省','整理待批依据','批示仍绑定原案的当前版本和范围。')];
  if (config.key === 'timeout' || config.key === 'write-unknown') return [entry,
    executionEvent('工部','核对服务与影响范围','范围限示例环境。保留发生时间、响应类型和回退记录。'),
    executionEvent('工部','整理复查依据','已记录版本比对项和下一次检查所需的条件。')];
  return [entry,
    executionEvent(config.owner.split(' / ')[0],'形成初步整理',task?.note || '检查演示所需的输入资料。'),
    executionEvent('经略','记录验收依据',task?.check || '在案卷中查看验收条件。')];
}

function executionOutcomeEvent(status) {
  const titles = {
    waiting:'交接至原案', complete:'产物整理完成', timeout:'连接超时',
    denied:'权限校验未通过', unknown:'写入回执未到',
  };
  return executionEvent('经略',titles[status],executionLabels[status][1]);
}

function executionSeed(config) {
  const status = config.initial;
  const plan = executionPlan(config);
  const cursor = config.cursor ?? (status === 'complete' ? plan.length : ['timeout','unknown','stopped'].includes(status) ? 2 : 0);
  const events = plan.slice(0,cursor);
  if (config.script === 'approval') events.unshift(executionEvent('经略','已登记演示请求','安排礼部接手样片交付材料。'));
  if (status === 'stopped') events.push(executionEvent('演示操作者','已停止演示',executionLabels.stopped[1]));
  else if (status === 'paused') events.push(executionEvent('演示操作者','已暂停演示',executionLabels.paused[1]));
  else if (['waiting','complete','timeout','denied','unknown'].includes(status)) events.push(executionOutcomeEvent(status));
  return {attempts:[{number:1,status,cursor,events,snapshot:config.snapshot}]};
}

function executionRecord(config) {
  state.execDemos ??= {};
  if (!Object.hasOwn(state.execDemos,config.key)) state.execDemos[config.key] = executionSeed(config);
  return state.execDemos[config.key];
}

function executionLatest(record) {
  return record.attempts[record.attempts.length - 1];
}

function executionRunning(attempt) {
  return attempt.status === 'queued' || attempt.status === 'streaming';
}

function executionButton(action,label,primary = false,iconName = 'next') {
  return '<button type="button" class="button' + (primary ? ' primary' : '') +
    '" data-execution-action="' + action + '">' + icon(iconName) + esc(label) + '</button>';
}

function executionCaseLink(task,label,primary = false) {
  return task ? '<a class="button' + (primary ? ' primary' : '') + '" href="#cases/' + encodeURIComponent(task.id) + '">' +
    icon('file') + label + '</a>' : '';
}

function executionControls(config,attempt) {
  const task = get(config.task);
  if (attempt.snapshot) return executionButton('resume','继续演示',true) + executionButton('stop','停止演示',false,'lock');
  switch (attempt.status) {
    case 'ready': return executionButton('start','开始演示',true);
    case 'queued':
    case 'streaming': return executionButton('pause','暂停演示',false,'watch') + executionButton('stop','停止演示',false,'lock');
    case 'paused': return executionButton('resume','继续演示',true) + executionButton('stop','停止演示',false,'lock');
    case 'stopped': return executionButton('replay','重新演示',true) + executionCaseLink(task,'查看原案');
    case 'waiting': return executionCaseLink(task,stageOf(task) === 'approval' ? '查看待批案卷' : '查看原案',true) + executionButton('replay','重新演示');
    case 'complete': return executionCaseLink(task,'查看原案') + executionButton('replay','重新演示');
    case 'timeout': return executionButton('retry','重试演示',true) + executionCaseLink(task,'查看原案');
    case 'denied': return executionCaseLink(task,'查看权限要求');
    case 'unknown': return (attempt.receiptChecked ? '' : executionButton('receipt','核对演示回执',true,'watch')) +
      executionCaseLink(task,'查看原案');
    default: return '';
  }
}

function executionActivity(event,index) {
  return '<li class="exec-event"><span class="exec-event-index" aria-hidden="true">' + String(index + 1).padStart(2,'0') +
    '</span><div><p class="exec-event-meta">' + esc(event.actor) + '</p><h3>' + esc(event.title) + '</h3><p>' +
    esc(event.text) + '</p></div></li>';
}

function executionContext(task,config) {
  const profile = task && workspaceById(task.workspaceId);
  const stage = task ? status(task)[0] : '待定位';
  const profileLink = profile ? link(profile.name,'jurisdiction/workspace/' + encodeURIComponent(profile.id) + '/' +
    encodeURIComponent(task.id)) : '待绑定';
  return '<aside class="exec-context" aria-labelledby="exec-case-heading"><header><h2 id="exec-case-heading">关联案卷</h2>' +
    (task ? '<span class="exec-case-id">' + esc(task.id) + '</span>' : '') + '</header>' +
    (task ? '<h3>' + esc(task.title) + '</h3>' : '') +
    '<dl><div><dt>当前案卷阶段</dt><dd><span class="exec-case-phase">' + esc(stage) + '</span></dd></div>' +
    '<div><dt>本次执行者</dt><dd>' + esc(config.owner) + '</dd></div><div><dt>所属工作区</dt><dd>' + profileLink + '</dd></div>' +
    (task?.flow ? '<div><dt>当前案卷版本</dt><dd>第 ' + esc(task.flow.version) + ' 版</dd></div>' : '') +
    '</dl>' + (task ? '<footer>' + link('打开案卷','cases/' + encodeURIComponent(task.id),'file') +
      link('在版图定位',countyLocation(task),'map') + '</footer>' : '') + '</aside>';
}

let activeExecution;
let visibleExecution;

function executionDeskPage(id,segment) {
  const config = executionConfig(id,segment);
  visibleExecution = config;
  if (!config) return head('找不到演示') + '<section class="sheet"><p>此演示或案卷当前不可用。</p>' +
    link('回办理台','desk','center') + '</section>';
  const record = executionRecord(config);
  const attempt = executionLatest(record);
  if (executionRunning(attempt) && !attempt.snapshot && activeExecution?.key !== config.key) {
    attempt.status = 'paused';
    attempt.events.push(executionEvent('经略','恢复了上次记录','执行已暂停，可从下一条继续。'));
  }
  const options = Object.entries(executionScenes).map(([key,entry]) => '<a href="#desk/' + key + '"' +
    (config.key === key ? ' aria-current="page"' : '') + '>' + esc(entry.label) + '</a>').join('');
  return '<div class="exec-desk" data-exec-key="' + esc(config.key) + '">' + head('办理台','本地流式演示') +
    '<a class="exec-catalog text-link" href="#demo">' + icon('list') + '状态样例</a>' +
    '<nav class="exec-scenarios" aria-label="执行场景">' + options + '</nav><div class="exec-grid">' +
    '<section class="exec-panel" aria-labelledby="exec-run-title"><header class="exec-panel-heading"><div>' +
    '<span class="exec-serial">第 ' + attempt.number + ' 次尝试</span><h2 id="exec-run-title" tabindex="-1">' +
    esc(config.title || config.label) + '</h2></div><span class="exec-state" data-exec-status role="status" data-state="' +
    attempt.status + '">' + executionLabels[attempt.status][0] + '</span></header>' +
    '<div class="exec-controls" data-exec-controls>' + executionControls(config,attempt) + '</div>' +
    '<p class="exec-status-detail" data-exec-detail>' + executionLabels[attempt.status][1] + '</p>' +
    '<section class="exec-activity" aria-labelledby="exec-log-title"><h3 id="exec-log-title">执行记录</h3>' +
    '<p class="exec-empty" data-exec-empty' + (attempt.events.length ? ' hidden' : '') + '>启动后会逐条显示本次记录。</p>' +
    '<div role="log" aria-labelledby="exec-log-title" aria-relevant="additions"><ol data-exec-log>' +
    attempt.events.map(executionActivity).join('') + '</ol></div></section>' +
    '<div data-exec-past>' + executionHistory(record) + '</div></section>' +
    executionContext(get(config.task),config) + '</div></div>';
}

function executionHistory(record) {
  return record.attempts.slice(0,-1).reverse().map(attempt =>
    '<details class="exec-history"><summary>第 ' + attempt.number + ' 次尝试 · ' +
    esc(executionLabels[attempt.status][0]) + '</summary><ol>' +
    attempt.events.map(executionActivity).join('') + '</ol></details>').join('');
}

function executionRefresh(config,record,focus = false) {
  const desk = document.querySelector('.exec-desk');
  if (desk?.dataset.execKey !== config.key) return;
  const attempt = executionLatest(record);
  const status = desk.querySelector('[data-exec-status]');
  const controls = desk.querySelector('[data-exec-controls]');
  const log = desk.querySelector('[data-exec-log]');
  const attemptNumber = String(attempt.number);
  const current = log.dataset.attempt || desk.querySelector('.exec-serial').textContent.match(/\d+/)?.[0];
  const changedAttempt = current !== attemptNumber;
  if (changedAttempt) {
    log.replaceChildren();
    desk.querySelector('.exec-serial').textContent = '第 ' + attemptNumber + ' 次尝试';
    desk.querySelector('[data-exec-past]').innerHTML = executionHistory(record);
  }
  log.dataset.attempt = attemptNumber;
  for (let index = log.children.length; index < attempt.events.length; index++) {
    log.insertAdjacentHTML('beforeend',executionActivity(attempt.events[index],index));
  }
  desk.querySelector('[data-exec-empty]').hidden = Boolean(attempt.events.length);
  if (status.dataset.state !== attempt.status || changedAttempt || focus) {
    const active = controls.contains(document.activeElement) ? document.activeElement : undefined;
    if (status.dataset.state !== attempt.status) {
      status.dataset.state = attempt.status;
      status.textContent = executionLabels[attempt.status][0];
      desk.querySelector('[data-exec-detail]').textContent = executionLabels[attempt.status][1];
    }
    controls.innerHTML = executionControls(config,attempt);
    if (focus || active) {
      const retained = active && Array.from(controls.children).find(item =>
        item.tagName === active.tagName && item.dataset.executionAction === active.dataset.executionAction &&
        item.getAttribute('href') === active.getAttribute('href'));
      (retained || controls.querySelector('button, a') || desk.querySelector('#exec-run-title')).focus({preventScroll:true});
    }
  }
}

function executionPause(title,text) {
  if (!activeExecution) return;
  const {config,record,timer} = activeExecution;
  clearTimeout(timer);
  activeExecution = undefined;
  const attempt = executionLatest(record);
  attempt.status = 'paused';
  attempt.events.push(executionEvent('经略',title,text));
  keep();
}

function executionSchedule(config,record) {
  activeExecution = {key:config.key,config,record,timer:setTimeout(() => {
    const attempt = executionLatest(record);
    if (!executionRunning(attempt)) return;
    const plan = executionPlan(config);
    if (attempt.cursor < plan.length) {
      attempt.status = 'streaming';
      attempt.events.push(plan[attempt.cursor++]);
      executionSchedule(config,record);
    } else {
      activeExecution = undefined;
      attempt.status = attempt.retry ? 'complete' : config.outcome;
      attempt.events.push(executionOutcomeEvent(attempt.status));
    }
    keep();
    executionRefresh(config,record);
  },690)};
}

document.addEventListener('click',event => {
  const button = event.target.closest('[data-execution-action]');
  if (!button || !visibleExecution || !button.closest('.exec-desk')) return;
  const config = visibleExecution;
  const record = executionRecord(config);
  let attempt = executionLatest(record);
  const action = button.dataset.executionAction;
  if (action === 'pause' && executionRunning(attempt)) {
    executionPause('暂停演示','已保留当前记录。');
  } else if (action === 'stop' && (executionRunning(attempt) || attempt.status === 'paused')) {
    if (activeExecution) clearTimeout(activeExecution.timer);
    activeExecution = undefined;
    attempt.status = 'stopped';
    attempt.snapshot = false;
    attempt.events.push(executionEvent('演示操作者','停止演示',executionLabels.stopped[1]));
  } else if (action === 'receipt' && attempt.status === 'unknown' && !attempt.receiptChecked) {
    attempt.receiptChecked = true;
    attempt.events.push(executionEvent('工部','已核对演示回执','未找到确定回执，继续等待人工核对。未发起重试。'));
  } else if (action === 'resume' && (attempt.status === 'paused' || attempt.snapshot)) {
    attempt.snapshot = false;
    attempt.status = attempt.cursor ? 'streaming' : 'queued';
    executionSchedule(config,record);
  } else if (action === 'start' && attempt.status === 'ready') {
    attempt.status = 'queued';
    attempt.events.push(executionEvent('经略','已登记演示请求','正在分配执行者。'));
    executionSchedule(config,record);
  } else if ((action === 'retry' && attempt.status === 'timeout') ||
    (action === 'replay' && ['waiting','complete','stopped'].includes(attempt.status))) {
    attempt = {number:attempt.number + 1,status:'queued',cursor:0,retry:action === 'retry',
      events:[executionEvent('经略','已登记新尝试','上一轮的记录已保留。')]};
    record.attempts.push(attempt);
    executionSchedule(config,record);
  } else return;
  keep();
  executionRefresh(config,record,true);
});

window.addEventListener('hashchange',() => executionPause('离开办理台','已暂停并保留执行记录。'));
window.addEventListener('pagehide',() => executionPause('页面已离开','重新打开可继续此前的演示。'));
window.addEventListener('pageshow',event => {
  if (event.persisted && visibleExecution) executionRefresh(visibleExecution,executionRecord(visibleExecution));
});
