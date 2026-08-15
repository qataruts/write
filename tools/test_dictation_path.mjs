// حارسُ **طريق الكلمة إلى الإملاء** — يُشغَّل:  node tools/test_dictation_path.mjs
//
// ————— العطبُ الذي وُلد منه (أ١، `docs/REVIEW_METHOD.md`) —————
//
// وجدت المراجعةُ المنهجيةُ المستقلة (١٥ أغسطس ٢٠٢٦) أنّ **طريق الكلمة إلى الإملاء
// الصرف مقطوعٌ بنيوياً**: درجةُ الخفوت `floor(reads/3)` فتلزم الكلمةَ **تسعُ إصاباتٍ
// متباعدة**، والعدّادُ لا يرتفع إلا في محطة الخفوت، **ولا شيء في الرحلة يعيد الطفلَ
// إلى محطةٍ أتمّها**. فالنتيجة: محطاتُ «بساتين الإملاء» المئة تُختَم **نسخاً**،
// **ولا تولد مهارةُ إملاء كلمةٍ في يد الطفل أبداً** — دورٌ مغلق، وبوابةُ الختام تسأل
// عن رحلةٍ ينقصها عمودُها.
//
// **والعطبُ من صنفٍ لا يُمسِكه فاحصُ وحدةٍ ولا لقطةُ شاشة**: كلُّ دالّةٍ فيه صحيحة،
// وإنما **مجموعُها عبر الزمن** لا يبلغ غايته. فلا يُقاس إلا بمحاكاة الرحلة نفسِها
// يوماً بيوم — وهذا الحارس. **وهو حارسُ غياب**: لا يقيس أنّ الشيفرة تنادي دالّةً، بل
// أنّ **الطفلَ يبلغ الإملاء** — فلو رجع العلاجُ يوماً لاحمرّ هذا وحدَه.
//
// ————— ما يقيسه بالعدّ المحسوب لا المكتوب —————
//
// ١) **أولُ إملاء كلمةٍ يقع بحلول أوّل بستان إملاء** (فيه أو قبلَه): فلا يجاوز الطفلُ
//    أولَ محطةٍ اسمُها «إملاء» ولمّا يُملِ كلمةً قطّ (وجهُ أ١ القياسيّ: المحطةُ تقيس
//    غيرَ ما تعلن). والبستانُ الأوّل نفسُه موضعٌ طبيعيّ لأوّل إملاء — تصويبُ معيارِ
//    الإدارة الأشدّ من الصواب (مراجعة جلسة ح).
// ٢) **نسبةُ كلمات بساتين الإملاء التي تُفتَح بدرجةِ خفوتٍ > ٠**: تُطبَع وتُحرَس
//    دنياها — فبستانُ الإملاء يجب أن يجد كلماتِه **قد نضجت** لا في درجتها الصفر.
// ٣) **بوابةُ الختام تحمل مهارةَ إملاء كلمة**: في سجلّ الطفل ساعةَ بلوغها.
//
// ————— كيف يحاكي —————
//
// **طفلٌ نظيف يمشي الرحلة يوماً بيوم**: عقدةٌ جديدة كلَّ يوم ثم مراجعةُ اليوم
// المستحقّة — وهو أسرعُ نضجٍ ممكن (كلُّ إنتاجه بلا خطأ)، فما لا يبلغه **هو** لا يبلغه
// طفلٌ حقيقيّ. **ومادّةُ كل شاشةٍ من الشاشة نفسِها** (`unitsOf` و`STEPS` من وحداتها،
// و`levelOf`/`kindOf` من `fade.js`): لا جدولَ ثانياً هنا يشيخ يومَ تتبدّل حلقةُ محطة.
//
// **وما لا يُقاس بالمحاكاة يُقاس بالنصّ**: أنّ المراجعة تنضج وتُملي فعلاً — سطران في
// `review.js` — يقرؤهما الحارسُ نصّاً، فلا تصدق المحاكاةُ على شيفرةٍ كفّت عنه.
//
// 🔒 **ولا يمسّ جهازاً ولا شبكة**: `localStorage` ظِلٌّ في الذاكرة كسائر حرّاس `node`.
//
// ⏱ **والأداةُ تنبض**: تطبع سطراً لكل محطةٍ تعبرها (أين هي من الرحلة وما قيست)، وهي
//    ثوانٍ لا دقائق — فلا نقطةَ تفتيشٍ لها (`CLAUDE.md`: الجزءُ الأخضر يُحفظ حيث يطول).

