// **حارسُ الانحدار على الآثار** — يصل المادّتين بالحكم (جلسة ص١، ١٨ أغسطس ٢٠٢٦):
//   node tools/test_regression.mjs                      # القياسُ والفرقُ عن الأساس
//   node tools/test_regression.mjs --save               # يثبّت الحالَ أساساً للمقارنة
//   node tools/test_regression.mjs --factor 0.8         # تجربةٌ بسماحةٍ مضروبة — بلا مسِّ pen.js
//   node tools/test_regression.mjs --baseline <ملف>     # أساسٌ آخر
//
// ————— لماذا حارسٌ ثالث والعدّةُ تُفحَص في `test_pen.mjs` —————
//
// عندنا مادّتان ولا وصلَ بينهما وبين الحكم: **آثارُ يدٍ حقيقية** في
// `tools/field_traces/*.json` (دفترُ الميدان كما خرج من الجهاز)، و**عدّةُ المعايرة**
// في `tools/pen_traces.json` (تشويهاتٌ مصنوعةٌ تُثبت الحكمَ سالباً، ومعها ما جُمِّد
// من الميدان). و`test_pen.mjs` يسأل: **أحكمَ المحرّكُ كما وُعِد؟** — نعم أو لا.
// وهذا يسأل سؤالاً آخر: **ماذا فعل تعديلُ السماحة بالمادّة كلِّها؟**
//
//   · **كم أثراً إنسانيّاً صحيحاً قُبل** (وكم رُدّ ظلماً)،
//   · **وكم تشويهاً مصنوعاً رُدّ** (وكم قُبل كذباً)،
//   · **وأيُّ حالةٍ تبدّل حكمُها — بالاسم** (قبل/بعد، وبأيّ شكوى).
//
// **فيصير التحسينُ مقيساً لا محسوساً** (حكمُ مدير المجموعة، `2026-08-18-engine-suggestion-rulings.md §١/أ`:
// «وهو الذي يُذهب القلق، لا رقمٌ أفضل»).
//
// ⚠ **وهذه عدّةُ قياسٍ لا معايرة**: لا تُكتب فيها عتبةٌ ولا تُحرَّك — **كلُّ رقمٍ
// يُقرأ من `app/js/pen.js` ساعةَ التشغيل**، وما في هذا الملفّ من أرقامٍ مسارُ ملفٍّ
// أو عرضُ عمود. ومَن أراد أن يرى أثرَ رقمٍ آخر **لا يعدّل شيئاً**: `--factor` تُجري
// القياسَ كلَّه بسماحةٍ مضروبة وتطبع الفرقَ حالةً حالة، ثم لا يبقى منها أثر.
//
// **وسنّةُ جلسة ك**: أيُّ **قبولٍ كاذبٍ جديد** يُبطل التعديل — يحمرّ هنا باسم حالته،
// ولا يُشترى قبولُ أثرٍ صحيحٍ بقبول تشويه.

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { toCases } from './import_traces.mjs';

const APP = new URL('../app/', import.meta.url);
const HERE = new URL('./', import.meta.url);
const FIELD_DIR = new URL('./field_traces/', import.meta.url);

const pen = await import(new URL('js/pen.js', APP));
const { PATHS } = await import(new URL('js/paths.js', APP));
const traces = JSON.parse(readFileSync(new URL('./pen_traces.json', HERE), 'utf8'));

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name, fallback = null) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);

const BASE_PATH = value('--baseline', fileURLToPath(new URL('./regression_baseline.json', HERE)));
/** عاملُ تجربةٍ لا يمسّ ملفّاً — يُضرب في السماحة كلِّها كما يضربه `resolveTolerance`. */
const FACTOR = Number(value('--factor', '')) || null;

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

