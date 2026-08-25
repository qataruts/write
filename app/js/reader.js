/**
 * 🔴 **قارئُ الكلمة** — تقييمُ ما كتبه الطفل في **الكلمات والجمل** وحدَها.
 *
 * **سندُه أمرُ المالك** (٢٥ أغسطس ٢٠٢٦، بعد أن عاين المحرّكَ في مشروع `write-engine`):
 * «هذه Google Input Tools تعطينا تقييماً ممتازاً لمدى دقّة كتابة الطفل وهو المطلوب…
 * فامضِ فيها» · «نستخدم أدوات دخل غوغل لتقييم الطفل وإعطاء النجوم وتحديث أداء الطفل
 * على صفحة وليّ الأمر» · «ننبّه المستخدم أنّ التطبيق يستخدم الإنترنت لتقييم الكتابة،
 * نطلب قبولَه عند أول مرّة يفتح التطبيق».
 *
 * **ولِمَ ملفٌّ مستقلّ؟** لأنّ **`pen.js` لا يعرف الشبكة بنيوياً** — عهدُ العائلة
 * الأصلُ («مساراتُ كتابة الطفل لا تغادر جهازه أبداً»)، ويحرسه فحصٌ نصيّ وفحصُ
 * متصفّحٍ بصفر طلبات. فالنقضُ محصورٌ هنا: **الكلماتُ وحدَها، بإذنٍ صريح، وبعلمٍ
 * معلَن** — **والحروفُ تُقاس على الجهاز ولا تغادره أبداً**.
 *
 * **وما يُرسَل**: إحداثياتُ الضربات مضغوطةً (لا صورة، ولا صوت، ولا اسم، ولا معرّف
 * جهاز) إلى نقطة `inputtools` — **بلا مفتاحٍ ولا حسابٍ ولا خادمٍ وسيط**: جُرّب
 * النداءُ المباشر من المتصفّح فنجح (تسمح النقطةُ بـCORS). وما يعود: مرشّحاتٌ نصّية
 * تُقارَن بالكلمة المطلوبة.
 *
 * ⚠ **والنقطةُ غير موثّقة** (وثّقه مشروع `write-engine` في وصفه): قد تتبدّل أو
 * تُحجب — **فهي تبعيةُ تقييمٍ لا تبعيةُ تطبيق**. ولذلك: مهلةٌ قصيرة، وسقوطٌ صامت،
 * **وبلا إذنٍ أو بلا إنترنت لا يُنادى شيء** ويمضي الطفلُ كما كان (مرسومُ المضيّ).
 */

const ENDPOINT = 'https://inputtools.google.com/request';
const ITC = 'ar-t-i0-handwrit';
/** مهلةٌ قصيرة: التقييمُ زينةٌ لا بابٌ — إن تأخّر مضى الطفلُ بلا انتظار. */
const TIMEOUT = 3500;

/** ضرباتُ اللوح ⇐ صيغةُ الحبر التي تقرؤها الخدمة: [[س…],[ص…],[ز…]] لكلِّ ضربة. */
export function inkOf(strokes) {
  return (strokes || [])
    .filter((s) => s && s.length)
    .map((s) => {
      const xs = [];
      const ys = [];
      const ts = [];
      for (const [i, p] of s.entries()) {
        xs.push(Math.round(p[0]));
        ys.push(Math.round(p[1]));
        ts.push(p[2] != null ? Math.round(p[2]) : i * 10);
      }
      return [xs, ys, ts];
    });
}

/**
 * يقرأ ما كُتب — ويعيد `{ candidates, ms }` أو `null` إن تعذّر.
 * **ولا يرمي أبداً**: عيبُ الشبكة لا يوقف طفلاً.
 */
export async function readInk(strokes, area, { language = 'ar', preContext = '' } = {}) {
  const ink = inkOf(strokes);
  if (!ink.length) return null;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), TIMEOUT);
  const started = Date.now();
  try {
    const res = await fetch(`${ENDPOINT}?itc=${ITC}&num=8`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: stop.signal,
      body: JSON.stringify({
        options: 'enable_pre_space',
        requests: [{
          writing_guide: {
            writing_area_width: Math.round(area?.w || 800),
            writing_area_height: Math.round(area?.h || 200),
          },
          pre_context: preContext,
          max_num_results: 8,
          max_completions: 0,
          language,
          ink,
        }],
      }),
    });
    const data = await res.json();
    if (!Array.isArray(data) || data[0] !== 'SUCCESS') return null;
    return { candidates: data?.[1]?.[0]?.[1] ?? [], ms: Date.now() - started };
  } catch {
    return null;                       // انقطاعٌ أو مهلةٌ أو حجب — يمضي الطفل
  } finally {
    clearTimeout(timer);
  }
}

/** تجريدُ النصِّ للمقارنة: بلا تشكيلٍ ولا تطويلٍ ولا مسافاتٍ زائدة. */
export const plain = (text) => (text || '')
  .replace(/[ً-ْٰـ]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

/**
 * **الحكمُ على المقروء**: أَمِن مرشّحاتها ما يطابق المطلوب؟
 *
 * والمطابقةُ على النصّ المجرَّد — فالطفلُ يكتب حروفاً بلا حركات، والخدمةُ قد تردّ
 * مشكولاً. **ورتبةُ المرشّح تُحفَظ** لأنّها قوّةُ الشهادة: الأولُ أقوى من الثامن،
 * وبها تُبنى النجومُ (`review.js`) ووصفُ لوحة وليّ الأمر.
 */
export function verdictOf(read, wanted) {
  if (!read) return null;
  const want = plain(wanted);
  const list = (read.candidates || []).map(plain);
  const rank = list.indexOf(want);
  return { ok: rank >= 0, rank, top: list[0] || '', candidates: list, ms: read.ms };
}
