// لوحة وليّ الأمر (`METHOD.md §٦`) — خلف بوابة عملية حسابية بسيطة لا يحلّها طفل
// الخامسة: أين يتعثّر بالضبط، وكم دقيقة تعلّم، وما توصية اليوم.
//
// **من بذرة اقرأ** (`FAMILY.md §٥`: «`parent.js` — **البنية والبوابة الحسابية**»):
// فالمنقولُ البوابةُ الحسابية والقشرةُ وأقسامُ الزمن والنسخة الاحتياطية والتحكّم في
// الرحلة والمعاينة — **وأقسامُ مادّة اقرأ لم تُنقَل** (العلاماتُ والجذورُ وتسجيلاتُ
// الصوت و«نحو القراءة الحرة»)، ولكلٍّ سببُه مكتوباً في موضعه أدناه.
//
// **وقلبُ هذه اللوحة** هو **عدّادُ أخطاء الاتجاه المميَّز** (`METHOD.md §٦`: «الذهبُ
// القياسيّ لهذا التطبيق») — أن تقول اللوحةُ **«يبدأ الميمَ من أسفل»** لا «أخطأ في
// الميم». **وقد مُلئ في الجلسة ١٠** بعد أن كتب `pen.js` موضعَ الخطأ الحركيّ (الجلسة
// ١) وقاسته الشاشاتُ كلُّها (٥ فما بعدها) — **وجملتُه تُبنى ولا تُكتب**: شقُّها
// الثابتُ `FAULT_TEXT` من المحرّك نفسِه، وتُتمّه الوحدةُ من الرحلة نفسِها.
//
// الشاشة لا تنطق شيئاً (لا صوت فيها أصلاً)، وتُبنى من نفس مفردات التنسيق القائمة
// (pill · vchip · note · chip) وتُلوَّن بمتغيّر --accent، فلا تحتاج تنسيقاً جديداً.

import * as progress from './progress.js';
import { FAULTS, FAULT_TEXT, SIZE } from './pen.js';
import { nameGap } from './lesson.js';
import {
  h, fill, go, toast, arNum, arCount, topbar, letterTitle, nodeTitle, nodeWhere, stageTitle,
  shake,
} from './ui.js';
// **«بلِّغنا» وحدةٌ مستقلة عمداً** (الجلسة ب): تحمل روابطَ خارجية بطبعها، وحارسُ
// خصوصية القلم يمنع `https://` في حاملي مسار الطفل — **فلا يجمعهما ملفٌ أبداً**،
// وتبقى هذه اللوحةُ صفرَ عناوين. تُستدعى ولا يُكتب رابطُها هنا.
import { feedbackSection } from './feedback.js';
import { consentState, setConsent, NOTICE } from './consent.js';
// **بوابةُ اللحاق** (`FAMILY §١٠/هـ`، قرارُ المالك ١٦ أغسطس ٢٠٢٦): امتحانُ تحديد
// مستوىً اختياريّ — **بابُه هذه اللوحةُ حصراً ولا زرَّ له في شاشة طفل** (القيد ١).
import { openCatchup, lastResult, ladder, PASS_PERCENT } from './catchup.js';
// **وضعُ الدعم — بابُه هذه اللوحة وحدَها** (جلسة د): مفاتيحُه من جدوله المعلَن لا
// مكتوبةً بيد، وسطرُ وعده وعلامتُه من مالكهما — فلا يفترق ما يقرؤه الوالدُ عمّا يقع.
import * as support from './support.js';

const ACCENT = 'var(--accent-skills)';
const GOOD = 'var(--ok)';
const BAD = 'var(--err)';
const DAY_NAMES = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const ENOUGH_MINUTES = 20;   // نصيب اليوم لطفل الخامسة — بعده تُنصح الاستراحة

let unlocked = false;        // البوابة تُفتح لهذه الجلسة فقط (لا تُحفظ في التخزين)

/** ثوانٍ ← نصّ عربي مقروء. */
export function minutesText(seconds) {
  if (!seconds) return 'لا شيء';
  if (seconds < 60) return 'أقل من دقيقة';
  return arCount(Math.round(seconds / 60), ['دقيقة واحدة', 'دقيقتان', 'دقائق', 'دقيقة']);
}

/** «مهارة واحدة» · «مهارتين» · «٥ مهارات» · «١٢ مهارة» — مفعولاً به في سياق التثبيت. */
export const skillsText = (n) => arCount(n, ['مهارة واحدة', 'مهارتين', 'مهارات', 'مهارة']);

// **و`secondsText` لم تبقَ** (الجلسة ١٠): كانت في اقرأ تكتب **مدد القراءة الجهرية**
// بدقّة الثانية — ولا قراءةَ جهرية هنا ولا تسجيلَ صوت، فما نادى أحدٌ الدالّةَ منذ
// نُسخت البذرة. حذفُ ما لا موضوعَ له كحذف `markStats` أدناه، لا تعليقٌ يُنتظَر.

/** لحظة التسجيل كما يقرؤها وليّ الأمر: «أحد ٣/٨ · ٦:٤٠». */
export function whenText(at) {
  const d = new Date(at);
  const time = `${arNum(d.getHours())}:${arNum(String(d.getMinutes()).padStart(2, '0'))}`;
  return `${DAY_NAMES[d.getDay()]} ${arNum(d.getDate())}/${arNum(d.getMonth() + 1)} · ${time}`;
}

/**
 * توصية اليوم — دالّة خالصة تُختبر وحدها.
 * الترتيب مقصود: صحّة الطفل (سقف الوقت) قبل التحصيل، والمراجعة قبل الجديد
 * (ما تعثّر فيه أولى بالتثبيت من درس جديد يُبنى على متزعزع).
 */
export function recommend({ letters = 0, dueCount = 0, secondsToday = 0, reviewDone = false, next = null } = {}) {
  const minutes = Math.round(secondsToday / 60);
  if (!letters) {
    return { title: 'ابدآ الرحلة معاً', body: 'أوّلُ محطات التهيئة الحركية — اجلس معه في أول محطتين حتى تتضح له اللعبة.', action: next && { label: 'افتح درسه الأول', hash: '#/' } };
  }
  if (minutes >= ENOUGH_MINUTES) {
    return { title: 'أخذ نصيبه اليوم', body: `تعلّم اليوم ${minutesText(secondsToday)} — الزيادة على هذا تُتعب طفل الخامسة أكثر مما تنفعه. أعِده غداً.`, action: null };
  }
  if (dueCount && !reviewDone) {
    return { title: 'ابدأ بمراجعة اليوم', body: `حان وقت تثبيت ${skillsText(dueCount)} (تمارين قصيرة مما كتبه). المراجعة قبل الدرس الجديد.`, action: { label: 'ابدأ المراجعة', hash: '#/review' } };
  }
  if (next) {
    return { title: 'واصِلا الدرس التالي', body: `التالي في رحلته: ${nodeTitle(next)}.`, action: { label: 'افتح الخريطة', hash: '#/' } };
  }
  return { title: 'أتمّ رحلة التأسيس كلها', body: 'أعِد معه المراجعة اليومية — وبابُ «أَتْقِنْ» بعدها.', action: { label: 'ابدأ المراجعة', hash: '#/review' } };
}

// ————— البوابة الحسابية —————

function question() {
  const a = 6 + Math.floor(Math.random() * 7);    // ٦…١٢
  const b = 7 + Math.floor(Math.random() * 6);    // ٧…١٢
  return { a, b, answer: a * b };
}

/** يقبل الرقمين العربي والهندي معاً. */
export function readNumber(text) {
  const normalized = String(text ?? '').trim().replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  return /^\d+$/.test(normalized) ? Number(normalized) : NaN;
}

/**
 * بطاقة البوابة — عمليةُ ضربٍ لا يحلّها طفل السادسة.
 * تُستعمل شاشةً كاملة للوحة، و**نافذةً فوق شاشة القصة** حين يُطلب إذنُ الميكروفون
 * أول مرة (بند الحزمة ١٠/٤): بوابةٌ واحدة لا نسختان منها.
 */
export function gateCard({ hint: hintText = 'هذه الشاشة لوليّ الأمر — أجب لتدخل.', onPass, onCancel } = {}) {
  let q = question();
  const prompt = h('div', { class: 'giant', css: { '--accent': ACCENT, 'font-size': '2.6rem' } },
    `${arNum(q.a)} × ${arNum(q.b)}`);
  const input = h('input', {
    class: 'chip',
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'off',
    'aria-label': 'ناتج الضرب',
    css: { 'min-width': '8rem', 'text-align': 'center', border: '2px solid var(--line)', font: 'inherit' },
  });
  const hint = h('p', { class: 'hint' }, hintText);

  function check() {
    if (readNumber(input.value) === q.answer) {
      // بند الحزمة ١١: عند أول بوابةِ وليّ أمر يُطلب التخزين الدائم — فعلُ بالغٍ لا
      // فعلُ طفل، ووراءه نيّةٌ معلَنة (فتحُ لوحته أو الإذن بالتسجيل). ورفضُه لا يعطّل
      // شيئاً، ولا ننتظر جوابه كي لا تتأخّر الشاشة على وليّ الأمر.
      progress.askPersistence();
      return onPass();
    }
    shake(input);
    input.value = '';
    q = question();
    prompt.textContent = `${arNum(q.a)} × ${arNum(q.b)}`;
    hint.textContent = 'ليس هذا الناتج — جرّب هذه.';
    input.focus();
  }

  return h('div', { class: 'gate', css: { '--accent': ACCENT } },
    h('h2', {}, 'كم الناتج؟'),
    prompt,
    hint,
    h('div', { class: 'row' },
      input,
      h('button', { class: 'btn btn--primary gate-go', onclick: check }, 'ادخل'),
      onCancel && h('button', { class: 'btn gate-cancel', onclick: onCancel }, 'ليس الآن'),
    ),
  );
}

