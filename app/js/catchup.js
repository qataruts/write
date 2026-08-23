// **بوابةُ اللحاق** — امتحانُ تحديد مستوىً اختياريّ (`FAMILY.md §١٠/هـ`، قرارُ المالك
// ١٦ أغسطس ٢٠٢٦؛ وتصميمُ منهجه في `docs/METHOD.md §١١` وبندُ «جلسة ل» في `SESSIONS.md`).
//
// **العلّة**: جمهورُ العائلة ليس المبتدئَ من الصفر وحدَه — تلميذُ المدرسة والمراكز يصل
// بمستوىً قائم، وإجبارُه على أوّل السلّم مللٌ فهجر. فيُمتحَن مرّةً فيُفتح له ما أثبته
// **بيده**، ويقف حيث ينكسر.
//
// **وامتحانُنا يدٌ لا اختيار** (لفظُ المالك في القاعدة: «بامتحان يدٍ لا اختيار»):
// **ادّعاءُ اليد لا يُقبل إلا من اليد** — لا لمسَ صورةٍ ولا انتقاءَ من أربع، بل كتابةٌ
// حرّة يحكم عليها المحرّكُ بالحكم القائم بعينه: الحرفُ بشروط المسار الأربعة
// (`METHOD.md §٣.٣` — نمطُ خطوة «اكتبه وحدك»)، والكلمةُ والجملةُ **بالشكل لا بالأثر**
// (`judgeFree` — نمطُ درجة «اُكْتُبْهَا وحدَك» في `copy.js`).
//
// ————— القيودُ الخمسة، ولكلٍّ موضعُه في هذا الملف —————
//
// ١) **اختياريٌّ ومن لوحة وليّ الأمر حصراً**: لا بابَ لهذه الشاشة إلا `openCatchup()`،
//    ولا يناديها إلا `parent.js` — و`renderCatchup` تردّ `null` لمن بلغ عنوانَها بلا
//    مرورٍ باللوحة (فبوابةُ الضرب الحسابية حارسُها بالبناء لا بزرٍّ ثانٍ). **ولا أثرَ
//    لها في شاشة طفل**، ويجرد ذلك `tools/test_catchup.mjs` نداءً نداءً.
// ٢) **يفتح ما أُثبت لا ما ادُّعي**: `ladder()` تصعد بترتيب الرحلة نفسِه وحدةً وحدة،
//    وكلُّ وحدةٍ تُفتح **بعد** أن تُثبَت، والشرخُ يوقف الصعود في موضعه.
// ٣) **صرامتُه صرامةُ البوابات**: العتبةُ `passed` من `gate.js` بعينها — **ولا رقمَ
//    يُكتب هنا**. والبواباتُ الثلاث لا تُقفز: السلّمُ يقف عند أوّل بوابةٍ لم تُجتَز،
//    فيبلغ الفتحُ حدَّها وتبقى هي محطتَه يعبرها بيده.
// ٤) **نتائجُه تُزرع في ليتنر قياساً حقيقياً**: كلُّ كتابةٍ تمرّ بـ`api.score` إلى
//    `recordAttempt` بمفتاحها الثلاثيّ الحقيقيّ، وكلُّ حركةٍ خاطئة إلى `recordFault` —
//    **ولا وسمَ «امتحان» في مفتاح**: المراجعةُ اليومية شبكةُ الأمان إن سخا الفتح.
// ٥) **فتحٌ لا قفل**: لا يُنادى هنا `clearSection` ولا يُنقَص نجمٌ — `unlockUpTo` تزيد
//    ولا تنقص، و`setStars` لا تخفض. فامتحانٌ ثانٍ أسوأُ من الأوّل **لا يغلق شيئاً**.
//
// **والاستئنافُ بلا حالٍ جديدة تُخزَّن**: موضعُ السلّم **يُشتقّ من جبهة الفتح نفسِها**
// (`progress.nextNode()`) — فما أُثبت فُتح، وما فُتح تجاوزته الجبهة. فالخروجُ والعودةُ
// يستأنفان من آخر وحدةٍ حُسمت بلا حقلٍ في تخزين الطفل يشيخ.
//
// 🔒 **ومن حملة مسار الطفل**: يمرّ بها حبرُه (تتلقّى `onFault` من المحرّك وتبني لوحاً)،
// فتدخل حارسَ الخصوصية النصيّ في `tools/test_pen.mjs` — لا شبكةَ ولا رفعَ ولا عنوان.

