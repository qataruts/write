// حارسُ **محطات التهيئة الحركية** (الجلسة ٤) بلا متصفّح:
//   node tools/test_warmup.mjs
//
// المرحلةُ الأولى في `METHOD.md §٤` — خطوطٌ ومنحنياتٌ ودوائرُ وموجاتٌ وتحكّمٌ داخل
// حدود — تُدرَّس بمحرّك القلم نفسِه وبمساراتٍ مؤلَّفةٍ في عدّة المسارات. وهذا الحارسُ
// يسأل أربعاً:
//   ١) **التغطية**: لكلِّ محطةٍ في المنهج أشكالُها، ولا شكلَ بلا محطة — ومصدرُ
//      القائمتين `curriculum.js` و`warmups.js` لا قائمةٌ ثالثة تُكتب هنا.
//   ٢) **البنية**: بداياتٌ معلنة، ونقاطٌ على الشبكة، ولا قطعةَ تخدع نافذةَ الرتابة،
//      ومبادئُ الأجزاء متباعدةٌ فلا يلتبس جزءٌ بجزء. **وأرقامُه من `pen.js` نفسِه.**
//   ٣) **الحكم**: الصحيحُ يُقبَل والمعكوسُ يُرفَض على كل شكل — **بسماحة محطته**،
//      ومعها **احتمالُ ارتجاف يدِ طفل** بأرضيةٍ لا ينزل عنها (عهدُ `child-drift`).
//   ٤) **الشاشة**: تكتب نجومَها وتقدّمَها وأخطاءَ اتجاهها، **ولا تكتب في ليتنر**
//      (قرارُ الجلسة ٣: وحداتُها ليست حروفاً) — وهي في الموجّه وفي مخزون العمل
//      دون إنترنت.
//
// **ولا رقمَ محطاتٍ ولا أشكالٍ مكتوبٌ هنا**: يُطبَع محسوباً، فمحطةٌ تُزاد أو شكلٌ
// يُضاف يدخل هذا الحارسَ يومَ يُضاف بلا سطرٍ يُعدَّل.

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const APP = new URL('../app/', import.meta.url);
const TOOLS = new URL('./', import.meta.url);
const read = (path) => readFileSync(new URL(path, APP), 'utf8');

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const pen = await import(new URL('js/pen.js', APP));
const { WARMUPS, WARMUPS_SOURCE } = await import(new URL('js/warmups.js', APP));
const progress = await import(new URL('js/progress.js', APP));
const { starsForReview } = await import(new URL('js/review.js', APP));

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

const shapes = Object.entries(WARMUPS)
  .flatMap(([part, station]) => station.shapes.map((shape) => ({ part, shape })));
// 🔴 **التهيئةُ ملغاةٌ من الرحلة بأمر المالك** (٢٤ أغسطس ٢٠٢٦: «ألغِ التهيئة ما قبل
// حرف ا — الخطوطُ والمنحنياتُ غير مفيدة»): فلا عقدةَ تهيئةٍ في `allNodes` بعد اليوم،
// **ومادّتُها تبقى محفوظةً كاملةً محروسة** (يومَ تعود تعود سليمة) — فتُقرأ محطاتُها
// من المنهج مباشرةً لا من الرحلة، **ويُحرَس الإلغاءُ نفسُه** أوّلَ ما يُحرَس.
const { STAGES } = await import(new URL('js/curriculum.js', APP));
const stage = STAGES.find((s) => s.kind === 'warmup');
const nodes = (stage?.nodes ?? []).map((n) => ({ ...n, id: `warmup:${n.part}`, type: 'warmup' }));
const tolOf = (shape) => pen.resolveTolerance(shape.tolerance);

console.log('\n— ٠) الإلغاء: محفوظةُ المادّة، مقطوعةُ الطريق —');
ok(progress.allNodes().every((n) => n.type !== 'warmup'),
  'لا عقدةَ تهيئةٍ في الرحلة — الطفلُ يبدأ بالألف (أمرُ المالك ٢٤ أغسطس ٢٠٢٦)');
