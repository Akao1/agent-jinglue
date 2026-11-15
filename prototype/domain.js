'use strict';

const provinces = {
  video: {name:'视频制作',region:'样片府'},
  work: {name:'工作',region:'工作台州'},
  study: {name:'学习',region:'备考州'},
  writing: {name:'写作',region:'长篇府'},
  chat: {name:'聊天',region:'议事府'},
  projects: {name:'项目研发',region:'经略府'},
};

const districts = {
  video: {sample:'样片府', series:'栏目州'},
  work: {studio:'工作台州', client:'交付府'},
  study: {exam:'备考州', model:'模型研习府'},
  writing: {serial:'长篇府', drafts:'短篇州'},
  chat: {notes:'议事府', methods:'方法州'},
  projects: {jinglue:'经略府', maintenance:'运维州'},
};

const districtKey = task => Object.hasOwn(districts[task.province] || {}, task.district)
  ? task.district : Object.keys(districts[task.province] || {})[0];
const districtName = task => districts[task.province]?.[districtKey(task)] || '待归属';
const caseRegion = task => provinces[task.province].name + '省 / ' + districtName(task);

function mountProvince(item) {
  provinces[item.key] = {name:item.name, region:item.district};
  districts[item.key] = {first:item.district};
}

function sample(id, province, district, title, stage, owner, note, check, needs = []) {
  return {id,province,district,title,stage,owner,note,check,needs,
    ...(['done','review','archived'].includes(stage) ? {evidence:title + '记录.md'} : {})};
}

function formalSample(task, steps = []) {
  task.flow = createFlow();
  for (const step of steps) advanceFormal(task,step,'',null);
  return task;
}

const studyExamSeed = [
  sample('EX-001','study','exam','限时模拟卷复盘','review','刑部',
    '核对一份演示试卷。30 题答对 24 题，用时 45 分钟。6 道错题中，4 道为审题失误，2 道为知识点遗漏。',
    '分数、用时和六道错题的归因均能回查。',['YL-010']),
  sample('EX-002','study','exam','薄弱章节二刷','idle','礼部',
    '按已验收的复盘选取薄弱题型，重做审题失误和知识点遗漏两组题。',
    '提交每组练习、错因和改法。',['EX-001']),
  sample('EX-003','study','exam','周末限时复测','idle','刑部',
    '二刷完成后做一组等量模拟题，对比两轮成绩、用时和重复错因。',
    '保留两轮数据和仍待练习的题型。',['EX-002']),
  sample('EX-004','study','exam','上周诊断复盘','archived','户部',
    '保留第一轮演示诊断的成绩和学习计划，供县志查回。',
    '诊断记录可追溯到原案。'),
];

const expansion = [
  formalSample(sample('YL-033','chat','methods','修订交办规则','formal','吏部','拟定一条新的交办规则。','说明修改范围和撤回方法。')),
  formalSample(sample('YL-034','work','client','修订对外材料','formal','礼部','准备对外材料的新版本。','版本与适用渠道可核。'),['council']),
  formalSample(sample('YL-035','projects','jinglue','开通测试资源','formal','工部','拟开通一项测试资源。','资源额度和退出条件明确。'),['council','draft']),
  {...sample('YL-013','work','client','调整交付范围','formal','礼部','准备变更后的交付清单。','责任范围、替代交付和验收要求一致。',['YL-017']),
    flow:createFlow(true),formalKind:'交付范围变更演练'},
  sample('YL-014','video','series','栏目选题','done','礼部','筛定一期栏目主题。','确认主题与受众。'),
  sample('YL-015','video','series','第二集分镜','active','礼部','拆出镜头与转场。','为每个镜头补充场景。',['YL-014']),
  sample('YL-016','video','series','试剪复盘','idle','工部','整理试剪问题。','标注返工位置。',['YL-015']),
  sample('YL-017','work','client','需求锁定','done','礼部','记录双方确认的需求。','范围与验收条件可回查。'),
  sample('YL-018','work','client','材料核对','idle','刑部','对照改版后的交付清单。','逐项核对成品与清单。',['YL-013']),
  sample('YL-019','study','model','模型评测','active','工部','用示例集对比模型表现。','记录结果及失败样本。'),
  sample('YL-020','study','model','评测复盘','idle','刑部','提炼三类错误。','把错误与案例关联。',['YL-019']),
  sample('YL-021','writing','serial','人物设定','done','礼部','定稿人物小传。','角色目标和动机可回查。'),
  sample('YL-022','writing','serial','章节节奏','review','刑部','核对章节转折。','情节转折和人物行动有依据。',['YL-021']),
  sample('YL-023','writing','drafts','短篇开场','active','礼部','修改短篇首段。','首段交代视角与冲突。'),
  sample('YL-024','writing','drafts','旧稿留存','archived','户部','保存初稿的版本记录。','版本号与原稿可定位。'),
  sample('YL-025','chat','notes','对话要点','done','户部','标记有后续动作的对话。','要点关联示例对话。'),
  sample('YL-026','chat','notes','整理待办','idle','吏部','合并相同待办。','每项待办有来源和下一步。',['YL-025']),
  sample('YL-027','chat','methods','方法复盘','review','礼部','整理一份有效的交办模板。','列出适用边界与实例。'),
  sample('YL-028','chat','methods','会话归档','archived','户部','把已结束主题收入县志。','记录原会话出处。'),
  sample('YL-029','projects','jinglue','权限边界复核','independent','门下省','核对示例工作区允许的动作。','需要合格的独立复核者。'),
  sample('YL-030','projects','jinglue','单 API 起步','active','工部','拟定模型连接的首启步骤。','可独立完成示例任务。'),
  sample('YL-031','projects','maintenance','排查入库异常','active','工部','复现示例索引中断。','错误分支能回到安全重试。'),
  sample('YL-032','projects','maintenance','维护日志','done','吏部','记录维护器异常与恢复时点。','状态有版本和时间证据。'),
];
