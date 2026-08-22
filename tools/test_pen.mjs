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
const { PATHS } = await import(new URL('js/paths.js', APP));
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
  ok(pts.length === 2 && pts[0].length === 3 && pts[0][0][0] === 10.5
    && pts[1].length === 1 && pts[1][0][0] === 1,
    'وأثرُ الحبر يُقرأ نقاطاً على الشبكة، **والنقرةُ ضربةٌ بنقطةٍ واحدة تُلتقَط**'
    + ' — نقطةُ الحرف نقرةٌ، وكان المرشِّحُ يبلعها (عطبُ ميدان ١٧ أغسطس)');

  dev.fieldClear();
  ok(dev.fieldBook().items.length === 0 && dev.fieldBook().on === false,
    'والمحوُ يمحو ويوقف — فلا يبقى التقاطٌ يعمل بلا علمِ أحد');
  delete globalThis.localStorage;
}

// ————— ١د. طريقُ الالتقاط يُمشى كاملاً: **الأثرُ يعود بحكمه هو** (جلسة ك) —————
//
// 🔴 **عطبُ ميدان ١٧ أغسطس ٢٠٢٦** (`FIELD_TRIAL §٥`): دفترُ الالتقاط أسقط **النقرات**
// — ونقطةُ الحرف نقرةٌ — فعاد أثرُ «ب» بجسمه بلا نقطته. **وصندوقُ الحبر بلا النقطة
// صندوقٌ آخر**: يتبدّل التوفيقُ في الحكم الثاني فيتبدّل الحكم (انحرافُ ١٨٦ بدل ١٠٧،
// و`wander` بدل القبول). فسقطت ثلاثةُ آثارٍ من أربعةَ عشر ولم تُجمَّد.
//
// **والحارسُ يمشي الطريقَ كلَّه لا يقرأ سطراً**: يدٌ تكتب على آلة المحاولة الحرّة
// (`createFreeRun` — عينُ ما يقوده اللوح)، ثم يُسلَك أثرُها **مسلكَ الميدان بعينه**:
// `d` نصّاً ← `fieldStrokes` ← دفترٌ ← `toCases` ← إعادةٌ على المحرّك. **فيلزم أن
// يعود الحكمُ هو هو** — وإلا فما يُجمَّد شاهدٌ كاذب. **ومجرَّبٌ سالباً**: يُعاد
// المرشِّحُ القديم (`> 1`) فتسقط النقرةُ **فينقلب الحكم** — فلو عاد العطبُ يوماً
// لَقُرئ هنا بعلّته.
console.log('\n— ١د) طريقُ الالتقاط: أثرٌ يُعاد على المحرّك فيطابق حكمَه ساعةَ الالتقاط —');
{
  const { toCases } = await import(new URL('./import_traces.mjs', import.meta.url));
  const ref = PATHS['ب'].isolated;      // جسمٌ ونقطةٌ — والنقطةُ نقرةٌ
  /** يدٌ تمشي المسارَ خطوةً خطوة (نظيرُ ما يفعله مولّدُ العدّة) — بلا رجفة. */
  const walk = (poly, step = 14) => {
    const out = [];
    for (let at = 0; at < poly.len; at += step) out.push(pen.pointAt(poly, at).at);
    out.push(poly.pts[poly.pts.length - 1]);
    return out.map((p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]);
  };
  const parts = pen.partsOf(ref);
  const body = walk(parts[0].poly);
  const tap = [parts[1].at];            // **نقرةٌ واحدة**: نزلَ الإصبعُ ورفعه مكانه
  const touches = [body, tap];

  // ١) حكمُ المحرّك ساعةَ الالتقاط — من الآلة التي يقودها اللوح
  const run = pen.createFreeRun(ref, {});
  const results = touches.map((t) => run.push(t));
  const live = results[results.length - 1];

  // ٢) ثم يُسلَك الأثرُ مسلكَ الميدان: حبرُ اللوح `d` نصّاً، ثم الدفترُ، ثم العدّة
  const inkD = touches.map((t) => t.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' '));
  const book = { items: [{ ch: 'ب', form: 'isolated', mode: 'free', kind: 'done',
    accepted: live.verdict.accepted, strokes: dev.fieldStrokes(inkD) }] };
  const cases = toCases(book);
  const back = cases[0] && pen.judgeFree(ref, cases[0].strokes);

  ok(cases.length === 1 && cases[0].strokes.length === 2 && cases[0].strokes[1].length === 1,
    `الأثرُ يعود بضربتيه **ومعهما النقرة** (${cases[0]?.strokes.map((s) => s.length).join(' + ') || 'لا شيء'} نقطة)`);
  ok(live.verdict.accepted && back?.accepted === live.verdict.accepted
    && (back?.primary || null) === (live.verdict.primary || null),
    `وحكمُ الإعادة عينُ حكمِ الالتقاط (${live.verdict.accepted ? 'قُبل' : live.verdict.primary} ⇒ `
    + `${back?.accepted ? 'قُبل' : back?.primary})`
    + ` — انحرافُ الالتقاط ${Math.round(live.verdict.metrics.maxLateral)} والإعادة ${
      Math.round(back?.metrics.maxLateral ?? -1)}`);

  // **مجرَّبٌ سالباً بالعطب نفسِه**: المرشِّحُ القديم يطرح النقرةَ فينقلب الحكم
  const lame = dev.fieldStrokes(inkD).filter((s) => s.length > 1);
  const lameBack = pen.judgeFree(ref, lame);
  ok(lame.length === 1 && !lameBack.accepted,
    `وبالمرشِّح القديم (\`> 1\`) تسقط النقرةُ **فينقلب الحكم** إلى «${lameBack.primary}»`
    + ` وانحرافُه ${Math.round(lameBack.metrics.maxLateral)} — وهو عطبُ الميدان بعينه`);
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
  // **والمقيسُ الاشتقاقُ لا صِغَرُ المادّة** (جلسة ك١): كان يُشترَط أن تكون أضيقُ
  // مادّةٍ دون الواحد — **وهو وصفُ حالٍ لا حدُّ محرّك**، سقط يومَ جلست الكلمةُ على
  // سطر الحروف بمقياسها (بند ص٢/ب): حروفُها فيها بحجمها في محطتها فنسبتُها واحد.
  // **والحكمُ الذي يحرسه هذا الباب** — أنّ مقاييسَ الإرشاد تُشتقّ من نسبة المادّة —
  // يُقاس على المادّة الحقيقية بأيّ نسبةٍ كانت، ويُجرَّب سالباً بالنسبة المصنوعة فوق.
  ok(scales.length > 0 && tight > 0
    && Math.abs(pen.guideOf({ tolerance: tight }).dot - pen.GUIDE.dot * tight) < 1e-9,
    `وأضيقُ مادّةٍ في الشجرة نسبتُها ${tight} — فنقطتُها ${(pen.GUIDE.dot * tight).toFixed(1)}`
    + ` لا ${pen.GUIDE.dot}`);
}

