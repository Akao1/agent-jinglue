'use strict';

const seed = [
  {id:'YL-012', province:'video', title:'样片对外发布', stage:'formal', needs:['YL-001'], owner:'礼部',
    note:'准备样片的对外发布材料，先确认发布范围与验收依据。', check:'逐项核对发布清单与素材授权。',
    formalKind:'对外发布流程演练', cosign:['工部'], flow:createFlow(true)},
  {id:'YL-001', province:'video', title:'脚本验收', stage:'done', needs:[], owner:'礼部', note:'一页口播脚本', check:'脚本、口播时长与引用完整', evidence:'口播脚本.md'},
  {id:'YL-002', province:'video', title:'分镜定稿', stage:'review', needs:['YL-001'], owner:'礼部', note:'为样片整理分镜表，标出镜头顺序和拍摄要点。', check:'分镜顺序、镜头说明与素材出处齐全', evidence:'样片分镜表.md', shots:[
    {title:'开场字幕', source:'自制片头图形'},
    {title:'操作演示', source:'自摄操作素材'},
    {title:'收尾提示', source:'自制片尾字幕'},
  ]},
  {id:'YL-003', province:'video', title:'剪辑初版', stage:'idle', needs:['YL-002'], owner:'工部', note:'按已验收的分镜完成剪辑初版。', check:'成片顺序与分镜一致'},
  {id:'YL-004', province:'video', title:'素材清点', stage:'done', needs:[], owner:'户部', note:'登记素材来源与可用范围。', check:'可追溯到每项素材', evidence:'素材清单.md'},
  {id:'YL-005', province:'video', title:'成片交付', stage:'idle', needs:['YL-003'], owner:'礼部', note:'输出待发布成片与字幕。', check:'验收版成片与字幕齐全'},
  {id:'YL-006', province:'video', title:'参考片归档', stage:'archived', needs:[], owner:'户部', note:'保留审阅过的参考片记录。', check:'记录可追溯', evidence:'参考片记录.md'},
  {id:'YL-007', province:'work', title:'交付清单', stage:'active', needs:[], owner:'礼部', note:'核对材料与交付范围。', check:'每项材料均有负责人'},
  {id:'YL-008', province:'work', title:'交付复核', stage:'independent', needs:[], owner:'门下省', note:'受管交付等待独立复核。', check:'由合格的独立复核者核对原证据'},
  {id:'YL-009', province:'study', title:'整理错题', stage:'idle', needs:[], owner:'礼部', note:'把易错题归入对应章节。', check:'每道错题都附原因'},
  {id:'YL-010', province:'study', title:'章节练习', stage:'done', needs:[], owner:'刑部', note:'完成章节练习并核对答案。', check:'记录结果与复盘', evidence:'章节复盘.md'},
  {id:'YL-011', province:'work', title:'课程复盘', stage:'idle', needs:[], owner:'礼部', note:'复盘课程练习，标出需重做的题。', check:'错题与改进动作明确'},
];

const allSeed = [...seed,...expansion];
const app = document.querySelector('#app');
const announcement = document.querySelector('#announcement');
const cacheKey = 'jinglue-prototype-v081';

function readSavedState(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return Array.isArray(saved?.tasks) ? saved : null;
  } catch {
    return null;
  }
}

