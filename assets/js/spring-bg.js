(function () {
  const canvas = document.getElementById("bg");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  function rand(a, b) { return Math.random() * (b - a) + a; }

  /* 薄いゴールドのグロー（大きくぼんやり） */
  const glows = Array.from({ length: 12 }, () => ({
    baseX:     rand(0, canvas.width),
    baseY:     rand(0, canvas.height),
    r:         rand(180, 380),
    swayAmp:   rand(10, 25),
    swaySpeed: rand(0.008, 0.020),
    swayPhase: rand(0, Math.PI * 2),
    alphaBase: rand(0.06, 0.13),
    alphaPhase: rand(0, Math.PI * 2),
    alphaSpeed: rand(0.004, 0.010),
  }));

  /* 葉の影 */
  const shadows = Array.from({ length: 180 }, () => {
    const rx = rand(40, 180);
    return {
      baseX:     rand(-50, canvas.width  + 50),
      baseY:     rand(-50, canvas.height + 50),
      rx,
      ry:        rx * rand(0.3, 0.6),
      angle:     rand(0, Math.PI),
      swayAmp:   rand(8, 30),
      swaySpeed: rand(0.015, 0.040),
      swayPhase: rand(0, Math.PI * 2),
      alpha:     rand(0.06, 0.14),
    };
  });

  function loop() {
    /* 温かいクリーム白 */
    ctx.fillStyle = '#FAF8F3';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* ゴールドグロー層 */
    glows.forEach(g => {
      g.swayPhase  += g.swaySpeed;
      g.alphaPhase += g.alphaSpeed;

      const x = g.baseX + Math.sin(g.swayPhase) * g.swayAmp;
      const y = g.baseY + Math.sin(g.swayPhase * 0.6) * (g.swayAmp * 0.4);
      const a = g.alphaBase * (0.6 + 0.4 * Math.sin(g.alphaPhase));

      const gr = ctx.createRadialGradient(x, y, 0, x, y, g.r);
      gr.addColorStop(0,   `rgba(240,210,140,${a})`);
      gr.addColorStop(0.5, `rgba(238,205,130,${a * 0.45})`);
      gr.addColorStop(1,   `rgba(235,200,120,0)`);

      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(x, y, g.r, 0, Math.PI * 2);
      ctx.fill();
    });

    /* 葉影層 */
    shadows.forEach(s => {
      s.swayPhase += s.swaySpeed;

      const x = s.baseX + Math.sin(s.swayPhase) * s.swayAmp;
      const y = s.baseY + Math.sin(s.swayPhase * 0.7) * (s.swayAmp * 0.3);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(s.angle + Math.sin(s.swayPhase * 0.5) * 0.15);
      ctx.scale(1, s.ry / s.rx);

      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s.rx);
      g.addColorStop(0,    `rgba(148,143,128,${s.alpha})`);
      g.addColorStop(0.55, `rgba(155,150,136,${s.alpha * 0.50})`);
      g.addColorStop(1,    `rgba(162,158,144,0)`);

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, s.rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(loop);
  }

  loop();
})();
