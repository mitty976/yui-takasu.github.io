// 筆跡の形を作る：毛の1本ずつの線を重ね、端をかすれさせる
(function () {
  for (let n = 1; n <= 3; n++) {
    let seed = n * 977;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const c = document.createElement('canvas'), W = (c.width = 600), H = (c.height = 120), x = c.getContext('2d');
    const lines = 46, bend = (n - 2) * 9;
    let l = 24, e = 30;
    for (let i = 0; i < lines; i++) {
      const k = i / (lines - 1), edge = Math.abs(k - .5) * 2, y = 10 + k * (H - 20);
      // 端の位置は隣の毛と少しずつつながり、ところどころ飛び出す
      l = Math.max(4, Math.min(64, l + (r() - .5) * 24)); e = Math.max(4, Math.min(96, e + (r() - .5) * 34));
      const a = l + edge ** 3 * 34, b = W - e - edge ** 3 * 46;
      x.lineWidth = 3.6 + r() * 1.6; x.lineCap = 'round';
      x.beginPath(); x.moveTo(a, y); x.quadraticCurveTo(W / 2, y + bend, b, y + (n - 2) * 3); x.stroke();
      // 終わりのかすれ
      if (r() < .55) { x.globalCompositeOperation = 'destination-out'; x.lineWidth = 1 + r() * 1.6; const s = b - 30 - r() * 150; x.beginPath(); x.moveTo(s, y + bend * .4); x.lineTo(b + 8, y + (n - 2) * 3); x.stroke(); x.globalCompositeOperation = 'source-over'; }
    }
    document.documentElement.style.setProperty('--brush' + n, `url(${c.toDataURL()})`);
  }
})();
THEMES.grimoire = {
  label: '魔導書', all: '次の頁をめくる', words: ['未記入の頁', '名もなき者', 'まだ何も記されていない'],
  // 紙とインク、革、古い真鍮の色
  tones: ['#6e4a2c', '#e8d3a2', '#a88352'],
  ink: '#3b2413', text: '#3b2413',
  metal: ['#f3dfae', '#c79a4e', '#8d6228', '#e6c984', '#a87835', '#efd9a0'],
  facets: ['#f3dfae', '#a87835', '#dab76c', '#7d5522'],
  gem: ['#e9a04a', '#7e2f16', '#b8562a', '#5a1d0f'],
  sparks: ['#5a3517', '#7a4a1e', '#8a2f18', '#3b2413'],
  // 回転中：縁の魔法文字がはがれ、頁の上を漂う
  spinFx(w) {
    if (Math.random() > .35) return;
    const a = rnd(0, TAU), q = w.R * .95, s = Math.min(90, wheel.speed * 5);
    add({ kind: 'glyph', b: Math.floor(rnd(1, 8)), x: w.x + Math.cos(a) * q, y: w.y + Math.sin(a) * q, vx: -Math.sin(a) * s + Math.cos(a) * 26, vy: Math.cos(a) * s + Math.sin(a) * 26, drag: 1, vr: rnd(-2, 2), size: rnd(6, 11), life: rnd(1, 1.9), color: E.pick(THEME.sparks) });
  },
  // 当たりの扇形に、針先からインクが染みていく
  paintWin(Ri) {
    const k = Math.min(1, (performance.now() - wheel.hit) / 1300), q = Ri * 1.05 * (1 - (1 - k) ** 2);
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) { const a = (i / 60) * TAU, n = 1 + .07 * Math.sin(a * 5 + 1) + .05 * Math.sin(a * 11) + .03 * Math.sin(a * 23 + 2); ctx.lineTo(Math.cos(a) * q * n, -Ri + Math.sin(a) * q * n); }
    ctx.closePath();
    ctx.fillStyle = '#d9a13f'; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(140,82,22,.55)'; ctx.stroke();
  },
  // 決定：名前が一文字ずつ、紙片の上に書かれる
  impact(v, w, el) {
    wheel.hit = performance.now();
    el.replaceChildren(...[...window.tname(v)].map((ch, i) => {
      const s = document.createElement('span');
      s.textContent = ch;
      s.animate([{ opacity: 0, filter: 'blur(9px)', clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, filter: 'blur(0)', clipPath: 'inset(0 -10% 0 0)' }], { duration: 420, delay: 260 + i * 110, fill: 'backwards', easing: 'ease-out' });
      return s;
    }));
    const t = 'translate(-50%,-50%)';
    el.animate([
      { opacity: 1, transform: t, clipPath: 'inset(0 50% 0 50%)' },
      { opacity: 1, transform: t, clipPath: 'inset(0 0 0 0)', offset: .14 },
      { opacity: 1, transform: t, clipPath: 'inset(0 0 0 0)', offset: .86 },
      { opacity: 1, transform: t, clipPath: 'inset(0 50% 0 50%)' },
    ], { duration: 2200, easing: 'ease-in-out' });
  },
  // 円盤から文字が流れ、行に書き込まれる
  async pre(it, p) { const w = wheelPos(); flyGlyphs(12, w, { x: p.x - p.w * .2, y: p.y }, THEME.sparks); await wait(330); },
  pop(it, v, p, el) {
    el.querySelector('.value').animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 -5% 0 0)' }], { duration: 620, easing: 'linear' });
    el.animate([{ backgroundColor: 'rgb(217 161 63 / .5)' }, { backgroundColor: 'rgb(217 161 63 / 0)' }], { duration: 1300, easing: 'ease-out' });
    if (it.id === 'kind') $('kind').animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 -5% 0 0)' }], { duration: 900 });
    // 色が決まると、筆で1色ずつ塗られていく
    if (it.id === 'color') for (const box of [$('wash'), el.querySelector('.sw')]) [...box.children].forEach((i, n) => i.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 380, delay: n * 260, fill: 'backwards', easing: 'cubic-bezier(.3,.7,.3,1)' }));
  },
  flatName: true,
  blend: 'source-over', // 明るい紙の上でも粒が見えるように
  // 頁が次々とめくれ、魔法文字が舞い上がる
  async before() {
    const tall = portrait(), sp = $('spread');
    const r = sp.getBoundingClientRect(), x = r.left + r.width / 2, y = Math.min(innerHeight * .8, r.top + r.height * (tall ? .5 : .75));
    wheel.inscribe = 0; draw();
    for (let i = 0; i < 46; i++) add({ kind: 'glyph', b: Math.floor(rnd(1, 8)), t: -rnd(0, 1.3), x: tall ? rnd(r.left, r.right) : x + rnd(-160, 160), y, vx: rnd(-150, 150), vy: rnd(-330, -90), drag: .5, size: rnd(6, 15), life: rnd(1, 1.9), color: E.pick(THEME.sparks) });
    const turns = Array.from({ length: 7 }, (_, i) => {
      const leaf = document.createElement('div');
      leaf.className = 'page leaf';
      sp.append(leaf);
      const to = tall ? 'rotateX(180deg)' : 'rotateY(-180deg)', mid = tall ? 'rotateX(90deg)' : 'rotateY(-90deg)', from = tall ? 'rotateX(0)' : 'rotateY(0)';
      return leaf.animate([
        { transform: from, visibility: 'visible', filter: 'brightness(1)' },
        { transform: mid, visibility: 'visible', filter: 'brightness(.65)' },
        { transform: to, visibility: 'visible', filter: 'brightness(1)' },
      ], { duration: 780, delay: i * 190, easing: 'cubic-bezier(.45,.05,.4,1)' }).finished.then(() => leaf.remove());
    });
    await Promise.all(turns);
    await new Promise((done) => {
      const t0 = performance.now();
      (function f(t) { const k = Math.max(0, Math.min(1, (t - t0) / 1500)); wheel.inscribe = k; draw(); k < 1 ? requestAnimationFrame(f) : done(); })(t0);
    });
  },
  // 背面：角飾りのついた板としおり
  behind(R) {
    const b = R * .88;
    for (const s of [-1, 1]) {
      const x = s * R * .6, w = R * .27;
      poly([[x - w / 2, R * .6], [x + w / 2, R * .6], [x + w / 2, R * 1.3], [x, R * 1.18], [x - w / 2, R * 1.3]], '#c79a4e', 2);
      const q = w * .36;
      poly([[x - q, R * .6], [x + q, R * .6], [x + q, R * 1.21], [x, R * 1.11], [x - q, R * 1.21]], '#7a2f1c');
      facet(x, R * 1.03, R * .05, R * .09, .34);
    }
    ctx.beginPath(); ctx.roundRect(-b, -b, b * 2, b * 2, R * .04); ctx.fillStyle = '#5a3a20'; ctx.fill();
    ctx.lineWidth = R * .05 + 2; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = R * .05; ctx.strokeStyle = gold(R); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-b * .93, -b * .93, b * 1.86, b * 1.86, R * .03); ctx.lineWidth = 1.5; ctx.strokeStyle = '#d6b36c'; ctx.stroke();
    for (const x of [-1, 1]) for (const y of [-1, 1]) facet(x * b * .83, y * b * .83, R * .06, R * .06, .3);
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fillStyle = '#54351d'; ctx.fill();
  },
  frame(R, Ri) {
    const mid = (R + Ri) / 2;
    // 外枠の魔法文字：円盤と逆向きに流れ、回転中は光る
    ctx.save(); ctx.rotate(-wheel.angle * .35);
    ctx.strokeStyle = wheel.speed > 2 ? '#ffe2a8' : '#d6b36c'; ctx.lineWidth = 1.6;
    const ins = wheel.inscribe ?? 1;
    for (let i = 0; i < 44; i++) {
      const born = ((i * 17) % 44) / 44 * .72, ink = Math.max(0, Math.min(1, (ins - born) / .28));
      if (!ink) continue;
      ctx.save(); ctx.rotate(i * TAU / 44); ctx.translate(0, -mid);
      const h = R * .028 * (1.5 - .5 * ink), k = (i * 37 + 11) % 32;
      ctx.globalAlpha = ink;
      if (ink < 1) { ctx.fillStyle = `rgba(255,226,168,${.35 * (1 - ink)})`; ctx.beginPath(); ctx.arc(0, 0, h * 1.4, 0, TAU); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(0, h);
      if (k & 1) { ctx.moveTo(0, -h); ctx.lineTo(h * .9, 0); }
      if (k & 2) { ctx.moveTo(0, 0); ctx.lineTo(-h * .8, h * .8); }
      if (k & 4) { ctx.moveTo(-h * .7, -h * .5); ctx.lineTo(h * .7, -h * .5); }
      if (k & 8) { ctx.moveTo(0, h); ctx.lineTo(h * .8, h * .3); }
      ctx.stroke(); ctx.restore();
    }
    ctx.restore();
    ring(R, R * .036); ring(Ri, R * .026);
    for (const s of [-1, 1]) { facet(s * R * 1.0, 0, R * .16, R * .2, .4); diamond(s * R * 1.0, 0, R * .052, R * .07); gem(s * R * 1.0, 0, R * .034, R * .048); }
    // 中心：羅針盤の星
    const h = Ri * GEO.hub;
    ctx.beginPath(); ctx.arc(0, 0, h, 0, TAU); ctx.fillStyle = '#5a3a20'; ctx.fill(); ring(h, R * .022);
    ctx.beginPath(); ctx.arc(0, 0, h * .7, 0, TAU); ctx.lineWidth = 2.5; ctx.strokeStyle = '#d6b36c'; ctx.stroke();
    ctx.save(); ctx.rotate(wheel.angle); ctx.save(); ctx.rotate(Math.PI / 4); facet(0, 0, h * .44, h * .44, .2); ctx.restore(); facet(0, 0, h * .6, h * .78, .19); ctx.restore();
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(i * Math.PI / 2); facet(0, -h, R * .045, R * .09, .38); ctx.restore(); }
    // 下：本の紋章
    ctx.save(); ctx.translate(0, R * 1.0);
    const shield = (k, fill, lw) => { ctx.beginPath(); ctx.arc(0, 0, R * .21 * k, Math.PI, 0); ctx.lineTo(R * .21 * k, R * .07 * k); ctx.quadraticCurveTo(R * .07 * k, R * .09 * k, 0, R * .2 * k); ctx.quadraticCurveTo(-R * .07 * k, R * .09 * k, -R * .21 * k, R * .07 * k); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke(); } };
    shield(1, gold(R * .2), 2.5); shield(.84, '#5a3a20', 1.5);
    ctx.lineWidth = 2; ctx.strokeStyle = '#f0d99c'; ctx.lineJoin = 'round';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -R * .05); ctx.quadraticCurveTo(s * R * .05, -R * .1, s * R * .11, -R * .08); ctx.lineTo(s * R * .11, R * .03); ctx.quadraticCurveTo(s * R * .05, R * .01, 0, R * .06); ctx.closePath(); ctx.stroke(); }
    ctx.restore();
    // 針：宝石
    pointer(-R * 1.02, () => {
      poly([[0, -R * .2], [R * .13, 0], [0, R * .23], [-R * .13, 0]], gold(R * .2), 2.5);
      poly([[0, R * .23], [R * .13, 0], [0, R * .08]], 'rgba(100,62,20,.5)');
      gem(0, -R * .02, R * .085, R * .12);
    });
  },
};
