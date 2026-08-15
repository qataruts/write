// تقدّم الطفل: نجوم كل عقدة + القفل التسلسلي + سجلّ المهارات ودقائق الاستخدام،
// محفوظ كله في localStorage. حساب واحد في هذه المرحلة.
//
// **من بذرة اقرأ** (`FAMILY.md §٥`) — وتعديلاتُها معلَنةٌ في `docs/SEED.md`.
//
// سجلّ المهارات (`METHOD.md §٦`): كل تمرين يسجَّل على مستوى
// **(الحرف/الكلمة × شكل الموقع × نوع التمرين)**، ومنه يُبنى التكرار المتباعد
// وجلسة المراجعة ولوحة وليّ الأمر. لا نصّ منطوق هنا — القياس لا يضيف محتوى.
//
// **ومحاورُ المفتاح ثلاثةٌ باسم اكتب لا باسم اقرأ**: كان في البذرة
// `(حرف × حركة × تمرين)` فصار `(وحدة × شكلُ موقع × تمرين)` — بدَّلَ الاسمَ لا
// البنية، فلا يُعاد تسميةُ محورٍ مرتين حين تُبنى ليتنر في الجلسة ٥.

import { STAGES, GATES, FORMS, gateBefore, stageById } from './curriculum.js';

const STORE_KEY = 'uktub.progress.v1';
export const VERSION = 1;            // أوّلُ شكلٍ لحالة طفل «اُكْتُبْ»
export const MAX_STARS = 3;

/**
 * **نجومُ جلسةٍ من أخطائها**: ثلاثٌ بلا خطأ، فاثنتان ما دامت الأخطاء ≤ عدد التمارين،
 * وإلا واحدة (عتبةٌ متناسبة، من بذرة اقرأ).
 *
 * **وموضعُها هنا لا في `review.js`** (نُقلت في الجلسة ٨): تستعملها المراجعةُ والبوابةُ
 * ودرسُ الحرف وشاشةُ النسخ — فلمّا صارت المراجعةُ تُعلن نصوصَ الدرس والنسخ معاً
 * اجتمع استيرادٌ دائريّ (`review` ← `lesson` ← `review`) **فسقط تقييمُ الوحدات في
 * المتصفّح**: `Cannot access 'LETTER_NAMES' before initialization`. والنجومُ حالةُ
 * تقدّمٍ لا جلسةُ مراجعة، فموضعُها مع `setStars` و`MAX_STARS`.
 */
export const starsForReview = (errors, items) => (errors === 0 ? 3 : errors <= items ? 2 : 1);

// رقمٌ عربيّ لعنوان المحطة. ونسخةٌ صغيرة هنا لا استيرادٌ من `ui.js`: اتجاهُ الاعتماد
// واحد (`ui.js` ← `progress.js`)، ولا تُقلَب طبقةٌ لأجل سطرٍ من عشرة محارف.
// **وموضعُهما فوق**: `migrateJourney()` تعمل وقتَ تحميل الوحدة فتبني الرحلة —
// فتعريفٌ تحتها يقع في منطقة الموت الزمنيّ ويُسقِط الوحدة كلَّها عند أول استيراد.
const arNumeral = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]);

/**
 * **سقفُ المحطة الواحدة** (أمر المالك، ١٣ أغسطس ٢٠٢٦ — على سنّة «مفاصل المرحلة
 * القرآنية» في اقرأ): «قسّم أيَّ مجموعةٍ فيها أكثرُ من ١٠ أو ١٢ حلقة إلى مجموعاتٍ
 * متتالية». **والعلّةُ كتلةٌ بلا مفاصل لا عددٌ كثير**: البساتينُ مئةٌ في عشر محطاتٍ
 * مسمّاة فلا تثقل، وإحدى عشرة ومئةٌ تحت عنوانٍ واحد تثقل.
 *
 * **وهو حدٌّ واحد يُقرأ من موضعٍ واحد** — لا رقمَ محطاتٍ يُكتب في المنهج ولا في
 * حارس: مرحلةٌ تكبر غداً تنشقّ من نفسها بلا سطرٍ يُعدَّل (يفرضه `stageSections`
 * أدناه ويقيسه `tools/test_nodes.mjs`).
 *
 * **وهو سقفٌ لا هدف** (توضيحُ المالك، `FAMILY §١٠ب`): الأقلُّ من عشرٍ صحّيٌّ مقصود،
 * فالقسمةُ تقع أوّلاً على **مفاصل المحتوى** (`sect` في المنهج: بستانٌ باسمه · سلّمُ
 * بستان · وصلُ الحروف)، ولا تُنفَخ صغيرةٌ لتبلغ الحدّ.
 *
 * **وموضعُه فوق كموضع `arNumeral`**: `migrateJourney()` تعمل وقتَ تحميل الوحدة
 * فتبني الرحلة — فتعريفٌ تحتها يقع في منطقة الموت الزمنيّ ويُسقِط الوحدة كلَّها عند
 * أوّل استيراد. (وقعت هذه بعينها في اقرأ يومَ شُقّت مرحلتُه، وأسقطت ستةَ حرّاسٍ
 * دفعة — ووقعت هنا مرّةً أخرى، فبقي القيدُ حيث يُقرأ.)
 */
export const MAX_NODES = 12;

/**
 * أنواع التمارين المقيسة — أسماؤها ثابتة لأنها تُخزَّن في مفاتيح المهارات،
 * **وهي أنواعُ `METHOD.md §٦` بأعيانها**: `م|معزول|تتبع` · `م|وسطي|حر` ·
 * `بابا|كلمة|نسخ` · `بابا|كلمة|إملاء`.
 */
export const KINDS = {
  TRACE: 'trace',       // تتبّعٌ على المسار (موجَّهاً ثم خافتاً)
  FREE: 'free',         // «اكتبه وحدك» في صندوقٍ فارغ بسطر ارتكاز
  COPY: 'copy',         // نسخُ كلمةٍ يراها
  DICTATE: 'dictate',   // إملاءٌ سماعيّ صرف
};

/**
 * **اسمُ نوع التمرين كما يُقرأ في لوحة وليّ الأمر** — بجوار مفاتيحه كما `FORM_NAMES`
 * بجوار `FORMS`: مصدرٌ واحد لا نسختان تفترقان. وألفاظُه ألفاظُ `METHOD.md §٦`
 * (`تتبع` · `حر` · `نسخ` · `إملاء`)، والمفاتيحُ إنجليزيةٌ لأنها تدخل مفاتيحَ ليتنر
 * على القرص فلا تُقلَب بتعريبٍ متأخّر يُسقِط سجلَّ طفلٍ قائم.
 *
 * **ونوعٌ يُضاف بلا اسمٍ يُمسِكه `test_measure`** (لكلِّ مقيسٍ موضعٌ في اللوحة،
 * `METHOD.md §٦`) — فلا يظهر لوليّ الأمر رمزٌ لاتينيّ في شاشةٍ عربية.
 */
export const KIND_NAMES = {
  [KINDS.TRACE]: 'تتبّع',
  [KINDS.FREE]: 'كتابةٌ حرّة',
  [KINDS.COPY]: 'نسخ',
  [KINDS.DICTATE]: 'إملاء',
};

/** شكلُ موقعِ وحدةِ الكلمة — الكلمةُ لا شكلَ موقعٍ لها، فلها محورُها المعلَن. */
export const WORD_FORM = 'كلمة';

/**
 * **ومحورُ الجملة** (الجلسة ٩، المرحلة ١٤): الجملةُ وحدةُ قياسٍ كما الكلمة — تُنسَخ
 * وتُملى — **ولها محورُها هي** لا محورُ الكلمة: لو جُمِعا لَاختلطت في صناديق ليتنر
 * جملةٌ بكلمةٍ يتشابه نصّاهما، ولقرأ وليُّ الأمر سطراً كاملاً في عمود «الكلمة».
 */
export const SENTENCE_FORM = 'جملة';

