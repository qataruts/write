// اختبار «المرجع التعريفيّ» (`app/welcome/` — أربعُ صفحاتٍ بقشرةٍ واحدة):
//   node tools/test_welcome.mjs
//
// المحروس هنا ثمانية، وكلُّها شروطُ قبولٍ لا زينة:
//   ١) **خارج التطبيق**: لا في قائمة SHELL، ولا يجيب عنها عاملُ الخدمة، ولا تسجّل
//      عاملاً، ولا تصل بيان التطبيق (manifest) — فلا تدخل PWA المثبَّتة بحال.
//      **ولا سطرَ جافاسكربت واحداً** في أيّ صفحةٍ منها.
//   ٢) **لا مَورد شبكيّ خارجيّ البتّة**: كلُّ ما تجلبه الصفحةُ عند فتحها ملفٌّ في هذا
//      المستودع وموجودٌ فعلاً. **والاستثناءان معلَنان بقرارٍ في نصّ الحارس**: بوابةُ
//      العائلة `learn.mishkat.qa` (أمر بلاغ العائلة `2026-08-13-email-and-family-link`)
//      وعنوانُ موقعنا في ترويسة المطبوع — وكلاهما `<a>` يُفتَح إن نُقر **ولا يُجلَب**،
//      فلا يمسّ «صفرَ موردٍ خارجيّ» لأن المقيسَ ما تطلبه الصفحةُ لا ما تشير إليه.
//      **وبريدُ المراسلة `info@mishkat.qa` حصراً** — ولا بريدَ سواه في أيّ صفحة.
//   ٣) **قشرةٌ واحدة**: شريطُ التنقّل نفسُه في الصفحات الأربع، وصفحتُه الحالية معلَّمة،
//      وفوترُ العائلة بنصّه في كلٍّ منها.
//   ٤) **اللوح ليس منسوخاً**: لا لونَ بقيمته في تنسيق الصفحات — بل متغيّرات `app.css`.
//   ٥) **أرقامُها صادقة**: كلُّ رقمٍ موسومٍ `data-stat` في أيّ صفحة يُحسب من بيانات
//      المنهج ويُقارَن — فتوسعةُ المنهج تُسقِط الفحصَ قبل أن تُسقِط صدقَ الصفحة.
//   ٦) **لا نوعَ محطةٍ يُترك**: لكلّ نوعٍ في `journey()` بطاقتُه في صفحة المنهج بنمطها
//      الواحد (ماذا يتعلّم الطفل · كيف يعمل التمرين · دورُك أنت) وعددِ عقدها —
//      ونوعٌ جديد يُسقِط الفحصَ يومَ يُضاف (نظيرُ `test_measure`).
//   ٧) **ولا اسمَ قسمٍ يسقط**: أسماءُ الأقسام السبعةَ عشرَ تُقرأ من `curriculum.js`
//      ويُطالَب بها جدولُ الرحلة — فقسمٌ يُعاد تسميتُه يُمسَك هنا.
//   ٨) **لا وعدَ بما ليس في التطبيق**: كلُّ اسمِ زرٍّ تَعِد به الصفحةُ يُقابَل بنصّه في
//      `app/js/` — فلو غُيّر اسمٌ هناك احمرّ هنا.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const APP = new URL('app/', ROOT);
const WELCOME = new URL('welcome/', APP);
const read = (path, base = WELCOME) => readFileSync(new URL(path, base), 'utf8');

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

const PAGE_NAMES = ['index.html', 'curriculum.html', 'method.html', 'guide.html'];
const PAGES = Object.fromEntries(PAGE_NAMES.map((name) => [name, read(name)]));
const cur = PAGES['curriculum.html'];
const css = read('welcome.css');
const sw = read('sw.js', APP);
const appJs = ['parent.js', 'main.js', 'install.js']
  .map((f) => read(`js/${f}`, APP)).join('\n');

// بيانات المنهج — منها تُحسب أرقام الصفحات (لا تُصدَّق كما كُتبت)
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
const JS = new URL('js/', APP);
const progress = await import(new URL('progress.js', JS));
const {
  STAGES, GATES, MARKS, WORDS, SENTENCES, LETTERS, DIGITS, PATHS, Q3_RULING,
} = await import(new URL('curriculum.js', JS));
const { FAULT_TEXT } = await import(new URL('pen.js', JS));
const { PASS_PERCENT } = await import(new URL('catchup.js', JS));
const support = await import(new URL('support.js', JS));

// **الاستثناءان المعلَنان** — رابطان يُشار إليهما ولا يُجلبان (انظر ٢ أعلاه).
const FAMILY = 'https://learn.mishkat.qa/';
// **والرابطُ الخارجيّ الثاني معلَنٌ كأخيه** (بلاغ «بابٌ إلى حقيبة المعلم»، ١٧ أغسطس
// ٢٠٢٦): حقيبةُ المعلّم العائلية — `<a>` يُفتَح إن نُقر **ولا يُجلَب**، فلا يُنقض
// عهدُ «صفرِ موردٍ خارجيّ». وما زاد على هذين يحمرّ.
const TEACHER_KIT = 'https://learn.mishkat.qa/teacher.html';
const SITE = 'write.mishkat.qa';
const MAIL = 'info@mishkat.qa';

