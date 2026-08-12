// مولِّدُ **عدّة معايرة القلم** (`METHOD.md §٣.٩`):
//   node tools/make_pen_traces.mjs              # يكتب tools/pen_traces.json
//   node tools/make_pen_traces.mjs --self-test  # يتحقّق أن الملفّ المحفوظ عينُ ما يولّده
//
// **ولماذا مولِّدٌ لا إحداثياتٌ في ملف الفحص؟** لسببين:
//   ١) **المسارُ يُسجَّل مرّةً ويُجمَّد**: العدّةُ ملفُّ بياناتٍ على القرص، فلو حُسبت
//      لحظةَ الفحص لتحرّكت مع كل تعديلٍ في المحرّك وسارت معه إن انحرف — والحارسُ
//      لا يحرس ما يتبعه. الملفُّ المجمَّد شاهدٌ ثابت.
//   ٢) **ولا تُكتب إحداثياتٌ بيد** (روحُ `METHOD.md §٣.٨`): كلُّ حالةٍ هنا **تشويهٌ
//      موصوفٌ** لمسارٍ مرجعيّ (انحرافٌ عرضيّ بمقدارٍ معلوم، عكسُ اتجاه، بدايةٌ من
//      منتصف الطريق) — فيُقرأ منها ما تقيسه، ويعاد توليدُها فتخرج هي هي.
//
// ⚠ **وهذه مساراتٌ مصنوعة لا مساراتُ أطفال** — والفرقُ مكتوبٌ في كل حالة (`origin`):
// `synthetic` تُعاد كما هي بهذا المولّد، و`field` تأتي من **الجلسة ١٢** (ميدانُ
// الطفل ومعايرةُ السماحة) فتدخل الملفَّ نفسَه ولا يعيد المولّدُ توليدَها — ولا
// يفحصها الفحصُ الذاتي إلا شكلاً. فالعدّةُ اليومَ تُثبت **حكمَ المحرّك** سالباً
// وموجباً، ولا تدّعي أنها عايرت السماحةَ بأطفالٍ حقيقيين.

import { readFileSync, writeFileSync } from 'node:fs';
import { prepare, pointAt, TOLERANCE } from '../app/js/pen.js';
import { PATHS } from '../app/js/paths.js';

const OUT = new URL('./pen_traces.json', import.meta.url);

/** مولّدُ عشوائيةٍ ببذرةٍ ثابتة — فيخرج المولِّدُ بالملفّ نفسِه في كل تشغيل. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n) => Math.round(n * 10) / 10;

// ————— مسارا العدّة المرجعيان: كلاهما **شكلٌ هندسيّ محسوب لا حرف** —————
//
// **وموضعُهما هنا لا في `app/js/`**: لا شاشةَ تعرضهما — فهما عُدّةُ فحصٍ لا مادّةَ
// تطبيق، ويُكتبان في ملفّ العدّة نفسِه مع ضرباتها فيصير الملفُّ شاهداً تامّاً:
// مسارُه معه لا يفترقان.
//
// **وكان `sample` في `app/js/pendev.js`** يومَ كانت صفحةُ التجربة تعرضه (الجلسة ١،
// إذ لم تكن مساراتُ الحروف قد أُلّفت)، ثم **تحوّلت الصفحةُ إلى الحروف الحقيقية في
// الجلسة ٢** كما طالبت من نفسها — فانتقل الشكلُ إلى صاحبته. **وإحداثياتُه لم تتبدّل
// ببايت**، فالحالاتُ الإحدى عشرة المجمَّدة عليه تبقى شاهدَها الذي كانته.
//
// ولِمَ يبقى شكلاً هندسياً ولا يصير حرفاً حقيقياً؟ لأن العدّةَ تُثبت **حكمَ المحرّك**
// على أصناف الشروط الأربعة كلِّها في شكلٍ واحد (بدايةٌ واتجاهٌ وانحرافٌ وترتيبٌ
// ونقطةٌ بعد جسم)، وحكمُ المحرّك على الحروف بعينها يحرسه `tools/test_paths.mjs`
// على المسارات كلِّها لا على واحد.

/** نقاطُ قوسٍ بين زاويتين — بالراديان، وإحداثياتُ الشاشة (y نازلة). */
function arc(cx, cy, r, from, to, steps) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = from + (to - from) * (i / steps);
    return [round(cx + r * Math.cos(a)), round(cy + r * Math.sin(a))];
  });
}

