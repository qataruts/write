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

/* ————— عدّةُ التقاط مسارات الميدان (الجلسة ١٢) —————
 *
 * **العلّة**: أرقامُ السماحة في `pen.js` (`TOLERANCE`) **مبدئيةٌ لم تُعايَر بطفل**،
 * وعهدُ `METHOD §٣.٥` أن تُعايَر **بمسارات ميدانٍ حقيقية لا بظنّ**. وعدّةُ المعايرة
 * اليومَ (`tools/pen_traces.json`) **تشويهاتٌ مصنوعة** تُثبت حكمَ المحرّك ولا تعاير
 * سماحتَه — ولكلِّ حالةٍ فيها حقلُ `origin`، و`field` مكانٌ محجوزٌ منذ الجلسة ١
 * ينتظر هذه العدّة.
 *
 * **والعهدُ الذي لا يُخدَش**: مسارُ الطفل لا يغادر جهازه. فما يُلتقَط هنا يبقى في
 * مخزن الجهاز، **ولا سبيلَ إلى إخراجه إلا بيد وليّ الأمر** ملفّاً يحفظه هو
 * (`Blob` محليّ، لا شبكةَ ولا خادم) — وهذا الملفُّ لا يعرف الشبكةَ أصلاً، يحرسه
 * `tools/test_pen.mjs §١` كما يحرس `pen.js`.
 *
 * **وثلاثةُ قيودٍ في بنائها**:
 *   ١) **بإذنٍ صريح**: لا يُسجَّل شيءٌ حتى يُضغط زرُّ الإذن — والافتراضُ الصمت.
 *   ٢) **خلف `?dev=1`**: الصفحةُ كلُّها لا تُبنى بدونه (`renderPenDev`).
 *   ٣) **وحدٌّ للحجم**: `FIELD_MAX` أثراً، فلا يمتلئ مخزنُ جهازٍ بقياسٍ منسيّ.
 */
const FIELD_KEY = 'uktub.field.v1';
const FIELD_MAX = 240;

/** قراءةُ دفتر الميدان — و**مخزنٌ لا يُقرأ لا يُسقِط شيئاً**: العدّةُ تعمل بلا مخزن. */
export function fieldBook() {
  try {
    const raw = globalThis.localStorage?.getItem(FIELD_KEY);
    const book = raw ? JSON.parse(raw) : null;
    if (book && typeof book === 'object') {
      return { on: Boolean(book.on), items: Array.isArray(book.items) ? book.items : [] };
    }
  } catch { /* مخزنٌ ممتلئ أو نصٌّ فاسد: يُقرأ دفتراً خالياً */ }
  return { on: false, items: [] };
}

function writeBook(book) {
  try {
    globalThis.localStorage?.setItem(FIELD_KEY, JSON.stringify(book));
  } catch { /* لا مخزن: الالتقاطُ يعيش في الجلسة ولا يُسقِط الصفحة */ }
  return book;
}

/** **الإذنُ الصريح** — لا التقاطَ قبله، وإيقافُه يوقف التسجيل ولا يمحو ما التُقط. */
export const fieldAllow = (on) => writeBook({ ...fieldBook(), on: Boolean(on) });

/** محوُ ما التُقط — بيد وليّ الأمر، وهو الطريقُ الوحيد لخروجه من الجهاز أو ذهابه. */
export const fieldClear = () => writeBook({ on: false, items: [] });

/**
 * تقييدُ أثرٍ واحد — **ويُردّ صفراً إن لم يُؤذَن**: فالإذنُ شرطٌ بنيويّ لا سؤالٌ في
 * الواجهة، يُجرَّب في `node` بلا متصفّح.
 *
 * @returns {number} عددُ ما في الدفتر بعدها (وصفرٌ يعني: لم يُسجَّل)
 */