import * as progress from './progress.js';
import * as lesson from './lesson.js';
import * as copy from './copy.js';
import * as fade from './fade.js';
import * as sentence from './sentence.js';
import { passed, PASS_RATE } from './gate.js';
import { VIEWS, renderSession, assistFoot } from './review.js';
import { WORD_PATHS } from './word_paths.js';
import { SPOKEN_WORDS, SPOKEN_SENTENCES } from './curriculum.js';
import { penSurface, refGlyph, MODES, FREE } from './pen.js';
// **مسطرةُ الامتحان الواحدة** (بلاغ `2026-08-17-support-and-placement-coexist.md`):
// يستورد **النطاقَ** ومقبضَ راحةٍ واحداً — **ولا يقرأ مقداراً من مقادير الصعوبة بيده**
// ولا يعرف `easeFor` ولا `mayEase` أصلاً (حصانةٌ بنيوية يجردها الحارس على المصدر).
import { duringExam, demoPace } from './support.js';
import {
  h, icon, go, arNum, arCount, topbar, mascot, cheer, starsRow, stageTitle, letterName,
  PAUSE_ACCENT,
} from './ui.js';

/** عنوانُ الشاشة — يُقرأ في `main.js` وفي زرّ اللوحة، فلا يُكتب في موضعين. */
export const ROUTE = '#/catchup';

const PILL = 'بوابةُ اللحاق';

/**
 * **العتبةُ عتبةُ البوابات ولا رقمَ يُكتب مرتين** (`FAMILY §١٠/هـ` ٣): الحكمُ نفسُه
 * `passed` من `gate.js`، وهذا وجهُها المئويّ للعرض **مشتقٌّ من `PASS_RATE` بعينه** —
 * فبوابةٌ تُشدَّد غداً يشتدّ الامتحانُ معها بلا سطرٍ يُعدَّل هنا.
 */
export const PASS_PERCENT = Math.round(PASS_RATE * 100);

/**
 * **تعليماتُ الامتحان — مستعارةٌ كلُّها من مالكيها، ولا نصَّ يُؤلَّف ولا صوتَ يُولَّد**
 * (عقدُ الجلسة): الامتحانُ يسأل الطفلَ **بما تعلّم به** لا بلسانٍ جديد.
 *
 * · **الكلمةُ**: تعليمةُ الدرجة صفر في محطة الخفوت (`fade.SAY.copy` — «اُكْتُبْهَا كَمَا
 *   تَرَاهَا»)، وهي بعينها تعليمةُ درجة «وَحْدَكْ» في البستان (`copy.SAY.free`)
 *   ونمطُ سؤالِنا نمطُها: نموذجٌ يُرى فوق اللوح وصندوقٌ فارغ.
 * · **والجملةُ**: تعليمةُ نسخها من مجلسها (`sentence.SAY.copy`).
 * · **والحرفُ**: يقول تمرينُ المراجعة الحرّ اسمَه من بنك اقرأ — لا تعليمةَ لنا فيه.
 *
 * **وتُجمَع في `SAY` بالاسم الذي تقرؤه أداةُ الفئات** (`tools/queue_texts.mjs`: قيمةٌ
 * في `SAY` ⇐ فئتُها `ui`) — كما فعلت `copy.js` باستعارتها سواءً بسواء.
 */
export const SAY = {
  word: fade.SAY.copy,
  line: sentence.SAY.copy,
};

/**
 * **ما تنطقه هذه الشاشةُ — مُعلَنٌ لا مضمَر** (بابُ الإعلان في `tools/check_speech.mjs`):
 * تعليمتا الامتحان، **وأسماءُ الحروف والأرقام** (يقولها تمرينُ الحرف)، **وكلماتُ
 * المنهج وجملُه المنطوقةُ في بنك اقرأ** (يقولها تمرينُ الكلمة والجملة).
 *
 * **وهو خبرٌ لا زينة**: لا يُعلَن ما لا يُنطَق — فتعليمتا الخفوت والإملاء ليستا هنا،
 * إذ لا يعرض الامتحانُ درجةَ خفوتٍ ولا يُملي (الشكلُ لا الأثر، ونموذجٌ يُرى دائماً).
 */
