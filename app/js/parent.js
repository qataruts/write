// لوحة وليّ الأمر (`METHOD.md §٦`) — خلف بوابة عملية حسابية بسيطة لا يحلّها طفل
// الخامسة: أين يتعثّر بالضبط، وكم دقيقة تعلّم، وما توصية اليوم.
//
// **من بذرة اقرأ** (`FAMILY.md §٥`: «`parent.js` — **البنية والبوابة الحسابية**»):
// فالمنقولُ البوابةُ الحسابية والقشرةُ وأقسامُ الزمن والنسخة الاحتياطية والتحكّم في
// الرحلة والمعاينة — **وأقسامُ مادّة اقرأ لم تُنقَل** (العلاماتُ والجذورُ وتسجيلاتُ
// الصوت و«نحو القراءة الحرة»)، ولكلٍّ سببُه مكتوباً في موضعه أدناه.
//
// **والقسمُ الذي تنتظره هذه اللوحة** هو **عدّادُ أخطاء الاتجاه المميَّز**
// (`METHOD.md §٦`: «الذهبُ القياسيّ لهذا التطبيق») — أن تقول اللوحةُ **«يبدأ الميمَ
// من أسفل»** لا «أخطأ في الميم». **وتملكه الجلسة ١٠**، ولا يُكتب هنا حرفٌ منه قبل
// أن يكتب `pen.js` موضعَ الخطأ الحركيّ (الجلسة ١) وتقيسه شاشةُ الدرس (الجلسة ٥).
//
// الشاشة لا تنطق شيئاً (لا صوت فيها أصلاً)، وتُبنى من نفس مفردات التنسيق القائمة
// (pill · vchip · note · chip) وتُلوَّن بمتغيّر --accent، فلا تحتاج تنسيقاً جديداً.

import * as progress from './progress.js';
import {
  h, go, toast, arNum, arCount, topbar, letterTitle, nodeTitle, nodeWhere, shake,
} from './ui.js';

const ACCENT = 'var(--accent-skills)';
const GOOD = 'var(--ok)';
const BAD = 'var(--err)';
const DAY_NAMES = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const ENOUGH_MINUTES = 20;   // نصيب اليوم لطفل الخامسة — بعده تُنصح الاستراحة

let unlocked = false;        // البوابة تُفتح لهذه الجلسة فقط (لا تُحفظ في التخزين)

/** ثوانٍ ← نصّ عربي مقروء. */
export function minutesText(seconds) {
  if (!seconds) return 'لا شيء';
  if (seconds < 60) return 'أقل من دقيقة';
  return arCount(Math.round(seconds / 60), ['دقيقة واحدة', 'دقيقتان', 'دقائق', 'دقيقة']);
}

/** «مهارة واحدة» · «مهارتين» · «٥ مهارات» · «١٢ مهارة» — مفعولاً به في سياق التثبيت. */
export const skillsText = (n) => arCount(n, ['مهارة واحدة', 'مهارتين', 'مهارات', 'مهارة']);

/** ثوانٍ ← نصّ عربي بدقّة الثانية: مدد القراءة الجهرية أقصر من أن تُقاس بالدقائق. */
export function secondsText(seconds) {
  const total = Math.max(0, Math.round(seconds || 0));
  if (!total) return 'أقل من ثانية';
  const rest = total % 60;
  const restText = arCount(rest, ['ثانية واحدة', 'ثانيتان', 'ثوانٍ', 'ثانية']);
  if (total < 60) return restText;
  const minutes = arCount(Math.floor(total / 60), ['دقيقة واحدة', 'دقيقتان', 'دقائق', 'دقيقة']);
  return rest ? `${minutes} و${restText}` : minutes;
}

/** لحظة التسجيل كما يقرؤها وليّ الأمر: «أحد ٣/٨ · ٦:٤٠». */
export function whenText(at) {
  const d = new Date(at);
  const time = `${arNum(d.getHours())}:${arNum(String(d.getMinutes()).padStart(2, '0'))}`;
  return `${DAY_NAMES[d.getDay()]} ${arNum(d.getDate())}/${arNum(d.getMonth() + 1)} · ${time}`;
}

/**
 * توصية اليوم — دالّة خالصة تُختبر وحدها.
 * الترتيب مقصود: صحّة الطفل (سقف الوقت) قبل التحصيل، والمراجعة قبل الجديد
 * (ما تعثّر فيه أولى بالتثبيت من درس جديد يُبنى على متزعزع).
 */
