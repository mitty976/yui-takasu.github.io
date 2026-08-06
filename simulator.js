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
  const next = Math.max(0, counts[key] + delta);
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

/* === タブ切り替え === */
let currentTab = 'illust';
document.querySelectorAll('.sim-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sim-tab').forEach(b => b.classList.remove('is-active'));
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

/* === 合計金額の計算 === */
function calcTotal() {
  updateFilter();
  let totalJPY = 0, totalUSD = 0;
  function addY(yen) {
    totalJPY += yen;
    totalUSD += USD_AMOUNT[yen] !== undefined ? USD_AMOUNT[yen] : Math.round(yen / 150);
  }
  function addC(n, key) {
    const p = countPrices[key];
    totalJPY += n * p;
    totalUSD += n * (USD_AMOUNT[p] !== undefined ? USD_AMOUNT[p] : Math.round(p / 150));
  }
  /* ライセンス料は権利の対価なので納期倍率・リピーター割引の対象外。
     倍率・割引を適用したあとに定額で加算する */
  let licenseJPY = 0, licenseUSD = 0;
  function addLicense(ids) {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el || !el.checked) return;
      const yen = parseInt(el.value);
      licenseJPY += yen;
      licenseUSD += USD_AMOUNT[yen] !== undefined ? USD_AMOUNT[yen] : Math.round(yen / 150);
    });
  }
  if (currentTab === 'illust') {
    const base = document.querySelector('input[name="i_base"]:checked');
    if (base) addY(parseInt(base.value));
    addC(counts.i_extraPerson, 'i_extraPerson');
    const design = document.querySelector('input[name="i_design"]:checked');
    if (design) addY(parseInt(design.value));
    const bg = document.querySelector('input[name="i_bg"]:checked');
    if (bg) addY(parseInt(bg.value));
    addC(counts.i_expression,    'i_expression');
    addC(counts.i_expression_sd, 'i_expression_sd');
    addC(counts.i_costume,       'i_costume');
    addC(counts.i_costume_sd,    'i_costume_sd');
    addC(counts.i_hairstyle,     'i_hairstyle');
    addC(counts.i_hairstyle_sd,  'i_hairstyle_sd');
    const live2d = document.querySelector('input[name="i_live2d"]:checked');
    if (live2d) addY(parseInt(live2d.value));
    /* 動画素材・印刷物は両方選択でも一回分のみ */
    if (document.getElementById('i_highres').checked || document.getElementById('i_print').checked) addY(3500);
    const live2dLayerEl = document.getElementById('i_live2d_layer');
    if (live2dLayerEl && live2dLayerEl.checked) addY(parseInt(live2dLayerEl.value));
    addLicense(['i_commercial', 'i_nosns']);
    addC(counts.i_revision, 'i_revision');
    const rush = document.querySelector('input[name="i_rush"]:checked');
    if (rush) {
      const r = parseFloat(rush.value);
      totalJPY = Math.round(totalJPY * r);
      totalUSD = Math.round(totalUSD * r);
    }
    if (document.getElementById('i_repeat').checked) {
      totalJPY = Math.round(totalJPY * 0.9);
      totalUSD = Math.round(totalUSD * 0.9);
    }
  } else {
    const base = document.querySelector('input[name="d_base"]:checked');
    const baseJPY = base ? parseInt(base.value) : 0;
    const baseUSD = USD_AMOUNT[baseJPY] !== undefined ? USD_AMOUNT[baseJPY] : Math.round(baseJPY / 150);
    totalJPY += baseJPY;
    totalUSD += baseUSD;
    totalJPY += counts.d_extra * Math.round(baseJPY * 0.5);
    totalUSD += counts.d_extra * Math.round(baseUSD * 0.5);
    ['d_rawdata', 'd_print'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.checked) addY(parseInt(el.value));
    });
    addLicense(['d_commercial', 'd_nosns']);
    const rush = document.querySelector('input[name="d_rush"]:checked');
    if (rush) {
      const r = parseFloat(rush.value);
      totalJPY = Math.round(totalJPY * r);
      totalUSD = Math.round(totalUSD * r);
    }
    if (document.getElementById('d_repeat').checked) {
      totalJPY = Math.round(totalJPY * 0.9);
      totalUSD = Math.round(totalUSD * 0.9);
    }
  }
  /* 倍率・割引の適用後にライセンス料を定額で加算 */
  totalJPY += licenseJPY;
  totalUSD += licenseUSD;
  const totalEl = document.getElementById('totalAmount');
  totalEl.innerHTML =
    (currentCurrency === 'USD'
      ? '$' + totalUSD.toLocaleString('en-US')
      : '¥' + totalJPY.toLocaleString('ja-JP'))
    + '<span>〜</span>';
  /* 金額更新のパルスアニメーション */
  totalEl.classList.remove('is-updated');
  void totalEl.offsetWidth;
  totalEl.classList.add('is-updated');
  /* 上部合計エリアにも反映 */
  const totalTopEl = document.getElementById('totalAmountTop');
  if (totalTopEl) totalTopEl.innerHTML = totalEl.innerHTML;
  /* ¥8,000以上の上昇でバースト */
  if (prevTotalJPY !== -1 && totalJPY - prevTotalJPY >= 8000) createPriceBurst();
  prevTotalJPY = totalJPY;
  updateSelectedItems();
}


