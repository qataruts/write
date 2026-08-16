// حارسُ **بوابة اللحاق** — القيودُ الخمسة (`FAMILY.md §١٠/هـ`):
//   node tools/test_catchup.mjs
//
// **العلّة**: امتحانُ تحديد المستوى ميزةٌ **يسهل أن تصدق في شاشتها وتكذب في أثرها** —
// يفتح ما لم يُثبَت، أو يقفز بوابةَ إتقان، أو يقيس بمفتاحٍ وهميّ فلا تلتقطه المراجعة،
// أو يغلق على طفلٍ ما كان مفتوحاً له. وكلُّ واحدةٍ من هذه لا يُمسِكها فاحصُ وحدةٍ ولا
// لقطةُ شاشة: **أثرُها في تقدّم الطفل بعد جولةٍ كاملة**، لا في سطرٍ يُقرأ.
//
// فهذا الحارسُ **يمشي الامتحانَ بمادّة الرحلة الحيّة** — بسلّمه هو (`ladder`) وعتبته
// هو (`passed` من `gate.js`) وفتحه هو (`openThrough`)، لا بنسخةٍ منها هنا تشيخ —
// ويقيس القيودَ الخمسة على تقدّم طفلٍ محاكىً:
//
// (١) **لا منفذَ للامتحان من شاشة طفل** — جردُ نداءات على القرص كلِّه.
// (٢) **سلّميةُ الفتح**: تلميذٌ يُتقن نصفَ الرحلة يُفتح له نصفُها **بالضبط**، ولا
//     عقدةَ بعد الشرخ، ولا بوابةَ إتقانٍ تُقفَز.
// (٣) **العتبةُ تُقرأ من مصدر البوابات** لا تُكتب رقماً ثانياً.
// (٤) **الزرعُ يُقاس**: سجلُّ ليتنر بعد الامتحان يحمل مفاتيحَ حقيقية بأعداد كتاباته.
// (٥) **لا نقصانَ فتحٍ أبداً**: امتحانٌ ثانٍ بأداءٍ أسوأ لا يغلق شيئاً.
//
// 🔒 **ولا يمسّ جهازاً ولا شبكة**: `localStorage` ظِلٌّ في الذاكرة كسائر حرّاس `node`.
//
// ⏱ **والأداةُ تنبض**: تطبع سطراً لكل وحدةٍ يمتحن فيها التلميذُ المحاكى (أين هو من
//    السلّم وكم كتب وما فُتح) — وهي ثوانٍ لا دقائق، فلا نقطةَ تفتيشٍ لها.

import { readFileSync, readdirSync } from 'node:fs';

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

const arNum = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]);
const src = read('catchup.js');
/** الشيفرةُ بلا تعليقاتٍ ولا نصوص — فلا يُقرأ شرحٌ حجّةً على سلوك. */
const codeOf = (text) => text
  .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ')
  .replace(/'[^'\n]*'|"[^"\n]*"|`[^`]*`/g, "''");
const code = codeOf(src);

// ————— (١) لا منفذَ للامتحان من شاشة طفل — جردُ نداءات —————
//
// **والجردُ من القرص لا من قائمةٍ تُكتب**: وحدةٌ تُضاف غداً تدخل الجرد من نفسها.
// والمسموحُ ثلاثةٌ بأعيانها: الوحدةُ نفسُها، **ولوحةُ وليّ الأمر** (بابُه الوحيد)،
// **والموجّه** (يملك الشاشات كلَّها ويطلق ألواحَها). وما عداها **شاشةُ طفل**.
//
// **وموضعُه قبل الاستيراد عمداً**: شاشةُ طفلٍ تستورد الامتحانَ تصنع **حلقةَ استيراد**
// (الامتحانُ يستورد شاشاتِ الرحلة)، فينفجر الحارسُ بـ`ReferenceError` قبل أن يقول
// علّتَه — **وأحمرُ غامضٌ أسوأُ من أحمرَ صادق**. فالجردُ يُقرأ من القرص أوّلاً.