export const SPOKEN = [
  ...Object.values(SAY), ...lesson.LETTER_NAMES, ...lesson.DIGIT_NAMES,
  ...SPOKEN_WORDS, ...SPOKEN_SENTENCES,
];

// ————— حالُ الجلسة (لا تُخزَّن: امتحانٌ يُفتَح ويُغلَق، والمحصولُ في ليتنر والنجوم) —————

const state = {
  open: false,     // فُتح من لوحة وليّ الأمر في هذه الجلسة — وهو البابُ الوحيد
  end: null,       // {kind, ...} — شاشةُ الختام حين ينتهي الامتحان
  opened: 0,       // كم عقدةً فُتحت في هذه الجولة
  units: 0,        // وكم وحدةً أُثبتت
  last: null,      // حصيلةُ آخر جولة — تقرؤها اللوحة
};

/** **البابُ الوحيد** — يناديه `parent.js` من خلف بوابته الحسابية، ولا يناديه سواه. */
export function openCatchup() {
  state.open = true;
  state.end = null;
  state.opened = 0;
  state.units = 0;
  go(ROUTE);
}

/** أفُتح البابُ في هذه الجلسة؟ يقرؤه الموجّه فيردّ من لم يمرّ باللوحة. */
export const isOpen = () => state.open;

/** حصيلةُ آخر جولةٍ لعرضها في اللوحة — `null` ما لم يُمتحَن في هذه الجلسة. */
export const lastResult = () => state.last;

/** إغلاقُ الباب (مغادرةُ الشاشة، وإعادةُ الحال في الاختبارات). */
export function closeCatchup() {
  state.open = false;
  state.end = null;
}

// ————— السلّم: يُشتقّ من الرحلة ولا يُكتب —————

/**
 * **وحداتُ العقدة من مالك شاشتها بعينها** — لا جدولَ ثانياً هنا يشيخ يومَ تتبدّل
 * مادّةُ محطة: درسُ الحرف والأرقامُ والأشكالُ والاسمُ من `lesson.js`، والوصلُ
 * والبساتينُ من `copy.js`، والخفوتُ من `fade.js`، والجملُ من `sentence.js`.
 *
 * **ومحورُ القياس يُلحَق هنا** (`WORD_FORM` أو `SENTENCE_FORM`) لأنّ الكلمةَ والجملةَ
 * لا شكلَ موقعٍ لهما — فيرجع كلٌّ إلى صندوقه بعينه في ليتنر.
 */
export function unitsOfNode(node) {
  const type = node?.type;
  if (type === 'letter' || type === 'digit' || type === 'form' || type === 'name') {
    return lesson.unitsOf(node);
  }
  if (type === 'join') return copy.unitsOf(node).map((u) => ({ ...u, form: progress.WORD_FORM }));
  if (type === 'fade') return fade.unitsOf(node).map((u) => ({ ...u, form: progress.WORD_FORM }));
  if (type === 'sentence') {
    return sentence.unitsOf(node).map((u) => ({ ...u, form: progress.SENTENCE_FORM }));
  }
  // **والتهيئةُ الحركية لا تُمتحَن** ولا يُدَّعى لها قياس: وحداتُها خطوطٌ ودوائر لا
  // مفتاحَ لها في ليتنر (إعفاؤها المكتوب في `tools/test_measure.mjs`) — **وتُفتَح
  // تبعاً لنجاح أوّل مجموعة حروف**: القدرةُ الأعلى تشهد للأدنى، ومن كتب الميمَ وحدَه
  // فقد جاوز الخطَّ الأفقيّ. وهو استنتاجٌ معلَنٌ بعلّته لا صمتٌ يُفترض.
  return [];
}

/** مادّةُ الوحدة كلُّها — عقدُها بترتيبها، وما لا مسارَ له ساقطٌ من مالكه أصلاً. */
export const materialsOf = (section) => (section?.nodes || []).flatMap(unitsOfNode);

