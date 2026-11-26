const STARS = Array.from({ length: 240 }, () => ({ x: Math.random(), y: Math.random() ** 1.3, r: Math.random() ** 3 * 1.7 + .4, p: Math.random() * 6.28, s: Math.random() * 1.4 + .3 }));
THEMES.tarot = {
  label: 'タロット', all: '運命をすべて引く', words: ['', '', ''],
  // またたく星と流れ星
  ambient(t, W, H) {
    const m = t % 5200 / 900, k = Math.floor(t / 5200);
    STARS.forEach((s) => { sx.globalAlpha = .55 + .4 * Math.sin(t / 1000 * s.s + s.p); sx.fillStyle = s.r > 1.4 ? '#fbe3c0' : '#e8dcff'; sx.beginPath(); sx.arc(s.x * W, s.y * H, s.r, 0, 7); sx.fill(); });
    if (m >= 1) return;
    const x = W * (((k * 37) % 70) / 100 + m * .3), y = H * (((k * 23) % 25) / 100 + m * .22), g = sx.createLinearGradient(x, y, x - 150, y - 90);
    g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)');
    sx.globalAlpha = Math.sin(m * Math.PI); sx.strokeStyle = g; sx.lineWidth = 2; sx.beginPath(); sx.moveTo(x, y); sx.lineTo(x - 150, y - 90); sx.stroke();
  },
  tones: ['#4a3a70', '#d3bfe0', '#8a71ad'],
  ink: '#5a3340', text: '#3a1f50', streaks: true,
  metal: ['#fff0d6', '#e7bd8c', '#c08a72', '#f6dcb6', '#cf9b78', '#f9e4c4'],
  facets: ['#fff1da', '#d9a582', '#f1cfa6', '#b87f70'],
  gem: ['#c99bff', '#6a2bb0', '#9a55e0', '#4b1a86'],
  sparks: ['#ffe9b8', '#fff8e6', '#e9d4ff'],
  // 回転中：縁に星がまたたく
  spinFx(w) { if (Math.random() < .5) twinkles(1, () => { const a = rnd(0, TAU), q = w.R * rnd(.98, 1.14); return [w.x + Math.cos(a) * q, w.y + Math.sin(a) * q]; }, 9, 0); },
  // 決定：円盤のまわりに星が静かに灯る
  impact(v, w, el) {
    el.textContent = window.tname(v);
    twinkles(54, () => { const a = rnd(0, TAU), q = w.R * rnd(.35, 1.3); return [w.x + Math.cos(a) * q, w.y + Math.sin(a) * q]; }, 15, .9);
    el.animate([
      { opacity: 0, transform: 'translate(-50%,-46%) scale(.92)', filter: 'blur(10px)' },
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', filter: 'blur(0)', offset: .3 },
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .75 },
      { opacity: 0, transform: 'translate(-50%,-53%) scale(1)', filter: 'blur(6px)' },
    ], { duration: 2000, easing: 'ease-out' });
  },
  pop(it, v, p) { twinkles(9, () => [p.x + rnd(-.56, .56) * p.w, p.y + rnd(-.85, .75) * p.w], 11, .5); },
  async finish() { twinkles(80, () => [rnd(0, innerWidth), rnd(0, innerHeight)], 13, 2); },
  // 集める → 切る → 配る
  async before() {
    const c = center($('list')), all = Object.values(cards);
    await Promise.all(all.map((el, i) => {
      const p = center(el), dx = c.x - p.x, dy = c.y - p.y, z = rnd(-7, 7);
      const at = (x, y, r) => `translate(${dx + x}px, ${dy + y}px) rotate(${r}deg)`;
      el.style.zIndex = 5;
      return el.animate([
        { transform: 'none', offset: 0, easing: 'cubic-bezier(.6,0,.8,.4)' },
        { transform: at(0, 0, 360 + z), offset: .26 },
        ...[.34, .42, .5, .58].map((offset, k) => ({ transform: at((i + k) % 2 ? 90 : -90, rnd(-14, 14), 360 + ((i + k) % 2 ? 14 : -14)), offset })),
        { transform: at(0, 0, 360 + z), offset: .64, easing: 'cubic-bezier(.1,.8,.3,1)' },
        { transform: 'translate(0,0) rotate(720deg)', offset: Math.min(1, .78 + i * .0155) },
        { transform: 'translate(0,0) rotate(720deg)', offset: 1 },
      ].filter((k, n, a) => !n || k.offset > a[n - 1].offset || k === a.at(-1)), { duration: 2400 }).finished.then(() => { el.style.zIndex = ''; });
    }).concat(wait(1500).then(() => twinkles(40, () => [c.x + rnd(-200, 200), c.y + rnd(-220, 220)], 13, .9))));
  },
  // 背面：リボンと飾り鎖
  behind(R) {
    for (const s of [-1, 1]) {
      const x = s * R * .68, w = R * .23;
      poly([[x - w / 2, R * .5], [x + w / 2, R * .5], [x + w / 2, R * (s < 0 ? 1.06 : 1.28)], [x, R * 1.15], [x - w / 2, R * (s < 0 ? 1.28 : 1.06)]], gold(R), 2);
      const q = w * .34;
      poly([[x - q, R * .5], [x + q, R * .5], [x + q, R * (s < 0 ? 1.04 : 1.17)], [x, R * 1.085], [x - q, R * (s < 0 ? 1.17 : 1.04)]], '#57437f');
      facet(x, R * .96, R * .05, R * .085, .3);
      ctx.beginPath(); ctx.moveTo(s * R * .52, R * .86); ctx.quadraticCurveTo(s * R * .32, R * 1.3, s * R * .05, R * 1.02); ctx.moveTo(s * R * .52, R * .86); ctx.quadraticCurveTo(s * R * .3, R * 1.16, s * R * .05, R * 1.0);
      ctx.lineWidth = 2; ctx.strokeStyle = '#d9a582'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * R * .99, 0); ctx.lineTo(s * R * .99, R * .6); ctx.stroke();
      diamond(s * R * .99, R * .68, R * .035, R * .085);
    }
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fillStyle = '#3d2f63'; ctx.fill();
  },
  frame(R, Ri) {
    // 外枠（回らない）と月の満ち欠け
    const mid = (R + Ri) / 2;
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI / 2 + (i + .5) * TAU / 14, x = Math.cos(a) * mid, y = Math.sin(a) * mid, q = R * .036;
      if (i % 2) { facet(x, y, q * .9, q * 1.4, .24); continue; }
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.arc(0, 0, q, 0, TAU); ctx.fillStyle = '#f2cfa4'; ctx.fill(); ctx.clip();
      ctx.beginPath(); ctx.arc(q * (.2 + (i % 4) * .4), 0, q * .95, 0, TAU); ctx.fillStyle = '#3d2f63'; ctx.fill(); ctx.restore();
    }
    ring(R, R * .034); ring(Ri, R * .026);
    // 回転中は枠も光る
    if (wheel.speed > 2) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.lineWidth = R * .05; ctx.strokeStyle = `rgba(255,190,110,${Math.min(.55, wheel.speed / 45)})`; ctx.stroke(); ctx.restore(); }
    for (const s of [-1, 1]) facet(s * mid, 0, R * .115, R * .21, .2);
    // 中心：三日月と星
    const h = Ri * GEO.hub;
    ctx.beginPath(); ctx.arc(0, 0, h, 0, TAU); ctx.fillStyle = '#34265a'; ctx.fill();
    ring(h, R * .022);
    ctx.save(); ctx.rotate(-wheel.angle * .5);
    ctx.beginPath(); ctx.arc(0, 0, h * .8, 0, TAU); ctx.lineWidth = 1.6; ctx.strokeStyle = '#d9a582'; ctx.stroke();
    for (let i = 0; i < 8; i++) { ctx.rotate(TAU / 8); diamond(0, -h * .8, h * .05, h * .07); }
    ctx.restore();
    ctx.save(); ctx.rotate(Math.sin(wheel.angle * .5) * .25);
    ctx.beginPath(); ctx.arc(-h * .08, 0, h * .56, -.95, .95, true); ctx.arc(h * .13, 0, h * .46, .99, -.99, false); ctx.closePath(); ctx.fillStyle = gold(h); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.translate(h * .2, -h * .05); ctx.rotate(wheel.angle); facet(0, 0, h * .28, h * .28, .3, 8); ctx.restore();
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(i * Math.PI / 2); facet(0, -h, R * .035, R * .075, .4); ctx.restore(); }
    // 下の菱形飾り
    diamond(0, R * .99, R * .17, R * .18);
    facet(0, R * .99, R * .115, R * .125, .71, 4, ['#4a3a70', '#3a2b60']);
    facet(0, R * .99, R * .075, R * .085, .22, 8);
    diamond(0, R * 1.25, R * .035, R * .075);
    // 針：太陽
    pointer(-R * 1.0, () => {
      for (let i = -5; i <= 5; i++) {
        if (!i) continue;
        ctx.save(); ctx.rotate(i * .4); poly([[-R * .018, -R * .06], [0, -R * (i % 2 ? .17 : .23)], [R * .018, -R * .06]], gold(R * .2), 1.4); ctx.restore();
      }
      poly([[-R * .026, 0], [0, -R * .3], [R * .026, 0]], gold(R * .3), 1.4);
      poly([[-R * .045, R * .04], [0, R * .2], [0, R * .04]], '#fff1da', 1.4);
      poly([[R * .045, R * .04], [0, R * .2], [0, R * .04]], '#c99474', 1.4);
      ctx.beginPath(); ctx.arc(0, 0, R * .085, 0, TAU); ctx.fillStyle = gold(R * .09); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, R * .085, Math.PI / 2, -Math.PI / 2); ctx.fillStyle = 'rgba(255,248,226,.55)'; ctx.fill();
    });
  },
};
