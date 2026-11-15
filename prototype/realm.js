'use strict';

const realmGeometry = {
  video: {
    point: [190, 213], hue: 'jade', window: [72, 131, 280, 154],
    path: 'M33 140 Q60 100 104 105 L140 80 190 88 228 65 275 81 313 71 353 94 Q366 131 346 160 Q320 195 343 230 L329 278 Q288 263 257 280 Q224 304 178 290 Q148 284 130 264 Q103 251 73 266 L42 250 Q25 222 39 183Z',
  },
  work: {
    point: [497, 225], hue: 'bronze', window: [353, 145, 294, 162],
    path: 'M353 94 L389 76 440 83 481 64 530 80 570 69 615 83 646 73 Q665 102 647 140 Q628 164 644 195 L635 251 Q610 290 625 325 L606 379 Q561 379 534 349 Q513 325 472 328 Q434 345 396 335 Q351 332 345 301 L329 278 343 230 Q320 195 346 160 Q366 131 353 94Z',
  },
  writing: {
    point: [765, 191], hue: 'slate', window: [645, 120, 287, 158],
    path: 'M646 73 L682 52 731 64 770 49 809 67 860 61 887 83 926 86 Q942 119 927 149 L933 191 916 219 928 252 911 284 Q882 290 855 273 Q825 255 789 267 Q752 285 726 266 Q680 241 635 251 L644 195 Q628 164 647 140 Q665 102 646 73Z',
  },
  study: {
    point: [184, 393], hue: 'pine', window: [49, 333, 292, 161],
    path: 'M42 250 L73 266 Q103 251 130 264 Q148 284 178 290 Q224 304 257 280 Q288 263 329 278 L345 301 Q351 332 396 335 Q368 356 376 389 L355 416 Q336 452 347 478 L322 518 Q296 529 278 555 L228 542 191 554 153 522 117 527 90 490 57 487 64 443 35 406 51 374 27 336 40 306Z',
  },
  chat: {
    point: [486, 446], hue: 'tea', window: [345, 392, 286, 157],
    path: 'M396 335 Q434 345 472 328 Q513 325 534 349 Q561 379 606 379 Q640 370 674 390 L656 432 Q641 454 630 478 L595 487 576 517 539 527 508 554 474 541 431 572 399 551 365 570 326 558 278 555 Q296 529 322 518 L347 478 Q336 452 355 416 L376 389 Q368 356 396 335Z',
  },
  projects: {
    point: [791, 355], hue: 'indigo', window: [630, 280, 284, 156],
    path: 'M635 251 Q680 241 726 266 Q752 285 789 267 Q825 255 855 273 Q882 290 911 284 L925 318 909 349 930 380 923 412 939 436 922 463 889 453 853 471 819 453 786 466 750 501 720 510 696 490 666 524 631 537 598 538 576 517 595 487 630 478 Q641 454 656 432 L674 390 Q640 370 606 379 L625 325 Q610 290 635 251Z',
  },
};

function realmFacts(items) {
  const totals = {total: items.length, handling: 0, waiting: 0, done: 0, archived: 0, approvals: 0};
  for (const item of items) {
    const stage = stageOf(item);
    if (stage === 'archived') totals.archived++;
    else if (stage === 'done') totals.done++;
    else if (stage === 'idle' || status(item)[1] === 'blocked') totals.waiting++;
    else totals.handling++;
    if (stage === 'approval') totals.approvals++;
  }
  return totals;
}

function realmStatusKey(task) {
  const stage = stageOf(task);
  if (stage === 'approval') return 'approval';
  if (stage === 'archived' || stage === 'done') return 'settled';
  if (stage === 'idle' || status(task)[1] === 'blocked') return 'waiting';
  return 'handling';
}

function realmStats(totals) {
  const phases = [['handling','在办'],['waiting','待开工'],['done','领地'],['archived','熟地']];
  return '<dl class="realm-stats" aria-label="县案状态汇总">' + phases.map(([key,name]) =>
    '<div class="realm-stat realm-stat--' + key + '"><dt><i aria-hidden="true"></i>' + name +
    '</dt><dd>' + totals[key] + '</dd></div>'
  ).join('') + '</dl>';
}

