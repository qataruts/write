// اختبار العمل دون إنترنت (PWA) — **من بذرة اقرأ**، وتعديلاتُه في `docs/SEED.md`:
//   node tools/test_pwa.mjs
// المحروس هنا خمسة:
//   ١) قائمة SHELL في app/sw.js لا تنسى ملفاً موجوداً في app/ ولا تعِد بملف غير موجود
//      — نسيانُ وحدة جافاسكربت واحدة يعني تطبيقاً معطوباً دون إنترنت، ولا يظهر إلا هناك.
//   ٢) بيان التطبيق (manifest) صالح: أيقوناته موجودة بمقاساتها، ولغته عربية.
//   ٣) الأصوات كلها مخزونة **من بيانها** لا من قائمة يدوية تتخلّف عن المنهج.
//   ٤) **ألواحُ CSS سليمةُ الأقواس** — وهو صنفٌ يشبه الأول: عطبٌ صامتٌ لا يُسقِط
//      شيئاً ولا يظهر إلا في عين طفل. علّتُه في §٥ أدناه.
//   ٥) **المقياس: القرصةُ حقٌّ والعودةُ تردّه ١** (منقولُ اقرأ الميداني على عقده
//      المصحَّح، الجلسة م٢): لا قفلَ في الميتا، وآليةُ الردّ قائمة، ولوحُ القلم يبقى
//      على إعلانه، والتعريفُ يبقى قابلاً للتكبير. في §٦.
//
// **والبابُ الثالث مُعلَّقٌ حتى يُصرَّف أوّلُ صوت**: `app/audio/` **لا تلمسه جلساتُ
// التطوير أبداً** (`docs/AUDIO_QUEUE.md`)، فلا فهرسَ اليوم. والتعليقُ **يُطالِب من
// نفسه**: شرطُه وجودُ `audio/manifest.json` على القرص — فيومَ تكتبه جلسةُ الصوتيات
// تصير هذه الفحوصُ حمراءَ حتى يُدخَل في SHELL. وكذلك `emoji/index.json`. وهو نظيرُ
// جرد `wanted` أدناه: **القرصُ يقول ما يُطالَب به، لا سطرٌ يُكتب بيد**.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';

const APP = new URL('../app/', import.meta.url);
const read = (p) => readFileSync(new URL(p, APP), 'utf8');
const has = (p) => existsSync(new URL(p, APP));

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };
const skip = (msg) => console.log('  ○', msg);

const sw = read('sw.js');
const manifest = JSON.parse(read('manifest.webmanifest'));

// ————— ١. قائمة الهيكل تطابق ما في app/ فعلاً —————

const shell = [...sw.matchAll(/^\s*'([^']+)',$/gm)].map((m) => m[1])
  .filter((p) => p !== './' && !p.includes('${'));

const onDisk = [];
const walk = (dir, prefix = '') => {
  for (const name of readdirSync(new URL(dir, APP))) {
    if (name.startsWith('.')) continue;
    const path = `${prefix}${name}`;
    if (statSync(new URL(path, APP)).isDirectory()) walk(`${path}/`, `${path}/`);
    else onDisk.push(path);
  }
};
walk('./');

// ملفات الهيكل: كل ما في app/ عدا ما يُخزَن من فهرسه (الأصواتُ وأيقوناتُ الرموز)
// وعامل الخدمة نفسه، **وعدا الصفحة التعريفية**: `welcome/` ليست من التطبيق —
// صفحةُ عرضٍ للمعلمين خارج القشرة عمداً (لا تُخزَّن ولا تَعُدّ نفسها منه).
// والصوتُ الجديد — والرمزُ الجديد — يدخلان المخزون بفهرسهما لا بسطرٍ يدويّ في sw.js.
const wanted = onDisk.filter((p) => !p.startsWith('audio/')
    || p === 'audio/manifest.json' || p === 'audio/versions.json')
  .filter((p) => !p.startsWith('emoji/') || p === 'emoji/index.json')
  .filter((p) => !p.startsWith('welcome/'))
  .filter((p) => p !== 'sw.js');

const forgotten = wanted.filter((p) => !shell.includes(p));
ok(forgotten.length === 0,
  `قائمة SHELL تشمل كل ملفات التطبيق (${wanted.length} ملفاً)${forgotten.length ? ' — نُسي: ' + forgotten.join('، ') : ''}`);