/**
 * **حجمُ العيّنة يُحسب لا يُكتب**: نحو ثلث موادّ الوحدة وبحدٍّ أدنى اثنتان — فوحدةٌ
 * تكبر غداً تكبر عيّنتُها بلا سطرٍ يُعدَّل، **ولا تُثبَت وحدةٌ بكتابةٍ واحدة**
 * (عتبةُ ٨٠٪ على محاولةٍ واحدة إمّا كلٌّ وإمّا لا شيء).
 *
 * **وسقفُ الوحدة أثقلُ جلوسٍ مقرَّر في الرحلة نفسِها** (حكمُ إدارة، ١٦ أغسطس ٢٠٢٦
 * على بلاغ جلسة ل «ما يستحق عينَ الإدارة»): عقدةُ البستان ٥ كلمات × كتابتان =
 * ١٠ كتابات — فلا يطلب الامتحانُ من يدِ الممتحَن في الجلوس الواحد ما لا تطلبه
 * أيُّ محطةٍ من طفلها. بلا السقف كانت عيّنةُ «ثلثِ» وحداتِ البساتين الستّين
 * مادّةً ~٢٠ كتابةً، وشوطُ الختام ٤٦٩ (مقيسة في بلاغ التسليم).
 */
export const UNIT_CAP = 10;
export const sampleSize = (count) =>
  Math.min(count, UNIT_CAP, Math.max(2, Math.ceil(count / 3)));

/**
 * **عيّنةٌ موزّعةٌ بالسواء على مادّة الوحدة** — لا أوائلُها وحدَها: تُؤخذ من أوّلها
 * ومنتصفها وآخرها بمواضعَ محسوبة، فلا يُثبِت الطفلُ وحدةً بأسهل ما فيها. **وهي
 * حتميّةٌ لا عشوائية**: امتحانٌ يُعاد يسأل عن المادّة نفسِها، والحارسُ يقيسها.
 */
export function sampleOf(list, size = sampleSize(list.length)) {
  if (!list.length || size <= 0) return [];
  if (list.length <= size) return [...list];
  if (size === 1) return [list[0]];
  return Array.from({ length: size },
    (_, i) => list[Math.round((i * (list.length - 1)) / (size - 1))]);
}

/** موضعُ الوحدة التي عندها الطفلُ الآن — من جبهة الفتح نفسِها لا من حقلٍ يُخزَّن. */
function frontierSection(sections = progress.journey()) {
  const next = progress.nextNode();
  if (!next) return sections.length;                  // أتمّ الرحلة كلَّها
  const at = sections.findIndex((s) => s.nodes.some((n) => n.id === next.id));
  return at < 0 ? sections.length : at;
}

/** اسمُ الوحدة كما يقرؤه وليُّ الأمر والطفل — من الرحلة لا من قائمةٍ تُكتب. */
export const sectionName = (section) =>
  (section.kind === 'gate' ? section.gate.title : stageTitle(section.stage));

/**
 * **سلّمُ الامتحان**: وحداتُ الرحلة بترتيبها ابتداءً من موضع الطفل الآن —
 *
 * · وحدةٌ لا مادّةَ لها تُكتب (التهيئةُ، ومحطةُ الاسم قبل أن يُكتب) **تُتخطّى ولا
 *   تُمتحَن** — وتُفتح تبعاً لما بعدها حين يُثبَت (`unlockUpTo` تفتح ما قبل هدفها).
 * · **وبوابةُ إتقانٍ لم تُجتَز تختم السلّم**: هي حدُّ الفتح، ولا يُمتحَن ما بعدها —
 *   إذ لا يُفتَح ما بعدها أصلاً (`FAMILY §١٠/هـ` ٣: «يوصِل إليها وتُجتاز بنفسها»).
 * · وبوابةٌ عبرها الطفلُ فعلاً يمضي السلّمُ خلفها إلى ما بعدها.
 */
export function ladder() {
  const sections = progress.journey();
  const out = [];
  for (let i = frontierSection(sections); i < sections.length; i++) {
    const section = sections[i];
    if (section.kind === 'gate') {
      if (progress.isDone(section.nodes[0].id)) continue;   // بوابةٌ عُبرت: يمضي السلّم
      out.push({ index: i, section, gate: section.gate });
      break;                                                // وإلا فهي حدُّ الفتح
    }
    const materials = materialsOf(section);
    if (!materials.length) continue;
    out.push({ index: i, section, materials, sample: sampleOf(materials) });
  }
  return out;
}

