// حارسُ مسارات الحروف (الجلسة ٢) بلا متصفّح:
//   node tools/test_paths.mjs
//
// `check_paths.py` يسأل: **أسليمةٌ بنيةُ المسار؟** (بداياتٌ معلنة، أجزاءٌ معقولة،
// نقاطٌ بعد الجسم، ولا قطعةَ تخدع نافذةَ الرتابة). وهذا يسأل ما لا يسأله نصّ:
// **أيقبله المحرّكُ إذا كُتب صحيحاً، ويرفضه إذا عُكس؟** — وهو معيارُ قبول الجلسة
// بحرفه. ويسأل ثالثةً هي حصيلةُ اليوم: **كم يحتمل كلُّ مسارٍ من ارتجاف يدِ طفل؟**
//
// وهو نظيرُ `test_pen.mjs` في بابه: ذاك يُدخِل على المحرّك **عدّةَ معايرةٍ مجمَّدة**
// لِيُثبِت حكمَه على أصناف الشروط، وهذا يُدخِل عليه **مسارات المادّة كلَّها** —
// فيومَ تُؤلَّف مساراتُ المجموعات الباقية (الجلسات ٥ و٦ و٧) تدخل هذا الحارسَ بلا
// سطرٍ يُضاف: قائمتُه `PATHS` نفسُه.

import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const APP = new URL('../app/', import.meta.url);
const TOOLS = new URL('./', import.meta.url);
const read = (path) => readFileSync(new URL(path, APP), 'utf8');
const runTool = (file, ...args) => spawnSync(file.endsWith('.py') ? 'python3' : 'node',
  [fileURLToPath(new URL(file, TOOLS)), ...args], { encoding: 'utf8' });

const pen = await import(new URL('js/pen.js', APP));
const paths = await import(new URL('js/paths.js', APP));
const curriculum = await import(new URL('js/curriculum.js', APP));

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

const forms = Object.values(curriculum.FORMS);
const shapes = Object.entries(paths.PATHS)
  .flatMap(([ch, byForm]) => Object.entries(byForm).map(([form, ref]) => ({ ch, form, ref })));

// ————— ١) الفاحصُ البنيويّ يُشغَّل في سياقه —————
//
// **ولِمَ هنا وقد يشغّله غيري؟** لأن الحكمَ على مسارٍ فاسد البنية لا معنى له: لو
// مرّت قطعةٌ طويلة أو بدايةٌ غير معلنة لَكان قبولُ المحرّك لها شهادةَ زور. فيسبق
// البنيويُّ الحكميَّ في السياق نفسِه.

console.log('\n— ١) البنية: `check_paths.py` على المسارات وعلى نفسه —');
const structure = runTool('check_paths.py', '-q');
ok(structure.status === 0, 'المساراتُ كلُّها سليمةُ البنية'
  + (structure.status === 0 ? '' : `\n${(structure.stdout || structure.stderr || '').slice(0, 600)}`));
const selfTest = runTool('check_paths.py', '--self-test');
ok(selfTest.status === 0, 'والفاحصُ مجرَّبٌ على ما وُضع له — يمسك كلَّ مخالفةٍ مزروعة'
  + (selfTest.status === 0 ? '' : `\n${(selfTest.stdout || '').split('\n').filter((l) => l.includes('✗')).join('\n')}`));
const gesture = runTool('make_paths.py', '--self-test');
ok(gesture.status === 0, 'وعهدُ الإيماءة والمسار قائم — لا مسارَ يُدَسّ بيد ولا إيماءةٌ بلا بناء'
  + (gesture.status === 0 ? '' : `\n${(gesture.stdout || '').split('\n').filter((l) => l.includes('✗')).join('\n')}`));

// ————— ٢) التغطية: حرفٌ بأشكاله الأربعة، ولا شكلَ بلا مسار —————

console.log('\n— ٢) التغطية —');
ok(shapes.length > 0, `المسارات: ${Object.keys(paths.PATHS).length} حرفاً في ${shapes.length} شكلاً`);
ok(Object.entries(paths.PATHS).every(([, byForm]) => forms.every((f) => byForm[f])),
  `ولكلِّ حرفٍ أشكالُ مواقعه الأربعة (${forms.join('، ')})`);
ok(shapes.every(({ ref }) => ref.strokes?.length && ref.strokes.every((s) => s.start)),
  'ولكلِّ شكلٍ أجزاءٌ ببداياتٍ معلنة');
ok(curriculum.PATHS === paths.PATHS,
  'و`curriculum.js` يصدّر المساراتِ بأعيانها — مصدرُ حقيقةٍ واحدٌ للشاشات');