const phantom = shell.filter((p) => !existsSync(new URL(p, APP)));
ok(phantom.length === 0,
  `ولا تعِد بملف غير موجود${phantom.length ? ' — ' + phantom.join('، ') : ''}`);
ok(sw.includes("'./'") && /index\.html/.test(sw), 'وتشمل جذر التطبيق وصفحته');

const inShell = shell.filter((p) => p.startsWith('welcome/'));
ok(inShell.length === 0,
  `ولا تشمل الصفحة التعريفية (خارج القشرة عمداً)${inShell.length ? ' — دخلت: ' + inShell.join('، ') : ''}`);

// كل وحدة جافاسكربت مستوردة فعلاً من شجرة main.js (لا ملف ميت في القائمة)
const modules = onDisk.filter((p) => p.startsWith('js/'));
const reachable = new Set(['js/main.js']);
for (let changed = true; changed;) {
  changed = false;
  for (const mod of [...reachable]) {
    for (const m of read(mod).matchAll(/from '\.\/([\w.]+\.js)'/g)) {
      const path = `js/${m[1]}`;
      if (!reachable.has(path)) { reachable.add(path); changed = true; }
    }
  }
}
const dead = modules.filter((p) => !reachable.has(p));
ok(dead.length === 0, `كل وحدات js مستوردة من شجرة main.js${dead.length ? ' — ميتة: ' + dead.join('، ') : ''}`);

// ————— ٢. الاستراتيجيتان: الأصوات من المخزون، والهيكل يُحدَّث في الخلفية —————

ok(/AUDIO_RE\s*=\s*\/.*audio.*mp3/.test(sw), 'الأصوات لها مسار خزنٍ خاص (اسمها sha1 نصِّها)');
// اسمُ الملف من نصّه لا من محتواه، فالخزن بالرابط وحده يُبقي جهازاً على صوتٍ
// قديم بعد أي استبدال — التفصيل والسيناريو الكامل في tools/test_audio_cache.mjs
ok(/\?v=\$\{tags\[\w+\]\}/.test(sw) && sw.includes('dropOtherTags'),
  'والخزن بالرابط الموسوم مع كنس الوسم الأقدم لذلك الملف وحده');
ok(sw.includes('cacheFirst') && sw.includes('staleWhileRevalidate'),
  'واستراتيجيتان: المخزون أولاً للصوت، والتحديث في الخلفية للهيكل');
ok(sw.includes('precacheAudio') && sw.includes('audio/manifest.json'),
  'وخزن الأصوات مشتقّ من الفهرس لا من قائمة يدوية');
ok(sw.includes('precacheEmoji') && sw.includes('emoji/index.json'),
  'وأيقونات الرموز مخزونة من فهرسها لا من قائمة يدوية');

// **التعليقُ يُطالِب من نفسه**: ما دام الفهرسُ غائباً عن القرص فالسطرُ في SHELL
// كذبةٌ لا صدق؛ ويومَ يظهر يصير غيابُه من SHELL فشلاً أحمر.
for (const [file, what] of [
  ['audio/manifest.json', 'فهرسُ الأصوات المولَّدة'],
  ['audio/versions.json', 'بيانُ بصمات الصوت'],
  ['emoji/index.json', 'فهرسُ أيقونات الرموز'],
]) {
  if (has(file)) ok(shell.includes(file), `و\`${file}\` (${what}) في قائمة الهيكل`);
  else skip(`${what} (\`${file}\`) لم يُنشأ بعدُ — يُطالَب به يومَ يظهر على القرص`);
}

ok(/request\.method !== 'GET'/.test(sw), 'ولا يعترض إلا طلبات GET');
ok(sw.includes('self.location.origin'), 'ولا يمسّ أي مصدر خارجي');
ok(/caches\.delete/.test(sw) && /SHELL_CACHE = `uktub-shell-\$\{VERSION\}`/.test(sw),
  'ورفع النسخة يمحو مخزون **القشرة** القديم (لا يعلَق طفل على نسخة قديمة)');

// ————— خفّة التخزين: مخزنُ الصوت يعبر النسخ، والجلبُ مدفَّعٌ معدودُ الإخفاق —————
//
// العيب المُغلَق هنا (وُرِث مُصلَحاً من اقرأ): مخزنُ الصوت كان موسوماً بالنسخة، فكلُّ
// تحديثٍ يولّد مخزناً فارغاً ويمحو السابق ⇒ إعادةُ تنزيل الصوت كلِّه على جهاز الطفل.

