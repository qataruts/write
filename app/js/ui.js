// أدوات واجهة مشتركة بين الشاشات (بلا إطار عمل): بناء DOM، أرقام عربية، رسائل عابرة.
// لا تلمس هذه الوحدة الـDOM وقت التحميل، فتبقى قابلة للاستيراد في اختبارات node.
//
// **من بذرة اقرأ** (`FAMILY.md §٥`) — وتعديلاتُها معلَنةٌ في `docs/SEED.md`:
// نصُّ العلامة ومصيّرُها، ومفرداتُ العقد (`nodeTitle`/`nodeWhere`/`nodeFace`)
// على أنواع محطات اكتب لا محطات اقرأ.

import { FORM_NAMES, LETTERS, stageById } from './curriculum.js';

export const DEV = typeof location !== 'undefined'
  && new URLSearchParams(location.search).get('dev') === '1';

// ألوان المراحل — مصدر الحقيقة الوحيد للقيم في لوح `docs/DESIGN.md` §٢ (متغيرات CSS):
// لون واحد مطفأ يميز كل مرحلة، والمشهد يتغيّر بمعالم المحطات لا بصراخ الألوان.
export const ACCENTS = ['var(--accent-letters)'];

/** لون محطات التهيئة الحركية — تُميَّز عن الحروف: خطوطٌ ومنحنيات قبل أيّ حرف. */
export const WARMUP_ACCENT = 'var(--accent-skills)';

/** لون البوابات — لون المهارات نفسُه (نظيرُ `PAUSE_ACCENT` في اقرأ). */
export const PAUSE_ACCENT = 'var(--accent-skills)';

/** لون محطات الوصل والنسخ — طيني دافئ: من الحرف إلى الكلمة. */
export const JOIN_ACCENT = 'var(--accent-stories)';

/** لون محطات الإملاء والجمل — أخضر مصحفي، خاتمةُ الرحلة وأشقُّ ما فيها. */
export const DICTATION_ACCENT = 'var(--accent-quran)';

/** لون أشكال المواقع — زيتوني ناعم: الحرفُ نفسُه في مواضعه. */
export const FORM_ACCENT = 'var(--accent-garden)';

export const accentFor = () => ACCENTS[0];

/** لون المحطة بنوعها — مصدرٌ واحد تقرؤه الخريطةُ وبطاقةُ «تابع من هنا». */
export function accentForKind(kind) {
  if (kind === 'warmup') return WARMUP_ACCENT;
  if (kind === 'form') return FORM_ACCENT;
  if (kind === 'join') return JOIN_ACCENT;
  if (kind === 'fade' || kind === 'sentence') return DICTATION_ACCENT;
  if (kind === 'gate') return PAUSE_ACCENT;
  return ACCENTS[0];
}

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const arNum = (n) => String(n).replace(/\d/g, (d) => AR_DIGITS[+d]);

/**
 * صياغة المعدود بالعربية الصحيحة: [مفرد، مثنى، جمع قلة (٣–١٠)، مفرد منصوب (١١+)].
 * الشاشة يقرؤها وليّ أمر عربي — «٨ دقيقة» غلط لا يليق بتطبيق يعلّم العربية.
 */
