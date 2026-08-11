// مسجّلُ الأحداث — عدّةُ تشخيصٍ خلف `?dev=1` وحدَها (الجلسة م١، بلاغُ الميدان ١).
//
// **العلّة**: بلاغُ المالك على الآيباد — «النقر على العودة للخريطة أحياناً لا يعمل،
// يلزم سحبُ الشاشة ثم النقر». وعطبٌ لا يقع إلا على جهازٍ بعينه **لا يُخمَّن**: يُقاس
// عليه. والسؤالُ الذي تجيبه هذه الوحدة بحرفه: **ما الذي يصل حين يخفق النقر؟**
//
//   · **لا سطرَ يُضاف ألبتّة** ⇐ النقرةُ لم تبلغ الصفحة: ابتلعها المتصفّحُ قبلها
//     (زخمُ تمريرٍ يمتصّ أوّل لمسة · منطقةُ لمسٍ بائتة تحت شريطٍ لاصق · إيماءةُ نظام).
//   · **نزولٌ ثم إلغاء** (`pointercancel`) ⇐ المتصفّحُ فسّر اللمسةَ تمريراً.
//   · **نزولٌ ورفعٌ بلا نقرة** ⇐ الهدفُ تبدّل تحت الإصبع بين النزول والرفع، أو
//     مُنع توليدُ النقرة.
//   · **لا زرَّ تحت الإصبع** ⇐ إمّا هدفٌ مغطّى (المسجّل يقول مَن فوقه)، وإمّا يدُ
//     طفلٍ أخطأت الزرَّ (المسجّل يقول بكم بكسلاً وأيَّ زرٍّ أرادت).
//
// وهي **لا تحكم ولا تُصلح** — تقول ما وقع؛ والإصلاحُ بعلّته المقيسة بعد القياس.
//
// 🔒 **ولا تخرج قراءةٌ منها من الجهاز**: لا شبكةَ ولا مخزن — سطورٌ في الذاكرة تُعرض
// على لوحٍ ثم تذهب مع الصفحة. وهي من **حملة موضع اللمس** (تقرأ `clientX/clientY`)
// فتدخل حارسَ الخصوصية النصيّ في `tools/test_pen.mjs` كما يدخله `pen.js`.
//
// **واللوحُ لا يبتلع نقرة**: `pointer-events: none` عليه وعلى كلّ ما فيه — فمقياسٌ
// يغيّر المقيسَ ليس مقياساً. ولذلك لا زرَّ فيه ولا إغلاق: يُقرأ بالعين وحدَها.

/** ما ينتظره المسجّل بعد رفع الإصبع قبل أن يحكم أن النقرة لم تأتِ (مللي). */
const CLICK_WAIT = 700;

/** أقصى ما يُعرض من اللمسات — آخرُها أعلى، فما قبلها يذهب. */
const MAX_LINES = 6;

/** أسماءُ الأحكام كما تُقرأ على اللوح — والحكمُ نفسُه دالّةٌ نقيّة أدناه. */
export const VERDICTS = {
  done: '✓ نقرةٌ تامّة',
  cancel: '✗ أُلغيت — فُسّرت تمريراً',
  'no-up': '✗ نزولٌ بلا رفع',
  'no-click': '✗ نزولٌ ورفعٌ بلا نقرة',
  'target-changed': '✗ تبدّل الهدفُ تحت الإصبع',
  covered: '✗ هدفٌ مغطّى — زرٌّ تحته وغيرُه فوقه',
  'no-button': '✗ لا زرَّ تحت الإصبع — أخطأته اليد',
};

/**
 * حكمُ اللمسة الواحدة — **دالّةٌ نقيّة** تُفحَص بجدول حالات (نظيرُ `installState`).
 *
 * وترتيبُ الأسئلة هو ترتيبُ العلل، **وأوّلُها ما تحت الإصبع لا ما وقع بعده**: نقرةُ
 * المتصفّح (`click`) تقع على ما تحت الإصبع كائناً ما كان — فالغطاءُ الشفّاف يبتلع
 * النقرةَ **ويوقعها لنفسه**، ولو سُئل عن `click` أوّلاً لَقيل «نقرةٌ تامّة» ونقرةُ
 * الطفل ضائعة. (أمسك هذا الترتيبَ **فحصُ المسجّل السالبُ يومَ كُتب**: زرٌّ غُطّي
 * بشفّافٍ فقرأه المسجّلُ تامّاً.)
 *
 * و`nearest` أقربُ زرٍّ إلى الإصبع بالبكسل حين لا زرَّ تحته — وهي التي تفرق بين
 * **غطاءٍ** (صفرُ بكسل: الزرُّ تحت الإصبع بعينه وفوقه غيرُه) و**يدٍ أخطأت** (بُعدٌ
 * حقيقيّ، فيُعرف بكم أخطأت وأيَّ زرٍّ أرادت).
 *
 * @param {{onButton:boolean, nearest:?number, sameTarget:boolean,
 *          cancel:boolean, up:number, click:number}} touch
 * @returns {keyof VERDICTS}
 */