/** نقاطُ قطعةٍ مستقيمة موزّعةٌ بالتساوي. */
function line(a, b, steps) {
  return Array.from({ length: steps + 1 }, (_, i) => [
    round(a[0] + (b[0] - a[0]) * (i / steps)),
    round(a[1] + (b[1] - a[1]) * (i / steps)),
  ]);
}

/**
 * **الشكلُ المركّب**: كأسٌ من اليمين إلى اليسار (اتجاهُ الكتابة العربية)، ثم شريطٌ
 * فوقه من اليمين إلى اليسار، ثم **نقطةٌ بعد الجسمين** — فتُجرَّب الشروطُ الأربعة
 * كلُّها على شكلٍ واحد. والفواصلُ بين مبادئ الأجزاء أوسعُ من سماحة البداية بكثير،
 * فلا يلتبس على المحرّك جزءٌ بجزء وهو يميّز قلبَ الترتيب.
 */
const SAMPLE = {
  strokes: [
    { points: arc(500, 480, 260, 0, Math.PI, 40), start: [760, 480] },
    { points: line([700, 180], [300, 180], 12), start: [700, 180] },
  ],
  dots: [{ at: [500, 940], count: 1, after: true }],
};

/**
 * مشيةٌ على مسارٍ مرجعيّ: من نسبةٍ إلى نسبة، بخطوةٍ ثابتة، مع انحرافٍ عرضيّ
 * موصوفٍ بدالّة (`sway`) واهتزازٍ عشوائيّ صغير (`jitter`) — وهي يدُ طفلٍ مصنوعة.
 */
function walk(poly, { from = 0, to = 1, step = 14, sway = () => 0, jitter = 0, rand }) {
  const points = [];
  const span = (to - from) * poly.len;
  const count = Math.max(2, Math.round(Math.abs(span) / step));
  for (let i = 0; i <= count; i++) {
    const ratio = from + (to - from) * (i / count);
    const { at, dir } = pointAt(poly, ratio * poly.len);
    const norm = Math.hypot(dir[0], dir[1]) || 1;
    const off = sway(ratio, i);
    const noise = jitter ? (rand() - 0.5) * 2 * jitter : 0;
    const amount = off + noise;
    points.push([
      round(at[0] + (-dir[1] / norm) * amount),
      round(at[1] + (dir[0] / norm) * amount),
    ]);
  }
  return points;
}

/** نقرةُ نقطةٍ: ثلاثُ نقاطٍ متلاصقة كما تقع من إصبعٍ ينقر. */
function tap(at, rand, spread = 6) {
  return Array.from({ length: 3 }, () => [
    round(at[0] + (rand() - 0.5) * spread),
    round(at[1] + (rand() - 0.5) * spread),
  ]);
}

const BODY = SAMPLE.strokes.map((s) => prepare(s.points));
const DOT = SAMPLE.dots[0].at;

/**
 * **الشكلُ المغلق** — دائرةٌ من ٧٢ قطعة تبدأ من قمتها وتمضي يساراً، فيعود **ذيلُها
 * إلى جوار بدايتها**. وهي عينُ الشكل الذي كشفت به مراجعةُ المدير ثغرةَ ذيل الشكل
 * المغلق (الجلسة ١): بها تُحرَس، وبها يُثبَت أنّ الإصلاح لم يُعطِّل كتابتَها الصحيحة.
 *
 * **وموضعُها هنا لا في `app/js/`**: لا شاشةَ تعرضها — فهي عُدّةُ فحصٍ لا مادّةَ
 * تطبيق، وتُكتب في ملفّ العدّة نفسِه مع المسار الذي تراه الشاشة (`refs` أدناه)،
 * فيصير الملفُّ شاهداً تامّاً: مسارُه معه لا يفترقان. ودوائرُ التهيئة الحقيقية
 * تؤلّفها الجلسةُ ٢ بأداتها كسائر المسارات.
 */
const RING = {
  strokes: [{
    points: Array.from({ length: 73 }, (_, i) => {
      const a = -Math.PI / 2 - (2 * Math.PI * i) / 72;
      return [round(500 + 300 * Math.cos(a)), round(500 + 300 * Math.sin(a))];
    }),
    start: [500, 200],
  }],
  dots: [],
};
const RING_POLY = prepare(RING.strokes[0].points);

