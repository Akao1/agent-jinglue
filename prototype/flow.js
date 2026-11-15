'use strict';

const formalSteps = [
  {key:'intake', label:'受理', actor:'经略受理', description:'登记事项和路由。'},
  {key:'council', label:'内阁票拟', actor:'内阁', description:'确定主办、会签、范围与是否请批。'},
  {key:'draft', label:'中书题本', actor:'中书省', description:'预拟交付条件和允许动作。'},
  {key:'review', label:'门下复核', actor:'门下省', description:'核对范围与证据。可放行，也可封驳。'},
  {key:'approval', label:'用户朱批', actor:'用户', description:'由用户明确同意当前版本和范围。'},
  {key:'dispatch', label:'尚书派办', actor:'尚书省', description:'复核授权后派给责任部。'},
  {key:'execute', label:'六部执行', actor:'责任部', description:'在授权范围内办理并提交证据。'},
  {key:'verify', label:'交付验收', actor:'刑部', description:'对照验收条件核对交付与证据。'},
  {key:'post', label:'台院抽验', actor:'台院', description:'抽查已验收的交付和记录。'},
];

const formalLabels = {
  council:['待票拟','active','file'], draft:['待题本','active','file'], review:['待门下复核','active','file'],
  approval:['待朱批','pending','lock'], dispatch:['待派办','active','file'], execute:['办理中','active','pin'],
  verify:['待验收','active','file'], post:['待抽验','active','watch'], done:['领地','done','check'],
};

const forward = {
  council:['draft','内阁','提交票拟'],
  draft:['review','中书省','提交预拟题本'],
  review:['approval','门下省','复核放行'],
  approval:['dispatch','用户 席位（演示操作者）','明确批准'],
  dispatch:['execute','尚书省','核授权后派发'],
  execute:['verify','责任部','提交演示交付'],
  verify:['post','演示操作者','验收通过'],
  post:['done','台院','提交抽验结果'],
};

const scopeFor = task => task.scope || ['准备「' + task.title + '」的演示交付材料','在演示工作区登记结果'];

function createFlow(sample = false) {
  const events = [{actor:'经略受理', label:'登记正式事项', version:1, at:null}];
  if (sample) events.push(
    {actor:'内阁', label:'已提交示例票拟', version:1, at:null},
    {actor:'中书省', label:'题本已预拟', version:1, at:null},
    {actor:'门下省', label:'已复核，提请用户决定', version:1, at:null},
  );
  return {stage:sample ? 'approval' : 'council', version:1, events, approval:null};
}

function advanceFormal(task, action, reason, now = new Date().toISOString()) {
  const flow = task?.flow;
  if (!flow) return false;
  if (action === 'veto' || action === 'return') {
    const expected = action === 'veto' ? 'review' : 'approval';
    if (flow.stage !== expected || !reason.trim()) return false;
    flow.events.push({actor:action === 'veto' ? '门下省' : '用户 席位（演示操作者）',
      label:action === 'veto' ? '封驳退回' : '用户退回', reason:reason.trim(), version:flow.version, at:now});
    flow.version += 1;
    flow.stage = 'council';
    flow.approval = null;
    return true;
  }
  if (action !== flow.stage || !forward[action]) return false;
  if (action === 'dispatch' && task.needs.length && unresolved(task).length) return false;
  const [next, seat, label] = forward[action];
  const actor = action === 'execute' ? task.owner : seat;
  if (['dispatch','execute','verify','post'].includes(action) &&
      (!flow.approval || flow.approval.version !== flow.version || flow.approval.task !== task.id ||
       JSON.stringify(flow.approval.scope) !== JSON.stringify(scopeFor(task)))) return false;
  if (action === 'approval') {
    flow.approval = {actor, version:flow.version, scope:[...scopeFor(task)], task:task.id, at:now};
  }
  flow.stage = next;
  flow.events.push({actor, label, version:flow.version, at:now});
  return true;
}

