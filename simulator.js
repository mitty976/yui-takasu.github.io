/* ======================================
   料金シミュレーター スクリプト
====================================== */

/* === 季節カラー === */
const SEASONS = {
  spring: { months: [3,4,5],   bg:'#FFFAFF', works:'#FFEEF4', sidebar:'#F8D8E8', border:'#EAB5C5', accent:'#D4879A', btn:'#D4879A', cursor:'assets/img/cursor/cursor-spring.png' },
  summer: { months: [6,7,8],   bg:'#F5FFFF', works:'#E8F8F8', sidebar:'#C8E8E8', border:'#88C0C0', accent:'#4A9090', btn:'#4A9090', cursor:'assets/img/cursor/cursor-summer.png' },
  autumn: { months: [9,10,11], bg:'#FFFCF8', works:'#FFF0E4', sidebar:'#EED8C8', border:'#C8A090', accent:'#8C5048', btn:'#8C5048', cursor:'assets/img/cursor/cursor-autumn.png' },
  winter: { months: [12,1,2],  bg:'#FFF8FC', works:'#FFE8F0', sidebar:'#E8C8D8', border:'#C898B8', accent:'#7A3048', btn:'#7A3048', cursor:'assets/img/cursor/cursor-winter.png' },
};
const month  = new Date().getMonth() + 1;
const season = Object.values(SEASONS).find(s => s.months.includes(month)) || SEASONS.spring;
const root   = document.documentElement;
root.style.setProperty('--color-bg',      season.bg);
root.style.setProperty('--color-works',   season.works);
root.style.setProperty('--color-sidebar', season.sidebar);
root.style.setProperty('--color-border',  season.border);
root.style.setProperty('--color-accent',  season.accent);
root.style.setProperty('--color-btn',     season.btn);


/* === カスタムカーソル === */
const cursorEl  = document.getElementById('custom-cursor');
const cursorImg = document.getElementById('custom-cursor-img');
cursorImg.src = season.cursor;
document.addEventListener('mousemove', e => {
  cursorEl.style.left = e.clientX + 'px';
  cursorEl.style.top  = e.clientY + 'px';
});
document.querySelectorAll('a, button, input, label, [role="button"]').forEach(el => {
  el.addEventListener('mouseenter', () => cursorEl.classList.add('is-large'));
  el.addEventListener('mouseleave', () => cursorEl.classList.remove('is-large'));
});

/* === カウンターの状態管理 === */
const counts = {
  d_qty:           1,
  i_extraPerson:   0,
  i_expression:    0,
  i_expression_sd: 0,
  i_costume:       0,
  i_costume_sd:    0,
  i_hairstyle:     0,
  i_hairstyle_sd:  0,
  i_revision:      0,
  d_extra:         0
};
const countPrices = {
  d_qty:           0,
  i_extraPerson:   6500,
  i_expression:    1500,
  i_expression_sd: 1000,
  i_costume:       4000,
  i_costume_sd:    2000,
  i_hairstyle:     4000,
  i_hairstyle_sd:  2000,
  i_revision:      1500,
  d_extra:         0
};

function changeCount(key, delta) {
  /* 点数は1点未満にできない */
  const floor = key === 'd_qty' ? 1 : 0;
  const next = Math.max(floor, counts[key] + delta);
  if (next === counts[key]) return;
  counts[key] = next;

  const numEl = document.getElementById(key + 'Num');
  numEl.textContent = counts[key];

  const controls = numEl.closest('.sim-counter-controls');
  controls.classList.toggle('is-zero', counts[key] === 0);

  /* ゼロになるときはアニメーション不要（is-zeroのCSSトランジションで消える） */
  if (counts[key] > 0) {
    numEl.classList.remove('anim-up', 'anim-down');
    void numEl.offsetWidth;
    numEl.classList.add(delta > 0 ? 'anim-up' : 'anim-down');
  } else {
    numEl.classList.remove('anim-up', 'anim-down');
  }

  calcTotal();
}

/* === グッズ・物販の二次利用 === */
/* 商品カテゴリごとに1種類と数える。配信・アイコン等の使用が一次使用（商用利用ライセンスの範囲内）で、
   グッズは1種類目から二次使用にあたる。日本イラストレーター協会の基準
   （二次70% / 三次50% / 四次50% / 五次以降20%）でベース料金に対して発生する */
const GOODS_RATES = [0.7, 0.5, 0.5, 0.2];


/* 日本イラストレーター協会の次数表記。idx=0 が二次使用にあたる */
const GOODS_ORDER_JP = ['二次利用', '三次利用', '四次利用', '五次利用以降'];
const GOODS_ORDER_EN = ['secondary use', 'tertiary use', 'quaternary use', 'quinary use onward'];
function goodsOrderLabel(idx) {
  const list = currentLang === 'en' ? GOODS_ORDER_EN : GOODS_ORDER_JP;
  return list[Math.min(idx, list.length - 1)];
}


/* 一次使用がどれかで数え方がずれる。
   配信でも使う場合：配信が一次使用 → グッズ1種類目が二次使用（70%）
   グッズ制作のみ ：グッズ1種類目が一次使用 → 商用利用ライセンスの範囲内、2種類目から70% */
function goodsScope() {
  const el = document.querySelector('input[name="i_goods_scope"]:checked');
  return el ? el.value : '';
}
const GOODS_MAX   = 12;

/* 入力欄のプレースホルダ。行ごとに違う例を出して「商品カテゴリごとに1種類」を伝える */
const GOODS_PLACEHOLDERS = [
  'アクリルスタンド', '缶バッジ', 'Tシャツ', 'アクリルキーホルダー',
  'ステッカー', 'タペストリー', 'マグカップ', 'クリアファイル',
  'トートバッグ', 'ポストカード', 'スマホケース', 'ラバーストラップ'
];
const GOODS_PLACEHOLDERS_EN = [
  'acrylic stand', 'can badge', 'T-shirt', 'acrylic keychain',
  'sticker', 'tapestry', 'mug', 'clear file',
  'tote bag', 'postcard', 'phone case', 'rubber strap'
];

function goodsRate(index) {
  /* グッズのみの場合は1種類目が一次使用なので、料率の並びを1つ後ろにずらす */
  const i = goodsScope() === 'goods' ? index - 1 : index;
  if (i < 0) return 0;
  return GOODS_RATES[Math.min(i, GOODS_RATES.length - 1)];
}

/* 現在の行数を返す */
function goodsRowEls() {
  return Array.from(document.querySelectorAll('#goodsList .sim-goods-row'));
}

function addGoodsRow(triggerCalc = true) {
  const list = document.getElementById('goodsList');
  if (!list || list.children.length >= GOODS_MAX) return;

  const row = document.createElement('div');
  row.className = 'sim-goods-row row-enter';
  row.innerHTML =
    '<span class="sim-goods-index"></span>' +
    '<input type="text" class="sim-goods-input" maxlength="30">' +
    '<span class="sim-goods-rate"></span>' +
    '<button type="button" class="sim-goods-remove" aria-label="この行を削除">×</button>';

  row.querySelector('.sim-goods-remove').addEventListener('click', () => {
    row.remove();
    refreshGoodsRows();
    calcTotal();
  });
  /* 名前の入力は金額に影響しないので、内訳の表示だけ更新する */
  row.querySelector('.sim-goods-input').addEventListener('input', calcTotal);

  list.appendChild(row);
  refreshGoodsRows();
  if (triggerCalc) calcTotal();
}

/* 通し番号の振り直しと追加ボタンの上限制御 */
function refreshGoodsRows() {
  const examples = currentLang === 'en' ? GOODS_PLACEHOLDERS_EN : GOODS_PLACEHOLDERS;
  goodsRowEls().forEach((row, i) => {
    row.querySelector('.sim-goods-index').textContent = i + 1;
    const input = row.querySelector('.sim-goods-input');
    const ex = examples[i % examples.length];
    input.placeholder = currentLang === 'en' ? 'e.g. ' + ex : '例：' + ex;
  });
  const addBtn = document.getElementById('goodsAddBtn');
  if (addBtn) addBtn.disabled = goodsRowEls().length >= GOODS_MAX;
}

/* グッズ欄の開閉：カード自体は常に表示し、商用利用ライセンス未選択のときは
   入力欄だけ閉じて案内文を出す。著作権譲渡を選んだ場合は権利ごと移転するので
   二次利用料は発生しない */
function updateGoodsVisibility() {
  const card = document.getElementById('goodsCard');
  if (!card) return;
  const commercial = document.getElementById('i_commercial');
  const copyright  = document.getElementById('i_copyright');
  const isCopyright = !!(copyright && copyright.checked);
  const open = !!(commercial && commercial.checked) && !isCopyright;

  card.classList.toggle('is-locked', !open);

  /* 閉じている理由に合わせて案内文を切り替える */
  const lockedEl = document.getElementById('goodsLocked');
  if (lockedEl && !open) {
    lockedEl.innerHTML = isCopyright
      ? (currentLang === 'en'
          ? 'With a copyright transfer the rights pass to you, so no secondary use fee applies.'
          : '<strong>著作権譲渡</strong>の場合は権利ごと移転するため、二次利用料はかかりません。')
      : (currentLang === 'en'
          ? 'Select the <strong>commercial use license</strong> under “07 Option” to fill this in.'
          : '「07 オプション」の<strong>商用利用ライセンス</strong>を選ぶと入力できます。');
  }

  /* 配信でも使うのか、グッズのみなのかを選ぶまでは入力欄を出さない */
  const scope = goodsScope();
  card.classList.toggle('is-await-scope', open && !scope);

  if (open) {
    /* 二次利用料が自動で乗らないよう、行の追加はお客様の操作に任せる */
    if (!scope) {
      const list = document.getElementById('goodsList');
      if (list) list.innerHTML = '';
    }
    refreshGoodsRows();
  } else {
    /* 閉じたら入力内容ごとリセットする。
       使用用途の「グッズ販売」も外して、選択状態の矛盾を残さない */
    const list = document.getElementById('goodsList');
    if (list) list.innerHTML = '';
    const usage = document.getElementById('i_goods_usage');
    if (usage) usage.checked = false;
    document.querySelectorAll('input[name="i_goods_scope"]').forEach(el => { el.checked = false; });
    refreshGoodsRows();
  }
}

/* 各行の料率・金額表示を更新する（行のDOMは作り直さない：入力中のフォーカスを保つため） */
function updateGoodsRates(baseYen, baseUsd) {
  goodsRowEls().forEach((row, i) => {
    const rateEl = row.querySelector('.sim-goods-rate');
    const rate   = goodsRate(i);
    if (rate === 0) {
      rateEl.textContent = currentLang === 'en' ? 'included in license' : '商用ライセンスに含む';
      rateEl.classList.add('sim-goods-rate--free');
    } else {
      const yen = Math.round(baseYen * rate);
      const usd = Math.round(baseUsd * rate);
      rateEl.textContent = Math.round(rate * 100) + '%　＋' + formatPair(yen, usd);
      rateEl.classList.remove('sim-goods-rate--free');
    }
  });
}

/* === サービスタブ切り替え === */
/* .sim-tab は点数タブでも使っているので、サービスタブの行に限定して拾う */
let currentTab = 'illust';
document.querySelectorAll('.sim-tabs .sim-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sim-tabs .sim-tab').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    currentTab = btn.dataset.target;
    document.querySelectorAll('.sim-section').forEach(s => s.classList.remove('is-active'));
    const newSection = document.getElementById('sim-' + currentTab);
    newSection.classList.add('is-active');
    /* カードをスタガーで登場させる */
    newSection.querySelectorAll('.sim-card').forEach((card, i) => {
      card.classList.remove('card-enter');
      void card.offsetWidth;
      card.style.animationDelay = (i * 0.05) + 's';
      card.classList.add('card-enter');
    });
    calcTotal();
  });
});

/* === 等身/SDベースタイプタブ切り替え === */
/* ▼▼▼ UXモード切り替えはここ1行だけ ▼▼▼ */
const UX_MODE = 'B'; /* 'A'：タブ常時表示 ／ 'B'：選択後バッジに折りたたみ */

let currentBaseType = '';

const baseTypeThumbs = {
  normal: 'assets/img/figure/等身.png',
  sd:     'assets/img/figure/2頭身.png',
};

const hintEl = document.getElementById('base-type-hint');

/* === 納期テーブル（ベース×背景×納期種別） === */
const DELIVERY_TABLE = {
  /* 等身キャラ: noBg=背景なし/簡易背景, bg=描き込み背景 */
  '10000': { label: '胸上',      sd: false, normal: { noBg: '10〜14日', bg: '18日' }, rush: { noBg: '7日',  bg: '11日' }, express: { noBg: '5日', bg: '7日'  } },
  '13000': { label: '腰上',      sd: false, normal: { noBg: '10〜14日', bg: '18日' }, rush: { noBg: '7日',  bg: '11日' }, express: { noBg: '5日', bg: '7日'  } },
  '15000': { label: '太ももまで', sd: false, normal: { noBg: '14〜20日', bg: '26日' }, rush: { noBg: '10日', bg: '14日' }, express: { noBg: '7日', bg: '7日'  } },
  '18000': { label: '全身',      sd: false, normal: { noBg: '16〜22日', bg: '27日〜' }, rush: { noBg: '12日', bg: '20日' }, express: { noBg: '8日', bg: '15日' } },
  /* SDキャラ: noBg=背景なし/簡易背景, bg=描き込み背景 */
  '6000':  { label: '1.5頭身', sd: true, normal: { noBg: '3日', bg: '5日' }, rush: { noBg: '2日', bg: '3日' }, express: { noBg: '当日', bg: '2日'  } },
  '7000':  { label: '2頭身',   sd: true, normal: { noBg: '3日', bg: '5日' }, rush: { noBg: '2日', bg: '3日' }, express: { noBg: '当日', bg: '2日'  } },
  '8000':  { label: '2.5頭身', sd: true, normal: { noBg: '5日', bg: '8日' }, rush: { noBg: '2日', bg: '4日' }, express: { noBg: '当日', bg: '3日'  }},
  '9000':  { label: '3頭身',   sd: true, normal: { noBg: '7日', bg: '10日' }, rush: { noBg: '3日', bg: '5日' }, express: { noBg: '翌日', bg: '3日' } },
};