// ————— جمعُ المادّة: العدّةُ المجمَّدة + خامُ الميدان الذي لم يُجمَّد —————
//
// **والمجمَّدُ هو الحَكَم**: حالاتُ `pen_traces.json` تحمل **الحكمَ المنتظَر** كما
// استقرّ (وفيه أحكامُ عينٍ وأحكامُ مالكٍ نُسخت بها أحكامٌ أقدم — شولةُ الكاف مثلاً)،
// فلا يُعاد اشتقاقُها من الخام. **والخامُ الباقي لا يُهمَل صامتاً**: يُشتقّ بمستورِده
// نفسِه (`toCases` — اشتقاقٌ واحدٌ لا نسخةٌ ثانية) ويُقاس ويُعلَن أنه غيرُ مجمَّد،
// فيُرى أثرُ كلِّ تعديلٍ على **ثمانية عشر أثراً حقيقياً** لا على ما جُمِّد منها وحدَه.

// ————— **الشاهدُ يشيخ بتبدّل مرجعه** — وسمُ `stale-reference` (بند ص٧) —————
//
// أثرٌ من الميدان كُتب فوق **الخيال القديم**، ثم صار مرجعُ الحرف **أثرَ يد المالك**
// (بند ص٦): فحكمُه اليومَ **قياسٌ على غير ما رُسم عليه** — لا حكمٌ على المحرّك.
// **فيُوسَم في `pen_traces.json` بتاريخه وعلّته، ويخرج من المقابلة ولا يُمحى**
// (حكمُ الإدارة ٣ في مراجعة ص٦: «تُوسَم ولا تُحذَف ولا تُبتلَع»): يُقاس ويُطبع حكمُه
// اليوم في سطرٍ باسمه، ولا يُحسب ردّاً كاذباً جديداً على تعديلٍ لم يفعله.
// **وصنفُ العطب يُقيَّد للعائلة**: «حارسٌ يقيس ما لم يعد المرجعُ إياه».
const staleOf = (c) => c.stale || null;

const kitCases = traces.cases
  // **وحالاتُ الطريق تُمشى لا تُحكَم دفعةً** — آلتُها `createFreeRun`، وموضعُها
  // `test_pen.mjs §٢ج`. تُستثنى هنا **معدودةً معلَنة** لا صامتة.
  .filter((c) => !c.expect.run)
  .map((c) => ({ ...c, frozen: true, book: 'pen_traces.json', stale: staleOf(c) }));

const walked = traces.cases.filter((c) => c.expect.run).map((c) => c.id);
const known = new Set(traces.cases.map((c) => c.id));

const rawCases = [];
const books = existsSync(FIELD_DIR) ? readdirSync(FIELD_DIR).filter((f) => f.endsWith('.json')).sort() : [];
for (const file of books) {
  const book = JSON.parse(readFileSync(new URL(file, FIELD_DIR), 'utf8'));
  for (const c of toCases(book)) {
    if (known.has(c.id)) continue;
    rawCases.push({ ...c, frozen: false, book: `field_traces/${file}` });
  }
}

const all = [...kitCases, ...rawCases];
const refOf = (c) => (c.ref.includes('/')
  ? PATHS[c.ref.split('/')[0]]?.[c.ref.split('/')[1]]
  : traces.refs[c.ref]);

/**
 * ————— 🔴 **حكمان لا حكم** (جلسة ن٢، `ENGINE_RESCUE §٣`) —————
 *
 * **القبولُ** بـ`judgeShape` الكلّيّ — وهو ما تعنيه هذه العدّةُ بـ«قُبل/رُدّ».
 * **والطريقةُ** يقيسها الماشي (`exact` وشكواه) — **تُقاس ولا يُردّ بها**. فيُقيَّد
 * الحكمان معاً في الأساس، فيُرى أثرُ أيّ تعديلٍ على كلٍّ منهما بعينه.
 */
