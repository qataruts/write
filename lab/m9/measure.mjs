// **المقياسُ الواحد** (`ENGINE_PLAN §م٩/أ٢` — «وهو الأثمن، ونحتاجه في الحالين»):
//   يُدخِل أثراً ⇒ يُخرِج **حكمَ القواعد** و**حكمَ النموذج** ⇒ **ويقابلهما بعين الإنسان**.
//
//   node measure.mjs cases                                   # يبني حالاتِ الامتحان ويحكم عليها بالقواعد
//   node measure.mjs sisters-rules --traces out/hijja-all.jsonl --per 60
//   node measure.mjs report --preds out/preds.json           # الشروطُ الأربعة ومنحنى العتبة
//
// **وحدودُه معلَنة**: يستورد `app/js/pen.js` **للقراءة** ولا يكتب فيه حرفاً، ولا
// يمسّ ملفَّ تطبيقٍ ولا فاحصةً. وكلُّ مخرجاته في `lab/m9/out/` (غيرُ مُلتزَمة).
//
// **وحكمُ النموذج قبولٌ لا تصنيفٌ فقط**: المصنِّفُ يقول «أيُّ حرف»، والقبولُ عندنا
// سؤالٌ آخر — فالقاعدةُ المعلَنة: **يُقبَل إن كان أعلى صنفٍ هو الحرفُ المطلوب
// وثقتُه ≥ العتبة**، وإلّا يُرَدّ. والعتبةُ تُعلَن بمنحنىً لا تُنتقى صامتة.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const ROOT = new URL('../../', import.meta.url);
const HERE = new URL('./', import.meta.url);
const pen = await import(new URL('app/js/pen.js', ROOT));
const { PATHS } = await import(new URL('app/js/paths.js', ROOT));

const args = process.argv.slice(2);
const mode = args[0] || 'cases';
const flag = (name, dflt = null) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const pc = (n) => `${(n * 100).toFixed(1)}٪`;
const write = (rel, text) => {
  const path = new URL(rel, HERE).pathname;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  return path;
};

/* ═════ عدّةُ اليد النظيفة — منقولةٌ بنصّها من `tools/test_shape.mjs` ═════ */
const bodyStrokes = (ref) => pen.partsOf(ref).filter((p) => p.kind === 'stroke')
  .map((p) => p.poly.pts.map((q) => [q[0], q[1]]));
const dotSeats = (ref) => pen.partsOf(ref).filter((p) => p.kind === 'dot')
  .flatMap((p) => Array.from({ length: p.count || 1 }, () => [p.at[0], p.at[1]]));
const tapAt = (at) => [[at[0], at[1]], [at[0], at[1]], [at[0], at[1]]];
const traceOf = (ref) => [...bodyStrokes(ref), ...dotSeats(ref).map(tapAt)];
const tolOf = (ref) => pen.easeTolerance(pen.resolveTolerance(ref.tolerance)).lateral;
const bodyMidY = (ref) => {
  const pts = bodyStrokes(ref).flat();
  return pts.reduce((s, p) => s + p[1], 0) / pts.length;
};
const lineBetween = (a, b, n = 12) => Array.from({ length: n + 1 },
  (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);

const FAMILIES = [['ب', 'ت', 'ث', 'ن', 'ي'], ['ج', 'ح', 'خ'], ['د', 'ذ'], ['ر', 'ز'],
  ['ط', 'ظ'], ['ص', 'ض'], ['ع', 'غ'], ['س', 'ش'], ['ف', 'ق']];

/* ═════ ١) حالاتُ الامتحان — الميدانُ وشهودُ الديون والمصنوعُ ومراجعُنا ═════ */

const FIELD = JSON.parse(readFileSync(new URL('field/2026-08-20-arena-all.json', ROOT), 'utf8')).items;

function scribbled(ref, n = 34) {
  const box = pen.inkBox([pen.refPoints(ref)]);
  const tol = tolOf(ref);
  const ink = pen.refPoints(ref);
  const far = (p) => !ink.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= tol);
  const teeth = [];
  for (let row = 0; row <= n; row++) {
    const y = box.y0 + (box.h * row) / n;
    for (let c = 0; c <= n; c++) {
      const x = box.x0 + (box.w * (row % 2 ? n - c : c)) / n;
      if (far([x, y])) teeth.push([x, y]);
    }
  }
  return [...traceOf(ref), teeth];
}
const halved = (ref, frac = 0.5) => [
  ...pen.partsOf(ref).filter((p) => p.kind === 'stroke').map((p) => {
    const pts = [];
    for (let at = 0; at <= p.poly.len * frac; at += 8) pts.push(pen.pointAt(p.poly, at).at);
    return pts;
  }),
  ...dotSeats(ref).map(tapAt),
];
const flipped = (ref) => {
  const box = pen.inkBox(bodyStrokes(ref));
  return [...bodyStrokes(ref), ...dotSeats(ref).map((at) => tapAt([at[0], 2 * box.cy - at[1]]))];
};
const flatThree = (ref) => {
  const seats = dotSeats(ref);
  const xs = seats.map((s) => s[0]);
  const y = seats.reduce((s, p) => s + p[1], 0) / seats.length;
  return [...bodyStrokes(ref), lineBetween([Math.min(...xs), y], [Math.max(...xs), y], 14)];
};

