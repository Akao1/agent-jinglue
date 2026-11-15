'use strict';

const courtOffices = [
  {
    key:'throne', name:'御前', zone:'御前',
    mission:'审阅拟议、授权范围和验收条件。',
    boundary:'朱批权归 用户。每次批示绑定案号、版本和范围。',
    actionLabel:'查看待我批示', actionRoute:'center/approvals',
    empty:'当前没有等你批示的案卷。',
  },
  {
    key:'cabinet', name:'内阁', zone:'中枢三省', stage:'council',
    mission:'拟定办什么、交给谁办，留存会签与分歧。',
    boundary:'议定的方案经中书拟题本、门下复核，再按范围取得授权。',
    actionLabel:'查看待票拟', actionRoute:'center/office-council',
    empty:'当前没有待票拟的案卷。',
  },
  {
    key:'secretariat', name:'中书省', zone:'中枢三省', stage:'draft',
    mission:'把拟议写成题本，列明执行范围和验收条件。',
    boundary:'主办路由沿用内阁拟议，题本经门下复核后提请批准。',
    actionLabel:'查看待题本', actionRoute:'center/office-draft',
    empty:'当前没有待预拟题本的案卷。',
  },
  {
    key:'review', name:'门下省', zone:'中枢三省', stage:'review',
    mission:'复核权限、票拟、证据及分歧，符合条件时签发封驳。',
    boundary:'门下审核通过后，须朱批的案卷呈 用户 决定。',
    actionLabel:'查看待审核', actionRoute:'center/office-review',
    secondaryLabel:'查看独立复核要求', secondaryRoute:'center/audit',
    empty:'当前没有待门下审核的票拟。',
  },
  {
    key:'dispatch', name:'尚书省', zone:'中枢三省', stage:'dispatch',
    mission:'核对已生效的授权，把案卷派给责任部门。',
    boundary:'派办须核当前案号、版本、范围与前置任务。',
    actionLabel:'查看待派办', actionRoute:'center/office-dispatch',
    empty:'当前没有获准待派办的案卷。',
  },
  {
    key:'personnel', name:'吏部', zone:'六部',
    mission:'登记案卷台账、记忆和现行规则，保留版本及依据。',
    boundary:'项目事实留原工作区，修订规则须经 用户 朱批。',
    actionLabel:'查看吏部经办', actionRoute:'center/dept-0',
    secondaryLabel:'查找案卷台账', secondaryRoute:'search',
    empty:'当前没有吏部经办案卷。',
  },
  {
    key:'revenue', name:'户部', zone:'六部',
    mission:'管理资料来源，核对库内证据与原文位置。',
    boundary:'时效及库外查证交探查司，索引缺口须如实标明。',
    actionLabel:'查看户部经办', actionRoute:'center/dept-1',
    secondaryLabel:'按案号找资料', secondaryRoute:'search',
    empty:'当前没有户部经办案卷。',
  },
  {
    key:'rites', name:'礼部', zone:'六部',
    mission:'负责文稿、内容和设计交付，核对体裁与要求。',
    boundary:'成稿进入验收，对外发布沿适用的授权流程。',
    actionLabel:'查看礼部经办', actionRoute:'center/dept-2',
    empty:'当前没有礼部经办案卷。',
  },
  {
    key:'war', name:'兵部', zone:'六部',
    mission:'办理业务产品开发和修复，提交实施成果。',
    boundary:'按已批准的任务范围实施，交刑部核验实际行为。',
    actionLabel:'查看兵部经办', actionRoute:'center/dept-3',
    empty:'当前没有兵部经办案卷。',
  },
  {
    key:'justice', name:'刑部', zone:'六部',
    mission:'核验任务内的行为、测试结果和交付证据。',
    boundary:'测试通过是验收依据，发布和独立复核另核实际授权与身份。',
    actionLabel:'查看刑部经办', actionRoute:'center/dept-4',
    empty:'当前没有刑部经办案卷。',
  },
  {
    key:'works', name:'工部', zone:'六部',
    mission:'维护工具、运行环境和归档链路。',
    boundary:'运行状态按实际环境验收，归档须留版本和回退依据。',
    actionLabel:'查看工部经办', actionRoute:'center/dept-5',
    secondaryLabel:'查看执行者', secondaryRoute:'settings',
    empty:'当前没有工部经办案卷。',
  },
  {
    key:'censor', name:'御史台', zone:'监察与典籍',
    mission:'统看巡按发现、待核证事项和抽验结果。',
    boundary:'察院上报，大理寺核证，台院独立复验。正式封驳由门下签发。',
    actionLabel:'查看监察总览', actionRoute:'audit',
    empty:'当前没有待抽验案卷，可在监察总览查阅发现和分流。',
  },
  {
    key:'investigation', name:'察院', zone:'监察与典籍',
    mission:'查漏办、越权、错归与证据问题，附依据上报。',
    boundary:'报告留作疑点，交大理寺按案核证。需要封驳时向门下提请。',
    actionLabel:'查看上报记录', actionRoute:'audit/reports', secondaryLabel:'查看巡按建议', secondaryRoute:'audit',
    empty:'当前没有正式上报案卷，巡按建议单独查看。',
  },
  {
    key:'recheck', name:'台院', zone:'监察与典籍', stage:'post',
    mission:'抽验发布后的交付，核档并独立复验整改结果。',
    boundary:'结案以原整改证据和合格复验身份为准。',
    actionLabel:'查看待抽验', actionRoute:'audit/rechecks',
    empty:'当前没有待抽验案卷。',
  },
  {
    key:'dali', name:'大理寺', zone:'监察与典籍',
    mission:'独立核对监察报告的事实、证据与回避关系。',
    boundary:'核实属实后交内阁拟处置。涉及内阁或门下时呈 用户。',
    actionLabel:'查看待核证', actionRoute:'audit/verification',
    empty:'当前没有进入大理寺核证队列的监察报告。',
  },
  {
    key:'hanlin', name:'翰林院', zone:'监察与典籍',
    mission:'整理实录与史鉴，提名经验证的方法入国史。',
    boundary:'正式收录须由御史核档，再由 用户 朱批。',
    actionLabel:'查看国史提名', actionRoute:'office-records/hanlin',
    secondaryLabel:'查阅国史馆', secondaryRoute:'history',
    empty:'国史提名与史鉴收在翰林档案。',
  },
  {
    key:'scout', name:'探查司', zone:'监察与典籍',
    mission:'查证库外时效事实，整理带日期与来源的探查帖。',
    boundary:'查证结果供办差引用，按实际渠道记录出处。',
    actionLabel:'查看探查帖', actionRoute:'office-records/scout',
    secondaryLabel:'查阅综合周报', secondaryRoute:'weekly',
    empty:'探查帖和出处收在探查司档案。',
  },
  {
    key:'history', name:'国史馆', zone:'监察与典籍',
    mission:'从县志找回已归档案卷，查阅已正式收录的方法。',
    boundary:'县志按所属府州留存，正式国史以批准记录为准。',
    actionLabel:'查看县志', actionRoute:'history',
    empty:'当前没有可查的县志案卷。',
    queueLabel:'已归档县志',
  },
];

function courtOfficeInfo(key) {
  const office = courtOffices.find(item => item.key === key) || courtOffices[0];
  const {work, approvals} = centerQueues();
  let cases = [];
  if (office.key === 'throne') {
    cases = approvals;
  } else if (office.zone === '六部') {
    cases = centerDeptTasks(work, office.name);
  } else if (office.stage === 'post' || office.key === 'censor') {
    cases = state.tasks.filter(task => stageOf(task) === 'post');
  } else if (office.stage) {
    cases = work.filter(task => task.flow && stageOf(task) === office.stage);
  } else if (office.key === 'history') {
    cases = state.tasks.filter(task => stageOf(task) === 'archived');
  }
  const findings = ['censor','investigation','dali'].includes(office.key) ? (state.findings || []) : [];
  return {...office, cases, findings};
}
