// عامل الخدمة — التطبيق يعمل دون إنترنت (الجلسة ٦).
//
// لماذا هذا مهمّ هنا بالذات: الصوت كله ملفات مخزونة أصلاً (قاعدة المشروع الثابتة)،
// فلا ينقص التطبيقَ للعمل دون شبكة إلا خزنُ الهيكل والملفات. بعد أول فتح يعمل
// «اُكْتُبْ» كاملاً في الطائرة وفي السيارة وفي بيت بلا إنترنت — وهو حال أكثر
// من يحتاجه.
//
// استراتيجيتان لا ثالثة:
//   • الهيكل (HTML/CSS/JS/الفهارس): اعرض المخزون فوراً وحدِّثه في الخلفية
//     (stale-while-revalidate) — فتحٌ فوريّ، والتحديث يظهر في الفتحة التالية.
//   • الصوت (mp3): من المخزون دائماً — **بالرابط الموسوم ببصمة محتواه**.
//
// **ولماذا الوسم؟** اسم ملف الصوت sha1 **نصّه** لا محتواه، فاستبدال الصوت تحت
// المفتاح نفسه (edge ← Sulafat، وانتقاء المدود، وأيّ تسجيل بشري بديل) لا يغيّر
// الرابط — والجهاز الذي خزّن النسخة القديمة يبقى عليها إلى الأبد، فيُسمع الحرف
// الواحد بصوتين بحسب تاريخ أول طلبٍ لكل جهاز (بلاغ المالك، ٥ أغسطس ٢٠٢٦).
// فصار التطبيق يطلب `<key>.mp3?v=<بصمة البايتات>` من `audio/versions.json`،
// وهنا **يُخزَن بالرابط الموسوم ويُنظَّف الوسم الأقدم لذلك الملف وحده** — فتبديل
// ملفٍّ واحد لا يُسقِط مخزون البقية.
//
// والصوت هنا **بيانٌ واحد**: فهرس الأصوات المولّدة (`audio/manifest.json`
// وبصماتُه `audio/versions.json`). ولا بيانَ تلاوةٍ ولا نصَّ مصحف في «اُكْتُبْ»،
// **وأصواتُ الإملاء كلُّها ملفاتُ اقرأ بأعيانها** تُنسخ ببصماتها (`METHOD.md §٧`).
//
// عند تغيير أي ملف من ملفات الهيكل: ارفع VERSION فيُمحى مخزون **القشرة** القديم.
// ويحرس اختبار `tools/test_pwa.mjs` أن قائمة SHELL لا تنسى ملفاً موجوداً في app/،
// و`tools/test_audio_cache.mjs` يشغّل هذا الملف نفسَه على كاشٍ وشبكةٍ مزيَّفين.
//
// **ولماذا اسمُ مخزن الصوت بلا نسخة؟** (درسُ اقرأ في «خفّة التخزين») كان عندَه
// `<اسم>-audio-${VERSION}`، فكلُّ حزمةٍ ترفع النسخة كانت تولّد مخزناً فارغاً وتمحو
// السابق ⇒ يعيد جهازُ الطفلة تنزيل الصوت كلِّه (٤١ ميغابايت اليوم، وأكثر غداً) في
// كل تحديث. **وهو هدرٌ محض**: طزاجةُ الصوت تحكمها بصمةُ محتواه في الرابط (`?v=`) لا
// اسمُ المخزن، والكنسُ في آخر `precacheAudio` يحذف ما بَطَل بالفعل. فصار الاسم ثابتاً
// يعبر النسخ، وبقيت القشرة موسومةً كما هي (ملفاتُها تتغيّر تحت أسمائها فتحتاج الوسم).
// ومع الاسم الثابت **لا يُطلَب من الشبكة إلا الناقص** (`cache.add` يجلب دائماً وإن
// كان مخزوناً — فالسكوت عن ذلك كان يُبقي العيب قائماً باسمٍ ثابت).

