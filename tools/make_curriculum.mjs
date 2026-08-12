// أداةُ اشتقاق المنهج — **«اُكْتُبْ» لا يؤلّف مادّةً، يقرأ مادّةَ «اِقْرَأْ» ويعيد ترتيبها كتابةً**:
//
//   node tools/make_curriculum.mjs              # جردٌ يُطبع ولا يُكتب (وعددُ المحطات محسوباً)
//   node tools/make_curriculum.mjs --build      # يكتب app/js/curriculum.js
//   node tools/make_curriculum.mjs --self-test  # عهدُ الاشتقاق: أكلُّ ما في الوحدة من اقرأ؟
//
// ## العهد
//
// `SESSIONS.md`: «بيانات المنهج مصدرها الوحيد `app/js/curriculum.js` **وتُشتقّ من
// بيانات اقرأ آلياً لا تُنسخ بيد**»، و`METHOD.md §٨`: «ترتيبُ المجموعات السبع
// وحروفُها · بنكُ الكلمات المصوَّرة · سلّمُ الجمل · أصواتُها ببصماتها». فهذه الأداة
// **تستورد وحدات اقرأ نفسَها** (`curriculum.js` و`sentences.js` و`lexicon.json`
// و`audio/manifest.json`) — لا تنسخ منها سطراً ولا تُعيد كتابة كلمةٍ بيد.
//
// **وأثقلُ ما فيها ليس النقل بل الترتيب**: اقرأ يرتّب مادّته للقراءة، واكتبُ يرتّبها
// لليد. فالمشتقُّ من اقرأ **ما هو مادّة** (حروفٌ وكلماتٌ وجملٌ وعلاماتٌ وأصوات)،
// والمؤلَّفُ هنا **ترتيبُها الكتابيّ** (جدولُ `METHOD.md §٤`) — وكلُّ قرارِ ترتيبٍ
// معلَّلٌ في موضعه أدناه، ولا مادّةَ تُخترع لسدّ فجوة: ما لم يوجد في اقرأ **يُبلَّغ**.
//
// ## أرقامٌ محسوبة لا مكتوبة
//
// لا رقمَ محطاتٍ في هذا الملف ولا في الوحدة المولَّدة: محطاتُ الحروف حروفُ اقرأ،
// ومحطاتُ الأشكال مجموعاتُه في ثلاثة، وحِمْلُ محطة النسخ والإملاء **باقتُه نفسُها**
// (`lexicon.json: bundleSize`). فرقمٌ يتغيّر بتغيّر بياناته ليس انحرافاً
// (`METHOD.md §٤`) — والجردُ أدناه يطبع المجموعَ محسوباً.
//
// ## ولماذا مولّدان لملفّين؟
//
// `paths.js` تكتبه عدّةُ الجلسة ٢ وهذا يكتب `curriculum.js` — قرارُ الجلسة ٢ بعينه،
// لئلّا يمحو مولّدٌ عملَ مولّد. و`curriculum.js` يصدّر `PATHS` من جاره فيبقى مصدرَ
// الحقيقة الوحيد للشاشات.

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../', import.meta.url);
const OUT = new URL('app/js/curriculum.js', ROOT);

// ————— أين «اِقْرَأْ»؟ —————
// المرجعُ الحيّ مجلدٌ شقيقٌ في الـworkspace (`CLAUDE.md`: «يُقرأ ولا يُمَسّ»). ولا
// يُخمَّن موضعُه ولا يُتجاوَز غيابُه: إن غاب سقطت الأداةُ بنصٍّ يقول ما تريد — فلا
// يُبنى منهجٌ من فراغٍ ولا تُملأ فجوةٌ بتأليف.
const readArg = process.argv.indexOf('--read');
const READ = readArg > 0 && process.argv[readArg + 1]
  ? new URL(`${process.argv[readArg + 1].replace(/\/?$/, '/')}`, `file://${process.cwd()}/`)
  : new URL('../read/', ROOT);

function require_(rel) {
  const url = new URL(rel, READ);
  if (!existsSync(url)) {
    console.error(`لم يُوجد ملفُّ اقرأ: ${fileURLToPath(url)}\n`
      + 'المنهجُ يُشتقّ من بيانات «اِقْرَأْ» ولا يُؤلَّف — ومرِّر موضعَه بـ‎--read <path>‎.');
    process.exit(2);
  }
  return url;
}

const SOURCES = {
  curriculum: require_('app/js/curriculum.js'),
  sentences: require_('app/js/sentences.js'),
  lexicon: require_('app/data/lexicon.json'),
  manifest: require_('app/audio/manifest.json'),
};

const rel = (url) => decodeURIComponent(url.href.slice(READ.href.length));
const sha12 = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 12);

const rc = await import(SOURCES.curriculum);
const rs = await import(SOURCES.sentences);
const lexicon = JSON.parse(readFileSync(SOURCES.lexicon, 'utf8'));
/** بنكُ صوت اقرأ: مفتاحُ الملفّ sha1 نصِّه — فسؤالُ «أللكلمة صوتٌ عنده؟» يُجاب بالبنك لا بالظنّ. */
const SPOKEN = new Set(Object.values(JSON.parse(readFileSync(SOURCES.manifest, 'utf8'))));

// ————— ١. الحروف ورسمُها —————

/** الحروفُ الثمانيةُ والعشرون بأسمائها ووصلِها — **من `LETTERS` في اقرأ حرفاً**. */
const LETTERS = Object.fromEntries(
  Object.entries(rc.LETTERS).map(([ch, info]) => [ch, { name: info.name, joins: info.joins }]));
const isLetter = (ch) => Object.hasOwn(LETTERS, ch);

/**
 * **الحروفُ المتغيّرة** — وهي تطبيقُ ق٣ في الرسم: الهمزاتُ والتاءُ المربوطة والألفُ
 * المقصورة **ليست حروفاً جديدة تُدرَّس**، بل **حرفٌ مدروسٌ وعليه علامة**: أ إ آ ألفٌ
 * بعلامة، وؤ واو، وئ ياء، وة هاءٌ بنقطتين، وى ياءٌ بلا نقط. فتُعلَن أصولُها ليقيس
 * عليها الفاحصُ شكلَ الموقع، ولتدخل `MARKS` أدناه ببطاقة تعريفٍ عند أول كلمةٍ تحملها.
 *
 * **ووصلُها وصلُ أصلها إلا ما فرّقه الرسمُ نفسُه**: ة وى لا تقعان إلا آخرَ الكلمة
 * فلا تصلان بما بعدهما وإن وصل أصلُهما.
 *
 * **وهو الشيءُ الوحيد المُعلَن هنا ولا يُشتقّ** — لأنّ اقرأ ليس عنده إلا حروفُه
 * الثمانيةُ والعشرون: القراءةُ لا تفرّق أ عن ا (كلاهما يُقرأ بحركته)، والرسمُ يفرّق.
 * وهذه أداةُ رسم.
 */