export function recommend({ letters = 0, dueCount = 0, secondsToday = 0, reviewDone = false, next = null } = {}) {
  const minutes = Math.round(secondsToday / 60);
  if (!letters) {
    return { title: 'ابدآ الرحلة معاً', body: 'أوّلُ محطات التهيئة الحركية — اجلس معه في أول محطتين حتى تتضح له اللعبة.', action: next && { label: 'افتح درسه الأول', hash: '#/' } };
  }
  if (minutes >= ENOUGH_MINUTES) {
    return { title: 'أخذ نصيبه اليوم', body: `تعلّم اليوم ${minutesText(secondsToday)} — الزيادة على هذا تُتعب طفل الخامسة أكثر مما تنفعه. أعِده غداً.`, action: null };
  }
  if (dueCount && !reviewDone) {
    return { title: 'ابدأ بمراجعة اليوم', body: `حان وقت تثبيت ${skillsText(dueCount)} (تمارين قصيرة مما كتبه). المراجعة قبل الدرس الجديد.`, action: { label: 'ابدأ المراجعة', hash: '#/review' } };
  }
  if (next) {
    return { title: 'واصِلا الدرس التالي', body: `التالي في رحلته: ${nodeTitle(next)}.`, action: { label: 'افتح الخريطة', hash: '#/' } };
  }
  return { title: 'أتمّ رحلة التأسيس كلها', body: 'أعِد معه المراجعة اليومية — وبابُ «أَتْقِنْ» بعدها.', action: { label: 'ابدأ المراجعة', hash: '#/review' } };
}

// ————— البوابة الحسابية —————

function question() {
  const a = 6 + Math.floor(Math.random() * 7);    // ٦…١٢
  const b = 7 + Math.floor(Math.random() * 6);    // ٧…١٢
  return { a, b, answer: a * b };
}

/** يقبل الرقمين العربي والهندي معاً. */
export function readNumber(text) {
  const normalized = String(text ?? '').trim().replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  return /^\d+$/.test(normalized) ? Number(normalized) : NaN;
}

/**
 * بطاقة البوابة — عمليةُ ضربٍ لا يحلّها طفل السادسة.
 * تُستعمل شاشةً كاملة للوحة، و**نافذةً فوق شاشة القصة** حين يُطلب إذنُ الميكروفون
 * أول مرة (بند الحزمة ١٠/٤): بوابةٌ واحدة لا نسختان منها.
 */
export function gateCard({ hint: hintText = 'هذه الشاشة لوليّ الأمر — أجب لتدخل.', onPass, onCancel } = {}) {
  let q = question();
  const prompt = h('div', { class: 'giant', css: { '--accent': ACCENT, 'font-size': '2.6rem' } },
    `${arNum(q.a)} × ${arNum(q.b)}`);
  const input = h('input', {
    class: 'chip',
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'off',
    'aria-label': 'ناتج الضرب',
    css: { 'min-width': '8rem', 'text-align': 'center', border: '2px solid var(--line)', font: 'inherit' },
  });
  const hint = h('p', { class: 'hint' }, hintText);

  function check() {
    if (readNumber(input.value) === q.answer) {
      // بند الحزمة ١١: عند أول بوابةِ وليّ أمر يُطلب التخزين الدائم — فعلُ بالغٍ لا
      // فعلُ طفل، ووراءه نيّةٌ معلَنة (فتحُ لوحته أو الإذن بالتسجيل). ورفضُه لا يعطّل
      // شيئاً، ولا ننتظر جوابه كي لا تتأخّر الشاشة على وليّ الأمر.
      progress.askPersistence();
      return onPass();
    }
    shake(input);
    input.value = '';
    q = question();
    prompt.textContent = `${arNum(q.a)} × ${arNum(q.b)}`;
    hint.textContent = 'ليس هذا الناتج — جرّب هذه.';
    input.focus();
  }

  return h('div', { class: 'gate', css: { '--accent': ACCENT } },
    h('h2', {}, 'كم الناتج؟'),
    prompt,
    hint,
    h('div', { class: 'row' },
      input,
      h('button', { class: 'btn btn--primary gate-go', onclick: check }, 'ادخل'),
      onCancel && h('button', { class: 'btn gate-cancel', onclick: onCancel }, 'ليس الآن'),
    ),
  );
}

