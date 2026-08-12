// **حارسُ قناة الصوت الواحدة** — «لا صوتَ يخرج من التطبيق خارج القناة، ولا اثنان فيها معاً»:
//   node tools/check_speech.mjs              # الفحص على الشجرة الحيّة
//   node tools/check_speech.mjs --self-test  # فحصُ الفاحص: أيمسك المخالفات؟
//
// **منقولٌ من «احسب» بتكليف المالك** (`calc@ad59c56` — الجلسة ٤ج، وقيدُه في
// `docs/SEED.md §٨`): أوّلُ بلاغ ميدانٍ عندهم — «الصوت متراكب مقطوش، والبرنامج لا
// ينتظر الصوت فينتقل» — عاش تحت خمسةٍ وستين فحصاً أخضر، **لأنّ حرّاس البذرة (وهي
// بذرتُنا) يعدّون التشغيلات ولا يقيسون التعاقب**. والمنقولُ هنا **بابُهم السادس**
// («القناةُ واحدة») بشقّيه، نصّاً وعملاً:
//
//   • **نصّاً**: لا وحدةَ تُنشئ صوتاً أو تنطق بيدها — `new Audio` والنطقُ الآليّ في
//     `audio.js` وحدَه، وما سواه ينادي `audio.play` فيقف في الطابور. فمهما أُحكِمت
//     القناةُ، سطرٌ واحدٌ يشغّل عنصراً من خارجها يعيد العيبَ كما كان — **والامتناعُ
//     يُحرَس في المصدر لا يُترَك للانتباه**.
//   • **عملاً**: تُستدعى القناةُ في node بعنصرِ صوتٍ وهميّ يسجّل لحظتَي بدء كلِّ تشغيلٍ
//     وتمامِه، فيُثبَت ما لا يُثبته نصُّ المصدر: أنّ الثاني **لا يبدأ قبل أن يتمّ
//     الأول**، وأنّ وعدَ `play` **يتمّ بتمام الكلام** (به تنتظر الشاشةُ قبل أن تنتقل)،
//     وأنّ الإسكاتَ **يُفرغ الطابور ولا يعطّله**.
//
// وهو أخو الأحكام الزمنية في `tools/browser_test.html §٧`: تلك تقيس القناةَ في متصفّحٍ
// حقيقيّ بمؤقّتاته، وهذا يقيسها معزولةً — فينكشف العطبُ في أيّهما وقع.
//
// ————— **وأبوابُ القائمة الخمسة نُقلت في الجلسة ٥** (`docs/SEED.md §٨`) —————
//
// كانت مؤجَّلةً بقيدها: موضوعُها **بروتوكولُ الصوت** (`docs/AUDIO_QUEUE.md`)، ولم يكن
// في «اُكْتُبْ» نصٌّ منطوق ولا قائمةٌ على القرص. **وقد طالبت من نفسها** يومَ أعلنت
// أوّلُ شاشةٍ ناطقة نصوصَها (`app/js/lesson.js`، الجلسة ٥) — فنُقلت من
// `calc@ad59c56` بأبوابها الخمسة:
//   ١) **الإعلان**: كلُّ وحدةٍ تنادي `audio.play` تُعلن `SPOKEN`.
//   ٢) **القائمة**: كلُّ نصٍّ مُعلَنٍ له ملفٌّ في البنك **أو** مدخلٌ في القائمة،
//      وصيغةُ المدخل تامّة — ولا مدخلَ لا تنطقه وحدة (نصٌّ يُولَّد بلا مستهلك).
//   ٣) **الفئةُ تتبع الموضع**: تُقرأ من اشتقاق `queue_texts.mjs` نفسِه لا من نسخةٍ
//      ثانية — فالحارسُ يحكم والأداةُ تُصلِح، والاشتقاقُ واحدٌ لهما.
//   ٤) **قيدا البروتوكول**: **لا رقمَ في نصٍّ منطوق** (العددُ يُسمّى ولا يُقرأ رسمُه)،
//      **ولا يدخل القائمةَ ما نُسخ من بنك اقرأ** — توليدُه من جديد يُسمِع الطفلَ
//      الحرفَ بصوتين، وهو عينُ ما تمنعه البصمات (`docs/AUDIO_QUEUE.md`).
//   ٥) **الشكلُ الكامل**: كلُّ حرفٍ يحمل حركتَه، **فيما سيمرّ بالمولّد** — وما له
//      ملفٌّ مراجَعٌ بالأذن في بنك اقرأ لا يمرّ به، فلا يُطالَب بشكلٍ لم يكتبه أهلُه.
//
// **وفرقان عن أصلها معلَّلان**: بابُ «قيدا المنهج» عند احسب ق١ وق٢ (لا رقمَ منطوق،
// ولا معدودٌ مقرونٌ بعدد) — والثاني **لا موضوعَ له هنا** (لا كمياتٍ في «اُكْتُبْ»)،
// فحلّ محلَّه قيدُ البروتوكول الذي يخصّنا: **المنسوخُ لا يُصَفّ**. وبابُ الشكل الكامل
// عندهم على كل نصّ، وعندنا على **ما يُولَّد** وحدَه بالعلّة أعلاه.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const APP = new URL('../app/js/', import.meta.url);
const QUEUE = new URL('./audio_queue.json', import.meta.url);
const BANK = new URL('../app/audio/manifest.json', import.meta.url);

