'use strict';

const countyTerritories = [
  {
    point: [145, 136],
    outline: 'M44 143 Q69 120 78 94 L108 66 145 72 177 43 221 53 273 42 Q286 87 264 113 Q236 151 252 207 Q223 197 197 216 Q164 240 136 225 Q103 198 49 214 L36 184Z',
  },
  {
    point: [369, 115],
    outline: 'M273 42 L312 53 351 36 396 49 433 36 507 47 Q480 75 512 113 Q530 142 490 208 Q438 220 406 201 Q370 178 341 193 Q310 218 252 207 Q236 151 264 113 Q286 87 273 42Z',
  },
  {
    point: [621, 133],
    outline: 'M507 47 L555 53 586 41 627 59 675 59 703 87 721 128 739 152 729 183 716 213 Q674 193 648 216 Q613 237 580 217 Q543 197 490 208 Q530 142 512 113 Q480 75 507 47Z',
  },
  {
    point: [607, 292],
    outline: 'M490 208 Q543 197 580 217 Q613 237 648 216 Q674 193 716 213 L706 246 727 269 686 302 675 344 633 357 610 380 568 362 526 381 500 353 Q526 305 499 278 Q470 247 490 208Z',
  },
  {
    point: [377, 280],
    outline: 'M252 207 Q310 218 341 193 Q370 178 406 201 Q438 220 490 208 Q470 247 499 278 Q526 305 500 353 L457 366 414 354 372 369 329 354 296 367 270 353 Q234 315 255 274 Q272 242 252 207Z',
  },
  {
    point: [139, 292],
    outline: 'M49 214 Q103 198 136 225 Q164 240 197 216 Q223 197 252 207 Q272 242 255 274 Q234 315 270 353 L233 352 204 380 167 355 116 361 91 333 55 338 52 300 27 279 36 241Z',
  },
];

const countyLayouts = {
  1: [1],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 2, 3, 5],
  5: [0, 1, 2, 3, 5],
  6: [0, 1, 2, 3, 4, 5],
};

function countyTone(task) {
  const stage = stageOf(task);
  if (stage === 'done' || stage === 'archived') return 'complete';
  if (stage === 'approval') return 'approval';
  if (status(task)[1] === 'blocked' || stage === 'independent') return 'blocked';
  if (stage === 'idle') return 'ready';
  if (stage === 'verify' || stage === 'review' || stage === 'post') return 'review';
  return 'active';
}

function countyNetwork(tasks, selected) {
  return '<ul class="county-network" aria-label="县案导航">' + tasks.map(task =>
    '<li><button type="button" class="county-network-node" data-action="county-select" data-key="' + esc(task.id) +
    '" aria-pressed="' + (task.id === selected?.id) + '"><span>' + esc(task.title) + '</span>' + badge(task) + '</button></li>'
  ).join('') + '</ul>';
}

function countyBackdrop(province) {
  const crop = realmGeometry[province]?.window || [65, 135, 820, 432];
  return '<g aria-hidden="true" class="county-backdrop"><rect width="760" height="400" fill="#e9e0c8"/>' +
    '<path d="M0 237Q126 195 187 222T366 205 553 223 760 212" fill="none" stroke="#93a9a1" stroke-width="14"/>' +
    '<svg width="760" height="400" viewBox="' + crop.join(' ') + '" preserveAspectRatio="xMidYMid slice">' +
    '<image href="assets/atlas.webp" width="960" height="640"/></svg></g>';
}

function countyDistricts(tasks) {
  return countyLayouts[tasks.length].map((index, position) => ({
    ...countyTerritories[index],
    task: tasks[position],
  }));
}

function countyRoute(from, to, isReady) {
  const [x,y] = from.point;
  const [tx,ty] = to.point;
  const direction = Math.hypot(tx-x,ty-y);
  const horizontal = (tx-x)/direction;
  const vertical = (ty-y)/direction;
  const drift = tx > x ? 14 : -14;
  const curve = 'M' + (x + horizontal*55) + ' ' + (y + vertical*37 + 12) +
    ' Q' + ((x+tx)/2 - vertical*drift) + ' ' + ((y+ty)/2 + 12 + horizontal*drift) +
    ' ' + (tx - horizontal*63) + ' ' + (ty - vertical*39 + 12);
  return '<path class="county-route-halo" d="' + curve + '"/>' +
    '<path class="county-route' + (isReady ? ' county-route--ready' : '') + '" marker-end="url(#county-arrow-' +
    (isReady ? 'ready' : 'waiting') + ')" d="' + curve + '"/>';
}

