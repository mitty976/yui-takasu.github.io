
/* ========== 一覧 ========== */
const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];

/* ===== 表示言語 =====
   内部の処理は日本語の名前のまま動かし、画面に出す直前にだけ訳す。
   U…画面の文言や項目名、V…ルーレットで出た値、F…語順が変わる文 */
let LANG = 'ja';
window.__LANG = LANG; /* core.js など他のファイルからも見るため */
const U = (s) => window.I18N.L(s, LANG);
const V = (s) => window.I18N.LX(s, LANG);
const F = (k, ...a) => window.I18N.F(k, LANG, ...a);

const lines = (v) => (v.items ? v.items.flatMap((x) => V(x).replace(/・/g, '・\n').split('\n'))
  : v.odd ? [U('オッドアイ'), v.odd.map(V).join('／')]
  : V(v.name).replace(/([×・／])/g, '$1\n').replace(/（/g, '\n（').split('\n').filter(Boolean));
const cards = {};
E.ITEMS.forEach((it, i) => {
  const d = document.createElement('div');
  d.className = 'card';
  d.dataset.id = it.id;
  d.style.setProperty('--i', i);
  d.innerHTML = `<button class="pick"><span class="inner"><span class="back"></span><span class="front"><span class="num">${ROMAN[i]}</span><span class="value"></span><span class="sw"></span></span></span><span class="cap">${it.label}</span></button><span class="btns"><button class="re"></button><button class="fix"></button></span>`;
  d.querySelector('.pick').addEventListener('click', () => { if (!spinning) { selected = it.id; show(); } });
  d.querySelector('.re').addEventListener('click', () => {
    if (spinning) return;
    selected = it.id;
    show();
    const r = canvas.getBoundingClientRect();
    if (r.top < -r.height * 0.3 || r.bottom > innerHeight + r.height * 0.3) canvas.scrollIntoView({ block: 'center', behavior: CALM ? 'auto' : 'smooth' });
    spinOne();
  });
  d.querySelector('.fix').addEventListener('click', () => { if (!spinning) openPicker(it.id); });
  cards[it.id] = d;
  $('list').append(d);
});
// 指定済み（種類の指定から自動で決まる人種なども含む）で、回せない項目か
const locked = (id) => (fixed[id] && !S.open(fixed[id])) || (!fixed[id] && S.derived(fixed)[id]);
const rollable = (id) => !locked(id) && !!candidates(id)?.length;

