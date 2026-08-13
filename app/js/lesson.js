// شاشةُ **الدرس الكاتب** — حلقةُ `METHOD.md §٥` بخطواتها الأربع:
//   ١) **شاهِدْ**: الرسمُ المتحرك **من المسار المرجعي نفسِه**، ومعه اسمُ الحرف بصوت
//      بنك «اِقْرَأْ» (`METHOD.md §٧`) — فيُسمَع الاسمُ الذي تعلّمه الطفلُ قارئاً.
//   ٢) **تتبّعْ موجَّهاً**: المسارُ ظاهرٌ كاملاً، نقطةُ البداية تومض، سهمُ اتجاه.
//   ٣) **تتبّعْ خافتاً**: المسارُ يخفت، والاعتمادُ على الذاكرة الحركية يزيد.
//   ٤) **اكتُبْهُ وحدَك**: صندوقٌ فارغ — والحكمُ بالشروط الأربعة نفسِها.
//
// **وثلاثُ محطاتٍ تركب هذه الحلقةَ نفسَها** (الجلسة ٧ — والحلقةُ واحدةٌ فالشاشةُ
// واحدة، وهو عينُ ما يعلنه `tools/test_measure.mjs`: `letter` و`form` كلاهما
// `lesson.js`):
//   · **الحرفُ المعزول** (`type: letter`): وحدةٌ واحدة — الحرفُ بشكله المعزول.
//   · **شكلُ الموقع** (`type: form`): وحداتٌ متتابعة — حروفُ المجموعة **بشكل موقعها**،
//     حرفاً بعد حرف بالحلقة نفسِها. ومفتاحُ ليتنر يحمل شكلَ الموقع (`METHOD.md §٦`)،
//     فما يُقاس هنا غيرُ ما قِيس في المعزول وإن كان الحرفُ واحداً.
//   · **تمييزُ المتشابهات** (`type: form` وفيها `compare`): أسرةُ متشابهاتٍ تُعرَض
//     شاراتُها معاً، ويُطلَب **واحدٌ منها باسمه** فيُكتب في صندوقٍ فارغ — نظيرُ «ميّز
//     بين» في اقرأ، وهي المحطةُ التي تجمع ما باعده المنهجُ قصداً (`METHOD.md §٤`:
//     «المتشابهاتُ رسماً متباعدةٌ ثم تُقارَن»).
//
// **ومؤشّرُ التقدّم الحركيّ مخالفةٌ معلَنة لاقرأ** (`METHOD.md §٥`): المسارُ يتلوّن
// تحت قلم الطفل في كل خطوة (يملكه `pen.js`)، فالكتابةُ فعلٌ ممتدّ لا نقرة — والطفلُ
// يحتاج أن يرى أين هو من الحركة. **ولا «صوابَ صامت»**.
//
// **والمحرّكُ كما هو**: لا عتبةَ تُمَسّ هنا ولا سماحةَ تُبدَّل — هذه شاشةٌ تسوق
// `penSurface` وتقرأ حكمَه (`METHOD.md §٣.٣`).
//
// **القياس** (`METHOD.md §٦`): كلُّ خطوةٍ كاتبةٍ تكتب في ليتنر بمفتاحها الثلاثيّ
// (الوحدة × شكلُ الموقع × تتبّع/حرّ)، وكلُّ خطأٍ يُسجَّل **بعينه** في عدّاد أخطاء
// الاتجاه — **وشكلُ الموقع من العقدة نفسِها** لا من ثابتٍ مكتوب.
//
// 🔒 **ومن حملة مسار الطفل**: يمرّ بها حبرُه (تتلقّى أخطاءَه من المحرّك)، فتدخل
// حارسَ الخصوصية النصيّ في `tools/test_pen.mjs` — لا شبكةَ ولا رفعَ ولا عنوانَ
// خارجيّ، وما يُخزَّن **عددٌ باسم خطئه** لا إحداثيُّ نقطة.

import * as progress from './progress.js';
import { starsForReview } from './progress.js';
import * as audio from './audio.js';
import { pathOf, PATHS, LETTERS, DIGITS, VARIANTS, FORMS, shapeOf } from './curriculum.js';
import { penSurface, refGlyph, MODES, SIZE_TEXT } from './pen.js';
import {
  h, icon, go, arNum, starsRow, topbar, brandMark, mascot, cheer, faceEl,
  nodeTitle, traceFace, letterName, formTitle,
} from './ui.js';

