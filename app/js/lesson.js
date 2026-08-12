// شاشةُ **درس الحرف** — حلقةُ `METHOD.md §٥` بخطواتها الأربع:
//   ١) **شاهِدْ**: الرسمُ المتحرك **من المسار المرجعي نفسِه**، ومعه اسمُ الحرف بصوت
//      بنك «اِقْرَأْ» (`METHOD.md §٧`) — فيُسمَع الاسمُ الذي تعلّمه الطفلُ قارئاً.
//   ٢) **تتبّعْ موجَّهاً**: المسارُ ظاهرٌ كاملاً، نقطةُ البداية تومض، سهمُ اتجاه.
//   ٣) **تتبّعْ خافتاً**: المسارُ يخفت، والاعتمادُ على الذاكرة الحركية يزيد.
//   ٤) **اكتُبْهُ وحدَك**: صندوقٌ فارغ — والحكمُ بالشروط الأربعة نفسِها.
//
// **ومؤشّرُ التقدّم الحركيّ مخالفةٌ معلَنة لاقرأ** (`METHOD.md §٥`): المسارُ يتلوّن
// تحت قلم الطفل في كل خطوة (يملكه `pen.js`)، فالكتابةُ فعلٌ ممتدّ لا نقرة — والطفلُ
// يحتاج أن يرى أين هو من الحركة. **ولا «صوابَ صامت»**.
//
// **والمحرّكُ كما هو**: لا عتبةَ تُمَسّ هنا ولا سماحةَ تُبدَّل — هذه شاشةٌ تسوق
// `penSurface` وتقرأ حكمَه (`METHOD.md §٣.٣`).
//
// **القياس** (`METHOD.md §٦`): كلُّ خطوةٍ كاتبةٍ تكتب في ليتنر بمفتاحها الثلاثيّ
// (الحرف × معزول × تتبّع/حرّ)، وكلُّ خطأٍ يُسجَّل **بعينه** في عدّاد أخطاء الاتجاه.
//
// 🔒 **ومن حملة مسار الطفل**: يمرّ بها حبرُه (تتلقّى أخطاءَه من المحرّك)، فتدخل
// حارسَ الخصوصية النصيّ في `tools/test_pen.mjs` — لا شبكةَ ولا رفعَ ولا عنوانَ
// خارجيّ، وما يُخزَّن **عددٌ باسم خطئه** لا إحداثيُّ نقطة.

import * as progress from './progress.js';
import * as audio from './audio.js';
import { pathOf, PATHS, LETTERS, FORMS } from './curriculum.js';
import { penSurface, MODES } from './pen.js';
import { starsForReview } from './review.js';
import {
  h, icon, go, arNum, starsRow, topbar, brandMark, mascot, cheer, faceEl,
  nodeTitle, traceFace, letterName,
} from './ui.js';

/**
 * **تعليماتُ الشاشة المنطوقة** — وهي **الجديدُ الوحيد المطلوب** من الصوت في هذا
 * التطبيق (`METHOD.md §٧`: «الجديدُ المطلوب تعليماتُ الشاشات فقط»). تمرّ من
 * `tools/audio_queue.json` كسائر النصوص، ولا تُولَّد في جلسة تطوير.
 */
export const SAY = {
  watch: 'شَاهِدْ كَيْفَ يُكْتَبْ',
  guided: 'تَتَبَّعِ الْمَسَارْ',
  faint: 'تَتَبَّعْهُ وَهْوَ خَافِتْ',
  free: 'اُكْتُبْهُ وَحْدَكْ',
};

/**
 * **ما تنطقه هذه الشاشةُ — مُعلَنٌ لا مضمَر** (بابُ الإعلان في `tools/check_speech.mjs`،
 * منقولُ `calc@ad59c56`): تعليماتُ الخطوات، **وأسماءُ الحروف التي أُلّف مسارُها**
 * فصارت تُدرَّس فعلاً.
 *
 * **ويُشتقّ من المادّة لا يُكتب بيد**: حرفٌ يدخل `PATHS` غداً (الجلسة ٦) يدخل هذا
 * الإعلانَ من نفسه، **فيُطالِب الحارسُ بصوت اسمه** من بنك اقرأ بلا سطرٍ يُضاف — وهو
 * نمطُ «التعليقُ يُطالِب من نفسه».
 */
export const LETTER_NAMES = Object.keys(PATHS).map((ch) => LETTERS[ch]?.name).filter(Boolean);

export const SPOKEN = [...Object.values(SAY), ...LETTER_NAMES];

/**
 * خطواتُ الحلقة (`METHOD.md §٥`) — والكاتبةُ منها ثلاثٌ، لكلٍّ مفتاحُ قياسها.
 * `mode` نمطُ اللوح في `pen.js`، فما يراه الطفلُ هو ما يحكم به المحرّك.
 */
