#!/usr/bin/env python3
"""**طبقةُ المالك** — من أثر يده إلى مسارٍ يقبله المحرّك (بند الجلسة ص٦).

    python3 tools/owner_layer.py --panel      # لوحةُ الفرق شكلاً شكلاً
    python3 tools/owner_layer.py --tune       # جدولُ رشّات التنقيح المقيس (لِمَ أربع)
    python3 tools/owner_layer.py --self-test  # عهدُ الطبقة بلا متصفّح

`tools/owner_shapes.json` مادّةٌ خامّ: **١٢٢ شكلاً بخطّ يد المالك** كتبها في المِرسمة
(`tools/owner_board.py`) فوق خيالنا الخافت، مختومةً `origin: owner` بتاريخها. وهذه
الوحدةُ تُخرج منها **طبقةً بصيغة المحرّك** (`METHOD.md §٣.١`) يبني منها
`make_paths.py --build` وحدةَ `paths.js` — **ولا إحداثيّ يُكتب هنا بيد**: كلُّ رقمٍ
إمّا من أثره أو من الخيال المبنيّ، وكلاهما مصدرٌ مُعلَن.

## أوامرُ المالك الأربعة (١٨ أغسطس ٢٠٢٦) — وموضعُ كلٍّ منها هنا

١) **«اعتمد ما بعثته بعد التنقيح وإزالة الرجفان أو الانحرافات البسيطة»** ⇐ `refine`:
   **تكثيفٌ ثم تنعيمُ توبين ثم عيّناتٌ منتظمة بخطوة المحرّك**. وتوبين لا الوسطُ
   المتحرّك لأنّ الثاني **ينكمش**: يقصّ أسنانَ السين والشين وهي رسمُ يدٍ لا رجفة —
   وتوبين يزيل الرعشةَ ويردّ الانكماش برشّةٍ موجبةٍ ثم سالبة. **وبُعدُ كلِّ شكلٍ عن
   أثره يُقاس بمقياس المِرسمة نفسِه** (كلُّ نقطةٍ من أثره إلى المسار المعتمَد) ويُجمَع
   إلى ما أزاحه التطبيعُ قبلَه (`norm.max`) — **فالمجموعُ هو البُعدُ عن يده**، وحدُّه
   سماحةُ المحرّك (`lateral`)، وما جاوزه **يُبلَّغ ولا يُعتمَد صامتاً**.

٢) **«أيُّ مكرَّرٍ جد الأفضل واعتمده»** ⇐ `twins`: الحروفُ التي لا تتصل بما بعدها
   يخرج شكلان من أشكالها الأربعة سواءً في يده. **والأفضلُ مقيسٌ ثلاثيّ**: أقلُّ رجفةً
   (`jitter`) · أقربُ إلى نِسَب الكرّاسة (`fit`: صندوقُه إلى صندوق الخيال المبنيّ من
   خطّ النسخ، وهو خطّا الأساس والقمّة بعينهما) · وأشدُّ اطّراداً مع أسرته (`kinship`:
   بُعدُه عن أشكال حرفه الأخرى). **ورتبةُ الثلاثة مجموعةً هي الحكم** — لا ذوق.

٣) **«كيفيةُ كتابة النقاط: اعتمد واحدة»** ⇐ `order_dots`: **من اليمين إلى اليسار**،
   وما استوى في يمينه فمن أعلاه — موافقةً لاتجاه الكتابة ولقاعدته العامّة «يُبدأ من
   أعلى الشكل ومن يمينه». يحرسه `tools/test_direction.mjs`.

٤) **الستُّ التي جردتها الإدارة** ⇐ `fix_dots`، **بقاعدةٍ واحدة لا ستِّ استثناءات**:
   عددُ مواضع النقط **جدولُ الحقيقة الإملائية** (`check_paths.DOTS_OF`) لا ما وقع في
   يده. فما زاد على الحقيقة سقط (نقرةٌ في `٦` وفي `ط/نهائي` و`ر/وسطي` ونقرتان في
   `ر/نهائي` — أثرُ إصبعٍ لا نقطةُ إعجام)، وما نقص عنها **يُؤخذ من الخيال بموضعه
   المقيس ويُعلَن** (`خ/وسطي` بلا نقطةٍ والمطلوب واحدة — **حكمُ المالك: تُوضع من
   الجدول ولا يُعاد الرسم**). و`٠` بلا ضربةٍ ومعه نقرةٌ **صحيحٌ بحكمه** فلا يُمَسّ.

## وما لم يصل منه يبقى على خيالنا بعلّةٍ معلنة

`layer()` تُخرج معه جردَ ما لم يُعتمَد وعلّتَه — يقرؤه `make_paths.py` فيكتبه في نسب
الوحدة، فلا يُظَنّ يوماً أنّ شكلاً من يده وهو من خيالنا.
"""

import argparse
import hashlib
import json
import math
import re
import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
SHAPES = TOOLS / "owner_shapes.json"
GHOST_FILE = TOOLS / "ghost_paths.json"
PATHS_JS = ROOT / "app" / "js" / "paths.js"
TOOL_PAGE = TOOLS / "make_paths.html"
FORMS = ["isolated", "initial", "medial", "final"]

sys.path.insert(0, str(TOOLS))
import check_paths  # noqa: E402  (سماحةُ المحرّك وجدولُ الحقيقة — من موضعٍ واحد)


# ————— رشّاتُ التنقيح: **معلَنةٌ ومقيسةٌ لا مذوقة** —————
#
# `--tune` يطبع الجدول الذي منه اختيرت: كلُّ رشّةٍ تُزيل من الرجفة وتُبعِد عن الأثر،
# **فالمختارُ أوّلُ عددٍ تنزل عنده ثمرةُ الرشّة التالية دون واحدٍ بالمئة من الرجفة**
# — وما بعده يشتري القليلَ بالكثير. **وثمرتُها هنا قليلةٌ أصلاً وذلك خبرٌ يُقال**:
# أثرُ يده خرج من المِرسمة **منعَّماً مرّةً** (رشّتان في `normalizeInk`)، فأكثرُ ما
# يبقى لهذه الطبقة **انتظامُ العيّنة** لا التنعيم — وهو وحدَه يُذهِب من الرجفة ستّاً
# في المئة (سطرُ الصفر في الجدول)، والرشّتان تزيدان ثلاثاً.
TAUBIN_PASSES = 2
TAUBIN_LAMBDA = 0.5
TAUBIN_MU = -0.53


def shapes() -> dict:
    return json.loads(SHAPES.read_text(encoding="utf-8"))


def sha() -> str:
    """بصمةُ ملفّ الأشكال — تُكتب في نسب الوحدة فيُعرف أنها بُنيت منه بعينه."""
    return hashlib.sha1(SHAPES.read_bytes()).hexdigest()[:12]


def tolerance() -> dict:
    return check_paths.load_tolerance()


def step_rule() -> tuple:
    """أرضيّةُ الخطوة ونصيبُها من السماحة — **مقروءةٌ من `stepFor` في العدّة**."""
    src = TOOL_PAGE.read_text(encoding="utf-8")
    rule = re.search(r"stepFor = \(len, scale = 1\) =>\s*"
                     r"Math\.max\(([\d.]+), Math\.min\([^,]+, len \* HEAD_RATIO\) \* ([\d.]+)\)", src)
    if not rule:
        sys.exit("لم تُقرأ قاعدةُ الخطوة (`stepFor`) من العدّة")
    return float(rule.group(1)), float(rule.group(2))


