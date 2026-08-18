#!/usr/bin/env python3
"""**سطرُ الكتابة وحدةً لا الحرف** — طبقةُ الجلوس على السطر (بند ص٢/ب ١ و٢ و٤ و٥).

    python3 tools/line_layer.py            # مواصفةُ السطر مطبوعةً
    python3 tools/line_layer.py --table    # جدولُ الأشكال: نسبتُها إلى الألف قبل/بعد

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

**والهامشُ نصفُ سماحة الانحراف** (٤٥ = ٩٠/٢): أضيقُ ما لا يُقَصّ به حبرُ شكلٍ رُسم
على الحدّ ولا نصفُ ممرّه — ولا رقمَ مذوقاً.

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

import json
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

# **هامشُ الخليّة**: نصفُ سماحة الانحراف — تُقرأ من المحرّك لا تُكتب هنا.
MARGIN = 45.0


def tolerance_lateral() -> float:
    """سماحةُ الانحراف من `pen.js` بعينها — رقمٌ واحدٌ في المشروع لا نسختان."""
    src = (ROOT / "app" / "js" / "pen.js").read_text(encoding="utf-8")
    hit = re.search(r"lateral:\s*([\d.]+)", src)
    return float(hit.group(1)) if hit else 90.0


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


def ink(shape: dict) -> tuple:
    """صندوقُ حبر الشكل — الضرباتُ ومواضعُ نقطه (وهو ما يقيسه المرجع في `up/down`)."""
    pts = [p for s in shape["strokes"] for p in s["points"]]
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
    margin = tolerance_lateral() / 2
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
            x0, x1, y0, y1 = ink(shape)
            row = table.get((ch, form))
            if row is None:
                # **بلا سندٍ من المرجع**: يُنقَل ولا يُقاس — أسفلُ حبره على السطر.
                scale = 1.0
                top = base - (y1 - y0)
            else:
                scale = (row["up"] + row["down"]) * unit / max(y1 - y0, 1e-6)
                top = base - row["up"] * unit
            cx = (x0 + x1) / 2
            # **جلوسُ المعزول في وسط خليّته** (أمرُ المالك: ي/معزول · ر/معزول)،
            # **والموصولُ على إزاحته** — فما كان مدخلُ وصله يميناً بقي يميناً.
            # **وما لا مرجعَ له يتوسّط بأشكاله الأربعة**: لا مدخلَ وصلٍ للرقم
            # يُحفَظ، **وأشكالُه الأربعة مسارٌ واحد** — فلو تُرك كلٌّ على إزاحته
            # لَافترقت أربعتُه بمقدار إزاحتها، والسطرُ الواحد يحكمها معاً.
            nx = (cell / 2 if form == "isolated" or row is None
                  else cell / 2 + (cx - 500.0) * scale)
            move = (lambda p: [round(nx + (p[0] - cx) * scale, 1),
                               round(top + (p[1] - y0) * scale, 1)])
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
            nx0, nx1, ny0, ny1 = ink(out[ch][form])
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
                "got_width": round((nx1 - nx0) / unit, 4),
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


def main() -> int:
    paths = read_paths()
    sp = spec(None)
    print(f"وحدةُ السطر (ارتفاعُ الألف): {sp['unit']}")
    print(f"القمّة {sp['cap']} · الأساس {sp['base']} · النزول"
          f" {round(sp['base'] + sp['descent'] * sp['unit'], 1)} · الخليّة {sp['cell']}²")
    print(f"أعلى الهجاء {sp['top']} ({sp['ascent']}) · وأنزلُه {sp['low']} ({sp['descent']})"
          f" · وأعرضُه {sp['widest']} من الألف")
    if paths and "--table" in sys.argv:
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