const VARIANTS = {
  'أ': { base: 'ا', mark: 'همزةٌ فوق الألف', joins: false },
  'إ': { base: 'ا', mark: 'همزةٌ تحت الألف', joins: false },
  'آ': { base: 'ا', mark: 'مدّةٌ فوق الألف', joins: false },
  'ؤ': { base: 'و', mark: 'همزةٌ فوق الواو', joins: false },
  'ئ': { base: 'ي', mark: 'همزةٌ فوق الياء', joins: true },
  'ء': { base: null, mark: 'همزةٌ مفردة', joins: false },
  'ة': { base: 'ه', mark: 'تاءٌ مربوطة', joins: false },
  'ى': { base: 'ي', mark: 'ألفٌ مقصورة', joins: false },
};
const isVariant = (ch) => Object.hasOwn(VARIANTS, ch);
const joinsAfter = (ch) => (isLetter(ch) ? LETTERS[ch].joins : VARIANTS[ch]?.joins ?? false);

/** أشكالُ الموقع الأربعة — أسماؤها ثابتةٌ لأنها تدخل مفاتيح ليتنر (`METHOD.md §٦`). */
const FORMS = { ISOLATED: 'isolated', INITIAL: 'initial', MEDIAL: 'medial', FINAL: 'final' };

/**
 * **رسمُ نصٍّ**: كلُّ محرفٍ في موضعه بشكله — قاعدةُ العربية نفسُها ولا خيارَ فيها:
 * يتصل بما قبله إن كان ما قبله واصلاً، وبما بعده إن كان هو واصلاً وبعده حرف.
 * (ويقيسه `check_writable.py` مرّةً أخرى من `LETTERS` نفسِها — فلا يُوثَق بمولِّدٍ وحدَه.)
 */
function shape(text) {
  const chars = [...text].filter((ch) => isLetter(ch) || isVariant(ch));
  return chars.map((ch, i) => {
    const tied = i > 0 && joinsAfter(chars[i - 1]);
    const open = joinsAfter(ch) && i + 1 < chars.length;
    if (tied && open) return [ch, FORMS.MEDIAL];
    if (tied) return [ch, FORMS.FINAL];
    if (open) return [ch, FORMS.INITIAL];
    return [ch, FORMS.ISOLATED];
  });
}

/** علاماتُ نصٍّ: كلُّ محرفٍ ليس من الحروف الثمانية والعشرين — حركاتٌ وشدّةٌ وتنوينٌ ومتغيّرات. */
const marksOf = (text) => [...text].filter((ch) => ch !== ' ' && !isLetter(ch));

// ————— ١ب. نسبُ الرسم: أسرُ المتشابهات —————
//
// **المادّةُ الوحيدة في هذا المولّد التي ليست من اقرأ** — وعلّتُها أنّ اقرأ لا يعرفها:
// «جسمُ الثاء جسمُ الباء والفارقُ نقاطُها» حقيقةُ **رسمٍ** لا حقيقةُ قراءة، والقراءةُ
// لا تجمع ب وت وث في باب. فمصدرُها **ملفُّ الإيماءات** (`tools/path_anchors.json`)
// حيث تُعلَن سائرُ حقائق الرسم المؤلَّفة (من أين يبدأ القلم وإلى أين يمضي)، وتُقرأ
// هنا آلياً — **ولا تُكتب أسرةٌ في هذا الملف**.
//
// **ويثبتها المحرّكُ لا الدعوى**: `tools/test_paths.mjs` يُدخل شكلَ كلِّ أختٍ على
// حَكَم أختها فيلزم أن يُرَدّ — فسؤالُ التمييز مُحكَمٌ عليه، ولا يمرّ جوابُ أختٍ عن أخت.

const ANCHORS = JSON.parse(readFileSync(new URL('path_anchors.json', import.meta.url), 'utf8'));

/** إيماءةُ شكلٍ بعد فكّ دعوى «عينُ شكلٍ آخر» — فالنسبُ يُقرأ من الشكل الذي بُني منه. */
function anchorOf(ch, form, seen = new Set()) {
  const entry = ANCHORS.letters?.[ch]?.[form];
  if (!entry || seen.has(form)) return null;
  if (entry.sameAs) return anchorOf(ch, entry.sameAs, seen.add(form));
  return entry;
}

/** جذعُ أسرة الشكل: الحرفُ الذي جسمُه جسمُه (ونفسُه إن لم يكن له نسب). */
const kinRoot = (ch, form) => anchorOf(ch, form)?.kin || ch;

/**
 * أسرُ المتشابهات بين حروفٍ بعينها في شكلِ موقعٍ بعينه — الأسرةُ عضوان فأكثر،
 * وترتيبُها ترتيبُ المنهج (فتُعرَض للطفل كما لقيها).
 */
function kinFamilies(letters, form) {
  const groups = new Map();
  for (const ch of letters) {
    const root = kinRoot(ch, form);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(ch);
  }
  return [...groups.values()].filter((family) => family.length > 1);
}

// ————— ٢. بنكُ اقرأ: الكلماتُ بترتيبها عنده —————
//
// ثلاثةُ مصادرَ بترتيب رحلته: كلماتُ مجموعاته (يهجّيها الطفل حرفاً حرفاً)، ثم كلماتُ
// مهاراته (وهي **حاملاتُ العلامات**)، ثم معجمُ «حديقة الكلمات». والنصُّ المكتوب
// **تركيبُ مقاطعه** كما يعرضه اقرأ للطفل («بَا» + «بْ» = «بَابْ»)، و`say` مفتاحُ
// ملفه الصوتيّ عنده.

const bank = new Map();
const addWord = (text, say, emoji, from) => {
  if (!bank.has(text)) bank.set(text, { text, say, emoji: emoji || null, from });
};

for (const group of rc.GROUPS) {
  for (const w of group.words) addWord(w.tiles.join(''), w.say, w.emoji, group.id);
}
for (const skill of rc.SKILLS) {
  for (const w of skill.words) addWord(w.text, w.text, w.emoji, skill.id);
}
for (const w of lexicon.words) addWord(w.word, w.word, w.emoji, `lex:${w.theme}`);

/** كلماتُ الجمل المساندة (`lexicon.json: support`) — منها ما لا صوتَ له، فيُنسخ ولا يُملى. */
const SUPPORT = new Set(lexicon.support || []);

/**
 * **مفتاحُ البنك لكلمةٍ كما وردت في جملة**: الجملةُ تُلبِس كلمتَها لامَ التعريف وحركةَ
 * الإعراب (`sentences.js: dressOf`) والبنكُ يعرفها عاريةً. فيُجرَّب المكتوبُ كما هو،
 * ثم جذعُه (بلا «الْ» وبلا حركةِ آخره)، ثم جذعُه بسكونه — **أوّلُ ما يعرفه البنك**.
 */
function bankKey(surface) {
  const stem = rs.stemOf(surface);
  for (const candidate of [surface, stem, `${stem}ْ`]) {
    if (bank.has(candidate) || SUPPORT.has(candidate)) return candidate;
  }
  return null;
}