/**
 * **المهاراتُ التي لا حرفَ لها**: النسخُ والإملاء وحدتُهما **كلمةٌ أو جملة**، ومحورُ
 * الموقع فيهما `WORD_FORM` أو `SENTENCE_FORM` لا شكلٌ من `FORMS`. فتُستثنى من لوحة
 * الحروف كي **لا يظهر حرفٌ وهميّ في لوحة وليّ الأمر** (قاعدةُ اقرأ في الحزمة ١٣،
 * تسري هنا)، ولها قسمُها في اللوحة.
 */
export const isWordSkill = (skill) =>
  skill?.form === WORD_FORM || skill?.form === SENTENCE_FORM;

/** أهي مهارةُ **جملة**؟ — يقرؤها مَن يفرّق السطرَ عن الكلمة في العرض. */
export const isSentenceSkill = (skill) => skill?.form === SENTENCE_FORM;

/** هل مهارةٌ وحدتُها حرفٌ × شكلُ موقع؟ (ما عداها له قسمُه في اللوحة) */
export const isLetterSkill = (skill) => !isWordSkill(skill);

/** تباعد ليتنر بالأيام: كل إجابة صحيحة ترفع الصندوق، والخطأ يعيده إلى الصفر. */
export const BOX_DAYS = [0, 1, 2, 4, 8, 16];
export const MAX_BOX = BOX_DAYS.length - 1;
export const MASTERED_BOX = 3;       // من بلغه في كل تمارينه يُعدّ متقناً

const listeners = new Set();

// ————— ذاكرة البنية والجبهة —————
// بنية الرحلة ثابتة وقت التشغيل (بيانات منهج لا حالة طفل)، فتُبنى مرّة واحدة في
// الجلسة. وحدها «جبهة الفتح» تتحرّك بالنجوم، فتُبطَل مع كل حفظ لا مع كل قراءة.
let journeyCache = null;
let nodesCache = null;
let indexCache = null;      // معرّف العقدة ← موضعها في الرحلة (بحثٌ بزمن ثابت)
let frontierCache = null;   // موضع أول عقدة ناقصة — null = يحتاج حساباً

