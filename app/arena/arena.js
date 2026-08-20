// ————— **ساحةُ الحصاد** (جلسة ص٣) — صفحةُ جمعٍ بتسميةٍ عمياء —————
//
// **العلّة رقمٌ لا رأي**: ميدانُنا كلُّه حتى اليوم **أربعَ عشرةَ كتابةً من طفلةٍ
// واحدة** (`FIELD_TRIAL §٥`)، وسماحاتُ المحرّك تُعايَر على هذا. **وأربعةٌ من عشرٍ
// وقعت فوق ٨٠٪ من حدّها العامل** (§٦) — فالهامشُ رفيعٌ حقّاً والمعايرةُ حاجةٌ مقيسة.
// فهذه صفحةٌ **خارج تطبيق الطفل** يفتحها متطوّعٌ فيكتب عشرَ كتابات، **يحكم هو
// عليها أوّلاً** ثم يُكشَف حكمُ المحرّك، ويخرج بملفٍّ يرسله بيده.
//
// 🔴 **وأخصُّ قيودها: التسميةُ العمياء** — لا سبيلَ إلى حكم المحرّك قبل حكم الإنسان،
// **لا في الشاشة ولا في ذاكرة الصفحة**. ولذلك **لا تُبنى هنا لوحةُ `penSurface`**
// وإن كانت جاهزة: لوحُ الطفل يحكم عند كلّ رفعِ قلم (`settleFree`) فيُبقي الحبرَ أو
// يُذهبه ويومض بالإرشاد — **وهو كشفٌ للحكم بالصورة قبل أن يُسأل الإنسان**. فالساحةُ
// تلتقط الأثر وحدَه، **و`judgeFree` لا تُنادى إلا في `reveal` وبعد أن يُملأ حكمُ
// الإنسان** (نداءٌ واحدٌ في هذا الملفّ كلِّه، يعدّه `tools/test_arena.mjs`).
//
// **والنموذجُ من مساره بعينه** (`refGlyph` من `pen.js`) — لا صورةَ ثانية للحرف،
// فما يراه المتطوّعُ في «شاهِدْ» هو ما يحكم به `judgeFree` بعد قليل.
//
// 🔒 **وهذا الملفُّ من حَملة مسار اليد**: لا يعرف الشبكةَ بنيوياً — ولا عنوانَ فيه
// أصلاً. **وبابُ الإرسال في `send.js` وحدَه** (سنّةُ `feedback.js`: العناوينُ لا
// تسكن ملفّاً يمرّ به أثرُ يد، فلا يُثقَب حارسُ الخصوصية باستثناء).

import { PATHS } from '../js/paths.js';
import {
  partsOf, boxOf, refGlyph, judgeFree, resolveTolerance, easeTolerance, FREE, MIN_STEP,
} from '../js/pen.js';
import { sendRow } from './send.js';

/* ═════════════ ١) العيّنةُ المرسومة — قيدُ العقد الثالث ═════════════ */

/** وسمُ الأشكال الأربعة التي بقيت دون عهد `child-drift` — **أوّلُ من نُشكّ فيه**. */
export const WATCH_TAG = 'no-drift-covenant';

/**
 * **العيّنةُ مرسومةٌ لا مصادَفة**: كلُّ شكلٍ فيها بعلّته المكتوبة بجانبه — فمَن قرأ
 * الملفَّ بعد شهرٍ عرف **لماذا** كُتب هذا الشكل بعينه.
 *
 * وتغطّي بنصّ القيد ٣: **الأشكالَ الموضعية الأربعة** · **وحروفاً منقوطة** بنقطةٍ
 * ونقطتين وثلاث (**وضربةُ النقطة تُحفَظ** — نقرةٌ لا تُطرَح) · **ومصائدَ ه/م/ط**
 * (حلقاتٌ مغلقة يلتبس فيها الاتجاه) **وس/ش** (أضيقُ أسرةٍ على هذا المحرّك: فجوةُ
 * ضلعَي السنّة دون سماحة الانحراف) · **والأسرَ الأربع** التي يفرّق بينها الرسمُ لا
 * النقطُ وحدَها · **والأربعةَ الموسومة** بأمر الإدارة.
 */
