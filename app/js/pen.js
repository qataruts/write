// محرّك القلم — **تتبّعُ المسار** (ق١، `METHOD.md §٣`). ويرثه «أَتْقِنْ».
//
// المادّةُ المدرَّسة **حركةُ القلم**: بدايتُها واتجاهُها وترتيبُ أجزائها — لا الشكلُ
// النهائي. فالحكمُ هنا على الحركة لا على التغطية، و«تتبّعُ نقاطٍ» يقبل أيَّ لمسٍ
// يغطّي الصورة هو الفخُّ المتجنَّب (`METHOD.md §١`).
//
// **أربعةُ شروطٍ حتمية لا خامسَ لها** (`METHOD.md §٣.٣`):
//   ١) بدايةٌ داخل دائرة نقطة البداية.
//   ٢) تقدّمٌ رتيبٌ على المسار — إسقاطُ نقاط الطفل على المسار لا يرتدّ.
//   ٣) انحرافٌ عرضيّ ≤ سماحةٍ **تملكها المحطة**.
//   ٤) ترتيبُ الأجزاء والنقاط — **والنقاطُ بعد الجسم**.
// **والطيّةُ ليست خامسةً** (`METHOD.md §٣.١`، الجلسة ٢ب): هي **صفةٌ في المسار
// المرجعيّ** تُعلِن أين يعود القلمُ على أثره في حركةٍ واحدة (سنُّ ب ت ث ن ي س ش،
// وعمودُ اللام الوسطية)، فيقيس بها الشرطُ **الثاني** التقدّمَ ذهاباً وإياباً. ولا
// يُطلَب من الطفل شيءٌ جديد، **والعودُ غيرُ المعلَن ارتدادٌ كما كان**.
// وليس فيها جمالُ خطٍّ ولا شبهٌ بصريّ: `METHOD.md §١٠` يخرج التجويدَ الجماليّ من
// نطاق هذا التطبيق أصلاً، فما لا يُدرَّس لا يُقاس.
//
// **الإخفاقُ إرشادٌ لا رفض** (`METHOD.md §٣.٤`): الحبرُ يظهر تحت إصبع الطفل **دائماً**
// — حتى في المحاولة المخطئة — ثم تومض نقطةُ البداية ويظهر سهمُ الاتجاه. فمنعُ الحبر
// عن يدٍ تتحرّك يُقرأ عطباً في الجهاز لا إرشاداً، والإعادةُ بلا حدّ ولا مؤقّت ولا
// شاشةَ «خطأ».
//
// 🔒 **الخصوصيةُ بنيوية** (`METHOD.md §٣.٧`): مساراتُ كتابة الطفل **لا تغادر جهازه
// أبداً**، وهذه الوحدة **لا تعرف الشبكة أصلاً** — ولا تعرف غيرَها كذلك: **لا سطرَ
// `import` واحد فيها**، فلا تخزين ولا صوت ولا قياس. مسارُ الطفل يدخلها ويخرج منه
// **حكمٌ** لا أثر. (نظيرُ `recorder.js` في اقرأ، ويحرسه `tools/test_pen.mjs` نصّاً
// و`tools/browser_pen.html` بصفر طلباتٍ في دورة كتابةٍ كاملة.)
//
// **والنموذجُ هو المقياس** (`METHOD.md §٣.٢`): العرضُ المتحرك الذي يشاهده الطفل
// يُرسم من **المسار المرجعي نفسِه** الذي يُحكَم به — لا خطَّ نموذجٍ ومسطرةَ تقييمٍ
// يفترقان يوماً. ولذلك `penSurface()` و`createTrial()` في ملفٍّ واحد يقرآن `ref`
// نفسَه، ولا يُرسَم في هذا التطبيق حرفٌ من مصدرٍ آخر.

/** الشبكة المعيارية لكل المسارات والنقاط (`METHOD.md §٣.١`). */
export const GRID = 1000;

/**
 * **أخطاءُ الاتجاه المميَّزة** — الذهبُ القياسيّ لهذا التطبيق (`METHOD.md §٦`):
 * موضعُ الخطأ الحركيّ يُسجَّل **بعينه**، فتقول لوحةُ وليّ الأمر «يبدأ الميمَ من
 * أسفل» لا «أخطأ في الميم». وكلُّ خطأٍ هنا يحمل معه موضعَه وانزياحَه (`off`)،
 * فتبني الجلسةُ ١٠ جملتَها من البيان لا من نصٍّ مكتوبٍ بيد.
 */
export const FAULTS = {
  START_FAR: 'start-far',       // نزل بعيداً عن نقطة البداية
  START_END: 'start-end',       // نزل على الطرف الآخر — الحرفُ يُرسم مقلوباً
  REVERSE: 'reverse',           // ارتدّ على المسار (الشرط ٢)
  WANDER: 'wander',             // خرج عن سماحة الانحراف العرضيّ (الشرط ٣)
  SHORT: 'short',               // رفع القلم قبل أن يبلغ نهاية الجزء
  ORDER: 'order',               // قلَبَ ترتيب الأجزاء (الشرط ٤)
  DOTS_FIRST: 'dots-first',     // النقاطُ قبل الجسم (الشرط ٤)
  INCOMPLETE: 'incomplete',     // ترك جزءاً بلا كتابة
  EXTRA: 'extra',               // زاد جزءاً ليس من الحرف
};

/**
 * وصفُ الخطأ نصّاً — **شقُّ الجملة الثابت**، وتُتمّه لوحةُ وليّ الأمر بالحرف وبجهة
 * الانزياح (الجلسة ١٠). ولا نصَّ منطوقاً هنا: هذه سطورُ شاشةٍ تُقرأ لا تُسمَع.
 */
export const FAULT_TEXT = {
  [FAULTS.START_FAR]: 'يبدأ بعيداً عن نقطة البداية',
  [FAULTS.START_END]: 'يبدأ من الطرف الآخر',
  [FAULTS.REVERSE]: 'يعكس اتجاه الحركة',
  [FAULTS.WANDER]: 'يخرج عن المسار',
  [FAULTS.SHORT]: 'يقف قبل نهاية المسار',
  [FAULTS.ORDER]: 'يقلب ترتيب الأجزاء',
  [FAULTS.DOTS_FIRST]: 'يضع النقاط قبل الجسم',
  [FAULTS.INCOMPLETE]: 'يترك جزءاً بلا كتابة',
  [FAULTS.EXTRA]: 'يزيد جزءاً ليس من الحرف',
};

/**
 * **السماحةُ الافتراضية** بوحدات الشبكة (`METHOD.md §٣.٥`) — **تملكها المحطة**
 * وتتشدّد مع التقدّم، ولا يكتبها هذا الملفُّ على أحد.
 *
 * ⚠ **وهذه الأرقامُ مبدئيةٌ معلَنة**: العهدُ أن تُعايَر **بمسارات ميدانٍ حقيقية لا
 * بظنّ** (ضيّقةٌ تُحبِط طفلَ الخامسة، وواسعةٌ تمرّر عادةً خاطئة) — والميدانُ للجلسة
 * ١٢. وما تحتها اليومَ عدّةُ معايرةٍ **مصنوعة** (`tools/pen_traces.json`) تُثبت
 * الحكمَ سالباً وموجباً وتطبع هامشَ كل حالة، فيومَ تصل مساراتُ الطفل الحقيقية
 * تدخل العدّةَ نفسَها وتُزاح هذه الأرقام بأدلّتها.
 */
