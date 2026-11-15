'use strict';

const workTreeDisclosure = new Map();

function workTreeGroups(tasks) {
  const groups = new Map();
  for (const task of tasks) {
    const province = task.province;
    const district = districtKey(task);
    if (!groups.has(province)) groups.set(province,new Map());
    const branches = groups.get(province);
    if (!branches.has(district)) branches.set(district,[]);
    branches.get(district).push(task);
  }
  return groups;
}

function workTreeLeaf(task,selected,mode) {
  return '<li><a class="work-tree-leaf" data-case-id="' + esc(task.id) + '" href="#' + esc(workCaseRoute(task,mode)) + '"' +
    (task.id === selected?.id ? ' aria-current="location"' : '') + '>' + icon('file') +
    '<span class="work-tree-leaf-title">' + esc(task.title) + '</span>' + badge(task) + '</a></li>';
}

function workTreeBranch(key,label,count,containsSelected,content,level) {
  const open = containsSelected || workTreeDisclosure.get(key) === true;
  return '<li><details class="work-tree-branch work-tree-' + level + '" data-work-branch="' + esc(key) + '"' +
    (open ? ' open' : '') + '><summary><span class="work-tree-toggle">' + icon('next') + '</span><span>' +
    esc(label) + '</span><span class="work-tree-count">' + count + '</span></summary>' + content + '</details></li>';
}

function renderWorkTree(tasks,selected,mode,pendingCount) {
  const mine = mode === 'mine';
  const groups = workTreeGroups(tasks);
  const body = [...groups].map(([province,branches]) => {
    const name = provinces[province]?.name;
    const provinceLabel = name ? name + '省' : '待归属';
    const provinceKey = 'province:' + province;
    let count = 0;
    const branchMarkup = [...branches].map(([district,items]) => {
      count += items.length;
      const districtLabel = districts[province]?.[district] || '待归属案卷';
      const active = selected?.province === province && districtKey(selected) === district;
      return workTreeBranch(provinceKey + '/district:' + district,districtLabel,items.length,active,
        '<ul class="work-tree-leaves">' + items.map(task => workTreeLeaf(task,selected,mode)).join('') + '</ul>','district');
    }).join('');
    return workTreeBranch(provinceKey,provinceLabel,count,selected?.province === province,
      '<ul class="work-tree-districts">' + branchMarkup + '</ul>','province');
  }).join('');
  const showCount = Number.isInteger(pendingCount) && pendingCount > 0;
  return '<aside class="work-tree" id="work-tree" aria-labelledby="work-tree-heading"><header class="work-tree-head">' +
    '<h2 id="work-tree-heading">业务树</h2><nav class="work-tree-filters" aria-label="业务范围">' +
    '<a href="#center"' + (!mine ? ' aria-current="page"' : '') + '>全部业务</a>' +
    '<a href="#center/mine"' + (mine ? ' aria-current="page"' : '') + '>待我处理' +
    (showCount ? '<span class="work-tree-filter-count">' + pendingCount + '</span>' : '') + '</a></nav></header>' +
    (body ? '<ul class="work-tree-items">' + body + '</ul>' :
      '<p class="work-tree-empty">' + (mine ? '暂时没有需要你处理的案卷。' : '尚未交办业务。') + '</p>') + '</aside>';
}

document.addEventListener('click',event => {
  const summary = event.target.closest('.work-tree-branch > summary');
  if (!summary || event.defaultPrevented) return;
  const branch = summary.parentElement;
  workTreeDisclosure.set(branch.dataset.workBranch,!branch.open);
});