/**
 * **فتحُ ما أُثبت — إلى حدّ الوحدة لا أبعد**: العقدةُ التالية للوحدة هي الهدف، فتُعَدّ
 * عقدُ الوحدة (وما تخطّاه السلّمُ قبلها) منجَزةً **بنجمةٍ واحدة** — تفكّ القفل ولا
 * تدّعي إتقاناً، وتبقى تدعوه إلى لعبها (حكمُ `unlockUpTo` بعينه).
 *
 * **ولا تُغلق شيئاً**: `unlockUpTo` تزيد نجوماً ولا تنقص واحدة.
 * @returns {number} كم عقدةً فُتحت فعلاً
 */
export function openThrough(entry) {
  const sections = progress.journey();
  const after = sections[entry.index + 1];
  // آخرُ الرحلة (لا بوابةَ ختامٍ في البيانات): تُفتَح عقدُ الوحدة نفسِها بحدّها
  if (!after) {
    const last = entry.section.nodes[entry.section.nodes.length - 1];
    const count = progress.unlockUpTo(last.id) + (progress.isDone(last.id) ? 0 : 1);
    progress.setStars(last.id, 1);
    return count;
  }
  return progress.unlockUpTo(after.nodes[0].id);
}

// ————— التمارين: الحكمُ القائم بعينه، ولوحٌ واحد يُطلَق —————

let live = null;

/** إطلاقُ لوح الامتحان — يناديه الموجّهُ مع كل رسمة، ويناديه التمرينُ قبل التالي. */
export function releaseCatchup() {
  live?.destroy();
  live = null;
}

/**
 * **تمرينُ الكلمة والجملة في الامتحان: الشكلُ لا الأثر** — صندوقٌ فارغ **ونموذجُها
 * فوقه** يُرى ولا يُتَّكأ عليه، ويحكم عليه `judgeFree` (نمطُ `MODES.FREE`) بالشكل
 * تامّاً. **وهو عينُ درجة «وَحْدَكْ» في `copy.js`** (ب١) لا نمطٌ جديد — ولذلك بُني من
 * عُدّتها نفسِها: `penSurface` و`refGlyph` و`assistFoot`.
 *
 * **ولِمَ لا يُستعمل تمرينُ المراجعة؟** لأنّ الكلمةَ هناك تُعرَض **بدرجة خفوتها الحيّة**
 * (`modeOf(levelOf(...))`) — وتلميذٌ يُمتحَن أوّلَ مرّة درجةُ كلِّ كلمةٍ عنده صفرٌ،
 * فيصير سؤالُ الامتحان **تتبّعاً على مسارٍ مرسوم**: يدُه تمشي على الخطّ فتُقبَل، ويُفتح
 * له ما لم يُثبته. **وادّعاءُ اليد لا يُقبل إلا من اليد.**
 *
 * **والقياسُ `نسخ` بصدق** (`METHOD.md §٦`: «النموذجُ هو المقياس — يُكتب ما وقع على
 * اللوح»): النموذجُ مرئيٌّ فوق اللوح، فليس إملاءً وإن كان الصندوقُ فارغاً.
 */