/* === 選択中項目の可視化 === */
function updateSelectedItems() {
  /* lineItems: { name, yen, type:'item'|'free'|'multiplier'|'discount', multiplier? } */
  const lineItems = [];
  /* ライセンス料の内訳行（倍率・割引の対象外である旨を名前に添える） */
  function pushLicenseItems(ids) {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el || !el.checked) return;
      const name = el.closest('.sim-option').querySelector('.sim-option-name').textContent;
      lineItems.push({ name, yen: parseInt(el.value) });
    });
  }

  if (currentTab === 'illust') {
    const base = document.querySelector('input[name="i_base"]:checked');
    if (base) {
      const nameEl = base.closest('.sim-option, .sim-pose-card')?.querySelector('.sim-option-name');
      lineItems.push({ name: nameEl?.textContent || '', yen: parseInt(base.value) });
    }
    if (counts.i_extraPerson > 0)
      lineItems.push({ name: `追加キャラクター ×${counts.i_extraPerson}`, yen: counts.i_extraPerson * countPrices.i_extraPerson });
    const design = document.querySelector('input[name="i_design"]:checked');
    if (design && parseInt(design.value) > 0)
      lineItems.push({ name: 'キャラクターデザイン', yen: parseInt(design.value) });
    const bg = document.querySelector('input[name="i_bg"]:checked');
    if (bg && parseInt(bg.value) > 0)
      lineItems.push({ name: bg.closest('.sim-option').querySelector('.sim-option-name').textContent, yen: parseInt(bg.value) });
    if (counts.i_expression > 0)    lineItems.push({ name: `表情差分（等身） ×${counts.i_expression}`,    yen: counts.i_expression * 1500 });
    if (counts.i_expression_sd > 0) lineItems.push({ name: `表情差分（SD） ×${counts.i_expression_sd}`,   yen: counts.i_expression_sd * 1000 });
    if (counts.i_costume > 0)       lineItems.push({ name: `衣装差分（等身） ×${counts.i_costume}`,       yen: counts.i_costume * 4000 });
    if (counts.i_costume_sd > 0)    lineItems.push({ name: `衣装差分（SD） ×${counts.i_costume_sd}`,      yen: counts.i_costume_sd * 2000 });
    if (counts.i_hairstyle > 0)     lineItems.push({ name: `髪型差分（等身） ×${counts.i_hairstyle}`,     yen: counts.i_hairstyle * 4000 });
    if (counts.i_hairstyle_sd > 0)  lineItems.push({ name: `髪型差分（SD） ×${counts.i_hairstyle_sd}`,    yen: counts.i_hairstyle_sd * 2000 });
    document.querySelectorAll('.i_usage:checked').forEach(el => {
      lineItems.push({ name: el.closest('.sim-option').querySelector('.sim-option-name').textContent, yen: 0, type: 'free' });
    });
    const hc = document.getElementById('i_highres').checked;
    const pc = document.getElementById('i_print').checked;
    if (hc || pc) {
      const name = hc && pc ? '高解像度（動画＋印刷）' : hc ? '高解像度（動画素材）' : '高解像度（印刷物）';
      lineItems.push({ name, yen: 3500 });
    }
    const live2d = document.querySelector('input[name="i_live2d"]:checked');
    if (live2d && parseInt(live2d.value) > 0)
      lineItems.push({ name: live2d.closest('.sim-option').querySelector('.sim-option-name').textContent, yen: parseInt(live2d.value) });
    const live2dLayerEl = document.getElementById('i_live2d_layer');
    if (live2dLayerEl && live2dLayerEl.checked) lineItems.push({ name: 'Live2Dパーツ分け', yen: 30000 });
    if (counts.i_revision > 0)
      lineItems.push({ name: `追加修正 ×${counts.i_revision}`, yen: counts.i_revision * 1500 });
    const rush = document.querySelector('input[name="i_rush"]:checked');
    if (rush && parseFloat(rush.value) > 1) {
      const rName = rush.closest('.sim-option').querySelector('.sim-option-name');
      lineItems.push({ name: rName?.firstChild?.textContent?.trim() || rName?.textContent || '', yen: null, type: 'multiplier', multiplier: parseFloat(rush.value) });
    }
    if (document.getElementById('i_repeat').checked)
      lineItems.push({ name: 'リピーター割引', yen: null, type: 'discount' });
    /* ライセンス料は倍率・割引の対象外なので、内訳でも倍率行より後に並べる */
    pushLicenseItems(['i_commercial', 'i_nosns']);
  } else {
    const base = document.querySelector('input[name="d_base"]:checked');
    if (base) {
      const baseJPY = parseInt(base.value);
      lineItems.push({ name: base.closest('.sim-option').querySelector('.sim-option-name').textContent, yen: baseJPY });
      if (counts.d_extra > 0)
        lineItems.push({ name: `追加 ${counts.d_extra}点`, yen: counts.d_extra * Math.round(baseJPY * 0.5) });
    }
    ['d_rawdata', 'd_print'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.checked)
        lineItems.push({ name: el.closest('.sim-option').querySelector('.sim-option-name').textContent, yen: parseInt(el.value) });
    });
    const rush = document.querySelector('input[name="d_rush"]:checked');
    if (rush && parseFloat(rush.value) > 1) {
      const rName = rush.closest('.sim-option').querySelector('.sim-option-name');
      lineItems.push({ name: rName?.firstChild?.textContent?.trim() || rName?.textContent || '', yen: null, type: 'multiplier', multiplier: parseFloat(rush.value) });
    }
    if (document.getElementById('d_repeat').checked)
      lineItems.push({ name: 'リピーター割引', yen: null, type: 'discount' });
    pushLicenseItems(['d_commercial', 'd_nosns']);
  }

  /* 下部バー：簡易タグ */
  const tagsHtml = lineItems.map(l => `<span class="sim-total-selected-tag">${l.name}</span>`).join('');
  document.getElementById('sim-selected-list').innerHTML = tagsHtml;

  /* レシート内訳 */
  const breakdownList = document.getElementById('breakdownList');
  if (!breakdownList) return;

  let rows = '';
  let delay = 0;

  lineItems.forEach(l => {
    const type = l.type || 'item';
    if (type === 'multiplier') {
      rows += `<div class="receipt-item receipt-item--surcharge" style="animation-delay:${(delay++) * 0.06}s">
        <span class="receipt-item-name">${l.name}</span>
        <span class="receipt-item-price">×${l.multiplier}</span>
      </div>`;
    } else if (type === 'discount') {
      rows += `<div class="receipt-item receipt-item--discount" style="animation-delay:${(delay++) * 0.06}s">
        <span class="receipt-item-name">${l.name}</span>
        <span class="receipt-item-price">−10%</span>
      </div>`;
    } else if (type === 'free') {
      rows += `<div class="receipt-item receipt-item--free" style="animation-delay:${(delay++) * 0.06}s">
        <span class="receipt-item-name">${l.name}</span>
        <span class="receipt-item-price">構図調整のみ</span>
      </div>`;
    } else {
      rows += `<div class="receipt-item" style="animation-delay:${(delay++) * 0.06}s">
        <span class="receipt-item-name">${l.name}</span>
        <span class="receipt-item-price">${formatAmt(l.yen)}</span>
      </div>`;
    }
  });

  rows += `<hr class="receipt-divider" style="animation-delay:${(delay++) * 0.06}s">`;
  const totalEl = document.getElementById('totalAmount');
  rows += `<div class="receipt-total" style="animation-delay:${(delay++) * 0.06}s">
    <span class="receipt-total-label">目安合計</span>
    <span class="receipt-total-price">${totalEl ? totalEl.innerHTML : ''}</span>
  </div>`;

  breakdownList.innerHTML = rows;
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

