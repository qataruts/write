#!/usr/bin/env python3
"""🔁 **تبديلُ مادّة التطبيق** بطبقتَي الفونت والكيفية (بند ك٤).

    python3 tools/swap_material.py --write     # يكتب app/js/paths.js و word_paths.js

**العقد**: الشكلُ من `font_layer.json` والكيفيةُ من `hand_layer.json`، ويُنقلان إلى
فضاء التطبيق **بمقياسٍ واحدٍ مقيس**: ارتفاعُ الألف في المادّة القديمة على ارتفاعها
في الجديدة — فلا يتبدّل حجمُ الكتابة على اللوح ولا تنقلب معايرةُ الحَكَم.
وخطُّ الأساس يُطابَق، والسماحاتُ القديمة تُنقل كما هي لكلِّ شكل.
"""
import json
import math
import re
import subprocess
import tempfile
import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
HAND = TOOLS / "hand_layer.json"
PATHS = ROOT / "app/js/paths.js"
WORDS = ROOT / "app/js/word_paths.js"

CELL = 2163.5
LINE = 1361.3
WCELL = 2125.3
WLINE = 1344.7
MARGIN = 81.0


# **حجمُ الكلمة على اللوح ونسبتا القلم** (أوامر المالك ٢٥–٢٦ أغسطس ٢٠٢٦).
#
# 🔴 **وتصحيحُ فهمٍ وقع منّي** (بلاغُ المالك ٢٦ أغسطس: «الكلامُ الآن صغير والحبرُ
# كبير»): لمّا قال «اجعل الحبرَ ٥٪ والفونتَ ٧٪ أو بالأكثر ٨٪» حسبتُ **حجمَ الكلمة**
# لأُنزل قلمَ الفونت إلى ٧٫٥٪ — **وهو محالٌ بالتصغير**: نسبةُ سماكة قلم الخطّ إلى
# ارتفاع حرفه **صفةٌ في الخطّ نفسِه** (Noto Sans Arabic العاديّ: ١٦٪)، تصغر الكلمةُ
# وتكبر وتبقى ١٦٪. فلم أُنزل القلمَ، وإنما **صغّرتُ الكلمة** — وأسمنتُ الحبرَ معها.
# ⇐ فرُدَّ كلُّ أمرٍ إلى بابه:
#   · **الحجمُ رقمُ المالك** («ليصبح تقريباً ٦٠٪ على مستوى التطبيق») — لا يُشتقّ.
#   · **والنسبةُ بين الحبر والقلم** هي ما يُنفَّذ منهما: الحبرُ **ثلثا قلمِ الفونت**
#     (٥ : ٧٫٥ بنصّه)، يُقاس من قلم الخطّ نفسِه فيقاربه ولا يعلوه.
#   · **وبلوغُ ٧٪ حقّاً بابُه وزنٌ أخفّ من الخطّ** (ExtraLight) — بندٌ معلَنٌ للمالك.
WORD_SIZE = 0.60            # حجمُ الكلمة من مقاسها الطبيعيّ — رقمُ المالك بنصّه
FONT_SHARE = 0.075          # قلمُ الفونت كما نصّه المالك — به تُوزَن نسبةُ الحبر
INK_SHARE = 0.05            # حبرُ الطفل كما نصّه المالك — ٥٪، أي ثُلثا قلم الفونت
PEN_EM = 101.9              # ساقُ الألف حبراً في الخطّ المحصود (جسم ١٠٠٠)


def shrink(strokes, dots, factor, base_y, centre_x):
    """يصغّر الكتابةَ عن خطّ أساسها ووسط لوحها — والصندوقُ لا يُمَسّ."""
    put = lambda q: [r1(centre_x + (q[0] - centre_x) * factor),
                     r1(base_y + (q[1] - base_y) * factor)]
    out = []
    for st in strokes:
        one = {"start": put(st["start"]), "points": [put(p) for p in st["points"]]}
        if st.get("folds"):
            one["folds"] = st["folds"]
        out.append(one)
    return out, [{**d, "at": put(d["at"])} for d in dots]