export function readTouch({ onButton, nearest, sameTarget, cancel, up, click }) {
  if (cancel) return 'cancel';
  if (!up) return 'no-up';
  if (!onButton) return nearest === 0 ? 'covered' : 'no-button';
  if (!sameTarget) return 'target-changed';
  return click ? 'done' : 'no-click';
}

/** اسمُ العنصر كما يُقرأ على اللوح: ما يقوله لقارئ الشاشة، وإلا صنفُه. */
function name(el) {
  if (!el) return 'لا شيء';
  if (el === document.documentElement || el === document.body) return 'الصفحة';
  const said = el.getAttribute?.('aria-label') || el.textContent?.trim().slice(0, 18);
  const tag = `${el.tagName?.toLowerCase() || '?'}${el.className && typeof el.className === 'string'
    ? '.' + el.className.split(/\s+/)[0] : ''}`;
  return said ? `${said} (${tag})` : tag;
}

/** أقربُ زرٍّ إلى نقطةٍ لا زرَّ تحتها — فيُعرَف: أخطأت اليدُ أم ابتُلعت النقرة؟ */
function nearestButton(x, y) {
  let best = null;
  let least = Infinity;
  for (const el of document.querySelectorAll('button, a[href], [role="button"]')) {
    const box = el.getBoundingClientRect();
    if (!box.width || !box.height) continue;
    const dx = Math.max(box.left - x, 0, x - box.right);
    const dy = Math.max(box.top - y, 0, y - box.bottom);
    const d = Math.hypot(dx, dy);
    if (d < least) { least = d; best = el; }
  }
  return best ? { el: best, d: Math.round(least) } : null;
}

const asButton = (el) => el?.closest?.('button, a[href], [role="button"]') || null;

/** حالُ المنظور لحظةَ اللمسة — مقياسٌ منحرفٌ يزيح ما تحت الإصبع عمّا تحت العين. */
function viewport() {
  const vv = window.visualViewport;
  return {
    scroll: Math.round(window.scrollY || 0),
    scale: vv ? Math.round(vv.scale * 100) / 100 : 1,
    lift: vv ? Math.round(vv.offsetTop || 0) : 0,
  };
}

const counts = { touch: 0, down: 0, up: 0, click: 0, cancel: 0 };
const lines = [];
let current = null;
let closing = 0;
let panel = null;
let list = null;
let head = null;
let mounted = false;

/** ما قرأه المسجّل حتى الآن — يقرؤه فحصُ المتصفّح كما تقرؤه العين على اللوح. */
export const readings = () => ({ counts: { ...counts }, lines: lines.map((l) => ({ ...l })) });

function paint() {
  if (!panel) return;
  // **عدُّ ما وصل بأسمائه**: لمسٌ (`touchstart`) ونزولٌ ورفعٌ ونقرةٌ وإلغاء — كلٌّ
  // على حدة، فمن نظر عرف **أين انقطع الطريق** لا أنّه انقطع.
  head.textContent = `وصلَ: لمسٌ ${counts.touch} · نزولٌ ${counts.down} · رفعٌ ${counts.up}`
    + ` · نقرةٌ ${counts.click} · إلغاءٌ ${counts.cancel}`;
  list.replaceChildren(...lines.slice(0, MAX_LINES).map((row) => {
    const el = document.createElement('div');
    el.className = `probe-line probe-line--${row.verdict === 'done' ? 'ok' : 'bad'}`;
    el.dataset.verdict = row.verdict;
    el.textContent = `${VERDICTS[row.verdict]} · ${row.name}`
      + ` · فوق النقطة: ${row.cover}`
      + (row.aim ? ` · أقربُ زرّ ${row.aim.name} على بُعد ${row.aim.d}px` : '')
      + ` · رفعٌ ${Math.round(row.up)}م ونقرةٌ ${Math.round(row.click)}م`
      + ` · سحبٌ ${row.view.scroll} · مقياس ${row.view.scale} · إزاحة ${row.view.lift}`;
    return el;
  }));
}