function blank() {
  return {
    v: VERSION,
    stars: {},        // معرّف عقدة ← نجوم
    skills: {},       // «وحدة|شكل موقع|تمرين» ← {right, wrong, box, due, seen}
    faults: {},       // «وحدة|رمزُ الخطأ الحركيّ» ← {n, seen} — انظر `recordFault`
    // **وسمُ بنية الرحلة** (الجلسة ١٠): بصمةُ عقدها ساعةَ رآها هذا الجهاز آخرَ مرّة —
    // بها وحدَها يُعرَف أنّ البنية تحرّكت فيلزم الترحيلُ الرحيم (`migrateJourney`).
    journey: '',
    // **اسمُ الطفل** (ت٣، `EXPANSION.md §٤`): يكتبه وليُّ الأمر مرّةً في لوحته
    // فتُولَّد محطتُه. 🔒 **ولا يغادر الجهاز أبداً** — يقع حيث تقع نجومُ الطفل
    // وأخطاؤه، في `localStorage` وحدَه، ولا يُنطَق ولا يدخل نسخةً تُرفَع إلى شبكة.
    name: '',
    days: {},         // «YYYY-MM-DD» ← ثوانٍ من الاستعمال الفعلي
    reviews: {},      // «YYYY-MM-DD» ← {items, right, at}
    // **عدّادُ الخفوت** (`METHOD.md §٤` مرحلة ١٣): «كلمة» ← {n, day} — ثلاثُ
    // إصاباتٍ **متباعدة** تُخفي درجةً من النموذج، والكشفُ تراجعٌ. وهو عينُ عدّاد
    // خفوت التشكيل في اقرأ آليةً، وإن اختلف ما يخفت (النموذجُ لا الشكل).
    reads: {},
    seconds: 0,
    startedAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/** ترقية حالة قديمة إلى النسخة الحالية دون فقد نجوم الطفل. */
function migrate(data) {
  if (!data || typeof data !== 'object' || typeof data.stars !== 'object') return null;
  if (data.v !== VERSION) return null;
  return { ...blank(), ...data, v: VERSION };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return blank();
    return migrate(JSON.parse(raw)) || blank();
  } catch {
    return blank();   // تخزين معطّل أو ممتلئ: نكمل في الذاكرة بلا انهيار
  }
}

let state = load();

// ————— ترحيل إعادة ترتيب الرحلة (من بذرة اقرأ) —————
// إعادةُ الترتيب شأنُنا نحن لا تقصيرُ الطفل، فلا يُحبَس أحد رجعياً: العقدةُ المشقوقة
// نجومُها لشطريها، والبوابةُ الجديدة تُعدّ مجتازةً لمن كان قد عبر مفصلَها قبل وجودها
// (نجمةٌ في عقدةٍ بعدها = عبورٌ فعليّ). ترحيلٌ بالبيانات لا برقم نسخة — فلا تُرفَع
// `VERSION` هنا: رفعُها يُسقِط حالةَ كل طفل قائم.

/**
 * العقدةُ المشقوقة ← شطرُها: من أتمّ المشقوقة فقد أتمّ شطريها.
 *
 * **فارغٌ اليومَ ولم يُحذَف**: هو موضعُ الترحيل حين تُشقّ عقدةٌ في حزمةٍ قادمة —
 * وقد شُقَّت في اقرأ مرّتين. وأولُ طفلٍ لم يفتح «اُكْتُبْ» بعدُ، فلا ماضيَ يُرحَّل.
 */
const SPLIT_NODES = {};

/**
 * **بصمةُ بنية الرحلة**: معرّفاتُ عقدها بترتيبها مطويّةً في وسمٍ قصير. يُحفظ في حال
 * الطفل، فيُعرَف بمقابلته **هل تغيّرت البنيةُ منذ آخر مرّةٍ رآها هذا الجهاز**.
 * (بصمةٌ لا رقمُ نسخة: ما يعني الترحيلَ تحرّكُ العقد نفسِها لا رقمٌ نرفعه بأيدينا.)
 */
function journeyStamp() {
  const nodes = allNodes();
  const ids = nodes.map((n) => n.id).join('|');
  let hash = 0x811c9dc5;
  for (let i = 0; i < ids.length; i++) {
    hash ^= ids.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `${nodes.length}:${hash.toString(36)}`;
}

/**
 * **ترحيلٌ رحيم**: إعادةُ ترتيب الرحلة شأنُنا نحن لا تقصيرُ الطفل، فلا يُحبَس أحد
 * رجعياً — العقدةُ المشقوقة نجومُها لشطريها، والمحطةُ المستحدثة **خلف موضع الطفل**
 * تُعدّ متجاوَزةً فلا يُقفَل عليه ما كان مفتوحاً. ترحيلٌ بالبيانات لا برقم نسخة.
 *
 * **ولا يجري إلا حين تتحرّك البنية** (إصلاحُ الجلسة ١٠، أمسكه فحصُ النسخة الاحتياطية):
 * كان يجري في **كل إقلاع**، فيملأ كلَّ عقدةٍ بلا نجمةٍ خلف موضع الطفل — ولا يفرّق
 * بين محطةٍ استحدثناها نحن ومحطةٍ **صفّرها وليُّ الأمر بيده** ليعيد طفلُه تدريبَها.
 * فكان زرُّ «صفِّر هذه المحطة» يفي بوعده في الجلسة نفسِها **ويُنقَض عند أوّل فتحٍ
 * للتطبيق**: تعود العقدُ منجَزةً بنجمةٍ ويعود الطفلُ إلى حيث كان. والعلاجُ من علّة
 * الترحيل نفسِها: موضوعُه **تغيُّرُ البنية**، فيُقاس بوسمها لا يُفترض بلا قياس.
 */
function migrateJourney() {
  const stamp = journeyStamp();
  if (state.journey === stamp) return;            // البنيةُ كما رآها هذا الجهاز آخرَ مرّة
  const fresh = !Object.keys(state.stars).length;
  state.journey = stamp;
  if (fresh) return;                              // طفلٌ جديد: لا ماضيَ يُرحَّل، والوسمُ يُكتب مع أوّل حفظ

  for (const [old, heirs] of Object.entries(SPLIT_NODES)) {
    const stars = state.stars[old];
    if (!stars) continue;
    for (const heir of heirs) if (!state.stars[heir]) state.stars[heir] = stars;
    delete state.stars[old];
  }

  const nodes = allNodes();
  let last = -1;                                  // موضع آخر عقدة لها نجمة
  for (const [i, node] of nodes.entries()) if (state.stars[node.id] > 0) last = i;
  for (const [i, node] of nodes.entries()) {
    if (state.stars[node.id] || i >= last) continue;
    // بوابةٌ عبَر مفصلَها قبل وجودها ⇒ مجتازة. ومحطةٌ استحدثناها خلف موضع الطفل:
    // نجمةُ إتمامٍ واحدة تفكّ حبسه ولا تدّعي إتقاناً — فتبقى تدعوه إلى لعبها
    // (النجوم لا تنقص، فما يكسبه حين يلعبها يعلو عليها).
    state.stars[node.id] = node.type === 'gate' ? MAX_STARS : 1;
  }

  save();   // الوسمُ وحدَه يستحقّ حفظاً وإن لم تتبدّل نجمة — وإلا أُعيد الترحيلُ غداً
}

/* **وضعُ المعاينة** (أمر المالك، ١٣ أغسطس ٢٠٢٦: «هل ينبغي أن نفتح كل شيء لمن
   يقيّم التطبيق؟»): المعلّمُ الذي يفحص يحتاج أن يرى المحطات كلَّها، والطفلُ يحتاج
   ألّا يقفز إلى ما لم يبلغه — **والقفلُ التسلسليّ جوهرُ المنهج لا قيدٌ عليه**.

   فبـ`?preview=1`: تُفتَح الرحلةُ كلُّها للتصفّح، **ولا يُكتب حرفٌ في تقدّم أحد** —
   `save()` يصير بلا أثرٍ على القرص (ويبقى إخطارُ الشاشات ليُرسَم ما يجري في الجلسة).
   فيدور المقيّمُ في كل شاشة ثم يُغلق، ويعود الجهازُ كما كان بلا محوٍ ولا زرعِ نجوم.

   **وهو غيرُ `?dev=1`**: ذاك يملأ التقدّمَ فعلاً (أدواتُ تطوير)، وهذا لا يمسّه. */
export const PREVIEW = typeof location !== 'undefined'
  && new URLSearchParams(location.search).get('preview') === '1';

function save() {
  frontierCache = null;   // النجوم وحدها تحرّك الجبهة، وكل تغيّر فيها يمرّ من هنا
  state.updatedAt = Date.now();
  if (!PREVIEW) {                       // معاينةٌ: تُرسَم الجلسةُ ولا يُمَسّ القرص
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      console.warn('[progress] تعذّر الحفظ في localStorage');
    }
  }
  for (const fn of listeners) fn(state);
}

migrateJourney();

/** الاشتراك في تغيّر التقدّم (لإعادة رسم الخريطة). */
export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ————— العقد —————

/** معرّف عقدة: «<المحطة>:<الجزء>» — «g1:ب» لدرس حرف، «warm:lines» لتمرين تهيئة. */
export function nodeId(stageId, part) {
  return `${stageId}:${part}`;
}

/**
 * عقد المحطة بترتيبها.
 *
 * **والعقدةُ ترث نوعَ محطتها**: نوعُ المحطة (`kind`) هو مفتاحُ الشاشة التي تفتحها
 * ومفتاحُ قياسها أو إعفائها في `tools/test_measure.mjs` — فمصدرٌ واحد لا مصدران،
 * ولا يفترق ما تفتحه الخريطةُ عمّا يحرسه الفاحص.
 */
export function stageNodes(stage) {
  return (stage.nodes || []).map((node) => ({
    ...node,
    id: nodeId(stage.id, node.part),
    type: stage.kind,
    stageId: stage.id,
  }));
}

/** قسمةُ قائمةٍ بالسواء إلى شُطورٍ لا يتجاوز شطرٌ منها الحدَّ — فلا شطرٌ ببقيّةٍ يتيمة. */
function evenParts(items, max) {
  const count = Math.ceil(items.length / max);
  const out = [];
  let at = 0;
  for (let i = 0; i < count; i++) {
    const take = Math.ceil((items.length - at) / (count - i));
    out.push(items.slice(at, at + take));
    at += take;
  }
  return out;
}

/**
 * **شقُّ المحطة الكبيرة محطاتٍ متتالية** (الجلسة ش) — نظيرُ `quranSections` في اقرأ.
 *
 * **والشقُّ قسمةُ العقد نفسِها بترتيبها**: تُوزَّع عقدُ `stageNodes()` على شُطورها
 * بلا فرزٍ ولا إعادةِ بناء — **فالتسلسلُ المسطَّح هو هو حرفاً بحرف** (يثبته
 * `test_nodes.mjs` بمقايسة الاثنين). فلا ترتيبَ تغيّر ولا قفلٌ ولا نجمةٌ ولا مفتاحُ
 * ليتنر: معرّفُ العقدة `<المحطة>:<الجزء>` مبنيٌّ من **معرّف المرحلة** لا من الشطر،
 * فبصمةُ البنية (`journeyStamp`) لا تتحرّك و**الترحيلُ بلا أثر** لمن هو في منتصف
 * الرحلة اليوم. وإنما تبدّل العنوانُ فوق العقد والصندوقُ حولها.
 *
 * وترتيبُ الحكم: **المفصلُ أوّلاً** (`sect` — يقوله محتواها)، ثم **السقفُ فوقه**
 * (مفصلٌ يتجاوز `MAX_NODES` يُقسَم بالسواء ويُرقَّم)، ثم **الاسمُ من المادّة** لما
 * لا مفصلَ له: جوامعُ جذوره إن كانت (كما تُسمّى محطةُ الحروف بحروفها)، وإلا اسمُ
 * مرحلته وعددُه.
 */
export function stageSections(stage) {
  const nodes = stageNodes(stage);

  const joints = [];
  for (const node of nodes) {
    const key = node.sect ?? null;
    const last = joints[joints.length - 1];
    if (last && last.key === key) last.nodes.push(node);
    else joints.push({ key, nodes: [node] });
  }

  const parts = joints.flatMap((joint) => {
    const split = evenParts(joint.nodes, MAX_NODES);
    return split.map((chunk, i) => ({
      nodes: chunk,
      title: joint.key && split.length > 1 ? `${joint.key} ${arNumeral(i + 1)}` : joint.key,
    }));
  });

  // مرحلةٌ لا تتجاوز السقفَ ولا مفصلَ فيها تبقى محطةً واحدة بمعرّفها وعنوانها كما كانت
  if (parts.length <= 1) {
    return [{ kind: stage.kind, id: stage.id, stage, nodes, part: 1, parts: 1 }];
  }
  return parts.map((chunk, i) => ({
    kind: stage.kind,
    id: `${stage.id}#${i + 1}`,
    stage: { ...stage, nodes: chunk.nodes, title: chunk.title || partName(stage, chunk.nodes, i) },
    nodes: chunk.nodes,
    part: i + 1,
    parts: parts.length,
  }));
}

/**
 * اسمُ شطرٍ لا مفصلَ له في المنهج — **من مادّته**: جوامعُ جذوره إن كانت كلُّها
 * أسراً (`جُذُورُ كتب درس علم` كما تُسمّى محطةُ الحروف `حُرُوفُ ا ب م ل`، فالجذرُ
 * جامعُ أسرته كما الحرفُ مادّةُ درسه)، وإلا اسمُ مرحلته وعددُه.
 */
function partName(stage, nodes, index) {
  const roots = nodes.map((node) => node.root).filter(Boolean);
  if (roots.length === nodes.length && roots.length) return `جُذُورُ ${roots.join(' ')}`;
  return `${stage.title} ${arNumeral(index + 1)}`;
}

/**
 * عقدة «البوابة» (`METHOD.md §٤`): عقدةٌ واحدة تقف قبل مفصلٍ كبير، لا تُجتاز
 * بالإتمام بل بالإصابة — وحدها في محطتها كي يراها الطفل بوّابةً لا درساً.
 */
export function gateNodes(gate) {
  return [{ id: `gate:${gate.id}`, type: 'gate', part: gate.id, gate }];
}

/**
 * الرحلة كاملةً بأقسامها بالترتيب: محطاتُ `curriculum.js` كما هي، وقبل كلٍّ
 * بوابتُها إن أُعلنت لها بوابة، وبوابةُ الختام (`before: 'end'`) آخِرَها.
 *
 * **والبوابةُ بيانٌ مُعلَن**: إن سقطت من `GATES` سقطت من الرحلة ولا يبقى لها أثرٌ
 * في القفل (عينُ عقدها في اقرأ).
 *
 * **ولا رقمَ محطاتٍ مكتوبٌ هنا ولا في حارس** (`METHOD.md §٤`): طولُ الرحلة ثمرةُ
 * البيانات — يتغيّر بتغيّرها ولا يُعَدّ ذلك انحرافاً.
 */
export function journey() {
  if (journeyCache) return journeyCache;
  const out = [];
  const pushGate = (where) => {
    const gate = gateBefore(where);
    if (gate) out.push({ kind: 'gate', id: `gate:${gate.id}`, gate, nodes: gateNodes(gate) });
  };

  for (const stage of STAGES) {
    pushGate(stage.id);
    // **والمرحلةُ الكبيرة تنشقّ محطاتٍ متتالية** (الجلسة ش) — شقٌّ في العرض لا في
    // المنهج: عقدُها هي هي بمعرّفاتها وترتيبها، وإنما تُوزَّع على صناديقَ مسمّاة.
    out.push(...stageSections(stage));
  }
  pushGate('end');

  journeyCache = out;
  return out;
}

export function allNodes() {
  if (!nodesCache) nodesCache = journey().flatMap((section) => section.nodes);
  return nodesCache;
}

/** موضع العقدة في الرحلة أو ‑١ — من فهرسٍ مبنيّ مرّة، لا بمسح القائمة في كل نداء. */
function indexOf(id) {
  if (!indexCache) indexCache = new Map(allNodes().map((n, i) => [n.id, i]));
  const index = indexCache.get(id);
  return index === undefined ? -1 : index;
}

export function findNode(id) {
  const index = indexOf(id);
  return index < 0 ? null : allNodes()[index];
}

// ————— النجوم —————

export function getStars(id) {
  return state.stars[id] || 0;
}

export function isDone(id) {
  return getStars(id) > 0;
}

/**
 * تسجيل نتيجة عقدة. لا يُنقص ما سبق: تكرار الدرس يرفع النجوم ولا يخفضها.
 * @returns {boolean} هل تحسّنت النتيجة؟
 */
export function setStars(id, stars) {
  const n = Math.max(0, Math.min(MAX_STARS, Math.round(stars)));
  if (n <= getStars(id)) return false;
  state.stars[id] = n;
  save();
  return true;
}

/** نجوم المحطة وسقفها. */
export function stageStars(stage) {
  const nodes = stageNodes(stage);
  return {
    earned: nodes.reduce((sum, n) => sum + getStars(n.id), 0),
    max: nodes.length * MAX_STARS,
    doneNodes: nodes.filter((n) => isDone(n.id)).length,
    totalNodes: nodes.length,
  };
}

/** اسمُ الطفل كما أدخله وليُّ الأمر — فارغٌ ما لم يُدخَل. */
export const childName = () => String(state.name || '');

/** تعيينُ اسم الطفل (لوحةُ وليّ الأمر وحدَها) — والفراغُ يمحوه. */
export function setChildName(text) {
  const clean = String(text ?? '').trim().replace(/\s+/g, ' ');
  if (clean === state.name) return false;
  state.name = clean;
  frontierCache = null;         // محطةُ الاسم تدخل الرحلةَ أو تخرج منها بهذا وحدَه
  save();
  return true;
}

/**
 * **عقدةٌ لا مادّةَ لها اليوم** — محطةُ الاسم قبل أن يُدخله وليُّ الأمر.
 *
 * **ولا تحبس الرحلة**: «مسارٌ واحد متصل» عهدٌ، ومادّةُ هذه المحطة **بيدِ بالغٍ لا
 * بيدِ الطفل** — فلو حبستْه لانتظر طفلٌ أباه ليكمل رحلته. فتتخطّاها الجبهةُ وتبقى
 * مفتوحةً: يومَ يُكتب الاسمُ تصير محطةً كاملة بنجومها في موضعها من الرحلة.
 */
export const isOptional = (node) => node?.type === 'name' && !childName();

export function totalStars() {
  return allNodes().reduce((sum, n) => sum + getStars(n.id), 0);
}

export function maxTotalStars() {
  return allNodes().filter((n) => !isOptional(n)).length * MAX_STARS;
}

// ————— القفل التسلسلي —————
// قاعدة واحدة تحكم الرحلة كلها: العقدة تُفتح بإتمام كل ما قبلها في `allNodes()`.
// فينتظم في حبل واحد: حروف المجموعة، ثم لعبة كلماتها، ثم مهارات ما بعدها وقصصه.
//
// والحبلُ الواحد يختصر القاعدة في رقم: ما دام كل ما قبل العقدة يجب أن يكون منجَزاً،
// فيكفي موضعُ **أول عقدة ناقصة** — «جبهة الفتح». وبها صار القفل قراءةَ رقمٍ لكل
// عقدة بدل مسحِ كل سوابقها (١٦٢ عقدة كانت تُكلّف الرسمة الواحدة عشرات الآلاف من
// المقارنات، وتزداد كلما تقدّم الطفل — بلاغ بطء الخريطة على آيباد قديم).

/**
 * «جبهة الفتح»: موضع أول عقدة لم تُنجَز (وطولُ الرحلة إن أُتمّت كلها).
 * كل ما قبلها منجَزٌ بالضرورة، فالعقدة مفتوحة إن كان موضعها ≤ الجبهة — وهي عينُ
 * القاعدة الأصلية لا تقريبٌ لها. تُحسب كسولاً مرّةً وتُبطَل مع كل حفظ.
 */
export function unlockFrontier() {
  if (frontierCache === null) {
    const nodes = allNodes();
    let i = 0;
    while (i < nodes.length && (isDone(nodes[i].id) || isOptional(nodes[i]))) i++;
    frontierCache = i;
  }
  return frontierCache;
}

/** العقدة مفتوحة = كل ما سبقها في الرحلة مُنجَز (أي: موضعها ≤ الجبهة). */
export function isNodeUnlockedById(id) {
  const index = indexOf(id);
  if (index < 0) return false;
  // **المعاينةُ تفتح القفلَ ولا تدّعي إتماماً**: جُرِّب دفعُ الجبهة إلى آخر الرحلة
  // فقالت الخريطةُ للمقيّم «أتممتَ الرحلة كلها» — وهو خبرٌ كاذب. فالجبهةُ تبقى
  // على حقيقتها (ومنها «تابع من هنا» ونسبةُ الإنجاز)، والقفلُ وحدَه يُرفَع.
  if (PREVIEW) return true;
  return index <= unlockFrontier();
}

/** المحطة مكتملة = كل عقدها أُنجزت. */
export function isStageComplete(stage) {
  return stageNodes(stage).every((n) => isDone(n.id));
}

/** تُفتح المحطة الأولى دائماً، وما بعدها بإتمام كل ما قبله في الرحلة. */
export function isStageUnlocked(stageId) {
  const stage = stageById(stageId);
  const nodes = stage ? stageNodes(stage) : [];
  return nodes.length ? isNodeUnlockedById(nodes[0].id) : false;
}

/** عقدة داخل محطة بمعرّفها المركّب. */
export function isNodeUnlocked(stageId, part) {
  return isNodeUnlockedById(nodeId(stageId, part));
}

/** أول عقدة لم تُنجَز في الرحلة — «تابع من هنا». */
export function nextNode() {
  return allNodes()[unlockFrontier()] || null;   // خارج القائمة = اكتملت الرحلة
}

// ————— حصيلة الطفل (ما يجوز أن يظهر له في المراجعة) —————
//
// **حصيلةٌ لا نيّة**: ما أتمّه الطفل فعلاً، لا ما في المنهج. وهي مرجعُ «لا يُطلب
// كتابةُ ما لم يُدرَّس كتابةً» في المراجعة والبوابة — والحارسُ المقابل على المادّة
// نفسِها `tools/check_writable.py` (الجلسة ٣).
//
// **وتُقرأ من عقد الرحلة لا من جداولَ موازية**: العقدةُ تُعلن ما تدرّسه (`letter`
// و`form` و`words`)، فمصدرٌ واحد لا مصدران يفترقان يوماً.

/** الحروف التي أتمّ درسَ معزولها فعلاً، بترتيب المنهج. */
export function studiedLetters() {
  const out = [];
  for (const node of allNodes()) {
    if (node.type === 'letter' && node.letter && isDone(node.id) && !out.includes(node.letter)) {
      out.push(node.letter);
    }
  }
  return out;
}

/**
 * أشكالُ المواقع التي أتمّها: [{letter, form}] — ومعها المعزولُ من درسه.
 *
 * **وعقدةُ الشكل تحمل حروفَ مجموعةٍ لا حرفاً واحداً** (منهجُ الجلسة ٣: محطةُ الشكل
 * الواحد تمشي على مجموعات اقرأ السبع) — ويبقى `letter` مقروءاً إن جاءت عقدةُ حرفٍ
 * مفرد يوماً، فمصدرٌ واحد لا مصدران.
 */
export function studiedForms() {
  const out = studiedLetters().map((letter) => ({ letter, form: FORMS.ISOLATED }));
  for (const node of allNodes()) {
    if (node.type !== 'form' || !node.form || !isDone(node.id)) continue;
    const letters = node.letters || (node.letter ? [node.letter] : []);
    for (const letter of letters) out.push({ letter, form: node.form });
  }
  return out;
}

/**
 * الكلماتُ التي كتبها فعلاً (نسخاً أو إملاءً) — من عقد الوصل والخفوت والجمل.
 * **وكلُّها من بنك اقرأ** (`METHOD.md §٨`): العقدةُ تحملها، ولا يُخترَع هنا حرف.
 */
export function studiedWords() {
  const seen = new Set();
  const out = [];
  for (const node of allNodes()) {
    if (!isDone(node.id)) continue;
    for (const word of node.words || []) {
      if (seen.has(word)) continue;
      seen.add(word);
      out.push(word);
    }
  }
  return out;
}

/** الجملُ التي أتمّ محطاتِها — مادّةُ مراجعة النسخ والإملاء الجُمَليّ. */
export function studiedSentences() {
  const out = [];
  for (const node of allNodes()) {
    if (node.type === 'sentence' && isDone(node.id)) out.push(...(node.sentences || []));
  }
  return out;
}

// ————— سجلّ المهارات والتكرار المتباعد —————

/** رقم اليوم المحلي (لا UTC): وحدة الجدولة في التكرار المتباعد. */
export function dayNumber(date = new Date()) {
  return Math.floor((date.getTime() - date.getTimezoneOffset() * 60000) / 86400000);
}

/** مفتاح اليوم «YYYY-MM-DD» بالتقويم المحلي (لسجلّ الدقائق والمراجعات). */
export function dayKey(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * مفتاح المهارة: **(وحدة × شكل موقع × نوع تمرين)** — `METHOD.md §٦` حرفاً:
 * `م|معزول|تتبع` · `م|وسطي|حر` · `بابا|كلمة|نسخ` · `بابا|كلمة|إملاء`.
 */
export function skillKey(unit, form, kind) {
  return `${unit}|${form || FORMS.ISOLATED}|${kind}`;
}

export function parseSkillKey(key) {
  const [unit, form, kind] = String(key).split('|');
  return { unit, form, kind };
}

export function getSkill(key) {
  return state.skills[key] || null;
}

/** كل المهارات المسجّلة: [{key, unit, form, kind, right, wrong, box, due, seen}] */
export function skills() {
  return Object.entries(state.skills).map(([key, s]) => ({ key, ...parseSkillKey(key), ...s }));
}

/**
 * تسجيل محاولة واحدة. الصحيحة ترفع صندوق ليتنر فيتباعد موعدها،
 * والخاطئة تعيده إلى الصفر فتعود المهارة في مراجعة اليوم نفسه (`METHOD.md §٦`).
 * @returns {object|null} حالة المهارة بعد التسجيل
 */
export function recordAttempt(unit, form, kind, correct, today = dayNumber()) {
  if (!unit || !kind) return null;
  const key = skillKey(unit, form, kind);
  const s = state.skills[key] || { right: 0, wrong: 0, box: 0, due: today, seen: today };
  if (correct) {
    s.right++;
    s.box = Math.min(MAX_BOX, s.box + 1);
  } else {
    s.wrong++;
    s.box = 0;
  }
  s.due = today + BOX_DAYS[s.box];
  s.seen = today;
  state.skills[key] = s;
  save();
  return s;
}

// ————— عدّادُ أخطاء الاتجاه المميَّز (`METHOD.md §٦`) —————
//
// **الذهبُ القياسيّ لهذا التطبيق**: موضعُ الخطأ الحركيّ يُسجَّل **بعينه** — «يبدأ
// الميمَ من أسفل» لا «أخطأ في الميم». ورموزُه رموزُ `pen.js` نفسِها (`FAULTS`)،
// **ولا تُكتب هنا قائمةٌ ثانية** تشيخ: ما يُمرَّر يُخزَّن كما جاء من المحرّك، وتقرؤه
// لوحةُ وليّ الأمر (الجلسة ١٠) فتبني منه جملتَها.
//
// **وهو غيرُ ليتنر ولا يُغني عنه**: ليتنر يقيس **الإتقان** بمفتاحه الثلاثيّ
// (وحدة × شكل موقع × تمرين) ويجدول المراجعة؛ وهذا يقيس **العادةَ الحركية**. فمحطةُ
// التهيئة — المعفاةُ من ليتنر بعلّتها (قرارُ الجلسة ٣، لأن وحداتِها خطوطٌ لا حروف
// ولا شكلَ موقعٍ لها في المفتاح) — **تكتب هنا من أوّل محطة**، فلا تمرّ حركةٌ خاطئة
// بلا قياس ولو لم تدخل صناديقَ التثبيت.
//
// 🔒 **والمخزونُ عددٌ لا أثرُ يد**: لا إحداثيَّ نقطةٍ ولا انزياحَ يُكتب على القرص —
// مسارُ الطفل يعيش في الذاكرة ويموت فيها (`METHOD.md §٣.٧`)، والنسخةُ الاحتياطية
// ملفٌّ يُرسَل ويُخزَّن حيث شاء وليُّه فلا يدخلها أثرُ يده من بابٍ خلفيّ. وموضعُ
// الخطأ محفوظٌ في **اسمه** (`start-end` = «يبدأ من الطرف الآخر») لا في إحداثيّ.

/** مفتاح عدّاد الاتجاه: **(وحدة × رمزُ الخطأ)** — والوحدةُ حرفٌ أو شكلُ تهيئة. */
export const faultKey = (unit, code) => `${unit}|${code}`;

/**
 * تسجيلُ خطأٍ حركيّ واحد بعينه.
 * @param {string} unit الوحدة المكتوبة (حرفٌ، أو محطةُ تهيئةٍ مثل `lines-h`)
 * @param {string} code رمزُ الخطأ من `pen.js` (`FAULTS`)
 * @returns {object|null} حالةُ العدّاد بعد التسجيل
 */
export function recordFault(unit, code, today = dayNumber()) {
  if (!unit || !code) return null;
  const key = faultKey(unit, code);
  const entry = state.faults[key] || { n: 0, seen: today };
  entry.n++;
  entry.seen = today;
  state.faults[key] = entry;
  save();
  return entry;
}

/** كلُّ ما سُجِّل من أخطاء الاتجاه: [{key, unit, code, n, seen}] — الأكثرُ أولاً. */
export function faults() {
  return Object.entries(state.faults || {})
    .map(([key, entry]) => {
      const [unit, code] = key.split('|');
      return { key, unit, code, ...entry };
    })
    .sort((a, b) => b.n - a.n || a.key.localeCompare(b.key));
}

/** أخطاءُ وحدةٍ بعينها (حرفٌ أو محطةُ تهيئة). */
export const faultsOf = (unit) => faults().filter((f) => f.unit === unit);

/** ترتيب الضعف: أدنى صندوق، ثم أكثر أخطاءً، ثم أقدم استحقاقاً (وأخيراً المفتاح لثبات الترتيب). */
const byWeakness = (a, b) =>
  a.box - b.box || b.wrong - a.wrong || a.due - b.due || a.key.localeCompare(b.key);

/**
 * المستحقّ للمراجعة اليوم، الأضعف أولاً.
 * (المهارة التي لم تُلمس بعدُ ليست هنا — المراجعة تراجع ما مرّ به الطفل فعلاً.)
 */
export function dueSkills(today = dayNumber()) {
  return skills().filter((s) => s.due <= today).sort(byWeakness);
}

/**
 * كل المهارات المسجّلة بالأضعف أولاً **بلا نظر إلى موعد ليتنر** — مادّةُ بوابة الإتقان
 * (الحزمة ١٤): البوابة تسأل عن أضعف ما في يده لا عمّا حان موعده، فقد يحين موعد القويّ
 * وحده يوم البوابة فتمرّ بلا معنى.
 */
export function weakestSkills() {
  return skills().sort(byWeakness);
}

/** ترتيبُ الحروف كما يقع في الرحلة — يقرؤه ترتيبُ لوحة وليّ الأمر. */
function letterOrder() {
  const out = [];
  for (const node of allNodes()) {
    if (node.type === 'letter' && node.letter && !out.includes(node.letter)) out.push(node.letter);
  }
  return out;
}

/**
 * حصيلة كل حرف من سجلّه: متقن (كل تمارينه بلغت صندوق الإتقان)،
 * أو متعثّر (خطآن فأكثر وما زال في الصناديق الدنيا)، أو قيد التعلّم.
 */
export function letterStats() {
  const byLetter = new Map();
  for (const s of skills()) {
    if (!isLetterSkill(s)) continue;   // الكلمةُ ليست حرفاً — ولها قسمُها في اللوحة
    const acc = byLetter.get(s.unit)
      || { letter: s.unit, right: 0, wrong: 0, minBox: MAX_BOX, kinds: 0, seen: 0 };
    acc.right += s.right;
    acc.wrong += s.wrong;
    acc.minBox = Math.min(acc.minBox, s.box);
    acc.kinds++;
    acc.seen = Math.max(acc.seen, s.seen);
    byLetter.set(s.unit, acc);
  }
  const order = letterOrder();
  const rank = (ch) => (order.indexOf(ch) < 0 ? order.length : order.indexOf(ch));
  return [...byLetter.values()]
    .map((a) => ({
      ...a,
      attempts: a.right + a.wrong,
      mastered: a.minBox >= MASTERED_BOX,
      struggling: a.wrong >= 2 && a.minBox <= 1,
    }))
    .sort((a, b) => rank(a.letter) - rank(b.letter));
}

// ————— عدّاد الإصابات المتباعدة لكل كلمة (خفوت النموذج — `METHOD.md §٤` مرحلة ١٣) —————
//
// **لكل كلمة عتبةُ خفوتها الخاصة بتاريخ الطفل معها** — لا خفوت جماعي اعتباطي.
// وهذا مخزنُ التاريخ وحدَه: رقمٌ لكل كلمة ويومُ آخر ما احتُسب لها. أمّا العتبةُ
// والدرجاتُ وصورةُ النموذج المخفوت فتملكها شاشةُ الخفوت (الجلسة ٩) — والاتجاه في
// اتجاهٍ واحد كما في اقرأ: الشاشةُ ← `progress.js`، فلا تعرف هذه الوحدةُ خفوتاً.
//
// **وهو عينُ عدّاد خفوت التشكيل في اقرأ آليةً** (`METHOD.md §٤`: «عينُ عدّاد
// الخفوت»)، وإن اختلف ما يخفت: هناك يخفت شكلُ الكلمة المقروءة، وهنا يخفت
// **نموذجُ الكلمة المكتوبة** حتى يصير إملاءً سماعياً صرفاً.
//
// **ومفتاحُ الكلمة نصُّها كما في البنك** — لا جذعٌ مشتقّ: `stemOf` في اقرأ يوحّد
// صيغةَ الكلمة بين الجملة والبطاقة، وذلك مطلبُ **القراءة** حيث تلبس الكلمةُ لباسَ
// موضعها. وفي الكتابة **الصيغةُ نفسُها هي المكتوبة**، فتوحيدُها يخلط ما يجب فصلُه.
// وإن احتاجت الجلسةُ ٩ توحيداً فموضعُه هنا، بعلّةٍ مكتوبة.
//
// و**التباعد شرطٌ بنيويّ**: لا تُحتسب للكلمة إصابتان في يومٍ واحد مهما تكرّرت —
// «٣ إصابات **متباعدة**» تعني ثلاثة أيام، لا ثلاث محاولات في جلسة. (والوحدة يومُ
// `dayNumber()` نفسُه الذي يجدول به ليتنر — لا وحدةَ زمنٍ ثانية.)

/** مفتاح الكلمة في عدّاد الخفوت — نصُّها كما في بنك اقرأ. */
export const wordKey = (text) => String(text ?? '').trim();

/** السجلّ مضموناً كائناً — نسخةٌ احتياطية معطوبة لا تُسقِط قراءةً ولا كتابة. */
function reads() {
  if (!state.reads || typeof state.reads !== 'object') state.reads = {};
  return state.reads;
}

/** قراءات هذه الكلمة الصحيحة المتباعدة (صفرٌ لما لم يُقرأ بعد). */
export function readCount(key) {
  return reads()[key]?.n || 0;
}

/**
 * تسجيل قراءةٍ صحيحة لكلمة. **يومٌ واحد لا يزيد العدّاد إلا مرة**، فما تكرّر في
 * الجلسة الواحدة قراءةٌ واحدة — وهو معنى «متباعدة».
 * @returns {boolean} هل ارتفع العدّاد فعلاً؟
 */
export function recordRead(text, today = dayNumber()) {
  const key = wordKey(text);
  if (!key) return false;
  const before = reads()[key];
  if (before && before.day >= today) return false;
  reads()[key] = { n: (before?.n || 0) + 1, day: today };
  save();
  return true;
}

/**
 * «الشكل عند الطلب»: كشفُ تشكيل كلمةٍ مخفوتة **تراجعٌ جزئيّ** في عدّادها — درجةٌ
 * واحدة إلى الوراء لا تصفيرٌ. فالكلمةُ التي احتاج إلى شكلها لم تنضج بعدُ للعري،
 * وتعود إلى ما دون عتبتها فتُعرض مشكولةً حتى يقرأها متباعداً من جديد.
 * @returns {number} العدّاد بعد التراجع
 */
export function revealRead(text) {
  const key = wordKey(text);
  if (!key || !reads()[key]) return 0;
  const n = Math.max(0, reads()[key].n - 1);
  if (n) reads()[key] = { ...reads()[key], n };
  else delete reads()[key];         // لا نُبقي صفراً في التخزين
  save();
  return n;
}

/** كل الكلمات التي لها تاريخُ قراءة: [{key, n, day}] — مادّةُ لوحة وليّ الأمر. */
export function wordReads() {
  return Object.entries(reads()).map(([key, r]) => ({ key, ...r }));
}

// ————— دقائق الاستخدام —————

/** إضافة زمن استعمال فعلي (يُستدعى بنبضة من main.js وقت انتباه الطفل فقط). */
export function addSeconds(sec, key = dayKey()) {
  const n = Math.max(0, Math.round(sec));
  if (!n) return;
  state.seconds += n;
  state.days[key] = (state.days[key] || 0) + n;
  save();
}

export function secondsOn(key = dayKey()) {
  return state.days[key] || 0;
}

export function totalSeconds() {
  return state.seconds;
}

/** آخر N يوماً منتهيةً باليوم: [{key, seconds}] — للوحة وليّ الأمر. */
export function usageDays(count = 7, today = new Date()) {
  const out = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    out.push({ key: dayKey(d), seconds: secondsOn(dayKey(d)) });
  }
  return out;
}

// ————— جلسة المراجعة اليومية —————

export function reviewOf(key = dayKey()) {
  return state.reviews[key] || null;
}

/**
 * تسجيل مراجعة أُتمّت اليوم. الوحدة **محاولة** لا تمرين — تمرين التركيب فيه
 * محاولة لكل مقطع، فخلطهما يكذب على وليّ الأمر في نسبة الإصابة.
 */
export function markReview(tries, right, key = dayKey()) {
  const before = state.reviews[key];
  state.reviews[key] = {
    tries: (before?.tries || 0) + tries,
    right: (before?.right || 0) + right,
    at: Date.now(),
  };
  save();
  return state.reviews[key];
}

/** أيام المراجعة المتتالية المنتهية باليوم أو بالأمس (لا تنكسر السلسلة قبل نوم الطفل). */
export function reviewStreak(today = new Date()) {
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    if (state.reviews[dayKey(d)]) streak++;
    else if (i > 0 || streak) break;
  }
  return streak;
}

