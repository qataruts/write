// **قياسُ مرشّحٍ من مرشّحات الكرّاسة** على المحرّك نفسِه (الجلسة ٧):
//
//   node tools/craft_measure.mjs <paths.json> <ا/final> <ل/medial> …
//
// يقرأ مساراتِ مرشّحٍ **بُنيت للتوّ** (لا من `app/js/paths.js`: المرشّحُ لم يدخل
// المنهجَ ولا يدخله إلا بحكم المالك) ويُدخلها على `pen.js` — فيخرج لكلِّ شكلٍ:
//
//   · أجزاؤه ونقاطُه وطيّاتُه المعلَنة (ماذا صار الحرفُ في يد الطفل؟)
//   · أيَقبله المحرّكُ مكتوباً صحيحاً؟ وأيردّه معكوساً؟ (شرطُ كلِّ مسارٍ في المنهج)
//   · **هامشُ رجفة يدِ الطفل**: أقصى انحرافٍ عرضيّ يحتمله وهو صحيح — وعهدُه
//     `child-drift` (نصفُ سماحة المحرّك) كما في `tools/test_paths.mjs`
//   · وإن كانت فيه طيّةٌ معلَنة: أتُقبَل السنّةُ **على خطٍّ واحد** وعلى الأثر الرطب؟
//     (وهو ما يفعله الطفلُ في «اكتبه وحدك»)
//
// **ولا حكمَ في هذا الملف**: أرقامٌ تُطبع JSON ويقرؤها `craft_panel.py` فيضعها تحت
// كلِّ مرشّحٍ في لوحة المالك. الحكمُ للمالك، والقياسُ شاهدُه.

import { readFileSync } from 'node:fs';

const pen = await import(new URL('../app/js/pen.js', import.meta.url));

const [file, ...wanted] = process.argv.slice(2);
const paths = JSON.parse(readFileSync(file, 'utf8'));

function walk(points, { from = 0, to = 1, step = 14, sway = 0 } = {}) {
  const poly = pen.prepare(points);
  const count = Math.max(2, Math.round((Math.abs(to - from) * poly.len) / step));
  const out = [];
  for (let i = 0; i <= count; i++) {
    const ratio = from + (to - from) * (i / count);
    const { at, dir } = pen.pointAt(poly, ratio * poly.len);
    const norm = Math.hypot(dir[0], dir[1]) || 1;
    const off = sway ? Math.sin(ratio * Math.PI * 2) * sway : 0;
    out.push([at[0] + (-dir[1] / norm) * off, at[1] + (dir[0] / norm) * off]);
  }
  return out;
}
const taps = (ref) => (ref.dots || []).flatMap((d) =>
  Array.from({ length: d.count || 1 }, () => [d.at, d.at, d.at]));
const trace = (ref, opts) => [...ref.strokes.map((s) => walk(s.points, opts)), ...taps(ref)];

/** العودةُ على الأثر الرطب: يصعد ضلعَ الطيّة ثم ينزل عليه هو (أطبعُ ما تفعله يدُ طفل). */
function retrace(points, fold) {
  const rising = points.slice(fold.from, fold.apex + 1);
  return [...points.slice(0, fold.from + 1), ...rising.slice(1),
    ...[...rising].reverse().slice(1), ...points.slice(fold.to + 1)];
}
/** خطٌّ واحد بين ضلعَي الطيّة صعوداً ثم نزولاً. */
function spine(points, fold, steps = 24) {
  const up = pen.prepare(points.slice(fold.from, fold.apex + 1));
  const down = pen.prepare(points.slice(fold.apex, fold.to + 1));
  const mid = [];
  for (let i = 0; i <= steps; i++) {
    const a = pen.pointAt(up, (i / steps) * up.len).at;
    const b = pen.pointAt(down, (1 - i / steps) * down.len).at;
    mid.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
  }
  return [...points.slice(0, fold.from + 1), ...mid,
    ...[...mid].reverse().slice(1), ...points.slice(fold.to + 1)];
}
const byHand = (make) => (ref) => [
  ...ref.strokes.map((s) => walk(s.folds?.length ? make(s.points, s.folds[0]) : s.points)),
  ...taps(ref),
];

const out = {};
for (const key of wanted) {
  const [ch, form] = key.split('/');
  const ref = paths[ch]?.[form];
  if (!ref) { out[key] = { missing: true }; continue; }
  const good = pen.judge(ref, trace(ref));
  const back = pen.judge(ref, trace(ref, { from: 1, to: 0 }));
  let drift = 0;
  for (let sway = 0; sway <= pen.TOLERANCE.lateral; sway += 3) {
    if (!pen.judge(ref, trace(ref, { sway })).accepted) break;
    drift = sway;
  }
  const folds = ref.strokes.reduce((n, s) => n + (s.folds?.length || 0), 0);
  const row = {
    strokes: ref.strokes.length,
    dots: (ref.dots || []).reduce((n, d) => n + (d.count || 1), 0),
    marks: (ref.dots || []).length,
    folds,
    accepted: good.accepted,
    why: good.accepted ? null : good.primary,
    reverseRejected: !back.accepted,
    reverseWhy: back.primary,
    drift,
    floor: Math.round(pen.TOLERANCE.lateral * 0.5),
  };
  if (folds) {
    row.wet = pen.judge(ref, byHand(retrace)(ref)).accepted;
    row.spine = pen.judge(ref, byHand(spine)(ref)).accepted;
  }
  out[key] = row;
}
console.log(JSON.stringify(out, null, 1));
