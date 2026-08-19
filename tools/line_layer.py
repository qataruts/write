#!/usr/bin/env python3
"""**سطرُ الكتابة وحدةً لا الحرف** — طبقةُ الجلوس على السطر (بند ص٢/ب ١ و٢ و٤ و٥).

    python3 tools/line_layer.py            # مواصفةُ السطر مطبوعةً
    python3 tools/line_layer.py --table    # جدولُ الأشكال: نسبتُها إلى الألف قبل/بعد
    python3 tools/line_layer.py --self-test # الحارس: مقياسٌ واحد، ولا شكلَ يملأ خليّتَه

## العلّة — أمرُ مالكٍ منتهٍ (١٩ أغسطس ٢٠٢٦)

> «**يجب حفظ النسبة، هذا أمرٌ منتهٍ لا جدال فيه، ولو ظهر حرفُ الدال صغيراً لا مشكلة.**»

وموضعُ الكسر وُجد في `tools/make_paths.html:289` (`STROKE_ORDER §٧د`):

```js
const scale = span / Math.max(width, height);   // ← لكلِّ حرفٍ مقياسُه هو
```

**فكلُّ شكلٍ كان يُكبَّر وحدَه حتى يملأ خليّتَه ثم يُوسَّط فيها** — والدالُ حرفٌ
قصيرٌ عريض فيُكبَّر حتى يبلغ ٠٫٩٠ من الألف وحقُّه ٠٫٦٤. **والنسبةُ لم تُكسَر بالخطأ
بل مُحيت بالبناء**، ولذلك لم يُصلحها تبديلُ مرجع الشكل وحدَه.

## والنقضُ هنا — لا هناك

**لا يُنقَض السطرُ ٢٨٩ بتبديل نصّه**: تكبيرُ الخيال إلى مِلءِ الخليّة **دقّةُ تتبّعٍ
لا حكمَ نِسَب** — يُقرأ الهيكلُ على أوسع ما تسعه الشبكة فلا تُهدَر عقدةٌ في تنحيفه.
**وإنّما يُنقَض أثرُه**: تُؤخذ حصيلتُه ثم **تُنزَّل الأشكالُ كلُّها على سطرٍ واحد
بمقياسٍ عامٍّ واحد** قبل أن تُكتب الوحدة، فلا يبقى لِمِلءِ الخليّة أثرٌ في النسبة.
وهو تحويلُ **تشابهٍ منتظم** (مقياسٌ وإزاحة) — لا تشويهَ نِسَبٍ داخل الشكل.

## الثلاثةُ الخطوط ومقياسُها — محسوبةٌ لا مذوقة

| | من أين |
|---|---|
| **الوحدة** `U` | **ارتفاعُ ألفِ البناء القائم** — فتبقى أحجامُ الحبر المطلقة كما كانت، ولا تتبدّل سماحاتُ المحرّك ولا عدّةُ المعايرة المجمَّدة تحتها |
| **خطُّ الأساس** | تحته النزولُ وفوقه الارتفاع — وهو أصلُ القياس في `docs/naskh/` |
| **خطُّ القمّة** | أعلى ارتفاعٍ في الهجاء كلِّه (`ك/ابتدائي` ١٫٥٩ من الألف) |
| **خطُّ النزول** | أدنى نزولٍ فيه (`ع/نهائي` ٠٫٨٨) |
| **الخليّة** | مربّعُ السطر: ضلعُه مدى السطر (قمّة ← نزول) وهامشٌ — **لا خليّةُ الألف** |

**⚠ وخليّةُ الألف لا تسعُ الهجاء**: سبعةُ أشكالٍ يجاوز مداها الألفَ بالربع فأكثر
(`ل/نهائي` ١٫٦٢ · `ك/ابتدائي` ١٫٦٠ · `غ/نهائي` ١٫٥٣ · `غ/معزول` ١٫٤٨ · `ل/معزول`
١٫٤٨ · `ك/وسطي` ١٫٤٥ · `ع/نهائي` ١٫٤٢). **فالخليّةُ تُقاس بالسطر لا بالألف** — قرارُ
تخطيطٍ معلَنٌ هنا بأرقامه، ونتيجتُه أنّ الألف تأخذ ٣٩٪ من الخليّة **وتبقى الدالُ
صغيرةً بالنسبة إليها كما هي في المرجع**.

**والهامشُ يسع أبعدَ ما يُرسَم فوق الحبر**: سهمُ الاتجاه ودائرةُ البداية يُرسمان
بمقياس المادّة، وأكبرُ الأشكال مقياساً `غ/نهائي` — **فالهامشُ سهمُه** (١٠٩ وحدة)،
ولولاه لَقُصّت دائرةُ بداية `ك/ابتدائي` وهي أعلى الهجاء. ولا رقمَ مذوقاً.

## واللوحُ لا يصغُر لصِغَر الحرف (`STROKE_ORDER §٨د`)

**الخليّةُ واحدةٌ للهجاء كلِّه** — يعلنها كلُّ شكلٍ في `box`، فلوحُ الدال لوحُ الألف
بعينه، **والدالُ تجلس فيه صغيرةً**. ولو قُصّ صندوقُ كلِّ حرفٍ على مقاسه لَعاد
مِلءُ الخليّة من بابٍ آخر.

**والحجمُ الشاذُّ لا يُقاس بالخليّة** بعد اليوم بل **بحبر النموذج** (`pen.js: sizeOf`):
خليّةٌ تسع الهجاءَ كلَّه لا تمسك نوناً مضاعفةً مرّتين ونصفاً، **والنموذجُ هو المقياس**.

## ما لا مرجعَ له لا يُقاس

- **`ا/ابتدائي`**: في الجدول `null` لأنّ المرجع يكتب «لا تأتي الألفُ في بداية الكلمة»
  — **فتُؤخذ نسبتُه من `ا/معزول`**، والعلّةُ أنّ الألفَ لا تصل بما بعدها فشكلُها
  الابتدائيُّ شكلُها المعزول بعينه (ومسارانا لهما واحدٌ أصلاً).
- **الأرقام** (٤٠ شكلاً): لا تُعطيها `docs/naskh/` نسبةً — **فلا تُقاس ولا تُخمَّن**:
  تُنقَل إلى السطر بحجمها القائم (إزاحةٌ بلا مقياس) وتُعلن الخليّةَ نفسَها.
"""

