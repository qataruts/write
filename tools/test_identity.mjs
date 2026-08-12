// حارسُ الهوية — «إخوةٌ لا توائم» (`FAMILY.md §٩`):
//   node tools/test_identity.mjs
//
// ————— العلّة —————
//
// بذرةُ المنصة تُنسخ من اقرأ، **فيولد التطبيقُ بوجه أخيه**: ورقُه ورقَه، وغالبُه
// غالبَه، وخطُّ علامته خطَّ علامته. وذلك عيبُ ولادةٍ يُصلَح بقرار — لكنّ إصلاحَه
// **لا يُمسِكه اختبارٌ عاديّ**: لونٌ مستعارٌ يعمل عملَ اللون الصحيح تماماً، والتطبيقُ
// يفتح ويعمل ويمرّ حرّاسُه كلُّهم وهو يلبس وجهَ أخيه. فالعيبُ يُرى يومَ تُصفّ
// الأيقونتان على شاشة آيبادٍ واحدة أمام طفل — لا في سَوقةِ فحص.
//
// وهذا الحارس يقلب القاعدة: **الوجهُ المستعار يحمرّ يومَ يُنسى لا يومَ يُلاحَظ**.
//
// **وأصلُه حارسُ احسب** (`calc@9ee001c:tools/test_identity.mjs`، الجلسة هـ عنده) —
// نُقل بحرّاسه وقُيّد في `SEED.md`، وعُدِّل لحالنا في ثلاثة (ولكلٍّ علّتُه في موضعه):
//   · **غالبُنا لونُ مرحلةٍ لا لونُ نجمة**: احسب حرّر نجمتَه إلى الفيروزيّ، ونحن
//     أبقينا الذهبَ لأنه **لونُ حكمٍ عندنا** (لسانُ الإرشاد يقرؤه) — فيُقاس الغالبُ
//     في موضعه الصحيح `--accent-letters`، **ويُشترَط أن يكون هو الغالبَ فعلاً**.
//   · **والذهبُ المشترَك يُحرَس بعلّته لا بالسكوت عنه**: يبقى ذهبَ العائلة ما دام
//     الإرشادُ يقرؤه، فإن انفكّ عنه سقطت العلّة واحمرّ البابُ يطلب قراراً.
//   · **وخطُّ العلامة بابٌ ينقلب**: حكمُه معروضٌ في `docs/REVIEW_IDENTITY.md` ولمّا
//     يُحكَم بعدُ، فما دام منتظَراً وجب أن يبقى النائبُ **معلَناً**، ويومَ يُكتب
//     الحكمُ وجب أن يلبسه اللوحُ وألّا يبقى لخطّ أخينا حِملٌ في شجرتنا.
//
// ————— المرجعُ مبصوم، والبصمةُ تُقابَل إن وُجد المرجع —————
//
// قيمُ اقرأ أدناه **منقولةٌ من التزامٍ مبصوم** (`read@9220ab1` — آخر التزامٍ مسّ
// لوحَه)، لا من شجرة عمله: المرجعُ الحيّ فيه جلساتٌ تعمل وشجرتُه قد لا تستقرّ،
// والبصمةُ وحدَها هي المرجع. وإن وُجد مستودعُ اقرأ بجوارنا قُرئ منه ذلك الالتزام
// وقوبلت القيمُ المكتوبة هنا بما فيه — وإن غاب **نام هذا البابُ وحدَه وأعلن نومَه**.

import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../', import.meta.url);
const css = readFileSync(new URL('app/css/app.css', ROOT), 'utf8');
const PANEL = new URL('docs/REVIEW_IDENTITY.md', ROOT);

// ————— مرجعُ اقرأ المبصوم —————
const READ = {
  commit: '9220ab1',
  file: 'app/css/app.css',
  vars: {
    '--paper': '#FAF4E8',            // ورقُه الدافئ
    '--paper-deep': '#F3EAD8',
    '--accent-letters': '#317873',   // غالبُه: أخضرُ مزرقّ
    '--brand-1': '#F7B733',          // سُلَّمُ علامته (برتقاليّ)
    '--brand-2': '#F5A524',
    '--brand-3': '#E8590C',
    '--star': '#DFAE3F',             // ذهبُ العائلة — مشترَكٌ بعلّةٍ معلنة (البابُ ٤)
    '--font-brand': "'Marhey', 'Baloo Bhaijaan 2', 'Geeza Pro', sans-serif",
  },
};

/** قيمةُ متغيّرٍ من اللوح — أوّلُ إعلانٍ له (جذرُ الوضع النهاريّ). */
function cssVar(text, name) {
  const m = text.match(new RegExp(`^\\s*${name}:\\s*([^;]+);`, 'm'));
  return m ? m[1].trim() : null;
}

