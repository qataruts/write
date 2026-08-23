// حارسُ لوحة وليّ الأمر — **الذهبُ القياسيّ لهذا التطبيق** (`METHOD.md §٦`):
//   node tools/test_parent.mjs
//
// **العلّة**: «لوحةُ وليّ الأمر تقول **«يبدأ الميمَ من أسفل»** لا «أخطأ في الميم»».
// وأسهلُ ما يُنقَض به هذا العهدُ **جملةٌ تُكتب بيد**: يكتب كاتبُ اللوحة وصفاً لطيفاً
// لكل رمزٍ يعرفه اليوم، ثم يُضيف المحرّكُ رمزاً غداً أو يبدّل وصفَه — فتبقى اللوحةُ
// تقول لغةً أخرى غير لغة الحَكَم، ولا يحمرّ شيء. فالمحروسُ هنا **مصدرُ الجملة** لا
// جمالُها: شقُّها الثابت من `pen.js` نفسِه (`FAULT_TEXT`)، وتُتمّه الوحدةُ من الرحلة.
//
// وهو نظيرُ `test_measure.mjs` في بابه: ذاك يسأل «أيّ محطةٍ تُدرَّس بلا قياس؟» وهذا
// يسأل «أيّ حكمٍ يقع على يد الطفل ولا يبلغ والدَه؟» — وكلاهما يحرس **الغياب**.
//
// والمحروس خمسة:
//   ١) **جملةُ الخطأ تُبنى ولا تُكتب**: لكلِّ رمزٍ في `FAULTS` نصُّه، والجملةُ تحمل
//      نصَّ المحرّك بحرفه — **ولا وصفَ خطأٍ مكتوبٌ في `parent.js`**.
//   ٢) **والوحدةُ تُتمّه من الرحلة**: حرفاً وتهيئةً وكلمةً وجملة — لا اسمَ يُكتب بيد.
//   ٣) **ولا شاشةَ تحكم ولا تكتب**: كلُّ ملفٍّ يتلقّى `onFault` من المحرّك يسجّل في
//      العدّاد، أو له إعفاءٌ مكتوب — والجردُ من القرص فتدخله شاشةُ الغد يومَ تُكتب.
//   ٤) **ولكلِّ نوع تمرينٍ موضعُه** في اللوحة باسمه العربيّ (`METHOD.md §٦`).
//   ٥) **واللوحةُ تُقرأ ولا تُسمَع**: لا صوتَ فيها ولا نصَّ منطوق.

import { readFileSync, readdirSync } from 'node:fs';

const APP = new URL('../app/', import.meta.url);
const read = (p) => readFileSync(new URL(p, APP), 'utf8');

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const p = await import(new URL('js/progress.js', APP));
const pen = await import(new URL('js/pen.js', APP));
const parent = await import(new URL('js/parent.js', APP));

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

/** نصُّ الشيفرة مجرَّداً من التعليقات — فلا تُحاسَب وحدةٌ على شرحٍ يذكر ما لا يفعله. */
const codeOf = (text) => text
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|\s)\/\/[^\n]*/g, ' ');

// ————— ١) جملةُ الخطأ الحركيّ: مبنيّةٌ من المحرّك لا مكتوبةٌ بيد —————

console.log('\n— ١) جملةُ الخطأ: شقُّها الثابت من `pen.js` —');

const CODES = Object.values(pen.FAULTS);
const missing = CODES.filter((code) => !pen.FAULT_TEXT[code]);
ok(missing.length === 0,
  `كلُّ رمزٍ في \`FAULTS\` له نصُّه في \`FAULT_TEXT\` (${CODES.length} رمزاً)`
  + (missing.length ? ` — **بلا نصّ: ${missing.join('، ')}**` : ''));

const carried = CODES.filter((code) =>
  parent.faultLine({ unit: 'م', code }).includes(pen.FAULT_TEXT[code]));
ok(carried.length === CODES.length,
  'وجملةُ اللوحة تحمل نصَّ المحرّك **بحرفه** في كلِّ رمز'
  + (carried.length < CODES.length
    ? ` — **تخلّفت: ${CODES.filter((c) => !carried.includes(c)).join('، ')}**` : ''));