function gateScreen(onPass) {
  return h('div', { class: 'screen', css: { '--accent': ACCENT } },
    topbar(
      h('button', { class: 'btn', onclick: () => go('#/') }, '→ الخريطة'),
      h('span', { class: 'spacer' }),
      h('span', { class: 'pill' }, 'لوحة وليّ الأمر'),
    ),
    h('main', { class: 'screen-card' }, gateCard({ onPass })),
  );
}

// ————— اللوحة —————

function pill(label, value) {
  return h('span', { class: 'pill' }, `${label}: `, h('b', {}, value));
}

function letterChip(stat, color) {
  return h('span', {
    class: 'vchip',
    css: { '--accent': color },
    title: `${letterTitle(stat.letter)} — ${arNum(stat.right)} صواب، ${arNum(stat.wrong)} خطأ`,
  },
    h('span', { class: 'vchip-face' }, stat.letter),
    h('small', {}, `${arNum(stat.right)} ✓ · ${arNum(stat.wrong)} ✗`));
}

// **`markStats` لم تُنقَل**: في اقرأ تجمع مفتاحَي درسِ العلامة (قراءةً وسماعاً) في
// بطاقةٍ واحدة. وعلاماتُ «اُكْتُبْ» — الشدّةُ والتنوينُ والهمزات — **ليست دروساً
// مستقلّة أصلاً**: أقرّ المالك (ق٣) أن تُكتب **في مواضعها ضمن الكلمات** لا محطاتٍ
// مجردة، فلا مفتاحَ ليتنر لها ولا قسمَ لها في اللوحة. حذفُ ما لا موضوعَ له، لا تعليق.

// ————— قسمان من البذرة لم يُنقَلا، ولكلٍّ سببُه —————
//
// **١) «نحو القراءة الحرة»** (`fadingSection`): يعرض في اقرأ كلماتٍ خفت تشكيلُها.
// و«اُكْتُبْ» له خفوتُه (`METHOD.md §٤` مرحلة ١٣) — لكنّ ما يخفت فيه **نموذجُ
// الكلمة المكتوبة** لا شكلُها، والعدّادُ قائمٌ في `progress.js` من اليوم. فالقسمُ
// **مُعلَّقٌ حتى الجلسة ٩** (خفوت النموذج والإملاء): لا تُعرض درجاتٌ لا يكتبها أحد.
//
// **٢) «تسجيلات طفلي»** (`recordingsSection` ومنحنى الطلاقة): يُسمِع وليَّ الأمر
// صوتَ طفله وهو يقرأ. و«اُكْتُبْ» **لا يلتقط صوتاً ألبتّة** — فحذفٌ لِما لا موضوعَ
// له أبداً، لا تعليق. وأثرُ الطفل الخاصّ هنا **مساراتُ قلمه**، وعهدُها أشدّ:
// **لا تغادر جهازه** (`METHOD.md §٣.٧`)، ويحرسه فحصان في الجلسة ١.

// ————— «نسخة احتياطية» و«تحكّم في الرحلة» (الحزمة ١١) —————
//
// قسمان لوليّ الأمر وحدَه — خلف بوابته الحسابية كبقية اللوحة، ولا أثر لهما في شاشة
// الطفل. الأول يحمي رحلته من ضياع التخزين وتبديل الجهاز، والثاني يجعل التسلسل
// طوعَ وليّ الأمر: يتخطّى به ما يعرفه الطفل، ويعيد به تدريبَ ما تزعزع.

/**
 * تأكيدٌ صريح **في الصفحة** لا بـ`confirm()` — وهذه الأفعال تكتب فوق رحلة الطفل
 * فلا تقع بنقرةٍ واحدة. ونافذة المتصفّح لا تصلح هنا: أزرارها بلغة الجهاز لا بلغتنا،
 * ولا تتّسع لشرح أثر الفعل — وهنا يُقرأ ما سيقع بالضبط قبل أن يقع.
 */
function askThen(box, { question, body, yes, onYes }) {
  const close = () => box.replaceChildren();
  box.replaceChildren(h('div', { class: 'note confirm' },
    h('b', {}, question),
    body && h('p', { class: 'hint', css: { margin: '.35rem 0 0' } }, body),
    h('div', { class: 'row', css: { 'justify-content': 'flex-start', 'margin-top': '.6rem' } },
      h('button', { class: 'btn btn--primary confirm-yes', onclick: () => { close(); onYes(); } }, yes),
      h('button', { class: 'btn confirm-no', onclick: close }, 'إلغاء')),
  ));
}

