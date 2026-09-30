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
  i_costume_sd:    3500,
  i_hairstyle:     4000,
  i_hairstyle_sd:  3500,
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
const GOODS_ORDER_FR = ['usage secondaire', 'usage tertiaire', 'usage quaternaire', 'usage à partir du 5e'];
function goodsOrderLabel(idx) {
  const list = currentLang === 'fr' ? GOODS_ORDER_FR : currentLang === 'en' ? GOODS_ORDER_EN : GOODS_ORDER_JP;
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
const GOODS_PLACEHOLDERS_FR = [
  'stand acrylique', 'badge', 'T-shirt', 'porte-clés acrylique',
  'autocollant', 'tapisserie', 'mug', 'pochette transparente',
  'tote bag', 'carte postale', 'coque de téléphone', 'lanière en caoutchouc'
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
  const examples = currentLang === 'fr' ? GOODS_PLACEHOLDERS_FR : currentLang === 'en' ? GOODS_PLACEHOLDERS_EN : GOODS_PLACEHOLDERS;
  goodsRowEls().forEach((row, i) => {
    row.querySelector('.sim-goods-index').textContent = i + 1;
    const input = row.querySelector('.sim-goods-input');
    const ex = examples[i % examples.length];
    input.placeholder = tl('例：' + ex, 'e.g. ' + ex, 'ex. ' + ex);
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
      ? tl('<strong>著作権譲渡</strong>の場合は権利ごと移転するため、二次利用料はかかりません。',
           'With a copyright transfer the rights pass to you, so no secondary use fee applies.',
           'En cas de cession de droits d\'auteur, les droits vous sont transférés, aucun frais d\'usage secondaire ne s\'applique.')
      : tl('「07 オプション」の<strong>商用利用ライセンス</strong>を選ぶと入力できます。',
           'Select the <strong>commercial use license</strong> under “07 Option” to fill this in.',
           'Sélectionnez la <strong>licence d\'utilisation commerciale</strong> sous « 07 Options » pour remplir ce champ.');
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
      rateEl.textContent = tl('商用ライセンスに含む', 'included in license', 'inclus dans la licence');
      rateEl.classList.add('sim-goods-rate--free');
    } else {
      const yen = Math.round(baseYen * rate);
      const usd = Math.round(baseUsd * rate);
      rateEl.textContent = Math.round(rate * 100) + '%　＋' + formatPair(yen, usd);
      rateEl.classList.remove('sim-goods-rate--free');
    }
  });
}

/* === サービスを切り替えたときの後始末 === */
/* 1点につき1サービスなので、別のサービスに移ったら前の選択は意味がなくなる。
   ただし納期・リピーター割引・追加修正は注文全体のものなので残す */
function clearService(service) {
  const clearRadios = names => names.forEach(n => {
    document.querySelectorAll('input[name="' + n + '"]').forEach(el => { el.checked = false; });
  });
  const clearChecks = ids => ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });
  const clearCounts = keys => keys.forEach(k => {
    counts[k] = (k === 'd_qty') ? 1 : 0;
    const numEl = document.getElementById(k + 'Num');
    if (numEl) {
      numEl.textContent = counts[k];
      const ctrl = numEl.closest('.sim-counter-controls');
      if (ctrl) ctrl.classList.toggle('is-zero', counts[k] === 0);
    }
  });

  if (service === 'illust') {
    clearRadios(['i_base', 'i_bg', 'i_design', 'i_live2d', 'i_goods_scope']);
    clearChecks(['i_commercial', 'i_nosns', 'i_copyright', 'i_highres', 'i_print', 'i_live2d_layer', 'i_goods_usage']);
    document.querySelectorAll('.i_usage').forEach(el => { el.checked = false; });
    clearCounts(['i_extraPerson', 'i_expression', 'i_expression_sd', 'i_costume', 'i_costume_sd', 'i_hairstyle', 'i_hairstyle_sd']);
    const list = document.getElementById('goodsList');
    if (list) list.innerHTML = '';
    /* 等身／SDの選択も最初からやり直す */
    resetBaseType();
    if (UX_MODE === 'B') {
      const tabs  = document.querySelector('.sim-base-type-tabs');
      const badge = document.getElementById('base-type-badge');
      if (badge) badge.style.display = 'none';
      if (tabs)  tabs.style.display  = '';
    }
  } else if (service === 'design') {
    clearRadios(['d_base']);
    clearChecks(['d_rawdata', 'd_print', 'd_commercial', 'd_nosns']);
    clearCounts(['d_qty']);
    resetKind();
  } else if (service === 'video') {
    clearRadios(['v_plan', 'v_permit']);
    clearChecks(['v_commercial', 'v_nosns']);
    const note = document.getElementById('v_premium_note');
    if (note) note.style.display = 'none';
  }
}


/* === キャンペーン中であることを外から見せる === */
/* 大カテゴリーを開かないと割引に気づけないのを防ぐ。
   ①サービスタブに印 ②セクション冒頭に一行 ③タブを開いたときにうさぎが言う */
const CAMPAIGN_BANNER = {
  design: 'いまサンプルを集めているので<strong>モニター価格（30%引き）</strong>でお受けしています。<br>先着数名様まで。',
  video:  'ＭＶ制作は<strong>モニター価格（10%引き）</strong>でお受けしています。<br>先着数名様まで。',
};
const CAMPAIGN_BANNER_EN = {
  design: 'I am collecting samples, so most items are at a <strong>monitor price (30% off)</strong>.<br>Only a few slots available.',
  video:  'MV production is at a <strong>monitor price (10% off)</strong>.<br>Only a few slots available.',
};
const CAMPAIGN_BANNER_FR = {
  design: 'Je récolte des exemples, donc la plupart des articles sont au <strong>prix moniteur (30 % de réduction)</strong>.<br>Places limitées.',
  video:  'La production de MV est au <strong>prix moniteur (10 % de réduction)</strong>.<br>Places limitées.',
};
const CAMPAIGN_MASCOT = {
  design: 'いまサンプルを集めてるところだから、お安くしてるうさよ₍ᐢ‥ᐢ₎ ♡\n完成したものをSNSやポートフォリオに載せさせてもらうのが条件だけど、大丈夫かな？\n先着数名様までなので、気になったらお早めに₍ᐢ- -ᐢ₎',
  video:  'ＭＶもモニター価格でお受けしてるうさ₍ᐢ‥ᐢ₎ ♡\n完成したものを30秒くらいのダイジェストで載せさせてもらうのが条件なのだ。\n本編はお客様のチャンネルにご案内するから、宣伝にもなるうさよ',
};


/* 赤い丸は一度見たら消す。ずっと出ていると煩わしく感じる人がいるため。
   キャンペーンの内容が変われば、また出るようにしている */
function campaignSignature(service) {
  const sec = document.getElementById('sim-' + service);
  if (!sec) return '';
  return Array.from(sec.querySelectorAll('input[data-monitor], input[data-campaign-price], input[data-discount-rate]'))
    .filter(isCampaignActive)
    .map(el => (el.dataset.campaignUntil || 'always') + ':' + (el.dataset.campaignPrice || el.dataset.discountRate || ''))
    .join('|');
}
function saleSeen(service) {
  try {
    const saved = JSON.parse(localStorage.getItem('gurunya-sale-seen') || '{}');
    return saved[service] === campaignSignature(service);
  } catch (e) { return false; }
}
function markSaleSeen(service) {
  try {
    const saved = JSON.parse(localStorage.getItem('gurunya-sale-seen') || '{}');
    saved[service] = campaignSignature(service);
    localStorage.setItem('gurunya-sale-seen', JSON.stringify(saved));
  } catch (e) { /* 保存できなくても動作に影響しない */ }
}

/* そのサービスにいま有効な割引があるか */
function serviceHasCampaign(service) {
  const sec = document.getElementById('sim-' + service);
  if (!sec) return false;
  return Array.from(sec.querySelectorAll('input[data-monitor], input[data-campaign-price], input[data-discount-rate]'))
    .some(isCampaignActive);
}

/* 案内の一行とタブの印を出し入れする */
function updateCampaignBanners() {
  ['illust', 'design', 'video'].forEach(service => {
    const active   = serviceHasCampaign(service);
    const showDot  = active && !saleSeen(service);
    /* サービスタブの印 */
    const tab = document.querySelector('.sim-tabs .sim-tab[data-target="' + service + '"]');
    if (tab) {
      let dot = tab.querySelector('.sim-tab-sale');
      if (showDot && !dot) {
        dot = document.createElement('span');
        dot.className = 'sim-tab-sale';
        tab.appendChild(dot);
      } else if (!showDot && dot) {
        dot.remove();
      }
    }
    /* セクション冒頭の一行 */
    const sec = document.getElementById('sim-' + service);
    if (!sec) return;
    let banner = sec.querySelector('.sim-campaign-banner');
    if (active) {
      if (!banner) {
        banner = document.createElement('p');
        banner.className = 'sim-campaign-banner';
        sec.insertBefore(banner, sec.firstElementChild);
      }
      const text = (currentLang === 'fr' ? CAMPAIGN_BANNER_FR : currentLang === 'en' ? CAMPAIGN_BANNER_EN : CAMPAIGN_BANNER)[service];
      if (text) banner.innerHTML = text;
      else banner.remove();
    } else if (banner) {
      banner.remove();
    }
  });
}


/* === サービス切り替えの確認 === */
/* いま選んでいる内容があるときだけ確認する。何も選んでいなければ黙って切り替える */
function hasSelection(service) {
  if (service === 'illust') {
    if (document.querySelector('input[name="i_base"]:checked')) return true;
    return ['i_extraPerson', 'i_expression', 'i_expression_sd', 'i_costume', 'i_costume_sd', 'i_hairstyle', 'i_hairstyle_sd']
      .some(k => (counts[k] || 0) > 0);
  }
  if (service === 'design') return !!document.querySelector('input[name="d_base"]:checked') || !!currentKind;
  if (service === 'video')  return !!document.querySelector('input[name="v_plan"]:checked');
  return false;
}

/* はいを押したときの処理を覚えておく */
let switchConfirmAction = null;
function askSwitch(onOk) {
  const modal = document.getElementById('switchModal');
  if (!modal) { onOk(); return; }
  switchConfirmAction = onOk;
  modal.hidden = false;
}
function initSwitchModal() {
  const modal  = document.getElementById('switchModal');
  const ok     = document.getElementById('switchOk');
  const cancel = document.getElementById('switchCancel');
  if (!modal) return;
  const close = () => { modal.hidden = true; switchConfirmAction = null; };
  if (ok) ok.addEventListener('click', () => {
    const fn = switchConfirmAction;
    close();
    if (fn) fn();
  });
  if (cancel) cancel.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
}

/* === サービスタブ切り替え === */
/* .sim-tab は点数タブでも使っているので、サービスタブの行に限定して拾う */
let currentTab = 'illust';
document.querySelectorAll('.sim-tabs .sim-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.target === currentTab) return;

    const doSwitch = () => {
      /* 前のサービスの選択は残さない（1点につき1サービスのため） */
      clearService(currentTab);
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
      /* 一度開いたら赤い丸は消す */
      markSaleSeen(currentTab);
      updateCampaignBanners();
      /* まだ何も選んでいないうちに、割引をやっていることを伝える */
      if (!hasSelection(currentTab) && CAMPAIGN_MASCOT[currentTab] && serviceHasCampaign(currentTab)) {
        setMascotText(CAMPAIGN_MASCOT[currentTab]);
      } else {
        /* 割引の案内がないタブでは雑談に戻す。前のタブの説明を引きずらないため */
        setMascotText(getSeasonalMessage());
      }
    };

    /* 何か選んでいるときだけ確認する */
    if (hasSelection(currentTab)) askSwitch(doSwitch);
    else doSwitch();
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
  '6000':  { label: '1.5頭身', sd: true, normal: { noBg: '3日', bg: '4日' }, rush: { noBg: '翌日', bg: '2日' }, express: { noBg: '当日', bg: '翌日' } },
  '7000':  { label: '2頭身',   sd: true, normal: { noBg: '3日', bg: '4日' }, rush: { noBg: '翌日', bg: '2日' }, express: { noBg: '当日', bg: '翌日' } },
  '8000':  { label: '2.5頭身', sd: true, normal: { noBg: '5日', bg: '6日' }, rush: { noBg: '3日',  bg: '4日' }, express: { noBg: '当日の晩',   bg: '翌日' } },
  '9000':  { label: '3頭身',   sd: true, normal: { noBg: '7日', bg: '8日' }, rush: { noBg: '4日',  bg: '5日' }, express: { noBg: '翌日の午後', bg: '翌日の晩' } },
};

function updateDeliveryNote() {
  const standardEl    = document.getElementById('delivery-note-standard');
  const rushNoteEl    = document.getElementById('delivery-note-rush');
  const expressNoteEl = document.getElementById('delivery-note-express');
  if (!standardEl) return;

  function setNote(el, jpHtml, enHtml, frHtml) {
    if (!el) return;
    el.innerHTML      = tl(jpHtml, enHtml || jpHtml, frHtml || jpHtml);
    el.dataset.jp     = el.textContent.trim();
    el.dataset.jpHtml = jpHtml;
    el.dataset.enHtml = enHtml || '';
    el.dataset.frHtml = frHtml || '';
  }

  /* 日数を英語表記に変換（「7日」→「7 days」など） */
  function dEN(days) {
    if (!days) return '';
    return days
      .replace(/^(\d+)〜(\d+)日$/, '$1–$2 days')
      .replace(/^(\d+)日〜$/, '$1+ days')
      .replace(/^(\d+)日$/, '$1 days');
  }
  /* 日数をフランス語表記に変換（「7日」→「7 jours」など） */
  function dFR(days) {
    if (!days) return '';
    return days
      .replace(/^(\d+)〜(\d+)日$/, '$1 à $2 jours')
      .replace(/^(\d+)日〜$/, '$1+ jours')
      .replace(/^(\d+)日$/, '$1 jours');
  }

  const bgLabelEN = { '背景なし': 'no background', '簡易背景あり': 'simple background', '描き込み背景あり': 'detailed background' };
  const bgLabelFR = { '背景なし': 'sans arrière-plan', '簡易背景あり': 'arrière-plan simple', '描き込み背景あり': 'arrière-plan détaillé' };
  const baseLabelEN = {
    '胸上': 'Bust-Up', '腰上': 'Waist-Up', '太ももまで': 'Thigh-Length', '全身': 'Full Body',
    '1.5頭身': '1.5-Head Chibi', '2頭身': '2-Head Chibi', '2.5頭身': '2.5-Head Chibi', '3頭身': '3-Head Chibi',
  };
  const baseLabelFR = {
    '胸上': 'Buste', '腰上': 'Taille', '太ももまで': 'Cuisses', '全身': 'Corps Entier',
    '1.5頭身': 'Chibi 1,5 tête', '2頭身': 'Chibi 2 têtes', '2.5頭身': 'Chibi 2,5 têtes', '3頭身': 'Chibi 3 têtes',
  };
  const sufJP = '混雑状況とお返事の速度によって変わりますが、無料修正3回のやり取りを含めた目安で、';
  const sufEN = 'Subject to workload and response speed. Includes up to 3 free rounds of revisions. ';
  const sufFR = 'Selon la charge de travail et la rapidité des réponses. Comprend jusqu\'à 3 retouches gratuites. ';
  const condJP = { normal: 'ご返信が翌々日以内の場合に限ります。', rush: 'ご返信が翌日以内の場合に限ります。', express: 'ご返信が当日中にいただける場合に限ります。' };
  const condEN = { normal: 'Requires responses within 2 days.', rush: 'Requires responses within 1 day.', express: 'Requires same-day responses.' };
  const condFR = { normal: 'Nécessite une réponse sous 2 jours.', rush: 'Nécessite une réponse sous 1 jour.', express: 'Nécessite une réponse le jour même.' };
  const rlJP   = { normal: '通常納期', rush: '短縮納期', express: '最短納期' };
  const rlEN   = { normal: 'Standard Delivery', rush: 'Rush Delivery', express: 'Express Delivery' };
  const rlFR   = { normal: 'Délai Standard', rush: 'Délai Accéléré', express: 'Délai Express' };

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
    const fr = isPose
      ? 'L\'animation Live2D (avec changement de pose) prend environ <strong>25 à 30 jours</strong>. Je ferai de mon mieux pour m\'adapter à vos souhaits, mais les délais accéléré et express ne sont pas disponibles.'
      : 'L\'animation Live2D (clignement, bouche, respiration uniquement) prend environ <strong>18 à 22 jours</strong>. Je ferai de mon mieux pour m\'adapter à vos souhaits, mais les délais accéléré et express ne sont pas disponibles.';
    setNote(standardEl, jp, en, fr);
    setNote(rushNoteEl, jp, en, fr);
    setNote(expressNoteEl, jp, en, fr);
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
  const bgFR    = bgLabelFR[bgLabel] || bgLabel;

  if (!table) {
    setNote(standardEl,
      '腰上・背景なし・通常納期で<strong>10〜14日</strong>が目安です。' + sufJP + condJP.normal,
      'Waist-Up · no background · Standard Delivery: <strong>10–14 days</strong> est. ' + sufEN + condEN.normal,
      'Taille · sans arrière-plan · Délai Standard : <strong>10 à 14 jours</strong> est. ' + sufFR + condFR.normal);
    setNote(rushNoteEl,
      '腰上・背景なし・短縮納期で<strong>7日</strong>が目安です。' + sufJP + condJP.rush,
      'Waist-Up · no background · Rush Delivery: <strong>7 days</strong> est. ' + sufEN + condEN.rush,
      'Taille · sans arrière-plan · Délai Accéléré : <strong>7 jours</strong> est. ' + sufFR + condFR.rush);
    setNote(expressNoteEl,
      '腰上・背景なし・最短納期で<strong>5日</strong>が目安です。' + sufJP + condJP.express,
      'Waist-Up · no background · Express Delivery: <strong>5 days</strong> est. ' + sufEN + condEN.express,
      'Taille · sans arrière-plan · Délai Express : <strong>5 jours</strong> est. ' + sufFR + condFR.express);
    return;
  }

  const bLabelJP = table.label;
  const bLabelEN = baseLabelEN[table.label] || table.label;
  const bLabelFR = baseLabelFR[table.label] || table.label;

  /* SDキャラ：通常・短縮・最短それぞれ動的表示 */
  if (table.sd) {
    function makeSdNote(rushKey) {
      const days = table[rushKey]?.[bgKey] ?? table.normal?.[bgKey];
      if (!days) return {
        jp: `${bLabelJP}（SD）の納期はご依頼内容によって変わりますので、お気軽にご相談ください。`,
        en: `${bLabelEN} (SD) delivery varies by order. Please consult.`,
        fr: `Le délai pour ${bLabelFR} (SD) varie selon la commande. N'hésitez pas à me consulter.`,
      };
      /* 時刻に左右される納期は、締切と条件を明記する。
         海外からのご依頼は時差でやり取りに1〜2日かかることがあるため */
      const timeCritical = ['当日', '翌日', '当日の晩', '翌日の午後', '翌日の晩'].includes(days);
      const phraseJP = {
        '当日':       '<strong>当日中</strong>に納品できる場合があります',
        '翌日':       '<strong>翌日中</strong>に納品できる場合があります',
        '当日の晩':   '<strong>当日の晩</strong>に納品できる場合があります',
        '翌日の午後': '<strong>翌日の午後</strong>に納品できる場合があります',
        '翌日の晩':   '<strong>翌日の晩</strong>に納品できる場合があります',
      };
      const phraseEN = {
        '当日':       '<strong>same-day</strong> delivery may be possible',
        '翌日':       '<strong>next-day</strong> delivery may be possible',
        '当日の晩':   'delivery <strong>the same evening</strong> may be possible',
        '翌日の午後': 'delivery <strong>the next afternoon</strong> may be possible',
        '翌日の晩':   'delivery <strong>the next evening</strong> may be possible',
      };
      const phraseFR = {
        '当日':       'la <strong>livraison le jour même</strong> peut être possible',
        '翌日':       'la <strong>livraison le lendemain</strong> peut être possible',
        '当日の晩':   'la livraison <strong>le soir même</strong> peut être possible',
        '翌日の午後': 'la livraison <strong>l\'après-midi du lendemain</strong> peut être possible',
        '翌日の晩':   'la livraison <strong>le soir du lendemain</strong> peut être possible',
      };
      const dayJP = phraseJP[days] || `<strong>${days}</strong>が目安です`;
      const dayEN = phraseEN[days] || `est. <strong>${dEN(days)}</strong>`;
      const dayFR = phraseFR[days] || `est. <strong>${dFR(days)}</strong>`;
      /* 基準は「購入」ではなく、支払いの完了と資料がそろうこと */
      const cutJP = timeCritical
        ? '<br>※ <strong>11時（JST）までにお支払いが完了し、制作に必要な資料がすべて揃った場合</strong>に限ります。'
        : '';
      const cutEN = timeCritical
        ? '<br>* Only when <strong>payment is completed and all materials are provided by 02:00 UTC</strong>.'
        : '';
      const cutFR = timeCritical
        ? '<br>* Uniquement lorsque <strong>le paiement est finalisé et tous les documents fournis avant 02h00 UTC</strong>.'
        : '';
      return {
        jp: `${bLabelJP}（SD）・${bgLabel}・${rlJP[rushKey]}で${dayJP}。${sufJP}${condJP[rushKey]}${cutJP}`,
        en: `${bLabelEN} (SD) · ${bgEN} · ${rlEN[rushKey]}: ${dayEN}. ${sufEN}${condEN[rushKey]}${cutEN}`,
        fr: `${bLabelFR} (SD) · ${bgFR} · ${rlFR[rushKey]} : ${dayFR}. ${sufFR}${condFR[rushKey]}${cutFR}`,
      };
    }
    const sn = makeSdNote('normal');
    const rn = makeSdNote('rush');
    const en_ = makeSdNote('express');
    setNote(standardEl,    sn.jp,  sn.en,  sn.fr);
    setNote(rushNoteEl,    rn.jp,  rn.en,  rn.fr);
    setNote(expressNoteEl, en_.jp, en_.en, en_.fr);
    return;
  }

  /* 等身キャラ：通常・短縮・最短それぞれ動的更新 */
  function makeNote(rushKey) {
    const days = table[rushKey]?.[bgKey];
    if (!days) return {
      jp: `${bLabelJP}・${bgLabel}の納期はお気軽にご相談ください。`,
      en: `Please consult for the delivery estimate.`,
      fr: `N'hésitez pas à me consulter pour le délai de livraison.`,
    };
    return {
      jp: `${bLabelJP}・${bgLabel}・${rlJP[rushKey]}で<strong>${days}</strong>が目安です。${sufJP}${condJP[rushKey]}`,
      en: `${bLabelEN} · ${bgEN} · ${rlEN[rushKey]}: <strong>${dEN(days)}</strong> est. ${sufEN}${condEN[rushKey]}`,
      fr: `${bLabelFR} · ${bgFR} · ${rlFR[rushKey]} : <strong>${dFR(days)}</strong> est. ${sufFR}${condFR[rushKey]}`,
    };
  }

  const sNote = makeNote('normal');
  const rNote = makeNote('rush');
  const eNote = makeNote('express');
  setNote(standardEl,    sNote.jp, sNote.en, sNote.fr);
  setNote(rushNoteEl,    rNote.jp, rNote.en, rNote.fr);
  setNote(expressNoteEl, eNote.jp, eNote.en, eNote.fr);
}

