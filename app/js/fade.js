// شاشةُ **خفوت النموذج ← الإملاء** — المرحلة ١٣ في `METHOD.md §٤`: «الكلمةُ كاملةً
// ← تخفى أجزاؤها تدريجياً بأدائه المتباعد (٣ إصاباتٍ متباعدة تُخفي درجةً، والكشفُ
// تراجعٌ — عينُ عدّاد الخفوت) ← إملاءٌ سماعيّ صرف بصوت اقرأ».
//
// **ودرجةُ الخفوت ليست حالَ الشاشة بل تاريخَ الطفل مع الكلمة**: تُقرأ من عدّاد
// `progress.reads` (كُتب في الجلسة ٥ لهذا اليوم) — فكلمةٌ أتقنها الطفلُ متباعداً
// تُعرَض عليه أخفتَ من كلمةٍ لقيها اليوم، **ولا خفوتَ جماعيّ اعتباطيّ**. ولذلك
// **لا تُحفَظ درجةٌ في مكان**: هي حاصلُ قسمةٍ يُعاد حسابُها من العدّاد كلَّ مرة.
//
// **والحلقةُ خطوةٌ واحدة لكل كلمة**: تُسمَع الكلمةُ ويُعرَض ما بقي من نموذجها ثم
// يكتبها — لا «شاهِدْ» منفصلة، إذ **الرؤيةُ نفسُها هي ما يخفت**، فخطوةُ عرضٍ كاملةٍ
// قبل الكتابة تُبطِل الخفوتَ من بابه. والدرجةُ الأخيرة **لا نموذجَ فيها ألبتّة**:
// صندوقٌ فارغ بسطر ارتكاز، والكلمةُ تُسمَع بصوت اقرأ الذي تعلّمتها به الطفلة.
//
// **والكشفُ حقٌّ لا عقوبة** (`METHOD.md §٣.٤`: الإخفاقُ إرشادٌ لا رفض): زرُّ «أرِنِي»
// يردّ النموذجَ كاملاً في هذه المحاولة، **وثمنُه درجةٌ واحدة إلى الوراء** لا تصفير —
// فالكلمةُ التي احتاج إلى رؤيتها لم تنضج بعدُ للعري (`progress.revealRead`).
//
// **والقياسُ نوعان بمفتاحٍ واحد** (`METHOD.md §٦`): ما دام في اللوح نموذجٌ يُرى فهو
// `نسخ`، وإذا غاب كلُّه فهو `إملاء` — وعدّادُ الخفوت نفسُه هو الذي يفصل بينهما، فلا
// حالةَ ثانية تُخزَّن ولا سطرَ يُكتب بيد.
//
// 🔒 **ومن حملة مسار الطفل**: يمرّ بها حبرُه، فتدخل حارسَ الخصوصية النصيّ في
// `tools/test_pen.mjs` — لا شبكةَ ولا رفعَ ولا عنوانَ خارجيّ.

import * as progress from './progress.js';
import { starsForReview } from './progress.js';
import * as audio from './audio.js';
import { WORDS, SPOKEN_WORDS } from './curriculum.js';
import { WORD_PATHS } from './word_paths.js';
import { penSurface, partsOf, MODES } from './pen.js';
// **وضعُ الدعم — شاشةُ اكتساب** (جلسة د): سماحةٌ موسَّعة في أوّل لقاءٍ بالمهارة،
// **ووسمُ العون يمضي إلى القياس** فلا يُحتسب الملقَّنُ إتقاناً.
import { easeFor, demoPace } from './support.js';
import {
  h, fill, icon, go, arNum, starsRow, topbar, brandMark, mascot, cheer, faceEl,
  nodeTitle, traceFace,
} from './ui.js';

/**
 * **تعليماتُ الشاشة المنطوقة** — الجديدُ المطلوب من الصوت وحدَه (`METHOD.md §٧`)،
 * ويمرّ من `tools/audio_queue.json` كسائره.
 */
export const SAY = {
  // **وألفُ الوصل عاريةٌ** — قاعدةُ المنطوق كلِّه بقياسها في `docs/AUDIO_QUEUE.md`،
  // ويحرسها `vowelledWasl` في `tools/check_speech.mjs`.
  copy: 'اكْتُبْهَا كَمَا تَرَاهَا',
  fading: 'تَذَكَّرِ الْغَائِبَ وَاكْتُبْ',
  dictate: 'اسْتَمِعْ ثُمَّ اكْتُبْهَا',
};

