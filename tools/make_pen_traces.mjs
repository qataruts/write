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
  add('closed-tail', { accept: false, fault: 'wander' },
    '**ثغرةُ ذيل الشكل المغلق** (كشفتها مراجعةُ المدير): نزولٌ داخل دائرة البداية '
    + 'لكن على ذيل الدائرة، ثم حركةٌ ذرّية — كانت تُقبَل دائرةً كاملة',
    [walk(RING_POLY, {
      from: 1 - 60 / RING_POLY.len, to: 1 - 130 / RING_POLY.len, step: 14, jitter: 3, rand,
    })], 'ring');

  return {
    what: 'عدّةُ معايرة محرّك القلم — مساراتٌ مسجّلة تُدخَل على المحرّك آلياً (METHOD.md §٣.٩)',
    refs_note: 'شكلان هندسيّان محسوبان للعدّة وحدها لا حرفان: `sample` مركّبٌ يجمع أصنافَ '
      + 'الشروط الأربعة، و`ring` شكلٌ مغلق تُحرَس به ثغرةُ ذيل الحلقة. وحكمُ المحرّك على '
      + 'مسارات الحروف بعينها في tools/test_paths.mjs.',
    generator: 'tools/make_pen_traces.mjs',
    warning: 'مساراتٌ مصنوعة لا مساراتُ أطفال — ميدانُ الطفل ومساراتُه الحقيقية في الجلسة ١٢',
    refs: { sample: SAMPLE, ring: RING },
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