// **نسخةُ «اُكْتُبْ» تبدأ من ١** وسلوكُها سلوكُ `v20` في اقرأ (مخزنٌ ثابت للصوت،
// وشفاءٌ عند أول اتصال، وشفافيةُ تحميل) — فالبذرةُ تُنسخ ولا تُستورَد، وتاريخُ
// نسخِ اقرأ تاريخُه هو. عند تغيير أي ملف من ملفات الهيكل: ارفع `VERSION`.
// v7: **حزمةُ الجلسة ٤ب — منقولاتُ اقرأ الميدانية ترقيةً واحدة** (لا ثلاثاً): إصلاحُ
// تكدّس الأصوات، وقفلُ المقياس، وبابُ التثبيت. ترقيةُ نسخةٍ واحدة للحزمة كلها لأنها
// تصل جهازَ الطفل معاً، وثلاثُ ترقياتٍ متتابعة تُعيد بناءَ القشرة ثلاثاً بلا فائدة.
// v8: **الجلسة ٤ج — قناةُ الصوت الواحدة** (`audio.js`): التتابعُ ينتظر `ended` لا مهلةً،
// والتزاحمُ طابورٌ لا إسكاتٌ أسرع. ملفُّ قشرةٍ واحدٌ تبدّل، ولا وحدةَ زِيدت إلى `SHELL`.
// **و`v11` (الجلسة هـ٢)**: خطُّ العلامة صار `Aref Ruqaa` بحكم المالك — ملفّاه في القشرة
// **وملفُّ Marhey أُسقط منها**، فلا يبقى على جهاز طفلٍ وزنٌ ميتٌ لعلامةِ أخينا.
// **و`v12` (الجلسة م٢)**: تصحيحُ قفل الزوم بنقض الميدان. **والرفعةُ هنا شرطُ وصوله**:
// `index.html` و`main.js` في القشرة، فبلا رفعةٍ يبقى الجهازُ المثبَّت على قشرته المخزونة —
// **ويبقى القفلُ على آيباد الطفلة التي جاء منها البلاغُ نفسُه**، وهو أسوأُ ما يقع: تصحيحٌ
// يُكتب ولا يصل. (كذلك فعل `read@7f18bf0` في بابه.)
// **و`v13` (الجلسة ٥)**: أوّلُ شاشةِ درسٍ (`js/lesson.js`) و**أوّلُ بنكِ صوت** —
// أسماءُ حروف المجموعات ١–٣ منسوخةً من بنك اقرأ ببصماتها (`docs/SEED.md §٥`). فدخل
// الفهرسُ وبيانُ البصمات قائمةَ القشرة كما طالب `tools/test_pwa.mjs` من نفسه يومَ
// ظهرا على القرص، **وملفاتُ الصوت نفسُها لا تدخلها**: يخزنها `precacheAudio` من
// الفهرس (فالفهرسُ سطران في القشرة والصوتُ مئاتٌ في مخزنه الثابت).
// **و`v14` (الجلسة ٦)**: الحروفُ الـ٢٨ كلُّها بمساراتها (`js/paths.js`) وبأسمائها في
// البنك (١٦ ملفاً زِيدت منسوخةً من بنك اقرأ ببصماتها)، وبوابةُ الحرف المعزول.
// **والرفعةُ هنا شرطُ وصول الصوت**: الفهرسُ في القشرة، فجهازٌ مثبَّتٌ بقي على فهرسه
// المخزون لا يعرف أنّ لِـ«عَين» ملفاً — فيصمت اسمُ الحرف عند أوّل درسٍ من المجموعة ٤.
// **و`v15` (الجلسة ٧)**: محطاتُ أشكال المواقع وتمييزُ المتشابهات — منهجٌ جديد
// (`js/curriculum.js`) وشاشةٌ بوحداتها (`js/lesson.js`) وشارةُ الشكل في `js/pen.js`،
// فجهازٌ مثبَّتٌ على القشرة القديمة يقرأ رحلةً بلا محطات الأشكال.
// **و`v16` (الجلسة ٨)**: الوصلُ والنسخ — شاشتُه (`js/copy.js`) ومساراتُ كلماته
// (`js/word_paths.js`، وحدةٌ ثالثةٌ مولَّدة) وأصواتُ الكلمات من بنك اقرأ ببصماتها.
// **والرفعةُ شرطُ وصول الوحدة الجديدة**: `main.js` يستوردها، فجهازٌ مثبَّتٌ على قشرته
// القديمة يقف عند أوّل كلمةٍ يُطلب نسخُها.
// **و`v17` (الجلسة ٩)**: خفوتُ النموذج والإملاءُ والجمل — شاشتان جديدتان
// (`js/fade.js` و`js/sentence.js`) ومساراتُ الجمل في `js/word_paths.js` وأصواتُها
// العشرون من سلّم اقرأ ببصماتها، **فالفهرسُ في القشرة**: جهازٌ مثبَّتٌ على فهرسه
// المخزون يصمت عنده صوتُ أوّل جملةٍ تُملى وهي في البنك.
// **و`v18` (الجلسة ١٠)**: لوحةُ وليّ الأمر بخرائط أخطاء الاتجاه (`js/parent.js`)،
// **ووسمُ بنية الرحلة في حال الطفل** (`js/progress.js`): بلا الرفعة يبقى جهازٌ مثبَّتٌ
// على وحدةٍ تُعيد زرعَ ما صفّره وليُّ الأمر عند كلِّ إقلاع. ولا ملفَّ جديد في القشرة.
// **و`v19` (الجلسة ص — الصوتيات)**: تعليماتُ الشاشات الخمسَ عشرةَ صُرِّفت بصوت
// سُلافات، **فالفهرسُ في القشرة**: جهازٌ مثبَّتٌ على فهرسه المخزون لا يعرف أنّ
// لـ«تَتَبَّعِ الْمَسَارْ» ملفاً، فيبقى على النطق الآليّ احتياطاً وهو في البنك —
// وهو نقضُ وعدِنا المعلَن. ولا ملفَّ جديد في القشرة، والرفعةُ لأجل الفهرس وحدَه.
// **وفيها أيضاً قاعدةُ همزة الوصل** (`docs/AUDIO_QUEUE.md`): تسعُ تعليماتٍ بُدِّلت
// صورتُها فبُدِّلت مفاتيحُها معها (المفتاحُ من النصّ)، وتقاعدت ملفاتُها السابقة —
// فالفهرسُ المخزون يحمل مفاتيحَ لا ملفاتِ لها، **وهو الصمتُ بعينه** لولا الرفعة.
// **و`v20` (الجلسة ص — وزنُ «نسخ»)**: `نَسَخَ` مضارعُه `يَنْسَخُ`، فأمرُه `انْسَخْ`
// لا `انْسُخْ` — بُدِّلت ثلاثُ تعليماتٍ منطوقة فبُدِّلت مفاتيحُها، وتقاعدت ملفاتُها
// السابقة. **وعلّةُ الرفعة عينُ علّة `v19`**: مفتاحٌ في فهرسٍ مخزونٍ بلا ملفٍّ صمتٌ.
// **و`v23` (النشرُ الجامع، ١٥ أغسطس ٢٠٢٦)**: رفعةٌ واحدة تحمل حصادَ أربع جلسات،
// **وكلُّها لا تصل جهازاً مثبَّتاً بدونها**:
//   · **التوسعةُ و«الشكلُ لا الأثر» ومفاصلُ المراحل** — وحداتٌ تبدّلت تحت أسمائها
//     (`js/curriculum.js` و`js/progress.js` وأخواتُها)، والمخزونُ يحجبها.
//   · **«بلِّغنا»** — **ملفٌّ جديدٌ في القشرة** (`js/feedback.js`): فهرسٌ مخزونٌ لا
//     يعرفه أصلاً، فتسقط اللوحةُ عند استيراده. وهذا أشدُّ صنوف العطب: **لا يظهر
//     عندنا ألبتّة ولا يظهر إلا على جهازٍ مثبَّتٍ من قبل**.
//   · **والأصواتُ الستةُ المجدَّدة** (`SEED §١٣`) — وعلّتُها ألطفُ من أخواتها:
//     البصماتُ في `audio/versions.json` **وهو من القشرة**، فجهازٌ على بيانه المخزون
//     يظلّ يطلب الوسمَ القديم فيُخدَم من مخزونه، **ولا يسمع ما اعتمدته الأذنُ أبداً**.
//     فالرفعةُ هنا شرطُ وصول صوتٍ لا شرطُ وصول شيفرة.
// **و`v24` (نشرةُ العلل الميدانية الثلاث، ١٥ أغسطس ٢٠٢٦)**: ثلاثُ علل ميدانٍ في
// رفعةٍ واحدة، **وكلُّها لا تصل جهازاً مثبَّتاً بدونها**:
//   · **نقاطُ الحرف تُفَكّ** (م٤ — «الشين بنقطة واحدة؟!»): `js/paths.js` و
//     `js/word_paths.js` **وحدتان تبدّلتا تحت اسميهما**، وجهازٌ على مخزونه يبقى
//     يرسم دائرةً واحدةً للعنقود الثلاثيّ — **وهي هويةُ حرفٍ لا زينة**.
//   · **بوابةٌ تُعبَر لا حائطٌ يُرتَطَم** (م٥ — بلاغُ الميدان ٤): `js/review.js` و
//     `js/gate.js` و`js/pen.js` — ومن غيرها يبقى الطفلُ في محطةٍ بلا مخرج.
//   · **وفائضُ اللوح الرأسيّ** (`css/app.css`): طفلٌ يسحب الشاشةَ ليرى بقيّةَ لوحه
//     وهو يكتب — وهو جنسُ ما أخرج الطفلةَ من الجهاز في بلاغ الميدان ٢.
// v25: حسمُ المراجعة المستقلة (جلسة ح + حكمُ الميزان): طريقُ الكلمة إلى الإملاء
//   موصولٌ مقيساً — المراجعةُ تُنضج بدرجات `fade.js` بأعيانها، والبستانُ يكسب
//   درجةَ النسخ الحر، و`HITS_PER_STEP=1` بحكم المالك، ومحطةُ الاسم في موضعها
//   المعلَّل، و٣ جملٍ سقفاً — ولقطاتُ التعريف أُعيدت من الحاضر (أحفورتا
//   التاءِ بنقطةٍ و`false` زالتا).
// v26: **بوابةُ اللحاق** (`FAMILY §١٠/هـ`) — امتحانُ تحديد مستوىً اختياريّ من لوحة
//   وليّ الأمر: ملفٌّ جديد في القشرة (`js/catchup.js`) وبابُه في `js/parent.js`
//   ومنفذُه في `js/main.js`، ومحرّكُ الجلسة كسب مُصيِّراتٍ تُبدَّل (`js/review.js`).
//   **وبلا الرفعة يبقى جهازٌ مثبَّتٌ على قشرةٍ لا تعرف الملفَّ الجديد**: يفتح وليُّ
//   الأمر لوحتَه فيقع على شاشةٍ بيضاء — استيرادٌ لملفٍّ ليس في مخزونه.
// v27: سقفُ عيّنة وحدة اللحاق (`UNIT_CAP=10` في `js/catchup.js` — حكمُ إدارة على
//   بلاغ جلسة ل): امتحانُ اللحاق لا يطلب من اليد في الجلوس ما لا تطلبه محطة.
//   ملفُّ هيكلٍ تبدّل تحت اسمه — فالرفعةُ سنّةُ البيت.
// v28: مفتاحُ إطفاء مسجّل الأحداث `&log=0` (`js/main.js`) — بلاغُ ميدان قياس الرفض
//   الكاذب: لوحُ المسجّل يشغل ربعَ شاشة الآيباد فيزاحم لوحَ الكتابة في جلسة قياس.
//   ملفُّ هيكلٍ تبدّل تحت اسمه، والافتراضُ كما كان لمن يشخّص نقرة.
// v29: **سماحةُ شولة الكاف معلَنةً في بيان الحرف** (حكمُ المالك على صيد أوّل جلسة
//   ميدان): `js/paths.js` تكسب حقلَ `ease` على ضربةٍ ملحقةٍ صغيرة، و`js/pen.js` يقرؤه
//   تغطيةً لجزئه وحدَه، و`js/pendev.js` يلتقط النقرات (كان يبلع نقطةَ الحرف).
//   **ثلاثةُ ملفاتِ هيكلٍ تبدّلت تحت أسمائها** — فجهازٌ مثبَّتٌ بلا رفعةٍ يبقى على
//   كافٍ لا تنضبط في يد طفلته وعلى دفترِ التقاطٍ يُسقِط نقطةَ الباء.
const VERSION = 'v30';
const SHELL_CACHE = `uktub-shell-${VERSION}`;
const AUDIO_CACHE = 'uktub-audio';          // ثابتٌ عمداً — لا يحمل VERSION
const KEEP = [SHELL_CACHE, AUDIO_CACHE];

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'fonts/NotoNaskhArabic-arabic.woff2',
  'fonts/NotoNaskhArabic-latin.woff2',
  'fonts/BalooBhaijaan2-arabic.woff2',
  'fonts/BalooBhaijaan2-latin.woff2',
  'fonts/ArefRuqaa-arabic-400.woff2',
  'fonts/ArefRuqaa-arabic-700.woff2',
  'audio/manifest.json',
  'audio/versions.json',
  'js/audio.js',
  'js/catchup.js',
  'js/copy.js',
  'js/curriculum.js',
  'js/fade.js',
  'js/feedback.js',
  'js/gate.js',
  'js/install.js',
  'js/lesson.js',
  'js/main.js',
  'js/parent.js',
  'js/paths.js',
  'js/pen.js',
  'js/pendev.js',
  'js/probe.js',
  'js/progress.js',
  'js/review.js',
  'js/sentence.js',
  'js/support.js',
  'js/ui.js',
  'js/warmup.js',
  'js/warmups.js',
  'js/word_paths.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png',
];