let state = readSavedState(cacheKey) || readSavedState('jinglue-prototype-v08') || readSavedState('jinglue-prototype-v07') || readSavedState('jinglue-prototype-v063') || readSavedState('jinglue-prototype-v062') || readSavedState('jinglue-prototype-v061') || readSavedState('jinglue-prototype-v06');
if (!state) {
  state = {tasks: allSeed, province:'video', district:'sample', selected:'', view:null, connected:false, decision:'', report:null, customProvinces:[]};
}
const demoSeeds = [...studyExamSeed,...workflowDemoCases()];
const savedIds = new Set(state.tasks.map(task => task.id));
state.tasks.push(...demoSeeds.filter(task => !savedIds.has(task.id)));
state.customProvinces.forEach(mountProvince);
const seedLocations = new Map([...allSeed,...demoSeeds].map(task => [task.id,task]));
for (const task of state.tasks) {
  if (Object.hasOwn(task,'workspaceId')) continue;
  const origin = seedLocations.get(task.id) || task;
  task.workspaceId = workspaceForDistrict(origin.province,districtKey(origin))?.id || null;
}
state.findings ??= [];
state.draft ??= null;
let query = '';
let realmQuery = {q:'',province:'',phase:''};
let timer;
const impactTypes = {local:'本区普通办理', publish:'对外发布', rule:'修改全局规则', irreversible:'不可逆操作', resource:'付费或开通资源'};
const pageNames = {desk:'办理台', demo:'状态样例', atlas:'王朝版图', center:'经略中枢', court:'京城衙署', guide:'使用导览', 'office-records':'官署档案', 'province-new':'开辟行省', search:'搜索案卷', jurisdiction:'工作区规则', cases:'办事', audit:'御史巡按', history:'国史馆', weekly:'综合周报', settings:'设置', new:'交办任务'};
const states = {done:['领地','done','check'], archived:['熟地','archived','box'], review:['待验收','active','file'], active:['办理中','active','pin'], independent:['待独立复核','active','lock'], blocked:['未接壤','blocked','lock'], idle:['可开拓','open','pin']};
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const icon = name => '<svg class="ico" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
const button = (label, action, key = '', primary = false, symbol = '') => '<button type="button" class="button' + (primary ? ' primary' : '') + '" data-action="' + action + '" data-key="' + esc(key) + '">' + (symbol ? icon(symbol) : '') + esc(label) + '</button>';
const link = (label, target, symbol = '') => '<a class="text-link" href="#' + target + '">' + (symbol ? icon(symbol) : '') + esc(label) + '</a>';
const get = id => state.tasks.find(task => task.id === id);
const region = caseRegion;
const stageOf = task => task?.flow?.stage || task?.stage;
const unresolved = task => task.needs.filter(id => !['done','archived'].includes(stageOf(get(id))));
const status = task => task.flow ? formalLabels[task.flow.stage] : states[task.stage === 'idle' && unresolved(task).length ? 'blocked' : task.stage];
const badge = task => '<span class="badge ' + status(task)[1] + '">' + icon(status(task)[2]) + status(task)[0] + '</span>';

function keep() {
  try { localStorage.setItem(cacheKey, JSON.stringify(state)); } catch {}
}

function note(message) {
  announcement.textContent = message;
  clearTimeout(timer);
  timer = setTimeout(() => { announcement.textContent = ''; }, 2800);
}

function route() {
  const [page,id,segment,caseId] = (location.hash.slice(1) || 'center').split('/');
  return {page:Object.hasOwn(pageNames,page) ? page : 'center',id,segment,caseId};
}

function head(title, context = '') {
  const scope = context ? '<p class="scope">' + esc(context) + '</p>' : '';
  return '<div class="page-head"><div class="page-title"><h1 tabindex="-1">' + esc(title) + '</h1>' + scope + '</div></div>';
}

function taskWorkspaceField(task) {
  const assigned = workspaceById(task.workspaceId);
  const content = assigned ? link(assigned.name,'jurisdiction/workspace/' + encodeURIComponent(assigned.id) + '/' + encodeURIComponent(task.id),'book') : '待绑定';
  return '<div><dt>所属工作区</dt><dd>' + content + '</dd></div>';
}

function detail(task, inCase = false) {
  if (!task) return '<aside class="inspector" aria-label="案卷摘要"><h2>选择一个地块</h2><p class="muted">这里会显示对应案卷与下一步。</p></aside>';
  if (task.flow) return formalDetail(task,inCase);
  const blocked = unresolved(task);
  const needs = task.needs.map(id => {
    const other = get(id);
    return other ? '<a class="text-link" href="#cases/' + id + '">' + esc(other.title) + '</a> ' + badge(other) : '';
  }).join('<br>') || '无前置';
  const next = task.stage === 'independent' ? '配置合格的独立复核者' : blocked.length ? '先完成' + get(blocked[0]).title : task.stage === 'review' ? '查看交付并验收' : task.stage === 'active' ? '继续办理' : task.stage === 'idle' ? '可开始办理' : '查看成果与记录';
  return '<aside class="inspector" aria-label="案卷摘要"><p class="kicker">' + esc(region(task)) + '</p><h2>' + esc(task.title) + '</h2>' +
    '<div class="inline">' + badge(task) + '<span class="id">' + task.id + '</span></div>' +
    '<dl class="detail"><div><dt>当前办理</dt><dd>' + esc(task.owner) + (task.stage === 'active' || task.stage === 'review' ? ' / 示例模型' : '') + '</dd></div>' +
    taskWorkspaceField(task) + '<div><dt>前置任务</dt><dd>' + needs + '</dd></div><div><dt>下一步</dt><dd>' + esc(next) + '</dd></div></dl>' +
    '<div class="actions">' + (inCase ? link('在版图定位',countyLocation(task),'map') : '<a class="button primary" href="#cases/' + task.id + '">打开案卷 ' + icon('next') + '</a>') + '</div></aside>';
}