const read = (url) => readFileSync(url, 'utf8');
const files = readdirSync(APP).filter((f) => f.endsWith('.js')).sort();

// وحداتُ المنصة التي لا تنطق بطبعها (`audio.js` نفسُه محرّكُ النطق لا مصدرَ نصّ)
const ENGINE = new Set(['audio.js']);

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

// ————— القواعد: دوالُّ خالصة تُجرَّب سالباً —————

/**
 * **مقابضُ لوح الكتابة**: `penSurface()` تُرجع كائناً فيه `play()` — وهي **حركةُ رسمٍ
 * لا صوت** (`METHOD §٥.١`: «الرسم المتحرك من المسار المرجعي نفسِه»). وهذا فرقُ
 * «اُكْتُبْ» عن «احسب»: عندهم لا `.play()` إلا للصوت فحُرِّمت كلُّها، وعندنا لوحٌ
 * يُشغَّل عرضُه بالاسم نفسِه.
 *
 * **فلا تُكتب أسماءُ المقابض في الفاحص — تُشتقّ من الملفّ**: كلُّ ما أُسنِد إليه
 * `penSurface(` مقبضٌ، وما أُسنِد إليه مقبضٌ مقبض. وقائمةٌ مكتوبةٌ هنا تشيخ بأوّل مقبضٍ
 * يُسمّى باسمٍ آخر — **إمّا بأن يمرّ صوتٌ حقيقيّ باسمها، أو بأن يحمرّ لوحٌ بريء**.
 */
