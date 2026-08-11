// حارسُ «لا عقدةَ بلا كاتبِ نجمة» — **من بذرة اقرأ**:
//   node tools/test_nodes.mjs
//
// **العيبُ الذي وُلد منه** (بلاغ مالك اقرأ): «البرنامج توقّف عند هذا الموضع، وعند
// الانتهاء منه لا يفتح الحلقة التالية». وعلّتُه **معرّفان لعقدةٍ واحدة**: الرحلةُ
// تنشئ العقدة بمعرّف، والشاشةُ تكتب نجمتَها بمعرّفٍ آخر — فالنجمةُ تُحفظ في مكانٍ لا
// يُقرأ ⇒ `isDone` كاذبةٌ أبداً ⇒ **الجبهةُ تتجمّد فلا يُفتَح بعدها شيءٌ ما حيي الجهاز**.
//
// وهو صنفٌ يستحقّ حارساً لا إصلاحاً: **كلُّ عقدةٍ في الرحلة يجب أن يكون لها شاشةٌ
// تكتب نجمتَها بمعرّفها هو**. وسابقةٌ لا كاتبَ لها تعني طريقاً مسدوداً في الرحلة —
// ولا يظهر في اختبارٍ ولا لقطة، بل في جهاز طفلٍ بعد أسابيع.
//
// ————— حالُه في «اُكْتُبْ» (هُيِّئ في الجلسة ٣) —————
//
// امتلأت الرحلةُ باشتقاق المنهج، **فالمقيسُ صار نوعَ العقدة لا سابقةَ معرّفها**:
// الموجّهُ عندنا يفتح الشاشةَ بنوعها (`openNode`: ‎#/<type>/<part>‎) لا باسم محطتها،
// فالشاشةُ الواحدة تخدم محطاتِ نوعها كلَّها — ومطالبةُ كلِّ محطةٍ بكاتبٍ باسمها
// تسأل ما لا تبنيه البنية.
//
// **والإعفاءُ لا يُكتب هنا بل يُقرأ من الموجّه نفسِه**: `SCREENS` في `main.js` جردُ
// الأنواع التي لم تُكتب شاشتُها بعدُ ومَن يملكها من الجلسات — وهو الجردُ الذي يمنع
// الطفلَ من طريقٍ مسدود. فما دام النوعُ فيه فهو معلَّقٌ بإعلانٍ يقرؤه الطفلُ قبل
// الفاحص، ويومَ تُكتب شاشتُه ويسقط سطرُه **يصير مطالِباً بكاتب نجمته** — بلا سطرٍ
// يُضاف هنا ولا انتباهٍ يُرجى (وهو نمطُ «التعليقُ يُطالِب من نفسه»، الجلسة ٠).

import { readFileSync, readdirSync } from 'node:fs';

const APP = new URL('../app/js/', import.meta.url);
const read = (name) => readFileSync(new URL(name, APP), 'utf8');

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };
const skip = (msg) => console.log('  ○', msg);

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const progress = await import(new URL('progress.js', APP));

console.log('\n١. لكل نوعِ عقدةٍ شاشةٌ تكتب نجمتَها');

const nodes = progress.allNodes();

if (!nodes.length) {
  skip('لا عقدةَ في الرحلة بعدُ — المنهجُ يُشتقّ آلياً في الجلسة ٣، والفحصُ يعمل معه');
} else {
  ok(true, `الرحلةُ فيها ${nodes.length} عقدة`);

  // **مصنعُ العقد والموجِّه يُستثنيان**: `progress.js` ينشئ المعرّفات و`main.js`
  // يحرس بها الطريق — وكلاهما يذكر كلَّ نوع. والمقيسُ **مَن يكتب النجمة** لا مَن
  // يذكر الاسم؛ ولولا هذا الاستثناء لمرّ العيبُ نفسُه.
  const FACTORY = new Set(['progress.js', 'main.js']);

  const writers = new Map();
  for (const name of readdirSync(APP).filter((f) => f.endsWith('.js'))) {
    if (FACTORY.has(name)) continue;
    const src = read(name);
    if (!src.includes('setStars(') && !src.includes('nodeId')) continue;
    const literals = new Set([...src.matchAll(/['"`]([a-z][a-z0-9]*)['"`:]/g)].map((m) => m[1]));
    writers.set(name, literals);
  }
  ok(writers.size >= 1, `وشاشاتٌ تكتب النجوم: ${writers.size} وحدة`);

  // جردُ المنتظَر **من الموجّه نفسِه** لا من قائمةٍ ثانية هنا: ما دام النوعُ في
  // `SCREENS` فلا شاشةَ له بعدُ، وسطرُه يقول مَن يملكها.
  const router = read('main.js');
  const block = router.match(/const SCREENS = \{(.*?)\n\};/s)?.[1] ?? '';
  const pending = new Map([...block.matchAll(/(\w+):\s*'([^']*)'/g)].map((m) => [m[1], m[2]]));

  const types = [...new Set(nodes.map((n) => n.type))].sort();
  const orphans = [];
  for (const type of types) {
    if (pending.has(type)) {
      skip(`[${type}] لا شاشةَ له بعدُ — ${pending.get(type)} (يُطالَب يومَ يسقط سطرُه من الموجّه)`);
      continue;
    }
    const who = [...writers].filter(([, set]) => set.has(type)).map(([name]) => name);
    if (!who.length) orphans.push(type);
    else ok(true, `[${type}] تكتب نجمتَه: ${who.join('، ')}`);
  }
  ok(orphans.length === 0,
    `ولا نوعَ عقدةٍ مفتوحٍ بلا كاتبِ نجمة (${types.length} نوعاً في الرحلة)`
    + (orphans.length ? ` — يتيم: ${orphans.join('، ')}` : ''));

  // **ولا سطرَ بائدٌ في الموجّه**: نوعٌ يُعلَن أنّ شاشتَه لم تُكتب وهو ليس في الرحلة
  // أصلاً وعدٌ لا موضوعَ له، ويُخفي سقوطَ محطةٍ من المنهج.
  const stale = [...pending.keys()].filter((type) => !types.includes(type));
  ok(stale.length === 0,
    'ولا نوعٌ في جرد الموجّه سقط من الرحلة'
    + (stale.length ? ` — بائد: ${stale.join('، ')}` : ''));
}

console.log('\n٢. ولا معرّفَ يتكرّر ولا عقدةَ بلا معرّف');

const ids = nodes.map((n) => n.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
ok(dupes.length === 0,
  `كلُّ معرّفٍ فريد${dupes.length ? ` — مكرَّر: ${[...new Set(dupes)].join('، ')}` : ''}`);
ok(ids.every((id) => id && id.includes(':')), 'ولكلٍّ سابقةٌ ومعرّف');

console.log('\n٣. والبوابةُ تكتب نجمتَها بمعرّفها هو');

// السابقةُ مصدرُها واحد: `gateNodes` تنشئ `gate:<id>` و`gate.js` يكتب النجمة عليه.
// وهذا هو عينُ العيب الذي وُلد منه هذا الحارس، مسدوداً بالبناء لا بالانتباه.
ok(/const nodeId = `gate:\$\{gate\.id\}`/.test(read('gate.js')),
  'شاشةُ البوابة تشتقّ معرّفَها من معرّف بوابتها');
ok(/id: `gate:\$\{gate\.id\}`/.test(read('progress.js')),
  'والرحلةُ تنشئه بالصيغة نفسِها — مصدرٌ واحد لا مصدران يفترقان');

console.log(fails ? `\n${fails} فشل` : '\nكل اختبارات عقد الرحلة ناجحة');
process.exit(fails ? 1 : 0);