/**
 * **السنّةُ المطويّة** — شكلٌ هندسيّ محسوب لا حرف (كسائر أشكال العدّة)، وفيه
 * **طيّةٌ معلنة**: ذراعٌ داخلةٌ من اليمين، فضلعٌ صاعد، فقمّة، فضلعٌ نازلٌ يعود
 * بجواره، فذراعٌ خارجةٌ يساراً. وهي سنّةُ ـبـ وعمودُ ـلـ مجرَّدَين من حرفهما.
 *
 * **وبها تُحرَس طيّةُ الجلسة ٢ب من وجهيها**: يُقبَل مَن كتبها **على خطٍّ واحد** كما
 * تُكتب حقّاً (وهو ما كان يُرفَض `reverse` قبل الإعلان)، ويُرَدّ مَن عكسها ومَن
 * **قفز عنها** من المفرق إلى الذراع الخارجة — فالطيّةُ رخصةٌ في قراءة الموضع لا
 * إعفاءٌ من كتابة السنّة.
 */
// **وضلعاها متباعدان بعرض حبرٍ لا أكثر** (٨٠ وحدةً عند القاعدة، كما تفتحهما عدّةُ
// المسارات في الحروف الحقيقية): فالخطُّ الواحد بينهما يقع في سماحة الانحراف، والعطبُ
// المحروسُ هنا **قراءةُ الطول** لا بُعدُ الطفل عن الحبر.
const TOOTH_ARM_IN = line([820, 620], [640, 620], 9);
const TOOTH_APEX = [600, 200];
const TOOTH_UP = line(TOOTH_ARM_IN[TOOTH_ARM_IN.length - 1], TOOTH_APEX, 20);
const TOOTH_DOWN = line(TOOTH_APEX, [560, 620], 20);
const TOOTH_ARM_OUT = line(TOOTH_DOWN[TOOTH_DOWN.length - 1], [200, 640], 18);
const TOOTH_PTS = [...TOOTH_ARM_IN, ...TOOTH_UP.slice(1),
  ...TOOTH_DOWN.slice(1), ...TOOTH_ARM_OUT.slice(1)];
const TOOTH = {
  strokes: [{
    points: TOOTH_PTS,
    start: TOOTH_PTS[0],
    folds: [{
      from: TOOTH_ARM_IN.length - 1,
      apex: TOOTH_ARM_IN.length + TOOTH_UP.length - 2,
      to: TOOTH_ARM_IN.length + TOOTH_UP.length + TOOTH_DOWN.length - 3,
    }],
  }],
  dots: [],
};
const TOOTH_POLY = prepare(TOOTH_PTS);

/**
 * **السنّةُ كما تُكتب حقّاً**: خطٌّ واحدٌ يصعد ثم يعود عليه — بين ضلعَي النموذج، لا
 * على أحدهما. وهو ما يفعله الطفل في «اكتبه وحدك» (`METHOD.md §٥.٤`)، وهو الذي كان
 * يُقرأ ارتداداً قبل إعلان الطيّة.
 */
const TOOTH_SPINE = line([(TOOTH_ARM_IN[TOOTH_ARM_IN.length - 1][0]
  + TOOTH_DOWN[TOOTH_DOWN.length - 1][0]) / 2, 620], TOOTH_APEX, 20);
const TOOTH_LINE = prepare([...TOOTH_ARM_IN, ...TOOTH_SPINE.slice(1),
  ...[...TOOTH_SPINE].reverse().slice(1), ...TOOTH_ARM_OUT.slice(1)]);

/**
 * **ثلاثةُ أشكالٍ من المنهج بعينها** — وهي المطويّاتُ الثلاث: ل/وسطي (العمود)
 * وب/وسطي (السنّة) وب/نهائي (التُّوَيْج). ولكلٍّ سببُ دخوله العدّةَ شاهداً مجمَّداً:
 *   · **ل/وسطي**: أثبتت عليه مراجعةُ المدير نقضَ عهد `child-drift` (سقط برجفة ٤٠
 *     من سماحة ٩٠ قبل الإعلان).
 *   · **ب/وسطي وب/نهائي**: أثبتت عليهما مراجعتُه الثانية أنّ **العودةَ على الأثر
 *     الرطب** — وهي أطبعُ ما تفعله يدُ طفل — كانت تُردّ: الأولى `wander` (فجوةُ
 *     ضلعيها ١٦٠ وسماحةُ الانحراف ٩٠)، والثانية `reverse` كاذباً على قوسٍ ضيّق.
 *     **فالمعيارُ يُثبَت على مادّته**، وفجوتاهما أوسعُ وأضيقُ ما في المنهج اليوم.
 *
 * ⚠ **وهي المساراتُ الوحيدة في العدّة التي لا تُولَد هنا** بل تُنسَخ من
 * `app/js/paths.js` (تؤلّفه عدّةُ المسارات) — **وذلك رباطٌ مقصود**: يومَ يتبدّل
 * أحدُها يحمرّ الفحصُ الذاتي حتى تُعاد العدّةُ عليه، فلا يبقى شاهدٌ على شكلٍ زال.
 * وحكمُ المحرّك على المسارات الستّة عشرة كلِّها (والأرضيةُ الحيّة لاحتمال الرجفة)
 * في `tools/test_paths.mjs` لا هنا.
 */
