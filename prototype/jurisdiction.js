'use strict';

const workspaceIndex = {
  'video-studio': {
    id:'video-studio', name:'视频制作工作区', origin:'demo://video-studio/AGENTS.md', destination:'demo://video-studio/交付',
    rules:[
      ['素材留出处','素材先登记来源、授权范围和使用限制，再进入脚本、分镜或剪辑。'],
      ['对外发布另行请批','验收确认内容可交付。对外发布须按案卷载明的范围取得明确批准。'],
      ['成片与记录同存','交付保留成片、字幕和验收记录，用同一案号查回源素材。'],
    ],
  },
  'work-desk': {
    id:'work-desk', name:'个人工作台', origin:'demo://work-desk/AGENTS.md', destination:'demo://work-desk/成果',
    rules:[
      ['原件留在所属工作区','台账登记进度和证据位置，避免把原始材料复制到通用汇总。'],
      ['分清推进与验收','分别记录准备、交付、确认的状态和时间。'],
      ['对外材料先核范围','提交对外使用的文稿前核对用途、对象和允许披露的资料。'],
    ],
  },
  'work-delivery': {
    id:'work-delivery', name:'交付材料工作区', origin:'demo://work-delivery/AGENTS.md', destination:'demo://work-delivery/验收件',
    rules:[
      ['交付以确认版本为准','列出交付件、适用条件和当前版本。回传时使用对应的验收清单。'],
      ['待确认事项单列','尚缺的原件、授权或交付凭据留在案卷中，记录责任人与下一步。'],
      ['修改可回查','交付后的更正保留原版本、修改原因和实际复核结果。'],
    ],
  },
  'study-personal': {
    id:'study-personal', name:'个人学习工作区', origin:'demo://study-personal/AGENTS.md', destination:'demo://study-personal/练习与复盘',
    rules:[
      ['练习结果回指原题','记录题目、用时、得分与错因，复盘时能打开对应的练习。'],
      ['复盘后再二刷','先验收错因分析，按薄弱题型安排二刷，再用等量练习核对改进。'],
      ['复测沿用同一口径','对比两轮的正确率、用时和重复错因，记录尚待练习的题型。'],
    ],
  },
  'study-models': {
    id:'study-models', name:'模型研习工作区', origin:'demo://study-models/AGENTS.md', destination:'demo://study-models/评测记录',
    rules:[
      ['模型与版本写入记录','每次评测记录执行者、配置、样本和运行条件。'],
      ['用同一批题做对照','更换模型或提示词后保留原始输出，按同一验收口径比较。'],
      ['失败用例保留','把错误、超时和待核事实写入复盘，便于复验。'],
    ],
  },
  'writing-long': {
    id:'writing-long', name:'长篇写作工作区', origin:'demo://writing-long/AGENTS.md', destination:'demo://writing-long/稿件',
    rules:[
      ['设定以现行原件为准','起草前核角色知识、时间线和已批准的世界设定。'],
      ['逐章保留版本','修订注明原因和影响章节，沿用相同作品和章节标识。'],
      ['审读意见回指稿件','将连续性和语言问题标到段落，复查时可找到原文。'],
    ],
  },
  'writing-short': {
    id:'writing-short', name:'短篇写作工作区', origin:'demo://writing-short/AGENTS.md', destination:'demo://writing-short/短稿',
    rules:[
      ['开稿先核交付形式','明确篇幅、读者和成稿形式，保留当前版本要求。'],
      ['引用保留来源','原文、摘录与改写分开，记录所用素材位置。'],
      ['成稿与试写分存','以通过验收的文稿作为交付，试写保留为可查过程。'],
    ],
  },
  'chat-deliberation': {
    id:'chat-deliberation', name:'议事记录工作区', origin:'demo://chat-deliberation/AGENTS.md', destination:'demo://chat-deliberation/议事案卷',
    rules:[
      ['按主题关联案卷','持续讨论用同一主题登记，保留重要决定的原句和时间。'],
      ['建议等待明确决定','分别记录草案、已确定事项与待核问题。'],
      ['后续更正保留依据','指出最新决定替换的旧口径，并保存历史引用。'],
    ],
  },
  'chat-methods': {
    id:'chat-methods', name:'方法笔记工作区', origin:'demo://chat-methods/AGENTS.md', destination:'demo://chat-methods/方法手册',
    rules:[
      ['记录适用情境','写清方法解决的问题、使用条件和已观察到的结果。'],
      ['成果可以复查','方法引用实际案卷、样例或测试，区分已验证和待试。'],
      ['保留修订来由','新版本记录改动依据，并连接上次使用结果。'],
    ],
  },
  'engineering-project': {
    id:'engineering-project', name:'项目研发工作区', origin:'demo://engineering-project/AGENTS.md', destination:'demo://engineering-project/版本交付',
    rules:[
      ['按已定范围实施','动手前记录需求、允许变更的文件和验收用例。'],
      ['复现后做行为验收','验证实际操作、异常和回退，绑定被测版本。'],
      ['发布单独记录','区分本地原型、测试通过与运行版本。发布时附批准和验证记录。'],
    ],
  },
  'engineering-ops': {
    id:'engineering-ops', name:'运行维护工作区', origin:'demo://engineering-ops/AGENTS.md', destination:'demo://engineering-ops/运行记录',
    rules:[
      ['操作前核运行版本','将目标、当前状态、变更范围和可回退位置记入案卷。'],
      ['失败留原始证据','记录首次失败、实际重试和最终检查的时间及结果。'],
      ['验收核实际服务','交付写明生效的版本、验证入口和待处理告警。'],
    ],
  },
};