import argparse
import json
import math
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import owner_layer  # noqa: E402  (خطوةُ المحرّك وكشفُ الطيّة — عدّةٌ واحدة لا نسختان)

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
METRICS = TOOLS / "naskh_metrics.json"
PATHS_JS = ROOT / "app" / "js" / "paths.js"
FORMS = ["isolated", "initial", "medial", "final"]
DIGITS = set("٠١٢٣٤٥٦٧٨٩")

def engine(name: str, fallback: float) -> float:
    """رقمٌ من `pen.js` بعينه — سماحةً كان أو مقياسَ إرشاد؛ لا نسختان في المشروع."""
    src = (ROOT / "app" / "js" / "pen.js").read_text(encoding="utf-8")
    hit = re.search(rf"{name}:\s*([\d.]+)", src)
    return float(hit.group(1)) if hit else fallback


def max_scale(paths: dict, unit: float, table: dict) -> float:
    """أكبرُ مقياسِ شكلٍ في الهجاء — يقرؤه من `tolerance` إن كُتب، وإلا حسبه.

    **فيستوي على البناء وعلى الوحدة المولَّدة**: الحارسُ يقرأ ما كُتب، والبناءُ
    يحسبه قبل أن يُكتب — والرقمُ واحد.
    """
    best = 0.0
    for ch, forms in paths.items():
        for form, shape in forms.items():
            got = shape.get("tolerance")
            if got is None:
                kin = SISTERS.get(ch)
                row = table.get((kin or ch, form))
                if not row:
                    continue
                x0, x1, y0, y1 = ink(shape, body_only=bool(kin))
                got = (row["up"] + row["down"]) * unit / max(y1 - y0, 1e-6)
            best = max(best, float(got))
    return best


def metrics() -> dict:
    """جدولُ المرجع: `(حرف، شكل) ⇐ {up, down, width}` — بوحدة ارتفاع الألف."""
    data = json.loads(METRICS.read_text(encoding="utf-8"))
    table = {}
    for row in data["الجدول"]:
        if row.get("measured"):
            table[(row["letter"], row["form"])] = row
    # **الألفُ الابتدائية**: نصٌّ لا شكل في المرجع — تُؤخذ من معزولها بعلّتها.
    if ("ا", "isolated") in table:
        table[("ا", "initial")] = dict(table[("ا", "isolated")], form="initial",
                                       why="من `ا/معزول`: الألفُ لا تصل بما بعدها")
    return table


