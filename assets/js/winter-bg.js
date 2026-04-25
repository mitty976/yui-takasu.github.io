/**
 * winter.js — 冬の空気（ほぼ静止）
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
    t += 0.0008; // ほぼ止まってるレベル

    const w = canvas.width;
    const h = canvas.height;

    const grad = ctx.createLinearGradient(
      0,
      0 + Math.sin(t) * 20,
      w,
      h + Math.cos(t) * 20
    );

    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.5, "#eef5ff");
    grad.addColorStop(1, "#dfe9f5");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    requestAnimationFrame(draw);
  }

  draw();
})();