// ————— ٢. عدّةُ المعايرة: **الحكمان** يُثبَتان حالةً حالة —————
//
// 🔴 **ومنذ ن٢ حكمان لا حكم** (`ENGINE_RESCUE §٣`، حكمُ المالك ٢٠–٢١ أغسطس ٢٠٢٦):
//   · **القبولُ** بـ`judgeShape` — الحَكَمُ الكلّيّ على الحبر الناتج، وهو المقصودُ
//     بـ«يُقبَل/يُرَدّ» في هذا الباب وفي كل موضعٍ يُذكَر فيه القبول.
//   · **والطريقةُ** (بدايةً واتجاهاً وترتيباً) يقيسها الماشي — `expect.exact` — **وتُقاس
//     ولا يُردّ بها**، ومعها `expect.fault` أوّلُ شكواه بعينها.
// **فلا يُطالَب الماشي بعهد القبول ولا الشكلُ بعهد الطريقة** — وهذا عينُ ما كان يجعل
// كلَّ جلسةٍ تحارب حرّاساً يحرسون العهدَ القديم.

console.log('\n— ٢) عدّةُ المعايرة: مساراتٌ مسجّلة تُدخَل على الحكمين —');
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
// **وحالاتُ الميدان تسمّي حرفَها لا شكلاً في الملفّ** (`ch/form`): مسارُها في
// `app/js/paths.js` — «المسارُ يُسمّى ولا يُنسَخ» كما نصّ المستورِد. وكان هذا
// السطرُ يقرأ `refs` وحدَها فانفجر بأوّل أثرٍ حقيقيّ وصل (١٧ أغسطس ٢٠٢٦) —
// **بابٌ مفتوحٌ لم يمرّ به أحدٌ حتى مرّت به يدُ طفلة**.
const refOf = (item) => (item.ref.includes('/')
  ? PATHS[item.ref.split('/')[0]]?.[item.ref.split('/')[1]]
  : traces.refs[item.ref]);

const seen = new Map();
const seenShape = new Map();
/** آثارُ ميدانٍ وسمُها حكمُ الماشي القديم — تُقاس وتُطبع ولا يُحكَم بها على الشكل. */
const oldGuard = [];
/** حكمُ القبول المنتظَر: `shape` في المصنوع و`accept` في الميدانيّ (حكمُ العين). */
const wantShape = (item) => (typeof item.expect.shape === 'boolean'
  ? item.expect.shape : item.expect.accept);
for (const item of traces.cases) {
  // **وحالاتُ الطريق تُمشى لا تُحكَم دفعةً** (§٢ج أدناه): لمساتُها محاولاتٌ متعاقبة
  // على آلة الخطوة الحرّة، لا ضرباتُ محاولةٍ واحدة.
  if (item.expect.run) continue;
  // **ولكلِّ حالةٍ حَكَمُها المُعلَن**: الخطوةُ الحرّة تُحكَم بحكمها الثاني
  // (`judgeFree`، `METHOD.md §٥ب`) وما سواها بالأول — والحالةُ تقول بأيّهما تُقاس.
  const verdict = item.expect.free
    ? pen.judgeFree(refOf(item), item.strokes)
    : pen.judge(refOf(item), item.strokes);
  const shape = pen.judgeShape(refOf(item), item.strokes);
  seen.set(item.id, verdict);
  seenShape.set(item.id, shape);
  const m = verdict.metrics;
  const margin = `انحراف ${Math.round(m.maxLateral)}/${pen.TOLERANCE.lateral}`
    + ` · ارتداد ${Math.round(m.maxBack)}/${pen.TOLERANCE.back}`
    + ` · تغطية ${Math.round(m.coverage * 100)}٪`;
  const wanted = wantShape(item);
  // **والموسومُ `stale-reference` يُقاس ولا يُحكَم به** (بند ص٧، وحكمُ الإدارة ٣ في
  // مراجعة ص٦): أثرٌ من الميدان كُتب فوق **الخيال القديم** ثم صار مرجعُ حرفه أثرَ يد
  // المالك — **فمنتظَرُه قِيس على غير ما يُقاس عليه اليوم**. فيبقى في العدّة بوسمه
  // وعلّته وتاريخه، ويُطبع حكمُه اليوم بعينه، **ولا يُحمَّل المحرّكُ وزرَ مرجعٍ تبدّل**.
  // ويُستبدَل بأثرٍ جديد من ساحة الحصاد بعد النشر — وحينها يسقط الوسمُ من نفسه.
  if (item.stale) {
    console.log(`  ○ ${item.id}: موسومٌ \`stale-reference\` (${item.stale.since})`
      + ` — ${shape.ok ? 'يُقبَل' : `يُرفَض بـ«${shape.why}»`}`
      + ` والمنتظَرُ ${wanted ? 'قبولٌ' : 'ردٌّ'}: ${item.stale.why}`);
    continue;
  }
  /**
   * **والمطلوبُ أوّلُ خطأ لا وجودُه بين الأخطاء**: الشكوى تُسمّى بعينها، فلو رُفض
   * المسارُ لعلّةٍ أخرى ثم جاء المنتظَرُ صدىً لها لَمَرّ الفحصُ على خطأٍ في الحكم.
   * **وهي شكوى الماشي** — تُقاس ولا يُردّ بها.
   */
  /**
   * 🔴 **وأثرُ ميدانٍ وسمُه حكمُ المحرّك القديم لا حكمُ عين** (ن٢): `import_traces`
   * يكتب `expect.fault` **للردّ الذي ردّه الماشي وحدَه** — «العينُ تحكم ولا تسمّي
   * علّةَ محرّك». **فردٌّ ميدانيٌّ يحمل شكوى ماشٍ عهدُه على الماشي لا على الشكل**،
   * وإلّا حرس الحارسُ **العهدَ القديم** بعينه: يطالب الحَكَمَ الكلّيّ بأن يردّ ما
   * ردّه الماشي — وذاك سقفُ الأربعين في المئة الذي جاءت خطّةُ الإنقاذ لتكسره.
   * ⇐ **فيُقاس شكلُه ويُطبع ولا يُحكَم به**، ويُراجَع بعين المالك في ن٣.
   */
  const walkerOnly = item.origin === 'field' && wanted === false && Boolean(item.expect.fault);
  if (walkerOnly) {
    oldGuard.push({ item, shape, verdict });
    console.log(`  ○ ${item.id}: وسمُه **حكمُ الماشي القديم** (${item.expect.fault})`
      + ` — والماشي اليومَ ${verdict.exact ? 'يطابق' : `يخالف «${verdict.primary}»`}`
      + `، والحَكَمُ الكلّيّ ${shape.ok ? 'يقبله' : `يردّه «${shape.why}»`}`
      + ` (تغطية ${Math.round(shape.metrics.recall * 100)}٪ · دقّة ${
        Math.round(shape.metrics.precision * 100)}٪) — يُراجَع بعين المالك في ن٣`);
    // **وعهدُه أن يبقى مخالفاً للطريقة** — **واسمُ الشكوى لا يُحبَس** على أثرٍ تبدّل
    // مرجعُ حرفه (ص٦): اسمٌ يتبدّل على مرجعٍ تبدّل ليس انحدارَ محرّك، فيُطبع بالاسم.
    ok(!verdict.exact,
      `  وعهدُه على الماشي قائم: يخالف الطريقةَ${verdict.primary === item.expect.fault
        ? ` باسمها «${verdict.primary}»`
        : ` — واسمُ شكواه انتقل «${item.expect.fault}» ⇐ «${verdict.primary || 'حجمٌ يُرشَد إليه'}»`
          + ' على مرجعٍ تبدّل (ص٦)'}`);
    continue;
  }
  const exactWanted = item.expect.exact;
  const exactOk = typeof exactWanted !== 'boolean' || Boolean(verdict.exact) === exactWanted;
  const faultOk = exactWanted !== false || !item.expect.fault || verdict.primary === item.expect.fault;
  // **والحجمُ إرشادٌ يصحب الحكمَ ولا يردّ** — فيُطلَب في `guides` لا في الأسباب.
  const guideOk = !item.expect.guide || shape.guides.includes(item.expect.guide);
  ok(shape.ok === wanted && exactOk && faultOk && guideOk,
    `${item.id}: ${wanted ? 'يُقبَل شكلاً' : `يُرَدّ بـ«${shape.why}»`}`
    + ` · طريقتُه ${exactWanted === false ? 'تُقاس فتُخالف' : exactWanted ? 'تطابق' : '—'}`
    + ` — ${item.note}`
    + `\n      ${margin} · شكلٌ: تغطية ${Math.round(shape.metrics.recall * 100)}٪`
    + ` جزء ${Math.round(shape.metrics.part * 100)}٪ دقّة ${Math.round(shape.metrics.precision * 100)}٪`
    + `${shape.guides.length ? ` · إرشاد ${shape.guides.join('، ')}` : ''}`
    + `${shape.ok === wanted ? '' : ' ← حكمُ الشكل خالف المنتظَر'}`
    + `${exactOk ? '' : ` ← مطابقةُ الطريقة «${Boolean(verdict.exact)}» والمنتظَر «${exactWanted}»`}`
    + `${faultOk ? '' : ` ← أوّلُ شكوى الماشي «${verdict.primary}» والمنتظَر «${item.expect.fault}»`}`
    + `${guideOk ? '' : ` ← إرشادُه [${shape.guides}] ولا فيه «${item.expect.guide}»`}`);
}