# ————— **الأختان بجسمٍ واحد ومقياسٍ واحد** (بند ص٢/ب ٥) —————
#
# `ش` هي `س` ونقطُها، و`ض` هي `ص` ونقطتُها (أمرُ المالك ١٩ أغسطس ٢٠٢٦) — **والجسمُ
# إن كان واحداً فمقياسُه واحد**. ويُؤخذ المقياسُ من **الأخت التي لا نقطَ لها**،
# وعلّتُه مقيسةٌ في الجدول نفسِه: عرضُ `ش` عرضُ `س` بالرقم عينه (١٫١٥٦٤ · ١٫٤٤٠٨ …)
# **وارتفاعُه يزيد بمقدار نقطه** (`ش/معزول` ٠٫٨٠٥٧ مقابل ٠٫٣٢٧) — بل حتى `body_up`
# المزعوم أنه بلا نقط بقي ٠٫٦٤، **فعزلُ النقط في الصورة لم يتمّ**. ⇐ فلو قِيست
# المنقوطةُ إلى صفّها لَصغُر جسمُها بمقدار نقطه وافترق عن أخته.
#
# **فتُقاس المنقوطةُ بجسمها إلى صفِّ أختها، ونقطُها يركب معه** — ويُطبع فرقُها عن
# صفِّها في الجرد فلا يُخفى.
SISTERS = {"ش": "س", "ض": "ص"}


# ————— **الحلقةُ واستدارتُها** — ثمنُ القياس الأفقيّ يُقاس ولا يُذاق —————
#
# **ومعيارُها ليس من عندنا**: `STROKE_ORDER:113` قاس عينَ الميم ٣٤١×٢٠٨ فسمّاها
# «بيضاويّةً مفلطحة» باستدارةِ ٠٫٦١، **وحدُّ القبول هناك ٠٫٨٥** — فهو الرقمُ الذي
# يُحكَم به هنا، لا رقمٌ يُخترَع لهذه الجلسة.
ROUNDNESS = 0.85          # حدُّ استدارة الحلقة (`STROKE_ORDER:113`) — يُعلَن ولا يُخفى
WIDTH_BAND = 0.15         # ما دونه من فرق العرض لا يُمَسّ — فلا يُشوَّه المطابق

# **وأشكالٌ يُترَك عرضُها على حاله — بثمنٍ مقيسٍ لا بذوق** (بند ص٢/ج ١):
# القياسُ الأفقيُّ يقرّب العرضَ من صفّه، **وثمنُه في هذه بعينها حارسٌ يحمرّ** —
# فالعهدُ أنّ العرضَ لا يُشترى بحكمٍ على يد طفل. ويُملأ من القياس لا من الظنّ.
WIDTH_KEEP = {"ي/final", "ك/isolated"}


def _cross(p, q, r, s):
    """نقطةُ تقاطع قطعتين، أو `None` — أساسُ كشف الحلقة."""
    (x1, y1), (x2, y2), (x3, y3), (x4, y4) = p, q, r, s
    den = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3)
    if abs(den) < 1e-9:
        return None
    t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / den
    u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / den
    if 0 <= t <= 1 and 0 <= u <= 1:
        return (x1 + t * (x2 - x1), y1 + t * (y2 - y1))
    return None


def roundness(shape: dict) -> list:
    """**استدارةُ كلِّ حلقةٍ في الشكل** — `أقصرُ ضلعَي صندوقها ÷ أطولِهما`.

    **وكلُّ حلقةٍ لا أكبرُها وحدَها**: أكبرُ الحلقات يتبدّل بالمقياس، فحارسٌ يتتبّع
    واحدةً يمرّ من تحته الانكسار — **مقيسٌ في `ه/معزول`** (٠٫٧٠٨ ⇐ ٠٫٣٦٦ تحت حارسٍ
    يقرأ الكبرى وحدَها، وهي غيرُ مقصوصة).
    """
    out = []
    for stroke in shape["strokes"]:
        pts = [[float(p[0]), float(p[1])] for p in stroke["points"]]
        for i in range(len(pts) - 1):
            for j in range(i + 2, len(pts) - 1):
                hit = _cross(pts[i], pts[i + 1], pts[j], pts[j + 1])
                if hit is None:
                    continue
                ring = [hit] + pts[i + 1:j + 1] + [hit]
                xs = [p[0] for p in ring]
                ys = [p[1] for p in ring]
                w, h = max(xs) - min(xs), max(ys) - min(ys)
                if w * h < 400:           # حبرٌ لا حلقة: تقاطعُ رأسٍ لا بطنُ حرف
                    continue
                out.append(min(w, h) / max(w, h, 1e-9))
    return out


def stretch(shape: dict, k: float, cx: float) -> dict:
    """نسخةٌ من الشكل بمقياسٍ أفقيٍّ `k` حول `cx` — للقياس قبل الاعتماد."""
    return {
        "strokes": [{"points": [[cx + (p[0] - cx) * k, p[1]] for p in s["points"]]}
                    for s in shape["strokes"]],
        "dots": [{**d, "at": [cx + (d["at"][0] - cx) * k, d["at"][1]]}
                 for d in shape["dots"]],
    }


