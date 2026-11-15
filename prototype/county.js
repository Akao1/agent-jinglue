'use strict';

const countyViewQuery = window.matchMedia('(max-width: 700px)');
const countyPath = (province, district) => 'atlas/' + encodeURIComponent(province) + '/' + encodeURIComponent(district);
const countyLocation = task => countyPath(task.province, districtKey(task)) + '/' + encodeURIComponent(task.id);

function countyTasks(province, district) {
  return state.tasks.filter(task => task.province === province && districtKey(task) === district);
}

function orderCounty(tasks) {
  const byId = new Map(tasks.map(task => [task.id,task]));
  const seen = new Set();
  const ordered = [];
  function place(task) {
    if (seen.has(task.id)) return;
    seen.add(task.id);
    task.needs.forEach(id => { if (byId.has(id)) place(byId.get(id)); });
    ordered.push(task);
  }
  tasks.forEach(place);
  return ordered;
}

function countyReach(from, tasks) {
  const reached = new Set([from.id]);
  const pending = [from.id];
  while (pending.length) {
    const id = pending.shift();
    for (const next of tasks) {
      if (reached.has(next.id) || !next.needs.includes(id)) continue;
      reached.add(next.id);
      pending.push(next.id);
    }
  }
  return tasks.filter(task => task.id !== from.id && reached.has(task.id) && status(task)[1] === 'blocked');
}

function countyPriorities(tasks) {
  const approvals = tasks.filter(task => stageOf(task) === 'approval');
  const reviews = tasks.filter(task => !task.flow && task.stage === 'review' && !unresolved(task).length);
  const review = reviews.map(task => ({task,impact:countyReach(task,tasks).length}))
    .sort((a,b) => b.impact - a.impact)[0];
  const entries = [];
  if (approvals.length) {
    const task = approvals[0];
    entries.push({type:'approval',icon:'lock',title:'待你批示',task,count:approvals.length,
      note:'第 ' + task.flow.version + ' 版待决定',action:'审阅案卷',target:'cases/' + task.id});
  }
  if (review) {
    entries.push({type:'review',icon:'check',title:'待你验收',task:review.task,count:reviews.length,
      note:review.impact ? '影响后续 ' + review.impact + ' 项' : '交付已提交',action:'核对交付',target:countyLocation(review.task)});
  }
  if (!entries.length) {
    const next = tasks.find(task => ['active','open'].includes(status(task)[1]) &&
      !['independent','review'].includes(stageOf(task)) && !unresolved(task).length);
    if (next) {
      entries.push({type:'review',icon:'pin',title:'可继续办理',task:next,count:1,
        note:status(next)[0],action:'查看下一步',target:countyLocation(next)});
    }
  }
  if (!entries.length) return '';
  return '<section class="county-priorities" aria-label="现在要办">' + entries.map(item =>
    '<a class="county-priority ' + item.type + '" href="#' + item.target + '"><span class="county-priority-symbol">' +
    icon(item.icon) + '</span><span class="county-priority-copy"><span class="county-priority-label">' + item.title +
    (item.count > 1 ? ' ' + item.count + ' 项' : '') + '</span><strong>' + esc(item.task.title) + '</strong><small>' +
    item.note + '</small></span><span class="county-priority-action">' + item.action + icon('next') + '</span></a>'
  ).join('') + '</section>';
}

function countySeatLabel(name) {
  return name.endsWith('州') ? '州治' : '府治';
}

function countyHeader(province, district, tasks) {
  const name = districts[province][district];
  const provinceName = provinces[province].name + '省';
  const areas = [
    ['待我处理',tasks.filter(task => stageOf(task) === 'approval' || (!task.flow && task.stage === 'review' && !unresolved(task).length)).length,'needs'],
    ['等待前置',tasks.filter(task => status(task)[1] === 'blocked' || (stageOf(task) === 'dispatch' && unresolved(task).length)).length,'blocked'],
    ['领地',tasks.filter(task => stageOf(task) === 'done').length,'land']
  ];
  const archives = tasks.filter(task => stageOf(task) === 'archived').length;
  return '<nav class="county-crumbs" aria-label="版图路径">' + link('王朝版图','atlas','map') + icon('next') +
    link(provinceName,'atlas/' + encodeURIComponent(province)) + '</nav>' +
    '<header class="county-header"><div class="county-title"><h1 tabindex="-1">' + esc(name) + '</h1>' +
    '<span class="county-total">' + tasks.length + ' 县</span><a class="county-seat-entry" href="#' +
    jurisdictionLocation(province,district) + '">' + icon('court') + countySeatLabel(name) + '</a></div>' +
    '<dl class="county-stats">' + areas.map(([label,count,key]) => '<div class="' + key + '"><dt>' + label + '</dt><dd>' + count + '</dd></div>').join('') +
    '<div class="archive"><dt>熟地</dt><dd><a href="#history/' + encodeURIComponent(province) + '/' + encodeURIComponent(district) +
    '" aria-label="查看' + esc(name) + '县志，' + archives + '处熟地">' + archives + icon('box') + '</a></dd></div></dl></header>';
}

