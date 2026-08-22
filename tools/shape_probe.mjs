// ⚗️ **مِسبارُ حَكَم الشكل** — دليلُ خطّة الإنقاذ (٢١ أغسطس ٢٠٢٦)، لا منتَج.
// يقيس: أيفصل حكمٌ كلّيٌّ (تطبيعٌ + تغطيةٌ باتجاهين + قاعدةُ نقاط) ما فصلته عينُ الأب؟
// تشغيله:  node tools/shape_probe.mjs   (يقرأ field/ وpaths.js ولا يكتب شيئاً)
// حصيلتُه المقيسة يومَ كُتب: الميدان ٥٦/٦٠ (عتبة ٠٫٧٠) · الأخوات ١٢٤/١٢٤ — والمحرّكُ يومَها ٢٤/٦٠.
// ⇒ يخلفه `judgeShape` الحقيقيّ في جلسة ن١ بعدّته وحرّاسه — وهذا يبقى شاهدَ الأصل.
// مِسبارُ حَكَم الشكل — قياسٌ لا منتَج: أيفصل حكمٌ كلّيٌّ (بلا مشيِ مسار) ما فصلته العين؟
import * as pen from '../app/js/pen.js';
import { PATHS } from '../app/js/paths.js';
import { readFileSync } from 'node:fs';

let THR = 0.78;
export const setThr = (t) => { THR = t; };
const dense = (pts, step = 14) => {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.round(d / step));
    for (let k = 0; k < n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  }
  out.push(pts[pts.length - 1]);
  return out;
};
const near = (p, cloud, tol) => {
  const t2 = tol * tol;
  for (const q of cloud) { const dx = p[0] - q[0], dy = p[1] - q[1]; if (dx * dx + dy * dy <= t2) return true; }
  return false;
};
const frac = (cloud, target, tol) => cloud.length ? cloud.filter((p) => near(p, target, tol)).length / cloud.length : 0;
const pathLen = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]); return s; };
const meanY = (pts) => pts.reduce((s, p) => s + p[1], 0) / pts.length;