ok(nodes.length > 0 && nodes.every((n) => WARMUPS[n.part]),
  `ومادّتُها محفوظةٌ كاملة: ${nodes.length} محطةً بأشكالها — الإلغاءُ طيٌّ لا حذف`);

// ————— ١) التغطية: محطاتُ المنهج وأشكالُها —————

console.log('\n— ١) التغطية: لكلِّ محطةٍ أشكالُها —');
ok(nodes.length > 0, `محطاتُ التهيئة في الرحلة: ${nodes.length}`);
const missing = nodes.filter((n) => !WARMUPS[n.part]);
ok(missing.length === 0,
  `ولكلِّ محطةٍ أشكالُها المؤلَّفة (${shapes.length} شكلاً)`
  + (missing.length ? ` — بلا أشكال: ${missing.map((n) => n.part).join('، ')}` : ''));
const orphan = Object.keys(WARMUPS).filter((part) => !nodes.some((n) => n.part === part));
ok(orphan.length === 0,
  'ولا شكلَ في الوحدة لمحطةٍ ليست في المنهج'
  + (orphan.length ? ` — يتيم: ${orphan.join('، ')}` : ''));
ok(Object.values(WARMUPS).every((station) => station.shapes.length >= 2),
  'ولكلِّ محطةٍ شكلان فأكثر — محطةٌ بشكلٍ واحد تُنجَز بضربةٍ ولا تُدرِّب يداً');
ok(WARMUPS_SOURCE?.sha && WARMUPS_SOURCE.spin && WARMUPS_SOURCE.spinFrom,
  `والوحدةُ مولَّدةٌ بنسبها: ${WARMUPS_SOURCE?.tool} · بصمة ${WARMUPS_SOURCE?.sha}`
  + ` · دورانُها من ${WARMUPS_SOURCE?.spinFrom} (${WARMUPS_SOURCE?.spinText})`);

// **والعدّةُ تُفحَص قبل أن يُفحَص بها** (نظيرُ `test_paths.mjs`): وحدةٌ حُرِّرت بيد
// أو بُنيت من قسمٍ تبدّل تحتها شاهدٌ فاسد — فلا معنى للحكم على أشكالها.
const covenant = spawnSync('python3',
  [fileURLToPath(new URL('make_paths.py', TOOLS)), '--self-test'], { encoding: 'utf8' });
ok(covenant.status === 0, 'وعهدُ التوليد قائم — لا شكلَ يُدَسّ بيد ولا قسمٌ يُعدَّل بلا بناء'
  + (covenant.status === 0 ? ''
    : `\n${(covenant.stdout || '').split('\n').filter((l) => l.includes('✗')).join('\n')}`));

// ————— ٢) البنية: أرقامُها من المحرّك لا مكتوبةٌ هنا —————
//
// **وأقصى طولِ قطعة** هو حدُّ `check_paths.py` نفسُه (`min(back, len × HEAD_RATIO)`):
// نافذةُ الرتابة تُرشِّح قطعاً كاملة، فقطعةٌ تتجاوز رأسَ المسار تُعيد ثغرةَ ذيل
// الشكل المغلق من بابها — ودوائرُ التهيئة **أشكالٌ مغلقة** فالحدُّ ألزمُ ما يكون.

