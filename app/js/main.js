// نقطة الدخول: خريطة الرحلة (محطات `METHOD.md §٤`) والتوجيه بين الشاشات.
//
// **من بذرة اقرأ** (`FAMILY.md §٥`: «**هيكلُ** `main.js` — الموجّه/الخريطة/الأدراج»).
// فالمنقولُ الهيكلُ: الخريطةُ الكسولة بأدراجها، وخيطُ الدرب، وبطاقةُ «تابع من هنا»،
// وبطاقةُ المراجعة، والقفلُ في الموجّه لا في الأزرار وحدها، وساعةُ الاستخدام،
// وتسجيلُ عامل الخدمة، وشريطُ المعاينة.
//
// **وشاشاتُ اقرأ لم تُنقَل** (درسُ الحرف واللعبةُ والقصةُ والبستانُ والسورة): مادّةُ
// هذا التطبيق شاشاتُه هو، وتُبنى في جلساتها — والموجّهُ أدناه يعلن كلَّ نوعٍ ينتظر
// شاشتَه ومَن يملكها، فلا نوعَ يسقط صامتاً.

import * as progress from './progress.js';
import * as audio from './audio.js';
import * as install from './install.js';
import * as probe from './probe.js';
import { renderReview } from './review.js';
import { renderGate } from './gate.js';
import { renderParent, skillsText } from './parent.js';
import { renderPenDev, releasePen } from './pendev.js';
import { renderWarmup, releaseWarmup } from './warmup.js';
import {
  h, icon, faceEl, toast, go, arNum, starsRow, topbar, brandMark, shake,
  nodeTitle, nodeFace, nodeWhere, accentForKind, landmark, stageTitle, DEV,
} from './ui.js';

const app = document.getElementById('app');

// ————— خريطة الرحلة —————
//
// **الخريطة كسولة** (بلاغ مالك اقرأ: بطء أواخر الرحلة على آيباد قديم): الرحلة عشرات
// المحطات، ورسمُها كلها في كل مرة يُثقل الجهاز بما لا ينظر إليه الطفل. فالبعيد عن
// جبهته بطاقةُ عنوانٍ مطوية تُفرد بنقرة — ينكمش DOM الصفحة أضعافاً، ولا تبعد أيّ
// عقدة عن الطفل أكثر من نقرتين (افرِد المحطة، ثم اختر العقدة).

const FOLD_NEAR = 2;          // محطتان قبل جبهة الطفل ومحطتان بعدها مفرودتان ابتداءً
const unfolded = new Set();   // ما فرده الطفل بيده — يبقى مفروداً ما دامت الجلسة

/** معلمُ المحطة بنوعها — **من عالمنا: القلمُ والأثر** (`REVIEW_IDENTITY.md §٣أ`). */
const MARKS = {
  warmup: 'wave',     // قلمٌ يمرّ فيترك موجة: أوّلُ أثرٍ قبل أيّ حرف
  letter: 'start',    // نقطةُ بدايةٍ وسهمُ اتجاه — لسانُ المحرّك نفسُه
  form: 'places',     // ثلاثةُ آثارٍ على سطر: الحرفُ في مواضعه
  join: 'join',       // أثران يلتقيان بخطٍّ لا يُرفَع فيه القلم
  fade: 'fade',       // أثرٌ يخفت ويدُ الطفل تُتمّه — الخفوتُ ثم الإملاء
  sentence: 'lines',  // مسطرةُ الكرّاسة وعليها سطر: الجملة
  gate: 'gate',       // البوابة تبقى بوابة — مفصلٌ في الرحلة لا مشهدٌ من عالم
};

/** المحطة التي عليها جبهة الطفل — وآخرُ محطة إن أتمّ الرحلة كلها. */
function focusIndex(sections, next) {
  if (!next) return sections.length - 1;
  const index = sections.findIndex((s) => s.nodes.includes(next));
  return index < 0 ? 0 : index;
}

