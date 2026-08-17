// **مستورِدُ مسارات الميدان** إلى عدّة المعايرة (الجلسة ١٢):
//   node tools/import_traces.mjs <ملفّ الميدان.json>            # جردٌ وعرضٌ بلا كتابة
//   node tools/import_traces.mjs <ملفّ الميدان.json> --write    # يُدخلها العدّة
//   node tools/import_traces.mjs --self-test                    # بلا ملفٍّ ولا شبكة
//
// ————— لماذا مستورِدٌ لا لصقٌ باليد —————
//
// عدّةُ المعايرة (`tools/pen_traces.json`) **مصنوعةٌ كلُّها اليوم**: تشويهاتٌ موصوفة
// تُثبت حكمَ المحرّك سالباً وموجباً — **ولا تعاير سماحتَه**. وأرقامُ السماحة في
// `pen.js` مبدئيةٌ لم تُعايَر بطفل، وعهدُ `METHOD §٣.٥` أن تُعايَر **بميدانٍ حقيقيّ
// لا بظنّ**. فحُجز لها منذ الجلسة ١ حقلُ `origin`: `synthetic` يعيد المولّدُ
// توليدَها، و`field` تأتي من هنا **ولا يعيد المولّدُ توليدَها ولا يمسّها**.
//
// **والملفُّ يصل بيد وليّ الأمر**: تلتقطه صفحةُ التجربة خلف `?dev=1` بإذنٍ صريح،
// ويبقى على جهاز الطفل حتى يحفظه وليُّه ملفّاً ويرسله. فهذه الأداةُ **لا تعرف
// جهازاً ولا شبكة** — تقرأ ملفّاً من القرص لا أكثر.
//
// ⚠ **ولا تُحرَّك عتبةٌ هنا**: هذا بابُ دخول المادّة وحدَه. الديونُ الثلاثة
// (منعطفاتُ `test_words` · نافذةُ `nearestOn` · حساسيةُ أسرة س/ش) **تُعايَر
// بالمسارات بعد وصولها**، وتبقى حمراءَ بدَينها حتى تصل — والمعايرةُ بالظنّ هي
// عينُ ما وُضع هذا الباب لمنعه.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const OUT = new URL('./pen_traces.json', import.meta.url);
const OLD_WARNING = 'مساراتٌ مصنوعة لا مساراتُ أطفال';

/**
 * حكمٌ منتظَرٌ لأثرٍ ميدانيّ — **من حكم المحرّك ساعةَ الالتقاط لا من ظنّ المستورِد**.
 *
 * **إلا أن تحكم عينُ بالغٍ حاضرٍ بخلافه** (حقل `eye` يضعه `field_rates.mjs` وحدَه من
 * كشفٍ كُتب في الميدان): فحينئذٍ **المنتظَرُ حكمُ العين** — أثرٌ رُدَّ ظلماً يُنتظَر
 * قبولُه، وأثرٌ قُبل خطأً يُنتظَر ردُّه (بلا تسميةِ شكوى: العينُ تحكم ولا تسمّي علّةَ
 * محرّك). وهي **تدخل حمراءَ عمداً** وتبقى كذلك حتى تُعايَر السماحةُ — فالخلافُ
 * حارسٌ دائم لا حكايةٌ تُروى (بلاغُ قياس الرفض الكاذب، ١٧ أغسطس ٢٠٢٦).
 */
function expectOf(item) {
  // **وبأيّ حَكَمٍ تُقاس؟** بالذي قاسها ساعةَ التقاطها: نمطُ الشاشة الحرّ يُحكَم
  // بـ`judgeFree` («الشكلُ لا الأثر»)، وما سواه بالحكم الموضعيّ. وكان هذا الحقلُ
  // ساقطاً فأُعيد أوّلُ أثرٍ حقيقيّ على الحَكَم الخطأ فسقط كلُّه (١٧ أغسطس ٢٠٢٦).
  const free = item.mode === 'free' ? { free: true } : {};
  if (item.eye === 'accept') return { ...free, accept: true };
  if (item.eye === 'reject') return { ...free, accept: false };
  // أثرٌ رُدَّ بشكوى: المنتظَرُ ردُّه بشكواها هي. وأثرٌ قُبل: المنتظَرُ قبولُه.
  if (item.kind === 'fault') return { ...free, accept: false, fault: item.code };
  return { ...free, accept: Boolean(item.accepted) };
}

/** وصفُ الحالة بعبارةٍ تُقرأ — فالعدّةُ تُقرأ كما تُشغَّل. */
function noteOf(item, i) {
  const where = `${item.ch || '؟'} ${item.form || ''}`.trim();
  if (item.eye) {
    return `ميدان ${i}: «${where}» في نمط ${item.mode || '؟'}${item.tool ? ` بـ${item.tool}` : ''} — `
      + (item.eye === 'accept'
        ? `**كتبه الطفلُ صحيحاً وردَّه المحرّك** (${item.code || 'بلا شكوى'}): المنتظَرُ قبولُه`
        : '**كتبه الطفلُ خطأً وقبله المحرّك**: المنتظَرُ ردُّه')
      + ' — حكمُ عينِ بالغٍ حاضر';
  }
  return item.kind === 'fault'
    ? `ميدان ${i}: «${where}» في نمط ${item.mode || '؟'} — ردَّه المحرّكُ بشكوى ${item.code}`
    : `ميدان ${i}: «${where}» في نمط ${item.mode || '؟'} — `
      + `${item.accepted ? 'قُبل' : 'لم يُقبَل'}`
      + (item.maxLateral !== undefined
        ? ` (أقصى انحراف ${item.maxLateral} من سماحة ${item.lateral}، تغطية ${item.coverage}٪)`
        : '');
}