function atlas(key,district,caseId) {
  const direct = get(key);
  if (direct) return countyAtlas(direct.province,districtKey(direct),direct);
  if (!Object.hasOwn(provinces,key)) return realmOverview();
  if (!Object.hasOwn(districts[key],district)) return provinceOverview(key);
  const selected = caseId && get(caseId);
  return countyAtlas(key,district,selected?.province === key && districtKey(selected) === district ? selected : undefined);
}

function searchPage() {
  const choices = (values, current) => Object.entries(values).map(([key,name]) =>
    '<option value="' + esc(key) + '"' + (key === current ? ' selected' : '') + '>' + esc(name) + '</option>').join('');
  const scopes = {'':'全部行省',...Object.fromEntries(Object.entries(provinces).map(([key,value]) => [key,value.name + '省']))};
  const phases = {'':'全部状态',approval:'待朱批',handling:'在办',waiting:'待开工',settled:'领地',archived:'熟地'};
  const found = state.tasks.filter(task => {
    const stage = stageOf(task);
    const phase = stage === 'archived' ? 'archived' : stage === 'done' ? 'settled' : stage === 'approval' ? 'approval' :
      stage === 'idle' ? 'waiting' : 'handling';
    const fields = [task.id,task.title,region(task),task.owner,task.evidence || '',status(task)[0]];
    return (!realmQuery.province || task.province === realmQuery.province) &&
      (!realmQuery.phase || phase === realmQuery.phase) &&
      (!realmQuery.q || fields.join(' ').toLowerCase().includes(realmQuery.q.toLowerCase()));
  });
  const rows = found.map(task => '<li><span class="search-case"><strong>' + link(task.title,'cases/' + task.id) + '</strong><small>' +
    esc(region(task)) + ' / ' + esc(task.id) + '</small></span>' + badge(task) + link('版图定位',countyLocation(task),'map') + '</li>').join('');
  return head('搜索案卷') + '<nav class="breadcrumbs" aria-label="版图路径">' + link('王朝总图','atlas','map') + '</nav>' +
    '<section class="sheet"><form class="realm-search-form" id="realm-search-form"><label class="field">名称或案号<input type="search" name="q" placeholder="例如 YL-012" value="' + esc(realmQuery.q) +
    '"></label><label class="field">行省<select aria-label="行省" name="province">' + choices(scopes,realmQuery.province) + '</select></label><label class="field">状态<select name="phase">' + choices(phases,realmQuery.phase) +
    '</select></label><button class="button primary" type="submit">' + icon('search') + '搜索</button></form>' +
    '<div class="search-result-head"><h2>案卷</h2><span>' + found.length + ' 项</span></div>' +
    (rows ? '<ul class="entries realm-results">' + rows + '</ul>' : '<p class="empty">当前筛选没有匹配案卷。</p>') + '</section>';
}

function canAcceptOrdinary(task) {
  return task?.stage === 'review' && typeof task.evidence === 'string' && task.evidence.trim() && hasOrdinaryMaterial(task) && !unresolved(task).length;
}

function ordinaryOperation(task, inline = false) {
  const prior = unresolved(task);
  let operation = '';
  if (task.stage === 'independent') {
    operation = '<p class="notice">当前演示只有一个执行者，独立复核尚未通过。</p>' + link('查看执行者设置','settings');
  } else if (prior.length) {
    operation = '<p class="notice">前置待验收。' + (get(prior[0]) ? link('查看' + get(prior[0]).title,'cases/' + prior[0]) : '缺少案卷 ' + esc(prior[0])) + '</p>';
  } else if (task.stage === 'review') {
    operation = canAcceptOrdinary(task) ? '<div class="actions">' + button('验收通过','accept',task.id,true,'check') + '</div>' :
      ordinaryDeliveryEditor(task,'save-delivery');
  } else if (task.stage === 'active' && state.connected) {
    operation = ordinaryDeliveryEditor(task);
  } else if (task.stage === 'idle' || task.stage === 'active') {
    operation = '<div class="actions">' + (state.connected ? button('开始办理','begin',task.id,true) :
      inline ? button('启用演示 API','connect',task.id,true,'settings') : link('先连接一个演示 API','settings/' + task.id)) + '</div>';
  } else {
    operation = '<p class="notice ok">' + (task.stage === 'done' ? '已验收，地块已纳入领地。' : '已归档，可从县志查回。') + '</p>';
  }
  return operation;
}

