#!/usr/bin/env python3
"""**طبقةُ العلامات** — الهمزةُ والمدّةُ ونقطتا التاء بيد المالك، فلا يبقى للخطّ موضع.

    python3 tools/mark_layer.py              # يبني الثمانيةَ المتغيّرة في `paths.js`
    python3 tools/mark_layer.py --self-test  # عهدُ الطبقة بلا متصفّح

## العلّة — آخرُ ما بقي من خطِّ الطباعة (١٩ أغسطس ٢٠٢٦)

أمرُ المالك: «**اجعل الكلَّ نابعاً من الحروف التي اعتمدناها**»، وقبله: «**لا يبقى في
الشكل النهائي أثرٌ لخطِّ طباعة**» (`ENGINE_FOUNDATION §٤`). **وقياسُ الإدارة وجد الثغرة**:
`paths.js` فيه **صفرٌ من الثمانية المتغيّرة**، فكان `word_layer.source_of` يستعير
**العلامةَ من الخيال** في موضعين (`borrowed`) — فالجسمُ بيد المالك والعلامةُ من
`NotoNaskhArabic`. **و٤٣٠ وحدةً في المادّة تحمل علامةً كهذه** (ة ٣٥٠ · أ ٦٩ · ء ٦ · إ ٥).

**والعلاجُ ليس ترقيعَ اللحام بل سدَّ الثغرة**: تدخل العلاماتُ `paths.js` نفسَه، فيجد
اللحامُ الحرفَ معتمَداً (`frame == "line"`) ولا يستعير شيئاً.

## المادّة — خمسُ سلَعٍ رسمها المالكُ في المِرسمة (`?only=marks`)

| السلعة | ما وصل | ما يُؤخذ منها |
|---|---|---|
| **ء** | ضربةٌ واحدة | **شكلُ الهمزة** بأوفى تفصيله |
| **أ · إ** | ألفٌ + همزة | **موضعُ الهمزة وحجمُها** فوق الألف وتحتها |
| **آ** | ألفٌ + مدّة | شكلُ المدّة وموضعُها |
| **ة** | هاءٌ + نقرتان | موضعُ النقطتين من الهاء |

**وقِيس أنّ همزتَه واحدةٌ لا ثلاث**: فرقُ الشكل بعد التطبيع بين `ء` وهمزةِ `أ` **٠٫١٠٣**
وبين `ء` وهمزةِ `إ` **٠٫١٢٦** (والمدّةُ ٠٫٤٨١ — فشكلٌ مستقلٌّ حقاً). ⇐ **علامةٌ واحدةٌ
معتمَدة** تُركَّب فوق وتحت ومفردة.

## القاعدةُ التي تحكم البناء

**الجسمُ يُنسَخ كما هو من `paths.js`** (فهو بيد المالك على السطر بالمقياس العامّ،
**ولا يُمَسّ** — فالنسبةُ محفوظةٌ بالبناء)، **والعلامةُ تُنزَّل عليه بنسبتها من جسمه في
رسم المالك نفسِه**: مقياسٌ واحدٌ من أكبر بُعدَي الجسمين، ومركزٌ إلى مركز. ⇐ فارتفاعُ
الهمزة عن الألف وعرضُها منه **رقمٌ من يده لا اجتهادٌ منّا**.

**و`ء` وحدَها لا جسمَ لها**: شكلُها من رسمها المفرد (أوفى نقاطاً)، **وحجمُها من همزة
`أ` بعد إنزالها** (فتُنسَب إلى الألف كسائر الهجاء)، **وجلوسُها أسفلُها على خطّ الأساس**.
**و`ى` بلا علامةٍ أصلاً**: هي `ي` بلا نقاط.

**و`ؤ ئ` لا تُبنى هنا** — صفرٌ في المادّة كلِّها (٨٩٤ كلمة و١٣٦ جملة)، **فلا يبلغ
الطفلَ منهما شيء**؛ وبناءُ موضعِ همزةٍ على واوٍ وياءٍ بلا رسمٍ من يده اجتهادٌ في
الهواء — **وبندُنا: لا تُعالَج علّةُ شكلٍ إلا بمرجعٍ مسمّى**.
"""
from __future__ import annotations