/**
 * **تعليماتُ الشاشة المنطوقة** — وهي **الجديدُ الوحيد المطلوب** من الصوت في هذا
 * التطبيق (`METHOD.md §٧`: «الجديدُ المطلوب تعليماتُ الشاشات فقط»). تمرّ من
 * `tools/audio_queue.json` كسائر النصوص، ولا تُولَّد في جلسة تطوير.
 */
export const SAY = {
  watch: 'شَاهِدْ كَيْفَ يُكْتَبْ',
  guided: 'تَتَبَّعِ الْمَسَارْ',
  faint: 'تَتَبَّعْهُ وَهْوَ خَافِتْ',
  // **وألفُ الوصل عاريةٌ** — قاعدةُ المنطوق كلِّه بقياسها في `docs/AUDIO_QUEUE.md`،
  // ويحرسها `vowelledWasl` في `tools/check_speech.mjs`.
  free: 'اكْتُبْهُ وَحْدَكْ',
  // **تعليمةُ محطة التمييز** (الجلسة ٧): الأخواتُ معروضاتٌ والمطلوبُ يُقال باسمه
  // بعدها من بنك اقرأ — فالسؤالُ سمعيٌّ والجوابُ حركيّ.
  compare: 'مَيِّزْ بَيْنَهَا ثُمَّ اكْتُبِ الْحَرْفَ',
};

/**
 * **ما تنطقه هذه الشاشةُ — مُعلَنٌ لا مضمَر** (بابُ الإعلان في `tools/check_speech.mjs`،
 * منقولُ `calc@ad59c56`): تعليماتُ الخطوات، **وأسماءُ الحروف التي أُلّف مسارُها**
 * فصارت تُدرَّس فعلاً.
 *
 * **ويُشتقّ من المادّة لا يُكتب بيد**: حرفٌ يدخل `PATHS` غداً يدخل هذا الإعلانَ من
 * نفسه، **فيُطالِب الحارسُ بصوت اسمه** من بنك اقرأ بلا سطرٍ يُضاف — وهو نمطُ
 * «التعليقُ يُطالِب من نفسه». (وقد وقع ذلك في الجلسة ٦: دخلت المجموعاتُ ٤–٧.)
 */
export const LETTER_NAMES = Object.keys(PATHS).map((ch) => LETTERS[ch]?.name).filter(Boolean);

/**
 * **وأسماءُ الأرقام معها** (ت٥): الرقمُ يُشاهَد كما يُشاهَد الحرف، ويُسمّى باسم عدده
 * **كما يسمّيه احسب** (`DIGITS` من مستودعه) — فيسمع الطفلُ الاسمَ الذي تعلّمه عادّاً.
 * **ولا صوتَ يُولَّد في جلسة تطوير**: يمرّ من `tools/audio_queue.json` كسائر نصوصنا،
 * وليس في بنك اقرأ منها شيء (لا يعلّم الأرقام).
 */
export const DIGIT_NAMES = Object.keys(PATHS).map((ch) => DIGITS[ch]?.name).filter(Boolean);

export const SPOKEN = [...Object.values(SAY), ...LETTER_NAMES, ...DIGIT_NAMES];

/**
 * خطواتُ الحلقة (`METHOD.md §٥`) — والكاتبةُ منها ثلاثٌ، لكلٍّ مفتاحُ قياسها.
 * `mode` نمطُ اللوح في `pen.js`، فما يراه الطفلُ هو ما يحكم به المحرّك.
 */
export const STEPS = [
  { id: 'watch', mode: MODES.GUIDED, title: 'شَاهِدْ', say: SAY.watch, kind: null },
  { id: 'guided', mode: MODES.GUIDED, title: 'تَتَبَّعْ', say: SAY.guided, kind: progress.KINDS.TRACE },
  { id: 'faint', mode: MODES.FAINT, title: 'خَافِتٌ', say: SAY.faint, kind: progress.KINDS.TRACE },
  { id: 'free', mode: MODES.FREE, title: 'وَحْدَكْ', say: SAY.free, kind: progress.KINDS.FREE },
];

