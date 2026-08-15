#!/usr/bin/env python3
"""سائقُ **عدّة تأليف المسارات** (`tools/make_paths.html`، بند الجلسة ٢/١).

    python3 tools/make_paths.py --open        # العدّةُ لليد: خيالٌ وعُقَدٌ ونقرٌ بترتيب الكتابة
    python3 tools/make_paths.py --nodes       # جردُ عُقَد الخيال (يُقرأ منه رقمُ كل عقدة)
    python3 tools/make_paths.py --build       # يبني app/js/paths.js من tools/path_anchors.json
    python3 tools/make_paths.py --sheet o.png # لوحةُ مراجعةٍ بالعين لكل الأشكال
    python3 tools/make_paths.py --self-test   # عهدُ الإيماءة والمسار — بلا متصفّح

**لِمَ سائقٌ ومتصفّح؟** لأنّ الخيالَ المرجعيّ خطٌّ حقيقيّ يُشكِّله المتصفّح ويرسمه:
`ب` وحدها و`بـ` موصولةً شكلان مختلفان، ومن يقرّر أيَّهما يُرسَم هو **مُشكِّل العربية**
لا جدولٌ نكتبه. فالعدّةُ تعمل حيث يعمل الشكل، والسائقُ يخدم `app/` جذراً (لتقرأ
العدّةُ الخطَّ و`pen.js` من مواضعهما) ويستقبل الحصيلة بـ`POST /result`.

**وحظيرتُه حظيرةُ `browser_test.py`** (خادمُها ومُشغِّلُ Chrome) — تبعيةُ أداةٍ
معلَنة كما `trim_lead.py` مع `audio_audit.py`: خادمٌ ثانٍ لا يزيد على المشروع إلا
موضعَ عطبٍ ثانياً.

## ما يخرج من هنا

`app/js/paths.js`: `PATHS` بصيغة `METHOD.md §٣.١` — **وليس فيه رقمٌ كُتب بيد**.
كلُّ إحداثيّ مقروءٌ من هيكل خيال الحرف (`make_paths.html` §١–§٦)، والإيماءةُ التي
سيّرت القلمَ على الهيكل أرقامُ عُقَدٍ في `tools/path_anchors.json` — بدايةٌ واتجاهٌ
وترتيب، وهي المادّةُ المدرَّسة وحدَها.

## الفحصُ الذاتي — عهدُ الإيماءة والمسار

يجري بلا متصفّح، ويحرس أربعاً:
  ١) لكلِّ شكلٍ في `paths.js` إيماءةٌ ولّدته — **ولا مسارَ يُدَسّ بيد**.
  ٢) ولكلِّ إيماءةٍ مسارُها — فلا إيماءةٌ تُكتب ولا يُعاد البناء.
  ٣) وبصمةُ ملفّ الإيماءات في `paths.js` تطابق الملفَّ على القرص — **فتبديلُ
     الإيماءة بلا إعادة بناءٍ يحمرّ من نفسه** (نمطُ «التعليقُ يُطالِب من نفسه»).
  ٤) وعددُ أجزاء المسار عددُ أجزاء الإيماءة، وما ادُّعي أنه عينُ شكلٍ آخر فهو عينُه.
"""

import argparse
import hashlib
import json
import re
import shutil
import sys
import tempfile
import threading
import time
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
ANCHORS = TOOLS / "path_anchors.json"
TOOL_PAGE = TOOLS / "make_paths.html"
OUT = ROOT / "app" / "js" / "paths.js"
WARM_OUT = ROOT / "app" / "js" / "warmups.js"
WORD_OUT = ROOT / "app" / "js" / "word_paths.js"
DROPPED = TOOLS / "paths_dropped.json"
CURRICULUM = ROOT / "app" / "js" / "curriculum.js"
FORMS = ["isolated", "initial", "medial", "final"]

# **قسمُ أشكال التهيئة في العدّة** — تُبصَم حدودُه فيُعرَف أنّ الوحدةَ بُنيت منه
# بعينه: تعديلُ تعريفٍ هندسيّ بلا إعادة بناءٍ يحمرّ من نفسه (نظيرُ بصمة الإيماءات).
WARM_SECTION = ("// ————— ٧ب) أشكالُ التهيئة الحركية", "// ————— ٨) العرضُ")

sys.path.insert(0, str(TOOLS))
import browser_test  # noqa: E402  (حظيرةُ الخادم ومُشغِّلُ Chrome — تبعيةٌ معلَنة)
import ports  # noqa: E402  (جدولُ المنافذ — تُقرأ من موضعٍ واحد، `tools/ports.py`)


def sha() -> str:
    """بصمةُ ملفّ الإيماءات — تُكتب في `paths.js` فيُعرف أنه بُني منه بعينه."""
    return hashlib.sha1(ANCHORS.read_bytes()).hexdigest()[:12]


def anchors() -> dict:
    return json.loads(ANCHORS.read_text(encoding="utf-8"))


def warm_spec() -> str:
    """نصُّ قسم أشكال التهيئة من العدّة — تعريفاتُها الهندسية وبناؤها."""
    src = TOOL_PAGE.read_text(encoding="utf-8")
    head = src.find(WARM_SECTION[0])
    tail = src.find(WARM_SECTION[1], head + 1)
    if head < 0 or tail < 0:
        return ""
    return src[head:tail]


def warm_sha() -> str:
    return hashlib.sha1(warm_spec().encode("utf-8")).hexdigest()[:12]


def warm_parts() -> list:
    """محطاتُ التهيئة كما يعلنها المنهج — `part` بعينه لا قائمةٌ ثانية تشيخ."""
    if not CURRICULUM.exists():
        return []
    src = CURRICULUM.read_text(encoding="utf-8")
    body = re.search(r"export const STAGES = (\[.*?\n\]);", src, re.S)
    if not body:
        return []
    stages = json.loads(body.group(1))
    return [node["part"] for stage in stages if stage.get("kind") == "warmup"
            for node in stage.get("nodes", [])]