const verdictOf = (c) => {
  const options = FACTOR ? { tolerance: FACTOR } : {};
  return c.expect.free
    ? pen.judgeFree(refOf(c), c.strokes, options)
    : pen.judge(refOf(c), c.strokes, options);
};
const shapeOf = (c) => pen.judgeShape(refOf(c), c.strokes, FACTOR ? { tolerance: FACTOR } : {});
/** حكمُ القبول المنتظَر: `shape` في المصنوع، و`accept` في الميدانيّ (وسمُه يومَ التُقط). */
const wantShape = (c) => (typeof c.expect.shape === 'boolean' ? c.expect.shape : c.expect.accept);
/**
 * 🔴 **وردٌّ ميدانيٌّ يحمل شكوى ماشٍ عهدُه على الماشي لا على الشكل** (`test_pen §٢`):
 * `import_traces` لا يكتب `expect.fault` إلا لِما ردّه **المحرّكُ القديم** — «العينُ
 * تحكم ولا تسمّي علّةَ محرّك». فمطالبةُ الحَكَم الكلّيّ بأن يردّ ما ردّه الماشي
 * **حراسةٌ للعهد القديم** بعينها. ⇐ يُقاس ويُطبع ولا يُحكَم به، ويُراجَع في ن٣.
 */
const walkerOnly = (c) => c.origin === 'field' && wantShape(c) === false && Boolean(c.expect.fault);

// ————— الأرقامُ تُقرأ من المحرّك، ولا يُكتب منها رقمٌ هنا —————
//
// **وهذا عينُ ما كشفه تشخيصُ §١/د** (`docs/FIELD_TRIAL.md §٦`): الحكمُ في الوضع
// الحرّ يجري بسماحةٍ **مكرَّمة** (`FREE.ease`)، فالحدُّ العامل غيرُ السماحة الأساس —
// ومَن قرأ الأساسَ وحدَه رأى تجاوزاً حيث لا تجاوز. فيُطبعان معاً في كل تشغيلة.
const BASE_TOL = pen.resolveTolerance(FACTOR || undefined);
const FREE_TOL = pen.easeTolerance(BASE_TOL);
/** حدُّ الانحراف الذي حُكم به على هذه الحالة بعينها — لا الأساسُ إن كانت حرّة. */
const limitOf = (c) => (c.expect.free ? FREE_TOL.lateral : BASE_TOL.lateral);

console.log('\n— حارسُ الانحدار على الآثار —');
console.log(`  الأرقامُ من \`app/js/pen.js\`${FACTOR ? ` مضروبةً بعامل التجربة ×${FACTOR}` : ''}:`
  + ` انحرافٌ ${BASE_TOL.lateral.toFixed(1)}`
  + ` · تكريمُ الحرّ ×${pen.FREE.ease} فالحدُّ العامل ${FREE_TOL.lateral.toFixed(1)}`
  + ` · ارتدادٌ ${BASE_TOL.back.toFixed(1)} · بدايةٌ ${BASE_TOL.start.toFixed(1)}`
  + ` · نقطةٌ ${BASE_TOL.dot.toFixed(1)} · تغطيةٌ ${(BASE_TOL.coverage * 100).toFixed(0)}٪`
  + ` · أرضيّةُ التخفيف ${(pen.EASE_FLOOR * 100).toFixed(0)}٪`);
if (FACTOR) console.log('  (تجربةٌ في الذاكرة — لم يُمَسّ في `pen.js` حرف، ولا يُحكَم بها حمرةٌ ولا خُضرة)');

// ————— ١) الحكمُ على المادّة كلِّها —————