function updateDeliveryNote() {
  const standardEl    = document.getElementById('delivery-note-standard');
  const rushNoteEl    = document.getElementById('delivery-note-rush');
  const expressNoteEl = document.getElementById('delivery-note-express');
  if (!standardEl) return;

  const isEN = currentLang === 'en';

  function setNote(el, jpHtml, enHtml) {
    if (!el) return;
    el.innerHTML      = isEN ? (enHtml || jpHtml) : jpHtml;
    el.dataset.jp     = el.textContent.trim();
    el.dataset.jpHtml = jpHtml;
    el.dataset.enHtml = enHtml || '';
  }

  /* 日数を英語表記に変換（「7日」→「7 days」など） */
  function dEN(days) {
    if (!days) return '';
    return days
      .replace(/^(\d+)〜(\d+)日$/, '$1–$2 days')
      .replace(/^(\d+)日〜$/, '$1+ days')
      .replace(/^(\d+)日$/, '$1 days');
  }

  const bgLabelEN = { '背景なし': 'no background', '簡易背景あり': 'simple background', '描き込み背景あり': 'detailed background' };
  const baseLabelEN = {
    '胸上': 'Bust-Up', '腰上': 'Waist-Up', '太ももまで': 'Thigh-Length', '全身': 'Full Body',
    '1.5頭身': '1.5-Head Chibi', '2頭身': '2-Head Chibi', '2.5頭身': '2.5-Head Chibi', '3頭身': '3-Head Chibi',
  };
  const sufJP = '混雑状況とお返事の速度によって変わりますが、無料修正3回のやり取りを含めた目安で、';
  const sufEN = 'Subject to workload and response speed. Includes up to 3 free rounds of revisions. ';
  const condJP = { normal: 'ご返信が翌々日以内の場合に限ります。', rush: 'ご返信が翌日以内の場合に限ります。', express: 'ご返信が当日中にいただける場合に限ります。' };
  const condEN = { normal: 'Requires responses within 2 days.', rush: 'Requires responses within 1 day.', express: 'Requires same-day responses.' };
  const rlJP   = { normal: '通常納期', rush: '短縮納期', express: '最短納期' };
  const rlEN   = { normal: 'Standard Delivery', rush: 'Rush Delivery', express: 'Express Delivery' };

  /* Live2D選択時は最優先 */
  const live2dEl = document.querySelector('input[name="i_live2d"]:checked');
  if (live2dEl && live2dEl.value !== '0') {
    const isPose = live2dEl.value === '35000' || live2dEl.value === '20000';
    const jp = isPose
      ? '動くイラスト（ポーズ切り替えあり）は<strong>25〜30日</strong>が目安です。多少希望に添えるように努力いたしますが、短縮・最短納期はご対応できません。'
      : '動くイラスト（まばたき・口・呼吸のみ）は<strong>18〜22日</strong>が目安です。多少希望に添えるように努力いたしますが、短縮・最短納期はご対応できません。';
    const en = isPose
      ? 'Live2D with pose switching: <strong>25–30 days</strong> est. We\'ll do our best to accommodate, but rush/express delivery is not available.'
      : 'Live2D basic (blink, mouth, breath): <strong>18–22 days</strong> est. We\'ll do our best to accommodate, but rush/express delivery is not available.';
    setNote(standardEl, jp, en);
    setNote(rushNoteEl, jp, en);
    setNote(expressNoteEl, jp, en);
    return;
  }

  const baseEl = document.querySelector('input[name="i_base"]:checked');
  const bgEl   = document.querySelector('input[name="i_bg"]:checked');
  const table  = baseEl ? DELIVERY_TABLE[baseEl.value] : null;

  const hasBg   = bgEl && (bgEl.value === '1500' || bgEl.value === '5000' || bgEl.value === '3000');
  const bgKey   = hasBg ? 'bg' : 'noBg';
  const bgLabel = bgEl?.value === '1500' ? '簡易背景あり'
                : (bgEl?.value === '5000' || bgEl?.value === '3000') ? '描き込み背景あり'
                : '背景なし';
  const bgEN    = bgLabelEN[bgLabel] || bgLabel;

  if (!table) {
    setNote(standardEl,
      '腰上・背景なし・通常納期で<strong>10〜14日</strong>が目安です。' + sufJP + condJP.normal,
      'Waist-Up · no background · Standard Delivery: <strong>10–14 days</strong> est. ' + sufEN + condEN.normal);
    setNote(rushNoteEl,
      '腰上・背景なし・短縮納期で<strong>7日</strong>が目安です。' + sufJP + condJP.rush,
      'Waist-Up · no background · Rush Delivery: <strong>7 days</strong> est. ' + sufEN + condEN.rush);
    setNote(expressNoteEl,
      '腰上・背景なし・最短納期で<strong>5日</strong>が目安です。' + sufJP + condJP.express,
      'Waist-Up · no background · Express Delivery: <strong>5 days</strong> est. ' + sufEN + condEN.express);
    return;
  }

  const bLabelJP = table.label;
  const bLabelEN = baseLabelEN[table.label] || table.label;

  /* SDキャラ：通常・短縮・最短それぞれ動的表示 */
  if (table.sd) {
    function makeSdNote(rushKey) {
      const days = table[rushKey]?.[bgKey] ?? table.normal?.[bgKey];
      if (!days) return {
        jp: `${bLabelJP}（SD）の納期はご依頼内容によって変わりますので、お気軽にご相談ください。`,
        en: `${bLabelEN} (SD) delivery varies by order. Please consult.`,
      };
      const dayJP = days === '当日' ? '<strong>当日中</strong>に納品できる場合があります'
                  : days === '翌日' ? '<strong>翌日中</strong>に納品できる場合があります'
                  : `<strong>${days}</strong>が目安です`;
      const dayEN = days === '当日' ? '<strong>same-day</strong> delivery may be possible'
                  : days === '翌日' ? '<strong>next-day</strong> delivery may be possible'
                  : `est. <strong>${dEN(days)}</strong>`;
      return {
        jp: `${bLabelJP}（SD）・${bgLabel}・${rlJP[rushKey]}で${dayJP}。${sufJP}${condJP[rushKey]}`,
        en: `${bLabelEN} (SD) · ${bgEN} · ${rlEN[rushKey]}: ${dayEN}. ${sufEN}${condEN[rushKey]}`,
      };
    }
    const sn = makeSdNote('normal');
    const rn = makeSdNote('rush');
    const en_ = makeSdNote('express');
    setNote(standardEl,    sn.jp,  sn.en);
    setNote(rushNoteEl,    rn.jp,  rn.en);
    setNote(expressNoteEl, en_.jp, en_.en);
    return;
  }

  /* 等身キャラ：通常・短縮・最短それぞれ動的更新 */
  function makeNote(rushKey) {
    const days = table[rushKey]?.[bgKey];
    if (!days) return {
      jp: `${bLabelJP}・${bgLabel}の納期はお気軽にご相談ください。`,
      en: `Please consult for the delivery estimate.`,
    };
    return {
      jp: `${bLabelJP}・${bgLabel}・${rlJP[rushKey]}で<strong>${days}</strong>が目安です。${sufJP}${condJP[rushKey]}`,
      en: `${bLabelEN} · ${bgEN} · ${rlEN[rushKey]}: <strong>${dEN(days)}</strong> est. ${sufEN}${condEN[rushKey]}`,
    };
  }

  const sNote = makeNote('normal');
  const rNote = makeNote('rush');
  const eNote = makeNote('express');
  setNote(standardEl,    sNote.jp, sNote.en);
  setNote(rushNoteEl,    rNote.jp, rNote.en);
  setNote(expressNoteEl, eNote.jp, eNote.en);
}

function showBaseTypeCards(type) {
  if (hintEl) hintEl.style.display = 'none';
  const normalGrid = document.getElementById('pose-normal');
  const sdGrid     = document.getElementById('pose-sd');

  if (type === 'normal') {
    sdGrid.style.display     = 'none';
    normalGrid.style.display = '';
    document.querySelectorAll('#pose-sd input[type="radio"]').forEach(r => r.checked = false);
    document.querySelector('#pose-normal input[type="radio"]').checked = true;
  } else {
    normalGrid.style.display = 'none';
    sdGrid.style.display     = '';
    document.querySelectorAll('#pose-normal input[type="radio"]').forEach(r => r.checked = false);
    document.querySelector('#pose-sd input[type="radio"]').checked = true;
  }

  /* 中央から外に向かってスプリング展開 */
  const activeGrid = type === 'normal' ? normalGrid : sdGrid;
  const cards = [...activeGrid.querySelectorAll('.sim-pose-card')];
  const center = (cards.length - 1) / 2;
  cards.forEach((card, i) => {
    const dist = Math.abs(i - center);
    card.classList.remove('spring-enter');
    void card.offsetWidth;
    card.style.animationDelay = (dist * 0.07) + 's';
    card.classList.add('spring-enter');
  });
  updateDeliveryNote();
}

function resetBaseType() {
  document.getElementById('pose-normal').style.display = 'none';
  document.getElementById('pose-sd').style.display     = 'none';
  document.querySelectorAll('input[name="i_base"]').forEach(r => r.checked = false);
  document.querySelectorAll('.sim-base-type-tab').forEach(b => b.classList.remove('is-active'));
  if (hintEl) hintEl.style.display = '';
  currentBaseType = '';
  updateDeliveryNote();
  calcTotal();
}

document.querySelectorAll('.sim-base-type-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.baseType;
    if (type === currentBaseType) return;
    currentBaseType = type;

    document.querySelectorAll('.sim-base-type-tab').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');

    showBaseTypeCards(type);
    updateMascotMessage(btn);

    /* B案：タブをバッジに折りたたむ */
    if (UX_MODE === 'B') {
      const tabs  = document.querySelector('.sim-base-type-tabs');
      const badge = document.getElementById('base-type-badge');
      document.getElementById('base-badge-label').textContent =
        type === 'normal'
          ? (currentLang === 'en' ? 'Standard' : '等身キャラ')
          : (currentLang === 'en' ? 'Chibi / SD' : 'SDキャラ');
      document.getElementById('base-badge-thumb').src = baseTypeThumbs[type];
      tabs.style.display  = 'none';
      badge.style.display = 'flex';
      badge.classList.remove('badge-enter');
      void badge.offsetWidth;
      badge.classList.add('badge-enter');
    }

    calcTotal();
  });
});

/* B案：バッジクリックでタブに戻る */
document.getElementById('base-type-badge').addEventListener('click', () => {
  document.getElementById('base-type-badge').style.display = 'none';
  document.querySelector('.sim-base-type-tabs').style.display = '';
  resetBaseType();
});

/* === SD/等身フィルター === */
function updateFilter() {
  const baseEl = document.querySelector('input[name="i_base"]:checked');
  const isSD = baseEl ? baseEl.dataset.type === 'sd' : false;

  /* 追加キャラ料金切り替え */
  const newExtraPrice = isSD ? 5000 : 6500;
  countPrices.i_extraPerson = newExtraPrice;
  const extraPriceEl = document.getElementById('extraPersonPrice');
  if (extraPriceEl && baseEl) {
    extraPriceEl.dataset.yen = String(newExtraPrice);
    const suf = currentLang === 'en' ? extraPriceEl.dataset.sufEn : extraPriceEl.dataset.suf;
    extraPriceEl.textContent = extraPriceEl.dataset.pre + formatAmt(newExtraPrice) + (suf || '');
  }

  /* data-show フィルター：表示/非表示の切り替え */
  document.querySelectorAll('#sim-illust [data-show]').forEach(el => {
    const visible = isSD ? el.dataset.show === 'sd' : el.dataset.show === 'normal';
    el.style.display = visible ? '' : 'none';

    if (!visible) {
      /* 非表示になったラジオボタンのリセット */
      el.querySelectorAll('input[type="radio"]').forEach(input => {
        if (input.checked) input.checked = false;
      });
      /* 非表示になったチェックボックスのリセット */
      el.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.checked = false;
      });
      /* 非表示になったカウンターのリセット */
      if (el.classList.contains('sim-counter')) {
        const numEl = el.querySelector('.sim-counter-num');
        if (numEl) {
          const key = numEl.id.replace('Num', '');
          if (counts[key] !== undefined) {
            counts[key] = 0;
            numEl.textContent = '0';
          }
        }
      }
    }
  });

  /* 背景が未選択になった場合は「なし」に戻す */
  if (!document.querySelector('input[name="i_bg"]:checked')) {
    document.querySelector('input[name="i_bg"][value="0"]').checked = true;
  }
  /* Live2Dが未選択になった場合は「なし」に戻す */
  if (!document.querySelector('input[name="i_live2d"]:checked')) {
    document.querySelector('input[name="i_live2d"][value="0"]').checked = true;
  }
}

/* === 複数点オーダー：点数ごとの状態 === */
/* フォームは1つのまま、点数を切り替えるときに内容を保存・復元する。
   DOMを複製するとidが重複して既存コードが壊れるため、この方式にしている。
   納期・リピーター割引・追加修正は注文全体で1回なので、点数ごとには保存しない */
const PIECE_RADIOS = ['i_base', 'i_bg', 'i_design', 'i_live2d', 'i_goods_scope', 'd_base', 'v_plan', 'v_permit'];
const PIECE_CHECKS = [
  'i_commercial', 'i_nosns', 'i_copyright', 'i_highres', 'i_print',
  'i_live2d_layer', 'i_goods_usage',
  'd_rawdata', 'd_print', 'd_commercial', 'd_nosns'
];
const PIECE_COUNTS = [
  'd_qty',
  'i_extraPerson', 'i_expression', 'i_expression_sd',
  'i_costume', 'i_costume_sd', 'i_hairstyle', 'i_hairstyle_sd'
];

function newPieceState() {
  return { service: 'illust', kind: '', sub: '', baseType: '', radios: {}, checks: {}, counts: {}, usage: [], goods: [] };
}

let pieces = [newPieceState()];
let currentPiece = 0;
/* 復元中は calcTotal に状態を保存させない（途中経過が保存されるのを防ぐ） */
let isApplyingPiece = false;

/* 今のフォームの内容を状態オブジェクトに写し取る */
function readPieceState() {
  const st = newPieceState();
  st.service  = currentTab;
  st.kind     = currentKind;
  st.sub      = currentSub;
  st.baseType = currentBaseType;
  if (!st.baseType) {
    const b = document.querySelector('input[name="i_base"]:checked');
    if (b) st.baseType = b.dataset.type;
  }
  /* 同じ値の選択肢が複数あっても取り違えないよう、値ではなく位置で覚える */
  PIECE_RADIOS.forEach(n => {
    const list = Array.from(document.querySelectorAll('input[name="' + n + '"]'));
    const idx  = list.findIndex(e => e.checked);
    st.radios[n] = idx < 0 ? null : idx;
  });
  PIECE_CHECKS.forEach(id => {
    const el = document.getElementById(id);
    if (el) st.checks[id] = el.checked;
  });
  PIECE_COUNTS.forEach(k => { st.counts[k] = counts[k] || 0; });
  st.usage = Array.from(document.querySelectorAll('.i_usage')).map(el => el.checked);
  st.goods = goodsRowEls().map(r => r.querySelector('.sim-goods-input').value);
  return st;
}

/* 状態オブジェクトをフォームに書き戻す（表示中の点数を切り替えるときに使う） */
function applyPieceState(st) {
  isApplyingPiece = true;
  /* サービスタブ */
  currentTab = st.service;
  document.querySelectorAll('.sim-tabs .sim-tab').forEach(b => {
    b.classList.toggle('is-active', b.dataset.target === st.service);
  });
  document.querySelectorAll('.sim-section').forEach(sec => sec.classList.remove('is-active'));
  const sec = document.getElementById('sim-' + st.service);
  if (sec) sec.classList.add('is-active');

  /* ラジオ */
  PIECE_RADIOS.forEach(n => {
    document.querySelectorAll('input[name="' + n + '"]').forEach((el, i) => {
      el.checked = (st.radios[n] === i);
    });
  });
  /* チェックボックス */
  PIECE_CHECKS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = !!st.checks[id];
  });
  /* 使用用途 */
  document.querySelectorAll('.i_usage').forEach((el, i) => { el.checked = !!st.usage[i]; });
  /* カウンター */
  PIECE_COUNTS.forEach(k => {
    counts[k] = st.counts[k] || 0;
    const numEl = document.getElementById(k + 'Num');
    if (numEl) {
      numEl.textContent = counts[k];
      const ctrl = numEl.closest('.sim-counter-controls');
      if (ctrl) ctrl.classList.toggle('is-zero', counts[k] === 0);
    }
  });
  /* グッズの行 */
  const list = document.getElementById('goodsList');
  if (list) {
    list.innerHTML = '';
    st.goods.forEach(name => {
      addGoodsRow(false);
      const rows = goodsRowEls();
      rows[rows.length - 1].querySelector('.sim-goods-input').value = name;
    });
  }
  /* デザインの種別表示を戻す */
  currentSub = st.sub || '';
  if (st.kind) showKind(st.kind, true); else resetKind();
  /* 等身／SDの表示切り替え */
  currentBaseType = st.baseType;
  if (st.baseType) {
    showBaseTypeCards(st.baseType);
    if (UX_MODE === 'B') {
      const tabs  = document.querySelector('.sim-base-type-tabs');
      const badge = document.getElementById('base-type-badge');
      const label = document.getElementById('base-badge-label');
      const thumb = document.getElementById('base-badge-thumb');
      if (label) label.textContent = st.baseType === 'normal'
        ? (currentLang === 'en' ? 'Standard' : '等身キャラ')
        : (currentLang === 'en' ? 'Chibi / SD' : 'SDキャラ');
      if (thumb) thumb.src = baseTypeThumbs[st.baseType];
      if (tabs)  tabs.style.display  = 'none';
      if (badge) badge.style.display = 'flex';
    }
  } else if (st.radios.i_base === null || st.radios.i_base === undefined) {
    resetBaseType();
    if (UX_MODE === 'B') {
      const tabs  = document.querySelector('.sim-base-type-tabs');
      const badge = document.getElementById('base-type-badge');
      if (badge) badge.style.display = 'none';
      if (tabs)  tabs.style.display  = '';
    }
  }
  /* showBaseTypeCards はグリッドの先頭カードを選ぶ仕様なので、保存していた構図を選び直す */
  if (st.radios.i_base !== null && st.radios.i_base !== undefined) {
    document.querySelectorAll('input[name="i_base"]').forEach((el, i) => {
      el.checked = (st.radios.i_base === i);
    });
  }
  isApplyingPiece = false;
}

