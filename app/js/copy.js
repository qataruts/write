// شاشةُ **الوصل والنسخ** — المرحلة ١٢ في `METHOD.md §٤`: «وصلُ حرفين فثلاثة · كلماتٌ
// من بنك اقرأ **يراها ويكتبها** (نسخ) · المسافةُ بين الكلمات والجلوسُ على السطر ·
// **علامات ق٣ في مواضعها**».
//
// **وحلقتُها ثلاثُ خطوات لا أربع** (خلافاً لحلقة الحرف في `METHOD.md §٥`): **شاهِدْ**
// (الكلمة تُرسم متحركةً من مسارها وتُسمَع بصوت بنك اقرأ) ← **تتبّعْ موجَّهاً** ←
// **اُكْتُبْهَا وحدَك**. والقياسُ `نسخ` في ليتنر **بوحدة الكلمة** (`WORD_FORM`)، فلا
// يظهر حرفٌ وهميّ في لوحة وليّ الأمر.
//
// ━━━ **ودرجةُ النسخ الحرّ** (الجلسة ح — ب١، `REVIEW_METHOD.md`) ━━━
//
// **العطبُ الذي وُلد منه**: كانت الخطوةُ الثالثة **تتبّعاً خافتاً** — فالمقيسُ باسم
// «النسخ» في الرحلة كلِّها تتبّعٌ موضعيّ: يدُ الطفل تمشي على خطٍّ مرسوم تحتها ولو
// خفَتَ. **ودرجةُ النسخ الحقيقية — نموذجٌ يُرى ولا يُتَّكأ عليه — كانت ساقطةً من سلّم
// الكلمة كلِّه**، فيقفز الطفلُ من التتبّع إلى الإملاء بلا الدرجة التي بينهما.
//
// **والعلاج**: الخطوةُ الثالثة **صندوقٌ فارغ ونموذجٌ فوقه** — يراه ولا يكتب عليه،
// ويحكم عليها `judgeFree` **بالشكل تامّاً لا بالأثر** (`pen.js`: «المهمُّ الشكلُ لا
// متابعةُ الخطّ المرسوم قبلاً»). **والجرعةُ كما هي**: خطوتان كاتبتان لكل كلمة، فعشرُ
// كتاباتٍ لعقدة الباقة — تبدّلت **درجةُ** الميل لا عددُه. **والخافتُ لم يُلغَ**: هو
// درجاتُ الخفوت في `fade.js` بمواضعها من تاريخ الطفل مع الكلمة.
//
// **وإنتاجُ الكلمة الحرّ النظيف غير المكشوف يُنضجها** (`progress.recordRead`): هو
// إنتاجٌ متباعدٌ حقيقيّ — كتابةٌ بلا نموذجٍ تحت اليد — فيدفع الكلمةَ في سلّمها إلى
// الإملاء (نظيرُ ما تفعله المراجعةُ في `review.js`، وحارسُ اليوم الواحد قائمٌ فيه).
//
// **والمسطرةُ من المسار نفسِه** («النموذجُ هو المقياس»، `METHOD.md §٣.٢`): سطرُ
// الكلمة (`line`) خرج من خيالها المُشكَّل ساعةَ التأليف، فيُرسَم تحتها خطُّ الكرّاسة
// حيث تجلس حقّاً — لا خطٌّ زينةٍ يُختار. وأسطرُ **المسافة بين الكلمات** كلمتان في
// لوحٍ واحد بينهما فراغُ المُشكِّل نفسِه.
//
// **وبطاقةُ العلامة تسبق أوّلَ كلمةٍ تحملها** (ق٣، وتفصيلُه محسوبٌ في `MARKS`): تُعرَض
// العلامةُ **مرسومةً من مسارها المؤلَّف** (`MARK_PATHS`) مع اسمها وكلمتها — بطاقةٌ
// قصيرة تُقرأ ثم تُغلَق بزرّ، ولا تتكرّر في المحطة الواحدة.
//
// **والسماحةُ تحملها الكلمةُ في مسارها** (`METHOD.md §٣.٥`): مقياسُ حروفها فيها،
// يُقاس ساعةَ التأليف ويُقرأ هنا — فما يحكم به المحرّكُ هو ما بُنيت عليه.
//
// 🔒 **ومن حملة مسار الطفل**: يمرّ بها حبرُه (تتلقّى أخطاءَه من المحرّك)، فتدخل
// حارسَ الخصوصية النصيّ في `tools/test_pen.mjs` — لا شبكةَ ولا رفعَ ولا عنوانَ خارجيّ.

