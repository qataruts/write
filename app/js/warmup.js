// شاشةُ **التهيئة الحركية** — المرحلةُ الأولى في `METHOD.md §٤`، قبل أوّل حرف:
// خطوطٌ أفقية ورأسية ومائلة · منحنياتٌ ودوائرُ باتجاهٍ صحيح · موجاتٌ وحلقات ·
// تحكّمٌ داخل حدود. ومحطاتُها الستُّ من `curriculum.js`، ومساراتُها من
// `warmups.js` (تؤلّفها عدّةُ `tools/make_paths.html §٧ب` هندسةً محسوبة).
//
// **وهي أوّلُ شاشةٍ يمسّها الطفل في هذا التطبيق**، فحقُّها أن تُفهَم بلا شرح:
//   · **الحركةُ تُعرَض قبل أن تُطلَب** — العرضُ المتحرك يبدأ من نفسه عند فتح الشكل
//     (`METHOD.md §٥.١`: «شاهِد»)، فيرى الطفلُ ما يُنتظَر منه ولا يُقرأ له سطر.
//   · **ولمسُ اللوح يقطع العرضَ ويبدأ الكتابة** — لا زرَّ بينهما.
//   · **ولا نصَّ منطوقاً ولا مؤقّتَ ولا شاشةَ خطأ**: الإخفاقُ إرشادٌ (وميضُ البداية
//     وسهمُ الاتجاه من `pen.js`)، والإعادةُ بلا حدّ (`METHOD.md §٣.٤`).
//
// **القياس** (بند الجلسة ٤ على قرار الجلسة ٣ المُقَرّ): تكتب هذه المحطاتُ **نجومَها
// وتقدّمَها وأخطاءَ اتجاهها** من أوّل محطة — **ولا تكتب في ليتنر**: مفتاحُه
// `(وحدة × شكلُ موقع × تمرين)` ولا شكلَ موقعٍ لخطٍّ ولا لدائرة، فقياسُها فيه يُدخِل
// في لوحة الحروف ما ليس حرفاً. وإعفاؤها مكتوبٌ بسببه في `tools/test_measure.mjs`،
// **ويحرسه الفاحصُ نصّاً**: يومَ يُكتب في هذا الملفّ `recordAttempt` يحمرّ.
//
// 🔒 **ومن حملة مسار الطفل**: يمرّ بها حبرُه (تتلقّى أخطاءَه من المحرّك)، فتدخل
// حارسَ الخصوصية النصيّ في `tools/test_pen.mjs` — لا شبكةَ ولا رفعَ ولا عنوانَ
// خارجيّ. وما يُخزَّن **عددٌ باسم خطئه** لا إحداثيُّ نقطة.

import * as progress from './progress.js';
import { WARMUPS } from './warmups.js';
import { penSurface } from './pen.js';
// **مقابضُ الراحة وحدَها** (وضعُ الدعم، جلسة د): محطةُ التهيئة لا مهارةَ لها في ليتنر
// ولا صندوق — فلا «أوّلَ لقاءٍ» يُحدّ به إذنُ السماحة، ولا تستورد `easeFor` ألبتّة.
import { demoPace } from './support.js';
import { starsForReview } from './review.js';
import {
  h, icon, go, arNum, starsRow, topbar, brandMark, mascot, cheer, faceEl, nodeTitle,
  traceFace,
} from './ui.js';

/** محطةُ التهيئة بجزئها — من الرحلة نفسِها، فلا يُكتب معرّفُ محطةٍ بيد. */
const warmupNode = (part) => progress.allNodes()
  .find((node) => node.type === 'warmup' && node.part === part) || null;

/** الأجزاءُ التي لها أشكالٌ مؤلَّفة — يقرؤها الفاحصُ والشاشةُ من مصدرٍ واحد. */
export const warmupParts = () => Object.keys(WARMUPS);

let live = null;

/** إطلاقُ اللوح عند مغادرة الشاشة — يناديها الموجّه مع كل رسمة (نظيرُ `releasePen`). */
export function releaseWarmup() {
  live?.destroy();
  live = null;
}

/**
 * شاشةُ محطةِ تهيئةٍ واحدة: أشكالُها بترتيبها، لوحٌ لكلٍّ، ثم نجومُ المحطة.
 * @param {string} part جزءُ المحطة كما في `curriculum.js` (`lines-h` …)
 * @returns {Node|null} `null` إن لم تكن المحطةُ من محطات التهيئة
 */