export const TOLERANCE = {
  start: 120,       // نصفُ قطر دائرة البداية (١٢٪ من الشبكة — إصبعٌ لا قلمُ رسّام)
  lateral: 90,      // أقصى انحرافٍ عرضيّ عن المسار
  back: 70,         // ارتدادٌ مسموحٌ على طول المسار قبل أن يُعدّ عكساً
  dot: 140,         // نصفُ قطر قبول النقطة
  coverage: 0.88,   // نسبةُ المسار التي يلزم بلوغُها قبل رفع القلم
};

/**
 * سماحةُ محطةٍ بعينها: عاملٌ عدديّ يشدّ المسافات كلَّها (`0.8` أشدّ من `1`)، أو
 * كائنٌ يبدّل ما يشاء منها بعينه. والتغطيةُ نسبةٌ فلا يمسّها العامل.
 */
export function resolveTolerance(value) {
  if (typeof value === 'number' && value > 0) {
    return {
      start: TOLERANCE.start * value,
      lateral: TOLERANCE.lateral * value,
      back: TOLERANCE.back * value,
      dot: TOLERANCE.dot * value,
      coverage: TOLERANCE.coverage,
    };
  }
  return { ...TOLERANCE, ...(value || {}) };
}

// ————— هندسةٌ صغيرة: الإسقاط على المسار —————

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** إسقاطُ نقطةٍ على قطعة مستقيمة: نسبتُها على القطعة وبعدُها العرضيّ عنها. */
function projectSegment(p, a, b) {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const square = vx * vx + vy * vy;
  let t = square ? ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / square : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return { t, d: Math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy)) };
}

/** مسارٌ مهيَّأ للقياس: نقاطُه وأطوالُه التراكمية وطولُه الكليّ. */
export function prepare(points) {
  const pts = points.map((p) => [p[0], p[1]]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
  return { pts, cum, len: cum[cum.length - 1] || 0 };
}

/**
 * أقربُ موضعٍ على المسار **ضمن نافذةٍ من الطول** — لا على المسار كلِّه.
 *
 * **ولِمَ نافذة؟** لأن الحروف تتقاطع مع نفسها (حلقةُ ه، عودةُ ل): البحثُ الشاملُ
 * يُسقِط نقطةَ الطفل على شقٍّ بعيدٍ يصادف قربَها، فيقفز «التقدّم» قفزةً كاذبة —
 * والشرطُ الثاني تقدّمٌ **رتيبٌ على المسار** لا قربٌ من أيّ موضعٍ منه.
 *
 * ⚠ **وهي تُرشِّح القطعَ ولا تحبس الطول**: القطعةُ تدخل إن تداخل مداها مع النافذة، ثم
 * يقع إسقاطُها في أيّ موضعٍ منها — فقد تخرج الحصيلةُ عن حدَّي النافذة بمقدار **قطعةٍ
 * واحدة**. **وهذا حكمُ مدير** (مراجعةُ الجلسة ٢ب): يبقى الترشيحُ ولا تُحكَم النافذة،
 * ومَن احتاج حدّاً قاطعاً حبَسه عنده (`within`، وتستعمله الطيّة). والعلّتان: انفلاتُه
 * **محدودٌ سلفاً بطول القطعة** — و`check_paths.py` يحدّها بجنس `back` نفسِه فالانفلاتُ
 * ≤ سماحة الارتداد — وثمنُ إحكامه شدٌّ على القِسِيّ الضيّقة (تُوَيْجُ ب/نهائي: هامشُ
 * رجفته يهبط من ٥١ إلى ٣٠، **دون عهد `child-drift`**) لعيبٍ في هندسة القياس على القوس
 * الضيّق لا في يد الطفل. **ولا يُعاد فتحُه إلا ببيّنة ميدانٍ في الجلسة ١٢.**
 */
function nearestOn(poly, p, fromLen, toLen) {
  let best = { len: fromLen, d: Infinity };
  for (let i = 0; i < poly.pts.length - 1; i++) {
    if (poly.cum[i + 1] < fromLen || poly.cum[i] > toLen) continue;
    const hit = projectSegment(p, poly.pts[i], poly.pts[i + 1]);
    if (hit.d < best.d) best = { d: hit.d, len: poly.cum[i] + hit.t * (poly.cum[i + 1] - poly.cum[i]) };
  }
  return best.d === Infinity ? nearestOn(poly, p, 0, poly.len) : best;
}

/** يحبس موضعَ الإسقاط بين حدّين — لأنّ نافذة `nearestOn` تُرشِّح ولا تحبس. */
const within = (hit, low, high) => (hit.len >= low && hit.len <= high ? hit
  : { d: hit.d, len: Math.min(high, Math.max(low, hit.len)) });

/** نقطةٌ على المسار عند طولٍ معلوم — للسهم ولرأس القلم في العرض المتحرك. */
export function pointAt(poly, len) {
  const target = len <= 0 ? 0 : len >= poly.len ? poly.len : len;
  for (let i = 1; i < poly.cum.length; i++) {
    if (poly.cum[i] < target) continue;
    const span = poly.cum[i] - poly.cum[i - 1] || 1;
    const t = (target - poly.cum[i - 1]) / span;
    const a = poly.pts[i - 1];
    const b = poly.pts[i];
    return { at: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], dir: [b[0] - a[0], b[1] - a[1]] };
  }
  const last = poly.pts.length - 1;
  return { at: poly.pts[last], dir: [1, 0] };
}

/**
 * تبسيطُ نقاط الطفل: ما دون خطوةٍ صغرى يُطرح.
 *
 * **وهو مشتركٌ بين اليد والحَكَم**: الشاشةُ ترسم ما يُحكَم عليه بعينه، والعدّةُ
 * تُعيد الحكمَ على المسار المسجَّل فتخرج بالنتيجة نفسها — فلا يفترق ما رآه الطفلُ
 * عمّا فُحص. ومعه يبقى عددُ النقاط صغيراً على آيباد ٦ (`METHOD.md §٣.٦`).
 */
export const MIN_STEP = 6;
export function simplify(points, minStep = MIN_STEP) {
  const out = [];
  for (const p of points) {
    if (!out.length || dist(out[out.length - 1], p) >= minStep) out.push([p[0], p[1]]);
  }
  if (points.length && out.length === 1 && points.length > 1) out.push(points[points.length - 1]);
  return out;
}

// ————— أجزاءُ الحرف: أجسامٌ ثم نقاط —————

/**
 * **الطيّاتُ المعلَنة** بأطوالها على المسار (`METHOD.md §٣.١`).
 *
 * في العربية حروفٌ **يعود القلمُ فيها على أثره في حركةٍ واحدة**: سنُّ ب ت ث ن ي س ش،
 * وعمودُ اللام الوسطية، وتُوَيْجُ الباء النهائية. والمسارُ المرجعيّ يفكّ ضلعَيها
 * بعرض الحبر (`tools/make_paths.html`) فيتمايزان للعين، **لكنّ مكانهما في الحرف
 * واحد** — فالمكانُ الواحد يحمل طولين من المسار، وهو بعينه ما يفترضه الشرطُ الثاني
 * ألّا يقع (تقدّمٌ رتيبٌ على المسار يفترض أن الموضعَ يدلّ على الطول دلالةً واحدة).
 *
 * **فتُعلِن البياناتُ أين ينكسر هذا الافتراض** — أرقامُ نقاطٍ في `points` تُصدِرها
 * عدّةُ التأليف من مفرق الهيكل آلياً (`{ from, apex, to }`)، وتُقرأ هنا أطوالاً.
 * **وهي صفةُ المسار لا شرطٌ خامسٌ على الطفل**: ما لم يُعلَن فالعودُ فيه ارتدادٌ كما
 * كان، ويحرسها `tools/check_paths.py` بنيةً (ضلعان متقابلان، ولا طيّةَ على سويّة).
 */