function paint(it, v, none) {
  const c = v || none ? null : candidates(it.id);
  const state = v ? 'done' : none || (c && !c.length) ? 'none' : c ? 'empty' : 'locked';
  const el = cards[it.id], val = el.querySelector('.value'), re = el.querySelector('.re'), fx = el.querySelector('.fix');
  el.dataset.state = state;
  const l = v ? lines(v) : [state === 'none' ? U('なし') : state === 'empty' ? U('未定') : F('needFirst', U(it.need))];
  val.textContent = v && THEME.flatName ? V(v.name).replace(/([×・／])/g, '$1​').replace('（', '​（') : l.join('\n');
  val.style.setProperty('--l', l.length);
  val.style.setProperty('--n', Math.max(3, ...l.map((x) => [...x].length)));
  el.classList.toggle('colored', !!v?.colors);
  el.style.setProperty('--colors', v?.colors ? `linear-gradient(90deg, ${v.colors.map((h, i, a) => `${h} ${(i * 100) / a.length}% ${((i + 1) * 100) / a.length}%`).join(',')})` : 'none');
  swatches(el.querySelector('.sw'), v?.colors);
  el.classList.toggle('fixed', !!fixed[it.id]);
  re.textContent = v ? U('回し直す') : U('回す');
  re.hidden = !!locked(it.id);
  re.disabled = spinning || !rollable(it.id);
  re.setAttribute('aria-label', F('onlyThis', U(it.label), re.textContent));
  fx.textContent = fixed[it.id] ? U('指定中') : U('指定');
  fx.disabled = spinning;
  fx.setAttribute('aria-label', F('labelValue', U(it.label), fixed[it.id] ? U('指定中') : U('指定する')));
  el.querySelector('.cap').textContent = U(it.label);
  el.querySelector('.pick').setAttribute('aria-label', F('labelValue', U(it.label), v ? V(v.name) : val.textContent));
}
// 色見本を1色ずつの要素にする（同じ色なら作り直さない）
function swatches(box, colors) {
  const key = (colors || []).join();
  if (box.dataset.key === key) return;
  box.dataset.key = key;
  box.replaceChildren(...(colors || []).map((h) => { const i = document.createElement('i'); i.style.background = h; return i; }));
}
function tint(colors) {
  swatches($('wash'), colors);
  ['--c1', '--c2', '--c3'].forEach((k, i) => (colors?.length ? document.body.style.setProperty(k, colors[i % colors.length]) : document.body.style.removeProperty(k)));
}
// 色の呼び方は人種で変わる。獣人は獣要素を混ぜた人間なので「獣の部分」と呼ぶ
function skinWord(r) {
  const v = r.bodyColor?.name;
  if (v && window.DATA.MATERIAL.includes(v)) return '素材';
  return r.race?.name === '獣人' ? '獣の部分' : '肌';
}
function head() {
  $('path').textContent = ['race', 'area', 'family'].map((k) => results[k] && V(results[k].name)).filter(Boolean).join(' ／ ') || U(THEME.words[0]);
  $('kind').textContent = (results.kind && V(results.kind.name)) || U(THEME.words[1]);
  $('note').textContent = [
    results.motif && F('motifOf', V(results.motif.name)),
    results.bodyColor && F('colorOf', U(skinWord(results)), V(results.bodyColor.name)),
  ].filter(Boolean).join(LANG === 'ja' ? '、' : ' · ') || U(THEME.words[2]);
}
/* 盤の下に出す「いま選んでいる項目の状態」。言語を変えたときもここだけ出し直す */
function paintNow() {
  const it = item(selected), c = candidates(selected);
  $('now').textContent = (results[selected] && V(results[selected].name))
    || (!c ? F('rollFirst', U(it.need)) : c.length ? F('nOptions', c.length) : U('この組み合わせでは「なし」'));
}
function show(keepWheel) {
  E.ITEMS.forEach((it) => { paint(it, results[it.id]); cards[it.id].classList.toggle('sel', it.id === selected); });
  tint(results.color?.colors);
  head();
  const it = item(selected), c = candidates(selected);
  $('title').textContent = U(it.label);
  if (!keepWheel) {
    wheel = { list: board(c || []), angle: 0, speed: 0, tick: 0, win: -1, glow: 0 };
    paintNow();
    draw();
  }
  $('one').textContent = results[selected] ? U('この項目を回し直す') : U('この項目を回す');
  $('one').disabled = spinning || !rollable(selected);
  const left = E.ITEMS.some((x) => !locked(x.id)), n = Object.keys(fixed).length;
  $('all').textContent = n ? F('allWithLocks', U(THEME.all), n) : U(THEME.all);
  $('all').disabled = spinning || !left;
  $('clear').hidden = !n;
  $('clear').disabled = spinning;
  $('copy').disabled = spinning || !results.kind;
  document.querySelectorAll('#skins button').forEach((b) => { b.disabled = spinning; });
  const lv = n ? S.levelOf(fixed) : 0;
  $('hint').textContent = lv === 1 ? U('指定した色を優先して、色の縛りをゆるめています')
    : lv === 2 ? U('指定を優先して、色・モチーフ・服装・体型の縛りをゆるめています') : '';
}
function popCard(it, v) { if (!CALM) THEME.pop?.(it, v, center(cards[it.id]), cards[it.id]); }