console.log('— (١) لا منفذَ للامتحان من شاشة طفل —');
const modules = readdirSync(new URL('./', APP)).filter((f) => f.endsWith('.js')).sort();
const DOORS = new Set(['catchup.js', 'parent.js', 'main.js']);
/**
 * **ذِكرٌ للامتحان في وحدة**: اسمٌ مستوردٌ منه (`openCatchup`، `renderCatchup`، `ROUTE`
 * بأيّ لقب) **أو** مسارُ ملفّه في استيراد. **ولا حدَّ كلمةٍ في الطرف الأيسر**: لو طُلب
 * `\bcatchup\b` لَمرّ `openCatchup` بلا إمساك — وهي بعينها الصورةُ التي يُفتَح بها
 * الامتحانُ من شاشة طفل. (جُرّب سالباً: استيرادُ `openCatchup` في `lesson.js`.)
 */
const mentions = (f) => /catchup/i.test(codeOf(read(f)))
  || /['"][^'"]*catchup\.js['"]/.test(read(f));
const touching = modules.filter(mentions);
const strays = touching.filter((f) => !DOORS.has(f));
ok(strays.length === 0,
  `${arNum(modules.length)} وحدةً على القرص، ولا تعرف الامتحانَ إلا ${arNum(DOORS.size)}`
  + ` (${[...DOORS].join('، ')})`
  + (strays.length ? ` — **شاشةُ طفلٍ تفتحه: ${strays.join('، ')}**` : ''));

// **وعنوانُ الشاشة يُكتب مرّةً واحدة** في مالكه: زرٌّ في شاشةِ طفلٍ يُبنى بنصّ العنوان
// لا باستيراد الدالّة، فوجودُ النصّ في غير مالكه هو المنفذُ الذي نبحث عنه.
const ROUTE = src.match(/export const ROUTE = '([^']+)'/)?.[1] || '#/catchup';
const routed = modules.filter((f) => f !== 'catchup.js' && read(f).includes(ROUTE));
ok(routed.length === 0,
  `وعنوانُ الشاشة «${ROUTE}» مكتوبٌ في مالكه وحدَه`
  + (routed.length ? ` — **مكتوبٌ أيضاً في: ${routed.join('، ')}**` : ''));

// **وهنا يُستورَد ما يُمشى به الامتحانُ حيّاً** — بعد أن قيل جردُ المنافذ.
const progress = await import(new URL('progress.js', APP));
const gate = await import(new URL('gate.js', APP));
const review = await import(new URL('review.js', APP));
const catchup = await import(new URL('catchup.js', APP));
ok(catchup.ROUTE === ROUTE, `وعنوانُه المُصدَّر هو المقروء من مصدره (${catchup.ROUTE})`);

// **والبابُ يُغلَق بالبناء لا بالإخفاء**: من بلغ العنوانَ بلا مرورٍ بلوحة وليّ الأمر
// يُردّ — وهذا يُقاس حيّاً لا يُقرأ نصّاً (`renderCatchup` تردّ قبل أن تمسّ شاشة).
catchup.closeCatchup();
ok(catchup.isOpen() === false && catchup.renderCatchup(() => {}) === null,
  'ومن بلغ عنوانَه بلا بوابة وليّ الأمر يُردّ: `renderCatchup` تردّ `null` قبل أيّ رسم');
ok(/renderCatchup\(render\)/.test(codeOf(read('main.js')))
  && /if \(!screen\)/.test(codeOf(read('main.js'))),
  'والموجّهُ يعيده إلى الخريطة عند الردّ — لا شاشةَ بيضاء');

// ————— (٣) العتبةُ تُقرأ من مصدر البوابات لا تُكتب —————

