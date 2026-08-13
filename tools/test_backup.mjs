// حارسُ «صلابة التقدّم» — النسخةُ الاحتياطية ووضعُ المعاينة، **على بيانات اكتب**:
//   node tools/test_backup.mjs
//
// **من بذرة اقرأ** (`test_backup.mjs` + `test_preview.mjs` مجموعين)، ومادّتُه مادّتُنا:
// نجومٌ وصناديقُ ليتنر بأنواعها الأربعة **وعدّادُ أخطاء الاتجاه** وتاريخُ خفوت
// الكلمات — لا تسجيلاتٍ ولا إذنَ ميكروفون (لا صوتَ يُلتقط هنا ألبتّة).
//
// والمحروس ستّة:
//   ١) **النسخةُ عقدٌ محكم**: ما يخرج يعود كما خرج حرفاً بحرف، وما ليس نسخةً يُرفَض
//      بسببه المعلَن بالعربية — الاستعادةُ تكتب فوق تقدّمٍ قائم فلا تقبل مجهولاً.
//   ٢) 🔒 **ولا أثرَ ليدٍ فيها**: مسارُ قلم الطفل لا يغادر جهازه (`METHOD.md §٣.٧`)،
//      والنسخةُ ملفٌّ يُنسَخ ويُرسَل — فدخولُ إحداثيٍّ فيها نقضٌ من بابٍ خلفيّ.
//      **والمحفوظُ من الحكم اسمُه ومرّاتُه** فيبقى للوحة خرائطُها بعد الاستعادة.
//   ٣) **وملخّصُها صادقٌ قبل التأكيد**: يقرأ وليُّ الأمر ما سيقع قبل أن يقع.
//   ٤) **تحكّمُ وليّ الأمر**: الفتحُ اليدويّ يفكّ القفل بنجمةٍ لا يدّعي بها إتقاناً،
//      والتصفيرُ يمسّ النجوم **ولا يمسّ سجلّ ليتنر** ولا نجومَ ما بعد المحطة.
//   ٥) **وضعُ المعاينة يفتح ولا يكتب**: القفلُ يُرفَع، والقرصُ لا يُمَسّ حرفاً —
//      يُغلق المقيّمُ الصفحةَ فيعود الجهازُ كما كان.
//   ٦) **وعاملُ الخدمة لا يعرف طريقاً إلى التقدّم**: ترقيتُه تمحو مخزونَه وحدَه.

import { readFileSync } from 'node:fs';

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

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

// ————— حالُ طفلٍ في منتصف رحلته: بأنواع اكتب الأربعة وخرائطِ اتجاهه —————

const NODES = p.allNodes();
const seeded = NODES.slice(0, 12);
for (const [i, node] of seeded.entries()) p.setStars(node.id, (i % 3) + 1);

const letter = NODES.find((n) => n.type === 'letter').letter;
const word = NODES.find((n) => n.type === 'fade').words[0];
const line = NODES.find((n) => n.type === 'sentence').sentences[0];

p.recordAttempt(letter, 'معزول', p.KINDS.TRACE, true);
p.recordAttempt(letter, 'معزول', p.KINDS.TRACE, true);
p.recordAttempt(letter, 'معزول', p.KINDS.FREE, false);
p.recordAttempt(word, p.WORD_FORM, p.KINDS.COPY, true);
p.recordAttempt(word, p.WORD_FORM, p.KINDS.DICTATE, false);
p.recordAttempt(line, p.SENTENCE_FORM, p.KINDS.COPY, true);
p.recordFault(letter, pen.FAULTS.START_END);
p.recordFault(letter, pen.FAULTS.START_END);
p.recordFault(word, pen.FAULTS.DOTS_FIRST);
p.recordRead(word);
p.addSeconds(420);
p.markReview(8, 7);

const before = p.snapshot();

// ————— ١) الملف: ترويسةٌ تعرّف نفسها وحالةٌ كاملة —————

console.log('\n— ١) ملفُّ النسخة —');

const bundle = p.backup();
ok(bundle.kind === p.BACKUP_KIND && bundle.format === p.BACKUP_FORMAT && bundle.savedAt > 0,
  `النسخةُ تعرّف نفسها (${bundle.kind} · شكل ${bundle.format})`);
