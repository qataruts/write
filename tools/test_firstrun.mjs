// حارسُ **بطاقة أوّل تشغيل** — «ثبّت أوّلاً ثم امتحن» (`app/js/firstrun.js`):
//   node tools/test_firstrun.mjs
//
// **العلّةُ مقيسةٌ لا متوهَّمة** (بلاغ العائلة `2026-08-17-install-before-exam-first-run-card.md`،
// وذاقها المالكُ بنفسه): على iOS **للتطبيق المثبَّت مخزنٌ مستقلٌّ عن سفاري**، فوالدٌ
// يمتحن ابنَه في المتصفّح ثم يثبّت يجد الرحلةَ من أوّلها — **قياسٌ صحيحٌ ضاع بباب خاطئ**.
//
// **وهذه البطاقةُ يسهل أن تصدق في شاشتها وتكذب في شرطها**: تظهر لطفلٍ يمشي منذ
// أسبوع، أو تعود بعد «لاحقاً»، أو تدعو إلى قياسٍ في المتصفّح فيضيع كما ضاع أوّلَ
// مرّة، أو تفتح الامتحانَ على طفلٍ بنقرة. فكلُّ شرطٍ من شروط الظهور والاختفاء
// **يُجرَّب سالباً** هنا — لا يُقرأ من تعليق.
//
// المحروسُ خمسة:
//   ١) **جدولُ الحالات كاملاً**: البكارةُ والتثبيتُ والإخفاءُ والمعاينة — كلُّ تركيبة.
//   ٢) **البكارةُ من مصدرها**: `progress.untouched()` على تقدّمٍ حيّ — نجمةٌ تُسقطها،
//      ومحاولةُ ليتنر تُسقطها، والمحوُ يردّها.
//   ٣) **حالُ التثبيت من `install.js` وحدَه** — لا كشفَ ثانياً يفترق عنه.
//   ٤) **لا بابَ للامتحان من البطاقة**: لا تعرف وحدةَ اللحاق ولا عنوانَها؛ زرُّها
//      يقصد `#/parent` وحدَه. (وجردُ القرص في `test_catchup.mjs` هو الحكمُ الأعمّ.)
//   ٥) **بنيوياً**: لا شبكة، ولا نصَّ منطوق، وفي قشرة عامل الخدمة، ومركّبةٌ في
//      الموجّه في صدر الخريطة، ومفتاحُها بسابقة مخزننا.
//
// 🔒 **ولا يمسّ جهازاً ولا شبكة**: `localStorage` ظِلٌّ في الذاكرة كسائر حرّاس `node`.

import { readFileSync } from 'node:fs';

const APP = new URL('../app/js/', import.meta.url);
const read = (name) => readFileSync(new URL(name, APP), 'utf8');

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const firstrun = await import(new URL('firstrun.js', APP));
const progress = await import(new URL('progress.js', APP));

/** الشيفرةُ بلا تعليقات — فلا يُقرأ شرحٌ حجّةً على سلوك، ولا يُدان شرحٌ بلفظه. */
const codeOf = (text) => String(text)
  .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

// ————— ١) جدولُ الحالات كاملاً — كلُّ تركيبةٍ من الأربع —————
//
// **ولا سطرَ مكتوبٌ بيد**: تُمشى التراكيبُ الستَّ عشرةَ كلُّها، ويُقارَن كلٌّ بالحكم
// المنصوص في البند. فحالٌ تُنسى غداً تُمسَك من نفسها.

console.log('\n١. جدولُ الحالات — الظهورُ والاختفاء بشروطهما');

const at = (over) => firstrun.firstRunState({
  untouched: true, installed: true, dismissed: false, preview: false, ...over,
});

ok(at({}) === 'placement',
  'رحلةٌ بكرٌ في التطبيق المثبَّت: دعوةُ اللحاق — وهي الحالُ التي جاء البلاغُ لأجلها');
ok(at({ installed: false }) === 'install',
  'وفي المتصفّح غير المثبَّت: **دعوةُ التثبيت وحدَها** ولا دعوةَ لحاق — جوهرُ البلاغ');
ok(at({ untouched: false }) === 'hidden',
  'ورحلةٌ مُسّت (نجمةٌ أو محاولة): لا بطاقةَ أبداً — الدعوةُ فاتت موضعَها');
ok(at({ untouched: false, installed: false }) === 'hidden',
  'ولو كان في المتصفّح: مَن مشى لا يُدعى إلى بداية');
ok(at({ dismissed: true }) === 'hidden' && at({ dismissed: true, installed: false }) === 'hidden',
  'و«لاحقاً» تُخفيها في الحالين — إلى الأبد');
