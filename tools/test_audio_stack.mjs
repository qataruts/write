// حارسُ «صوتٌ واحدٌ لا يتكدّس» (`app/js/audio.js`):
//   node tools/test_audio_stack.mjs
//
// **منقولٌ من اقرأ بحرّاسه** (`read@9220ab1`، وقيدُه في `docs/SEED.md`): بلاغُ طفلةٍ
// حقيقية (١١ أغسطس ٢٠٢٦) — النقرُ المتكرر السريع على صورةٍ ذات صوتٍ كان يُشغّل الصوتَ
// بعدد النقرات **بعضَه فوق بعض**. و`audio.js` عندنا نسخةٌ حرفيةٌ من المعطوبة، فالعيبُ
// عندنا بعينه. والعلّةُ مركّبة، وكلا شقّيها هنا:
//   ١) **البعث**: نقرةٌ أحدث تُوقف عنصرَ سابقتها فيرفض وعدُه، فيسقط في `catch`
//      إعادةِ المحاولة (المكتوبةِ لملفٍّ تأخّر لا لملفٍّ أُسكت عمداً) فيُبعَث الصوتُ
//      الموقوف فوق الجديد. الإصلاح: الإيقافُ المتعمَّد تسويةٌ هادئة (`_hush`).
//   ٢) **التتابع بلا إبطال**: `playSequence` كان يمضي إلى آخره ولو تجاوزته نقرةٌ
//      أحدث — تتابعان يتناوبان على أذن الطفل. الإصلاح: جيلُ تشغيلٍ (`epoch`)
//      يُبطل بقيّةَ المتجاوَز.
//
// الفحصُ سلوكيّ لا نصّيّ: عنصرُ صوتٍ مزيّف يسجّل ما أُنشئ وما أُوقف، ونحاكي به
// نقراتِ الطفل — فيُثبَت أن الناجيَ من كل سباقٍ صوتٌ واحد، وأن إعادةَ المحاولة
// بقيت لعطبها الحقيقيّ (ملفٌّ موجودٌ تعثّر تحميلُه).
//
// **ونصوصُ الفحص من مادّتنا لا مكتوبةً بيد** (خلافُ أصله في اقرأ، وهو الفرقُ الوحيد):
// ثلاثُ كلماتٍ تُقرأ من `curriculum.js` بمنطوقها — فمفاتيحُها مفاتيحُ بنكنا حقاً،
// ولا تدخل هذا المستودعَ كلماتُ تطبيقٍ آخر.
//
// ————— **وبعد الجلسة ٤ج: العهدُ نفسُه، ونقرةُ الطفل تُقال بحرفها** —————
//
// نُقلت في الجلسة ٤ج **قناةُ الصوت الواحدة** من احسب (`calc@ad59c56`): كلامُ التطبيق
// **يصفّ** في طابورٍ فيُسمَع تباعاً، ولا يُسقِط بعضُه بعضاً — لأنّ نداءين في اللحظة
// نفسِها هناك **جملتان مقصودتان لأذن الطفل**، وإسقاطُ إحداهما هو عينُ العطب المُبلَّغ
// («الصوت متراكب مقطوش»). فما عادت `play()` وحدَها تعني «انسَ ما قبلي».
//
// **وعهدُ هذا الحارس لم يتبدّل بحرف** — تبدّل **مَن يقوله**: نقرةُ الطفل تُسكت ثم
// تُشغّل (`stop()` ثم `play()`)، وهي كانت مضمرةً في `play()` فصارت مكتوبةً. والمشاهدُ
// الأربعة كما هي بأحكامها: **تعيش الأخيرة وحدها**، **ولا بعثَ للموقوف عمداً**،
// **وبقيّةُ التتابع المتجاوَز تُبطَل**، **وإعادةُ المحاولة باقيةٌ لعطبها الحقيقيّ**.
// وأُضيف مشهدٌ خامس يحرس الفرقَ نفسَه: **جملتان يقولهما التطبيق تُسمَعان كلتاهما** —
// فلو عاد الإسكاتُ المضمَر إلى `play()` غداً لَسقط هذا المشهد وحدَه ونجا ما قبله.

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

