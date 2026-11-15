'use strict';

const centerOffices = [
  ['council', '内阁', '议事与票拟', ['council']],
  ['draft', '中书省', '预拟题本', ['draft']],
  ['review', '门下省', '复核与封驳', ['review']],
  ['dispatch', '尚书省', '核授权并派办', ['dispatch']],
];

const centerDepartments = [
  ['吏部', '流程与人员'], ['户部', '资料与证据'], ['礼部', '文稿与交付'],
  ['兵部', '实施与推进'], ['刑部', '质量与核验'], ['工部', '工具与运行'],
];

function centerQueues() {
  const pending = state.tasks.filter(task => !['done','archived'].includes(stageOf(task)));
  const approvals = pending.filter(task => task.flow && stageOf(task) === 'approval');
  const oversight = pending.filter(task => ['independent','post'].includes(stageOf(task)));
  const priority = {dispatch:0,council:1,draft:2,review:3,verify:3,execute:4,active:4,idle:5};
  const rank = task => status(task)[1] === 'blocked' ? 6 : (priority[stageOf(task)] ?? 7);
  const work = pending.filter(task => !approvals.includes(task) && !oversight.includes(task))
    .sort((a,b) => rank(a) - rank(b));
  const classification = state.tasks.find(task => task.id === 'YL-011');
  return {pending, approvals, oversight, work, classification: !state.decision && classification};
}

function centerOfficer(task) {
  const stage = stageOf(task);
  if (stage === 'approval') return '用户';
  if (stage === 'post') return '台院';
  if (stage === 'verify') return '刑部／交付验收';
  if (stage === 'idle') return '待接手';
  const office = task.flow && formalSteps.find(step => step.key === stage);
  return office && stage !== 'execute' ? office.actor : (task.owner || '待接手');
}

function centerRow(task) {
  return '<li><a class="center-row" href="#cases/' + encodeURIComponent(task.id) + '"><span class="center-row-main"><strong>' +
    esc(task.title) + '</strong><small>' + esc(region(task)) + '<span class="center-meta-separator">/</span>' + esc(task.id) +
    '</small></span><span class="center-row-owner"><strong>' + esc(centerOfficer(task)) + '</strong><small>' +
    (task.flow ? '正式事项' : '普通办理') + '</small></span><span class="center-row-status">' + badge(task) +
    '</span></a></li>';
}

function centerCandidate(task) {
  return '<li><a class="center-row" href="#audit"><span class="center-row-main"><strong>归类建议</strong><small>' +
    esc(task.title) + '<span class="center-meta-separator">/</span>' + esc(task.id) +
    '</small></span><span class="center-row-owner"><strong>察院</strong><small>巡按发现</small></span>' +
    '<span class="center-row-status"><span class="badge pending">待确认</span></span></a></li>';
}

function centerQueue({title, tasks, candidate, footer, empty = '当前没有待处理案卷。'}) {
  const rows = tasks.map(centerRow).join('') + (candidate ? centerCandidate(candidate) : '');
  return '<section class="center-panel center-queue" aria-label="' + esc(title) + '"><header class="center-panel-head"><h2>' +
    esc(title) + '</h2><span>' + tasks.length + ' 案卷' + (candidate ? ' + 1 建议' : '') + '</span></header>' +
    (rows ? '<ul class="center-rows">' + rows + '</ul>' : '<p class="center-empty">' + esc(empty) + '</p>') +
    (footer ? '<div class="center-queue-foot">' + link(...footer) + '</div>' : '') + '</section>';
}

function centerApprovalDesk(approvals) {
  const task = approvals[0];
  if (!task) {
    return '<section class="center-decree center-decree-clear" aria-label="待你批示">' + icon('check') +
      '<span>当前没有待你批示的案卷。</span>' + link('查看御前','court/throne','court') + '</section>';
  }
  return '<section class="center-decree" aria-labelledby="center-decree-title">' +
    '<div class="decree-image" aria-hidden="true"></div><div class="decree-content">' +
    '<h2 id="center-decree-title"><span aria-hidden="true">批</span>待你批示 <b>' + approvals.length + '</b></h2>' +
    '<div><p class="decree-case-title">' + esc(task.title) + '</p>' +
    '<p class="decree-case-meta">' + esc(region(task)) + '　' + esc(task.id) + '</p></div>' +
    '<a class="button red" href="#cases/' + encodeURIComponent(task.id) + '">审阅拟议' + icon('next') + '</a>' +
    '</div><a class="decree-office" href="#court/throne" aria-label="进入御前">' + icon('court') + '御前' + icon('next') + '</a></section>';
}