export const STEPS = [
  { id: 'watch', mode: MODES.GUIDED, title: 'شَاهِدْ', say: SAY.watch, kind: null },
  { id: 'guided', mode: MODES.GUIDED, title: 'تَتَبَّعْ', say: SAY.guided, kind: progress.KINDS.TRACE },
  { id: 'faint', mode: MODES.FAINT, title: 'خَافِتٌ', say: SAY.faint, kind: progress.KINDS.TRACE },
  { id: 'free', mode: MODES.FREE, title: 'وَحْدَكْ', say: SAY.free, kind: progress.KINDS.FREE },
];

/** عقدةُ درس حرفٍ بجزئها — من الرحلة نفسِها، فلا يُكتب معرّفُ محطةٍ بيد. */
const letterNode = (part) => progress.allNodes()
  .find((node) => node.type === 'letter' && node.part === part) || null;

/**
 * **أدرسٌ جاهزٌ لهذا الحرف؟** — أيْ: أُلّف مسارُه المرجعيّ؟ يقرؤها الموجّهُ فيجيب
 * الطفلَ بدل أن يصمت (بلاغُ الميدان ١: «الصمتُ يُقرأ عطباً»)، **ومصدرُ جوابها
 * البياناتُ نفسُها** لا قائمةٌ تشيخ: يومَ تُؤلَّف مساراتُ المجموعات ٤–٧ (الجلسة ٦)
 * تُفتَح دروسُها بلا سطرٍ يُعدَّل هنا ولا هناك.
 */
export const lessonReady = (part) => {
  const node = letterNode(part);
  return Boolean(node?.letter && pathOf(node.letter, FORMS.ISOLATED));
};

let live = null;

/** إطلاقُ اللوح عند مغادرة الشاشة — يناديها الموجّه مع كل رسمة (نظيرُ `releaseWarmup`). */
export function releaseLesson() {
  live?.destroy();
  live = null;
}

/**
 * شاشةُ درسِ حرفٍ واحد.
 * @param {string} part جزءُ العقدة كما في `curriculum.js` (وهو الحرفُ نفسُه)
 * @returns {Node|null} `null` إن لم تكن عقدةَ حرفٍ أو لم يُؤلَّف مسارُه بعد
 */