function renderMap() {
  const earned = progress.totalStars();
  const next = progress.nextNode();

  const screen = h('div', {},
    topbar(
      brandMark('h1'),
      h('span', { class: 'spacer' }),
      h('button', {
        class: 'btn btn--ghost',
        'aria-label': 'لوحة وليّ الأمر',
        onclick: () => go('#/parent'),
      }, icon('family')),
      h('span', { class: 'pill pill--stars' }, `★ ${arNum(earned)} / ${arNum(progress.maxTotalStars())}`),
    ),
  );

  const main = h('main', { class: 'map' });

  const review = reviewCard();
  if (review) main.append(review);

  const sections = progress.journey();

  if (next) {
    // **وبطاقةُ «تابع من هنا» أوّلُ ما تناله يدُ الطفل** — فهي أوّلُ مَن يجيب حين
    // تكون جبهتُه محطةً لم تُبنَ شاشتُها بعد (`comingSoon` أدناه، بلاغُ الميدان ١).
    const card = h('button', {
      class: 'continue',
      css: { '--accent': accentForKind(next.type) },
      onclick: () => (awaitingScreen(next.type) ? comingSoon(next.type, card) : openNode(next)),
    },
      faceEl(nodeFace(next), 'continue-face'),
      h('span', { class: 'continue-text' },
        h('b', {}, nodeTitle(next)),
        h('small', {}, `تابع من هنا · ${nodeWhere(next)}`)),
    );
    main.append(card);
  } else if (sections.length) {
    main.append(h('p', { class: 'note' },
      icon('party'), ' أتممتَ الرحلة كلها — من أول خطٍّ إلى الإملاء!'));
  } else {
    /* **الخريطةُ الفارغة تقول إنّها فارغة** (الجلسة ٠): لا محطةَ بعدُ لأن المنهج
       يُشتقّ آلياً من بيانات اقرأ في الجلسة ٣ — والصمتُ هنا يُقرأ عطباً. وهذا
       السطرُ **يسقط من نفسه** يومَ تدخل أولُ محطة، فلا يبقى نصٌّ ميّت. */
    main.append(h('p', { class: 'note' },
      'لا محطةَ في الرحلة بعدُ — يُشتقّ المنهج من بيانات «اِقْرَأْ» في الجلسة ٣.'));
  }

  // الدرب المتعرج: انعطافة خيط بين كل محطتين، يمنةً مرة ويسرةً مرة (DESIGN §٦)
  const focus = focusIndex(sections, next);
  let stations = 0;
  for (const [index, section] of sections.entries()) {
    if (stations++) main.append(trailEl(stations % 2 === 0));
    // المطويّ: ما بَعُد عن جبهة الطفل ولم يفرده بيده في هذه الجلسة
    const folded = Math.abs(index - focus) > FOLD_NEAR && !unfolded.has(section.id);
    main.append(section.kind === 'gate'
      ? gateEl(section, next, folded)
      : stationEl(section, stations, next, folded));
  }

  if (DEV) {
    main.append(h('div', { class: 'dev' },
      h('div', { class: 'dev-title' }, 'أدوات التجربة (?dev=1) — لا تظهر للطفل'),
      h('div', { class: 'dev-row' },
        h('button', { class: 'btn', onclick: () => go('#/pen') }, 'محرّك القلم'),
        h('button', { class: 'btn', onclick: () => fillAll(1) }, 'أنجِز الكل بنجمة'),
        h('button', { class: 'btn', onclick: () => fillAll(3) }, 'أنجِز الكل بثلاث'),
        h('button', {
          class: 'btn',
          onclick: () => {
            if (!confirm('محو كل تقدّم الطفل؟')) return;
            progress.reset();
            toast('حُذف التقدّم');
            render();
          },
        }, 'محو التقدّم'),
      )));
  }

  // **بابُ التعريف**: من فتح التطبيق وأراد أن يعرف ما هو — معلّمٌ أو وليّ أمرٍ بلغه
  // الرابطُ رأساً — يجد بابَه في **ذيل** الخريطة لا في صدرها، فلا يزاحم درسَ الطفل.
  // **وهو انتقالُ صفحةٍ لا تنقّلُ تطبيق** (`welcome/` خارج التطبيق وخارج قشرته)،
  // ولذلك **لا يعمل دون إنترنت** — وهو مقصود.
  main.append(h('a', { class: 'map-about', href: 'welcome/' },
    'تعريفٌ بالمنهج — للمعلّم ووليّ الأمر ←'));

  screen.append(main);
  return screen;
}

