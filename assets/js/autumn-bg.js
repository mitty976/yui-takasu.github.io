/**
 * autumn.js — 秋の空気（暖色ゆらぎ）
 */
(function () {
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);

  Object.assign(canvas.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: "-1",
    pointerEvents: "none"
  });

  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  let t = 0;

  function draw() {
    t += 0.003; // めちゃゆっくり

    const w = canvas.width;
    const h = canvas.height;

    const grad = ctx.createLinearGradient(
      0,
      0 + Math.sin(t) * 50,
      w,
      h + Math.cos(t) * 50
    );

    grad.addColorStop(0, "#f5e6d3");
    grad.addColorStop(0.5, "#e8c39e");
    grad.addColorStop(1, "#d4a373");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    requestAnimationFrame(draw);
  }

  draw();
})();