function gateScreen(onPass) {
  return h('div', { class: 'screen', css: { '--accent': ACCENT } },
    topbar(
      h('button', { class: 'btn', onclick: () => go('#/') }, '→ الخريطة'),
      h('span', { class: 'spacer' }),
      h('span', { class: 'pill' }, 'لوحة وليّ الأمر'),
    ),
    h('main', { class: 'screen-card' }, gateCard({ onPass })),
  );
}

// ————— اللوحة —————

function pill(label, value) {
  return h('span', { class: 'pill' }, `${label}: `, h('b', {}, value));
}

function letterChip(stat, color) {
  return h('span', {
    class: 'vchip',
    css: { '--accent': color },
    title: `${letterTitle(stat.letter)} — ${arNum(stat.right)} صواب، ${arNum(stat.wrong)} خطأ`,
  },
    h('span', { class: 'vchip-face' }, stat.letter),
    h('small', {}, `${arNum(stat.right)} ✓ · ${arNum(stat.wrong)} ✗`));
}

// ————— خرائطُ أخطاء الاتجاه — الذهبُ القياسيّ لهذا التطبيق (`METHOD.md §٦`) —————
//
// **«يبدأ الميمَ من أسفل» لا «أخطأ في الميم»**. وهذا القسمُ **لا يكتب جملةً بيد**:
//   · **شقُّها الثابت** `FAULT_TEXT` من `pen.js` — لغةُ المحرّك الذي حكم بالخطأ
//     نفسِه، فلا قائمةَ ثانيةٌ هنا تشيخ يومَ يُضاف رمزٌ أو يتبدّل وصفُه.
//   · **وتُتمّه الوحدةُ** من الرحلة نفسِها (`unitTitle`): الحرفُ «حرف ميم»، ومحطةُ
//     التهيئة عنوانُها المشكول، والكلمةُ والجملةُ نصُّهما كما كُتبتا.
//   · **والمعدودُ عدّادُ `progress.faults()`** — رمزُ الخطأ ومرّاتُه، لا أثرُ يد:
//     مسارُ قلم الطفل لم يُخزَّن أصلاً (`METHOD.md §٣.٧`)، وموضعُ الخطأ محفوظٌ في
//     **اسمه** (`start-end` = «يبدأ من الطرف الآخر») لا في إحداثيّ.
//
// **وهو غيرُ لوحة الحروف**: تلك تقول **كم** أصاب وأخطأ، وهذه تقول **كيف** أخطأ —
// وبها وحدَها يعرف وليُّ الأمر ما يُصحَّح بإصبعه على الطاولة.

/** كم وحدةً تُعرض خريطتُها — **والمحجوبُ يُقال عدداً** لا يُبتلع صامتاً. */
export const FAULT_UNITS = 8;

/** ترتيبُ الرموز عند تساوي العدد: ترتيبُ إعلان المحرّك لا ترتيبُ الأبجدية. */
const FAULT_ORDER = Object.values(FAULTS);

const timesText = (n) => arCount(n, ['مرة واحدة', 'مرتان', 'مرات', 'مرة']);

// عناوينُ الوحدات تُقرأ من الرحلة مرّةً: بنيةُ المنهج ثابتةٌ وقت التشغيل (كما في
// `progress.js`)، والوحدةُ التي لا عقدةَ لها — كلمةٌ أو جملة — **نصُّها عنوانُها**.
let titleCache = null;
function titles() {
  if (titleCache) return titleCache;
  titleCache = new Map();
  for (const node of progress.allNodes()) {
    if (node.type === 'warmup') titleCache.set(node.part, nodeTitle(node));
    else if (node.type === 'letter') titleCache.set(node.letter, letterTitle(node.letter));
  }
  return titleCache;
}

/** عنوانُ وحدةٍ كما يقرؤه وليّ الأمر — من الرحلة، ولا اسمَ يُكتب بيد. */
export const unitTitle = (unit) => titles().get(unit) || String(unit ?? '');

/**
 * **جملةُ الخطأ الحركيّ مبنيّةً**: عنوانُ الوحدة ثم شقُّ المحرّك الثابت.
 * ورمزٌ لا يعرفه `FAULT_TEXT` **لا يُخترع له نصّ** — يسقط من العرض ويُمسِكه الفاحص.
 */
export function faultLine(fault) {
  const clause = FAULT_TEXT[fault?.code];
  return clause ? `${unitTitle(fault.unit)} — ${clause}` : '';
}

/**
 * خريطةُ الأخطاء مرتَّبةً: الوحدةُ الأكثرُ تعثّراً أولاً، وداخلَها الخطأُ الأكثرُ
 * تكراراً أولاً — فأوّلُ ما تقع عليه عينُ وليّ الأمر أولى ما يُصحَّح.
 */
export function faultMap(list = progress.faults()) {
  const byUnit = new Map();
  for (const fault of list) {
    const text = faultLine(fault);
    if (!text) continue;
    const entry = byUnit.get(fault.unit)
      || { unit: fault.unit, title: unitTitle(fault.unit), total: 0, lines: [] };
    entry.total += fault.n;
    entry.lines.push({ code: fault.code, n: fault.n, text });
    byUnit.set(fault.unit, entry);
  }
  for (const entry of byUnit.values()) {
    entry.lines.sort((a, b) => b.n - a.n
      || FAULT_ORDER.indexOf(a.code) - FAULT_ORDER.indexOf(b.code));
  }
  return [...byUnit.values()]
    .sort((a, b) => b.total - a.total || a.title.localeCompare(b.title, 'ar'));
}

// ————— سطرُ الجودة: **الحكمُ الثالث** «صحيحٌ ويدُه ترتجف» (م١٠) —————
//
// **العلّة** (`ENGINE_PLAN §٣ب-٢`، قراءةُ iTrace): عندنا «مقبول» و«مردود»، وبينهما
// حالٌ ثالثة هي أطبعُ ما يكتبه طفلُ الخامسة — **حرفٌ صحيحٌ ويدٌ ترتجف**. والمحرّكُ
// يحسبها مع كلِّ قبولٍ ويسلّمها في حمولته، فتُقيَّد بمفتاح مهارتها (`recordQuality`)
// وتُقرأ هنا.
//
// **ومصدرُ النصّ واحدٌ كما في الأخطاء**: ما له نصٌّ معتمدٌ في المحرّك يُقرأ منه بحرفه
// (`FAULT_TEXT` — إرشاداتُ الطريقة كلُّها)، **ولا يُخترَع له نصّ**. والباقي وصفان
// لا رمزَ خطأٍ لهما أصلاً — الرجفةُ والحجم — فجملتُهما هنا، وهي **جملةُ وليّ أمرٍ
// تصف حالاً** لا تعليمةَ طفلٍ تُقال له (تلك في `SIZE_TEXT` وموضعُها لوحُ الكتابة).
//
// 🔴 **وهو وصفٌ لا عقاب** (عهدُ لا-رسوب): هذه السطورُ كلُّها **محاولاتٌ قُبلت**
// ومهارتُها كُتبت في ليتنر تامّةً — ولا تنقص نجمةً ولا تعيد صندوقاً.

/**
 * **رمزُ الرجفة كما يسمّيه المحرّك** — يدفعه `judgeShape` في `guides` ولا يُصدّره
 * ثابتاً، فيُكتب هنا مرّةً **ويحرسه `test_parent`** (مقابلةُ الرمز بما يدفعه المحرّك
 * فعلاً): يومَ يتبدّل اسمُه يحمرّ الفحصُ ولا يصمت السطر.
 */
export const SHAKY = 'shaky';

/** الوصفان اللذان لا رمزَ خطأٍ لهما — بلسان وليّ الأمر (ثلاثيّةُ iTrace معرَّبة). */
/** رمزُ المضيّ قبل القبول — تدفعه شاشاتُ الكتابة عند زرّ «تَابِعْ» (مرسومُ
 *  ٢٣ أغسطس: التقييمُ لوليّ الأمر لا بوّابةَ على الطفل). */
export const PASSED_ON = 'passed-on';

const QUALITY_TEXT = {
  [PASSED_ON]: 'مَضى قبل تمام القبول',
  [SHAKY]: 'صحيحٌ ويدُه ترتجف',
  [SIZE.BIG]: 'يكتبه كبيراً',
  [SIZE.SMALL]: 'يكتبه صغيراً',
};

