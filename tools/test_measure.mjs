// حارس «لا تدريسَ بلا قياس» (`METHOD.md §٦`) — **من بذرة اقرأ**:
//   node tools/test_measure.mjs
//
// **العلّة** (درسٌ دفع اقرأ ثمنَه): فجوةُ قياسٍ عاشت عنده أربع عشرة حزمةً صامتة. لا
// لأنّ أحداً أخطأ، بل لأنّ **غياب القياس لا يُفشِل اختباراً**: كلُّ حارسٍ يفحص ما
// كُتب، ولا حارسَ يسأل عمّا لم يُكتب. فكان درسٌ يعلّم ولا يسجّل مهارةً واحدة، وكانت
// كلُّ الاختبارات خضراء — والبوابةُ ولوحةُ وليّ الأمر عمياوان.
//
// وهذا الحارس يقلب القاعدة: **يجرد الرحلةَ نفسَها** نوعَ محطةٍ نوعَ محطة، ويطالب كلَّ
// محطةٍ تدرّس مهارةً بقياسٍ مقابلٍ في ليتنر — فالغيابُ نفسُه صار فشلاً أحمر. ومحطةٌ
// جديدة تدخل الرحلة بلا قياسٍ ولا إعفاءٍ مكتوب **تُسقِط هذا الاختبار يومَ تُضاف**.
//
// ————— حالُه في «اُكْتُبْ» اليوم (الجلسة ٠) —————
//
// **جردُ اقرأ لم يُنقَل**: محطاتُه محطاتُه (درسُ الحرف قراءةً · لعبةُ الكلمات ·
// القصةُ · السورة · البستان)، ولا موضوعَ لها هنا. **وجردُ اكتب تملؤه الجلسة ٣**
// (`SESSIONS.md`: «تهيئة `test_measure` و`test_nodes` على أنواع محطات اكتب
// بإعفاءاتٍ مكتوبةٍ بسببها») — بعد أن يُشتقّ المنهج ويُعرَف ما في الرحلة فعلاً.
//
// **والتعليقُ يُطالِب من نفسه**: ما دامت الرحلةُ فارغة فلا نوعَ يُسأل عنه؛ ويومَ
// تدخلها أوّلُ محطة يصير غيابُ سطرها من `STATIONS` **فشلاً أحمر** — لا سطرَ يُضاف
// هنا ولا انتباهٌ يُرجى. وهو عينُ عهد البذرة: الجدولُ عقدٌ، والجردُ يجد ما جدّ.

const APP = new URL('../app/js/', import.meta.url);

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const p = await import(new URL('progress.js', APP));

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };
const skip = (msg) => console.log('  ○', msg);

// ————— الجرد المُعلَن: نوعُ المحطة ← قياسُها أو سببُ إعفائها —————
//
// **هذا الجدول هو العقد**. مَن أضاف محطةً إلى الرحلة فعليه أن يُدخلها هنا: بقياسٍ
// تملكه، أو بإعفاءٍ يبرّره — ولا ثالث. وليس التعديلُ فيه هروباً من الفشل: كتابةُ
// «هذه المحطة تعلّم ولا تقيس» سطراً صريحاً هي عينُ ما نريده أن يُقرأ في المراجعة.
//
// الشكل: `<نوع>: { title, file, kinds: [...] }` أو `{ title, file, exempt: 'السبب' }`.

const STATIONS = {
  // البوابةُ قائمةٌ من الجلسة ٠ (`gate.js` من البذرة)، فيسري عليها العقدُ اليوم.
  gate: {
    title: 'بوابة العبور',
    file: 'gate.js',
    exempt: 'البوابةُ **تقيس ولا تدرّس**: تمارينُها تمارينُ المراجعة نفسُها '
      + '(`buildSession`)، فتكتب بأنواعِ غيرِها ولا نوعَ لها.',
  },
};

// ————— ١) الإعلان: لا نوعَ محطةٍ في الرحلة خارج الجرد —————

console.log('\n— جرد الرحلة: كل نوع محطةٍ مُعلَن —');
const types = [...new Set(p.allNodes().map((n) => n.type))].sort();

if (!types.length) {
  skip('لا محطةَ في الرحلة بعدُ — المنهجُ يُشتقّ آلياً في الجلسة ٣، والجردُ يُملأ معه');
} else {
  const unknown = types.filter((t) => !STATIONS[t]);
  ok(unknown.length === 0,
    `${types.length} نوعَ محطةٍ في الرحلة، كلُّها في الجرد (${types.join('، ')})`
    + (unknown.length ? ` — **خارج الجرد: ${unknown.join('، ')}** (قياساً أو إعفاءً)` : ''));

  const stale = Object.keys(STATIONS).filter((t) => !types.includes(t));
  ok(stale.length === 0,
    'ولا سطرَ في الجرد لمحطةٍ سقطت من الرحلة'
    + (stale.length ? ` — بائدة: ${stale.join('، ')}` : ''));
}

const declared = Object.entries(STATIONS);
ok(declared.every(([, s]) => (s.kinds?.length > 0) !== Boolean(s.exempt)),
  'ولكلٍّ قياسُها **أو** إعفاؤها المكتوب — لا الاثنان ولا لا شيء');
ok(declared.filter(([, s]) => s.exempt).every(([, s]) => s.exempt.length > 40),
  'وسببُ الإعفاء جملةٌ تُقرأ لا كلمةٌ تُكتب للمرور');

// ————— ٢) الشيفرة: المالكةُ تكتب فعلاً، والمعفاةُ لا تكتب —————
//
// **والملفُّ الذي لم يُكتب بعدُ يُعلَن ولا يُدَّعى**: الشرطُ وجودُه على القرص، فيومَ
// تكتبه جلستُه يصير هذا الفحصُ مطالِباً به بلا سطرٍ يُعدَّل.

