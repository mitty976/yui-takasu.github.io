/**
 * winter-bg.js — 冬の雪降りエフェクト
 * 使い方: WinterBg.start() / WinterBg.stop()
 */
(function () {
  let canvas, ctx, running = false, rafId = null, resizeHandler = null;
  let flakes = [];

  const COUNT = 90;

  function makeFlake(w, h, fromTop) {
    return {
      x:         Math.random() * w,
      y:         fromTop ? -10 - Math.random() * 20 : Math.random() * h,
      r:         1.2 + Math.random() * 3.5,
      vy:        0.4 + Math.random() * 1.0,
      vx:        (Math.random() - 0.5) * 0.4,
      swayPhase: Math.random() * Math.PI * 2,
      swayFreq:  0.008 + Math.random() * 0.015,
      swayAmp:   0.4 + Math.random() * 0.9,
      alpha:     0.45 + Math.random() * 0.55,
    };
  }

  function tick() {
    if (!running) return;
    const w = canvas.width, h = canvas.height;

    /* 冬の空グラデーション（青灰〜水色〜白） */
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0,   '#9bb5d4');
    g.addColorStop(0.5, '#d0e4f5');
    g.addColorStop(1,   '#f0f7ff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    /* 雪を更新して描画 */
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      f.swayPhase += f.swayFreq;
      f.x += f.vx + Math.sin(f.swayPhase) * f.swayAmp;
      f.y += f.vy;

      if (f.y > h + 10)  { flakes[i] = makeFlake(w, h, true); continue; }
      if (f.x < -10)     f.x = w + 10;
      if (f.x > w + 10)  f.x = -10;

      ctx.globalAlpha = f.alpha;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    rafId = requestAnimationFrame(tick);
  }

  window.WinterBg = {
    start() {
      if (running) this.stop();
      canvas = document.createElement('canvas');
      Object.assign(canvas.style, {
        position: 'fixed', top: '0', left: '0',
        width: '100%', height: '100%',
        zIndex: '-1', pointerEvents: 'none',
      });
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d');

      resizeHandler = () => {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      window.addEventListener('resize', resizeHandler);
      resizeHandler();

      flakes  = Array.from({ length: COUNT }, () => makeFlake(canvas.width, canvas.height, false));
      running = true;
      rafId   = requestAnimationFrame(tick);
    },

    stop() {
      running = false;
      cancelAnimationFrame(rafId); rafId = null;
      if (resizeHandler) { window.removeEventListener('resize', resizeHandler); resizeHandler = null; }
      if (canvas) { canvas.remove(); canvas = null; }
      flakes = [];
    },
  };
})();