const rows = all.map((c) => {
  const verdict = verdictOf(c);
  const shape = shapeOf(c);
  return {
    id: c.id,
    origin: c.origin === 'field' ? 'field' : 'synthetic',
    frozen: c.frozen,
    stale: c.stale || null,
    book: c.book,
    note: c.note,
    wanted: Boolean(wantShape(c)),
    wantedExact: typeof c.expect.exact === 'boolean' ? c.expect.exact : null,
    wantedFault: c.expect.fault || null,
    walkerOnly: walkerOnly(c),
    accepted: shape.ok,
    why: shape.why || null,
    pending: shape.pending,
    recall: Math.round(shape.metrics.recall * 100),
    precision: Math.round(shape.metrics.precision * 100),
    exact: Boolean(verdict.exact),
    primary: verdict.primary || null,
    size: verdict.size || null,
    limit: limitOf(c),
    maxLateral: Math.round(verdict.metrics.maxLateral),
    coverage: Math.round(verdict.metrics.coverage * 100),
    // **المطابقةُ حكمٌ وشكوى**: قبولٌ صحيحٌ بشكوى غير المنتظَرة ليس مطابقة
    // (نصُّ `test_pen.mjs`: «المطلوبُ أوّلُ خطأ لا وجودُه بين الأخطاء»).
    get match() {
      if (this.walkerOnly) return !this.exact;       // عهدُه على الماشي وحدَه
      return this.accepted === this.wanted
        && (this.wantedExact === null || this.exact === this.wantedExact);
    },
  };
});

const human = rows.filter((r) => r.origin === 'field');
const made = rows.filter((r) => r.origin === 'synthetic');
const count = (list, wanted, got) => list.filter((r) => r.wanted === wanted && r.accepted === got).length;
const of = (list, wanted) => list.filter((r) => r.wanted === wanted).length;

console.log(`\n— ١) المادّة: ${rows.length} حالةً — ${human.length} أثراً إنسانياً`
  + ` (${human.filter((r) => r.frozen).length} مجمَّدةً في العدّة و${human.filter((r) => !r.frozen).length} خاماً)`
  + ` و${made.length} حالةً مصنوعة${walked.length ? ` · وحالاتُ الطريق (${walked.length}) تُمشى لا تُحكَم دفعةً (${walked.join('، ')}) — موضعُها test_pen §٢ج` : ''} —`);

// **والمجمَّدُ يُفرَد عن الخام في الحصيلة**: الخامُ فيه أثرٌ عاد من الالتقاط ناقصَ
// نقطته (عطبُ `FIELD_TRIAL §٥`)، فخلطُه بالشاهد يُنقص الرقمَ بعيبِ عدّةٍ لا بعيبِ
// حكم. ويُعَدّ ولا يُطرَح — فيوم يُصلَح الالتقاطُ يُجمَّد ويرتفع إلى سطره.
// **والموسومُ يُفرَد كما يُفرَد الخام**: يُقاس ويُعَدّ ويُطبع، ولا يدخل حصيلةَ
// الشاهد — فمرجعُه ليس المرجعَ الذي يُحكَم به اليوم.
const frozenHuman = human.filter((r) => r.frozen && !r.stale);
const staleRows = rows.filter((r) => r.stale);
const rawHuman = human.filter((r) => !r.frozen);

console.log('\n  الحصيلة — المجمَّدُ في العدّة (وهو الشاهد):');
console.log(`  · **أثرٌ إنسانيّ صحيحٌ قُبل: ${count(frozenHuman, true, true)} من ${of(frozenHuman, true)}**`
  + ` (ورُدّ ظلماً ${count(frozenHuman, true, false)})`);
console.log(`  · **تشويهٌ مصنوعٌ رُدّ: ${count(made, false, false)} من ${of(made, false)}**`
  + ` (وقُبل كذباً ${count(made, false, true)})`);
console.log(`  · وأثرٌ إنسانيّ خاطئٌ رُدّ: ${count(frozenHuman, false, false)} من ${of(frozenHuman, false)}`
  + ` · وكتابةٌ مصنوعةٌ صحيحةٌ قُبلت: ${count(made, true, true)} من ${of(made, true)}`);