const nodesText = (n) => arCount(n, ['عقدة واحدة', 'عقدتين', 'عقد', 'عقدة']);

/** تنزيل ملف النسخة — نصٌّ في `Blob`، بلا شبكةٍ ولا خادم (كل شيء في الجهاز). */
function saveBackupFile() {
  const url = URL.createObjectURL(
    new Blob([progress.backupText()], { type: 'application/json' }));
  const link = h('a', { href: url, download: progress.backupName() });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 20000);
}

/** ما في النسخة بعبارة وليّ الأمر — يُقرأ قبل التأكيد لا بعده. */
function summaryText(sum) {
  return `★ ${arNum(sum.stars)} في ${nodesText(sum.nodes)} · ${skillsText(sum.skills)} مقيسة`
    + (sum.reads ? ` · ${arCount(sum.reads, ['كلمة واحدة', 'كلمتان', 'كلمات', 'كلمة'])} لها تاريخ قراءة` : '')
    + (sum.savedAt ? ` · حُفظت ${whenText(sum.savedAt)}` : '');
}

/** **بابُ وضع المعاينة — خلف بوابة وليّ الأمر** (أمر المالك، ١٣ أغسطس ٢٠٢٦):
 *
 *  المقيّمُ يحتاج أن يرى المحطات كلَّها، والطفلُ يحتاج ألّا يقفز إلى ما لم يبلغه.
 *  ولو وُضع الزرُّ في شاشة الطفل لَفتحه بنفسه ولو باللمس العابر — **فموضعُه هذه
 *  اللوحة**: هي محميّةٌ سلفاً بمسألةِ ضربٍ يعجز عنها طفلُ السادسة، وزرُّها ظاهرٌ
 *  أعلى الخريطة. فالتحقّقُ من أنّ المستعمل ليس الطفل قائمٌ بالبناء لا بزرٍّ ثانٍ.
 *
 *  ولا يكتب شيئاً: المعاينةُ تفتح القفلَ وحدَه، ويقول شريطُها ذلك في أعلى الشاشة. */
function previewSection() {
  return h('div', {},
    h('p', { class: 'hint' },
      'تفتح المحطاتِ كلَّها للاطّلاع — تهيئةً وحرفاً ونسخاً وإملاءً — '
      + '**ولا يُحفَظ أيُّ تقدّم**: تُغلق الصفحةَ فيعود الجهازُ كما كان.'
      .replace(/\*\*/g, '')),
    h('div', { class: 'row' },
      h('button', {
        class: 'btn btn--primary',
        onclick: () => { location.href = `${location.pathname}?preview=1`; },
      }, 'افتح وضع المعاينة')),
    h('p', { class: 'note' },
      'وهو للمعلّم أو وليّ الأمر يقيّم التطبيق — لا للطفل: القفلُ التسلسليّ'
      + ' (لا يُعرض عليه ما لم يبلغه) من أسس المنهج لا قيدٍ عليه.'),
  );
}