_GHOST = None


def ghost() -> dict:
    """**الخيالُ وحدَه** — مرجعُ النِّسَب وموضعُ النقطة الناقصة وملجأُ ما رُدّ.

    ويُقرأ من `tools/ghost_paths.json` (تكتبه عدّةُ البناء من حصيلة المتصفّح **قبل**
    أن تعلوَه طبقةُ المالك) لا من `paths.js`: **وإلّا دار المرجعُ على نفسه** — بناءٌ
    يعلو الخيالَ ثم يُقاس إليه فيقيس الشيءُ نفسَه، فتتبدّل أحكامُ المكرَّر من بناءٍ
    إلى بناء بلا سبب. وما دام الجردُ غائباً يُقرأ `paths.js` **ويُقال ذلك**.
    """
    global _GHOST
    if _GHOST is None:
        if GHOST_FILE.exists():
            _GHOST = json.loads(GHOST_FILE.read_text(encoding="utf-8")).get("paths", {})
        elif PATHS_JS.exists():
            body = re.search(r"export const PATHS = (\{.*?\n\});",
                             PATHS_JS.read_text(encoding="utf-8"), re.S)
            _GHOST = json.loads(body.group(1)) if body else {}
            print(f"  ○ لا جردَ للخيال في {GHOST_FILE.name} — قُرئ من {PATHS_JS.name}"
                  " (وفيه طبقةُ المالك، فالمقايسةُ إليه دورٌ يُعلَن)", file=sys.stderr)
        else:
            _GHOST = {}
    return _GHOST


def set_ghost(paths: dict) -> None:
    """يُثبَّت الخيالُ من حصيلة المتصفّح ساعةَ البناء — قبل أن تعلوَه الطبقة."""
    global _GHOST
    _GHOST = json.loads(json.dumps(paths))


# ————— هندسةٌ صغيرة: عينُ ما في العدّة، بلا قناعٍ ولا حبر —————

def prepare(points: list) -> list:
    out = [list(points[0])]
    for p in points[1:]:
        if math.dist(p, out[-1]) > 1e-9:
            out.append(list(p))
    return out


def poly_len(points: list) -> float:
    return sum(math.dist(points[i - 1], points[i]) for i in range(1, len(points)))


def walk(points: list, step: float, round_to: int = None) -> list:
    """عيّناتٌ منتظمة بخطوةٍ معطاة — `resample` العدّة بعينها حين تُعطى خطوتُها."""
    poly = prepare(points)
    if len(poly) < 2:
        return [list(points[0]), list(points[-1])]
    cum = [0.0]
    for i in range(1, len(poly)):
        cum.append(cum[-1] + math.dist(poly[i - 1], poly[i]))
    total = cum[-1]
    count = max(2, math.ceil(total / step))
    out = []
    for i in range(count + 1):
        target = total * i / count
        k = 1
        while k < len(cum) - 1 and cum[k] < target:
            k += 1
        span = cum[k] - cum[k - 1] or 1.0
        t = (target - cum[k - 1]) / span
        a, b = poly[k - 1], poly[k]
        p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
        out.append([round(p[0], round_to), round(p[1], round_to)] if round_to is not None else p)
    return out


def resample(points: list, tol: dict) -> list:
    """خطوةُ المحرّك نفسُها (`stepFor`) وتقريبٌ إلى عُشر الوحدة — كما في العدّة."""
    floor, share = step_rule()
    length = poly_len(prepare(points))
    step = max(floor, min(tol["back"], length * tol["head_ratio"]) * share)
    return walk(points, step, round_to=1)


def taubin(points: list, passes: int = TAUBIN_PASSES) -> list:
    """تنعيمٌ **بلا انكماش**: رشّةٌ موجبة ثم سالبة — الرعشةُ تذهب والسنُّ يبقى."""
    out = [list(p) for p in points]

    def once(weight):
        return [out[i] if i in (0, len(out) - 1) else
                [out[i][0] + weight * ((out[i - 1][0] + out[i + 1][0]) / 2 - out[i][0]),
                 out[i][1] + weight * ((out[i - 1][1] + out[i + 1][1]) / 2 - out[i][1])]
                for i in range(len(out))]

    for _ in range(passes):
        out = once(TAUBIN_LAMBDA)
        out = once(TAUBIN_MU)
    return out


def seg_dist(p, a, b) -> float:
    vx, vy = b[0] - a[0], b[1] - a[1]
    l2 = vx * vx + vy * vy
    if not l2:
        return math.dist(p, a)
    t = max(0.0, min(1.0, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / l2))
    return math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy))


def poly_dist(p, poly) -> float:
    if len(poly) < 2:
        return math.dist(p, poly[0])
    return min(seg_dist(p, poly[i - 1], poly[i]) for i in range(1, len(poly)))


def apart(a: list, b: list) -> float:
    """أقصى بُعدٍ بين مسارين — كلُّ نقطةٍ من هذا إلى ذاك ومن ذاك إلى هذا."""
    return max(max(poly_dist(p, b) for p in a), max(poly_dist(p, a) for p in b))


def jitter(points: list) -> float:
    """**الرجفة**: كم يتبدّل انحناءُ المسار من عيّنةٍ إلى أختها — وسطاً على عيّناته.

    ويُقاس على المسار كما يقرؤه المحرّكُ ويمشيه الطفل (بخطوته المنتظمة)، لا على
    تكثيفٍ لا يراه أحد: منحنىً يتردّد يمنةً ويسرةً بين كلِّ عيّنتين رجفةٌ، ومنحنىً
    يدور دوراناً مطّرداً هادئ. **والمقياسُ واحدٌ لكلِّ ما يُقارَن به** (القرينان
    منقّحان بالرشّات نفسِها، فعددُ عيّناتهما من طولهما لا من هوىً).
    """
    poly = prepare(points)
    if len(poly) < 4:
        return 0.0
    heads = [math.atan2(poly[i][1] - poly[i - 1][1], poly[i][0] - poly[i - 1][0])
             for i in range(1, len(poly))]
    turns = []
    for i in range(1, len(heads)):
        a = heads[i] - heads[i - 1]
        while a > math.pi:
            a -= 2 * math.pi
        while a < -math.pi:
            a += 2 * math.pi
        turns.append(a)
    if len(turns) < 2:
        return 0.0
    return sum(abs(turns[i] - turns[i - 1]) for i in range(1, len(turns))) / (len(turns) - 1)


def refine(points: list, tol: dict, passes: int = TAUBIN_PASSES) -> list:
    """**التنقيح**: تكثيفٌ بأرضيّة الخطوة، ثم توبين، ثم خطوةُ المحرّك."""
    floor, _ = step_rule()
    if len(prepare(points)) < 2:
        return [[round(points[0][0], 1), round(points[0][1], 1)]]
    return resample(taubin(walk(points, floor), passes), tol)


def box_of(strokes: list, dots: list = ()) -> dict:
    pts = [p for s in strokes for p in s] + [list(d) for d in dots]
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return {"x0": min(xs), "x1": max(xs), "y0": min(ys), "y1": max(ys),
            "w": max(xs) - min(xs), "h": max(ys) - min(ys)}