export function renderWarmup(part) {
  const station = WARMUPS[part];
  const node = warmupNode(part);
  if (!station || !node || node.type !== 'warmup') return null;

  const shapes = station.shapes;
  const state = { index: 0, faults: 0, done: false };

  const dots = h('ol', { class: 'dots' });
  const board = h('div', { class: 'warmup-board' });
  const foot = h('div', { class: 'row foot' });
  const title = h('h1', { class: 'warmup-title' }, nodeTitle(node));
  const hint = h('p', { class: 'hint' });

  const screen = h('div', {},
    topbar(
      h('button', {
        class: 'btn btn--ghost',
        'aria-label': 'عودةٌ إلى الخريطة',
        onclick: () => go('#/'),
      }, '→ الخريطة'),
      h('span', { class: 'spacer' }),
      // **ولا يُكتب العنوانُ مرّتين**: هو في صدر الشاشة، وهنا العلامةُ كما في سائر
      // الشاشات — أمسكت التكرارَ لقطةٌ بالعين.
      brandMark(),
    ),
  );

  function paintDots() {
    dots.replaceChildren(...shapes.map((shape, i) => h('li', {
      class: `dot${!state.done && i === state.index ? ' dot--now' : ''}`
        + `${state.done || i < state.index ? ' dot--done' : ''}`,
      'aria-label': `شكل ${arNum(i + 1)}`,
    }, state.done || i < state.index ? '✓' : arNum(i + 1))));
  }

  /** يبني لوحَ الشكل الحالي — النموذجُ والحَكَمُ من `ref` واحد (`METHOD.md §٣.٢`). */
  function mount() {
    releaseWarmup();
    const shape = shapes[state.index];
    hint.textContent = shape.note;
    const surface = penSurface({
      ref: shape.ref,
      tolerance: shape.tolerance,
      pace: demoPace(),
      bounds: Boolean(shape.bounds),
      label: `لوحُ تهيئة: ${shape.note}`,
      // **كلُّ خطأٍ يُسجَّل باسمه** (`METHOD.md §٦`) — ووحدتُه محطةُ التهيئة،
      // فتقرأ لوحةُ وليّ الأمر «يعكس اتجاه الحركة في الدوائر» لا رقماً مبهماً.
      onFault: (fault) => {
        state.faults++;
        progress.recordFault(part, fault.code);
      },
      onDone: () => step(),
    });
    live = surface;
    board.replaceChildren(surface.el);
    // (كان العرضُ يبدأ من نفسه — ونُسخ بالقاعدة الواحدة أدناه؛ فيُفهَم المطلوبُ بلا شرحٍ ولا زرّ.
    // **العرضُ التلقائيّ لا يفتح لوحَ كتابة** (توحيدُ بلاغ المالك، ٢٣ أغسطس
    // ٢٠٢٦ — القاعدةُ الواحدة في كل الشاشات): القلمُ بيد الطفل من أول لمسة،
    // والإعادةُ بزرّ الطلب.
    
    surface.el.addEventListener('pointerdown', () => surface.stop(), { capture: true });
    paintDots();
  }

  /** شكلٌ استُوفي: إلى الذي يليه، أو إلى ختام المحطة. */
  function step() {
    if (state.index < shapes.length - 1) {
      state.index++;
      setTimeout(mount, 420);        // لحظةٌ يرى فيها حبرَه مكتملاً قبل الشكل التالي
      return;
    }
    finish();
  }

  /**
   * ختامُ المحطة: نجومٌ بحكم المراجعة نفسِه (`starsForReview`) — ثلاثٌ بلا خطأ،
   * فاثنتان ما دامت الأخطاءُ ≤ عدد الأشكال، وإلا واحدة. **ولا رسوبَ ولا صفر**:
   * من أتمّ أشكالَه فقد كتبها كلَّها صحيحةً في النهاية (المحرّكُ لا يُمرّر جزءاً
   * إلا مستوفىً)، والأخطاءُ في الطريق تُقاس ولا تُعاقَب.
   */
  function finish() {
    // **أثرُ الطفل يُنسَخ قبل أن يُطوى اللوح**: `releaseWarmup` تُطلق اللوحَ وتمحو
    // مقبضَه، ولوحُ الشكل يُستبدَل بالاحتفال بعده — فما لم يُؤخذ الآن ضاع.
    const trace = live?.ink() ?? [];
    releaseWarmup();
    state.done = true;
    const stars = starsForReview(state.faults, shapes.length);
    progress.setStars(node.id, stars);
    paintDots();
    hint.textContent = '';
    board.replaceChildren(h('div', { class: 'celebrate' },
      mascot('mascot mascot--cheer'),
      // **الميداليةُ تحمل ما كتبه هو** (حكمُ المالك، `REVIEW_IDENTITY.md §٣ج`) — أثرَ
      // آخر شكلٍ أتمّه بيده. وإن خلت يدُه من أثرٍ (لوحٌ لم يُكتب عليه) عادت أيقونةُ
      // القلم كما كانت، فلا يبقى القرصُ فارغاً.
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
          paintFoot();
          mount();
        },
      }, '↻ أعِد المحطة'),
    );
  }

  function paintFoot() {
    foot.replaceChildren(
      h('button', {
        class: 'btn btn--primary next',
        onclick: () => { live?.reset(); live?.play(); },
      }, icon('pen'), ' شاهِدْ'),
      h('button', {
        class: 'btn next',
        onclick: () => { live?.reset(); },
      }, '↻ أعِدْ'),
      // **مرسومُ المضيّ (٢٣ أغسطس ٢٠٢٦)**: «دع الطفل يمشي ولا توقفه» — زرُّ
      // المضيّ حاضرٌ دائماً لا بعد التعثّر: يسجّل بصدقٍ (ليتنر يعيد التكرار،
      // ولوحةُ وليّ الأمر تقرأ «مضى قبل تمام القبول») ثم يمضي.
      h('button', { class: 'btn next', onclick: () => step() }, 'تَابِعْ →'),
    );
  }

  const main = h('main', { class: 'screen warmup' }, title, dots, board, hint, foot);
  screen.append(main);
  paintFoot();
  mount();
  return screen;
}
