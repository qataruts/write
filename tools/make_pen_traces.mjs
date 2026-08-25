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
// ————— 🔴 **وكلُّ حالةٍ موسومةٌ بحكمَين لا بحكمٍ واحد** (جلسة ن٢) —————
//
// منذ صار القبولُ بالشكل الكلّيّ (حكمُ المالك ٢٠–٢١ أغسطس ٢٠٢٦، `ENGINE_RESCUE §٣`)
// انفصل الحكمان **فلا يُوسَم بواحد**:
//   · **`expect.shape`** — أيقبلها `judgeShape`؟ **وهو حَكَمُ القبول** وحدَه.
//   · **`expect.exact`** — أتطابق الطريقةَ المثلى؟ يقيسه الماشي (`judge`/`judgeFree`)
//     **ويُقاس ولا يُردّ به**، ومعه `expect.fault` أوّلُ شكواه بعينها.
//
// **والقاعدةُ في الوسم**: تشويهاتُ **الطريقة** (معكوسٌ · ترتيبٌ مقلوب · نقاطٌ قبل
// الجسم · رجفةٌ عارمة) ⇒ `shape: true` و`exact: false` — **فحبرُها حبرُنا والحرفُ
// يُقرأ**. وتشويهاتُ **الشكل** (خربشةٌ · ناقصٌ · نقاطٌ مقلوبةُ الجهة أو العدد)
// ⇒ `shape: false`. **والحجمُ إرشادٌ لا ردّ** فيوسَم `expect.guide` لا `fault`.
//
// ⚠ **وهذه مساراتٌ مصنوعة لا مساراتُ أطفال** — والفرقُ مكتوبٌ في كل حالة (`origin`):
// `synthetic` تُعاد كما هي بهذا المولّد، و`field` تأتي من **الجلسة ١٢** (ميدانُ
// الطفل ومعايرةُ السماحة) فتدخل الملفَّ نفسَه ولا يعيد المولّدُ توليدَها — ولا
// يفحصها الفحصُ الذاتي إلا شكلاً. فالعدّةُ اليومَ تُثبت **حكمَ المحرّك** سالباً
// وموجباً، ولا تدّعي أنها عايرت السماحةَ بأطفالٍ حقيقيين.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { prepare, pointAt, TOLERANCE, inkBox, refPoints } from '../app/js/pen.js';
import { PATHS } from '../app/js/paths.js';
import { WORD_PATHS } from '../app/js/word_paths.js';

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
/**
 * **وثلاثُ كلماتٍ من مسارات النسخ** (الجلسة ٨، بأمر المدير بعد حكمه في الانطباقات):
 * «تمر» و«شمس» و«الشمس» — **أسوأُ ما قِيس** يومَ كُشف الانطباق: كانت هوامشُها صفراً
 * (تُردّ برجفة وحدةٍ واحدة) لأنّ مسارَ الكلمة **ينطبق على نفسه** في حبر الوصل بلا
 * إعلان، فيركب مؤشّرُ التقدّم الشقَّ الخطأ. فصارت شاهداً مجمَّداً على ثلاثة أحكام:
 * الأمينةُ تُقبَل، والمرتجفةُ بعهد أرضيتها تُقبَل، والمعكوسةُ تُرَدّ.
 *
 * **وسماحتُها سماحتُها هي** (`tolerance` في مسارها): مقياسُ حروفها فيها — فالحكمُ
 * عليها بما بُنيت عليه، لا بسماحة حرفٍ يملأ صندوقَه.
 */
const WORD_CASES = ['تمر', 'شَمْسْ', 'الشَّمْسْ'];

const LAM_MEDIAL = PATHS['ل'].medial;
// **وقطعُ الشكل تُقرأ من الشكل لا يُفترَض عددُها** (عثرةُ ص٨، أختُ `folds[0]`): كان
// يُؤخذ `strokes[0]` وحدَه، فلمّا صار ل/وسطي قطعتين خرجت الحالةُ **ناقصةً قطعةً**
// فرُدّت `incomplete` — رَدٌّ كاذبٌ على كتابةٍ صحيحة، سببُه المولّدُ لا المحرّك.
const LAM_POLY = LAM_MEDIAL.strokes.map((s) => prepare(s.points));
const BA_MEDIAL = PATHS['ب'].medial;
const BA_FINAL = PATHS['ب'].final;

/**
 * **العودةُ على الأثر الرطب**: يصعد الطفلُ ضلعَ الطيّة الصاعد ثم **ينزل عليه هو**
 * — لا على ضلعها النازل ولا بينهما. وهي أطبعُ ما تفعله اليد، وبها امتُحن المحرّكُ
 * في مراجعة المدير الثانية. ويُبنى الخطُّ **من المسار نفسِه** فلا يُكتب بيد.
 */
