// **حارسُ الحَكَم الكلّيّ** (`judgeShape`، جلسة ن١ من `ENGINE_RESCUE.md §٤`) — بلا متصفّح:
//   node tools/test_shape.mjs
//
// **ومعيارُه الأوّل عينُ الأب لا حالةٌ مصنوعة** (`SHAPE_JUDGE §٧`): ستّون كتابةً من
// يدَي طفلتين، حُكم عليها بحكمٍ أعمى (الإنسانُ أوّلاً ثم يُكشَف حكمُ المحرّك)، وهي
// `field/2026-08-20-arena-all.json`. والمصنوعُ بعدها **يحرس القاعدةَ لا يقوم مقامَ
// الميدان**.
//
// **وكلُّ قاعدةٍ هنا مجرَّبةٌ سالباً** (§٦، سنّةُ `test_pen.mjs §١`): تُعطَّل القاعدةُ
// في **نسخةِ ذاكرةٍ** من المحرّك (`data:` — لا يُكتب ملفٌّ ولا يُمَسّ الأصل)، فإن بقي
// فحصُها أخضرَ فليس حارساً. **وحارسٌ لا يُجرَّب على ما يُفترض أن يمسكه ليس حارساً.**
//
// **ويطبع تقدّمَه سطراً سطراً** (عهدُ «الأداةُ تنبض»): كلُّ بابٍ يُعلن حصيلتَه ساعةَ
// يفرغ منه، فلا صمتَ يُنتظَر آخرُه.

import { readFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const pen = await import(new URL('app/js/pen.js', ROOT));
const { PATHS } = await import(new URL('app/js/paths.js', ROOT));

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };
const pc = (n) => `${(n * 100).toFixed(1)}٪`;

/* ————— نسخةُ ذاكرةٍ من المحرّك بقاعدةٍ معطَّلة — للتجريب السالب ————— */
const SRC = readFileSync(new URL('app/js/pen.js', ROOT), 'utf8');
async function penWithout(from, to) {
  if (!SRC.includes(from)) throw new Error(`نصُّ القاعدة لم يوجد في المحرّك: ${from}`);
  const src = SRC.replace(from, to);
  return import(`data:text/javascript;base64,${Buffer.from(src, 'utf8').toString('base64')}`);
}
/** بابٌ سالب: يُعطَّل الحارسُ فيجب أن **يحمرّ** فحصُه — وإلّا فالقاعدةُ لا تعمل. */
const negative = async (label, from, to, check) => {
  const alt = await penWithout(from, to);
  ok(await check(alt), `مجرَّبٌ سالباً: ${label}`);
};

/* ————— يدٌ نظيفةٌ تكتب النموذجَ كما هو — ومنها تُشتقّ الحالاتُ كلُّها ————— */
const clone = (s) => s.map((p) => [p[0], p[1]]);
const bodyStrokes = (ref) => pen.partsOf(ref).filter((p) => p.kind === 'stroke')
  .map((p) => p.poly.pts.map((q) => [q[0], q[1]]));
const dotSeats = (ref) => pen.partsOf(ref).filter((p) => p.kind === 'dot')
  .flatMap((p) => Array.from({ length: p.count || 1 }, () => [p.at[0], p.at[1]]));