function foldsOf(stroke, poly) {
  const last = poly.cum.length - 1;
  const whole = (v) => Number.isInteger(v) && v >= 0 && v <= last;
  return (stroke?.folds || [])
    .filter((f) => f && whole(f.from) && whole(f.apex) && whole(f.to)
      && f.from < f.apex && f.apex < f.to)
    .map((f) => ({ from: poly.cum[f.from], apex: poly.cum[f.apex], to: poly.cum[f.to] }))
    .sort((a, b) => a.to - b.to);
}

/** الطيّةُ التي لم تُقطَع بعد — وما وراءها لا شأنَ له بموضع القلم الآن. */
const foldAhead = (folds, reach) => folds.find((fold) => reach < fold.to) || null;

/**
 * أجزاءُ الشكل بترتيب كتابتها: **الأجسامُ ثم النقاط** (`METHOD.md §٣.١`: النقاطُ
 * بعد الجسم — قاعدةُ الخطّ المدرسيّ، وتُعلَن في صفحة الأسس). والترتيبُ هنا هو عينُ
 * الشرط الرابع، ويحرس `check_paths.py` (الجلسة ٢) أن تأتي بيانات الحرف موافقةً له.
 */
export function partsOf(ref) {
  const parts = [];
  for (const stroke of ref?.strokes || []) {
    const poly = prepare(stroke.points);
    parts.push({
      kind: 'stroke',
      poly,
      folds: foldsOf(stroke, poly),
      start: stroke.start || stroke.points[0],
      end: poly.pts[poly.pts.length - 1],
    });
  }
  for (const dot of ref?.dots || []) {
    parts.push({ kind: 'dot', at: dot.at, count: dot.count || 1, start: dot.at, end: dot.at });
  }
  return parts;
}

const startDist = (part, p) => dist(part.start, p);

/**
 * **الشكلُ المغلق**: مسارٌ يعود طرفُه إلى **دائرة بدايته** — دائرةُ التهيئة، وحلقاتُ
 * م/ه/و. والمقياسُ من جنس الشرط الأول لا رقماً حرّاً: ما دام الطرفُ داخل الدائرة التي
 * يُقبَل فيها النزول فالموضعُ الواحد يحمل طولين (رأسَ المسار وذيلَه) — وهو بعينه ما
 * يجعل الطولَ في الشكل المغلق **دائرياً**: الرجوعُ خطوةً من البداية يقع في الطول
 * قفزةً إلى آخر المسار.
 */
const isClosed = (part, tol) => part.kind === 'stroke'
  && dist(part.poly.pts[0], part.end) <= tol.start;

/** فرقُ طولين على مسارٍ دائريّ: أقصرُ الطريقين بينهما، موجباً تقدّماً وسالباً رجوعاً. */
function cyclicGap(len, total) {
  if (!(total > 0)) return len;
  const wrapped = ((len % total) + total) % total;
  return wrapped > total / 2 ? wrapped - total : wrapped;
}

/**
 * **رأسُ المسار** — المدى الذي يُرسى فيه نزولُ الإصبع، لا المسارُ كلُّه.
 *
 * 🔴 **ثغرةُ ذيل الشكل المغلق** (كشفتها مراجعةُ المدير للجلسة ١، وأُصلحت قبل
 * الالتزام): كان الإرساءُ `nearestOn(poly, p, 0, poly.len)` — على المسار كلِّه.
 * والشكلُ المغلق (دائرةُ التهيئة، وحلقاتُ م/ه/و) يعود ذيلُه إلى جوار بدايته، فنزولٌ
 * **داخل دائرة البداية** لكنه أقربُ عرضياً إلى القطعة الخاتمة كان يُرسى على **ذيل**
 * المسار: فيصير `reach ≈ len` من اللحظة الأولى، وتبلغ التغطيةُ ٠٫٩٧ ويُقبَل الجزءُ
 * **بحركةٍ ذرّية بلا كتابة**. (أُعيد إنتاجها بدائرةٍ من ٧٢ قطعة تبدأ من قمتها ونزولٍ
 * عند ٥٦٠،٢٠٥ فستِّ نقاطٍ قصيرة: `accepted=true, coverage=0.97, codes=[]`.)
 *
 * **فالنزولُ يُرسى على رأس المسار وحدَه**: مَن نزل في موضعه الصحيح فموضعُه في رأسه
 * قطعاً، ومَن نزل في غيره فقد أخطأ الشرطَ الأول وقُيّد خطؤه — ولا يرث أحدٌ تقدّماً
 * لم يمشِه. والمدى **مقيَّدٌ بسماحة البداية نفسِها** لا بنسبةٍ حرّة، فهو من جنس
 * الشرط الأول: دائرةُ البداية مضروبةً في اثنين، وعُشرُ المسار سقفاً للمسارات القصيرة.
 * وتحرسه حالةُ `closed-tail` المجمَّدة في `tools/pen_traces.json` — سالباً إلى الأبد.
 */
const HEAD_RATIO = 0.1;
const headSpan = (poly, startTol = TOLERANCE.start) =>
  Math.min(poly.len * HEAD_RATIO, startTol * 2);

// ————— المحاولة: الحكمُ لحظةً بلحظة —————

/**
 * محاولةُ كتابةٍ واحدة على شكلٍ مرجعيّ.
 *
 * الحكمُ **يقع في لحظته لا بعد الفراغ** (علّةُ ق١): `down` تحكم على البداية ساعةَ
 * نزول الإصبع، و`move` تحكم على الاتجاه والانحراف وهو يتحرّك — فيُرشَد الطفل قبل
 * أن ترسخ الحركةُ الخاطئة، لا بعد أن يرفع يدَه عن حرفٍ كتبه مقلوباً.
 *
 * @param {{strokes: Array, dots?: Array}} ref المسارُ المرجعيّ — وهو نفسُه المعروض
 * @param {{tolerance?: number|object, onFault?: Function, onProgress?: Function}} options
 */