/** ترتيبُ أوصاف الجودة عند تساوي العدد: الرجفةُ فالحجمُ ثم ترتيبُ المحرّك للطريقة. */
const QUALITY_ORDER = [...Object.keys(QUALITY_TEXT), ...FAULT_ORDER];

/**
 * **جملةُ الوصف مبنيّةً**: عنوانُ الوحدة ثم الوصف — من `QUALITY_TEXT` لما لا رمزَ
 * خطأٍ له، ومن `FAULT_TEXT` لما له نصٌّ معتمد. ورمزٌ لا يعرفه واحدٌ منهما **لا
 * يُخترع له نصّ**: يسقط من العرض كما يسقط رمزُ الخطأ المجهول.
 */
export function qualityLine(entry) {
  const clause = QUALITY_TEXT[entry?.code] || FAULT_TEXT[entry?.code];
  return clause ? `${unitTitle(entry.unit)} — ${clause}` : '';
}

/** «آخرُ حالٍ» بطابعه: يومُ التسجيل مقروءاً بلسان اليوم لا برقمٍ مبهم. */
export const seenText = (day, today = progress.dayNumber()) => {
  const ago = today - day;
  if (!Number.isFinite(ago) || ago <= 0) return 'آخرُها اليوم';
  if (ago === 1) return 'آخرُها أمس';
  return `آخرُها قبل ${arCount(ago, ['يومٍ واحد', 'يومين', 'أيام', 'يوماً'])}`;
};

/**
 * خريطةُ الجودة مجموعةً بوحدتها — الوحدةُ الأكثرُ وصفاً أولاً، وداخلَها الأكثرُ
 * تكراراً. **ووحدةٌ بلا سجلٍّ لا تدخلها أصلاً** فلا أصفارَ تملأ اللوحة.
 */
export function qualityMap(list = progress.quality()) {
  const byUnit = new Map();
  for (const item of list) {
    const text = qualityLine(item);
    if (!text) continue;
    const entry = byUnit.get(item.unit)
      || { unit: item.unit, title: unitTitle(item.unit), total: 0, lines: [] };
    const line = entry.lines.find((l) => l.code === item.code);
    // **والمفتاحُ مفتاحُ مهارة** (حرف × شكل موقع × نوع)، والسطرُ سطرُ وحدة: تُجمع
    // أوصافُ الحرف من تتبّعه وحرّه معاً — فيقرأ الوالدُ حالَ يده لا جدولَ تمارين.
    if (line) { line.n += item.n; line.seen = Math.max(line.seen, item.seen); }
    else entry.lines.push({ code: item.code, n: item.n, seen: item.seen, text });
    entry.total += item.n;
    byUnit.set(item.unit, entry);
  }
  for (const entry of byUnit.values()) {
    entry.lines.sort((a, b) => b.n - a.n
      || QUALITY_ORDER.indexOf(a.code) - QUALITY_ORDER.indexOf(b.code));
  }
  return [...byUnit.values()]
    .sort((a, b) => b.total - a.total || a.title.localeCompare(b.title, 'ar'));
}

/** كتلةُ الجودة في اللوحة — **ولا شيءَ ألبتّة لمن لا سجلَّ له**. */
function qualityBlock() {
  const map = qualityMap();
  if (!map.length) return null;
  const shown = map.slice(0, FAULT_UNITS);
  const hidden = map.length - shown.length;
  return h('div', {},
    h('p', { class: 'hint' },
      'وهذه محاولاتٌ **قُبلت** ووُصف حالُها — الحكمُ الثالث بين «صحيح» و«خطأ»:'
        .replace(/\*\*/g, '')),
    h('ul', { class: 'faults' }, shown.flatMap((unit) => unit.lines.map((line) =>
      h('li', { class: 'fault fault--quality' }, line.text, ' · ',
        h('b', {}, timesText(line.n)), ' · ', seenText(line.seen))))),
    hidden > 0 && h('p', { class: 'hint' },
      `وأخفينا ${arCount(hidden, ['وحدةً واحدة', 'وحدتين', 'وحدات', 'وحدة'])} أقلَّ وصفاً.`),
    h('p', { class: 'note' },
      'ولا ينقص شيءٌ من نجومه بها: الحرفُ قُبل وسُجِّلت مهارتُه كاملة، وإنّما تقول لك'
      + ' **كيف** كتبه لتكتبه معه بإصبعك على الطاولة.'.replace(/\*\*/g, '')),
  );
}

function faultsSection() {
  const map = faultMap();
  const shown = map.slice(0, FAULT_UNITS);
  const hidden = map.length - shown.length;
  const total = map.reduce((sum, unit) => sum + unit.total, 0);

  if (!map.length) {
    return h('div', {},
      h('p', { class: 'hint' },
        'لم تُسجَّل حركةٌ خاطئة بعدُ — لا لأنه معصوم، بل لأنّ يده لم تمشِ بعدُ ما يكفي.'
        + ' وحين تمشي سترى هنا **كيف** يخطئ لا كم أخطأ.'.replace(/\*\*/g, '')),
      // **وقد يُقبَل ولا يُخطئ ومع ذلك يُوصَف** (م١٠): كتلةُ الجودة تقف بنفسها،
      // فلا تُحبَس خلف وجود خطأ.
      qualityBlock(),
    );
  }

  return h('div', {},
    h('div', { class: 'audit-row' },
      pill('حركاتٌ خاطئة', arNum(total)),
      pill('في وحدات', arNum(map.length)),
    ),
    h('ul', { class: 'faults' }, shown.flatMap((unit) => unit.lines.map((line) =>
      h('li', { class: 'fault' }, line.text, ' · ', h('b', {}, timesText(line.n)))))),
    hidden > 0 && h('p', { class: 'hint' },
      `وأخفينا ${arCount(hidden, ['وحدةً واحدة', 'وحدتين', 'وحدات', 'وحدة'])} أقلَّ تعثّراً`
      + ` — تُعرض هنا ${arNum(FAULT_UNITS)} وحداتٍ لا أكثر كي يُقرأ الأهمّ.`),
    h('p', { class: 'hint' },
      'هذه ليست أخطاءَ إجابة بل **عاداتُ يد**: الحرفُ الصحيحُ شكلاً قد يُرسم بحركةٍ'
      .replace(/\*\*/g, '')
      + ' خاطئة، وتصحيحُها اليومَ أسهلُ من نقضها بعد رسوخها. واكتبها معه بإصبعك على'
      + ' الطاولة وهو ينظر — يرى البداية والاتجاه قبل أن يمسك القلم.'),
    h('p', { class: 'note' },
      'والمعدودُ هنا **اسمُ الخطأ ومرّاتُه** لا أثرُ يده: مسارُ قلمه لا يُخزَّن أصلاً'
      .replace(/\*\*/g, '')
      + ' ولا يغادر جهازه.'),
    qualityBlock(),
  );
}

// ————— لكلِّ نوع تمرينٍ موضعُه (`METHOD.md §٦`) —————
//
// «كلُّ محطةٍ تدرّس مهارةً لها قياسٌ في ليتنر وتمرينُ مراجعةٍ **وموضعٌ في اللوحة**».
// ولوحةُ الحروف تجمع تمارينَ الحرف كلَّها في بطاقةٍ واحدة، فلا يُرى فيها الفرقُ بين
// تتبّعٍ وكتابةٍ حرّة — وهذا الصفُّ يقوله: **أربعةٌ تُقرأ من `KINDS` نفسِها**، فنوعٌ
// يُضاف غداً يظهر هنا بلا سطرٍ يُكتب.

/** حصيلةُ كل نوع تمرين من سجلّ ليتنر — دالّةٌ خالصة يقرؤها الفاحصُ كما تقرؤها اللوحة. */
export function kindPlaces(list = progress.skills(), today = progress.dayNumber()) {
  return Object.values(progress.KINDS).map((kind) => {
    const mine = list.filter((skill) => skill.kind === kind);
    return {
      kind,
      name: progress.KIND_NAMES[kind] || kind,
      measured: mine.length,
      mastered: mine.filter((skill) => skill.box >= progress.MASTERED_BOX).length,
      due: mine.filter((skill) => skill.due <= today).length,
    };
  });
}

function kindsSection() {
  const places = kindPlaces();
  return h('div', {},
    h('div', { class: 'audit-row' }, places.map((place) => pill(place.name,
      place.measured
        ? `${arNum(place.measured)} مقيسة · ${arNum(place.mastered)} متقنة`
        : 'لم يبلغه بعد'))),
    h('p', { class: 'hint' },
      'التتبّعُ والكتابةُ الحرّة وحدتُهما حرف، والنسخُ والإملاءُ وحدتُهما كلمةٌ أو جملة'
      + ' — فلكلٍّ صندوقُ مراجعةٍ مستقل، وحرفٌ يتقنه تتبّعاً قد يتعثّر فيه وحدَه.'),
  );
}

