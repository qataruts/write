// جلسة المراجعة اليومية — تُولَّد بالتكرار المتباعد من سجلّ المهارات (`METHOD.md §٦`).
//
// **من بذرة اقرأ** (`FAMILY.md §٥`: «`review.js` — محرّك جلسة المراجعة، **هيكلُه لا
// تمارينُه**»). فالمنقولُ هنا هو المحرّك: عدّادُ الخطوات، وتسجيلُ المحاولة في ليتنر،
// وسلوكُ الخطأ والصواب، وسؤالُ المغادرة، وشاشةُ الختام بيد مَن يركّبه. **وتمارينُ
// اقرأ لم تُنقَل** — تمارينُها سماعيةٌ وقرائية (أيَّ حرفٍ سمعت؟ · ركّب الكلمة · رتّب
// الجملة)، ومادّةُ هذا التطبيق **حركةُ قلم**: التمرينُ فيه تتبّعٌ أو كتابةٌ حرّة أو
// نسخٌ أو إملاء، ويحكم عليه `pen.js` بشروط `METHOD.md §٣.٣` الأربعة.
//
// قيدان يحكمان هذا الملف — **من اقرأ حرفاً، ويسريان هنا**:
// ١) **لا محتوى جديداً**: المراجعة لا تعرض إلا تمارين المحتوى القائم، فكلُّ نصٍّ
//    تنطقه له ملفٌّ مولَّد أو مكانٌ في `tools/audio_queue.json` — لا نصَّ يُؤلَّف لها.
// ٢) **لا يُطلب كتابةُ ما لم يُدرَّس كتابةً**: مادّتُها من `progress.studiedLetters()`
//    و`studiedForms()` و`studiedWords()` — ما أتمّه الطفل فعلاً، لا ما في المنهج.
//    والحارسُ المقابل على المادّة `tools/check_writable.py` (الجلسة ٣).

import * as progress from './progress.js';
import * as audio from './audio.js';
import { pathOf, WORDS, SENTENCES, SPOKEN_WORDS, SPOKEN_SENTENCES } from './curriculum.js';
import { WORD_PATHS } from './word_paths.js';
import { penSurface, MODES } from './pen.js';
import {
  h, icon, toast, go, arNum, arCount, starsRow, topbar, mascot, cheer, letterName, DEV,
} from './ui.js';

export const SESSION_SIZE = 6;    // جلسة قصيرة تُنجَز في دقائق (لا تُرهق طفل الخامسة)
const ACCENT = 'var(--accent-skills)';   // المراجعة تثبيت مهارات — لونها لون المهارات

/** نجومُ الجلسة — **قاعدتُها في `progress.js`** مع سائر النجوم (الجلسة ٨)، وتُصدَّر
 *  من هنا لمن اعتادها: مصدرٌ واحد لا نسختان. */
export { starsForReview } from './progress.js';
import { starsForReview } from './progress.js';

// ————— سجلُّ التمارين: مُصيِّرٌ لكل نوع قياس —————
//
// والشكل: `VIEWS[kind] = (item, api) => Node` حيث `api` يحمل ما يحتاجه التمرين من
// المحرّك — `{ score, wrong, right, next, say, token }` — فلا يعرف التمرينُ حالةَ
// الجلسة ولا يكتب في ليتنر إلا من مدخلٍ واحد (`score`).
//
// **وامتلأ منه في الجلسة ٥ ما تحمله مادّةُ اليوم**: التتبّعُ والكتابةُ الحرّة على
// **الحروف** — وهما ما يقيسه درسُ الحرف (`lesson.js`). **والنسخُ والإملاءُ يبقيان
// معلَّقَين بعلّتهما**: مادّتُهما كلماتٌ لم تُدرَّس كتابةً بعد (الجلستان ٨ و٩)، ولو
// وُضعا اليوم لَسألا الطفلَ ما لم يتعلّمه — وهو عينُ ما يمنعه `check_writable.py`.
//
// 🔒 **ومن حملة مسار الطفل**: يمرّ بها حبرُه كما يمرّ بدرس الحرف، فتدخل حارسَ
// الخصوصية النصيّ في `tools/test_pen.mjs`.

/**
 * **ما تنطقه المراجعةُ — مُعلَنٌ لا مضمَر** (بابُ الإعلان في `tools/check_speech.mjs`):
 * أسماءُ الحروف من درس الحرف، **وكلماتُ النسخ من المنهج نفسِه** (`SPOKEN_WORDS`) —
 * تُستورَد من مصدرها ولا تُشتقّ هنا ثانيةً: نصٌّ واحد لا مصدران يفترقان.
 *
 * **ولا نصَّ يُؤلَّف للمراجعة** (قيدُها الأول): تمارينُها من مادّة الدرس بأعيانها.
 */