/**
 * **ما تنطقه هذه الشاشةُ — مُعلَنٌ لا مضمَر** (بابُ الإعلان في `tools/check_speech.mjs`):
 * تعليماتُ الخطوات، **وكلماتُ المنهج المنطوقةُ في بنك اقرأ** — تُشتقّ من المادّة لا
 * تُكتب بيد. وأصواتُ الإملاء **ملفاتُ اقرأ بأعيانها** (`SEED.md §١١`)، فالكلمةُ
 * تُسمَع بالصوت الذي تعلّمها به الطفلُ قراءةً.
 */
export const SPOKEN = [...Object.values(SAY), ...SPOKEN_WORDS];

/** إصابةٌ **متباعدة** واحدةٌ تُخفي درجةً — نصُّ `METHOD.md §٤ب` بعينه (حكمُ الميزان بقياس `test_dictation_path`، ١٥ أغسطس ٢٠٢٦). */
export const HITS_PER_STEP = 1;

/**
 * **درجاتُ الخفوت**: كاملٌ ← ثلثاه ← ثلثه ← لا نموذج. والأخيرةُ هي الإملاء السماعيّ
 * الصرف، فالدرجاتُ الأربعُ رحلةُ الكلمة الواحدة من النسخ إلى الإملاء.
 */
export const VEIL_STEPS = 3;

/** درجةُ خفوت كلمةٍ من تاريخ الطفل معها — لا من حال الشاشة. */
export const levelOf = (text) =>
  Math.min(VEIL_STEPS, Math.floor(progress.readCount(progress.wordKey(text)) / HITS_PER_STEP));

/**
 * **كم جزءاً يُحجَب في هذه الدرجة**: نسبةُ الدرجة من درجاتها مضروبةً في عدد أجزاء
 * الكلمة — **محسوبٌ من المسار لا مكتوبٌ بيد**، فكلمةٌ أجزاؤها ثلاثةَ عشرَ تخفت
 * بمقدارها وكلمةٌ أجزاؤها أربعةٌ بمقدارها. والحجبُ **من آخر الأجزاء**: النقاطُ
 * والعلاماتُ أوّلاً ثم الجسمُ من مؤخّرته، ويبقى مبدأُ الكلمة مرئياً.
 */
export function veilOf(ref, level) {
  if (level <= 0) return 0;
  const parts = partsOf(ref).length;
  return level >= VEIL_STEPS ? parts : Math.round((parts * level) / VEIL_STEPS);
}

/** نمطُ اللوح في هذه الدرجة: كاملٌ ثم خافتٌ ثم صندوقٌ فارغ (`METHOD.md §٥`). */
export const modeOf = (level) => (level >= VEIL_STEPS ? MODES.FREE
  : level > 0 ? MODES.FAINT : MODES.GUIDED);

/** نوعُ القياس في هذه الدرجة (`METHOD.md §٦`): نموذجٌ يُرى ⇐ نسخ، وغيابُه ⇐ إملاء. */
export const kindOf = (level) => (level >= VEIL_STEPS
  ? progress.KINDS.DICTATE : progress.KINDS.COPY);

/** تعليمةُ الدرجة المنطوقة والمكتوبة. */
export const sayOf = (level) => (level >= VEIL_STEPS ? SAY.dictate
  : level > 0 ? SAY.fading : SAY.copy);

/** عقدةُ الرحلة بجزئها — من الرحلة نفسِها، فلا يُكتب معرّفُ محطةٍ بيد. */
export const nodeOf = (part, stageId = null) => progress.allNodes()
  .find((node) => node.type === 'fade' && node.part === part
    && (!stageId || node.stageId === stageId)) || null;

/**
 * **وحداتُ العقدة**: كلماتُها التي أُلّف مسارُها، ولكلٍّ صوتُها من بنك اقرأ.
 *
 * **ولا إملاءَ بلا صوت** (`METHOD.md §٧`، ويفرضه `check_writable.py` على المادّة):
 * كلمةٌ بلا `say` لا تبلغ درجةَ الإملاء أصلاً — وحارسُ المادّة يمنع أن تدخل المحطةَ.
 */
export function unitsOf(node) {
  if (!node) return [];
  return (node.words || [])
    .map((text) => {
      const ref = WORD_PATHS[text];
      return ref && { text, ref, say: WORDS[text]?.say || null };
    })
    .filter(Boolean);
}