function cases(id) {
  if (!id) return searchPage();
  const task = get(id);
  if (id && !task) return head('未找到案卷') + '<section class="sheet"><p>当前演示工作区无法打开案号 ' + esc(id) +
    '。</p><div class="actions">' + link('搜索案卷','search','search') + link('返回中枢','center','center') + '</div></section>';
  state.selected = task.id;
  if (task.flow) return formalCase(task);
  return head(task.title) + '<nav class="breadcrumbs" aria-label="案卷位置">' + link('全部案卷','search','file') + icon('next') +
    '<span aria-current="page">' + esc(task.id) + '</span>' + link('在业务树定位',workCaseRoute(task),'list') +
    '</nav><div class="workspace"><section class="sheet"><h2>交付与办理</h2><div class="conversation"><p class="speaker">交办</p><p>' + esc(task.note) + '</p></div><h3>验收条件</h3><p>' + esc(task.check) + '</p>' +
    (task.evidence ? '<h3>交付物</h3><p class="inline">' + icon('file') + esc(task.evidence) + '</p>' + countyEvidencePreview(task) : '') + '<h3>当前操作</h3>' + ordinaryOperation(task) + '</section>' + detail(task,true) + '</div>';
}

function districtOptions(province, selected) {
  return Object.entries(districts[province] || {}).map(([key,name]) =>
    '<option value="' + esc(key) + '"' + (key === selected ? ' selected' : '') + '>' + esc(name) + '</option>').join('');
}

function provinceForm() {
  return head('开辟行省') + '<section class="sheet province-form"><form class="form" id="province-form"><label class="field">行省名称<input name="name" maxlength="16" required></label>' +
    '<label class="field">首个府州<input name="districtName" maxlength="18" required></label>' +
    '<p class="notice" id="province-error" role="alert" hidden></p><div class="actions"><button class="button primary" type="submit">' + icon('plus') + '创建行省</button>' + link('返回总图','atlas') + '</div></form></section>';
}

function storeDraft(form) {
  if (form?.id !== 'task-form') return;
  const names = ['title','province','district','impact','route','check'];
  state.draft = Object.fromEntries(names.map(name => [name,form.elements[name].value]));
  keep();
}

function formPage() {
  const draft = state.draft || {};
  const province = Object.hasOwn(provinces,draft.province) ? draft.province : state.province;
  const districtChoices = districts[province] || {};
  const requestedDistrict = draft.district || state.district;
  const district = Object.hasOwn(districtChoices,requestedDistrict) ? requestedDistrict : Object.keys(districtChoices)[0];
  const assigned = workspaceForDistrict(province,district);
  const impact = Object.hasOwn(impactTypes,draft.impact) ? draft.impact : 'local';
  const needsApproval = impact !== 'local';
  const formal = needsApproval || draft.route === 'formal';
  const chosen = (a,b) => a === b ? ' selected' : '';
  const impacts = Object.entries(impactTypes).map(([value,label]) => '<option value="' + value + '"' + chosen(value,impact) + '>' + label + '</option>').join('');
  const provincesList = Object.entries(provinces).map(([key,value]) => '<option value="' + esc(key) + '"' + chosen(key,province) + '>' + esc(value.name) + '</option>').join('');
  return head('交办任务') + '<div class="workspace"><section class="sheet"><h2>告诉经略要完成什么</h2>' +
    (!state.connected ? '<div class="notice inline-connect"><span>填写要求后，可就地启用演示 API。</span>' + button('启用演示 API','connect-inline','',true) + '</div>' : '') +
    '<form class="form" id="task-form"><label class="field">任务名称<input name="title" value="' + esc(draft.title) + '" placeholder="例如：整理本周错题" maxlength="36" required></label>' +
    '<div class="form-grid"><label class="field">行省<select aria-label="行省" name="province">' + provincesList + '</select></label>' +
    '<label class="field">府州<select aria-label="府州" name="district">' + districtOptions(province,district) + '</select></label></div>' +
    '<label class="field">涉及动作<select aria-label="涉及动作" name="impact">' + impacts + '</select></label>' +
    '<label class="field">办理类型<select aria-label="办理类型" name="route"' + (needsApproval ? ' disabled' : '') + '><option value="quick"' + chosen(false,formal) +
    '>普通任务</option><option value="formal"' + chosen(true,formal) + '>正式事项，须朱批</option></select></label>' +
    '<p class="notice" id="impact-hint"' + (needsApproval ? '' : ' hidden') + '>所选动作须走正式流转，由用户朱批。</p>' +
    '<label class="field">交付要求<textarea name="check" placeholder="写下可以验收的成果" maxlength="180" required>' + esc(draft.check) + '</textarea></label>' +
    '<div class="actions"><button class="button primary" type="submit"' + (state.connected ? '' : ' disabled') + '>' + icon('plus') + '创建案卷</button></div></form></section>' +
    '<aside class="sheet"><h2>执行安排</h2><dl class="detail"><div><dt>全局默认</dt><dd>' + (state.connected ? '示例模型 API' : '待配置') + '</dd></div><div><dt>所属工作区</dt><dd id="task-workspace">' +
    esc(assigned?.name || '待绑定') + '</dd></div></dl></aside></div>';
}