// 🔴 **ومنها ما وسمُه حكمُ الماشي القديم** — لا حكمُ عين: يُقاس ويُطبع ولا يُحكَم به
// (`walkerOnly` أعلاه)، ويُراجَع بعين المالك في ن٣ كما نصّت خطّةُ الإنقاذ.
const oldMarked = rows.filter((r) => r.walkerOnly);
if (oldMarked.length) {
  console.log(`  · ومنها ${oldMarked.length} وسمُها **حكمُ الماشي القديم** (لا عينُ إنسان):`
    + ` ${oldMarked.map((r) => `${r.id} ⇐ ${r.accepted ? 'يقبله الشكل' : `يردّه «${r.why}»`}`
      + `، والماشي ${r.exact ? 'يطابق' : `«${r.primary}»`}`).join(' · ')}`
    + ' — عهدُها على الماشي، وتُراجَع بعين المالك في ن٣');
}
if (rawHuman.length) {
  console.log(`  · والخامُ الذي لم يُجمَّد (${rawHuman.length} من الآثار، ${books.join('، ')}):`
    + ` صحيحٌ قُبل ${count(rawHuman, true, true)} من ${of(rawHuman, true)}`
    + ` · وخاطئٌ رُدّ ${count(rawHuman, false, false)} من ${of(rawHuman, false)}`
    + ' — يُقاس ويُتتبَّع ولا يُحتجّ به (عطبُ الالتقاط، `FIELD_TRIAL §٥`)');
}

if (staleRows.length) {
  console.log(`\n  والموسومُ \`stale-reference\` (${staleRows.length}) — يُقاس ويُطبع ولا يُحكَم به:`);
  for (const r of staleRows) {
    console.log(`  · ${r.id}: المنتظَرُ ${r.wanted ? 'قبولٌ' : 'ردٌّ'}`
      + ` والواقعُ ${r.accepted ? 'قبولٌ' : `ردٌّ بـ«${r.why}»`}`
      + ` (شكلٌ ${r.recall}٪/${r.precision}٪ · وطريقتُه ${r.exact ? 'مطابقة' : `«${r.primary}»`})`
      + ` — ${r.stale.why}`);
  }
  console.log(`  ⇐ وبديلُها: ${staleRows[0].stale.replacedBy}`);
}

const missed = rows.filter((r) => !r.match && !r.stale);
if (missed.length) {
  console.log(`\n  وما خالف المنتظَر (${missed.length}) — بالاسم:`);
  for (const r of missed) {
    console.log(`  · ${r.id}${r.frozen ? '' : ' [خامٌ لم يُجمَّد]'}: المنتظَرُ `
      + `${r.wanted ? 'قبولٌ' : 'ردٌّ'}${r.wantedExact === null ? '' : ` وطريقةٌ ${
        r.wantedExact ? 'مطابقة' : 'مخالفة'}`}`
      + ` والواقعُ ${r.accepted ? 'قبولٌ' : `ردٌّ بـ«${r.why}»`}`
      + ` وطريقتُه ${r.exact ? 'مطابقة' : `«${r.primary}»`}`
      + ` (شكلٌ ${r.recall}٪/${r.precision}٪ · انحراف ${r.maxLateral}/${Math.round(r.limit)})`);
  }
}

// **والهامشُ يُطبع لا يُستنتَج**: كم بقي بين أقصى انحراف كلِّ مقبولٍ وحدِّه العامل؟
// (تشخيصُ §٦: «أربعةٌ من عشرٍ فوق ٨٠٪ من الحدّ العامل — فمعايرةُ السماحة حاجةٌ مقيسة»).
const acceptedHuman = human.filter((r) => r.accepted && !r.stale).map((r) => ({ ...r, pct: (r.maxLateral / r.limit) * 100 }));
acceptedHuman.sort((a, b) => b.pct - a.pct);
if (acceptedHuman.length) {
  const tight = acceptedHuman.filter((r) => r.pct >= 80).length;
  console.log(`\n  وهوامشُ **الماشي** في الآثار الإنسانية المقبولة شكلاً — ${tight} من ${acceptedHuman.length}`
    + ' فوق ٨٠٪ من حدّ الانحراف العامل. **وهي قياسُ طريقةٍ لا سببُ ردّ** منذ ن٢:');
  for (const r of acceptedHuman.slice(0, 5)) {
    console.log(`  · ${r.id}: ${r.maxLateral} من ${Math.round(r.limit)} = ${r.pct.toFixed(1)}٪`);
  }
}