/* === 1点ぶんの計算 === */
/* DOMではなく状態オブジェクトから計算する。
   DOMを見るのはラベル文字列の取得だけで、値の書き換えはしない。
   戻り値： prod  … 制作の対価（納期倍率がかかる）
            disc  … 割引対象（ベース料金＋追加キャラクター）
            lic   … 権利料（倍率・割引の対象外）
            items … 内訳の行 */
function labelOf(el) {
  const wrap = el && el.closest('.sim-option, .sim-pose-card');
  const name = wrap && wrap.querySelector('.sim-option-name');
  return name ? name.textContent.trim() : '';
}
function radioEl(name, idx) {
  if (idx === null || idx === undefined) return null;
  return document.querySelectorAll('input[name="' + name + '"]')[idx] || null;
}

function computePiece(st) {
  let prodJPY = 0, prodUSD = 0, discJPY = 0, discUSD = 0, licJPY = 0, licUSD = 0;
  const items = [];
  const addY = yen => { prodJPY += yen; prodUSD += usdOf(yen); };
  const addBase = (yen, usd) => { prodJPY += yen; prodUSD += usd; discJPY += yen; discUSD += usd; };
  const addLic = (yen, usd) => { licJPY += yen; licUSD += usd; };
  const c = k => st.counts[k] || 0;

  if (st.service === 'illust') {
    const baseEl  = radioEl('i_base', st.radios.i_base);
    const baseYen = baseEl ? parseInt(baseEl.value) : 0;
    const baseUsd = usdOf(baseYen);
    const isSD    = baseEl ? baseEl.dataset.type === 'sd' : false;

    if (baseYen) {
      addBase(baseYen, baseUsd);
      items.push({ name: labelOf(baseEl), yen: baseYen });
    }
    const extraYen = isSD ? 5000 : 6500;
    if (c('i_extraPerson') > 0) {
      addBase(c('i_extraPerson') * extraYen, c('i_extraPerson') * usdOf(extraYen));
      items.push({ name: '追加キャラクター ×' + c('i_extraPerson'), yen: c('i_extraPerson') * extraYen });
    }
    const designEl  = radioEl('i_design', st.radios.i_design);
    const designVal = designEl ? parseInt(designEl.value) : 0;
    if (designVal > 0) { addY(designVal); items.push({ name: 'キャラクターデザイン', yen: designVal }); }
    const bgEl  = radioEl('i_bg', st.radios.i_bg);
    const bgVal = bgEl ? parseInt(bgEl.value) : 0;
    if (bgVal > 0) { addY(bgVal); items.push({ name: labelOf(bgEl), yen: bgVal }); }

    if (c('i_expression') > 0)    { addY(c('i_expression') * 1500);    items.push({ name: '表情差分（等身） ×' + c('i_expression'), yen: c('i_expression') * 1500 }); }
    if (c('i_expression_sd') > 0) { addY(c('i_expression_sd') * 1000); items.push({ name: '表情差分（SD） ×' + c('i_expression_sd'), yen: c('i_expression_sd') * 1000 }); }
    /* 等身の衣装・髪型差分はベース料金に対する％。SDは固定額 */
    if (!isSD) {
      if (c('i_costume') > 0) {
        const y = c('i_costume') * Math.round(baseYen * 0.7), u = c('i_costume') * Math.round(baseUsd * 0.7);
        prodJPY += y; prodUSD += u;
        items.push({ name: '衣装差分（等身・70%） ×' + c('i_costume'), yen: y, usd: u });
      }
      if (c('i_hairstyle') > 0) {
        const y = c('i_hairstyle') * Math.round(baseYen * 0.5), u = c('i_hairstyle') * Math.round(baseUsd * 0.5);
        prodJPY += y; prodUSD += u;
        items.push({ name: '髪型差分（等身・50%） ×' + c('i_hairstyle'), yen: y, usd: u });
      }
    }
    if (c('i_costume_sd') > 0)   { addY(c('i_costume_sd') * 2000);   items.push({ name: '衣装差分（SD） ×' + c('i_costume_sd'), yen: c('i_costume_sd') * 2000 }); }
    if (c('i_hairstyle_sd') > 0) { addY(c('i_hairstyle_sd') * 2000); items.push({ name: '髪型差分（SD） ×' + c('i_hairstyle_sd'), yen: c('i_hairstyle_sd') * 2000 }); }

    document.querySelectorAll('.i_usage').forEach((el, i) => {
      if (st.usage[i]) items.push({ name: labelOf(el), yen: 0, type: 'free' });
    });
    if (st.checks.i_goods_usage) items.push({ name: 'グッズ販売', yen: 0, type: 'quote' });

    const hc = !!st.checks.i_highres, pc = !!st.checks.i_print;
    if (hc || pc) {
      addY(3500);
      items.push({ name: hc && pc ? '高解像度（動画＋印刷）' : hc ? '高解像度（動画素材）' : '高解像度（印刷用）', yen: 3500 });
    }
    const live2dEl  = radioEl('i_live2d', st.radios.i_live2d);
    const live2dVal = live2dEl ? parseInt(live2dEl.value) : 0;
    if (live2dVal > 0) { addY(live2dVal); items.push({ name: labelOf(live2dEl), yen: live2dVal }); }
    if (st.checks.i_live2d_layer) { addY(30000); items.push({ name: 'Live2Dパーツ分け', yen: 30000 }); }

    /* 権利料 */
    if (st.checks.i_copyright) {
      /* 譲渡料は金額を出さず応相談。合計には加算しない */
      items.push({ name: '著作権譲渡', yen: 0, type: 'quote' });
      if (st.checks.i_nosns) { addLic(5000, usdOf(5000)); items.push({ name: 'SNS・サンプル掲載不可', yen: 5000 }); }
    } else {
      if (st.checks.i_commercial) { addLic(5000, usdOf(5000)); items.push({ name: '商用利用ライセンス', yen: 5000 }); }
      if (st.checks.i_nosns)      { addLic(5000, usdOf(5000)); items.push({ name: 'SNS・サンプル掲載不可', yen: 5000 }); }
      const scopeEl = radioEl('i_goods_scope', st.radios.i_goods_scope);
      if (st.checks.i_commercial && scopeEl) {
        const scope = scopeEl.value;
        st.goods.forEach((typed, i) => {
          const idx  = scope === 'goods' ? i - 1 : i;
          const rate = idx < 0 ? 0 : GOODS_RATES[Math.min(idx, GOODS_RATES.length - 1)];
          const label = (typed || '').trim() || ('グッズ ' + (i + 1) + '種類目');
          if (rate === 0) {
            items.push({ name: (typed || '').trim() ? label + '（1種類目）' : label, yen: 0, type: 'goodsFree' });
          } else {
            const y = Math.round(baseYen * rate), u = Math.round(baseUsd * rate);
            addLic(y, u);
            items.push({ name: label + '（' + goodsOrderLabel(idx) + ' ' + Math.round(rate * 100) + '%）', yen: y, usd: u });
          }
        });
      }
    }
  } else if (st.service === 'design') {
    const bEl     = radioEl('d_base', st.radios.d_base);
    const unitYen = bEl ? effectivePrice(bEl) : 0;
    /* 「1点あたり」の種別は個数を掛ける */
    const perUnit = !!(bEl && bEl.dataset.perUnit);
    const qty     = perUnit ? Math.max(1, st.counts.d_qty || 1) : 1;
    const baseYen = unitYen * qty;
    const baseUsd = usdOf(unitYen) * qty;
    if (baseYen) {
      /* キャンペーン価格はすでに値引きした価格なので、割引対象には入れない */
      if (isCampaignActive(bEl)) { prodJPY += baseYen; prodUSD += baseUsd; }
      else addBase(baseYen, baseUsd);
      items.push({ name: labelOf(bEl) + (perUnit ? ' ×' + qty : '') + (isCampaignActive(bEl) ? '（キャンペーン価格）' : ''), yen: baseYen });
    }
    ['d_rawdata', 'd_print'].forEach(id => {
      if (!st.checks[id]) return;
      const el = document.getElementById(id);
      const yen = parseInt(el.value);
      addY(yen);
      items.push({ name: labelOf(el), yen });
    });
    ['d_commercial', 'd_nosns'].forEach(id => {
      if (!st.checks[id]) return;
      const el = document.getElementById(id);
      const yen = parseInt(el.value);
      addLic(yen, usdOf(yen));
      items.push({ name: labelOf(el), yen });
    });
  } else if (st.service === 'video') {
    const planEl  = radioEl('v_plan', st.radios.v_plan);
    const planVal = planEl ? planEl.value : null;
    if (planEl) {
      const yen = effectivePrice(planEl);
      /* プランは制作の対価。ただしモニター価格はすでに値引き済みなので割引対象に入れない */
      if (isCampaignActive(planEl)) { prodJPY += yen; prodUSD += usdOf(yen); }
      else addBase(yen, usdOf(yen));
      const permitEl = radioEl('v_permit', st.radios.v_permit);
      const suffix = (planVal === '70000' && permitEl && permitEl.value === 'no') ? '（Live2D風での制作）' : '';
      items.push({ name: labelOf(planEl) + suffix + (isCampaignActive(planEl) ? '（モニター価格）' : ''), yen });
    }
  }


  return { prodJPY, prodUSD, discJPY, discUSD, licJPY, licUSD, items };
}

/* === 合計金額の計算（全点数の合算） === */
function calcTotal() {
  updateFilter();
  updateGoodsVisibility();
  updateCommercialIncluded();
  updateVideoMonitorNote();
  /* 表示中の点数の内容を取り込んでから合算する */
  if (!isApplyingPiece) pieces[currentPiece] = readPieceState();

  /* 納期・リピーター割引は注文全体で1回 */
  const rushSel = document.querySelector('input[name="i_rush"]:checked')
               || document.querySelector('input[name="d_rush"]:checked');
  const rushRate = rushSel ? parseFloat(rushSel.value) : 1;
  const repeatEl = document.getElementById('i_repeat');
  const isRepeat = !!(repeatEl && repeatEl.checked);

  let totalJPY = 0, totalUSD = 0, licJPY = 0, licUSD = 0;
  const breakdown = [];

  pieces.forEach((st, i) => {
    const p = computePiece(st);
    const prodJ = Math.round(p.prodJPY * rushRate);
    const prodU = Math.round(p.prodUSD * rushRate);
    const discJ = Math.round(p.discJPY * rushRate);
    const discU = Math.round(p.discUSD * rushRate);
    /* リピーター割引と複数点割引はどちらも10%引きなので、重ねずに一度だけ引く */
    const applyCut = isRepeat || i > 0;
    const cutJ = applyCut ? Math.round(discJ * 0.1) : 0;
    const cutU = applyCut ? Math.round(discU * 0.1) : 0;
    totalJPY += prodJ - cutJ;
    totalUSD += prodU - cutU;
    licJPY += p.licJPY;
    licUSD += p.licUSD;
    breakdown.push({ index: i, items: p.items, cutJ, cutU, reason: !applyCut ? '' : (i > 0 ? 'multi' : 'repeat') });
  });

  /* 追加修正は注文全体で1回。制作の対価なので納期倍率はかかる */
  const rev = counts.i_revision || 0;
  if (rev > 0) {
    totalJPY += Math.round(rev * 1500 * rushRate);
    totalUSD += Math.round(rev * usdOf(1500) * rushRate);
  }
  /* 権利料は倍率・割引の対象外なので最後に定額で足す */
  totalJPY += licJPY;
  totalUSD += licUSD;

  const totalEl = document.getElementById('totalAmount');
  totalEl.innerHTML =
    (currentCurrency === 'USD'
      ? '$' + totalUSD.toLocaleString('en-US')
      : '¥' + totalJPY.toLocaleString('ja-JP'))
    + '<span>〜</span>';
  totalEl.classList.remove('is-updated');
  void totalEl.offsetWidth;
  totalEl.classList.add('is-updated');
  const totalTopEl = document.getElementById('totalAmountTop');
  if (totalTopEl) totalTopEl.innerHTML = totalEl.innerHTML;
  if (prevTotalJPY !== -1 && totalJPY - prevTotalJPY >= 8000) createPriceBurst();
  prevTotalJPY = totalJPY;

  /* 表示中の点数のグッズ料率を更新する */
  const cur = pieces[currentPiece];
  if (cur.service === 'illust') {
    const bYen = cur.radios.i_base ? parseInt(cur.radios.i_base) : 0;
    updateGoodsRates(bYen, usdOf(bYen));
  }
  renderBreakdown(breakdown, rev, rushRate, rushSel);
  updatePieceTabs();
}

/* === 内訳レシート === */
function renderBreakdown(breakdown, rev, rushRate, rushSel) {
  /* 下部バー：表示中の点数のタグだけ出す */
  const cur = breakdown[currentPiece];
  const tagsHtml = cur ? cur.items.map(l => '<span class="sim-total-selected-tag">' + l.name + '</span>').join('') : '';
  const selEl = document.getElementById('sim-selected-list');
  if (selEl) selEl.innerHTML = tagsHtml;

  const breakdownList = document.getElementById('breakdownList');
  if (!breakdownList) return;

  let rows = '', delay = 0;
  const row = (cls, name, price) =>
    '<div class="receipt-item' + (cls ? ' ' + cls : '') + '" style="animation-delay:' + ((delay++) * 0.06) + 's">' +
    '<span class="receipt-item-name">' + name + '</span>' +
    '<span class="receipt-item-price">' + price + '</span></div>';

  breakdown.forEach(b => {
    /* 2点以上あるときだけ点数の見出しを出す */
    if (breakdown.length > 1) {
      rows += '<div class="receipt-piece-head" style="animation-delay:' + ((delay++) * 0.06) + 's">' +
              (currentLang === 'en' ? 'Piece ' + (b.index + 1) : (b.index + 1) + '点目') + '</div>';
    }
    b.items.forEach(l => {
      const type = l.type || 'item';
      if (type === 'free')          rows += row('receipt-item--free', l.name, currentLang === 'en' ? 'framing only' : '構図調整のみ');
      else if (type === 'quote')    rows += row('receipt-item--free', l.name, currentLang === 'en' ? 'please inquire' : '応相談');
      else if (type === 'goodsFree')rows += row('receipt-item--free', l.name, currentLang === 'en' ? 'included in license' : '商用ライセンスに含む');
      else rows += row('', l.name, l.usd !== undefined ? formatPair(l.yen, l.usd) : formatAmt(l.yen));
    });
    if (b.cutJ > 0) {
      const label = b.reason === 'multi'
        ? (currentLang === 'en' ? 'Multiple-piece discount' : '複数点割引（ベース料金）')
        : (currentLang === 'en' ? 'Repeat discount' : 'リピーター割引（ベース料金）');
      rows += row('receipt-item--discount', label, '−' + formatPair(b.cutJ, b.cutU));
    }
  });

  if (rev > 0) rows += row('', (currentLang === 'en' ? 'Extra revisions ×' : '追加修正 ×') + rev, formatAmt(rev * 1500));
  if (rushSel && rushRate > 1) {
    const rName = rushSel.closest('.sim-option').querySelector('.sim-option-name');
    const nm = (rName && rName.firstChild && rName.firstChild.textContent.trim()) || '納期';
    rows += row('receipt-item--surcharge', nm, '×' + rushRate);
  }

  rows += '<hr class="receipt-divider" style="animation-delay:' + ((delay++) * 0.06) + 's">';
  const totalEl = document.getElementById('totalAmount');
  rows += '<div class="receipt-total" style="animation-delay:' + ((delay++) * 0.06) + 's">' +
          '<span class="receipt-total-label">' + (currentLang === 'en' ? 'Estimated total' : '目安合計') + '</span>' +
          '<span class="receipt-total-price">' + (totalEl ? totalEl.innerHTML : '') + '</span></div>';
  breakdownList.innerHTML = rows;
}