/** نقرةٌ: ثلاثُ نقاطٍ في موضعٍ واحد — كما تترك يدٌ تنقر. */
const tapAt = (at) => [clone([at, at, at])[0], [at[0], at[1]], [at[0], at[1]]];
const traceOf = (ref) => [...bodyStrokes(ref), ...dotSeats(ref).map(tapAt)];
const tolOf = (ref) => pen.easeTolerance(pen.resolveTolerance(ref.tolerance)).lateral;
const bodyMidY = (ref) => {
  const pts = bodyStrokes(ref).flat();
  return pts.reduce((s, p) => s + p[1], 0) / pts.length;
};
const shift = (strokes, dx, dy, k = 1) => {
  const box = pen.inkBox(strokes);
  return strokes.map((s) => s.map((p) => [
    box.cx + (p[0] - box.cx) * k + dx, box.cy + (p[1] - box.cy) * k + dy,
  ]));
};
/** خطٌّ كثيفٌ بين نقطتين — به تُرسم الشَّرْطةُ والزاوية. */
const lineBetween = (a, b, n = 12) => Array.from({ length: n + 1 },
  (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);

const say = (v) => `ok=${v.ok} why=${v.why} تغطية ${pc(v.metrics.recall)}`
  + ` جزء ${pc(v.metrics.part)} دقّة ${pc(v.metrics.precision)}`;

/* ═════ ١) الميدان: ستّون كتابةً بعين الأب ═════ */
console.log('\n١) الميدان — ٦٠ كتابةً من يدَي طفلتين، وسمُها بعين الأب:');
const FIELD = JSON.parse(readFileSync(new URL('field/2026-08-20-arena-all.json', ROOT), 'utf8')).items;

function onField(engine = pen) {
  let agree = 0; const falseReject = []; const falseAccept = [];
  for (const row of FIELD) {
    const ref = PATHS[row.ch]?.[row.form];
    if (!ref) continue;
    const v = engine.judgeShape(ref, row.strokes);
    const eye = row.eye === 'accept';
    if (v.ok === eye) agree++; else (eye ? falseReject : falseAccept).push({ row, v });
  }
  return { agree, falseReject, falseAccept };
}
const field = onField();
console.log(`   موافقةُ العين: ${field.agree}/60`
  + ` · ردٌّ كاذب ${field.falseReject.length} · قبولٌ كاذب ${field.falseAccept.length}`);
for (const { row, v } of [...field.falseReject, ...field.falseAccept]) {
  console.log(`      ${row.eye === 'accept' ? '🔴 رُدّ ظلماً ' : '🟠 قُبل خطأً'}`
    + ` ${row.ch}/${row.form} (${row.hand}) — ${say(v)}`);
}
ok(field.agree >= 56, `الموافقةُ ≥ ٥٦/٦٠ (المحرّكُ الماشي يومَها ٢٤/٦٠) — ${field.agree}/60`);
ok(field.falseReject.length <= 2, `والردُّ الكاذب ≤ ٢ — ${field.falseReject.length}`);
ok(field.falseAccept.length <= 2, `والقبولُ الكاذب ≤ ٢ — ${field.falseAccept.length}`);
// **ولا يقع القبولُ الكاذب إلا في صفَّي «س» المردودَين** — وسمُهما مشكوكٌ مقيَّدٌ
// (`SHAPE_JUDGE §٨`: حبرُهما على النموذج تماماً ورُدّا) ويُعرَضان على المالك في ن٣.
const outside = field.falseAccept.filter(({ row }) => !(row.ch === 'س' && row.eye === 'reject'));
console.log(`      · صفّا «س» المشكوكان: ${FIELD.filter((r) => r.ch === 'س' && r.eye === 'reject')
  .map((r) => `${r.ch}/${r.form}(${r.hand})`).join(' · ')}`);
ok(outside.length === 0, `والقبولُ الكاذب لا يقع إلا فيهما — خارجَهما ${outside.length}`);
// **وفارقُ اليدين يُقاس ويُعلَن** (`SHAPE_JUDGE §٧.٤`) — لا يُحكَم به اليوم.
for (const hand of ['right', 'left']) {
  const rows = FIELD.filter((r) => r.hand === hand && PATHS[r.ch]?.[r.form]);
  const bad = rows.filter((r) => pen.judgeShape(PATHS[r.ch][r.form], r.strokes).ok !== (r.eye === 'accept'));
  console.log(`      · اليد ${hand === 'right' ? 'اليمنى' : 'اليسرى'}: ${rows.length - bad.length}/${rows.length}`);
}

/* ═════ ٢) مصفوفةُ الأخوات: ما لا يفرّقه إلا النقط ═════ */
console.log('\n٢) مصفوفةُ الأخوات — تسعُ أسرٍ في المعزول والوسطيّ:');
const FAMILIES = [['ب', 'ت', 'ث', 'ن', 'ي'], ['ج', 'ح', 'خ'], ['د', 'ذ'], ['ر', 'ز'],
  ['ط', 'ظ'], ['ص', 'ض'], ['ع', 'غ'], ['س', 'ش'], ['ف', 'ق']];
function onSisters(engine = pen) {
  let pass = 0; const miss = [];
  for (const family of FAMILIES) {
    for (const a of family) {
      for (const b of family) {
        for (const form of ['isolated', 'medial']) {
          const ra = PATHS[a]?.[form]; const rb = PATHS[b]?.[form];
          if (!ra || !rb) continue;
          const v = engine.judgeShape(rb, traceOf(ra));
          if (v.ok === (a === b)) pass++;
          else miss.push(`${a}⇐${b}/${form.slice(0, 4)} ${v.ok ? 'قُبل!' : `رُدّ! (${v.why})`}`);
        }
      }
    }
  }
  return { pass, total: pass + miss.length, miss };
}
const sisters = onSisters();
console.log(`   ${sisters.pass}/${sisters.total}`);
for (const m of sisters.miss) console.log(`      🔴 ${m}`);
ok(sisters.miss.length === 0, `كلُّ أختٍ تُقبَل على نفسها وتُرَدّ على أخواتها — ${sisters.pass}/${sisters.total}`);

/* ═════ ٣) سوالبُ مصنوعةٌ تُرَدّ كلُّها ═════ */
console.log('\n٣) السوالبُ المصنوعة — شكلٌ خاطئ يُردّ بسببه:');
const HA = PATHS['ه'].isolated;      // بلا نقاط — فلا تشوّش العلامةُ قياسَ الجسم
const MEEM = PATHS['م'].isolated;    // بلا نقاط، وجسمٌ طويلٌ في صندوقٍ واسع
const HHA = PATHS['ح'].isolated;     // بلا نقاط — ونصفُها يسقط بالتغطية وحدَها
const NOON = PATHS['ن'].isolated;    // نقطةٌ واحدة فوق
const JEEM = PATHS['ج'].isolated;    // نقطةٌ واحدة تحت
const TA = PATHS['ت'].isolated;      // نقطتان
const THA = PATHS['ث'].isolated;     // ثلاثُ نقاط
const KAF = PATHS['ك'].isolated;     // جسمان: العمودُ وشولتُه

/**
 * **خربشةٌ كثيفةٌ فوق حرفٍ صحيح** — وهي التي تفضح التغطيةَ وحدَها: تغطيتُها ١٠٠٪.
 *
 * **وتُملأ بها فراغُ الصندوق دون ممرّ السماحة**: فالخربشةُ **خارج** الصندوق يبتلعها
 * التطبيعُ نفسُه (يُصغّر الكلَّ فيعود الحرفُ على نموذجه — قِيس: الدقّةُ ترتفع إلى
 * ٩٢٪ بها)، **والخربشةُ داخل الممرّ حبرٌ على النموذج لا زيادةٌ عليه**. فما يقيسه
 * `precision` حقّاً: **حبرٌ في فراغ الحرف**.
 */
function scribbled(ref, n = 34) {
  const box = pen.inkBox([pen.refPoints(ref)]);
  const tol = tolOf(ref);
  const ink = pen.refPoints(ref);
  const far = (p) => !ink.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= tol);
  const teeth = [];
  for (let row = 0; row <= n; row++) {
    const y = box.y0 + (box.h * row) / n;
    for (let c = 0; c <= n; c++) {
      const x = box.x0 + (box.w * (row % 2 ? n - c : c)) / n;   // ذهاباً وإياباً كما تُخربش يد
      if (far([x, y])) teeth.push([x, y]);
    }
  }
  return [...traceOf(ref), teeth];
}
/** **نصفُ الحرف**: يُرفَع القلمُ في منتصف **طول** جسمه — لا في منتصف عدد نقاطه. */
const halved = (ref, frac = 0.5) => [
  ...pen.partsOf(ref).filter((p) => p.kind === 'stroke').map((p) => {
    const pts = [];
    for (let at = 0; at <= p.poly.len * frac; at += 8) pts.push(pen.pointAt(p.poly, at).at);
    return pts;
  }),
  ...dotSeats(ref).map(tapAt),
];
/**
 * **نقاطٌ في غير جهتها**: تُقلَب حول مركز **صندوق** الجسم — فيبقى الصندوقُ على سعته
 * وينقلب موضعُ العلامة وحدَه (والقلبُ حول وسط النقاط يمطّ الصندوقَ فيهدم التطبيع).
 */