// ————— ٣. مادّةُ الجمل: أوائلُ سلّم اقرأ —————
//
// **الجملُ تقود الكلمات لا العكس** — وهو ألزمُ ما في هذا الترتيب: محطةُ الجمل آخِرُ
// الرحلة، وحارسُ `check_writable.py` يمنع أن تُطلب كتابةُ كلمةٍ لم تُدرَّس. فلو
// اختيرت الكلماتُ بالذوق أولاً لَما وُجدت جملةٌ تُكتب بها. فتُؤخَذ **أوائلُ السلّم**
// — وترتيبُه عنده مرتَّبٌ بالحصيلة أصلاً («الجملة تظهر في أوّل موضعٍ تكون فيه كلماتها
// كلها مدروسة») — ثم تُدرَّس كلماتُها قبلها.
//
// **وكم جملة؟** حِمْلُ المحطة **باقةُ اقرأ** (`bundleSize`)، ومحطاتُ الجمل أربعٌ في
// جدول `METHOD.md §٤` — فأربعُ باقاتٍ من رأس السلّم.

const BUNDLE = lexicon.bundleSize || 5;
const SENTENCE_STATIONS = 4;                         // `METHOD.md §٤` — المرحلة ١٤

const sentences = rs.SENTENCES.slice(0, SENTENCE_STATIONS * BUNDLE).map((s) => ({
  text: s.text,
  from: s.rung.id,
  words: s.words.map((surface) => [surface, bankKey(surface)]),
}));

const orphans = sentences.flatMap((s) => s.words).filter(([, key]) => !key).map(([w]) => w);
if (orphans.length) {
  console.error(`كلماتُ جملٍ لا يعرفها بنكُ اقرأ: ${orphans.join('، ')}`);
  process.exit(2);
}

/** كلماتُ الجمل بترتيب ورودها، مقسومةً: ما في البنك كلمةً قائمة، وما هو مساند. */
const sentenceWords = [];
for (const s of sentences) {
  for (const [, key] of s.words) if (!sentenceWords.includes(key)) sentenceWords.push(key);
}
const targets = sentenceWords.filter((key) => bank.has(key));
const supports = sentenceWords.filter((key) => !bank.has(key));

// ————— ٤. الوصلات: من كلمات اقرأ نفسِها —————
//
// «وصلُ حرفين فثلاثة» (`METHOD.md §٤` المرحلة ١٢) — **ولا تُخترع وصلةٌ**: تُقرأ من
// جوار الحروف في كلمات المجموعات، أوّلاً فأوّلاً. فما يتدرّب عليه الطفلُ وصلاً هو
// عينُ ما سيكتبه كلمةً بعد قليل.

const groupWords = rc.GROUPS.map((g) => ({ group: g, words: g.words.map((w) => w.tiles.join('')) }));

function ligatures(size) {
  const out = [];
  for (const { words } of groupWords) {
    for (const text of words) {
      const chars = [...text].filter((ch) => isLetter(ch) || isVariant(ch));
      for (let i = 0; i + size <= chars.length; i++) {
        const run = chars.slice(i, i + size);
        if (!run.slice(0, -1).every(joinsAfter)) continue;   // الوصلةُ ما اتّصل
        const joined = run.join('');
        if (!out.includes(joined)) out.push(joined);
      }
    }
  }
  return out.slice(0, BUNDLE);
}

// ————— ٥. علاماتُ ق٣: حاملاتُها من بنك اقرأ —————
//
// قرارُ المالك ق٣: «الشدّة والتنوين والهمزات **في مواضعها ضمن الكلمات** … وأولُ
// كلمةٍ تحمل العلامة تفتح بطاقةَ تعريفٍ قصيرة بها قبل كتابتها، والتفصيلُ يُحسب من
// بيانات اقرأ آلياً». فمصدرُ مادّتها اثنان وكلاهما محسوب:
//
//   ١) **مهاراتُ اقرأ التي لها كلماتُها** — وهي بعينها الشدّةُ والتنوين ولامُ
//      التعريف. لم تُسمَّ هنا: تُقرأ ممّا يُعلنه (`marks` و`words` غيرُ فارغتين)،
//      فإن زاد مهارةً بكلماتها دخلت المنهجَ بلا سطرٍ يُعدَّل.
//   ٢) **وما بقي من علامات ق٣ بلا حامل** — والهمزاتُ منها: يُبحَث عن **أوّل كلمةٍ في
//      البنك تحملها**. فلا علامةَ في العهد بلا كلمةٍ تحملها، ولا كلمةَ تُختار بالذوق.
//      **وما لا حاملَ له في البنك يُبلَّغ ولا يُخترع له** (يُطبع في ذيل الجرد).

const skillSigns = rc.SKILLS
  .filter((s) => s.marks?.length && s.words?.length)
  .map((s) => ({ id: s.id, title: s.title, words: s.words.map((w) => w.text) }));

/** علاماتُ ق٣ التي يجب أن يجدها الطفلُ مكتوبةً: الشدّةُ والتنوينُ بأنواعه وكلُّ مرسومٍ بهمزة. */
const Q3 = ['ّ', 'ً', 'ٌ', 'ٍ', ...Object.keys(VARIANTS).filter((ch) => VARIANTS[ch].mark.includes('همزة'))];

const covered = new Set([
  ...groupWords.flatMap(({ words }) => words),
  ...skillSigns.flatMap((s) => s.words),
].flatMap(marksOf));

// ————— ٥ب. قاعدةُ الحامل: البحثُ يتّسع قبل أن يُحكَم بالغياب —————
//
// **حكمُ المدير** (مراجعة الجلسة ٣، وبندٌ في الجلسة ٨): «لا كلمةَ تُخترع — والبحثُ
// يتّسع قبل أن يُحكَم بالغياب: يبحث المولّدُ **سطوحَ اقرأ كلَّها** (بنكَ الكلمات
// وسلّمَ الجمل وجملَ أمثلة المعجم وكلماتِ المهارات) عن حاملٍ لكل علامةٍ معلنة؛ فإن
// وُجد ضُمّ **آلياً بقاعدةٍ معلنة**، وإن لم يوجد في السطوح كلِّها **سقطت العلامةُ من
// مقرَّر اكتب بإعلانٍ في صفحة الأسس** وبقيت لأتقن. والمولّدُ يطبع حكمَ كل علامة».
//
// **والقاعدةُ المعلَنة للضمّ**: يُؤخَذ **أوّلُ حاملٍ في ترتيب السطوح** (بنكُ الكلمات
// أوّلاً لأنّه مادّةُ الكتابة، ثم كلماتُ الجمل، ثم كلماتُ جمل المعجم) — **وما يُضَمّ
// كلمةٌ لا جملة**: مادّةُ هذه المرحلة كلماتٌ تُنسَخ (`METHOD.md §٤` المرحلة ١٢)،
// فالجملةُ إن كانت هي الحاملَ أُخذت منها **كلمتُها الحاملة** بمفتاح البنك.
const SURFACES = [
  { id: 'bank', title: 'بنكُ الكلمات', words: () => [...bank.keys()] },
  {
    id: 'ladder',
    title: 'سلّمُ الجمل',
    words: () => rs.SENTENCES.flatMap((s) => s.words.map((surface) => bankKey(surface) || surface)),
  },
  {
    id: 'lexicon',
    title: 'جملُ أمثلة المعجم',
    words: () => lexicon.words.flatMap((w) => (w.sentence ? [...w.sentence.split(' ')] : []))
      .map((surface) => bankKey(surface) || surface),
  },
  { id: 'skills', title: 'كلماتُ المهارات', words: () => skillSigns.flatMap((s) => s.words) },
];