// ————— الكلماتُ والجملُ نسخاً وإملاءً —————
//
// **الكلمةُ ليست حرفاً** فلا تدخل لوحةَ الحروف (وإلا ظهر «حرفٌ» اسمُه «بابا»)، وهي
// مقيسةٌ في ليتنر بنوعين فتُقرأ هنا. **والوحدةُ صفٌّ واحد لا صفّان**: لو عُرضت كلُّ
// مهارةٍ ببطاقتها لَظهرت «بابا» مرّتين بنصٍّ واحد، لا يفرّق الوالدُ نسخَها من إملائها.
//
// **والجملُ صفُّها** (حكمُ الجلسة ٩): محورُها في ليتنر `SENTENCE_FORM` لا محورُ
// الكلمة، فلا يقرأ وليُّ الأمر سطراً كاملاً في صفّ «الكلمات».

/** وحداتُ الكلمة والجملة مجموعةً بوحدتها، ولكلِّ وحدةٍ نسخُها وإملاؤها. */
export function wordUnits(list = progress.skills()) {
  const byUnit = new Map();
  for (const skill of list) {
    if (!progress.isWordSkill(skill)) continue;
    const entry = byUnit.get(skill.unit) || {
      unit: skill.unit,
      sentence: progress.isSentenceSkill(skill),
      kinds: [],
      right: 0,
      wrong: 0,
      box: progress.MAX_BOX,
    };
    entry.kinds.push(skill);
    entry.right += skill.right;
    entry.wrong += skill.wrong;
    entry.box = Math.min(entry.box, skill.box);
    byUnit.set(skill.unit, entry);
  }
  const order = Object.values(progress.KINDS);
  for (const entry of byUnit.values()) {
    entry.kinds.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  }
  return [...byUnit.values()];
}

function wordChip(entry) {
  const color = entry.box >= progress.MASTERED_BOX ? GOOD : entry.wrong >= 2 ? BAD : ACCENT;
  // الصفرُ لا يُكتب: «إملاء ١✗» أوضحُ من «إملاء ٠✓ ١✗» في سطرٍ صغير تحت الكلمة
  const parts = entry.kinds.map((skill) =>
    (progress.KIND_NAMES[skill.kind] || skill.kind)
    + (skill.right ? ` ${arNum(skill.right)}✓` : '')
    + (skill.wrong ? ` ${arNum(skill.wrong)}✗` : ''));
  return h('span', {
    class: 'vchip vchip--tag',
    css: { '--chip': color },
    title: `${entry.unit} — ${parts.join(' · ')}`,
  },
    entry.unit,
    h('small', {}, parts.join(' · ')));
}

// **`markStats` لم تُنقَل**: في اقرأ تجمع مفتاحَي درسِ العلامة (قراءةً وسماعاً) في
// بطاقةٍ واحدة. وعلاماتُ «اُكْتُبْ» — الشدّةُ والتنوينُ والهمزات — **ليست دروساً
// مستقلّة أصلاً**: أقرّ المالك (ق٣) أن تُكتب **في مواضعها ضمن الكلمات** لا محطاتٍ
// مجردة، فلا مفتاحَ ليتنر لها ولا قسمَ لها في اللوحة. حذفُ ما لا موضوعَ له، لا تعليق.

// ————— قسمان من البذرة لم يُنقَلا، ولكلٍّ سببُه —————
//
// **١) «نحو القراءة الحرة»** (`fadingSection`): يعرض في اقرأ كلماتٍ خفت تشكيلُها،
// **ولا نظيرَ له هنا صفّاً مستقلاً** — وقد كان معلَّقاً حتى الجلسة ٩، فلمّا كُتب
// الخفوتُ سقط التعليقُ بحكمه (الجلسة ١٠): ما يخفت عندنا **نموذجُ الكلمة المكتوبة**،
// و**درجتُه لا تُخزَّن أصلاً** بل حاصلُ قسمةٍ يُعاد حسابُه من عدّاد الإصابات
// المتباعدة كلَّ مرة (حكمُ الجلسة ٩). فعرضُ الدرجة نسخةٌ ثانية تفترق عن الشاشة يوماً
// — وثمرتُها مقيسةٌ في ليتنر بعينها: كلمةٌ خفت نموذجُها كلُّه تُقاس **إملاءً** لا
// نسخاً. فصفُّ «الكلمات نسخاً وإملاءً» أدناه هو الخفوتُ مقروءاً في أثره لا في رقمه.
//
// **٢) «تسجيلات طفلي»** (`recordingsSection` ومنحنى الطلاقة): يُسمِع وليَّ الأمر
// صوتَ طفله وهو يقرأ. و«اُكْتُبْ» **لا يلتقط صوتاً ألبتّة** — فحذفٌ لِما لا موضوعَ
// له أبداً، لا تعليق. وأثرُ الطفل الخاصّ هنا **مساراتُ قلمه**، وعهدُها أشدّ:
// **لا تغادر جهازه** (`METHOD.md §٣.٧`)، ويحرسه فحصان في الجلسة ١.

// ————— «نسخة احتياطية» و«تحكّم في الرحلة» (الحزمة ١١) —————
//
// قسمان لوليّ الأمر وحدَه — خلف بوابته الحسابية كبقية اللوحة، ولا أثر لهما في شاشة
// الطفل. الأول يحمي رحلته من ضياع التخزين وتبديل الجهاز، والثاني يجعل التسلسل
// طوعَ وليّ الأمر: يتخطّى به ما يعرفه الطفل، ويعيد به تدريبَ ما تزعزع.

/**
 * تأكيدٌ صريح **في الصفحة** لا بـ`confirm()` — وهذه الأفعال تكتب فوق رحلة الطفل
 * فلا تقع بنقرةٍ واحدة. ونافذة المتصفّح لا تصلح هنا: أزرارها بلغة الجهاز لا بلغتنا،
 * ولا تتّسع لشرح أثر الفعل — وهنا يُقرأ ما سيقع بالضبط قبل أن يقع.
 */
function askThen(box, { question, body, yes, onYes }) {
  const close = () => box.replaceChildren();
  fill(box, h('div', { class: 'note confirm' },
    h('b', {}, question),
    body && h('p', { class: 'hint', css: { margin: '.35rem 0 0' } }, body),
    h('div', { class: 'row', css: { 'justify-content': 'flex-start', 'margin-top': '.6rem' } },
      h('button', { class: 'btn btn--primary confirm-yes', onclick: () => { close(); onYes(); } }, yes),
      h('button', { class: 'btn confirm-no', onclick: close }, 'إلغاء')),
  ));
}

const nodesText = (n) => arCount(n, ['عقدة واحدة', 'عقدتين', 'عقد', 'عقدة']);

/** سطرُ نسخة القشرة قبل أن يصل جوابُها — يُعرَف به أنّ السؤال ما زال معلَّقاً. */
const WAITING = 'نسخة القشرة: …';

/** تنزيل ملف النسخة — نصٌّ في `Blob`، بلا شبكةٍ ولا خادم (كل شيء في الجهاز). */
function saveBackupFile() {
  const url = URL.createObjectURL(
    new Blob([progress.backupText()], { type: 'application/json' }));
  const link = h('a', { href: url, download: progress.backupName() });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 20000);
}

/** ما في النسخة بعبارة وليّ الأمر — يُقرأ قبل التأكيد لا بعده. */
function summaryText(sum) {
  return `★ ${arNum(sum.stars)} في ${nodesText(sum.nodes)} · ${skillsText(sum.skills)} مقيسة`
    + (sum.reads ? ` · ${arCount(sum.reads, ['كلمة واحدة', 'كلمتان', 'كلمات', 'كلمة'])} لها تاريخُ خفوت` : '')
    + (sum.faults ? ` · ${arCount(sum.faults, ['حركةٌ خاطئة واحدة', 'حركتان خاطئتان', 'حركاتٍ خاطئة', 'حركةً خاطئة'])} مسمّاة` : '')
    + (sum.savedAt ? ` · حُفظت ${whenText(sum.savedAt)}` : '');
}

/** **بابُ وضع المعاينة — خلف بوابة وليّ الأمر** (أمر المالك، ١٣ أغسطس ٢٠٢٦):
 *
 *  المقيّمُ يحتاج أن يرى المحطات كلَّها، والطفلُ يحتاج ألّا يقفز إلى ما لم يبلغه.
 *  ولو وُضع الزرُّ في شاشة الطفل لَفتحه بنفسه ولو باللمس العابر — **فموضعُه هذه
 *  اللوحة**: هي محميّةٌ سلفاً بمسألةِ ضربٍ يعجز عنها طفلُ السادسة، وزرُّها ظاهرٌ
 *  أعلى الخريطة. فالتحقّقُ من أنّ المستعمل ليس الطفل قائمٌ بالبناء لا بزرٍّ ثانٍ.
 *
 *  ولا يكتب شيئاً: المعاينةُ تفتح القفلَ وحدَه، ويقول شريطُها ذلك في أعلى الشاشة. */
function previewSection() {
  return h('div', {},
    h('p', { class: 'hint' },
      'تفتح المحطاتِ كلَّها للاطّلاع — تهيئةً وحرفاً ونسخاً وإملاءً — '
      + '**ولا يُحفَظ أيُّ تقدّم**: تُغلق الصفحةَ فيعود الجهازُ كما كان.'
      .replace(/\*\*/g, '')),
    h('div', { class: 'row' },
      h('button', {
        class: 'btn btn--primary',
        onclick: () => { location.href = `${location.pathname}?preview=1`; },
      }, 'افتح وضع المعاينة')),
    h('p', { class: 'note' },
      'وهو للمعلّم أو وليّ الأمر يقيّم التطبيق — لا للطفل: القفلُ التسلسليّ'
      + ' (لا يُعرض عليه ما لم يبلغه) من أسس المنهج لا قيدٍ عليه.'),
  );
}

