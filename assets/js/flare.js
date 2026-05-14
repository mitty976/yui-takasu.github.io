/**
 * flare.js — レンズフレアエフェクト
 * 使い方: SummerFlare.init() / SummerFlare.destroy()
 */
(function (global) {
  'use strict';

  const rand = (a, b) => Math.random() * (b - a) + a;

  /* ── 放射状の光の筋（スターバースト） ── */
  function drawBurst(ctx, x, y, r, alpha, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    const RAYS = 16;
    for (let i = 0; i < RAYS; i++) {
      const angle   = (i / RAYS) * Math.PI * 2;
      const primary = i % 2 === 0;
      const len     = primary ? r : r * 0.52;
      const lw      = primary ? 1.4 : 0.7;
      const a       = (primary ? 0.70 : 0.38) * alpha;

      /* 根元から先端へフェードアウト */
      const ex  = Math.cos(angle) * len;
      const ey  = Math.sin(angle) * len;
      const grd = ctx.createLinearGradient(0, 0, ex, ey);
      grd.addColorStop(0,   `rgba(255,255,220,${a})`);
      grd.addColorStop(0.5, `rgba(255,255,190,${a * 0.4})`);
      grd.addColorStop(1,   `rgba(255,240,160,0)`);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = grd;
      ctx.lineWidth   = lw;
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ── レンズアーティファクト（光軸上の色付きリング） ── */
  function drawArtifacts(ctx, lx, ly, cx, cy, alpha) {
    const dx = cx - lx;   /* 光源 → 画面中心 方向 */
    const dy = cy - ly;

    /* t=0 が光源、t=1 が画面中心 */
    const arts = [
      { t: 0.22, r: 24, rgb: '110,200,110', a: 0.22, fill: true  },
      { t: 0.42, r:  9, rgb: '220,130,220', a: 0.30, fill: true  },
      { t: 0.60, r: 48, rgb: '200, 90, 90', a: 0.10, fill: false },
      { t: 0.82, r: 16, rgb: '130,150,255', a: 0.18, fill: true  },
      { t: 1.15, r: 65, rgb: '200,220, 90', a: 0.07, fill: false },
    ];

    arts.forEach(art => {
      const ax = lx + dx * art.t;
      const ay = ly + dy * art.t;
      const a  = art.a * alpha;

      ctx.beginPath();
      ctx.arc(ax, ay, art.r, 0, Math.PI * 2);
      if (art.fill) {
        ctx.fillStyle = `rgba(${art.rgb},${a})`;
        ctx.fill();
      }
      ctx.strokeStyle = `rgba(${art.rgb},${a * 0.9})`;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    });
  }

  /* ── Flare クラス ── */
  class Flare {
    constructor(canvas) {
      this.canvas = canvas;
      this.reset(true);
    }

    reset(first = false) {
      const w = this.canvas.width;
      const h = this.canvas.height;
      this.x        = rand(w * 0.10, w * 0.90);
      this.y        = first ? rand(h * 0.05, h * 0.55) : rand(-180, -60);
      this.glowR    = rand(90, 170);
      this.burstR   = rand(110, 260);
      this.vx       = rand(-0.12, 0.12);
      this.vy       = rand(0.06, 0.20);
      this.rot      = rand(0, Math.PI * 2);
      this.rotSpeed = rand(-0.0008, 0.0008);
      this.life     = 0;
      this.maxLife  = rand(550, 950);
      this.peak     = rand(0.45, 0.85);
      this.alpha    = 0;
    }

    update() {
      this.life++;
      this.x   += this.vx;
      this.y   += this.vy;
      this.rot += this.rotSpeed;

      const p = this.life / this.maxLife;
      if      (p < 0.12) this.alpha = (p / 0.12)       * this.peak;
      else if (p > 0.78) this.alpha = ((1 - p) / 0.22) * this.peak;
      else               this.alpha = this.peak;

      if (this.life >= this.maxLife || this.y > this.canvas.height + 120) {
        this.reset();
      }
    }

    draw(ctx) {
      const { x, y, glowR, burstR, alpha, rot } = this;
      const cx = this.canvas.width  / 2;
      const cy = this.canvas.height / 2;

      ctx.save();

      /* 1. 外側の柔らかいハロー */
      const halo = ctx.createRadialGradient(x, y, 0, x, y, glowR);
      halo.addColorStop(0,    `rgba(255,252,210,${alpha * 0.75})`);
      halo.addColorStop(0.25, `rgba(255,245,180,${alpha * 0.35})`);
      halo.addColorStop(0.65, `rgba(255,225,140,${alpha * 0.08})`);
      halo.addColorStop(1,    `rgba(255,200,100,0)`);
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, glowR, 0, Math.PI * 2);
      ctx.fill();

      /* 2. スターバースト（放射状の光の筋） */
      drawBurst(ctx, x, y, burstR, alpha, rot);

      /* 3. レンズアーティファクト */
      drawArtifacts(ctx, x, y, cx, cy, alpha);

      /* 4. 中心の強い白い輝き */
      const core = ctx.createRadialGradient(x, y, 0, x, y, 22);
      core.addColorStop(0,   `rgba(255,255,255,${alpha})`);
      core.addColorStop(0.3, `rgba(255,255,245,${alpha * 0.65})`);
      core.addColorStop(1,   `rgba(255,255,210,0)`);
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  /* ── 公開API ── */
  let _raf = null, _canvas = null;

  const SummerFlare = {
    init(opts = {}) {
      if (_canvas) this.destroy();

      _canvas = document.createElement('canvas');
      document.body.appendChild(_canvas);
      Object.assign(_canvas.style, {
        position: 'fixed', top: '0', left: '0',
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: '10',
      });

      const ctx    = _canvas.getContext('2d');
      const resize = () => { _canvas.width = innerWidth; _canvas.height = innerHeight; };
      addEventListener('resize', resize);
      resize();

      const flares = Array.from({ length: opts.count ?? 3 }, () => new Flare(_canvas));

      function loop() {
        ctx.clearRect(0, 0, _canvas.width, _canvas.height);
        flares.forEach(f => { f.update(); f.draw(ctx); });
        _raf = requestAnimationFrame(loop);
      }
      _raf = requestAnimationFrame(loop);
    },

    destroy() {
      if (_raf)    { cancelAnimationFrame(_raf); _raf    = null; }
      if (_canvas) { _canvas.remove();           _canvas = null; }
    },
  };

  global.SummerFlare = SummerFlare;
})(window);