function backupSection(rerender) {
  const slot = h('div', { class: 'confirm-slot' });
  const storage = h('p', { class: 'hint' }, 'التخزين على هذا الجهاز: جارٍ الفحص…');
  // سطرُ الأصوات المخزونة (حزمة «خفّة التخزين»): كان إخفاقُ الخزن يُبتلَع صامتاً —
  // ومنه تجاوزُ حصة التخزين على الأجهزة الأقدم — فتنقص ملفاتٌ ولا يعلم أحد، ثم يصمت
  // الصوت في الطائرة أو في السيارة. فالعدد معروضٌ لوليّ الأمر: يرى النقص قبل أن يفاجئه.
  /* **حالُ التحميل تُرى وتُدار** (أمر المالك، ١٣ أغسطس ٢٠٢٦: «يجب أن نُظهر التحميل
     ليتأكّد المستعمل أنّ التحميلات جاهزة… وأن تكون هناك طريقة لمتابعة التحميل أو
     إعادته»): كان الخزنُ يجري صامتاً فلا يعرف أحدٌ أتمَّ أم لا — حتى فُتح التطبيقُ
     بلا شبكةٍ فصمت الصوت، وظُنّ العيبُ في البرنامج. فصار السطرُ **شريطاً حيّاً**
     يتحرّك مع كل دفعة، ومعه **زرٌّ يبدأ التحميل الآن** بدل انتظار مهلة الشفاء. */
  const cached = h('p', { class: 'hint' });
  const bar = h('div', { class: 'dl-bar' }, h('span', { class: 'dl-fill' }));
  const fill = bar.firstChild;
  const dlBtn = h('button', { class: 'btn', onclick: () => askSync() }, 'نزّل الأصوات الآن');
  const dlRow = h('div', { class: 'dl' }, cached, bar, dlBtn);

  const paint = (stored, total, busy) => {
    if (!cached.isConnected || !total) return;
    const pct = Math.min(100, Math.round((stored / total) * 100));
    fill.style.width = `${pct}%`;
    bar.classList.toggle('dl-bar--done', stored >= total);
    const head = `الأصوات المخزونة: ${arNum(stored)} من ${arNum(total)} (${arNum(pct)}٪)`;
    cached.textContent = stored >= total
      ? `${head} — كلُّها على الجهاز، فيعمل التطبيق بلا إنترنت.`
      : busy
        ? `${head} — يُنزَّل الآن، أبقِ التطبيق مفتوحاً.`
        : `${head} — ما نقص يُجلَب عند سماعه، ويكتمل حين يُفتح التطبيق متصلاً.`;
    dlBtn.hidden = stored >= total;
    dlBtn.textContent = busy ? 'يُنزَّل…' : 'نزّل الأصوات الآن';
    dlBtn.disabled = Boolean(busy);
  };

  /** طلبٌ صريح إلى عامل الخدمة — هو وحده يملك المخزن. */
  const askSync = () => {
    const sw = navigator.serviceWorker?.controller;
    if (!sw) return void toast('التحميل يبدأ بعد تثبيت التطبيق');
    sw.postMessage({ type: 'audio-sync' });
    dlBtn.disabled = true;
    dlBtn.textContent = 'يُنزَّل…';
  };

  // بلاغاتُ العامل بعد كل دفعة — فالشريطُ يتحرّك بما يجري لا بتقديرٍ منّا
  navigator.serviceWorker?.addEventListener?.('message', (e) => {
    if (e.data?.type === 'audio-progress') paint(e.data.stored, e.data.total, e.data.busy);
  });

  progress.audioStored().then((count) => {
    if (count) paint(count.stored, count.total, false);
  });

  progress.persistedStorage().then((persisted) => {
    if (!storage.isConnected) return;
    storage.textContent = persisted === null
      ? 'هذا المتصفّح لا يعلن حال تخزينه — والنسخة الاحتياطية تكفيك مؤونته.'
      : persisted
        ? 'تخزين هذا الجهاز موسومٌ دائماً: لا يخليه المتصفّح عند ضيق المساحة.'
        : 'لم يسم المتصفّح تخزين التطبيق دائماً بعدُ — قد يُخليه عند ضيق المساحة،'
          + ' فاحتفظ بنسخةٍ حديثة. (تثبيت التطبيق على الشاشة الرئيسية يرجّح تثبيته.)';
  });

  const file = h('input', {
    type: 'file',
    accept: '.json,application/json',
    class: 'file-pick',
    'aria-label': 'اختر ملف نسخةٍ لاستعادته',
    onchange: async (event) => {
      const chosen = event.target.files?.[0];
      if (!chosen) return;
      const read = progress.readBackup(await chosen.text());
      file.value = '';                       // كي يقبل اختيار الملف نفسه ثانيةً
      if (read.error) {
        slot.replaceChildren(h('p', { class: 'note note--bad' }, read.error));
        return;
      }
      const sum = progress.backupSummary(read.bundle);
      askThen(slot, {
        question: 'استعادة هذه النسخة؟',
        body: `فيها: ${summaryText(sum)}. وستحلّ محلّ ما في هذا الجهاز الآن`
          + ` (${summaryText(progress.backupSummary(progress.backup()))}) — فلا رجعة بعدها.`,
        yes: 'استعِد الآن',
        onYes: () => {
          if (!progress.restore(read.bundle)) {
            slot.replaceChildren(h('p', { class: 'note note--bad' }, 'تعذّرت الاستعادة.'));
            return;
          }
          toast('استُعيد تقدّم طفلك');
          rerender();
        },
      });
    },
  });

  return h('div', {},
    h('p', { class: 'hint' },
      'تقدّم طفلك محفوظ في هذا الجهاز وحده — لا حساب ولا سحابة. فاحفظ نسخةً بين'
      + ' حينٍ وآخر: ملفٌّ صغير يعيد رحلته كما هي إن حذفتَ التطبيق أو بدّلتَ الجهاز.'),
    h('div', { class: 'row', css: { 'justify-content': 'flex-start' } },
      h('button', {
        class: 'btn btn--primary backup-save',
        onclick: () => { saveBackupFile(); toast('حُفظت نسخةُ التقدّم'); },
      }, 'انسخ تقدّم طفلي'),
      // الملصق زرٌّ بحقّ: يُفتح باللمس وبالفأرة **وبلوحة المفاتيح** — ومدخلُ الملف
      // مخفيٌّ فيه لأن مظهره الأصليّ نصٌّ بلغة الجهاز لا بلغة اللوحة.
      h('label', {
        class: 'btn file-label',
        role: 'button',
        tabindex: '0',
        onkeydown: (e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          file.click();
        },
      }, 'استعِد من ملف', file),
    ),
    slot,
    storage,
    dlRow,
    h('p', { class: 'note' },
      'في النسخة: النجوم وصناديق المراجعة ودقائق التعلّم ومدد قراءاته الجهرية'
      + ' وتاريخ خفوت كلماته. وليس فيها مسارُ قلمٍ واحد — تلك لا تغادر جهازه أبداً.'),
  );
}