def widen(shape: dict, want: float, cx: float, x0: float, x1: float) -> tuple:
    """**كم يُقرَّب عرضُ الشكل إلى عرض صفّه — بلا كسرِ حلقة**: `(k، أقُصَّ)`.

    الفرضيّةُ التي تُجرَّب هنا: **الارتفاعُ صار عينَ المرجع بالمقياس المنتظم،
    والعرضُ وحدَه بقي** — فيُجرَّب مقياسٌ أفقيٌّ مستقلٌّ عن الرأسيّ. **وثمنُه
    الحلقات**: كلُّ تقريبٍ أفقيٍّ يفلطح البطون، فيُبحَث على **مقدار الاقتراب**
    (`t` من صفرٍ إلى واحد) أكبرُ ما لا تنزل به استدارةُ حلقةٍ عن حدِّها —
    **وحدُّها `ROUNDNESS`، أو ما كانت عليه إن كانت دونه** فلا يُطلَب من الشكل
    ما لم يكن فيه. **والآمنُ دائماً `t = 0`** فالبحثُ لا يقفز في المجهول.
    """
    cur = x1 - x0
    if cur < 1e-6:
        return 1.0, False
    k = want / cur
    rings = roundness(shape)
    if not rings:
        return k, False
    floor = min(ROUNDNESS, min(rings))
    lo, hi = 0.0, 1.0
    for _ in range(24):
        mid = (lo + hi) / 2
        got = roundness(stretch(shape, 1 + mid * (k - 1), cx))
        if got and min(got) < floor - 1e-4:
            hi = mid
        else:
            lo = mid
    return 1 + lo * (k - 1), abs(lo - 1.0) > 1e-3


def ink(shape: dict, body_only: bool = False) -> tuple:
    """صندوقُ حبر الشكل — الضرباتُ ومواضعُ نقطه (وهو ما يقيسه المرجع في `up/down`)."""
    pts = [p for s in shape["strokes"] for p in s["points"]]
    if not body_only:
        pts += [d["at"] for d in shape["dots"]]
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return min(xs), max(xs), min(ys), max(ys)


def spec(paths: dict = None) -> dict:
    """مواصفةُ السطر: وحدتُه وخطوطُه الثلاثة وخليّتُه — محسوبةٌ من المرجع والبناء."""
    table = metrics()
    ascent = max(r["up"] for r in table.values())
    descent = max(r["down"] for r in table.values())
    widest = max(r["width"] for r in table.values())
    top = max(table.items(), key=lambda kv: kv[1]["up"])[0]
    low = max(table.items(), key=lambda kv: kv[1]["down"])[0]
    unit = alif_unit(paths)
    # **وهامشُ الخليّة يسع أبعدَ ما يُرسَم فوق الحبر** (لا نصفَ سماحةٍ مذوقاً):
    # اللوحُ يرسم حول المسار **دائرةَ بدايةٍ وسهمَ اتجاه** بمقياس المادّة
    # (`pen.js: guideOf`)، **وأكبرُ الأشكاء مقياساً `غ/نهائي` (٢٫٣٥)** — فسهمُه
    # يبلغ ١٠٨ وحدةً فوق حبره. فلو كان الهامشُ نصفَ السماحة (٤٥) **لَقُصّت دائرةُ
    # بداية `ك/ابتدائي`** وهي أعلى الهجاء — والإرشادُ يُقَصّ حيث يحتاجه الطفل أكثر.
    margin = max(engine("lateral", 90.0) / 2,
                 engine("arrowTip", 46.0) * max_scale(paths or read_paths(), unit,
                                                      table))
    margin = float(math.ceil(margin))
    cell = round((ascent + descent) * unit + 2 * margin, 1)
    return {
        "unit": unit,                       # ارتفاعُ الألف — وحدةُ القياس كلِّها
        "ascent": ascent, "descent": descent, "widest": widest,
        "top": f"{top[0]}/{top[1]}", "low": f"{low[0]}/{low[1]}",
        "margin": margin,
        "cell": cell,                       # ضلعُ الخليّة — مربّعُ السطر
        "base": round(margin + ascent * unit, 1),   # خطُّ الأساس
        "cap": round(margin + (ascent - 1.0) * unit, 1),  # خطُّ القمّة (رأسُ الألف)
        "table": table,
    }


