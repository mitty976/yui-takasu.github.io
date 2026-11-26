// ===== 辻褄を合わせる仕組み =====
// 各項目の cand(状態) が「今の結果に合う候補」を返す。null は「先に回す項目がある」、[] は「なし」
(function (root) {
  const D = root.DATA;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const names = (a) => a.map((name) => ({ name }));
  const beast = (s) => s.race === '獣人';
  const kindList = (s) => (beast(s) ? D.BEASTS[s.area]?.[s.family] : D.RACES[s.race]);
  const kindOf = (s) => kindList(s)?.find((k) => k.name === s.kind);
  const headless = (s) => /^頭が/.test(s.kind || '');

  // 体色：元の色と変わらないものは出さない（c は種類の色の系統）
  const BODYCOLOR = {
    通常: () => true,
    白化: (c) => c[0] !== 'w',
    黒化: (c) => c[0] !== 'k',
    黄変: (c) => c[0] !== 'y' && c[0] !== 'd',
    赤変: (c) => c[0] !== 'r',
    青変: (c) => c[0] !== 'u',
    まだら: (c) => !c.includes('w'),
  };

  // イメージカラー：生物は体色（とその近い色）が主役、添える色は隣り合う色と無彩色まで。生物以外はすべての色
  const NEAR = { k: 'チャコール 黒紫 ミッドナイトブルー 紺', w: 'クリーム 銀 桜色', s: 'アイボリー 藍', b: '琥珀 杏色 金', o: '山吹 コーラル', r: 'ローズ コーラル', y: '金 クリーム 杏色', g: '青磁 青緑', t: 'ミント 水色', u: 'ターコイズ すみれ 青緑', v: 'マゼンタ ローズ 瑠璃', p: 'コーラル 藤色 朱', d: '山吹 キャラメル 琥珀' };
  const SIDE = { r: 'pov', p: 'rv', o: 'ryp', y: 'og', g: 'yt', t: 'gu', u: 'tv', v: 'up', b: 'oyr', d: 'yo', k: 'uv', w: 'pu', s: 'uv' };
  function palette(s) {
    if (!beast(s)) return { A: D.COLORS, B: D.COLORS };
    const c = kindOf(s).col;
    const [main, extra] = { 白化: ['w', 'pus'], 黒化: ['k', c], 黄変: ['y', c], 赤変: ['r', c], 青変: ['u', c], まだら: [c, 'w'] }[s.bodyColor] || [c, ''];
    const near = new Set([...main].flatMap((f) => NEAR[f].split(' ')));
    const sub = main + extra + 'wksdb' + [...(main + extra)].map((f) => SIDE[f]).join('');
    return { A: D.COLORS.filter((x) => main.includes(x.f) || near.has(x.name)), B: D.COLORS.filter((x) => sub.includes(x.f) || near.has(x.name)) };
  }
  const piebald = (s) => beast(s) && s.bodyColor === 'まだら';

  // 単色・2色・3色の候補を最大24個作る。まだらは白を必ず含める
  function colorCandidates(s) {
    const { A, B } = palette(s);
    const whites = D.COLORS.filter((c) => c.f === 'w');
    const out = new Map();
    const add = (list) => {
      if (new Set(list).size !== list.length) return;
      const name = list.map((c) => c.name).join('×');
      out.set(name, { name, colors: list.map((c) => c.hex) });
    };
    if (!piebald(s)) for (let i = 0; i < 6; i++) add([pick(A)]);
    for (let i = 0; i < 400 && out.size < 24; i++) {
      const list = [pick(A), piebald(s) ? pick(whites) : pick(B)];
      if (i % 2) list.push(pick(B));
      add(list);
    }
    return [...out.values()];
  }
  function colorValid(s, v) {
    const { A, B } = palette(s);
    const l = v.name.split('×').map((n) => D.COLORS.find((c) => c.name === n));
    if (!A.includes(l[0]) || l.slice(1).some((x) => !B.includes(x))) return false;
    return !piebald(s) || l.some((x) => x.f === 'w');
  }

  // 目の色：白化は 赤・桃・淡い青 だけ。単眼はオッドアイなし
  const SPECIAL = ['オッドアイ', '2色グラデ', '虹色'];
  function eyeCandidates(s) {
    if (!s.kind || !s.bodyColor) return null;
    if (headless(s)) return [];
    let base = D.EYE.map((e) => ({ name: e.name, colors: [e.hex] }));
    // 色素が薄い体は目も淡い色になる（獣人の白化も、人型のアルビノも同じ扱い）
    if (s.bodyColor === '白化' || s.bodyColor === 'アルビノ') base = base.filter((e) => ['赤', '桃', '淡い青'].includes(e.name));
    else base.push(
      { name: '2色グラデ', colors: ['#7a4bb0', '#86cdea'] },
      { name: '虹色', colors: ['#c9252d', '#f2d93b', '#2f9e5b', '#2e68c8', '#7a4bb0'] },
    );
    if (s.kind !== '単眼') base.push({ name: 'オッドアイ', colors: ['#2e68c8', '#d9ae2f'] });
    return base;
  }
  // オッドアイの左右：同じルーレットをもう2回。通常の色だけで、2回目は1回目と違う色
  const oddCandidates = (s, first) => eyeCandidates(s).filter((e) => !SPECIAL.includes(e.name) && e.name !== first);
  const oddResult = (a, b) => ({ name: `オッドアイ（${a.name}／${b.name}）`, colors: [a.colors[0], b.colors[0]], odd: [a.name, b.name] });

  const needKind = (fn) => (s) => (s.kind ? fn(s) : null);
  const face = (fn) => needKind((s) => (headless(s) ? [] : fn(s)));

  const ITEMS = [
    { id: 'race', label: '人種', cand: () => names(Object.keys(D.RACES)) },
    { id: 'area', label: '生物の分類', need: '人種', cand: (s) => (!s.race ? null : beast(s) ? names(Object.keys(D.BEASTS)) : []) },
    { id: 'family', label: '系統', need: '生物の分類', cand: (s) => (!s.race ? null : !beast(s) ? [] : s.area ? names(Object.keys(D.BEASTS[s.area])) : null) },
    { id: 'kind', label: '種類', need: '人種（獣人は系統）', cand: (s) => { const l = s.race && kindList(s); return l ? names(l.map((k) => k.name)) : null; } },
    // 獣人は毛色の変わり方、人型は肌の色、人工物は素材の色。異形はそのどちらからも出る
    { id: 'bodyColor', label: '体の色', need: '人種（獣人は種類）', cand: (s) => {
      if (!s.race) return null;
      if (beast(s)) return s.kind ? names(Object.keys(BODYCOLOR).filter((b) => BODYCOLOR[b](kindOf(s).col))) : null;
      if (s.race === '人工物') return names(D.MATERIAL);
      return names(D.SKIN);
    } },
    { id: 'motif', label: 'モチーフ', need: '種類', cand: needKind((s) => names(kindOf(s).motifs)) },
    { id: 'outfit', label: '服装', need: '種類', cand: needKind((s) => names(kindOf(s).outfits)) },
    { id: 'color', label: 'イメージカラー', need: '種類（獣人は体の色）', cand: (s) => (s.kind && (!beast(s) || s.bodyColor) ? colorCandidates(s) : null), valid: colorValid },
    { id: 'personality', label: '性格', cand: () => names(D.PERSONALITY) },
    { id: 'body', label: '体型', need: '種類', cand: needKind((s) => names(D.BODY.filter((b) => !(D.BODY_NG[s.kind] || []).includes(b)))) },
    { id: 'hairLen', label: '髪の長さ', need: '種類', cand: face(() => names(Object.keys(D.HAIR))) },
    { id: 'hair', label: '髪型', need: '髪の長さ', cand: face((s) => (!s.hairLen ? null : names(s.kind === 'メデューサ' ? ['蛇の髪'] : D.HAIR[s.hairLen]))) },
    { id: 'bangs', label: '前髪', need: '髪型', cand: face((s) => {
      if (!s.hair) return null;
      // 後ろへ流す髪だけは、額に下ろす前髪を作れない
      if (s.hair === 'オールバック') return names(['おでこ出し', 'かきあげ', '一束垂らし', '触角']);
      return names(D.BANGS.filter((b) => !(s.kind === '単眼' && b.includes('隠れ'))));
    }) },
    { id: 'sideHair', label: 'サイドの髪', need: '髪型', cand: face((s) => (!s.hair ? null : names(D.SIDEHAIR))) },
    { id: 'eyeShape', label: '目の形', need: '種類', cand: face(() => names(D.EYESHAPE)) },
    { id: 'eyeColor', label: '目の色', need: '体の色', cand: eyeCandidates, valid: (s, v) => {
      const l = eyeCandidates(s).map((e) => e.name);
      return v.odd ? l.includes('オッドアイ') && v.odd.every((n) => l.includes(n)) : l.includes(v.name);
    } },
  ];

  // 結果 {id: {name, colors?, odd?}} から、候補の計算に使う名前だけを取り出す
  const flat = (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.name]));

  // 前の項目を回し直したあと、合わなくなった項目だけ空に戻す
  // 種類が未定になっただけの項目（体型・髪・目）は残し、種類が決まったときに合わなければ消す
  const KEEP = ['body', 'hairLen', 'hair', 'bangs', 'sideHair', 'eyeShape', 'eyeColor'];
  function prune(results) {
    for (const it of ITEMS) {
      const v = results[it.id];
      if (!v) continue;
      const s = flat(results);
      const c = it.cand(s);
      if (!c && ((!s.kind && KEEP.includes(it.id)) || (s.kind && it.id === 'eyeColor'))) continue;
      const ok = c && c.length && (it.valid ? it.valid(s, v) : c.some((x) => x.name === v.name));
      if (!ok) delete results[it.id];
    }
    return results;
  }

  // 全部を一気に決める
  function rollAll() {
    const r = {};
    for (const it of ITEMS) {
      const c = it.cand(flat(r));
      if (!c || !c.length) continue;
      let v = pick(c);
      if (v.name === 'オッドアイ') {
        const a = pick(oddCandidates(flat(r)));
        v = oddResult(a, pick(oddCandidates(flat(r), a.name)));
      }
      r[it.id] = v;
    }
    return r;
  }
  root.ENGINE = { ITEMS, flat, prune, rollAll, pick, oddCandidates, oddResult };
})(typeof window === 'undefined' ? globalThis : window);