function formalRail(task, full = false) {
  const current = task.flow.stage;
  const active = current === 'done' ? formalSteps.length : formalSteps.findIndex(step => step.key === current);
  return '<section class="flow-band" aria-label="正式案卷流转"><header><h2>案卷流转</h2><small>' + esc(task.id) + ' / 票拟第 ' + task.flow.version + ' 版</small></header>' +
    '<ol class="flow-steps">' + formalSteps.map((step,i) => '<li class="' + (i < active ? 'past' : i === active ? 'now' : '') + '"' +
      (i === active ? ' aria-current="step"' : '') + (full ? ' title="' + step.description + '"' : '') + '><span aria-hidden="true">' + String(i + 1).padStart(2,'0') + '</span>' + step.label + '</li>').join('') + '</ol></section>';
}

function formalDetail(task, inCase) {
  const flow = task.flow;
  const assigned = {approval:'用户', dispatch:'尚书省', execute:task.owner, verify:'刑部／交付验收', post:'台院', done:'已抽验'}[flow.stage]
    || formalSteps.find(step => step.key === flow.stage)?.actor || '经略受理';
  const approved = flow.approval;
  const cosign = task.cosign?.filter(department => department !== task.owner) || [];
  return '<aside class="inspector" aria-label="案卷摘要"><p class="kicker">' + esc(region(task)) + '</p><h2>' + esc(task.title) + '</h2>' +
    '<div class="inline">' + badge(task) + '<span class="id">' + task.id + '</span></div>' +
    '<dl class="detail"><div><dt>当前经手</dt><dd>' + esc(assigned) + '</dd></div><div><dt>主办</dt><dd>' + esc(task.owner) + '主办</dd></div>' +
    '<div><dt>会签记录</dt><dd>' + esc(cosign.length ? cosign.join('、') + '（演示）' : '未列明') + '</dd></div>' +
    taskWorkspaceField(task) + '<div><dt>事项范围</dt><dd>' + esc(task.formalKind || '正式事项演练') + '</dd></div></dl>' +
    '<div class="docket-sign"><div><strong>' + (approved ? '用户 席位已模拟批示' : '尚未批示') + '</strong><small>' +
    (approved ? '第 ' + approved.version + ' 版 / 限本案卷' : '批示权属 用户') + '</small></div><span class="stamp' + (approved ? '' : ' missing') + '">' + (approved ? '朱批' : '待批') + '</span></div>' +
    '<div class="actions">' + (inCase ? link('在版图定位',countyLocation(task),'map') : '<a class="button primary" href="#cases/' + task.id + '">' +
      (flow.stage === 'approval' ? '查看待批案卷' : '打开案卷') + icon('next') + '</a>') + '</div></aside>';
}

function formalOperation(task) {
  const {stage} = task.flow;
  if (stage === 'dispatch' && unresolved(task).length) {
    const id = unresolved(task)[0];
    return '<p class="notice">前置任务尚未验收。</p>' + link('查看前置任务','cases/' + id);
  }
  if (stage === 'done') return '<p class="notice ok">已完成演示交付和抽验，地块已纳入领地。</p>';
  if (!state.connected && ['council','draft','review','dispatch','execute','post'].includes(stage)) {
    return '<p class="notice">当前关卡需要一个执行者。</p>' + link('配置演示 API','settings/' + task.id);
  }
  const names = {council:'模拟内阁票拟',draft:'模拟中书预拟题本',review:'模拟门下放行',approval:'模拟朱批',dispatch:'模拟尚书派办',
    execute:'提交演示交付',verify:'确认交付验收',post:'模拟台院抽验'};
  const delivery = formalDeliveryBody(task);
  if (stage === 'verify' && !delivery) {
    return '<p class="notice">当前版未附可核对的交付正文。</p>' + formalDeliveryField() +
      '<div class="actions">' + button('保存交付材料','save-formal-delivery',task.id,true,'file') + '</div>';
  }
  const material = reviewNeedsPacket(stage) ? reviewMaterialStamp(task) : '';
  const blocked = reviewNeedsPacket(stage) && !material;
  const primary = blocked ? '' : '<button type="button" class="button primary' + (stage === 'approval' ? ' red' : '') + '" data-action="formal" data-key="' +
    task.id + '" data-step="' + stage + '" data-material="' + esc(material) + '">' + icon(stage === 'approval' ? 'check' : 'next') + names[stage] + '</button>';
  const mayReturn = stage === 'approval' || stage === 'review';
  const sendBack = '<button type="button" class="button" data-action="formal" data-key="' + task.id + '" data-step="' +
    (stage === 'review' ? 'veto' : 'return') + '">' + (stage === 'review' ? '模拟封驳' : '不批，退回') + '</button>';
  return (blocked ? '<p class="notice">本版材料未齐，暂不能' + (stage === 'approval' ? '批示' : '通过此关') + '。</p>' : '') +
    (stage === 'execute' ? formalDeliveryField() : '') +
    (mayReturn ? '<label class="field reason">退回理由<input name="formal-reason" maxlength="180" placeholder="退回或封驳时必填"></label>' : '') +
    '<div class="actions">' + primary + (mayReturn ? sendBack : '') + '</div>';
}