export function createTrial(ref, options = {}) {
  const tol = resolveTolerance(options.tolerance);
  const parts = partsOf(ref);
  // **الانغلاقُ يُعرَف مرّةً عند بناء المحاولة** وبسماحة المحطة نفسِها (لا بسماحةٍ
  // عامّة): محطةٌ تشدّ سماحتَها تشدّ معها ما تعدّه شكلاً مغلقاً — فلا مقياسان.
  for (const part of parts) part.closed = isClosed(part, tol);
  const onFault = options.onFault || (() => {});
  const onProgress = options.onProgress || (() => {});

  let index = 0;            // الجزءُ المنتظَر
  let dotHits = 0;          // نقراتُ النقطة المستوفاة من جزء النقطة الحالي
  let attempts = 0;         // كلُّ نزولِ إصبعٍ محاولة
  let faults = [];
  let stroke = null;        // المحاولةُ الجارية
  let metrics = { maxLateral: 0, maxBack: 0, coverage: 0, startDist: 0 };

  function note(code, at, part = index) {
    const target = parts[part];
    const anchor = target ? target.start : at;
    const fault = { code, part, at: [at[0], at[1]], off: [at[0] - anchor[0], at[1] - anchor[1]] };
    faults.push(fault);
    onFault(fault);
    return fault;
  }

  /** نزولُ الإصبع: الشرطُ الأول (البداية) والشرطُ الرابع (الترتيب) يُحسمان هنا. */
  function down(x, y) {
    const p = [x, y];
    attempts++;
    const expected = parts[index];
    if (!expected) {
      stroke = { aim: -1, points: [p], fault: FAULTS.EXTRA };
      return note(FAULTS.EXTRA, p, Math.max(0, parts.length - 1));
    }

    // أقربُ جزءٍ إلى موضع النزول — به يُعرَف **قلبُ الترتيب**: مَن نزل على نقطةٍ
    // وأمامَه جسمٌ لم يُكتب فقد قدّم النقطةَ على الجسم، وهي العادةُ الخاطئة بعينها.
    let best = index;
    let bestGap = Infinity;
    for (const [i, part] of parts.entries()) {
      const gap = startDist(part, p);
      if (gap < bestGap) { bestGap = gap; best = i; }
    }

    const gap = startDist(expected, p);
    metrics.startDist = Math.max(metrics.startDist, gap);
    let fault = null;

    if (best !== index && bestGap <= tol.start) {
      const bodyLeft = parts.slice(index).some((part) => part.kind === 'stroke');
      fault = parts[best].kind === 'dot' && bodyLeft ? FAULTS.DOTS_FIRST : FAULTS.ORDER;
    } else if (gap > (expected.kind === 'dot' ? tol.dot : tol.start)) {
      // البدايةُ من الطرف الآخر تُميَّز عن البداية الشاردة: هي الحرفُ يُرسم مقلوباً،
      // وهي أشدُّ ما يُراد تقويمُه («يبدأ الميمَ من أسفل»).
      fault = expected.kind === 'stroke' && dist(p, expected.end) <= tol.start * 1.5
        ? FAULTS.START_END : FAULTS.START_FAR;
    }

    const anchor = expected.kind === 'stroke'
      ? nearestOn(expected.poly, p, 0, headSpan(expected.poly, tol.start)) : { len: 0, d: 0 };
    stroke = {
      aim: index,
      kind: expected.kind,
      points: [p],
      startOk: !fault,
      fault,
      cursor: anchor.len,
      reach: anchor.len,
      entry: anchor.len,   // حيث أرساه نزولُه — وبه تُمنَح رخصةُ الطيّة أو تُمنَع
      wandered: false,
      reversed: false,
      turned: null,        // الطيّةُ التي انعطف فيها القلمُ من صاعدها إلى نازلها
    };
    if (fault) note(fault, p);
    return fault ? { code: fault } : null;
  }

  /** حركةُ الإصبع: الشرطان الثاني (الرتابة) والثالث (الانحراف) يُحسمان هنا. */
  function move(x, y) {
    if (!stroke) return null;
    const p = [x, y];
    stroke.points.push(p);
    if (stroke.kind !== 'stroke' || stroke.aim < 0) return null;

    const poly = parts[stroke.aim].poly;
    const ahead = Math.max(poly.len * 0.35, 300);
    const lo = stroke.cursor - tol.back * 2;
    const hi = stroke.cursor + ahead;

    // **الطيّة: الشرطُ الثاني يقيس التقدّمَ ذهاباً وإياباً** (`METHOD.md §٣.١`).
    //
    // ضلعا الطيّة **مكانٌ واحد بطولين**، فنافذةُ الإسقاط وحدَها لا تفرّق بينهما:
    // يدُ طفلٍ ترتجف وهي تصعد يقع إسقاطُها على الضلع النازل — وهو أمامَها بطول
    // الطيّة — ثم يعود إلى الصاعد فيُقرأ **ارتداداً وهو صاعدٌ مصيب**. (أثبتته
    // مراجعةُ المدير: ل/وسطي يسقط برجفة ٤٠، وسنّةُ ب/وسطي المكتوبةُ طبيعياً على خطٍّ
    // واحد تُرفَض `[reverse, wander, short]`.)
    //
    // **فالإعلانُ يرفع اللبس بقسمة الطيّة على القمّة**: ما لم تُبلَغ القمّةُ فالطولُ
    // يُقاس على **الضلع الصاعد**، وبعدها على **النازل**. فيبقى التقدّمُ رتيباً في
    // الوجهين بلا تخفيفٍ في العتبات: **العتباتُ الأربعُ كما هي**، والمتبدّلُ **أين
    // يُلتمَس الإسقاط** — وهي عينُ علّة النافذة أصلاً («لأن الحروف تتقاطع مع نفسها»).
    //
    // **وضلعُ الطور يعطي الطولَ وحدَه، وحبرُ الطيّة واحد**: أما **موضعُ القلم منها**
    // (كم ارتفع، وكم بَعُدَ عن حبرها) فيُقرأ من **أقرب الضلعين** — انظر `inFold` أدناه.
    //
    // **ولا تُمنَح الطيّةُ بلا مشي**: تقييدُ السقف بالقمّة يقع **قبل** بلوغها كذلك،
    // فطفلٌ يدخل من المفرق ويمضي إلى الذراع الخارجة لا يجد ذيلَ الضلع النازل في
    // نافذته فيرث تغطيةَ سنّةٍ لم يكتبها (نظيرُ ثغرة ذيل الشكل المغلق في `headSpan`).
    //
    // **ومتى يُسلَّم من الصاعد إلى النازل؟ حين ينعطف قلمُ الطفل نفسُه** — لا عند رقمٍ
    // يُختار: فإذا بلغ **جوارَ القمّة** (سماحةُ الارتداد نفسُها، فمن قصّر عنها بأقلَّ
    // منها لم يُظلَم) ثم رجع إسقاطُه على الصاعد، فتلك انعطافتُه. ويُقيَّد له بلوغُ
    // القمّة (`reach = apex`) فيُقاس نزولُه منها لا من موضعٍ في الضلع الآخر يصادف
    // قربَه — **وهو ما كان يُقرأ ارتداداً وهو نازلٌ مصيب**. ومن انعطف بعيداً عن
    // القمّة لم يُسلَّم، فسنّةٌ نصفُها ليست سنّة (يردّها الشرطُ الثاني كما كان).
    // **ورخصةُ الطيّة لمن دخلها من مدخلها**: مَن أرساه نزولُه **داخلَ** الطيّة لم يمشِ
    // ضلعَها الصاعد فلا يُقرأ له فيه تقدّم — وهو من جنس `headSpan`: لا يرث أحدٌ ما لم
    // يمشِه، لا تقدّماً ولا رخصة. **وثمنُ تركها**: الطيّةُ مكانٌ واحد، فالصعودُ فيها
    // والنزولُ سواءٌ من أيّ ضلعٍ كانا — ولولا هذا الشرطُ لَقُرئ مسارٌ **معكوسٌ** كلُّه
    // طيّةً مكتوبةً على وجهها متى اتّسعت سماحةُ البداية لطرفَي الشكل (أمسكه ل/وسطي:
    // مداه ٣٢٠ فتبتلعه دائرةُ بدايةٍ مضاعفةٌ ثلاثاً).
    //
    // **وحدُّ القمّة يُحبَس بـ`within`**: نافذةُ `nearestOn` تُرشِّح القطعَ ولا تحبس
    // الطول، فالقطعةُ التي تتخطّى القمّة تُخرِج الإسقاطَ من جهتها — وقد أمسك ذلك
    // **أوّلُ إصبعٍ كتب سنّةً مطويّة في متصفّح**: نزولٌ مصيبٌ على ل/وسطي قُرئ `reverse`
    // لأن الأرضيةَ نُقبت بقطعةٍ واحدة. والحبسُ هنا في حدَّي الطيّة وحدَهما.
    const found = foldAhead(parts[stroke.aim].folds, stroke.reach);
    const fold = found && stroke.entry <= found.from ? found : null;

    /**
     * **القلمُ في حبر الطيّة**: كم ارتفع فيها، ثم أين يقع ذلك من **ضلع الطور**.
     *
     * **وحبرُ الطيّة واحد** (وصفةُ المدير في مراجعة الجلسة ٢ب): فيُقرأ **كسرُ
     * الارتفاع** من **أقرب الضلعين** — إذ **أطبعُ ما تفعله يدُ طفلٍ أن تعود على
     * أثرها الرطب** فتنزل على الضلع الصاعد نفسِه — ثم يُنزَّل ذلك الكسرُ على ضلع
     * الطور: صاعداً من المفرق إلى القمّة، ونازلاً من القمّة إلى المخرج.
     *
     * فيُصان الوجهان معاً بلا مساسٍ بعتبة: **الانحرافُ** بعدُه عن حبر الطيّة لا عن
     * ضلعٍ لم يمشِه (ب/وسطي: فجوةُ ضلعيه ١٦٠ وسماحةُ الانحراف ٩٠ فكان يُردّ `wander`
     * وهو على الحرف تماماً)، **والتقدّمُ** يمضي مع حركته لا يقف عند القمّة (ب/نهائي:
     * كان إسقاطُه على الضلع النازل يقف عند القمّة طولَ نزوله ثم يقفز ويرتدّ، فيُردّ
     * `reverse` وهو نازلٌ مصيب).
     */
    const inFold = (climbing) => {
      const rise = fold.apex - fold.from || 1;
      const drop = fold.to - fold.apex || 1;
      const up = nearestOn(poly, p, fold.from, fold.apex);
      const down = nearestOn(poly, p, fold.apex, fold.to);
      const clamp = (s) => (s < 0 ? 0 : s > 1 ? 1 : s);
      const seen = [(up.len - fold.from) / rise, (fold.to - down.len) / drop]
        .map((s) => (climbing ? fold.from + clamp(s) * rise : fold.to - clamp(s) * drop))
        // كلتا القراءتين تحتملهما الطيّة، **والفيصلُ اتّصالُ الحركة**: القلمُ يمشي
        // ولا يقفز، فأصدقُ الارتفاعين ما وافق موضعَه قبل لحظة.
        .sort((a, b) => Math.abs(a - stroke.cursor) - Math.abs(b - stroke.cursor));
      return { d: Math.min(up.d, down.d), len: seen[0] };
    };
    // وما قبل الطيّة وما بعدها يبقيان على النافذة كما كانا — والأقربُ منهما ومن
    // الطيّة هو المقروء، فلا يُقرأ ذيلُ الضلع النازل لمن لم يبلغ القمّة (وهو
    // **مَنعُ التغطية بلا مشي**: نظيرُ ثغرة ذيل الشكل المغلق في `headSpan`).
    const nearer = (a, b) => (!a ? b : !b || a.d <= b.d ? a : b);
    const before = () => (lo < fold.from
      ? within(nearestOn(poly, p, lo, fold.from), lo, fold.from) : null);
    const after = () => (hi > fold.to
      ? within(nearestOn(poly, p, fold.to, hi), fold.to, hi) : null);
    const climb = () => nearer(before(), inFold(true));
    const fall = () => nearer(inFold(false), after());

    let hit;
    if (!fold) {
      hit = nearestOn(poly, p, lo, hi);
    } else if (stroke.turned === fold) {
      hit = fall();
    } else {
      hit = climb();
      if (hit.len < stroke.reach && stroke.reach >= fold.apex - tol.back) {
        stroke.turned = fold;
        stroke.reach = fold.apex;
        hit = fall();
      }
    }
    metrics.maxLateral = Math.max(metrics.maxLateral, hit.d);

    /**
     * **صدقُ الاسم على الشكل المغلق** (حمولةُ مراجعة الجلسة ١، تُنفَّذ هنا عند صاحبة
     * الدوائر): طفلٌ يدور دورانَه معكوساً على دائرةٍ كان يُقال له **«يخرج عن المسار»**
     * — والحقُّ **«يعكس اتجاه الحركة»**. وعلّةُ اللبس أنّ الرجوعَ من البداية على شكلٍ
     * مغلق يقع في الطول **قفزةً إلى الأمام** (إلى ذيل المسار) لا ارتداداً، فلا يمسّه
     * الشرطُ الثاني؛ ونافذةُ الإسقاط لا تبلغ الذيلَ فيُقاس بُعدُه عن رأس المسار
     * ويُسمَّى `wander`.
     *
     * **والحكمُ لا يتبدّل — الاسمُ وحدَه**: لا عتبةَ تُمَسّ ولا مقبولَ يصير مردوداً ولا
     * عكسُه. فحين يقع الانحرافُ على شكلٍ **مغلق**، يُسأل سؤالٌ واحد: أهو على الحبر
     * فعلاً (إسقاطٌ على المسار كلِّه داخلَ سماحة الانحراف) **وخلفَ موضعه دائرياً**
     * (أقصرُ الطريقين بينه وبين مؤشّره رجوعٌ يتجاوز سماحة الارتداد)؟ فإن كان فهو راجعٌ
     * على حبره لا خارجٌ عنه — **وذلك ذهبُ لوحة وليّ الأمر** (`METHOD.md §٦`).
     *
     * ولِمَ الشكلُ المغلق وحدَه؟ لأنّ الطولَ فيه وحدَه دائريّ: على مسارٍ مفتوح يبقى
     * الرجوعُ رجوعاً في الطول فيمسكه الشرطُ الثاني باسمه.
     */
    const backwardsOnRing = () => {
      if (!parts[stroke.aim].closed) return false;
      const anywhere = nearestOn(poly, p, 0, poly.len);
      return anywhere.d <= tol.lateral
        && cyclicGap(anywhere.len - stroke.cursor, poly.len) < -tol.back;
    };

    let fault = null;
    if (hit.d > tol.lateral && !stroke.wandered) {
      stroke.wandered = true;
      if (backwardsOnRing()) {
        stroke.reversed = true;      // شكوى واحدة لا صدىً: الاسمُ قيل مرّة
        fault = note(FAULTS.REVERSE, p, stroke.aim);
      } else {
        fault = note(FAULTS.WANDER, p, stroke.aim);
      }
    }
    // **الارتدادُ يُقاس عن أبعد ما بلغ** لا عن آخر نقطة: الرجوعُ خطوةً خطوة عن آخر
    // نقطةٍ لا يتجاوز عتبةً أبداً، فينسلّ عكسُ الاتجاه كلَّه من تحت الشرط.
    const back = stroke.reach - hit.len;
    metrics.maxBack = Math.max(metrics.maxBack, back);
    if (back > tol.back && !stroke.reversed) {
      stroke.reversed = true;
      fault = note(FAULTS.REVERSE, p, stroke.aim) || fault;
    }
    stroke.cursor = hit.len;
    stroke.reach = Math.max(stroke.reach, hit.len);

    const progress = poly.len ? stroke.reach / poly.len : 1;
    metrics.coverage = Math.max(metrics.coverage, progress);
    onProgress({ part: stroke.aim, progress, off: hit.d });
    return fault ? { code: fault.code, progress } : { progress };
  }

  /** رفعُ الإصبع: يستوفي الجزءَ أو يتركه لمحاولةٍ أخرى — بلا حدٍّ ولا عقاب. */
  function up() {
    if (!stroke) return null;
    const done = stroke;
    stroke = null;
    if (done.aim < 0) return { ok: false, code: FAULTS.EXTRA, points: done.points };

    const part = parts[done.aim];
    if (part.kind === 'dot') {
      const spread = done.points.reduce((max, p) => Math.max(max, dist(p, done.points[0])), 0);
      const ok = done.startOk && spread <= tol.dot * 0.7;
      if (ok && ++dotHits >= part.count) { dotHits = 0; index++; }
      return { ok, code: done.fault, points: done.points };
    }

    const progress = part.poly.len ? done.reach / part.poly.len : 1;
    let code = done.fault;
    if (!code && progress < tol.coverage) code = note(FAULTS.SHORT, done.points[done.points.length - 1], done.aim).code;
    const ok = done.startOk && !done.wandered && !done.reversed && progress >= tol.coverage;
    if (ok) index++;
    return { ok, code, progress, points: done.points };
  }

  return {
    parts,
    tolerance: tol,
    down,
    move,
    up,
    /** الجزءُ المنتظَر الآن — تقرؤه الشاشةُ لتومض نقطتَه وتوجّه سهمَها. */
    get expected() { return parts[index] || null; },
    get index() { return index; },
    get faults() { return faults; },
    get done() { return index >= parts.length; },
    reset() {
      index = 0; dotHits = 0; attempts = 0; faults = []; stroke = null;
      metrics = { maxLateral: 0, maxBack: 0, coverage: 0, startDist: 0 };
    },
    /** حصيلةُ المحاولة — ومنها تأخذ الشاشةُ نجومَها والقياسُ خطأَه المميَّز. */
    verdict() {
      const missing = parts.length - index;
      const all = missing > 0 && !faults.some((f) => f.code === FAULTS.INCOMPLETE)
        ? [...faults, { code: FAULTS.INCOMPLETE, part: index, at: parts[index].start, off: [0, 0] }]
        : faults;
      return {
        done: index >= parts.length,
        accepted: index >= parts.length && all.length === 0,
        attempts,
        parts: parts.length,
        faults: all,
        codes: [...new Set(all.map((f) => f.code))],
        /**
         * **الخطأُ الأوّل هو الخطأ**: ما بعده صدىً له غالباً — مَن أخطأ بدايةَ جزءٍ
         * بقي الجزءُ منتظَراً، فتُقاس ضربتُه التالية عليه هو فتتوالى الشكاوى. وهذا
         * ما تقرؤه لوحةُ وليّ الأمر (الجلسة ١٠): «يبدأ من أسفل» لا قائمةَ أعراض.
         */
        primary: all[0]?.code || null,
        metrics: { ...metrics },
      };
    },
  };
}