console.log('\n— ٢) البنية: بداياتٌ معلنة وقطعٌ لا تخدع نافذة الرتابة —');
const HEAD_RATIO = Number((read('js/pen.js').match(/HEAD_RATIO = ([\d.]+)/) || [])[1]);
ok(HEAD_RATIO > 0, `وحدُّ القطعة مقروءٌ من المحرّك: HEAD_RATIO = ${HEAD_RATIO}`);
for (const { part, shape } of shapes) {
  const tol = tolOf(shape);
  const problems = [];
  for (const stroke of shape.ref.strokes) {
    if (!stroke.start || stroke.start[0] !== stroke.points[0][0]
      || stroke.start[1] !== stroke.points[0][1]) problems.push('بدايةٌ لا تطابق أوّلَ نقطة');
    if (stroke.points.some((p) => p.some((v) => !Number.isFinite(v) || v < 0 || v > pen.GRID))) {
      problems.push('نقطةٌ خارج الشبكة');
    }
    const poly = pen.prepare(stroke.points);
    const cap = Math.min(tol.back, poly.len * HEAD_RATIO);
    const longest = Math.max(...poly.cum.slice(1).map((c, i) => c - poly.cum[i]));
    if (longest > cap) problems.push(`قطعةٌ طولُها ${Math.round(longest)} وأقصى المسموح ${Math.round(cap)}`);
    if (poly.len < tol.start * 4) problems.push(`مسارٌ أقصرُ من أن يُقاس (${Math.round(poly.len)})`);
  }
  // **ومبادئُ الأجزاء متباعدة**: جزءان مبدؤهما متجاوران يُقرأ نزولُ الطفل على
  // أحدهما قلباً للترتيب — وهو خطأٌ في الشكل لا في يد الطفل.
  const starts = shape.ref.strokes.map((s) => s.start);
  for (let i = 0; i < starts.length; i++) {
    for (let j = i + 1; j < starts.length; j++) {
      const gap = Math.hypot(starts[i][0] - starts[j][0], starts[i][1] - starts[j][1]);
      if (gap <= tol.start * 2) problems.push(`مبدآ جزأين متجاوران (${Math.round(gap)})`);
    }
  }
  ok(problems.length === 0, `${shape.id}: بنيتُه سليمة`
    + (problems.length ? ` — ${problems.join(' · ')}` : ''));
}
ok(shapes.every(({ shape }) => !shape.ref.dots?.length),
  'ولا نقطةَ في أشكال التهيئة — النقاطُ مادّةُ الحروف لا الخطوط');

// ————— ٣) الحكم: الصحيحُ يُقبَل والمعكوسُ يُرفَض، بسماحة محطته —————
//
// **يدُ طفلٍ مصنوعة تُحسب لحظةَ الفحص** (نظيرُ `test_paths.mjs`): المحروسُ هنا
// **الأشكال** لا المحرّك، فالضرباتُ تتبع شكلَها ولا تُجمَّد — ولو جُمّدت لصارت
// شاهداً على شكلٍ قديم. (وعدّةُ المعايرة المجمَّدة تحرس المحرّكَ في `test_pen.mjs`.)

function walk(points, { from = 0, to = 1, step = 12, sway = 0 } = {}) {
  const poly = pen.prepare(points);
  const count = Math.max(2, Math.round((Math.abs(to - from) * poly.len) / step));
  const out = [];
  for (let i = 0; i <= count; i++) {
    const ratio = from + (to - from) * (i / count);
    const { at, dir } = pen.pointAt(poly, ratio * poly.len);
    const norm = Math.hypot(dir[0], dir[1]) || 1;
    // **موجةُ انحرافٍ واحدة على المسار** — عينُ `child-drift` في عدّة المعايرة
    // (`sin(r × π × 2)`)، فالأرضيةُ تحت والقياسُ فوقها من عهدٍ واحد.
    const off = sway ? Math.sin(ratio * Math.PI * 2) * sway : 0;
    out.push([at[0] + (-dir[1] / norm) * off, at[1] + (dir[0] / norm) * off]);
  }
  return out;
}
const trace = (ref, opts) => ref.strokes.map((s) => walk(s.points, opts));
/** **يدٌ تعكس الاتجاه لا الترتيب**: كلُّ جزءٍ يُكتب من آخره، والأجزاءُ بترتيبها —
    فالمردودُ اتجاهُ الحركة بعينه لا قلبُ الأجزاء (وذاك خطؤه `order` وله بابُه). */
const backwards = (ref, tolerance) => pen.judge(ref, trace(ref, { from: 1, to: 0 }), { tolerance });