// **ولا يُكتب هنا فهرسٌ لبنكٍ لم يُنشأ**: `audio/manifest.json` و`audio/versions.json`
// يكتبهما المولّد، و`app/audio/` **لا تلمسه جلساتُ التطوير أبداً** (`AUDIO_QUEUE.md`).
// فيومَ يُصرَّف أوّلُ صوت يُطالِب `tools/test_pwa.mjs` بإدخالهما هنا **من نفسه**:
// قائمتُه مشتقّةٌ من القرص لا مكتوبةً بيد. وكذلك `emoji/index.json`.

// ملفات الصوت: مفتاحٌ من ١٢ خانة، وقد يسبقه وسمُ تلاوة الكلمة المفردة `wbw-`
// (الحزمة ١٢) — وهو يفصل ملفَّ المصحف عن ملفٍّ مولَّد له المفتاح نفسُه.
const AUDIO_RE = /\/audio\/(wbw-)?[0-9a-f]{12}\.mp3$/;

// مسار الصفحة التعريفية (`app/welcome/`) — ليست من التطبيق: لا في SHELL ولا في
// المخزون ولا في ردّ التنقّل. مشتقٌّ من النطاق فيصحّ في أي مجلدٍ نُشر فيه التطبيق.
const WELCOME = new URL('welcome/', self.registration.scope).pathname;

