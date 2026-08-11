// صفحةُ تجربة محرّك القلم — خلف `?dev=1` وحدها (بند الجلسة ١/٥).
//
// **لِمَ توجد أصلاً؟** لأن المحرّك سُلّم في الجلسة ١ ولا شاشةَ تستعمله بعدُ: محطاتُ
// التهيئة في الجلسة ٤، ودرسُ الحرف في الجلسة ٥. فمحرّكٌ بلا يدٍ تجرّبه شيفرةٌ لم
// يرها أحدٌ يعمل — وهذه الصفحةُ هي اليد.
//
// **وقد تحوّلت إلى الحروف الحقيقية (الجلسة ٢)**: كان المعروضُ هنا شكلاً هندسياً
// محسوباً لأن مسارات الحروف لم تكن قد أُلّفت، **وكانت الصفحةُ تطالِب من نفسها**
// بالتحوّل يومَ تُؤلَّف (سطرٌ في `tools/test_pen.mjs` يحمرّ إذا امتلأ `PATHS`
// وبقيت الصفحةُ على شكلها). وقد امتلأ فتحوّلت: ما يُعرَض الآن **مسارُ حرفٍ من
// `curriculum.js` بعينه** — مؤلَّفٌ بعدّة `tools/make_paths.html` وعابرٌ
// لـ`check_paths.py` — فلا يُجرَّب المحرّك على غير مادّته.
//
// 🔒 **وهي من حملة مسار الطفل**: يمرّ بها الحبر، فتدخل الحارسَ النصيّ في
// `tools/test_pen.mjs` — لا `fetch` ولا رفعَ ولا عنوانَ خارجيّ.

import { h, DEV, topbar, brandMark, go } from './ui.js';
import { PATHS, FORMS, FORM_NAMES, pathOf } from './curriculum.js';
import { penSurface, FAULT_TEXT, MODES } from './pen.js';

const STEPS = [
  [MODES.GUIDED, 'موجَّه — المسار ظاهر'],
  [MODES.FAINT, 'خافت — يعتمد على ذاكرته'],
  [MODES.FREE, 'حرّ — صندوقٌ فارغ'],
];

/** الحروفُ التي أُلّفت مساراتُها — تُقرأ من المنهج ولا تُكتب هنا. */
export const penLetters = () => Object.keys(PATHS);

const state = { letter: null, form: FORMS.ISOLATED, mode: MODES.GUIDED };
let live = null;

/** مسارُ ما يُعرَض الآن — من المنهج بعينه، لا نسخةَ ثانية في هذه الصفحة. */
const refNow = () => pathOf(state.letter, state.form);

/**
 * إطلاقُ اللوح عند مغادرة الشاشة — يناديها الموجّه في `main.js` مع كل رسمة،
 * نظيرَ `recorder.release()` في اقرأ: لا يتبع شيءٌ من اللوح الطفلَ إلى غير شاشته.
 */
export function releasePen() {
  live?.destroy();
  live = null;
}

/**
 * شاشةُ تجربة المحرّك: حرفٌ يُختار بشكل موقعه، ولوحٌ يُبنى من مساره، وأزرارُ خطوات
 * الحلقة (`METHOD.md §٥`)، ولوحُ قراءةٍ يطبع الحكمَ وأخطاءَه ومقاييسَه — **وهي
 * أرقامُ مطوّرٍ لا شاشةُ طفل**.
 */
export function renderPenDev() {
  if (!DEV) return null;
  const letters = penLetters();
  if (!letters.includes(state.letter)) state.letter = letters[0] || null;

  const screen = h('div', {},
    topbar(
      h('button', { class: 'btn btn--ghost', onclick: () => go('#/') }, '→ الخريطة'),
      h('span', { class: 'spacer' }),
      brandMark(),
    ),
  );

  const readout = h('div', { class: 'dev-readout' });
  const board = h('div', {});
  const say = (...lines) => readout.replaceChildren(...lines.map((line) => h('div', {}, line)));

  /** يبني اللوحَ من مسار الحرف المختار — والنموذجُ والحَكَمُ من `ref` واحد. */
  function mount() {
    releasePen();
    const ref = refNow();
    if (!ref) {
      board.replaceChildren(h('p', { class: 'note' }, 'لا مسارَ لهذا الشكل بعدُ.'));
      return;
    }
    const surface = penSurface({
      ref,
      mode: state.mode,
      label: `لوحُ كتابة ${state.letter} ${FORM_NAMES[state.form]}`,
      onFault: (fault) => say(
        `خطأ: ${FAULT_TEXT[fault.code]} (${fault.code})`,
        `الجزء ${fault.part + 1} · الانزياح ${Math.round(fault.off[0])}، ${Math.round(fault.off[1])}`,
      ),
      onPart: (part) => say(`استُوفي جزءٌ — التغطية ${Math.round((part.progress ?? 1) * 100)}٪`),
      onDone: (verdict) => say(
        verdict.accepted ? '✓ مقبول — الشروط الأربعة مستوفاة' : '✗ غير مقبول',
        `المحاولات ${verdict.attempts} · الأخطاء: ${verdict.codes.join('، ') || 'لا شيء'}`,
        `أقصى انحراف ${Math.round(verdict.metrics.maxLateral)} من سماحة `
        + `${Math.round(surface.trial.tolerance.lateral)} · التغطية `
        + `${Math.round(verdict.metrics.coverage * 100)}٪`,
      ),
    });
    live = surface;
    board.replaceChildren(surface.el);
  }

  const pick = (label, on, act) => h('button', {
    class: `btn${on ? '' : ' btn--ghost'}`,
    onclick: act,
  }, label);

  const main = h('main', { class: 'screen' },
    h('h1', {}, 'تجربةُ محرّك القلم'),
    h('p', { class: 'note' },
      'مسارُ حرفٍ حقيقيّ من المنهج — مؤلَّفٌ بعدّة المسارات وعابرٌ لفاحصها. '
      + 'اختر الحرفَ وشكلَ موقعه، ثم «شاهِد» ثم اكتب فوقه.'),
    h('div', { class: 'dev-row' }, ...letters.map((ch) => pick(ch, ch === state.letter, () => {
      state.letter = ch;
      mount();
      say(`الحرف ${ch}`);
    }))),
    h('div', { class: 'dev-row' }, ...Object.values(FORMS).map((form) => pick(
      FORM_NAMES[form], form === state.form, () => {
        state.form = form;
        mount();
        say(`${state.letter} ${FORM_NAMES[form]}`);
      },
    ))),
    board,
    h('div', { class: 'dev-row' },
      h('button', { class: 'btn', onclick: () => { live?.reset(); live?.play(); } }, 'شاهِد'),
      ...STEPS.map(([mode, title]) => h('button', {
        class: 'btn',
        onclick: () => { state.mode = mode; live?.setMode(mode); say(title); },
      }, title.split(' — ')[0])),
      h('button', { class: 'btn', onclick: () => { live?.reset(); say('لوحٌ نظيف'); } }, 'أعِد'),
    ),
    readout,
  );

  mount();
  say('انقر «شاهِد» لترى الحرفَ يُرسم من مساره، ثم اكتب فوقه.');
  screen.append(main);
  return screen;
}