import { readFileSync } from 'node:fs';

const APP = new URL('../app/js/', import.meta.url);
const read = (name) => readFileSync(new URL(name, APP), 'utf8');

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };
const note = (msg) => console.log('  ·', msg);

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const progress = await import(new URL('progress.js', APP));
const fade = await import(new URL('fade.js', APP));
const copy = await import(new URL('copy.js', APP));
const lesson = await import(new URL('lesson.js', APP));
const sentence = await import(new URL('sentence.js', APP));
const review = await import(new URL('review.js', APP));
const gate = await import(new URL('gate.js', APP));

const { KINDS, WORD_FORM, SENTENCE_FORM } = progress;
const arNum = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

// ————— ١. النصّ: هل ما زالت المراجعةُ تُنضج وتُملي؟ —————
//
// **قبل المحاكاة**: محاكاةٌ تصف شاشةً لم تعد تفعل ذلك **خضرةٌ كاذبة**. فيُقرأ
// `review.js` نصّاً — كما يقرأ `test_measure.mjs` شاشاتِ القياس — ويُطالَب بالسطرين.

console.log('— النصّ: المراجعةُ تعرض بالدرجة وتُنضج —');
const reviewSrc = read('review.js');
ok(/kindOf\(level\)/.test(reviewSrc) && /modeOf\(level\)/.test(reviewSrc),
  '`review.js` يبني لوحَ الكلمة ونوعَ قياسها من درجة خفوتها (`modeOf`/`kindOf`)');
ok(/progress\.recordRead\(item\.unit\)/.test(reviewSrc),
  'وينادي `recordRead` على إنتاج الكلمة النظيف — فالمراجعةُ تُنضج');
ok(/from '\.\/fade\.js'/.test(reviewSrc),
  'ودرجاتُه مستوردةٌ من `fade.js` بأعيانها — لا نسخةَ ثانية تشيخ');
const copySrc = read('copy.js');
ok(/progress\.recordRead\(unit\.text\)/.test(copySrc),
  'وحلقةُ البستان تُنضج بالنسخ الحرّ النظيف (ب١)');
ok(copy.STEPS.some((s) => s.mode === 'free' && s.kind === KINDS.COPY),
  'وفي حلقة البستان درجةُ نسخٍ حرّ تكتب `نسخ` (ب١)');

// ————— ٢. المحاكاة: يومٌ لكلِّ عقدة، ومراجعةٌ في ذيله —————

/** ما تكتبه كلُّ شاشةٍ في ليتنر — **من وحدة الشاشة نفسِها** لا من جدولٍ هنا. */
function playNode(node, day) {
  const marks = [];
  if (node.type === 'letter' || node.type === 'digit' || node.type === 'form' || node.type === 'name') {
    for (const unit of lesson.unitsOf(node)) {
      for (const step of lesson.STEPS) {
        if (step.kind) progress.recordAttempt(unit.letter, unit.form, step.kind, true, day);
      }
    }
    return marks;
  }
  if (node.type === 'join') {
    for (const unit of copy.unitsOf(node)) {
      for (const step of copy.STEPS) {
        if (step.kind) progress.recordAttempt(unit.text, WORD_FORM, step.kind, true, day);
        // **والنسخُ الحرّ النظيف يُنضج** (ب١) — وسطرُ المسافة ليس كلمةً تُملى
        if (step.mode === 'free' && !unit.space) progress.recordRead(unit.text, day);
      }
    }
    return marks;
  }
  if (node.type === 'fade') {
    for (const unit of fade.unitsOf(node)) {
      const level = fade.levelOf(unit.text);
      marks.push({ text: unit.text, level, kind: fade.kindOf(level) });
      progress.recordAttempt(unit.text, WORD_FORM, fade.kindOf(level), true, day);
      progress.recordRead(unit.text, day);
    }
    return marks;
  }
  if (node.type === 'sentence') {
    for (const unit of sentence.unitsOf(node)) {
      for (const step of sentence.STEPS) {
        if (step.kind) progress.recordAttempt(unit.text, SENTENCE_FORM, step.kind, true, day);
      }
    }
  }
  return marks;   // `warmup` معفاةٌ من ليتنر بعلّتها المكتوبة (`test_measure.mjs`)
}