/**
 * **بوابةُ اللحاق** (`FAMILY §١٠/هـ`، و`METHOD.md §١١`): تلميذُ المدرسة والمراكز يصل
 * بمستوىً قائم — فيُمتحَن **بيده** مرّةً فيُفتح له ما أثبته، ويقف حيث ينكسر.
 *
 * **وموضعُها هنا لا في شاشة طفل** (القيد ١، كموضع «افتح الطريق إلى هنا» سواءً بسواء):
 * فتحُ الرحلة قرارُ بالغٍ، واللوحةُ محميّةٌ سلفاً بمسألة ضربٍ يعجز عنها طفلُ السادسة.
 *
 * **وما تقوله هذه البطاقةُ محسوبٌ من الرحلة** لا مكتوبٌ بيد: أوّلُ وحدةٍ يُمتحَن فيها
 * وحجمُ عيّنتها، وعتبةُ العبور من مصدر البوابات — فلا رقمَ يشيخ.
 */
function catchupSection() {
  const steps = ladder();
  const head = steps[0];
  const result = lastResult();
  const where = !head
    ? 'أتمّ الرحلةَ كلَّها — لا شيءَ بعدُ يُمتحَن فيه.'
    : head.gate
      ? `يقف الآن عند «${head.gate.title}» — والبوّاباتُ لا تُقفَز: يعبرها بيده من`
        + ' الخريطة، ثم يستأنف الامتحانُ ما بعدها.'
      : `يبدأ من «${sectionLabelOf(head)}» بعيّنةِ ${arNum(head.sample.length)} كتابة`
        + ` من ${arNum(head.materials.length)} في الوحدة.`;

  return h('div', {},
    h('p', { class: 'hint' },
      'إن كان طفلك يعرف بعضَ ما في الرحلة أصلاً — من مدرسةٍ أو مركز — فامتحنه هنا:'
      + ' يصعد وحدةً وحدة بترتيب الرحلة، **يكتب بيده** عيّنةً من كل وحدة (لا يختار'
      .replace(/\*\*/g, '')
      + ' صورةً ولا يلمسها)، فما أثبته يُفتح له وعند أوّل وحدةٍ ينكسر فيها يقف.'),
    h('p', { class: 'hint' }, where),
    h('div', { class: 'row', css: { 'justify-content': 'flex-start' } },
      h('button', {
        class: 'btn btn--primary catchup-open',
        disabled: !head || Boolean(head.gate),
        onclick: openCatchup,
      }, 'افتح بوابة اللحاق')),
    result && h('p', { class: 'note' },
      `آخرُ امتحان: ${whenText(result.at)} — أثبت ${arNum(result.units)} وحدةً`
      + ` ففُتحت ${nodesText(result.opened)}.`),
    h('p', { class: 'note' },
      `والعبورُ بإصابة ${arNum(PASS_PERCENT)}٪ فأكثر — صرامةُ بوّابات الإتقان نفسُها.`
      + ' وكلُّ كتابةٍ في الامتحان تُسجَّل في صناديق مراجعته كأيّ كتابةٍ أخرى، فمراجعةُ'
      + ' اليوم تلتقط ما سخا به الفتح. **ولا يُغلق ما فُتح أبداً**: أعِده متى شئت'
      .replace(/\*\*/g, '')
      + ' فيستأنف من آخر وحدةٍ حُسمت.'),
  );
}

/**
 * ————— **وضعُ الدعم** (جلسة د، بلاغ `2026-08-17-support-mode-contract-for-siblings`) —————
 *
 * **قسمُ اللوحة كلُّه مبنيٌّ من جدول `support.js` المعلَن**: العنوانُ والسطرُ لكل
 * مفتاحٍ من `KNOBS` نفسِها، فلا يفترق ما يقرؤه الوالدُ عمّا يفعله المحرّك، ومقبضٌ
 * يُضاف غداً يظهر هنا بلا سطرٍ يُكتب.
 *
 * **والعونُ يُسجَّل**: عددُ المحاولات المعانة يُقرأ من سجلّ المهارات نفسِه
 * (`progress.helpedAttempts`) — فما أُعين عليه معلومٌ لوليّه، ولا يدخل «الحروف
 * المتقنة» ألبتّة.
 */
function supportSection(rerender) {
  const on = support.modeOn();
  const helped = progress.helpedAttempts();

  const knob = (key) => {
    const k = support.KNOBS[key];
    const live = support.isOn(key);
    return h('div', { class: 'note', css: { 'text-align': 'start', 'margin-bottom': '.5rem' } },
      h('div', { class: 'row', css: { 'justify-content': 'space-between', gap: '.75rem' } },
        h('b', {}, k.title),
        h('button', {
          class: `btn ${live ? 'btn--primary' : ''}`,
          disabled: !on,
          'aria-pressed': live ? 'true' : 'false',
          onclick: () => { support.set(key, !live); rerender(); },
        }, live ? 'مشتغل' : 'مطفأ')),
      h('p', { class: 'hint', css: { margin: '.25rem 0 0' } }, k.line),
      // **ما يمسّ القياسَ يُقال بلفظه** (مسطرةُ الامتحان الواحدة): مقبضُ الصعوبة
      // يُعطَّل في بوابة اللحاق قطعاً، ومقبضُ الراحة يسري فيها — والوالدُ يقرأ أيَّهما.
      k.measures
        ? h('p', { class: 'note', css: { margin: '.35rem 0 0' } },
          'يمسّ ما يُقاس: يُعطَّل داخل بوابة اللحاق، وما أُعين عليه لا يُحتسب إتقاناً.')
        : h('p', { class: 'note', css: { margin: '.35rem 0 0' } },
          'راحةٌ لا تمسّ القياس: تسري في بوابة اللحاق كما تسري خارجها.'),
    );
  };

  return h('div', {},
    h('p', { class: 'hint' },
      'لطفلٍ يحتاج وتيرةً أهدأ — صعوبةَ تعلّمٍ أو فرطَ حركة أو يداً لم تنضج بعد.'
      + ' **المنهجُ نفسُه والمقياسُ نفسُه**، وإنما يتغيّر الإيقاع.'.replace(/\*\*/g, '')),
    h('div', { class: 'row', css: { 'justify-content': 'flex-start' } },
      h('button', {
        class: 'btn btn--primary support-toggle',
        onclick: () => { support.setMode(!on); rerender(); },
      }, on ? 'أطفئ وضع الدعم' : 'شغّل وضع الدعم')),
    on ? support.PANEL_KEYS.map(knob) : null,
    // **علامتُه بنصّها من مالكها** — فلا يفترق ما يقرؤه الوالدُ عمّا يراه على الشاشة.
    h('p', { class: 'hint' }, support.MARK.note),
    h('p', { class: 'note' },
      `والعونُ يُسجَّل ولا يُزوَّر القياس: ${arNum(helped)} محاولةً وقعت بعونٍ`
      + ' — لا ترفع صندوقاً ولا تدخل «الحروف المتقنة»، وتعود في المراجعة كما هي.'),
    // **سطرُ الوعد الصادق من مصدره الواحد** (`support.PROMISE`) — يُكتب هنا وفي
    // صفحة التعريف من الموضع نفسِه، فلا يسقط حدٌّ منه في نقلٍ.
    h('p', { class: 'note' }, support.PROMISE),
  );
}

/** اسمُ وحدة السلّم كما يقرؤه وليُّ الأمر — من موضعها في الرحلة لا من قائمةٍ تُكتب. */
function sectionLabelOf(step) {
  const sections = progress.journey();
  return sectionLabel(step.section, sections.indexOf(step.section));
}

/**
 * **مفتاحُ تقييم الكلمات** — إذنُ وليّ الأمر يُقرأ ويُبدَّل من هنا.
 *
 * **سندُه أمرُ المالك** (٢٥ أغسطس ٢٠٢٦): «نستخدم أدوات دخل غوغل لتقييم الطفل
 * وإعطاء النجوم وتحديث أداء الطفل على صفحة وليّ الأمر» · «ننبّه المستخدم…».
 * **والحروفُ لا يمسّها هذا**: تُقاس داخل الجهاز ولا تغادره أبداً.
 */
function readerSection(rerender) {
  const now = consentState();
  const say = h('p', { class: 'hint' }, NOTICE);
  const state = h('p', { class: 'hint' },
    now === 'yes' ? 'الحالُ الآن: **مفتوح** — تُقيَّم الكلماتُ والجملُ بالإنترنت.'
      : now === 'no' ? 'الحالُ الآن: مغلق — يكتب الطفلُ ويتدرّب بلا تقييمٍ للكلمات.'
        : 'لم يُسأل بعدُ — والافتراضُ مغلق.');
  const flip = (value) => { setConsent(value); rerender(); };
  return [
    say,
    state,
    h('div', { class: 'row' },
      h('button', {
        class: `btn ${now === 'yes' ? 'btn--ghost' : 'btn--primary'}`,
        onclick: () => flip('yes'),
      }, 'افتحْ التقييم'),
      h('button', {
        class: `btn ${now === 'no' ? 'btn--ghost' : 'btn--primary'}`,
        onclick: () => flip('no'),
      }, 'أغلقْه')),
  ];
}