/**
 * **الحَكَمُ الصامت**: يُعيد مسارَ لمسٍ مسجَّلاً على المحرك ويعطي حكمَه — بلا شاشة
 * ولا متصفّح. وهو بابُ عدّة المعايرة (`METHOD.md §٣.٩`): مساراتٌ مسجّلة تُدخَل
 * آلياً ويُثبَت حكمُها حالةً حالة، **سالباً وموجباً**.
 *
 * @param {object} ref المسارُ المرجعيّ
 * @param {Array<Array<[number, number]>>} strokes ضرباتُ الطفل بنقاطها
 */
export function judge(ref, strokes, options = {}) {
  const trial = createTrial(ref, options);
  for (const raw of strokes) {
    const points = simplify(raw);
    if (!points.length) continue;
    trial.down(points[0][0], points[0][1]);
    for (const p of points.slice(1)) trial.move(p[0], p[1]);
    trial.up();
  }
  return trial.verdict();
}

// ————— لوحُ الكتابة: العرضُ والالتقاط —————
//
// **من المسار المرجعيّ نفسِه** (`METHOD.md §٣.٢`): النموذجُ الساكن، والعرضُ المتحرك،
// وتلوّنُ المسار تحت القلم، ونقطةُ البداية، وسهمُ الاتجاه — كلُّها مرسومةٌ من `ref`
// الذي يحكم به `createTrial`. ولا يُقرأ في هذا الملفّ خطُّ حرفٍ من مصدرٍ آخر.