import argparse
import json
import math
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"
sys.path.insert(0, str(TOOLS))

import line_layer   # noqa: E402  (خطوةُ المحرّك وكشفُ الطيّة والمرور — عدّةٌ واحدة)
import owner_layer  # noqa: E402  (سماحاتُ المحرّك — لا عتبةَ منثورة)

PATHS_JS = ROOT / "app" / "js" / "paths.js"
SHAPES = TOOLS / "owner_shapes.json"

#: السلعةُ ⇐ (الحرفُ الأصلُ في `paths.js`، عددُ ضربات الجسم في رسم المالك)
DRAWN = {"أ": ("ا", 1), "إ": ("ا", 1), "آ": ("ا", 1), "ة": ("ه", 1)}
#: بلا علامةٍ أصلاً — الجسمُ بعينه وتُنزَع نقاطُه
BARE = {"ى": "ي"}
#: **الأشكالُ الأربعة كلُّها** — كما لأخواتها غير الموصولة (ا ر د و ز ذ) سواءً بسواء.
#: **وعلّتُه حارسٌ أمسك**: `check_paths` يشترط المواقعَ الأربعة لكلِّ حرفٍ في الوحدة،
#: **ولا يُخصَّص لأجل الجديد** — فالمتغيّرُ يجري مجرى أصله. والواقعُ منها في المادّة
#: `isolated` و`final` وحدَهما (فهذه لا تصل بما بعدها)، والباقيان يتبعان الأصلَ فلا يُطلبان.
FORMS = ("isolated", "initial", "medial", "final")


# ————— قراءةٌ وكتابة —————

def load_paths() -> tuple[dict, str]:
    src = PATHS_JS.read_text()
    hit = re.search(r"export const PATHS = (\{.*?\n\});", src, re.S)
    if not hit:
        raise SystemExit("🔴 لم أجد `export const PATHS` في paths.js")
    return json.loads(hit.group(1)), src


def owner_marks() -> dict:
    data = json.loads(SHAPES.read_text())
    words = data.get("words") or {}
    out = {}
    for ch in list(DRAWN) + ["ء"]:
        if ch not in words:
            raise SystemExit(f"🔴 «{ch}» ليست في {SHAPES.name} — ارسمها في المِرسمة (?only=marks)")
        out[ch] = words[ch]
    return out


# ————— الهندسة —————

def box(points: list) -> dict:
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
    return {"x0": x0, "y0": y0, "x1": x1, "y1": y1, "w": x1 - x0, "h": y1 - y0,
            "cx": (x0 + x1) / 2, "cy": (y0 + y1) / 2}


def onto(src: dict, dst: dict):
    """تنزيلُ ما نُسب إلى `src` على `dst` — **مقياسٌ واحدٌ من أكبر بُعدَيهما**.

    **ولا يُؤخذ المقياسُ من العرض وحدَه**: جسمُ الألف خطٌّ رأسيٌّ عرضُه ٩ وحدات في
    رسم اليد، فنسبةُ عرضٍ إلى عرضٍ رقمٌ بلا معنى — **والطولُ هو الذي يحمل قياسَه**.
    """
    a = max(src["w"], src["h"])
    b = max(dst["w"], dst["h"])
    s = (b / a) if a > 1e-9 else 1.0
    return (lambda p: [dst["cx"] + (p[0] - src["cx"]) * s,
                       dst["cy"] + (p[1] - src["cy"]) * s]), s


def crown(points: list) -> dict:
    """مِرْساةُ العلامة: **قمّةُ الجسم** — أعلى نقطةٍ فيه وسِينُها، لا مركزُ صندوقه.

    **وعلّتُها مقيسة**: صندوقُ `ا/نهائي` يضمّ **مدخلَ وصله** الممتدَّ على السطر،
    فمركزُه ينزل ويزيح — فهمزةٌ أُنزلت على مركزه خرجت عن الخليّة (ص −٢٠). **والعلامةُ
    تعلو قمّةَ الجسم لا مركزَ صندوقه**، فهذه هي المِرساة الصادقة في الشكلين.
    """
    b = box(points)
    top = min(points, key=lambda p: p[1])
    return {"x": top[0], "y": b["y0"], "h": b["h"]}