const flipped = (ref) => {
  const box = pen.inkBox(bodyStrokes(ref));
  return [...bodyStrokes(ref), ...dotSeats(ref).map((at) => tapAt([at[0], 2 * box.cy - at[1]]))];
};
/** شَرْطةُ ثلاثٍ **بلا رأس**: مدُّها صحيحٌ وارتفاعُها صفر — فهي «ت» ممطوطةٌ لا «ث». */
const flatThree = (ref) => {
  const seats = dotSeats(ref);
  const xs = seats.map((s) => s[0]);
  const y = seats.reduce((s, p) => s + p[1], 0) / seats.length;
  return [...bodyStrokes(ref), lineBetween([Math.min(...xs), y], [Math.max(...xs), y], 14)];
};

const NEGATIVE = [
  ['خربشةٌ كثيفةٌ فوق نموذجٍ صحيح', HA, scribbled(HA), 'stray-ink'],
  ['نصفُ الحرف الأول (م)', MEEM, halved(MEEM), 'part-missing'],
  // **ونصفُ «ح» يسقط بالتغطية وحدَها** (دقّتُه ١٠٠٪) — فهو بابُ العتبة السالب النظيف.
  ['نصفُ الحرف الأول (ح — بقاعدة الغياب)', HHA, halved(HHA), 'part-missing'],
  ['نقطةٌ في غير جهتها (ن ⇐ تحت)', NOON, flipped(NOON), 'dots-side'],
  // **وقلبُ نقطة الجيم حول مركز جسمها يُبقيها داخل حِضنه** — وجيمٌ نقطتُها في أعلى
  // الحِضن تُقرأ جيماً (حكمُ المناطق الثلاث، مراجعة ن٢): فالمصنوعةُ الصادقة لاسمها
  // «ج ⇐ فوق» ترفع النقطةَ **فوق الجسم كلِّه** (موضعَ الخاء) — وتلك تُرَدّ جهةً.
  ['نقطةٌ في غير جهتها (ج ⇐ فوق)', JEEM, [...bodyStrokes(JEEM),
    tapAt([dotSeats(JEEM)[0][0],
      pen.inkBox(bodyStrokes(JEEM)).y0 - 0.3 * pen.inkBox(bodyStrokes(JEEM)).h])], 'dots-side'],
  ['عددُ نقاطٍ ناقص (ت بنقطة)', TA, [...bodyStrokes(TA), tapAt(dotSeats(TA)[0])], 'dots-count'],
  ['عددُ نقاطٍ زائد (ت بثلاث)', TA, [...traceOf(TA),
    tapAt([dotSeats(TA)[0][0] + tolOf(TA), dotSeats(TA)[0][1]])], 'dots-count'],
  ['جزءٌ واحدٌ من متعدّد (ك بلا شولتها)', KAF, [bodyStrokes(KAF)[0]], 'part-missing'],
  ['نقرةٌ زائدةٌ على حرفٍ بلا نقاط', HA, [...bodyStrokes(HA),
    tapAt([pen.inkBox([pen.refPoints(HA)]).x1 + 2 * tolOf(HA), bodyMidY(HA)])], 'dots-count'],
  ['ثلاثٌ شَرْطةً مسطّحةً بلا رأس', THA, flatThree(THA), 'dots-span'],
];
for (const [label, ref, strokes, why] of NEGATIVE) {
  const v = pen.judgeShape(ref, strokes);
  ok(!v.ok && v.why === why, `${label} ⇐ ${v.why} (المنتظر ${why}) · ${say(v)}`);
}