const text = p.backupText(bundle);
ok(JSON.parse(text).state.stars[seeded[0].id] === before.stars[seeded[0].id],
  'ونصُّها JSON يحمل حالةَ الطفل كما هي');
ok(/^uktub-progress-\d{4}-\d{2}-\d{2}\.json$/.test(p.backupName()),
  `واسمُ الملف بيومه فلا تطمس نسخةٌ أختَها (${p.backupName()})`);

// ————— ٢) 🔒 لا أثرَ ليدٍ في النسخة —————

console.log('\n— ٢) لا مسارَ قلمٍ في النسخة —');

const flat = JSON.stringify(bundle);
// أعلامُ أثر اليد: إحداثيّاتُ لمسٍ، أو ضرباتٌ محفوظة، أو انزياحٌ — أيُّها فيها نقضٌ
// للقاعدة. (والأسماءُ من `pen.js` نفسِه: `points` · `strokes` · `off` · `at`.)
const HAND = ['"points"', '"strokes"', '"off"', '"clientX"', '"trace"', 'M0,0', '"lateral"'];
const leaked = HAND.filter((token) => flat.includes(token));
ok(leaked.length === 0,
  `ولا إحداثيَّ لمسةٍ فيها${leaked.length ? ` — **تسرّب: ${leaked.join('، ')}**` : ''}`);

// **والمحفوظُ من الحكم اسمُه ومرّاتُه** — فيبقى لخرائط اللوحة موضوعُها بعد الاستعادة.
// (والغيابُ يُقال بجملةٍ لا بانكسار: نسخةٌ بلا عدّادٍ تمحو معرفةَ الوالد بطفله صامتةً.)
const kept = bundle.state.faults;
const faultKeys = kept ? Object.keys(kept) : [];
ok(kept && faultKeys.length === 2 && faultKeys.every((k) => /^[^|]+\|[a-z-]+$/.test(k)),
  kept ? `والعدّادُ فيها **اسماً وعدداً** (${faultKeys.join(' · ')}) — لا إحداثيّ`
    : '**وعدّادُ الاتجاه ساقطٌ من النسخة** — تُستعاد رحلةُ الطفل بلا خريطة أخطائه');
ok(kept && Object.values(kept).every((f) => Object.keys(f).sort().join() === 'n,seen'),
  'ولا حقلَ في مدخل العدّاد غيرُ العدد ويومِه');