/**
 * جلسةُ مراجعةٍ (أو بوابة): مادّتُها من `buildSession` بعينها، **وكلُّ تمرين كلمةٍ
 * يُعرَض بدرجتها الحيّة** — عينُ ما يفعله `wordExercise` في `review.js`.
 */
function playSession(items, day) {
  const born = [];
  for (const item of items) {
    if (item.form === WORD_FORM) {
      const level = Math.min(fade.levelOf(item.unit), fade.VEIL_STEPS - (item.say === null ? 1 : 0));
      const kind = fade.kindOf(level);
      progress.recordAttempt(item.unit, WORD_FORM, kind, true, day);
      progress.recordRead(item.unit, day);
      if (kind === KINDS.DICTATE) born.push(item.unit);
    } else {
      progress.recordAttempt(item.unit, item.form, item.kind, true, day);
    }
  }
  return born;
}

/** **وصوتُ الكلمة شرطُ عريها** — يُقرأ من المنهج كما تقرؤه الشاشة. */
const curriculum = await import(new URL('curriculum.js', APP));
const sayOfWord = (text) => curriculum.WORDS[text]?.say || null;

const nodes = progress.allNodes();
const firstSayNode = nodes.findIndex((n) => n.stageId === 'orchard-say');
const endGate = nodes.findIndex((n) => n.id === 'gate:end');

console.log(`\n— المحاكاة: ${arNum(nodes.length)} عقدة، يومٌ لكلِّ عقدة —`);

let day = 0;
let firstDictation = null;      // {day, index, word} — أوّلُ إملاء كلمةٍ في الرحلة
let openedWords = 0;            // كلماتُ بساتين الإملاء ساعةَ فُتحت
let openedRipe = 0;             // ومنها ما فُتح بدرجة > ٠
let sectionAt = '';

for (const [index, node] of nodes.entries()) {
  day++;
  const section = node.stageId || node.type;
  if (section !== sectionAt) {
    sectionAt = section;
    const ripe = openedWords ? ` · نضجُ بساتين الإملاء ${arNum(pct(openedRipe, openedWords))}٪` : '';
    console.log(`  … يوم ${arNum(day)} — ${sectionAt}${
      firstDictation ? ` · أوّلُ إملاء: يوم ${arNum(firstDictation.day)}` : ''}${ripe}`);
  }

  // بستانُ إملاءٍ يُفتَح: بأيّ درجةٍ وجد كلماتِه؟ (يُقاس قبل أن تكتب المحطةُ شيئاً)
  if (node.stageId === 'orchard-say') {
    for (const unit of fade.unitsOf(node)) {
      openedWords++;
      if (fade.levelOf(unit.text) > 0) openedRipe++;
    }
  }

  const marks = node.type === 'gate'
    ? playSession(gate.gateItems(), day).map((w) => ({ text: w, kind: KINDS.DICTATE }))
    : playNode(node, day);

  // ومراجعةُ اليوم في ذيله — مادّتُها المستحقُّ من ليتنر
  const due = review.buildSession({ due: progress.dueSkills(day) });
  const born = playSession(due.map((item) => ({ ...item, say: sayOfWord(item.unit) })), day);

  if (!firstDictation) {
    const word = marks.find((m) => m.kind === KINDS.DICTATE)?.text || born[0];
    if (word) firstDictation = { day, index, word, node: node.id };
  }
  if (node.type !== 'gate') progress.setStars(node.id, 3);
}

// ————— ٣. الأحكام —————

console.log(`\n— الحكم: ${arNum(day)} يوماً مشى الطفلُ الرحلةَ كلَّها —`);

ok(Boolean(firstDictation),
  firstDictation
    ? `أوّلُ إملاء كلمةٍ وقع: «${firstDictation.word}» يوم ${arNum(firstDictation.day)} (${firstDictation.node})`
    : '**لم يقع إملاءُ كلمةٍ واحدة في الرحلة كلِّها** — أ١ راجعة');

