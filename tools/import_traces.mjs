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
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

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
        // **والانحرافُ يُقاس إلى الحدّ الذي حُكم به** (`FIELD_TRIAL §٦`): النمطُ الحرّ
        // يُحكَم بسماحةٍ مكرَّمة، فقراءةُ الأساس وحدَه تُري تجاوزاً حيث لا تجاوز.
        // ودفترٌ قديمٌ لا يحمل `limit` **يُعلَن نقصُه** ولا يُقرأ رقمُه على غير وجهه.
        ? ` (أقصى انحراف ${item.maxLateral} من ${item.limit !== undefined
          ? `حدٍّ عامل ${item.limit}${item.ease && item.ease !== 1 ? ` = ${item.lateral}×${item.ease}` : ''}`
          : `سماحةٍ أساس ${item.lateral} — ودفترُه لا يحمل حدَّه العامل`}، تغطية ${item.coverage}٪)`
        : '');
}

/**
 * تحويلُ دفتر الميدان حالاتٍ في العدّة.
 *
 * **والمسارُ المرجعيّ يُسمّى ولا يُنسَخ**: الحالةُ تشير إلى `ref` باسمه، ومساراتُ
 * الحروف في `app/js/paths.js` — فاسمُ الحالة يحمل الحرفَ وشكلَه، ويتكفّل
 * `test_pen.mjs` بمقابلة الاسم بمسار موجود.
 */
/**
 * ————— **دفترُ جهازٍ قديمٍ يُنقَل إلى إطار السطر** (بند ص٢/ب ٤) —————
 *
 * الأثرُ يُسجَّل بإحداثيات **اللوح الذي كُتب عليه**، ولوحُ الحرف كان الشبكةَ المربّعة
 * ١٠٠٠×١٠٠٠ يملؤها الحرف. **ثم جلست الأشكالُ على سطرٍ واحدٍ في خليّة ٢٠٣٥** — فأثرٌ
 * لم يُنقَل يُقاس إلى نموذجٍ ليس مكانَه ويُردّ `start-far` وهو صحيح.
 *
 * **فيُنقَل بالتحويل الذي نُقل به نموذجُه بعينه** (`tools/line_seating.json`):
 * `p' = to + (p − from) × scale` — إزاحةٌ وتحجيمٌ منتظم، **فالعلاقةُ بين يد الطفل
 * ونموذجه محفوظةٌ بحرفها**. ودفترُ جهازٍ يكتب `frame: "line"` (وهو ما تكتبه أجهزةُ
 * اليوم بعد الجلوس) **لا يُنقَل** — فلا يُنقل أثرٌ مرّتين.
 */
const SEATING = (() => {
  try {
    const at = new URL('./line_seating.json', import.meta.url);
    return JSON.parse(readFileSync(at, 'utf8')).shapes || {};
  } catch { return {}; }
})();

export function seatStrokes(strokes, ref, frame) {
  const rule = frame === 'line' ? null : SEATING[ref];
  if (!rule) return strokes;
  const [fx, fy] = rule.from;
  const [tx, ty] = rule.to;
  return strokes.map((stroke) => stroke.map((p) => [
    Math.round((tx + (p[0] - fx) * rule.scale) * 10) / 10,
    Math.round((ty + (p[1] - fy) * rule.scale) * 10) / 10,
  ]));
}