const LAM_MEDIAL = PATHS['ل'].medial;
const LAM_POLY = prepare(LAM_MEDIAL.strokes[0].points);
const BA_MEDIAL = PATHS['ب'].medial;
const BA_FINAL = PATHS['ب'].final;

/**
 * **العودةُ على الأثر الرطب**: يصعد الطفلُ ضلعَ الطيّة الصاعد ثم **ينزل عليه هو**
 * — لا على ضلعها النازل ولا بينهما. وهي أطبعُ ما تفعله اليد، وبها امتُحن المحرّكُ
 * في مراجعة المدير الثانية. ويُبنى الخطُّ **من المسار نفسِه** فلا يُكتب بيد.
 */
function retrace(ref) {
  const stroke = ref.strokes[0];
  const fold = stroke.folds[0];
  const rising = stroke.points.slice(fold.from, fold.apex + 1);
  return prepare([
    ...stroke.points.slice(0, fold.from + 1),
    ...rising.slice(1),
    ...[...rising].reverse().slice(1),
    ...stroke.points.slice(fold.to + 1),
  ]);
}
const dotsOf = (ref, rand) => ref.dots
  .flatMap((d) => Array.from({ length: d.count || 1 }, () => tap(d.at, rand)));

/**
 * الحالاتُ العشر — لكل شرطٍ من الشروط الأربعة وجهُه الموجب ووجهُه السالب.
 * والأرقامُ منسوبةٌ إلى السماحة نفسِها (`TOLERANCE`) لا مكتوبةً حرّة: فالحالةُ
 * «داخل السماحة» تبقى داخلَها إن عُدِّلت، والحالةُ «خارجها» تبقى خارجَها.
 */