ok(firstSayNode >= 0 && firstDictation && firstDictation.index <= firstSayNode,
  `ووقع **بحلول** أوّل بستان إملاء (العقدة ${arNum(firstDictation?.index ?? -1)} `
  + `والبستانُ الأوّل ${arNum(firstSayNode)}) — فلا يجاوز محطةَ إملاءٍ ولمّا يُملِ`);

const ripeRate = pct(openedRipe, openedWords);
const RIPE_FLOOR = 60;   // دنيا محروسة — قِيست ثم أُنزلت لها هامشُ تبدّلِ مادّة
note(`كلماتُ بساتين الإملاء: ${arNum(openedWords)}، فُتح بدرجةٍ > ٠ منها `
  + `${arNum(openedRipe)} — **${arNum(ripeRate)}٪**`);
ok(ripeRate >= RIPE_FLOOR,
  `ونسبةُ النضج ≥ ${arNum(RIPE_FLOOR)}٪ (الدنيا المحروسة) — فالبستانُ يجد كلماتِه ناضجة`);

const skills = progress.skills();
const wordDictation = skills.filter((s) => s.form === WORD_FORM && s.kind === KINDS.DICTATE);
ok(wordDictation.length > 0,
  `وبوابةُ الختام تحمل مهارةَ إملاء كلمة: ${arNum(wordDictation.length)} مهارة في سجلّه`);

const reads = progress.wordReads();
const need = fade.HITS_PER_STEP * fade.VEIL_STEPS;
const ripeWords = reads.filter((r) => r.n >= need);
note(`وبلغ درجةَ العري (${arNum(need)} إصابةً متباعدة) `
  + `${arNum(ripeWords.length)} كلمة من ${arNum(reads.length)} لها تاريخ`);

const gateWords = gate.gateItems().filter((i) => i.form === WORD_FORM && i.kind === KINDS.DICTATE);
note(`وتمارينُ بوابة الختام ساعةَ بلوغها (${arNum(endGate)}): `
  + `${arNum(gateWords.length)} إملاءَ كلمةٍ من ${arNum(gate.GATE_SIZE)}`);

// ————— ٤. ميزانُ السلّم: ما تطلبه الدرجةُ وما تحتمله الرحلة —————
//
// **رقمٌ لا رأي**: السلّمُ يطلب `HITS_PER_STEP × VEIL_STEPS` يوماً متباعداً لكل كلمة،
// والرحلةُ تعطي ما تعطي — وبينهما فرقٌ يُقاس لا يُقدَّر. فإن احمرّ ما فوقُ فهذا
// السطرُ يقول **لماذا**، ويضع الرقمَ بين يدَي مَن يملك ميزانَ المنهج (`METHOD §٤`).
const best = reads.reduce((m, r) => Math.max(m, r.n), 0);
const median = reads.length
  ? reads.map((r) => r.n).sort((a, b) => a - b)[Math.floor(reads.length / 2)] : 0;
note(`ميزانُ السلّم: الدرجةُ تطلب ${arNum(fade.HITS_PER_STEP)} إصاباتٍ متباعدة `
  + `و${arNum(fade.VEIL_STEPS)} درجاتٍ ⇐ **${arNum(need)} يوماً متباعداً للكلمة**`);
note(`وميزانُ الرحلة المقيس: أقصى ما بلغته كلمةٌ **${arNum(best)}**، ووسيطُها `
  + `**${arNum(median)}** — فالكلمةُ تُنتَج نظيفةً متباعدةً بهذا القدر لا أكثر`);
if (best < need) {
  note(`⇐ **الفرقُ ${arNum(need - best)} يوماً**: يُغلَق إمّا بميزانٍ أدنى للدرجة `
    + `(\`HITS_PER_STEP\`) وإمّا بحملٍ أوسع للمراجعة (\`SESSION_SIZE\`) — **وكلاهما رقمُ `
    + 'منهج بيد المالك، لا يُغيَّر في جلسة تنفيذ**');
}

console.log(fails ? `\n${fails} فشل` : '\nطريقُ الكلمة إلى الإملاء مفتوحٌ ومقيس');
process.exit(fails ? 1 : 0);