// ————— «اقرأ لي» لم يُنقَل من البذرة —————
//
// **علّتُه**: في اقرأ يُلتقط **صوتُ الطفل** (`recorder.js`) وتُسجَّل هنا مددُ
// قراءاته الجهرية. و«اُكْتُبْ» لا يلتقط صوتاً ألبتّة — أثرُ الطفل الخاصّ فيه
// **مساراتُ قلمه**، وتملكها الجلسةُ ١ في `pen.js` وحدَه (`METHOD.md §٣.٧`:
// «لا يعرف الشبكة أصلاً»). فنقلُ سجلٍّ لصوتٍ لا يُلتقط ادّعاءٌ لا تعليق.
//
// **وحقلا `records` و`mic` سقطا معه من `blank()`** — لا حقلَ في تخزين الطفل بلا
// كاتبٍ وقارئ. فإن قرّرت جلسةٌ قادمة أن يُحفَظ للمسار أثرٌ فموضعُه هنا بعلّته،
// **وشرطُه ألّا يدخل النسخةَ الاحتياطية** (القاعدة نفسُها أدناه).

// ————— النسخة الاحتياطية: نقلُ تقدّم الطفل بين الأجهزة (من بذرة اقرأ) —————
//
// **العلّة**: التقدّم في هذا الجهاز وحده — لا حساب ولا سحابة (قاعدة الخصوصية،
// وهي عينُ ما تَعِد به الصفحة التعريفية). وثمنُها أن **محو بيانات المتصفّح أو حذف
// التطبيق المثبَّت يمحو رحلة الطفل كلها**، وأن تبديل الجهاز يبدأ من الصفر. فالمخرج
// ملفٌّ صغير يملكه وليّ الأمر: نجومٌ وصناديقُ ليتنر ودقائقُ ومراجعاتٌ وعدّادُ خفوت.
//
// و**لا مسارَ قلمٍ واحداً فيه**: مساراتُ كتابة الطفل لا تغادر جهازه أبداً
// (`METHOD.md §٣.٧`)، والنسخةُ ملفٌّ يُنسَخ ويُرسَل ويُخزَّن حيث شاء وليّه — فدخولُ
// مسارِه فيها نقضٌ للقاعدة من بابٍ خلفيّ. فما يدخلها **أرقامُ قياسٍ لا أثرُ يدٍ**.