/** رقمٌ عربيّ مشرقيّ من عدد — كما تُكتب أرقامُ الصفحات. */
const ar = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

// ————— ١. خارج التطبيق، وصفرُ جافاسكربت —————

console.log('\n١. خارج التطبيق وصفرُ جافاسكربت');

for (const [name, text] of Object.entries(PAGES)) {
  ok(!/<link[^>]*rel=["']manifest["']/.test(text) && !/serviceWorker/.test(text)
    && !/<script/i.test(text) && !/\son[a-z]+=/i.test(text),
    `${name}: لا بيانَ تطبيقٍ ولا عاملَ خدمة ولا سطرَ جافاسكربت واحداً`);
}

const shellList = sw.match(/const SHELL = \[([\s\S]*?)\];/)?.[1] || '';
ok(!/welcome/.test(shellList), 'قائمةُ SHELL في عامل الخدمة لا تحمل صفحةَ تعريفٍ واحدة');
ok(/const WELCOME =/.test(sw) && /pathname\.startsWith\(WELCOME\)/.test(sw),
  'وعاملُ الخدمة يتنحّى عن مسار `welcome/` صراحةً (فلا يبتلعها ردُّ التنقّل)');

// ————— ٢. صفرُ موردٍ خارجيّ، والبريدُ واحد —————

console.log('\n٢. صفرُ موردٍ خارجيّ يُجلَب، والبريدُ واحد');

for (const [name, text] of Object.entries(PAGES)) {
  const fetched = [...text.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((m) => m[1])
    .filter((u) => !u.startsWith('mailto:') && !u.startsWith('#'));
  const external = fetched.filter((u) => /^(https?:)?\/\//.test(u));
  const declared = external.filter((u) => u === FAMILY || u === TEACHER_KIT);
  ok(external.length === declared.length,
    `${name}: لا رابطَ خارجيّ سوى الاستثناءين المعلَنين (${external.length ? external.join('، ') : 'لا شيء'})`);

  const missing = fetched.filter((u) => !/^(https?:)?\/\//.test(u)
    && !existsSync(new URL(u.split('?')[0], WELCOME)));
  ok(missing.length === 0, `${name}: كلُّ مَوردٍ تجلبه موجودٌ في الشجرة${missing.length ? `: ${missing.join('، ')}` : ''}`);
}

for (const [name, text] of Object.entries(PAGES)) {
  const mails = [...new Set([...text.matchAll(/mailto:([^"']+)/g)].map((m) => m[1]))];
  ok(mails.length === 1 && mails[0] === MAIL,
    `${name}: بريدُ المراسلة ${MAIL} حصراً (الموجود: ${mails.join('، ') || 'لا شيء'})`);
  ok(!/[\w.+-]+@(?!mishkat\.qa)[\w.-]+\.[a-z]{2,}/i.test(text),
    `${name}: ولا بريدَ آخرَ منثورٌ في النصّ`);
}

// **والأبعادُ المكتوبةُ تُقابَل بترويسة الملفّ نفسِه** (دَينٌ أمسكته ت١): أُعيد
// توليدُ اللقطات فطالت الشاشاتُ (السطرُ على اللوح)، **وبقيت الأبعادُ المكتوبةُ
// أبعادَ الأمس في عشرة مواضع** — فتُعرَض الصورةُ ممطوطةً ويرتجّ التخطيط. فلا
// يُقاس **وجودُ** الرقم وحدَه بعد اليوم، بل **صدقُه**.
const pngSize = (name) => {
  const buf = readFileSync(new URL(`shots/${name}`, WELCOME));
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
};

// كلُّ صورةٍ بأبعادها و`loading="lazy"` — فلا ترتجّ الصفحةُ عند التحميل
for (const [name, text] of Object.entries(PAGES)) {
  const imgs = [...text.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const bad = imgs.filter((t) => !/width=/.test(t) || !/height=/.test(t));
  const eager = imgs.filter((t) => !/loading="lazy"/.test(t) && !/src="\.\.\/icons\//.test(t));
  ok(bad.length === 0 && eager.length === 0,
    `${name}: ${ar(imgs.length)} صورةً كلُّها بأبعادها وبتحميلٍ كسول`);

  const wrong = imgs.filter((t) => /src="shots\//.test(t)).filter((t) => {
    const real = pngSize(t.match(/src="shots\/([^"]+)"/)[1]);
    return Number(t.match(/width="(\d+)"/)?.[1]) !== real.w
      || Number(t.match(/height="(\d+)"/)?.[1]) !== real.h;
  }).map((t) => t.match(/src="shots\/([^"]+)"/)[1]);
  ok(wrong.length === 0,
    `${name}: وأبعادُ كلِّ لقطةٍ هي أبعادُ ملفّها${wrong.length ? ` — الشائخ: ${wrong.join('، ')}` : ''}`);
}

// ————— ٣. قشرةٌ واحدة —————

console.log('\n٣. قشرةٌ واحدة وشريطُ تنقّلٍ واحد');

const NAV = PAGE_NAMES.map((n) => (n === 'index.html' ? './' : n));
for (const [name, text] of Object.entries(PAGES)) {
  const nav = text.match(/<nav class="w-topnav"[\s\S]*?<\/nav>/)?.[0] || '';
  const links = [...nav.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  ok(links.join('|') === [...NAV, '../'].join('|'),
    `${name}: شريطُ التنقّل هو الشريطُ نفسُه بترتيبه`);
  const self = name === 'index.html' ? './' : name;
  ok(new RegExp(`href="${self.replace('.', '\\.')}" aria-current="page"`).test(nav),
    `${name}: صفحتُها الحالية معلَّمةٌ في الشريط`);
  ok(text.includes(FAMILY) && text.includes('عائلة التعليم الأولي للطفل العربي')
    && text.includes('learn.mishkat.qa'),
    `${name}: سطرُ العائلة في الفوتر بنصّه`);
  ok(text.includes('<link rel="stylesheet" href="../css/app.css" />'),
    `${name}: لوحُها لوحُ التطبيق نفسُه`);
}

// ————— ٤. اللوح ليس منسوخاً —————

console.log('\n٤. اللوحُ مقروءٌ لا منسوخ');

/** التنسيقُ بلا كتلة `@media print` — **وعلّةُ الاستثناء معلَنة**: المقيسُ هنا
 *  ألّا تُنسَخ **لوحةُ الشاشة** فتفترق عن `app.css`؛ أمّا الورقُ فأبيضُ بحكم كونه
 *  ورقاً لا بحكم لوحةٍ تُنسَخ، فليس له متغيّرٌ في اللوح يُقرأ منه. */
const stripPrint = (text) => {
  const at = text.indexOf('@media print');
  if (at < 0) return text;
  let depth = 0;
  for (let i = text.indexOf('{', at); i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return text.slice(0, at) + text.slice(i + 1);
  }
  return text.slice(0, at);
};

const hex = [...stripPrint(css).matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]);
ok(hex.length === 0, `تنسيقُ الصفحات بلا لونٍ بقيمته خارج كتلة الطباعة (وُجد: ${hex.slice(0, 5).join('، ') || 'لا شيء'})`);
for (const [name, text] of Object.entries(PAGES)) {
  const inline = [...text.matchAll(/style="([^"]*)"/g)].map((m) => m[1]);
  const colored = inline.filter((s) => /#[0-9a-fA-F]{3,8}|rgb\(/.test(s));
  ok(colored.length === 0, `${name}: ولا لونَ منثورٌ في سماتها`);
}

// ————— ٥. أرقامُها محسوبةٌ من البيانات —————

console.log('\n٥. أرقامُها محسوبةٌ من بيانات المنهج');

const journey = progress.journey();
const nodesOfKind = (kind) => journey.filter((s) => s.kind === kind)
  .reduce((sum, s) => sum + s.nodes.length, 0);
const pathForms = Object.values(PATHS).reduce((n, forms) => n + Object.keys(forms).length, 0);
const strokes = Object.values(PATHS)
  .flatMap((forms) => Object.values(forms))
  .reduce((n, p) => n + (p.strokes?.length || 0), 0);
const q3 = {
  total: Q3_RULING.length,
  station: Q3_RULING.filter((r) => r.surface && !r.word).length,
  hosted: Q3_RULING.filter((r) => r.word).length,
  dropped: Q3_RULING.filter((r) => !r.surface).length,
};

// **وعدُ الترتيب يُقاس لا يُصدَّق** (البند ٣ من ت١): نقضت م١ ترتيبَ «الحروفُ
// كلُّها ثم الأشكال ثم الوصل» إلى مناوبةٍ (مجموعة ← أشكالُها ← كلماتُها)، وكان
// وعدُ الصفحة يصف المنسوخ. **فتُقرأ الأرقامُ الثلاثةُ من الرحلة نفسِها**: عددُ
// المجموعات، وموضعُ أوّل كلمةٍ فيها، وكم حرفاً سبقها — ويومَ يتبدّل الترتيبُ
// يحمرّ الوعدُ قبل أن يُقرأ كاذباً.
const ALL_NODES = progress.allNodes();
const firstWordAt = ALL_NODES.findIndex((n) => n.words?.length);
const FIRST_WORD = firstWordAt < 0 ? null : ALL_NODES[firstWordAt].words[0];

const STATS = {
  // **«القسم» في هذه الصفحات مرحلةٌ من المنهج لا محطةٌ على الخريطة** (الجلسة ش):
  // جدولُ «الرحلة بترتيبها» يعدّ مراحلَ `METHOD §٤` وبواباتِها الثلاث، وقد صارت
  // المرحلةُ الكبيرة تُعرَض محطاتٍ متتالية (`stageSections`) — **شقٌّ في العرض لا في
  // المنهج**. فيُقرأ العددُ من المنهج نفسِه كما يقرؤه الجدول، ولو تبدّل شكلُ عرضه.
  // **والشطرُ الذي يعلن أصلَه ليس قسماً ثانياً** (`of`، الجلسة ح): شُقّت «بساتينُ
  // النسخ» صندوقين لتقع محطةُ الاسم بعد أوّل بستان — والمرحلةُ في المنهج واحدة
  // باسمها وعقدِها، فتُعَدّ مرّةً كما يعدّها الجدول.
  sections: new Set(STAGES.map((s) => s.of ?? s.id)).size + GATES.length,
  nodes: progress.allNodes().length,
  letters: Object.keys(LETTERS).length,
  pathForms,
  strokes,
  words: Object.keys(WORDS).length,
  sentences: Object.keys(SENTENCES).length,
  marks: MARKS.length,
  gates: GATES.length,
  kinds: Object.keys(progress.KINDS).length,
  faults: Object.keys(FAULT_TEXT).length,
  warmupNodes: nodesOfKind('warmup'),
  letterNodes: nodesOfKind('letter'),
  digitNodes: nodesOfKind('digit'),
  digits: Object.keys(DIGITS).length,
  nameNodes: nodesOfKind('name'),
  gateNodes: nodesOfKind('gate'),
  formNodes: nodesOfKind('form'),
  joinNodes: nodesOfKind('join'),
  fadeNodes: nodesOfKind('fade'),
  sentenceNodes: nodesOfKind('sentence'),
  // **وعتبةُ اللحاق من `gate.js` بعينها** (جلسة د): الصفحةُ تَعِد بصرامة بوّابات
  // الإتقان، فيُقرأ الرقمُ من مالكه لا يُكتب في نصٍّ تعريفيّ يشيخ.
  passPercent: PASS_PERCENT,
  q3Total: q3.total,
  q3Station: q3.station,
  q3Hosted: q3.hosted,
  q3Dropped: q3.dropped,
  groups: STAGES.filter((s) => /^g\d+$/.test(s.id)).length,
  firstWordNode: firstWordAt + 1,
  firstWordLetters: ALL_NODES.slice(0, firstWordAt).filter((n) => n.type === 'letter').length,
};

const seen = new Set();
for (const [name, text] of Object.entries(PAGES)) {
  for (const [, key, shown] of text.matchAll(/data-stat="([^"]+)"[^>]*>([^<]+)</g)) {
    seen.add(key);
    const want = STATS[key];
    ok(want !== undefined && shown.trim() === ar(want),
      `${name}: «${key}» = ${shown.trim()} ${want === undefined ? '— رقمٌ لا تعرفه البيانات' : `(المحسوب ${ar(want)})`}`);
  }
}
// واسمُ أوّل كلمةٍ يُقابَل بمصدره — فلا يبقى «بَابَا» مكتوباً إن تبدّلت الكلمة
// **وموضعُ القياس صدرُ الصفحة** لا الصفحةُ كلُّها: الكلمةُ ترد في خانة مادّتها
// من الجدول على كلّ حال، فلو قِيست الصفحةُ كلُّها لَبقي وعدُ الصدر بلا حارس.
{
  const head = cur.match(/<div class="w-head">[\s\S]*?<\/div>/)?.[0] || '';
  ok(FIRST_WORD !== null && head.includes(FIRST_WORD),
    `وأوّلُ كلمةٍ في الرحلة مسمّاةٌ في صدر صفحة المنهج بعينها (${FIRST_WORD ?? 'لا كلمة'})`);
}

const unused = Object.keys(STATS).filter((k) => !seen.has(k));
ok(unused.length === 0, `ولا رقمَ محسوبٌ بلا موضعٍ في الصفحات${unused.length ? `: ${unused.join('، ')}` : ''}`);

// ————— ٥ب. جدولُ الرحلة: أعدادُه محسوبةٌ كأخواتها —————
//
// **الدَّينُ الذي أُغلق هنا** (أُعلن في الجلسة ش ولم يُمَسّ): أعدادُ العقد في جدول
// «الرحلة بترتيبها» كانت **مكتوبةً بيد وقد شاخت** — بساتينُ النسخ «١٢» والحقُّ ١١١،
// والإملاء «١٠» والحقُّ ١٠٠، وسلّمُ الجمل «١٠» والحقُّ ٢٨ — **ولا حارسَ يمسكها**،
// بينما أخواتُها الموسومة `data-stat` محروسةٌ منذ بُنيت الصفحة.
//
// **ولا وسمَ يُضاف إلى الجدول**: صفُّه يحمل اسمَ قسمه في خانته، فيُقرأ الاسمُ ويُسأل
// عنه المنهجُ — فلا مفتاحٌ يُكتب مرّتين ولا سطرٌ يُعدَّل حين يكبر قسم.
//
// **والعددُ عددُ العقد لا عددُ الشُّطور**: الشقُّ عرضٌ في الخريطة (الجلسة ش)، وهذه
// الصفحةُ تصف المنهجَ — فتُجمَع عقدُ شُطور المرحلة كلِّها تحت اسم مرحلتها.

console.log('\n٥ب. جدولُ «الرحلة بترتيبها»: أعدادُه من المنهج');

// **والشطرُ يُجمَع إلى أصله** (`of`) كما يُجمَع شطرُ العرض إلى مرحلته — سواءٌ أشُقّت
// المرحلةُ لسقفٍ (`stageSections`) أم لتقع محطةٌ بين شطريها (محطةُ الاسم، الجلسة ح).
const stageNodes = {};
for (const section of journey) {
  const key = section.stage ? (section.stage.of ?? section.stage.id) : section.id;
  stageNodes[key] = (stageNodes[key] || 0) + section.nodes.length;
}
const TABLE_NODES = new Map([
  ...STAGES.map((s) => [s.title, stageNodes[s.of ?? s.id] || 0]),
  ...GATES.map((g) => [g.title, stageNodes[`gate:${g.id}`] || 0]),
]);

const table = cur.match(/<table class="w-table">[\s\S]*?<\/table>/)?.[0] || '';
const tableRows = [...table.matchAll(
  /<tr>\s*<td class="w-num-cell">([^<]+)<\/td>\s*<td class="w-stage">([^<]+)<\/td>\s*<td class="w-num-cell">([^<]+)<\/td>/g)]
  .map((m) => ({ idx: m[1].trim(), title: m[2].trim(), count: m[3].trim() }));

ok(tableRows.length === TABLE_NODES.size,
  `جدولُ الرحلة ${ar(tableRows.length)} صفاً — بعدد أقسام المنهج (${ar(TABLE_NODES.size)})`);
for (const [i, row] of tableRows.entries()) {
  const want = TABLE_NODES.get(row.title);
  ok(want !== undefined && row.count === ar(want) && row.idx === ar(i + 1),
    `${row.idx} · ${row.title}: ${row.count} محطة`
    + (want === undefined ? ' — قسمٌ لا يعرفه المنهج'
      : ` (المحسوب ${ar(want)}${row.idx === ar(i + 1) ? '' : `، وترتيبُه ${ar(i + 1)}`})`));
}
const tableSum = tableRows.reduce((n, row) => n + (TABLE_NODES.get(row.title) || 0), 0);
ok(tableSum === STATS.nodes,
  `ومجموعُ الجدول ${ar(tableSum)} = محطاتُ الرحلة كلِّها ${ar(STATS.nodes)}`);

// **وعددُ المخالفات المعلَنة يُعَدّ من الصفحة لا يُكتب بيد**: كان «أربعةُ مواضع»
// مكتوباً بينما المواضعُ خمسة، ثم دخل سادسٌ (حكمُ «الشكل لا الأثر» في الخطوة
// الحرّة — مخالفةُ ق١ الحرفيّ من بلاغ الميدان ٢). فمن أعلن مخالفةً جديدة **يُسقِط
// هذا الفحصَ حتى يُصلِح العدد**، ومن حذف كذلك.
{
  const section = PAGES['method.html']
    .match(/<h2>٦\. المخالفاتُ المعلَنة<\/h2>[\s\S]*?<\/section>/)?.[0] || '';
  const blocks = (section.match(/<div class="w-why">/g) || []).length;
  const shown = section.match(/<b data-why-count>([^<]+)<\/b>/)?.[1]?.trim();
  ok(blocks > 0 && shown === ar(blocks),
    `المخالفاتُ المعلَنة: الصفحةُ تقول «${shown ?? 'لا عدد'}» وفيها ${ar(blocks)} موضعاً`);
  // ولا تُعلَن مخالفةٌ بلا سببٍ مكتوب — «قرارٌ لا يُعلَن سببُه لا يُراجَع»
  const why = [...section.matchAll(/<div class="w-why">([\s\S]*?)<\/div>/g)]
    .filter((m) => !/وسببُ|وسببُه|القاعدةُ واحدةٌ|حدودُ النطاق/.test(m[1]));
  ok(why.length === 0,
    `ولكلِّ موضعٍ سببُه مكتوب${why.length ? ` — بلا سبب: ${why.length}` : ''}`);
}

// وأسماءُ العلامات الثلاث التي وجدت حاملَها تُذكر بأعيانها — لا عدداً مجرّداً
for (const entry of Q3_RULING.filter((r) => r.word)) {
  ok(PAGES['method.html'].includes(entry.word),
    `صفحة الأسس تسمّي حاملَ «${entry.name}»: ${entry.word}`);
}

// ————— ٦. لا نوعَ محطةٍ يُترك —————

console.log('\n٦. لكلّ نوع محطةٍ بطاقتُه بنمطها الواحد');

const CARD_PATTERN = ['ماذا يتعلّم الطفل', 'كيف يعمل التمرين', 'دورُك أنت'];
for (const kind of [...new Set(journey.map((s) => s.kind))]) {
  const card = cur.match(new RegExp(`<article class="w-station" data-covers="${kind}"[\\s\\S]*?</article>`))?.[0];
  if (!card) { fails++; console.log('  ✗', `نوعُ المحطة «${kind}» بلا بطاقةٍ في صفحة المنهج`); continue; }
  const count = card.match(/data-count="([^"]+)"/)?.[1];
  const missing = CARD_PATTERN.filter((p) => !card.includes(p));
  ok(count === ar(nodesOfKind(kind)) && missing.length === 0,
    `«${kind}»: بطاقةٌ بعددها ${count} وبأضلاع النمط الثلاثة${missing.length ? ` — ينقصها: ${missing.join('، ')}` : ''}`);
}

// ولقطةٌ لكلّ بطاقة — الصورةُ من شاشة التطبيق لا من يد مصمّم
const shots = [...cur.matchAll(/src="(shots\/[^"]+)"/g)].map((m) => m[1]);
ok(shots.length >= [...new Set(journey.map((s) => s.kind))].length,
  `وصفحةُ المنهج تعرض ${ar(shots.length)} لقطاتٍ من شاشات التطبيق`);

// ————— ٧. ولا اسمَ قسمٍ يسقط —————

console.log('\n٧. أسماءُ الأقسام مقروءةٌ من المنهج');

// **وأسماءُ المراحل لا أسماءُ شُطورها** (الجلسة ش): الجدولُ يعدّ مراحلَ المنهج، وشقُّ
// المرحلة الكبيرة محطاتٍ عرضٌ يقع في الخريطة — تحرسه مقايسةُ `test_nodes` لا هذه.
const titles = [...STAGES.map((s) => s.title), ...GATES.map((g) => g.title)];
const absent = titles.filter((t) => !cur.includes(t));
ok(absent.length === 0,
  `الأقسامُ ${ar(titles.length)} كلُّها في جدول الرحلة${absent.length ? ` — الغائب: ${absent.join('، ')}` : ''}`);

// ————— ٧ب. قسمُ الميزتين: جردُ المقابض وفقرةُ الحدّ (جلسة د) —————
//
// **أمرُ المالك** (`2026-08-17-features-need-their-own-sections.md`): الميزتان
// **قسمان مستقلان بعنوانهما** لا سطرٌ في نصّ — بطاقةُ اللحاق وبطاقةُ الدعم، ولكلٍّ
// **مقابضُ تطبيقنا بأسمائها**. فيُجرَد ذلك **آلياً من جدول `support.js` نفسِه**:
// مقبضٌ يُضاف أو يُعاد تسميتُه ولا تذكره الصفحةُ يحمرّ هنا — كما تحمرّ أرقامُها.
//
// **وفقرةُ الحدّ تُقابَل بمصدرها** (`support.PROMISE`) لا بعينٍ تقرأ: أمسك حارسُ اقرأ
// سقوطَ «ولا يَعِد بحجم أثر» ساعةَ نُقل النصّ — **فالحدُّ يُحرَس كالوعد**.

console.log('\n٦ج. بابُ حقيبة المعلم من صدر الدليل');

// **بلاغ `teacher-kit-link-and-whatsapp-form`**: معلّمٌ يبلغ دليلَنا لا يعرف أنّ
// للعائلة حقيبةً — فالإحالةُ في **صدر** الدليل (لا في ذيله) وتدخل جردَ التغطية.
// **وإحالةٌ لا نسخ**: الحقيبةُ عامّةٌ ودليلُنا خاصٌّ أعمق، والنسخُ يفترق نصفاه.
{
  const guide = PAGES['guide.html'];
  const head = guide.slice(0, guide.indexOf('<section'));
  ok(/learn\.mishkat\.qa\/teacher\.html/.test(head),
    'إحالةُ حقيبة المعلم في **صدر** الدليل — قبل أول قسم');
  ok(/حقيبةُ المعلّم/.test(head) && /للعائلة/.test(head),
    'وتقول إنها حقيبةٌ **للعائلة** لا صفحةٌ ثانية لنا');
  const kit = head.match(/<p class="w-lede w-kit">[\s\S]*?<\/p>/)?.[0] || '';
  ok(kit.length < 700 && !/محطات|مقابض|أزرار/.test(kit),
    'وهي **إحالةٌ لا نسخ** — لا تُعيد ما في الحقيبة ولا ما في دليلنا');
  // **والرابطُ في اسمه لا في مساره** (حكم المالك، ١٧ أغسطس ٢٠٢٦): على الشاشة
  // يُنقر الاسمُ، **وعلى الورق يُكشَف العنوان** بقاعدة طباعةٍ — فلا مسارٌ عارٍ
  // يشوّه السطر، ولا معلّمٌ يطبع الدليل فيبقى بلا عنوان.
  ok(/<a href="[^"]*teacher\.html"><b>حقيبةُ المعلّم<\/b><\/a>/.test(kit),
    'والرابطُ في **اسم الحقيبة** لا في مسارٍ عارٍ');
  ok(!/learn\.mishkat\.qa\/teacher\.html<\/a>/.test(kit),
    'ولا يُطبَع المسارُ نصّاً على الشاشة');
  ok(/\.w-kit a\[href\^="http"\]::after/.test(css) && /@media print/.test(css),
    'وعلى **الورق** يُكشَف العنوان بقاعدة طباعة — فمن طبع الدليلَ بلغ الحقيبة');
}

console.log('\n٧د. بابُ ساحة الحصاد — في الذيل وحدَه');

// **حكمُ المالك** (١٨ أغسطس ٢٠٢٦، بلاغُ ساحة الحصاد): الرابطُ **سطرٌ هادئ في ذيل
// الرئيسة** حيث بابُ العائلة — **لا في الصدر ولا في الشريط ولا بطاقةً بين
// الأقسام**. **وعلّتُه**: دعوةُ متطوّعٍ لا ميزةُ طفل، فلا تزاحم وعدَ المنتَج.
// **فيُقاس موضعُه كما يُقاس ترتيبُ الأقسام** — لا يُصدَّق أنه في الذيل لأنه كُتب فيه.
{
  const home = PAGES['index.html'];
  const ARENA = '../arena/';
  const LINE = 'ساعِدنا نُحسّن المحرّك — اكتب حروفاً في ثلاث دقائق';

  ok(existsSync(new URL('arena/index.html', APP)),
    'صفحةُ الساحة موجودةٌ على القرص — فلا يَعِد الذيلُ ببابٍ ليس خلفه شيء');

  const foot = home.match(/<footer class="w-foot">[\s\S]*?<\/footer>/)?.[0] || '';
  ok(foot.includes(`href="${ARENA}"`) && foot.includes(LINE),
    'رابطُ الساحة في **ذيل** الرئيسة بلفظه — دعوةُ مشاركةٍ لا وعدُ ميزة');

  // وموضعُه مقيسٌ لا مدّعىً: بعد سطر العائلة، وفي آخر الصفحة كلِّها
  const atArena = home.indexOf(`href="${ARENA}"`);
  const atFamily = home.lastIndexOf(FAMILY);
  const atMain = home.indexOf('</main>');
  ok(atArena > atMain && atArena > atFamily,
    'وموضعُه بعد آخر أقسام الصفحة وبعد بابِ العائلة — لا بطاقةً بين الأقسام');

  // ولا يظهر في الشريط ولا في الصدر
  const nav = home.match(/<nav class="w-topnav"[\s\S]*?<\/nav>/)?.[0] || '';
  const hero = home.match(/<header class="w-hero">[\s\S]*?<\/header>/)?.[0] || '';
  const band = home.match(/<aside class="w-band"[\s\S]*?<\/aside>/)?.[0] || '';
  ok(!nav.includes(ARENA) && !nav.includes('arena')
    && !hero.includes('arena') && !band.includes('arena'),
    'ولا أثرَ له في الشريط ولا في الصدر ولا في شريط الإنصاف');

  // ولا يُدخَل إلى تطبيق الطفل — القيدُ الأول من قيود الساحة
  ok(!Object.entries(PAGES).some(([n, t]) => n !== 'index.html' && t.includes('arena')),
    'ولا يتكرّر في صفحةٍ أخرى — بابٌ واحدٌ في موضعٍ واحد');
}

console.log('\n٧أ. شريطُ الإنصاف تحت الصدر مباشرة');

// **بلاغ `equity-band-under-hero`**: الشريطُ يدخل جردَ التغطية فلا يسقط في تحريرٍ
// لاحق — وموضعُه مقيسٌ لا مدّعىً: **بعد الصدر وقبل التثبيت**، فترتيبُ «التثبيتُ
// قبل كل تفصيل» محفوظ وهو سطران فوقه لا قسمٌ يزاحمه.
const band = PAGES['index.html'].match(/<aside class="w-band"[\s\S]*?<\/aside>/)?.[0] || '';
ok(Boolean(band), 'شريطُ الإنصاف موجودٌ في الرئيسة');
ok(/اللحاق/.test(band) && /الدعم/.test(band),
  'وفيه البابان معاً — من مستوى يدِه، وبإيقاعٍ أهدأ');
ok(/لوحة وليّ الأمر/.test(band) && /اختياريّ/.test(band),
  'ويقول إنهما اختياريّان من لوحة وليّ الأمر — فلا يُفهم أنهما وسمٌ على الطفل');
ok(/href="#pace"/.test(band), 'ورابطُه ينزل إلى القسم المفصَّل (#pace) — لا يكرّره');
{
  const home = PAGES['index.html'];
  const at = (re) => home.search(re);
  ok(at(/<\/header>/) < at(/<aside class="w-band"/)
    && at(/<aside class="w-band"/) < at(/id="install-first"/),
    'وموضعُه بعد الصدر وقبل التثبيت — فترتيبُ «التثبيتُ قبل كل تفصيل» محفوظ');
  ok(!/<img|<script/.test(band), 'ولا صورةَ فيه ولا جافاسكربت — وزنُه صفرٌ على الصفحة');
}

console.log('\n٧ج. ترتيبُ أقسام الرئيسة — ما لا يُحرَس يعود');

// **أمرُ المالك** (بلاغ `equity-section-position`، ١٧ أغسطس ٢٠٢٦): الإنصافُ قريبٌ من
// أوّل الصفحة — **بعد قسم التثبيت مباشرة**، والتثبيتُ يبقى أوّلَ الأقسام كما أمر
// قبلَه. **وموضعُ قسمٍ يُنقَض في تحريرٍ لاحق بلا أن يشعر أحد**، فهذا بابُ حراسته.
{
  const home = PAGES['index.html'];
  const order = [...home.matchAll(/<section class="w-section"[^>]*>/g)]
    .map((m) => (m[0].match(/id="([^"]+)"/) || [])[1] || '—');
  ok(order[0] === 'install-first',
    `التثبيتُ أوّلُ أقسام الرئيسة (الترتيب: ${order.slice(0, 3).join(' ← ')})`);
  ok(order[1] === 'pace', 'وقسمُ الإنصاف يليه مباشرةً — لا في عمق الصفحة');
}

console.log('\n٧ب. قسمُ اللحاق والدعم في الرئيسة');

const home = PAGES['index.html'];
const section = home.match(/<section class="w-section" id="pace"[\s\S]*?<\/section>/)?.[0] || '';
const flat = (t) => t.replace(/\s+/g, ' ').trim();

ok(Boolean(section) && /<h2>[^<]+<\/h2>/.test(section),
  'قسمٌ مستقلٌّ بعنوانه في الرئيسة — لا سطرٌ داخل بطاقةٍ أخرى');
ok((section.match(/<article class="w-card">/g) || []).length === 2
  && /بوابةُ اللحاق/.test(section) && /وضعُ الدعم/.test(section),
  'وفيه بطاقتان: امتحانُ اللحاق ووضعُ الدعم');
ok(/لوحة وليّ الأمر/.test(section) && /لا في شاشة الطفل/.test(section),
  'ومقدّمتُه تقول: بابان اختياريان في لوحة وليّ الأمر لا في شاشة الطفل');
ok(/يفتح ما أُثبت لا ما ادُّعي/.test(section) && /لا يُغلق/.test(section)
  && /صناديقَ\s+مراجعته|صناديق مراجعته/.test(flat(section)),
  'وبطاقةُ اللحاق بقيودها: يفتح ما أُثبت · ويدخل ليتنر قياساً · وما فُتح لا يُغلق');
ok(/لا يُحتسب ما أُعين عليه إتقاناً/.test(section),
  'وبطاقةُ الدعم تقول صريحاً: **لا يُحتسب ما أُعين عليه إتقاناً**');

// **جردُ المقابض آلياً** — من الجدول لا من قائمةٍ تُكتب هنا
const shown = support.KEYS.filter((k) => flat(section).includes(flat(support.KNOBS[k].title)));
ok(shown.length === support.KEYS.length,
  `ومقابضُ الدعم الخمسة بأسمائها من جدولها (${shown.length}/${support.KEYS.length}`
  + `${shown.length < support.KEYS.length
    ? ` — ناقص: ${support.KEYS.filter((k) => !shown.includes(k)).map((k) => support.KNOBS[k].title).join('، ')}`
    : ''})`);

// **وفقرةُ الحدّ من مصدرها** — لا منسوخةً بيدٍ تسقط منها كلمة
const limit = section.match(/<p[^>]*data-promise[^>]*>([\s\S]*?)<\/p>/)?.[1] || '';
ok(Boolean(limit), 'وتحتهما فقرةُ الحدّ موسومةً `data-promise`');
ok(flat(limit) === flat(support.PROMISE),
  'ونصُّها **عينُ `support.PROMISE`** حرفاً — فحدٌّ يسقط في نقلٍ يحمرّ هنا');

// ————— ٨. لا وعدَ بما ليس في التطبيق —————

console.log('\n٨. لا وعدَ بزرٍّ ليس في التطبيق');

const PROMISED = ['تابع من هنا', 'مراجعة اليوم', 'ثبّت الآن', 'انسخ تقدّم طفلي', 'استعِد من ملف'];
for (const label of PROMISED) {
  const inPages = Object.values(PAGES).some((t) => t.includes(label));
  ok(!inPages || appJs.includes(label), `«${label}»: موعودٌ في الصفحات وموجودٌ في التطبيق`);
}
// وعنوانُ موقعنا في ترويسة المطبوع — ثاني الاستثناءين، نصٌّ لا رابطٌ يُجلَب
for (const [name, text] of Object.entries(PAGES)) {
  ok(text.includes(`<span class="w-print-url">${SITE}</span>`),
    `${name}: عنوانُنا في ترويسة المطبوع نصّاً لا رابطاً`);
}

// ————— **بابُ التصحيح** (`--fix`): يكتب المحسوبَ في الصفحات —————
//
// **وعلّتُه أنّ الحاسبَ واحدٌ لا اثنان**: أرقامُ الصفحات موسومةٌ بيد ومحسوبةٌ هنا،
// **فلو حُدِّثت بيدٍ ثانيةٍ لَافترق مصدران** — والصوابُ أن يكتبها **الحاسبُ نفسُه**،
// فلا يُكتب رقمٌ لم يُقَس. **ولا يُغيّر إلا ما وُسم**: `data-stat` وعمودَ عدد المحطات
// في جدول الرحلة — وما سواهما نصٌّ لا يمسّه.
if (process.argv.includes('--fix')) {
  console.log('\n— تصحيحُ أرقام الصفحات من المحسوب —');
  let touched = 0;
  for (const name of PAGE_NAMES) {
    const file = new URL(name, WELCOME);
    let text = readFileSync(file, 'utf8');
    const was = text;
    text = text.replace(/(data-stat="([^"]+)"[^>]*>)([^<]+)(<)/g,
      (all, head, key, shown, tail) => (STATS[key] === undefined ? all
        : head + ar(STATS[key]) + tail));
    if (name === 'curriculum.html') {
      // **وبطاقاتُ أنماط المحطات كذلك** — عددُها من الرحلة لا من نصٍّ يشيخ.
      text = text.replace(/(<article class="w-station" data-covers="([^"]+)" data-count=")([^"]+)(")/g,
        (all, head, kind, shown, tail) => head + ar(nodesOfKind(kind)) + tail);
      text = text.replace(
        /(<tr>\s*<td class="w-num-cell">[^<]+<\/td>\s*<td class="w-stage">([^<]+)<\/td>\s*<td class="w-num-cell">)([^<]+)(<)/g,
        (all, head, title, shown, tail) => {
          const want = TABLE_NODES.get(title.trim());
          return want === undefined ? all : head + ar(want) + tail;
        });
    }
    if (text !== was) { writeFileSync(file, text); touched += 1; console.log(`  ✎ ${name}`); }
  }
  console.log(touched ? `  ⇐ صُحّح ${ar(touched)} ملفّاً — أعِد الفحص` : '  لا شيء يُصحَّح');
  process.exit(0);
}

console.log(fails ? `\n${ar(fails)} إخفاق` : '\nالمرجعُ التعريفيّ سليم: قشرةٌ واحدة، وأرقامٌ محسوبة، ولا وعدَ بما ليس فيه.');
process.exit(fails ? 1 : 0);