/**
 * 🔴 **ودَينٌ مقيسٌ يُعلَن ولا يُخبَّأ خلف حالةٍ واحدةٍ خضراء** (صيدُ ن١، لِـ ن٣):
 * «نصفُ الحرف» **لا يُردّ في كلِّ شكل**. عُدَّت الأشكالُ كلُّها فوُجد أنّ نصفَ الجسم
 * يُقبَل في **١٠٩ من ١٧٢**. **وعلّتُه بنيويةٌ لا عيبُ ضبط**: التطبيعُ يكبّر النصفَ
 * إلى صندوق النموذج، وممرُّ السماحة عريضٌ (`lateral × ease`) — فيغطّي المكبَّرُ
 * أكثرَ من العتبة. **وهي عينُ «سعة الأمان»** التي أوجب `SHAPE_JUDGE §٤` طبعَها.
 *
 * **والمقايضةُ مقيسةٌ لا مظنونة** (مسحُ عامل الكرم على البيانات نفسِها):
 *   `ease` ١٫٦ ⇒ الميدان **٥٧/٦٠** والنصفُ يُقبَل ١٠٩ · ١٫٣ ⇒ **٥٤/٦٠** و٩٣ ·
 *   ١٫٠ ⇒ **٥١/٦٠** و٥٨ · ٠٫٨ ⇒ **٤٦/٦٠** و٣١. **والأخوات ١٢٤/١٢٤ في الأربع.**
 * ⇐ **فشدُّ الممرّ يشتري نصفَ حرفٍ بثمنِ ردودٍ كاذبةٍ على أطفالٍ كتبوا صحيحاً** —
 * وهو ما جاءت خطّةُ الإنقاذ لتزيله. **فالقرارُ للمعايرة بحصادٍ ثانٍ (ن٣) لا لجلسةٍ
 * تختار رقماً بيدها**، ويُحرَس اليومَ **بسقفٍ لا يُتجاوَز**.
 */