function formalCase(task) {
  const flow = task.flow;
  const approved = flow.approval;
  const current = formalSteps.find(step => step.key === flow.stage);
  const description = current?.description || (flow.stage === 'post' ? '台院核对已验收交付和依据。' : '本次演练完成。');
  const seen = role => flow.events.some(event => event.version === flow.version && event.actor === role && !event.reason);
  const menu = [
    ['内阁票拟',seen('内阁') ? '已拟议 / 演示模型' : '待拟议'],
    ['门下复核',seen('门下省') ? '已放行 / 同一演示模型' : '待复核'],
    ['用户朱批',approved ? '用户 席位 / 演示批准' : '尚未批示'],
  ];
  const reviewed = approved?.reviewedMaterial;
  const packet = reviewed || reviewPacket(task);
  const decisionScope = approved?.scope || scopeFor(task);
  const delivery = formalDeliveryBody(task);
  const preview = ['verify','post','done'].includes(flow.stage) && delivery ?
    '<section class="sheet review-delivered"><h2>本版交付正文</h2>' + reviewParagraphs(delivery) + '</section>' : '';
  const records = formalRail(task,true) + '<section class="sheet"><h2>拟议与办理记录</h2><p>' + esc(task.note) + '</p>' +
    '<div class="case-authorities">' + menu.map(([role,value]) => '<article><h3>' + role + '</h3><p>' + value + '</p></article>').join('') + '</div>' +
    '<details class="case-proof"><summary>查看办理记录与审批依据</summary><ul class="entries">' +
    [...flow.events].reverse().map(event => '<li><span>' + esc(event.actor + ' / ' + event.label + (event.reason ? ' / ' + event.reason : '')) + '</span><span class="id">第 ' + event.version + ' 版</span>' +
      '<time>' + (event.at ? new Date(event.at).toLocaleString('zh-CN',{hour12:false}) : '预置样本') + '</time></li>').join('') + '</ul></details></section>';
  return head(task.title) + '<nav class="breadcrumbs" aria-label="案卷位置">' + link('全部案卷','search','file') + icon('next') +
    '<span aria-current="page">' + esc(task.id) + '</span>' + link('在业务树定位',workCaseRoute(task),'list') + '</nav>' +
    '<div class="workspace review-case"><div class="review-materials">' + renderFormalMaterials(task,packet) + preview + '</div>' +
    '<aside class="review-side" aria-label="审批与归属"><section class="sheet docket-decision" aria-labelledby="docket-decision-title">' +
    '<div class="docket-heading"><h2 id="docket-decision-title">当前办理</h2>' + badge(task) + '</div>' +
    '<p>' + esc(flow.stage === 'approval' ? '批示权属 用户' : description) + '</p>' +
    '<h3>' + (approved ? '本版授权范围' : '本版拟授权范围') + '</h3><ul class="scope-items">' +
    decisionScope.map(item => '<li>' + esc(item) + '</li>').join('') + '</ul>' +
    (packet ? '<h3>批准后会发生什么</h3><p>' + esc((reviewed || packet).effect) + '</p>' : '') +
    '<h3>交付验收条件</h3><p>' + esc(task.check) + '</p>' + formalOperation(task) +
    (reviewed ? '<p class="signed">已记录第 ' + reviewed.version + ' 版送审材料与批准范围。</p>' :
      approved ? '<p class="signed">旧批示已保留，当时未记录材料快照。</p>' : '') + '</section>' +
    '<details class="review-reference"><summary>案卷归属与版图</summary>' + formalDetail(task,true) + '</details>' +
    '</aside><div class="review-records">' + records + '</div></div>';
}