/** إقفالُ اللمسة والحكمُ عليها — بعد `CLICK_WAIT` فلا تُحسب نقرةٌ متأخّرةٌ ضائعة. */
function close() {
  if (!current) return;
  current.verdict = readTouch(current);
  lines.unshift(current);
  lines.length = Math.min(lines.length, MAX_LINES);
  current = null;
  paint();
}

function onDown(event) {
  if (closing) clearTimeout(closing);
  close();
  counts.down++;
  const cover = document.elementFromPoint(event.clientX, event.clientY);
  const pressed = asButton(event.target) || asButton(cover);
  const near = pressed ? null : nearestButton(event.clientX, event.clientY);
  current = {
    onButton: Boolean(pressed),
    nearest: near ? near.d : null,
    button: pressed,
    name: name(pressed || event.target),
    cover: cover === pressed || (pressed && pressed.contains(cover)) ? 'نفسُه' : name(cover),
    aim: near ? { name: name(near.el), d: near.d } : null,
    view: viewport(),
    t0: event.timeStamp || performance.now(),
    up: 0,
    click: 0,
    cancel: false,
    sameTarget: true,
    verdict: 'no-up',
  };
  closing = setTimeout(close, CLICK_WAIT * 4);
}

function onUp(event) {
  // **العدُّ عدُّ ما وصل لا ما فُهم**: لمسةٌ طالت فأُقفلت قبل رفعها يبقى رفعُها معدوداً
  // — وإلا لَكذب العدّادُ وهو الشاهدُ الأول (الحكمُ يُقرأ من العدّ حين لا سطرَ يُكتب).
  counts.up++;
  if (!current || current.up) return;
  current.up = Math.max(1, (event.timeStamp || performance.now()) - current.t0);
  current.sameTarget = current.button
    ? current.button === asButton(event.target) : asButton(event.target) === null;
  clearTimeout(closing);
  closing = setTimeout(close, CLICK_WAIT);
}

function onCancel() {
  counts.cancel++;
  if (!current) return;
  current.cancel = true;
  clearTimeout(closing);
  closing = setTimeout(close, 60);
}

function onClick(event) {
  counts.click++;
  if (!current) return;
  current.click = Math.max(1, (event.timeStamp || performance.now()) - current.t0);
  clearTimeout(closing);
  closing = setTimeout(close, 60);
}

/**
 * تركيبُ المسجّل ولوحِه. تُنادى من الموجّه خلف `DEV` وحدَها، ومرّةً واحدة.
 *
 * والأحداثُ تُلتقط **في مرحلة الالتقاط على النافذة** (`capture`): فما يوقفه عنصرٌ
 * في طريقه إلى هدفه يمرّ بالمسجّل قبله — والمسجّلُ يشهد ولا يعترض.
 */
export function mount() {
  if (mounted || typeof document === 'undefined') return;
  mounted = true;

  const opts = { capture: true, passive: true };
  window.addEventListener('touchstart', () => { counts.touch++; paint(); }, opts);
  window.addEventListener('pointerdown', onDown, opts);
  window.addEventListener('pointerup', onUp, opts);
  window.addEventListener('pointercancel', onCancel, opts);
  window.addEventListener('click', onClick, opts);

  panel = document.createElement('div');
  panel.className = 'probe';
  panel.id = 'probe';
  head = document.createElement('b');
  list = document.createElement('div');
  const note = document.createElement('small');
  // **العدُّ نفسُه دليل**: إن أخفق النقرُ ولم يزد العدّ فاللمسةُ لم تبلغ الصفحة أصلاً —
  // وذاك حكمٌ لا يقوله سطرٌ يُكتب، بل يقوله سطرٌ **لا يُكتب**. فيُقال للقارئ صراحةً.
  note.textContent = 'مسجّلُ الأحداث (‏?dev=1‎) — إن أخفق النقرُ ولم يزد العدّ '
    + 'فاللمسةُ لم تبلغ الصفحةَ أصلاً.';
  panel.append(head, list, note);
  document.body.append(panel);
  paint();
}