/* === 点数タブの操作 === */
const PIECE_MAX = 5;

function pieceLabel(i) {
  return currentLang === 'en' ? 'Piece ' + (i + 1) : (i + 1) + '点目';
}

/* タブのボタンを点数ぶん作り直す */
function updatePieceTabs() {
  const bar = document.getElementById('pieceTabs');
  if (!bar) return;
  const addBtn = document.getElementById('pieceAddBtn');
  bar.querySelectorAll('.sim-piece-tab').forEach(b => b.remove());
  pieces.forEach((st, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sim-tab sim-piece-tab' + (i === currentPiece ? ' is-active' : '');
    b.dataset.piece = i;
    b.textContent = pieceLabel(i);
    b.addEventListener('click', () => switchPiece(i));
    bar.insertBefore(b, addBtn);
  });
  addBtn.disabled = pieces.length >= PIECE_MAX;
  /* 2点以上のときだけ削除ボタンを出す */
  let del = document.getElementById('pieceDelBtn');
  if (pieces.length > 1) {
    if (!del) {
      del = document.createElement('button');
      del.type = 'button';
      del.id = 'pieceDelBtn';
      del.className = 'sim-tab sim-piece-del';
      del.textContent = '×';
      del.addEventListener('click', removeCurrentPiece);
      bar.appendChild(del);
    }
  } else if (del) {
    del.remove();
  }
}

function switchPiece(i) {
  if (i === currentPiece) return;
  pieces[currentPiece] = readPieceState();
  currentPiece = i;
  applyPieceState(pieces[i]);
  updateCopyrightState();
  updateGoodsVisibility();
  calcTotal();
  updateDeliveryNote();
  updateRushAvailability();
}

function addPiece() {
  if (pieces.length >= PIECE_MAX) return;
  pieces[currentPiece] = readPieceState();
  pieces.push(newPieceState());
  currentPiece = pieces.length - 1;
  applyPieceState(pieces[currentPiece]);
  updateCopyrightState();
  updateGoodsVisibility();
  calcTotal();
  updateDeliveryNote();
}

function removeCurrentPiece() {
  if (pieces.length <= 1) return;
  pieces.splice(currentPiece, 1);
  currentPiece = Math.max(0, currentPiece - 1);
  applyPieceState(pieces[currentPiece]);
  updateCopyrightState();
  updateGoodsVisibility();
  calcTotal();
  updateDeliveryNote();
}

/* === デザイン：種別 → バリエーションの2段階選択 === */
/* イラストタブの「等身/SD → 構図」と同じ作り。
   種別を選ぶとバッジに折りたたみ、その種別のバリエーションだけ表示する */
const KIND_LABELS = {
  namelogo: 'ネームロゴ', schedule: '配信スケジュール表', overlay: '配信オーバーレイ',
  bg: '配信背景', header: 'ヘッダー', profile: 'プロフィールカード',
  thumb: '配信サムネイル', wallpaper: '動く壁紙', stamp: 'スタンプ・バッジ',
  ring: 'アイコンリング', commentcss: 'コメント欄カスタムCSS', clock: '配信時計', profilesite: 'プロフィールサイト'
};
const KIND_LABELS_EN = {
  namelogo: 'Name Logo', schedule: 'Stream Schedule', overlay: 'Stream Overlay',
  bg: 'Stream Background', header: 'Header', profile: 'Profile Card',
  thumb: 'Stream Thumbnail', wallpaper: 'Live Wallpaper', stamp: 'Stamps & Badges',
  ring: 'Icon Ring', commentcss: 'Chat CSS', clock: 'Stream Clock', profilesite: 'Profile Site'
};
const SUB_LABELS = { 'header-gift': 'バッジ返礼品', 'header-marriage': 'よめこな王返礼品', 'bg-h': '横配信', 'bg-v': '縦配信', 'stamp-chara': 'キャラ', 'stamp-text': '文字のみ', 'stamp-item': '小物・食べ物' };
const SUB_LABELS_EN = { 'header-gift': 'Badge gift', 'header-marriage': 'Marriage form gift', 'bg-h': 'Landscape', 'bg-v': 'Portrait', 'stamp-chara': 'Character', 'stamp-text': 'Text only', 'stamp-item': 'Items & Food' };
let currentKind = '';
let currentSub  = '';

function kindLabel(kind) {
  return (currentLang === 'en' ? KIND_LABELS_EN : KIND_LABELS)[kind] || '';
}

/* 指定した種別のバリエーションだけ出す。他の種別の選択は解除する */
function showKind(kind, keepSelection) {
  currentKind = kind;
  const subTabs = document.getElementById('d-sub-' + kind);
  /* サブ種別を持つ種別は、まずサブを選んでもらう */
  document.querySelectorAll('.sim-sub-tabs').forEach(t => { t.style.display = (t.id === 'd-sub-' + kind) ? '' : 'none'; });
  const targetGrid = subTabs ? ('d-kind-' + currentSub) : ('d-kind-' + kind);
  document.querySelectorAll('.sim-kind-grid').forEach(g => {
    const on = g.id === targetGrid;
    g.style.display = on ? '' : 'none';
    if (!on) g.querySelectorAll('input[name="d_base"]').forEach(r => { r.checked = false; });
  });
  /* 押したタブのすぐ下に開くよう、選択肢のかたまりを移動する */
  const activeBtn = document.querySelector('.sim-kind-tab[data-kind="' + kind + '"]');
  const group     = activeBtn && activeBtn.closest('.sim-kind-group');
  const gridEl    = document.getElementById(targetGrid);
  const qtyEl     = document.getElementById('d-qty-counter');
  /* 選択肢が1つしかない場合は選ばせない（そこまで選んだ時点で決まっているため） */
  if (gridEl && !keepSelection) {
    const only = gridEl.querySelectorAll('input[name="d_base"]');
    if (only.length === 1) only[0].checked = true;
  }

  /* 「配信スタイル」「モチーフ」「プラン」の見出しを、それぞれの直前に置く */
  function headingFor(el) {
    if (!el || !el.dataset.heading) return null;
    const id = el.id + '-heading';
    let h = document.getElementById(id);
    if (!h) {
      h = document.createElement('span');
      h.id = id;
      h.className = 'sim-step-label';
    }
    h.textContent = el.dataset.heading;
    return h;
  }
  /* 使っていない見出しは隠す */
  document.querySelectorAll('.sim-step-label').forEach(h => { h.style.display = 'none'; });

  /* カテゴリーの枠の中に入れることで、点線の区切りより上に収まる */
  if (group) {
    if (subTabs) {
      const h = headingFor(subTabs);
      if (h) { h.style.display = ''; group.appendChild(h); }
      group.appendChild(subTabs);
    }
    if (gridEl) {
      const h = headingFor(gridEl);
      if (h) { h.style.display = ''; group.appendChild(h); }
      group.appendChild(gridEl);
    }
    if (qtyEl) group.appendChild(qtyEl);
    /* 詳細の注記も、そのカテゴリーの中（点線の上）に置く */
    ['d-monitor-note', 'd-wallpaper-note', 'd-stamp-note', 'd-header-note'].forEach(id => {
      const n = document.getElementById(id);
      if (n) group.appendChild(n);
    });
  }

  /* タブは畳まず、選んだものをハイライトして選び直せるようにする */
  document.querySelectorAll('.sim-kind-tab[data-kind]').forEach(b => {
    b.classList.toggle('is-active', b.dataset.kind === kind);
  });
  document.querySelectorAll('.sim-sub-tab').forEach(b => {
    b.classList.toggle('is-active', b.dataset.sub === currentSub);
  });
  /* 種別を選んだ直後は未選択のまま。お客さんにバリエーションを選んでもらう。
     点数も1点に戻す（前の種別の点数を持ち越さない） */
  if (!keepSelection) {
    document.querySelectorAll('#d-kind-' + kind + ' input[name="d_base"]').forEach(r => { r.checked = false; });
    counts.d_qty = 1;
    const numEl = document.getElementById('d_qtyNum');
    if (numEl) numEl.textContent = '1';
  }
}

/* 種別の選択そのものをやり直す */
function resetKind() {
  currentKind = '';
  currentSub  = '';
  document.querySelectorAll('.sim-sub-tabs').forEach(t => { t.style.display = 'none'; });
  counts.d_qty = 1;
  const qtyNum = document.getElementById('d_qtyNum');
  if (qtyNum) qtyNum.textContent = '1';
  document.querySelectorAll('.sim-kind-grid').forEach(g => {
    g.style.display = 'none';
    g.querySelectorAll('input[name="d_base"]').forEach(r => { r.checked = false; });
  });
  document.querySelectorAll('.sim-kind-tab, .sim-sub-tab').forEach(b => b.classList.remove('is-active'));
}

function initKindTabs() {
  document.querySelectorAll('.sim-kind-tab[data-kind]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentSub = '';
      showKind(btn.dataset.kind, false);
      calcTotal();
      updateMascotMessage(btn);
    });
  });
  document.querySelectorAll('.sim-sub-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      currentSub = btn.dataset.sub;
      showKind(btn.dataset.parent, false);
      calcTotal();
    });
  });

}


/* === 商用利用が込みの種別（動く壁紙など）=== */
/* data-commercial-included を持つ選択肢では、商用利用ライセンスを二重取りしない */
function updateCommercialIncluded() {
  const sel = document.querySelector('input[name="d_base"]:checked');
  const included = !!(sel && sel.dataset.commercialIncluded);
  const com = document.getElementById('d_commercial');
  if (!com) return;
  const label = com.closest('label');
  if (included) {
    com.checked = false;
    com.disabled = true;
    if (label) label.classList.add('is-disabled');
  } else {
    com.disabled = false;
    if (label) label.classList.remove('is-disabled');
  }
  /* モニター価格（サンプル掲載と引き換えの割引）を選んだら、掲載不可は選べない。
     サンプルを集めるための値引きなので、掲載を止められると目的が消えるため */
  const nosns = document.getElementById('d_nosns');
  const isMonitor = !!(sel && sel.dataset.monitor);
  if (nosns) {
    const nlabel = nosns.closest('label');
    if (isMonitor) {
      nosns.checked = false;
      nosns.disabled = true;
      if (nlabel) nlabel.classList.add('is-disabled');
    } else {
      nosns.disabled = false;
      if (nlabel) nlabel.classList.remove('is-disabled');
    }
  }
  const mnote = document.getElementById('d-monitor-note');
  if (mnote) mnote.style.display = isMonitor ? '' : 'none';

  /* 種別ごとの注記の出し分け */
  const wnote = document.getElementById('d-wallpaper-note');
  if (wnote) wnote.style.display = (currentKind === 'wallpaper') ? '' : 'none';
  const snote = document.getElementById('d-stamp-note');
  if (snote) snote.style.display = (currentKind === 'stamp') ? '' : 'none';
  const hnote = document.getElementById('d-header-note');
  if (hnote) hnote.style.display = (currentSub === 'header-marriage') ? '' : 'none';
  /* 1点あたりの単価の種別だけ点数カウンターを出す */
  const qty = document.getElementById('d-qty-counter');
  if (qty) qty.style.display = (sel && sel.dataset.perUnit) ? '' : 'none';
}

/* === ＭＶ制作：プレミアムプランの確認モーダル === */
/* プレミアムを選んだ瞬間に開き、絵師様の許可の有無を確認する。
   許可なしでもプレミアムのまま。ただし「Live2D風の演出での制作」の注記がカードに残る */
let v2dPrevPlan = null;

function openV2dModal() {
  const modal = document.getElementById('v2dModal');
  if (!modal) return;
  modal.hidden = false;
  document.querySelectorAll('input[name="v_permit"]').forEach(r => { r.checked = false; });
  const warn = document.getElementById('v2dWarn');
  if (warn) warn.hidden = true;
  const ok = document.getElementById('v2dOk');
  if (ok) ok.disabled = true;
}

function closeV2dModal() {
  const modal = document.getElementById('v2dModal');
  if (modal) modal.hidden = true;
}

/* 許可なしのときだけ、プレミアムのカードに赤い注記を残す */
function updateVideoMonitorNote() {
  const note = document.getElementById('v-monitor-note');
  if (!note) return;
  const sel = document.querySelector('input[name="v_plan"]:checked');
  note.style.display = (sel && isCampaignActive(sel)) ? '' : 'none';
}

function updateV2dNote() {
  const note = document.getElementById('v_premium_note');
  if (!note) return;
  const premium = document.getElementById('v_premium');
  const permit  = document.querySelector('input[name="v_permit"]:checked');
  const show = !!(premium && premium.checked && permit && permit.value === 'no');
  note.style.display = show ? '' : 'none';
}

function initV2dModal() {
  const premium = document.getElementById('v_premium');
  if (!premium) return;

  /* プレミアム以外を選んだら、許可の選択と注記をリセットする */
  document.querySelectorAll('input[name="v_plan"]').forEach(r => {
    r.addEventListener('change', () => {
      if (r.id === 'v_premium') {
        openV2dModal();
      } else {
        v2dPrevPlan = r.value;
        document.querySelectorAll('input[name="v_permit"]').forEach(p => { p.checked = false; });
        updateV2dNote();
      }
    });
  });

  document.querySelectorAll('input[name="v_permit"]').forEach(r => {
    r.addEventListener('change', () => {
      const warn = document.getElementById('v2dWarn');
      if (warn) warn.hidden = r.value !== 'no';
      const ok = document.getElementById('v2dOk');
      if (ok) ok.disabled = false;
    });
  });

  const okBtn = document.getElementById('v2dOk');
  if (okBtn) okBtn.addEventListener('click', () => {
    closeV2dModal();
    updateV2dNote();
    calcTotal();
  });

  const cancelBtn = document.getElementById('v2dCancel');
  if (cancelBtn) cancelBtn.addEventListener('click', () => {
    /* プレミアムの選択を取り消して、直前のプランに戻す */
    premium.checked = false;
    if (v2dPrevPlan) {
      const prev = document.querySelector('input[name="v_plan"][value="' + v2dPrevPlan + '"]');
      if (prev) prev.checked = true;
    }
    document.querySelectorAll('input[name="v_permit"]').forEach(p => { p.checked = false; });
    closeV2dModal();
    updateV2dNote();
    calcTotal();
  });

  /* 背景クリックでもキャンセル扱いにする */
  const overlay = document.getElementById('v2dModal');
  if (overlay) overlay.addEventListener('click', e => {
    if (e.target === overlay && cancelBtn) cancelBtn.click();
  });
}


