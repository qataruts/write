// **حارسُ قناة الصوت الواحدة** — «لا صوتَ يخرج من التطبيق خارج القناة، ولا اثنان فيها معاً»:
//   node tools/check_speech.mjs              # الفحص على الشجرة الحيّة
//   node tools/check_speech.mjs --self-test  # فحصُ الفاحص: أيمسك المخالفات؟
//
// **منقولٌ من «احسب» بتكليف المالك** (`calc@ad59c56` — الجلسة ٤ج، وقيدُه في
// `docs/SEED.md §٨`): أوّلُ بلاغ ميدانٍ عندهم — «الصوت متراكب مقطوش، والبرنامج لا
// ينتظر الصوت فينتقل» — عاش تحت خمسةٍ وستين فحصاً أخضر، **لأنّ حرّاس البذرة (وهي
// بذرتُنا) يعدّون التشغيلات ولا يقيسون التعاقب**. والمنقولُ هنا **بابُهم السادس**
// («القناةُ واحدة») بشقّيه، نصّاً وعملاً:
//
//   • **نصّاً**: لا وحدةَ تُنشئ صوتاً أو تنطق بيدها — `new Audio` والنطقُ الآليّ في
//     `audio.js` وحدَه، وما سواه ينادي `audio.play` فيقف في الطابور. فمهما أُحكِمت
//     القناةُ، سطرٌ واحدٌ يشغّل عنصراً من خارجها يعيد العيبَ كما كان — **والامتناعُ
//     يُحرَس في المصدر لا يُترَك للانتباه**.
//   • **عملاً**: تُستدعى القناةُ في node بعنصرِ صوتٍ وهميّ يسجّل لحظتَي بدء كلِّ تشغيلٍ
//     وتمامِه، فيُثبَت ما لا يُثبته نصُّ المصدر: أنّ الثاني **لا يبدأ قبل أن يتمّ
//     الأول**، وأنّ وعدَ `play` **يتمّ بتمام الكلام** (به تنتظر الشاشةُ قبل أن تنتقل)،
//     وأنّ الإسكاتَ **يُفرغ الطابور ولا يعطّله**.
//
// وهو أخو الأحكام الزمنية في `tools/browser_test.html §٧`: تلك تقيس القناةَ في متصفّحٍ
// حقيقيّ بمؤقّتاته، وهذا يقيسها معزولةً — فينكشف العطبُ في أيّهما وقع.
//
// ————— **وأبوابُ القائمة الخمسة لم تُنقَل بعد** (`docs/SEED.md §٨`) —————
//
// عند احسب خمسةُ أبوابٍ قبل هذا: الإعلانُ (`SPOKEN`)، والقائمةُ (`audio_queue.json`)،
// والفئةُ تتبع الموضع، وقيدا المنهج، والشكلُ الكامل. وموضوعُها كلِّها **بروتوكولُ
// الصوت** (`docs/AUDIO_QUEUE.md`) — ولا نصَّ منطوقاً في «اُكْتُبْ» بعد، ولا
// `tools/audio_queue.json` على القرص أصلاً. فحدُّ الجلسة ٤ج بابُ القناة وحدَه.
//
// **والتعليقُ يُطالِب من نفسه** (نمطُ الجلسة ٠): يومَ تُنشأ قائمةُ الصوت أو تُعلن أوّلُ
// وحدةٍ `SPOKEN` — أيْ يومَ يصير للأبواب الخمسة موضوع — **يحمرّ هذا الفاحصُ مطالِباً
// بها** (§الأبواب المؤجَّلة أدناه)، بلا سطرٍ يُضاف ولا انتباهٍ يُرجى.

import { readFileSync, readdirSync, existsSync } from 'node:fs';

const APP = new URL('../app/js/', import.meta.url);
const QUEUE = new URL('./audio_queue.json', import.meta.url);

const read = (url) => readFileSync(url, 'utf8');
const files = readdirSync(APP).filter((f) => f.endsWith('.js')).sort();

// وحداتُ المنصة التي لا تنطق بطبعها (`audio.js` نفسُه محرّكُ النطق لا مصدرَ نصّ)
const ENGINE = new Set(['audio.js']);

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

// ————— القواعد: دوالُّ خالصة تُجرَّب سالباً —————

