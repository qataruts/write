// **حاسبُ معدّلَي الميدان** — الرفضُ الكاذب والقبولُ الكاذب، من دفتر الميدان وكشفِ العين:
//   node tools/field_rates.mjs <ملفّ الميدان.json> <كشف-العين.txt>
//   node tools/field_rates.mjs <…> <…> --out tools/field_disputes.json   # يكتب ملفَّ الخلافات للاستيراد
//   node tools/field_rates.mjs --self-test                                # بلا ملفٍّ ولا شبكة
//
// ————— لماذا كشفٌ منفصل بيد بالغ —————
//
// دفترُ الميدان (`?dev=1`) يحفظ **حكمَ المحرّك** مع الأثر — وهو نصفُ القياس. النصفُ
// الآخر **حكمُ عينِ بالغٍ حاضر**: أكتبَ الطفلُ الحرفَ صحيحاً أم لا؟ ولا يعرفه جهازٌ
// ولا يُستنبَط من أثر. فيُكتب سطراً سطراً بيدٍ حاضرة (`docs/FIELD_SHEET.md`)،
// وهنا يُقابَل بالدفتر بالترتيب.
//
// **والمعدّلان مشروطان لا مطلقان** (فالنسبةُ إلى مقامها الصحيح):
//   · **الرفضُ الكاذب** = (كتبه صحيحاً فردَّه المحرّك) ÷ (كلُّ ما حكمت العينُ بصحّته).
//   · **القبولُ الكاذب** = (كتبه خطأً فقبله المحرّك) ÷ (كلُّ ما حكمت العينُ بخطئه).
// وقسمةُ الاثنين على مجموع الحالات كلِّها تُصغّر العددَ وتخفي العيب — فلا تُقسم هنا.
//
// **والعتبتان مُعلَنتان قبل القياس** في `docs/FIELD_TRIAL.md §١` (رفضٌ كاذب ≤٥٪ ·
// قبولٌ كاذب ≤٥٪ · وصفرٌ لصنف الاتجاه) — وهذه الأداةُ **تقيس ولا تعاير**: لا تمسّ
// عتبةً في `pen.js` ولا تكتب فيه حرفاً.

import { readFileSync, writeFileSync } from 'node:fs';

const YES = new Set(['صح', 'صحيح', '✓', 'ص', 'y']);
const NO = new Set(['خطأ', 'خطا', '✗', 'خ', 'n']);
const FINGER = new Set(['إصبع', 'اصبع', 'finger', 'ص']);
const PEN = new Set(['قلم', 'pen', 'ق']);

/** حكمُ المحرّك على حالةٍ من الدفتر: أقُبِلت؟ (سطرُ الشكوى `kind:'fault'` ردٌّ). */
export const engineAccepted = (item) => item?.kind !== 'fault' && Boolean(item?.accepted);

/**
 * كشفُ العين نصّاً ← أسطراً مفهومة. كلُّ سطر: `<رقم> <إصبع|قلم> <صح|خطأ>`،
 * و`#` تعليقٌ، والفارغُ يُهمل، و`-` حالةٌ أُلغيت (لا تدخل حساباً).
 */
export function parseTally(text) {
  const rows = [];
  for (const [n, raw] of String(text).split('\n').entries()) {
    const line = raw.split('#')[0].trim();
    if (!line) continue;
    const [num, tool, eye] = line.split(/\s+/);
    const index = Number(num);
    if (!Number.isInteger(index) || index < 1) throw new Error(`سطر ${n + 1}: رقمُ الحالة ليس عدداً — «${line}»`);
    if (tool === '-' || eye === '-') continue;
    const isFinger = FINGER.has(tool); const isPen = PEN.has(tool);
    if (!isFinger && !isPen) throw new Error(`سطر ${n + 1}: الأداةُ «${tool}» ليست إصبعاً ولا قلماً`);
    if (!YES.has(eye) && !NO.has(eye)) throw new Error(`سطر ${n + 1}: حكمُ العين «${eye}» ليس صحّاً ولا خطأً`);
    rows.push({ index, tool: isPen ? 'قلم' : 'إصبع', eyeRight: YES.has(eye) });
  }
  return rows;
}

