// **حارسُ ساحة الحصاد** (جلسة ص٣) — حارسٌ لكلِّ قيدٍ من قيودها العشرة، بلا متصفّح:
//   node tools/test_arena.mjs
//
// **وكلُّ بابٍ هنا مجرَّبٌ سالباً**: حارسٌ لا يُجرَّب على ما يُفترض أن يمسكه ليس
// حارساً (سنّةُ `test_pen.mjs §١`). فما ادّعى بابٌ منعاً أُعيد المنعُ منقوضاً وسقط.
//
// **وأخصُّ ما هنا القيد ٢ — التسميةُ العمياء**: يحكم الإنسانُ أوّلاً ثم يُكشَف حكمُ
// المحرّك، **ولا سبيلَ إلى حكم المحرّك قبله لا في الشاشة ولا في ذاكرة الصفحة**.
// وحراستُه في ثلاثة أبواب: الدالّةُ تُردّ فارغةً قبل حكم الإنسان **ويبقى الحقلُ
// فارغاً**، ونداءُ `judgeFree` واحدٌ في الملفّ كلِّه وموضعُه في `reveal`، وترتيبُ
// الزرّين مجمَّدٌ لا يُقلَب. **والدَّوْرُ الرابع في المتصفّح** (`--suite arena`):
// لا نصَّ حكمٍ في الشجرة قبل أن يُسأل الإنسان.

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const ROOT = new URL('../', import.meta.url);
const APP = new URL('app/', ROOT);
const read = (p) => readFileSync(new URL(p, ROOT), 'utf8');

const arena = await import(new URL('app/arena/arena.js', ROOT));
const pen = await import(new URL('app/js/pen.js', ROOT));
const { PATHS } = await import(new URL('app/js/paths.js', ROOT));
const { toCases } = await import(new URL('./import_traces.mjs', import.meta.url));

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

/* ————— مخزنٌ وهميّ: الدفترُ يعيش في الذاكرة كما يعيش في الجهاز ————— */
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

/** يدٌ نظيفةٌ تمشي مسارَ الشكل خطوةً خطوة — أثرٌ حقيقيّ الشكل بلا رجفة. */
function handOn(ref, step = 24) {
  const parts = pen.partsOf(ref);
  const strokes = [];
  for (const part of parts) {
    if (part.kind === 'stroke') {
      const out = [];
      for (let at = 0; at < part.poly.len; at += step) out.push(pen.pointAt(part.poly, at).at);
      out.push(part.poly.pts[part.poly.pts.length - 1]);
      strokes.push(out.map((p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]));
    } else {
      for (let i = 0; i < (part.count || 1); i++) strokes.push([[part.at[0], part.at[1]]]);
    }
  }
  return strokes;
}

/** محاولةٌ كاملة: خطّةٌ ← أثرٌ ← حكمُ إنسانٍ ← كشف. */
function walk(ch, form, human = 'right', index = 0) {
  const ref = arena.refOf(ch, form);
  const attempt = arena.makeAttempt({ ch, form, index, split: arena.splitAt(index), watch: null });
  attempt.strokes = handOn(ref);
  arena.answer(attempt, human);
  arena.reveal(attempt, ref);
  return { attempt, ref };
}

/* ═════ ١) خارج تطبيق الطفل — صفحةٌ مستقلّة لا تدخل رحلتَه ═════ */