export function judgeShape(ref, strokes) {
  const tol = pen.easeTolerance(pen.resolveTolerance(ref.tolerance)).lateral;
  const size = pen.sizeOf(ref, strokes, pen.resolveTolerance(ref.tolerance)); // إرشادٌ لا ردّ
  const parts = pen.partsOf(ref);
  const bodyParts = parts.filter((p) => p.kind === 'stroke');
  const dotParts = parts.filter((p) => p.kind === 'dot');
  const D = dotParts.reduce((n, p) => n + (p.count || 1), 0);
  const modelBody = bodyParts.flatMap((p) => dense(p.poly.pts.map((q) => [q[0], q[1]])));
  const modelDots = dotParts.map((p) => [p.at[0], p.at[1]]);
  const dotSpan = modelDots.length > 1
    ? Math.max(...modelDots.map((d) => d[0])) - Math.min(...modelDots.map((d) => d[0])) : 0;

  // فرزُ حبر الطفل: جسمٌ أم علامة — بقربه من جسم النموذج ومن مواضع النقاط
  // **التطبيع**: مقياسٌ واحدٌ وإزاحةٌ — فالكِبَرُ والموضعُ لا يبدّلان الشكل
  const allChild = strokes.flat();
  const allModel = [...modelBody, ...modelDots];
  const bb = (pts) => {
    const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
    return { x: Math.min(...xs), y: Math.min(...ys),
             w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  };
  const cb = bb(allChild); const mb = bb(allModel);
  const s0 = Math.max(cb.w, cb.h) > 1 ? Math.max(mb.w, mb.h) / Math.max(cb.w, cb.h) : 1;
  const sc = Math.min(4, Math.max(0.25, s0));
  const cc = [cb.x + cb.w / 2, cb.y + cb.h / 2]; const mc = [mb.x + mb.w / 2, mb.y + mb.h / 2];
  const norm = (p) => [mc[0] + (p[0] - cc[0]) * sc, mc[1] + (p[1] - cc[1]) * sc];
  let childStrokes = strokes.map((s) => dense(s.map((q) => norm([q[0], q[1]]))));
  // خطوةُ تسويةٍ واحدة: وسيطُ فروق أقرب جارٍ يزيح الكلَّ — لا دورانَ ولا التواء
  {
    const sample = childStrokes.flat().filter((_, i) => i % 3 === 0);
    const dx = []; const dy = [];
    for (const q of sample) {
      let best = null; let bd = Infinity;
      for (const m of allModel) { const d = (q[0]-m[0])**2 + (q[1]-m[1])**2; if (d < bd) { bd = d; best = m; } }
      if (best && bd < (2.5 * tol) ** 2) { dx.push(best[0] - q[0]); dy.push(best[1] - q[1]); }
    }
    const med = (a) => { if (!a.length) return 0; const b = [...a].sort((x, y) => x - y); return b[(b.length / 2) | 0]; };
    const ox = med(dx); const oy = med(dy);
    childStrokes = childStrokes.map((st) => st.map((q) => [q[0] + ox, q[1] + oy]));
  }
  const body = []; const marks = [];
  for (const s of childStrokes) {
    const tap = s.length <= 4 || pathLen(s) < 0.5 * tol;
    const onBody = frac(s, modelBody, tol);
    const toDots = D ? frac(s, modelDots, tol * 1.8) : 0;
    if (D && (tap || toDots > onBody)) marks.push(s); else body.push(s);
  }
  const childBody = body.flat();
  const childMarks = marks.flat();

  // ١) الجسم: تغطيةٌ باتجاهين + أدنى تغطيةِ جزء
  const recall = frac(modelBody, childBody, tol);
  const perPart = bodyParts.length
    ? Math.min(...bodyParts.map((p) => frac(dense(p.poly.pts.map((q) => [q[0], q[1]])), childBody, tol))) : 1;
  const precision = childBody.length ? frac(childBody, [...modelBody, ...modelDots], tol) : 0;

  // ٢) النقاط: النقراتُ تُعَدّ عدّاً والمتّصلُ يُقاس مدّاً — والجهةُ شرط
  let stray = false;
  if (D === 0) {
    for (const st of childStrokes) {
      const tap = st.length <= 4 || pathLen(st) < 0.5 * tol;
      if (tap) { stray = true; break; }
    }
  }
  let dotsOk = D === 0 ? !stray : false;
  let dotWhy = '';
  if (D > 0) {
    if (!marks.length) { dotsOk = false; dotWhy = 'لا علامة'; }
    else {
      const cs = [...marks].sort((a, b) => meanY([a[0]]) - 0 + a[0][0] - b[0][0]);
      // تجميعُ العلامات: ما تقارب مركزاهما دون ٠٫٤٥ سماحةً فهو تجمّعٌ واحد
      const cent = marks.map((s) => [s.reduce((x, p) => x + p[0], 0) / s.length, meanY(s)]);
      const used = new Array(marks.length).fill(false); let clusters = 0;
      for (let i = 0; i < marks.length; i++) {
        if (used[i]) continue; clusters++; used[i] = true;
        for (let j = i + 1; j < marks.length; j++)
          if (!used[j] && Math.hypot(cent[i][0] - cent[j][0], cent[i][1] - cent[j][1]) < 0.45 * tol) used[j] = true;
      }
      const runs = marks.filter((s) => !(s.length <= 4 || pathLen(s) < 0.5 * tol));
      const xs = childMarks.map((p) => p[0]); const ys = childMarks.map((p) => p[1]);
      const spanX = Math.max(...xs) - Math.min(...xs); const spanY = Math.max(...ys) - Math.min(...ys);
      const sideModel = modelDots.length && modelBody.length
        ? Math.sign(meanY(modelDots) - meanY(modelBody)) : 0;
      const sideChild = childBody.length ? Math.sign(meanY(childMarks) - meanY(childBody)) : sideModel;
      const sideOk = sideModel === 0 || sideChild === sideModel;
      if (!sideOk) { dotsOk = false; dotWhy = 'جهةٌ غيرُ جهتها'; }
      else if (clusters === D) dotsOk = true;
      else if (clusters < D && runs.length) {
        // شَرْطةٌ أو زاوية: المدى يقوم مقامَ العدد — وللثلاث رأسٌ يعلو
        const spanOk = D > 1 && spanX >= 0.5 * dotSpan && spanX <= 2.4 * Math.max(dotSpan, tol);
        const apexOk = D < 3 || spanY >= 0.28 * spanX;
        dotsOk = spanOk && apexOk;
        dotWhy = dotsOk ? 'مدٌّ' : ('مدٌّ ناقص ' + (apexOk ? '' : 'بلا رأس'));
      } else { dotsOk = false; dotWhy = `تجمّعات ${clusters}≠${D}`; }
    }
  }
  const ok = recall >= THR && perPart >= 0.55 && precision >= 0.55 && dotsOk;
  return { ok, size, recall, perPart, precision, dotsOk, dotWhy: dotWhy || (stray ? 'نقرةٌ زائدة' : ''), D };
}

// ————— المسحُ على العتبات الثلاث —————
const SWEEP = [0.70, 0.74, 0.78];
// ————— ١) الميدان: ٦٠ كتابة —————
const rows = JSON.parse(readFileSync(new URL('../field/', import.meta.url).pathname + '2026-08-20-arena-all.json', 'utf8')).items;
for (const t of SWEEP) {
  setThr(t); let o2 = 0, f2 = 0, a2 = 0;
  for (const r of rows) { const ref = PATHS[r.ch]?.[r.form]; if (!ref) continue;
    const v = judgeShape(ref, r.strokes); const eye = r.eye === 'accept';
    if (v.ok === eye) o2++; else if (eye) f2++; else a2++; }
  let so = 0, sb = 0;
  for (const fam of [['ب','ت','ث','ن','ي'],['ج','ح','خ'],['د','ذ'],['ر','ز'],['ط','ظ'],['ص','ض'],['ع','غ'],['س','ش'],['ف','ق']])
    for (const a of fam) for (const b of fam) for (const form of ['isolated','medial']) {
      const ra = PATHS[a]?.[form], rb = PATHS[b]?.[form]; if (!ra || !rb) continue;
      const tr = [];
      for (const pp of pen.partsOf(ra)) {
        if (pp.kind === 'dot') { for (let i = 0; i < (pp.count || 1); i++) tr.push([pp.at, pp.at, pp.at]); }
        else tr.push(pp.poly.pts.map((q) => [q[0], q[1]]));
      }
      if (judgeShape(rb, tr).ok === (a === b)) so++; else sb++;
    }
  console.log(`عتبة ${t}: الميدان ${o2}/60 (ردٌّ كاذب ${f2} · قبولٌ كاذب ${a2}) · الأخوات ${so}/${so + sb}`);
}
setThr(0.78);
let ok = 0, fr = 0, fa = 0; const misses = [];
for (const r of rows) {
  const ref = PATHS[r.ch]?.[r.form]; if (!ref) continue;
  const v = judgeShape(ref, r.strokes);
  const eye = r.eye === 'accept';
  if (v.ok === eye) ok++;
  else { (eye ? fr++ : fa++); misses.push({ r, v, eye }); }
}
console.log(`— المِسبار على الميدان: ${ok}/60 · ردٌّ كاذب ${fr} · قبولٌ كاذب ${fa} —`);
for (const { r, v, eye } of misses)
  console.log(`  ${eye ? '🔴 رُدّ ظلماً' : '🟠 قُبل خطأً'} ${r.ch}/${r.form.slice(0,6)} (${r.hand[0]})`
    + ` تغطية ${(v.recall*100)|0}٪ جزء ${(v.perPart*100)|0}٪ دقّة ${(v.precision*100)|0}٪`
    + ` نقاط ${v.dotsOk ? '✓' : '✗ ' + v.dotWhy}${v.size ? ' حجم:' + v.size : ''}`);

// ————— ٢) مصفوفةُ الأخوات: مرجعُ كلِّ أختٍ على مراجع أخواتها —————
const FAMILIES = [['ب','ت','ث','ن','ي'], ['ج','ح','خ'], ['د','ذ'], ['ر','ز'], ['ط','ظ'], ['ص','ض'], ['ع','غ'], ['س','ش'], ['ف','ق']];
const traceOf = (ref) => {
  const out = [];
  for (const p of pen.partsOf(ref)) {
    if (p.kind === 'dot') { for (let i = 0; i < (p.count || 1); i++) out.push([p.at, p.at, p.at]); }
    else out.push(p.poly.pts.map((q) => [q[0], q[1]]));
  }
  return out;
};
let sOk = 0, sBad = 0; const sMiss = [];
for (const fam of FAMILIES)
  for (const a of fam) for (const b of fam)
    for (const form of ['isolated', 'medial']) {
      const ra = PATHS[a]?.[form], rb = PATHS[b]?.[form];
      if (!ra || !rb) continue;
      const v = judgeShape(rb, traceOf(ra));
      const want = a === b;
      if (v.ok === want) sOk++; else { sBad++; sMiss.push(`${a}⇐${b}/${form.slice(0,4)} ${v.ok ? 'قُبل!' : 'رُدّ! (' + (v.size || v.dotWhy || 'جسم') + ')'}`); }
    }
console.log(`\n— مصفوفةُ الأخوات: ${sOk}/${sOk + sBad} —`);
for (const m of sMiss) console.log('  🔴 ' + m);