const hamzaWords = [];
const markRuling = [];        // حكمُ كل علامةٍ من ق٣ — يُطبع في الجرد ويُحفظ في الوحدة
const missingQ3 = [];
for (const mark of Q3) {
  if (covered.has(mark)) {
    markRuling.push({ mark, where: 'مقرَّرةٌ سلفاً', word: null });
    continue;
  }
  let found = null;
  for (const surface of SURFACES) {
    const bearer = surface.words().find((text) => text && text.includes(mark) && bank.has(text));
    if (bearer) { found = { surface, bearer }; break; }
  }
  if (!found) {
    missingQ3.push(mark);
    markRuling.push({ mark, where: null, word: null });
    continue;
  }
  for (const m of marksOf(found.bearer)) covered.add(m);
  if (!hamzaWords.includes(found.bearer)) hamzaWords.push(found.bearer);
  markRuling.push({ mark, where: found.surface.title, word: found.bearer });
}

// ————— ٦. المحطات: جدولُ `METHOD.md §٤` مرحلةً مرحلة —————

/** قسمةُ المادّة محطاتٍ بحِمْل باقةِ اقرأ، موزَّعةً بالسواء — فلا محطةٌ ببقيّةٍ يتيمة. */
function batches(items, size = BUNDLE) {
  if (!items.length) return [];
  const count = Math.ceil(items.length / size);
  const out = [];
  let at = 0;
  for (let i = 0; i < count; i++) {
    const take = Math.ceil((items.length - at) / (count - i));
    out.push(items.slice(at, at + take));
    at += take;
  }
  return out;
}

const AR = '٠١٢٣٤٥٦٧٨٩';
const arNum = (n) => String(n).replace(/\d/g, (d) => AR[+d]);

const stages = [];

// ——— المرحلة ١: التهيئة الحركية ———
//
// **قبل أيّ حرف** — ومادّتُها ليست من اقرأ: ليس عنده ما يوازيها (ألعابُ ما قبل الحرف
// عنده سمعيةٌ بصرية لا حركية). فهي **الشيءُ الوحيد في هذا المنهج المُعلَن نصّاً**،
// ونصُّه نصُّ `METHOD.md §٤` مفصولاً بفواصله: «خطوطٌ أفقية/رأسية/مائلة · منحنيات
// ودوائر باتجاهٍ صحيح · موجاتٌ وحلقات · تحكّمٌ داخل حدود» — ثلاثٌ في الخطوط وواحدةٌ
// لكلٍّ مما بعدها، فستٌّ كما نصّ الجدول. ومساراتُها تؤلّفها الجلسةُ ٤ بأداة الجلسة ٢.
stages.push({
  id: 'warm',
  kind: 'warmup',
  title: 'تَهْيِئَةُ اليَد',
  sub: 'خطوطٌ ومنحنياتٌ وموجات — قبل أوّل حرف',
  nodes: [
    { part: 'lines-h', title: 'خُطُوطٌ أُفُقِيَّة' },
    { part: 'lines-v', title: 'خُطُوطٌ رَأْسِيَّة' },
    { part: 'lines-d', title: 'خُطُوطٌ مَائِلَة' },
    { part: 'curves', title: 'مُنْحَنَيَاتٌ وَدَوَائِر' },
    { part: 'waves', title: 'مَوْجَاتٌ وَحَلَقَات' },
    { part: 'inside', title: 'تَحَكُّمٌ دَاخِلَ حُدُود' },
  ],
});

// ——— المراحل ٢–٨: الحرفُ المعزول — مجموعةٌ لكل محطة، وحرفٌ لكل عقدة ———
//
// **ولا تُعاد الحروفُ في السطر الثاني** (مراجعة هـ٢، بند م٢.٦): كان `sub` يقول
// «حروفُها: ا ب م ل» يومَ كان عنوانُ المحطة اسمَ مجموعتها — ثم حكم المالكُ في باب
// الأسماء أن تُسمّى المحطةُ **بحروفها** (`REVIEW_IDENTITY §٣ب`: «الاسمُ يقول ما في
// المحطة بعينه: حروفُها **في عنوانها لا في سطرٍ تحته**»)، فصار `stageTitle` يحسبها
// «حُرُوفُ ا ب م ل» — وبقي السطرُ يعيدها تحتها. فالسطرُ الثاني يقول ما لا يقوله
// العنوان: **ما يفعله الطفل في المحطة**، كأخواته في المواقع والوصل والخفوت.
for (const { group } of groupWords) {
  stages.push({
    id: group.id,
    kind: 'letter',
    title: group.title,
    sub: 'كلُّ حرفٍ وحدَه: من أين يبدأ وإلى أين يتّجه',
    nodes: group.letters.map((ch) => ({ part: ch, letter: ch })),
  });
}

// ——— المراحل ٩–١١: أشكالُ المواقع — شكلٌ لكل محطة، ومجموعةٌ لكل عقدة ———
//
// **ولا تدخل العقدةَ إلا حروفٌ شكلُها جديد**: الحرفُ الذي لا يصل بما بعده (ا ر د و ز
// ذ) ابتدائيُّه عينُ معزوله ووسطيُّه عينُ نهائيّه — أثبتته عدّةُ الجلسة ٢ بمقابلة
// بصمتَي القناعين لا بدعوى. فلا يُطلب من طفلٍ أن يتعلّم شكلاً تعلّمه.
const FORM_STAGES = [
  { form: FORMS.INITIAL, title: 'الحَرْفُ أَوَّلَ الكَلِمَة', sub: 'شكلُه حين يبدأ الكلمة ويتصل بما بعده' },
  { form: FORMS.MEDIAL, title: 'الحَرْفُ وَسَطَ الكَلِمَة', sub: 'شكلُه حين يتصل بما قبله وما بعده' },
  { form: FORMS.FINAL, title: 'الحَرْفُ آخِرَ الكَلِمَة', sub: 'شكلُه حين يتصل بما قبله ثم يقف' },
];
for (const { form, title, sub } of FORM_STAGES) {
  const nodes = [];
  for (const { group } of groupWords) {
    const letters = group.letters.filter((ch) => form === FORMS.FINAL || LETTERS[ch].joins);
    if (!letters.length) continue;
    nodes.push({
      part: group.id,
      form,
      letters,
      title: group.title,
      face: rc.letterForms(letters[0])[form],     // وجهُ العقدة شكلُ أوّل حروفها — من اقرأ
    });
  }
  // ——— وخاتمةُ المحطة: **تمييزُ المتشابهات رسماً** (`METHOD.md §٤`) ———
  //
  // «المتشابهاتُ رسماً (ب ت ث · ج ح خ) **متباعدةٌ ثم تُقارَن**»: التباعدُ وقع من نفسه
  // — ترتيبُ اقرأ فرّق الباءَ عن التاء عن الثاء في ثلاث مجموعات — **والمقارنةُ عقدةٌ
  // في ذيل محطة الشكل**: هنا وحدَه تجتمع الأخواتُ اللواتي باعدهنّ المنهجُ قصداً، وقد
  // كُتب كلُّ شكلٍ منهنّ قبل قليل في هذه المحطة نفسِها.
  //
  // **وأسرُ الشبه تُقرأ من نسب الرسم لا تُكتب هنا** (`tools/path_anchors.json: kin`):
  // «جسمُ هذا الشكل جسمُ ذاك والفارقُ علامتُه» — وهي **لكلِّ شكلِ موقعٍ على حدة**،
  // فسنّةُ ن وي جسمُ الباء ابتدائيةً ووسطيةً ولا تجتمعان بها نهائيةً (بطنُ النون
  // وذيلُ الياء جسمان آخران)، وحلقةُ ق حلقةُ الفاء ابتدائيةً ووسطيةً لا نهائيةً.
  // فأسرةٌ تدخل أو تخرج بتبدّل نسب الرسم بلا سطرٍ يُعدَّل هنا.
  const families = kinFamilies(nodes.flatMap((node) => node.letters), form);
  if (families.length) {
    nodes.push({
      part: 'compare',
      form,
      letters: families.flat(),
      compare: families,
      title: 'مَيِّزْ بَيْنَ المُتَشَابِهَات',
      face: rc.letterForms(families[0][0])[form],
    });
  }
  stages.push({ id: form, kind: 'form', title, sub, nodes });
}