function countyList(tasks, selected) {
  return '<ul class="county-list" aria-label="县案清单">' + tasks.map(task => {
    const chosen = task.id === selected?.id;
    const upstream = unresolved(task).map(get).filter(Boolean);
    const caption = upstream.length ? '等' + upstream.map(item => item.title).join('、') : centerOfficer(task);
    return '<li><button type="button" data-action="county-select" data-key="' + esc(task.id) + '" aria-pressed="' + chosen + '">' +
      '<span class="county-list-name"><strong>' + esc(task.title) + '</strong><small>' + esc(caption) + '</small></span>' +
      badge(task) + icon('next') + '</button></li>';
  }).join('') + '</ul>';
}

function countyEvidencePreview(task) {
  if (task.id === 'YL-002') return reviewStoryboard();
  const body = ordinaryReviewBody(task);
  if (body) return '<div class="review-delivery-copy"><h4>交付正文</h4>' + reviewParagraphs(body) + '</div>';
  if (!task.shots?.length) return '';
  return '<details class="county-evidence-preview"><summary>预览演示分镜表</summary><ol>' +
    task.shots.map(shot => '<li><strong>' + esc(shot.title) + '</strong><span>' + esc(shot.source) + '</span></li>').join('') +
    '</ol></details>';
}

function countyEvidence(task) {
  return '<div class="county-evidence"><span>交付记录</span><strong>' + icon('file') + esc(task.evidence || '未提交') +
    '</strong>' + countyEvidencePreview(task) + '<span>验收条件</span><p>' + esc(task.check) + '</p></div>';
}

function countySelection(task, tasks, mode) {
  if (!task) return '';
  const stage = stageOf(task);
  const missing = unresolved(task);
  const needs = task.needs.map(id => ({id,task:get(id)}));
  const downstream = tasks.filter(item => item.needs.includes(task.id) && item.stage === 'idle' && !unresolved(item).length);
  const taskLink = (item,label) => item.task ? link(label,countyLocation(item.task),'next') : '<span>' + esc(label) + '</span>';
  const base = '<header class="county-selection-head"><span class="county-case-id">' + esc(task.id) +
    '</span>' + badge(task) + '</header><h2 tabindex="-1">' + esc(task.title) + '</h2>';
  let body = '';
  let action = '';
  if (task.flow && stage === 'approval') {
    body = '<p class="county-callout">由你批示 <strong>第 ' + task.flow.version + ' 版</strong></p>' +
      '<p class="county-brief">' + esc(task.note) + '</p>';
    action = '<a class="button red" href="#cases/' + esc(task.id) + '">审阅拟议' + icon('next') + '</a>';
  } else if (missing.length) {
    body = '<div class="county-callout county-wait"><strong>' + icon('lock') + '等待前置</strong>' +
      '<ul>' + needs.filter(item => missing.includes(item.id)).map(item =>
        '<li>' + (item.task ? taskLink(item,'先完成' + item.task.title) + badge(item.task) : '<span>缺少前置案卷 ' + esc(item.id) + '</span>') + '</li>'
      ).join('') + '</ul></div>';
    action = '<a class="button" href="#cases/' + esc(task.id) + '">查看原案' + icon('next') + '</a>';
  } else if (!task.flow && stage === 'review') {
    const impact = countyReach(task,tasks);
    body = countyEvidence(task) + (impact.length ? '<p class="county-unlock">' + icon('next') +
      '验收后可接续' + esc(impact.filter(item => item.needs.includes(task.id) && unresolved(item).length === 1).map(item => item.title).join('、') || '后续办理') + '</p>' : '');
    action = canAcceptOrdinary(task) ? button('验收通过','accept',task.id,true,'check') :
      ordinaryDeliveryEditor(task,'save-delivery');
  } else if (stage === 'done') {
    body = task.evidence ? countyEvidence(task) : '<p class="county-callout">' + icon('check') + '已办结</p>';
    if (downstream.length) body += '<div class="county-next"><strong>现在可以继续</strong>' + downstream.map(item =>
      link(item.title,countyLocation(item),'next')).join('') + '</div>';
  } else if (stage === 'archived') {
    body = '<p class="county-callout">' + icon('box') + '此县已归档</p>';
    action = link('查看本府县志','history/' + task.province + '/' + districtKey(task),'book');
  } else {
    const owner = centerOfficer(task);
    body = '<p class="county-callout">当前经手 <strong>' + esc(owner) + '</strong></p>' +
      '<p class="county-brief">' + esc(task.note) + '</p>';
    if (!task.flow && stage === 'idle' && state.connected) action = button('开始办理','begin',task.id,true,'next');
    if (!task.flow && stage === 'active' && state.connected) action = ordinaryDeliveryEditor(task);
  }
  const original = missing.length && stage !== 'approval' || stage === 'approval' ? '' : link('打开案卷','cases/' + task.id,'file');
  return '<aside id="county-selection" class="county-selection" aria-label="所选案卷">' + base + body +
    '<div class="county-selection-actions">' + action + original + '</div><div class="county-back">' +
    button(mode === 'map' ? '返回版图' : '返回清单','county-back','',false,mode === 'map' ? 'map' : 'list') + '</div></aside>';
}