function showBaseTypeCards(type) {
  if (hintEl) hintEl.style.display = 'none';
  const normalGrid = document.getElementById('pose-normal');
  const sdGrid     = document.getElementById('pose-sd');

  if (type === 'normal') {
    sdGrid.style.display     = 'none';
    normalGrid.style.display = '';
    document.querySelectorAll('#pose-sd input[type="radio"]').forEach(r => r.checked = false);
  } else {
    normalGrid.style.display = 'none';
    sdGrid.style.display     = '';
    document.querySelectorAll('#pose-normal input[type="radio"]').forEach(r => r.checked = false);
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
          ? tl('等身キャラ', 'Standard', 'Standard')
          : tl('SDキャラ', 'Chibi / SD', 'Chibi / SD');
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
    const suf = tl(extraPriceEl.dataset.suf, extraPriceEl.dataset.sufEn, extraPriceEl.dataset.sufFr);
    extraPriceEl.textContent = extraPriceEl.dataset.pre + formatAmt(newExtraPrice) + (suf || '');
  }

  /* 高解像度データの料金切り替え（SDは¥2,000・等身は¥3,500） */
  const hrYen = isSD ? 2000 : 3500;
  [document.getElementById('i_highresPrice'), document.getElementById('i_printPrice')].forEach(el => {
    if (!el) return;
    el.dataset.yen = String(hrYen);
    const suf = tl(el.dataset.suf, el.dataset.sufEn, el.dataset.sufFr);
    el.textContent = (el.dataset.pre || '') + formatAmt(hrYen) + (suf || '');
  });

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
const PIECE_RADIOS = ['i_base', 'i_bg', 'i_design', 'i_live2d', 'i_goods_scope', 'd_base', 'v_plan', 'v_permit',
                     'i_rush', 'd_rush', 'v_rush'];
const PIECE_CHECKS = [
  'i_commercial', 'i_nosns', 'i_copyright', 'i_highres', 'i_print',
  'i_live2d_layer', 'i_goods_usage',
  'd_rawdata', 'd_print', 'd_commercial', 'd_nosns',
  'v_commercial', 'v_nosns'
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
        ? tl('等身キャラ', 'Standard', 'Standard')
        : tl('SDキャラ', 'Chibi / SD', 'Chibi / SD');
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
/* 内訳に出す項目名。data-item-label があればそれを優先し、英語表示なら訳す */
/* デザインの項目名は「種別（プラン名）」で出す。
   「スタンダード」だけだと、アイコンリングなのかトレカ風なのか分からないため。
   サブ種別があるものは「配信背景（横配信・スタンダード）」のように中に入れる */
function designItemName(el) {
  const plan = labelOf(el);
  const grid = el && el.closest('.sim-kind-grid');
  if (!grid || grid.id.indexOf('d-kind-') !== 0) return plan;
  const id = grid.id.slice('d-kind-'.length);
  const K = currentLang === 'fr' ? KIND_LABELS_FR : currentLang === 'en' ? KIND_LABELS_EN : KIND_LABELS;
  const S = currentLang === 'fr' ? SUB_LABELS_FR  : currentLang === 'en' ? SUB_LABELS_EN  : SUB_LABELS;
  let cat = K[id], sub = '';
  if (!cat) { sub = S[id] || ''; cat = K[id.split('-')[0]] || ''; }
  if (!cat || cat === plan) return plan;
  const notJa = currentLang !== 'jp';
  const inner = (sub === plan ? [plan] : [sub, plan]).filter(Boolean).join(notJa ? ' / ' : '・');
  return cat + (notJa ? ' (' + inner + ')' : '（' + inner + '）');
}
/* 内訳の項目名用の短い訳。辞書になければ日本語のまま返す */
function tr(jp) {
  const T = trLang();
  return (T && T[jp]) || jp;
}
function itemNameOf(el) {
  if (el && el.dataset.itemLabel) {
    const t = el.dataset.itemLabel;
    const T = trLang();
    return (T && T[t]) || t;
  }
  if (el && el.name === 'd_base') return designItemName(el);
  const nm = labelOf(el);
  const T = trLang();
  return (T && T[nm]) || nm;
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
      items.push({ name: tr('追加キャラクター') + ' ×' + c('i_extraPerson'), yen: c('i_extraPerson') * extraYen });
    }
    const designEl  = radioEl('i_design', st.radios.i_design);
    const designVal = designEl ? parseInt(designEl.value) : 0;
    if (designVal > 0) { addY(designVal); items.push({ name: tr('キャラクターデザイン'), yen: designVal }); }
    const bgEl  = radioEl('i_bg', st.radios.i_bg);
    const bgVal = bgEl ? parseInt(bgEl.value) : 0;
    if (bgVal > 0) { addY(bgVal); items.push({ name: labelOf(bgEl), yen: bgVal }); }

    if (c('i_expression') > 0)    { addY(c('i_expression') * 1500);    items.push({ name: tr('表情差分（等身）') + ' ×' + c('i_expression'), yen: c('i_expression') * 1500 }); }
    if (c('i_expression_sd') > 0) { addY(c('i_expression_sd') * 1000); items.push({ name: tr('表情差分（SD）') + ' ×' + c('i_expression_sd'), yen: c('i_expression_sd') * 1000 }); }
    /* 等身の衣装・髪型差分はベース料金に対する％。SDは固定額 */
    if (!isSD) {
      if (c('i_costume') > 0) {
        const y = c('i_costume') * Math.round(baseYen * 0.7), u = c('i_costume') * Math.round(baseUsd * 0.7);
        prodJPY += y; prodUSD += u;
        items.push({ name: tr('衣装差分（等身・70%）') + ' ×' + c('i_costume'), yen: y, usd: u });
      }
      if (c('i_hairstyle') > 0) {
        const y = c('i_hairstyle') * Math.round(baseYen * 0.5), u = c('i_hairstyle') * Math.round(baseUsd * 0.5);
        prodJPY += y; prodUSD += u;
        items.push({ name: tr('髪型差分（等身・50%）') + ' ×' + c('i_hairstyle'), yen: y, usd: u });
      }
    }
    if (c('i_costume_sd') > 0)   { addY(c('i_costume_sd') * 3500);   items.push({ name: tr('衣装差分（SD）') + ' ×' + c('i_costume_sd'), yen: c('i_costume_sd') * 3500 }); }
    if (c('i_hairstyle_sd') > 0) { addY(c('i_hairstyle_sd') * 3500); items.push({ name: tr('髪型差分（SD）') + ' ×' + c('i_hairstyle_sd'), yen: c('i_hairstyle_sd') * 3500 }); }

    document.querySelectorAll('.i_usage').forEach((el, i) => {
      if (st.usage[i]) items.push({ name: labelOf(el), yen: 0, type: 'free' });
    });
    if (st.checks.i_goods_usage) items.push({ name: tr('グッズ販売'), yen: 0, type: 'quote' });

    const hc = !!st.checks.i_highres, pc = !!st.checks.i_print;
    if (hc || pc) {
      const hrYen = isSD ? 2000 : 3500;
      addY(hrYen);
      items.push({ name: hc && pc ? tr('高解像度（動画＋印刷）') : hc ? tr('高解像度（動画素材）') : tr('高解像度（印刷用）'), yen: hrYen });
    }
    const live2dEl  = radioEl('i_live2d', st.radios.i_live2d);
    const live2dVal = live2dEl ? parseInt(live2dEl.value) : 0;
    if (live2dVal > 0) { addY(live2dVal); items.push({ name: labelOf(live2dEl), yen: live2dVal }); }
    if (st.checks.i_live2d_layer) { addY(30000); items.push({ name: tr('Live2Dパーツ分け'), yen: 30000 }); }

    /* 権利料 */
    if (st.checks.i_copyright) {
      /* 譲渡料は金額を出さず応相談。合計には加算しない */
      items.push({ name: tr('著作権譲渡'), yen: 0, type: 'quote' });
      if (st.checks.i_nosns) { addLic(5000, usdOf(5000)); items.push({ name: tr('SNS・サンプル掲載不可'), yen: 5000 }); }
    } else {
      if (st.checks.i_commercial) { addLic(5000, usdOf(5000)); items.push({ name: tr('商用利用ライセンス'), yen: 5000 }); }
      if (st.checks.i_nosns)      { addLic(5000, usdOf(5000)); items.push({ name: tr('SNS・サンプル掲載不可'), yen: 5000 }); }
      const scopeEl = radioEl('i_goods_scope', st.radios.i_goods_scope);
      if (st.checks.i_commercial && scopeEl) {
        const scope = scopeEl.value;
        st.goods.forEach((typed, i) => {
          const idx  = scope === 'goods' ? i - 1 : i;
          const rate = idx < 0 ? 0 : GOODS_RATES[Math.min(idx, GOODS_RATES.length - 1)];
          const label = (typed || '').trim() || tl('グッズ ' + (i + 1) + '種類目', 'Item ' + (i + 1), 'Article ' + (i + 1));
          if (rate === 0) {
            items.push({ name: (typed || '').trim() ? label + tr('（1種類目）') : label, yen: 0, type: 'goodsFree' });
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
    if (bEl && bEl.dataset.quote) {
      /* 金額が仕様で決まるものは内訳だけ出す。合計には加算しない */
      items.push({ name: itemNameOf(bEl), yen: 0, type: 'quote' });
    } else if (baseYen) {
      /* キャンペーン価格はすでに値引きした価格なので、割引対象には入れない */
      if (isCampaignActive(bEl)) { prodJPY += baseYen; prodUSD += baseUsd; }
      else addBase(baseYen, baseUsd);
      items.push({ name: itemNameOf(bEl) + (perUnit ? ' ×' + qty : '') + (isCampaignActive(bEl) ? tr('（キャンペーン価格）') : ''), yen: baseYen });
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
      const suffix = (planVal === '70000' && permitEl && permitEl.value === 'no')
        ? tl('（Live2D風での制作）', ' (Live2D-style production)', ' (production style Live2D)') : '';
      const tag = isCampaignActive(planEl) ? tl('（モニター価格）', ' (monitor price)', ' (prix moniteur)') : '';
      items.push({ name: labelOf(planEl) + suffix + tag, yen });
    }
    /* 権利料は倍率・割引の対象外 */
    ['v_commercial', 'v_nosns'].forEach(id => {
      if (!st.checks[id]) return;
      const el = document.getElementById(id);
      const yen = parseInt(el.value);
      addLic(yen, usdOf(yen));
      items.push({ name: labelOf(el), yen });
    });
  }


  return { prodJPY, prodUSD, discJPY, discUSD, licJPY, licUSD, items };
}


/* デザインやＭＶと一緒にご依頼いただいたときの、イラストの割引率。
   狙いは「絵は他の絵師さん、デザインはこちら」と分けられないようにすること。
   この割引だけはリピーター割引と重ねる（まとめて頼む人が一番得になるように） */
const BUNDLE_RATE = 0.1;

/* === 合計金額の計算（全点数の合算） === */
function calcTotal() {
  updateFilter();
  updateGoodsVisibility();
  updateCommercialIncluded();
  updateVideoMonitorNote();
  /* 表示中の点数の内容を取り込んでから合算する */
  if (!isApplyingPiece) pieces[currentPiece] = readPieceState();

  /* 納期は点数ごと。1点だけ急ぎ、ほかはゆっくり、という指定ができるようにするため */
  const rushOfPiece = st => {
    const n = st.service === 'illust' ? 'i_rush' : st.service === 'design' ? 'd_rush' : 'v_rush';
    const el = radioEl(n, st.radios[n]);
    return { el: el, rate: el ? parseFloat(el.value) : 1 };
  };
  /* 追加修正は注文全体で数えるので、一番急ぎの点数の倍率に合わせる */
  const maxRush = pieces.reduce((m, st) => Math.max(m, rushOfPiece(st).rate), 1);
  /* リピーター割引は「同じ方からの注文か」なので注文全体で1回 */
  const isRepeat = ['i_repeat', 'd_repeat', 'v_repeat'].some(id => {
    const el = document.getElementById(id);
    return el && el.checked;
  });

  /* 注文の中にイラストとデザイン（またはＭＶ）の両方があるか。
     あればイラスト側を割り引く。順番では変わらない */
  const hasIllust = pieces.some(st => st.service === 'illust' && st.radios.i_base !== null && st.radios.i_base !== undefined);
  const hasOther  = pieces.some(st => (st.service === 'design' && st.radios.d_base !== null && st.radios.d_base !== undefined
                                    && !(radioEl('d_base', st.radios.d_base) || {}).dataset?.quote)
                                   || (st.service === 'video'  && st.radios.v_plan !== null && st.radios.v_plan !== undefined));
  const isBundle  = hasIllust && hasOther;

  let totalJPY = 0, totalUSD = 0, licJPY = 0, licUSD = 0;
  const breakdown = [];

  pieces.forEach((st, i) => {
    const p = computePiece(st);
    const rush = rushOfPiece(st);
    const prodJ = Math.round(p.prodJPY * rush.rate);
    const prodU = Math.round(p.prodUSD * rush.rate);
    const discJ = Math.round(p.discJPY * rush.rate);
    const discU = Math.round(p.discUSD * rush.rate);
    /* まとめ割引：イラストと他サービスを一緒に頼んだときだけ、イラストを割り引く。
       この割引に限りリピーター割引と重ねる */
    const bundleHit = isBundle && st.service === 'illust';
    const bundleJ = bundleHit ? Math.round(discJ * BUNDLE_RATE) : 0;
    const bundleU = bundleHit ? Math.round(discU * BUNDLE_RATE) : 0;
    /* リピーター割引と複数点割引はどちらも10%引きなので、重ねずに一度だけ引く。
       まとめ割引が効く点数では、順番による複数点割引は使わない（順番で損得が変わらないように） */
    const applyCut = isRepeat || (i > 0 && !bundleHit);
    const cutJ = (applyCut ? Math.round(discJ * 0.1) : 0) + bundleJ;
    const cutU = (applyCut ? Math.round(discU * 0.1) : 0) + bundleU;
    totalJPY += prodJ - cutJ;
    totalUSD += prodU - cutU;
    licJPY += p.licJPY;
    licUSD += p.licUSD;
    breakdown.push({
      index: i, items: p.items,
      cutJ: applyCut ? Math.round(discJ * 0.1) : 0,
      cutU: applyCut ? Math.round(discU * 0.1) : 0,
      reason: !applyCut ? '' : (isRepeat ? 'repeat' : 'multi'),
      bundleJ, bundleU, rushRate: rush.rate, rushEl: rush.el });
  });

  /* 追加修正は注文全体で1回。制作の対価なので納期倍率はかかる */
  const rev = counts.i_revision || 0;
  if (rev > 0) {
    totalJPY += Math.round(rev * 1500 * maxRush);
    totalUSD += Math.round(rev * usdOf(1500) * maxRush);
  }
  /* 権利料は倍率・割引の対象外なので最後に定額で足す */
  totalJPY += licJPY;
  totalUSD += licUSD;

  const totalEl = document.getElementById('totalAmount');
  const totalStr = currentCurrency === 'USD' ? '$' + totalUSD.toLocaleString('en-US')
                  : currentCurrency === 'EUR' ? '€' + Math.round(totalUSD * EUR_RATE).toLocaleString('fr-FR')
                  : '¥' + totalJPY.toLocaleString('ja-JP');
  totalEl.innerHTML = totalStr + '<span>〜</span>';
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
  renderBreakdown(breakdown, rev, maxRush);
  updatePieceTabs();
}

/* === 内訳レシート === */
/* 納期の選択肢の名前を拾う（「短縮納期」など。補足のタグは含めない） */
function rushLabelOf(el) {
  const wrap = el && el.closest('.sim-option');
  const nm   = wrap && wrap.querySelector('.sim-option-name');
  return (nm && nm.firstChild && nm.firstChild.textContent.trim())
      || tl('納期', 'Rush', 'Délai');
}

function renderBreakdown(breakdown, rev) {
  const tagOf = t => '<span class="sim-total-selected-tag">' + t + '</span>';
  /* 下部バー：点数を切り替えても他の点数で選んだものが消えないよう、全点数ぶん出す。
     納期は点数ごとの項目なので、その点数のタグの並びに入れる */
  const tagsHtml = breakdown.map(b => {
    const rushTag = b.rushRate > 1 ? tagOf(rushLabelOf(b.rushEl) + ' ×' + b.rushRate) : '';
    if (!b.items.length && !rushTag) return '';
    const head = breakdown.length > 1
      ? '<span class="sim-total-piece-label' + (b.index === currentPiece ? ' is-current' : '') + '">' +
        tl((b.index + 1) + '点目', 'Piece ' + (b.index + 1), 'Élément ' + (b.index + 1)) + '</span>'
      : '';
    return head + b.items.map(l => tagOf(l.name)).join('') + rushTag;
  }).join('');
  /* 追加修正とリピーター割引は注文全体にかかるので、点数のタグのあとにまとめて出す */
  let extraTags = '';
  if (rev > 0) {
    extraTags += tagOf(tl('追加修正 ×', 'Extra revisions ×', 'Retouches sup. ×') + rev);
  }
  if (breakdown.some(b => b.reason === 'repeat')) {
    extraTags += tagOf(tl('リピーター割引', 'Repeat discount', 'Réduction fidélité'));
  }

  const selEl = document.getElementById('sim-selected-list');
  if (selEl) selEl.innerHTML = tagsHtml + extraTags;

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
              tl((b.index + 1) + '点目', 'Piece ' + (b.index + 1), 'Élément ' + (b.index + 1)) + '</div>';
    }
    b.items.forEach(l => {
      const type = l.type || 'item';
      if (type === 'free')          rows += row('receipt-item--free', l.name, tl('構図調整のみ', 'framing only', 'ajustement de composition seul'));
      else if (type === 'quote')    rows += row('receipt-item--free', l.name, tl('応相談', 'please inquire', 'sur devis'));
      else if (type === 'goodsFree')rows += row('receipt-item--free', l.name, tl('商用ライセンスに含む', 'included in license', 'inclus dans la licence'));
      else rows += row('', l.name, l.usd !== undefined ? formatPair(l.yen, l.usd) : formatAmt(l.yen));
    });
    if (b.bundleJ > 0) {
      rows += row('receipt-item--discount',
        tl('まとめ割引（イラスト）', 'Bundle discount (illustration)', 'Réduction groupée (illustration)'),
        '−' + formatPair(b.bundleJ, b.bundleU));
    }
    if (b.cutJ > 0) {
      const label = b.reason === 'multi'
        ? tl('複数点割引（ベース料金）', 'Multiple-piece discount', 'Réduction multi-pièces')
        : tl('リピーター割引（ベース料金）', 'Repeat discount', 'Réduction fidélité');
      rows += row('receipt-item--discount', label, '−' + formatPair(b.cutJ, b.cutU));
    }
    /* 納期はその点数だけにかかるので、点数のかたまりの中に出す */
    if (b.rushRate > 1) {
      rows += row('receipt-item--surcharge', rushLabelOf(b.rushEl), '×' + b.rushRate);
    }
  });

  if (rev > 0) rows += row('', tl('追加修正 ×', 'Extra revisions ×', 'Retouches sup. ×') + rev, formatAmt(rev * 1500));

  rows += '<hr class="receipt-divider" style="animation-delay:' + ((delay++) * 0.06) + 's">';
  const totalEl = document.getElementById('totalAmount');
  rows += '<div class="receipt-total" style="animation-delay:' + ((delay++) * 0.06) + 's">' +
          '<span class="receipt-total-label">' + tl('目安合計', 'Estimated total', 'Total estimé') + '</span>' +
          '<span class="receipt-total-price">' + (totalEl ? totalEl.innerHTML : '') + '</span></div>';
  breakdownList.innerHTML = rows;
}

/* === 納期・リピーター割引の同期 === */
/* 納期とリピーター割引は注文全体で1回のものだが、
   お客様がどのタブにいても操作できるよう、3タブそれぞれにカードを置いている。
   どれを操作しても他の2つに反映させ、内部的には常に1つの値として扱う */
const RUSH_GROUPS   = ['i_rush', 'd_rush', 'v_rush'];
const REPEAT_BOXES  = ['i_repeat', 'd_repeat', 'v_repeat'];

function syncRush(value) {
  RUSH_GROUPS.forEach(name => {
    document.querySelectorAll('input[name="' + name + '"]').forEach(el => {
      el.checked = (el.value === value);
    });
  });
}

function syncRepeat(checked) {
  REPEAT_BOXES.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = checked;
  });
}

