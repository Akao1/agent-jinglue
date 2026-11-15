'use strict';

const courtSites = {
  throne:        {area:[602,84,936,266], label:[767,234]},
  cabinet:       {area:[700,10,831,84], label:[766,72]},
  secretariat:   {area:[487,116,558,244], label:[520,229]},
  review:        {area:[978,116,1048,244], label:[1014,230]},
  dispatch:      {area:[699,524,842,607], label:[770,585]},
  personnel:     {area:[90,369,339,513], label:[221,458]},
  revenue:       {area:[373,367,635,513], label:[501,458]},
  rites:         {area:[87,519,341,677], label:[218,619]},
  war:           {area:[371,519,633,677], label:[500,619]},
  justice:       {area:[82,687,338,831], label:[215,783]},
  works:         {area:[367,687,631,830], label:[500,783]},
  censor:        {area:[1004,526,1433,709], label:[1208,664]},
  investigation: {area:[906,369,1147,510], label:[1025,460]},
  recheck:       {area:[1177,369,1422,510], label:[1303,460]},
  dali:          {area:[1286,99,1442,249], label:[1357,166]},
  hanlin:        {area:[102,243,240,296], label:[168,286]},
  scout:         {area:[949,729,1114,843], label:[1046,818]},
  history:       {area:[1133,723,1346,821], label:[1218,810]},
};

function courtFallbackPlan() {
  const halls = Object.values(courtSites).map(({area:[x1,y1,x2,y2]}) => {
    const x = (x1+x2)/2, y = (y1+y2)/2;
    const w = (x2-x1)*.36, h = (y2-y1)*.2;
    return '<path class="court-fallback-wall" d="M' + x1 + ' ' + y2 + 'V' + y1 + 'H' + x2 + 'V' + y2 +
      'H' + (x+18) + 'M' + (x-18) + ' ' + y2 + 'H' + x1 + '"/>' +
      '<path class="court-fallback-roof" d="M' + (x-w) + ' ' + (y+h) + 'l' + (w*.3) + ' ' + (-h*2) +
      'h' + (w*1.4) + 'l' + (w*.3) + ' ' + (h*2) + 'Z"/>' +
      '<path class="court-fallback-ridge" d="M' + (x-w*.7) + ' ' + y + 'H' + (x+w*.7) + '"/>';
  }).join('');
  return '<g aria-hidden="true"><rect width="1536" height="1024" class="court-fallback-paper"/>' +
    '<rect x="34" y="38" width="1468" height="931" rx="8" class="court-fallback-wall"/>' +
    '<rect x="49" y="53" width="1438" height="901" rx="5" class="court-fallback-wall"/>' +
    '<path d="M767 65V955M60 348H1470M60 846H1470" class="court-fallback-road"/>' + halls + '</g>';
}

function courtBuilding(office, selected) {
  const {area:[x1,y1,x2,y2],label:[x,y]} = courtSites[office.key];
  const labelWidth = office.name.length * 26 + 30;
  const active = office.key === selected;
  return '<a class="court-building' + (active?' is-selected':'') + '" data-office="' + esc(office.key) +
    '" href="#court/' + esc(office.key) + '" aria-label="进入' + esc(office.name) + '"' +
    (active?' aria-current="location"':'') + '><title>' + esc(office.name) + '</title>' +
    '<rect aria-hidden="true" class="court-building-hit" x="' + x1 + '" y="' + y1 + '" width="' + (x2-x1) +
    '" height="' + (y2-y1) + '" rx="5"/>' +
    '<g aria-hidden="true"><rect class="court-plaque" x="' + (x-labelWidth/2) + '" y="' + (y-17) + '" width="' +
    labelWidth + '" height="35" rx="2"/><text class="court-plot-label" x="' + x + '" y="' + (y+1) +
    '">' + esc(office.name) + '</text></g></a>';
}

function courtSvg(selected) {
  return '<svg class="court-svg" viewBox="0 0 1536 1024" role="group" aria-label="皇城衙署图，选择建筑进入官署">' +
    courtFallbackPlan() + '<image href="assets/court.webp" width="1536" height="1024" aria-hidden="true"/>' +
    courtOffices.map(office => courtBuilding(office, selected)).join('') + '</svg>';
}

function courtRoomGlyph(kind) {
  const shapes = {
    hall:'M2 11 16 4l14 7H2Zm3 16h22M7 24V12m6 12V12m6 12V12m6 12V12M3 29h26',
    records:'M3 25h26M5 24V8h22v16M3 8h26M8 5h16M10 11v10m6-10v10m6-10v10',
    gate:'M2 12h28L24 7H8l-6 5Zm3 15h22M6 25V12m20 13V12M12 25V15h8v10',
  };
  return '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="' + shapes[kind] + '"/></svg>';
}