/** أعقدةُ خفوتٍ جاهزةٌ مادّتُها؟ يقرؤها الموجّهُ فيجيب الطفلَ بدل أن يصمت. */
export const nodeReady = (node) => Boolean(node) && unitsOf(node).length > 0;

let live = null;

/** إطلاقُ اللوح عند مغادرة الشاشة — يناديها الموجّه مع كل رسمة. */
export function releaseFade() {
  live?.destroy();
  live = null;
}

/** شاشةُ محطة الخفوت — بابُ الموجّه. */
export const renderFade = (part, stageId = null) => renderNode(nodeOf(part, stageId));

/**
 * **الشاشةُ الواحدة**: عقدةٌ بكلماتها، لكلِّ كلمةٍ لوحٌ بدرجة خفوتها.
 * @param {object} node عقدةُ الرحلة (`fade`)
 * @returns {Node|null} `null` إن لم تكن عقدةَ خفوتٍ أو لم تُؤلَّف مادّتُها
 */
export function renderNode(node) {
  const units = unitsOf(node);
  if (!units.length) return null;

  const state = { unit: 0, faults: 0, stepFaults: 0, done: false, revealed: false };
  /** آخرُ ما نطقته الشاشة — **وبه ينتظر الانتقالُ تمامَ الكلام** (قناة ٤ج) لا مهلةً. */
  let speech = Promise.resolve(false);
  let turn = 0;

  const strip = h('ol', { class: 'unit-strip unit-strip--words' });
  const board = h('div', { class: 'lesson-board' });
  const foot = h('div', { class: 'row foot' });
  const hint = h('p', { class: 'hint' });
  const veilBar = h('p', { class: 'note veil-note' });
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

  /** شريطُ وحدات المحطة: الكلماتُ بنصّها — **ونصُّ المخفوتة يخفت معها** فيرى الطفل. */
  function paintStrip() {
    strip.replaceChildren(...units.map((unit, i) => {
      const level = levelOf(unit.text);
      return h('li', {
        class: `unit unit--word${i === state.unit && !state.done ? ' unit--now' : ''}`
          + `${state.done || i < state.unit ? ' unit--done' : ''}`
          + (level >= VEIL_STEPS ? ' unit--hushed' : ''),
        'aria-label': unit.text,
      }, level >= VEIL_STEPS ? icon('ear') : unit.text);
    }));
  }

  /** سطرُ الدرجة لمن يقرأ مع الطفل: أين هو من رحلة الكلمة إلى الإملاء. */
  function paintVeil(level) {
    veilBar.replaceChildren(
      h('span', {}, `النموذج: ${arNum(VEIL_STEPS - level)} من ${arNum(VEIL_STEPS)}`),
      h('span', { class: 'veil-dots' }, ...Array.from({ length: VEIL_STEPS + 1 }, (_, i) =>
        h('i', { class: `veil-dot${i <= level ? ' veil-dot--gone' : ''}` }))),
    );
  }

  /** يبني لوحَ الكلمة الحالية بدرجة خفوتها — والحَكَمُ من `ref` نفسِه لا من المرئيّ. */
  function mount() {
    releaseFade();
    const unit = units[state.unit];
    const level = state.revealed ? 0 : levelOf(unit.text);
    state.stepFaults = 0;

    hint.textContent = sayOf(levelOf(unit.text));
    // **عونُ وضع الدعم يُقرَّر مرّةً هنا** (جلسة د): وصندوقُه صندوقُ النوع الذي
    // سيُكتب (نسخاً دون العري، وإملاءً عنده) — فالإذنُ أوّلُ لقاءٍ بالمهارة وحدَه.
    const aid = easeFor(unit.ref.tolerance,
      progress.skillBox(unit.text, progress.WORD_FORM,
        level >= VEIL_STEPS ? progress.KINDS.DICTATE : progress.KINDS.COPY));
    state.aided = aid.aided;
    const surface = penSurface({
      ref: unit.ref,
      mode: modeOf(level),
      veil: veilOf(unit.ref, level),
      // **سماحةُ الكلمة ومسطرتُها من مسارها** — كما في محطة النسخ سواءً
      tolerance: aid.tolerance,
      pace: demoPace(),
      baseline: unit.ref.line,
      label: `لوحُ إملاء: ${unit.text}`,
      onFault: (fault) => {
        state.faults++;
        state.stepFaults++;
        progress.recordFault(unit.text, fault.code);
      },
      onDone: () => finishUnit(unit),
    });
    live = surface;
    board.replaceChildren(surface.el);
    surface.play();
    surface.el.addEventListener('pointerdown', () => surface.stop(), { capture: true });
    // التعليمةُ ثم **صوتُ الكلمة من بنك اقرأ** — وهو كلُّ ما يسمعه في درجة الإملاء
    say(sayOf(levelOf(unit.text)), unit.say);
    paintStrip();
    paintVeil(level);
    paintFoot(unit);
  }

  /**
   * **القياسُ يكتب بمفتاح درجته** (`METHOD.md §٦`): وحدةُ الكلمة ومحورُها `WORD_FORM`،
   * ونوعُه **من عدّاد الخفوت** — `نسخ` ما دام يُرى نموذجٌ، و`إملاء` إذا غاب كلُّه.
   *
   * **والنوعُ مكتوبٌ بعينه لا بمتغيّر**: `tools/test_measure.mjs` يقرأ هذا الملفَّ
   * نصّاً ليثبت أنّ المحطةَ تكتب ما أعلنته.
   */
  function score(unit, level, clean) {
    if (level >= VEIL_STEPS) {
      progress.recordAttempt(unit.text, progress.WORD_FORM, progress.KINDS.DICTATE, clean,
        progress.dayNumber(), state.aided);
    } else {
      progress.recordAttempt(unit.text, progress.WORD_FORM, progress.KINDS.COPY, clean,
        progress.dayNumber(), state.aided);
    }
  }

  function finishUnit(unit) {
    const level = levelOf(unit.text);
    const clean = state.stepFaults === 0;
    score(unit, level, clean);
    // **والإصابةُ المتباعدة وحدَها تخفت**: يومٌ واحد لا يزيد العدّاد إلا مرة
    // (`progress.recordRead`)، ولا تُحتسب إصابةٌ كُشف فيها النموذج.
    if (clean && !state.revealed) progress.recordRead(unit.text);
    state.revealed = false;
    nextUnit();
  }

  async function nextUnit() {
    const token = ++turn;
    await speech;                       // لا يُدهَس كلامٌ يُقال (قناةُ ٤ج)
    if (token !== turn) return;         // سبقتنا خطوةٌ أحدث
    if (state.unit < units.length - 1) {
      state.unit++;
      mount();
      return;
    }
    finish();
  }

  function finish() {
    const trace = live?.ink() ?? [];
    releaseFade();
    state.done = true;
    const stars = starsForReview(state.faults, units.length);
    progress.setStars(node.id, stars);
    paintStrip();
    hint.textContent = '';
    veilBar.replaceChildren();
    board.replaceChildren(h('div', { class: 'celebrate' },
      mascot('mascot mascot--cheer'),
      trace.length ? traceFace(trace) : faceEl(icon('ear'), 'celebrate-face', 'div'),
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
          state.faults = 0;
          state.done = false;
          state.revealed = false;
          mount();
        },
      }, '↻ أعِدِ الدرس'),
    );
  }

  /** أفعالُ الشاشة — وكلُّها أهدافُ لمسٍ ≥ ٦٤ بكسل (`DESIGN §٤`). */
  function paintFoot(unit) {
    const level = levelOf(unit.text);
    fill(foot, 
      // **زرُّ الأذن يُسمِع الكلمةَ بصوت اقرأ** — وهو في درجة الإملاء بابُ الطفل الوحيد
      unit.say && h('button', {
        class: 'btn btn--primary next',
        // **نقرةُ الطفل تُسكت ثم تُشغّل** (عقدُ قناة ٤ج)
        onclick: () => { audio.stop(); speech = audio.play(unit.say); },
      }, icon('ear'), ' اسْمَعْ'),
      // **والكشفُ حقٌّ ثمنُه درجة** — يظهر حيث يكون في النموذج ما يُكشَف
      level > 0 && !state.revealed && h('button', {
        class: 'btn next',
        onclick: () => {
          audio.stop();
          progress.revealRead(unit.text);
          state.revealed = true;
          mount();
        },
      }, icon('eye'), ' أرِنِي'),
      h('button', { class: 'btn next', onclick: () => live?.reset() }, '↻ أعِدْ'),
    );
  }

  const main = h('main', { class: 'screen lesson-letter lesson-fade' },
    title, strip, veilBar, board, hint, foot);
  screen.append(main);
  mount();
  return screen;
}
