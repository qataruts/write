// **بابُ الإرسال في ساحة الحصاد** — رابطا واتساب والبريد، **وحدَهما في ملفٍّ وحدَه**.
//
// **ولِمَ ملفٌّ مستقل؟** لأنّ سنّةَ البيت في «بلِّغنا» (`app/js/feedback.js`) سنّةٌ
// بنيويّة لا تأدّب: حارسُ الخصوصية يمنع كلَّ عنوانٍ خارجيّ في **حاملي مسار الطفل**،
// وبابُ الإرسال يحمل عنواناً بطبعه. فلو جمعهما ملفٌّ واحد لَما بقي إلا أن يُثقَب
// الحارسُ باستثناء — **والاستثناءُ في حارس خصوصيةٍ بابٌ يتّسع**. فالعناوينُ هنا
// وحدَها، و`arena.js` — الذي يمرّ به أثرُ اليد — صفرُ عناوين.
//
// **والرابطُ يُفتح بيد الإنسان ولا يُجلَب**: `<a>` لا `fetch` — فلا يخرج من الجهاز
// طلبٌ واحد، والمرسِلُ يرى نصَّه في تطبيقه قبل أن يرسل. **والمرفَقُ يرفقه بيده**:
// لا سبيلَ في هذا الملفّ إلى ملفّ الآثار أصلاً — **لا يأخذ هذا البابُ وسيطاً واحداً**
// (`sendRow.length === 0`، يقيسه حارسُ الساحة)، فما لا يُعطى لا يُرسَل.

/** رقمُ العائلة وبريدُها — من `app/js/feedback.js` بأعيانهما، لا رقمٌ ثانٍ يشيخ. */
const WHATSAPP = '97433882806';
const MAILBOX = 'info@mishkat.qa';

/** نصُّ الرسالة الجاهز — **ثابتٌ لا يحمل من الآثار حرفاً**: دعوةٌ ومكانُ مرفَق. */
export const SEND_TEXT = 'سلامٌ عليكم — هذه كتاباتٌ من ساحة «اُكْتُبْ»، '
  + 'أرفقتُ ملفَّها مع هذه الرسالة.';
const SUBJECT = 'ملفُّ كتاباتٍ من ساحة اُكْتُبْ';

const a = (label, href, note) => {
  const el = document.createElement('a');
  el.className = 'arena-btn arena-btn--send';
  el.href = href;
  el.target = '_blank';
  el.rel = 'noopener';
  el.append(label);
  if (note) {
    const small = document.createElement('span');
    small.className = 'arena-btn__note';
    small.textContent = note;
    el.append(small);
  }
  return el;
};

/**
 * صفُّ الإرسال: واتساب وبريد — **بلا وسيط**، فلا يمرّ بهذا الباب أثرٌ ولا عدد.
 *
 * @returns {HTMLElement} صفُّ رابطين يُدرَج في شاشة الختام
 */
export function sendRow() {
  const row = document.createElement('div');
  row.className = 'arena-row';
  row.append(
    a('أرسِلْه بواتساب', `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(SEND_TEXT)}`,
      'ثم اضغط 📎 وأرفِق الملفَّ الذي حفظتَه'),
    a('أو بالبريد', `mailto:${MAILBOX}?subject=${encodeURIComponent(SUBJECT)}`
      + `&body=${encodeURIComponent(SEND_TEXT)}`,
      'وأرفِق الملفَّ من مجلّد التنزيلات'),
  );
  return row;
}