console.log('\n— الشيفرة: مَن أعلن قياساً كتبه —');
const KIND_CONST = Object.fromEntries(Object.entries(p.KINDS).map(([name, value]) => [value, name]));
const { readFileSync, existsSync } = await import('node:fs');

for (const [type, station] of declared) {
  const url = new URL(station.file, APP);
  if (!existsSync(url)) {
    skip(`[${type}] ${station.title}: \`${station.file}\` لم يُكتب بعدُ — يُفحَص يومَ يُكتب`);
    continue;
  }
  const body = readFileSync(url, 'utf8');
  if (station.exempt) {
    ok(!/progress\.recordAttempt\s*\(/.test(body),
      `[${type}] ${station.title}: لا تسجّل مهارةً — ${station.exempt.split('(')[0].trim()}`);
    continue;
  }
  const written = station.kinds.filter((kind) =>
    new RegExp(`recordAttempt\\([^;]*KINDS\\.${KIND_CONST[kind]}\\b`, 's').test(body));
  ok(written.length === station.kinds.length,
    `[${type}] ${station.title} تكتب ${station.kinds.join(' و')} في ${station.file}`
    + (written.length < station.kinds.length
      ? ` — **غائب: ${station.kinds.filter((k) => !written.includes(k)).join('، ')}**` : ''));
}

// ولا نوعَ في `KINDS` بلا محطةٍ تكتبه (وإلا فهو قياسٌ لا يقيس شيئاً)
const owned = new Set(declared.flatMap(([, s]) => s.kinds || []));
const orphan = Object.values(p.KINDS).filter((kind) => !owned.has(kind));
if (!types.length) {
  skip(`أنواعُ القياس الأربعة (${Object.values(p.KINDS).join('، ')}) معلَنةٌ في `
    + '`progress.js` عن `METHOD §٦`، وتملكها محطاتُها ابتداءً من الجلسة ٤');
} else {
  ok(orphan.length === 0,
    `وكلُّ نوعٍ في KINDS تملكه محطةٌ في الرحلة (${Object.values(p.KINDS).length} أنواع)`
    + (orphan.length ? ` — يتيم: ${orphan.join('، ')}` : ''));
}

// ————— ٣) المراجعة: لكل قياسٍ تمرينٌ يراجعه فعلاً —————
//
// **لا مهارةَ تُقاس بلا تمرينٍ يراجعها**: فحصٌ حيّ لا نصيّ — يُبنى لكل نوعٍ مستحقٌّ
// وتُطلَب منه جلسة، فإن لم تُنتج تمرينَه بقيت مهاراتُه في الصندوق الأول أبداً.

console.log('\n— المراجعة: لكل نوع قياسٍ تمرينُه —');
const { VIEWS, buildSession } = await import(new URL('review.js', APP));

for (const kind of Object.values(p.KINDS)) {
  if (!VIEWS[kind]) {
    skip(`[${kind}] لا مُصيِّرَ له في \`review.js\` بعدُ — تمارينُ القلم للجلسة ٥`);
    continue;
  }
  const built = buildSession({ due: [{ kind, unit: 'ب', form: 'معزول', box: 0, wrong: 1 }] })
    .some((item) => item.kind === kind);
  ok(built, `[${kind}] مهارةٌ مستحقّة تُنتج تمرينَها في جلسة المراجعة`);
}

// والبوابةُ تُبنى بالمحرّك نفسِه، فما دخل المراجعةَ دخلها
const gateSrc = readFileSync(new URL('gate.js', APP), 'utf8');
ok(/buildSession/.test(gateSrc) && /weakestSkills/.test(gateSrc),
  'والبوابةُ تبني بالمحرّك نفسِه من أضعف المهارات — فما يُقاس يُسأل عنه فيها');

// ————— ٤) لوحة وليّ الأمر: لا مهارةَ مقيسةٌ لا يقرؤها الوالد —————
//
// كلُّ نوعٍ إمّا أن يدخل لوحةَ الحروف (وحدتُه حرفٌ × شكلُ موقع)، وإمّا أن يكون له
// **قسمُه** (الكلمةُ لا حرفَ لها) — ولا نوعَ يُقاس ثم يختفي من اللوحة كلها.

console.log('\n— لوحة وليّ الأمر: لكل مقيسٍ موضعُه —');
const parentSrc = readFileSync(new URL('parent.js', APP), 'utf8');
for (const kind of Object.values(p.KINDS)) {
  const letterUnit = { kind, unit: 'ب', form: 'معزول' };
  const wordUnit = { kind, unit: 'بابا', form: p.WORD_FORM };
  const section = p.isLetterSkill(letterUnit) ? 'لوحة الحروف' : '—';
  const shown = section === 'لوحة الحروف' || /الكلمات نسخاً وإملاءً/.test(parentSrc);
  ok(shown && p.isWordSkill(wordUnit) === true,
    `[${kind}] يقرؤه وليُّ الأمر — حرفاً في ${section}، وكلمةً في قسم «الكلمات نسخاً وإملاءً»`);
}
ok(/progress\.skills\(\)\.filter\(progress\.isWordSkill\)/.test(parentSrc),
  'وقسمُ الكلمات يُبنى من سجلّ ليتنر نفسِه — لا من عدٍّ ثانٍ يفترق عنه');

console.log(fails ? `\n${fails} فشل` : '\nكل اختبارات «لا تدريسَ بلا قياس» ناجحة');
process.exit(fails ? 1 : 0);