/* === モニター価格の端数処理 === */
/* 割引後の端数（1000円未満の部分）を、500円以上なら500円に、500円未満なら切り捨てる。
   例：4,000×0.7＝2,800 → 2,500 ／ 6,000×0.7＝4,200 → 4,000 */
const MONITOR_RATE = 0.7;
function roundMonitor(yen) {
  const base = Math.floor(yen / 1000) * 1000;
  return base + (yen - base >= 500 ? 500 : 0);
}

/* ¥2,000以下のサービスはモニター価格の対象外。
   割引しても手取りが残らないため */
const MONITOR_MIN = 2000;
function monitorPriceOf(regular) {
  if (regular <= MONITOR_MIN) return null;
  const v = roundMonitor(regular * MONITOR_RATE);
  return v > 0 ? v : null;
}

/* モニター価格の項目は、通常価格から計算して端数を丸める。
   HTMLに書いた金額ではなくこの計算式が正になるので、割引率を変えても揃う */
function initMonitorPrices() {
  document.querySelectorAll('input[data-monitor]').forEach(el => {
    const regular = parseInt(el.value);
    if (!regular) return;
    const v = monitorPriceOf(regular);
    if (v === null) { delete el.dataset.monitor; delete el.dataset.campaignPrice; return; }
    el.dataset.campaignPrice = String(v);
  });
}

/* === 期間限定キャンペーン価格 === */
/* data-campaign-price（特価）と data-campaign-until（最終日）を持つ選択肢を対象に、
   期限内なら特価に差し替える。期限を過ぎたら何もしないので通常価格に戻る。
   キャンペーン価格はすでに値引きした価格なので、リピーター割引・複数点割引の対象外にする */
function isCampaignActive(el) {
  if (!el || !el.dataset.campaignPrice || !el.dataset.campaignUntil) return false;
  const until = new Date(el.dataset.campaignUntil + 'T23:59:59');
  return new Date() <= until;
}

/* 実際にご請求する金額。キャンペーン中なら特価を返す */
function effectivePrice(el) {
  if (isCampaignActive(el)) return parseInt(el.dataset.campaignPrice);
  return el ? parseInt(el.value) : 0;
}

/* キャンペーン中なら表示を特価に差し替えてラベルと赤字を出す */
function applyCampaigns() {
  document.querySelectorAll('input[data-campaign-price]').forEach(el => {
    const label   = el.closest('.sim-option, .sim-pose-card');
    const priceEl = label && label.querySelector('.sim-option-price');
    if (!label || !priceEl) return;
    const regular = parseInt(el.value);

    if (isCampaignActive(el)) {
      label.classList.add('is-campaign');
      priceEl.classList.add('sim-price-campaign');
      priceEl.innerHTML =
        '<span class="sim-price-regular">' + formatAmt(regular) + '</span> ' +
        formatAmt(parseInt(el.dataset.campaignPrice)) + '〜';
      if (!label.querySelector('.sim-campaign-badge')) {
        const badge = document.createElement('span');
        badge.className = 'sim-campaign-badge';
        badge.textContent = currentLang === 'en' ? 'SALE' : 'キャンペーン価格';
        label.insertBefore(badge, label.firstChild);
      } else {
        label.querySelector('.sim-campaign-badge').textContent =
          currentLang === 'en' ? 'SALE' : 'キャンペーン価格';
      }
    } else {
      label.classList.remove('is-campaign');
      priceEl.classList.remove('sim-price-campaign');
      priceEl.textContent = formatAmt(regular) + '〜';
      const badge = label.querySelector('.sim-campaign-badge');
      if (badge) badge.remove();
    }
  });
}


/* === 通貨・言語 === */
let currentCurrency = 'JPY';
let currentLang = 'jp';

/* Fiverrの相場に合わせたUSD金額テーブル（¥÷150の自動換算ではない） */
const USD_AMOUNT = {
  0:0, 1000:7, 1500:10, 2000:14, 3000:20, 3500:25,
  5000:35, 6000:42, 6500:45, 7000:50, 8000:55, 9000:62, 10000:70,
  13000:90, 15000:100, 18000:125, 20000:140, 30000:200, 35000:240
};

/* 円→ドル換算（テーブルにない金額は¥150/＄で丸める） */
function usdOf(yen) {
  return USD_AMOUNT[yen] !== undefined ? USD_AMOUNT[yen] : Math.round(yen / 150);
}

function formatAmt(yen) {
  if (currentCurrency === 'USD') {
    return '$' + usdOf(yen).toLocaleString('en-US');
  }
  return '¥' + yen.toLocaleString('ja-JP');
}

/* ％計算で出た金額用：ドル額を換算せず渡された値で表示する。
   ベース料金のUSDに％を掛けた額と、合計への加算額をズレさせないため */
function formatPair(yen, usd) {
  return currentCurrency === 'USD'
    ? '$' + usd.toLocaleString('en-US')
    : '¥' + yen.toLocaleString('ja-JP');
}

const SUFFIX_EN = {
  ' / 人': ' / person', ' / 個': ' / each', ' / セット': ' / set',
  ' / 種': ' / style',  ' / 回': ' / revision', ' / 点': ' / piece',
};

function initPriceEls() {
  document.querySelectorAll('.sim-option-price, .sim-counter-price').forEach(el => {
    const m = el.textContent.match(/(＋|\+)?¥([\d,]+)(.*)/);
    if (m) {
      el.dataset.yen   = parseInt(m[2].replace(/,/g, ''));
      el.dataset.pre   = m[1] || '';
      el.dataset.suf   = m[3] || '';
      el.dataset.sufEn = SUFFIX_EN[m[3]] !== undefined ? SUFFIX_EN[m[3]] : (m[3] || '');
    }
  });
}

function updatePriceEls() {
  document.querySelectorAll('[data-yen]').forEach(el => {
    const suf = currentLang === 'en' ? el.dataset.sufEn : el.dataset.suf;
    el.textContent = el.dataset.pre + formatAmt(parseInt(el.dataset.yen)) + (suf || '');
  });
}

function switchCurrency(cur) {
  currentCurrency = cur;
  updatePriceEls();
  applyCampaigns();
  calcTotal();
}