# ————— المقيسُ الثلاثيّ للمكرَّر —————

def fit_error(strokes: list, ref: dict, grid: float) -> float:
    """بُعدُ نِسَب الشكل عن نِسَب الخيال المبنيّ: عرضاً وارتفاعاً وجلوساً ونزولاً.

    والخيالُ مرجعُ النِّسَب لأنّه مرسومٌ بخطّ النسخ المدرسيّ على خطّي الأساس والقمّة
    (`ق٢`) — فهو الكرّاسةُ نفسُها في صورة أرقام.
    """
    if not ref:
        return float("nan")
    mine = box_of(strokes)
    his = box_of([s["points"] for s in ref["strokes"]]) if ref.get("strokes") else None
    if not his:
        return float("nan")
    return (abs(mine["w"] - his["w"]) + abs(mine["h"] - his["h"])
            + abs(mine["y0"] - his["y0"]) + abs(mine["y1"] - his["y1"])) / grid


def gap_norm(a: list, b: list, grid: float) -> float:
    """**بُعدٌ مطبَّع بين شكلين**: أقصى بُعدٍ بين مسارَيهما منسوباً إلى **قُطر صندوقهما**.

    وإلى صندوقهما لا إلى قُطر الشبكة: الشكلان يُقاسان بحجمهما، فبُعدٌ عشرةَ وحداتٍ
    في ألفٍ صغيرةٍ ليس كبُعده في سينٍ عريضة. **وشرطُ تساوي الأجزاء قبلَه**: قرينان
    يفترقان في عدد أجزائهما ليسا مكرَّراً بل شكلين، ولو قُرِّبا لَضاع مدخلُ الوصل.

    **ورقمُ الإدارة في بند ص٦ أصغرُ من هذا بنحو الضعف** (`ا` وسطي≈نهائي ٠٫٠١١ عندها
    و٠٫٠٢٠ هنا) لأنّها نسبت إلى قُطر الشبكة — والحدُّ واحدٌ (٠٫٠٨) والأزواجُ التي
    خرجت من المقياسين واحدةٌ في جوهرها، **وما زاد فمقيسٌ مطبوعٌ لا مسكوتٌ عنه**.
    """
    if len(a) != len(b) or not a or not b:
        return float("inf")
    flat = [p for s in a for p in s] + [p for s in b for p in s]
    box = box_of([flat])
    diag = math.hypot(box["w"], box["h"]) or 1.0
    return max(apart(sa, sb) for sa, sb in zip(a, b)) / diag


def body_gap(a: list, b: list, grid: float) -> float:
    """بُعدُ جسمَي شكلين — أطولُ ضربةٍ من هذا إلى أطولِ ضربةٍ من ذاك.

    **ولا يشترط تساويَ الأجزاء**: أسرةٌ يزيد موصولُها ضربةَ وصلٍ أسرةٌ واحدة، فلو
    قيس الاطّرادُ بشرط التساوي لَخرجت أسرُ (ط ظ د ذ) بلا قياسٍ أصلاً.
    """
    if not a or not b:
        return float("inf")
    longest = lambda ss: max(ss, key=poly_len)  # noqa: E731
    one, two = longest(a), longest(b)
    box = box_of([one + two])
    return apart(one, two) / (math.hypot(box["w"], box["h"]) or 1.0)


def kinship(strokes: list, family: dict, skip: tuple, grid: float) -> float:
    """اطّرادُه مع أسرته: وسطُ بُعد جسمه عن أجسام أشكال حرفه الأخرى (خلا قرينه)."""
    others = [v["strokes"] for f, v in family.items() if f not in skip]
    gaps = [g for g in (body_gap(strokes, o, grid) for o in others) if math.isfinite(g)]
    return sum(gaps) / len(gaps) if gaps else float("nan")


TWIN_LIMIT = 0.08   # حدُّ «المتطابق تقريباً» — قياسُ الإدارة في بند ص٦ بعينه


def twin_groups(refined: dict, grid: float) -> list:
    """**زُمَرُ المكرَّر**: أشكالُ حرفٍ يقع بعضُها من بعضٍ دون الحدّ — تُقاس ولا تُسمّى بيد.

    **وزُمرةٌ لا زوجان**: الواوُ ثلاثةُ أزواجٍ متداخلة، فلو وُحِّد زوجاً زوجاً لَبقي
    أحدُ أشكالها على قرينٍ نُبذ — **فتُجمَع الأشكالُ المتّصلة في زُمرةٍ واحدة** ويُختار
    أفضلُها مرّةً، فيسري على كلِّ من في الزُّمرة.
    """
    groups = []
    for ch, family in refined.items():
        forms = [f for f in FORMS if f in family]
        near = {}
        for i in range(len(forms)):
            for j in range(i + 1, len(forms)):
                a, b = forms[i], forms[j]
                d = gap_norm(family[a]["strokes"], family[b]["strokes"], grid)
                if d < TWIN_LIMIT:
                    near[(a, b)] = d
        home = {f: f for f in forms}

        def root(f):
            while home[f] != f:
                f = home[f]
            return f

        for a, b in near:
            home[root(a)] = root(b)
        joined = {}
        for f in forms:
            joined.setdefault(root(f), []).append(f)
        for members in joined.values():
            if len(members) > 1:
                groups.append({"ch": ch, "forms": members,
                               "gaps": {f"{a}≈{b}": round(d, 3) for (a, b), d in near.items()
                                        if a in members and b in members}})
    return groups


def choose(ch: str, group: dict, refined: dict, marks: dict, grid: float) -> dict:
    """الأفضلُ من زُمرةٍ — **برتبة المقاييس الثلاثة مجموعةً**، وعلّتُه مطبوعة."""
    family = refined[ch]
    members = group["forms"]
    scored = {}
    for form in members:
        strokes = family[form]["strokes"]
        scored[form] = {
            "jitter": marks[f"{ch}/{form}"]["jitter"],
            "fit": fit_error(strokes, (ghost().get(ch) or {}).get(form), grid),
            "kin": kinship(strokes, family, tuple(members), grid),
        }
    ranks = {form: 0 for form in members}
    detail = {}
    unmeasured = []
    for key in ("jitter", "fit", "kin"):
        values = {f: v[key] for f, v in scored.items()}
        detail[key] = values
        # **ومقياسٌ لا يُقاس لا يُرجِّح**: زُمرةٌ ابتلعت أشكالَ حرفها الأربعة لا أسرةَ
        # لها تُقاس بها، فلو رُتِّبت على «لا شيء» لَحكم ترتيبُ الإدخال — وذلك ذوق.
        if all(math.isnan(v) for v in values.values()):
            unmeasured.append(key)
            continue
        order = sorted(values, key=lambda f: (math.inf if math.isnan(values[f]) else values[f]))
        for place, form in enumerate(order):
            ranks[form] += place
    best = min(members, key=lambda f: (ranks[f], detail["fit"][f]))
    return {"best": best, "scores": scored, "ranks": ranks, "unmeasured": unmeasured}


# ————— النقاطُ: حقيقةً وترتيباً —————

def order_dots(dots: list) -> list:
    """**من اليمين إلى اليسار**، وما استوى فمن أعلاه — قاعدةُ المالك، واحدةً للجميع."""
    return sorted(dots, key=lambda d: (-round(d[0], 1), round(d[1], 1)))


