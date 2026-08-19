// **حارسُ جهةِ البداية** (جلسة ص٤) بلا متصفّح:
//   node tools/test_direction.mjs            # الحكم
//   node tools/test_direction.mjs --table    # جدولُ الجهات مطبوعاً (١٢٢ شكلاً)
//   node tools/test_direction.mjs --self-test  # مجرَّبٌ سالباً: يُزرَع انقلابٌ فيحمرّ
//
// **علّتُه**: بلاغُ ميدانٍ من المالك (١٨ أغسطس ٢٠٢٦) أنّ أرقامنا تبدأ من الجهة الخطأ.
// فقيست ١٢٢ شكلاً وحُكم في كل أسرة (`docs/STROKE_ORDER.md`)، **والحكمُ لا يحرس نفسَه**:
// يكفي أن تُقلَب إيماءةٌ في `path_anchors.json` ويُعاد البناءُ ليعود العطبُ صامتاً.
//
// **فهذا جدولٌ معلَنٌ لكل شكل**: جهةُ بدايته **وسندُها** — (م) حكمُ المالك · (ع) قاعدةٌ
// عامّة (العربيةُ من اليمين) · (ق) قياسٌ من مساراتنا لم يُحكَم فيه بعد. **والفاحصُ
// يقيسها من المسار نفسِه** لا من الإيماءة، فما تبدّل صامتاً يحمرّ. **وما خالف القاعدةَ
// العامّة يخالفها بعلّةٍ مكتوبة** — سطرٌ بلا علّةٍ يحمرّ ولو طابق المقيس.
//
// وهو نظيرُ جدول الحقيقة الإملائية في النقاط (`check_paths.py: DOTS_OF`): عددٌ معلَنٌ
// يُقابَل بالمقيس، لا مقيسٌ يُصدَّق على نفسه.

import { PATHS } from '../app/js/paths.js';
import { TOLERANCE } from '../app/js/pen.js';
import { TABLE } from './direction_table.mjs';
import { LETTERS, VARIANTS, DIGITS as TAUGHT_DIGITS, Q3_RULING }
  from '../app/js/curriculum.js';

const FORMS = ['isolated', 'initial', 'medial', 'final'];
const FORM_AR = { isolated: 'معزول', initial: 'ابتدائي', medial: 'وسطي', final: 'نهائي' };
/**
 * **ما لا مدخلَ وصلٍ له** — المعزولُ والابتدائيّ: لا حرفَ قبلهما يصل القلمَ إليهما،
 * فمبدؤهما مبدأُ الحرف نفسِه وعليه تسري أحكامُ الجهة. أمّا الوسطيُّ والنهائيُّ
 * فيأتيهما القلمُ من الحرف قبلهما — **ومبدؤهما مدخلُ وصلهما** (`STROKE_ORDER §٣ج`).
 */
const NO_ENTRY = new Set(['isolated', 'initial']);

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

// ————— المقياس: موضعُ البداية **نسبةً إلى صندوق الشكل نفسِه** لا إلى الشبكة —————
//
// **ولِمَ صندوقُ الشكل؟** لأنّ العمودَ يُخدَع به: ألفٌ في يسار الشبكة تبدأ من «يمين»
// الشبكة وهي في يسارها. وحدودُ التصنيف (٠٫٦ / ٠٫٤) **هي التي قاست بها الإدارةُ**
// الجردَ الأول (٧٤ يميناً و٣٠ يساراً و٦ وسطاً وعموديّان) — فتُقرأ أرقامُ اليوم على
// مسطرة الأمس.
const RIGHT = 0.6;
const LEFT = 0.4;
const THIN = 60;      // عرضٌ دون هذا عمودٌ لا جهةَ فيه

export function boxOf(shape, bodyOnly = false) {
  let x0 = Infinity; let x1 = -Infinity; let y0 = Infinity; let y1 = -Infinity;
  const put = (p) => {
    x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]);
    y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
  };
  for (const s of shape.strokes || []) for (const p of s.points) put(p);
  // **وصندوقُ الجسم يُقاس بلا نقاطه**: نقطةُ الفاء فوق حلقتها، فلو دخلت الصندوقَ
  // لَرُفع سقفُه فقُرئ مبدأٌ في وسط الجسم «أسفلَ الشكل» وهو في وسطه (٠٫٥٢ صارت ٠٫٧٠).
  if (!bodyOnly) for (const d of shape.dots || []) put(d.at);
  return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0 };
}