// ————— محاكاة بيئة المتصفح: عنصرُ صوتٍ يسجّل، وفهرسٌ من مفاتيح نصوصنا —————

class FakeAudio {
  static created = [];
  constructor(src) {
    this.src = src || '';
    this.paused = true;
    this.listeners = {};
    this._rejectPlay = null;
    FakeAudio.created.push(this);
  }
  addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
  removeEventListener() {}
  fire(name) { for (const fn of this.listeners[name] || []) fn(); }
  play() {
    this.paused = false;
    return new Promise((resolve, reject) => { this._rejectPlay = reject; });
  }
  pause() {
    this.paused = true;
    // كسفاري: إيقافٌ وتشغيلُ العنصر ما زال في طريقه ⇒ وعدُ play() يُرفَض AbortError
    if (this._rejectPlay) { const r = this._rejectPlay; this._rejectPlay = null; r(new Error('AbortError')); }
  }
  removeAttribute(name) { if (name === 'src') this.src = ''; }
  load() {}
}

globalThis.Audio = FakeAudio;
globalThis.window = {};                       // لا نطقَ آلياً في الفحص (speechSynthesis غائب)

const audio = await import('../app/js/audio.js');
const { play, playSequence, stop, keyFor } = audio;

const { WORDS } = await import('../app/js/curriculum.js');
const WORDS_SAID = [...new Set(Object.values(WORDS).map((w) => w.say))].slice(0, 3);
ok(WORDS_SAID.length === 3, `ثلاثُ كلماتٍ من بنكنا بمنطوقها: ${WORDS_SAID.join('، ')}`);

const manifest = Object.fromEntries(WORDS_SAID.map((w) => [keyFor(w), 1]));
globalThis.fetch = async (url) => (String(url).endsWith('manifest.json')
  ? { ok: true, json: async () => manifest }
  : { ok: false, status: 404 });

const settle = () => new Promise((r) => setTimeout(r, 0));
const playing = () => FakeAudio.created.filter((el) => !el.paused);
const srcOf = (el) => el.src || '';

// **نقرةُ الطفل بحرفها**: تُسكت القناةَ ثم تُشغّل — فما صُفّ قبلها يسقط عند دوره.
const tap = (text) => { stop(); return play(text); };

// ————— ١. نقرتان متسابقتان في اللحظة نفسها: تعيش الأخيرة وحدها —————

console.log('\n١. نقرتان في اللحظة نفسها');
FakeAudio.created = [];
const race1 = tap(WORDS_SAID[0]);
const race2 = tap(WORDS_SAID[1]);
await settle(); await settle(); await settle();
ok(FakeAudio.created.length === 1 && srcOf(FakeAudio.created[0]).includes(keyFor(WORDS_SAID[1])),
  'المتجاوَزة قبل أن تبدأ لا تُنشئ عنصراً أصلاً — تعيش الأخيرة وحدها');
ok((await race1) === false, 'ووعدُها يُسوّى بهدوء (false) لا يُترك معلَّقاً ولا يُرمى');
FakeAudio.created[0]?.fire('ended');
ok((await race2) === true, 'والأخيرةُ تُسمَع إلى آخرها');

// ————— ٢. نقرةٌ فوق صوتٍ يُسمَع: لا بعثَ للموقوف (عيبُ التكدّس نفسُه) —————

console.log('\n٢. نقرةٌ فوق صوتٍ يُسمَع');
FakeAudio.created = [];
const first = tap(WORDS_SAID[0]);
await settle(); await settle();
ok(FakeAudio.created.length === 1 && !FakeAudio.created[0].paused, 'الأولى تُسمَع');
const second = tap(WORDS_SAID[1]);
await settle(); await settle(); await settle();
ok((await first) === false, 'النقرةُ الأحدث تُسكِت الأولى تسويةً لا عطلاً');
ok(FakeAudio.created.length === 2,
  'ولا عنصرَ ثالثاً: الموقوفُ عمداً لا يسقط في إعادة المحاولة فيُبعَث فوق الجديد');
ok(playing().length === 1 && srcOf(playing()[0]).includes(keyFor(WORDS_SAID[1])),
  'الناجي صوتٌ واحد — صوتُ آخرِ نقرة');
playing()[0]?.fire('ended');   // `?` كي يُقرأ الإخفاقُ شكوى لا انهياراً
await second;