export const BACKUP_KIND = 'uktub.progress';
export const BACKUP_FORMAT = 1;      // شكل الملف نفسه — لا نسخة حالة الطفل (`VERSION`)

/** النسخة كما تُكتب في الملف: ترويسةٌ تعرّف نفسها، وحالةُ الطفل كاملةً. */
export function backup(at = Date.now()) {
  return { kind: BACKUP_KIND, format: BACKUP_FORMAT, savedAt: at, state: snapshot() };
}

export function backupText(bundle = backup()) {
  return JSON.stringify(bundle, null, 1);
}

/** اسم الملف بيومه — فتتراكم نسخُ وليّ الأمر مرتَّبةً بلا أن يطمس بعضها بعضاً. */
export function backupName(date = new Date()) {
  return `uktub-progress-${dayKey(date)}.json`;
}

/**
 * قراءة ملفٍ اختاره وليّ الأمر. **لا يُستعاد مجهولٌ**: كل رفضٍ يُعلَن بسببه بالعربية،
 * لأن الاستعادة تكتب فوق تقدّم قائم — وخطؤها لا يُستدرك.
 * @returns {{bundle: object}|{error: string}}
 */
export function readBackup(text) {
  let raw;
  try {
    raw = JSON.parse(String(text ?? ''));
  } catch {
    return { error: 'تعذّرت قراءة الملف — ليس ملفَ نسخةٍ صالحاً.' };
  }
  if (!raw || typeof raw !== 'object' || raw.kind !== BACKUP_KIND) {
    return { error: 'هذا الملف ليس نسخةَ تقدّمٍ من «اُكْتُبْ».' };
  }
  const format = Number(raw.format);
  if (!Number.isFinite(format)) return { error: 'ملف النسخة معطوب — لا يعلن شكله.' };
  if (format > BACKUP_FORMAT) {
    return { error: 'هذه النسخة من إصدارٍ أحدث من التطبيق — حدِّث التطبيق ثم استعِدها.' };
  }
  const state = migrate(raw.state);
  if (!state) return { error: 'ملف النسخة معطوب — لا تقدّم فيه.' };
  return { bundle: { ...raw, state } };
}