function backupSection(rerender) {
  const slot = h('div', { class: 'confirm-slot' });
  const storage = h('p', { class: 'hint' }, 'التخزين على هذا الجهاز: جارٍ الفحص…');

  /* **نسخةُ القشرة تُرى** (أمر المالك، ١٣ أغسطس ٢٠٢٦ — بلاغُ العائلة
     `version-visibility`): «رؤيةُ النسخة الحالية في مكانٍ ما — ولو مخفيّ — تسهّل
     التأكد من وصول النسخة الأخيرة». وثمنُها دُفع مرّتين في احسب: بلاغُ ميدانٍ يقع
     على قشرةٍ مخزونة **شهادةُ زورٍ بريئة**.

     **والسطرُ يُملأ من جواب القشرة الحيّة** لا من ثابتٍ في هذا الملف: تُسأل بـ
     `postMessage` فتردّ `VERSION` من عندها — فالمعروضُ نسخةُ ما **يعمل** على هذا
     الجهاز، لا نسخةُ ما نُشر. وموضعُه هنا مع حال الجهاز (تخزينُه وأصواتُه المخزونة)
     لا مع الرحلة: كلُّها أخبارُ الجهاز الذي بين يدَي وليّ الأمر. */
  const swVersion = h('p', { class: 'hint', 'data-sw-version': '' }, WAITING);
  // سطرُ الأصوات المخزونة (حزمة «خفّة التخزين»): كان إخفاقُ الخزن يُبتلَع صامتاً —
  // ومنه تجاوزُ حصة التخزين على الأجهزة الأقدم — فتنقص ملفاتٌ ولا يعلم أحد، ثم يصمت
  // الصوت في الطائرة أو في السيارة. فالعدد معروضٌ لوليّ الأمر: يرى النقص قبل أن يفاجئه.
  /* **حالُ التحميل تُرى وتُدار** (أمر المالك، ١٣ أغسطس ٢٠٢٦: «يجب أن نُظهر التحميل
     ليتأكّد المستعمل أنّ التحميلات جاهزة… وأن تكون هناك طريقة لمتابعة التحميل أو
     إعادته»): كان الخزنُ يجري صامتاً فلا يعرف أحدٌ أتمَّ أم لا — حتى فُتح التطبيقُ
     بلا شبكةٍ فصمت الصوت، وظُنّ العيبُ في البرنامج. فصار السطرُ **شريطاً حيّاً**
     يتحرّك مع كل دفعة، ومعه **زرٌّ يبدأ التحميل الآن** بدل انتظار مهلة الشفاء. */
  const cached = h('p', { class: 'hint' });
  const bar = h('div', { class: 'dl-bar' }, h('span', { class: 'dl-fill' }));
  const fill = bar.firstChild;
  const dlBtn = h('button', { class: 'btn', onclick: () => askSync() }, 'نزّل الأصوات الآن');
  const dlRow = h('div', { class: 'dl' }, cached, bar, dlBtn);

  const paint = (stored, total, busy) => {
    if (!cached.isConnected || !total) return;
    const pct = Math.min(100, Math.round((stored / total) * 100));
    fill.style.width = `${pct}%`;
    bar.classList.toggle('dl-bar--done', stored >= total);
    const head = `الأصوات المخزونة: ${arNum(stored)} من ${arNum(total)} (${arNum(pct)}٪)`;
    cached.textContent = stored >= total
      ? `${head} — كلُّها على الجهاز، فيعمل التطبيق بلا إنترنت.`
      : busy
        ? `${head} — يُنزَّل الآن، أبقِ التطبيق مفتوحاً.`
        : `${head} — ما نقص يُجلَب عند سماعه، ويكتمل حين يُفتح التطبيق متصلاً.`;
    dlBtn.hidden = stored >= total;
    dlBtn.textContent = busy ? 'يُنزَّل…' : 'نزّل الأصوات الآن';
    dlBtn.disabled = Boolean(busy);
  };

  /** طلبٌ صريح إلى عامل الخدمة — هو وحده يملك المخزن. */
  const askSync = () => {
    const sw = navigator.serviceWorker?.controller;
    if (!sw) return void toast('التحميل يبدأ بعد تثبيت التطبيق');
    sw.postMessage({ type: 'audio-sync' });
    dlBtn.disabled = true;
    dlBtn.textContent = 'يُنزَّل…';
  };

  // بلاغاتُ العامل بعد كل دفعة — فالشريطُ يتحرّك بما يجري لا بتقديرٍ منّا
  navigator.serviceWorker?.addEventListener?.('message', (e) => {
    if (e.data?.type === 'audio-progress') paint(e.data.stored, e.data.total, e.data.busy);
    if (e.data?.type === 'version' && swVersion.isConnected) {
      swVersion.textContent = `نسخة القشرة: ${e.data.version}`;
    }
  });

  // **والسؤالُ يُطرح على المتولّي وحدَه** — وهو الذي يخدم هذه الصفحة فعلاً. وحيث لا
  // متولٍّ (أوّلُ زيارةٍ قبل أن تُثبَّت القشرة، أو `file://`) **يُقال ذلك ولا يُترَك
  // شَرطةً مبهمة**: غيابُ الجواب خبرٌ صحيح، وسكوتُه عنه يُقرأ عطباً.
  //
  // **وصمتٌ بعد السؤال يُقال كذلك** (أمسكه فحصُ المتصفّح ساعةَ جُرِّب سالباً): إن
  // كان متولٍّ ولم يُجب — وذلك يقع لحظةَ تبديل قشرةٍ بأخرى — بقي السطرُ شَرطةً
  // مبهمة أبداً، **وهي عينُ الالتباس الذي جاء البلاغُ ليرفعه**. فبعد مهلةٍ قصيرة
  // يُقال حالُه بصدق، ولا يُدَّعى رقمٌ لم يصل.
  const controller = navigator.serviceWorker?.controller;
  if (!controller) {
    swVersion.textContent = 'نسخة القشرة: — (لم تتولَّ القشرةُ هذه الصفحة بعد)';
  } else {
    controller.postMessage({ type: 'version' });
    setTimeout(() => {
      if (swVersion.isConnected && swVersion.textContent === WAITING) {
        swVersion.textContent = 'نسخة القشرة: — (لم تُجب القشرةُ؛ قد تكون قيد التبديل)';
      }
    }, 3000);
  }

  progress.audioStored().then((count) => {
    if (count) paint(count.stored, count.total, false);
  });

  progress.persistedStorage().then((persisted) => {
    if (!storage.isConnected) return;
    storage.textContent = persisted === null
      ? 'هذا المتصفّح لا يعلن حال تخزينه — والنسخة الاحتياطية تكفيك مؤونته.'
      : persisted
        ? 'تخزين هذا الجهاز موسومٌ دائماً: لا يخليه المتصفّح عند ضيق المساحة.'
        : 'لم يسم المتصفّح تخزين التطبيق دائماً بعدُ — قد يُخليه عند ضيق المساحة،'
          + ' فاحتفظ بنسخةٍ حديثة. (تثبيت التطبيق على الشاشة الرئيسية يرجّح تثبيته.)';
  });

  const file = h('input', {
    type: 'file',
    accept: '.json,application/json',
    class: 'file-pick',
    'aria-label': 'اختر ملف نسخةٍ لاستعادته',
    onchange: async (event) => {
      const chosen = event.target.files?.[0];
      if (!chosen) return;
      const read = progress.readBackup(await chosen.text());
      file.value = '';                       // كي يقبل اختيار الملف نفسه ثانيةً
      if (read.error) {
        slot.replaceChildren(h('p', { class: 'note note--bad' }, read.error));
        return;
      }
      const sum = progress.backupSummary(read.bundle);
      askThen(slot, {
        question: 'استعادة هذه النسخة؟',
        body: `فيها: ${summaryText(sum)}. وستحلّ محلّ ما في هذا الجهاز الآن`
          + ` (${summaryText(progress.backupSummary(progress.backup()))}) — فلا رجعة بعدها.`,
        yes: 'استعِد الآن',
        onYes: () => {
          if (!progress.restore(read.bundle)) {
            slot.replaceChildren(h('p', { class: 'note note--bad' }, 'تعذّرت الاستعادة.'));
            return;
          }
          toast('استُعيد تقدّم طفلك');
          rerender();
        },
      });
    },
  });

  return h('div', {},
    h('p', { class: 'hint' },
      'تقدّم طفلك محفوظ في هذا الجهاز وحده — لا حساب ولا سحابة. فاحفظ نسخةً بين'
      + ' حينٍ وآخر: ملفٌّ صغير يعيد رحلته كما هي إن حذفتَ التطبيق أو بدّلتَ الجهاز.'),
    /* **والمخزنان يُقالان حيث يحتاجهما الوالد** (بلاغ «ثبّت أوّلاً ثم امتحن»، البند
       ٤ — الصيانةُ الصادقة): على الآيباد والآيفون **للتطبيق المثبَّت مخزنٌ مستقلٌّ
       عن سفاري**، فمن جرّب في المتصفّح ثم ثبّت وجد الرحلةَ من أوّلها — وقد وقع.
       **وهذا الملفُّ طريقُ النقل الوحيد بينهما**، فيُذكَر عند الزرّ لا في وثيقةٍ
       بعيدة. (وبطاقةُ أوّل تشغيل تقوله كذلك لمن لم يثبّت بعد.) */
    h('p', { class: 'hint' },
      'وعلى الآيباد والآيفون: للتطبيق المثبَّت مخزنٌ مستقلٌّ عن متصفّح سفاري — فما'
      + ' مشى فيه طفلك من المتصفّح لا يظهر في التطبيق بعد تثبيته، وهذا الملفُّ طريقُ'
      + ' نقله الوحيد: انسخه من المتصفّح، ثم استعِده في التطبيق المثبَّت.'),
    h('div', { class: 'row', css: { 'justify-content': 'flex-start' } },
      h('button', {
        class: 'btn btn--primary backup-save',
        onclick: () => { saveBackupFile(); toast('حُفظت نسخةُ التقدّم'); },
      }, 'انسخ تقدّم طفلي'),
      // الملصق زرٌّ بحقّ: يُفتح باللمس وبالفأرة **وبلوحة المفاتيح** — ومدخلُ الملف
      // مخفيٌّ فيه لأن مظهره الأصليّ نصٌّ بلغة الجهاز لا بلغة اللوحة.
      h('label', {
        class: 'btn file-label',
        role: 'button',
        tabindex: '0',
        onkeydown: (e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          file.click();
        },
      }, 'استعِد من ملف', file),
    ),
    slot,
    storage,
    swVersion,
    dlRow,
    h('p', { class: 'note' },
      'في النسخة: النجوم وصناديق المراجعة ودقائق التعلّم وتاريخ خفوت كلماته'
      + ' وعدّادُ حركاته الخاطئة بأسمائها. وليس فيها مسارُ قلمٍ واحد ولا إحداثيُّ'
      + ' لمسة — تلك لا تغادر جهازه أبداً، ولا تُخزَّن عنده أصلاً.'),
  );
}