/**
 * **خطوةُ التمييز واحدة ولا تُشاهَد**: عرضُ الشكل قبل السؤال يُبطِل السؤالَ نفسَه —
 * فالمطلوبُ أن يميّز الطفلُ **من ذاكرته الحركية** أيَّ الأخوات هو، لا أن ينقل ما
 * أمامه. فصندوقٌ فارغ وحكمُ الشروط الأربعة نفسِها.
 */
const COMPARE_STEPS = [
  { id: 'compare', mode: MODES.FREE, title: 'مَيِّزْ', say: SAY.compare, kind: progress.KINDS.FREE },
];

const stepsOf = (unit) => (unit.family ? COMPARE_STEPS : STEPS);

/** عقدةُ الرحلة بنوعها ومحطتها وجزئها — من الرحلة نفسِها، فلا يُكتب معرّفُ محطةٍ بيد. */
export const nodeOf = (type, stageId, part) => progress.allNodes().find((node) =>
  node.type === type && node.part === part && (!stageId || node.stageId === stageId)) || null;

/**
 * **أضعفُ الأخوات في يده** — مادّةُ سؤال التمييز: مَن لم يُقَس بعدُ أوّلاً، ثم أدنى
 * صناديق ليتنر، ثم أكثرُهنّ خطأً. **وهو مبدأُ البوابة نفسُه** (`gate.js`: الأضعفُ لا
 * المستحقُّ)، فالمحطةُ تسأل عمّا يحتاجه الطفلُ لا عمّا يصادف موعدَه.
 */
function weakest(letters, form) {
  const rank = (ch) => {
    const skill = progress.getSkill(progress.skillKey(ch, form, progress.KINDS.FREE));
    return skill ? [1, skill.box, -skill.wrong] : [0, 0, 0];
  };
  return [...letters].sort((a, b) => {
    const [x, y] = [rank(a), rank(b)];
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2] || letters.indexOf(a) - letters.indexOf(b);
  })[0];
}

/**
 * **وحداتُ العقدة**: ما يكتبه الطفلُ فيها واحدةً بعد واحدة — ولكلٍّ مسارُها المرجعيّ
 * (`ref`) الذي يُعرَض ويُحكَم به معاً.
 *
 * **وما لا مسارَ له يسقط لا يُعرَض فارغاً**: درسٌ بلا نموذجٍ ولا حَكَم لا يُفتَح
 * (`METHOD.md §٣.٨`)، ويحرس `check_paths.py` ألّا يقع ذلك أصلاً.
 */
export function unitsOf(node) {
  if (!node) return [];
  // **والرقمُ حرفٌ معزولٌ في الحركة**: شكلٌ واحد لا يتصل ولا يتشكّل، فحلقتُه حلقةُ
  // الحرف بخطواتها الأربع ومفتاحُ قياسه مفتاحُه (`رقم|معزول|تتبّع`).
  if (node.type === 'letter' || node.type === 'digit') {
    const ref = node.letter && pathOf(node.letter, FORMS.ISOLATED);
    return ref ? [{ letter: node.letter, form: FORMS.ISOLATED, ref }] : [];
  }
  // ————— ت٣: اسمُ الطفل بيده —————
  //
  // **مادّتُها على الجهاز لا في المنهج**: الاسمُ يكتبه وليُّ الأمر مرّةً في لوحته،
  // فتُقرأ منه **أشكالُ مواقع حروفه** بقاعدة الوصل نفسِها (`shapeOf` في المنهج،
  // مصدرٌ واحد لا مصدران)، ويُكتب كلُّ حرفٍ بمساره القانونيّ في موقعه — **وهو عينُ ما
  // تعلّمه في محطة الشكل**، فلا يُطلب منه شكلٌ لم يُدرَّس.
  //
  // **وحدُّها معلَن**: خيالُ الكلمة الموصولة يؤلّفه مولّدُ المسارات في عدّة البناء
  // لا على جهاز الطفل — فالاسمُ يُكتب **حرفاً حرفاً بأشكال مواقعه** لا مساراً واحداً
  // موصولاً، ونموذجُه كاملاً معروضٌ فوق اللوح يقرؤه بعينه.
  if (node.type === 'name') {
    return shapeOf(nameOf()).map(([ch, form]) => {
      const ref = pathOf(ch, form);
      return ref && { letter: ch, form, ref };
    }).filter(Boolean);
  }
  if (node.type !== 'form') return [];
  if (node.compare) {
    // أسرةٌ لكلِّ وحدة: تُعرَض شاراتُ الأخوات كلِّهنّ، ويُطلَب **أضعفُهنّ** باسمه
    return node.compare
      .map((family) => {
        const letter = weakest(family, node.form);
        const ref = pathOf(letter, node.form);
        return ref && { letter, form: node.form, ref, family };
      })
      .filter(Boolean);
  }
  return (node.letters || [])
    .map((letter) => {
      const ref = pathOf(letter, node.form);
      return ref && { letter, form: node.form, ref };
    })
    .filter(Boolean);
}

