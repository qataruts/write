// حارسُ مسارات النسخ (الجلسة ٨) بلا متصفّح:
//   node tools/test_words.mjs
//
// أخو `test_paths.mjs` في بابه ومادّتُه غيرُ مادّته: ذاك يحكم على **الحرف بأشكاله**،
// وهذا على **الكلمة كلِّها** — الوصلاتُ وكلماتُ النسخ وأسطرُ المسافة التي تؤلّفها
// عدّةُ الجلسة ٨ من خيال الكلمة المُشكَّل (`tools/make_paths.html §٧ج`).
//
// وأسئلتُه أربعة، وكلُّها مقيسةٌ لا مدَّعاة:
//   ١) **التغطية**: لكلِّ مادّةٍ يطلبها المنهجُ نسخاً مسارُها — ولا مسارَ بلا مادّة.
//   ٢) **الحكم**: الصحيحُ يُقبَل والمعكوسُ يُرَدّ، على كل كلمة.
//   ٣) **احتمالُ الرجفة**: كم تحتمل يدُ الطفل في كلِّ كلمةٍ من انحراف؟ ويُقابَل
//      بعهد `child-drift` (نصفُ سماحة المحرّك) **بسماحة محطة النسخ التي تملكها**.
//   ٤) **الوصلُ والعلاماتُ والسطر**: القطعُ الموصولةُ لا يُرفَع فيها القلم، والنقاطُ
//      بعد جسم الكلمة كلِّه، ولكلِّ كلمةٍ سطرُ جلوسها.

import { readFileSync } from 'node:fs';

const APP = new URL('../app/', import.meta.url);
const read = (path) => readFileSync(new URL(path, APP), 'utf8');

const pen = await import(new URL('js/pen.js', APP));
const curriculum = await import(new URL('js/curriculum.js', APP));
const words = await import(new URL('js/word_paths.js', APP));

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

const entries = Object.entries(words.WORD_PATHS);

// ————— يدٌ مصنوعة: مشيةٌ على المسار بخطوةٍ ثابتة وانحرافٍ موصوف —————
//
// **تُحسب لحظةَ الفحص** (سنّةُ `test_paths.mjs`): المحروسُ هنا المساراتُ لا المحرّك،
// فالضرباتُ تتبع مسارَها ولا تُجمَّد — ولو جُمّدت لصارت شاهداً على مسارٍ قديم.