function wordExam(item, api) {
  const ref = WORD_PATHS[item.unit];
  if (!ref) return h('p', { class: 'hint' }, `لا مسارَ لـ«${item.unit}» بعدُ.`);
  const line = item.form === progress.SENTENCE_FORM;
  const ask = line ? SAY.line : SAY.word;

  const box = h('div', { class: 'exercise' });
  let faults = 0;
  let kit = null;
  releaseCatchup();
  const surface = penSurface({
    ref,
    mode: MODES.FREE,
    // **السماحةُ والمسطرةُ من المسار نفسِه** — «النموذجُ هو المقياس» (`METHOD.md §٣.٢`)
    // **ولا توسيعَ لها في الامتحان**: العونُ الذي يجيب يُمنع (وطبقتاه: لا استيرادَ
    // هنا، ونطاقُ `duringExam` أدناه يردّ ما يمسّ القياسَ إلى القائم ولو استُدعي).
    tolerance: ref.tolerance,
    pace: demoPace(),
    baseline: ref.line,
    label: `لوحُ لحاق: ${item.unit}`,
    onFault: (fault) => {
      faults++;
      progress.recordFault(item.unit, fault.code);
      if (faults >= FREE.stumbles) kit?.open();
    },
    onStuck: () => kit?.open(),
    onDone: () => {
      const clean = faults === 0;
      // **وإنتاجٌ حرٌّ نظيفٌ غير مكشوفٍ يُنضج الكلمة** كما يُنضجها البستانُ والمراجعة
      // (ب١ و أ١): كتابةٌ بلا نموذجٍ تحت اليد إنتاجٌ متباعدٌ حقيقيّ. **وسطرُ المسافة
      // ليس كلمةً تنضج** ولا صوتَ له، فلا يدخل سلّماً غايتُه الإملاء.
      if (clean && !kit?.shown && !item.space && !line) progress.recordRead(item.unit);
      api.score(item, item.unit, item.form, clean, progress.KINDS.COPY);
      if (clean) api.right(surface.el);
      else api.wrong(surface.el, () => api.next());
    },
  });
  live = surface;
  kit = assistFoot({
    surface,
    mode: MODES.FREE,
    skip: () => {
      api.score(item, item.unit, item.form, false, progress.KINDS.COPY);
      api.next();
    },
  });
  box.append(
    h('div', { class: 'copy-model' }, refGlyph(ref, 'ref-glyph copy-model-glyph')),
    h('p', { class: 'ask' }, ask),
    surface.el,
    kit.el,
  );
  // **العرضُ التلقائيّ لا يفتح لوحَ كتابة** (توحيدُ بلاغ المالك، ٢٣ أغسطس
  // ٢٠٢٦ — القاعدةُ الواحدة في كل الشاشات): القلمُ بيد الطفل من أول لمسة،
  // والإعادةُ بزرّ الطلب.
  surface.el.addEventListener('pointerdown', () => surface.stop(), { capture: true });
  api.say(ask, item.say);
  return box;
}

/**
 * **مُصيِّراتُ الامتحان**: الحرفُ (والرقمُ والشكلُ والاسم) **بتمرين المراجعة الحرّ
 * بعينه** — هو نمطُ خطوة «اكتبه وحدك» بشروط المسار — والكلمةُ والجملةُ بتمرين الشكل.
 * **فلا حَكَمَ جديدٌ في الامتحان، وإنما اختيارُ درجةٍ قائمة.**
 */
/**
 * **ونطاقُ المسطرة الواحدة يلفّ بناءَ كل تمرين** (بلاغ `support-and-placement-coexist`):
 * `duringExam` نداءٌ **متزامن** يردّ الحالَ في `finally` — فمقابضُ الصعوبة (الجرعةُ
 * والسماحةُ الموسَّعة) تعود إلى القائم ما دام التمرينُ يُبنى، وتسري مقابضُ الراحة
 * (نموذجٌ أبطأ وخطٌّ أغلظ وهدوءٌ حسّيّ) كما تسري خارجَه: **طفلٌ يُمتحَن بشاشةٍ تُربكه
 * يُقاس إرباكُه لا معرفتُه**، وطفلٌ يُفتَح له بسماحةٍ أوسع يُفتَح له ما لم يُثبته.
 *
 * **ولا عَلَمَ يُخزَّن**: مدّةُ بناءٍ لا حالٌ تعبر إعادةَ التحميل (العَلَمُ المخزَّن
 * يعلق مفتوحاً — عيبُ حالةٍ صامت). والسماحةُ تُقرأ **لحظةَ بناء اللوح** فيكفيه النطاق.
 */
const examView = (view) => (item, api) => duringExam(() => view(item, api));

const EXAM_VIEWS = {
  [progress.KINDS.FREE]: examView(VIEWS[progress.KINDS.FREE]),
  [progress.KINDS.COPY]: examView(wordExam),
};

/**
 * **تمرينُ الامتحان من مادّته** — الحرفُ بمفتاحه الثلاثيّ ونصُّه اسمُه، والكلمةُ
 * والجملةُ بمحورهما وتعليمةِ درجتِهما وصوتِهما من بنك اقرأ. **ولا نصَّ يُؤلَّف**:
 * `texts` للتحميل المسبق ولفحص تغطية الصوت، وكلُّها من مالكيها.
 */