function build() {
  const cases = [];
  const add = (id, expect, note, strokes, ref = 'sample') => cases.push({
    id, expect, note, origin: 'synthetic', ref, strokes,
  });

  const dot = (rand) => tap(DOT, rand);
  const clean = (rand, opts = {}) => BODY.map((poly) => walk(poly, { rand, ...opts }));

  let rand = rng(101);
  add('clean', { accept: true }, 'كتابةٌ سليمة: بدايةٌ صحيحة واتجاهٌ صحيح وترتيبٌ صحيح',
    [...clean(rand, { jitter: 4 }), dot(rand)]);

  rand = rng(202);
  add('child-drift', { accept: true },
    `يدُ طفلٍ تنحرف انحرافاً واسعاً داخل السماحة (± ${Math.round(TOLERANCE.lateral * 0.5)})`,
    [...clean(rand, { jitter: 5, sway: (r) => Math.sin(r * Math.PI * 2) * TOLERANCE.lateral * 0.5 }),
      dot(rand)]);

  rand = rng(303);
  add('tremor-mild', { accept: true },
    'رجفةٌ خفيفة — **تُقبَل**: سماحةٌ ضيّقةٌ تُحبِط طفلَ الخامسة (`METHOD.md §٣.٥`)',
    [...clean(rand, { jitter: 6, sway: (r) => Math.sin(r * Math.PI * 14) * TOLERANCE.lateral * 0.4 }),
      dot(rand)]);

  rand = rng(404);
  add('tremor-wild', { accept: false, fault: 'wander' },
    `رجفةٌ عارمة تتجاوز السماحة (± ${Math.round(TOLERANCE.lateral * 2.2)}) — الشرط ٣`,
    [...clean(rand, { jitter: 6, sway: (r) => Math.sin(r * Math.PI * 14) * TOLERANCE.lateral * 2.2 }),
      dot(rand)]);

  rand = rng(505);
  add('reversed', { accept: false, fault: 'start-end' },
    '**المسارُ معكوساً** — يبدأ من الطرف الآخر ويمشي رجوعاً (الشرطان ١ و٢)',
    [...BODY.map((poly) => walk(poly, { from: 1, to: 0, jitter: 4, rand })), dot(rand)]);

  rand = rng(606);
  add('start-mid', { accept: false, fault: 'start-far' },
    'بدايةٌ خاطئة: ينزل في منتصف المسار ثم يتمّه (الشرط ١)',
    [walk(BODY[0], { from: 0.45, to: 1, jitter: 4, rand }),
      walk(BODY[1], { jitter: 4, rand }), dot(rand)]);

  rand = rng(707);
  add('dots-first', { accept: false, fault: 'dots-first' },
    '**النقطةُ قبل الجسم** — العادةُ الخاطئة التي يفرض الخطُّ المدرسيّ عكسَها (الشرط ٤)',
    [dot(rand), ...clean(rand, { jitter: 4 })]);

  rand = rng(808);
  add('order-swapped', { accept: false, fault: 'order' },
    'ترتيبٌ مقلوب: يكتب الجزء الثاني قبل الأول (الشرط ٤)',
    [walk(BODY[1], { jitter: 4, rand }), walk(BODY[0], { jitter: 4, rand }), dot(rand)]);

  rand = rng(909);
  add('stopped-short', { accept: false, fault: 'short' },
    'يرفع القلم عند ٦٠٪ من الجزء الأول',
    [walk(BODY[0], { to: 0.6, jitter: 4, rand }), walk(BODY[1], { jitter: 4, rand }), dot(rand)]);

  rand = rng(1010);
  add('backtrack', { accept: false, fault: 'reverse' },
    'يتقدّم إلى ٧٠٪ ثم يرتدّ إلى ٣٠٪ ثم يُتمّ — ارتدادٌ على المسار (الشرط ٢)',
    [[...walk(BODY[0], { to: 0.7, jitter: 3, rand }),
      ...walk(BODY[0], { from: 0.7, to: 0.3, jitter: 3, rand }),
      ...walk(BODY[0], { from: 0.3, to: 1, jitter: 3, rand })],
      walk(BODY[1], { jitter: 4, rand }), dot(rand)]);

  rand = rng(1111);
  add('no-dot', { accept: false, fault: 'incomplete' },
    'جسمان بلا نقطة — جزءٌ مقرَّرٌ لم يُكتب (الشرط ٤)',
    clean(rand, { jitter: 4 }));

  // ————— الشكلُ المغلق: حالتا مراجعة المدير (الجلسة ١) —————

  rand = rng(1212);
  add('ring-clean', { accept: true },
    'دائرةٌ تامّةٌ صحيحة — شاهدُ أنّ إصلاحَ ثغرة الذيل لم يمنع كتابةَ الشكل المغلق',
    [walk(RING_POLY, { jitter: 4, rand })], 'ring');

  rand = rng(1313);
  // **الحالةُ الحارسة**: نزولٌ على **ذيل** الدائرة وهو داخلَ دائرة البداية (بُعدُه
  // عن البداية وترُ ٦٠ وحدة < سماحة البداية)، ثم حركةٌ ذرّية بمقدار ٧٠ وحدةً على
  // الذيل رجوعاً. قبل الإصلاح: `accepted=true, coverage=0.97, codes=[]` — ستُّ
  // نقاطٍ تُقبَل دائرةً كاملة. وبعده: مرفوضةٌ بتغطيةٍ صفر.
  // **ورمزُها صار `reverse` في الجلسة ٤** ولم تتبدّل ضربةٌ منها ولا حكمُها: النزولُ
  // وقع على الحبر (ستّون وحدةً **قبل** البداية على الدائرة) والحركةُ رجوعٌ عليه —
  // وذلك انعكاسُ اتجاهٍ لا خروجٌ عن المسار. والمحروسُ فيها **التغطيةُ لا الاسم**
  // (`test_pen.mjs` يقيس ٠٫٠٠ لا ٠٫٩٧)، وهو قائمٌ كما كان.
  add('closed-tail', { accept: false, fault: 'reverse' },
    '**ثغرةُ ذيل الشكل المغلق** (كشفتها مراجعةُ المدير): نزولٌ داخل دائرة البداية '
    + 'لكن على ذيل الدائرة، ثم حركةٌ ذرّية — كانت تُقبَل دائرةً كاملة',
    [walk(RING_POLY, {
      from: 1 - 60 / RING_POLY.len, to: 1 - 130 / RING_POLY.len, step: 14, jitter: 3, rand,
    })], 'ring');

  rand = rng(2323);
  // **حالةُ صدق الاسم** (حمولةُ مراجعة الجلسة ١، نُفِّذت في الجلسة ٤ عند صاحبة
  // الدوائر): دائرةٌ تامّة تُدار **معكوسةً** من نقطة بدايتها. والرفضُ كان قائماً من
  // قبلُ، لكن باسم `wander` («يخرج عن المسار») — والطفلُ على الحبر تماماً يدور عكسَ
  // اتجاهه. فصار `reverse` («يعكس اتجاه الحركة»)، وهو ما تقرؤه لوحةُ وليّ الأمر.
  add('ring-reversed', { accept: false, fault: 'reverse' },
    '**دائرةٌ تُدار معكوسةً** من قمّتها — على الشكل المغلق يقع الرجوعُ في الطول قفزةً '
    + 'إلى الأمام فلا يمسّه شرطُ الرتابة، وكان يُسمَّى `wander` والحقُّ `reverse`',
    [walk(RING_POLY, { from: 1, to: 0, jitter: 4, rand })], 'ring');

  rand = rng(2424);
  // **والوجهُ الآخر للاسم على الشكل نفسِه**: يمضي في الاتجاه الصحيح ويدُه ترتجف
  // فوق السماحة ⇒ `wander` كما كان. فالاسمان يفترقان على الدائرة الواحدة
  // **بالاتجاه** لا بالبُعد — ولولا هذه لَجاز أن يبتلع الاسمُ الجديد الشرطَ الثالث.
  add('ring-wander', { accept: false, fault: 'wander' },
    'دائرةٌ في اتجاهها الصحيح ويدٌ ترتجف فوق السماحة — **تبقى** «يخرج عن المسار»',
    [walk(RING_POLY, {
      jitter: 6, sway: (r) => Math.sin(r * Math.PI * 14) * TOLERANCE.lateral * 2.2, rand,
    })], 'ring');

  // ————— الطيّةُ المعلَنة: حالاتُ الجلسة ٢ب (قرارُ المدير في مراجعة الجلسة ٢) —————

  rand = rng(1414);
  add('fold-traced', { accept: true },
    `**سنّةٌ مطويّة تُتتبَّع** على ضلعَي النموذج برجفةٍ داخل السماحة (± ${
      Math.round(TOLERANCE.lateral * 0.5)}) — الشرط ٢ عبر الطيّة`,
    [walk(TOOTH_POLY, {
      jitter: 4, sway: (r) => Math.sin(r * Math.PI * 2) * TOLERANCE.lateral * 0.5, rand,
    })], 'tooth');

  rand = rng(1515);
  add('fold-single-line', { accept: true, needsFold: true },
    '**سنّةٌ على خطٍّ واحد** — كما تُكتب حقّاً في «اكتبه وحدك»: يصعد ثم يعود على أثره '
    + 'بين ضلعَي النموذج. كانت تُرفَض `reverse` قبل إعلان الطيّة',
    [walk(TOOTH_LINE, { jitter: 5, rand })], 'tooth');

  rand = rng(1616);
  add('fold-reversed', { accept: false, fault: 'start-end' },
    '**سنّةٌ معكوسة** — يبدأ من الذراع الخارجة ويمشي رجوعاً: الطيّةُ لا تُبيح عكسَ الحركة',
    [walk(TOOTH_POLY, { from: 1, to: 0, jitter: 4, rand })], 'tooth');

  rand = rng(1717);
  // **الحالةُ الحارسة للطيّة** (نظيرُ `closed-tail` للشكل المغلق): الطيّةُ رخصةٌ في
  // قراءة الموضع لا إعفاءٌ من كتابة السنّة — فمن دخل من المفرق ومضى إلى الذراع
  // الخارجة بلا صعودٍ ولا نزول لا يرث تغطيةَ ضلعين لم يمشِهما.
  add('fold-skipped', { accept: false, fault: 'wander' },
    '**قفزٌ فوق السنّة**: من الذراع الداخلة إلى الخارجة مباشرةً بلا صعودٍ ولا نزول '
    + '— الطيّةُ لا تُمنَح بلا مشي',
    [[...walk(prepare(TOOTH_ARM_IN), { jitter: 3, rand }),
      ...walk(prepare(TOOTH_ARM_OUT), { jitter: 3, rand })]], 'tooth');

  rand = rng(1818);
  // **وسقطت طيّةُ اللام بحكم المالك** (١٢ أغسطس ٢٠٢٦، `REVIEW_HANDWRITING.md §١`:
  // «العمودُ الموصول ينزل من قمّته»): كان عمودُ ل/وسطي يُصعَد ثم يُنزَل على أثره
  // فكان مطويّاً، فصار ينزل من قمّته بلا عودة. **فالحالةُ تبقى ويسقط ادّعاءُ الطيّة
  // عنها** — وهي شاهدُ عهد `child-drift` على أطول عمودٍ موصول في المنهج.
  add('lam-medial-drift', { accept: true },
    `**ل/وسطي برجفة ${Math.round(TOLERANCE.lateral * 0.5)}** — الشكلُ الذي نقض عهدَ `
    + '`child-drift` في مراجعة المدير (سقط برجفة ٤٠) فعاد فوقه بإعلان الطيّة، '
    + '**ثم سقطت طيّتُه بحكم المالك في مرجعية الكرّاسة (§١)** فصار عموداً نازلاً '
    + 'من قمّته — ويبقى شاهدَ الرجفة على أطول عمودٍ موصول',
    [walk(LAM_POLY, {
      jitter: 4, sway: (r) => Math.sin(r * Math.PI * 2) * TOLERANCE.lateral * 0.5, rand,
    })], 'lam-medial');

  // **والمعيارُ يُثبَت على مادّته** (مراجعةُ المدير الثانية للجلسة ٢ب): «العودةُ على
  // الأثر الرطب» تُجمَّد على **ب/وسطي وب/نهائي الحقيقيّين** — أوسعِ فجوةِ ضلعين في
  // المنهج (١٦٠) وأضيقِ قوسٍ فيه — لا على السنّ الاصطناعية وحدَها.

  rand = rng(1919);
  add('ba-medial-retrace', { accept: true, needsFold: true },
    '**ب/وسطي: العودةُ على الأثر الرطب** — يصعد ضلعَ السنّة الصاعد وينزل عليه هو. '
    + 'كانت تُردّ `wander`: فجوةُ الضلعين ١٦٠ وسماحةُ الانحراف ٩٠',
    [walk(retrace(BA_MEDIAL), { jitter: 4, rand }), ...dotsOf(BA_MEDIAL, rand)], 'ba-medial');

  rand = rng(2020);
  add('ba-medial-reversed', { accept: false, fault: 'start-end' },
    'ب/وسطي معكوسةً — والطيّةُ لا تُبيح عكسَ الحركة ولو كان حبرُها واحداً',
    [walk(prepare(BA_MEDIAL.strokes[0].points), { from: 1, to: 0, jitter: 4, rand }),
      ...dotsOf(BA_MEDIAL, rand)], 'ba-medial');

  rand = rng(2121);
  add('ba-final-retrace', { accept: true, needsFold: true },
    '**ب/نهائي: العودةُ على الأثر الرطب** على تُوَيْجها — أضيقُ قوسٍ في المنهج. '
    + 'كانت تُردّ `reverse` كاذباً وفجوةُ ضلعيها ٨٠ داخلَ السماحة',
    [walk(retrace(BA_FINAL), { jitter: 4, rand }), ...dotsOf(BA_FINAL, rand)], 'ba-final');

  rand = rng(2222);
  add('ba-final-reversed', { accept: false, fault: 'start-end' },
    'ب/نهائي معكوسةً — تُوَيْجُها المطويّ لا يُبيح البدءَ من الطرف الآخر',
    [walk(prepare(BA_FINAL.strokes[0].points), { from: 1, to: 0, jitter: 4, rand }),
      ...dotsOf(BA_FINAL, rand)], 'ba-final');

  return {
    what: 'عدّةُ معايرة محرّك القلم — مساراتٌ مسجّلة تُدخَل على المحرّك آلياً (METHOD.md §٣.٩)',
    refs_note: 'ثلاثةُ أشكالٍ هندسيةٍ محسوبة للعدّة وحدها لا حروف: `sample` مركّبٌ يجمع أصنافَ '
      + 'الشروط الأربعة، و`ring` شكلٌ مغلق تُحرَس به ثغرةُ ذيل الحلقة، و`tooth` سنّةٌ '
      + '**بطيّةٍ معلنة** تُحرَس بها طيّةُ الجلسة ٢ب. ومعها **مطويّاتُ المنهج الثلاث** '
      + '(lam-medial وba-medial وba-final) منقولةً من app/js/paths.js — فالمعيارُ يُثبَت '
      + 'على مادّته، ويحمرّ الفحصُ الذاتيّ إن تبدّل مسارُ أحدها. **وقد تبدّلت الثلاثةُ '
      + 'بأحكام المالك في مرجعية الكرّاسة** (١٢ أغسطس ٢٠٢٦، docs/REVIEW_HANDWRITING.md): '
      + 'ل/وسطي بحكم العمود (§١) فسقطت طيّتُه، وب/وسطي وب/نهائي بحكم المدخل (§٤) فصار '
      + 'مبدؤهما مقعدَهما على السطر — فأُعيدت العدّةُ عليها وأحكامُ حالاتها كما كانت. '
      + 'وحكمُ المحرّك على مسارات الحروف كلِّها في tools/test_paths.mjs.',
    generator: 'tools/make_pen_traces.mjs',
    warning: 'مساراتٌ مصنوعة لا مساراتُ أطفال — ميدانُ الطفل ومساراتُه الحقيقية في الجلسة ١٢',
    refs: {
      sample: SAMPLE,
      ring: RING,
      tooth: TOOTH,
      'lam-medial': LAM_MEDIAL,
      'ba-medial': BA_MEDIAL,
      'ba-final': BA_FINAL,
    },
    cases,
  };
}