export function arCount(n, [one, two, few, many]) {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${arNum(n)} ${few}`;
  return `${arNum(n)} ${many}`;
}

/**
 * **اسمُ الحرف — من `LETTERS` وحدَها** (وهي `LETTERS` اقرأ بأعيانها، `SEED.md §٦`):
 * «باء» · «أَلِف». وهو **نصُّ ملفّه الصوتيّ في بنك اقرأ نفسُه** (`METHOD.md §٧`)،
 * فمصدرٌ واحد لما يُقرأ على الشاشة ولما يُسمَع في الأذن — ولا اسمَ يُكتب بيد هنا.
 *
 * (وكان هذا الموضعُ مُعلَّقاً حتى الجلسة ٥ بنصّه: «تُنسخ الأصواتُ ببصماتها حين تُبنى
 * شاشةُ الدرس» — وقد نُسخت اليوم فسقط التعليق.)
 */
export const letterName = (ch) => LETTERS[ch]?.name ?? ch;

/** اسم الحرف كما يُقرأ في العناوين: «حرف باء». */
export const letterTitle = (ch) => `حرف ${letterName(ch)}`;

/** اسمُ شكل الموقع كما يُقرأ: «معزول» · «ابتدائي» · «وسطي» · «نهائي». */
export const formTitle = (form) => FORM_NAMES[form] ?? '';

/**
 * اسم عقدة الخريطة كما يُعرض للطفل ولوليّ أمره.
 *
 * **وأنواعُ العقد أنواعُ محطات `METHOD.md §٤`** لا أنواعَ اقرأ: تهيئةٌ حركية ·
 * حرفٌ معزول · شكلُ موقع · وصلٌ ونسخ · خفوتٌ وإملاء · جملة · بوابة.
 */
export function nodeTitle(node) {
  if (node.type === 'warmup') return node.title ?? '';
  if (node.type === 'letter') return letterTitle(node.letter);
  // **وعقدةُ شكل الموقع مجموعةٌ لا حرفاً** (الجلسة ٣): محطةُ الشكل الواحد تمشي على
  // مجموعات اقرأ السبع، فعنوانُ عقدتها عنوانُ مجموعتها ووجهُها شكلُ أوّل حروفها —
  // ويبقى السطرُ الثاني لحرفٍ مفردٍ إن جاء يوماً.
  if (node.type === 'form') return node.title ?? `${letterTitle(node.letter)} — ${formTitle(node.form)}`;
  if (node.type === 'join') return node.title ?? '';
  if (node.type === 'fade') return node.title ?? '';
  if (node.type === 'sentence') return node.title ?? '';
  if (node.type === 'gate') return node.gate.title;
  return node.title ?? '';
}

/**
 * **عنوانُ المحطة كما يراه الطفل — يُحسب من موادّها لا يُكتب** (حكمُ المالك في
 * `REVIEW_IDENTITY.md §٣ب`، الجلسة هـ٢: «بحروفِها»).
 *
 * ومحطاتُ الحروف السبعُ ورثت من ترتيب اقرأ ترقيمَها («المجموعة الأولى»)، فكان الطفلُ
 * يقرأ رقماً ويبحث عن حرفه في سطرٍ تحته. فصار العنوانُ **حروفَها بأعيانها** — يُقرأ
 * من عقدها ساعةَ الرسم، فلا قائمةَ أسماءٍ تشيخ يومَ يتحرّك ترتيبُ الحروف، **ولا حرفَ
 * يُكتب بيد** (وترتيبُ اقرأ عهدٌ في `SEED.md`). وما سواها من المراحل **أسماؤها من
 * عالمنا أصلاً** («تَهْيِئَةُ اليَد» · «الوَصْلُ وَالنَّسْخ» · «خُفُوتُ النَّمُوذَج») فتبقى.
 */
export function stageTitle(stage) {
  if (!stage) return '';
  if (stage.kind !== 'letter') return stage.title;
  const letters = (stage.nodes || []).map((node) => node.letter).filter(Boolean);
  return letters.length ? `حُرُوفُ ${letters.join(' ')}` : stage.title;
}

/** موضع العقدة في الرحلة: عنوانُ محطتها. */
export function nodeWhere(node) {
  if (node.type === 'gate') return 'بوابة الإتقان';
  return stageTitle(stageById(node.stageId));
}

/**
 * وجه العقدة على الخريطة: الحرف نفسه، أو أيقونةٌ تدلّ على نوعها.
 *
 * **ولغةُ الواجهة عندنا SVG خطيّ** لا إيموجي (مهمة «أيقونات لا إيموجي» في اقرأ،
 * `DESIGN.md §٦`): وجهُ محطةٍ لا بيانَ له في المنهج أيقونتُنا الخطية.
 *
 * **ووجوهُ عقد الجلسة ٣ من مادّتها لا من بنك رموز**: الحرفُ نفسُه لعقدة الحرف،
 * وشكلُه في موقعه لعقدة الشكل (`ـبـ`) — وهو أنطقُ من رمزٍ مصوَّر في تطبيق كتابة،
 * ولا يحتاج `app/emoji/` الذي لا وجودَ له هنا. والبوابةُ أيقونتُها الخطية.
 */
export function nodeFace(node) {
  if (node.type === 'letter') return node.letter;
  if (node.type === 'form') return node.face ?? node.letter;
  if (node.type === 'gate') return node.gate.face ?? icon('gate');
  if (node.type === 'warmup') return node.face ?? icon('pen');
  if (node.type === 'join') return node.face ?? icon('link');
  if (node.type === 'fade' || node.type === 'sentence') return node.face ?? icon('ear');
  return node.face ?? '';
}

// ————— بناء DOM —————

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'css') for (const [k, v] of Object.entries(value)) el.style.setProperty(k, v);
    else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key in el) el[key] = value;
    else el.setAttribute(key, value);
  }
  for (const child of children.flat(2)) {
    if (child == null || child === false) continue;
    el.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return el;
}

let toastTimer = 0;
/** رسالةٌ عابرة — ومعها أيقونةُ واجهةٍ اختيارية (لا محرفَ إيموجي في نصّها). */
export function toast(message, iconName) {
  const toastEl = document.getElementById('toast');
  if (!toastEl) return;
  toastEl.replaceChildren(...[iconName && icon(iconName), message].filter(Boolean));
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2200);
}

export function go(hash) {
  location.hash = hash;
}

export function topbar(...extra) {
  return h('header', { class: 'topbar' }, extra);
}

export function starsRow(count, className = 'node-stars') {
  return h('span', { class: className, 'aria-hidden': 'true' },
    [0, 1, 2].map((i) => h('span', { class: i < count ? 'on' : '' }, i < count ? '★' : '☆')));
}

// ————— عناصر الهوية (DESIGN §٦): الشخصية المرشدة ومعالم المحطات — SVG مضمّن لا صور نقطية —————

// «نوري» — عصفور مرشد بسيط بعيون، ألوانه من لوح التصميم نفسه (متغيرات CSS داخل SVG).
const MASCOT_SVG = `
<svg viewBox="0 0 64 64" role="img">
  <ellipse cx="32" cy="58" rx="14" ry="3" fill="var(--ink)" opacity=".08"/>
  <circle cx="32" cy="34" r="21" fill="var(--star)"/>
  <circle cx="32" cy="34" r="21" fill="none" stroke="var(--ink)" stroke-width="2" opacity=".25"/>
  <ellipse cx="32" cy="42" rx="12" ry="9" fill="var(--card)"/>
  <path d="M13 34q-7 2-9 8 7 1 11-2z" fill="var(--star)" stroke="var(--ink)" stroke-width="1.5" opacity=".9"/>
  <path d="M51 34q7 2 9 8-7 1-11-2z" fill="var(--star)" stroke="var(--ink)" stroke-width="1.5" opacity=".9"/>
  <circle cx="25" cy="28" r="5.5" fill="var(--card)"/>
  <circle cx="39" cy="28" r="5.5" fill="var(--card)"/>
  <circle cx="26" cy="29" r="2.6" fill="var(--ink)"/>
  <circle cx="38" cy="29" r="2.6" fill="var(--ink)"/>
  <circle cx="26.9" cy="28.1" r=".9" fill="var(--card)"/>
  <circle cx="38.9" cy="28.1" r=".9" fill="var(--card)"/>
  <path d="M32 33l-3.5 4h7z" fill="var(--accent-stories)"/>
  <path d="M28 12q4-6 4 0 0-6 4 0" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" opacity=".55"/>
</svg>`;

/** الشخصية المرشدة — تظهر في بدايات الدروس والاحتفالات (لا تظهر في شاشات السور). */
export function mascot(className = 'mascot') {
  const el = h('span', { class: className, 'aria-hidden': 'true' });
  el.innerHTML = MASCOT_SVG;
  return el;
}

// اسمُ التطبيق ورسمُ علامته: مشكولٌ بالكامل (سياسةُ التسمية الثلاثية،
// `FAMILY.md §٦`) — وهو تمايزُنا وبيانُ منهجٍ في آن. لا يُكتب هذا الرسم في موضعٍ
// آخر: كلُّ من يعرضه يستورده من هنا (عينُ عقد `BRAND` في اقرأ، وحارسُه هناك
// `test_brand.mjs`).
export const BRAND = 'اُكْتُبْ';

/**
 * علامةُ التطبيق: الكلمةُ مشكولةً بخطّ العلامة — **`Aref Ruqaa`** بحكم المالك
 * (١٢ أغسطس ٢٠٢٦، `REVIEW_IDENTITY §٤`): قلمُ الخطّاط، عينُ استعارتنا «القلمُ
 * والأثر» مرسومةً. وقد كان `Marhey` نائباً مورَّثاً من اقرأ فأُسقط بالحكم من
 * الشجرة ومن القشرة. **واسمُ الخطّ لا يُكتب هنا شيفرةً**: اللوحُ (`app.css`)
 * يعلنه مرّةً واحدة ومنه يقرأ الجميع — ولا يبقى في العاملِ اسمٌ يهجره حكمٌ.
 *
 * **والطائرُ مُعلَّقٌ عن العلامة بعلّته** (لا محذوفٌ — `mascot()` باقيةٌ أدناه من
 * البذرة): في اقرأ يحطّ نوري على رأس ألف «اِقْرَأْ» لأن كسرتَها **تحتها** فلا
 * يحجبها. وألفُ «اُكْتُبْ» ضمّتُها **فوقها** — فالطائرُ في موضعه ذاك يحجب
 * التشكيلَ الذي هو تمايزُ العلامة نفسُها. وتركيبٌ آخر قرارُ تصميمٍ لم يُتَّخذ
 * (نظيرُ `docs/REVIEW_BRAND.md` في اقرأ)، **والجلسة ١١ تملكه** مع صفحات welcome.
 */
export function brandMark(tag = 'span') {
  return h(tag, { class: 'brand' },
    h('span', { class: 'brand-word' }, BRAND));
}

// **معالمُ «القلم والأثر»** — عالمُ اكتب مرسوماً (حكمُ المالك في `REVIEW_IDENTITY.md §٣أ`،
// الجلسة هـ٢: «الأثرُ نفسُه»). ومعالمُ اقرأ التي ورثتها البذرةُ (بيتٌ وجسرٌ وقبةٌ وسلّمٌ
// ومكتبة) **أُسقطت**: بساتينُ أخينا لا تُنسَخ (`FAMILY §٩.٣`).
//
// والقاعدةُ التي اختير بها الرسم: **المعلمُ يقول ما تفعله المحطةُ لا ما تشبهه** — فهو
// لغةُ المحرّك نفسِها التي يراها الطفلُ على اللوح: نقطةُ بدايةٍ وسهمُ اتجاهٍ وأثرٌ يمتدّ.
const LANDMARKS = {
  // أوّلُ أثر: قلمٌ يمرّ فيترك موجةً — محطةُ تهيئة اليد قبل أوّل حرف
  wave: '<path d="M8 34q10-14 22-6t26-14" /><circle cx="8" cy="34" r="4" fill="var(--accent)" stroke="none" />',
  // بدايةٌ واتجاه: نقطةُ النزول ثم الأثرُ إلى حيث يشير السهم — محطةُ الحرف المعزول
  start: '<circle cx="14" cy="38" r="4.5" fill="var(--accent)" stroke="none" />'
    + '<path d="M14 38q6-24 20-24 12 0 12 13" /><path d="M40 21l6 6-6 5" />',
  // الحرفُ في مواضعه: ثلاثةُ آثارٍ على سطرٍ واحد، أوّلَ الكلمة ووسطَها وآخرَها
  places: '<path d="M6 38h52" /><path d="M14 38q0-10 6-10t6 10" /><path d="M28 38q2-14 8-14t8 14" />'
    + '<path d="M46 38q0-8 5-8t5 8" />',
  // الوصل: أثران يلتقيان بخطٍّ واحد لا يُرفَع فيه القلم
  join: '<path d="M10 30q6-12 14-12t10 10q2 10 10 10t10-12" />'
    + '<circle cx="10" cy="30" r="3.4" fill="var(--accent)" stroke="none" />'
    + '<circle cx="54" cy="26" r="3.4" fill="var(--accent)" stroke="none" />',
  // خفوتُ النموذج: أثرٌ متقطّعٌ يخفت ويدَ الطفل تُتمّه متصلاً
  fade: '<path d="M8 32q10-16 22-8" opacity=".35" stroke-dasharray="3 5" />'
    + '<path d="M30 24q10 6 22-8" opacity=".8" /><path d="M8 42h48" opacity=".25" />',
  // الجملة: مسطرةُ الكرّاسة وعليها أثرٌ يمتدّ سطراً
  lines: '<path d="M6 16h52M6 30h52M6 42h52" opacity=".35" />'
    + '<path d="M12 30q6-10 12-4t12-6 10 4" />',
  // البوابة تبقى بوابة: مفصلٌ في الرحلة لا مشهدٌ من عالمٍ (وهي بنيةُ العائلة)
  gate: '<path d="M6 44h52" /><path d="M13 44V25a19 19 0 0 1 38 0v19" /><path d="M32 44V6" />'
    + '<path d="M22 44V27a10 10 0 0 1 20 0v17" />',
};

// **أيقونةُ الميكروفون لم تُنقَل**: في اقرأ زرُّ «اقرأ لي» يلتقط صوت الطفل، و«اُكْتُبْ»
// **لا يلتقط صوتاً ألبتّة** — أثرُ الطفل الخاصّ فيه مساراتُ قلمه، وعهدُها في
// `METHOD.md §٣.٧`. حذفُ ما لا موضوعَ له أبداً، لا تعليق.

// ————— مهمة «أيقونات لا إيموجي» (أمر المالك، ٧ أغسطس ٢٠٢٦) —————
//
// **العلّة**: إيموجي خطِّ النظام ليس صورةً واحدة — هو صورةٌ لكل جهاز. فما راجعه
// المالك والمدير في `docs/REVIEW_ICONS.md` على أبل يراه طفلٌ آخر على أندرويد أو
// ويندوز رسماً مختلفاً، فينقلب عليه حكمُ «صدق الصورة» (DESIGN §٦)؛ والرموزُ
// الحديثة (يونيكود ١٤–١٥) تظهر في الأجهزة الأقدم مربّعاً فارغاً، فتصير الإجابةُ
// المصوَّرة بلا صورةٍ أصلاً. والعلاج قسمان:
//
//   • **رموز البيانات** (كلمات المنهج والمعجم ومشاهد القصص ووجوه المحطات):
//     تُرسم من Twemoji المخزونة في `app/emoji/` — الرمز نفسُه لا يتغيّر، وإنما
//     صار رسمُه ملفَّ SVG واحداً لكل طفل. ويجلبها `tools/fetch_twemoji.py`.
//   • **رموز الواجهة** (زرّ السماع، الاحتفال، القفل، الإعادة…): أيقوناتُنا
//     الخطية أدناه لا Twemoji — لغةُ الواجهة عندنا SVG خطيّ أصلاً (المعالم
//     والميكروفون)، وليست هذه الرموز من بياناتٍ يراجعها أحد.
//
// ولا يبقى في التطبيق محرفُ إيموجي واحد يُسلَّم إلى خطّ النظام — يحرسه
// `tools/test_emoji.mjs` على الشيفرة و`browser_test.py` على الشاشة نفسِها.

// «رمزٌ مصوَّر» قاعدةُ يونيكود لا ذوق: `Emoji_Presentation=Yes` (رسمُه الملوّن هو
// الأصل)، أو محرفٌ أُلحق به مُحدِّدُ التصوير `U+FE0F`. وبها تخرج «✦» و«✓» و«★»
// و«←» — محارفُ نصّية تُرسم بخطّ النصّ نفسِه ولا شأن لها بهذه المهمة. وهذه عينُ
// القاعدة المكتوبة في `tools/fetch_twemoji.py`، ويقابل `test_emoji.mjs` بينهما
// رمزاً رمزاً فلا تنحرف إحداهما عن الأخرى.
const PRESENTATION = '\u{231A}-\u{231B}\u{23E9}-\u{23EC}\u{23F0}\u{23F3}\u{25FD}-\u{25FE}\u{2614}-\u{2615}'
  + '\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}-\u{26AB}\u{26BD}-\u{26BE}\u{26C4}-'
  + '\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}-\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2705}'
  + '\u{270A}-\u{270B}\u{2728}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2795}-\u{2797}'
  + '\u{27B0}\u{27BF}\u{2B1B}-\u{2B1C}\u{2B50}\u{2B55}\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-'
  + '\u{1F19A}\u{1F1E6}-\u{1F1FF}\u{1F201}-\u{1F202}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F236}'
  + '\u{1F238}-\u{1F23A}\u{1F250}-\u{1F251}\u{1F300}-\u{1F320}\u{1F32D}-\u{1F335}\u{1F337}-'
  + '\u{1F37C}\u{1F37E}-\u{1F393}\u{1F3A0}-\u{1F3CA}\u{1F3CF}-\u{1F3D3}\u{1F3E0}-\u{1F3F0}'
  + '\u{1F3F4}\u{1F3F8}-\u{1F43E}\u{1F440}\u{1F442}-\u{1F4FC}\u{1F4FF}-\u{1F53D}\u{1F54B}-'
  + '\u{1F54E}\u{1F550}-\u{1F567}\u{1F57A}\u{1F595}-\u{1F596}\u{1F5A4}\u{1F5FB}-\u{1F64F}'
  + '\u{1F680}-\u{1F6C5}\u{1F6CC}\u{1F6D0}-\u{1F6D2}\u{1F6D5}-\u{1F6D7}\u{1F6DC}-\u{1F6DF}'
  + '\u{1F6EB}-\u{1F6EC}\u{1F6F4}-\u{1F6FC}\u{1F7E0}-\u{1F7EB}\u{1F7F0}\u{1F90C}-\u{1F93A}'
  + '\u{1F93C}-\u{1F945}\u{1F947}-\u{1F9FF}\u{1FA70}-\u{1FA7C}\u{1FA80}-\u{1FA88}\u{1FA90}-'
  + '\u{1FABD}\u{1FABF}-\u{1FAC5}\u{1FACE}-\u{1FADB}\u{1FAE0}-\u{1FAE8}\u{1FAF0}-\u{1FAF8}';
const BASE_CHARS = '\u{A9}\u{AE}\u{203C}\u{2049}\u{2122}\u{2139}\u{2194}-\u{21AA}\u{231A}-\u{231B}\u{2328}'
  + '\u{23CF}-\u{23FA}\u{24C2}\u{25AA}-\u{25FE}\u{2600}-\u{27BF}\u{2934}-\u{2935}\u{2B00}-'
  + '\u{2BFF}\u{3030}\u{303D}\u{3297}\u{3299}\u{1F000}-\u{1FAFF}';
const ZWJ = '\u{200D}';
const VS16 = '\u{FE0F}';
const EMOJI_RE = new RegExp(
  `^(?:[${PRESENTATION}]${VS16}?|[${BASE_CHARS}]${VS16})`
  + `(?:${ZWJ}(?:[${PRESENTATION}]|[${BASE_CHARS}])${VS16}?)*$`, 'u');

/** أهذا النصُّ رمزٌ مصوَّر بتمامه؟ (حرفٌ عربيّ أو «۞» أو «✦»: لا). */
export const isEmoji = (text) => typeof text === 'string' && EMOJI_RE.test(text);

/**
 * مسارُ ملف الرمز في `app/emoji/` — نقاطُه بالست عشري موصولةً بشرطة.
 * وقاعدةُ `U+FE0F` قاعدةُ مجموعة Twemoji نفسِها: يُحذف المُحدِّد إلا في تسلسل ZWJ —
 * فالميزان (U+2696 U+FE0F) ملفُّه `2696.svg`، والطبيب (U+1F468 U+200D U+2695 U+FE0F)
 * ملفُّه `1f468-200d-2695-fe0f.svg` بمُحدِّده. (ولا يُكتب في هذا الملف محرفُ إيموجي
 * واحد ولو في تعليق — النطاقات أعلاه بالهروب لذلك، ويحرسه `tools/test_emoji.mjs`.)
 */
export function emojiSrc(glyph) {
  const text = glyph.includes(ZWJ) ? glyph : glyph.replaceAll(VS16, '');
  return `emoji/${[...text].map((ch) => ch.codePointAt(0).toString(16)).join('-')}.svg`;
}

/**
 * صورةُ الرمز — مربّعةٌ بمقاس سطرها (`1em`) فتحلّ محلّ المحرف في مكانه بلا إزاحة.
 * و`data-emoji` تُعلن أيَّ رمزٍ ترسم: كان الرمزُ نصّاً يُقرأ من الشاشة فصار صورة،
 * فلولا الإعلانُ لعميت عنه اختباراتُ المتصفّح التي تتحقّق أنّ المعروض هو المقصود.
 */
export const emojiImg = (glyph) => h('img', {
  class: 'emoji', src: emojiSrc(glyph), alt: '', 'aria-hidden': 'true',
  draggable: false, 'data-emoji': glyph,
});

/**
 * **المُصيِّر الواحد**: وجهٌ في صندوقه — رمزاً مصوَّراً كان أو حرفاً أو أيقونةً خطية.
 *
 * الصندوقُ الخارجيّ يبقى كما كان بصنفه وتنسيقه (فحجم الرمز ولونه من CSS كما هما)،
 * وإنما يتبدّل ما بداخله: `<img>` للمصوَّر، ونصٌّ للحرف العربي («ب»، «ـَا»، «۞»).
 * فما من موضعٍ في التطبيق يكتب رمزاً في DOM إلا من هنا.
 */
export function faceEl(value, className, tag = 'span') {
  const drawn = !!value?.nodeType || isEmoji(value);      // صورةٌ أو أيقونة، لا حرفاً
  const inner = value?.nodeType ? value : (drawn ? emojiImg(value) : value);
  // الصورةُ زينةٌ لا نصّ: تُخفى عن قارئ الشاشة كما كان الرمزُ يُخفى قبلها، أما
  // الحرفُ العربيّ فيبقى مقروءاً (وجهُ عقدةِ الحرف وحبرُ الاحتفال يُقرآن).
  return h(tag, { class: className, 'aria-hidden': drawn ? 'true' : null }, inner);
}

// أيقونات الواجهة — لغةُ المعالم نفسُها: خطٌّ بلا ملء، يتبع لون نصّه (`currentColor`).
// كلُّها في صندوق 24×24، فيكفي المقاسَ سطرُها.
const ICONS = {
  // قلمٌ مائل — وجهُ محطات التهيئة الحركية وزرُّ «اكتبه وحدك» (أيقونةُ هذا التطبيق)
  pen: '<path d="M4 20.2 4.9 16l10-10a2.3 2.3 0 0 1 3.2 0l1 1a2.3 2.3 0 0 1 0 3.2l-10 10z"/>'
    + '<path d="m13.4 7.5 3.1 3.1"/><path d="M4.9 16 8 19.1"/>',
  // حلقتان متشابكتان — وجهُ محطات الوصل: حرفان يتصلان بلا رفع القلم
  link: '<path d="M9.6 14.4a3.6 3.6 0 0 1 0-5.1l2.6-2.5a3.6 3.6 0 0 1 5.1 5.1l-1.3 1.3"/>'
    + '<path d="M14.4 9.6a3.6 3.6 0 0 1 0 5.1l-2.6 2.5a3.6 3.6 0 0 1-5.1-5.1l1.3-1.3"/>',
  // بوّابةٌ بقوسها — وجهُ البوابات الثلاث (الجلسة ٣): معلَمُها في `LANDMARKS` مصغَّراً
  // إلى صندوق الأيقونات، فوجهُ البوابة ومَعلَمُها رسمٌ واحد لا رسمان يفترقان.
  gate: '<path d="M3 20.5h18"/><path d="M5.5 20.5V11a6.5 6.5 0 0 1 13 0v9.5"/>'
    + '<path d="M12 20.5V4.5"/><path d="M8.8 20.5v-8a3.2 3.2 0 0 1 6.4 0v8"/>',
  // شجرةُ الجذر — جذعٌ يتفرّع: وجهُ محطة العائلة الصرفية (لغةُ الواجهة SVG لا إيموجي)
  roots: '<path d="M12 21v-8"/><path d="M12 15 7.5 10.5"/><path d="m12 15 4.5-4.5"/>'
    + '<path d="M12 12 8.5 6"/><path d="m12 12 3.5-6"/><circle cx="7.5" cy="9.6" r="1.5"/>'
    + '<circle cx="16.5" cy="9.6" r="1.5"/><circle cx="8.5" cy="5" r="1.5"/>'
    + '<circle cx="15.5" cy="5" r="1.5"/>',
  // مكبّر الصوت — زرّ «اسمع» وأذنُ الصورة
  ear: '<path d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4z"/>'
    + '<path d="M15.6 9.2a4 4 0 0 1 0 5.6"/><path d="M18.3 6.4a8 8 0 0 1 0 11.2"/>',
  // سمّاعتان — «أيها سمعت؟»
  headphones: '<path d="M4 15.5V12a8 8 0 0 1 16 0v3.5"/>'
    + '<path d="M4 15.5a2.4 2.4 0 0 1 4.8 0v2.6a2.4 2.4 0 0 1-4.8 0z"/>'
    + '<path d="M15.2 15.5a2.4 2.4 0 0 1 4.8 0v2.6a2.4 2.4 0 0 1-4.8 0z"/>',
  // وثبةُ فرح — احتفالُ الختام (وهي شقيقةُ النجمة في اللوح لا صورةُ مفرقعات)
  party: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3"/>'
    + '<path d="M2.5 12h3M18.5 12h3"/><path d="m5.3 5.3 2.1 2.1M16.6 16.6l2.1 2.1"/>'
    + '<path d="m18.7 5.3-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
  // قفلٌ مغلق — المحطة التي لم يبلغها بعد
  lock: '<rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2"/>'
    + '<path d="M8.2 10.5V7.2a3.8 3.8 0 0 1 7.6 0v3.3"/>',
  // سهمان يدوران — المراجعة و«تابع من هنا»
  repeat: '<path d="M4 11V9.6A4.6 4.6 0 0 1 8.6 5H19"/><path d="m16.4 2.4 2.9 2.6-2.9 2.6"/>'
    + '<path d="M20 13v1.4a4.6 4.6 0 0 1-4.6 4.6H5"/><path d="m7.6 21.6-2.9-2.6 2.9-2.6"/>',
  // قطعةُ أُحجية — لعبة تركيب الكلمات
  puzzle: '<path d="M4.5 9.6V4.5h5.1a2.4 2.4 0 0 1 4.8 0h5.1v5.1a2.4 2.4 0 0 0 0 4.8v5.1h-5.1'
    + 'a2.4 2.4 0 0 0-4.8 0H4.5v-5.1a2.4 2.4 0 0 0 0-4.8z"/>',
  // كتابٌ مفتوح — سلّم الجمل وشاشة القراءة (شقيقُ معلم المكتبة على الخريطة)
  book: '<path d="M12 6.5v14"/><path d="M12 6.5C9.4 4.6 6.3 4 3.5 4.4v13.9c2.8-.4 5.9.2 8.5 2.2"/>'
    + '<path d="M12 6.5c2.6-1.9 5.7-2.5 8.5-2.1v13.9c-2.8-.4-5.9.2-8.5 2.2"/>',
  // كتبٌ مصفوفة — المكتبة
  books: '<path d="M4 20V5.5h3.6V20z"/><path d="M8.8 20V7.5h3.6V20z"/>'
    + '<path d="m14 20 3-13.2 3.5.8L17.6 20z"/><path d="M3 20h18"/>',
  // أسرة — بوابةُ وليّ الأمر (لا وجهَ طفلٍ يُنقر عليه بالخطأ)
  family: '<circle cx="7.5" cy="6.8" r="2.8"/><circle cx="16.8" cy="7.6" r="2.4"/>'
    + '<circle cx="12.2" cy="14.4" r="2"/><path d="M3 15.5a4.5 4.5 0 0 1 8.2-2.6"/>'
    + '<path d="M13.2 13.2a4 4 0 0 1 7.3 2.3"/><path d="M8.6 21a3.7 3.7 0 0 1 7.2 0"/>',
  // وجهٌ يبتسم — بشرى العبور واللمسات اللطيفة
  smile: '<circle cx="12" cy="12" r="8.8"/><path d="M8.2 14.4a4.7 4.7 0 0 0 7.6 0"/>'
    + '<circle cx="9.2" cy="10" r=".9" fill="currentColor" stroke="none"/>'
    + '<circle cx="14.8" cy="10" r=".9" fill="currentColor" stroke="none"/>',
  // لهبٌ — سلسلةُ أيام المراجعة المتتالية
  flame: '<path d="M12 2.8c.4 3.4 4.6 5.3 4.6 9.6a4.6 4.6 0 0 1-9.2 0c0-1.9.9-3.2 1.9-4.2'
    + '.1 1.5.9 2.4 1.8 2.4 1.3 0 1.4-2.4-.5-4.4z"/>'
    + '<path d="M12 20.9a2.6 2.6 0 0 1-2.6-2.6c0-1.5 2.6-3.4 2.6-3.4s2.6 1.9 2.6 3.4'
    + 'A2.6 2.6 0 0 1 12 20.9z"/>',
  // عينٌ مفتوحة — زرُّ «أرِنِي» في محطة الخفوت: يردّ النموذجَ ويكلّف درجةً
  eye: '<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"/>'
    + '<circle cx="12" cy="12" r="3"/>',
  // هديّةٌ معقودة — فتحُ المجموعة التالية
  gift: '<rect x="3.5" y="9.4" width="17" height="4" rx="1"/>'
    + '<path d="M5.2 13.4V20h13.6v-6.6"/><path d="M12 9.4V20"/>'
    + '<path d="M12 9.4c-3.4 0-5-.7-5-2.3S9.6 4.5 12 9.4z"/>'
    + '<path d="M12 9.4c3.4 0 5-.7 5-2.3S14.4 4.5 12 9.4z"/>',
};

/**
 * أيقونةُ واجهة — رمزٌ من صنع الواجهة لا من بيانات المنهج (DESIGN §٦).
 * تتبع لون نصّها ومقاسَه، فتقع من الزرّ موقعَ محرفها الذي كانت. وحيث كان الرمز
 * في **شارةٍ** مقيسةٍ بالبكسل (أذنُ الصورة، قفلُ العقدة) تُوضع داخلها لا مكانَها:
 * الشارةُ صندوقُها والأيقونةُ حبرُها، فلا يتنازع صنفان على مقاسٍ واحد.
 */
export function icon(name) {
  if (!ICONS[name]) return null;
  const el = h('span', { class: 'ui-icon', 'aria-hidden': 'true' });
  el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  return el;
}

/** أسماء أيقونات الواجهة — يقرؤها حارسُ `tools/test_emoji.mjs`. */
export const ICON_NAMES = Object.keys(ICONS);

/**
 * سطرُ الإتقان: نصُّه ثم وثبةُ الفرح — بديلُ محرف الاحتفال الذي كان يُختم به النصّ.
 * (يُمرَّر إلى `h` كما يُمرَّر النصّ، فهي تفرد المصفوفة على أبنائها.)
 */
export const cheer = (text) => [text, ' ', icon('party')];

// ————— توسيط الحرف البطل في صندوقه (بلاغ المالك ٦ أغسطس ٢٠٢٦) —————

/**
 * انزياح مركز حبر النصّ عن مركز سطره، بوحدة `em` فيصلح لكل مقاس.
 *
 * الخطّ العربي يُجلس الحرف على خطّ أساسٍ لا في وسط سطره: مع `line-height: 1` يقع خطّ
 * الأساس أسفلَ مركز السطر بمقدار `(صعود − هبوط) ÷ ٢` من مقاييس الخط، ثم يتوزّع حبرُ
 * الحرف حول خطّ الأساس بحسب جِرمه — فألفٌ صاعدة تعلو المركز، وباءٌ منقوطةٌ تحت تهبط
 * عنه، وميمٌ نازلة أشدّ هبوطاً. فالتوسيط الهندسي وحده يكذب على العين، والصادق أن
 * يُرفع كلُّ حرفٍ بمقدار انزياح حبره هو.
 *
 * موجبُ الناتج يعني أن الحبر يجلس **تحت** المركز، فالرفعة سالبُه.
 */
const LIFT_PROBE = 200;                       // مقاس قياسٍ ثابت: النسبة واحدة في كل الأحجام
const liftCache = new Map();
let liftCtx;

export function inkLift(text, family = 'Noto Naskh Arabic') {
  const key = `${family}|${text}`;
  if (liftCache.has(key)) return liftCache.get(key);
  let em = 0;
  try {
    liftCtx ??= document.createElement('canvas').getContext('2d');
    liftCtx.font = `${LIFT_PROBE}px "${family}", serif`;
    liftCtx.textBaseline = 'alphabetic';
    const m = liftCtx.measureText(text);
    const base = (m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2;
    const ink = (m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2;
    if (Number.isFinite(base + ink)) em = (base + ink) / LIFT_PROBE;
  } catch {
    em = 0;                                   // متصفّح بلا canvas: توسيطٌ هندسيّ كما كان
  }
  liftCache.set(key, em);
  return em;
}

/**
 * حبرُ الصندوق الكبير: نصٌّ مرفوعٌ إلى مركز الصندوق بصرياً.
 *
 * والقياس يُعاد مرةً واحدة بعد وصول الخطّ (`font-display: swap` يرسم بخطٍّ احتياطيّ
 * أولاً، ومقاييسه غير مقاييس النسخ) — فلا يُثبَّت على الشاشة رقمُ خطٍّ ليس المعروض.
 */
export function giantInk(text) {
  // رمزٌ مصوَّر: لا خطَّ أساسٍ له ولا حبرَ يُقاس — صورةٌ في موضع الحبر وكفى
  if (isEmoji(text)) return faceEl(text, 'giant-ink');
  const span = h('span', { class: 'giant-ink' }, text);
  const apply = () => span.style.setProperty('--letter-lift', `${(-inkLift(text)).toFixed(4)}em`);
  apply();
  const fonts = typeof document !== 'undefined' && document.fonts;
  if (fonts && !fonts.check(`${LIFT_PROBE}px "Noto Naskh Arabic"`)) {
    fonts.ready.then(() => { liftCache.clear(); apply(); });
  }
  return span;
}

/**
 * خطوةٌ بطلُها صندوقٌ كبير: شقٌّ للبطل وشقٌّ لعُدّته.
 *
 * في الوضع الطولي — وهو المرجع الأول — الشقّان `display: contents` فيذوبان، ويبقى
 * الترتيب على الشاشة كما كان حرفاً بحرف. وفي الوضع العرضيّ القصير وحدَه يصطفّان
 * جنباً إلى جنب فتسع الخطوةُ الشاشةَ بلا سحب (بلاغ المالك ٦ أغسطس ٢٠٢٦، `app.css`).
 */
export const heroStep = (hero, rest) => h('div', { class: 'hero-step' },
  h('div', { class: 'hero-side' }, hero),
  h('div', { class: 'hero-rest' }, rest),
);

/**
 * **ميداليةُ الختام تحمل أثرَ الطفل نفسَه** — حكمُ المالك في `REVIEW_IDENTITY.md §٣ج`
 * (الجلسة هـ٢): بطلُ هذا التطبيق **الأثر**، فالقرصُ يحمل ما كتبته يدُه قبل ثانية لا
 * أيقونةَ واجهةٍ محايدة يشترك فيها كلُّ ختام.
 *
 * ونقاطُ الحبر تُنسَخ كما رسمها المحرّكُ على شبكته (١٠٠٠×١٠٠٠)، **ويُوسَّع الإطارُ
 * حولَها هامشاً** كي لا يُقَصّ الأثرُ على حافة القرص المستدير.
 * **ولا تُخزَّن ولا تُرسَل**: عقدةٌ في الشاشة تموت بها (`METHOD §٣.٧`).
 */
export function traceFace(paths, className = 'celebrate-face') {
  const el = h('div', { class: className });
  el.innerHTML = `<svg class="trace-ink" viewBox="-190 -190 1380 1380" fill="none"
    stroke="currentColor" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">${paths.map((d) => `<path d="${d}" />`).join('')}</svg>`;
  return el;
}