ok(shapes.every(({ ch, form }) => curriculum.pathOf(ch, form)),
  'و`pathOf` يجد كلَّ شكلٍ بمفتاحه');

// ————— ٣) الحكم: الصحيحُ يُقبَل والمعكوسُ يُرفَض — على كل مسار —————
//
// **يدُ طفلٍ مصنوعة**: مشيةٌ على المسار المرجعيّ بخطوةٍ ثابتة وانحرافٍ عرضيّ موصوف
// (نظيرُ `walk` في مولّد عدّة المعايرة، ولا يُستورَد منه لأن استيرادَه يكتب ملفَّ
// العدّة). وهي **تُحسب لحظةَ الفحص عمداً**: المحروسُ هنا **المسارات** لا المحرّك،
// فالضرباتُ تتبع مسارَها ولا تُجمَّد — ولو جُمّدت لصارت شاهداً على مسارٍ قديم.

function walk(points, { from = 0, to = 1, step = 14, sway = 0 } = {}) {
  const poly = pen.prepare(points);
  const count = Math.max(2, Math.round((Math.abs(to - from) * poly.len) / step));
  const out = [];
  for (let i = 0; i <= count; i++) {
    const ratio = from + (to - from) * (i / count);
    const { at, dir } = pen.pointAt(poly, ratio * poly.len);
    const norm = Math.hypot(dir[0], dir[1]) || 1;
    const off = sway ? Math.sin(ratio * Math.PI * 2) * sway : 0;
    out.push([at[0] + (-dir[1] / norm) * off, at[1] + (dir[0] / norm) * off]);
  }
  return out;
}
const taps = (ref) => ref.dots.map((d) => Array.from({ length: d.count || 1 }, () => d.at)).flat()
  .map((at) => [at, at, at]);
const trace = (ref, opts) => [...ref.strokes.map((s) => walk(s.points, opts)), ...taps(ref)];

console.log('\n— ٣) الحكم: على كل مسارٍ صحيحاً ومعكوساً —');
for (const { ch, form, ref } of shapes) {
  const good = pen.judge(ref, trace(ref));
  const back = pen.judge(ref, trace(ref, { from: 1, to: 0 }));
  ok(good.accepted && !back.accepted,
    `${ch} ${curriculum.FORM_NAMES[form]}: الصحيحُ ${good.accepted ? 'يُقبَل' : `يُرفَض «${good.primary}»`}`
    + ` · المعكوسُ ${back.accepted ? 'يُقبَل — وهو خطأ!' : `يُرفَض «${back.primary}»`}`);
}

// **والمعكوسُ مرفوضٌ باتجاهه لا بدقّته**: تُضاعَف السماحةُ ثلاثاً فيبقى مرفوضاً.
const loose = shapes.filter(({ ref }) => !pen.judge(ref, trace(ref, { from: 1, to: 0 }), { tolerance: 3 }).accepted);
ok(loose.length === shapes.length,
  `والمعكوسُ يُرفَض في الأشكال كلِّها ولو ضوعفت السماحةُ ثلاثاً (${loose.length}/${shapes.length})`);


// **والنقاطُ بعد الجسم**: مَن نقَط قبل أن يكتب الجسمَ رُدّ بخطئه بعينه.
const dotted = shapes.filter(({ ref }) => ref.dots.length);
ok(dotted.length > 0, `والمنقوطُ من الأشكال ${dotted.length} — تُجرَّب فيها قاعدةُ «النقاطُ بعد الجسم»`);
for (const { ch, form, ref } of dotted) {
  const first = pen.judge(ref, [...taps(ref), ...ref.strokes.map((s) => walk(s.points))]);
  ok(first.primary === pen.FAULTS.DOTS_FIRST,
    `${ch} ${curriculum.FORM_NAMES[form]}: النقطةُ قبل الجسم تُردّ بـ«${first.primary}»`);
}

// ————— ٤) الطيّة: كم يحتمل المسارُ من ارتجاف يدِ طفل؟ —————
//
// حروفُ العربية فيها ما يكتبه القلمُ **ذهاباً وإياباً** (سنّةُ ـبـ، وعمودُ ـلـ،
// وتُوَيْجُ ـب). وطيّةٌ كهذه أضيقُ على الحَكَم من غيرها: الضلعان متجاوران، فيدٌ ترتجف
// يقع إسقاطُها على الضلع الخطأ. فيُقاس لكلِّ مسارٍ **أقصى انحرافٍ يحتمله وهو يُكتب
// صحيحاً**، ويُشترط ألّا ينزل عن **نصف سماحة المحرّك** — وهي أرضيةٌ ليست رقماً
// مختاراً: عهدُ `child-drift` في عدّة المعايرة (`tools/pen_traces.json`) أنّ رجفةَ
// نصف السماحة **تُقبَل**، فما نزل عنها مسارٌ ينقض عهدَ المحرّك على نفسه.
//
// **وكانت الأرضيةُ ٠٫٤ حتى الجلسة ٢ب**: ل/وسطي كان يحتمل ٤٢ (والمديرُ قاس ٤٠) —
// أيْ أنّ العهدَ كان منقوضاً على شكلٍ مؤلَّف، وقد شُدّت اليومَ إلى العهد نفسِه بعد
// أن أُعلنت الطيّةُ في بيانات المسار وصار الشرطُ الثاني يقيس بها ذهاباً وإياباً.