function realmTerrain() {
  return '<rect width="960" height="640" fill="#e9e2ca"/>' +
    '<path d="M960 328V640H235L316 621 432 597 512 591 560 566 623 551 699 533 754 504 810 479 881 480 930 446Z" fill="#91b4b1"/>' +
    '<path d="M-8 208C97 210 68 264 129 265S177 319 249 291 321 267 340 309 399 344 469 331 517 340 544 361 580 392 639 379 715 413 782 422 893 435 966 460" fill="none" stroke="#80aaa7" stroke-width="14"/>' +
    '<image href="assets/atlas.webp" width="960" height="640" preserveAspectRatio="none"/>';
}

function realmLabel(label, x, y, meta = '') {
  const half = Math.max(65, Array.from(label).length * 13 + 16);
  const height = meta ? 61 : 47;
  return '<g class="realm-map-label" transform="translate(' + x + ' ' + y + ')" aria-hidden="true">' +
    '<rect x="-' + half + '" y="-30" width="' + (half * 2) + '" height="' + height + '" rx="4"/>' +
    '<path class="realm-map-label-rule" d="M-' + (half - 9) + ' -22v15 M' + (half - 9) + ' -22v15"/>' +
    '<text x="0" y="0">' + esc(label) + '</text>' +
    (meta ? '<text class="realm-map-count" x="0" y="21">' + esc(meta) + '</text>' : '') + '</g>';
}

function realmProvinceAnchor(key) {
  const [x,y,width,height] = realmGeometry[key].window;
  return key === 'work' ? [x + width * .64, y + height * .85] : [x + width * .27, y + height * .77];
}

function realmProvinceSeat(key, name) {
  const [x,y] = realmProvinceAnchor(key);
  return '<a class="realm-province-seat" href="#' + provinceSeatLocation(key) +
    '" aria-label="查看' + esc(name) + '省治" transform="translate(' + x + ' ' + y + ')">' +
    '<title>' + esc(name) + '省治</title><path class="realm-seat-leader" d="M0 0v8"/>' +
    '<circle class="realm-seat-point" r="3.2"/><rect x="-14" y="8" width="68" height="25" rx="5"/>' +
    '<path class="realm-seat-icon" d="M-8 20l7-5 7 5m-12 2h10m-8 1v5m6-5v5m-9 1h12"/>' +
    '<text x="12" y="26">省治</text></a>';
}

function realmMap(entries) {
  const compass = '<g class="realm-compass" transform="translate(909 59)" aria-hidden="true">' +
    '<circle r="23"/><path d="M0-13 5 4 0 1-5 4Z M0 1v12 M-10 8h20"/><text y="-30">北</text></g>';
  const capital = '<a class="realm-hub" href="#court" aria-label="前往京城衙署">' +
    '<rect class="realm-hub-hit" x="393" y="281" width="108" height="54" rx="9"/>' +
    '<g transform="translate(439 313)" aria-hidden="true"><circle r="19"/><path d="M-9-2 0-9 9-2 M-8 1H8 M-6 4v5 M0 4v5 M6 4v5 M-9 10H9"/>' +
    '<text x="26" y="6">京城</text></g></a>';
  return '<svg class="realm-map" viewBox="0 0 960 640" role="group" aria-label="王朝总图。选择行省查看府州。">' +
    '<g aria-hidden="true">' + realmTerrain() + '</g>' + entries.map(({key,name,counts}) => {
      const shape = realmGeometry[key];
      const [x,y] = shape.point;
      const label = name + '省';
      return '<a class="realm-territory" href="#atlas/' + key + '" data-realm="' + key + '" data-hue="' + shape.hue +
        '" aria-label="' + esc(label + '，' + counts.total + ' 县，' + counts.handling + ' 项在办') +
        '"><path class="realm-tract" d="' + shape.path + '"/>' +
        realmLabel(label,x,y,counts.total + ' 县 · ' + counts.handling + ' 在办') + '</a>';
    }).join('') + entries.map(({key,name}) => realmProvinceSeat(key,name)).join('') + capital + compass + '</svg>';
}

function realmHeader(title, context, actions) {
  return '<header class="realm-page-head"><div><h1 tabindex="-1">' + esc(title) + '</h1>' +
    (context ? '<p>' + esc(context) + '</p>' : '') + '</div>' + actions + '</header>';
}