// ————— ٢) الفرقُ عن الأساس — حالةً حالة، وبالاسم —————
//
// **قاعدةُ القياس** (بندُ الجلسة ٢): يُشغَّل قبل التعديل وبعده، والفرقُ يُطبع بالاسم.
// والأساسُ ملفٌّ مجمَّدٌ في المستودع: **حالُ الحكم يومَ قُبل آخرُ تعديل** — فمَن عدّل
// اليوم رأى ما فعل، لا ما يظنّ أنه فعل.

const snapshot = {
  what: 'أساسُ حارس الانحدار — حكمُ المحرّك على كل حالةٍ يومَ ثُبِّت (لا يُحرَّر بيد)',
  tolerance: pen.TOLERANCE,
  freeEase: pen.FREE.ease,
  easeFloor: pen.EASE_FLOOR,
  cases: Object.fromEntries(rows.map((r) => [r.id, {
    origin: r.origin,
    frozen: r.frozen,
    wanted: r.wanted,
    walkerOnly: r.walkerOnly,
    // **حكمُ القبول** (الحَكَم الكلّيّ) — وهو المقصودُ بـ`accepted` منذ ن٢
    accepted: r.accepted,
    why: r.why,
    recall: r.recall,
    precision: r.precision,
    // **وحكمُ الطريقة** (الماشي) — يُقاس ولا يُردّ به
    exact: r.exact,
    primary: r.primary,
    size: r.size,
    match: r.match,
    maxLateral: r.maxLateral,
    coverage: r.coverage,
    limit: Math.round(r.limit),
  }])),
};

if (flag('--save')) {
  if (FACTOR) {
    console.log('\n  ✗ لا يُثبَّت أساسٌ من تجربة `--factor` — الأساسُ حالُ `pen.js` نفسِه');
    process.exit(1);
  }
  writeFileSync(BASE_PATH, `${JSON.stringify(snapshot, null, 1)}\n`);
  console.log(`\n  ثُبِّت الأساسُ في ${BASE_PATH} (${rows.length} حالة).`);
  process.exit(0);
}