const audioCacheName = (sw.match(/const AUDIO_CACHE = ([^;]+);/) || [])[1] || '';
ok(!audioCacheName.includes('VERSION') && /^'[^'$]+'$/.test(audioCacheName.trim()),
  `اسمُ مخزن الصوت ثابتٌ لا يحمل النسخة (${audioCacheName.trim() || 'غائب'})`
  + ' — فلا يعيد التحديثُ تنزيلَ بنك الصوت كلِّه');

const precache = sw.slice(sw.indexOf('async function precacheAudio')).split('\n}\n')[0];
const batch = Number((sw.match(/const AUDIO_BATCH = (\d+);/) || [])[1]);
ok(batch >= 12 && batch <= 16 && /for \(.*AUDIO_BATCH\)/.test(precache) && /\.slice\(/.test(precache),
  `والتخزين المسبق مُدفَّعٌ متتابع (${batch || 'بلا حدّ'} في الدفعة، لا قطيعٌ دفعةً واحدة)`);
ok(/\.keys\(\)/.test(precache) && /filter\(\(url\) => !have\.has\(url\)\)/.test(precache),
  'ولا يُطلَب من الشبكة إلا الناقص (`cache.add` يجلب دائماً وإن كان مخزوناً)');
ok(!/catch\(\(\) => \{\}\)/.test(precache) && /failed \+=/.test(precache)
  && /if \(failed\) return\b/.test(precache),
  'والإخفاقاتُ معدودةٌ لا مبتلعة، وإن وقع إخفاقٌ فلا كنسَ (صيانةً للقديم الصالح)');

const activate = sw.slice(sw.indexOf("addEventListener('activate'"));
ok(/async function audioComplete/.test(sw) && /await audioComplete\(\)/.test(activate),
  'ولا يُمحى مخزونُ صوتٍ قديم إلا بعد جردٍ يثبت تمامَ الجديد');
ok(/await syncAudio\(\)/.test(activate)
  && activate.indexOf('syncAudio()') < activate.indexOf('audioComplete()'),
  'والتبنّي والاستكمالُ قبل الحكم بالتمام (وإلا حُكم بالنقص على مخزنٍ لم يُملأ بعد)');
ok(/type: 'audio-progress'/.test(sw) && /clients\.matchAll/.test(sw),
  'والعاملُ يبلّغ النوافذَ بتقدّم خزن الصوت (لا يخزّن صامتاً)');
ok(/addEventListener\('message'/.test(sw) && /'audio-sync'/.test(sw),
  'ويقبل طلبَ «نزّل الأصوات الآن» صريحاً بلا انتظار مهلة');
const panelSrc = read('js/parent.js');
ok(/audio-progress/.test(panelSrc) && /audio-sync/.test(panelSrc) && /dl-bar/.test(panelSrc),
  'ولوحةُ وليّ الأمر تعرض شريطاً حيّاً وزرَّ تحميلٍ يدويّ');
ok(/event\.waitUntil\(healAudio\(\)\)/.test(sw) && /HEAL_AFTER/.test(sw)
  && /if \(healed \|\| syncing\) return;/.test(sw)
  && /if \(await audioComplete\(\)\) return;/.test(sw),
  'وللناقص شفاءٌ — مرّةً في عمر العامل، بعد مهلةٍ تمضي للطفل، ولا يعمل على مخزونٍ تامّ');
ok(read('js/progress.js').includes('export async function audioStored')
  && panelSrc.includes('progress.audioStored()') && panelSrc.includes('الأصوات المخزونة'),
  'وعددُ المخزون معروضٌ في لوحة وليّ الأمر (فلا يفاجئه صمتٌ لا يعرف سببه)');

// ————— ٣. بيان التطبيق —————

ok(manifest.name && manifest.short_name, `اسم التطبيق: ${manifest.short_name}`);
ok(manifest.lang === 'ar' && manifest.dir === 'rtl', 'لغته عربية واتجاهه من اليمين');
ok(manifest.display === 'standalone', 'ويُفتح كتطبيق مستقلّ (لا شريط متصفّح يشتّت الطفل)');
ok(manifest.start_url === './' && manifest.scope === './',
  'ومساره نسبيّ (يعمل من أي مجلد على أي خادم)');
ok(manifest.icons.length >= 3, `وله ${manifest.icons.length} أيقونات`);
ok(manifest.icons.some((i) => i.purpose === 'maskable'),
  'منها مقنَّعة (maskable) لأيقونة أندرويد المستديرة');

const png = (path) => {
  const data = readFileSync(new URL(path, APP));
  if (data.length < 24 || data.readUInt32BE(0) !== 0x89504e47) return null;
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
};
for (const icon of manifest.icons) {
  const [w] = png(icon.src) || [];
  ok(String(w) === icon.sizes.split('x')[0], `${icon.src}: ملف PNG بمقاس ${icon.sizes}`);
}
ok(!!png('icons/apple-touch-icon.png'), 'وأيقونة آيفون/آيباد موجودة');

// ————— ٤. الوصل في الصفحة والتسجيل في الشيفرة —————

const html = read('index.html');
ok(/rel="manifest"/.test(html), 'الصفحة توصل البيان (rel="manifest")');
ok(/apple-touch-icon/.test(html), 'وأيقونة آبل موصولة');
ok(/theme-color/.test(html) && html.includes(manifest.theme_color),
  `ولون الواجهة موحَّد بين الصفحة والبيان (${manifest.theme_color})`);

const main = read('js/main.js');
ok(main.includes('serviceWorker') && main.includes('sw.js'), 'وmain.js يسجّل عامل الخدمة');
ok(main.includes("location.protocol.startsWith('http')"),
  'ولا يحاول التسجيل من file:// (يرفضه المتصفّح فيلوّث السجلّ)');
ok(/\.catch\(/.test(main.slice(main.indexOf('registerServiceWorker'))),
  'ورفضُ التسجيل لا يُسقِط التطبيق');

// ————— ٥. ألواحُ CSS: كلُّ قوسٍ يُغلَق، ولا قوسَ خاتمٍ يتيم —————
//
// **العيبُ الذي وُلد منه** (كُشف في الجلسة ٣): قاعدةُ `.dot--done` في `app.css` فقدت
// قوسَها الخاتم يومَ نُسخ لوحُ البذرة وشُذِّب، **فابتلعت ما بعدها ثلاثمئة سطر** —
// فماتت `.ui-icon` ووجوهُ العقد ووسائطُ الشاشات الصغيرة والوضعِ العرضيّ. ولا شيءَ
// يُسقِطه: المتصفّحُ **يبتلع خطأ CSS صامتاً** ولا يرفع استثناءً، فلا يمسكه فحصُ
// متصفّحٍ ولا خطأُ جافاسكربت — ولم يظهر حتى قُرئت لقطةٌ بالعين بعد ثلاث جلسات.
//
// **ولا العدُّ يكفي ولا الاقتران — وهذا لبُّ الحارس**: التشذيبُ نفسُه ترك **قوساً
// خاتماً يتيماً** بعد ذلك بثلاثمئة سطر، فتوازنَ الملفُّ عدداً **واقترن قوساً بقوس**:
// القاعدةُ المفتوحة يُغلقها اليتيمُ في آخر المطاف، فلا عدٌّ يشكو ولا مكدَّسٌ يشكو.
// **وجرّبتُه سالباً فمرّ** — فلزم مقياسٌ من CSS نفسِها لا من الأقواس:
//
//   **القاعدةُ لا تلد قاعدة.** في CSS (بلا تعشيشٍ أصليّ، وليس في ألواحنا منه شيء)
//   لا يفتح قوساً داخلَ قوسٍ إلا **قاعدةُ `@`** (`@media` و`@supports` و`@keyframes`).
//   فقاعدةُ محدِّدٍ يقع في جوفها `{` تعني أنّ قاعدةً قبلها لم تُغلَق فابتلعت ما بعدها —
//   وهو عينُ العطب، يُمسَك بموضع القاعدة الآكِلة لا بحصيلةِ عدٍّ في آخر الملف.
//
// (فإن اعتُمد تعشيشُ CSS الأصليّ يوماً، فهذا موضعُ تعديله — ويُعلَن حينها.)
//
// **والألواحُ تُجرَد من القرص** — من جرد `onDisk` نفسِه أعلاه لا من جردٍ ثانٍ ولا
// من قائمةٍ مكتوبة (نظيرُ جرد حملة مسار الطفل في الجلسة ٢): لوحٌ ثالثٌ يُضاف غداً
// يدخل الحراسة يومَ يُكتب، بلا سطرٍ يُضاف هنا. **ويشمل `welcome/`** وإن لم تكن من
// القشرة — فالعطبُ عطبٌ حيثما وقع، وهي أوّلُ ما يراه معلّم.

console.log('');
const sheets = onDisk.filter((p) => p.endsWith('.css'));
ok(sheets.length > 0, `ألواحُ CSS مجرودةٌ من القرص: ${sheets.join('، ')}`);

for (const sheet of sheets) {
  // تُطرح التعليقاتُ والنصوصُ المقتبسة أولاً (قوسٌ في `content: "}"` ليس بنيةً)،
  // ويُحفَظ رقمُ السطر بإبقاء أسطرها.
  const blanked = read(sheet)
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, (m) => m.replace(/[^\n]/g, ' '));

  let line = 1;
  let prelude = '';     // ما بين آخر قوسٍ والقوسِ الفاتح: المحدِّد أو قاعدةُ `@`
  const open = [];      // الأقواسُ الفاتحة المنتظِرة: {line, at}
  const orphan = [];    // أسطرُ الأقواس الخاتمة اليتيمة
  const nested = [];    // قاعدةُ محدِّدٍ ولدت قاعدة — أيْ قاعدةٌ قبلها لم تُغلَق
  for (const ch of blanked) {
    if (ch === '\n') line++;
    if (ch === '{') {
      const at = prelude.trim().startsWith('@');
      const parent = open[open.length - 1];
      // **والخطأُ الأوّل هو الخطأ** (نظيرُ `verdict.primary` في `pen.js`): القاعدةُ
      // الآكِلة تبتلع كلَّ ما بعدها، فتتوالى الشكاوى صدىً. فيُقيَّد موضعُ أوّلها ويُعَدّ الباقي.
      if (parent && !parent.at) nested.push([parent.line, line]);
      open.push({ line, at });
      prelude = '';
    } else if (ch === '}') {
      if (!open.length) orphan.push(line);
      else open.pop();
      prelude = '';
    } else {
      prelude += ch;
    }
  }
  ok(!orphan.length && !open.length && !nested.length,
    `${sheet}: كلُّ قاعدةٍ تُغلَق ولا قاعدةَ تلد قاعدة (${line} سطراً)`
    + (nested.length ? ` — **القاعدةُ عند السطر ${nested[0][0]} لم تُغلَق فابتلعت ما بعدها**`
      + ` (أوّلُ المبتلَع عند ${nested[0][1]}، والمبتلَعُ ${nested.length} قاعدة)` : '')
    + (orphan.length ? ` — **قوسٌ خاتمٌ يتيم عند السطر ${orphan.join('، ')}**` : '')
    + (open.length ? ` — **قاعدةٌ لم تُغلَق، فُتحت عند السطر ${open.map((b) => b.line).join('، ')}**` : ''));
}

// ————— ٦. المقياس: قرصةُ الطفل حرة، والعودةُ من الخلفية بمقياس ١ (`read@7f18bf0`) —————
//
// **وهذا الحارسُ نفسُه كان يحرس القفلَ فقُلب — بلاغُ الميدان فوق الحارس.** حرسَ في
// الجلسة ٤ب قفلَ المقياس الشامل، منقولاً عن اقرأ بعلّته: iPadOS يسترجع المثبَّتَ من
// الخلفية **مكبَّراً** أحياناً (عيبُ منصّة)، والنقرُ المزدوج يكبّر الشاشة. **ثم نقض
// الميدانُ العلاجَ لا العلّة**: الطفل كان يكبّر الصفحةَ بالقرصة ليرى التشكيل — «أمرٌ
// مريح وتلقائي» — والقفلُ حرمه إياه، وافتراضُ «حروفُه كبيرةٌ فلا حاجة للتكبير» أسقطه
// الميدان. تحويطٌ أوسعُ من عيبه، فرُدّ إلى موضع العيب وحدَه. **وحارسٌ يحرس تحويطاً
// نقضه الميدانُ يصير حارسَ العطب**: يمرّ أخضرَ على شيفرةٍ تحرم الطفلَ حقَّه، ويحمرّ
// يومَ يُردّ إليه — فقُلب إلى ضدّه بدل أن يُحوَّط بعذر.
//
// **والمحروسُ اليوم شقّان لا يقوم أحدهما مقام الآخر**: **الحريةُ** — لا قفلَ في ميتا
// التطبيق ألبتّة (فالقرصةُ حقٌّ يُحرَس أن يبقى)؛ و**الشدّةُ** — آليةُ الردّ قائمة:
// العودةُ للواجهة تشدّ المقياسَ إلى ١ لحظةً ثم تردّ نصَّ الميتا الحرَّ (`resetZoom` في
// `main.js`) فتزول بقايا الاسترجاع المعيب وبقايا تكبيرِ ما قبل الخلفية معاً. ولو حُرست
// الحريةُ وحدَها لعاد العيبُ الأصليّ صامتاً.
//
// و`touch-action: manipulation` باقٍ ويُحرَس: يُسقط تكبيرَ النقر المزدوج **العارض
// وحدَه** ومهلةَ انتظاره، والقرصةُ المتعمَّدة لا يمسّها.
//
// **ولوحُ القلم محروسٌ من جهته لا بالقفل العام** — وهو ما جعل نزعَ القفل سليماً عندنا
// وإن كنّا ألزمَ من اقرأ بالمقياس: `touch-action: none` على `.pen-surface` أخصُّ فيغلب،
// وسلوكُ اللمس تقاطعُ قيم العنصر وأسلافه (`none ∩ manipulation = none`) — فالإصبعُ فوق
// اللوح يكتب ولا يمرّر ولا يقرص. والدورةُ الكاملة بعد التصحيح مُثبَتةٌ في متصفّحٍ
// حقيقيّ (`browser_test.py --suite pen`). **وعينُ الميدان مفتوحة**: إن شهد ميدانُنا
// قرصةَ إصبعين عارضةً أثناء رسم حرفٍ قُيّدت بلاغاً — ولا قفلَ استباقاً.
//
// **وصفحاتُ التعريف كانت خارج القفل وتبقى قابلةً للتكبير**: صفحاتُ كبارٍ والتكبيرُ
// فيها حقٌّ لا عيب — **وتُجرَد من القرص** كالألواح أعلاه، فصفحةٌ خامسة تُكتب غداً تدخل
// الحراسة يومَ تُكتب.

console.log('');
const viewport = (html.match(/<meta name="viewport" content="([^"]+)"/) || [])[1] || '';
ok(!/maximum-scale|user-scalable/.test(viewport),
  'ميتا التطبيق لا تقفل المقياس — قرصةُ الطفل لرؤية التشكيل حقٌّ (بلاغُ الميدان الثاني)');

const css = read('css/app.css');
ok(/html\s*\{[^}]*touch-action:\s*manipulation/.test(css),
  'ولا تكبيرَ بالنقر المزدوج العارض (touch-action على html) — والنقرةُ بلا مهلة انتظاره، والقرصةُ لا تُمَسّ');
ok(/\.pen-surface\s*\{[^}]*touch-action:\s*none/.test(css),
  'ولوحُ القلم يبقى `touch-action: none` — أخصُّ فيغلب، فالإصبعُ يكتب ولا يمرّر');

ok(main.includes('meta[name="viewport"]') && main.includes('pageshow')
  && /visibilitychange[\s\S]{0,400}resetZoom/.test(main)
  && /resetZoom[\s\S]{0,400}maximum-scale=1/.test(main)
  && /setTimeout\(\(\) => viewportMeta\.setAttribute\('content', viewportFree\)/.test(main),
  'والعودةُ من الخلفية تشدّ المقياسَ إلى ١ لحظةً ثم تردّ الحرية — علاجُ الاسترجاع في موضعه وحدَه');

const welcomePages = onDisk.filter((p) => p.startsWith('welcome/') && p.endsWith('.html'));
ok(welcomePages.length > 0, `صفحاتُ التعريف مجرودةٌ من القرص (${welcomePages.length} صفحات)`);
for (const page of welcomePages) {
  ok(!/user-scalable=no|maximum-scale/.test(read(page)),
    `${page}: تبقى قابلةً للتكبير — صفحةُ كبارٍ والتكبيرُ فيها حقّ`);
}

console.log(fails ? `\n${fails} فشل` : '\nكل اختبارات العمل دون إنترنت ناجحة');
process.exit(fails ? 1 : 0);