function initOrderWideSync() {
  RUSH_GROUPS.forEach(name => {
    document.querySelectorAll('input[name="' + name + '"]').forEach(el => {
      el.addEventListener('change', () => {
        if (!el.checked) return;
        /* 同期してから計算し直す（先に走った計算は同期前の値を見ているため） */
        syncRush(el.value);
        calcTotal();
        updateDeliveryNote();
      });
    });
  });
  REPEAT_BOXES.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => { syncRepeat(el.checked); calcTotal(); });
  });
  /* 初期状態では何も選択しない。自動でチェックを入れると
     「常に成立している条件」になり、うさぎがその話ばかりするため */
}


/* === 点数タブの操作 === */
const PIECE_MAX = 5;

function pieceLabel(i) {
  return tl((i + 1) + '点目', 'Piece ' + (i + 1), 'Élément ' + (i + 1));
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
  ring: 'アイコンリング', cheki: 'デジタルチェキ', trading: 'トレカ風カード', calendar: 'カレンダー', merch: 'グッズデザイン', commentcss: 'コメント欄カスタムCSS', clock: '配信時計', profilesite: 'プロフィールサイト'
};
const KIND_LABELS_EN = {
  namelogo: 'Name Logo', schedule: 'Stream Schedule', overlay: 'Stream Overlay',
  bg: 'Stream Background', header: 'Header', profile: 'Profile Card',
  thumb: 'Stream Thumbnail', wallpaper: 'Live Wallpaper', stamp: 'Stamps & Badges',
  ring: 'Icon Ring', cheki: 'Digital Cheki', trading: 'Trading Card', calendar: 'Calendar', merch: 'Merch Design', commentcss: 'Chat CSS', clock: 'Stream Clock', profilesite: 'Profile Site'
};
const KIND_LABELS_FR = {
  namelogo: 'Logo de Nom', schedule: 'Planning de Diffusion', overlay: 'Overlay de Stream',
  bg: 'Fond de Stream', header: 'Bannière', profile: 'Carte de Profil',
  thumb: 'Miniature', wallpaper: 'Fond d\'écran Animé', stamp: 'Stickers & Badges',
  ring: 'Anneau d\'Icône', cheki: 'Photo Instantanée Numérique', trading: 'Carte Style Trading Card', calendar: 'Calendrier', merch: 'Design de Produits Dérivés', commentcss: 'CSS de Chat', clock: 'Horloge de Stream', profilesite: 'Site de Profil'
};
const SUB_LABELS = { 'header-gift': 'バッジ等の返礼品', 'header-marriage': 'よめこな王返礼品', 'bg-h': '横配信', 'bg-v': '縦配信', 'stamp-chara': 'キャラ', 'stamp-text': '文字のみ', 'stamp-item': '小物・食べ物' };
const SUB_LABELS_EN = { 'header-gift': 'Badge rewards', 'header-marriage': 'Marriage form gift', 'bg-h': 'Landscape', 'bg-v': 'Portrait', 'stamp-chara': 'Character', 'stamp-text': 'Text only', 'stamp-item': 'Items & Food' };
const SUB_LABELS_FR = { 'header-gift': 'Cadeaux de remerciement (badges)', 'header-marriage': 'Cadeau pour meilleur(e) soutien(e)', 'bg-h': 'Paysage', 'bg-v': 'Portrait', 'stamp-chara': 'Personnage', 'stamp-text': 'Texte seul', 'stamp-item': 'Objets & Nourriture' };
let currentKind = '';
let currentSub  = '';