def base_copy() -> Path:
    """ينسخ مادّةَ `HEAD` إلى مجلّدٍ مؤقّت **فتُقرأ الأصولُ ولو كانت الشجرةُ مكسورة**.

    ⚠ **عطبٌ دائريّ وقع فأُغلق** (٢٥ أغسطس): العدّةُ كانت تستورد `app/js` من الشجرة
    لتقرأ السماحاتِ والمقياس — فإذا كتبت ملفّاً مكسوراً لم تستطع قراءةَ شيءٍ بعده،
    فيبقى المكسورُ مكسوراً. **والأصلُ يُطلَب من `git` فلا يُصاب بما نكتب.**
    """
    out = Path(tempfile.mkdtemp(prefix="uktub-base-"))
    for name in ("paths.js", "word_paths.js"):
        text = subprocess.run(["git", "show", f"HEAD:app/js/{name}"],
                              capture_output=True, text=True, cwd=ROOT).stdout
        (out / name).write_text(text, encoding="utf-8")
    return out


def old_material():
    """يقرأ المادّةَ القائمة من التطبيق نفسِه — للمقياس والسماحات وخطّ الأساس."""
    src = """
    import { PATHS } from 'BASE/paths.js';
    import { resolveTolerance, MIN_STEP } from './app/js/pen.js';
    const out = { tol: {}, back: {}, lat: {}, alef: 0, wback: resolveTolerance(1).back,
                  wlat: resolveTolerance(1).lateral, step: MIN_STEP };
    for (const [ch, forms] of Object.entries(PATHS))
      for (const [f, ref] of Object.entries(forms)) {
        out.tol[ch + '/' + f] = ref.tolerance ?? null;
        // **الحدُّ العامل لا الثابتُ المكتوب**: سماحةُ الارتداد تُطلَب من الدالّة
        // التي يحكم بها المحرّك (`resolveTolerance`) لا من `TOLERANCE` ولا من وثيقة.
        out.back[ch + '/' + f] = resolveTolerance(ref.tolerance ?? undefined).back;
        out.lat[ch + '/' + f] = resolveTolerance(ref.tolerance ?? undefined).lateral;
      }
    const p = PATHS['ا'].isolated.strokes.flatMap(s => s.points).map(q => q[1]);
    out.alef = Math.max(...p) - Math.min(...p);
    console.log(JSON.stringify(out));
    """
    base = base_copy()
    src = src.replace("BASE", base.as_posix())
    r = subprocess.run(["node", "--input-type=module", "-e", src],
                       capture_output=True, text=True, cwd=ROOT)
    if r.returncode:
        raise SystemExit("تعذّرت قراءة paths.js: " + r.stderr[-300:])
    out = json.loads(r.stdout)
    # **ورأسُ المسار يُقرأ من المحرّك نصّاً** (لا يُصدَّر): نظيرُ ما يفعله `check_paths`.
    head = re.search(r"const HEAD_RATIO = ([0-9.]+)", (ROOT / "app/js/pen.js").read_text(encoding="utf-8"))
    out["head"] = float(head.group(1)) if head else 0.1
    return out


def engine_tolerance(value: float) -> dict:
    """**الحدُّ من الدالّة الحاكمة لا بضربٍ خطّيّ** (قاعدةُ «الحدّ العامل»):
    `resolveTolerance` ليست خطّيةً بالضرورة، فتقديرُها ضرباً يُخطئ بقدرٍ صغيرٍ
    يكفي لأن يمرّ ضلعُ طيّةٍ من تحت الحارس (قِيس: قُدِّرت ٣٢٫٦ وهي ٣٥)."""
    src = ("import { resolveTolerance } from './app/js/pen.js';"
           f"console.log(JSON.stringify(resolveTolerance({value})));")
    r = subprocess.run(["node", "--input-type=module", "-e", src],
                       capture_output=True, text=True, cwd=ROOT)
    return json.loads(r.stdout) if r.returncode == 0 else {}


def bbox(pts):
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def r1(v):
    return round(v + 0.0, 1)


def poly_len(pts):
    return sum(math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))


