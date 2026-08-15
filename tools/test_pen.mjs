// حارسُ محرّك القلم (الجلسة ١) بلا متصفّح:
//   node tools/test_pen.mjs
//
// المحروس هنا أربعة:
//   ١) **الخصوصيةُ بنيويّاً** (`METHOD.md §٣.٧`): كلُّ ملفٍّ يمرّ به مسارُ الطفل لا
//      يعرف الشبكة أصلاً — يُقرأ نصُّه مجرَّداً من التعليقات فلا يمرّ فيه `fetch` ولا
//      رفعٌ ولا عنوانٌ خارجيّ. **ومجرَّبٌ سالباً**: نصٌّ مزروعٌ فيه `fetch` يُسقِط
//      الكاشف. (وحدةٌ لا تعرف الطريق أرسخُ من حارسٍ يمنع سلوكَها — سابقةُ اقرأ في
//      `recorder.js`، ونظيرُ هذا الحارس هناك `test_recordings.mjs §١`.)
//   ٢) **عدّةُ المعايرة** (`METHOD.md §٣.٩`): مساراتٌ مسجّلة في `pen_traces.json`
//      تُدخَل على المحرّك آلياً ويُثبَت حكمُه حالةً حالة — **سالباً وموجباً**،
//      و**المعكوسُ يُرفَض دائماً** ولو ضوعفت السماحةُ ثلاثاً.
//   ٣) **الشروطُ الأربعة أربعة**: لكلٍّ حالةٌ تُسقِطه وحالةٌ تمرّ به، ولا شرطَ
//      خامسٌ يتسلّل — والهوامشُ تُطبع فتكون أساسَ معايرة الجلسة ١٢.
//   ٤) **الوصل**: الوحدةُ في مخزون العمل دون إنترنت، ولا تستورد شيئاً، وصفحةُ
//      التجربة خلف `?dev=1` وحدها.

import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const APP = new URL('../app/', import.meta.url);
const read = (path) => readFileSync(new URL(path, APP), 'utf8');

const pen = await import(new URL('js/pen.js', APP));
const dev = await import(new URL('js/pendev.js', APP));
const traces = JSON.parse(readFileSync(new URL('./pen_traces.json', import.meta.url), 'utf8'));

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

// ————— ١. الخصوصية: مسارُ الطفل لا يمرّ بملفٍّ يعرف الشبكة —————

/**
 * نصُّ الشيفرة وحدها — بلا تعليقات (وإلا لأمسك الحارسُ توثيقَ القاعدة نفسِها).
 *
 * **ويُستثنى فضاءُ أسماء SVG وحدَه**: `createElementNS` تقرأ `http://www.w3.org/2000/svg`
 * اسماً ثابتاً في المواصفة **ولا تجلبه من شبكةٍ أبداً** — ولا مندوحةَ عنه في رسم
 * SVG برمجياً. وهو الاستثناءُ الوحيد، ومكتوبٌ بحرفه لا بنمطٍ يتّسع لغيره.
 */
const SVG_NS = 'http://www.w3.org/2000/svg';
const codeOf = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|\s)\/\/[^\n]*/g, ' ')
  .replaceAll(SVG_NS, 'svg-namespace');

const NET = ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'EventSource',
  'FormData', 'navigator.connection', 'http://', 'https://', '.upload', 'importScripts'];

/** ما يمرّ به مسارُ الطفل — ويُحرَس نصُّه حرفاً.
 *
 * **و`probe.js` منهم** (الجلسة م١): مسجّلُ الأحداث خلف `?dev=1` يقرأ **موضعَ لمسة
 * الطفل** (`clientX/clientY` و`elementFromPoint`) ليقول أين وقعت النقرةُ ومَن كان
 * فوقها — فهو حاملُ موضعٍ وإن لم يكن حاملَ مسار، وحقُّه حراسةُ الحاملين.
 *
 * **وكلُّ شاشةٍ تبني لوحاً منهم** (الجلسة ٥): مَن نادى `penSurface` أو تلقّى `onFault`
 * وصله من المحرّك **موضعُ الخطأ وانزياحُه** — أيْ إحداثيّ إصبع الطفل — فهو حاملُ
 * موضعٍ كـ`probe.js` سواءً بسواء. **وتُجرَد من القرص لا تُكتب قائمةً**: شاشةٌ تُبنى
 * غداً (الأشكالُ في الجلسة ٧، والنسخُ في ٨) تدخل الحراسةَ يومَ تُكتب، ولا تنفلت
 * صامتةً — وهو نمطُ جرد `tracking` أدناه نفسُه.
 * (وقد كشف هذا الجردُ أنّ `warmup.js` كان خارج الحراسة منذ الجلسة ٤ وهو حاملٌ.) */