function kindLabel(kind) {
  return (currentLang === 'fr' ? KIND_LABELS_FR : currentLang === 'en' ? KIND_LABELS_EN : KIND_LABELS)[kind] || '';
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
  /* 選択肢が1つしかない場合は選ばせない（そこまで選んだ時点で決まっているため）。
     ただし準備中の案内カードが隣に並ぶときは、見た目が2択なので自動では選ばない */
  if (gridEl && !keepSelection) {
    const only  = gridEl.querySelectorAll('input[name="d_base"]');
    const cards = gridEl.querySelectorAll('.sim-pose-card');
    if (only.length === 1 && cards.length <= 1) only[0].checked = true;
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
    /* 見出しは種別を押すたびに作り直されるので、ここで言語を見る。
       data-jp を持たせておけば、日本語に戻すときの復元にも乗る */
    const jp = el.dataset.heading;
    h.dataset.jp = jp;
    const T = trLang();
    h.textContent = (T && T[jp]) || jp;
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
      updateMascotMessage(btn);
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
  const cnote = document.getElementById('d-calendar-note');
  if (cnote) cnote.style.display = (currentKind === 'calendar') ? '' : 'none';
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
  const sel = document.querySelector('input[name="v_plan"]:checked');
  const isMonitor = !!(sel && sel.dataset.monitor && isCampaignActive(sel));
  const note = document.getElementById('v-monitor-note');
  if (note) note.style.display = isMonitor ? '' : 'none';
  /* サンプル掲載が条件なので、掲載不可とは併用できない */
  const nosns = document.getElementById('v_nosns');
  if (!nosns) return;
  const label = nosns.closest('label');
  if (isMonitor) {
    nosns.checked = false;
    nosns.disabled = true;
    if (label) label.classList.add('is-disabled');
  } else {
    nosns.disabled = false;
    if (label) label.classList.remove('is-disabled');
  }
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

/* ¥3,000以下のサービスはモニター価格の対象外。
   ココナラ経由だとさらに22%引かれるため、割引すると手取りが残らない */
const MONITOR_MIN = 3000;
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
  /* 期限のない常時割引（data-discount-rate）は、いつでも有効 */
  if (el && el.dataset.discountRate) return true;
  if (!el || !el.dataset.campaignPrice || !el.dataset.campaignUntil) return false;
  const until = new Date(el.dataset.campaignUntil + 'T23:59:59');
  return new Date() <= until;
}

/* 実際にご請求する金額。キャンペーン中なら特価を返す */
function effectivePrice(el) {
  if (!el) return 0;
  if (el.dataset.discountRate) {
    return Math.round(parseInt(el.value) * parseFloat(el.dataset.discountRate));
  }
  if (isCampaignActive(el)) return parseInt(el.dataset.campaignPrice);
  return parseInt(el.value);
}

/* バッジの文言。選択肢ごとに指定でき、言語で切り替わる */
function badgeLabelOf(el) {
  if (currentLang === 'fr') return el.dataset.badgeLabelFr || el.dataset.badgeLabel || 'PROMO';
  if (currentLang === 'en') return el.dataset.badgeLabelEn || el.dataset.badgeLabel || 'SALE';
  return el.dataset.badgeLabel || 'キャンペーン価格';
}

/* キャンペーン中なら表示を特価に差し替えてラベルと赤字を出す */
function applyCampaigns() {
  document.querySelectorAll('input[data-campaign-price], input[data-discount-rate]').forEach(el => {
    const label   = el.closest('.sim-option, .sim-pose-card');
    const priceEl = label && label.querySelector('.sim-option-price');
    if (!label || !priceEl) return;
    const regular = parseInt(el.value);

    if (isCampaignActive(el)) {
      label.classList.add('is-campaign');
      priceEl.classList.add('sim-price-campaign');
      priceEl.innerHTML =
        '<span class="sim-price-regular">' + formatAmt(regular) + '</span> ' +
        formatAmt(effectivePrice(el)) + '〜';
      if (!label.querySelector('.sim-campaign-badge')) {
        const badge = document.createElement('span');
        badge.className = 'sim-campaign-badge';
        badge.textContent = badgeLabelOf(el);
        label.insertBefore(badge, label.firstChild);
      } else {
        label.querySelector('.sim-campaign-badge').textContent =
          badgeLabelOf(el);
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

/* 3言語対応のための汎用ヘルパー。
   tl(ja, en, fr) はインラインの三項演算子の置き換え用。
   trLang() は日本語のときは null を返す（TRANS_EN/TRANS_FRの動的ルックアップ用）。 */
function tl(ja, en, fr) {
  if (currentLang === 'fr') return fr;
  if (currentLang === 'en') return en;
  return ja;
}
function trLang() {
  if (currentLang === 'fr') return TRANS_FR;
  if (currentLang === 'en') return TRANS_EN;
  return null;
}

/* Fiverrの相場に合わせたUSD金額テーブル（¥÷150の自動換算ではない） */
const USD_AMOUNT = {
  /* 胸上10,000/太ももまで15,000/全身18,000はFiverr「③一枚絵」ギグの
     2026-09-28改定額（背景込み・表情差分なしの完成イラスト、2倍で確定）。
     腰上13,000はFiverr側に対応する段階がないため、胸上と太ももまでの
     円建て比率で補間した（$165）。
     1.5頭身6,000〜3頭身9,000（SD）はFiverr「②ちびキャラ」ギグの実績価格。
     すでに1.5倍のプレミアムが乗っているため、今回の2倍改定では変更していない。
     1.5頭身と2頭身は実績どおり同額。他の金額は従来の実質レートのまま */
  0:0, 1000:7, 1500:10, 2000:14, 3000:20, 3500:25,
  5000:35, 6000:85, 6500:45, 7000:85, 8000:95, 9000:110, 10000:125,
  13000:165, 15000:190, 18000:230, 20000:140, 30000:200, 35000:240
};

/* 円→ドル換算（テーブルにない金額は¥150/＄で丸める） */
function usdOf(yen) {
  return USD_AMOUNT[yen] !== undefined ? USD_AMOUNT[yen] : Math.round(yen / 150);
}
/* ドル→ユーロの目安レート。ユーロは専用の実績テーブルを持たず、
   USD_AMOUNT（Fiverr実績）をそのまま換算する簡易方式 */
const EUR_RATE = 0.92;
function eurOf(yen) {
  return Math.round(usdOf(yen) * EUR_RATE);
}

function formatAmt(yen) {
  if (currentCurrency === 'USD') return '$' + usdOf(yen).toLocaleString('en-US');
  if (currentCurrency === 'EUR') return '€' + eurOf(yen).toLocaleString('fr-FR');
  return '¥' + yen.toLocaleString('ja-JP');
}

/* ％計算で出た金額用：ドル額を換算せず渡された値で表示する。
   ベース料金のUSDに％を掛けた額と、合計への加算額をズレさせないため。
   ユーロはこの渡されたドル額からその場で換算する（ドル用の変数を使い回すため） */
function formatPair(yen, usd) {
  if (currentCurrency === 'USD') return '$' + usd.toLocaleString('en-US');
  if (currentCurrency === 'EUR') return '€' + Math.round(usd * EUR_RATE).toLocaleString('fr-FR');
  return '¥' + yen.toLocaleString('ja-JP');
}

const SUFFIX_EN = {
  ' / 人': ' / person', ' / 個': ' / each', ' / セット': ' / set',
  ' / 種': ' / style',  ' / 回': ' / revision', ' / 点': ' / piece', '〜 / 点': ' / piece',
};
const SUFFIX_FR = {
  ' / 人': ' / personne', ' / 個': ' / chaque', ' / セット': ' / lot',
  ' / 種': ' / type',  ' / 回': ' / retouche', ' / 点': ' / pièce', '〜 / 点': ' / pièce',
};

function initPriceEls() {
  document.querySelectorAll('.sim-option-price, .sim-counter-price').forEach(el => {
    const m = el.textContent.match(/(＋|\+)?¥([\d,]+)(.*)/);
    if (m) {
      el.dataset.yen   = parseInt(m[2].replace(/,/g, ''));
      el.dataset.pre   = m[1] || '';
      el.dataset.suf   = m[3] || '';
      el.dataset.sufEn = SUFFIX_EN[m[3]] !== undefined ? SUFFIX_EN[m[3]] : (m[3] || '');
      el.dataset.sufFr = SUFFIX_FR[m[3]] !== undefined ? SUFFIX_FR[m[3]] : (m[3] || '');
    }
  });
}

function updatePriceEls() {
  document.querySelectorAll('[data-yen]').forEach(el => {
    const suf = tl(el.dataset.suf, el.dataset.sufEn, el.dataset.sufFr);
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
  'バッジ等の返礼品': 'Badge rewards',
  'よめこな王返礼品': 'Marriage form gift',
  'スタンダード（量産型婚姻届）': 'Standard (template)',
  'プレミアム（一点物婚姻届）': 'Premium (one-off)',
  'テンプレートをお渡しします。ご自分で素材と文字を重ねてお使いください。': 'You receive the template and layer your own artwork and text onto it.',
  'グッズデザイン': 'Merch design',
  'アクリルスタンド・缶バッジ・クリアファイルなど、実物のグッズ用の入稿データをお作りします。印刷所の仕様やグッズの点数によって金額が変わりますので、内容をうかがってからお見積もりいたします。': 'I prepare the print-ready data for physical goods such as acrylic stands, badges and clear files. The price changes with what the printer requires and how many items there are, so I quote it after hearing the details.',
  '婚姻届（受注制作）': 'Marriage form (made to order)',
  'デジタルチェキ（受注制作）': 'Digital cheki (made to order)',
  '表情差分（等身）': 'Expression variation (full-body)',
  '表情差分（SD）': 'Expression variation (chibi)',
  '衣装差分（等身・70%）': 'Outfit variation (full-body, 70%)',
  '髪型差分（等身・50%）': 'Hairstyle variation (full-body, 50%)',
  '衣装差分（SD）': 'Outfit variation (chibi)',
  '髪型差分（SD）': 'Hairstyle variation (chibi)',
  '高解像度（動画＋印刷）': 'High resolution (video + print)',
  '高解像度（動画素材）': 'High resolution (video)',
  '高解像度（印刷用）': 'High resolution (print)',
  'Live2Dパーツ分け': 'Live2D part separation',
  '（1種類目）': ' (first type)',
  '（キャンペーン価格）': ' (campaign price)',
  'イラスト': 'Illustration',
  'デザイン': 'Design',
  'ＭＶ制作': 'MV Production',
  '配信まわり': 'For streaming',
  '返礼品など': 'Gifts & rewards',
  '✧ 応相談': '✧ Please inquire',
  '量産型': 'Template version',
  '受注制作': 'Made to order',
  '準備中': 'Coming soon',
  'テンプレートをお渡しします。ご自分で素材と文字を重ねてお使いください。BOOTHにて配布を準備中です。': 'I hand over the template and you layer your own artwork and text onto it. Free distribution on BOOTH is in preparation.',
  'テンプレートをお渡しします。ご自分で立ち絵と文字を重ねてお使いください。BOOTHにて配布を準備中です。': 'I hand over the template and you layer your own character artwork and text onto it. Free distribution on BOOTH is in preparation.',
  'モチーフを数点描き下ろし、装飾を重ねた仕上げにいたします。お持ちの立ち絵を組み込み、日付やサインもご相談に応じてお入れします。チェキ用の一枚絵もあわせてご依頼の場合は、まとめ割引の対象です。': 'I draw a few motifs from scratch and build up the decoration around them. Your character artwork is placed in, and a date or a signature can be added on request. If you order the artwork for the photo together with it, the bundle discount applies.',
  '鉛筆の落書き付きの一点物です。ウェディングドレス姿の横顔など、ご希望に合わせてお描きします。': 'A one-off piece with a pencil sketch — a profile in a wedding dress, or whatever you have in mind.',
  /* 追加した英訳（2026-08-22） */
  switch_title: 'Switch service?',
  switch_body: 'What you have selected will be cleared.<br>If you would like to order more than one thing — an illustration and a design, for example — <strong>use the ＋ above to add a second piece</strong>.',
  switch_ok: 'Switch',
  switch_cancel: 'Go back',
  design_hint: 'Choose what you would like to make.<br>For design work, <strong>all character artwork is provided by you</strong>. If you would like it drawn from scratch, please order from the Illustration tab.',
  quote_title: 'Check your request',
  quote_body: 'Copy this and send it to me as it is.<br>The amount is a guide. We fix it after talking, so tell me anything you are unsure about.',
  quote_copy: 'Copy and pick where to send',
  quote_cancel: 'Go back and edit',
  design_footnote: '* You are free to distribute the finished design to your fans.<br>However, <strong>please ask separately if you plan to sell it as merchandise.</strong>',
  monitor_note: '<strong>This is a sample-posting monitor price (30% off).</strong><br>The condition is that I may post the finished work on my SNS and portfolio, so it cannot be combined with "No SNS / Portfolio Posting".<br>Regular pricing applies if you prefer no posting. <strong>Limited to a few slots.</strong>',
  monitor_note_mv: '<strong>This is a sample-posting monitor price.</strong><br>The condition is that I may post the finished work on my SNS and portfolio, so it cannot be combined with "No SNS / Portfolio Posting".<br>I post only a digest of about 30 seconds and link to your channel for the full version.',
  wallpaper_note: 'The price lands between <strong>¥4,000 and ¥7,000</strong> depending on how detailed the design is.<br>Please keep your materials to about 7 images (more than 8 tends to look cluttered — do ask).<br>New illustrations and Live2D animation are available on request.',
  marriage_note: '<strong>Template version</strong>: I hand over the template and you layer your own artwork and text onto it.<br>I am preparing to distribute it for free on BOOTH.<br>I design it so that it would not be accepted as an official document, but<br>it is a keepsake design and cannot be used for an actual filing.<br><br><strong>Made-to-order version</strong>: a one-of-a-kind piece with a pencil sketch.<br>Please send the artwork of the person receiving it.<br>I do not cut out or alter the artwork.<br>If your partner is the same gender, let me know which side should be the bride.<br>It is a keepsake design and cannot be used for an actual filing.',
  stamp_note: 'Stamps and badges for YouTube memberships. They work on Discord as well.',
  v_premium_note: 'Will be produced with Live2D-style motion instead',
  qty_unit: 'price per piece',
  soon_commentcss: 'Custom CSS that restyles your chat overlay (for OneComme and similar) to match your character.<br>It covers eight message types including regular chat, memberships, Super Chat and Super Stickers.<br><br>Build fee from ¥10,000 / new illustrations from ¥2,000 each / colour variations from ¥3,000 (five colours).<br><br><strong>Currently in preparation.</strong> Please feel free to get in touch if you are interested.',
  soon_clock: 'A clock or elapsed-time display for your stream, designed to match your character.<br><br><strong>Currently in preparation.</strong> Please feel free to get in touch if you are interested.',
  soon_profilesite: 'A one-page website that gathers your links and profile.<br>It reads well on phones, so you can put it in your SNS profile.<br>I also take commissions from illustrators. <strong>A portfolio site like the one you are looking at now</strong> is available too.<br><br><strong>Currently in preparation.</strong> Pricing is not fixed yet, so please feel free to get in touch.',
  '追加キャラクター': 'Extra character',
  '点数': 'Quantity',
  'かわいらしさを保ちつつ衣装・髪型の細部まで描き込めるバランス。ぐるにゃが一番よく描くのもこれ！': 'Cute proportions that still allow detailed outfits and hair. This is the one I draw most often!',
  /* ＭＶ制作プランの中身 */
  '・楽曲に合わせたカット割り・歌詞のテキストアニメーション中心・基本的なトランジション／モーショングラフィックス・シンプルな構成': '・Cuts timed to the track<br>・Mainly lyric text animation<br>・Basic transitions and motion graphics<br>・A simple structure',
  '・曲の展開を意識したカット割り・歌詞アニメーションの作り込み・エフェクト、装飾によるデザイン演出・カメラワークによる奥行きの表現': '・Cuts that follow how the song develops<br>・Carefully built lyric animation<br>・Effects and decoration for visual direction<br>・Depth created with camera work',
  '・構成から組み立てるカット割り・Live2Dでリギングした人物アニメーション・リリックモーションの作り込み・デザイン演出全体の作り込み': '・Cuts built from the ground up<br>・<strong>Character animation rigged in Live2D</strong><br>・Carefully built lyric motion<br>・Full visual direction throughout',
  /* ＭＶのオプション・納期・リピーター */
  '収益化チャンネルでの公開、広告・宣伝への使用など、金銭的利益を伴う利用に必要です。個人のSNS投稿・非営利目的には不要です。著作権はぐるにゃに帰属し、このライセンスに譲渡は含まれません。': 'Required for any use involving financial gain, such as publishing on a monetized channel or using it in advertising.<br>Not required for personal SNS posts or non-commercial use.<br>Copyright remains with ぐるにゃ and is not transferred by this license.',
  '通常のサンプル掲載は30秒程度のダイジェストのみで、完全版はお客様のチャンネルへリンクでご案内します。本編の再生はお客様側に集まりますので、宣伝としてもお使いいただけます。それでも掲載を希望されない場合にこちらをお選びください。': 'Normally I post only a digest of about 30 seconds and link to your channel for the full version.<br>Views of the full video go to you, so it doubles as promotion.<br>Choose this option if you would still prefer no posting at all.',
  'どのプランも1ヶ月前後が目安です。混雑状況とお返事の速度によって変わります。': 'All plans take around one month.<br>This varies with workload and how quickly we can exchange messages.',
  '2週間前後での納品を目指します。ご確認のお返事を当日〜翌日中にいただける場合に限ります。': 'Aiming for delivery in about two weeks.<br>Only possible if you can reply to checks within a day.',
  '1週間前後での納品を目指します。スケジュールによってはお受けできないことがありますので、事前にご相談ください。': 'Aiming for delivery in about one week.<br>Depending on my schedule I may not be able to take it on, so please ask in advance.',
  'いつもありがとうございます。2回目以降のご依頼は、制作プランの料金を10%引きにさせていただきます。オプションや権利のお料金、モニター価格は割引の対象外とさせてください。': 'Thank you for coming back.<br>From your second commission onward, the production plan is 10% off.<br>Options, rights fees and monitor prices are outside the discount.',
  'デジタルチェキ': 'Digital Cheki',
  'トレカ風カード': 'Trading Card',
  'カレンダー': 'Calendar',
  '年間1枚': 'One sheet for the year',
  '月めくり12枚': '12 monthly sheets',
  calendar_note: 'I provide the print-ready data.<br>You can print it yourself, or share it through a convenience-store print service.',
  'お持ちの立ち絵をチェキ風のフレームに収めます。日付やサインを入れることもできます。シンプルな構成です。': 'Your character artwork placed in an instant-photo style frame. A date or signature can be added. Simple layout.',
  '装飾や書き文字を多く入れた、作り込みのある構成です。ブロマイド風の仕上げにも対応します。': 'A richly decorated layout with hand-lettered text. A bromide-style finish is also possible.',
  'トレーディングカード風のカードをお作りします。お名前や肩書きのレイアウトも設計します。シンプルな構成です。': 'A trading-card style card. I design the layout for names and titles too. Simple layout.',
  '枠・背景・箔押し風の演出まで作り込みます。免許証風・学生証風などの体裁にも対応します。': 'Frames, backgrounds and foil-stamp style effects, built in detail. Licence-card and student-ID styles are also possible.',
  '12か月分を1枚にまとめたカレンダーです。日付のレイアウトもこちらで設計します。': 'A calendar with all twelve months on a single sheet. I design the date layout as well.',
  '1か月ごとに1枚、12枚をお作りします。月ごとに構成を変えられます。': 'Twelve sheets, one per month. The layout can change from month to month.',
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
  '商用利用可能なフリー素材と自作のパーツを組み合わせ、賑やかに飾り付けてお作りします。曜日・時間帯のレイアウトはご希望に合わせて調整いたします。': 'Made by combining royalty-free materials licensed for commercial use with original parts, decorated for a lively look. The layout of days and times is adjusted to your wishes.',
  '世界観に合わせた背景を手描きで描き下ろします（人物は含みません）。': 'A hand-drawn background matching the world of your character (characters not included).',
  '待機画面・枠などをシンプルな構成でお作りします。': 'Waiting screens, frames and so on in a simple layout.',
  '世界観に合わせて描き込んだ、作り込みのある構成です。': 'Richly drawn to match the world of your character.',
  'パソコン・横画面での配信向け。描き込みは控えめです。': 'For landscape streaming on PC. Lightly detailed.',
  'パソコン・横画面での配信向け。描き込みをたっぷり入れます。': 'For landscape streaming on PC. Richly detailed.',
  'スマートフォンの縦画面での配信向け。描き込みは控えめです。': 'For portrait streaming on smartphones. Lightly detailed.',
  'スマートフォンの縦画面での配信向け。描き込みをたっぷり入れます。': 'For portrait streaming on smartphones. Richly detailed.',
  'リスナーさんへの返礼品としてお渡しいただけるヘッダーです。X用とIRIAM用、両方のサイズでお渡しします。シンプルな構成でお作りします。': 'A header you can give to your listeners as a thank-you gift. Delivered in both X and IRIAM sizes, in a simple layout.',
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
  video_hint: 'Prices vary with the length of the track.<br>The listed price assumes you provide the illustration.',
  video_other: '* I also take on other video work such as openings, endings and short-form videos — feel free to ask.',
  video_terms: "・ Illustrations are <strong>provided by you</strong> (I can draw them separately if you wish)<br>・ Live2D rigging applies to the <strong>Premium plan only</strong><br>・ In that case I would be grateful if you could provide <strong>a single key illustration separated into layers</strong><br>・ If it is not layered I can separate the parts myself, but that requires the artist's permission<br>・ For an A-pose to B-pose switch, I would recommend commissioning <strong>two character illustrations</strong><br>　 It tends to make the MV livelier",
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
  'A3サイズ・350dpi対応の印刷用データでお渡しします。コンビニでのネットプリントにもそのままお使いいただけます。これはデータの仕様に対する料金です。グッズ・物販として販売される場合は、別途「07 オプション」の商用利用ライセンスと「08 グッズ・物販の二次利用」の二次利用料が必要になります。':
    'Delivered as print-ready data at A3 size / 350dpi, ready for convenience-store printing too. <strong>This fee covers the data specification only.</strong> If you sell the artwork as merchandise, the commercial use license under “07 Option” and the secondary use fee under “08 Merchandise & Secondary Use” are required separately.',
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

const TRANS_FR = {
  title: 'Simulateur de tarifs',
  'お見積もり合計（目安）': 'Total estimé (environ)',
  /* グッズ二次利用・著作権譲渡 */
  'グッズ・物販の二次利用': 'Usage secondaire (produits dérivés)',
  'プラン': 'Formule',
  '使用用途': 'Usage',
  '配信スタイル': 'Style de diffusion',
  'モチーフ': 'Motif',
  'バッジ等の返礼品': 'Cadeaux de remerciement (badges, etc.)',
  'よめこな王返礼品': 'Cadeau pour le/la meilleur(e) soutien(e)',
  'スタンダード（量産型婚姻届）': 'Standard (modèle à reproduire)',
  'プレミアム（一点物婚姻届）': 'Premium (pièce unique)',
  'テンプレートをお渡しします。ご自分で素材と文字を重ねてお使いください。': 'Vous recevez le modèle et y superposez vous-même votre illustration et votre texte.',
  'グッズデザイン': 'Design de produits dérivés',
  'アクリルスタンド・缶バッジ・クリアファイルなど、実物のグッズ用の入稿データをお作りします。印刷所の仕様やグッズの点数によって金額が変わりますので、内容をうかがってからお見積もりいたします。': 'Je prépare les données prêtes à imprimer pour des produits physiques comme les stands acryliques, badges et pochettes transparentes. Le prix dépend des exigences de l\'imprimeur et du nombre d\'articles, un devis vous sera donc proposé après discussion.',
  '婚姻届（受注制作）': 'Acte de mariage (sur commande)',
  'デジタルチェキ（受注制作）': 'Photo instantanée numérique (sur commande)',
  '表情差分（等身）': 'Variante d\'expression (proportions normales)',
  '表情差分（SD）': 'Variante d\'expression (chibi)',
  '衣装差分（等身・70%）': 'Variante de tenue (normale, 70 %)',
  '髪型差分（等身・50%）': 'Variante de coiffure (normale, 50 %)',
  '衣装差分（SD）': 'Variante de tenue (chibi)',
  '髪型差分（SD）': 'Variante de coiffure (chibi)',
  '高解像度（動画＋印刷）': 'Haute résolution (vidéo + impression)',
  '高解像度（動画素材）': 'Haute résolution (vidéo)',
  '高解像度（印刷用）': 'Haute résolution (impression)',
  'Live2Dパーツ分け': 'Séparation des calques Live2D',
  '（1種類目）': ' (1er type)',
  '（キャンペーン価格）': ' (prix promotionnel)',
  'イラスト': 'Illustration',
  'デザイン': 'Design',
  'ＭＶ制作': 'Production de MV',
  '配信まわり': 'Pour le streaming',
  '返礼品など': 'Cadeaux & remerciements',
  '✧ 応相談': '✧ Sur devis',
  '量産型': 'Version modèle',
  '受注制作': 'Sur commande',
  '準備中': 'Bientôt disponible',
  'テンプレートをお渡しします。ご自分で素材と文字を重ねてお使いください。BOOTHにて配布を準備中です。': 'Vous recevez le modèle et y superposez vous-même votre illustration et votre texte. Distribution gratuite sur BOOTH en préparation.',
  'テンプレートをお渡しします。ご自分で立ち絵と文字を重ねてお使いください。BOOTHにて配布を準備中です。': 'Vous recevez le modèle et y superposez vous-même votre personnage et votre texte. Distribution gratuite sur BOOTH en préparation.',
  'モチーフを数点描き下ろし、装飾を重ねた仕上げにいたします。お持ちの立ち絵を組み込み、日付やサインもご相談に応じてお入れします。チェキ用の一枚絵もあわせてご依頼の場合は、まとめ割引の対象です。': 'Je dessine quelques motifs originaux et ajoute des décorations autour. Votre illustration de personnage est intégrée, avec une date ou une signature sur demande. Si vous commandez aussi l\'illustration pour la photo, la réduction groupée s\'applique.',
  '鉛筆の落書き付きの一点物です。ウェディングドレス姿の横顔など、ご希望に合わせてお描きします。': 'Une pièce unique avec un croquis au crayon — un profil en robe de mariée, ou tout ce que vous avez en tête.',
  /* 追加した英訳（2026-08-22） */
  switch_title: 'Changer de service ?',
  switch_body: 'Ce que vous avez sélectionné sera effacé.<br>Si vous souhaitez commander plusieurs éléments — une illustration et un design, par exemple — <strong>utilisez le ＋ ci-dessus pour ajouter un deuxième élément</strong>.',
  switch_ok: 'Changer',
  switch_cancel: 'Retour',
  design_hint: 'Choisissez ce que vous souhaitez créer.<br>Pour les travaux de design, <strong>toute illustration de personnage est fournie par vous</strong>. Si vous souhaitez un dessin original, veuillez commander depuis l\'onglet Illustration.',
  quote_title: 'Vérifiez votre demande',
  quote_body: 'Copiez ceci et envoyez-le-moi tel quel.<br>Le montant est indicatif. Nous le fixons après discussion, alors n\'hésitez pas à me signaler tout ce qui n\'est pas clair.',
  quote_copy: 'Copier et choisir où envoyer',
  quote_cancel: 'Retour pour modifier',
  design_footnote: '* Vous êtes libre de distribuer le design terminé à vos fans.<br>Cependant, <strong>veuillez me consulter séparément si vous prévoyez de le vendre comme produit dérivé.</strong>',
  monitor_note: '<strong>Il s\'agit d\'un prix moniteur avec publication d\'échantillon (30 % de réduction).</strong><br>La condition est que je puisse publier l\'œuvre terminée sur mon SNS et mon portfolio ; cette option ne peut donc pas être combinée avec « Pas de publication SNS / Portfolio ».<br>Le tarif normal s\'applique si vous préférez ne pas être publié. <strong>Places limitées.</strong>',
  monitor_note_mv: '<strong>Il s\'agit d\'un prix moniteur avec publication d\'échantillon.</strong><br>La condition est que je puisse publier l\'œuvre terminée sur mon SNS et mon portfolio ; cette option ne peut donc pas être combinée avec « Pas de publication SNS / Portfolio ».<br>Je ne publie qu\'un extrait d\'environ 30 secondes et renvoie vers votre chaîne pour la version complète.',
  wallpaper_note: 'Le prix se situe entre <strong>4 000 ¥ et 7 000 ¥</strong> selon le niveau de détail du design.<br>Merci de limiter vos éléments à environ 7 images (au-delà de 8, la composition a tendance à devenir chargée — n\'hésitez pas à me consulter).<br>Nouvelles illustrations et animation Live2D disponibles sur demande.',
  marriage_note: '<strong>Version modèle</strong> : je vous transmets le modèle et vous y superposez vous-même votre illustration et votre texte.<br>Je prépare une distribution gratuite sur BOOTH.<br>Je le conçois pour qu\'il ne soit pas accepté comme document officiel, mais<br>il s\'agit d\'un design souvenir qui ne peut pas être utilisé pour un dépôt réel.<br><br><strong>Version sur commande</strong> : une pièce unique avec un croquis au crayon.<br>Merci de m\'envoyer l\'illustration de la personne qui la recevra.<br>Je ne découpe ni ne modifie l\'illustration.<br>Si votre partenaire est du même sexe, dites-moi quel côté doit être la mariée.<br>Il s\'agit d\'un design souvenir qui ne peut pas être utilisé pour un dépôt réel.',
  stamp_note: 'Stickers et badges pour les memberships YouTube. Ils fonctionnent aussi sur Discord.',
  v_premium_note: 'Sera produit avec un mouvement de style Live2D à la place',
  qty_unit: 'prix par pièce',
  soon_commentcss: 'CSS personnalisé qui adapte l\'affichage de votre chat (pour OneComme et similaires) à votre personnage.<br>Il couvre huit types de messages, dont le chat classique, les memberships, les Super Chat et les Super Stickers.<br><br>Frais de base à partir de 10 000 ¥ / nouvelles illustrations à partir de 2 000 ¥ chacune / variantes de couleur à partir de 3 000 ¥ (cinq couleurs).<br><br><strong>Actuellement en préparation.</strong> N\'hésitez pas à me contacter si cela vous intéresse.',
  soon_clock: 'Une horloge ou un affichage du temps écoulé pour votre stream, conçu pour correspondre à votre personnage.<br><br><strong>Actuellement en préparation.</strong> N\'hésitez pas à me contacter si cela vous intéresse.',
  soon_profilesite: 'Un site d\'une page qui regroupe vos liens et votre profil.<br>Il se lit bien sur mobile, vous pouvez donc le mettre dans votre profil SNS.<br>Je prends aussi des commandes d\'autres illustrateurs. <strong>Un site portfolio comme celui que vous consultez actuellement</strong> est également possible.<br><br><strong>Actuellement en préparation.</strong> Le tarif n\'est pas encore fixé, n\'hésitez pas à me contacter.',
  '追加キャラクター': 'Personnage supplémentaire',
  '点数': 'Quantité',
  'かわいらしさを保ちつつ衣装・髪型の細部まで描き込めるバランス。ぐるにゃが一番よく描くのもこれ！': 'Un équilibre qui garde le côté mignon tout en permettant des détails poussés sur les tenues et coiffures. C\'est aussi celui que je dessine le plus souvent !',
  /* ＭＶ制作プランの中身 */
  '・楽曲に合わせたカット割り・歌詞のテキストアニメーション中心・基本的なトランジション／モーショングラフィックス・シンプルな構成': '・Découpage synchronisé avec la musique<br>・Principalement animation texte des paroles<br>・Transitions et motion design de base<br>・Structure simple',
  '・曲の展開を意識したカット割り・歌詞アニメーションの作り込み・エフェクト、装飾によるデザイン演出・カメラワークによる奥行きの表現': '・Découpage qui suit l\'évolution du morceau<br>・Animation des paroles travaillée en détail<br>・Effets et décorations pour la direction visuelle<br>・Profondeur créée par le mouvement de caméra',
  '・構成から組み立てるカット割り・Live2Dでリギングした人物アニメーション・リリックモーションの作り込み・デザイン演出全体の作り込み': '・Découpage construit depuis la structure globale<br>・<strong>Animation du personnage riggé en Live2D</strong><br>・Motion des paroles travaillée en détail<br>・Direction visuelle entièrement travaillée',
  /* ＭＶのオプション・納期・リピーター */
  '収益化チャンネルでの公開、広告・宣伝への使用など、金銭的利益を伴う利用に必要です。個人のSNS投稿・非営利目的には不要です。著作権はぐるにゃに帰属し、このライセンスに譲渡は含まれません。': 'Nécessaire pour tout usage impliquant un gain financier, comme la publication sur une chaîne monétisée ou l\'utilisation en publicité.<br>Non nécessaire pour les publications SNS personnelles ou un usage non commercial.<br>Le droit d\'auteur reste à ぐるにゃ et n\'est pas transféré par cette licence.',
  '通常のサンプル掲載は30秒程度のダイジェストのみで、完全版はお客様のチャンネルへリンクでご案内します。本編の再生はお客様側に集まりますので、宣伝としてもお使いいただけます。それでも掲載を希望されない場合にこちらをお選びください。': 'Habituellement, je ne publie qu\'un extrait d\'environ 30 secondes et renvoie vers votre chaîne pour la version complète.<br>Les vues de la vidéo complète vous reviennent, ce qui sert aussi de promotion.<br>Choisissez cette option si vous préférez tout de même n\'avoir aucune publication.',
  'どのプランも1ヶ月前後が目安です。混雑状況とお返事の速度によって変わります。': 'Toutes les formules prennent environ un mois.<br>Cela varie selon la charge de travail et la rapidité de nos échanges.',
  '2週間前後での納品を目指します。ご確認のお返事を当日〜翌日中にいただける場合に限ります。': 'L\'objectif est une livraison en environ deux semaines.<br>Possible uniquement si vous pouvez répondre aux vérifications le jour même ou le lendemain.',
  '1週間前後での納品を目指します。スケジュールによってはお受けできないことがありますので、事前にご相談ください。': 'L\'objectif est une livraison en environ une semaine.<br>Selon mon planning, il se peut que je ne puisse pas l\'accepter — merci de me consulter à l\'avance.',
  'いつもありがとうございます。2回目以降のご依頼は、制作プランの料金を10%引きにさせていただきます。オプションや権利のお料金、モニター価格は割引の対象外とさせてください。': 'Merci pour votre fidélité.<br>À partir de votre deuxième commande, la formule de production bénéficie de 10 % de réduction.<br>Les options, les frais de droits et les prix moniteur ne sont pas concernés par cette réduction.',
  'デジタルチェキ': 'Photo Instantanée Numérique',
  'トレカ風カード': 'Carte Style Trading Card',
  'カレンダー': 'Calendrier',
  '年間1枚': 'Une feuille annuelle',
  '月めくり12枚': '12 feuilles mensuelles',
  calendar_note: 'Je fournis les données prêtes à imprimer.<br>Vous pouvez les imprimer vous-même, ou les partager via un service d\'impression en supérette.',
  'お持ちの立ち絵をチェキ風のフレームに収めます。日付やサインを入れることもできます。シンプルな構成です。': 'Votre illustration de personnage placée dans un cadre style photo instantanée. Une date ou une signature peut être ajoutée. Mise en page simple.',
  '装飾や書き文字を多く入れた、作り込みのある構成です。ブロマイド風の仕上げにも対応します。': 'Une mise en page richement décorée avec du texte manuscrit. Une finition style photo dédicacée est également possible.',
  'トレーディングカード風のカードをお作りします。お名前や肩書きのレイアウトも設計します。シンプルな構成です。': 'Une carte style trading card. Je conçois aussi la mise en page du nom et du titre. Mise en page simple.',
  '枠・背景・箔押し風の演出まで作り込みます。免許証風・学生証風などの体裁にも対応します。': 'Cadres, arrière-plans et effets style dorure à chaud, travaillés en détail. Les styles carte d\'identité ou carte d\'étudiant sont également possibles.',
  '12か月分を1枚にまとめたカレンダーです。日付のレイアウトもこちらで設計します。': 'Un calendrier réunissant les douze mois sur une seule feuille. Je conçois aussi la mise en page des dates.',
  '1か月ごとに1枚、12枚をお作りします。月ごとに構成を変えられます。': 'Douze feuilles, une par mois. La mise en page peut changer d\'un mois à l\'autre.',
  /* デザインの種別タブ */
  'ネームロゴ': 'Logo de Nom',
  '配信スケジュール表': 'Planning de Diffusion',
  '配信オーバーレイ': 'Overlay de Stream',
  '配信背景': 'Fond de Stream',
  'ヘッダー': 'Bannière',
  'プロフィールカード': 'Carte de Profil',
  '配信サムネイル': 'Miniature',
  '動く壁紙': 'Fond d\'écran Animé',
  'スタンプ・バッジ': 'Stickers & Badges',
  'アイコンリング': 'Anneau d\'Icône',
  'コメント欄カスタムCSS': 'CSS de Chat',
  '配信時計': 'Horloge de Stream',
  'プロフィールサイト': 'Site de Profil',
  '横配信': 'Paysage',
  '縦配信': 'Portrait',
  'キャラ': 'Personnage',
  '文字のみ': 'Texte seul',
  '小物・食べ物': 'Objets & Nourriture',
  /* デザインのカード説明 */
  'キャラクターのモチーフを1点だけ添えた、すっきりした構成です。': 'Un design épuré avec un seul motif de votre personnage.',
  'キャラクターのモチーフを複数点あしらった、装飾の多い構成です。': 'Un design décoré avec plusieurs motifs de votre personnage.',
  '文字そのものをモチーフに置き換えてデザインし、相棒キャラクター（ちびキャラ）を1点お描きします。': 'Les lettres elles-mêmes sont redessinées comme motifs, avec un personnage chibi compagnon en plus.',
  '商用利用可能なフリー素材と自作のパーツを組み合わせ、賑やかに飾り付けてお作りします。曜日・時間帯のレイアウトはご希望に合わせて調整いたします。': 'Réalisé en combinant des ressources libres de droits utilisables commercialement et des éléments originaux, avec une décoration généreuse. La mise en page des jours et horaires est ajustée selon vos souhaits.',
  '世界観に合わせた背景を手描きで描き下ろします（人物は含みません）。': 'Un arrière-plan dessiné à la main correspondant à l\'univers de votre personnage (personnages non inclus).',
  '待機画面・枠などをシンプルな構成でお作りします。': 'Écrans d\'attente, cadres, etc. dans une mise en page simple.',
  '世界観に合わせて描き込んだ、作り込みのある構成です。': 'Richement dessiné pour correspondre à l\'univers de votre personnage.',
  'パソコン・横画面での配信向け。描き込みは控えめです。': 'Pour le streaming en paysage sur ordinateur. Détails discrets.',
  'パソコン・横画面での配信向け。描き込みをたっぷり入れます。': 'Pour le streaming en paysage sur ordinateur. Riche en détails.',
  'スマートフォンの縦画面での配信向け。描き込みは控えめです。': 'Pour le streaming en portrait sur smartphone. Détails discrets.',
  'スマートフォンの縦画面での配信向け。描き込みをたっぷり入れます。': 'Pour le streaming en portrait sur smartphone. Riche en détails.',
  'リスナーさんへの返礼品としてお渡しいただけるヘッダーです。X用とIRIAM用、両方のサイズでお渡しします。シンプルな構成でお作りします。': 'Une bannière à offrir à vos auditeurs en remerciement. Livrée aux formats X et IRIAM. Mise en page simple.',
  '装飾や書き文字を多く入れた、作り込みのある構成です。サイズはご指定ください。': 'Une mise en page richement décorée avec du texte manuscrit. Merci de préciser la taille.',
  '装飾を多く入れた、作り込みのある構成です。項目数が多い場合にも向いています。': 'Une mise en page richement décorée, adaptée aussi aux cartes avec de nombreux éléments.',
  '装飾やコラージュを作り込んだ構成です。動きにも変化をつけます。': 'Un collage richement travaillé, avec plus de variation dans l\'animation.',
  '自己紹介・ボイス診断などのカードをお作りします。項目はご相談のうえ決めます。': 'Cartes de présentation, tests de voix et similaires. Nous décidons des éléments ensemble.',
  '配信のサムネイルを1点ごとにお作りします。': 'Miniatures de stream, réalisées à l\'unité.',
  'IRIAMの初配信WEEKやイベント用に、7日分をまとめてお作りします。': 'Sept jours en un lot — pour les semaines de débuts IRIAM et les événements.',
  'お持ちの写真やイラストでデザインし、iPhoneのライブ写真とAndroid用のmp4でお渡しします。ロック画面で1〜3秒動きます。': 'Conçu à partir de vos photos ou illustrations, livré en Live Photo iPhone et en mp4 pour Android. Il s\'anime pendant 1 à 3 secondes sur votre écran verrouillé.',
  'キャラクターのスタンプ・バッジです。文字入れは無料でお付けします。': 'Stickers et badges de personnage. Le texte est ajouté gratuitement.',
  '動くキャラクタースタンプです。文字入れは無料でお付けします。': 'Stickers de personnage animés. Le texte est ajouté gratuitement.',
  '文字だけで構成したスタンプ・バッジです。': 'Stickers et badges composés uniquement de texte.',
  '食べ物や小物のスタンプ・バッジです。': 'Stickers et badges de nourriture et petits objets.',
  'アイコンのまわりを飾るリングです。シンプルな構成でお作りします。': 'Un anneau qui encadre votre icône, dans un design simple.',
  'モチーフや装飾を多く入れた、作り込みのあるリングです。': 'Un anneau richement décoré avec de nombreux motifs.',
  /* デザインの種別・バリエーション */
  'シンプル': 'Simple',
  'デコ': 'Déco',
  'デコデコ': 'Déco Déco',
  'スタンダード': 'Standard',
  'プレミアム': 'Premium',
  '1点ずつ': 'À l\'unité',
  '一週間セット': 'Lot d\'une semaine',
  '静止画': 'Image fixe',
  'アニメーション': 'Animé',
  /* ＭＶ制作 */
  'ＭＶ制作プラン': 'Formules de Production MV',
  'ご依頼前にご確認ください': 'À lire avant de commander',
  'ライトプラン': 'Formule Light',
  'スタンダードプラン': 'Formule Standard',
  'プレミアムプラン': 'Formule Premium',
  video_delivery: 'Toutes les formules prennent environ <strong>un mois</strong>. Cela varie selon la charge de travail et la rapidité de nos échanges.<br>Si vous êtes pressé, n\'hésitez pas à demander — selon mon planning, il est possible que je puisse m\'adapter.',
  '納期': 'Délai',
  video_hint: 'Le prix varie selon la durée du morceau.<br>Le prix indiqué suppose que vous fournissez l\'illustration.',
  video_other: '* Je réalise aussi d\'autres travaux vidéo comme des openings, endings et vidéos courtes — n\'hésitez pas à demander.',
  video_terms: "・ Les illustrations sont <strong>fournies par vous</strong> (je peux aussi les dessiner séparément si vous le souhaitez)<br>・ Le rigging Live2D s'applique <strong>uniquement à la formule Premium</strong><br>・ Dans ce cas, je vous serais reconnaissant de fournir <strong>une illustration clé séparée en calques</strong><br>・ Si elle n'est pas séparée en calques, je peux le faire moi-même, mais cela nécessite l'autorisation de l'illustrateur<br>・ Pour un changement de pose A vers B, je recommande de commander <strong>deux illustrations de personnage</strong><br>　 Cela tend à rendre le MV plus vivant",
  /* プレミアムの確認モーダル */
  v2d_title: 'À propos de l\'animation Live2D',
  v2d_body: 'La formule Premium est animée avec un personnage riggé en Live2D (le changement de pose n\'est pas inclus).<br>Avez-vous une illustration séparée en calques ?<br>Je peux séparer les calques moi-même si ce n\'est pas le cas, mais cela nécessite <strong>l\'autorisation de l\'illustrateur qui l\'a dessinée</strong>.',
  '絵師様の許可をいただいています（ご自身で描かれた場合も含みます）': "J'ai l'autorisation de l'illustrateur (y compris si vous l'avez dessinée vous-même)",
  '絵師様の許可はまだいただいていません': "Je n'ai pas encore l'autorisation de l'illustrateur",
  v2d_warn: 'L\'œuvre sera réalisée avec un mouvement de style Live2D à la place<br><span class="sim-modal-warn-sub">Si vous obtenez l\'autorisation plus tard, je peux passer à une véritable animation Live2D. N\'hésitez pas à demander.</span>',
  v2d_pose: '* Le changement de pose peut être ajouté séparément',
  v2d_ok: 'Confirmé',
  v2d_cancel: 'Annuler',
  'グッズ販売': 'Vente de Produits Dérivés',
  goods_scope_q: 'Tout d\'abord, dites-moi si vous comptez aussi l\'utiliser pour le streaming. L\'usage considéré comme principal change le tarif.',
  '配信でも使う＋グッズ展開': 'Streaming + produits dérivés',
  'グッズ制作のみ': 'Produits dérivés uniquement',
  '1種類目から二次利用料': 'frais d\'usage secondaire dès le 1er type',
  '1種類目は商用ライセンス内': '1er type couvert par la licence',
  '応相談': 'sur devis',
  'ネームロゴ シンプル': 'Logo de Nom (Simple)',
  'ネームロゴ デコ': 'Logo de Nom (Déco)',
  'ネームロゴ デコデコ': 'Logo de Nom (Déco Déco)',
  'アクリルスタンド・缶バッジ・Tシャツなど、グッズとして販売される場合はこちらをお選びください。展開される商品の種類によって金額が変わるため、こちらの項目自体に料金は設定していません。':
    'Choisissez cette option si vous prévoyez de vendre l\'illustration comme produit dérivé — stands acryliques, badges, T-shirts, etc. Aucun prix fixe n\'est défini ici, car le montant dépend du nombre de types de produits que vous proposez.',
  goods_add: '＋ Ajouter un produit dérivé',
  goods_hint:
    'L\'utilisation sur les overlays de stream, icônes et bannières est couverte par la licence d\'utilisation commerciale (＋5 000 ¥). Si vous vendez aussi des produits dérivés, <strong>des frais d\'usage secondaire s\'appliquent dès le tout premier type de produit</strong> (selon les recommandations de l\'Association des Illustrateurs Japonais).<br>Compté par catégorie de produit — un stand acrylique, un badge et un T-shirt comptent pour 3 types. Plusieurs variantes d\'expression du même produit ne comptent que pour un seul type.',
  '＋ベース料金の70% / セット': '＋70 % du prix de base / lot',
  '＋ベース料金の50% / 種':   '＋50 % du prix de base / type',
  '著作権譲渡': 'Cession de Droits d\'Auteur',
  '原則としてお受けしておりません。譲渡が成立した場合は著作権がお客様に移転するため、商用利用ライセンス（＋¥5,000）とグッズの二次利用料は不要になります。':
    '<strong>En principe, je n\'accepte pas la cession de droits d\'auteur.</strong> Si une cession est convenue, le droit d\'auteur vous est transféré, la licence d\'utilisation commerciale (＋5 000 ¥) et les frais d\'usage secondaire pour produits dérivés ne sont alors plus nécessaires.',
  'いつもありがとうございます。2回目以降のご依頼は、イラスト本体（構図・追加キャラクター）を10%引きにさせていただきます。背景や差分などのオプション、商用利用・著作権譲渡・グッズの二次利用といった権利のお料金は、割引の対象外とさせてください。':
    'Merci pour votre fidélité. À partir de votre deuxième commande, <strong>10 % de réduction sur l\'illustration elle-même (composition et personnages supplémentaires)</strong>.<br>Les options comme les arrière-plans et variantes, ainsi que les frais de droits comme l\'usage commercial, la cession de droits d\'auteur et l\'usage secondaire pour produits dérivés, ne sont pas concernés par cette réduction.',
  /* section headers（番号バッジ導入後のh2テキスト） */
  'ベースイラスト': 'Illustration de Base',
  'キャラクターデザイン': 'Design de Personnage',
  '背景': 'Arrière-plan',
  '差分': 'Variante',
  '使用用途（任意・複数選択可）': 'Usage (facultatif)',
  '動くイラスト': 'Live2D / Animation',
  'オプション': 'Options',
  'リピーター割引': 'Réduction Fidélité',
  '追加修正': 'Retouches Supplémentaires',
  'サービス種別': 'Type de Service',
  '制作点数': 'Quantité',
  /* base options */
  '胸上（バストアップ）': 'Buste',
  '腰上': 'Taille',
  '太ももまで': 'Cuisses',
  '全身': 'Corps Entier',
  'SDキャラ（デフォルメ）': 'Chibi / SD',
  '等身キャラ': 'Standard',
  'SDキャラ': 'Chibi / SD',
  '1.5頭身': 'Chibi 1,5 tête',
  '2頭身': 'Chibi 2 têtes',
  '2.5頭身': 'Chibi 2,5 têtes',
  '3頭身': 'Chibi 3 têtes',
  'もっちもちで一番ゆるかわいいバランス。手足もシンプルで、とにかく「かわいい」全開のSDだよ':
    'La proportion la plus moelleuse et adorable. Membres simples, mignon à 100 % !',
  'コロコロぷにぷにな定番SDバランス。シンプルかわいい系のキャラに◎':
    'Rond et potelé — la proportion chibi classique. Parfait pour les personnages simples et mignons !',
  'かわいらしさを保ちつつ衣装・髪型の細部まで描き込めるバランス。るーちゃんが一番よく描くのもこれ！':
    'Garde le côté mignon tout en permettant des détails poussés sur les tenues et coiffures. C\'est aussi la taille que je dessine le plus souvent !',
  'SDの中で一番等身キャラ寄り。体のラインはSDキャラなりによく出るように描ける。アクションポーズも映えてかっこかわいい系にも◎':
    'La plus proportionnée parmi les chibis. Les poses d\'action ressortent bien, idéal pour un style cool et mignon à la fois !',
  '追加キャラクター人数': 'Personnages Supplémentaires',
  'デザイン済み（参考画像あり）': 'Déjà Désigné (avec référence)',
  'デザインなし（キャラデザインから依頼）': 'Sans Design (à créer)',
  'なし / 単色・透過': 'Aucun / Uni / Transparent',
  '簡易背景（グラデ・模様など）': 'Arrière-plan Simple',
  '描き込みあり背景': 'Arrière-plan Détaillé',
  'SDキャラ用描き込み背景': 'Arrière-plan Détaillé (Chibi)',
  '表情差分': 'Variantes d\'Expression',
  '表情差分（等身キャラ）': 'Variantes d\'Expression (Standard)',
  '表情差分（SDキャラ）': 'Variantes d\'Expression (Chibi)',
  '衣装差分': 'Variantes de Tenue',
  '衣装差分（等身キャラ）': 'Variantes de Tenue (Standard)',
  '衣装差分（SDキャラ）': 'Variantes de Tenue (Chibi)',
  '髪型差分': 'Variantes de Coiffure',
  '髪型差分（等身キャラ）': 'Variantes de Coiffure (Standard)',
  '髪型差分（SDキャラ）': 'Variantes de Coiffure (Chibi)',
  'SNSアイコン': 'Icône SNS',
  'SNSヘッダー': 'Bannière SNS',
  'YouTubeサムネイル': 'Miniature YouTube',
  '動画素材・切り抜き配信': 'Vidéo / Assets Streaming',
  '印刷用高解像度データ（A3対応）': 'Données Haute Résolution (jusqu\'à A3)',
  'Live2D用（レイヤー分けPSD納品）': 'Pour Live2D (PSD en calques)',
  'なし': 'Aucun',
  '等身・基本（まばたき・口・呼吸）': 'Standard · Basique (clignement, bouche, respiration)',
  '等身・ポーズ切り替えあり': 'Standard · Avec changement de pose',
  'SDキャラ・基本': 'Chibi · Basique',
  'SDキャラ・ポーズ切り替えあり': 'Chibi · Avec changement de pose',
  '商用利用ライセンス': 'Licence d\'Utilisation Commerciale',
  'SNS・サンプル掲載不可': 'Pas de publication SNS / Portfolio',
  '完成した作品をぐるにゃのSNS・ポートフォリオ・サンプル画像などへの掲載を行いません。プライベートなご利用・成人向けコンテンツへの使用など、公開を希望されない場合にお選びください。':
    'L\'œuvre terminée ne sera pas publiée sur le SNS, le portfolio ou les pages d\'échantillons de ぐるにゃ. Choisissez cette option si vous préférez que le travail reste privé — usage personnel, contenu adulte, ou toute autre raison.',
  '完成した作品をぐるにゃのSNS・ポートフォリオ・サンプル画像などへの掲載を行いません。プライベートなご利用・成人向けコンテンツへの使用など、公開を希望されない場合にお選びください。※ ライセンス料は定額のため、納期倍率・リピーター割引の対象外です。':
    'L\'œuvre terminée ne sera pas publiée sur le SNS, le portfolio ou les pages d\'échantillons de ぐるにゃ. Choisissez cette option si vous préférez que le travail reste privé — usage personnel, contenu adulte, ou toute autre raison. * Les frais de licence sont à taux fixe et ne sont pas affectés par les multiplicateurs de délai ni la réduction fidélité.',
  '通常納期': 'Délai Standard',
  '短縮納期': 'Délai Accéléré',
  '最短納期': 'Délai Express',
  /* 納期の日数タグ */
  days_standard: '10–14 jours',
  days_rush:     'sous 7 jours',
  days_express:  'sous 5 jours',
  /* 納期の補足メモ */
  '腰上・背景なし基準で10〜14日が目安です。作業量や確認のお返事速度によって前後します。':
    'Environ 10 à 14 jours pour un buste sans arrière-plan. Peut varier selon la charge de travail et la rapidité des réponses.',
  'ご依頼から7日以内に納品します。確認のご返答は当日〜翌日中にいただける場合に限ります。':
    'Livré sous 7 jours. Nécessite des réponses le jour même ou le lendemain aux demandes de confirmation.',
  'ご依頼から5日以内に納品します。確認のご返答は当日中にいただける場合に限ります。':
    'Livré sous 5 jours. Nécessite des réponses le jour même à toutes les demandes de confirmation.',
  delivery_flow_note: '※ Le travail ne peut pas avancer tant que chaque étape de validation n\'est pas approuvée — le délai peut s\'allonger si les réponses tardent.',
  delivery_start_note: '※ Le délai est compté à partir du début du travail. Une période d\'attente peut s\'appliquer selon la charge de travail actuelle.',
  '追加修正回数（4回目以降）': 'Retouches Supplémentaires (4e et +)',
  'バナー・広告（静止画）': 'Bannière / Publicité (Statique)',
  'バナー・広告（GIFアニメ）': 'Bannière / Publicité (GIF)',
  'チラシ・フライヤー（片面）': 'Flyer (Recto)',
  '名刺・ショップカード': 'Carte de Visite / Carte Boutique',
  'ロゴデザイン': 'Design de Logo',
  'LPデザイン（コーディングなし）': 'Design de Landing Page (Sans Code)',
  '追加制作点数': 'Quantité Supplémentaire',
  '元データ納品（.ai / .psd）': 'Fichier Source (.ai / .psd)',
  '印刷用高解像度データ（350dpi）': 'Haute Résolution pour Impression (350dpi)',
  /* inline notes */
  'キャンバスサイズ6,500px以上の高解像度データでお渡しします。切り抜き配信・拡大編集・動画素材への利用に適しています。':
    'Livré à 6 500px ou plus sur le côté long. Adapté au streaming avec incrustation, au montage agrandi et aux assets vidéo.',
  'A3サイズ・350dpi対応の印刷用データでお渡しします。コンビニでのネットプリントにもそのままお使いいただけます。これはデータの仕様に対する料金です。グッズ・物販として販売される場合は、別途「07 オプション」の商用利用ライセンスと「08 グッズ・物販の二次利用」の二次利用料が必要になります。':
    'Livré en données prêtes à imprimer au format A3 / 350dpi, utilisables directement pour l\'impression en supérette. <strong>Ce tarif couvre uniquement la spécification des données.</strong> Si vous vendez l\'illustration comme produit dérivé, la licence d\'utilisation commerciale sous « 07 Options » et les frais d\'usage secondaire sous « 08 Produits dérivés & Usage secondaire » sont nécessaires séparément.',
  '⚠ 動くイラスト（⑥番）をご依頼の場合はパーツ分けが料金に含まれますので、こちらはチェック不要です。動くイラストのpsdデータをご希望の場合は事前にご相談ください。':
    '⚠ Si vous commandez une animation Live2D (section ⑥), le PSD en calques est déjà inclus — inutile de cocher cette case. Si vous souhaitez uniquement le PSD d\'une illustration classique, merci de me consulter à l\'avance.',
  'グッズ販売・企業広告・有料コンテンツ・収益化チャンネルでの使用など、金銭的利益を伴う利用に必要です。個人のSNS投稿・非営利目的には不要です。著作権はぐるにゃに帰属し、このライセンスに譲渡は含まれません。':
    '<strong>Nécessaire pour tout usage impliquant un gain financier</strong> — vente de produits dérivés, publicité commerciale, contenu payant, chaînes monétisées, etc. Non nécessaire pour les publications SNS personnelles ou un usage non commercial. Le droit d\'auteur reste à ぐるにゃ et n\'est pas transféré par cette licence.',
  option_note: '* Les frais d\'options et de droits ne sont pas affectés par les multiplicateurs de délai ni la réduction fidélité.',
  /* アコーディオンタイトル */
  '詳細': 'Détails',
  '⚠ 注意': '⚠ Remarque',
  /* テキストのみの価格スパン */
  '構図調整のみ': 'Ajustement de composition seul',
  '×1.0': '×1,0',
  '合計×1.5倍': '×1,5 au total',
  '合計×2倍': '×2,0 au total',
  '2回目以降のご依頼': '2e commande et +',
  '基本料金×50% / 点': 'Base ×50 % / pièce',
  /* data-i18n キー（innerHTML差し替え用） */
  total_label_top:  'Total estimé (environ)',
  breakdown_toggle: 'Voir le détail',
  base_type_hint:   'Veuillez sélectionner un type de personnage',
  consult_btn:      'Me consulter à ce sujet',
  badge_change:     'Changer de type',
  page_desc:     'Sélectionnez des options pour calculer votre total estimé. Les prix sont donnés à titre indicatif.',
  usage_hint:    'La composition et la résolution sont ajustées selon votre usage. Les options avec frais supplémentaires sont indiquées.',
  highres_both:  '※ Les frais de haute résolution (3 500 ¥ / 25 $) ne sont facturés qu\'une seule fois même si les deux options sont sélectionnées.',
  revision_note: 'Jusqu\'à 3 retouches gratuites incluses. Des frais s\'appliquent à partir de la 4e retouche.<br>Tout changement majeur de composition ou de pose après le lineart sera traité comme une nouvelle commande.',
  note_live2d:   '※ La finition After Effects est incluse avec toutes les commandes Live2D. Le montage vidéo et l\'intégration au logiciel de streaming ne sont pas inclus, mais n\'hésitez pas à me consulter.',
  design_top:    '※ Les prix de design sont des estimations basées sur le marché. Le tarif final est confirmé lors de la consultation.',
  design_qty:    '50 % du prix de base est ajouté pour chaque pièce supplémentaire.',
  total_note:    '※ Le tarif final est confirmé lors de la consultation.<br>N\'hésitez pas à me faire part de vos contraintes budgétaires — partagez votre vision et votre budget, et je ferai de mon mieux pour m\'adapter.<br>N\'hésitez pas à me contacter via Coconala ou par DM sur X (Twitter).',
  /* Live2Dノート（⚠なし版） */
  '動くイラスト（⑥番）をご依頼の場合はパーツ分けが料金に含まれますので、こちらはチェック不要です。動くイラストのpsdデータをご希望の場合は事前にご相談ください。':
    'Si vous commandez une animation Live2D (section ⑥), le PSD en calques est déjà inclus — inutile de cocher cette case. Si vous souhaitez uniquement le PSD d\'une illustration classique, merci de me consulter à l\'avance.',
};

/* テキストノード取得（sim-tagが入れ子の場合は最初のテキストノードのみ） */
function getJpText(el) {
  if (el.querySelector('.sim-tag')) {
    return el.firstChild?.textContent?.trim() || el.textContent.trim();
  }
  return el.textContent.trim();
}

/* alt・aria-label・title のように、テキストではなく属性なので
   辞書の差し替えでは切り替えられないものを言語ごとに入れ替える
   画面には出ないが、読み上げソフトや画像が表示できないときに読まれるため、
   日本語のままにせず3言語そろえる
     data-alt-ja  / data-alt-en  / data-alt-fr   → alt
     data-aria-ja / data-aria-en / data-aria-fr  → aria-label
     data-tip-ja  / data-tip-en  / data-tip-fr   → title（マウスを乗せたときの吹き出し） */
function applyLangAttrs(root, lang) {
  const pick = (ds, key) =>
    lang === 'jp' ? ds[key + 'Ja']
  : lang === 'fr' ? (ds[key + 'Fr'] || ds[key + 'En'] || ds[key + 'Ja'])
  : (ds[key + 'En'] || ds[key + 'Ja']);

  const swap = (sel, dsKey, attrName) => {
    root.querySelectorAll(sel).forEach(el => {
      const v = pick(el.dataset, dsKey);
      if (v) el.setAttribute(attrName, v);
    });
  };
  swap('[data-alt-ja]', 'alt', 'alt');
  swap('[data-aria-ja]', 'aria', 'aria-label');
  swap('[data-tip-ja]', 'tip', 'title');
}

function switchLang(lang) {
  currentLang = lang;
  applyLangAttrs(document, lang);
  const titleEl = document.getElementById('page-title');
  const totalLabelEl = document.querySelector('.sim-total-label');
  if (lang !== 'jp') {
    /* 英語かフランス語かで辞書を選ぶ。以下は辞書名だけ変えた同じ処理 */
    const T = lang === 'fr' ? TRANS_FR : TRANS_EN;
    titleEl.textContent = T.title;
    if (totalLabelEl) totalLabelEl.textContent = T['お見積もり合計（目安）'];
    /* セクション見出し・選択肢名・カウンターラベル */
    document.querySelectorAll('.sim-card h2, .sim-option-name, .sim-counter-label, .sim-pose-desc, .sim-base-type-tab span, .sim-kind-tab, .sim-extra-char-label, .sim-tabs .sim-tab, .sim-kind-group-label, .sim-step-label, .price-consult').forEach(el => {
      const jp = el.dataset.jp || getJpText(el);
      if (!el.dataset.jp) el.dataset.jp = jp;
      const tr = T[jp];
      if (!tr) return;
      if (el.querySelector('.sim-tag') && el.firstChild?.nodeType === 3) {
        el.dataset.jpNode = el.firstChild.textContent;
        el.firstChild.textContent = tr + ' ';
      } else {
        el.textContent = tr;
      }
    });
    /* 補足ノートカードの本文（innerHTML保存でstrong等を維持） */
    document.querySelectorAll('.sim-note-accordion-body').forEach(el => {
      const jp = el.dataset.jp || el.textContent.trim();
      if (!el.dataset.jp) el.dataset.jp = jp;
      if (!el.dataset.jpHtml) el.dataset.jpHtml = el.innerHTML;
      const tr = T[jp];
      if (tr) el.innerHTML = tr;
    });
    /* ¥なしのテキストのみ価格スパン（％表記の差分料金・著作権譲渡料を含む） */
    document.querySelectorAll('.sim-option-price:not([data-yen]), .sim-counter-price:not([data-yen])').forEach(el => {
      if (!el.dataset.jp) el.dataset.jp = el.textContent.trim();
      const tr = T[el.dataset.jp];
      if (tr !== undefined) el.textContent = tr;
    });
    /* data-i18n要素（innerHTML差し替え） */
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (!el.dataset.jpHtml) el.dataset.jpHtml = el.innerHTML;
      const tr = T[key];
      if (tr !== undefined) el.innerHTML = tr;
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
  /* バッジの文言も言語に合わせて作り直す */
  applyCampaigns();
  updateCampaignBanners();
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.lang === lang);
  });
  /* 内訳・グッズ行の表示も言語に合わせるため calcTotal 経由で再描画する */
  calcTotal();
  updateMascotMessage(null);
  updateConsultItems();
  updateDeliveryNote();
  /* バッジラベルを言語に合わせて更新 */
  const badgeLabel = document.getElementById('base-badge-label');
  if (badgeLabel && currentBaseType) {
    badgeLabel.textContent = currentBaseType === 'normal'
      ? tl('等身キャラ', 'Standard', 'Standard')
      : tl('SDキャラ', 'Chibi / SD', 'Chibi / SD');
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
initOrderWideSync();
initSwitchModal();
updateCampaignBanners();
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
const SEASONAL_MESSAGES_FR = {
  spring: [
    'Prenez votre temps~ ₍ᐢ‥ᐢ₎ ♡',
    'C\'est le printemps ! N\'hésitez pas à tout me confier ₍ᐢ‥ᐢ₎ ♡',
    'Les cerisiers sont magnifiques en cette saison ₍ᐢ‥ᐢ₎',
    'N\'hésitez pas à demander si vous avez des questions ₍ᐢ‥ᐢ₎',
  ],
  summer: [
    'Il fait très chaud ces derniers temps ₍ᐢ‥ᐢ₎ Restez hydraté !',
    'Attention aux coups de chaleur ₍ᐢ‥ᐢ₎',
    'N\'hésitez pas à tout me confier ₍ᐢ‥ᐢ₎ ♡',
    'Prenez votre temps~ ₍ᐢ‥ᐢ₎',
  ],
  autumn: [
    'L\'automne est arrivé ₍ᐢ‥ᐢ₎ ♡ Prenez votre temps~',
    'C\'est la saison créative ! Créons quelque chose de génial ensemble ₍ᐢ‥ᐢ₎',
    'N\'hésitez pas à tout me confier ₍ᐢ‥ᐢ₎ ♡',
    'N\'hésitez pas à demander quoi que ce soit ₍ᐢ‥ᐢ₎',
  ],
  winter: [
    'Il commence à faire froid, n\'est-ce pas ₍ᐢ‥ᐢ₎ Restez au chaud !',
    'Ne prenez pas froid ₍ᐢ‥ᐢ₎ ♡',
    'Prenez votre temps~ ₍ᐢ‥ᐢ₎',
    'N\'hésitez pas à tout me confier ₍ᐢ‥ᐢ₎ ♡',
  ],
};

/* === うさぎの天気の話 === */
/* 訪問者の位置情報は一切取得しない。全国の決まった地点を見て、
   「2地点以上そうなら地方名」「2地方以上そうなら西日本などの大きい括り」で話す。
   取得に失敗したら黙って普段の雑談に戻る */
const WEATHER_POINTS = [
  { name: '札幌',   area: '北海道', block: '北日本', lat: 43.06, lon: 141.35 },
  { name: '釧路',   area: '北海道', block: '北日本', lat: 42.98, lon: 144.37 },
  { name: '仙台',   area: '東北',   block: '北日本', lat: 38.27, lon: 140.87 },
  { name: '秋田',   area: '東北',   block: '北日本', lat: 39.72, lon: 140.10 },
  { name: '東京',   area: '関東',   block: '東日本', lat: 35.69, lon: 139.69 },
  { name: '宇都宮', area: '関東',   block: '東日本', lat: 36.57, lon: 139.88 },
  { name: '名古屋', area: '中部',   block: '東日本', lat: 35.18, lon: 136.91 },
  { name: '金沢',   area: '中部',   block: '東日本', lat: 36.59, lon: 136.63 },
  { name: '大阪',   area: '近畿',   block: '西日本', lat: 34.69, lon: 135.50 },
  { name: '京都',   area: '近畿',   block: '西日本', lat: 35.01, lon: 135.77 },
  { name: '広島',   area: '中国',   block: '西日本', lat: 34.39, lon: 132.46 },
  { name: '松江',   area: '中国',   block: '西日本', lat: 35.47, lon: 133.05 },
  { name: '高松',   area: '四国',   block: '西日本', lat: 34.34, lon: 134.05 },
  { name: '高知',   area: '四国',   block: '西日本', lat: 33.56, lon: 133.53 },
  { name: '福岡',   area: '九州',   block: '西日本', lat: 33.59, lon: 130.40 },
  { name: '鹿児島', area: '九州',   block: '西日本', lat: 31.60, lon: 130.56 },
  { name: '那覇',   area: '沖縄',   block: '沖縄',   lat: 26.21, lon: 127.68 },
];

/* うさぎが喋る天気のセリフ。ゆいさんの口調に書き換えてください。
   {place} には「九州」「西日本」などの地名が入ります */
const WEATHER_LINES = {
  typhoon:  '台風が近づいてるみたいなのだ₍ᐢ- -ᐢ₎\n防災グッズとスマホの充電、確認できたのかな？',
  storm:    '{place}のほうが風も雨も強いみたい₍ᐢ;ｗ;ᐢ₎\n無理に外に出ないでね、気をつけてなのだ',
  rain:     '{place}は雨みたいうさ₍ᐢ- -ᐢ₎ 傘ちゃんと持ったのかな？',
  rainAll:  '全国的に雨うさね₍ᐢ- -ᐢ₎ こんな日はおうちでゆっくりするのだ',
  snow:     '{place}は雪だって₍ᐢ‥ᐢ₎ ♡ 足元に気をつけてなのだ',
  hotAll:   '全国的にとんでもない暑さうさ₍ᐢ;ｗ;ᐢ₎ 水分とれたのかな？',
  hot:      '{place}は今日も暑いみたい₍ᐢ;ｗ;ᐢ₎ 涼しくしてるのかな？',
  cold:     '{place}は冷えてるみたいうさ₍ᐢ- -ᐢ₎ あったかくしてるのかな？',
  clearAll: '今日は全国的にいいお天気なのだ₍ᐢ‥ᐢ₎ ♡ 気持ちいいうさね！',
};

let weatherMessage = null;   /* 取得できたらここに入る。使えないときは null のまま */

/* 天気コードの判定（Open-Meteo の WMO コード） */
const isRainCode = c => (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || (c >= 95 && c <= 99);
const isSnowCode = c => (c >= 71 && c <= 77) || c === 85 || c === 86;

/* 条件に当てはまる場所を、地方 → 大きい括り の順にまとめて名前を返す。
   ・ある地方の2地点以上が該当したら、その地方名
   ・ある括りの2地方以上が該当したら、括りの名前（西日本など）
   1地点だけなら県名は出さず、話題にしない */
function placeNameFor(points, fn) {
  const hitAreas = [];
  const byArea = {};
  points.forEach(p => { (byArea[p.area] = byArea[p.area] || []).push(p); });
  Object.entries(byArea).forEach(([area, list]) => {
    const hit = list.filter(fn).length;
    /* 沖縄は1地点しかないので、その1地点で判定する */
    const need = list.length === 1 ? 1 : 2;
    if (hit >= need) hitAreas.push({ area, block: list[0].block });
  });
  if (hitAreas.length === 0) return null;

  const byBlock = {};
  hitAreas.forEach(a => { (byBlock[a.block] = byBlock[a.block] || []).push(a.area); });
  const bigBlocks = Object.entries(byBlock).filter(([, areas]) => areas.length >= 2);
  if (bigBlocks.length > 0) return bigBlocks.map(([block]) => block).join('と');
  return hitAreas.map(a => a.area).join('と');
}

function buildWeatherMessage(points, hasTyphoon) {
  const all = points;
  const ratio = fn => all.filter(fn).length / all.length;
  const rainy = p => p.rain > 0 || isRainCode(p.code);

  /* 1. 台風が来ているときは最優先で防災の声かけ */
  if (hasTyphoon) return WEATHER_LINES.typhoon;

  /* 2. 荒れている場所（強風＋雨） */
  const storm = placeNameFor(points, p => p.wind >= 15 && p.rain > 0);
  if (storm) return WEATHER_LINES.storm.replace('{place}', storm);

  /* 3. 全国的な雨・暑さ */
  if (ratio(rainy) >= 0.75) return WEATHER_LINES.rainAll;
  if (ratio(p => p.temp >= 35) >= 0.6) return WEATHER_LINES.hotAll;

  /* 4. 地方ごとの特徴 */
  const snow = placeNameFor(points, p => isSnowCode(p.code));
  if (snow) return WEATHER_LINES.snow.replace('{place}', snow);
  const rain = placeNameFor(points, rainy);
  if (rain) return WEATHER_LINES.rain.replace('{place}', rain);
  const hot = placeNameFor(points, p => p.temp >= 33);
  if (hot) return WEATHER_LINES.hot.replace('{place}', hot);
  const cold = placeNameFor(points, p => p.temp <= 3);
  if (cold) return WEATHER_LINES.cold.replace('{place}', cold);

  /* 5. 特筆することがないときだけ「全国的に晴れ」。
     先に判定すると、雪や暑さのような伝えるべき情報を打ち消してしまう */
  if (ratio(p => p.code === 0 || p.code === 1) >= 0.75) return WEATHER_LINES.clearAll;
  return null;
}

/* 気象庁の台風情報。非公開仕様なので、取れなければ黙って諦める */
async function fetchTyphoon() {
  try {
    const res = await fetch('https://www.jma.go.jp/bosai/typhoon/data/targetTc.json', { cache: 'no-store' });
    if (!res.ok) return false;
    const list = await res.json();
    return Array.isArray(list) && list.length > 0;
  } catch (e) {
    return false;
  }
}

async function fetchWeather() {
  /* 1日1回だけ取得する。同じ人が何度開いてもAPIを叩かない */
  const today = new Date().toISOString().slice(0, 10);
  try {
    const saved = JSON.parse(localStorage.getItem('gurunya-weather') || 'null');
    if (saved && saved.date === today) { weatherMessage = saved.msg; return; }
  } catch (e) { /* 保存が読めなくても気にしない */ }

  try {
    const lat = WEATHER_POINTS.map(p => p.lat).join(',');
    const lon = WEATHER_POINTS.map(p => p.lon).join(',');
    const url = 'https://api.open-meteo.com/v1/forecast'
      + '?latitude=' + lat + '&longitude=' + lon
      + '&current=temperature_2m,precipitation,weather_code,wind_speed_10m'
      + '&wind_speed_unit=ms&timezone=Asia%2FTokyo';
    const [res, hasTyphoon] = await Promise.all([fetch(url), fetchTyphoon()]);
    if (!res.ok) return;
    const data = await res.json();
    const arr = Array.isArray(data) ? data : [data];
    const points = WEATHER_POINTS.map((p, i) => {
      const c = arr[i] && arr[i].current;
      if (!c) return null;
      return { ...p, temp: c.temperature_2m, rain: c.precipitation, code: c.weather_code, wind: c.wind_speed_10m };
    }).filter(Boolean);
    if (points.length < WEATHER_POINTS.length) return;

    weatherMessage = buildWeatherMessage(points, hasTyphoon);
    try {
      localStorage.setItem('gurunya-weather', JSON.stringify({ date: today, msg: weatherMessage }));
    } catch (e) { /* 保存できなくても動作に影響しない */ }
  } catch (e) {
    /* 通信できないときは何もしない。うさぎは普段の雑談を続ける */
  }
}


/* === うさぎの雑談（時間帯・曜日・記念日・滞在時間） === */
/* 天気と同じく、条件に合うものがあれば優先して喋る。
   セリフはゆいさんの口調に書き換えてください */
const CHAT_LINES = {
  /* 時間帯 */
  earlyMorning: 'こんな早くから偉いのだ₍ᐢ‥ᐢ₎ ♡ 朝ごはん食べたのかな？',
  morning:      'おはようなのだ₍ᐢ‥ᐢ₎ ♡ 今日もいい一日になるといいね',
  noon:         'お昼だ〜₍ᐢ‥ᐢ₎ ♡ ちゃんとごはん食べたのかな？',
  evening:      'おつかれさまなのだ₍ᐢ- -ᐢ₎ ゆっくり見ていってね',
  night:        'こんばんはなのだ₍ᐢ‥ᐢ₎ ♡ 夜はアイデアが浮かびやすいうさよね',
  midnight:     'もうこんな時間うさ₍ᐢ- -ᐢ₎ 夜ふかししすぎないでね…',
  /* 曜日 */
  monday:       '月曜日、おつかれさまなのだ₍ᐢ- -ᐢ₎ 今週もぼちぼちいこ',
  friday:       '金曜日うさ〜₍ᐢ‥ᐢ₎ ♡ 明日おやすみの人はもうひとふんばりなのだ',
  weekend:      'おやすみの日かな₍ᐢ‥ᐢ₎ ♡ ゆっくり選んでいってね',
  /* 記念日・季節のイベント */
  newyear:      'あけましておめでとうなのだ₍ᐢ‥ᐢ₎ ♡ 今年もよろしくうさ',
  valentine:    'バレンタインうさね₍ᐢ‥ᐢ₎ ♡ 誰かに何かあげたのかな？',
  halloween:    'もうすぐハロウィンうさ₍ᐢ‥ᐢ₎ ♡ 仮装イラストのご依頼が増える時期なのだ',
  christmas:    'メリークリスマスなのだ₍ᐢ‥ᐢ₎ ♡ 素敵な夜になりますように',
  yearEnd:      '今年ももう終わりうさね₍ᐢ- -ᐢ₎ 一年おつかれさまなのだ',
  /* 滞在時間・操作 */
  longStay:     'けっこう悩んでるのかな₍ᐢ- -ᐢ₎\nわからないところ、遠慮なく聞いてくれていいのだ',
  bigTotal:     '盛りだくさんうさね₍ᐢ‥ᐢ₎ ♡ 完成が楽しみなのだ',
};

const pageOpenedAt = Date.now();
/* モニター価格の案内を出したかどうか（1回だけ言う） */
let monitorNoticeShown = false;

/* 記念日の判定（月と日で見る） */
function getEventLine(now) {
  const m = now.getMonth() + 1, day = now.getDate();
  if (m === 1 && day <= 7)                 return CHAT_LINES.newyear;
  if (m === 2 && day >= 10 && day <= 14)   return CHAT_LINES.valentine;
  if (m === 10 && day >= 20)               return CHAT_LINES.halloween;
  if (m === 12 && day >= 20 && day <= 25)  return CHAT_LINES.christmas;
  if (m === 12 && day >= 26)               return CHAT_LINES.yearEnd;
  return null;
}

function getTimeLine(now) {
  const h = now.getHours();
  if (h >= 4  && h < 7)  return CHAT_LINES.earlyMorning;
  if (h >= 7  && h < 11) return CHAT_LINES.morning;
  if (h >= 11 && h < 14) return CHAT_LINES.noon;
  if (h >= 17 && h < 20) return CHAT_LINES.evening;
  if (h >= 20 && h < 24) return CHAT_LINES.night;
  if (h >= 0  && h < 4)  return CHAT_LINES.midnight;
  return null;
}

function getDayLine(now) {
  const d = now.getDay();
  if (d === 1) return CHAT_LINES.monday;
  if (d === 5) return CHAT_LINES.friday;
  if (d === 0 || d === 6) return CHAT_LINES.weekend;
  return null;
}

/* 雑談の候補を集めて、その中から1つ選ぶ。
   記念日は見逃したくないので確率を高くしている */
function pickChatMessage() {
  const now = new Date();
  const event = getEventLine(now);
  if (event && Math.random() < 0.5) return event;

  /* 5分以上見ているのに金額が0のままなら、迷っていると判断して声をかける */
  const stayed = (Date.now() - pageOpenedAt) / 60000;
  if (stayed >= 5 && prevTotalJPY <= 0 && Math.random() < 0.4) return CHAT_LINES.longStay;
  /* 高額になってきたら予算の相談を促す */
  if (prevTotalJPY >= 60000 && Math.random() < 0.3) return CHAT_LINES.bigTotal;

  const candidates = [getTimeLine(now), getDayLine(now), weatherMessage].filter(Boolean);
  if (candidates.length && Math.random() < 0.6) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  return null;
}


function getSeasonalMessage() {
  let key = 'spring';
  if ([6,7,8].includes(month))   key = 'summer';
  if ([9,10,11].includes(month)) key = 'autumn';
  if ([12,1,2].includes(month))  key = 'winter';
  /* 日本語表示のときは、時間帯・曜日・記念日・天気などの雑談を優先する */
  if (currentLang === 'jp') {
    const chat = pickChatMessage();
    if (chat) return chat;
  }
  const msgs = (currentLang === 'fr' ? SEASONAL_MESSAGES_FR : currentLang === 'en' ? SEASONAL_MESSAGES_EN : SEASONAL_MESSAGES)[key];
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
    message_fr: 'Je dessine le plus souvent en chibi 2,5 têtes ₍ᐢ‥ᐢ₎ ♡ Ça peut être une bonne référence !',
  },

  /* ── SD頭身選択 ── */
  {
    trigger: 'input[name="i_base"][value="6000"]',
    check:   () => { const e = document.querySelector('input[name="i_base"]:checked'); return e && e.value === '6000'; },
    message:    'もっちもち最強かわいい！一番ゆるゆるなSDだよ₍ᐢ‥ᐢ₎ ♡',
    message_en: 'Ultimate squishy cuteness! The most chibi-style of them all ₍ᐢ‥ᐢ₎ ♡',
    message_fr: 'Le maximum de mignonnerie moelleuse ! Le style chibi le plus poussé de tous ₍ᐢ‥ᐢ₎ ♡',
  },
  {
    trigger: 'input[name="i_base"][value="7000"]',
    check:   () => { const e = document.querySelector('input[name="i_base"]:checked'); return e && e.value === '7000'; },
    message:    'コロコロぷにぷにな定番SDだね₍ᐢ‥ᐢ₎ ♡ かわいい系のキャラにぴったり！',
    message_en: 'Round and squishy — the classic chibi look ₍ᐢ‥ᐢ₎ ♡ Perfect for cute characters!',
    message_fr: 'Rond et potelé — le look chibi classique ₍ᐢ‥ᐢ₎ ♡ Parfait pour les personnages mignons !',
  },
  {
    trigger: 'input[name="i_base"][value="8000"]',
    check:   () => { const e = document.querySelector('input[name="i_base"]:checked'); return e && e.value === '8000'; },
    message:    'これが一番よく描くやつだよ₍ᐢ‥ᐢ₎ ♡ かわいさと細かさのバランスが最高！',
    message_en: 'This is the one I draw most often ₍ᐢ‥ᐢ₎ ♡ The best balance of cute and detailed!',
    message_fr: 'C\'est celui que je dessine le plus souvent ₍ᐢ‥ᐢ₎ ♡ Le meilleur équilibre entre mignon et détaillé !',
  },
  {
    trigger: 'input[name="i_base"][value="9000"]',
    check:   () => { const e = document.querySelector('input[name="i_base"]:checked'); return e && e.value === '9000'; },
    message:    'SDの中で一番等身に近いタイプだね₍ᐢ‥ᐢ₎ アクションポーズも映えるよ！',
    message_en: 'The closest to standard proportions among chibis ₍ᐢ‥ᐢ₎ Action poses look great too!',
    message_fr: 'Le plus proche des proportions standards parmi les chibis ₍ᐢ‥ᐢ₎ Les poses d\'action rendent bien aussi !',
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
    message_fr: 'Les chibis SD sont livrés assez vite une fois commencés, donc accélérer ne change pas grand-chose ₍ᐢ- -ᐢ₎ Mais si vous êtes pressé, je ferai de mon mieux !',
  },

  /* ── 背景 ── */
  {
    trigger: 'input[name="i_bg"][value="5000"]',
    check:   () => { const e = document.querySelector('input[name="i_bg"]:checked'); return e && e.value === '5000'; },
    message:    '描き込み量によって変わるので、ざっくりのイメージだけでも教えてくれると見積もりやすいうさよ₍ᐢ‥ᐢ₎ ♡',
    message_en: 'Since the price varies with detail level, even a rough idea of what you\'re imagining helps a lot ₍ᐢ‥ᐢ₎ ♡',
    message_fr: 'Comme le prix varie avec le niveau de détail, même une idée approximative de ce que vous imaginez m\'aide beaucoup ₍ᐢ‥ᐢ₎ ♡',
  },

  /* ── Live2D ── */
  {
    trigger: '#i_live2d_layer',
    check:   () => document.getElementById('i_live2d_layer')?.checked,
    message:    '大体はモデリングをする前提にパーツ分けしながら立ち絵を描くの！\nモデリングは別途になるから注意が必要うさ₍ᐢ- -ᐢ₎\n動くイラストほしいなら選ばないでね',
    message_en: 'The illustration is drawn with rigging in mind, with separated parts!\nNote that Live2D modeling is a separate service ₍ᐢ- -ᐢ₎\nDon\'t check this if you want the animated version!',
    message_fr: 'En général je dessine l\'illustration avec les calques déjà séparés en vue du rigging !\nNotez que la modélisation Live2D est un service séparé ₍ᐢ- -ᐢ₎\nNe cochez pas ceci si vous voulez la version animée !',
  },
  {
    trigger: 'input[name="i_live2d"][value="35000"]',
    check:   () => { const e = document.querySelector('input[name="i_live2d"]:checked'); return e && e.value === '35000'; },
    message:    'ポーズ切り替えありの動くイラストだね₍ᐢ‥ᐢ₎ ♡ 作業大変だけど、頑張っちゃう！',
    message_en: 'A Live2D with pose switching ₍ᐢ‥ᐢ₎ ♡ It\'s a lot of work but I\'ll give it my all!',
    message_fr: 'Une animation Live2D avec changement de pose ₍ᐢ‥ᐢ₎ ♡ Beaucoup de travail, mais je vais donner le meilleur de moi-même !',
  },
  {
    trigger: 'input[name="i_live2d"][value="15000"]',
    check:   () => { const e = document.querySelector('input[name="i_live2d"]:checked'); return e && e.value === '15000'; },
    message:    '簡単な動きの動くイラストだね₍ᐢ‥ᐢ₎ ♡ live2dでモデリングしてまろやかに動かしちゃうぞ！',
    message_en: 'A simple animated illustration ₍ᐢ‥ᐢ₎ ♡ I\'ll make it move smoothly with Live2D!',
    message_fr: 'Une illustration animée avec des mouvements simples ₍ᐢ‥ᐢ₎ ♡ Je vais la faire bouger tout en douceur avec Live2D !',
  },

  /* ── キャラクターデザイン ── */
  {
    trigger: 'input[name="i_design"][value="5000"]',
    check:   () => { const e = document.querySelector('input[name="i_design"]:checked'); return e && e.value === '5000'; },
    message:    'キャラデザインもお任せ₍ᐢ‥ᐢ₎ ♡ こういうイメージを参考に描いてとか、好みの雰囲気があったら教えてね！\nイメージと雰囲気だけ指定して他は全部お任せする～ってのもできるうさ₍ᐢ- -ᐢ₎',
    message_en: 'Character design is all on me ₍ᐢ‥ᐢ₎ ♡ Share any references or vibes you like!\nYou can also just describe the mood and leave the rest to me ₍ᐢ- -ᐢ₎',
    message_fr: 'Le design de personnage, c\'est aussi pour moi ₍ᐢ‥ᐢ₎ ♡ Partagez vos références ou l\'ambiance que vous aimez !\nVous pouvez aussi juste décrire l\'ambiance et me laisser faire le reste ₍ᐢ- -ᐢ₎',
  },

  /* ── 使用用途 ── */
  {
    trigger: '#i_goods_usage',
    check:   () => document.getElementById('i_goods_usage')?.checked,
    message:    'グッズ販売だね₍ᐢ‥ᐢ₎ ♡ 「07 オプション」の商用利用ライセンスは自動で入れておいたうさよ！\n出す予定のグッズは「08 グッズ・物販の二次利用」に入れてみてね₍ᐢ- -ᐢ₎',
    message_en: 'Selling merch ₍ᐢ‥ᐢ₎ ♡ I\'ve already ticked the commercial use license under “07 Option” for you!\nList the items you\'re planning under “08 Merchandise & Secondary Use” ₍ᐢ- -ᐢ₎',
    message_fr: 'Vente de produits dérivés ₍ᐢ‥ᐢ₎ ♡ J\'ai déjà coché la licence d\'utilisation commerciale sous « 07 Options » pour vous !\nListez les articles prévus sous « 08 Produits dérivés & Usage secondaire » ₍ᐢ- -ᐢ₎',
  },
  {
    trigger: '#i_highres, #i_print',
    check:   () => document.getElementById('i_highres')?.checked && document.getElementById('i_print')?.checked,
    message:    '動画素材と印刷物、両方選んでくれたね₍ᐢ‥ᐢ₎ ♡ 高解像度料金は一回分でいいんだよ！\n二次利用する時は追加料金取らないけど、事前にお知らせしてくれるとすごくすごく嬉しいうさ₍ᐢ;ｗ;ᐢ₎',
    message_en: 'You picked both video and print ₍ᐢ‥ᐢ₎ ♡ The high-res fee is only charged once!\nNo extra charge for secondary use — but a heads-up beforehand would make me super happy ₍ᐢ;ｗ;ᐢ₎',
    message_fr: 'Vous avez choisi la vidéo et l\'impression ₍ᐢ‥ᐢ₎ ♡ Les frais de haute résolution ne sont facturés qu\'une fois !\nAucun frais supplémentaire pour l\'usage secondaire — mais me prévenir à l\'avance me ferait super plaisir ₍ᐢ;ｗ;ᐢ₎',
  },
  {
    trigger: '#i_highres',
    check:   () => document.getElementById('i_highres')?.checked,
    message:    '切り抜き配信用に高解像度でお届けするね₍ᐢ‥ᐢ₎ 配信頑張って！',
    message_en: 'I\'ll deliver it in high resolution for your stream ₍ᐢ‥ᐢ₎ Good luck with the streams!',
    message_fr: 'Je vous la livrerai en haute résolution pour votre stream ₍ᐢ‥ᐢ₎ Bon courage pour les streams !',
  },
  {
    trigger: '#i_print',
    check:   () => document.getElementById('i_print')?.checked,
    message:    'A3・350dpi対応で仕上げるよ₍ᐢ‥ᐢ₎ ♡ \nグッズ完成楽しみだね！',
    message_en: 'I\'ll finish it at A3 / 350dpi ₍ᐢ‥ᐢ₎ ♡\nCan\'t wait to see your merch!',
    message_fr: 'Je la finaliserai au format A3 / 350dpi ₍ᐢ‥ᐢ₎ ♡\nJ\'ai hâte de voir votre produit fini !',
  },
  {
    trigger: '.i_usage[data-note*="文字"]',
    check:   () => document.querySelector('.i_usage[data-note*="文字"]')?.checked,
    message:    'サムネ用に文字スペースも考えた構図にするね\n歌ってみたなら本家に似せることもできるから気軽くに相談してうさ₍ᐢ‥ᐢ₎♡',
    message_en: 'I\'ll leave room for text in the layout for your thumbnail\nFor song covers, I can match the original style too — feel free to ask ₍ᐢ‥ᐢ₎♡',
    message_fr: 'Je laisserai de l\'espace pour le texte dans la mise en page de votre miniature\nPour les covers, je peux aussi me rapprocher du style original — n\'hésitez pas à demander ₍ᐢ‥ᐢ₎♡',
  },
  {
    trigger: '.i_usage[data-note*="横長"]',
    check:   () => document.querySelector('.i_usage[data-note*="横長"]')?.checked,
    message:    '横長構図で頭上・両端が切れないよう仕上げるよ₍ᐢ‥ᐢ₎お好みの構図を教えてうさ',
    message_en: 'I\'ll make sure nothing gets cropped in the wide banner format ₍ᐢ‥ᐢ₎ Let me know your preferred layout!',
    message_fr: 'Je m\'assurerai que rien n\'est coupé dans le format bannière large ₍ᐢ‥ᐢ₎ Dites-moi la mise en page que vous préférez !',
  },
  {
    trigger: '.i_usage[data-note*="正方形"]',
    check:   () => document.querySelector('.i_usage[data-note*="正方形"]')?.checked,
    message:    '基本はご自分でトリミングして使ってね、正方形構図でも顔が映えるよう仕上げるね₍ᐢ‥ᐢ₎ ♡',
    message_en: 'You can crop it yourself to fit — I\'ll make sure the face stands out even in a square frame ₍ᐢ‥ᐢ₎ ♡',
    message_fr: 'Vous pouvez la recadrer vous-même — je m\'assurerai que le visage ressorte bien même dans un cadre carré ₍ᐢ‥ᐢ₎ ♡',
  },

  /* ── ＭＶ制作 ── */
  {
    trigger: '#v_premium',
    check:   () => document.getElementById('v_premium')?.checked,
    message:    'ポーズ切り替えありにもできるうさよ₍ᐢ‥ᐢ₎ ♡\n顔はそのままで体だけ動かすのでも、立ち絵がガラッと変わるのでも、どっちもかっこいいね！\n同じ顔で体を動かすのか、別のポーズをもう一枚描いてもらってるのか、ヒアリングのときに教えてね♡\nどっちにしてもMVの印象がすごく変わるのは間違いないうさ₍ᐢ- -ᐢ₎',
    message_en: 'Pose switching can be added too ₍ᐢ‥ᐢ₎ ♡\nWhether the face stays and only the body moves, or the whole illustration changes — both look great!\nLet me know during our chat which one you have: the same face with body motion, or a second illustration drawn in a different pose ♡\nEither way it changes the feel of the MV completely ₍ᐢ- -ᐢ₎',
    message_fr: 'Le changement de pose peut aussi être ajouté ₍ᐢ‥ᐢ₎ ♡\nQue le visage reste fixe avec seulement le corps qui bouge, ou que toute l\'illustration change — les deux sont superbes !\nDites-moi pendant notre échange lequel vous avez : le même visage avec du mouvement, ou une deuxième illustration dans une autre pose ♡\nDans les deux cas, ça change complètement l\'ambiance du MV ₍ᐢ- -ᐢ₎',
  },
  {
    trigger: 'input[name="v_plan"]',
    check:   () => !!document.querySelector('input[name="v_plan"]:checked'),
    message:    'MV制作、ありがとうございます₍ᐢ‥ᐢ₎ ♡\nお値段は曲の長さで変わるから、尺がわかったら教えてね！\nイラストの描き下ろしもできるうさよ₍ᐢ- -ᐢ₎',
    message_en: 'Thank you for considering an MV ₍ᐢ‥ᐢ₎ ♡\nThe price moves with the length of the track, so let me know the runtime!\nI can draw new illustrations for it too ₍ᐢ- -ᐢ₎',
    message_fr: 'Merci de considérer un MV ₍ᐢ‥ᐢ₎ ♡\nLe prix varie avec la durée du morceau, dites-moi la longueur !\nJe peux aussi dessiner de nouvelles illustrations pour l\'occasion ₍ᐢ- -ᐢ₎',
  },

  /* ── デザイン：動く壁紙 ── */
  {
    trigger: '#d-kind-wallpaper input',
    check:   () => currentKind === 'wallpaper' && !!document.querySelector('#d-kind-wallpaper input:checked'),
    message:    '動く壁紙だね₍ᐢ‥ᐢ₎ ♡ ロック画面でふわっと動くやつ！\n同じ作り方で、配信のアラート演出やトランジションも作れるうさよ。気になったら聞いてね₍ᐢ- -ᐢ₎',
    message_en: 'A live wallpaper ₍ᐢ‥ᐢ₎ ♡ The kind that moves softly on your lock screen!\nI can make stream alerts and transitions the same way — just ask if you are curious ₍ᐢ- -ᐢ₎',
    message_fr: 'Un fond d\'écran animé ₍ᐢ‥ᐢ₎ ♡ Celui qui bouge doucement sur votre écran verrouillé !\nJe peux faire des alertes de stream et des transitions de la même façon — demandez si ça vous intéresse ₍ᐢ- -ᐢ₎',
  },
  /* ── デザイン：スタンプ・バッジ ── */
  {
    trigger: '#d-kind-stamp-chara input',
    check:   () => currentSub === 'stamp-chara' && !!document.querySelector('#d-kind-stamp-chara input:checked'),
    message:    'スタンプは文字入れ無料でお付けするうさよ₍ᐢ‥ᐢ₎ ♡\nYouTubeのメンバーシップだけじゃなくて、Discordでも使えるからおすすめ！',
    message_en: 'Text is added free of charge on stamps ₍ᐢ‥ᐢ₎ ♡\nThey work on Discord as well as YouTube memberships — highly recommended!',
    message_fr: 'Le texte est ajouté gratuitement sur les stickers ₍ᐢ‥ᐢ₎ ♡\nÇa fonctionne sur Discord en plus des memberships YouTube — vivement recommandé !',
  },
  /* ── 準備中の種別 ── */
  {
    trigger: '.sim-kind-tab--soon',
    check:   () => ['commentcss', 'clock', 'profilesite'].includes(currentKind),
    message:    'これ、まだ準備中なんだけど作れるうさよ₍ᐢ‥ᐢ₎ ♡\n気になったら気軽にDMしてね！相談だけでも大歓迎うさ＞＜',
    message_en: 'This one is still in the works, but I can make it ₍ᐢ‥ᐢ₎ ♡\nJust DM me if you are curious — happy to chat about it! ＞＜',
    message_fr: 'Celui-ci est encore en préparation, mais je peux le faire ₍ᐢ‥ᐢ₎ ♡\nEnvoyez-moi un DM si ça vous intéresse — ravie d\'en discuter, même juste pour parler ＞＜',
  },

  /* ── オプション ── */
  {
    trigger: '#i_copyright',
    check:   () => document.getElementById('i_copyright')?.checked,
    message:    '著作権譲渡は原則お受けしてないんだ₍ᐢ- -ᐢ₎\nでもご事情によっては特別にお客様のご意思を尊重するうさよ！まずは気軽に相談してみてね₍ᐢ‥ᐢ₎ ♡',
    message_en: 'I don\'t normally offer copyright transfer ₍ᐢ- -ᐢ₎\nBut depending on your situation I\'ll respect your wishes as a special case — just ask me first ₍ᐢ‥ᐢ₎ ♡',
    message_fr: 'Je n\'offre normalement pas la cession de droits d\'auteur ₍ᐢ- -ᐢ₎\nMais selon votre situation, je respecterai votre souhait comme cas spécial — demandez-moi d\'abord ₍ᐢ‥ᐢ₎ ♡',
  },
  {
    trigger: '#i_commercial',
    check:   () => document.getElementById('i_commercial')?.checked,
    message:    '商用ライセンスありがとうございます₍ᐢ‥ᐢ₎ ♡ 収益化頑張って！\n今はまだ未収益化でも、目指してる配信者さん・VTuberさんは選んでくれると嬉しいうさ₍ᐢ- -ᐢ₎',
    message_en: 'Thank you for choosing the commercial license ₍ᐢ‥ᐢ₎ ♡ Best of luck with monetization!\nEven if you\'re not monetized yet, I\'d be happy if you pick this when you\'re working towards it ₍ᐢ- -ᐢ₎',
    message_fr: 'Merci d\'avoir choisi la licence commerciale ₍ᐢ‥ᐢ₎ ♡ Bonne chance pour la monétisation !\nMême si vous n\'êtes pas encore monétisé, je serais ravie que vous la choisissiez en visant cet objectif ₍ᐢ- -ᐢ₎',
  },
  {
    trigger: '#i_nosns',
    check:   () => document.getElementById('i_nosns')?.checked,
    message:    'SNS非掲載で対応するね₍ᐢ‥ᐢ₎ ♡ プライベートな依頼やちょっとR付のものも安心して任せてうさ',
    message_en: 'I\'ll keep it off my SNS ₍ᐢ‥ᐢ₎ ♡ Feel free to request private or mature content — your secret is safe!',
    message_fr: 'Je ne la publierai pas sur mon SNS ₍ᐢ‥ᐢ₎ ♡ N\'hésitez pas à demander du contenu privé ou mature — votre secret est bien gardé !',
  },

  /* ── 納期 ── */
  {
    trigger: 'input[name="i_rush"]',
    check:   () => !!document.querySelector('input[name="i_rush"]:checked'),
    message:    'あくまであくまで目安なので、納期より前に納品するように心かけてるし、場合によってめっちゃめちゃ爆速で納品しちゃうこともあるうさよ₍ᐢ- ̫-ᐢ₎',
    message_en: 'Just a rough estimate — I always aim to deliver early, and sometimes I\'ll surprise you with super speedy delivery ₍ᐢ- ̫-ᐢ₎',
    message_fr: 'C\'est vraiment juste une estimation — je vise toujours à livrer plus tôt, et parfois je vous surprendrai avec une livraison ultra rapide ₍ᐢ- ̫-ᐢ₎',
  },

  /* ── リピーター割引 ── */
  {
    trigger: '#i_repeat',
    check:   () => document.getElementById('i_repeat')?.checked,
    message:    'またきてくれてありがとう₍ᐢ‥ᐢ₎ ♡ いつも応援してるうさ！\n描かせてもらうお礼の割引だから、イラスト本体からお値引きさせてね₍ᐢ- -ᐢ₎',
    message_en: 'Welcome back ₍ᐢ‥ᐢ₎ ♡ I\'m always rooting for you!\nIt\'s my thank-you for letting me draw, so the discount comes off the illustration itself ₍ᐢ- -ᐢ₎',
    message_fr: 'Merci de revenir ₍ᐢ‥ᐢ₎ ♡ Je vous soutiens toujours !\nC\'est mon remerciement pour me laisser dessiner, donc la réduction s\'applique sur l\'illustration elle-même ₍ᐢ- -ᐢ₎',
  },

];
/* ▲ ここまで ▲ */

/* === 種別・サブ種別を選んだときのうさぎの説明 === */
/* 大カテゴリー（何を作るか）を押したときに、その種別の説明を軽くする。
   構図やプランを選んだときは喋らない（説明が多すぎると読まれないため） */
const KIND_LINES = {
  overlay:   '配信オーバーレイは、待機画面や休憩画面、配信中の枠をまとめてお作りするやつうさ₍ᐢ‥ᐢ₎\n世界観に合わせて作り込むこともできるのだ',
  bg:        '配信背景うさね₍ᐢ‥ᐢ₎\n横配信か縦配信かで見える範囲がぜんぜん違うから、まずどっちか選んでほしいのだ',
  schedule:  '配信スケジュール表なのだ₍ᐢ‥ᐢ₎\n曜日や時間帯のレイアウトはご希望に合わせて調整できるうさよ',
  thumb:     '配信サムネイルうさ₍ᐢ‥ᐢ₎\n1点ずつでも、初配信WEEKやイベント用に7日分まとめてでもお作りできるのだ',
  namelogo:  'ネームロゴなのだ₍ᐢ‥ᐢ₎ ♡\nモチーフの数と相棒キャラの有無で3種類あるから、サンプルを見比べてみてね',
  profile:   'プロフィールカードうさね₍ᐢ‥ᐢ₎\nボイス診断カードみたいなのもお作りしてるのだ。項目は一緒に決めていきましょうさ',
  stamp:     'スタンプ・バッジうさ₍ᐢ‥ᐢ₎ ♡\nYouTubeのメンバーシップだけじゃなくて、Discordでも使えるのだ',
  wallpaper: '動く壁紙なのだ₍ᐢ‥ᐢ₎ ♡\nロック画面でふわっと動くやつうさ。iPhoneもAndroidも両方お渡しするのだ',
  ring:      'アイコンリングうさね₍ᐢ‥ᐢ₎ ♡\nファンの方への返礼品にぴったりなのだ',
  cheki:     'デジタルチェキうさね₍ᐢ‥ᐢ₎ ♡\n量産型のテンプレートは、BOOTHで無料配布できるよう準備中うさよ。\n受注制作はモチーフを描き下ろして、装飾を重ねた仕上げにするのだ',
  trading:   'トレカ風カードなのだ₍ᐢ‥ᐢ₎ ♡\nお名前や肩書きのレイアウトもこっちで設計するうさよ。免許証風・学生証風もできるのだ',
  merch:     'グッズデザインなのだ₍ᐢ‥ᐢ₎ ♡\nアクスタや缶バッジみたいな、実物のグッズ用の入稿データをお作りするのだ。\n印刷所の仕様で変わるから、内容をうかがってからのお見積もりうさよ',
  calendar:  'カレンダーうさね₍ᐢ‥ᐢ₎\n日付の組み方までこっちで設計するのだ。\n12か月ぶんを1枚にまとめるのと、月めくり12枚から選べるうさよ',
  header:    'ヘッダーなのだ₍ᐢ‥ᐢ₎\n返礼品用と、よめこな王さん向けの婚姻届風があるうさよ',
};

/* サブ種別（配信スタイル・モチーフ・使用用途）を押したときの説明 */
const SUB_LINES = {
  'bg-h': 'パソコンでの横画面配信向けうさね₍ᐢ‥ᐢ₎\n見える範囲が広いから、描き込みが映えるのだ',
  'bg-v': 'IRIAM用でしたら、ちょっと待ってくださいね₍ᐢ><ᐢ₎\nIRIAMはオリジナル背景のイベントに入賞しないと、ご自分では変えられないのだ。\nご注文は一度待ってからのほうが安心うさ。\nもう入賞されていましたら、入賞おめでとうさ₍ᐢ‥ᐢ₎\n一緒に背景を詰めていきましょうさ！',
  'stamp-chara': 'キャラクターのスタンプうさね₍ᐢ‥ᐢ₎ ♡\n文字入れは無料でお付けするのだ',
  'stamp-text': '文字だけのスタンプなのだ₍ᐢ‥ᐢ₎\nお手軽だけど、意外といちばん使われるうさよ',
  'stamp-item': '食べ物や小物のスタンプうさ₍ᐢ‥ᐢ₎ ♡\nキャラと組み合わせると賑やかになるのだ',
  'header-gift': 'リスナーさんへの返礼品うさね₍ᐢ‥ᐢ₎ ♡\nX用とIRIAM用、両方のサイズでお渡しするから、貼る場所を選ばないのだ',
  'header-marriage': 'よめこな王さんへの返礼品うさね₍ᐢ‥ᐢ₎ ♡\n量産型のテンプレートは、BOOTHで無料配布できるよう準備中うさよ。\n受注制作は鉛筆の落書きを描き下ろす一点物うさよ₍ᐢ‥ᐢ₎ ♡',
};

/* 種別を押したときの説明（英語） */
const KIND_LINES_EN = {
  overlay: "Stream overlays cover the waiting screen, the break screen and the in-stream frames all together ₍ᐢ‥ᐢ₎\nI can build them around your world-view too",
  bg: "Stream backgrounds ₍ᐢ‥ᐢ₎\nLandscape and portrait show a very different area, so please pick one first",
  schedule: "A stream schedule ₍ᐢ‥ᐢ₎\nThe layout of the days and times can be adjusted however you like",
  thumb: "Stream thumbnails ₍ᐢ‥ᐢ₎\nOne at a time, or seven days at once for a debut week or an event",
  namelogo: "A name logo ₍ᐢ‥ᐢ₎ ♡\nThere are three types depending on the number of motifs and whether a buddy character joins. Have a look at the samples",
  profile: "A profile card ₍ᐢ‥ᐢ₎\nI make voice-check style cards as well. We can decide the items together",
  stamp: "Stamps and badges ₍ᐢ‥ᐢ₎ ♡\nNot just for YouTube memberships, they work on Discord too",
  wallpaper: "A moving wallpaper ₍ᐢ‥ᐢ₎ ♡\nIt drifts softly on your lock screen. You get both the iPhone and Android versions",
  ring: "An icon ring ₍ᐢ‥ᐢ₎ ♡\nPerfect as a thank-you gift for your fans",
  cheki: "A digital instant photo ₍ᐢ‥ᐢ₎ ♡\nThe template version is being prepared for free distribution on BOOTH.\nFor the made-to-order one I draw a few motifs from scratch and build up the decoration",
  trading: "A trading-card style card ₍ᐢ‥ᐢ₎ ♡\nI design the layout of your name and title as well. Licence-style and student-ID style are possible too",
  merch: "Merch design ₍ᐢ‥ᐢ₎ ♡\nI prepare the print-ready data for physical goods like acrylic stands and badges.\nThe price depends on what the printer requires, so I quote it after hearing the details",
  calendar: "A calendar ₍ᐢ‥ᐢ₎\nI design the date grid myself.\nChoose twelve months on a single sheet, or twelve monthly pages",
  header: "A header ₍ᐢ‥ᐢ₎\nThere is one for thank-you gifts, and a marriage-form style one for your top supporter",
};
const KIND_LINES_FR = {
  overlay: "Les overlays de stream couvrent l'écran d'attente, l'écran de pause et les cadres en direct, tout en un ₍ᐢ‥ᐢ₎\nJe peux aussi les construire autour de votre univers",
  bg: "Fonds de stream ₍ᐢ‥ᐢ₎\nLe paysage et le portrait montrent une zone très différente, choisissez donc d'abord l'un des deux",
  schedule: "Un planning de diffusion ₍ᐢ‥ᐢ₎\nLa mise en page des jours et horaires peut être ajustée comme vous le souhaitez",
  thumb: "Miniatures de stream ₍ᐢ‥ᐢ₎\nÀ l'unité, ou sept jours d'un coup pour une semaine de débuts ou un événement",
  namelogo: "Un logo de nom ₍ᐢ‥ᐢ₎ ♡\nIl y a trois types selon le nombre de motifs et la présence d'un personnage compagnon. Jetez un œil aux exemples",
  profile: "Une carte de profil ₍ᐢ‥ᐢ₎\nJe fais aussi des cartes style test de voix. Nous décidons des éléments ensemble",
  stamp: "Stickers et badges ₍ᐢ‥ᐢ₎ ♡\nPas seulement pour les memberships YouTube, ça fonctionne aussi sur Discord",
  wallpaper: "Un fond d'écran animé ₍ᐢ‥ᐢ₎ ♡\nIl bouge doucement sur votre écran verrouillé. Vous recevez les versions iPhone et Android",
  ring: "Un anneau d'icône ₍ᐢ‥ᐢ₎ ♡\nParfait comme cadeau de remerciement pour vos fans",
  cheki: "Une photo instantanée numérique ₍ᐢ‥ᐢ₎ ♡\nLa version modèle est en préparation pour une distribution gratuite sur BOOTH.\nPour la version sur commande, je dessine quelques motifs originaux et ajoute des décorations",
  trading: "Une carte style trading card ₍ᐢ‥ᐢ₎ ♡\nJe conçois aussi la mise en page du nom et du titre. Les styles carte d'identité et carte d'étudiant sont aussi possibles",
  merch: "Design de produits dérivés ₍ᐢ‥ᐢ₎ ♡\nJe prépare les données prêtes à imprimer pour des produits physiques comme les stands acryliques et badges.\nLe prix dépend des exigences de l'imprimeur, un devis vous sera donc proposé après discussion",
  calendar: "Un calendrier ₍ᐢ‥ᐢ₎\nJe conçois moi-même la grille des dates.\nChoisissez douze mois sur une seule feuille, ou douze feuilles mensuelles",
  header: "Une bannière ₍ᐢ‥ᐢ₎\nIl y en a une pour les cadeaux de remerciement, et une style acte de mariage pour votre meilleur soutien",
};

/* サブ種別を押したときの説明（英語） */
const SUB_LINES_EN = {
  'bg-h': "For landscape streaming on a PC ₍ᐢ‥ᐢ₎\nThe visible area is wide, so detailed artwork really shows",
  'bg-v': "If it is for IRIAM, please hold on a moment ₍ᐢ><ᐢ₎\nOn IRIAM you cannot change the background yourself unless you place in an original-background event.\nIt is safer to wait before ordering.\nIf you have already placed, congratulations ₍ᐢ‥ᐢ₎\nLet us work out the background together!",
  'stamp-chara': "Character stamps ₍ᐢ‥ᐢ₎ ♡\nAdding text is free of charge",
  'stamp-text': "Text-only stamps ₍ᐢ‥ᐢ₎\nSimple, but these end up being used the most",
  'stamp-item': "Stamps of food and small items ₍ᐢ‥ᐢ₎ ♡\nCombined with the character ones they liven things up",
  'header-gift': "A thank-you gift for your listeners ₍ᐢ‥ᐢ₎ ♡\nYou get both the X and IRIAM sizes, so it fits wherever you put it",
  'header-marriage': "A gift for your top supporter ₍ᐢ‥ᐢ₎ ♡\nThe template version is being prepared for free distribution on BOOTH.\nThe made-to-order version is a one-off with a pencil sketch ₍ᐢ‥ᐢ₎ ♡",
};
const SUB_LINES_FR = {
  'bg-h': "Pour le streaming en paysage sur ordinateur ₍ᐢ‥ᐢ₎\nLa zone visible est large, les détails ressortent vraiment bien",
  'bg-v': "Si c'est pour IRIAM, un instant s'il vous plaît ₍ᐢ><ᐢ₎\nSur IRIAM, vous ne pouvez pas changer le fond vous-même à moins de participer à un événement de fond original.\nIl est plus sûr d'attendre avant de commander.\nSi vous avez déjà participé, félicitations ₍ᐢ‥ᐢ₎\nTravaillons ensemble sur le fond !",
  'stamp-chara': "Stickers de personnage ₍ᐢ‥ᐢ₎ ♡\nL'ajout de texte est gratuit",
  'stamp-text': "Stickers texte seul ₍ᐢ‥ᐢ₎\nSimple, mais ce sont ceux qui finissent le plus utilisés",
  'stamp-item': "Stickers de nourriture et petits objets ₍ᐢ‥ᐢ₎ ♡\nCombinés avec ceux du personnage, ça anime bien",
  'header-gift': "Un cadeau de remerciement pour vos auditeurs ₍ᐢ‥ᐢ₎ ♡\nVous recevez les tailles X et IRIAM, donc ça s'adapte partout",
  'header-marriage': "Un cadeau pour votre meilleur soutien ₍ᐢ‥ᐢ₎ ♡\nLa version modèle est en préparation pour une distribution gratuite sur BOOTH.\nLa version sur commande est une pièce unique avec un croquis au crayon ₍ᐢ‥ᐢ₎ ♡",
};



/* 選んだ項目に合わせたひとこと。専用のセリフがない項目はここから選ぶ。
   {name} には選んだ項目の名前が入ります */
const GENERIC_PICK_LINES = [
  '{name} だね₍ᐢ‥ᐢ₎ ♡ いい感じなのだ',
  '{name} を選んだのだ₍ᐢ‥ᐢ₎ 気になることあったら聞いてね',
  '{name} だ〜₍ᐢ‥ᐢ₎ ♡ 完成が楽しみうさね',
  'なるほど、{name} うさね₍ᐢ- -ᐢ₎ 承ったのだ',
  '{name} ね₍ᐢ‥ᐢ₎ ♡ 迷ったらいつでも相談してほしいのだ',
];
const GENERIC_PICK_LINES_EN = [
  'Going with {name} ₍ᐢ‥ᐢ₎ ♡ Nice choice!',
  '{name}, got it ₍ᐢ‥ᐢ₎ Just ask if anything is unclear',
  '{name} it is ₍ᐢ‥ᐢ₎ ♡ Looking forward to it!',
];
const GENERIC_PICK_LINES_FR = [
  'On part sur {name} ₍ᐢ‥ᐢ₎ ♡ Excellent choix !',
  '{name}, c\'est noté ₍ᐢ‥ᐢ₎ N\'hésitez pas si quelque chose n\'est pas clair',
  '{name}, c\'est parti ₍ᐢ‥ᐢ₎ ♡ J\'ai hâte de voir le résultat !',
];

/* 選択した要素から、表示されている項目名を拾う */
function pickedName(el) {
  if (!el) return null;
  const wrap = el.closest('.sim-option, .sim-pose-card, .sim-counter');
  if (!wrap) return null;
  const nameEl = wrap.querySelector('.sim-option-name, .sim-counter-label');
  if (!nameEl) return null;
  /* タグ（−10% など）は名前に含めない */
  const raw = nameEl.firstChild && nameEl.firstChild.nodeType === 3
    ? nameEl.firstChild.textContent
    : nameEl.textContent;
  const name = raw.trim();
  return name || null;
}

/* その条件が、いま表示されているタブのものかどうか。
   別のタブの選択が残っていても喋り続けないようにする */
function conditionVisible(c) {
  if (!c.trigger) return true;
  const el = document.querySelector(c.trigger);
  if (!el) return false;
  const sec = el.closest('.sim-section');
  return !sec || sec.classList.contains('is-active');
}

/* 説明を出した時刻。一定時間が過ぎたら雑談に戻してよい */
let lastExplainAt = 0;
const EXPLAIN_HOLD_MS = 20000;

function setMascotText(txt) {
  const textEl   = document.getElementById('mascot-bubble-text');
  const bubbleEl = document.getElementById('mascot-bubble');
  if (!textEl || !bubbleEl || textEl.textContent === txt) return;
  bubbleEl.classList.remove('bubble-pop');
  void bubbleEl.offsetWidth;
  bubbleEl.classList.add('bubble-pop');
  textEl.textContent = txt;
  lastExplainAt = Date.now();
}

function updateMascotMessage(changedEl) {
  const textEl   = document.getElementById('mascot-bubble-text');
  const bubbleEl = document.getElementById('mascot-bubble');
  if (!textEl || !bubbleEl) return;

  let newTx = null;
  if (changedEl) {
    /* 専用のセリフがある項目はそれを優先 */
    const triggered = MASCOT_CONDITIONS.find(c => c.trigger && changedEl.matches(c.trigger) && c.check());
    if (triggered) {
      newTx = (currentLang === 'fr' && triggered.message_fr) ? triggered.message_fr
            : (currentLang === 'en' && triggered.message_en) ? triggered.message_en
            : triggered.message;
    } else if (changedEl.dataset && changedEl.dataset.sub) {
      const s = changedEl.dataset.sub;
      newTx = (currentLang === 'fr' && SUB_LINES_FR[s]) || (currentLang === 'en' && SUB_LINES_EN[s]) || SUB_LINES[s] || null;
    } else if (changedEl.dataset && changedEl.dataset.kind) {
      const k = changedEl.dataset.kind;
      newTx = (currentLang === 'fr' && KIND_LINES_FR[k]) || (currentLang === 'en' && KIND_LINES_EN[k]) || KIND_LINES[k] || null;
    }
    /* 構図やプランなど、説明が要らない項目では喋らない（吹き出しはそのまま） */
    if (!newTx) return;
  }
  /* 押していないとき（言語切り替えなど）は雑談に戻す。
     通常納期のように常に成立している条件を拾うと、いつも同じ話になってしまうため */
  if (!newTx) newTx = getSeasonalMessage();

  if (changedEl) lastExplainAt = Date.now();
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
  /* 表示言語に合わせて出し分ける */
  const getTopMsg = () => tl(
    '₍ᐢ‥ᐢ₎ ♡ カーソルで私をトントンしたら最上部まで戻れるうさよ',
    '₍ᐢ‥ᐢ₎ ♡ Tap me with your cursor to jump back to the top!',
    '₍ᐢ‥ᐢ₎ ♡ Touchez-moi avec le curseur pour revenir tout en haut !'
  );
  let isAbove    = false;
  let intervalId = null;

  /* 吹き出しにポインターを乗せている間は切り替えない（読んでいる最中に消えないように） */
  let isHovering = false;
  ['mascot-bubble', 'chara-mascot'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('mouseenter', () => { isHovering = true; });
    el.addEventListener('mouseleave', () => { isHovering = false; });
  });

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
      setMsg(getTopMsg());
      intervalId = setInterval(() => {
        /* 読んでいる最中と、選択に対する説明が出ている間は切り替えない */
        if (isHovering) return;
        if (Date.now() - lastExplainAt < EXPLAIN_HOLD_MS) return;
        setMsg(Math.random() < 0.4 ? getTopMsg() : getSeasonalMessage());
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

/* === 相談するボタン === */
/* 押すとまず内容の確認モーダルを出し、コピーしたあとに窓口のポップアップを開く */
const consultBtn   = document.getElementById('sim-consult-btn');
const consultPopup = document.getElementById('sim-consult-popup');
function openConsultPopup() {
  if (!consultPopup) return;
  consultPopup.classList.add('is-open');
  consultPopup.setAttribute('aria-hidden', 'false');
}
function closeConsultPopup() {
  if (!consultPopup) return;
  consultPopup.classList.remove('is-open');
  consultPopup.setAttribute('aria-hidden', 'true');
}
/* ココナラとつなぐは日本語のみのサービスなので、日本語以外（英語・フランス語）では出さない */
function updateConsultItems() {
  const notJa = currentLang !== 'jp';
  document.querySelectorAll('.sim-consult-item[data-consult-lang]').forEach(el => {
    const t = el.dataset.consultLang;
    el.style.display = (t === 'both' || t === (notJa ? 'en' : 'ja')) ? '' : 'none';
  });
}
updateConsultItems();
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

/* 天気の取得は最後に開始する（画面の表示は待たせない） */
fetchWeather();

/* === 「この内容で相談する」 === */

/* レシートの表示をそのまま文章にする。
   計算をもう一度書くと表示とズレるおそれがあるので、描画済みのDOMから組み立てる */
function buildQuoteText() {
  const list = document.getElementById('breakdownList');
  if (!list) return '';
  const svc = {
    illust: tl('イラスト', 'Illustration', 'Illustration'),
    design: tl('デザイン', 'Design', 'Design'),
    video:  tl('ＭＶ制作', 'MV production', 'Production de MV'),
  };
  const out = [tl('【 ご依頼内容 】', '[ Request details ]', '[ Détails de la demande ]')];
  let pi = 0;
  /* 1点だけのときは点数の見出しが出ないので、サービス名を先に添える */
  if (pieces.length === 1) out.push('', svc[pieces[0].service] || '');
  list.querySelectorAll('.receipt-piece-head, .receipt-item, .receipt-total').forEach(el => {
    if (el.classList.contains('receipt-piece-head')) {
      const s = svc[(pieces[pi++] || {}).service] || '';
      out.push('', el.textContent.trim() + (s ? '　' + s : ''));
    } else if (el.classList.contains('receipt-total')) {
      out.push('',
        el.querySelector('.receipt-total-label').textContent.trim() + '　' +
        el.querySelector('.receipt-total-price').textContent.trim());
    } else {
      out.push('　' +
        el.querySelector('.receipt-item-name').textContent.trim() + '　' +
        el.querySelector('.receipt-item-price').textContent.trim());
    }
  });
  out.push('', tl(
    '※ 料金シミュレーターで作成しました',
    '* Created with the price simulator on yui-takasu.com',
    '* Créé avec le simulateur de tarifs sur yui-takasu.com'
  ));
  return out.join('\n');
}

/* クリップボードが使えない環境（http・古い端末）でも落ちないようにする */
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  return ok;
}
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}

function initConsultModal() {
  const btn    = document.getElementById('sim-consult-btn');
  const modal  = document.getElementById('quoteModal');
  const pre    = document.getElementById('quoteText');
  const copyBt = document.getElementById('quoteCopy');
  const cancel = document.getElementById('quoteCancel');
  if (!btn || !modal) return;

  const close = () => { modal.hidden = true; };
  btn.addEventListener('click', e => {
    e.stopPropagation();
    closeConsultPopup();
    pre.textContent = buildQuoteText();
    modal.hidden = false;
  });
  if (cancel) cancel.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  if (copyBt) copyBt.addEventListener('click', () => {
    const keep = copyBt.textContent;
    copyText(buildQuoteText()).then(ok => {
      copyBt.textContent = ok
        ? tl('コピーしました', 'Copied!', 'Copié !')
        : tl('コピーできませんでした', 'Could not copy', 'Échec de la copie');
      if (ok) {
        setTimeout(() => {
          copyBt.textContent = keep;
          close();
          updateConsultItems();
          openConsultPopup();
        }, 900);
      } else {
        setTimeout(() => { copyBt.textContent = keep; }, 2000);
      }
    });
  });
}
initConsultModal();