def fix_dots(ch: str, form: str, dots: list, ref: dict) -> tuple:
    """عددُ المواضع **من جدول الحقيقة الإملائية** لا ممّا وقع في اليد — وعلّةُ كلِّ تبديل."""
    want = check_paths.DOTS_OF.get(ch, 0)
    notes = []
    kept = list(dots)
    if len(kept) > want:
        if want == 0:
            notes.append(f"سقطت {len(kept)} نقرةً زائدة — والحقيقةُ الإملائية بلا نقطة")
            kept = []
        else:
            # يُبقى أقربُ النقرات إلى مواضع الخيال، ويسقط ما لا موضعَ له
            his = [d["at"] for d in (ref or {}).get("dots", [])]
            kept = sorted(kept, key=lambda p: min((math.dist(p, h) for h in his), default=0.0))[:want]
            notes.append(f"سقطت {len(dots) - want} نقرةً زائدة على الحقيقة الإملائية ({want})")
    if len(kept) < want:
        his = [d["at"] for d in (ref or {}).get("dots", [])]
        for at in his[:want - len(kept)]:
            kept.append([float(at[0]), float(at[1])])
        notes.append(f"نقصت عن الحقيقة الإملائية ({want}) — **أُخذت من الخيال بموضعها المقيس**"
                     " ولم يُعَد الرسمُ (حكمُ المالك ١٨ أغسطس ٢٠٢٦)")
    return order_dots(kept), notes


# ————— **الطيّةُ في أثر اليد**: انطباقُه على نفسه يُعلَن بقياس (بند ص٧) —————
#
# الطيّةُ صفةٌ في القطعة تقول «**مكانٌ واحد يحمل طولين**» (`METHOD.md §٣.١`)، وبها
# يقسم المحرّكُ المسارَ فلا يُقرأ العودُ ارتداداً. وفي الخيال تُقرأ من **مفرق الهيكل**
# (`walkGesture` في العدّة: شوكةٌ يمشيها القلمُ ذهاباً وإياباً) — **ويدُ المالك لا تمرّ
# بالهيكل أصلاً**: يكتب فوق الخيال حرّاً، فرأسُ الجيم وبطنُ العين وسنُّ الشين تعود على
# نفسها **بلا إعلانٍ يقولها**. فيقف الطفلُ على شكلٍ يردّه المحرّكُ `reverse` على أدنى
# رجفة (سبعةُ أشكالٍ احتملت **صفراً** من عهد `child-drift`).
#
# **والعلاجُ عندنا نظيرُه مقيسٌ**: في «توسعة الكلمة» أُعلن انطباقُ الحبر طيّةً بقياسٍ
# آليّ (`make_paths.html: overlapFolds` — حكمُ المدير ١٣ أغسطس ٢٠٢٦). فهو بعينه يُنقَل
# إلى أثر اليد، **ولا عتبةَ تُختار**: العتبتان سماحتا المحرّك نفسُه —
#   · **مكاناً**: شقّان أقربُ من `lateral` لا يفرّق المحرّكُ بينهما — وهو بعينه ما
#     يجعل الإعلانَ لازماً (وهو عينُ ما يفحصه `check_paths.check_folds`).
#   · **وطولاً**: بينهما فوق `back × ٢` من طول المسار — فما دونها **جوارُ القلم لنفسه**
#     (يعرفه المحرّكُ موضعاً واحداً أصلاً) لا زيارةٌ ثانية.
#   · **وضلعٌ يقيسه المحرّك**: كلُّ ضلعٍ فوق `back`، وإلّا ابتلعه سماحُ بلوغ القمّة.
# **وبلا قناع حبر**: الحرفُ يملأ صندوقَه فسماحاتُ المحرّك على مقياسه (`scale = ١`)،
# وليس في طبقة اليد حبرُ كلمةٍ يُقاس عرضُه — فالحدُّ سماحةُ الانحراف بحرفها.