/**
 * بطاقة «مراجعة اليوم» فوق الخريطة: تظهر متى صار للطفل حصيلة يُراجَع فيها،
 * وتتقدّم على «تابع من هنا» لأن تثبيت المتزعزع أولى من درس جديد يُبنى عليه.
 */
function reviewCard() {
  const letters = progress.studiedLetters();
  if (letters.length < 2) return null;   // لا حصيلة بعدُ: لا مراجعة

  const due = progress.dueSkills().length;
  const done = Boolean(progress.reviewOf());
  const line = done ? 'تمّت مراجعة اليوم — يمكنك إعادتها'
    : due ? `حان وقت تثبيت ${skillsText(due)}`
      : 'تمارين سريعة مما كتبته';

  return h('button', {
    class: `continue continue--review${done ? ' continue--done' : ''}`,
    onclick: () => go('#/review'),
  },
    faceEl(done ? '✓' : icon('repeat'), 'continue-face'),
    h('span', { class: 'continue-text' },
      h('b', {}, 'مراجعة اليوم'),
      h('small', {}, line)),
  );
}

/** محطةٌ على الدرب — مصيّرٌ واحد لأنواع المحطات كلِّها، يقرأ عنوانَها من بيانها. */
function stationEl(section, order, next, folded) {
  const stage = section.stage;
  const unlocked = progress.isNodeUnlockedById(section.nodes[0]?.id);
  const complete = section.nodes.every((n) => progress.isDone(n.id));
  const earned = section.nodes.reduce((sum, n) => sum + progress.getStars(n.id), 0);

  return trackEl({
    id: section.id,
    folded,
    className: `station station--${section.kind}${unlocked ? '' : ' station--locked'}${complete ? ' station--done' : ''}`,
    accent: accentForKind(section.kind),
    mark: MARKS[section.kind],
    label: `${stageTitle(stage)}${unlocked ? '' : ' — مقفلة'}`,
    badge: stage.face || arNum(order),
    title: stageTitle(stage),
    sub: stage.sub || section.nodes.map(nodeTitle).join(' · '),
    meta: unlocked
      ? [h('b', {}, `★ ${arNum(earned)}`), ` / ${arNum(section.nodes.length * progress.MAX_STARS)}`]
      : [icon('lock'), ' مقفلة'],
    nodes: section.nodes,
    next,
  });
}

/**
 * محطة «بوابة» (`METHOD.md §٤`): عقدةٌ واحدة قبل المفصل الكبير — لا تُجتاز بالإتمام
 * بل بالإصابة. تُعلن حالها صراحةً على الخريطة كي يعرف الطفل — ووليّ أمره — لِمَ
 * توقّفت الرحلة هنا.
 */
function gateEl(section, next, folded) {
  const node = section.nodes[0];
  const unlocked = progress.isNodeUnlockedById(node.id);
  const open = progress.isDone(node.id);

  return trackEl({
    id: section.id,
    folded,
    className: `station station--gate${unlocked ? '' : ' station--locked'}${open ? ' station--done' : ''}`,
    accent: accentForKind('gate'),
    mark: MARKS.gate,
    label: `${section.gate.title}${unlocked ? '' : ' — مقفلة'}`,
    badge: section.gate.face ?? icon('gate'),
    title: section.gate.title,
    sub: open ? 'اجتزتَها — الطريق مفتوح' : section.gate.hint,
    meta: unlocked ? (open ? '✓ مجتازة' : 'عشرة تمارين') : [icon('lock'), ' مقفلة'],
    nodes: section.nodes,
    next,
  });
}

/**
 * انعطافة خيط الدرب بين محطتين — زخرفة صامتة. تتكرّر عشرات المرات في كل رسمة،
 * فيُحلَّل رسمها مرة واحدة ثم يُستنسخ (تحليل HTML أغلى من نسخ عقدة جاهزة).
 */