import { LETTER_NAMES } from './lesson.js';

export const SPOKEN = [...LETTER_NAMES, ...SPOKEN_WORDS, ...SPOKEN_SENTENCES];

/** لوحُ الطفل المعلَّق في تمرين المراجعة — يُطلَق مع كل رسمةٍ ومع مغادرة الشاشة. */
let live = null;

/** إطلاقُ لوح المراجعة (نظيرُ `releaseWarmup`) — يناديه الموجّه مع كل رسمة. */
export function releaseReview() {
  live?.destroy();
  live = null;
}

/**
 * **تمرينُ قلمٍ واحد**: يُعرَض الحرفُ من مساره المرجعيّ نفسِه ويُحكَم عليه بالشروط
 * الأربعة (`METHOD.md §٣.٣`) — موجَّهاً في «تتبّع»، وصندوقاً فارغاً في «حرّ».
 *
 * **ولا محتوى جديد**: مادّتُه مهارةٌ في سجلّ الطفل، ونصُّه المنطوق اسمُ الحرف من
 * بنك اقرأ — فلا نصَّ يُؤلَّف للمراجعة (قيدُ `review.js` الأول).
 */
function penExercise(item, api, mode) {
  const ref = pathOf(item.unit, item.form);
  // مهارةٌ لا مسارَ لها (شكلُ موقعٍ لم يُؤلَّف بعد): تُقال ولا تُخفى، ويمضي التمرين
  if (!ref) return h('p', { class: 'hint' }, `لا مسارَ لـ«${item.unit}» بعدُ.`);

  const box = h('div', { class: 'exercise' });
  let faults = 0;
  releaseReview();
  const surface = penSurface({
    ref,
    mode,
    label: `لوحُ مراجعة: ${letterName(item.unit)}`,
    onFault: (fault) => { faults++; progress.recordFault(item.unit, fault.code); },
    onDone: () => {
      api.score(item, item.unit, item.form, faults === 0);
      if (faults === 0) api.right(surface.el);
      else api.wrong(surface.el, () => api.next());
    },
  });
  live = surface;
  // **وسؤالُ اللوح توأمُ التعليمة المنطوقة**، فيتبعها في ألف الوصل: القاعدةُ حكمُها
  // على المنطوق (`docs/AUDIO_QUEUE.md`)، لكنّ الطفلَ يقرأ هذا السطرَ وأذنُه تسمع
  // صورتَه في الشاشات الأخرى — فصورتان لأمرٍ واحدٍ تعليمُ ازدواج.
  box.append(
    h('p', { class: 'ask' }, mode === MODES.FREE ? 'اكْتُبْهُ وحدَك' : 'تتبّعِ المسار'),
    surface.el,
  );
  surface.play();
  surface.el.addEventListener('pointerdown', () => surface.stop(), { capture: true });
  api.say(letterName(item.unit));
  return box;
}

/**
 * **تمرينُ الكلمة والجملة: نسخاً أو إملاءً** (الجلستان ٨ و٩): المادّةُ تُعرَض من
 * مسارها المرجعيّ **بسماحتها ومسطرتِها**، فيُنسَخ عليها (`GUIDED`) أو تُملى في صندوقٍ
 * فارغ (`FREE`) — وهو عينُ ما تفعله محطتاهما.
 *
 * **والإملاءُ نسخٌ نُزع نموذجُه**: الحَكَمُ واحد والمسارُ واحد والمسطرةُ واحدة، ولا
 * يفترق التمرينان إلا فيما **يُرى**. فلا نسختان من الشيفرة تفترقان يوماً في تسجيل
 * الخطأ أو في السؤال.
 *
 * **ولا محتوى جديد**: مادّتُه ممّا في سجلّ الطفل، ونصُّه المنطوق **صوتُها من بنك
 * اقرأ** — فلا نصَّ يُؤلَّف للمراجعة (قيدُ `review.js` الأول).
 */
