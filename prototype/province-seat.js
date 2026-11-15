'use strict';

const provinceSeats = {
  video:{district:'sample',rules:['制作事项注明作品、交付版本和验收节点。','素材授权与对外发布批示沿原案卷查回。']},
  work:{district:'studio',rules:['分别记录推进、交付和确认的时间。','对外材料注明使用对象、范围及版本。']},
  study:{district:'exam',rules:['练习和评测记录来源、条件与当前学习目标。','保留实际行为、复盘证据和改进结果，便于复测。']},
  writing:{district:'serial',rules:['写作事项关联作品、章节或稿件版本。','设定调整与审读结论回指原稿和依据。']},
  chat:{district:'notes',rules:['议事和方法分别归档，均保留原始依据。','将已决定的事项与仍待讨论的建议分开记录。']},
  projects:{district:'jinglue',rules:['案卷登记需求范围、被测版本和行为验收。','实际运行和本地验证分别记录，交付附回退位置。']},
};

function provinceSeatLocation(key) {
  return 'jurisdiction/province/' + encodeURIComponent(key);
}

function provinceSeatDistrict(key) {
  if (!Object.hasOwn(provinceSeats,key)) return undefined;
  const district = provinceSeats[key].district;
  return Object.hasOwn(districts[key] || {},district) ? district : undefined;
}

function provinceSeatLocationCard(key,district) {
  const name = district ? districts[key][district] : '';
  if (!name) {
    return '<section class="province-seat-empty"><h2>省治驻地待定</h2>' +
      '<p>设定驻地后，可在这里查到承载省治的府州。</p></section>';
  }
  return '<section class="province-seat-location" aria-label="省治驻地"><div class="province-seat-location-title">' +
    '<span class="province-seat-glyph">' + icon('court') + '</span><div><p>省治驻地</p><h2>' + esc(name) +
    '</h2></div></div><a class="province-seat-location-link" href="#' + jurisdictionLocation(key,district) +
    '">查看' + esc(name) + '治所 ' + icon('next') + '</a></section>';
}

function provinceSeatDistrictRows(key,entries,seatDistrict) {
  if (!entries.length) return '<p class="province-seat-note">此省暂无府州。</p>';
  return '<ul class="province-seat-districts">' + entries.map(({district,name,counts}) => {
    const workspace = workspaceForDistrict(key,district);
    return '<li><div><a class="province-seat-district-name" href="#' + jurisdictionLocation(key,district) +
      '">' + esc(name) + icon('next') + '</a>' +
      (seatDistrict === district ? '<span class="province-seat-local-mark">省治驻地</span>' : '') +
      '<small>' + counts.total + ' 县 / ' + counts.handling + ' 在办</small></div>' +
      (workspace ? link(workspace.name,'jurisdiction/workspace/' + encodeURIComponent(workspace.id),'book') :
        '<span class="province-seat-note">工作区待绑定</span>') + '</li>';
  }).join('') + '</ul>';
}

function provinceSeatPage(key) {
  const atlas = link('王朝版图','atlas','map') + icon('next');
  if (!Object.hasOwn(provinces,key)) {
    return jurisdictionHeading('找不到省治',atlas + '<span aria-current="page">省治</span>') +
      '<section class="province-seat-empty"><h2>版图中没有这个行省</h2>' +
      jurisdictionAction('返回王朝版图','atlas','map') + '</section>';
  }
  const province = provinces[key];
  const seat = Object.hasOwn(provinceSeats,key) ? provinceSeats[key] : undefined;
  const seatDistrict = provinceSeatDistrict(key);
  const entries = realmDistrictEntries(key);
  const totals = realmFacts(state.tasks.filter(task => task.province === key));
  const provinceRoute = 'atlas/' + encodeURIComponent(key);
  return jurisdictionHeading(province.name + '省治',atlas + link(province.name + '省',provinceRoute) + icon('next') +
    '<span aria-current="page">省治</span>','',jurisdictionAction('返回' + province.name + '省',provinceRoute,'map')) +
    provinceSeatLocationCard(key,seatDistrict) + '<div class="province-seat-layout">' +
    '<section class="province-seat-sheet" aria-labelledby="province-seat-districts-title"><header>' +
    '<h2 id="province-seat-districts-title">辖区与工作区</h2><span>' + entries.length + ' 府州</span></header>' +
    provinceSeatDistrictRows(key,entries,seatDistrict) + realmStats(totals) + '</section>' +
    '<section class="province-seat-sheet province-seat-rules" aria-labelledby="province-seat-rules-title"><header>' +
    '<h2 id="province-seat-rules-title">共用办理口径（演示）</h2></header>' +
    (seat ? '<ol>' + seat.rules.map(rule => '<li>' + esc(rule) + '</li>').join('') + '</ol>' :
      '<p class="province-seat-note">尚未设定本省共用办理口径。</p>') +
    '<p class="province-seat-boundary">各工作区沿用自己的规则与授权，案卷按实际所属工作区办理。</p></section></div>';
}
