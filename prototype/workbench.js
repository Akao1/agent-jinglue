'use strict';

function workCaseRoute(task,mode = 'all') {
  return 'center/' + (mode === 'mine' ? 'mine' : 'case') + '/' + encodeURIComponent(task.id);
}

function workMyTasks(tasks) {
  return tasks.filter(task => stageOf(task) === 'approval' ||
    (!task.flow && task.stage === 'review' && !unresolved(task).length));
}

function workTreeHome(id, segment) {
  if (id && !['mine','case'].includes(id)) return centerPage(id);
  return workbenchPage(id === 'mine' ? 'mine' : 'all',segment);
}

function deskHome(id,segment) {
  return id ? executionDeskPage(id,segment) : workbenchPage();
}

function workCaseLink(task,label,primary = false) {
  return '<a class="button' + (primary ? ' primary' : '') + '" href="#cases/' + encodeURIComponent(task.id) +
    '">' + icon('file') + esc(label) + '</a>';
}

function workNextAction(task) {
  const stage = stageOf(task);
  const blockers = unresolved(task);
  if (blockers.length && (!task.flow || stage === 'dispatch')) {
    return '<div class="work-next"><h3>等待前置</h3><ul class="work-blockers">' + blockers.map(id => {
      const item = get(id);
      return item ? '<li><a href="#' + workCaseRoute(item) + '">' + esc(item.title) + ' ' + icon('next') + '</a>' +
        badge(item) + '</li>' : '<li>缺少前置案卷 ' + esc(id) + '</li>';
    }).join('') + '</ul></div>';
  }
  if (task.flow) {
    if (stage === 'done') {
      return '<div class="work-next"><h3>验收与抽验已完成</h3>' + workCaseLink(task,'查验收记录') + '</div>';
    }
    const action = {council:'查看票拟', draft:'查看题本', review:'进入门下复核', approval:'审阅并批示',
      dispatch:'核授权后派办', execute:'查看办理要求', verify:'查看交付并验收', post:'进入台院抽验'}[stage];
    return '<div class="work-next"><h3>下一步</h3>' + workCaseLink(task,action || '打开案卷',true) + '</div>';
  }
  if (stage === 'review') {
    return '<div class="work-next"><h3>核对交付</h3><div class="work-delivery">' +
      (task.evidence ? '<strong>' + icon('file') + esc(task.evidence) + '</strong>' : '') +
      '<p>' + esc(task.check) + '</p>' + countyEvidencePreview(task) + '</div>' + ordinaryOperation(task,true) + '</div>';
  }
  if (['done','archived'].includes(stage)) {
    const next = state.tasks.filter(item => item.stage === 'idle' && item.needs.includes(task.id) && !unresolved(item).length);
    return '<div class="work-next"><h3>' + (stage === 'archived' ? '已归档' : '已验收') + '</h3>' +
      (next.length ? '<ul class="work-blockers">' + next.map(item => '<li>' +
        link('继续办理' + item.title,workCaseRoute(item),'next') + '</li>').join('') + '</ul>' :
        workCaseLink(task,'查成果与记录')) + '</div>';
  }
  return '<div class="work-next"><h3>下一步</h3>' + ordinaryOperation(task,true) + '</div>';
}

function workReferences(task) {
  const actor = centerOfficer(task);
  const officeName = actor.split(/[／/]/)[0].trim();
  const office = courtOffices.find(item => item.name === officeName || (actor === '用户' && item.key === 'throne'));
  const profile = workspaceById(task.workspaceId);
  const refs = [
    ['原案卷','cases/' + task.id,'file'],['版图定位',countyLocation(task),'map'],
    ...(office ? [['进入' + office.name,'court/' + office.key,'court']] : []),
    ...(profile ? [['工作区规则','jurisdiction/workspace/' + profile.id + '/' + task.id,'book']] : []),
    ['执行演示','desk/case/' + task.id,'activity']
  ];
  return '<details class="work-references"><summary>案卷、版图与记录</summary><div>' +
    refs.map(items => link(...items)).join('') + '</div></details>';
}

function renderWorkCase(task) {
  if (!task) return '<section id="work-case" class="work-case work-no-case" aria-label="当前案卷">' +
    '<p>没有需要你处理的案卷。</p>' + link('查看全部业务','center','list') + '</section>';
  const version = task.flow ? '<div><dt>案卷版本</dt><dd>第 ' + task.flow.version + ' 版</dd></div>' : '';
  return '<section id="work-case" class="work-case" aria-labelledby="work-case-title" data-case-id="' + esc(task.id) + '">' +
    '<div class="work-case-card"><header class="work-case-header"><div><p class="work-case-location">' +
    esc(region(task)) + '<span>' + esc(task.id) + '</span></p><h2 tabindex="-1" id="work-case-title">' + esc(task.title) +
    '</h2></div>' + badge(task) + '</header><dl class="work-case-facts"><div><dt>当前经手</dt><dd>' +
    esc(centerOfficer(task)) + '</dd></div>' + version + '</dl>' +
    workNextAction(task) + '<button class="text-link work-back-to-tree" type="button" data-action="work-tree-back">' +
    icon('list') + '返回业务树</button></div></section>';
}

function workbenchPage(mode = 'all', caseId = '') {
  const pending = workMyTasks(state.tasks);
  const tasks = mode === 'mine' ? pending : state.tasks;
  const explicit = caseId ? get(caseId) : undefined;
  const remembered = tasks.find(task => task.id === state.workSelected);
  const selected = explicit || remembered || pending[0] || tasks[0];
  if (caseId && !explicit) {
    return head('未找到案卷') + '<section class="sheet"><p>无法打开案号 ' + esc(caseId) +
      '。</p>' + link('返回业务树','center','list') + '</section>';
  }
  if (selected) state.workSelected = selected.id;
  return '<div class="workbench">' + head('中枢') + '<div class="workbench-grid">' +
    renderWorkCase(selected) + renderWorkTree(tasks,selected,mode,pending.length) +
    (selected ? '<div class="work-case-followup">' + renderWorkProcess(selected) + workReferences(selected) + '</div>' : '') +
    '</div></div>';
}

function focusWorkCase() {
  const heading = document.getElementById('work-case-title');
  if (!heading) return;
  heading.focus({preventScroll:true});
  const bounds = heading.getBoundingClientRect();
  if (matchMedia('(max-width: 850px)').matches || bounds.top < 0 || bounds.bottom > innerHeight) heading.scrollIntoView({block:'start'});
}

function revealWorkTreeSelection() {
  const list = document.querySelector('.work-tree-items');
  const selected = list?.querySelector('.work-tree-leaf[aria-current="location"]');
  if (!selected || list.scrollHeight <= list.clientHeight) return;
  const row = selected.getBoundingClientRect();
  const viewport = list.getBoundingClientRect();
  if (row.top < viewport.top) list.scrollTop += row.top - viewport.top;
  else if (row.bottom > viewport.bottom) list.scrollTop += row.bottom - viewport.bottom;
}

function focusWorkTree() {
  const target = document.querySelector('#work-tree .work-tree-leaf[aria-current="location"]') ||
    document.querySelector('#work-tree a[aria-current="page"]');
  target?.focus({preventScroll:true});
  target?.scrollIntoView({block:'nearest'});
}