console.log('\n— (٣) العتبةُ عتبةُ البوابات — ولا رقمَ يُكتب مرتين —');
ok(catchup.PASS_PERCENT === Math.round(gate.PASS_RATE * 100),
  `العتبةُ المعروضة ${arNum(catchup.PASS_PERCENT)}٪ مشتقّةٌ من \`gate.PASS_RATE\``
  + ` (${gate.PASS_RATE}) — لا رقمَ ثانٍ`);
ok(/from '\.\/gate\.js'/.test(src) && /\bpassed\(right, errors\)/.test(code),
  'والحكمُ نفسُه `passed` من `gate.js` بعينه — لا نسخةَ حسابٍ هنا');
const literals = code.match(/(?<![\w.])0?\.8\b|(?<![\w.٪])\b80\b/g) || [];
ok(literals.length === 0,
  'ولا رقمَ عتبةٍ مكتوبٌ في شيفرة الامتحان'
  + (literals.length ? ` — **مكتوب: ${literals.join('، ')}**` : ''));

// ————— الحكمُ حكمُ اليد: كتابةٌ حرّة لا تتبّعٌ ولا اختيار —————
//
// **ادّعاءُ اليد لا يُقبل إلا من اليد** (لفظُ القاعدة): فالحرفُ بتمرين المراجعة الحرّ
// **بعينه** (مقايسةُ مرجعٍ لا مقايسةُ نصّ)، والكلمةُ في صندوقٍ فارغ بنمط `MODES.FREE`
// — ولو عُرضت بدرجة خفوتها الحيّة لَصار سؤالُ أوّلِ امتحانٍ تتبّعاً على مسارٍ مرسوم.

console.log('\n— الحكمُ حكمُ اليد: حرٌّ لا تتبّع —');
ok(/\[progress\.KINDS\.FREE\]: VIEWS\[progress\.KINDS\.FREE\]/.test(code),
  'تمرينُ الحرف **هو** تمرينُ المراجعة الحرّ بعينه — لا نسخةٌ ثانية منه');
