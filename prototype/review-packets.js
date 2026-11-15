'use strict';

const reviewExamples = {
  'YL-012':{
    title:'样片发布说明 · 第 1 版',
    body:'标题｜20 秒给今天的笔记做个索引\n正文｜给今天留个索引。撕下标签，对齐页角后压实。片尾提示：一翻就到今天这一页。\n配套交付｜20 秒样片、中文字幕、素材来源清单。',
    basis:'脚本已验收。分镜可在本页预览，最终版本以分镜验收记录为准。',
    effect:'尚书复核后，只派办准备发布材料和记录交付。上传、发送、正式发布均须另案批准。',
    sources:['YL-001','YL-002','YL-004'],
    storyboard:true
  },
  'YL-013':{
    title:'调整交付清单 · 第 1 版',
    body:'保留 PDF 汇总和验收清单，删除可编辑源稿。增加一页“版本与变更”表，表中列出名称、变更理由和适用范围。',
    basis:'需求锁定记录与第一版交付清单。',
    effect:'仅准备改版清单。发送给外部接收人仍需另批。',
    sources:['YL-017']
  },
  'YL-033':{title:'交办规则改动稿',body:'现行条目：交办后手工记录经手人。拟改为：创建案卷时登记经手人和验收条件；缺条件时留在待补材料。',basis:'以旧交办案卷的字段和办理记录为参照。',effect:'仅拟订变更草稿并登记差异；全局规则需另行发布。',sources:['YL-027']},
  'YL-034':{title:'对外材料修订稿',body:'送审说明：本轮交付覆盖版本标注与材料核对。新增变更摘要，删除无授权的内部参考内容。',basis:'需求锁定与已登记的交付范围。',effect:'整理改版文件，不进行外发。',sources:['YL-017']},
  'YL-035':{title:'测试资源开通拟案',body:'拟在演示环境开一份临时评测空间。只跑三条合成输入，记录执行条件，测试结束释放资源。',basis:'用单 API 起步案卷核测试目的和退出条件。',effect:'记录示范配置及配额，任何真实购买或开通需另行批准。',sources:['YL-030']},
  'DS-001':{title:'栏目样片送审清单',body:'送审包内放 20 秒样片、中文字幕和素材清单，各件标同一版本。版权待查的截图不纳入。',basis:'核对栏目选题与第二集分镜。',effect:'尚书核范围后只派办准备送审包。',sources:['YL-014','YL-015']},
  'DS-002':{title:'评测资源执行单',body:'运行三条脱敏演示输入，保留模型、配置、时延和原输出。失败样本另记响应，不作通过处理。',basis:'模型评测案与演示配额记录。',effect:'限演示环境，不新增真实额度。',sources:['YL-019']},
  'DS-003':{title:'交付材料补验清单',body:'交付表 v2，新增列“责任席位”和“适用用途”。清单行一为 PDF 汇总，行二为验收单，二者附版本号。',basis:'查需求锁定及材料核对的原案记录。',effect:'仅确认本版清单完整，外发范围无变更。',sources:['YL-017','YL-018']},
  'DS-004':{title:'运行记录抽验单',body:'检查项一：被测版本能回查。检查项二：原始失败与重试分开记。检查项三：有明确的回退文件和验证入口。',basis:'运行日志及维护异常排查案。',effect:'抽验只记结论和证据，不启动服务、不改部署。',sources:['YL-031','YL-032']},
  'DS-005':{title:'短篇引文复验表',body:'条目一为自写引语。条目二为章内人物转述。两处均已标注段落，保留原稿版本。',basis:'短篇开场与旧稿留存可对照。',effect:'记录演示验收与抽验结果。',sources:['YL-023','YL-024']},
  'DS-006':{title:'议事提要共享草案',body:'拟把议事提要分享给协作席位。初稿仅列分享提要，接收者和可披露字段尚未列出。',basis:'已登记的对话要点。',effect:'原稿申请范围不清，已封驳待重拟。',sources:['YL-025']},
  'DS-007':{title:'连载提纲外审申请',body:'拟让外部审阅者检查连载章节结构。初稿随附完整提纲。',basis:'人物设定与章节节奏记录。',effect:'用户要求缩到提纲节选，原稿已退回。',sources:['YL-021','YL-022']},
  'DS-008':{title:'验收依据补正单',body:'为验收项补入材料版本、核对位置和负责人。对未核实的来源标记待核。',basis:'已有交付复核案的缺项记录。',effect:'限补写验收清单，不更改先前验收结论。',sources:['YL-008']},
  'DS-009':{title:'隔离说明复验单',body:'并排对照补正前后的隔离说明。记录当前受控目录、验证证据和尚未实测的边界。',basis:'权限边界复核、单 API 起步原案。',effect:'仅提交复验依据，未授权读写其他工作区。',sources:['YL-029','YL-030']}
};

function reviewPacket(task, version = task.flow?.version) {
  if (!version) return null;
  const saved = task.reviewMaterials?.[version];
  if (saved?.body?.trim() && saved?.basis?.trim() && saved?.effect?.trim()) {
    return {...saved,version};
  }
  if (version === 1 && Object.hasOwn(reviewExamples,task.id)) {
    return {...reviewExamples[task.id],version};
  }
  return null;
}

function reviewNeedsPacket(step) {
  return ['draft','review','approval'].includes(step);
}

function reviewMayEdit(task) {
  return ['council','draft'].includes(task.flow?.stage);
}

function reviewMaterialStamp(task) {
  const packet = reviewPacket(task);
  return packet ? JSON.stringify([task.id,packet.version,scopeFor(task),packet]) : '';
}