function wordExercise(item, api, mode) {
  const ref = WORD_PATHS[item.unit];
  if (!ref) return h('p', { class: 'hint' }, `لا مسارَ لـ«${item.unit}» بعدُ.`);
  const dictation = mode === MODES.FREE;
  const sound = WORDS[item.unit]?.say || SENTENCES[item.unit]?.say || null;

  const box = h('div', { class: 'exercise' });
  let faults = 0;
  releaseReview();
  const surface = penSurface({
    ref,
    mode,
    tolerance: ref.tolerance,
    baseline: ref.line,
    label: `${dictation ? 'لوحُ إملاء' : 'لوحُ نسخ'}: ${item.unit}`,
    onFault: (fault) => { faults++; progress.recordFault(item.unit, fault.code); },
    onDone: () => {
      // **ومحورُ المهارة محورُها هي** — لا يُعاد تسميتُه هنا، فيرجع إلى صندوقه بعينه
      api.score(item, item.unit, item.form || progress.WORD_FORM, faults === 0);
      if (faults === 0) api.right(surface.el);
      else api.wrong(surface.el, () => api.next());
    },
  });
  live = surface;
  const sentence = item.form === progress.SENTENCE_FORM;
  // **وحدُّ قاعدة همزة الوصل**: العاريةُ للمنطوق وحدَه (بلاغُ العائلة `hamza-rule-scope`)
  // — عُرِّيت هناك لأنّ المولّد يقرأ ما يُكتب فينطق ضمّةَ الوصل حركةً مطوّلة. **وهذا
  // سطرٌ يُقرأ بالعين لا يُنطَق**، ومادّةُ القراءة تُشكَل كاملةً في تطبيقٍ يعلّم
  // العربية: `اِنْسَخِ` بكسر همزة الوصل، و`اِسْتَمِعْ` مثلُها — وألفُ «اكْتُبِ» في
  // وسط الجملة عاريةٌ **رسماً لا استثناءً** (همزةُ الوصل لا تُشكَل في الدَّرْج).
  box.append(h('p', { class: 'ask' }, dictation
    ? `اِسْتَمِعْ ثُمَّ اكْتُبِ ${sentence ? 'الجملة' : 'الكلمة'}`
    : `اِنْسَخِ ${sentence ? 'الجملة' : 'الكلمة'}`), surface.el);
  surface.play();
  surface.el.addEventListener('pointerdown', () => surface.stop(), { capture: true });
  // **وفي الإملاء الصوتُ هو السؤال كلُّه** — ولا نموذجَ يُرى (`MODES.FREE`)
  if (sound) api.say(sound);
  return box;
}

export const VIEWS = {
  [progress.KINDS.TRACE]: (item, api) => penExercise(item, api, MODES.GUIDED),
  [progress.KINDS.FREE]: (item, api) => penExercise(item, api, MODES.FREE),
  // **والنسخُ امتلأ في الجلسة ٨**: مادّتُه كلماتٌ دُرِّست كتابةً في محطة الوصل،
  // فصار للقياس تمرينٌ يراجعه — وبه تسأل **بوابةُ النسخ** عن أضعف كلماته.
  [progress.KINDS.COPY]: (item, api) => wordExercise(item, api, MODES.GUIDED),
  // **والإملاءُ امتلأ في الجلسة ٩**: مادّتُه ما بلغ الخفوتُ به آخرَه (كلمةً) وما
  // أُمليَ في محطة الجمل (سطراً) — وبه تسأل **بوابةُ الختام** عن أضعف الرحلة كلِّها.
  [progress.KINDS.DICTATE]: (item, api) => wordExercise(item, api, MODES.FREE),
};

/**
 * تمارين جلسةٍ واحدة من مهارات مستحقّة.
 *
 * **مُعلَّقةٌ حتى الجلسة ٥** — وهي عمداً **لا تُخفق ولا تُلفّق**: تعود فارغةً ما دام
 * لا مُصيِّر في `VIEWS` ولا مهارةَ في سجلّ الطفل، فيردّه `main.js` إلى الخريطة
 * برسالته المعتادة («أتمِم درساً أولاً») بدل أن يفتح جلسةً بلا تمرين.
 *
 * @param {object[]} due  المهارات المستحقّة، الأضعف أولاً (من ليتنر)
 * @param {number} size   طول الجلسة
 */
export function buildSession({ due = [], size = SESSION_SIZE } = {}) {
  const out = [];
  for (const skill of due) {
    if (out.length >= size) break;
    if (!VIEWS[skill.kind]) continue;      // نوعٌ لا مُصيِّر له بعدُ: لا يُقحَم
    // ونصُّ التمرين المنطوق للتحميل المسبق: **اسمُ الحرف** للحرف، **وصوتُ الكلمة من
    // بنك اقرأ** للكلمة — ولا نصَّ يُؤلَّف للمراجعة (قيدُها الأول).
    const texts = progress.isWordSkill(skill)
      ? [WORDS[skill.unit]?.say || SENTENCES[skill.unit]?.say].filter(Boolean)
      : [letterName(skill.unit)];
    out.push({ ...skill, texts });
  }
  return out;
}