let halfPass = 0; let halfAll = 0;
for (const ch of Object.keys(PATHS)) {
  for (const form of Object.keys(PATHS[ch])) {
    const ref = PATHS[ch][form];
    if (!ref?.strokes?.length) continue;
    halfAll++;
    if (pen.judgeShape(ref, halved(ref)).ok) halfPass++;
  }
}
const HALF_CEILING = 109;
console.log(`   🔴 دَينٌ معلَن: نصفُ الجسم يُقبَل في ${halfPass}/${halfAll} شكلاً`
  + ' — يُعايَر في ن٣ بحصادٍ ثانٍ، ولا يُشَدّ اليومَ بيدٍ (الشدُّ يشتري ردوداً كاذبة)');
ok(halfPass <= HALF_CEILING,
  `وسقفُه لا يُتجاوَز: ${halfPass} ≤ ${HALF_CEILING} — فلا يزحف الدَّينُ صامتاً`);

/* ═════ ٤) موجباتُ الطريقة تُقبَل كلُّها — وهي عينُ الحكم ═════ */
console.log('\n٤) موجباتُ الطريقة — طريقٌ آخرُ وشكلٌ هو هو:');
/** شَرْطةٌ واحدةٌ مكان نقطتين — «النقطتين نكتبها مثل «–»» (ملاحظةُ المالك). */
const dashTwo = (ref) => {
  const seats = dotSeats(ref);
  return [...bodyStrokes(ref), lineBetween(seats[0], seats[1], 14)];
};
/** زاويةٌ رأسُها لفوق مكان ثلاث — «عامٌّ عند الكبار وأحياناً الصغار». */
const angleThree = (ref) => {
  const seats = [...dotSeats(ref)].sort((a, b) => a[0] - b[0]);
  const [l, , r] = seats;
  const apex = [(l[0] + r[0]) / 2, Math.min(l[1], r[1]) - (r[0] - l[0]) / 2];
  return [...bodyStrokes(ref), [...lineBetween(l, apex, 8), ...lineBetween(apex, r, 8).slice(1)]];
};
const POSITIVE = [
  ['معكوسُ اتجاه الضربات (ن)', NOON, [...bodyStrokes(NOON).map((s) => clone(s).reverse()),
    ...dotSeats(NOON).map(tapAt)]],
  ['معكوسُ اتجاه الضربات (ك بجسمين)', KAF, bodyStrokes(KAF).map((s) => clone(s).reverse())],
  ['ترتيبٌ مقلوبٌ للأجزاء (ك)', KAF, [...bodyStrokes(KAF)].reverse()],
  ['النقاطُ قبل الجسم (ث)', THA, [...dotSeats(THA).map(tapAt), ...bodyStrokes(THA)]],
  ['نقطتا شَرْطةٍ واحدة (ت)', PATHS['ت'].initial, dashTwo(PATHS['ت'].initial)],
  ['نقطتا شَرْطةٍ واحدة (ي وسطيّة)', PATHS['ي'].medial, dashTwo(PATHS['ي'].medial)],
  ['ثلاثٌ زاويةً رأسُها فوق (ث)', THA, angleThree(THA)],
  ['ثلاثٌ زاويةً رأسُها فوق (ش أوّليّة)', PATHS['ش'].initial, angleThree(PATHS['ش'].initial)],
];
for (const [label, ref, strokes] of POSITIVE) {
  const v = pen.judgeShape(ref, strokes);
  ok(v.ok, `${label} ⇐ ${say(v)}`);
}

