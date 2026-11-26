// ===== 円盤・演出の共通部分 =====
const E = window.ENGINE, S = window.SOLVE, THEMES = {};
let THEME = null;
const $ = (id) => document.getElementById(id);
const canvas = $('wheel'), TAU = Math.PI * 2;
let ctx = canvas.getContext('2d');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const CALM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (a, b) => a + Math.random() * (b - a);
const portrait = () => matchMedia('(max-width: 900px), (orientation: portrait)').matches;
let results = {}, selected = 'race', spinning = false;
const fixed = {}; // 指定した項目
let wheel = { list: [], angle: 0, speed: 0, tick: 0, win: -1, glow: 0 };
const item = S.item;
const candidates = (id, r = results) => S.candidates(id, r, fixed);

/* ========== 画面全体の演出（またたく星・流れる文字） ========== */
const fxC = $('fx'), fx = fxC.getContext('2d');
let parts = [], fxOn = false, fxLast = 0;
function kick() { if (!fxOn) { fxOn = true; fxLast = performance.now(); requestAnimationFrame(fxFrame); } }
function add(p) { if (!CALM && parts.length < 1400) { parts.push({ vx: 0, vy: 0, g: 0, drag: 1, rot: rnd(0, 6), vr: rnd(-5, 5), t: 0, ...p }); kick(); } }
// その場でまたたく星
function twinkles(n, at, size = 9, spread = 1) {
  for (let i = 0; i < n; i++) {
    const [x, y] = at(i);
    add({ kind: 'twinkle', x, y, vx: rnd(-10, 10), vy: rnd(-22, 4), vr: rnd(-.8, .8), size: rnd(.35, 1) * size, t: -rnd(0, spread), life: rnd(.7, 1.6), color: E.pick(THEME.sparks) });
  }
}
// 文字が from から to へ流れていく
function flyGlyphs(n, from, to, color) {
  for (let i = 0; i < n; i++) {
    const mx = (from.x + to.x) / 2 + rnd(-90, 90), my = Math.min(from.y, to.y) - rnd(20, 150);
    add({ kind: 'fly', b: Math.floor(rnd(1, 8)), x0: from.x + rnd(-14, 14), y0: from.y + rnd(-14, 14), cx: mx, cy: my, x1: to.x + rnd(-40, 40), y1: to.y + rnd(-8, 8), x: 0, y: 0, vr: rnd(-3, 3), size: rnd(5, 10), t: -i * .022, life: rnd(.5, .7), color: E.pick(color) });
  }
}
function fxFrame(now) {
  const dt = Math.min(0.05, (now - fxLast) / 1000), W = innerWidth, H = innerHeight;
  fxLast = now;
  if (fxC.width !== W || fxC.height !== H) { fxC.width = W; fxC.height = H; }
  fx.clearRect(0, 0, W, H);
  fx.globalCompositeOperation = THEME.blend || 'lighter';
  parts = parts.filter((p) => (p.t += dt) < p.life);
  for (const p of parts) {
    const k = p.t / p.life;
    if (k < 0) continue;
    p.vx *= Math.exp(-p.drag * dt); p.vy = p.vy * Math.exp(-p.drag * dt) + p.g * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    if (p.kind === 'fly') { const q = 1 - k; p.x = q * q * p.x0 + 2 * q * k * p.cx + k * k * p.x1; p.y = q * q * p.y0 + 2 * q * k * p.cy + k * k * p.y1; }
    fx.save();
    fx.translate(p.x, p.y);
    fx.fillStyle = fx.strokeStyle = p.color;
    fx.globalAlpha = 1 - k ** 2;
    if (p.draw) p.draw(fx, p, k);
    else if (p.kind === 'twinkle') {
      const s = p.size * Math.sin(k * Math.PI);
      fx.globalAlpha = Math.sin(k * Math.PI);
      fx.rotate(p.rot * .12);
      fx.beginPath();
      for (let i = 0; i < 8; i++) { const q = i % 2 ? s * .16 : s * (i % 4 ? 1 : 1.6), a = (i * Math.PI) / 4; fx.lineTo(Math.sin(a) * q, Math.cos(a) * q); }
      fx.fill();
      fx.globalAlpha *= .3; fx.beginPath(); fx.arc(0, 0, s * .6, 0, TAU); fx.fill();
    } else {
      // 魔法文字：直線だけの印
      fx.globalAlpha = Math.sin(k * Math.PI);
      fx.rotate(p.rot * .2); fx.lineWidth = 1.8;
      const h = p.size;
      fx.beginPath(); fx.moveTo(0, -h); fx.lineTo(0, h);
      if (p.b & 1) { fx.moveTo(0, -h); fx.lineTo(h * .8, 0); }
      if (p.b & 2) { fx.moveTo(0, 0); fx.lineTo(-h * .8, h * .7); }
      if (p.b & 4) { fx.moveTo(-h * .6, -h * .4); fx.lineTo(h * .6, -h * .4); }
      fx.stroke();
    }
    fx.restore();
  }
  if (parts.length) requestAnimationFrame(fxFrame); else { fxOn = false; fx.clearRect(0, 0, W, H); }
}
const center = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; };
// 円盤の中心・半径・針先（画面の座標）
function wheelPos() {
  const r = canvas.getBoundingClientRect(), c = r.width / 2, R = c * GEO.R;
  const x = r.left + c, y = r.top + c * (1 + GEO.cy);
  return { x, y, R, tipY: y - R * GEO.ri };
}