let trailTemplate = null;
function trailEl(flip) {
  if (!trailTemplate) {
    trailTemplate = h('div', { class: 'trail', 'aria-hidden': 'true' });
    trailTemplate.innerHTML = `<svg viewBox="0 0 72 36" fill="none">
      <path d="M14 2 C 40 10, 32 26, 58 34" stroke="var(--ink-soft)" stroke-width="3"
        stroke-linecap="round" stroke-dasharray="1 8" opacity=".55"/></svg>`;
  }
  const el = trailTemplate.cloneNode(true);
  if (flip) el.classList.add('trail--flip');
  return el;
}

/**
 * محطة على الدرب. المطويّة تُرسَم عنواناً وحده في زرّ يفردها — فيبقى الطفل يرى
 * أين هو ومَن حوله (اسم المحطة ونجومها وقفلها كما هي)، ولا يُبنى من العقد إلا ما
 * يقع تحت بصره. وفرْدُها يبقى ما دامت الجلسة، فلا تُطوى تحت يده كلما عاد إليها.
 */
function trackEl({ id, folded, className, accent, mark, label, badge, title, sub, meta, nodes, next }) {
  const station = h('section', { class: className, css: { '--accent': accent }, 'aria-label': label });
  let open = !folded;

  function paint() {
    station.classList.toggle('station--folded', !open);
    const inner = [
      faceEl(badge, 'station-num'),
      h('div', {},
        h('h2', {}, title),
        h('p', { class: 'station-letters' }, sub),
      ),
      h('div', { class: 'station-meta' }, meta),
    ];

    /* **الدُّرج يُفتَح ويُغلَق** (بلاغ مالك اقرأ): الرأسُ **زرٌّ في الحالين** —
       علامتُه `▾` مطويّةً و`▴` مفتوحة، و`aria-expanded` يقول حالَه لقارئ الشاشة،
       فيُعرَف الدُّرجُ بالنظر وباللمس. */
    const head = h('button', {
      class: 'station-head station-head--fold',
      'aria-expanded': open ? 'true' : 'false',
      'aria-label': `${label} · انقر ${open ? 'لضمّ عقدها' : 'لعرض عقدها'}`,
      onclick: () => {
        open = !open;
        if (open) unfolded.add(id); else unfolded.delete(id);
        paint();
      },
    }, inner, h('span', { class: 'fold-sign', 'aria-hidden': 'true' }, open ? '▴' : '▾'));

    if (!open) {
      station.replaceChildren(head);
      return;
    }

    const track = h('ol', { class: 'track' });
    for (const node of nodes) track.append(h('li', {}, nodeButton(node, next)));
    station.replaceChildren(head, track);
    if (mark) station.append(landmark(mark));
  }

  paint();
  return station;
}

/**
 * معلم «إعادة» على العقدة المنجَزة: سهمٌ دائريّ خفيف على حافتها، لا إيموجي
 * (`DESIGN.md §٦`)، ولا يزاحم وجهها. ويتكرّر بعدد العقد المنجَزة في كل رسمة،
 * فيُحلَّل مرة ويُستنسخ (كما خيط الدرب).
 */
let replayTemplate = null;
function replayMark() {
  if (!replayTemplate) {
    replayTemplate = h('span', { class: 'node-replay', 'aria-hidden': 'true' });
    replayTemplate.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1"/><path d="M20.5 3.5v5h-5"/></svg>`;
  }
  return replayTemplate.cloneNode(true);
}