const json = (path) => fetch(new URL(path, self.registration.scope))
  .then((r) => (r.ok ? r.json() : null))
  .catch(() => null);

// **`precacheStories` لم تُنقَل**: لا قصص في «اُكْتُبْ» ألبتّة (`METHOD.md §٤`) —
// حذفُ ما لا موضوعَ له أبداً، لا تعليق.

/** خزن أيقونات الرموز **من فهرسها** (مهمة «أيقونات لا إيموجي»).
 *
 *  رفعُ نسخةٍ مبرَّرٌ هنا: كانت الصور محارفَ يرسمها خطُّ الجهاز فلا وزنَ لها، وصارت
 *  ملفات SVG — فلولا خزنُها لظهر الطفلُ دون إنترنت أمام كلماتٍ بلا صور، وهي في
 *  «اقرأ واختر» و«أكمل الجملة» السؤالُ نفسُه لا زينتَه. وثمنُها نصفُ ميغابايت مرّةً
 *  واحدة (أقلُّ من ملفَّي صوت).
 *
 *  ومن الفهرس لا من قائمةٍ يدوية هنا — كالأصوات والقصص سواءً: رمزٌ جديد في المنهج
 *  غداً يجلبه `tools/fetch_twemoji.py` فيدخل المخزون بلا سطرٍ في هذا الملف. */