export function toCases(book) {
  const items = Array.isArray(book?.items) ? book.items : [];
  return items.map((item, i) => ({
    id: `field-${String(i + 1).padStart(3, '0')}-${item.ch || 'x'}-${item.form || 'x'}`,
    expect: expectOf(item),
    note: noteOf(item, i + 1),
    origin: 'field',
    frame: 'line',
    ref: `${item.ch}/${item.form}`,
    strokes: seatStrokes(item.strokes || [], `${item.ch}/${item.form}`, book?.frame),
  // **والنقرةُ ضربةٌ يقبلها البابُ** (عطبُ ميدان ١٧ أغسطس ٢٠٢٦): ضربةٌ بنقطةٍ واحدة
  // هي **نقطةُ الحرف** — يعدّها `partsOf` جزءاً كالجسم ويحكم عليها `up()` بانتشارها.
  // فكان الحدُّ `> 1` يطرحها هنا كما طرحها الالتقاط، **فيدخل العدّةَ نصفُ أثر**.
  })).filter((c) => Array.isArray(c.strokes) && c.strokes.length
    && c.strokes.every((s) => Array.isArray(s) && s.length >= 1
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
        maxLateral: 40, lateral: 90, limit: 144, ease: 1.6, coverage: 96,
        strokes: [[[10, 10], [20, 20]]] },
      { ch: 'ن', form: 'isolated', mode: 'free', kind: 'done', accepted: true, strokes: [] },
      // **ونقرةُ النقطة ضربةٌ بنقطةٍ واحدة**: تدخل بضربتيها لا بجسمها وحدَه
      { ch: 'ب', form: 'isolated', mode: 'free', kind: 'done', accepted: true,
        strokes: [[[10, 10], [20, 20]], [[15, 5]]] },
    ],
  };
  const cases = toCases(book);
  ok(cases.length === 3, `الأثرُ بلا ضرباتٍ يسقط ولا يدخل العدّة (${cases.length} من ٤)`);
  ok(cases[2].strokes.length === 2 && cases[2].strokes[1].length === 1,
    'و**نقرةُ النقطة تدخل**: ضربةٌ بنقطةٍ واحدة هي نقطةُ الحرف — لا يُبتَر منها الأثر'
    + ' (عطبُ ميدان ١٧ أغسطس: عاد أثرُ «ب» بجسمه بلا نقطته فتبدّل حكمُه)');
  ok(cases.every((c) => c.origin === 'field'), 'وكلُّ داخلٍ من هنا مصدرُه `field` — لا يلتبس بالمصنوع');
  ok(cases[0].expect.accept === false && cases[0].expect.fault === 'start-end',
    'وحكمُ المردود شكواه بعينها — من المحرّك ساعةَ الالتقاط لا من ظنّ المستورِد');
  ok(cases[1].expect.accept === true, 'وحكمُ المقبول قبولُه');
  ok(cases.every((c) => c.note && c.id && c.ref), 'ولكلِّ حالةٍ اسمٌ وعلّةٌ ومسارٌ مسمّى');
  // **والعلّةُ تذكر الحدَّ الذي حُكم به لا الأساسَ وحدَه** (عطبُ سجلٍّ أُصلح، `FIELD_TRIAL §٦`)
  ok(cases[1].note.includes('حدٍّ عامل 144') && cases[1].note.includes('90×1.6'),
    'وانحرافُ الأثر يُقرأ إلى **حدِّه العامل** ومعاملِه لا إلى السماحة الأساس');
  ok(toCases({ items: [{ ch: 'ب', form: 'isolated', mode: 'free', kind: 'done', accepted: true,
    maxLateral: 40, lateral: 90, coverage: 96, strokes: [[[10, 10], [20, 20]]] }] })[0]
    .note.includes('لا يحمل حدَّه العامل'),
    'ودفترٌ من قبل الإصلاح يُعلن نقصَه — فلا يُقرأ رقمُه على غير وجهه');
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

function main() {
  const args = process.argv.slice(2);
  // (الرايةُ تُقرأ من `process.argv` بحرفها — بها يجدها جردُ `test_selftests.mjs`)
  if (process.argv.includes('--self-test')) return selfTest();

  const file = args.find((a) => !a.startsWith('--'));
  if (!file || !existsSync(file)) {
    console.log('استعمال: node tools/import_traces.mjs <ملفّ الميدان.json> [--write] [--only <أسماء>]');
    return 1;
  }

  const book = JSON.parse(readFileSync(file, 'utf8'));
  const all = toCases(book);
  /**
   * **ولا يُجمَّد إلا ما طابق** (بندُ جلسة ك، ١٧ أغسطس ٢٠٢٦): أثرٌ لا يُعاد على
   * المحرّك بحكمه ساعةَ الالتقاط شاهدٌ كاذب — ومَن أراد تجميدَ ما طابق وحدَه سمّاه
   * بـ`--only`، فيبقى الخامُ في `tools/field_traces/` كما هو ولا يُحرَّر بيد.
   */
  const only = args.includes('--only')
    ? new Set(args[args.indexOf('--only') + 1].split(',').map((s) => s.trim()).filter(Boolean))
    : null;
  const cases = only ? all.filter((c) => only.has(c.id)) : all;
  console.log(`في الملفّ ${(book.items || []).length} أثراً، صالحٌ منها ${all.length}`
    + `${only ? `، والمسمّى منها ${cases.length}` : ''}:`);
  for (const c of cases) console.log(`  · ${c.id} — ${c.note}`);

  if (!args.includes('--write')) {
    console.log('\n(جردٌ فقط — أضِف `--write` لإدخالها العدّة)');
    return 0;
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
  return 0;
}

// **تُشغَّل مباشرةً فتعمل، وتُستورَد فتُعطي `toCases` ولا تفعل شيئاً**: حارسُ المحرّك
// يمشي بها طريقَ الالتقاط كاملاً (`test_pen.mjs §١د`) — **اشتقاقٌ واحدٌ لا نسخةٌ
// ثانية**، ولولا هذا الشرطُ لَخرجت الأداةُ بالعملية من تحت مستوردِها.
if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '')) {
  process.exit(main());
}