const text = `${JSON.stringify(build(), null, 1)}\n`;

if (process.argv.includes('--self-test')) {
  let fails = 0;
  const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

  const saved = JSON.parse(readFileSync(OUT, 'utf8'));
  const made = JSON.parse(text);
  const mine = saved.cases.filter((c) => c.origin === 'synthetic');

  ok(mine.length === made.cases.length
    && JSON.stringify(mine) === JSON.stringify(made.cases),
    `الحالاتُ المصنوعة في الملفّ عينُ ما يولّده المولّد (${made.cases.length} حالة)`);
  // **والمساراتُ المرجعية محبوسةٌ مع ضرباتها**: تُكتب من هذا المولّد نفسِه، فتبديلُ
  // شكلٍ منها يُسقِط هذا الفحصَ حتى تُعاد الضرباتُ عليه — ولا تبقى عدّةٌ تحكم على
  // شكلٍ غير الذي سُجّلت عليه.
  ok(JSON.stringify(saved.refs) === JSON.stringify(made.refs),
    `والمساراتُ المرجعية في الملفّ عينُ ما يولّده المولّد (${Object.keys(made.refs).join('، ')})`);
  ok(saved.cases.every((c) => saved.refs[c.ref]),
    'ولكلِّ حالةٍ مسارٌ مرجعيّ موجودٌ باسمه');
  ok(saved.cases.every((c) => Array.isArray(c.strokes) && c.strokes.length
      && c.strokes.every((s) => s.length && s.every((p) => p.length === 2 && p.every(Number.isFinite)))),
    'وكلُّ حالةٍ — مصنوعةً كانت أو ميدانية — ضرباتٌ بنقاطٍ صحيحة على الشبكة');
  ok(saved.cases.every((c) => c.expect && typeof c.expect.accept === 'boolean' && c.note && c.origin),
    'ولكلِّ حالةٍ حكمُها المنتظَر وعلّتُها ومصدرُها');
  // **مطالبةٌ تُطلقها العدّةُ على نفسها**: يومَ تدخل مساراتُ ميدانٍ حقيقية (الجلسة ١٢)
  // يصير الوصفُ أعلاه ناقصاً — فيُطالِب هذا السطرُ بتحديثه بلا انتباهٍ يُرجى.
  const field = saved.cases.filter((c) => c.origin === 'field');
  ok(field.length === 0 || !/مساراتٌ مصنوعة لا مساراتُ أطفال/.test(saved.warning),
    field.length
      ? `دخلت العدّةَ ${field.length} مساراً ميدانياً — فلْيُحدَّث تحذيرُ الملف`
      : 'ولا مسارَ ميدانياً بعدُ — والتحذيرُ صادقٌ كما هو');

  console.log(fails ? `\n${fails} فشل` : '\nعدّةُ المعايرة مطابقةٌ لمولّدها');
  process.exit(fails ? 1 : 0);
}

writeFileSync(OUT, text);
console.log(`كُتبت ${JSON.parse(text).cases.length} حالةً في tools/pen_traces.json`);
