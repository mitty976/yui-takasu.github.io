(function () {
  console.log("spring-bg loaded");

  const canvas = document.getElementById("bg");
  if (!canvas) {
    console.error("canvas not found");
    return;
  }

  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  function rand(a, b) {
    return Math.random() * (b - a) + a;
  }

  const lights = [];

  for (let i = 0; i < 12; i++) {
    lights.push({
      x: rand(0, canvas.width),
      y: rand(0, canvas.height),
      r: rand(40, 120),
      vy: rand(0.05, 0.1),
      vx: rand(-0.05, 0.05),
      alpha: rand(0.05, 0.15),
      phase: rand(0, Math.PI * 2)
    });
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    lights.forEach(l => {
      l.phase += 0.01;

      l.x += l.vx + Math.sin(l.phase) * 0.2;
      l.y -= l.vy;

      if (l.y < -50) {
        l.y = canvas.height + 50;
        l.x = rand(0, canvas.width);
      }

      const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      g.addColorStop(0, `rgba(255,255,220,${l.alpha})`);
      g.addColorStop(1, `rgba(255,255,220,0)`);

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(loop);
  }

  loop();
})();