function nodeButton(node, next) {
  const stars = progress.getStars(node.id);
  const open = progress.isNodeUnlockedById(node.id);
  const isNext = next && next.id === node.id;
  const label = nodeTitle(node);
  const state = !open ? 'locked' : stars ? 'done' : 'open';

  const btn = h('button', {
    class: `node node--${node.type} node--${state}${isNext ? ' node--next' : ''}`,
    'aria-label': `${label} — ${open ? (stars ? `${arNum(stars)} نجوم · يمكن إعادته` : 'مفتوح') : 'مقفل'}`,
    onclick: () => {
      if (!open) {
        shake(btn);
        toast('أكمِل ما قبله أولاً', 'smile');
        return;
      }
      // **جبهةُ الرحلة تجيب كما يجيب المقفل** (بلاغُ الميدان ١): محطةٌ مفتوحةٌ لم
      // تُبنَ شاشتُها بعدُ **لا تصمت** — الهزّةُ نفسُها والرسالةُ تُقرأ، ولا انتقالَ.
      if (awaitingScreen(node.type)) {
        comingSoon(node.type, btn);
        return;
      }
      openNode(node);
    },
  },
    faceEl(open ? nodeFace(node) : h('span', { class: 'node-lock' }, icon('lock')), 'node-face'),
    starsRow(stars),
    state === 'done' && replayMark(),
  );

  if (isNext) btn.dataset.next = '1';
  return btn;
}

function openNode(node) {
  go(`#/${node.type}/${encodeURIComponent(node.part)}`);
}

function fillAll(stars) {
  for (const node of progress.allNodes()) progress.setStars(node.id, stars);
  toast('حُدِّث التقدّم');
  render();
}

// ————— التوجيه —————
//
// أي مسار غير معروف يعود بالطفل إلى الخريطة، ولا يعرض له خطأً.
//
// **وجردُ الشاشات المنتظَرة مكتوبٌ لا مضمَر** (`SCREENS` أدناه): كلُّ نوعِ محطةٍ في
// `METHOD.md §٤` له سطرٌ يقول مَن يملك شاشتَه — فنوعٌ بلا شاشةٍ يُعرَف بالنظر، ولا
// يقع الطفلُ على طريقٍ مسدود. والسطرُ يُحذف يومَ تُكتب شاشتُه لا قبلها.

const SCREENS = {
  letter: 'درس الحرف المعزول — الجلسة ٥',
  form: 'أشكال المواقع — الجلسة ٧',
  join: 'الوصل والنسخ — الجلسة ٨',
  fade: 'خفوت النموذج والإملاء — الجلسة ٩',
  sentence: 'الجمل القصيرة — الجلسة ٩',
};

// ————— جوابُ الجبهة (بلاغُ الميدان ١، ١١ أغسطس ٢٠٢٦ — الجلسة م١) —————
//
// **العلّة من الميدان**: «المجموعة الثانية وصلتْ لها لكنّ أوّل حصةٍ لم تفتح». وكان
// الجوابُ خلف `DEV` وحدَه، فنقرةُ الطفل **تصمت** — والصمتُ يُقرأ عطباً: بدا التطبيقُ
// معطّلاً وهو يعمل كما بُني. **والصمتُ للطفل أسوأُ من الخطأ**: المقفلُ عنده يهتزّ
// ويجيب، فمحطةٌ بلغها ولم تُبنَ شاشتُها أحقُّ بالجواب لا أهونُ.
//
// وهو **جوابُ المقفل نفسُه** (هزّةٌ ورسالةٌ تُقرأ) لأنه من جنسه: بابٌ لم يُفتح بعدُ.
// **ولا صوتَ يُضاف** — سطرُ شاشةٍ يُقرأ، و`audio_queue.json` لا يُمَسّ.
const SOON = 'قَرِيبًا… هذه المحطةُ تُعَدُّ لك';

/** أمحطةٌ مفتوحةٌ لم تُبنَ شاشتُها بعد؟ — من جرد `SCREENS` وحدَه، فلا قائمةَ ثانية تشيخ. */
const awaitingScreen = (type) => Boolean(SCREENS[type]);

/**
 * جوابُ الجبهة: هزّةٌ ورسالةٌ — **ولا انتقالَ** إلى شاشةٍ ترُدّ الطفلَ من حيث أتى.
 * وفي `?dev=1` وحدَها يُزاد مَن يملك الشاشةَ ومتى — ذاك للبانِي لا للطفل.
 */
function comingSoon(type, el) {
  if (el) shake(el);
  toast(DEV ? `${SOON} — ${SCREENS[type]}` : SOON, 'smile');
}

let renderToken = 0;