/** مقابلةُ الكشف بالدفتر: لكلِّ سطرٍ حالتُه وحكماها، والخلافُ مُعلَّم. */
export function join(book, rows) {
  const items = Array.isArray(book?.items) ? book.items : [];
  return rows.map((row) => {
    const item = items[row.index - 1];
    if (!item) throw new Error(`الحالة ${row.index} في الكشف ولا نظيرَ لها في الدفتر (فيه ${items.length})`);
    const accepted = engineAccepted(item);
    return {
      ...row,
      item,
      accepted,
      falseReject: row.eyeRight && !accepted,
      falseAccept: !row.eyeRight && accepted,
    };
  });
}

const pct = (a, b) => (b ? Math.round((a * 1000) / b) / 10 : 0);

/** المعدّلان المشروطان — إجمالاً ولكلِّ أداة. */
export function rates(joined) {
  const of = (rows) => {
    const right = rows.filter((r) => r.eyeRight);
    const wrong = rows.filter((r) => !r.eyeRight);
    const fr = right.filter((r) => r.falseReject);
    const fa = wrong.filter((r) => r.falseAccept);
    return {
      cases: rows.length,
      right: right.length,
      wrong: wrong.length,
      falseReject: fr.length,
      falseAccept: fa.length,
      frRate: pct(fr.length, right.length),
      faRate: pct(fa.length, wrong.length),
    };
  };
  return {
    all: of(joined),
    finger: of(joined.filter((r) => r.tool === 'إصبع')),
    pen: of(joined.filter((r) => r.tool === 'قلم')),
  };
}

/**
 * ملفُّ الخلافات للتجميد: **الحكمُ المنتظَر حكمُ العين لا حكمُ المحرّك** — فيدخل
 * `import_traces.mjs` بحقل `eye`، وتبقى الحالةُ حمراءَ حتى تُعايَر السماحة.
 */
export const disputesFile = (joined) => ({
  what: 'خلافاتُ العين والمحرّك من جلسة ميدانٍ — حكمُها المنتظَر حكمُ العين',
  origin: 'field',
  items: joined.filter((r) => r.falseReject || r.falseAccept)
    .map((r) => ({ ...r.item, eye: r.falseReject ? 'accept' : 'reject', tool: r.tool })),
});

const arNum = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

function report(rates_, joined) {
  const line = (name, r) => console.log(
    `  ${name.padEnd(7)} حالات ${arNum(r.cases).padStart(3)} · صحيحةٌ بالعين ${arNum(r.right).padStart(3)}`
    + ` · خاطئةٌ بالعين ${arNum(r.wrong).padStart(3)}`
    + ` ⇐ **رفضٌ كاذب ${arNum(r.falseReject)}/${arNum(r.right)} = ${arNum(r.frRate)}٪**`
    + ` · **قبولٌ كاذب ${arNum(r.falseAccept)}/${arNum(r.wrong)} = ${arNum(r.faRate)}٪**`,
  );
  console.log('\n— معدّلا الميدان (العتبتان المعلنتان: ٥٪ و٥٪، وصفرٌ لصنف الاتجاه) —');
  line('الكلّ', rates_.all); line('إصبع', rates_.finger); line('قلم', rates_.pen);
  const disputes = joined.filter((r) => r.falseReject || r.falseAccept);
  console.log(`\n— الخلافُ ${arNum(disputes.length)} حالة —`);
  for (const d of disputes) {
    console.log(`  ${d.falseReject ? 'رفضٌ كاذب' : 'قبولٌ كاذب'}: الحالة ${arNum(d.index)} (${d.tool})`
      + ` «${d.item.ch || '؟'} ${d.item.form || ''}» نمط ${d.item.mode || '؟'}`
      + (d.item.code ? ` — شكوى ${d.item.code}` : ''));
  }
  const bad = rates_.all.frRate > 5 || rates_.all.faRate > 5;
  console.log(`\n${bad ? '⚠ معدّلٌ فوق عتبته المعلنة — المعايرةُ واجبة، ثم قياسٌ على عيّنةٍ جديدة'
    : 'المعدّلان دون عتبتيهما المعلنتين'}`);
}

