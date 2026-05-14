  /* === 季節カラー === */
  const SEASONS = {
    spring: { months: [3,4,5],   bg:'#FFFAFF', works:'#FFEEF4', sidebar:'#F8D8E8', border:'#EAB5C5', accent:'#D4879A', btn:'#D4879A', cursor:'../assets/img/cursor/cursor-spring.png',
              effect:'sakura', colors:['#FAE6E6','#F5C8C8','#F7B8C8','#F9D0D8','#F0A0B8'] },
    summer: { months: [6,7,8],   bg:'#F5FFFF', works:'#E8F8F8', sidebar:'#C8E8E8', border:'#88C0C0', accent:'#4A9090', btn:'#4A9090', cursor:'../assets/img/cursor/cursor-summer.png',
              effect:'summer', colors:['rgba(90,130,185,0.6)','rgba(110,150,200,0.5)','rgba(130,170,215,0.55)','rgba(80,115,175,0.5)'] },
    autumn: { months: [9,10,11], bg:'#FFFCF8', works:'#FFF0E4', sidebar:'#EED8C8', border:'#C8A090', accent:'#8C5048', btn:'#8C5048', cursor:'../assets/img/cursor/cursor-autumn.png',
              effect:'autumn', colors:['#C87828','#D49048','#B06028','#E8A058','#A84820'] },
    winter: { months: [12,1,2],  bg:'#FFF8FC', works:'#FFE8F0', sidebar:'#E8C8D8', border:'#C898B8', accent:'#7A3048', btn:'#7A3048', cursor:'../assets/img/cursor/cursor-winter.png',
              effect:'snow',   colors:['#ffffff','#EAF0FF','#D8EEFF','#F4F8FF'] },
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

  /* === ローダー === */
  const loader = document.getElementById('loader');

  /* ロゴイン(300ms遅延+800ms) + 停止800ms = 1900ms後にフェードアウト */
  setTimeout(() => {
    if (Sakura.canvas) {
      Sakura.canvas.style.zIndex = '30';
      document.body.appendChild(Sakura.canvas);
    }
    loader.classList.add('is-out');
    loader.addEventListener('transitionend', () => loader.classList.add('is-gone'), { once: true });
  }, 1900);

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

  const openWorkModal = key => {
    const data = WORK_MODAL_DATA[key];
    if (!data) return;
    currentModalKey = key;
    const isEn = currentLang === 'en';
    document.getElementById('wm-title').textContent    = (isEn && data.titleEn) ? data.titleEn : data.title;
    document.getElementById('wm-subtitle').textContent = data.subtitle;
    document.getElementById('wm-body').innerHTML       = (isEn && data.htmlEn)  ? data.htmlEn  : data.html;
    workModal.classList.add('is-open');
    initCarousels(document.getElementById('wm-body'));
  };
  const closeWorkModal = () => { workModal.classList.remove('is-open'); currentModalKey = null; };

  document.querySelectorAll('.work-card[data-modal]').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      openWorkModal(card.dataset.modal);
    });
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
      'canDo.icon':      'Icon',
      'canDo.header':    'Header',
      'canDo.thumbnail': 'Thumbnail',
      'canDo.still':     'Illustration',
      'canDo.standing':  'Standing Art',
      'canDo.animated':  'Animated Art',
      'canDo.goods':     'Goods Illustration',
    },
  };

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

    /* カードタイトルの切り替え */
    document.querySelectorAll('.work-card').forEach(card => {
      const titleEl = card.querySelector('.work-title');
      if (!titleEl) return;
      const key = lang === 'en' ? 'titleEn' : 'titleJa';
      if (card.dataset[key]) titleEl.textContent = card.dataset[key];
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

  /* === モーダル === */
  const modalOverlay  = document.getElementById('modal-prerequest');
  const openBtn       = document.getElementById('open-prerequest');
  const closeBtn      = document.getElementById('modal-close');

  function openModal()  { modalOverlay.classList.add('is-open'); }
  function closeModal() { modalOverlay.classList.remove('is-open'); }

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

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

    bgmVolSlider.value = targetVol;

    function fadeVol(audio, to, ms = 600) {
      const from  = audio.volume;
      const start = performance.now();
      (function tick(now) {
        const p = Math.min((now - start) / ms, 1);
        audio.volume = from + (to - from) * p;
        if (p < 1) requestAnimationFrame(tick);
      })(performance.now());
    }

    bgmToggle.addEventListener('click', () => {
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

    bgmVolSlider.addEventListener('input', () => {
      targetVol = parseFloat(bgmVolSlider.value);
      localStorage.setItem('bgm-vol', targetVol);
      if (bgmOn) audioBgm.volume = targetVol;
    });

    /* タブ・ウィンドウ切り替え時：音を止めてUIもOFFに揃える */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && bgmOn && !audioBgm.paused) {
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

  // 動画のループを強制ON
  document.querySelectorAll('video').forEach(v => { v.loop = true; });

  // ページロードフェードイン
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.body.classList.add('is-loaded');
  }));
