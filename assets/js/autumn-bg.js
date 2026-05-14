/**
 * autumn-bg.js — 秋の落ち葉エフェクト
 * 使い方: AutumnBg.start() / AutumnBg.stop()
 */
(function () {
  let canvas, ctx, running = false, rafId = null, resizeHandler = null;
  let leaves = [];

  const COUNT  = 45;
  const COLORS = ['#e85d04','#f48c06','#dc2f02','#e9c46a','#a44200','#c77b1a','#d4a017','#b5541a'];

  function makeLeaf(w, h, fromTop) {
    return {
      x:          Math.random() * w,
      y:          fromTop ? -20 - Math.random() * 40 : Math.random() * h,
      size:       7 + Math.random() * 11,
      vy:         0.6 + Math.random() * 1.4,
      vx:         (Math.random() - 0.5) * 0.6,
      rot:        Math.random() * Math.PI * 2,
      rotV:       (Math.random() - 0.5) * 0.05,
      swayPhase:  Math.random() * Math.PI * 2,
      swayFreq:   0.015 + Math.random() * 0.02,
      swayAmp:    0.8 + Math.random() * 1.5,
      color:      COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha:      0.65 + Math.random() * 0.35,
    };
  }

  function drawLeaf(l) {
    const s = l.size;
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.rotate(l.rot);
    ctx.globalAlpha = l.alpha;

    /* 葉の形（四方にベジェ曲線） */
    ctx.fillStyle = l.color;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo( s * 0.70, -s * 0.20,  s * 0.50, s * 0.45);
    ctx.quadraticCurveTo( 0,         s * 0.85,  -s * 0.50, s * 0.45);
    ctx.quadraticCurveTo(-s * 0.70, -s * 0.20,  0,        -s);
    ctx.closePath();
    ctx.fill();

    /* 中央の葉脈 */
    ctx.strokeStyle = 'rgba(0,0,0,0.10)';
    ctx.lineWidth   = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.8);
    ctx.lineTo(0,  s * 0.6);
    ctx.stroke();

    ctx.restore();
  }

  function tick() {
    if (!running) return;
    const w = canvas.width, h = canvas.height;

    /* 秋の空グラデーション（クリーム〜柔らかいベージュ橙〜くすみテラコッタ） */
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0,    '#fefaf2');
    g.addColorStop(0.45, '#fde8c4');
    g.addColorStop(1,    '#d4956a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    /* 葉を更新して描画 */
    for (let i = 0; i < leaves.length; i++) {
      const l = leaves[i];
      l.swayPhase += l.swayFreq;
      l.x  += l.vx + Math.sin(l.swayPhase) * l.swayAmp;
      l.y  += l.vy;
      l.rot += l.rotV;

      if (l.y > h + 30) { leaves[i] = makeLeaf(w, h, true); continue; }
      if (l.x < -20)    l.x = w + 20;
      if (l.x > w + 20) l.x = -20;

      drawLeaf(l);
    }

    rafId = requestAnimationFrame(tick);
  }

  window.AutumnBg = {
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

      leaves  = Array.from({ length: COUNT }, () => makeLeaf(canvas.width, canvas.height, false));
      running = true;
      rafId   = requestAnimationFrame(tick);
    },

    stop() {
      running = false;
      cancelAnimationFrame(rafId); rafId = null;
      if (resizeHandler) { window.removeEventListener('resize', resizeHandler); resizeHandler = null; }
      if (canvas) { canvas.remove(); canvas = null; }
      leaves = [];
    },
  };
})();