function formatAmt(yen) {
  if (currentCurrency === 'USD') {
    const usd = USD_AMOUNT[yen];
    return '$' + (usd !== undefined ? usd : Math.round(yen / 150)).toLocaleString('en-US');
  }
  return '¥' + yen.toLocaleString('ja-JP');
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
  calcTotal();
}

const TRANS_EN = {
  title: 'Price Simulator',
  'お見積もり合計（目安）': 'Estimated Total (approx.)',
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
  '印刷物・グッズ制作': 'Print / Merchandise',
  'Live2D用（レイヤー分けPSD納品）': 'Live2D (Layered PSD)',
  'なし': 'None',
  '等身・基本（まばたき・口・呼吸）': 'Standard · Basic (blink, mouth, breath)',
  '等身・ポーズ切り替えあり': 'Standard · With Pose Switch',
  'SDキャラ・基本': 'Chibi · Basic',
  'SDキャラ・ポーズ切り替えあり': 'Chibi · With Pose Switch',
  '商用利用ライセンス': 'Commercial Use License',
  'SNS・サンプル掲載不可': 'No SNS / Portfolio Posting',
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
  'A4サイズ・350dpi対応の高解像度データでお渡しします。グッズ制作・印刷物への利用に適しています。':
    'Delivered at A4 size / 350dpi. Suitable for merchandise and print production.',
  '⚠ 動くイラスト（⑥番）をご依頼の場合はパーツ分けが料金に含まれますので、こちらはチェック不要です。動くイラストのpsdデータをご希望の場合は事前にご相談ください。':
    '⚠ If you order Live2D animation (section ⑥), layered PSD is already included — no need to check this. If you only need the PSD from a regular illustration, please consult in advance.',
  'グッズ販売・企業広告・有料コンテンツへの使用・収益化チャンネルでの継続使用など、金銭的利益を伴う利用に必要です。現在未収益化でも、収益化を目標とされている配信者・VTuberの方にもお選びいただけますようお願いいたします。個人のSNS投稿・非営利目的には不要です。著作権はぐるにゃに帰属し、このライセンスに著作権の譲渡は含まれません。※ ライセンス料は定額のため、納期倍率・リピーター割引の対象外です。':
    'Required for any use involving financial gain — merchandise sales, commercial advertising, paid content, monetized channels, etc. We also kindly ask streamers and VTubers who are currently non-monetized but working towards monetization to select this option. Not required for personal SNS or non-commercial use. Copyright remains with ぐるにゃ and is not transferred by this license. * License fees are flat-rate and are not affected by rush multipliers or the repeat-client discount.',
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
    document.querySelectorAll('.sim-card h2, .sim-option-name, .sim-counter-label, .sim-pose-desc, .sim-base-type-tab span').forEach(el => {
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
    /* ¥なしのテキストのみ価格スパン */
    document.querySelectorAll('.sim-option-price:not([data-yen])').forEach(el => {
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
  updateSelectedItems();
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

/* === イベント登録・初期化 === */
document.querySelectorAll('input[type="radio"], input[type="checkbox"]')
  .forEach(el => el.addEventListener('change', calcTotal));
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
initPriceEls();
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
    message:    'A4・350dpi対応で仕上げるよ₍ᐢ‥ᐢ₎ ♡ \nグッズ完成楽しみだね！',
    message_en: 'I\'ll finish it at A4 / 350dpi ₍ᐢ‥ᐢ₎ ♡\nCan\'t wait to see your merch!',
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

  /* ── オプション ── */
  {
    trigger: '#i_commercial',
    check:   () => document.getElementById('i_commercial')?.checked,
    message:    '商用ライセンスありがとうございます₍ᐢ‥ᐢ₎ ♡ 収益化頑張って！',
    message_en: 'Thank you for choosing the commercial license ₍ᐢ‥ᐢ₎ ♡ Best of luck with monetization!',
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
    message:    'またきてくれてありがとう₍ᐢ‥ᐢ₎ ♡ いつも応援してるうさ！',
    message_en: 'Welcome back ₍ᐢ‥ᐢ₎ ♡ I\'m always rooting for you!',
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
