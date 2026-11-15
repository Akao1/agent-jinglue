'use strict';

const startActions = [
  ['file','交办一件事','交办后在中枢查进度','new'],
  ['map','找我的业务','按行省、府州找回案卷','atlas'],
  ['center','找谁办理','从京城衙署进入对应部门','court'],
];

function startGuide(full = false) {
  return '<section class="start-guide" aria-labelledby="start-guide-title"><div class="start-guide-head"><h2 id="start-guide-title">' +
    (full ? '从这里开始' : '第一次使用经略') + '</h2>' + (full ? link('返回中枢','center') :
      '<button type="button" class="text-link guide-dismiss" data-action="dismiss-guide">收起导览</button>') +
    '</div><div class="start-actions">' + startActions.map(([symbol,title,hint,route]) =>
      '<a href="#' + route + '"><span class="start-action-icon">' + icon(symbol) + '</span><span><strong>' + title +
      '</strong><small>' + hint + '</small></span>' + icon('next') + '</a>').join('') + '</div></section>';
}

function guidePage() {
  return head('使用导览') + startGuide(true) +
    '<section class="sheet guide-notes"><h2>签批和验收</h2><p>普通交办由你验收成果。涉及对外发布、改规、不可逆或资源开通的事项，门下复核后先等你朱批，再派给责任部。</p><p>演示工作区可以试走这些步骤。正式产品的模型接入和身份核验仍待实施。</p></section>';
}

function auditSubnav(active = '') {
  const entries = [['','巡按总览'],['reports','察院上报'],['verification','大理寺核证'],['rechecks','台院抽验'],
    ['examples','监察状态样例']];
  return '<nav class="audit-subnav" aria-label="监察分工">' + entries.map(([key,label]) =>
    '<a class="button" href="#audit' + (key ? '/' + key : '') + '"' + (active === key ? ' aria-current="page"' : '') + '>' + label + '</a>').join('') + '</nav>';
}

function oversightExamples(id) {
  const chosen = id ? workflowOversightSamples.find(entry => entry.id === id) : workflowOversightSamples[0];
  const sampleList = '<section class="sheet" aria-label="监察状态样例列表"><h2>状态样例</h2><ul class="entries finding-list">' +
    workflowOversightSamples.map(entry => '<li><span class="finding-case"><a class="text-link" href="#audit/examples/' + entry.id + '"' +
      (chosen === entry ? ' aria-current="page"' : '') + '>' + esc(entry.title) + '</a><small>' + esc(entry.id) + '</small></span>' +
      '<span class="badge ' + entry.tone + '">' + esc(entry.label) + '</span></li>').join('') + '</ul></section>';
  const info = chosen ? '<aside class="sheet" aria-label="所选监察样例"><div class="inline"><span class="badge ' + chosen.tone + '">' +
    esc(chosen.label) + '</span><span class="id">' + esc(chosen.id) + '</span></div><h3>' + esc(chosen.title) + '</h3>' +
    '<dl class="detail"><div><dt>当前经手</dt><dd>' + esc(chosen.office) + '</dd></div><div><dt>核证依据</dt><dd>' +
    esc(chosen.basis) + '</dd></div><div><dt>下一步</dt><dd>' + esc(chosen.next) + '</dd></div></dl>' +
    '<div class="actions">' + link('查原案','cases/' + chosen.task,'file') +
    (chosen.related ? link('查补正案','cases/' + chosen.related,'file') : '') + '</div></aside>' :
    '<aside class="sheet" aria-label="所选监察样例"><h2>找不到此样例</h2><p>从样例列表选择一条监察记录。</p></aside>';
  return head('监察状态样例','只读演示记录') + auditSubnav('examples') + '<div class="workspace">' + sampleList + info + '</div>';
}

