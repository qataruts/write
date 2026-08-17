// اختبار «وضع الدعم» — جلسة د: نغيّر الإيقاع لا المادة.
//   node tools/test_support.mjs
// يخرج بـ١ عند أي إخفاق.
//
// **والمحروسُ تسعةٌ بعدد بنود العقد** (`2026-08-17-support-mode-contract-for-siblings.md`)
// — يُنقَل العقدُ كتلةً، فيُحرَس كتلةً:
//   ١) **الافتراضُ الصامت = السلوكُ القائم حرفاً** (مطفأً لا فرقَ ببايت).
//   ٢) المقابضُ تعمل حين تُشغَّل، والإطفاءُ يردّ القائم بلا فقدِ اختيارات الوالد.
//   ٣) **حقلُ `measures` يصنّف كلَّ مقبض** ومنه تُشتقّ قائمةُ التعطيل — لا قائمةٌ ثانية.
//   ٤) **الملقَّنُ لا يرقّي صندوقاً ولا يُحتسب إتقاناً**، **ووسمُ العون مجرودٌ آلياً**
//      في كل موضع قياسٍ في شاشات الاكتساب — فموضعٌ جديد بلا وسمٍ يحمرّ.
//   ٥) **لا عونَ خارج الاكتساب** — ولا في المراجعة ولا البوابة ولا اللحاق: حصانةٌ
//      بنيوية تُجرد على المصدر (تلك الوحداتُ لا تعرف `easeFor` أصلاً).
//   ٦) **مؤشّرٌ في الشريط اللاصق** بلا كلمةِ بطءٍ ولا زحزحةِ تخطيط.
//   ٧) **مسطرةُ الامتحان الواحدة** بنطاقِ بناءٍ متزامن لا عَلَمٍ يُخزَّن.
//   ٨) **سطرُ الوعد الصادق** من مصدرٍ واحد في اللوحة والتعريفية معاً.
//   ٩) **لا مِقبضَ يمسّ المادّة ولا محرّكَ الحكم**: الوحدةُ لا تستورد شيئاً،
//      و`pen.js` لا يعرفها — المقابضُ تبلغه بمعاملاته المعلَنة وحدَها.
//
// **وكلُّ باب مجرَّبٌ سالباً**: لا يكفي أن يُقال «مطفأ»، بل يُشغَّل فيتغيّر ويُطفأ
// فيعود؛ ولا يكفي أن يُقال «يُعطَّل في الامتحان»، بل يُقاس داخلَ النطاق وخارجَه.

import { readFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const APP = new URL('app/js/', ROOT);

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const support = await import(new URL('support.js', APP));
const progress = await import(new URL('progress.js', APP));
const { SESSION_SIZE, buildSession } = await import(new URL('review.js', APP));
const { GATE_SIZE } = await import(new URL('gate.js', APP));
const { TOLERANCE } = await import(new URL('pen.js', APP));

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

const src = (name) => readFileSync(new URL(name, APP), 'utf8');
/**
 * **الشيفرةُ بلا تعليقها** — فالجردُ على ما يُنفَّذ لا على ما يُشرَح: ملفٌّ يشرح في
 * تعليقه أنّه لا يعرف الدعمَ يجب أن يبقى أخضرَ، وملفٌّ يستدعيه في سطرٍ يحمرّ.
 */
const code = (name) => src(name)
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .split('\n').filter((line) => !/^\s*\/\//.test(line)).join('\n');
const css = readFileSync(new URL('app/css/app.css', ROOT), 'utf8');

/** شاشاتُ الاكتساب — وهي وحدَها التي يجوز فيها عونُ السماحة، وكلُّها تقيس. */
const ACQUIRE = ['lesson.js', 'copy.js', 'fade.js', 'sentence.js'];
/** ما لا يجوز فيه العون ألبتّة: المراجعةُ والبوابةُ واللحاق — وسائرُ الوحدات. */
const NO_AID = ['review.js', 'gate.js', 'catchup.js', 'warmup.js', 'main.js', 'parent.js',
  'progress.js', 'pen.js', 'ui.js', 'audio.js', 'curriculum.js', 'paths.js'];

// ————— ١) الافتراضُ الصامت: السلوكُ القائم حرفاً —————

console.log('\n١. الافتراض الصامت = السلوك القائم (مطفأً لا فرقَ ببايت)');

support.reset();
ok(support.modeOn() === false, 'وضعُ الدعم مطفأٌ ابتداءً (مخزنٌ فارغ)');
ok(support.KEYS.every((k) => support.value(k) === support.KNOBS[k].standing),
  `وكلُّ مقبضٍ يقرأ قيمتَه القائمة (${support.KEYS.length} مقابض)`);
ok(support.KEYS.every((k) => support.isOn(k) === false), 'ولا مِقبضَ مشتغلٌ والوضعُ مطفأ');

ok(support.sessionSize() === 6, `جرعةُ المراجعة ستّة تمارين (${support.sessionSize()})`);
ok(support.demoPace() === 1, 'وسرعةُ العرض المتحرك ١ — فلا يُمَسّ `SPEED` في المحرّك أصلاً');
ok(support.inkWeight() === 1, 'وسُمكُ الخطّ ١ — فخاصّيةُ CSS تُحذَف ولا تُكتب');
ok(support.calm() === false, 'ولا هدوءَ حسّياً');
ok(support.mayEase(0) === false, 'ولا سماحةَ موسَّعة ألبتّة — ولو في أوّل لقاء');

// **والسماحةُ تعود كما جاءت حرفاً** — رقماً كانت أو غيرَ معلَنة
const asIs = [undefined, 1, 0.9, 2.78];
ok(asIs.every((t) => support.easeFor(t, 0).tolerance === t && !support.easeFor(t, 0).aided),
  `وسماحةُ كلِّ محطةٍ تمرّ كما أعلنتها مادّتُها (${asIs.map(String).join('، ')})`);

ok(SESSION_SIZE === support.KNOBS.dose.standing,
  `و«SESSION_SIZE» في المراجعة هو عينُ القائم في الجدول (${SESSION_SIZE})`);
const due = [{ unit: 'ب', form: 'معزول', kind: progress.KINDS.TRACE, texts: [] }];
const many = Array.from({ length: 12 }, (_, i) => ({ ...due[0], unit: `ب${i}` }));
ok(buildSession({ due: many }).length === SESSION_SIZE,
  `وجلسةُ المراجعة تُبنى بـ${SESSION_SIZE} تمارين (${buildSession({ due: many }).length})`);

// ————— ٢) المقابضُ الخمسة تعمل من مفتاحٍ واحد —————

console.log('\n٢. المقابض الخمسة تعمل من مفتاحٍ واحد، والإطفاءُ يردّ القائم');

support.setMode(true);
ok(support.KEYS.every((k) => support.isOn(k)), 'تشغيلُ الوضع يشغّل مقابضَه كلَّها');
ok(support.sessionSize() === 4, `الجرعة: أربعةُ تمارين (${support.sessionSize()})`);
ok(support.demoPace() < 1, `النموذج: أبطأ (${support.demoPace()})`);
ok(support.inkWeight() > 1, `الخطّ: أغلظ (${support.inkWeight()})`);
ok(support.calm() === true, 'الهدوءُ الحسّي: مشتغل');
ok(buildSession({ due: many }).length === 4,
  `وجلسةُ المراجعة تُبنى بأربعة تمارين (${buildSession({ due: many }).length})`);

const eased = support.easeFor(1, 0);
ok(eased.aided === true && eased.tolerance > 1,
  `السماحة: أوسع في أوّل لقاء (${eased.tolerance.toFixed(2)}× عن ${TOLERANCE.lateral} عرضياً)`);
ok(support.easeFor(2.78, 0).tolerance === 2.78 * support.KNOBS.ease.supported,
  'وتوسيعُها **معاملٌ على سماحة المحطة** لا رقمٌ يحلّ محلَّها — فبيانُ الحرف يبقى مصدرَها');
ok(support.KNOBS.ease.supported > support.KNOBS.ease.standing,
  'ومعاملُ التوسيع أكبرُ من القائم حقيقةً — وإلا كان المفتاحُ وعداً كاذباً');

support.set('ease', false);
ok(support.mayEase(0) === false && support.sessionSize() === 4,
  'إطفاءُ مقبضٍ بعينه يردّه وحدَه إلى القائم');
support.setMode(false);
ok(support.KEYS.every((k) => support.value(k) === support.KNOBS[k].standing),
  'وإطفاءُ الوضع يردّ الجميع');
support.setMode(true);
ok(support.isOn('ease') === false && support.isOn('dose') === true,
  'وإعادةُ التشغيل تحفظ ما أطفأه الوالدُ بيده');
support.reset();

// ————— ٣) حقلُ `measures` يصنّف، ومنه تُشتقّ قائمةُ التعطيل —————

console.log('\n٣. كلُّ مقبضٍ مصنَّفٌ يومَ يُكتب — والقائمةُ مشتقّةٌ لا مكتوبة');

ok(support.KEYS.every((k) => typeof support.KNOBS[k].measures === 'boolean'),
  `كلُّ مقبضٍ يقول: أيمسّ ما يُقاس أم يريح؟ (${support.KEYS.length} مقابض)`);
ok(support.EXAM_OFF.join('،') === 'dose،ease',
  `وما يُعطَّل في الامتحان ما يمسّ القياسَ وحدَه (${support.EXAM_OFF.join('، ')})`);
ok(support.KNOBS.ease.measures === true,
  '⚠ و**السماحةُ الموسَّعة «صعوبة» قطعاً** — وإلا فُتح ما لم يُثبَت ولُوّث قياسُ الرفض الكاذب');
ok(support.KNOBS.dose.measures === true, 'والجرعةُ صعوبةٌ: حجمُ العيّنة لا يُقاس اثنان بعيّنتين');
ok([support.KNOBS.demo, support.KNOBS.ink, support.KNOBS.calm].every((k) => k.measures === false),
  'وبطءُ النموذج وسُمكُ الخطّ والهدوءُ راحةٌ — «طفلٌ يُمتحَن بشاشةٍ تُربكه يُقاس إرباكُه»');
ok(support.EXAM_OFF.every((k) => support.PANEL_KEYS.includes(k)),
  'وكلُّ معطَّلٍ معروضٌ في اللوحة — فلا مقبضَ خفيّ يُعطَّل خفيةً');
const supportSrc = src('support.js');
ok(/EXAM_OFF = KEYS\.filter\(\(k\) => KNOBS\[k\]\.measures\)/.test(supportSrc),
  'والقائمةُ **مشتقّةٌ من الجدول** بسطرها — لا قائمةٌ ثانية تُكتب فتشيخ');

// ————— ٤) الملقَّنُ لا يُحتسب إتقاناً، ووسمُ العون مجرودٌ —————

console.log('\n٤. العون يُسجَّل ولا يُزوَّر القياس');

const KIND = progress.KINDS.TRACE;
const keyOf = (unit) => progress.skillKey(unit, 'معزول', KIND);

progress.recordAttempt('ب', 'معزول', KIND, true);
ok(progress.getSkill(keyOf('ب'))?.box === 1, 'محاولةٌ صحيحة بلا عون ترفع الصندوق (١)');

for (let i = 0; i < 5; i++) {
  progress.recordAttempt('ت', 'معزول', KIND, true, progress.dayNumber(), true);
}
const aided = progress.getSkill(keyOf('ت'));
ok(aided?.box === 0, `خمسُ كتاباتٍ صحيحة بسماحةٍ موسَّعة لا ترفع الصندوق (${aided?.box})`);
ok(aided?.right === 0 && aided?.wrong === 0, 'ولا تُحتسب صواباً ولا خطأً');
ok(aided?.helped === 5, `وتُسجَّل محاولاتٍ معانة (${aided?.helped})`);
ok(aided?.due <= progress.dayNumber(), 'وتبقى المهارةُ مستحقّةً للمراجعة — العونُ لا يُبعد موعداً');
ok(progress.helpedAttempts() === 5, 'ولوحةُ الوالد تقرأ عددَها من سجلّ المهارات نفسِه');
ok(aided.box < progress.MASTERED_BOX,
  'و**لا يبلغ الملقَّنُ صندوقَ الإتقان أبداً** — فما في «الحروف المتقنة» أثبتته يدُه وحدَها');

// وخطأٌ مع العون لا يُسقِط ما كسبه بلا عون
for (let i = 0; i < 3; i++) progress.recordAttempt('ب', 'معزول', KIND, true);
const before = progress.getSkill(keyOf('ب')).box;
progress.recordAttempt('ب', 'معزول', KIND, false, progress.dayNumber(), true);
ok(progress.getSkill(keyOf('ب')).box === before && progress.getSkill(keyOf('ب')).wrong === 0,
  `وخطأٌ مع العون لا يُصفّر صندوقاً ولا يُسجَّل ضعفاً (${progress.getSkill(keyOf('ب')).box})`);
ok(/if \(helped\) \{/.test(src('progress.js')),
  'و**قاعدتُه في وحدة القياس لا في الشاشة** — فلا تُنسى في شاشةٍ تُكتب غداً');

// **وجردُ وسم العون**: كلُّ موضعِ قياسٍ في شاشة اكتسابٍ يمرّره — موضعٌ جديد بلا وسم
// يسجّل إتقاناً كاذباً على سماحةٍ موسَّعة، فيُجرد على المصدر لا يُوثَق بتعليق.
const CALL = /recordAttempt\((?:[^()]|\([^()]*\))*\)/g;
const TAGGED = /,\s*progress\.dayNumber\(\)\s*,\s*[\w.]+\s*\)$/;
for (const file of ACQUIRE) {
  const found = src(file).match(CALL) || [];
  const bare = found.filter((c) => !TAGGED.test(c));
  ok(found.length > 0 && bare.length === 0,
    `[${file}] كلُّ مواضع القياس فيه تمرّر وسمَ العون (${found.length} موضعاً`
    + `${bare.length ? ` — بلا وسم: ${bare.length}` : ''})`);
  ok(/state\.aided = aid\.aided;/.test(src(file)) && /const aid = easeFor\(/.test(src(file)),
    `  و[${file}] يقرّر السماحةَ والوسمَ **من قرارٍ واحد** — فلا يفترق ما وُسِّع عمّا وُسِم`);
}

// ————— ٥) لا عونَ خارج الاكتساب —————

console.log('\n٥. العون في الاكتساب وحدَه');

support.setMode(true);
ok(support.mayEase(0) === true, 'السماحةُ الموسَّعة تجوز في أوّل لقاءٍ بالمهارة (صندوق صفر)');
ok([1, 2, 3, 4, 5].every((box) => support.mayEase(box) === false),
  'ولا تجوز في صندوقٍ ارتفع — الطلاقةُ لا تُعان (Haring 1978)');
ok(support.easeFor(1, 1).tolerance === 1 && support.easeFor(1, 1).aided === false,
  'وما جاوز الاكتسابَ يُكتب بالمسطرة القائمة ولا يُوسَم عوناً');
support.reset();

const usesAid = (f) => /\beaseFor\s*\(/.test(src(f)) || /\bmayEase\s*\(/.test(src(f));
ok(ACQUIRE.every(usesAid), `وشاشاتُ الاكتساب الأربع تستدعيه (${ACQUIRE.join('، ')})`);
ok(NO_AID.every((f) => !usesAid(f)),
  `ولا المراجعةُ ولا البوابةُ ولا اللحاق ولا سواها تعرف \`easeFor\` أصلاً — حصانةٌ بنيوية (${NO_AID.length} وحدة)`);
ok(!/import[^;]*(easeFor|mayEase)[^;]*support\.js/s.test(src('review.js'))
  && !/import[^;]*(easeFor|mayEase)[^;]*support\.js/s.test(src('catchup.js')),
  'ومحرّكُ الجلسة والامتحانُ يستوردان المقاديرَ ولا يستوردان العون');
ok(GATE_SIZE === 10 && /size: GATE_SIZE/.test(src('gate.js')),
  `والبوابةُ تبني بجرعتها المعلنة لا بجرعة الدعم (${GATE_SIZE} تمارين)`);

// ————— ٦) مؤشّرُ الوضع: يعرفه البالغ ولا يَسِمُ الطفل —————

console.log('\n٦. مؤشّرُ وضع الدعم');

const uiSrc = src('ui.js');
const mainSrc = src('main.js');
const barCss = css.match(/\.support-on \.topbar\s*\{[^}]*\}/)?.[0] || '';

ok(support.MARK.label && support.MARK.note,
  `واسمُها وسطرُها في جدول \`support.js\` حيث تُملَك العلامة («${support.MARK.label}»)`);
ok(!/بطء|بَطء|بَطِيء|بطيء|🐢|🐌/.test(support.MARK.label + support.MARK.note),
  'وليس فيها كلمةُ بطءٍ ولا رمزُه — العلامةُ للبالغ ولا تَسِمُ الطفل');
ok(/title: supportOn\(\) \? MARK\.label : null/.test(uiSrc),
  'واسمُها في `title` الشريط اللاصق وحدَه — ولا حرفَ يُكتب في الشاشة');
ok(/function topbar/.test(uiSrc) && uiSrc.indexOf('MARK.label') > uiSrc.indexOf('function topbar'),
  'وحاملُها **الشريطُ اللاصق** (`topbar`) فتمشي مع الطفل في كل شاشة');
ok(/position: sticky/.test(css.match(/\.topbar \{[^}]*\}/)?.[0] || ''),
  'والشريطُ لاصقٌ حقاً (`position: sticky`) — لا علامةٌ عائمةٌ أعلى الصفحة تُبتلَع في الجوّال');
ok(!/support-mark|support-badge/.test(mainSrc + uiSrc + css),
  'ولا حلقةَ عائمة ولا شارةَ ثانية — العلامةُ واحدة');
ok(Boolean(barCss) && !/\bcontent:\s*['"]/.test(barCss) && !/#[0-9a-fA-F]{3,6}/.test(barCss),
  'وخطُّها بلون لوح التصميم بلا محرفٍ يُرسَم');
ok(/box-shadow/.test(barCss) && !/\b(height|padding|margin|border(-bottom)?\s*:)/.test(barCss),
  'و**لا يزحزح تخطيطاً**: ظلٌّ داخليّ لا حدٌّ يزيد ارتفاعَ الشريط');
ok(/classList\.toggle\('support-on', support\.modeOn\(\)\)/.test(mainSrc)
  && /support\.onChange\(paintSupport\)/.test(mainSrc),
  'وصبغُها معلَّقٌ بالمفتاح الأعلى وحدَه — يتبعه في اللحظة نفسِها');
ok(/classList\.toggle\('calm', support\.calm\(\)\)/.test(mainSrc)
  && /\.calm \*, \.calm \*::before/.test(css),
  'والهدوءُ صنفٌ على الجذر يستدعي قواعدَ خفض الحركة القائمة (والوحدةُ لا تعرف DOM)');
ok(/removeProperty\('--ink-weight'\)/.test(mainSrc)
  && /calc\(22 \* var\(--ink-weight, 1\)\)/.test(css),
  'وسُمكُ الخطّ خاصّيةٌ **تُحذَف** عند القائم ولا تُكتب بقيمتها — فلا فرقَ ببايت');
ok(/\.pen-fence \{[^}]*\}/.test(css) && !/--ink-weight/.test(css.match(/\.pen-fence \{[^}]*\}/)[0]),
  'ولا يمسّ سُمكُ الخطّ **ممرَّ السماحة** — عرضُه من `trial.tolerance` بيد المحرّك');

// ————— ٧) مسطرةُ الامتحان الواحدة —————
//
// **قاعدةُ المالك**: العونُ الذي يريح يُسمح، والذي يجيب يُمنع. فالمحروسُ **أثرُها**
// مقيساً داخلَ النطاق وخارجَه — لا التعليقُ الذي يصفها.

console.log('\n٧. مسطرةُ الامتحان الواحدة');

support.reset();
support.setMode(true);

ok(!support.examOn(), 'وخارج النطاق لا امتحانَ مشتغل');
const inExam = support.duringExam(() => ({
  on: support.examOn(),
  dose: support.sessionSize(),
  ease: support.easeFor(1, 0),
  demo: support.demoPace(),
  ink: support.inkWeight(),
  calm: support.calm(),
  build: buildSession({ due: many }).length,
}));
ok(inExam.on && !support.examOn(), 'والنطاق يُفتَح ويُغلَق مع النداء المتزامن');
ok(inExam.ease.tolerance === 1 && inExam.ease.aided === false,
  '⚠ و**السماحةُ الموسَّعة معطَّلةٌ فيه قطعاً** — فلا يُفتَح للطفل ما لم يُثبته');
ok(inExam.dose === support.KNOBS.dose.standing && inExam.build === SESSION_SIZE,
  `وتعود الجرعةُ إلى القائم (${inExam.dose} — وجلسةٌ تُبنى بـ${inExam.build})`);
ok(inExam.demo === support.KNOBS.demo.supported && inExam.ink === support.KNOBS.ink.supported
  && inExam.calm === true,
  `ويسري ما يريح: نموذجٌ ${inExam.demo} · خطٌّ ${inExam.ink} · هدوءٌ`);
ok(support.easeFor(1, 0).aided === true,
  'وبعد انقضائه يستأنف الدعمُ كاملاً — لا أثرَ يبقى على شاشات الطفل');

let threw = false;
try { support.duringExam(() => { throw new Error('عطب'); }); } catch { threw = true; }
ok(threw && !support.examOn(), 'ولو رمى النداءُ رُدّ الحالُ — لا يعلق الامتحانُ مفتوحاً');
ok(!String(store.get('uktub.support.v1') || '').includes('exam')
  && !/localStorage[\s\S]{0,80}exam|exam[\s\S]{0,40}setItem/.test(supportSrc),
  'ولا يُخزَّن النطاقُ في الجهاز أصلاً — مدّةُ بناءٍ لا عَلَمٌ يعبر إعادةَ التحميل');

const catchupSrc = src('catchup.js');
ok(/const examView = \(view\) => \(item, api\) => duringExam\(\(\) => view\(item, api\)\);/.test(catchupSrc),
  'وامتحانُ اللحاق يبني تمارينَه داخل النطاق (`examView` يلفّ كلَّ مُصيِّر)');
ok(/\[progress\.KINDS\.FREE\]: examView\(/.test(catchupSrc)
  && /\[progress\.KINDS\.COPY\]: examView\(/.test(catchupSrc),
  'ومُصيِّراه كلاهما ملفوفان — لا بابَ يدخل منه العون');
ok(!/\b(sessionSize|easeFor|mayEase|inkWeight)\s*\(/.test(code('catchup.js')),
  'ولا يقرأ مقداراً من مقادير الصعوبة بيده — يستورد النطاقَ ومقبضَ راحةٍ لا غير');
ok(/from '\.\/gate\.js'/.test(catchupSrc) && !/PASS_RATE\s*=/.test(catchupSrc),
  'وعتبتُه عتبةُ البوابة المستوردة — لا مقبضَ يمسّها ولا رقمَ ثانٍ في الملف');

support.reset();

// ————— ٨) سطرُ الوعد الصادق: مصدرٌ واحد في اللوحة والتعريفية —————

console.log('\n٨. سطرُ الوعد الصادق');

const parentSrc = src('parent.js');
const welcome = readFileSync(new URL('app/welcome/index.html', ROOT), 'utf8');
const LIMITS = ['لا يشخّص', 'ولا يعالجه', 'غيرَ الناطق', 'الكفيفَ', 'الأصمَّ المُشير',
  'ولا نَعِد بحجم أثر', 'تجربةٍ ميدانية'];
const missing = LIMITS.filter((line) => !support.PROMISE.includes(line));
ok(missing.length === 0,
  `الوعدُ بحدوده السبعة كما كتبتها دراسةُ العائلة${missing.length ? ` — سقط: ${missing.join('، ')}` : ''}`);
ok(parentSrc.includes('support.PROMISE'),
  'واللوحةُ تحقنه من مصدره (`support.PROMISE`) لا تنسخه');
// (والمقايسةُ بعد تسوية الفراغ: نصُّ HTML يُلَفّ في أسطر، والحدُّ لا يسقط باللفّ)
const flat = (t) => t.replace(/\s+/g, ' ').trim();
ok(flat(welcome).includes(flat(support.PROMISE)),
  'وصفحةُ التعريف تحمله **بنصّه حرفاً** — فحدٌّ يسقط في نقلٍ يحمرّ هنا');
ok(parentSrc.includes('لا يُحتسب') && parentSrc.includes('العونُ يُسجَّل'),
  'وفي اللوحة السطرُ الصريح: العونُ يُسجَّل وما أُعين عليه لا يُحتسب إتقاناً');
ok(!code('parent.js').includes('https://'),
  'وقسمُ الوضع لم يفتح للوحة باباً على الشبكة — شيفرتُها صفرُ `https://` كما كانت');

// ————— ٩) لا مِقبضَ يمسّ المادّة، ولا محرّكَ الحكم —————

console.log('\n٩. مقاديرُ لا مادّة — ومحرّكُ الحكم لا يعرف الوضعَ أصلاً');

ok(!/^\s*import\s/m.test(supportSrc),
  'وحدةُ الدعم **لا تستورد شيئاً** — فلا تبلغ منهجاً ولا مساراً ولا معجماً بحال');
ok(!/['"]\.\/(curriculum|paths|word_paths|warmups|pen)\.js['"]/.test(supportSrc),
  'ولا مسارَ ملفِّ بياناتٍ مكتوبٌ فيها ألبتّة');
const kinds = Object.values(support.KNOBS).flatMap((k) => [typeof k.standing, typeof k.supported]);
ok(kinds.every((t) => t === 'number' || t === 'boolean'),
  `وكلُّ مقدارٍ رقمٌ أو نعم/لا — لا قيمةَ نصّية بينها (${[...new Set(kinds)].join('، ')})`);
ok(Object.values(support.KNOBS).every((k) => typeof k.standing === typeof k.supported),
  'والقائمُ وبديلُه من صنفٍ واحد في كل مقبض');
ok(Object.values(support.KNOBS).every((k) => k.title && k.line),
  'ولكلٍّ اسمُه وسطرُ شرحه في الجدول نفسِه (فلا يفترق ما يُقرأ عمّا يُفعَل)');
ok(/support\.PANEL_KEYS\.map\(knob\)/.test(parentSrc) && /support\.setMode/.test(parentSrc),
  'وبابُ الوضع قسمٌ في اللوحة — مفاتيحُه من الجدول لا مكتوبةً بيد');

const penSrc = src('pen.js');
ok(!/support/.test(code('pen.js')),
  '🔴 و**`pen.js` لا يعرف وضعَ الدعم**: لا استيرادَ ولا ذكرَ في شيفرته — صفرُ سطرٍ يسأل عن مقبض');
ok(/pace = 1,/.test(penSrc) && /const SPEED = 900 \* \(pace > 0 \? pace : 1\);/.test(penSrc),
  'والمقبضُ يبلغه **بمعامله المعلَن** وحدَه، و`1` سرعتُه القائمة حرفاً');
const judge = penSrc.slice(penSrc.indexOf('export function createTrial'),
  penSrc.indexOf('export function penSurface'));
ok(!/pace|ink-weight|calm/.test(judge),
  'و**محرّكُ الحكم لا يعرف معاملاً منها**: `createTrial` و`judge` و`judgeFree` بلا أثرٍ للوضع');
ok(TOLERANCE.lateral === 90 && TOLERANCE.coverage === 0.88 && TOLERANCE.start === 120,
  `وثوابتُ السماحة كما هي حرفاً (عرضيّ ${TOLERANCE.lateral} · تغطية ${TOLERANCE.coverage})`);

console.log(fails ? `\n${fails} فشل` : '\nكل اختبارات «وضع الدعم» ناجحة');
process.exit(fails ? 1 : 0);