const workspaceDistricts = {
  video:{sample:'video-studio',series:'video-studio'},
  work:{studio:'work-desk',client:'work-delivery'},
  study:{exam:'study-personal',model:'study-models'},
  writing:{serial:'writing-long',drafts:'writing-short'},
  chat:{notes:'chat-deliberation',methods:'chat-methods'},
  projects:{jinglue:'engineering-project',maintenance:'engineering-ops'},
};

function workspaceById(id) {
  return Object.hasOwn(workspaceIndex,id) ? workspaceIndex[id] : undefined;
}

function workspaceForDistrict(province,district) {
  if (!Object.hasOwn(workspaceDistricts,province) || !Object.hasOwn(workspaceDistricts[province],district)) return undefined;
  return workspaceById(workspaceDistricts[province][district]);
}

function jurisdictionLocation(province,district) {
  return 'jurisdiction/' + encodeURIComponent(province) + '/' + encodeURIComponent(district);
}

function jurisdictionDistrictTitle(name) {
  return name + (/[府州]$/.test(name) ? '治' : '治所');
}

function jurisdictionHeading(title, crumb, subtitle = '', action = '') {
  return '<nav class="jurisdiction-crumbs" aria-label="治所路径">' + crumb + '</nav>' +
    '<header class="jurisdiction-heading"><div><h1 tabindex="-1">' + esc(title) + '</h1>' +
    (subtitle ? '<p>' + esc(subtitle) + '</p>' : '') + '</div>' + action + '</header>';
}

function jurisdictionAction(label,target,symbol = 'next') {
  return '<a class="button" href="#' + esc(target) + '">' + icon(symbol) + esc(label) + '</a>';
}

function jurisdictionRegistry() {
  const rows = Object.entries(districts);
  const districtCount = rows.reduce((count,[,places]) => count + Object.keys(places).length,0);
  return jurisdictionHeading('治所名录',link('王朝版图','atlas','map') + icon('next') +
    '<span aria-current="page">治所名录</span>',districtCount + ' 处府州 / ' + Object.keys(workspaceIndex).length + ' 个演示工作区') +
    '<div class="jurisdiction-index">' + rows.map(([province,places]) =>
      '<section class="jurisdiction-region"><header class="jurisdiction-region-title"><h2>' + esc(provinces[province].name) +
      '省</h2><a href="#' + provinceSeatLocation(province) + '" aria-label="查看' + esc(provinces[province].name) +
      '省治">' + icon('court') + '省治</a></header><ul>' +
      Object.entries(places).map(([district,name]) => {
        const workspace = workspaceForDistrict(province,district);
        return '<li><a href="#' + jurisdictionLocation(province,district) + '">' +
          '<span class="jurisdiction-row-icon">' + icon('court') + '</span><span><strong>' + esc(name) + '</strong><small>' +
          esc(workspace?.name || '工作区待绑定') + '</small></span>' + icon('next') + '</a></li>';
      }).join('') + '</ul></section>',
    ).join('') + '</div>';
}

