// شاشةُ **الجمل القصيرة** — المرحلة ١٤ في `METHOD.md §٤`: «نسخُ جملٍ من سلّم جمل
// اقرأ ثم إملاؤها · اتجاهُ السطر والمسافات».
//
// **والجملةُ سطرٌ لا كلماتٌ مجموعة**: خيالُها يُؤلَّف كخيال الكلمة (لازمُ قرار الجلسة
// ٢، منفَّذاً في `make_paths.html §٧ج`) — تُصيَّر نصاً واحداً بمُشكِّل المتصفّح فيخرج
// منها **اتجاهُ السطر والمسافةُ بين الكلمات** حقيقةً مقيسةً لا تركيباً، وتُنزَّل
// مساراتُ الحروف القانونية على أجسادها فيها. فما يكتبه الطفلُ في الجملة هو ما تعلّمه
// في محطة الشكل بعينه، **والفراغُ بين كلمتيها فراغُ المُشكِّل** لا تقديرَنا.
//
// **وحلقتُها خطوتان**: **انْسَخْ** (النموذجُ كاملاً على مسطرته) ثم **اُكْتُبْ سَمَاعاً**
// (صندوقٌ فارغ بسطر ارتكاز، والجملةُ تُسمَع بصوت اقرأ) — وهو نصُّ المرحلة حرفاً:
// «نسخُ جملٍ ثم إملاؤها». وليست هذه محطةَ خفوتٍ متباعد (تلك المرحلةُ ١٣ وشاشتُها
// `fade.js`): الجملةُ تُنسَخ فتُملى في مجلسها، والمستحدَثُ هنا **السطرُ** نفسُه لا
// حروفُه — اتجاهُه ومسافاتُه وجلوسُ كلماته عليه.
//
// ━━━ **وإملاءُ الجملة الفوريّ درجةُ صدىً لا امتحانَ حصيلة** (الجلسة ح — ب٣) ━━━
//
// **وكان هنا نصٌّ غيرُ صادق**: «لأن كلماتِها كلَّها دُرِّست كتابةً **وأُمليت** قبلها».
// والحقُّ أنّ إملاءَ الكلمة **رتبةٌ تُبلَغ** لا محطةٌ تُقطَع: تنضج الكلمةُ بأداء الطفل
// المتباعد فتخفت درجةً درجة حتى تُملى (`fade.js`)، **فمن كلمات الجملة ما بلغ رتبتَه
// ومنها ما لم يبلغها بعدُ** — والدعوى المطلقة لا تقع.
//
// **وتبقى الخطوةُ على حالها بعلّتها الصادقة**: هي **صدى الجملة في مجلسها** — سطرٌ
// سُمع ونُسخ قبل لحظات يُستعاد من الذاكرة القريبة، فيُقاس به **بناءُ السطر** (المسافةُ
// والاتجاهُ والجلوس) لا استرجاعُ رسم كلماته من بعيد. **وهي تهيئةٌ للإملاء الحقّ**
// الذي تجدوله المراجعةُ متباعداً (`review.js`، وقياسُه `DICTATE` بمحور الجملة) —
// **فالفوريُّ يُدرَّب والمتباعدُ يُقاس**، ولا يُغني أحدُهما عن الآخر.
//
// **وسطرُ الكرّاسة من الجملة نفسِها** («النموذجُ هو المقياس»، `METHOD.md §٣.٢`):
// `ref.line` خرج من خيالها المُشكَّل، فالخطُّ الذي يراه الطفل تحت الجملة هو الذي
// تجلس عليه كلماتُها حقّاً — ويبقى في الإملاء وحدَه ليعرف **أين يجلس ما يكتب**.
//
// 🔒 **ومن حملة مسار الطفل**: يمرّ بها حبرُه، فتدخل حارسَ الخصوصية النصيّ في
// `tools/test_pen.mjs` — لا شبكةَ ولا رفعَ ولا عنوانَ خارجيّ.

