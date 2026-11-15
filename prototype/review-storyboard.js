'use strict';

const reviewStoryboardShots = [
  {
    time:'00–04 秒',
    title:'开场标题',
    camera:'俯拍桌面，封面与索引标签同框，停留 1 秒给观众读标题。',
    caption:'给今天留个索引',
    rights:'自制片头图形。模拟授权限本案样片。',
    art:`<rect width="320" height="180" fill="#304c40"/>
      <path d="M0 24h320M0 152h320M28 0v180M292 0v180" stroke="#587064" stroke-width="1"/>
      <path d="M42 38h225v111H42z" fill="#273e35"/>
      <path d="M51 32h225v111H51z" fill="#f1e6ca"/>
      <path d="M63 41h204v92H63z" fill="none" stroke="#cbbd9d"/>
      <path d="M160 47v78M171 65h71m-71 13h71m-71 13h55" stroke="#d0c2a3"/>
      <path d="M244 54h25v16h-25z" fill="#a7493e"/>
      <text x="79" y="78" font-size="13" fill="#465e4d">手账小技巧</text>
      <text x="79" y="105" font-size="22" font-weight="700" fill="#263b34">今日索引</text>
      <path d="M78 113h66" stroke="#ad6951" stroke-width="2"/>`,
  },
  {
    time:'04–14 秒',
    title:'手部操作',
    camera:'固定近景。先拍撕下标签，再拍对齐页角和手指压实的动作。',
    caption:'撕下标签，对齐页角后压实',
    rights:'自摄操作素材。模拟授权限本案样片。',
    art:`<rect width="320" height="180" fill="#d5c7aa"/>
      <path d="M0 18h320M0 159h320M20 0v180M298 0v180" stroke="#baaa8b"/>
      <path d="M33 21h211v142H33z" fill="#e9e0c8" stroke="#b0a285"/>
      <path d="M42 26h200v127H42z" fill="#f8efd8"/>
      <path d="M50 39h181m-181 17h181m-181 17h181m-181 17h181m-181 17h181m-181 17h181m-181 17h181" stroke="#ddd1b1"/>
      <path d="M47 26v127" stroke="#c0a68b"/>
      <path d="M221 70h36v22h-36z" fill="#a7493e"/>
      <path d="M223 73h31v16h-31z" fill="none" stroke="#e9b9a0"/>
      <path d="M249 109c-6-7-14-16-21-20-6-3-11-7-9-12 2-4 7-5 13-2l14 8-12-24c-2-5 0-9 5-10 4-1 7 2 9 6l11 19c6 1 12 5 17 12l12 15c8 13 15 20 32 27v52h-31c-12-29-25-44-40-71z" fill="#ebbaa2" stroke="#896552" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M246 83l9 10m9-15 7 10m-7 19c-9-4-13-1-13 4" fill="none" stroke="#a87c68" stroke-width="1.3"/>
      <path d="M205 76h12m-10-4 5 4-5 4" stroke="#6a6a49" stroke-width="1.7" fill="none"/>`,
  },
  {
    time:'14–20 秒',
    title:'收尾提示',
    camera:'拉回俯拍，露出翻到的那一页。字幕落在留白处，不盖住标签。',
    caption:'一翻就到今天这一页',
    rights:'自制片尾字幕。模拟授权限本案样片。',
    art:`<rect width="320" height="180" fill="#4c6556"/>
      <path d="M0 23h320M0 153h320M25 0v180M294 0v180" stroke="#738578"/>
      <path d="M45 37h216v119H45z" fill="#304a3e"/>
      <path d="M52 30c36 0 71-3 107 10 35-13 70-10 106-10v112c-37 0-69-4-106 8-36-12-69-8-107-8z" fill="#f3e7c8" stroke="#b7a987"/>
      <path d="M159 40v110M65 48c28-1 52 0 79 8m-79 6c28-1 52 0 79 8m-79 7c28-1 52 0 79 8m-79 7c28-1 52 0 79 8m29-42c26-8 49-10 77-9m-77 24c26-8 49-10 77-9m-77 24c26-8 49-10 77-9" fill="none" stroke="#cbbda0"/>
      <path d="M252 56h28v16h-28z" fill="#a7493e"/>
      <rect x="99" y="112" width="122" height="21" rx="2" fill="#263b34"/>
      <text x="160" y="127" text-anchor="middle" font-size="12" fill="#f9efd9">一翻就到今天这一页</text>
      <path d="M233 106l5 5 9-11" fill="none" stroke="#5c7357" stroke-width="2.3" stroke-linecap="round"/>`,
  },
];

function reviewStoryboard() {
  return '<section class="review-storyboard" aria-label="样片分镜预览">' +
    '<header class="review-storyboard-head"><h3>样片分镜表</h3><p><span>YL-002</span><span>20 秒 · 3 镜</span><span class="review-storyboard-tag">模拟素材</span></p></header>' +
    '<ol class="review-storyboard-shots">' + reviewStoryboardShots.map((shot,index) =>
      '<li><figure class="review-storyboard-shot"><div class="review-storyboard-image">' +
      '<svg viewBox="0 0 320 180" aria-hidden="true" focusable="false">' + shot.art + '</svg>' +
      '<span aria-hidden="true">' + String(index + 1).padStart(2,'0') + '</span></div>' +
      '<figcaption><h4>' + shot.title + '<span>' + shot.time + '</span></h4><p class="review-storyboard-caption">「' + shot.caption + '」</p>' +
      '<dl><div><dt>镜头</dt><dd>' + shot.camera + '</dd></div><div><dt>素材</dt><dd>' + shot.rights + '</dd></div></dl>' +
      '</figcaption></figure></li>').join('') + '</ol></section>';
}