ok(/mode: MODES\.FREE/.test(code) && !/modeOf\(/.test(code) && !/MODES\.(GUIDED|FAINT)/.test(code),
  'وتمرينُ الكلمة صندوقٌ فارغ (`MODES.FREE` — الشكلُ لا الأثر)، ولا درجةَ خفوتٍ تُقحَم');
ok(/refGlyph\(ref/.test(code),
  'ونموذجُها فوق اللوح يُرى ولا يُتَّكأ عليه (نمطُ درجة «وَحْدَكْ» في البستان)');
ok(typeof review.assistFoot === 'function' && /assistFoot\(\{/.test(code),
  'وعدّةُ المخرج الكريم من مالكها (`review.assistFoot`) — فلا يقع طفلٌ في تمرينٍ بلا باب');

// ————— (٥) لا قفلَ في الشيفرة أصلاً —————

console.log('\n— (٥) فتحٌ لا قفل — نصّاً ثم أثراً —');
ok(!/clearSection|setStars\([^)]*,\s*0\)|delete .*stars/.test(code),
  'لا `clearSection` ولا تصفيرَ نجمةٍ في شيفرة الامتحان — يفتح ولا يقفل');
ok(/openThrough\(entry\)/.test(code) && /if \(!open\)/.test(code)
  && code.indexOf('if (!open)') < code.indexOf('state.opened += openThrough(entry)'),
  'والفتحُ لا يقع إلا **بعد** حكم العبور — يفتح ما أُثبت لا ما ادُّعي');

// ————— (٢) سلّميةُ الفتح: تلميذٌ يُتقن نصفَ الرحلة —————
//
// **المحاكاةُ تمشي الامتحانَ بأدواته هو**: `ladder()` سلّمُه، و`itemOf` تمرينُه،
// و`passed` حكمُه، و`openThrough` فتحُه — فما يُقاس هنا هو ما يقع على جهاز الطفل.
// **والتلميذُ يعبر بواباتِه بيده** كما يعبرها في الخريطة (البواباتُ لا تُقفز).

console.log('\n— (٢) سلّميةُ الفتح: تلميذٌ يُتقن نصفَ الرحلة —');
const nodes = progress.allNodes();
const sections = progress.journey();
const firstIndexOf = (section) => nodes.findIndex((n) => n.id === section.nodes[0].id);
const half = Math.floor(nodes.length / 2);
/** آخرُ وحدةٍ يعرفها التلميذُ المحاكى — الوحدةُ التي يقع فيها منتصفُ الرحلة. */
const knownTo = sections.findIndex((s) => firstIndexOf(s) <= half
  && firstIndexOf(s) + s.nodes.length > half);
const knownNodes = sections.slice(0, knownTo + 1).reduce((sum, s) => sum + s.nodes.length, 0);
note(`الرحلةُ ${arNum(nodes.length)} عقدة، والتلميذُ يعرف حتى الوحدة `
  + `${arNum(knownTo)} «${catchup.sectionName(sections[knownTo])}» — ${arNum(knownNodes)} عقدة`);

let writings = 0;
let rounds = 0;
let crossed = 0;
let crack = null;
let opened = 0;
let units = 0;

for (let guardRounds = 0; guardRounds < sections.length * 2; guardRounds++) {
  const head = catchup.ladder()[0];
  if (!head) break;                                   // أثبت الرحلةَ كلَّها
  if (head.gate) {
    // **البوابةُ حدُّ الفتح**: يقف الامتحانُ عندها والجبهةُ عليها بالضبط
    ok(progress.unlockFrontier() === firstIndexOf(head.section),
      `  بوابة «${head.gate.title}»: الفتحُ بلغ حدَّها ولم يجاوزها`
      + ` (الجبهة ${arNum(progress.unlockFrontier())} = موضعُها ${arNum(firstIndexOf(head.section))})`);
    ok(!progress.isDone(head.section.nodes[0].id),
      '  ولم يفتحها الامتحانُ نفسُه — تُعبَر بيده');
    progress.setStars(head.section.nodes[0].id, progress.MAX_STARS);   // يعبرها في الخريطة
    crossed++;
    continue;
  }
  const knows = head.index <= knownTo;
  const right = knows ? head.sample.length : 0;
  const errors = head.sample.length - right;
  // **والقياسُ يُزرع بمفتاح التمرين نفسِه** الذي تكتبه الشاشة (`itemOf`)
  for (const [i, unit] of head.sample.entries()) {
    const item = catchup.itemOf(unit);
    progress.recordAttempt(item.unit, item.form, item.kind, i < right);
    writings++;
  }
  rounds++;
  if (!gate.passed(right, errors)) { crack = head; break; }
  units++;
  opened += catchup.openThrough(head);
  if (rounds % 5 === 0 || head.index === knownTo) {
    console.log(`    … وحدة ${arNum(head.index)} «${catchup.sectionName(head.section)}»`
      + ` — عيّنة ${arNum(head.sample.length)} · فُتحت ${arNum(opened)} عقدة`);
  }
}

note(`مشى الامتحانُ ${arNum(rounds)} وحدة و${arNum(writings)} كتابةً بيد`
  + `، وعبر ${arNum(crossed)} بوابةً بيده`);

ok(Boolean(crack), crack
  ? `ووقف عند الشرخ: «${catchup.sectionName(crack.section)}» (الوحدة ${arNum(crack.index)})`
  : '**لم يقع شرخٌ** — التلميذُ يُتقن نصفَ الرحلة فحسب، فالامتحانُ يفتح ما لم يُثبَت');

ok(crack && crack.index === knownTo + 1,
  `والشرخُ في أوّل وحدةٍ لا يعرفها بالضبط (المنتظَر ${arNum(knownTo + 1)}`
  + `، والواقع ${arNum(crack?.index ?? -1)})`);

const frontier = progress.unlockFrontier();
ok(crack && frontier === firstIndexOf(crack.section),
  `ولا عقدةَ بعد الشرخ: الجبهةُ ${arNum(frontier)} = أوّلُ عقدة في وحدة الشرخ`
  + ` ${arNum(crack ? firstIndexOf(crack.section) : -1)}`);

ok(frontier === knownNodes,
  `و**فُتح له نصفُ الرحلة بالضبط**: ${arNum(frontier)} عقدة من ${arNum(nodes.length)}`
  + ` (${arNum(Math.round((frontier / nodes.length) * 100))}٪) — وهي عقدُ ما أثبته`);

ok(units > 0 && opened > 0,
  `وأثبت ${arNum(units)} وحدةً ففُتحت له ${arNum(opened)} عقدة`);

// ————— (٤) الزرعُ يُقاس: مفاتيحُ حقيقية بأعداد الكتابات —————

console.log('\n— (٤) الزرعُ في ليتنر قياسٌ حقيقيّ —');
const skills = progress.skills();
const attempts = skills.reduce((sum, s) => sum + s.right + s.wrong, 0);
ok(attempts === writings,
  `سجلُّ ليتنر يحمل ${arNum(attempts)} محاولة = ${arNum(writings)} كتابةَ امتحان — بلا نقصان`);

const KINDS = new Set(Object.values(progress.KINDS));
const bad = skills.filter((s) => !KINDS.has(s.kind) || !s.unit || !s.form);
ok(bad.length === 0,
  `و${arNum(skills.length)} مهارةً بمفتاحها الثلاثيّ الحقيقيّ (وحدة × شكلُ موقع × تمرين)`
  + (bad.length ? ` — **مفاتيحُ وهمية: ${bad.slice(0, 3).map((s) => s.key).join('، ')}**` : ''));
ok(!/recordAttempt\([^)]*'[^']*'/.test(code) && !/lookup|placement|catchup/i.test(
  code.match(/api\.score\([^)]*\)/g)?.join(' ') || ''),
  'ولا وسمَ «امتحان» في مفتاح — فتلتقطه المراجعةُ اليومية كأيّ كتابةٍ أخرى');