// ————— ٣. تتابعٌ تتجاوزه نقرة: بقيّتُه تُبطَل لا تُزاحم —————

console.log('\n٣. التتابعُ المتجاوَز');
FakeAudio.created = [];
const seq = playSequence([WORDS_SAID[0], WORDS_SAID[1]], 0);
await settle(); await settle();
ok(FakeAudio.created.length === 1, 'التتابع بدأ بأول نصوصه');
const over = tap(WORDS_SAID[2]);
await settle(); await settle(); await settle();
await seq;
ok(!FakeAudio.created.some((el) => srcOf(el).includes(keyFor(WORDS_SAID[1]))),
  'نقرةٌ أثناءه تُبطل بقيّته — لا يمضي التتابعُ المتجاوَز إلى نصّه التالي');
ok(playing().length === 1 && srcOf(playing()[0]).includes(keyFor(WORDS_SAID[2])),
  'والمسموعُ صوتُ النقرة وحدَه');
playing()[0]?.fire('ended');   // `?` كي يُقرأ الإخفاقُ شكوى لا انهياراً
await over;

// ————— ٤. إعادةُ المحاولة باقيةٌ لعطبها الحقيقيّ (لا يُضحّى بإصلاح ١٣ أغسطس) —————

console.log('\n٤. إعادةُ المحاولة للملفّ المتعثّر');
FakeAudio.created = [];
const retried = play(WORDS_SAID[0]);
await settle();
FakeAudio.created[0].fire('error');           // عطبُ تحميلٍ حقيقيّ لا إيقافٌ متعمَّد
await settle(); await settle();
ok(FakeAudio.created.length === 2 && srcOf(FakeAudio.created[1]).includes(keyFor(WORDS_SAID[0])),
  'ملفٌّ في الفهرس تعثّر: يُطلَب مرةً ثانية — الإصلاحُ لم يمسّ هذا');
FakeAudio.created[1].fire('ended');
ok((await retried) === true, 'والثانيةُ تُسمَع إلى آخرها');
stop();

// ————— ٥. **والفرقُ الذي حرسته الجلسة ٤ج**: كلامُ التطبيق يصفّ ولا يُسقِط بعضُه بعضاً —————
//
// المشاهدُ الأربعة أعلاه كلُّها **نقرةُ طفل**. وهذا نقيضُها: جملتان يقولهما التطبيقُ من
// تلقائه في اللحظة نفسِها (إعلانُ الخطوة وسؤالُ الشاشة — وهو نصُّ بلاغ احسب). فلو عاد
// الإسكاتُ المضمَر إلى `play()` غداً لَضاعت الأولى **وسقط هذا المشهدُ وحدَه** — وذاك
// موضعُه من الحراسة: يفرّق بين ما يجب أن يسقط وما يجب أن يُسمَع.

console.log('\n٥. جملتان يقولهما التطبيق: تُسمَعان تباعاً لا تُدهَس إحداهما');
FakeAudio.created = [];
const line1 = play(WORDS_SAID[0]);
const line2 = play(WORDS_SAID[1]);
await settle(); await settle(); await settle();
ok(FakeAudio.created.length === 1 && srcOf(FakeAudio.created[0]).includes(keyFor(WORDS_SAID[0])),
  'الأولى وحدَها في الجوّ — والثانيةُ تنتظر دورَها في الطابور (لا اثنان معاً)');
FakeAudio.created[0].fire('ended');
ok((await line1) === true, 'والأولى تُسمَع **تامّةً** لا مقطوشة');
await settle(); await settle(); await settle();
ok(FakeAudio.created.length === 2 && srcOf(FakeAudio.created[1]).includes(keyFor(WORDS_SAID[1])),
  'ثم تبدأ الثانيةُ بعد تمامها — كلتاهما مقصودةٌ لأذن الطفل فلا تُسقِطها الأولى');
FakeAudio.created[1].fire('ended');
ok((await line2) === true, 'وتُسمَع هي الأخرى تامّةً');
stop();

console.log(fails ? `\n${fails} فشل` : '\nكل اختبارات «صوتٌ واحدٌ لا يتكدّس» ناجحة');
process.exit(fails ? 1 : 0);