export const SAMPLE = Object.freeze([
  // — الأربعةُ الموسومة: بلا عهد `child-drift`، فمعدّلُ ردّها يُقرأ منفصلاً —
  { ch: 'س', form: 'initial', why: 'سنّتان ووصلة — بلا عهد رجفة', watch: WATCH_TAG },
  { ch: 'ش', form: 'initial', why: 'أختُها بثلاث نقاط — بلا عهد رجفة', watch: WATCH_TAG },
  { ch: 'ي', form: 'medial', why: 'سنّةٌ ونقطتان تحتها — بلا عهد رجفة', watch: WATCH_TAG },
  { ch: 'ع', form: 'medial', why: 'عينٌ وسطى مغلقة — بلا عهد رجفة', watch: WATCH_TAG },

  // — مصائدُ الحلقة المغلقة: ه · م · ط (يلتبس فيها الاتجاه والترتيب) —
  { ch: 'ه', form: 'isolated', why: 'حلقةٌ مغلقة — مصيدةُ اتجاه' },
  { ch: 'ه', form: 'medial', why: 'الهاءُ الوسطى — أضيقُ أشكال المنهج' },
  { ch: 'م', form: 'isolated', why: 'عينُ الميم وذيلُها — مصيدةُ ترتيب' },
  { ch: 'م', form: 'medial', why: 'ميمٌ وسطى بلا ذيل' },
  { ch: 'ط', form: 'isolated', why: 'جزآن: البدنُ ثم القائم — مصيدةُ ترتيب' },
  { ch: 'ط', form: 'medial', why: 'طاءٌ وسطى بجزأيها' },

  // — أسرةُ س/ش في مواقعها: الفرقُ نقاطٌ فوق رسمٍ واحد —
  { ch: 'س', form: 'medial', why: 'سنّتان بين حرفين' },
  { ch: 'ش', form: 'final', why: 'سينٌ نهائية بثلاث نقاط' },

  // — الأسرُ الأربع: ب ت ث · ج ح خ · ع غ · ص ض —
  { ch: 'ب', form: 'initial', why: 'أسرةُ السنّة — نقطةٌ تحت' },
  { ch: 'ت', form: 'medial', why: 'أسرةُ السنّة — نقطتان فوق' },
  { ch: 'ث', form: 'final', why: 'أسرةُ السنّة — ثلاثُ نقاط' },
  { ch: 'ج', form: 'initial', why: 'أسرةُ الجيم — نقطةٌ داخل' },
  { ch: 'ح', form: 'medial', why: 'أسرةُ الجيم — بلا نقطة' },
  { ch: 'خ', form: 'final', why: 'أسرةُ الجيم — نقطةٌ فوق' },
  { ch: 'ع', form: 'final', why: 'أسرةُ العين — ذيلٌ نازل' },
  { ch: 'غ', form: 'medial', why: 'أسرةُ العين — نقطةٌ فوق' },
  { ch: 'ص', form: 'final', why: 'أسرةُ الصاد — بلا نقطة' },
  { ch: 'ض', form: 'final', why: 'أسرةُ الصاد — نقطةٌ فوق' },

  // — وحروفٌ يكثر ورودُها في أوّل الكلام، ومنها ما نقطُه فوق ومنها ما نقطُه تحت —
  { ch: 'ن', form: 'isolated', why: 'كأسٌ ونقطة — بلاغُ الميدان ٢ وقع عليها' },
  { ch: 'ق', form: 'isolated', why: 'كأسٌ ونقطتان فوق' },
  { ch: 'ف', form: 'medial', why: 'فاءٌ وسطى بنقطتها' },
  { ch: 'ك', form: 'isolated', why: 'الكافُ وشولتُها — صيدُ الميدان الأول' },
  { ch: 'د', form: 'isolated', why: 'أصغرُ الحروف نصيباً من السطر (عهدُ النسبة)' },
  { ch: 'ر', form: 'final', why: 'راءٌ نازلة تحت السطر' },
  { ch: 'ل', form: 'medial', why: 'أطولُ عمودٍ موصول' },
  { ch: 'ي', form: 'isolated', why: 'ياءٌ معزولة بنقطتيها' },
]);

/** الأربعةُ الموسومة — تُقرأ من العيّنة لا تُكتب مرّتين. */
export const WATCHED = Object.freeze(SAMPLE.filter((s) => s.watch === WATCH_TAG));

/** الأسرُ الأربع التي تُطلَب في العيّنة — يقرؤها فاحصُ التغطية. */
export const FAMILIES = Object.freeze([['ب', 'ت', 'ث'], ['ج', 'ح', 'خ'], ['ع', 'غ'], ['ص', 'ض']]);

/** مصائدُ الحلقة والسنّة — بأعيانها كما نصّ القيد. */
export const TRAPS = Object.freeze(['ه', 'م', 'ط', 'س', 'ش']);

/** مسارُ شكلٍ من العيّنة — من `paths.js` بعينه (لا نسخةَ ثانيةَ للحروف هنا). */
export const refOf = (ch, form) => PATHS[ch]?.[form] || null;

/**
 * **ما ينقص عيّنةً حتى تفي بالقيد ٣** — قائمةُ نقصٍ تُقرأ، وفارغةٌ تعني الوفاء.
 * (يُجرَّب سالباً بعيّنةٍ منقوصة في `tools/test_arena.mjs`.)
 */
export function sampleGaps(pool = SAMPLE) {
  const gaps = [];
  const has = (fn) => pool.some(fn);
  const dots = (s) => refOf(s.ch, s.form)?.dots?.length || 0;

  for (const form of ['isolated', 'initial', 'medial', 'final']) {
    if (!has((s) => s.form === form)) gaps.push(`شكلُ الموقع «${form}» غائب`);
  }
  if (!has((s) => dots(s) === 1)) gaps.push('لا شكلَ بنقطةٍ واحدة');
  if (!has((s) => dots(s) === 2)) gaps.push('لا شكلَ بنقطتين');
  if (!has((s) => dots(s) === 3)) gaps.push('لا شكلَ بثلاث نقاط');
  for (const ch of TRAPS) {
    if (!has((s) => s.ch === ch)) gaps.push(`مصيدةُ «${ch}» غائبة`);
  }
  for (const family of FAMILIES) {
    const seen = family.filter((ch) => has((s) => s.ch === ch));
    if (seen.length < 2) gaps.push(`أسرةُ «${family.join('')}» دون عضوين`);
  }
  for (const one of WATCHED) {
    if (!has((s) => s.ch === one.ch && s.form === one.form && s.watch === WATCH_TAG)) {
      gaps.push(`الموسومُ «${one.ch}/${one.form}» غائبٌ أو بلا وسم`);
    }
  }
  if (!has((s) => (refOf(s.ch, s.form)?.strokes?.length || 0) > 1)) {
    gaps.push('لا شكلَ بجزأين — وترتيبُ الأجزاء نصفُ ما نقيس');
  }
  return gaps;
}

/* ═════════════ ٢) الجلسة: عشرُ محاولات، وقسمةٌ تُوسَم عند الوصول ═════════════ */