const FLOOR = 0.5;
console.log(`\n— ٤) احتمالُ الارتجاف: أدنى المقبول ${Math.round(pen.TOLERANCE.lateral * FLOOR)}`
  + ` من سماحة ${pen.TOLERANCE.lateral} — وهو عهدُ \`child-drift\` بعينه —`);
const room = [];
for (const { ch, form, ref } of shapes) {
  let max = 0;
  for (let sway = 0; sway <= pen.TOLERANCE.lateral; sway += 3) {
    if (!pen.judge(ref, trace(ref, { sway })).accepted) break;
    max = sway;
  }
  room.push({ ch, form, max });
}
for (const { ch, form, max } of room) {
  ok(max >= pen.TOLERANCE.lateral * FLOOR,
    `${ch} ${curriculum.FORM_NAMES[form]}: يحتمل انحراف ${max}`
    + `${max >= pen.TOLERANCE.lateral * FLOOR ? '' : ' — دون عهد `child-drift`'}`);
}

// ————— ٥) الطيّةُ المعلَنة: أتُقبَل السنّةُ على خطٍّ واحد؟ —————
//
// **وهذا سؤالُ «اكتبه وحدك»** (`METHOD.md §٥.٤`): في التتبّع يمشي الطفلُ على النموذج
// المعروض بضلعَيه المفكوكين، أما في الصندوق الفارغ فيكتب السنّةَ **على خطٍّ واحد
// صعوداً ونزولاً كما تُكتب حقّاً** — فيقع خطُّه بين الضلعين. وهي الحالةُ التي أثبتت
// مراجعةُ المدير أنها كانت تُرفَض `[reverse, wander, short]`.
//
// فيُبنى خطُّ الطفل من المسار نفسِه: **منتصفُ الضلعين** (يُقرَن الصاعدُ بالنازل
// بنسبة الطول)، ثم يُحكَم عليه مرّتين — بالإعلان وبلا الإعلان. **فالفارقُ يُرى**:
// لا إحداثيَّ يتبدّل، وإنما صفةُ الطيّة تُنزَع فيعود الحكمُ إلى ما كان.

/** خطُّ الطفل على طيّةٍ: يصعد بين الضلعين ثم يعود عليه. */
function spine(points, fold, steps = 24) {
  const up = pen.prepare(points.slice(fold.from, fold.apex + 1));
  const down = pen.prepare(points.slice(fold.apex, fold.to + 1));
  const mid = [];
  for (let i = 0; i <= steps; i++) {
    const a = pen.pointAt(up, (i / steps) * up.len).at;
    const b = pen.pointAt(down, (1 - i / steps) * down.len).at;
    mid.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
  }
  return [...points.slice(0, fold.from + 1), ...mid,
    ...[...mid].reverse().slice(1), ...points.slice(fold.to + 1)];
}
const unfold = (ref) => ({
  ...ref,
  strokes: ref.strokes.map((s) => ({ start: s.start, points: s.points })),
});
const freeHand = (ref) => [
  ...ref.strokes.map((s) => walk(s.folds?.length ? spine(s.points, s.folds[0]) : s.points)),
  ...taps(ref),
];

console.log('\n— ٥) الطيّةُ المعلَنة: السنّةُ على خطٍّ واحد —');
const folded = shapes.filter(({ ref }) => ref.strokes.some((s) => s.folds?.length));
ok(folded.length > 0,
  `المطويُّ من الأشكال ${folded.length}: ${folded.map((f) => f.ch + '/' + f.form).join('، ')}`
  + ' — وإعلانُه من مفرق الهيكل آلياً لا بيد');