function retrace(ref) {
  const stroke = ref.strokes[0];
  // **وضربةٌ بلا طيّةٍ حالٌ سويّة لا شاذّة** (كشفُ ص٧: الطيّةُ تُقرأ من أثر يد
  // المالك نفسِه — `owner_layer.self_folds` — فتثبت حيث انطبق الحبرُ وتغيب حيث
  // لم ينطبق). **فمادّةُ «العودة على الأثر الرطب» هي الطيّة**: لا تُختلق حيث
  // غابت — فحالةٌ تُبنى على طيّةٍ موهومة تشهد على محرّكٍ لا على مسار. فيُعاد
  // `null` **ويُعلَن الإسقاط** عند نداءِ الحالة، ولا ينفجر المولّدُ ولا يصمت.
  const fold = stroke.folds?.[0];
  if (!fold) return null;
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
  /**
   * **حالةُ «العودة على الأثر الرطب» تُبنى أو تُسقَط معلَنةً** — ولا تُبنى على
   * طيّةٍ موهومة. فإن غابت طيّةُ مسارِها (وذلك حالٌ سويّة بعد ص٧) طُبع إسقاطُها
   * بموضعه وسببه على `stderr` — **فالسقوطُ الصامت يُقرأ تغطيةً وهو نقصُها**.
   */
  const addRetrace = (id, expect, note, ref, refName, rand) => {
    const path = retrace(ref);
    if (!path) {
      console.error(`  ⚠ أُسقطت «${id}»: مسارُ «${refName}» بلا طيّةٍ معلَنة`
        + ' — ولا تُختلق طيّةٌ لحالةِ عودةٍ على الأثر الرطب');
      return false;
    }
    add(id, expect, note, [walk(path, { jitter: 4, rand }), ...dotsOf(ref, rand)], refName);
    return true;
  };

  const dot = (rand) => tap(DOT, rand);
  const clean = (rand, opts = {}) => BODY.map((poly) => walk(poly, { rand, ...opts }));

  let rand = rng(101);
  add('clean', { shape: true, exact: true }, 'كتابةٌ سليمة: بدايةٌ صحيحة واتجاهٌ صحيح وترتيبٌ صحيح',
    [...clean(rand, { jitter: 4 }), dot(rand)]);

  rand = rng(202);
  add('child-drift', { shape: true, exact: true },
    `يدُ طفلٍ تنحرف انحرافاً واسعاً داخل السماحة (± ${Math.round(TOLERANCE.lateral * 0.5)})`,
    [...clean(rand, { jitter: 5, sway: (r) => Math.sin(r * Math.PI * 2) * TOLERANCE.lateral * 0.5 }),
      dot(rand)]);

  rand = rng(303);
  add('tremor-mild', { shape: true, exact: true },
    'رجفةٌ خفيفة — **تُقبَل**: سماحةٌ ضيّقةٌ تُحبِط طفلَ الخامسة (`METHOD.md §٣.٥`)',
    [...clean(rand, { jitter: 6, sway: (r) => Math.sin(r * Math.PI * 14) * TOLERANCE.lateral * 0.4 }),
      dot(rand)]);

  rand = rng(404);
  add('tremor-wild', { shape: true, exact: false, fault: 'wander' },
    `رجفةٌ عارمة تتجاوز السماحة (± ${Math.round(TOLERANCE.lateral * 2.2)}) — الشرط ٣`,
    [...clean(rand, { jitter: 6, sway: (r) => Math.sin(r * Math.PI * 14) * TOLERANCE.lateral * 2.2 }),
      dot(rand)]);

  rand = rng(505);
  add('reversed', { shape: true, exact: false, fault: 'start-end' },
    '**المسارُ معكوساً** — يبدأ من الطرف الآخر ويمشي رجوعاً (الشرطان ١ و٢)',
    [...BODY.map((poly) => walk(poly, { from: 1, to: 0, jitter: 4, rand })), dot(rand)]);

  rand = rng(606);
  add('start-mid', { shape: true, exact: false, fault: 'start-far' },
    'بدايةٌ خاطئة: ينزل في منتصف المسار ثم يتمّه (الشرط ١)',
    [walk(BODY[0], { from: 0.45, to: 1, jitter: 4, rand }),
      walk(BODY[1], { jitter: 4, rand }), dot(rand)]);

  rand = rng(707);
  add('dots-first', { shape: true, exact: false, fault: 'dots-first' },
    '**النقطةُ قبل الجسم** — العادةُ الخاطئة التي يفرض الخطُّ المدرسيّ عكسَها (الشرط ٤)',
    [dot(rand), ...clean(rand, { jitter: 4 })]);

  rand = rng(808);
  add('order-swapped', { shape: true, exact: false, fault: 'order' },
    'ترتيبٌ مقلوب: يكتب الجزء الثاني قبل الأول (الشرط ٤)',
    [walk(BODY[1], { jitter: 4, rand }), walk(BODY[0], { jitter: 4, rand }), dot(rand)]);

  rand = rng(909);
  add('stopped-short', { shape: true, exact: false, fault: 'short', half: true },
    'يرفع القلم عند ٦٠٪ من الجزء الأول',
    [walk(BODY[0], { to: 0.6, jitter: 4, rand }), walk(BODY[1], { jitter: 4, rand }), dot(rand)]);

  rand = rng(1010);
  add('backtrack', { shape: true, exact: false, fault: 'reverse' },
    'يتقدّم إلى ٧٠٪ ثم يرتدّ إلى ٣٠٪ ثم يُتمّ — ارتدادٌ على المسار (الشرط ٢)',
    [[...walk(BODY[0], { to: 0.7, jitter: 3, rand }),
      ...walk(BODY[0], { from: 0.7, to: 0.3, jitter: 3, rand }),
      ...walk(BODY[0], { from: 0.3, to: 1, jitter: 3, rand })],
      walk(BODY[1], { jitter: 4, rand }), dot(rand)]);

  rand = rng(1111);
  add('no-dot', { shape: false, exact: false, fault: 'incomplete' },
    'جسمان بلا نقطة — جزءٌ مقرَّرٌ لم يُكتب (الشرط ٤)',
    clean(rand, { jitter: 4 }));

  // ————— الشكلُ المغلق: حالتا مراجعة المدير (الجلسة ١) —————

  rand = rng(1212);
  add('ring-clean', { shape: true, exact: true },
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
  add('closed-tail', { shape: false, exact: false, fault: 'reverse' },
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
  add('ring-reversed', { shape: true, exact: false, fault: 'reverse' },
    '**دائرةٌ تُدار معكوسةً** من قمّتها — على الشكل المغلق يقع الرجوعُ في الطول قفزةً '
    + 'إلى الأمام فلا يمسّه شرطُ الرتابة، وكان يُسمَّى `wander` والحقُّ `reverse`',
    [walk(RING_POLY, { from: 1, to: 0, jitter: 4, rand })], 'ring');

  rand = rng(2424);
  // **والوجهُ الآخر للاسم على الشكل نفسِه**: يمضي في الاتجاه الصحيح ويدُه ترتجف
  // فوق السماحة ⇒ `wander` كما كان. فالاسمان يفترقان على الدائرة الواحدة
  // **بالاتجاه** لا بالبُعد — ولولا هذه لَجاز أن يبتلع الاسمُ الجديد الشرطَ الثالث.
  add('ring-wander', { shape: true, exact: false, fault: 'wander' },
    'دائرةٌ في اتجاهها الصحيح ويدٌ ترتجف فوق السماحة — **تبقى** «يخرج عن المسار»',
    [walk(RING_POLY, {
      jitter: 6, sway: (r) => Math.sin(r * Math.PI * 14) * TOLERANCE.lateral * 2.2, rand,
    })], 'ring');

  // ————— الطيّةُ المعلَنة: حالاتُ الجلسة ٢ب (قرارُ المدير في مراجعة الجلسة ٢) —————

  rand = rng(1414);
  add('fold-traced', { shape: true, exact: true },
    `**سنّةٌ مطويّة تُتتبَّع** على ضلعَي النموذج برجفةٍ داخل السماحة (± ${
      Math.round(TOLERANCE.lateral * 0.5)}) — الشرط ٢ عبر الطيّة`,
    [walk(TOOTH_POLY, {
      jitter: 4, sway: (r) => Math.sin(r * Math.PI * 2) * TOLERANCE.lateral * 0.5, rand,
    })], 'tooth');

  rand = rng(1515);
  add('fold-single-line', { shape: true, exact: true, needsFold: true },
    '**سنّةٌ على خطٍّ واحد** — كما تُكتب حقّاً في «اكتبه وحدك»: يصعد ثم يعود على أثره '
    + 'بين ضلعَي النموذج. كانت تُرفَض `reverse` قبل إعلان الطيّة',
    [walk(TOOTH_LINE, { jitter: 5, rand })], 'tooth');

  rand = rng(1616);
  add('fold-reversed', { shape: true, exact: false, fault: 'start-end' },
    '**سنّةٌ معكوسة** — يبدأ من الذراع الخارجة ويمشي رجوعاً: الطيّةُ لا تُبيح عكسَ الحركة',
    [walk(TOOTH_POLY, { from: 1, to: 0, jitter: 4, rand })], 'tooth');

  rand = rng(1717);
  // **الحالةُ الحارسة للطيّة** (نظيرُ `closed-tail` للشكل المغلق): الطيّةُ رخصةٌ في
  // قراءة الموضع لا إعفاءٌ من كتابة السنّة — فمن دخل من المفرق ومضى إلى الذراع
  // الخارجة بلا صعودٍ ولا نزول لا يرث تغطيةَ ضلعين لم يمشِهما.
  add('fold-skipped', { shape: false, exact: false, fault: 'wander' },
    '**قفزٌ فوق السنّة**: من الذراع الداخلة إلى الخارجة مباشرةً بلا صعودٍ ولا نزول '
    + '— الطيّةُ لا تُمنَح بلا مشي',
    [[...walk(prepare(TOOTH_ARM_IN), { jitter: 3, rand }),
      ...walk(prepare(TOOTH_ARM_OUT), { jitter: 3, rand })]], 'tooth');

  rand = rng(1818);
  // **وسقطت طيّةُ اللام بحكم المالك** (١٢ أغسطس ٢٠٢٦، `REVIEW_HANDWRITING.md §١`:
  // «العمودُ الموصول ينزل من قمّته»): كان عمودُ ل/وسطي يُصعَد ثم يُنزَل على أثره
  // فكان مطويّاً، فصار ينزل من قمّته بلا عودة. **فالحالةُ تبقى ويسقط ادّعاءُ الطيّة
  // عنها** — وهي شاهدُ عهد `child-drift` على أطول عمودٍ موصول في المنهج.
  add('lam-medial-drift', { shape: true, exact: true },
    `**ل/وسطي برجفة ${Math.round(TOLERANCE.lateral * 0.5)}** — الشكلُ الذي نقض عهدَ `
    + '`child-drift` في مراجعة المدير (سقط برجفة ٤٠) فعاد فوقه بإعلان الطيّة، '
    + '**ثم سقطت طيّتُه بحكم المالك في مرجعية الكرّاسة (§١)** فصار عموداً نازلاً '
    + 'من قمّته — ويبقى شاهدَ الرجفة على أطول عمودٍ موصول',
    LAM_POLY.map((poly) => walk(poly, {
      jitter: 4, sway: (r) => Math.sin(r * Math.PI * 2) * TOLERANCE.lateral * 0.5, rand,
    })), 'lam-medial');

  // **والمعيارُ يُثبَت على مادّته** (مراجعةُ المدير الثانية للجلسة ٢ب): «العودةُ على
  // الأثر الرطب» تُجمَّد على **ب/وسطي وب/نهائي الحقيقيّين** — أوسعِ فجوةِ ضلعين في
  // المنهج (١٦٠) وأضيقِ قوسٍ فيه — لا على السنّ الاصطناعية وحدَها.

  rand = rng(1919);
  addRetrace('ba-medial-retrace', { shape: true, exact: true, needsFold: true },
    '**ب/وسطي: العودةُ على الأثر الرطب** — يصعد ضلعَ السنّة الصاعد وينزل عليه هو. '
    + 'كانت تُردّ `wander`: فجوةُ الضلعين ١٦٠ وسماحةُ الانحراف ٩٠',
    BA_MEDIAL, 'ba-medial', rand);

  rand = rng(2020);
  add('ba-medial-reversed', { shape: true, exact: false, fault: 'start-end' },
    'ب/وسطي معكوسةً — والطيّةُ لا تُبيح عكسَ الحركة ولو كان حبرُها واحداً',
    [walk(prepare(BA_MEDIAL.strokes[0].points), { from: 1, to: 0, jitter: 4, rand }),
      ...dotsOf(BA_MEDIAL, rand)], 'ba-medial');

  rand = rng(2121);
  addRetrace('ba-final-retrace', { shape: true, exact: true, needsFold: true },
    '**ب/نهائي: العودةُ على الأثر الرطب** على تُوَيْجها — أضيقُ قوسٍ في المنهج. '
    + 'كانت تُردّ `reverse` كاذباً وفجوةُ ضلعيها ٨٠ داخلَ السماحة',
    BA_FINAL, 'ba-final', rand);

  rand = rng(2222);
  add('ba-final-reversed', { shape: true, exact: false, fault: 'start-end' },
    'ب/نهائي معكوسةً — تُوَيْجُها المطويّ لا يُبيح البدءَ من الطرف الآخر',
    [walk(prepare(BA_FINAL.strokes[0].points), { from: 1, to: 0, jitter: 4, rand }),
      ...dotsOf(BA_FINAL, rand)], 'ba-final');

  // ————— نونُ بلاغ الميدان ٢: «الشكلُ لا الأثر» (الجلسة م٣) —————
  //
  // 🔴 **الحالاتُ الأربعُ الأُوَل هي بلاغُ الميدان بعينه** (المالك وطفلة، ١٣ أغسطس
  // ٢٠٢٦، وبصورةٍ شاهدة): كتبت الطفلةُ **نوناً صحيحة** — بدأت من دائرة البداية
  // ودارت دورتَها وأغلقت كأسَها — **فرُدّت**، لأنّ كأسها أضيقُ من كأس النموذج
  // الخفيّ بأكثر من سماحة الانحراف. **فتركت الجهاز.**
  //
  // **وهي مصنوعةٌ لا مسجَّلة** (`origin: synthetic` كسائر العدّة): تشويهاتٌ **موصوفة**
  // لمسار النون الحقيقيّ — كأسٌ تُضيَّق، وأخرى تُوسَّع، وحرفٌ يصغر، وآخرُ يُزاح —
  // لا إحداثياتٌ تُكتب بيد ولا يدُ طفلٍ تُدَّعى. **وشهادتُها في شقّين**: يردّها
  // الحكمُ الأول (`judge`) ويقبلها الثاني (`judgeFree`) — فلو سقط الحكمُ الثاني يوماً
  // لَقُرئ الإخفاقُ هنا **ببلاغه**.
  //
  // 🔴 **وقد تبدّل وسمُ ثلاثٍ منها في ن٢**: معكوسةُ الاتجاه، ومرآةُ الشكل، والنقطةُ
  // قبل الجسم — كانت تُرَدّ بالحكم الثاني، **وصارت `shape: true` و`exact: false`**:
  // حبرُها حبرُنا والحرفُ يُقرأ، **والبدايةُ والاتجاهُ والترتيبُ مادّةُ تدريسٍ تُقاس
  // ولا يُردّ بها** (حكمُ المالك). **ومرآةُ النون مقيسةٌ لا مظنونة**: كأسُها متناظرةٌ
  // فمرآتُها هي هي — والمرآةُ التي تبدّل الشكلَ حقّاً محروسةٌ على الكاف
  // (`kaf-mirrored`، وهي `shape: false`) وعلى مصفوفة الأخوات في `tools/test_shape.mjs`.
  const NOON = PATHS['ن'].isolated;
  const NOON_BOX = inkBox([refPoints(NOON)]);
  const NOON_POLY = prepare(NOON.strokes[0].points);
  /** يدٌ تكتب النونَ كما هي: جسمٌ ثم نقطة. */
  const noon = (rand) => [walk(NOON_POLY, { jitter: 4, rand }), ...dotsOf(NOON, rand)];
  /** تشويهٌ **موصوف** يُطبَّق على ما كُتب: تحجيمٌ حول مركز صندوق النون، أو إزاحة. */
  const warp = (strokes, at) => strokes.map((s) => s.map((p) => at(p).map(round)));
  const about = (kx, ky) => (p) => [NOON_BOX.cx + (p[0] - NOON_BOX.cx) * kx,
    NOON_BOX.cy + (p[1] - NOON_BOX.cy) * ky];
  const nudge = (dx, dy) => (p) => [p[0] + dx, p[1] + dy];
  const field = (id, expect, note, strokes) => cases.push({
    id, expect, note, origin: 'synthetic', ref: 'noon', strokes,
  });

  rand = rng(4141);
  field('noon-narrow', { shape: true, exact: true, free: true, strict: false },
    '🏅 **نونُ الصورة**: كأسٌ أضيقُ من كأس النموذج (٦٠٪ عرضاً) — الشكلُ صحيحٌ '
    + 'والبدايةُ والاتجاهُ صحيحان، وكانت تُردّ `wander` فتركت الطفلةُ الجهاز',
    warp(noon(rand), about(0.6, 1)));

  rand = rng(4242);
  field('noon-wide', { shape: true, exact: true, free: true, strict: false },
    'ونونٌ كأسُها **أوسعُ** من النموذج (١٤٠٪ عرضاً) — الوجهُ الآخر للبلاغ نفسِه',
    warp(noon(rand), about(1.4, 1)));

  rand = rng(4343);
  field('noon-small', { shape: true, exact: true, free: true, strict: false },
    'ونونٌ **أصغرُ حجماً** (٥٥٪ بنِسَبها) — حجمٌ معقولٌ في صندوقه، والنِّسَبُ سليمة',
    warp(noon(rand), about(0.55, 0.55)));

  rand = rng(4444);
  field('noon-shifted', { shape: true, exact: true, free: true, strict: false },
    `ونونٌ **مُزاحةٌ في الصندوق** (${Math.round(TOLERANCE.start * 1.2)} أفقياً — خارجَ `
    + 'دائرة البداية) — والموضعُ ليس مادّةً مدرَّسة',
    warp(noon(rand), nudge(TOLERANCE.start * 1.2, TOLERANCE.start * 0.8)));

  rand = rng(4545);
  field('noon-reversed', { shape: true, exact: false, free: true, fault: 'start-end' },
    '**ونونٌ معكوسةُ الحركة** — شكلُها شكلُنا فيقبلها الحَكَمُ الكلّيّ، **ويردّ '
    + 'الماشي طريقَتها** `start-end`: الاتجاهُ مادّةٌ تُدرَّس وتُقاس ولا يُردّ بها',
    [walk(NOON_POLY, { from: 1, to: 0, jitter: 4, rand }), ...dotsOf(NOON, rand)]);

  rand = rng(4646);
  field('noon-mirrored', { shape: true, exact: false, free: true, fault: 'dots-first' },
    '**ومرآةُ النون** — تملأ صندوقَها بحجمٍ معقول، **وكأسُها متناظرةٌ فمرآتُها هي '
    + 'هي**: يقبلها الحَكَمُ الكلّيّ بحقّ، ويردّ الماشي طريقَتها. والمرآةُ التي تبدّل '
    + 'الشكلَ حقّاً على الكاف (`kaf-mirrored`)',
    warp(noon(rand), about(-1, 1)));

  rand = rng(4747);
  field('noon-dots-first', { shape: true, exact: false, free: true, fault: 'dots-first' },
    '**والنقطةُ قبل الجسم** — بدايةٌ مقلوبةُ الترتيب: العادةُ الخاطئة التي يفرض الخطُّ '
    + 'المدرسيّ عكسَها، ولا يفتحها كرمُ السماحة',
    (() => { const w = noon(rand); return [w[1], w[0]]; })());

  // **وحدُّ الحجم محسوبٌ من الصندوق**: أصغرُ ما يُقبَل أن يزيد قطرُ الحبر على ممرّ
  // السماحة (`lateral × ٢`)، وأكبرُه أن يسعه صندوقُ المادّة وممرُّه من كل جهة —
  // وكلاهما **جملةٌ تُقال** لا ردٌّ صامت.
  rand = rng(4848);
  field('noon-tiny', { shape: true, exact: false, free: true, guide: 'size-small' },
    'ونونٌ **ضئيلة** (١٥٪) تغرق في ممرّ سماحتها — تُقال لها «اكْتُبْهُ أَكْبَرْ»',
    warp(noon(rand), about(0.15, 0.15)));

  rand = rng(4949);
  field('noon-huge', { shape: true, exact: false, free: true, guide: 'size-big' },
    'ونونٌ **تفيض عن صندوقها** (٢٤٠٪) — تُقال لها «اكْتُبْهُ أَصْغَرْ»',
    warp(noon(rand), about(2.4, 2.4)));

  // ————— شولةُ الكاف: **التخفيفُ لا يفتح بابَ الاتجاه** (ع٣، جلسة ك) —————
  //
  // 🔴 **حكمُ المالك (١٧ أغسطس ٢٠٢٦)**: شولةُ الكاف «لم تنضبط» في يد الخامسة، فتُخفَّف
  // سماحتُها **معلَنةً في بيان الحرف** (`ease` على ضربتها). **وع٣ صفرٌ بحاله** (بندُ
  // جلسة ك ٢): التخفيفُ في التغطية وحدَها — فيُجرَّب سالباً **على الكاف نفسِها** لا
  // على غيرها: كافٌ تُكتب من طرفها الآخر، **وشولةٌ قبل جسمها** (نظيرُ النقطة قبل
  // الجسم في حرفٍ لا نقطةَ له: الجزءُ الملحقُ قبل ما يُلحَق به)، وشولةٌ تُكتب معكوسةً
  // وجسمُها مصيب. **والثلاثُ تُرَدّ ولو ثُلِّثت سماحةُ جزئها** (`test_pen.mjs §٢د`).
  const KAF = PATHS['ك'].isolated;
  const KAF_BOX = inkBox([refPoints(KAF)]);
  const kafPolys = KAF.strokes.map((s) => prepare(s.points));
  /** يدٌ تكتب الكافَ كما هي: جسمٌ ثم شولة. */
  const kaf = (rand) => kafPolys.map((poly) => walk(poly, { jitter: 4, rand }));
  const kafWarp = (strokes, at) => strokes.map((s) => s.map((p) => at(p).map(round)));
  const kafCase = (id, expect, note, strokes) => cases.push({
    id, expect, note, origin: 'synthetic', ref: 'ك/isolated', strokes,
  });

  // **والتخفيفُ له وجهٌ موجب**: شولةٌ تُكتب في اتجاهها الصحيح ويقصّر عنها الطفلُ
  // قليلاً — بين أرضيّة الجزء وعتبة الشكل — **تُقبَل بالإعلان وتُرَدّ بنزعه**
  // (`test_pen.mjs §٢د`). ولولا هذه الحالةُ لَكان التخفيفُ حبراً لا يمسّ يدَ طفل.
  rand = rng(6060);
  kafCase('kaf-tail-short-eased', { shape: true, exact: true, free: true, eased: true },
    '🏅 **شولةُ الكاف يقصّر عنها الطفلُ قليلاً** (٨٧٪ من طولها) — تُقبَل بسماحة الجزء '
    + 'المعلَنة في بيان الحرف (حكمُ المالك ١٧ أغسطس ٢٠٢٦: «لم تنضبط في يد الخامسة»)، '
    + '**وتُرَدّ `short` إن نُزع الإعلان** — فالقبولُ معلَّقٌ بالبيان لا بتسييبٍ عامّ',
    (() => {
      const [body, tail] = [walk(kafPolys[0], { jitter: 3, rand }),
        walk(kafPolys[1], { to: 0.87, jitter: 3, rand })];
      return [body, tail];
    })());

  rand = rng(6161);
  kafCase('kaf-reversed', { shape: true, exact: false, free: true, direction: true, fault: 'start-end' },
    '**كافٌ تُكتب من طرفها الآخر**: جسمُها وشولتُها كلٌّ في اتجاهٍ معكوس — يقبل '
    + 'الحَكَمُ الكلّيّ شكلَها **ويردّ الماشي طريقَتها**، ولا يفتح التخفيفُ بابَ '
    + 'الاتجاه ولو ثُلِّث: المرفوضُ في الطريقة الاتجاهُ لا الدقّة',
    kaf(rand).map((s) => [...s].reverse()));

  rand = rng(6262);
  kafCase('kaf-tail-first', { shape: true, exact: false, free: true, direction: true, fault: 'order' },
    'و**شولةٌ قبل جسمها**: الجزءُ الملحقُ يُكتب قبل ما يُلحَق به — وهي النقطةُ قبل '
    + 'الجسم بعينها في حرفٍ جزؤه الثاني ضربةٌ لا نقطة، **فالترتيبُ مادّةٌ مدرَّسة** '
    + 'لا تفتحها سماحةُ الجزء',
    (() => { const [body, tail] = kaf(rand); return [tail, body]; })());

  rand = rng(6363);
  kafCase('kaf-tail-reversed', { shape: true, exact: false, free: true, direction: true, fault: 'start-end' },
    'وكافٌ **جسمُها مصيبٌ وشولتُها معكوسة**: تُرَدّ وحدَها — فالتخفيفُ يُغفَر به '
    + 'نقصانُ الشولة لا **عكسُ حركتها**، وهو أدقُّ ما يُحرَس هنا',
    (() => { const [body, tail] = kaf(rand); return [body, [...tail].reverse()]; })());

  rand = rng(6464);
  kafCase('kaf-mirrored', { shape: false, exact: false, free: true, direction: true },
    'ومرآةُ الكاف — تملأ صندوقَها وليست كافاً: التوفيقُ إزاحةٌ وتحجيمٌ منتظم '
    + '**لا انعكاس**',
    kafWarp(kaf(rand), (p) => [2 * KAF_BOX.cx - p[0], p[1]]));

  // ————— طريقُ المحاولة الحرّة: يُمشى لمسةً لمسة (مراجعةُ المدير للجلسة م٣) —————
  //
  // 🔴 **العلّةُ المقيسة**: في محطة التمييز يُكتب **جسمُ الأخت** فيُقبَل — والجسمُ
  // واحدٌ في (ب ت ث ن ي) والفارقُ نقطتُها — ثم لا يُقبَل بعده شيء: مَن أعاد الشكلَ
  // كلَّه تُقاس ضربتُه الأولى على **الجزء الباقي** (النقطة) فتُردّ أبداً، فلا يبلغ
  // الطريقُ آخرَه **ولا تُكتب مهارةُ المحطة** — وهو نقضُ «لا تدريسَ بلا قياس»
  // (`METHOD.md §٦`) لا دَين. والحارسُ النصيّ كان أخضرَ لأنه يقرأ السطر لا يمشي الطريق.
  //
  // **فهاتان حالتان تُمشيان في الآلة نفسِها** (`createFreeRun`) لا تُحكَمان دفعةً:
  // موجبةٌ تبلغ آخرَه، وسالبةٌ لا تبلغه — **فلا يخضرّ البابُ من فراغ**.
  const NOON_INITIAL = PATHS['ن'].initial;
  const BA_INITIAL = PATHS['ب'].initial;
  const touchesOf = (ref, rand) => [
    ...ref.strokes.map((st) => walk(prepare(st.points), { jitter: 4, rand })),
    ...dotsOf(ref, rand),
  ];

  rand = rng(5151);
  cases.push({
    id: 'compare-sister-then-right',
    expect: { shape: true, free: true, run: true },
    note: '**طريقُ التمييز**: جوابُ الأخت («ب» عن «ن» ابتدائيةً) — يُقبَل جسمُها إذ '
      + 'الجسمُ واحد، وتُرَدّ نقطتُها — **ثم الجوابُ الصحيح كاملاً**: يُستأنَف الشكلُ '
      + 'من أوّله فيبلغ الطريقُ آخرَه وتُكتب المهارة',
    origin: 'synthetic',
    ref: 'noon-initial',
    strokes: [...touchesOf(BA_INITIAL, rand), ...touchesOf(NOON_INITIAL, rand)],
  });

  rand = rng(5252);
  cases.push({
    id: 'compare-sister-only',
    expect: { shape: false, free: true, run: true },
    note: 'وجوابُ الأخت وحدَه **لا يبلغ آخرَ الطريق** — فلا تُختَم محطةٌ بجوابٍ خاطئ، '
      + 'ولا يخضرّ بابُ «المُعلَنُ يُنادى فعلاً» من فراغ',
    origin: 'synthetic',
    ref: 'noon-initial',
    strokes: touchesOf(BA_INITIAL, rand),
  });

  // ————— كلماتُ النسخ الثلاث: أمينةً ومرتجفةً ومعكوسة (الجلسة ٨) —————
  //
  // **والرجفةُ بعهد أرضيتها**: `child-drift` نصفُ السماحة — وسماحةُ الكلمة سماحتُها
  // هي، فالأرضيةُ تتبعها (`lateral × tolerance × ٠٫٥`). فما يُقبَل هنا هو عهدُ
  // المحرّك على نفسه مطبَّقاً على مادّة النسخ.
  let seed = 3000;
  for (const text of WORD_CASES) {
    const ref = WORD_PATHS[text];
    if (!ref) throw new Error(`لا مسارَ للكلمة «${text}» — عدّةُ المعايرة على غير مادّتها`);
    const id = `word-${WORD_CASES.indexOf(text) + 1}`;
    const drift = TOLERANCE.lateral * ref.tolerance * 0.5;
    const body = (rand, opts = {}) => ref.strokes.map((st) => walk(prepare(st.points), { rand, ...opts }));
    const dots = (rand) => ref.dots
      .flatMap((d) => Array.from({ length: d.count || 1 }, () => tap(d.at, rand)));

    rand = rng(seed++);
    add(`${id}-clean`, { shape: true, exact: true, tolerance: ref.tolerance },
      `«${text}» أمينةً — والانطباقُ في حبر وصلها مُعلَنٌ طيّةً (حكمُ المدير)`,
      [...body(rand, { jitter: 2 }), ...dots(rand)], id);

    rand = rng(seed++);
    // 🔴 **دَينٌ مسمّى: «قراءةُ الطيّة تحت الرجفة»** (٢٥ أغسطس ٢٠٢٦): مادّةُ النسخ
    // الجديدة تعود على أثرها كثيراً (أمرُ المالك: القطعُ إلى أدناه) — فالكلمةُ ذاتُ
    // الأسنان فيها ستُّ طيّاتٍ فأكثر. ويدٌ ترتجف ±٤٥ داخلَ سماحتها يقفز إسقاطُها
    // بين ضلعي الطيّة فيُقرأ انحرافُها ٣٥٠. **والفرجةُ لا تحلّه**: فوقَ ضِعف الرجفة
    // تخرج عن «حبرٍ واحد» بسماحة المحرّك (جُرّب فخرجت ١٣٢١ طيّة). ⇐ **بندُ محرّكٍ
    // لا بندُ مادّة**، ولا يحبس طفلاً (المضيُّ دائم) بل يُنقص دقّةَ القياس الصامت
    // في كلماتٍ كثيرةِ الأسنان. **ويُعلَن هنا بصوته** فلا يُطوى ولا يُنسى.
    add(`${id}-drift`, { shape: true, exact: id !== 'word-3',
      // **ودَينُ «شَمْسْ» يُعلَن على حالته** (`debt`): ستُّ طيّاتٍ في ضربةٍ واحدة
      // ورجفةٌ ±٤٥ تقفز بين ضلعيها — فيُقرأ انحرافُها ٣٥٠. يُقال ولا يُطوى.
      ...(id === 'word-2' ? { debt: 'fold-under-drift' } : {}), tolerance: ref.tolerance },
      `«${text}» بيدٍ ترتجف بعهد أرضيتها (± ${Math.round(drift)} من سماحتها ${
        Math.round(TOLERANCE.lateral * ref.tolerance)}) — عهدُ \`child-drift\` على مادّة النسخ`,
      [...body(rand, { jitter: 2, sway: (r) => Math.sin(r * Math.PI * 2) * drift }), ...dots(rand)], id);

    rand = rng(seed++);
    add(`${id}-reversed`, { shape: true, exact: false, tolerance: ref.tolerance },
      `«${text}» معكوسةً — شكلُها شكلُها فيقبله الحَكَمُ الكلّيّ، **وخصومةُ الماشي `
      + `للمعكوس لا تلين**: العودُ غيرُ المعلَن ارتدادٌ كما كان`,
      [...[...ref.strokes].reverse().map((st) => walk(prepare(st.points), { from: 1, to: 0, jitter: 2, rand })),
        ...dots(rand)], id);
  }

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
      + '**ومعها نونُ بلاغ الميدان ٢** (noon، الجلسة م٣): عليها تُحرَس «الشكلُ لا '
      + 'الأثر» في الخطوة الحرّة — كأسٌ أضيقُ وأوسعُ وحرفٌ أصغرُ ومُزاح تُقبَل بالحكم '
      + 'الثاني (judgeFree) وتُرَدّ بالأول، والمعكوسةُ والمرآةُ والنقطةُ قبل الجسم '
      + 'تُرَدّ بالحكمين. **و«noon-initial» طريقُ التمييز** (مراجعةُ المدير للجلسة م٣): حالتان '
      + 'تُمشيان في آلة المحاولة الحرّة لمسةً لمسة (createFreeRun) لا تُحكَمان دفعةً — '
      + 'جوابُ الأخت ثم الصحيح يبلغ آخرَ الطريق، وجوابُ الأخت وحدَه لا يبلغه. '
      + 'وحكمُ المحرّك على مسارات الحروف كلِّها في tools/test_paths.mjs. **وكلُّ حالةٍ موسومةٌ بحكمَين منذ ن٢**: `expect.shape` حكمُ القبول (judgeShape) و`expect.exact` مطابقةُ الطريقة (الماشي) — فتشويهُ الطريقة يُقبَل شكلاً ويُقاس طريقةً، وتشويهُ الشكل يُرَدّ.',
    generator: 'tools/make_pen_traces.mjs',
    warning: 'مساراتٌ مصنوعة لا مساراتُ أطفال — ميدانُ الطفل ومساراتُه الحقيقية في الجلسة ١٢',
    refs: {
      sample: SAMPLE,
      ring: RING,
      tooth: TOOTH,
      'lam-medial': LAM_MEDIAL,
      'ba-medial': BA_MEDIAL,
      'ba-final': BA_FINAL,
      noon: NOON,
      'noon-initial': NOON_INITIAL,
      ...Object.fromEntries(WORD_CASES.map((text, i) => [`word-${i + 1}`, WORD_PATHS[text]])),
    },
    cases,
  };
}

const text = `${JSON.stringify(build(), null, 1)}\n`;

/**
 * 🔴 **والميدانيةُ لا يمسّها المولّد — وقد كان يمحوها** (جلسة ك، ١٧ أغسطس ٢٠٢٦):
 * عهدُ المستورِد أنّ `origin: field` «تأتي من هناك **ولا يعيد المولّدُ توليدَها ولا
 * يمسّها**» — وكان هذا الملفُّ يكتب حصيلتَه فوق الملفّ كلِّه، **فأوّلُ تشغيلةٍ بعد
 * التجميد تمحو مساراتَ الطفلة الحقيقية بلا كلمة**. (وقعت في الجلسة نفسِها التي
 * جمّدتها.) **فما لم يولّده هذا الملفُّ يُقرأ من الملفّ ويُعاد كما هو**، وتحذيرُه
 * يتبع حالَه.
 */
function keepField() {
  if (!existsSync(OUT)) return [];
  try {
    return (JSON.parse(readFileSync(OUT, 'utf8')).cases || []).filter((c) => c.origin === 'field');
  } catch {
    return [];
  }
}

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
  // **والاسمُ وجهان**: المصنوعةُ تسمّي شكلاً في الملفّ نفسِه (محبوسٌ مع ضرباتها)،
  // **والميدانيةُ تسمّي حرفَها وشكلَ موقعه** (`ك/isolated`) ومسارُه في `app/js/paths.js`
  // — «المسارُ يُسمّى ولا يُنسَخ» (نصُّ المستورِد)، وهو عينُ ما يقرؤه `test_pen.mjs`.
  const refFound = (name) => (name.includes('/')
    ? Boolean(PATHS[name.split('/')[0]]?.[name.split('/')[1]])
    : Boolean(saved.refs[name]));
  ok(saved.cases.every((c) => refFound(c.ref)),
    'ولكلِّ حالةٍ مسارٌ مرجعيّ موجودٌ باسمه — في الملفّ أو في مسارات الحروف');
  ok(saved.cases.every((c) => Array.isArray(c.strokes) && c.strokes.length
      && c.strokes.every((s) => s.length && s.every((p) => p.length === 2 && p.every(Number.isFinite)))),
    'وكلُّ حالةٍ — مصنوعةً كانت أو ميدانية — ضرباتٌ بنقاطٍ صحيحة على الشبكة');
  /**
   * **ولكلِّ حالةٍ حكمُ القبول باسمه** — `expect.shape` في المصنوع، **و`expect.accept`
   * في الميدانيّ** (حكمُ العين أو حكمُ المحرّك ساعةَ الالتقاط، يكتبه `import_traces`
   * ولا يمسّه هذا المولّد). فالاسمان وجهٌ واحد: **أيُقبَل هذا الأثر؟**
   */
  const wantShape = (c) => (typeof c.expect?.shape === 'boolean' ? c.expect.shape : c.expect?.accept);
  ok(saved.cases.every((c) => c.expect && typeof wantShape(c) === 'boolean' && c.note && c.origin),
    'ولكلِّ حالةٍ حكمُ القبول وعلّتُها ومصدرُها');
  // **وحكمُ الطريقة الثاني معلَنٌ في كل حالةٍ مصنوعة تُحكَم دفعةً** — فلا يبقى
  // الماشي بلا عهدٍ يُقاس عليه، ولا يُقرأ سكوتُه قبولاً.
  const dealt = saved.cases.filter((c) => c.origin === 'synthetic' && !c.expect.run);
  const noExact = dealt.filter((c) => typeof c.expect.exact !== 'boolean');
  ok(noExact.length === 0,
    `ولكلِّ حالةٍ مصنوعةٍ حكمُ الطريقة \`exact\` معه (${dealt.length} حالة)`
    + (noExact.length ? ` — بلا وسم: ${noExact.map((c) => c.id).join('، ')}` : ''));
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

const kept = keepField();
const whole = JSON.parse(text);
whole.cases = [...whole.cases, ...kept];
if (kept.length) {
  whole.warning = 'فيها مساراتُ ميدانٍ حقيقية (origin: field) مع المصنوعة — '
    + 'المصنوعةُ تُثبت حكمَ المحرّك، والميدانيةُ تعاير سماحتَه';
}
writeFileSync(OUT, `${JSON.stringify(whole, null, 1)}\n`);
console.log(`كُتبت ${whole.cases.length} حالةً في tools/pen_traces.json`
  + `${kept.length ? ` (منها ${kept.length} ميدانيةً أُعيدت كما هي — لا يمسّها المولّد)` : ''}`);
