#!/usr/bin/env python3
"""**الكلمةُ تركيبٌ من الحروف المعتمَدة** — طبقةُ تأليف مسارات النسخ (جلسة ك١).

    python3 tools/make_paths.py --words      # قياسٌ في المتصفّح ثم تركيبٌ هنا
    python3 tools/word_layer.py --self-test  # حارسُ الوصل على الوحدة المبنيّة

## العلّة — أمرُ مالكٍ قاطع (١٩ أغسطس ٢٠٢٦)

> «**اجعل الكلَّ نابعاً من الحروف التي اعتمدناها، ولا كلماتٍ من حروفٍ قديمة.**»

وكانت الكلمةُ تُنزِّل **قانونيَّ المتصفّح** — الخيالَ خالصاً — على جسدها في خيال
الكلمة المُشكَّل، **فبقيت على حروفٍ سبقت طبقةَ المالك (ص٦) وطبقةَ السطر (ص٢)**.
وثلاثةُ أعراضٍ قاستها الإدارةُ في يومٍ واحد: **ألفُ الكلمات تنزل والمفردةُ تصعد** ·
**و«با» قطعتان والصوابُ واحدة** · **ودقّةُ الحبر تختلف** (خطوةُ العيّنة ٤٧٫٣ في
الحروف و١٣٫٦ في الكلمات). **وكلُّها أثرُ بنائين — وتزول بالبناء الواحد.**

## الشقّان: المتصفّحُ يقيس، وهذا الملفُّ يركّب

| | |
|---|---|
| **المتصفّح** (`make_paths.html?part=measure`) | **مواضعُ لا مسارات**: أين يجلس كلُّ حرفٍ من خيال الكلمة المُشكَّل، وأين علامتُه، وأين سطرُها — **وهي وحدَها ما لا تعطيه الحروفُ** (فرجةُ ما لا يوصل، وموضعُ الحركة) |
| **هنا** | **المسارُ من `paths.js` بعينه**: بالسطر والنسبة وبنية الضربات والطيّات والمرور — **بلا تصغيرٍ ولا تكبير**، فالحرفُ في الكلمة هو الحرفُ في محطته |

## الإطار: سطرُ الكتابة نفسُه

الحروفُ اليومَ على خليّةٍ واحدة (`box`) وخطِّ أساسٍ واحد (`line`) بمقياسٍ عامٍّ واحد
(بند ص٢/ب). **فالكلمةُ تجلس على ذلك السطر بعينه**: كلُّ حرفٍ يحتفظ بإحداثيّه
الرأسيِّ كما هو، **ولا يُزاح إلا أفقيّاً** — والخليّةُ تتّسع عرضاً وحدَها
(`box = [العرض، الخليّة]`). ⇐ **فالنسبةُ محفوظةٌ بالبناء لا بالمراقبة**،
**وسماحةُ الكلمة ١٫٠٠** (مقياسُ السطر العامّ: الألف) — **فخطوةُ عيّنتها خطوةُ
الحروف بعينها**، وهو ثالثُ الأعراض يزول.

## الوصل — قاعدةُ المالك الجامعة (١٩ أغسطس ٢٠٢٦)، لا جدولُ حالات

> «**رفعُ القلم يكون داخل الحرف نفسِه، أو إن كان الحرفُ ليس له وصلٌ خلفيّ — مثل ر و د
> وبعدها حروف — فهذه تقطع. غيرُ ذلك: التقطيعُ فقط داخل الحرف، أو أوّلِه إذا كان قبله
> حرفٌ غيرُ موصولِ الآخِر.**»

⇐ **موضعان لا ثالثَ لهما**، ويُستخرجان من البيانات بلا قائمةٍ تُكتب:

1. **داخل الحرف**: كلُّ ضربةٍ من ضربات الشكل غيرِ ضربة الجريان **رفعٌ** — وهي شولةُ
   الكاف وعمودُ ط وظ ونقطُه وحركتُه. **ولا تُعَدّ حالاتُها**: عددُ ضرباتِ الشكل في
   `paths.js` هو الذي يقولها.
2. **عند مبدأ حرفٍ سبقه حرفٌ لا يوصل بما بعده**: و**شكلُ الحرف نفسُه يقوله** —
   الوسطيُّ والنهائيُّ لا يكونان إلا بعد موصول، والمعزولُ والابتدائيُّ لا يكونان إلا
   بعد قاطعٍ أو في المبدأ. ⇐ **فلا قائمةَ قواطعَ تُكتب هنا**: قائمتُها في
   `curriculum.js` (`joins`) يقرؤها المُشكِّلُ فيعطي الشكل، ونحن نقرأ الشكل.

**وضربتا الجريان**: مدخلُ الوصل (**المقعد**) ومخرجُه — تُعرفان بأنّهما أقربُ مبدأٍ
وأقربُ منتهىً إلى خطّ الأساس من ضربات الشكل. **فتُمسك `ك/وسطي`** (شولتُها هي التي
تخرج إلى ما بعدها) **و`ط/وسطي`** (عمودُها آخِرُ ضرباتها ولا يخرج منه وصل) بقاعدةٍ
واحدة، بلا اسمِ حرفٍ في الشيفرة.

## ولام-ألف تُفَكّ إلى حرفيها

المُشكِّلُ يصهرهما رمزاً واحداً، **وإيماءتُهما في `path_anchors.json` عمودان من
قمّتيهما** — وهي صياغةٌ سبقت حكمَ المالك في الألف الموصولة («تُكتب من تحت إلى فوق
لأنّ القلمَ يصل إليها من الحرف قبله»). ⇐ **فالكلمةُ تأخذ `ل` و`ا` من `paths.js`**،
ويصلهما الوصلُ قطعةً واحدة كما تقضي القاعدة. **وهو عينُ أمر المالك**: الكلُّ ينبع
من الحروف المعتمَدة.

## والمتغيّراتُ: جسمُها من `paths.js` وعلامتُها من إيماءتها

`أ` و`إ` **جسمُهما ألفٌ** و`ة` **جسمُها هاء** — فتُؤخذ أجسامُها من `paths.js`
وتُنزَّل عليها همزتُها/نقطُها من قانونيّ المتغيّر (نظيرُ «أختان بجسمٍ واحد»).
**و`ء` وحدَها لا جسمَ لها في الهجاء** فتبقى على قانونيّها بعلّةٍ معلَنة.
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
sys.path.insert(0, str(TOOLS))
import check_paths  # noqa: E402  (سماحةُ المحرّك تُقرأ من `pen.js` بموضعٍ واحد)
import line_layer  # noqa: E402  (خطوةُ المحرّك وكشفُ الطيّة والمرور — عدّةٌ واحدة)

ANCHORS = TOOLS / "path_anchors.json"
CURRICULUM = ROOT / "app" / "js" / "curriculum.js"
PATHS_JS = ROOT / "app" / "js" / "paths.js"
WORD_JS = ROOT / "app" / "js" / "word_paths.js"
FORMS = ["isolated", "initial", "medial", "final"]

# **الأجسامُ المشتركة**: المتغيّرُ جسمُه حرفٌ في `paths.js` وعلامتُه من إيماءته —
# لا اشتقاقَ شكلٍ ولا بناءَ حرف. و`ء` ليست في الجدول: لا جسمَ لها في الهجاء.
BODY_OF = {"أ": "ا", "إ": "ا", "آ": "ا", "ة": "ه", "ى": "ي"}

HARAKA = re.compile(r"[ً-ْٰ]")


def stamp(base: str) -> str:
    """بصمةُ دفعة القياس — العدّةُ وإيماءاتُها ومادّتُها؛ والحروفُ لا تدخلها.

    **وعلّتُه**: القياسُ خيالُ الكلمة المُشكَّل وحدَه، **ولا يمسّه تبدّلُ حرف** —
    فلو دخلت بصمةُ `paths.js` لأُعيد قياسُ ٨٩٠ كلمةً كلَّما تبدّل حرفٌ واحد،
    والتركيبُ وحدَه هو الذي يُعاد. **وبصمةُ الحروف موضعُها الوحدةُ المكتوبة.**
    """
    return base


# ————— قراءةُ المصادر —————

def paths_of() -> dict:
    src = PATHS_JS.read_text(encoding="utf-8")
    return json.loads(re.search(r"export const PATHS = (\{.*?\n\});", src, re.S).group(1))


def paths_sha() -> str:
    """**بصمةُ `paths.js` نفسِه** — بند ك١/٣.

    وكانت بصمةُ الكلمات بصمةَ `path_anchors.json` (الإيماءات)، **فيومَ صار الشكلُ
    يأتي من يد المالك (ص٦) بقيت صحيحةً والحروفُ تبدّلت كلُّها** — فبقي الفحصُ
    الذاتيُّ أخضرَ وأعمى. **ومنذ اليوم تتبع الحروفَ**: تبديلُ حرفٍ واحدٍ بلا إعادة
    بناء الكلمات **يحمرّ من نفسه**.
    """
    body = re.search(r"export const PATHS = \{.*?\n\};", PATHS_JS.read_text(encoding="utf-8"), re.S)
    return hashlib.sha1(body.group(0).encode("utf-8")).hexdigest()[:12]


def joins_of() -> dict:
    """`{حرف: أيوصل بما بعده}` — من `curriculum.js` لا من قائمةٍ تشيخ في شيفرة."""
    src = CURRICULUM.read_text(encoding="utf-8")
    out = {}
    for name in ("LETTERS", "VARIANTS"):
        block = re.search(rf"export const {name} = (\{{.*?\n\}});", src, re.S)
        if block:
            for ch, info in json.loads(block.group(1)).items():
                out[ch] = bool(info.get("joins"))
    return out


# ————— هندسةٌ صغيرة —————

def bbox(points: list) -> dict:
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return {"x0": min(xs), "x1": max(xs), "y0": min(ys), "y1": max(ys),
            "w": max(xs) - min(xs), "h": max(ys) - min(ys),
            "cx": (min(xs) + max(xs)) / 2, "cy": (min(ys) + max(ys)) / 2}


def shape_points(ref: dict) -> list:
    return [p for s in ref["strokes"] for p in s["points"]] + [d["at"] for d in ref.get("dots", [])]


def median(values: list) -> float:
    got = sorted(values)
    n = len(got)
    if not n:
        return 1.0
    return got[n // 2] if n % 2 else (got[n // 2 - 1] + got[n // 2]) / 2


# ————— **ضربتا الجريان**: المقعدُ والمخرج — تُقاسان ولا تُسمَّيان بحرفٍ —————

def seat_stroke(ref: dict, base: float, count: int) -> int:
    """الضربةُ التي **يدخل** فيها القلمُ من الحرف قبله — أقربُ مبدأٍ إلى خطّ الأساس."""
    return min(range(count), key=lambda i: abs(ref["strokes"][i]["points"][0][1] - base))


def exit_stroke(ref: dict, base: float, count: int) -> int:
    """الضربةُ التي **يخرج** منها القلمُ إلى ما بعده — أقربُ منتهىً إلى خطّ الأساس."""
    return min(range(count), key=lambda i: abs(ref["strokes"][i]["points"][-1][1] - base))


# ————— تفكيكُ الكلمة إلى وحداتٍ من الحروف المعتمَدة —————

def expand(units: list) -> list:
    """🔴 **لام-ألف حرفٌ مركّبٌ معتمَدٌ بذاته** (أمر المالك ٢٤ أغسطس ٢٠٢٦ —
    «لا تُكتب لـا» — بعد أن بلغ تركيبُها من ضربتي ل وا حدَّه بعين المالك):
    رُسمت إيماءتُها على هيكل خيالها كسائر الحروف (`path_anchors.json: لا`)
    ودخلت `paths.js` بشكلَيها — **فلا تفكيكَ بعد اليوم**: وحدةُ `liga` تمرّ
    كما هي ويجدها `source_of` حرفاً كاملاً، ورفعُ القلم بين ساقيها داخلَ
    الحرف يعدّه قانونُ القطع (جزآن في المرجع)."""
    out = []
    for unit in units:
        if unit.get("kind") == "liga" and unit["text"] == "لا":
            form = "final" if unit["form"] in ("medial", "final") else "isolated"
            out.append({**unit, "kind": "letter", "form": form,
                        "marks": unit.get("marks") or [], "extras": unit.get("extras") or []})
        else:
            out.append(dict(unit))
    return out



def source_of(unit: dict, paths: dict, canon: dict) -> dict:
    """قانونيُّ الوحدة: **من `paths.js`** إن كان لها فيه شكلٌ أو جسمٌ مشترك.

    ويعيد `{ref, bodyN, frame, marks, why}` — و`frame == 'ghost'` وحدَها هي التي
    بقيت على الخيال، وتُعَدّ وتُعلَن في نسب الوحدة.
    """
    ch, form = unit["text"], unit["form"]
    if ch in paths and form in paths[ch]:
        ref = paths[ch][form]
        return {"ref": ref, "bodyN": len(ref["strokes"]), "frame": "line",
                "marks": [], "dots": ref.get("dots", []), "why": None}
    kin = BODY_OF.get(ch)
    entry = (canon.get(ch) or {}).get(form)
    if kin and kin in paths and form in paths[kin] and entry:
        # **جسمُه حرفٌ معتمَد وعلامتُه من إيماءته** — تُنزَّل عليه بصندوقه، فتتبع
        # الجسمَ المعتمَد حجماً وموضعاً (نظيرُ «أختان بجسمٍ واحد»: `ض` من `ص`).
        body = paths[kin][form]
        ghost = entry["ref"]
        gbody = bbox([p for s in ghost["strokes"][:entry["bodyStrokes"]] for p in s["points"]])
        return {"ref": body, "bodyN": len(body["strokes"]), "frame": "line",
                "marks": ghost["strokes"][entry["bodyStrokes"]:], "borrowed": True,
                "dots": ghost.get("dots", []), "why": None}
    if entry:
        ghost = entry["ref"]
        return {"ref": ghost, "bodyN": entry["bodyStrokes"], "frame": "ghost",
                "gbox": entry["body"], "marks": ghost["strokes"][entry["bodyStrokes"]:],
                "borrowed": True, "dots": ghost.get("dots", []),
                "why": f"«{ch}/{form}» لا جسمَ لها في `paths.js` — بقيت على الخيال"}
    raise KeyError(f"لا قانونيَّ لوحدة «{ch}/{form}»")


# ————— التركيب —————

def fit_map(frm: dict, to: dict):
    """تنزيلُ صندوقٍ على صندوق — مقياسٌ واحدٌ لبُعديه فلا تشويهَ نِسَبٍ داخله.

    **ومقياسٌ واحدٌ متوسّطٌ لبُعديه** — عينُ `fitTransform` في عدّة التأليف: أخذُ
    بُعدٍ واحدٍ يقصّ الآخَر، فتتقارب بدايتا شدّةٍ وحركتها حتى لا يفرّقهما المحرّك
    (قِيس على «سُكَّرْ»: ٦٤ والحدُّ ٧٠).
    """
    parts = [to["w"] / frm["w"]] if frm["w"] > 1e-6 else []
    if frm["h"] > 1e-6:
        parts.append(to["h"] / frm["h"])
    s = sum(parts) / len(parts) if parts else 1.0
    return lambda p: [to["cx"] + (p[0] - frm["cx"]) * s,
                      to["cy"] + (p[1] - frm["cy"]) * s]


def union(boxes: list) -> dict:
    return bbox([[b["x0"], b["y0"]] for b in boxes] + [[b["x1"], b["y1"]] for b in boxes])


def compose(text: str, meas: dict, paths: dict, canon: dict, marks_lib: dict,
            base: float, cell: float, margin: float, tol: dict) -> dict:
    units = expand(meas["units"])
    gline = meas["line"]
    notes = []

    for unit in units:
        unit["src"] = source_of(unit, paths, canon)
        # **قصُّ ذراع الوصل للامِ لام-ألف — بالقياس لا بالثابت**: الذراعُ هي
        # المدى المنبسطُ الأخير من ضربتها (يسيرُ يساراً وميلُه ≤ ٠٫١٢ — قِيس
        # من ذيلها: مقاطعُ الذراع ميلُها ~٠٫٠٢–٠٫٠٤ وأولُ منحنى الكأس ٠٫١٧)،
        # فتبقى قدمٌ قصيرة تلقاها الألف — كلوح المرجع.
        # **وذراعُ ألف الوصل تُقصّ من مبدئها** (بلاغُ المالك: «لا تكتبها لـا»):
        # ألفُ النهاية تبدأ بمدٍّ أفقيٍّ على السطر (٣١٤ وحدةً مقيسة) هو ذراعُ
        # وصلها بما قبلها — وهو بعينه ما يُري «لـا». فتُقصّ بالقاعدة نفسِها.
        if False and unit.get("liga") == "alef":  # (بطل مع اعتماد «لا» حرفاً)
            ref = unit["src"]["ref"]
            strokes = [dict(st) for st in ref["strokes"]]
            pts = [list(q) for q in strokes[0]["points"]]
            while len(pts) > 3:
                (x1, y1), (x2, y2) = pts[0], pts[1]
                dx, dy = x2 - x1, y2 - y1
                if dx < 0 and abs(dy) <= 0.12 * abs(dx):
                    pts.pop(0)
                else:
                    break
            strokes[0] = {**strokes[0], "points": pts}
            unit["src"] = {**unit["src"], "ref": {**ref, "strokes": strokes}}
        if False and unit.get("liga") == "lam":  # (بطل مع اعتماد «لا» حرفاً)
            ref = unit["src"]["ref"]
            strokes = [dict(st) for st in ref["strokes"]]
            pts = [list(q) for q in strokes[0]["points"]]
            while len(pts) > 3:
                (x1, y1), (x2, y2) = pts[-2], pts[-1]
                dx, dy = x2 - x1, y2 - y1
                if dx < 0 and abs(dy) <= 0.12 * abs(dx):
                    pts.pop()
                else:
                    break
            strokes[0] = {**strokes[0], "points": pts}
            unit["src"] = {**unit["src"], "ref": {**ref, "strokes": strokes}}

    # ١) **مقياسُ الخيال إلى السطر — يُقرأ من الوصل نفسِه لا من حجم الحبر**.
    #
    # **وعلّةُ ذلك مقيسة**: صندوقُ الوحدة في الخيال **صندوقُ حبرٍ**، ومسارُنا
    # **خطُّ وسطِ الحبر** — فنسبةُ ارتفاعيهما أصغرُ من الحقّ بقدر عرض القلم، فتقصُر
    # إزاحةُ الحركة عن حرفها حتى تركب نقطتَه (**«جِسْرْ»**: الكسرةُ على ٣٣ من نقطة
    # الجيم، وحقُّها فوق ١٢٠). **والمسافةُ بين مركزي حرفين لا يمسّها عرضُ القلم** —
    # فتُقاس: كم بينهما في السطر (يقوله الوصلُ: مقعدُ الثاني على مخرج الأول) وكم
    # بينهما في الخيال، **وخارجُ القسمة هو المقياس**. ووسيطاً لا متوسّطاً.
    ratios = []
    for k in range(1, len(units)):
        cur, prev = units[k], units[k - 1]
        if cur["form"] not in ("medial", "final"):
            continue
        if not cur.get("box") or not prev.get("box"):
            continue
        if cur["src"]["frame"] != "line" or prev["src"]["frame"] != "line":
            continue
        a = bbox([p for st in prev["src"]["ref"]["strokes"] for p in st["points"]])
        b = bbox([p for st in cur["src"]["ref"]["strokes"] for p in st["points"]])
        out = prev["src"]["ref"]["strokes"][
            exit_stroke(prev["src"]["ref"], base, prev["src"]["bodyN"])]["points"][-1]
        seat = cur["src"]["ref"]["strokes"][
            seat_stroke(cur["src"]["ref"], base, cur["src"]["bodyN"])]["points"][0]
        far = abs((b["cx"] + out[0] - seat[0]) - a["cx"])
        ghost = abs(cur["box"]["cx"] - prev["box"]["cx"])
        if far > 1 and ghost > 1:
            ratios.append(far / ghost)
    # **والرأسيُّ لا يُقاس بالوصل**: الوصلُ أفقيٌّ محض، **وحروفُنا أعرضُ من خيال
    # المُشكِّل** (ألفُ الوصل عندنا تميل ٥٢٢ وحدةً في ٨٦٥، وفي الخيال ١٨٠ في ٦٢٤) —
    # فلو قِيس الرأسيُّ بالأفقيّ لطارت السكونُ فوق حرفها. **فالارتفاعُ بالارتفاع**:
    # نسبةُ مدى الشكل المعتمَد إلى مدى جسده في الخيال — وهي نسبةُ المشروع نفسِها
    # (`line_layer.seat` يُجلس **مدى المسار** على `up+down` المقيسين من حبر المرجع).
    # **وعرضُ القلم يُطرَح ولا يُقدَّر**: مدى الحبر في الخيال = مدى المسار ÷ المقياس
    # **زائداً عرضَ القلم** — وهو واحدٌ لحروف الكلمة كلِّها (خطٌّ واحدٌ بمقاسٍ واحد).
    # فمعادلتان في مجهولين، **يحلّهما ميلُ المستقيم** على أزواج الكلمة: الميلُ مقلوبُ
    # المقياس والمقطعُ عرضُ القلم. **ولولا ذلك لَنقَص المقياسُ نحو الثلث** فتقاربت
    # بدايتا الشدّة وحركتها (٦٥ والحدُّ ٧٠).
    pairs = []
    for unit in units:
        box = unit.get("box")
        if not box or unit["src"]["frame"] != "line" or box["h"] <= 0:
            continue
        own = bbox([p for st in unit["src"]["ref"]["strokes"] for p in st["points"]])
        if own["h"] > 0:
            pairs.append((own["h"], box["h"]))
    sy = None
    plain = median([a / b for a, b in pairs]) if pairs else 1.0
    if len(pairs) >= 3:
        lows = [b for _, b in pairs]
        # **الميلُ وسيطُ ميولِ الأزواج** (ثايل-سِن): حرفٌ شذَّ لا يجرّ المستقيمَ معه
        slopes = [(b2 - b1) / (a2 - a1) for i, (a1, b1) in enumerate(pairs)
                  for (a2, b2) in pairs[i + 1:] if abs(a2 - a1) > 1e-6]
        if slopes:
            slope = median(slopes)
            free = median([b - slope * a for a, b in pairs])
            # **وحدُّ القبول من المادّة**: عرضُ القلم موجبٌ، ودون نصفِ أقصر حبرٍ في
            # الكلمة (وإلّا فالشكلُ كلُّه عرضُ قلمٍ ولا مسارَ فيه) — والمقياسُ
            # لا يقلّ عن نسبة الحبر، فالانحيازُ ينقص ولا يزيد.
            if slope > 1e-6 and 0 <= free <= 0.5 * min(lows) and 1.0 / slope >= plain:
                sy = 1.0 / slope
    if sy is None:
        sy = plain
    sx = median(ratios) if ratios else sy
    scale = sx

    def to_line(x, y):
        """من إحداثيّ الخيال إلى إطار السطر — والأساسُ على الأساس."""
        return [x * sx, base + (y - gline) * sy]

    # ٢) **الوضع**: كلُّ حرفٍ بحجمه وارتفاعه، والإزاحةُ أفقيّةٌ وحدَها.
    shift = 0.0
    for k, unit in enumerate(units):
        src = unit["src"]
        ref = src["ref"]
        if src["frame"] == "ghost":
            gb = src["gbox"]
            box = unit.get("box") or gb
            sv = ((sx * box["w"] / max(gb["w"], 1e-6))
                  + (sy * box["h"] / max(gb["h"], 1e-6))) / 2
            tx, ty = to_line(box["cx"], box["cy"])
            unit["put"] = (lambda gb=gb, sv=sv, tx=tx, ty=ty:
                           (lambda p: [tx + (p[0] - gb["cx"]) * sv, ty + (p[1] - gb["cy"]) * sv]))()
            unit["fit"] = {"box": gb, "s": sv, "cx": gb["cx"], "cy": gb["cy"], "tx": tx, "ty": ty}
        else:
            own = bbox([p for s in ref["strokes"] for p in s["points"]])
            dx = (to_line(unit["box"]["cx"], unit["box"]["cy"])[0] - own["cx"]) if unit.get("box") else 0.0
            unit["put"] = (lambda dx=dx: (lambda p: [p[0] + dx, p[1]]))()
            unit["own"] = own
        strokes = [[unit["put"](p) for p in s["points"]] for s in ref["strokes"]]
        unit["placed"] = strokes
        unit["seat"] = seat_stroke(ref, base, src["bodyN"])
        unit["exit"] = exit_stroke(ref, base, src["bodyN"])

        # **والوصلُ يصحّح الوضع**: مقعدُ الموصول على مخرج ما قبله بحرفه.
        # 🔴 **والإزاحةُ لا تتسرّب** (بلاغُ المالك ٢٤ أغسطس بلقطة «سَلَامْ دَرَسْ»:
        # «جد حلاً جذرياً لتداخل الكلمات»): كانت `shift` تبقى على قيمتها فيرثها
        # كلُّ حرفٍ غيرِ موصولٍ بعدها — فتُدفَع بقيّةُ الكلمة والكلمةُ التالية
        # عن مواضع القياس فتتراكبان. **والقاعدة**: الموصولُ يجلس على مخرج ما
        # قبله، **وغيرُ الموصول يجلس حيث قاسه المُشكِّل بلا إرث** (صفرُ إزاحة).
        # (وألفُ لام-ألف تجلس على قدم اللام وإن كانت قطعةً ثانيةً في الرسم.)
        # **والإزاحةُ جاريةٌ داخل الكلمة، تُصفَّر عند حدّها**: تصحيحُ الوصل
        # يسري على بقيّة حروف الكلمة (وإلا انفكّ ما بعده عمّا قبله — أمسكه
        # حارسُ البنية على «أُخْتِي…»)، **ولا يعبر المسافة أبداً** (وعبورُه هو
        # الذي راكب «سَلَامْ» و«دَرَسْ»). و`wordEnd` من بيان المُشكِّل نفسِه.
        if k > 0 and units[k - 1].get("wordEnd"):
            shift = 0.0
        # 🔴 **فرجةُ القاطع تُرى بالعين لا بالهندسة** (بلاغُ المالك ٢٤ أغسطس:
        # «الدال ما زال مربوطاً»): القياسُ الطباعيّ يترك بين القاطع وتاليه
        # فجوةً قد تضيق عن **عرض حبر الطفل** (قِيست: د–ر في «دَرَسْ» ٣٦ وحدةً
        # وعرضُ الحبر ٢٦ × ٢١٦٤/١٠٠٠ ≈ ٥٦) فيتلامس الحبران وتُقرأ موصولة.
        # فبعد قاطعٍ في الكلمة نفسِها تُضمن فرجةُ حبرٍ كاملة — والزيادةُ تجري
        # مع الإزاحة فلا يختلّ ما بعدها.
        INK_W = 26 * 2164 / 1000          # عرضُ حبر خلية الحرف — من ثوابت العرض
        if k > 0 and not units[k - 1].get("wordEnd") and unit["form"] in ("isolated", "initial")                 and not unit.get("liga"):
            prev_min = min(q[0] for st in units[k - 1]["placed"] for q in st)
            cur_pts = [q[0] + shift for st in strokes for q in st]
            gap = prev_min - max(cur_pts)
            if gap < INK_W:
                shift -= (INK_W - gap)
        seated = unit["form"] in ("medial", "final") and k > 0
        if seated:
            prev = units[k - 1]
            want = prev["placed"][prev["exit"]][-1][0]
            got = strokes[unit["seat"]][0][0]
            shift = want - got
        if shift:
            unit["placed"] = [[[p[0] + shift, p[1]] for p in s] for s in strokes]
        unit["dx"] = shift

    def put(unit, p):
        return [unit["put"](p)[0] + unit["dx"], unit["put"](p)[1]]

    def anchor(unit):
        """**العلامةُ تركب حرفَها لا الصفحة**: إزاحتُها عن جسده في الخيال، مقيسةً
        بمقياسه، من جسده **بعد وضعه** — فما حرّكه الوصلُ حرّك علامتَه معه.

        **وأمسكه `check_paths`**: لمّا قِيست العلامةُ من إطار الخيال وحدَه بقيت في
        موضعها والحرفُ ينزاح، فتقاربت بداياتُ الضربات حتى صار المحرّكُ لا يفرّقها
        (١٤٦ مخالفةً في أوّل بناء).
        """
        box = unit.get("box")
        own = bbox([q for st in unit["placed"] for q in st])
        if not box:
            return lambda gx, gy: [own["cx"], own["cy"]]
        return lambda gx, gy: [own["cx"] + (gx - box["cx"]) * sx,
                               own["cy"] + (gy - box["cy"]) * sy]

    # ٣) **القطعُ بالقاعدة**: الجريانُ يمضي عبر الوصل، وما سواه رفعُ قلم.
    flow = []
    aside = []
    marks = []
    dots = []
    open_run = None
    for k, unit in enumerate(units):
        src = unit["src"]
        placed = unit["placed"]
        lo, hi = unit["seat"], unit["exit"]
        if unit["form"] in ("isolated", "initial"):
            lo = 0
        if unit["form"] in ("isolated", "final"):
            hi = lo
        run = list(range(min(lo, hi), max(lo, hi) + 1))
        # **وألفُ لام-ألف تُقطع قطعةً ثانية** (`cut` — الرفعُ البنيويّ داخل
        # المركّب): تجلس بمقعدها ولا تُدمج جرياناً.
        # (الجريانُ يُقطع عند ألف لام-ألف وإن جلست على القدم — رفعُ قلمٍ بنيويّ)
        tied = unit["form"] in ("medial", "final") and k > 0
        for j, idx in enumerate(run):
            if j == 0 and tied and open_run is not None:
                open_run += placed[idx]
            else:
                if open_run is not None:
                    flow.append(open_run)
                open_run = list(placed[idx])
        for idx in range(src["bodyN"]):
            if idx not in run:
                aside.append(list(placed[idx]))
        if unit["form"] in ("isolated", "final"):
            if open_run is not None:
                flow.append(open_run)
            open_run = None

        # ٤) زوائدُ الحرف — **نقطُ الحرف المعتمَد من شكله بعينه** (وفيها حكمُ
        #    المالك في فرجة النقطة، `STROKE_ORDER §٩`)، **وزوائدُ المتغيّر بموضعها
        #    المقيس من الخيال**: همزةُ الألف ونقطُ التاء المربوطة أجرامٌ يقولها
        #    المُشكِّلُ، فتُقرأ ولا تُقدَّر (كما تُقرأ الحركة سواءً بسواء).
        mine = []
        if src["frame"] == "line" and not src.get("borrowed"):
            for dot in src["dots"]:
                mine.append({"at": put(unit, dot["at"]),
                             "count": int(dot.get("count", 1)), "after": True})
            dots += mine
        else:
            spots = unit.get("extras") or []
            want = sum(int(d.get("count", 1)) for d in src["dots"])
            if want and len(spots) != want:
                notes.append(f"«{unit['text']}/{unit['form']}»: أجرامُ زوائده في الخيال"
                             f" {len(spots)} ونقطُ قانونيّه {want}")
            onto = anchor(unit)
            for spot in spots[:want]:
                mine.append({"at": onto(spot["cx"], spot["cy"]), "count": 1, "after": True})
            dots += mine
        if src.get("marks"):
            spots = unit.get("extras") or []
            if not spots:
                notes.append(f"«{unit['text']}/{unit['form']}»: لا جرمَ لهمزته في الخيال")
            else:
                frame = bbox([p for st in src["marks"] for p in st["points"]])
                seen = union(spots)
                cx, cy = anchor(unit)(seen["cx"], seen["cy"])
                # **وحجمُ العلامة يتبع حرفَها لا عرضَ الكلمة**: مقياسٌ رأسيٌّ
                # لبُعديها (فحروفُنا أعرضُ من الخيال، ولو كبُرت العلامةُ عرضاً
                # لَتقاربت بداياتُها — قِيس على «سُكَّرْ»: ٣٦ وحدةً بين شدّةٍ وضمّة).
                onto = fit_map(frame, {"cx": cx, "cy": cy,
                                       "w": seen["w"] * sy, "h": seen["h"] * sy})
                for stroke in src["marks"]:
                    marks.append([onto(p) for p in stroke["points"]])

        # ٥) **ولا ضربةَ علامةٍ ألبتّة** — حكمُ المالك (١٩ أغسطس ٢٠٢٦):
        #    «**لا تُعرَض ولا تُطلَب**». **وحجّتُه بنيةٌ لا تسامح**: الكتابةُ العربيةُ
        #    الحقيقيةُ غيرُ مشكولة — الكبارُ يكتبون «محفظة» لا «مِحْفَظَةْ». فالقراءةُ
        #    مشكولةٌ للمبتدئ (شأنُ اقرأ) **والكتابةُ عارية** (شأنُنا) — قسمةُ عملٍ لا
        #    انكسار. **والمصدرُ يبقى مشكولاً في البنك**: نخزّن المشكولَ ونعرض المجرَّد،
        #    فيبقى الصوتُ والنسبُ إلى اقرأ سليمين.
        #    ⇐ **وبه تصير قاعدةُ القطع صافية**: عددُ القطع قطعُ الجسم، لا علاماتٍ معها.
        #    **وهمزةُ `أ` و`إ` ليست علامةَ تشكيل** — هي من رسم الحرف، تبقى.

    if open_run is not None:
        flow.append(open_run)

    # ٦) **خطوةُ المحرّك والطيّةُ والمرورُ تُعاد على المسار كلِّه** — كما في الحرف
    #    سواءً بسواء، بسماحة الكلمة التي ستُحكَم بها (`line_layer.restep`).
    wtol = line_layer.scaled(tol, 1.0)
    strokes = [line_layer.restep(pts, wtol) for pts in flow + aside + marks]

    # ٧) الصندوق: الخليّةُ ارتفاعاً والعرضُ من المادّة — والسطرُ سطرُ الحروف.
    pts = [p for s in strokes for p in s["points"]] + [d["at"] for d in dots]
    span = bbox(pts)
    x0 = span["x0"] - margin
    y_low = min(0.0, span["y0"] - margin)
    height = max(cell, span["y1"] + margin - y_low)
    for stroke in strokes:
        stroke["points"] = [[round(p[0] - x0, 1), round(p[1] - y_low, 1)] for p in stroke["points"]]
        stroke["start"] = list(stroke["points"][0])
    for dot in dots:
        dot["at"] = [round(dot["at"][0] - x0, 1), round(dot["at"][1] - y_low, 1)]
    ref = {"strokes": strokes, "dots": dots,
           "line": round(base - y_low, 1), "tolerance": 1.0,
           "box": [round(span["x1"] + margin - x0, 1), round(height, 1)]}
    if notes:
        ref["notes"] = notes
    ghosts = sorted({u["src"]["why"] for u in units if u["src"]["why"]})
    return {"ref": ref, "units": units, "scale": round(sx, 4), "tall": round(sy, 4),
            "ghosts": ghosts,
            "pieces": len(flow), "aside": len(aside), "marks": len(marks)}


# ————— **حارسُ الوصل**: قطعُ كلِّ كلمةٍ تُقابَل بالقاعدة —————
#
# **وهو الحارسُ الذي لو كان موجوداً لما وقع هذا** (بند ك١/٤): كُتب في معايير قبول
# ستِّ جلساتٍ شرطُ «صفرُ كلمةٍ انكسرت قطعتُها» — **وهو يقيس ألّا تنكسر الكلماتُ
# القديمة، لا أن تكون مبنيّةً من الجديد**. فصار المقياسُ هنا **القاعدةَ نفسَها**:
# عددُ ضربات الكلمة يُحسَب من نصِّها ومن `paths.js` **قبل أن تُقرأ الوحدة**، فما
# خالف حَمِرَ باسمه.

def expected(text: str, paths: dict, joins: dict, anchors: dict) -> dict:
    """عددُ الضربات الذي **توجبه القاعدة** لهذا النصّ — وأصنافُها مسمّاة."""
    chars = list(text)
    flows = 0
    inner = 0
    marks = 0
    words = []
    current = []
    for i, ch in enumerate(chars):
        if ch == " ":
            if current:
                words.append(current)
            current = []
        elif not HARAKA.match(ch):
            current.append(i)
        # **والحركةُ لا تُعَدّ**: لا ضربةَ علامةٍ في مسار كلمة (حكمُ المالك ١٩ أغسطس
        # ٢٠٢٦: «لا تُعرَض ولا تُطلَب») — فقاعدةُ القطع صافيةٌ لقطع الجسم وحدَها.
    if current:
        words.append(current)

    for word in words:
        k = 0
        while k < len(word):
            ch = chars[word[k]]
            prev = chars[word[k - 1]] if k else None
            tied = prev is not None and joins.get(prev, False)
            pair = (ch == "ل" and k + 1 < len(word) and chars[word[k + 1]] == "ا")
            seq = [("لا", "final" if tied else "isolated")] if pair else None
            if seq is None:
                nxt = k + 1 < len(word)
                form = ("medial" if tied and joins.get(ch) and nxt else
                        "final" if tied else
                        "initial" if joins.get(ch) and nxt else "isolated")
                seq = [(ch, form)]
            for j, (unit_ch, form) in enumerate(seq):
                if form in ("isolated", "initial"):
                    flows += 1
                body, extra = unit_strokes(unit_ch, form, paths, anchors)
                inner += body - 1
                marks += extra
            # (رفعةُ لام-ألف الداخلية صارت من جزأي مرجعها نفسِه — `body - 1`)
            k += 2 if pair else 1
    return {"flows": flows, "inner": inner, "marks": marks,
            "total": flows + inner + marks}


def unit_strokes(ch: str, form: str, paths: dict, anchors: dict) -> tuple:
    """`(ضرباتُ الجسم، ضرباتُ علامته)` — من `paths.js` أو من إيماءة المتغيّر."""
    if ch in paths and form in paths[ch]:
        return len(paths[ch][form]["strokes"]), 0
    kin = BODY_OF.get(ch)
    entry = (anchors.get("variants") or {}).get(ch, {}).get(form) \
        or (anchors.get("ligatures") or {}).get(ch, {}).get(form) or {}
    if entry.get("sameAs"):
        entry = ((anchors.get("variants") or {}).get(ch, {}) or
                 (anchors.get("ligatures") or {}).get(ch, {})).get(entry["sameAs"], {})
    extra = len(entry.get("marks") or [])
    if kin and kin in paths and form in paths[kin]:
        return len(paths[kin][form]["strokes"]), extra
    return len(entry.get("strokes") or [[]]), extra


def audit(words: dict = None, paths: dict = None) -> list:
    """شكاوى الحارس — قائمةٌ فارغةٌ إن وافقت كلُّ كلمةٍ قاعدةَ المالك."""
    paths = paths or paths_of()
    words = words if words is not None else load_words()
    if not words:
        return []
    joins = joins_of()
    anchors = json.loads(ANCHORS.read_text(encoding="utf-8"))
    bad = []
    for text, ref in words.items():
        want = expected(text, paths, joins, anchors)
        got = len(ref.get("strokes") or [])
        if got != want["total"]:
            extra = got - want["total"]
            why = " — ومن العلامات ضرباتٌ لا تُبنى" if extra > 0 and HARAKA.search(text) else ""
            bad.append(f"«{text}»: قطعُها {got} وقاعدةُ الوصل توجب {want['total']}"
                       f" (جريان {want['flows']} · داخلَ الحرف {want['inner']}"
                       f" · همزاتٌ {want['marks']}){why}")
    return bad


def load_words() -> dict:
    if not WORD_JS.exists():
        return {}
    src = WORD_JS.read_text(encoding="utf-8")
    body = re.search(r"export const WORD_PATHS = (\{.*?\n\});", src, re.S)
    return json.loads(body.group(1)) if body else {}


# ————— كتابةُ الوحدة —————

def build(paths: dict, parts: list, head: dict, out: Path, tool: str) -> int:
    """يركّب الكلماتِ كلَّها ويكتب `word_paths.js` — أو يسقط بشكواه."""
    import make_paths

    canon = head.get("canon") or {}
    marks_lib = head.get("marks") or {}
    shapes = {}
    failed = []
    for part in parts:
        shapes.update(part.get("shapes") or {})
        failed += part.get("failed") or []
    total = int(head.get("total") or 0)

    sp = json.loads((TOOLS / "line_seating.json").read_text(encoding="utf-8"))["spec"]
    base, cell, margin = sp["base"], sp["cell"], sp["margin"]
    tol = check_paths.load_tolerance()

    words = {}
    broke = []
    ghosts = {}
    steps = []
    for text, meas in shapes.items():
        try:
            got = compose(text, meas, paths, canon, marks_lib, base, cell, margin, tol)
        except Exception as exc:                                  # noqa: BLE001
            broke.append(f"«{text}»: {exc}")
            continue
        words[text] = got["ref"]
        for why in got["ghosts"]:
            ghosts[why] = ghosts.get(why, 0) + 1
        for stroke in got["ref"]["strokes"]:
            pts = stroke["points"]
            if len(pts) > 1:
                steps.append(line_layer.owner_layer.poly_len(pts) / (len(pts) - 1))
    if broke:
        for line in broke[:12]:
            print(f"  ✗ لم تُركَّب — {line}")
        print(f"{len(broke)} كلمةً لم تُركَّب — لا تُكتب وحدةٌ ناقصة.")
        return 1

    kinds = {}
    for text, meas in shapes.items():
        kinds[meas.get("kind", "word")] = kinds.get(meas.get("kind", "word"), 0) + 1
    print(f"\n🧩 رُكِّبت {len(words)} وحدةَ نسخٍ من {total}"
          f" ({' · '.join(f'{k} {v}' for k, v in sorted(kinds.items()))})"
          f" · وتعذّر قياسُ {len(failed)}")
    print(f"   وخطوةُ العيّنة في الكلمات: وسيطُها {median(steps):.1f}"
          f" (وأقصاها {max(steps):.1f})")
    if ghosts:
        for why, n in sorted(ghosts.items()):
            print(f"   ○ {why} — في {n} وحدة")

    # **ضرباتُ العلامات: كم كانت وكم صارت** (حكمُ المالك ١٩ أغسطس ٢٠٢٦) — والعددُ
    # القديمُ يُحسَب من المادّة نفسِها: كلُّ حركةٍ في نصٍّ كانت ضربةً بإيماءتها.
    anchors = json.loads(ANCHORS.read_text(encoding="utf-8"))
    was = sum(len(((anchors.get("marks") or {}).get(ch) or {}).get("strokes") or [])
              for text in words for ch in text if HARAKA.match(ch))
    now = sum(1 for ref in words.values() for st in ref["strokes"] if st.get("mark"))
    print(f"✒️  ضرباتُ العلامات في وحدة النسخ: {was} ⇐ {now}"
          " — «لا تُعرَض ولا تُطلَب» (والمصدرُ يبقى مشكولاً في البنك)")

    bad = audit(words, paths)
    print(f"🔗 حارسُ الوصل على {len(words)} وحدة: "
          + ("أخضر — لا كلمةَ تخالف قاعدة المالك" if not bad else f"{len(bad)} مخالفة"))
    for line in bad[:15]:
        print(f"   ✗ {line}")
    if bad:
        return 1

    meta = {
        "tool": "tools/make_paths.html?part=measure + tools/word_layer.py",
        "paths": paths_sha(),
        "gesture": "tools/path_anchors.json",
        "sha": make_paths.sha(),
        "curriculum": make_paths.material_sha(),
        "grid": sp["cell"],
        "line": sp["base"],
        "font": "NotoNaskhArabic — نسخٌ مدرسيّ (ق٢)",
        "why": "الكلُّ ينبع من الحروف المعتمَدة (أمرُ المالك ١٩ أغسطس ٢٠٢٦):"
               " المسارُ من `paths.js` بعينه على سطره ونسبته، والخيالُ يعطي"
               " المواضعَ وحدَها. والقطعُ بقاعدة الوصل الجامعة — موضعان لا ثالثَ لهما.",
    }
    glyphs = {mark: lib["glyph"] for mark, lib in marks_lib.items()}
    out.write_text(make_paths.write_words(words, glyphs, meta), encoding="utf-8")
    print(f"\nكُتب {out.relative_to(ROOT)}: {len(words)} مساراً للنسخ")
    return 0


def self_test() -> int:
    rows = []

    def ok(good, msg):
        rows.append((bool(good), msg))

    paths = paths_of()
    joins = joins_of()
    anchors = json.loads(ANCHORS.read_text(encoding="utf-8"))
    ok(joins.get("ئ") is True, "و`ئ` تصل بخلاف `ؤ` — القائمةُ من `curriculum.js` لا من يد")
    ok(joins.get("د") is False and joins.get("ر") is False,
       "والقواطعُ تُقرأ من المنهج (د · ر …) ولا تُكتب هنا")
    # قاعدةُ الوصل على أمثلةٍ يعرفها المالك بعينها
    for text, want in [("با", 1), ("ما", 1), ("نا", 1)]:
        got = expected(text, paths, joins, anchors)
        ok(got["flows"] == 1 and got["inner"] == 0,
           f"«{text}»: جريانٌ واحدٌ بلا رفعٍ داخل الحرف (قطعُ الجسم {got['flows'] + got['inner']})")
    # «لا» المفردة جزآن (رفعةٌ واحدة)، والموصولةُ ثلاثةٌ (رفعتان — الوصلُ
    # يُكمل القدمَ ثم الساقان) — من مرجعها في `paths.js` لا من عدٍّ يدويّ.
    for text, inner_want in (("لا", 1), ("سلا", 2)):
        got = expected(text, paths, joins, anchors)
        ok(got["flows"] == 1 and got["inner"] == inner_want,
           f"«{text}»: لام-ألف رسمٌ برفعاته البنيوية (قطع {got['flows']}+{got['inner']} والمنتظَر 1+{inner_want})")
    got = expected("مطر", paths, joins, anchors)
    ok(got["inner"] >= 1, "و«مطر»: عمودُ الطاء رفعٌ داخل الحرف يُعَدّ")
    ok(expected("مِحْفَظَةْ", paths, joins, anchors)["marks"] == 0,
       "و«مِحْفَظَةْ» لا تطلب ضربةَ علامةٍ واحدة — الكتابةُ عاريةٌ والقراءةُ مشكولة")
    # 🔴 **حارسُ القواطع** (بلاغُ المالك ٢٤ أغسطس: «الدالُ موصولةٌ بما بعدها —
    # راقب كلَّ الحروف التي لا توصل: و ز ر د ذ وغيرها»): بعد كل قاطعٍ **يجب**
    # أن تبدأ قطعةٌ جديدة — فأدنى عددِ قطعِ الوحدة = ١ + عددُ القواطع التي
    # يليها حرف. وهو حارسُ الظاهر الذي تراه العينُ، فوق حارس الوصل المفصَّل.
    CUTTERS = set("اآأإدذرزوةى")
    words_now = load_words()
    if words_now:
        short = []
        for text, ref in words_now.items():
            chars = [c for c in "".join(ch for ch in text if ch not in "ًٌٍَُِّْـ") if c != " "]
            need = 1 + sum(1 for i in range(1, len(chars)) if chars[i - 1] in CUTTERS)
            if len(ref.get("strokes") or []) < need:
                short.append(f"{text} ({len(ref['strokes'])}<{need})")
        ok(not short,
           f"وكلُّ قاطعٍ يقطع فعلاً في {len(words_now)} وحدةً مبنيّة"
           + (f" — مخالفات: {'، '.join(short[:5])}" if short else ""))

    words = load_words()
    if words:
        bad = audit(words, paths)
        ok(not bad, f"وحارسُ الوصل على {len(words)} وحدةً مبنيّة"
           + (f" — {len(bad)} مخالفة: {bad[0]}" if bad else ""))
        # **ومجرَّبٌ سالباً**: ضربةٌ تُدَسّ في كلمةٍ مشكولة **تحمرّ** — فما يجدّ
        # غداً من ضربة علامةٍ لا يمرّ صامتاً.
        text = next((t for t in words if HARAKA.search(t)), None)
        if text:
            hurt = dict(words)
            ref = words[text]
            hurt[text] = dict(ref, strokes=list(ref["strokes"]) + [ref["strokes"][0]])
            ok(bool(audit(hurt, paths)),
               f"ودسُّ ضربةٍ زائدة في «{text}» يحمرّ — الحارسُ مجرَّبٌ سالباً")
        # **وبصمةُ الحروف مجرَّبةٌ سالباً**: تبديلُ نقطةٍ في `paths.js` يبدّل البصمة
        got = paths_sha()
        body = re.search(r"export const PATHS = \{.*?\n\};",
                         PATHS_JS.read_text(encoding="utf-8"), re.S).group(0)
        other = hashlib.sha1(body.replace("[", "[ ", 1).encode("utf-8")).hexdigest()[:12]
        ok(got != other, f"وبصمةُ `paths.js` تتبع حروفَه ({got}) — وتبديلُ حرفٍ يبدّلها")
        meta = json.loads(re.search(r"export const WORD_PATHS_SOURCE = (\{.*?\});",
                                    WORD_JS.read_text(encoding="utf-8"), re.S).group(1))
        ok(meta.get("paths") == got,
           f"وبصمةُ الحروف في وحدة النسخ عينُ `paths.js` اليوم ({meta.get('paths')} = {got})")
    else:
        ok(True, "○ وحدةُ النسخ لم تُبنَ بعد — والمطالبةُ تنطلق يومَ تُبنى")
    for good, msg in rows:
        print(("  ✓ " if good else "  ✗ ") + msg)
    return 0 if all(g for g, _ in rows) else 1


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--self-test", action="store_true", help="حارسُ الوصل وقاعدتُه")
    ap.add_argument("--audit", action="store_true", help="شكاوى الحارس على الوحدة المبنيّة")
    args = ap.parse_args()
    if args.audit:
        bad = audit()
        for line in bad:
            print(f"  ✗ {line}")
        print(f"حارسُ الوصل: {len(bad)} مخالفة")
        return 1 if bad else 0
    return self_test()


if __name__ == "__main__":
    raise SystemExit(main())