async function precacheEmoji() {
  const index = await json('emoji/index.json');
  const cache = await caches.open(SHELL_CACHE);
  await Promise.all(Object.keys(index?.files || {}).map((key) =>
    cache.add(new URL(`emoji/${key}.svg`, self.registration.scope)).catch(() => {})));
}

/** رابط ملف صوتٍ باسمه على القرص، موسوماً ببصمة محتواه (بلا بصمة: الرابط كما هو). */
function audioUrl(stem, tags) {
  const href = new URL(`audio/${stem}.mp3`, self.registration.scope).href;
  return tags[stem] ? `${href}?v=${tags[stem]}` : href;
}

/** حجم الدفعة: ٢٦٢٨ طلباً متوازياً في `install` قطيعٌ يخنق الشبكة على جهازٍ منزليّ
 *  ويزاحم أصواتَ الطفل نفسِه وهو يلعب. ستَّ عشرةَ في النفَس تكفي الإنتاجية ولا تخنق. */
const AUDIO_BATCH = 16;

/** ترتيب الأولوية بلا أن يعرف عاملُ الخدمة أين بلغ الطفل (تقدّمُه في تخزين الصفحة،
 *  ولا طريق من هنا إليه ولا يُراد): **ما سمعه الطفل مخزونٌ سلفاً** (يخزنه `cacheFirst`)
 *  فيسقط من قائمة الجلب أصلاً؛ والباقي يُرتَّب بأثر المنهج نفسِه في النصّ: المنهج يصعد
 *  من اسم الحرف إلى الحرف بحركته إلى المقطع إلى الكلمة إلى الجملة، **وطولُ النصّ هو
 *  أثرُ ذلك الصعود** — فالأقصر أوّلُ ما يحتاجه، والأطول أبعدُه. وتلاوةُ القارئ آخِراً:
 *  المرحلة القرآنية آخرُ الرحلة لكل طفل. فإن انقطع التخزين كان الناقصُ أبعدَ ما يحتاج. */
function audioOrder(generated) {
  return Object.entries(generated || {})
    .map(([stem, text]) => ({ stem, far: [...String(text)].length }))
    .sort((a, b) => (a.far - b.far) || (a.stem < b.stem ? -1 : 1))
    .map((e) => e.stem);
}

/** تبنّي مخزون صوتٍ موسومٍ بنسخةٍ سابقة (`uktub-audio-*`) — مرّةً واحدة في عمر كل
 *  جهاز: يوم يعبر إلى الاسم الثابت. **ولا مخزنَ قديمٌ اليوم** (الاسمُ ثابتٌ من أول
 *  يوم، وقد وُلد هذا التطبيق بعد أن تعلّم اقرأ الدرسَ) — وتبقى الدالّة لأن كلَّ
 *  تبديلٍ لاسم مخزنٍ غداً يمرّ من هنا، وهي مجّانيةٌ ما دام لا شيء يطابقها. */