import * as progress from './progress.js';
import { starsForReview } from './progress.js';
import * as audio from './audio.js';
import { WORDS, SPOKEN_WORDS, markInfo, PATHS } from './curriculum.js';
import { WORD_PATHS, MARK_PATHS } from './word_paths.js';
import { penSurface, refGlyph, MODES, FREE } from './pen.js';
// **وضعُ الدعم — شاشةُ اكتساب** (جلسة د): سماحةٌ موسَّعة في أوّل لقاءٍ بالكلمة،
// **ووسمُ العون يمضي إلى القياس** فلا يُحتسب الملقَّنُ إتقاناً.
import { easeFor, demoPace } from './support.js';
// **تعليمةُ الدرجة الحرّة من `fade.js` بنصّها المسجَّل** — لا نصَّ يُؤلَّف بلا صوت
import { SAY as FADE_SAY } from './fade.js';
import {
  h, fill, icon, go, arNum, starsRow, topbar, brandMark, mascot, cheer, faceEl,
  nodeTitle, traceFace, bare,
} from './ui.js';

/**
 * **تعليماتُ الشاشة المنطوقة** — الجديدُ المطلوب من الصوت وحدَه (`METHOD.md §٧`)،
 * ويمرّ من `tools/audio_queue.json` كسائره.
 */
export const SAY = {
  watch: 'شَاهِدْ كَيْفَ تُكْتَبْ',
  // **ألفُ الوصل عاريةٌ في كل نصٍّ منطوق** — بدأت حكماً في هاتين بأذن المالك
  // («اجعلها انسخها بدون ضمّ أوّلها»)، ثم أُجريت **قاعدةً لا حالةً** على المنطوق
  // كلِّه (١٣ أغسطس ٢٠٢٦): المولّدُ يقرأ ما يُكتب لا ما يُنطَق، فيَنطق ضمّةَ الوصل
  // حركةً مطوّلةً تأكل ثلثَ مدّة التعليمة. والقاعدةُ وقياسُها في
  // `docs/AUDIO_QUEUE.md`، ويحرسها بابُ `vowelledWasl` في `tools/check_speech.mjs`.
  // **والمفتاحُ من النصّ**، فللصورة الجديدة ملفُّها الجديد والسابقُ يُتقاعَد
  // بسجلّه (`--retire`) فلا يبقى يتيمٌ في البنك.
  // **ووزنُ «نسخ» مصحَّحٌ بأذن المالك** (١٣ أغسطس ٢٠٢٦): `نَسَخَ` مضارعُه `يَنْسَخُ`
  // بفتح العين — فأمرُه `انْسَخْ` بفتح السين، لا `انْسُخْ`. ويحرس الصنفَ
  // `waslHarakaFits` في `tools/check_speech.mjs`.
  guided: 'انْسَخْهَا عَلَى الْمَسَارْ',
  /**
   * **درجةُ النسخ الحرّ** (ب١): النموذجُ فوق اللوح والصندوقُ فارغ.
   *
   * 🔊 **والنصُّ مستعارٌ بعلّةٍ معلنة** (عقدُ الصوت في جلسة ح: «إن وُجد نصٌّ مسجَّل
   * مطابق فاستعمله، وإلا فالأقرب المسجَّل مؤقتاً بعلّة معلنة»): المطلوبُ لهذه الخطوة
   * «اُكْتُبْهَا وَحْدَكْ» — وليس في البنك إلا **مذكّرُها** (`اكْتُبْهُ وَحْدَكْ`،
   * لحرفٍ لا لكلمة)، ومؤنّثُه دَينٌ مقيَّدٌ في `docs/AUDIO_QUEUE.md`. فالمستعارُ
   * **تعليمةُ الدرجة صفر في محطة الخفوت** (`fade.js: SAY.copy`) — مسجَّلةٌ مراجَعةٌ
   * بالأذن، ومعناها هو المعنى بعينه: «اكتُبْها كما تراها» ونموذجُها يُرى فوق اللوح
   * ولا يُتَّكأ عليه. **ولا نسخةَ ثانية من النصّ هنا**: يُستورَد من مالكه.
   */
  free: FADE_SAY.copy,
  /**
   * **تعليمةُ الخطوة الخافتة — متقاعدةٌ عملاً، باقيةٌ إعلاناً** (ب١): رفعت الجلسةُ ح
   * الخطوةَ الخافتة من حلقة النسخ إلى درجاتها في `fade.js`، فلم يبقَ لهذا النصّ
   * ناطقٌ. **ويبقى في الإعلان حتى تُتقاعَد نسختُه في القائمة** (`queue_texts --retire`
   * في جلسة صوت): حارسُ «لا مدخلَ في القائمة بلا مستهلك» يقرأ الإعلانَ، ونزعُه اليومَ
   * يُحمِّر باباً على نصٍّ سليمٍ مسجَّل. والدَّينُ مقيَّدٌ في `docs/AUDIO_QUEUE.md`.
   */
  faint: 'انْسَخْهَا وَهْيَ خَافِتَةْ',
  space: 'كَلِمَتَانِ بَيْنَهُمَا فَرَاغْ',
  card: 'انْظُرِ الْعَلَامَةَ ثُمَّ اكْتُبْ',
};

