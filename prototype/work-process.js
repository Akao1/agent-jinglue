'use strict';

const workOrdinarySteps = [
  {key:'idle',label:'开工'},
  {key:'active',label:'办理'},
  {key:'review',label:'验收'},
  {key:'done',label:'办结'},
];

function workProcessDependencies(task, pendingShown) {
  const pending = new Set(unresolved(task));
  const ids = pendingShown ? task.needs.filter(id => !pending.has(id) || !get(id)) : task.needs;
  if (!ids.length) return '';
  return '<div class="work-process-dependencies"><h4>前置案卷</h4><ul>' + ids.map(id => {
    const prerequisite = get(id);
    if (!prerequisite) return '<li><span>' + esc(id) + '</span><span class="work-process-wait">找不到案卷</span></li>';
    const target = workCaseRoute(prerequisite).replace(/^#/, '');
    return '<li><a href="#' + esc(target) + '">' + esc(prerequisite.title) + '</a>' +
      '<span class="' + (pending.has(id) ? 'work-process-wait' : '') + '">' + esc(status(prerequisite)[0]) + '</span></li>';
  }).join('') + '</ul></div>';
}

function workProcessReturnBranches(task) {
  const events = (task.flow?.events || []).filter(event =>
    ['封驳退回','用户退回'].includes(event.label) && event.reason && event.version < task.flow.version);
  if (!events.length) return '';
  return '<li class="work-process-history"><ul class="work-process-branches" aria-label="此前退回记录">' + events.map(event =>
    '<li class="work-process-return"><strong>第 ' + esc(event.version) + ' 版 ' + esc(event.label) +
    '</strong><span>' + esc(event.reason) + '</span></li>'
  ).join('') + '</ul></li>';
}

function workProcessGroup(label, rows) {
  if (!rows.length) return '';
  return '<li class="work-process-group"><details><summary>' + label + ' ' + rows.length + ' 步</summary>' +
    '<ol>' + rows.join('') + '</ol></details></li>';
}

function renderWorkProcess(task) {
  if (!task) return '';
  const stage = stageOf(task);
  const steps = task.flow ? [...formalSteps,{key:'done',label:'办结'}]
    : stage === 'independent' ? [{key:'independent',label:'独立复核'},{key:'done',label:'办结'}]
    : stage === 'archived' ? [...workOrdinarySteps,{key:'archived',label:'归档'}] : workOrdinarySteps;
  const current = steps.findIndex(step => step.key === stage);
  const complete = stage === 'done' || stage === 'archived';
  const blocked = !complete && unresolved(task).length > 0 && (task.flow ? stage === 'dispatch' : stage !== 'independent');
  const currentLabel = complete ? '已完成' : blocked ? '等待前置' : esc(status(task)[0]);
  const rows = steps.map((step,index) => {
    const state = index < current ? 'past' : index === current ? 'current' : 'future';
    const marker = state === 'past' || (state === 'current' && complete) ? icon('check') : '';
    const active = state === 'current';
    const actor = active && !complete ? '<span class="work-process-actor">' + esc(centerOfficer(task)) + '</span>' : '';
    return '<li class="work-process-node" data-state="' + state + '"><div class="work-process-row"' +
      (active ? ' aria-current="step"' : '') + '>' +
      '<span class="work-process-dot" aria-hidden="true">' + marker + '</span><strong>' + esc(step.label) +
      '</strong>' + actor + (active ? '<span class="work-process-state">' + currentLabel + '</span>' : '') + '</div></li>';
  });
  return '<section class="work-process" aria-labelledby="work-process-title">' +
    '<h3 id="work-process-title">办理流程</h3>' + workProcessDependencies(task,blocked) +
    '<ol class="work-process-tree">' + workProcessGroup('已完成',rows.slice(0,Math.max(0,current))) +
    (rows[current] || '') + workProcessReturnBranches(task) +
    workProcessGroup('后续',rows.slice(current + 1)) + '</ol></section>';
}