def sound_folds(points, folds, back, lateral):
    """يُسقِط الطيّاتِ التي لا يقيسها المحرّك — **بمعيار `check_paths` بعينه**.

    طيّةٌ تُعلَن ولا يفرّق المحرّكُ ضلعيها كذبٌ عليه: فيلزم (أ) أن يبلغ كلُّ ضلعٍ
    **سماحةَ الارتداد** طولاً، و(ب) أن يشترك الضلعان في حبرٍ واحد — أدنى مسافةٍ
    بينهما دون **سماحة الانحراف**، مقيسةً بين نقطتين متباعدتين بضعفَي الارتداد
    (فجوارُ القمّة اشتراكٌ بحكم البناء لا شهادةَ فيه).
    """
    if not folds:
        return folds
    def seg(a, b):
        return sum(math.dist(points[i - 1], points[i]) for i in range(a + 1, b + 1))
    keep = []
    for f in folds:
        a, mid, b = f["from"], f["apex"], f["to"]
        if not (0 <= a < mid < b < len(points)):
            continue
        rise, fall = seg(a, mid), seg(mid, b)
        if min(rise, fall) < back:
            continue
        up_at = [seg(a, k) for k in range(a, mid + 1)]
        down_at = [seg(a, k) for k in range(mid, b + 1)]
        span = back * 2
        touch = min((math.dist(points[a + i], points[mid + j])
                     for i, pl in enumerate(up_at)
                     for j, ql in enumerate(down_at) if ql - pl >= span),
                    default=float("inf"))
        if touch >= lateral:
            continue
        keep.append(f)
    return keep


def thin(points, folds, cap):
    """يُسقِط النقاطَ الزائدة ما دامت القطعةُ دون الحدّ — **وحفظُ الطيّة شرط**.

    **العلّةُ مقيسة**: خطوةُ الهيكل ١٤٫٨ وخطوةُ المادّة القائمة ٤٥٫٨ — ثلاثةُ أضعاف
    كثافةٍ لا يفرّقها المحرّك (`MIN_STEP` ٦) وتُثقل تنزيلَ الـPWA (١٠م.ب مقابل ٤٫٣).
    **والحدُّ حدُّ نافذة الرتابة نفسُه** الذي يحرسه `check_paths`، فلا نُخالف حارساً
    لنخفّف حملاً. **وأطرافُ الطيّة تُثبَّت** فلا تنزلق إعلاناتُها.
    """
    if len(points) < 3:
        return points, folds
    hold = {0, len(points) - 1}
    for f in folds or []:
        hold |= {f["from"], f["apex"], f["to"]}
    keep = [0]
    for i in range(1, len(points) - 1):
        if i in hold:
            keep.append(i)
            continue
        if math.dist(points[keep[-1]], points[i + 1]) > cap:
            keep.append(i)
    keep.append(len(points) - 1)
    index = {old: new for new, old in enumerate(keep)}
    marks = [{"from": index[f["from"]], "apex": index[f["apex"]], "to": index[f["to"]]}
             for f in (folds or [])]
    return [points[i] for i in keep], marks


def carry_folds(stroke, points, back):
    """🔴 **الطيّاتُ تُنقَل بأرقامها** — النقاطُ لا تُعاد أخذَ عيّنةٍ في التحويل،
    فأرقامُ الطيّة في طبقة الكيفية هي أرقامُها في التطبيق بعينها.

    **وتُصفّى بما يقيسه المحرّك لا بحدٍّ مكتوب**: ضلعٌ أقصرُ من **سماحة ارتداده**
    (`resolveTolerance(tolerance).back` — تُطلَب من الدالّة الحاكمة) يبتلعه سماحُ
    بلوغِ القمّة نفسُه، فلا يقيس فيه المحرّكُ ذهاباً ولا إياباً — فدعواه طيّةً تفتح
    على الحرف باباً لا يُغلَق (`check_paths §check_folds`).
    """
    out = []
    for f in stroke.get("folds") or []:
        up = points[f["from"]:f["apex"] + 1]
        down = points[f["apex"]:f["to"] + 1]
        if min(poly_len(up), poly_len(down)) < back:
            continue
        out.append({"from": f["from"], "apex": f["apex"], "to": f["to"]})
    return out