/** السوالبُ العشرُ المصنوعة — بنصّ `tools/test_shape.mjs §٣` وأسبابِها المنتظَرة. */
function madeNegatives() {
  const HA = PATHS['ه'].isolated; const MEEM = PATHS['م'].isolated;
  const HHA = PATHS['ح'].isolated; const NOON = PATHS['ن'].isolated;
  const JEEM = PATHS['ج'].isolated; const TA = PATHS['ت'].isolated;
  const THA = PATHS['ث'].isolated; const KAF = PATHS['ك'].isolated;
  const jBox = pen.inkBox(bodyStrokes(JEEM));
  return [
    ['خربشةٌ كثيفةٌ فوق نموذجٍ صحيح', 'ه', 'isolated', HA, scribbled(HA), 'stray-ink'],
    ['نصفُ الحرف الأول (م)', 'م', 'isolated', MEEM, halved(MEEM), 'part-missing'],
    ['نصفُ الحرف الأول (ح)', 'ح', 'isolated', HHA, halved(HHA), 'part-missing'],
    ['نقطةٌ في غير جهتها (ن ⇐ تحت)', 'ن', 'isolated', NOON, flipped(NOON), 'dots-side'],
    ['نقطةٌ في غير جهتها (ج ⇐ فوق)', 'ج', 'isolated', JEEM,
      [...bodyStrokes(JEEM), tapAt([dotSeats(JEEM)[0][0], jBox.y0 - 0.3 * jBox.h])], 'dots-side'],
    ['عددُ نقاطٍ ناقص (ت بنقطة)', 'ت', 'isolated', TA,
      [...bodyStrokes(TA), tapAt(dotSeats(TA)[0])], 'dots-count'],
    ['عددُ نقاطٍ زائد (ت بثلاث)', 'ت', 'isolated', TA,
      [...traceOf(TA), tapAt([dotSeats(TA)[0][0] + tolOf(TA), dotSeats(TA)[0][1]])], 'dots-count'],
    ['جزءٌ واحدٌ من متعدّد (ك بلا شولتها)', 'ك', 'isolated', KAF, [bodyStrokes(KAF)[0]], 'part-missing'],
    ['نقرةٌ زائدةٌ على حرفٍ بلا نقاط', 'ه', 'isolated', HA,
      [...bodyStrokes(HA), tapAt([pen.inkBox([pen.refPoints(HA)]).x1 + 2 * tolOf(HA), bodyMidY(HA)])], 'dots-count'],
    ['ثلاثٌ شَرْطةً مسطّحةً بلا رأس', 'ث', 'isolated', THA, flatThree(THA), 'dots-span'],
  ];
}