console.log('\n— ٢) الفرقُ عن الأساس —');
if (!existsSync(BASE_PATH)) {
  ok(false, `لا أساسَ للمقارنة في ${BASE_PATH} — شغّل \`--save\` مرّةً ليصير للتعديل قبلٌ وبعد`);
} else {
  const base = JSON.parse(readFileSync(BASE_PATH, 'utf8'));
  const now = new Map(rows.map((r) => [r.id, r]));
  const changed = [];
  const gone = [];
  const staleIds = new Set(staleRows.map((r) => r.id));
  for (const [id, was] of Object.entries(base.cases)) {
    const is = now.get(id);
    if (!is) { gone.push(id); continue; }
    // **والموسومُ خارجَ المقابلة**: أساسُه قِيس على مرجعٍ تبدّل، فالفرقُ فرقُ
    // مرجعين لا فرقُ محرّكين — ويبقى في الأساس مقيَّداً حتى يُستبدَل أثرُه.
    if (staleIds.has(id)) continue;
    if (was.accepted !== is.accepted || was.why !== is.why
      || was.exact !== is.exact || was.primary !== is.primary || was.size !== is.size) {
      changed.push({ id, was, is });
    }
  }
  const fresh = rows.filter((r) => !base.cases[r.id]);

  console.log(`  الأساسُ ${Object.keys(base.cases).length} حالةً بسماحة انحراف ${base.tolerance.lateral}`
    + ` وتكريمٍ ×${base.freeEase}؛ واليومَ ${rows.length} حالةً`
    + ` بـ${pen.TOLERANCE.lateral} و×${pen.FREE.ease}.`);

  /** صنفُ التبدّل: ما الذي كسبناه وما الذي خسرناه — بالاسم لا بالعدد. */
  /**
   * 🔴 **والموسومُ بحكم الماشي القديم خارجَ هذا التصنيف** (ن٢): وسمُه ليس عهدَ قبولٍ
   * على الحَكَم الكلّيّ — بل حكمُ المحرّك الذي قاسه يومَ التُقط. **فعدُّ قبوله كذباً
   * حراسةٌ للعهد القديم**، وهو ما جاءت خطّةُ الإنقاذ لتنقضه. ويُطبَع بالاسم أدناه.
   */
  const oldWalker = changed.filter(({ is }) => is.walkerOnly);
  const falseAccept = changed.filter(({ was, is }) =>
    !is.walkerOnly && !is.wanted && is.accepted && !was.accepted);
  const falseReject = changed.filter(({ was, is }) =>
    !is.walkerOnly && is.wanted && !is.accepted && was.accepted);
  const fixed = changed.filter(({ was, is }) => is.wanted === is.accepted && was.accepted !== was.wanted);

  if (!changed.length && !gone.length && !fresh.length) {
    console.log('  · لا حالةَ تبدّل حكمُها — المحرّكُ اليومَ هو المحرّكُ يومَ ثُبِّت الأساس.');
  }
  for (const { id, was, is } of changed) {
    const kind = oldWalker.some((c) => c.id === id) ? '○ وسمُه حكمُ الماشي القديم — يُقاس ولا يُحكَم به'
      : falseAccept.some((c) => c.id === id) ? '🔴 **قبولٌ كاذبٌ جديد**'
      : falseReject.some((c) => c.id === id) ? '🔴 **ردٌّ كاذبٌ جديد**'
        : fixed.some((c) => c.id === id) ? '✔ صار موافقاً للمنتظَر'
          : '⚠ تبدّلت شكواه';
    const shot = (r) => `${r.accepted ? 'مقبولاً' : `مردوداً بـ«${r.why || r.primary || '؟'}»`}`
      + ` وطريقتُه ${r.exact ? 'مطابقة' : `«${r.primary || 'حجم'}»`}`;
    console.log(`  · ${kind} — ${id}${is.frozen ? '' : ' [خامٌ لم يُجمَّد]'}:`
      + ` كان ${shot(was)} (شكلٌ ${was.recall ?? '؟'}٪/${was.precision ?? '؟'}٪`
      + ` · انحراف ${was.maxLateral}/${was.limit})`
      + ` وصار ${shot(is)} (شكلٌ ${is.recall}٪/${is.precision}٪`
      + ` · انحراف ${is.maxLateral}/${Math.round(is.limit)})`);
  }
  for (const id of gone) console.log(`  · ⚠ حالةٌ في الأساس وليست في المادّة اليوم — ${id}`);
  for (const r of fresh) console.log(`  · ➕ حالةٌ جديدة لا أساسَ لها — ${r.id} (${r.match ? 'موافقةٌ للمنتظَر' : 'مخالفة'})`);

  if (FACTOR) {
    console.log(`\n  (تجربةُ عامل ×${FACTOR}: ${changed.length} حالةً تبدّلت — `
      + `${falseAccept.length} قبولاً كاذباً و${falseReject.length} ردّاً كاذباً و${fixed.length} إصلاحاً. `
      + 'ولا حكمَ لها: العاملُ لم يُكتب في `pen.js`.)');
  } else {
    // **وسنّةُ جلسة ك**: القبولُ الكاذبُ الجديد يُبطل التعديل — ولا يُسكِته إصلاحٌ آخر.
    ok(falseAccept.length === 0,
      falseAccept.length
        ? `**قبولٌ كاذبٌ جديد يُبطل التعديل** — ${falseAccept.map((c) => c.id).join('، ')}`
        : 'ولا قبولَ كاذبٍ جديد — التعديلُ لم يشترِ قبولاً بتساهل');
    ok(falseReject.length === 0,
      falseReject.length
        ? `**ردٌّ كاذبٌ جديد** — ${falseReject.map((c) => c.id).join('، ')}`
        : 'ولا ردَّ كاذبٍ جديد — ولا أثرَ صحيحٍ خسرناه');
    ok(gone.length === 0,
      gone.length ? `حالاتٌ غابت عن المادّة — ${gone.join('، ')}` : 'ولا حالةَ غابت — المادّةُ لم تنقص');
    if (fixed.length) console.log(`  (وصُلح ${fixed.length}: ${fixed.map((c) => c.id).join('، ')})`);
    if (oldWalker.length) {
      console.log(`  (و${oldWalker.length} أثراً ميدانياً وسمُه حكمُ الماشي القديم —`
        + ` ${oldWalker.map((c) => c.id).join('، ')} — يُراجَع بعين المالك في ن٣)`);
    }
  }
}

