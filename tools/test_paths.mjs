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
// **حصيلةُ هذه الجلسة، وتُطبع رقماً لتُقارَن**: حروفُ العربية فيها ما يكتبه القلمُ
// **ذهاباً وإياباً** (سنّةُ ـبـ، وعمودُ ـلـ، وتُوَيْجُ ـب). وطيّةٌ كهذه أضيقُ على
// الحَكَم من غيرها: الضلعان متجاوران، فيدٌ ترتجف يقع إسقاطُها على الضلع الخطأ.
// فيُقاس لكلِّ مسارٍ **أقصى انحرافٍ يحتمله وهو يُكتب صحيحاً**، ويُشترط ألّا ينزل
// عن كسرٍ من سماحة المحرّك — فلو ضاق مسارٌ يوماً بتعديلٍ في العدّة حمِرَ هذا السطر.
//
// ⚠ **والعلاجُ التامّ في المحرّك لا في المسار** (يُرفَع بلاغاً إلى المدير): قطعةٌ
// مُعلَنةٌ أنها طيّة يُسمح فيها بالعود إلى القمّة. وما هنا اليومَ **تخفيفٌ بنيويّ**:
// يُفتَح الضلعان بعرض الحبر نفسِه فيتمايزان.

const FLOOR = 0.4;
console.log(`\n— ٤) احتمالُ الارتجاف: أدنى المقبول ${Math.round(pen.TOLERANCE.lateral * FLOOR)}`
  + ` من سماحة ${pen.TOLERANCE.lateral} —`);
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
    + `${max < pen.TOLERANCE.lateral * 0.5 ? ' — طيّةٌ ضيّقة، والبلاغُ عند المدير' : ''}`);
}

// ————— ٥) الوصل: الوحدةُ مولَّدةٌ وفي مخزون العمل دون إنترنت —————

console.log('\n— ٥) الوصل —');
const module = read('js/paths.js');
ok(/ملفٌّ مولَّد — لا يُحرَّر بيد/.test(module) && /make_paths\.py --build/.test(module),
  'ووحدةُ المسارات تُعلن أنها مولَّدةٌ وتُسمّي مولِّدَها في رأسها');
ok(/export const PATHS_SOURCE/.test(module),
  'وتحمل نسبَها: من أيّ إيماءةٍ بُنيت وببصمتها');
const sw = read('sw.js');
ok(sw.includes("'js/paths.js'"), 'وهي في مخزون العمل دون إنترنت (`SHELL`)');
const version = Number((sw.match(/VERSION = 'v(\d+)'/) || [])[1]);
ok(version >= 3, `ونسخةُ عامل الخدمة مرفوعةٌ لتصل الوحدةُ الجديدة إلى الأجهزة (v${version} ≥ v3)`);
// **والعدّةُ لا تسكن التطبيق**: أداةُ التأليف في `tools/` وحدها، فلا يُخدَم للطفل
// خيالُ حرفٍ ولا مُنحِّفٌ ولا شيءٌ من عُدّة الصنعة.
ok(!readdirSync(new URL('js/', APP)).some((f) => /make_paths|thin|ghost/i.test(f)),
  'ولا شيءَ من عدّة التأليف في `app/` — العدّةُ في `tools/` وحدها');

console.log(fails ? `\n${fails} فشل` : '\nمساراتُ الحروف: بنيةٌ وحكمٌ وتغطيةٌ ووصلٌ خضرٌ');
process.exit(fails ? 1 : 0);