ok(at({ preview: true }) === 'hidden' && at({ preview: true, installed: false }) === 'hidden',
  'وفي وضع المعاينة: صمتٌ — بطاقةٌ فوق شريط المعاينة ضجيجٌ على المقيّم');

// **والترتيبُ بين الشرطين مقصود**: مَن أخفاها ثم محا التقدّمَ لا تعود عليه.
ok(at({ dismissed: true, untouched: true }) === 'hidden',
  'والإخفاءُ يعلو على البكارة: مَن قال «لاحقاً» لا تعود عليه ولو محا التقدّم');

const modes = new Set();
for (const untouched of [true, false]) {
  for (const isInstalled of [true, false]) {
    for (const dismissed of [true, false]) {
      for (const preview of [true, false]) {
        modes.add(firstrun.firstRunState({ untouched, installed: isInstalled, dismissed, preview }));
      }
    }
  }
}
ok([...modes].every((m) => ['hidden', 'install', 'placement'].includes(m)) && modes.size === 3,
  `والتراكيبُ الستَّ عشرةَ لا تنتج إلا الأحوالَ الثلاثة المعلَنة (${[...modes].join('، ')})`);

// ————— ٢) البكارةُ من مصدرها — على تقدّمٍ حيّ لا محاكاة —————
//
// **جُرِّب سالباً ساعةَ كُتب**: بشرط النجوم وحدَه (بلا المحاولات) يخضرّ السطرُ الأوّل
// والثالث ويبقى الثاني أحمرَ — وهو الفرقُ الذي يجعل البطاقةَ تظهر لطفلٍ كتب فأخطأ.

console.log('\n٢. «رحلةٌ بكر» تُقاس من تقدّم الطفل نفسِه');

progress.reset();
ok(progress.untouched(), 'جهازٌ جديد: الرحلةُ بكر');

const node = progress.allNodes()[0];
progress.setStars(node.id, 1);
ok(!progress.untouched(), `ونجمةٌ واحدة تُسقطها (${node.id})`);

progress.reset();
progress.recordAttempt('ب', 'حرف', 'تتبع', true);
ok(!progress.untouched(),
  'و**محاولةٌ في ليتنر بلا نجمة** تُسقطها كذلك — مَن كتب فأخطأ فخرج قد مسّ الرحلة');

progress.reset();
ok(progress.untouched(), 'ومحوُ التقدّم يردّها بكراً — فمن محا ليبدأ من جديدٍ يُدعى');

// ————— ٣) حالُ التثبيت من `install.js` وحدَه —————
//
// **لا كشفَ ثانياً يفترق عنه**: لو قرأت البطاقةُ `display-mode` بيدها دون
// `navigator.standalone` لَقالت لآيفونَ مثبَّتٍ إنه متصفّح — وهي عينُ علّة البلاغ.

console.log('\n٣. حالُ التثبيت مقروءةٌ من موضعٍ واحد');

const install = await import(new URL('install.js', APP));
const cardSrc = read('firstrun.js');
const cardCode = codeOf(cardSrc);
ok(typeof install.installed === 'function', '`install.js` يصدّر `installed()` — مالكُ الحال');
ok(/import \{[^}]*\binstalled\b[^}]*\} from '\.\/install\.js'/.test(cardSrc),
  'والبطاقةُ تستوردها منه');
ok(!/display-mode|navigator\.standalone/.test(cardCode),
  'ولا تقرأ `display-mode` ولا `navigator.standalone` بيدها — **لا كشفَ ثانٍ**');

const installSrc = read('install.js');
const detectors = [...installSrc.matchAll(/matchMedia\(\s*'\(display-mode: standalone\)'\s*\)/g)];
ok(detectors.length === 1,
  `والكشفُ مكتوبٌ مرّةً واحدة في مالكه (${detectors.length} موضعاً)`);

// ————— ٤) لا بابَ للامتحان من البطاقة —————
//
// القيدُ ٣ في البند: **يفتح بوابةَ اللوحة لا الامتحانَ مباشرة** — فلا يفتحه طفلٌ
// على نفسه. (وجردُ القرص كلِّه في `test_catchup.mjs` هو الحكمُ الأعمّ، وهذا يخصّ
// البطاقةَ بعينها.)

console.log('\n٤. زرُّها يقود إلى بوابة اللوحة لا إلى الامتحان');