def densify(points, folds, cap):
    """🔴 **عيّنةٌ أدقُّ لا شكلٌ آخر** — تُدخَل نقاطٌ وسيطةٌ في القطع الطويلة.

    **نافذةُ رتابة المحرّك ترشّح قطعاً كاملة**: قطعةٌ أطولُ ممّا يفرّقه (`back`،
    ورأسُ المسار `HEAD_RATIO` للقصير) تقفز بتقدّم الطفل فتُقرأ حركتُه خطأً — وهو
    الحدُّ الذي يحرسه `check_paths`. **وهيكلُ الفونت يخرج بعيّنةٍ خشنة**: قِيست
    وسيطاً ٤٧٫٦ وحدة وأقصاها ١٦٢٫٦، **و١٣٧ ضربةً تتجاوز الحدَّ قبل أيّ فكِّ طيّة**
    (والقناطرُ داخلَ الحبر قطعتان لا غير) — فالعيبُ في المادّة لا في الطيّة.

    **والنقاطُ الجديدة على الوتر نفسِه**: لا يتبدّل مسارٌ ولا طولٌ ولا شكل، وإنّما
    تدقّ العيّنة. **وأرقامُ الطيّات تُنقَل معها** — فهي فهارسُ نقاطٍ لا مواضعَ ثابتة.
    """
    out = [list(points[0])]
    at = [0]
    for i in range(1, len(points)):
        a, b = points[i - 1], points[i]
        n = max(1, int(math.ceil(math.dist(a, b) / cap)))
        for k in range(1, n):
            t = k / n
            out.append([r1(a[0] + (b[0] - a[0]) * t), r1(a[1] + (b[1] - a[1]) * t)])
        out.append(list(b))
        at.append(len(out) - 1)
    return out, [{"from": at[f["from"]], "apex": at[f["apex"]], "to": at[f["to"]]}
                 for f in folds]


def convert(unit, scale, base_y, cell_line, left=None, centre_w=None, back=0.0,
            head=0.1, floor=6.0, lateral=0.0):
    """ينقل وحدةً إلى فضاء التطبيق: مقياسٌ واحد، وخطُّ أساسٍ مطابَق."""
    pts = [q for st in unit["strokes"] for q in st["p"]] + [[d[0], d[1]] for d in unit["dots"]]
    x0, y0, x1, y1 = bbox(pts)
    if left is None:
        left = (centre_w - (x1 - x0) * scale) / 2
    dx = left - x0 * scale
    dy = cell_line - base_y * scale
    put = lambda q: [r1(q[0] * scale + dx), r1(q[1] * scale + dy)]
    strokes = []
    for st in unit["strokes"]:
        pts = [put(q) for q in st["p"]]
        folds = carry_folds(st, pts, back)
        # **الحدُّ من المحرّك بعينه**: `min(back, len × HEAD_RATIO)` — ونُدَقِّق دونه
        # بعُشره فلا يقع الحدُّ على حدّ السكين.
        cap = max(floor, min(back, poly_len(pts) * head)) * 0.9
        pts, folds = thin(pts, folds, max(cap, 1.0))
        pts, folds = densify(pts, folds, max(cap, 1.0))
        # **ولا نقطتين متطابقتين** (`check_paths`: «نقطتان متطابقتان»): الإزاحةُ
        # والتقريبُ قد يجعلان جارتين واحدةً — تُطرح الثانيةُ **وتُردّ فهارسُ الطيّة**.
        clean, drop = [], {}
        for i, q in enumerate(pts):
            if clean and math.dist(clean[-1], q) < 0.12:
                drop[i] = len(clean) - 1
                continue
            drop[i] = len(clean)
            clean.append(q)
        if len(clean) >= 2 and len(clean) != len(pts):
            pts = clean
            folds = [{"from": drop[f["from"]], "apex": drop[f["apex"]], "to": drop[f["to"]]}
                     for f in (folds or [])]
            folds = [f for f in folds if f["from"] < f["apex"] < f["to"]]
        folds = sound_folds(pts, folds, back, lateral)
        one = {"start": pts[0], "points": pts}
        if folds:
            one["folds"] = folds
        strokes.append(one)
    # 🔴 **والنقطتان الملتحمتان تُفصلان بالقياس** (ظهر بتبديل الخطّ إلى `Noto Sans`
    # بأمر المالك): الخطُّ يُدني نقطتَي التاء والقاف حتى يلتحم حبرُهما، فيقرؤهما
    # الحصادُ **نقطةً واحدةً بيضيّة** فينقص العددُ عن الحقيقة الإملائية (قِيس:
    # «الدلو تحت الصنبور…» ١٠ والحقيقةُ ١١). ⇐ **يُقرأ عددُها من امتدادها**: ما
    # عرضُه ضِعفُ ارتفاعه نقطتان، وثلاثةُ أضعافٍ ثلاث — **ولا رقمَ يُكتب**، فنسبةُ
    # الامتداد هي الشاهد. وتُفصَل مواضعُها على عرضها فتصير مواضعَ منفصلةً كما تقتضي
    # القاعدةُ («النقاطُ مواضعُ منفصلة لا نقراتٌ في موضع»).
    dots = []
    for d in unit["dots"]:
        rx, ry = (d[2] if len(d) > 2 else 0), (d[3] if len(d) > 3 else 0)
        many = 3 if (ry and rx / ry >= 2.4) else (2 if (ry and rx / ry >= 1.6) else 1)
        if many == 1:
            dots.append({"at": put([d[0], d[1]]), "count": 1, "after": True})
            continue
        step = (2 * rx) / many
        first = d[0] - rx + step / 2
        for k in range(many):
            dots.append({"at": put([first + k * step, d[1]]), "count": 1, "after": True})
    return strokes, dots, (x1 - x0) * scale


