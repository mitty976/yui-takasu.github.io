// ===== 指定つきの抽選 =====
// 指定した項目を守り、残りを辻褄が合う範囲で回す。
// 指定どうしが合わないときは本人の希望を優先し、色 → モチーフ・服装・体型の順に縛りをゆるめる
(function (root) {
  const D = root.DATA, E = root.ENGINE;
  const item = (id) => E.ITEMS.find((i) => i.id === id);
  const namesOf = (c) => (c || []).map((x) => x.name);

  // 複数出る項目：回したときの個数と、指定できる最大数
  const MULTI = { motif: { min: 1, max: 3, pick: 3 }, personality: { min: 2, max: 3, pick: 5 } };
  // 獣人の毛色だけに出る値。これを指定したときは人種が獣人に決まる
  const BEAST_ONLY_COLORS = new Set(['通常', '白化', '黒化', '黄変', '赤変', '青変', 'まだら']);
  const listValue = (names, extra) => ({ name: names.join('×'), items: names, ...extra });
  const itemsOf = (v) => v.items || [v.name];
  const uniq = (a) => [...new Set(a)];

  const KINDS = [];
  const addKind = (s) => {
    const base = { ...s };
    KINDS.push({
      ...s, base,
      bodyColors: namesOf(item('bodyColor').cand(base)),
      motifs: new Set(namesOf(item('motif').cand(base))),
      outfits: new Set(namesOf(item('outfit').cand(base))),
      bodies: new Set(namesOf(item('body').cand(base))),
      face: item('eyeShape').cand(base).length > 0,
    });
  };
  for (const [race, list] of Object.entries(D.RACES)) (list || []).forEach((k) => addKind({ race, kind: k.name }));
  for (const [area, fams] of Object.entries(D.BEASTS)) for (const [family, list] of Object.entries(fams)) list.forEach((k) => addKind({ race: '獣人', area, family, kind: k.name }));

  // 髪は「長さ・形・前髪」の組み合わせが1つでも成り立つか
  function hairOK(k, p) {
    if (!p.hairLen && !p.hair && !p.bangs) return true;
    if (!k.face) return false;
    const lens = p.hairLen ? [p.hairLen.name] : Object.keys(D.HAIR);
    return lens.some((hairLen) => {
      const hairs = namesOf(item('hair').cand({ ...k.base, hairLen })).filter((h) => !p.hair || h === p.hair.name);
      return hairs.some((hair) => !p.bangs || namesOf(item('bangs').cand({ ...k.base, hairLen, hair })).includes(p.bangs.name));
    });
  }
  const eyeOK = (s, v) => {
    const l = namesOf(item('eyeColor').cand(s));
    if (v.any) return l.includes('オッドアイ');
    return v.odd ? l.includes('オッドアイ') && v.odd.every((n) => l.includes(n)) : l.includes(v.name);
  };
  // p（項目 → 値）をすべて満たす組み合わせがあるか。fixed は縛りをゆるめてよい項目
  function possible(p, fixed = {}, level = 0) {
    const free = (id, lv) => level >= lv && fixed[id] && p[id] && fixed[id].name === p[id].name;
    const own = level >= 2 && fixed.motif ? itemsOf(fixed.motif) : [];
    for (const k of KINDS) {
      if (['race', 'area', 'family', 'kind'].some((id) => p[id] && p[id].name !== k[id])) continue;
      if (p.outfit && !k.outfits.has(p.outfit.name) && !free('outfit', 2)) continue;
      if (p.body && !k.bodies.has(p.body.name) && !free('body', 2)) continue;
      if (p.motif && itemsOf(p.motif).some((m) => !k.motifs.has(m) && !own.includes(m))) continue;
      if (p.eyeShape && !k.face) continue;
      if (p.bodyColor && !k.bodyColors.includes(p.bodyColor.name)) continue;
      if (!hairOK(k, p)) continue;
      if (!p.color && !p.eyeColor) return true;
      for (const bodyColor of p.bodyColor ? [p.bodyColor.name] : k.bodyColors.length ? k.bodyColors : [undefined]) {
        const s = bodyColor ? { ...k.base, bodyColor } : k.base;
        if (p.color && !free('color', 1) && !item('color').valid(s, p.color)) continue;
        if (p.eyeColor && !eyeOK(s, p.eyeColor)) continue;
        return true;
      }
    }
    return false;
  }
  // どこまでゆるめれば成り立つか（3 は成立しない）
  const levelOf = (fixed) => [0, 1, 2].find((l) => possible(fixed, fixed, l)) ?? 3;

  // 指定した種類・系統・分類から、上の項目を自動で決める
  function derived(fixed) {
    const out = {};
    const k = fixed.kind && KINDS.find((x) => x.kind === fixed.kind.name);
    if (k) for (const id of ['race', 'area', 'family']) if (k[id]) out[id] = { name: k[id] };
    const f = fixed.family && KINDS.find((x) => x.family === fixed.family.name);
    if (f) { out.area = { name: f.area }; out.race = { name: f.race }; }
    // 毛色の変わり方は獣人だけのもの。肌の色・素材の色は複数の人種にまたがるので決め打ちしない
    if (fixed.area || (fixed.bodyColor && BEAST_ONLY_COLORS.has(fixed.bodyColor.name))) out.race = { name: '獣人' };
    for (const id of Object.keys(out)) if (fixed[id]) delete out[id];
    return out;
  }
  // 指定はあるが、回して決める部分が残っているか
  const open = (v) => !!(v && (v.any || v.more));

  // 今の結果と指定に合う候補。null は「先に回す項目がある」、[] は「なし」
  function candidates(id, results, fixed, level = levelOf(fixed)) {
    const up = { ...derived(fixed), ...fixed };
    for (const it of E.ITEMS) {
      if (it.id === id) break;
      if (results[it.id] && !up[it.id]) up[it.id] = results[it.id];
    }
    delete up[id];
    const s = E.flat(up);
    if (!['race', 'area', 'family', 'kind', 'personality'].includes(id) && s.kind && !s.race) return null;
    let c = item(id).cand(s);
    if (!c || !c.length) return c;
    if (fixed[id]?.any) return c.filter((x) => x.name === 'オッドアイ');
    if (fixed[id]?.more) c = c.filter((x) => !fixed[id].items.includes(x.name));
    return c.filter((v) => possible({ ...up, [id]: v.name === 'オッドアイ' ? { ...v, any: true } : v }, fixed, level));
  }

  // 複数出る項目の個数を決める
  function countFor(id, fixed, pool) {
    const m = MULTI[id], base = fixed[id]?.more ? fixed[id].items.length : 0;
    const min = Math.max(m.min, base + 1), n = min + Math.floor(Math.random() * Math.max(1, m.max - min + 1));
    return Math.max(1, Math.min(n - base, pool.length));
  }
  function pickValue(id, list, results, fixed) {
    if (MULTI[id]) {
      const pool = [...list], got = [...(fixed[id]?.more ? fixed[id].items : [])];
      for (let n = countFor(id, fixed, pool); n > 0; n--) got.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].name);
      return listValue(got);
    }
    const v = E.pick(list);
    if (v.name !== 'オッドアイ') return v;
    const s = E.flat(results), a = E.pick(E.oddCandidates(s));
    return E.oddResult(a, E.pick(E.oddCandidates(s, a.name)));
  }

  // 合わなくなった項目だけ消す（指定は消さない）
  function reconcile(results, fixed) {
    const level = levelOf(fixed), st = { ...derived(fixed), ...fixed };
    for (const it of E.ITEMS) {
      const id = it.id, f = fixed[id];
      let v = results[id];
      if (f && !open(f)) { results[id] = f; continue; }
      if (st[id] && !f) { results[id] = st[id]; continue; }
      if (f?.more && (!v || f.items.some((x) => !itemsOf(v).includes(x)))) v = results[id] = listValue(f.items);
      if (!v) continue;
      if (f?.any && !v.odd) { delete results[id]; continue; }
      // 複数の項目は、合わないものだけ抜いて残す
      if (v.items) {
        const keep = v.items.filter((x) => f?.items?.includes(x) || possible({ ...st, [id]: { name: x } }, fixed, level));
        if (keep.length && keep.length < v.items.length) v = results[id] = listValue(keep);
      }
      if (possible({ ...st, [id]: v }, fixed, level)) st[id] = v;
      else {
        delete results[id];
        // オッドアイの指定中は、合わなくなった左右の色をその場で引き直す
        const c = f?.any && candidates(id, results, fixed, level);
        if (c && c.length) results[id] = pickValue(id, c, results, fixed);
      }
    }
    return results;
  }
  function rollAll(fixed) {
    const r = reconcile({}, fixed), level = levelOf(fixed);
    for (const it of E.ITEMS) {
      if (r[it.id] && !fixed[it.id]?.more) continue;
      const c = candidates(it.id, r, fixed, level);
      if (c && c.length) r[it.id] = pickValue(it.id, c, r, fixed);
    }
    return r;
  }

  // 指定画面に並べる選択肢
  function options(id) {
    const u = (a) => uniq(a).filter(Boolean).map((name) => ({ name }));
    switch (id) {
      case 'kind': return KINDS.map((k) => ({ name: k.kind, group: k.family ? `${k.race}／${k.area}／${k.family}` : k.race }));
      case 'bodyColor': return u(KINDS.flatMap((k) => k.bodyColors));
      case 'motif': return u(Object.keys(D.MOTIF));
      case 'outfit': return u(KINDS.flatMap((k) => [...k.outfits]));
      case 'color': return D.COLORS.map((c) => ({ name: c.name, colors: [c.hex] }));
      case 'hair': return u([...Object.values(D.HAIR).flat(), '蛇の髪']);
      case 'bangs': return u(D.BANGS);
      case 'hairLen': return u(Object.keys(D.HAIR));
      case 'eyeShape': return u(D.EYESHAPE);
      case 'eyeColor': return item('eyeColor').cand({ race: '人間', kind: '学生' }).map((e) => (e.name === 'オッドアイ' ? { ...e, any: true } : e));
      case 'body': return u(D.BODY);
      case 'personality': return u(D.PERSONALITY);
      case 'family': return u(KINDS.map((k) => k.family));
      case 'area': return u(KINDS.map((k) => k.area));
      default: return u(Object.keys(D.RACES));
    }
  }
  root.SOLVE = { KINDS, MULTI, possible, levelOf, derived, candidates, reconcile, rollAll, options, item, open, countFor, listValue, itemsOf };
})(typeof window === 'undefined' ? globalThis : window);