export function renderLesson(part) {
  const node = letterNode(part);
  if (!node?.letter) return null;
  const letter = node.letter;
  // **ولا يُفتَح درسٌ بلا مسارٍ مرجعيّ** (`METHOD.md §٣.٨`): حروفُ المجموعات ٤–٧
  // تنتظر تأليفَ مساراتها (الجلسة ٦)، فيردّ الموجّهُ الطفلَ برسالته المعتادة بدل
  // شاشةٍ بلا نموذجٍ ولا حَكَم.
  const ref = pathOf(letter, FORMS.ISOLATED);
  if (!ref) return null;

  const state = { index: 0, faults: 0, stepFaults: 0, done: false };
  /** آخرُ ما نطقته الشاشة — **وبه تنتظر الخطوةُ تمامَ الكلام** (قناة ٤ج) لا مهلةً. */
  let speech = Promise.resolve(false);

  const dots = h('ol', { class: 'dots' });
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
    speech = texts.length > 1 ? audio.playSequence(texts) : audio.play(texts[0]);
    return speech;
  };

  function paintDots() {
    dots.replaceChildren(...STEPS.map((step, i) => h('li', {
      class: `dot${!state.done && i === state.index ? ' dot--now' : ''}`
        + `${state.done || i < state.index ? ' dot--done' : ''}`,
      'aria-label': step.title,
    }, state.done || i < state.index ? '✓' : arNum(i + 1))));
  }

  /**
   * يبني لوحَ الخطوة الحالية — النموذجُ والحَكَمُ من `ref` واحد (`METHOD.md §٣.٢`).
   * **وخطوةُ «شاهِدْ» لا يُكتب عليها**: لوحُها عرضٌ، ولمسُه ينقل إلى التتبّع (لا
   * يبتلع نزولَ الإصبع فيضيع أوّلُ حرفٍ يكتبه الطفل).
   */
  function mount() {
    releaseLesson();
    const step = STEPS[state.index];
    state.stepFaults = 0;
    hint.textContent = step.say;

    const surface = penSurface({
      ref,
      mode: step.mode,
      label: `لوحُ كتابة: ${letterName(letter)}`,
      // **كلُّ خطأٍ يُسجَّل باسمه** (`METHOD.md §٦`) — ووحدتُه الحرفُ نفسُه، فتقرأ
      // لوحةُ وليّ الأمر «يبدأ الميمَ من أسفل» لا رقماً مبهماً.
      onFault: (fault) => {
        state.faults++;
        state.stepFaults++;
        progress.recordFault(letter, fault.code);
      },
      onDone: () => finishStep(step),
    });
    live = surface;
    board.replaceChildren(surface.el);
    board.classList.toggle('lesson-board--watch', step.id === 'watch');
    surface.play();
    if (step.id === 'watch') {
      // لمسةُ الطفل على لوح العرض تنقله إلى التتبّع — والنقرةُ **تُسكت ثم تُشغّل**
      // (عقدُ ٤ج: كلامُ التطبيق يصفّ، ونقرةُ الطفل تعيش وحدَها).
      surface.el.addEventListener('pointerdown', () => { audio.stop(); nextStep(); });
      say(letterName(letter), step.say);
    } else {
      surface.el.addEventListener('pointerdown', () => surface.stop(), { capture: true });
      say(step.say);
    }
    paintDots();
    paintFoot(step);
  }

  /**
   * **القياسُ يكتب لكل خطوةٍ بمفتاحها** (`METHOD.md §٦`): الخطوةُ بلا خطأٍ إصابةٌ
   * ترفع صندوقَ ليتنر، وما وقع فيه خطأٌ يعود إلى الصندوق الأول فيُراجَع غداً.
   *
   * **والنوعان مكتوبان بأعيانهما لا بمتغيّر**: `tools/test_measure.mjs` يقرأ هذا
   * الملفَّ نصّاً ليثبت أنّ المحطةَ تكتب ما أعلنته — ولو مُرِّرا في متغيّرٍ لَعمي
   * عنهما الحارسُ ومرّت محطةٌ لا تقيس.
   */
  function score(step, clean) {
    if (step.kind === progress.KINDS.FREE) {
      progress.recordAttempt(letter, FORMS.ISOLATED, progress.KINDS.FREE, clean);
    } else if (step.kind === progress.KINDS.TRACE) {
      progress.recordAttempt(letter, FORMS.ISOLATED, progress.KINDS.TRACE, clean);
    }
  }

  /** خطوةٌ استُوفيت: تُقاس ثم تُسلّم إلى ما بعدها — **بعد تمام الكلام لا بمهلة**. */
  function finishStep(step) {
    score(step, state.stepFaults === 0);
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
    finish();
  }
  let turn = 0;

  /**
   * ختامُ الدرس: نجومٌ بحكم المراجعة نفسِه (`starsForReview`) — ثلاثٌ بلا خطأ،
   * فاثنتان ما دامت الأخطاءُ ≤ عدد الخطوات الكاتبة، وإلا واحدة. **ولا رسوبَ**:
   * من أتمّ خطواته فقد كتب الحرفَ صحيحاً في النهاية (المحرّكُ لا يُمرّر جزءاً إلا
   * مستوفىً)، والأخطاءُ في الطريق تُقاس ولا تُعاقَب.
   */
  function finish() {
    // **أثرُ الطفل يُنسَخ قبل أن يُطوى اللوح** (`REVIEW_IDENTITY.md §٣ج`).
    const trace = live?.ink() ?? [];
    releaseLesson();
    state.done = true;
    const writing = STEPS.filter((s) => s.kind).length;
    const stars = starsForReview(state.faults, writing);
    progress.setStars(node.id, stars);
    paintDots();
    hint.textContent = '';
    board.classList.remove('lesson-board--watch');
    board.replaceChildren(h('div', { class: 'celebrate' },
      mascot('mascot mascot--cheer'),
      trace.length ? traceFace(trace) : faceEl(icon('pen'), 'celebrate-face', 'div'),
      h('h2', {}, ...cheer('أَحْسَنْتَ')),
      starsRow(stars, 'big-stars'),
      h('p', { class: 'hint' }, `${nodeTitle(node)} — ${
        state.faults ? 'يدُك تتحسّن' : 'بلا خطأٍ واحد'}`),
    ));
    foot.replaceChildren(
      h('button', { class: 'btn btn--primary next', onclick: () => go('#/') }, '→ الخريطة'),
      h('button', {
        class: 'btn next',
        onclick: () => {
          state.index = 0;
          state.faults = 0;
          state.done = false;
          mount();
        },
      }, '↻ أعِدِ الدرس'),
    );
  }

  /** أفعالُ الشاشة: تُبدَّل بالخطوة — وكلُّها أهدافُ لمسٍ ≥ ٦٤ بكسل (`DESIGN §٤`). */
  function paintFoot(step) {
    if (step.id === 'watch') {
      foot.replaceChildren(
        h('button', {
          class: 'btn btn--primary next',
          onclick: () => { audio.stop(); nextStep(); },
        }, icon('pen'), ' تَتَبَّعْ'),
        h('button', {
          class: 'btn next',
          // **نقرةُ الطفل تُسكت ثم تُشغّل** (عقدُ قناة ٤ج): فتسقط بقيّةُ ما صُفّ
          // ويُسمَع ما طلبه هو وحدَه — لا يُكدَّس صوتٌ فوق صوت.
          onclick: () => { audio.stop(); speech = audio.play(letterName(letter)); },
        }, icon('ear'), ' اسْمَعْ'),
        h('button', {
          class: 'btn next',
          onclick: () => { live?.reset(); live?.play(); },
        }, '↻ أعِدِ العَرْض'),
      );
      return;
    }
    foot.replaceChildren(
      h('button', {
        class: 'btn btn--primary next',
        onclick: () => { live?.reset(); live?.play(); },
      }, icon('pen'), ' شَاهِدْ'),
      h('button', { class: 'btn next', onclick: () => live?.reset() }, '↻ أعِدْ'),
    );
  }

  const main = h('main', { class: 'screen lesson-letter' }, title, dots, board, hint, foot);
  screen.append(main);
  mount();
  return screen;
}