console.log('\n— ١) خارج تطبيق الطفل: صفحةٌ مستقلّة، ولا تدخل رحلةَ الطفل —');
{
  const js = readdirSync(new URL('js/', APP)).filter((f) => f.endsWith('.js'));
  const reaching = js.filter((f) => /arena/.test(read(`app/js/${f}`)));
  ok(reaching.length === 0,
    `لا وحدةَ في تطبيق الطفل تعرف الساحةَ أصلاً${reaching.length ? ` — وجدنا: ${reaching.join('، ')}` : ''}`);

  const sw = read('app/sw.js');
  ok(!/arena/.test(sw), 'ولا تدخل قشرةَ العمل دون إنترنت (`sw.js`) — فليست من التطبيق');
  ok(!/arena/.test(read('app/index.html')), 'ولا رابطَ لها في صفحة التطبيق نفسِها');

  // **ولا تجرّ الساحةُ رحلةَ الطفل خلفها**: مستورداتُها ثلاثةٌ بأعيانها
  const imports = [...read('app/arena/arena.js').matchAll(/from '([^']+)'/g)].map((m) => m[1]);
  const allowed = ['../js/paths.js', '../js/pen.js', './send.js'];
  const extra = imports.filter((one) => !allowed.includes(one));
  ok(extra.length === 0,
    `ومستوردَاتُها ثلاثةٌ بأعيانها (${imports.join('، ')})${extra.length ? ` — دخل: ${extra.join('، ')}` : ''}`);
  // **مجرَّبٌ سالباً**: مستوردٌ من الرحلة يسقط على الكاشف نفسِه
  const planted = [...`import { go } from '../js/main.js';`.matchAll(/from '([^']+)'/g)]
    .map((m) => m[1]).filter((one) => !allowed.includes(one));
  ok(planted.length === 1, `والكاشفُ مجرَّبٌ سالباً: مستوردٌ من الرحلة يسقط عليه (${planted[0]})`);
}

/* ═════ ٢) 🔴 التسميةُ العمياء — أخصُّ حارسٍ في الساحة ═════ */