// 🔴 **والمعكوسُ صار وجهين لا وجهاً** (حكمُ المالك ٢٠–٢١ أغسطس ٢٠٢٦): **شكلُه يُقبَل**
// — فحبرُه حبرُنا والحرفُ يُقرأ — **وطريقتُه تُرَدّ ولا تُشترى برقم**: تُضاعَف
// السماحةُ ثلاثاً فتبقى مخالفةً، لأن المخالَف فيها **الاتجاه** لا الدقّة.
const reversed = traces.cases.find((c) => c.id === 'reversed');
const loose = [1.5, 2, 3].map((factor) => pen.judge(refOf(reversed), reversed.strokes, { tolerance: factor }));
ok(seenShape.get('reversed').ok,
  'والمعكوسُ **يُقبَل شكلاً** — الطريقةُ تُدرَّس ولا تُشترَط (حكمُ المالك)');
ok(loose.every((v) => !v.exact),
  'ولا تطابق طريقتُه المثلى ولو ضوعفت السماحةُ ثلاثاً — المخالَفُ فيه الاتجاهُ لا الدقّة');
ok(loose.every((v) => v.primary === 'start-end' || v.primary === 'reverse'),
  `ويُسمّى خطؤه بعينه في الحالات الثلاث (${[...new Set(loose.map((v) => v.primary))].join('، ')})`);