def alif_unit(paths: dict = None) -> float:
    """**وحدةُ السطر = ارتفاعُ ألفِ البناء القائم** — فلا تتبدّل الأحجامُ المطلقة.

    **وقياسُها لا يتبدّل بالتنزيل**: نصيبُ الألف من الوحدة `١٫٠٠` بنصّ المرجع،
    فارتفاعُها بعد الجلوس ارتفاعُها قبله — فالطبقةُ **تُعاد على نفسها فلا تُزحزح
    رقماً**، ويقرأ الحارسُ الوحدةَ من الملفّ المولَّد كما يقرؤها البناء.
    """
    paths = paths or read_paths()
    x0, x1, y0, y1 = ink(paths["ا"]["isolated"])
    return round(y1 - y0, 1)


def seat(paths: dict, unit: float = None) -> tuple:
    """يُنزِّل الأشكالَ كلَّها على السطر الواحد، ويعيد `(المسارات، تقريراً)`.

    **تحويلُ تشابهٍ لكلِّ شكل**: مقياسٌ واحدٌ لبُعديه (فلا تشويهَ نِسَبٍ داخله)
    يجعل مداه الرأسيَّ عينَ ما يقوله المرجع، وإزاحةٌ تُجلسه على خطّ الأساس.
    **والأفقُ**: المعزولُ يتوسّط خليّتَه (أمرُ المالك)، والموصولُ يبقى على إزاحته
    من المركز مقيسةً بمقياسه — فمدخلُ وصله لا ينتقل تحته.
    """
    tol = owner_layer.tolerance()
    sp = spec(paths if unit is None else None)
    if unit:
        sp = dict(sp, unit=unit)
    unit, base, cell = sp["unit"], sp["base"], sp["cell"]
    table = sp["table"]
    out = {}
    report = []
    for ch, forms in paths.items():
        out[ch] = {}
        for form in FORMS:
            if form not in forms:
                continue
            shape = forms[form]
            kin = SISTERS.get(ch)
            x0, x1, y0, y1 = ink(shape, body_only=bool(kin))
            row = table.get((kin or ch, form))
            if row is None:
                # **بلا سندٍ من المرجع**: يُنقَل ولا يُقاس — أسفلُ حبره على السطر.
                scale = 1.0
                top = base - (y1 - y0)
            else:
                scale = (row["up"] + row["down"]) * unit / max(y1 - y0, 1e-6)
                top = base - row["up"] * unit
            cx = (x0 + x1) / 2
            # ————— **العرضُ: قياسٌ أفقيٌّ مستقلٌّ عن الرأسيّ** (بند ص٢/ج ١) —————
            #
            # الجلوسُ صحّح الارتفاعَ بمقياسٍ منتظم فصار عينَ المرجع، **وبقي العرضُ
            # ٥١ شكلاً فوق ٠٫١٥ من الألف** — والفرضيّةُ أنّ مقياساً أفقيّاً مستقلاً
            # يُدخلها. **ولا يُمَسّ ما هو في نطاقه** (`WIDTH_BAND`) فلا يُشوَّه
            # مطابقٌ لأجل رقمٍ أدقّ، **ولا تُكسَر حلقةٌ** لأجل عرض.
            kx, capped = 1.0, False
            if row is not None:
                got_w = (x1 - x0) * scale / unit
                if (abs(got_w - row["width"]) > WIDTH_BAND
                        and f"{ch}/{form}" not in WIDTH_KEEP):
                    kx, capped = widen(shape, row["width"] * unit / scale, cx, x0, x1)
            # **جلوسُ المعزول في وسط خليّته** (أمرُ المالك: ي/معزول · ر/معزول)،
            # **والموصولُ على إزاحته** — فما كان مدخلُ وصله يميناً بقي يميناً.
            # **وما لا مرجعَ له يتوسّط بأشكاله الأربعة**: لا مدخلَ وصلٍ للرقم
            # يُحفَظ، **وأشكالُه الأربعة مسارٌ واحد** — فلو تُرك كلٌّ على إزاحته
            # لَافترقت أربعتُه بمقدار إزاحتها، والسطرُ الواحد يحكمها معاً.
            def place(k, _cx=cx, _x0=x0, _y0=y0, _scale=scale, _top=top,
                      _shape=shape, _row=row, _form=form):
                nx = (cell / 2 if _form == "isolated" or _row is None
                      else cell / 2 + (_cx - 500.0) * _scale * k)
                wide = _scale * k
                mv = (lambda p: [round(nx + (p[0] - _cx) * wide, 1),
                                 round(_top + (p[1] - _y0) * _scale, 1)])
                return nx, mv

            # **ولا يُقرَّب عرضٌ على حساب ارتفاعٍ يخرج عن هامشه**: التوسيعُ يُطيل
            # المسار فتكبُر خطوةُ المحرّك (`stepFor`) فتُقتطَع رؤوسٌ بين عيّنتين —
            # **مقيسٌ في `س/نهائي`** (٠٫٧٨٧ ⇐ ٠٫٧٣١ من الألف). فيُقصَّر الاقترابُ
            # حتى يعود الارتفاعُ إلى هامشه، **والارتفاعُ مقدَّمٌ فهو المحسوم**.
            if row is not None and abs(kx - 1.0) > 1e-3:
                want_h = row["up"] + row["down"]

                def tall(k):
                    _, mv = place(k)
                    got = {"strokes": [restep([mv(p) for p in st["points"]],
                                              scaled(tol, scale))
                                       for st in shape["strokes"]],
                           "dots": [{**d, "at": mv(d["at"])} for d in shape["dots"]]}
                    a0, a1, b0, b1 = ink(got, body_only=bool(kin))
                    return abs((b1 - b0) / unit - want_h)

                if tall(kx) > MARGIN_OF_FIT:
                    lo, hi = 0.0, 1.0
                    for _ in range(16):
                        mid = (lo + hi) / 2
                        if tall(1 + mid * (kx - 1)) > MARGIN_OF_FIT:
                            hi = mid
                        else:
                            lo = mid
                    kx, capped = 1 + lo * (kx - 1), True

            nx, move = place(kx)
            out[ch][form] = {
                "strokes": [restep([move(p) for p in s["points"]], scaled(tol, scale))
                            for s in shape["strokes"]],
                "dots": [{**d, "at": move(d["at"])} for d in shape["dots"]],
                "box": [cell, cell],
                "line": base,
                # **ومقياسُ الشكل يسافر معه** (`pen.js: resolveTolerance`): كم يبلغ
                # حبرُه من الحرف الذي كان يملأ شبكتَه — فتُقاس سماحاتُ المحرّك
                # ومقاييسُ إرشاده بمقياس الحرف لا بمقياس الخليّة، **وتبقى الأحكامُ
                # على ما كانت** فلا يتبدّل بالنسبة حكمٌ على أثر طفل.
                "tolerance": round(scale, 4),
            }
            nx0, nx1, ny0, ny1 = ink(out[ch][form], body_only=bool(kin))
            report.append({
                "key": f"{ch}/{form}", "letter": ch, "form": form,
                "scale": round(scale, 6),
                # **التحويلُ يُقيَّد بأرقامه**: به يُنقَل إلى الإطار الجديد كلُّ ما
                # قِيس في القديم — وأثقلُه **آثارُ الأطفال المجمَّدة**، فالعلاقةُ
                # بين يد الطفل ونموذجه تبقى بحرفها ولا تُعاد تجربةُ ميدانٍ.
                "from": [round(cx, 4), round(y0, 4)],
                "to": [round(nx, 4), round(top, 4)],
                "ref": round(row["up"] + row["down"], 4) if row else None,
                "got": round((ny1 - ny0) / unit, 4),
                "ref_width": round(row["width"], 4) if row else None,
                "basis": (f"جسمُه إلى صفِّ {kin}" if kin else None),
                "got_width": round((nx1 - nx0) / unit, 4),
                # **والقياسُ الأفقيُّ يُقيَّد بأرقامه**: كم قُرِّب، وهل قُصَّ لأجل حلقة.
                "kx": round(kx, 4),
                "capped": capped,
                "up": round((base - ny0) / unit, 4),
                "down": round((ny1 - base) / unit, 4),
            })
    return out, {"spec": {k: v for k, v in sp.items() if k != "table"}, "shapes": report}