const SVG_NS = 'http://www.w3.org/2000/svg';

function sv(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value != null) el.setAttribute(key, String(value));
  }
  return el;
}

const pathD = (points) => points
  .map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

/** أنماطُ العرض — خطواتُ حلقة الدرس (`METHOD.md §٥`). */
export const MODES = { GUIDED: 'guided', FAINT: 'faint', FREE: 'free' };

/**
 * **شارةُ الشكل: المسارُ المرجعيّ مرسوماً ساكناً** — بلا لوحٍ ولا حَكَمٍ ولا حبرِ طفل.
 *
 * تحتاجها الشاشاتُ حيث يُذكَر شكلٌ ولا يُكتب: شريطُ حروف محطة الأشكال، وصفُّ
 * المتشابهات في محطة التمييز (الجلسة ٧). **وموضعُها هنا لا في الشاشة** لأنّ
 * «النموذجُ هو المقياس» (`METHOD.md §٣.٢`) قاعدةٌ على كلّ رسمٍ لشكلٍ لا على اللوح
 * وحدَه: ما يراه الطفلُ في الشارة هو عينُ ما يحكم به `createTrial` عليه بعد قليل —
 * ولا يُرسَم في هذا التطبيق حرفٌ من مصدرٍ آخر.
 *
 * **وأجزاؤها أجزاءُ المحرّك** (`partsOf`): الأجسامُ ثم النقاطُ بعددها كما يعرضها
 * اللوحُ نفسُه، فلا صورتان لشكلٍ واحد.
 */
export function refGlyph(ref, className = 'ref-glyph') {
  const svg = sv('svg', {
    class: className, viewBox: `0 0 ${GRID} ${GRID}`, 'aria-hidden': 'true',
  });
  for (const part of partsOf(ref)) {
    if (part.kind === 'stroke') svg.append(sv('path', { class: 'ref-stroke', d: pathD(part.poly.pts) }));
    else svg.append(sv('circle', { class: 'ref-dot', cx: part.at[0], cy: part.at[1], r: 34 }));
  }
  return svg;
}

/**
 * لوحُ الكتابة: عنصرٌ يُدرَج في الشاشة، فيه النموذجُ وحبرُ الطفل والحكم.
 *
 * @param {object} config
 * @param {object} config.ref المسارُ المرجعيّ (`METHOD.md §٣.١`)
 * @param {string} [config.mode] `guided` (المسار ظاهر) · `faint` (خافت) · `free` (صندوقٌ فارغ)
 * @param {number|object} [config.tolerance] سماحةُ المحطة
 * @param {boolean} [config.bounds] يرسم **ممرَّ السماحة** حول المسار (محطةُ التحكّم)
 * @param {Function} [config.onFault] خطأٌ وقع — للقياس ولإرشاد الشاشة
 * @param {Function} [config.onPart] جزءٌ استُوفي
 * @param {Function} [config.onDone] اكتملت الأجزاء — ومعها حصيلةُ المحاولة
 */