def warmups_module() -> tuple:
    """يقرأ `WARMUPS` و`WARMUPS_SOURCE` من الوحدة المولَّدة (قراءةٌ نصّية)."""
    if not WARM_OUT.exists():
        return None, None
    src = WARM_OUT.read_text(encoding="utf-8")
    body = re.search(r"export const WARMUPS = (\{.*?\n\});", src, re.S)
    source = re.search(r"export const WARMUPS_SOURCE = (\{.*?\});", src, re.S)
    return (json.loads(body.group(1)) if body else None,
            json.loads(source.group(1)) if source else None)


def word_material() -> list:
    """مادّةُ الكتابة التي يطلبها المنهج — وصلاتُ محطة الوصل وكلماتُ جدولها،
    **وجملُ محطة الجمل** (الجلسة ٩: تُنسَخ ثم تُملى كما تُنسَخ الكلمة وتُملى)."""
    if not CURRICULUM.exists():
        return []
    src = CURRICULUM.read_text(encoding="utf-8")
    stages = re.search(r"export const STAGES = (\[.*?\n\]);", src, re.S)
    words = re.search(r"export const WORDS = (\{.*?\n\});", src, re.S)
    out = list(json.loads(words.group(1))) if words else []
    if stages:
        for stage in json.loads(stages.group(1)):
            if stage.get("kind") == "join":
                for node in stage.get("nodes", []):
                    out += node.get("joins", []) + node.get("words", [])
            elif stage.get("kind") == "sentence":
                for node in stage.get("nodes", []):
                    out += node.get("sentences", [])
    return sorted(set(out))


def material_sha() -> str:
    """بصمةُ **مادّة النسخ** لا بصمةُ ملفِّ المنهج.

    العهدُ المعلَن: «تبديلُ مادّة النسخ بلا إعادة بناءٍ يحمرّ» — فموضوعُه ما يُنسَخ،
    لا كلُّ محرفٍ في `curriculum.js`. وكانت البصمةُ بصمةَ الملفّ كلِّه، فلمّا أضافت
    الجلسةُ ش حقلَ **مفاصل الشقّ** (`sect`، بيانُ عرضٍ لا يمسّ مساراً) احمرّت ثلاثةُ
    حرّاسٍ دفعةً وطُلبت إعادةُ بناءٍ لا تغيّر بايتاً في المسارات. **وإنذارٌ كاذبٌ
    مكرّر يُعلِّم الناسَ تجاهلَ الحارس** — فصارت البصمةُ على `word_material()` نفسِها:
    تحمرّ يومَ تتبدّل كلمةٌ تُنسَخ، وتسكت لِما لا يمسّها.
    """
    return hashlib.sha1("\n".join(word_material()).encode("utf-8")).hexdigest()[:12]


def paths_module() -> tuple:
    """يقرأ `PATHS` و`PATHS_SOURCE` من الوحدة المولَّدة (قراءةٌ نصّية بلا جافاسكربت)."""
    if not OUT.exists():
        return None, None
    src = OUT.read_text(encoding="utf-8")
    body = re.search(r"export const PATHS = (\{.*?\n\});", src, re.S)
    source = re.search(r"export const PATHS_SOURCE = (\{.*?\});", src, re.S)
    paths = json.loads(body.group(1)) if body else None
    meta = json.loads(source.group(1)) if source else None
    return paths, meta


# ————— تشغيلُ العدّة في المتصفّح —————


# ————— نافذةُ اللوحة: **تُحسب من عدد الصفوف لا تُكتب** —————
#
# مراجعةُ الجلسة ٥ أمسكت هنا رقماً مكتوباً بيد (`1600,1700`): كان يسع ستّةَ عشرَ شكلاً
# فلمّا صارت ثمانيةً وأربعين **بتر اللوحةَ صامتاً** — وشاهدُ العين الناقصُ شاهدٌ كاذب،
# وهو من صنف «أرقامٌ محسوبة لا مكتوبة» بعينه ويسري على عدّة المراجعة كما يسري على
# المنتَج. **فقواعدُ الشبكة تُقرأ من العدّة نفسِها** (أعمدتُها وفجوتُها وحاشيتُها في
# قاعدة `#sheet`)، والصفوفُ تُحسب من عدد الأشكال المعروضة، والارتفاعُ ثمرتُهما.
# **والمكتوبُ هنا ضلعُ الخليّة وحدَه** — وهو وحدةُ العين لا وصفُ الصفحة: كم بكسلاً
# يُعطى الشكلُ الواحد ليُقرأ رسمُه وأرقامُ عُقَده.
SHEET_CELL = 400


def sheet_grid() -> tuple:
    """أعمدةُ لوحة المراجعة وفجوتُها وحاشيتُها — **مقروءةٌ من قاعدة العدّة**."""
    css = TOOL_PAGE.read_text(encoding="utf-8")
    rule = re.search(r"#sheet \{(.*?)\}", css, re.S)
    body = rule.group(1) if rule else ""
    cols = re.search(r"repeat\((\d+),", body)
    gap = re.search(r"gap:\s*(\d+)px", body)
    pad = re.search(r"padding:\s*(\d+)px", body)
    return (int(cols.group(1)) if cols else 1,
            int(gap.group(1)) if gap else 0,
            int(pad.group(1)) if pad else 0)