const TRANS_EN = {
  title: 'Price Simulator',
  'お見積もり合計（目安）': 'Estimated Total (approx.)',
  /* グッズ二次利用・著作権譲渡 */
  'グッズ・物販の二次利用': 'Merchandise & Secondary Use',
  'プラン': 'Plan',
  '使用用途': 'Purpose',
  '配信スタイル': 'Stream style',
  'モチーフ': 'Motif',
  'バッジ返礼品': 'Badge gift',
  'よめこな王返礼品': 'Marriage form gift',
  'スタンダード（量産型婚姻届）': 'Standard (template)',
  'プレミアム（一点物婚姻届）': 'Premium (one-off)',
  'テンプレートをお渡しします。ご自分で素材と文字を重ねてお使いください。': 'You receive the template and layer your own artwork and text onto it.',
  '鉛筆の落書き付きの一点物です。ウェディングドレス姿の横顔など、ご希望に合わせてお描きします。': 'A one-off piece with a pencil sketch — a profile in a wedding dress, or whatever you have in mind.',
  /* デザインの種別タブ */
  'ネームロゴ': 'Name Logo',
  '配信スケジュール表': 'Schedule Graphic',
  '配信オーバーレイ': 'Stream Overlay',
  '配信背景': 'Stream Background',
  'ヘッダー': 'Header',
  'プロフィールカード': 'Profile Card',
  '配信サムネイル': 'Thumbnail',
  '動く壁紙': 'Live Wallpaper',
  'スタンプ・バッジ': 'Stamps & Badges',
  'アイコンリング': 'Icon Ring',
  'コメント欄カスタムCSS': 'Chat CSS',
  '配信時計': 'Stream Clock',
  'プロフィールサイト': 'Profile Site',
  '横配信': 'Landscape',
  '縦配信': 'Portrait',
  'キャラ': 'Character',
  '文字のみ': 'Text only',
  '小物・食べ物': 'Items & Food',
  /* デザインのカード説明 */
  'キャラクターのモチーフを1点だけ添えた、すっきりした構成です。': 'A clean design with a single motif from your character.',
  'キャラクターのモチーフを複数点あしらった、装飾の多い構成です。': 'A decorated design with several motifs from your character.',
  '文字そのものをモチーフに置き換えてデザインし、相棒キャラクター（ちびキャラ）を1点お描きします。': 'The letters themselves are redrawn as motifs, plus one companion chibi character.',
  'デコデコ風の装飾でお作りします。曜日・時間帯のレイアウトはご希望に合わせて調整いたします。': 'Made in the heavily decorated style. The layout of days and times is adjusted to your wishes.',
  '世界観に合わせた背景を手描きで描き下ろします（人物は含みません）。': 'A hand-drawn background matching the world of your character (characters not included).',
  '待機画面・枠などをシンプルな構成でお作りします。': 'Waiting screens, frames and so on in a simple layout.',
  '世界観に合わせて描き込んだ、作り込みのある構成です。': 'Richly drawn to match the world of your character.',
  'パソコン・横画面での配信向け。描き込みは控えめです。': 'For landscape streaming on PC. Lightly detailed.',
  'パソコン・横画面での配信向け。描き込みをたっぷり入れます。': 'For landscape streaming on PC. Richly detailed.',
  'スマートフォンの縦画面での配信向け。描き込みは控えめです。': 'For portrait streaming on smartphones. Lightly detailed.',
  'スマートフォンの縦画面での配信向け。描き込みをたっぷり入れます。': 'For portrait streaming on smartphones. Richly detailed.',
  'X・YouTube・Twitchなどのヘッダーをお作りします。シンプルな構成です。サイズはご指定ください。': 'Headers for X, YouTube, Twitch and more, in a simple layout. Please specify the size.',
  '装飾や書き文字を多く入れた、作り込みのある構成です。サイズはご指定ください。': 'A richly decorated layout with hand-lettered text. Please specify the size.',
  '装飾を多く入れた、作り込みのある構成です。項目数が多い場合にも向いています。': 'A richly decorated layout, also suited to cards with many items.',
  '装飾やコラージュを作り込んだ構成です。動きにも変化をつけます。': 'A richly built collage with more movement in the animation.',
  '自己紹介・ボイス診断などのカードをお作りします。項目はご相談のうえ決めます。': 'Profile cards, voice-type cards and similar. We decide the items together.',
  '配信のサムネイルを1点ごとにお作りします。': 'Stream thumbnails, made one at a time.',
  'IRIAMの初配信WEEKやイベント用に、7日分をまとめてお作りします。': 'Seven days in one set — for IRIAM debut weeks and events.',
  'お持ちの写真やイラストでデザインし、iPhoneのライブ写真とAndroid用のmp4でお渡しします。ロック画面で1〜3秒動きます。': 'Designed from your own photos or illustrations, delivered as an iPhone Live Photo and an mp4 for Android. It moves for 1–3 seconds on your lock screen.',
  'キャラクターのスタンプ・バッジです。文字入れは無料でお付けします。': 'Character stamps and badges. Text is added free of charge.',
  '動くキャラクタースタンプです。文字入れは無料でお付けします。': 'Animated character stamps. Text is added free of charge.',
  '文字だけで構成したスタンプ・バッジです。': 'Stamps and badges made of text only.',
  '食べ物や小物のスタンプ・バッジです。': 'Stamps and badges of food and small items.',
  'アイコンのまわりを飾るリングです。シンプルな構成でお作りします。': 'A ring that frames your icon, in a simple design.',
  'モチーフや装飾を多く入れた、作り込みのあるリングです。': 'A richly decorated ring with plenty of motifs.',
  /* デザインの種別・バリエーション */
  'シンプル': 'Simple',
  'デコ': 'Deco',
  'デコデコ': 'Deco Deco',
  'スタンダード': 'Standard',
  'プレミアム': 'Premium',
  '1点ずつ': 'Per piece',
  '一週間セット': 'One-week set',
  '静止画': 'Still image',
  'アニメーション': 'Animated',
  /* ＭＶ制作 */
  'ＭＶ制作プラン': 'MV Production Plans',
  'ご依頼前にご確認ください': 'Before You Order',
  'ライトプラン': 'Light Plan',
  'スタンダードプラン': 'Standard Plan',
  'プレミアムプラン': 'Premium Plan',
  video_delivery: 'All plans take around <strong>one month</strong>. This varies with workload and how quickly we can exchange messages.<br>If you are in a hurry, please ask — depending on my schedule I may be able to accommodate you.',
  '納期': 'Delivery',
  video_hint: 'Prices vary with the length of the track. The listed price assumes you provide the illustration.',
  video_other: '* I also take on other video work such as openings, endings and short-form videos — feel free to ask.',
  video_terms: '・ Illustration work can be commissioned separately (drawn to match the world of the track, with matching expressions and outfits)<br>・ You may bring your own Live2D model. Layered data makes it certain<br>・ If the artwork is not layered I can separate the parts myself, but this requires permission from the artist who drew it<br>・ Pose switching can be added separately (please inquire)',
  /* プレミアムの確認モーダル */
  v2d_title: 'About the Live2D animation',
  v2d_body: 'The Premium plan is animated with a Live2D-rigged character (pose switching is not included).<br>Do you have an illustration separated into layers?<br>I can separate the parts myself if it is not layered, but that requires <strong>permission from the artist who drew it</strong>.',
  '絵師様の許可をいただいています（ご自身で描かれた場合も含みます）': "I have the artist's permission (including artwork you drew yourself)",
  '絵師様の許可はまだいただいていません': "I do not have the artist's permission yet",
  v2d_warn: 'The work will be produced with Live2D-style motion instead<br><span class="sim-modal-warn-sub">If you obtain permission later, I can switch to real Live2D animation. Feel free to ask.</span>',
  v2d_pose: '* Pose switching can be added separately',
  v2d_ok: 'Confirmed',
  v2d_cancel: 'Cancel',
  'グッズ販売': 'Merchandise Sales',
  goods_scope_q: 'First, let me know whether you\'ll also use it for streaming. Which use counts as the primary one changes the fee.',
  '配信でも使う＋グッズ展開': 'Streaming + merchandise',
  'グッズ制作のみ': 'Merchandise only',
  '1種類目から二次利用料': 'secondary use fee from the 1st type',
  '1種類目は商用ライセンス内': '1st type covered by the license',
  '応相談': 'please inquire',
  '配信スケジュール表': 'Stream Schedule Graphic',
  'ネームロゴ シンプル': 'Name Logo (Simple)',
  'ネームロゴ デコ': 'Name Logo (Deco)',
  'ネームロゴ デコデコ': 'Name Logo (Deco Deco)',
  'アクリルスタンド・缶バッジ・Tシャツなど、グッズとして販売される場合はこちらをお選びください。展開される商品の種類によって金額が変わるため、こちらの項目自体に料金は設定していません。':
    'Choose this if you plan to sell the artwork as merchandise — acrylic stands, can badges, T-shirts and so on. No fixed price is set here because the amount depends on how many product types you release.',
  goods_add: '＋ Add merchandise',
  goods_hint:
    'Use on stream overlays, icons and headers is covered by the commercial use license (＋¥5,000). If you also release merchandise, <strong>a secondary use fee applies from the very first product type</strong> (based on the Japan Illustrators\' Association guidelines).<br>Counted by product category — one acrylic stand, one can badge and one T-shirt count as 3 types. Multiple expression variants of the same product still count as one type.',
  '＋ベース料金の70% / セット': '＋70% of base price / set',
  '＋ベース料金の50% / 種':   '＋50% of base price / style',
  '著作権譲渡': 'Copyright Transfer',
  '原則としてお受けしておりません。譲渡が成立した場合は著作権がお客様に移転するため、商用利用ライセンス（＋¥5,000）とグッズの二次利用料は不要になります。':
    '<strong>As a rule I do not offer copyright transfer.</strong> If a transfer is agreed, the copyright passes to you, so the commercial use license (＋¥5,000) and merchandise secondary use fees are no longer required.',
  'いつもありがとうございます。2回目以降のご依頼は、イラスト本体（構図・追加キャラクター）を10%引きにさせていただきます。背景や差分などのオプション、商用利用・著作権譲渡・グッズの二次利用といった権利のお料金は、割引の対象外とさせてください。':
    'Thank you for coming back. From your second commission onward, <strong>10% off the illustration itself (framing and additional characters)</strong>.<br>Options such as backgrounds and variations, and rights fees such as commercial use, copyright transfer and merchandise secondary use, are outside the discount.',
  /* section headers（番号バッジ導入後のh2テキスト） */
  'ベースイラスト': 'Base Illustration',
  'キャラクターデザイン': 'Character Design',
  '背景': 'Background',
  '差分': 'Difference',
  '使用用途（任意・複数選択可）': 'Usage (Optional)',
  '動くイラスト': 'Live2D / Animation',
  'オプション': 'Options',
  '納期': 'Delivery',
  'リピーター割引': 'Repeat Discount',
  '追加修正': 'Extra Revisions',
  'サービス種別': 'Service Type',
  '制作点数': 'Quantity',
  /* base options */
  '胸上（バストアップ）': 'Bust Up',
  '腰上': 'Waist Up',
  '太ももまで': 'Thigh Length',
  '全身': 'Full Body',
  'SDキャラ（デフォルメ）': 'SD / Chibi',
  '等身キャラ': 'Standard',
  'SDキャラ': 'Chibi / SD',
  '1.5頭身': '1.5-Head Chibi',
  '2頭身': '2-Head Chibi',
  '2.5頭身': '2.5-Head Chibi',
  '3頭身': '3-Head Chibi',
  'もっちもちで一番ゆるかわいいバランス。手足もシンプルで、とにかく「かわいい」全開のSDだよ':
    'The squishiest and most loosely cute balance. Simple limbs, pure adorable chibi energy!',
  'コロコロぷにぷにな定番SDバランス。シンプルかわいい系のキャラに◎':
    'Round and plump — the classic chibi balance. Great for simple, cute character designs!',
  'かわいらしさを保ちつつ衣装・髪型の細部まで描き込めるバランス。るーちゃんが一番よく描くのもこれ！':
    'Keeps the cuteness while allowing detailed outfits and hairstyles. This is Yui\'s most-drawn size!',
  'SDの中で一番等身キャラ寄り。体のラインはSDキャラなりによく出るように描ける。アクションポーズも映えてかっこかわいい系にも◎':
    'The most proportional among chibis. Action poses shine and it suits cool-cute styles too!',
  '追加キャラクター人数': 'Additional Characters',
  'デザイン済み（参考画像あり）': 'Already Designed (with ref)',
  'デザインなし（キャラデザインから依頼）': 'No Design (from scratch)',
  'なし / 単色・透過': 'None / Solid / Transparent',
  '簡易背景（グラデ・模様など）': 'Simple Background',
  '描き込みあり背景': 'Detailed Background',
  'SDキャラ用描き込み背景': 'SD Chibi Detailed Background',
  '表情差分': 'Expression Variations',
  '表情差分（等身キャラ）': 'Expression Variations (Standard)',
  '表情差分（SDキャラ）': 'Expression Variations (SD / Chibi)',
  '衣装差分': 'Costume Variations',
  '衣装差分（等身キャラ）': 'Costume Variations (Standard)',
  '衣装差分（SDキャラ）': 'Costume Variations (SD / Chibi)',
  '髪型差分': 'Hairstyle Variations',
  '髪型差分（等身キャラ）': 'Hairstyle Variations (Standard)',
  '髪型差分（SDキャラ）': 'Hairstyle Variations (SD / Chibi)',
  'SNSアイコン': 'SNS Icon',
  'SNSヘッダー': 'SNS Header',
  'YouTubeサムネイル': 'YouTube Thumbnail',
  '動画素材・切り抜き配信': 'Video / Streaming Assets',
  '印刷用高解像度データ（A3対応）': 'Print-ready High-res Data (up to A3)',
  'Live2D用（レイヤー分けPSD納品）': 'Live2D (Layered PSD)',
  'なし': 'None',
  '等身・基本（まばたき・口・呼吸）': 'Standard · Basic (blink, mouth, breath)',
  '等身・ポーズ切り替えあり': 'Standard · With Pose Switch',
  'SDキャラ・基本': 'Chibi · Basic',
  'SDキャラ・ポーズ切り替えあり': 'Chibi · With Pose Switch',
  '商用利用ライセンス': 'Commercial Use License',
  'SNS・サンプル掲載不可': 'No SNS / Portfolio Posting',
  '完成した作品をぐるにゃのSNS・ポートフォリオ・サンプル画像などへの掲載を行いません。プライベートなご利用・成人向けコンテンツへの使用など、公開を希望されない場合にお選びください。':
    'The completed artwork will not be posted on ぐるにゃ\'s SNS, portfolio, or sample pages. Please select this option if you prefer the work to remain private — for personal use, adult content, or any other reason.',
  '完成した作品をぐるにゃのSNS・ポートフォリオ・サンプル画像などへの掲載を行いません。プライベートなご利用・成人向けコンテンツへの使用など、公開を希望されない場合にお選びください。※ ライセンス料は定額のため、納期倍率・リピーター割引の対象外です。':
    'The completed artwork will not be posted on ぐるにゃ\'s SNS, portfolio, or sample pages. Please select this option if you prefer the work to remain private — for personal use, adult content, or any other reason. * License fees are flat-rate and are not affected by rush multipliers or the repeat-client discount.',
  '通常納期': 'Standard Delivery',
  '短縮納期': 'Rush Delivery',
  '最短納期': 'Express Delivery',
  /* 納期の日数タグ */
  days_standard: '10–14 days',
  days_rush:     'within 7 days',
  days_express:  'within 5 days',
  /* 納期の補足メモ */
  '腰上・背景なし基準で10〜14日が目安です。作業量や確認のお返事速度によって前後します。':
    'Est. 10–14 days for waist-up with no background. May vary based on workload and response speed.',
  'ご依頼から7日以内に納品します。確認のご返答は当日〜翌日中にいただける場合に限ります。':
    'Delivered within 7 days. Requires same-day or next-day responses to confirmation requests.',
  'ご依頼から5日以内に納品します。確認のご返答は当日中にいただける場合に限ります。':
    'Delivered within 5 days. Requires same-day responses to all confirmation requests.',
  delivery_flow_note: '※ Work cannot proceed until each review step is approved — delivery may extend if responses are delayed.',
  delivery_start_note: '※ Delivery time is counted from the start of work. A waiting period may apply depending on current workload.',
  'リピーター割引': 'Repeat Customer Discount',
  '追加修正回数（4回目以降）': 'Extra Revisions (4th+)',
  'バナー・広告（静止画）': 'Banner / Ad (Static)',
  'バナー・広告（GIFアニメ）': 'Banner / Ad (GIF)',
  'チラシ・フライヤー（片面）': 'Flyer (Single-sided)',
  '名刺・ショップカード': 'Business Card / Shop Card',
  'ロゴデザイン': 'Logo Design',
  'LPデザイン（コーディングなし）': 'LP Design (No Coding)',
  '追加制作点数': 'Additional Quantity',
  '元データ納品（.ai / .psd）': 'Raw File (.ai / .psd)',
  '印刷用高解像度データ（350dpi）': 'Print High-res (350dpi)',
  /* inline notes */
  'キャンバスサイズ6,500px以上の高解像度データでお渡しします。切り抜き配信・拡大編集・動画素材への利用に適しています。':
    'Delivered at 6,500px or more on the long side. Suitable for stream overlays, video editing, and motion assets.',
  'A3サイズ・350dpi対応の印刷用データでお渡しします。これはデータの仕様に対する料金です。グッズ・物販として販売される場合は、別途「07 オプション」の商用利用ライセンスと「08 グッズ・物販の二次利用」の二次利用料が必要になります。':
    'Delivered as print-ready data at A3 size / 350dpi. <strong>This fee covers the data specification only.</strong> If you sell the artwork as merchandise, the commercial use license under “07 Option” and the secondary use fee under “08 Merchandise & Secondary Use” are required separately.',
  '⚠ 動くイラスト（⑥番）をご依頼の場合はパーツ分けが料金に含まれますので、こちらはチェック不要です。動くイラストのpsdデータをご希望の場合は事前にご相談ください。':
    '⚠ If you order Live2D animation (section ⑥), layered PSD is already included — no need to check this. If you only need the PSD from a regular illustration, please consult in advance.',
  'グッズ販売・企業広告・有料コンテンツ・収益化チャンネルでの使用など、金銭的利益を伴う利用に必要です。個人のSNS投稿・非営利目的には不要です。著作権はぐるにゃに帰属し、このライセンスに譲渡は含まれません。':
    '<strong>Required for any use involving financial gain</strong> — merchandise sales, commercial advertising, paid content, monetized channels and so on. Not required for personal SNS posts or non-commercial use. Copyright remains with ぐるにゃ and is not transferred by this license.',
  option_note: '* Option fees and rights fees are not affected by rush multipliers or the repeat-client discount.',
  /* アコーディオンタイトル */
  '詳細': 'Details',
  '⚠ 注意': '⚠ Note',
  /* Live2Dノート（⚠なし版） */
  '動くイラスト（⑥番）をご依頼の場合はパーツ分けが料金に含まれますので、こちらはチェック不要です。動くイラストのpsdデータをご希望の場合は事前にご相談ください。':
    'If you order Live2D animation (section ⑥), layered PSD is already included — no need to check this. If you only need the PSD from a regular illustration, please consult in advance.',
  /* テキストのみの価格スパン */
  '構図調整のみ': 'Composition only',
  '×1.0': '×1.0',
  '合計×1.5倍': '×1.5 total',
  '合計×2倍': '×2.0 total',
  '2回目以降のご依頼': '2nd order & beyond',
  '基本料金×50% / 点': 'Base ×50% / pc',
  /* data-i18n キー（innerHTML差し替え用） */
  total_label_top:  'Estimated Total (approx.)',
  breakdown_toggle: 'View Breakdown',
  base_type_hint:   'Please select a character type',
  consult_btn:      'Consult about this',
  badge_change:     'Change Type',
  page_desc:     'Select options to calculate your estimated total. Prices are for reference only.',
  usage_hint:    'Composition and resolution are adjusted to fit your use case. Options with extra fees are labeled.',
  highres_both:  '※ High-res fee (¥3,500 / $25) is charged once even if both options are selected.',
  revision_note: 'Up to 3 free revisions included. A fee applies from the 4th revision.<br>Major changes to composition or pose after lineart will be treated as a new order.',
  note_live2d:   '※ After Effects finishing is included with all Live2D orders. Video editing and integration with streaming software are not included, but feel free to consult us.',
  design_top:    '※ Design prices are market-rate estimates. Final pricing confirmed upon consultation.',
  design_qty:    '50% of the base price is added for each additional piece.',
  total_note:    '※ Final pricing is confirmed through consultation.<br>Budget concerns are always welcome — share your vision and budget, and I\'ll do my best to accommodate you.<br>Feel free to reach out via Coconala or X (Twitter) DM.',
};

/* テキストノード取得（sim-tagが入れ子の場合は最初のテキストノードのみ） */
function getJpText(el) {
  if (el.querySelector('.sim-tag')) {
    return el.firstChild?.textContent?.trim() || el.textContent.trim();
  }
  return el.textContent.trim();
}

function switchLang(lang) {
  currentLang = lang;
  const titleEl = document.getElementById('page-title');
  const totalLabelEl = document.querySelector('.sim-total-label');
  if (lang === 'en') {
    titleEl.textContent = TRANS_EN.title;
    if (totalLabelEl) totalLabelEl.textContent = TRANS_EN['お見積もり合計（目安）'];
    /* セクション見出し・選択肢名・カウンターラベル */
    document.querySelectorAll('.sim-card h2, .sim-option-name, .sim-counter-label, .sim-pose-desc, .sim-base-type-tab span, .sim-kind-tab').forEach(el => {
      const jp = el.dataset.jp || getJpText(el);
      if (!el.dataset.jp) el.dataset.jp = jp;
      const en = TRANS_EN[jp];
      if (!en) return;
      if (el.querySelector('.sim-tag') && el.firstChild?.nodeType === 3) {
        el.dataset.jpNode = el.firstChild.textContent;
        el.firstChild.textContent = en + ' ';
      } else {
        el.textContent = en;
      }
    });
    /* 補足ノートカードの本文（innerHTML保存でstrong等を維持） */
    document.querySelectorAll('.sim-note-accordion-body').forEach(el => {
      const jp = el.dataset.jp || el.textContent.trim();
      if (!el.dataset.jp) el.dataset.jp = jp;
      if (!el.dataset.jpHtml) el.dataset.jpHtml = el.innerHTML;
      const en = TRANS_EN[jp];
      if (en) el.innerHTML = en;
    });
    /* ¥なしのテキストのみ価格スパン（％表記の差分料金・著作権譲渡料を含む） */
    document.querySelectorAll('.sim-option-price:not([data-yen]), .sim-counter-price:not([data-yen])').forEach(el => {
      if (!el.dataset.jp) el.dataset.jp = el.textContent.trim();
      const en = TRANS_EN[el.dataset.jp];
      if (en !== undefined) el.textContent = en;
    });
    /* data-i18n要素（innerHTML差し替え） */
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (!el.dataset.jpHtml) el.dataset.jpHtml = el.innerHTML;
      const en = TRANS_EN[key];
      if (en !== undefined) el.innerHTML = en;
    });
    updatePriceEls();
  } else {
    titleEl.textContent = '料金シミュレーター';
    if (totalLabelEl) totalLabelEl.textContent = 'お見積もり合計（目安）';
    /* data-jpで元テキスト復元 */
    document.querySelectorAll('[data-jp]').forEach(el => {
      if (el.classList.contains('sim-note-accordion-body') && el.dataset.jpHtml) {
        el.innerHTML = el.dataset.jpHtml; /* strongなどHTMLごと復元 */
      } else if (el.dataset.jpNode && el.firstChild?.nodeType === 3) {
        el.firstChild.textContent = el.dataset.jpNode;
      } else {
        el.textContent = el.dataset.jp;
      }
    });
    /* data-i18n要素をHTMLごと復元 */
    document.querySelectorAll('[data-i18n]').forEach(el => {
      if (el.dataset.jpHtml) el.innerHTML = el.dataset.jpHtml;
    });
    updatePriceEls();
  }
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.lang === lang);
  });
  /* 内訳・グッズ行の表示も言語に合わせるため calcTotal 経由で再描画する */
  calcTotal();
  updateMascotMessage(null);
  updateDeliveryNote();
  /* バッジラベルを言語に合わせて更新 */
  const badgeLabel = document.getElementById('base-badge-label');
  if (badgeLabel && currentBaseType) {
    badgeLabel.textContent = currentBaseType === 'normal'
      ? (lang === 'en' ? 'Standard' : '等身キャラ')
      : (lang === 'en' ? 'Chibi / SD' : 'SDキャラ');
  }
}

/* === バーストパーティクル === */
let prevTotalJPY = -1;