def self_folds(points: list, tol: dict, near: float = None, notes: list = None,
               far: float = None, fork: float = None) -> list:
    """طيّاتُ قطعةٍ من انطباقها على نفسها — `{from, apex, to}` بأرقام نقاطها.

    **والكشفُ على المسار مكثَّفاً ثم تُردّ أرقامُه إلى نقاطه**: خطوةُ المحرّك تترك
    في سنّةِ الشين نقطتين أو ثلاثاً، فيسقط العناقُ لِقلّة العيّنة لا لانفكاك الحبر
    (قِيست ش/وسطي: مقابلٌ واحدٌ لا غير). فيُكثَّف بأرضيّة الخطوة — **كما يُكثَّف
    للتنقيح** (`refine`) — ويُقاس عليه، ثم يُرَدّ كلُّ رقمٍ إلى أقرب نقطةٍ في الطول
    (نظيرُ `resampleStroke` في العدّة: الطيّةُ تُحمَل أطوالاً لا أرقامَ عيّنات).

    **و`far`/`fork` مقبضا قياسٍ لا معايرة** (جلسة ص٨): نافذتا المشيتين تُمرَّران
    لتُجرَّب النافذةُ **ونقيضُها** فيَبين أثرُها مقيساً — وقيمتاهما في التشغيل
    `back × ٢` و`back` من `pen.js` نفسِه، لا رقمين مكتوبين هنا.
    """
    poly = [list(p) for p in points]
    if len(poly) < 4:
        return []
    cum = [0.0]
    for i in range(1, len(poly)):
        cum.append(cum[-1] + math.dist(poly[i - 1], poly[i]))
    # ————— **نافذتان لا واحدة — والثانيةُ للشوكة القصيرة** (جلسة ص٨) —————
    #
    # النافذةُ الأولى `back × ٢` (١٤٠) عهدُها قائم: **تباعدٌ في الطول دونه جوارُ
    # القلم لنفسه**. غير أنّها **تُعمي عن الشوكة القصيرة**: سنٌّ ضلعاها ٧٠–١٤٠،
    # فمقابلُ نقاطها على ١٤٠ يقع فيما قبلها وما بعدها لا على ضلعها (قِيست ت/وسطي:
    # صعودُها ١٠١ ونزولُها ٧٧) — **وهي مع ذلك موضعٌ واحد بطولين** يرتدّ عليه مؤشّرُ
    # التقدّم، فتُقرأ كتابةُ الطفل الصحيحة `reverse`.
    #
    # **والنافذةُ الثانية `back` (٧٠) — رقمُ `pen.js` بعينه لا رقمٌ مختار**: هي
    # المسافةُ التي يسلّم عندها المحرّكُ نفسُه من ضلع الطيّة الصاعد إلى النازل
    # (`pen.js`: `stroke.reach >= fold.apex - tol.back`) — **فما رآه المحرّكُ جوارَ
    # قمّةٍ تُعبَر لا يجوز أن يُعمى عنه الكاشف**. وما دونها يبتلعه سماحُ الارتداد
    # نفسُه فلا يحتاج إعلاناً أصلاً (وهو عينُ ما تحرسه `keeps` أدناه: ضلعٌ دون
    # `back` لا طيّةَ له).
    #
    # **والثانيةُ تابعةٌ لا بديل**: تُمشى بعد الأولى، وما تقاطع مع طيّةٍ أولى سقط —
    # فلا تُزحزح الأولى عن موضعها، ولا تُبدَّل تسعٌ وأربعون طيّةً قائمةً بسواها.
    far = tol["back"] * 2 if far is None else far   # تباعدٌ في الطول
    fork = tol["back"] if fork is None else fork    # نافذةُ الشوكة — سماحةُ الارتداد
    near = tol["lateral"] if near is None else near
    floor, _ = step_rule()
    fine = walk(poly, floor)
    grain = [0.0]
    for i in range(1, len(fine)):
        grain.append(grain[-1] + math.dist(fine[i - 1], fine[i]))

    def mates(window: float) -> list:
        """مقابلُ كلِّ نقطةٍ في نافذةِ تباعدٍ مُعطاة — أقربُ حبرٍ يزورها ثانيةً."""
        found = [-1] * len(fine)
        for i in range(len(fine)):
            gap = near
            for j in range(i + 1, len(fine)):
                if grain[j] - grain[i] < window:
                    continue
                d = math.dist(fine[i], fine[j])
                if d < gap:
                    gap, found[i] = d, j
        return found

    out, run, span, found = [], None, far, None

    def tip(lo: int, hi: int) -> int:
        """**رأسُ الشوكة**: أبعدُ نقاطها عن الوتر الواصل بين طرفيها.

        وهو موضعُ الانعطاف الذي يقسم عليه المحرّكُ المسارَ — **يُقرأ من الشكل لا
        من ترتيب العيّنات**: منتصفُ الأرقام يقع في رأسٍ حين يستوي الضلعان، ويزيغ
        عنه حين يطول أحدُهما (ويدُ إنسانٍ لا تستوي)، فتُقاس الطيّةُ من رأسٍ ليس
        رأسَها فلا يبلغه الطفلُ — وهو عينُ ما ردّ «الأثرَ الرطبَ» في خ/نهائي.
        """
        a, b = fine[lo], fine[hi]
        return max(range(lo + 1, hi), key=lambda k: seg_dist(fine[k], a, b))

    def hairpin(top: int) -> tuple:
        """**حدُّ الطيّة حيث يفترق الضلعان**: تُمَدّ من رأسها إلى خارجٍ في الضلعين
        معاً ما داما في حبرٍ واحد، فإذا افترقا وقفت.

        **ولِمَ لا طرفا العناق؟** لأنّ العناقَ إنما يُلتقَط بعد `back × ٢` من الطول
        (نافذةُ المحرّك)، فيقع طرفاه **في ما قبل الشوكة وما بعدها**: سنّةُ الشين
        تخرج ضلعاها «سطرٌ + صعود» و«نزولٌ + سطر» — **فتكذب المرآة** التي يقرؤها
        `pen.js` من الشكل (`mirror`)، ويُقرأ نزولُ الطفل على أثره الرطب ارتداداً.
        فتُمَدّ من الرأس **متناظرةً** كما تُبنى طيّةُ الخيال (ضلعان مُزاحان عن مفرقٍ
        واحد) — فتصدق المرآةُ ويُقبَل ما هو صواب.
        """
        k = 1
        while (top - k >= 0 and top + k < len(fine)
               and math.dist(fine[top - k], fine[top + k]) < near):
            k += 1
        k -= 1
        return grain[top - k], grain[top], grain[top + k]

    def close():
        nonlocal run
        # **والشوكةُ تُقابِل ولا تُوازي**: مَن مضى في ضلعها الصاعد رجع في النازل —
        # فمقابلُ النقطة يتقهقر كلّما تقدّمت أو يثبت (`dir ≤ 0`). **وحلقةُ الهاء
        # والواو والميم تُوازي**: مقابلُ النقطة على الجهة الأخرى يتقدّم بتقدّمها،
        # فهي **موضعان في حلقةٍ** لا موضعٌ واحدٌ بطولين — ولو تقاربا في المكان.
        # (وانطباقُ الكلمة يقبل الموازيَ لأنّ حبرَ الوصل يُمشى مرّتين في اتجاهٍ
        # واحد بينهما نزهةٌ في حرفٍ آخر — وذلك لا يقع في حرفٍ مفرد.)
        if run and run["n"] >= 2 and run["dir"] <= 0:
            lo = run["i1"]
            hi = max(run["j1"], run["j2"])
            mid = min(run["j1"], run["j2"])
            apex = round((run["i2"] + mid) / 2)   # وسطُ ما لم يُعانَق — موضعُ الرأس
            # **ووسطُ الطيّة لا يزيد على نافذة المحرّك**: ما بين آخرِ مُعانَقةٍ
            # صاعدةً وأوّلِ مُعانَقةٍ نازلةً **إنما بقي بلا عناقٍ لأنّ القاعدةَ نفسَها
            # تمنعه** (تباعدٌ في الطول دون `back × ٢` جوارُ القلم لنفسه) — فإن جاوزه
            # فبينهما **نزهةٌ حقيقية**: حلقةُ العين أو جسمُ الطاء يعود على مبدئه، وتلك
            # موضعان في حلقةٍ لا موضعٌ واحدٌ بطولين. **ولا رقمَ يُختار**: النافذةُ
            # نافذةُ المحرّك وزيادتُها خطوةُ التكثيف — وهي دقّةُ القياس نفسُها.
            gap = grain[mid] - grain[run["i2"]]
            if lo < apex < hi and gap <= span + floor:
                found.append(hairpin(tip(lo, hi)))
            elif notes is not None:
                notes.append(f"عناقٌ طولُ وسطه {gap:.0f} فوق نافذة المشية"
                             f" ({span + floor:.0f}) — نزهةٌ بين شقّيه لا طيّة")
        elif run and notes is not None and run["n"] >= 2:
            notes.append("عناقٌ مُوازٍ (مقابلُه يتقدّم بتقدّمه) — حلقةٌ لا شوكة")
        run = None

    def sweep(window: float) -> list:
        """مشيةٌ كاملة بنافذةِ تباعدٍ واحدة — تُعيد أوتارَ ما وجدته من شوكاتٍ.

        **والنافذةُ صفةُ المشية لا صفةُ الملفّ**: قاعدةُ «وسطُ الطيّة لا يزيد على
        النافذة» تُقاس بنافذة مشيتها هي — فلا تُقاس شوكةُ السبعين بنافذة المئة
        والأربعين ولا العكس.
        """
        nonlocal run, span, found
        run, span, found = None, window, []
        for i, j in enumerate(mates(window)):
            if j < 0:
                close()
                continue
            if (run and i == run["i2"] + 1 and abs(j - run["j2"]) <= 2
                    and (run["dir"] == 0 or j == run["j2"]
                         or (j > run["j2"]) == (run["dir"] > 0))):
                if run["dir"] == 0 and j != run["j2"]:
                    run["dir"] = 1 if j > run["j2"] else -1
                run.update(i2=i, j2=j, n=run["n"] + 1)
            else:
                close()
                run = {"i1": i, "i2": i, "j1": j, "j2": j, "n": 1, "dir": 0}
        close()
        return found

    out = sweep(far)
    # **ثم الشوكةُ القصيرة بنافذتها** — تابعةً لا بديلاً، وما تقاطع مع أولى سقط.
    forks = sweep(fork) if fork < far else []

    def at(length: float) -> int:
        """أقربُ نقطةٍ من نقاط القطعة إلى هذا الطول — ردُّ الرقم إلى موضعه."""
        return min(range(len(cum)), key=lambda k: abs(cum[k] - length))

    # **وضلعٌ يقيسه المحرّك**: يُفحَص على نقاط القطعة بأعيانها — فهي التي يفحصها
    # `check_paths` ويمشيها المحرّك، لا على تكثيفٍ لا يراه أحد.
    def keeps(fold: dict) -> bool:
        a, mid, b = fold["from"], fold["apex"], fold["to"]
        up = poly[a:mid + 1]
        down = poly[mid:b + 1]
        if len(up) < 2 or len(down) < 2:
            return False
        # **وضلعٌ يقيسه المحرّك**: أقصرُ من سماحة الارتداد يبتلعه سماحُ بلوغ القمّة
        if min(poly_len(up), poly_len(down)) < tol["back"]:
            if notes is not None:
                notes.append(f"ضلعٌ طولُه {min(poly_len(up), poly_len(down)):.0f}"
                             f" دون سماحة الارتداد ({tol['back']:.0f})")
            return False
        # **ولا يُقترح على الفاحص ما يردّه** (عثرةُ ص٨ مقيسة): طيّةٌ يرفضها
        # `check_paths.check_folds` **تُسقِط الشكلَ كلَّه إلى الخيال** — فيُفقد أثرُ
        # يد المالك في شكلٍ صحيحٍ بسبب صفةٍ زائدة (وقع في `ش/ابتدائي`: ضلعاها على
        # ١٠٦ ≥ سماحة الانحراف ٩٠، فنزل الشكلُ من يده إلى الخيال). **فيُمتحن هنا
        # بمقياس الفاحص بعينه** — لا بنظيرٍ له — فما لا يقبله لا يُدَّعى، ويبقى
        # الشكلُ على يده بلا طيّة: **صفةٌ تُترك خيرٌ من يدٍ تُمحى**.
        if check_paths.check_folds(
                {"points": poly, "folds": [fold]}, "طيّة", tol):
            if notes is not None:
                notes.append("طيّةٌ يردّها الفاحصُ — تُترك ولا يُدفَع بها")
            return False
        return True

    kept = []
    for lo, mid, hi in sorted(out) + sorted(forks):
        fold = {"from": at(lo), "apex": at(mid), "to": at(hi)}
        if not (fold["from"] < fold["apex"] < fold["to"]):
            continue
        if any(fold["from"] <= f["to"] and f["from"] <= fold["to"] for f in kept):
            continue
        if not keeps(fold):
            continue
        kept.append(fold)
    return kept