export function itemOf(unit) {
  if (unit.letter) {
    return {
      kind: progress.KINDS.FREE,
      unit: unit.letter,
      form: unit.form,
      texts: [letterName(unit.letter)],
    };
  }
  const line = unit.form === progress.SENTENCE_FORM;
  return {
    kind: progress.KINDS.COPY,
    unit: unit.text,
    form: unit.form,
    say: unit.say,
    space: Boolean(unit.space),
    texts: [line ? SAY.line : SAY.word, unit.say].filter(Boolean),
  };
}

// ————— الشاشات —————

const wrap = (...body) => h('div', { class: 'screen', css: { '--accent': PAUSE_ACCENT } },
  topbar(
    h('button', { class: 'btn', onclick: () => { closeCatchup(); go('#/'); } }, '→ الخريطة'),
    h('span', { class: 'spacer' }),
    h('span', { class: 'pill' }, PILL),
  ),
  h('main', { class: 'screen-card' }, ...body),
);

const nodesText = (n) => arCount(n, ['عقدة واحدة', 'عقدتين', 'عقد', 'عقدة']);
const unitsText = (n) => arCount(n, ['وحدة واحدة', 'وحدتين', 'وحدات', 'وحدة']);

/** سطرُ الحصيلة — يُقال في كل ختامٍ وفي اللوحة: ما فُتح، وما لم يُغلق. */
function harvestLines() {
  return [
    h('p', { class: 'hint' }, state.units
      ? `أثبتَ ${unitsText(state.units)} فتحت له ${nodesText(state.opened)}.`
      : 'لم تُثبَت وحدةٌ في هذه الجولة — ولم يُغلق شيءٌ كان مفتوحاً.'),
    h('p', { class: 'note' },
      'ولا يُغلق ما فُتح أبداً: الامتحانُ يفتح ولا يقفل، وتُعاد فتحتُه متى شئتَ'
      + ' من لوحة وليّ الأمر فيستأنف من آخر وحدةٍ حُسمت.'),
  ];
}

/** ختامُ الجولة: شرخٌ، أو بوابةٌ بلغها، أو رحلةٌ تمّت. */
function endScreen() {
  const end = state.end;
  const head = end.kind === 'crack'
    ? [
      mascot('mascot mascot--hello'),
      h('div', { class: 'celebrate-face' }, icon('smile')),
      h('h2', {}, 'وَقَفْنَا هُنَا'),
      h('p', { class: 'rule' }, end.name),
      h('p', { class: 'hint' },
        `أصاب ${arNum(end.right)} من ${arNum(end.tries)} محاولة`
        + ` (${arNum(end.rate)}٪) — ودون ${arNum(end.need)}٪ يبدأ من هذه الوحدة.`),
    ]
    : end.kind === 'gate'
      ? [
        mascot('mascot mascot--cheer'),
        h('div', { class: 'celebrate-face' }, icon('gate')),
        h('h2', {}, 'بَلَغَ البَوَّابَة'),
        h('p', { class: 'rule' }, end.name),
        h('p', { class: 'hint' },
          'وبوّاباتُ الإتقان لا تُقفَز: أوصله الامتحانُ إليها، ويعبرها بيده من الخريطة'
          + ' — ثم أعِد فتح الامتحان ليُكمل ما بعدها.'),
      ]
      : [
        mascot('mascot mascot--cheer'),
        h('div', { class: 'celebrate-face' }, icon('party')),
        h('h2', {}, ...cheer('أَثْبَتَ الرِّحْلَةَ كُلَّهَا')),
      ];

  return wrap(h('div', { class: 'celebrate' },
    ...head,
    ...harvestLines(),
    h('div', { class: 'row foot' },
      h('button', {
        class: 'btn btn--primary',
        onclick: () => { closeCatchup(); go('#/'); },
      }, '→ الخريطة')),
  ));
}

/** إنهاءُ الجولة: تُحفَظ حصيلتُها لتقرأها اللوحة، وتُعرَض شاشةُ ختامها. */
function end(info) {
  state.end = info;
  state.last = { at: Date.now(), opened: state.opened, units: state.units, ...info };
}