function courtRows(info, limit) {
  return info.cases.slice(0,limit).map(task => '<li><a href="#cases/' + encodeURIComponent(task.id) +
    '"><div><strong>' + esc(task.title) + '</strong><small>' + esc(region(task)) + ' / ' + esc(task.id) +
    '</small></div>' + badge(task) + icon('next') + '</a></li>').join('') +
    info.findings.slice(0,limit).map(entry => '<li><a href="#audit/verification"><div><strong>' + esc(entry.summary) +
    '</strong><small>' + esc(entry.id) + '</small></div><span class="badge pending">待核证</span>' + icon('next') + '</a></li>').join('');
}

function courtQueue(info, expanded = false) {
  const rows = courtRows(info, expanded ? undefined : 3);
  const count = info.cases.length + info.findings.length;
  return '<section class="court-current"><header><h3>' + esc(info.queueLabel || '当前经手') + '</h3>' +
    (count ? '<span>' + count + ' 项</span>' : '') + '</header>' +
    (rows ? '<ul>' + rows + '</ul>' : '<p class="court-empty">' + esc(info.empty) + '</p>') + '</section>';
}

function courtRooms(info) {
  const archiveRoute = info.secondaryRoute || 'court/' + info.key + '/records';
  const archiveLabel = info.secondaryLabel || '查阅本署案卷';
  return '<div class="court-rooms" aria-label="衙署分区"><div class="court-actions">' +
    '<a class="button primary' + (info.key === 'throne' ? ' red' : '') + '" href="#' + esc(info.actionRoute) +
    '">' + courtRoomGlyph('hall') + '<span><small>办事厅</small><strong>' + esc(info.actionLabel) +
    '</strong></span>' + icon('next') + '</a></div>' +
    '<a class="court-side-room" href="#' + esc(archiveRoute) + '">' + courtRoomGlyph('records') +
    '<span><small>配房</small><strong>' + esc(archiveLabel) + '</strong></span>' + icon('next') + '</a>' +
    '<button class="court-side-room" type="button" data-action="court-directory">' + courtRoomGlyph('gate') +
    '<span><small>署门</small><strong>前往其他官署</strong></span>' + icon('next') + '</button></div>';
}

function courtDesk(info, room) {
  const inRecords = room === 'records';
  const label = inRecords ? info.name : info.zone;
  return '<aside class="court-desk" aria-label="官署详情"><header class="court-desk-heading">' +
    (inRecords || info.zone !== info.name ? '<span class="court-desk-zone">' + esc(label) + '</span>' : '') + '<h2 tabindex="-1">' +
    esc(inRecords ? '本署案房' : info.name) + '</h2></header>' +
    (inRecords ? courtQueue(info,true) + '<a class="court-back" href="#court/' + esc(info.key) + '">返回' + esc(info.name) + '</a>' :
      '<p class="court-mission">' + esc(info.mission) + '</p>' + courtRooms(info) + courtQueue(info) +
      '<details class="court-boundary"><summary>职权与交接</summary><p>' + esc(info.boundary) + '</p></details>') + '</aside>';
}

function courtDirectory(selected) {
  const zones = new Map();
  for (const office of courtOffices) {
    if (!zones.has(office.zone)) zones.set(office.zone, []);
    zones.get(office.zone).push(office);
  }
  return '<section class="court-directory" id="court-directory" aria-label="官署名录"><h2 tabindex="-1">官署名录</h2>' +
    '<div class="court-directory-grid">' + [...zones].map(([zone,items]) =>
      '<section class="court-directory-group"><h3>' + esc(zone) + '</h3><ul>' +
      items.map(office => '<li><a href="#court/' + esc(office.key) + '"' + (office.key === selected ? ' aria-current="location"' : '') +
        '>' + esc(office.name) + icon('next') + '</a></li>').join('') + '</ul></section>').join('') + '</div></section>';
}

function courtPage(id, room) {
  const selected = courtOffices.find(office => office.key === id)?.key || 'throne';
  return head('京城衙署') + '<div class="court-page"><section class="court-board" aria-labelledby="court-board-title">' +
    '<header class="court-board-head"><h2 id="court-board-title">皇城衙署图</h2><button type="button" class="text-link" data-action="court-directory">' +
    icon('list') + '按名录找衙署</button></header><div class="court-map-frame">' + courtSvg(selected) +
    '</div><div class="court-mobile-plate" aria-hidden="true"></div></section>' +
    courtDesk(courtOfficeInfo(selected), room) + courtDirectory(selected) + '</div>';
}