/** مبدأُ الشكل: بدايةُ أوّل ضربةٍ، ومَن مادّتُه نقرةٌ فموضعُ نقرته. */
export function startOf(shape) {
  const first = (shape.strokes || [])[0];
  if (first) return first.start || first.points[0];
  const dot = (shape.dots || [])[0];
  return dot ? dot.at : null;
}

export function measure(shape) {
  const box = boxOf(shape);
  const body = boxOf(shape, true);
  const at = startOf(shape);
  const rx = box.w > 0 ? (at[0] - box.x0) / box.w : 0.5;
  const ry = box.h > 0 ? (at[1] - box.y0) / box.h : 0.5;
  const bodyRy = body.h > 0 ? (at[1] - body.y0) / body.h : 0.5;
  // **ومَن مادّتُه نقرةٌ لا جهةَ له** (الصفرُ بحكم المالك): صنفٌ قائمٌ بنفسه، فلا
  // يُقرأ صفرٌ «عموديّاً» لأنّ عرضَ نقرته صفر.
  const side = !(shape.strokes || []).length ? 'نقرة'
    : (box.w <= THIN ? 'عمودي' : (rx >= RIGHT ? 'يمين' : (rx <= LEFT ? 'يسار' : 'وسط')));
  return { box, body, at, rx, ry, bodyRy, side };
}

// **والمقياسُ يُستورَد كما يُشغَّل**: مولّدُ الجدول يقرأ `measure` من هنا بعينه، فلا
// مسطرتان — وما دون هذا السطر لا يجري إلا حين يكون هذا الملفُّ هو المُشغَّل.
const RUN = process.argv[1] && process.argv[1].endsWith('test_direction.mjs');

const shapes = [];
for (const [ch, byForm] of Object.entries(PATHS)) {
  for (const form of FORMS) if (byForm[form]) shapes.push({ ch, form, ref: byForm[form], key: `${ch}/${form}` });
}
const DIGITS = [...'٠١٢٣٤٥٦٧٨٩'];
const isDigit = (ch) => DIGITS.includes(ch);
// **والرقمُ لا يتصل ولا يتشكّل**: أشكالُه الأربعة شكلٌ واحد، فيُعلَن مرّةً ويُثبَت
// أنّ الأربعةَ عينُه — فالجدولُ ١٢٢ سطراً لا ١٥٢.
const rows = shapes.filter(({ ch, form }) => !isDigit(ch) || form === 'isolated');

