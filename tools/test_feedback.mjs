// حارسُ «بلِّغنا» (الجلسة ب — نقلٌ من اقرأ):
//   node tools/test_feedback.mjs
//
// المحروسُ أربعة:
//
//   ١) **القناتان والباب**: واتساب بالرقم المعتمد وبريدُ العائلة المرجع، والبابُ
//      في قسم وليّ الأمر وحدَه — لا زرَّ في شاشة طفل.
//
//   ٢) **الفصلُ بنيوياً — وهو درسُ ميدان اقرأ يومَ وُلدت «بلِّغنا» هناك**: حارسُ
//      خصوصية القلم (`test_pen.mjs §١`) يمنع أيَّ عنوانٍ خارجيّ في **حاملي مسار
//      الطفل**، و«بلِّغنا» تحمل روابطَ خارجية **بطبعها**. فيُقاس هنا أنّ الجمعَ
//      بينهما **مستحيلٌ لا مكروه**: تُجرَد مجموعةُ الحاملين من القرص بمعيار
//      `test_pen.mjs` نفسِه، وتُجرَد مجموعةُ حاملي الروابط كذلك، **وتقاطعُهما
//      صفر** — ولا قائمةَ أسماءٍ تُكتب فتشيخ بأوّل وحدةٍ تُضاف.
//      **ومجرَّبٌ سالباً** من الجهتين: ملفٌّ يجمع لوحاً ورابطاً يُمسَك بالمعيارين،
//      **ولا يمرّ المعيارُ فارغاً** (معيارٌ لا يمسك أحداً يخضرّ كذباً).
//
//   ٣) **صفرُ بياناتِ طفلٍ بنيوياً**: الوحدةُ لا تستورد `progress.js` أصلاً، فليس
//      لها إلى نجومه ولا اسمه ولا رحلته سبيلٌ **تقنيّاً لا تأدّباً**. (وصفرُها في
//      **الرسالة المولَّدة** يُقاس نصّاً في `browser_parent.html`.)
//
//   ٤) **صفرُ شبكةٍ من التطبيق نفسِه**: روابطُ `<a>` تُفتح بنقرة الراشد ولا تُجلَب.

import { readFileSync, readdirSync } from 'node:fs';

const APP = new URL('../app/', import.meta.url);
const read = (p) => readFileSync(new URL(p, APP), 'utf8');

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

/** نصُّ الشيفرة مجرَّداً من التعليقات — وإلا لأمسك الحارسُ توثيقَ القاعدة نفسِها
 *  (نظيرُ `codeOf` في `test_pen.mjs`، وفضاءُ أسماء SVG مستثنى بحرفه هناك وهنا). */
const SVG_NS = 'http://www.w3.org/2000/svg';
const codeOf = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|\s)\/\/[^\n]*/g, ' ')
  .replaceAll(SVG_NS, 'svg-namespace');

const modules = readdirSync(new URL('js/', APP)).filter((f) => f.endsWith('.js')).sort();
const code = new Map(modules.map((m) => [m, codeOf(read(`js/${m}`))]));

// ————— ١) القناتان والباب —————

console.log('\n— ١) القناتان بالرقم والبريد المعتمدين، والبابُ في اللوحة —');

const feedback = code.get('feedback.js') ?? '';
const parent = code.get('parent.js') ?? '';
ok(feedback.includes('wa.me/${WHATSAPP}') && feedback.includes("'97433882806'"),
  'واتساب بالرقم المعتمد (+974 3388 2806)');
ok(feedback.includes("'info@mishkat.qa'") && feedback.includes('mailto:${MAILBOX}'),
  'والبريدُ المرجع info@mishkat.qa');
ok(/feedbackSection/.test(parent) && read('js/feedback.js').includes('بلِّغنا'),
  'وقسمُ «بلِّغنا» في لوحة وليّ الأمر');
ok(/\(قشرة \$\{shell\}\)/.test(feedback) && feedback.includes('location.hash'),
  'وسطرُ السياق يحمل نسخةَ القشرة وموضعَ الشاشة — بلاغٌ قابلٌ للعمل');
ok(feedback.includes("type: 'version'") && feedback.includes('serviceWorker'),
  'ونسخةُ القشرة تُسأل من القشرة الحيّة لا من ثابتٍ يشيخ هنا');

// ————— ٢) الفصلُ بنيوياً: حاملُ المسار وحاملُ الرابط لا يجتمعان —————

console.log('\n— ٢) الفصل: لا ملفَّ يجمع مسارَ الطفل ورابطاً خارجياً —');