def scaled(tol: dict, scale: float) -> dict:
    """**سماحاتُ المحرّك بمقياس الشكل** — كما تُشَدّ بمقياس الكلمة في `check_paths`.

    فالشكلُ يُحكَم بـ`tolerance` الذي يسافر معه، **فبه تُقاس خطوتُه وطيّتُه** — ولو
    قِيستا بالسماحة المطلقة لَقِيس الشكلُ بمسطرةٍ غير التي يُحكَم بها.
    """
    return {**tol, "start": tol["start"] * scale, "back": tol["back"] * scale,
            "lateral": tol["lateral"] * scale, "dot": tol["dot"] * scale}


def restep(points: list, tol: dict) -> dict:
    """**خطوةُ المحرّك تُعاد بعد المقياس، والطيّةُ تُكشف من جديد** — ضربةً ضربة.

    **وعلّتُهما واحدة**: كلاهما مقيسٌ بأطوالٍ مطلقةٍ على الشبكة (خطوةُ الرأس وسماحةُ
    الانحراف)، **والمقياسُ يبدّل الأطوال** — فما كبُر تباعدت نقاطُه حتى تجاوزت
    قطعتُه ما ترشّحه نافذةُ الرتابة، وما صغُر تقاربت. **ولا تُترك الطيّةُ على
    إعلانها القديم**: ضلعان كانا يشتركان في حبرٍ قد يفترقان بالتكبير، وضلعان
    مفترقان قد يلتقيان بالتصغير — **فتُقاس من النقاط التي سيمشيها المحرّكُ بعينها**
    (وهو عينُ صنيع `owner_layer.layer`).
    """
    walked = owner_layer.resample(points, tol)
    folds = owner_layer.self_folds(walked, tol)
    stroke = {"start": [walked[0][0], walked[0][1]], "points": walked}
    if folds:
        stroke["folds"] = folds
    return stroke