def js_ref(ref, indent):
    """يكتب مرجعَ شكلٍ واحد — **JSON صحيحٌ بلا فاصلةٍ زائدة**، فالفاحصُ
    (`check_paths.load_paths`) يقرأ الوحدةَ قراءةَ JSON لا قراءةَ جافاسكربت."""
    pad = " " * indent
    out = [f'{pad}"box": [{r1(ref["box"][0])}, {r1(ref["box"][1])}]',
           f'{pad}"line": {r1(ref["line"])}']
    # **وجسمُ طبقة الفونت وقلمُها يخرجان مع المرجع** — تقرؤهما الشاشةُ فتنطبق
    # الطبقةُ على الحبر، ولا يُكتب مقاسٌ في شيفرةٍ فيشيخ يومَ يتبدّل الحجم.
    for key in ("em", "ink", "pen"):
        if ref.get(key) is not None:
            out.append(f'{pad}"{key}": {ref[key]}')
    if ref.get("tolerance") is not None:
        out.append(f'{pad}"tolerance": {ref["tolerance"]}')
    sts = []
    for st in ref["strokes"]:
        pts = ", ".join(f'[{p[0]}, {p[1]}]' for p in st["points"])
        folds = ""
        if st.get("folds"):
            folds = ', "folds": [' + ", ".join(
                f'{{ "from": {f["from"]}, "apex": {f["apex"]}, "to": {f["to"]} }}'
                for f in st["folds"]) + "]"
        sts.append(f'{pad}  {{ "start": [{st["start"][0]}, {st["start"][1]}], '
                   f'"points": [{pts}]{folds} }}')
    out.append(f'{pad}"strokes": [\n' + ",\n".join(sts) + f'\n{pad}]')
    ds = ", ".join(f'{{ "at": [{d["at"][0]}, {d["at"][1]}], "count": {d["count"]}, "after": true }}'
                   for d in ref["dots"])
    out.append(f'{pad}"dots": [{ds}]')
    return ",\n".join(out)