function realmIndexEntry({key,name,counts}, index) {
  const districtsTotal = Object.keys(districts[key] || {}).length;
  const hue = realmGeometry[key]?.hue || 'pine';
  return '<li class="realm-index-with-seat"><a href="#atlas/' + esc(key) + '" class="realm-index-row" data-realm="' + esc(key) + '">' +
    '<span class="realm-index-no" data-hue="' + hue + '" aria-hidden="true">' +
    String(index + 1).padStart(2,'0') + '</span><span class="realm-index-copy"><strong>' + esc(name + '省') +
    '</strong><small>' + districtsTotal + ' 府州 · ' + counts.total + ' 县</small></span>' +
    '<span class="realm-index-state">' + counts.handling + ' 在办</span>' + icon('next') + '</a>' +
    '<a class="realm-index-seat" href="#' + provinceSeatLocation(key) + '" aria-label="查看' + esc(name) + '省治">' + icon('court') + '<span>省治</span></a></li>';
}

function realmOverview() {
  const entries = Object.entries(provinces).map(([key,value]) => ({
    key, name: value.name, counts: realmFacts(state.tasks.filter(task => task.province === key)),
  }));
  const mapped = entries.filter(entry => Object.hasOwn(realmGeometry, entry.key));
  const outposts = entries.filter(entry => !Object.hasOwn(realmGeometry, entry.key));
  const counts = realmFacts(state.tasks);
  const prefectureCount = entries.reduce((total,entry) => total + Object.keys(districts[entry.key] || {}).length,0);
  const controls = '<a class="button primary" href="#province-new">' + icon('plus') + '开辟行省</a>';
  return realmHeader('王朝版图',entries.length + ' 行省 · ' + prefectureCount + ' 府州 · ' + counts.total + ' 县',controls) +
    '<div class="realm-overview"><section class="realm-board" aria-labelledby="realm-board-title">' +
    '<header class="realm-board-head"><h2 id="realm-board-title">王朝总图</h2>' +
    '<button type="button" class="realm-board-link realm-index-jump" data-atlas-jump>行省名录 ' + icon('list') + '</button></header>' +
    '<div class="realm-plot">' + realmMap(mapped) + '</div>' +
    (outposts.length ? '<div class="realm-outposts"><span>新设行省</span>' + outposts.map(entry =>
      '<a href="#atlas/' + esc(entry.key) + '">' + esc(entry.name + '省') + '</a>').join('') + '</div>' : '') +
    '<footer class="realm-board-foot">' + realmStats(counts) + '</footer></section>' +
    '<aside class="realm-rail" aria-labelledby="realm-index-title">' +
    '<header class="realm-rail-head"><h2 id="realm-index-title" tabindex="-1">行省名录</h2></header>' +
    '<ul class="realm-index">' + entries.map(realmIndexEntry).join('') + '</ul>' +
    '<footer class="realm-rail-foot"><a href="#center/approvals"><span>待你批示</span><strong>' + counts.approvals +
    '</strong>' + icon('next') + '</a></footer></aside></div>';
}

function realmDistrictEntries(key) {
  return Object.entries(districts[key] || {}).map(([district,name]) => {
    const tasks = state.tasks.filter(task => task.province === key && districtKey(task) === district);
    return {
      district, name, counts:realmFacts(tasks),
      focus:tasks.find(task => stageOf(task) === 'approval') ||
        tasks.find(task => realmStatusKey(task) === 'handling') || tasks.find(task => realmStatusKey(task) === 'waiting'),
    };
  });
}