function walk(points, { from = 0, to = 1, step = 12, sway = 0 } = {}) {
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
const taps = (ref) => ref.dots.flatMap((d) => Array.from({ length: d.count || 1 }, () => [d.at, d.at, d.at]));
const trace = (ref, opts) => [...ref.strokes.map((s) => walk(s.points, opts)), ...taps(ref)];

// ————— ١) التغطية: مادّةُ النسخ كلُّها مؤلَّفة —————

console.log('\n— ١) التغطية: لكلِّ ما يُنسَخ مسارُه —');
const stage = curriculum.STAGES.find((s) => s.kind === 'join');
const material = (stage?.nodes || []).flatMap((n) => [...(n.joins || []), ...(n.words || [])]);
ok(entries.length > 0, `مساراتُ النسخ ${entries.length} — منها ${material.length} تطلبها محطةُ الوصل`);

const missing = material.filter((text) => !words.WORD_PATHS[text]);
ok(missing.length === 0, 'ولا مادّةَ في محطة الوصل بلا مسار'
  + (missing.length ? ` — ناقص: ${missing.join('، ')}` : ''));

// **وكلماتُ الجداول كلُّها** (تحتاجها المراجعةُ والبوابةُ والجلستان ٩ و١٠)
const bank = Object.keys(curriculum.WORDS).filter((text) => !words.WORD_PATHS[text]);
ok(bank.length === 0, `وكلُّ كلمةٍ في جدول المنهج لها مسارُها (${Object.keys(curriculum.WORDS).length} كلمة)`
  + (bank.length ? ` — ناقص: ${bank.join('، ')}` : ''));

// **ولا مسارَ لا مادّةَ له**: ما ليس مادّةً ولا سطرَ مسافةٍ من كلمتين دخيلٌ
const known = new Set([...material, ...Object.keys(curriculum.WORDS)]);
const alien = entries.map(([text]) => text).filter((text) => !known.has(text)
  && !text.split(' ').every((one) => known.has(one)));
ok(alien.length === 0, 'ولا مسارَ في الوحدة بلا مادّةٍ تطلبه'
  + (alien.length ? ` — دخيل: ${alien.join('، ')}` : ''));

ok(entries.every(([, ref]) => ref.strokes?.length && ref.strokes.every((s) => s.start)),
  'ولكلِّ كلمةٍ أجزاءٌ ببداياتٍ معلنة');
ok(entries.every(([, ref]) => typeof ref.line === 'number' && ref.line > 0 && ref.line < pen.GRID),
  'ولكلِّ كلمةٍ **سطرُ جلوسها** على الشبكة — يرسمه لوحُ النسخ مسطرةً');

// ————— ٢) الحكم: الصحيحُ يُقبَل والمعكوسُ يُرَدّ —————

console.log('\n— ٢) الحكم على كل كلمةٍ صحيحةً ومعكوسة —');
let judged = 0;
const wrongVerdict = [];
for (const [text, ref] of entries) {
  const good = pen.judge(ref, trace(ref));
  // **والمعكوسُ عكسُ القطع كلِّها بترتيبها المقلوب** — كما يكتبها من عكس الحركة
  const back = pen.judge(ref, [...[...ref.strokes].reverse().map((s) => walk(s.points, { from: 1, to: 0 })), ...taps(ref)]);
  judged++;
  if (!good.accepted || back.accepted) {
    wrongVerdict.push(`${text}: الصحيحُ ${good.accepted ? 'يُقبَل' : `يُرفَض «${good.primary}»`}`
      + ` · المعكوسُ ${back.accepted ? '**يُقبَل وهو خطأ**' : `يُرَدّ «${back.primary}»`}`);
  }
}
ok(wrongVerdict.length === 0, `الكلماتُ ${judged}: الصحيحُ يُقبَل والمعكوسُ يُرَدّ في كلِّها`
  + (wrongVerdict.length ? `\n      ${wrongVerdict.slice(0, 8).join('\n      ')}` : ''));

// **والمعكوسُ مرفوضٌ باتجاهه لا بدقّته**: تُضاعَف السماحةُ فيبقى مرفوضاً
const stubborn = entries.filter(([, ref]) => !pen.judge(ref,
  [...[...ref.strokes].reverse().map((s) => walk(s.points, { from: 1, to: 0 })), ...taps(ref)],
  { tolerance: 2 }).accepted);
ok(stubborn.length === entries.length,
  `والمعكوسُ يُرَدّ ولو ضوعفت السماحة (${stubborn.length}/${entries.length})`);

// **والنقاطُ بعد جسم الكلمة كلِّه** — قاعدةُ الخطّ المدرسيّ ممتدّةً إلى الكلمة
const dotted = entries.filter(([, ref]) => ref.dots.length);
ok(dotted.length > 0, `والمنقوطُ من الكلمات ${dotted.length}`);
const early = dotted.filter(([, ref]) =>
  pen.judge(ref, [...taps(ref), ...ref.strokes.map((s) => walk(s.points))]).primary !== pen.FAULTS.DOTS_FIRST);
ok(early.length === 0, 'والنقطةُ قبل الجسم تُردّ بخطئها في المنقوط كلِّه'
  + (early.length ? ` — سكت عن: ${early.map(([t]) => t).join('، ')}` : ''));

// ————— ٣) احتمالُ الرجفة بسماحة الكلمة التي تحملها —————
//
// **وسماحةُ الكلمة تسافر معها** (`METHOD.md §٣.٥`: «السماحةُ تملكها المحطة»): سماحاتُ
// المحرّك أطوالٌ مطلقةٌ مُعايَرةٌ على **حرفٍ يملأ صندوقَه** (قرارُ الجلسة ٢)، وحرفُ
// الكلمة جزءٌ من صندوقها — فتُشَدّ سماحاتُه بمقياس تصغيره، ويُقيَّد المقياسُ في
// المسار نفسِه (`tolerance`) فيقرؤه اللوحُ ويقرؤه هذا الحارس من مصدرٍ واحد.
//
// **والعهدُ عهدُ `child-drift`** (نصفُ السماحة يُقبَل) — بسماحة الكلمة لا بسماحة الحرف.

console.log('\n— ٣) احتمالُ الرجفة: بسماحة كلِّ كلمةٍ التي تحملها —');
ok(entries.every(([, ref]) => typeof ref.tolerance === 'number' && ref.tolerance > 0 && ref.tolerance <= 1),
  'ولكلِّ كلمةٍ سماحتُها في مسارها — مقياسُ حروفها فيها');
const FLOOR = 0.5;
const room = entries.map(([text, ref]) => {
  const lateral = pen.TOLERANCE.lateral * ref.tolerance;
  let max = 0;
  for (let sway = 0; sway <= lateral; sway += 1) {
    if (!pen.judge(ref, trace(ref, { sway }), { tolerance: ref.tolerance }).accepted) break;
    max = sway;
  }
  return { text, max, floor: lateral * FLOOR, ratio: max / (lateral * FLOOR) };
});
const thin = room.filter((r) => r.max < r.floor);
const worst = [...room].sort((a, b) => a.ratio - b.ratio)[0];
ok(thin.length === 0,
  `الكلماتُ ${room.length} كلُّها فوق العهد — أضيقُها «${worst.text}» ${worst.max}`
  + ` من أرضية ${worst.floor.toFixed(0)} (×${worst.ratio.toFixed(2)})`
  + (thin.length ? `\n      دون العهد: ${thin.map((r) => `${r.text} ${r.max}<${r.floor.toFixed(0)}`).join(' · ')}` : ''));

// **وما دون العهد يُقاس سببُه ولا يُترَك رقماً**: أهو **انطباقٌ لم يُعلَن** (فيُعاد
// إلى المولّد بحكم المدير) أم **انحناءٌ** يتقهقر عنده الإسقاط (فهو معايرةُ سماحةٍ،
// `METHOD §٣.٥` والجلسة ١٢)؟ — فلا يبقى أحمرُ بلا تشخيص.
if (thin.length) {
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const kinds = { انطباق: [], انحناء: [] };
  for (const row of thin) {
    const ref = words.WORD_PATHS[row.text];
    const apart = pen.TOLERANCE.back * ref.tolerance * 2;
    let closest = Infinity;
    for (const s of ref.strokes) {
      const poly = pen.prepare(s.points);
      const inFold = (i) => (s.folds || []).some((f) => i >= f.from && i <= f.to);
      for (let i = 0; i < s.points.length; i++) {
        for (let j = i + 1; j < s.points.length; j++) {
          if (poly.cum[j] - poly.cum[i] < apart || (inFold(i) && inFold(j))) continue;
          closest = Math.min(closest, dist(s.points[i], s.points[j]));
        }
      }
    }
    kinds[closest < pen.TOLERANCE.lateral * ref.tolerance * 0.25 ? 'انطباق' : 'انحناء']
      .push(`${row.text}:${Math.round(closest)}`);
  }
  console.log(`      · تشخيصُ الساقط: انطباقٌ غيرُ معلَن ${kinds['انطباق'].length}`
    + ` (${kinds['انطباق'].join(' ') || '—'}) · انحناءٌ لا تطابق ${kinds['انحناء'].length}`
    + ` (${kinds['انحناء'].join(' ') || '—'})`);
}

// ————— ٤) الوصلُ والعلامات: بنيةُ الكلمة كما أُلّفت —————

console.log('\n— ٤) بنيةُ الكلمة: وصلٌ وعلاماتٌ وسطر —');
// **القطعةُ الموصولة قطعةٌ واحدة**: كلمةٌ كلُّ حروفها واصلةٌ لا يُرفَع فيها القلمُ
// إلا لعمودٍ ينزل من قمّته (حكم ١) أو لعلامةٍ أو نقطة. فيُقاس: أطولُ قطعةٍ في كلمةٍ
// موصولةٍ أطولُ من أطول حرفٍ فيها — أيْ أنّ الوصلَ وقع فعلاً ولم تُجمَع حروفٌ مفردة.
const joined = entries.filter(([text]) => text.length > 3 && !/[اردزوذلأإء ]/.test(text));
ok(joined.length > 0, `الكلماتُ الموصولةُ بلا قاطعٍ فيها: ${joined.length}`);
const notJoined = joined.filter(([, ref]) => {
  const longest = Math.max(...ref.strokes.map((s) => pen.prepare(s.points).len));
  return longest < 400;      // حرفٌ واحد في صندوق الكلمة لا يبلغ هذا الطول
});
ok(notJoined.length === 0, 'وفيها قطعةٌ واحدة تعبر حروفَها — فالوصلُ وقع ولم تُجمَع حروفٌ مفردة'
  + (notJoined.length ? ` — لم يقع في: ${notJoined.map(([t]) => t).join('، ')}` : ''));

// **وكلُّ علامةٍ في المادّة لها شارتُها** — تُعرَض في بطاقة تعريفها
const marks = [...new Set(material.flatMap((t) => [...t]).filter((c) => /[ً-ْٰ]/.test(c)))];
const noGlyph = marks.filter((m) => !words.MARK_PATHS[m]);
ok(noGlyph.length === 0, `ولكلِّ علامةٍ في المادّة شارتُها من مسارها (${marks.length} علامات)`
  + (noGlyph.length ? ` — بلا شارة: ${noGlyph.join(' ')}` : ''));
ok(Object.values(words.MARK_PATHS).every((ref) => ref.strokes?.length
  && ref.strokes.every((s) => s.start && s.points.length > 1)),
  'وشاراتُ العلامات مساراتٌ ببداياتٍ لا صورٌ — العلامةُ تُكتب كما تُعرَض');

// **وأسطرُ المسافة كلمتان بينهما فراغ** — مادّةُ «المسافة بين الكلمات»
const pairs = entries.filter(([text]) => text.includes(' '));
ok(pairs.length > 0, `وأسطرُ المسافة ${pairs.length} — كلمتان في سطرٍ واحد`);
const glued = pairs.filter(([text, ref]) => {
  const [right] = text.split(' ');
  const rightEnd = Math.min(...ref.strokes.flatMap((s) => s.points).map((p) => p[0]));
  return right.length && rightEnd > pen.GRID;      // حارسٌ صوريّ: النقاط داخل الشبكة
});
ok(glued.length === 0, 'وكلُّها داخل الشبكة');

// ————— ٥) الوصل: الوحدةُ مولَّدةٌ وفي مخزون العمل دون إنترنت —————

console.log('\n— ٥) الوصل —');
const module = read('js/word_paths.js');
ok(/ملفٌّ مولَّد — لا يُحرَّر بيد/.test(module) && /make_paths\.py --build/.test(module),
  'ووحدةُ مسارات النسخ تُعلن أنها مولَّدةٌ وتُسمّي مولِّدَها');
ok(/export const WORD_PATHS_SOURCE/.test(module), 'وتحمل نسبَها ببصماته');
ok(read('sw.js').includes("'js/word_paths.js'"), 'وهي في مخزون العمل دون إنترنت (`SHELL`)');

console.log(fails ? `\n${fails} فشل` : '\nمساراتُ النسخ: تغطيةٌ وحكمٌ ورجفةٌ وبنيةٌ خضرٌ');
process.exit(fails ? 1 : 0);