# ————— الطبقة —————

def snap_in(strokes: list, dots: list, grid: float) -> tuple:
    """**ما خرج من الشبكة يُردّ إليها بإزاحةٍ صلبة** — موضعٌ يتبدّل لا شكل.

    أثرُ يده يخرج من حافّة اللوح في شكلين (`ي/وسطي` و`ج/ابتدائي`) بضع وحدات، والحدُّ
    حدُّ الشبكة لا حدُّ الرسم. **والإزاحةُ لا تمسّ هيئتَه** (لا مقياسَ ولا دوران)،
    وتُحسب أقلَّ ما يُدخِله، وتُضاف إلى بُعده عن أثره فتُقاس وتُعلَن كسائره.
    """
    pts = [p for s in strokes for p in s] + list(dots)
    if not pts:
        return strokes, dots, 0.0
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    dx = max(0.0, -min(xs)) - max(0.0, max(xs) - grid)
    dy = max(0.0, -min(ys)) - max(0.0, max(ys) - grid)
    if not dx and not dy:
        return strokes, dots, 0.0
    move = lambda p: [round(p[0] + dx, 1), round(p[1] + dy, 1)]  # noqa: E731
    return ([[move(p) for p in s] for s in strokes], [move(d) for d in dots],
            round(math.hypot(dx, dy), 1))


def by_shape(complaints: list) -> dict:
    """شكاوى الفاحص مرتّبةً على أصحابها — `«ض» initial: …` ⇐ `ض/initial`."""
    out = {}
    for line in complaints:
        found = re.match(r"«(.+?)»\s+(\w+)", line)
        if found:
            out.setdefault(f"{found.group(1)}/{found.group(2)}", []).append(line)
    return out


def layer(passes: int = TAUBIN_PASSES) -> tuple:
    """طبقةُ المالك بصيغة المحرّك، ومعها لوحةُ الفرق شكلاً شكلاً وجردُ ما لم يُعتمَد."""
    tol = tolerance()
    grid = tol["grid"]
    limit = tol["lateral"]
    data = shapes()
    seen = ghost()

    refined, marks = {}, {}
    for ch, family in data.get("letters", {}).items():
        for form, entry in family.items():
            strokes = [refine(s, tol, passes) for s in entry["strokes"] if len(prepare(s)) >= 2]
            near = max((max(poly_dist(p, r) for p in s)
                        for s, r in zip(entry["strokes"], strokes)), default=0.0)
            was = sum(jitter(s) for s in entry["strokes"])
            now = sum(jitter(s) for s in strokes)
            n = max(1, len(strokes))
            refined.setdefault(ch, {})[form] = {"strokes": strokes, "raw": entry}
            marks[f"{ch}/{form}"] = {
                "near": round(near, 1),
                "norm": float(entry["norm"].get("max") or 0),
                "away": round(near + float(entry["norm"].get("max") or 0), 1),
                "jitter": now / n,
                "jitterWas": was / n,
                "limit": limit,
            }

    # ٢) المكرَّرُ يُوحَّد على الأفضل
    chosen = []
    for group in twin_groups(refined, grid):
        ch = group["ch"]
        verdict = choose(ch, group, refined, marks, grid)
        best = verdict["best"]
        for loser in group["forms"]:
            if loser == best:
                continue
            refined[ch][loser]["strokes"] = [[list(p) for p in s]
                                             for s in refined[ch][best]["strokes"]]
            refined[ch][loser]["twinOf"] = best
        chosen.append({**group, **verdict})

    out, dropped, panel = {}, [], []
    for ch, family in refined.items():
        for form in FORMS:
            if form not in family:
                continue
            entry = family[form]
            raw = entry["raw"]
            ref = (seen.get(ch) or {}).get(form)
            dots, notes = fix_dots(ch, form, [list(d) for d in raw.get("dots", [])], ref)
            strokes, dots, moved = snap_in(entry["strokes"], dots, grid)
            if moved:
                notes.append(f"خرج من الشبكة فرُدّ إليها بإزاحةٍ صلبة {moved} وحدة"
                             " — موضعٌ تبدّل لا شكل")
            shape = {
                # **والطيّةُ تُعلَن مع القطعة لا بعدها**: تُقرأ من نقاطها التي سيمشيها
                # المحرّكُ بعينها (`self_folds` أعلاه)، فما انطبق منها أُعلن ولا يُدَّعى سواه.
                "strokes": [({"start": [s[0][0], s[0][1]], "points": s, "folds": f}
                             if (f := self_folds(s, tol)) else
                             {"start": [s[0][0], s[0][1]], "points": s}) for s in strokes],
                "dots": [{"at": [round(d[0], 1), round(d[1], 1)], "count": 1, "after": True}
                         for d in dots],
            }
            mark = dict(marks[f"{ch}/{form}"])
            mark["away"] = round(mark["away"] + moved, 1)
            if mark["away"] > mark["limit"]:
                dropped.append({"key": f"{ch}/{form}",
                                "why": f"بُعدُه عن أثره {mark['away']} جاوز سماحةَ المحرّك"
                                       f" {mark['limit']:.0f} — يبقى على الخيال ويُبلَّغ"})
                continue
            out.setdefault(ch, {})[form] = shape
            panel.append({"key": f"{ch}/{form}", **mark, "notes": notes,
                          "twinOf": entry.get("twinOf"),
                          "dots": len(shape["dots"]), "parts": len(shape["strokes"])})

    # **وأشكالُ الرقم الأربعة مسارٌ واحد** — كما نصّ بيانُه (`twins`)
    for ch, family in data.get("letters", {}).items():
        for form, entry in family.items():
            for twin in entry.get("twins", []):
                if ch in out and form in out[ch] and twin != form:
                    out[ch][twin] = json.loads(json.dumps(out[ch][form]))

    # ————— **وما لا يقبله المحرّكُ لا يُدَسّ عليه**: يُردّ إلى الخيال بعلّةٍ منقولة —————
    #
    # أثرُ يدٍ حيٍّ لا يعرف شروطَ المحرّك: جزءٌ أقصرُ من دائرة البداية، أو مبدآن لا
    # يفرّق بينهما. فتُعرَض الطبقةُ على `check_paths` **مركّبةً على الخيال كما ستُبنى**،
    # وما شكا منه صاحبُه يُردّ إلى خياله وتُنقَل شكواه بنصّها — ولا يُعاير له فاحص.
    merged = json.loads(json.dumps(seen))
    for ch, family in out.items():
        merged.setdefault(ch, {}).update(json.loads(json.dumps(family)))
    for _ in range(4):
        blamed = by_shape(check_paths.check(merged, tol, FORMS))
        mine = [key for key in blamed if key.split("/")[0] in out
                and key.split("/")[1] in out[key.split("/")[0]]]
        if not mine:
            break
        for key in mine:
            ch, form = key.split("/")
            dropped.append({"key": key, "why": "؛ ".join(
                line.split(": ", 1)[-1] for line in blamed[key])})
            del out[ch][form]
            panel[:] = [row for row in panel if row["key"] != key]
            if (seen.get(ch) or {}).get(form):
                merged[ch][form] = json.loads(json.dumps(seen[ch][form]))
            else:
                del merged[ch][form]
            if not out[ch]:
                del out[ch]

    return out, {"panel": panel, "twins": chosen, "dropped": dropped,
                 "sha": sha(), "passes": passes, "limit": limit,
                 "shapes": sum(len(v) for v in out.values())}