/** جلسةٌ ~١٠ محاولات — القيد ٦، ورقمٌ واحدٌ يُقرأ من موضعٍ واحد. */
export const SESSION_SIZE = 10;

export const SPLIT = Object.freeze({ CALIBRATE: 'calibrate', VERIFY: 'verify' });

/**
 * **القسمةُ المعلنة ٧٠/٣٠** (القيد ٨): ثلاثُ خاناتٍ من كلّ عشر للتحقّق —
 * **موزّعةٌ لا في الذيل** فلا تقع حصّةُ التحقّق كلُّها على آخر الجلسة حيث يملّ الكاتب.
 *
 * 🔴 **وتُوسَم عند الوصول لا بعد النظر**: هذه دالّةُ **موضعٍ** لا غير — لا تعرف
 * أثراً ولا حكماً ولا مَن كتب. فما وُسم بالتحقّق وُسم قبل أن تنزل اليد.
 */
export const VERIFY_SLOTS = Object.freeze([2, 5, 9]);
export const splitAt = (index) => (VERIFY_SLOTS.includes(index % SESSION_SIZE)
  ? SPLIT.VERIFY : SPLIT.CALIBRATE);

/**
 * خطّةُ جلسةِ متناوبٍ واحد: **الأربعةُ الموسومة دائماً** (أوّلُ من نشكّ فيه)
 * وستٌّ تدور بدور المتناوبين — **فجهازٌ يتناوب عليه عشرون طفلاً يغطّي العيّنةَ
 * كلَّها** ولا يُعيد الستَّ نفسَها عشرين مرّة. ثم يُدار الترتيبُ بدور الجلسة كذلك،
 * فلا يقع الموسومُ في خانة القسمة نفسِها عند كلّ متناوب.
 */
export function planFor(session = 0) {
  const rest = SAMPLE.filter((s) => s.watch !== WATCH_TAG);
  const take = Math.max(0, SESSION_SIZE - WATCHED.length);
  const at = ((session * take) % rest.length + rest.length) % rest.length;
  const rolled = [...rest.slice(at), ...rest.slice(0, at)].slice(0, take);
  const shapes = [...WATCHED, ...rolled];
  const turn = ((session % shapes.length) + shapes.length) % shapes.length;
  return [...shapes.slice(turn), ...shapes.slice(0, turn)]
    .map((s, index) => ({ ...s, index, split: splitAt(index) }));
}

/* ═════════════ ٣) الحكمان: الإنسانُ أوّلاً — وهذا أخصُّ حارسٍ هنا ═════════════ */

/**
 * **زرّا حكم الإنسان بترتيبٍ ثابت لا يُقلَب** (القيد ٢): «صحيحة» أوّلاً أبداً —
 * فلو قُلب الترتيبُ بين محاولةٍ وأخرى لصارت نقرةُ العادة حكماً، والتسميةُ حينئذٍ
 * ضوضاءُ إبهامٍ لا حكمَ عين. مجمَّدٌ (`Object.freeze`) ويقيس الحارسُ ثباتَه.
 */
export const ASK = Object.freeze([
  Object.freeze({ human: 'right', label: 'نَعَمْ، صَحِيحَة', tone: 'yes' }),
  Object.freeze({ human: 'wrong', label: 'لَا، غَيْرُ صَحِيحَة', tone: 'no' }),
]);

/** محاولةٌ جديدة — **بلا حكمٍ لأحد**: حقلا الحكمين فارغان حتى يُملآ بترتيبهما. */
export function makeAttempt(slot) {
  return {
    ch: slot.ch, form: slot.form, index: slot.index, split: slot.split,
    watch: slot.watch || null,
    strokes: [], pointer: null,
    human: null,      // يُملأ أوّلاً — بيد الإنسان
    engine: null,     // ولا يُملأ إلا بعده — في `reveal` وحدَها
  };
}

/** حكمُ الإنسان — ولا يُقبل إلا من الزرّين المعلنين، ولا يُبدَّل بعد وقوعه. */
export function answer(attempt, human) {
  if (!attempt || attempt.human) return null;
  if (!ASK.some((one) => one.human === human)) return null;
  attempt.human = human;
  return attempt;
}

/**
 * 🔴 **كشفُ حكم المحرّك — ولا سبيلَ إليه قبل حكم الإنسان.**
 *
 * تُردّ `null` إن لم يُحكم بعد **ويبقى `attempt.engine` فارغاً**: فلا يوجد الحكمُ
 * في ذاكرة الصفحة أصلاً قبل أوانه، لا أنه يوجد ويُخفى. **ومجرَّبٌ سالباً**: يُنادى
 * الكشفُ قبل الحكم فيُردّ فارغاً ويبقى الحقلُ فارغاً (`test_arena §٢`).
 *
 * **وهذا النداءُ الوحيد لـ`judgeFree` في هذا الملفّ** — يعدّه الحارسُ نصّاً.
 */
export function reveal(attempt, ref = refOf(attempt?.ch, attempt?.form)) {
  if (!attempt || !attempt.human || !ref) return null;
  if (attempt.engine) return attempt.engine;
  const verdict = judgeFree(ref, attempt.strokes);
  const m = verdict.metrics || {};
  attempt.engine = {
    accepted: Boolean(verdict.accepted),
    primary: verdict.primary || verdict.size || null,
    codes: verdict.codes || [],
    metrics: {
      maxLateral: round1(m.maxLateral), maxBack: round1(m.maxBack),
      coverage: round1((m.coverage || 0) * 100), startDist: round1(m.startDist),
    },
  };
  return attempt.engine;
}

/** أوافقَ حكمُ الإنسانِ المحرّكَ؟ — تُقرأ بعد الكشف وحدَه. */
export const agreed = (attempt) => Boolean(attempt?.engine)
  && attempt.engine.accepted === (attempt.human === 'right');