function reviewParagraphs(text) {
  return text.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => '<p>' + esc(line) + '</p>').join('');
}

function reviewSourceLinks(packet) {
  return (packet.sources || []).map(id => {
    const task = get(id);
    return task ? '<li>' + link(task.title,'cases/' + encodeURIComponent(id),'file') +
      '<small>' + esc(id) + '　' + esc(status(task)[0]) + '</small></li>' : '';
  }).join('');
}

function reviewMaterialEditor(task,packet) {
  return '<form class="form review-material-form" id="review-material-form" data-task="' + esc(task.id) +
    '" data-version="' + task.flow.version + '">' +
    '<label class="field">送审正文<textarea name="body" required maxlength="1200">' + esc(packet?.body || '') + '</textarea></label>' +
    '<label class="field">依据与来源<textarea name="basis" required maxlength="800">' + esc(packet?.basis || '') + '</textarea></label>' +
    '<label class="field">批准后动作与边界<textarea name="effect" required maxlength="600">' + esc(packet?.effect || '') + '</textarea></label>' +
    '<button type="submit" class="button primary">' + icon('check') + '保存本版材料</button></form>';
}

function renderFormalMaterials(task,packet) {
  const version = task.flow.version;
  const old = Array.from({length:Math.max(0,version-1)},(_,i)=>reviewPacket(task,i+1)).filter(Boolean).reverse();
  const history = old.length ? '<details class="review-history"><summary>历史送审材料</summary>' + old.map(item =>
    '<article><h3>第 ' + item.version + ' 版 · ' + esc(item.title) + '</h3>' + reviewParagraphs(item.body) +
    '<p>' + esc(item.effect) + '</p></article>').join('') + '</details>' : '';
  const editor = reviewMayEdit(task) ? reviewMaterialEditor(task,packet) : '';
  if (!packet) {
    return '<section class="sheet review-doc" aria-labelledby="review-material-title"><h2 id="review-material-title" tabindex="-1">第 ' +
      version + ' 版缺少送审材料</h2>' + (editor || '<p>这一版尚无正文、依据和办理边界。请退回补件。</p>') +
      history + '</section>';
  }
  const sources = reviewSourceLinks(packet);
  return '<section class="sheet review-doc" aria-labelledby="review-material-title"><header class="review-doc-header"><div>' +
    '<p>送审材料 · 第 ' + packet.version + ' 版</p><h2 id="review-material-title" tabindex="-1">' + esc(packet.title) + '</h2></div>' +
    '<span>演示</span></header><div class="review-artifact">' + reviewParagraphs(packet.body) + '</div>' +
    (packet.storyboard ? reviewStoryboard() : '') +
    '<section class="review-sources"><h3>依据</h3><p>' + esc(packet.basis) + '</p>' +
    (sources ? '<ul>' + sources + '</ul>' : '') + '</section>' +
    (editor ? '<details class="review-history"><summary>编辑本版材料</summary>' + editor + '</details>' : '') +
    history + '</section>';
}

const ordinaryReviewExamples = {
  'EX-001':'模拟卷复盘｜限时 45 分钟，30 题答对 24 题。\n审题失误 4 道：两题漏读否定词，两题遗漏单位。\n知识点遗漏 2 道：一题混淆定义，一题套用条件错误。二刷分别按这两组练习。',
  'YL-022':'审读摘录｜主角先拿到仓库钥匙，再从门缝听见争执。\n修订建议｜把“先听见争执”提前一段，并补一句钥匙的来历。否则读者会误以为主角已进入仓库。\n核对点｜上章末主角尚未见到钥匙，本章第三段补足交接。',
  'YL-027':'交办模板｜产出：一页对比表。输入：已获准的两个样例。验收：每条差异对应来源。\n适用范围｜资料齐备且可独立验收的小任务。跨工作区读取与外发另行核授权。'
};

function ordinaryReviewBody(task) {
  return task.deliveryBody?.trim() || ordinaryReviewExamples[task.id] || '';
}

function hasOrdinaryMaterial(task) {
  return task.id === 'YL-002' || Boolean(ordinaryReviewBody(task));
}

function ordinaryDeliveryEditor(task,action = 'submit') {
  const label = action === 'save-delivery' ? '保存交付材料' : '提交演示交付';
  return '<div class="review-delivery-editor"><label class="field">交付正文<textarea name="delivery-body" maxlength="1200" ' +
    'placeholder="粘贴可直接核对的成果、摘录或验收记录"></textarea></label><div class="actions">' +
    button(label,action,task.id,true,'file') + '</div></div>';
}
const formalDeliveryExamples = {
  'DS-003':'交付清单 v2\nPDF 汇总｜责任席位：礼部｜用途：内部对照\n验收单｜责任席位：刑部｜用途：核对交付件及版本',
  'DS-004':'演示运行记录\n被测版本：demo-04。第一次启动失败，重新载入样例配置后可打开。回退入口为上一演示版本。未验证真实服务。',
  'DS-005':'演示引用表\n第二段：自写引语，正文第 2 段。第六段：人物转述，正文第 6 段。两条均已对照当前稿件。',
  'DS-009':'演示补正记录\n已把允许读取的示例目录和禁止外发的范围分列。旧说明原有条目仍可按案号查看。尚待独立复验。'
};

function formalDeliveryBody(task) {
  const saved = task.formalDelivery;
  if (saved?.version === task.flow.version) return saved.body;
  return task.flow.version === 1 ? formalDeliveryExamples[task.id] || '' : '';
}

function formalDeliveryField() {
  return '<label class="field reason">交付正文<textarea name="formal-delivery-body" maxlength="1200" ' +
    'placeholder="填入可核对的成果或验收记录"></textarea></label>';
}
