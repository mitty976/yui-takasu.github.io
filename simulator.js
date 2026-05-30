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

/* === SD/等身フィルター === */
function updateFilter() {
  const baseEl = document.querySelector('input[name="i_base"]:checked');
  const isSD = baseEl ? baseEl.dataset.type === 'sd' : false;

  /* 追加キャラ料金切り替え */
  const newExtraPrice = isSD ? 5000 : 6500;
  countPrices.i_extraPerson = newExtraPrice;
  const extraPriceEl = document.getElementById('extraPersonPrice');
  if (extraPriceEl) {
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
    updateUsageNotes();
    ['i_commercial', 'i_nosns'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.checked) addY(parseInt(el.value));
    });
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
    ['d_rawdata', 'd_print', 'd_commercial', 'd_nosns'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.checked) addY(parseInt(el.value));
    });
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
  /* ¥8,000以上の上昇でバースト */
  if (prevTotalJPY !== -1 && totalJPY - prevTotalJPY >= 8000) createPriceBurst();
  prevTotalJPY = totalJPY;
  updateSelectedItems();
}

/* === 使用用途の補足メモ === */
function updateUsageNotes() {
  const notes = [];
  document.querySelectorAll('.i_usage:checked')
    .forEach(el => { if (el.dataset.note) notes.push('・' + el.dataset.note); });
  if (document.getElementById('i_highres').checked || document.getElementById('i_print').checked) {
    notes.push('・長辺6,500px以上の高解像度データで納品します（縦・横いずれかが6,500px以上）。');
    notes.push('・A4サイズ・350dpi対応の高解像度データで納品します。');
    notes.push('・二次利用する場合は追加料金いただきませんが、事前にお知らせしてくださいますと幸いです。（任意）');
  }
  const live2dEl = document.getElementById('i_live2d_layer');
  if (live2dEl && live2dEl.checked) notes.push('・' + live2dEl.dataset.note);
  const area = document.getElementById('i_usageNotes');
  const text = document.getElementById('i_usageNoteText');
  if (notes.length > 0) {
    text.textContent = notes.join('\n');
    area.style.display = 'block';
  } else {
    area.style.display = 'none';
  }
}

/* === 選択中項目の可視化 === */
function updateSelectedItems() {
  const items = [];
  if (currentTab === 'illust') {
    const base = document.querySelector('input[name="i_base"]:checked');
    if (base) items.push(base.closest('.sim-option').querySelector('.sim-option-name').textContent);
    if (counts.i_extraPerson > 0) items.push('追加キャラ ×' + counts.i_extraPerson);
    const design = document.querySelector('input[name="i_design"]:checked');
    if (design && parseInt(design.value) > 0) items.push('キャラデザイン');
    const bg = document.querySelector('input[name="i_bg"]:checked');
    if (bg && parseInt(bg.value) > 0) items.push(bg.closest('.sim-option').querySelector('.sim-option-name').textContent);
    if (counts.i_expression    > 0) items.push('表情差分（等身） ×' + counts.i_expression);
    if (counts.i_expression_sd > 0) items.push('表情差分（SD） ×'   + counts.i_expression_sd);
    if (counts.i_costume    > 0) items.push('衣装差分（等身） ×' + counts.i_costume);
    if (counts.i_costume_sd > 0) items.push('衣装差分（SD） ×'   + counts.i_costume_sd);
    if (counts.i_hairstyle    > 0) items.push('髪型差分（等身） ×' + counts.i_hairstyle);
    if (counts.i_hairstyle_sd > 0) items.push('髪型差分（SD） ×'   + counts.i_hairstyle_sd);
    document.querySelectorAll('.i_usage:checked').forEach(el => {
      items.push(el.closest('.sim-option').querySelector('.sim-option-name').textContent);
    });
    if (document.getElementById('i_highres').checked && document.getElementById('i_print').checked) items.push('高解像度（動画＋印刷）');
    else if (document.getElementById('i_highres').checked) items.push('高解像度（動画素材）');
    else if (document.getElementById('i_print').checked)   items.push('高解像度（印刷物）');
    const live2d = document.querySelector('input[name="i_live2d"]:checked');
    if (live2d && parseInt(live2d.value) > 0) items.push(live2d.closest('.sim-option').querySelector('.sim-option-name').textContent);
    if (document.getElementById('i_live2d_layer').checked) items.push('Live2Dパーツ分け');
    if (document.getElementById('i_commercial').checked)   items.push('商用利用ライセンス');
    if (document.getElementById('i_nosns').checked)        items.push('SNS掲載不可');
    if (counts.i_revision > 0) items.push('追加修正 ×' + counts.i_revision);
    const rush = document.querySelector('input[name="i_rush"]:checked');
    if (rush && parseFloat(rush.value) > 1) items.push(rush.closest('.sim-option').querySelector('.sim-option-name').textContent);
    if (document.getElementById('i_repeat').checked) items.push('リピーター割引 −10%');
  } else {
    const base = document.querySelector('input[name="d_base"]:checked');
    if (base) items.push(base.closest('.sim-option').querySelector('.sim-option-name').textContent);
    if (counts.d_extra > 0) items.push('追加 ' + counts.d_extra + '点');
    ['d_rawdata', 'd_print', 'd_commercial', 'd_nosns'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.checked) items.push(el.closest('.sim-option').querySelector('.sim-option-name').textContent);
    });
    const rush = document.querySelector('input[name="d_rush"]:checked');
    if (rush && parseFloat(rush.value) > 1) items.push(rush.closest('.sim-option').querySelector('.sim-option-name').textContent);
    if (document.getElementById('d_repeat').checked) items.push('リピーター割引 −10%');
  }
  document.getElementById('sim-selected-list').innerHTML =
    items.map(t => `<span class="sim-total-selected-tag">${t}</span>`).join('');
}