// ——— المرحلة ١٢: الوصلُ والنسخ ———
//
// ترتيبُها: وصلتان، ثم كلماتُ كلِّ مجموعةٍ محطةً (عينُ عقدة «لعبة الكلمات» عند اقرأ
// في موضعها من رحلته)، ثم كلماتُ العلامات بمهاراتها فالهمزة، ثم ما تحتاجه جملُ
// المرحلة ١٤ من كلماتٍ مساندة.
const joinNodes = [
  { part: 'pair', title: 'وَصْلُ حَرْفَيْن', joins: ligatures(2) },
  { part: 'triple', title: 'وَصْلُ ثَلَاثَة', joins: ligatures(3) },
];
for (const { group, words } of groupWords) {
  joinNodes.push({ part: `w-${group.id}`, title: `كَلِمَاتُ ${group.title}`, words });
}
for (const sign of skillSigns) {
  joinNodes.push({ part: `sign-${sign.id}`, title: sign.title, words: sign.words });
}
if (hamzaWords.length) joinNodes.push({ part: 'sign-hamza', title: 'الهَمْزَة', words: hamzaWords });
for (const [i, words] of batches(supports).entries()) {
  joinNodes.push({ part: `prep-${i + 1}`, title: `كَلِمَاتٌ لِلْجُمَل ${arNum(i + 1)}`, words });
}
stages.push({
  id: 'join',
  kind: 'join',
  title: 'الوَصْلُ وَالنَّسْخ',
  sub: 'يصل الحروفَ ثم ينسخ الكلمةَ كما يراها — والمسافةُ بين الكلمات والجلوسُ على السطر',
  nodes: joinNodes,
});

// ——— المرحلة ١٣: خفوتُ النموذج ← الإملاء ———
//
// **مادّتُها ما يُملى**: كلماتُ الجمل التي لها صوتٌ في بنك اقرأ — فالخفوتُ ينتهي إلى
// «إملاءٍ سماعيّ صرف بصوت اقرأ» (`METHOD.md §٤`)، وكلمةٌ بلا صوتٍ لا تبلغ آخرَ
// المرحلة. وما لا صوتَ له من كلمات الجمل يُنسَخ في المرحلة ١٢ ولا يُملى — يحرسه
// `check_writable.py` بحقل `say`.
stages.push({
  id: 'fade',
  kind: 'fade',
  title: 'خُفُوتُ النَّمُوذَج',
  sub: 'الكلمةُ كاملةً ثم تخفت بأدائه المتباعد حتى يكتبها سماعاً',
  nodes: batches(targets).map((words, i) => ({
    part: `w-${i + 1}`,
    title: `الخُفُوتُ ثُمَّ الإِمْلَاء ${arNum(i + 1)}`,
    words,
  })),
});

// ——— المرحلة ١٤: الجمل القصيرة ———
stages.push({
  id: 'sent',
  kind: 'sentence',
  title: 'جُمَلٌ قَصِيرَة',
  sub: 'ينسخ جملةً من سلّم «اِقْرَأْ» ثم يكتبها سماعاً',
  nodes: batches(sentences.map((s) => s.text), BUNDLE)
    .map((texts, i) => ({ part: `s-${i + 1}`, title: `جُمَلٌ ${arNum(i + 1)}`, sentences: texts })),
});

// ————— ٧. البوابات الثلاث —————
//
// مواضعُها من `METHOD.md §٤`: بعد الحرف المعزول (قبل أوّل شكل موقع)، وبعد النسخ
// (قبل الخفوت والإملاء)، وختامُ التأسيس. و`before` معرّفُ المحطة التي تقف قبلها —
// فالبوابةُ بيانٌ معلَن: إن سقطت من هنا سقطت من الرحلة ولا يبقى لها أثرٌ في القفل.
const GATES = [
  { id: 'letters', before: FORMS.INITIAL, title: 'بَوَّابَةُ الحُرُوف', hint: 'أرِني حروفَك قبل أن تصلَها' },
  { id: 'copy', before: 'fade', title: 'بَوَّابَةُ النَّسْخ', hint: 'أرِني كلماتِك قبل أن تكتبها سماعاً' },
  { id: 'end', before: 'end', title: 'بَوَّابَةُ الخِتَام', hint: 'أرِني ما تعلّمتَه — ثم بابُ «أَتْقِنْ»' },
];

// ————— ٨. العلامات: أوّلُ كلمةٍ تحمل كلَّ واحدة (تفصيلُ ق٣ محسوباً) —————
//
// **يُمشى في الرحلة بترتيبها**، فأوّلُ عقدةٍ تقع العلامةُ في مادّتها هي التي تفتح
// بطاقتَها. فلا يُكتب «الشدّةُ عند سُكَّرْ» بيد: يُقال بالمشي.
// وأسماءُ العلامات من اقرأ حيث عنده اسم (`HARAKAT` و`SKILLS`)، وما لا اسمَ له عنده
// فمن `VARIANTS` — وهي التي يفرّقها الرسمُ لا القراءة.

const MARK_NAMES = {};
for (const haraka of rc.HARAKAT) MARK_NAMES[haraka.mark] = haraka.name;
MARK_NAMES[rc.SUKUN] = rc.skillById('sukun')?.title ?? 'السُّكون';
for (const skill of rc.SKILLS) {
  for (const mark of skill.marks || []) if (mark.length === 1) MARK_NAMES[mark] = skill.title;
}
for (const [ch, variant] of Object.entries(VARIANTS)) MARK_NAMES[ch] = variant.mark;

const material = (node) => [...(node.joins || []), ...(node.words || []), ...(node.sentences || [])];

const marks = [];
const seen = new Set();
for (const stage of stages) {
  for (const node of stage.nodes) {
    const opened = [];
    for (const text of material(node)) {
      for (const mark of marksOf(text)) {
        if (seen.has(mark)) continue;
        seen.add(mark);
        opened.push(mark);
        marks.push({
          mark,
          title: MARK_NAMES[mark] ?? mark,
          word: text,
          node: `${stage.id}:${node.part}`,
          base: VARIANTS[mark]?.base ?? null,
        });
      }
    }
    if (opened.length) node.marks = opened;
  }
}

// ————— ٩. الجداول المصاحبة —————