// ————— ٣) دفترُ الالتقاط يسجّل الحدَّ الذي حُكم به —————
//
// **وعطبُ السجل يُصلَح في أثر الحارس** (بندُ الجلسة ٣): كان `pendev.js` يقيّد
// `surface.trial.tolerance.lateral` — **السماحةَ الأساس** — والحكمُ في النمط الحرّ
// يجري بـ`easeTolerance` (×`FREE.ease`). فقرأ قارئُ الدفتر ثمانيةَ آثارٍ «فوق
// الحدّ» ولم يجاوز الحدَّ العامل منها أثرٌ واحد (`FIELD_TRIAL §٦`). **فالحقلان
// يُقيَّدان معاً**، وهذا يحرسهما — ويحرس أن الفرقَ بينهما ليس صفراً أصلاً.

if (!FACTOR) {
  console.log('\n— ٣) دفترُ الالتقاط: يقيّد الحدَّ العامل ومعاملَ التكريم —');
  const devSrc = readFileSync(new URL('js/pendev.js', APP), 'utf8');
  ok(pen.easeTolerance(pen.TOLERANCE).lateral !== pen.TOLERANCE.lateral,
    `والفرقُ قائمٌ فالتقييدُ ذو معنى: أساسٌ ${pen.TOLERANCE.lateral}`
    + ` وعاملٌ ${pen.easeTolerance(pen.TOLERANCE).lateral} (×${pen.FREE.ease})`);
  ok(/limit:\s*Math\.round\(tolOf\(\)\.lateral\)/.test(devSrc) && /ease:\s*eased \? FREE\.ease/.test(devSrc),
    'ودفترُ الالتقاط يقيّد `limit` (الحدَّ الذي حُكم به) و`ease` (معاملَ التكريم) مع كل أثر');
  ok(/easeTolerance/.test(devSrc) && /from '\.\/pen\.js'/.test(devSrc),
    'ويأخذُ المعاملَ من `pen.js` بعينه — لا رقمَ مكتوباً في صفحة الالتقاط');
  ok(!/من سماحة /.test(devSrc),
    'ولا يُعرَض على الشاشة رقمٌ يُسمّى «سماحة» وقد حُكم بغيره — المعروضُ هو المسجَّل');
}

if (FACTOR) {
  console.log('\nتجربةٌ لا حكم — رُدّ العاملُ بمجرّد انتهاء التشغيلة (لم يُكتب في ملفّ).');
  process.exit(0);
}
console.log(fails ? `\n${fails} فشل` : '\nحارسُ الانحدار أخضر — المادّةُ موصولةٌ بالحكم، ولا حكمَ تبدّل.');
process.exit(fails ? 1 : 0);