async function render() {
  audio.stop();
  // إطلاقُ لوح الكتابة مع كل رسمة — نظيرُ `recorder.release()` في اقرأ: لا يبقى
  // للوحٍ غادره الطفلُ أثرٌ معلَّقٌ على النافذة. (ولكلِّ شاشةٍ تبني لوحاً إطلاقُها.)
  releasePen();
  releaseWarmup();
  const token = ++renderToken;
  const [name, arg1] = location.hash.replace(/^#\/?/, '').split('/');

  // القفل يُحرس في التوجيه أيضاً، لا في أزرار الخريطة وحدها
  const guard = (id) => {
    if (!progress.findNode(id)) return true;          // عقدة لا وجود لها: الشاشة تردّه للخريطة
    if (progress.isNodeUnlockedById(id)) return true;
    toast('أكمِل ما قبله أولاً', 'smile');
    location.replace('#/');
    return false;
  };

  let screen;
  if (name === 'gate' && arg1) {
    if (!guard(`gate:${decodeURIComponent(arg1)}`)) return;
    screen = renderGate(decodeURIComponent(arg1)) || renderMap();
  } else if (name === 'review') {
    screen = renderReview();
    if (!screen) {                       // لا حصيلة للمراجعة بعدُ
      toast('أتمِم درساً أولاً، ثم تأتي المراجعة', 'smile');
      location.replace('#/');
      return;
    }
  } else if (name === 'parent') {
    screen = renderParent(render);
  } else if (name === 'warmup' && arg1) {
    // محطةُ تهيئةٍ حركية (الجلسة ٤): القفلُ يُحرس هنا كما يُحرس في أزرار الخريطة،
    // ومحطةٌ لا أشكالَ لها تردّ `null` فيعود الطفلُ إلى خريطته بلا شاشةٍ بيضاء.
    // **ومعرّفُ العقدة يُقرأ من الرحلة لا يُركَّب هنا**: الموجّهُ يفتح بالنوع والجزء،
    // ومعرّفُها من صنع `progress.nodeId` وحدَه — فلا سابقةُ محطةٍ تُكتب في موضعين.
    const part = decodeURIComponent(arg1);
    const node = progress.allNodes().find((n) => n.type === 'warmup' && n.part === part);
    if (node && !guard(node.id)) return;
    screen = (node && renderWarmup(part)) || renderMap();
  } else if (name === 'pen') {
    // صفحةُ تجربة محرّك القلم (الجلسة ١) — خلف `?dev=1` وحدها، و`renderPenDev`
    // تردّ `null` بدونها فيعود الطفلُ إلى خريطته.
    screen = renderPenDev() || renderMap();
  } else if (SCREENS[name]) {
    // نوعٌ مُعلَنٌ لم تُكتب شاشتُه بعد: يعود إلى الخريطة — **ويُجيب كلَّ مستعمل**
    // كما تجيب أزرارُ الخريطة (بلاغُ الميدان ١). ولا زرَّ هنا يُهَزّ: مَن بلغ هذا
    // الطريقَ جاءه من عنوانٍ محفوظ لا من نقرة، فالرسالةُ وحدَها جوابُه.
    comingSoon(name, null);
    screen = renderMap();
  } else {
    screen = renderMap();
  }

  if (token !== renderToken) return;   // سبقتنا وجهة أحدث
  app.replaceChildren(screen);
  if (!name) revealNext();
  else window.scrollTo(0, 0);
}

/** إبقاء العقدة التالية في مجال النظر عند العودة للخريطة. */
function revealNext() {
  const el = app.querySelector('[data-next]');
  if (!el) return;
  const box = el.getBoundingClientRect();
  if (box.top < 0 || box.bottom > innerHeight) {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}

// ————— ساعة الاستخدام —————
// تُحسب دقائق التعلّم الفعلي وحدها: الصفحة ظاهرة، وللطفل تفاعل قريب.
// (شاشة مفتوحة منسيّة لا تُحسب — وإلا كذبت لوحة وليّ الأمر على وليّ الأمر.)

const TICK_MS = 10000;
const IDLE_MS = 60000;
let lastTouch = Date.now();

function startClock() {
  const touched = () => { lastTouch = Date.now(); };
  for (const type of ['pointerdown', 'keydown', 'hashchange']) {
    window.addEventListener(type, touched, { passive: true });
  }
  document.addEventListener('visibilitychange', touched);
  setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    if (Date.now() - lastTouch > IDLE_MS) return;
    progress.addSeconds(TICK_MS / 1000);
  }, TICK_MS);
}