# ————— العرضُ والفحص —————

# ————— لوحةُ الفرق: **ماذا صار لكلِّ شكلٍ حين علا أثرُه الخيال** —————

DIRECTION = TOOLS / "test_direction.mjs"


def side_rule() -> tuple:
    """حدودُ الجهة — **مقروءةٌ من حارسها** (`test_direction.mjs`) لا مكتوبةً هنا."""
    src = DIRECTION.read_text(encoding="utf-8")
    grab = lambda name: float(re.search(rf"const {name} = ([\d.]+)", src).group(1))  # noqa: E731
    return grab("RIGHT"), grab("LEFT"), grab("THIN")


def side_of(ref: dict) -> str:
    """جهةُ بداية شكلٍ — بمقياس الحارس نفسِه: موضعُ المبدأ من صندوق الشكل."""
    right, left, thin = side_rule()
    strokes = ref.get("strokes") or []
    if not strokes:
        return "نقرة"
    pts = [p for s in strokes for p in s["points"]] + [d["at"] for d in ref.get("dots") or []]
    x0 = min(p[0] for p in pts)
    x1 = max(p[0] for p in pts)
    at = strokes[0].get("start") or strokes[0]["points"][0]
    if x1 - x0 <= thin:
        return "عمودي"
    rx = (at[0] - x0) / (x1 - x0) if x1 > x0 else 0.5
    return "يمين" if rx >= right else ("يسار" if rx <= left else "وسط")


def shape_box(ref: dict) -> tuple:
    pts = [p for s in (ref.get("strokes") or []) for p in s["points"]]
    if not pts:
        return (0.0, 0.0)
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return (round(max(xs) - min(xs)), round(max(ys) - min(ys)))


def show_diff() -> int:
    """**لوحةُ فرقٍ شكلاً شكلاً**: جهةٌ · ترتيبٌ (أجزاءٌ ونقط) · نِسَبٌ · بُعدٌ عن أثره."""
    built, report = layer()
    now = {}
    if PATHS_JS.exists():
        body = re.search(r"export const PATHS = (\{.*?\n\});",
                         PATHS_JS.read_text(encoding="utf-8"), re.S)
        now = json.loads(body.group(1)) if body else {}
    was = ghost()
    marks = {row["key"]: row for row in report["panel"]}
    print(f"— لوحةُ الفرق: الخيالُ ⇐ يدُ المالك ({len(marks)} شكلاً من يده) —\n")
    print(f"{'الشكل':<13}{'الجهة':>18}{'أجزاء':>10}{'نقط':>8}{'النِّسَب (عرض×ارتفاع)':>28}"
          f"{'بُعدٌ عن أثره':>14}")
    turned = parts = dots = 0
    for key in sorted(marks, key=lambda k: -marks[k]["away"]):
        ch, form = key.split("/")
        old = (was.get(ch) or {}).get(form)
        new = (now.get(ch) or {}).get(form)
        if not old or not new:
            continue
        s0, s1 = side_of(old), side_of(new)
        p0, p1 = len(old["strokes"]), len(new["strokes"])
        d0, d1 = len(old["dots"]), len(new["dots"])
        b0, b1 = shape_box(old), shape_box(new)
        turned += s0 != s1
        parts += p0 != p1
        dots += d0 != d1
        flag = lambda a, b: "  " if a == b else "🔴"  # noqa: E731
        print(f"{key:<13}{flag(s0, s1)} {s0:>6} ⇐ {s1:<6}{flag(p0, p1)}{p0}⇐{p1:<4}"
              f"{flag(d0, d1)}{d0}⇐{d1:<3}"
              f"{f'{b0[0]}×{b0[1]}':>12} ⇐ {f'{b1[0]}×{b1[1]}':<10}"
              f"{marks[key]['away']:>10.1f}")
    print(f"\nتبدّلت جهتُه: {turned} · تبدّل عددُ أجزائه: {parts} · تبدّل عددُ نقطه: {dots}"
          f" — من {len(marks)} شكلاً جاء من يده")
    print(f"وبقي على الخيال: {len(report['dropped'])}"
          + ("" if not report["dropped"] else
             " — " + "، ".join(row["key"] for row in report["dropped"])))
    return 0


