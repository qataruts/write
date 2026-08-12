// **مسوِّي القائمة الصوتية** — يقابل ما تنطقه الشجرة بما في `tools/audio_queue.json`:
//
//   node tools/queue_texts.mjs                 # عرضُ الناقص والبائد والمنحرف (لا يكتب)
//   node tools/queue_texts.mjs --add           # إضافةُ الناقص إلى القائمة
//   node tools/queue_texts.mjs --prune         # إسقاطُ المنتظِر الذي لم يعد يُنطق
//   node tools/queue_texts.mjs --retag         # ردُّ فئةِ المنتظِر إلى المشتقّة من موضعه
//   node tools/queue_texts.mjs --wanted-json   # «المطلوب» JSON (يقرؤه الحارس)
//
// **منقولٌ من «اِحْسِبْ»** (`calc@ad59c56` `tools/queue_texts.mjs`، وقيدُه في
// `docs/SEED.md §٨`) — نُقل يومَ صار له موضوع: أوّلُ وحدةٍ تُعلن `SPOKEN` في هذا
// التطبيق (`app/js/lesson.js`، الجلسة ٥). **وجلساتُ التطوير لا تشغّل المولّد ولا
// تلمس `app/audio/`** (`docs/AUDIO_QUEUE.md`) — تضيف نصوصَها هنا فقط.
//
// ————— ولِمَ أداةٌ ومعها حارس؟ —————
//
// `check_speech.mjs` **يحكم**: نصٌّ يُنطق ولا يُصَفّ فشلٌ أحمر، ومدخلٌ لا تنطقه وحدةٌ
// فشلٌ أحمر. وهذه الأداةُ **تُصلِح** ما حكم به. فالحارسُ لا يعدّل شيئاً (وذلك شرطُ
// كونه حارساً)، والأداةُ لا تحكم على أحد — **والاشتقاقُ واحدٌ لهما**: يقرؤه الحارسُ
// من `--wanted-json` لا بنسخةٍ ثانيةٍ عنده، ولو نُسخ لصار لحقيقةٍ واحدةٍ مصدران.
//
// ————— والفئةُ تُشتقّ من **موضع** النصّ لا من شكله —————
//
//   قيمةٌ في `LETTERS[ch].name` (من `curriculum.js`)   ← `letter_name`
//   قيمةٌ في `SAY` وحدةِ شاشة (تُصدِّرها مع `SPOKEN`)   ← `ui`
//
// **ولا تُخمَّن فئةٌ البتّة**: الفئةُ تختار **تعليمةَ الأداء** في المولّد، ومسحةٌ
// خاطئة تُسمع في أذن طفل. فنصٌّ مُعلَنٌ لا تعرف الأداةُ موضعَه **يوقفها باسمه**
// ويُطلب تصنيفُه — وهو أهونُ من أن يُصرَّف اسمُ حرفٍ بمسحة تعليمة.
//
// ————— وأسماءُ الحروف **لا تدخل القائمة أصلاً** —————
//
// `docs/AUDIO_QUEUE.md`: «أصواتُ اقرأ المنسوخة… توليدُها من جديد يُسمِع الطفلَ
// الكلمةَ بصوتين». فما له ملفٌّ في `app/audio/` مستورٌ بملفه، ولا يُصَفّ — ويحرس
// ذلك بابٌ في `check_speech.mjs` (لا مدخلَ لنصٍّ له ملفٌّ منسوخ).

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const APP = new URL('app/js/', ROOT);
const QUEUE = new URL('tools/audio_queue.json', ROOT);
const BANK = new URL('app/audio/manifest.json', ROOT);

const REQUESTED_BY = process.env.QUEUE_BY || 'session-5';
const ENGINE = new Set(['audio.js']);          // محرّكُ النطق لا مصدرَ نصّ

/** الأضيقُ أولاً: نصٌّ ورد في موضعين يأخذ فئتَه الأضيق. */
const CATEGORY_ORDER = ['letter_name', 'ui'];

const read = (url) => readFileSync(url, 'utf8');

/**
 * كلُّ نصٍّ تُعلنه الشجرة ← فئتُه، بترتيب لقاء الطفل به (اسمُ الحرف ثم تعليمةُ الشاشة).
 * @returns {{wanted: Map<string,string>, errors: string[]}}
 */