// وسماحةُ المحطة تعمل: ما قُبل بالسماحة الافتراضية يُردّ إن شُدِّدت إلى الثلث
// (`METHOD.md §٣.٥`: «تتشدّد مع التقدّم») — فالسماحةُ مقبضٌ حقيقيّ لا حلية.
// **وهو عهدُ الماشي**: يقيس مطابقةَ الطريقة، فتُقاس عليه السماحةُ — أمّا القبولُ
// فبالشكل، ولا يُشَدّ بمقبضٍ في محطة.
const drift = traces.cases.find((c) => c.id === 'child-drift');
ok(pen.judge(refOf(drift), drift.strokes).exact
  && !pen.judge(refOf(drift), drift.strokes, { tolerance: 0.33 }).exact,
  'وسماحةُ المحطة مقبضٌ حقيقيّ في الماشي: انحرافٌ تطابق طريقتُه اليومَ تُخالف إذا شُدِّدت إلى الثلث');

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
// **وحكمُها الذي يُقاس هنا حكمُ الماشي** (`exact`) — فالطيّةُ صفةٌ في المسار يقيس
// بها الشرطُ الثاني، ولا أثرَ لها في الحَكَم الكلّيّ أصلاً.
ok(fold.length > 0 && wet.length === 2
  && fold.filter((c) => typeof c.expect.exact === 'boolean')
    .every((c) => Boolean(seen.get(c.id).exact) === c.expect.exact),
  `وحالاتُ الطيّة كلُّها على حكم طريقتها (${fold.length}): تتبّعاً وحُرّاً وقفزاً، **وعودةً على`
  + ` الأثر الرطب على ب/وسطي وب/نهائي** (${wet.length}/2)، ومعكوساتُها تُخالف الطريقة`);
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
// 🔴 **وشهادتُها اليومَ شقّان آخران** (ن٢): **يقبلها الحَكَمُ الكلّيّ** — وهو حَكَمُ
// القبول، وبه انحلّ بلاغُ الميدان من أصله لا بترقيع الماشي — **ويُري الماشي أنّ
// توفيقَ الصندوق يعمل**: طريقتُها تُخالف بالحكم الأول (الذي لا يوفّق) وتطابق بالثاني
// (الذي يوفّق) — ولا إحداثيَّ يتبدّل بينهما. فلو سقط التوفيقُ يوماً لَقُرئ هنا.
console.log('\n— ٢ب) الخطوةُ الحرّة: القبولُ بالشكل، والتوفيقُ يُري أثرَه في الماشي —');
{
  const field = traces.cases.filter((c) => c.expect.free);
  const shown = field.filter((c) => c.expect.strict === false);
  ok(shown.length >= 4, `حالاتُ بلاغ الميدان في العدّة (${field.length} منها ${shown.length} يفترق فيها الماشيان)`);
  const parted = [];
  for (const item of shown) {
    const strict = pen.judge(refOf(item), item.strokes);
    const loose = seen.get(item.id);
    const shape = seenShape.get(item.id);
    if (!strict.exact) parted.push(item.id);
    ok(shape.ok && loose.exact,
      `  «${item.id}»: **يقبلها الحَكَمُ الكلّيّ** (تغطية ${Math.round(shape.metrics.recall * 100)}٪)`
      + ` وتطابق طريقتُها بالتوفيق، وبلا توفيقٍ ${strict.exact ? '**تطابق أيضاً**' : `تُخالف «${strict.primary}»`}`
      + ` — مقياسُ التوفيق ${loose.scale.toFixed(2)}، وانحرافُها بعده ${
        Math.round(loose.metrics.maxLateral)}/${Math.round(pen.TOLERANCE.lateral * pen.FREE.ease)}`
      + `${shape.ok ? '' : ` ← رُدّت وهي مصيبة «${shape.why}»: بلاغُ الميدان ٢ يقع من جديد`}`
      + `${loose.exact ? '' : ' ← التوفيقُ لم يُنقذ طريقتَها'}`);
  }
  /**
   * 🔴 **وشاهدُ التوفيق يُعَدّ ولا يُدَّعى**: هذه الحالاتُ جُمِّدت على **نونٍ سابقة**،
   * ثم صار مرجعُ الحروف أثرَ يد المالك (بند ص٦) فتبدّل حبرُها — **فما عاد كلُّ تشويهٍ
   * منها يفترق فيه الماشيان**. فيُطبَع مَن يفترق فيه بالاسم، **ويُشترط شاهدٌ حيّ
   * واحدٌ على الأقل** فلا يخضرّ البابُ على أربعةٍ لا يفرّقن شيئاً.
   */
  ok(parted.length > 0,
    `وشاهدُ التوفيق حيٌّ في ${parted.length} من ${shown.length}: ${parted.join('، ') || 'لا أحد'}`
    + ' — والباقي جُمِّد على نونٍ تبدّل مرجعُها (ص٦) فلم يعد تشويهُه يبلغ سماحةَ الماشي');
  // **ولا تنقلب الرحمةُ تسييباً في الطريقة**: المخالَفُ فيها **الاتجاه** لا الدقّة،
  // فلا يفتحه كرمُ سماحة. (وأمّا الشكلُ فيُقبَل بحكم المالك — وذاك بابٌ آخر.)
  const noonBack = traces.cases.find((c) => c.id === 'noon-reversed');
  const wide = [1.5, 2, 3].map((f) => pen.judgeFree(refOf(noonBack), noonBack.strokes, { tolerance: f }));
  ok(wide.every((v) => !v.exact),
    'ونونٌ معكوسةٌ تُخالف الطريقةَ ولو ضوعفت سماحةُ الماشي ثلاثاً — الاتجاهُ مادّةٌ مدرَّسة');
  // **والمرآةُ التي تبدّل الشكلَ حقّاً تُرَدّ شكلاً**: كأسُ النون متناظرةٌ فمرآتُها
  // هي هي (وهي حقٌّ لا تسييب)، **والكافُ ليست كذلك** — فعليها يقع عهدُ المرآة.
  const mirror = traces.cases.find((c) => c.id === 'kaf-mirrored');
  const mirrorShape = pen.judgeShape(refOf(mirror), mirror.strokes);
  ok(!mirrorShape.ok,
    `ومرآةُ الكاف تُرَدّ **شكلاً** «${mirrorShape.why}» وهي تملأ صندوقَها`
    + ` (تغطية ${Math.round(mirrorShape.metrics.recall * 100)}٪) — التطبيعُ إزاحةٌ وتحجيمٌ **لا انعكاس**`);

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
  const smallShape = pen.judgeShape(refOf(small), small.strokes);
  const bigShape = pen.judgeShape(refOf(big), big.strokes);
  // 🔴 **والحجمُ صار إرشاداً يصحب القبولَ لا ردّاً** (ن٢): يُقال للطفل «اكتبه أكبر»
  // **وحبرُه يثبت** — فالحرفُ مقروءٌ وإن شذّ حجمُه.
  ok(smallShape.ok && smallShape.guides.includes(pen.SIZE.SMALL)
    && bigShape.ok && bigShape.guides.includes(pen.SIZE.BIG),
    'والحجمُ الشاذُّ **يُرشَد إليه بجملته ويُقبَل حبرُه**: '
    + `«${pen.SIZE_TEXT[pen.SIZE.SMALL]}» و«${pen.SIZE_TEXT[pen.SIZE.BIG]}» — لا ردٌّ ولا صمت`);
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

// ————— ٢د. سماحةُ الجزء الملحق: **العدّةُ تُعاد قبلَه وبعده ويُطبع الفرق** (جلسة ك) —————
//
// 🔴 **حكمُ المالك (١٧ أغسطس ٢٠٢٦)**: شولةُ الكاف «لم تنضبط» في يد الخامسة (أربع
// سقطاتٍ متتالية عليها وحدَها، `FIELD_TRIAL §٥`) — فتُخفَّف سماحتُها **معلَنةً في
// بيان الحرف**. **والتخفيفُ يُشترى بقياس لا بذوق** (بندُ جلسة ك ٣): تُعاد العدّةُ
// المجمَّدة كلُّها **بالإعلان وبنزعه** ويُطبع الفرقُ حالةً حالة — **وأيُّ قبولٍ كاذبٍ
// يظهر بسببه يُبطل التخفيف**.
//
// **وأداةُ القياس نزعُ الصفة** (نظيرُ `strip` في الطيّة): يُنزَع `ease` من المسار نفسِه
// فيرجع الحكمُ إلى ما كان قبل الحكم — فلا يُقارَن أخضرُ اليوم بذاكرةِ أمس.
console.log('\n— ٢د) سماحةُ الجزء الملحق: فرقُ العدّة قبلَه وبعده —');
{
  const bare = (ref) => ({
    ...ref,
    strokes: (ref.strokes || []).map(({ ease, ...rest }) => rest),   // eslint-disable-line no-unused-vars
  });
  const declared = traces.cases.filter((c) => refOf(c).strokes?.some((s) => s.ease > 1));
  // **وهذا بابُ الماشي وحدَه**: `ease` صفةُ ضربةٍ يقرؤها الشرطُ الثالث في التغطية،
  // **ولا يعرفها الحَكَمُ الكلّيّ أصلاً** — فالمقيسُ هنا مطابقةُ الطريقة لا القبول.
  const verdictOf = (item, ref) => (item.expect.free
    ? pen.judgeFree(ref, item.strokes) : pen.judge(ref, item.strokes));

  // ١) الفرقُ على العدّة كلِّها: مَن تبدّل حكمُه، ومَن لم يُمَسّ
  const moved = [];
  for (const item of traces.cases) {
    if (item.expect.run) continue;
    const after = verdictOf(item, refOf(item));
    const before = verdictOf(item, bare(refOf(item)));
    if (Boolean(before.exact) !== Boolean(after.exact)
      || (before.primary || null) !== (after.primary || null)) {
      moved.push({ item, before, after });
    }
  }
  console.log(`  عدّةُ المعايرة ${traces.cases.length} حالة، وفيها ${declared.length} على مسارٍ`
    + ` **يُعلِن سماحةَ جزء** — وتبدّل بالتخفيف ${moved.length} حكماً:`);
  for (const { item, before, after } of moved) {
    console.log(`    · ${item.id}: ${before.exact ? 'طابقت' : before.primary}`
      + ` ⇒ ${after.exact ? 'طابقت' : after.primary}`);
  }
  /**
   * **ولا قبولَ كاذبٌ جديد** — وهو نصُّ البند ٣: كلُّ حالةٍ **حكمُها المنتظَر ردٌّ**
   * تبقى مردودةً بعد التخفيف. **والوجهُ الموجب مستثنىً بإعلانه** (`expect.eased`):
   * حالةٌ جُمِّدت **لتُقبَل بالتخفيف** ليست قبولاً كاذباً بل هي عينُ المراد — ويُثبَت
   * أدناه أنّ قبولَها معلَّقٌ بالبيان (تُرَدّ `short` إن نُزع).
   */
  const opened = moved.filter(({ item, before, after }) =>
    !before.exact && after.exact && item.expect.exact === false);
  ok(opened.length === 0,
    `و**صفرُ مطابقةٍ كاذبةٍ جديدة** على العدّة المجمَّدة (${moved.length} حكماً تبدّل، كلُّه`
    + ` بإعلانٍ منتظَر)${
      opened.length ? ` — فُتح: ${opened.map((m) => m.item.id).join('، ')} ⇐ التخفيفُ باطل` : ''}`);

  // **والوجهُ الموجب: التخفيفُ يعمل، وقبولُه معلَّقٌ بالإعلان** (نظيرُ `fold-single-line`)
  const easedCases = traces.cases.filter((c) => c.expect.eased);
  ok(easedCases.length > 0, `وللتخفيف حالةٌ موجبةٌ مجمَّدة (${easedCases.length})`);
  for (const item of easedCases) {
    const on = verdictOf(item, refOf(item));
    const off = verdictOf(item, bare(refOf(item)));
    ok(on.exact && !off.exact && off.primary === pen.FAULTS.SHORT,
      `  «${item.id}»: تطابق طريقتُها بالإعلان${on.exact ? '' : ' ← خالفت! فالتخفيفُ حبرٌ لا يمسّ يداً'}`
      + ` وتُخالف بنزعه «${off.primary}» — فالسماحةُ صفةٌ في البيان لا رقمٌ عامّ`);
  }
  // **وما لا يُعلِن لا يتبدّل**: التخفيفُ صفةُ بيانٍ لا تسييبٌ عامّ.
  ok(moved.every(({ item }) => declared.includes(item)),
    'وما لم يُعلِن بيانُه شيئاً لم يتبدّل حكمُه — التخفيفُ صفةٌ في المسار لا رقمٌ عامّ');

  // ٢) **والأرضيّةُ معايرةٌ على الشاهد**: أعلى ردٍّ محقّ على الشولة، وهامشُ العتبة فوقه
  const KAF = PATHS['ك'].isolated;
  const parts = pen.partsOf(KAF);
  const tail = parts[parts.length - 1];
  const eased = pen.partCoverage(pen.TOLERANCE, tail.ease);
  const raw = 1 - (1 - pen.TOLERANCE.coverage) * tail.ease;
  /** تغطيةُ آخرِ جزءٍ في كتابةٍ ميدانية — تُقرأ من الحَكَم نفسِه لا تُدَّعى. */
  const tailCoverage = (item) => {
    const tol = pen.resolveTolerance(undefined);
    const fit = pen.fitFree(refOf(item), item.strokes, tol);
    const mapped = item.strokes.map((s) => s.map((p) => [
      fit.model.cx + (p[0] - fit.child.cx) / fit.s,
      fit.model.cy + (p[1] - fit.child.cy) / fit.s,
    ]));
    let best = 0;
    const trial = pen.createTrial(refOf(item), {
      tolerance: pen.easeTolerance(tol),
      onProgress: ({ part, progress }) => {
        if (part === parts.length - 1) best = Math.max(best, progress);
      },
    });
    for (const raw2 of mapped) {
      const pts = pen.simplify(raw2);
      if (!pts.length) continue;
      trial.down(pts[0][0], pts[0][1]);
      for (const p of pts.slice(1)) trial.move(p[0], p[1]);
      trial.up();
    }
    return best;
  };
  // **وتُقاس على الردود القِصَرية وحدَها**: هي التي تمسّها التغطية — أما المعكوسةُ
  // فرُدَّت بالاتجاه وتغطيتُها تامّة، فقياسُ الأرضيّة عليها قياسٌ على غير جنسها.
  const rejected = traces.cases.filter((c) => c.origin === 'field' && c.ref === 'ك/isolated'
    && c.expect.accept === false && c.expect.fault === 'short');
  // (وهي حالاتُ ميدانٍ يحمل وسمُها حكمَ المحرّك ساعةَ الالتقاط — `expect.accept`.)
  // **ولا حراسةَ على فراغ** (بلاغُ جلسة ص١، ١٨ أغسطس ٢٠٢٦): كان هذا السطرُ
  // `Math.max(...[])` = `-Infinity` **فيمرّ الشرطُ دائماً** بعد أن نسخ حكمُ المالك
  // (١٧ أغسطس، جلسة ك٢) حكمَي `field-015/016` إلى قبول — فذهبت المادّةُ وبقي الأخضر.
  // **فصار الشاهدُ يُشترَط**: إن وُجد ردٌّ قِصَريٌّ وافقته عينٌ فالأرضيّةُ فوقه،
  // **وإن غاب فالمقيسُ أنّ الأرضيّة هي رقمُ المالك بعينه** — والغيابُ يُطبع بعلّته
  // وتاريخها لا يُبتلَع صامتاً.
  const highest = rejected.length ? Math.max(...rejected.map(tailCoverage)) : null;
  console.log(`  الشولةُ: طولُها ${Math.round(tail.poly.len)} من ${Math.round(parts[0].poly.len)}`
    + ` فسماحتُها المعلَنة ×${tail.ease} — وعتبتُها ${(eased * 100).toFixed(0)}٪`
    + ` (التخفيفُ الهندسيُّ كاملاً ${(raw * 100).toFixed(1)}٪، محبوسٌ بأرضيّة ${
      (pen.EASE_FLOOR * 100).toFixed(0)}٪)`);
  ok(highest === null
    ? eased === pen.EASE_FLOOR && eased < pen.TOLERANCE.coverage
    : eased < pen.TOLERANCE.coverage && eased > highest,
  highest === null
    ? `وأرضيّتُها **رقمُ المالك بعينه** (${(pen.EASE_FLOOR * 100).toFixed(0)}٪ دون تغطية ${
      (pen.TOLERANCE.coverage * 100).toFixed(0)}٪) — **ولا ردَّ قِصَريّاً مجمَّداً يُقاس عليه**:`
      + ' نسخ حكمُ المالك (١٧ أغسطس ٢٠٢٦) حكمَي `field-015/016` إلى قبول، فالغيابُ بعلّته لا بإهمال'
    : `وأرضيّتُها **فوق أعلى ردٍّ محقّ في الميدان** (${(highest * 100).toFixed(2)}٪ في ${
      rejected.length} ردٍّ مجمَّد) بهامش ${((eased - highest) * 100).toFixed(2)} نقطة`
      + ' — فالتخفيفُ لا يشتري قبولاً كاذباً، والتخفيفُ الكاملُ يشتريه فهو محبوس');

  /**
   * **ودَينٌ مسمّى يُطبَع في كل تشغيلة**: التصنيفُ في عدّة التأليف يسري على مادّة
   * النسخ كما يسري على الحروف، **وبناءُ `word_paths.js` يحتاج العدّةَ في متصفّح**
   * (`make_paths.py --build`) — فلم يُعَد في هذه الجلسة. فشولةُ الكاف **داخل كلمة**
   * تبقى على عتبة الشكل (٨٨٪) حتى يُعاد البناء. ويُعَدّ هنا بالرقم لا بالذكر.
   */
  const words = await import(new URL('js/word_paths.js', APP));
  const owing = Object.values(words.WORD_PATHS).filter((ref) => {
    const lens = (ref.strokes || []).map((s) => pen.prepare(s.points).len);
    const longest = Math.max(...lens, 0);
    return lens.some((l, i) => i > 0 && l < longest * 0.5 && !ref.strokes[i].ease);
  }).length;
  console.log(`  ودَينٌ مسمّى: ${owing} من مادّة النسخ فيها جزءٌ ملحقٌ صغير **بلا إعلان**`
    + ' — تكسبه يومَ يُعاد بناء `word_paths.js` بعدّة التأليف (تحتاج متصفّحاً)');

  // ٣) **ولا يُفتَح بابُ الاتجاه** (ع٣ صفرٌ بحاله): يُجرَّب سالباً **على الكاف نفسِها**
  //    — معكوسةً، وشولتُها قبل جسمها، ومرآةً — **ولو ضوعفت سماحةُ جزئها ثلاثاً**.
  const negatives = traces.cases.filter((c) => c.ref === 'ك/isolated' && c.expect.direction);
  ok(negatives.length >= 3, `وللكاف ${negatives.length} حالةَ اتجاهٍ سالبة مجمَّدة (ع٣)`);
  for (const item of negatives) {
    const loud = { ...KAF, strokes: KAF.strokes.map((s) => (s.ease ? { ...s, ease: s.ease * 3 } : s)) };
    const now = verdictOf(item, refOf(item));
    const wild = pen.judgeFree(loud, item.strokes);
    ok(!now.exact && !wild.exact,
      `  «${item.id}»: تُخالف الطريقةَ «${now.primary}»${wild.exact ? ' ← طابقت بتثليث السماحة!' : ''}`
      + ` — ولو ثُلِّثت سماحةُ الجزء («${wild.primary}»)`);
  }
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
  const waited = steps.filter((r) => r === null).length;
  ok(run.done === item.expect.shape,
    `${item.id}: ${run.done ? 'يبلغ آخرَ الطريق' : 'لا يبلغه'} — ${item.note}`
    + `\n      ${item.strokes.length} لمسةً · انتُظر صامتاً ${waited} · استُؤنف ${restarts}`
    + ` · تعثّرات ${run.stumbles}`
    + `${run.done === item.expect.shape ? '' : ' ← الطريقُ خالف المنتظَر'}`);
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

// ————— ٢ه. سياسةُ الإطلاق: **قبولٌ · انتظارٌ صامت · ردٌّ قاطع** (جلسة ن٢) —————
//
// 🔴 **والعلّةُ أنّ الحكمَ يقع عند كلّ رفعِ قلم**: مَن كتب جسمَ الحرف ولمّا يتمّه
// **ليس مخطئاً** — فالردُّ عليه عقوبةٌ على أثناء العمل. **فثلاثةُ أحوالٍ لا رابع**:
//   · **قبولٌ** — يثبت الحبرُ ويُختَم الشكل، **ولو خالفت الطريقةُ طريقتَنا**.
//   · **انتظارٌ صامت** — نقصٌ يصلحه مزيدُ حبر (`pending`): يُحفَظ الحبرُ ولا يُقال شيء
//     **ولا يُعَدّ تعثّراً**.
//   · **ردٌّ قاطع** — ما لا يصلحه مزيدُ حبر (خربشةٌ · جهةٌ مقلوبة · علامةٌ زائدة):
//     يخفت حبرُ اللمسة ويومض الإرشادُ **ويُعَدّ تعثّراً**.
//
// **وتُقاس في الآلة نفسِها** (`createFreeRun` — عينُ ما يقوده اللوح) لا في وصفٍ مكتوب.
console.log('\n— ٢ه) سياسةُ الإطلاق في آلة الخطوة الحرّة: قبولٌ · انتظارٌ · ردّ —');
{
  const HHA = PATHS['ح'].isolated;      // بلا نقاط — فنصفُه يسقط بالتغطية وحدَها
  const NOON = PATHS['ن'].isolated;     // جسمٌ ونقطةٌ فوق
  const bodyOf = (ref) => pen.partsOf(ref).filter((q) => q.kind === 'stroke')
    .map((q) => q.poly.pts.map((r) => [r[0], r[1]]));
  const dotsOf2 = (ref) => pen.partsOf(ref).filter((q) => q.kind === 'dot')
    .flatMap((q) => Array.from({ length: q.count || 1 }, () => [q.at[0], q.at[1]]))
    .map((at) => [at, at, at]);
  /** نصفُ الجسم: يُرفَع القلمُ عند نصف **طوله** لا نصف عدد نقاطه. */
  const halfBody = (ref) => pen.partsOf(ref).filter((q) => q.kind === 'stroke').map((q) => {
    const out = [];
    for (let at = 0; at <= q.poly.len * 0.5; at += 8) out.push(pen.pointAt(q.poly, at).at);
    return out;
  });
  /** خربشةٌ في **فراغ** الحرف — لا فوق حبره: هي التي تقيسها الدقّة. */
  const scribble = (ref) => {
    const box = pen.inkBox([pen.refPoints(ref)]);
    const tol = pen.easeTolerance(pen.resolveTolerance(ref.tolerance)).lateral;
    const ink = pen.refPoints(ref);
    const far = (p) => !ink.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= tol);
    const teeth = [];
    for (let row = 0; row <= 34; row++) {
      const y = box.y0 + (box.h * row) / 34;
      for (let c = 0; c <= 34; c++) {
        const x = box.x0 + (box.w * (row % 2 ? 34 - c : c)) / 34;
        if (far([x, y])) teeth.push([x, y]);
      }
    }
    return teeth;
  };

  // ١) **معكوسٌ صحيحُ الشكل يُقبَل** — والطريقةُ تُقاس في حصيلته ولا يُردّ بها.
  {
    const run = pen.createFreeRun(NOON, {});
    const steps = [...bodyOf(NOON).map((b) => [...b].reverse()), ...dotsOf2(NOON)]
      .map((t) => run.push(t));
    const last = steps[steps.length - 1];
    ok(run.done && last?.ok && last.verdict.accepted,
      'معكوسُ الاتجاه صحيحُ الشكل **يُقبَل** — حكمُ المالك: الطريقةُ تُدرَّس ولا تُشترَط');
    ok(last && last.verdict.exact === false && last.verdict.codes.length > 0,
      `**وطريقتُه تُسجَّل قياساً**: مطابقةٌ ${last?.verdict.exact} وشكاوى الماشي`
      + ` [${last?.verdict.codes.join('، ')}] — تُقرأ ولا يُردّ بها`);
    ok(!last?.fault, 'ولا تُرفَع شكوى طريقةٍ خطأً إلى الشاشة — فلا تُحسَب على الطفل');
  }

  // ٢) **نصفُ حرفٍ يُنتظَر بصمت** — لا يُقبَل ولا يُنهَر، ولا يُعَدّ تعثّراً.
  {
    const run = pen.createFreeRun(HHA, {});
    const half = run.push(halfBody(HHA)[0]);
    const shape = pen.judgeShape(HHA, halfBody(HHA));
    ok(half === null && !run.done && run.stumbles === 0,
      `نصفُ «ح» **يُنتظَر بصمتاً**: لا حكمَ يُرفَع (\`${half}\`) ولا تعثّرَ يُعَدّ`
      + ` (${run.stumbles}) — وسببُه «${shape.why}» و\`pending\` ${shape.pending}`);
    // ثم يُتمّه فيُقبَل — فالانتظارُ انتظارٌ لا رفضٌ صامت
    const rest = run.push(bodyOf(HHA)[0]);
    ok(rest?.ok && run.done, 'ثم يُتمّه فيُقبَل — فالانتظارُ انتظارٌ، والحبرُ محفوظ');
  }

  // ٣) **حدُّ القواعد الهندسية — يُقال باسمه لا يُموَّه** (عيادةُ ٢٢ أغسطس):
  {
    // (أ) **الخربشةُ البعيدةُ تُرَدّ عبر الآلة** — سدُّ البُعد المتوسّط، وشاهدُه
    // هجومُ المالك الحيُّ المجمَّد (fixtures/clinic-attack-meem.json):
    const atk = JSON.parse(readFileSync(new URL('fixtures/clinic-attack-meem.json', import.meta.url), 'utf8'));
    const MEEM_I = PATHS['م'].initial;
    const runA = pen.createFreeRun(MEEM_I, {});
    let last = null;
    for (const st of atk.strokes) last = runA.push(st);
    // 🔴 وهجومُ المالك المجمَّدُ **يُقبَل اليومَ** — عينُ دَين البنية: شتاتٌ
    // يحاذيه التطبيعُ فيراه الإشغالُ حرفاً. يغلقه م٩، وسدُّ البُعد نائمٌ حتى
    // معايرة ن٣ (هامشُ الماوس شعرة). إن انقلب أحمرَ فقد أُغلق الدَّين — حدِّث.
    ok(pen.judgeShape(MEEM_I, atk.strokes).ok === true,
      '🔴 دَينُ البنية (١): هجومُ المالك المجمَّد يُقبَل — يغلقه م٩');

    // (ب) 🔴 **ودَينُ البنية يُعَدّ بالاسم** (حكمُ المالك: «شكلُ الحرف لا يعتمد
    // عليه؟»): خربشةٌ كثيفةٌ تملأ ممرَّ الحرف **تُقبَل** — فالحَكَمُ إشغاليٌّ لا
    // يعرف الانحناء. **يغلقه بابُ البنية (م٩/م٠)** — وإن انقلب هذا السطرُ أحمرَ
    // فقد أُغلق الدَّينُ: حدِّث الحارسَ إلى عهده الجديد ولا تُعِد الدَّينَ خلسة.
    const bx = pen.inkBox([pen.refPoints(HHA)]);
    const dense = [];
    for (let i = 0; i < 160; i++)
      dense.push([bx.x0 + (i % 16) * (bx.w / 16), bx.y0 + ((i / 16) | 0) * (bx.h / 10) + ((i % 2) ? 40 : -40)]);
    ok(pen.judgeShape(HHA, [dense]).ok === true,
      '🔴 دَينُ البنية قائمٌ معلَن: خربشةٌ كثيفةٌ داخل الممرّ تُقبَل — يغلقه م٩');

    // (ج) 🔴 **ودَينُ النقطة الموضعيّة** (معايرةُ ليلة العيادة): نقرةٌ في الركن
    // **الأعلى** تُحسَب نقطةَ النون — فهُويّةُ النقطة عندنا موضعٌ لا شكل،
    // وسحابةُ الميدان الشرعيّة تبلغ ٣٩٢ (ث/نهائي) والنقرةُ على ٢٩٤ داخلَها،
    // **فلا سقفَ مسافةٍ يفصلهما** ولا يفصلهما إلا حَكَمُ البنية. يغلقه م٩ —
    // وانقلابُه أحمرَ إغلاقُ الدَّين: حدِّث الحارسَ ولا تُعِده خلسة.
    ok(pen.judgeShape(NOON, [bodyOf(NOON)[0], [[8, 8], [8, 8]]]).ok === true,
      '🔴 دَينُ البنية (٣): نقرةُ الركن الأعلى تُقرأ نقطةَ النون — يغلقه م٩');
  }

  // ٤) **واستئنافُ الشكل يطوي ما قبله**: مَن كتب شكلاً فانتُظر، ثم كتب الصحيحَ.
  {
    const run = pen.createFreeRun(NOON, {});
    run.push(halfBody(NOON)[0]);                 // نصفٌ — يُنتظَر صامتاً
    run.push(bodyOf(NOON)[0]);                   // ثم الجسمُ كاملاً
    const end = run.push(dotsOf2(NOON)[0]);      // ثم نقطتُه
    ok(run.done && end?.ok,
      `ومَن كتب نصفاً ثم أعاد الشكلَ كاملاً يبلغ آخرَ الطريق (استُؤنف ${end?.restarted})`
      + ` — ولا يُحاسَب بما طواه`);
    /**
     * 🔴 **ولا صمتَ لا يُخرَج منه** (صيدُ `test_measure` في ن٢): حبرٌ شاردٌ **بعيدٌ
     * عن الصندوق** يُفسِد التطبيعَ فتنهار التغطيةُ ⇒ `pending` أبداً — **فيبقى
     * الطفلُ في صمتٍ** ولو أعاد الشكلَ صحيحاً، **ولا يبلغ المخرجَ الكريم** لأنّ
     * الانتظارَ ليس تعثّراً. فيُسأل الذيلُ قبل الانتظار.
     *
     * **والشاردةُ سفليّةٌ عمداً** (معايرةُ ليلة العيادة): الركنُ **الأعلى** صار
     * يُقرأ نقطةَ النون — فزواجُ الميدان الشرعيّ يبلغ ٣٩٢ (ث/نهائي) والنقرةُ
     * على ٢٩٤ **داخلَ سحابته** — وذلك دَينُ البنية (٣) أدناه. أمّا السفليّةُ
     * فيصدّها حكمُ الجهة الحقيقيّ، فيبقى هذا الشاهدُ شاهدَ بابِ الاستئناف وحدَه.
     */
    const stuck = pen.createFreeRun(NOON, {});
    stuck.push(bodyOf(NOON)[0]);
    stuck.push([[8, 1016], [8, 1016]]);          // حبرٌ شاردٌ في أسفل اللوح
    bodyOf(NOON).forEach((b) => stuck.push(b));
    const out = stuck.push(dotsOf2(NOON)[0]);
    ok(stuck.done && out?.ok && out.restarted,
      'وحبرٌ شاردٌ بعيدٌ لا يحبس الطفلَ في صمت: يُعيد الشكلَ فيُطوى ما قبله ويُقبَل');
  }

  // ٥) 🔴 **ومادّةٌ لا جسمَ لها: نقرةُ الصفر** — استثناءٌ بنيويٌّ مُعلَن في المحرّك.
  //    **وعلّتُه مقيسة**: `judgeShape` يوفّق مركزَ حبر الطفل على مركز النموذج،
  //    **فموضعُ النقرة الوحيدة يُمحى قبل أن يُقاس**، وتُقاس دقّتُها إلى جسمٍ لا وجودَ
  //    له فتخرج صفراً ⇒ `stray-ink` **في أشكاله الأربعة**، فلا تُعبَر محطتُه أبداً.
  {
    const ZERO = PATHS['٠'].isolated;
    const at = ZERO.dots[0].at;
    const far = [at[0] + pen.TOLERANCE.dot * 2, at[1]];
    const bare = pen.judgeShape(ZERO, [[at, at, at]]);
    const hit = pen.createFreeRun(ZERO, {});
    const near = hit.push([at, at, at]);
    const away = pen.createFreeRun(ZERO, {});
    const off = away.push([far, far, far]);
    ok(!bare.ok, `والحَكَمُ الكلّيّ لا يصلح لها بنيةً: نقرةٌ في موضعها يردّها «${bare.why}»`
      + ` (دقّةٌ ${Math.round(bare.metrics.precision * 100)}٪ إلى جسمٍ لا وجودَ له)`);
    ok(near?.ok && hit.done,
      'فتُحكَم بموضعها في الآلة (`bodyless`) — والنقرةُ في موضعها **تُقبَل** فتُعبَر محطةُ الصفر');
    ok(off && !off.ok && !away.done,
      `وبعيداً عن موضعها **تُرَدّ** «${off?.fault?.code}» — فالاستثناءُ لا يفتح باباً`);
    // **والاستثناءُ يُقرأ من المادّة لا من اسمٍ مكتوب** — فلا يشيخ بمادّةٍ تُضاف
    ok(/const bodyless = !parts\.some\(\(part\) => part\.kind === 'stroke'\)/.test(penCode),
      'وهو مقروءٌ من بنية المادّة لا من قائمة أسماء — فمادّةٌ جديدةٌ بلا جسمٍ تدخله من نفسها');
  }

  // ٦) **ولا حكمَ يُرفَع بلا اسمٍ معلَن**: كلُّ سببٍ من `judgeShape` له نصٌّ في اللوحة.
  {
    const reasons = ['body-coverage', 'part-missing', 'stray-ink', 'no-marks',
      'dots-count', 'dots-side', 'dots-span'];
    const nameless = reasons.filter((code) => !pen.FAULT_TEXT[code]);
    ok(nameless.length === 0,
      `ولأسباب الحَكَم الكلّيّ السبعة نصوصُها في \`FAULT_TEXT\` — فلا يسقط سببٌ من`
      + ` لوحة وليّ الأمر صامتاً${nameless.length ? ` (بلا نصّ: ${nameless.join('، ')})` : ''}`);
    ok(reasons.every((code) => Object.values(pen.FAULTS).includes(code)),
      'وكلُّها معلَنةٌ في `FAULTS` — «رمزٌ لا يعرفه `FAULT_TEXT` لا يُخترع له نصّ» (`parent.js`)');
  }
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
const accepted = traces.cases.filter((c) => wantShape(c) && !c.expect.run);
ok(accepted.length >= 3 && accepted.every((c) => seenShape.get(c.id).ok),
  `وثلاثُ كتاباتٍ سليمةٍ على الأقل يقبلها **الحَكَمُ الكلّيّ** — ومنها الرجفةُ الخفيفة`
  + ` (${accepted.length} حالة)`);
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
