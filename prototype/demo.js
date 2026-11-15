'use strict';

function demoGroups() {
  const [ordinary,formal,oversight] = workflowDemoGroups();
  return [
    {key:'execution',title:'执行尝试',rows:executionDemoRows()},
    {key:'ordinary',...ordinary},
    {key:'formal',...formal},
    {key:'oversight',...oversight},
    {key:'records',title:'周报、档案与设置',rows:[
      {label:'周报待生成',description:'查看本期状态，可以用演示数据补跑。',route:'weekly'},
      {label:'周报已归档',description:'读样例摘要，再打开记录来源。',route:'weekly/sample'},
      {label:'地方县志',description:'从备考州查已收档的模拟卷复盘。',route:'history/study/exam'},
      {label:'正式国史示例',description:'看一条样例国史和它关联的案卷。',route:'history/sample'},
      {label:'翰林提名',description:'查看待审核的国史提名和原案。',route:'office-records/hanlin'},
      {label:'探查记录',description:'查看核源记录和对应的任务。',route:'office-records/scout'},
      {label:'府治与工作区',description:'比较同一行省中的本地规则。',route:'jurisdiction/study/exam'},
      {label:'执行者配置',description:'在待连接与已连接演示 API 之间切换。',route:'settings'},
    ]},
  ];
}

function demoPage(category = '') {
  const groups = demoGroups();
  const current = groups.some(group => group.key === category) ? category : '';
  const tabs = [{key:'',title:'全部'}, ...groups].map(({key,title}) =>
    '<a href="#demo' + (key ? '/' + key : '') + '"' + (key === current ? ' aria-current="page"' : '') +
    '>' + esc(title) + '</a>').join('');
  return head('状态样例') + '<div class="demo-head"><p>选择一种状态，直接打开对应案卷或执行演示。</p>' +
    '<a class="button primary" href="#desk/approval">' + icon('activity') + '执行演示</a></div>' +
    '<nav class="demo-tabs" aria-label="样例分类">' + tabs + '</nav><div class="demo-grid">' +
    groups.filter(group => !current || group.key === current).map(group =>
      '<section class="demo-section" aria-labelledby="demo-' + group.key + '"><header><h2 id="demo-' + group.key + '">' +
      esc(group.title) + '</h2><span>' + group.rows.length + ' 项</span></header><ul>' +
      group.rows.map(row => '<li><a href="#' + esc(row.route) + '"><span><strong>' + esc(row.label) + '</strong><small>' +
        esc(row.description) + '</small></span>' + icon('next') + '</a></li>').join('') + '</ul></section>'
    ).join('') + '</div>';
}

function weeklyDemoPage() {
  return head('综合周报样例') + '<nav class="demo-crumbs" aria-label="周报位置">' + link('返回综合周报','weekly','week') +
    link('状态样例','demo/records','list') + '</nav><div class="workspace"><section class="sheet"><h2>一周进展</h2>' +
    '<p class="notice ok">演示归档，2026 年 11 月 2 日至 6 日</p><ul class="entries">' +
    '<li>' + link('视频制作：脚本验收完成','cases/YL-001','file') + '</li>' +
    '<li>' + link('学习：章节练习已核对','cases/YL-010','file') + '</li>' +
    '<li>' + link('学习：首轮诊断可查回','cases/EX-004','file') + '</li></ul></section>' +
    '<aside class="sheet"><h2>来源覆盖</h2><p>演示工作区的案卷与县志。</p>' +
    link('查备考州县志','history/study/exam','book') + '</aside></div>';
}

function historyDemoPage() {
  return head('国史馆样例') + '<nav class="demo-crumbs" aria-label="档案位置">' + link('返回国史馆','history','book') +
    link('状态样例','demo/records','list') + '</nav><div class="workspace"><section class="sheet">' +
    '<h2>视频素材留证方法</h2><p class="notice ok">演示收录</p><p>归档时把来源、授权范围和验收记录关联到同一案卷。</p>' +
    '<ul class="entries"><li>' + link('素材清点原案','cases/YL-004','file') + '</li><li>' +
    link('样片府县志','history/video/sample','book') + '</li></ul></section><aside class="sheet"><h2>收录依据</h2>' +
    '<p>示范案卷的验收记录与归档位置。</p></aside></div>';
}