function settings(context) {
  const task = get(context);
  const returnPath = task ? link('返回原案','cases/' + task.id,'file') : '';
  return head('设置') + '<div class="workspace"><section class="sheet"><h2>执行者</h2><h3>模型 API</h3>' +
    (state.connected ? '<p class="notice ok">示例模型已设为全局默认，可办理演示任务。</p><div class="actions"><a class="button primary" href="#new">交办任务</a>' + button('断开演示连接','disconnect') + returnPath + '</div>' :
      '<p>连接一个示例模型，体验从交办到验收。这里无需填写真实密钥。</p><div class="actions">' + button('启用演示 API','connect','',true) + '</div>') +
    '</section><aside class="sheet"><h2>工作区</h2><dl class="detail"><div><dt>当前范围</dt><dd>演示工作区</dd></div><div><dt>熟地归档期限</dt><dd>验收后 7 天</dd></div><div><dt>其他执行者</dt><dd>首轮只演示单 API 接入</dd></div></dl></aside></div>';
}

function audit(id,segment) {
  if (id === 'examples') return oversightExamples(segment);
  if (['reports','verification','rechecks'].includes(id)) return oversightDesk(id);
  const decided = {accept:'已采纳', reject:'已驳回'}[state.decision];
  return head('御史巡按') + auditSubnav() + '<div class="workspace"><section class="sheet"><h2>归类建议</h2><h3>将「课程复盘」改归学习省</h3>' +
    '<p>案卷 YL-011 登记在工作省，交付要求是复盘课程错题。</p><div class="actions">' +
    (decided ? '<span class="badge done">' + decided + '</span>' : button('采纳建议','classify','accept',true) + button('驳回','classify','reject')) +
    link('查看来源','cases/YL-011','file') + '</div></section>' +
    '<aside class="sheet"><h2>监督案卷</h2><dl class="detail"><div><dt>覆盖范围</dt><dd>演示工作区登记的案卷</dd></div><div><dt>待核证报告</dt><dd>' + link(state.findings.length + ' 件待核证','audit/verification','file') + '</dd></div></dl>' + link('回到御史台','court/censor','court') + '</aside></div>';
}

function historyPage(province,district) {
  if (province === 'sample') return historyDemoPage();
  const key = Object.hasOwn(provinces,province) ? province : '';
  const local = key && Object.hasOwn(districts[key],district) ? district : '';
  const items = state.tasks.filter(task => task.stage === 'archived' && (!key || task.province === key) && (!local || districtKey(task) === local));
  return head('国史馆') + '<div class="workspace"><section class="sheet"><div class="inline"><h2>地方县志</h2>' + (key ? link('查看全部','history') : '') + '</div>' +
    (items.length ? '<ul class="entries">' + items.map(task => '<li>' + icon('box') + link(task.title,'cases/' + task.id) + '<span class="id">' + task.id + '</span>' + badge(task) + '</li>').join('') + '</ul>' :
    '<p class="empty">当前范围还没有熟地。</p>') +
    '</section><aside class="sheet"><h2>正式国史</h2><p class="muted">尚无已批准的收录。</p>' +
    link('查看收录样例','history/sample','book') + '</aside></div>';
}

function weekly(id) {
  if (id === 'sample') return weeklyDemoPage();
  const report = state.report;
  return head('综合周报') + '<div class="workspace"><section class="sheet"><h2>11 月 2 日至 11 月 6 日</h2>' +
    '<p class="notice' + (report ? ' ok' : '') + '">' + (report ? '演示报告已归档' : '本期尚未生成') + '</p>' +
    (report ? '<div class="report"><h3>本期摘要</h3><p>已有 ' + report.completed + ' 项验收或归档，' + report.active + ' 项正在办理、验收或复核。</p><ul class="entries">' +
    report.items.map(id => '<li>' + icon('file') + link(get(id).title,'cases/' + id) + '</li>').join('') + '</ul></div>' :
    '<div class="actions">' + (state.connected ? button('补跑本期','weekly','',true,'week') : link('先连接演示 API','settings')) + '</div>') +
    '</section><aside class="sheet"><h2>报告范围</h2><dl class="detail"><div><dt>工作区</dt><dd>演示工作区</dd></div><div><dt>触发入口</dt><dd>经略内补跑</dd></div></dl>' +
    link('查看归档样例','weekly/sample','book') + '</aside></div>';
}