async function declaredTexts() {
  const files = readdirSync(APP).filter((f) => f.endsWith('.js') && !ENGINE.has(f)).sort();
  const out = new Map();
  const errors = [];
  const add = (text, cat) => {
    if (!text) return;
    const had = out.get(text);
    if (!had || CATEGORY_ORDER.indexOf(cat) < CATEGORY_ORDER.indexOf(had)) out.set(text, cat);
  };

  // ١) أسماءُ الحروف — من `LETTERS` بأعيانها (وهي `LETTERS` اقرأ، `SEED.md §٦`)
  const curriculum = await import(new URL('curriculum.js', APP));
  const names = new Set(Object.values(curriculum.LETTERS || {}).map((l) => l.name));

  // ٢) ما تُعلنه الشاشاتُ الناطقة — وفئتُه من موضعه: اسمُ حرفٍ أم تعليمةُ شاشة
  // (والإعلانُ تصريحٌ أو إعادةُ تصدير — والعلّةُ في `check_speech.mjs` عند `DECLARES`)
  for (const file of files) {
    if (!/export\s+(?:const\s+SPOKEN\b|\{[^}]*\bas\s+SPOKEN\b)/.test(read(new URL(file, APP)))) continue;
    const mod = await import(new URL(file, APP));
    if (!Array.isArray(mod.SPOKEN)) continue;
    const screen = new Set(Object.values(mod.SAY || {}));
    for (const text of mod.SPOKEN) {
      if (names.has(text)) add(text, 'letter_name');
      else if (screen.has(text)) add(text, 'ui');
      else errors.push(`نصٌّ في «${file}» لا اسمَ حرفٍ ولا قيمةَ في \`SAY\`: «${text}»`);
    }
  }
  return { wanted: out, errors };
}

const loadQueue = () => (existsSync(QUEUE) ? JSON.parse(read(QUEUE)) : []);
const saveQueue = (rows) => writeFileSync(QUEUE, `${JSON.stringify(rows, null, 1)}\n`, 'utf8');
const banked = () => new Set(existsSync(BANK) ? Object.values(JSON.parse(read(BANK))) : []);

async function main() {
  const { wanted, errors } = await declaredTexts();
  if (errors.length) {
    for (const line of errors) console.error(`  ✗ ${line}`);
    console.error('\nلا تُخمَّن فئةٌ: صنِّف النصَّ في موضعه ثم أعِد التشغيل.');
    process.exit(1);
  }

  if (process.argv.includes('--wanted-json')) {
    console.log(JSON.stringify([...wanted]));
    return 0;
  }

  const queue = loadQueue();
  const inQueue = new Map(queue.map((row) => [row.text, row]));
  const bank = banked();

  // **الناقص**: مُعلَنٌ لا ملفَّ له ولا مكانَ في القائمة
  const missing = [...wanted].filter(([text]) => !bank.has(text) && !inQueue.has(text));
  // **البائد**: منتظِرٌ لم تعد الشجرةُ تنطقه
  const stale = queue.filter((row) => (row.status ?? 'pending') !== 'done' && !wanted.has(row.text));
  // **المنحرف**: منتظِرٌ فئتُه غير المشتقّة من موضعه
  const drift = queue.filter((row) => (row.status ?? 'pending') !== 'done'
    && wanted.has(row.text) && wanted.get(row.text) !== row.category);
  // **المنسوخ**: له ملفٌّ من بنك اقرأ فلا يُصَفّ (توليدُه يُسمِعه بصوتين)
  const copied = queue.filter((row) => bank.has(row.text));

  console.log(`المُعلَن: ${wanted.size} نصّاً · في البنك ${[...wanted].filter(([t]) => bank.has(t)).length}`
    + ` · في القائمة ${queue.length} (منتظِرٌ ${queue.filter((r) => (r.status ?? 'pending') !== 'done').length})`);
  for (const [text, cat] of missing) console.log(`  ناقص: «${text}» (${cat})`);
  for (const row of stale) console.log(`  بائد: «${row.text}»`);
  for (const row of drift) console.log(`  منحرف: «${row.text}» ${row.category} ← ${wanted.get(row.text)}`);
  for (const row of copied) console.log(`  منسوخٌ من اقرأ ولا يُصَفّ: «${row.text}»`);

  let rows = queue;
  let wrote = false;
  if (process.argv.includes('--add') && missing.length) {
    rows = [...rows, ...missing.map(([text, category]) => ({
      text, category, requestedBy: REQUESTED_BY, priority: 100, status: 'pending', doneAt: null,
    }))];
    wrote = true;
  }
  if (process.argv.includes('--prune') && stale.length) {
    rows = rows.filter((row) => !stale.includes(row));
    wrote = true;
  }
  if (process.argv.includes('--retag') && drift.length) {
    rows = rows.map((row) => (drift.includes(row) ? { ...row, category: wanted.get(row.text) } : row));
    wrote = true;
  }
  if (wrote) {
    saveQueue(rows);
    console.log(`\nكُتبت القائمة: ${rows.length} مدخلاً`);
  } else if (!missing.length && !stale.length && !drift.length && !copied.length) {
    console.log('\nالقائمةُ مطابقةٌ لما تنطقه الشجرة');
  }
  return 0;
}

process.exit(await main());