function countyAtlas(province,district,direct) {
  state.province = province;
  state.district = district;
  const all = countyTasks(province,district);
  const live = orderCounty(all.filter(task => task.stage !== 'archived'));
  const needle = query.toLocaleLowerCase();
  const matches = live.filter(task => [task.title,task.id,status(task)[0],centerOfficer(task)].join(' ').toLocaleLowerCase().includes(needle));
  const selected = (!query && direct) || matches.find(task => task.id === state.selected) ||
    matches.find(task => !task.flow && task.stage === 'review' && !unresolved(task).length) || matches.find(task => stageOf(task) === 'approval') || matches[0];
  if (selected) state.selected = selected.id;
  const mode = state.view || (countyViewQuery.matches ? 'list' : 'map');
  const choices = [['map','map','版图'],['list','list','清单']].map(([key,symbol,label]) =>
    '<button type="button" data-action="county-view" data-key="' + key + '" aria-pressed="' + (mode === key) + '">' +
    icon(symbol) + label + '</button>').join('');
  const content = matches.length ? (mode === 'map' ? countyMap(live,selected,matches) : countyList(matches,selected)) :
    '<div class="county-empty"><p>' + (query ? '未找到匹配的案卷。' : '这里还没有办理中的县。') + '</p>' +
    (query ? button('清除搜索','county-clear','',false) : link('在此交办','new','plus')) + '</div>';
  return '<article class="county-page">' + countyHeader(province,district,all) + countyPriorities(live) +
    '<div class="county-layout' + (selected ? '' : ' county-layout--wide') + '"><section class="county-board" aria-labelledby="county-board-title">' +
    '<header class="county-board-head"><div><h2 id="county-board-title">办理进度</h2>' +
    (query ? '<small>' + matches.length + ' 项匹配</small>' : '') + '</div>' +
    '<div class="county-tools"><form class="search county-search" id="search-form"><input type="search" aria-label="搜索本府案卷" name="q" placeholder="查名称或案号" value="' + esc(query) +
    '"><button type="submit" aria-label="搜索本府">' + icon('search') + '</button></form><div class="segments county-tabs" aria-label="办理视图">' +
    choices + '</div></div></header><div data-county-view="' + mode + '">' + content + '</div>' +
    (mode === 'map' && selected?.needs.length && live.length <= 6 ? '<footer class="county-map-key">' +
      '<span aria-hidden="true">⤳</span>箭头指向依赖它的下一案</footer>' : '') + '</section>' + countySelection(selected,live,mode) + '</div></article>';
}