function render(focus = false) {
  const {page,id,segment,caseId} = route();
  const screens = {desk:deskHome, demo:demoPage, atlas, center:workTreeHome, court:courtPage, guide:guidePage, 'office-records':officeRecordsPage, cases, audit, jurisdiction:jurisdictionPage, history:historyPage, weekly, settings, new:formPage, 'province-new':provinceForm, search:searchPage};
  app.innerHTML = screens[page](id,segment,caseId);
  revealWorkTreeSelection();
  const navPage = page === 'jurisdiction' ? 'atlas' : page === 'desk' ? (id ? 'demo' : 'center') : page;
  document.querySelectorAll('[data-page]').forEach(item => {
    if (item.dataset.page === navPage) item.setAttribute('aria-current','page');
    else item.removeAttribute('aria-current');
  });
  if (focus) {
    const officeTitle = page === 'court' && id ? app.querySelector('.court-desk h2') : null;
    const countyTitle = page === 'atlas' && (caseId || get(id)) ? app.querySelector('#county-selection h2') : null;
    if (officeTitle) officeTitle.focus({preventScroll:innerWidth > 820});
    else if (countyTitle) focusCounty();
    else if (app.querySelector('.workbench') && segment) focusWorkCase();
    else app.querySelector('h1').focus();
  }
  keep();
}

function focusCounty() {
  const heading = app.querySelector('#county-selection h2');
  if (!heading) return;
  heading.focus({preventScroll:true});
  const bounds = heading.getBoundingClientRect();
  if (countyViewQuery.matches || bounds.top < 0 || bounds.bottom > innerHeight) {
    heading.scrollIntoView({block:'center'});
  }
}