/**
 * **ما تنطقه هذه الشاشةُ — مُعلَنٌ لا مضمَر** (بابُ الإعلان في `tools/check_speech.mjs`):
 * تعليماتُ الخطوات، **وكلماتُ المنهج المنطوقةُ في بنك اقرأ** — تُشتقّ من المادّة لا
 * تُكتب بيد، فكلمةٌ تدخل المنهجَ غداً تدخل الإعلانَ من نفسها وتُطالِب بصوتها.
 *
 * **وبطاقةُ العلامة لا تنطق اسمَها**: أسماءُ العلامات نصوصُ اقرأ ولا ملفَّ لها في
 * بنكه (قِيس: عشرةٌ بلا صوت) — وتوليدُها هنا يُدخِل في مسمع الطفل نطقاً لم يُراجَع
 * بالأذن. فالبطاقةُ تُسمِعه **تعليمتَها وكلمتَها الحاملة** (ولها ملفُّها المنسوخ)،
 * فيعرف العلامةَ بشكلها وموضعها من كلمةٍ يعرفها — واسمُها مكتوبٌ لمن يقرأ معه.
 */
export const SPOKEN = [...Object.values(SAY), ...SPOKEN_WORDS];

/**
 * خطواتُ حلقة النسخ — الكاتبتان منهما تكتبان `نسخ` في ليتنر.
 *
 * **والثالثةُ حرّةٌ منذ الجلسة ح** (ب١): نوعُها في ليتنر `نسخ` كأختها — فالمهارةُ
 * واحدةٌ (كلمةٌ × نسخ) وإنما ارتقت درجتُها، **ولا مفتاحَ ثالثٌ يشقّ صندوقَ الكلمة**.
 */
export const STEPS = [
  { id: 'watch', mode: MODES.GUIDED, title: 'شَاهِدْ', say: SAY.watch, kind: null },
  { id: 'guided', mode: MODES.GUIDED, title: 'اِنْسَخْ', say: SAY.guided, kind: progress.KINDS.COPY },
  { id: 'free', mode: MODES.FREE, title: 'وَحْدَكْ', say: SAY.free, kind: progress.KINDS.COPY },
];

