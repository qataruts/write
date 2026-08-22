// ⚗️ **جدولُ الحقيقة للنقاط** (م٨، ٢٣ أغسطس ٢٠٢٦) — قياسٌ لا منتَج، ولا يُكتب ملفّ.
//   node tools/dot_truth.mjs            الجدولان كاملين
//   node tools/dot_truth.mjs --brief    الحفرُ وحدَها
//
// **السؤالان**: (أ) أتُقبَل الاصطلاحاتُ الثلاثةُ على حرفها؟ — نقرةٌ = ١ · شَرطةٌ = ٢ ·
// زاويةٌ = ٣ **بأعيانها**. (ب) أتُقبَل على حرفٍ ليس لها؟ — شَرطةٌ فوق «ن» · زاويةٌ فوق «ت».
//
// **والعلامةُ تُبنى في منطقة نقاط الحرف نفسِه** (فالجهةُ والمنطقةُ ليستا محلَّ السؤال):
// مركزُها مركزُ نقاط المرجع، ومدُّها من **وسيط** فجوات النماذج ذوات العدد نفسِه في
// الشكل نفسِه — فلا يُقاس اصطلاحٌ بمسطرةِ حرفٍ واحد.

import { PATHS } from '../app/js/paths.js';
import * as pen from '../app/js/pen.js';

const BRIEF = process.argv.includes('--brief');
const FAMILIES = [['ب', 'ت', 'ث', 'ن', 'ي'], ['ج', 'ح', 'خ'], ['د', 'ذ'], ['ر', 'ز'],
  ['ط', 'ظ'], ['ص', 'ض'], ['ع', 'غ'], ['س', 'ش'], ['ف', 'ق']];
const FORMS = ['isolated', 'initial', 'medial', 'final'];
const SHORT = { isolated: 'معزول', initial: 'أوّليّ', medial: 'وسطيّ', final: 'نهائيّ' };

const bodyStrokes = (ref) => pen.partsOf(ref).filter((p) => p.kind === 'stroke')
  .map((p) => p.poly.pts.map((q) => [q[0], q[1]]));
const seatsOf = (ref) => pen.partsOf(ref).filter((p) => p.kind === 'dot')
  .flatMap((p) => Array.from({ length: p.count || 1 }, () => [p.at[0], p.at[1]]));