function act(element) {
  const {action,key} = element.dataset;
  const task = get(key);
  if (action === 'work-tree-back') {
    focusWorkTree();
    return;
  }
  if (action === 'county-select' && task) {
    const target = '#' + countyLocation(task);
    if (location.hash !== target) window.history.pushState(null,'',target);
    state.selected = task.id;
    render();
    focusCounty();
    return;
  }
  if (action === 'county-back') {
    const selected = app.querySelector('[data-county-view] [data-action="county-select"][aria-pressed="true"]');
    const target = selected || app.querySelector('.county-tabs [aria-pressed="true"]');
    target?.focus({preventScroll:true});
    target?.scrollIntoView({block:'center'});
    return;
  }
  if (action === 'county-clear') {
    query = '';
    render();
    app.querySelector('#search-form input').focus({preventScroll:true});
    return;
  }
  if (action === 'court-directory') {
    app.querySelector('#court-directory h2')?.focus();
    return;
  }
  if (action === 'dismiss-guide') {
    state.guideSeen = true;
    render(true);
    return;
  }
  if (action === 'connect-inline') {
    state.connected = true;
    const form = app.querySelector('#task-form');
    storeDraft(form);
    render();
    app.querySelector('#task-form button[type="submit"]').focus({preventScroll:true});
    note('演示执行者已启用，草稿已保留');
    return;
  }
  if (action === 'report-sample') {
    if (registerSampleFinding(key)) {
      render();
      app.querySelector('h1').focus({preventScroll:true});
      note('示例疑点已登记，等待大理寺核证');
    }
    return;
  }
  if (action === 'save-formal-delivery' && task?.flow?.stage === 'verify' && !formalDeliveryBody(task)) {
    const input = app.querySelector('[name="formal-delivery-body"]');
    const body = input?.value.trim();
    if (!body) {
      note('请填写可供验收的交付正文。');
      input?.focus();
      return;
    }
    task.formalDelivery = {version:task.flow.version,body};
    render();
    app.querySelector('[data-step="verify"]')?.focus({preventScroll:true});
    note('已补本版交付材料');
    return;
  }
  if (action === 'formal') {
    if (!task?.flow) return;
    const step = element.dataset.step;
    const deliveryInput = step === 'execute' ? app.querySelector('[name="formal-delivery-body"]') : null;
    const delivery = deliveryInput?.value.trim();
    if (step === 'execute' && !delivery || step === 'verify' && !formalDeliveryBody(task)) {
      note('请先填写当前版交付正文。');
      deliveryInput?.focus();
      return;
    }
    if (reviewNeedsPacket(step)) {
      const stamp = task && reviewMaterialStamp(task);
      if (!stamp || element.dataset.material !== stamp) {
        note('当前材料缺失或已经变更，请重新查看本版。');
        return;
      }
    }
    const reasonInput = app.querySelector('[name="formal-reason"]');
    const reason = reasonInput?.value || '';
    if (!advanceFormal(task,element.dataset.step,reason)) {
      note('当前无法推进，退回或封驳须填写理由。');
      reasonInput?.focus();
      return;
    }
    if (step === 'approval') {
      task.flow.approval.reviewedMaterial = reviewPacket(task);
    }
    if (step === 'execute') task.formalDelivery = {version:task.flow.version,body:delivery};
    render();
    (app.querySelector('[data-action="formal"]') || app.querySelector('h1')).focus({preventScroll:true});
    note(status(task)[0]);
    return;
  }
  let message = '';
  if (action === 'county-view') {
    state.view = key;
  } else if (action === 'connect' || action === 'disconnect') {
    state.connected = action === 'connect';
    message = state.connected ? '演示 API 已连接' : '演示 API 已断开';
  } else if (action === 'accept' && canAcceptOrdinary(task)) {
    task.acceptance = {evidence:task.evidence,body:ordinaryReviewBody(task),at:new Date().toISOString()};
    task.stage = 'done';
    message = task.title + '已验收';
  } else if (action === 'begin' && state.connected && task?.stage === 'idle' && !unresolved(task).length) {
    task.stage = 'active';
    message = task.title + '已开始办理';
  } else if ((action === 'submit' && state.connected && task?.stage === 'active') ||
      (action === 'save-delivery' && task?.stage === 'review' && !canAcceptOrdinary(task))) {
    const bodyInput = element.closest('.review-delivery-editor')?.querySelector('[name="delivery-body"]');
    const body = bodyInput?.value.trim();
    if (!body) {
      note('请填写可供验收的交付正文。');
      bodyInput?.focus();
      return;
    }
    task.deliveryBody = body;
    task.stage = 'review';
    task.evidence ||= '演示交付记录.md';
    message = '交付已提交，等待验收';
  } else if (action === 'classify' && !state.decision) {
    state.decision = key;
    if (key === 'accept') Object.assign(get('YL-011'),{province:'study',district:'exam'});
    message = key === 'accept' ? '已记录采纳' : '已记录驳回';
  } else if (action === 'weekly' && state.connected && !state.report) {
    const completed = state.tasks.filter(task => ['done','archived'].includes(stageOf(task)));
    state.report = {
      completed: completed.length,
      active: state.tasks.filter(task => (task.flow && task.flow.stage !== 'done') || ['active','review','independent'].includes(task.stage)).length,
      items: completed.map(task => task.id),
    };
    message = '本期演示周报已归档';
  }
  render();
  const replacement = [...app.querySelectorAll('[data-action]')].find(item => item.dataset.action === action && item.dataset.key === key);
  if (route().page === 'atlas' && ['accept','begin','submit'].includes(action)) focusCounty();
  else if (!replacement && app.querySelector('.workbench')) focusWorkCase();
  else (replacement || app.querySelector('h1')).focus({preventScroll:true});
  if (message) note(message);
}