/**
 * تحويلُ دفتر الميدان حالاتٍ في العدّة.
 *
 * **والمسارُ المرجعيّ يُسمّى ولا يُنسَخ**: الحالةُ تشير إلى `ref` باسمه، ومساراتُ
 * الحروف في `app/js/paths.js` — فاسمُ الحالة يحمل الحرفَ وشكلَه، ويتكفّل
 * `test_pen.mjs` بمقابلة الاسم بمسار موجود.
 */
export function toCases(book) {
  const items = Array.isArray(book?.items) ? book.items : [];
  return items.map((item, i) => ({
    id: `field-${String(i + 1).padStart(3, '0')}-${item.ch || 'x'}-${item.form || 'x'}`,
    expect: expectOf(item),
    note: noteOf(item, i + 1),
    origin: 'field',
    ref: `${item.ch}/${item.form}`,
    strokes: item.strokes,
  })).filter((c) => Array.isArray(c.strokes) && c.strokes.length
    && c.strokes.every((s) => Array.isArray(s) && s.length > 1
      && s.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite))));
}

function selfTest() {
  let fails = 0;
  const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

  const book = {
    items: [
      { ch: 'ب', form: 'isolated', mode: 'free', kind: 'fault', code: 'start-end',
        strokes: [[[10, 10], [20, 20], [30, 30]]] },
      { ch: 'ب', form: 'isolated', mode: 'free', kind: 'done', accepted: true,
        maxLateral: 40, lateral: 90, coverage: 96,
        strokes: [[[10, 10], [20, 20]]] },
      { ch: 'ن', form: 'isolated', mode: 'free', kind: 'done', accepted: true, strokes: [] },
    ],
  };
  const cases = toCases(book);
  ok(cases.length === 2, `الأثرُ بلا ضرباتٍ يسقط ولا يدخل العدّة (${cases.length} من ٣)`);
  ok(cases.every((c) => c.origin === 'field'), 'وكلُّ داخلٍ من هنا مصدرُه `field` — لا يلتبس بالمصنوع');
  ok(cases[0].expect.accept === false && cases[0].expect.fault === 'start-end',
    'وحكمُ المردود شكواه بعينها — من المحرّك ساعةَ الالتقاط لا من ظنّ المستورِد');
  ok(cases[1].expect.accept === true, 'وحكمُ المقبول قبولُه');
  ok(cases.every((c) => c.note && c.id && c.ref), 'ولكلِّ حالةٍ اسمٌ وعلّةٌ ومسارٌ مسمّى');
  ok(new Set(cases.map((c) => c.id)).size === cases.length, 'ولا معرّفَ مكرَّر');

  // **والتحذيرُ يُحدَّث حين تدخل المادّة**: العدّةُ تُطالِب بذلك من نفسها
  // (`make_pen_traces.mjs --self-test`)، وهذا يجيبها.
  const saved = JSON.parse(readFileSync(OUT, 'utf8'));
  const field = saved.cases.filter((c) => c.origin === 'field');
  ok(field.length === 0 ? saved.warning.includes(OLD_WARNING) : !saved.warning.includes(OLD_WARNING),
    field.length
      ? `في العدّة ${field.length} مساراً ميدانياً، وتحذيرُها محدَّث`
      : 'ولا مسارَ ميدانياً في العدّة بعدُ — والتحذيرُ صادقٌ كما هو، والدَّينُ قائم');

  console.log(fails ? `\n${fails} فشل` : '\nمستورِدُ الميدان سليم (بلا ملفٍّ ولا شبكة).');
  return fails ? 1 : 0;
}

const args = process.argv.slice(2);
// (الرايةُ تُقرأ من `process.argv` بحرفها — بها يجدها جردُ `test_selftests.mjs`)
if (process.argv.includes('--self-test')) process.exit(selfTest());

const file = args.find((a) => !a.startsWith('--'));
if (!file || !existsSync(file)) {
  console.log('استعمال: node tools/import_traces.mjs <ملفّ الميدان.json> [--write]');
  process.exit(1);
}

const book = JSON.parse(readFileSync(file, 'utf8'));
const cases = toCases(book);
console.log(`في الملفّ ${(book.items || []).length} أثراً، صالحٌ منها ${cases.length}:`);
for (const c of cases) console.log(`  · ${c.id} — ${c.note}`);

if (!args.includes('--write')) {
  console.log('\n(جردٌ فقط — أضِف `--write` لإدخالها العدّة)');
  process.exit(0);
}

const saved = JSON.parse(readFileSync(OUT, 'utf8'));
const known = new Set(saved.cases.map((c) => c.id));
const fresh = cases.filter((c) => !known.has(c.id));
saved.cases = [...saved.cases, ...fresh];
// **ولا مسارَ مرجعيّ يُنسَخ**: مساراتُ الحروف تُقرأ من `app/js/paths.js` باسمها.
if (saved.cases.some((c) => c.origin === 'field')) {
  saved.warning = 'فيها مساراتُ ميدانٍ حقيقية (origin: field) مع المصنوعة — '
    + 'المصنوعةُ تُثبت حكمَ المحرّك، والميدانيةُ تعاير سماحتَه';
}
writeFileSync(OUT, `${JSON.stringify(saved, null, 1)}\n`);
console.log(`\nأُدخلت ${fresh.length} حالةً ميدانية (والعدّةُ الآن ${saved.cases.length}).`);
console.log('شغّل الآن: node tools/test_pen.mjs — وعليها تُعايَر العتبات، لا بالظنّ.');