def perch(src: dict, dst: dict, scale: float):
    """إنزالُ علامةٍ بمقياسٍ **مُعطىً** — إزاحةٌ لا إعادةَ قياس.

    **وهذا عهدُ «مقياسٌ عامٌّ واحد»** (أمرُ المالك ١٩ أغسطس ٢٠٢٦): الهمزةُ علامةٌ
    واحدة، **فحجمُها لا يتبدّل بتبدّل شكل حرفها** — يُؤخذ مرّةً من الشكل المفرد
    ويُزاح إلى سائر الأشكال. **ولو أُعيد قياسُها لكلِّ شكلٍ لعادت علّةُ ٧د بعينها**:
    كلُّ خانةٍ تُكبّر ما فيها لتملأها.
    """
    return lambda p: [dst["x"] + (p[0] - src["x"]) * scale,
                      dst["y"] + (p[1] - src["y"]) * scale]


def shape_gap(a: list, b: list, n: int = 48) -> float:
    """فرقُ شكلين بعد التطبيع — **يقيس الشكلَ وحدَه**، لا الحجمَ ولا الموضع."""
    def norm(st):
        bx = box(st)
        s = max(bx["w"], bx["h"]) or 1e-9
        return [((p[0] - bx["x0"]) / s, (p[1] - bx["y0"]) / s) for p in st]

    def walk(pts):
        acc = [0.0]
        for u, v in zip(pts, pts[1:]):
            acc.append(acc[-1] + math.dist(u, v))
        total = acc[-1] or 1e-9
        out = []
        for i in range(n):
            t = total * i / (n - 1)
            j = min(max(k for k in range(len(acc)) if acc[k] <= t), len(pts) - 2)
            seg = (acc[j + 1] - acc[j]) or 1e-9
            f = (t - acc[j]) / seg
            out.append((pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f,
                        pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f))
        return out

    u, v = walk(norm(a)), walk(norm(b))
    return sum(math.dist(p, q) for p, q in zip(u, v)) / len(u)


def settle(marks: list, base: dict, paths: dict) -> list:
    """**يُقرِّب العلامةَ من جسمها حتى لا يطول الحرفُ عن أطول الهجاء** — إزاحةٌ لا قياس.

    **وعلّتُه أمرُ مالكٍ منتهٍ** (١٩ أغسطس ٢٠٢٦: «يجب حفظ النسبة… ولو ظهر حرفُ الدال
    صغيراً لا مشكلة»)، **وحارسُه أمسك**: «أ» بفرجة يده مداها ١٫٧٠٥ من الألف وأطولُ
    الهجاء ١٫٦١٦ — **لأنّ المالك رسمها في خليّةٍ فارغةٍ واسعة فطفت الهمزةُ عالياً**.

    **والحدُّ يُطلَب من الدالّة التي تحكم به** لا من ثابتٍ مكتوب: `metrics` هي التي
    تعطي أطولَ الهجاء، و`alif_unit` هي التي تعطي وحدتَه، و`MARGIN_OF_FIT` هامشُه.
    **وحجمُ العلامة لا يُمَسّ** — تُدنى وحدَها، فتبقى فرجةُ يده ما بقيت تسع.
    """
    if not marks:
        return marks
    unit = line_layer.alif_unit(paths)
    table = line_layer.metrics()
    tallest = max(r["up"] + r["down"] for r in table.values())
    room = (tallest + line_layer.MARGIN_OF_FIT) * unit
    body = box([p for s in base["strokes"] for p in s["points"]])
    flat = [p for st in marks for p in st]
    span = box(flat)
    y0, y1 = min(span["y0"], body["y0"]), max(span["y1"], body["y1"])
    over = (y1 - y0) - room
    if over <= 0:
        return marks
    # **الاتجاهُ من موضع العلامة**: ما علا الجسمَ ينزل، وما هبط عنه يصعد.
    step = min(over, abs(span["cy"] - body["cy"]))
    dy = step if span["cy"] < body["cy"] else -step
    return [[[x, y + dy] for x, y in st] for st in marks]


# ————— البناء —————