function oversightDesk(key) {
  const definitions = {
    reports:{title:'察院上报',office:'investigation',intro:'登记疑点，保留原案卷及依据。'},
    verification:{title:'大理寺核证',office:'dali',intro:'核实察院报告。结论须由合格的独立核证者作出。'},
    rechecks:{title:'台院抽验',office:'recheck',intro:'抽验已验收的交付。监察销案还须核对实际整改和独立复验证据。'},
  };
  const {title,office,intro} = definitions[key];
  const queue = state.findings || [];
  const lines = queue.map(entry => '<li><span class="finding-case"><strong>' + esc(entry.summary) + '</strong><small>' + esc(entry.id) +
    ' / ' + esc(entry.basis) + '</small></span>' + link('查原案','cases/' + entry.task) + '<span class="badge pending">待独立核证</span></li>').join('');
  const records = lines ? '<ul class="entries finding-list">' + lines + '</ul>' : '<p class="empty">尚无监察报告。</p>';
  let content;
  if (key === 'reports') {
    content = '<h2>已登记疑点</h2>' + records +
      (!queue.some(item => item.task === 'YL-029') ? '<div class="actions">' + button('登记示例疑点','report-sample','YL-029',true,'file') + '</div>' : '') +
      '<div class="actions">' + link('转看待核证记录','audit/verification','next') + '</div>';
  } else if (key === 'verification') {
    content = '<h2>核证队列</h2>' + records + (queue.length ? '<p class="notice">当前演示缺少独立核证身份，记录保持待核证。</p>' +
      link('查看执行者','settings','settings') : link('前往察院上报','audit/reports','next'));
  } else {
    const tasks = state.tasks.filter(task => stageOf(task) === 'post');
    content = '<h2>待抽验案卷</h2>' + (tasks.length ? '<ul class="entries">' + tasks.map(task => '<li>' +
      link(task.title,'cases/' + task.id,'file') + '<span class="id">' + esc(task.id) + '</span>' + badge(task) + '</li>').join('') +
      '</ul>' : '<p class="empty">目前没有等待交付抽验的案卷。</p>');
  }
  return head(title) + auditSubnav(key) + '<div class="workspace"><section class="sheet">' + content +
    '</section><aside class="sheet"><h2>职责</h2><p>' + intro + '</p>' + link('回到衙署','court/' + office,'center') + '</aside></div>';
}

const hanlinReferenceSamples = [
  ['HL-001','旧稿目录收录提名','待核档','YL-024','索引已附原稿版本与收录理由，等待台院独立核对。'],
  ['HL-002','对话提要归档索引','待朱批','YL-028','示例核档记录已齐，等待批准本次收录范围。'],
  ['HL-003','样片参考素材索引','已收录','YL-006','历史样例已完成提名、独立核档和用户批准，可查地方县志。'],
];

const scoutReferenceSamples = [
  ['TC-001','评测记录回溯','待查证','YL-019','需要对照评测配置、样本版本和运行记录。'],
  ['TC-002','分镜素材出处核对','待补来源','YL-002','分镜中有一处素材未附原始授权出处，待补齐。'],
  ['TC-003','维护记录定位','已留证','YL-032','示例查证已对照维护日志的版本与回退依据。'],
];

function officeReferenceSamples(records) {
  return records.map(([id,title,status,task,summary]) =>
    '<details class="case-proof"><summary>' + esc(title) + ' <span class="badge ' +
    (['已收录','已留证'].includes(status) ? 'done' : 'pending') + '">' + esc(status) + '</span></summary>' +
    '<p>' + esc(id) + ' · ' + esc(summary) + '</p>' + link('查原案','cases/' + task,'file') + '</details>').join('');
}

function officeRecordsPage(id) {
  if (id === 'hanlin') return head('翰林院') + '<div class="workspace"><section class="sheet"><h2>国史提名样例</h2>' +
    officeReferenceSamples(hanlinReferenceSamples) +
    '<h3>可回查的地方县志</h3>' + link('旧稿留存','cases/YL-024','book') + ' ' + link('打开国史馆','history') +
    '</section><aside class="sheet"><h2>收录程序</h2><p>翰林提名、台院核档，最后由 用户 朱批收录。样例记录只供查阅。</p>' +
    link('回到翰林院','court/hanlin','center') + '</aside></div>';
  if (id === 'scout') return head('探查司') + '<div class="workspace"><section class="sheet"><h2>探查帖样例</h2>' +
    officeReferenceSamples(scoutReferenceSamples) + link('查看综合周报','weekly','week') +
    '</section><aside class="sheet"><h2>查证记录</h2><p>收录查询日期、原始来源与结论。样例记录只供查阅。</p>' +
    link('回到探查司','court/scout','center') + '</aside></div>';
  return head('官署档案') + '<section class="sheet"><p>没有找到这处档案。</p>' + link('返回京城衙署','court','center') + '</section>';
}

function registerSampleFinding(id) {
  if (id !== 'YL-029' || state.findings.some(entry => entry.task === id)) return false;
  state.findings.push({id:'JC-001',task:id,summary:'示例权限边界证据待核',basis:'案卷 YL-029 的复核要求',at:new Date().toISOString()});
  keep();
  return true;
}