function selfTest() {
  let fails = 0;
  const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

  const book = {
    items: [
      { ch: 'ب', form: 'isolated', mode: 'free', kind: 'done', accepted: true, strokes: [[[1, 1], [2, 2]]] },
      { ch: 'ن', form: 'isolated', mode: 'free', kind: 'fault', code: 'start-end', strokes: [[[1, 1], [2, 2]]] },
      { ch: 'م', form: 'isolated', mode: 'free', kind: 'done', accepted: true, strokes: [[[1, 1], [2, 2]]] },
      { ch: 'س', form: 'isolated', mode: 'free', kind: 'fault', code: 'lateral', strokes: [[[1, 1], [2, 2]]] },
    ],
  };
  const rows = parseTally([
    '# رقم · أداة · حكم العين',
    '1 إصبع صح', // وفاق: كتب صحيحاً وقُبل
    '2 إصبع صح', // **رفضٌ كاذب**: كتب صحيحاً فرُدّ
    '3 قلم خطأ', //  **قبولٌ كاذب**: كتب خطأً فقُبل
    '4 قلم خطأ', // وفاق: كتب خطأً فرُدّ
    '5 - -', //     حالةٌ أُلغيت
  ].join('\n'));
  ok(rows.length === 4, `الكشفُ يقرأ أربعةَ أسطرٍ ويُسقط الملغى (${rows.length})`);

  const joined = join(book, rows);
  const r = rates(joined);
  ok(r.all.frRate === 50, `الرفضُ الكاذب ١ من صحيحتين = ٥٠٪ (${r.all.frRate})`);
  ok(r.all.faRate === 50, `القبولُ الكاذب ١ من خاطئتين = ٥٠٪ (${r.all.faRate})`);
  ok(r.finger.cases === 2 && r.pen.cases === 2, 'والأداتان مفصولتان في الحساب');
  ok(r.finger.falseReject === 1 && r.pen.falseAccept === 1, 'وكلُّ خلافٍ في عمود أداته');

  const d = disputesFile(joined);
  ok(d.items.length === 2, `ملفُّ الخلافات حالتان (${d.items.length})`);
  ok(d.items[0].eye === 'accept' && d.items[1].eye === 'reject',
    '**وحكمُها المنتظَر حكمُ العين**: المردودةُ ظلماً يُنتظَر قبولُها، والمقبولةُ خطأً يُنتظَر ردُّها');

  const empty = rates(join(book, parseTally('')));
  ok(empty.all.frRate === 0 && empty.all.cases === 0, 'وكشفٌ فارغ لا يكسر الحساب ولا يدّعي صفراً حسناً');

  let threw = false;
  try { parseTally('1 ريشة صح'); } catch { threw = true; }
  ok(threw, 'وأداةٌ لا يعرفها الكشفُ تُبلّغ عن نفسها ولا تُبتلع');

  console.log(fails ? `\n${fails} فشل` : '\nحاسبُ المعدّلين سليم — والعينُ مقامُ نسبتها');
  process.exit(fails ? 1 : 0);
}

const args = process.argv.slice(2);
if (args.includes('--self-test')) selfTest();
else {
  const [bookPath, tallyPath] = args.filter((a) => !a.startsWith('--'));
  if (!bookPath || !tallyPath) {
    console.log('الاستعمال: node tools/field_rates.mjs <ملفّ الميدان.json> <كشف-العين.txt> [--out ملفّ.json]');
    process.exit(2);
  }
  const book = JSON.parse(readFileSync(bookPath, 'utf8'));
  const joined = join(book, parseTally(readFileSync(tallyPath, 'utf8')));
  report(rates(joined), joined);
  const outAt = args.indexOf('--out');
  if (outAt >= 0 && args[outAt + 1]) {
    writeFileSync(args[outAt + 1], `${JSON.stringify(disputesFile(joined), null, 1)}\n`);
    console.log(`\nوخلافاتُها في ${args[outAt + 1]} — تُجمَّد بـ node tools/import_traces.mjs ${args[outAt + 1]} --write`);
  }
}