/** عقدةُ الرحلة بجزئها — من الرحلة نفسِها، فلا يُكتب معرّفُ محطةٍ بيد. */
export const nodeOf = (part, stageId = null) => progress.allNodes()
  .find((node) => node.type === 'join' && node.part === part
    && (!stageId || node.stageId === stageId)) || null;

/**
 * **وحداتُ العقدة**: ما ينسخه الطفلُ فيها واحدةً بعد واحدة — ولكلٍّ مسارُها المرجعيّ
 * الذي يُعرَض ويُحكَم به معاً، وسطرُها، وسماحتُها، وصوتُها من بنك اقرأ.
 *
 * **وما لا مسارَ له يسقط ولا يُعرَض فارغاً** (`METHOD.md §٣.٨`)، ويحرس `check_paths.py`
 * ألّا يقع ذلك أصلاً.
 */
export function unitsOf(node) {
  if (!node) return [];
  const texts = [...(node.joins || []), ...(node.words || [])];
  const units = texts
    .map((text) => {
      const ref = WORD_PATHS[text];
      return ref && { text, ref, say: WORDS[text]?.say || null };
    })
    .filter(Boolean);
  // **وسطرُ المسافة يختم محطةَ الكلمات**: كلمتان في لوحٍ واحد — مادّةُ «المسافة بين
  // الكلمات» (`METHOD.md §٤`)، **وتُقرأ من المسارات لا تُكتب**: إن أُلّف مسارُ
  // «كلمةٌ كلمة» من كلمتَي هذه العقدة فهي وحدتُها الخاتمة، وإلا فلا سطرَ مسافةٍ فيها.
  const pair = units.length >= 2 ? `${units[0].text} ${units[1].text}` : null;
  if (pair && WORD_PATHS[pair]) {
    units.push({ text: pair, ref: WORD_PATHS[pair], say: null, space: true });
  }
  return units;
}

/** أعقدةُ نسخٍ جاهزةٌ مادّتُها؟ يقرؤها الموجّهُ فيجيب الطفلَ بدل أن يصمت. */
export const nodeReady = (node) => Boolean(node) && unitsOf(node).length > 0;

let live = null;

/** إطلاقُ اللوح عند مغادرة الشاشة — يناديها الموجّه مع كل رسمة. */
export function releaseCopy() {
  live?.destroy();
  live = null;
}

/** شاشةُ محطة الوصل والنسخ — بابُ الموجّه. */
export const renderCopy = (part, stageId = null) => renderNode(nodeOf(part, stageId));

/**
 * **بطاقةُ تعريف العلامة** (ق٣): تُعرَض قبل أوّل كلمةٍ تحملها في هذه العقدة —
 * العلامةُ مرسومةً **من مسارها المؤلَّف**، واسمُها من اقرأ، وكلمتُها.
 */
function markCard(mark, onClose) {
  const info = markInfo(mark);
  // **وما كان حرفاً تأخذه البطاقةُ من `PATHS`** (١٩ أغسطس ٢٠٢٦): بعد حكم المالك
  // «نؤجّل الشدّةَ والتنوين» لم يبقَ في البطاقات إلا **حروفٌ** (أ · ة · إ · ء)،
  // **وهي في `paths.js` بيد المالك** — فتُعرَض من مسارها الذي سيكتبه الطفلُ بعينه،
  // لا من شارةٍ مقيسةٍ على حدة. **فالبطاقةُ واللوحُ مسارٌ واحد** («النموذجُ هو المقياس»).
  const glyph = PATHS[mark]?.isolated || MARK_PATHS[mark];
  return h('div', { class: 'mark-card' },
    h('div', { class: 'mark-face' }, glyph ? refGlyph(glyph, 'ref-glyph mark-glyph') : mark),
    h('div', { class: 'mark-text' },
      h('h2', {}, info?.title || mark),
      h('p', { class: 'hint' }, info?.word ? `تجدها في «${info.word}»` : ''),
    ),
    h('button', { class: 'btn btn--primary next', onclick: onClose }, icon('pen'), ' اُكْتُبْ'),
  );
}

