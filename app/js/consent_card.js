/**
 * **بطاقةُ الإذن** — تُسأل مرّةً في أول تشغيل، ثم لا تعود.
 *
 * **سندُها أمرُ المالك** (٢٥ أغسطس ٢٠٢٦): «ننبّه المستخدم أنّ التطبيق يستخدم
 * الإنترنت لتقييم الكتابة، نطلب قبولَه عند أول مرّة يفتح التطبيق».
 *
 * **وهي بطاقةُ بالغٍ تُقرأ لا شاشةُ طفلٍ تُنطَق** (سابقةُ `firstrun.js`): صفرُ صوت،
 * ولا نصَّ يدخل `audio_queue.json`، **ولا فراغَ محجوزٌ** حين تغيب — لا تُبنى أصلاً.
 *
 * 🔒 **ولا تعرف الشبكة**: تخزن جواباً محليّاً لا غير — والقارئُ (`reader.js`) هو
 * وحدَه من ينادي، ولا ينادي إلا بجوابها.
 */

import { h } from './ui.js';
import { consentState, setConsent, NOTICE } from './consent.js';

/** بطاقةُ السؤال — أو `null` إن أُجيب من قبل. */
export function consentCard(rerender) {
  if (consentState() !== 'ask') return null;

  const answer = (value) => {
    setConsent(value);
    rerender();
  };

  return h('section', { class: 'card firstrun-card consent-card' },
    h('h2', { class: 'firstrun-title' }, 'تقييمُ الكلمات — إذنُك أوّلاً'),
    h('p', { class: 'firstrun-text' }, NOTICE),
    h('p', { class: 'hint' },
      'ومَن اختار «لا» يمضي طفلُه كما هو — يكتب ويتدرّب، ولا يُقيَّم كلماتُه.'
      + ' ويمكنك تبديلُ الجواب متى شئت من لوحة وليّ الأمر.'),
    h('div', { class: 'firstrun-row' },
      h('button', { class: 'btn btn--primary', onclick: () => answer('yes') },
        'أوافق — قيِّم الكلمات'),
      h('button', { class: 'btn btn--ghost', onclick: () => answer('no') },
        'لا، بلا إنترنت')));
}