export function surfaceHandles(src) {
  const names = new Set();
  const text = String(src);
  // `const surface = penSurface({…})` — والمقبضُ الأصل
  for (const m of text.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*penSurface\s*\(/g)) {
    names.add(m[1]);
  }
  // `live = surface;` — ما أُسنِد إليه مقبضٌ مقبضٌ مثلُه (بجولاتٍ حتى يستقرّ)
  for (let round = 0; round < 4; round++) {
    const before = names.size;
    for (const m of text.matchAll(/([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\s*;/g)) {
      if (names.has(m[2])) names.add(m[1]);
    }
    if (names.size === before) break;
  }
  return names;
}

/**
 * **القناةُ واحدة**: ما يشغّل صوتاً بيده خارج `audio.js`.
 *
 * علّتُه من ميدان احسب (`calc/docs/FIELD.md §١`): صوتان يعملان معاً. ومهما أُحكِم
 * الطابورُ في القناة، فسطرٌ واحدٌ يشغّل عنصراً من خارجها يعيد العيبَ كما كان.
 */
export function outsideChannel(src) {
  const text = String(src);
  const hits = [];
  const rules = [
    [/\bnew\s+Audio\s*\(/, 'new Audio'],
    [/createElement\s*\(\s*['"]audio['"]/, "createElement('audio')"],
    [/\bspeechSynthesis\b/, 'speechSynthesis'],
    [/\bSpeechSynthesisUtterance\b/, 'SpeechSynthesisUtterance'],
    [/\b(?:webkit)?AudioContext\b/, 'AudioContext'],
  ];
  for (const [re, what] of rules) if (re.test(text)) hits.push(what);

  // **و`.play()` على غير مقبضِ لوح**: عنصرُ وسائطٍ يُشغَّل بيده
  const handles = surfaceHandles(text);
  for (const m of text.matchAll(/([A-Za-z_$][\w$]*)\s*\??\.\s*play\s*\(/g)) {
    if (m[1] === 'audio' || handles.has(m[1])) continue;   // `audio.play` بابُ القناة
    hits.push(`عنصرٌ يُشغَّل بيده (\`${m[1]}.play()\`)`);
  }
  return hits;
}

// ————— أبوابُ البروتوكول: دوالُّ خالصة تُجرَّب سالباً —————

const LETTER = /[ء-غف-ي]/;
const MARK = /[ً-ْٰ]/;
/** حروفُ المدّ لا تحمل حركة: الألفُ أبداً، والواوُ والياءُ بعد ضمّةٍ وكسرة. */
const SILENT = new Set(['ا', 'ى', 'آ']);

/** علاماتُ الحرف الذي يبدأ عند `at` — شدّةً وحركةً بأيّ ترتيبٍ كُتبتا. */
function marksAfter(chars, at) {
  const marks = [];
  for (let i = at + 1; i < chars.length && MARK.test(chars[i]); i++) marks.push(chars[i]);
  return marks;
}

/**
 * **الشكلُ الكامل**: كلُّ حرفٍ يحمل حركتَه أو سكونَه — ويُستثنى حرفُ المدّ، ولامُ
 * التعريف الشمسية (تسكن بلا علامةٍ أمام مشدَّد). ويُرجِع الحروفَ العارية.
 */
export function bareLetters(text) {
  const chars = [...String(text)];
  const bare = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (!LETTER.test(ch) || SILENT.has(ch)) continue;
    if (MARK.test(chars[i + 1] || '')) continue;
    const prev = chars[i - 1] || '';
    if (ch === 'و' && prev === 'ُ') continue;
    if (ch === 'ي' && prev === 'ِ') continue;
    if (ch === 'ل' && prev === 'ا' && marksAfter(chars, i + 1).includes('ّ')) continue;
    bare.push(`${ch}@${i}`);
  }
  return bare;
}

/** **لا رقمَ في نصٍّ منطوق**: يُسمّى العددُ ولا يُقرأ رسمُه — مشرقياً كان أو مغربياً. */
export const hasDigit = (text) => /[0-9٠-٩]/.test(String(text));

/**
 * **ما يستر النصَّ من النطق الآليّ**: ملفٌّ في البنك، **أو** مكانٌ في القائمة ما زال
 * ينتظر. ومدخلٌ `done` بلا ملفٍّ لا يستر شيئاً — بل هو أخطرُ من الغياب: القائمةُ
 * تقول «صُرِّف» والطفلُ يسمع نطقاً آلياً.
 */
export function coverOf(text, banked, entry) {
  if (banked.has(text)) return 'ملف';
  if (!entry) return '';
  return (entry.status ?? 'pending') === 'done' ? 'مُصرَّفٌ بلا ملف' : 'انتظار';
}

/**
 * **الفئةُ تتبع موضعَ النصّ**: مدخلٌ **منتظِرٌ** فئتُه غير المشتقّة يُصرَّف بمسحةِ
 * أداءٍ ليست له — ويُسمَع في أذن طفل. والمُصرَّفُ خارجَ الباب: فئتُه أثرُ ما سُمع.
 */
export function categoryDrift(queue, wanted) {
  const drift = [];
  for (const entry of queue) {
    if ((entry.status ?? 'pending') === 'done') continue;
    const now = wanted.get(entry.text);
    if (now && now !== entry.category) drift.push({ text: entry.text, was: entry.category, now });
  }
  return drift;
}

/**
 * **المنسوخُ من بنك اقرأ لا يدخل القائمة أبداً** (`docs/AUDIO_QUEUE.md`): له ملفُّه
 * المراجَعُ بالأذن، **وتوليدُه من جديد يُسمِع الطفلَ الحرفَ بصوتين** — وهو عينُ
 * العيب الذي وُضع نظامُ البصمات لمنعه. فمدخلٌ لنصٍّ في البنك مخالفةٌ لا سهو.
 */
export const copiedInQueue = (queue, banked) => queue.filter((row) => banked.has(row.text));

/**
 * الاشتقاقُ من الأداة نفسِها (`queue_texts.mjs --wanted-json`) — قراءةٌ لا تكتب شيئاً.
 * وتوقُّفُ الأداة (نصٌّ مُعلَنٌ لا تعرف موضعَه) **علّةٌ تُنقَل بنصّها** فيحمرّ البابُ بها.
 */
function derivedCategories() {
  const tool = fileURLToPath(new URL('./queue_texts.mjs', import.meta.url));
  const run = spawnSync(process.execPath, [tool, '--wanted-json'], { encoding: 'utf8' });
  if (run.status !== 0) {
    return { error: (run.stderr || run.stdout || '').trim().split('\n').slice(0, 3).join(' | ') };
  }
  const line = run.stdout.trim().split('\n').reverse().find((l) => l.startsWith('['));
  if (!line) return { error: 'لا مخرَجَ JSON من queue_texts.mjs --wanted-json' };
  return { wanted: new Map(JSON.parse(line)) };
}

// ————— جردُ الشجرة —————

/** الوحداتُ التي تنطق فعلاً: تستورد `audio.js` وتنادي `play` عليها. */
function speakers() {
  const out = [];
  for (const file of files) {
    if (ENGINE.has(file)) continue;
    const src = read(new URL(file, APP));
    if (/\baudio\s*\.\s*play(?:Sequence)?\s*\(/.test(src)) out.push(file);
  }
  return out;
}

/**
 * **إعلانُ النصوص المنطوقة**: `export const SPOKEN`، **أو إعادةُ تصديرها**
 * (`export { X as SPOKEN } from …`) — وكلاهما إعلان.
 *
 * وإعادةُ التصدير ليست تجميلاً: `review.js` تنطق أسماءَ الحروف بأعيانها التي ينطقها
 * `lesson.js`، فتستوردها منه **رباطاً حيّاً** لا نسخةً ثانية — ولو كُتبت `const SPOKEN
 * = LETTER_NAMES` لَسقطت حين يُستورَد الدرسُ قبل المراجعة (حلقةُ استيرادٍ ومنطقةُ موتٍ
 * زمنيّة)، وهو ما يقع في هذا الفاحص نفسِه: يستوردهما بترتيب الجرد.
 */
const DECLARES = /export\s+(?:const\s+SPOKEN\b|\{[^}]*\bas\s+SPOKEN\b)/;

/** الوحداتُ التي تُعلن نصوصَها المنطوقة — بابُ الأبواب الخمسة. */
function declarers() {
  return files.filter((f) => !ENGINE.has(f) && DECLARES.test(read(new URL(f, APP))));
}

/** نصوصُ وحدةٍ المُعلَنة (`export const SPOKEN`) — تُقرأ بالاستيراد لا بالتخمين. */
async function spokenOf(file) {
  const mod = await import(new URL(file, APP));
  return Array.isArray(mod.SPOKEN) ? mod.SPOKEN : [];
}

/**
 * أبوابُ البروتوكول الخمسة — **وتنام كلُّها بشرطٍ مجرود**: ما دامت الشجرةُ لا تنطق
 * ولا تُعلن، فلا موضوعَ لها (وذلك حالُ الجلسات ٠–٤ج). ويومَ تنطق أولاها تستيقظ.
 */
async function queueGates() {
  const said = speakers();
  const spoken = declarers();

  console.log('\n— الإعلان: مَن نطق أعلن —');
  if (!said.length && !spoken.length) {
    console.log('  ⏸ لا وحدةَ تنطق نصّاً بعد — الأبوابُ الخمسة نائمةٌ بقيدها في `docs/SEED.md §٨`');
    return;
  }
  const silentSpeakers = said.filter((f) => !spoken.includes(f));
  ok(silentSpeakers.length === 0,
    `${spoken.length} وحدةً تُعلن نصوصَها المنطوقة (${spoken.join('، ')})`
    + (silentSpeakers.length ? ` — **تنطق ولا تُعلن: ${silentSpeakers.join('، ')}**` : ''));

  const texts = [];
  for (const file of spoken) texts.push(...await spokenOf(file));
  const unique = [...new Set(texts)];
  if (!unique.length) {
    ok(false, 'وحدةٌ تُعلن `SPOKEN` فارغةً — الإعلانُ خبرٌ لا زينة');
    return;
  }

  console.log('\n— القائمة: لكل نصٍّ ملفُّه أو مكانُه في الانتظار —');
  const queue = existsSync(QUEUE) ? JSON.parse(read(QUEUE)) : [];
  const banked = new Set(existsSync(BANK) ? Object.values(JSON.parse(read(BANK))) : []);
  const queued = new Map(queue.map((row) => [row.text, row]));
  const cover = new Map(unique.map((t) => [t, coverOf(t, banked, queued.get(t))]));

  const orphan = unique.filter((t) => !cover.get(t));
  ok(orphan.length === 0,
    `${unique.length} نصّاً مُعلَناً، لكلٍّ ملفُّه أو مكانُه في القائمة`
    + (orphan.length ? ` — **خارج القائمة: ${orphan.slice(0, 5).join(' · ')}**` : ''));

  const broke = unique.filter((t) => cover.get(t) === 'مُصرَّفٌ بلا ملف');
  const withFile = unique.filter((t) => cover.get(t) === 'ملف').length;
  ok(broke.length === 0,
    `ومنها ${withFile} له ملفٌّ في البنك و${unique.length - withFile} ما زال ينتظر التصريف`
    + (broke.length ? ` — **مُصرَّفٌ بلا ملف: ${broke.slice(0, 5).join(' · ')}**` : ''));

  const stale = queue.filter((row) => !unique.includes(row.text));
  ok(stale.length === 0,
    'ولا مدخلَ في القائمة لا تنطقه وحدة (نصٌّ يُولَّد بلا مستهلك)'
    + (stale.length ? ` — بائد: ${stale.slice(0, 5).map((r) => r.text).join(' · ')}` : ''));

  const FIELDS = ['text', 'category', 'requestedBy', 'priority', 'status'];
  const CATEGORIES = new Set(['letter_name', 'letter_haraka', 'syllable', 'word', 'sentence', 'ui']);
  const broken = queue.filter((row) => FIELDS.some((f) => row[f] === undefined)
    || !CATEGORIES.has(row.category));
  ok(broken.length === 0,
    `وصيغةُ كل مدخلٍ تامّةٌ بفئةٍ من فئات \`docs/AUDIO_QUEUE.md\` (${queue.length} مدخلاً)`
    + (broken.length ? ` — معطوب: ${broken.length}` : ''));

  console.log('\n— الفئة: مشتقّةٌ من موضع النصّ لا مكتوبةٌ بيد —');
  const derived = derivedCategories();
  if (derived.error) {
    ok(false, `اشتقاقُ الفئات متعذّر — ${derived.error}`);
  } else {
    const drift = categoryDrift(queue, derived.wanted);
    const waiting = queue.filter((r) => (r.status ?? 'pending') !== 'done').length;
    ok(drift.length === 0,
      `فئةُ كل مدخلٍ منتظِرٍ هي المشتقّةُ من موضعه (${waiting} منتظِراً)`
      + (drift.length ? ` — **منحرف (يُردّ بـ\`queue_texts --retag\`): ${drift
        .map((d) => `«${d.text}» ${d.was}←${d.now}`).join(' · ')}**` : ''));
    const unknown = unique.filter((t) => !derived.wanted.has(t));
    ok(unknown.length === 0,
      'ولكلِّ نصٍّ مُعلَنٍ موضعٌ تعرفه الأداة'
      + (unknown.length ? ` — بلا موضع: ${unknown.join(' · ')}` : ''));
  }

  console.log('\n— قيدا البروتوكول: لا رقمَ منطوق، ولا منسوخٌ في القائمة —');
  const digits = unique.filter(hasDigit);
  ok(digits.length === 0,
    'لا رقمَ في نصٍّ منطوق — العددُ يُسمّى ولا يُقرأ رسمُه'
    + (digits.length ? ` — ${digits.join(' · ')}` : ''));
  const copied = copiedInQueue(queue, banked);
  ok(copied.length === 0,
    `**ولا يدخل القائمةَ ما نُسخ من بنك اقرأ** (${banked.size} ملفاً في البنك) — `
    + 'توليدُه يُسمِع الطفلَ الحرفَ بصوتين'
    + (copied.length ? ` — **دخل: ${copied.map((r) => r.text).join(' · ')}**` : ''));

  console.log('\n— الشكلُ الكامل: كلُّ حرفٍ يحمل حركتَه فيما سيمرّ بالمولّد —');
  // **وما له ملفٌّ مراجَعٌ بالأذن لا يمرّ بالمولّد** فلا يُطالَب بشكلٍ لم يكتبه أهلُه:
  // «باء» في بنك اقرأ صوتٌ مسموعٌ مُقَرّ، لا نصٌّ يُقرأ على مولِّد.
  const willGenerate = unique.filter((t) => !banked.has(t));
  const unvowelled = willGenerate.map((t) => [t, bareLetters(t)]).filter(([, b]) => b.length);
  ok(unvowelled.length === 0,
    `كلُّ ما سيُولَّد مشكولٌ بالكامل (${willGenerate.length} نصّاً، و${unique.length - willGenerate.length} في البنك)`
    + (unvowelled.length ? ` — عارٍ في: ${unvowelled.slice(0, 3)
      .map(([t, b]) => `«${t}» (${b.join('، ')})`).join(' · ')}` : ''));
}

async function main() {
  await queueGates();

  console.log('\n— القناةُ واحدة نصّاً: لا صوتَ يُشغَّل خارجها —');
  const stray = files.filter((f) => !ENGINE.has(f))
    .map((f) => [f, outsideChannel(read(new URL(f, APP)))])
    .filter(([, hits]) => hits.length);
  ok(stray.length === 0,
    `${files.length - ENGINE.size} وحدةً تنطق عبر \`audio.play\` وحدَها (لا عنصرَ صوتٍ بيدها)`
    + (stray.length ? ` — **خارج القناة: ${stray
      .map(([f, hits]) => `${f} (${hits.join('، ')})`).join(' · ')}**` : ''));

  const said = speakers();
  console.log(said.length
    ? `  · وحداتٌ تنطق اليوم: ${said.join('، ')}`
    : '  · ولا وحدةَ تنطق بعد (أوّلُ شاشةٍ ناطقة في الجلسة ٥) — والبابُ قائمٌ يحرس الغياب');

  console.log('\n— القناةُ واحدة عملاً: الثاني لا يبدأ قبل أن يتمّ الأول —');
  await channelGate();

  console.log(fails
    ? `\n${fails} فشل`
    : '\nكلُّ نصٍّ منطوقٍ مُعلَنٌ ومصفوفٌ ومشكول، وقناتُه واحدة');
  return fails ? 1 : 0;
}

/**
 * **القناةُ تُقاس عملاً**: تُشغَّل في node بعنصرِ صوتٍ وهميّ يسجّل لحظتَي بدئه وتمامه.
 *
 * وأربعةُ أحكام — ثلاثةٌ من بلاغ احسب، والرابعُ ائتلافُ الطابور مع جيل ٤ب.
 */
async function channelGate() {
  const plays = [];
  const DEFAULT_MS = 60;
  /* **ومدّتان مختلفتان لجملتين** — وهو أخصُّ ما في هذا الفحص: من انتظر **مهلةً ثابتة**
     بدل `ended` يوافق مدّةً ويخالف الأخرى، فينكشف بأنّ وعدَه يعود **قبل** تمام الجملة
     الطويلة. ومدّةٌ واحدة تستره: يكفيه أن تكون مهلتُه أطولَ منها. (درسُ احسب: الحارسُ
     الذي لا يُحمرّه العطبُ الذي وُلد منه ليس حارساً.) */
  const MS = new Map();   // مفتاحُ الملفّ ← مدّتُه بالمللي (تُملأ بعد الاستيراد)
  globalThis.window = globalThis.window || {};
  globalThis.Audio = class {
    constructor(src) {
      this.src = src;
      this.on = {};
      this.ms = MS.get((String(src).split('/').pop() || '').replace('.mp3', '')) ?? DEFAULT_MS;
    }
    addEventListener(type, fn) { this.on[type] = fn; }
    removeAttribute() { this.src = ''; }
    load() {}
    pause() { this.close(); }
    close() {
      if (this.row && this.row.t1 === Infinity) {
        this.row.t1 = performance.now();
        clearTimeout(this.timer);
      }
    }
    play() {
      this.row = { key: this.src, ms: this.ms, t0: performance.now(), t1: Infinity };
      plays.push(this.row);
      this.timer = setTimeout(() => { this.close(); this.on.ended?.(); }, this.ms);
      return Promise.resolve();
    }
  };
  // بلا فهرسٍ ولا بيانِ بصمات: `known === null` فيُجرَّب الملفّ — وهو ما يُقاس هنا
  globalThis.fetch = async () => ({ ok: false, status: 404 });

  const audio = await import(new URL('audio.js', APP));
  MS.set(audio.keyFor('أَلِفْ'), 40);
  MS.set(audio.keyFor('بَاءْ'), 260);
  MS.set(audio.keyFor('جِيمْ'), 180);
  const overlapped = (from = 0) => plays.filter((r, i) => i > 0 && r.t0 >= from
    && plays[i - 1].t1 !== Infinity && r.t0 < plays[i - 1].t1 - 1).length;
  /** أسُمعت الجملةُ إلى آخر مدّتها؟ (لا مقطوشة) */
  const whole = (r) => r && Number.isFinite(r.t1) && r.t1 - r.t0 >= r.ms * 0.9;

  // ١) نداءان في اللحظة نفسِها — وهو عينُ ما وقع في ميدان احسب (إعلانُ الخطوة وسؤالُ الشاشة)
  const first = audio.play('أَلِفْ').then((h) => ({ h, at: performance.now() }));
  const second = audio.play('بَاءْ').then((h) => ({ h, at: performance.now() }));
  ok(typeof first?.then === 'function' && typeof second?.then === 'function',
    '`play` تُرجِع وعدَ القناة ولا تبتلعه');
  const heard = await Promise.all([first, second]);
  ok(plays.length === 2 && !overlapped(),
    `ونداءان في اللحظة نفسِها يُسمَعان **بالتتابع لا معاً** (${plays.length} تشغيلاً`
    + `${plays.length === 2 ? `، فاصلُهما ${Math.round(plays[1].t0 - plays[0].t1)}ms` : ''})`);
  ok(plays.length === 2 && heard.every((x) => x.h === true) && plays.every(whole),
    `وكلٌّ يُسمَع **إلى آخر مدّته** (${plays.map((r) => `${Math.round(r.t1 - r.t0)}/${r.ms}`).join(' · ')}ms)`
    + ' — لا وعدَ معلَّقٌ يجمّد القناة، ولا جملةَ تُدهَس');
  // (والحسابُ يحتمل غيابَ الصفّ كي يُقرأ الإخفاقُ شكوى لا انهياراً)
  ok(plays.length === 2 && heard.every((x, i) => x.at >= plays[i].t1 - 1),
    'ووعدُ كلٍّ يعود **بعد تمام جملته هو** — ومدّتان مختلفتان تفضحان المهلةَ الثابتة'
    + ` (${heard.map((x, i) => (plays[i] ? `${Math.round(x.at - plays[i].t1)}ms` : 'بلا تشغيل'))
      .join(' · ')} بعد التمام)`);

  // ٢) الوعدُ يتمّ **بتمام الكلام** — به تنتظر الشاشةُ قبل أن تنتقل
  const before = plays.length;
  const t0 = performance.now();
  await audio.play('جِيمْ');
  const moved = performance.now();
  const row = plays[before];
  ok(whole(row) && moved >= row.t1,
    `ووعدُ \`play\` يتمّ **بتمام الكلام**: سُمع ${row ? Math.round(row.t1 - row.t0) : '؟'}ms `
    + `من ${row ? row.ms : '؟'}، وعاد الوعدُ بعد تمامه (لا بعد مهلةٍ ثابتة — ${Math.round(moved - t0)}ms جملةً)`);

  // ٣) الإسكاتُ يُفرغ الطابور ولا يعطّله (نقرةُ الطفل الناقلة)
  const mark = plays.length;
  const dropped = [audio.play('دَالْ'), audio.play('هَاءْ')];
  audio.stop();
  await Promise.all(dropped);
  ok(plays.length === mark,
    `والإسكاتُ **يُفرغ الطابور**: ما صُفّ قبله لا يُشغَّل بعده `
    + `(${plays.length - mark} تشغيلاً بعد الإسكات)`);
  await audio.play('وَاوْ');
  ok(plays.length === mark + 1, 'والقناةُ تعمل بعد الإسكات (إفراغٌ لا تعطيل)');

  // ٤) **الطابورُ والجيلُ يأتلفان** — عهدُ ٤ب مؤدّىً بالطابور:
  //    نقرتان متسابقتان (كلٌّ تُسكت ثم تُشغّل) ⇒ تعيش الأخيرة وحدها؛
  //    وتتابعٌ تتجاوزه نقرةٌ ⇒ بقيّتُه تسقط ولا تُكمِل فوق الشاشة الجديدة.
  const tap = plays.length;
  audio.stop(); const tap1 = audio.play('زَايْ');
  audio.stop(); const tap2 = audio.play('سِينْ');
  await Promise.all([tap1, tap2]);
  ok(plays.length === tap + 1 && String(plays[tap].key).includes(audio.keyFor('سِينْ')),
    `ونقرتان متسابقتان (\`stop\` ثم \`play\`) **تعيش الأخيرة وحدها** `
    + `(${plays.length - tap} تشغيلاً) — عهدُ ٤ب بالطابور لا بسباق إسكات`);

  const seqAt = plays.length;
  const seq = audio.playSequence(['شِينْ', 'صَادْ', 'ضَادْ'], 0);
  await new Promise((r) => setTimeout(r, DEFAULT_MS / 2));
  audio.stop();
  await seq;
  await new Promise((r) => setTimeout(r, DEFAULT_MS * 3));
  ok(plays.length - seqAt <= 1,
    `وتتابعٌ تتجاوزه نقرةٌ **تسقط بقيّتُه** ولا يُكمِل فوق الشاشة الجديدة `
    + `(${plays.length - seqAt} من ثلاثة)`);
  ok(overlapped() === 0,
    `ولا لحظةَ في الفحص كلِّه يعمل فيها صوتان معاً (${plays.length} تشغيلاً مقيساً)`);
}

// ————— فحصُ الفاحص: **مُجرَّبٌ سالباً** —————

function selfTest() {
  let bad = 0;
  const check = (cond, msg) => { if (cond) console.log('  ✓', msg); else { bad++; console.log('  ✗', msg); } };

  console.log('\n— الشكلُ الكامل يمسك العاري —');
  check(bareLetters('اُكْتُبْهُ وَحْدَكْ').length === 0, 'نصٌّ مشكولٌ بالكامل يمرّ');
  check(bareLetters('شَاهِدْ كَيْفَ يُكْتَبْ').length === 0, 'وحرفُ المدّ لا يُطالَب بحركة (الألف)');
  check(bareLetters('تَتَبَّعِ الْمَسَارْ').length === 0, 'ولامُ التعريف الساكنة تمرّ');
  check(bareLetters('الشَّمْسْ').length === 0, 'ولامُ «ال» الشمسية أمام مشدَّدٍ تمرّ');
  check(bareLetters('اكتب وحدك').length > 0, 'ونصٌّ عارٍ يُمسَك');
  check(bareLetters('اُكْتُبْهُ وحدك').length > 0, 'وكلمةٌ عاريةٌ في نصٍّ مشكولٍ تُمسَك');

  console.log('\n— السترُ من النطق الآليّ: ملفٌّ أو انتظارٌ، لا دعوى —');
  const bank = new Set(['باء']);
  check(coverOf('باء', bank, undefined) === 'ملف', 'ما له ملفٌّ في البنك مستورٌ بملفه');
  check(coverOf('اُكْتُبْهُ وَحْدَكْ', bank, { status: 'pending' }) === 'انتظار',
    'وما ينتظر التصريفَ مستورٌ باحتياط النطق مؤقتاً');
  check(coverOf('اُكْتُبْهُ وَحْدَكْ', bank, {}) === 'انتظار', 'ومدخلٌ بلا حالةٍ يُقرأ منتظِراً');
  check(coverOf('اُكْتُبْهُ وَحْدَكْ', bank, { status: 'done' }) === 'مُصرَّفٌ بلا ملف',
    '**ومدخلٌ يقول «صُرِّف» ولا ملفَ له يُمسَك** — الأخطرُ من الغياب');
  check(coverOf('اُكْتُبْهُ وَحْدَكْ', bank, undefined) === '', 'ونصٌّ خارج القائمة والبنك لا سترَ له');

  console.log('\n— الفئةُ المنحرفة تُمسَك، والمُصرَّفُ لا يُمَسّ —');
  const wanted = new Map([['اُكْتُبْهُ وَحْدَكْ', 'ui'], ['باء', 'letter_name']]);
  const drift = (queue) => categoryDrift(queue, wanted);
  check(drift([{ text: 'اُكْتُبْهُ وَحْدَكْ', category: 'letter_name', status: 'pending' }]).length === 1,
    'منتظِرٌ فئتُه غير المشتقّة يُمسَك (نصٌّ انتقل موضعَه)');
  check(drift([{ text: 'اُكْتُبْهُ وَحْدَكْ', category: 'ui', status: 'pending' }]).length === 0,
    'ومَن وافقت فئتُه موضعَه يمرّ');
  check(drift([{ text: 'اُكْتُبْهُ وَحْدَكْ', category: 'letter_name', status: 'done' }]).length === 0,
    '**والمُصرَّفُ خارجَ الباب** — فئتُه أثرُ ما سُمع، وتبديلُها لا يبدّل صوتاً');
  check(drift([{ text: 'نَصٌّ بَائِدْ', category: 'ui', status: 'pending' }]).length === 0,
    'وما لا تنطقه الشجرةُ ليس منحرفاً (بابُ البائد يتولّاه)');

  console.log('\n— قيدا البروتوكول يُمسكان —');
  check(hasDigit('اِكْتُبْ ٣') && hasDigit('رَقْم 3'), 'الرقمُ في النصّ المنطوق يُمسَك (مشرقياً ومغربياً)');
  check(!hasDigit('ثَلَاثَةْ'), 'واسمُ العدد يمرّ');
  check(copiedInQueue([{ text: 'باء' }], bank).length === 1,
    '**ونصٌّ له ملفٌّ منسوخٌ من اقرأ يُمسَك في القائمة** — توليدُه يُسمِعه بصوتين');
  check(copiedInQueue([{ text: 'اُكْتُبْهُ وَحْدَكْ' }], bank).length === 0,
    'وتعليمةُ الشاشة تمرّ — لا ملفَ لها في البنك');

  console.log('\n— القناةُ واحدة: ما شغّل صوتاً بيده يُمسَك —');
  check(outsideChannel('await audio.play(t); await audio.playSequence(xs);').length === 0,
    'وحدةٌ تنطق عبر القناة تمرّ');
  check(outsideChannel('const el = new Audio(src); el.play();').length === 2,
    '**وعنصرُ صوتٍ يُنشَأ ويُشغَّل خارجها يُمسَك** (وهو ما يعيد التراكب مهما أُحكم الطابور)');
  check(outsideChannel('window.speechSynthesis.cancel();').length === 1,
    'ونطقٌ آليّ من خارج المحرّك يُمسَك');
  check(outsideChannel('new SpeechSynthesisUtterance(t)').length === 1, 'ومعه لسانُه');
  check(outsideChannel("const a = document.createElement('audio'); a.src = u;").length === 1,
    'وعنصرٌ يُصنَع بغير `new Audio` يُمسَك كذلك');
  check(outsideChannel('const ctx = new AudioContext();').length === 1, 'ومحرّكُ الصوت الخام');

  console.log('\n— ولوحُ الكتابة لا يُظلَم: `.play()` عليه حركةٌ لا صوت —');
  const board = 'const surface = penSurface({ ref }); surface.play(); live = surface; live?.play();';
  check(outsideChannel(board).length === 0,
    'مقبضُ `penSurface` وما أُسنِد إليه يمرّان (عرضٌ متحرك لا صوت)');
  check(surfaceHandles(board).has('surface') && surfaceHandles(board).has('live'),
    'والمقابضُ **مشتقّةٌ من الملفّ** لا مكتوبةً في الفاحص (`surface` ثم `live`)');
  check(outsideChannel('const el = document.querySelector("x"); el.play();').length === 1,
    '**وعنصرٌ ليس مقبضَ لوحٍ يُمسَك** — فالرخصةُ للوح لا لكل `.play()`');
  check(surfaceHandles('const surface = penSurface({}); const other = surface;').has('other'),
    'والإسنادُ المتسلسل يُتبَع (مقبضٌ من مقبض)');
  check(!surfaceHandles('const el = new Audio(u); const b = el;').has('b'),
    'وما ليس من `penSurface` لا يصير مقبضاً بالإسناد');

  console.log(bad ? `\n${bad} فشل` : '\n✓ الفاحص يمسك المخالفات كلها');
  return bad ? 1 : 0;
}

process.exit(process.argv.includes('--self-test') ? selfTest() : await main());