/**
 * **أدرسٌ جاهزٌ لهذه العقدة؟** — أيْ: أُلّفت مساراتُ ما تدرّسه؟ يقرؤها الموجّهُ فيجيب
 * الطفلَ بدل أن يصمت (بلاغُ الميدان ١: «الصمتُ يُقرأ عطباً»)، **ومصدرُ جوابها
 * البياناتُ نفسُها** لا قائمةٌ تشيخ: يومَ يُؤلَّف مسارُ شكلٍ تُفتَح محطتُه بلا سطرٍ
 * يُعدَّل هنا ولا هناك.
 */
/** اسمُ الطفل من حاله على الجهاز — 🔒 لا يعرفه غيرُ هذا الجهاز. */
export const nameOf = () => progress.childName();

/**
 * **حرفٌ في الاسم لا يُكتب بعدُ** — أوّلُه بعينه، أو `null` إن كان الاسمُ كلُّه مكتوباً.
 * والعلّةُ صنفان: حرفٌ لم يُؤلَّف له مسارٌ مفرد (الهمزاتُ والتاءُ المربوطة تُكتب في
 * الكلمات وعلى حروفها، ولا شكلَ مفردٌ لها في `PATHS`)، أو محرفٌ ليس من حروف العربية.
 */
export function nameGap(text = nameOf()) {
  for (const ch of String(text ?? '')) {
    if (ch === ' ' || /[\u064B-\u0652]/.test(ch)) continue;      // الحركاتُ تُرسَم مع حرفها
    if (!LETTERS[ch] && !VARIANTS[ch]) return { ch, why: 'ليس من حروف العربية' };
  }
  const shaped = shapeOf(text);
  for (const [ch, form] of shaped) {
    if (!pathOf(ch, form)) {
      return {
        ch,
        why: VARIANTS[ch]
          ? `«${ch}» تُكتب في الكلمات على حرفها ولم يُؤلَّف لها شكلٌ مفرد بعد`
          : `«${ch}» لم يُؤلَّف مسارُه بعد`,
      };
    }
  }
  return shaped.length ? null : { ch: '', why: 'لم يُكتب الاسمُ بعد' };
}

export const nodeReady = (node) => {
  if (!node) return false;
  if (node.type === 'name') return Boolean(nameOf()) && !nameGap();
  const wanted = node.type === 'letter' || node.type === 'digit' ? [node.letter].filter(Boolean)
    : node.type === 'form' ? (node.compare ? node.compare.flat() : node.letters || [])
      : [];
  const form = node.type === 'form' ? node.form : FORMS.ISOLATED;
  // **كلُّ ما تعرضه العقدةُ لا ما تكتبه وحدَه**: أخواتُ التمييز تُعرَض شاراتُها،
  // فشكلٌ منهنّ بلا مسارٍ يترك صفّاً أعورَ — والسؤالُ يقوم على الأخوات مجتمعات.
  return wanted.length > 0 && wanted.every((ch) => pathOf(ch, form));
};

/** أدرسُ حرفٍ جاهزٌ بجزئه؟ (بابُ الموجّه القديم — يقرأ من الرحلة نفسِها). */
export const lessonReady = (part) => nodeReady(nodeOf('letter', null, part));

let live = null;

/** إطلاقُ اللوح عند مغادرة الشاشة — يناديها الموجّه مع كل رسمة (نظيرُ `releaseWarmup`). */
export function releaseLesson() {
  live?.destroy();
  live = null;
}