const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;

/**
 * 🔴 **الحدُّ العامل — يُطلَب من الدالّة التي تحكم به، لا يُقرأ من ثابت** (عهدُ
 * `CLAUDE.md`: «الحدُّ العامل لا الثابتُ المكتوب»، وعطبُ السجلّ في `FIELD_TRIAL §٦`
 * حيث سُجّل ٩٠ وحُكم بـ١٤٤): `judgeFree` تبني سماحتَها هكذا بعينه —
 * `easeTolerance(resolveTolerance(ref.tolerance))` — فهذه هي هي لا صورةٌ عنها.
 */
export const limitOf = (ref) => easeTolerance(resolveTolerance(ref?.tolerance));
export const baseOf = (ref) => resolveTolerance(ref?.tolerance);

/** كم لمسةً ينتظرها الشكل: جسمٌ لكلّ ضربة، ونقرةٌ لكلّ نقطة (بعددها). */
export const touchesFor = (ref) => partsOf(ref)
  .reduce((n, part) => n + (part.kind === 'dot' ? (part.count || 1) : 1), 0);

/* ═════════════ ٤) السطرُ الذي يُكتب في الملفّ ═════════════ */

/**
 * سطرُ المحاولة كما يدخل الملفّ — **حكمُ الإنسان وحكمُ المحرّك و`metrics` والحدُّ
 * العامل والأداةُ والفئةُ ونطاقُ العمر واليدُ والجهاز** (القيد ٤)، **بلا اسمٍ ولا
 * معرِّف**: `session` رقمٌ متسلسل في الملفّ لا يدلّ على أحدٍ خارجه.
 *
 * **و`eye` حكمُ الإنسان بعينه** — وهو الذي يقرؤه `import_traces` منتظَراً (القيد ٧):
 * فما حكم الإنسانُ بصحّته يُنتظَر قبولُه، وما حكم بخطئه يُنتظَر ردُّه — سواءٌ وافق
 * المحرّكُ أم خالف. **فالمنتظَرُ حكمُ الإنسان دائماً، بنيةً لا اتفاقاً.**
 */
export function itemOf(attempt, who = {}, device = deviceOf()) {
  const ref = refOf(attempt.ch, attempt.form);
  const base = baseOf(ref);
  const work = limitOf(ref);
  const engine = attempt.engine || {};
  return {
    ch: attempt.ch,
    form: attempt.form,
    mode: 'free',
    kind: engine.accepted ? 'done' : 'fault',
    accepted: Boolean(engine.accepted),
    code: engine.primary || null,
    codes: engine.codes || [],
    metrics: engine.metrics || null,
    maxLateral: engine.metrics ? engine.metrics.maxLateral : null,
    coverage: engine.metrics ? Math.round(engine.metrics.coverage) : null,
    lateral: round1(base.lateral),
    limit: round1(work.lateral),
    ease: FREE.ease,
    coverLimit: round1(work.coverage * 100),
    human: attempt.human,
    eye: attempt.human === 'right' ? 'accept' : 'reject',
    agree: agreed(attempt),
    split: attempt.split,
    watch: attempt.watch || null,
    session: who.session ?? 0,
    who: who.kind || null,
    age: who.age || null,
    tool: who.tool || null,
    hand: who.hand || null,
    pointer: attempt.pointer || null,
    consent: who.consent === true,
    device,
    strokes: attempt.strokes,
  };
}

/** وصفُ الجهاز — مقاسٌ ونقطةٌ ولمس، **ولا بصمةَ متصفّحٍ ولا نظامَ تشغيل**. */
export function deviceOf(view = globalThis) {
  return {
    w: Math.round(view?.screen?.width || 0),
    h: Math.round(view?.screen?.height || 0),
    dpr: round1(view?.devicePixelRatio || 1),
    touch: Boolean(view?.navigator && 'maxTouchPoints' in view.navigator
      ? view.navigator.maxTouchPoints > 0 : false),
  };
}

/* ═════════════ ٥) المخزن: على جهاز المشارك، ثم ملفٌّ بيده، ثم يُمحى ═════════════ */

const KEY = 'uktub.arena.v1';

/** دفترُ الساحة — **ومخزنٌ لا يُقرأ لا يُسقِط شيئاً**: الصفحةُ تعمل بلا مخزن. */
export function arenaBook() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    const book = raw ? JSON.parse(raw) : null;
    if (book && typeof book === 'object') {
      return {
        session: Number(book.session) || 0,
        items: Array.isArray(book.items) ? book.items : [],
      };
    }
  } catch { /* مخزنٌ ممتلئ أو نصٌّ فاسد: يُقرأ دفتراً خالياً */ }
  return { session: 0, items: [] };
}

function writeBook(book) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(book));
  } catch { /* لا مخزن: الجلسةُ تعيش في الذاكرة ولا تسقط الصفحة */ }
  return book;
}

/**
 * **سقفُ الدفتر**: مئتان وخمسون أثراً — سبيلُ المئات جهازٌ يتناوب عليه عشرون،
 * والأثرُ ≈٥ كيلوبايت فالمئتان ≈١٫٢ ميغابايت. فلا يمتلئ مخزنُ جهازٍ بقياسٍ منسيّ.
 */
export const ARENA_MAX = 250;

/**
 * تقييدُ محاولةٍ — **ويُردّ صفراً بلا إذنِ وليٍّ إن كان الكاتبُ طفلاً** (القيد ٥):
 * شرطٌ بنيويّ يُجرَّب في `node` بلا متصفّح، لا سؤالٌ في الواجهة يُتخطّى.
 *
 * @returns {number} عددُ ما في الدفتر بعدها (وصفرٌ يعني: لم يُسجَّل)
 */