def build(paths: dict, marks: dict, say=lambda _: None) -> dict:
    """يبني مدخلاتِ المتغيّرات — ويعيد `{مفتاح: مدخلة}` بلا كتابةٍ في ملفّ."""
    tol = owner_layer.tolerance()
    out: dict[str, dict] = {}
    hamza_ref: list | None = None

    for ch, (kin, body_n) in DRAWN.items():
        drawn = marks[ch]
        raw_body = [p for s in drawn["strokes"][:body_n] for p in s]
        src_box = box(raw_body)
        extra = drawn["strokes"][body_n:]
        dots_src = drawn.get("dots") or []
        if not extra and not dots_src:
            raise SystemExit(f"🔴 «{ch}» بلا علامةٍ في رسم المالك — ضربةُ الجسم وحدَها")

        # **المقياسُ يُؤخذ مرّةً من الشكل المفرد** ثم يُزاح — لا يُعاد لكلِّ شكل.
        if kin not in paths or "isolated" not in paths[kin]:
            raise SystemExit(f"🔴 «{kin}/isolated» ليس في paths.js — لا جسمَ يُبنى عليه")
        src_crown = crown(raw_body)
        canon = crown([p for s in paths[kin]["isolated"]["strokes"] for p in s["points"]])
        scale = canon["h"] / src_crown["h"] if src_crown["h"] > 1e-9 else 1.0

        for form in FORMS:
            if form not in paths[kin]:
                raise SystemExit(f"🔴 «{kin}/{form}» ليس في paths.js — لا جسمَ يُبنى عليه")
            base = paths[kin][form]
            put = perch(src_crown,
                        crown([p for s in base["strokes"] for p in s["points"]]), scale)

            # **الجسمُ يُنسَخ كما هو** — بطيّاته ومروره وبدايته، فلا يُعاد حسابُ ما صحّ.
            strokes = [dict(s) for s in base["strokes"]]
            laid = [[put(p) for p in st] for st in extra]
            for st in settle(laid, base, paths):
                strokes.append(line_layer.restep(st, tol))
            # **والنقطةُ كائنٌ لا زوجُ إحداثيّين** — بصيغة الوحدة نفسِها، ومرتَّبةٌ
            # **من اليمين إلى اليسار** بقاعدة المالك (`owner_layer.order_dots`).
            dots = [{"at": [round(x, 1), round(y, 1)], "count": 1, "after": True}
                    for x, y in owner_layer.order_dots([put(d) for d in dots_src])] \
                or [dict(d) for d in (base.get("dots") or [])]

            out[f"{ch}/{form}"] = {"box": list(base["box"]), "line": base["line"],
                                   "tolerance": base["tolerance"],
                                   "strokes": strokes, "dots": dots}
            if ch == "أ" and form == "isolated" and extra:
                hamza_ref = strokes[-1]["points"]
        say(f"  · {ch}: جسمُه «{kin}» ونسبةُ علامته {scale:.3f} من رسمه")

    # **`ء` — شكلٌ من رسمها المفرد، وحجمٌ من همزة `أ`، وجلوسٌ على خطّ الأساس.**
    lone = marks["ء"]["strokes"][0]
    if hamza_ref is None:
        raise SystemExit("🔴 لم تُبنَ همزةُ «أ» فلا حجمَ لـ«ء»")
    want = box(hamza_ref)
    have = box(lone)
    anchor = paths["ا"]["isolated"]
    seat = {"w": want["w"], "h": want["h"],
            "cx": anchor["box"][0] / 2, "cy": anchor["line"] - want["h"] / 2}
    put, _ = onto(have, seat)
    for form in FORMS:
        out[f"ء/{form}"] = {"box": list(anchor["box"]), "line": anchor["line"],
                            "tolerance": anchor["tolerance"],
                            "strokes": [line_layer.restep([put(p) for p in lone], tol)],
                            "dots": []}
    say(f"  · ء: شكلُها من رسمها ({len(lone)} نقطة) وحجمُها من همزة «أ»"
        f" ({want['w']:.0f}×{want['h']:.0f}) وأسفلُها على السطر")

    # **`ى` — `ي` بلا نقاط، ولا علامةَ تُنزَّل.**
    for ch, kin in BARE.items():
        for form in FORMS:
            base = paths[kin][form]
            out[f"{ch}/{form}"] = {"box": list(base["box"]), "line": base["line"],
                                   "tolerance": base["tolerance"],
                                   "strokes": [dict(s) for s in base["strokes"]], "dots": []}
        say(f"  · {ch}: «{kin}» بلا نقاط")
    return out