async function adoptLegacyAudio(cache) {
  const legacy = (await caches.keys())
    .filter((name) => name.startsWith('uktub-audio-') && name !== AUDIO_CACHE);
  for (const name of legacy) {
    const old = await caches.open(name);
    for (const request of await old.keys()) {
      const response = await old.match(request);
      if (response) await cache.put(request, response);
    }
  }
}

/** خزن الأصوات كلها من بياناتها — بعدها لا يحتاج التطبيق شبكةً البتّة.
 *  والبيانُ واحد: فهرسُ المولَّد («مفتاح ← نصّ») ومعه بصماتُ محتواه، فيُخزَن
 *  بالرابط الذي يطلبه التطبيق نفسِه. (ولا بيانَ تلاوةٍ هنا: لا نصّ مصحف في اكتب.)
 *  ثم **تُكنَس الأوسمة الغابرة**: كل مخزونٍ ليس في المتوقَّع اليوم (وسمٌ أقدم
 *  لملفٍ استُبدل، أو رابطٌ بلا وسم خُزن قبل قراءة البصمات) يُحذف — فلا يبقى في
 *  الجهاز أثرٌ للصوت القديم يُسمَع من طريقٍ آخر.
 *
 *  **ولا يُجلَب إلا الناقص**: `cache.add` يجلب من الشبكة دائماً وإن كان الملف مخزوناً،
 *  فبه كانت الترقيةُ تعيد تنزيل الصوت كلِّه ولو ثبت اسمُ المخزن. والمخزونُ يُقارَن
 *  بالرابط الموسوم نفسِه، فملفٌ تبدّلت بصمتُه يُجلَب وحدَه.
 *
 *  **والإخفاق يُعدّ ولا يُبتلَع**: `catch(() => {})` كان يُخفي تجاوزَ حصة التخزين
 *  (سقفُ سفاري على الأجهزة الأقدم ضيّق) فتفشل ملفات ويصمت الصوت خارج الشبكة بلا
 *  خبر. فإن أخفق شيءٌ **لا نكنس**: القديمُ الصالح خيرٌ من فراغٍ في أذن الطفل، وسطرُ
 *  «الأصوات المخزونة: س من ص» في لوحة وليّ الأمر يقيس الحاصل من المخزن نفسِه. */
async function precacheAudio() {
  const cache = await caches.open(AUDIO_CACHE);
  const [generated, versions] = await Promise.all([
    json('audio/manifest.json'), json('audio/versions.json'),
  ]);
  const tags = { ...(versions || {}) };
  await adoptLegacyAudio(cache);

  const urls = audioOrder(generated).map((stem) => audioUrl(stem, tags));
  const have = new Set((await cache.keys()).map((request) => request.url));
  const missing = urls.filter((url) => !have.has(url));

  let failed = 0;
  const total = urls.length;
  let done = total - missing.length;
  await report({ stored: done, total, busy: missing.length > 0 });
  for (let i = 0; i < missing.length; i += AUDIO_BATCH) {
    // واحداً واحداً داخل الدفعة: ملفٌ ناقص لا يُسقِط الدفعة كلها (بخلاف cache.addAll)
    const batch = await Promise.all(missing.slice(i, i + AUDIO_BATCH)
      .map((url) => cache.add(url).then(() => true, () => false)));
    failed += batch.filter((ok) => !ok).length;
    done += batch.filter(Boolean).length;
    await report({ stored: done, total, busy: true });   // **بعد كل دفعة**: يرى المستعمل تقدّماً حقيقياً
  }
  await report({ stored: done, total, busy: false, failed });
  if (failed) console.warn(`[sw] تعذّر خزن ${failed} ملفاً صوتياً من ${missing.length}`);

  if (!generated) return { complete: false, failed, missing: missing.length };
  if (failed) return { complete: false, failed, missing: missing.length };
  const wanted = new Set(urls);
  const stale = (await cache.keys()).filter((request) => !wanted.has(request.url));
  await Promise.all(stale.map((request) => cache.delete(request)));
  return { complete: true, failed: 0, missing: 0 };
}

/** هل المخزونُ الصوتيّ تامٌّ الآن؟ — يُحسب من البيانات والمخزن، لا يُؤخذ من ذاكرة
 *  نسخةٍ سابقة من العامل: العاملُ يُنهى ويُبعَث بين `install` و`activate`، فحالةٌ
 *  محفوظةٌ في متغيّرٍ لا يُوثَق بها في قرارٍ يُتلف مخزوناً. */