/** اسم المحطة كما يقرؤه وليّ الأمر في قائمة الاختيار. */
function sectionLabel(section, index) {
  // **واسمُ الشطر لا اسمُ مرحلته** (الجلسة ش): `nodeWhere` تقول مرحلةَ العقدة، فلمّا
  // شُقّت المرحلةُ محطاتٍ صارت عشرُ محطاتٍ في هذه القائمة باسمٍ واحد — ووليُّ الأمر
  // يصفّر منها بالاسم، فاسمان متطابقان يعنيان تصفيرَ ما لم يقصد.
  const name = section.kind === 'gate' ? section.gate.title : stageTitle(section.stage);
  // شرطةٌ لا نقطةٌ فاصلة: النقطة تجاور الرقم المشرقيّ في الاتجاهين فتُقرأ صفراً ملتصقاً به
  return `${arNum(index + 1)} — ${name}`;
}

function journeySection(rerender) {
  const sections = progress.journey();
  const next = progress.nextNode();
  const here = sections.findIndex((s) => s.nodes.some((n) => n.id === next?.id));

  // ١) تخطٍّ للأمام: القفل التسلسلي طوعُ وليّ الأمر — لطفلٍ يعرف حروفه أصلاً
  const nodePick = h('select', { class: 'chip pick', 'aria-label': 'العقدة التي يُفتح الطريق إليها' },
    sections.map((section, i) => h('optgroup', { label: sectionLabel(section, i) },
      section.nodes.map((node) => h('option', { value: node.id }, nodeTitle(node))))));
  if (next) nodePick.value = next.id;
  const openSlot = h('div', { class: 'confirm-slot' });

  const openBtn = h('button', {
    class: 'btn open-to',
    onclick: () => {
      const node = progress.findNode(nodePick.value);
      const count = progress.pendingBefore(nodePick.value);
      if (!node) return;
      if (!count) { toast('هذه مفتوحة له أصلاً'); return; }
      askThen(openSlot, {
        question: `تفتح الطريق إلى «${nodeTitle(node)}»؟`,
        body: `${nodesText(count)} قبلها ستُعدّ منجَزةً بنجمةٍ واحدة — تبقى مفتوحةً`
          + ' يلعبها متى شاء، ولا تُنقَص نجمةٌ كسبها. والقياس لا يتغيّر: لم يُمتحن فيها بعد.',
        yes: 'افتح الطريق',
        onYes: () => {
          toast(`فُتحت ${nodesText(progress.unlockUpTo(node.id))}`);
          rerender();
        },
      });
    },
  }, 'افتح الطريق إلى هنا');

  // ٢) إعادة التدريب: تصفير محطةٍ بعينها — نجومُها وحدها، وسجلّ ليتنر لا يُمسّ
  const sectionPick = h('select', { class: 'chip pick', 'aria-label': 'المحطة التي تُصفَّر' },
    sections.map((section, i) => h('option', { value: section.id }, sectionLabel(section, i))));
  if (here >= 0) sectionPick.value = sections[here].id;
  const resetSlot = h('div', { class: 'confirm-slot' });

  const resetBtn = h('button', {
    class: 'btn reset-section',
    css: { color: 'var(--err-text)' },
    onclick: () => {
      const index = sections.findIndex((s) => s.id === sectionPick.value);
      const section = sections[index];
      const info = progress.sectionProgress(sectionPick.value);
      if (!section || !info) return;
      if (!info.done) { toast('لم يبدأ هذه المحطة بعد'); return; }
      askThen(resetSlot, {
        question: `تصفّر محطة «${sectionLabel(section, index)}» ليعيدها؟`,
        body: `${nodesText(info.done)} فيها تعود إلى أولها و${arNum(info.stars)} نجمة تسقط،`
          + ' ويُقفل ما بعدها حتى يتمّها من جديد — ونجومُه هناك محفوظة تعود كما كانت.'
          + ' أما سجلّ مهاراته ودقائق تعلّمه فلا يمسّها التصفير.',
        yes: 'صفِّر المحطة',
        onYes: () => {
          toast(`صُفِّرت ${nodesText(progress.clearSection(section.id))}`);
          rerender();
        },
      });
    },
  }, 'صفِّر هذه المحطة');

  return h('div', {},
    h('p', { class: 'hint' },
      'الرحلة مقفلة بالتسلسل: لا تُفتح عقدةٌ قبل ما قبلها. وهنا تتجاوز القفل إن كان'
      + ' طفلك يعرف ما قبله، أو تعيد محطةً كاملة إن رأيت أن يعيد تدريبها.'),
    h('div', { class: 'row parent-tool' }, nodePick, openBtn),
    openSlot,
    h('div', { class: 'row parent-tool' }, sectionPick, resetBtn),
    resetSlot,
  );
}

/**
 * **حقلُ اسم الطفل** — يُكتب مرّةً فتُولَّد محطتُه. ويقول للوليّ **ما يقع بالضبط**:
 * أفُتحت المحطةُ أم بقي فيها حرفٌ لا يُكتب اليوم (`nameGap` تقرأه من المسارات نفسِها،
 * فلا قائمةَ حروفٍ تشيخ هنا).
 */
function nameSection(rerender) {
  const value = progress.childName();
  const gap = value ? nameGap(value) : null;
  const input = h('input', {
    type: 'text',
    class: 'field',
    value,
    maxlength: '40',
    dir: 'rtl',
    'aria-label': 'اسم الطفل كما يُكتب',
    placeholder: 'مثال: مُحَمَّد',
  });
  const save = () => {
    progress.setChildName(input.value);
    rerender();
  };
  return [
    h('h3', {}, 'اسمُ الطفل بيده'),
    h('div', { class: 'row', css: { 'justify-content': 'flex-start', gap: '.5rem', 'flex-wrap': 'wrap' } },
      input,
      h('button', { class: 'btn btn--primary', onclick: save }, 'احْفَظْ')),
    h('p', { class: 'hint' },
      !value ? 'اكتب اسمه كما تريده أن يكتبه — بحركاته إن شئت — فتُفتح له محطةُ اسمه في موضعها من الرحلة.'
        : gap ? `المحطةُ لم تُفتح بعد: ${gap.why}. جرّب صورةً أخرى للاسم، أو اتركه حتى يُؤلَّف شكلُه.`
          : 'محطتُه مفتوحة — يكتب اسمه حرفاً حرفاً بأشكال مواقعه، والنموذجُ كاملاً أمامه.'),
    h('p', { class: 'hint' },
      '🔒 الاسمُ يبقى على هذا الجهاز وحدَه: لا يُرفَع، ولا يُنطَق، ولا يدخل نسخةً احتياطية تُشارَك.'),
  ];
}