export function penSurface(config) {
  const {
    ref, mode = MODES.GUIDED, tolerance, bounds = false,
    onFault, onPart, onDone, label = 'لوحُ الكتابة',
  } = config;

  const box = document.createElement('div');
  box.className = `pen-box pen-box--${mode}`;
  const svg = sv('svg', {
    class: 'pen-surface', viewBox: `0 0 ${GRID} ${GRID}`, role: 'img', 'aria-label': label,
  });
  const fence = sv('g', { class: 'pen-bounds' });      // ممرُّ السماحة (اختياريّ)
  const model = sv('g', { class: 'pen-model' });
  const trailed = sv('g', { class: 'pen-trail' });     // ما تلوّن تحت القلم
  const guide = sv('g', { class: 'pen-guide' });
  const inkLayer = sv('g', { class: 'pen-ink' });
  svg.append(fence, model, trailed, guide, inkLayer);
  box.append(svg);

  const trial = createTrial(ref, {
    tolerance,
    onFault: (fault) => { hint(fault.code); onFault?.(fault); },
    onProgress: ({ part, progress }) => paintProgress(part, progress),
  });
  const parts = trial.parts;

  // النموذجُ ورفيقُه المتلوّن: مسارٌ واحد يُرسم مرّتين — الثانيةُ مقصوصةٌ بالتقدّم،
  // وهو **مؤشّرُ التقدّم الحركيّ** (مخالفةُ اكتب المعلَنة لاقرأ، `METHOD.md §٥`).
  const modelPaths = [];
  const trailPaths = [];
  for (const part of parts) {
    if (part.kind === 'stroke') {
      const d = pathD(part.poly.pts);
      /**
       * **ممرُّ السماحة — مرسومٌ بالسماحة نفسِها** (محطةُ «تحكّمٌ داخل حدود»،
       * `METHOD.md §٤`): عرضُه `٢ × سماحةِ الانحراف` التي يحكم بها `createTrial`
       * الآن، لا رقمَ زينةٍ يُختار. فالحدُّ الذي يراه الطفلُ هو الحدُّ الذي يُقاس به
       * — امتدادُ «النموذجُ هو المقياس» (`METHOD.md §٣.٢`) إلى السماحة.
       */
      if (bounds) fence.append(sv('path', { class: 'pen-fence', d, 'stroke-width': trial.tolerance.lateral * 2 }));
      const shape = sv('path', { class: 'pen-stroke', d });
      const trail = sv('path', {
        class: 'pen-stroke pen-stroke--trail',
        d,
        'stroke-dasharray': part.poly.len,
        'stroke-dashoffset': part.poly.len,
      });
      model.append(shape);
      trailed.append(trail);
      modelPaths.push(shape);
      trailPaths.push(trail);
    } else {
      const mark = sv('circle', { class: 'pen-dot', cx: part.at[0], cy: part.at[1], r: 34 });
      model.append(mark);
      modelPaths.push(mark);
      trailPaths.push(null);
    }
  }

  // نقطةُ البداية وسهمُ الاتجاه — وهما لسانُ الإرشاد كلُّه (`METHOD.md §٣.٤`)
  const startMark = sv('circle', { class: 'pen-start', r: 40 });
  const arrow = sv('path', { class: 'pen-arrow' });
  // **رأسُ القلم يُخفى بالصنف لا بسمة `hidden`**: أمسكته لقطةُ اللوح — السمةُ لا
  // تُخفي عنصرَ SVG على كل متصفّح، فظهرت نقطةٌ في زاوية اللوح عند (٠،٠). وإخفاؤه
  // في CSS مع سائر ما يُبدَّل بالخطوة أصدق: الحالُ في لوحٍ واحد لا في موضعين.
  const head = sv('circle', { class: 'pen-head', r: 26, cx: 0, cy: 0 });
  guide.append(startMark, arrow, head);

  function paintGuide() {
    const part = trial.expected;
    // تمّت الأجزاء: يسقط الإرشادُ كلُّه — لا نقطةَ بدايةٍ لجزءٍ لم يبقَ (وبالصنف
    // لا بسمة `hidden`، للعلّة المكتوبة عند `head` أدناه).
    box.classList.toggle('pen-box--complete', !part);
    if (!part) return;
    startMark.setAttribute('cx', part.start[0]);
    startMark.setAttribute('cy', part.start[1]);
    if (part.kind !== 'stroke') { arrow.setAttribute('d', ''); return; }
    const { at, dir } = pointAt(part.poly, Math.min(part.poly.len * 0.16, 140));
    const norm = Math.hypot(dir[0], dir[1]) || 1;
    const [ux, uy] = [dir[0] / norm, dir[1] / norm];
    const [px, py] = [-uy, ux];
    const tip = [at[0] + ux * 46, at[1] + uy * 46];
    arrow.setAttribute('d', `M${tip[0].toFixed(1)} ${tip[1].toFixed(1)}`
      + ` L${(at[0] - ux * 12 + px * 26).toFixed(1)} ${(at[1] - uy * 12 + py * 26).toFixed(1)}`
      + ` L${(at[0] - ux * 12 - px * 26).toFixed(1)} ${(at[1] - uy * 12 - py * 26).toFixed(1)} Z`);
  }

  function paintProgress(part, progress) {
    const trail = trailPaths[part];
    if (!trail) return;
    const len = parts[part].poly.len;
    trail.setAttribute('stroke-dashoffset', String(Math.max(0, len * (1 - Math.min(1, progress)))));
  }

  /**
   * الإرشادُ في لحظة الخطأ: وميضُ نقطة البداية وسهمُ الاتجاه — **ولا شاشةَ «خطأ»
   * ولا صوتَ عقاب ولا منعَ حبر**. والومضةُ تُعاد بإسقاط الصنف ثم إعادته.
   */
  function hint() {
    box.classList.remove('pen-box--hint');
    void box.offsetWidth;
    box.classList.add('pen-box--hint');
  }

  // ————— الالتقاط: Pointer Events، والإصبعُ والقلمُ سواء (ق٤) —————
  //
  // **وتجاهلُ لمس الكفّ**: مَن أمسك قلماً استقرّ كفُّه على الشاشة — فأولُ حدثِ قلمٍ
  // يُغلق باب اللمس في هذه الجلسة. ولا يُشترط جهازٌ بقلم: الإصبعُ هو الافتراض، ولا
  // يُحرَم طفلٌ جهازُه بلا قلم.
  //
  // **وحدُّه معلَنٌ** (ملاحظةُ مراجعة الجلسة ١، مقبولةٌ غيرَ حاجزة): `sawPen` **لا
  // يُصفَّر** ما دام اللوحُ قائماً — فطفلٌ كتب بالقلم ثم أراد الإصبعَ على اللوح
  // نفسِه يُهمَل لمسُه حتى يُعاد بناءُ اللوح. ومقبولٌ اليومَ لأن اللوح يُبنى لكل
  // تمرين، فتبديلُ الأداة يقع بين تمرينين لا في وسط حرف. ولو صار للطفل لوحٌ واحد
  // يعيش عبر تمارين (الجلسة ٥) فموضعُ العلاج هنا: تصفيرُه عند مهلةٍ بلا حدث قلم.
  let sawPen = false;
  let active = null;          // مؤشّرٌ واحدٌ يكتب — وما سواه لمسُ كفٍّ أو أصابعَ أخرى
  let rect = null;            // مقاسُ اللوح يُقرأ مرّةً عند النزول لا في كل حركة
  let queue = [];
  let frame = 0;
  let inkPath = null;
  let inkPoints = [];

  function toGrid(event) {
    const size = Math.min(rect.width, rect.height) || 1;
    const ox = rect.left + (rect.width - size) / 2;
    const oy = rect.top + (rect.height - size) / 2;
    return [(event.clientX - ox) / size * GRID, (event.clientY - oy) / size * GRID];
  }

  /** الرسمُ والحكمُ في `requestAnimationFrame` — لا في كل حدثِ حركة (`METHOD.md §٣.٦`). */
  function pump() {
    frame = 0;
    const batch = queue;
    queue = [];
    for (const p of batch) {
      if (dist(inkPoints[inkPoints.length - 1], p) < MIN_STEP) continue;
      inkPoints.push(p);
      trial.move(p[0], p[1]);
    }
    if (inkPath) inkPath.setAttribute('d', pathD(inkPoints));
  }

  function onDown(event) {
    if (active !== null) return;                          // إصبعٌ ثانٍ أثناء الكتابة
    if (event.pointerType === 'pen') sawPen = true;
    else if (event.pointerType === 'touch' && sawPen) return;   // كفٌّ على الشاشة والقلمُ يكتب
    active = event.pointerId;
    rect = svg.getBoundingClientRect();
    event.preventDefault();
    try { svg.setPointerCapture(event.pointerId); } catch { /* مؤشّرٌ لا يقبل الأسر */ }

    const p = toGrid(event);
    inkPoints = [p];
    inkPath = sv('path', { class: 'pen-line', d: pathD(inkPoints) });
    inkLayer.append(inkPath);
    trial.down(p[0], p[1]);
    listen(true);
  }

  /** أحداثُ الحركة والرفع تُعلَّق ما دام إصبعٌ يكتب، وتُنزَع عند رفعه — فلا تبقى
      معلّقةً على النافذة بعد مغادرة الشاشة. */
  function listen(on) {
    const how = on ? window.addEventListener : window.removeEventListener;
    how.call(window, 'pointermove', onMove);
    how.call(window, 'pointerup', onUp);
    how.call(window, 'pointercancel', onUp);
  }

  function onMove(event) {
    if (event.pointerId !== active) return;
    // نقاطُ الحركة المضغوطة (`getCoalescedEvents`) تُلتقط كلُّها: على آيباد يصل
    // القلمُ بمعدّلٍ أعلى من معدّل الإطارات، وإسقاطُها يقطّع الحبر ويكذب على الحَكَم.
    const points = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [event];
    for (const one of points.length ? points : [event]) queue.push(toGrid(one));
    if (!frame) frame = requestAnimationFrame(pump);
  }

  function onUp(event) {
    if (event.pointerId !== active) return;
    active = null;
    listen(false);
    if (frame) { cancelAnimationFrame(frame); pump(); }
    const result = trial.up();
    if (result?.ok) {
      onPart?.(result);
      paintProgress(trial.index - 1, 1);
      inkPath?.classList.add('pen-line--kept');
    } else {
      // المحاولةُ التي لم تستوفِ الجزء: حبرُها **يخفت ويذهب** — لا تُمحى تحت اليد
      // ولا تُترك فتلتبس بالصواب. ولا رسالةَ خطأ: الإرشادُ وحدَه (الشرطُ الرابع من §٣.٤).
      const gone = inkPath;
      gone?.classList.add('pen-line--fade');
      setTimeout(() => gone?.remove(), 520);
      if (trial.expected?.kind === 'stroke') paintProgress(trial.index, 0);
      hint();
    }
    inkPath = null;
    paintGuide();
    if (trial.done) onDone?.(trial.verdict());
  }

  // **النزولُ على اللوح، والحركةُ والرفعُ على النافذة** (`listen` أعلاه): طفلٌ يتجاوز
  // حافةَ اللوح بيده لا تنقطع كتابتُه — ولو عُلِّقت الأحداثُ على اللوح وحدَه لضاع
  // رفعُ الإصبع خارجه فبقيت المحاولةُ معلّقةً إلى الأبد. (وأسرُ المؤشّر يكفي حيث
  // يعمل، ولا يعمل في كل حال.)
  svg.addEventListener('pointerdown', onDown);

  // ————— العرضُ المتحرك: «شاهِد» (`METHOD.md §٥.١`) —————
  const SPEED = 900;          // وحدةَ شبكةٍ في الثانية — سرعةُ يدٍ تكتب لا تمرّ
  let playing = 0;

  /** يرسم النموذجَ حرفاً كما يُكتب: جزءاً جزءاً، من المسار المرجعيّ نفسِه. */
  function play() {
    stop();
    box.classList.add('pen-box--playing');
    for (const trail of trailPaths) if (trail) trail.setAttribute('stroke-dashoffset', trail.getAttribute('stroke-dasharray'));
    let part = 0;
    let started = 0;

    const step = (now) => {
      if (!started) started = now;
      const current = parts[part];
      if (!current) { stop(); return; }
      if (current.kind === 'dot') {
        modelPaths[part].classList.add('pen-dot--on');
        part++; started = 0;
        playing = requestAnimationFrame(step);
        return;
      }
      const elapsed = (now - started) / 1000;
      const walked = Math.min(current.poly.len, elapsed * SPEED);
      trailPaths[part].setAttribute('stroke-dashoffset', String(current.poly.len - walked));
      const { at } = pointAt(current.poly, walked);
      head.setAttribute('cx', at[0]);
      head.setAttribute('cy', at[1]);
      if (walked >= current.poly.len) { part++; started = 0; }
      playing = requestAnimationFrame(step);
    };
    playing = requestAnimationFrame(step);
  }

  function stop() {
    if (playing) cancelAnimationFrame(playing);
    playing = 0;
    box.classList.remove('pen-box--playing');
  }

  function reset() {
    stop();
    trial.reset();
    inkLayer.replaceChildren();
    inkPoints = [];
    inkPath = null;
    for (const trail of trailPaths) if (trail) trail.setAttribute('stroke-dashoffset', trail.getAttribute('stroke-dasharray'));
    for (const shape of modelPaths) shape.classList.remove('pen-dot--on');
    paintGuide();
  }

  paintGuide();

  return {
    el: box,
    svg,
    trial,
    play,
    stop,
    reset,
    /**
     * **أثرُ الطفل كما رسمه** — عقدُ حبره المرسومة على هذا اللوح، تُقرأ ولا تُخزَّن.
     *
     * وموضعُها هنا لا في الشاشة: الشاشةُ لا تنقّب في بنية اللوح. وتستعملها ميداليةُ
     * الختام (حكمُ المالك في `REVIEW_IDENTITY.md §٣ج`) لتحمل **يدَ الطفل هو** لا
     * نموذجاً مرسوماً. **ولا يمسّ ذلك عهدَ الخصوصية**: الحبرُ يُنسَخ إلى عقدةٍ على
     * الشاشة نفسِها ويموت بها — لا مخزنَ ولا شبكةَ، وهذا الملفُّ لا يعرف الاثنين.
     */
    ink() {
      return [...inkLayer.querySelectorAll('path')].map((path) => path.getAttribute('d'));
    },
    /** مغادرةُ الشاشة: يُوقَف العرضُ ويُنزَع ما عُلِّق على النافذة من أحداث. */
    destroy() { stop(); listen(false); active = null; },
    /** تبديلُ خطوة الحلقة بلا إعادة بناءٍ للوح (شاهِد ← موجَّه ← خافت ← حرّ). */
    setMode(next) {
      box.className = `pen-box pen-box--${next}`;
    },
  };
}