# ————— **الحارس**: مقياسٌ عامٌّ واحد، ولا شكلَ يملأ خليّتَه بغير حقّ —————
#
# **وهو حارسُ أمرٍ منتهٍ** (أمرُ المالك ١٩ أغسطس ٢٠٢٦: «يجب حفظ النسبة… ولو ظهر
# حرفُ الدال صغيراً لا مشكلة»)، فيقيس ثلاثاً على الوحدة المولَّدة:
#   ١) **خليّةٌ واحدةٌ وسطرٌ واحد** للهجاء كلِّه — فما اختلف صندوقُه فقد فارق السطر.
#   ٢) **نسبةُ ارتفاع كلِّ شكلٍ إلى الألف عينُ ما يقوله المرجع** بهامشٍ معلَن.
#   ٣) **ولا شكلَ يجاوز أطولَ المرجع مدىً ولا أعرضَه** — وهو معنى «يملأ خليّتَه»:
#      لا يُقاس بحدٍّ مذوقٍ بل **بأقصى ما في صفوف المرجع نفسِها**.
MARGIN_OF_FIT = 0.03      # هامشُ المطابقة من ارتفاع الألف — تُعلَن ولا تُخفى


def audit(paths: dict = None) -> list:
    """`(شكاوى، ملاحظاتٌ مقيسة)` — فما أوقف البناءَ غيرُ ما يُبلَّغ ويُعَدّ."""
    paths = paths or read_paths()
    sp = spec(paths)
    table, unit, cell, base = sp["table"], sp["unit"], sp["cell"], sp["base"]
    tallest = max(r["up"] + r["down"] for r in table.values())
    widest = sp["widest"]
    bad, notes = [], []
    for ch, forms in paths.items():
        for form, shape in forms.items():
            tag = f"«{ch}» {form}"
            box = shape.get("box")
            if not box or [round(float(box[0]), 1), round(float(box[1]), 1)] != [cell, cell]:
                bad.append(f"{tag}: خليّتُه {box} وخليّةُ السطر [{cell}, {cell}]"
                           " — واللوحُ لا يصغُر لصِغَر الحرف")
            if round(float(shape.get("line") or 0), 1) != base:
                bad.append(f"{tag}: سطرُه {shape.get('line')} وخطُّ الأساس {base}"
                           " — سطرٌ واحدٌ للهجاء كلِّه")
            kin = SISTERS.get(ch)
            x0, x1, y0, y1 = ink(shape, body_only=bool(kin))
            got, wide = (y1 - y0) / unit, (x1 - x0) / unit
            row = table.get((kin or ch, form))
            if row is not None:
                want = row["up"] + row["down"]
                if abs(got - want) > MARGIN_OF_FIT:
                    bad.append(f"{tag}: ارتفاعُه {got:.3f} من الألف والمرجعُ {want:.3f}"
                               f" (فوق الهامش {MARGIN_OF_FIT})")
                if abs((base - y0) / unit - row["up"]) > MARGIN_OF_FIT:
                    bad.append(f"{tag}: فوق السطر {(base - y0) / unit:.3f}"
                               f" والمرجعُ {row['up']:.3f} — لا يجلس حيث يجلس")
            # **ومِلءُ الخليّة يُقاس بحرفه**: حبرٌ يبلغ ضلعَ الخليّة إلا هامشَها.
            room = cell - 2 * sp["margin"]
            if (y1 - y0) >= room or (x1 - x0) >= room:
                bad.append(f"{tag}: حبرُه {x1 - x0:.0f}×{y1 - y0:.0f} وسعةُ الخليّة"
                           f" {room:.0f} — شكلٌ يملأ خليّتَه، ولا يُكبَّر حرفٌ وحدَه")
            if got > tallest + MARGIN_OF_FIT:
                bad.append(f"{tag}: مداه {got:.3f} من الألف وأطولُ المرجع {tallest:.3f}"
                           " — أطولُ من أطول الهجاء، والمقياسُ واحد")
            # **والعرضُ يُبلَّغ ولا يُحمَّر**: الجلوسُ صحَّح الارتفاعَ بالحساب،
            # **وأمّا العرضُ فشهادةُ الشكل نفسِه** — لا يصلحه مقياسٌ منتظم بل
            # اشتقاقُ الشكل من المرجع (ص٢/ج). فيُعَدّ ويُطبع ولا يُوقِف بناءً.
            if wide > widest + MARGIN_OF_FIT:
                notes.append(f"{tag}: عرضُه {wide:.3f} وأعرضُ المرجع {widest:.3f}")
    return bad, notes