export function fieldRecord(entry) {
  const book = fieldBook();
  if (!book.on || !entry || !Array.isArray(entry.strokes) || !entry.strokes.length) return 0;
  book.items = [...book.items, entry].slice(-FIELD_MAX);
  writeBook(book);
  return book.items.length;
}

/** نصُّ الملفّ الذي يحفظه وليُّ الأمر — **بلا اسمٍ ولا تقدّمٍ ولا معرّفِ جهاز**. */
export function fieldText(book = fieldBook()) {
  return `${JSON.stringify({
    what: 'مساراتُ ميدانٍ من «اُكْتُبْ» — أثرُ قلمٍ على شبكة ١٠٠٠ لا أكثر',
    origin: 'field',
    note: 'تدخل عدّةَ المعايرة بـ tools/import_traces.mjs — ولا اسمَ طفلٍ فيها ولا تقدّم',
    items: book.items,
  }, null, 1)}\n`;
}

/** اسمُ الملفّ — بيومه، فلا يُكتب ملفٌّ فوق ملف. */
export const fieldName = () => `uktub-field-${new Date().toISOString().slice(0, 10)}.json`;

/**
 * أثرُ القلم من اللوح: `d` نصّاً ← نقاطاً على الشبكة (يقرؤها مستورِدُ العدّة).
 *
 * 🔴 **والنقرةُ ضربةٌ بنقطةٍ واحدة — تُلتقَط ولا تُطرَح** (عطبُ ميدان ١٧ أغسطس ٢٠٢٦،
 * `FIELD_TRIAL §٥`): كان المرشِّحُ هنا `points.length > 1` فيبلع **كلَّ نقرةٍ لم
 * تتحرّك فيها اليد** — ونقطةُ الحرف نقرةٌ (ب ت ث ن …)، وشولةُ الكاف قد تُنقَر.
 * فعاد أثرُ «ب» بجسمه بلا نقطته، **وصندوقُ الحبر بلا النقطة صندوقٌ آخر** فتبدّل
 * التوفيقُ ومعه الحكم: انحرافُ ١٨٦ بدل ١٠٧، و`wander` بدل القبول. وأثرٌ لا يُعاد
 * على المحرّك بحكمه ساعةَ الالتقاط **شاهدٌ كاذب** فلا يُجمَّد.
 *
 * **والحدُّ الآن نقطةٌ واحدة**: ما نزل به الإصبعُ موضعٌ حقيقيّ حقُّه أن يُقرأ — ومَن
 * ردَّ نقرةً ردَّ نقطةَ الحرف نفسَها (`partsOf` يعدّها جزءاً كالجسم).
 */