console.log('\n— ٣) الحكم: صحيحاً ومعكوساً على كل شكل —');
for (const { part, shape } of shapes) {
  const tolerance = shape.tolerance;
  const good = pen.judge(shape.ref, trace(shape.ref), { tolerance });
  const back = backwards(shape.ref, tolerance);
  ok(good.accepted && !back.accepted,
    `${shape.id}: الصحيحُ ${good.accepted ? 'يُقبَل' : `يُرفَض «${good.primary}»`}`
    + ` · المعكوسُ ${back.accepted ? 'يُقبَل — وهو خطأ!' : `يُرفَض «${back.primary}»`}`
    + (shape.tolerance ? ` (سماحةُ محطته ×${shape.tolerance})` : ''));
}

// **والدائرةُ تُدار في اتجاهٍ واحد**: على الشكل المغلق يُسمّى عكسُ الدوران بعينه —
// «يعكس اتجاه الحركة» لا «يخرج عن المسار» (حمولةُ مراجعة الجلسة ١). وهو الفارقُ
// الذي يقرؤه وليُّ الأمر في لوحته، ومادّتُه هنا: دوائرُ التهيئة وحلقاتُها.
const rings = shapes.filter(({ shape }) => shape.ref.strokes.some((s) => {
  const a = s.points[0];
  const b = s.points[s.points.length - 1];
  return Math.hypot(a[0] - b[0], a[1] - b[1]) <= tolOf(shape).start;
}));
ok(rings.length > 0, `والأشكالُ المغلقة في التهيئة: ${rings.length} (${rings.map((r) => r.shape.id).join('، ')})`);
for (const { shape } of rings) {
  const back = backwards(shape.ref, shape.tolerance);
  ok(back.primary === pen.FAULTS.REVERSE,
    `${shape.id}: الدورانُ المعكوس يُسمّى «${back.primary}» — ${pen.FAULT_TEXT[back.primary]}`);
}

// ————— ٤) احتمالُ ارتجاف يدِ طفل: أرضيةٌ لا ينزل عنها —————
//
// عهدُ `child-drift` في عدّة المعايرة: رجفةُ **نصف السماحة تُقبَل**. وهنا تُقاس
// بسماحة كل محطة: محطةُ التحكّم أضيقُ ممرّاً، فأرضيتُها نصفُ سماحتها هي — فلا
// يُطلَب من طفلٍ في ممرٍّ ضيّق ما يُطلَب منه في السعة، ولا يُعفى شكلٌ من العهد.

const FLOOR = 0.5;
console.log(`\n— ٤) احتمالُ الارتجاف: أدناه نصفُ سماحة المحطة (عهدُ \`child-drift\`) —`);
for (const { shape } of shapes) {
  const lateral = tolOf(shape).lateral;
  let max = 0;
  for (let sway = 0; sway <= lateral; sway += 3) {
    if (!pen.judge(shape.ref, trace(shape.ref, { sway }), { tolerance: shape.tolerance }).accepted) break;
    max = sway;
  }
  ok(max >= lateral * FLOOR,
    `${shape.id}: يحتمل انحراف ${max} من سماحة ${Math.round(lateral)}`
    + `${max >= lateral * FLOOR ? '' : ' — دون عهد `child-drift`'}`);
}

// ————— ٥) الشاشة: نجومٌ وتقدّمٌ وأخطاءُ اتجاه، ولا ليتنر —————

console.log('\n— ٥) الشاشة: ما تكتبه وما لا تكتبه —');
const screen = read('js/warmup.js');
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|\s)\/\/[^\n]*/g, ' ');
const code = strip(screen);