/** كل النصوص التي قد ينطقها تمرين — للتحميل المسبق ولفحص تغطية الصوت في الاختبارات. */
export function itemTexts(item) {
  return item?.texts ? [...item.texts] : [];
}

// ————— محرّك الجلسة —————
//
// شاشتان تركبانه: «مراجعة اليوم» و«البوابات الثلاث» (`gate.js`). ما يفترقان فيه
// **مادّةُ الجلسة وحكمُ ختامها** لا ميكانيكية التمارين، فبقيت التمارين هنا وحدها لا
// تُنسَخ: نسختان منها تفترقان يوماً في تسجيل الخطأ أو في «لا تلقين للجواب».
//
// @param {() => object[]} make  بناء تمارين المحاولة — يُستدعى في كل إعادة (لا نمط يُحفظ)
// @param {(ctx) => Node} verdict  شاشة الختام: تتلقّى {right, errors, items, again}
// @param {string} pill · accent · leaveAsk  زينة الشاشة وسؤال المغادرة

export function renderSession({ make, verdict, pill, accent = ACCENT, leaveAsk, header = null }) {
  let items = make();
  if (!items.length) return null;   // لا حصيلة بعدُ: main.js يعيده إلى الخريطة

  const state = { index: 0, errors: 0, right: 0, done: false, token: 0 };

  const dots = h('ol', { class: 'dots' });
  const body = h('div', { class: 'lesson-body' });
  let root = null;

  audio.preload(items.slice(0, 2).flatMap(itemTexts));

  function paintDots() {
    dots.replaceChildren(...items.map((item, i) => h('li', {
      class: `dot${!state.done && i === state.index ? ' dot--now' : ''}${state.done || i < state.index ? ' dot--done' : ''}`,
      'aria-label': `تمرين ${arNum(i + 1)}`,
    }, i < state.index || state.done ? '✓' : arNum(i + 1))));
  }

  function paint() {
    audio.stop();
    releaseReview();
    state.token++;
    paintDots();
    const item = items[state.index];
    audio.preload(itemTexts(item));
    const view = VIEWS[item.kind];
    body.replaceChildren(view
      ? view(item, { score, wrong, right, next, say, token: () => state.token, root: () => root })
      // تمرينٌ بلا مُصيِّر لا يقع اليوم (`buildSession` تسقطه)، ويبقى الحارسُ ظاهراً
      // بدل شاشةٍ بيضاء: **العطبُ يُقال ولا يُخفى** (قاعدةُ اقرأ في بلاغات الميدان).
      : h('p', { class: 'hint' }, `لا تمرينَ لهذا النوع بعدُ (${item.kind}).`));
    const ahead = items[state.index + 1];
    if (ahead) audio.preload(itemTexts(ahead));
  }

  function next() {
    if (state.index < items.length - 1) {
      state.index++;
      paint();
    } else {
      finish();
    }
  }

  /** **المدخلُ الوحيد إلى ليتنر** من الجلسة — بمحاور `METHOD.md §٦` الثلاثة. */
  const score = (item, unit, form, correct) => {
    progress.recordAttempt(unit, form, item.kind, correct);
    if (correct) state.right++;
    else state.errors++;
  };

  /**
   * **كلامُ التمرين يمرّ من هنا** (قناةُ ٤ج): يصفّ في القناة كسائر كلام التطبيق،
   * ويُحفَظ وعدُه — **فينتظره الانتقالُ ولا يدهسه**.
   */
  const say = (text) => { spoken = audio.play(text); return spoken; };
  let spoken = Promise.resolve(false);

  /**
   * **الانتقالُ بعد الكلام ينتظر تمامَه** (`ended`) لا مهلةً ثابتة — عهدُ الجلسة ٤ج
   * (`calc@ad59c56`): «التتابعُ ينتظر `ended` لا مهلة».
   *
   * **وكانت هنا مهلتان ثابتتان** (٧٥٠ للصواب و٤٥٠ للخطأ) وُرِثتا من بذرة اقرأ حين لم
   * تكن في التطبيق شاشةٌ ناطقة — فلمّا نطقت أولاها (هذه الجلسة) صارتا العطبَ بعينه:
   * ملفٌّ أطولُ من المهلة يُدهَس في منتصفه. **والفارقُ يُقاس**: حارسُ المتصفّح
   * (`browser_test.html §٧`) يشغّل ملفاً مدّتُه ٩٠٠ مللي — فوق المهلتين معاً.
   *
   * وحين لا يُقال شيءٌ يبقى للعين لحظتُها: وعدٌ مُسوّىً يعود في نبضةٍ واحدة، فيمضي
   * الأثرُ البصريّ ولا يقف الدرس.
   */
  async function after(fn) {
    const mine = state.token;
    await spoken;
    if (mine === state.token) fn();
  }

  /**
   * خطأ: **إرشادٌ لا رفض** (`METHOD.md §٣.٤`). ولا شاشةَ «خطأ» ولا مؤقّت ولا عقاب —
   * وميضُ نقطة البداية وسهمُ الاتجاه يملكهما `pen.js`، وهنا أثرٌ بصريّ فحسب.
   */
  function wrong(el, replay) {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;               // إعادة تشغيل الحركة
    el.classList.add('shake', 'bad');
    setTimeout(() => el.classList.remove('bad'), 700);
    if (replay) after(replay);
  }

  /** صواب: أثرٌ بصريّ ثم التمرين التالي — **بعد تمام ما قيل** (`DESIGN.md §٥`). */
  function right(el) {
    if (el) {
      el.classList.add('good');
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
    }
    after(next);
  }

  // ————— الختام —————

  /** إعادة المحاولة: تمارين تُبنى من جديد (لا نمط يُحفظ) وحالةٌ نظيفة. */
  function again() {
    const fresh = make();
    if (!fresh.length) return void go('#/');
    items = fresh;
    Object.assign(state, { index: 0, errors: 0, right: 0, done: false });
    paint();
  }

  function finish() {
    audio.stop();
    state.done = true;
    state.token++;
    paintDots();
    body.replaceChildren(verdict({ right: state.right, errors: state.errors, items, again }));
  }

  paint();

  root = h('div', { class: 'screen lesson', css: { '--accent': accent } },
    topbar(
      h('button', {
        class: 'btn',
        onclick: () => { if (state.done || state.index === 0 || confirm(leaveAsk)) go('#/'); },
      }, '→ الخريطة'),
      h('span', { class: 'spacer' }),
      h('span', { class: 'pill' }, pill),
    ),
    h('main', { class: 'screen-card' },
      header,
      dots,
      body,
      DEV && h('div', { class: 'dev' },
        h('div', { class: 'dev-title' }, 'أدوات التجربة (?dev=1)'),
        h('div', { class: 'dev-row' },
          h('span', {}, `التمارين: ${items.map((i) => i.kind).join('، ')}`),
          h('button', { class: 'btn', onclick: () => toast(`أخطاء: ${arNum(state.errors)}`) }, 'عدّ الأخطاء'),
          h('button', { class: 'btn', onclick: finish }, 'إنهاء الجلسة الآن'),
        )),
    ),
  );
  return root;
}