/**
 * **مقابضُ لوح الكتابة**: `penSurface()` تُرجع كائناً فيه `play()` — وهي **حركةُ رسمٍ
 * لا صوت** (`METHOD §٥.١`: «الرسم المتحرك من المسار المرجعي نفسِه»). وهذا فرقُ
 * «اُكْتُبْ» عن «احسب»: عندهم لا `.play()` إلا للصوت فحُرِّمت كلُّها، وعندنا لوحٌ
 * يُشغَّل عرضُه بالاسم نفسِه.
 *
 * **فلا تُكتب أسماءُ المقابض في الفاحص — تُشتقّ من الملفّ**: كلُّ ما أُسنِد إليه
 * `penSurface(` مقبضٌ، وما أُسنِد إليه مقبضٌ مقبض. وقائمةٌ مكتوبةٌ هنا تشيخ بأوّل مقبضٍ
 * يُسمّى باسمٍ آخر — **إمّا بأن يمرّ صوتٌ حقيقيّ باسمها، أو بأن يحمرّ لوحٌ بريء**.
 */
export function surfaceHandles(src) {
  const names = new Set();
  const text = String(src);
  // `const surface = penSurface({…})` — والمقبضُ الأصل
  for (const m of text.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*penSurface\s*\(/g)) {
    names.add(m[1]);
  }
  // `live = surface;` — ما أُسنِد إليه مقبضٌ مقبضٌ مثلُه (بجولاتٍ حتى يستقرّ)
  for (let round = 0; round < 4; round++) {
    const before = names.size;
    for (const m of text.matchAll(/([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\s*;/g)) {
      if (names.has(m[2])) names.add(m[1]);
    }
    if (names.size === before) break;
  }
  return names;
}

/**
 * **القناةُ واحدة**: ما يشغّل صوتاً بيده خارج `audio.js`.
 *
 * علّتُه من ميدان احسب (`calc/docs/FIELD.md §١`): صوتان يعملان معاً. ومهما أُحكِم
 * الطابورُ في القناة، فسطرٌ واحدٌ يشغّل عنصراً من خارجها يعيد العيبَ كما كان.
 */
export function outsideChannel(src) {
  const text = String(src);
  const hits = [];
  const rules = [
    [/\bnew\s+Audio\s*\(/, 'new Audio'],
    [/createElement\s*\(\s*['"]audio['"]/, "createElement('audio')"],
    [/\bspeechSynthesis\b/, 'speechSynthesis'],
    [/\bSpeechSynthesisUtterance\b/, 'SpeechSynthesisUtterance'],
    [/\b(?:webkit)?AudioContext\b/, 'AudioContext'],
  ];
  for (const [re, what] of rules) if (re.test(text)) hits.push(what);

  // **و`.play()` على غير مقبضِ لوح**: عنصرُ وسائطٍ يُشغَّل بيده
  const handles = surfaceHandles(text);
  for (const m of text.matchAll(/([A-Za-z_$][\w$]*)\s*\??\.\s*play\s*\(/g)) {
    if (m[1] === 'audio' || handles.has(m[1])) continue;   // `audio.play` بابُ القناة
    hits.push(`عنصرٌ يُشغَّل بيده (\`${m[1]}.play()\`)`);
  }
  return hits;
}

// ————— جردُ الشجرة —————

/** الوحداتُ التي تنطق فعلاً: تستورد `audio.js` وتنادي `play` عليها. */
function speakers() {
  const out = [];
  for (const file of files) {
    if (ENGINE.has(file)) continue;
    const src = read(new URL(file, APP));
    if (/\baudio\s*\.\s*play(?:Sequence)?\s*\(/.test(src)) out.push(file);
  }
  return out;
}

/** الوحداتُ التي تُعلن نصوصَها المنطوقة (`export const SPOKEN`) — بابُ الأبواب الخمسة. */
function declarers() {
  return files.filter((f) => !ENGINE.has(f)
    && /export\s+const\s+SPOKEN\b/.test(read(new URL(f, APP))));
}

async function main() {
  console.log('\n— القناةُ واحدة نصّاً: لا صوتَ يُشغَّل خارجها —');
  const stray = files.filter((f) => !ENGINE.has(f))
    .map((f) => [f, outsideChannel(read(new URL(f, APP)))])
    .filter(([, hits]) => hits.length);
  ok(stray.length === 0,
    `${files.length - ENGINE.size} وحدةً تنطق عبر \`audio.play\` وحدَها (لا عنصرَ صوتٍ بيدها)`
    + (stray.length ? ` — **خارج القناة: ${stray
      .map(([f, hits]) => `${f} (${hits.join('، ')})`).join(' · ')}**` : ''));

  const said = speakers();
  console.log(said.length
    ? `  · وحداتٌ تنطق اليوم: ${said.join('، ')}`
    : '  · ولا وحدةَ تنطق بعد (أوّلُ شاشةٍ ناطقة في الجلسة ٥) — والبابُ قائمٌ يحرس الغياب');

  console.log('\n— القناةُ واحدة عملاً: الثاني لا يبدأ قبل أن يتمّ الأول —');
  await channelGate();

  console.log('\n— الأبوابُ المؤجَّلة: تُطالِب من نفسها —');
  const spoken = declarers();
  const hasQueue = existsSync(QUEUE);
  ok(!hasQueue && !spoken.length,
    hasQueue || spoken.length
      ? `**آنَ نقلُ أبواب القائمة الخمسة من \`calc@ad59c56\`** (الإعلان · القائمة · `
        + `الفئةُ تتبع الموضع · قيدا المنهج · الشكلُ الكامل) — `
        + `${hasQueue ? '`tools/audio_queue.json` على القرص' : ''}`
        + `${hasQueue && spoken.length ? '، و' : ''}`
        + `${spoken.length ? `وحداتٌ تُعلن \`SPOKEN\`: ${spoken.join('، ')}` : ''}`
      : 'لا قائمةَ صوتٍ ولا وحدةَ تُعلن `SPOKEN` بعد — فأبوابُ البروتوكول الخمسة'
        + ' مؤجَّلةٌ بقيدها في `docs/SEED.md §٨`، وتُطالِب يومَ يصير لها موضوع');

  console.log(fails
    ? `\n${fails} فشل`
    : '\nقناةُ الصوت واحدة: لا صوتَ خارجها، ولا اثنان فيها معاً');
  return fails ? 1 : 0;
}

/**
 * **القناةُ تُقاس عملاً**: تُشغَّل في node بعنصرِ صوتٍ وهميّ يسجّل لحظتَي بدئه وتمامه.
 *
 * وأربعةُ أحكام — ثلاثةٌ من بلاغ احسب، والرابعُ ائتلافُ الطابور مع جيل ٤ب.
 */
async function channelGate() {
  const plays = [];
  const DEFAULT_MS = 60;
  /* **ومدّتان مختلفتان لجملتين** — وهو أخصُّ ما في هذا الفحص: من انتظر **مهلةً ثابتة**
     بدل `ended` يوافق مدّةً ويخالف الأخرى، فينكشف بأنّ وعدَه يعود **قبل** تمام الجملة
     الطويلة. ومدّةٌ واحدة تستره: يكفيه أن تكون مهلتُه أطولَ منها. (درسُ احسب: الحارسُ
     الذي لا يُحمرّه العطبُ الذي وُلد منه ليس حارساً.) */
  const MS = new Map();   // مفتاحُ الملفّ ← مدّتُه بالمللي (تُملأ بعد الاستيراد)
  globalThis.window = globalThis.window || {};
  globalThis.Audio = class {
    constructor(src) {
      this.src = src;
      this.on = {};
      this.ms = MS.get((String(src).split('/').pop() || '').replace('.mp3', '')) ?? DEFAULT_MS;
    }
    addEventListener(type, fn) { this.on[type] = fn; }
    removeAttribute() { this.src = ''; }
    load() {}
    pause() { this.close(); }
    close() {
      if (this.row && this.row.t1 === Infinity) {
        this.row.t1 = performance.now();
        clearTimeout(this.timer);
      }
    }
    play() {
      this.row = { key: this.src, ms: this.ms, t0: performance.now(), t1: Infinity };
      plays.push(this.row);
      this.timer = setTimeout(() => { this.close(); this.on.ended?.(); }, this.ms);
      return Promise.resolve();
    }
  };
  // بلا فهرسٍ ولا بيانِ بصمات: `known === null` فيُجرَّب الملفّ — وهو ما يُقاس هنا
  globalThis.fetch = async () => ({ ok: false, status: 404 });

  const audio = await import(new URL('audio.js', APP));
  MS.set(audio.keyFor('أَلِفْ'), 40);
  MS.set(audio.keyFor('بَاءْ'), 260);
  MS.set(audio.keyFor('جِيمْ'), 180);
  const overlapped = (from = 0) => plays.filter((r, i) => i > 0 && r.t0 >= from
    && plays[i - 1].t1 !== Infinity && r.t0 < plays[i - 1].t1 - 1).length;
  /** أسُمعت الجملةُ إلى آخر مدّتها؟ (لا مقطوشة) */
  const whole = (r) => r && Number.isFinite(r.t1) && r.t1 - r.t0 >= r.ms * 0.9;

  // ١) نداءان في اللحظة نفسِها — وهو عينُ ما وقع في ميدان احسب (إعلانُ الخطوة وسؤالُ الشاشة)
  const first = audio.play('أَلِفْ').then((h) => ({ h, at: performance.now() }));
  const second = audio.play('بَاءْ').then((h) => ({ h, at: performance.now() }));
  ok(typeof first?.then === 'function' && typeof second?.then === 'function',
    '`play` تُرجِع وعدَ القناة ولا تبتلعه');
  const heard = await Promise.all([first, second]);
  ok(plays.length === 2 && !overlapped(),
    `ونداءان في اللحظة نفسِها يُسمَعان **بالتتابع لا معاً** (${plays.length} تشغيلاً`
    + `${plays.length === 2 ? `، فاصلُهما ${Math.round(plays[1].t0 - plays[0].t1)}ms` : ''})`);
  ok(plays.length === 2 && heard.every((x) => x.h === true) && plays.every(whole),
    `وكلٌّ يُسمَع **إلى آخر مدّته** (${plays.map((r) => `${Math.round(r.t1 - r.t0)}/${r.ms}`).join(' · ')}ms)`
    + ' — لا وعدَ معلَّقٌ يجمّد القناة، ولا جملةَ تُدهَس');
  // (والحسابُ يحتمل غيابَ الصفّ كي يُقرأ الإخفاقُ شكوى لا انهياراً)
  ok(plays.length === 2 && heard.every((x, i) => x.at >= plays[i].t1 - 1),
    'ووعدُ كلٍّ يعود **بعد تمام جملته هو** — ومدّتان مختلفتان تفضحان المهلةَ الثابتة'
    + ` (${heard.map((x, i) => (plays[i] ? `${Math.round(x.at - plays[i].t1)}ms` : 'بلا تشغيل'))
      .join(' · ')} بعد التمام)`);

  // ٢) الوعدُ يتمّ **بتمام الكلام** — به تنتظر الشاشةُ قبل أن تنتقل
  const before = plays.length;
  const t0 = performance.now();
  await audio.play('جِيمْ');
  const moved = performance.now();
  const row = plays[before];
  ok(whole(row) && moved >= row.t1,
    `ووعدُ \`play\` يتمّ **بتمام الكلام**: سُمع ${row ? Math.round(row.t1 - row.t0) : '؟'}ms `
    + `من ${row ? row.ms : '؟'}، وعاد الوعدُ بعد تمامه (لا بعد مهلةٍ ثابتة — ${Math.round(moved - t0)}ms جملةً)`);

  // ٣) الإسكاتُ يُفرغ الطابور ولا يعطّله (نقرةُ الطفل الناقلة)
  const mark = plays.length;
  const dropped = [audio.play('دَالْ'), audio.play('هَاءْ')];
  audio.stop();
  await Promise.all(dropped);
  ok(plays.length === mark,
    `والإسكاتُ **يُفرغ الطابور**: ما صُفّ قبله لا يُشغَّل بعده `
    + `(${plays.length - mark} تشغيلاً بعد الإسكات)`);
  await audio.play('وَاوْ');
  ok(plays.length === mark + 1, 'والقناةُ تعمل بعد الإسكات (إفراغٌ لا تعطيل)');

  // ٤) **الطابورُ والجيلُ يأتلفان** — عهدُ ٤ب مؤدّىً بالطابور:
  //    نقرتان متسابقتان (كلٌّ تُسكت ثم تُشغّل) ⇒ تعيش الأخيرة وحدها؛
  //    وتتابعٌ تتجاوزه نقرةٌ ⇒ بقيّتُه تسقط ولا تُكمِل فوق الشاشة الجديدة.
  const tap = plays.length;
  audio.stop(); const tap1 = audio.play('زَايْ');
  audio.stop(); const tap2 = audio.play('سِينْ');
  await Promise.all([tap1, tap2]);
  ok(plays.length === tap + 1 && String(plays[tap].key).includes(audio.keyFor('سِينْ')),
    `ونقرتان متسابقتان (\`stop\` ثم \`play\`) **تعيش الأخيرة وحدها** `
    + `(${plays.length - tap} تشغيلاً) — عهدُ ٤ب بالطابور لا بسباق إسكات`);

  const seqAt = plays.length;
  const seq = audio.playSequence(['شِينْ', 'صَادْ', 'ضَادْ'], 0);
  await new Promise((r) => setTimeout(r, DEFAULT_MS / 2));
  audio.stop();
  await seq;
  await new Promise((r) => setTimeout(r, DEFAULT_MS * 3));
  ok(plays.length - seqAt <= 1,
    `وتتابعٌ تتجاوزه نقرةٌ **تسقط بقيّتُه** ولا يُكمِل فوق الشاشة الجديدة `
    + `(${plays.length - seqAt} من ثلاثة)`);
  ok(overlapped() === 0,
    `ولا لحظةَ في الفحص كلِّه يعمل فيها صوتان معاً (${plays.length} تشغيلاً مقيساً)`);
}

// ————— فحصُ الفاحص: **مُجرَّبٌ سالباً** —————

function selfTest() {
  let bad = 0;
  const check = (cond, msg) => { if (cond) console.log('  ✓', msg); else { bad++; console.log('  ✗', msg); } };

  console.log('\n— القناةُ واحدة: ما شغّل صوتاً بيده يُمسَك —');
  check(outsideChannel('await audio.play(t); await audio.playSequence(xs);').length === 0,
    'وحدةٌ تنطق عبر القناة تمرّ');
  check(outsideChannel('const el = new Audio(src); el.play();').length === 2,
    '**وعنصرُ صوتٍ يُنشَأ ويُشغَّل خارجها يُمسَك** (وهو ما يعيد التراكب مهما أُحكم الطابور)');
  check(outsideChannel('window.speechSynthesis.cancel();').length === 1,
    'ونطقٌ آليّ من خارج المحرّك يُمسَك');
  check(outsideChannel('new SpeechSynthesisUtterance(t)').length === 1, 'ومعه لسانُه');
  check(outsideChannel("const a = document.createElement('audio'); a.src = u;").length === 1,
    'وعنصرٌ يُصنَع بغير `new Audio` يُمسَك كذلك');
  check(outsideChannel('const ctx = new AudioContext();').length === 1, 'ومحرّكُ الصوت الخام');

  console.log('\n— ولوحُ الكتابة لا يُظلَم: `.play()` عليه حركةٌ لا صوت —');
  const board = 'const surface = penSurface({ ref }); surface.play(); live = surface; live?.play();';
  check(outsideChannel(board).length === 0,
    'مقبضُ `penSurface` وما أُسنِد إليه يمرّان (عرضٌ متحرك لا صوت)');
  check(surfaceHandles(board).has('surface') && surfaceHandles(board).has('live'),
    'والمقابضُ **مشتقّةٌ من الملفّ** لا مكتوبةً في الفاحص (`surface` ثم `live`)');
  check(outsideChannel('const el = document.querySelector("x"); el.play();').length === 1,
    '**وعنصرٌ ليس مقبضَ لوحٍ يُمسَك** — فالرخصةُ للوح لا لكل `.play()`');
  check(surfaceHandles('const surface = penSurface({}); const other = surface;').has('other'),
    'والإسنادُ المتسلسل يُتبَع (مقبضٌ من مقبض)');
  check(!surfaceHandles('const el = new Audio(u); const b = el;').has('b'),
    'وما ليس من `penSurface` لا يصير مقبضاً بالإسناد');

  console.log(bad ? `\n${bad} فشل` : '\n✓ الفاحص يمسك المخالفات كلها');
  return bad ? 1 : 0;
}

process.exit(process.argv.includes('--self-test') ? selfTest() : await main());
