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

  const I18N = {
    ja: { title: 'Works', contactLabel: 'ご依頼・ご相談はお気軽にどうぞ', catch: 'ユーザー視点と意思決定を軸に、<br>期待を超えるデザインを。', hint: 'カードにカーソルを当てると作品を確認できます' },
    en: { title: 'Works', contactLabel: 'Feel free to reach out for any project.', catch: 'Exceeding client expectations<br>with user-centric,<br>decision-focused design.', hint: 'hover a card to preview' },
  };

  function applyLang(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (I18N[lang][key] !== undefined) el.innerHTML = I18N[lang][key];
    });
    document.querySelectorAll('[data-ja]').forEach(el => {
      el.textContent = lang === 'ja' ? el.dataset.ja : el.dataset.en;
    });
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.lang === lang);
    });

    /* モーダルが開いているときはlangblockも切り替え */
    const modalEl = document.getElementById('work-modal');
    if (modalEl && modalEl.classList.contains('is-open')) {
      const bodyEl = document.getElementById('modal-body');
      const modalLang = lang === 'ja' ? 'jp' : 'en';
      bodyEl.querySelectorAll('[data-langblock]').forEach(block => {
        block.hidden = (block.dataset.langblock !== modalLang);
      });
      bodyEl.querySelectorAll('.mwork__langbtn').forEach(btn => {
        const active = btn.dataset.lang === modalLang;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
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
      title: 'Yori｜Private Salon LP Concept',
      subtitle: 'Web Design / UI Design / Concept Work',
      html: `
    <div class="mwork">

      <p class="mwork__lead">
        住宅街にあるプライベートサロン「Yori」を想定したコンセプトLP制作。<br><br>

        「静かに、整える時間。」をキーワードに、<br>
        通いやすさ・安心感・やわらかな上質感が伝わる世界観を設計しました。<br>
        過度な装飾や強い訴求を避け、余白と情報階層で落ち着いた体験をつくることを重視しています。<br><br>

        本作品はデザイン設計段階のアウトプットとして、<br>
        レスポンシブ実装を想定したレイアウトと情報密度の調整までを行いました。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/web/original/yori-salon/overview.webp",
              "alt":"Yori LP｜全体構成",
              "label":"全体構成"
            },
            {
              "src":"../images/works/web/original/yori-salon/mock_pc.webp",
              "alt":"Yori LP｜PC表示",
              "label":"PC"
            },
            {
              "src":"../images/works/web/original/yori-salon/mock_tablet_SP.webp",
              "alt":"Yori LP｜Tablet&SP表示",
              "label":"Tablet & SP"
            },
            {
              "src":"../images/works/web/original/yori-salon/extract.webp",
              "alt":"Yori LP｜一部抜粋",
              "label":"抜粋"
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/web/original/yori-salon/mock_pc.webp"
            alt="Yori LP｜PC表示">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
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

    </div>`
    },
    yori_reservation: {
      title: 'Yori｜Reservation Form UI',
      subtitle: 'UI Design / UX / Flow Design',
      html: `
    <div class="mwork">

      <p class="mwork__lead">
        プライベートサロン「Yori」を想定し、LPと同一トーンで予約フォームUIを設計しました。<br><br>
        メニュー選択 → 日時選択 → お客様情報入力 → 内容確認・送信の4ステップで構成し、<br>
        “迷いにくさ”と“落ち着いた体験”の両立を重視しています。<br><br>
        実装を想定し、ボタンの活性/非活性、選択状態、確認画面の情報整理まで状態設計を行いました。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/web/original/yori-reservation/overview.webp",
              "alt":"Yori 予約フォームUI｜モックアップ（PC/SP）",
              "label":"Overview"
            },
            {
              "src":"../images/works/web/original/yori-reservation/pc_step1.webp",
              "alt":"Yori 予約フォームUI｜PC（Step1：メニュー選択）",
              "label":"PC Step1"
            },
            {
              "src":"../images/works/web/original/yori-reservation/pc_step2.webp",
              "alt":"Yori 予約フォームUI｜PC（Step2：日時選択）",
              "label":"PC Step2"
            },
            {
              "src":"../images/works/web/original/yori-reservation/pc_step3.webp",
              "alt":"Yori 予約フォームUI｜PC（Step3：お客様情報入力）",
              "label":"PC Step3"
            },
            {
              "src":"../images/works/web/original/yori-reservation/sp_all.webp",
              "alt":"Yori 予約フォームUI｜SP（4画面一覧）",
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

    </div>`
    },
    lumiere: {
      title: 'LUMIÈRE｜Sensitive Skincare LP Concept',
      subtitle: 'Web Design / UI Design / Concept Work',
      html: `
    <div class="mwork">

      <p class="mwork__lead">
        敏感肌・乾燥肌の方に向けた、低刺激スキンケアブランド「LUMIÈRE」のコンセプトLP制作。<br><br>

        「静かに、続くケア。」を軸に、<br>
        肌へのやさしさと上質感が両立する世界観を設計しました。<br>
        情報を詰め込みすぎず、余白・トーン・階層設計によって安心感を伝えることを重視しています。<br><br>

        本作品はデザイン設計段階のアウトプットとして、<br>
        レスポンシブ実装を想定したレイアウトと情報密度の調整までを行いました。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/web/original/lumiere/overview.webp",
              "alt":"LUMIÈRE LP｜全体構成",
              "label":"全体構成"
            },
            {
              "src":"../images/works/web/original/lumiere/mock_pc.webp",
              "alt":"LUMIÈRE LP｜PC表示",
              "label":"PC"
            },
            {
              "src":"../images/works/web/original/lumiere/mock_tablet_SP.webp",
              "alt":"LUMIÈRE LP｜Tablet&SP表示",
              "label":"Tablet & SP"
            },
            {
              "src":"../images/works/web/original/lumiere/extract.webp",
              "alt":"LUMIÈRE LP｜一部抜粋",
              "label":"抜粋"
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/web/original/lumiere/mock_pc.webp"
            alt="LUMIÈRE LP｜PC表示">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
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

    </div>`
    },
    still_air: {
      title: 'STILL AIR｜Incense Brand LP Concept',
      subtitle: 'Web Design / UI Design / Concept Work',
      html: `
    <div class="mwork">

      <p class="mwork__lead">
        思考や作業に集中する時間を大切にする人に向けた、<br>
        お香ブランド「STILL AIR」のコンセプトLP制作。<br><br>

        香りを“気分を高める演出”ではなく、<br>
        空間と思考を静かに整えるための環境要素として再定義し、<br>
        実装を想定した情報設計と余白設計を軸に世界観を構築しました。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/web/original/still-air/overview.webp",
              "alt":"STILL AIR LP｜全体構成",
              "label":"全体構成"
            },
            {
              "src":"../images/works/web/original/still-air/mock_pc.webp",
              "alt":"STILL AIR LP｜PC表示",
              "label":"PC"
            },
            {
              "src":"../images/works/web/original/still-air/mock_tablet_SP.webp",
              "alt":"STILL AIR LP｜Tablet&SP表示",
              "label":"Tablet & SP"
            },
            {
              "src":"../images/works/web/original/still-air/extract.webp",
              "alt":"STILL AIR LP｜一部抜粋",
              "label":"抜粋"
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/web/original/still-air/mock_pc.webp"
            alt="STILL AIR LP｜PC表示">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
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

    </div>`
    },
    uru_hada: {
      title: '潤肌（URU-HADA）導入美容液｜Concept Work',
      subtitle: 'Branding / Advertising Design',
      html: `
    <div class="mwork">

      <p class="mwork__lead">
        仕事や生活の忙しさから、肌の変化が気になり始める<br>
        20代後半〜30代女性を想定した導入美容液ブランドのコンセプトワーク。<br><br>
        「10年後の肌に、今日のご褒美を。」を軸に、<br>
        透明感と上質感を大切にしたビジュアル設計を行いました。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/uru-hada/1200x628.webp",
              "alt":"潤肌（URU-HADA）導入美容液｜1200x628（SNS広告用）",
              "label":"1200x628（SNS広告用）"
            },
            {
              "src":"../images/works/design/original/uru-hada/300x250.webp",
              "alt":"潤肌（URU-HADA）導入美容液｜300x250（Web広告用）",
              "label":"300x250（Web広告用）"
            },
            {
              "src":"../images/works/design/original/uru-hada/logo.webp",
              "alt":"潤肌（URU-HADA）ロゴ",
              "label":"ロゴ"
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/design/original/uru-hada/1200x628.webp"
            alt="潤肌（URU-HADA）導入美容液｜1200x628（SNS広告用）">
        </figure>
      </section>

      <div class="mwork__langblock" data-langblock="jp">
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
        </div>`
    },
    business_statistics: {
      title: 'ゼロから学ぶ、ビジネス統計学オンライン講座｜Concept Work',
      subtitle: 'Logo / Web Banner（情報設計・販促）',
      html: `
  <div class="mwork">

    <p class="mwork__lead">
      統計やデータ分析に苦手意識を持つビジネスパーソン向けに、<br>
      「難しそう」という心理的ハードルを下げつつ、<br>
      損なわないトーンで設計したオンライン講座のロゴ・広告デザイン。<br><br>
      Web広告 / SNS投稿など用途に応じたサイズ展開でも、情報の伝わり方が崩れない構成を意識しました。
    </p>

    <section class="mwork__media" data-gallery>
      <figure class="modal__figure"
        data-set='[
          {
            "src":"../images/works/design/original/business-statistics/1080x1080.webp",
            "alt":"ゼロから学ぶ、ビジネス統計学オンライン講座｜1080x1080（SNS広告用）",
            "label":"1080x1080（SNS広告用）"
          },
          {
            "src":"../images/works/design/original/business-statistics/728x90.webp",
            "alt":"ゼロから学ぶ、ビジネス統計学オンライン講座｜728x90（Web広告 ビッグバナー）",
            "label":"728x90（Web広告用）"
          },
          {
            "src":"../images/works/design/original/business-statistics/logo.webp",
            "alt":"ゼロから学ぶ、ビジネス統計学オンライン講座｜ロゴ",
            "label":"ロゴ"
          }
        ]'>

        <img class="mwork__img"
          src="../images/works/design/original/business-statistics/1080x1080.webp"
          alt="ゼロから学ぶ、ビジネス統計学オンライン講座｜1080x1080（SNS広告用）">
      </figure>
    </section>

    <!-- JP -->
    <div class="mwork__langblock" data-langblock="jp">
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
    </div>`
    },
    pizzavita: {
      title: '本格窯焼きピザ「PIZZA VITA」',
      subtitle: 'Concept Work / Action・Promotion Design',
      html: `
    <div class="mwork">

      <p class="mwork__lead">
        週末の食卓に、少し特別な時間を。<br>
        本格窯焼きピザのデリバリーサービス「PIZZA VITA」を想定した広告ビジュアル。<br><br>
        チーズの伸びや湯気といったシズル感を軸に、<br>
        食欲を喚起する暖色トーンで構成し、<br>
        視線が自然にCTAへ流れるレイアウトを設計しました。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/pizzavita/1200x628.webp",
              "alt":"本格窯焼きピザ「PIZZA VITA」｜1200x628（SNS広告用）",
              "label":"1200x628（SNS広告用）"
            },
            {
              "src":"../images/works/design/original/pizzavita/728x90.webp",
              "alt":"本格窯焼きピザ「PIZZA VITA」｜728x90（ビッグバナー）",
              "label":"728x90（ビッグバナー）"
            },
            {
              "src":"../images/works/design/original/pizzavita/336x280.webp",
              "alt":"本格窯焼きピザ「PIZZA VITA」｜336x280（レクタングル）",
              "label":"336x280（レクタングル）"
            },
            {
              "src":"../images/works/design/original/pizzavita/logo.webp",
              "alt":"本格窯焼きピザ「PIZZA VITA」ロゴ",
              "label":"ロゴ"
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/design/original/pizzavita/1200x628.webp"
            alt="本格窯焼きピザ「PIZZA VITA」｜1200x628（SNS広告用）">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
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
      </div>`
    },
    v_couture: {
      title: 'V-COUTURE｜Metaverse Avatar Stylist',
      subtitle: 'Concept Work / Logo・Business Card Design（ブランディング）',
      html: `
    <div class="mwork">

      <p class="mwork__lead">
        メタバース空間で活動するアバター・スタイリストを想定し、<br>
        「デジタルの自分を、もっと自由に」をコンセプトに<br>
        ロゴおよび名刺デザインを制作しました。<br><br>
        画面上での見え方も意識し、未来感と上品さのバランスを整えています。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/v-couture/mockup.webp",
              "alt":"V-COUTURE｜名刺モックアップ",
              "label":"Mockup"
            },
            {
              "src":"../images/works/design/original/v-couture/card-front.webp",
              "alt":"V-COUTURE｜名刺 表",
              "label":"Business Card（Front）"
            },
            {
              "src":"../images/works/design/original/v-couture/card-back.webp",
              "alt":"V-COUTURE｜名刺 裏",
              "label":"Business Card（Back）"
            },
            {
              "src":"../images/works/design/original/v-couture/logo.webp",
              "alt":"V-COUTURE｜ロゴ",
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
    </div>`
    },
    kamosu: {
      title: '醸す（KAMOSU）｜Restaurant Branding',
      subtitle: 'Concept Work / Business Card Design（和モダン・ラグジュアリー）',
      html: `
    <div class="mwork">

      <p class="mwork__lead">
        予約困難な隠れ家「発酵」モダン・ビストロを想定し、<br>
        「微生物との対話」をコンセプトに名刺デザインを制作。<br><br>
        余白・和紙の質感・墨のにじみを軸に、<br>
        静かで凛とした佇まいと、格式と現代性のバランスを設計しました。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/kamosu/mockup.webp",
              "alt":"醸す（KAMOSU）｜名刺モックアップ",
              "label":"Mockup"
            },
            {
              "src":"../images/works/design/original/kamosu/card-front.webp",
              "alt":"醸す（KAMOSU）｜名刺 表（縦型）",
              "label":"Business Card（Front）"
            },
            {
              "src":"../images/works/design/original/kamosu/card-back.webp",
              "alt":"醸す（KAMOSU）｜名刺 裏（縦型）",
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
    </div>`
    },
    aoi_architects: {
      title: 'AOI Architects（株式会社 碧 設計事務所）',
      subtitle: 'Concept Work / Logo・Business Card Design（サステナブル建築）',
      html: `
    <div class="mwork">

      <p class="mwork__lead">
        次世代型サステナブル建築事務所を想定したロゴ・名刺デザイン。<br>
        「100年後の風景をつくる」という理念を軸に、<br>
        誠実なトーンを設計しました。<br><br>
        紙ポートフォリオの全体トーンには採用せずお蔵入りとなった案ですが、<br>
        Webでは試作の幅として掲載しています。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/aoi-architects/mockup.webp",
              "alt":"AOI Architects｜名刺モックアップ",
              "label":"Mockup"
            },
            {
              "src":"../images/works/design/original/aoi-architects/card-front.webp",
              "alt":"AOI Architects｜名刺 表",
              "label":"Business Card（Front）"
            },
            {
              "src":"../images/works/design/original/aoi-architects/card-back.webp",
              "alt":"AOI Architects｜名刺 裏",
              "label":"Business Card（Back）"
            },
            {
              "src":"../images/works/design/original/aoi-architects/logo.webp",
              "alt":"AOI Architects｜ロゴ",
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
    </div>`
    },
    loop_cafe: {
      title: 'Loop Cafe（ループ・カフェ）｜Concept Work',
      subtitle: 'Sustainable Branding / Logo & Applications',
      html: `
    <div class="mwork">

      <p class="mwork__lead">
        「循環（Loop）」をテーマにした、<br>
        都市型サステナブルカフェのコンセプトワーク。<br>
        ミニマルでクリーン、<br>
        素材感が主役になるトーンを意識してロゴと展開例を制作しました。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/loop-cafe/logo.webp",
              "alt":"Loop Cafe｜ロゴ",
              "label":"ロゴ"
            },
            {
              "src":"../images/works/design/original/loop-cafe/mockup.webp",
              "alt":"Loop Cafe｜展開イメージ（カップ・トート・看板）",
              "label":"展開イメージ"
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/design/original/loop-cafe/mockup.webp"
            alt="Loop Cafe｜展開イメージ（カップ・トート・看板）">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
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

    </div>`
    },
    nexus_ai: {
      title: 'Nexus AI（ネクサス・エーアイ）',
      subtitle: 'Concept Work / Logo Design（Tech Startup Branding）',
      html: `
    <div class="mwork">

      <p class="mwork__lead">
        クリエイターの創造性を拡張するAIツールを提供するテックスタートアップ<br>
        「Nexus AI」を想定したロゴデザイン。<br><br>
        「Nexus＝つながり」をテーマに、点と線が有機的に結びつく構造で<br>
        先進性と信頼感、柔軟さを同時に表現しました。<br><br>
        アプリアイコンやWebヘッダーなど、<br>
        デジタル上での視認性と汎用性を重視しています。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/nexus-ai/logo.webp",
              "alt":"Nexus AI｜ロゴ",
              "label":"ロゴ"
            },
            {
              "src":"../images/works/design/original/nexus-ai/mockup.webp",
              "alt":"Nexus AI｜展開モックアップ（アプリアイコン / Webヘッダー）",
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
    </div>`
    },
    sora: {
      title: 'パーソナライズド・スキンケアブランド「SORA」',
      subtitle: 'Concept Work / Logo・Package・Shopper Design',
      html: `
    <div class="mwork">

      <p class="mwork__lead">
        その日の肌状態や天候に応じて成分を調整する、<br>
        D2C型の高級スキンケアブランド「SORA」を想定したコンセプトワーク。<br><br>
        「空間」「余白」「広がり」をキーワードに、<br>
        静謐で上質な透明感を軸としたビジュアルアイデンティティを設計しました。<br>
        ロゴからパッケージ、ショッパーまでトーンを統一し、<br>
        白・黒どちらの背景でも成立する汎用性を重視しています。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/sora/logo.webp",
              "alt":"SORA｜Logo",
              "label":"ロゴ"
            },
            {
              "src":"../images/works/design/original/sora/mockup-white.webp",
              "alt":"SORA｜Mockup（White ver.）",
              "label":"モックアップ（White）"
            },
            {
              "src":"../images/works/design/original/sora/mockup-black.webp",
              "alt":"SORA｜Mockup（Black ver.）",
              "label":"モックアップ（Black）"
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/design/original/sora/mockup-white.webp"
            alt="SORA｜Mockup（White ver.）">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
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
    </div>`
    },
    winter_choco: {
      title: '冬限定一口チョコ',
      subtitle: 'Concept Work / Food・Seasonal Promotion',
      html: `
    <div class="mwork">
      <p class="mwork__lead">
        冬限定の一口チョコ販促を想定した広告ビジュアル。<br>
        “溶け”などの情緒表現に寄らず、<br>
        季節感と素材感を軸に上質さを設計しました。<br><br>
        百貨店・EC展開を想定し、<br>
        落ち着いたトーンと余白で冬のご褒美感を演出しています。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/kobayas/winter-choco/300x280.webp",
              "alt":"冬限定一口チョコ｜300x280",
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
        <div class="mwork__divider mwork__points">
          <h3>Summary</h3>
          <p class="mwork__en">
            Promotional banner for a seasonal bite-sized chocolate product.<br>
            Built around winter atmosphere and material texture rather than overt “melting” emotion,
            using a calm palette and generous spacing to convey a premium, gift-like feel.
          </p>
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
    </div>`
    },
    onsen: {
      title: '貸切露天風呂付き宿泊プラン',
      subtitle: 'Promotion Banner / 2 Variations（販促・ブランディング）',
      html: `
    <div class="mwork">

      <p class="mwork__lead">
        同一テーマを <strong>短期販促</strong> と <strong>高級旅館向け</strong> の2目的で制作。<br>
        ターゲットの温度差に合わせて、情報量・余白・視線誘導を切り替えました。
      </p>

      <div class="mtabs" role="tablist" aria-label="バナーバリエーション">
        <button class="mtab is-active" type="button" role="tab" aria-selected="true" data-mtab="lux">高級旅館向け</button>
        <button class="mtab" type="button" role="tab" aria-selected="false" data-mtab="camp">短期販促</button>
      </div>

      <div class="mpanels">
        <section class="mpanel is-active" data-mpanel="lux">
          <figure class="modal__figure">
            <img src="../images/works/design/original/kobayas/onsen/premium.webp"
              alt="高級旅館向けに静けさと特別感を演出した貸切露天風呂付き宿泊プランの訴求バナー">
            <figcaption class="modal__caption">
              <p><strong>高級旅館向け（ブランディング重視）</strong></p>
              <p>余白・上質感・体験価値を軸に、押しすぎずに惹き込む設計。</p>
            </figcaption>
          </figure>
        </section>

        <section class="mpanel" data-mpanel="camp">
          <figure class="modal__figure">
            <img src="../images/works/design/original/kobayas/onsen/hansoku.webp"
              alt="短期集客を目的に3大特典を強調した貸切露天風呂付き宿泊プランのキャンペーンバナー">
            <figcaption class="modal__caption">
              <p><strong>短期販促（キャンペーン訴求）</strong></p>
              <p>即時行動を促すため、特典とメリットを明確に前面化。</p>
            </figcaption>
          </figure>
        </section>
      </div>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
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
    </div>`
    },
    kobayasland: {
      title: 'Kobayasランド開園記念',
      subtitle: 'Concept Work / Event・Leisure Promotion',
      html: `
    <div class="mwork">
      <p class="mwork__lead">
        遊園地の開園記念イベントを想定した販促バナー。<br>
        にぎやかさと情報量を前提にしつつ、<br>
        視線の流れを整理して判断材料を一画面に集約しました。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/kobayas/kobayasland/800x200.webp",
              "alt":"Kobayasランド開園記念｜800x200",
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
        <div class="mwork__divider mwork__points">
          <h3>Summary</h3>
          <p class="mwork__en">
            Launch celebration banner for a theme park event.<br>
            It embraces a lively, information-rich layout while keeping a clear viewing path,
            consolidating key decision cues such as discount, period, and event details in one screen.
          </p>
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
    </div>`
    },
    kobapay: {
      title: 'Koba pay アプリ利用案内',
      subtitle: 'Concept Work / Cashless Payment App Promotion',
      html: `
    <div class="mwork">
      <p class="mwork__lead">
        地域密着型キャッシュレス決済アプリ「koba-pay」の<br>
        利用促進キャンペーンを想定した広告ビジュアル。<br>
        ポイント付与・還元率など即時ベネフィットを主役に、<br>
        数字→QR→コピーの順で読める構成に設計しました。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/kobayas/kobapay/350x200.webp",
              "alt":"koba-pay 利用促進バナー｜350x200",
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
        <div class="mwork__divider mwork__points">
          <h3>Summary</h3>
          <p class="mwork__en">
            Campaign banner for a local cashless payment app, “koba-pay.”<br>
            It highlights instant benefits such as points and cashback for quick understanding,
            guiding attention from key numbers to the QR code and supporting copy.
          </p>
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
    </div>`
    },
    kobafitness: {
      title: 'スポーツKoba フィットネスクラブ',
      subtitle: 'Concept Work / Fitness Club Promotion',
      html: `
    <div class="mwork">
      <p class="mwork__lead">
        フィットネスクラブの新春入会キャンペーンを想定した広告ビジュアル。<br>
        0円訴求で初期ハードルを下げつつ、「続けられる」メッセージで不安を補完し、<br>
        数字・コピー・人物ビジュアルの優先順位を整理して設計しました。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/kobayas/kobafitness/500x500.webp",
              "alt":"スポーツKoba フィットネスクラブ｜500x500",
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
        <div class="mwork__divider mwork__points">
          <h3>Summary</h3>
          <p class="mwork__en">
            New Year membership campaign banner for a fitness club.<br>
            The layout leads with a “0 yen” offer to reduce entry friction,
            while supportive copy reassures consistency, keeping a clear hierarchy
            between price, message, and lifestyle imagery.
          </p>
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
    </div>`
    },
    lunch_menu: {
      title: '地域カフェ「Café With」A5メニューチラシ',
      subtitle: 'Flyer Design / A5 / In-store & Handout',
      html: `
    <div class="mwork">

      <p class="mwork__lead">
        カフェのランチ利用や日常的な来店を想定し、店頭設置・手渡し配布のどちらにも対応できるA5チラシを制作。<br><br>
        ランチ・ケーキ・ドリンク・クーポンと情報量が多い媒体であることを前提に、<br>
        <strong>「内容・価格・提供時間」</strong>が一目で把握できる情報設計と、親しみやすい世界観の両立を意識しました。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/cafe-with/flyer.webp",
              "alt":"Café With｜A5 Flyer",
              "label":"チラシ全体"
            },
            {
              "src":"../images/works/design/original/cafe-with/mockup.webp",
              "alt":"Café With｜Mockup",
              "label":"モックアップ"
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

    </div>`
    },
    bernes: {
      title: '大型犬×免許証オマージュ名刺（自主制作）',
      subtitle: 'Personal Work / Business Card Design',
      html: `
    <div class="mwork">

      <p class="mwork__lead">
        大型犬が好きすぎて、ついに名刺にも登場してもらいました🐶<br>
        それと、昔ちょっと「免許証持ってる＝大人である」と<br>
	謎に憧れてた時期があって…<br>
        その2つを合体させた、自主制作の“IDカード風名刺”です。<br><br>
        ちゃんと使える情報整理は守りつつ、堅すぎない雰囲気に寄せています。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/bernes/mockup.webp",
              "alt":"大型犬×免許証オマージュ名刺｜モックアップ",
              "label":"モックアップ"
            },
            {
              "src":"../images/works/design/original/bernes/front.webp",
              "alt":"大型犬×免許証オマージュ名刺｜表",
              "label":"表"
            },
            {
              "src":"../images/works/design/original/bernes/back.webp",
              "alt":"大型犬×免許証オマージュ名刺｜裏",
              "label":"裏"
            }
          ]'>

          <img class="mwork__img"
            src="../images/works/design/original/bernes/mockup.webp"
            alt="大型犬×免許証オマージュ名刺｜モックアップ">
        </figure>
      </section>

      <!-- JP -->
      <div class="mwork__langblock" data-langblock="jp">
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
        <div class="mwork__divider mwork__points">
          <h3>Summary</h3>
          <p class="mwork__en">
            A self-initiated business card inspired by ID card layouts and my love for large dogs 🐾<br>
            It keeps information clean and readable, while adding a friendly touch through illustration and soft tones.
          </p>
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
    </div>`
    },
    portfolio_print: {
      title: '紙ポートフォリオ',
      subtitle: 'Personal Work / Print Design',
      html: `
    <div class="mwork">

      <p class="mwork__lead">
        自身の主にデザイナーとしての活動をまとめた紙ポートフォリオ。<br>
        作品そのものだけでなく、「どう考えて・どう構成しているか」が伝わるよう、<br>
        余白・グリッド・情報階層を意識したブックデザインを行いました。<br><br>
        静かでモダンなトーンをベースに、<br>
        実務資料としても、自己表現の媒体としても成立する構成を目指しています。<br>
        ※イラストレ作品は別途イラストポートフォリオを制作中でございます。
      </p>

      <section class="mwork__media" data-gallery>
        <figure class="modal__figure"
          data-set='[
            {
              "src":"../images/works/design/original/portfolio/mockup.webp",
              "alt":"紙ポートフォリオ｜モックアップ",
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
        <div class="mwork__divider mwork__points">
          <h3>Summary</h3>
          <p class="mwork__en">
            A self-designed printed portfolio showcasing my illustration and design work.<br>
            The book focuses not only on visuals, but also on structure, spacing, and information hierarchy,<br>
            allowing the reader to understand my design thinking at a glance.<br><br>
            Designed with a calm, modern tone, it functions both as a professional presentation tool<br>
            and as a personal expression of my design approach.
          </p>
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
      prev.textContent = '＜';

      const label = document.createElement('div');
      label.className = 'mgallery-ui__label';
      label.setAttribute('aria-live', 'polite');

      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'mgallery-ui__btn';
      next.setAttribute('aria-label', '次の画像へ');
      next.textContent = '＞';

      ui.append(prev, label, next);
      figure.insertAdjacentElement('beforebegin', ui);
    }

    const prevBtn = ui.querySelector('.mgallery-ui__btn:nth-child(1)');
    const uiLabel = ui.querySelector('.mgallery-ui__label');
    const nextBtn = ui.querySelector('.mgallery-ui__btn:nth-child(3)');

    if (getComputedStyle(figure).position === 'static') figure.style.position = 'relative';

    let idx = 0;

    const applyClasses = (item, txt) => {
      const meta = `${txt} ${item.alt || ''}`;
      img.classList.toggle(
        'is-banner',
        /(300[×x\*]25\d|300[×x\*]26\d|300[×x\*]600|160[×x\*]600|728[×x\*]90|970[×x\*]250|468[×x\*]60)/i.test(meta)
      );
      img.classList.toggle('is-small', /300×250|300x250/i.test(meta));
      img.classList.toggle('is-logo', /ロゴ|logo/i.test(meta));
    };

    function render(nextIdx) {
      if (typeof nextIdx === 'number') idx = Math.max(0, Math.min(set.length - 1, nextIdx));

      const item = set[idx];
      const txt = item.label || `${idx + 1} / ${set.length}`;

      uiLabel.textContent = txt;
      if (labelEl) labelEl.textContent = txt;

      let ghost = null;
      if (img.currentSrc || img.src) {
        ghost = document.createElement('img');
        ghost.className = 'mgallery-ghost';
        ghost.alt = img.alt || '';
        ghost.src = img.currentSrc || img.src;
        figure.appendChild(ghost);
      }

      img.classList.add('is-switching');
      img.alt = item.alt || '';
      img.onload = null;
      img.onerror = null;

      const finish = () => {
        applyClasses(item, txt);
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
    const lead = tmp.querySelector('.mwork__lead') || tmp.querySelector('.desc-lead');
    if (lead) return lead.textContent.trim();
    const firstP = tmp.querySelector('p');
    return firstP ? firstP.textContent.trim() : tmp.textContent.trim();
  }

  /* === サイドバー詳細パネル === */
  const sidebarDefault = document.getElementById('sidebar-default');
  const sidebarDetail  = document.getElementById('sidebar-detail');

  function showSidebarDetail(key, thumbSrc) {
    const data = MODAL_DATA[key];
    if (!data) return;

    function applyContent() {
      document.getElementById('detail-title').textContent = data.title || '';
      document.getElementById('detail-scope').textContent = data.subtitle || '';
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

      document.getElementById('modal-title').textContent = data.title || '';
      const subtitleEl = document.getElementById('modal-subtitle');
      if (subtitleEl) subtitleEl.textContent = data.subtitle || '';

      const bodyEl = document.getElementById('modal-body');
      bodyEl.innerHTML = data.html || '';

      initAll(bodyEl);
      wireModalInside(bodyEl, modalOverlay);

      /* モーダルを開くときも現在の言語を適用 */
      const modalLang = currentLang === 'ja' ? 'jp' : 'en';
      bodyEl.querySelectorAll('[data-langblock]').forEach(block => {
        block.hidden = (block.dataset.langblock !== modalLang);
      });
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