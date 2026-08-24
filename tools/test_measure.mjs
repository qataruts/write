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
// ————— حالُه في «اُكْتُبْ» (مُلئ في الجلسة ٣) —————
//
// **جردُ اقرأ لم يُنقَل**: محطاتُه محطاتُه (درسُ الحرف قراءةً · لعبةُ الكلمات ·
// القصةُ · السورة · البستان)، ولا موضوعَ لها هنا. **وجردُ اكتب مُلئ يومَ اشتُقّ
// المنهج** — سبعةُ أنواعٍ بأعيانها، لكلٍّ قياسُه أو إعفاؤه المكتوب.
//
// **ومتى يُطالَب كلُّ نوع؟** حين تُكتب شاشتُه لا قبلها. والإعفاءُ المؤقّت **لا يُكتب
// هنا بل يُقرأ من الموجّه نفسِه**: `SCREENS` في `main.js` جردُ الأنواع التي لم تُكتب
// شاشتُها بعدُ ومَن يملكها — فما دام النوعُ فيه فهو معلَّق، ويومَ تُكتب شاشتُه ويسقط
// سطرُه **يصير غيابُ قياسه فشلاً أحمر** بلا سطرٍ يُضاف هنا. (وهو نمطُ «التعليقُ
// يُطالِب من نفسه»، الجلسة ٠ — ومصدرُ الإعلان واحد: مَن يقرؤه الطفلُ يقرؤه الفاحص.)

const APP = new URL('../app/js/', import.meta.url);
const { readFileSync, existsSync } = await import('node:fs');
const read = (name) => readFileSync(new URL(name, APP), 'utf8');

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
  // التهيئةُ الحركية (`METHOD.md §٤` المرحلة ١): تدرّب اليد قبل أوّل حرف.
  // (كان هنا سطرُ `warmup` — طُويت محطتُه من الرحلة بمرسوم ٢٤ أغسطس ٢٠٢٦:
  // «ابدأ من الحروف مباشرة»، وحارسُ البائدة أعلاه هو الذي أوجب حذفَه.)
  // درسُ الحرف وأشكالُ مواقعه: حلقةٌ واحدة (`METHOD.md §٥`) — شاهِد ← تتبّع موجَّهاً
  // ← تتبّع خافتاً ← اكتبه وحدك. فالمقيسان `تتبع` و`حرّ` لكليهما.
  letter: { title: 'درس الحرف المعزول', file: 'lesson.js', kinds: [p.KINDS.TRACE, p.KINDS.FREE] },
  form: { title: 'أشكال المواقع', file: 'lesson.js', kinds: [p.KINDS.TRACE, p.KINDS.FREE] },
  // **والرقمُ يركب حلقةَ الحرف** (ت٥، `METHOD.md §١` و`§١٠`): شكلٌ واحد لا يتصل ولا
  // يتشكّل، فمفتاحُ ليتنر له `رقم|معزول|تتبّع` — يعود إلى المراجعة **الرقمُ بعينه**.
  digit: { title: 'كتابة الأرقام ٠–٩', file: 'lesson.js', kinds: [p.KINDS.TRACE, p.KINDS.FREE] },
  // **واسمُ الطفل يركبها كذلك** (ت٣): حروفُه بأشكال مواقعها، كلٌّ بمساره القانونيّ —
  // فما يُقاس فيها حروفُه المدروسةُ نفسُها، ولا وحدةَ جديدةً تدخل ليتنر باسمِ طفل.
  // 🔒 **ولا يخرج الاسمُ من الجهاز** ولا يُنطق (`EXPANSION.md §٤`).
  name: { title: 'اسمُ الطفل بيده', file: 'lesson.js', kinds: [p.KINDS.TRACE, p.KINDS.FREE] },
  // الوصلُ والنسخ: يرى الكلمةَ ويكتبها — نسخٌ خالص، ولا إملاءَ في هذه المرحلة.
  join: { title: 'الوصل والنسخ', file: 'copy.js', kinds: [p.KINDS.COPY] },
  // الخفوتُ ينتهي إلى الإملاء، فيكتب النوعين: ما دام النموذجُ ظاهراً فهو نسخ، وإذا
  // خفت كلُّه فهو إملاء — وعدّادُ الخفوت نفسُه يفصل بينهما.
  fade: { title: 'خفوت النموذج والإملاء', file: 'fade.js', kinds: [p.KINDS.COPY, p.KINDS.DICTATE] },
  sentence: { title: 'الجمل القصيرة', file: 'sentence.js', kinds: [p.KINDS.COPY, p.KINDS.DICTATE] },
  // البوابةُ قائمةٌ من الجلسة ٠ (`gate.js` من البذرة)، فيسري عليها العقدُ اليوم.
  gate: {
    title: 'بوابة العبور',
    file: 'gate.js',
    exempt: 'البوابةُ **تقيس ولا تدرّس**: تمارينُها تمارينُ المراجعة نفسُها '
      + '(`buildSession`)، فتكتب بأنواعِ غيرِها ولا نوعَ لها.',
  },
};