import * as progress from './progress.js';
import { starsForReview } from './progress.js';
import * as audio from './audio.js';
import { SENTENCES, SPOKEN_SENTENCES } from './curriculum.js';
import { WORD_PATHS } from './word_paths.js';
import { penSurface, MODES } from './pen.js';
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
  copy: 'انْسَخِ الْجُمْلَةَ عَلَى السَّطْرْ',
  dictate: 'اسْتَمِعْ ثُمَّ اكْتُبِ الْجُمْلَةْ',
};

/**
 * **ما تنطقه هذه الشاشةُ — مُعلَنٌ لا مضمَر** (بابُ الإعلان في `tools/check_speech.mjs`):
 * تعليمتا الخطوتين، **وجملُ المنهج المنطوقةُ في بنك اقرأ** — تُشتقّ من المادّة لا
 * تُكتب بيد، فجملةٌ تدخل المنهجَ غداً تدخل الإعلانَ من نفسها وتُطالِب بصوتها.
 */
export const SPOKEN = [...Object.values(SAY), ...SPOKEN_SENTENCES];

/**
 * خطوتا حلقة الجملة — كلتاهما تكتبان في ليتنر، ولكلٍّ نوعُها.
 *
 * **والثانيةُ درجةُ صدىً معلَنة** (ب٣): تكتب `إملاء` بمحور الجملة لأنّ اللوحَ فارغٌ
 * والسؤالَ صوتٌ — **والنموذجُ هو المقياس** فلا يُسمّى غيرَ اسمه. وإنما مجلسُها قريب،
 * **فليتنر هو الذي يجعلها إملاءً حقّاً**: يعيد السطرَ متباعداً في المراجعة بعد أيام.
 */
export const STEPS = [
  { id: 'copy', mode: MODES.GUIDED, title: 'اِنْسَخْ', say: SAY.copy, kind: progress.KINDS.COPY },
  { id: 'dictate', mode: MODES.FREE, title: 'سَمَاعاً', say: SAY.dictate, kind: progress.KINDS.DICTATE },
];

/** عقدةُ الرحلة بجزئها — من الرحلة نفسِها، فلا يُكتب معرّفُ محطةٍ بيد. */
export const nodeOf = (part, stageId = null) => progress.allNodes()
  .find((node) => node.type === 'sentence' && node.part === part
    && (!stageId || node.stageId === stageId)) || null;

/**
 * **وحداتُ العقدة**: جملُها التي أُلّف مسارُها، ولكلٍّ صوتُها من سلّم اقرأ.
 *
 * **وما لا مسارَ له يسقط ولا يُعرَض فارغاً** (`METHOD.md §٣.٨`)، ويحرس `check_paths.py`
 * ألّا يقع ذلك أصلاً — كما يحرس `check_writable.py` ألّا تُملى جملةٌ بلا صوت.
 */
export function unitsOf(node) {
  if (!node) return [];
  return (node.sentences || [])
    .map((text) => {
      const ref = WORD_PATHS[text];
      return ref && { text, ref, say: SENTENCES[text]?.say || null };
    })
    .filter(Boolean);
}

/** أعقدةُ جملٍ جاهزةٌ مادّتُها؟ يقرؤها الموجّهُ فيجيب الطفلَ بدل أن يصمت. */
export const nodeReady = (node) => Boolean(node) && unitsOf(node).length > 0;

let live = null;

/** إطلاقُ اللوح عند مغادرة الشاشة — يناديها الموجّه مع كل رسمة. */
export function releaseSentence() {
  live?.destroy();
  live = null;
}

/** شاشةُ محطة الجمل — بابُ الموجّه. */
export const renderSentence = (part, stageId = null) => renderNode(nodeOf(part, stageId));

/**
 * **الشاشةُ الواحدة**: عقدةٌ بجملها، لكلِّ جملةٍ نسخٌ ثم إملاء.
 * @param {object} node عقدةُ الرحلة (`sentence`)
 * @returns {Node|null} `null` إن لم تكن عقدةَ جملٍ أو لم تُؤلَّف مادّتُها
 */