if (!RUN) { /* مستورَدٌ للقياس وحده */ } else {

console.log('— حارسُ جهةِ البداية: ١٢٢ شكلاً بسندٍ مسمّى —');
console.log(`  المسطرة: يمينٌ ≥ ${RIGHT} · يسارٌ ≤ ${LEFT} · وما بينهما وسط · وعرضٌ ≤ ${THIN} عمود`
  + '  (وهي مسطرةُ جرد الإدارة، ١٨ أغسطس ٢٠٢٦)');

console.log('\n— ١) الجدولُ يغطّي المادّةَ كلَّها، ولا سطرَ فيه بلا سند —');
// **وعددُ المادّة يُشتقّ من المنهج لا يُكتب رقماً** (قاعدةُ «الحدُّ العامل لا الثابتُ
// المكتوب»، ١٩ أغسطس ٢٠٢٦): كان `=== 122` فسقط يومَ دخلت الثمانيةُ المتغيّرة الوحدةَ
// بحكم المالك — **ورقمٌ صحيحُ الأمس حارسٌ كاذبُ اليوم**. والمقصودُ أنّ الوحدةَ تغطّي
// ما يعلّمه المنهجُ بعينه: كلُّ حرفٍ ومتغيّرٍ بمواقعه الأربعة، والرقمُ شكلاً واحداً.
// **والمنهجُ يسجّل ساقطَه بنفسه**: متغيّرٌ بلا حاملٍ في سطوح اقرأ كلِّها (`surface: null`
// في `Q3_RULING`) لا يبلغ الطفلَ فلا يُطالَب بمسار — «ؤ» و«ئ» اليوم. **فلا قائمةَ
// تُكتب هنا**: يُقرأ حكمُ المولّد، فيومَ يجد لهما حاملاً يُطالِب بهما من نفسه.
const dropped = new Set(Q3_RULING.filter((r) => !r.surface).map((r) => r.mark));
const variants = Object.keys(VARIANTS).filter((ch) => !dropped.has(ch));
const taught = (Object.keys(LETTERS).length + variants.length) * FORMS.length
  + Object.keys(TAUGHT_DIGITS).length;
ok(rows.length === taught,
  `المادّةُ ${rows.length} شكلاً معلَناً — ويعلّم المنهجُ ${taught}`
  + (dropped.size ? ` (وأسقط ${[...dropped].join('، ')} بلا حامل)` : ''));
ok(Object.keys(TABLE).length === rows.length,
  `والجدولُ ${Object.keys(TABLE).length} سطراً — سطرٌ لكلِّ شكل`);
const orphanRow = Object.keys(TABLE).filter((k) => !rows.some((r) => r.key === k));
ok(orphanRow.length === 0, 'ولا سطرَ في الجدول بلا شكلٍ في المادّة'
  + (orphanRow.length ? ` — يتيمٌ: ${orphanRow.join('، ')}` : ''));
const orphanShape = rows.filter((r) => !TABLE[r.key]);
ok(orphanShape.length === 0, 'ولا شكلَ في المادّة بلا سطرٍ في الجدول — **فشكلٌ جديد يُطالِب من نفسه**'
  + (orphanShape.length ? ` — بلا سطر: ${orphanShape.map((r) => r.key).join('، ')}` : ''));
const badSanad = Object.entries(TABLE).filter(([, row]) => !['م', 'ع', 'ق'].includes(row.sanad));
ok(badSanad.length === 0, 'ولكلِّ سطرٍ سندُه من الثلاثة (م: حكمُ المالك · ع: قاعدةٌ عامّة · ق: قياس)'
  + (badSanad.length ? ` — بلا سند: ${badSanad.map(([k]) => k).join('، ')}` : ''));
// **وما خالف القاعدةَ العامّة يخالفها بعلّةٍ مكتوبة** — لا سطرَ يقول «يسار» ويسكت.
const mute = Object.entries(TABLE).filter(([, row]) => row.side !== 'يمين' && !row.why);
ok(mute.length === 0, 'وكلُّ ما خالف «من اليمين» يخالفها **بعلّةٍ مكتوبة** لا صامتاً'
  + (mute.length ? ` — صامتٌ: ${mute.map(([k]) => k).join('، ')}` : ''));

console.log('\n— ٢) الجهةُ مقيسةٌ من المسار نفسِه، مقابَلةً بالمعلَن —');
const off = [];
for (const row of rows) {
  const want = TABLE[row.key];
  if (!want) continue;
  const got = measure(row.ref);
  if (got.side !== want.side) {
    off.push(`${row.key}: المعلَنُ «${want.side}» (${want.sanad}) والمقيسُ «${got.side}»`
      + ` (${got.rx.toFixed(2)})`);
  }
}
ok(off.length === 0, `جهةُ البداية في الأشكال كلِّها عينُ المعلَن (${rows.length})`
  + (off.length ? `\n    ${off.join('\n    ')}` : ''));

// **والرقمُ شكلٌ واحد**: أشكالُه الأربعة عينُه، فلا يُعلَن مرّةً ويُبنى أربعاً مختلفة.
const split = DIGITS.filter((ch) => !FORMS.every((f) => JSON.stringify(PATHS[ch][f])
  === JSON.stringify(PATHS[ch].isolated)));
ok(split.length === 0, 'وأشكالُ كلِّ رقمٍ الأربعة مسارٌ واحد — فالسطرُ الواحد يحكم الأربعة'
  + (split.length ? ` — افترقت: ${split.join('، ')}` : ''));

console.log('\n— ٣) أحكامُ المالك التي هي أكثرُ من جهة —');

// (أ) الصفرُ نقرةٌ تُنقَر لا دائرةٌ تُرسَم
const zero = PATHS['٠'].isolated;
ok((zero.strokes || []).length === 0 && (zero.dots || []).length === 1,
  `٠: نقرةٌ تُنقَر لا دائرةٌ تُرسَم — ضرباتُه ${(zero.strokes || []).length} ونقراتُه ${(zero.dots || []).length}`);

// (ب) التسعةُ: «من الوسط إلى اليسار ثم فوق ثم تحت» — حكمُ مسارٍ لا حكمُ نقطةِ بدء
const nine = PATHS['٩'].isolated;
{
  const pts = nine.strokes[0].points;
  const m = measure(nine);
  const head = pts[Math.max(1, Math.round(pts.length * 0.12))];
  const goesLeft = head[0] < m.at[0];
  const top = pts.reduce((b, p, i) => (p[1] < pts[b][1] ? i : b), 0);
  const bottom = pts.reduce((b, p, i) => (p[1] > pts[b][1] ? i : b), 0);
  const mid = m.ry > 0.2 && m.ry < 0.6;
  ok(mid && goesLeft && top < bottom && bottom > pts.length * 0.8,
    `٩: من الوسط (ارتفاعُ مبدئه ${m.ry.toFixed(2)}) ← يساراً ${goesLeft ? '✓' : '✗'}`
    + ` ← فوق (قمّتُه عند ${top}) ← تحت (قاعُه عند ${bottom} من ${pts.length})`);
}

// (ج) ص وض: **الاطّرادُ بين الأشكال الأربعة شرط** — ومبدؤها ملتقى العين في وسط
//     الجسم (مبدأُ ط)، ودليلُه المقيس أنّ **العينَ تُغلق على مبدئها**: المسارُ يعود
//     إلى دائرة بدايته ثم يمضي إلى ذيله. ومبدأُ السنّة الطرَفية لا يعود إليها أبداً.
const closesOnStart = (ref) => (ref.strokes || []).some((s) => {
  const at = s.start || s.points[0];
  let left = false;
  for (const p of s.points) {
    const d = Math.hypot(p[0] - at[0], p[1] - at[1]);
    if (d > TOLERANCE.start) left = true;
    else if (left) return true;
  }
  return false;
});
for (const ch of ['ص', 'ض']) {
  const four = FORMS.map((f) => ({ f, ref: PATHS[ch][f], m: measure(PATHS[ch][f]) }));
  const closed = four.filter(({ ref }) => closesOnStart(ref));
  ok(closed.length === 4,
    `${ch}: الأشكالُ الأربعة تبدأ من ملتقى العين وتُغلقها عليه (مبدأُ ط) — ${closed.length}/4`
    + (closed.length === 4 ? '' : ` (لا يُغلق: ${four.filter(({ ref }) => !closesOnStart(ref)).map((x) => FORM_AR[x.f]).join('، ')})`));
  // **والاطّرادُ يُشترط على المعزول وما لا مدخلَ له وحدَه** (حكمُ الإدارة ١٨ أغسطس
  // ٢٠٢٦ على بند ص٧، وسندُه `STROKE_ORDER §٣ج`): «**الموصولُ يُكتب قطعةً واحدة من
  // مدخل وصله — ولا يُقاس مبدؤه بمقياس المعزول**». فالوسطيُّ والنهائيُّ يأتيهما
  // القلمُ من الحرف قبلهما فيمضي، **ومبدؤهما مدخلُ وصلهما لا وسطُ عينهما** — وقياسُ
  // نطاقٍ واحد على الأربعة يجعل موافقةَ القاعدة مخالفةً، **وهو عيبُ حارسٍ لا عيبُ
  // بيان**: يدُ المالك في ص/ض جاءت على القاعدة بعينها (موصولاها من مدخل الوصل ١٫٠٠)
  // فاحمرّ الحارسُ عليها. **ولا يُترك الموصولُ بلا قول**: يُطبع مبدؤه ويُسمّى سببُه.
  const free = four.filter((x) => NO_ENTRY.has(x.f));
  const band = free.map((x) => x.m.rx);
  const joined = four.filter((x) => !NO_ENTRY.has(x.f));
  ok(Math.max(...band) - Math.min(...band) <= 0.25,
    `و${ch}: مبادئُ ما لا مدخلَ له في نطاقٍ واحد من صندوقها`
    + ` (${free.map((x) => `${FORM_AR[x.f]} ${x.m.rx.toFixed(2)}`).join(' · ')}`
    + ` — الفرقُ ${(Math.max(...band) - Math.min(...band)).toFixed(2)} ≤ 0.25)`
    + ` · وموصولاه من مدخل وصلهما بقاعدة §٣ج`
    + ` (${joined.map((x) => `${FORM_AR[x.f]} ${x.m.rx.toFixed(2)}`).join(' · ')}) — لا يُقاسان بمقياس المعزول`);
}

// (د) ف وق: **أُقفلت بعين المالك** — نظر الأشكالَ الثمانيةَ على لوح الاتجاه
//     (١٨ أغسطس ٢٠٢٦) فقال: «**ما بها؟ ق وف تبدو جيدة**» (`STROKE_ORDER §٣ب`).
// ⇐ **فاليدُ هي الحكم لا الوصفُ القوليّ**: وصفُه الأولُ («يبدأ من الوسط ويرتفع»)
// تقريبُ لسانٍ لحركةٍ رآها لا قيدٌ هندسيّ، **فسقط الخيالُ السابق وبقي المقيس**.
// **وهذه الثمانيةُ مقروءةٌ من المسار نفسِه** (ارتفاعُ المبدأ من الجسم · أوّلُ حركته)
// **بهامشها المعلَن ٠٫٠٤** — فالحارسُ حارسٌ لأنّ سندَه **عينُ إنسانٍ مؤرَّخة** لا
// مطابقةٌ آلية: **ما رآه المالكُ فأقرّه يُثبَّت، وما تبدّل بعده يحمرّ في الاتجاهين**
// (مَن ارتفع فانتكس، ومَن نزل فارتفع بلا حكم).
const OWNER_FQ = 'نظرها المالكُ على لوح الاتجاه (١٨ أغسطس ٢٠٢٦) فأقرّها — «ما بها؟ ق وف تبدو جيدة»';
const FQ_RISE = {
  'ف/isolated': [false, 0.48, OWNER_FQ],
  'ف/initial': [false, 0.46, OWNER_FQ],
  'ف/medial': [false, 0.96, OWNER_FQ],
  'ف/final': [true, 0.95, OWNER_FQ],
  'ق/isolated': [false, 0.45, OWNER_FQ],
  'ق/initial': [false, 0.42, OWNER_FQ],
  'ق/medial': [false, 0.97, OWNER_FQ],
  'ق/final': [false, 0.45, OWNER_FQ],
};for (const ch of ['ف', 'ق']) {
  for (const f of FORMS) {
    const ref = PATHS[ch][f];
    const m = measure(ref);
    const pts = ref.strokes[0].points;
    const head = pts[Math.max(1, Math.round(pts.length * 0.1))];
    const rises = head[1] < m.at[1];
    const [want, height, why] = FQ_RISE[`${ch}/${f}`];
    // **وارتفاعُ المبدأ معلَنٌ رقماً لا نطاقاً واسعاً**: ثلاثةُ أشكالٍ مبدؤها مقعدُها
    // على السطر بعائقٍ مقيسٍ معلَن، فلو حُكم عليها بنطاق الوسط وحدَه لَحمرّت بحقٍّ
    // على حالٍ **مقصودةٍ مُبلَّغة**. فيُعلَن لكلٍّ ارتفاعُه بهامش ٠٫٠٤ — **فيحمرّ
    // التبدّلُ في الاتجاهين**: مَن رُفع فانتكس، ومَن أُبقي على مقعده فارتفع بلا حكم.
    ok(Math.abs(m.bodyRy - height) <= 0.04 && rises === want,
      `${ch} ${FORM_AR[f]}: ارتفاعُ مبدئه من جسمه ${m.bodyRy.toFixed(2)} والمعلَنُ ${height}`
      + ` · وأولُ حركته ${rises ? 'صعود' : 'نزول'} والمعلَنُ ${want ? 'صعود' : 'نزول'}`
      + ` — ${why}`);
  }
}

// ————— النقاطُ المتعددة: **قاعدةٌ واحدة معلَنة — من اليمين إلى اليسار** —————
//
// **سندُها (م)**: أمرُ المالك (١٨ أغسطس ٢٠٢٦) «كيفيةُ كتابة النقاط: اليمينُ قبل أم
// اليسارُ قبل في النقاط المتعددة — **اعتمد واحدة**»، وقاعدتُه العامّة «يُبدأ من أعلى
// الشكل ومن يمينه» (`docs/STROKE_ORDER.md §٢`). فالمعتمَدُ: **الأيمنُ أوّلاً**، وما
// استوى في يمينه فالأعلى أوّلاً — موافقةً لاتجاه الكتابة نفسِه. **ويُطبَّق على
// الجميع** (ت · ث · ق · ي · ش) ويُبنى في `tools/owner_layer.py` (`order_dots`).
//
// **وترتيبُ القيود مادّةٌ مدرَّسة لا زينة**: اللوحُ يومض موضعَ النقطة المنتظَرة
// بترتيبها، فلو اختلف ترتيبُ الشكل عن أخيه لَتعلّم الطفلُ اثنين لحرفٍ واحد.
console.log('\n— النقاطُ المتعددة: الأيمنُ أوّلاً (م — أمرُ المالك ١٨ أغسطس ٢٠٢٦) —');
const many = shapes.filter(({ ref }) => (ref.dots || []).length > 1);
ok(many.length > 0, `والمنقوطُ بأكثرَ من نقطةٍ ${many.length} شكلاً — فيها تُمتحَن القاعدة`);
for (const { ch, form, ref } of many) {
  const at = ref.dots.map((d) => d.at);
  const want = [...at].sort((a, b) => (b[0] - a[0]) || (a[1] - b[1]));
  ok(JSON.stringify(at) === JSON.stringify(want),
    `${ch} ${FORM_AR[form]}: ${at.length} نقاطٍ بترتيب اليمين ← اليسار`
    + ` (${at.map((p) => Math.round(p[0])).join(' ← ')})`);
}

// **بابُ الناقص**: يُصدِر سطورَ ما في المادّة ولا سطرَ له — **بأرقامٍ مقيسةٍ من
// `measure` نفسِها لا مكتوبةٍ بيد**. فشكلٌ جديد يدخل الوحدةَ يأخذ سطرَه محسوباً،
// **ويبقى `why` بيد من أدخله** — فالسندُ يُكتب ولا يُولَّد.
if (process.argv.includes('--rows')) {
  const why = process.argv[process.argv.indexOf('--rows') + 1] || 'يُكتب سندُه';
  for (const row of rows) {
    if (TABLE[row.key]) continue;
    const m = measure(row.ref);
    console.log(` '${row.key}': { side: '${m.side}', sanad: 'م', rx: ${+m.rx.toFixed(2)},`
      + ` why: '${why}' },`);
  }
}

if (process.argv.includes('--table')) {
  console.log('\n— جدولُ الجهات (١٢٢ شكلاً) —');
  for (const row of rows) {
    const m = measure(row.ref);
    const want = TABLE[row.key] || {};
    console.log(`  ${row.key}\t${want.side}\t(${want.sanad})\tمقيس ${m.rx.toFixed(2)} ← «${m.side}»`
      + (want.why ? `\t— ${want.why}` : ''));
  }
}

// ————— مجرَّبٌ سالباً: يُزرَع انقلابٌ في المسار فيحمرّ الحارس —————
if (process.argv.includes('--self-test')) {
  console.log('\n— الفحصُ الذاتي: أيمسك انقلاباً مزروعاً؟ —');
  let seeded = 0;
  // **الانقلابُ المزروع انقلابُ إيماءةٍ كاملة**: تُعكَس الأجزاءُ في ترتيبها وتُعكَس
  // نقاطُ كلِّ جزء — وهو عينُ ما يقع لو رُدَّت إيماءةٌ في `path_anchors.json` إلى
  // جهتها الأولى وأُعيد البناء. (وعكسُ نقاطِ كلِّ جزءٍ وحدَه لا يكفي شاهداً: ٣ ثلاثةُ
  // أجزاءٍ فيبقى مبدؤها في يمينها.)
  const flip = (ref) => ({
    ...ref,
    strokes: [...ref.strokes].reverse().map((s) => {
      const pts = [...s.points].reverse();
      return { ...s, points: pts, start: pts[0] };
    }),
  });
  for (const row of rows) {
    const want = TABLE[row.key];
    if (!want || !(row.ref.strokes || []).length) continue;
    const before = measure(row.ref).side;
    const after = measure(flip(row.ref)).side;
    if (before !== after) seeded++;
  }
  ok(seeded >= 90, `وقلبُ المسار يبدّل الجهةَ المقيسة في ${seeded} من ${rows.length} شكلاً`
    + ' — فالمقياسُ يقيس. **وما لم تتبدّل جهتُه شكلٌ مبدؤه في وسطه أو منغلقٌ على مبدئه**'
    + ' (حلقةٌ تعود إلى بدايتها فطرفاها موضعٌ واحد)، لا مقياسٌ أعمى');
  // وشكلٌ بعينه: الاثنان اللذان أمسكهما بلاغُ الميدان
  for (const ch of ['٢', '٣', '٧', '٨']) {
    const ref = PATHS[ch].isolated;
    ok(measure(ref).side === 'يمين' && measure(flip(ref)).side !== 'يمين',
      `${ch}: مقيسُه اليومَ «${measure(ref).side}»، ولو قُلب لصار «${measure(flip(ref)).side}» فاحمرّ`);
  }
}

console.log(fails ? `\n${fails} فشل — جهةُ البداية خالفت المعلَن` : '\nجدولُ الجهات قائمٌ ومحروس');
process.exit(fails ? 1 : 0);

}