def sheet_window(cells: int) -> str:
    """نافذةٌ تسع كلَّ خلايا اللوحة — عرضاً بأعمدتها وارتفاعاً بصفوفها.

    **ويُزاد الإطارُ الوهميّ على الارتفاع**: Chrome بلا واجهة يحجز فوق المنظور
    شريطاً (`browser_test.VIEWPORT_PAD`) — فنافذةُ ٤١٢ منظورُها ٣٢٥. وكان الحسابُ
    يغفله فتبتر اللوحةُ الصغيرة **وتقول اللوحةُ ذلك بنفسها** (حارسُ الجلسة ٦):
    أمسكه أوّلُ استعمالٍ للحساب على لوحةٍ من صفٍّ واحد (مرشّحاتُ الكرّاسة، الجلسة ٧)،
    ولم تُسلَّم صورةٌ مبتورة على أنها تامّة. **والرقمُ من مصدره لا يُكتب هنا.**
    """
    cols, gap, pad = sheet_grid()
    cols = min(cols, max(1, cells))          # لوحةُ شكلين عمودان — كما تفعل العدّة
    rows = max(1, -(-cells // cols))
    side = lambda n: pad * 2 + n * SHEET_CELL + max(0, n - 1) * gap  # noqa: E731
    return f"{side(cols)},{side(rows) + browser_test.VIEWPORT_PAD}"


def drive(query: str, port: int, timeout: int, shots: Path = None, show: bool = False,
          window: str = None, anchors_file: Path = None) -> list:
    """يفتح العدّةَ بوضعٍ من أوضاعها ويعيد ما أرسلته (أو يلتقط صورتها).

    و`anchors_file` **إيماءةٌ أخرى تُخدَم مكانَ الملفّ** — تستعملها لوحةُ مرشّحات
    الكرّاسة (`craft_panel.py`، الجلسة ٧): جوابان لحالةٍ حركية يُبنيان ويُصوَّران من
    ملفّين مؤقّتين، **وملفُّ المشروع لا يُمَسّ حتى يحكم المالك**.
    """
    results = []
    browser_test.PAGES["/__make_paths.html"] = TOOL_PAGE
    browser_test.PAGES["/__anchors.json"] = anchors_file or ANCHORS
    server = browser_test.make_server(port, results)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    profile = Path(tempfile.mkdtemp(prefix=browser_test.CHROME_PREFIX + "paths-"))
    url = f"http://127.0.0.1:{port}/__make_paths.html{query}"
    extra = ["--hide-scrollbars"]
    if shots:
        shots.unlink(missing_ok=True)
        extra += [f"--screenshot={shots}", f"--window-size={window}"]
    try:
        proc = browser_test.run_chrome(url, profile, extra, show)
        deadline = time.time() + timeout
        while time.time() < deadline:
            time.sleep(0.4)
            if results and (not shots or shots.exists()):
                break
        time.sleep(0.6 if shots else 0)
        proc.kill()
    finally:
        server.shutdown()
        shutil.rmtree(profile, ignore_errors=True)
    return results


def report(results: list) -> bool:
    for r in results:
        print(("  ✓ " if r["ok"] else "  ✗ ") + r["msg"])
    return all(r["ok"] for r in results) and bool(results)


# ————— كتابةُ الوحدة —————


def num(value) -> str:
    """رقمٌ كما هو: عُشرٌ واحد لا أكثر، وبلا صفرٍ زائد — فالملفُّ يُقرأ ويُقارَن."""
    text = f"{float(value):.1f}"
    return text[:-2] if text.endswith(".0") else text


def chunk(points, per=7) -> list:
    out = []
    for i in range(0, len(points), per):
        out.append(", ".join(f"[{num(p[0])}, {num(p[1])}]" for p in points[i:i + per]))
    return out


HEADER = """\
// **المساراتُ المرجعية** لحروف «اُكْتُبْ» بأشكال مواقعها (`METHOD.md §٣.١`):
// شبكةٌ معيارية ١٠٠٠×١٠٠٠، `{ strokes: [{ points, start }], dots: [{ at, count, after }] }`،
// **والنقاطُ بعد الجسم** — قاعدةُ الخطّ المدرسيّ.
//
// ⚠ **ملفٌّ مولَّد — لا يُحرَّر بيد** (`METHOD.md §٣.٨`: «لا تُكتب إحداثياتٌ بيد»):
//   python3 tools/make_paths.py --build
//
// وليس فيه رقمٌ قُدِّر ولا نُقر: كلُّ إحداثيّ **مقروءٌ من هيكل خيال الحرف** بخطّ
// النسخ المرجعيّ (ق٢) على الشبكة نفسِها — تُنحَّف صورةُ الحرف إلى الخطّ الذي رسمه
// القلمُ في قلبها، ثم يُمشى عليه. **وما ألّفه المؤلِّفُ هو المادّةُ المدرَّسة وحدَها**:
// من أيّ عقدةٍ يبدأ القلم، وإلى أين يمضي، وبأيّ ترتيبٍ تتوالى الأجزاء — إيماءةٌ
// أرقامُ عُقَدٍ في `tools/path_anchors.json` لا إحداثيات. والنقاطُ تُقرأ من الخيال
// آلياً (أجرامٌ صغيرة منفصلة) فلا تُنقَر ولا تُقدَّر.
//
// **ولماذا وحدةٌ على حدة لا في `curriculum.js`؟** لأنّ المنهج يُشتقّ من بيانات اقرأ
// **آلياً** في الجلسة ٣ فيُعاد كتابةُ ملفّه، ومسارات الحروف تؤلَّف هنا بأداتها —
// فلكلِّ مولِّدٍ ملفُّه، ولا يمحو أحدُهما عملَ الآخر. و`curriculum.js` يصدّرها كما
// كانت (`PATHS` مصدرُ الحقيقة الوحيد للشاشات)، ويفحصها `tools/check_paths.py`.

"""


def write_module(paths: dict, meta: dict) -> str:
    lines = [HEADER, "export const PATHS = {"]
    letters = list(paths.items())
    for li, (ch, forms) in enumerate(letters):
        lines.append(f'  "{ch}": {{')
        keys = [f for f in FORMS if f in forms]
        for fi, form in enumerate(keys):
            ref = forms[form]
            lines.append(f'   "{form}": {{')
            lines.append('    "strokes": [')
            for si, stroke in enumerate(ref["strokes"]):
                start = stroke["start"]
                lines.append(f'     {{ "start": [{num(start[0])}, {num(start[1])}], "points": [')
                rows = chunk(stroke["points"])
                for ri, row in enumerate(rows):
                    lines.append(f'      {row}' + ("," if ri < len(rows) - 1 else ""))
                # **الطيّةُ صفةٌ في القطعة** (`METHOD.md §٣.١`): أرقامُ نقاطٍ في `points`
                # تُصدِرها العدّةُ من مفرق الهيكل — ولا تُكتب بيد ولا تُستنبَط لاحقاً.
                tail = "     ]"
                if stroke.get("folds"):
                    tail += ', "folds": [' + ", ".join(
                        f'{{ "from": {int(f["from"])}, "apex": {int(f["apex"])},'
                        f' "to": {int(f["to"])} }}' for f in stroke["folds"]) + "]"
                lines.append(tail + " }" + ("," if si < len(ref["strokes"]) - 1 else ""))
            lines.append("    ],")
            dots = ", ".join(
                f'{{ "at": [{num(d["at"][0])}, {num(d["at"][1])}], "count": {int(d["count"])},'
                f' "after": true }}' for d in ref["dots"])
            lines.append(f'    "dots": [{dots}]')
            lines.append("   }" + ("," if fi < len(keys) - 1 else ""))
        lines.append("  }" + ("," if li < len(letters) - 1 else ""))
    lines.append("};")
    lines.append("")
    lines.append("/** نسبُ الوحدة: من أيّ إيماءةٍ بُنيت وبأيّ عدّة — يفحصه `make_paths.py --self-test`. */")
    lines.append("export const PATHS_SOURCE = " + json.dumps(meta, ensure_ascii=False) + ";")
    lines.append("")
    return "\n".join(lines)


WARM_HEADER = """\
// **مساراتُ التهيئة الحركية** — المرحلةُ الأولى في `METHOD.md §٤`: خطوطٌ ومنحنياتٌ
// ودوائرُ وموجاتٌ وتحكّمٌ داخل حدود، **قبل أوّل حرف**. وصيغتُها صيغةُ `METHOD.md §٣.١`
// نفسُها (`{ strokes: [{ points, start }], dots }`) فيقرؤها `pen.js` كما يقرأ الحروف.
//
// ⚠ **ملفٌّ مولَّد — لا يُحرَّر بيد** (`METHOD.md §٣.٨`):
//   python3 tools/make_paths.py --build
//
// **وليس فيه إحداثيٌّ كُتب**: كلُّ نقطةٍ محسوبةٌ من **تعريفٍ هندسيّ** معلَنٍ في عدّة
// التأليف (`tools/make_paths.html §٧ب`) — «خطٌّ من حافّة الصندوق إلى حافّته»، «قوسٌ
// نصفُ قطره كذا». وشكلُ التهيئة ليس حقيقةً من حقائق الخطّ تُقرأ من مُشكِّل العربية
// (كالحروف)، بل هو تعريفُه نفسُه — فالمكتوبُ التعريفُ والمحسوبُ الإحداثيّ.
//
// **واتجاهُ الدوران مقروءٌ من المادّة**: دوائرُ التهيئة وحلقاتُها تدور دورانَ **حلقة
// م المعزولة** — أوّلِ حلقةٍ يكتبها الطفلُ في المنهج — يُقاس من مسارها ساعةَ البناء
// لا يُختار رأياً (`METHOD.md §٤`: «دوائرُ باتجاهٍ صحيح»).
//
// **ولا شكلَ هنا لا يقبله محرّكُه**: كلُّ شكلٍ أُدخل على `judge` ساعةَ البناء صحيحاً
// فقُبل ومعكوساً فرُدّ — وإلا سقط البناء. ويحرسه بعدها `tools/test_warmup.mjs`.

"""


def warm_body(text: str = None) -> str:
    """نصُّ كتلة `WARMUPS` من الوحدة — تُبصَم فيُعرف أنّ أحداً لم يمسّها بيد."""
    src = text if text is not None else (
        WARM_OUT.read_text(encoding="utf-8") if WARM_OUT.exists() else "")
    found = re.search(r"export const WARMUPS = \{.*?\n\};", src, re.S)
    return found.group(0) if found else ""


def body_sha(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]


def warmup_block(warmups: dict) -> str:
    lines = ["export const WARMUPS = {"]
    parts = list(warmups.items())
    for pi, (part, entry) in enumerate(parts):
        lines.append(f'  "{part}": {{')
        lines.append('   "shapes": [')
        shapes = entry["shapes"]
        for si, shape in enumerate(shapes):
            lines.append("    {")
            lines.append(f'     "id": "{shape["id"]}",')
            lines.append(f'     "note": "{shape["note"]}",')
            if shape.get("tolerance") is not None:
                lines.append(f'     "tolerance": {shape["tolerance"]},')
            if shape.get("bounds"):
                lines.append('     "bounds": true,')
            lines.append('     "ref": { "strokes": [')
            strokes = shape["ref"]["strokes"]
            for ki, stroke in enumerate(strokes):
                start = stroke["start"]
                lines.append(f'      {{ "start": [{num(start[0])}, {num(start[1])}], "points": [')
                rows = chunk(stroke["points"])
                for ri, row in enumerate(rows):
                    lines.append(f'       {row}' + ("," if ri < len(rows) - 1 else ""))
                lines.append("      ] }" + ("," if ki < len(strokes) - 1 else ""))
            lines.append('     ], "dots": [] }')
            lines.append("    }" + ("," if si < len(shapes) - 1 else ""))
        lines.append("   ]")
        lines.append("  }" + ("," if pi < len(parts) - 1 else ""))
    lines.append("};")
    return "\n".join(lines)


def write_warmups(warmups: dict, meta: dict) -> str:
    """الوحدةُ كاملةً: ترويستُها وكتلتُها ونسبُها — **وبصمةُ الكتلة في نسبها**،
    فتحريرُ إحداثيٍّ بيد يُسقِط الفحصَ الذاتيّ حتى يُعاد البناء."""
    block = warmup_block(warmups)
    return "\n".join([
        WARM_HEADER,
        block,
        "",
        "/** نسبُ الوحدة: من أيّ قسمٍ في العدّة بُنيت، وبأيّ اتجاهِ دوران، وبصمةُ كتلتها. */",
        "export const WARMUPS_SOURCE = "
        + json.dumps({**meta, "body": body_sha(block)}, ensure_ascii=False) + ";",
        "",
    ])


WORD_HEADER = """\
// **مساراتُ النسخ**: الوصلاتُ والكلماتُ وأسطرُ المسافة — **خيالُ الكلمة كلِّها**
// (لازمُ قرار الجلسة ٢: النسبُ من التشكيل لا من جمع حروفٍ مفردة)، وصيغةُ كلِّ مدخلٍ
// صيغةُ `METHOD.md §٣.١` نفسُها فيقرؤها `pen.js` كما يقرأ الحرف — ومعها `line`:
// سطرُ القاعدة الذي تجلس عليه الكلمة (يرسمه لوحُ النسخ مسطرةً).
//
// ⚠ **ملفٌّ مولَّد — لا يُحرَّر بيد** (`METHOD.md §٣.٨`):
//   python3 tools/make_paths.py --build
//
// **وليس فيه كلمةٌ من تأليفنا ولا إحداثيٌّ من تقدير**: قائمةُ الكلمات تُقرأ من
// `curriculum.js` (وهي بنكُ اقرأ)، ومسارُ كلِّ حرفٍ فيها **مسارُه القانونيُّ بعينه**
// — المؤلَّفُ بإيماءته المحكومة بأحكام المالك الخمسة — مُنزَّلاً على جسده في خيال
// الكلمة المُشكَّل، والوصلُ يُدمَج حيث يبلغ خروجُ الحرف مقعدَ ما بعده (حكم ٤)،
// **وصندوقُ المادّة يسافر معها** (`box`، حكمُ المدير ١٣ أغسطس ٢٠٢٦): مربّعٌ للكلمة
// **وسطرٌ عريضٌ للجملة** — «كلُّ شكلٍ يملأ صندوقَه» وصندوقُ السطر سطر؛ ومَن لا `box`
// له فشبكتُه ١٠٠٠×١٠٠٠ كما كانت.
// والعلاماتُ ضرباتٌ بإيماءات قانونيّاتها (منظومة حكم ٥)، والنقاطُ بعد جسم الكلمة
// كلِّه. و`MARK_PATHS` شاراتُ العلامات لبطاقات تعريفها — من المسار المؤلَّف نفسِه.

"""


def word_body(text: str = None) -> str:
    """نصُّ كتلة `WORD_PATHS` من الوحدة — تُبصَم فيُعرف أنّ أحداً لم يمسّها بيد."""
    src = text if text is not None else (
        WORD_OUT.read_text(encoding="utf-8") if WORD_OUT.exists() else "")
    found = re.search(r"export const WORD_PATHS = \{.*?\n\};", src, re.S)
    return found.group(0) if found else ""


def write_words(words: dict, glyphs: dict, meta: dict) -> str:
    lines = [WORD_HEADER, "export const WORD_PATHS = {"]
    texts = list(words.items())
    for wi, (text, ref) in enumerate(texts):
        lines.append(f'  "{text}": {{')
        # **صندوقُ المادّة**: يسقط إن كان الشبكةَ المربّعة، ويُكتب للسطر العريض
        if ref.get("box"):
            lines.append(f'   "box": [{num(ref["box"][0])}, {num(ref["box"][1])}],')
        if ref.get("line") is not None:
            lines.append(f'   "line": {num(ref["line"])},')
        # **سماحةُ الكلمة تسافر معها**: مقياسُ حروفها فيها — تقرؤه شاشةُ النسخ
        # فتحكم به، ويقرؤه الحارسُ فيقيس عليه هامشَ الرجفة (`METHOD.md §٣.٥`).
        if ref.get("tolerance") is not None:
            lines.append(f'   "tolerance": {ref["tolerance"]},')
        lines.append('   "strokes": [')
        for si, stroke in enumerate(ref["strokes"]):
            start = stroke["start"]
            lines.append(f'    {{ "start": [{num(start[0])}, {num(start[1])}], "points": [')
            rows = chunk(stroke["points"])
            for ri, row in enumerate(rows):
                lines.append(f'     {row}' + ("," if ri < len(rows) - 1 else ""))
            tail = "    ]"
            if stroke.get("folds"):
                tail += ', "folds": [' + ", ".join(
                    f'{{ "from": {int(f["from"])}, "apex": {int(f["apex"])},'
                    f' "to": {int(f["to"])} }}' for f in stroke["folds"]) + "]"
            lines.append(tail + " }" + ("," if si < len(ref["strokes"]) - 1 else ""))
        lines.append("   ],")
        dots = ", ".join(
            f'{{ "at": [{num(d["at"][0])}, {num(d["at"][1])}], "count": {int(d["count"])},'
            f' "after": true }}' for d in ref["dots"])
        lines.append(f'   "dots": [{dots}]')
        lines.append("  }" + ("," if wi < len(texts) - 1 else ""))
    lines.append("};")
    lines.append("")
    lines.append("/** شاراتُ العلامات لبطاقات تعريفها — العلامةُ في صندوقها من مسارها المؤلَّف. */")
    lines.append("export const MARK_PATHS = {")
    marks = list(glyphs.items())
    for mi, (mark, ref) in enumerate(marks):
        lines.append(f'  "{mark}": {{')
        lines.append('   "strokes": [')
        for si, stroke in enumerate(ref["strokes"]):
            start = stroke["start"]
            lines.append(f'    {{ "start": [{num(start[0])}, {num(start[1])}], "points": [')
            rows = chunk(stroke["points"])
            for ri, row in enumerate(rows):
                lines.append(f'     {row}' + ("," if ri < len(rows) - 1 else ""))
            lines.append("    ] }" + ("," if si < len(ref["strokes"]) - 1 else ""))
        lines.append('   ], "dots": []')
        lines.append("  }" + ("," if mi < len(marks) - 1 else ""))
    lines.append("};")
    lines.append("")
    lines.append("/** نسبُ الوحدة وبصمةُ كتلتها — يفحصهما `make_paths.py --self-test`. */")
    block = "\n".join(lines[1:lines.index("};") + 1])
    lines.append("export const WORD_PATHS_SOURCE = "
                 + json.dumps({**meta, "body": body_sha(block)}, ensure_ascii=False) + ";")
    lines.append("")
    return "\n".join(lines)


def words_module() -> tuple:
    """يقرأ `WORD_PATHS` و`WORD_PATHS_SOURCE` من الوحدة المولَّدة (قراءةً نصّية)."""
    if not WORD_OUT.exists():
        return None, None
    src = WORD_OUT.read_text(encoding="utf-8")
    body = re.search(r"export const WORD_PATHS = (\{.*?\n\});", src, re.S)
    source = re.search(r"export const WORD_PATHS_SOURCE = (\{.*?\});", src, re.S)
    return (json.loads(body.group(1)) if body else None,
            json.loads(source.group(1)) if source else None)


def build(port: int, timeout: int) -> int:
    results = drive("?build=1", port, timeout)
    if not results:
        print("لم تصل حصيلةٌ من العدّة (تحقّق من تشغيل Chrome).")
        return 1
    good = report(results)
    payload = next((r for r in results if "paths" in r), None)
    if not good or not payload:
        return 1
    # **ولا تُكتب وحدةٌ من بناءٍ محدود**: `--only` في العدّة قياسُ مرشّحاتٍ لا بناءُ
    # منهج، ولو كُتبت منه الوحدةُ لخرجت ناقصةَ الحروف صامتةً.
    if payload.get("partial"):
        print(f"بناءٌ محدود بـ«{payload['partial']}» — لا تُكتب منه الوحدة.")
        return 1
    paths = payload["paths"]
    meta = {
        "tool": "tools/make_paths.html",
        "gesture": "tools/path_anchors.json",
        "sha": sha(),
        "grid": payload["meta"]["grid"],
        "font": "NotoNaskhArabic — نسخٌ مدرسيّ (ق٢)",
    }
    OUT.write_text(write_module(paths, meta), encoding="utf-8")
    forms = sum(len(v) for v in paths.values())
    print(f"\nكُتب {OUT.relative_to(ROOT)}: {len(paths)} حرفاً في {forms} شكلاً")

    warmups = payload.get("warmups")
    if warmups:
        spin = payload["meta"].get("spin")
        WARM_OUT.write_text(write_warmups(warmups, {
            "tool": "tools/make_paths.html §٧ب",
            "sha": warm_sha(),
            "grid": payload["meta"]["grid"],
            "spin": spin,
            "spinFrom": "م/isolated",
            "spinText": "مع عقارب الساعة" if spin and spin > 0 else "عكسَ عقارب الساعة",
        }), encoding="utf-8")
        shapes = sum(len(v["shapes"]) for v in warmups.values())
        print(f"وكُتب {WARM_OUT.relative_to(ROOT)}: {len(warmups)} محطةَ تهيئةٍ في {shapes} شكلاً")

    # **وما سقط من الجمل والأسطر يُكتب جرداً يقرؤه مولّدُ المنهج** (جلسةُ التوسعة):
    # مادّةٌ في المنهج بلا مسارٍ تُحمِر `check_paths` أبداً — فتُسقَط من المنهج بإعلانٍ
    # وعلّةٍ منقولةٍ بنصّها من شكوى العدّة، ولا تُكتب قائمةٌ بيد.
    # **والجردُ يتراكم ولا يُمحى** (وإلّا دارت الحلقةُ أبداً): الجملةُ التي سقطت
    # خرجت من المنهج، فلا يعود البناءُ التالي يذكرها — فلو كُتب الجردُ من الجديد
    # وحدَه لعادت إلى المنهج، فسقطت، فعادت. **فما دخل لا يخرج إلا بيدٍ تمحوه**
    # يومَ يقدر المولّدُ عليه، ثم يُعاد البناءُ فيثبت أنّه قدر.
    dropped = payload.get("dropped") or []
    fresh = [{"text": str(row.get("why", "")).split(": «")[0],
              "why": row.get("why", ""), "kind": row.get("kind", "")}
             for row in dropped]
    prior = []
    if DROPPED.exists():
        try:
            prior = json.loads(DROPPED.read_text(encoding="utf-8")).get("items", [])
        except json.JSONDecodeError:
            prior = []
    seen = {row["text"] for row in prior}
    items = prior + [row for row in fresh if row["text"] not in seen]
    DROPPED.write_text(json.dumps({
        "tool": "tools/make_paths.py --build",
        "note": "ما لم يؤلَّف له خيالٌ فسقط بإعلان — يقرؤه tools/make_curriculum.mjs. "
                "ويتراكم ولا يُمحى: امحُ سطراً يدوياً يومَ يقدر المولّدُ عليه، ثم أعِد البناء.",
        "items": items,
    }, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"وجردُ الساقط في {DROPPED.relative_to(ROOT)}: {len(items)} "
          f"(جديدٌ في هذا البناء {len([r for r in fresh if r['text'] not in seen])})")

    words = payload.get("words")
    if words:
        # بصمةُ المنهج تدخل النسب: قائمةُ الكلمات قُرئت منه، فتبديلُه بلا إعادة بناءٍ
        # يحمرّ في الفحص الذاتي (نظيرُ بصمة الإيماءات).
        cur_sha = material_sha()
        WORD_OUT.write_text(write_words(words, payload.get("markGlyphs") or {}, {
            "tool": "tools/make_paths.html §٧ج",
            "gesture": "tools/path_anchors.json",
            "sha": sha(),
            "curriculum": cur_sha,
            "grid": payload["meta"]["grid"],
            "font": "NotoNaskhArabic — نسخٌ مدرسيّ (ق٢)",
        }), encoding="utf-8")
        dropped = payload["meta"].get("failedPairs") or []
        print(f"وكُتب {WORD_OUT.relative_to(ROOT)}: {len(words)} مساراً للنسخ"
              + (f" — وأسطرُ مسافةٍ سقطت بإعلان: {len(dropped)}" if dropped else ""))
    return 0


def nodes(port: int, timeout: int, out: Path) -> int:
    results = drive("?nodes=1", port, timeout)
    if not results:
        print("لم تصل حصيلةٌ من العدّة.")
        return 1
    good = report(results)
    payload = next((r for r in results if "table" in r), None)
    if payload and out:
        out.write_text(json.dumps(payload["table"], ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"\nجردُ العُقَد في {out}")
    return 0 if good else 1


# ————— الفحصُ الذاتي: عهدُ الإيماءة والمسار —————


def self_test() -> int:
    fails = 0

    def ok(cond, msg):
        nonlocal fails
        if not cond:
            fails += 1
        print(("  ✓ " if cond else "  ✗ ") + msg)

    spec = anchors()
    letters = spec.get("letters", {})
    ok(bool(letters), f"ملفُّ الإيماءات فيه {len(letters)} حرفاً")
    for ch, forms in letters.items():
        missing = [f for f in FORMS if f not in forms]
        ok(not missing, f"{ch}: أشكالُ المواقع الأربعة كلُّها مؤلَّفة"
           + (f" — ينقصه {'، '.join(missing)}" if missing else ""))
        for form, entry in forms.items():
            if entry.get("sameAs"):
                ok(entry["sameAs"] in forms and entry.get("why"),
                   f"{ch}/{form}: عينُ «{entry.get('sameAs')}» بعلّةٍ مكتوبة")
                continue
            shape = entry.get("strokes")
            ok(isinstance(shape, list) and shape
               and all(isinstance(s, list) and len(s) >= 2 and all(isinstance(i, int) and i > 0 for i in s)
                       for s in shape),
               f"{ch}/{form}: إيماءتُه أرقامُ عُقَدٍ لا إحداثيات ({shape})")

    paths, meta = paths_module()
    ok(paths is not None, f"الوحدةُ المولَّدة موجودةٌ ومقروءة ({OUT.relative_to(ROOT)})")
    if paths is None:
        print(f"\n{fails} فشل")
        return 1

    # ١) لا مسارَ بلا إيماءةٍ ولّدته، ٢) ولا إيماءةَ بلا مسار
    extra = [f"{ch}/{form}" for ch, forms in paths.items() for form in forms
             if form not in letters.get(ch, {})]
    ok(not extra, "ولا مسارَ في الوحدة بلا إيماءةٍ ولّدته — لا يُدَسّ شكلٌ بيد"
       + (f" — دخيلٌ: {'، '.join(extra)}" if extra else ""))
    late = [f"{ch}/{form}" for ch, forms in letters.items() for form in forms
            if form not in paths.get(ch, {})]
    ok(not late, "ولكلِّ إيماءةٍ مسارُها في الوحدة"
       + (f" — لم يُبنَ: {'، '.join(late)}" if late else ""))

    # ٣) البصمة: أُعيد البناءُ بعد آخر تعديلٍ للإيماءة
    ok(meta and meta.get("sha") == sha(),
       f"وبصمةُ الإيماءة في الوحدة عينُ الملفّ على القرص ({meta.get('sha') if meta else '—'} = {sha()})"
       + ("" if meta and meta.get("sha") == sha() else " — عُدِّلت الإيماءةُ ولم يُعَد البناء"))

    # ٤) الأجزاءُ بعددها، والدعوى «عينُ شكلٍ آخر» صادقةٌ في الوحدة كذلك
    for ch, forms in letters.items():
        for form, entry in forms.items():
            ref = paths.get(ch, {}).get(form)
            if ref is None:
                continue
            if entry.get("sameAs"):
                twin = paths[ch].get(entry["sameAs"])
                ok(json.dumps(ref, sort_keys=True) == json.dumps(twin, sort_keys=True),
                   f"{ch}/{form}: مسارُه عينُ «{entry['sameAs']}» كما ادُّعي")
                continue
            # **والعلامةُ المؤلَّفة جزءٌ كسائر الأجزاء** (حكمُ الشولة، §٥): إيماءتُها في
            # `marks`، فتُعَدّ في أجزاء الإيماءة وإلا شكا الفاحصُ من عدلٍ هو أحدثه.
            wanted = len(entry["strokes"]) + len(entry.get("marks", []))
            ok(len(ref["strokes"]) == wanted,
               f"{ch}/{form}: أجزاءُ المسار {len(ref['strokes'])} = أجزاءُ الإيماءة {wanted}"
               + (f" (منها {len(entry['marks'])} علامةً مؤلَّفة)" if entry.get("marks") else ""))

    # ————— ٥) نسبُ الرسم: «جسمُ هذا جسمُ ذاك والفارقُ علامتُه» (الجلسة ٧) —————
    #
    # حقيقةُ خطٍّ تُعلَن في الإيماءة (`kin`) وتُبنى منها **محطةُ تمييز المتشابهات** في
    # المنهج. وهنا تُفحَص بنيتُها: أنسبٌ إلى شكلٍ موجود؟ وأليس إلى نفسه؟ **وأتفترق
    # أختان في علامتهما فعلاً؟** — فأسرةٌ لا فارقَ بين أختيها في النقاط أسرةٌ لا سؤالَ
    # فيها. (وأمّا أنّ المحرّكَ **يفرّق** بين كلِّ أختين فيُثبته `test_paths.mjs` حكماً.)
    kin_count = 0
    for ch, forms in letters.items():
        for form, entry in forms.items():
            root = entry.get("kin")
            if not root:
                continue
            kin_count += 1
            here, there = paths.get(ch, {}).get(form), paths.get(root, {}).get(form)
            ok(root != ch and there is not None,
               f"{ch}/{form}: نسبُ رسمه «{root}» — شكلٌ مؤلَّفٌ غيرُ نفسه")
            if here is None or there is None:
                continue
            mark = lambda ref: sorted((round(d["at"][0]), round(d["at"][1]), d["count"])  # noqa: E731
                                      for d in ref["dots"])
            ok(mark(here) != mark(there),
               f"{ch}/{form}: يفترق عن «{root}» في علامته"
               f" ({len(here['dots'])} علامةً مقابل {len(there['dots'])})")
    ok(kin_count > 0, f"ونسبُ الرسم مُعلَنٌ في {kin_count} شكلاً — منها تُبنى محطةُ التمييز")

    # ————— عهدُ النسخ (الجلسة ٨): وحدةُ الكلمات بُنيت ولم تُمَسّ بيد —————
    #
    # **وبابُه يُطالِب يومَ تُبنى وحدتُه**: ما دامت `word_paths.js` غيرَ موجودةٍ فلا
    # مطالبة، ويومَ تُبنى يصير كلُّ ما في محطة الوصل مطالَباً بمساره **ولا تُحرَّر
    # الوحدةُ بيد** — وهو نظيرُ عهد التهيئة بحرفه.
    words, wmeta2 = words_module()
    if words is None:
        ok(True, "○ مساراتُ النسخ لم تُبنَ بعد — والمطالبةُ تنطلق يومَ تُبنى")
    else:
        material = word_material()
        missing = [t for t in material if t not in words]
        ok(not missing,
           f"ولكلِّ ما يُنسَخ في المنهج مسارُه ({len(material)} مادّة، والمبنيُّ {len(words)})"
           + (f" — ناقص: {'، '.join(missing[:5])}" if missing else ""))
        ok(bool(wmeta2 and wmeta2.get("sha") == sha()),
           f"وبصمةُ الإيماءة في وحدة النسخ عينُ الملفّ ({wmeta2.get('sha') if wmeta2 else '—'}"
           f" = {sha()})")
        cur_sha = material_sha()
        ok(bool(wmeta2 and wmeta2.get("curriculum") == cur_sha),
           f"وبصمةُ المنهج فيها عينُ الملفّ ({wmeta2.get('curriculum') if wmeta2 else '—'}"
           f" = {cur_sha}) — فتبديلُ مادّة النسخ بلا إعادة بناءٍ يحمرّ")
        # **ولا يُحرَّر إحداثيٌّ بيد**: بصمةُ الكتلة في نسبها (نظيرُ وحدة التهيئة)
        ok(bool(wmeta2 and wmeta2.get("body") == body_sha(word_body())),
           f"ولم تُمَسّ وحدةُ النسخ بيد بعد بنائها ({wmeta2.get('body') if wmeta2 else '—'}"
           f" = {body_sha(word_body())})")

    # ————— عهدُ التهيئة: الوحدةُ بُنيت من قسم العدّة، ومحطاتُها محطاتُ المنهج —————
    #
    # **ولا قائمةَ محطاتٍ تُكتب هنا**: تُقرأ من `curriculum.js` نفسِه (الجلسة ٣)، فمحطةٌ
    # تدخل المنهجَ أو تخرج منه تُطالِب هذا الفحصَ من نفسها بلا سطرٍ يُعدَّل.
    warmups, wmeta = warmups_module()
    parts = warm_parts()
    ok(bool(warm_spec()), "وقسمُ أشكال التهيئة قائمٌ في العدّة (§٧ب)")
    ok(warmups is not None, f"ووحدةُ التهيئة المولَّدة موجودةٌ ({WARM_OUT.relative_to(ROOT)})")
    if warmups is not None:
        missing = [p for p in parts if p not in warmups]
        extra = [p for p in warmups if p not in parts]
        ok(not missing and not extra,
           f"ومحطاتُ التهيئة في الوحدة عينُ محطات المنهج ({len(parts)} محطة)"
           + (f" — ناقصٌ: {'، '.join(missing)}" if missing else "")
           + (f" — دخيلٌ: {'، '.join(extra)}" if extra else ""))
        ok(wmeta and wmeta.get("sha") == warm_sha(),
           f"وبصمةُ قسم العدّة في الوحدة عينُ ما في الملفّ ({wmeta.get('sha') if wmeta else '—'}"
           f" = {warm_sha()})"
           + ("" if wmeta and wmeta.get("sha") == warm_sha()
              else " — عُدِّل تعريفُ الأشكال ولم يُعَد البناء"))
        # **ولا يُدَسّ شكلٌ بيد ولا يُحرَّر إحداثيّ**: بصمةُ كتلة الوحدة في نسبها،
        # فتحريرُها بلا إعادة بناءٍ يحمرّ (نظيرُ «لا مسارَ بلا إيماءةٍ ولّدته»).
        ok(bool(wmeta and wmeta.get("body") == body_sha(warm_body())),
           f"ولم تُمَسّ الوحدةُ بيد بعد بنائها ({wmeta.get('body') if wmeta else '—'}"
           f" = {body_sha(warm_body())})"
           + ("" if wmeta and wmeta.get("body") == body_sha(warm_body())
              else " — حُرِّرت بيد أو لم يُعَد البناء"))
        ok(bool(wmeta and wmeta.get("spin") in (1, -1) and wmeta.get("spinFrom")),
           f"ودورانُ دوائرها مقروءٌ من المادّة لا مختاراً ({wmeta.get('spinFrom') if wmeta else '—'}"
           f" ⇐ {wmeta.get('spinText') if wmeta else '—'})")

    print(f"\n{fails} فشل" if fails else "\nعهدُ الإيماءة والمسار قائم")
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser(description="سائقُ عدّة تأليف المسارات المرجعية")
    ap.add_argument("--open", action="store_true", help="العدّةُ لليد في متصفّحٍ مرئيّ")
    ap.add_argument("--nodes", action="store_true", help="جردُ عُقَد الخيال")
    ap.add_argument("--build", action="store_true", help="بناءُ app/js/paths.js")
    ap.add_argument("--sheet", metavar="PNG", help="لوحةُ مراجعةٍ بالعين")
    ap.add_argument("--bare", action="store_true", help="مع --sheet: بلا أرقام العُقَد")
    ap.add_argument("--only", metavar="حروف", help="مع --sheet: حروفٌ بعينها (للتأليف)")
    ap.add_argument("--out", metavar="JSON", help="مع --nodes: ملفُّ الجرد")
    ap.add_argument("--self-test", action="store_true", help="عهدُ الإيماءة والمسار بلا متصفّح")
    ap.add_argument("--port", type=int, default=ports.port_of("make_paths"))
    ap.add_argument("--timeout", type=int, default=180)
    args = ap.parse_args()

    if args.self_test:
        return self_test()
    if args.build:
        return build(args.port, args.timeout)
    if args.nodes:
        return nodes(args.port, args.timeout, Path(args.out) if args.out else None)
    if args.sheet:
        out = Path(args.sheet).resolve()
        # **والنافذةُ من عدد الأشكال**: حروفُ الإيماءات (أو ما صُفّي منها بـ`--only`)
        # × أشكالِ المواقع — وهو عينُ ما تعرضه `allForms` في العدّة.
        letters = [ch for ch in anchors().get("letters", {})
                   if not args.only or ch in args.only]
        query = ("?sheet=1" + ("&tags=0" if args.bare else "")
                 + (f"&only={args.only}" if args.only else ""))
        window = sheet_window(len(letters) * len(FORMS))
        results = drive(query, args.port, args.timeout, shots=out, window=window)
        good = report(results)
        print(f"النافذةُ المحسوبة: {window} — {len(letters)} حرفاً")
        print(f"اللوحة: {out}" if out.exists() else "تعذّرت اللقطة")
        return 0 if out.exists() and good else 1
    if args.open:
        print("العدّةُ مفتوحةٌ في المتصفّح — أغلِقه لإنهاء الخادم.")
        drive("?open=1", args.port, 3600, show=True)
        return 0
    ap.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
