  /* === 季節カラー（Designページ専用） === */
  const SEASONS = {
    spring: { months: [3,4,5],   bg:'#FFFFFF', works:'#F2F8F3', sidebar:'#C2E0CA', border:'#A8CCAF', accent:'#2D6E3E', btn:'#2D6E3E',
              cursor:'../assets/img/cursor/cursor-spring.png', effect:'sakura', bgJs:'../assets/js/spring-bg.js',
              colors:['#C2E0CA','#A8D4B4','#84B890','#B8DCCC','#D0EDD8'],
              logoFilter:'invert(32%) sepia(50%) saturate(500%) hue-rotate(100deg) brightness(0.82)',
              loaderBg:'#ECF7F0', ringColor:'#90A888',
              ringFilter:'invert(62%) sepia(20%) saturate(400%) hue-rotate(68deg) brightness(88%)' },
    summer: { months: [6,7,8],   bg:'#F4F9FF', works:'#FFFFFF', sidebar:'#B8D4F0', border:'#6A9ED0', accent:'#1A5FA0', btn:'#1A5FA0',
              cursor:'../assets/img/cursor/cursor-summer.png', effect:'summer',
              colors:['#B8D4F0','#78B0E0','#A0C8F0','#5090C8','#D0E8FC'],
              logoFilter:'invert(25%) sepia(60%) saturate(600%) hue-rotate(185deg) brightness(0.80)',
              loaderBg:'#D8EAF8', ringColor:'#88A8C0',
              ringFilter:'invert(62%) sepia(30%) saturate(400%) hue-rotate(180deg) brightness(85%)' },
    autumn: { months: [9,10,11], bg:'#FBF7F2', works:'#FFFFFF', sidebar:'#D8B898', border:'#B08060', accent:'#7A4830', btn:'#7A4830',
              cursor:'../assets/img/cursor/cursor-autumn.png', effect:'autumn',
              colors:['#C87828','#D49048','#B06028','#E8A058','#A84820'],
              logoFilter:'invert(28%) sepia(40%) saturate(500%) hue-rotate(10deg) brightness(0.78)',
              loaderBg:'#ECDCC8', ringColor:'#B08858',
              ringFilter:'invert(40%) sepia(50%) saturate(500%) hue-rotate(10deg) brightness(80%)' },
    winter: { months: [12,1,2],  bg:'#F8F8FC', works:'#FFFFFF', sidebar:'#CECEE0', border:'#9898B8', accent:'#3A3A6A', btn:'#3A3A6A',
              cursor:'../assets/img/cursor/cursor-winter.png', effect:'snow',
              colors:['#ffffff','#DCDCF0','#E8E8F8','#F4F4FC'],
              logoFilter:'invert(20%) sepia(30%) saturate(400%) hue-rotate(210deg) brightness(0.75)',
              loaderBg:'#DCDCE8', ringColor:'#A0A8BC',
              ringFilter:'invert(60%) sepia(20%) saturate(300%) hue-rotate(210deg) brightness(85%)' },
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
  root.style.setProperty('--color-loader-bg', season.loaderBg);
  root.style.setProperty('--color-ring',      season.ringColor);
  root.style.setProperty('--ring-filter',     season.ringFilter);

  /* === ローダー === */
  const loader = document.getElementById('loader');
  const loaderLogo = document.querySelector('.loader-logo');
  if (loaderLogo && season.logoFilter) loaderLogo.style.filter = season.logoFilter;
  setTimeout(() => {
    loader.classList.add('is-out');
    loader.addEventListener('transitionend', () => loader.classList.add('is-gone'), { once: true });
  }, 1900);


  /* === カスタムカーソル（丸） === */
  const cursorEl = document.getElementById('custom-cursor');

  document.addEventListener('mousemove', e => {
    cursorEl.style.left = e.clientX + 'px';
    cursorEl.style.top  = e.clientY + 'px';
  }, { passive: true });
  document.querySelectorAll('a, button, input, [role="button"]').forEach(el => {
    el.addEventListener('mouseenter', () => cursorEl.classList.add('is-large'));
    el.addEventListener('mouseleave', () => cursorEl.classList.remove('is-large'));
  });

  /* === 季節パーティクル === */
  const rand = (a, b) => Math.random() * (b - a) + a;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  const Particle = {
    init(opts) {
      const cv = document.createElement('canvas');
      Object.assign(cv.style, { position:'fixed', top:'0', left:'0', width:'100%', height:'100%', pointerEvents:'none', zIndex:'30' });
      document.body.appendChild(cv);
      this.cv = cv; this.ctx = cv.getContext('2d'); this.opts = opts;
      const resize = () => { cv.width = innerWidth; cv.height = innerHeight; };
      resize(); window.addEventListener('resize', resize);
      this.pts = Array.from({ length: opts.count }, () => this._new(true));
      this.run = true; this._loop();
      document.addEventListener('visibilitychange', () => {
        this.run = !document.hidden;
        if (this.run) this._loop();
      });
    },
    _new(first) {
      const o = this.opts;
      return { x: rand(0, innerWidth), y: first ? rand(-innerHeight, innerHeight) : rand(-40, -10),
               size: rand(o.min, o.max), color: pick(o.colors),
               vy: rand(0.5, 1.6), vx: rand(-0.4, 0.4),
               angle: rand(0, Math.PI * 2), as: rand(-0.025, 0.025), op: rand(0.45, 0.9) };
    },
    _loop() {
      if (!this.run) return;
      const { ctx, cv, opts } = this;
      ctx.clearRect(0, 0, cv.width, cv.height);
      this.pts.forEach(p => {
        p.y += p.vy; p.x += p.vx; p.angle += p.as;
        if (p.y > cv.height + 30 || p.x < -60 || p.x > cv.width + 60) Object.assign(p, this._new(false));
        ctx.save(); ctx.globalAlpha = p.op; ctx.translate(p.x, p.y); ctx.rotate(p.angle);
        opts.draw(ctx, p); ctx.restore();
      });
      requestAnimationFrame(() => this._loop());
    },
    stop() {
      this.run = false;
      if (this.cv) { this.cv.remove(); this.cv = null; }
    }
  };

  if (season.effect === 'autumn') {
    Particle.init({ count: 16, colors: season.colors, min: 4, max: 9,
      draw(ctx, p) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo( p.size*0.8, -p.size*0.5,  p.size*0.9,  p.size*0.3, 0,  p.size);
        ctx.bezierCurveTo(-p.size*0.9,  p.size*0.3, -p.size*0.8, -p.size*0.5, 0, -p.size);
        ctx.fill();
      }
    });
  } else if (season.effect === 'snow') {
    Particle.init({ count: 28, colors: season.colors, min: 2, max: 5,
      draw(ctx, p) {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
      }
    });
  }

  /* === 背景マネージャー === */
  const bgVideo       = document.getElementById('bg');
  const bgSummerVideo = document.getElementById('bg-summer-vid');
  const BgMgr = {
    _stop() {
      bgVideo.pause();       bgVideo.style.display       = 'none';
      bgSummerVideo.pause(); bgSummerVideo.style.display = 'none';
      if (window.AutumnBg) AutumnBg.stop();
      if (window.WinterBg) WinterBg.stop();
    },

    start(key) {
      this._stop();
      if (key === 'spring') {
        bgVideo.style.display = '';
        bgVideo.play().catch(() => {});
      } else if (key === 'summer') {
        bgSummerVideo.style.display = '';
        bgSummerVideo.play().catch(() => {});
      } else if (key === 'autumn' && window.AutumnBg) {
        AutumnBg.start();
      } else if (key === 'winter' && window.WinterBg) {
        WinterBg.start();
      }
    },
  };

  /* === 季節切り替えスイッチャー === */
  function switchSeason(key) {
    const s = SEASONS[key];
    if (!s) return;

    /* CSS カスタムプロパティ更新 */
    root.style.setProperty('--color-bg',      s.bg);
    root.style.setProperty('--color-works',   s.works);
    root.style.setProperty('--color-sidebar', s.sidebar);
    root.style.setProperty('--color-border',  s.border);
    root.style.setProperty('--color-accent',  s.accent);
    root.style.setProperty('--color-btn',     s.btn);
    root.style.setProperty('--color-ring',    s.ringColor);
    root.style.setProperty('--ring-filter',   s.ringFilter);

    /* 背景切り替え */
    BgMgr.start(key);

    /* 既存パーティクル停止 */
    if (Particle.cv) Particle.stop();

    /* 新しいパーティクル開始（spring は現在パーティクルなし） */
    if (s.effect === 'autumn') {
      Particle.init({ count: 16, colors: s.colors, min: 4, max: 9,
        draw(ctx, p) {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.bezierCurveTo( p.size*0.8, -p.size*0.5,  p.size*0.9,  p.size*0.3, 0,  p.size);
          ctx.bezierCurveTo(-p.size*0.9,  p.size*0.3, -p.size*0.8, -p.size*0.5, 0, -p.size);
          ctx.fill();
        }
      });
    } else if (s.effect === 'snow') {
      Particle.init({ count: 28, colors: s.colors, min: 2, max: 5,
        draw(ctx, p) {
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
        }
      });
    }

    /* ボタンのアクティブ状態更新 */
    document.querySelectorAll('.season-btn').forEach(b =>
      b.classList.toggle('is-active', b.dataset.season === key)
    );
  }

  /* 季節切り替えボタンは季節テーマを手で上書きするための動作確認用。
     公開サイトには出さず、ローカルで開いたときだけ使えるようにする。
     （季節そのものは下の currentSeasonKey が月から自動で判定するので、
       ボタンが無くてもテーマの切り替わりには影響しない）
     HTML側は hidden を付けた状態にしてあるので、公開環境では一瞬も表示されない。 */
  const isLocalPreview = location.hostname === 'localhost'
                      || location.hostname === '127.0.0.1'
                      || location.hostname === ''
                      || location.protocol === 'file:';
  const seasonSwitch = document.querySelector('.season-switch');
  if (seasonSwitch) {
    if (isLocalPreview) seasonSwitch.removeAttribute('hidden');
    else seasonSwitch.remove();
  }

  /* 季節ボタンのクリックイベント */
  document.querySelectorAll('.season-btn').forEach(btn => {
    btn.addEventListener('click', () => switchSeason(btn.dataset.season));
  });

  /* 現在の季節ボタンをアクティブにし、背景を初期化 */
  const currentSeasonKey = Object.keys(SEASONS).find(k => SEASONS[k].months.includes(month)) || 'spring';
  document.querySelectorAll('.season-btn').forEach(b =>
    b.classList.toggle('is-active', b.dataset.season === currentSeasonKey)
  );
  /* 春以外はmp4ビデオを非表示にして対応背景を起動 */
  if (currentSeasonKey !== 'spring') BgMgr.start(currentSeasonKey);

  /* === JP/EN 切り替え === */
  let currentLang = 'ja';
  let currentModalKey = null;
  let currentSidebarKey = null;

  function pickText(data, field) {
    const suffix = currentLang === 'fr' ? 'Fr' : currentLang === 'en' ? 'En' : '';
    return (suffix && data[field + suffix]) || data[field] || '';
  }

  /* alt・aria-label・title のように、テキストではなく属性なので
     langblockやdata-jaでは切り替えられないものを言語ごとに差し替える
     画面には出ないが、読み上げソフトや画像が表示できないときに読まれるため、
     日本語のままにせず3言語そろえる
       data-alt-ja  / data-alt-en  / data-alt-fr   → alt
       data-aria-ja / data-aria-en / data-aria-fr  → aria-label
       data-tip-ja  / data-tip-en  / data-tip-fr   → title（マウスを乗せたときの吹き出し）
     ※ data-set のギャラリー画像は render() が data-set の alt を入れるため、
        そちらには data-alt-* を付けないこと（付けると送り替えても固定されてしまう） */
  function applyLangAttrs(root, modalLang) {
    const pick = (ds, key) =>
      modalLang === 'jp' ? ds[key + 'Ja']
    : modalLang === 'fr' ? (ds[key + 'Fr'] || ds[key + 'En'] || ds[key + 'Ja'])
    : (ds[key + 'En'] || ds[key + 'Ja']);

    const swap = (attrSel, dsKey, attrName) => {
      root.querySelectorAll(attrSel).forEach(el => {
        const v = pick(el.dataset, dsKey);
        if (v) el.setAttribute(attrName, v);
      });
    };
    swap('[data-alt-ja]', 'alt', 'alt');
    swap('[data-aria-ja]', 'aria', 'aria-label');
    swap('[data-tip-ja]', 'tip', 'title');
  }

  const I18N = {
    ja: { title: 'Works', contactLabel: 'ご依頼・ご相談はお気軽にどうぞ', catch: 'ユーザー視点と意思決定を軸に、<br>期待を超えるデザインを。', hint: 'カードにカーソルを当てると作品を確認できます' },
    en: { title: 'Works', contactLabel: 'Feel free to reach out for any project.', catch: 'Exceeding client expectations<br>with user-centric,<br>decision-focused design.', hint: 'hover a card to preview' },
    fr: { title: 'Works', contactLabel: "N'hésitez pas à me contacter pour tout projet.", catch: "Dépasser les attentes des clients<br>grâce à un design centré sur l'utilisateur<br>et axé sur la prise de décision.", hint: 'survolez une carte pour prévisualiser' },
  };

  function applyLang(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (I18N[lang][key] !== undefined) el.innerHTML = I18N[lang][key];
    });
    /* ページ全体の alt・aria-label・title も切り替える（ヘッダーやボタン類） */
    applyLangAttrs(document, lang === 'ja' ? 'jp' : lang);
    document.querySelectorAll('[data-ja]').forEach(el => {
      el.textContent = lang === 'ja' ? el.dataset.ja
                      : lang === 'fr' ? (el.dataset.fr || el.dataset.en)
                      : el.dataset.en;
    });
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.lang === lang);
    });

    /* モーダルが開いているときはlangblockも切り替え */
    const modalEl = document.getElementById('work-modal');
    if (modalEl && modalEl.classList.contains('is-open')) {
      const bodyEl = document.getElementById('modal-body');
      const modalLang = lang === 'ja' ? 'jp' : lang;
      bodyEl.querySelectorAll('[data-langblock]').forEach(block => {
        block.hidden = (block.dataset.langblock !== modalLang);
      });
      applyLangAttrs(bodyEl, modalLang);
      bodyEl.querySelectorAll('.mwork__langbtn').forEach(btn => {
        const active = btn.dataset.lang === modalLang;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      if (currentModalKey && MODAL_DATA[currentModalKey]) {
        const data = MODAL_DATA[currentModalKey];
        const titleEl = document.getElementById('modal-title');
        if (titleEl) titleEl.textContent = pickText(data, 'title');
        const subtitleEl = document.getElementById('modal-subtitle');
        if (subtitleEl) subtitleEl.textContent = pickText(data, 'subtitle');
      }

      bodyEl.querySelectorAll('.modal__figure[data-set]').forEach(figure => {
        if (typeof figure.__galleryRender === 'function') {
          figure.__galleryRender(Number(figure.dataset.curIdx || 0));
        }
      });
    }

    /* サイドバー詳細パネル表示中も言語を反映 */
    const sidebarDetailEl = document.getElementById('sidebar-detail');
    if (sidebarDetailEl && sidebarDetailEl.classList.contains('is-visible') && currentSidebarKey && MODAL_DATA[currentSidebarKey]) {
      const data = MODAL_DATA[currentSidebarKey];
      document.getElementById('detail-title').textContent = pickText(data, 'title');
      document.getElementById('detail-scope').textContent = pickText(data, 'subtitle');
      document.getElementById('detail-desc').textContent = extractLead(data.html || '');
    }
  }

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
  });
  applyLang('ja');

  /* === フィルター === */
  let currentFilter = 'all';

  function applyFilter(cat) {
    currentFilter = cat;
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.filter === cat);
    });
    document.querySelectorAll('.work-card').forEach(card => {
      const match = cat === 'all' || card.dataset.cat === cat;
      card.style.display = match ? '' : 'none';
    });
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
  });

  /* === モーダルデータ（旧HP準拠） === */
  const MODAL_DATA = {
    yori_salon: {
      title: 'Yori｜Private Salon LP Concept',
      titleEn: 'Private Salon Yori — LP Design & Frontend',
      scope: 'LP Design / UI Design / Frontend (HTML・CSS・JavaScript) / Concept Work',
      tags: ['Web Design', 'UI Design', 'Concept Work', 'In Progress'],
      img: '../images/works/web/original/yori-salon/mock_pc.webp',
      roleJa: 'デザイン設計・LP構成・ビジュアルデザイン・HTML/CSS/JavaScript実装・Adobe Firefly画像生成',
      roleEn: 'Design concept / LP structure / Visual design / HTML・CSS・JS / Adobe Firefly image generation',
      descJa: `<p class="desc-lead">住宅街にあるプライベートサロン「Yori」を想定したコンセプトLP制作。<br><br>「静かに、整える時間。」をキーワードに、通いやすさ・安心感・やわらかな上質感が伝わる世界観を設計しました。過度な装飾や強い訴求を避け、余白と情報階層で落ち着いた体験をつくることを重視しています。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>"通う場所"としての安心感を、やわらかな配色・余白・文字密度で設計</li><li>ナビゲーションは必要最小限に整理し、迷わず目的情報へ到達できる導線に</li><li>About → Menu → 施術の流れ → News → Access の順で、不安を解消する情報設計</li><li>レスポンシブ実装を前提に、FVの装飾要素や文字サイズが崩れないよう調整</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>要件整理</strong>：サロン利用時の不安（料金・施術内容・場所・流れ）を洗い出し</li><li><strong>構成設計</strong>：世界観提示→安心材料→予約判断のための情報提示へ段階設計</li><li><strong>UI設計</strong>：余白・整列・写真トーンを揃え、落ち着いた読後感を構築</li><li><strong>実装想定</strong>：SPでの可読性、表（Menu）や地図（Access）の崩れを想定して設計</li></ol><div class="desc-note"><dl><dt>使用ツール</dt><dd>Figma / Photoshop</dd><dt>制作範囲</dt><dd>LP構成 / UIデザイン / レスポンシブ設計（デザイン）</dd></dl></div><p class="desc-related">※本サロンを想定し、LPの世界観を継承した予約フォームUIを別作品として設計しています（予約フロー・状態設計まで想定）。</p></div>`,
      descEn: `<div class="desc-section"><h3>Design Focus</h3><ul><li>Designed a warm and calming tone through soft colors, spacing, and restrained typography</li><li>Kept navigation minimal so users can reach key information without hesitation</li><li>Structured content to reduce anxiety: About → Menu → Flow → News → Access</li><li>Planned layouts with responsiveness and feasibility in mind, especially for decorative hero elements</li></ul></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Brief Definition</strong>: Identified common concerns (pricing, service details, location, procedure)</li><li><strong>Structure Planning</strong>: Designed a gradual flow from atmosphere to reassurance and decision-making</li><li><strong>UI Design</strong>: Unified spacing, alignment, and photo tone for a calm reading experience</li><li><strong>Implementation Planning</strong>: Considered responsive risks for tables (menu) and map blocks (access)</li></ol><div class="desc-note"><dl><dt>Tools</dt><dd>Figma / Photoshop</dd><dt>Scope</dt><dd>LP structure / UI design / Responsive layout planning</dd></dl></div><p class="desc-related">A reservation form UI was also designed as a separate work, inheriting the visual tone of this LP (including reservation flow and UI state design).</p></div>`,
      link: 'https://mitty976.github.io/Private-salon-yori/',
      linkLabel: 'View Site →',
    },
    yori_reservation: {
      titleJa: 'Yori｜予約フォーム UI設計',
      titleEn: 'Yori Reservation — UI Design',
      scope: 'UI Design / UX / Flow Design（PC・SP）',
      tags: ['UI Design', 'UX', 'Flow Design（PC・SP）', 'In Progress'],
      img: '../images/works/web/original/yori-reservation/overview.webp',
      roleJa: 'ステップ式予約フローのUI設計・PC/スマホ対応レイアウト設計',
      roleEn: 'Step-by-step reservation flow UI / PC and mobile layout design',
      descJa: `<p class="desc-lead">プライベートサロン「Yori」を想定し、LPと同一トーンで予約フォームUIを設計しました。<br><br>メニュー選択 → 日時選択 → お客様情報入力 → 内容確認・送信の4ステップで構成し、"迷いにくさ"と"落ち着いた体験"の両立を重視しています。実装を想定し、ボタンの活性/非活性、選択状態、確認画面の情報整理まで状態設計を行いました。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>ステップを分割し、選択の負荷を小さく（メニュー→日時→情報入力→確認）</li><li>「次へ」ボタンは条件を満たすまで非活性にし、誤操作を抑制</li><li>選択状態（ラジオ/チェック/選択中）を一貫したトーンで表現</li><li>確認画面は"変更箇所に戻れる"導線を用意し、送信前の不安を軽減</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>要件整理</strong>：予約時の迷い（料金、所要時間、空き状況、入力負荷）を整理</li><li><strong>フロー設計</strong>：4ステップに分割し、判断→入力→確認の順で負担を分散</li><li><strong>UI設計</strong>：LPと同トーンの配色/余白/角丸/文字密度に統一</li><li><strong>状態設計</strong>：活性/非活性、選択中、エラー想定（注意文）を考慮</li></ol><div class="desc-note"><dl><dt>使用ツール</dt><dd>Figma / Photoshop</dd><dt>制作範囲</dt><dd>予約フロー設計 / UIデザイン（PC・SP）/ 状態設計</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Design Focus</h3><ul><li>Reduced cognitive load by splitting the flow into 4 clear steps</li><li>Used disabled/active states for the "Next" button to prevent errors</li><li>Kept selection states consistent across radio/checkbox components</li><li>Designed the review screen with easy "edit" routes to reduce anxiety before submission</li></ul></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Requirements</strong>: Organized user concerns (pricing, duration, availability, input effort)</li><li><strong>Flow Design</strong>: Structured into 4 steps to distribute decisions and input</li><li><strong>UI Design</strong>: Matched the LP's calm tone via spacing, palette, and typography</li><li><strong>State Planning</strong>: Considered active/disabled, selected, and validation messaging</li></ol><div class="desc-note"><dl><dt>Tools</dt><dd>Figma / Photoshop</dd><dt>Scope</dt><dd>Reservation flow / UI design (PC &amp; SP) / State planning</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    lumiere: {
      titleJa: 'LUMIÈRE｜スキンケア LP',
      titleEn: 'LUMIÈRE — Skincare LP Design',
      scope: 'LP Design / UI Design / Concept Work',
      tags: ['Web Design', 'UI Design', 'Concept Work'],
      img: '../images/works/web/original/lumiere/mock_pc.webp',
      roleJa: 'コンセプト設計・ビジュアルデザイン・LP構成',
      roleEn: 'Concept planning / Visual design / LP structure',
      descJa: `<p class="desc-lead">敏感肌・乾燥肌の方に向けた、低刺激スキンケアブランド「LUMIÈRE」のコンセプトLP制作。<br><br>「静かに、続くケア。」を軸に、肌へのやさしさと上質感が両立する世界観を設計しました。情報を詰め込みすぎず、余白・トーン・階層設計によって安心感を伝えることを重視しています。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>敏感肌向けに必要な「安心感」を、余白設計・トーン統一・コピーの抑制で表現</li><li>清潔感と上質感の両立を目的に、明度の高い配色と柔らかな質感（布・光）を採用</li><li>情報は「思想 → 根拠（成分/約束） → 悩み別提案 → ラインナップ」の順で段階的に提示</li><li>レスポンシブ実装を前提に、SPでは要素の優先順位と情報密度が破綻しないよう調整</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>要件整理</strong>：敏感肌層が重視する不安要素（刺激・継続性・信頼）を整理</li><li><strong>構成設計</strong>：コンセプトで共感を作り、次に根拠提示で安心感を補強</li><li><strong>UI設計</strong>：余白・整列・文字サイズの抑制で、やさしい読後感を設計</li><li><strong>実装想定</strong>：レスポンシブ時の崩れやすいブロック（図解/カード/表）を想定して配置調整</li></ol><div class="desc-note"><dl><dt>使用ツール</dt><dd>Figma / Photoshop</dd><dt>制作範囲</dt><dd>LP構成 / UIデザイン / レスポンシブ設計（デザイン）</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Design Focus</h3><ul><li>Expressed trust and gentleness through spacing, restrained copy, and consistent tone</li><li>Balanced cleanliness and premium feel using high-key colors and soft textures (light, fabric)</li><li>Structured content progressively: concept → proof (ingredients/promises) → concerns → lineup</li><li>Planned layouts with responsive behavior in mind, especially for information density on mobile</li></ul></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Brief Definition</strong>: Identified key anxieties for sensitive-skin users (irritation, continuity, trust)</li><li><strong>Structure Planning</strong>: Built empathy with concept, then reinforced reassurance with evidence</li><li><strong>UI Design</strong>: Designed a gentle reading experience through spacing, alignment, and typography</li><li><strong>Implementation Planning</strong>: Adjusted layout considering responsive risks (cards, diagrams, tables)</li></ol><div class="desc-note"><dl><dt>Tools</dt><dd>Figma / Photoshop</dd><dt>Scope</dt><dd>LP structure / UI design / Responsive layout planning</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    still_air: {
      titleJa: 'STILL AIR｜お香ブランド LP',
      titleEn: 'STILL AIR — Incense Brand LP Design',
      scope: 'LP Design / UI Design / Concept Work',
      tags: ['Web Design', 'UI Design', 'Concept Work'],
      img: '../images/works/web/original/still-air/mock_pc.webp',
      roleJa: 'コンセプト設計・ビジュアルデザイン・LP構成',
      roleEn: 'Concept planning / Visual design / LP structure',
      descJa: `<p class="desc-lead">思考や作業に集中する時間を大切にする人に向けた、お香ブランド「STILL AIR」のコンセプトLP制作。<br><br>香りを"気分を高める演出"ではなく、空間と思考を静かに整えるための環境要素として再定義し、実装を想定した情報設計と余白設計を軸に世界観を構築しました。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>余白・行間・色数を抑え、思考を妨げない静かなトーンを設計</li><li>FVでは購買訴求を行わず、世界観への没入を最優先</li><li>縦書きコピーと煙のモチーフで「時間の流れ」を視覚化</li><li>レスポンシブ実装を前提に、画面幅ごとに情報密度を調整</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>コンセプト設計</strong>：香りの役割を「集中を整える環境要素」として再定義</li><li><strong>構成設計</strong>：FV→思想提示→シーン提案→クロージングの時間軸構成</li><li><strong>UI設計</strong>：スクロール体験と情報開示順を意識したレイアウト設計</li><li><strong>実装想定</strong>：レスポンシブ対応・演出の実現性を考慮してデザインを調整</li></ol><div class="desc-note"><dl><dt>使用ツール</dt><dd>Figma / Photoshop</dd><dt>制作範囲</dt><dd>LP構成 / UIデザイン / レスポンシブ設計（デザイン）</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Design Focus</h3><ul><li>Designed a calm visual tone using generous spacing and restrained color palette</li><li>Prioritized immersion into the brand world by avoiding direct sales messaging in the hero section</li><li>Visualized the passage of time through vertical typography and smoke motifs</li><li>Planned layouts with responsiveness and implementation feasibility in mind</li></ul></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Concept Definition</strong>: Redefined incense as an environmental element for mental focus</li><li><strong>Structure Planning</strong>: Designed a time-based flow from concept to usage scenes</li><li><strong>UI Design</strong>: Planned layouts focusing on scroll experience and information hierarchy</li><li><strong>Implementation Planning</strong>: Considered responsive behavior and motion feasibility</li></ol><div class="desc-note"><dl><dt>Tools</dt><dd>Figma / Photoshop</dd><dt>Scope</dt><dd>LP structure / UI design / Responsive layout planning</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    uru_hada: {
      titleJa: '潤肌（URU-HADA）導入美容液',
      titleEn: 'URU-HADA — Skincare Serum Concept',
      scope: 'Concept Work / Sensory Branding / Graphic Design',
      tags: ['Concept Work', 'Emotion', 'Sensory Branding'],
      img: '../images/works/design/uru-hada.webp',
      roleJa: 'コンセプト設計・ビジュアルデザイン・グラフィック制作',
      roleEn: 'Concept design / Visual design / Graphic production',
      descJa: `<p class="desc-lead">仕事や生活の忙しさから、肌の変化が気になり始める20代後半〜30代女性を想定した導入美容液ブランドのコンセプトワーク。<br><br>「10年後の肌に、今日のご褒美を。」を軸に、透明感と上質感を大切にしたビジュアル設計を行いました。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>透明感・清潔感・オーガニック感を軸に、自分のために選びたくなる上質なトーンを設計</li><li>余白を活かし、視線を「ビジュアル → コピー → ロゴ」へ自然に誘導</li><li>サイズ違いでも印象が崩れないよう、情報量と配置のバランスを調整</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>要件整理</strong>：ターゲットの生活背景とセルフギフトの訴求軸を整理</li><li><strong>構成設計</strong>：視線誘導と情報密度を調整し、情緒が伝わる構成に設計</li><li><strong>ビジュアル設計</strong>：透明感と上質感を両立するトーンを統一</li><li><strong>仕上げ</strong>：余白・整列・可読性のバランスを最終調整</li></ol><div class="desc-note"><dl><dt>使用ツール</dt><dd>Illustrator / Photoshop</dd><dt>制作範囲</dt><dd>ロゴ / Web広告バナー（1200x628、300x250）</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Design Focus</h3><ul><li>Established a refined tone centered on clarity, cleanliness, and organic sensibility</li><li>Used generous spacing to guide attention from visual to copy and logo naturally</li><li>Balanced information density to maintain a consistent impression across multiple sizes</li></ul></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Brief Definition</strong>: Analyzed lifestyle context and self-gifting motivation of the target audience</li><li><strong>Layout Planning</strong>: Designed visual flow and information density to convey emotional value</li><li><strong>Visual Design</strong>: Unified tone to balance transparency with a sense of premium quality</li><li><strong>Refinement</strong>: Adjusted spacing, alignment, and readability for final polish</li></ol><div class="desc-note"><dl><dt>Tools</dt><dd>Illustrator / Photoshop</dd><dt>Scope</dt><dd>Logo / Web advertising banners (1200x628, 300x250)</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    business_statistics: {
      titleJa: 'ビジネス統計学（Online Course）',
      titleEn: 'Business Statistics — Online Course',
      scope: 'Concept Work / Information Design / Graphic Design',
      tags: ['Concept Work', 'Logic', 'Information Design'],
      img: '../images/works/design/business-statistics.webp',
      roleJa: 'コンセプト設計・情報設計・ビジュアルデザイン',
      roleEn: 'Concept planning / Information design / Visual design',
      descJa: `<p class="desc-lead">統計やデータ分析に苦手意識を持つビジネスパーソン向けに、「難しそう」という心理的ハードルを下げつつ、損なわないトーンで設計したオンライン講座のロゴ・広告デザイン。<br><br>Web広告 / SNS投稿など用途に応じたサイズ展開でも、情報の伝わり方が崩れない構成を意識しました。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>「難しそう」を感じさせないため、要素を整理し<strong>視認性の高い情報設計</strong>に統一</li><li>堅くなりすぎない余白と図版モチーフで、<strong>親しみやすさと信頼感</strong>のバランスを調整</li><li>用途別サイズでも破綻しないよう、<strong>見出し・補足・CTAの優先順位</strong>を固定して展開</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>要件整理</strong>：ターゲットの心理的ハードルと、媒体（Web / SNS）での見え方を整理</li><li><strong>構成設計</strong>：コピー階層と視線誘導を設計し、短時間で内容が伝わる情報密度に調整</li><li><strong>ロゴ設計</strong>：講座の信頼性を担保しつつ、硬すぎない印象のシンボル・字組みに整える</li><li><strong>展開・仕上げ</strong>：728×90 / 1080×1080へ最適化し、整列・余白・可読性を最終調整</li></ol><div class="desc-note"><dl><dt>使用ツール</dt><dd>Illustrator / Photoshop</dd><dt>制作範囲</dt><dd>ロゴ / Web広告バナー（728x90、1080x1080）</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Design Focus</h3><ul><li>Simplified visual structure to reduce the perceived difficulty of statistics and data analysis</li><li>Balanced approachability and credibility through controlled spacing and diagram-inspired motifs</li><li>Fixed hierarchy between headline, supporting text, and call-to-action to ensure consistency across formats</li></ul></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Brief Definition</strong>: Identified psychological barriers and platform-specific viewing conditions (Web / SNS)</li><li><strong>Layout Planning</strong>: Designed copy hierarchy and visual flow for quick comprehension</li><li><strong>Logo Design</strong>: Developed a symbol and typography that feel trustworthy without appearing overly academic</li><li><strong>Adaptation &amp; Refinement</strong>: Optimized layouts for 728×90 and 1080×1080, adjusting spacing and readability</li></ol><div class="desc-note"><dl><dt>Tools</dt><dd>Illustrator / Photoshop</dd><dt>Scope</dt><dd>Logo / Web advertising banners (728x90, 1080x1080)</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    pizzavita: {
      titleJa: 'PIZZA VITA',
      titleEn: 'PIZZA VITA — Promotion Design',
      scope: 'Concept Work / Promotion Design / Graphic Design',
      tags: ['Concept Work', 'Action', 'Promotion Design'],
      img: '../images/works/design/pizzavita.webp',
      roleJa: 'コンセプト設計・ビジュアルデザイン・バナー・ロゴデザイン',
      roleEn: 'Concept planning / Visual design / Banner / Logo design',
      descJa: `<p class="desc-lead">週末の食卓に、少し特別な時間を。本格窯焼きピザのデリバリーサービス「PIZZA VITA」を想定した広告ビジュアル。<br><br>チーズの伸びや湯気といったシズル感を軸に、食欲を喚起する暖色トーンで構成し、視線が自然にCTAへ流れるレイアウトを設計しました。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>"焼きたて感"が伝わるよう、チーズの伸び・湯気の流れを主役にして食欲喚起を強化</li><li>暖色トーンで統一しつつ、文字は高コントラストにして可読性と勢いを両立</li><li>キャッチ → シズル → CTAの順に視線が落ちるよう、要素サイズと配置のリズムを設計</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>目的整理</strong>：週末の"ちょい特別"を、直感的に伝える訴求軸を設定</li><li><strong>要素設計</strong>：キャッチ・シズル・CTAの優先順位を決め、最短で伝わる構図に構成</li><li><strong>トーン調整</strong>：暖色ベースで食欲を刺激し、湯気や光の演出で温度感を付与</li><li><strong>サイズ展開</strong>：1200x628 / 728x90 / 336x280 で視認性が崩れないよう再配置</li></ol><div class="desc-note"><dl><dt>使用ツール</dt><dd>Illustrator / Photoshop</dd><dt>制作範囲</dt><dd>ロゴ / Web広告バナー（1200x628、728x90、336x280）</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Design Focus</h3><ul><li>Emphasized a freshly baked feel through stretchy cheese and rising steam to stimulate appetite</li><li>Unified warm color tones while maintaining high text contrast for clarity and energy</li><li>Designed visual rhythm to guide attention from headline to sizzle imagery and finally to the call to action</li></ul></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Concept Definition</strong>: Defined the appeal of a small weekend indulgence as the core message</li><li><strong>Element Planning</strong>: Prioritized headline, sizzle visuals, and CTA for instant comprehension</li><li><strong>Tone Adjustment</strong>: Used warm tones and light effects to convey heat and freshness</li><li><strong>Multi-size Adaptation</strong>: Reorganized layouts to maintain readability across multiple banner formats</li></ol><div class="desc-note"><dl><dt>Tools</dt><dd>Illustrator / Photoshop</dd><dt>Scope</dt><dd>Logo / Web advertising banners (1200x628, 728x90, 336x280)</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    v_couture: {
      titleJa: 'V-COUTURE',
      titleEn: 'V-COUTURE — Branding & Identity',
      scope: 'Branding & Identity / Logo Design / Business Card',
      tags: ['Branding & Identity', 'Logo・Business Card'],
      img: '../images/works/design/v-couture.webp',
      roleJa: 'ロゴデザイン・名刺（表裏）デザイン・ブランドカラー設定・印刷入稿',
      roleEn: 'Logo design / Business card (front & back) / Brand color / Print-ready',
      descJa: `<p class="desc-lead">メタバース空間で活動するアバター・スタイリストを想定し、「デジタルの自分を、もっと自由に」をコンセプトにロゴおよび名刺デザインを制作しました。<br><br>画面上での見え方も意識し、未来感と上品さのバランスを整えています。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>頭文字の"V"をVネックのようなシャープなラインで構成し、人物を用いずに「スタイリング」を象徴</li><li>ミニマルなグリッド表現と手書きロゴタイプを組み合わせ、デジタル×感性の両立を設計</li><li>SNS導線（X / Discord）とQRを整理し、画面上でも読み取りやすい情報優先順位に調整</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>要件整理</strong>：ターゲット（VTuber / メタバースユーザー）と必須要素（屋号・SNS・QR）を定義</li><li><strong>ロゴ設計</strong>："V"の造形を衣服のラインに接続し、職能が伝わるシンボルへ抽象化</li><li><strong>名刺設計</strong>：グリッドとグラデーションで世界観を構築し、表裏で役割（印象/情報）を分担</li><li><strong>仕上げ</strong>：画面表示を想定して可読性を検証し、余白・整列・コントラストを最終調整</li></ol><div class="desc-note"><dl><dt>制作範囲</dt><dd>ロゴ / 名刺（表・裏）/ モックアップ</dd><dt>想定要素</dt><dd>屋号 / 氏名（LUNA）/ X・Discord / ポートフォリオサイト / QR</dd><dt>使用ツール</dt><dd>Illustrator / Photoshop</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Design Focus</h3><ul><li>Abstracted the initial "V" into a sharp, V-neck-inspired form to symbolize styling without using a human figure</li><li>Combined a minimal grid language with a handwritten logotype to balance digital precision and sensibility</li><li>Organized social links (X / Discord) and QR for strong on-screen readability and practical use</li></ul></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Brief Definition</strong>: Defined target users and required elements (brand, socials, QR, website)</li><li><strong>Logo Design</strong>: Built the "V" as an abstract clothing silhouette to express the profession of styling</li><li><strong>Card Design</strong>: Developed a futuristic yet refined mood and split roles across front/back sides</li><li><strong>Refinement</strong>: Tested on-screen legibility and finalized spacing, alignment, and contrast</li></ol><div class="desc-note"><dl><dt>Scope</dt><dd>Logo / Business card (front &amp; back) / Mockup</dd><dt>Assumed Elements</dt><dd>Brand name / Name (LUNA) / X·Discord / Portfolio link / QR</dd><dt>Tools</dt><dd>Illustrator / Photoshop</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    kamosu: {
      titleJa: '醸す（KAMOSU）',
      titleEn: 'KAMOSU — Business Card Design',
      scope: 'Business Card Design',
      tags: ['Business Card Design'],
      img: '../images/works/design/kamosu.webp',
      roleJa: 'ロゴデザイン・名刺（表裏）デザイン・印刷入稿',
      roleEn: 'Logo design / Business card (front & back) / Print-ready',
      descJa: `<p class="desc-lead">予約困難な隠れ家「発酵」モダン・ビストロを想定し、「微生物との対話」をコンセプトに名刺デザインを制作。<br><br>余白・和紙の質感・墨のにじみを軸に、静かで凛とした佇まいと、格式と現代性のバランスを設計しました。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>余白を大きく確保し、言葉よりも空気感が先に届く「静かな品格」を設計</li><li>和紙テクスチャと墨のにじみで、"時間・変化・深み"を象徴するトーンに統一</li><li>裏面に伝統文様を控えめに配置し、格式と現代性のバランスを調整</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>要件整理</strong>：ターゲット（美食家・富裕層）と必須要素（店名・氏名・連絡先）を定義</li><li><strong>トーン設計</strong>：和紙・墨・縦組の要素を整理し、和モダン・ラグジュアリーの方向性を確定</li><li><strong>レイアウト設計</strong>：表裏で役割（印象/情報）を分担し、視線の止まる位置を調整</li><li><strong>仕上げ</strong>：余白・整列・文字組を最終調整し、静けさと可読性を両立</li></ol><div class="desc-note"><dl><dt>制作範囲</dt><dd>名刺（縦型・表／裏）/ モックアップ</dd><dt>必須要素</dt><dd>店名 / 氏名（シェフ 佐藤 匠）/ 電話番号 / Instagram</dd><dt>使用ツール</dt><dd>Illustrator / Photoshop</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Design Focus</h3><ul><li>Used generous negative space to communicate quiet prestige before any detailed reading</li><li>Unified tone with washi-like texture and ink-bleed expression to suggest time, depth, and transformation</li><li>Placed a subtle traditional pattern on the back side to balance heritage and modern refinement</li></ul></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Brief Definition</strong>: Defined target audience and required information for a chef's business card</li><li><strong>Tone Setting</strong>: Established a modern-luxury Japanese direction using paper texture and ink nuance</li><li><strong>Layout Planning</strong>: Split roles across front/back and refined the visual hierarchy</li><li><strong>Refinement</strong>: Finalized spacing, alignment, and typography for calm readability</li></ol><div class="desc-note"><dl><dt>Scope</dt><dd>Logo / Business card (vertical, front &amp; back) / Mockup</dd><dt>Required Elements</dt><dd>Restaurant name / Chef name / Phone / Instagram</dd><dt>Tools</dt><dd>Illustrator / Photoshop</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    aoi_architects: {
      titleJa: 'AOI Architects',
      titleEn: 'AOI Architects — Logo & Business Card',
      scope: 'Logo & Business Card Design / Concept Study',
      tags: ['Logo & Business Card Design', 'Concept Study'],
      img: '../images/works/design/aoi-architects.webp',
      roleJa: 'ロゴデザイン・名刺（表裏）デザイン・ブランドカラー設定・印刷入稿',
      roleEn: 'Logo design / Business card (front & back) / Brand color / Print-ready',
      descJa: `<p class="desc-lead">次世代型サステナブル建築事務所を想定したロゴ・名刺デザイン。「100年後の風景をつくる」という理念を軸に、誠実なトーンを設計しました。<br><br>紙ポートフォリオの全体トーンには採用せずお蔵入りとなった案ですが、Webでは試作の幅として掲載しています。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>屋根や構造線を想起させるミニマルなラインで、建築的な造形を抽象化</li><li>余白と単色設計を軸に、信頼感・誠実さが先に届く情報トーンに調整</li><li>紙質を主役にできる前提で、再生紙・バガス紙と相性の良い印象に設計</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>要件整理</strong>：理念（100年後の風景）と、必須要素（肩書き・住所・URL・QR）を定義</li><li><strong>ロゴ設計</strong>：建築の線・構造感をミニマルな線画に落とし込み、過度に装飾しない方向へ</li><li><strong>名刺設計</strong>：可読性を最優先に、情報の段組みと余白で"静けさ"を作る</li><li><strong>仕上げ</strong>：印刷を想定して線幅・コントラスト・整列を調整し、実用性を担保</li></ol><div class="desc-note"><dl><dt>制作範囲</dt><dd>ロゴ / 名刺（横型・表／裏）/ モックアップ</dd><dt>必須要素</dt><dd>ロゴ / 氏名 / 肩書き（代表取締役）/ 住所 / WebサイトURL / QR</dd><dt>作業時間</dt><dd>ロゴ：00:43:57 / 名刺：00:15:14</dd><dt>使用ツール</dt><dd>Illustrator / Photoshop</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Design Focus</h3><ul><li>Abstracted architectural forms using minimal lines reminiscent of roofs and structural frames</li><li>Built a calm, trustworthy tone through generous spacing and a monochrome information layout</li><li>Designed with tactile paper stocks in mind (recycled or bagasse paper), letting material quality lead</li></ul></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Brief Definition</strong>: Defined the core philosophy and required information (title, address, URL, QR)</li><li><strong>Logo Design</strong>: Developed a restrained line-based mark inspired by architectural structure</li><li><strong>Card Layout</strong>: Prioritized readability and calm hierarchy through spacing and alignment</li><li><strong>Refinement</strong>: Adjusted stroke weight, contrast, and grid alignment with print use in mind</li></ol><div class="desc-note"><dl><dt>Scope</dt><dd>Logo / Business card (horizontal, front &amp; back) / Mockup</dd><dt>Required Elements</dt><dd>Logo / Name / Title / Address / Website URL / QR</dd><dt>Time Spent</dt><dd>Logo: 00:43:57 / Card: 00:15:14</dd><dt>Tools</dt><dd>Illustrator / Photoshop</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    loop_cafe: {
      titleJa: 'LOOP Café',
      titleEn: 'LOOP Café — Logo Design',
      scope: 'Logo Design / Concept Study',
      tags: ['Logo Design', 'Concept Study'],
      img: '../images/works/design/loop-cafe.webp',
      roleJa: 'ロゴデザイン・ブランドカラー設定',
      roleEn: 'Logo design / Brand color definition',
      descJa: `<p class="desc-lead">「循環（Loop）」をテーマにした、都市型サステナブルカフェのコンセプトワーク。ミニマルでクリーン、素材感が主役になるトーンを意識してロゴと展開例を制作しました。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>"循環"を円の動きで表現し、コーヒーと自然要素をひとつに統合</li><li>線を絞って、再生紙や布など<strong>素材の質感が主役</strong>になる前提で設計</li><li>カップ・看板などの小さな面でも崩れない、単純な構造と余白バランス</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>要件整理</strong>：ターゲット（20〜30代）とトーン（クリーン/オーガニック）を定義</li><li><strong>形の検討</strong>：循環を"記号っぽくしすぎず"カフェらしく落とし込む方向を探る</li><li><strong>整形</strong>：線幅・余白・文字組を調整し、静かな存在感に寄せる</li><li><strong>展開確認</strong>：カップ/トート/看板で見え方を確認し、バランスを微調整</li></ol><div class="desc-note"><dl><dt>制作範囲</dt><dd>ロゴ / アプリケーション（カップ・トート・看板）</dd><dt>使用ツール</dt><dd>Illustrator / Photoshop</dd><dt>備考</dt><dd>自主制作（紙ポートフォリオ案として制作後、Web掲載向けに整理）</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Design Notes</h3><ul><li>Built around a looping circle to suggest "circulation," blended with coffee + organic cues</li><li>Kept the mark minimal so paper/cloth texture can take the spotlight</li><li>Designed to stay readable across small surfaces like cups and signage</li></ul></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Brief</strong>: defined the audience and tone (clean, modern, organic)</li><li><strong>Exploration</strong>: searched for a "loop" expression that feels café-like, not overly symbolic</li><li><strong>Refinement</strong>: adjusted stroke, spacing, and typography for a calm presence</li><li><strong>Applications</strong>: tested on cup/tote/sign mockups and fine-tuned balance</li></ol><div class="desc-note"><dl><dt>Scope</dt><dd>Logo / Applications (cup, tote bag, signage)</dd><dt>Tools</dt><dd>Illustrator / Photoshop</dd><dt>Note</dt><dd>Personal work (originally for print portfolio, reorganized for web use)</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    nexus_ai: {
      titleJa: 'NEXUS AI',
      titleEn: 'NEXUS AI — Logo Design',
      scope: 'Logo Design / Mockup',
      tags: ['Logo Design', 'Mockup'],
      img: '../images/works/design/nexus-ai.webp',
      roleJa: 'ロゴデザイン・ブランドカラー設定・モックアップ制作',
      roleEn: 'Logo design / Brand color definition / Mockup production',
      descJa: `<p class="desc-lead">クリエイターの創造性を拡張するAIツールを提供するテックスタートアップ「Nexus AI」を想定したロゴデザイン。<br><br>「Nexus＝つながり」をテーマに、点と線が有機的に結びつく構造で先進性と信頼感、柔軟さを同時に表現しました。アプリアイコンやWebヘッダーなど、デジタル上での視認性と汎用性を重視しています。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>「つながり」を、<strong>点と線の結節</strong>で抽象化し、AIと人の接点を象徴</li><li>過度な装飾を避け、<strong>信頼感のあるミニマル設計</strong>でテックらしさを担保</li><li>小さなアイコンでも形が残るよう、<strong>要素数と線幅</strong>を最適化</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>要件整理</strong>：先進性・信頼感・柔軟性のバランスと、使用場面（アプリ/WEB）を定義</li><li><strong>形状設計</strong>：接続・交差・結節のパターンを整理し、抽象度と視認性の着地点を検証</li><li><strong>タイポ設計</strong>：クリーンな字面で統一し、シンボルとの重心・余白バランスを調整</li><li><strong>展開検証</strong>：アイコン/ヘッダーでの縮小耐性を確認し、線幅・間隔を最終調整</li></ol><div class="desc-note"><dl><dt>制作時間</dt><dd>01:13:08</dd><dt>使用ツール</dt><dd>Illustrator（必要に応じてPhotoshopで調整）</dd><dt>制作範囲</dt><dd>ロゴ / モックアップ（アプリアイコン・Webヘッダー想定）</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Key Design Points</h3><ul><li>Visualized "Nexus" as <strong>nodes and connections</strong> to represent the touchpoint between AI and people</li><li>Kept the system <strong>minimal and professional</strong> to maintain trust and a tech-forward tone</li><li>Optimized <strong>stroke weight and element count</strong> so the symbol stays recognizable at icon size</li></ul></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Brief</strong>: Defined the balance of innovation, trust, and flexibility, plus key use cases (app/web)</li><li><strong>Form Study</strong>: Explored connection/intersection patterns and tested abstraction vs. clarity</li><li><strong>Typography</strong>: Matched a clean wordmark and refined alignment, spacing, and visual center</li><li><strong>Validation</strong>: Checked scalability for app icons and headers, then finalized stroke and spacing</li></ol><div class="desc-note"><dl><dt>Time</dt><dd>01:13:08</dd><dt>Tools</dt><dd>Illustrator (Photoshop as needed)</dd><dt>Scope</dt><dd>Logo / Mockup (App Icon, Web Header)</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    sora: {
      titleJa: 'SORA',
      titleEn: 'SORA — Logo Design',
      scope: 'Logo Design / Package Mockup',
      tags: ['Logo Design', 'Package Mockup'],
      img: '../images/works/design/sora.webp',
      roleJa: 'ロゴデザイン・ブランドカラー設定・パッケージモックアップ',
      roleEn: 'Logo design / Brand color definition / Package mockup',
      descJa: `<p class="desc-lead">その日の肌状態や天候に応じて成分を調整する、D2C型の高級スキンケアブランド「SORA」を想定したコンセプトワーク。<br><br>「空間」「余白」「広がり」をキーワードに、静謐で上質な透明感を軸としたビジュアルアイデンティティを設計しました。ロゴからパッケージ、ショッパーまでトーンを統一し、白・黒どちらの背景でも成立する汎用性を重視しています。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>「宙（そら）」「空」を想起させる<strong>余白と静けさ</strong>を軸に、過度な装飾を排したミニマル設計</li><li>ロゴは<strong>横線＝空・環境 / 縦線＝人・肌</strong>という構造で、ブランド思想を抽象的に可視化</li><li>白・黒背景のどちらでも成立するよう、コントラストと線の繊細さを調整し<strong>汎用性</strong>を確保</li><li>ガラスボトルやショッパーなど実装シーンを想定し、<strong>上質な静謐感</strong>が保たれるトーンに統一</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>要件整理</strong>：ターゲット像（丁寧な暮らし・本質志向）と「透明感 / 静謐」を言語化</li><li><strong>構造設計</strong>：ブランド名と思想を、線の構造（空・環境／人・肌）へ落とし込み</li><li><strong>ロゴ調整</strong>：余白、線幅、字間を微調整し、主張しすぎない品格を設計</li><li><strong>展開検証</strong>：白・黒の背景、パッケージ/ショッパー想定で視認性と世界観をチェック</li></ol><div class="desc-note"><dl><dt>制作範囲</dt><dd>ロゴ / パッケージ / ショッパー / ビジュアル設計（白・黒展開）</dd><dt>想定媒体</dt><dd>D2Cブランド（オンライン中心）/ パッケージ / 店頭・同梱物</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Design Highlights</h3><ul><li>Built around the keywords <strong>space, stillness, and openness</strong>, with a minimal and quiet visual tone</li><li>The logo structure is defined as <strong>horizontal line = sky / environment</strong> and <strong>vertical line = person / skin</strong>, expressing the brand concept in abstract form</li><li>Optimized for both <strong>white and black</strong> backgrounds by refining contrast and hairline weight for versatility</li><li>Designed with real-world applications in mind (glass bottle, package, shopper) while maintaining a <strong>premium serene</strong> atmosphere</li></ul></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Brief &amp; Positioning</strong>: defined the target audience and key brand keywords (transparency / serenity)</li><li><strong>Concept Translation</strong>: converted the brand idea into a simple line structure representing sky/environment and person/skin</li><li><strong>Logo Refinement</strong>: adjusted spacing, line weight, and typography for a calm premium balance</li><li><strong>Application Check</strong>: validated visibility and consistency across mockups and color contexts (white/black)</li></ol><div class="desc-note"><dl><dt>Scope</dt><dd>Logo / Package / Shopper / Visual direction (White &amp; Black versions)</dd><dt>Intended Use</dt><dd>D2C brand assets / packaging / printed materials</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    winter_choco: {
      titleJa: '冬限定 ひとくちチョコ',
      titleEn: 'Winter Chocolate — Promotion Banner',
      scope: 'Promotion Banner / 季節商品訴求',
      tags: ['Promotion Banner', '季節商品訴求'],
      img: '../images/works/design/banner-collection-05.webp',
      roleJa: 'バナーデザイン・レギュレーション確認・入稿',
      roleEn: 'Banner design / Spec compliance / Submission',
      descJa: `<p class="desc-lead">冬限定の一口チョコ販促を想定した広告ビジュアル。"溶け"などの情緒表現に寄らず、季節感と素材感を軸に上質さを設計しました。<br><br>百貨店・EC展開を想定し、落ち着いたトーンと余白で冬のご褒美感を演出しています。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>季節感（雪・冷気）と素材感（カカオ）を主役にし、ブランド想起の偏りを回避</li><li>余白と落ち着いたトーンで"ご褒美感"を強調</li><li>小サイズでも主題が伝わるよう、要素数を絞って情報を整理</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>要件整理</strong>：課題内容とターゲットを整理し、訴求軸を明確化</li><li><strong>構成設計</strong>：視線の流れを定義し、情報量と優先順位を調整</li><li><strong>ビジュアル設計</strong>：トーン・配色・素材感を整理し、世界観を構築</li><li><strong>仕上げ</strong>：余白・整列・可読性を最終調整</li></ol><div class="desc-note"><dl><dt>課題提供</dt><dd>こばやす様（テーマ提示）</dd><dt>使用サイズ</dt><dd>300x280</dd><dt>使用ツール</dt><dd>Illustrator / Photoshop</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Summary</h3><p>Promotional banner for a seasonal bite-sized chocolate product. Built around winter atmosphere and material texture rather than overt "melting" emotion, using a calm palette and generous spacing to convey a premium, gift-like feel.</p></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Brief Definition</strong>: Clarified the brief, target audience, and key message</li><li><strong>Layout Planning</strong>: Defined visual flow and adjusted information hierarchy</li><li><strong>Visual Design</strong>: Established tone, color, and material expression</li><li><strong>Refinement</strong>: Finalized spacing, alignment, and overall readability</li></ol><div class="desc-note"><dl><dt>Brief</dt><dd>Provided by Kobayas (theme prompt)</dd><dt>Size</dt><dd>300x280</dd><dt>Tools</dt><dd>Illustrator / Photoshop</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    onsen: {
      titleJa: '貸切露天風呂付き宿泊プラン',
      titleEn: 'Private Onsen Stay Plan — Promotion Banner',
      scope: 'Promotion Banner / 2 Variations（販促・ブランディング）',
      tags: ['Promotion Banner', '2 Variations（販促・ブランディング）'],
      img: '../images/works/design/banner-collection-03.webp',
      roleJa: 'バナーデザイン・2バリエーション制作・レギュレーション確認・入稿',
      roleEn: 'Banner design / 2 variations / Spec compliance / Submission',
      descJa: `<p class="desc-lead">同一テーマを<strong>短期販促</strong>と<strong>高級旅館向け</strong>の2目的で制作。ターゲットの温度差に合わせて、情報量・余白・視線誘導を切り替えました。</p><div class="desc-section"><h3>設計ポイント（高級旅館向け）</h3><ul><li>余白を確保し、「写真→コピー→特典」へ静かに誘導</li><li>強い訴求語を抑え、トーンの一貫性で信頼感を設計</li><li>情報密度を絞り、"特別感"の余韻を残す</li></ul></div><div class="desc-section"><h3>設計ポイント（短期販促）</h3><ul><li>特典を先出しし、即理解できる構成に整理</li><li>数字と強調要素で視線を止め、行動理由を明確化</li><li>季節イベント文脈を添え、クリックの背中を押す</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>要件整理</strong>：目的（短期販促/ブランディング）とターゲットを分岐し、訴求軸を設定</li><li><strong>構成設計</strong>：主写真→コピー→特典の流れを固定し、情報密度を目的別に調整</li><li><strong>タイポ設計</strong>：可読性を担保しつつ、"上質/勢い"のトーン差を文字組で設計</li><li><strong>仕上げ</strong>：余白・整列・強調バランスを最終調整</li></ol><div class="desc-note"><dl><dt>課題提供</dt><dd>こばやす様（テーマ提示）</dd><dt>使用サイズ</dt><dd>500×500</dd><dt>使用ツール</dt><dd>Illustrator / Photoshop</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Design Focus (Luxury)</h3><ul><li>Used generous spacing to guide attention from imagery to copy and benefits</li><li>Reduced strong sales language to build trust through consistent tone</li><li>Intentionally lowered information density to leave a sense of exclusivity</li></ul></div><div class="desc-section"><h3>Design Focus (Campaign)</h3><ul><li>Placed key benefits upfront for immediate understanding</li><li>Used numbers and emphasis to stop attention and clarify action value</li><li>Added seasonal context to encourage timely engagement</li></ul></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Brief Definition</strong>: Defined objectives and segmented targets by promotion type</li><li><strong>Layout Planning</strong>: Fixed visual flow from hero image to copy and benefits</li><li><strong>Typography Design</strong>: Adjusted typographic tone to balance elegance and impact</li><li><strong>Refinement</strong>: Finalized spacing, alignment, and emphasis balance</li></ol><div class="desc-note"><dl><dt>Brief</dt><dd>Provided by Kobayasu (theme prompt)</dd><dt>Banner Size</dt><dd>500×500</dd><dt>Tools</dt><dd>Illustrator / Photoshop</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    kobayasland: {
      titleJa: 'Kobayasランド 開園記念',
      titleEn: 'Kobayasland Grand Opening — Promotion Banner',
      scope: 'Promotion Banner / イベント告知',
      tags: ['Promotion Banner', 'イベント告知'],
      img: '../images/works/design/banner-collection-06.webp',
      roleJa: 'バナーデザイン・レギュレーション確認・入稿',
      roleEn: 'Banner design / Spec compliance / Submission',
      descJa: `<p class="desc-lead">遊園地の開園記念イベントを想定した販促バナー。にぎやかさと情報量を前提にしつつ、視線の流れを整理して判断材料を一画面に集約しました。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>ファミリー層に向け、楽しさが直感で伝わる"にぎやかさ"をベースに設計</li><li>割引・期間・イベント性を一画面で判断できる情報の集約</li><li>情報量が多くても迷わないよう、見出しと流れで視線誘導を整理</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>要件整理</strong>：開園記念イベントの目的と、ファミリー層を中心としたターゲットを設定</li><li><strong>情報設計</strong>：割引・期間・イベント性を洗い出し、一画面で判断できる要素に整理</li><li><strong>構成設計</strong>：にぎやかさを保ちつつ、視線が自然に流れるレイアウトを設計</li><li><strong>仕上げ</strong>：情報量と可読性のバランスを調整し、全体の見やすさを最終確認</li></ol><div class="desc-note"><dl><dt>課題提供</dt><dd>こばやす様（テーマ提示）</dd><dt>使用サイズ</dt><dd>800x200</dd><dt>使用ツール</dt><dd>Illustrator / Photoshop</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Summary</h3><p>Launch celebration banner for a theme park event. It embraces a lively, information-rich layout while keeping a clear viewing path, consolidating key decision cues such as discount, period, and event details in one screen.</p></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Brief Definition</strong>: Defined the opening event objective and family-oriented target audience</li><li><strong>Information Structuring</strong>: Organized discounts, period, and event details for quick decision-making</li><li><strong>Layout Planning</strong>: Designed a lively yet readable layout with a clear visual flow</li><li><strong>Refinement</strong>: Adjusted information density and readability for final balance</li></ol><div class="desc-note"><dl><dt>Brief</dt><dd>Provided by Kobayas (theme prompt)</dd><dt>Size</dt><dd>800x200</dd><dt>Tools</dt><dd>Illustrator / Photoshop</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    kobapay: {
      titleJa: 'Koba-Pay クリスマスキャンペーン',
      titleEn: 'Koba-Pay Christmas Campaign — Promotion Banner',
      scope: 'Promotion Banner / アプリ利用促進',
      tags: ['Promotion Banner', 'アプリ利用促進'],
      img: '../images/works/design/banner-collection-01.webp',
      roleJa: 'バナーデザイン・レギュレーション確認・入稿',
      roleEn: 'Banner design / Spec compliance / Submission',
      descJa: `<p class="desc-lead">地域密着型キャッシュレス決済アプリ「koba-pay」の利用促進キャンペーンを想定した広告ビジュアル。ポイント付与・還元率など即時ベネフィットを主役に、数字→QR→コピーの順で読める構成に設計しました。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>クリスマス商戦期の"今得する"訴求を数字で最短伝達</li><li>QRコードを迷わず読み取れるよう、配置と余白で可読性を確保</li><li>比較検討中でも理解できるよう、要点を一画面に整理</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>要件整理</strong>：利用促進の目的と、クリスマス商戦期における訴求条件を整理</li><li><strong>情報設計</strong>：ポイント付与・還元率など即時性の高い要素を優先順位化</li><li><strong>構成設計</strong>：数字→QR→コピーの順で理解できる視線の流れを設計</li><li><strong>仕上げ</strong>：可読性と情報密度を調整し、瞬時に内容が伝わる状態に最適化</li></ol><div class="desc-note"><dl><dt>課題提供</dt><dd>こばやす様（テーマ提示）</dd><dt>使用サイズ</dt><dd>350x200</dd><dt>使用ツール</dt><dd>Illustrator / Photoshop</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Summary</h3><p>Campaign banner for a local cashless payment app, "koba-pay." It highlights instant benefits such as points and cashback for quick understanding, guiding attention from key numbers to the QR code and supporting copy.</p></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Brief Definition</strong>: Clarified campaign goals and conditions for the holiday season</li><li><strong>Information Structuring</strong>: Prioritized instant benefits such as points and cashback</li><li><strong>Layout Planning</strong>: Designed a clear visual flow from key numbers to QR code and copy</li><li><strong>Refinement</strong>: Adjusted readability and information density for quick comprehension</li></ol><div class="desc-note"><dl><dt>Brief</dt><dd>Provided by Kobayas (theme prompt)</dd><dt>Size</dt><dd>350x200</dd><dt>Tools</dt><dd>Illustrator / Photoshop</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    kobafitness: {
      titleJa: 'スポーツKoba 新春入会キャンペーン',
      titleEn: 'Sports Koba New Year Campaign — Promotion Banner',
      scope: 'Promotion Banner / 入会促進',
      tags: ['Promotion Banner', '入会促進'],
      img: '../images/works/design/banner-collection-04.webp',
      roleJa: 'バナーデザイン・レギュレーション確認・入稿',
      roleEn: 'Banner design / Spec compliance / Submission',
      descJa: `<p class="desc-lead">フィットネスクラブの新春入会キャンペーンを想定した広告ビジュアル。0円訴求で初期ハードルを下げつつ、「続けられる」メッセージで不安を補完し、数字・コピー・人物ビジュアルの優先順位を整理して設計しました。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>新年の行動変容タイミングに合わせ、0円訴求を最優先で可視化</li><li>"忙しくても続けられる"メッセージで継続不安を軽減し、価格訴求に偏らない構成</li><li>人物→コピー→数字の順に視線が流れるよう、要素サイズと配置を整理</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>要件整理</strong>：新春入会キャンペーンの目的と、社会人層を中心としたターゲットを設定</li><li><strong>情報設計</strong>：入会金・事務手数料無料など、行動ハードルを下げる要素を優先整理</li><li><strong>構成設計</strong>：数字→コピー→人物ビジュアルの順で理解できる視線導線を設計</li><li><strong>仕上げ</strong>：価格訴求と継続イメージのバランスを調整し、安心感のある表現に調整</li></ol><div class="desc-note"><dl><dt>課題提供</dt><dd>こばやす様（テーマ提示）</dd><dt>使用サイズ</dt><dd>500x500</dd><dt>使用ツール</dt><dd>Illustrator / Photoshop</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Summary</h3><p>New Year membership campaign banner for a fitness club. The layout leads with a "0 yen" offer to reduce entry friction, while supportive copy reassures consistency, keeping a clear hierarchy between price, message, and lifestyle imagery.</p></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Brief Definition</strong>: Defined campaign goals and targeted working adults during the New Year period</li><li><strong>Information Structuring</strong>: Prioritized fee waivers to reduce entry barriers</li><li><strong>Layout Planning</strong>: Designed a visual flow from key numbers to copy and lifestyle imagery</li><li><strong>Refinement</strong>: Balanced pricing appeal with reassurance for long-term commitment</li></ol><div class="desc-note"><dl><dt>Brief</dt><dd>Provided by Kobayas (theme prompt)</dd><dt>Size</dt><dd>500x500</dd><dt>Tools</dt><dd>Illustrator / Photoshop</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    lunch_menu: {
      titleJa: 'cafe-with flyer',
      titleEn: 'cafe-with — Flyer Design',
      scope: 'Print Design',
      tags: ['Print Design'],
      img: '../images/works/design/lunch-menu.webp',
      roleJa: 'フライヤーデザイン・印刷入稿',
      roleEn: 'Flyer design / Print-ready',
      descJa: `<p class="desc-lead">カフェのランチ利用や日常的な来店を想定し、店頭設置・手渡し配布のどちらにも対応できるA5チラシを制作。<br><br>ランチ・ケーキ・ドリンク・クーポンと情報量が多い媒体であることを前提に、<strong>「内容・価格・提供時間」</strong>が一目で把握できる情報設計と、親しみやすい世界観の両立を意識しました。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li><strong>情報の優先順位</strong>を整理し、来店判断に直結する「内容・価格・時間」を最上段で即認識できる構成</li><li>写真の近くに価格を配置し、<strong>視線移動を最短化</strong>（直感で理解できるレイアウト）</li><li>ランチ / ケーキ / ドリンク / クーポンを<strong>時間軸＋用途別</strong>に分け、読み疲れを軽減</li><li>猫モチーフ＋柔らかな配色で、常連だけでなく<strong>初来店にも入りやすいトーン</strong>を設計</li><li>配布運用を想定し、クーポン条件・問い合わせ導線を<strong>行動に繋がる位置</strong>に集約</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>要件整理</strong>：目的（ランチ集客 / 日常来店）と掲載要素（メニュー＋クーポン）の情報量を整理</li><li><strong>構造設計</strong>：時間帯別（ランチ / ケーキ）と用途別（ドリンク / クーポン）でブロック化</li><li><strong>視線誘導</strong>：写真→価格→説明の順で読めるよう、余白と見出しの強弱を調整</li><li><strong>最終調整</strong>：クーポン条件・QR・店舗情報の可読性と、全体トーン（親しみやすさ）を最適化</li></ol><div class="desc-note"><dl><dt>制作範囲</dt><dd>A5チラシデザイン（フルカラー）</dd><dt>想定媒体</dt><dd>店舗配布用フライヤー / 店頭設置（ラック）/ 手渡し配布</dd><dt>ツール</dt><dd>Adobe Illustrator / Adobe Photoshop</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Design Highlights</h3><ul><li>Organized a clear <strong>information hierarchy</strong> so visitors can instantly grasp menu items, pricing, and serving hours</li><li>Placed prices close to photos to reduce cognitive load and enable <strong>at-a-glance understanding</strong></li><li>Structured the layout into time- and purpose-based sections (Lunch / Cake / Drinks / Coupons) to improve readability</li><li>Used a warm palette and subtle cat motifs to create a <strong>friendly, approachable tone</strong> for first-time customers</li><li>Designed for real distribution: coupon rules, QR, and store info are positioned for <strong>quick action</strong></li></ul></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Brief &amp; Requirements</strong>: defined the goal (lunch visits / daily walk-ins) and organized high-volume content</li><li><strong>Layout Structure</strong>: grouped content by time and usage (Lunch, Cake Set, Drinks, Coupons)</li><li><strong>Visual Flow</strong>: refined spacing and typographic hierarchy to guide the eye from photo → price → description</li><li><strong>Final Optimization</strong>: ensured readability of coupon conditions and QR placement while keeping a warm brand tone</li></ol><div class="desc-note"><dl><dt>Scope</dt><dd>A5 Flyer Design (Full Color)</dd><dt>Intended Use</dt><dd>In-store handouts / Display rack placement</dd><dt>Tools</dt><dd>Adobe Illustrator / Adobe Photoshop</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    bernes: {
      titleJa: '自分用名刺',
      titleEn: 'Personal Business Card Design',
      scope: 'Print Design',
      tags: ['Print Design'],
      img: '../images/works/design/bernes.webp',
      roleJa: '名刺（表裏）デザイン・印刷入稿',
      roleEn: 'Business card design (front & back) / Print-ready',
      descJa: `<p class="desc-lead">大型犬が好きすぎて、ついに名刺にも登場してもらいました🐶それと、昔ちょっと「免許証持ってる＝大人である」と謎に憧れてた時期があって…その2つを合体させた、自主制作の"IDカード風名刺"です。<br><br>ちゃんと使える情報整理は守りつつ、堅すぎない雰囲気に寄せています。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>免許証っぽいレイアウトで、情報が一瞬で読めるように整理</li><li>かわいさ全振りにならないよう、色数と余白は控えめに</li><li>犬イラストは"話しかけやすさ"担当（初対面の空気を和らげる用）</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>方向性メモ</strong>：好き（大型犬）＋憧れ（免許証）を1枚で成立させる方針に</li><li><strong>情報設計</strong>：肩書き・連絡先・導線（QR）を"迷わない順番"に配置</li><li><strong>イラスト調整</strong>：主張しすぎないサイズ感にして、邪魔せず効かせる</li><li><strong>仕上げ</strong>：印刷を想定して線の太さ・余白・可読性を最終調整</li></ol><div class="desc-note"><dl><dt>制作種別</dt><dd>自主制作</dd><dt>制作範囲</dt><dd>名刺（表／裏）/ モックアップ</dd><dt>使用ツール</dt><dd>Illustrator / Photoshop</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Summary</h3><p>A self-initiated business card inspired by ID card layouts and my love for large dogs 🐾 It keeps information clean and readable, while adding a friendly touch through illustration and soft tones.</p></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Concept note</strong>: Combined "large dogs" + "ID card layout" into a usable design</li><li><strong>Information layout</strong>: Organized title, contacts, and QR links for quick scanning</li><li><strong>Illustration balance</strong>: Kept visuals friendly but not overpowering</li><li><strong>Final polish</strong>: Adjusted spacing, line weight, and readability for print</li></ol><div class="desc-note"><dl><dt>Type</dt><dd>Personal project</dd><dt>Scope</dt><dd>Business card (front/back) / Illustration / Mockup</dd><dt>Tools</dt><dd>Illustrator / Photoshop</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
    portfolio_print: {
      titleJa: '紙ポートフォリオ',
      titleEn: 'Paper Portfolio — Yui-Takasu',
      scope: 'Print Design / Self-initiated',
      tags: ['Print Design'],
      img: '../images/works/design/portfolio.webp',
      roleJa: '紙ポートフォリオのデザイン・レイアウト・印刷入稿',
      roleEn: 'Paper portfolio design / Layout / Print-ready',
      descJa: `<p class="desc-lead">自身の主にデザイナーとしての活動をまとめた紙ポートフォリオ。作品そのものだけでなく、「どう考えて・どう構成しているか」が伝わるよう、余白・グリッド・情報階層を意識したブックデザインを行いました。<br><br>静かでモダンなトーンをベースに、実務資料としても、自己表現の媒体としても成立する構成を目指しています。</p><div class="desc-section"><h3>設計ポイント</h3><ul><li>グリッドと余白を基準に、視線が自然に流れる誌面構成</li><li>作品写真・説明文・補足情報の情報階層を明確に整理</li><li>主張しすぎない配色で、内容そのものに集中できるデザイン</li><li>紙媒体でもデジタル感覚で読めるリズムを意識</li></ul></div><div class="desc-section"><h3>制作プロセス</h3><ol><li><strong>構成設計</strong>：全体ページ構成と情報量を整理</li><li><strong>トーン設計</strong>：モダンで静かな印象を軸に方向性を決定</li><li><strong>レイアウト</strong>：グリッド・余白・文字組みを調整</li><li><strong>仕上げ</strong>：印刷時の見え方を想定して最終調整</li></ol><div class="desc-note"><dl><dt>制作種別</dt><dd>自主制作</dd><dt>制作範囲</dt><dd>構成 / デザイン / レイアウト / モックアップ</dd><dt>使用ツール</dt><dd>InDesign / Illustrator / Photoshop</dd></dl></div></div>`,
      descEn: `<div class="desc-section"><h3>Summary</h3><p>A self-designed printed portfolio showcasing my illustration and design work. The book focuses not only on visuals, but also on structure, spacing, and information hierarchy, allowing the reader to understand my design thinking at a glance.</p></div><div class="desc-section"><h3>Process</h3><ol><li><strong>Structure planning</strong>: Defined page flow and content balance</li><li><strong>Visual direction</strong>: Established a calm, modern design tone</li><li><strong>Layout design</strong>: Refined grid, spacing, and typography</li><li><strong>Final adjustment</strong>: Optimized readability for print</li></ol><div class="desc-note"><dl><dt>Type</dt><dd>Personal project</dd><dt>Scope</dt><dd>Book design / Layout / Mockup</dd><dt>Tools</dt><dd>InDesign / Illustrator / Photoshop</dd></dl></div></div>`,
      link: '',
      linkLabel: '',
    },
  };

  /* === モーダルデータ（旧HP準拠フォーマット更新） === */
  Object.assign(MODAL_DATA, {
    yori_salon: {
      title: 'Yori｜プライベートサロン LP コンセプト',
      titleEn: 'Yori｜Private Salon LP Concept',
      titleFr: 'Yori｜Concept LP Salon Privé',
      subtitle: 'Web Design / UI Design / Concept Work',
      html: `
    <div class="mwork">

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/web/original/yori-salon/overview.webp",
              "alt":{"ja":"Yori LP｜全体構成","en":"Yori LP — full layout","fr":"LP Yori — structure complète"},
              "label":{"ja":"全体構成","en":"Overview","fr":"Vue d’ensemble"}
            },
            {
              "src":"../images/works/web/original/yori-salon/mock_pc.webp",
              "alt":{"ja":"Yori LP｜PC表示","en":"Yori LP — desktop view","fr":"LP Yori — affichage ordinateur"},
              "label":"PC"
            },
            {
              "src":"../images/works/web/original/yori-salon/mock_tablet_SP.webp",
              "alt":{"ja":"Yori LP｜Tablet&SP表示","en":"Yori LP — tablet and mobile view","fr":"LP Yori — affichage tablette et mobile"},
              "label":"Tablet & SP"
            },
            {
              "src":"../images/works/web/original/yori-salon/extract.webp",
              "alt":{"ja":"Yori LP｜一部抜粋","en":"Yori LP — excerpt","fr":"LP Yori — extrait"},
              "label":{"ja":"抜粋","en":"Excerpt","fr":"Extrait"}
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/web/original/yori-salon/mock_pc.webp"
            alt="Yori LP｜PC表示">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          住宅街にあるプライベートサロン「Yori」を想定したコンセプトLP制作。<br><br>
          「静かに、整える時間。」をキーワードに、<br>
          通いやすさ・安心感・やわらかな上質感が伝わる世界観を設計しました。<br>
          過度な装飾や強い訴求を避け、余白と情報階層で落ち着いた体験をつくることを重視しています。<br><br>
          本作品はデザイン設計段階のアウトプットとして、<br>
          レスポンシブ実装を想定したレイアウトと情報密度の調整までを行いました。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li>“通う場所”としての安心感を、やわらかな配色・余白・文字密度で設計</li>
            <li>ナビゲーションは必要最小限に整理し、迷わず目的情報へ到達できる導線に</li>
            <li>About → Menu → 施術の流れ → News → Access の順で、不安を解消する情報設計</li>
            <li>レスポンシブ実装を前提に、FVの装飾要素や文字サイズが崩れないよう調整</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>要件整理</strong>：サロン利用時の不安（料金・施術内容・場所・流れ）を洗い出し</li>
            <li><strong>構成設計</strong>：世界観提示→安心材料→予約判断のための情報提示へ段階設計</li>
            <li><strong>UI設計</strong>：余白・整列・写真トーンを揃え、落ち着いた読後感を構築</li>
            <li><strong>実装想定</strong>：SPでの可読性、表（Menu）や地図（Access）の崩れを想定して設計</li>
          </ol>

	<div class="mwork__note">
	  <dl>
	    <dt>使用ツール</dt>
	    <dd>Figma / Photoshop</dd>
	    <dt>制作範囲</dt>
	    <dd>LP構成 / UIデザイン / レスポンシブ設計（デザイン）</dd>
	  </dl>
	</div>

	<p class="mwork__related">
	  ※本サロンを想定し、LPの世界観を継承した予約フォームUIを別作品として設計しています（予約フロー・状態設計まで想定）。
	</p>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          A concept LP for "Yori," an imagined private salon in a residential neighborhood.<br><br>
          Built around the keyword "A quiet time to reset,"<br>
          the design conveys approachability, reassurance, and a soft sense of quality.<br>
          Rather than heavy decoration or strong appeals, the focus is on a calm experience built through whitespace and information hierarchy.<br><br>
          As a design-stage output, this work also includes layout and information-density adjustments planned for responsive implementation.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Design Focus</h3>
          <ul>
            <li>Designed a warm and calming tone through soft colors, spacing, and restrained typography</li>
            <li>Kept navigation minimal so users can reach key information without hesitation</li>
            <li>Structured content to reduce anxiety: About → Menu → Flow → News → Access</li>
            <li>Planned layouts with responsiveness and feasibility in mind, especially for decorative hero elements</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Brief Definition</strong>: Identified common concerns (pricing, service details, location, procedure)</li>
            <li><strong>Structure Planning</strong>: Designed a gradual flow from atmosphere to reassurance and decision-making</li>
            <li><strong>UI Design</strong>: Unified spacing, alignment, and photo tone for a calm reading experience</li>
            <li><strong>Implementation Planning</strong>: Considered responsive risks for tables (menu) and map blocks (access)</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Tools</dt>
              <dd>Figma / Photoshop</dd>
              <dt>Scope</dt>
              <dd>LP structure / UI design / Responsive layout planning</dd>
            </dl>
          </div>
	<p class="mwork__related">
	  A reservation form UI was also designed as a separate work, inheriting the visual tone of this LP (including reservation flow and UI state design).
	</p>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          Une LP conceptuelle pour « Yori », un salon privé imaginaire dans un quartier résidentiel.<br><br>
          Construit autour du mot-clé « Un moment de calme pour se ressourcer »,<br>
          le design transmet accessibilité, réassurance et une qualité tout en douceur.<br>
          Plutôt qu'une décoration lourde ou des messages appuyés, l'accent est mis sur une expérience apaisée construite par l'espace blanc et la hiérarchie de l'information.<br><br>
          En tant que production de l'étape de conception, ce travail comprend aussi les ajustements de mise en page et de densité d'information prévus pour une implémentation responsive.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception</h3>
          <ul>
            <li>Conception d'un ton chaleureux et apaisant grâce à des couleurs douces, des espacements et une typographie sobre</li>
            <li>Navigation réduite au minimum pour que les utilisateurs atteignent l'information clé sans hésitation</li>
            <li>Contenu structuré pour réduire l'anxiété : About → Menu → Déroulé → News → Access</li>
            <li>Mises en page pensées pour la réactivité et la faisabilité, notamment pour les éléments décoratifs du hero</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Définition du brief</strong> : identification des préoccupations courantes (tarifs, détails du service, lieu, procédure)</li>
            <li><strong>Planification de la structure</strong> : conception d'un déroulé progressif, de l'ambiance vers la réassurance puis la décision</li>
            <li><strong>Design UI</strong> : unification des espacements, de l'alignement et de la tonalité photo pour une lecture apaisée</li>
            <li><strong>Planification de l'implémentation</strong> : anticipation des risques responsive pour les tableaux (menu) et les blocs de carte (accès)</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Outils</dt>
              <dd>Figma / Photoshop</dd>
              <dt>Périmètre</dt>
              <dd>Structure LP / Design UI / Planification responsive</dd>
            </dl>
          </div>
	<p class="mwork__related">
	  Une UI de formulaire de réservation a également été conçue comme un travail séparé, héritant de la tonalité visuelle de cette LP (y compris le flux de réservation et la conception des états UI).
	</p>
        </div>
      </div>

    </div>`
    },
    yori_reservation: {
      title: 'Yori｜予約フォーム UI設計',
      titleEn: 'Yori｜Reservation Form UI',
      titleFr: 'Yori｜Design UI du formulaire de réservation',
      subtitle: 'UI Design / UX / Flow Design',
      html: `
    <div class="mwork">

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/web/original/yori-reservation/overview.webp",
              "alt":{"ja":"Yori 予約フォームUI｜モックアップ（PC/SP）","en":"Yori reservation form UI — mockup (desktop / mobile)","fr":"Interface de réservation Yori — maquette (ordinateur / mobile)"},
              "label":"Overview"
            },
            {
              "src":"../images/works/web/original/yori-reservation/pc_step1.webp",
              "alt":{"ja":"Yori 予約フォームUI｜PC（Step1：メニュー選択）","en":"Yori reservation form UI — desktop (step 1: menu selection)","fr":"Interface de réservation Yori — ordinateur (étape 1 : choix du menu)"},
              "label":"PC Step1"
            },
            {
              "src":"../images/works/web/original/yori-reservation/pc_step2.webp",
              "alt":{"ja":"Yori 予約フォームUI｜PC（Step2：日時選択）","en":"Yori reservation form UI — desktop (step 2: date and time)","fr":"Interface de réservation Yori — ordinateur (étape 2 : date et heure)"},
              "label":"PC Step2"
            },
            {
              "src":"../images/works/web/original/yori-reservation/pc_step3.webp",
              "alt":{"ja":"Yori 予約フォームUI｜PC（Step3：お客様情報入力）","en":"Yori reservation form UI — desktop (step 3: customer details)","fr":"Interface de réservation Yori — ordinateur (étape 3 : informations client)"},
              "label":"PC Step3"
            },
            {
              "src":"../images/works/web/original/yori-reservation/sp_all.webp",
              "alt":{"ja":"Yori 予約フォームUI｜SP（4画面一覧）","en":"Yori reservation form UI — mobile (four screens)","fr":"Interface de réservation Yori — mobile (quatre écrans)"},
              "label":"SP All"
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/web/original/yori-reservation/overview.webp"
            alt="Yori 予約フォームUI｜モックアップ（PC/SP）">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          プライベートサロン「Yori」を想定し、LPと同一トーンで予約フォームUIを設計しました。<br><br>
          メニュー選択 → 日時選択 → お客様情報入力 → 内容確認・送信の4ステップで構成し、<br>
          “迷いにくさ”と“落ち着いた体験”の両立を重視しています。<br><br>
          実装を想定し、ボタンの活性/非活性、選択状態、確認画面の情報整理まで状態設計を行いました。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li>ステップを分割し、選択の負荷を小さく（メニュー→日時→情報入力→確認）</li>
            <li>「次へ」ボタンは条件を満たすまで非活性にし、誤操作を抑制</li>
            <li>選択状態（ラジオ/チェック/選択中）を一貫したトーンで表現</li>
            <li>確認画面は“変更箇所に戻れる”導線を用意し、送信前の不安を軽減</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>要件整理</strong>：予約時の迷い（料金、所要時間、空き状況、入力負荷）を整理</li>
            <li><strong>フロー設計</strong>：4ステップに分割し、判断→入力→確認の順で負担を分散</li>
            <li><strong>UI設計</strong>：LPと同トーンの配色/余白/角丸/文字密度に統一</li>
            <li><strong>状態設計</strong>：活性/非活性、選択中、エラー想定（注意文）を考慮</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>使用ツール</dt>
              <dd>Figma / Photoshop</dd>
              <dt>制作範囲</dt>
              <dd>予約フロー設計 / UIデザイン（PC・SP）/ 状態設計</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          Designed a reservation form UI for the imagined private salon "Yori," matching the same tone as the LP.<br><br>
          Structured into 4 steps — menu selection → date/time selection → customer details → confirmation and submission,<br>
          with a focus on both "ease of choice" and a "calm experience."<br><br>
          Planned with implementation in mind, including button active/disabled states, selection states, and information organization on the confirmation screen.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Design Focus</h3>
          <ul>
            <li>Reduced cognitive load by splitting the flow into 4 clear steps</li>
            <li>Used disabled/active states for the “Next” button to prevent errors</li>
            <li>Kept selection states consistent across radio/checkbox components</li>
            <li>Designed the review screen with easy “edit” routes to reduce anxiety before submission</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Requirements</strong>: Organized user concerns (pricing, duration, availability, input effort)</li>
            <li><strong>Flow Design</strong>: Structured into 4 steps to distribute decisions and input</li>
            <li><strong>UI Design</strong>: Matched the LP’s calm tone via spacing, palette, and typography</li>
            <li><strong>State Planning</strong>: Considered active/disabled, selected, and validation messaging</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Tools</dt>
              <dd>Figma / Photoshop</dd>
              <dt>Scope</dt>
              <dd>Reservation flow / UI design (PC & SP) / State planning</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          Conception de l'UI d'un formulaire de réservation pour le salon privé imaginaire « Yori », dans la même tonalité que la LP.<br><br>
          Structuré en 4 étapes — sélection du menu → sélection de la date/heure → informations client → confirmation et envoi,<br>
          en mettant l'accent à la fois sur la « facilité de choix » et une « expérience apaisée ».<br><br>
          Pensé avec l'implémentation à l'esprit, y compris les états actif/inactif des boutons, les états de sélection, et l'organisation de l'information sur l'écran de confirmation.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception</h3>
          <ul>
            <li>Réduction de la charge cognitive en divisant le parcours en 4 étapes claires</li>
            <li>États actif/inactif utilisés pour le bouton « Suivant » afin de prévenir les erreurs</li>
            <li>États de sélection cohérents entre les composants radio/case à cocher</li>
            <li>Écran de confirmation conçu avec des parcours de modification faciles pour réduire l'anxiété avant l'envoi</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Cahier des charges</strong> : organisation des préoccupations utilisateur (tarifs, durée, disponibilité, effort de saisie)</li>
            <li><strong>Conception du parcours</strong> : structuré en 4 étapes pour répartir décisions et saisies</li>
            <li><strong>Design UI</strong> : tonalité alignée sur la LP via l'espacement, la palette et la typographie</li>
            <li><strong>Conception des états</strong> : prise en compte actif/inactif, sélectionné et messages de validation</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Outils</dt>
              <dd>Figma / Photoshop</dd>
              <dt>Périmètre</dt>
              <dd>Conception du parcours de réservation / Design UI (PC et mobile) / Conception des états</dd>
            </dl>
          </div>
        </div>
      </div>

    </div>`
    },
    lumiere: {
      title: 'LUMIÈRE｜スキンケア LP コンセプト',
      titleEn: 'LUMIÈRE｜Sensitive Skincare LP Concept',
      titleFr: 'LUMIÈRE｜Concept LP Soins de la peau sensible',
      subtitle: 'Web Design / UI Design / Concept Work',
      html: `
    <div class="mwork">

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/web/original/lumiere/overview.webp",
              "alt":{"ja":"LUMIÈRE LP｜全体構成","en":"LUMIÈRE LP — full layout","fr":"LP LUMIÈRE — structure complète"},
              "label":{"ja":"全体構成","en":"Overview","fr":"Vue d’ensemble"}
            },
            {
              "src":"../images/works/web/original/lumiere/mock_pc.webp",
              "alt":{"ja":"LUMIÈRE LP｜PC表示","en":"LUMIÈRE LP — desktop view","fr":"LP LUMIÈRE — affichage ordinateur"},
              "label":"PC"
            },
            {
              "src":"../images/works/web/original/lumiere/mock_tablet_SP.webp",
              "alt":{"ja":"LUMIÈRE LP｜Tablet&SP表示","en":"LUMIÈRE LP — tablet and mobile view","fr":"LP LUMIÈRE — affichage tablette et mobile"},
              "label":"Tablet & SP"
            },
            {
              "src":"../images/works/web/original/lumiere/extract.webp",
              "alt":{"ja":"LUMIÈRE LP｜一部抜粋","en":"LUMIÈRE LP — excerpt","fr":"LP LUMIÈRE — extrait"},
              "label":{"ja":"抜粋","en":"Excerpt","fr":"Extrait"}
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/web/original/lumiere/mock_pc.webp"
            alt="LUMIÈRE LP｜PC表示">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          敏感肌・乾燥肌の方に向けた、低刺激スキンケアブランド「LUMIÈRE」のコンセプトLP制作。<br><br>
          「静かに、続くケア。」を軸に、<br>
          肌へのやさしさと上質感が両立する世界観を設計しました。<br>
          情報を詰め込みすぎず、余白・トーン・階層設計によって安心感を伝えることを重視しています。<br><br>
          本作品はデザイン設計段階のアウトプットとして、<br>
          レスポンシブ実装を想定したレイアウトと情報密度の調整までを行いました。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li>敏感肌向けに必要な「安心感」を、余白設計・トーン統一・コピーの抑制で表現</li>
            <li>清潔感と上質感の両立を目的に、明度の高い配色と柔らかな質感（布・光）を採用</li>
            <li>情報は「思想 → 根拠（成分/約束） → 悩み別提案 → ラインナップ」の順で段階的に提示</li>
            <li>レスポンシブ実装を前提に、SPでは要素の優先順位と情報密度が破綻しないよう調整</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>要件整理</strong>：敏感肌層が重視する不安要素（刺激・継続性・信頼）を整理</li>
            <li><strong>構成設計</strong>：コンセプトで共感を作り、次に根拠提示で安心感を補強</li>
            <li><strong>UI設計</strong>：余白・整列・文字サイズの抑制で、やさしい読後感を設計</li>
            <li><strong>実装想定</strong>：レスポンシブ時の崩れやすいブロック（図解/カード/表）を想定して配置調整</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>使用ツール</dt>
              <dd>Figma / Photoshop</dd>
              <dt>制作範囲</dt>
              <dd>LP構成 / UIデザイン / レスポンシブ設計（デザイン）</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          A concept LP for "LUMIÈRE," a low-irritation skincare brand for sensitive and dry skin.<br><br>
          Built around "Quiet care that lasts,"<br>
          the design balances gentleness to the skin with a refined sense of quality.<br>
          Rather than overloading with information, the focus is on conveying reassurance through whitespace, tone, and hierarchy.<br><br>
          As a design-stage output, this work also includes layout and information-density adjustments planned for responsive implementation.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Design Focus</h3>
          <ul>
            <li>Expressed trust and gentleness through spacing, restrained copy, and consistent tone</li>
            <li>Balanced cleanliness and premium feel using high-key colors and soft textures (light, fabric)</li>
            <li>Structured content progressively: concept → proof (ingredients/promises) → concerns → lineup</li>
            <li>Planned layouts with responsive behavior in mind, especially for information density on mobile</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Brief Definition</strong>: Identified key anxieties for sensitive-skin users (irritation, continuity, trust)</li>
            <li><strong>Structure Planning</strong>: Built empathy with concept, then reinforced reassurance with evidence</li>
            <li><strong>UI Design</strong>: Designed a gentle reading experience through spacing, alignment, and typography</li>
            <li><strong>Implementation Planning</strong>: Adjusted layout considering responsive risks (cards, diagrams, tables)</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Tools</dt>
              <dd>Figma / Photoshop</dd>
              <dt>Scope</dt>
              <dd>LP structure / UI design / Responsive layout planning</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          Une LP conceptuelle pour « LUMIÈRE », une marque de soins peu irritants pour peaux sensibles et sèches.<br><br>
          Construit autour de « Un soin apaisant qui dure »,<br>
          le design allie douceur pour la peau et sentiment de qualité raffinée.<br>
          Plutôt que de surcharger l'information, l'accent est mis sur la transmission d'un sentiment de sérénité par l'espace blanc, la tonalité et la hiérarchie.<br><br>
          En tant que production de l'étape de conception, ce travail comprend aussi les ajustements de mise en page et de densité d'information prévus pour une implémentation responsive.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception</h3>
          <ul>
            <li>Confiance et douceur exprimées par l'espacement, un texte sobre et une tonalité cohérente</li>
            <li>Équilibre entre propreté et sentiment premium grâce à des couleurs claires et des textures douces (lumière, tissu)</li>
            <li>Contenu structuré progressivement : concept → preuves (ingrédients/engagements) → préoccupations → gamme</li>
            <li>Mises en page pensées pour le responsive, notamment la densité d'information sur mobile</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Cahier des charges</strong> : identification des préoccupations clés pour peaux sensibles (irritation, continuité, confiance)</li>
            <li><strong>Conception de la structure</strong> : empathie créée par le concept, puis réassurance renforcée par les preuves</li>
            <li><strong>Design UI</strong> : expérience de lecture douce conçue via l'espacement, l'alignement et la typographie</li>
            <li><strong>Planification de l'implémentation</strong> : mise en page ajustée en tenant compte des risques responsive (cartes, schémas, tableaux)</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Outils</dt>
              <dd>Figma / Photoshop</dd>
              <dt>Périmètre</dt>
              <dd>Structure LP / Design UI / Planification responsive</dd>
            </dl>
          </div>
        </div>
      </div>

    </div>`
    },
    still_air: {
      title: 'STILL AIR｜お香ブランド LP コンセプト',
      titleEn: 'STILL AIR｜Incense Brand LP Concept',
      titleFr: "STILL AIR｜Concept LP Marque d'encens",
      subtitle: 'Web Design / UI Design / Concept Work',
      html: `
    <div class="mwork">

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/web/original/still-air/overview.webp",
              "alt":{"ja":"STILL AIR LP｜全体構成","en":"STILL AIR LP — full layout","fr":"LP STILL AIR — structure complète"},
              "label":{"ja":"全体構成","en":"Overview","fr":"Vue d’ensemble"}
            },
            {
              "src":"../images/works/web/original/still-air/mock_pc.webp",
              "alt":{"ja":"STILL AIR LP｜PC表示","en":"STILL AIR LP — desktop view","fr":"LP STILL AIR — affichage ordinateur"},
              "label":"PC"
            },
            {
              "src":"../images/works/web/original/still-air/mock_tablet_SP.webp",
              "alt":{"ja":"STILL AIR LP｜Tablet&SP表示","en":"STILL AIR LP — tablet and mobile view","fr":"LP STILL AIR — affichage tablette et mobile"},
              "label":"Tablet & SP"
            },
            {
              "src":"../images/works/web/original/still-air/extract.webp",
              "alt":{"ja":"STILL AIR LP｜一部抜粋","en":"STILL AIR LP — excerpt","fr":"LP STILL AIR — extrait"},
              "label":{"ja":"抜粋","en":"Excerpt","fr":"Extrait"}
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/web/original/still-air/mock_pc.webp"
            alt="STILL AIR LP｜PC表示">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          思考や作業に集中する時間を大切にする人に向けた、<br>
          お香ブランド「STILL AIR」のコンセプトLP制作。<br><br>
          香りを“気分を高める演出”ではなく、<br>
          空間と思考を静かに整えるための環境要素として再定義し、<br>
          実装を想定した情報設計と余白設計を軸に世界観を構築しました。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li>余白・行間・色数を抑え、思考を妨げない静かなトーンを設計</li>
            <li>FVでは購買訴求を行わず、世界観への没入を最優先</li>
            <li>縦書きコピーと煙のモチーフで「時間の流れ」を視覚化</li>
            <li>レスポンシブ実装を前提に、画面幅ごとに情報密度を調整</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>コンセプト設計</strong>：香りの役割を「集中を整える環境要素」として再定義</li>
            <li><strong>構成設計</strong>：FV→思想提示→シーン提案→クロージングの時間軸構成</li>
            <li><strong>UI設計</strong>：スクロール体験と情報開示順を意識したレイアウト設計</li>
            <li><strong>実装想定</strong>：レスポンシブ対応・演出の実現性を考慮してデザインを調整</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>使用ツール</dt>
              <dd>Figma / Photoshop</dd>
              <dt>制作範囲</dt>
              <dd>LP構成 / UIデザイン / レスポンシブ設計（デザイン）</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          A concept LP for "STILL AIR," an incense brand for people who value focused time for thinking and working.<br><br>
          Rather than treating scent as a way to "elevate the mood,"<br>
          it was redefined as an environmental element that quietly settles space and mind,<br>
          building the world through information design and whitespace planned with implementation in mind.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Design Focus</h3>
          <ul>
            <li>Designed a calm visual tone using generous spacing and restrained color palette</li>
            <li>Prioritized immersion into the brand world by avoiding direct sales messaging in the hero section</li>
            <li>Visualized the passage of time through vertical typography and smoke motifs</li>
            <li>Planned layouts with responsiveness and implementation feasibility in mind</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Concept Definition</strong>: Redefined incense as an environmental element for mental focus</li>
            <li><strong>Structure Planning</strong>: Designed a time-based flow from concept to usage scenes</li>
            <li><strong>UI Design</strong>: Planned layouts focusing on scroll experience and information hierarchy</li>
            <li><strong>Implementation Planning</strong>: Considered responsive behavior and motion feasibility</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Tools</dt>
              <dd>Figma / Photoshop</dd>
              <dt>Scope</dt>
              <dd>LP structure / UI design / Responsive layout planning</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          Une LP conceptuelle pour « STILL AIR », une marque d'encens pour les personnes qui accordent de l'importance à un temps de concentration pour penser et travailler.<br><br>
          Plutôt que de traiter le parfum comme un moyen de « rehausser l'humeur »,<br>
          il a été redéfini comme un élément environnemental qui apaise calmement l'espace et l'esprit,<br>
          construisant l'univers autour d'une architecture de l'information et d'un espace blanc pensés pour l'implémentation.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception</h3>
          <ul>
            <li>Ton visuel calme conçu grâce à un espacement généreux et une palette de couleurs sobre</li>
            <li>Immersion dans l'univers de marque privilégiée en évitant tout message de vente direct dans le hero</li>
            <li>Écoulement du temps visualisé par une typographie verticale et des motifs de fumée</li>
            <li>Mises en page pensées pour la réactivité et la faisabilité de l'implémentation</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Définition du concept</strong> : encens redéfini comme élément environnemental pour la concentration</li>
            <li><strong>Conception de la structure</strong> : parcours temporel du concept aux scènes d'usage</li>
            <li><strong>Design UI</strong> : mise en page pensée pour l'expérience de défilement et la hiérarchie de l'information</li>
            <li><strong>Planification de l'implémentation</strong> : comportement responsive et faisabilité des animations pris en compte</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Outils</dt>
              <dd>Figma / Photoshop</dd>
              <dt>Périmètre</dt>
              <dd>Structure LP / Design UI / Planification responsive</dd>
            </dl>
          </div>
        </div>
      </div>

    </div>`
    },
    uru_hada: {
      title: '潤肌（URU-HADA）導入美容液｜Concept Work',
      titleEn: 'URU-HADA｜Introductory Beauty Serum Concept Work',
      titleFr: 'URU-HADA｜Sérum de beauté d\'introduction — Concept Work',
      subtitle: 'Branding / Advertising Design',
      html: `
    <div class="mwork">

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/uru-hada/1200x628.webp",
              "alt":{"ja":"潤肌（URU-HADA）導入美容液｜1200x628（SNS広告用）","en":"URU-HADA introductory beauty serum — 1200x628 (social ad)","fr":"Sérum de beauté d’introduction URU-HADA — 1200x628 (pub réseaux sociaux)"},
              "label":{"ja":"1200x628（SNS広告用）","en":"1200x628 (Social Ad)","fr":"1200x628 (Pub réseaux sociaux)"}
            },
            {
              "src":"../images/works/design/original/uru-hada/300x250.webp",
              "alt":{"ja":"潤肌（URU-HADA）導入美容液｜300x250（Web広告用）","en":"URU-HADA introductory beauty serum — 300x250 (web ad)","fr":"Sérum de beauté d’introduction URU-HADA — 300x250 (pub Web)"},
              "label":{"ja":"300x250（Web広告用）","en":"300x250 (Web Ad)","fr":"300x250 (Pub Web)"}
            },
            {
              "src":"../images/works/design/original/uru-hada/logo.webp",
              "alt":{"ja":"潤肌（URU-HADA）ロゴ","en":"URU-HADA — logo","fr":"URU-HADA — logo"},
              "label":{"ja":"ロゴ","en":"Logo","fr":"Logo"}
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/design/original/uru-hada/1200x628.webp"
            alt="潤肌（URU-HADA）導入美容液｜1200x628（SNS広告用）">
        </figure>
      </section>

      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          仕事や生活の忙しさから、肌の変化が気になり始める<br>
          20代後半〜30代女性を想定した導入美容液ブランドのコンセプトワーク。<br><br>
          「10年後の肌に、今日のご褒美を。」を軸に、<br>
          透明感と上質感を大切にしたビジュアル設計を行いました。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li>透明感・清潔感・オーガニック感を軸に、自分のために選びたくなる上質なトーンを設計</li>
            <li>余白を活かし、視線を「ビジュアル → コピー → ロゴ」へ自然に誘導</li>
            <li>サイズ違いでも印象が崩れないよう、情報量と配置のバランスを調整</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>要件整理</strong>：ターゲットの生活背景とセルフギフトの訴求軸を整理</li>
            <li><strong>構成設計</strong>：視線誘導と情報密度を調整し、情緒が伝わる構成に設計</li>
            <li><strong>ビジュアル設計</strong>：透明感と上質感を両立するトーンを統一</li>
            <li><strong>仕上げ</strong>：余白・整列・可読性のバランスを最終調整</li>
          </ol>

          <div class="mwork__note">
              <dl>
                <dt>使用ツール</dt>
                <dd>Illustrator / Photoshop（必要に応じて調整）</dd>
                <dt>制作範囲</dt>
                <dd>ロゴ / Web広告バナー（1200x628、300x250）</dd>
              </dl>
            </div>
          </div>
        </div>

        <!-- EN -->
        <div class="mwork__langblock" data-langblock="en" hidden>
          <p class="mwork__lead">
            Concept work for a pre-serum brand imagined for women in their late 20s to 30s<br>
            who are starting to notice skin changes from the busyness of work and life.<br><br>
            Built around "A treat today for the skin of ten years from now,"<br>
            the visual design places importance on transparency and a refined sense of quality.
          </p>
          <div class="mwork__divider mwork__points">
            <h3>Design Focus</h3>
            <ul>
              <li>Established a refined tone centered on clarity, cleanliness, and organic sensibility</li>
              <li>Used generous spacing to guide attention from visual to copy and logo naturally</li>
              <li>Balanced information density to maintain a consistent impression across multiple sizes</li>
            </ul>
          </div>

          <div class="mwork__process">
            <h3>Process</h3>
            <ol>
              <li><strong>Brief Definition</strong>: Analyzed lifestyle context and self-gifting motivation of the target audience</li>
              <li><strong>Layout Planning</strong>: Designed visual flow and information density to convey emotional value</li>
              <li><strong>Visual Design</strong>: Unified tone to balance transparency with a sense of premium quality</li>
              <li><strong>Refinement</strong>: Adjusted spacing, alignment, and readability for final polish</li>
            </ol>

            <div class="mwork__note">
              <dl>
                <dt>Tools</dt>
                <dd>Illustrator / Photoshop (as needed)</dd>
                <dt>Scope</dt>
                <dd>Logo / Web advertising banners (1200x628, 300x250)</dd>
              </dl>
            </div>
          </div>
        </div>

        <!-- FR -->
        <div class="mwork__langblock" data-langblock="fr" hidden>
          <p class="mwork__lead">
            Travail conceptuel pour une marque de sérum préparateur imaginée pour les femmes de la fin de la vingtaine à la trentaine<br>
            qui commencent à remarquer des changements cutanés dus au rythme du travail et de la vie.<br><br>
            Construit autour de « Une récompense aujourd'hui pour la peau de dans dix ans »,<br>
            le design visuel accorde de l'importance à la transparence et à un sentiment de qualité raffinée.
          </p>
          <div class="mwork__divider mwork__points">
            <h3>Axes de conception</h3>
            <ul>
              <li>Ton raffiné conçu autour de la transparence, de la propreté et d'une sensibilité organique</li>
              <li>Espacement généreux utilisé pour guider naturellement le regard du visuel vers le texte puis le logo</li>
              <li>Densité d'information équilibrée pour conserver une impression cohérente sur plusieurs formats</li>
            </ul>
          </div>

          <div class="mwork__process">
            <h3>Processus</h3>
            <ol>
              <li><strong>Cahier des charges</strong> : analyse du contexte de vie et de la motivation d'auto-cadeau du public cible</li>
              <li><strong>Conception de la mise en page</strong> : flux visuel et densité d'information conçus pour transmettre une valeur émotionnelle</li>
              <li><strong>Design visuel</strong> : tonalité unifiée alliant transparence et sentiment de qualité premium</li>
              <li><strong>Finition</strong> : espacement, alignement et lisibilité ajustés pour la touche finale</li>
            </ol>

            <div class="mwork__note">
              <dl>
                <dt>Outils</dt>
                <dd>Illustrator / Photoshop (selon besoin)</dd>
                <dt>Périmètre</dt>
                <dd>Logo / Bannières publicitaires web (1200x628, 300x250)</dd>
              </dl>
            </div>
          </div>
        </div>`
    },
    business_statistics: {
      title: 'ゼロから学ぶ、ビジネス統計学オンライン講座｜Concept Work',
      titleEn: 'Business Statistics From Scratch｜Online Course Concept Work',
      titleFr: 'Statistiques appliquées au business, à partir de zéro｜Concept Work',
      subtitle: 'Logo / Web Banner（情報設計・販促）',
      subtitleEn: 'Logo / Web Banner (Information Design & Promotion)',
      subtitleFr: "Logo / Bannière Web (Conception de l'information et promotion)",
      html: `
  <div class="mwork">

    <section class="mwork__media" data-gallery>
      <figure class="modal__figure"
        data-set='[
          {
            "src":"../images/works/design/original/business-statistics/1080x1080.webp",
            "alt":{"ja":"ゼロから学ぶ、ビジネス統計学オンライン講座｜1080x1080（SNS広告用）","en":"Business Statistics From Scratch online course — 1080x1080 (social ad)","fr":"Cours en ligne Statistiques appliquées au business à partir de zéro — 1080x1080 (pub réseaux sociaux)"},
            "label":{"ja":"1080x1080（SNS広告用）","en":"1080x1080 (Social Ad)","fr":"1080x1080 (Pub réseaux sociaux)"}
          },
          {
            "src":"../images/works/design/original/business-statistics/728x90.webp",
            "alt":{"ja":"ゼロから学ぶ、ビジネス統計学オンライン講座｜728x90（Web広告 ビッグバナー）","en":"Business Statistics From Scratch online course — 728x90 (web ad, big banner)","fr":"Cours en ligne Statistiques appliquées au business à partir de zéro — 728x90 (pub Web, grande bannière)"},
            "label":{"ja":"728x90（Web広告用）","en":"728x90 (Web Ad)","fr":"728x90 (Pub Web)"}
          },
          {
            "src":"../images/works/design/original/business-statistics/logo.webp",
            "alt":{"ja":"ゼロから学ぶ、ビジネス統計学オンライン講座｜ロゴ","en":"Business Statistics From Scratch online course — logo","fr":"Cours en ligne Statistiques appliquées au business à partir de zéro — logo"},
            "label":{"ja":"ロゴ","en":"Logo","fr":"Logo"}
          }
        ]'>

        <img class="mwork__img"
          src="../images/works/design/original/business-statistics/1080x1080.webp"
          alt="ゼロから学ぶ、ビジネス統計学オンライン講座｜1080x1080（SNS広告用）">
      </figure>
    </section>

    <!-- JP -->
    <div class="mwork__langblock" data-langblock="jp">
      <p class="mwork__lead">
        統計やデータ分析に苦手意識を持つビジネスパーソン向けに、<br>
        「難しそう」という心理的ハードルを下げつつ、<br>
        損なわないトーンで設計したオンライン講座のロゴ・広告デザイン。<br><br>
        Web広告 / SNS投稿など用途に応じたサイズ展開でも、情報の伝わり方が崩れない構成を意識しました。
      </p>
      <div class="mwork__divider mwork__points">
        <h3>設計ポイント</h3>
        <ul>
          <li>「難しそう」を感じさせないため、要素を整理し<strong>視認性の高い情報設計</strong>に統一</li>
          <li>堅くなりすぎない余白と図版モチーフで、<strong>親しみやすさと信頼感</strong>のバランスを調整</li>
          <li>用途別サイズでも破綻しないよう、<strong>見出し・補足・CTAの優先順位</strong>を固定して展開</li>
        </ul>
      </div>

      <div class="mwork__process">
        <h3>制作プロセス</h3>
        <ol>
          <li><strong>要件整理</strong>：ターゲットの心理的ハードルと、媒体（Web / SNS）での見え方を整理</li>
          <li><strong>構成設計</strong>：コピー階層と視線誘導を設計し、短時間で内容が伝わる情報密度に調整</li>
          <li><strong>ロゴ設計</strong>：講座の信頼性を担保しつつ、硬すぎない印象のシンボル・字組みに整える</li>
          <li><strong>展開・仕上げ</strong>：728×90 / 1080×1080へ最適化し、整列・余白・可読性を最終調整</li>
        </ol>

        <div class="mwork__note">
          <dl>
            <dt>使用ツール</dt>
            <dd>Illustrator / Photoshop（必要に応じて調整）</dd>
            <dt>制作範囲</dt>
            <dd>ロゴ / Web広告バナー（728x90、1080x1080）</dd>
          </dl>
        </div>
      </div>
    </div>

    <!-- EN -->
    <div class="mwork__langblock" data-langblock="en" hidden>
      <p class="mwork__lead">
        Logo and ad design for an online course aimed at business people who feel intimidated by statistics and data analysis,<br>
        lowering the psychological barrier of "this looks difficult"<br>
        while keeping a tone that doesn't undercut credibility.<br><br>
        Designed so the message stays clear even when resized for different uses — web ads, social posts, and more.
      </p>
      <div class="mwork__divider mwork__points">
        <h3>Design Focus</h3>
        <ul>
          <li>Simplified visual structure to reduce the perceived difficulty of statistics and data analysis</li>
          <li>Balanced approachability and credibility through controlled spacing and diagram-inspired motifs</li>
          <li>Fixed hierarchy between headline, supporting text, and call-to-action to ensure consistency across formats</li>
        </ul>
      </div>

      <div class="mwork__process">
        <h3>Process</h3>
        <ol>
          <li><strong>Brief Definition</strong>: Identified psychological barriers and platform-specific viewing conditions (Web / SNS)</li>
          <li><strong>Layout Planning</strong>: Designed copy hierarchy and visual flow for quick comprehension</li>
          <li><strong>Logo Design</strong>: Developed a symbol and typography that feel trustworthy without appearing overly academic</li>
          <li><strong>Adaptation & Refinement</strong>: Optimized layouts for 728×90 and 1080×1080, adjusting spacing and readability</li>
        </ol>

        <div class="mwork__note">
          <dl>
            <dt>Tools</dt>
            <dd>Illustrator / Photoshop (as needed)</dd>
            <dt>Scope</dt>
            <dd>Logo / Web advertising banners (728x90, 1080x1080)</dd>
          </dl>
        </div>
      </div>
    </div>

    <!-- FR -->
    <div class="mwork__langblock" data-langblock="fr" hidden>
      <p class="mwork__lead">
        Design de logo et de publicité pour un cours en ligne destiné aux professionnels intimidés par les statistiques et l'analyse de données,<br>
        réduisant la barrière psychologique du « ça a l'air difficile »<br>
        tout en conservant un ton qui ne nuit pas à la crédibilité.<br><br>
        Conçu pour que le message reste clair même redimensionné pour différents usages — publicités web, posts sociaux, et plus.
      </p>
      <div class="mwork__divider mwork__points">
        <h3>Axes de conception</h3>
        <ul>
          <li>Structure visuelle simplifiée pour réduire la difficulté perçue des statistiques et de l'analyse de données</li>
          <li>Accessibilité et crédibilité équilibrées grâce à un espacement maîtrisé et des motifs inspirés de diagrammes</li>
          <li>Hiérarchie fixée entre titre, texte de support et appel à l'action pour garantir la cohérence sur tous les formats</li>
        </ul>
      </div>

      <div class="mwork__process">
        <h3>Processus</h3>
        <ol>
          <li><strong>Cahier des charges</strong> : identification des barrières psychologiques et des conditions d'affichage par plateforme (Web / SNS)</li>
          <li><strong>Conception de la mise en page</strong> : hiérarchie du texte et flux visuel conçus pour une compréhension rapide</li>
          <li><strong>Design du logo</strong> : symbole et typographie conçus pour inspirer confiance sans paraître trop académiques</li>
          <li><strong>Adaptation et finition</strong> : mise en page optimisée pour 728×90 et 1080×1080, espacement et lisibilité ajustés</li>
        </ol>

        <div class="mwork__note">
          <dl>
            <dt>Outils</dt>
            <dd>Illustrator / Photoshop (selon besoin)</dd>
            <dt>Périmètre</dt>
            <dd>Logo / Bannières publicitaires web (728x90, 1080x1080)</dd>
          </dl>
        </div>
      </div>
    </div>`
    },
    pizzavita: {
      title: '本格窯焼きピザ「PIZZA VITA」',
      titleEn: 'Authentic Wood-Fired Pizza "PIZZA VITA"',
      titleFr: 'Pizza au feu de bois authentique « PIZZA VITA »',
      subtitle: 'Concept Work / Action・Promotion Design',
      html: `
    <div class="mwork">

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/pizzavita/1200x628.webp",
              "alt":{"ja":"本格窯焼きピザ「PIZZA VITA」｜1200x628（SNS広告用）","en":"Authentic wood-fired pizza PIZZA VITA — 1200x628 (social ad)","fr":"Pizza au feu de bois authentique PIZZA VITA — 1200x628 (pub réseaux sociaux)"},
              "label":{"ja":"1200x628（SNS広告用）","en":"1200x628 (Social Ad)","fr":"1200x628 (Pub réseaux sociaux)"}
            },
            {
              "src":"../images/works/design/original/pizzavita/728x90.webp",
              "alt":{"ja":"本格窯焼きピザ「PIZZA VITA」｜728x90（ビッグバナー）","en":"Authentic wood-fired pizza PIZZA VITA — 728x90 (big banner)","fr":"Pizza au feu de bois authentique PIZZA VITA — 728x90 (grande bannière)"},
              "label":{"ja":"728x90（ビッグバナー）","en":"728x90 (Big Banner)","fr":"728x90 (Grande bannière)"}
            },
            {
              "src":"../images/works/design/original/pizzavita/336x280.webp",
              "alt":{"ja":"本格窯焼きピザ「PIZZA VITA」｜336x280（レクタングル）","en":"Authentic wood-fired pizza PIZZA VITA — 336x280 (rectangle)","fr":"Pizza au feu de bois authentique PIZZA VITA — 336x280 (rectangle)"},
              "label":{"ja":"336x280（レクタングル）","en":"336x280 (Rectangle)","fr":"336x280 (Rectangle)"}
            },
            {
              "src":"../images/works/design/original/pizzavita/logo.webp",
              "alt":{"ja":"本格窯焼きピザ「PIZZA VITA」ロゴ","en":"Authentic wood-fired pizza PIZZA VITA — logo","fr":"Pizza au feu de bois authentique PIZZA VITA — logo"},
              "label":{"ja":"ロゴ","en":"Logo","fr":"Logo"}
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/design/original/pizzavita/1200x628.webp"
            alt="本格窯焼きピザ「PIZZA VITA」｜1200x628（SNS広告用）">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          週末の食卓に、少し特別な時間を。<br>
          本格窯焼きピザのデリバリーサービス「PIZZA VITA」を想定した広告ビジュアル。<br><br>
          チーズの伸びや湯気といったシズル感を軸に、<br>
          食欲を喚起する暖色トーンで構成し、<br>
          視線が自然にCTAへ流れるレイアウトを設計しました。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li>“焼きたて感”が伝わるよう、チーズの伸び・湯気の流れを主役にして食欲喚起を強化</li>
            <li>暖色トーンで統一しつつ、文字は高コントラストにして可読性と勢いを両立</li>
            <li>キャッチ → シズル → CTAの順に視線が落ちるよう、要素サイズと配置のリズムを設計</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>目的整理</strong>：週末の“ちょい特別”を、直感的に伝える訴求軸を設定</li>
            <li><strong>要素設計</strong>：キャッチ・シズル・CTAの優先順位を決め、最短で伝わる構図に構成</li>
            <li><strong>トーン調整</strong>：暖色ベースで食欲を刺激し、湯気や光の演出で温度感を付与</li>
            <li><strong>サイズ展開</strong>：1200x628 / 728x90 / 336x280 で視認性が崩れないよう再配置</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>使用ツール</dt>
              <dd>Illustrator / Photoshop（必要に応じて調整）</dd>
              <dt>制作範囲</dt>
              <dd>ロゴ / Web広告バナー（1200x628、728x90、336x280）</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          A little something special for the weekend table.<br>
          Ad visuals for an imagined wood-fired pizza delivery service, "PIZZA VITA."<br><br>
          Built around sizzling cues like stretchy cheese and rising steam,<br>
          composed in appetite-stirring warm tones,<br>
          with a layout designed to guide the eye naturally toward the call to action.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Design Focus</h3>
          <ul>
            <li>Emphasized a freshly baked feel through stretchy cheese and rising steam to stimulate appetite</li>
            <li>Unified warm color tones while maintaining high text contrast for clarity and energy</li>
            <li>Designed visual rhythm to guide attention from headline to sizzle imagery and finally to the call to action</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Concept Definition</strong>: Defined the appeal of a small weekend indulgence as the core message</li>
            <li><strong>Element Planning</strong>: Prioritized headline, sizzle visuals, and CTA for instant comprehension</li>
            <li><strong>Tone Adjustment</strong>: Used warm tones and light effects to convey heat and freshness</li>
            <li><strong>Multi-size Adaptation</strong>: Reorganized layouts to maintain readability across multiple banner formats</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Tools</dt>
              <dd>Illustrator / Photoshop (as needed)</dd>
              <dt>Scope</dt>
              <dd>Logo / Web advertising banners (1200x628, 728x90, 336x280)</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          Un petit moment spécial pour la table du week-end.<br>
          Visuels publicitaires pour un service de livraison de pizza au feu de bois imaginaire, « PIZZA VITA ».<br><br>
          Construit autour d'éléments appétissants comme le fromage filant et la vapeur montante,<br>
          composé dans des tons chauds qui stimulent l'appétit,<br>
          avec une mise en page conçue pour guider naturellement le regard vers l'appel à l'action.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception</h3>
          <ul>
            <li>Sensation de fraîcheur du four accentuée par le fromage filant et la vapeur montante pour stimuler l'appétit</li>
            <li>Tons chauds unifiés tout en conservant un contraste de texte élevé pour la clarté et l'énergie</li>
            <li>Rythme visuel conçu pour guider l'attention du titre vers les images appétissantes puis vers l'appel à l'action</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Définition du concept</strong> : petit plaisir du week-end défini comme message central</li>
            <li><strong>Planification des éléments</strong> : titre, visuels appétissants et CTA priorisés pour une compréhension instantanée</li>
            <li><strong>Ajustement de la tonalité</strong> : tons chauds et effets de lumière utilisés pour transmettre chaleur et fraîcheur</li>
            <li><strong>Adaptation multi-formats</strong> : mise en page réorganisée pour conserver la lisibilité sur plusieurs formats de bannière</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Outils</dt>
              <dd>Illustrator / Photoshop (selon besoin)</dd>
              <dt>Périmètre</dt>
              <dd>Logo / Bannières publicitaires web (1200x628, 728x90, 336x280)</dd>
            </dl>
          </div>
        </div>
      </div>`
    },
    v_couture: {
      title: 'V-COUTURE｜メタバースアバタースタイリスト',
      titleEn: 'V-COUTURE｜Metaverse Avatar Stylist',
      titleFr: "V-COUTURE｜Styliste d'avatar Metaverse",
      subtitle: 'Concept Work / Logo・Business Card Design（ブランディング）',
      html: `
    <div class="mwork">

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/v-couture/mockup.webp",
              "alt":{"ja":"V-COUTURE｜名刺モックアップ","en":"V-COUTURE — business card mockup","fr":"V-COUTURE — maquette de carte de visite"},
              "label":"Mockup"
            },
            {
              "src":"../images/works/design/original/v-couture/card-front.webp",
              "alt":{"ja":"V-COUTURE｜名刺 表","en":"V-COUTURE — business card, front","fr":"V-COUTURE — carte de visite, recto"},
              "label":"Business Card（Front）"
            },
            {
              "src":"../images/works/design/original/v-couture/card-back.webp",
              "alt":{"ja":"V-COUTURE｜名刺 裏","en":"V-COUTURE — business card, back","fr":"V-COUTURE — carte de visite, verso"},
              "label":"Business Card（Back）"
            },
            {
              "src":"../images/works/design/original/v-couture/logo.webp",
              "alt":{"ja":"V-COUTURE｜ロゴ","en":"V-COUTURE — logo","fr":"V-COUTURE — logo"},
              "label":"Logo"
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/design/original/v-couture/mockup.webp"
            alt="V-COUTURE｜名刺モックアップ">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          メタバース空間で活動するアバター・スタイリストを想定し、<br>
          「デジタルの自分を、もっと自由に」をコンセプトに<br>
          ロゴおよび名刺デザインを制作しました。<br><br>
          画面上での見え方も意識し、未来感と上品さのバランスを整えています。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li>頭文字の“V”をVネックのようなシャープなラインで構成し、人物を用いずに「スタイリング」を象徴</li>
            <li>ミニマルなグリッド表現と手書きロゴタイプを組み合わせ、デジタル×感性の両立を設計</li>
            <li>SNS導線（X / Discord）とQRを整理し、画面上でも読み取りやすい情報優先順位に調整</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>要件整理</strong>：ターゲット（VTuber / メタバースユーザー）と必須要素（屋号・SNS・QR）を定義</li>
            <li><strong>ロゴ設計</strong>：“V”の造形を衣服のラインに接続し、職能が伝わるシンボルへ抽象化</li>
            <li><strong>名刺設計</strong>：グリッドとグラデーションで世界観を構築し、表裏で役割（印象/情報）を分担</li>
            <li><strong>仕上げ</strong>：画面表示を想定して可読性を検証し、余白・整列・コントラストを最終調整</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>制作範囲</dt>
              <dd>ロゴ / 名刺（表・裏）/ モックアップ</dd>
              <dt>想定要素</dt>
              <dd>屋号 / 氏名（LUNA）/ X・Discord / ポートフォリオサイト / QR</dd>
              <dt>使用ツール</dt>
              <dd>Illustrator / Photoshop（必要に応じて調整）</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          Logo and business card design for an imagined avatar stylist active in the metaverse,<br>
          built around the concept "Your digital self, more free."<br><br>
          Designed with on-screen appearance in mind, balancing a futuristic feel with refinement.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Design Focus</h3>
          <ul>
            <li>Abstracted the initial “V” into a sharp, V-neck-inspired form to symbolize styling without using a human figure</li>
            <li>Combined a minimal grid language with a handwritten logotype to balance digital precision and sensibility</li>
            <li>Organized social links (X / Discord) and QR for strong on-screen readability and practical use</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Brief Definition</strong>: Defined target users and required elements (brand, socials, QR, website)</li>
            <li><strong>Logo Design</strong>: Built the “V” as an abstract clothing silhouette to express the profession of styling</li>
            <li><strong>Card Design</strong>: Developed a futuristic yet refined mood and split roles across front/back sides</li>
            <li><strong>Refinement</strong>: Tested on-screen legibility and finalized spacing, alignment, and contrast</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Scope</dt>
              <dd>Logo / Business card (front & back) / Mockup</dd>
              <dt>Assumed Elements</dt>
              <dd>Brand name / Name (LUNA) / X・Discord / Portfolio link / QR</dd>
              <dt>Tools</dt>
              <dd>Illustrator / Photoshop (as needed)</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          Design de logo et de carte de visite pour un(e) styliste d'avatars imaginaire actif(ve) dans le métavers,<br>
          construit autour du concept « Votre moi numérique, plus libre ».<br><br>
          Conçu en pensant à l'apparence à l'écran, équilibrant sensation futuriste et raffinement.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception</h3>
          <ul>
            <li>Initiale « V » transformée en une forme nette inspirée d'un col en V pour symboliser le stylisme sans recourir à une figure humaine</li>
            <li>Langage de grille minimaliste combiné à un logotype manuscrit pour équilibrer précision numérique et sensibilité</li>
            <li>Liens sociaux (X / Discord) et QR organisés pour une bonne lisibilité à l'écran et un usage pratique</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Cahier des charges</strong> : définition des utilisateurs cibles et des éléments requis (marque, réseaux sociaux, QR, site)</li>
            <li><strong>Design du logo</strong> : « V » construit comme une silhouette vestimentaire abstraite pour exprimer le métier de styliste</li>
            <li><strong>Design de la carte</strong> : ambiance futuriste et raffinée développée, rôles répartis entre recto et verso</li>
            <li><strong>Finition</strong> : lisibilité à l'écran testée, espacement, alignement et contraste finalisés</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Périmètre</dt>
              <dd>Logo / Carte de visite (recto-verso) / Maquette</dd>
              <dt>Éléments prévus</dt>
              <dd>Nom de marque / Nom (LUNA) / X・Discord / Lien portfolio / QR</dd>
              <dt>Outils</dt>
              <dd>Illustrator / Photoshop (selon besoin)</dd>
            </dl>
          </div>
        </div>
    </div>`
    },
    kamosu: {
      title: '醸す（KAMOSU）｜Restaurant Branding',
      titleEn: 'KAMOSU｜Restaurant Branding',
      titleFr: 'KAMOSU｜Identité de restaurant',
      subtitle: 'Concept Work / Business Card Design（和モダン・ラグジュアリー）',
      subtitleEn: 'Concept Work / Business Card Design (Modern Japanese Luxury)',
      subtitleFr: 'Concept Work / Design de carte de visite (Luxe japonais moderne)',
      html: `
    <div class="mwork">

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/kamosu/mockup.webp",
              "alt":{"ja":"醸す（KAMOSU）｜名刺モックアップ","en":"KAMOSU — business card mockup","fr":"KAMOSU — maquette de carte de visite"},
              "label":"Mockup"
            },
            {
              "src":"../images/works/design/original/kamosu/card-front.webp",
              "alt":{"ja":"醸す（KAMOSU）｜名刺 表（縦型）","en":"KAMOSU — business card, front (vertical)","fr":"KAMOSU — carte de visite, recto (format vertical)"},
              "label":"Business Card（Front）"
            },
            {
              "src":"../images/works/design/original/kamosu/card-back.webp",
              "alt":{"ja":"醸す（KAMOSU）｜名刺 裏（縦型）","en":"KAMOSU — business card, back (vertical)","fr":"KAMOSU — carte de visite, verso (format vertical)"},
              "label":"Business Card（Back）"
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/design/original/kamosu/mockup.webp"
            alt="醸す（KAMOSU）｜名刺モックアップ">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          予約困難な隠れ家「発酵」モダン・ビストロを想定し、<br>
          「微生物との対話」をコンセプトに名刺デザインを制作。<br><br>
          余白・和紙の質感・墨のにじみを軸に、<br>
          静かで凛とした佇まいと、格式と現代性のバランスを設計しました。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li>余白を大きく確保し、言葉よりも空気感が先に届く「静かな品格」を設計</li>
            <li>和紙テクスチャと墨のにじみで、“時間・変化・深み”を象徴するトーンに統一</li>
            <li>裏面に伝統文様を控えめに配置し、格式と現代性のバランスを調整</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>要件整理</strong>：ターゲット（美食家・富裕層）と必須要素（店名・氏名・連絡先）を定義</li>
            <li><strong>トーン設計</strong>：和紙・墨・縦組の要素を整理し、和モダン・ラグジュアリーの方向性を確定</li>
            <li><strong>レイアウト設計</strong>：表裏で役割（印象/情報）を分担し、視線の止まる位置を調整</li>
            <li><strong>仕上げ</strong>：余白・整列・文字組を最終調整し、静けさと可読性を両立</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>制作範囲</dt>
              <dd>名刺（縦型・表／裏）/ モックアップ</dd>
              <dt>必須要素</dt>
              <dd>店名 / 氏名（シェフ 佐藤 匠）/ 電話番号 / Instagram</dd>
              <dt>使用ツール</dt>
              <dd>Illustrator / Photoshop（必要に応じて調整）</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          Business card design for an imagined hard-to-book, hidden fermentation-focused modern bistro,<br>
          built around the concept "A dialogue with microorganisms."<br><br>
          Centered on negative space, washi-paper texture, and ink bleed,<br>
          the design balances a quiet, dignified presence with tradition and modern refinement.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Design Focus</h3>
          <ul>
            <li>Used generous negative space to communicate quiet prestige before any detailed reading</li>
            <li>Unified tone with washi-like texture and ink-bleed expression to suggest time, depth, and transformation</li>
            <li>Placed a subtle traditional pattern on the back side to balance heritage and modern refinement</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Brief Definition</strong>: Defined target audience and required information for a chef’s business card</li>
            <li><strong>Tone Setting</strong>: Established a modern-luxury Japanese direction using paper texture and ink nuance</li>
            <li><strong>Layout Planning</strong>: Split roles across front/back and refined the visual hierarchy</li>
            <li><strong>Refinement</strong>: Finalized spacing, alignment, and typography for calm readability</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Scope</dt>
              <dd>Logo / Business card (vertical, front & back) / Mockup</dd>
              <dt>Required Elements</dt>
              <dd>Restaurant name / Chef name / Phone / Instagram</dd>
              <dt>Tools</dt>
              <dd>Illustrator / Photoshop (as needed)</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          Design de carte de visite pour un bistro moderne caché, axé sur la fermentation et difficile à réserver, imaginé pour l'occasion,<br>
          construit autour du concept « Un dialogue avec les micro-organismes ».<br><br>
          Centré sur l'espace blanc, la texture du papier washi et les effets d'encre,<br>
          le design équilibre une présence calme et digne avec tradition et raffinement contemporain.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception</h3>
          <ul>
            <li>Espace blanc généreux utilisé pour communiquer un prestige discret avant même la lecture des détails</li>
            <li>Tonalité unifiée avec une texture façon washi et un effet d'encre pour suggérer le temps, la profondeur et la transformation</li>
            <li>Motif traditionnel discret placé au verso pour équilibrer héritage et raffinement moderne</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Cahier des charges</strong> : définition du public cible et des informations requises pour la carte du chef</li>
            <li><strong>Définition de la tonalité</strong> : direction japonaise moderne et luxueuse établie via texture papier et nuances d'encre</li>
            <li><strong>Conception de la mise en page</strong> : rôles répartis entre recto et verso, hiérarchie visuelle affinée</li>
            <li><strong>Finition</strong> : espacement, alignement et typographie finalisés pour une lisibilité apaisée</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Périmètre</dt>
              <dd>Carte de visite (verticale, recto-verso) / Maquette</dd>
              <dt>Éléments requis</dt>
              <dd>Nom du restaurant / Nom du chef / Téléphone / Instagram</dd>
              <dt>Outils</dt>
              <dd>Illustrator / Photoshop (selon besoin)</dd>
            </dl>
          </div>
        </div>
    </div>`
    },
    aoi_architects: {
      title: 'AOI Architects（株式会社 碧 設計事務所）',
      titleEn: 'AOI Architects (Aoi Design Office Co., Ltd.)',
      titleFr: "AOI Architects (Cabinet d'architecture Aoi)",
      subtitle: 'Concept Work / Logo・Business Card Design（サステナブル建築）',
      subtitleEn: 'Concept Work / Logo & Business Card Design (Sustainable Architecture)',
      subtitleFr: 'Concept Work / Logo et carte de visite (Architecture durable)',
      html: `
    <div class="mwork">

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/aoi-architects/mockup.webp",
              "alt":{"ja":"AOI Architects｜名刺モックアップ","en":"AOI Architects — business card mockup","fr":"AOI Architects — maquette de carte de visite"},
              "label":"Mockup"
            },
            {
              "src":"../images/works/design/original/aoi-architects/card-front.webp",
              "alt":{"ja":"AOI Architects｜名刺 表","en":"AOI Architects — business card, front","fr":"AOI Architects — carte de visite, recto"},
              "label":"Business Card（Front）"
            },
            {
              "src":"../images/works/design/original/aoi-architects/card-back.webp",
              "alt":{"ja":"AOI Architects｜名刺 裏","en":"AOI Architects — business card, back","fr":"AOI Architects — carte de visite, verso"},
              "label":"Business Card（Back）"
            },
            {
              "src":"../images/works/design/original/aoi-architects/logo.webp",
              "alt":{"ja":"AOI Architects｜ロゴ","en":"AOI Architects — logo","fr":"AOI Architects — logo"},
              "label":"Logo"
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/design/original/aoi-architects/mockup.webp"
            alt="AOI Architects｜名刺モックアップ">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          次世代型サステナブル建築事務所を想定したロゴ・名刺デザイン。<br>
          「100年後の風景をつくる」という理念を軸に、<br>
          誠実なトーンを設計しました。<br><br>
          紙ポートフォリオの全体トーンには採用せずお蔵入りとなった案ですが、<br>
          Webでは試作の幅として掲載しています。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li>屋根や構造線を想起させるミニマルなラインで、建築的な造形を抽象化</li>
            <li>余白と単色設計を軸に、信頼感・誠実さが先に届く情報トーンに調整</li>
            <li>紙質を主役にできる前提で、再生紙・バガス紙と相性の良い印象に設計</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>要件整理</strong>：理念（100年後の風景）と、必須要素（肩書き・住所・URL・QR）を定義</li>
            <li><strong>ロゴ設計</strong>：建築の線・構造感をミニマルな線画に落とし込み、過度に装飾しない方向へ</li>
            <li><strong>名刺設計</strong>：可読性を最優先に、情報の段組みと余白で“静けさ”を作る</li>
            <li><strong>仕上げ</strong>：印刷を想定して線幅・コントラスト・整列を調整し、実用性を担保</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>制作範囲</dt>
              <dd>ロゴ / 名刺（横型・表／裏）/ モックアップ</dd>
              <dt>必須要素</dt>
              <dd>ロゴ / 氏名 / 肩書き（代表取締役）/ 住所 / WebサイトURL / QR</dd>
              <dt>作業時間</dt>
              <dd>ロゴ：00:43:57 / 名刺：00:15:14</dd>
              <dt>使用ツール</dt>
              <dd>Illustrator / Photoshop（必要に応じて調整）</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          Logo and business card design for an imagined next-generation sustainable architecture firm.<br>
          Built around the philosophy "Creating the landscape of 100 years from now,"<br>
          the design conveys a sincere, trustworthy tone.<br><br>
          This concept wasn't adopted for the overall tone of the print portfolio,<br>
          but is shown here on the web as a range of exploratory work.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Design Focus</h3>
          <ul>
            <li>Abstracted architectural forms using minimal lines reminiscent of roofs and structural frames</li>
            <li>Built a calm, trustworthy tone through generous spacing and a monochrome information layout</li>
            <li>Designed with tactile paper stocks in mind (recycled or bagasse paper), letting material quality lead</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Brief Definition</strong>: Defined the core philosophy and required information (title, address, URL, QR)</li>
            <li><strong>Logo Design</strong>: Developed a restrained line-based mark inspired by architectural structure</li>
            <li><strong>Card Layout</strong>: Prioritized readability and calm hierarchy through spacing and alignment</li>
            <li><strong>Refinement</strong>: Adjusted stroke weight, contrast, and grid alignment with print use in mind</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Scope</dt>
              <dd>Logo / Business card (horizontal, front & back) / Mockup</dd>
              <dt>Required Elements</dt>
              <dd>Logo / Name / Title / Address / Website URL / QR</dd>
              <dt>Time Spent</dt>
              <dd>Logo: 00:43:57 / Card: 00:15:14</dd>
              <dt>Tools</dt>
              <dd>Illustrator / Photoshop (as needed)</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          Design de logo et de carte de visite pour un cabinet d'architecture durable de nouvelle génération imaginé pour l'occasion.<br>
          Construit autour de la philosophie « Créer le paysage des 100 prochaines années »,<br>
          le design transmet un ton sincère et digne de confiance.<br><br>
          Ce concept n'a pas été retenu pour la tonalité globale du portfolio papier,<br>
          mais il est présenté ici sur le web comme un exemple de l'étendue des explorations.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception</h3>
          <ul>
            <li>Formes architecturales abstraites grâce à des lignes minimales évoquant toits et structures</li>
            <li>Tonalité calme et digne de confiance construite par un espacement généreux et une mise en page monochrome</li>
            <li>Conçu en pensant à des papiers tactiles (recyclé ou bagasse), laissant la qualité du matériau s'exprimer</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Cahier des charges</strong> : définition de la philosophie centrale et des informations requises (titre, adresse, URL, QR)</li>
            <li><strong>Design du logo</strong> : symbole sobre à base de lignes développé, inspiré de la structure architecturale</li>
            <li><strong>Mise en page de la carte</strong> : lisibilité priorisée, hiérarchie apaisée créée par l'espacement et l'alignement</li>
            <li><strong>Finition</strong> : épaisseur de trait, contraste et alignement ajustés en pensant à l'impression</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Périmètre</dt>
              <dd>Logo / Carte de visite (horizontale, recto-verso) / Maquette</dd>
              <dt>Éléments requis</dt>
              <dd>Logo / Nom / Titre / Adresse / URL du site / QR</dd>
              <dt>Temps passé</dt>
              <dd>Logo : 00:43:57 / Carte : 00:15:14</dd>
              <dt>Outils</dt>
              <dd>Illustrator / Photoshop (selon besoin)</dd>
            </dl>
          </div>
        </div>
    </div>`
    },
    loop_cafe: {
      title: 'Loop Cafe（ループ・カフェ）｜Concept Work',
      titleEn: 'Loop Cafe｜Concept Work',
      titleFr: 'Loop Cafe｜Concept Work',
      subtitle: 'Sustainable Branding / Logo & Applications',
      html: `
    <div class="mwork">

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/loop-cafe/logo.webp",
              "alt":{"ja":"Loop Cafe｜ロゴ","en":"Loop Cafe — logo","fr":"Loop Cafe — logo"},
              "label":{"ja":"ロゴ","en":"Logo","fr":"Logo"}
            },
            {
              "src":"../images/works/design/original/loop-cafe/mockup.webp",
              "alt":{"ja":"Loop Cafe｜展開イメージ（カップ・トート・看板）","en":"Loop Cafe — applications (cup, tote bag, signage)","fr":"Loop Cafe — déclinaisons (gobelet, tote bag, enseigne)"},
              "label":{"ja":"展開イメージ","en":"Application Mockup","fr":"Applications de la marque"}
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/design/original/loop-cafe/mockup.webp"
            alt="Loop Cafe｜展開イメージ（カップ・トート・看板）">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          「循環（Loop）」をテーマにした、<br>
          都市型サステナブルカフェのコンセプトワーク。<br>
          ミニマルでクリーン、<br>
          素材感が主役になるトーンを意識してロゴと展開例を制作しました。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li>“循環”を円の動きで表現し、コーヒーと自然要素をひとつに統合</li>
            <li>線を絞って、再生紙や布など<strong>素材の質感が主役</strong>になる前提で設計</li>
            <li>カップ・看板などの小さな面でも崩れない、単純な構造と余白バランス</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>要件整理</strong>：ターゲット（20〜30代）とトーン（クリーン/オーガニック）を定義</li>
            <li><strong>形の検討</strong>：循環を“記号っぽくしすぎず”カフェらしく落とし込む方向を探る</li>
            <li><strong>整形</strong>：線幅・余白・文字組を調整し、静かな存在感に寄せる</li>
            <li><strong>展開確認</strong>：カップ/トート/看板で見え方を確認し、バランスを微調整</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>制作範囲</dt>
              <dd>ロゴ / アプリケーション（カップ・トート・看板）</dd>
              <dt>使用ツール</dt>
              <dd>Illustrator / Photoshop（必要に応じて調整）</dd>
              <dt>備考</dt>
              <dd>自主制作（紙ポートフォリオ案として制作後、Web掲載向けに整理）</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          Concept work for an urban sustainable café,<br>
          built around the theme of "circulation (Loop)."<br>
          Minimal and clean,<br>
          the logo and applications were designed with a tone that lets material texture take the lead.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Design Notes</h3>
          <ul>
            <li>Built around a looping circle to suggest “circulation,” blended with coffee + organic cues</li>
            <li>Kept the mark minimal so paper/cloth texture can take the spotlight</li>
            <li>Designed to stay readable across small surfaces like cups and signage</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Brief</strong>: defined the audience and tone (clean, modern, organic)</li>
            <li><strong>Exploration</strong>: searched for a “loop” expression that feels café-like, not overly symbolic</li>
            <li><strong>Refinement</strong>: adjusted stroke, spacing, and typography for a calm presence</li>
            <li><strong>Applications</strong>: tested on cup/tote/sign mockups and fine-tuned balance</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Scope</dt>
              <dd>Logo / Applications (cup, tote bag, signage)</dd>
              <dt>Tools</dt>
              <dd>Illustrator / Photoshop (as needed)</dd>
              <dt>Note</dt>
              <dd>Personal work (originally for print portfolio, reorganized for web use)</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          Travail conceptuel pour un café urbain durable,<br>
          construit autour du thème de la « circulation (Loop) ».<br>
          Minimaliste et épuré,<br>
          le logo et ses déclinaisons ont été conçus avec un ton qui laisse la texture des matériaux prendre le devant.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception</h3>
          <ul>
            <li>Construit autour d'un cercle en boucle pour suggérer la « circulation », mêlé à des éléments café et organiques</li>
            <li>Symbole gardé minimal pour laisser la texture du papier/tissu occuper le devant de la scène</li>
            <li>Conçu pour rester lisible sur de petites surfaces comme les tasses et les enseignes</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Cahier des charges</strong> : public cible et tonalité définis (épuré, moderne, organique)</li>
            <li><strong>Exploration</strong> : recherche d'une expression de la « boucle » qui reste café, sans être trop symbolique</li>
            <li><strong>Finition</strong> : trait, espacement et typographie ajustés pour une présence calme</li>
            <li><strong>Déclinaisons</strong> : testé sur des maquettes de tasse/tote/enseigne, équilibre affiné</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Périmètre</dt>
              <dd>Logo / Déclinaisons (tasse, tote bag, enseigne)</dd>
              <dt>Outils</dt>
              <dd>Illustrator / Photoshop (selon besoin)</dd>
              <dt>Remarque</dt>
              <dd>Travail personnel (conçu à l'origine pour le portfolio papier, réorganisé pour le web)</dd>
            </dl>
          </div>
        </div>
      </div>

    </div>`
    },
    nexus_ai: {
      title: 'Nexus AI（ネクサス・エーアイ）',
      titleEn: 'Nexus AI',
      titleFr: 'Nexus AI',
      subtitle: 'Concept Work / Logo Design（Tech Startup Branding）',
      html: `
    <div class="mwork">

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/nexus-ai/logo.webp",
              "alt":{"ja":"Nexus AI｜ロゴ","en":"Nexus AI — logo","fr":"Nexus AI — logo"},
              "label":{"ja":"ロゴ","en":"Logo","fr":"Logo"}
            },
            {
              "src":"../images/works/design/original/nexus-ai/mockup.webp",
              "alt":{"ja":"Nexus AI｜展開モックアップ（アプリアイコン / Webヘッダー）","en":"Nexus AI — application mockups (app icon / web header)","fr":"Nexus AI — maquettes de déclinaison (icône d’application / bandeau web)"},
              "label":"Mockup"
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/design/original/nexus-ai/mockup.webp"
            alt="Nexus AI｜展開モックアップ（アプリアイコン / Webヘッダー）">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          クリエイターの創造性を拡張するAIツールを提供するテックスタートアップ<br>
          「Nexus AI」を想定したロゴデザイン。<br><br>
          「Nexus＝つながり」をテーマに、点と線が有機的に結びつく構造で<br>
          先進性と信頼感、柔軟さを同時に表現しました。<br><br>
          アプリアイコンやWebヘッダーなど、<br>
          デジタル上での視認性と汎用性を重視しています。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li>「つながり」を、<strong>点と線の結節</strong>で抽象化し、AIと人の接点を象徴</li>
            <li>過度な装飾を避け、<strong>信頼感のあるミニマル設計</strong>でテックらしさを担保</li>
            <li>小さなアイコンでも形が残るよう、<strong>要素数と線幅</strong>を最適化</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>要件整理</strong>：先進性・信頼感・柔軟性のバランスと、使用場面（アプリ/WEB）を定義</li>
            <li><strong>形状設計</strong>：接続・交差・結節のパターンを整理し、抽象度と視認性の着地点を検証</li>
            <li><strong>タイポ設計</strong>：クリーンな字面で統一し、シンボルとの重心・余白バランスを調整</li>
            <li><strong>展開検証</strong>：アイコン/ヘッダーでの縮小耐性を確認し、線幅・間隔を最終調整</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>制作時間</dt>
              <dd>01:13:08</dd>
              <dt>使用ツール</dt>
              <dd>Illustrator（必要に応じてPhotoshopで調整）</dd>
              <dt>制作範囲</dt>
              <dd>ロゴ / モックアップ（アプリアイコン・Webヘッダー想定）</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          Logo design for an imagined tech startup, "Nexus AI,"<br>
          providing AI tools that extend creators' creativity.<br><br>
          Built around the theme "Nexus = connection," through a structure of nodes and lines linking organically,<br>
          it expresses innovation, trust, and flexibility at once.<br><br>
          Emphasis is placed on digital legibility and versatility,<br>
          for use in app icons, web headers, and more.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Key Design Points</h3>
          <ul>
            <li>Visualized “Nexus” as <strong>nodes and connections</strong> to represent the touchpoint between AI and people</li>
            <li>Kept the system <strong>minimal and professional</strong> to maintain trust and a tech-forward tone</li>
            <li>Optimized <strong>stroke weight and element count</strong> so the symbol stays recognizable at icon size</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Brief</strong>: Defined the balance of innovation, trust, and flexibility, plus key use cases (app/web)</li>
            <li><strong>Form Study</strong>: Explored connection/intersection patterns and tested abstraction vs. clarity</li>
            <li><strong>Typography</strong>: Matched a clean wordmark and refined alignment, spacing, and visual center</li>
            <li><strong>Validation</strong>: Checked scalability for app icons and headers, then finalized stroke and spacing</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Time</dt>
              <dd>01:13:08</dd>
              <dt>Tools</dt>
              <dd>Illustrator (Photoshop as needed)</dd>
              <dt>Scope</dt>
              <dd>Logo / Mockup (App Icon, Web Header)</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          Design de logo pour une start-up tech imaginaire, « Nexus AI »,<br>
          proposant des outils IA qui étendent la créativité des créateurs.<br><br>
          Construit autour du thème « Nexus = connexion », à travers une structure de nœuds et de lignes reliés organiquement,<br>
          il exprime à la fois innovation, confiance et flexibilité.<br><br>
          L'accent est mis sur la lisibilité et la polyvalence numériques,<br>
          pour une utilisation en icône d'application, en-tête web, et plus encore.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception</h3>
          <ul>
            <li>« Nexus » visualisé comme des nœuds et connexions pour représenter le point de contact entre l'IA et les personnes</li>
            <li>Système gardé minimal et professionnel pour maintenir la confiance et une tonalité tech</li>
            <li>Épaisseur de trait et nombre d'éléments optimisés pour que le symbole reste reconnaissable en taille icône</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Cahier des charges</strong> : équilibre entre innovation, confiance et flexibilité défini, ainsi que les cas d'usage clés (application/web)</li>
            <li><strong>Étude de la forme</strong> : motifs de connexion/intersection explorés, équilibre entre abstraction et clarté testé</li>
            <li><strong>Typographie</strong> : logotype épuré assorti, alignement, espacement et centre visuel affinés</li>
            <li><strong>Validation</strong> : évolutivité vérifiée pour icônes d'application et en-têtes, trait et espacement finalisés</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Temps de production</dt>
              <dd>01:13:08</dd>
              <dt>Outils</dt>
              <dd>Illustrator (Photoshop selon besoin)</dd>
              <dt>Périmètre</dt>
              <dd>Logo / Maquette (icône d'application, en-tête web)</dd>
            </dl>
          </div>
        </div>
    </div>`
    },
    sora: {
      title: 'パーソナライズド・スキンケアブランド「SORA」',
      titleEn: 'Personalized Skincare Brand "SORA"',
      titleFr: 'Marque de soins de la peau personnalisée « SORA »',
      subtitle: 'Concept Work / Logo・Package・Shopper Design',
      html: `
    <div class="mwork">

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/sora/logo.webp",
              "alt":{"ja":"SORA｜Logo","en":"SORA — logo","fr":"SORA — logo"},
              "label":{"ja":"ロゴ","en":"Logo","fr":"Logo"}
            },
            {
              "src":"../images/works/design/original/sora/mockup-white.webp",
              "alt":{"ja":"SORA｜Mockup（White ver.）","en":"SORA — mockup (white version)","fr":"SORA — maquette (version blanche)"},
              "label":{"ja":"モックアップ（White）","en":"Mockup (White)","fr":"Maquette (Blanc)"}
            },
            {
              "src":"../images/works/design/original/sora/mockup-black.webp",
              "alt":{"ja":"SORA｜Mockup（Black ver.）","en":"SORA — mockup (black version)","fr":"SORA — maquette (version noire)"},
              "label":{"ja":"モックアップ（Black）","en":"Mockup (Black)","fr":"Maquette (Noir)"}
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/design/original/sora/mockup-white.webp"
            alt="SORA｜Mockup（White ver.）">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          その日の肌状態や天候に応じて成分を調整する、<br>
          D2C型の高級スキンケアブランド「SORA」を想定したコンセプトワーク。<br><br>
          「空間」「余白」「広がり」をキーワードに、<br>
          静謐で上質な透明感を軸としたビジュアルアイデンティティを設計しました。<br>
          ロゴからパッケージ、ショッパーまでトーンを統一し、<br>
          白・黒どちらの背景でも成立する汎用性を重視しています。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li>「宙（そら）」「空」を想起させる<strong>余白と静けさ</strong>を軸に、過度な装飾を排したミニマル設計</li>
            <li>ロゴは<strong>横線＝空・環境 / 縦線＝人・肌</strong>という構造で、ブランド思想を抽象的に可視化</li>
            <li>白・黒背景のどちらでも成立するよう、コントラストと線の繊細さを調整し<strong>汎用性</strong>を確保</li>
            <li>ガラスボトルやショッパーなど実装シーンを想定し、<strong>上質な静謐感</strong>が保たれるトーンに統一</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>要件整理</strong>：ターゲット像（丁寧な暮らし・本質志向）と「透明感 / 静謐」を言語化</li>
            <li><strong>構造設計</strong>：ブランド名と思想を、線の構造（空・環境／人・肌）へ落とし込み</li>
            <li><strong>ロゴ調整</strong>：余白、線幅、字間を微調整し、主張しすぎない品格を設計</li>
            <li><strong>展開検証</strong>：白・黒の背景、パッケージ/ショッパー想定で視認性と世界観をチェック</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>制作範囲</dt>
              <dd>ロゴ / パッケージ / ショッパー / ビジュアル設計（白・黒展開）</dd>
              <dt>想定媒体</dt>
              <dd>D2Cブランド（オンライン中心）/ パッケージ / 店頭・同梱物</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          Concept work for an imagined D2C premium skincare brand "SORA,"<br>
          which adjusts its formula based on the day's skin condition and weather.<br><br>
          Built around the keywords "space," "negative space," and "expanse,"<br>
          the visual identity is centered on a serene, premium sense of transparency.<br>
          The tone is unified from logo through packaging and shopper bags,<br>
          with an emphasis on versatility that holds up on both white and black backgrounds.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Design Highlights</h3>
          <ul>
            <li>Built around the keywords <strong>space, stillness, and openness</strong>, with a minimal and quiet visual tone.</li>
            <li>The logo structure is defined as <strong>horizontal line = sky / environment</strong> and <strong>vertical line = person / skin</strong>, expressing the brand concept in an abstract form.</li>
            <li>Optimized for both <strong>white and black</strong> backgrounds by refining contrast and hairline weight for versatility.</li>
            <li>Designed with real-world applications in mind (glass bottle, package, shopper) while maintaining a <strong>premium serene</strong> atmosphere.</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Brief & Positioning</strong>: defined the target audience and key brand keywords (transparency / serenity).</li>
            <li><strong>Concept Translation</strong>: converted the brand idea into a simple line structure representing sky/environment and person/skin.</li>
            <li><strong>Logo Refinement</strong>: adjusted spacing, line weight, and typography for a calm premium balance.</li>
            <li><strong>Application Check</strong>: validated visibility and consistency across mockups and color contexts (white/black).</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Scope</dt>
              <dd>Logo / Package / Shopper / Visual direction (White & Black versions)</dd>
              <dt>Intended Use</dt>
              <dd>D2C brand assets / packaging / printed materials</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          Travail conceptuel pour une marque de soins premium D2C imaginaire, « SORA »,<br>
          qui ajuste sa formule selon l'état de la peau du jour et la météo.<br><br>
          Construite autour des mots-clés « espace », « espace blanc » et « étendue »,<br>
          l'identité visuelle est centrée sur une transparence sereine et raffinée.<br>
          La tonalité est unifiée du logo jusqu'à l'emballage et le sac shopper,<br>
          avec une attention portée à la polyvalence sur fonds blanc comme noir.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception</h3>
          <ul>
            <li>Construit autour des mots-clés espace, quiétude et ouverture, avec une tonalité visuelle minimale et calme.</li>
            <li>La structure du logo est définie comme ligne horizontale = ciel / environnement et ligne verticale = personne / peau, exprimant le concept de la marque sous une forme abstraite.</li>
            <li>Optimisé pour les fonds blancs et noirs en affinant le contraste et la finesse des traits pour la polyvalence.</li>
            <li>Conçu en pensant aux applications réelles (bouteille en verre, emballage, sac shopper) tout en conservant une atmosphère sereine et raffinée.</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Cahier des charges et positionnement</strong> : public cible et mots-clés de marque définis (transparence / sérénité).</li>
            <li><strong>Traduction du concept</strong> : idée de marque convertie en une structure linéaire simple représentant ciel/environnement et personne/peau.</li>
            <li><strong>Finition du logo</strong> : espacement, épaisseur de trait et typographie ajustés pour un équilibre calme et raffiné.</li>
            <li><strong>Vérification des applications</strong> : visibilité et cohérence validées sur les maquettes et contextes de couleur (blanc/noir).</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Périmètre</dt>
              <dd>Logo / Emballage / Sac shopper / Direction visuelle (versions blanc et noir)</dd>
              <dt>Support prévu</dt>
              <dd>Actifs de marque D2C / emballage / supports imprimés</dd>
            </dl>
          </div>
        </div>
    </div>`
    },
    winter_choco: {
      title: '冬限定一口チョコ',
      titleEn: 'Winter Limited-Edition Bite-Size Chocolates',
      titleFr: 'Chocolats bouchées édition hiver limitée',
      subtitle: 'Concept Work / Food・Seasonal Promotion',
      html: `
    <div class="mwork">
      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/kobayas/winter-choco/300x280.webp",
              "alt":{"ja":"冬限定一口チョコ｜300x280","en":"Winter-only bite-size chocolates — 300x280","fr":"Chocolats bouchées édition hiver limitée — 300x280"},
              "label":"300x280"
            }
          ]'>
          <img class="mwork__img"
            src="../images/works/design/original/kobayas/winter-choco/300x280.webp"
            alt="冬限定一口チョコ｜300x280">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          冬限定の一口チョコ販促を想定した広告ビジュアル。<br>
          “溶け”などの情緒表現に寄らず、<br>
          季節感と素材感を軸に上質さを設計しました。<br><br>
          百貨店・EC展開を想定し、<br>
          落ち着いたトーンと余白で冬のご褒美感を演出しています。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li>季節感（雪・冷気）と素材感（カカオ）を主役にし、ブランド想起の偏りを回避</li>
            <li>余白と落ち着いたトーンで“ご褒美感”を強調</li>
            <li>小サイズでも主題が伝わるよう、要素数を絞って情報を整理</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>要件整理</strong>：課題内容とターゲットを整理し、訴求軸を明確化</li>
            <li><strong>構成設計</strong>：視線の流れを定義し、情報量と優先順位を調整</li>
            <li><strong>ビジュアル設計</strong>：トーン・配色・素材感を整理し、世界観を構築</li>
            <li><strong>仕上げ</strong>：余白・整列・可読性を最終調整</li>
          </ol>
        </div>

        <div class="mwork__note">
          <dl>
            <dt>課題提供</dt><dd>こばやす様（テーマ提示）</dd>
            <dt>使用サイズ</dt><dd>300x280</dd>
            <dt>使用ツール</dt><dd>Illustrator / Photoshop</dd>
          </dl>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          Promotional visual for an imagined seasonal bite-sized chocolate product.<br>
          Rather than leaning on emotional cues like "melting,"<br>
          the design centers on a seasonal mood and material quality for a premium feel.<br><br>
          Built for department store and e-commerce use,<br>
          a calm tone and generous spacing convey a sense of winter indulgence.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Design Focus</h3>
          <ul>
            <li>Centered on seasonal cues (snow, cold air) and material texture (cacao) to avoid over-reliance on brand-specific imagery</li>
            <li>Emphasized a sense of indulgence through spacing and a calm tone</li>
            <li>Reduced element count so the subject reads clearly even at small sizes</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Brief Definition</strong>: Clarified the brief, target audience, and key message</li>
            <li><strong>Layout Planning</strong>: Defined visual flow and adjusted information hierarchy</li>
            <li><strong>Visual Design</strong>: Established tone, color, and material expression</li>
            <li><strong>Refinement</strong>: Finalized spacing, alignment, and overall readability</li>
          </ol>
        </div>

        <div class="mwork__note">
          <dl>
            <dt>Brief</dt><dd>Provided by Kobayas (theme prompt)</dd>
            <dt>Size</dt><dd>300x280</dd>
            <dt>Tools</dt><dd>Illustrator / Photoshop</dd>
          </dl>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          Visuel promotionnel pour un produit de chocolat en bouchées de saison imaginaire.<br>
          Plutôt que de s'appuyer sur des signaux émotionnels comme la « fonte »,<br>
          le design se concentre sur une ambiance saisonnière et la qualité des matériaux pour un sentiment premium.<br><br>
          Conçu pour un usage en grands magasins et en e-commerce,<br>
          un ton calme et un espacement généreux transmettent un sentiment de plaisir hivernal.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception</h3>
          <ul>
            <li>Centré sur des signaux saisonniers (neige, air froid) et la texture du matériau (cacao) pour éviter une dépendance excessive à l'imagerie de marque</li>
            <li>Sentiment de plaisir accentué par l'espacement et une tonalité calme</li>
            <li>Nombre d'éléments réduit pour que le sujet reste clair même en petite taille</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Cahier des charges</strong> : brief, public cible et message clé clarifiés</li>
            <li><strong>Conception de la mise en page</strong> : flux visuel défini, hiérarchie de l'information ajustée</li>
            <li><strong>Design visuel</strong> : tonalité, couleurs et expression du matériau établies</li>
            <li><strong>Finition</strong> : espacement, alignement et lisibilité globale finalisés</li>
          </ol>
        </div>

        <div class="mwork__note">
          <dl>
            <dt>Brief</dt><dd>Fourni par Kobayas (thème proposé)</dd>
            <dt>Taille</dt><dd>300x280</dd>
            <dt>Outils</dt><dd>Illustrator / Photoshop</dd>
          </dl>
        </div>
      </div>
    </div>`
    },
    onsen: {
      title: '貸切露天風呂付き宿泊プラン',
      titleEn: 'Private Open-Air Bath Stay Plan',
      titleFr: 'Forfait séjour avec bain extérieur privé',
      subtitle: 'Promotion Banner / 2 Variations（販促・ブランディング）',
      subtitleEn: 'Promotion Banner / 2 Variations (Promotion & Branding)',
      subtitleFr: "Bannière promotionnelle / 2 variantes (Promotion et image de marque)",
      html: `
    <div class="mwork">

      <div class="mtabs" role="tablist" aria-label="バナーバリエーション"
        data-aria-ja="バナーバリエーション"
        data-aria-en="Banner variations"
        data-aria-fr="Variantes de bannière">
        <button class="mtab is-active" type="button" role="tab" aria-selected="true" data-mtab="lux"><span data-langblock="jp">高級旅館向け</span><span data-langblock="en" hidden>Luxury Inn</span><span data-langblock="fr" hidden>Auberge de luxe</span></button>
        <button class="mtab" type="button" role="tab" aria-selected="false" data-mtab="camp"><span data-langblock="jp">短期販促</span><span data-langblock="en" hidden>Campaign</span><span data-langblock="fr" hidden>Campagne</span></button>
      </div>

      <div class="mpanels">
        <section class="mpanel is-active" data-mpanel="lux">
          <figure class="modal__figure">
            <img src="../images/works/design/original/kobayas/onsen/premium.webp"
              alt="高級旅館向けに静けさと特別感を演出した貸切露天風呂付き宿泊プランの訴求バナー"
              data-alt-ja="高級旅館向けに静けさと特別感を演出した貸切露天風呂付き宿泊プランの訴求バナー"
              data-alt-en="Promotional banner for a stay plan with a private open-air bath, styled for a luxury inn with a quiet, exclusive atmosphere"
              data-alt-fr="Bannière promotionnelle pour un forfait séjour avec bain extérieur privé, dans un esprit d'auberge de luxe, calme et exclusif">
            <figcaption class="modal__caption">
              <div data-langblock="jp">
                <p><strong>高級旅館向け（ブランディング重視）</strong></p>
                <p>余白・上質感・体験価値を軸に、押しすぎずに惹き込む設計。</p>
              </div>
              <div data-langblock="en" hidden>
                <p><strong>Luxury Inn (Branding-Focused)</strong></p>
                <p>Built around spacing, refinement, and the value of the experience, drawing the viewer in without pushing.</p>
              </div>
              <div data-langblock="fr" hidden>
                <p><strong>Auberge de luxe (axé sur l'image de marque)</strong></p>
                <p>Construit autour de l'espacement, du raffinement et de la valeur de l'expérience, pour séduire sans forcer.</p>
              </div>
            </figcaption>
          </figure>
        </section>

        <section class="mpanel" data-mpanel="camp">
          <figure class="modal__figure">
            <img src="../images/works/design/original/kobayas/onsen/hansoku.webp"
              alt="短期集客を目的に3大特典を強調した貸切露天風呂付き宿泊プランのキャンペーンバナー"
              data-alt-ja="短期集客を目的に3大特典を強調した貸切露天風呂付き宿泊プランのキャンペーンバナー"
              data-alt-en="Campaign banner for a stay plan with a private open-air bath, highlighting three key perks to drive short-term bookings"
              data-alt-fr="Bannière de campagne pour un forfait séjour avec bain extérieur privé, mettant en avant trois avantages clés pour susciter des réservations à court terme">
            <figcaption class="modal__caption">
              <div data-langblock="jp">
                <p><strong>短期販促（キャンペーン訴求）</strong></p>
                <p>即時行動を促すため、特典とメリットを明確に前面化。</p>
              </div>
              <div data-langblock="en" hidden>
                <p><strong>Short-Term Campaign (Promotional Appeal)</strong></p>
                <p>Perks and benefits are brought to the front to prompt immediate action.</p>
              </div>
              <div data-langblock="fr" hidden>
                <p><strong>Campagne courte (offre promotionnelle)</strong></p>
                <p>Les avantages et les offres sont mis en avant pour susciter une action immédiate.</p>
              </div>
            </figcaption>
          </figure>
        </section>
      </div>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          同一テーマを <strong>短期販促</strong> と <strong>高級旅館向け</strong> の2目的で制作。<br>
          ターゲットの温度差に合わせて、情報量・余白・視線誘導を切り替えました。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント（高級旅館向け）</h3>
          <ul>
            <li>余白を確保し、「写真→コピー→特典」へ静かに誘導</li>
            <li>強い訴求語を抑え、トーンの一貫性で信頼感を設計</li>
            <li>情報密度を絞り、“特別感”の余韻を残す</li>
          </ul>
        </div>

        <div class="mwork__divider mwork__points">
          <h3>設計ポイント（短期販促）</h3>
          <ul>
            <li>特典を先出しし、即理解できる構成に整理</li>
            <li>数字と強調要素で視線を止め、行動理由を明確化</li>
            <li>季節イベント文脈を添え、クリックの背中を押す</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>要件整理</strong>：目的（短期販促/ブランディング）とターゲットを分岐し、訴求軸を設定</li>
            <li><strong>構成設計</strong>：主写真→コピー→特典の流れを固定し、情報密度を目的別に調整</li>
            <li><strong>タイポ設計</strong>：可読性を担保しつつ、“上質/勢い”のトーン差を文字組で設計</li>
            <li><strong>仕上げ</strong>：余白・整列・強調バランスを最終調整</li>
          </ol>
        </div>

        <div class="mwork__note">
          <dl>
            <dt>課題提供</dt><dd>こばやす様（テーマ提示）</dd>
            <dt>使用サイズ</dt><dd>500×500</dd>
            <dt>使用ツール</dt><dd>Illustrator / Photoshop</dd>
          </dl>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          The same theme was created for two purposes: <strong>a short-term campaign</strong> and <strong>a luxury-inn-oriented</strong> piece.<br>
          Information density, spacing, and visual flow were adjusted to match each target's temperature.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Design Focus (Luxury)</h3>
          <ul>
            <li>Used generous spacing to guide attention from imagery to copy and benefits</li>
            <li>Reduced strong sales language to build trust through consistent tone</li>
            <li>Intentionally lowered information density to leave a sense of exclusivity</li>
          </ul>
        </div>

        <div class="mwork__divider mwork__points">
          <h3>Design Focus (Campaign)</h3>
          <ul>
            <li>Placed key benefits upfront for immediate understanding</li>
            <li>Used numbers and emphasis to stop attention and clarify action value</li>
            <li>Added seasonal context to encourage timely engagement</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Brief Definition</strong>: Defined objectives and segmented targets by promotion type</li>
            <li><strong>Layout Planning</strong>: Fixed visual flow from hero image to copy and benefits</li>
            <li><strong>Typography Design</strong>: Adjusted typographic tone to balance elegance and impact</li>
            <li><strong>Refinement</strong>: Finalized spacing, alignment, and emphasis balance</li>
          </ol>
        </div>

        <div class="mwork__note">
          <dl>
            <dt>Brief</dt><dd>Provided by Kobayasu (theme prompt)</dd>
            <dt>Banner Size</dt><dd>500×500</dd>
            <dt>Tools</dt><dd>Illustrator / Photoshop</dd>
          </dl>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          Le même thème a été créé pour deux objectifs : <strong>une campagne à court terme</strong> et une pièce <strong>orientée auberge de luxe</strong>.<br>
          La densité d'information, l'espacement et le flux visuel ont été ajustés selon la sensibilité de chaque cible.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception (Auberge de luxe)</h3>
          <ul>
            <li>Espacement généreux utilisé pour guider l'attention de l'image vers le texte puis les avantages</li>
            <li>Langage commercial appuyé réduit pour construire la confiance par une tonalité cohérente</li>
            <li>Densité d'information volontairement réduite pour laisser un sentiment d'exclusivité</li>
          </ul>
        </div>

        <div class="mwork__divider mwork__points">
          <h3>Axes de conception (Campagne)</h3>
          <ul>
            <li>Avantages clés placés en avant pour une compréhension immédiate</li>
            <li>Chiffres et éléments d'emphase utilisés pour capter l'attention et clarifier la valeur de l'action</li>
            <li>Contexte saisonnier ajouté pour encourager un engagement rapide</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Cahier des charges</strong> : objectifs définis et cibles segmentées par type de promotion</li>
            <li><strong>Conception de la mise en page</strong> : flux visuel fixé de l'image principale vers le texte puis les avantages</li>
            <li><strong>Design typographique</strong> : tonalité typographique ajustée pour équilibrer élégance et impact</li>
            <li><strong>Finition</strong> : espacement, alignement et équilibre des emphases finalisés</li>
          </ol>
        </div>

        <div class="mwork__note">
          <dl>
            <dt>Brief</dt><dd>Fourni par Kobayasu (thème proposé)</dd>
            <dt>Taille de bannière</dt><dd>500×500</dd>
            <dt>Outils</dt><dd>Illustrator / Photoshop</dd>
          </dl>
        </div>
      </div>
    </div>`
    },
    kobayasland: {
      title: 'Kobayasランド開園記念',
      titleEn: 'Kobayas Land｜Opening Commemoration',
      titleFr: "Kobayas Land｜Commémoration de l'ouverture",
      subtitle: 'Concept Work / Event・Leisure Promotion',
      html: `
    <div class="mwork">
      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/kobayas/kobayasland/800x200.webp",
              "alt":{"ja":"Kobayasランド開園記念｜800x200","en":"Kobayas Land grand opening — 800x200","fr":"Commémoration de l’ouverture de Kobayas Land — 800x200"},
              "label":"800x200"
            }
          ]'>
          <img class="mwork__img"
            src="../images/works/design/original/kobayas/kobayasland/800x200.webp"
            alt="Kobayasランド開園記念｜800x200">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          遊園地の開園記念イベントを想定した販促バナー。<br>
          にぎやかさと情報量を前提にしつつ、<br>
          視線の流れを整理して判断材料を一画面に集約しました。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li>ファミリー層に向け、楽しさが直感で伝わる“にぎやかさ”をベースに設計</li>
            <li>割引・期間・イベント性を一画面で判断できる情報の集約</li>
            <li>情報量が多くても迷わないよう、見出しと流れで視線誘導を整理</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>要件整理</strong>：開園記念イベントの目的と、ファミリー層を中心としたターゲットを設定</li>
            <li><strong>情報設計</strong>：割引・期間・イベント性を洗い出し、一画面で判断できる要素に整理</li>
            <li><strong>構成設計</strong>：にぎやかさを保ちつつ、視線が自然に流れるレイアウトを設計</li>
            <li><strong>仕上げ</strong>：情報量と可読性のバランスを調整し、全体の見やすさを最終確認</li>
          </ol>
        </div>


        <div class="mwork__note">
          <dl>
            <dt>課題提供</dt><dd>こばやす様（テーマ提示）</dd>
            <dt>使用サイズ</dt><dd>800x200</dd>
            <dt>使用ツール</dt><dd>Illustrator / Photoshop</dd>
          </dl>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          Promotional banner for an imagined amusement park opening celebration.<br>
          While embracing a lively, information-rich layout,<br>
          the visual flow was organized to consolidate key decision cues onto a single screen.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Design Focus</h3>
          <ul>
            <li>Designed a lively, family-friendly tone that conveys fun at a glance</li>
            <li>Consolidated discount, period, and event details for one-screen decision-making</li>
            <li>Organized headings and flow so viewers stay oriented despite high information density</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Brief Definition</strong>: Defined the opening event objective and family-oriented target audience</li>
            <li><strong>Information Structuring</strong>: Organized discounts, period, and event details for quick decision-making</li>
            <li><strong>Layout Planning</strong>: Designed a lively yet readable layout with a clear visual flow</li>
            <li><strong>Refinement</strong>: Adjusted information density and readability for final balance</li>
          </ol>
        </div>

        <div class="mwork__note">
          <dl>
            <dt>Brief</dt><dd>Provided by Kobayas (theme prompt)</dd>
            <dt>Size</dt><dd>800x200</dd>
            <dt>Tools</dt><dd>Illustrator / Photoshop</dd>
          </dl>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          Bannière promotionnelle pour une célébration d'ouverture de parc d'attractions imaginaire.<br>
          Tout en adoptant une mise en page vivante et riche en informations,<br>
          le flux visuel a été organisé pour regrouper les éléments de décision clés sur un seul écran.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception</h3>
          <ul>
            <li>Tonalité vivante et familiale conçue pour transmettre le plaisir en un coup d'œil</li>
            <li>Réduction, période et détails de l'événement regroupés pour une décision en un seul écran</li>
            <li>Titres et flux organisés pour que les visiteurs restent orientés malgré la forte densité d'information</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Cahier des charges</strong> : objectif de l'événement d'ouverture et public cible familial définis</li>
            <li><strong>Structuration de l'information</strong> : réductions, période et détails de l'événement organisés pour une décision rapide</li>
            <li><strong>Conception de la mise en page</strong> : mise en page vivante et lisible conçue avec un flux visuel clair</li>
            <li><strong>Finition</strong> : densité d'information et lisibilité ajustées pour un équilibre final</li>
          </ol>
        </div>

        <div class="mwork__note">
          <dl>
            <dt>Brief</dt><dd>Fourni par Kobayas (thème proposé)</dd>
            <dt>Taille</dt><dd>800x200</dd>
            <dt>Outils</dt><dd>Illustrator / Photoshop</dd>
          </dl>
        </div>
      </div>
    </div>`
    },
    kobapay: {
      title: 'Koba pay アプリ利用案内',
      titleEn: 'Koba Pay｜App Usage Guide',
      titleFr: "Koba Pay｜Guide d'utilisation de l'application",
      subtitle: 'Concept Work / Cashless Payment App Promotion',
      html: `
    <div class="mwork">
      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/kobayas/kobapay/350x200.webp",
              "alt":{"ja":"koba-pay 利用促進バナー｜350x200","en":"koba-pay usage promotion banner — 350x200","fr":"Bannière de promotion d’usage koba-pay — 350x200"},
              "label":"350x200"
            }
          ]'>
          <img class="mwork__img"
            src="../images/works/design/original/kobayas/kobapay/350x200.webp"
            alt="koba-pay 利用促進バナー｜350x200">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          地域密着型キャッシュレス決済アプリ「koba-pay」の<br>
          利用促進キャンペーンを想定した広告ビジュアル。<br>
          ポイント付与・還元率など即時ベネフィットを主役に、<br>
          数字→QR→コピーの順で読める構成に設計しました。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li>クリスマス商戦期の“今得する”訴求を数字で最短伝達</li>
            <li>QRコードを迷わず読み取れるよう、配置と余白で可読性を確保</li>
            <li>比較検討中でも理解できるよう、要点を一画面に整理</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>要件整理</strong>：利用促進の目的と、クリスマス商戦期における訴求条件を整理</li>
            <li><strong>情報設計</strong>：ポイント付与・還元率など即時性の高い要素を優先順位化</li>
            <li><strong>構成設計</strong>：数字→QR→コピーの順で理解できる視線の流れを設計</li>
            <li><strong>仕上げ</strong>：可読性と情報密度を調整し、瞬時に内容が伝わる状態に最適化</li>
          </ol>
        </div>

        <div class="mwork__note">
          <dl>
            <dt>課題提供</dt><dd>こばやす様（テーマ提示）</dd>
            <dt>使用サイズ</dt><dd>350x200</dd>
            <dt>使用ツール</dt><dd>Illustrator / Photoshop</dd>
          </dl>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          Ad visual for an imagined usage-promotion campaign<br>
          for a community-based cashless payment app, "koba-pay."<br>
          Centered on instant benefits like points and cashback rates,<br>
          the layout is designed to read in the order: numbers → QR code → copy.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Design Focus</h3>
          <ul>
            <li>Delivered a "save now" holiday-season message through numbers for the fastest comprehension</li>
            <li>Ensured readability through placement and spacing so the QR code scans without hesitation</li>
            <li>Organized key points on a single screen for clarity even during comparison shopping</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Brief Definition</strong>: Clarified campaign goals and conditions for the holiday season</li>
            <li><strong>Information Structuring</strong>: Prioritized instant benefits such as points and cashback</li>
            <li><strong>Layout Planning</strong>: Designed a clear visual flow from key numbers to QR code and copy</li>
            <li><strong>Refinement</strong>: Adjusted readability and information density for quick comprehension</li>
          </ol>
        </div>

        <div class="mwork__note">
          <dl>
            <dt>Brief</dt><dd>Provided by Kobayas (theme prompt)</dd>
            <dt>Size</dt><dd>350x200</dd>
            <dt>Tools</dt><dd>Illustrator / Photoshop</dd>
          </dl>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          Visuel publicitaire pour une campagne de promotion d'usage imaginaire<br>
          d'une application de paiement sans espèces locale, « koba-pay ».<br>
          Centré sur des avantages immédiats comme les points et le taux de remboursement,<br>
          la mise en page est conçue pour se lire dans l'ordre : chiffres → QR code → texte.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception</h3>
          <ul>
            <li>Message « économisez maintenant » de la période de Noël transmis par des chiffres pour une compréhension immédiate</li>
            <li>Lisibilité assurée par le placement et l'espacement pour que le QR code se scanne sans hésitation</li>
            <li>Points clés organisés sur un seul écran pour rester clairs même en phase de comparaison</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Cahier des charges</strong> : objectifs de campagne et conditions de la période de Noël clarifiés</li>
            <li><strong>Structuration de l'information</strong> : avantages immédiats comme points et remboursement priorisés</li>
            <li><strong>Conception de la mise en page</strong> : flux visuel clair conçu des chiffres clés vers le QR code puis le texte</li>
            <li><strong>Finition</strong> : lisibilité et densité d'information ajustées pour une compréhension instantanée</li>
          </ol>
        </div>

        <div class="mwork__note">
          <dl>
            <dt>Brief</dt><dd>Fourni par Kobayas (thème proposé)</dd>
            <dt>Taille</dt><dd>350x200</dd>
            <dt>Outils</dt><dd>Illustrator / Photoshop</dd>
          </dl>
        </div>
      </div>
    </div>`
    },
    kobafitness: {
      title: 'スポーツKoba フィットネスクラブ',
      titleEn: 'Sports Koba Fitness Club',
      titleFr: 'Club de fitness Sports Koba',
      subtitle: 'Concept Work / Fitness Club Promotion',
      html: `
    <div class="mwork">
      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/kobayas/kobafitness/500x500.webp",
              "alt":{"ja":"スポーツKoba フィットネスクラブ｜500x500","en":"Sports Koba fitness club — 500x500","fr":"Club de fitness Sports Koba — 500x500"},
              "label":"500x500"
            }
          ]'>
          <img class="mwork__img"
            src="../images/works/design/original/kobayas/kobafitness/500x500.webp"
            alt="スポーツKoba フィットネスクラブ｜500x500">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          フィットネスクラブの新春入会キャンペーンを想定した広告ビジュアル。<br>
          0円訴求で初期ハードルを下げつつ、「続けられる」メッセージで不安を補完し、<br>
          数字・コピー・人物ビジュアルの優先順位を整理して設計しました。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li>新年の行動変容タイミングに合わせ、0円訴求を最優先で可視化</li>
            <li>“忙しくても続けられる”メッセージで継続不安を軽減し、価格訴求に偏らない構成</li>
            <li>人物→コピー→数字の順に視線が流れるよう、要素サイズと配置を整理</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>要件整理</strong>：新春入会キャンペーンの目的と、社会人層を中心としたターゲットを設定</li>
            <li><strong>情報設計</strong>：入会金・事務手数料無料など、行動ハードルを下げる要素を優先整理</li>
            <li><strong>構成設計</strong>：数字→コピー→人物ビジュアルの順で理解できる視線導線を設計</li>
            <li><strong>仕上げ</strong>：価格訴求と継続イメージのバランスを調整し、安心感のある表現に調整</li>
          </ol>
        </div>

        <div class="mwork__note">
          <dl>
            <dt>課題提供</dt><dd>こばやす様（テーマ提示）</dd>
            <dt>使用サイズ</dt><dd>500x500</dd>
            <dt>使用ツール</dt><dd>Illustrator / Photoshop</dd>
          </dl>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          Ad visual for an imagined New Year membership campaign for a fitness club.<br>
          Lowering the initial barrier with a "0 yen" offer, while a "you can keep it up" message eases concerns about consistency,<br>
          the design organizes the priority among numbers, copy, and lifestyle imagery.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Design Focus</h3>
          <ul>
            <li>Prioritized visibility of the "0 yen" offer to align with the New Year's behavior-change moment</li>
            <li>Eased consistency concerns with a "you can keep it up even when busy" message, avoiding an overly price-focused layout</li>
            <li>Organized element size and placement so the eye flows from person to copy to numbers</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Brief Definition</strong>: Defined campaign goals and targeted working adults during the New Year period</li>
            <li><strong>Information Structuring</strong>: Prioritized fee waivers to reduce entry barriers</li>
            <li><strong>Layout Planning</strong>: Designed a visual flow from key numbers to copy and lifestyle imagery</li>
            <li><strong>Refinement</strong>: Balanced pricing appeal with reassurance for long-term commitment</li>
          </ol>
        </div>

        <div class="mwork__note">
          <dl>
            <dt>Brief</dt><dd>Provided by Kobayas (theme prompt)</dd>
            <dt>Size</dt><dd>500x500</dd>
            <dt>Tools</dt><dd>Illustrator / Photoshop</dd>
          </dl>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          Visuel publicitaire pour une campagne d'adhésion du Nouvel An imaginaire pour un club de fitness.<br>
          En abaissant la barrière initiale avec une offre « 0 yen », tandis qu'un message « vous pouvez tenir » apaise les inquiétudes sur la régularité,<br>
          le design organise la priorité entre chiffres, texte et visuel de style de vie.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception</h3>
          <ul>
            <li>Visibilité de l'offre « 0 yen » priorisée pour s'aligner sur le moment de changement de comportement du Nouvel An</li>
            <li>Inquiétudes sur la régularité apaisées par un message « vous pouvez tenir même occupé », évitant une mise en page trop centrée sur le prix</li>
            <li>Taille et placement des éléments organisés pour que le regard suive la personne, puis le texte, puis les chiffres</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Cahier des charges</strong> : objectifs de campagne définis, ciblant les actifs pendant la période du Nouvel An</li>
            <li><strong>Structuration de l'information</strong> : exonérations de frais priorisées pour réduire les barrières à l'entrée</li>
            <li><strong>Conception de la mise en page</strong> : flux visuel conçu des chiffres clés vers le texte puis le visuel de style de vie</li>
            <li><strong>Finition</strong> : attrait tarifaire équilibré avec un sentiment de réassurance pour l'engagement à long terme</li>
          </ol>
        </div>

        <div class="mwork__note">
          <dl>
            <dt>Brief</dt><dd>Fourni par Kobayas (thème proposé)</dd>
            <dt>Taille</dt><dd>500x500</dd>
            <dt>Outils</dt><dd>Illustrator / Photoshop</dd>
          </dl>
        </div>
      </div>
    </div>`
    },
    lunch_menu: {
      title: '地域カフェ「Café With」A5メニューチラシ',
      titleEn: 'Local Café "Café With"｜A5 Menu Flyer',
      titleFr: 'Café de quartier « Café With »｜Flyer menu A5',
      subtitle: 'Flyer Design / A5 / In-store & Handout',
      html: `
    <div class="mwork">

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/cafe-with/flyer.webp",
              "alt":{"ja":"Café With｜A5 Flyer","en":"Café With — A5 flyer","fr":"Café With — flyer A5"},
              "label":{"ja":"チラシ全体","en":"Full Flyer","fr":"Flyer complet"}
            },
            {
              "src":"../images/works/design/original/cafe-with/mockup.webp",
              "alt":{"ja":"Café With｜Mockup","en":"Café With — mockup","fr":"Café With — maquette"},
              "label":{"ja":"モックアップ","en":"Mockup","fr":"Maquette"}
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/design/original/cafe-with/mockup.webp"
            alt="Café With｜Mockup"
            loading="lazy">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          カフェのランチ利用や日常的な来店を想定し、店頭設置・手渡し配布のどちらにも対応できるA5チラシを制作。<br><br>
          ランチ・ケーキ・ドリンク・クーポンと情報量が多い媒体であることを前提に、<br>
          <strong>「内容・価格・提供時間」</strong>が一目で把握できる情報設計と、親しみやすい世界観の両立を意識しました。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li><strong>情報の優先順位</strong>を整理し、来店判断に直結する「内容・価格・時間」を最上段で即認識できる構成</li>
            <li>写真の近くに価格を配置し、<strong>視線移動を最短化</strong>（直感で理解できるレイアウト）</li>
            <li>ランチ / ケーキ / ドリンク / クーポンを<strong>時間軸＋用途別</strong>に分け、読み疲れを軽減</li>
            <li>猫モチーフ＋柔らかな配色で、常連だけでなく<strong>初来店にも入りやすいトーン</strong>を設計</li>
            <li>配布運用を想定し、クーポン条件・問い合わせ導線を<strong>行動に繋がる位置</strong>に集約</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>要件整理</strong>：目的（ランチ集客 / 日常来店）と掲載要素（メニュー＋クーポン）の情報量を整理</li>
            <li><strong>構造設計</strong>：時間帯別（ランチ / ケーキ）と用途別（ドリンク / クーポン）でブロック化</li>
            <li><strong>視線誘導</strong>：写真→価格→説明の順で読めるよう、余白と見出しの強弱を調整</li>
            <li><strong>最終調整</strong>：クーポン条件・QR・店舗情報の可読性と、全体トーン（親しみやすさ）を最適化</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>課題提供</dt><dd>https://webtan.tech/flyer_cafe/</dd>
              <dt>制作範囲</dt>
              <dd>A5チラシデザイン（フルカラー）</dd>
              <dt>想定媒体</dt>
              <dd>店舗配布用フライヤー / 店頭設置（ラック）/ 手渡し配布</dd>
              <dt>ツール</dt>
              <dd>Adobe Illustrator / Adobe Photoshop</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          An A5 flyer designed for both in-store display and handout distribution, imagined for a café's lunch and everyday visits.<br><br>
          Working from the premise of a content-heavy format covering lunch, cake, drinks, and coupons,<br>
          the design balances information clarity — "content, pricing, serving hours" at a glance — with an approachable, friendly world.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Design Highlights</h3>
          <ul>
            <li>Organized a clear <strong>information hierarchy</strong> so visitors can instantly grasp menu items, pricing, and serving hours.</li>
            <li>Placed prices close to photos to reduce cognitive load and enable <strong>at-a-glance understanding</strong>.</li>
            <li>Structured the layout into time- and purpose-based sections (Lunch / Cake / Drinks / Coupons) to improve readability.</li>
            <li>Used a warm palette and subtle cat motifs to create a <strong>friendly, approachable tone</strong> for first-time customers.</li>
            <li>Designed for real distribution: coupon rules, QR, and store info are positioned for <strong>quick action</strong>.</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Brief & Requirements</strong>: defined the goal (lunch visits / daily walk-ins) and organized high-volume content.</li>
            <li><strong>Layout Structure</strong>: grouped content by time and usage (Lunch, Cake Set, Drinks, Coupons).</li>
            <li><strong>Visual Flow</strong>: refined spacing and typographic hierarchy to guide the eye from photo → price → description.</li>
            <li><strong>Final Optimization</strong>: ensured readability of coupon conditions and QR placement while keeping a warm brand tone.</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Scope</dt>
              <dd>A5 Flyer Design (Full Color)</dd>
              <dt>Intended Use</dt>
              <dd>In-store handouts / Display rack placement</dd>
              <dt>Tools</dt>
              <dd>Adobe Illustrator / Adobe Photoshop</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          Un flyer A5 conçu à la fois pour l'affichage en boutique et la distribution en main propre, imaginé pour les déjeuners et visites quotidiennes d'un café.<br><br>
          Partant du principe d'un format riche en contenu couvrant déjeuner, gâteaux, boissons et coupons,<br>
          le design équilibre la clarté de l'information — « contenu, prix, horaires » en un coup d'œil — avec un univers accueillant et chaleureux.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception</h3>
          <ul>
            <li>Hiérarchie de l'information claire organisée pour que les visiteurs saisissent instantanément les plats, les prix et les horaires.</li>
            <li>Prix placés près des photos pour réduire la charge cognitive et permettre une compréhension en un coup d'œil.</li>
            <li>Mise en page structurée en sections par horaire et usage (Déjeuner / Gâteaux / Boissons / Coupons) pour améliorer la lisibilité.</li>
            <li>Palette chaleureuse et motifs de chat subtils utilisés pour créer une tonalité accueillante pour les nouveaux clients.</li>
            <li>Conçu pour une distribution réelle : règles du coupon, QR et informations du magasin positionnés pour une action rapide.</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Cahier des charges</strong> : objectif défini (déjeuners / visites quotidiennes), contenu volumineux organisé.</li>
            <li><strong>Structure de la mise en page</strong> : contenu regroupé par horaire et usage (Déjeuner, Set gâteau, Boissons, Coupons).</li>
            <li><strong>Flux visuel</strong> : espacement et hiérarchie typographique affinés pour guider le regard de la photo → prix → description.</li>
            <li><strong>Optimisation finale</strong> : lisibilité des conditions du coupon et placement du QR assurés, tonalité chaleureuse conservée.</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Brief</dt><dd>https://webtan.tech/flyer_cafe/</dd>
              <dt>Périmètre</dt>
              <dd>Design de flyer A5 (pleine couleur)</dd>
              <dt>Support prévu</dt>
              <dd>Flyer pour distribution en boutique / Présentoir en magasin / Distribution en main propre</dd>
              <dt>Outils</dt>
              <dd>Adobe Illustrator / Adobe Photoshop</dd>
            </dl>
          </div>
        </div>
      </div>

    </div>`
    },
    bernes: {
      title: '大型犬×免許証オマージュ名刺（自主制作）',
      titleEn: "Large Dog × Driver's License Homage Business Card (Personal Work)",
      titleFr: 'Carte de visite hommage au permis de conduire × grand chien (Projet personnel)',
      subtitle: 'Personal Work / Business Card Design',
      html: `
    <div class="mwork">

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/bernes/mockup.webp",
              "alt":{"ja":"大型犬×免許証オマージュ名刺｜モックアップ","en":"Driver’s license homage business card with a large dog — mockup","fr":"Carte de visite hommage au permis de conduire × grand chien — maquette"},
              "label":{"ja":"モックアップ","en":"Mockup","fr":"Maquette"}
            },
            {
              "src":"../images/works/design/original/bernes/front.webp",
              "alt":{"ja":"大型犬×免許証オマージュ名刺｜表","en":"Driver’s license homage business card with a large dog — front","fr":"Carte de visite hommage au permis de conduire × grand chien — recto"},
              "label":{"ja":"表","en":"Front","fr":"Recto"}
            },
            {
              "src":"../images/works/design/original/bernes/back.webp",
              "alt":{"ja":"大型犬×免許証オマージュ名刺｜裏","en":"Driver’s license homage business card with a large dog — back","fr":"Carte de visite hommage au permis de conduire × grand chien — verso"},
              "label":{"ja":"裏","en":"Back","fr":"Verso"}
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/design/original/bernes/mockup.webp"
            alt="大型犬×免許証オマージュ名刺｜モックアップ">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          大型犬が好きすぎて、ついに名刺にも登場してもらいました🐶<br>
          それと、昔ちょっと「免許証持ってる＝大人である」と<br>
	  謎に憧れてた時期があって…<br>
          その2つを合体させた、自主制作の“IDカード風名刺”です。<br><br>
          ちゃんと使える情報整理は守りつつ、堅すぎない雰囲気に寄せています。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li>免許証っぽいレイアウトで、情報が一瞬で読めるように整理</li>
            <li>かわいさ全振りにならないよう、色数と余白は控えめに</li>
            <li>犬イラストは“話しかけやすさ”担当（初対面の空気を和らげる用）</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>方向性メモ</strong>：好き（大型犬）＋憧れ（免許証）を1枚で成立させる方針に</li>
            <li><strong>情報設計</strong>：肩書き・連絡先・導線（QR）を“迷わない順番”に配置</li>
            <li><strong>イラスト調整</strong>：主張しすぎないサイズ感にして、邪魔せず効かせる</li>
            <li><strong>仕上げ</strong>：印刷を想定して線の太さ・余白・可読性を最終調整</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>制作種別</dt><dd>自主制作</dd>
              <dt>制作範囲</dt><dd>名刺（表／裏）/ モックアップ</dd>
              <dt>使用ツール</dt><dd>Illustrator / Photoshop</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          I love large dogs so much that I finally gave one a spot on my business card 🐶<br>
          And there was also a phase, once, when I mysteriously admired the idea that<br>
          "having a driver's license = being a grown-up"...<br>
          This is a self-initiated "ID-card-style business card" that combines those two things.<br><br>
          It keeps information properly organized and usable, while leaning toward a mood that isn't too formal.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Design Focus</h3>
          <ul>
            <li>Organized information for instant readability using an ID-card-inspired layout</li>
            <li>Kept color count and spacing restrained to avoid leaning too far into "cute"</li>
            <li>The dog illustration handles "approachability," easing the mood of a first meeting</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Concept note</strong>: Combined “large dogs” + “ID card layout” into a usable design</li>
            <li><strong>Information layout</strong>: Organized title, contacts, and QR links for quick scanning</li>
            <li><strong>Illustration balance</strong>: Kept visuals friendly but not overpowering</li>
            <li><strong>Final polish</strong>: Adjusted spacing, line weight, and readability for print</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Type</dt><dd>Personal project</dd>
              <dt>Scope</dt><dd>Business card (front/back) / Illustration / Mockup</dd>
              <dt>Tools</dt><dd>Illustrator / Photoshop</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          J'aime tellement les grands chiens que j'ai fini par en faire figurer un sur ma carte de visite 🐶<br>
          Et il y a aussi eu une période, autrefois, où j'admirais mystérieusement l'idée que<br>
          « avoir un permis de conduire = être adulte »...<br>
          Voici une carte de visite « façon carte d'identité », un projet personnel qui combine ces deux choses.<br><br>
          Elle garde une organisation de l'information sérieuse et utilisable, tout en penchant vers une ambiance pas trop formelle.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception</h3>
          <ul>
            <li>Information organisée pour une lisibilité instantanée grâce à une mise en page inspirée d'une carte d'identité</li>
            <li>Nombre de couleurs et espacement gardés sobres pour éviter de basculer trop dans le « mignon »</li>
            <li>L'illustration du chien se charge de l'« accessibilité », adoucissant l'ambiance d'une première rencontre</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Note de concept</strong> : « grands chiens » + « mise en page carte d'identité » combinés en un design cohérent</li>
            <li><strong>Mise en page de l'information</strong> : titre, contacts et liens QR organisés pour une lecture rapide</li>
            <li><strong>Équilibre de l'illustration</strong> : visuels gardés sympathiques sans être envahissants</li>
            <li><strong>Finition</strong> : espacement, épaisseur de trait et lisibilité ajustés pour l'impression</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Type</dt><dd>Projet personnel</dd>
              <dt>Périmètre</dt><dd>Carte de visite (recto/verso) / Illustration / Maquette</dd>
              <dt>Outils</dt><dd>Illustrator / Photoshop</dd>
            </dl>
          </div>
        </div>
    </div>`
    },
    portfolio_print: {
      title: '紙ポートフォリオ',
      titleEn: 'Printed Portfolio',
      titleFr: 'Portfolio papier',
      subtitle: 'Personal Work / Print Design',
      html: `
    <div class="mwork">

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/portfolio/mockup.webp",
              "alt":{"ja":"紙ポートフォリオ｜モックアップ","en":"Paper portfolio — mockup","fr":"Portfolio papier — maquette"},
              "label":"Mockup"
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/design/original/portfolio/mockup.webp"
            alt="紙ポートフォリオ｜モックアップ">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
        <p class="mwork__lead">
          自身の主にデザイナーとしての活動をまとめた紙ポートフォリオ。<br>
          作品そのものだけでなく、「どう考えて・どう構成しているか」が伝わるよう、<br>
          余白・グリッド・情報階層を意識したブックデザインを行いました。<br><br>
          静かでモダンなトーンをベースに、<br>
          実務資料としても、自己表現の媒体としても成立する構成を目指しています。<br>
          ※イラストレ作品は別途イラストポートフォリオを制作中でございます。
        </p>
        <div class="mwork__divider mwork__points">
          <h3>設計ポイント</h3>
          <ul>
            <li>グリッドと余白を基準に、視線が自然に流れる誌面構成</li>
            <li>作品写真・説明文・補足情報の情報階層を明確に整理</li>
            <li>主張しすぎない配色で、内容そのものに集中できるデザイン</li>
            <li>紙媒体でもデジタル感覚で読めるリズムを意識</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>制作プロセス</h3>
          <ol>
            <li><strong>構成設計</strong>：全体ページ構成と情報量を整理</li>
            <li><strong>トーン設計</strong>：モダンで静かな印象を軸に方向性を決定</li>
            <li><strong>レイアウト</strong>：グリッド・余白・文字組みを調整</li>
            <li><strong>仕上げ</strong>：印刷時の見え方を想定して最終調整</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>制作種別</dt><dd>自主制作</dd>
              <dt>制作範囲</dt><dd>構成 / デザイン / レイアウト / モックアップ</dd>
              <dt>使用ツール</dt><dd>InDesign / Illustrator / Photoshop</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- EN -->
      <div class="mwork__langblock" data-langblock="en" hidden>
        <p class="mwork__lead">
          A printed portfolio compiling my work mainly as a designer.<br>
          Beyond the works themselves, so that "how I think and how I structure things" comes through,<br>
          the book design was built with attention to spacing, grid, and information hierarchy.<br><br>
          Based on a calm, modern tone,<br>
          it aims to function both as a professional reference and as a medium for self-expression.<br>
          * A separate illustration portfolio is currently in production for illustration work.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Design Focus</h3>
          <ul>
            <li>A page layout where the eye flows naturally, based on grid and spacing</li>
            <li>Clearly organized information hierarchy across work photos, descriptions, and supporting details</li>
            <li>A restrained color palette that keeps focus on the content itself</li>
            <li>A reading rhythm that feels digital-native even in print</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Process</h3>
          <ol>
            <li><strong>Structure planning</strong>: Defined page flow and content balance</li>
            <li><strong>Visual direction</strong>: Established a calm, modern design tone</li>
            <li><strong>Layout design</strong>: Refined grid, spacing, and typography</li>
            <li><strong>Final adjustment</strong>: Optimized readability for print</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Type</dt><dd>Personal project</dd>
              <dt>Scope</dt><dd>Book design / Layout / Mockup</dd>
              <dt>Tools</dt><dd>InDesign / Illustrator / Photoshop</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- FR -->
      <div class="mwork__langblock" data-langblock="fr" hidden>
        <p class="mwork__lead">
          Un portfolio papier rassemblant mon travail principalement en tant que designeuse.<br>
          Au-delà des œuvres elles-mêmes, afin que « comment je pense et comment je structure » transparaisse,<br>
          le design du livre a été construit en prêtant attention à l'espace blanc, à la grille et à la hiérarchie de l'information.<br><br>
          Basé sur un ton calme et moderne,<br>
          il vise à fonctionner à la fois comme un support professionnel et comme un moyen d'expression personnelle.<br>
          * Un portfolio d'illustration séparé est en cours de préparation pour les travaux d'illustration.
        </p>
        <div class="mwork__divider mwork__points">
          <h3>Axes de conception</h3>
          <ul>
            <li>Mise en page où le regard s'écoule naturellement, basée sur la grille et l'espacement</li>
            <li>Hiérarchie de l'information clairement organisée entre photos d'œuvres, descriptions et informations complémentaires</li>
            <li>Palette de couleurs sobre qui garde l'attention sur le contenu lui-même</li>
            <li>Rythme de lecture qui semble natif du numérique, même sur papier</li>
          </ul>
        </div>

        <div class="mwork__process">
          <h3>Processus</h3>
          <ol>
            <li><strong>Planification de la structure</strong> : flux des pages et équilibre du contenu définis</li>
            <li><strong>Direction visuelle</strong> : tonalité de design calme et moderne établie</li>
            <li><strong>Design de la mise en page</strong> : grille, espacement et typographie affinés</li>
            <li><strong>Ajustement final</strong> : lisibilité optimisée pour l'impression</li>
          </ol>

          <div class="mwork__note">
            <dl>
              <dt>Type</dt><dd>Projet personnel</dd>
              <dt>Périmètre</dt><dd>Structure / Design / Mise en page / Maquette</dd>
              <dt>Outils</dt><dd>InDesign / Illustrator / Photoshop</dd>
            </dl>
          </div>
        </div>
      </div>

    </div>`
    }
  });

  function safeParseJSON(str) {
    try { return JSON.parse(str); } catch { return null; }
  }

  function initDesignGallery(root) {
    if (!root) return;

    const figure = root.querySelector('.modal__figure[data-set]');
    if (!figure) return;

    if (figure.dataset.galleryReady === '1') return;

    const set = safeParseJSON(figure.getAttribute('data-set'));
    if (!Array.isArray(set) || set.length === 0) return;

    const img = figure.querySelector('img.mwork__img') || figure.querySelector('img');
    const labelEl = figure.querySelector('.mwork__caption');
    if (!img) return;

    let ui = root.querySelector('.mgallery-ui');
    if (!ui) {
      ui = document.createElement('div');
      ui.className = 'mgallery-ui';

      const prev = document.createElement('button');
      prev.type = 'button';
      prev.className = 'mgallery-ui__btn';
      prev.setAttribute('aria-label', '前の画像へ');
      prev.dataset.ariaJa = '前の画像へ';
      prev.dataset.ariaEn = 'Previous image';
      prev.dataset.ariaFr = 'Image précédente';
      prev.textContent = '＜';

      const label = document.createElement('div');
      label.className = 'mgallery-ui__label';
      label.setAttribute('aria-live', 'polite');

      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'mgallery-ui__btn';
      next.setAttribute('aria-label', '次の画像へ');
      next.dataset.ariaJa = '次の画像へ';
      next.dataset.ariaEn = 'Next image';
      next.dataset.ariaFr = 'Image suivante';
      next.textContent = '＞';

      ui.append(prev, label, next);
      figure.insertAdjacentElement('beforebegin', ui);
      /* 生成時点の言語をボタンのaria-labelにも反映する */
      applyLangAttrs(ui, currentLang === 'ja' ? 'jp' : currentLang);
    }

    const prevBtn = ui.querySelector('.mgallery-ui__btn:nth-child(1)');
    const uiLabel = ui.querySelector('.mgallery-ui__label');
    const nextBtn = ui.querySelector('.mgallery-ui__btn:nth-child(3)');

    if (getComputedStyle(figure).position === 'static') figure.style.position = 'relative';

    let idx = 0;

    const applyClasses = (altTxt, txt) => {
      const meta = `${txt} ${altTxt || ''}`;
      img.classList.toggle(
        'is-banner',
        /(300[×x\*]25\d|300[×x\*]26\d|300[×x\*]600|160[×x\*]600|728[×x\*]90|970[×x\*]250|468[×x\*]60)/i.test(meta)
      );
      img.classList.toggle('is-small', /300×250|300x250/i.test(meta));
      img.classList.toggle('is-logo', /ロゴ|logo/i.test(meta));
    };

    function render(nextIdx, opts) {
      opts = opts || {};
      if (typeof nextIdx === 'number') idx = Math.max(0, Math.min(set.length - 1, nextIdx));
      figure.dataset.curIdx = idx;

      const item = set[idx];
      const rawLabel = item.label;
      const txt = (rawLabel && typeof rawLabel === 'object')
        ? (rawLabel[currentLang] || rawLabel.en || rawLabel.ja || `${idx + 1} / ${set.length}`)
        : (rawLabel || `${idx + 1} / ${set.length}`);

      /* altもlabelと同じく {"ja":..,"en":..,"fr":..} 形式に対応（文字列のままでも可） */
      const rawAlt = item.alt;
      const altTxt = (rawAlt && typeof rawAlt === 'object')
        ? (rawAlt[currentLang] || rawAlt.en || rawAlt.ja || '')
        : (rawAlt || '');

      uiLabel.textContent = txt;
      if (labelEl) labelEl.textContent = txt;

      /* 言語切り替え（textOnly）でもaltを更新する必要があるため、returnより前で反映する */
      img.alt = altTxt;

      if (opts.textOnly) return;

      let ghost = null;
      if (img.currentSrc || img.src) {
        ghost = document.createElement('img');
        ghost.className = 'mgallery-ghost';
        ghost.alt = img.alt || '';
        ghost.src = img.currentSrc || img.src;
        figure.appendChild(ghost);
      }

      img.classList.add('is-switching');
      img.onload = null;
      img.onerror = null;

      const finish = () => {
        applyClasses(altTxt, txt);
        requestAnimationFrame(() => img.classList.remove('is-switching'));
        if (ghost) {
          requestAnimationFrame(() => ghost.classList.add('is-done'));
          ghost.addEventListener('transitionend', () => ghost.remove(), { once: true });
          setTimeout(() => ghost && ghost.remove && ghost.remove(), 1300);
        }
      };

      img.onload = () => { finish(); img.onload = null; img.onerror = null; };
      img.onerror = () => {
        requestAnimationFrame(() => img.classList.remove('is-switching'));
        if (ghost) ghost.remove();
        img.onload = null; img.onerror = null;
      };

      img.src = item.src;
      if (img.complete) finish();

      prevBtn.disabled = (idx === 0);
      nextBtn.disabled = (idx === set.length - 1);
    }

    if (!ui.dataset.bound) {
      prevBtn.addEventListener('click', () => render(idx - 1));
      nextBtn.addEventListener('click', () => render(idx + 1));
      ui.dataset.bound = '1';
    }

    if (document.__designGalleryKeyHandler) {
      document.removeEventListener('keydown', document.__designGalleryKeyHandler);
    }

    document.__designGalleryKeyHandler = (e) => {
      const modalEl = document.getElementById('work-modal');
      if (!modalEl || !modalEl.classList.contains('is-open')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); render(idx - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); render(idx + 1); }
    };

    document.addEventListener('keydown', document.__designGalleryKeyHandler);

    set.forEach((it) => { const p = new Image(); p.src = it.src; });

    figure.dataset.galleryReady = '1';
    figure.__galleryRender = (i) => render(i, { textOnly: true });
    render(0);
  }

  function initAll(root) {
    if (!root) return;
    root.querySelectorAll('[data-gallery]').forEach(initDesignGallery);
  }

  function wireModalInside(modalBody, modalRoot) {
    if (!modalBody || !modalRoot) return;

    if (modalRoot.__onModalClick) {
      modalBody.removeEventListener('click', modalRoot.__onModalClick);
    }

    modalBody.querySelectorAll('[data-langbar]').forEach((bar) => {
      const activeBtn =
        bar.querySelector('.mwork__langbtn.is-active') ||
        bar.querySelector('.mwork__langbtn[data-lang="jp"]');
      const lang = (activeBtn && activeBtn.dataset.lang) ? activeBtn.dataset.lang : 'jp';
      const scope = bar.parentElement;
      scope.querySelectorAll('[data-langblock]').forEach((block) => {
        block.hidden = (block.dataset.langblock !== lang);
      });
    });

    modalRoot.__onModalClick = (e) => {
      const mtab = e.target.closest('.mtab[data-mtab]');
      if (mtab) {
        const key = mtab.dataset.mtab;
        const tabs = modalBody.querySelectorAll('.mtab[data-mtab]');
        const panels = modalBody.querySelectorAll('.mpanel[data-mpanel]');

        tabs.forEach((b) => {
          const active = (b === mtab);
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-selected', active ? 'true' : 'false');
        });

        panels.forEach((p) => {
          const willActive = (p.dataset.mpanel === key);
          if (willActive) {
            p.classList.remove('is-active');
            void p.offsetWidth;
            p.classList.add('is-active');
            p.setAttribute('aria-hidden', 'false');
          } else {
            p.classList.remove('is-active');
            p.setAttribute('aria-hidden', 'true');
          }
        });
        return;
      }

      const langBtn = e.target.closest('[data-langbar] .mwork__langbtn');
      if (langBtn) {
        const bar = langBtn.closest('[data-langbar]');
        const scope = bar.parentElement;
        const lang = langBtn.dataset.lang;

        bar.querySelectorAll('.mwork__langbtn').forEach((b) => {
          const active = (b === langBtn);
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        scope.querySelectorAll('[data-langblock]').forEach((block) => {
          block.hidden = (block.dataset.langblock !== lang);
        });
      }
    };

    modalBody.addEventListener('click', modalRoot.__onModalClick);
  }

  function extractLead(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const blockLang = currentLang === 'ja' ? 'jp' : currentLang;
    const scoped = tmp.querySelector(`[data-langblock="${blockLang}"]`);
    const lead = (scoped && scoped.querySelector('.mwork__lead'))
      || tmp.querySelector('.mwork__lead')
      || tmp.querySelector('.desc-lead');
    if (lead) return lead.textContent.trim();
    const firstP = (scoped && scoped.querySelector('p')) || tmp.querySelector('p');
    return firstP ? firstP.textContent.trim() : tmp.textContent.trim();
  }

  /* === サイドバー詳細パネル === */
  const sidebarDefault = document.getElementById('sidebar-default');
  const sidebarDetail  = document.getElementById('sidebar-detail');

  function showSidebarDetail(key, thumbSrc) {
    const data = MODAL_DATA[key];
    if (!data) return;
    currentSidebarKey = key;

    function applyContent() {
      document.getElementById('detail-title').textContent = pickText(data, 'title');
      document.getElementById('detail-scope').textContent = pickText(data, 'subtitle');
      document.getElementById('detail-role-label').textContent = '';
      document.getElementById('detail-role').textContent = '';
      document.getElementById('detail-desc').textContent = extractLead(data.html || '');
      const imgEl = document.getElementById('detail-img');
      imgEl.src           = thumbSrc || '';
      imgEl.style.display = thumbSrc ? '' : 'none';
      sidebarDetail.scrollTop = 0;
    }

    if (sidebarDetail.classList.contains('is-visible')) {
      // すでに表示中 → ブラーアウト→内容更新→ブラーイン
      sidebarDetail.classList.add('is-switching');
      setTimeout(() => {
        applyContent();
        sidebarDetail.classList.remove('is-switching');
      }, 500);
    } else {
      // 新規表示
      applyContent();
      sidebarDefault.classList.add('is-hidden');
      sidebarDetail.classList.add('is-visible');
      sidebarDetail.setAttribute('aria-hidden', 'false');
      document.querySelector('.contact-label').classList.add('is-hidden');
    }
  }

  function hideSidebarDetail() {
    sidebarDefault.classList.remove('is-hidden');
    sidebarDetail.classList.remove('is-visible');
    sidebarDetail.setAttribute('aria-hidden', 'true');
    document.querySelector('.contact-label').classList.remove('is-hidden');
    currentSidebarKey = null;
  }

  document.querySelectorAll('.work-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const thumbSrc = card.querySelector('.work-thumb img')?.src;
      showSidebarDetail(card.dataset.modal, thumbSrc);
    });
    card.addEventListener('mouseleave', hideSidebarDetail);
  });

  /* === モーダル開閉 === */
  const modalOverlay = document.getElementById('work-modal');
  const modalClose   = document.getElementById('modal-close');

  document.querySelectorAll('.work-card').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      const key  = card.dataset.modal;
      const data = MODAL_DATA[key];
      if (!data) return;
      currentModalKey = key;

      document.getElementById('modal-title').textContent = pickText(data, 'title');
      const subtitleEl = document.getElementById('modal-subtitle');
      if (subtitleEl) subtitleEl.textContent = pickText(data, 'subtitle');

      const bodyEl = document.getElementById('modal-body');
      bodyEl.innerHTML = data.html || '';

      initAll(bodyEl);
      wireModalInside(bodyEl, modalOverlay);

      /* モーダルを開くときも現在の言語を適用 */
      const modalLang = currentLang === 'ja' ? 'jp' : currentLang;
      bodyEl.querySelectorAll('[data-langblock]').forEach(block => {
        block.hidden = (block.dataset.langblock !== modalLang);
      });
      applyLangAttrs(bodyEl, modalLang);
      bodyEl.querySelectorAll('.mwork__langbtn').forEach(btn => {
        const active = btn.dataset.lang === modalLang;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      modalOverlay.classList.add('is-open');
      modalOverlay.setAttribute('aria-hidden', 'false');
    });
  });

  function closeModal() {
    modalOverlay.classList.remove('is-open');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.getElementById('modal-body').innerHTML = '';
    currentModalKey = null;
  }
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* === Page Top === */
  const pageTopEl    = document.getElementById('page-top');
  const leftBgScroll = document.querySelector('.left-bg-scroll');
  const isMobile     = () => window.innerWidth <= 768;

  if (leftBgScroll) {
    leftBgScroll.addEventListener('scroll', () => {
      if (!isMobile()) pageTopEl.classList.toggle('is-visible', leftBgScroll.scrollTop > 200);
    }, { passive: true });
  }
  window.addEventListener('scroll', () => {
    if (isMobile()) pageTopEl.classList.toggle('is-visible', window.scrollY > 200);
  }, { passive: true });

  pageTopEl.addEventListener('click', e => {
    e.preventDefault();
    if (isMobile()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      leftBgScroll?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  /* === モバイルイントロ（ページ読み込み時に名刺を一瞬表示） === */
  if (isMobile()) {
    const mobileIntro = document.getElementById('mobile-intro');
    if (mobileIntro) {
      setTimeout(() => {
        mobileIntro.setAttribute('aria-hidden', 'false');
        mobileIntro.classList.add('is-visible');
        setTimeout(() => {
          mobileIntro.classList.remove('is-visible');
          mobileIntro.addEventListener('transitionend', () => mobileIntro.remove(), { once: true });
        }, 2200);
      }, 2000);
    }
  }

  /* === リング位置をmain-columnの右端に合わせる === */
  const ringEl  = document.getElementById('ring-spine-img');
  const mainCol = document.querySelector('.main-column');

  function alignRing() {
    if (!ringEl || !mainCol || window.innerWidth <= 768) return;
    const rect = mainCol.getBoundingClientRect();
    if (rect.right > 0) ringEl.style.left = (rect.right - 30) + 'px';
  }

  window.addEventListener('load', alignRing);
  window.addEventListener('resize', alignRing, { passive: true });
  window.addEventListener('resize', alignRing, { passive: true });