const catchupRoute = read('catchup.js').match(/export const ROUTE = '([^']+)'/)?.[1] || '#/catchup';
ok(!cardSrc.includes(catchupRoute) && !/catchup/i.test(cardCode),
  `ولا تعرف البطاقةُ وحدةَ الامتحان ولا عنوانَه («${catchupRoute}»)`);
const targets = [...cardSrc.matchAll(/go\('([^']+)'\)/g)].map((m) => m[1]);
ok(targets.length === 1 && targets[0] === '#/parent',
  `ووجهتُها الوحيدةُ بوابةُ اللوحة (${targets.join('، ') || 'لا وجهة'})`);
// **واللوحةُ خلف مسألة الضرب**: لولا ذلك لَفتح الطفلُ على نفسه امتحاناً بنقرتين.
ok(/function gateScreen/.test(read('parent.js')) && /gateCard\(\{ onPass \}\)/.test(read('parent.js')),
  'واللوحةُ نفسُها خلف بوابتها الحسابية — فالطريقُ إلى الامتحان بالغٌ من أوّله');

// ————— ٥) البنية —————

console.log('\n٥. البنية: لا شبكة، ولا صوت، وفي القشرة، وفي صدر الخريطة');

ok(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/.test(cardSrc),
  'الوحدةُ لا تعرف الشبكة — قرارٌ وعرضٌ محليان صرفان');
ok(!/\baudio\b|\.play\(|\bSAY\b/.test(cardCode),
  'ولا نصَّ منطوقاً فيها — بطاقةُ بالغٍ تُقرأ (صفرُ توليدِ صوت)');
// **والمقيسُ ما يُعرَض لا ما يُعلَّق به**: العلّةُ تُشرَح بلفظها في رأس الملفّ (وهذا
// حقُّ من يقرأ الشيفرة)، والمحرَّمُ أن تبلغ الكلمةُ **شاشةَ الطفل**. فتُجرَد نصوصُ
// العرض وحدَها. (جُرِّب سالباً: «امتحانُ اللحاق» عنواناً للزرّ ⇒ أحمر.)
const shown = [...cardCode.matchAll(/'([^'\n]*)'|`([^`]*)`/g)].map((m) => m[1] ?? m[2]);
const labelled = shown.filter((t) => /امتحان/.test(t));
ok(labelled.length === 0,
  '**ولا كلمةَ «امتحان» في نصٍّ معروض** — الزرُّ يحمل اسمَ الميزة كما تسمّيه اللوحة'
  + (labelled.length ? ` — **معروضٌ: ${labelled.join(' · ')}**` : ''));
ok(/'لوليّ الأمر'/.test(cardSrc), 'وشارتُها تقول لمن هي — خطابُ بالغٍ لا وسمٌ على طفل');

const sw = readFileSync(new URL('../app/sw.js', import.meta.url), 'utf8');
ok(sw.includes("'js/firstrun.js'"),
  'وفي قشرة عامل الخدمة — فالبطاقةُ تعمل دون إنترنت كسائر التطبيق');

const mainSrc = read('main.js');
ok(/import \{ firstRunCard \} from '\.\/firstrun\.js'/.test(mainSrc),
  'ومركّبةٌ في الموجّه');
// **وفي صدر الخريطة قبل بطاقة المراجعة و«تابع من هنا»** — موضعُها منصوصٌ في البند
const order = ['const first = firstRunCard(', 'const review = reviewCard(', 'if (next) {']
  .map((needle) => mainSrc.indexOf(needle));
ok(order.every((i) => i > 0) && order[0] < order[1] && order[1] < order[2],
  'وفي **صدر** الخريطة: قبل بطاقة المراجعة وقبل «تابع من هنا»');
// **ولا فراغَ محجوز حين تغيب**: لا تُلحَق إلا إن رُدَّت
ok(/const first = firstRunCard\(render\);\s*\n\s*if \(first\) main\.append\(first\);/.test(mainSrc),
  'ولا فراغَ محجوز حين تغيب — لا تُلحَق إلا إن كان لها موضع');

const progressSrc = read('progress.js');
const storeKey = (progressSrc.match(/STORE_KEY\s*=\s*'([^']+)'/) || [])[1] || '';
const key = (cardSrc.match(/KEY\s*=\s*'([^']+)'/) || [])[1] || '';
const prefix = storeKey.split('.')[0];
ok(prefix && key.startsWith(`${prefix}.`),
  `ومفتاحُها بسابقة مخزننا المقروءة من progress.js (${prefix}. ⇐ ${key || 'لا مفتاح'})`);

console.log(fails ? `\n${fails} فشل` : '\nكل اختبارات بطاقة أوّل تشغيل ناجحة');
process.exit(fails ? 1 : 0);