/** شاشةُ درسِ حرفٍ معزول — بابُ الموجّه للحرف. */
export const renderLesson = (part) => renderNode(nodeOf('letter', null, part));

/** وشاشةُ درسِ رقمٍ — الحلقةُ نفسُها بمادّةٍ لا تتصل ولا تتشكّل (ت٥). */
export const renderDigit = (part) => renderNode(nodeOf('digit', null, part));

/** وشاشةُ اسم الطفل — الحلقةُ نفسُها بمادّةٍ من جهازه (ت٣). */
export const renderName = (part) => renderNode(nodeOf('name', null, part));

/** شاشةُ محطة شكل الموقع (أو التمييز) — بابُ الموجّه للأشكال. */
export const renderForms = (stageId, part) => renderNode(nodeOf('form', stageId, part));

/**
 * **الشاشةُ الواحدة**: عقدةٌ بوحداتها، وكلُّ وحدةٍ بحلقتها.
 * @param {object} node عقدةُ الرحلة (`letter` أو `form`)
 * @returns {Node|null} `null` إن لم تكن عقدةً كاتبةً أو لم تُؤلَّف مساراتُها بعد
 */
export function renderNode(node) {
  const units = unitsOf(node);
  if (!units.length) return null;

  const state = { unit: 0, index: 0, faults: 0, stepFaults: 0, done: false };
  /** آخرُ ما نطقته الشاشة — **وبه تنتظر الخطوةُ تمامَ الكلام** (قناة ٤ج) لا مهلةً. */
  let speech = Promise.resolve(false);

  const dots = h('ol', { class: 'dots' });
  const strip = h('ol', { class: 'unit-strip' });
  const family = h('div', { class: 'compare-row' });
  const board = h('div', { class: 'lesson-board' });
  const foot = h('div', { class: 'row foot' });
  const hint = h('p', { class: 'hint' });
  const title = h('h1', { class: 'lesson-title' }, nodeTitle(node));

  const screen = h('div', {},
    topbar(
      h('button', {
        class: 'btn btn--ghost',
        'aria-label': 'عودةٌ إلى الخريطة',
        onclick: () => go('#/'),
      }, '→ الخريطة'),
      h('span', { class: 'spacer' }),
      brandMark(),
    ),
  );

  /** **كلامُ التطبيق يصفّ في القناة** (`audio.js`): لا إسكاتَ قبله — والانتقالُ ينتظره. */
  const say = (...texts) => {
    speech = texts.length > 1 ? audio.playSequence(texts) : audio.play(texts[0]);
    return speech;
  };

  function paintDots() {
    const steps = stepsOf(units[state.unit] || units[0]);
    dots.replaceChildren(...steps.map((step, i) => h('li', {
      class: `dot${!state.done && i === state.index ? ' dot--now' : ''}`
        + `${state.done || i < state.index ? ' dot--done' : ''}`,
      'aria-label': step.title,
    }, state.done || i < state.index ? '✓' : arNum(i + 1))));
  }

  /**
   * **شريطُ وحدات المحطة**: شاراتُ ما يُكتب فيها بالترتيب — **مرسومةً من مساراتها
   * المرجعية** (`refGlyph`)، فيرى الطفلُ أين هو من محطته وكم بقي. ويسقط الشريطُ إذا
   * كانت الوحدةُ واحدة (درسُ الحرف المعزول) فلا يزاحم لوحَه بما لا يقول شيئاً.
   */
  function paintStrip() {
    if (units.length < 2) return;
    strip.replaceChildren(...units.map((unit, i) => h('li', {
      class: `unit${i === state.unit && !state.done ? ' unit--now' : ''}${state.done || i < state.unit ? ' unit--done' : ''}`,
      'aria-label': letterName(unit.letter),
    }, refGlyph(unit.ref))));
  }

  /**
   * **صفُّ المتشابهات** (محطة التمييز): شاراتُ الأخوات كلِّهنّ **بلا اسمٍ ولا علامةٍ
   * تدلّ على المطلوب** — فالفارقُ بينهنّ في الرسم وحدَه (نقطةٌ أو نقطتان أو ثلاث)،
   * والمطلوبُ يُقال في الأذن. ولو وُسمت المطلوبةُ لصار التمرينُ نقلاً لا تمييزاً.
   */
  function paintFamily(unit) {
    if (!unit.family) { family.replaceChildren(); return; }
    family.replaceChildren(...unit.family.map((ch) => h('div', {
      class: 'compare-one', 'aria-label': letterName(ch),
    }, refGlyph(pathOf(ch, unit.form)))));
  }

  /**
   * يبني لوحَ الخطوة الحالية — النموذجُ والحَكَمُ من `ref` واحد (`METHOD.md §٣.٢`).
   * **وخطوةُ «شاهِدْ» لا يُكتب عليها**: لوحُها عرضٌ، ولمسُه ينقل إلى التتبّع (لا
   * يبتلع نزولَ الإصبع فيضيع أوّلُ حرفٍ يكتبه الطفل).
   */
  function mount() {
    releaseLesson();
    const unit = units[state.unit];
    const step = stepsOf(unit)[state.index];
    state.stepFaults = 0;
    hint.textContent = step.say;
    paintFamily(unit);

    const surface = penSurface({
      ref: unit.ref,
      mode: step.mode,
      label: `لوحُ كتابة: ${letterName(unit.letter)}${unit.form === FORMS.ISOLATED ? '' : ` ${formTitle(unit.form)}`}`,
      // **كلُّ خطأٍ يُسجَّل باسمه** (`METHOD.md §٦`) — ووحدتُه الحرفُ نفسُه، فتقرأ
      // لوحةُ وليّ الأمر «يبدأ الميمَ من أسفل» لا رقماً مبهماً.
      onFault: (fault) => {
        state.faults++;
        state.stepFaults++;
        progress.recordFault(unit.letter, fault.code);
      },
      /**
       * **حجمٌ معقولٌ يُرشَد إليه بجملته لا يُردّ صامتاً** (`METHOD.md §٥ب`): يقيسه
       * المحرّكُ من صندوق المادّة (`sizeOf`) ويعطي جملتَه، وتضعها الشاشةُ في سطر
       * الإرشاد نفسِه — ثم تعود إلى تعليمة الخطوة إذا استقام حجمُه. **ولا لومَ**:
       * «اكْتُبْهُ أَكْبَرْ» طلبٌ لا حكم.
       */
      onTry: ({ size }) => { hint.textContent = (size && SIZE_TEXT[size]) || step.say; },
      /**
       * 🚪 **ولا انسدادَ أبداً** (`METHOD.md §٥ب` — بلاغُ الميدان ٢: تركت الطفلةُ
       * الجهاز): بعد تعثّرٍ متكرر يُفتَح المخرجُ الكريم.
       */
      onStuck: () => wayOut(step, unit),
      onDone: () => finishStep(step, unit),
    });
    live = surface;
    board.replaceChildren(surface.el);
    board.classList.toggle('lesson-board--watch', step.id === 'watch');
    surface.play();
    if (step.id === 'watch') {
      // لمسةُ الطفل على لوح العرض تنقله إلى التتبّع — والنقرةُ **تُسكت ثم تُشغّل**
      // (عقدُ ٤ج: كلامُ التطبيق يصفّ، ونقرةُ الطفل تعيش وحدَها).
      surface.el.addEventListener('pointerdown', () => { audio.stop(); nextStep(); });
      say(letterName(unit.letter), step.say);
    } else {
      surface.el.addEventListener('pointerdown', () => surface.stop(), { capture: true });
      // **وفي التمييز يُقال المطلوبُ بعد التعليمة**: التعليمةُ تصف العمل والاسمُ
      // يعيّن المطلوب — وكلاهما يصفّ في القناة الواحدة فيُسمَعان بترتيبهما.
      if (step.id === 'compare') say(step.say, letterName(unit.letter));
      else say(step.say);
    }
    paintDots();
    paintStrip();
    paintFoot(step, unit);
  }

  /**
   * **القياسُ يكتب لكل خطوةٍ بمفتاحها** (`METHOD.md §٦`): الخطوةُ بلا خطأٍ إصابةٌ
   * ترفع صندوقَ ليتنر، وما وقع فيه خطأٌ يعود إلى الصندوق الأول فيُراجَع غداً.
   * **وشكلُ الموقع من الوحدة** — فالباءُ وسطاً غيرُ الباء معزولةً في السجلّ.
   *
   * **والنوعان مكتوبان بأعيانهما لا بمتغيّر**: `tools/test_measure.mjs` يقرأ هذا
   * الملفَّ نصّاً ليثبت أنّ المحطةَ تكتب ما أعلنته — ولو مُرِّرا في متغيّرٍ لَعمي
   * عنهما الحارسُ ومرّت محطةٌ لا تقيس.
   */
  function score(step, unit, clean) {
    if (step.kind === progress.KINDS.FREE) {
      progress.recordAttempt(unit.letter, unit.form, progress.KINDS.FREE, clean);
    } else if (step.kind === progress.KINDS.TRACE) {
      progress.recordAttempt(unit.letter, unit.form, progress.KINDS.TRACE, clean);
    }
  }

  /**
   * 🚪 **المخرجُ الكريم** (`METHOD.md §٥ب` — بلاغُ الميدان ٢، ١٣ أغسطس ٢٠٢٦):
   * «إعادةٌ بلا حدّ» ليست عهداً بأن يبقى الطفلُ محبوساً. فبعد تعثّرٍ متكرر
   * (`FREE.stumbles` في المحرّك) يفتح البابَ **بيده هو**: يعود إلى التتبّع الموجَّه
   * حيث النموذجُ مرئيّ، أو يمضي إلى ما بعدها.
   *
   * **ولا رسوبَ ولا لومَ ولا حرمانَ نجمة**: النجومُ من عدّاد أخطائه كما هي لكلّ طفل،
   * ولا عقوبةَ على الخروج. **وليتنر يعيدها إليه**: المضيُّ يكتب محاولةً غيرَ تامّة
   * في سجلّه (`score(..., false)`) فتنزل مهارتُه إلى الصندوق الأول وتعود غداً —
   * **فالمتروكُ مؤجَّلٌ لا مسقَط**. والزرُّ الثالث «أعِدْ» باقٍ: من أراد المحاولةَ
   * فله ذلك بلا حدّ كما كان.
   */
  function wayOut(step, unit) {
    const back = stepsOf(unit).findIndex((s) => s.mode === MODES.GUIDED && s.kind);
    hint.textContent = 'خُذْ نَفَساً — تَتَبَّعْهُ مَرَّةً، أَوْ تَابِعْ';
    foot.replaceChildren(
      ...(back >= 0 ? [h('button', {
        class: 'btn btn--primary next',
        onclick: () => { state.index = back; mount(); },
      }, icon('pen'), ' تَتَبَّعْ مَرَّةً')] : []),
      h('button', {
        class: `btn${back >= 0 ? '' : ' btn--primary'} next`,
        onclick: () => { score(step, unit, false); nextStep(); },
      }, 'تَابِعْ →'),
      h('button', { class: 'btn next', onclick: () => live?.reset() }, '↻ أعِدْ'),
    );
  }

  /** خطوةٌ استُوفيت: تُقاس ثم تُسلّم إلى ما بعدها — **بعد تمام الكلام لا بمهلة**. */
  function finishStep(step, unit) {
    score(step, unit, state.stepFaults === 0);
    nextStep();
  }

  async function nextStep() {
    const token = ++turn;
    await speech;                       // لا يُدهَس كلامٌ يُقال (قناةُ ٤ج)
    if (token !== turn) return;         // سبقتنا خطوةٌ أحدث
    if (state.index < stepsOf(units[state.unit]).length - 1) {
      state.index++;
      mount();
      return;
    }
    // **وحدةٌ تمّت حلقتُها**: تُسلَّم إلى أختها في المحطة نفسِها بلا خروجٍ ولا احتفالٍ
    // بينهما — الاحتفالُ للمحطة، والانتقالُ بين حروفها متّصلٌ كما تُكتب الكلمة.
    if (state.unit < units.length - 1) {
      state.unit++;
      state.index = 0;
      mount();
      return;
    }
    finish();
  }
  let turn = 0;

  /** عددُ الخطوات الكاتبة في المحطة كلِّها — سقفُ الأخطاء الذي تُقاس عليه النجوم. */
  const writingSteps = units.reduce((n, unit) => n + stepsOf(unit).filter((s) => s.kind).length, 0);

  /**
   * ختامُ المحطة: نجومٌ بحكم المراجعة نفسِه (`starsForReview`) — ثلاثٌ بلا خطأ،
   * فاثنتان ما دامت الأخطاءُ ≤ عدد الخطوات الكاتبة، وإلا واحدة. **ولا رسوبَ**:
   * من أتمّ خطواته فقد كتب كلَّ شكلٍ صحيحاً في النهاية (المحرّكُ لا يُمرّر جزءاً إلا
   * مستوفىً)، والأخطاءُ في الطريق تُقاس ولا تُعاقَب.
   */
  function finish() {
    // **أثرُ الطفل يُنسَخ قبل أن يُطوى اللوح** (`REVIEW_IDENTITY.md §٣ج`).
    const trace = live?.ink() ?? [];
    releaseLesson();
    state.done = true;
    const stars = starsForReview(state.faults, writingSteps);
    progress.setStars(node.id, stars);
    paintDots();
    paintStrip();
    family.replaceChildren();
    hint.textContent = '';
    board.classList.remove('lesson-board--watch');
    board.replaceChildren(h('div', { class: 'celebrate' },
      mascot('mascot mascot--cheer'),
      trace.length ? traceFace(trace) : faceEl(icon('pen'), 'celebrate-face', 'div'),
      h('h2', {}, ...cheer('أَحْسَنْتَ')),
      starsRow(stars, 'big-stars'),
      h('p', { class: 'hint' }, `${nodeTitle(node)} — ${
        state.faults ? 'يدُك تتحسّن' : 'بلا خطأٍ واحد'}`),
    ));
    foot.replaceChildren(
      h('button', { class: 'btn btn--primary next', onclick: () => go('#/') }, '→ الخريطة'),
      h('button', {
        class: 'btn next',
        onclick: () => {
          state.unit = 0;
          state.index = 0;
          state.faults = 0;
          state.done = false;
          mount();
        },
      }, '↻ أعِدِ الدرس'),
    );
  }

  /** أفعالُ الشاشة: تُبدَّل بالخطوة — وكلُّها أهدافُ لمسٍ ≥ ٦٤ بكسل (`DESIGN §٤`). */
  function paintFoot(step, unit) {
    if (step.id === 'watch') {
      foot.replaceChildren(
        h('button', {
          class: 'btn btn--primary next',
          onclick: () => { audio.stop(); nextStep(); },
        }, icon('pen'), ' تَتَبَّعْ'),
        h('button', {
          class: 'btn next',
          // **نقرةُ الطفل تُسكت ثم تُشغّل** (عقدُ قناة ٤ج): فتسقط بقيّةُ ما صُفّ
          // ويُسمَع ما طلبه هو وحدَه — لا يُكدَّس صوتٌ فوق صوت.
          onclick: () => { audio.stop(); speech = audio.play(letterName(unit.letter)); },
        }, icon('ear'), ' اسْمَعْ'),
        h('button', {
          class: 'btn next',
          onclick: () => { live?.reset(); live?.play(); },
        }, '↻ أعِدِ العَرْض'),
      );
      return;
    }
    // **وفي التمييز لا زرَّ «شاهِدْ»**: عرضُ الشكل يُبطِل السؤال — فيبقى زرُّ الأذن
    // (يعيد اسمَ المطلوب) وزرُّ الإعادة، ولا يُكشَف الجوابُ بنقرة.
    if (step.id === 'compare') {
      foot.replaceChildren(
        h('button', {
          class: 'btn btn--primary next',
          onclick: () => { audio.stop(); speech = audio.play(letterName(unit.letter)); },
        }, icon('ear'), ' أَعِدِ السُّؤَال'),
        h('button', { class: 'btn next', onclick: () => live?.reset() }, '↻ أعِدْ'),
      );
      return;
    }
    foot.replaceChildren(
      h('button', {
        class: 'btn btn--primary next',
        onclick: () => { live?.reset(); live?.play(); },
      }, icon('pen'), ' شَاهِدْ'),
      h('button', { class: 'btn next', onclick: () => live?.reset() }, '↻ أعِدْ'),
    );
  }

  const main = h('main', { class: 'screen lesson-letter' },
    title, strip, dots, family, board, hint, foot);
  screen.append(main);
  mount();
  return screen;
}