def main():
    hand = json.loads(HAND.read_text(encoding="utf-8"))
    old = old_material()
    units = hand["units"]
    alef = next(u for u in units if u["name"] == "ا/isolated")
    ah = bbox([q for st in alef["strokes"] for q in st["p"]])
    scale = old["alef"] / max(ah[3] - ah[1], 1e-6)
    base_y = hand["space"]["baseline"]
    word_size = WORD_SIZE
    font_pen = PEN_EM * scale * word_size
    child_pen = font_pen * (INK_SHARE / FONT_SHARE)
    print(f"حجمُ الكلمة {word_size:.0%} بنصّ المالك · قلمُ الفونت {font_pen:.1f} وحدة"
          f" · حبرُ الطفل {child_pen:.1f} ({INK_SHARE:.0%}:{FONT_SHARE:.1%})")
    wtol = engine_tolerance(round(word_size, 4))
    # **وسماحةُ المحرّك الخام** — يقرؤها الفاحصُ ويشدّها خطّياً، فنقرؤها كما يقرأ.
    raw = engine_tolerance(1)
    print(f"سماحةُ المحرّك عند مقياس الكلمة: انحراف {wtol.get('lateral', 0):.1f}"
          f" · ارتداد {wtol.get('back', 0):.1f} · بداية {wtol.get('start', 0):.1f}")
    print(f"المقياسُ المقيس: ارتفاعُ ألف التطبيق {old['alef']:.0f} ÷ ألف الطبقة "
          f"{ah[3] - ah[1]:.0f} = {scale:.4f}")

    letters, words = {}, {}
    for u in units:
        if u["kind"] == "letter":
            ch, form = u["name"].split("/")
            st, dots, _ = convert(u, scale, base_y, LINE, centre_w=CELL,
                                  lateral=old["lat"].get(u["name"], old["wlat"]),
                                  back=old["back"].get(u["name"], old["wback"]),
                                  head=old["head"], floor=old["step"])
            letters.setdefault(ch, {})[form] = {
                "box": [CELL, CELL], "line": LINE,
                "tolerance": old["tol"].get(u["name"]), "strokes": st, "dots": dots}
        else:
            # **والتصغيرُ يقع في المقياس لا بعده**: لو صُغِّرت الكتابةُ بعد تنقية
            # النقاط وتكثيفها لَقصُرت قطعُها تحت نافذة الرتابة (قِيس: ١٣٣٦ مخالفة)
            # — فالمقياسُ يحمل النسبةَ، والحدودُ تُحسب على المقاس النهائيّ.
            full = (max(q[0] for st0 in u["strokes"] for q in st0["p"])
                    - min(q[0] for st0 in u["strokes"] for q in st0["p"])) * scale
            box_w = full + 2 * MARGIN
            st, dots, w = convert(u, scale * word_size, base_y, WLINE,
                                  left=(box_w - full * word_size) / 2,
                                  # **والحدودُ بمقياس المادّة أيضاً** — فالسماحةُ
                                  # صارت `word_size`، فتُضرب فيها كما يضربها
                                  # المحرّك (`resolveTolerance`) عند الحكم.
                                  # **ويُؤخَذ الأشدُّ من الحدّين**: المحرّكُ يحسب
                                  # سماحتَه بدالّته (٣٢٫٦) والفاحصُ يشدّها خطّياً
                                  # بمقياس المادّة (٣٥) — فما جاز عند الأوّل قد
                                  # يحمرّ عند الثاني، والصوابُ ألّا نُصدِّر إلا ما
                                  # يمرّ عليهما معاً.
                                  lateral=max(wtol.get("lateral", 0), raw["lateral"] * word_size),
                                  back=max(wtol.get("back", 0), raw["back"] * word_size),
                                  head=old["head"], floor=old["step"])
            # 🔴 **وحجمُ الكلمة ٦٠٪ واللوحُ على حاله** (أمر المالك ٢٥ أغسطس ٢٠٢٦:
            # «حجمُ الكلمات كبير — ليصبح تقريباً ٦٠٪ على مستوى التطبيق»): تُصغَّر
            # **الكتابةُ** عن خطّ أساسها وعن وسط لوحها، **ويبقى الصندوقُ كما كان** —
            # ولو صُغِّر معها لَعادت كما هي (اللوحُ يملأ صندوقَ مادّته فيكبّرها).
            words[u["text"]] = {"box": [box_w, WCELL], "line": WLINE,
                                # 🔴 **والسماحةُ تتبع مقياسَ المادّة** (قاعدةُ
                                # المشروع: الحدُّ العامل يُضرب في مقياس مادّته):
                                # لمّا صغُرت الكتابةُ إلى نسبة المالك صغُرت معها
                                # المسافاتُ — فسماحةُ بدايةٍ ثابتةٌ تخلط مبدأَ
                                # الجسم بنقطته (قِيس في «تمر»: ١١٣ دون ١٢٠).
                                # **وجسمُ طبقة الفونت وعرضُ قلمها مقيسان** — تقرؤهما
                                # الشاشةُ فتنطبق الطبقةُ على الحبر ولا يُكتب رقمٌ.
                                "em": r1(1000 * scale * word_size),
                                "ink": r1(font_pen),
                                # 🔴 **وحبرُ الطفل يُقاس من قلم الفونت لا من اللوح**
                                # (بلاغ المالك ٢٦ أغسطس: «الحبرُ كبير»): كان اللوحُ
                                # يثبّت سماكةَ الحبر **بالبكسل** (`--ink-scale`)، فلمّا
                                # صغُرت المادّةُ ضربَها ٢٫١٢٥ ولم يمسّ الفونت — فصار
                                # الحبرُ ٢٢٪ من ألف الكلمة والفونتُ ١٦٪. ⇐ يُصدَّر
                                # هنا **بوحدات المادّة**، وتقرؤه الشاشةُ كما هو.
                                "pen": r1(child_pen),
                                # **والسماحةُ تُصدَّر بدقّتها لا مقرَّبةً** (عطبٌ
                                # وقع: صُدِّرت ٠٫٥ وحُسب بـ٠٫٤٦٥ فاختلف حدُّ
                                # الفاحص عن حدِّ العدّة بثلاث وحدات).
                                "tolerance": round(word_size, 4),
                                "strokes": st, "dots": dots}
    folds = (sum(len(st.get("folds") or []) for forms in letters.values()
                 for ref in forms.values() for st in ref["strokes"])
             + sum(len(st.get("folds") or []) for ref in words.values()
                   for st in ref["strokes"]))
    raw = sum(len(st.get("folds") or []) for u in units for st in u["strokes"])
    print(f"حُوّلت: حروفٌ {sum(len(v) for v in letters.values())} شكلاً · "
          f"وحداتُ نسخٍ {len(words)} · طيّاتٌ معلنة {folds} من {raw} "
          f"(وما دون سماحة الارتداد يسقط)")
    out = {"letters": letters, "words": words, "scale": scale, "unit": old["alef"]}
    (TOOLS / "swap_material.json").write_text(json.dumps(out, ensure_ascii=False))
    print("كُتب الوسيطُ tools/swap_material.json — والكتابةُ في app/js بخطوةٍ تالية")
    return 0