/* ========== 円盤 ========== */
const GEO = { R: 0.75, cy: -0.03, ri: 0.83, hub: 0.36 };
let INK, GEM;
function gold(r) {
  const g = ctx.createLinearGradient(-r, -r, r, r);
  THEME.metal.map((c, i, a) => [i / (a.length - 1), c]).forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}
function ring(r, w) {
  const arc = (rr, lw, s) => { ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.lineWidth = lw; ctx.strokeStyle = s; ctx.stroke(); };
  arc(r, w + 2, INK); arc(r, w, gold(r)); arc(r + w * 0.22, Math.max(1, w * 0.16), 'rgba(255,248,230,.8)'); arc(r - w * 0.34, Math.max(1, w * 0.14), 'rgba(120,66,72,.5)');
}
// 面取りした星・菱形。inner が小さいほど鋭い
function facet(x, y, rx, ry, inner = 0.26, n = 4, cols = THEME.facets) {
  ctx.save(); ctx.translate(x, y);
  const pt = (i) => { const a = (i * Math.PI) / n - Math.PI / 2, q = i % 2 ? inner : 1; return [Math.cos(a) * rx * q, Math.sin(a) * ry * q]; };
  ctx.beginPath(); for (let i = 0; i < n * 2; i++) ctx.lineTo(...pt(i)); ctx.closePath();
  ctx.lineWidth = 2.4; ctx.strokeStyle = INK; ctx.lineJoin = 'miter'; ctx.miterLimit = 12; ctx.stroke();
  for (let i = 0; i < n * 2; i++) {
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(...pt(i)); ctx.lineTo(...pt(i + 1)); ctx.closePath();
    ctx.fillStyle = cols[i % cols.length]; ctx.fill();
  }
  ctx.restore();
}
const gem = (x, y, rx, ry) => facet(x, y, rx, ry, 0.71, 2 * 2, GEM);
const diamond = (x, y, rx, ry) => facet(x, y, rx, ry, 0.71);
function poly(pts, fill, lw = 0, stroke = INK) {
  ctx.beginPath(); pts.forEach((p) => ctx.lineTo(...p)); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
/* 盤面の文字。日本語は縦書き、英語・フランス語は1文字ずつ積むと読めないので、
   扇の向きに沿わせた横書きにする */
const isJP = () => (window.__LANG || 'ja') === 'ja';
/* 値の名前を表示用に訳す。スタイル側の演出からも使う */
window.tname = (v) => window.I18N.LX(typeof v === 'string' ? v : v.name, window.__LANG || 'ja');
function wheelText(text, yTop, room, maxFs, spin = 0) {
  if (isJP()) return verticalText(text, yTop, room, maxFs);
  ctx.save();
  /* 文字数でサイズを変えるとバラバラに見えるので、盤の大きさだけで決める固定サイズにする */
  const fs = maxFs * 1.1;
  ctx.font = `700 ${fs}px ${THEME.font || '"Yu Mincho", serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  /* 扇に収まらない語は、単語の切れ目で2行に分ける */
  let rows = [text];
  if (ctx.measureText(text).width > room) {
    const w = text.split(/(?<=[ -])/);
    if (w.length > 1) {
      let at = 1, gap = Infinity;
      for (let i = 1; i < w.length; i++) {
        const d = Math.abs(ctx.measureText(w.slice(0, i).join('')).width - ctx.measureText(w.slice(i).join('')).width);
        if (d < gap) { gap = d; at = i; }
      }
      rows = [w.slice(0, at).join('').trim(), w.slice(at).join('').trim()];
    } else {
      /* Anthropomorphe のように切れ目のない長い語は、真ん中でハイフンを入れて分ける */
      const t = rows[0], half = Math.ceil(t.length / 2);
      rows = [t.slice(0, half) + '-', t.slice(half)];
    }
    /* それでも収まらないときだけ、はみ出さないところまで縮める */
    const over = Math.max(...rows.map((r) => ctx.measureText(r).width)) / room;
    if (over > 1) ctx.font = `700 ${fs / over}px ${THEME.font || '"Yu Mincho", serif'}`;
  }

  /* 盤の左半分に来た扇はそのまま描くと逆さになるので、読める向きへ回し直す */
  let a = spin % TAU;
  if (a > Math.PI) a -= TAU;
  if (a < -Math.PI) a += TAU;
  const flip = a < 0;
  ctx.translate(0, yTop + room / 2);
  ctx.rotate(flip ? Math.PI / 2 : -Math.PI / 2);
  rows.forEach((row, i) => ctx.fillText(row, 0, (i - (rows.length - 1) / 2) * fs * 1.08));
  ctx.restore();
}
// 縦書きの文字を外側から中心へ積む
function verticalText(text, yTop, room, maxFs) {
  const chars = [...text], fs = Math.min(maxFs, room / (chars.length * 1.05));
  ctx.font = `700 ${fs}px ${THEME.font || '"Yu Mincho", serif'}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  chars.forEach((ch, i) => {
    ctx.save();
    ctx.translate(0, yTop + fs * (0.55 + i * 1.05));
    if (/[ー（）／]/.test(ch)) ctx.rotate(Math.PI / 2);
    else if (/[ァィゥェォッャュョぁぃぅぇぉっゃゅょ]/.test(ch)) ctx.translate(fs * 0.1, -fs * 0.1);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
}
function sectors(R, Ri, tones) {
  const n = wheel.list.length, step = TAU / n;
  ctx.beginPath(); ctx.arc(0, 0, Ri, 0, TAU); ctx.fillStyle = tones[0]; ctx.fill();
  THEME.under?.(Ri);
  for (let i = 0; i < n; i++) {
    const v = wheel.list[i], odd = !THEME.multi && n % 2 && i === n - 1, dark = !THEME.multi && !odd && i % 2 === 0;
    ctx.save();
    ctx.rotate(wheel.angle + i * step);
    const a0 = -Math.PI / 2 - step / 2, a1 = a0 + step;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, Ri, a0, a1); ctx.closePath();
    ctx.fillStyle = THEME.multi ? tones[i === n - 1 && n % tones.length === 1 ? 1 : i % tones.length] : odd ? tones[2] : tones[dark ? 0 : 1]; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = THEME.seam || 'rgba(50,28,40,.5)'; ctx.stroke();
    (v.colors || []).forEach((h, k) => {
      const w = step / v.colors.length;
      ctx.beginPath(); ctx.arc(0, 0, Ri, a0 + w * k, a0 + w * (k + 1)); ctx.arc(0, 0, Ri * 0.92, a0 + w * (k + 1), a0 + w * k, true); ctx.closePath();
      ctx.fillStyle = h; ctx.fill();
    });
    if (i === wheel.win && THEME.paintWin) {
      ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, Ri, a0, a1); ctx.closePath(); ctx.clip();
      THEME.paintWin(Ri); ctx.restore();
    } else if (i === wheel.win) {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, Ri, a0, a1); ctx.closePath();
      ctx.fillStyle = `rgba(255,221,148,${Math.min(1, 0.55 + 0.45 * wheel.glow)})`; ctx.fill();
      ctx.lineWidth = 5 * wheel.glow; ctx.strokeStyle = '#fff3c9'; ctx.stroke();
    }
    ctx.fillStyle = (dark || odd) && !(i === wheel.win && wheel.glow > 0.4) ? (THEME.darkText || '#fff3e2') : i === wheel.win && wheel.glow > 0.4 && THEME.winText ? THEME.winText : THEME.text;
    const top = v.colors ? Ri * 0.87 : Ri * 0.87;
    wheelText(window.I18N.LX(v.name, window.__LANG || 'ja'), -top, top - Ri * (GEO.hub + 0.06), Math.min(R * 0.078, step * Ri * 0.46), wheel.angle + i * step);
    ctx.restore();
  }
  // 縁の影
  THEME.over?.(Ri);
  const g = ctx.createRadialGradient(0, 0, Ri * 0.86, 0, 0, Ri);
  g.addColorStop(0, 'rgba(35,18,25,0)'); g.addColorStop(1, 'rgba(35,18,25,.38)');
  ctx.beginPath(); ctx.arc(0, 0, Ri, 0, TAU); ctx.fillStyle = g; ctx.fill();
  // 高速回転中の光の筋
  if (THEME.streaks && wheel.speed > 2) {
    const k = Math.min(1, wheel.speed / 22);
    ctx.save(); ctx.rotate(wheel.angle * 1.3); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      ctx.beginPath(); ctx.arc(0, 0, Ri * (0.5 + (i * 0.37) % 0.48), i * 2.1, i * 2.1 + 0.5 + k);
      ctx.lineWidth = 2 + (i % 3) * 2; ctx.strokeStyle = `rgba(255,220,160,${0.4 * k})`; ctx.stroke();
    }
    ctx.restore();
  }
}
function draw() {
  const size = canvas.clientWidth, dpr = devicePixelRatio || 1, px = Math.round(size * dpr);
  if (!size) return;
  if (canvas.width !== px) canvas.width = canvas.height = px;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, (size / 2) * (1 + GEO.cy));
  const R = (size / 2) * GEO.R;
  THEME.behind(R);
  sectors(R, R * GEO.ri, THEME.tones);
  THEME.frame(R, R * GEO.ri);
  ctx.restore();
}
// 針。区切りを越えるたびに弾かれて揺れる
function pointer(y, fn) { ctx.save(); ctx.translate(0, y); ctx.rotate(-wheel.tick * 0.16); fn(); ctx.restore(); }