def self_test() -> int:
    fails = 0

    def ok(cond, msg):
        nonlocal fails
        if not cond:
            fails += 1
        print(("  ✓ " if cond else "  ✗ ") + msg)

    paths = read_paths()
    sp = spec(paths)
    ok(bool(paths), f"الوحدةُ المولَّدة مقروءةٌ ({sum(len(v) for v in paths.values())} شكلاً)")
    bad, notes = audit(paths)
    ok(not bad, f"وكلُّ شكلٍ على سطره ونسبته ({len(bad)} شكوى)"
       + ("" if not bad else " — " + " · ".join(bad[:3])))
    print(f"  ○ وأوسعُ من صفِّه في المرجع {len(notes)} شكلاً — يُبلَّغ ولا يُحمَّر،"
          " فالعرضُ شهادةُ الشكل واشتقاقُه من المرجع بندُ ص٢/ج"
          + (f" (أوسعُها {notes[0].split(':')[0]})" if notes else ""))
    ok(sp["cell"] > sp["unit"] * 2,
       f"وخليّةُ السطر أوسعُ من خليّة الألف ({sp['cell']} من {sp['unit']})"
       " — فالسبعةُ الطوال تسعُها")

    # **ومجرَّبٌ سالباً**: شكلٌ يُكبَّر حتى يملأ خليّتَه — وهو العطبُ بعينه
    grown = json.loads(json.dumps(paths))
    shape = grown["د"]["isolated"]
    x0, x1, y0, y1 = ink(shape)
    blow = (sp["cell"] - 2 * sp["margin"]) / max(y1 - y0, 1e-6)
    for stroke in shape["strokes"]:
        stroke["points"] = [[x0 + (p[0] - x0) * blow, y0 + (p[1] - y0) * blow]
                            for p in stroke["points"]]
    ok(any("يملأ خليّتَه" in one for one in audit(grown)[0]),
       "ويُمسِك دالاً كُبِّرت حتى ملأت خليّتَها — وهي علّةُ العهد بعينها")
    shrunk = json.loads(json.dumps(paths))
    shrunk["ب"]["isolated"]["line"] = sp["base"] + 100
    ok(any("سطرٌ واحد" in one for one in audit(shrunk)[0]),
       "ويُمسِك شكلاً جلس على سطرٍ غير سطر إخوته")

    print(f"\n{fails} فشل" if fails else "\nالسطرُ واحدٌ والنسبةُ محفوظة")
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser(description="سطرُ الكتابة: مواصفتُه وحارسُه")
    ap.add_argument("--table", action="store_true", help="جردُ الأشكال ونِسَبها")
    ap.add_argument("--self-test", action="store_true",
                    help="الحارس: مقياسٌ واحد، ولا شكلَ يملأ خليّتَه")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    paths = read_paths()
    sp = spec(None)
    print(f"وحدةُ السطر (ارتفاعُ الألف): {sp['unit']}")
    print(f"القمّة {sp['cap']} · الأساس {sp['base']} · النزول"
          f" {round(sp['base'] + sp['descent'] * sp['unit'], 1)} · الخليّة {sp['cell']}²")
    print(f"أعلى الهجاء {sp['top']} ({sp['ascent']}) · وأنزلُه {sp['low']} ({sp['descent']})"
          f" · وأعرضُه {sp['widest']} من الألف")
    if paths and args.table:
        _, rep = seat(paths)
        rows = [r for r in rep["shapes"] if r["ref"]]
        rows.sort(key=lambda r: -abs(r["got_width"] - r["ref_width"]))
        print(f"\nالأشكالُ المقيسة {len(rows)} — وأبعدُها عن عرض المرجع:")
        for r in rows[:12]:
            print(f"  {r['key']}: ارتفاعٌ {r['got']} (المرجع {r['ref']})"
                  f" · عرضٌ {r['got_width']} (المرجع {r['ref_width']})")
    return 0


def read_paths() -> dict:
    if not PATHS_JS.exists():
        return {}
    src = PATHS_JS.read_text(encoding="utf-8")
    hit = re.search(r"export const PATHS = (\{.*?\n\});", src, re.S)
    return json.loads(hit.group(1)) if hit else {}


if __name__ == "__main__":
    raise SystemExit(main())