function createPriceBurst() {
  const el = document.getElementById('totalAmount');
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const style = getComputedStyle(document.documentElement);
  const colors = [
    style.getPropertyValue('--color-accent').trim(),
    style.getPropertyValue('--color-sidebar').trim(),
    style.getPropertyValue('--color-border').trim(),
  ];

  for (let i = 0; i < 12; i++) {
    const angle  = (i / 12) * Math.PI * 2;
    const dist   = 35 + Math.random() * 35;
    const size   = 4 + Math.random() * 5;
    const color  = colors[Math.floor(Math.random() * colors.length)];
    const p = document.createElement('span');
    p.className = 'price-particle';
    p.style.cssText = `left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${color};transform:translate(-50%,-50%);opacity:1;`;
    document.body.appendChild(p);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      p.style.transition = 'transform 0.55s cubic-bezier(0,0,0.2,1), opacity 0.55s ease';
      p.style.transform  = `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px))`;
      p.style.opacity    = '0';
    }));
    setTimeout(() => p.remove(), 700);
  }
}

/* === 著作権譲渡と商用利用ライセンスの排他制御 === */
/* 譲渡が成立すると権利ごと移るので、商用利用ライセンスは選べないようにする */
function updateCopyrightState() {
  const copyright  = document.getElementById('i_copyright');
  const commercial = document.getElementById('i_commercial');
  if (!copyright || !commercial) return;
  const label = commercial.closest('label');
  if (copyright.checked) {
    commercial.checked  = false;
    commercial.disabled = true;
    label?.classList.add('is-disabled');
  } else {
    commercial.disabled = false;
    label?.classList.remove('is-disabled');
  }
}

/* === イベント登録・初期化 === */
/* 商用利用・著作権譲渡・グッズ販売はグッズ欄の状態更新を挟むので、下で個別に登録する */
document.querySelectorAll('input[type="radio"], input[type="checkbox"]')
  .forEach(el => {
    if (el.id === 'i_commercial' || el.id === 'i_copyright' || el.id === 'i_goods_usage') return;
    el.addEventListener('change', calcTotal);
  });
/* 使用用途で「グッズ販売」を選んだら商用利用ライセンスを自動で入れる。
   著作権譲渡を選んでいる場合は権利ごと移転するので何もしない */
const goodsUsageEl = document.getElementById('i_goods_usage');
if (goodsUsageEl) {
  goodsUsageEl.addEventListener('change', () => {
    const commercial = document.getElementById('i_commercial');
    const copyright  = document.getElementById('i_copyright');
    if (goodsUsageEl.checked && commercial && !(copyright && copyright.checked)) {
      commercial.checked = true;
    }
    updateGoodsVisibility();
    calcTotal();
  });
}
/* 商用利用・著作権譲渡の切り替えでグッズ欄の表示を更新する */
['i_commercial', 'i_copyright'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('change', () => {
    updateCopyrightState();
    updateGoodsVisibility();
    calcTotal();
  });
});
/* ベース・背景・Live2D変更時に納期注意書きを更新 */
['input[name="i_base"]', 'input[name="i_bg"]', 'input[name="i_live2d"]', 'input[name="i_rush"]'].forEach(sel =>
  document.querySelectorAll(sel).forEach(el => el.addEventListener('change', updateDeliveryNote))
);

/* === Live2D選択時に短縮・最短納期をグレーアウト === */
function updateRushAvailability() {
  const live2dEl = document.querySelector('input[name="i_live2d"]:checked');
  const blocked  = live2dEl && live2dEl.value !== '0';

  ['1.5', '2'].forEach(val => {
    const input = document.querySelector(`input[name="i_rush"][value="${val}"]`);
    const label = input?.closest('label');
    if (!input || !label) return;
    if (blocked) {
      label.classList.add('is-disabled');
      input.disabled = true;
      if (input.checked) {
        const normal = document.querySelector('input[name="i_rush"][value="1"]');
        if (normal) { normal.checked = true; calcTotal(); updateDeliveryNote(); }
      }
    } else {
      label.classList.remove('is-disabled');
      input.disabled = false;
    }
  });
}
document.querySelectorAll('input[name="i_live2d"]')
  .forEach(el => el.addEventListener('change', updateRushAvailability));
initMonitorPrices();
applyCampaigns();
initV2dModal();
initKindTabs();
const pieceAddBtnEl = document.getElementById('pieceAddBtn');
if (pieceAddBtnEl) pieceAddBtnEl.addEventListener('click', addPiece);
updatePieceTabs();
initPriceEls();
updateCopyrightState();
updateGoodsVisibility();
calcTotal();
updateDeliveryNote();
updateRushAvailability();

/* カウンター初期化：− ボタンの識別とゼロ状態の適用 */
document.querySelectorAll('.sim-counter-btn').forEach(btn => {
  if (btn.textContent.trim() === '−') btn.classList.add('sim-counter-btn--minus');
});
document.querySelectorAll('.sim-counter-controls').forEach(controls => {
  controls.classList.add('is-zero');
});

/* === 右クリック・ドラッグ保存禁止 === */
document.addEventListener('contextmenu', e => {
  /* 外部リンクの右クリックは許可 */
  const link = e.target.closest('a');
  if (link) {
    const href = link.getAttribute('href') || '';
    if (href && href !== '#' && !href.startsWith('javascript')) return;
  }
  e.preventDefault();
}, true);

/* 画像・動画のドラッグ保存を禁止 */
document.addEventListener('dragstart', e => {
  e.preventDefault();
  e.stopPropagation();
}, true);

/* 画像のユーザー選択を無効化 */
document.querySelectorAll('img').forEach(img => {
  img.setAttribute('draggable', 'false');
  img.style.userSelect = 'none';
  img.style.webkitUserSelect = 'none';
  img.style.pointerEvents = 'none';
});


/* === マスコット吹き出しメッセージ切り替え === */

/* ── 季節別雑談（何も選んでないとき or 選択解除時にランダム表示） ── */
const SEASONAL_MESSAGES = {
  spring: [
    'ゆっくりしていってね₍ᐢ‥ᐢ₎ ♡',
    '春だね〜なんでもお任せくださいね₍ᐢ‥ᐢ₎ ♡',
    '桜がきれいな季節だね₍ᐢ‥ᐢ₎',
    '気になることがあれば気軽に聞いてね₍ᐢ‥ᐢ₎',
  ],
  summer: [
    '最近暑いね₍ᐢ‥ᐢ₎ 水分補給こまめにしてね！',
    '熱中症には気をつけてね₍ᐢ‥ᐢ₎',
    'なんでもお任せくださいね₍ᐢ‥ᐢ₎ ♡',
    'ゆっくりしていってね₍ᐢ‥ᐢ₎',
  ],
  autumn: [
    '秋になってきたね₍ᐢ‥ᐢ₎ ♡ ゆっくりしていってね',
    '創作の秋！一緒に頑張ろうね₍ᐢ‥ᐢ₎',
    'なんでもお任せくださいね₍ᐢ‥ᐢ₎ ♡',
    '気になることは気軽に聞いてね₍ᐢ‥ᐢ₎',
  ],
  winter: [
    '寒くなってきたね₍ᐢ‥ᐢ₎ 暖かくしてね！',
    '風邪ひかないでね₍ᐢ‥ᐢ₎ ♡',
    'ゆっくりしていってね₍ᐢ‥ᐢ₎',
    'なんでもお任せくださいね₍ᐢ‥ᐢ₎ ♡',
  ],
};
const SEASONAL_MESSAGES_EN = {
  spring: [
    'Take your time~ ₍ᐢ‥ᐢ₎ ♡',
    'It\'s spring! Feel free to leave it all to me ₍ᐢ‥ᐢ₎ ♡',
    'Cherry blossoms are beautiful this time of year ₍ᐢ‥ᐢ₎',
    'Feel free to ask if you have any questions ₍ᐢ‥ᐢ₎',
  ],
  summer: [
    'It\'s been so hot lately ₍ᐢ‥ᐢ₎ Stay hydrated!',
    'Be careful of heatstroke ₍ᐢ‥ᐢ₎',
    'Feel free to leave it all to me ₍ᐢ‥ᐢ₎ ♡',
    'Take your time~ ₍ᐢ‥ᐢ₎',
  ],
  autumn: [
    'Autumn is here ₍ᐢ‥ᐢ₎ ♡ Take your time~',
    'It\'s creative season! Let\'s make something great together ₍ᐢ‥ᐢ₎',
    'Feel free to leave it all to me ₍ᐢ‥ᐢ₎ ♡',
    'Feel free to ask anything ₍ᐢ‥ᐢ₎',
  ],
  winter: [
    'Getting cold, isn\'t it ₍ᐢ‥ᐢ₎ Stay warm!',
    'Don\'t catch a cold ₍ᐢ‥ᐢ₎ ♡',
    'Take your time~ ₍ᐢ‥ᐢ₎',
    'Feel free to leave it all to me ₍ᐢ‥ᐢ₎ ♡',
  ],
};