/** معيارُ حمل مسار الطفل — **حرفاً من `test_pen.mjs §١`**: مَن بنى لوحاً
 *  (`penSurface`/`onFault`) أو تتبّع حركةً أو قرأ موضعَ لمسة، فقد مرّ به مسارُ
 *  الطفل. والثلاثةُ المسمّاة هناك بأعيانها (`pen.js` وعدّتُها) تُضاف بأسمائها. */
const PEN_MARKS = /penSurface\s*\(|onFault\s*:|pointermove|setPointerCapture|getCoalescedEvents|clientX/;
const NAMED = ['pen.js', 'pendev.js', 'probe.js'];
const carriers = new Set([...NAMED, ...modules.filter((m) => PEN_MARKS.test(code.get(m)))]);

/** ما يحمل عنواناً خارجياً — والبريدُ منه: `mailto:` ليس `https://` فلا يُمسِكه
 *  حارسُ القلم، ولو أُهمل هنا لَتسرَّب رابطٌ إلى لوحٍ من هذا الباب. */
const LINK_MARKS = /https:\/\/|mailto:|wa\.me/;
const holders = modules.filter((m) => LINK_MARKS.test(code.get(m)));

const both = holders.filter((m) => carriers.has(m));
ok(both.length === 0,
  `تقاطعُ حاملي المسار وحاملي الروابط صفر (${carriers.size} حاملَ مسارٍ · ${holders.length} حاملَ رابط)`
  + (both.length ? ` — جمعهما: ${both.join('، ')}` : ''));
ok(holders.length === 1 && holders[0] === 'feedback.js',
  `وحاملُ الروابط ملفٌّ واحدٌ اسمُه feedback.js (${holders.join('، ') || 'لا أحد'})`);
ok(!carriers.has('feedback.js'),
  'و«بلِّغنا» ليست حاملَ مسارٍ — فلا لوحَ فيها ولا موضعَ لمسةٍ يُقرأ');
ok(!LINK_MARKS.test(parent),
  'واللوحةُ نفسُها صفرُ عناوينَ خارجية — تستدعي القسمَ ولا تكتب رابطَه'
  + ' (وتوثيقُ القاعدة فيها تعليقٌ لا شيفرة، فلا يُمسِكه الحارس)');

// **مجرَّبٌ سالباً**: معيارٌ لا يُجرَّب على ما يُفترض أن يمسكه ليس معياراً.
const planted = 'export function board() { penSurface(el); } const wa = "https://wa.me/1";';
ok(PEN_MARKS.test(codeOf(planted)) && LINK_MARKS.test(codeOf(planted)),
  'ومجرَّبان سالباً: ملفٌّ يجمع لوحاً ورابطاً يقع في المعيارين معاً');
ok(LINK_MARKS.test(codeOf('const m = "mailto:x@y";')),
  'ويُمسَك البريدُ كما يُمسَك العنوان (mailto ليس https)');
// **ولا يمرّان فارغين**: مجموعةٌ خاوية تُخضِر التقاطعَ كذباً.
ok(carriers.size >= 4 && carriers.has('pen.js') && carriers.has('lesson.js'),
  `ومعيارُ الحمل يمسك حامليه فعلاً (${[...carriers].sort().join('، ')})`);
ok(holders.length >= 1, 'ومعيارُ الرابط يمسك حاملَه فعلاً — فالتقاطعُ صفرٌ عن قياسٍ لا عن خواء');

// ————— ٣) صفرُ بيانات طفلٍ بنيوياً: لا سبيلَ لها إليها أصلاً —————

console.log('\n— ٣) صفرُ بيانات طفل: الوحدةُ لا تملك إليها سبيلاً —');

const imports = [...feedback.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
ok(imports.length === 1 && imports[0] === './ui.js',
  `لا تستورد إلا بانيَ العنصر (${imports.join('، ') || 'لا شيء'}) — فلا `
  + 'تقدُّمَ ولا اسمَ ولا رحلةَ تصلها');
ok(!/progress|localStorage|indexedDB|document\.cookie/.test(feedback),
  'ولا تمسّ مخزناً على القرص ولا تقرأ تقدُّماً');

// ————— ٤) صفرُ شبكة: روابطُ فتحٍ لا جلب —————

console.log('\n— ٤) صفرُ شبكةٍ من التطبيق نفسِه —');

ok(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|\.upload/.test(feedback),
  'الوحدةُ لا تعرف الشبكة — روابطُ `<a>` تُفتح بنقرة الراشد ولا تُجلَب');

console.log(fails ? `\n${fails} فشل` : '\nكل اختبارات «بلِّغنا» ناجحة');
process.exit(fails ? 1 : 0);