/**
 * ما في النسخة بعبارة وليّ الأمر — يُعرض **قبل** التأكيد: نسخةٌ خاطئة تُستعاد فوق
 * تقدّمٍ حقيقيّ خسارةٌ لا رجعة فيها، ورقمُ نجومها ويومُها يميّزانها في نظرة.
 * والنجومُ تُحسب على عقد الرحلة الحالية وحدها (لا على مفاتيح لا وجود لها اليوم).
 */
export function backupSummary(bundle) {
  const stars = bundle?.state?.stars || {};
  const done = allNodes().filter((n) => stars[n.id] > 0);
  return {
    savedAt: bundle?.savedAt || 0,
    nodes: done.length,
    stars: done.reduce((sum, n) => sum + Math.min(MAX_STARS, stars[n.id]), 0),
    skills: Object.keys(bundle?.state?.skills || {}).length,
    reads: Object.keys(bundle?.state?.reads || {}).length,
    // **وعدّادُ الاتجاه يُعَدّ في الحصيلة** (الجلسة ١٠): هو الذي تُبنى منه خرائطُ
    // اللوحة، فنسخةٌ تُستعاد فوق أخرى تُفقِده — فيُقرأ عددُه قبل التأكيد لا بعده.
    faults: Object.keys(bundle?.state?.faults || {}).length,
    seconds: bundle?.state?.seconds || 0,
  };
}