export function arenaRecord(item) {
  if (!item || !Array.isArray(item.strokes) || !item.strokes.length) return 0;
  if (!item.human) return 0;                       // لا يُقيَّد أثرٌ بلا حكم إنسان
  if (item.who === 'child' && item.consent !== true) return 0;
  const book = arenaBook();
  book.items = [...book.items, item].slice(-ARENA_MAX);
  return writeBook(book).items.length;
}

/** متناوبٌ جديد على الجهاز نفسِه: رقمُ جلسةٍ عابر — **رقمٌ لا اسم**. */
export function nextSession() {
  const book = arenaBook();
  book.session = (book.session || 0) + 1;
  writeBook(book);
  return book.session;
}

/** المحوُ — بيد المشارك بعد الحفظ، وهو الطريقُ الوحيد لذهاب ما على الجهاز. */
export function arenaClear() {
  return writeBook({ session: 0, items: [] });
}

/**
 * نصُّ الملفّ الذي يحفظه المشارك — **بلا اسمٍ ولا بريدٍ ولا معرِّفِ جهاز**.
 *
 * 🔴 **و`frame: "line"` ليس زينة**: مستورِدُ العدّة ينقل آثارَ الأجهزة القديمة من
 * شبكة الألف إلى خليّة السطر (`seatStrokes`)، ودفترٌ لا يعلن إطارَه **يُنقَل مرّةً
 * ثانية** فيُقاس إلى نموذجٍ ليس مكانه. وآثارُ هذه الساحة على خليّة السطر أصلاً.
 */
export function arenaText(book = arenaBook()) {
  return `${JSON.stringify({
    what: 'كتاباتُ ساحة الحصاد في «اُكْتُبْ» — أثرُ يدٍ وحكمُ صاحبها، لا أكثر',
    origin: 'field',
    from: 'arena',
    frame: 'line',
    note: 'تدخل عدّةَ المعايرة بـ tools/import_traces.mjs — والمنتظَرُ فيها حكمُ الإنسان (eye)',
    items: book.items,
  }, null, 1)}\n`;
}

/** اسمُ الملفّ — بيومه، فلا يُكتب ملفٌّ فوق ملف. */
export const arenaName = () => `uktub-arena-${new Date().toISOString().slice(0, 10)}.json`;

/* ═════════════ ٦) الشاشة — خطوةٌ واحدةٌ في الشاشة الواحدة ═════════════ */

const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.append(text);
  return node;
};

const btn = (label, cls, act) => {
  const node = el('button', `arena-btn ${cls || ''}`.trim());
  node.type = 'button';
  node.append(label);
  node.addEventListener('click', act);
  return node;
};

/** سطرُ العدّاد: «٣ من ١٠» — ظاهرٌ دائماً فيعرف أين هو ومتى ينتهي. */
const AR = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
export const arNum = (n) => String(n).replace(/\d/g, (d) => AR[+d]);

/**
 * **لوحُ الساحة**: نموذجٌ يُرسَم ثم يغيب، وحبرٌ يُلتقَط — **ولا حَكَمَ فيه**.
 * (وهو الفرقُ عن `penSurface`: ذاك يحكم عند كلّ رفعِ قلمٍ فيكشف بالصورة.)
 */