/* === 通貨・言語 === */
let currentCurrency = 'JPY';
let currentLang = 'jp';

/* Fiverrの相場に合わせたUSD金額テーブル（¥÷150の自動換算ではない） */
const USD_AMOUNT = {
  0:0, 1000:7, 1500:10, 2000:14, 3000:20, 3500:25,
  5000:35, 6500:45, 7000:50, 8000:55, 10000:70,
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
  /* section headers */
  '① ベースイラスト': '① Base Illustration',
  '② キャラクターデザイン': '② Character Design',
  '③ 背景': '③ Background',
  '④ 差分': '④ Variations',
  '⑤ 使用用途（任意・複数選択可）': '⑤ Usage (Optional)',
  '⑥ Live2D・動くイラスト': '⑥ Live2D / Animation',
  '⑦ オプション': '⑦ Options',
  '⑧ 納期': '⑧ Delivery',
  '⑨ リピーター割引': '⑨ Repeat Discount',
  '⑩ 追加修正': '⑩ Extra Revisions',
  '① サービス種別': '① Service Type',
  '② 制作点数': '② Quantity',
  '③ オプション': '③ Options',
  '④ 納期': '④ Delivery',
  '⑤ リピーター割引': '⑤ Repeat Discount',
  /* base options */
  '胸上（バストアップ）': 'Bust Up',
  '腰上': 'Waist Up',
  '太ももまで': 'Thigh Length',
  '全身': 'Full Body',
  'SDキャラ（デフォルメ）': 'SD / Chibi',
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
  'グッズ販売・企業広告・有料コンテンツへの使用・収益化チャンネルでの継続使用など、金銭的利益を伴う利用に必要です。現在未収益化でも、収益化を目標とされている配信者・VTuberの方にもお選びいただけますようお願いいたします。個人のSNS投稿・非営利目的には不要です。著作権はぐるにゃに帰属し、このライセンスに著作権の譲渡は含まれません。':
    'Required for any use involving financial gain — merchandise sales, commercial advertising, paid content, monetized channels, etc. We also kindly ask streamers and VTubers who are currently non-monetized but working towards monetization to select this option. Not required for personal SNS or non-commercial use. Copyright remains with ぐるにゃ and is not transferred by this license.',
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
  page_desc:     'Select options to calculate your estimated total. Prices are for reference only.',
  usage_hint:    'Composition and resolution are adjusted to fit your use case. Options with extra fees are labeled.',
  highres_both:  '※ High-res fee (¥3,500 / $25) is charged once even if both options are selected.',
  revision_note: 'Up to 3 free revisions included. A fee applies from the 4th revision.<br>Major changes to composition or pose after lineart will be treated as a new order.',
  note_live2d:   '※ After Effects finishing is included with all Live2D orders.',
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
    document.querySelectorAll('.sim-card h2, .sim-option-name, .sim-counter-label').forEach(el => {
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
initPriceEls();
calcTotal();

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

/* === 3D カードチルト === */
document.querySelectorAll('.sim-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r  = card.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width  / 2)) / (r.width  / 2);
    const dy = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2);
    card.style.transition = 'box-shadow 0.1s ease';
    card.style.transform  = `perspective(900px) rotateY(${dx * 4}deg) rotateX(${-dy * 4}deg) translateZ(6px)`;
    card.style.boxShadow  = `${-dx * 8}px ${-dy * 8}px 28px rgba(74,42,58,0.1)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.45s ease';
    card.style.transform  = '';
    card.style.boxShadow  = '';
  });
});

/* === ページロードフェードイン === */
requestAnimationFrame(() => requestAnimationFrame(() => {
  document.body.classList.add('is-loaded');
}));