/**
 * الاستعادة: حالةُ النسخة تحلّ محلّ الحالة القائمة كاملةً (لا دمج — دمجُ رحلتين
 * يصنع طفلاً ثالثاً لا وجود له). وتمرّ بترحيل الرحلة نفسِه، فنسخةٌ من إصدارٍ سابق
 * لا تُحبَس عند عقدةٍ استُحدثت بعدها.
 */
export function restore(bundle) {
  const next = bundle?.state;
  if (!next || typeof next.stars !== 'object') return false;
  state = { ...blank(), ...next, v: VERSION };
  save();
  migrateJourney();
  return true;
}

// ————— تحكّم وليّ الأمر في الرحلة (الحزمة ١١، خلف بوابته الحسابية) —————

/**
 * فتحٌ يدويّ إلى عقدةٍ بعينها — لطفلٍ يعرف حروفه فلا يُحبَس في أوّلها.
 * كل ما قبلها يُعدّ متماً **بنجمةٍ واحدة**: تفكّ القفل ولا تدّعي إتقاناً، فتبقى
 * العقدةُ تدعوه إلى لعبها والنجومُ تعلو حين يلعبها (حكمُ الترحيل الرحيم نفسُه).
 * ولا تُنقَص نجمةٌ كُسبت.
 * @returns {number} عدد العقد التي فُتحت فعلاً
 */