const usedWords = [...new Set(stages.flatMap((s) => s.nodes).flatMap((n) => n.words || []))];
const WORDS = Object.fromEntries(usedWords.map((text) => {
  const entry = bank.get(text);
  const say = entry ? entry.say : text;
  return [text, {
    // `say` مفتاحُ الصوت في بنك اقرأ — **ولا يُكتب إلا لمن له ملفٌّ هناك**، فحقلُه
    // الفارغُ يقول «تُنسَخ ولا تُملى»، ويحرسه الفاحص.
    say: SPOKEN.has(say) ? say : null,
    emoji: entry?.emoji ?? null,
    from: entry ? entry.from : 'support',
    letters: shape(text),
  }];
}));

const SENTENCES = Object.fromEntries(sentences.map((s) => [s.text, {
  say: SPOKEN.has(s.text) ? s.text : null,
  from: s.from,
  words: s.words.map(([, key]) => key),
  letters: shape(s.text),
}]));

const SOURCE = {
  tool: 'tools/make_curriculum.mjs',
  read: 'qataruts/read — المرجعُ الحيّ: يُقرأ ولا يُمَسّ',
  files: Object.fromEntries(Object.values(SOURCES).map((url) => [rel(url), sha12(readFileSync(url))])),
};

/**
 * **حكمُ كلِّ علامةٍ من ق٣** — يُصدَّر ليُعلَن في صفحة الأسس (شرطُ حكم المدير):
 * `{ mark, name, surface, word }` — و`surface: null` تعني **سقطت من مقرَّر اكتب**
 * لأنّ سطوحَ اقرأ كلَّها لا تحمل لها كلمة، فبقيت لأتقن.
 */
const Q3_RULING = markRuling.map((entry) => ({
  mark: entry.mark,
  name: MARK_NAMES[entry.mark] ?? VARIANTS[entry.mark]?.mark ?? entry.mark,
  surface: entry.where,
  word: entry.word,
}));

// ————— ١٠. تصيير الوحدة —————
//
// **صيغةُ JSON خالصة** لكل جدولٍ في الوحدة (لا فواصلَ ذيلية ولا مفاتيحَ عارية):
// فيقرؤها `check_writable.py` بـ`json.loads` قراءةً مباشرة بلا تحليلٍ نصّي هشّ —
// وهي عينُ ما فعلته الجلسةُ ٢ في `paths.js` مع `check_paths.py`.

/** طابعٌ يُبقي قوائمَ البسائط في سطرها ويفرد ما تحتها عقداً — JSON صحيحٌ في الحالين. */
function pretty(value, indent = 0) {
  const pad = ' '.repeat(indent);
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    const flat = value.every((v) => v === null || typeof v !== 'object');
    if (flat) return `[${value.map((v) => JSON.stringify(v)).join(', ')}]`;
    const deep = value.every((v) => Array.isArray(v) && v.every((x) => typeof x !== 'object'));
    if (deep) return `[${value.map((v) => pretty(v)).join(', ')}]`;
    return `[\n${value.map((v) => `${pad}  ${pretty(v, indent + 2)}`).join(',\n')}\n${pad}]`;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (!keys.length) return '{}';
    const body = keys.map((k) => `${JSON.stringify(k)}: ${pretty(value[k], indent + 2)}`);
    const one = `{ ${body.join(', ')} }`;
    if (one.length + indent <= 96 && !one.includes('\n')) return one;
    return `{\n${keys.map((k) => `${pad}  ${JSON.stringify(k)}: ${pretty(value[k], indent + 2)}`).join(',\n')}\n${pad}}`;
  }
  return JSON.stringify(value);
}

const table = (obj) => Object.entries(obj)
  .map(([key, value]) => `  ${JSON.stringify(key)}: ${pretty(value, 2)}`).join(',\n');
const list = (arr) => arr.map((item) => `  ${pretty(item, 2)}`).join(',\n');