// **المحكُّ**: لا وصفَ خطأٍ مكتوبٌ في `parent.js`. لو نُسخت أوصافُ `FAULT_TEXT` إليه
// لَعمل كلُّ ما فوق وهو منقوضٌ في جوهره — فيُقرأ نصُّ اللوحة ويُطالَب بخلوّه منها.
const parentCode = codeOf(read('js/parent.js'));
const copied = Object.values(pen.FAULT_TEXT).filter((text) => parentCode.includes(text));
ok(copied.length === 0,
  'ولا وصفَ خطأٍ منسوخٌ في `parent.js` — المصدرُ واحد'
  + (copied.length ? ` — **منسوخ: ${copied.join('، ')}**` : ''));

// ورمزٌ لا يعرفه المحرّك **لا يُخترع له نصّ**: يسقط من العرض ولا يظهر «undefined».
ok(parent.faultLine({ unit: 'م', code: 'no-such-fault' }) === ''
  && parent.faultMap([{ unit: 'م', code: 'no-such-fault', n: 9 }]).length === 0,
  'ورمزٌ مجهولٌ لا يُخترع له نصّ — يسقط من الخريطة ولا يُعرض مبهماً');

// ————— ٢) الوحدةُ تُتمّ الجملة — من الرحلة لا من قائمةٍ تُكتب —————

console.log('\n— ٢) الوحدةُ من الرحلة: حرفاً وتهيئةً وكلمةً وجملة —');

const nodes = p.allNodes();
const letter = nodes.find((n) => n.type === 'letter').letter;
const warm = nodes.find((n) => n.type === 'warmup');
const word = nodes.find((n) => n.type === 'fade').words[0];
const line = nodes.find((n) => n.type === 'sentence').sentences[0];

// واسمُ الحرف يُقابَل بمصدره الأصليّ (`LETTERS` اقرأ في `curriculum.js`) لا بنسخةٍ
// من `parent.js` نفسِه — فمقابلةُ الشيء بنفسه لا تشهد له.
const { LETTERS } = await import(new URL('js/curriculum.js', APP));
ok(parent.unitTitle(letter) !== letter && parent.unitTitle(letter).includes(LETTERS[letter].name),
  `الحرفُ يُسمّى باسمه من المنهج: «${parent.unitTitle(letter)}» (لا «${letter}» مفرداً)`);
ok(parent.unitTitle(warm.part) === warm.title,
  `ومحطةُ التهيئة بعنوانها المشكول: «${parent.unitTitle(warm.part)}» (لا «${warm.part}»)`);
ok(parent.unitTitle(word) === word && parent.unitTitle(line) === line,
  `والكلمةُ والجملةُ نصُّهما عنوانُهما: «${word}» · «${line}»`);
ok(parent.unitTitle('شيءٌ ليس في الرحلة') === 'شيءٌ ليس في الرحلة',
  'ووحدةٌ لا عقدةَ لها تُعرض بنفسها — لا سطرٌ فارغ في لوحة الوالد');

// **جملةُ `METHOD §٦` بعينها**: تُسجَّل حركةٌ خاطئة على حرفٍ، فتقول اللوحةُ **كيف**
// أخطأ لا كم أخطأ — والفرقُ بينهما هو كلُّ ما في هذا القسم.
p.recordFault(letter, pen.FAULTS.START_END);
p.recordFault(letter, pen.FAULTS.START_END);
p.recordFault(letter, pen.FAULTS.START_END);
p.recordFault(letter, pen.FAULTS.DOTS_FIRST);
p.recordFault(warm.part, pen.FAULTS.REVERSE);
p.recordFault(word, pen.FAULTS.SHORT);

const map = parent.faultMap();
const first = map[0];
ok(first.unit === letter && first.total === 4 && first.lines[0].n === 3,
  `والوحدةُ الأكثرُ تعثّراً أولاً (${parent.unitTitle(first.unit)}: ${first.total})،`
  + ` وأكثرُ أخطائها أولاً (${first.lines[0].n})`);
ok(first.lines[0].text === `${parent.unitTitle(letter)} — ${pen.FAULT_TEXT[pen.FAULTS.START_END]}`,
  `وتقرأ اللوحةُ: «${first.lines[0].text}» — لا «أخطأ في ${parent.unitTitle(letter)}»`);
ok(map.length === 3 && map.some((u) => u.unit === warm.part) && map.some((u) => u.unit === word),
  `والخريطةُ تجمع الأنواع كلَّها: حرفٌ وتهيئةٌ وكلمة (${map.length} وحدات)`);