def apply(built: dict) -> int:
    """يدمج المتغيّراتِ في `paths.js` — **بمُسلسِل الوحدة نفسِه لا بيدٍ ثانية**.

    **وعلّتُه عثرةٌ وقعت هنا**: كتابةُ `PATHS` بـ`json.dumps` في سطرٍ واحد أذهبت
    السطرَ الذي يشترطه قارئوها فعميت `check_paths` و`line_layer` معاً —
    **فالصيغةُ عقدٌ بين كاتبٍ وقرّاء، ولها كاتبٌ واحد**.
    """
    import make_paths  # noqa: PLC0415  (مُسلسِلُ الوحدة — يُستورَد عند الحاجة)
    paths, meta = make_paths.paths_module()
    for key, entry in built.items():
        ch, form = key.split("/")
        paths.setdefault(ch, {})[form] = entry
    meta = dict(meta or {})
    # **وتُعلِن نفسَها بمفاتيحها وبصمةِ مادّتها** — فالمُعلَنُ مولَّدٌ وما سواه دخيل،
    # **وبصمةُ `owner_shapes.json` تُحدَّث لأنّ هذه الطبقةَ استهلكت رسمَه الجديد**:
    # لو بقيت على القديم لَقال الحارسُ «تبدّل أثرُه ولم يُعَد البناء» وهو محقّ.
    meta["marks"] = {"tool": "tools/mark_layer.py", "sha": owner_layer.sha(),
                     "from": {ch: kin for ch, (kin, _) in DRAWN.items()}
                             | {ch: kin for ch, kin in BARE.items()} | {"ء": None},
                     "keys": sorted(built),
                     "why": "الثمانيةُ المتغيّرة: جسمُها حرفٌ معتمَدٌ في الوحدة"
                            " وعلامتُها من رسم المالك في المِرسمة (`STROKE_ORDER §١٠`)"}
    if isinstance(meta.get("owner"), dict):
        meta["owner"] = dict(meta["owner"]) | {"sha": owner_layer.sha()}
    PATHS_JS.write_text(make_paths.write_module(paths, meta), encoding="utf-8")
    return len(built)


# ————— العهد —————

