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
import {
  h, icon, toast, go, arNum, arCount, starsRow, topbar, mascot, cheer, DEV,
} from './ui.js';

export const SESSION_SIZE = 6;    // جلسة قصيرة تُنجَز في دقائق (لا تُرهق طفل الخامسة)
const ACCENT = 'var(--accent-skills)';   // المراجعة تثبيت مهارات — لونها لون المهارات

/** نجوم الجلسة: ٣ بلا خطأ، ٢ ما دامت الأخطاء ≤ عدد التمارين، وإلا ١ (عتبة متناسبة). */
export const starsForReview = (errors, items) => (errors === 0 ? 3 : errors <= items ? 2 : 1);

// ————— سجلُّ التمارين: مُصيِّرٌ لكل نوع قياس —————
//
// **مُعلَّقٌ فارغاً بعلّته** (`SESSIONS.md` الجلسة ٠/٤: «ما لا موضوعَ له بعدُ يُعلَّق
// بإعفاءٍ مكتوبٍ بسببه لا يُحذف»): تمارينُ اكتب تحتاج **محرّك القلم** (`pen.js`،
// الجلسة ١) و**المساراتِ المرجعية** (الجلسة ٢) و**المنهجَ المشتقّ** (الجلسة ٣) —
// ولا واحدٌ منها قائمٌ اليوم. **فالجلسة ٥ تملؤه** بتمارين `KINDS` الأربعة.
//
// والشكل: `VIEWS[kind] = (item, api) => Node` حيث `api` يحمل ما يحتاجه التمرين من
// المحرّك — `{ score, wrong, right, next, token }` — فلا يعرف التمرينُ حالةَ الجلسة
// ولا يكتب في ليتنر إلا من مدخلٍ واحد (`score`).
export const VIEWS = {};

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
    out.push({ ...skill });
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
    state.token++;
    paintDots();
    const item = items[state.index];
    audio.preload(itemTexts(item));
    const view = VIEWS[item.kind];
    body.replaceChildren(view
      ? view(item, { score, wrong, right, next, token: () => state.token, root: () => root })
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
   * خطأ: **إرشادٌ لا رفض** (`METHOD.md §٣.٤`). ولا شاشةَ «خطأ» ولا مؤقّت ولا عقاب —
   * وميضُ نقطة البداية وسهمُ الاتجاه يملكهما `pen.js`، وهنا أثرٌ بصريّ فحسب.
   */
  function wrong(el, replay) {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;               // إعادة تشغيل الحركة
    el.classList.add('shake', 'bad');
    setTimeout(() => el.classList.remove('bad'), 700);
    if (replay) setTimeout(replay, 450);
  }

  /** صواب: أثرٌ بصريّ ثم التمرين التالي — بمهلةٍ يُسمَع فيها الفاصل (`DESIGN.md §٥`). */
  function right(el) {
    if (el) {
      el.classList.add('good');
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
    }
    setTimeout(next, 750);
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