function makeBoard(ref) {
  const [bw, bh] = boxOf(ref);
  const box = el('div', 'arena-board');
  const model = refGlyph(ref, 'arena-model');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'arena-ink');
  svg.setAttribute('viewBox', `0 0 ${bw} ${bh}`);
  // **وسُمكُ الحبر نسبةٌ من اللوح** (بلاغُ ميدانٍ من المالك، ١٩ أغسطس ٢٠٢٦): رقمٌ
  // مطلقٌ كُتب يومَ كانت الشبكةُ ١٠٠٠ يرقّ إلى الثلث يومَ صارت الخليّةُ ٢١٦٣٫٥.
  box.style.setProperty('--ink-scale', String(Math.max(bw, bh) / 1000));
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'لوحُ الكتابة — اكتب هنا بإصبعك أو بقلمك');
  box.append(model, svg);

  const strokes = [];
  let points = [];
  let path = null;
  let active = null;
  let rect = null;
  let sawPen = false;
  let onLift = null;
  let live = false;
  let pointer = null;

  /**
   * حبرُ اللمسة نصّاً — **والنقرةُ تُرى**: لمسةٌ بنقطةٍ واحدة (نقطةُ الحرف) مسارُها
   * `M` وحدَه فلا يرسم المتصفّحُ منها شيئاً، فيظنّ الكاتبُ أنّ نقرتَه لم تُقبَل
   * ويعيدها. فتُغلَق بـ`L` على موضعها فتظهر نقطةً بغِلَظ القلم — **وهذا رسمٌ لا
   * تسجيل**: المسجَّلُ يبقى نقطةً واحدة كما تدخل العدّة.
   */
  const dOf = (pts) => {
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    return pts.length === 1 ? `${d} L${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}` : d;
  };
  const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  /** إحداثيُّ الإصبع على شبكة المادّة — بحساب `pen.js` نفسِه (توسيطٌ ومقياسٌ واحد). */
  const toGrid = (event) => {
    const unit = Math.min(rect.width / bw, rect.height / bh) || 1;
    const ox = rect.left + (rect.width - bw * unit) / 2;
    const oy = rect.top + (rect.height - bh * unit) / 2;
    return [(event.clientX - ox) / unit, (event.clientY - oy) / unit];
  };

  function down(event) {
    if (!live || active !== null) return;
    if (event.pointerType === 'pen') sawPen = true;
    else if (event.pointerType === 'touch' && sawPen) return;   // كفٌّ على الشاشة والقلمُ يكتب
    pointer = pointer || event.pointerType || null;
    active = event.pointerId;
    rect = svg.getBoundingClientRect();
    event.preventDefault();
    try { svg.setPointerCapture(event.pointerId); } catch { /* مؤشّرٌ لا يقبل الأسر */ }
    points = [toGrid(event)];
    path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'arena-line');
    path.setAttribute('d', dOf(points));
    svg.append(path);
    listen(true);
  }

  function move(event) {
    if (event.pointerId !== active) return;
    const batch = typeof event.getCoalescedEvents === 'function'
      ? event.getCoalescedEvents() : [event];
    for (const one of batch.length ? batch : [event]) {
      const p = toGrid(one);
      // خطوةٌ صغرى كخطوة المحرّك — فالأثرُ الذي يُحكَم عليه بكثافة أثر اللوح نفسِه
      if (near(points[points.length - 1], p) < MIN_STEP) continue;
      points.push(p);
    }
    path.setAttribute('d', dOf(points));
  }

  function up(event) {
    if (event.pointerId !== active) return;
    active = null;
    listen(false);
    // **وموضعُ رفع القلم يُقرأ ولا يُطرَح** (سنّةُ `pen.js`): مرشِّحُ الخطوة الصغرى
    // يبلع آخرَ ما مشاه القلم، فتُقرأ تغطيةٌ أنقصُ ممّا مشى.
    const end = toGrid(event);
    if (points.length && near(points[points.length - 1], end) > 0) points.push(end);
    path.setAttribute('d', dOf(points));
    strokes.push(points.map((p) => [round1(p[0]), round1(p[1])]));
    points = [];
    path = null;
    onLift?.(strokes.length);
  }

  function listen(on) {
    const how = on ? window.addEventListener : window.removeEventListener;
    how.call(window, 'pointermove', move);
    how.call(window, 'pointerup', up);
    how.call(window, 'pointercancel', up);
  }

  svg.addEventListener('pointerdown', down);

  /** «شاهِدْ»: النموذجُ يُرسَم كما يُكتب — من مساره بعينه، ثم يغيب. */
  function play() {
    const shapes = [...model.querySelectorAll('path')];
    const dots = [...model.querySelectorAll('circle')];
    model.classList.remove('is-gone');
    for (const dot of dots) dot.classList.remove('is-on');
    for (const shape of shapes) {
      const len = shape.getTotalLength();
      shape.style.strokeDasharray = `${len}`;
      shape.style.strokeDashoffset = `${len}`;
    }
    const SPEED = 1500;                // وحدةَ خليّةٍ في الثانية — يدٌ تكتب لا تمرّ
    const span = shapes.reduce((sum, one) => sum + one.getTotalLength(), 0) / SPEED;
    return new Promise((done) => {
      let over = false;
      /**
       * **ولا تعلَق الشاشةُ على إطارٍ لا يأتي**: `requestAnimationFrame` يتوقّف في
       * التبويب الخلفيّ — فمَن غادر التبويبَ لحظةَ العرض ثم عاد كان يجد «شاهِدْ»
       * أبداً ولا يُدعى إلى الكتابة. فمهلةٌ من طول العرض نفسِه تُتمّه وتفتح اللوح.
       */
      const finish = () => {
        if (over) return;
        over = true;
        for (const shape of shapes) shape.style.strokeDashoffset = '0';
        for (const dot of dots) dot.classList.add('is-on');
        done();
      };
      const guard = setTimeout(finish, (span + 1.2) * 1000);
      let at = 0;
      let started = 0;
      const step = (now) => {
        if (over) return;
        if (!started) started = now;
        const shape = shapes[at];
        if (!shape) {
          for (const dot of dots) dot.classList.add('is-on');
          clearTimeout(guard);
          setTimeout(finish, 220);
          return;
        }
        const len = shape.getTotalLength();
        const walked = Math.min(len, ((now - started) / 1000) * SPEED);
        shape.style.strokeDashoffset = `${len - walked}`;
        if (walked >= len) { at += 1; started = 0; }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  return {
    el: box,
    get strokes() { return strokes; },
    get pointer() { return pointer; },
    play,
    hideModel() { model.classList.add('is-gone'); },
    showModel() { model.classList.remove('is-gone'); },
    open(on) { live = on; box.classList.toggle('is-live', on); },
    onLift(fn) { onLift = fn; },
    clear() {
      strokes.length = 0;
      points = [];
      path = null;
      [...svg.querySelectorAll('path')].forEach((one) => one.remove());
    },
    destroy() { listen(false); active = null; live = false; },
  };
}

/* ————— شاشةُ البدء: ثلاثةُ أسئلةٍ لا أكثر ————— */

const AGES = Object.freeze({
  child: ['٤–٥', '٦–٧', '٨–٩', '١٠+'],
  adult: ['١٨–٢٥', '٢٦–٤٠', '٤١+'],
});

function ask(title, options, pick) {
  const wrap = el('div', 'arena-ask');
  wrap.append(el('h2', 'arena-ask__title', title));
  const row = el('div', 'arena-row');
  const buttons = options.map(([value, label]) => {
    const one = btn(label, 'arena-btn--pick', () => {
      for (const other of buttons) other.classList.remove('is-on');
      one.classList.add('is-on');
      pick(value);
    });
    one.dataset.value = value;
    return one;
  });
  row.append(...buttons);
  wrap.append(row);
  return wrap;
}

function introScreen(start) {
  const who = { kind: null, age: null, tool: 'finger', hand: 'right', consent: false };
  const screen = el('section', 'arena-screen arena-screen--intro');

  screen.append(el('h1', 'arena-title', 'سَاحَةُ الحَصَاد'));
  screen.append(el('p', 'arena-lede',
    'اكتب عشرَ كتابات في ثلاث دقائق — كتابتُك تُعلّم محرّكَ «اُكْتُبْ» '
    + 'أن يفرّق بين خطأٍ حقيقيّ وخطٍّ صحيحٍ كتبه طفل. لا حسابَ ولا اسمَ ولا بريد.'));

  const ageBox = el('div', 'arena-ask__slot');
  const consentBox = el('div', 'arena-ask__slot');
  const go = btn('ابْدَأْ', 'arena-btn--go', () => start(who));
  go.disabled = true;

  const ready = () => {
    go.disabled = !(who.kind && who.age && (who.kind !== 'child' || who.consent));
  };

  const consentLine = () => {
    const line = el('label', 'arena-consent');
    const mark = document.createElement('input');
    mark.type = 'checkbox';
    mark.className = 'arena-consent__mark';
    mark.addEventListener('change', () => { who.consent = mark.checked; ready(); });
    line.append(mark, el('span', '', 'أنا وليُّ أمره، وآذَنُ بحفظ كتاباته في هذا الجهاز '
      + 'وإرسالِها بيدي — بلا اسمٍ ولا صورة.'));
    return line;
  };

  screen.append(ask('مَن يكتب؟', [['child', 'طِفْل'], ['adult', 'بَالِغ']], (kind) => {
    who.kind = kind;
    who.age = null;
    who.consent = false;
    ageBox.replaceChildren(ask('كم عمرُه؟', AGES[kind].map((a) => [a, a]), (age) => {
      who.age = age;
      ready();
    }));
    consentBox.replaceChildren(...(kind === 'child' ? [consentLine()] : []));
    ready();
  }));
  screen.append(ageBox);
  screen.append(ask('بأيّ شيء يكتب؟', [['finger', 'بِإِصْبَعِهْ'], ['pen', 'بِقَلَمْ']], (tool) => {
    who.tool = tool;
  }));
  screen.append(ask('بأيّ يد؟', [['right', 'اليُمْنَى'], ['left', 'اليُسْرَى']], (hand) => {
    who.hand = hand;
  }));
  screen.append(consentBox);
  screen.append(go);
  screen.append(el('p', 'arena-fine',
    'ما يُكتب هنا يبقى على هذا الجهاز — لا يُرفَع إلى أحدٍ ولا يُرسَل تلقائياً. '
    + 'وفي آخر الجلسة تحفظه ملفّاً وترسله بيدك إن شئت، ثم تمحوه بزرّ.'));

  // الافتراضُ المعلَن: الإصبعُ واليدُ اليمنى (ق٤ — والإصبعُ الافتراض)
  screen.querySelectorAll('.arena-ask').forEach((one) => {
    const on = one.querySelector('[data-value="finger"], [data-value="right"]');
    if (on && !one.querySelector('.is-on')) on.classList.add('is-on');
  });
  return screen;
}

/* ————— شاشةُ الجولة: شاهِدْ ← اكتب ← احكم ← يُكشَف ————— */

function roundScreen(state, done) {
  const screen = el('section', 'arena-screen arena-screen--round');
  const slot = state.plan[state.at];
  const ref = refOf(slot.ch, slot.form);
  const attempt = makeAttempt(slot);

  const head = el('div', 'arena-head');
  head.append(el('span', 'arena-count', `${arNum(state.at + 1)} من ${arNum(SESSION_SIZE)}`));
  head.append(el('span', 'arena-brand', 'اُكْتُبْ'));

  const say = el('p', 'arena-say', 'شاهِدْ كيف يُكتب…');
  const stage = el('div', 'arena-stage');
  const board = makeBoard(ref);
  // **الشكلُ المعروض يُعلَن في الشجرة** (`data-shape`): بنيةُ المادّة لا حكمُ المحرّك
  // عليها — وبها يمشي مشهدُ المتصفّح يدَ الكاتب على المسار نفسِه.
  board.el.dataset.shape = `${slot.ch}/${slot.form}`;
  stage.append(board.el);
  const bar = el('div', 'arena-bar');
  screen.append(head, say, stage, bar);

  const wait = touchesFor(ref);
  let idle = 0;

  const toAsk = () => {
    clearTimeout(idle);
    board.open(false);
    if (!board.strokes.length) return;
    attempt.strokes = board.strokes.map((s) => s.map((p) => [p[0], p[1]]));
    attempt.pointer = board.pointer;
    say.textContent = 'أَكَتَبْتَهَا صَحِيحَة؟';
    // 🔴 **الترتيبُ من `ASK` بعينه ولا يُقلَب** — والحكمُ يُملأ قبل أن يُكشَف شيء.
    bar.replaceChildren(...ASK.map((one) => btn(one.label, `arena-btn--${one.tone}`, () => {
      answer(attempt, one.human);
      toReveal();
    })));
  };

  const toReveal = () => {
    const engine = reveal(attempt, ref);
    board.showModel();
    const same = agreed(attempt);
    say.textContent = same ? 'اتَّفَقْنَا 👍' : 'اخْتَلَفْنَا — وهذا أنفعُ لنا';
    const note = el('p', 'arena-note', same
      ? 'رأى المحرّكُ ما رأيتَ. وهذا الخطُّ الرماديُّ نموذجُنا.'
      : (attempt.human === 'right'
        ? 'أنتَ تراها صحيحة والمحرّكُ ردَّها — وهذه بالذات ما نجمعها لنصلحه.'
        : 'أنتَ تراها غيرَ صحيحة والمحرّكُ قبلها — وهذه تُشدّده حيث تساهل.'));
    const count = arenaRecord(itemOf({ ...attempt, engine }, state.who));
    state.saved = count;
    bar.replaceChildren(note, btn(state.at + 1 < SESSION_SIZE ? 'التَّالِي ←' : 'انْتَهَيْنَا ←',
      'arena-btn--go', () => done()));
  };

  const toWrite = () => {
    board.hideModel();
    board.open(true);
    say.textContent = 'اكْتُبْهَا هُنَا';
    bar.replaceChildren(
      btn('شاهِدْ ثانِيَةً', 'arena-btn--ghost', () => { board.clear(); watch(); }),
      btn('امْسَحْ وأَعِدْ', 'arena-btn--ghost', () => { board.clear(); }),
    );
    board.onLift((n) => {
      clearTimeout(idle);
      // **متى تُعَدّ الكتابةُ تامّة؟** ببلوغ لمسات الشكل (جسمٌ لكلّ ضربة ونقرةٌ لكلّ
      // نقطة)، **أو بهدوء اليد ثانيتين ونصفاً** — فمن كتبها بضرباتٍ أقلّ لا يقف.
      // وليس في هذا كشفٌ: عددُ الأجزاء بنيةُ الشكل لا حكمُ المحرّك عليه.
      idle = setTimeout(toAsk, n >= wait ? 260 : 2500);
    });
  };

  const watch = () => {
    board.open(false);
    board.showModel();
    say.textContent = 'شاهِدْ كيف يُكتب…';
    bar.replaceChildren();
    board.play().then(toWrite);
  };

  watch();
  screen.addEventListener('arena:leave', () => board.destroy());
  return screen;
}

/* ————— شاشةُ الختام: احفظ، ثم ثلاثُ خطوات، ثم أرسِلْ بيدك ————— */

function step(n, title, art) {
  const card = el('div', 'arena-step');
  card.append(el('span', 'arena-step__n', arNum(n)));
  card.append(art);
  card.append(el('span', 'arena-step__t', title));
  return card;
}

const artSvg = (d, extra) => {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'arena-step__art');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', d);
  svg.append(path);
  if (extra) {
    const more = document.createElementNS(ns, 'path');
    more.setAttribute('d', extra);
    more.setAttribute('class', 'arena-step__art--fill');
    svg.append(more);
  }
  return svg;
};

function doneScreen(state, again) {
  const screen = el('section', 'arena-screen arena-screen--done');
  const book = arenaBook();
  screen.append(el('h1', 'arena-title', 'شُكْراً لَكْ'));
  screen.append(el('p', 'arena-lede',
    `بهذه ${arNum(Math.min(state.at, SESSION_SIZE))} كتاباتٍ تُعايَر يدُ طفلك محرّكاً `
    + 'يستعمله آلافٌ غيرُك — فيتعلّم متى يقول «أعِدْ» ومتى يسكت.'));
  screen.append(el('p', 'arena-count arena-count--big',
    `على هذا الجهاز الآن ${arNum(book.items.length)} كتابة`));

  const say = el('p', 'arena-note', '');
  const wipe = btn('امْحُ ما عَلَى الجِهَاز', 'arena-btn--ghost', () => {
    arenaClear();
    say.textContent = 'مُحِيَ كلُّ شيء من هذا الجهاز.';
    wipe.disabled = true;
  });
  wipe.disabled = true;

  const save = btn('⤓ احْفَظِ المِلَفّ', 'arena-btn--go', () => {
    const blob = new Blob([arenaText()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = el('a');
    link.href = url;
    link.download = arenaName();
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 20000);
    say.textContent = `حُفظ الملفُّ باسم ${arenaName()} — ابحث عنه في «التنزيلات».`;
    wipe.disabled = false;
  });
  screen.append(save);

  const steps = el('div', 'arena-steps');
  steps.append(
    step(1, 'احفظِ الملفَّ بالزرّ فوق', artSvg('M24 8v22M14 24l10 10 10-10M8 40h32')),
    step(2, 'افتح واتساب أو البريد بالزرّ تحت', artSvg('M8 10h32v22H22l-10 8v-8H8z')),
    step(3, 'أرفِقِ الملفَّ بيدك وأرسِلْ', artSvg('M30 14L16 28a6 6 0 008 8l14-14a10 10 0 00-14-14L10 22')),
  );
  screen.append(steps);
  screen.append(sendRow());
  screen.append(say);
  screen.append(el('p', 'arena-fine',
    'لا يُرفَع الملفُّ من هنا إلى أحد — أنت ترفقه بيدك وترى ما فيه قبل إرساله.'));

  const row = el('div', 'arena-row');
  row.append(btn('متناوِبٌ جَدِيد', 'arena-btn--pick', () => again()), wipe);
  screen.append(row);
  return screen;
}

/* ————— السَّوق: شاشةٌ واحدة في كل لحظة ————— */

export function startArena(root = document.getElementById('arena')) {
  if (!root) return null;
  const state = { who: null, plan: [], at: 0, saved: 0 };

  const show = (screen) => {
    for (const old of [...root.children]) old.dispatchEvent(new CustomEvent('arena:leave'));
    root.replaceChildren(screen);
    root.scrollTop = 0;
  };

  const round = () => {
    if (state.at >= SESSION_SIZE) { show(doneScreen(state, intro)); return; }
    show(roundScreen(state, () => { state.at += 1; round(); }));
  };

  const intro = () => show(introScreen((who) => {
    state.who = { ...who, session: nextSession() };
    state.plan = planFor(state.who.session);
    state.at = 0;
    round();
  }));

  intro();
  return state;
}