// ————— شاشة مراجعة اليوم —————

export function renderReview() {
  const make = () => buildSession({ due: progress.dueSkills() });

  return renderSession({
    make,
    pill: 'مراجعة اليوم',
    leaveAsk: 'تريد الخروج قبل إتمام المراجعة؟',
    verdict: ({ right, errors, items }) => {
      progress.markReview(right + errors, right);
      const stars = starsForReview(errors, items.length);
      const streak = progress.reviewStreak();
      const line = errors === 0
        ? cheer('مراجعة بلا خطأ واحد!')
        : `أصبتَ ${arNum(right)} من ${arNum(right + errors)} محاولة — وما أخطأتَ فيه يعود غداً.`;

      return h('div', { class: 'celebrate' },
        mascot('mascot mascot--cheer'),
        h('div', { class: 'celebrate-face' }, icon('repeat')),
        h('h2', {}, 'أتممتَ مراجعة اليوم!'),
        starsRow(stars, 'big-stars'),
        h('p', { class: 'hint' }, line),
        streak > 1 && h('p', { class: 'note' },
          icon('flame'),
        ` ${arCount(streak, ['يوم', 'يومان متتاليان', 'أيام متتالية', 'يوماً متتالياً'])} من المراجعة`),
        h('div', { class: 'row foot' },
          h('button', { class: 'btn btn--primary', onclick: () => go('#/') }, '→ الخريطة')),
      );
    },
  });
}