/** اسم المحطة كما يقرؤه وليّ الأمر في قائمة الاختيار. */
function sectionLabel(section, index) {
  const name = section.kind === 'gate' ? section.gate.title : nodeWhere(section.nodes[0]);
  // شرطةٌ لا نقطةٌ فاصلة: النقطة تجاور الرقم المشرقيّ في الاتجاهين فتُقرأ صفراً ملتصقاً به
  return `${arNum(index + 1)} — ${name}`;
}

function journeySection(rerender) {
  const sections = progress.journey();
  const next = progress.nextNode();
  const here = sections.findIndex((s) => s.nodes.some((n) => n.id === next?.id));

  // ١) تخطٍّ للأمام: القفل التسلسلي طوعُ وليّ الأمر — لطفلٍ يعرف حروفه أصلاً
  const nodePick = h('select', { class: 'chip pick', 'aria-label': 'العقدة التي يُفتح الطريق إليها' },
    sections.map((section, i) => h('optgroup', { label: sectionLabel(section, i) },
      section.nodes.map((node) => h('option', { value: node.id }, nodeTitle(node))))));
  if (next) nodePick.value = next.id;
  const openSlot = h('div', { class: 'confirm-slot' });

  const openBtn = h('button', {
    class: 'btn open-to',
    onclick: () => {
      const node = progress.findNode(nodePick.value);
      const count = progress.pendingBefore(nodePick.value);
      if (!node) return;
      if (!count) { toast('هذه مفتوحة له أصلاً'); return; }
      askThen(openSlot, {
        question: `تفتح الطريق إلى «${nodeTitle(node)}»؟`,
        body: `${nodesText(count)} قبلها ستُعدّ منجَزةً بنجمةٍ واحدة — تبقى مفتوحةً`
          + ' يلعبها متى شاء، ولا تُنقَص نجمةٌ كسبها. والقياس لا يتغيّر: لم يُمتحن فيها بعد.',
        yes: 'افتح الطريق',
        onYes: () => {
          toast(`فُتحت ${nodesText(progress.unlockUpTo(node.id))}`);
          rerender();
        },
      });
    },
  }, 'افتح الطريق إلى هنا');

  // ٢) إعادة التدريب: تصفير محطةٍ بعينها — نجومُها وحدها، وسجلّ ليتنر لا يُمسّ
  const sectionPick = h('select', { class: 'chip pick', 'aria-label': 'المحطة التي تُصفَّر' },
    sections.map((section, i) => h('option', { value: section.id }, sectionLabel(section, i))));
  if (here >= 0) sectionPick.value = sections[here].id;
  const resetSlot = h('div', { class: 'confirm-slot' });

  const resetBtn = h('button', {
    class: 'btn reset-section',
    css: { color: 'var(--err-text)' },
    onclick: () => {
      const index = sections.findIndex((s) => s.id === sectionPick.value);
      const section = sections[index];
      const info = progress.sectionProgress(sectionPick.value);
      if (!section || !info) return;
      if (!info.done) { toast('لم يبدأ هذه المحطة بعد'); return; }
      askThen(resetSlot, {
        question: `تصفّر محطة «${sectionLabel(section, index)}» ليعيدها؟`,
        body: `${nodesText(info.done)} فيها تعود إلى أولها و${arNum(info.stars)} نجمة تسقط،`
          + ' ويُقفل ما بعدها حتى يتمّها من جديد — ونجومُه هناك محفوظة تعود كما كانت.'
          + ' أما سجلّ مهاراته ودقائق تعلّمه فلا يمسّها التصفير.',
        yes: 'صفِّر المحطة',
        onYes: () => {
          toast(`صُفِّرت ${nodesText(progress.clearSection(section.id))}`);
          rerender();
        },
      });
    },
  }, 'صفِّر هذه المحطة');

  return h('div', {},
    h('p', { class: 'hint' },
      'الرحلة مقفلة بالتسلسل: لا تُفتح عقدةٌ قبل ما قبلها. وهنا تتجاوز القفل إن كان'
      + ' طفلك يعرف ما قبله، أو تعيد محطةً كاملة إن رأيت أن يعيد تدريبها.'),
    h('div', { class: 'row parent-tool' }, nodePick, openBtn),
    openSlot,
    h('div', { class: 'row parent-tool' }, sectionPick, resetBtn),
    resetSlot,
  );
}