def show_panel() -> int:
    built, report = layer()
    print(f"— طبقةُ المالك: {report['shapes']} شكلاً من {SHAPES.name} (بصمةُ {report['sha']}) —")
    print(f"  التنقيح: تكثيفٌ ← توبين ×{report['passes']} ← خطوةُ المحرّك"
          f" · وحدُّ البُعد {report['limit']:.0f}\n")
    print(f"{'الشكل':<14}{'أجزاء':>6}{'نقط':>5}{'بُعدُ التنقيح':>14}{'تطبيعُه':>9}"
          f"{'المجموع':>9}{'الرجفة':>16}   ملاحظات")
    worst = None
    for row in sorted(report["panel"], key=lambda r: -r["away"]):
        note = "؛ ".join(row["notes"])
        if row["twinOf"]:
            note = (note + "؛ " if note else "") + f"عينُ «{row['twinOf']}» (مكرَّرٌ وُحِّد)"
        print(f"{row['key']:<14}{row['parts']:>6}{row['dots']:>5}{row['near']:>14.1f}"
              f"{row['norm']:>9.1f}{row['away']:>9.1f}"
              f"{row['jitterWas']:>8.3f} ← {row['jitter']:<5.3f}   {note}")
        if worst is None:
            worst = row
    print(f"\nأقصى بُعدٍ عن أثره: {worst['key']} — {worst['away']} من {report['limit']:.0f}")
    if report["dropped"]:
        print("\n— ما لم يُعتمَد فبقي على الخيال —")
        for row in report["dropped"]:
            print(f"  ✗ {row['key']}: {row['why']}")
    print("\n— المكرَّرُ الموحَّد: أيُّها اختير ولماذا (رجفةً · نِسَباً · اطّراداً ⇐ رتبةً) —")
    for row in report["twins"]:
        marks = row["scores"]
        best = row["best"]
        gaps = "، ".join(f"{k} {v}" for k, v in row["gaps"].items())
        blind = (" — ولا أسرةَ خارجَ الزُّمرة فلم يُقَس الاطّراد"
                 if "kin" in row.get("unmeasured", []) else "")
        print(f"  {row['ch']}: **{best}** يسري على {'، '.join(row['forms'])}"
              f" (بُعدُها {gaps}){blind}")
        num = lambda v: "—" if math.isnan(v) else f"{v:.3f}"  # noqa: E731
        for form in row["forms"]:
            m = marks[form]
            print(f"      {'⇐ المختار' if form == best else '        '} {form:<10}"
                  f" {num(m['jitter'])} · {num(m['fit'])} · {num(m['kin'])}"
                  f" ⇐ رتبةً {row['ranks'][form]}")
    return 0


def tune() -> int:
    """جدولُ الرشّات المقيس — **منه اختير العدد، ولا يُكتب بيد**."""
    tol = tolerance()
    data = shapes()
    print("— رشّاتُ التنقيح: ماذا تُزيل من الرجفة، وكم تُبعِد عن أثره —")
    print(f"{'رشّات':>6}{'وسطُ البُعد':>12}{'أقصاه':>8}{'الرجفةُ الباقية':>18}{'ثمرةُ الرشّة':>14}")
    before = None
    for passes in (0, 1, 2, 3, 4, 5, 6):
        away, ratio = [], []
        for family in data.get("letters", {}).values():
            for entry in family.values():
                for s in entry["strokes"]:
                    if len(prepare(s)) < 2:
                        continue
                    r = refine(s, tol, passes)
                    away.append(max(poly_dist(p, r) for p in s))
                    was = jitter(s)
                    if was:
                        ratio.append(jitter(r) / was)
        left = sum(ratio) / len(ratio)
        fruit = "—" if before is None else f"{(before - left) * 100:.1f}٪"
        before = left
        print(f"{passes:>6}{sum(away) / len(away):>12.2f}{max(away):>8.1f}"
              f"{left:>18.3f}{fruit:>14}")
    print(f"\nوالمختارُ {TAUBIN_PASSES}: أوّلُ عددٍ تنزل ثمرةُ ما بعده دون ١٪"
          f" — والبُعدُ عندَه دون عُشر سماحة المحرّك ({tol['lateral'] / 10:.0f})")
    return 0


def self_test() -> int:
    fails = 0

    def ok(cond, msg):
        nonlocal fails
        if not cond:
            fails += 1
        print(("  ✓ " if cond else "  ✗ ") + msg)

    data = shapes()
    letters = data.get("letters", {})
    forms = sum(len(v) for v in letters.values())
    ok(forms == 122, f"مادّةُ يده {forms} شكلاً (١١٢ حرفاً و١٠ أرقام)")
    ok(all(e.get("origin") == "owner" for f in letters.values() for e in f.values()),
       "وكلُّ شكلٍ مختومٌ `origin: owner` — ولا يدخل الطبقةَ ما ليس من يده")

    built, report = layer()
    tol = tolerance()
    ok(report["shapes"] == forms - len(report["dropped"]) + 30,
       f"والمبنيُّ منها {report['shapes']} شكلاً (وأشكالُ الأرقام الأربعةُ من رسمةٍ واحدة)")
    over = [r for r in report["panel"] if r["away"] > r["limit"]]
    ok(not over, f"ولا شكلَ جاوز بُعدُه سماحةَ المحرّك ({tol['lateral']:.0f})"
       + (f" — {'، '.join(r['key'] for r in over)}" if over else ""))

    # النقاطُ: حقيقةً وترتيباً
    wrong = [f"{ch}/{form}" for ch, family in built.items() for form, ref in family.items()
             if len(ref["dots"]) != check_paths.DOTS_OF.get(ch, 0)]
    ok(not wrong, "ونقطُ كلِّ شكلٍ عددَ الحقيقة الإملائية"
       + (f" — خالف: {'، '.join(wrong[:6])}" if wrong else ""))
    unordered = [f"{ch}/{form}" for ch, family in built.items() for form, ref in family.items()
                 if [d["at"] for d in ref["dots"]] != order_dots([d["at"] for d in ref["dots"]])]
    ok(not unordered, "وترتيبُها من اليمين إلى اليسار في الجميع"
       + (f" — خالف: {'، '.join(unordered[:6])}" if unordered else ""))

    # الطبقةُ تقبلها قواعدُ الفحص نفسُها — **مركّبةً على الخيال كما ستُبنى**
    merged = json.loads(json.dumps(ghost()))
    for ch, family in built.items():
        merged.setdefault(ch, {}).update(json.loads(json.dumps(family)))
    bad = check_paths.check(merged, tol, FORMS)
    ok(not bad, f"وقواعدُ `check_paths` تقبل الطبقةَ مركّبةً على الخيال ({len(bad)} شكوى)"
       + ("" if not bad else "\n      " + "\n      ".join(bad[:8])))
    for row in report["dropped"]:
        print(f"  ○ {row['key']}: رُدّ إلى الخيال — {row['why']}")

    print(f"\n{fails} فشل" if fails else "\nعهدُ طبقة المالك قائم")
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser(description="طبقةُ المالك — من أثر يده إلى مسارٍ يقبله المحرّك")
    ap.add_argument("--panel", action="store_true", help="لوحةُ التنقيح والمكرَّر")
    ap.add_argument("--diff", action="store_true", help="لوحةُ الفرق: جهةٌ وترتيبٌ ونِسَبٌ وبُعد")
    ap.add_argument("--tune", action="store_true", help="جدولُ رشّات التنقيح المقيس")
    ap.add_argument("--self-test", action="store_true", help="عهدُ الطبقة بلا متصفّح")
    args = ap.parse_args()
    if args.tune:
        return tune()
    if args.self_test:
        return self_test()
    if args.diff:
        return show_diff()
    return show_panel()


if __name__ == "__main__":
    raise SystemExit(main())