// ————— العمل دون إنترنت (PWA) —————
// عامل الخدمة يخزن الهيكل والأصوات كلها (app/sw.js)، فبعد أول فتح يعمل التطبيق
// بلا شبكة. لا يُسجَّل من file:// (لا يقبله المتصفّح) ولا يُسقِط التطبيق إن رُفض.

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;
  navigator.serviceWorker
    .register(new URL('../sw.js', import.meta.url), { scope: './' })
    .catch((e) => console.warn('[sw] لم يُسجَّل عامل الخدمة:', e));
}

/* **شريطُ المعاينة ظاهرٌ لا خفيّ**: مَن يفتح التطبيق بـ`?preview=1` يرى الرحلةَ
   كلَّها مفتوحة — فلو لم يُعلَن ذلك لظنّ أنّ هذا ما يراه الطفل، **والقفلُ التسلسليّ
   جوهرُ المنهج**. فالشريطُ يقول ما يجري ويقول إنّ شيئاً لا يُحفَظ، ومنه بابٌ إلى
   التجربة الحقيقية. */
if (progress.PREVIEW) {
  document.body.prepend(h('div', { class: 'preview-bar' },
    h('b', {}, 'وضع المعاينة'),
    h('span', {}, ' — كلُّ المحطات مفتوحةٌ للاطّلاع، ولا يُحفَظ أيُّ تقدّم على هذا الجهاز.'),
    h('a', { class: 'btn btn--ghost', href: './' }, 'اخرج إلى تجربة الطفل')));
}

// وشريطُ التثبيت لكل زائرٍ من متصفّح (منقولُ اقرأ الميدانيّ، `read@260bf48`): يعرف
// جهازَه فيعطي رسالتَه — زرٌّ حقيقيّ حيث يسمح النظام، وخطوتا سفاري حيث لا يسمح —
// **ويصمت في التطبيق المثبَّت وفي المعاينة** (شريطان فوق الشاشة ضجيجٌ على المقيّم).
if (!progress.PREVIEW) install.mount();

// **ومسجّلُ الأحداث خلف `?dev=1` وحدَها** (الجلسة م١): عدّةُ تشخيصٍ للبلاغ الثاني من
// الميدان — «النقرُ على العودة أحياناً لا يعمل على الآيباد». لا يراه طفلٌ أبداً،
// **ولا يبتلع نقرةً** (لوحُه `pointer-events: none`)، ولا يخرج منه شيءٌ من الجهاز.
if (DEV) probe.mount();

// **والعودةُ من الخلفية بمقياس ١** (منقولٌ من اقرأ، `read@9220ab1`): iPadOS يسترجع
// التطبيقَ المثبَّت بعد زيارة تطبيقٍ آخر **مكبَّراً** أحياناً — عيبُ استرجاعٍ معروف في
// المنصّة لا في شيفرتنا. الميتا تمنع التكبير أصلاً (`maximum-scale=1`)، وإعادةُ إعلانها
// نفسِها عند العودة تُلزم WebKit بإعادة تطبيقها حيث يتلكّأ. **وهنا ألزمُ منه في اقرأ**:
// الطفلُ يعود إلى **لوحٍ** يكتب عليه، ومقياسٌ منحرفٌ يزيح ما تحت إصبعه عمّا تحت قلمه.
const viewportMeta = document.querySelector('meta[name="viewport"]');
const reassertViewport = () => {
  if (viewportMeta) viewportMeta.setAttribute('content', viewportMeta.getAttribute('content'));
};
window.addEventListener('pageshow', reassertViewport);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') reassertViewport();
});

window.addEventListener('hashchange', render);
audio.ready();
startClock();
render();
registerServiceWorker();