const tapAt = (at) => [[at[0], at[1]], [at[0], at[1]], [at[0], at[1]]];
const lineBetween = (a, b, n = 12) => Array.from({ length: n + 1 },
  (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);
const median = (a) => (a.length ? [...a].sort((x, y) => x - y)[(a.length / 2) | 0] : 0);

/* ————— مدُّ العلامة: وسيطُ فجوات المراجع ذوات العدد نفسِه في الشكل نفسِه ————— */
const spanBook = {};   // spanBook[form][count] = وسيطُ المدّ الأفقيّ
for (const form of FORMS) {
  spanBook[form] = {};
  for (const n of [2, 3]) {
    const spans = [];
    for (const ch of Object.keys(PATHS)) {
      const ref = PATHS[ch]?.[form];
      if (!ref) continue;
      const s = seatsOf(ref);
      if (s.length !== n) continue;
      spans.push(Math.max(...s.map((p) => p[0])) - Math.min(...s.map((p) => p[0])));
    }
    spanBook[form][n] = median(spans);
  }
}

/** مركزُ منطقة نقاط المرجع — وإليه تُنسَب كلُّ علامةٍ مصنوعة. */
const dotHub = (ref) => {
  const s = seatsOf(ref);
  return [s.reduce((a, p) => a + p[0], 0) / s.length, s.reduce((a, p) => a + p[1], 0) / s.length];
};

/**
 * **الاصطلاحاتُ الخمسة** — قيمتُها المقصودة في القانون: نقرةٌ بعددها · شَرطةٌ ٢ · زاويةٌ ٣.
 * وما وافق عددَ نقاط الحرف يُرسم على **مقاعده هو**، وما خالفه يُرسم في **منطقته**
 * بمدٍّ من دفتر المدود — فالسؤالُ عن الشكل لا عن الموضع.
 */
const CONVENTIONS = [
  { key: 'نقرة×١', value: 1 },
  { key: 'نقرة×٢', value: 2 },
  { key: 'نقرة×٣', value: 3 },
  { key: 'شَرطة', value: 2 },
  { key: 'زاوية', value: 3 },
];

function markOf(ref, conv) {
  const seats = seatsOf(ref);
  const hub = dotHub(ref);
  const spanFor = (n) => {
    const own = seats.length === n
      ? Math.max(...seats.map((p) => p[0])) - Math.min(...seats.map((p) => p[0])) : 0;
    return own || spanBook[ref.__form][n] || spanBook.isolated[n];
  };
  if (conv.key.startsWith('نقرة')) {
    const n = conv.value;
    if (n === seats.length) return seats.map(tapAt);
    if (n === 1) return [tapAt(hub)];
    /**
     * **ونقراتُ العدد المخالف تُباعَد فوق نصف قطر الدمج** — وإلّا خلطنا حفرةَ العدّ
     * بقاعدة **نقر التوكيد** القائمة (علامتان متلاصقتان نقرٌ على نقطةٍ واحدة):
     * فمباعدةُ الجارَين ١٫٣ × نصفِ قطر الدمج تجعل كلَّ نقرةٍ علامةً قائمةً بنفسها.
     */
    const tol = pen.easeTolerance(pen.resolveTolerance(ref.tolerance)).lateral;
    const step = Math.max(spanFor(n) / (n - 1), 1.3 * 0.45 * tol);
    const w = step * (n - 1);
    return Array.from({ length: n }, (_, i) => tapAt([hub[0] - w / 2 + step * i, hub[1]]));
  }
  if (conv.key === 'شَرطة') {
    const w = spanFor(2);
    return [lineBetween([hub[0] - w / 2, hub[1]], [hub[0] + w / 2, hub[1]], 14)];
  }
  // زاويةٌ رأسُها لفوق — كما في `test_shape.angleThree`: الرأسُ يعلو بنصف المدّ.
  const w = spanFor(3);
  const l = [hub[0] - w / 2, hub[1]]; const r = [hub[0] + w / 2, hub[1]];
  const apex = [hub[0], hub[1] - w / 2];
  return [[...lineBetween(l, apex, 8), ...lineBetween(apex, r, 8).slice(1)]];
}

const traceWith = (ref, conv) => [...bodyStrokes(ref), ...markOf(ref, conv)];

/* ═════ جدولُ (أ): الاصطلاحُ على حرفِه — أيُشبِع مقاعدَه؟ ═════ */
const dotted = [];
for (const ch of Object.keys(PATHS)) {
  for (const form of FORMS) {
    const ref = PATHS[ch]?.[form];
    if (!ref || !ref.strokes?.length) continue;
    const n = seatsOf(ref).length;
    if (!n) continue;
    ref.__form = form; ref.ch = ch;
    dotted.push({ ch, form, ref, n });
  }
}

console.log(`\n═══ جدولُ (أ): الاصطلاحُ على حرفِه — ${dotted.length} شكلاً ذا نقاط ═══`);
console.log('   (✓ قُبل · ✗ رُدّ · والمنتظَرُ: قبولٌ إن ساوت قيمةُ الاصطلاح عددَ النقاط)\n');
const head = `${'الشكل'.padEnd(14)}ن  ` + CONVENTIONS.map((c) => c.key.padEnd(8)).join('');
console.log(head);
const holesA = [];
for (const row of dotted) {
  const cells = [];
  for (const conv of CONVENTIONS) {
    const want = conv.value === row.n;
    let got; let why = '';
    try {
      const v = pen.judgeShape(row.ref, traceWith(row.ref, conv));
      got = v.ok; why = v.why || '';
    } catch (e) { got = false; why = `خطأ:${e.message}`; }
    const mark = got === want ? (got ? '✓' : '·') : (got ? '🟠' : '🔴');
    if (got !== want) holesA.push({ ...row, conv, got, why });
    cells.push((mark + (got === want ? '' : why.replace('dots-', '').slice(0, 5))).padEnd(8));
  }
  const line = `${(row.ch + '/' + SHORT[row.form]).padEnd(14)}${row.n}  ${cells.join('')}`;
  if (!BRIEF || cells.some((c) => c.includes('🔴') || c.includes('🟠'))) console.log(line);
}
console.log(`\n   الحفرُ في (أ): ${holesA.length} من ${dotted.length * CONVENTIONS.length}`);
const wrongAccept = holesA.filter((h) => h.got);
const wrongReject = holesA.filter((h) => !h.got);
console.log(`      🟠 قُبل ما ليس له (${wrongAccept.length}): `
  + [...new Set(wrongAccept.map((h) => `${h.conv.key}⇐${h.ch}(${h.n})`))].join(' · '));
console.log(`      🔴 رُدّ صوابُه (${wrongReject.length}): `
  + [...new Set(wrongReject.map((h) => `${h.conv.key}⇐${h.ch}(${h.n}) ${h.why}`))].join(' · '));

/* ═════ جدولُ (ب): الاصطلاحُ على أخواته — أيُقرأ حرفاً ليس هو؟ ═════ */
console.log('\n═══ جدولُ (ب): أثرُ الاصطلاح على أخواته (المعزول والوسطيّ) ═══');
console.log('   (المنتظَر: يُقبل على حرفِه ويُرَدّ على كلِّ أخواته)\n');
const holesB = [];
let cells = 0;
for (const family of FAMILIES) {
  for (const form of ['isolated', 'medial']) {
    for (const a of family) {
      const ra = PATHS[a]?.[form];
      if (!ra || !ra.strokes?.length) continue;
      ra.__form = form; ra.ch = a;
      const na = seatsOf(ra).length;
      for (const conv of CONVENTIONS) {
        if (conv.value !== na) continue;      // الاصطلاحُ الصادقُ عن هذا الحرف
        if (conv.key.startsWith('نقرة') && na !== conv.value) continue;
        const ink = traceWith(ra, conv);
        const out = [];
        for (const b of family) {
          const rb = PATHS[b]?.[form];
          if (!rb || !rb.strokes?.length) continue;
          const v = pen.judgeShape(rb, ink);
          const want = a === b;
          cells++;
          if (v.ok !== want) { holesB.push({ a, b, form, conv, ok: v.ok, why: v.why }); out.push(`${v.ok ? '🟠' : '🔴'}${b}${v.ok ? '' : `(${(v.why || '').replace('dots-', '')})`}`); }
          else out.push(`${want ? '✓' : '·'}${b}`);
        }
        if (!BRIEF || out.some((o) => o.startsWith('🟠') || o.startsWith('🔴'))) {
          console.log(`${(a + '/' + SHORT[form]).padEnd(14)}${conv.key.padEnd(8)} ${out.join(' ')}`);
        }
      }
    }
  }
}
console.log(`\n   الحفرُ في (ب): ${holesB.length} من ${cells}`);
for (const h of holesB) {
  console.log(`      ${h.ok ? '🟠 قُبل' : '🔴 رُدّ'} ${h.conv.key} من «${h.a}» على «${h.b}»/${SHORT[h.form]}`
    + (h.ok ? '' : ` — ${h.why}`));
}

console.log(`\n■ الخلاصة: (أ) ${holesA.length} حفرةً — قبولٌ كاذب ${wrongAccept.length}`
  + ` وردٌّ كاذب ${wrongReject.length} · (ب) ${holesB.length} حفرة.`);