function realmDistrictMap(key, entries) {
  const geometry = realmGeometry[key];
  if (!geometry || !entries.length) return '';
  const [x,y,width,height] = geometry.window;
  const labels = entries.map(({district,name,counts},index) => {
    const anchor = provinceSeatDistrict(key) === district ? realmProvinceAnchor(key) : null;
    const px = anchor ? anchor[0] : x + width * ((index + .5) / entries.length);
    const py = anchor ? anchor[1] - 3 : y + height * (index % 2 ? .65 : .39);
    const half = Array.from(name).length * 6 + 9;
    return '<a href="#atlas/' + esc(key) + '/' + esc(district) + '" class="realm-district-pin" aria-label="' +
      esc(name + '，' + counts.total + ' 县') + '"><rect x="' + (px-half) + '" y="' + (py-24) + '" width="' + (2*half) + '" height="20" rx="2"/>' +
      '<path d="M' + px + ' ' + (py-4) + 'v5"/><circle cx="' + px + '" cy="' + (py+3) + '" r="3"/>' +
      '<text x="' + px + '" y="' + (py-10) + '">' +
      esc(name) + '</text></a>';
  }).join('');
  return '<div class="realm-plot realm-plot--province"><svg class="realm-map" role="group" aria-label="本省府州图" viewBox="' +
    geometry.window.join(' ') + '"><g aria-hidden="true">' + realmTerrain() + '</g>' + labels + '</svg></div>';
}

function realmDistrictRow(key, {district,name,counts,focus}, index) {
  return '<a class="realm-district" href="#atlas/' + esc(key) + '/' + esc(district) + '">' +
    '<span class="realm-district-mark" aria-hidden="true">' + String(index + 1).padStart(2,'0') + '</span>' +
    '<span class="realm-district-body"><strong>' + esc(name) + '</strong>' +
    (provinceSeatDistrict(key) === district ? '<span class="realm-seat-caption">省治驻地</span>' : '') + '<small>' + (focus ? esc(focus.title + ' · ' + status(focus)[0]) :
      (counts.total ? counts.total + ' 县' : '暂无案卷')) + '</small></span>' +
    '<span class="realm-district-totals"><span><b>' + counts.total + '</b> 县</span><span><b>' +
    counts.handling + '</b> 在办</span><span><b>' + counts.archived + '</b> 熟地</span></span>' + icon('next') + '</a>';
}

function provinceOverview(key) {
  const province = provinces[key];
  if (!province) return realmOverview();
  const prefectures = realmDistrictEntries(key);
  const tasks = state.tasks.filter(task => task.province === key);
  const counts = realmFacts(tasks);
  const priority = {approval: 0, handling: 1, waiting: 2, settled: 3};
  const focus = [...tasks].sort((a,b) => priority[realmStatusKey(a)] - priority[realmStatusKey(b)]);
  return '<nav class="realm-crumbs" aria-label="版图层级"><a href="#atlas">王朝总图</a>' + icon('next') +
    '<span aria-current="page">' + esc(province.name + '省') + '</span></nav>' +
    realmHeader(province.name + '省',prefectures.length + ' 府州 · ' + counts.total + ' 县',
      '<a class="button" href="#' + provinceSeatLocation(key) + '">' + icon('court') + '进入省治</a>') +
    '<div class="realm-overview realm-province"><section class="realm-board" aria-labelledby="realm-prefecture-title">' +
    '<header class="realm-board-head"><h2 id="realm-prefecture-title">辖区府州</h2></header>' +
    realmDistrictMap(key,prefectures) +
    '<div class="realm-districts">' + (prefectures.length ? prefectures.map((entry,index) => realmDistrictRow(key,entry,index)).join('') :
      '<p class="realm-empty">此省暂无府州</p>') + '</div>' +
    '<footer class="realm-board-foot">' + realmStats(counts) + '</footer></section>' +
    '<aside class="realm-rail" aria-labelledby="realm-focus-title"><header class="realm-rail-head"><h2 id="realm-focus-title">本省案卷</h2><span>' +
    focus.length + ' 项</span></header><ul class="realm-index">' +
    (focus.length ? focus.map(task => '<li><a class="realm-index-row realm-case-row" href="#cases/' + esc(task.id) +
      '"><span class="realm-index-copy"><strong>' + esc(task.title) + '</strong><small>' + esc(districtName(task)) + '</small></span>' +
      '<span class="realm-index-state realm-case-state--' + realmStatusKey(task) + '">' +
      esc(status(task)[0]) + '</span>' + icon('next') + '</a></li>').join('') :
      '<li class="realm-empty">此省暂无案卷</li>') + '</ul></aside></div>';
}

document.addEventListener('click', event => {
  if (!event.target.closest('[data-atlas-jump]')) return;
  const heading = document.getElementById('realm-index-title');
  heading.focus({preventScroll:true});
  heading.scrollIntoView({block:'nearest'});
});