function centerFilters(current, queues) {
  const items = [['', '总览', queues.pending.length],
    ['approvals','待朱批',queues.approvals.length], ['work','经办',queues.work.length],
    ['audit','监察与复核',queues.oversight.length]];
  return '<nav class="center-filter" aria-label="中枢队列">' + items.map(([key,name,count]) =>
    '<a href="#center' + (key ? '/' + key : '') + '"' + (current === key ? ' aria-current="page"' : '') +
    '><span>' + name + '</span><b>' + count + '</b></a>').join('') + '</nav>';
}

function centerDeptTasks(tasks, department) {
  return tasks.filter(task => task.owner === department &&
    (task.flow ? stageOf(task) === 'execute' : ['active','review'].includes(stageOf(task))));
}

function centerServices() {
  const rows = [
    ['court','治所与规则','查省治、府治和工作区规则','jurisdiction','查看名录'],
    ['watch','御史巡按',state.findings.length ? state.findings.length + ' 件待独立核证' : '察院上报 / 大理寺核证 / 台院复验',
      state.findings.length ? 'audit/verification' : 'audit','查看监察'],
    ['week','综合周报',state.report ? '演示周报已归档' : '本期尚未生成','weekly','打开周报'],
    ['settings','执行者',state.connected ? '一个演示 API 已连接' : '待连接演示 API','settings','查看设置'],
  ];
  return '<section class="center-panel center-services" aria-label="中枢入口">' + rows.map(([symbol,name,detail,target,action]) =>
    '<a class="center-service" href="#' + target + '" aria-label="' + name + '，' + action + '"><span class="center-service-icon">' +
    icon(symbol) + '</span><span><strong>' + name + '</strong><small>' + detail + '</small></span>' + icon('next') + '</a>').join('') +
    '</section>';
}

function centerQueueFor(filter, queues) {
  if (filter === 'approvals') return centerQueue({title:'待你朱批',tasks:queues.approvals,empty:'当前没有待朱批案卷。'});
  if (filter === 'work') return centerQueue({title:'经办案卷',tasks:queues.work});
  if (filter === 'audit') return centerQueue({title:'监察与复核',tasks:queues.oversight,candidate:queues.classification,
    footer:['打开御史巡按','audit','watch']});
  const office = centerOffices.find(([key]) => filter === 'office-' + key);
  if (office) return centerQueue({title:office[1] + '待办',tasks:queues.work.filter(task => task.flow && office[3].includes(stageOf(task))),
    footer:['查看全部经办','center/work','list']});
  const department = centerDepartments.find((_,index) => filter === 'dept-' + index);
  if (department) return centerQueue({title:department[0] + '经办',tasks:centerDeptTasks(queues.work,department[0]),
    footer:['查看全部经办','center/work','list']});
  return centerQueue({title:'经办案卷',tasks:queues.work.slice(0,4),
    footer:queues.work.length > 4 ? ['查看全部 ' + queues.work.length + ' 项','center/work','list'] : null}) +
    centerQueue({title:'监察与复核',tasks:queues.oversight.slice(0,2),candidate:queues.classification,
      footer:queues.oversight.length > 2 ? ['查看全部监察与复核','center/audit','watch'] : null});
}

function centerPage(filter = '') {
  const queues = centerQueues();
  const office = filter && courtOffices.find(entry => entry.actionRoute === 'center/' + filter && entry.key !== 'throne');
  if (office) {
    return head(office.name + '经办','京城衙署') + '<nav class="office-queue-nav" aria-label="官署导航">' +
      link('返回' + office.name,'court/' + office.key,'court') + link('返回中枢','center','center') + '</nav>' +
      '<div class="center-shell"><div class="center-main">' + centerQueueFor(filter,queues) + '</div><aside class="center-side">' +
      '<section class="sheet"><h2>职责</h2><p>' + esc(office.mission) + '</p><p>' + esc(office.boundary) + '</p></section></aside></div>';
  }
  if (filter) {
    return head('经略中枢') + centerFilters(filter,queues) + '<div class="center-shell"><div class="center-main">' +
      centerQueueFor(filter,queues) + '</div><aside class="center-side">' + centerServices() + '</aside></div>';
  }
  return head('经略中枢') + centerApprovalDesk(queues.approvals) +
    '<div class="center-shell center-overview"><div class="center-main">' +
    centerFilters('',queues) + centerQueueFor('',queues) + '</div>' +
    '<aside class="center-side" aria-label="业务和衙署入口">' +
    '<a class="center-realm-link" href="#atlas"><span><strong>王朝版图</strong><small>按行省、府州查案卷</small></span>' + icon('next') + '</a>' +
    '<a class="center-court-link" href="#court">' + icon('court') + '<span><strong>京城衙署</strong><small>按官署职责找待办</small></span>' + icon('next') + '</a>' +
    centerServices() + link('使用导览','guide','file') + '</aside></div>';
}