/** أوّلُ عائلةٍ في تراص الخطوط — هي خطُّ العلامة، وما بعدها احتياطٌ. */
const firstFamily = (stack) => (stack || '').split(',')[0].trim().replace(/^['"]|['"]$/g, '');

/** درجةُ اللون (٠–٣٦٠) من `#rrggbb` — بها يُقاس بُعدُ غالبٍ عن غالب. */
function hue(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (!d) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/** أقصرُ قوسٍ بين درجتَي لون (٠–١٨٠) — فالأحمرُ ٥° والأحمرُ ٣٥٥° لونٌ واحد. */
function hueGap(a, b) {
  const d = Math.abs(hue(a) - hue(b)) % 360;
  return d > 180 ? 360 - d : d;
}

const MIN_GAP = 40;      // ما دون ذلك عينُ طفلٍ لا تفرّق بين الغالبَين (حدُّ احسب نفسُه)

const checks = [];
const ok = (good, msg) => checks.push([good, msg]);

// ————— ١) الورقُ يخالف ورقَ اقرأ —————
// (الورقُ والحبرُ من عائلةٍ واحدة عمداً — دفترُ أطفالٍ دافئ — لكن **القيمةَ لنا**:
//  ورقٌ مستنسخٌ حرفاً بحرف علامةُ نسخٍ نُسي لا قرارِ لوحٍ اتُّخذ. وورقُنا مشتقٌّ
//  بقياسٍ معلَن: إشباعُ ورق اقرأ × معاملٍ يبلغ خطوةَ احسب — `IDENTITY_COLOR.md §٦`.)
for (const name of ['--paper', '--paper-deep']) {
  const ours = cssVar(css, name);
  ok(ours && ours.toUpperCase() !== READ.vars[name].toUpperCase(),
    `${name}: ورقُنا ${ours} يخالف ورقَ اقرأ ${READ.vars[name]}`);
}

// ————— ٢) الغالبُ يخالف غالبَ اقرأ **بُعداً تراه العين** —————
// لا يكفي أن تختلف القيمة: الميثاق «لا يتشارك تطبيقان لوناً غالباً»، ولونٌ يفارق
// لوناً بدرجةٍ واحدة يمرّ في مقابلةِ نصوصٍ ويسقط في صفّ الأيقونات.
for (const name of ['--accent-letters', '--brand-1', '--brand-2', '--brand-3']) {
  const ours = cssVar(css, name);
  const gap = ours && /^#[0-9a-f]{6}$/i.test(ours) ? hueGap(ours, READ.vars[name]) : null;
  ok(gap !== null && gap >= MIN_GAP,
    `${name}: غالبُنا ${ours} يبعد عن ${READ.vars[name]} بـ${gap === null ? '—' : Math.round(gap)}°`
    + ` (الحدّ ${MIN_GAP}°)`);
}

// ————— ٣) والمقيسُ هو الغالبُ حقّاً —————
// بابٌ يحرس البابَ الذي قبله: لو صار الغالبُ رمزاً آخر يوماً، لقاس البابُ ٢ رمزاً
// لا يراه الطفلُ غالباً وأخضرَّ وهو يقيس غير المقصود.
const accent = cssVar(css, '--accent');
ok(accent === 'var(--accent-letters)',
  `الغالبُ المقيسُ هو الغالبُ فعلاً: \`--accent\` = ${accent}`);

// ————— ٤) الذهبُ مشترَكٌ **بعلّةٍ قائمة**، لا بالسكوت —————
// `--star` عندنا لونُ حكمٍ لا لونُ هوية: `.pen-start` و`.pen-arrow` — لسانُ الإرشاد
// كلُّه (`METHOD §٣.٤`) — يقرآنه، وألوانُ الحكم لا تُمَسّ (`IDENTITY_COLOR.md §١`).
// فيُشترَط شرطان معاً: أن يبقى ذهبَ العائلة، **وأن تبقى العلّةُ قائمة** — فإن انفكّ
// الإرشادُ عنه يوماً سقطت العلّةُ واحمرّ البابُ يطلب قراراً بدل أن يسكت.
const star = cssVar(css, '--star');
// (والقاعدةُ تُلتمس **في أوّل سطرها** لا في أوّل ذكرٍ لاسمها: اسمُ المحدِّد مكتوبٌ في
//  تعليق اللوح أعلاه يشرح أنّ الذهبَ إرشاد، فمن التمسه بلا مرساةِ سطرٍ التقط التعليقَ
//  وقرأ كتلةً ليست كتلتَه — وقد وقع ذلك أوّلَ تشغيل.)
const guides = ['.pen-start', '.pen-arrow'].filter((sel) => {
  const block = css.match(new RegExp(`^\\${sel}[^{]*\\{([^}]*)\\}`, 'm'));
  return block && /var\(--star\)/.test(block[1]);
});
ok(star && star.toUpperCase() === READ.vars['--star'].toUpperCase() && guides.length === 2,
  `الذهبُ لونُ حكمٍ لا هوية: ${star} كذهب العائلة، ويقرؤه لسانُ الإرشاد`
  + (guides.length === 2 ? ' (البداية والسهم)' : ` — انفكّ عنه: ${guides.length}/2`));

// ————— ٥) خطُّ العلامة: بابٌ ينقلب بحكم المالك —————
// «وخطُّ Marhey لعلامة اقرأ وحدَها فلا يُورَّث بالنسخ» (`FAMILY §٩.٤`). وحكمُه معروضٌ
// في صفحة الميثاق ولمّا يُحكَم — فما دام منتظَراً **يُشترَط أن يكون النائبُ معلَناً
// في الصفحة**، لا أن يمرّ صامتاً؛ ويومَ يُكتب الحكمُ ينقلب الشرطُ إلى ما بعده.
const theirs = firstFamily(READ.vars['--font-brand']);
const ourFont = firstFamily(cssVar(css, '--font-brand'));
const panel = existsSync(PANEL) ? readFileSync(PANEL, 'utf8') : '';
const said = (panel.match(/⇩ يُحفَظ عند إعادة التوليد — بابُ المالك: العلامة ⇩ -->\n([\s\S]*?)\n<!--/)
  || [, ''])[1];
const ruled = (said.match(/^\*\*الحكم\*\*:\s*(.+?)\s*$/m) || [, '(منتظَر)'])[1].trim();

if (ruled.startsWith('(')) {
  ok(ourFont === theirs && /نائبٌ\s*مؤقت/.test(panel),
    `حكمُ الخطّ منتظَر ⇐ النائبُ «${ourFont}» معلَنٌ نائباً في صفحة الميثاق`);
} else {
  ok(ourFont && ourFont !== theirs,
    `خطُّ علامتنا «${ourFont || 'لا شيء'}» يخالف خطَّ علامة اقرأ «${theirs}»`);
  ok(new RegExp(ourFont, 'i').test(ruled),
    `واللوحُ يلبس ما حُكم له: «${ruled}»`);
  // ولا يبقى منه **حِملٌ** في الشجرة: ملفٌّ يُحمَّل أو يُخزَّن في القشرة وزنٌ ميتٌ على
  // جهاز طفل. والمقيسُ **الحِملُ لا الاسم**: ذكرُ الخطّ المهجور في تعليقٍ يشرح لماذا
  // هُجر أثرٌ من آثار القرار لا بقيّةٌ منه.
  const sw = readFileSync(new URL('app/sw.js', ROOT), 'utf8');
  const loads = new RegExp(`['"(][^'")]*${theirs}-[\\w-]*\\.woff2`);
  const declares = new RegExp(`font-family:\\s*['"]${theirs}['"]`);
  const stray = [
    ['app.css', loads.test(css) || declares.test(css)],
    ['app/sw.js', loads.test(sw)],
    [`app/fonts/${theirs}-arabic.woff2`, existsSync(new URL(`app/fonts/${theirs}-arabic.woff2`, ROOT))],
  ].filter(([, hit]) => hit).map(([where]) => where);
  ok(stray.length === 0,
    `ولا حِملَ لخطّ اقرأ في شجرتنا${stray.length ? ` — بقي في: ${stray.join(' · ')}` : ''}`);
}

// ————— ٦) البصمةُ تُقابَل بمرجعها (نائمٌ يستيقظ ذاتياً) —————
const readRepo = fileURLToPath(new URL('../read/', ROOT));
const hasRepo = existsSync(readRepo);
let asleep = null;
if (!hasRepo) {
  asleep = 'مستودعُ اقرأ ليس بجوارنا — تُقابَل البصمةُ يومَ يوجد';
} else {
  const show = spawnSync('git', ['-C', readRepo, 'show', `${READ.commit}:${READ.file}`],
    { encoding: 'utf8' });
  if (show.status !== 0) {
    asleep = `الالتزام ${READ.commit} غيرُ موجودٍ في مستودع اقرأ — لا مقابلة`;
  } else {
    const drift = Object.entries(READ.vars)
      .filter(([name, value]) => cssVar(show.stdout, name) !== value)
      .map(([name]) => name);
    ok(drift.length === 0,
      `بصمةُ المرجع صادقة: قيمُ اقرأ أعلاه هي قيمُ \`read@${READ.commit}\` نفسُها`
      + (drift.length ? ` — تخلّفت: ${drift.join(' · ')}` : ''));
  }
}

for (const [good, msg] of checks) console.log((good ? '  ✓ ' : '  ✗ ') + msg);
if (asleep) console.log(`  ⏸ نائم، يستيقظ ذاتياً — ${asleep}`);

const bad = checks.filter(([good]) => !good).length;
console.log('\n' + (bad === 0
  ? `الهوية لنا لا لأخينا: ${checks.length} باباً${asleep ? ' (وبابٌ نائم)' : ''}.`
  : `${bad} إخفاق — وجهُ اقرأ ما زال علينا (ميثاق الهوية، FAMILY.md §٩).`));
process.exit(bad === 0 ? 0 : 1);