const modules = readdirSync(new URL('js/', APP)).filter((f) => f.endsWith('.js')).sort();
const boards = modules.filter((f) => /penSurface\s*\(|onFault\s*:/.test(codeOf(read(`js/${f}`))));
const CARRIERS = [...new Set(['pen.js', 'pendev.js', 'probe.js', ...boards])];
const netTokens = (code) => NET.filter((token) => code.includes(token));

console.log('\n— ١) الخصوصية: مسارُ الطفل لا يجد طريقاً خارج الجهاز —');
for (const file of CARRIERS) {
  const found = netTokens(codeOf(read(`js/${file}`)));
  ok(found.length === 0,
    `${file}: لا يعرف الشبكة — مسارُ قلم الطفل لا يجد فيه طريقاً خارج الجهاز`
    + `${found.length ? ' — وُجد: ' + found.join('، ') : ''}`);
}

// **مجرَّبٌ سالباً**: حارسٌ لا يُجرَّب على ما يُفترض أن يمسكه ليس حارساً.
const planted = 'export function save(t) { fetch("https://x/y", { method: "POST", body: t }); }';
ok(netTokens(codeOf(planted)).length >= 2,
  `والكاشفُ مجرَّبٌ سالباً: نصٌّ مزروعٌ فيه رفعُ مسارٍ يسقط عليه (${netTokens(codeOf(planted)).join('، ')})`);
ok(netTokens(codeOf(`const ns = '${SVG_NS}'; fetch(ns);`)).includes('fetch('),
  'ولا يُخفي استثناءُ فضاء SVG طلباً حقيقياً بجواره');
ok(netTokens(codeOf('// fetch("https://x")\n/* sendBeacon */ const a = 1;')).length === 0,
  'ولا يُمسِك تعليقاً يذكر الشبكة — يُقرأ نصُّ الشيفرة مجرَّداً');

// **`pen.js` لا يستورد شيئاً** — وهو أقوى من منع الشبكة: لا تخزينَ ولا صوتَ ولا
// قياس، فما دخله من مسارٍ خرج منه **حكماً** لا أثراً.
const penCode = codeOf(read('js/pen.js'));
ok(!/\bimport\b/.test(penCode) && !/\brequire\(/.test(penCode),
  'و`pen.js` وحدةٌ صمّاء: لا سطرَ `import` واحد — لا تخزينَ ولا صوتَ ولا قياسَ يمرّ به المسار');
ok(!/localStorage|indexedDB|IDBDatabase|document\.cookie/.test(penCode),
  'ولا يمسّ مخزناً على القرص: مسارُ الطفل يعيش في الذاكرة ويموت فيها');

// ولا يُسرَّب المسارُ عبر وحدةٍ أخرى: كلُّ ملفٍّ يلتقط حركةَ مؤشّرٍ هو أحد حامليه.
// (**و`pointerdown` وحدَها ليست حملاً**: ساعةُ الاستخدام في `main.js` تسمعها لتعرف
// أنّ الطفل حاضر ولا تقرأ موضعَه — والحاملُ من يتتبّع الحركة أو يأسر المؤشّر.)
// **والوحداتُ تُجرَد من القرص لا تُكتب قائمةً**: قائمةٌ مكتوبة تشيخ بأوّل وحدةٍ
// تُضاف (أُضيفت `paths.js` في الجلسة ٢)، فتنفلت من الحارس صامتةً. والجردُ يجدها
// يومَ تُكتب — نظيرُ جرد `test_selftests.mjs`.
// **وقراءةُ الموضع حملٌ كتتبّع الحركة** (الجلسة م١): مَن قرأ `clientX` فقد أخذ من
// إصبع الطفل مكانَه — ولو لم يتتبّعه. فيدخل الجردَ بها كما يدخله بأسر المؤشّر.
const tracking = modules.filter((f) => /pointermove|setPointerCapture|getCoalescedEvents|clientX/
  .test(codeOf(read(`js/${f}`))));
ok(tracking.every((f) => CARRIERS.includes(f)),
  `ولا يتتبّع حركةَ القلم ولا يقرأ موضعَ لمسته ملفٌّ خارج حامليه (${tracking.join('، ') || 'لا أحد'})`);

// ————— ١ج. عدّةُ التقاط الميدان: إذنٌ صريح، ولا مخرجَ إلا بيد وليّ الأمر —————
//
// **العلّة** (الجلسة ١٢): أرقامُ السماحة لم تُعايَر بطفل، وعهدُ `METHOD §٣.٥` أن
// تُعايَر بميدانٍ حقيقيّ. فبُنيت عدّةُ التقاطٍ في صفحة التجربة (خلف `?dev=1`).
// **وهي أخطرُ ما كُتب في هذا التطبيق على العهد**، فحراستُها هنا حيث حراستُه:
//   · **الإذنُ شرطٌ بنيويّ**: لا يُقيَّد أثرٌ قبله — مجرَّبٌ سالباً بالمناداة قبله.
//   · **والمخرجُ ملفٌّ بيد وليّ الأمر**: `pendev.js` من حاملي المسار في §١ أعلاه،
//     فلا `fetch` فيه ولا رفعَ ولا عنوان — الحارسُ نفسُه يمسكه إن دخل.
//   · **وما في الملفّ أثرٌ لا طفل**: يُقاس نصُّ الملفّ المولَّد فلا اسمَ ولا تقدّم.

console.log('\n— ١ج) عدّةُ التقاط الميدان: إذنٌ صريح، وملفٌّ بيد وليّ الأمر —');
{
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  const trace = { ch: 'ب', form: 'isolated', mode: 'free', kind: 'done', accepted: true,
    strokes: [[[10, 10], [20, 20]]] };

  dev.fieldClear();
  ok(dev.fieldRecord(trace) === 0 && dev.fieldBook().items.length === 0,
    '**مجرَّبٌ سالباً**: أثرٌ يُعرَض قبل الإذن فلا يُقيَّد منه شيء');
  dev.fieldAllow(true);
  ok(dev.fieldRecord(trace) === 1, 'وبعد الإذن الصريح يُقيَّد');
  dev.fieldAllow(false);
  ok(dev.fieldRecord(trace) === 0 && dev.fieldBook().items.length === 1,
    'وإيقافُ الإذن يوقف التقييد **ولا يمحو ما التُقط**');

  // ولا يمتلئ مخزنُ جهازٍ بقياسٍ منسيّ: للدفتر سقفٌ يُقاس بالتجربة لا يُدَّعى
  dev.fieldAllow(true);
  for (let i = 0; i < 400; i++) dev.fieldRecord(trace);
  const capped = dev.fieldBook().items.length;
  ok(capped > 0 && capped < 400, `وللدفتر سقفٌ يمنع امتلاءَ المخزن (${capped} أثراً من ٤٠٠ عُرضت)`);

  // **وما في الملفّ أثرٌ لا طفل**: يُقاس نصُّه المولَّد لا يُوثَق بحسن الظنّ
  const text = dev.fieldText();
  const leaks = ['stars', 'skills', 'reads', 'faults', 'uktub.progress', 'name']
    .filter((needle) => text.includes(needle));
  ok(leaks.length === 0,
    `وملفُّ وليّ الأمر أثرُ قلمٍ لا تقدّمَ طفل${leaks.length ? ` — تسرّب: ${leaks.join('، ')}` : ''}`);
  ok(text.includes('"origin": "field"'),
    'وهو موسومٌ `field` فيدخل عدّةَ المعايرة بلا التباسٍ بالمصنوع');
  ok(/uktub-field-\d{4}-\d{2}-\d{2}\.json/.test(dev.fieldName()),
    `واسمُه بيومه فلا يُكتب ملفٌّ فوق ملف (${dev.fieldName()})`);

  // وأثرُ اللوح يُقرأ من `d` نصّاً — نقاطاً على الشبكة كما تدخل العدّة
  const pts = dev.fieldStrokes(['M10.5 20 L30 40 L50 60', 'M1 1']);
  ok(pts.length === 1 && pts[0].length === 3 && pts[0][0][0] === 10.5,
    'وأثرُ الحبر يُقرأ نقاطاً على الشبكة، وما دون نقطتين يسقط');

  dev.fieldClear();
  ok(dev.fieldBook().items.length === 0 && dev.fieldBook().on === false,
    'والمحوُ يمحو ويوقف — فلا يبقى التقاطٌ يعمل بلا علمِ أحد');
  delete globalThis.localStorage;
}

// ————— ١ب. مقاييسُ الإرشاد: **تصغر بصغر المادّة** (بلاغُ عين المالك) —————
//
// 🔴 **العلّة من عين المالك (١٣ أغسطس ٢٠٢٦)**: نقطةُ الحرف ونقطةُ البداية ورأسُ
// القلم والسهم كانت أرقاماً ثابتة سُنّت لحرفٍ **يملأ الشبكة** — وفي الكلمة يصير
// الحرفُ جزءاً من حجمه **والنقطةُ لا تصغر** فتطفو كُرَةً فوقه، فيُقرأ «ف» واواً.
//
// **والحارسُ يقيس ولا يصف**: يُدخِل مسارَ حرفٍ مفرد ومسارَ المادّة نفسِها بمقياسها،
// فيلزم أن تصغر العلاماتُ **بنسبة المادّة بعينها**. فلو عاد رقمٌ مكتوبٌ إلى موضعه
// لَما تحرّكت العلامةُ بتحرّك المادّة — ويحمرّ من نفسه بلا سطرٍ يُضاف هنا.
console.log('\n— ١ب) مقاييسُ الإرشاد تُشتقّ من مقياس المادّة —');
{
  const bare = pen.guideOf({});
  const keys = Object.keys(pen.GUIDE);
  ok(keys.length > 0 && keys.every((k) => bare[k] === pen.GUIDE[k]),
    `الحرفُ المفرد يملأ شبكتَه فنسبتُه واحد (${keys.length} مقياساً)`);
  const scale = 0.4;
  const small = pen.guideOf({ tolerance: scale });
  ok(keys.every((k) => Math.abs(small[k] - pen.GUIDE[k] * scale) < 1e-9),
    `وكلُّها تصغر بمقياس المادّة نفسِه (×${scale})`);
  ok(keys.every((k) => small[k] < bare[k]),
    'ولا يبقى مقياسٌ على حاله حين تصغر المادّة — وذاك عينُ ما رآه المالك');
  // **والقياسُ على مادّةٍ حقيقية لا على رقمٍ مُختَرَع**: أضيقُ ما في الشجرة اليوم
  // من الكلمات والجمل — فما يُقاس هو ما يراه الطفل.
  const words = await import(new URL('js/word_paths.js', APP));
  const scales = Object.values(words.WORD_PATHS).map((w) => w.tolerance).filter((t) => t > 0);
  const tight = Math.min(...scales);
  ok(scales.length > 0 && tight < 1,
    `وأضيقُ مادّةٍ في الشجرة نسبتُها ${tight} — فنقطتُها ${(pen.GUIDE.dot * tight).toFixed(1)}`
    + ` لا ${pen.GUIDE.dot}`);
}

// ————— ٢. عدّةُ المعايرة: الحكمُ يُثبَت حالةً حالة —————

console.log('\n— ٢) عدّةُ المعايرة: مساراتٌ مسجّلة تُدخَل على المحرّك —');
ok(traces.cases.length >= 10, `العدّةُ فيها ${traces.cases.length} حالةً مسجّلة`);

// **والعدّةُ تُفحَص قبل أن يُفحَص بها**: ملفٌّ انحرف عن مولّده شاهدٌ فاسد، فيُشغَّل
// فحصُه الذاتيّ هنا في سياقه لا مفرداً (يشغّله `test_selftests.mjs` كذلك بالجرد).
const made = spawnSync('node',
  [fileURLToPath(new URL('./make_pen_traces.mjs', import.meta.url)), '--self-test'],
  { encoding: 'utf8' });
ok(made.status === 0,
  'والملفُّ عينُ ما يولّده مولّدُه — شاهدٌ مجمَّدٌ لا يتحرّك مع المحرّك'
  + (made.status === 0 ? '' : `\n${(made.stdout || made.stderr || '').slice(0, 300)}`));
console.log('  (الهوامشُ تُقرأ من الحالات المقبولة: أما المرفوضةُ فتُقاس ضرباتُها التالية '
  + 'على جزءٍ بقي منتظَراً، فأرقامُها صدى الرفض لا معايرةً له.)');

// **ولكلِّ حالةٍ مسارُها المرجعيّ من الملفّ نفسِه** — فالعدّةُ شاهدٌ تامّ: مسارُها
// معها لا يفترقان، ويحرس المولّدُ (بفحصه الذاتي أعلاه) أنهما لم ينحرفا عنه.
//
// **وكان هنا سطرٌ يربط `refs.sample` بشكل صفحة التجربة** (`pendev.js`) يومَ كانت
// الصفحةُ تعرضه. وقد **تحوّلت الصفحةُ إلى الحروف الحقيقية في الجلسة ٢** كما طالبت
// من نفسها (§٤ أدناه)، فانتقل الشكلُ إلى ملفّ مولِّد العدّة — والرباطُ باقٍ في
// موضعه الصحيح: المولِّدُ يكتب المساراتِ والضرباتِ معاً، فلا تحكم عدّةٌ على شكلٍ
// غير الذي سُجِّلت عليه. وحكمُ المحرّك على **مسارات الحروف** يحرسه `test_paths.mjs`.
const refOf = (item) => traces.refs[item.ref];

const seen = new Map();
for (const item of traces.cases) {
  // **وحالاتُ الطريق تُمشى لا تُحكَم دفعةً** (§٢ج أدناه): لمساتُها محاولاتٌ متعاقبة
  // على آلة الخطوة الحرّة، لا ضرباتُ محاولةٍ واحدة.
  if (item.expect.run) continue;
  // **ولكلِّ حالةٍ حَكَمُها المُعلَن**: الخطوةُ الحرّة تُحكَم بحكمها الثاني
  // (`judgeFree`، `METHOD.md §٥ب`) وما سواها بالأول — والحالةُ تقول بأيّهما تُقاس.
  const verdict = item.expect.free
    ? pen.judgeFree(refOf(item), item.strokes)
    : pen.judge(refOf(item), item.strokes);
  seen.set(item.id, verdict);
  const m = verdict.metrics;
  const margin = `انحراف ${Math.round(m.maxLateral)}/${pen.TOLERANCE.lateral}`
    + ` · ارتداد ${Math.round(m.maxBack)}/${pen.TOLERANCE.back}`
    + ` · تغطية ${Math.round(m.coverage * 100)}٪`;
  const wanted = item.expect.accept;
  // **والمطلوبُ أوّلُ خطأ لا وجودُه بين الأخطاء**: الشكوى تُسمّى بعينها، فلو رُفض
  // المسارُ لعلّةٍ أخرى ثم جاء المنتظَرُ صدىً لها لَمَرّ الفحصُ على خطأٍ في الحكم.
  const faultOk = wanted || !item.expect.fault || verdict.primary === item.expect.fault;
  const sizeOk = !item.expect.size || verdict.size === item.expect.size;
  ok(verdict.accepted === wanted && faultOk && sizeOk,
    `${item.id}: ${wanted ? 'يُقبَل' : `يُرفَض بـ«${verdict.size || verdict.primary}»`} — ${item.note}`
    + `\n      ${margin}`
    + `${verdict.accepted === wanted ? '' : ' ← الحكمُ خالف المنتظَر'}`
    + `${faultOk ? '' : ` ← أوّلُ خطئه «${verdict.primary}» والمنتظَر «${item.expect.fault}»`}`
    + `${sizeOk ? '' : ` ← حجمُه «${verdict.size}» والمنتظَر «${item.expect.size}»`}`);
}

// **المعكوسُ يُرفَض دائماً** (نصُّ `METHOD.md §٣.٩`) — والدليلُ أنه ليس رهنَ رقم:
// تُضاعَف السماحةُ ثلاثاً فيبقى مرفوضاً، لأن المرفوضَ فيه **الاتجاه** لا الدقّة.
const reversed = traces.cases.find((c) => c.id === 'reversed');
const loose = [1.5, 2, 3].map((factor) => pen.judge(refOf(reversed), reversed.strokes, { tolerance: factor }));
ok(loose.every((v) => !v.accepted),
  'والمعكوسُ يُرفَض ولو ضوعفت السماحةُ ثلاثاً — المرفوضُ فيه الاتجاهُ لا الدقّة');
ok(loose.every((v) => v.primary === 'start-end' || v.primary === 'reverse'),
  `ويُسمّى خطؤه بعينه في الحالات الثلاث (${[...new Set(loose.map((v) => v.primary))].join('، ')})`);

// وسماحةُ المحطة تعمل: ما قُبل بالسماحة الافتراضية يُردّ إن شُدِّدت إلى الثلث
// (`METHOD.md §٣.٥`: «تتشدّد مع التقدّم») — فالسماحةُ مقبضٌ حقيقيّ لا حلية.
const drift = traces.cases.find((c) => c.id === 'child-drift');
ok(pen.judge(refOf(drift), drift.strokes).accepted
  && !pen.judge(refOf(drift), drift.strokes, { tolerance: 0.33 }).accepted,
  'وسماحةُ المحطة مقبضٌ حقيقيّ: انحرافٌ يُقبل اليومَ يُردّ إذا شُدِّدت إلى الثلث');

// ————— ثغرةُ ذيل الشكل المغلق: الحارسُ الصريح (مراجعةُ المدير للجلسة ١) —————
//
// **ولِمَ سطرٌ خاصٌّ بها وقد مرّت في الجدول أعلاه؟** لأن الجدولَ يقول «رُفضت»،
// وهذا يقول **لماذا كانت تُقبَل**: التغطيةُ كانت تُورَّث من ذيل المسار (٠٫٩٧ بلا
// كتابة). فلو عاد الإرساءُ يوماً إلى المسار كلِّه لَقُرئ الإخفاقُ هنا بعلّته.
const tail = traces.cases.find((c) => c.id === 'closed-tail');
const tailVerdict = pen.judge(refOf(tail), tail.strokes);
ok(!tailVerdict.accepted && tailVerdict.metrics.coverage < 0.1,
  `وحركةٌ ذرّية على **ذيل** شكلٍ مغلق لا ترث تغطيتَه (${tailVerdict.metrics.coverage.toFixed(2)} لا ٠٫٩٧)`
  + ' — النزولُ يُرسى على رأس المسار لا كلِّه');
const ring = traces.cases.find((c) => c.id === 'ring-clean');
ok(pen.judge(refOf(ring), ring.strokes).accepted,
  'ودائرةٌ تامّةٌ صحيحة تُقبَل كما هي — الإصلاحُ سدَّ الثغرة ولم يمنع الشكلَ المغلق');

// ————— صدقُ الاسم على الشكل المغلق (حمولةُ مراجعة الجلسة ١، نُفِّذت في الجلسة ٤) —————
//
// **الرفضُ كان صحيحاً والاسمُ خشناً**: على الشكل المغلق يقع الرجوعُ من البداية في
// الطول **قفزةً إلى الأمام** (إلى ذيل المسار) فلا يمسّه شرطُ الرتابة، ونافذةُ
// الإسقاط لا تبلغ الذيلَ فيُقاس بُعدُه عن الرأس ⇒ `wander`. و**الذهبُ القياسيّ**
// (`METHOD.md §٦`) يقتضي أن تقول اللوحةُ «يعكس اتجاه الحركة» لطفلٍ يدور معكوساً،
// لا «يخرج عن المسار» وهو على الحبر تماماً.
const spun = traces.cases.find((c) => c.id === 'ring-reversed');
const spunVerdict = pen.judge(refOf(spun), spun.strokes);
ok(!spunVerdict.accepted && spunVerdict.primary === pen.FAULTS.REVERSE,
  `ودائرةٌ تُدار معكوسةً تُسمّى «${spunVerdict.primary}» — ${pen.FAULT_TEXT[spunVerdict.primary]}`
  + ' (لا «يخرج عن المسار» وهو يمشي على حبرها)');

// **والوجهُ الآخر على الشكل نفسِه**: يدٌ ترتجف فوق السماحة **في الاتجاه الصحيح**
// تبقى `wander`. فالاسمان يفترقان على الدائرة الواحدة **بالاتجاه** لا بالبُعد —
// ولولا هذا لَابتلع الاسمُ الجديد الشرطَ الثالث على كل شكلٍ مغلق.
const strayRing = traces.cases.find((c) => c.id === 'ring-wander');
const strayVerdict = pen.judge(refOf(strayRing), strayRing.strokes);
ok(!strayVerdict.accepted && strayVerdict.primary === pen.FAULTS.WANDER,
  `ورجفةٌ عارمة على الدائرة نفسِها في اتجاهها الصحيح تبقى «${strayVerdict.primary}»`
  + ' — الاسمان يفترقان بالاتجاه لا بالبُعد');

// ————— الطيّةُ المعلَنة: **الإعلانُ هو الفارق** (الجلسة ٢ب) —————
//
// الجدولُ أعلاه يقول «قُبلت السنّةُ على خطٍّ واحد»، وهذا يقول **بمَ قُبلت**: تُنزَع
// صفةُ الطيّة من المسار نفسِه — لا يتبدّل إحداثيٌّ واحد — فتُرفَض `reverse` كما كانت
// قبل الجلسة ٢ب. فالحكمُ معلَّقٌ بالإعلان لا بتخفيفٍ في العتبات، **ولو أُلغي الإعلانُ
// يوماً لَقُرئ الإخفاقُ هنا بعلّته**.
const spine = traces.cases.find((c) => c.id === 'fold-single-line');
const strip = (ref) => ({
  ...ref,
  strokes: ref.strokes.map(({ folds, ...rest }) => rest),   // eslint-disable-line no-unused-vars
});
const bare = pen.judge(strip(refOf(spine)), spine.strokes);
ok(pen.judge(refOf(spine), spine.strokes).accepted && !bare.accepted
  && bare.primary === pen.FAULTS.REVERSE,
  'وسنّةٌ على خطٍّ واحد تُقبَل **بالطيّة المعلنة وحدَها**: تُنزَع الصفةُ من المسار'
  + ` نفسِه فتُرفَض «${bare.primary}» — والعودُ غيرُ المعلَن ارتدادٌ كما كان`);

// **ولا تُمنَح الطيّةُ بلا مشي** — نظيرُ ثغرة ذيل الشكل المغلق: مَن قفز من المفرق
// إلى الذراع الخارجة لا يرث تغطيةَ ضلعين لم يمشِهما.
const skipped = traces.cases.find((c) => c.id === 'fold-skipped');
const skipVerdict = pen.judge(refOf(skipped), skipped.strokes);
ok(!skipVerdict.accepted && skipVerdict.metrics.coverage < 0.5,
  `وقفزٌ فوق السنّة لا يرث تغطيتَها (${skipVerdict.metrics.coverage.toFixed(2)})`
  + ' — الطيّةُ رخصةٌ في قراءة الموضع لا إعفاءٌ من الكتابة');
// **والمعيارُ يُثبَت على مادّته** (مراجعةُ المدير الثانية): «العودةُ على الأثر الرطب»
// مجمَّدةٌ على **ب/وسطي وب/نهائي الحقيقيّين** — أوسعِ فجوةِ ضلعين في المنهج وأضيقِ
// قوسٍ فيه — لا على السنّ الاصطناعية وحدَها. ولكلٍّ معكوسُه يُرَدّ.
// **والعددُ يُقرأ من العدّة لا يُكتب هنا** (وقد كان `>= 9` فسقط يومَ أحكامِ الكرّاسة:
// حكمُ العمود (§١) أسقط طيّةَ ل/وسطي فخرجت من أهل الطيّة وبقيت شاهدَ رجفتها). فالمطلوبُ
// **أن يبقى للطيّة شاهدُها على مادّتها**: العودةُ على الأثر الرطب على ب/وسطي وب/نهائي.
const fold = traces.cases.filter((c) => refOf(c).strokes.some((s) => s.folds?.length));
const wet = ['ba-medial-retrace', 'ba-final-retrace'].filter((id) => fold.some((c) => c.id === id));
ok(fold.length > 0 && wet.length === 2 && fold.every((c) => seen.get(c.id).accepted === c.expect.accept),
  `وحالاتُ الطيّة كلُّها على حكمها (${fold.length}): تتبّعاً وحُرّاً وقفزاً، **وعودةً على`
  + ` الأثر الرطب على ب/وسطي وب/نهائي** (${wet.length}/2)، ومعكوساتُها تُرَدّ`);
// **والإعلانُ هو الفارق حيث ادُّعي**: كلُّ حالةٍ تُعلن `needsFold` (أيْ أنّ القلمَ
// عاد فيها على أثره) تُرفَض `reverse` إن نُزعت الصفةُ من مسارها — ومَن تتبّع النموذجَ
// بضلعيه لا يحتاجها فلا يُدَّعى له بها.
for (const item of fold.filter((c) => c.expect.needsFold)) {
  const bare = pen.judge(strip(refOf(item)), item.strokes);
  ok(!bare.accepted && bare.primary === pen.FAULTS.REVERSE,
    `  و«${item.id}» بنزع الإعلان: ${bare.accepted ? 'تُقبَل — فالإعلانُ حلية!' : `تُرفَض «${bare.primary}»`}`);
}

// ————— ٢ب. الخطوةُ الحرّة: **الشكلُ لا الأثر** (`METHOD.md §٥ب` — الجلسة م٣) —————
//
// 🔴 **بلاغُ الميدان ٢**: نونٌ صحيحةٌ رُدّت لأنّ كأسها أضيقُ من كأس النموذج الخفيّ،
// **فتركت الطفلةُ الجهاز**. والحكمُ: في الخطوة الحرّة وحدَها يُوفَّق النموذجُ على
// صندوق حبر الطفل (إزاحةً وتحجيماً منتظماً) ثم تُطبَّق الشروطُ الأربعة على الموفَّق.
//
// **والشهادةُ في شقّين لا في واحد**: أن تُقبَل بالحكم الثاني **وأن تُردّ بالأول** —
// فلو سقط التوفيقُ يوماً لَقُرئ الإخفاقُ هنا ببلاغه، ولو صار الحكمُ الأول رحيماً
// لَسقط الشقُّ الثاني ونبّه أنّ الخطوتين ٢ و٣ قد مُسّتا وهما لا تُمَسّان.
console.log('\n— ٢ب) الخطوةُ الحرّة: النموذجُ يُوفَّق على صندوق حبر الطفل —');
{
  const field = traces.cases.filter((c) => c.expect.free);
  const shown = field.filter((c) => c.expect.strict === false);
  ok(shown.length >= 4, `حالاتُ بلاغ الميدان في العدّة (${field.length} منها ${shown.length} تفترق فيها الحكمان)`);
  for (const item of shown) {
    const strict = pen.judge(refOf(item), item.strokes);
    const loose = seen.get(item.id);
    ok(loose.accepted && !strict.accepted,
      `  «${item.id}»: يقبلها الحكمُ الثاني ويردّها الأول «${strict.primary}»`
      + ` — مقياسُ التوفيق ${loose.scale.toFixed(2)}، وانحرافُها بعده ${
        Math.round(loose.metrics.maxLateral)}/${Math.round(pen.TOLERANCE.lateral * pen.FREE.ease)}`
      + `${loose.accepted ? '' : ' ← رُدّت وهي مصيبة: بلاغُ الميدان ٢ يقع من جديد'}`
      + `${strict.accepted ? ' ← قبِلها الحكمُ الأول: الخطوتان الموجَّهةُ والخافتة مُسّتا' : ''}`);
  }
  // **ولا تنقلب الرحمةُ تسييباً**: المرفوضُ فيه **الاتجاه** لا الدقّة، فلا يفتحه كرم.
  const noonBack = traces.cases.find((c) => c.id === 'noon-reversed');
  const wide = [1.5, 2, 3].map((f) => pen.judgeFree(refOf(noonBack), noonBack.strokes, { tolerance: f }));
  ok(wide.every((v) => !v.accepted),
    'ونونٌ معكوسةٌ تُرَدّ بالحكم الثاني ولو ضوعفت سماحتُه ثلاثاً — الاتجاهُ مادّةٌ مدرَّسة');
  const mirror = traces.cases.find((c) => c.id === 'noon-mirrored');
  ok(!pen.judgeFree(refOf(mirror), mirror.strokes).accepted,
    'ومرآةُ النون تُرَدّ وهي تملأ صندوقَها — التوفيقُ إزاحةٌ وتحجيمٌ منتظم **لا انعكاس**');

  // **والتوفيقُ تحجيمٌ منتظم لا تشويهَ نِسَب**: يُقاس على نون الصورة نفسِها —
  // مقياسٌ واحدٌ للمحورين، فلا يُمطّ النموذجُ على أيّ شكلٍ فيقبله.
  const narrow = traces.cases.find((c) => c.id === 'noon-narrow');
  const fit = pen.fitFree(refOf(narrow), narrow.strokes);
  const model = pen.inkBox([pen.refPoints(refOf(narrow))]);
  ok(typeof fit.s === 'number' && Math.abs(fit.child.w / model.w - fit.child.h / model.h) > 0.1,
    `والتوفيقُ **منتظم**: نسبةُ العرض ${(fit.child.w / model.w).toFixed(2)} وغيرُ نسبة`
    + ` الارتفاع ${(fit.child.h / model.h).toFixed(2)}، ومقياسُه واحدٌ للمحورين ${fit.s.toFixed(2)}`);

  // **وحدُّ الحجم محسوبٌ من الصندوق لا مكتوبٌ بيد**: يتحرّك بتحرّك السماحة والصندوق.
  const small = traces.cases.find((c) => c.id === 'noon-tiny');
  const big = traces.cases.find((c) => c.id === 'noon-huge');
  ok(pen.judgeFree(refOf(small), small.strokes).size === pen.SIZE.SMALL
    && pen.judgeFree(refOf(big), big.strokes).size === pen.SIZE.BIG,
    'والحجمُ الشاذُّ **يُرشَد إليه بجملته**: '
    + `«${pen.SIZE_TEXT[pen.SIZE.SMALL]}» و«${pen.SIZE_TEXT[pen.SIZE.BIG]}» — لا ردٌّ صامت`);
  // وحدُّه من الصندوق: تُوسَّع سماحةُ المحطة فيتّسع معها ما يُعدّ ضئيلاً — رقمٌ محسوب.
  const shrunk = traces.cases.find((c) => c.id === 'noon-small');
  const wideTol = { ...pen.TOLERANCE, lateral: pen.TOLERANCE.lateral * 3 };
  ok(pen.sizeOf(refOf(shrunk), shrunk.strokes) === null
    && pen.sizeOf(refOf(shrunk), shrunk.strokes, wideTol) === pen.SIZE.SMALL,
    'وحدُّه **محسوبٌ من ممرّ السماحة والصندوق**: تُثلَّث سماحةُ الانحراف فيصير المقبولُ ضئيلاً');

  // 🚪 **ولا انسدادَ أبداً**: للمحرّك عدّةُ تعثّرٍ معلَنة، وللشاشة مخرجٌ تفتحه بها.
  const lesson = codeOf(read('js/lesson.js'));
  ok(pen.FREE.stumbles >= 2 && penCode.includes('onStuck?.(run.stumbles)'),
    `والمحرّكُ يفتح المخرجَ الكريم بعد ${pen.FREE.stumbles} تعثّراتٍ متتالية (\`onStuck\`)`);
  ok(/onStuck\s*:/.test(lesson) && /function wayOut/.test(lesson)
    && /score\(step, unit, false\)/.test(lesson),
    'والشاشةُ تفتحه بابين — عودةٌ إلى التتبّع أو مضيٌّ — **وليتنر يعيدها** (محاولةٌ غيرُ تامّة في سجلّه)');
  // (يُقرأ نصُّ الشيفرة مجرَّداً من التعليقات — وإلا لَأمسك الحارسُ توثيقَ القاعدة نفسِها.)
  ok(!/رسوب|فشل|لم تنجح|أخطأت|حاول مرّة أخرى/.test(lesson),
    'ولا لومَ في نصّ المخرج ولا رسوب — الطفلُ يخرج من الشاشة بيده لا بيأسه');
  // **والخطوتان الموجَّهةُ والخافتة لا تُمَسّان**: الحكمُ الثاني معلَّقٌ بالنمط الحرّ وحدَه.
  ok(/mode === MODES\.FREE/.test(penCode) && /if \(!free\) trial\.down/.test(penCode),
    'والحكمُ الثاني للنمط الحرّ وحدَه — والموجَّهُ والخافتُ على حَكَمهما اللحظيّ كما كانا');
}

// ————— ٢ج. طريقُ المحاولة الحرّة: **يُمشى لمسةً لمسة** (مراجعةُ المدير للجلسة م٣) —————
//
// 🔴 **العلّةُ المقيسة**: الحكمُ الثاني صحيحٌ في نفسه، **والطريقُ إليه كان ينقطع**:
// في محطة التمييز يُكتب جسمُ الأخت فيُقبَل (الجسمُ واحدٌ في ب ت ث ن ي)، ثم يُعيد
// الطفلُ الشكلَ كلَّه فتُقاس ضربتُه الأولى على **الجزء الباقي** فتُردّ أبداً — فلا
// يبلغ `onDone` ولا تُكتب مهارةُ المحطة. **وهو نقضُ «لا تدريسَ بلا قياس» لا دَين.**
//
// **والحارسُ يمشي الطريق ولا يقرأ سطراً**: تُدار آلةُ المحاولة (`createFreeRun`) —
// وهي **عينُ ما يقوده اللوح** لا نسخةٌ ثانية — ويُقاس أنّها تبلغ آخرَها.
console.log('\n— ٢ج) طريقُ المحاولة الحرّة يبلغ آخرَه —');
for (const item of traces.cases.filter((c) => c.expect.run)) {
  const run = pen.createFreeRun(refOf(item), {});
  const steps = item.strokes.map((points) => run.push(points));
  const restarts = steps.filter((r) => r?.restarted).length;
  ok(run.done === item.expect.accept,
    `${item.id}: ${run.done ? 'يبلغ آخرَ الطريق' : 'لا يبلغه'} — ${item.note}`
    + `\n      ${item.strokes.length} لمسةً · استُؤنف ${restarts} · تعثّرات ${run.stumbles}`
    + `${run.done === item.expect.accept ? '' : ' ← الطريقُ خالف المنتظَر'}`);
}
// **ومجرَّبٌ سالباً في الآلة نفسِها**: نصفُ الشكل لا يبلغ آخرَه — فلو صار البابُ
// يخضرّ لكلّ لمسةٍ لَما ميّز جواباً من نصف جواب.
{
  const half = traces.cases.find((c) => c.id === 'compare-sister-then-right');
  const run = pen.createFreeRun(refOf(half), {});
  run.push(half.strokes[half.strokes.length - 2]);      // الجسمُ وحدَه بلا نقطته
  ok(!run.done && run.settled === 1,
    `وجسمٌ بلا نقطته لا يبلغ آخرَ الطريق (استُوفي ${run.settled} من ${run.parts.length}`
    + ' جزءاً) — فالبابُ يفرّق بين الجواب ونصفِه');
}

// ————— ٣. الشروطُ الأربعة أربعة: لكلٍّ وجهاه —————

console.log('\n— ٣) الشروطُ الأربعة: لكلِّ شرطٍ حالةٌ تُسقِطه —');
const CONDITIONS = [
  ['١ البداية', ['start-far', 'start-end']],
  ['٢ التقدّمُ الرتيب', ['reverse']],
  ['٣ الانحرافُ العرضيّ', ['wander']],
  ['٤ الترتيبُ والنقاط', ['order', 'dots-first', 'incomplete']],
];
const allCodes = new Set([...seen.values()].flatMap((v) => v.codes));
for (const [name, codes] of CONDITIONS) {
  const hit = codes.filter((code) => allCodes.has(code));
  ok(hit.length > 0, `الشرط ${name}: تُسقِطه العدّةُ فعلاً (${hit.join('، ') || 'لا حالة'})`);
}
const accepted = traces.cases.filter((c) => c.expect.accept && !c.expect.run);
ok(accepted.length >= 3 && accepted.every((c) => seen.get(c.id).accepted),
  `وثلاثُ كتاباتٍ سليمةٍ على الأقل تُقبَل — ومنها الرجفةُ الخفيفة (${accepted.length} حالة)`);
ok([...allCodes].every((code) => Object.values(pen.FAULTS).includes(code)),
  'ولا خطأَ يخرج من المحرّك بلا اسمٍ معلَنٍ في `FAULTS` (تقرؤه لوحةُ الجلسة ١٠)');
ok(Object.keys(pen.FAULT_TEXT).length === Object.keys(pen.FAULTS).length,
  'ولكلِّ خطأٍ نصُّه العربيّ — فلا يظهر في اللوحة رمزٌ بلا جملة');
// والخطأُ يحمل موضعَه وانزياحَه، فتُبنى «يبدأ الميمَ من أسفل» من البيان لا من نصٍّ مكتوب
const startFault = seen.get('reversed').faults.find((f) => f.code === 'start-end');
ok(startFault && Array.isArray(startFault.off) && Math.abs(startFault.off[0]) > 100,
  `وكلُّ خطأٍ يحمل انزياحَه بعينه (${startFault ? startFault.off.map(Math.round).join('، ') : 'لا شيء'})`
  + ' — منه تُبنى جملةُ لوحة وليّ الأمر');

// ————— ٤. الوصل: المخزون والتوجيه وصفحةُ التجربة —————

console.log('\n— ٤) الوصل —');
const sw = read('sw.js');
const version = Number((sw.match(/VERSION = 'v(\d+)'/) || [])[1]);
ok(sw.includes("'js/pen.js'") && sw.includes("'js/pendev.js'") && version >= 2,
  `ووحدتا القلم في مخزون العمل دون إنترنت بنسخةٍ مرفوعة (v${version} ≥ v2)`);

const main = codeOf(read('js/main.js'));
ok(main.includes('releasePen()'),
  'والموجّهُ يُطلق اللوحَ عند مغادرة الشاشة (لا يتبع الطفلَ إلى غيرها)');
const devCode = codeOf(read('js/pendev.js'));
ok(/if\s*\(!DEV\)\s*return null/.test(devCode) && main.includes('DEV'),
  'وصفحةُ التجربة خلف `?dev=1` وحدها — لا يقع عليها طفل');
ok(!/[٠-٩0-9]\s*(ثانية|ثوان|دقيقة)/.test(devCode) && !/setInterval/.test(devCode)
  && !/setInterval/.test(penCode),
  'ولا مؤقّتَ ولا عدّ تنازليّ في المحرّك ولا في صفحته (`METHOD.md §٣.٤`)');
ok(!/خطأ!|أخطأت|حاول مرة أخرى/.test(read('js/pen.js')),
  'ولا شاشةَ «خطأ» ولا لومَ في نصّ المحرّك — الإخفاقُ إرشادٌ لا رفض');
ok(penCode.includes('pen-start') && penCode.includes('pen-arrow') && penCode.includes('pen-box--hint'),
  'والإرشادُ مبنيّ: وميضُ نقطة البداية وسهمُ الاتجاه');
ok(penCode.includes("pointerType === 'pen'") && penCode.includes("pointerType === 'touch'"),
  'والإصبعُ والقلمُ سواء مع تجاهل لمس الكفّ (ق٤)');
ok(penCode.includes('requestAnimationFrame'),
  'والرسمُ والحكمُ في `requestAnimationFrame` لا في كل حدثِ حركة (`METHOD.md §٣.٦`)');

// **النموذجُ هو المقياس** (`METHOD.md §٣.٢`): العرضُ المتحرك والتقييمُ من `ref` نفسِه —
// ويُثبَت بالبنية لا بالدعوى: اللوحُ لا يقبل خطّاً ثانياً، ودالّةُ الحكم تقرأ ما يرسمه.
ok(/penSurface\(config\)/.test(read('js/pen.js')) && penCode.includes('createTrial(ref'),
  'و«النموذجُ هو المقياس»: اللوحُ يبني حَكَمَه من `ref` الذي يرسمه — لا مصدرَ ثانٍ');

// ————— المطالبةُ المؤجَّلة، وقد استُوفيت (الجلسة ٢) —————
// كانت صفحةُ التجربة تعرض شكلاً هندسياً وتطالب من نفسها بالتحوّل يومَ يمتلئ
// `PATHS`. **وقد امتلأ فتحوّلت**، فصار الشرطُ مقلوباً: لا يجوز أن تعرض الصفحةُ
// شكلاً من عندها وفي المنهج مساراتُ حروفٍ عابرةٌ لفاحصها.
ok(dev.penLetters().length > 0 && devCode.includes('pathOf('),
  `وصفحةُ التجربة تعرض **مسارَ حرفٍ من المنهج بعينه** (${dev.penLetters().join('، ') || 'لا حرف'})`
  + ' — لا شكلاً من عندها');
ok(!/SAMPLE|arc\(|line\(/.test(devCode),
  'ولا شكلَ هندسياً باقياً فيها — ما يُجرَّب عليه المحرّكُ هو مادّتُه');

console.log(fails ? `\n${fails} فشل` : '\nمحرّك القلم: الخصوصيةُ والمعايرةُ والشروطُ الأربعة خضرٌ');
process.exit(fails ? 1 : 0);