function render() {
  return `// بيانات منهج «اُكْتُبْ» — **المصدر الوحيد للحقيقة**، ونظيرُ \`curriculum.js\` في اقرأ.
//
// ⚠ **ملفٌّ مولَّد — لا يُحرَّر بيد** (\`SESSIONS.md\`: «بيانات المنهج … تُشتقّ من
// بيانات اقرأ آلياً لا تُنسخ بيد»):
//
//     node tools/make_curriculum.mjs --build
//
// **وليس فيه حرفٌ ولا كلمةٌ ولا جملةٌ من تأليفنا**: الحروفُ وترتيبُها مجموعاتُ اقرأ
// السبع، والكلماتُ كلماتُ بنكه (مجموعاتُه ومهاراتُه ومعجمُه)، والجملُ أوائلُ سلّمه،
// وأصواتُ الإملاء ملفاتُه بأعيانها. **والمؤلَّفُ هنا ترتيبُها كتابةً** — جدولُ
// \`METHOD.md §٤\` — وعلّةُ كلِّ قرارِ ترتيبٍ مكتوبةٌ في المولِّد عند موضعها.
//
// **ولا رقمَ محطاتٍ مكتوبٌ هنا** (\`METHOD.md §٤\`): طولُ الرحلة ثمرةُ البيانات،
// يطبعه \`tools/check_writable.py\` محسوباً — ورقمٌ يتغيّر بتغيّرها ليس انحرافاً.

/**
 * **المحطات** — مراحلُ \`METHOD.md §٤\` وما تحتها من عقد.
 *
 * الشكل: \`{ id, kind, title, sub, nodes: [{ part, … }] }\`
 *   · \`kind\` — نوعُ المحطة، وهو مفتاحُ الشاشة التي تفتحها ومفتاحُ قياسها أو إعفائها
 *     في \`tools/test_measure.mjs\`: \`warmup\` · \`letter\` · \`form\` · \`join\` ·
 *     \`fade\` · \`sentence\` (والبواباتُ \`gate\` من \`GATES\` أدناه).
 *   · \`nodes\` — عقدُ المحطة بترتيبها؛ لكلٍّ \`part\` يُبنى منه معرّفُها، ثم ما تدرّسه:
 *     \`letter\` حرفاً معزولاً · \`letters\` مع \`form\` شكلَ موقع · \`joins\` وصلاتٍ ·
 *     \`words\` كلماتٍ · \`sentences\` جملاً · و\`marks\` العلاماتِ التي تُفتَح بطاقتُها عندها.
 */
export const STAGES = [
${list(stages)}
];

/**
 * **البوابات الثلاث** (\`METHOD.md §٤\`): \`{ id, before, title, hint }\` — و\`before\`
 * معرّفُ المحطة التي تقف البوابةُ قبلها، أو \`'end'\` لبوابة الختام. فالبوابةُ **بيانٌ
 * مُعلَن**: إن سقطت من هنا سقطت من الرحلة ولا يبقى لها أثرٌ في القفل.
 *
 * **ولا وجهَ مصوَّراً لها**: لغةُ الواجهة عندنا SVG خطيّ (\`DESIGN.md §٦\`) ولا بنكَ
 * رموزٍ في هذا التطبيق، فوجهُ البوابة أيقونتُها في \`ui.js\` — ووجوهُ العقد من
 * مادّتها نفسِها: الحرفُ وشكلُ موقعه.
 */
export const GATES = [
${list(GATES)}
];

/**
 * **العلاماتُ وأوّلُ كلمةٍ تحمل كلَّ واحدة** — تفصيلُ قرار المالك ق٣ **محسوباً لا
 * مكتوباً**: يُمشى في الرحلة بترتيبها، فأوّلُ عقدةٍ تقع العلامةُ في مادّتها هي التي
 * تفتح بطاقةَ تعريفها قبل كتابة كلمتها.
 *
 * \`{ mark, title, word, node, base }\` — و\`base\` أصلُ الحرف المتغيّر (أ ← ا · ة ← ه)
 * لمن يرسمه: حرفٌ مدروسٌ وعليه علامة، لا حرفٌ جديد.
 */
export const MARKS = [
${list(marks)}
];

/**
 * **الكلماتُ ببياناتها** — كلُّها من بنك اقرأ:
 *   · \`say\` مفتاحُ ملفها الصوتيّ عنده، و\`null\` **يعني لا صوتَ لها فتُنسَخ ولا تُملى**.
 *   · \`emoji\` صورتُها عنده، و\`from\` موضعُها من رحلته.
 *   · \`letters\` رسمُها: كلُّ محرفٍ وشكلُ موقعه — وبها يحكم \`check_writable.py\`.
 */
export const WORDS = {
${table(WORDS)}
};

/** **جملُ سلّم اقرأ** المختارة: نصُّها المنطوق عنده، ودرجتُها، وكلماتُها بمفاتيح البنك. */
export const SENTENCES = {
${table(SENTENCES)}
};

/** حروفُ العربية بأسمائها ووصلِها — **من \`LETTERS\` في اقرأ**، ومنها يُرسم كلُّ نصّ. */
export const LETTERS = {
${table(LETTERS)}
};

/**
 * **الحروفُ المتغيّرة**: حرفٌ مدروسٌ وعليه علامة (\`base\` أصلُه) — تطبيقُ ق٣ في
 * الرسم، وما لا أصلَ له (ء) يُرسم وحدَه. ووصلُها وصلُ أصلها إلا ما فرّقه الرسم.
 */
export const VARIANTS = {
${table(VARIANTS)}
};

/**
 * **حكمُ كلِّ علامةٍ من علامات ق٣ — محسوباً لا مكتوباً** (حكمُ المدير في مراجعة
 * الجلسة ٣، بندٌ في الجلسة ٨): لكلِّ علامةٍ يبحث المولّدُ **سطوحَ اقرأ كلَّها** عن
 * كلمةٍ حاملة؛ فما وُجد حاملُه ضُمّ بقاعدةٍ معلنة، وما لم يوجد في السطوح كلِّها
 * **سقط من مقرَّر اكتب** (\`surface: null\`) — لا كلمةَ تُخترع — وبقي لـ«أَتْقِنْ».
 *
 * **وتُعلَن الساقطاتُ في صفحة الأسس**: «اكتبُ يعلّم كتابةَ ما علّمه اقرأ قراءةً».
 */
export const Q3_RULING = [
${list(Q3_RULING)}
];

/** نسبُ الوحدة: من أيّ بياناتِ اقرأ بُنيت وببصماتها — يفحصه \`make_curriculum.mjs --self-test\`. */
export const CURRICULUM_SOURCE = ${pretty(SOURCE)};

/** بوابةٌ بمعرّفها. */
export const gateById = (id) => GATES.find((gate) => gate.id === id) || null;

/** البوابةُ التي تقف قبل هذه المحطة (أو قبل ختام الرحلة: \`'end'\`). */
export const gateBefore = (where) => GATES.find((gate) => gate.before === where) || null;

/** محطةٌ بمعرّفها. */
export const stageById = (id) => STAGES.find((stage) => stage.id === id) || null;

/**
 * **المساراتُ المرجعية** لكل حرفٍ بأشكاله (\`METHOD.md §٣.١\`): شبكةٌ معيارية
 * \`١٠٠٠×١٠٠٠\`، والنقاطُ بعد الجسم. تؤلّفها عدّةُ الجلسة ٢ (\`tools/make_paths.html\`)
 * ويفحصها \`tools/check_paths.py\` — **ولا حرفَ يدخل المنهج بلا مسارٍ عابرٍ للفحص**.
 *
 * **وبيانُها في وحدةٍ على حدة (\`paths.js\`) ويُصدَّر من هنا**: \`PATHS\` مصدرُ الحقيقة
 * الوحيد للشاشات كما كان، غير أنّ **ملفَّين لمولِّدَين** — هذا يكتبه مولّدُ المنهج،
 * وذاك تؤلّفه عدّةُ المسارات، فلا يمحو أحدُهما عملَ الآخر.
 */
export { PATHS } from './paths.js';
import { PATHS } from './paths.js';

/** أشكالُ الموقع الأربعة — أسماؤها ثابتة لأنها تدخل مفاتيحَ ليتنر (\`METHOD.md §٦\`). */
export const FORMS = {
  ISOLATED: 'isolated',
  INITIAL: 'initial',
  MEDIAL: 'medial',
  FINAL: 'final',
};

/** اسمُ شكل الموقع كما يُقرأ في اللوحة والعناوين. */
export const FORM_NAMES = {
  [FORMS.ISOLATED]: 'معزول',
  [FORMS.INITIAL]: 'ابتدائي',
  [FORMS.MEDIAL]: 'وسطي',
  [FORMS.FINAL]: 'نهائي',
};

/** مسارُ حرفٍ بشكلِ موضعٍ بعينه — \`null\` إن لم يُؤلَّف بعد. */
export const pathOf = (letter, form = FORMS.ISOLATED) => PATHS[letter]?.[form] || null;

/**
 * **مفاتيحُ أصوات كلمات المنهج في بنك اقرأ** — مصدرٌ واحد لكلِّ وحدةٍ تنطقها
 * (شاشةُ النسخ والمراجعة)، فلا تشتقّ كلٌّ قائمتَها فتفترقا يوماً. **وهي حقلُ
 * \`say\` لا نصُّ الكلمة**: مفتاحُ الملفّ عند اقرأ هو ما يُشغَّل وهو ما يُعلَن،
 * وفراغُه يعني «تُنسَخ ولا تُملى» (\`METHOD.md §٧\`).
 */
export const SPOKEN_WORDS = [...new Set(Object.values(WORDS).map((w) => w.say).filter(Boolean))];

/** بيانُ كلمةٍ من البنك — \`null\` إن لم تكن في المنهج. */
export const wordInfo = (text) => WORDS[text] || null;

/** بيانُ جملةٍ من السلّم — \`null\` إن لم تكن في المنهج. */
export const sentenceInfo = (text) => SENTENCES[text] || null;

/** بطاقةُ علامةٍ — \`null\` إن لم تكن في المنهج. */
export const markInfo = (mark) => MARKS.find((entry) => entry.mark === mark) || null;
`;
}

// ————— السائق —————

const flag = (name) => process.argv.includes(name);