console.log('\n— ٢) التسميةُ العمياء: يحكم الإنسانُ أوّلاً، ولا سبيلَ إلى حكم المحرّك قبله —');
{
  const ref = arena.refOf('ب', 'initial');
  const attempt = arena.makeAttempt({ ch: 'ب', form: 'initial', index: 0, split: 'calibrate' });
  attempt.strokes = handOn(ref);

  // **مجرَّبٌ سالباً**: يُنادى الكشفُ قبل حكم الإنسان
  const early = arena.reveal(attempt, ref);
  ok(early === null && attempt.engine === null,
    '**مجرَّبٌ سالباً**: الكشفُ قبل حكم الإنسان يُردّ فارغاً — **ويبقى حقلُ المحرّك فارغاً**'
    + ' (لا يوجد الحكمُ في الذاكرة فيُخفى، بل لا يُحسَب أصلاً)');
  ok(JSON.stringify(attempt).indexOf('accepted') === -1,
    'ولا كلمةَ «accepted» في المحاولة قبل حكم الإنسان — فلا يقرؤها قارئٌ من الذاكرة');

  arena.answer(attempt, 'right');
  const after = arena.reveal(attempt, ref);
  ok(after && typeof after.accepted === 'boolean' && attempt.engine === after,
    `وبعد حكم الإنسان يُكشَف حكمُ المحرّك (${after?.accepted ? 'قبِل' : `ردّ بـ«${after?.primary}»`})`);

  arena.answer(attempt, 'wrong');
  ok(attempt.human === 'right', 'وحكمُ الإنسان لا يُبدَّل بعد وقوعه — فلا يُنقَض بعد رؤية الحكم');

  // **ترتيبُ الزرّين ثابتٌ لا يُقلَب**
  ok(arena.ASK.length === 2 && arena.ASK[0].human === 'right' && arena.ASK[1].human === 'wrong',
    `وترتيبُ الزرّين ثابت: «${arena.ASK[0].label}» ثم «${arena.ASK[1].label}»`);
  ok(Object.isFrozen(arena.ASK) && Object.isFrozen(arena.ASK[0]),
    'وهو مجمَّدٌ (`Object.freeze`) — فلا تقلبه شاشةٌ ولا تجربةٌ لاحقة');
  try { arena.ASK.reverse(); } catch { /* في الوضع الصارم يرمي، وفي غيره يُهمَل */ }
  ok(arena.ASK[0].human === 'right', '**ومجرَّبٌ سالباً**: محاولةُ قلبِه لا تُغيّر شيئاً');

  // **ونداءُ الحَكَم واحدٌ في الملفّ كلِّه، وموضعُه في `reveal`**
  const src = read('app/arena/arena.js');
  // 🔴 **وحَكَمُها منذ ن٢ `judgeShape` الكلّيّ** لا الماشي: الساحةُ تقيس ما يقع
  // للطفل، فلو كشفت حكمَ ماشٍ لَعايَرت محرّكاً غيرَ المحرّك (`ENGINE_RESCUE §٣`).
  const calls = [...src.matchAll(/judgeShape\s*\(/g)].length;
  const inReveal = /export function reveal[\s\S]*?judgeShape\s*\(/.test(src);
  ok(calls === 1 && inReveal,
    `ونداءُ \`judgeShape\` واحدٌ في الملفّ كلِّه (${calls}) وموضعُه في \`reveal\` بعد حكم الإنسان`);
  const plantedSrc = 'const peek = judgeShape(ref, ink);\nexport function reveal() { judgeShape(a, b); }';
  ok([...plantedSrc.matchAll(/judgeShape\s*\(/g)].length === 2,
    '**والعدّادُ مجرَّبٌ سالباً**: نصٌّ فيه نداءٌ ثانٍ للحَكَم يسقط عليه');
}

/* ═════ ٣) العيّنةُ مرسومة — الأشكالُ الأربعة والنقطُ والمصائدُ والأسرُ والموسومة ═════ */

console.log('\n— ٣) العيّنةُ مرسومة: أربعةُ أشكالٍ ونقطٌ ومصائدُ وأسرٌ وأربعةٌ موسومة —');
{
  const gaps = arena.sampleGaps();
  ok(gaps.length === 0, `العيّنةُ تفي بالقيد ٣ (${arena.SAMPLE.length} شكلاً)${gaps.length ? ` — ينقصها: ${gaps.join('، ')}` : ''}`);
  const short = arena.sampleGaps(arena.SAMPLE.slice(0, 4));
  ok(short.length > 0, `**ومجرَّبٌ سالباً**: عيّنةٌ منقوصة تسقط بـ${short.length} نقصاً (${short[0]})`);

  const missing = arena.SAMPLE.filter((s) => !arena.refOf(s.ch, s.form));
  ok(missing.length === 0,
    `ولكلِّ شكلٍ في العيّنة مسارٌ مرجعيّ${missing.length ? ` — بلا مسار: ${missing.map((s) => s.ch + '/' + s.form).join('، ')}` : ''}`);

  const watched = arena.WATCHED.map((s) => `${s.ch}/${s.form}`);
  ok(watched.length === 4 && watched.join('، ') === 'س/initial، ش/initial، ي/medial، ع/medial',
    `والأربعةُ الموسومة بلا عهد \`child-drift\` بأعيانها: ${watched.join('، ')}`);
  ok(arena.WATCHED.every((s) => s.watch === arena.WATCH_TAG),
    `وكلُّها موسومةٌ في الملفّ بـ«${arena.WATCH_TAG}» فيُقرأ معدّلُ ردّها منفصلاً`);

  // **وضربةُ النقطة تُحفَظ**: شكلٌ بثلاث نقاطٍ يُنتظَر منه ستُّ لمسات (جسمٌ + ٣)
  const dotted = arena.SAMPLE.filter((s) => (arena.refOf(s.ch, s.form).dots || []).length);
  const taps = arena.touchesFor(arena.refOf('ش', 'initial'));
  ok(dotted.length >= 8 && taps === 4,
    `و${dotted.length} شكلاً منقوطاً، ولمساتُ «ش ابتدائي» أربع (جسمٌ وثلاثُ نقرات) — فضربةُ النقطة مطلوبةٌ ملتقَطة`);
}

/* ═════ ٤) ما يُسجَّل: الحكمان و`metrics` والحدُّ **العامل** وسائرُ الحقول ═════ */

console.log('\n— ٤) ما يُسجَّل: حكمُ الإنسان وحكمُ المحرّك و`metrics` والحدُّ العامل —');
{
  const { attempt, ref } = walk('ن', 'isolated', 'right');
  const who = { kind: 'child', age: '٦–٧', tool: 'finger', hand: 'left', consent: true, session: 3 };
  const item = arena.itemOf(attempt, who, { w: 820, h: 1180, dpr: 2, touch: true });

  const want = ['ch', 'form', 'mode', 'kind', 'accepted', 'metrics', 'lateral', 'limit', 'ease',
    'human', 'eye', 'agree', 'split', 'watch', 'session', 'who', 'age', 'tool', 'hand', 'device', 'strokes'];
  const gone = want.filter((k) => !(k in item));
  ok(gone.length === 0, `سطرُ الملفّ يحمل الحقولَ كلَّها${gone.length ? ` — ناقصٌ: ${gone.join('، ')}` : ''}`);

  // 🔴 **الحدُّ العامل يُطلَب من الدالّة التي تحكم به لا من ثابت** (عهدُ `CLAUDE.md`)
  const work = pen.easeTolerance(pen.resolveTolerance(ref.tolerance)).lateral;
  const base = pen.resolveTolerance(ref.tolerance).lateral;
  ok(Math.abs(item.limit - Math.round(work * 10) / 10) < 0.05 && item.limit !== item.lateral,
    `والمسجَّلُ **الحدُّ العامل** ${item.limit} لا الأساس ${item.lateral}`
    + ` (أساسُ الشبكة ${pen.TOLERANCE.lateral} × مقياس المادّة ${ref.tolerance} × كرم ${pen.FREE.ease})`);
  ok(Math.abs(base - item.lateral) < 0.05 && Math.abs(work / base - pen.FREE.ease) < 1e-9,
    `**ومجرَّبٌ سالباً**: لو سُجّل الأساسُ وحدَه لَقرأ القارئُ ${Math.round(base)} حيث حُكم بـ${Math.round(work)}`
    + ' — وهو عطبُ السجلّ الذي كشفه `FIELD_TRIAL §٦`');
  // **ومقاييسُ الحَكَم الكلّيّ بأسمائه هو** — ولا يُكتب «انحرافٌ» وقد حُكم بغيره.
  ok(item.metrics && ['coverage', 'recall', 'part', 'precision']
    .every((k) => typeof item.metrics[k] === 'number'),
    `و\`metrics\` بأعيانها (تغطية ${item.metrics.coverage}٪ · جزء ${item.metrics.part}٪`
    + ` · دقّة ${item.metrics.precision}٪)`);
  ok(item.maxLateral === null,
    'ولا يُكتب «أقصى انحراف» وقد حُكم بغير الانحراف — المسجَّلُ هو ما حُكم به');
  ok(item.who === 'child' && item.age === '٦–٧' && item.tool === 'finger' && item.hand === 'left',
    'والفئةُ ونطاقُ العمر والأداةُ **واليد** (يسرى) — فعهدُ «الأعسر يُختبر لا يُفترض» يصير رقماً');
  ok(item.device.w === 820 && !('ua' in item.device) && !('platform' in item.device),
    `والجهازُ مقاسٌ ونقطةٌ ولمس (${item.device.w}×${item.device.h}) — بلا بصمة متصفّحٍ ولا نظام`);

  const text = JSON.stringify(item);
  const leaks = ['"name"', 'uktub.progress', 'stars', 'reads', 'userAgent', '@']
    .filter((needle) => text.includes(needle));
  ok(leaks.length === 0, `وبلا اسمٍ ولا معرِّف${leaks.length ? ` — تسرّب: ${leaks.join('، ')}` : ''}`);
}

/* ═════ ٥) الخصوصيةُ بلا نقض: لا خادمَ ولا رفعَ صامتاً، والإذنُ شرطٌ للطفل ═════ */

console.log('\n— ٥) الخصوصية: لا عنوانَ في حاملي الأثر، والإذنُ شرطٌ بنيويّ للطفل —');
{
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const codeOf = (src) => src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|\s)\/\/[^\n]*/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replaceAll(SVG_NS, 'svg-namespace');
  const NET = ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'EventSource',
    'FormData', 'navigator.connection', 'http://', 'https://', '.upload', 'importScripts'];
  const netTokens = (code) => NET.filter((t) => code.includes(t));

  // **حاملو الأثر**: كلُّ ما في `app/arena/` عدا بابِ الإرسال — وهو وحدَه يحمل عنواناً
  const files = readdirSync(new URL('arena/', APP)).filter((f) => f !== 'send.js');
  for (const file of files) {
    const found = netTokens(codeOf(read(`app/arena/${file}`)));
    ok(found.length === 0,
      `arena/${file}: لا يعرف الشبكة — أثرُ يدِ المشارك لا يجد فيه طريقاً خارج الجهاز`
      + `${found.length ? ` — وُجد: ${found.join('، ')}` : ''}`);
  }
  ok(netTokens(codeOf('const up = () => fetch("https://x/y", { method: "POST" });')).length >= 2,
    '**والكاشفُ مجرَّبٌ سالباً**: نصٌّ مزروعٌ فيه رفعُ أثرٍ يسقط عليه');

  // **وبابُ الإرسال: رابطان يُفتحان بيدٍ، ولا جلبَ ولا وسيط**
  const send = codeOf(read('app/arena/send.js'));
  const netInSend = netTokens(send).filter((t) => t !== 'https://');
  ok(netInSend.length === 0,
    `و\`send.js\` لا يجلب شيئاً — رابطا \`<a>\` يفتحهما الإنسان${netInSend.length ? ` — وُجد: ${netInSend.join('، ')}` : ''}`);
  const hosts = [...send.matchAll(/https:\/\/([^/`'"]+)/g)].map((m) => m[1]);
  ok(hosts.length === 1 && hosts[0] === 'wa.me',
    `وعنوانُه واحدٌ معلَن (${hosts.join('، ') || 'لا شيء'}) — هو وبريدُ العائلة، لا خادمَ لنا`);
  const { sendRow } = await import(new URL('app/arena/send.js', ROOT));
  ok(sendRow.length === 0,
    'و**لا يأخذ بابُ الإرسال وسيطاً واحداً** — فما لا يُعطى لا يُرسَل: المرفَقُ بيد المشارك');

  // **والإذنُ شرطٌ بنيويّ لا سؤالٌ في الواجهة**
  store.clear();
  const { attempt } = walk('د', 'isolated', 'right');
  const child = arena.itemOf(attempt, { kind: 'child', age: '٦–٧', consent: false, session: 1 });
  ok(arena.arenaRecord(child) === 0 && arena.arenaBook().items.length === 0,
    '**مجرَّبٌ سالباً**: كتابةُ طفلٍ بلا إذن وليٍّ لا تُقيَّد — صفراً، ويبقى الدفترُ خالياً');
  const allowed = arena.itemOf(attempt, { kind: 'child', age: '٦–٧', consent: true, session: 1 });
  ok(arena.arenaRecord(allowed) === 1, 'وبالإذن الصريح تُقيَّد');
  const blind = arena.itemOf({ ...attempt, human: null }, { kind: 'adult', session: 1 });
  ok(arena.arenaRecord(blind) === 0,
    'ولا يُقيَّد أثرٌ بلا حكمِ إنسان — فالدفترُ لا يحمل ما لم يُسمَّ');
  store.clear();
}

/* ═════ ٦) جلسةٌ ~١٠ محاولات ═════ */

console.log('\n— ٦) جلسةٌ عشرُ محاولات، والعيّنةُ تدور على المتناوبين —');
{
  ok(arena.SESSION_SIZE === 10, `الجلسةُ ${arena.SESSION_SIZE} محاولات — رقمٌ يُقرأ من موضعٍ واحد`);
  const plans = [0, 1, 2, 3, 7, 12].map((n) => arena.planFor(n));
  ok(plans.every((p) => p.length === 10), 'وكلُّ خطّةٍ عشرةُ مواضع تامّة');
  ok(plans.every((p) => arena.WATCHED.every((w) => p.some((s) => s.ch === w.ch && s.form === w.form))),
    'والأربعةُ الموسومة في كلِّ جلسةٍ — فهي أوّلُ من نشكّ فيه');
  const covered = new Set();
  for (let n = 0; n < 20; n++) for (const s of arena.planFor(n)) covered.add(`${s.ch}/${s.form}`);
  ok(covered.size === arena.SAMPLE.length,
    `وعشرون متناوباً على جهازٍ واحد يغطّون العيّنةَ كلَّها (${covered.size} من ${arena.SAMPLE.length} شكلاً)`);
}

/* ═════ ٧) الملفُّ يدخل `import_traces` فعلاً — والمنتظَرُ حكمُ الإنسان ═════ */

console.log('\n— ٧) الملفُّ يدخل عدّةَ المعايرة، وحكمُه المنتظَر حكمُ الإنسان —');
{
  store.clear();
  const who = { kind: 'adult', age: '٢٦–٤٠', tool: 'finger', hand: 'right', consent: false, session: 1 };
  // ثلاثةٌ: اتفاقٌ على القبول · اتفاقٌ على الردّ · **وخلافٌ** — وهو أثمنُها
  const rows = [
    walk('ب', 'initial', 'right'),
    walk('ش', 'initial', 'right'),
    walk('ي', 'medial', 'wrong'),
  ];
  for (const { attempt } of rows) arena.arenaRecord(arena.itemOf(attempt, who));
  const book = JSON.parse(arena.arenaText());
  ok(book.items.length === 3 && book.frame === 'line' && book.origin === 'field',
    `الملفُّ ${book.items.length} أسطر، موسومٌ \`field\` **وإطارُه \`line\`** — فلا يُنقَل أثرٌ مرّتين`);

  const cases = toCases(book);
  ok(cases.length === 3, `ويدخل \`toCases\` بأسطره كلِّها (${cases.length})`);
  const same = cases.every((c, i) => JSON.stringify(c.strokes) === JSON.stringify(book.items[i].strokes));
  ok(same, 'وأثرُه يدخل كما خرج — لا يُزحزَح، لأنّ إطارَه معلَن');

  // 🔴 **والمنتظَرُ حكمُ الإنسان — بنيةً لا اتفاقاً**
  const wrong = cases.filter((c, i) => c.expect.accept !== (book.items[i].human === 'right'));
  ok(wrong.length === 0,
    `والمنتظَرُ في كلِّ حالةٍ **حكمُ الإنسان** لا حكمُ المحرّك${wrong.length ? ` — خالف: ${wrong.map((c) => c.id).join('، ')}` : ''}`);
  // **والخلافُ يدخل حمراءَ عمداً**: العينُ ردّت والمحرّكُ قبل — فمنتظَرُه الردّ، وهو
  // اليوم مقبولٌ في العدّة، فيبقى شاهداً أحمرَ حتى تُعايَر السماحة (`FIELD_TRIAL §٣`).
  const clash = book.items.filter((it) => !it.agree);
  ok(clash.length === 1 && cases[2].expect.accept === false && book.items[2].accepted === true,
    `وفيه خلافٌ واحد بين العين والمحرّك (${clash.length}): العينُ ردّت والمحرّكُ قبل —`
    + ' فيدخل العدّةَ **أحمرَ عمداً** حتى تُعايَر السماحة');
  ok(cases.every((c) => c.expect.free && c.origin === 'field' && PATHS[c.ref.split('/')[0]]?.[c.ref.split('/')[1]]),
    'وكلُّها تُحكَم بالحَكَم الثاني (`free`)، ومسارُها مسمّىً موجودٌ في `paths.js`');
  // **وضربةُ النقطة تعبر**: نقرةٌ بنقطةٍ واحدة لا تُبتَر
  const taps = cases[1].strokes.filter((s) => s.length === 1).length;
  ok(taps === 3, `ونقراتُ «ش» الثلاث تعبر العدّةَ نقراتٍ (${taps}) — لا يُبتَر منها الأثر`);

  // **ويُعاد الأثرُ على المحرّك فيطابق ما سُجّل** — فما يُجمَّد شاهدٌ صادق
  const back = cases.map((c, i) => pen.judgeShape(
    PATHS[c.ref.split('/')[0]][c.ref.split('/')[1]], c.strokes).ok === book.items[i].accepted);
  ok(back.every(Boolean), 'وحكمُ الإعادة عينُ الحكم المسجَّل — فلا يُجمَّد شاهدٌ كاذب');

  // **والملفُّ يمرّ في الأداة فعلاً لا محاكاةً**
  // **ولا يُكتب النموذجيُّ في `tools/field_traces/`**: ذاك بيتُ آثارِ ناسٍ حقيقيين،
  // وهذا أثرُ يدٍ مصنوعة — فلا يلتبسان ولا يُجمَّد مصنوعٌ يوماً على أنه ميدان.
  const dir = new URL('scratch/', ROOT);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('arena-sample.json', dir), arena.arenaText());
  const run = spawnSync('node', ['tools/import_traces.mjs', 'scratch/arena-sample.json'],
    { cwd: new URL('./', ROOT), encoding: 'utf8' });
  ok(run.status === 0 && /صالحٌ منها 3/.test(run.stdout),
    `ويمرّ في \`import_traces\` **فعلاً** (خروجٌ ${run.status}): ${run.stdout.split('\n')[0]}`);
  store.clear();
}

/* ═════ ٨) القسمةُ ٧٠/٣٠ — تُوسَم عند الوصول لا بعد النظر ═════ */

console.log('\n— ٨) القسمةُ المعلنة ٧٠/٣٠: تُوسَم عند الوصول لا بعد النظر —');
{
  const plan = arena.planFor(0);
  const verify = plan.filter((s) => s.split === arena.SPLIT.VERIFY).length;
  ok(verify === 3 && plan.length - verify === 7,
    `في كلِّ عشرٍ: ${plan.length - verify} معايرةً و${verify} تحقّقاً — القسمةُ المعلنة`);
  ok(arena.VERIFY_SLOTS.join(',') === '2,5,9',
    `وخاناتُ التحقّق معلنةٌ وموزّعة (${arena.VERIFY_SLOTS.join('، ')}) — لا تقع كلُّها في ذيل الجلسة حيث يملّ الكاتب`);

  // **والوسمُ دالّةُ موضعٍ لا غير**: المحاولةُ نفسُها بحكمين متضادَّين تُوسَم واحداً
  const right = walk('م', 'isolated', 'right', 4);
  const wrong = walk('م', 'isolated', 'wrong', 4);
  ok(right.attempt.split === wrong.attempt.split,
    `**مجرَّبٌ سالباً**: محاولتان في الموضع نفسِه بحكمين متضادّين — وسمُهما واحد (${right.attempt.split})`);
  const src = read('app/arena/arena.js');
  const body = src.slice(src.indexOf('export const splitAt'), src.indexOf('export function planFor'));
  ok(!/human|engine|accept|verdict/.test(body),
    'ونصُّ الوسم لا يذكر حكماً ولا أثراً — دالّةُ موضعٍ خالصة');
  ok(/split: splitAt\(index\)/.test(src) && /split: slot.split/.test(src),
    'والمحاولةُ تُبنى بوسمها من الخطّة — قبل أن تنزل اليد');
}

/* ═════ ٩) صفرُ تعديلِ سماحةٍ من الصفحة — تجمع ولا تحكم ═════ */

console.log('\n— ٩) صفرُ تعديلِ سماحةٍ من الصفحة: تجمع ولا تحكم —');
{
  const src = read('app/arena/arena.js');
  const bad = [
    [/TOLERANCE\s*\.\s*\w+\s*=/, 'إسنادٌ إلى سماحة المحرّك'],
    [/FREE\s*\.\s*\w+\s*=/, 'إسنادٌ إلى كرم السماحة'],
    [/judgeShape\s*\([^)]*\{/, 'خياراتٌ تُمرَّر إلى الحَكَم'],
    [/tolerance\s*:/, 'سماحةٌ تُكتب في الصفحة'],
  ].filter(([re]) => re.test(src));
  ok(bad.length === 0,
    `لا تكتب الصفحةُ سماحةً ولا تمرّرها${bad.length ? ` — وُجد: ${bad.map((b) => b[1]).join('، ')}` : ''}`);
  ok(/judgeShape\(ref, attempt\.strokes\)/.test(src),
    'والحَكَمُ يُنادى بمسارِه وأثرِه وحدَهما — فسماحتُه سماحةُ مادّته كما في شاشة الطفل');
  const planted = 'judgeShape(ref, ink, { tolerance: 2 });';
  ok(/judgeShape\s*\([^)]*\{/.test(planted),
    '**والكاشفُ مجرَّبٌ سالباً**: نداءٌ يمرّر سماحةً يسقط عليه');
}

/* ═════ ١٠) المخزنُ على الجهاز، ثم ملفٌّ بيده، ثم يُمحى بزرّ ═════ */

console.log('\n— ١٠) المخزنُ على جهاز المشارك، ثم ملفٌّ يحفظه بيده، ثم يُمحى —');
{
  store.clear();
  const who = { kind: 'adult', age: '٢٦–٤٠', tool: 'pen', hand: 'right', session: 1 };
  const { attempt } = walk('ك', 'isolated', 'right');
  const item = arena.itemOf(attempt, who);
  ok(arena.arenaRecord(item) === 1 && arena.arenaBook().items.length === 1,
    'الأثرُ يُقيَّد في مخزن الجهاز أثراً أثراً خلال الجلسة');

  for (let i = 0; i < 400; i++) arena.arenaRecord(item);
  const capped = arena.arenaBook().items.length;
  ok(capped === arena.ARENA_MAX,
    `وللدفتر سقفٌ يمنع امتلاءَ مخزن جهاز (${capped} من ٤٠١ عُرضت) — والأثرُ ≈٥ كيلوبايت`);

  const text = arena.arenaText();
  ok(text.includes('"origin": "field"') && text.includes('"frame": "line"'),
    'ونصُّ الملفّ يعلن مصدرَه وإطارَه — فيدخل العدّةَ بلا التباس');
  ok(/uktub-arena-\d{4}-\d{2}-\d{2}\.json/.test(arena.arenaName()),
    `واسمُه بيومه فلا يُكتب ملفٌّ فوق ملف (${arena.arenaName()})`);
  const size = Math.round(new TextEncoder().encode(JSON.stringify(item)).length / 102.4) / 10;
  console.log(`      · حجمُ الأثر الواحد المقيس: ${size} كيلوبايت`
    + ` — فمئتا أثرٍ ≈ ${Math.round(size * 200)} كيلوبايت`);

  arena.arenaClear();
  ok(arena.arenaBook().items.length === 0 && arena.arenaBook().session === 0,
    'والمحوُ بزرٍّ يمحو كلَّ شيء — ولا يبقى على الجهاز أثرٌ بلا علم صاحبه');
}

console.log(fails ? `\n${fails} فشل` : '\nساحةُ الحصاد: قيودُها العشرة محروسةٌ ومجرَّبةٌ سالباً.');
process.exit(fails ? 1 : 0);
