// البوابات الثلاث (`METHOD.md §٤`): جلسة مراجعة **إجبارية** تقف قبل المفاصل الكبرى —
// عبورُ الحرف المعزول، وعبورُ النسخ، وختامُ التأسيس — فلا يعبر الطفل إليها بحروفٍ
// هشّة لمجرّد أنه «أتمّ» ما قبلها.
//
// **من بذرة اقرأ** (`FAMILY.md §٥`) — ولم يتبدّل فيه غيرُ مصدرِ بيانه ومادّته:
// أربعُ قواعدَ تحكمه، وهي قواعدُ اقرأ نفسُها وقد أقرّها `METHOD.md §٤` هنا:
// ١) **مادّتها أضعف ما في يده** لا ما حان موعده: `progress.weakestSkills()` بدل
//    `dueSkills()` — البوابة سؤالٌ عن الإتقان، وليتنر جدولُ تثبيتٍ لا امتحان.
// ٢) **لا محتوى جديداً ولا نصّ منطوق جديد**: تمارينها تمارينُ المراجعة نفسُها
//    (`buildSession` في `review.js`)، فكل ما تنطقه له ملفٌ مولَّد أصلاً.
// ٣) 🔴 **لا رسوب — بمرسوم المضيّ صارت حرفيةً** (أمر المالك، ٢٣ أغسطس ٢٠٢٦: «دع
//    الطفل يمشي ولا توقفه، والتقييم لوليّ الأمر»): **البوابةُ تُفتح دائماً** —
//    النسبةُ تصنع النجومَ (٣ فوق العتبة، وواحدةٌ لمن أتمّ دونها) لا العبورَ،
//    و«قَوِّ يَدَكْ» دعوةُ إعادةٍ اختيارية لا حائط. **والعتبةُ القديمة كانت قد
//    انزاحت بنيوياً أصلاً**: محرّكُ الإنقاذ يعدّ «خطأً ثم تصحيحاً» خطأين
//    (عطبٌ وسيطٌ قبل قبول الاستئناف) فصار ٨/١٠ تمريناً = ٨/١٢ محاولة (٦٧٪)
//    و«ليس بعد» تحبس المصيب — قِيس في فحصها ليلةَ ٢٣ أغسطس.
// ٤) **الحكم بالمحاولة لا بالتمرين**: نسبة الإصابة = الصواب ÷ كل المحاولات، وهي
//    وحدةُ `markReview` نفسُها في لوحة وليّ الأمر — فلا يفترق ما يقرؤه الوالد عمّا
//    فتح البوابة أو أبقاها.

import { gateById } from './curriculum.js';
import * as progress from './progress.js';
import { buildSession, renderSession, starsForReview } from './review.js';
import { h, icon, faceEl, go, arNum, starsRow, mascot, PAUSE_ACCENT } from './ui.js';

export const GATE_SIZE = 10;      // عشرة تمارين: أطول من مراجعة اليوم ودون إرهاق
export const PASS_RATE = 0.8;     // العبور بإصابة ≥٨٠٪ من المحاولات (`METHOD.md §٤`)

/** أبلغت النتيجةُ عتبةَ النجوم الكاملة؟ (بمرسوم المضيّ: عتبةُ نجومٍ لا عتبةُ عبور —
 *  والجلسةُ الفارغة لا تُحتسب أصلاً في `verdict`) */
export const passed = (right, errors) =>
  right + errors > 0 && right / (right + errors) >= PASS_RATE;

/** تمارين محاولةٍ واحدة: الأضعف أولاً من سجلّ ليتنر. */
export function gateItems() {
  return buildSession({ due: progress.weakestSkills(), size: GATE_SIZE });
}

export function renderGate(gateId) {
  const gate = gateById(gateId);
  if (!gate) return null;
  const nodeId = `gate:${gate.id}`;

  return renderSession({
    make: gateItems,
    pill: 'بوابة',
    accent: PAUSE_ACCENT,
    leaveAsk: 'تريد الخروج قبل إتمام البوابة؟',
    // 🚪 **البوابةُ تُعبَر لا تُرتطَم** (م٥ — بلاغُ الميدان ٤): «شاهِدْ» في كل تمرين،
    // ومخرجٌ كريم بعد التعثّر — وعدّتُهما في `review.js` (`assistFoot`) وشرحُهما هناك.
    // **وللبوابة وحدَها**: هي الحائطُ الذي يقف قبل المفصل، ومراجعةُ اليوم اختياريةٌ
    // بابُها إلى الخريطة مفتوح.
    assist: true,
    header: h('div', { class: 'gate-head' },
      // **وجهُ البوابة أيقونتُها الخطية** (الجلسة ٣): بياناتُ المنهج بلا رمزٍ مصوَّر
      // — لا بنكَ رموزٍ في هذا التطبيق، ولغةُ الواجهة SVG خطيّ (`DESIGN.md §٦`).
      faceEl(gate.face ?? icon('gate'), 'gate-face'),
      h('div', {},
        h('h2', {}, gate.title),
        h('p', { class: 'hint' }, gate.hint),
      ),
    ),
    verdict: ({ right, errors, items, again }) => {
      const tries = right + errors;
      const rate = tries ? Math.round((right / tries) * 100) : 0;
      const full = passed(right, errors);
      progress.markReview(tries, right);           // البوابة مراجعةٌ كسائر المراجعات
      // 🔴 **مرسومُ المضيّ**: البوابةُ تُفتح دائماً — النجومُ بالنسبة الصادقة
      // (كاملةً فوق العتبة، وواحدةً لمن أتمّ دونها — إتمامٌ لا إتقان)، ولوحةُ
      // وليّ الأمر تقرأ النسبةَ نفسَها عبر `markReview`. ولا «ليس بعد» تحبس أحداً.
      // النجومُ من مسطرة المراجعات نفسِها (`starsForReview`) — ومن أتمّ فلا
      // ينزل عن واحدة: الإتمامُ يُحسب، والإتقانُ يزيد.
      const stars = tries === 0 ? 0
        : Math.max(1, starsForReview(errors, items.length));
      if (tries > 0) progress.setStars(nodeId, stars);   // ولا تنزل نجمةٌ محفوظة — `setStars` لا يُنقص

      const score = h('p', { class: 'hint' },
        `أصبتَ ${arNum(right)} من ${arNum(tries)} محاولة (${arNum(rate)}٪)`);

      return h('div', { class: `celebrate${full ? '' : ' celebrate--again'}` },
        mascot(full ? 'mascot mascot--cheer' : 'mascot mascot--hello'),
        faceEl(gate.face, 'celebrate-face', 'div'),
        h('h2', {}, 'فُتِحَتِ البَوَّابَة!'),
        starsRow(stars, 'big-stars'),
        score,
        ...(full ? [] : [h('p', { class: 'rule' }, 'قَوِّ يَدَكْ — أَعِدْها متى شئتَ لنجومٍ أكثر')]),
        h('div', { class: 'row foot' },
          ...(full ? [] : [h('button', { class: 'btn', onclick: again }, '↻ أعِد المحاولة')]),
          h('button', { class: 'btn btn--primary', onclick: () => go('#/') }, '→ الخريطة')),
      );
    },
  });
}