for (const { ch, form, ref } of folded) {
  const free = pen.judge(ref, freeHand(ref));
  const bare = pen.judge(unfold(ref), freeHand(ref));
  ok(free.accepted && !bare.accepted && bare.primary === pen.FAULTS.REVERSE,
    `${ch} ${curriculum.FORM_NAMES[form]}: على خطٍّ واحد ${free.accepted ? 'تُقبَل' : `تُرفَض «${free.primary}»`}`
    + ` — وبنزع الإعلان ${bare.accepted ? 'تُقبَل أيضاً، فالإعلانُ حلية!' : `تُرفَض «${bare.primary}»`}`);
}
// **وأضيقُ المطويّات مدىً هو موضعُ الامتحان**: عند مضاعفة السماحة تتّسع دائرةُ البداية
// حتى تبتلع طرفَي الشكل القصير، **فيسقط الشرطُ الأول من نفسه** ويبقى الحكمُ كلُّه على
// الشرط الثاني. وهو موضعُ الخطر بعد الطيّة: الطيّةُ مكانٌ واحد بطولين، فالصعودُ فيها
// والنزولُ سواءٌ من أيّ ضلعٍ كانا — فلو مُنحت رخصتُها لمن **نزل داخلها** لَقُرئ
// المعكوسُ كلُّه طيّةً مكتوبةً على وجهها. فرخصتُها لمن دخل من مدخلها (`pen.js`).
const tightest = folded
  .map((s) => ({ ...s, span: Math.min(...s.ref.strokes.map((st) => Math.hypot(
    st.points[0][0] - st.points[st.points.length - 1][0],
    st.points[0][1] - st.points[st.points.length - 1][1]))) }))
  .sort((a, b) => a.span - b.span)[0];
if (tightest) {
  const swallowed = pen.judge(tightest.ref, trace(tightest.ref, { from: 1, to: 0 }), { tolerance: 3 });
  ok(!swallowed.accepted && swallowed.primary === pen.FAULTS.REVERSE,
    `وأضيقُ المطويّات مدىً (${tightest.ch} ${curriculum.FORM_NAMES[tightest.form]}: ${Math.round(tightest.span)}`
    + ` < دائرةُ بدايةٍ مضاعفةٍ ثلاثاً ${pen.TOLERANCE.start * 3}) يردّه **الشرطُ الثاني**`
    + ` «${swallowed.primary}» لا الأول — فرخصةُ الطيّة لمن دخلها من مدخلها`);
}

// وما لا طيّةَ فيه لا يتبدّل حكمُه بنزعٍ ولا إثبات — فالصفةُ لا تسري على غير أهلها
ok(shapes.filter(({ ref }) => !ref.strokes.some((s) => s.folds?.length))
  .every(({ ref }) => pen.judge(ref, trace(ref)).accepted
    && !pen.judge(ref, trace(ref, { from: 1, to: 0 })).accepted),
  `والأشكالُ التي لا طيّةَ فيها (${shapes.length - folded.length}) على حكمها كما كانت`);

// ————— ٦) الوصل: الوحدةُ مولَّدةٌ وفي مخزون العمل دون إنترنت —————

console.log('\n— ٦) الوصل —');
const module = read('js/paths.js');
ok(/ملفٌّ مولَّد — لا يُحرَّر بيد/.test(module) && /make_paths\.py --build/.test(module),
  'ووحدةُ المسارات تُعلن أنها مولَّدةٌ وتُسمّي مولِّدَها في رأسها');
ok(/export const PATHS_SOURCE/.test(module),
  'وتحمل نسبَها: من أيّ إيماءةٍ بُنيت وببصمتها');
const sw = read('sw.js');
ok(sw.includes("'js/paths.js'"), 'وهي في مخزون العمل دون إنترنت (`SHELL`)');
const version = Number((sw.match(/VERSION = 'v(\d+)'/) || [])[1]);
// **وتُرفَع مع كل تبديلٍ في المسارات**: v3 يومَ وُلدت الوحدة، وv4 يومَ حملت إعلانَ
// الطيّة (الجلسة ٢ب) — فلا يبقى على جهازٍ مسارٌ بلا الصفة التي يقرؤها محرّكُه.
ok(version >= 4, `ونسخةُ عامل الخدمة مرفوعةٌ لتصل الوحدةُ الجديدة إلى الأجهزة (v${version} ≥ v4)`);
// **والعدّةُ لا تسكن التطبيق**: أداةُ التأليف في `tools/` وحدها، فلا يُخدَم للطفل
// خيالُ حرفٍ ولا مُنحِّفٌ ولا شيءٌ من عُدّة الصنعة.
ok(!readdirSync(new URL('js/', APP)).some((f) => /make_paths|thin|ghost/i.test(f)),
  'ولا شيءَ من عدّة التأليف في `app/` — العدّةُ في `tools/` وحدها');

console.log(fails ? `\n${fails} فشل` : '\nمساراتُ الحروف: بنيةٌ وحكمٌ وتغطيةٌ ووصلٌ خضرٌ');
process.exit(fails ? 1 : 0);