/** شهودُ ديون البنية الثلاثة — بنصّ `tools/test_pen.mjs §٣` حرفياً. */
function debtWitnesses() {
  const HHA = PATHS['ح'].isolated;
  const NOON = PATHS['ن'].isolated;
  const MEEM_I = PATHS['م'].initial;
  const bodyOf = (ref) => pen.partsOf(ref).filter((q) => q.kind === 'stroke')
    .map((q) => q.poly.pts.map((p) => [p[0], p[1]]));
  const atk = JSON.parse(readFileSync(new URL('tools/fixtures/clinic-attack-meem.json', ROOT), 'utf8'));
  const bx = pen.inkBox([pen.refPoints(HHA)]);
  const dense = [];
  for (let i = 0; i < 160; i++) {
    dense.push([bx.x0 + (i % 16) * (bx.w / 16),
      bx.y0 + ((i / 16) | 0) * (bx.h / 10) + ((i % 2) ? 40 : -40)]);
  }
  return [
    ['هجومُ المالك المجمَّد', 'م', 'initial', MEEM_I, atk.strokes],
    ['خربشةُ الممرّ الكثيفة', 'ح', 'isolated', HHA, [dense]],
    ['نقرةُ الركن الأعلى', 'ن', 'isolated', NOON, [bodyOf(NOON)[0], [[8, 8], [8, 8]]]],
  ];
}

/** حالاتُ الامتحان كلُّها، وحكمُ القواعد على كلٍّ منها. */
function buildCases() {
  const out = [];
  FIELD.forEach((row, i) => {
    const ref = PATHS[row.ch]?.[row.form];
    if (!ref) return;
    const v = pen.judgeShape(ref, row.strokes);
    out.push({
      id: `field-${i + 1}`, kind: 'field', ch: row.ch, form: row.form,
      eye: row.eye === 'accept', hand: row.hand,
      rules: { ok: v.ok, why: v.why }, strokes: row.strokes,
    });
  });
  for (const [label, ch, form, ref, strokes, why] of madeNegatives()) {
    const v = pen.judgeShape(ref, strokes);
    out.push({
      id: `neg-${out.filter((c) => c.kind === 'made').length + 1}`, kind: 'made',
      label, ch, form, eye: false, want: why,
      rules: { ok: v.ok, why: v.why }, strokes,
    });
  }
  for (const [label, ch, form, ref, strokes] of debtWitnesses()) {
    const v = pen.judgeShape(ref, strokes);
    out.push({
      id: `debt-${out.filter((c) => c.kind === 'debt').length + 1}`, kind: 'debt',
      label, ch, form, eye: false,
      rules: { ok: v.ok, why: v.why }, strokes,
    });
  }
  // مراجعُنا نظيفةً — قطريّةُ الأخوات على النموذج المرجعيّ نفسِه
  for (const fam of FAMILIES) {
    for (const ch of fam) {
      for (const form of ['isolated', 'medial']) {
        const ref = PATHS[ch]?.[form];
        if (!ref) continue;
        out.push({
          id: `ref-${ch}-${form}`, kind: 'ref', ch, form, eye: true,
          rules: { ok: true, why: null }, strokes: traceOf(ref),
        });
      }
    }
  }
  return out;
}

/* ═════ ٢) الأنماط ═════ */

if (mode === 'cases') {
  const cases = buildCases();
  const path = write('out/cases.jsonl', cases.map((c) => JSON.stringify(c)) .join('\n') + '\n');
  const by = (k) => cases.filter((c) => c.kind === k);
  const field = by('field');
  const agree = field.filter((c) => c.rules.ok === c.eye).length;
  console.log(`✓ ${path}`);
  console.log(`  الميدان ${field.length} · موافقةُ القواعدِ العينَ ${agree}/${field.length}`
    + ` (ردٌّ كاذب ${field.filter((c) => c.eye && !c.rules.ok).length}`
    + ` · قبولٌ كاذب ${field.filter((c) => !c.eye && c.rules.ok).length})`);
  console.log(`  المصنوعُ ${by('made').length} · تردُّه القواعدُ ${by('made').filter((c) => !c.rules.ok).length}`);
  console.log(`  شهودُ الديون ${by('debt').length} · تردُّه القواعدُ ${by('debt').filter((c) => !c.rules.ok).length}`
    + '  ← 🔴 وهي الديونُ الثلاثة القائمة');
  for (const c of by('debt')) console.log(`     · ${c.label}: القواعدُ ${c.rules.ok ? 'تقبل 🔴' : 'تردّ ✓'}`);
  console.log(`  مراجعُنا ${by('ref').length} أثراً نظيفاً`);
}