// ولا تجمع اللوحةُ أثراً مع النسخة: ما تُنزّله نصُّ `backupText` وحدَه
const parentJs = read('js/parent.js');
ok(/new Blob\(\[progress\.backupText\(\)\]/.test(parentJs)
  && !/penSurface|onFault|surface\.strokes/.test(parentJs),
  'ولا تلمس اللوحةُ لوحَ كتابةٍ ولا تُدخِل في الملف غيرَ `backupText`');

// ————— ٣) الدورة: تصدير ← محوٌ كامل ← استعادةٌ مطابقة —————

console.log('\n— ٣) الدورة الكاملة (تصدير ← محو ← استعادة) —');

p.reset();
ok(p.totalStars() === 0 && p.skills().length === 0 && p.faults().length === 0,
  'المحوُ أفرغ الجهاز (كحذف التطبيق أو تخلية المتصفّح)');

const readBack = p.readBackup(text);
ok(!readBack.error && readBack.bundle, `والملفُّ يُقرأ بلا خطأ (${readBack.error || 'سليم'})`);
ok(p.restore(readBack.bundle), 'والاستعادةُ تقبله');

const after = p.snapshot();
const same = (key) => JSON.stringify(after[key]) === JSON.stringify(before[key]);
for (const key of ['stars', 'skills', 'faults', 'reads', 'days', 'reviews', 'seconds']) {
  ok(same(key), `«${key}» عاد كما كان حرفاً بحرف`);
}
ok(p.getSkill(p.skillKey(letter, 'معزول', p.KINDS.TRACE)).box === 2
  && p.getSkill(p.skillKey(letter, 'معزول', p.KINDS.FREE)).box === 0,
  'وصناديقُ ليتنر عادت بأرقامها (المراجعةُ تكمل من حيث وقفت)');
ok(p.faultsOf(letter)[0].n === 2 && p.readCount(p.wordKey(word)) === 1,
  'وخريطةُ اتجاهه وتاريخُ خفوت كلماته عادا — فلا تُمحى معرفةُ الوالد بتبديل جهاز');
ok(p.nextNode().id === NODES[12].id,
  'والجبهةُ عادت إلى موضعها (القفلُ يُحسب من الحالة المستعادة لا من ذاكرةٍ قديمة)');

// ————— ٤) ما يُرفَض من الملفات، وملخّصُ ما يُقبَل —————

console.log('\n— ٤) لا يُستعاد مجهول —');

const bad = [
  ['ليس json أصلاً', 'تعذّرت قراءتُه'],
  [JSON.stringify({ stars: { 'g1:ا': 3 } }), 'ليس نسخةَ اكتب'],
  [JSON.stringify({ kind: p.BACKUP_KIND, format: 99, state: { stars: {} } }), 'إصدارٌ أحدث'],
  [JSON.stringify({ kind: p.BACKUP_KIND, state: { v: 1, stars: {} } }), 'بلا إعلانِ شكله'],
  [JSON.stringify({ kind: p.BACKUP_KIND, format: 1, state: { v: 1 } }), 'معطوب'],
  [JSON.stringify({ kind: p.BACKUP_KIND, format: 1, state: { v: 9, stars: {} } }), 'حالةٌ مجهولة'],
  [JSON.stringify({ kind: 'muallim.progress', format: 1, state: { v: 1, stars: {} } }),
    'نسخةُ تطبيقٍ آخر من العائلة'],
];
for (const [raw, why] of bad) {
  const res = p.readBackup(raw);
  ok(Boolean(res.error) && !res.bundle, `يُرفَض (${why}): «${res.error || '—'}»`);
}
ok(p.totalStars() > 0, 'ولا يمسّ الرفضُ تقدّمَ الطفل القائم');
ok(!p.restore(null) && !p.restore({ state: null }), 'والاستعادةُ نفسُها ترفض ما ليس حالة');

const sum = p.backupSummary(readBack.bundle);
ok(sum.nodes === seeded.length && sum.stars === p.totalStars() && sum.skills === 5
  && sum.faults === 2 && sum.reads === 1,
  `وملخّصُها صادقٌ قبل التأكيد (★${sum.stars} في ${sum.nodes} عقدة · ${sum.skills} مهارات`
  + ` · ${sum.faults} حركتان خاطئتان)`);
ok(p.backupSummary({ state: { stars: { 'لا-وجود-لها': 3 } } }).stars === 0,
  'ولا يَعُدّ نجومَ عقدةٍ لا وجود لها في رحلة اليوم');

// ————— ٥) تحكّمُ وليّ الأمر: الفتحُ اليدويّ والتصفير —————

console.log('\n— ٥) الفتحُ اليدويّ والتصفير —');

p.reset();
const target = NODES[30];
ok(!p.isNodeUnlockedById(target.id), 'العقدةُ البعيدة مقفلةٌ ابتداءً');
ok(p.pendingBefore(target.id) === 30, `والناقصُ قبلها ٣٠ عقدة (${p.pendingBefore(target.id)})`);
p.setStars(NODES[0].id, 3);                       // نجمةٌ كسبها الطفل بحقّ
ok(p.unlockUpTo(target.id) === 29, 'الفتحُ اليدويّ فتح ما نقص وحدَه (٢٩ عقدة)');
ok(p.isNodeUnlockedById(target.id) && p.nextNode().id === target.id,
  'والعقدةُ صارت جبهتَه (تجاوزٌ للأمام كما أراد وليُّ الأمر)');
ok(p.getStars(NODES[5].id) === 1, 'وما فُتح بنجمةٍ واحدة — تفكّ القفل ولا تدّعي إتقاناً');
ok(p.getStars(NODES[0].id) === 3, 'ولا تُنقَص نجمةٌ كسبها الطفل');
ok(p.skills().length === 0 && p.faults().length === 0,
  'ولا يُخترع للفتح قياسٌ لم يقع — لا مهارةٌ ولا خطأُ اتجاهٍ لم يكتبه');
ok(p.pendingBefore(target.id) === 0 && p.unlockUpTo('لا-وجود-لها') === 0,
  'وعقدةٌ مجهولة لا تفتح شيئاً');

p.reset();
for (const node of NODES) p.setStars(node.id, 3);
p.recordAttempt(letter, 'معزول', p.KINDS.TRACE, true);
p.recordFault(letter, pen.FAULTS.REVERSE);
const skillsBefore = JSON.stringify(p.snapshot().skills);
const faultsBefore = JSON.stringify(p.snapshot().faults);

const section = p.journey()[0];
const info = p.sectionProgress(section.id);
ok(info.nodes === section.nodes.length && info.done === info.nodes,
  `حصيلةُ المحطة تُقرأ قبل التصفير (${info.done} عقدة · ★${info.stars})`);
ok(p.clearSection(section.id) === section.nodes.length,
  'والتصفيرُ مسّ عقدَ المحطة كلَّها');
ok(p.getStars(section.nodes[0].id) === 0 && p.nextNode().id === section.nodes[0].id,
  'وأعاد الطفلَ إلى أوّلها (وما بعدها مقفلٌ حتى يتمّها)');
ok(p.getStars(NODES.at(-1).id) === 3,
  'ونجومُ ما بعدها محفوظةٌ تعود كما كانت — إعادةُ قفلٍ لا محو');
ok(JSON.stringify(p.snapshot().skills) === skillsBefore
  && JSON.stringify(p.snapshot().faults) === faultsBefore,
  'و**سجلُّ ليتنر وخريطةُ الاتجاه لم يُمسّا** — ما قِيس من الطفل حقٌّ له لا تمحوه إعادةُ تدريب');
ok(p.clearSection('لا-وجود-لها') === 0, 'ومحطةٌ مجهولة لا تصفّر شيئاً');

/**
 * **والتصفيرُ يصمد إلى الغد** (إصلاحُ الجلسة ١٠، أمسكه هذا الفحصُ ساعةَ كُتب): كان
 * الترحيلُ الرحيم يجري في كل إقلاع فيملأ كلَّ عقدةٍ بلا نجمةٍ خلف موضع الطفل — فيعيد
 * زرعَ ما صفّره وليُّ الأمر بيده، ويعود الطفلُ إلى حيث كان عند أوّل فتحٍ للتطبيق.
 * **وإعادةُ التحميل تُحاكى بوحدةٍ ثانية** تقرأ المخزن نفسَه: هي عينُ ما يجري غداً.
 */
const reopened = await import(new URL('js/progress.js?reopen', APP));
ok(reopened.getStars(section.nodes[0].id) === 0
  && reopened.nextNode()?.id === section.nodes[0].id,
  'ويبقى مصفَّراً بعد إغلاق التطبيق وفتحه — لا يُنقَض وعدُ اللوحة عند أوّل إقلاع');

// **والترحيلُ الرحيم لم يُعطَّل، إنما قُيِّد بموضوعه**: بنيةٌ تحرّكت (وسمٌ لا يطابق)
// تُشغّله كما كان — فمحطةٌ نستحدثها غداً خلف موضع الطفل لا تُعيد قفلَ ما فُتح له.
const moved = JSON.parse(store.get('uktub.progress.v1'));
moved.journey = 'بنيةٌ أخرى';
store.set('uktub.progress.v1', JSON.stringify(moved));
const shifted = await import(new URL('js/progress.js?shifted', APP));
ok(shifted.getStars(section.nodes[0].id) === 1,
  'وحين تتحرّك بنيةُ الرحلة فعلاً يجري الترحيلُ كما كان — نجمةُ إتمامٍ تفكّ الحبس');

// ————— ٦) وضعُ المعاينة: يفتح القفلَ ولا يكتب حرفاً —————
//
// **نسخةٌ ثانية من الوحدة في عالمٍ عنوانُه `?preview=1`**: `PREVIEW` تُقرأ ساعةَ
// التحميل، فلا يُختبَر بابُها إلا بوحدةٍ حُمّلت وهي مرفوعة. والمخزنُ واحدٌ بينهما
// (`localStorage` أعلاه) — وهو عينُ المحكّ: أيكتب فيه المقيّمُ شيئاً أم لا.

console.log('\n— ٦) وضعُ المعاينة يفتح ولا يكتب —');

// حالُ طفلٍ في أوّل رحلته: ما بعد الخامسة مقفلٌ عليه — وهو ما تفتحه المعاينة
p.reset();
for (const node of NODES.slice(0, 5)) p.setStars(node.id, p.MAX_STARS);

// **وتوأمٌ عاديٌّ يُحمَّل من المخزن نفسِه** قبل رفع الراية: المقابلةُ بينهما مقابلةُ
// وضعين على حالٍ واحدة — لا بين نسختين افترقتا في الذاكرة.
const plain = await import(new URL('js/progress.js?plain', APP));
globalThis.location = { search: '?preview=1', pathname: '/' };
const view = await import(new URL('js/progress.js?preview=1', APP));

ok(view.PREVIEW === true && plain.PREVIEW === false,
  'الوحدةُ المحمَّلة بـ`?preview=1` تُعلن المعاينة، والعاديّةُ لا');

const last = NODES.at(-1);
ok(view.isNodeUnlockedById(last.id) && !plain.isNodeUnlockedById(last.id),
  `والقفلُ التسلسليّ مرفوعٌ فيها وحدَها (${last.id})`);
ok(view.unlockFrontier() === plain.unlockFrontier() && view.totalStars() === plain.totalStars(),
  `والجبهةُ تبقى على حقيقتها (${view.unlockFrontier()}) — المعاينةُ تفتح القفلَ ولا تدّعي إتماماً`);

const diskBefore = store.get('uktub.progress.v1');
view.setStars(last.id, view.MAX_STARS);
view.recordAttempt('م', 'معزول', view.KINDS.FREE, true);
view.recordFault('م', pen.FAULTS.WANDER);
view.addSeconds(600);
ok(store.get('uktub.progress.v1') === diskBefore,
  'ونجومٌ ومهاراتٌ وأخطاءٌ ودقائقُ تُكتب في المعاينة **ولا يُمَسّ القرص حرفاً**');

// وأصدقُ شاهدٍ: جهازٌ يُفتح بعد جولة المقيّم فلا يجد منها أثراً
globalThis.location = { search: '', pathname: '/' };
const afterView = await import(new URL('js/progress.js?after-view', APP));
ok(afterView.getStars(last.id) === plain.getStars(last.id)
  && afterView.faults().length === plain.faults().length
  && afterView.secondsOn() === plain.secondsOn(),
  'فيعود الجهازُ كما كان بمجرّد إغلاق الصفحة — بلا محوٍ ولا زرعِ نجوم');

// **والشريطُ يقول ما يجري**: مَن فتح المعاينة يرى إعلانَها، فلا يظنّ أنّ هذا ما يراه
// الطفلُ — والقفلُ التسلسليّ جوهرُ المنهج لا قيدٌ عليه.
const mainJs = read('js/main.js');
ok(/if \(progress\.PREVIEW\)/.test(mainJs) && /preview-bar/.test(mainJs)
  && /لا يُحفَظ/.test(mainJs),
  'وشريطُ المعاينة معلَنٌ في أعلى الشاشة يقول إنّ شيئاً لا يُحفَظ');
ok(/\?preview=1/.test(parentJs) && !/preview/i.test(read('index.html')),
  'وبابُها لوحةُ وليّ الأمر وحدَها — خلف بوابته الحسابية، لا زرٌّ في شاشة الطفل');

// ————— ٧) عاملُ الخدمة لا يعرف طريقاً إلى التقدّم —————

console.log('\n— ٧) ترقيةُ عامل الخدمة لا تمسّ التقدّم —');

const sw = read('sw.js');
ok(!/localStorage|indexedDB|IDBFactory/.test(sw),
  'ليس في `sw.js` سطرٌ يمسّ تخزين التقدّم (localStorage/IndexedDB)');
ok(/n\.startsWith\('uktub-audio-'\)|name\.startsWith\("uktub-|startsWith\('uktub-/.test(sw),
  'وما يمحوه عند الترقية مخزونُ الكاش وحدَه بشرط اسمه');
ok(!/clearStorage|storage\.clear|Clear-Site-Data/i.test(sw), 'ولا يطلب محوَ تخزين الموقع');
ok(/navigator\.storage|persist/.test(read('js/progress.js')),
  'والتقدّمُ يطلب لنفسه تخزيناً دائماً (يخفّف إخلاءَ iOS)');

console.log(fails ? `\n${fails} فشل` : '\nصلابةُ التقدّم: النسخةُ والمعاينةُ والتحكّمُ خضرٌ');
process.exit(fails ? 1 : 0);