def source_line(name, data, kept, refs, stamps=None):
    """**نسبُ الوحدة المولَّدة** — من أيّ طبقتين بُنيت وببصمتهما.

    ويحمل **وحدةَ السطر** (`line.unit` — ارتفاعُ الألف في فضاء التطبيق) لأنّ
    `check_paths` يقرأ منها فرجةَ النقطة: **الوحدةُ تُقرأ من الملفّ المولَّد لا
    تُكتب رقماً** — ولو غابت طالب الفاحصُ من نفسه ولم يمرّ صامتاً.
    """
    hand = json.loads(HAND.read_text(encoding="utf-8"))
    strokes = sum(len(ref["strokes"]) for ref in refs)
    folds = sum(len(st.get("folds") or []) for ref in refs for st in ref["strokes"])
    meta = {
        "tool": "tools/swap_material.py",
        "shape": {"layer": "tools/font_layer.json", "sha": hand["stamp"],
                  "font": "NotoNaskhArabic — نسخٌ مدرسيّ (ق٢)"},
        "hand": {"layer": "tools/hand_layer.json", "units": hand["counts"],
                 "strokes": strokes, "folds": folds},
        "scale": round(data["scale"], 4),
        "line": {"unit": r1(data["unit"]), "base": LINE, "cell": CELL},
        "kept": kept,
        **(stamps or {}),
        "why": "كلُّ ما هو مكتوبٌ من الفونت (مرسومُ ٢٤ أغسطس ٢٠٢٦)، والكيفيةُ من"
               " قواعد المالك (٢٥ أغسطس): ضربةٌ لكلِّ جسمِ حبر، واليدُ ترجع على أثرها"
               " — **والرجوعُ يُعلَن طيّةً** (`folds`) فيقرؤه المحرّكُ مشياً لا انعكاساً.",
    }
    return f"export const {name} = " + json.dumps(meta, ensure_ascii=False) + ";\n"