async function audioComplete() {
  const [generated, versions] = await Promise.all([
    json('audio/manifest.json'), json('audio/versions.json'),
  ]);
  if (!generated) return false;                 // بيانٌ لم يصل: لا نحكم بالتمام
  const tags = { ...(versions || {}) };
  const urls = audioOrder(generated).map((stem) => audioUrl(stem, tags));
  const cache = await caches.open(AUDIO_CACHE);
  const have = new Set((await cache.keys()).map((request) => request.url));
  return urls.every((url) => have.has(url));
}

/* **شفاءُ المخزون عند أول اتصال** (بلاغ المالك، ١٣ أغسطس ٢٠٢٦): كان التنزيلُ يقع
   مرّةً واحدة في `install`؛ فجهازٌ حُذف تطبيقُه وأُعيد تثبيته **وهو مفصولٌ عن
   الشبكة** لا يخزّن ملفاً واحداً، ولا تعود المحاولةُ إلا بترقيةٍ جديدة — فيصمت
   الصوتُ ولا يُصلحه إلا صدفة. فصارت المحاولةُ تتكرّر عند كل فتحةٍ للتطبيق،
   مكبوحةً بدقيقة، ولا تجلب إلا الناقص. */
let syncing = false;
let healed = false;             // مرّةً في عمر العامل (وكلُّ بعثٍ فرصةٌ جديدة)
const HEAL_AFTER = 10000;       // عشرُ ثوانٍ: تكفي لتمضي الفتحةُ للطفل، ولا تطول
                                // حتى يُنهي iOS العاملَ قبل أن يبدأ الشفاء أصلاً

async function syncAudio() {
  if (syncing) return;
  syncing = true;
  try {
    await precacheAudio();
  } catch (e) {
    console.warn('[sw] تعذّرت مزامنة الصوت', e);
  } finally {
    syncing = false;
  }
}

/** شفاءُ الناقص — **مرّةً في عمر العامل وبعد مهلة**، وثلاثةُ قيودٍ لكلٍّ علّته:
 *
 *  ١) **مرّةً لا كلَّ فتحة**: العاملُ يُنهى ويُبعث، فمع كل بعثٍ فرصةٌ جديدة — وذلك
 *     يكفي للشفاء ولا يجعله عادةً في كل تنقّل.
 *  ٢) **بعد مهلة**: الفتحةُ الأولى للطفل أَولى بالشبكة من تنزيلٍ خلفيّ. ولولا
 *     المهلةُ لزاحم الشفاءُ الشاشةَ التي جاء يخدمها — وقد قِيس ذلك: كان يُبطئ
 *     ظهورَ الصوت في الاختبار حتى تنتهي مهلتُه.
 *  ٣) **ولا يعمل على تامّ**: الجردُ أولاً، فجهازٌ مخزونُه كامل لا يطلب بايتاً. */
async function healAudio() {
  if (healed || syncing) return;
  healed = true;
  await new Promise((resolve) => setTimeout(resolve, HEAL_AFTER));
  if (await audioComplete()) return;
  await syncAudio();
}

/** **إبلاغُ النوافذ بحال خزن الصوت** (أمر المالك، ١٣ أغسطس ٢٠٢٦: «يجب أن نُظهر
 *  التحميل ليتأكّد المستعمل أنّ التحميلات جاهزة»): كان الخزنُ يجري صامتاً في
 *  الخلفية، فلا يعرف أحدٌ أتمَّ أم لا — حتى يفاجئه صمتٌ في الطائرة. فصار العاملُ
 *  يبعث حالَه بعد كل دفعة، وتعرضه لوحةُ وليّ الأمر شريطاً حيّاً. */
async function report(state) {
  // بيئةٌ بلا `clients` (فحصٌ مزيَّف أو متصفّحٌ قديم): الخزنُ يمضي والإبلاغُ يسقط
  // وحدَه — فالبلاغ زينةُ شفافيةٍ لا شرطُ عمل.
  if (typeof self.clients?.matchAll !== 'function') return;
  const windows = await self.clients.matchAll({ type: 'window' });
  for (const client of windows) client.postMessage({ type: 'audio-progress', ...state });
}