def self_test() -> None:
    ok = True

    def check(cond, line):
        nonlocal ok
        ok = ok and bool(cond)
        print(("  ✓ " if cond else "  ✗ ") + line)

    paths, _ = load_paths()
    marks = owner_marks()
    built = build(paths, marks)

    check(len(built) == len(FORMS) * (len(DRAWN) + len(BARE) + 1),
          f"وتُبنى الستُّ في مواقعها الأربعة — {len(built)} مدخلة")

    # **النسبةُ محفوظة**: خليّةُ المتغيّر وسطرُه عينُ خليّة أصله وسطرِه.
    same = all(built[f"{ch}/isolated"]["box"] == paths[kin]["isolated"]["box"]
               and built[f"{ch}/isolated"]["line"] == paths[kin]["isolated"]["line"]
               for ch, (kin, _) in DRAWN.items())
    check(same, "وخليّةُ المتغيّر وسطرُه عينُ أصله — فالنسبةُ محفوظةٌ بالبناء")

    # **الجسمُ لم يُمَسّ**: ضرباتُ الأصل بأعيانها في مقدّمة المتغيّر.
    kept = all(built[f"{ch}/isolated"]["strokes"][:len(paths[kin]["isolated"]["strokes"])]
               == paths[kin]["isolated"]["strokes"] for ch, (kin, _) in DRAWN.items())
    check(kept, "وجسمُ الأصل منسوخٌ حرفاً بحرف — لا يُعاد حسابُ ما صحّ")

    # **العلامةُ داخلَ الخليّة** — فلا تخرج عن اللوح.
    inside = True
    for key, e in built.items():
        for st in e["strokes"]:
            for x, y in st["points"]:
                inside = inside and -1 <= x <= e["box"][0] + 1 and -1 <= y <= e["box"][1] + 1
    check(inside, "وكلُّ نقطةٍ داخلَ خليّتها")

    # **الهمزةُ فوقَ الألف في `أ` وتحتَها في `إ`** — وهو الفرقُ الوحيد بينهما.
    top = box(built["أ/isolated"]["strokes"][-1]["points"])
    bot = box(built["إ/isolated"]["strokes"][-1]["points"])
    alif = box([p for s in paths["ا"]["isolated"]["strokes"] for p in s["points"]])
    check(top["cy"] < alif["cy"] < bot["cy"],
          f"والهمزةُ فوقَ الألف في «أ» ({top['cy']:.0f}) وتحتَها في «إ» ({bot['cy']:.0f})"
          f" — ووسطُ الألف {alif['cy']:.0f}")

    # **همزةٌ واحدةٌ لا ثلاث** — الشكلُ نفسُه بعد التطبيع.
    gap = shape_gap(built["أ/isolated"]["strokes"][-1]["points"],
                    built["ء/isolated"]["strokes"][0]["points"])
    check(gap < 0.20, f"وهمزةُ «ء» هي همزةُ «أ» — فرقُ الشكل {gap:.3f}")

    # **`ء` تجلس على السطر** — أسفلُها خطُّ الأساس.
    lone = box(built["ء/isolated"]["strokes"][0]["points"])
    check(abs(lone["y1"] - paths["ا"]["isolated"]["line"]) < 2,
          f"و«ء» أسفلُها على خطّ الأساس ({lone['y1']:.0f} والسطر"
          f" {paths['ا']['isolated']['line']:.0f})")

    # **`ة` لها نقطتان و`ى` بلا نقطة** — والنقطتان فوقَ جسمهما.
    check(len(built["ة/isolated"]["dots"]) == 2 and not built["ى/isolated"]["dots"],
          "و«ة» نقطتان و«ى» بلا نقطة")
    ha = box([p for s in paths["ه"]["isolated"]["strokes"] for p in s["points"]])
    check(all(d["at"][1] < ha["cy"] for d in built["ة/isolated"]["dots"]),
          "ونقطتا «ة» فوقَ وسط الهاء")
    check(all(d.get("count") == 1 and d.get("after") is True
              for d in built["ة/isolated"]["dots"]),
          "وصيغةُ النقطة صيغةُ الوحدة — `{at, count, after}`")
    xs = [d["at"][0] for d in built["ة/isolated"]["dots"]]
    check(xs == sorted(xs, reverse=True), "وترتيبُهما من اليمين إلى اليسار")

    # **ومُجرَّبٌ سالباً**: علامةٌ تُنزَّل بلا مقياسٍ تخرج عن خليّتها.
    bad = onto({"w": 1, "h": 1, "cx": 0, "cy": 0},
               {"w": 9e5, "h": 9e5, "cx": 0, "cy": 0})[0]([1, 1])
    check(bad[0] > paths["ا"]["isolated"]["box"][0],
          "ومُجرَّبٌ سالباً — تنزيلٌ بلا نسبةٍ يخرج عن الخليّة فيُمسَك")

    print("\n" + ("طبقةُ العلامات على عهدها: جسمٌ منسوخٌ وعلامةٌ منسوبةٌ وهمزةٌ واحدة."
                  if ok else "🔴 الطبقةُ خرقت عهدَها"))
    raise SystemExit(0 if ok else 1)


def main() -> None:
    ap = argparse.ArgumentParser(description="طبقةُ العلامات — المتغيّراتُ في paths.js")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    print("طبقةُ العلامات — أبني المتغيّراتِ من يد المالك:", flush=True)
    paths, _ = load_paths()
    built = build(paths, owner_marks(), say=lambda s: print(s, flush=True))
    n = apply(built)
    print(f"✅ {n} مدخلةً في paths.js — ولم يبقَ للخطّ موضعٌ في المادّة", flush=True)


if __name__ == "__main__":
    main()