/**
 * **الأنواعُ التي لم تُكتب شاشتُها بعد — من الموجّه لا من قائمةٍ هنا**: `SCREENS` في
 * `main.js` هو الذي يمنع الطفلَ من طريقٍ مسدود ويقول مَن يملك كلَّ شاشة. فما دام
 * النوعُ فيه فقياسُه معلَّقٌ بإعلانٍ **يقرؤه الطفلُ قبل الفاحص**، ويومَ يسقط سطرُه
 * يصير مطالِباً بلا سطرٍ يُضاف هنا.
 */
const PENDING = new Map([...(read('main.js').match(/const SCREENS = \{(.*?)\n\};/s)?.[1] ?? '')
  .matchAll(/(\w+):\s*'([^']*)'/g)].map((m) => [m[1], m[2]]));

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
// **والنوعُ المُعلَّق يُعلَن ولا يُدَّعى**: ما دام في جرد الموجّه فشاشتُه لم تُكتب،
// ويومَ يسقط سطرُه منه يصير هذا الفحصُ مطالِباً بقياسه بلا سطرٍ يُعدَّل هنا.
// **وإن كُتبت الشاشةُ في ملفٍّ باسمٍ آخر حمِرَ الفحصُ** ولم يسكت: تُصحَّح `file`
// عندئذٍ سطراً واحداً — أهونُ من حارسٍ يتخطّى صامتاً ما لا يجد.

console.log('\n— الشيفرة: مَن أعلن قياساً كتبه —');
const KIND_CONST = Object.fromEntries(Object.entries(p.KINDS).map(([name, value]) => [value, name]));

for (const [type, station] of declared) {
  if (PENDING.has(type)) {
    skip(`[${type}] ${station.title}: ${PENDING.get(type)} — يُطالَب يومَ يسقط سطرُه من الموجّه`);
    continue;
  }
  const url = new URL(station.file, APP);
  if (!existsSync(url)) {
    ok(false, `[${type}] ${station.title}: شاشتُه خرجت من جرد الموجّه و\`${station.file}\` لا وجودَ له`);
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

// ————— ٢ب) **المُعلَنُ يُنادى فعلاً**: يُمشى الطريقُ لا يُقرأ السطر —————
//
// 🔴 **علّتُه مقيسة** (مراجعةُ المدير للجلسة م٣): محطةُ التمييز صارت **تدرّس ولا
// تكتب مهارتها**، وهذا الحارسُ أخضرُ — لأنّ البابَ أعلاه يقرأ `recordAttempt`
// **مكتوبةً** ولا يسأل: أتُنادى؟ فكان الطريقُ إلى `onDone` ينقطع في الحكم الثاني
// (يُقبَل جسمُ الأخت، ثم يُعيد الطفلُ الشكلَ فتُقاس ضربتُه الأولى على الجزء الباقي
// فتُردّ أبداً) — **والمهارةُ لا تُكتب، والبوابةُ ولوحةُ وليّ الأمر عمياوان**. وهي
// عينُ العلّة التي بُني لأجلها هذا الحارس، في وجهٍ لم يكن يراه.
//
// **فالبابُ يمشي الطريق**: تُدار **آلةُ الخطوة الحرّة نفسُها** (`createFreeRun` —
// وهي التي يقودها اللوح، لا نسخةٌ ثانية) على **مادّة الرحلة الحيّة**، ويُقاس أنّها
// تبلغ آخرَها؛ فبلوغُ آخرِها هو وحدَه ما ينادي `onDone ← finishStep ← score`.
//
// **ومجرَّبٌ سالباً**: جوابٌ ناقصٌ (بلا نقطته) لا يبلغ آخرَه — فلو صار البابُ يخضرّ
// لكلّ لمسةٍ لَما فرّق بين الجواب ونصفِه، ولَعاد أخضرَ على العطب الذي وُلد له.
console.log('\n— ٢ب) المُعلَنُ يُنادى فعلاً: يُمشى الطريقُ لمسةً لمسة —');
{
  const pen = await import(new URL('pen.js', APP));
  const { pathOf, FORMS } = await import(new URL('curriculum.js', APP));
  /** لمساتُ جوابٍ صحيح: أجسامُ المسار ثم نقاطُه بعددها — يدُ طفلٍ تكتب ما يُطلَب. */
  const answerOf = (ref) => [
    ...ref.strokes.map((st) => st.points),
    ...(ref.dots || []).flatMap((d) => Array.from({ length: d.count || 1 }, () => [d.at, d.at, d.at])),
  ];
  const walkRun = (ref, touches) => {
    const run = pen.createFreeRun(ref, {});
    for (const points of touches) run.push(points);
    return run;
  };

  // **مادّةُ كلِّ محطةٍ حرّةٍ من الرحلة نفسِها** لا من رقمٍ مكتوب: أوّلُ ما تعرضه.
  const nodes = p.allNodes();
  const first = (type) => nodes.find((n) => n.type === type);
  const compareNode = nodes.find((n) => n.type === 'form' && n.compare);
  const fadeNode = first('fade');
  const sentenceNode = first('sentence');
  const words = await import(new URL('word_paths.js', APP));
  const ROADS = [
    ['letter', 'درس الحرف', pathOf(first('letter')?.letter, FORMS.ISOLATED)],
    ['form', 'أشكال المواقع', pathOf(first('form')?.letters?.[0], first('form')?.form)],
    // **وللتمييز جوابٌ خاطئٌ بعينه**: أختُها من الأسرة نفسِها — جسمُها جسمُها
    // والفارقُ نقطتُها، وهي **الجوابُ الذي يقع من طفلٍ حقيقيّ** (وبها انقطع الطريق).
    compareNode && ['form', 'تمييز المتشابهات',
      pathOf(compareNode.compare[0][0], compareNode.form),
      pathOf(compareNode.compare[0][1], compareNode.form)],
    fadeNode && ['fade', 'خفوتٌ فإملاء', words.WORD_PATHS[fadeNode.words[0]]],
    sentenceNode && ['sentence', 'الجمل', words.WORD_PATHS[sentenceNode.text || sentenceNode.sentences?.[0]]],
  ].filter((road) => road && road[2]);

  for (const [type, title, ref, sister] of ROADS) {
    if (PENDING.has(type)) { skip(`[${type}] ${title}: شاشتُه معلَّقة`); continue; }
    const answer = answerOf(ref);
    const run = walkRun(ref, answer);
    ok(run.done,
      `[${type}] ${title}: الجوابُ الصحيح **يبلغ آخرَ الطريق** فتُكتب مهارتُه`
      + ` (${run.settled}/${run.parts.length} جزءاً)`
      + `${run.done ? '' : ' ← الطريقُ منقطع: المحطةُ تدرّس ولا تقيس'}`);
    /**
     * **والجوابُ المردودُ لا يسدّ الطريق** — وهو الوجهُ الذي انقطع: يُكتب جوابٌ
     * خاطئ **يُقبَل أوّلُ جزءٍ منه** (جسمُ الأخت جسمُها)، ثم تُردّ بقيّتُه، ثم
     * **يُعيد الطفلُ الشكلَ كلَّه** كما يفعل كلُّ طفلٍ رُدَّ عليه. فإن لم يُستأنَف
     * من أوّله بقيت أوّلُ ضربةٍ تُقاس على **الجزء الباقي** فتُردّ أبداً —
     * **فتدرّس المحطةُ ولا تقيس**. (وهو الطريقُ الذي كُشف مقيساً في التمييز.)
     */
    const wrong = sister ? answerOf(sister) : [answer[0], [[0, 0], [0, 0]]];
    /**
     * 🔴 **انقلب الوجهُ بمرسوم «نقيس ولا نرفض»** (٢٤ أغسطس ٢٠٢٦): لم يعد في شاشات
     * الكتابة ردٌّ أصلاً — `judge:'defer'` يلتقط الحبرَ صامتاً **ويقيس عند «تَابِعْ»**
     * بـ`judgeShape`، فسؤالُ «هل يستأنف الماشي بعد ردّ؟» يسأل عن آلةٍ لم تعد تُشغَّل.
     * **والمحروسُ اليوم أصدقُ**: حبرٌ خاطئٌ يسبق الصوابَ **لا يُفسد القياس** — يُقاس
     * المجموعُ فيبلغ استرجاعُه استرجاعَ الصواب وحدَه (فالزائدُ يُنقص الدقّةَ لا الاسترجاع)
     * — **وهذا هو «لا يسدّ الطريق» في عهد القياس**.
     */
    // **والحبرُ يُسلَّم كما يسلّمه اللوحُ**: قائمةُ ضرباتٍ كلٌّ منها نقاطٌ خام
    // (`judgeShape` يقرأ `s.map((p) => [p[0], p[1]])`) — لا كائناتٍ ملفوفة.
    const clean = pen.judgeShape(ref, answer);
    const mixed = pen.judgeShape(ref, [...wrong, ...answer]);
    const recallOf = (v) => Math.round((v?.metrics?.recall ?? v?.recall ?? 0) * 100);
    /**
     * 🔴 **والمحروسُ هنا «لا يسدّ الطريق» بعينه**: القياسُ يجري ويُبلِّغ رقماً مهما
     * كان الحبرُ — فالطفلُ يمضي أبداً (مرسومُ المضيّ). **ودَينٌ مسمّى مقيسٌ بجانبه**
     * («دَينُ الحبر الشارد»، ٢٥ أغسطس ٢٠٢٦): تطبيعُ `shapeNormal` يُقاس على صندوق
     * الحبر كلِّه، **فلمسةٌ شاردةٌ في زاوية اللوح تُصغّر الكتابةَ كلَّها فينهار
     * الاسترجاع** — قِيس على «ب/معزول»: ١٠٠٪ مقبولاً ⇐ ٦٢٪ مردوداً، **أينما وقعت
     * الشاردةُ** (قبلَ الكتابة أو بعدها أو وسطَها). لا يحبس أحداً، **لكنّه يكذب على
     * النجوم ولوحة الأهل** — وإصلاحُه بندُ معايرةٍ ببوابة الميدان لا ترقيعُ عتبة.
     */
    ok(Number.isFinite(recallOf(mixed)),
      `  و**حبرٌ شاردٌ لا يسدّ الطريق**: ${sister ? 'حبرُ الأخت' : 'خربشةٌ'}`
      + ` ثم كتابةُ الشكل كاملاً ⇐ يُقاس ويمضي (استرجاعٌ ${recallOf(mixed)}٪`
      + ` مقابل ${recallOf(clean)}٪ للصواب وحدَه — دَينُ الحبر الشارد)`);
  }
  // والسالبُ في الطريق نفسِه: ناقصُ الجواب لا يبلغ آخرَه.
  const dotted = ROADS.map(([, , ref]) => ref).find((ref) => (ref.dots || []).length);
  if (dotted) {
    const short = walkRun(dotted, answerOf(dotted).slice(0, -1));
    ok(!short.done,
      `ومجرَّبٌ سالباً: جوابٌ بلا نقطته لا يبلغ آخرَه (${short.settled}/${short.parts.length})`
      + ' — فالبابُ يفرّق بين الجواب ونصفِه ولا يخضرّ من فراغ');
  } else {
    skip('ولا مادّةَ منقوطةً في الرحلة لتجريب السالب — يُطالَب يومَ تدخل');
  }
  // **والطريقُ موصولٌ بالقياس نصّاً**: بلوغُ آخرِه ينادي `onDone`، وهي تنادي `score`،
  // وهي تنادي `recordAttempt` — فلا يبقى بين المقيس والمكتوب فجوةٌ لا يراها أحد.
  const lesson = read('lesson.js');
  ok(/onDone:\s*\(\w*\)\s*=>\s*\{[^}]*finishStep\(/s.test(lesson)
    && /function finishStep[^}]*score\(/s.test(lesson)
    && /function score[^}]*recordAttempt\(/s.test(lesson),
    'وبلوغُ آخرِ الطريق موصولٌ بالقياس: `onDone ← finishStep ← score ← recordAttempt`');
  // **وقناةُ الجودة موصولةٌ بحمولتها** (م١٠): كانت `onDone` تُهمِل ما يسلّمه المحرّك،
  // فيُحكَم بالوصف ولا يبلغ أحداً. **والمحروسُ الحمولةُ بعينها** — لا مجرّدُ نداء:
  // ما تستقبله `onDone` هو ما يُمرَّر إلى التسجيل، فلا اشتقاقَ في الشاشة.
  ok(/onDone:\s*\((\w+)\)\s*=>\s*\{[^}]*noteQuality\(step, unit, \1\)/s.test(lesson)
    && /function noteQuality[^}]*progress\.recordQuality\(/s.test(lesson),
    'ووصفُ القبول موصولٌ بسجلّه: `onDone(الحمولة) ← noteQuality ← recordQuality`');
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
    // **وتمارينُ الحروف مُلئت في الجلسة ٥** (`trace` و`free`)، وبقي ما مادّتُه كلماتٌ:
    // النسخُ للجلسة ٨ والإملاءُ للجلسة ٩ — ولا يُسأل الطفلُ عمّا لم يُدرَّس كتابةً.
    skip(`[${kind}] لا مُصيِّرَ له في \`review.js\` بعدُ — مادّتُه كلماتٌ (الجلستان ٨ و٩)`);
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
//
// **وهذا فحصٌ حيّ لا نصّيّ** (مُلئ في الجلسة ١٠): تُسجَّل مهارةٌ من كلِّ نوع، ثم
// يُسأل **بناةُ اللوحة أنفسُهم** — `letterStats` و`wordUnits` و`kindPlaces` — أين
// وقعت. فبطاقةٌ تسقط من صفّها تُحمِر هذا السطر، ولا يكفي أن يُذكَر اسمُ القسم نصّاً.

console.log('\n— لوحة وليّ الأمر: لكل مقيسٍ موضعُه —');
const parentSrc = readFileSync(new URL('parent.js', APP), 'utf8');
const parent = await import(new URL('parent.js', APP));

const LETTER = p.allNodes().find((n) => n.type === 'letter').letter;
const WORD = p.allNodes().find((n) => n.type === 'fade').words[0];
for (const kind of Object.values(p.KINDS)) {
  p.recordAttempt(LETTER, 'معزول', kind, true);
  p.recordAttempt(WORD, p.WORD_FORM, kind, true);
}

const board = p.letterStats();
const units = parent.wordUnits();
const places = parent.kindPlaces();

for (const kind of Object.values(p.KINDS)) {
  const asLetter = p.isLetterSkill({ kind, unit: LETTER, form: 'معزول' })
    && board.some((s) => s.letter === LETTER);
  const asWord = units.some((u) => u.unit === WORD && u.kinds.some((k) => k.kind === kind));
  const named = places.find((s) => s.kind === kind);
  ok(asLetter && asWord && named?.measured === 2,
    `[${kind}] يقرؤه وليُّ الأمر — حرفاً في لوحة الحروف، وكلمةً في «الكلمات نسخاً`
    + ` وإملاءً»، وباسمه «${named?.name || '—'}» في صفّ الأنواع`);
}

ok(/الكلمات نسخاً وإملاءً/.test(parentSrc) && /لكلِّ نوع تمرينٍ موضعُه/.test(parentSrc),
  'والقسمان معنونان في اللوحة بحرفهما — يجدهما الوالدُ بعينه لا بالبحث');
ok(units.every((u) => u.kinds.length && u.kinds.every((k) => p.isWordSkill(k))),
  'وقسمُ الكلمات يُبنى من سجلّ ليتنر نفسِه — لا من عدٍّ ثانٍ يفترق عنه');
ok(!board.some((s) => s.letter === WORD),
  'ولا يظهر «حرفٌ» اسمُه كلمة في لوحة الحروف — القسمةُ قسمةُ `isWordSkill`');

// ————— ٥) قناةُ الجودة: يُوصَف القبولُ ولا يُهدَم مخزون (م١٠) —————
//
// **الحكمُ الثالث** (`ENGINE_PLAN §٣ب-٢`): بين «مقبول» و«مردود» حالٌ ثالثة —
// «صحيحٌ ويدُه ترتجف». والمحرّكُ يحسبها ويسلّمها، فالمحروسُ هنا شقّان:
//   · **أنّها تتراكم بمفتاح مهارتها** (وحدة × شكل موقع × نوع) — لا بمفتاحٍ ثانٍ.
//   · **وأنّها حقلٌ إضافيّ لا هجرةَ معه**: مخزونُ طفلٍ كُتب قبل البند يُقرأ سليماً
//     وغيابُ الحقل صفرٌ مضمون — فلا يفقد طفلٌ نجمةً لأنّنا أضفنا عمودًا.

console.log('\n— قناةُ الجودة: وصفُ القبول يُسجَّل ولا يهدم مخزوناً —');

const QKEY = p.skillKey(LETTER, 'معزول', p.KINDS.FREE);
p.recordQuality(LETTER, 'معزول', p.KINDS.FREE, ['shaky', 'size-big']);
p.recordQuality(LETTER, 'معزول', p.KINDS.FREE, ['shaky']);
const qbag = p.qualityOf(QKEY);
ok(qbag?.shaky?.n === 2 && qbag['size-big']?.n === 1
  && qbag.shaky.seen === p.dayNumber(),
  `الوصفُ يتراكم بمفتاح مهارته «${QKEY}»: رجفةٌ ${qbag?.shaky?.n} وحجمٌ `
  + `${qbag?.['size-big']?.n} — وآخرُ حالٍ بيومه`);
ok(p.qualityOf(p.skillKey(LETTER, 'معزول', p.KINDS.TRACE)) === null
  && p.recordQuality(LETTER, 'معزول', p.KINDS.FREE, []) === null,
  'ومهارةٌ لم تُوصَف سجلُّها **معدوم** لا صفرٌ مصنوع — وقبولٌ بلا وصفٍ لا يكتب شيئاً');

// **متانةُ الغياب**: مخزونٌ من قبل البند — بنجومه وصناديقه وبلا حقل الجودة أصلاً —
// يُقرأ سليماً، ولا يُعاد تشكيلُ بنيةٍ قائمة.
const OLD_KEY = 'uktub.progress.v1';
const keep = store.get(OLD_KEY);
const legacy = JSON.parse(keep);
delete legacy.quality;
store.set(OLD_KEY, JSON.stringify(legacy));
const reloaded = await import(`${new URL('progress.js', APP)}?legacy=1`);
const oldSkill = reloaded.getSkill(QKEY);
ok(!('quality' in legacy) && oldSkill && oldSkill.box === legacy.skills[QKEY].box
  && Object.keys(reloaded.journey()).length > 0,
  'ومخزونٌ قديمٌ بلا حقل الجودة يُقرأ سليماً — نجومُه وصناديقُه كما كانت');
ok(reloaded.qualityOf(QKEY) === null && reloaded.quality().length === 0,
  'وغيابُ الحقل **صفرٌ مضمون** لا انهيار — لا سجلَّ جودةٍ ولا استثناء');
const written = reloaded.recordQuality(LETTER, 'معزول', p.KINDS.FREE, ['shaky']);
ok(written?.shaky?.n === 1,
  'ويكتب فوقه من أوّل قبولٍ موصوف — فالحقلُ يُنشأ عند الحاجة لا بهجرةٍ تمسّ الكلّ');
store.set(OLD_KEY, keep);

// **والسالبُ مجرَّب**: يُعطَّل التسجيلُ في نسخةِ ذاكرةٍ من الوحدة (لا يُمَسّ الأصل)
// فيجب أن يحمرّ شاهدُه — وإلّا فالشاهدُ يخضرّ من فراغ.
const SRC = readFileSync(new URL('progress.js', APP), 'utf8');
// (ومساراتُ الاستيراد تُحوَّل مطلقةً: نسخةُ `data:` لا أصلَ لها تُنسَب إليه.)
const off = SRC
  .replace(/from '\.\/([\w.]+)'/g, (_, f) => `from '${new URL('.', APP)}${f}'`)
  .replace('  bag[key] = entry;', '  bag[key] = bag[key] || {};');
const alt = await import(`data:text/javascript;base64,${Buffer.from(off, 'utf8').toString('base64')}`);
alt.recordQuality(LETTER, 'معزول', p.KINDS.TRACE, ['shaky', 'size-big']);
ok(!alt.qualityOf(p.skillKey(LETTER, 'معزول', p.KINDS.TRACE))?.shaky,
  'ومجرَّبٌ سالباً: تُعطَّل كتابةُ السجلّ في نسخةِ ذاكرةٍ فيحمرّ شاهدُ التراكم');
store.set(OLD_KEY, keep);

console.log(fails ? `\n${fails} فشل` : '\nكل اختبارات «لا تدريسَ بلا قياس» ناجحة');
process.exit(fails ? 1 : 0);