def emit():
    """يكتب `app/js/paths.js` و`word_paths.js` من الوسيط — بدمجٍ يحفظ ما لم يُحصَد."""
    data = json.loads((TOOLS / "swap_material.json").read_text(encoding="utf-8"))
    src = """
    import { PATHS } from 'BASE/paths.js';
    import { WORD_PATHS } from 'BASE/word_paths.js';
    console.log(JSON.stringify({ p: PATHS, w: Object.keys(WORD_PATHS) }));
    """
    base = base_copy()
    src = src.replace("BASE", base.as_posix())
    base = base_copy()
    src = src.replace("BASE", base.as_posix())
    r = subprocess.run(["node", "--input-type=module", "-e", src],
                       capture_output=True, text=True, cwd=ROOT)
    old = json.loads(r.stdout)
    kept = 0
    letters = data["letters"]
    for ch, forms in old["p"].items():
        for form, ref in forms.items():
            if letters.get(ch, {}).get(form):
                continue
            letters.setdefault(ch, {})[form] = ref
            kept += 1
    bare_re = re.compile(r"[ً-ْٰ]")
    words = {}
    for key in old["w"]:
        naked = bare_re.sub("", key)
        ref = data["words"].get(naked)
        if ref:
            words[key] = ref
    head_p = (
        "// **المساراتُ المرجعية** لحروف «اُكْتُبْ» — 🔴 **مولَّدةٌ من الفونت وطبقة\n"
        "// الكيفية** (مرسوما ٢٤–٢٥ أغسطس ٢٠٢٦): الشكلُ من تشكيل محرّك الخطّ للنصّ\n"
        "// كاملاً (`tools/font_layer.json`)، والضرباتُ والمبادئ من `hand_layer.json`\n"
        "// — ضربةٌ لكلِّ جسمِ حبر، واليدُ ترجع على أثرها، وفاتحُ الكلام يبدأ من رأسه.\n"
        "//\n"
        "// ⚠ **ملفٌّ مولَّد — لا يُحرَّر بيد**:\n"
        "//   python3 tools/hand_layer.py --build && python3 tools/swap_material.py --write\n"
        "//\n"
        f"// **وما لم يُحصَد بعدُ يبقى من البناء السابق**: الأرقامُ والمتغيّرات ({kept} شكلاً).\n\n"
        "export const PATHS = {\n")
    body = []
    for ch, forms in letters.items():
        inner = [f'   "{form}": {{\n' + js_ref(ref, 4) + "\n   }"
                 for form, ref in forms.items()]
        body.append(f'  "{ch}": {{\n' + ",\n".join(inner) + "\n  }")
    PATHS.write_text(head_p + ",\n".join(body) + "\n};\n\n"
                     + source_line("PATHS_SOURCE", data, kept,
                                   [r for f in letters.values() for r in f.values()]),
                     encoding="utf-8")
    head_w = (
        "// **مساراتُ النسخ** — 🔴 **مولَّدةٌ من الفونت وطبقة الكيفية**: الكلمةُ والجملةُ\n"
        "// تُشكَّلان دفعةً واحدةً بمحرّك الخطّ ثم يُستخرج هيكلُهما، والضرباتُ أدناها.\n"
        "//\n"
        "// ⚠ **ملفٌّ مولَّد — لا يُحرَّر بيد**:\n"
        "//   python3 tools/hand_layer.py --build && python3 tools/swap_material.py --write\n\n"
        "export const WORD_PATHS = {\n")
    wbody = [f'  "{key}": {{\n' + js_ref(ref, 3) + "\n  }" for key, ref in words.items()]
    # **وشاراتُ العلامات تُنقَل كما هي**: `MARK_PATHS` بطاقاتُ تعريفٍ لا مادّةَ كتابة
    # (لا تشكيلَ في اكتب)، فلا يمسّها تبديلُ المادّة — ويُنقَل نصُّها من البناء السابق.
    prev = subprocess.run(["git", "show", "HEAD:app/js/word_paths.js"],
                          capture_output=True, text=True, cwd=ROOT).stdout
    cut = prev.find("export const MARK_PATHS")
    end = prev.find("\n};", cut) + 3 if cut >= 0 else -1
    marks = ("\n\n" + prev[cut:end] + "\n") if cut >= 0 and end > cut else ""
    # **وبصمتا المنهج والكتلة تُصدَّران** (عهدُ «لا تُمَسّ الوحدةُ بيد بعد بنائها»):
    # الأولى تحمرّ يومَ تتبدّل كلمةٌ تُنسَخ بلا إعادة بناء، والثانيةُ يومَ يُحرَّر
    # الملفُّ بيد. وتُحسبان بدالّتي `make_paths` نفسِها لا بنسخةٍ ثانية.
    sys.path.insert(0, str(TOOLS))
    import make_paths as mp  # noqa: E402
    block = "export const WORD_PATHS = {\n" + ",\n".join(wbody) + "\n};"
    stamps = {"curriculum": mp.material_sha(), "body": mp.body_sha(block)}
    WORDS.write_text(head_w + ",\n".join(wbody) + "\n};\n\n"
                     + source_line("WORD_PATHS_SOURCE", data, 0, list(words.values()), stamps)
                     + marks, encoding="utf-8")
    print(f"كُتب: paths.js ({sum(len(v) for v in letters.values())} شكلاً، منها {kept} من القديم)"
          f" · word_paths.js ({len(words)} مدخلاً)")
    return 0


if __name__ == "__main__":
    if "--write" in sys.argv:
        main()
        sys.exit(emit())
    sys.exit(main())