export function unlockUpTo(id) {
  const pending = unfinishedBefore(id);
  for (const node of pending) state.stars[node.id] = 1;
  if (pending.length) save();
  return pending.length;
}

function unfinishedBefore(id) {
  const index = indexOf(id);
  return index < 0 ? [] : allNodes().slice(0, index).filter((n) => !getStars(n.id));
}

/** كم عقدةً ناقصة قبل هذه العقدة — ما سيفتحه `unlockUpTo` **قبل** أن يفعله. */
export const pendingBefore = (id) => unfinishedBefore(id).length;

/**
 * تصفير محطةٍ لإعادة التدريب: نجومُ عقدها إلى الصفر، فتعود جبهةُ الفتح إليها.
 *
 * وثلاثة قيود مقصودة: **سجلّ ليتنر لا يُمسّ** (ما قِيس من مهارات الطفل حقٌّ له،
 * وإعادةُ التدريب لا تمحو تاريخه — بند الحزمة)؛ و**نجومُ ما بعدها تبقى محفوظة**
 * (تُقفل حتى يتمّ المحطة، فإذا أتمّها عادت كما كانت — إعادةُ قفلٍ لا محو)؛
 * ودقائقُ الاستعمال والمراجعات ومددُ القراءات لا تُمسّ.
 * @returns {number} عدد العقد التي صُفِّرت
 */
export function clearSection(sectionId) {
  const section = journey().find((s) => s.id === sectionId);
  if (!section) return 0;
  let cleared = 0;
  for (const node of section.nodes) {
    if (!state.stars[node.id]) continue;
    delete state.stars[node.id];
    cleared++;
  }
  if (cleared) save();
  return cleared;
}

/** حصيلةُ محطةٍ (عقدُها والمنجَز منها ونجومُه) — لعرض أثر التصفير **قبل** وقوعه. */
export function sectionProgress(sectionId) {
  const section = journey().find((s) => s.id === sectionId);
  if (!section) return null;
  const done = section.nodes.filter((n) => getStars(n.id) > 0);
  return {
    nodes: section.nodes.length,
    done: done.length,
    stars: done.reduce((sum, n) => sum + getStars(n.id), 0),
  };
}

// ————— صلابة التخزين —————
//
// التقدّم في `localStorage`، والمتصفّح **يُخلي** تخزين المواقع حين يضيق القرص —
// وiOS أشدّها في ذلك — فيذهب تقدّم الطفل بلا فعلٍ من أحد. والوسمُ الدائم يستثنيه
// من الإخلاء. يُطلب عند بوابة وليّ الأمر (فعلُ بالغٍ لا فعلُ طفل)، و**رفضُه لا
// يعطّل شيئاً**: الجواب يُعرض على وليّ الأمر ليعرف أنّ النسخة الاحتياطية آكد.

const storageApi = () => (typeof navigator !== 'undefined' && navigator.storage) || null;

/** طلب التخزين الدائم. يردّ `true`/`false`، و`null` إن كان المتصفّح لا يعرفه. */
export async function askPersistence() {
  const api = storageApi();
  if (!api?.persist) return null;
  try {
    return await api.persist();
  } catch {
    return null;   // تصفّح خاص أو منعٌ من المستخدم: لا شيء ينكسر
  }
}

/** حال التخزين اليوم بلا طلبٍ جديد (للعرض في اللوحة). */
export async function persistedStorage() {
  const api = storageApi();
  if (!api?.persisted) return null;
  try {
    return await api.persisted();
  } catch {
    return null;
  }
}

/**
 * كم صوتاً على هذا الجهاز من كم (حزمة «خفّة التخزين»): `{stored, total}` أو `null`.
 *
 * موضعُها هنا لأنها أختُ `persistedStorage` لا أختُ `audio.js`: كلتاهما **قياسُ حال
 * التخزين على الجهاز** يُعرض لوليّ الأمر في سطرٍ واحد، ولا تشغّل صوتاً ولا تعرف مفتاحاً.
 *
 * **والقياس من المخزن نفسِه لا من تقريرٍ يكتبه عاملُ الخدمة**: خبرٌ عن نفسه قد يكذب
 * (يُكتب قبل أن يُخفق التخزين، أو يبقى بعد إخلاء المتصفّح للمخزون) — أما عدُّ مفاتيح
 * المخزن فهو الحاصلُ الآن. واسمُ المخزن يُلتمس بسابقته لا بحرفه، فلا ينكسر السطر إن
 * تغيّر اسمٌ في `sw.js` — والسابقة عقدٌ واحد بين الملفين.
 *
 * **وبيانا الصوت يُقرآن من المخزون لا من الشبكة** (`caches.match` لا `fetch`): عهدُ
 * «صفر طلبٍ شبكيّ في دورة التسجيل» (الحزمة ١٠) عهدٌ مطلق لا يُستثنى منه سطرُ عرضٍ —
 * وهذه اللوحةُ نفسُها تعرض تسجيلات الطفل. وهو أصحُّ أيضاً: العددُ يُقرأ دون إنترنت.
 * فإن لم يُخزَّن البيانان بعدُ (أولُ فتحةٍ قبل تمام التركيب) يسقط السطر ولا يكذب.
 */
export async function audioStored() {
  if (typeof caches === 'undefined') return null;
  try {
    const name = (await caches.keys()).find((n) => n.startsWith('uktub-audio'));
    if (!name) return null;
    const stored = new URL('../', import.meta.url);
    const read = async (path) => {
      const hit = await caches.match(new URL(path, stored));
      return hit ? hit.json() : null;
    };
    const [manifest, recitations] = await Promise.all([
      read('audio/manifest.json'), read('data/recitations.json'),
    ]);
    if (!manifest) return null;
    const total = Object.keys(manifest).length
      + Object.keys(recitations?.ayat || {}).length
      + Object.keys(recitations?.words || {}).length;
    if (!total) return null;
    const have = (await (await caches.open(name)).keys()).length;
    return { stored: Math.min(have, total), total };
  } catch {
    return null;      // متصفّح بلا Cache API أو تصفّح خاص: السطر يسقط ولا ينكسر شيء
  }
}

// ————— إدارة —————

export function snapshot() {
  return JSON.parse(JSON.stringify(state));
}

export function reset() {
  state = blank();
  // **وحالٌ فارغة تُوسَم ببنية اليوم** (الجلسة ١٠): جهازٌ مُحي ثم مشى في الرحلة لم
  // تتغيّر تحته بنيةٌ، فلا موضوعَ للترحيل الرحيم عند إقلاعه التالي — ولولا الوسمُ
  // لَجرى مرّةً وأعاد زرعَ ما صفّره وليُّ الأمر بعد المحو.
  migrateJourney();
  save();
}