// 溜め → 加速 → 長い減速 → 決定
function spinTo(list, index, ms) {
  wheel = { list, angle: 0, speed: 0, tick: 0, win: -1, glow: 0 };
  const step = TAU / list.length, back = 0.28;
  const target = TAU * 8 - index * step + rnd(-0.25, 0.25) * step;
  return new Promise((done) => {
    const t0 = performance.now(), pull = CALM ? 0 : 420;
    let last = 0, lastT = t0, lastSec = 0;
    (function frame(t) {
      const e = Math.max(0, t - t0), p = Math.max(0, Math.min(1, (e - pull) / ms));
      wheel.angle = e < pull ? -back * Math.sin((e / pull) * (Math.PI / 2)) : -back + (target + back) * (1 - (1 - p) ** 5);
      const dt = Math.max(0.001, (t - lastT) / 1000);
      wheel.speed = Math.abs(wheel.angle - last) / dt;
      const sec = Math.floor(wheel.angle / step + 0.5);
      if (sec !== lastSec) wheel.tick = 1;
      wheel.tick *= Math.exp(-dt * 14);
      last = wheel.angle; lastT = t; lastSec = sec;
      if (wheel.speed > 3 && !CALM) {
        // 回転中の演出
        THEME.spinFx(wheelPos(), dt);
      }
      draw();
      if (p < 1) return requestAnimationFrame(frame);
      wheel.win = index; wheel.speed = wheel.tick = 0;
      done();
    })(t0);
  });
}
function glowWin() {
  const mine = wheel, t0 = performance.now();
  (function f(t) {
    if (wheel !== mine) return;
    const k = Math.max(0, t - t0) / 1800;
    wheel.glow = k < 1 ? 0.45 + 0.55 * Math.abs(Math.cos(k * 9)) * (1 - k * 0.5) : 0.45;
    draw();
    if (k < 1) requestAnimationFrame(f);
  })(t0);
}
// 決まった瞬間：演出は見た目ごとに持つ
function impact(v) {
  glowWin();
  const el = $('reveal');
  el.style.setProperty('--n', Math.max(4, [...window.tname(v)].length));
  if (!CALM) THEME.impact(v, wheelPos(), el);
}