/**
 * **الشاشةُ الواحدة**: عقدةٌ بوحداتها، وكلُّ وحدةٍ بحلقتها الثلاثية.
 * @param {object} node عقدةُ الرحلة (`join`)
 * @returns {Node|null} `null` إن لم تكن عقدةَ نسخٍ أو لم تُؤلَّف مادّتُها
 */
export function renderNode(node) {
  const units = unitsOf(node);
  if (!units.length) return null;

  // `shown`: أكُشف النموذجُ في الخطوة الحرّة؟ (المخرجُ الكريم يعيده إلى التتبّع) —
  // فإنتاجٌ كُشف نموذجُه لا يُنضج الكلمةَ في سلّمها إلى الإملاء (ب١).
  const state = {
    unit: 0, index: 0, faults: 0, stepFaults: 0, done: false, shown: false, cards: new Set(),
  };
  /** آخرُ ما نطقته الشاشة — **وبه تنتظر الخطوةُ تمامَ الكلام** (قناة ٤ج) لا مهلةً. */
  let speech = Promise.resolve(false);
  let turn = 0;

  const dots = h('ol', { class: 'dots' });
  const strip = h('ol', { class: 'unit-strip unit-strip--words' });
  /**
   * **نموذجُ الدرجة الحرّة — يُرى فوق اللوح ولا يُتَّكأ عليه** (ب١): الكلمةُ مرسومةً
   * **من مسارها المرجعيّ نفسِه** (`refGlyph`) لا بخطّ نصّ — فما يراه هو ما يُحكَم به
   * (`METHOD.md §٣.٢`). ويسقط في سائر الخطوات: هناك النموذجُ في اللوح.
   */
  const model = h('div', { class: 'copy-model' });
  const board = h('div', { class: 'lesson-board' });
  const foot = h('div', { class: 'row foot' });
  const hint = h('p', { class: 'hint' });
  const title = h('h1', { class: 'lesson-title' }, nodeTitle(node));

  const screen = h('div', {},
    topbar(
      h('button', {
        class: 'btn btn--ghost',
        'aria-label': 'عودةٌ إلى الخريطة',
        onclick: () => go('#/'),
      }, '→ الخريطة'),
      h('span', { class: 'spacer' }),
      brandMark(),
    ),
  );

  /** **كلامُ التطبيق يصفّ في القناة** (`audio.js`): لا إسكاتَ قبله — والانتقالُ ينتظره. */
  const say = (...texts) => {
    const list = texts.filter(Boolean);
    if (!list.length) return speech;
    speech = list.length > 1 ? audio.playSequence(list) : audio.play(list[0]);
    return speech;
  };

  function paintDots() {
    dots.replaceChildren(...STEPS.map((step, i) => h('li', {
      class: `dot${!state.done && i === state.index ? ' dot--now' : ''}`
        + `${state.done || i < state.index ? ' dot--done' : ''}`,
      'aria-label': step.title,
    }, state.done || i < state.index ? '✓' : arNum(i + 1))));
  }

  /** شريطُ وحدات المحطة: الكلماتُ بنصّها بالترتيب — فيرى الطفلُ أين هو وكم بقي. */
  function paintStrip() {
    if (units.length < 2) return;
    strip.replaceChildren(...units.map((unit, i) => h('li', {
      class: `unit unit--word${i === state.unit && !state.done ? ' unit--now' : ''}`
        + `${state.done || i < state.unit ? ' unit--done' : ''}`,
      'aria-label': unit.text,
    }, bare(unit.text))));
  }

  /** العلاماتُ التي تُفتَح بطاقتُها عند هذه الوحدة ولم تُفتَح بعدُ في هذه الجلسة. */
  const cardsFor = (unit) => (node.marks || [])
    .filter((mark) => unit.text.includes(mark) && !state.cards.has(mark));

  /**
   * يبني لوحَ الخطوة الحالية — النموذجُ والحَكَمُ من `ref` واحد (`METHOD.md §٣.٢`).
   * **وخطوةُ «شاهِدْ» لا يُكتب عليها**: لوحُها عرضٌ، ولمسُه ينقل إلى النسخ.
   */
  function mount() {
    releaseCopy();
    const unit = units[state.unit];
    const step = STEPS[state.index];
    state.stepFaults = 0;
    // **النموذجُ فوق اللوح في الدرجة الحرّة وحدَها** — وفي غيرها اللوحُ يحمله،
    // **ويُفرَغ قبل كل شيء** فلا يبقى نموذجُ كلمةٍ سابقة فوق بطاقةِ علامةٍ أو ختام.
    model.replaceChildren(...(step.mode === MODES.FREE
      ? [refGlyph(unit.ref, 'ref-glyph copy-model-glyph')] : []));

    // بطاقةُ العلامة تسبق الكتابة — تُعرَض مرّةً واحدة ثم تُغلَق بيد الطفل
    const pending = state.index === 0 ? cardsFor(unit) : [];
    if (pending.length) {
      const mark = pending[0];
      state.cards.add(mark);
      hint.textContent = SAY.card;
      board.replaceChildren(markCard(mark, () => { audio.stop(); mount(); }));
      fill(foot);
      paintDots();
      paintStrip();
      // التعليمةُ ثم **كلمتُها الحاملة بصوت اقرأ** — لا اسمُ العلامة (لا ملفَّ له)
      say(SAY.card, WORDS[markInfo(mark)?.word]?.say);
      return;
    }

    hint.textContent = unit.space ? SAY.space : step.say;
    // **عونُ وضع الدعم يُقرَّر مرّةً هنا** (جلسة د): السماحةُ ووسمُ عونها من قرارٍ
    // واحد، وإذنُه أوّلُ لقاءٍ بالمهارة وحدَه — ومطفأً تعود سماحةُ المسار كما هي.
    const aid = easeFor(unit.ref.tolerance,
      step.kind ? progress.skillBox(unit.text, progress.WORD_FORM, step.kind) : 0);
    state.aided = aid.aided;
    const surface = penSurface({
      ref: unit.ref,
      mode: step.mode,
      // **سماحةُ الكلمة من مسارها** — مقياسُ حروفها فيها، لا سماحةُ حرفٍ يملأ صندوقه
      tolerance: aid.tolerance,
      pace: demoPace(),
      // **ومسطرةُ الكرّاسة سطرُ الكلمة نفسُه** — من الخيال المُشكَّل لا من زينة
      baseline: unit.ref.line,
      label: `لوحُ نسخ: ${unit.text}`,
      onFault: (fault) => {
        state.faults++;
        state.stepFaults++;
        // **وخطأُ الكلمة يُسجَّل بوحدتها** — لا بحرفٍ بعينه: الكلمةُ وحدةُ هذه المرحلة
        progress.recordFault(unit.text, fault.code);
      },
      /**
       * 🚪 **ولا انسدادَ في الدرجة الحرّة** (`METHOD.md §٥ب` — بلاغُ الميدان ٢):
       * تعثّرٌ متكرر يفتح المخرجَ الكريم بيد الطفل — كما في درس الحرف سواءً.
       */
      onStuck: () => wayOut(step, unit),
      onDone: () => finishStep(step, unit),
    });
    live = surface;
    board.replaceChildren(surface.el);
    board.classList.toggle('lesson-board--watch', step.id === 'watch');
    surface.play();
    if (step.id === 'watch') {
      surface.el.addEventListener('pointerdown', () => { audio.stop(); nextStep(); });
      say(unit.say, step.say);
    } else {
      surface.el.addEventListener('pointerdown', () => surface.stop(), { capture: true });
      say(unit.space ? SAY.space : step.say);
    }
    paintDots();
    paintStrip();
    paintFoot(step, unit);
  }

  /**
   * **القياسُ يكتب لكل خطوةٍ بمفتاحها** (`METHOD.md §٦`): وحدةُ النسخ **الكلمة**
   * ومحورُها `WORD_FORM` — فلا يظهر حرفٌ وهميّ في لوحة وليّ الأمر.
   *
   * **والنوعُ مكتوبٌ بعينه لا بمتغيّر**: `tools/test_measure.mjs` يقرأ هذا الملفَّ
   * نصّاً ليثبت أنّ المحطةَ تكتب ما أعلنته.
   */
  function score(step, unit, clean) {
    if (step.kind === progress.KINDS.COPY) {
      progress.recordAttempt(unit.text, progress.WORD_FORM, progress.KINDS.COPY, clean,
        progress.dayNumber(), state.aided);
    }
  }

  /**
   * 🚪 **المخرجُ الكريم في الدرجة الحرّة** (نظيرُ `lesson.js: wayOut` حرفاً): بعد
   * تعثّرٍ متكرر يفتح البابَ **بيده هو** — يعود إلى النسخ الموجَّه حيث النموذجُ
   * مرئيّ، أو يمضي. **ولا رسوبَ ولا حرمانَ نجمة**، والمضيُّ يكتب محاولةً غيرَ تامّة
   * فيعيدها ليتنر غداً — **فالمتروكُ مؤجَّلٌ لا مسقَط**.
   *
   * **والرؤيةُ تُعَدّ كشفاً**: من عاد إلى التتبّع لم يكتبها وحدَه، فلا تُنضج كلمتَه.
   */
  function wayOut(step, unit) {
    const back = STEPS.findIndex((s) => s.mode === MODES.GUIDED && s.kind);
    hint.textContent = 'خُذْ نَفَساً — تَتَبَّعْهَا مَرَّةً، أَوْ تَابِعْ';
    fill(foot,
      back >= 0 && h('button', {
        class: 'btn btn--primary next',
        onclick: () => { state.shown = true; state.index = back; mount(); },
      }, icon('pen'), ' تَتَبَّعْ مَرَّةً'),
      h('button', {
        class: `btn${back >= 0 ? '' : ' btn--primary'} next`,
        onclick: () => { score(step, unit, false); nextStep(); },
      }, 'تَابِعْ →'),
      h('button', { class: 'btn next', onclick: () => live?.reset() }, '↻ أعِدْ'),
    );
  }

  function finishStep(step, unit) {
    const clean = state.stepFaults === 0;
    score(step, unit, clean);
    // **وإنتاجٌ حرٌّ نظيفٌ غير مكشوفٍ يُنضج الكلمة** (ب١): كتابةٌ بلا نموذجٍ تحت اليد
    // إنتاجٌ متباعدٌ حقيقيّ — و`recordRead` يحرس التباعدَ بيومه فلا يزيد إلا مرّة.
    // **وسطرُ المسافة ليس كلمةً تنضج**: مادّتُه فراغُ المُشكِّل بين كلمتين، ولا صوتَ
    // له في البنك — فلا يدخل سلّماً غايتُه الإملاء.
    if (step.mode === MODES.FREE && clean && !state.shown && !unit.space) {
      progress.recordRead(unit.text);
    }
    nextStep();
  }

  async function nextStep() {
    const token = ++turn;
    await speech;                       // لا يُدهَس كلامٌ يُقال (قناةُ ٤ج)
    if (token !== turn) return;         // سبقتنا خطوةٌ أحدث
    if (state.index < STEPS.length - 1) {
      state.index++;
      mount();
      return;
    }
    if (state.unit < units.length - 1) {
      state.unit++;
      state.index = 0;
      state.shown = false;             // كلمةٌ جديدة: كشفُ سابقتها لا يُحاسَب عليها
      mount();
      return;
    }
    finish();
  }

  /** عددُ الخطوات الكاتبة في المحطة كلِّها — سقفُ الأخطاء الذي تُقاس عليه النجوم. */
  const writingSteps = units.length * STEPS.filter((s) => s.kind).length;

  function finish() {
    const trace = live?.ink() ?? [];
    releaseCopy();
    state.done = true;
    model.replaceChildren();          // الختامُ احتفالٌ لا لوحَ نسخٍ فوقه نموذج
    const stars = starsForReview(state.faults, writingSteps);
    progress.setStars(node.id, stars);
    paintDots();
    paintStrip();
    hint.textContent = '';
    board.classList.remove('lesson-board--watch');
    board.replaceChildren(h('div', { class: 'celebrate' },
      mascot('mascot mascot--cheer'),
      trace.length ? traceFace(trace) : faceEl(icon('link'), 'celebrate-face', 'div'),
      h('h2', {}, ...cheer('أَحْسَنْتَ')),
      starsRow(stars, 'big-stars'),
      h('p', { class: 'hint' }, `${nodeTitle(node)} — ${
        state.faults ? 'يدُك تتحسّن' : 'بلا خطأٍ واحد'}`),
    ));
    fill(foot, 
      h('button', { class: 'btn btn--primary next', onclick: () => go('#/') }, '→ الخريطة'),
      h('button', {
        class: 'btn next',
        onclick: () => {
          state.unit = 0;
          state.index = 0;
          state.faults = 0;
          state.done = false;
          state.shown = false;
          state.cards = new Set();
          mount();
        },
      }, '↻ أعِدِ الدرس'),
    );
  }

  /** أفعالُ الشاشة: تُبدَّل بالخطوة — وكلُّها أهدافُ لمسٍ ≥ ٦٤ بكسل (`DESIGN §٤`). */
  function paintFoot(step, unit) {
    if (step.id === 'watch') {
      fill(foot, 
        h('button', {
          class: 'btn btn--primary next',
          onclick: () => { audio.stop(); nextStep(); },
        }, icon('pen'), ' اِنْسَخْ'),
        // **وزرُّ الأذن يُسمِع الكلمةَ بصوت اقرأ** — يسقط في سطر المسافة (لا صوتَ له)
        unit.say && h('button', {
          class: 'btn next',
          // **نقرةُ الطفل تُسكت ثم تُشغّل** (عقدُ قناة ٤ج)
          onclick: () => { audio.stop(); speech = audio.play(unit.say); },
        }, icon('ear'), ' اسْمَعْ'),
        h('button', {
          class: 'btn next',
          onclick: () => { live?.reset(); live?.play(); },
        }, '↻ أعِدِ العَرْض'),
      );
      return;
    }
    // **وفي الدرجة الحرّة لا زرَّ «شاهِدْ» على اللوح**: نموذجُها فوقه ظاهرٌ لا يغيب،
    // وعرضُ اللوح فيها لا يُري شيئاً (`app.css: .pen-box--free`) — فوعدٌ لا يُوفى.
    // ويبقى زرُّ الأذن (الكلمةُ بصوت اقرأ) وزرُّ الإعادة، **وبابُ التتبّع يفتحه
    // المخرجُ الكريم** عند التعثّر لا نقرةً تُبطِل الدرجة.
    if (step.mode === MODES.FREE) {
      fill(foot,
        unit.say && h('button', {
          class: 'btn btn--primary next',
          onclick: () => { audio.stop(); speech = audio.play(unit.say); },
        }, icon('ear'), ' اسْمَعْ'),
        h('button', { class: 'btn next', onclick: () => live?.reset() }, '↻ أعِدْ'),
      );
      return;
    }
    fill(foot,
      h('button', {
        class: 'btn btn--primary next',
        onclick: () => { live?.reset(); live?.play(); },
      }, icon('pen'), ' شَاهِدْ'),
      h('button', { class: 'btn next', onclick: () => live?.reset() }, '↻ أعِدْ'),
    );
  }

  const main = h('main', { class: 'screen lesson-letter lesson-copy' },
    title, strip, dots, model, board, hint, foot);
  screen.append(main);
  mount();
  return screen;
}