/* ═════ ٥) الحجمُ والرجفةُ: إرشادٌ ودرجةٌ — لا ردّ ═════ */
console.log('\n٥) الحجمُ إرشادٌ والرجفةُ درجة — ولا يُردّ بهما:');
const big = pen.judgeShape(NOON, shift(traceOf(NOON), 0, 0, 2.6));
ok(big.ok && big.guides.includes(pen.SIZE.BIG),
  `حرفٌ كبيرٌ يُقبَل ويُقال له «اكتبه أصغر» — ${say(big)} guides=[${big.guides}]`);
const small = pen.judgeShape(NOON, shift(traceOf(NOON), 900, 700, 0.32));
ok(small.ok && small.guides.includes(pen.SIZE.SMALL),
  `وصغيرٌ مزاحٌ يُقبَل ويُقال له «اكتبه أكبر» — ${say(small)} guides=[${small.guides}]`);
const clean = pen.judgeShape(NOON, traceOf(NOON));
ok(clean.ok && clean.shaky === false && !clean.guides.includes('shaky'),
  `ويدٌ نظيفةٌ لا تُوصَف بالرجفة — تغطية ${pc(clean.metrics.recall)}`);
const band = [SHAPE_LO(), SHAPE_LO() + pen.SHAPE_LIMITS.shakyBand];
function SHAPE_LO() { return pen.SHAPE_LIMITS.recall; }
const shakyRows = FIELD.filter((r) => PATHS[r.ch]?.[r.form])
  .map((r) => ({ r, v: pen.judgeShape(PATHS[r.ch][r.form], r.strokes) }))
  .filter(({ v }) => v.shaky);
console.log(`   في الميدان ${shakyRows.length} كتابةً وقعت في هامش «صحيحٌ ويدُك ترتجف»`
  + ` [${band.map((b) => b.toFixed(2)).join('، ')}]: `
  + shakyRows.map(({ r, v }) => `${r.ch}/${r.form.slice(0, 3)} ${pc(v.metrics.recall)}`).join(' · '));
ok(shakyRows.length > 0 && shakyRows.every(({ v }) => v.ok && v.guides.includes('shaky')),
  'وكلُّ ما وقع في الهامش مقبولٌ موصوفٌ بالرجفة — درجةٌ لليتنر لا ردّ');
ok(!NEGATIVE.some(([, ref, strokes]) => {
  const v = pen.judgeShape(ref, strokes);
  return v.why === pen.SIZE.BIG || v.why === pen.SIZE.SMALL;
}), 'ولا يُردّ حرفٌ بحجمٍ قطّ — الحجمُ لا يظهر في الأسباب');

