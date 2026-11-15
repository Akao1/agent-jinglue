'use strict';

function workflowDemoCases() {
  const throughApproval = ['council','draft','review','approval'];
  const throughDispatch = [...throughApproval,'dispatch'];
  const throughExecution = [...throughDispatch,'execute'];
  const throughAcceptance = [...throughExecution,'verify'];
  const make = (id,province,district,title,owner,note,check,steps) =>
    formalSample({...sample(id,province,district,title,'formal',owner,note,check),
      formalKind:'正式流程演练'},steps);
  const veto = make('DS-006','chat','notes','议事记录共享范围','吏部',
    '拟给协作席位提供议事提要。门下复核发现范围未写清，退回内阁重拟。',
    '列明接收者、可提供的内容和保留期限。',['council','draft']);
  advanceFormal(veto,'veto','题本缺少接收席位与允许披露的材料清单。',null);
  const returned = make('DS-007','writing','serial','连载提纲外审','礼部',
    '拟请外部审阅者核对章节结构。上一版提请批准时，用户要求缩小范围。',
    '只提供提纲节选，并留存用户批准范围。',['council','draft','review']);
  advanceFormal(returned,'return','外审仅提供提纲节选，按新范围重新提交。',null);
  return [
    make('DS-001','video','series','栏目样片送审','礼部',
      '第 1 版已获演示批准，待尚书核对授权后派办。',
      '送审清单与批准范围一致。',throughApproval),
    make('DS-002','study','model','评测资源启用演练','工部',
      '已派给工部，按已批准的演示配额准备评测运行记录。',
      '记录配置、用量和退出条件。',throughDispatch),
    make('DS-003','work','client','交付材料补验','礼部',
      '交付清单已提交，待核对材料版本与批准范围。',
      '每项材料有版本、责任席位和用途。',throughExecution),
    make('DS-004','projects','maintenance','运行记录抽验','工部',
      '维护交付已验收，等待台院检查记录是否可回查。',
      '可查版本、运行记录和回退依据。',throughAcceptance),
    make('DS-005','writing','drafts','短篇引用清单复验','礼部',
      '样例已完成验收和抽验，引用记录可从案卷查回。',
      '逐项核对引用内容、来源和允许用途。',[...throughAcceptance,'post']),
    veto, returned,
    make('DS-008','work','studio','补齐验收依据','刑部',
      '关联一条已核证的监督样例，纠正验收依据缺失。',
      '补列可核对的验收依据与原案引用。',throughApproval),
    make('DS-009','projects','jinglue','隔离说明补正复验','工部',
      '示例整改已验收，等待复验补正后的隔离说明。',
      '校对补正记录、原版本与独立复验依据。',throughAcceptance),
  ];
}

const workflowOversightSamples = [
  {id:'SC-001',label:'待独立核证',tone:'pending',task:'YL-029',office:'大理寺',
    title:'权限边界说明待核',
    basis:'原案记录了独立复核要求，察院已登记线索。',
    next:'等待符合独立条件的核证者核对原案。'},
  {id:'SC-002',label:'待补证',tone:'pending',task:'YL-031',office:'大理寺',
    title:'重试记录缺少失败时点',
    basis:'已提交重试结果，首次故障时点和原始记录缺失。',
    next:'向察院索取故障日志及对应运行编号，补齐后再核证。'},
  {id:'SC-003',label:'不属实',tone:'done',task:'YL-017',office:'大理寺',
    title:'需求确认日期疑点排除',
    basis:'复核使用的版本与原件一致，双方确认日期能够对照。',
    next:'保留反证和核证意见，结束本条疑点。'},
  {id:'SC-004',label:'属实，已移交',tone:'active',task:'YL-008',related:'DS-008',office:'内阁',
    title:'验收依据不完整',
    basis:'演示原卷确实未列齐要求的验收依据，已登记补正案。',
    next:'由内阁协调补正，完成后由台院另行复验。'},
  {id:'SC-005',label:'整改待复验',tone:'active',task:'YL-030',related:'DS-009',office:'台院',
    title:'隔离说明已补正',
    basis:'补正案已提交并验收，仍需独立对照原版本和补正记录。',
    next:'等待台院复验，未取得复验证据前保留监督记录。'},
  {id:'SC-006',label:'已销案',tone:'done',task:'YL-023',related:'DS-005',office:'台院',
    title:'短篇引文出处已核对',
    basis:'补正清单和独立复验结论均已留在演示案卷。',
    next:'归档原案、补正案和复验依据，供后续查回。'},
];

function workflowDemoGroups() {
  const cases = (title, rows) => ({
    title,
    rows:rows.map(([label,description,id]) => ({label,description,route:'cases/' + id})),
  });
  return [
    cases('普通办理',[
      ['可开拓','整理错题可直接开工。','YL-009'],
      ['未接壤','薄弱章节二刷等待模拟卷复盘验收。','EX-002'],
      ['办理中','模型评测正在整理结果与失败样本。','YL-019'],
      ['待验收','限时模拟卷复盘含可核对的交付和条件。','EX-001'],
      ['待独立复核','权限边界复核需要独立席位。','YL-029'],
      ['领地','章节练习已验收，可回查。','YL-010'],
      ['熟地','已归档的诊断复盘可从县志查回。','EX-004'],
    ]),
    cases('正式事项',[
      ['待票拟','交办规则修订待内阁明确范围。','YL-033'],
      ['待题本','对外材料已票拟，待中书预拟题本。','YL-034'],
      ['待门下复核','测试资源开通待核对范围。','YL-035'],
      ['待朱批','样片对外发布等待用户明确决定。','YL-012'],
      ['待派办','栏目样片已获批准，尚书待派。','DS-001'],
      ['六部执行','工部按已批准配额准备评测记录。','DS-002'],
      ['待验收','交付材料已提交，核对版本与责任席位。','DS-003'],
      ['待抽验','验收后的运行记录待台院抽验。','DS-004'],
      ['已完成','短篇引用清单验收和抽验均完成。','DS-005'],
      ['封驳退回','查看第 1 版封驳理由和第 2 版待重拟状态。','DS-006'],
      ['用户退回','用户要求缩小外审范围，重新票拟。','DS-007'],
    ]),
    {title:'监察样例',rows:
      workflowOversightSamples.map(record => ({
        label:record.label,description:record.title,route:'audit/examples/' + record.id,
      }))},
  ];
}