/** طلبٌ صريح من المستعمل: «نزّل الأصوات الآن» — يتجاوز مهلةَ الشفاء ولا ينتظرها.
 *
 *  **و«ما نسختُك؟»** (أمر المالك، ١٣ أغسطس ٢٠٢٦ — بلاغُ العائلة `version-visibility`):
 *  رؤيةُ النسخة تؤكّد وصولَ آخر قشرةٍ إلى الجهاز، **فلا يشهد ميدانٌ على شيفرةٍ لم
 *  تصله** — وقد دُفع ثمنُ ذلك مرّتين في احسب. **والجوابُ من `VERSION` نفسِه**: هذا
 *  العاملُ هو الذي يعمل على الجهاز الآن، فما يقوله نسخةُ **ما يعمل** لا ما نُشر —
 *  ولا رقمَ يُكتب بيد في موضعٍ ثانٍ يشيخ. */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'version') {
    event.source?.postMessage({ type: 'version', version: VERSION });
    return;
  }
  if (event.data?.type !== 'audio-sync') return;
  event.waitUntil(syncAudio());
});

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.all(SHELL.map((path) =>
      cache.add(new URL(path, self.registration.scope)).catch(() => {})));
    await precacheEmoji();
    await precacheAudio();
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // **ولا يُهدَم مخزونٌ كاملٌ لأجل ناقص** (بلاغ مالك اقرأ): كان الكنسُ عندَه
    // يحذف مخازنَ الصوت القديمة بلا شرط، فلو انقطعت الشبكةُ أثناء التبنّي
    // ضاع الكاملُ وبقي الناقص — ولا يستردّه إلا اتصالٌ طويل. فمخازنُ الصوت القديمة
    // تبقى حتى يثبت تمامُ الجديد **بالجرد لا بالظنّ**.
    const names = await caches.keys();
    const stale = names.filter((n) => n.startsWith('uktub-') && !KEEP.includes(n));
    await Promise.all(stale
      .filter((n) => !n.startsWith('uktub-audio-'))
      .map((n) => caches.delete(n)));
    await self.clients.claim();

    // **الترتيبُ شرط**: يُتبنّى القديمُ ويُستكمَل الناقصُ **أولاً**، ثم يُحكَم بالتمام،
    // ثم يُحذف القديم. وعكسُه يحكم بالنقصان على مخزنٍ لم يُملأ بعدُ فيُبقي نسختين،
    // أو — لو قُدّم الحذف — يمحو الكاملَ قبل أن يُنسخ.
    await syncAudio();
    const legacyAudio = (await caches.keys())
      .filter((n) => n.startsWith('uktub-audio-') && n !== AUDIO_CACHE);
    if (legacyAudio.length && await audioComplete()) {
      await Promise.all(legacyAudio.map((n) => caches.delete(n)));
    }
  })());
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

/**
 * الصوت: المخزون أولاً **بالرابط الموسوم**.
 * وسمٌ جديد = مفتاحُ خزنٍ جديد = طلبُ شبكةٍ لهذا الملف وحده، وبعد خزنه يُحذف
 * وسمُه الأقدم فوراً (فلا نسختان لملفٍ واحد، ولا يعود القديم من باب خلفيّ).
 * وإن سقطت الشبكة ولم يكن الوسمُ الجديد مخزوناً: نسخةٌ بوسمٍ أقدم خيرٌ من صمتٍ
 * في أذن الطفل — نُخرجها ولا نخزنها بالوسم الجديد، فتُصحَّح أول اتصال.
 */
async function cacheFirst(request) {
  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request).catch(() => null);
  if (response && response.ok) {
    await cache.put(request, response.clone());
    await dropOtherTags(cache, request);
    return response;
  }
  return (await cache.match(request, { ignoreSearch: true })) || response || Response.error();
}

/** حذف ما خُزن لهذا الملف بأوسمةٍ أخرى (أو بلا وسم) — إبقاءُ الجديد وحده. */
async function dropOtherTags(cache, request) {
  const siblings = await cache.keys(request, { ignoreSearch: true });
  await Promise.all(siblings
    .filter((other) => other.url !== request.url)
    .map((other) => cache.delete(other)));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;      // لا مصدر خارجياً في هذا التطبيق أصلاً

  // الصفحة التعريفية خارج القشرة عمداً (جلسة الصفحة التعريفية): لا تُخزَّن، ولا
  // يبتلعها ردُّ التنقّل أدناه — ولولا هذا السطر لفُتح التطبيقُ مكانَها على كل جهازٍ
  // ثبّته، فلا يبلغ المعلّمُ الصفحةَ أصلاً. تُترك للشبكة كأنّ لا عاملَ خدمةٍ هنا.
  if (url.pathname.startsWith(WELCOME)) return;

  if (AUDIO_RE.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  // التنقّل دائماً إلى index.html: التطبيق صفحة واحدة بمسارات hash
  if (request.mode === 'navigate') {
    // وكلُّ فتحةٍ فرصةُ شفاء: ما نقص من الصوت يُستكمَل الآن إن كانت هناك شبكة —
    // مكبوحاً بدقيقة، ولا يجلب إلا الناقص، فلا يثقل فتحةً ولا يكرّر تنزيلاً.
    event.waitUntil(healAudio());
    event.respondWith(staleWhileRevalidate(new Request(new URL('index.html', self.registration.scope))));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});