/* ═════ ٦) كلُّ قاعدةٍ مجرَّبةٌ سالباً ═════ */
console.log('\n٦) التجريبُ السالب — تُعطَّل القاعدةُ في نسخة ذاكرةٍ فيحمرّ فحصُها:');
const nth = (i) => NEGATIVE[i];
const [, HALF_REF, HALF_INK] = nth(2);   // نصفُ «ح» — يسقط بالتغطية ولا شيءَ غيرِها
const [, SCRIB_REF, SCRIB_INK] = nth(0);
// **وشاهدُ الجهة انزياحٌ محكومٌ لا قلبٌ تامّ** (مراجعة ن٢): القلبُ التامُّ صار
// يمسكه **سقفُ المزاوجة** أيضاً (دفاعٌ ثانٍ فوق الجهة)، فسالبةُ «عطّل الجهةَ»
// تحتاج شاهداً **داخل السقف** لا يمسكه إلا حارسُ الجهة: نقطةُ «ن» تُنزَل نحو
// مرآتها بثمانية أعشار السقف — تعبر منطقتَها (فوقُ ⇐ داخلُ الجسم) ويبقى زواجُها.
const FLIP_REF = PATHS['ن'].isolated;
const FLIP_INK = (() => {
  const body = FLIP_REF.strokes.map((st) => st.points.map((q) => [q[0], q[1]]));
  const d = FLIP_REF.dots[0].at;
  const cap = 2.5 * pen.easeTolerance(pen.resolveTolerance(FLIP_REF.tolerance)).lateral;
  const at = [d[0], d[1] + 0.8 * cap];
  return [...body, [at, at, at]];
})();
const [, OVER_REF, OVER_INK] = nth(6);
const [, PART_REF, PART_INK] = nth(7);
const [, STRAY_REF, STRAY_INK] = nth(8);
const [, FLAT_REF, FLAT_INK] = nth(9);

// 🔴 **سدُّ البُعد المتوسّط آلةٌ نائمة** (حدُّه ١٫٢ لا يعضّ أحداً اليوم): هامشُ
// معايرته على بيانات الماوس شعرةٌ (٠٫٦٨ طفلاً / ٠٫٨٩ هجوماً) — **يُشَدّ في ن٣
// بأصابعَ حقيقية**، وسالبتُه تُكتب يومَها. وهجومُ المالك المجمَّدُ شاهدُ دَينِ
// البنية في test_pen — لا يُحذَف.

await negative('قاعدةُ الغياب المتّصل (وصلةٌ بلا عينِ الميم تُقبَل بتعطيلها)',
  '|| (len > 2.5 * tol && worst > 0.45 * len)) missing = true;',
  '|| false) missing = false;',
  (alt) => {
    const pts = MEEM.strokes[0].points.map((q) => [q[0], q[1]]);
    return alt.judgeShape(MEEM, [pts.slice(Math.floor(pts.length * 0.35))]).ok;
  });
await negative('عتبتا التغطية والجزء (حبرٌ مخرَّمٌ يُقبَل بتعطيلهما)',
  'recall: 0.70, part: 0.55,', 'recall: 0, part: 0,',
  (alt) => {
    // حبرٌ مخرَّم: من كلّ عشرين نقطةً تسعٌ — رقيقٌ منتشرٌ لا غيابَ متّصلَ فيه
    const holey = HHA.strokes.map((st) => st.points.filter((_, i) => i % 20 < 9).map((q) => [q[0], q[1]]));
    return alt.judgeShape(HHA, holey).ok;
  });
await negative('أدنى تغطيةِ جزء (شولةُ الكاف مُخرَّمةً تُقبَل بتعطيله)',
  'part: 0.55,', 'part: 0,',
  (alt) => {
    // **الشاهدُ خاصٌّ بحارسه**: شولةٌ حاضرةٌ مُخرَّمةٌ (٤٠٪ شرائطَ) — لا غيابَ
    // متّصلَ فيها يمسكه حدُّ الغياب، وأدنى تغطيةِ جزءٍ وحدَه يراها.
    const body = KAF.strokes.map((st) => st.points.map((q) => [q[0], q[1]]));
    const last = body[body.length - 1];
    body[body.length - 1] = last.filter((_, i) => i % 5 < 2);
    return alt.judgeShape(KAF, body).ok;
  });