function jurisdictionWorkspaceCard(workspace) {
  return '<section class="jurisdiction-registration" aria-label="工作区归属"><div>' +
    '<span class="jurisdiction-registration-seal" aria-hidden="true">' + icon('court') + '</span><div><p>演示工作区</p>' +
    '<h2>' + esc(workspace.name) + '</h2></div></div></section>';
}

function jurisdictionRules(workspace,current = '') {
  return '<div class="jurisdiction-layout"><section class="jurisdiction-sheet" aria-labelledby="jurisdiction-rule-heading">' +
    '<header><h2 id="jurisdiction-rule-heading">工作区规则</h2></header><ol class="jurisdiction-rules">' +
    workspace.rules.map(([title,description],index) =>
      '<li><span class="jurisdiction-rule-no" aria-hidden="true">' + String(index + 1).padStart(2,'0') +
      '</span><div><h3>' + esc(title) + '</h3><p>' + esc(description) + '</p></div></li>',
    ).join('') + '</ol></section><aside class="jurisdiction-sheet jurisdiction-record" aria-label="位置与关联">' +
    '<header><h2>位置与关联</h2></header><dl><div><dt>规则来源</dt><dd><code>' +
    esc(workspace.origin) + '</code></dd></div><div><dt>成果位置</dt><dd><code>' +
    esc(workspace.destination) + '</code></dd></div><div><dt>授权状态</dt><dd>演示关联</dd></div></dl>' +
    jurisdictionAssociated(workspace.id,current) + '</aside></div>';
}

function jurisdictionAssociated(workspaceId,current) {
  const matches = Object.entries(workspaceDistricts).flatMap(([province,places]) =>
    Object.entries(places).filter(([,id]) => id === workspaceId).map(([district]) => ({province,district})));
  return '<div class="jurisdiction-associated"><h3>使用此工作区的府州</h3><ul>' +
    matches.map(({province,district}) => {
      const target = jurisdictionLocation(province,district);
      const name = districts[province][district];
      const item = target === current ? '<span class="jurisdiction-current" aria-current="location">' +
        icon('pin') + esc(name) + '</span>' : link(name,target,'pin');
      return '<li>' + item + '</li>';
    }).join('') +
    '</ul></div>';
}

function jurisdictionPage(id,segment,caseId) {
  if (!id) return jurisdictionRegistry();
  if (id === 'province') return provinceSeatPage(segment);
  const home = link('治所名录','jurisdiction','court') + icon('next');
  if (id === 'workspace') {
    const workspace = workspaceById(segment);
    if (!workspace) {
      return jurisdictionHeading('找不到工作区',home + '<span aria-current="page">工作区</span>') +
        '<div class="jurisdiction-empty"><h2>当前原型未登记此工作区</h2>' +
        jurisdictionAction('查看治所名录','jurisdiction','court') + '</div>';
    }
    const task = caseId ? get(caseId) : undefined;
    const back = task?.workspaceId === workspace.id ? jurisdictionAction('返回案卷 ' + task.id,'cases/' + encodeURIComponent(task.id),'file') : '';
    return jurisdictionHeading(workspace.name,home + '<span aria-current="page">工作区</span>','演示工作区',back) +
      jurisdictionRules(workspace);
  }
  if (!Object.hasOwn(provinces,id) || !Object.hasOwn(districts[id] || {},segment)) {
    return jurisdictionHeading('找不到府州治所',home + '<span aria-current="page">府州</span>') +
      '<div class="jurisdiction-empty"><h2>这个府州没有出现在版图中</h2>' +
      jurisdictionAction('返回王朝版图','atlas','map') + '</div>';
  }
  const name = districts[id][segment];
  const districtRoute = 'atlas/' + encodeURIComponent(id) + '/' + encodeURIComponent(segment);
  const workspace = workspaceForDistrict(id,segment);
  const heading = jurisdictionHeading(jurisdictionDistrictTitle(name),home + link(provinces[id].name + '省','atlas/' + encodeURIComponent(id)) +
    icon('next') + '<span aria-current="page">' + esc(name) + '</span>','',jurisdictionAction('返回' + name,districtRoute,'map'));
  if (!workspace) {
    return heading + '<section class="jurisdiction-empty"><h2>工作区待绑定</h2>' +
      '<p>绑定后可查看本府州的工作区规则和成果位置。</p></section>';
  }
  return heading + jurisdictionWorkspaceCard(workspace) + jurisdictionRules(workspace,jurisdictionLocation(id,segment));
}