function getSeasonalMessage() {
  let key = 'spring';
  if ([6,7,8].includes(month))   key = 'summer';
  if ([9,10,11].includes(month)) key = 'autumn';
  if ([12,1,2].includes(month))  key = 'winter';
  const msgs = (currentLang === 'en' ? SEASONAL_MESSAGES_EN : SEASONAL_MESSAGES)[key];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

/* ▼ メッセージを増やすときはここに1ブロック追加するだけ ▼
   trigger: 直近クリック優先で使うセレクター（省略可）
   check:   表示条件（trueなら表示）
   message: うさちゃんのセリフ（\n で改行可）               */
const MASCOT_CONDITIONS = [

  /* ── SDキャラタブ選択（頭身未選択の誘導） ── */
  {
    trigger: '.sim-base-type-tab[data-base-type="sd"]',
    check:   () => currentBaseType === 'sd',
    message:    'るーちゃんが一番よく描いてるのが2.5頭身だよ₍ᐢ‥ᐢ₎ ♡ よかったら参考にしてみてね！',
    message_en: 'I draw 2.5-head chibi the most ₍ᐢ‥ᐢ₎ ♡ It might be a good reference!',
  },

  /* ── SD頭身選択 ── */
  {
    trigger: 'input[name="i_base"][value="6000"]',
    check:   () => { const e = document.querySelector('input[name="i_base"]:checked'); return e && e.value === '6000'; },
    message:    'もっちもち最強かわいい！一番ゆるゆるなSDだよ₍ᐢ‥ᐢ₎ ♡',
    message_en: 'Ultimate squishy cuteness! The most chibi-style of them all ₍ᐢ‥ᐢ₎ ♡',
  },
  {
    trigger: 'input[name="i_base"][value="7000"]',
    check:   () => { const e = document.querySelector('input[name="i_base"]:checked'); return e && e.value === '7000'; },
    message:    'コロコロぷにぷにな定番SDだね₍ᐢ‥ᐢ₎ ♡ かわいい系のキャラにぴったり！',
    message_en: 'Round and squishy — the classic chibi look ₍ᐢ‥ᐢ₎ ♡ Perfect for cute characters!',
  },
  {
    trigger: 'input[name="i_base"][value="8000"]',
    check:   () => { const e = document.querySelector('input[name="i_base"]:checked'); return e && e.value === '8000'; },
    message:    'これが一番よく描くやつだよ₍ᐢ‥ᐢ₎ ♡ かわいさと細かさのバランスが最高！',
    message_en: 'This is the one I draw most often ₍ᐢ‥ᐢ₎ ♡ The best balance of cute and detailed!',
  },
  {
    trigger: 'input[name="i_base"][value="9000"]',
    check:   () => { const e = document.querySelector('input[name="i_base"]:checked'); return e && e.value === '9000'; },
    message:    'SDの中で一番等身に近いタイプだね₍ᐢ‥ᐢ₎ アクションポーズも映えるよ！',
    message_en: 'The closest to standard proportions among chibis ₍ᐢ‥ᐢ₎ Action poses look great too!',
  },

  /* ── SDキャラ + 短縮・最短の組み合わせ ── */
  {
    trigger: 'input[name="i_rush"][value="1.5"], input[name="i_rush"][value="2"]',
    check:   () => {
      const base = document.querySelector('input[name="i_base"]:checked');
      const rush = document.querySelector('input[name="i_rush"]:checked');
      return base?.dataset.type === 'sd' && rush && rush.value !== '1';
    },
    message:    'SDキャラは着手からかなり早く納品できるから、納期を縮めても大きな差はないと思うさよ₍ᐢ- -ᐢ₎ もちろん急ぎなら対応するよ！',
    message_en: 'SD chibis are delivered pretty quickly after I start, so rushing doesn\'t make a huge difference ₍ᐢ- -ᐢ₎ But if you\'re in a hurry, I\'ll do my best!',
  },

  /* ── 背景 ── */
  {
    trigger: 'input[name="i_bg"][value="5000"]',
    check:   () => { const e = document.querySelector('input[name="i_bg"]:checked'); return e && e.value === '5000'; },
    message:    '描き込み量によって変わるので、ざっくりのイメージだけでも教えてくれると見積もりやすいうさよ₍ᐢ‥ᐢ₎ ♡',
    message_en: 'Since the price varies with detail level, even a rough idea of what you\'re imagining helps a lot ₍ᐢ‥ᐢ₎ ♡',
  },

  /* ── Live2D ── */
  {
    trigger: '#i_live2d_layer',
    check:   () => document.getElementById('i_live2d_layer')?.checked,
    message:    '大体はモデリングをする前提にパーツ分けしながら立ち絵を描くの！\nモデリングは別途になるから注意が必要うさ₍ᐢ- -ᐢ₎\n動くイラストほしいなら選ばないでね',
    message_en: 'The illustration is drawn with rigging in mind, with separated parts!\nNote that Live2D modeling is a separate service ₍ᐢ- -ᐢ₎\nDon\'t check this if you want the animated version!',
  },
  {
    trigger: 'input[name="i_live2d"][value="35000"]',
    check:   () => { const e = document.querySelector('input[name="i_live2d"]:checked'); return e && e.value === '35000'; },
    message:    'ポーズ切り替えありの動くイラストだね₍ᐢ‥ᐢ₎ ♡ 作業大変だけど、頑張っちゃう！',
    message_en: 'A Live2D with pose switching ₍ᐢ‥ᐢ₎ ♡ It\'s a lot of work but I\'ll give it my all!',
  },
  {
    trigger: 'input[name="i_live2d"][value="15000"]',
    check:   () => { const e = document.querySelector('input[name="i_live2d"]:checked'); return e && e.value === '15000'; },
    message:    '簡単な動きの動くイラストだね₍ᐢ‥ᐢ₎ ♡ live2dでモデリングしてまろやかに動かしちゃうぞ！',
    message_en: 'A simple animated illustration ₍ᐢ‥ᐢ₎ ♡ I\'ll make it move smoothly with Live2D!',
  },

  /* ── キャラクターデザイン ── */
  {
    trigger: 'input[name="i_design"][value="5000"]',
    check:   () => { const e = document.querySelector('input[name="i_design"]:checked'); return e && e.value === '5000'; },
    message:    'キャラデザインもお任せ₍ᐢ‥ᐢ₎ ♡ こういうイメージを参考に描いてとか、好みの雰囲気があったら教えてね！\nイメージと雰囲気だけ指定して他は全部お任せする～ってのもできるうさ₍ᐢ- -ᐢ₎',
    message_en: 'Character design is all on me ₍ᐢ‥ᐢ₎ ♡ Share any references or vibes you like!\nYou can also just describe the mood and leave the rest to me ₍ᐢ- -ᐢ₎',
  },

  /* ── 使用用途 ── */
  {
    trigger: '#i_goods_usage',
    check:   () => document.getElementById('i_goods_usage')?.checked,
    message:    'グッズ販売だね₍ᐢ‥ᐢ₎ ♡ 「07 オプション」の商用利用ライセンスは自動で入れておいたうさよ！\n出す予定のグッズは「08 グッズ・物販の二次利用」に入れてみてね₍ᐢ- -ᐢ₎',
    message_en: 'Selling merch ₍ᐢ‥ᐢ₎ ♡ I\'ve already ticked the commercial use license under “07 Option” for you!\nList the items you\'re planning under “08 Merchandise & Secondary Use” ₍ᐢ- -ᐢ₎',
  },
  {
    trigger: '#i_highres, #i_print',
    check:   () => document.getElementById('i_highres')?.checked && document.getElementById('i_print')?.checked,
    message:    '動画素材と印刷物、両方選んでくれたね₍ᐢ‥ᐢ₎ ♡ 高解像度料金は一回分でいいんだよ！\n二次利用する時は追加料金取らないけど、事前にお知らせしてくれるとすごくすごく嬉しいうさ₍ᐢ;ｗ;ᐢ₎',
    message_en: 'You picked both video and print ₍ᐢ‥ᐢ₎ ♡ The high-res fee is only charged once!\nNo extra charge for secondary use — but a heads-up beforehand would make me super happy ₍ᐢ;ｗ;ᐢ₎',
  },
  {
    trigger: '#i_highres',
    check:   () => document.getElementById('i_highres')?.checked,
    message:    '切り抜き配信用に高解像度でお届けするね₍ᐢ‥ᐢ₎ 配信頑張って！',
    message_en: 'I\'ll deliver it in high resolution for your stream ₍ᐢ‥ᐢ₎ Good luck with the streams!',
  },
  {
    trigger: '#i_print',
    check:   () => document.getElementById('i_print')?.checked,
    message:    'A3・350dpi対応で仕上げるよ₍ᐢ‥ᐢ₎ ♡ \nグッズ完成楽しみだね！',
    message_en: 'I\'ll finish it at A3 / 350dpi ₍ᐢ‥ᐢ₎ ♡\nCan\'t wait to see your merch!',
  },
  {
    trigger: '.i_usage[data-note*="文字"]',
    check:   () => document.querySelector('.i_usage[data-note*="文字"]')?.checked,
    message:    'サムネ用に文字スペースも考えた構図にするね\n歌ってみたなら本家に似せることもできるから気軽くに相談してうさ₍ᐢ‥ᐢ₎♡',
    message_en: 'I\'ll leave room for text in the layout for your thumbnail\nFor song covers, I can match the original style too — feel free to ask ₍ᐢ‥ᐢ₎♡',
  },
  {
    trigger: '.i_usage[data-note*="横長"]',
    check:   () => document.querySelector('.i_usage[data-note*="横長"]')?.checked,
    message:    '横長構図で頭上・両端が切れないよう仕上げるよ₍ᐢ‥ᐢ₎お好みの構図を教えてうさ',
    message_en: 'I\'ll make sure nothing gets cropped in the wide banner format ₍ᐢ‥ᐢ₎ Let me know your preferred layout!',
  },
  {
    trigger: '.i_usage[data-note*="正方形"]',
    check:   () => document.querySelector('.i_usage[data-note*="正方形"]')?.checked,
    message:    '基本はご自分でトリミングして使ってね、正方形構図でも顔が映えるよう仕上げるね₍ᐢ‥ᐢ₎ ♡',
    message_en: 'You can crop it yourself to fit — I\'ll make sure the face stands out even in a square frame ₍ᐢ‥ᐢ₎ ♡',
  },

  /* ── ＭＶ制作 ── */
  {
    trigger: '#v_premium',
    check:   () => document.getElementById('v_premium')?.checked,
    message:    'ポーズ切り替えありにもできるうさよ₍ᐢ‥ᐢ₎ ♡\n顔はそのままで体だけ動かすのでも、立ち絵がガラッと変わるのでも、どっちもかっこいいね！\n同じ顔で体を動かすのか、別のポーズをもう一枚描いてもらってるのか、ヒアリングのときに教えてね♡\nどっちにしてもMVの印象がすごく変わるのは間違いないうさ₍ᐢ- -ᐢ₎',
    message_en: 'Pose switching can be added too ₍ᐢ‥ᐢ₎ ♡\nWhether the face stays and only the body moves, or the whole illustration changes — both look great!\nLet me know during our chat which one you have: the same face with body motion, or a second illustration drawn in a different pose ♡\nEither way it changes the feel of the MV completely ₍ᐢ- -ᐢ₎',
  },
  {
    trigger: 'input[name="v_plan"]',
    check:   () => !!document.querySelector('input[name="v_plan"]:checked'),
    message:    'MV制作、ありがとうございます₍ᐢ‥ᐢ₎ ♡\nお値段は曲の長さで変わるから、尺がわかったら教えてね！\nイラストの描き下ろしもできるうさよ₍ᐢ- -ᐢ₎',
    message_en: 'Thank you for considering an MV ₍ᐢ‥ᐢ₎ ♡\nThe price moves with the length of the track, so let me know the runtime!\nI can draw new illustrations for it too ₍ᐢ- -ᐢ₎',
  },

  /* ── デザイン：動く壁紙 ── */
  {
    trigger: '#d-kind-wallpaper input',
    check:   () => currentKind === 'wallpaper' && !!document.querySelector('#d-kind-wallpaper input:checked'),
    message:    '動く壁紙だね₍ᐢ‥ᐢ₎ ♡ ロック画面でふわっと動くやつ！\n同じ作り方で、配信のアラート演出やトランジションも作れるうさよ。気になったら聞いてね₍ᐢ- -ᐢ₎',
    message_en: 'A live wallpaper ₍ᐢ‥ᐢ₎ ♡ The kind that moves softly on your lock screen!\nI can make stream alerts and transitions the same way — just ask if you are curious ₍ᐢ- -ᐢ₎',
  },
  /* ── デザイン：スタンプ・バッジ ── */
  {
    trigger: '#d-kind-stamp-chara input',
    check:   () => currentSub === 'stamp-chara' && !!document.querySelector('#d-kind-stamp-chara input:checked'),
    message:    'スタンプは文字入れ無料でお付けするうさよ₍ᐢ‥ᐢ₎ ♡\nYouTubeのメンバーシップだけじゃなくて、Discordでも使えるからおすすめ！',
    message_en: 'Text is added free of charge on stamps ₍ᐢ‥ᐢ₎ ♡\nThey work on Discord as well as YouTube memberships — highly recommended!',
  },
  /* ── デザイン：モニター価格 ── */
  {
    trigger: 'input[name="d_base"]',
    check:   () => {
      const sel = document.querySelector('input[name="d_base"]:checked');
      return !!(sel && sel.dataset.monitor && isCampaignActive(sel));
    },
    message:    'いまサンプルを集めてるところだから、お安くしてるうさよ₍ᐢ‥ᐢ₎ ♡\n完成したものをSNSやポートフォリオに載せさせてもらうのが条件だけど、大丈夫かな？\n先着数名様までなので、気になったらお早めに₍ᐢ- -ᐢ₎',
    message_en: 'I am collecting samples right now, so this one is discounted ₍ᐢ‥ᐢ₎ ♡\nThe condition is that I may post the finished work on my SNS and portfolio — is that okay?\nOnly a few slots, so do let me know soon ₍ᐢ- -ᐢ₎',
  },
  /* ── 準備中の種別 ── */
  {
    trigger: '.sim-kind-tab--soon',
    check:   () => ['commentcss', 'clock', 'profilesite'].includes(currentKind),
    message:    'これ、まだ準備中なんだけど作れるうさよ₍ᐢ‥ᐢ₎ ♡\n気になったら気軽にDMしてね！相談だけでも大歓迎うさ＞＜',
    message_en: 'This one is still in the works, but I can make it ₍ᐢ‥ᐢ₎ ♡\nJust DM me if you are curious — happy to chat about it! ＞＜',
  },

  /* ── オプション ── */
  {
    trigger: '#i_copyright',
    check:   () => document.getElementById('i_copyright')?.checked,
    message:    '著作権譲渡は原則お受けしてないんだ₍ᐢ- -ᐢ₎\nでもご事情によっては特別にお客様のご意思を尊重するうさよ！まずは気軽に相談してみてね₍ᐢ‥ᐢ₎ ♡',
    message_en: 'I don\'t normally offer copyright transfer ₍ᐢ- -ᐢ₎\nBut depending on your situation I\'ll respect your wishes as a special case — just ask me first ₍ᐢ‥ᐢ₎ ♡',
  },
  {
    trigger: '#i_commercial',
    check:   () => document.getElementById('i_commercial')?.checked,
    message:    '商用ライセンスありがとうございます₍ᐢ‥ᐢ₎ ♡ 収益化頑張って！\n今はまだ未収益化でも、目指してる配信者さん・VTuberさんは選んでくれると嬉しいうさ₍ᐢ- -ᐢ₎',
    message_en: 'Thank you for choosing the commercial license ₍ᐢ‥ᐢ₎ ♡ Best of luck with monetization!\nEven if you\'re not monetized yet, I\'d be happy if you pick this when you\'re working towards it ₍ᐢ- -ᐢ₎',
  },
  {
    trigger: '#i_nosns',
    check:   () => document.getElementById('i_nosns')?.checked,
    message:    'SNS非掲載で対応するね₍ᐢ‥ᐢ₎ ♡ プライベートな依頼やちょっとR付のものも安心して任せてうさ',
    message_en: 'I\'ll keep it off my SNS ₍ᐢ‥ᐢ₎ ♡ Feel free to request private or mature content — your secret is safe!',
  },

  /* ── 納期 ── */
  {
    trigger: 'input[name="i_rush"]',
    check:   () => !!document.querySelector('input[name="i_rush"]:checked'),
    message:    'あくまであくまで目安なので、納期より前に納品するように心かけてるし、場合によってめっちゃめちゃ爆速で納品しちゃうこともあるうさよ₍ᐢ- ̫-ᐢ₎',
    message_en: 'Just a rough estimate — I always aim to deliver early, and sometimes I\'ll surprise you with super speedy delivery ₍ᐢ- ̫-ᐢ₎',
  },

  /* ── リピーター割引 ── */
  {
    trigger: '#i_repeat',
    check:   () => document.getElementById('i_repeat')?.checked,
    message:    'またきてくれてありがとう₍ᐢ‥ᐢ₎ ♡ いつも応援してるうさ！\n描かせてもらうお礼の割引だから、イラスト本体からお値引きさせてね₍ᐢ- -ᐢ₎',
    message_en: 'Welcome back ₍ᐢ‥ᐢ₎ ♡ I\'m always rooting for you!\nIt\'s my thank-you for letting me draw, so the discount comes off the illustration itself ₍ᐢ- -ᐢ₎',
  },

];
/* ▲ ここまで ▲ */

function updateMascotMessage(changedEl) {
  const textEl   = document.getElementById('mascot-bubble-text');
  const bubbleEl = document.getElementById('mascot-bubble');
  if (!textEl || !bubbleEl) return;

  /* 直近クリックした入力に対応する条件を優先 */
  const triggered = changedEl
    ? MASCOT_CONDITIONS.find(c => c.trigger && changedEl.matches(c.trigger) && c.check())
    : null;

  /* それ以外でマッチしているものがあれば */
  const anyMatch = triggered ?? MASCOT_CONDITIONS.find(c => c.check());

  /* なければ季節の雑談をランダムで */
  const newTx = anyMatch
    ? (currentLang === 'en' && anyMatch.message_en ? anyMatch.message_en : anyMatch.message)
    : getSeasonalMessage();

  if (textEl.textContent === newTx) return;

  bubbleEl.classList.remove('bubble-pop');
  void bubbleEl.offsetWidth;
  bubbleEl.classList.add('bubble-pop');
  textEl.textContent = newTx;
}

/* 入力変化のたびに changedEl を渡して再評価 */
document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(el =>
  el.addEventListener('change', e => updateMascotMessage(e.target))
);

/* 初期メッセージを季節の雑談に */
(function() {
  const t = document.getElementById('mascot-bubble-text');
  if (t) t.textContent = getSeasonalMessage();
})();

/* スクロールでページトップ誘導メッセージ（季節メッセージとランダム切り替え） */
(function() {
  const textEl   = document.getElementById('mascot-bubble-text');
  const bubbleEl = document.getElementById('mascot-bubble');
  const topMsg   = '₍ᐢ‥ᐢ₎ ♡ カーソルで私をトントンしたら最上部まで戻れるうさよ';
  let isAbove    = false;
  let intervalId = null;

  const setMsg = (msg) => {
    if (!textEl) return;
    textEl.textContent = msg;
    bubbleEl?.classList.remove('bubble-pop');
    void bubbleEl?.offsetWidth;
    bubbleEl?.classList.add('bubble-pop');
  };

  window.addEventListener('scroll', () => {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    if (y > 300 && !isAbove) {
      isAbove = true;
      setMsg(topMsg);
      intervalId = setInterval(() => {
        setMsg(Math.random() < 0.4 ? topMsg : getSeasonalMessage());
      }, 6000);
    } else if (y <= 300 && isAbove) {
      isAbove = false;
      clearInterval(intervalId);
      intervalId = null;
      setMsg(getSeasonalMessage());
    }
  });
})();

/* === 内訳パネルトグル（上：breakdownPanel） === */
document.getElementById('breakdownToggle')?.addEventListener('click', () => {
  const panel     = document.getElementById('breakdownPanel');
  const toggleBtn = document.getElementById('breakdownToggle');
  const bar       = panel.querySelector('.receipt-bar');
  const card      = panel.querySelector('.receipt-card');
  const zigzag    = panel.querySelector('.receipt-zigzag-bottom');

  if (panel.classList.contains('is-open')) {
    toggleBtn?.setAttribute('aria-expanded', 'false');
    const body = panel.querySelector('.receipt-body');
    const bar  = panel.querySelector('.receipt-bar');
    const translateY = -(body.offsetHeight + bar.offsetHeight);
    panel.style.setProperty('--body-close-y', translateY + 'px');
    panel.classList.add('is-closing');

    /* bodyのtransition(0.4s)完了後にbarをスライドアップ */
    setTimeout(() => {
      bar.style.transition = 'transform 0.25s ease-in';
      bar.style.transform  = 'translateY(-100%)';
    }, 450);

    setTimeout(() => {
      panel.classList.remove('is-open');
      panel.classList.remove('is-closing');
      panel.style.removeProperty('--body-close-y');
      bar.style.cssText = '';
    }, 900);

  } else {
    panel.classList.add('is-open');
    toggleBtn?.setAttribute('aria-expanded', 'true');
  }
});

/* === タグリストトグル（下バー：sim-total-selected） === */
document.getElementById('breakdownToggleBar')?.addEventListener('click', () => {
  const selectedList = document.getElementById('sim-selected-list');
  const isOpen       = selectedList?.classList.toggle('is-open');
  document.getElementById('breakdownToggleBar')?.setAttribute('aria-expanded', String(isOpen));
});

/* === 相談するボタン（ポップアップ開閉） === */
const consultBtn   = document.getElementById('sim-consult-btn');
const consultPopup = document.getElementById('sim-consult-popup');
consultBtn?.addEventListener('click', e => {
  e.stopPropagation();
  const isOpen = consultPopup.classList.toggle('is-open');
  consultPopup.setAttribute('aria-hidden', !isOpen);
});
document.addEventListener('click', e => {
  if (!document.getElementById('sim-consult')?.contains(e.target)) {
    consultPopup?.classList.remove('is-open');
    consultPopup?.setAttribute('aria-hidden', 'true');
  }
});

/* === ページロードフェードイン === */
requestAnimationFrame(() => requestAnimationFrame(() => {
  document.body.classList.add('is-loaded');
}));
