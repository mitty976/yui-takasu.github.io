  /* === 季節カラー === */
  const SEASONS = {
    spring: { months: [3,4,5],   bg:'#FFFAFF', works:'#FFEEF4', sidebar:'#F8D8E8', border:'#EAB5C5', accent:'#D4879A', btn:'#D4879A', cursor:'../assets/img/cursor/cursor-spring.png',
              effect:'sakura', colors:['#FAE6E6','#F5C8C8','#F7B8C8','#F9D0D8','#F0A0B8'] },
    summer: { months: [6,7,8],   bg:'#F3F8FF', works:'#DEEEFF', sidebar:'#B8D4F5', border:'#78B0E4', accent:'#4090CC', btn:'#4090CC', cursor:'../assets/img/cursor/cursor-summer.png',
              effect:'summer', colors:['rgba(80,140,210,0.5)','rgba(100,160,225,0.45)','rgba(120,175,235,0.5)','rgba(70,125,200,0.45)'] },
    autumn: { months: [9,10,11], bg:'#FFFCF8', works:'#FFF0E4', sidebar:'#EED8C8', border:'#C8A090', accent:'#8C5048', btn:'#8C5048', cursor:'../assets/img/cursor/cursor-autumn.png',
              effect:'autumn', colors:['#C87828','#D49048','#B06028','#E8A058','#A84820'] },
    winter: { months: [12,1,2],  bg:'#F8F6FF', works:'#EDE8FF', sidebar:'#D5CCF0', border:'#AEA2D8', accent:'#8878CC', btn:'#8878CC', cursor:'../assets/img/cursor/cursor-winter.png',
              effect:'snow',   colors:['#ffffff','#F4F0FF','#E8E0FF','#F8F6FF'] },
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

  /* page-topボタンを季節カラーに染める */
  const pageTopFlood = document.getElementById('page-top-flood');
  if (pageTopFlood) pageTopFlood.setAttribute('flood-color', season.btn);

  /* === ローダー（液体上昇アニメーション） === */
  const loader    = document.getElementById('loader');
  const lcanvas   = document.getElementById('loader-canvas');
  const lctx      = lcanvas.getContext('2d');
  const liqColor  = season.sidebar;
  let lW, lH, lLevel, lTick, lAnim;
  const lBubbles  = [];

  function lSpawn() {
    const liquidH = lH * lLevel / 100;
    const sy = lH - liquidH;
    /* 液体全体にランダム分散、下30%に多めに配置 */
    const yRange = Math.max(liquidH, 10);
    const rawY = Math.random() < 0.5
      ? lH - Math.random() * yRange * 0.3        /* 下30%：濃密ゾーン */
      : sy + Math.random() * yRange;              /* 全体にも散らす */
    return {
      x:       Math.random() * lW,
      y:       Math.min(rawY, lH),
      r:       Math.random() * 5 + 2,
      vy:      Math.random() * 2.5 + 1.5,         /* 1.5〜4px/frame で上昇 */
      life:    0,
      maxLife: Math.floor(Math.random() * 150 + 80),
    };
  }

  function lInit() {
    lW = lcanvas.width  = window.innerWidth;
    lH = lcanvas.height = window.innerHeight;
    lLevel = 0;
    lTick  = 0;
    lBubbles.length = 0;
    for (let i = 0; i < 55; i++) lBubbles.push(lSpawn());
  }

  function lDraw() {
    lctx.clearRect(0, 0, lW, lH);
    lctx.fillStyle = '#ffffff';
    lctx.fillRect(0, 0, lW, lH);

    const sy = lH - lH * lLevel / 100;

    if (lLevel > 0) {
      const wave   = 75 * Math.sin(lTick / 35);

      /* 後ろ層（season.border カラー・波が逆方向・少し高め） */
      const waveBg = -wave;
      const syBg   = sy - 55;
      lctx.fillStyle = season.border;
      lctx.beginPath();
      lctx.moveTo(0, lH);
      lctx.lineTo(lW, lH);
      lctx.lineTo(lW, syBg);
      lctx.bezierCurveTo(lW * 0.33, syBg + waveBg, lW * 0.67, syBg - waveBg, 0, syBg);
      lctx.closePath();
      lctx.fill();

      /* 前景液体（通常色） */
      lctx.fillStyle = liqColor;
      lctx.beginPath();
      lctx.moveTo(0, lH);
      lctx.lineTo(lW, lH);
      lctx.lineTo(lW, sy);
      lctx.bezierCurveTo(lW * 0.67, sy + wave, lW * 0.33, sy - wave, 0, sy);
      lctx.closePath();
      lctx.fill();

      /* 泡（液体内のみ） */
      lctx.lineWidth = 1.5;
      for (const b of lBubbles) {
        if (b.y > sy && b.y < lH) {
          const fade = b.life > b.maxLife - 25
            ? (b.maxLife - b.life) / 25
            : Math.min(b.life / 15, 1);
          lctx.strokeStyle = `rgba(255,255,255,${0.65 * fade})`;
          lctx.beginPath();
          lctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          lctx.stroke();
        }
      }
    }

    lTick++;
    const prevLevel = lLevel;
    lLevel = Math.min(lLevel + 0.65, 100);
    const lRisePx = (lLevel - prevLevel) * lH / 100;

    for (const b of lBubbles) {
      b.y -= b.vy + lRisePx * 0.85;
      b.x += (Math.random() - 0.5) * 0.3;
      b.life++;
      if (b.life >= b.maxLife || b.y < sy - b.r) {
        Object.assign(b, lSpawn());
      }
    }

    if (lLevel >= 100) { lSplitT = 0; lAnim = requestAnimationFrame(lDrawSplit); return; }
    lAnim = requestAnimationFrame(lDraw);
  }

  let lSplitT = 0;
  const curtainColor = season.sidebar;

  function lDrawSplit() {
    lctx.clearRect(0, 0, lW, lH);

    const t = lSplitT;

    // translateX（パネル幅 lW/2 に対する割合）
    let tx;
    if (t <= 0.2)      { tx = 0; }
    else if (t <= 0.6) { tx = -0.5 * (t - 0.2) / 0.4; }
    else               { tx = -0.5 - 0.5 * (t - 0.6) / 0.4; }

    // rotate（度）
    let rotDeg;
    if (t <= 0.2)      { rotDeg = 0; }
    else if (t <= 0.6) { rotDeg = 6 * (t - 0.2) / 0.4; }
    else               { rotDeg = 6 * (1 - (t - 0.6) / 0.4); }
    const rot = rotDeg * Math.PI / 180;

    // opacity（80%〜100%でフェードアウト）
    const opacity = t <= 0.8 ? 1 : 1 - (t - 0.8) / 0.2;

    // ストライプは停止フェーズ（0〜20%）でフェードイン
    const stripeAlpha = Math.min(t / 0.2, 1);

    const slideL  = tx * (lW / 2);
    const panelW  = lW / 2 + 20;
    const panelH  = lH * 1.3;
    const stripeW = lW / 14;
    const n       = Math.ceil(panelW / stripeW) + 1;

    // 左パネル
    lctx.save();
    lctx.globalAlpha = opacity;
    lctx.translate(lW / 4 + slideL, lH / 2);
    lctx.rotate(rot);
    lctx.fillStyle = curtainColor;
    lctx.fillRect(-panelW / 2, -panelH / 2, panelW, panelH);
    lctx.save();
    lctx.beginPath();
    lctx.rect(-panelW / 2, -panelH / 2, panelW - stripeW, panelH); // 内側1本分クリップ
    lctx.clip();
    lctx.globalAlpha = opacity * stripeAlpha * 0.8;
    lctx.fillStyle = season.border;
    for (let i = 1; i < n; i += 2) {
      lctx.fillRect(-panelW / 2 + i * stripeW, -panelH / 2, stripeW, panelH);
    }
    lctx.restore();
    lctx.restore();

    // 右パネル
    lctx.save();
    lctx.globalAlpha = opacity;
    lctx.translate(lW * 3 / 4 - slideL, lH / 2);
    lctx.rotate(-rot);
    lctx.fillStyle = curtainColor;
    lctx.fillRect(-panelW / 2, -panelH / 2, panelW, panelH);
    lctx.globalAlpha = opacity * stripeAlpha * 0.8;
    lctx.fillStyle = season.border;
    for (let i = 1; i < n; i += 2) {
      lctx.fillRect(-panelW / 2 + i * stripeW, -panelH / 2, stripeW, panelH);
    }
    lctx.restore();

    lSplitT += 0.012;
    if (lSplitT >= 1) { loaderHide(); return; }
    lAnim = requestAnimationFrame(lDrawSplit);
  }

  function loaderHide() {
    if (typeof Sakura !== 'undefined' && Sakura.canvas) {
      Sakura.canvas.style.zIndex = '30';
      document.body.appendChild(Sakura.canvas);
    }
    loader.classList.add('is-gone');
    /* 受注状況の吊り札はローダーが明けてから落とす。
       読み込み直後に走らせるとローダーの裏で終わってしまう */
    document.body.classList.add('is-ready');
  }

  lInit();
  lAnim = requestAnimationFrame(lDraw);

  /* === カスタムカーソル === */
  const cursorEl  = document.getElementById('custom-cursor');
  const cursorImg = document.getElementById('custom-cursor-img');
  cursorImg.src = season.cursor;

  document.addEventListener('mousemove', e => {
    cursorEl.style.left = e.clientX + 'px';
    cursorEl.style.top  = e.clientY + 'px';
  });

  /* クリック可能要素でサイズアップ */
  document.querySelectorAll('a, button, input, select, label, [role="button"]').forEach(el => {
    el.addEventListener('mouseenter', () => cursorEl.classList.add('is-large'));
    el.addEventListener('mouseleave', () => cursorEl.classList.remove('is-large'));
  });

  /* === 季節パーティクル === */
  const rand    = (a, b) => Math.random() * (b - a) + a;
  const pick    = arr => arr[Math.floor(Math.random() * arr.length)];

  /* 春以外の共通パーティクルエンジン */
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

  /* 雨エフェクト — Particleのcleanup機構を再利用 */
  function startRain(colors) {
    const cv = document.createElement('canvas');
    Object.assign(cv.style, { position:'fixed', top:'0', left:'0', width:'100%', height:'100%', pointerEvents:'none', zIndex:'30' });
    document.body.appendChild(cv);
    Particle.cv = cv;
    const ctx2 = cv.getContext('2d');
    const resize = () => { cv.width = innerWidth; cv.height = innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const drops = Array.from({ length: 55 }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      len: 10 + Math.random() * 14, vy: 4.5 + Math.random() * 3.5,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    Particle.run = true;
    (function loop() {
      if (!Particle.run) return;
      ctx2.clearRect(0, 0, cv.width, cv.height);
      drops.forEach(d => {
        d.y += d.vy;
        if (d.y > cv.height + 30) { d.y = -20; d.x = Math.random() * cv.width; }
        ctx2.strokeStyle = d.color;
        ctx2.lineWidth = 0.7; ctx2.lineCap = 'round';
        ctx2.beginPath();
        ctx2.moveTo(d.x, d.y);
        ctx2.lineTo(d.x - d.len * 0.15, d.y + d.len);
        ctx2.stroke();
      });
      requestAnimationFrame(loop);
    })();
  }

  if (season.effect === 'sakura') {
    Sakura.init({ count: 14, colors: season.colors, minSize: 4, maxSize: 10, zIndex: '30' });
    /* init直後にcanvasをloaderへ移動 → ローダー中に桜が降る */
    if (loader && Sakura.canvas) {
      Sakura.canvas.style.zIndex = '1';
      loader.appendChild(Sakura.canvas);
    }
    document.addEventListener('visibilitychange', () => {
      if (!Sakura.canvas) return;
      if (document.hidden) { Sakura.running = false; cancelAnimationFrame(Sakura.raf); }
      else { Sakura.running = true; Sakura._loop(); }
    });
  } else if (season.effect === 'summer') {
    /* 夏：雨（梅雨） */
    startRain(season.colors);
  } else if (season.effect === 'autumn') {
    /* 秋：落ち葉（葉脈入り） */
    Particle.init({ count: 16, colors: season.colors, min: 5, max: 11,
      draw(ctx, p) {
        const r = p.size;
        /* 葉の輪郭：幅広の先端形 */
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.bezierCurveTo( r * 1.15, -r * 0.4,  r * 0.85,  r * 0.5, 0, r * 0.7);
        ctx.bezierCurveTo(-r * 0.85,  r * 0.5, -r * 1.15, -r * 0.4, 0, -r);
        ctx.fill();
        /* 葉脈3本 */
        ctx.strokeStyle = 'rgba(255,255,255,0.32)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.7); ctx.lineTo( r * 0.32, r * 0.4);
        ctx.moveTo(0, -r * 0.7); ctx.lineTo(-r * 0.32, r * 0.4);
        ctx.moveTo(0, -r * 0.7); ctx.lineTo(0, r * 0.5);
        ctx.stroke();
        /* 茎 */
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(0, r * 0.7); ctx.lineTo(0, r * 1.5);
        ctx.stroke();
      }
    });
  } else if (season.effect === 'snow') {
    /* 冬：雪 */
    Particle.init({ count: 28, colors: season.colors, min: 2, max: 5,
      draw(ctx, p) {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
      }
    });
  }

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

    /* カーソル画像更新 */
    cursorImg.src = s.cursor;

    /* page-top ボタンの色 */
    const flood = document.getElementById('page-top-flood');
    if (flood) flood.setAttribute('flood-color', s.btn);

    /* 既存パーティクル停止 */
    if (Sakura.canvas) Sakura.stop();
    if (Particle.cv)   Particle.stop();

    /* 新しいパーティクル開始 */
    if (s.effect === 'sakura') {
      Sakura.init({ count: 14, colors: s.colors, minSize: 4, maxSize: 10, zIndex: '30' });
    } else if (s.effect === 'summer') {
      /* 夏：雨（梅雨） */
      startRain(s.colors);
    } else if (s.effect === 'autumn') {
      /* 秋：落ち葉（葉脈入り） */
      Particle.init({ count: 16, colors: s.colors, min: 5, max: 11,
        draw(ctx, p) {
          const r = p.size;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.bezierCurveTo( r * 1.15, -r * 0.4,  r * 0.85,  r * 0.5, 0, r * 0.7);
          ctx.bezierCurveTo(-r * 0.85,  r * 0.5, -r * 1.15, -r * 0.4, 0, -r);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.32)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(0, -r * 0.7); ctx.lineTo( r * 0.32, r * 0.4);
          ctx.moveTo(0, -r * 0.7); ctx.lineTo(-r * 0.32, r * 0.4);
          ctx.moveTo(0, -r * 0.7); ctx.lineTo(0, r * 0.5);
          ctx.stroke();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(0, r * 0.7); ctx.lineTo(0, r * 1.5);
          ctx.stroke();
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

  /* 現在の季節ボタンをアクティブに */
  const currentSeasonKey = Object.keys(SEASONS).find(k => SEASONS[k].months.includes(month)) || 'spring';
  document.querySelectorAll('.season-btn').forEach(b =>
    b.classList.toggle('is-active', b.dataset.season === currentSeasonKey)
  );

  /* === ワークモーダル === */
  const WORK_MODAL_DATA = {
    illust_kaikunschedule: {
      title: '【お仕事絵】白旗かい様‐週間配信スケジュール表',
      titleEn: '[Commission] Hakki Kai — Weekly Stream Schedule',
      titleFr: '[Commande] Hakki Kai — Planning hebdomadaire de diffusion',
      subtitle: 'Schedule / Still illustration',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/かいくんー配信スケジュールサンプル.webp" alt="白旗かい様 週間配信スケジュール表"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 06月 制作</p>
        <p class="illu-desc">白旗かい様（<a class="illu-handle" href="https://x.com/Hakki_kai24" target="_blank" rel="noopener">@Hakki_kai24</a>）より、週間配信スケジュール表のご依頼をいただきました。パン職人という設定に合わせ、作業机に広げた手帳のシーンとして描き下ろしています。曜日の記入欄は手帳のページに見立て、パンのステッカーを散らしてデコ手帳のような雰囲気に仕上げました。メガネとスマートフォンを添え、配信前の机まわりの空気を作っています。</p>
        <p class="illu-note">テキスト入りの見本と、曜日・時間帯が空欄のテンプレートの2種をご納品。日付のリボンと曜日欄を書き換えて毎週使い回していただけます。スマートフォンの画面に入れている画像も差し替え可能です。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/かいくんー配信スケジュールサンプル.webp" alt="Hakki Kai weekly stream schedule"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created June 2026</p>
        <p class="illu-desc">Commissioned by Hakki Kai (<a class="illu-handle" href="https://x.com/Hakki_kai24" target="_blank" rel="noopener">@Hakki_kai24</a>) for a weekly stream schedule. To match their baker persona, the piece is drawn as a notebook lying open on a work desk. The day-of-week rows are treated as notebook lines and scattered with bread stickers for the look of a decorated planner, while glasses and a smartphone complete the atmosphere of a desk just before a stream.</p>
        <p class="illu-note">Delivered in two versions: one filled in as a sample, and a blank template. The date ribbon and the daily rows can be rewritten each week, and the image shown on the smartphone screen can be swapped out as well.</p>
      </div>`,
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/かいくんー配信スケジュールサンプル.webp" alt="Planning hebdomadaire de diffusion de Hakki Kai"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en juin 2026</p>
        <p class="illu-desc">Commande réalisée pour Hakki Kai (<a class="illu-handle" href="https://x.com/Hakki_kai24" target="_blank" rel="noopener">@Hakki_kai24</a>) : un planning hebdomadaire de diffusion. En accord avec son personnage de boulanger, la scène représente un carnet ouvert sur un bureau de travail. Les lignes des jours de la semaine reprennent celles d'un carnet et sont parsemées d'autocollants en forme de pains, pour l'allure d'un agenda décoré ; des lunettes et un smartphone complètent l'ambiance d'un bureau juste avant un live.</p>
        <p class="illu-note">Livré en deux versions : un exemplaire rempli et un modèle vierge. Le ruban de dates et les lignes de chaque jour peuvent être réécrits chaque semaine, et l'image affichée sur l'écran du smartphone peut également être remplacée.</p>
      </div>`,
    },
    illust_wokka: {
      title: '【お仕事絵】wokka様‐グッズ用イラスト',
      titleEn: '[Commission] wokka — Merchandise Illustration',
      titleFr: '[Commande] wokka — Illustration pour produits dérivés',
      subtitle: 'Goods / Still illustration',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/wokka様仮置き.jpg" alt="wokka様グッズ用イラスト"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 09月 17日 制作</p>
        <p class="illu-desc">CRAZY RACOON所属のwokka様よりグッズイラストの依頼を頂き、制作致しました。アクリルスタンド・缶バッジ・チェキ風カードと商品ごとにトリミングの形が変わるため、人物の見せどころが端に寄らない構図で組み立てています。</p>
        <p class="illu-note">著作権譲渡の案件のため、グッズの申し込み開始後に、ご本人の許可をいただいたうえで商品サンプル画像のみを掲載しております。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/wokka様仮置き.jpg" alt="wokka merchandise illustration"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created September 2026</p>
        <p class="illu-desc">Commissioned by wokka of CRAZY RACOON for merchandise illustrations. Since each product — acrylic stands, tin badges, and instant-photo-style cards — crops the artwork differently, the composition was built so the key parts of the character never sit too close to the edges.</p>
        <p class="illu-note">The copyright was transferred to the client, so only sample images of the finished merchandise are shown here, with their permission, after sales opened.</p>
      </div>`,
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/wokka様仮置き.jpg" alt="Illustration produits dérivés wokka"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en septembre 2026</p>
        <p class="illu-desc">Commande réalisée pour wokka (CRAZY RACOON) : des illustrations destinées à des produits dérivés. Chaque support — acrylique, badge, carte façon instantané — recadre l'image différemment, d'où une composition pensée pour que les éléments essentiels du personnage ne se retrouvent jamais trop près des bords.</p>
        <p class="illu-note">Les droits ayant été cédés au client, seules des images d'échantillon des produits finis sont présentées ici, avec son autorisation, après l'ouverture des ventes.</p>
      </div>`,
    },
    illust_kaifa: {
      title: '【ＦＡ】白旗かい様‐パン工房のひととき',
      titleEn: '[Fan art] Hakki Kai — A Moment at the Bakery',
      titleFr: '[Fan art] Hakki Kai — Un moment à la boulangerie',
      subtitle: 'SD chibi / Still illustration',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/re-kaiFA.webp" alt="白旗かい様ファンアート"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 09月 制作（初稿：2026年 05月）</p>
        <p class="illu-desc">パン職人系VTuberの白旗かい様（<a class="illu-handle" href="https://x.com/Hakki_kai24" target="_blank" rel="noopener">@Hakki_kai24</a>）へのファンアートです。厨房でパン生地をこねている場面を切り取り、焼き上がりを待つクロワッサンとメロンパンを手前に並べて、お店の空気ごと収めました。ステンレスのオーブンとグレーの什器で画面を落ち着かせ、焼き上がったパンとエプロンの茶色を暖色のアクセントとして効かせています。</p>
        <p class="illu-note">2026年5月に描いた初稿をもとに、2026年9月に塗りをより精確に描き直したリメイク版です。</p>
        <p class="illu-desc">※ 本作は白旗かい様ご本人以外の方が、ご本人の許可なくお使いすることを禁止させていただいております。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/re-kaiFA.webp" alt="Hakki Kai fan art"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created September 2026 (first version: May 2026)</p>
        <p class="illu-desc">Fan art for Hakki Kai (<a class="illu-handle" href="https://x.com/Hakki_kai24" target="_blank" rel="noopener">@Hakki_kai24</a>), a VTuber whose theme is being a baker. The scene captures a moment of kneading dough in the kitchen, with croissants and melon pan waiting to be baked lined up in the foreground to bring in the atmosphere of the shop itself. The stainless oven and gray fixtures keep the image calm, letting the browns of the baked bread and the apron work as warm accents.</p>
        <p class="illu-note">A remake of the first version drawn in May 2026, with the coloring reworked more precisely in September 2026.</p>
        <p class="illu-desc">※ This piece may not be used by anyone other than Hakki Kai without their permission.</p>
      </div>`,
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/re-kaiFA.webp" alt="Fan art Hakki Kai"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en septembre 2026 (première version : mai 2026)</p>
        <p class="illu-desc">Fan art pour Hakki Kai (<a class="illu-handle" href="https://x.com/Hakki_kai24" target="_blank" rel="noopener">@Hakki_kai24</a>), VTuber au thème de boulanger. La scène saisit un moment de pétrissage dans le fournil, avec au premier plan les croissants et les melon pan qui attendent la cuisson, afin de restituer l'atmosphère de la boutique elle-même. Le four en inox et le mobilier gris apaisent l'image, laissant les bruns du pain cuit et du tablier jouer le rôle d'accents chauds.</p>
        <p class="illu-note">Remake de la première version dessinée en mai 2026, dont les couleurs ont été reprises avec plus de précision en septembre 2026.</p>
        <p class="illu-desc">※ Cette illustration ne peut être utilisée par quiconque d'autre que Hakki Kai sans son autorisation.</p>
      </div>`,
    },
    illust_aretete: {
      title: '【ＦＡ】アール・テテ様‐テテ国の誕生日',
      titleEn: '[Fan art] Are Tete — A Birthday in the Nation of Tete',
      titleFr: '[Fan art] Are Tete — Un anniversaire au pays de Tete',
      subtitle: 'Still illustration / SD chibi',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/FAアールテテ誕生日イラスト.webp" alt="アール・テテ様ファンアート"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 07月 18日 制作</p>
        <p class="illu-desc">アール・テテ様（<a class="illu-handle" href="https://x.com/AreTete_Vtuber" target="_blank" rel="noopener">@AreTete_Vtuber</a>）へのお誕生日ファンアートです。テテ国の新年でもあるお誕生日をお祝いする場面として、ピンクのソファを玉座に見立て、ハートのバルーンと贈り物で画面の四隅を囲みました。銀からピンクへ抜ける髪と白い衣装を主役に置き、背景をごく淡いピンクでまとめることで、赤いバルーンとケーキのいちごだけが強い色として残るようにしています。</p>
        <p class="illu-note">ケーキの上には王冠をかぶったちびテテ様を添えて、本体の凛としたお顔との落差を作りました。ご依頼の合間に時間を割いて描き上げた一枚です。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/FAアールテテ誕生日イラスト.webp" alt="Are Tete fan art"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created 18 July 2026</p>
        <p class="illu-desc">Birthday fan art for Are Tete (<a class="illu-handle" href="https://x.com/AreTete_Vtuber" target="_blank" rel="noopener">@AreTete_Vtuber</a>). To celebrate a birthday that doubles as New Year's Day in the nation of Tete, the pink sofa stands in for a throne, with heart balloons and gifts framing the four corners of the image. The hair fading from silver to pink and the white outfit lead the composition, while the background is kept to a very pale pink so that only the red balloons and the strawberries on the cake remain as strong colors.</p>
        <p class="illu-note">A chibi Tete wearing a crown sits on top of the cake, set against the composed expression of the main figure. A piece drawn in the gaps between commissions.</p>
      </div>`,
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/FAアールテテ誕生日イラスト.webp" alt="Fan art Are Tete"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé le 18 juillet 2026</p>
        <p class="illu-desc">Fan art d'anniversaire pour Are Tete (<a class="illu-handle" href="https://x.com/AreTete_Vtuber" target="_blank" rel="noopener">@AreTete_Vtuber</a>). Pour fêter un anniversaire qui fait aussi office de nouvel an au pays de Tete, le canapé rose tient lieu de trône, tandis que les ballons en cœur et les cadeaux encadrent les quatre coins de l'image. La chevelure passant de l'argent au rose et la tenue blanche mènent la composition, le fond restant d'un rose très pâle pour que seuls les ballons rouges et les fraises du gâteau subsistent comme couleurs fortes.</p>
        <p class="illu-note">Une version chibi de Tete, couronne sur la tête, est posée sur le gâteau, en contraste avec le visage posé du personnage principal. Une illustration réalisée entre deux commandes.</p>
      </div>`,
    },
    illust_kamishiro: {
      title: '【お仕事絵】神代黎様‐立ち絵＋表情差分',
      titleEn: '[Commission] Kamishiro Ray — Full Illustration & Expression Variants',
      titleFr: "[Commande] Kamishiro Ray — Illustration complète et variantes d'expression",
      subtitle: 'Character design',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/yanikasujyun.webp" alt="神代黎様"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 08月 27日 制作</p>
        <p class="illu-desc">321.inc所属の神代黎様（<a class="illu-handle" href="https://x.com/UIro7f" target="_blank" rel="noopener">@UIro7f</a>）よりお姿の仕立て依頼をいただきました。筋肉質の大柄なクールガイという設定に合わせ、黒スーツの肩まわりに厚みを持たせつつ、金髪の無造作なシルエットと鋭い青い目で甘さを抑えています。二刀流の帯刀なので、腰には童子切安綱と数珠丸恒次を付けています。</p>
        <p class="illu-note">IRIAM ver4.1対応。トラッキング優先で目は開いた形を基準にしたうえで、表情差分3種はいずれも目元を細めたお顔に整えました。高解像度データ（A3・PNG）も併せてご納品しております。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/yanikasujyun.webp" alt="Kamishiro Ray"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created August 2026</p>
        <p class="illu-desc">Commissioned by Kamishiro Ray (<a class="illu-handle" href="https://x.com/UIro7f" target="_blank" rel="noopener">@UIro7f</a>) of 321.inc for a full character illustration. To match a character written as a tall, muscular cool guy, the black suit was given weight through the shoulders, while the loose blond silhouette and sharp blue eyes keep any softness in check. As a dual-wielding swordsman, he carries Dojigiri Yasutsuna and Juzumaru Tsunetsugu at his waist.</p>
        <p class="illu-note">Compatible with IRIAM ver4.1. The eyes were drawn open as a baseline to prioritize tracking, while all three expression variants were tuned with narrowed eyes. High-resolution data (A3, PNG) was delivered alongside.</p>
      </div>`,
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/yanikasujyun.webp" alt="Kamishiro Ray"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en août 2026</p>
        <p class="illu-desc">Commande réalisée pour Kamishiro Ray (<a class="illu-handle" href="https://x.com/UIro7f" target="_blank" rel="noopener">@UIro7f</a>), du groupe 321.inc : une illustration complète. Pour un personnage décrit comme un grand gaillard musclé au tempérament froid, le costume noir a été épaissi au niveau des épaules, tandis que la silhouette blonde en désordre et le regard bleu perçant en contiennent toute douceur. Bretteur à deux sabres, il porte Dojigiri Yasutsuna et Juzumaru Tsunetsugu à la taille.</p>
        <p class="illu-note">Compatible IRIAM ver4.1. Les yeux ont été dessinés ouverts comme base afin de privilégier le tracking, les trois variantes d'expression ayant toutes été ajustées avec un regard plus plissé. Les fichiers haute résolution (A3, PNG) ont également été livrés.</p>
      </div>`,
    },
    illust_kainekopv: {
      title: '【お仕事絵】白旗かい様‐「飼猫」オリジナルPV',
      titleEn: '[Commission] Hakki Kai — Original MV for "Kaineko"',
      titleFr: '[Commande] Hakki Kai — Clip original pour « Kaineko »',
      subtitle: 'Thumbnail / MV / Portrait painting',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/白旗かいー飼猫pvサムネイル.webp" alt="飼猫PVサムネイル"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 08月 15日 制作</p>
        <p class="illu-desc">白旗かい様（<a class="illu-handle" href="https://x.com/Hakki_kai24" target="_blank" rel="noopener">@Hakki_kai24</a>）の「飼猫」の歌ってみたのオリジナルPVを、イラストとPV制作ともに担当させていただきました。本家に寄せつつ、ご本人の世界観も織り込ませていただいています。赤い壁と額縁で閉じた室内をつくり、銀髪に赤い瞳、チョーカーから垂らしたチェーンを画面手前まで引き込むことで、「飼う側」の執着が見える構図にしました。</p>
        <p class="illu-note">本家に似た表情を中心に表情差分21枚を描き起こし、歌詞タイポグラフィと一枚絵のカメラワークで構成したPV本編（2分18秒）も制作しています。</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=dsj6egTpu2U" target="_blank" rel="noopener">実際に投稿された動画を見る</a></p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/白旗かいー飼猫pvサムネイル.webp" alt="Kaineko MV thumbnail"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created August 2026</p>
        <p class="illu-desc">For Hakki Kai's (<a class="illu-handle" href="https://x.com/Hakki_kai24" target="_blank" rel="noopener">@Hakki_kai24</a>) cover of "Kaineko", I handled both the illustration and the production of the original music video. The work stays close to the original song while weaving in Kai's own world. A closed interior of red walls and picture frames sets the stage, and the silver hair, red eyes, and the chain hanging from the choker drawn toward the viewer put the possessiveness of the one doing the keeping right in the frame.</p>
        <p class="illu-note">21 expression variants were drawn, mostly echoing expressions from the original video, along with the full 2:18 music video built from lyric typography and camera work over the single illustration.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=dsj6egTpu2U" target="_blank" rel="noopener">Watch the published video</a></p>
      </div>`,
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/白旗かいー飼猫pvサムネイル.webp" alt="Miniature du clip Kaineko"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en août 2026</p>
        <p class="illu-desc">Pour la reprise de « Kaineko » par Hakki Kai (<a class="illu-handle" href="https://x.com/Hakki_kai24" target="_blank" rel="noopener">@Hakki_kai24</a>), j'ai réalisé à la fois l'illustration et le clip original. Le travail reste proche de l'univers du morceau d'origine tout en y intégrant celui de Kai. Un intérieur clos aux murs rouges et aux cadres plante le décor ; les cheveux argentés, les yeux rouges et la chaîne pendant du collier, tirée vers le spectateur, font entrer dans le cadre la possessivité de celui qui « garde » l'autre.</p>
        <p class="illu-note">21 variantes d'expression ont été dessinées, reprenant pour l'essentiel celles de la vidéo d'origine, ainsi que le clip complet (2 min 18) construit à partir de la typographie des paroles et des mouvements de caméra sur l'illustration unique.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=dsj6egTpu2U" target="_blank" rel="noopener">Voir la vidéo publiée</a></p>
      </div>`,
    },
    illust_hayamisyuuchibi: {
      title: '【お仕事絵】速水シュウ様‐ちびキャラ',
      titleEn: '[Commission] Hayami Shu — Chibi Illustration',
      titleFr: '[Commande] Hayami Shu — Illustration chibi',
      subtitle: 'Chibi illustration',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/hayamisyuuchibi-sp.webp" alt="速水シュウ様ちびキャラ"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 08月 14日 制作</p>
        <p class="illu-desc"><span class="illu-muted">元りみれす！所属・</span>現個人勢の速水シュウ様（<a class="illu-handle" href="https://x.com/hayamisecond" target="_blank" rel="noopener">@hayamisecond</a>）よりちびのお姿の仕立て依頼をいただきました。立ち絵のダークな配色から一転、オオカミの着ぐるみパーカーでまとめ、肉球と尻尾で愛嬌を足しています。チョーカーとチェーンは立ち絵から残し、同じキャラクターとしての繋がりを保ちました。</p>
        <p class="illu-note">背景透過でご納品。配信画面やSNSで小さく表示してもシルエットが読めるよう、色数と情報量を整理しています。</p>
        <p class="illu-link">▶ <a href="#" data-modal-jump="illust_hayamisyuu">立ち絵を見る</a></p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/hayamisyuuchibi-sp.webp" alt="Hayami Shu chibi"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created August 2026</p>
        <p class="illu-desc">Commissioned by Hayami Shu (<a class="illu-handle" href="https://x.com/hayamisecond" target="_blank" rel="noopener">@hayamisecond</a>), <span class="illu-muted">formerly of Rimiresu! and</span> now an independent streamer, for a chibi illustration. Turning away from the dark palette of the full illustration, this one is built around a wolf kigurumi hoodie, with paw pads and a tail added for charm. The choker and chain were carried over from the full illustration so both read as the same character.</p>
        <p class="illu-note">Delivered with a transparent background. Colors and detail were pared back so the silhouette still reads when displayed small on stream overlays or social media.</p>
        <p class="illu-link">▶ <a href="#" data-modal-jump="illust_hayamisyuu">View the full illustration</a></p>
      </div>`,
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/hayamisyuuchibi-sp.webp" alt="Hayami Shu chibi"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en août 2026</p>
        <p class="illu-desc">Commande réalisée pour Hayami Shu (<a class="illu-handle" href="https://x.com/hayamisecond" target="_blank" rel="noopener">@hayamisecond</a>), <span class="illu-muted">anciennement du groupe Rimiresu! et</span> aujourd'hui streameur indépendant : une illustration chibi. À rebours de la palette sombre de l'illustration complète, celle-ci s'organise autour d'un kigurumi loup à capuche, agrémenté de coussinets et d'une queue. Le collier et la chaîne ont été conservés depuis l'illustration complète afin de préserver le lien entre les deux versions du personnage.</p>
        <p class="illu-note">Livré sur fond transparent. Le nombre de couleurs et le niveau de détail ont été réduits pour que la silhouette reste lisible en petit format, sur un overlay de stream comme sur les réseaux sociaux.</p>
        <p class="illu-link">▶ <a href="#" data-modal-jump="illust_hayamisyuu">Voir l'illustration complète</a></p>
      </div>`,
    },
    illust_ryuhsai: {
      title: '【お仕事絵】琉祭 匠様‐女体化立ち絵＋表情差分',
      titleEn: '[Commission] Ryuhsai Takumi — Genderbent Full Illustration & Expression Variants',
      titleFr: "[Commande] Ryuhsai Takumi — Illustration complète genderbend et variantes d'expression",
      subtitle: 'Character design',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/ryuhsai.webp" alt="琉祭匠様"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 08月 08日 制作</p>
        <p class="illu-desc">事務所LivelyNight所属の琉祭 匠様（<a class="illu-handle" href="https://x.com/T_ryuhsai" target="_blank" rel="noopener">@T_ryuhsai</a>）より女体化依頼をいただいて、仕立てさせていただきました。男性バージョンの立ち絵から要素を抽出し、オレンジ×黒×白の配色をうさ耳の内側・ジップ襟・アームバンド・太もものストラップへ落とし込んで、同じキャラクターとしての繋がりを担保しています。髪は男性時の雰囲気を引き継いだ後れ毛多めのサイドポニーテール、体つきは筋肉の流れを取ってから女性寄りに柔らかく整えました。</p>
        <p class="illu-note">IRIAM ver4.1対応・表情差分3種付き。黒のサイハイとジップ襟、体を捻ったポーズで配信審査の安全圏に収めています。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/ryuhsai.webp" alt="Ryuhsai Takumi"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created August 2026</p>
        <p class="illu-desc">Commissioned by Ryuhsai Takumi (<a class="illu-handle" href="https://x.com/T_ryuhsai" target="_blank" rel="noopener">@T_ryuhsai</a>) of LivelyNight for a genderbent version of their character. Elements were pulled from the existing male illustration, carrying the orange × black × white palette into the inner ears, zip collar, armband, and thigh strap so both read as the same character. The hair keeps the feel of the male version in a side ponytail with plenty of loose strands, and the body was built from the flow of the muscles first, then softened toward a feminine silhouette.</p>
        <p class="illu-note">Compatible with IRIAM ver4.1, with three expression variants included. Black thigh-highs, the zip collar, and a twisted pose keep the design safely within streaming review guidelines.</p>
      </div>`,
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/ryuhsai.webp" alt="Ryuhsai Takumi"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en août 2026</p>
        <p class="illu-desc">Commande réalisée pour Ryuhsai Takumi (<a class="illu-handle" href="https://x.com/T_ryuhsai" target="_blank" rel="noopener">@T_ryuhsai</a>), du groupe LivelyNight : une version féminisée de son personnage. Les éléments ont été repris de l'illustration masculine existante, la palette orange × noir × blanc se retrouvant à l'intérieur des oreilles de lapin, sur le col zippé, le brassard et la sangle de cuisse, afin que les deux versions se lisent comme un même personnage. La coiffure conserve l'esprit de la version masculine sous forme de queue-de-cheval latérale aux mèches folles, et la morphologie a d'abord été construite sur le tracé des muscles avant d'être adoucie vers une silhouette féminine.</p>
        <p class="illu-note">Compatible IRIAM ver4.1, trois variantes d'expression incluses. Les bas noirs montants, le col zippé et une pose de trois-quarts maintiennent le design dans les limites des règles de validation du streaming.</p>
      </div>`,
    },
    illust_hayamisyuu: {
      title: '【お仕事絵】速水シュウ様‐立ち絵＋表情差分',
      titleEn: '[Commission] Hayami Shu — Full Illustration & Expression Variants',
      titleFr: "[Commande] Hayami Shu — Illustration complète et variantes d'expression",
      subtitle: 'Character design',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/hayamisyuu.webp" alt="速水シュウ様"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 07月 25日 制作</p>
        <p class="illu-desc"><span class="illu-muted">元りみれす！所属・</span>現個人勢の速水シュウ様（<a class="illu-handle" href="https://x.com/hayamisecond" target="_blank" rel="noopener">@hayamisecond</a>）よりお姿の仕立て依頼をいただきました。いただいたイメージ画像から設定を読み取り、黒×ブルーのロングアウターにチェーンを重ねたダークストリートの装いへ落とし込んでいます。チャームポイントのオッドアイが埋もれないよう、前髪は目にかかる長さを保ちながら瞳の見え方を確保しました。</p>
        <p class="illu-note">IRIAM ver4.1対応。読み取り用に口を開いた状態を基準とし、チョーカーとレイヤードネックレスで胸元の情報量をつくることで、配信ガイドラインに沿わせつつ「俺様だけど甘い」雰囲気を残しています。</p>
        <p class="illu-link">▶ <a href="#" data-modal-jump="illust_hayamisyuuchibi">ちびキャラを見る</a></p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/hayamisyuu.webp" alt="Hayami Shu"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created July 2026</p>
        <p class="illu-desc">Commissioned by Hayami Shu (<a class="illu-handle" href="https://x.com/hayamisecond" target="_blank" rel="noopener">@hayamisecond</a>), <span class="illu-muted">formerly of Rimiresu! and</span> now an independent streamer, for a full character illustration. The character settings were read out of the reference image provided and translated into a dark street look: a long black × blue outer layered with chains. So the odd eyes — their defining feature — would not get lost, the bangs were kept long enough to fall over the eyes while still leaving the irises visible.</p>
        <p class="illu-note">Compatible with IRIAM ver4.1. The mouth is drawn open as the tracking baseline, and the choker and layered necklaces fill out the chest area, keeping the design within streaming guidelines while preserving the "arrogant, but sweet on you" mood.</p>
        <p class="illu-link">▶ <a href="#" data-modal-jump="illust_hayamisyuuchibi">View the chibi illustration</a></p>
      </div>`,
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/hayamisyuu.webp" alt="Hayami Shu"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en juillet 2026</p>
        <p class="illu-desc">Commande réalisée pour Hayami Shu (<a class="illu-handle" href="https://x.com/hayamisecond" target="_blank" rel="noopener">@hayamisecond</a>), <span class="illu-muted">anciennement du groupe Rimiresu! et</span> aujourd'hui streameur indépendant : une illustration complète. Les caractéristiques du personnage ont été déduites de l'image de référence fournie, puis traduites en un style dark street : un long manteau noir × bleu surchargé de chaînes. Pour que les yeux vairons, sa signature, ne disparaissent pas, la frange reste assez longue pour tomber sur les yeux tout en laissant les iris visibles.</p>
        <p class="illu-note">Compatible IRIAM ver4.1. La bouche est dessinée ouverte comme référence de tracking, et le collier ras-de-cou ainsi que les chaînes superposées habillent le décolleté : le design reste conforme aux règles du streaming tout en gardant l'attitude « arrogant, mais tendre avec toi ».</p>
        <p class="illu-link">▶ <a href="#" data-modal-jump="illust_hayamisyuuchibi">Voir l'illustration chibi</a></p>
      </div>`,
    },
    illust_nemure: {
      title: '【お仕事絵】ネムレ様‐配信待機画面用の動くイラスト',
      titleEn: '[Commission] Nemure — Animated Stream Standby Screen',
      titleFr: "[Commande] Nemure — Écran d'attente animé pour stream",
      subtitle: 'Loop animation / Background illustration',
      html: `<div class="mwork mwork--illu">
        <video autoplay loop muted playsinline style="width:100%; border-radius:8px; margin-bottom:4px;">
          <source src="../images/works/illust/original/nemure.mp4" type="video/mp4">
        </video>
        <span class="illu-cap" style="display:block; text-align:center; margin-bottom:16px;">ループアニメーション（50%）</span>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 07月 10日 制作</p>
        <p class="illu-desc">ネムレ様（<a class="illu-handle" href="https://x.com/Namele_vip" target="_blank" rel="noopener">@Namele_vip</a>）より配信待機画面の動くイラスト依頼を頂きまして、制作致しました。実際にご本人様の配信部屋を参考にし、機材の配置ごとリアルに描き下ろしています。モニターの光を主光源に、紫のアンビエントライトで部屋全体を包み、黒×ピンクの髪とスリーピースの刺繍が暗部に沈まないよう明度を調整しました。</p>
        <p class="illu-note">目がぱちぱちと瞬いたあと完全に閉じてうとうとし、手からすり落ちたレバーレスコントローラーが肘掛けに当たってガクッと起き、コントローラーを太ももの上に戻す。この一連の流れに、うとうとしている間の口元のもにゅもにゅと、ゲーミングライトの点滅を重ねています。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <video autoplay loop muted playsinline style="width:100%; border-radius:8px; margin-bottom:4px;">
          <source src="../images/works/illust/original/nemure.mp4" type="video/mp4">
        </video>
        <span class="illu-cap" style="display:block; text-align:center; margin-bottom:16px;">loop animation（50%）</span>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created July 2026</p>
        <p class="illu-desc">Commissioned by Nemure (<a class="illu-handle" href="https://x.com/Namele_vip" target="_blank" rel="noopener">@Namele_vip</a>) for an animated stream standby screen. The room was drawn from their actual streaming setup, reproducing the arrangement of the gear as it really is. Light from the monitors serves as the key light, purple ambient lighting wraps the room, and brightness was tuned so the black × pink hair and the embroidery on the three-piece suit never sink into the shadows.</p>
        <p class="illu-note">The eyes blink, close completely, and drift toward sleep; the leverless controller slips from the hand and knocks against the armrest, jolting him awake to set it back on his lap. Layered over that sequence are the small movements of the mouth while dozing and the flicker of the gaming lights.</p>
      </div>`,
      htmlFr: `<div class="mwork mwork--illu">
        <video autoplay loop muted playsinline style="width:100%; border-radius:8px; margin-bottom:4px;">
          <source src="../images/works/illust/original/nemure.mp4" type="video/mp4">
        </video>
        <span class="illu-cap" style="display:block; text-align:center; margin-bottom:16px;">animation en boucle（50%）</span>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en juillet 2026</p>
        <p class="illu-desc">Commande réalisée pour Nemure (<a class="illu-handle" href="https://x.com/Namele_vip" target="_blank" rel="noopener">@Namele_vip</a>) : une illustration animée pour écran d'attente de stream. La pièce a été dessinée d'après son véritable espace de diffusion, en reproduisant fidèlement la disposition du matériel. La lumière des écrans sert de source principale, un éclairage d'ambiance violet enveloppe la pièce, et la luminosité a été ajustée pour que les cheveux noir × rose et les broderies du costume trois-pièces ne se perdent pas dans les zones sombres.</p>
        <p class="illu-note">Les yeux clignent, se ferment complètement, puis la somnolence s'installe ; la manette leverless glisse de la main et heurte l'accoudoir, le réveillant en sursaut avant qu'il ne la repose sur ses cuisses. À cette séquence se superposent les petits mouvements de la bouche pendant l'assoupissement et le clignotement des lumières gaming.</p>
      </div>`,
    },
    logo_okota: {
      title: '【ご依頼もの】おこた様‐デコロゴ',
      titleEn: '[Commission] Okota — Deco Logo',
      subtitle: 'Logo design',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/おこた様ー枠あり（影付き）.jpg" alt="おこた様ロゴ"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 05月 制作</p>
        <p class="illu-desc">おこた様（<a class="illu-handle" href="https://x.com/kotakota_okota" target="_blank" rel="noopener">@kotakota_okota</a>）よりロゴのご依頼をいただきました。ピンク×グリーンの立ち絵カラーに合わせ、お花・ハート・パール・緑の紐リボン・マスコットキャラなどのモチーフをふんだんに盛り込んだ、可愛らしくふわふわとした雰囲気のデザインに仕上げました。</p>
        <p class="illu-note">SNS・配信・グッズなど幅広い商用利用を想定し、PNG透過データでご納品しております。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/おこた様ー枠あり（影付き）.jpg" alt="Okota logo"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created May 2026</p>
        <p class="illu-desc">Commissioned by Okota (<a class="illu-handle" href="https://x.com/kotakota_okota" target="_blank" rel="noopener">@kotakota_okota</a>) for a logo design. Designed with a soft pink × green palette matching their character, incorporating flowers, hearts, pearls, green ribbon, and a mascot character for a fluffy, adorable feel.</p>
        <p class="illu-note">Delivered as transparent PNG files for use across SNS, streams, and merchandise.</p>
      </div>`,
      titleFr: '[Commande] Okota — Logo décoratif',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/おこた様ー枠あり（影付き）.jpg" alt="Logo Okota"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en mai 2026</p>
        <p class="illu-desc">Commande réalisée pour Okota (<a class="illu-handle" href="https://x.com/kotakota_okota" target="_blank" rel="noopener">@kotakota_okota</a>) : un logo aux couleurs rose × vert assorties à son personnage, avec fleurs, cœurs, perles, ruban vert et une mascotte, pour une ambiance douce et adorable.</p>
        <p class="illu-note">Livré en PNG transparent, utilisable pour les réseaux sociaux, le streaming et les produits dérivés.</p>
      </div>`,
    },
    logo_hatae: {
      title: '【ご依頼もの】はたえじきる様‐デコロゴ',
      titleEn: '[Commission] Hatae Zikiru — Deco Logo',
      subtitle: 'Logo design',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/はたえじきる様ー枠あり（影付き.jpg" alt="はたえじきる様ロゴ"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 05月 制作</p>
        <p class="illu-desc">はたえじきる。様（<a class="illu-handle" href="https://x.com/hatae_zikiru" target="_blank" rel="noopener">@hatae_zikiru</a>）よりロゴのご依頼をいただきました。地雷系・ドール系をテーマに、淡め・赤・黒を基調とした配色で薔薇・鍵・ハット・リボン・ハート・黒くま・フリルなどのモチーフをあしらい、可愛らしさと退廃的な美しさが共存するデザインに仕上げました。</p>
        <p class="illu-note">SNS・配信・グッズなど幅広い商用利用を想定し、PNG透過データでご納品しております。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/はたえじきる様ー枠あり（影付き.jpg" alt="Hatae Zikiru logo"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created May 2026</p>
        <p class="illu-desc">Commissioned by Hatae Zikiru (<a class="illu-handle" href="https://x.com/hatae_zikiru" target="_blank" rel="noopener">@hatae_zikiru</a>) for a logo design. Themed around jiraiya-kei and doll aesthetics, with a muted palette of reds and blacks, incorporating roses, keys, a top hat, ribbons, hearts, black bear motifs, and frills.</p>
        <p class="illu-note">Delivered as transparent PNG files for use across SNS, streams, and merchandise.</p>
      </div>`,
      titleFr: '[Commande] Hatae Zikiru — Logo décoratif',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/はたえじきる様ー枠あり（影付き.jpg" alt="Logo Hatae Zikiru"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en mai 2026</p>
        <p class="illu-desc">Commande réalisée pour Hatae Zikiru (<a class="illu-handle" href="https://x.com/hatae_zikiru" target="_blank" rel="noopener">@hatae_zikiru</a>) : un logo sur le thème jirai-kei et poupée, dans une palette douce de rouges et de noirs, avec roses, clés, chapeau haut-de-forme, rubans, cœurs, ourson noir et volants, pour un équilibre entre mignonnerie et beauté décadente.</p>
        <p class="illu-note">Livré en PNG transparent, utilisable pour les réseaux sociaux, le streaming et les produits dérivés.</p>
      </div>`,
    },
    logo_homare: {
      title: '【ご依頼もの】招来ほまれ様‐デコロゴ',
      titleEn: '[Commission] Maneki Homare — Deco Logo',
      subtitle: 'Logo design',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/招来ほまれ様ー枠あり（影付きサブ文字なし）.jpg" alt="招来ほまれ様ロゴ"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 05月 制作</p>
        <p class="illu-desc">招来ほまれ様（<a class="illu-handle" href="https://x.com/mane_homa" target="_blank" rel="noopener">@mane_homa</a>）よりロゴのご依頼をいただきました。白ポメラニアンの招き犬キャラをモチーフに、紅白をメインカラーとして🍥・⛩・🌸・縁結びリボン・ふわふわもこもこ要素を盛り込み、縁起の良さと可愛らしさが両立したデザインに仕上げました。</p>
        <p class="illu-note">SNS・配信・グッズ・イベント特典など幅広い商用利用を想定し、PNG透過データでご納品しております。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/招来ほまれ様ー枠あり（影付きサブ文字なし）.jpg" alt="Maneki Homare logo"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created May 2026</p>
        <p class="illu-desc">Commissioned by Maneki Homare (<a class="illu-handle" href="https://x.com/mane_homa" target="_blank" rel="noopener">@mane_homa</a>) for a logo design. Inspired by a white Pomeranian beckoning-dog character, using red and white as the main palette with narutomaki, shrine gates, cherry blossoms, fortune-tying ribbons, and fluffy motifs for a design that blends good luck charms with cuteness.</p>
        <p class="illu-note">Delivered as transparent PNG files for use across SNS, streams, goods, and event gifts.</p>
      </div>`,
      titleFr: '[Commande] Maneki Homare — Logo décoratif',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/招来ほまれ様ー枠あり（影付きサブ文字なし）.jpg" alt="Logo Maneki Homare"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en mai 2026</p>
        <p class="illu-desc">Commande réalisée pour Maneki Homare (<a class="illu-handle" href="https://x.com/mane_homa" target="_blank" rel="noopener">@mane_homa</a>) : un logo inspiré d'un poméranien blanc porte-bonheur, en rouge et blanc, avec narutomaki, torii, fleurs de cerisier, ruban porte-bonheur et éléments duveteux, pour un équilibre entre bonne fortune et mignonnerie.</p>
        <p class="illu-note">Livré en PNG transparent, utilisable pour les réseaux sociaux, le streaming, les produits dérivés et les cadeaux d'événements.</p>
      </div>`,
    },
    logo_sasiro: {
      title: '【ご依頼もの】佐城玲様‐デコロゴ',
      titleEn: '[Commission] Sasiro Rei — Deco Logo',
      subtitle: 'Logo design',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/佐城玲様ー枠あり（影付き）.jpg" alt="佐城玲様ロゴ"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 05月 制作</p>
        <p class="illu-desc">佐城玲様（<a class="illu-handle" href="https://x.com/sasirorei" target="_blank" rel="noopener">@sasirorei</a>）よりロゴのご依頼をいただきました。赤紫・ピンク・白ふちのグラデーションカラーに、リボン・ハート・十字架・ポメラニアン・ビーズ・フリルなどのモチーフを散りばめた、華やかで個性的なデザインに仕上げました。</p>
        <p class="illu-note">デジタル返礼品・グッズ・FANBOX等の商用利用を想定し、PNG透過データでご納品しております。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/佐城玲様ー枠あり（影付き）.jpg" alt="Sasiro Rei logo"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created May 2026</p>
        <p class="illu-desc">Commissioned by Sasiro Rei (<a class="illu-handle" href="https://x.com/sasirorei" target="_blank" rel="noopener">@sasirorei</a>) for a logo design. A vibrant design in red-purple, pink, and white-outlined gradients, adorned with ribbons, hearts, crosses, a Pomeranian, beads, and frills for a bold and distinctive look.</p>
        <p class="illu-note">Delivered as transparent PNG files for digital gifts, merchandise, and FANBOX commercial use.</p>
      </div>`,
      titleFr: '[Commande] Sasiro Rei — Logo décoratif',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/佐城玲様ー枠あり（影付き）.jpg" alt="Logo Sasiro Rei"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en mai 2026</p>
        <p class="illu-desc">Commande réalisée pour Sasiro Rei (<a class="illu-handle" href="https://x.com/sasirorei" target="_blank" rel="noopener">@sasirorei</a>) : un logo éclatant en dégradés rouge-violet, rose et contours blancs, orné de rubans, cœurs, croix, poméranien, perles et volants, pour un look flamboyant et distinctif.</p>
        <p class="illu-note">Livré en PNG transparent pour cadeaux numériques, produits dérivés et usage commercial FANBOX.</p>
      </div>`,
    },
    logo_yume: {
      title: '【ご依頼もの】叶守ユメ様‐デコロゴ',
      titleEn: '[Commission] Kanmamori Yume — Deco Logo',
      subtitle: 'Logo design',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/叶守ユメ様ー枠あり（影付き）.jpg" alt="叶守ユメ様ロゴ"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 05月 制作</p>
        <p class="illu-desc">叶守ユメ様（<a class="illu-handle" href="https://x.com/knmr0406" target="_blank" rel="noopener">@knmr0406</a>）よりロゴのご依頼をいただきました。白魔法使いの女の子キャラクターをイメージし、ピンク・パープル・白の配色で魔女帽子・ヒツジ・リボン・星・王冠などのモチーフを取り入れ、可愛らしさと神秘的な美しさが漂うデザインに仕上げました。</p>
        <p class="illu-note">SNS・配信・デジタル返礼品・グッズなど幅広い商用利用を想定し、PNG透過データでご納品しております。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/叶守ユメ様ー枠あり（影付き）.jpg" alt="Kanmamori Yume logo"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created May 2026</p>
        <p class="illu-desc">Commissioned by Kanmamori Yume (<a class="illu-handle" href="https://x.com/knmr0406" target="_blank" rel="noopener">@knmr0406</a>) for a logo design. Inspired by a white mage girl character, using pink, purple, and white tones with a witch hat, sheep, ribbons, stars, and a crown to create a design that balances cuteness with a mystical elegance.</p>
        <p class="illu-note">Delivered as transparent PNG files for use across SNS, streams, digital gifts, and merchandise.</p>
      </div>`,
      titleFr: '[Commande] Kanmamori Yume — Logo décoratif',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/叶守ユメ様ー枠あり（影付き）.jpg" alt="Logo Kanmamori Yume"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en mai 2026</p>
        <p class="illu-desc">Commande réalisée pour Kanmamori Yume (<a class="illu-handle" href="https://x.com/knmr0406" target="_blank" rel="noopener">@knmr0406</a>) : un logo inspiré d'une jeune mage blanche, en rose, violet et blanc, avec chapeau de sorcière, mouton, rubans, étoiles et couronne, pour un design mêlant mignonnerie et beauté mystique.</p>
        <p class="illu-note">Livré en PNG transparent, utilisable pour les réseaux sociaux, le streaming, les cadeaux numériques et les produits dérivés.</p>
      </div>`,
    },
    illust_yomeiyura: {
      title: '【お仕事絵】夜冥ゆら様‐立ち絵＋表情差分',
      titleEn: '[Commission] Yomei Yura — Full Illustration & Expression Variants',
      subtitle: 'Character design',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/yomeiyura.webp" alt="夜冥ゆら様"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 07月 制作</p>
        <p class="illu-desc">個人勢・夜冥ゆら様（<a class="illu-handle" href="https://x.com/ymch_llll" target="_blank" rel="noopener">@ymch_llll</a>）より、立ち絵と表情差分のご依頼をいただきました。「引きこもりでヤニカス死神」という設定をもとに、白から毛先へ黒が落ちるロングヘアと黒の編み上げ・ハーネス系衣装で、ダウナーで儚い空気感をつくっています。</p>
        <p class="illu-note">アイシャドウはIRIAM配信での視認性を優先し、上まつげを太めに取る形で代用。シルバーのインダストリアルピアスや首元のタトゥーなど、細部の情報量で「気だるさ」を補強しました。</p>
        <p class="illu-link">▶ <a href="#" data-modal-jump="illust_yomeiyura_chibi">ちびキャラアイコンを見る</a>　/　<a href="#" data-modal-jump="logo_yomeiyura">ロゴを見る</a></p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/yomeiyura.webp" alt="Yomei Yura"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created July 2026</p>
        <p class="illu-desc">Commissioned by independent VTuber Yomei Yura (<a class="illu-handle" href="https://x.com/ymch_llll" target="_blank" rel="noopener">@ymch_llll</a>) for a full character illustration with expression variants. Built around the concept of a shut-in, chain-smoking grim reaper: long white hair fading to black at the tips, paired with black lace-up and harness-style clothing for a downer, fragile mood.</p>
        <p class="illu-note">Eyeshadow was replaced with a thicker upper lash line for better readability on IRIAM streams. Silver industrial piercings and a neck tattoo add the small details that sell the character's listless attitude.</p>
        <p class="illu-link">▶ <a href="#" data-modal-jump="illust_yomeiyura_chibi">View the chibi icon</a>　/　<a href="#" data-modal-jump="logo_yomeiyura">View the logo</a></p>
      </div>`,
      titleFr: '[Commande] Yomei Yura — Illustration complète et expressions',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/yomeiyura.webp" alt="Yomei Yura"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en juillet 2026</p>
        <p class="illu-desc">Commande réalisée pour la VTuber indépendante Yomei Yura (<a class="illu-handle" href="https://x.com/ymch_llll" target="_blank" rel="noopener">@ymch_llll</a>) : une illustration complète avec variantes d'expression. Construite autour d'un concept de faucheuse recluse et fumeuse : longs cheveux blancs virant au noir aux pointes, associés à une tenue noire à lacets et harnais pour une ambiance mélancolique et fragile.</p>
        <p class="illu-note">Le fard à paupières a été remplacé par une ligne de cils supérieurs plus épaisse pour une meilleure lisibilité en direct sur IRIAM. Les piercings industriels argentés et le tatouage au cou ajoutent les détails qui renforcent son attitude nonchalante.</p>
        <p class="illu-link">▶ <a href="#" data-modal-jump="illust_yomeiyura_chibi">Voir l'icône chibi</a>　/　<a href="#" data-modal-jump="logo_yomeiyura">Voir le logo</a></p>
      </div>`,
    },
    illust_yomeiyura_chibi: {
      title: '【お仕事絵】夜冥ゆら様‐ちびキャラアイコン',
      titleEn: '[Commission] Yomei Yura — Chibi Icon',
      subtitle: 'Chibi illustration / Icon',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/yomeiyura-chibi.webp" alt="夜冥ゆら様 ちびキャラアイコン"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 07月 制作</p>
        <p class="illu-desc">夜冥ゆら様（<a class="illu-handle" href="https://x.com/ymch_llll" target="_blank" rel="noopener">@ymch_llll</a>）の立ち絵に合わせたちびキャラアイコンです。「引きこもりでヤニカス死神」という設定はそのままに、SNSアイコンサイズでも表情が読めるようパーツを大きく整理しています。</p>
        <p class="illu-note">小さく表示されても印象が崩れないよう、髪先の黒とシルバーのピアスなど識別性の高い要素を残す方向で調整しました。</p>
        <p class="illu-link">▶ <a href="#" data-modal-jump="illust_yomeiyura">立ち絵を見る</a>　/　<a href="#" data-modal-jump="logo_yomeiyura">ロゴを見る</a></p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/yomeiyura-chibi.webp" alt="Yomei Yura chibi icon"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created July 2026</p>
        <p class="illu-desc">A chibi icon designed to match Yomei Yura's (<a class="illu-handle" href="https://x.com/ymch_llll" target="_blank" rel="noopener">@ymch_llll</a>) full illustration. The shut-in, chain-smoking grim reaper concept is kept intact, with features enlarged and simplified so the expression still reads at social-media icon size.</p>
        <p class="illu-note">High-recognition elements — the black hair tips, the silver piercing — were preserved so the character holds up even when displayed small.</p>
        <p class="illu-link">▶ <a href="#" data-modal-jump="illust_yomeiyura">View the full illustration</a>　/　<a href="#" data-modal-jump="logo_yomeiyura">View the logo</a></p>
      </div>`,
      titleFr: '[Commande] Yomei Yura — Icône chibi',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/yomeiyura-chibi.webp" alt="Icône chibi Yomei Yura"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en juillet 2026</p>
        <p class="illu-desc">Une icône chibi conçue pour correspondre à l'illustration complète de Yomei Yura (<a class="illu-handle" href="https://x.com/ymch_llll" target="_blank" rel="noopener">@ymch_llll</a>). Le concept de faucheuse recluse et fumeuse est conservé, avec des traits agrandis et simplifiés pour que l'expression reste lisible même en taille icône.</p>
        <p class="illu-note">Les éléments les plus reconnaissables — les pointes de cheveux noires, le piercing argenté — ont été conservés pour que le personnage reste identifiable même en petite taille.</p>
        <p class="illu-link">▶ <a href="#" data-modal-jump="illust_yomeiyura">Voir l'illustration complète</a>　/　<a href="#" data-modal-jump="logo_yomeiyura">Voir le logo</a></p>
      </div>`,
    },
    logo_yomeiyura: {
      title: '【ご依頼もの】夜冥ゆら様‐ロゴ',
      titleEn: '[Commission] Yomei Yura — Logo',
      subtitle: 'Logo design',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/yomeiyura-logo.jpg" alt="夜冥ゆら様ロゴ"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 07月 制作</p>
        <p class="illu-desc">夜冥ゆら様（<a class="illu-handle" href="https://x.com/ymch_llll" target="_blank" rel="noopener">@ymch_llll</a>）よりロゴのご依頼をいただきました。立ち絵・ちびキャラと世界観を揃え、「引きこもりでヤニカス死神」らしいダウナーで儚い質感を文字に落とし込んでいます。</p>
        <p class="illu-note">配信画面やSNSでの使用を想定し、縮小しても読める字面のバランスを優先しました。</p>
        <p class="illu-link">▶ <a href="#" data-modal-jump="illust_yomeiyura">立ち絵を見る</a>　/　<a href="#" data-modal-jump="illust_yomeiyura_chibi">ちびキャラアイコンを見る</a></p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/yomeiyura-logo.jpg" alt="Yomei Yura logo"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created July 2026</p>
        <p class="illu-desc">Commissioned by Yomei Yura (<a class="illu-handle" href="https://x.com/ymch_llll" target="_blank" rel="noopener">@ymch_llll</a>) for a logo. Matched to the world of the full illustration and chibi icon, translating the shut-in, chain-smoking grim reaper's downer, fragile texture into lettering.</p>
        <p class="illu-note">Designed for use on stream overlays and social media, prioritizing legibility at small sizes.</p>
        <p class="illu-link">▶ <a href="#" data-modal-jump="illust_yomeiyura">View the full illustration</a>　/　<a href="#" data-modal-jump="illust_yomeiyura_chibi">View the chibi icon</a></p>
      </div>`,
      titleFr: '[Commande] Yomei Yura — Logo',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/yomeiyura-logo.jpg" alt="Logo Yomei Yura"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en juillet 2026</p>
        <p class="illu-desc">Commande réalisée pour Yomei Yura (<a class="illu-handle" href="https://x.com/ymch_llll" target="_blank" rel="noopener">@ymch_llll</a>) : un logo assorti à l'illustration complète et à l'icône chibi, traduisant en lettrage la texture mélancolique et fragile de la faucheuse recluse et fumeuse.</p>
        <p class="illu-note">Conçu pour les overlays de streaming et les réseaux sociaux, en priorisant la lisibilité en petite taille.</p>
        <p class="illu-link">▶ <a href="#" data-modal-jump="illust_yomeiyura">Voir l'illustration complète</a>　/　<a href="#" data-modal-jump="illust_yomeiyura_chibi">Voir l'icône chibi</a></p>
      </div>`,
    },
    illust_kuromarushidare: {
      title: '【お仕事絵】黒丸しだれ様‐立ち絵＋表情差分',
      titleEn: '[Commission] Kuromaru Shidare — Full Illustration & Expression Variants',
      subtitle: 'Character design',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/kuromarushidare.webp" alt="黒丸しだれ様"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 07月 14日 制作</p>
        <p class="illu-desc">りみれす！所属・黒丸しだれ様（<a class="illu-handle" href="https://x.com/shidare_kuro" target="_blank" rel="noopener">@shidare_kuro</a>）より、立ち絵と表情差分のご依頼をいただきました。ライトアップされた夜桜をイメージし、黒ベースの和装に白と桜ピンクを差し色として配置。しだれ桜のモチーフを髪のインナーカラーや帯飾りに落とし込んでいます。</p>
        <p class="illu-note">IRIAM ver4.1対応。配信で使いやすいよう、表情差分は感情の振れ幅がはっきり伝わる方向で調整しました。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/kuromarushidare.webp" alt="Kuromaru Shidare"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created July 2026</p>
        <p class="illu-desc">Commissioned by Kuromaru Shidare (<a class="illu-handle" href="https://x.com/shidare_kuro" target="_blank" rel="noopener">@shidare_kuro</a>) of Rimiresu! for a full character illustration with expression variants. Inspired by illuminated night cherry blossoms, the design pairs black traditional Japanese clothing with white and sakura-pink accents, echoing the weeping cherry motif in the hair's inner color and the obi ornament.</p>
        <p class="illu-note">Compatible with IRIAM ver4.1. Expressions were tuned for a wide, clearly readable emotional range so they work well on stream.</p>
      </div>`,
      titleFr: '[Commande] Kuromaru Shidare — Illustration complète et expressions',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/kuromarushidare.webp" alt="Kuromaru Shidare"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en juillet 2026</p>
        <p class="illu-desc">Commande réalisée pour Kuromaru Shidare (<a class="illu-handle" href="https://x.com/shidare_kuro" target="_blank" rel="noopener">@shidare_kuro</a>) du groupe Rimiresu! : une illustration complète avec variantes d'expression. Inspirée des cerisiers nocturnes illuminés, la tenue traditionnelle noire est rehaussée de blanc et de rose sakura, avec le motif du cerisier pleureur repris dans la couleur intérieure des cheveux et l'ornement de l'obi.</p>
        <p class="illu-note">Compatible IRIAM ver4.1. Les expressions ont été ajustées pour une large amplitude émotionnelle, facilement lisible en direct.</p>
      </div>`,
    },
    illust_yakumoroki: {
      title: '【お仕事絵】八雲ロキ様‐立ち絵＋表情差分',
      titleEn: '[Commission] Yakumo Roki — Full Illustration & Expression Variants',
      subtitle: 'Character design',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/yakumoroki.webp" alt="八雲ロキ様"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 06月 制作</p>
        <p class="illu-desc">八雲ロキ様（<a class="illu-handle" href="https://x.com/Yakumo_Roki" target="_blank" rel="noopener">@Yakumo_Roki</a>）より、立ち絵と表情差分のご依頼をいただきました。グレー×ブルーのイメージカラーに、ワイドシルエットのストリートファッションを合わせ、お酒とタバコをこよなく愛する気だるげな雰囲気を意識して制作しました。</p>
        <p class="illu-desc">※ 依頼主様の権利を守るため、立ち絵全体の公開は控えております。気になった方はぜひIRIAMでの配信に遊びに行ってみてください。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/yakumoroki.webp" alt="Yakumo Roki"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created June 2026</p>
        <p class="illu-desc">Commissioned by Yakumo Roki (<a class="illu-handle" href="https://x.com/Yakumo_Roki" target="_blank" rel="noopener">@Yakumo_Roki</a>) for a full character illustration with expression variants. Designed with a gray × blue color palette and a wide-silhouette street fashion look, aiming to capture a laid-back vibe fitting a character who loves drinking and smoking.</p>
        <p class="illu-desc">※ To respect the client's rights, the full illustration is not shown here. Please check out their streams on IRIAM if you're curious.</p>
      </div>`,
      titleFr: '[Commande] Yakumo Roki — Illustration complète et expressions',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/yakumoroki.webp" alt="Yakumo Roki"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en juin 2026</p>
        <p class="illu-desc">Commande réalisée pour Yakumo Roki (<a class="illu-handle" href="https://x.com/Yakumo_Roki" target="_blank" rel="noopener">@Yakumo_Roki</a>) : une illustration complète avec variantes d'expression. Réalisée dans une palette gris × bleu avec une tenue streetwear à silhouette ample, pour capturer une ambiance nonchalante propre à un personnage amateur d'alcool et de cigarettes.</p>
        <p class="illu-desc">※ Par respect pour les droits du client, l'illustration complète n'est pas montrée ici. N'hésitez pas à visiter ses streams sur IRIAM.</p>
      </div>`,
    },
    logo_amazai: {
      title: '【ご依頼もの】甘罪めぇる様‐デコロゴ',
      titleEn: '[Commission] Amazai Meeru — Deco Logo',
      subtitle: 'Logo design',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/甘罪めぇる様ー相棒ありバージョン.jpg" alt="甘罪めぇる様ロゴ"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 06月 制作</p>
        <p class="illu-desc">甘罪めぇる様（<a class="illu-handle" href="https://x.com/amatsumi_meElu" target="_blank" rel="noopener">@amatsumi_meElu</a>）よりロゴのご依頼をいただきました。きゅるきゅるとした可愛らしい雰囲気を意識し、相棒キャラクターも一緒に配置したデザインに仕上げました。</p>
        <p class="illu-note">SNS・配信・グッズなど幅広い商用利用を想定し、PNG透過データでご納品しております。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/甘罪めぇる様ー相棒ありバージョン.jpg" alt="Amazai Meeru logo"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created June 2026</p>
        <p class="illu-desc">Commissioned by Amazai Meeru (<a class="illu-handle" href="https://x.com/amatsumi_meElu" target="_blank" rel="noopener">@amatsumi_meElu</a>) for a logo design. Designed with a cute, bubbly feel in mind, featuring their companion character alongside the main logo.</p>
        <p class="illu-note">Delivered as transparent PNG files for use across SNS, streams, and merchandise.</p>
      </div>`,
      titleFr: '[Commande] Amazai Meeru — Logo décoratif',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/logo/甘罪めぇる様ー相棒ありバージョン.jpg" alt="Logo Amazai Meeru"><figcaption class="illu-cap">sample</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en juin 2026</p>
        <p class="illu-desc">Commande réalisée pour Amazai Meeru (<a class="illu-handle" href="https://x.com/amatsumi_meElu" target="_blank" rel="noopener">@amatsumi_meElu</a>) : un logo à l'ambiance mignonne et pétillante, incluant son personnage compagnon aux côtés du logo principal.</p>
        <p class="illu-note">Livré en PNG transparent, utilisable pour les réseaux sociaux, le streaming et les produits dérivés.</p>
      </div>`,
    },
    illust_palma: {
      title: '【お仕事絵】有明パルマ様‐午後のティータイム',
      titleEn: '[Commission] Palma Ariake — Afternoon Tea',
      subtitle: 'Still illustration / Full illustration',
      html: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/有明パルマ様（わっかありバージョン）.webp" alt="午後のティータイム（わっかあり）"><figcaption class="illu-cap">わっかありバージョン（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/有明パルマ様（わっかなしバージョン）.webp" alt="午後のティータイム（わっかなし）"><figcaption class="illu-cap">わっかなしバージョン（50%）</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 06月 制作</p>
        <p class="illu-desc">有明パルマ様（<a class="illu-handle" href="https://x.com/Palmaaa_ariake" target="_blank" rel="noopener">@Palmaaa_ariake</a>）より、優雅に紅茶を飲むシーンのご依頼をいただきました。昼下がりのやわらかな光の中に佇む、落ち着きと品のある雰囲気を目指して制作しました。</p>
        <p class="illu-note">光の柔らかさと落ち着いた配色で、午後の静けさと優雅さを表現しました。わっかあり・わっかなしの2バージョンを納品しています。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/有明パルマ様（わっかありバージョン）.webp" alt="Afternoon Tea (with ring)"><figcaption class="illu-cap">with ring（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/有明パルマ様（わっかなしバージョン）.webp" alt="Afternoon Tea (without ring)"><figcaption class="illu-cap">without ring（50%）</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created June 2026</p>
        <p class="illu-desc">Commissioned by Palma Ariake (<a class="illu-handle" href="https://x.com/Palmaaa_ariake" target="_blank" rel="noopener">@Palmaaa_ariake</a>) for an elegant tea-time illustration. Set in the gentle light of a quiet afternoon, the piece captures a composed and graceful atmosphere.</p>
        <p class="illu-note">Soft lighting and a calm palette were used to convey the serenity and elegance of an afternoon moment. Delivered in two versions — with and without a ring accessory.</p>
      </div>`,
      titleFr: '[Commande] Palma Ariake — Thé de l’après-midi',
      htmlFr: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/有明パルマ様（わっかありバージョン）.webp" alt="Thé de l'après-midi (avec anneau)"><figcaption class="illu-cap">avec anneau（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/有明パルマ様（わっかなしバージョン）.webp" alt="Thé de l'après-midi (sans anneau)"><figcaption class="illu-cap">sans anneau（50%）</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en juin 2026</p>
        <p class="illu-desc">Commande réalisée pour Palma Ariake (<a class="illu-handle" href="https://x.com/Palmaaa_ariake" target="_blank" rel="noopener">@Palmaaa_ariake</a>) : une illustration élégante autour d'une scène de thé. Baignée dans la lumière douce d'un après-midi tranquille, l'œuvre cherche à capturer une atmosphère posée et raffinée.</p>
        <p class="illu-note">Une lumière douce et une palette apaisée traduisent la sérénité et l'élégance d'un moment d'après-midi. Livré en deux versions, avec et sans anneau décoratif.</p>
      </div>`,
    },
    illust_kaikunchibi: {
      title: '【お仕事絵】白旗かい様‐SDミニキャラ＋表情差分',
      titleEn: '[Commission] Hakki Kai — SD Chibi & Expression Variants',
      subtitle: 'SD chibi / Still illustration / Expression variants',
      html: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/ノーマル-sample.webp" alt="ノーマル"><figcaption class="illu-cap">ノーマル（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/喜-sample.webp" alt="喜"><figcaption class="illu-cap">喜（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/怒-sample.webp" alt="怒"><figcaption class="illu-cap">怒（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/怒(膨らまず-sampe.webp" alt="怒・膨らまず"><figcaption class="illu-cap">怒・膨らまず（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/哀-sample.webp" alt="哀"><figcaption class="illu-cap">哀（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/楽-sample.webp" alt="楽"><figcaption class="illu-cap">楽（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/納品sample-原寸.webp" alt="原寸"><figcaption class="illu-cap">納品sample 原寸（50%）</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 05月 制作</p>
        <p class="illu-desc">白旗かい様（<a class="illu-handle" href="https://x.com/Hakki_kai24" target="_blank" rel="noopener">@Hakki_kai24</a>）より、SDミニキャラ（立ち姿・透明背景）と喜怒哀楽の表情差分4種のご依頼をいただきました。前回の配信ED用ループアニメーションに引き続きご利用いただけたことを、大変嬉しく思っております。<br>サムネイル素材としてご活用いただく予定とのことで、顔パーツ以外も動かしやすいよう各部位を分けた状態でご納品しております。</p>
        <p class="illu-note">「怒」はご本人の性格に合わせ、頬を膨らませたキュートなバージョンとすっきりした表情の2パターンをご用意しました。喜怒哀楽それぞれの感情が自然なニュアンスで伝わるよう、表情や目の形を差分ごとに丁寧に調整しています。商用利用ライセンス込みでのご納品です。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/ノーマル-sample.webp" alt="Normal"><figcaption class="illu-cap">Normal（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/喜-sample.webp" alt="Joy"><figcaption class="illu-cap">Joy（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/怒-sample.webp" alt="Anger"><figcaption class="illu-cap">Anger（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/怒(膨らまず-sampe.webp" alt="Anger (puffed)"><figcaption class="illu-cap">Anger · puffed cheeks（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/哀-sample.webp" alt="Sadness"><figcaption class="illu-cap">Sadness（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/楽-sample.webp" alt="Fun"><figcaption class="illu-cap">Fun（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/納品sample-原寸.webp" alt="Full size"><figcaption class="illu-cap">Delivery sample · full size（50%）</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created May 2026</p>
        <p class="illu-desc">Commissioned by Hakki Kai (<a class="illu-handle" href="https://x.com/Hakki_kai24" target="_blank" rel="noopener">@Hakki_kai24</a>) for an SD chibi character (standing pose, transparent background) with 4 emotion expression variants. I'm truly grateful to have been entrusted with another commission following the previous stream ED loop animation.<br>As the files are intended for use as thumbnail assets, each body part was delivered separately so Hakki Kai can animate them freely.</p>
        <p class="illu-note">For "Anger," two variations were created to match their personality — one with puffed cheeks and one with a composed expression. Each emotion variant was carefully adjusted in expression and eye shape to ensure the nuance comes through naturally. Delivered with commercial use license.</p>
      </div>`,
      titleFr: '[Commande] Hakki Kai — Chibi SD et variantes d’expression',
      htmlFr: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/ノーマル-sample.webp" alt="Normal"><figcaption class="illu-cap">Normal（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/喜-sample.webp" alt="Joie"><figcaption class="illu-cap">Joie（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/怒-sample.webp" alt="Colère"><figcaption class="illu-cap">Colère（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/怒(膨らまず-sampe.webp" alt="Colère (joues gonflées)"><figcaption class="illu-cap">Colère · joues gonflées（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/哀-sample.webp" alt="Tristesse"><figcaption class="illu-cap">Tristesse（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/楽-sample.webp" alt="Amusement"><figcaption class="illu-cap">Amusement（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/納品sample-原寸.webp" alt="Taille réelle"><figcaption class="illu-cap">Échantillon de livraison · taille réelle（50%）</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en mai 2026</p>
        <p class="illu-desc">Commande réalisée pour Hakki Kai (<a class="illu-handle" href="https://x.com/Hakki_kai24" target="_blank" rel="noopener">@Hakki_kai24</a>) : un chibi SD (pose debout, fond transparent) avec 4 variantes d'expression. Je suis très reconnaissante d'avoir reçu une nouvelle commande après la précédente animation en boucle pour l'ED de stream.<br>Les fichiers étant destinés à un usage en miniatures, chaque partie du corps a été livrée séparément pour une animation facile.</p>
        <p class="illu-note">Pour « Colère », deux variantes ont été créées selon la personnalité du personnage : une avec les joues gonflées et une plus posée. Chaque expression a été ajustée avec soin au niveau du regard et des traits pour transmettre la nuance naturellement. Livré avec licence d'usage commercial.</p>
      </div>`,
    },
    illust_510camera: {
      title: '【お仕事絵】5×10様‐お祝いイラスト',
      titleEn: '[Commission] 5×10 — Celebration Illustration',
      subtitle: 'Still illustration / Event illustration',
      html: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/510cameraーsample.webp" alt="お祝いイラスト"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/510cameraoffーsample.webp" alt="背景なし"><figcaption class="illu-cap">sample（背景なし・50%）</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 04月 制作</p>
        <p class="illu-desc">5×10様（<a class="illu-handle" href="https://x.com/510Mstar" target="_blank" rel="noopener">@510Mstar</a>）より、誕生日・周年記念イベントにご使用いただくお祝いイラストのご依頼をいただきました。参加者みんなで楽しめる賑やかで温かみのある一枚を目指して制作しました。</p>
        <p class="illu-note">お祝いの場にふさわしい華やかさを大切にしつつ、キャラクターの個性が引き立つ構図と色調でまとめています。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/510cameraーsample.webp" alt="Celebration illustration"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/510cameraoffーsample.webp" alt="No background"><figcaption class="illu-cap">sample (no bg · 50%)</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created April 2026</p>
        <p class="illu-desc">Commissioned by 5×10 (<a class="illu-handle" href="https://x.com/510Mstar" target="_blank" rel="noopener">@510Mstar</a>) for a lively celebration illustration for use at birthday and anniversary events. Created with a warm, festive feel that everyone can enjoy together.</p>
        <p class="illu-note">Focused on the character's personality and vibrant composition, with color balance chosen to suit the celebratory setting.</p>
      </div>`,
      titleFr: '[Commande] 5×10 — Illustration de célébration',
      htmlFr: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/510cameraーsample.webp" alt="Illustration de célébration"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/510cameraoffーsample.webp" alt="Sans fond"><figcaption class="illu-cap">sample (sans fond · 50%)</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en avril 2026</p>
        <p class="illu-desc">Commande réalisée pour 5×10 (<a class="illu-handle" href="https://x.com/510Mstar" target="_blank" rel="noopener">@510Mstar</a>) : une illustration festive pour un anniversaire ou un événement commémoratif. Créée avec une ambiance chaleureuse et joyeuse, à partager avec tous les participants.</p>
        <p class="illu-note">L'accent a été mis sur la personnalité du personnage et une composition vive, avec un équilibre des couleurs adapté à l'ambiance festive.</p>
      </div>`,
    },
    illust_hakkikai: {
      title: '【お仕事絵】白旗かい様‐配信ED用ループアニメーション',
      titleEn: '[Commission] Hakki Kai — Stream ED Loop Animation',
      subtitle: 'Loop animation / Background illustration',
      html: `<div class="mwork mwork--illu">
        <video autoplay loop muted playsinline style="width:100%; border-radius:8px; margin-bottom:4px;">
          <source src="../images/works/illust/original/Scene1_1.mp4" type="video/mp4">
        </video>
        <span class="illu-cap" style="display:block; text-align:center; margin-bottom:16px;">ループアニメーション（50%）</span>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 04月 制作</p>
        <p class="illu-desc">白旗かい様（<a class="illu-handle" href="https://x.com/Hakki_kai24" target="_blank" rel="noopener">@Hakki_kai24</a>）よりご依頼いただき、配信ED用の背景付きループアニメーションを制作させていただきました。昼下がりの作業部屋で、猫と一緒にのんびり作業をしているシーンをイメージして描いています。</p>
        <p class="illu-note">まったりとやわらかい雰囲気を大切に、光の差し込み方や室内の小物の配置にこだわって仕上げました。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <video autoplay loop muted playsinline style="width:100%; border-radius:8px; margin-bottom:4px;">
          <source src="../images/works/illust/original/Scene1_1.mp4" type="video/mp4">
        </video>
        <span class="illu-cap" style="display:block; text-align:center; margin-bottom:16px;">loop animation（50%）</span>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created April 2026</p>
        <p class="illu-desc">Commissioned by Hakki Kai (<a class="illu-handle" href="https://x.com/Hakki_kai24" target="_blank" rel="noopener">@Hakki_kai24</a>) for a looping background animation for their stream ED. The scene depicts a lazy afternoon in a cozy study, working at a laptop with a cat curled up nearby.</p>
        <p class="illu-note">Focused on a warm, relaxed atmosphere, with care given to the way light filters through the window and the arrangement of room details.</p>
      </div>`,
      titleFr: '[Commande] Hakki Kai — Animation en boucle pour ED de stream',
      htmlFr: `<div class="mwork mwork--illu">
        <video autoplay loop muted playsinline style="width:100%; border-radius:8px; margin-bottom:4px;">
          <source src="../images/works/illust/original/Scene1_1.mp4" type="video/mp4">
        </video>
        <span class="illu-cap" style="display:block; text-align:center; margin-bottom:16px;">animation en boucle（50%）</span>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en avril 2026</p>
        <p class="illu-desc">Commande réalisée pour Hakki Kai (<a class="illu-handle" href="https://x.com/Hakki_kai24" target="_blank" rel="noopener">@Hakki_kai24</a>) : une animation de fond en boucle pour l'ED de son stream. La scène dépeint un après-midi paisible dans un bureau douillet, en train de travailler avec un chat lové à ses côtés.</p>
        <p class="illu-note">L'accent a été mis sur une ambiance chaleureuse et détendue, avec un soin particulier apporté à la lumière filtrant par la fenêtre et à la disposition des objets de la pièce.</p>
      </div>`,
    },
    illust_yuuuuto: {
      title: '【お仕事絵】ゆーと様‐アイコン等',
      titleEn: '[Commission] Yuuto — Icon & Half-Body Art',
      subtitle: 'Icon / Still illustration / Portrait painting',
      html: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/yuuuutoicon.webp" alt="アイコン"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/yuuuuto.webp" alt="半身"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">2026年 01月 制作</p>
        <p class="illu-desc">ゆーと様（<a class="illu-handle" href="https://x.com/yuuuuto0404" target="_blank" rel="noopener">@yuuuuto0404</a>）より淡くやわらかい印象のアイコンと、動画編集で使える背景透過の半身イラストをご依頼いただきました。</p>
        <p class="illu-note">テロップや画面と干渉しないよう色の主張を抑えつつ、小さく表示しても感情が伝わる表情に調整しています。<br>猫との接触を視線の起点にした構図にし、半身イラストは合成時になじむよう輪郭と彩度を整理しました。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/yuuuutoicon.webp" alt="Icon"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/yuuuuto.webp" alt="Half-body"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created January 2026</p>
        <p class="illu-desc">Commissioned by Yuuto (<a class="illu-handle" href="https://x.com/yuuuuto0404" target="_blank" rel="noopener">@yuuuuto0404</a>) for a soft, gentle icon and a transparent-background half-body illustration for video editing use.</p>
        <p class="illu-note">Colors were kept subdued to avoid competing with on-screen text and elements, while ensuring the expression reads clearly even at small sizes.<br>The composition centers on the cat as the visual anchor; outlines and saturation were refined for seamless video compositing.</p>
      </div>`,
      titleFr: '[Commande] Yuuto — Icône et illustration mi-corps',
      htmlFr: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/yuuuutoicon.webp" alt="Icône"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/yuuuuto.webp" alt="Mi-corps"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en janvier 2026</p>
        <p class="illu-desc">Commande réalisée pour Yuuto (<a class="illu-handle" href="https://x.com/yuuuuto0404" target="_blank" rel="noopener">@yuuuuto0404</a>) : une icône douce et tout en délicatesse, ainsi qu'une illustration mi-corps à fond transparent destinée au montage vidéo.</p>
        <p class="illu-note">Les couleurs ont été atténuées pour ne pas entrer en conflit avec le texte et les éléments à l'écran, tout en gardant une expression lisible même en petite taille.<br>La composition place le chat comme point d'ancrage visuel ; les contours et la saturation ont été affinés pour un compositing vidéo harmonieux.</p>
      </div>`,
    },
    illust_shiraishiayameheader: {
      title: '【お仕事絵】白石あやめ様 - ヘッダー',
      titleEn: '[Commission] Shiraishi Ayame — Header',
      subtitle: 'Header / Still illustration / Portrait painting',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/shiraishiayameheader.webp" alt="ヘッダー"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2025年 11月 制作</p>
        <p class="illu-desc">白石あやめ様（<a class="illu-handle" href="https://x.com/ayamechan36" target="_blank" rel="noopener">@ayamechan36</a>）よりヘッダー作成のご依頼いただき、描かせていただきました。</p>
        <p class="illu-note">内向的ながら明るさに憧れる人物像をテーマに、ロリータファッションと花モチーフで心情の対比を表現しました。<br>スカートの内に忍ばせたアジサイと、周囲に散らしたバラで秘めた想いと華やかさを象徴しています。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/shiraishiayameheader.webp" alt="Header"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created November 2025</p>
        <p class="illu-desc">Commissioned by Shiraishi Ayame (<a class="illu-handle" href="https://x.com/ayamechan36" target="_blank" rel="noopener">@ayamechan36</a>) for a header illustration.</p>
        <p class="illu-note">Themed around an introverted character who yearns for brightness, using lolita fashion and floral motifs to convey emotional contrast.<br>Hydrangeas tucked into the skirt and roses scattered around symbolize hidden feelings and outward elegance.</p>
      </div>`,
      titleFr: '[Commande] Shiraishi Ayame — Bannière',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/shiraishiayameheader.webp" alt="Bannière"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en novembre 2025</p>
        <p class="illu-desc">Commande réalisée pour Shiraishi Ayame (<a class="illu-handle" href="https://x.com/ayamechan36" target="_blank" rel="noopener">@ayamechan36</a>) : une illustration pour bannière.</p>
        <p class="illu-note">Sur le thème d'un personnage introverti aspirant à la luminosité, l'illustration utilise la mode lolita et des motifs floraux pour exprimer un contraste émotionnel.<br>Les hortensias glissés dans la jupe et les roses éparpillées symbolisent des sentiments cachés et une élégance apparente.</p>
      </div>`,
    },
    illust_koihachi: {
      title: '【お仕事絵】今、恋がはじまれ。',
      titleEn: '[Commission] Ima, Koi ga Hajimere (cover by Kotodori Seseri)',
      subtitle: 'Illustration / Thumbnail',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/koihachi.webp" alt="今、恋がはじまれ。"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2025年 10月 制作</p>
        <p class="illu-desc">小鳥遊せせり様（<a class="illu-handle" href="https://x.com/seseri120" target="_blank" rel="noopener">@seseri120</a>）よりサムネイル作成の依頼をいただき、描かせていただきました。HoneyWorks様の「今、恋がはじまれ」歌ってみた動画用のサムネイルイラストです。本家タイトル作成あり◎</p>
        <p class="illu-note">楽曲の雰囲気に沿った表情づくりを意識しています。</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=GwAjyjjn4bo" target="_blank" rel="noopener">実際に使用された動画を見る</a></p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/koihachi.webp" alt="Ima, Koi ga Hajimere"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created October 2025</p>
        <p class="illu-desc">Commissioned by Kotodori Seseri (<a class="illu-handle" href="https://x.com/seseri120" target="_blank" rel="noopener">@seseri120</a>) for a thumbnail for their "Ima, Koi ga Hajimere" (by HoneyWorks) cover video. Includes original title logo creation.</p>
        <p class="illu-note">Focused on capturing an expression that matches the mood of the song.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=GwAjyjjn4bo" target="_blank" rel="noopener">Watch the video</a></p>
      </div>`,
      titleFr: '[Commande] Ima, Koi ga Hajimere (cover de Kotodori Seseri)',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/koihachi.webp" alt="Ima, Koi ga Hajimere"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en octobre 2025</p>
        <p class="illu-desc">Commande réalisée pour Kotodori Seseri (<a class="illu-handle" href="https://x.com/seseri120" target="_blank" rel="noopener">@seseri120</a>) : une miniature pour son cover vidéo de « Ima, Koi ga Hajimere » (HoneyWorks). Création du logo du titre incluse.</p>
        <p class="illu-note">L'expression a été pensée pour correspondre à l'ambiance du morceau.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=GwAjyjjn4bo" target="_blank" rel="noopener">Voir la vidéo</a></p>
      </div>`,
    },
    illust_characterdesign: {
      title: '【お仕事絵】キャラクターデザインまとめ',
      titleEn: '[Commission] Character Design Collection',
      subtitle: 'CharacterDesign / Portrait painting',
      html: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/01.webp" alt="1"><figcaption>1</figcaption></figure>
          <figure><img src="../images/works/illust/original/02.webp" alt="2"><figcaption>2</figcaption></figure>
          <figure><img src="../images/works/illust/original/03.webp" alt="3"><figcaption>3</figcaption></figure>
          <figure><img src="../images/works/illust/original/04.webp" alt="4"><figcaption>4</figcaption></figure>
          <figure><img src="../images/works/illust/original/05.webp" alt="5"><figcaption>5</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">2024〜2025年分制作まとめ</p>
        <p class="illu-desc">中華圏TikTokで活動なされてる方々からVtuber/キャラクターデザインの依頼をいただき、デザインのみさせていただきました。</p>
        <p class="illu-note">個別にデフォルメ差分あり◎ 衣装差分あり◎</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/01.webp" alt="1"><figcaption>1</figcaption></figure>
          <figure><img src="../images/works/illust/original/02.webp" alt="2"><figcaption>2</figcaption></figure>
          <figure><img src="../images/works/illust/original/03.webp" alt="3"><figcaption>3</figcaption></figure>
          <figure><img src="../images/works/illust/original/04.webp" alt="4"><figcaption>4</figcaption></figure>
          <figure><img src="../images/works/illust/original/05.webp" alt="5"><figcaption>5</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">2024–2025 collection</p>
        <p class="illu-desc">Received VTuber / character design commissions from creators active on TikTok in the Chinese-speaking community. Design work only.</p>
        <p class="illu-note">Individual chibi variants and costume variants included.</p>
      </div>`,
      titleFr: '[Commande] Recueil de character design',
      htmlFr: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/01.webp" alt="1"><figcaption>1</figcaption></figure>
          <figure><img src="../images/works/illust/original/02.webp" alt="2"><figcaption>2</figcaption></figure>
          <figure><img src="../images/works/illust/original/03.webp" alt="3"><figcaption>3</figcaption></figure>
          <figure><img src="../images/works/illust/original/04.webp" alt="4"><figcaption>4</figcaption></figure>
          <figure><img src="../images/works/illust/original/05.webp" alt="5"><figcaption>5</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Recueil 2024–2025</p>
        <p class="illu-desc">Commandes de character design VTuber reçues de créateurs actifs sur TikTok dans la communauté sinophone. Travail de design uniquement.</p>
        <p class="illu-note">Variantes chibi et variantes de tenues incluses individuellement.</p>
      </div>`,
    },
    illust_otome: {
      title: '【お仕事絵】乙女解剖 / DECO*27(cover by 花ノ院とあ)',
      titleEn: '[Commission] Otome Kaibou / DECO*27 (cover by Hananoin Toa)',
      subtitle: 'Thumbnail / Still illustration',
      html: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/otome.webp" alt="サムネイル"><figcaption>サムネイル</figcaption></figure>
          <figure><img src="../images/works/illust/original/otome-dop.webp" alt="目開け口開け"><figcaption>目開け口開け</figcaption></figure>
          <figure><img src="../images/works/illust/original/otome.eomc.webp" alt="目開け口閉じ"><figcaption>目開け口閉じ</figcaption></figure>
          <figure><img src="../images/works/illust/original/otome.ehcmo.webp" alt="目半開き口開け"><figcaption>目半開き口開け</figcaption></figure>
          <figure><img src="../images/works/illust/original/otome.ehcmc.webp" alt="目半開き口閉じ"><figcaption>目半開き口閉じ</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">2024年 03月 制作</p>
        <p class="illu-desc">花ノ院とあ様（<a class="illu-handle" href="https://x.com/hananoin_toa" target="_blank" rel="noopener">@hananoin_toa</a>）よりサムネイル作成の依頼をいただき、描かせていただきました。DECO*27様の「乙女解剖」歌ってみた動画用のサムネイルイラストです。本家タイトル作成あり◎</p>
        <p class="illu-note">楽曲の雰囲気に沿った表情づくりを意識しています。</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=S6r3AWerjI4" target="_blank" rel="noopener">実際に使用された動画を見る</a></p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/otome.webp" alt="Thumbnail"><figcaption>Thumbnail</figcaption></figure>
          <figure><img src="../images/works/illust/original/otome-dop.webp" alt="Eyes open, mouth open"><figcaption>Eyes open, mouth open</figcaption></figure>
          <figure><img src="../images/works/illust/original/otome.eomc.webp" alt="Eyes open, mouth closed"><figcaption>Eyes open, mouth closed</figcaption></figure>
          <figure><img src="../images/works/illust/original/otome.ehcmo.webp" alt="Half-open eyes, mouth open"><figcaption>Half-open eyes, mouth open</figcaption></figure>
          <figure><img src="../images/works/illust/original/otome.ehcmc.webp" alt="Half-open eyes, mouth closed"><figcaption>Half-open eyes, mouth closed</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created March 2024</p>
        <p class="illu-desc">Commissioned by Hananoin Toa (<a class="illu-handle" href="https://x.com/hananoin_toa" target="_blank" rel="noopener">@hananoin_toa</a>) for a thumbnail for their "Otome Kaibou" (by DECO*27) cover video. Includes original title logo creation.</p>
        <p class="illu-note">Focused on crafting expressions that match the mood of the song.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=S6r3AWerjI4" target="_blank" rel="noopener">Watch the video</a></p>
      </div>`,
      titleFr: '[Commande] Otome Kaibou / DECO*27 (cover de Hananoin Toa)',
      htmlFr: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/otome.webp" alt="Miniature"><figcaption>Miniature</figcaption></figure>
          <figure><img src="../images/works/illust/original/otome-dop.webp" alt="Yeux ouverts, bouche ouverte"><figcaption>Yeux ouverts, bouche ouverte</figcaption></figure>
          <figure><img src="../images/works/illust/original/otome.eomc.webp" alt="Yeux ouverts, bouche fermée"><figcaption>Yeux ouverts, bouche fermée</figcaption></figure>
          <figure><img src="../images/works/illust/original/otome.ehcmo.webp" alt="Yeux mi-clos, bouche ouverte"><figcaption>Yeux mi-clos, bouche ouverte</figcaption></figure>
          <figure><img src="../images/works/illust/original/otome.ehcmc.webp" alt="Yeux mi-clos, bouche fermée"><figcaption>Yeux mi-clos, bouche fermée</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en mars 2024</p>
        <p class="illu-desc">Commande réalisée pour Hananoin Toa (<a class="illu-handle" href="https://x.com/hananoin_toa" target="_blank" rel="noopener">@hananoin_toa</a>) : une miniature pour son cover vidéo de « Otome Kaibou » (DECO*27). Création du logo du titre incluse.</p>
        <p class="illu-note">L'expression a été pensée pour correspondre à l'ambiance du morceau.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=S6r3AWerjI4" target="_blank" rel="noopener">Voir la vidéo</a></p>
      </div>`,
    },
    illust_sokkenai: {
      title: '【お仕事絵】そっけない(cover by Numa)',
      titleEn: '[Commission] Sokkenaï (cover by Numa)',
      subtitle: 'Still illustration / Portrait painting / Thumbnail',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/sokkenai.webp" alt="そっけない"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2023年 12月 制作</p>
        <p class="illu-desc">Numa様（<a class="illu-handle" href="https://x.com/Numa_identity" target="_blank" rel="noopener">@Numa_identity</a>）よりサムネイル作成の依頼をいただき、描かせていただきました。RADWIMPS様の「そっけない」歌ってみた動画用のサムネイルイラストです。</p>
        <p class="illu-note">雪の降る夜、バス停でひとり過ごす静かな時間を描いています。見る人によって受け取り方が変わる余白を意識しました。</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=aXxRNVyMvLI" target="_blank" rel="noopener">実際に使用された動画を見る</a></p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/sokkenai.webp" alt="Sokkenaï"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created December 2023</p>
        <p class="illu-desc">Commissioned by Numa (<a class="illu-handle" href="https://x.com/Numa_identity" target="_blank" rel="noopener">@Numa_identity</a>) for a thumbnail for their "Sokkenaï" (by RADWIMPS) cover video.</p>
        <p class="illu-note">Depicts a quiet, solitary moment at a bus stop on a snowy night. Left room for the viewer to bring their own interpretation.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=aXxRNVyMvLI" target="_blank" rel="noopener">Watch the video</a></p>
      </div>`,
      titleFr: '[Commande] Sokkenaï (cover de Numa)',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/sokkenai.webp" alt="Sokkenaï"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en décembre 2023</p>
        <p class="illu-desc">Commande réalisée pour Numa (<a class="illu-handle" href="https://x.com/Numa_identity" target="_blank" rel="noopener">@Numa_identity</a>) : une miniature pour son cover vidéo de « Sokkenaï » (RADWIMPS).</p>
        <p class="illu-note">Dépeint un moment calme et solitaire à un arrêt de bus, sous la neige. Un espace volontairement laissé ouvert à l'interprétation de chacun.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=aXxRNVyMvLI" target="_blank" rel="noopener">Voir la vidéo</a></p>
      </div>`,
    },
    illust_rarumucris: {
      title: '【お仕事絵】クリスマステーマの一枚絵',
      titleEn: '[Commission] Christmas Illustration',
      subtitle: 'Still illustration / Portrait painting',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/rarumucris.webp" alt="クリスマステーマの一枚絵"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2023年 12月 制作</p>
        <p class="illu-desc">灰棘らるむ様（<a class="illu-handle" href="https://x.com/LArm_hy" target="_blank" rel="noopener">@LArm_hy</a>）よりイラスト作成の依頼をいただき、描かせていただきました。</p>
        <p class="illu-note">夜空に浮かぶ月とプレゼントに包まれた、幻想的な時間を描いています。やわらかな光と色の重なりを意識しました。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/rarumucris.webp" alt="Christmas Illustration"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created December 2023</p>
        <p class="illu-desc">Commissioned by Haibara Rarumu (<a class="illu-handle" href="https://x.com/LArm_hy" target="_blank" rel="noopener">@LArm_hy</a>) for an original illustration.</p>
        <p class="illu-note">A dreamlike scene bathed in moonlight, surrounded by Christmas gifts. Focused on soft layered light and harmonious color.</p>
      </div>`,
      titleFr: '[Commande] Illustration sur le thème de Noël',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/rarumucris.webp" alt="Illustration sur le thème de Noël"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en décembre 2023</p>
        <p class="illu-desc">Commande réalisée pour Haibara Rarumu (<a class="illu-handle" href="https://x.com/LArm_hy" target="_blank" rel="noopener">@LArm_hy</a>) : une illustration originale.</p>
        <p class="illu-note">Une scène onirique baignée de clair de lune, entourée de cadeaux de Noël. L'accent a été mis sur une lumière douce en superposition et des couleurs harmonieuses.</p>
      </div>`,
    },
    illust_hujii: {
      title: '【お仕事絵】配信用兼グッズに使うイラスト',
      titleEn: '[Commission] Stream & Goods Illustration',
      subtitle: 'Goods / Still illustration / Portrait painting',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/hujii.webp" alt="配信用兼グッズイラスト"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2023年 10月 制作</p>
        <p class="illu-note">配信用およびグッズ向けイラストとして制作した一枚です。商用利用ありの案件となります。掲載元不明のため、配信者名・関連リンクは非掲載としています。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/hujii.webp" alt="Stream &amp; Goods Illustration"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created October 2023</p>
        <p class="illu-note">Created for use as a streaming visual and merchandise illustration. Commercial use included. Client name and related links are withheld as the original source cannot be confirmed.</p>
      </div>`,
      titleFr: '[Commande] Illustration pour stream et produits dérivés',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/hujii.webp" alt="Illustration pour stream et produits dérivés"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en octobre 2023</p>
        <p class="illu-note">Réalisée pour un usage en visuel de stream et en produit dérivé. Usage commercial inclus. Le nom du client et les liens associés ne sont pas indiqués, la source d'origine n'ayant pas pu être confirmée.</p>
      </div>`,
    },
    illust_sukiccyu: {
      title: '【お仕事絵】すきっちゅーの！(cover by ちぃ)',
      titleEn: '[Commission] Sukicchu no! (cover by Chii)',
      subtitle: 'Thumbnail / Portrait painting',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/sukiccyu.webp" alt="すきっちゅーの！"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2023年 9月 制作</p>
        <p class="illu-desc">ちぃ様（<a class="illu-handle" href="https://x.com/chii1402" target="_blank" rel="noopener">@chii1402</a>）より歌ってみた用サムネイル作成の依頼をいただき、描かせていただきました。HoneyWorks様の「すきっちゅーの！」歌ってみた動画用のサムネイルイラストです。</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=x396yZY2f2c" target="_blank" rel="noopener">実際に使用された動画を見る</a></p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/sukiccyu.webp" alt="Sukicchu no!"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created September 2023</p>
        <p class="illu-desc">Commissioned by Chii (<a class="illu-handle" href="https://x.com/chii1402" target="_blank" rel="noopener">@chii1402</a>) for a thumbnail for their "Sukicchu no!" (by HoneyWorks) cover video.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=x396yZY2f2c" target="_blank" rel="noopener">Watch the video</a></p>
      </div>`,
      titleFr: '[Commande] Sukicchu no! (cover de Chii)',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/sukiccyu.webp" alt="Sukicchu no!"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en septembre 2023</p>
        <p class="illu-desc">Commande réalisée pour Chii (<a class="illu-handle" href="https://x.com/chii1402" target="_blank" rel="noopener">@chii1402</a>) : une miniature pour son cover vidéo de « Sukicchu no! » (HoneyWorks).</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=x396yZY2f2c" target="_blank" rel="noopener">Voir la vidéo</a></p>
      </div>`,
    },
    illust_dokusou: {
      title: '【お仕事絵】独奏(cover by うみか)',
      titleEn: '[Commission] Dokusou (cover by Umika)',
      subtitle: 'Thumbnail / MV / Portrait painting',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/dokusou.webp" alt="独奏"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2023年 9月 制作</p>
        <p class="illu-desc">うみか様（<a class="illu-handle" href="https://x.com/000umika000" target="_blank" rel="noopener">@000umika000</a>）より一枚絵およびMV作成の依頼いただき、描かせていただきました。YASUHIRO(康寛)様の「独奏」歌ってみた動画用のイラストです。オリジナルMV・背景変更指定・本家タイトル作成ありの案件です。</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=zwI8HzYCMGw" target="_blank" rel="noopener">実際に使用された動画を見る</a></p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/dokusou.webp" alt="Dokusou"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created September 2023</p>
        <p class="illu-desc">Commissioned by Umika (<a class="illu-handle" href="https://x.com/000umika000" target="_blank" rel="noopener">@000umika000</a>) for a still illustration and MV for their "Dokusou" (by YASUHIRO) cover video. Includes original MV, background change, and title logo creation.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=zwI8HzYCMGw" target="_blank" rel="noopener">Watch the video</a></p>
      </div>`,
      titleFr: '[Commande] Dokusou (cover de Umika)',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/dokusou.webp" alt="Dokusou"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en septembre 2023</p>
        <p class="illu-desc">Commande réalisée pour Umika (<a class="illu-handle" href="https://x.com/000umika000" target="_blank" rel="noopener">@000umika000</a>) : une illustration et un MV pour son cover vidéo de « Dokusou » (YASUHIRO). Comprend un MV original, un changement de fond et la création du logo du titre.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=zwI8HzYCMGw" target="_blank" rel="noopener">Voir la vidéo</a></p>
      </div>`,
    },
    illust_allback: {
      title: '【お仕事絵】強風オールバック(cover by うみか)',
      titleEn: '[Commission] Kyoufu Allback (cover by Umika)',
      subtitle: 'Thumbnail / Portrait painting',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/allback.webp" alt="強風オールバック"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2023年 7月 制作</p>
        <p class="illu-desc">うみか様（<a class="illu-handle" href="https://x.com/000umika000" target="_blank" rel="noopener">@000umika000</a>）よりサムネイル画像作成の依頼をいただき、描かせていただきました。Yukopi様の「強風オールバック」歌ってみた動画用のサムネイルイラストです。</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=4znGkEUSlSc" target="_blank" rel="noopener">実際に使用された動画を見る</a></p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/allback.webp" alt="Kyoufu Allback"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created July 2023</p>
        <p class="illu-desc">Commissioned by Umika (<a class="illu-handle" href="https://x.com/000umika000" target="_blank" rel="noopener">@000umika000</a>) for a thumbnail for their "Kyoufu Allback" (by Yukopi) cover video.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=4znGkEUSlSc" target="_blank" rel="noopener">Watch the video</a></p>
      </div>`,
      titleFr: '[Commande] Kyoufu Allback (cover de Umika)',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/allback.webp" alt="Kyoufu Allback"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en juillet 2023</p>
        <p class="illu-desc">Commande réalisée pour Umika (<a class="illu-handle" href="https://x.com/000umika000" target="_blank" rel="noopener">@000umika000</a>) : une miniature pour son cover vidéo de « Kyoufu Allback » (Yukopi).</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=4znGkEUSlSc" target="_blank" rel="noopener">Voir la vidéo</a></p>
      </div>`,
    },
    illust_ramuneko: {
      title: '【お仕事絵】アイドルグッズのイラスト依頼',
      titleEn: '[Commission] Idol Goods Illustration',
      subtitle: 'Goods / Still illustration',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/ramuneko.webp" alt="アイドルグッズイラスト"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2023年 3月 制作</p>
        <p class="illu-desc">アイドルの水海らむね様（<a class="illu-handle" href="https://x.com/mizuumiramune" target="_blank" rel="noopener">@mizuumiramune</a>）ご本人様より誕生日イベントにて販売される、プリントTシャツ用にイラストとしてご依頼をいただき、制作しました。グッズ使用を前提とした構成で描き下ろし作品です。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/ramuneko.webp" alt="Idol Goods Illustration"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created March 2023</p>
        <p class="illu-desc">Commissioned by idol Mizuumi Ramune (<a class="illu-handle" href="https://x.com/mizuumiramune" target="_blank" rel="noopener">@mizuumiramune</a>) for a print T-shirt illustration sold at her birthday event. A newly drawn piece created specifically for merchandise.</p>
      </div>`,
      titleFr: '[Commande] Illustration pour produits dérivés d’idole',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/ramuneko.webp" alt="Illustration pour produits dérivés d'idole"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en mars 2023</p>
        <p class="illu-desc">Commande réalisée pour l'idole Mizuumi Ramune (<a class="illu-handle" href="https://x.com/mizuumiramune" target="_blank" rel="noopener">@mizuumiramune</a>) : une illustration pour un t-shirt imprimé vendu lors de son événement d'anniversaire. Œuvre inédite conçue spécifiquement pour un produit dérivé.</p>
      </div>`,
    },
    illust_aota: {
      title: '【お仕事絵】可愛くてごめん',
      titleEn: '[Commission] Kawaikute Gomen',
      subtitle: 'Thumbnail / Portrait painting',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/aota.webp" alt="可愛くてごめん"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2023年 3月 制作</p>
        <p class="illu-desc">歌ってみたのサムネイルイラストとしてご依頼をいただき、制作しました。HoneyWorks様の「可愛くてごめん」歌ってみた動画用のサムネイルイラストです。背景変更指定・本家タイトル作成ありの案件です。</p>
        <p class="illu-desc">権利配慮のため、歌い手様名および動画リンクの記載は控えています。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/aota.webp" alt="Kawaikute Gomen"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created March 2023</p>
        <p class="illu-desc">Commissioned for a thumbnail for a "Kawaikute Gomen" (by HoneyWorks) cover video. Includes background change and original title logo creation.</p>
        <p class="illu-desc">Client name and video link are withheld out of rights consideration.</p>
      </div>`,
      titleFr: '[Commande] Kawaikute Gomen',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/aota.webp" alt="Kawaikute Gomen"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en mars 2023</p>
        <p class="illu-desc">Commande réalisée pour une miniature de cover vidéo de « Kawaikute Gomen » (HoneyWorks). Comprend un changement de fond et la création du logo du titre.</p>
        <p class="illu-desc">Le nom de l'interprète et le lien de la vidéo ne sont pas indiqués par respect des droits.</p>
      </div>`,
    },
    illust_bloody: {
      title: '【お仕事絵】ブラッディメアリー',
      titleEn: '[Commission] Bloody Mary',
      subtitle: 'Thumbnail / Still illustration / Portrait painting',
      html: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/bloody.webp" alt="メイン"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/bloody-eos.webp" alt="目開けスマイル"><figcaption>目開けスマイル</figcaption></figure>
          <figure><img src="../images/works/illust/original/bloody-eo.webp" alt="目開け普通"><figcaption>目開け普通</figcaption></figure>
          <figure><img src="../images/works/illust/original/bloody-ecs.webp" alt="目閉じスマイル"><figcaption>目閉じスマイル</figcaption></figure>
          <figure><img src="../images/works/illust/original/bloody-ec.webp" alt="目閉じ普通"><figcaption>目閉じ普通</figcaption></figure>
          <figure><img src="../images/works/illust/original/bloody-back.webp" alt="背景のみ"><figcaption>背景のみ</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">2023年 3月 制作</p>
        <p class="illu-desc">歌ってみたMV用1枚絵としてご依頼をいただき、制作しました。表情差分ありの案件です。</p>
        <p class="illu-desc">権利配慮のため、歌い手様名および動画リンクの記載は控えています。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/bloody.webp" alt="Main"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/bloody-eos.webp" alt="Eyes open, smiling"><figcaption>Eyes open, smiling</figcaption></figure>
          <figure><img src="../images/works/illust/original/bloody-eo.webp" alt="Eyes open, neutral"><figcaption>Eyes open, neutral</figcaption></figure>
          <figure><img src="../images/works/illust/original/bloody-ecs.webp" alt="Eyes closed, smiling"><figcaption>Eyes closed, smiling</figcaption></figure>
          <figure><img src="../images/works/illust/original/bloody-ec.webp" alt="Eyes closed, neutral"><figcaption>Eyes closed, neutral</figcaption></figure>
          <figure><img src="../images/works/illust/original/bloody-back.webp" alt="Background only"><figcaption>Background only</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created March 2023</p>
        <p class="illu-desc">Commissioned for a still illustration for a song cover MV. Includes facial expression variants.</p>
        <p class="illu-desc">Client name and video link are withheld out of rights consideration.</p>
      </div>`,
      titleFr: '[Commande] Bloody Mary',
      htmlFr: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/bloody.webp" alt="Principal"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/bloody-eos.webp" alt="Yeux ouverts, souriant"><figcaption>Yeux ouverts, souriant</figcaption></figure>
          <figure><img src="../images/works/illust/original/bloody-eo.webp" alt="Yeux ouverts, neutre"><figcaption>Yeux ouverts, neutre</figcaption></figure>
          <figure><img src="../images/works/illust/original/bloody-ecs.webp" alt="Yeux fermés, souriant"><figcaption>Yeux fermés, souriant</figcaption></figure>
          <figure><img src="../images/works/illust/original/bloody-ec.webp" alt="Yeux fermés, neutre"><figcaption>Yeux fermés, neutre</figcaption></figure>
          <figure><img src="../images/works/illust/original/bloody-back.webp" alt="Fond seul"><figcaption>Fond seul</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en mars 2023</p>
        <p class="illu-desc">Commande réalisée pour une illustration destinée à un MV de cover musical. Comprend des variantes d'expression.</p>
        <p class="illu-desc">Le nom de l'interprète et le lien de la vidéo ne sont pas indiqués par respect des droits.</p>
      </div>`,
    },
    illust_nonokawai: {
      title: '【お仕事絵】可愛くてごめん/高梨のの(cover)',
      titleEn: '[Commission] Kawaikute Gomen (cover by Takanashi Nono)',
      subtitle: 'Thumbnail / Portrait painting',
      html: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/nonokawai.webp" alt="メイン"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/nonokawai1.webp" alt="差分１"><figcaption>差分１</figcaption></figure>
          <figure><img src="../images/works/illust/original/nonokawai2.webp" alt="差分２"><figcaption>差分２</figcaption></figure>
          <figure><img src="../images/works/illust/original/nonokawai3.webp" alt="差分３"><figcaption>差分３</figcaption></figure>
          <figure><img src="../images/works/illust/original/nonokawai4.webp" alt="差分４"><figcaption>差分４</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">2023年 2月 制作</p>
        <p class="illu-desc">高梨のの様（<a class="illu-handle" href="https://x.com/TAKANASHInono" target="_blank" rel="noopener">@TAKANASHInono</a>）よりサムネイル画像作成の依頼をいただき、描かせていただきました。HoneyWorks様の「可愛くてごめん」歌ってみた動画用のサムネイルイラストです。本家タイトル作成・差分作成ありの案件です。</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=SCSWWhqsmQI" target="_blank" rel="noopener">実際に使用された動画を見る</a></p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/nonokawai.webp" alt="Main"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/nonokawai1.webp" alt="Variant 1"><figcaption>Variant 1</figcaption></figure>
          <figure><img src="../images/works/illust/original/nonokawai2.webp" alt="Variant 2"><figcaption>Variant 2</figcaption></figure>
          <figure><img src="../images/works/illust/original/nonokawai3.webp" alt="Variant 3"><figcaption>Variant 3</figcaption></figure>
          <figure><img src="../images/works/illust/original/nonokawai4.webp" alt="Variant 4"><figcaption>Variant 4</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created February 2023</p>
        <p class="illu-desc">Commissioned by Takanashi Nono (<a class="illu-handle" href="https://x.com/TAKANASHInono" target="_blank" rel="noopener">@TAKANASHInono</a>) for a thumbnail for their "Kawaikute Gomen" (by HoneyWorks) cover video. Includes original title logo and expression variants.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=SCSWWhqsmQI" target="_blank" rel="noopener">Watch the video</a></p>
      </div>`,
      titleFr: '[Commande] Kawaikute Gomen (cover de Takanashi Nono)',
      htmlFr: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/nonokawai.webp" alt="Principal"><figcaption class="illu-cap">sample（50%）</figcaption></figure>
          <figure><img src="../images/works/illust/original/nonokawai1.webp" alt="Variante 1"><figcaption>Variante 1</figcaption></figure>
          <figure><img src="../images/works/illust/original/nonokawai2.webp" alt="Variante 2"><figcaption>Variante 2</figcaption></figure>
          <figure><img src="../images/works/illust/original/nonokawai3.webp" alt="Variante 3"><figcaption>Variante 3</figcaption></figure>
          <figure><img src="../images/works/illust/original/nonokawai4.webp" alt="Variante 4"><figcaption>Variante 4</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en février 2023</p>
        <p class="illu-desc">Commande réalisée pour Takanashi Nono (<a class="illu-handle" href="https://x.com/TAKANASHInono" target="_blank" rel="noopener">@TAKANASHInono</a>) : une miniature pour son cover vidéo de « Kawaikute Gomen » (HoneyWorks). Comprend la création du logo du titre et des variantes d'expression.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=SCSWWhqsmQI" target="_blank" rel="noopener">Voir la vidéo</a></p>
      </div>`,
    },
    illust_chibi: {
      title: 'ちびキャラまとめ',
      titleEn: 'Chibi Character Collection',
      subtitle: 'Illustration / Portrait painting',
      html: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/chibi1.webp" alt="自分のキャラ"><figcaption>自分のキャラ</figcaption></figure>
          <figure><img src="../images/works/illust/original/chibi2.webp" alt="山崎スイのちびキャラ壁紙"><figcaption>山崎スイのちびキャラ壁紙</figcaption></figure>
          <figure><img src="../images/works/illust/original/chibi3.webp" alt="ちびキャラ企画１"><figcaption>ちびキャラ企画１</figcaption></figure>
          <figure><img src="../images/works/illust/original/chibi4.webp" alt="ちびキャラ企画２"><figcaption>ちびキャラ企画２</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">今までの制作</p>
        <p class="illu-desc">今までのちびキャラまとめです。たまにちびキャラとか何かしら無料企画やりますのでよかったらXをフォローしてたまに覗いて来てください。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/chibi1.webp" alt="My character"><figcaption>My character</figcaption></figure>
          <figure><img src="../images/works/illust/original/chibi2.webp" alt="Yamazaki Sui chibi wallpaper"><figcaption>Yamazaki Sui chibi wallpaper</figcaption></figure>
          <figure><img src="../images/works/illust/original/chibi3.webp" alt="Chibi event 1"><figcaption>Chibi event 1</figcaption></figure>
          <figure><img src="../images/works/illust/original/chibi4.webp" alt="Chibi event 2"><figcaption>Chibi event 2</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Various past works</p>
        <p class="illu-desc">A collection of chibi characters I've drawn over the years. I occasionally run free events on X — feel free to follow and check in!</p>
      </div>`,
      titleFr: 'Recueil de personnages chibi',
      htmlFr: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/chibi1.webp" alt="Mon personnage"><figcaption>Mon personnage</figcaption></figure>
          <figure><img src="../images/works/illust/original/chibi2.webp" alt="Fond d'écran chibi de Yamazaki Sui"><figcaption>Fond d'écran chibi de Yamazaki Sui</figcaption></figure>
          <figure><img src="../images/works/illust/original/chibi3.webp" alt="Événement chibi 1"><figcaption>Événement chibi 1</figcaption></figure>
          <figure><img src="../images/works/illust/original/chibi4.webp" alt="Événement chibi 2"><figcaption>Événement chibi 2</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Œuvres passées</p>
        <p class="illu-desc">Un recueil de personnages chibi réalisés au fil des années. J'organise de temps en temps des événements gratuits sur X — n'hésitez pas à me suivre et à jeter un œil de temps à autre !</p>
      </div>`,
    },
    illust_chiikawaii: {
      title: '【お仕事絵】可愛くてごめん(cover by ちぃ)',
      titleEn: '[Commission] Kawaikute Gomen (cover by Chii)',
      subtitle: 'Thumbnail / Portrait painting',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/chiikawaii.webp" alt="可愛くてごめん"><figcaption class="illu-cap">sample（40%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2022年 12月 制作</p>
        <p class="illu-desc">ちぃ様（<a class="illu-handle" href="https://x.com/chii1402" target="_blank" rel="noopener">@chii1402</a>）よりサムネイル画像作成の依頼をいただき、描かせていただきました。HoneyWorks様の「可愛くてごめん」歌ってみた動画用のサムネイルイラストです。本家タイトル作成ありの案件です。</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=abT7wIAYHxk" target="_blank" rel="noopener">実際に使用された動画を見る</a></p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/chiikawaii.webp" alt="Kawaikute Gomen"><figcaption class="illu-cap">sample（40%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created December 2022</p>
        <p class="illu-desc">Commissioned by Chii (<a class="illu-handle" href="https://x.com/chii1402" target="_blank" rel="noopener">@chii1402</a>) for a thumbnail for their "Kawaikute Gomen" (by HoneyWorks) cover video. Includes original title logo creation.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=abT7wIAYHxk" target="_blank" rel="noopener">Watch the video</a></p>
      </div>`,
      titleFr: '[Commande] Kawaikute Gomen (cover de Chii)',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/chiikawaii.webp" alt="Kawaikute Gomen"><figcaption class="illu-cap">sample（40%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en décembre 2022</p>
        <p class="illu-desc">Commande réalisée pour Chii (<a class="illu-handle" href="https://x.com/chii1402" target="_blank" rel="noopener">@chii1402</a>) : une miniature pour son cover vidéo de « Kawaikute Gomen » (HoneyWorks). Comprend la création du logo du titre.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=abT7wIAYHxk" target="_blank" rel="noopener">Voir la vidéo</a></p>
      </div>`,
    },
    illust_myselfheader: {
      title: '自分用のXヘッダーイラスト',
      titleEn: 'Personal X Header Illustration',
      subtitle: 'Header / Still illustration / Portrait painting',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/myselfheader.webp" alt="Xヘッダーイラスト"><figcaption class="illu-cap">原寸</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2022年 1月 制作</p>
        <p class="illu-desc">自分の固定キャラで自分用Xヘッダーとして制作したイラスト。スイーツやピンク自分の大好きを詰め込んでいます。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/myselfheader.webp" alt="X Header Illustration"><figcaption class="illu-cap">original size</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created January 2022</p>
        <p class="illu-desc">A header illustration for my own X profile, featuring my signature character. Packed with my favorite things: sweets and the color pink.</p>
      </div>`,
      titleFr: 'Bannière X personnelle',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/myselfheader.webp" alt="Bannière X"><figcaption class="illu-cap">taille réelle</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en janvier 2022</p>
        <p class="illu-desc">Une bannière pour mon propre profil X, mettant en scène mon personnage emblématique. Remplie de mes choses préférées : les sucreries et la couleur rose.</p>
      </div>`,
    },
    illust_sayu: {
      title: '【お仕事絵】オリジナル楽曲イメージイラスト',
      titleEn: '[Commission] Original Song Image Illustration',
      subtitle: 'Thumbnail / MV / Still illustration',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/sayu.webp" alt="オリジナル楽曲イメージイラスト"><figcaption class="illu-cap">sample（40%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2021年 11月 制作</p>
        <p class="illu-desc">オリジナル楽曲のイメージイラストおよびMV制作のご依頼をいただき、制作しました。表情差分、背景描き込み、PV用特殊演出を含みます。</p>
        <p class="illu-desc">※ 楽曲非公開のため、楽曲名および関連リンクの掲載は控えています。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/sayu.webp" alt="Original Song Image Illustration"><figcaption class="illu-cap">sample（40%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created November 2021</p>
        <p class="illu-desc">Commissioned for an image illustration and MV for an original song. Includes facial expression variants, detailed background artwork, and special visual effects for the PV.</p>
        <p class="illu-desc">※ The song has not been released publicly, so the title and related links are withheld.</p>
      </div>`,
      titleFr: '[Commande] Illustration pour chanson originale',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/sayu.webp" alt="Illustration pour chanson originale"><figcaption class="illu-cap">sample（40%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en novembre 2021</p>
        <p class="illu-desc">Commande réalisée pour une illustration d'image et un MV pour une chanson originale. Comprend des variantes d'expression, un fond détaillé et des effets visuels spéciaux pour le PV.</p>
        <p class="illu-desc">※ La chanson n'étant pas publiée, son titre et les liens associés ne sont pas indiqués.</p>
      </div>`,
    },
    illust_melon: {
      title: '【お仕事絵】オリジナル楽曲イメージイラスト',
      titleEn: '[Commission] Original Song Image Illustration',
      subtitle: 'Thumbnail / Still illustration',
      html: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/骸骨ｘ人物ｘ背景.webp" alt="骸骨ｘ人物ｘ背景"><figcaption>骸骨×人物×背景 sample(40%)</figcaption></figure>
          <figure><img src="../images/works/illust/original/死骸ｘ人物ｘ背景.webp" alt="死骸ｘ人物ｘ背景"><figcaption>死骸×人物×背景 sample(40%)</figcaption></figure>
          <figure><img src="../images/works/illust/original/骸骨ｘ背景.webp" alt="骸骨ｘ背景"><figcaption>骸骨×背景 sample(40%)</figcaption></figure>
          <figure><img src="../images/works/illust/original/死骸ｘ背景.webp" alt="死骸ｘ背景"><figcaption>死骸×背景 sample(40%)</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">2021年 11月 制作</p>
        <p class="illu-desc">オリジナル楽曲のイメージイラストのご依頼をいただき、制作しました。表情差分、背景描き込み、PV用特殊演出を含みます。</p>
        <p class="illu-desc">※ 楽曲非公開のため、楽曲名および関連リンクの掲載は控えています。</p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/骸骨ｘ人物ｘ背景.webp" alt="Skull x character x bg"><figcaption>Skull × character × bg sample(40%)</figcaption></figure>
          <figure><img src="../images/works/illust/original/死骸ｘ人物ｘ背景.webp" alt="Corpse x character x bg"><figcaption>Corpse × character × bg sample(40%)</figcaption></figure>
          <figure><img src="../images/works/illust/original/骸骨ｘ背景.webp" alt="Skull x bg"><figcaption>Skull × bg sample(40%)</figcaption></figure>
          <figure><img src="../images/works/illust/original/死骸ｘ背景.webp" alt="Corpse x bg"><figcaption>Corpse × bg sample(40%)</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created November 2021</p>
        <p class="illu-desc">Commissioned for an image illustration for an original song. Includes facial expression variants, detailed background artwork, and special visual effects for the PV.</p>
        <p class="illu-desc">※ The song has not been released publicly, so the title and related links are withheld.</p>
      </div>`,
      titleFr: '[Commande] Illustration pour chanson originale',
      htmlFr: `<div class="mwork mwork--illu">
        <div class="illu-variants">
          <figure><img src="../images/works/illust/original/骸骨ｘ人物ｘ背景.webp" alt="Crâne x personnage x fond"><figcaption>Crâne × personnage × fond sample(40%)</figcaption></figure>
          <figure><img src="../images/works/illust/original/死骸ｘ人物ｘ背景.webp" alt="Cadavre x personnage x fond"><figcaption>Cadavre × personnage × fond sample(40%)</figcaption></figure>
          <figure><img src="../images/works/illust/original/骸骨ｘ背景.webp" alt="Crâne x fond"><figcaption>Crâne × fond sample(40%)</figcaption></figure>
          <figure><img src="../images/works/illust/original/死骸ｘ背景.webp" alt="Cadavre x fond"><figcaption>Cadavre × fond sample(40%)</figcaption></figure>
        </div>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en novembre 2021</p>
        <p class="illu-desc">Commande réalisée pour une illustration d'image pour une chanson originale. Comprend des variantes d'expression, un fond détaillé et des effets visuels spéciaux pour le PV.</p>
        <p class="illu-desc">※ La chanson n'étant pas publiée, son titre et les liens associés ne sont pas indiqués.</p>
      </div>`,
    },
    illust_rabuka: {
      title: '【お仕事絵】ラブカ？(cover by 惑星のパンくん)',
      titleEn: '[Commission] Rabuka? (cover by Wakusei no Pankun)',
      subtitle: 'Thumbnail / Portrait painting',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/rabuka.webp" alt="ラブカ？"><figcaption class="illu-cap">sample（60%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2021年 4月 制作</p>
        <p class="illu-desc">惑星のパンくん様（<a class="illu-handle" href="https://x.com/chimpanzeevoice" target="_blank" rel="noopener">@chimpanzeevoice</a>）より、サムネイル画像作成の依頼をいただき、描かせていただきました。柊キライ様の「ラブカ？」歌ってみた動画用のサムネイルイラストです。</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=srwVDj8pPdk" target="_blank" rel="noopener">実際に使用された動画を見る</a></p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/rabuka.webp" alt="Rabuka?"><figcaption class="illu-cap">sample（60%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created April 2021</p>
        <p class="illu-desc">Commissioned by Wakusei no Pankun (<a class="illu-handle" href="https://x.com/chimpanzeevoice" target="_blank" rel="noopener">@chimpanzeevoice</a>) for a thumbnail for their "Rabuka?" (by Hiiragi Kirai) cover video.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=srwVDj8pPdk" target="_blank" rel="noopener">Watch the video</a></p>
      </div>`,
      titleFr: '[Commande] Rabuka? (cover de Wakusei no Pankun)',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/rabuka.webp" alt="Rabuka?"><figcaption class="illu-cap">sample（60%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en avril 2021</p>
        <p class="illu-desc">Commande réalisée pour Wakusei no Pankun (<a class="illu-handle" href="https://x.com/chimpanzeevoice" target="_blank" rel="noopener">@chimpanzeevoice</a>) : une miniature pour son cover vidéo de « Rabuka? » (Hiiragi Kirai).</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=srwVDj8pPdk" target="_blank" rel="noopener">Voir la vidéo</a></p>
      </div>`,
    },
    illust_ready: {
      title: '【お仕事絵】レディメイド(cover by 惑星のパンくん)',
      titleEn: '[Commission] Ready Made (cover by Wakusei no Pankun)',
      subtitle: 'Thumbnail / Portrait painting',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/ready.webp" alt="レディメイド"><figcaption class="illu-cap">sample（60%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2021年 4月 制作</p>
        <p class="illu-desc">惑星のパンくん様（<a class="illu-handle" href="https://x.com/chimpanzeevoice" target="_blank" rel="noopener">@chimpanzeevoice</a>）より、サムネイル画像作成の依頼をいただき、描かせていただきました。すりぃ様の「レディメイド」歌ってみた動画用のサムネイルイラストです。</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=P52wOB_FQLM" target="_blank" rel="noopener">実際に使用された動画を見る</a></p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/ready.webp" alt="Ready Made"><figcaption class="illu-cap">sample（60%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created April 2021</p>
        <p class="illu-desc">Commissioned by Wakusei no Pankun (<a class="illu-handle" href="https://x.com/chimpanzeevoice" target="_blank" rel="noopener">@chimpanzeevoice</a>) for a thumbnail for their "Ready Made" (by Surii) cover video.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=P52wOB_FQLM" target="_blank" rel="noopener">Watch the video</a></p>
      </div>`,
      titleFr: '[Commande] Ready Made (cover de Wakusei no Pankun)',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/ready.webp" alt="Ready Made"><figcaption class="illu-cap">sample（60%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en avril 2021</p>
        <p class="illu-desc">Commande réalisée pour Wakusei no Pankun (<a class="illu-handle" href="https://x.com/chimpanzeevoice" target="_blank" rel="noopener">@chimpanzeevoice</a>) : une miniature pour son cover vidéo de « Ready Made » (Surii).</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=P52wOB_FQLM" target="_blank" rel="noopener">Voir la vidéo</a></p>
      </div>`,
    },
    illust_ussewa: {
      title: '【お仕事絵】うっせぇわ(cover by 惑星のパンくん)',
      titleEn: '[Commission] Usseewa (cover by Wakusei no Pankun)',
      subtitle: 'Thumbnail / Portrait painting',
      html: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/ussewa.webp" alt="うっせぇわ"><figcaption class="illu-cap">sample（60%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">2021年 2月 制作</p>
        <p class="illu-desc">惑星のパンくん様（<a class="illu-handle" href="https://x.com/chimpanzeevoice" target="_blank" rel="noopener">@chimpanzeevoice</a>）より、サムネイル画像作成の依頼をいただき、描かせていただきました。syudou様の「うっせぇわ」歌ってみた動画用のサムネイルイラストです。</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=RFQ8NXTRxiw" target="_blank" rel="noopener">実際に使用された動画を見る</a></p>
      </div>`,
      htmlEn: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/ussewa.webp" alt="Usseewa"><figcaption class="illu-cap">sample（60%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Created February 2021</p>
        <p class="illu-desc">Commissioned by Wakusei no Pankun (<a class="illu-handle" href="https://x.com/chimpanzeevoice" target="_blank" rel="noopener">@chimpanzeevoice</a>) for a thumbnail for their "Usseewa" (by Syudou) cover video.</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=RFQ8NXTRxiw" target="_blank" rel="noopener">Watch the video</a></p>
      </div>`,
      titleFr: '[Commande] Usseewa (cover de Wakusei no Pankun)',
      htmlFr: `<div class="mwork mwork--illu">
        <figure class="illu-main"><img src="../images/works/illust/original/ussewa.webp" alt="Usseewa"><figcaption class="illu-cap">sample（60%）</figcaption></figure>
        <div class="mwork__divider"></div>
        <p class="illu-date">Créé en février 2021</p>
        <p class="illu-desc">Commande réalisée pour Wakusei no Pankun (<a class="illu-handle" href="https://x.com/chimpanzeevoice" target="_blank" rel="noopener">@chimpanzeevoice</a>) : une miniature pour son cover vidéo de « Usseewa » (Syudou).</p>
        <p class="illu-link">▶ <a href="https://www.youtube.com/watch?v=RFQ8NXTRxiw" target="_blank" rel="noopener">Voir la vidéo</a></p>
      </div>`,
    },
  };

  /* 矢印カルーセル初期化 */
  function initCarousels(container) {
    container.querySelectorAll('.illu-variants').forEach(variants => {
      const figures = [...variants.querySelectorAll('figure')];
      if (figures.length <= 1) return;

      /* figure をトラックにまとめる */
      const track = document.createElement('div');
      track.className = 'illu-carousel-track';
      figures.forEach(f => track.appendChild(f));
      variants.appendChild(track);

      /* 前後ボタン */
      const prev = document.createElement('button');
      const next = document.createElement('button');
      prev.className = 'illu-carousel-btn illu-carousel-prev';
      next.className = 'illu-carousel-btn illu-carousel-next';
      prev.textContent = '‹';
      next.textContent = '›';
      variants.appendChild(prev);
      variants.appendChild(next);

      /* ドット */
      const dotsWrap = document.createElement('div');
      dotsWrap.className = 'illu-carousel-dots';
      const dots = figures.map((_, i) => {
        const d = document.createElement('button');
        d.className = 'illu-carousel-dot' + (i === 0 ? ' is-active' : '');
        dotsWrap.appendChild(d);
        return d;
      });
      variants.after(dotsWrap);

      let cur = 0;
      const go = n => {
        cur = (n + figures.length) % figures.length;
        track.style.transform = `translateX(${-cur * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('is-active', i === cur));
      };

      prev.addEventListener('click', () => go(cur - 1));
      next.addEventListener('click', () => go(cur + 1));
      dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
    });
  }

  /* ワークモーダル制御 */
  const workModal = document.getElementById('work-modal');
  const wmClose   = document.getElementById('wm-close');
  let currentLang     = 'ja';
  let currentModalKey = null;

  const openWorkModal = (key, originEl = null) => {
    const data = WORK_MODAL_DATA[key];
    if (!data) return;
    currentModalKey = key;
    const titleKey = currentLang === 'fr' ? 'titleFr' : currentLang === 'en' ? 'titleEn' : null;
    const htmlKey  = currentLang === 'fr' ? 'htmlFr'  : currentLang === 'en' ? 'htmlEn'  : null;
    document.getElementById('wm-title').textContent    = (titleKey && data[titleKey]) ? data[titleKey] : data.title;
    document.getElementById('wm-subtitle').textContent = data.subtitle;
    document.getElementById('wm-body').innerHTML       = (htmlKey && data[htmlKey])  ? data[htmlKey]  : data.html;

    /* クリックしたカードの中心を transform-origin に設定 */
    const wmBox = workModal.querySelector('.wm-box');
    if (originEl) {
      const r = originEl.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;
      const bw = wmBox.offsetWidth  || Math.min(700, window.innerWidth  * 0.92);
      const bh = wmBox.offsetHeight || window.innerHeight * 0.6;
      const vx = window.innerWidth  / 2;
      const vy = window.innerHeight / 2;
      const ox = (50 + (cx - vx) / bw * 100).toFixed(1) + '%';
      const oy = (50 + (cy - vy) / bh * 100).toFixed(1) + '%';
      wmBox.style.transformOrigin = `${ox} ${oy}`;
    } else {
      wmBox.style.transformOrigin = '50% 50%';
    }
    /* アニメーションを毎回リセット */
    wmBox.style.animation = 'none';
    wmBox.offsetHeight; /* reflow */
    wmBox.style.animation = '';

    workModal.classList.add('is-open');
    initCarousels(document.getElementById('wm-body'));
  };
  const closeWorkModal = () => { workModal.classList.remove('is-open'); currentModalKey = null; };

  /* 公開日前はロック、公開後は正式タイトルへ自動切り替え */
  document.querySelectorAll('.work-card[data-unlock]').forEach(card => {
    const today  = new Date(); today.setHours(0, 0, 0, 0);
    const unlock = new Date(card.dataset.unlock); unlock.setHours(0, 0, 0, 0);
    if (today < unlock) {
      card.classList.add('work-card--locked');
      const thumb = card.querySelector('.work-thumb');
      if (thumb) {
        const overlay = document.createElement('div');
        overlay.className = 'locked-overlay';
        overlay.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="white" fill-rule="evenodd" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8.9 8V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H8.9z"/>
          <circle cx="12" cy="14.5" r="2.2" fill="black"/>
          <rect x="11.1" y="15.8" width="1.8" height="3.8" rx="0.4" fill="black"/>
        </svg><span>近日公開</span>`;
        thumb.appendChild(overlay);
      }
    } else if (card.dataset.realTitleJa) {
      card.dataset.titleJa = card.dataset.realTitleJa;
      if (card.dataset.realTitleEn) card.dataset.titleEn = card.dataset.realTitleEn;
      if (card.dataset.realTitleFr) card.dataset.titleFr = card.dataset.realTitleFr;
      const titleEl = card.querySelector('.work-title');
      if (titleEl) titleEl.textContent = card.dataset.realTitleJa.replace(/【[^】]*】/g, '').trim();
    }
  });

  document.querySelectorAll('.work-card[data-modal]').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      if (card.classList.contains('work-card--locked')) return;
      openWorkModal(card.dataset.modal, card);
    });
  });

  /* モーダル内の関連作品リンク（同じクライアントの別納品物へ移動） */
  document.getElementById('wm-body').addEventListener('click', e => {
    const jump = e.target.closest('[data-modal-jump]');
    if (!jump) return;
    e.preventDefault();
    openWorkModal(jump.dataset.modalJump);
  });

  wmClose.addEventListener('click', closeWorkModal);
  workModal.addEventListener('click', e => { if (e.target === workModal) closeWorkModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeWorkModal(); });

  /* === JP/EN 切り替え === */
  const i18n = {
    ja: {
      pageTitle:         'Illustration Works | ぐるにゃ',
      title:             'Works',
      contact:           'Contact',
      simulator:         '料金シミュレーター',
      preRequest:        'ご依頼する前のお願い',
      sortNew:           '新しい順',
      sortOld:           '古い順',
      tabIllust:         'イラスト',
      tabLogo:           'ロゴ',
      tabSchedule:       '配信関連',
      /* 受注状況バナー。日付を変えるときは illust/index.html の初期表示も同じ内容に直すこと */
      statusBadge:       '📋 受注状況',
      statusIllust:      '<span class="status-bar__label">イラスト：</span><strong>10月上旬</strong>着手、<strong>10月中下旬以降</strong>納品可能',
      statusDesign:      '<span class="status-bar__label">デザイン：</span><strong>10月上旬</strong>着手、<strong>10月中旬以降</strong>納品可能',
      statusNote:        'お急ぎの場合は短縮納期・最短納期も承ります。',
      /* サイドバーのAbout。段落は <br> で区切る（data-i18n-html で差し込む） */
      aboutTitle:        'About',
      aboutLead:         '2026年3月より、兼業から専業のフリーランスイラストレーターとして活動しています。<br>「こういう雰囲気にしたい」という、まだ言葉になりきらない段階からご一緒するのが好きで、ご本人でも言い表せていなかった部分まで拾って描くよう心がけています。<br>VTuber様向けのイラストを中心に、立ち絵と表情差分からLive2D向けのパーツ分け、待機画面・サムネイル・ロゴなどのデザインや動画編集・オリジナルPV制作まで、配信画面に映るものはひと通りお任せいただけます。',
      aboutToolsLabel:   '制作ツール',
      aboutEnvLabel:     '作業環境',
      /* ページ内インデックスと各セクションの見出し。
         インデックスは3つとも5文字に揃えて、付箋の幅がバラバラにならないようにする */
      idxWork:           'お作業実績',
      idxReview:         'おレビュー',
      idxRequest:        'ご依頼方法',
      secWork:           'Work',
      secReview:         'レビュー',
      secRequest:        'ご依頼の流れ',
      secReviewNote:     '（お客様からいただいたお声がここに入ります）',
      reviewLead:        "ココナラやつなぐなどでいただいたレビューより抜粋",
      reqTabIllust:      "イラスト",
      reqTabLogo:        "ネームロゴ",
      reqTabStream:      "配信関連デザイン",
      secRequestNote:    '（ご依頼の流れ・条件・注意事項がここに入ります）',
      filterAll:         'すべて',
      filterOverlay:     'オーバーレイ',
      filterBg:          '配信背景',
      filterSchedule:    'スケジュール表',
      filterThumb:       'サムネイル',
      filterProfile:     'プロフィールカード',
      'canDo.icon':      'アイコン',
      'canDo.header':    'ヘッダー',
      'canDo.thumbnail': 'サムネイル',
      'canDo.still':     '一枚絵',
      'canDo.standing':  '立ち絵',
      'canDo.animated':  '動くイラスト',
      'canDo.goods':     'グッズイラスト',
    },
    en: {
      pageTitle:         'Illustration Works | Gurunya',
      title:             'Works',
      contact:           'Contact',
      simulator:         'Price Simulator',
      preRequest:        'Before You Request',
      sortNew:           'Newest',
      sortOld:           'Oldest',
      tabIllust:         'Illustration',
      tabLogo:           'Logo',
      tabSchedule:       'Streaming',
      statusBadge:       '📋 Availability',
      statusIllust:      '<span class="status-bar__label">Illustration:</span> starts <strong>early Oct.</strong>, delivery <strong>mid–late Oct.</strong>',
      statusDesign:      '<span class="status-bar__label">Design:</span> starts <strong>early Oct.</strong>, delivery <strong>from mid-Oct.</strong>',
      statusNote:        'Rush and express turnaround available on request.',
      aboutTitle:        'About',
      aboutLead:         'Since March 2026 I have worked full time as a freelance illustrator.<br>I like joining a project while the idea is still taking shape, and I try to draw even the parts you may not have been able to put into words yourself.<br>My work centers on illustration for VTubers: from character art and expression variants to artwork separated into parts for Live2D, design work such as standby screens, thumbnails and logos, video editing and original music videos — everything that appears on the stream itself.',
      aboutToolsLabel:   'Tools',
      aboutEnvLabel:     'Setup',
      idxWork:           'Work',
      idxReview:         'Review',
      idxRequest:        'How to Order',
      secWork:           'Work',
      secReview:         'Review',
      secRequest:        'How to Order',
      secReviewNote:     '(Client feedback goes here)',
      reviewLead:        "Selected reviews received on Coconala, Tsunagu and elsewhere",
      reqTabIllust:      "Illustration",
      reqTabLogo:        "Name logo",
      reqTabStream:      "Stream design",
      secRequestNote:    '(The ordering process, terms and notes go here)',
      filterAll:         'All',
      filterOverlay:     'Overlay',
      filterBg:          'Stream Background',
      filterSchedule:    'Schedule',
      filterThumb:       'Thumbnail',
      filterProfile:     'Profile Card',
      'canDo.icon':      'Icon',
      'canDo.header':    'Header',
      'canDo.thumbnail': 'Thumbnail',
      'canDo.still':     'Illustration',
      'canDo.standing':  'Standing Art',
      'canDo.animated':  'Animated Art',
      'canDo.goods':     'Goods Illustration',
    },
    fr: {
      pageTitle:         'Illustration Works | Gurunya',
      title:             'Works',
      contact:           'Contact',
      simulator:         'Simulateur de tarifs',
      preRequest:        'Avant de faire une demande',
      sortNew:           'Plus récent',
      sortOld:           'Plus ancien',
      tabIllust:         'Illustration',
      tabLogo:           'Logo',
      tabSchedule:       'Diffusion',
      statusBadge:       '📋 Disponibilité',
      statusIllust:      "<span class=\"status-bar__label\">Illustration :</span> début <strong>oct.</strong>, livraison <strong>mi–fin oct.</strong>",
      statusDesign:      "<span class=\"status-bar__label\">Design :</span> début <strong>oct.</strong>, livraison <strong>dès mi-oct.</strong>",
      statusNote:        'Délais raccourcis ou express possibles sur demande.',
      aboutTitle:        'À propos',
      aboutLead:         "Depuis mars 2026, je travaille à plein temps comme illustratrice indépendante.<br>J'aime accompagner un projet dès le stade où l'idée n'est pas encore mise en mots, et je m'efforce de dessiner jusqu'aux détails que vous n'auriez pas su formuler vous-même.<br>Mon travail est centré sur l'illustration pour les VTubers : des illustrations de personnage et variantes d'expression au découpage en parties pour Live2D, en passant par le design d'écrans d'attente, de miniatures et de logos, le montage vidéo et la réalisation de clips originaux — tout ce qui apparaît à l'écran pendant un stream.",
      aboutToolsLabel:   'Outils',
      aboutEnvLabel:     'Environnement',
      idxWork:           'Work',
      idxReview:         'Avis',
      idxRequest:        'Comment commander',
      secWork:           'Work',
      secReview:         'Avis',
      secRequest:        'Comment commander',
      secReviewNote:     '(Les retours des clients viendront ici)',
      reviewLead:        "Sélection d'avis reçus sur Coconala, Tsunagu et ailleurs",
      reqTabIllust:      "Illustration",
      reqTabLogo:        "Logo de nom",
      reqTabStream:      "Design pour stream",
      secRequestNote:    '(Le déroulement de la commande, les conditions et les remarques viendront ici)',
      filterAll:         'Tout',
      filterOverlay:     'Overlay',
      filterBg:          'Arrière-plan',
      filterSchedule:    'Planning',
      filterThumb:       'Miniature',
      filterProfile:     'Carte de profil',
      'canDo.icon':      'Icône',
      'canDo.header':    'Bannière',
      'canDo.thumbnail': 'Miniature',
      'canDo.still':     'Illustration',
      'canDo.standing':  'Personnage debout',
      'canDo.animated':  'Illustration animée',
      'canDo.goods':     'Illustration produits dérivés',
    },
  };

  /* alt・aria-label・title のように、テキストではなく属性なので
     data-i18nでは切り替えられないものを言語ごとに差し替える
     画面には出ないが、読み上げソフトや画像が表示できないときに読まれるため、
     日本語のままにせず3言語そろえる
       data-alt-ja  / data-alt-en  / data-alt-fr   → alt
       data-aria-ja / data-aria-en / data-aria-fr  → aria-label
       data-tip-ja  / data-tip-en  / data-tip-fr   → title（マウスを乗せたときの吹き出し） */
  function applyLangAttrs(root, lang) {
    const pick = (ds, key) =>
      lang === 'ja' ? ds[key + 'Ja']
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

  /* === おレビュー ===
     ココナラ・つなぐでいただいた評価。
     規約と転載のことがあるので、本文は原文そのままではなく言い回しを変えたもの、
     お名前は頭文字だけにしてある（数字だけのお名前は「匿名様」に寄せた）。
     s=星の数 / c=カテゴリ / n=お名前 / t=本文。配列は [日本語, 英語, フランス語] の順。 */
  const REVIEWS = [
    { s:5, c:['立ち絵','Character art','Illustration de personnage'], n:['N様','N','N'],
      t:['IRIAM用の立ち絵をお願いしました。仕上がりの完成度はもちろん、こちらの意見をしっかり聞いてくださって助かりました。',
         'I ordered character art for IRIAM. The finished quality was excellent, and they listened carefully to what I had to say, which was a great help.',
         "J'ai commandé une illustration de personnage pour IRIAM. La qualité du résultat était au rendez-vous, et mes remarques ont été écoutées avec attention, ce qui m'a beaucoup aidé."] },
    { s:5, c:['MV制作','Music video','Clip musical'], n:['K様','K','K'],
      t:['今回もいつもどおり良いものを作っていただき、とても助かりました！',
         'Once again they made something great, just as always. It was a big help!',
         "Comme toujours, le résultat était excellent. Cela m'a beaucoup aidé !"] },
    { s:5, c:['立ち絵','Character art','Illustration de personnage'], n:['R様','R','R'],
      t:['タッチがとても細やかで、大満足しています。',
         'The linework is wonderfully detailed. I am completely satisfied.',
         "Le trait est d'une grande finesse. Je suis pleinement satisfait."] },
    { s:5, c:['立ち絵','Character art','Illustration de personnage'], n:['匿名様','Anonymous','Anonyme'],
      t:['とても素敵なイラストを描いていただきました！',
         'They drew a truly lovely illustration for me!',
         'Une illustration vraiment magnifique !'] },
    { s:5, c:['立ち絵','Character art','Illustration de personnage'], n:['匿名様','Anonymous','Anonyme'],
      t:['IRIAMで使う立ち絵をお願いしました。仕上がりは本当に満足のいくもので、素晴らしいの一言です。制作中のやり取りも丁寧で、初めての依頼でしたがとても話しやすかったです。またお願いしたいと思える方でした。',
         'I ordered character art to use on IRIAM. The result was genuinely satisfying — wonderful is the only word for it. Communication during the work was careful too, and although it was my first commission, they were very easy to talk to. Someone I would gladly order from again.',
         "J'ai commandé une illustration de personnage pour IRIAM. Le résultat est vraiment satisfaisant, tout simplement magnifique. Les échanges pendant la réalisation étaient attentionnés et, bien que ce fût ma première commande, la conversation a été très facile. Quelqu'un à qui je ferais de nouveau appel avec plaisir."] },
    { s:5, c:['配信OP・ED・待機画面','Stream OP, ED & standby screen',"Génériques et écran d'attente"], n:['N様','N','N'],
      t:['丁寧かつ迅速に対応していただきました。依頼時のやり取りもスムーズで、説明の足りない部分まで汲み取っていただけて大変助かりました。また依頼したいと思います。',
         'Careful and quick from start to finish. The exchanges when placing the order went smoothly, and they picked up on the parts I had not explained well, which helped enormously. I would like to order again.',
         "Un travail soigné et rapide. Les échanges au moment de la commande ont été fluides, et les points que j'avais mal expliqués ont été compris malgré tout, ce qui m'a beaucoup aidé. Je recommanderai."] },
    { s:5, c:['立ち絵','Character art','Illustration de personnage'], n:['匿名様','Anonymous','Anonyme'],
      t:['細部まで要望に応えてくださり、丁寧なお取引でした。本当に感謝しかありません。',
         'They met my requests down to the smallest detail, and the whole exchange was courteous. I am truly grateful.',
         "Mes demandes ont été satisfaites jusque dans les moindres détails, et l'ensemble de l'échange a été courtois. Je ne peux qu'exprimer ma gratitude."] },
    { s:5, c:['立ち絵','Character art','Illustration de personnage'], n:['匿名様','Anonymous','Anonyme'],
      t:['納品も早く、対応もとても良く親切にしていただきました。またお願いすると思います。',
         'Delivery was fast and the service was attentive and kind. I expect I will order again.',
         'La livraison a été rapide et le suivi attentionné et aimable. Je pense refaire appel à ses services.'] },
    { s:5, c:['イラスト','Illustration','Illustration'], n:['K様','K','K'],
      t:['毎回丁寧に対応してくださり、すごく助かっています。',
         'Every single time the work is careful. It helps me a great deal.',
         "À chaque fois, le travail est soigné. Cela m'aide énormément."] },
    { s:5, c:['SNSアイコン・ヘッダー','Social icon & header','Icône et bannière'], n:['K様','K','K'],
      t:['一つひとつ丁寧に作っていただきました。自分の中ではめちゃくちゃ大満足で、依頼して大正解だったと思っています。',
         'Every piece was made with care. I am extremely happy with them, and ordering was absolutely the right call.',
         "Chaque élément a été réalisé avec soin. J'en suis extrêmement satisfait : commander était vraiment le bon choix."] },
    { s:5, c:['Xヘッダー','X header','Bannière X'], n:['S様','S','S'],
      t:['写真をもとにXのヘッダーイラストを描いていただきました。とてもきれいで可愛らしい仕上がりでしたし、何よりやり取りが素晴らしいと感じました。',
         'They drew an X header illustration based on my photo. The result was beautiful and charming, and above all the communication was excellent.',
         'Une bannière X a été dessinée à partir de ma photo. Le résultat est beau et charmant, et surtout les échanges ont été excellents.'] },
    { s:5, c:['歌ってみた・配信用サムネ','Cover song & stream thumbnail','Miniature pour reprise et stream'], n:['T様','T','T'],
      t:['迅速丁寧に制作してくださいました。とても素敵に仕上げていただき嬉しかったです。',
         'Quick and careful work. I was delighted with how lovely it turned out.',
         "Un travail rapide et soigné. J'ai été ravi du résultat, vraiment réussi."] },
    { s:5, c:['ロゴデザイン','Logo design','Création de logo'], n:['J様','J','J'],
      t:['とても可愛いロゴを制作いただきました。要望を丁寧に汲んでくださり、理想以上に素敵なものをいただけました。',
         'They made a very cute logo for me. They took my requests to heart and delivered something even better than I had imagined.',
         "Un logo très mignon. Mes demandes ont été comprises avec attention et le résultat dépasse ce que j'avais imaginé."] },
    { s:5, c:['ロゴデザイン','Logo design','Création de logo'], n:['O様','O','O'],
      t:['とっても素敵なロゴを制作してくださいました。やり取りも丁寧でスムーズでした。',
         'They made a really lovely logo. The communication was courteous and smooth as well.',
         'Un logo vraiment réussi. Les échanges ont également été courtois et fluides.'] },
    { s:5, c:['ロゴデザイン','Logo design','Création de logo'], n:['匿名様','Anonymous','Anonyme'],
      t:['モチーフたっぷりの、とても可愛い名前ロゴに仕上げていただきました。またぜひお願いしたいです。',
         'They turned my name into a very cute logo, packed with motifs. I would love to order again.',
         'Mon nom est devenu un logo très mignon, riche en motifs. Je recommanderai avec plaisir.'] },
    { s:5, c:['ロゴデザイン','Logo design','Création de logo'], n:['S様','S','S'],
      t:['とても素敵な作品を作成していただきました。次の機会にもぜひお願いしたいです。',
         'A wonderful piece of work. I would certainly like to order again next time.',
         'Un travail magnifique. Je ferai de nouveau appel à ses services.'] },
    { s:5, c:['ロゴデザイン','Logo design','Création de logo'], n:['匿名様','Anonymous','Anonyme'],
      t:['イメージ通りの素敵なロゴに仕上げていただきました。細やかなお気遣いで安心してお任せでき、とても可愛く制作いただけて嬉しかったです。',
         'The logo came out exactly as I had pictured it. Their attentiveness made it easy to leave everything in their hands, and I was delighted with how cute it turned out.',
         "Le logo correspond exactement à ce que j'avais en tête. Son attention aux détails m'a permis de tout lui confier en confiance, et le résultat, très mignon, m'a enchanté."] },
    { s:5, c:['ロゴデザイン','Logo design','Création de logo'], n:['A様','A','A'],
      t:['とても可愛く素敵な作品で、依頼をして本当に良かったです。',
         'A very cute and lovely piece — I am really glad I ordered.',
         "Une création très mignonne et réussie : je suis vraiment content d'avoir commandé."] },
  ];

  /* レビューを並べる。言語が変わるたびに組み直す */
  function renderReviews(lang) {
    const grid = document.getElementById('review-grid');
    if (!grid) return;
    const i = lang === 'en' ? 1 : lang === 'fr' ? 2 : 0;
    grid.innerHTML = REVIEWS.map(r => {
      const on  = '★'.repeat(r.s);
      const off = '★'.repeat(5 - r.s);
      return '<article class="review-card">'
        + '<p class="review-card__head">'
        + '<span class="review-card__stars" aria-label="' + r.s + ' / 5">' + on
        + (off ? '<span class="review-card__stars-off">' + off + '</span>' : '')
        + '</span>'
        + '<span class="review-card__cat">' + r.c[i] + '</span>'
        + '</p>'
        + '<p class="review-card__text">' + r.t[i] + '</p>'
        + '<p class="review-card__name">' + r.n[i] + '</p>'
        + '</article>';
    }).join('');
  }



  /* === ご依頼方法の本文 ===
     タブごとの内容（REQUEST_TABS）と、その下に常に出る共通の案内（REQUEST_COMMON）。
     文面は [日本語, 英語, フランス語] の順。英仏はこのあと追加する。
     修正回数：イラスト ラフ3回＋色味3回／ロゴ2回／配信関連2回＋2回／動画 絵コンテ2回＋完成後1回 */
  const REQUEST_TABS = {
    illust: {
      made: ['制作内容', 'What I make', 'Prestations'],
      madeBody: [
        '立ち絵・表情差分・一枚絵・アイコン・ヘッダー・SDキャラ・配信OP／EDなど。<br>動くイラスト（Live2D向けのパーツ分け、まばたき・口・呼吸などのアニメーション）は<strong>オプション</strong>で承ります。',
        "Character art, expression variants, single illustrations, icons, headers, SD chibi characters, stream openings and endings, and more.<br>Animated illustrations (part separation for Live2D, blinking, mouth and breathing motion) are available as an <strong>option</strong>.", "Illustrations de personnage, variantes d'expression, illustrations uniques, icônes, bannières, personnages SD (chibi), génériques de début et de fin, etc.<br>Les illustrations animées (découpage pour Live2D, clignements, bouche, respiration) sont proposées en <strong>option</strong>."],
      deliver: ['納品内容', 'What you receive', 'Livrables'],
      deliverList: [
        ['透過PNG（ご希望に応じて他の形式も対応）',
         'Live2D向けパーツ分けの場合は<strong>PSDデータ</strong>',
         '納品後、モデラー様からパーツの追加・修正のご連絡があった場合は<strong>無料で対応</strong>いたします'],
        ["Transparent PNG (other formats on request)","A <strong>PSD file</strong> when the work includes part separation for Live2D","If your modeller asks for parts to be added or adjusted after delivery, I handle it <strong>free of charge</strong>"],
        ["PNG transparent (autres formats sur demande)","Un fichier <strong>PSD</strong> lorsque la commande inclut le découpage pour Live2D","Si votre modélisateur demande des ajouts ou des retouches de pièces après la livraison, je m'en charge <strong>gratuitement</strong>"]],
      flow: ['ご依頼の流れ', 'How it works', 'Déroulement'],
      flowList: [
        ['<strong>ご相談・お見積もり</strong>',
         '<strong>ご依頼確定・お支払い</strong>',
         '<strong>ラフ案</strong> — 構図・デザインをご確認いただきます（<strong>修正3回まで無料</strong>）',
         '<strong>線画・着色</strong>',
         '<strong>色味修正</strong> — 完成後の色味調整を承ります（<strong>3回まで無料</strong>）',
         '<strong>納品</strong>'],
        ["<strong>Enquiry and quote</strong>","<strong>Order confirmed, payment</strong>","<strong>Rough draft</strong> — you check the composition and design (<strong>up to 3 free revisions</strong>)","<strong>Line art and colouring</strong>","<strong>Colour adjustment</strong> — tweaks to the finished colours (<strong>up to 3 free</strong>)","<strong>Delivery</strong>"],
        ["<strong>Demande et devis</strong>","<strong>Commande confirmée, paiement</strong>","<strong>Croquis</strong> — vous validez la composition et le design (<strong>jusqu'à 3 retouches offertes</strong>)","<strong>Encrage et mise en couleur</strong>","<strong>Ajustement des couleurs</strong> — retouches sur les couleurs finales (<strong>jusqu'à 3 offertes</strong>)","<strong>Livraison</strong>"]],
      flowNote: [
        '線画・着色に進んだあとは<strong>色味修正のみ</strong>となります。色味修正では対応できない塗り方の変更・塗り直しは、別途お見積もりとなります。',
        "Once we move on to line art and colouring, only <strong>colour adjustments</strong> are possible. A change of rendering style or a full repaint is quoted separately.", "Une fois l'encrage et la mise en couleur commencés, seuls les <strong>ajustements de couleur</strong> sont possibles. Un changement de technique ou une reprise complète fait l'objet d'un devis distinct."],
      ng: ['お受けできない内容', 'What I cannot take on', 'Ce que je ne peux pas réaliser'],
      ngList: [
        ['メガ・モンスター・ホラー／グロ・初老の男性／女性・奇抜な髪型・版権物・許可のないファンアート／夢絵',
         'すでにAI等で制作されたイラストで活動中のキャラクター・配信者様について、<strong>現在のキャラクターの描き直し・追加制作</strong>はお受けしておりません（アカウントごと新しく作り直される場合はお受けできます）',
         '有償依頼を公開されている活動者様のファンアートは、ご本人の許可が明示されている場合のみお受けできます'],
        ["Mega and giant creatures, monsters, horror and gore, elderly men or women, highly unconventional hairstyles, licensed characters, and fan art or self-insert art without permission","For characters and streamers already active with AI-generated artwork, I do not take on <strong>redraws or additional artwork of the current character</strong> (a fresh start on a new account is fine)","Fan art of creators who openly accept paid commissions is possible only where they have given explicit permission"],
        ["Créatures géantes, monstres, horreur et gore, hommes ou femmes âgés, coiffures très extravagantes, personnages sous licence, fan art ou « dream art » sans autorisation","Pour les personnages et streamers déjà en activité avec des illustrations générées par IA, je n'accepte ni <strong>reprise ni ajout sur le personnage actuel</strong> (un nouveau départ sur un nouveau compte est possible)","Le fan art de créateurs qui acceptent publiquement les commandes payantes n'est possible qu'avec leur autorisation explicite"]],
      tpl: ['ご用意いただけると嬉しいもの（ご依頼テンプレート）', 'Helpful to have (request template)', 'Ce qui aide (modèle de demande)'],
      tplLead: ['わかる範囲でご記入ください。', 'Fill in what you can.', 'Remplissez ce que vous pouvez.'],
      tplBody: [
        '■ お名前（活動名）：\n■ ご希望のイラスト（立ち絵／一枚絵／アイコン／ヘッダー／SDキャラ など）：\n■ 用途（配信・アイコン・印刷など）：\n■ 描写範囲（等身：胸上・腰上・太ももまで・全身／SD：1.5〜3頭身）：\n■ 背景（なし・単色／簡易背景／描き込みあり）：\n■ ポーズ・構図のご希望：\n■ 年齢（顔のバランス・等身に反映します）：\n■ 身長（等身に反映します）：\n■ 性格（表情に反映します）：\n■ イメージカラー（複数いただけると助かります）：\n■ 全体のデザイン：\n■ ご希望の表情差分（立ち絵の場合）：\n■ 特殊なご要望（ぬいぐるみを抱える・後ろにおばけ など／別途お見積もり）：\n■ 参考画像：',
        "■ Name (as you go by):\n■ Type of illustration (character art / single illustration / icon / header / SD chibi, etc.):\n■ Intended use (streaming, icon, print, etc.):\n■ Framing (full scale: chest-up, waist-up, thigh-up, full body / SD: 1.5–3 heads tall):\n■ Background (none or flat colour / simple / fully painted):\n■ Pose and composition:\n■ Age (reflected in facial balance and proportions):\n■ Height (reflected in proportions):\n■ Personality (reflected in expressions):\n■ Image colours (several are helpful):\n■ Overall design:\n■ Expression variants you would like (for character art):\n■ Special requests (holding a plush toy, a ghost floating behind, etc. — quoted separately):\n■ Reference images:", "■ Nom (sous lequel vous vous présentez) :\n■ Type d'illustration (illustration de personnage / illustration unique / icône / bannière / SD chibi, etc.) :\n■ Usage prévu (stream, icône, impression, etc.) :\n■ Cadrage (échelle normale : buste, taille, mi-cuisses, corps entier / SD : 1,5 à 3 têtes) :\n■ Arrière-plan (aucun ou couleur unie / simple / entièrement peint) :\n■ Pose et composition :\n■ Âge (influe sur l'équilibre du visage et les proportions) :\n■ Taille (influe sur les proportions) :\n■ Caractère (influe sur les expressions) :\n■ Couleurs de référence (plusieurs sont utiles) :\n■ Design général :\n■ Variantes d'expression souhaitées (pour une illustration de personnage) :\n■ Demandes particulières (serrer une peluche, un fantôme qui flotte derrière, etc. — devis séparé) :\n■ Images de référence :"],
      tplNote: [
        '<strong>細かくいただけるほど、そのぶん描き込みます。</strong>「パーカー・ロングスカート」のような箇条書きでも大丈夫です。<br>おまかせでも問題ありませんが、だいたいの丈感やイメージの分かる参考画像をいただけると嬉しいです。',
        "<strong>The more detail you give, the more I can draw in.</strong> A list such as \"hoodie, long skirt\" is perfectly fine.<br>Leaving it to me is no problem at all, but a reference image that shows roughly the length and the mood is a great help.", "<strong>Plus vous me donnez de détails, plus je peux enrichir le dessin.</strong> Une simple liste comme « sweat à capuche, jupe longue » convient très bien.<br>Me laisser carte blanche ne pose aucun problème, mais une image de référence montrant à peu près les longueurs et l'ambiance m'aide beaucoup."],
      extra: [
        '<p class="req-callout"><strong>キャラクターデザイン料について</strong><br>参考になる画像を<strong>1枚でもいただければ、キャラクターデザイン料（+¥5,000）は頂きません。</strong>上半身のアイコンやちびキャラの画像でも構いません。「こういう雰囲気で」というお言葉と、服の参考になる商品写真などの組み合わせでも大丈夫です。お手元にイメージに近いものがあれば、ご添付いただけると助かります。</p>',
        "<p class=\"req-callout\"><strong>About the character design fee</strong><br><strong>If you can send even one reference image, the character design fee (+¥5,000) is waived.</strong> An icon of the upper body or a chibi illustration is fine. A few words about the mood together with, say, a product photo of the clothing you have in mind also works. If you have anything close to your idea at hand, do attach it.</p>", "<p class=\"req-callout\"><strong>À propos des frais de création de personnage</strong><br><strong>Une seule image de référence suffit pour que les frais de création de personnage (+5 000 ¥) ne soient pas facturés.</strong> Une icône du buste ou une illustration chibi convient. Quelques mots sur l'ambiance accompagnés, par exemple, de la photo d'un vêtement qui vous plaît fonctionnent aussi. Si vous avez sous la main quelque chose de proche de votre idée, n'hésitez pas à le joindre.</p>"],
    },

    logo: {
      made: ['制作内容', 'What I make', 'Prestations'],
      madeBody: [
        'キャラクターやモチーフを組み込んだ、装飾たっぷりのオリジナルデコロゴをお作りします。',
        "A richly decorated original logo that works your character and its motifs into the lettering.", "Un logo original très décoré, qui intègre votre personnage et ses motifs dans le lettrage."],
      plan: ['プラン', 'Plans', 'Formules'],
      planList: [
        ['<strong>シンプル</strong> — キャラクターのモチーフを1点だけ添えた、すっきりした構成です',
         '<strong>デコ</strong> — キャラクターのモチーフを複数点あしらった、装飾の多い構成です',
         '<strong>デコデコ</strong> — 文字そのものをモチーフに置き換えてデザインし、相棒キャラクター（ちびキャラ）を1点お描きします'],
        ["<strong>Simple</strong> — a clean composition with a single motif from your character","<strong>Deco</strong> — a more decorated composition with several motifs from your character","<strong>Deco Deco</strong> — the lettering itself is rebuilt out of motifs, plus one companion character (chibi) drawn for you"],
        ["<strong>Simple</strong> — une composition épurée avec un seul motif tiré de votre personnage","<strong>Déco</strong> — une composition plus ornée, avec plusieurs motifs de votre personnage","<strong>Déco Déco</strong> — le lettrage lui-même est composé de motifs, accompagné d'un personnage compagnon (chibi) dessiné pour vous"]],
      planNote: ['料金は料金シミュレーターでご確認いただけます。', "Prices are available in the price simulator.", "Les tarifs sont consultables dans le simulateur de prix."],
      madeList: [
        ['文字デザイン（書体・装飾込み）',
         '立ち絵や参考画像からキャラのモチーフを抽出',
         '代表マスコット1体＋目を引くモチーフを組み込み',
         '世界観に合った小物・装飾を散りばめます',
         'かわいい・かっこいい・和風・ゴシックなど幅広いテイストに対応'],
        ["Lettering design (typeface and ornament included)","Motifs taken from your character art or reference images","One signature mascot plus eye-catching motifs worked into the logo","Small items and ornaments that suit your world","A wide range of styles: cute, cool, Japanese, gothic and more"],
        ["Création typographique (police et ornements compris)","Motifs extraits de votre illustration de personnage ou de vos références","Une mascotte emblématique et des motifs marquants intégrés au logo","Petits objets et ornements assortis à votre univers","Styles variés : mignon, cool, japonais, gothique, etc."]],
      deliver: ['納品内容', 'What you receive', 'Livrables'],
      deliverList: [
        ['透過PNG（PSDでの納品も対応可）',
         '<strong>最大6バリエーション</strong>（白枠・枠あり・枠なし × 影付き・影なし）',
         '個人商用利用可（配信・グッズ・SNS等）'],
        ["Transparent PNG (PSD also available)","<strong>Up to 6 variations</strong> (white outline / with frame / without frame × with shadow / without shadow)","Personal commercial use permitted (streaming, merchandise, social media and so on)"],
        ["PNG transparent (PSD également possible)","<strong>Jusqu'à 6 variantes</strong> (contour blanc / avec cadre / sans cadre × avec ombre / sans ombre)","Usage commercial personnel autorisé (stream, goodies, réseaux sociaux, etc.)"]],
      flow: ['ご依頼の流れ', 'How it works', 'Déroulement'],
      flowList: [
        ['<strong>ご相談・お見積もり</strong>',
         '<strong>ご依頼確定・お支払い</strong>',
         '<strong>ラフ案</strong>（<strong>修正2回まで無料</strong>）',
         '<strong>清書・調整</strong>',
         '<strong>納品</strong>'],
        ["<strong>Enquiry and quote</strong>","<strong>Order confirmed, payment</strong>","<strong>Rough draft</strong> (<strong>up to 2 free revisions</strong>)","<strong>Final artwork and adjustments</strong>","<strong>Delivery</strong>"],
        ["<strong>Demande et devis</strong>","<strong>Commande confirmée, paiement</strong>","<strong>Croquis</strong> (<strong>jusqu'à 2 retouches offertes</strong>)","<strong>Mise au net et ajustements</strong>","<strong>Livraison</strong>"]],
      flowNote: [
        '制作期間は<strong>着手日からおよそ10日間</strong>です。ご依頼からすぐ着手できない場合があるため、着手予定日は事前にお伝えします。',
        "Production takes roughly <strong>10 days from the start date</strong>. I cannot always begin straight away, so I will let you know the expected start date in advance.", "La réalisation demande environ <strong>10 jours à compter du démarrage</strong>. Je ne peux pas toujours commencer immédiatement : je vous communique la date de démarrage prévue à l'avance."],
      tpl: ['ご用意いただけると嬉しいもの（ご依頼テンプレート）', 'Helpful to have (request template)', 'Ce qui aide (modèle de demande)'],
      tplLead: ['わかる範囲でご記入ください。', 'Fill in what you can.', 'Remplissez ce que vous pouvez.'],
      tplBody: [
        '■ ご希望のプラン（シンプル／デコ／デコデコ／おまかせ）：\n■ 表記（漢字・ひらがな・英字など、正確な綴り）：\n■ 文字数が多い場合、改行してもよいですか（1行で収めたい／2行に分けてよい）：\n■ 使う場所（配信画面・サムネイル・名刺・グッズなど）：\n■ イメージ（可愛い／クール／和風／ゴシック など）：\n■ イメージカラー：\n■ 入れたいモチーフ（音符・リボン・星など）：\n■ 立ち絵・参考画像（モチーフを抽出します）：',
        "■ Plan (Simple / Deco / Deco Deco / leave it to you):\n■ Spelling (kanji, kana, Latin letters — the exact form):\n■ If the name runs long, may I break it over two lines? (keep to one line / two lines are fine):\n■ Where it will be used (stream screen, thumbnails, business cards, merchandise, etc.):\n■ Mood (cute / cool / Japanese / gothic, etc.):\n■ Image colours:\n■ Motifs to include (music notes, ribbons, stars, etc.):\n■ Character art or reference images (I take the motifs from these):", "■ Formule (Simple / Déco / Déco Déco / au choix de l'artiste) :\n■ Orthographe exacte (kanji, kana, caractères latins) :\n■ Si le nom est long, puis-je le répartir sur deux lignes ? (une seule ligne / deux lignes acceptées) :\n■ Où il sera utilisé (écran de stream, miniatures, cartes de visite, goodies, etc.) :\n■ Ambiance (mignon / cool / japonais / gothique, etc.) :\n■ Couleurs de référence :\n■ Motifs à intégrer (notes de musique, rubans, étoiles, etc.) :\n■ Illustration de personnage ou images de référence (j'y puise les motifs) :"],
      tplNote: [
        '<strong>細かくいただけるほど、装飾やモチーフを多く盛り込めます。</strong>「リボン」「星」「音符」のような箇条書きでも大丈夫です。<br>おまかせでも問題ありませんが、好きなテイストや雰囲気の分かる参考画像をいただけると嬉しいです。',
        "<strong>The more detail you give, the more ornament and motifs I can work in.</strong> A list such as \"ribbon, star, music note\" is perfectly fine.<br>Leaving it to me is no problem at all, but a reference image showing the style you like is a great help.", "<strong>Plus vous me donnez de détails, plus je peux intégrer d'ornements et de motifs.</strong> Une simple liste comme « ruban, étoile, note de musique » convient très bien.<br>Me laisser carte blanche ne pose aucun problème, mais une image de référence montrant le style qui vous plaît m'aide beaucoup."],
    },

    stream: {
      made: ['制作内容', 'What I make', 'Prestations'],
      madeBody: ['待機画面・サムネイル・配信スケジュール表など。', "Standby screens, thumbnails, stream schedule graphics and the like.", "Écrans d'attente, miniatures, plannings de stream et autres visuels du même ordre."],
      deliver: ['納品内容', 'What you receive', 'Livrables'],
      deliverList: [
        ['透過PNG／JPG（用途に合わせた解像度でお渡しします）'],
        ["Transparent PNG / JPG, at a resolution suited to how you will use it"],
        ["PNG transparent / JPG, à une résolution adaptée à l'usage prévu"]],
      flow: ['ご依頼の流れ', 'How it works', 'Déroulement'],
      flowList: [
        ['<strong>ご相談・お見積もり</strong>',
         '<strong>ご依頼確定・お支払い</strong>',
         '<strong>ラフ案</strong>（<strong>修正2回まで無料</strong>）',
         '<strong>制作</strong>',
         '<strong>色味修正</strong>（<strong>2回まで無料</strong>）',
         '<strong>納品</strong>'],
        ["<strong>Enquiry and quote</strong>","<strong>Order confirmed, payment</strong>","<strong>Rough draft</strong> (<strong>up to 2 free revisions</strong>)","<strong>Production</strong>","<strong>Colour adjustment</strong> (<strong>up to 2 free</strong>)","<strong>Delivery</strong>"],
        ["<strong>Demande et devis</strong>","<strong>Commande confirmée, paiement</strong>","<strong>Croquis</strong> (<strong>jusqu'à 2 retouches offertes</strong>)","<strong>Réalisation</strong>","<strong>Ajustement des couleurs</strong> (<strong>jusqu'à 2 offertes</strong>)","<strong>Livraison</strong>"]],
      flowNote: [
        '制作に進んだあとは色味修正のみとなります。色味修正では対応できない作り直しは、別途お見積もりとなります。',
        "Once production has begun, only colour adjustments are possible. Anything that needs rebuilding is quoted separately.", "Une fois la réalisation commencée, seuls les ajustements de couleur sont possibles. Tout ce qui demande une refonte fait l'objet d'un devis distinct."],
      tpl: ['ご用意いただけると嬉しいもの（ご依頼テンプレート）', 'Helpful to have (request template)', 'Ce qui aide (modèle de demande)'],
      tplLead: ['わかる範囲でご記入ください。', 'Fill in what you can.', 'Remplissez ce que vous pouvez.'],
      tplBody: [
        '■ 用途（待機画面・サムネイル・スケジュール表 など）：\n■ 配信プラットフォーム（YouTube・IRIAM・Twitch など）：\n■ 入れたい文字（タイトル・時間・曜日など）：\n■ 使用する立ち絵・イラスト（世界観や身につけていらっしゃるものを画面に落とし込みます）：\n■ イメージカラー：\n■ イメージ（参考にしたい画像があれば）：',
        "■ Use (standby screen / thumbnail / schedule graphic, etc.):\n■ Streaming platform (YouTube, IRIAM, Twitch, etc.):\n■ Text to include (title, times, days of the week, etc.):\n■ Character art or illustrations to use (I bring your world, and the things your character wears, into the design):\n■ Image colours:\n■ Mood (a reference image if you have one):", "■ Usage (écran d'attente / miniature / planning, etc.) :\n■ Plateforme de diffusion (YouTube, IRIAM, Twitch, etc.) :\n■ Texte à intégrer (titre, horaires, jours de la semaine, etc.) :\n■ Illustration de personnage à utiliser (j'en reprends l'univers et les éléments que porte votre personnage) :\n■ Couleurs de référence :\n■ Ambiance (une image de référence si vous en avez une) :"],
      tplNote: [
        '<strong>細かくいただけるほど、世界観を画面に落とし込めます。</strong>「落ち着いた色で」「文字は大きめに」のような箇条書きでも大丈夫です。<br>おまかせでも問題ありませんが、雰囲気の分かる参考画像をいただけると嬉しいです。',
        "<strong>The more detail you give, the better I can bring your world onto the screen.</strong> A list such as \"muted colours, larger text\" is perfectly fine.<br>Leaving it to me is no problem at all, but a reference image showing the mood is a great help.", "<strong>Plus vous me donnez de détails, mieux je peux transposer votre univers à l'écran.</strong> Une simple liste comme « couleurs sobres, texte plus grand » convient très bien.<br>Me laisser carte blanche ne pose aucun problème, mais une image de référence montrant l'ambiance m'aide beaucoup."],
    },

    video: {
      made: ['制作内容', 'What I make', 'Prestations'],
      madeBody: ['オリジナルPV・MV制作。', "Original promotional videos and music videos.", "Clips promotionnels et clips musicaux originaux."],
      deliver: ['納品内容', 'What you receive', 'Livrables'],
      deliverList: [['mp4'], ["mp4"], ["mp4"]],
      flow: ['ご依頼の流れ', 'How it works', 'Déroulement'],
      flowList: [
        ['<strong>ご相談・お見積もり</strong> — 尺・使用する楽曲・立ち絵素材の有無をお知らせください',
         '<strong>ご依頼確定・お支払い</strong>',
         '<strong>構成・絵コンテ</strong>（<strong>修正2回まで無料</strong>）',
         '<strong>制作</strong>',
         '<strong>確認・修正</strong>（<strong>2回まで無料</strong>）',
         '<strong>納品</strong>'],
        ["<strong>Enquiry and quote</strong> — let me know the length, the track, and whether you already have character art","<strong>Order confirmed, payment</strong>","<strong>Structure and storyboard</strong> (<strong>up to 2 free revisions</strong>)","<strong>Production</strong>","<strong>Review and revisions</strong> (<strong>up to 2 free</strong>)","<strong>Delivery</strong>"],
        ["<strong>Demande et devis</strong> — indiquez la durée, le morceau et si vous disposez déjà d'une illustration de personnage","<strong>Commande confirmée, paiement</strong>","<strong>Structure et storyboard</strong> (<strong>jusqu'à 2 retouches offertes</strong>)","<strong>Réalisation</strong>","<strong>Vérification et retouches</strong> (<strong>jusqu'à 2 offertes</strong>)","<strong>Livraison</strong>"]],
      flowNote: [
        'イラストの制作も含むご依頼の場合は、<strong>イラストの修正2回・動画の修正2回</strong>まで無料で承ります。',
        "If the request also includes drawing the illustrations, you have <strong>2 free revisions on the illustrations and 2 on the video</strong>.", "Si la commande inclut également la réalisation des illustrations, vous disposez de <strong>2 retouches offertes sur les illustrations et de 2 sur la vidéo</strong>."],
      tpl: ['ご用意いただけると嬉しいもの（ご依頼テンプレート）', 'Helpful to have (request template)', 'Ce qui aide (modèle de demande)'],
      tplLead: ['わかる範囲でご記入ください。', 'Fill in what you can.', 'Remplissez ce que vous pouvez.'],
      tplBody: [
        '■ 楽曲（音源の権利確認をお願いします）：\n■ 尺（フル／ショート）：\n■ 使用する立ち絵・イラスト（他の方が描かれたものは、その方の許可をお願いします）：\n■ 入れたい歌詞・テロップ：\n■ イメージ（参考にしたい動画があればURLを）：',
        "■ Track (please confirm the rights to the audio):\n■ Length (full / short):\n■ Character art or illustrations to use (if someone else drew them, please obtain their permission):\n■ Lyrics or captions to include:\n■ Mood (a link to a reference video if you have one):", "■ Morceau (merci de vérifier les droits sur la bande sonore) :\n■ Durée (version complète / courte) :\n■ Illustrations à utiliser (si elles ont été dessinées par quelqu'un d'autre, merci d'obtenir son autorisation) :\n■ Paroles ou sous-titres à intégrer :\n■ Ambiance (le lien d'une vidéo de référence si vous en avez une) :"],
      tplNote: [
        '<strong>細かくいただけるほど、演出を詰められます。</strong>「サビで切り替えたい」「歌詞を出したい」のような箇条書きでも大丈夫です。<br>おまかせでも問題ありませんが、こうしたいという雰囲気の分かる参考動画をいただけると嬉しいです。',
        "<strong>The more detail you give, the further I can take the staging.</strong> A list such as \"cut on the chorus, show the lyrics\" is perfectly fine.<br>Leaving it to me is no problem at all, but a reference video showing what you have in mind is a great help.", "<strong>Plus vous me donnez de détails, plus je peux pousser la mise en scène.</strong> Une simple liste comme « changer de plan au refrain, afficher les paroles » convient très bien.<br>Me laisser carte blanche ne pose aucun problème, mais une vidéo de référence montrant ce que vous avez en tête m'aide beaucoup."],
    },
  };

  /* どのタブでも最後に出る一文 */
  const REQUEST_TPL_NOTE = [
    '<strong>細かくいただけるほど、そのぶん描き込みます。</strong>「パーカー・ロングスカート」のような箇条書きでも大丈夫です。<br>おまかせでも問題ありませんが、だいたいの丈感やイメージの分かる参考画像をいただけると嬉しいです。',
    '', ''];

  /* タブの下に常に出る共通の案内 */
  const REQUEST_COMMON = [
    { h: ['お支払いについて', 'Payment', 'Paiement'],
      list: [['<strong>銀行振込</strong>、または<strong>ココナラ・つなぐ・SKIMA</strong>を通してのお支払いに対応しています',
              '<strong>前払い</strong>です。お支払い確認をもってご依頼確定となります',
              'お支払い後のキャンセル・返金は承っておりません',
              'ご希望の内容によっては、ご依頼確定後に追加料金が発生する場合があります'], ["Payment by <strong>bank transfer</strong>, or through <strong>Coconala, Tsunagu or SKIMA</strong>","<strong>Payment is made in advance.</strong> The order is confirmed once payment is received","Cancellations and refunds are not possible once payment has been made","Depending on what you ask for, additional charges may arise after the order is confirmed"], ["Paiement par <strong>virement bancaire</strong> ou via <strong>Coconala, Tsunagu ou SKIMA</strong>","<strong>Le paiement se fait à l'avance.</strong> La commande est confirmée dès réception du paiement","Aucune annulation ni aucun remboursement ne sont possibles une fois le paiement effectué","Selon votre demande, des frais supplémentaires peuvent survenir après la confirmation de la commande"]] },
    { h: ['納期について', 'Schedule', 'Délais'],
      list: [['通常納期・短縮納期・最短納期からお選びいただけます（目安は料金シミュレーターをご覧ください）',
              '<strong>ご依頼いただいた順に対応</strong>しております。修正回数やお返事の頻度によって、納品日が前後する場合があります',
              '記念日など日付の決まっているものはお早めにご相談ください'], ["Standard, shortened and express turnaround are available (see the price simulator for estimates)","I work <strong>in the order requests come in</strong>. The delivery date can move depending on the number of revisions and how quickly we exchange messages","For anything tied to a date, such as an anniversary, please get in touch early"], ["Délais standard, raccourci ou express au choix (estimations dans le simulateur de prix)","Je traite les commandes <strong>dans leur ordre d'arrivée</strong>. La date de livraison peut varier selon le nombre de retouches et la rapidité de nos échanges","Pour tout ce qui est lié à une date précise, comme un anniversaire, pensez à me contacter tôt"]] },
    { h: ['お返事について', 'Replies', 'Réponses'],
      list: [['お見積もりから<strong>5日以上</strong>お返事がない場合は、スケジュール確保ができないためキャンセル扱いとさせていただきます',
              'ご依頼確定後、<strong>理由なく2日以上</strong>お返事がない場合は、ラフ段階でも清書し、完成データをお送りしてクローズとさせていただきます'], ["If I do not hear back for <strong>5 days or more</strong> after sending a quote, I cannot hold the slot and the request is treated as cancelled","If there is no reply for <strong>2 days or more without reason</strong> after the order is confirmed, I will finish the piece from wherever it stands, send the final file and close the request"], ["Sans réponse de votre part pendant <strong>5 jours ou plus</strong> après l'envoi du devis, je ne peux pas réserver le créneau et la demande est considérée comme annulée","Sans réponse pendant <strong>2 jours ou plus et sans motif</strong> après la confirmation de la commande, je termine l'illustration en l'état, vous envoie le fichier final et clôture la demande"]] },
    { h: ['著作権・ご利用範囲', 'Copyright and usage', 'Droits et utilisation'],
      list: [['著作権の譲渡・放棄は<strong>原則として</strong>行っておりません。企業様・事務所所属の方に限り、ご事情をお伺いしたうえで対応いたします',
              'ラフ画の保存・公開、自作発言、二次加工、二次配布は禁止しております',
              '納品後のイラスト・制作途中データの、<strong>画像生成AIへの学習・生成利用</strong>はご遠慮ください',
              '商用でお使いの場合は<strong>商用利用ライセンス（+¥5,000）</strong>が必要です',
              'グッズ化は、1種類目はライセンスの範囲内、2種類目から二次利用料を頂戴します'], ["<strong>As a rule</strong>, copyright is neither transferred nor waived. For companies and artists belonging to an agency, I can discuss it after hearing the circumstances","Saving or publishing rough drafts, claiming the work as your own, altering it or redistributing it are not permitted","Please do not use delivered illustrations or work-in-progress files for <strong>training or generation with image-generating AI</strong>","Commercial use requires a <strong>commercial licence (+¥5,000)</strong>","For merchandise, the first product type falls within the licence; a secondary usage fee applies from the second type onwards"], ["<strong>En principe</strong>, les droits d'auteur ne sont ni cédés ni abandonnés. Pour les entreprises et les artistes affiliés à une agence, j'en discute après avoir pris connaissance de la situation","Conserver ou publier les croquis, s'attribuer l'œuvre, la modifier ou la redistribuer ne sont pas autorisés","Merci de ne pas utiliser les illustrations livrées ni les fichiers en cours pour <strong>l'entraînement ou la génération par une IA d'images</strong>","Un usage commercial nécessite une <strong>licence commerciale (+5 000 ¥)</strong>","Pour les goodies, le premier type de produit est couvert par la licence ; des frais de réutilisation sont dus à partir du deuxième"]] },
    { h: ['制作物の掲載について', 'Showing the work', 'Publication des travaux'],
      list: [['制作物は実績としてポートフォリオサイトやXに掲載させていただきます（Sample表記・縮小掲載）',
              '<strong>掲載不可オプション</strong>をお選びでない場合は、掲載を承諾いただいたものとみなします',
              '公開までお時間をいただきたい場合は、<strong>掲載可能な時期</strong>をお知らせいただければ対応いたします'], ["I show finished work on this portfolio site and on X (marked Sample, at reduced size)","Unless you choose the <strong>no-publication option</strong>, I take it that you are happy for the work to be shown","If you would like to wait before it goes public, let me know <strong>when it may be shown</strong> and I will hold it until then"], ["Je présente les travaux terminés sur ce portfolio et sur X (mention Sample, en taille réduite)","Sauf si vous choisissez l'<strong>option de non-publication</strong>, je considère que la présentation du travail est acceptée","Si vous préférez attendre avant la publication, indiquez-moi <strong>à partir de quand</strong> elle est possible et je patienterai"]] },
    { h: ['お値引きについて', 'Discounts', 'Remises'],
      body: ['リピーター様割引や端数切り捨てなどは、こちらからご提案いたします。恐れ入りますが、大幅なお値引き交渉はお受けできません。', "Returning-customer discounts and rounding down are things I offer myself. I am afraid I cannot take on substantial haggling.", "Les remises fidélité et les arrondis à la baisse sont des gestes que je propose moi-même. Je ne peux malheureusement pas accepter de négociation importante sur les tarifs."] },
    { h: ['未成年の方へ', 'For minors', 'Pour les mineurs'],
      body: ['保護者の方の同意を得たうえでご依頼ください。同意が確認できない場合はお断りいたします。', "Please order with the consent of a parent or guardian. Where that consent cannot be confirmed, I have to decline.", "Merci de commander avec l'accord d'un parent ou tuteur. Sans confirmation de cet accord, je suis contrainte de refuser."] },
  ];

  /* ご依頼方法の本文を組み立てる。言語が変わるたびに呼ぶ */
  function renderRequest(lang) {
    const box = document.getElementById('request-body');
    if (!box) return;
    const i = lang === 'en' ? 1 : lang === 'fr' ? 2 : 0;
    /* 英仏がまだ入っていない項目は日本語で出す（空文字のまま出さない） */
    const t = a => (a && (a[i] || a[0])) || '';
    const li = a => {
      const arr = (a && (a[i] && a[i].length ? a[i] : a[0])) || [];
      return arr.length ? '<ul class="req-list">' + arr.map(x => '<li>' + x + '</li>').join('') + '</ul>' : '';
    };
    const ol = a => {
      const arr = (a && (a[i] && a[i].length ? a[i] : a[0])) || [];
      return arr.length ? '<ol class="req-steps">' + arr.map(x => '<li>' + x + '</li>').join('') + '</ol>' : '';
    };

    const active = document.querySelector('#request-tab .tab-btn.is-active');
    const key = (active && active.dataset.req) || 'illust';
    const d = REQUEST_TABS[key];

    let html = '<div class="req-panel">';
    html += '<h3 class="req-h">' + t(d.made) + '</h3>';
    if (d.madeBody) html += '<p class="req-p">' + t(d.madeBody) + '</p>';
    if (d.madeList) html += li(d.madeList);
    if (d.plan) {
      html += '<h3 class="req-h">' + t(d.plan) + '</h3>' + li(d.planList);
      if (d.planNote) html += '<p class="req-note">' + t(d.planNote) + '</p>';
    }
    html += '<h3 class="req-h">' + t(d.deliver) + '</h3>' + li(d.deliverList);
    html += '<h3 class="req-h">' + t(d.flow) + '</h3>' + ol(d.flowList);
    if (d.flowNote) html += '<p class="req-note">' + t(d.flowNote) + '</p>';
    if (d.ng) html += '<h3 class="req-h">' + t(d.ng) + '</h3>' + li(d.ngList);
    html += '<h3 class="req-h">' + t(d.tpl) + '</h3>';
    html += '<p class="req-p">' + t(d.tplLead) + '</p>';
    html += '<pre class="req-tpl">' + t(d.tplBody) + '</pre>';
    if (d.tplNote) html += '<p class="req-note">' + t(d.tplNote) + '</p>';
    if (d.extra) html += t(d.extra);
    html += '</div>';

    html += '<div class="req-common">';
    REQUEST_COMMON.forEach(sec => {
      html += '<h3 class="req-h req-h--common">' + t(sec.h) + '</h3>';
      if (sec.body) html += '<p class="req-p">' + t(sec.body) + '</p>';
      if (sec.list) html += li(sec.list);
    });
    html += '</div>';

    box.innerHTML = html;
  }

  function applyLang(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-lang]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.lang === lang);
    });
    document.getElementById('html-root').lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (key === 'pageTitle') { document.title = i18n[lang][key]; return; }
      if (i18n[lang][key] !== undefined) el.textContent = i18n[lang][key];
    });

    /* <strong> などのタグを含む文言（受注状況バナー）は innerHTML で差し替える。
       data-i18n は textContent なのでタグがそのまま文字として出てしまうため。 */
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.dataset.i18nHtml;
      if (i18n[lang][key] !== undefined) el.innerHTML = i18n[lang][key];
    });

    /* ページ全体の alt・aria-label・title も切り替える（ヘッダーやボタン類） */
    applyLangAttrs(document, lang);

    /* おレビューは data-i18n ではなくJSのデータから組み立てているので、
       言語が変わるたびに並べ直す */
    if (typeof renderReviews === 'function') renderReviews(lang);
    if (typeof renderRequest === 'function') renderRequest(lang);

    /* カードタイトル・お仕事絵ラベルの切り替え */
    document.querySelectorAll('.work-card').forEach(card => {
      const titleEl = card.querySelector('.work-title');
      const labelEl = card.querySelector('.work-label');
      if (!titleEl) return;
      if (lang === 'fr') {
        titleEl.textContent = (card.dataset.titleFr || card.dataset.titleEn || '').replace(/^\[.*?\]\s*/, '').trim();
        if (labelEl) labelEl.textContent = 'Commande';
      } else if (lang === 'en') {
        titleEl.textContent = (card.dataset.titleEn || '').replace(/^\[.*?\]\s*/, '').trim();
        if (labelEl) labelEl.textContent = 'Commission';
      } else {
        titleEl.textContent = (card.dataset.titleJa || '').replace(/【[^】]*】/g, '').trim();
        if (labelEl) {
          const m = (card.dataset.titleJa || '').match(/【([^】]*)】/);
          if (m) labelEl.textContent = m[1];
        }
      }

      /* サムネイルの alt にも作品名を入れる。
         空のままだと画像検索に出ず、読み上げでも「画像」としか読まれないため。
         data-title-* から作るので、カードを増やしても自動で付く。
         ロック中のカードは正式タイトルを伏せ、プレースホルダーのままにする。 */
      const thumb = card.querySelector('.work-thumb img');
      if (thumb) {
        const unlocked = !!card.dataset.unlock && !card.classList.contains('work-card--locked');
        const pick = (real, plain) =>
          (unlocked && card.dataset[real]) ? card.dataset[real] : (card.dataset[plain] || '');
        let t;
        if (lang === 'fr')      t = pick('realTitleFr', 'titleFr') || pick('realTitleEn', 'titleEn');
        else if (lang === 'en') t = pick('realTitleEn', 'titleEn');
        else                    t = pick('realTitleJa', 'titleJa');
        t = t.replace(/【[^】]*】/g, '').replace(/^\[.*?\]\s*/, '').trim();
        if (t) thumb.alt = t;
      }
    });

    /* ご依頼モーダルの言語切り替え */
    document.querySelectorAll('[data-prereq-lang]').forEach(el => {
      el.style.display = el.dataset.prereqLang === lang ? '' : 'none';
    });

    /* ワークモーダルが開いている場合は言語を即時反映 */
    if (workModal.classList.contains('is-open') && currentModalKey) {
      openWorkModal(currentModalKey);
    }
  }

  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
  });

  /* 初期表示：デフォルトJPでモーダル言語ブロックを初期化 */
  applyLang('ja');

  /* 「ご依頼する前のお願い」モーダルは 2026-10-02 に削除。
     中身はご依頼方法のタブへ移した。 */

  /* === Page Top === */
  const pageTop      = document.getElementById('page-top');
  const scrollArea   = document.querySelector('.works-scroll-area');

  scrollArea.addEventListener('scroll', () => {
    pageTop.classList.toggle('is-visible', scrollArea.scrollTop > 80);
  }, { passive: true });

  pageTop.addEventListener('click', e => {
    e.preventDefault();
    scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* === ソート === */
  const grid = document.getElementById('works-grid');

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const cards = [...grid.querySelectorAll('.work-card')];
      cards.sort((a, b) => {
        const da = a.dataset.date, db = b.dataset.date;
        return btn.dataset.sort === 'new' ? db.localeCompare(da) : da.localeCompare(db);
      });
      cards.forEach(c => grid.appendChild(c));
    });
  });
  /* === BGMプレイヤー === */
  (function() {
    const audioBgm     = document.getElementById('audio-bgm');
    const bgmCtrl      = document.getElementById('bgm-ctrl');
    const bgmToggle    = document.getElementById('bgm-toggle');
    const bgmIcon      = document.getElementById('bgm-icon');
    const bgmVolSlider = document.getElementById('bgm-vol');

    let bgmOn     = false; // リフレッシュ後は常にOFFで開始（autoplay制限・UI不整合を防ぐ）
    let targetVol = parseFloat(localStorage.getItem('bgm-vol') ?? '0.3');

    /* BGMを廃止したページでは要素が無い。
       この関数の中には他の処理も同居しているので return せず、
       BGM関連の行だけを要素がある時に限って動かす（2026-09-30） */
    if (bgmVolSlider) bgmVolSlider.value = targetVol;

    function fadeVol(audio, to, ms = 600) {
      const from  = audio.volume;
      const start = performance.now();
      (function tick(now) {
        const p = Math.min((now - start) / ms, 1);
        audio.volume = from + (to - from) * p;
        if (p < 1) requestAnimationFrame(tick);
      })(performance.now());
    }

  /* === タイトルから【〇〇絵】除去 & wrap でビス用ラッパー追加 === */
  document.querySelectorAll('.work-title').forEach(el => {
    el.textContent = el.textContent.replace(/【[^】]*】/g, '').trim();
    const wrap = document.createElement('div');
    wrap.className = 'work-title-wrap';
    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(el);
    el.addEventListener('mousedown', e => e.preventDefault());
  });

  /* === 「お仕事絵」ラベルを左上にセロテープ風で追加 === */
  document.querySelectorAll('.work-card').forEach(card => {
    const titleJa = card.dataset.titleJa || '';
    const match = titleJa.match(/【([^】]*)】/);
    if (match) {
      const label = document.createElement('span');
      label.className = 'work-label';
      label.textContent = match[1];
      card.querySelector('.work-thumb').prepend(label);
    }
  });

  /* === タブ＋絞り込みの表示制御 ===
     タブ（イラスト／ロゴ／配信関連）でまず大きく分け、
     配信関連の中だけ data-cat でさらに絞り込めるようにしている。
     カードは「タブが一致」かつ「絞り込みが一致」の両方を満たすときだけ表示する。 */
  const initialTab = document.querySelector('#sec-work .tab-btn.is-active')?.dataset.tab || 'illust';
  let currentTab = initialTab;
  let currentFilter = 'all';

  function updateCards() {
    document.querySelectorAll('.work-card').forEach(card => {
      const tabOk = card.dataset.category === currentTab;
      const filterOk = currentFilter === 'all' || card.dataset.cat === currentFilter;
      card.style.display = (tabOk && filterOk) ? '' : 'none';
    });
  }

  /* 絞り込みバーの出し入れ。
     作品が1件も無い項目のボタンは隠すので、
     作品を足せばその項目のボタンが自動で出てくる（HTMLは触らなくてよい）。 */
  function updateFilterBar() {
    const bar = document.getElementById('works-filter');
    if (!bar) return;
    const useFilter = currentTab === 'schedule';
    bar.style.display = useFilter ? '' : 'none';
    if (!useFilter) return;

    let shown = 0;
    bar.querySelectorAll('.filter-btn').forEach(btn => {
      const f = btn.dataset.filter;
      if (f === 'all') { btn.style.display = ''; return; }
      const n = [...document.querySelectorAll('.work-card')]
        .filter(c => c.dataset.category === currentTab && c.dataset.cat === f).length;
      btn.style.display = n > 0 ? '' : 'none';
      if (n > 0) shown++;
    });
    /* 絞り込める項目が1つしか無いなら、バー自体を出す意味がない */
    if (shown <= 1) bar.style.display = 'none';
  }

  function switchTab(tab) {
    currentTab = tab;
    currentFilter = 'all';
    const bar = document.getElementById('works-filter');
    if (bar) bar.querySelectorAll('.filter-btn').forEach(b =>
      b.classList.toggle('is-active', b.dataset.filter === 'all'));
    updateFilterBar();
    updateCards();
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(b =>
        b.classList.toggle('is-active', b === btn));
      updateCards();
    });
  });

  switchTab(initialTab);

  /* === タブ切り替え（スライダーpill付き） === */
  const tabSlider = document.querySelector('#sec-work .tab-slider');

  function moveSlider(targetBtn) {
    const fromLeft  = tabSlider.offsetLeft;
    const fromWidth = tabSlider.offsetWidth;
    const toLeft    = targetBtn.offsetLeft;
    const toWidth   = targetBtn.offsetWidth;

    /* クラス除去時のジャンプ防止：現在位置をベース変数に固定 */
    tabSlider.style.setProperty('--pill-left',  fromLeft  + 'px');
    tabSlider.style.setProperty('--pill-width', fromWidth + 'px');

    tabSlider.style.setProperty('--from-left',  fromLeft  + 'px');
    tabSlider.style.setProperty('--from-width', fromWidth + 'px');
    tabSlider.style.setProperty('--to-left',    toLeft    + 'px');
    tabSlider.style.setProperty('--to-width',   toWidth   + 'px');

    tabSlider.classList.remove('is-moving-right', 'is-moving-left');
    void tabSlider.offsetWidth; /* reflow でアニメをリスタート */
    tabSlider.classList.add(toLeft > fromLeft ? 'is-moving-right' : 'is-moving-left');
  }

  /* 初期位置をセット */
  requestAnimationFrame(() => {
    const activeBtn = document.querySelector('#sec-work .tab-btn.is-active');
    if (activeBtn && tabSlider) {
      tabSlider.style.setProperty('--pill-left',  activeBtn.offsetLeft  + 'px');
      tabSlider.style.setProperty('--pill-width', activeBtn.offsetWidth + 'px');
    }
  });

  /* アニメ終了後：アクティブボタンの実座標で --pill-* を上書き（位置ずれ防止） */
  tabSlider.addEventListener('animationend', () => {
    const activeBtn = document.querySelector('#sec-work .tab-btn.is-active');
    if (!activeBtn) return;
    tabSlider.classList.remove('is-moving-right', 'is-moving-left');
    tabSlider.style.setProperty('--pill-left',  activeBtn.offsetLeft  + 'px');
    tabSlider.style.setProperty('--pill-width', activeBtn.offsetWidth + 'px');
  });

  /* ボタン幅・位置が変わったときに --pill-* を合わせ直す */
  function syncTabSlider() {
    const activeBtn = document.querySelector('#sec-work .tab-btn.is-active');
    if (!activeBtn) return;
    tabSlider.classList.remove('is-moving-right', 'is-moving-left');
    tabSlider.style.setProperty('--pill-left',  activeBtn.offsetLeft  + 'px');
    tabSlider.style.setProperty('--pill-width', activeBtn.offsetWidth + 'px');
  }

  window.addEventListener('resize', syncTabSlider);
  /* 言語を切り替えるとボタンの文字数が変わって幅も変わる。
     合わせ直さないと、ピルが前の言語の幅のまま残ってずれる（2026-10-01） */
  document.querySelectorAll('[data-lang]').forEach(b =>
    b.addEventListener('click', () => setTimeout(syncTabSlider, 80)));

  document.querySelectorAll('#sec-work .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      document.querySelectorAll('#sec-work .tab-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      moveSlider(btn);
      switchTab(btn.dataset.tab);
    });
  });

  /* === タグが折り返す場合のみ3つ目以降を非表示 === */
  requestAnimationFrame(() => {
    document.querySelectorAll('.work-tags').forEach(container => {
      const tags = container.querySelectorAll('.work-tag');
      if (tags.length < 3) return;
      const lineH = tags[0].offsetHeight;
      if (container.offsetHeight > lineH * 1.5) {
        tags.forEach((tag, i) => { if (i >= 2) tag.style.display = 'none'; });
      }
    });
  });

  /* === タグをwork-thumbの外（タイトルラッパー直前）に移動 === */
  document.querySelectorAll('.work-card').forEach(card => {
    const tags     = card.querySelector('.work-tags');
    const titleWrap = card.querySelector('.work-title-wrap');
    if (tags && titleWrap) card.insertBefore(tags, titleWrap);
  });

  /* === 額縁ネジを全ワークカードに追加 === */
  document.querySelectorAll('.work-thumb').forEach(thumb => {
    ['tl', 'tr', 'bl', 'br'].forEach(pos => {
      const s = document.createElement('span');
      s.className = `frame-screw frame-screw--${pos}`;
      thumb.appendChild(s);
    });
  });

    bgmToggle?.addEventListener('click', () => {
      bgmOn = !bgmOn;
      localStorage.setItem('bgm', bgmOn ? 'on' : 'off');
      bgmIcon.src = bgmOn ? '../assets/img/icon-music.png' : '../assets/img/icon-mute.png';
      bgmCtrl.classList.toggle('is-on', bgmOn);
      if (bgmOn) {
        audioBgm.volume = 0;
        audioBgm.play().catch(() => {});
        fadeVol(audioBgm, targetVol, 800);
      } else {
        fadeVol(audioBgm, 0, 600);
        setTimeout(() => audioBgm.pause(), 650);
      }
    });

    bgmVolSlider?.addEventListener('input', () => {
      targetVol = parseFloat(bgmVolSlider.value);
      localStorage.setItem('bgm-vol', targetVol);
      if (bgmOn) audioBgm.volume = targetVol;
    });

    /* タブ・ウィンドウ切り替え時：音を止めてUIもOFFに揃える */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && bgmOn && audioBgm && !audioBgm.paused) {
        audioBgm.pause();
        bgmOn = false;
        bgmIcon.src = '../assets/img/icon-mute.png';
        bgmCtrl.classList.remove('is-on');
      }
    });
  })();

  // 右クリック禁止（外部リンク・mailtoのみ許可、href="#"は禁止）
  document.addEventListener('contextmenu', (e) => {
    const link = e.target.closest('a');
    if (link) {
      const href = link.getAttribute('href') || '';
      if (href && href !== '#' && !href.startsWith('javascript')) return;
    }
    e.preventDefault();
  }, true);

  // ドラッグ保存禁止（全画像・動画）
  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  /* === インデックスのボタンを「蛇腹に折れる」作りにする ===
     Codrops「3D Thumbnail Hover Effects」の手法。
     https://tympanus.net/codrops/2012/06/18/3d-thumbnail-hover-effects/
     あちらは画像を5枚のスライスに分け、background-position をずらして
     1枚の絵が折れているように見せていた（分割は jQuery でやっている）。

     ここは画像ではなく文字のボタンなので、そのままは使えない。
     → 背景だけを4枚のスライスに分けて折り、文字は前面に固定する。
       文字まで折ると読めなくなるため。
     スライスはJSで作る。HTMLに書くとボタンを増やすたびに手で足すことになる。 */
  (function buildFoldSlices() {
    document.querySelectorAll('.section-index__link').forEach(link => {
      if (link.querySelector('.fold-label')) return;   /* 二重生成の防止 */

      const label = document.createElement('span');
      label.className = 'fold-label';
      label.textContent = link.textContent.trim();

      /* ★data-i18n をリンク本体から文字の入れ物へ移す。
         applyLang は [data-i18n] の textContent を丸ごと書き換えるので、
         リンクに付いたままだと言語を切り替えた瞬間に影の要素まで消える。 */
      if (link.dataset.i18n) {
        label.dataset.i18n = link.dataset.i18n;
        delete link.dataset.i18n;
      }

      /* 浮いた紙の下に落ちる影。CSSの ::before と ::after は
         角のめくれで使っているので、影は実要素として足す */
      const shade = document.createElement('span');
      shade.className = 'fold-shade';

      link.textContent = '';
      link.appendChild(shade);
      link.appendChild(label);
    });
  })();

  /* === ページ内インデックスの縦位置を受注状況の下に合わせる ===
     インデックスは .works-main に絶対配置しているので、top をJSで入れる。
     受注状況の高さは言語によって変わる（英仏は文が長く折り返す）ため、
     CSSで固定値を書くとずれてしまう。 */



  /* === 言語切り替えの「転がる四角」 ===
     Downloads/tips-3「転がるCSSアニメーション」の考え方を使っている。
     選択中のボタンの上に四角を重ねておき、別の言語を押したら
     その位置まで転がして動かす。
     アニメーション中は transform で動かし、終わったら left を書き換えて
     transform を外す（次の転がりの起点をずらさないため）。 */
  (function initLangPill() {
    const wrap = document.getElementById('lang-switch');
    if (!wrap) return;
    const pill = wrap.querySelector('.lang-pill');
    const btns = [...wrap.querySelectorAll('.lang-btn')];
    if (!pill || !btns.length) return;

    /* いま選ばれているボタンにぴったり重ねる（アニメーションなし） */
    function fit(btn) {
      if (!btn) return;
      pill.classList.remove('is-rolling-right', 'is-rolling-left');
      pill.style.removeProperty('--lang-roll-x');
      pill.style.setProperty('--lang-pill-left',   btn.offsetLeft   + 'px');
      pill.style.setProperty('--lang-pill-top',    btn.offsetTop    + 'px');
      pill.style.setProperty('--lang-pill-width',  btn.offsetWidth  + 'px');
      pill.style.setProperty('--lang-pill-height', btn.offsetHeight + 'px');
    }

    function rollTo(btn) {
      const fromLeft = parseFloat(getComputedStyle(pill).getPropertyValue('--lang-pill-left')) || 0;
      const toLeft   = btn.offsetLeft;
      const dx       = toLeft - fromLeft;

      /* 同じ位置なら転がす必要がない。幅が変わる場合だけ合わせ直す */
      if (Math.abs(dx) < 1) { fit(btn); return; }

      pill.classList.remove('is-rolling-right', 'is-rolling-left');
      void pill.offsetWidth;                      /* reflow でアニメをやり直す */
      pill.style.setProperty('--lang-roll-x', dx + 'px');
      pill.classList.add(dx > 0 ? 'is-rolling-right' : 'is-rolling-left');

      /* 転がり終わったら、位置を left に移してtransformを外す */
      pill.addEventListener('animationend', () => fit(btn), { once: true });
    }

    btns.forEach(btn => btn.addEventListener('click', () => {
      /* applyLang が is-active を付け替えるので、こちらは位置だけ受け持つ */
      rollTo(btn);
    }));

    /* 言語によってボタンの幅は変わらないが、
       フォントの読み込みや画面幅の変化でずれることがあるので測り直す */
    window.addEventListener('resize', () => fit(wrap.querySelector('.lang-btn.is-active')));
    window.addEventListener('load',   () => fit(wrap.querySelector('.lang-btn.is-active')));
    requestAnimationFrame(() => fit(wrap.querySelector('.lang-btn.is-active')));
  })();

  /* === ご依頼方法のタブ ===
     見た目はお作業実績のタブと同じ（.works-tab のCSSをそのまま使う）。
     お作業実績のタブ処理は #sec-work に限定してあるので、ここは独立して動かす。
     中身（ご依頼の流れ本文）はこれから作るので、今は見た目の切り替えだけ。 */
  (function initRequestTab() {
    const wrap = document.getElementById('request-tab');
    if (!wrap) return;
    const slider = wrap.querySelector('.tab-slider');
    const btns   = [...wrap.querySelectorAll('.tab-btn')];
    if (!slider || !btns.length) return;

    function syncSlider() {
      const active = wrap.querySelector('.tab-btn.is-active');
      if (!active) return;
      slider.classList.remove('is-moving-right', 'is-moving-left');
      slider.style.setProperty('--pill-left',  active.offsetLeft  + 'px');
      slider.style.setProperty('--pill-width', active.offsetWidth + 'px');
    }

    function moveSlider(target) {
      const fromLeft  = slider.offsetLeft;
      const fromWidth = slider.offsetWidth;
      const toLeft    = target.offsetLeft;
      const toWidth   = target.offsetWidth;

      slider.style.setProperty('--pill-left',  fromLeft  + 'px');
      slider.style.setProperty('--pill-width', fromWidth + 'px');
      slider.style.setProperty('--from-left',  fromLeft  + 'px');
      slider.style.setProperty('--from-width', fromWidth + 'px');
      slider.style.setProperty('--to-left',    toLeft    + 'px');
      slider.style.setProperty('--to-width',   toWidth   + 'px');

      slider.classList.remove('is-moving-right', 'is-moving-left');
      void slider.offsetWidth;   /* reflow でアニメをリスタート */
      slider.classList.add(toLeft > fromLeft ? 'is-moving-right' : 'is-moving-left');
    }

    btns.forEach(btn => btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      btns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      moveSlider(btn);
      /* 本文を押したタブのものに差し替える */
      if (typeof renderRequest === 'function') {
        renderRequest(document.getElementById('html-root').lang || 'ja');
      }
    }));

    slider.addEventListener('animationend', syncSlider);
    window.addEventListener('resize', syncSlider);
    /* 言語を切り替えると文字数が変わってボタン幅も変わる */
    document.querySelectorAll('[data-lang]').forEach(b =>
      b.addEventListener('click', () => setTimeout(syncSlider, 80)));
    requestAnimationFrame(syncSlider);
  })();

  /* 初期表示（日本語）のぶんを先に組み立てておく */
  renderReviews('ja');
  renderRequest('ja');

  (function placeSectionIndex() {
    const idx  = document.getElementById('section-index');
    const main = document.querySelector('.works-main');
    const sort = document.querySelector('.works-sort');
    if (!idx || !main || !sort) return;

    /* .works-sort の上端から44pxが波形装飾、その下が白いカードエリア。
       付箋の上端を波形の中に食い込ませる高さに置く（2026-09-30）。

       ただし .works-sort は「お作業実績」ページの中にあるので、
       おレビュー／ご依頼方法を開くと消えてしまう。
       基準が無くなって付箋が画面の上まで飛ぶため、
       お作業実績を表示しているときの高さを覚えておいて、
       どのページでも同じ位置に置く（2026-10-01）。 */
    const scroller = document.querySelector('.works-scroll-area');
    let offsetFromScroller = null;

    function place() {
      if (!scroller) return;
      const scTop   = scroller.getBoundingClientRect().top;
      const mainTop = main.getBoundingClientRect().top;

      /* 波形が見えているページでは、その位置を測って覚えておく */
      if (sort.offsetParent !== null) {
        offsetFromScroller = sort.getBoundingClientRect().top - scTop;
      }
      /* まだ一度も測れていない場合の保険 */
      const offset = offsetFromScroller != null ? offsetFromScroller : 104;

      idx.style.top = Math.round(scTop - mainTop + offset + 6) + 'px';
    }

    /* 付箋の高さを揃える。
       フランス語など長い言語はボタンが2行になるので、
       いちばん高いものに合わせて全部そろえる（幅はCSSのstretchで既に揃っている） */
    function equalizeHeight() {
      const links = idx.querySelectorAll('.section-index__link');
      links.forEach(a => { a.style.minHeight = ''; });
      let max = 0;
      links.forEach(a => { max = Math.max(max, a.offsetHeight); });
      links.forEach(a => { a.style.minHeight = max + 'px'; });
    }

    function refresh() { equalizeHeight(); place(); }
    refresh();
    window.addEventListener('resize', refresh);
    /* 画像やフォントの読み込みでレイアウトが動いたあとにも測り直す。
       初回だけで済ませると、確定前の位置のままズレて残る */
    window.addEventListener('load', refresh);
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(refresh);
      ro.observe(main);
      ro.observe(sort);
    }
    /* 言語を切り替えると文字数が変わって行数・受注状況の高さが変わるので、そのあとも測り直す */
    document.querySelectorAll('[data-lang]').forEach(b =>
      b.addEventListener('click', () => setTimeout(refresh, 60)));
  })();

  /* === ページ内インデックス：いま見ているセクションのボタンを光らせる ===
     スクロールする入れ物は window ではなく .works-scroll-area。

     IntersectionObserver ではなく、スクロール位置から計算する方式にしている。
     理由：Work（作品47件）に対して Review と ご依頼の流れ は短いので、
     いちばん下までスクロールしても、その2つが画面の上部まで来ない。
     監視の帯に入らないままアクティブにならず、ずっとWorkが光ってしまう。
     → 「最下部まで来たら最後のセクション」を明示的に扱う必要がある。 */
  (function () {
    const links = [...document.querySelectorAll('.section-index__link')];
    if (!links.length) return;
    const scroller = document.querySelector('.works-scroll-area');
    const sections = links
      .map(a => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);
    if (!sections.length || !scroller) return;

    const setActive = id => links.forEach(a =>
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));

    /* ★付箋はページの切り替え。
       スクロールして移動すると「飛んだ」感じが出るので、
       表示するセクションそのものを差し替える。
       拡大する覆い（.section-veil）は見た目が悪かったので外した（2026-10-01）。 */

    /* 指定のセクションだけを表示して、先頭から読めるようにする */
    function showSection(id) {
      sections.forEach(s => s.classList.toggle('is-shown', s.id === id));
      setActive(id);
      const prev = scroller.style.scrollBehavior;
      scroller.style.scrollBehavior = 'auto';
      scroller.scrollTop = 0;
      scroller.style.scrollBehavior = prev;
      /* セクションによって中身の高さが変わるので、付箋の位置を測り直す */
      window.dispatchEvent(new Event('resize'));
    }

    links.forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const id = a.getAttribute('href').slice(1);
      if (!document.getElementById(id)) return;
      showSection(id);
    }));

    /* 1ページ＝1セクションなので、スクロール位置から光らせる処理は不要 */
    setActive((sections.find(s => s.classList.contains('is-shown')) || sections[0]).id);
  })();

  // 動画のループを強制ON
  document.querySelectorAll('video').forEach(v => { v.loop = true; });

  // ページロードフェードイン
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.body.classList.add('is-loaded');
  }));