ok(/progress\.setStars\(/.test(code), 'تكتب نجمةَ عقدتها (`setStars`) — فتتقدّم جبهةُ الفتح');
ok(/progress\.recordFault\(/.test(code),
  'وتكتب **أخطاءَ الاتجاه** بأعيانها (`recordFault`) — الذهبُ القياسيّ (`METHOD.md §٦`)');
ok(!/recordAttempt/.test(code),
  'ولا تكتب في ليتنر — التهيئةُ معفاةٌ بعلّتها المكتوبة (قرارُ الجلسة ٣: وحداتُها ليست حروفاً)');
ok(/starsForReview/.test(code),
  'ونجومُها بحكم المراجعة نفسِه — لا سلّمَ ثانٍ للنجوم في هذا التطبيق');
ok(!/setTimeout\([^)]*\d{4,}/.test(code) && !/مؤقّت|عدّ تنازليّ/.test(code),
  'ولا مؤقّتَ ولا عدّ تنازليّ (`METHOD.md §٣.٤`)');
// 🔴 **انقلب بمرسوم المالك** (٢٣ أغسطس ٢٠٢٦): «العرضُ التلقائيّ في شاهِدْ وحدَها —
// لوحُ كتابةٍ لا يُفتح وعرضٌ يجري». فكان يُطلَب أن يبدأ العرضُ من نفسه، **وصار
// المطلوبَ ألّا يبدأ**: اللوحُ حيٌّ للطفل من أوّل ظهوره، والعرضُ بزرّ «شاهِدْ».
ok(!/\bplay\(\)/.test(code.replace(/onclick:[^\n]*/g, '')),
  'ولا عرضَ يجري من نفسه على لوح كتابة — اللوحُ حيٌّ والعرضُ بزرّ «شاهِدْ» (مرسومُ ٢٣ أغسطس ٢٠٢٦)');

// **والقياسُ يعمل فعلاً لا نصّاً**: تُسجَّل أخطاءُ محطةٍ ونجومُها على المخزن نفسِه.
const node = nodes[0];
const before = progress.faultsOf(node.part).length;
progress.recordFault(node.part, pen.FAULTS.REVERSE);
progress.recordFault(node.part, pen.FAULTS.REVERSE);
const after = progress.faultsOf(node.part);
ok(after.length === before + 1 && after[0].n === 2 && after[0].code === pen.FAULTS.REVERSE,
  `وعدّادُ الاتجاه يعمل: «${node.part}» ${after[0]?.n} مرّتين بـ«${after[0]?.code}»`);
ok(progress.faults().every((f) => Object.values(pen.FAULTS).includes(f.code)),
  'ولا رمزَ في العدّاد خارج أسماء المحرّك — تقرؤه لوحةُ وليّ الأمر بجملته');
progress.setStars(node.id, starsForReview(0, WARMUPS[node.part].shapes.length));
ok(progress.getStars(node.id) === 3 && progress.isDone(node.id),
  'ونجمةُ المحطة تُكتب بمعرّفها من الرحلة — فتُفتح التي بعدها');

// 🔒 **ومن حملة مسار الطفل**: لا شبكةَ في الشاشة، ولا إحداثيَّ نقطةٍ يُخزَّن.
ok(!/fetch\(|XMLHttpRequest|sendBeacon|https?:\/\//.test(code),
  'ولا تعرف الشبكة — مسارُ الطفل لا يجد فيها طريقاً خارج الجهاز');
ok(!/recordFault\([^)]*fault\.(at|off)/.test(code),
  'وما يُخزَّن **اسمُ الخطأ** لا إحداثيُّ يد — والنسخةُ الاحتياطية أرقامُ قياسٍ لا أثرُ يد');

// ————— ٦) الوصل: الموجّهُ والمخزونُ —————

console.log('\n— ٦) الوصل —');
const main = strip(read('js/main.js'));
ok(/renderWarmup\(/.test(main) && /releaseWarmup\(\)/.test(main),
  'والموجّهُ يفتح المحطةَ ويُطلق لوحَها عند المغادرة');
ok(!/warmup:/.test(main.match(/const SCREENS = \{[\s\S]*?\};/)?.[0] || ''),
  'وسطرُ «لا شاشةَ بعدُ» سقط من الموجّه — فصار قياسُها وكاتبُ نجمتها مطالَبَين');
const sw = read('sw.js');
const version = Number((sw.match(/VERSION = 'v(\d+)'/) || [])[1]);
ok(sw.includes("'js/warmup.js'") && sw.includes("'js/warmups.js'") && version >= 6,
  `ووحدتا التهيئة في مخزون العمل دون إنترنت بنسخةٍ مرفوعة (v${version} ≥ v6)`);

console.log(fails ? `\n${fails} فشل` : '\nمحطاتُ التهيئة: التغطيةُ والبنيةُ والحكمُ والقياسُ خضرٌ');
process.exit(fails ? 1 : 0);