function countyRouteLines(districts, selected) {
  if (!selected) return '';
  const byId = new Map(districts.map(district => [district.task.id, district]));
  return districts.flatMap(target =>
    target.task.needs.map(id => {
      const source = byId.get(id);
      if (!source || ![id,target.task.id].includes(selected.id)) return '';
      return countyRoute(source,target,countyTone(source.task) === 'complete');
    })
  ).join('');
}

function countyMark(district, selected) {
  const {task,point:[x,y]} = district;
  const chosen = task.id === selected?.id;
  const label = Array.from(task.title);
  const title = label.length > 9 ? label.slice(0,8).join('') + '…' : task.title;
  const phase = status(task)[0];
  return '<g class="county-mark' + (chosen ? ' county-mark--selected' : '') + '" data-tone="' + countyTone(task) +
    '" transform="translate(' + x + ' ' + y + ')"><circle cy="-27" r="4.7"/><text class="county-name" y="-1">' +
    esc(title) + '</text><text class="county-stage" y="21">' + esc(phase) + '</text></g>';
}

function countySeatMarker(task) {
  const district = districtKey(task);
  const name = districtName(task);
  const label = countySeatLabel(name);
  return '<a class="county-seat-marker" href="#' + jurisdictionLocation(task.province,district) +
    '" aria-label="进入' + esc(name) + '的' + label + '"><title>' + esc(name) + label + '</title>' +
    '<path class="county-seat-leader" d="M38 49v15"/><circle class="county-seat-dot" cx="38" cy="64" r="4"/>' +
    '<rect x="15" y="13" width="96" height="38" rx="6"/>' +
    '<path d="M27 29l10-7 10 7M29 31h16M31 32v8m12-8v8m-15 1h18m-10-1v-5h3v5"/>' +
    '<text x="55" y="38">' + label + '</text></a>';
}

function countyMap(tasks, selected, matches = tasks) {
  if (!tasks.length) return '';
  if (tasks.length > countyTerritories.length) return countyNetwork(matches,selected);
  const districts = countyDistricts(tasks);
  const visible = new Set(matches.map(task => task.id));
  const definitions = '<defs><marker id="county-arrow-waiting" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
    '<path d="M1 1 8 5 1 9" fill="none" stroke="#943b31" stroke-width="1.5"/></marker>' +
    '<marker id="county-arrow-ready" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
    '<path d="M1 1 8 5 1 9" fill="none" stroke="#28584a" stroke-width="1.5"/></marker>' +
    '<pattern id="county-locked-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">' +
    '<path d="M0 0v8" stroke="#4a514c" stroke-width="1" stroke-opacity=".23"/></pattern></defs>';
  const compass = '<g class="county-north" transform="translate(698 42)" aria-hidden="true">' +
    '<circle r="13"/><path d="M0-8 3 4 0 2-3 4Z M0 2v5"/><text y="-18">北</text></g>';
  return '<div class="county-cartography"><svg class="county-chart" viewBox="0 0 760 400" role="group" aria-label="县域地图。选择县案查看事项与前置关系。">' +
    definitions + countyBackdrop(tasks[0].province) +
    districts.map(({task,outline}) => {
      const chosen = task.id === selected?.id;
      const tone = countyTone(task);
      if (!visible.has(task.id)) return '<path class="county-unmatched" aria-hidden="true" d="' + outline + '"/>';
      return '<g class="county-region" role="button" tabindex="0" data-action="county-select" data-key="' + esc(task.id) +
        '" data-tone="' + tone + '" aria-pressed="' + chosen + '" aria-label="' + esc(task.title + '，' + status(task)[0]) +
        '"><path class="county-boundary" d="' + outline + '"/>' +
        (tone === 'blocked' ? '<path class="county-hatch" d="' + outline + '"/>' : '') + '</g>';
    }).join('') +
    '<g class="county-dependencies" aria-hidden="true">' + countyRouteLines(districts,selected) + '</g>' +
    '<g class="county-annotations" aria-hidden="true">' + districts.filter(({task}) => visible.has(task.id)).map(district => countyMark(district,selected)).join('') +
    '</g>' + compass + countySeatMarker(tasks[0]) + '</svg></div>';
}