function dashboard(rerender = () => {}) {
  const letters = progress.studiedLetters();
  const stats = progress.letterStats();
  // **الكلماتُ صفٌّ إلى جوار الحروف**: النسخُ والإملاء وحدتُهما كلمة لا حرف
  // (`METHOD.md §٦`) — فلا تدخل لوحةَ الحروف، ولها قسمُها أدناه.
  const words = progress.skills().filter(progress.isWordSkill);
  const mastered = stats.filter((s) => s.mastered);
  const weak = stats.filter((s) => s.struggling);
  const learning = stats.filter((s) => !s.mastered && !s.struggling);
  const due = progress.dueSkills();
  const next = progress.nextNode();
  const today = progress.secondsOn();
  const week = progress.usageDays(7);
  const streak = progress.reviewStreak();
  const tip = recommend({
    letters: letters.length,
    dueCount: due.length,
    secondsToday: today,
    reviewDone: Boolean(progress.reviewOf()),
    next,
  });

  const section = (title, ...children) => [h('h3', {}, title), ...children];
  const emptyNote = (text) => h('p', { class: 'hint' }, text);

  const main = h('main', { class: 'screen-card audit' },
    h('h2', {}, 'لوحة وليّ الأمر'),

    h('div', { class: 'audit-row' },
      pill('اليوم', minutesText(today)),
      pill('هذا الأسبوع', minutesText(week.reduce((s, d) => s + d.seconds, 0))),
      pill('المجموع', minutesText(progress.totalSeconds())),
      pill('النجوم', `${arNum(progress.totalStars())} / ${arNum(progress.maxTotalStars())}`),
      pill('حروف كتبها', arNum(letters.length)),
      pill('مراجعات متتابعة', arNum(streak)),
    ),

    ...section('توصية اليوم',
      h('div', { class: 'note', css: { 'text-align': 'start' } },
        h('b', {}, tip.title),
        h('p', { class: 'hint', css: { margin: '.25rem 0 0' } }, tip.body)),
      tip.action && h('div', { class: 'row', css: { 'justify-content': 'flex-start', 'margin-top': '.75rem' } },
        h('button', { class: 'btn btn--primary', onclick: () => go(tip.action.hash) }, tip.action.label))),

    ...section(`الحروف المتقنة كتابةً (${arNum(mastered.length)})`,
      mastered.length
        ? h('div', { class: 'audit-row' }, mastered.map((s) => letterChip(s, GOOD)))
        : emptyNote('لم يثبت حرف بعدُ — الإتقان يحتاج إصابات متتابعة في أيام متباعدة.')),

    ...section(`الحروف المتعثّرة (${arNum(weak.length)})`,
      weak.length
        ? [h('div', { class: 'audit-row' }, weak.map((s) => letterChip(s, BAD))),
          h('p', { class: 'hint' }, 'هذه تعود في مراجعة اليوم تلقائياً. واكتبها معه بإصبعك على الطاولة أيضاً.')]
        : emptyNote('لا حرف متعثّر — ما أخطأ فيه لم يتكرّر خطؤه.')),

    ...section(`قيد التعلّم (${arNum(learning.length)})`,
      learning.length
        ? h('div', { class: 'audit-row' }, learning.map((s) => letterChip(s, ACCENT)))
        : emptyNote('لا شيء في المنتصف.')),

    // **الكلماتُ قسمٌ خاصٌّ بها**: الكلمةُ ليست حرفاً، فلا تدخل لوحةَ الحروف (وإلا
    // ظهر «حرفٌ» اسمُه «بابا») — ولكنها مقيسةٌ في ليتنر نسخاً وإملاءً فتُقرأ هنا.
    ...section(`الكلمات نسخاً وإملاءً (${arNum(words.length)})`,
      words.length
        ? [h('div', { class: 'audit-row' }, words.map((s) => h('span', {
          class: 'vchip vchip--tag',
          css: { '--chip': s.box >= progress.MASTERED_BOX ? GOOD : s.wrong >= 2 ? BAD : ACCENT },
          title: `${s.unit} — ${arNum(s.right)} صواب، ${arNum(s.wrong)} خطأ`,
        }, s.unit))),
          h('p', { class: 'hint' },
            'النسخُ أن يكتبها وهو يراها، والإملاءُ أن يكتبها وقد سمعها فقط '
            + '— ولكلٍّ صندوقُ مراجعته.')]
        : emptyNote('لم يبلغ محطةَ نسخٍ بعدُ — تبدأ بعد أشكال المواقع.')),

    ...section('دقائق آخر سبعة أيام',
      h('div', { class: 'audit-row' }, week.map((day) => {
        const d = new Date(`${day.key}T00:00:00`);
        const minutes = Math.round(day.seconds / 60);
        return h('span', {
          class: 'pill',
          css: day.seconds ? { color: 'var(--star-text)' } : { opacity: '.55' },
        }, `${DAY_NAMES[d.getDay()]}: `, h('b', {}, minutes ? arNum(minutes) : '—'));
      })),
      h('p', { class: 'hint' }, 'الزمن يُحسب وقت انتباهه للشاشة فقط (لا يُحسب إن تركها مفتوحة).')),

    ...section('أين هو الآن',
      h('p', { class: 'hint' }, next
        ? `التالي: ${nodeTitle(next)} — ${nodeWhere(next)}.`
        : 'أتمّ كل عقد الخريطة.'),
      h('p', { class: 'hint' },
        `بانتظار التثبيت الآن: ${arNum(due.length)} من ${arNum(progress.skills().length)} مهارة سُجّلت.`)),

    ...section('نسخة احتياطية من تقدّمه', backupSection(rerender)),

    ...section('تحكّم في الرحلة', journeySection(rerender)),

    ...section('معاينةُ التطبيق كلِّه', previewSection()),

    h('p', { class: 'note' }, 'المهارة = (الحرف أو الكلمة) × شكل الموقع × نوع التمرين — تتبّعاً أو حرّاً أو نسخاً أو إملاءً. الخطأ يعيدها إلى مراجعة الغد، والإصابة تُباعد موعدها (١ ← ٢ ← ٤ ← ٨ ← ١٦ يوماً).'),
  );

  return h('div', { class: 'screen', css: { '--accent': ACCENT } },
    topbar(
      h('button', { class: 'btn', onclick: () => go('#/') }, '→ الخريطة'),
      h('span', { class: 'spacer' }),
      h('span', { class: 'pill' }, 'لوحة وليّ الأمر'),
    ),
    main,
  );
}

/** الشاشة: البوابة أولاً، ثم اللوحة — والفتح يبقى ما دامت الصفحة مفتوحة. */
export function renderParent(rerender) {
  if (unlocked) return dashboard(rerender);
  return gateScreen(() => {
    unlocked = true;
    rerender();
  });
}

/** لإعادة إغلاق البوابة في الاختبارات. */
export function lockGate() {
  unlocked = false;
}