const due = progress.dueSkills();
ok(due.length > 0,
  `ومراجعةُ اليوم شبكةُ أمانه: ${arNum(due.length)} مهارةً مستحقّة بعد الامتحان`);

// ————— (٥) لا نقصانَ فتحٍ أبداً: امتحانٌ ثانٍ بأداءٍ أسوأ —————

console.log('\n— (٥) امتحانٌ ثانٍ بأداءٍ أسوأ لا يغلق شيئاً —');
const before = {
  frontier: progress.unlockFrontier(),
  stars: progress.totalStars(),
  done: nodes.filter((n) => progress.isDone(n.id)).length,
};
const again = catchup.ladder()[0];
ok(again && !again.gate && again.index === crack?.index,
  'والامتحانُ المعاد يستأنف من آخر وحدةٍ حُسمت — لا من أوّل الرحلة');
for (const unit of again?.sample || []) {
  const item = catchup.itemOf(unit);
  progress.recordAttempt(item.unit, item.form, item.kind, false);   // كلُّه خطأ
}
const worse = gate.passed(0, again?.sample.length || 1);
ok(!worse, 'وأداءٌ كلُّه خطأ لا يعبر — فلا يُفتح شيء');
const after = {
  frontier: progress.unlockFrontier(),
  stars: progress.totalStars(),
  done: nodes.filter((n) => progress.isDone(n.id)).length,
};
ok(after.frontier === before.frontier && after.done === before.done
  && after.stars >= before.stars,
  `ولم يُغلق شيء: الجبهةُ ${arNum(after.frontier)} كما كانت، والمنجَزُ `
  + `${arNum(after.done)} عقدة، والنجومُ ${arNum(after.stars)} لم تنقص`);

console.log(fails ? `\n${fails} فشل` : '\nبوابةُ اللحاق: القيودُ الخمسة مقيسة');
process.exit(fails ? 1 : 0);