function dashboard(rerender = () => {}) {
  const letters = progress.studiedLetters();
  const stats = progress.letterStats();
  // **الكلماتُ صفٌّ إلى جوار الحروف**: النسخُ والإملاء وحدتُهما كلمة لا حرف
  // (`METHOD.md §٦`) — فلا تدخل لوحةَ الحروف، ولها قسمُها أدناه. **والجملُ صفُّها**.
  const units = wordUnits(progress.skills());
  const words = units.filter((u) => !u.sentence);
  const lines = units.filter((u) => u.sentence);
  const mastered = stats.filter((s) => s.mastered);
  const weak = stats.filter((s) => s.struggling);
  const learning = stats.filter((s) => !s.mastered && !s.struggling);
  const due = progress.dueSkills();
  const next = progress.nextNode();
  const today = progress.secondsOn();
  const week = progress.usageDays(7);
  const streak = progress.reviewStreak();
  const tip = recommend({
    letters: letters.length,
    dueCount: due.length,
    secondsToday: today,
    reviewDone: Boolean(progress.reviewOf()),
    next,
  });

  const section = (title, ...children) => [h('h3', {}, title), ...children];
  const emptyNote = (text) => h('p', { class: 'hint' }, text);

  const main = h('main', { class: 'screen-card audit' },
    h('h2', {}, 'لوحة وليّ الأمر'),

    h('div', { class: 'audit-row' },
      pill('اليوم', minutesText(today)),
      pill('هذا الأسبوع', minutesText(week.reduce((s, d) => s + d.seconds, 0))),
      pill('المجموع', minutesText(progress.totalSeconds())),
      pill('النجوم', `${arNum(progress.totalStars())} / ${arNum(progress.maxTotalStars())}`),
      pill('حروف كتبها', arNum(letters.length)),
      pill('مراجعات متتابعة', arNum(streak)),
    ),

    // ————— ت٣: اسمُ الطفل — أوّلُ ما يريد كلُّ طفلٍ كتابتَه —————
    //
    // 🔒 **محلّيٌّ لا يغادر الجهاز**: يقع حيث تقع نجومُه في `localStorage` وحدَه، ولا
    // يُنطَق ولا يُرفَع ولا يُولَّد له صوت — يُنسَخ بالعين لا يُملى (`EXPANSION.md §٤`).
    // **ومحطتُه تنفتح بكتابته**، وتتخطّاها الرحلةُ ما دام فارغاً فلا يُحبَس طفلٌ
    // في انتظار بالغ.
    ...nameSection(rerender),

    ...section('توصية اليوم',
      h('div', { class: 'note', css: { 'text-align': 'start' } },
        h('b', {}, tip.title),
        h('p', { class: 'hint', css: { margin: '.25rem 0 0' } }, tip.body)),
      tip.action && h('div', { class: 'row', css: { 'justify-content': 'flex-start', 'margin-top': '.75rem' } },
        h('button', { class: 'btn btn--primary', onclick: () => go(tip.action.hash) }, tip.action.label))),

    ...section(`الحروف المتقنة كتابةً (${arNum(mastered.length)})`,
      mastered.length
        ? h('div', { class: 'audit-row' }, mastered.map((s) => letterChip(s, GOOD)))
        : emptyNote('لم يثبت حرف بعدُ — الإتقان يحتاج إصابات متتابعة في أيام متباعدة.')),

    ...section(`الحروف المتعثّرة (${arNum(weak.length)})`,
      weak.length
        ? [h('div', { class: 'audit-row' }, weak.map((s) => letterChip(s, BAD))),
          h('p', { class: 'hint' }, 'هذه تعود في مراجعة اليوم تلقائياً. واكتبها معه بإصبعك على الطاولة أيضاً.')]
        : emptyNote('لا حرف متعثّر — ما أخطأ فيه لم يتكرّر خطؤه.')),

    ...section(`قيد التعلّم (${arNum(learning.length)})`,
      learning.length
        ? h('div', { class: 'audit-row' }, learning.map((s) => letterChip(s, ACCENT)))
        : emptyNote('لا شيء في المنتصف.')),

    // **الكلماتُ قسمٌ خاصٌّ بها**: الكلمةُ ليست حرفاً، فلا تدخل لوحةَ الحروف (وإلا
    // ظهر «حرفٌ» اسمُه «بابا») — ولكنها مقيسةٌ في ليتنر نسخاً وإملاءً فتُقرأ هنا.
    ...section(`الكلمات نسخاً وإملاءً (${arNum(words.length)})`,
      words.length
        ? h('div', { class: 'audit-row' }, words.map(wordChip))
        : emptyNote('لم يبلغ محطةَ نسخٍ بعدُ — تبدأ بعد أشكال المواقع.'),
      lines.length
        ? [h('p', { class: 'hint' },
          `والجملُ سطرٌ لا كلمة، فلها صفُّها (${arNum(lines.length)}):`),
          h('div', { class: 'audit-row' }, lines.map(wordChip))]
        : null,
      (words.length || lines.length) && h('p', { class: 'hint' },
        'النسخُ أن يكتبها وهو يراها، والإملاءُ أن يكتبها وقد سمعها فقط '
        + '— ولكلٍّ صندوقُ مراجعته.')),

    // **قلبُ اللوحة** (`METHOD.md §٦`): كيف يخطئ لا كم أخطأ.
    ...section('أخطاء الاتجاه وجودةُ اليد — أين تتعثّر يده بالضبط', faultsSection()),

    ...section('لكلِّ نوع تمرينٍ موضعُه', kindsSection()),

    ...section('دقائق آخر سبعة أيام',
      h('div', { class: 'audit-row' }, week.map((day) => {
        const d = new Date(`${day.key}T00:00:00`);
        const minutes = Math.round(day.seconds / 60);
        return h('span', {
          class: 'pill',
          css: day.seconds ? { color: 'var(--star-text)' } : { opacity: '.55' },
        }, `${DAY_NAMES[d.getDay()]}: `, h('b', {}, minutes ? arNum(minutes) : '—'));
      })),
      h('p', { class: 'hint' }, 'الزمن يُحسب وقت انتباهه للشاشة فقط (لا يُحسب إن تركها مفتوحة).')),

    ...section('أين هو الآن',
      h('p', { class: 'hint' }, next
        ? `التالي: ${nodeTitle(next)} — ${nodeWhere(next)}.`
        : 'أتمّ كل عقد الخريطة.'),
      h('p', { class: 'hint' },
        `بانتظار التثبيت الآن: ${arNum(due.length)} من ${arNum(progress.skills().length)} مهارة سُجّلت.`)),

    // **ومفتاحُ تقييم الكلمات هنا** (أمر المالك ٢٥ أغسطس ٢٠٢٦): يُسأل مرّةً في أول
    // تشغيل، **ويُبدَّل متى شاء وليُّ الأمر** — والافتراضُ «لا» حتى يأذن.
    ...section('تقييمُ الكلمات — يستعمل الإنترنت', readerSection(rerender)),

    ...section('نسخة احتياطية من تقدّمه', backupSection(rerender)),

    // **بوابةُ اللحاق قبل التحكّم اليدويّ عمداً**: كلاهما يفتح الرحلة، لكنّ هذا يفتح
    // **بما أثبتته يدُ الطفل** وذاك بتقدير الوالد — فيُعرض المقيسُ أوّلاً.
    ...section('بوابةُ اللحاق — امتحانُ تحديد المستوى', catchupSection()),

    // **واللحاقُ والدعمُ متعامدان** (بلاغ `2026-08-17-support-and-placement-coexist`):
    // **اللحاقُ يحدّد أين يبدأ · والدعمُ يحدّد كيف يمشي** — فيجتمعان لطفلٍ يصل
    // بمستوىً قائم ويحتاج إيقاعاً معايَراً، وهو الحالُ الغالب في المراكز.
    ...section('وضعُ الدعم — لطفلٍ يحتاج إيقاعاً أهدأ', supportSection(rerender)),

    ...section('تحكّم في الرحلة', journeySection(rerender)),

    ...section('معاينةُ التطبيق كلِّه', previewSection()),

    ...section('بلِّغنا عن خطأ أو اقتراح', feedbackSection()),

    h('p', { class: 'note' }, 'المهارة = (الحرف أو الكلمة) × شكل الموقع × نوع التمرين — تتبّعاً أو حرّاً أو نسخاً أو إملاءً. الخطأ يعيدها إلى مراجعة الغد، والإصابة تُباعد موعدها (١ ← ٢ ← ٤ ← ٨ ← ١٦ يوماً).'),
  );

  return h('div', { class: 'screen', css: { '--accent': ACCENT } },
    topbar(
      h('button', { class: 'btn', onclick: () => go('#/') }, '→ الخريطة'),
      h('span', { class: 'spacer' }),
      h('span', { class: 'pill' }, 'لوحة وليّ الأمر'),
    ),
    main,
  );
}

/** الشاشة: البوابة أولاً، ثم اللوحة — والفتح يبقى ما دامت الصفحة مفتوحة. */
export function renderParent(rerender) {
  if (unlocked) return dashboard(rerender);
  return gateScreen(() => {
    unlocked = true;
    rerender();
  });
}

/** لإعادة إغلاق البوابة في الاختبارات. */
export function lockGate() {
  unlocked = false;
}