export function renderNode(node) {
  const units = unitsOf(node);
  if (!units.length) return null;

  const state = { unit: 0, index: 0, faults: 0, stepFaults: 0, done: false };
  /** آخرُ ما نطقته الشاشة — **وبه ينتظر الانتقالُ تمامَ الكلام** (قناة ٤ج) لا مهلةً. */
  let speech = Promise.resolve(false);
  let turn = 0;

  const dots = h('ol', { class: 'dots' });
  const strip = h('ol', { class: 'unit-strip unit-strip--words' });
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

  /** شريطُ وحدات المحطة: الجملُ بترتيبها — ورقمُها لا نصُّها (السطرُ أطولُ من الشارة). */
  function paintStrip() {
    strip.replaceChildren(...units.map((unit, i) => h('li', {
      class: `unit unit--word${i === state.unit && !state.done ? ' unit--now' : ''}`
        + `${state.done || i < state.unit ? ' unit--done' : ''}`,
      'aria-label': unit.text,
    }, arNum(i + 1))));
  }

  /** يبني لوحَ الخطوة الحالية — النموذجُ والحَكَمُ من `ref` واحد (`METHOD.md §٣.٢`). */
  function mount() {
    releaseSentence();
    const unit = units[state.unit];
    const step = STEPS[state.index];
    state.stepFaults = 0;

    hint.textContent = step.say;
    // **عونُ وضع الدعم يُقرَّر مرّةً هنا** (جلسة د): السماحةُ ووسمُ عونها من قرارٍ
    // واحد، وإذنُه أوّلُ لقاءٍ بالمهارة وحدَه — ومطفأً تعود سماحةُ المسار كما هي.
    const aid = easeFor(unit.ref.tolerance,
      step.kind ? progress.skillBox(unit.text, progress.SENTENCE_FORM, step.kind) : 0);
    state.aided = aid.aided;
    const surface = penSurface({
      ref: unit.ref,
      mode: step.mode,
      judge: 'defer',   // **التقاطٌ صامتٌ والقياسُ عند «تَابِعْ»** (مرسوم ٢٤ أغسطس)
      // **سماحةُ الجملة من مسارها** — مقياسُ حروفها فيها (`METHOD.md §٣.٥`)
      tolerance: aid.tolerance,
      pace: demoPace(),
      // **ومسطرةُ الكرّاسة سطرُ الجملة نفسُه** — يبقى في الإملاء ليعرف أين يجلس سطرُه
      baseline: unit.ref.line,
      label: `لوحُ جملة: ${unit.text}`,
      onFault: (fault) => {
        state.faults++;
        state.stepFaults++;
        // **وخطأُ الجملة يُسجَّل بوحدتها** — الجملةُ وحدةُ هذه المرحلة كما كانت الكلمةُ
        progress.recordFault(unit.text, fault.code);
      },
      onDone: () => finishStep(step, unit),
    });
    live = surface;
    board.replaceChildren(surface.el);
    // **العرضُ التلقائيّ لا يفتح لوحَ كتابة** (توحيدُ بلاغ المالك، ٢٣ أغسطس
    // ٢٠٢٦ — القاعدةُ الواحدة في كل الشاشات): القلمُ بيد الطفل من أول لمسة،
    // والإعادةُ بزرّ الطلب.
    surface.el.addEventListener('pointerdown', () => surface.stop(), { capture: true });
    // التعليمةُ ثم **صوتُ الجملة من سلّم اقرأ** — وهو كلُّ ما يسمعه في الإملاء
    say(step.say, unit.say);
    paintDots();
    paintStrip();
    paintFoot(step, unit);
  }

  /**
   * **القياسُ يكتب لكل خطوةٍ بمفتاحها** (`METHOD.md §٦`): وحدةُ هذه المرحلة **الجملة**
   * ومحورُها `SENTENCE_FORM` — فلا يظهر حرفٌ وهميّ في لوحة وليّ الأمر، ولا تختلط
   * الجملةُ بالكلمة في صناديق ليتنر.
   *
   * **والنوعُ مكتوبٌ بعينه لا بمتغيّر**: `tools/test_measure.mjs` يقرأ هذا الملفَّ
   * نصّاً ليثبت أنّ المحطةَ تكتب ما أعلنته.
   */
  function score(step, unit, clean) {
    if (step.kind === progress.KINDS.COPY) {
      progress.recordAttempt(unit.text, progress.SENTENCE_FORM, progress.KINDS.COPY, clean,
        progress.dayNumber(), state.aided);
    } else if (step.kind === progress.KINDS.DICTATE) {
      progress.recordAttempt(unit.text, progress.SENTENCE_FORM, progress.KINDS.DICTATE, clean,
        progress.dayNumber(), state.aided);
    }
  }

  function finishStep(step, unit) {
    score(step, unit, state.stepFaults === 0);
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
      mount();
      return;
    }
    finish();
  }

  /** عددُ الخطوات الكاتبة في المحطة كلِّها — سقفُ الأخطاء الذي تُقاس عليه النجوم. */
  const writingSteps = units.length * STEPS.filter((s) => s.kind).length;

  function finish() {
    const trace = live?.ink() ?? [];
    releaseSentence();
    state.done = true;
    const stars = starsForReview(state.faults, writingSteps);
    progress.setStars(node.id, stars);
    paintDots();
    paintStrip();
    hint.textContent = '';
    board.replaceChildren(h('div', { class: 'celebrate' },
      mascot('mascot mascot--cheer'),
      trace.length ? traceFace(trace) : faceEl(icon('book'), 'celebrate-face', 'div'),
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
          mount();
        },
      }, '↻ أعِدِ الدرس'),
    );
  }

  /** أفعالُ الشاشة: تُبدَّل بالخطوة — وكلُّها أهدافُ لمسٍ ≥ ٦٤ بكسل (`DESIGN §٤`). */
  function paintFoot(step, unit) {
    fill(foot, 
      // **وزرُّ الأذن يُسمِع الجملةَ بصوت اقرأ** — وهو في الإملاء بابُ الطفل الوحيد
      unit.say && h('button', {
        class: `btn next${step.id === 'dictate' ? ' btn--primary' : ''}`,
        // **نقرةُ الطفل تُسكت ثم تُشغّل** (عقدُ قناة ٤ج)
        onclick: () => { audio.stop(); speech = audio.play(unit.say); },
      }, icon('ear'), ' اسْمَعْ'),
      step.id === 'copy' && h('button', {
        class: 'btn btn--primary next',
        onclick: () => { live?.reset(); live?.play(); },
      }, icon('pen'), ' شَاهِدْ'),
      h('button', { class: 'btn next', onclick: () => live?.reset() }, '↻ أعِدْ'),
      // 🔴 **«نقيس ولا نرفض»** (مرسوم ٢٤ أغسطس): «تَابِعْ» الأزرقُ يقيس مرةً
      // صامتاً (النسبةُ والوصفُ لوليّ الأمر وليتنر) ويمضي دائماً.
      h('button', {
        class: 'btn btn--primary next',
        onclick: () => {
          audio.stop();
          const m = live?.measure?.();
          if (m) {
            if (!m.clean && m.shape?.why) progress.recordFault(unit.text, m.shape.why);
            if (step.kind) progress.recordQuality(unit.text, progress.SENTENCE_FORM, step.kind,
              m.clean ? [...new Set([...(m.shape.guides || []), ...(m.method?.guides || [])])]
                : ['passed-on']);
            score(step, unit, m.clean);
          } else {
            score(step, unit, false);
          }
          nextStep();
        },
      }, 'تَابِعْ →'),
    );
  }

  const main = h('main', { class: 'screen lesson-letter lesson-sentence' },
    title, strip, dots, board, hint, foot);
  screen.append(main);
  mount();
  return screen;
}