// **والترتيبُ عند التساوي ترتيبُ المحرّك لا الأبجدية**: رمزان بعددٍ واحد يخرجان كما
// أعلنهما `FAULTS` — فترتيبُ الشكوى ترتيبُ شدّتها عند الحَكَم لا صدفةَ حروفها.
const tied = parent.faultMap([
  { unit: letter, code: pen.FAULTS.ORDER, n: 2 },
  { unit: letter, code: pen.FAULTS.START_FAR, n: 2 },
])[0].lines.map((l) => l.code);
ok(tied[0] === pen.FAULTS.START_FAR && tied[1] === pen.FAULTS.ORDER,
  `وعند تساوي العدد يسبق ترتيبُ المحرّك (${tied.join(' ← ')})`);

// ————— ٣) لا شاشةَ تحكم بالقلم ولا تكتب خطأها المميَّز —————
//
// **الجردُ من القرص لا قائمةً تُكتب** (نمطُ `test_pen.mjs` و`test_selftests.mjs`):
// شاشةٌ تُبنى غداً وتتلقّى `onFault` تدخل الحراسةَ يومَ تُكتب، ولا تنفلت صامتة.

console.log('\n— ٣) كلُّ حكمٍ يقع على يد الطفل يبلغ لوحةَ والده —');

/** مَن يتلقّى موضعَ الخطأ من المحرّك — ولكلِّ معفىً سببُه مكتوباً. */
const EXEMPT = {
  'pen.js': 'هو **المحرّك** الذي يُصدِر `onFault` لا مَن يتلقّاه، ولا يعرف تخزيناً'
    + ' أصلاً (لا سطرَ `import` فيه) — فمسارُ الطفل يدخله ويخرج منه حكمٌ لا أثر.',
  'pendev.js': 'لوحُ تطويرٍ خلف `?dev=1` **لا يقع في رحلة طفل**: يعرض الحكمَ لمن'
    + ' يعاير المحرّك ولا يقيس مهارةً ولا يكتب في تقدّم أحد.',
};

const modules = readdirSync(new URL('js/', APP)).filter((f) => f.endsWith('.js')).sort();
const judges = modules.filter((f) => /onFault\s*:/.test(codeOf(read(`js/${f}`))));
ok(judges.length > 0, `شاشاتٌ يبلغها حكمُ القلم: ${judges.length} (${judges.join('، ')})`);