app.addEventListener('click', event => {
  const leaf = event.target.closest('.work-tree-leaf');
  if (leaf && leaf.hash === location.hash) {
    focusWorkCase();
    return;
  }
  const element = event.target.closest('[data-action]');
  if (element) act(element);
});
app.addEventListener('keydown', event => {
  if (event.target.matches('[role="button"][data-action]') && ['Enter',' '].includes(event.key)) {
    event.preventDefault();
    act(event.target);
  }
});
app.addEventListener('input', event => storeDraft(event.target.form));
app.addEventListener('change', event => {
  const form = event.target.form;
  if (form?.id === 'task-form' && ['province','district'].includes(event.target.name)) {
    if (event.target.name === 'province') form.elements.district.innerHTML = districtOptions(event.target.value);
    const assigned = workspaceForDistrict(form.elements.province.value,form.elements.district.value);
    app.querySelector('#task-workspace').textContent = assigned?.name || '待绑定';
    storeDraft(form);
    return;
  }
  if (event.target.name !== 'impact') return;
  const needsApproval = event.target.value !== 'local';
  const choice = form.elements.route;
  choice.disabled = needsApproval;
  if (needsApproval) choice.value = 'formal';
  form.querySelector('#impact-hint').hidden = !needsApproval;
  storeDraft(form);
});
app.addEventListener('submit', event => {
  event.preventDefault();
  if (event.target.id === 'review-material-form') {
    const form = event.target;
    const task = get(form.dataset.task);
    if (!task || !reviewMayEdit(task) || task.flow.version !== Number(form.dataset.version)) {
      note('当前案卷已换版或送审，无法修改。');
      return;
    }
    const values = new FormData(form);
    const body = values.get('body').trim(), basis = values.get('basis').trim(), effect = values.get('effect').trim();
    if (!body || !basis || !effect) {
      note('请补齐正文、依据和批准后边界。');
      return;
    }
    const packet = reviewPacket(task);
    task.reviewMaterials ??= {};
    task.reviewMaterials[task.flow.version] = {title:packet?.title || task.title + '送审稿',body,basis,effect,
      ...(packet?.sources ? {sources:packet.sources} : {}), ...(packet?.storyboard ? {storyboard:true} : {})};
    render();
    app.querySelector('#review-material-title')?.focus({preventScroll:true});
    note('已保存第 ' + task.flow.version + ' 版送审材料');
    return;
  }
  if (event.target.id === 'realm-search-form') {
    realmQuery = Object.fromEntries(new FormData(event.target));
    realmQuery.q = realmQuery.q.trim();
    render();
    app.querySelector('[name="q"]').focus();
    return;
  }
  if (event.target.id === 'search-form') {
    query = new FormData(event.target).get('q').trim();
    render();
    app.querySelector('[name="q"]').focus();
    return;
  }
  if (event.target.id === 'province-form') {
    const values = new FormData(event.target);
    const name = values.get('name').trim().replace(/省$/,'').trim();
    const district = values.get('districtName').trim();
    const keyName = value => value.normalize('NFKC').replace(/\s+/g,'').toLowerCase();
    const duplicate = Object.values(provinces).some(province => keyName(province.name) === keyName(name));
    if (!name || !district || duplicate) {
      const error = event.target.querySelector('#province-error');
      error.textContent = duplicate ? '已有同名行省。' : '请填写行省和首个府州名称。';
      error.hidden = false;
      return;
    }
    const item = {key:'p-' + (state.customProvinces.length + 1),name,district};
    state.customProvinces.push(item);
    mountProvince(item);
    state.province = item.key;
    state.district = 'first';
    keep();
    location.hash = 'atlas/' + item.key;
    return;
  }
  if (event.target.id !== 'task-form' || !state.connected) return;
  const values = new FormData(event.target);
  const title = values.get('title').trim(), check = values.get('check').trim(), province = values.get('province'), district = values.get('district');
  if (!title || !check || !Object.hasOwn(provinces,province) || !Object.hasOwn(districts[province],district)) { note('请填写任务名称和验收条件'); return; }
  const id = 'YL-' + String(Math.max(...state.tasks.map(task => Number(task.id.slice(3)))) + 1).padStart(3,'0');
  const impact = values.get('impact');
  const needsApproval = Object.hasOwn(impactTypes,impact) && impact !== 'local';
  const formal = needsApproval || values.get('route') === 'formal';
  const workspaceId = workspaceForDistrict(province,district)?.id || null;
  state.tasks.push({id, province, district, workspaceId, title, stage:formal ? 'formal' : 'idle', needs:[], owner:'礼部', note:check, check,
    ...(formal ? {flow:createFlow(), formalKind: needsApproval ? impactTypes[impact] + '流程演练' : '正式事项演练'} : {})});
  state.province = province;
  state.district = district;
  state.selected = id;
  state.draft = null;
  keep();
  location.hash = 'cases/' + id;
  note('已创建案卷 ' + id);
});
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  app.focus();
  app.scrollIntoView({block:'start'});
});
const moreNav = document.querySelector('.more-nav');
moreNav.addEventListener('click', event => {
  if (event.target.closest('a')) moreNav.open = false;
});
document.addEventListener('click', event => {
  if (moreNav.open && !moreNav.contains(event.target)) moreNav.open = false;
});
moreNav.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !moreNav.open) return;
  moreNav.open = false;
  moreNav.querySelector('summary').focus();
});
window.addEventListener('hashchange', () => { query = ''; render(true); });
countyViewQuery.addEventListener('change', () => {
  if (!state.view && app.querySelector('.county-page')) render();
});
render();