/* ========== 回す ========== */
// 円盤に並べるのは36個まで（抽選そのものは全候補から）。goal は必ず含める
function board(list, goal) {
  if (list.length <= 36) return list;
  const rest = list.filter((x) => x !== goal);
  for (let i = 0; i < 36; i++) { const j = i + Math.floor(Math.random() * (rest.length - i)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  const out = rest.slice(0, goal ? 35 : 36);
  if (goal) out.splice(Math.floor(Math.random() * 36), 0, goal);
  return out;
}
async function spinOne() {
  const id = selected, c = candidates(id);
  if (spinning || !c?.length || locked(id)) return;
  spinning = true;
  const keep = results[id];
  delete results[id];
  show(true);
  const pool = keep && c.length > 1 ? c.filter((x) => x.name !== keep.name) : c;
  const turn = async (list, label, from = list, ms = 3600) => {
    $('now').textContent = label;
    const v = E.pick(from), b = board(list, v);
    await spinTo(b, b.indexOf(v), ms);
    impact(v);
    return v;
  };
  let v;
  if (S.MULTI[id]) {
    // モチーフ・性格：個数のぶんだけ同じ円盤を回す
    const base = fixed[id]?.more ? fixed[id].items : [], got = [...base], n = S.countFor(id, fixed, c);
    // 回し直しでは、前と同じ組み合わせにならないよう、1つ目は前回になかったものから選ぶ
    const old = keep?.items || [];
    for (let i = 0; i < n; i++) {
      const list = c.filter((x) => !got.includes(x.name)), fresh = list.filter((x) => !old.includes(x.name));
      const x = await turn(list, F('nthOf', got.length + 1, base.length + n), i === 0 && fresh.length ? fresh : list, 2600);
      got.push(x.name);
      results[id] = S.listValue([...got]);
      paint(item(id), results[id]);
      if (i < n - 1) await wait(CALM ? 0 : 1300);
    }
    v = S.listValue(got);
  } else v = await turn(c, '…', pool);
  if (v.name === 'オッドアイ') {
    const s = E.flat(results);
    $('now').textContent = U('オッドアイ！');
    await wait(1500);
    const a = await turn(E.oddCandidates(s), F('labelValue', U('オッドアイ'), '1'));
    $('now').textContent = F('oddFirst', V(a.name));
    await wait(1500);
    v = E.oddResult(a, await turn(E.oddCandidates(s, a.name), F('oddFirst', V(a.name)) + '／2'));
  }
  await wait(CALM ? 0 : 700);
  if (!CALM) await THEME.pre?.(item(id), center(cards[id]));
  results[id] = v;
  S.reconcile(results, fixed);
  spinning = false;
  $('now').textContent = V(v.name);
  show(true);
  popCard(item(id), v);
}

async function spinAll() {
  if (spinning) return;
  spinning = true;
  results = {};
  // 円盤で回すのは、指定されていない最初の項目
  const next = S.rollAll(fixed);
  const lead = E.ITEMS.find((it) => !locked(it.id) && next[it.id] && !fixed[it.id]) || E.ITEMS.find((it) => next[it.id]);
  selected = lead.id;
  const before = {};
  for (const it of E.ITEMS) { if (it === lead) break; if (next[it.id]) before[it.id] = next[it.id]; }
  let list = candidates(lead.id, before);
  // 複数の項目は、最後の1つを円盤で見せる
  const goal = next[lead.id].items ? { name: next[lead.id].items.at(-1) } : next[lead.id];
  let idx = list.findIndex((x) => x.name === goal.name);
  const hit = idx < 0 ? goal : list[idx];
  if (idx < 0) list = [...list, goal];
  list = board(list, hit);
  idx = list.indexOf(hit);
  results = {};
  E.ITEMS.forEach((it) => { if (locked(it.id)) results[it.id] = next[it.id]; });
  show(true);
  wheel = { list, angle: 0, speed: 0, tick: 0, win: -1, glow: 0 };
  $('now').textContent = '…';
  draw();
  if (!CALM) await THEME.before?.();
  await spinTo(list, idx, 3000);
  impact(goal);
  $('now').textContent = V(next[lead.id].name);
  await wait(CALM ? 0 : 1000);
  for (const it of E.ITEMS) {
    if (locked(it.id)) continue;
    if (next[it.id] && !CALM) await THEME.pre?.(it, center(cards[it.id]));
    if (next[it.id]) results[it.id] = next[it.id];
    paint(it, next[it.id], !next[it.id]);
    if (it.id === 'color') tint(next.color.colors);
    head();
    if (next[it.id]) popCard(it, next[it.id]);
    await wait(CALM ? 0 : 190);
  }
  results = next;
  if (!CALM) await THEME.finish?.(next);
  spinning = false;
  show(true);
}

/* ========== 指定する ========== */
const dlg = $('picker');
let picking = null, chosen = [];
const MAX = { color: 3, eyeColor: 2, ...Object.fromEntries(Object.entries(S.MULTI).map(([k, m]) => [k, m.pick])) };
const canMore = () => S.MULTI[picking] && chosen.length && chosen.length < S.MULTI[picking].max;
function toValue(id, list) {
  if (!list.length) return null;
  if (id === 'color') return { name: list.map((x) => x.name).join('×'), colors: list.flatMap((x) => x.colors) };
  if (id === 'eyeColor' && list.length === 2) return E.oddResult(list[0], list[1]);
  if (S.MULTI[id]) return S.listValue(list.map((x) => x.name), $('more').checked && list.length < S.MULTI[id].max ? { more: true } : {});
  const { group, ...v } = list[0];
  return v;
}
function openPicker(id) {
  picking = id;
  const v = fixed[id], opts = S.options(id);
  $('more').checked = !!v?.more;
  chosen = !v ? [] : v.items ? v.items.map((n) => opts.find((o) => o.name === n)) : id === 'color' ? v.name.split('×').map((n) => opts.find((o) => o.name === n)) : v.odd && id === 'eyeColor' ? v.odd.map((n) => opts.find((o) => o.name === n)) : [opts.find((o) => o.name === v.name)];
  $('pickTitle').textContent = F('lockTitle', U(item(id).label));
  $('pickHelp').textContent = id === 'color' ? U('3色まで選べます。最初の色が主役になります。')
    : id === 'eyeColor' ? U('1色、または2色（左・右の順）でオッドアイになります。')
    : S.MULTI[id] ? F('pickUpTo', MAX[id]) : U('選ばなかった項目はルーレットで決まります。');
  $('q').value = '';
  $('unfix').hidden = !fixed[id];
  fillPicker();
  if (!dlg.open) dlg.showModal();
}
function fillPicker() {
  const id = picking, q = $('q').value.trim(), box = $('opts');
  const others = { ...fixed };
  delete others[id];
  /* 検索は日本語名でも表示中の言語でも引けるようにする */
  const opts = S.options(id).filter((o) => !q || o.name.includes(q) || o.group?.includes(q)
    || V(o.name).toLowerCase().includes(q.toLowerCase()) || (o.group && U(o.group).toLowerCase().includes(q.toLowerCase())));
  box.replaceChildren();
  let group = '', wrap = box;
  for (const o of opts) {
    if (o.group && o.group !== group) {
      group = o.group;
      const h = document.createElement('h3');
      h.textContent = U(group);
      wrap = document.createElement('div');
      wrap.className = 'optrow';
      box.append(h, wrap);
    } else if (!o.group && wrap === box) {
      wrap = document.createElement('div');
      wrap.className = 'optrow';
      box.append(wrap);
    }
    const b = document.createElement('button'), n = chosen.findIndex((x) => x.name === o.name);
    b.type = 'button';
    b.className = 'opt';
    b.setAttribute('aria-pressed', n >= 0);
    if (o.colors) { const i = document.createElement('i'); i.style.background = o.colors.length > 1 ? `linear-gradient(90deg, ${o.colors.join(',')})` : o.colors[0]; b.append(i); }
    b.append(o.any ? U('オッドアイ（色はルーレット）') : V(o.name));
    if (n >= 0 && chosen.length > 1) b.append(` ${n + 1}`);
    // ほかの指定とどうしても両立しないものは選べない
    if (id !== 'color' && n < 0) b.disabled = S.levelOf({ ...others, [id]: toValue(id, [o]) }) > 2;
    b.addEventListener('click', () => {
      if (n >= 0) chosen.splice(n, 1);
      else if (id === 'eyeColor' && ['オッドアイ', '2色グラデ', '虹色'].includes(o.name)) chosen = [o];
      else {
        if (id === 'eyeColor') chosen = chosen.filter((x) => !['オッドアイ', '2色グラデ', '虹色'].includes(x.name));
        chosen.push(o);
        if (chosen.length > (MAX[id] || 1)) chosen.shift();
      }
      fillPicker();
    });
    wrap.append(b);
  }
  if (!opts.length) box.textContent = U('見つかりません');
  $('moreRow').hidden = !canMore();
  const v = toValue(id, chosen);
  $('ok').disabled = !v || S.levelOf({ ...others, [id]: v }) > 2;
  $('ok').textContent = v ? F('lockAs', v.any ? U('オッドアイ') : V(v.name), v.more ? U('＋ルーレット') : '') : U('指定する');
}
function applyFix(id, v) {
  if (v) { fixed[id] = v; if (!v.any) results[id] = v.more ? S.listValue(v.items) : v; } else { delete fixed[id]; delete results[id]; }
  S.reconcile(results, fixed);
  selected = id;
  show();
}
$('q').addEventListener('input', fillPicker);
$('more').addEventListener('change', fillPicker);
$('ok').addEventListener('click', () => { const v = toValue(picking, chosen); dlg.close(); applyFix(picking, v); });
$('unfix').addEventListener('click', () => { dlg.close(); applyFix(picking, null); });
$('cancel').addEventListener('click', () => dlg.close());
dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
$('clear').addEventListener('click', () => { if (spinning) return; for (const id of Object.keys(fixed)) delete fixed[id]; show(); });

/* ========== 性別 ==========
   回して決めるものではないので、ルーレットには入れずここで選ぶ。
   選んでも人種・髪型・体型などは一切絞らない（性別で決めつけないため）。
   もう一度押すと解除できる */
let gender = '';
function paintGender() {
  document.querySelectorAll('#gender button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.gender === gender));
}
window.DATA.GENDER.forEach((g) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = U(g);
  b.dataset.gender = g;
  b.setAttribute('aria-pressed', 'false');
  b.addEventListener('click', () => { gender = gender === g ? '' : g; paintGender(); });
  $('gender').append(b);
});

/* ========== キャラクター設定のコピー ========== */
function buildSheet(r) {
  const sep = LANG === 'ja' ? '、' : ', ';
  const t = (id) => r[id] && V(r[id].name);
  const list = (id) => r[id] && S.itemsOf(r[id]).map(V).join(sep);
  const color = r.color && r.color.name.split('×').map((n, i) => `${V(n)}（${r.color.colors[i]}）`).join(sep);
  const eye = r.eyeColor && (r.eyeColor.odd
    ? `${U('オッドアイ')}（${V(r.eyeColor.odd[0])} / ${V(r.eyeColor.odd[1])}）`
    : V(r.eyeColor.name));
  const hair = LANG === 'ja'
    ? [t('hairLen'), t('hair')].filter(Boolean).join('の')
    : [t('hair'), t('hairLen')].filter(Boolean).join(', ');
  const rows = [
    [U('種族'), r.race && (r.race.name === '獣人' ? F('beastOf', t('kind')) : F('raceKind', t('race'), t('kind')))],
    [U('性別'), U(gender)],
    [U(skinWord(r)), t('bodyColor')], [U('モチーフ'), list('motif')], [U('服装'), t('outfit')],
    [U('イメージカラー'), color], [U('性格'), list('personality')], [U('体型'), t('body')],
    [U('髪型'), hair], [U('前髪'), t('bangs')], [U('サイドの髪'), t('sideHair')],
    [U('目の形'), t('eyeShape')], [U('目の色'), eye],
  ].filter(([, v]) => v);
  const head = LANG === 'ja' ? '【キャラクター設定】' : `[ ${U('キャラクター設定')} ]`;
  return `${head}\n${rows.map(([k, v]) => F('labelValue', k, v)).join('\n')}`;
}
const cp = $('copyDlg');
async function copyText() {
  const box = $('sheet');
  let ok = true;
  try { await navigator.clipboard.writeText(box.value); } catch { box.focus(); box.select(); ok = document.execCommand('copy'); }
  $('copied').textContent = ok ? U('コピーしました') : U('コピーできませんでした。文章を選んで Ctrl+C を押してください。');
}
$('copy').addEventListener('click', () => { if (spinning) return; $('sheet').value = buildSheet(results); cp.showModal(); $('sheet').setSelectionRange(0, 0); $('sheet').scrollTop = 0; copyText(); });
$('recopy').addEventListener('click', copyText);
$('closeCopy').addEventListener('click', () => cp.close());
cp.addEventListener('click', (e) => { if (e.target === cp) cp.close(); });

/* ========== スタイルの切り替え ========== */
function drawer(on) { $('bar').classList.toggle('open', on); $('skinTab').setAttribute('aria-expanded', on); }
$('skinTab').addEventListener('click', () => drawer(!$('bar').classList.contains('open')));
document.addEventListener('click', (e) => { if (!$('bar').contains(e.target)) drawer(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('bar').classList.contains('open')) { drawer(false); $('skinTab').focus(); } });
/* 読み込んだスタイルだけを並べる（index.htmlに無いものは自動で外れる） */
const ORDER = ['tarot', 'grimoire', 'cyber'].filter((id) => THEMES[id]);
ORDER.forEach((id) => {
  const b = document.createElement('button');
  b.textContent = window.I18N.skin(id, LANG);
  b.dataset.skin = id;
  b.addEventListener('click', () => { if (!spinning) { setTheme(id); drawer(false); $('skinTab').focus(); } });
  $('skins').append(b);
});
function setTheme(id) {
  THEME = THEMES[id];
  INK = THEME.ink;
  GEM = THEME.gem;
  parts = [];
  document.body.dataset.theme = id;
  document.querySelectorAll('link[data-skin]').forEach((l) => { l.media = l.dataset.skin === id ? 'all' : 'not all'; });
  document.querySelectorAll('#skins button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.skin === id));
  try { localStorage.setItem('skin', id); } catch {}
  sx.setTransform(1, 0, 0, 1, 0, 0);
  sx.clearRect(0, 0, sky.width, sky.height);
  show();
  requestAnimationFrame(draw);
}
// 背景の動き（星空・泡など）
const sky = $('sky'), sx = sky.getContext('2d');
(function ambient(t) {
  const W = innerWidth, H = innerHeight;
  if (sky.width !== W || sky.height !== H) { sky.width = W; sky.height = H; }
  if (THEME?.ambient) { sx.clearRect(0, 0, W, H); sx.save(); THEME.ambient(CALM ? 0 : t, W, H); sx.restore(); }
  requestAnimationFrame(ambient);
})(0);

/* ========== 相談先の一覧 ==========
   つなぐ・ココナラは日本語のお客様向けなので、英語・フランス語のときは出さない */
function paintAsk(lang) {
  document.querySelectorAll('#askPop [data-ask-lang]').forEach((a) => {
    const w = a.dataset.askLang;
    /* both=どの言語でも、ja=日本語だけ、intl=英語とフランス語だけ */
    a.hidden = !(w === 'both' || w === lang || (w === 'intl' && lang !== 'ja'));
  });
}
function openAsk(on) {
  const pop = $('askPop');
  if (!pop) return;
  pop.hidden = !on;
  $('askBtn').setAttribute('aria-expanded', on ? 'true' : 'false');
}
if ($('askBtn')) {
  $('askBtn').addEventListener('click', (e) => { e.stopPropagation(); openAsk($('askPop').hidden); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.ask-wrap')) openAsk(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') openAsk(false); });
}

/* ========== 表示言語の切り替え ==========
   回した結果はそのままに、画面の文字だけを訳し直す */
function setLang(lang) {
  LANG = lang;
  window.__LANG = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = U(el.dataset.i18n); });
  /* リンクを含む文。日本語のときはHTMLに書いてある元の文に戻す */
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    if (!el.dataset.jpHtml) el.dataset.jpHtml = el.innerHTML;
    el.innerHTML = lang === 'ja' ? el.dataset.jpHtml : U(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = U(el.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', U(el.dataset.i18nAria)); });
  document.querySelectorAll('#skins button').forEach((b) => { b.textContent = window.I18N.skin(b.dataset.skin, lang); });
  document.querySelectorAll('#gender button').forEach((b) => { b.textContent = U(b.dataset.gender); });
  document.querySelectorAll('#langs button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === lang));
  paintAsk(lang);
  if (dlg.open) openPicker(picking);
  show(true);
  paintNow();   /* 盤はそのままなので、文字だけ訳し直す */
  draw();
  try { localStorage.setItem('lang', lang); } catch {}
}
document.querySelectorAll('#langs button').forEach((b) => {
  b.addEventListener('click', () => { if (!spinning) setLang(b.dataset.lang); });
});

$('one').addEventListener('click', spinOne);
$('all').addEventListener('click', spinAll);
addEventListener('resize', draw);
let first = new URLSearchParams(location.search).get('skin');
try { first ||= localStorage.getItem('skin'); } catch {}
setTheme(ORDER.includes(first) ? first : 'tarot');

/* 言語は ?lang= → 前回の選択 → ブラウザの設定 の順で決める。
   切り替えボタンを置いていない手元用の画面は、日本語のまま動かす */
let firstLang = 'ja';
if ($('langs')) {
  firstLang = new URLSearchParams(location.search).get('lang');
  try { firstLang ||= localStorage.getItem('lang'); } catch {}
  if (!['ja', 'en', 'fr'].includes(firstLang)) {
    const nav = (navigator.language || 'ja').toLowerCase();
    firstLang = nav.startsWith('ja') ? 'ja' : nav.startsWith('fr') ? 'fr' : 'en';
  }
}
setLang(firstLang);

document.fonts?.ready.then(draw);