for (const file of judges) {
  if (EXEMPT[file]) {
    ok(!/progress\.recordAttempt\s*\(/.test(codeOf(read(`js/${file}`))),
      `[${file}] معفىً ولا يقيس شيئاً — ${EXEMPT[file].split('**').join('').slice(0, 60)}…`);
    continue;
  }
  ok(/recordFault\s*\(/.test(codeOf(read(`js/${file}`))),
    `[${file}] يكتب خطأه المميَّز في العدّاد (\`recordFault\`)`);
}

const stale = Object.keys(EXEMPT).filter((f) => !judges.includes(f));
ok(stale.length === 0,
  'ولا إعفاءَ لملفٍّ لم يعد يتلقّى حكماً' + (stale.length ? ` — بائد: ${stale.join('، ')}` : ''));
ok(Object.values(EXEMPT).every((why) => why.length > 60),
  'وسببُ الإعفاء جملةٌ تُقرأ لا كلمةٌ تُكتب للمرور');

// 🔒 **ولا يُخزَّن من الحكم إلا اسمُه**: `recordFault` تأخذ الوحدةَ والرمز — ومَن
// مرّر معها موضعَ اللمسة أو انزياحَها أدخل أثرَ يد الطفل إلى القرص ثم إلى النسخة
// الاحتياطية من بابٍ خلفيّ (`METHOD.md §٣.٧`). (وهو عهدُ `test_warmup` معمَّماً.)
const leaks = judges.filter((f) => /recordFault\([^)]*\bfault\.(at|off|points)\b/
  .test(codeOf(read(`js/${f}`))));
ok(leaks.length === 0,
  'ولا يُمرَّر إلى العدّاد موضعُ لمسةٍ ولا انزياحُها — المخزونُ اسمُ الخطأ ومرّاتُه'
  + (leaks.length ? ` — **تسريب: ${leaks.join('، ')}**` : ''));

// ————— ٤) لكلِّ نوع تمرينٍ موضعُه باسمه العربيّ —————

console.log('\n— ٤) لكلِّ نوع تمرينٍ موضعُه —');

const nameless = Object.values(p.KINDS).filter((kind) => !p.KIND_NAMES[kind]);
ok(nameless.length === 0,
  `لكلِّ نوعٍ في \`KINDS\` اسمٌ عربيّ (${Object.values(p.KIND_NAMES).join('، ')})`
  + (nameless.length ? ` — **بلا اسم: ${nameless.join('، ')}**` : ''));

const FORM = p.parseSkillKey(p.skillKey(letter, 'معزول', p.KINDS.TRACE)).form;
p.recordAttempt(letter, FORM, p.KINDS.TRACE, true);
p.recordAttempt(letter, FORM, p.KINDS.FREE, false);
p.recordAttempt(word, p.WORD_FORM, p.KINDS.COPY, true);
p.recordAttempt(word, p.WORD_FORM, p.KINDS.DICTATE, true);
p.recordAttempt(line, p.SENTENCE_FORM, p.KINDS.COPY, true);

const places = parent.kindPlaces();
ok(places.length === Object.keys(p.KINDS).length
  && places.every((place) => place.name && place.name !== place.kind),
  `وأربعتُها في اللوحة بأسمائها: ${places.map((s) => `${s.name} (${s.measured})`).join(' · ')}`);
ok(places.find((s) => s.kind === p.KINDS.COPY).measured === 2
  && places.find((s) => s.kind === p.KINDS.DICTATE).measured === 1,
  'والعددُ من سجلّ ليتنر نفسِه لا من عدٍّ ثانٍ يفترق عنه');

// **والكلمةُ صفٌّ واحد لا صفّان**: لو عُرضت كلُّ مهارةٍ ببطاقتها لَظهرت الكلمةُ
// مرّتين بنصٍّ واحد لا يفرّق الوالدُ نسخَها من إملائها.
const units = parent.wordUnits();
const wordRow = units.find((u) => u.unit === word);
ok(units.length === 2 && wordRow.kinds.length === 2,
  `و«${word}» صفٌّ واحد فيه نوعاها (${wordRow.kinds.map((k) => p.KIND_NAMES[k.kind]).join(' · ')})`);
ok(wordRow.sentence === false && units.find((u) => u.unit === line).sentence === true,
  'والجملةُ تُميَّز عن الكلمة فلا يقرأ الوالدُ سطراً كاملاً في صفّ «الكلمات»');
ok(units.every((u) => p.isWordSkill({ form: u.sentence ? p.SENTENCE_FORM : p.WORD_FORM })),
  'ولا حرفَ وهميّ في صفّ الكلمات — القسمةُ قسمةُ `isWordSkill` نفسِها');

// ————— ٥) اللوحةُ تُقرأ ولا تُسمَع —————

console.log('\n— ٥) اللوحةُ تُقرأ ولا تُسمَع —');
ok(!/from '\.\/audio\.js'|new Audio|speechSynthesis/.test(parentCode),
  'لا صوتَ في لوحة وليّ الأمر — شاشةُ بالغٍ تُقرأ، ولا نصَّ منطوقاً جديداً منها');

// ————— ٦) سطرُ الجودة: **الحكمُ الثالث** يبلغ وليَّ الأمر (م١٠) —————
//
// **المحروسُ ثلاثة**:
//   · ما له نصٌّ معتمدٌ في المحرّك يُقرأ منه **بحرفه** — ولا يُخترع له نصٌّ ثانٍ.
//   · والوصفان اللذان لا رمزَ خطأٍ لهما (الرجفةُ والحجم) **بأسمائها التي يدفعها
//     المحرّكُ فعلاً** — لا باسمٍ يُكتب هنا ويشيخ يومَ يتبدّل.
//   · **ووحدةٌ بلا سجلِّ جودةٍ لا سطرَ لها** — لا أصفارٌ تملأ اللوحة.

console.log('\n— ٦) سطرُ الجودة: وصفُ القبول بلسانٍ يقرؤه الوالد —');

// **الرمزُ يُقابَل بما يدفعه المحرّكُ نفسُه**: لو بُدِّل اسمُه في `pen.js` لَبقي
// السطرُ صامتاً بلا حمرة — فيُقرأ نصُّ المحرّك ويُطالَب بدفع الرمز الذي تعرضه اللوحة.
const penCode = codeOf(read('js/pen.js'));
ok(new RegExp(`guides\\.push\\('${parent.SHAKY}'\\)`).test(penCode),
  `ورمزُ الرجفة «${parent.SHAKY}» هو الذي يدفعه المحرّكُ في \`guides\` — لا اسمٌ يُكتب في اللوحة`);
ok([pen.SIZE.BIG, pen.SIZE.SMALL].every((code) =>
  parent.qualityLine({ unit: letter, code }).includes(parent.unitTitle(letter))
  && parent.qualityLine({ unit: letter, code }) !== `${parent.unitTitle(letter)} — `),
  'ولوصفَي الحجم جملتُهما — «يكتبه كبيراً» و«يكتبه صغيراً» بلسان وليّ الأمر');

// **وإرشادُ الطريقة بنصّه المعتمد بحرفه** — لا نصَّ ثانٍ له في اللوحة.
const guideCodes = [pen.FAULTS.START_FAR, pen.FAULTS.ORDER, pen.FAULTS.DOTS_FIRST,
  pen.FAULTS.INCOMPLETE];
ok(guideCodes.every((code) =>
  parent.qualityLine({ unit: letter, code }).endsWith(pen.FAULT_TEXT[code])),
  `وإرشاداتُ الطريقة بنصوصها المعتمدة في \`FAULT_TEXT\` بحرفها (${guideCodes.length} أوصاف)`);
ok(parent.qualityLine({ unit: letter, code: 'no-such-guide' }) === ''
  && parent.qualityMap([{ unit: letter, code: 'no-such-guide', n: 3, seen: 0 }]).length === 0,
  'ووصفٌ مجهولٌ لا يُخترع له نصّ — يسقط كما يسقط رمزُ الخطأ المجهول');

// **والخريطةُ تُجمع بالوحدة لا بمفتاح المهارة**: يقرأ الوالدُ حالَ يده في الحرف،
// لا جدولاً يفرّق تتبّعَه من حرّه.
const day = p.dayNumber();
p.recordQuality(letter, 'معزول', p.KINDS.FREE, [parent.SHAKY, pen.SIZE.BIG]);
p.recordQuality(letter, 'معزول', p.KINDS.TRACE, [parent.SHAKY]);
const qmap = parent.qualityMap();
const mine = qmap.find((u) => u.unit === letter);
ok(mine && mine.lines[0].code === parent.SHAKY && mine.lines[0].n === 2,
  `ورجفةُ التتبّع والحرّ سطرٌ واحدٌ بوحدته (${mine?.lines[0].n}) — لا سطرٌ لكلّ تمرين`);
ok(mine.lines[0].text === `${parent.unitTitle(letter)} — صحيحٌ ويدُه ترتجف`,
  `وتقرأ اللوحةُ: «${mine.lines[0].text}»`);
ok(parent.seenText(day) === 'آخرُها اليوم' && parent.seenText(day - 1) === 'آخرُها أمس'
  && /٣/.test(parent.seenText(day - 3)),
  `وآخرُ الحال بطابعه: «${parent.seenText(day)}» · «${parent.seenText(day - 3)}»`);

// **ولا سطرَ لمن لا سجلَّ له**: حرفٌ آخرُ في الرحلة لم يُوصَف قطّ لا يظهر أصلاً.
const other = nodes.filter((n) => n.type === 'letter').map((n) => n.letter)
  .find((l) => l !== letter);
ok(!qmap.some((u) => u.unit === other) && parent.qualityMap([]).length === 0,
  `وحرفٌ بلا سجلِّ جودةٍ لا سطرَ له («${parent.unitTitle(other)}») — ولا أصفارَ تملأ اللوحة`);

// **وهو وصفٌ لا عقاب** (عهدُ لا-رسوب): التسجيلُ لا يمسّ صندوقَ ليتنر ولا نجمة.
const boxBefore = p.skillBox(letter, 'معزول', p.KINDS.FREE);
p.recordQuality(letter, 'معزول', p.KINDS.FREE, [parent.SHAKY]);
ok(p.skillBox(letter, 'معزول', p.KINDS.FREE) === boxBefore,
  `والوصفُ لا يمسّ ليتنر — الصندوقُ ${boxBefore} قبلَه وبعدَه (وصفٌ لا عقاب)`);

console.log(fails ? `\n${fails} فشل` : '\nلوحةُ وليّ الأمر: الجملةُ مبنيّةٌ والمواضعُ كاملةٌ');
process.exit(fails ? 1 : 0);