if (mode === 'sisters-rules') {
  /* مصفوفةُ الأخوات لمحرّكنا الحاليّ على `Hijja` — **قبل تدريب أيّ شيء**.
   * لكلِّ صورةٍ صنفُها: أيقبلها حَكَمُنا حرفَها؟ وأيقبلها أختاً من أخواتها؟ */
  const tracesPath = flag('traces', 'out/hijja-all.jsonl');
  const per = Number(flag('per', '60'));
  const raw = readFileSync(new URL(tracesPath, HERE).pathname, 'utf8').trim().split('\n');
  const buckets = new Map();
  for (const line of raw) {
    const t = JSON.parse(line);
    if (!t.form || !t.strokes.length) continue;
    const key = `${t.ch}|${t.form}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(t);
  }
  const sisterOf = {};
  for (const fam of FAMILIES) for (const a of fam) sisterOf[a] = fam.filter((b) => b !== a);

  // مقياسٌ ثابتُ البذرة: أوّلُ `per` من كلِّ سلّة بترتيب الملفّ (وهو ترتيبُ المعرِّف).
  const rows = [];
  let n = 0;
  const t0 = Date.now();
  const keys = [...buckets.keys()].filter((k) => sisterOf[k.split('|')[0]]).sort();
  for (const key of keys) {
    const [ch, form] = key.split('|');
    const ref = PATHS[ch]?.[form];
    if (!ref) continue;
    const sisters = sisterOf[ch].filter((b) => PATHS[b]?.[form]);
    const items = buckets.get(key).slice(0, per);
    let self = 0; const sisterHits = {}; const whys = {};
    for (const b of sisters) sisterHits[b] = 0;
    for (const t of items) {
      const v = pen.judgeShape(ref, t.strokes);
      if (v.ok) self++; else whys[v.why] = (whys[v.why] || 0) + 1;
      for (const b of sisters) {
        if (pen.judgeShape(PATHS[b][form], t.strokes).ok) sisterHits[b]++;
      }
      n++;
      if (n % 200 === 0) {
        process.stdout.write(`  · ${n} أثراً · ${((Date.now() - t0) / 1000).toFixed(0)}ث\r`);
      }
    }
    rows.push({ ch, form, n: items.length, self, sisters: sisterHits, whys });
  }
  const path = write('out/sisters-rules.json', JSON.stringify(rows, null, 1));
  console.log(`\n✓ ${path} · ${n} أثراً في ${((Date.now() - t0) / 1000).toFixed(0)}ث`);
  console.log('\n| الحرف | الشكل | ن | يقبله حرفَه | يقبله أختاً | أسبابُ ردِّه عن حرفه |');
  console.log('|---|---|---|---|---|---|');
  let tot = 0; let selfTot = 0; let sisTot = 0;
  for (const r of rows) {
    const anySis = Object.values(r.sisters).reduce((a, b) => a + b, 0);
    const names = Object.entries(r.sisters).filter(([, v]) => v)
      .map(([b, v]) => `${b}:${v}`).join(' · ') || '—';
    const why = Object.entries(r.whys).sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}:${v}`).join(' · ') || '—';
    console.log(`| ${r.ch} | ${r.form} | ${r.n} | ${r.self} (${pc(r.self / r.n)}) | ${names} | ${why} |`);
    tot += r.n; selfTot += r.self; sisTot += anySis;
  }
  const allWhy = {};
  for (const r of rows) for (const [k, v] of Object.entries(r.whys)) allWhy[k] = (allWhy[k] || 0) + v;
  console.log(`\nالمجموع: ${tot} أثراً · قُبِل حرفَه ${selfTot} (${pc(selfTot / tot)})`
    + ` · مجموعُ قبولات الأخوات ${sisTot}`);
  console.log('أسبابُ الردّ كلُّها: ' + Object.entries(allWhy).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${v} (${pc(v / (tot - selfTot))})`).join(' · '));
}

if (mode === 'report') {
  /* الشروطُ الأربعة رقماً رقماً، ومنحنى العتبة. */
  const cases = readFileSync(new URL('out/cases.jsonl', HERE).pathname, 'utf8')
    .trim().split('\n').map((l) => JSON.parse(l));
  const preds = JSON.parse(readFileSync(new URL(flag('preds', 'out/preds.json'), HERE).pathname, 'utf8'));
  const P = preds.byId || preds;
  const by = (k) => cases.filter((c) => c.kind === k);
  /**
   * **قاعدتا قبولٍ لا واحدة — وتُعلَنان معاً** لئلّا يكون الحكمُ أثرَ اختياري:
   *   `argmax` (المعلَنةُ في البند): أعلى صنفٍ هو المطلوبُ وثقتُه ≥ العتبة.
   *   `target` (الأكرمُ للنموذج): احتمالُ الحرف المطلوب وحدَه ≥ العتبة، ولو
   *   سبقه غيرُه. **فإن سقط النموذجُ بالكريمة أيضاً فسقوطُه ليس أثرَ مسطرة.**
   */
  const RULES = {
    argmax: (p, ch, t) => Boolean(p) && p.top === ch && p.conf >= t,
    target: (p, ch, t) => Boolean(p) && p.target_p >= t,
  };
  let RULE = flag('rule', 'argmax');
  const modelOk = (c, t) => RULES[RULE](P[c.id], c.ch, t);

  const field = by('field'); const made = by('made'); const debt = by('debt'); const refs = by('ref');
  const rulesAgree = field.filter((c) => c.rules.ok === c.eye).length;

  const sweep = () => {
    const rows = [];
    for (let t = 0; t <= 0.951; t += 0.05) {
      rows.push({
        t: +t.toFixed(2),
        agree: field.filter((c) => modelOk(c, t) === c.eye).length,
        fr: field.filter((c) => c.eye && !modelOk(c, t)).length,
        fa: field.filter((c) => !c.eye && modelOk(c, t)).length,
        negOk: made.filter((c) => !modelOk(c, t)).length,
        debtOk: debt.filter((c) => !modelOk(c, t)).length,
        refOk: refs.filter((c) => modelOk(c, t)).length,
        refN: refs.length,
      });
    }
    return rows;
  };
  const other = RULE === 'argmax' ? 'target' : 'argmax';
  RULE = other; const curveOther = sweep(); RULE = other === 'argmax' ? 'target' : 'argmax';
  const bestOther = curveOther.reduce((a, b) => (b.agree > a.agree ? b : a), curveOther[0]);

  console.log('\n════ منحنى العتبة ════');
  console.log('| العتبة | موافقةُ العين (٦٠) | ردٌّ كاذب | قبولٌ كاذب | المصنوعُ مردودٌ (١٠) | شهودُ الديون مردودةٌ (٣) | مراجعُنا مقبولةٌ |');
  console.log('|---|---|---|---|---|---|---|');
  const curve = [];
  for (let t = 0; t <= 0.951; t += 0.05) {
    const agree = field.filter((c) => modelOk(c, t) === c.eye).length;
    const fr = field.filter((c) => c.eye && !modelOk(c, t)).length;
    const fa = field.filter((c) => !c.eye && modelOk(c, t)).length;
    const negOk = made.filter((c) => !modelOk(c, t)).length;
    const debtOk = debt.filter((c) => !modelOk(c, t)).length;
    const refOk = refs.filter((c) => modelOk(c, t)).length;
    curve.push({ t: +t.toFixed(2), agree, fr, fa, negOk, debtOk, refOk, refN: refs.length });
    console.log(`| ${t.toFixed(2)} | ${agree}/60 | ${fr} | ${fa} | ${negOk}/10 | ${debtOk}/3 | ${refOk}/${refs.length} |`);
  }

  console.log(`\n════ منحنى العتبة بالقاعدة الأكرم «${other}» ════`);
  console.log('| العتبة | موافقةُ العين (٦٠) | ردٌّ كاذب | قبولٌ كاذب | المصنوعُ مردودٌ (١٠) | شهودُ الديون مردودةٌ (٣) | مراجعُنا مقبولةٌ |');
  console.log('|---|---|---|---|---|---|---|');
  for (const r of curveOther) {
    console.log(`| ${r.t.toFixed(2)} | ${r.agree}/60 | ${r.fr} | ${r.fa} | ${r.negOk}/10`
      + ` | ${r.debtOk}/3 | ${r.refOk}/${r.refN} |`);
  }

  console.log(`\n════ الشروطُ الأربعة ════`);
  const best = curve.reduce((a, b) => (b.agree > a.agree ? b : a), curve[0]);
  console.log(`١) الغلبةُ على حصادنا: القواعدُ ${rulesAgree}/60 · النموذجُ أفضلُه ${best.agree}/60 عند عتبة ${best.t}`
    + ` ⇒ ${best.agree > rulesAgree ? 'يغلب' : 'لا يغلب'} (الفارق ${best.agree - rulesAgree})`);

  // ٢) قطريّةُ الأخوات: على مراجعنا (كلُّ مرجعٍ يُقرأ حرفَه) وعلى حصادنا الشرعيّ
  const refMiss = refs.filter((c) => P[c.id]?.top !== c.ch)
    .map((c) => `${c.ch}/${c.form} ⇐ ${P[c.id]?.top}`);
  const legit = field.filter((c) => c.eye);
  const fieldMiss = legit.filter((c) => P[c.id]?.top !== c.ch)
    .map((c) => `${c.ch}/${c.form} ⇐ ${P[c.id]?.top} (${(P[c.id]?.conf ?? 0).toFixed(2)})`);
  console.log(`٢) قطريّةُ الأخوات — مراجعُنا: ${refs.length - refMiss.length}/${refs.length}`
    + ` · حصادُنا الشرعيّ: ${legit.length - fieldMiss.length}/${legit.length}`);
  for (const m of refMiss) console.log(`     🔴 مرجع: ${m}`);
  for (const m of fieldMiss) console.log(`     🔴 ميدان: ${m}`);

  console.log(`٣) الردُّ: المصنوعُ ${best.negOk}/10 · شهودُ الديون ${best.debtOk}/3 (عند ${best.t})`);
  for (const c of [...made, ...debt]) {
    const p = P[c.id];
    console.log(`     ${c.kind === 'debt' ? '⚑' : '·'} ${c.label}: النموذجُ يقرؤه`
      + ` «${p?.top}» بثقة ${(p?.conf ?? 0).toFixed(2)} — والمطلوب ليس «${c.ch}»`
      + ` ⇒ ${p?.top === c.ch ? '🔴 يقبله' : '✓ يردّه بالصنف'}`);
  }
  console.log(`٤) الحجمُ والاستدلال: يُقرأ من out/model-size.json`);

  /**
   * ═════ وقياسٌ خامسٌ **خارج قاعدة القرار** — يُقاس ولا يُقرّر ═════
   * قاعدةُ القرار تسأل عن النموذج **حَكَماً للقبول**. وهذا يسأل سؤالاً آخر:
   * ماذا لو لم يُعطَ القبولَ أصلاً، **بل النقضَ وحدَه**؟ أي: **القواعدُ تقبل،
   * والنموذجُ ينقض إن قال بثقةٍ إنّ هذا حرفٌ آخر**. وهو الموضعُ الذي تعجز فيه
   * القواعدُ بنصّ الديون الثلاثة. **والرقمُ يُطبع، والتبنّي قرارُ مالكٍ لا قرارُ
   * هذا التقرير.**
   */
  console.log('\n════ (خارجَ القاعدة) الحَكَمُ المركَّب: القواعدُ تقبل والنموذجُ ينقض ════');
  console.log('| عتبةُ النقض | موافقةُ العين (٦٠) | ردٌّ كاذب | قبولٌ كاذب | المصنوعُ مردودٌ (١٠) | شهودُ الديون مردودةٌ (٣) | مراجعُنا مقبولةٌ |');
  console.log('|---|---|---|---|---|---|---|');
  const veto = (c, v) => {
    const p = P[c.id];
    return Boolean(p) && p.top !== c.ch && p.conf >= v;
  };
  const both = (c, v) => c.rules.ok && !veto(c, v);
  const mixed = [];
  for (let v = 0.30; v <= 0.951; v += 0.05) {
    const row = {
      v: +v.toFixed(2),
      agree: field.filter((c) => both(c, v) === c.eye).length,
      fr: field.filter((c) => c.eye && !both(c, v)).length,
      fa: field.filter((c) => !c.eye && both(c, v)).length,
      negOk: made.filter((c) => !both(c, v)).length,
      debtOk: debt.filter((c) => !both(c, v)).length,
      refOk: refs.filter((c) => both(c, v)).length,
    };
    mixed.push(row);
    console.log(`| ${row.v.toFixed(2)} | ${row.agree}/60 | ${row.fr} | ${row.fa}`
      + ` | ${row.negOk}/10 | ${row.debtOk}/3 | ${row.refOk}/${refs.length} |`);
  }
  write('out/mixed.json', JSON.stringify(mixed, null, 1));
  write('out/curve.json', JSON.stringify({ rule: RULE, rulesAgree, curve,
    other: { rule: other, curve: curveOther } }, null, 1));
}