/** معلم المحطة على الخريطة — زخرفة صامتة بلون المرحلة (DESIGN §٦). */
export function landmark(kind) {
  if (!LANDMARKS[kind]) return null;
  const el = h('span', { class: 'station-mark', 'aria-hidden': 'true' });
  el.innerHTML = `<svg viewBox="0 0 64 48" fill="none" stroke="var(--accent)"
    stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${LANDMARKS[kind]}</svg>`;
  return el;
}

// **`coverEl` لم تُنقَل من البذرة**: أغلفةُ القصص بيانُ قصةٍ (`cover: {hero, mood}`)،
// و«اُكْتُبْ» **لا قصص فيه ألبتّة** — لا اليومَ ولا غداً (`METHOD.md §٤`: مراحلُه
// أربعَ عشرة، ليس فيها قراءةٌ مؤلَّفة). فهذا حذفٌ لِما لا موضوعَ له **أبداً**، لا
// تعليقٌ لِما لم يحن — والفرقُ مقيَّدٌ في `docs/SEED.md`.

/** هزّة قصيرة تنبّه الطفل إلى خطأ دون كلام. */
export function shake(el) {
  el.classList.remove('shake');
  void el.offsetWidth;   // إعادة تشغيل الحركة
  el.classList.add('shake');
}

/**
 * وثبة قصيرة تحتفي بالصواب دون كلام — بديل الصوت في التمارين السماعية:
 * الإجابة الصحيحة هناك لا تُعاد قراءتها (DESIGN §٥.٢)، فيبقى للمسة أثرٌ يتحرّك.
 */
export function pop(el) {
  el.classList.remove('pop');
  void el.offsetWidth;   // إعادة تشغيل الحركة
  el.classList.add('pop');
}

// ————— عشوائية (قابلة للحقن في الاختبارات) —————

export function shuffle(list, rnd = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const pick = (list, rnd = Math.random) => list[Math.floor(rnd() * list.length)];
