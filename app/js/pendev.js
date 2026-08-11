// صفحةُ تجربة محرّك القلم — خلف `?dev=1` وحدها (بند الجلسة ١/٥).
//
// **لِمَ توجد أصلاً؟** لأن المحرّك يُسلَّم في الجلسة ١ ولا شاشةَ تستعمله بعدُ: محطاتُ
// التهيئة في الجلسة ٤، ودرسُ الحرف في الجلسة ٥. فمحرّكٌ بلا يدٍ تجرّبه شيفرةٌ لم
// يرها أحدٌ يعمل — وهذه الصفحةُ هي اليد.
//
// **ومسارُها ليس حرفاً — وهذا مقصود**: مسارات الحروف تؤلّفها **الجلسة ٢** بأداة
// `tools/make_paths.html` («لا تُكتب إحداثياتٌ بيد»، `METHOD.md §٣.٨`)، فلو كتبتُ
// هنا «باءً» بيدي لدخل المنهجَ حرفٌ لم يمرّ بالأداة ولا بـ`check_paths.py`، ولالتبس
// على القارئ أهو مادّةٌ أم عُدّة. فالمعروضُ هنا **شكلٌ هندسيّ محسوب** — قوسٌ وشريطٌ
// ونقطة — يستوفي أصنافَ الشروط الأربعة كلَّها (بدايةٌ، اتجاهٌ، انحرافٌ، ترتيبٌ
// ونقطةٌ بعد جسم) ولا يُشبه حرفاً بعينه. **وإحداثياتُه محسوبةٌ لا مكتوبة** كذلك.
//
// 🔒 **وهي من حملة مسار الطفل**: يمرّ بها الحبر، فتدخل الحارسَ النصيّ في
// `tools/test_pen.mjs` — لا `fetch` ولا رفعَ ولا عنوانَ خارجيّ.

import { h, DEV, topbar, brandMark, go } from './ui.js';
import { PATHS } from './curriculum.js';
import { penSurface, FAULT_TEXT, MODES } from './pen.js';

// ————— المسارُ الهندسيّ المحسوب —————

const round = (n) => Math.round(n * 10) / 10;

/** نقاطُ قوسٍ بين زاويتين — بالراديان، وإحداثياتُ الشاشة (y نازلة). */
function arc(cx, cy, r, from, to, steps) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = from + (to - from) * (i / steps);
    return [round(cx + r * Math.cos(a)), round(cy + r * Math.sin(a))];
  });
}

/** نقاطُ قطعةٍ مستقيمة موزّعةٌ بالتساوي. */
function line(a, b, steps) {
  return Array.from({ length: steps + 1 }, (_, i) => [
    round(a[0] + (b[0] - a[0]) * (i / steps)),
    round(a[1] + (b[1] - a[1]) * (i / steps)),
  ]);
}

/**
 * **مسارُ التجربة**: كأسٌ من اليمين إلى اليسار (اتجاهُ الكتابة العربية)، ثم شريطٌ
 * فوقه من اليمين إلى اليسار، ثم **نقطةٌ بعد الجسمين** — فتُجرَّب الشروطُ الأربعة
 * كلُّها على شكلٍ واحد. والفواصلُ بين مبادئ الأجزاء أوسعُ من سماحة البداية بكثير،
 * فلا يلتبس على المحرّك جزءٌ بجزء وهو يميّز قلبَ الترتيب.
 */
export const SAMPLE = {
  strokes: [
    { points: arc(500, 480, 260, 0, Math.PI, 40), start: [760, 480] },
    { points: line([700, 180], [300, 180], 12), start: [700, 180] },
  ],
  dots: [{ at: [500, 940], count: 1, after: true }],
};

/**
 * ⚠ **مطالبةٌ تُطلقها هذه الصفحةُ على نفسها** (نمطُ «التعليقُ يُطالِب من نفسه»،
 * أُقرّ مبدأً دائماً في مراجعة الجلسة ٠): يومَ تُؤلَّف أولُ مساراتِ حروفٍ حقيقية
 * في الجلسة ٢ يمتلئ `PATHS`، فتصير هذه الدالةُ صادقةً — ويصير عرضُ شكلٍ هندسيّ
 * بدل حرفٍ موجودٍ على القرص كذباً. عندها **يحمرّ `tools/test_pen.mjs` من نفسه**
 * ويطالب بتحويل الصفحة إلى الحروف الحقيقية، بلا سطرٍ يُضاف ولا انتباهٍ يُرجى.
 */
export const realPathsExist = () => Object.keys(PATHS).length > 0;

// ————— الشاشة —————

const STEPS = [
  [MODES.GUIDED, 'موجَّه — المسار ظاهر'],
  [MODES.FAINT, 'خافت — يعتمد على ذاكرته'],
  [MODES.FREE, 'حرّ — صندوقٌ فارغ'],
];

let live = null;

/**
 * إطلاقُ اللوح عند مغادرة الشاشة — يناديها الموجّه في `main.js` مع كل رسمة،
 * نظيرَ `recorder.release()` في اقرأ: لا يتبع شيءٌ من اللوح الطفلَ إلى غير شاشته.
 */
export function releasePen() {
  live?.destroy();
  live = null;
}

/**
 * شاشةُ تجربة المحرّك: لوحٌ واحد، وأزرارُ خطوات الحلقة (`METHOD.md §٥`)، ولوحُ
 * قراءةٍ يطبع الحكمَ وأخطاءَه ومقاييسَه — **وهي أرقامُ مطوّرٍ لا شاشةُ طفل**.
 */
export function renderPenDev() {
  if (!DEV) return null;

  const screen = h('div', {},
    topbar(
      h('button', { class: 'btn btn--ghost', onclick: () => go('#/') }, '→ الخريطة'),
      h('span', { class: 'spacer' }),
      brandMark(),
    ),
  );

  const readout = h('div', { class: 'dev-readout' });
  const state = { mode: MODES.GUIDED };

  function say(...lines) {
    readout.replaceChildren(...lines.map((line) => h('div', {}, line)));
  }

  const surface = penSurface({
    ref: SAMPLE,
    mode: state.mode,
    label: 'لوحُ تجربة محرّك القلم',
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

  const main = h('main', { class: 'screen' },
    h('h1', {}, 'تجربةُ محرّك القلم'),
    h('p', { class: 'note' },
      'شكلٌ هندسيّ محسوب لا حرف: قوسٌ ثم شريطٌ ثم نقطةٌ بعدهما. '
      + 'مساراتُ الحروف تؤلّفها الجلسة ٢ بأداتها.'),
    surface.el,
    h('div', { class: 'dev-row' },
      h('button', { class: 'btn', onclick: () => { surface.reset(); surface.play(); } }, 'شاهِد'),
      ...STEPS.map(([mode, title]) => h('button', {
        class: 'btn',
        onclick: () => { state.mode = mode; surface.setMode(mode); say(title); },
      }, title.split(' — ')[0])),
      h('button', { class: 'btn', onclick: () => { surface.reset(); say('لوحٌ نظيف'); } }, 'أعِد'),
    ),
    readout,
  );

  say('انقر «شاهِد» لترى النموذج يُرسم من مساره، ثم اكتب فوقه.');
  screen.append(main);
  live = surface;
  return screen;
}