await negative('جهةُ النقطة (المقلوبةُ تُقبَل)',
  "if (sideBad) dotFail = 'dots-side';",
  "if (false) dotFail = 'dots-side';",
  (alt) => alt.judgeShape(FLIP_REF, FLIP_INK).ok);
await negative('عددُ التجمّعات (ت بثلاثِ نقاطٍ تُقبَل)',
  "      dotFail = 'dots-count';  // **وزيادةُ",
  '      dotFail = null;  // **وزيادةُ',
  (alt) => alt.judgeShape(OVER_REF, OVER_INK).ok);
await negative('نقرةٌ على حرفٍ بلا نقاط (تُقبَل)',
  "if (child.some((s) => isTap(s) && !hesitates(s))) dotFail = 'dots-count';",
  "if (false) dotFail = 'dots-count';",
  (alt) => alt.judgeShape(STRAY_REF, STRAY_INK).ok);
await negative('رأسُ الثلاث (الشَّرْطةُ المسطّحةُ تُقبَل ثاءً)',
  'const apexOk = dots < 3 || spanY >= SHAPE_DOTS.apex * spanX;',
  'const apexOk = true;',
  (alt) => alt.judgeShape(FLAT_REF, FLAT_INK).ok);
await negative('مدُّ الشَّرْطة (نقطتا «ت» شَرْطةً تُرَدّان)',
  "dotFail = spanOk && apexOk ? null : 'dots-span';", "dotFail = 'dots-span';",
  (alt) => !alt.judgeShape(PATHS['ت'].initial, dashTwo(PATHS['ت'].initial)).ok);
await negative('مقياسُ التطبيع (الصغيرُ المزاحُ يُرَدّ)',
  'const scale = Math.min(SHAPE_FIT.max, Math.max(SHAPE_FIT.min, raw));', 'const scale = 1;',
  (alt) => !alt.judgeShape(NOON, shift(traceOf(NOON), 900, 700, 0.32)).ok);
await negative('خطوةُ التسوية (تنقص موافقةُ الميدان بلا إزاحتها)',
  'const ox = mid(dx); const oy = mid(dy);', 'const ox = 0; const oy = 0;',
  (alt) => onField(alt).agree < field.agree);
await negative('هامشُ الرجفة (لا يوصف أحدٌ بها)',
  'shakyBand: 0.08,', 'shakyBand: 0,',
  (alt) => FIELD.filter((r) => PATHS[r.ch]?.[r.form])
    .every((r) => !alt.judgeShape(PATHS[r.ch][r.form], r.strokes).shaky));
await negative('جملةُ الحجم (الكبيرُ يُقبَل بلا إرشاد)',
  'if (size) guides.push(size);', 'if (false) guides.push(size);',
  (alt) => !alt.judgeShape(NOON, shift(traceOf(NOON), 0, 0, 2.6)).guides.includes(pen.SIZE.BIG));

// 🔴 **والضبطان المقيسان** — بندُ ن١ بعينه: كلٌّ منهما يشتري رقماً يُطبَع.
await negative('نقرةُ التردّد (يُردّ «د» المعزولةُ من الميدان بلا استثنائها)',
  'hesitate: 0.35,', 'hesitate: 0,',
  (alt) => onField(alt).agree === field.agree - 1);
await negative('وشرطُها الثاني — القربُ من حبر الطفل (تختلط الأخوات بدونه)',
  '&& shapeGap(seat, solid) <= 0.12 * tol', '&& true',
  async (alt) => {
    const loose = onSisters(alt);
    console.log(`      · بالقرب من النموذج وحدَه: الأخوات ${loose.pass}/${loose.total}`
      + ` — ${loose.miss.join(' · ')}`);
    return loose.miss.length > 0;
  });

console.log(fails
  ? `\n${fails} فشل`
  : `\nالحَكَمُ الكلّيّ: الميدان ${field.agree}/60 · الأخوات ${sisters.pass}/${sisters.total}`
    + ` · ${NEGATIVE.length} سالباً مصنوعاً · ${POSITIVE.length} موجَباً للطريقة — وكلُّ قاعدةٍ مجرَّبةٌ سالباً.`);
process.exit(fails ? 1 : 0);