export function fieldStrokes(inks) {
  return (inks || []).map((d) => {
    const nums = String(d).match(/-?\d+(?:\.\d+)?/g) || [];
    const points = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      points.push([Number(nums[i]), Number(nums[i + 1])]);
    }
    return points;
  }).filter((points) => points.length > 0);
}

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
    /**
     * **ما يُقيَّد من كل محاولة**: أثرُ اليد كما رُسم، ومعه ما يعرّف المادّة وحكمَ
     * المحرّك عليها — **وأثمنُها المردودة**: الشكوى التي رُدّت وهي في عين وليّ
     * الأمر صحيحة هي التي تعاير العتبة، لا المقبولةُ من أوّل مرّة.
     */
    const capture = (kind, extra) => fieldRecord({
      ch: state.letter,
      form: state.form,
      mode: state.mode,
      kind,
      ...extra,
      strokes: fieldStrokes(live?.ink()),
    });

    const surface = penSurface({
      ref,
      mode: state.mode,
      label: `لوحُ كتابة ${state.letter} ${FORM_NAMES[state.form]}`,
      onFault: (fault) => {
        capture('fault', { code: fault.code, part: fault.part });
        return say(
          `خطأ: ${FAULT_TEXT[fault.code]} (${fault.code})`,
          `الجزء ${fault.part + 1} · الانزياح ${Math.round(fault.off[0])}، ${Math.round(fault.off[1])}`,
        );
      },
      onPart: (part) => say(`استُوفي جزءٌ — التغطية ${Math.round((part.progress ?? 1) * 100)}٪`),
      onDone: (verdict) => {
        capture('done', {
          accepted: verdict.accepted,
          codes: verdict.codes,
          maxLateral: Math.round(verdict.metrics.maxLateral),
          coverage: Math.round(verdict.metrics.coverage * 100),
          lateral: Math.round(surface.trial.tolerance.lateral),
        });
        paintField();
        return say(
          verdict.accepted ? '✓ مقبول — الشروط الأربعة مستوفاة' : '✗ غير مقبول',
          `المحاولات ${verdict.attempts} · الأخطاء: ${verdict.codes.join('، ') || 'لا شيء'}`,
          `أقصى انحراف ${Math.round(verdict.metrics.maxLateral)} من سماحة `
          + `${Math.round(surface.trial.tolerance.lateral)} · التغطية `
          + `${Math.round(verdict.metrics.coverage * 100)}٪`,
        );
      },
    });
    live = surface;
    board.replaceChildren(surface.el);
  }

  const pick = (label, on, act) => h('button', {
    class: `btn${on ? '' : ' btn--ghost'}`,
    onclick: act,
  }, label);

  // ————— لوحةُ التقاط الميدان: إذنٌ صريح، وعدٌّ، وملفٌّ بيد وليّ الأمر —————
  const fieldBox = h('div', { class: 'dev-row' });
  const fieldNote = h('p', { class: 'note' });

  /** تنزيلُ ملفّ المسارات — نصٌّ في `Blob` بلا شبكةٍ ولا خادم (نظيرُ نسخة اللوحة). */
  function saveFieldFile() {
    const url = URL.createObjectURL(new Blob([fieldText()], { type: 'application/json' }));
    const link = h('a', { href: url, download: fieldName() });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 20000);
  }

  function paintField() {
    const book = fieldBook();
    fieldNote.textContent = book.on
      ? `الالتقاطُ يعمل — ${book.items.length} أثراً على هذا الجهاز، ولا يغادره إلا بملفٍّ تحفظه بيدك.`
      : `الالتقاطُ متوقّف${book.items.length ? ` — و${book.items.length} أثراً محفوظةٌ من قبل` : ''}.`
        + ' لا يُسجَّل شيءٌ حتى تأذن.';
    fieldBox.replaceChildren(
      h('button', {
        class: book.on ? 'btn' : 'btn btn--primary',
        onclick: () => { fieldAllow(!book.on); paintField(); },
      }, book.on ? '■ أوقِفِ الالتقاط' : '● آذَنُ بالتقاط مسارات طفلي'),
      h('button', {
        class: 'btn btn--ghost',
        disabled: !book.items.length,
        onclick: () => { saveFieldFile(); say(`حُفظ ملفُّ ${book.items.length} أثراً`); },
      }, '⤓ احفظ الملفّ'),
      h('button', {
        class: 'btn btn--ghost',
        disabled: !book.items.length,
        onclick: () => { fieldClear(); paintField(); say('مُحي دفترُ الميدان'); },
      }, '✕ امحُ ما التُقط'),
    );
  }

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
    h('h2', {}, 'التقاطُ مسارات الميدان'),
    h('p', { class: 'note' },
      'لمعايرة سماحة المحرّك بيدِ طفلٍ حقيقيّ لا بظنّ. '
      + 'ما يُلتقَط يبقى على هذا الجهاز ولا يُرسَل إلى أحد — '
      + 'ولا سبيلَ إلى إخراجه إلا ملفّاً تحفظه أنت وترسله إن شئت.'),
    fieldNote,
    fieldBox,
  );

  paintField();
  mount();
  say('انقر «شاهِد» لترى الحرفَ يُرسم من مساره، ثم اكتب فوقه.');
  screen.append(main);
  return screen;
}