if (flag('--self-test')) {
  let fails = 0;
  const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

  console.log('\n— عهدُ الاشتقاق: لا مادّةَ في المنهج ليست من اقرأ —');
  const words = [...new Set(stages.flatMap((s) => s.nodes).flatMap((n) => n.words || []))];
  const alien = words.filter((w) => !bank.has(w) && !SUPPORT.has(w));
  ok(alien.length === 0, `كلُّ كلمةٍ من بنك اقرأ (${words.length} كلمة)`
    + (alien.length ? ` — دخيلة: ${alien.join('، ')}` : ''));

  const ladder = new Set(rs.SENTENCES.map((s) => s.text));
  const said = stages.flatMap((s) => s.nodes).flatMap((n) => n.sentences || []);
  const strayer = said.filter((t) => !ladder.has(t));
  ok(strayer.length === 0, `وكلُّ جملةٍ من سلّم اقرأ (${said.length} جملة)`
    + (strayer.length ? ` — دخيلة: ${strayer.join(' / ')}` : ''));

  const letters = new Set(stages.filter((s) => s.kind === 'letter').flatMap((s) => s.nodes).map((n) => n.letter));
  ok(letters.size === Object.keys(rc.LETTERS).length
    && [...letters].every((ch) => Object.hasOwn(rc.LETTERS, ch)),
    `وحروفُ المنهج حروفُ اقرأ بترتيبها (${letters.size} حرفاً)`);

  const glyphs = new Set(stages.flatMap((s) => s.nodes).flatMap(material).flatMap((t) => [...t]));
  const nameless = [...glyphs].filter((ch) => ch !== ' ' && !isLetter(ch) && !MARK_NAMES[ch]);
  ok(nameless.length === 0, `ولا محرفَ في المادّة بلا اسمٍ يُعرَف${nameless.length ? `: ${nameless.join(' ')}` : ''}`);

  console.log('\n— الرسم: كلُّ شكلِ موقعٍ تطلبه المادّة مدروسٌ في الرحلة —');
  const taught = new Set();
  for (const stage of stages) {
    for (const node of stage.nodes) {
      if (node.letter) {
        taught.add(`${node.letter}|${FORMS.ISOLATED}`);
        // غيرُ الواصل: ابتدائيُّه عينُ معزوله (أثبتته عدّةُ الجلسة ٢ بمقابلة البصمتين)
        if (!LETTERS[node.letter].joins) taught.add(`${node.letter}|${FORMS.INITIAL}`);
      }
      for (const ch of node.letters || []) {
        taught.add(`${ch}|${node.form}`);
        if (node.form === FORMS.FINAL && !LETTERS[ch].joins) taught.add(`${ch}|${FORMS.MEDIAL}`);
      }
    }
  }
  const needed = new Set();
  for (const stage of stages) {
    for (const node of stage.nodes) {
      for (const text of material(node)) {
        for (const [ch, form] of shape(text)) if (!isVariant(ch)) needed.add(`${ch}|${form}`);
      }
    }
  }
  const unmet = [...needed].filter((key) => !taught.has(key));
  ok(unmet.length === 0, `${needed.size} شكلَ موقعٍ تطلبه الكلماتُ والجمل، كلُّها مدروسة`
    + (unmet.length ? ` — ناقصة: ${unmet.join('، ')}` : ''));

  console.log('\n— الأصوات: لا إملاءَ بلا صوتٍ في بنك اقرأ —');
  const dictated = stages.filter((s) => s.kind === 'fade').flatMap((s) => s.nodes).flatMap((n) => n.words);
  ok(dictated.length > 0 && dictated.every((w) => WORDS[w].say),
    `كلماتُ الخفوت والإملاء منطوقةٌ عنده كلُّها (${dictated.length} كلمة)`);
  ok(said.every((t) => SENTENCES[t].say), `وجملُ الإملاء كذلك (${said.length} جملة)`);

  console.log('\n— المعرّفات: لا معرّفَ يتكرّر، ولا بوابةَ في الهواء —');
  const ids = stages.flatMap((s) => s.nodes.map((n) => `${s.id}:${n.part}`));
  ok(new Set(ids).size === ids.length, `كلُّ معرّفٍ فريد (${ids.length} عقدة)`);
  ok(GATES.every((g) => g.before === 'end' || stages.some((s) => s.id === g.before)),
    'وكلُّ بوابةٍ تقف قبل محطةٍ موجودة');

  console.log('\n— الوحدة: ما على القرص هو ما يولّده هذا المولّد —');
  const disk = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  ok(disk === render(), 'وحدةُ `curriculum.js` عينُ ما يولّده — لا سطرَ فيها بيد'
    + (disk === render() ? '' : ' (أعِد `--build`)'));

  console.log(fails ? `\n${fails} فشل` : '\nكل عهود اشتقاق المنهج ناجحة');
  process.exit(fails ? 1 : 0);
}

if (flag('--build')) {
  writeFileSync(OUT, render(), 'utf8');
  console.log(`كُتب ${fileURLToPath(OUT)}`);
}

// ————— الجرد (يُطبع دائماً) —————

console.log('\n— جردُ المنهج المشتقّ من «اِقْرَأْ» —');
for (const stage of stages) {
  const load = stage.nodes.flatMap(material).length;
  console.log(`  · ${stage.id.padEnd(8)} ${String(stage.nodes.length).padStart(2)} عقدة   ${stage.title}`
    + (load ? `  — ${load} مادّة` : ''));
}
console.log(`  · بوابات   ${String(GATES.length).padStart(2)} عقدة   ${GATES.map((g) => g.title).join(' · ')}`);

// **وأسرُ التمييز تُطبع كما قُرئت** من نسب الرسم — لا رقمَ لها مكتوبٌ ولا قائمة
for (const stage of stages.filter((s) => s.kind === 'form')) {
  const node = stage.nodes.find((n) => n.compare);
  console.log(`  · تمييزُ ${stage.title}: `
    + (node ? node.compare.map((f) => f.join('')).join(' · ') : 'لا أسرةَ متشابهاتٍ فيه'));
}

const nodeCount = stages.reduce((sum, s) => sum + s.nodes.length, 0) + GATES.length;
console.log(`\n  المجموع: ${nodeCount} محطة — محسوبةً من بيانات اقرأ لا مكتوبة`);
console.log(`  الكلمات: ${usedWords.length} (منطوقةٌ منها ${usedWords.filter((w) => WORDS[w].say).length})`
  + ` · الجمل: ${sentences.length} · العلامات: ${marks.length}`);
console.log(`  المصادر: ${Object.entries(SOURCE.files).map(([f, sha]) => `${f} ${sha}`).join(' · ')}`);
// **وحكمُ كلِّ علامةٍ من ق٣ يُطبع** (شرطُ حكم المدير): أين وُجد حاملُها، أو سقوطُها
console.log('\n— حكمُ علامات ق٣: البحثُ في سطوح اقرأ كلِّها —');
for (const entry of Q3_RULING) {
  console.log(`  · «${entry.mark}» ${entry.name}: `
    + (entry.surface === 'مقرَّرةٌ سلفاً' ? 'في مادّة المنهج سلفاً'
      : entry.surface ? `حاملُها «${entry.word}» من ${entry.surface} — ضُمّت آلياً`
        : '**لا حاملَ لها في سطوح اقرأ كلِّها — سقطت من مقرَّر اكتب وبقيت لأتقن**'));
}
if (missingQ3.length) {
  console.log(`  ⚠ الساقطُ: ${missingQ3.join(' ')} — لا كلمةَ تُخترع، ويُعلَن في صفحة الأسس.`);
}