/** جولةُ وحدةٍ واحدة — محرّكُ الجلسة القائم بمادّةِ العيّنة وحكمِ البوابة. */
function round(entry, rerender) {
  const name = sectionName(entry.section);

  return renderSession({
    make: () => entry.sample.map(itemOf),
    views: EXAM_VIEWS,
    // 🚪 **والمخرجُ الكريم في الامتحان كما في البوابة** (م٥): «شاهِدْ» لا يُحصى خطأً
    // — الامتحانُ يقيس **مهارةَ اليد** لا الاستذكارَ الأعمى، ورؤيةُ الشكل لا تمنح
    // حركتَه. **و«تَخَطَّ» يُحصى محاولةً غيرَ مصيبة** فتنزل النسبةُ بصدق.
    assist: true,
    pill: PILL,
    accent: PAUSE_ACCENT,
    leaveAsk: 'تريد الخروج قبل إتمام هذه الوحدة؟ ما أُثبت قبلها محفوظ.',
    header: h('div', { class: 'gate-head' },
      h('div', {},
        h('h2', {}, name),
        h('p', { class: 'hint' },
          `عيّنةٌ من ${arNum(entry.sample.length)} كتابة من ${arNum(entry.materials.length)}`
          + ' — اكتبها بيدك، فما تثبته يُفتح لك.'),
      ),
    ),
    verdict: ({ right, errors }) => {
      const tries = right + errors;
      const rate = tries ? Math.round((right / tries) * 100) : 0;
      const open = passed(right, errors);
      if (!open) {
        end({ kind: 'crack', name, right, tries, rate, need: PASS_PERCENT });
        return h('div', { class: 'celebrate celebrate--again' },
          mascot('mascot mascot--hello'),
          h('div', { class: 'celebrate-face' }, icon('smile')),
          h('h2', {}, 'وَقَفْنَا هُنَا'),
          h('p', { class: 'rule' }, name),
          h('p', { class: 'hint' },
            `أصاب ${arNum(right)} من ${arNum(tries)} محاولة (${arNum(rate)}٪)`
            + ` — ودون ${arNum(PASS_PERCENT)}٪ يبدأ رحلتَه من هذه الوحدة.`),
          ...harvestLines(),
          h('div', { class: 'row foot' },
            h('button', {
              class: 'btn btn--primary',
              onclick: () => { closeCatchup(); go('#/'); },
            }, '→ الخريطة')),
        );
      }
      state.units++;
      state.opened += openThrough(entry);
      return h('div', { class: 'celebrate' },
        mascot('mascot mascot--cheer'),
        h('div', { class: 'celebrate-face' }, icon('pen')),
        h('h2', {}, ...cheer('أَثْبَتَّهَا')),
        starsRow(3, 'big-stars'),
        h('p', { class: 'rule' }, name),
        h('p', { class: 'hint' },
          `أصاب ${arNum(right)} من ${arNum(tries)} محاولة (${arNum(rate)}٪) — فُتحت له.`),
        h('div', { class: 'row foot' },
          h('button', { class: 'btn btn--primary', onclick: rerender }, 'الوحدةُ التالية →'),
          h('button', {
            class: 'btn',
            onclick: () => { closeCatchup(); go('#/'); },
          }, 'يكفي اليوم — الخريطة')),
      );
    },
  });
}

/**
 * **الشاشة**: وحدةُ السلّم الجارية، أو ختامُها.
 *
 * **ولا تُفتَح إلا من اللوحة** (القيد ١): من بلغ العنوانَ بلا مرورٍ ببوابة وليّ الأمر
 * يردّه الموجّهُ إلى الخريطة — فحمايةُ الامتحان بالبناء لا بزرٍّ يُخفى.
 */
export function renderCatchup(rerender) {
  if (!state.open) return null;
  if (state.end) return endScreen();
  const steps = ladder();
  const head = steps[0];
  if (!head) {
    end({ kind: 'complete' });
    return endScreen();
  }
  if (head.gate) {
    end({ kind: 'gate', name: sectionName(head.section) });
    return endScreen();
  }
  return round(head, rerender) || wrap(h('p', { class: 'hint' }, 'لا مادّةَ لهذه الوحدة.'));
}
