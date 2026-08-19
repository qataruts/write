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
import math
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
GHOST_OUT = TOOLS / "ghost_paths.json"   # الخيالُ خالصاً — مرجعُ طبقة المالك
SEATING = TOOLS / "line_seating.json"   # تحويلُ الجلوس — به تُنقل المقيساتُ القديمة
CURRICULUM = ROOT / "app" / "js" / "curriculum.js"
FORMS = ["isolated", "initial", "medial", "final"]

# **قسمُ أشكال التهيئة في العدّة** — تُبصَم حدودُه فيُعرَف أنّ الوحدةَ بُنيت منه
# بعينه: تعديلُ تعريفٍ هندسيّ بلا إعادة بناءٍ يحمرّ من نفسه (نظيرُ بصمة الإيماءات).
WARM_SECTION = ("// ————— ٧ب) أشكالُ التهيئة الحركية", "// ————— ٨) العرضُ")

sys.path.insert(0, str(TOOLS))
import browser_test  # noqa: E402  (حظيرةُ الخادم ومُشغِّلُ Chrome — تبعيةٌ معلَنة)
import line_layer  # noqa: E402  (سطرُ الكتابة وحدةً لا الحرف — بند ص٢/ب)
import owner_layer  # noqa: E402  (طبقةُ المالك — أثرُ يده مسارَ محرّكٍ، بند ص٦)
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
          window: str = None, anchors_file: Path = None, pages: dict = None) -> list:
    """يفتح العدّةَ بوضعٍ من أوضاعها ويعيد ما أرسلته (أو يلتقط صورتها).

    و`anchors_file` **إيماءةٌ أخرى تُخدَم مكانَ الملفّ** — تستعملها لوحةُ مرشّحات
    الكرّاسة (`craft_panel.py`، الجلسة ٧): جوابان لحالةٍ حركية يُبنيان ويُصوَّران من
    ملفّين مؤقّتين، **وملفُّ المشروع لا يُمَسّ حتى يحكم المالك**.
    """
    results = []
    browser_test.PAGES["/__make_paths.html"] = TOOL_PAGE
    browser_test.PAGES["/__anchors.json"] = anchors_file or ANCHORS
    # **وملفّاتُ الدفعة تُخدَم من القرص** (التجزئة): قانونيّاتُ الحروف وما يُنسَخ بلا
    # بناء — تُقرأ في الصفحة بـ`fetch`، فلا تُحمَل في العنوان ولا تُبنى مرّتين.
    for route, file in (pages or {}).items():
        browser_test.PAGES[route] = file
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


# ————— سماحةُ الجزء الصغير الملحق: **تُصنَّف هنا وتُعلَن في البيان** —————
#
# 🔴 **حكمُ المالك (١٧ أغسطس ٢٠٢٦)** على صيد أوّل جلسة ميدان: طفلةُ الخامسة سقطت أربع
# مرّاتٍ متتالية على **الجزء الثاني للكاف** وحدَه (شولتِه)، ووافقت عينُه أنه «لم
# ينضبط». والحكم: تُخفَّف سماحةُ هذا الجزء — **صفةً في بيانه لا فرعاً في `pen.js`**.
#
# **والتصنيفُ هنا لأنه صفةُ شكلٍ لا حالةُ طفل**: ضربةٌ **ليست أولى الشكل** وطولُها
# **دون نصف أطولِ ضربةٍ فيه** جزءٌ ملحقٌ صغير. فيقع اليومَ على شولتَي الكاف
# (مفردةً ٠٫٣٦ ونهائيةً ٠٫٣٠) ولا يقع على ما قاربَ النصفَ من فوق (ثانيةُ ط/ظ ٠٫٥٣–٠٫٥٨،
# ووسطى ٣ ٠٫٥١) — **وما زاد من أجزاءٍ غداً يُصنَّف يومَ يُكتب** بلا سطرٍ يُضاف.
#
# **ورقمُه من الهندسة لا من يد**: كم يبلغ الجزءُ من أطولِ ضربةٍ في شكله مقلوباً — فما
# صغر نصيبُه من التخفيف أكبر، **وحدُّه الأدنى أرضيّةُ `pen.js`** (`EASE_FLOOR`،
# معايرةٌ على الشاهد المجمَّد). ويقرؤه المحرّكُ تغطيةً وحدَها: بابُ الاتجاه لا يُفتَح.
SMALL_PART = 0.5


def path_len(points) -> float:
    return sum(math.dist(points[i - 1], points[i]) for i in range(1, len(points)))


def ease_of(strokes: list) -> list:
    """سماحةُ كلِّ ضربةٍ من الشكل — `None` لمن ليس جزءاً ملحقاً صغيراً."""
    lens = [path_len(s["points"]) for s in strokes]
    if not lens:
        return []
    longest = max(lens)
    return [None if i == 0 or not longest or length >= longest * SMALL_PART
            else round(longest / length, 2)
            for i, length in enumerate(lens)]


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
            # **صندوقُ المادّة وسطرُها يسافران معها** (بند ص٢/ب ٢ و٤): الخليّةُ
            # مربّعُ السطر الواحد للهجاء كلِّه، و`line` خطُّ الأساس الذي يجلس عليه
            # الشكل — يرسمه اللوحُ ويوفّق عليه الحكمُ الثاني (`tools/line_layer.py`).
            if ref.get("box"):
                lines.append(f'    "box": [{num(ref["box"][0])}, {num(ref["box"][1])}],')
            if ref.get("line") is not None:
                lines.append(f'    "line": {num(ref["line"])},')
            if ref.get("tolerance") is not None:
                lines.append(f'    "tolerance": {ref["tolerance"]},')
            lines.append('    "strokes": [')
            eases = ease_of(ref["strokes"])
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
                # **وسماحةُ الجزء الملحق الصغير صفةٌ فيه كالطيّة** (`ease_of` أعلاه):
                # تُحسب من هندسة الشكل، فلا تُكتب بيد ولا يُذكَر حرفٌ باسمه في المحرّك.
                if eases[si]:
                    tail += f', "ease": {eases[si]}'
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


# ————— 🧩 البناءُ دفعاتٍ (حكمُ المدير، ١٥ أغسطس ٢٠٢٦) —————
#
# **علّتُه مقيسة**: البناءُ في تشغيلةٍ واحدة يمشي على ١١٢ شكلاً ثم ٨٩٠ وحدةَ نسخٍ
# **بلا نبضٍ حتى يتمّ** — فإن جاوز مهلتَه ضاع العملُ كلُّه (وقع مرّتين في جلسة م-ن:
# ٦٠٠ث و٢٧٠٠ث، وكروم يعمل ولا حصيلة). فصار:
#   · **دفعةُ حروفٍ واحدة** تكتب القانونيّاتِ إلى `scratch/build/canon.json`،
#   · **ثم دفعاتُ كلماتٍ** بحدَّين من قائمة العمل، كلٌّ في تشغيلتها ومهلتها، تكتب
#     جزأها إلى `scratch/build/words-<من>.json` **وتطبع نبضَها باسمها**،
#   · **ثم يُجمَّع** الملفّان من الأجزاء.
# **وعهدُ «لا وحدةَ ناقصة» على الملفّ النهائيّ حيث كان**: جزءٌ ناقصٌ لا يُكتب منه ملفّ.
# **والدفعةُ الخضراءُ لا تُعاد**: جزؤها على القرص ببصمة عدّته ومادّته، فإن طابقتا
# نُسخ ولم يُبنَ — فإعادةُ التشغيل تكمل من حيث وقفت لا من أوّلها.
PARTS = ROOT / "scratch" / "build"


# **الحروفُ المنقوطة** — جدولُ الحقيقة الإملائية نفسُه الذي يحرسه `check_paths.py`:
# ما خلا نصُّ الكلمة منها لم يمسّه فكُّ النقاط، فيُنسَخ جزؤه بلا بناء.
DOTTED = set("بتثنجخذزشضظغفقية")


def part_stamp() -> str:
    """بصمةُ الدفعة: عدّةُ البناء وإيماءاتُها ومادّتُها — تبدّلَ أحدُها فالجزءُ شاخ."""
    tool = hashlib.sha1(TOOL_PAGE.read_bytes()).hexdigest()[:12]
    return f"{tool}·{sha()}·{material_sha()}"


# ————— **الرفعاتُ الزائدة تُدمَج**: جدولُ `NASKH_CROSS §٢` (بند ص٢/ب ٣) —————
#
# **القاعدةُ الجامعة** (`STROKE_ORDER §٧هـ`): «عددُ ضربات الشكل = عددُ رفعات القلم
# **التي يوجبها الخطّ**، لا أكثر» — ويوجبها: **حرفٌ لا يوصل بما بعده** (د ذ ر ز و ا)
# · **شولةُ الكاف** · **النقاط** · **وعمودُ ط/ظ**. وما زاد **رفعٌ زائدٌ يُدرَّس للطفل
# بلا موجب**: فمن وصَل حيث يصل الخطّاطُ رُدَّ عليه.
#
# **والعددُ منقولٌ من المرجع لا مستنبَطٍ من صورتنا** (`docs/NASKH_CROSS.md §٢`،
# قرأتها الإدارةُ صفحةً صفحة) — وهذا الجدولُ نصُّها بعينه: الشكلُ وكم ضربةً له.
# **والدمجُ من المقدّمة**: الزائدُ في هذه الأحدَ والعشرين **مدخلُ الوصل انفصل عن
# جسمه**، وما يوجبه الخطّ (عمودُ ط/ظ وشولةُ الكاف) **آخِرُ الضربات** — فيبقى.
#
# ⚠ **وما بين الضربتين حبرٌ يقوله المرجعُ وضاع من خيالنا**: الوصلُ يمضي والقلمُ
# على الورق، فخيالُ الحرف المُشكَّل قطعه. **فالدمجُ يصله بأقصر طريق** ثم تُعاد
# خطوةُ المحرّك على المسار كلِّه فيُمشى الوصلُ كما يُمشى غيرُه. **وطولُ ما وُصل
# يُطبع شكلاً شكلاً** — فما طال منه شكلٌ يُشتقّ من المرجع في ص٢/ج، لا وصلٌ يُدَّعى.
MERGES = {
    "ث/final": 1, "ه/medial": 1, "م/medial": 1, "م/final": 1, "س/medial": 1,
    "ش/medial": 1, "ش/final": 1, "ل/medial": 1, "ل/final": 1, "ع/initial": 1,
    "غ/initial": 1, "ص/initial": 1, "ص/medial": 1, "ص/final": 1, "ض/medial": 1,
    "ض/final": 1, "ك/final": 2, "ط/medial": 2, "ط/final": 2, "ظ/medial": 2,
    "ظ/final": 2,
}

# ————— 🔑 **وأربعٌ لها هدفٌ بيد المالك** (`NASKH_CROSS §٥`، ١٩ أغسطس ٢٠٢٦) —————
#
# > «`ص/ابتدائي` بضربةٍ واحدة — كنبرةٍ بعد الصاد مباشرةً بلا انقطاع · `ص/وسطي`
# > بضربتين: واحدةٌ قبل الصاد، وجسمُ الصاد مثلُ الابتدائية · `ض/ابتدائي` و`ض/وسطي`
# > كالصاد التي قبلها.»
#
# **وحكمُه أدقُّ من قراءة الإدارة** (§٢ قالت الوسطيَّ ضربةً واحدة): **مدخلُ الوصل
# ضربةٌ مستقلّة** — فلا تُدمَج ثلاثٌ في واحدة بل **ثلاثٌ في اثنتين**، والملتحمُ
# **آخِرُ الضربتين** لا أوّلُهما. ⇐ فالوصلُ يُسمّى بموضعه: `junction` رقمُ الفاصل
# الذي يُغلَق (بين الضربة `i` والتي تليها).
#
# **وفيصلُ السماحة لا يحكم هنا**: هو ظنٌّ يفرّق الرفعةَ المزعومة من الوصل المخترَع
# **حين لا يُعرَف الحقّ**، **وقد عُرف بنصِّه** — فتُطبع الفجوةُ ولا تَحجُب.
# **و`ض` تتبع `ص` بلا نصٍّ ثانٍ**: أختان بجسمٍ واحد (بند ص٢/ب ٥) — تُشتقّ بعد هذا.
OWNER_MERGES = {
    "ص/initial": [0],      # صادٌ ثم نبرةٌ بلا انقطاع — ضربةٌ واحدة
    "ص/medial": [1],       # [مدخلُ وصل] ثم [صاد + نبرة] — ضربتان
}


# ————— 📖 **إملاءُ البنية من المرجع** (`NASKH_CROSS §٦`، جلسة ص٢/د) —————
#
# **علّةُ هذا الجدول برهانٌ لا رأي**: أثبتت ص٢/ج أنّ صور المرجع **لا تُقرأ آلياً**
# (ثقبُ `و/معزول` خرج أوسعَ من الحرف — لأنّ أسهمَ الكتاب وأرقامَه داخلَ الكنتور).
# ⇐ **فالبنيةُ تُقرأ بعينٍ وتُملى عدداً**، كما فعل المالكُ في ص وض. وهذه الأربعةَ
# عشرَ **قرأتها الإدارةُ بالتكبير** (§٦أ عشرةً بيقين) **وثبّتها المنفّذُ بقصِّ خانتها
# ونظرِها** (§٦ب أربعاً: ث/نهائي · س/وسطي · ش/وسطي · ك/نهائي).
#
# **وفيصلُ السماحة لا يحكم فيها** — كما لم يحكم في ص وض: هو ظنٌّ يفرّق الرفعةَ
# المزعومة من الوصل المخترَع **حين لا يُعرَف الحقّ**، **وقد عُرف بالنظر في المرجع**.
# فتُطبع فجوةُ كلِّ وصلٍ ولا تَحجُبه — **والإعلانُ بالرقم لا بالسكوت**.
#
# **والموضعُ من المقدّمة** كما في سائر الجدول: الزائدُ **مدخلُ الوصل انفصل عن جسمه**،
# وما يوجبه الخطُّ (**عمودُ ط/ظ** و**شولةُ الكاف**) **آخِرُ الضربات** فيبقى.
# ⚠ **و`ل/نهائي` عمودُه صعودٌ ثم نزول** — **طيّةٌ لا رفعُ قلم**: تُكشف بمقياس
# `owner_layer.self_folds` نفسِه في `line_layer.restep` بعد الدمج، فلا يُقرأ العودُ
# `reverse` ولا يُخترع لها رقم.
#
# **وستّةَ عشرَ كانت تخالف المرجعَ فبقيت اثنتان**: `ص/نهائي` و`ض/نهائي` —
# **لم يحكم فيهما المالكُ ولم تحسمهما الصورة**: قُصَّت خانتُهما من الصفحة بصندوق
# بكسلها في `naskh_metrics.json` ونُظرت مكبَّرة **فلا رقمَ فيها ولا قفزةَ تُرى** — وحبرُ المرجع
# متّصلٌ في كلِّ شكلٍ سواءٌ رُفع القلمُ أم لم يُرفع. **ولا يُقاس على الابتدائيّ
# والوسطيّ** (نهيُ الإدارة) — فتُرفعان إلى المالك على حالهما (ضربتان).
DICTATED = {
    "ع/initial", "غ/initial", "ط/medial", "ط/final", "ظ/medial", "ظ/final",
    "م/medial", "م/final", "ل/medial", "ل/final",          # §٦أ — عشرةٌ بيقين
    "ث/final", "س/medial", "ش/medial", "ك/final",          # §٦ب — أربعٌ ثُبِّتت بالنظر
}


def merge_layer(paths: dict) -> dict:
    """يدمج ما فجوتُه دون ما يفرّقه المحرّك، **ويرفع ما سواه بأرقامه**.

    🔴 **والفيصلُ قِيس ولم يُختَر** (وهو عينُ فيصل §٧د): **ما دون سماحة الانحراف
    (٩٠) لا يفرّق المحرّكُ بين موضعيه أصلاً** — فتلك «رفعةٌ مزعومة»: حركةٌ واحدة
    شُطرت ضربتين، ودمجُها **يردّ ما كان**، ولا يخترع حبراً.

    ⚠ **وما جاوزها فالوصلُ فيه اختراع**: بين الضربتين حبرٌ **منحنٍ** يقوله المرجعُ
    وضاع من خيالنا، والدمجُ الميكانيكيُّ يصله **بخطٍّ مستقيم** فيُدرِّس الطفلَ
    حركةً ليست في الخطّ. **وقِيس ثمنُه فكان ثقيلاً**: بدمج الأحدَ والعشرين كلِّها
    ارتفعت حمراءُ `test_paths` من **٧ إلى ١٦** — أحدَ عشرَ شكلاً هبط احتمالُه
    للرجفة دون عهد `child-drift` (ط/وسطي ١٨ · ط/نهائي ٢١ · ظ/نهائي ٢٧ …)، وانكسر
    في `test_direction` إغلاقُ ص وض على ملتقى العين. ⇐ **فهذه لا تُدمَج دمجاً بل
    يُشتقّ شكلُها من المرجع** (ص٢/ج)، وتُطبع هنا بأرقامها فلا تُنسى.
    """
    limit = owner_layer.tolerance()["lateral"]
    done, raised, named = [], [], []
    # **حكمُ المالك أوّلاً**: فما سمّاه بعدده وموضعه لا يُعرَض على فيصل ظنٍّ.
    for key, joints in OWNER_MERGES.items():
        ch, form = key.split("/")
        ref = (paths.get(ch) or {}).get(form)
        if not ref:
            continue
        was = len(ref["strokes"])
        for i in sorted(joints, reverse=True):
            if i + 1 >= len(ref["strokes"]):
                continue
            head, nxt = ref["strokes"][i], ref["strokes"][i + 1]
            gap = round(math.dist(head["points"][-1], nxt["points"][0]))
            ref["strokes"] = (ref["strokes"][:i]
                              + [{"start": head["start"],
                                  "points": head["points"] + nxt["points"]}]
                              + ref["strokes"][i + 2:])
            named.append({"key": key, "from": was, "to": len(ref["strokes"]),
                          "joint": i, "gap": gap})
    for key, want in MERGES.items():
        if key in OWNER_MERGES:
            continue
        ch, form = key.split("/")
        ref = (paths.get(ch) or {}).get(form)
        if not ref or len(ref["strokes"]) <= want:
            continue
        spans = [round(math.dist(ref["strokes"][i]["points"][-1],
                                 ref["strokes"][i + 1]["points"][0]))
                 for i in range(len(ref["strokes"]) - want)]
        row = {"key": key, "to": want, "from": len(ref["strokes"]), "bridges": spans}
        row["dictated"] = key in DICTATED
        # **وإملاءُ المرجع مقدَّمٌ على فيصل الظنّ** (`NASKH_CROSS §٦`): ما قُرئ
        # بالعين لا يُعرَض على مسطرةٍ تفرّق الرفعةَ المزعومة من غيرها — والفجوةُ
        # تُطبع ولا تَحجُب.
        if max(spans) >= limit and not row["dictated"]:
            raised.append(row)
            continue
        strokes = list(ref["strokes"])
        while len(strokes) > want:
            head, nxt = strokes[0], strokes[1]
            strokes = [{"start": head["start"],
                        "points": head["points"] + nxt["points"]}] + strokes[2:]
        ref["strokes"] = strokes
        done.append(row)
    raised.sort(key=lambda r: -max(r["bridges"]))
    for row in named:
        print(f"   🔑 {row['key']}: {row['from']} ⇐ {row['to']} ضربةً بحكم المالك"
              f" (`NASKH_CROSS §٥`) — أُغلق الفاصلُ {row['joint']} وفجوتُه {row['gap']}"
              + ("" if row["gap"] < limit else f" (فوق فيصل الظنّ {limit:.0f}،"
                                               " وحكمُه مقدَّمٌ عليه)"))
    print(f"\n✂️  الرفعاتُ الزائدة بجدول `NASKH_CROSS §٢`: {len(MERGES)} شكلاً"
          f" — دُمج {len(done)} منها {sum(1 for r in done if r['dictated'])} بإملاء"
          f" المرجع (§٦) وسائرُها فجوتُه دون {limit:.0f}، وبقي {len(raised)}")
    for row in done:
        why = ("إملاءُ المرجع `NASKH_CROSS §٦`" if row["dictated"] else "رفعةٌ مزعومة")
        print(f"   {'📖' if row['dictated'] else '✓'} {row['key']}:"
              f" {row['from']} ⇐ {row['to']} ضربةً"
              f" (فجوةٌ {'، '.join(str(b) for b in row['bridges'])} — {why})")
    print("   ○ ويبقى بلا دمجٍ (لا نصَّ مالكٍ ولا إملاءَ مرجعٍ فيه): "
          + "، ".join(f"{r['key']} {max(r['bridges'])}" for r in raised))
    return {"merged": done, "raised": raised, "named": named, "limit": limit}


# ————— **أمرا المالك في الشكل**: أختان بجسمٍ واحد (بند ص٢/ب ٥) —————
#
# «`س` الأربعةُ من `ش` بلا نقاط · و`ض` الأربعةُ من `ص` بنقطة» — أمرُ المالك (١٩
# أغسطس ٢٠٢٦). **وعلّتُه في الخطّ لا في العدّة**: جسمُ الشين جسمُ السين بعينه
# والفارقُ نقطُه، وجسمُ الضاد جسمُ الصاد والفارقُ نقطتُه — **فلا يجوز أن تفترق
# أختان في جسمٍ واحد** لأنّ اليد رسمتهما مرّتين. وهو عينُ ما يفعله `twins` في
# الأرقام: مسارٌ واحدٌ يُدَّعى ويُحرَس.
#
# **ولا يُمَسّ `owner_shapes.json`**: أثرُ يد المالك يبقى بختمه شاهداً، والاشتقاقُ
# يجري في البناء **بعد طبقته وقبل الجلوس على السطر** — فيُقيَّد في نسب الوحدة.
DERIVED = [
    {"from": "ش", "to": "س", "dots": 0,
     "why": "جسمُ الشين جسمُ السين — والفارقُ نقطُه (أمرُ المالك ١٩ أغسطس ٢٠٢٦)"},
    {"from": "ص", "to": "ض", "dots": 1,
     "why": "جسمُ الضاد جسمُ الصاد — والفارقُ نقطتُه (أمرُ المالك ١٩ أغسطس ٢٠٢٦)"},
]


def derive_layer(paths: dict) -> list:
    """يشتقّ الأختَ من أختها بجسمها ونقطِها المعلَن — ويعيد قيداً بما اشتُقّ.

    **وموضعُ النقطة يُقرأ من أثر المالك في الحرف المشتَقّ نفسِه**: نسبتُها من صندوق
    حبره تُنقَل إلى صندوق الجسم الجديد — فلا يُكتب إحداثيٌّ بيد ولا يُقدَّر موضع.
    """
    done = []
    for rule in DERIVED:
        src, dst = paths.get(rule["from"]), paths.get(rule["to"])
        if not src or not dst:
            continue
        for form in FORMS:
            if form not in src or form not in dst:
                continue
            was, body = dst[form], src[form]
            old_box = line_layer.ink(was)
            new_box = line_layer.ink({"strokes": body["strokes"], "dots": []})
            dots = []
            for dot in was["dots"][:rule["dots"]]:
                rx = ((dot["at"][0] - old_box[0]) / max(old_box[1] - old_box[0], 1e-6))
                ry = ((dot["at"][1] - old_box[2]) / max(old_box[3] - old_box[2], 1e-6))
                dots.append({**dot, "at": [
                    round(new_box[0] + rx * (new_box[1] - new_box[0]), 1),
                    round(new_box[2] + ry * (new_box[3] - new_box[2]), 1)]})
            dst[form] = {"strokes": [json.loads(json.dumps(one)) for one in body["strokes"]],
                         "dots": dots}
            done.append(f"{rule['to']}/{form}")
    for rule in DERIVED:
        how = "بلا نقاط" if not rule["dots"] else f"بـ{rule['dots']} نقطة"
        print(f"🤝 {rule['to']} الأربعةُ من {rule['from']} {how} — {rule['why']}")
    return done


def seat_layer(paths: dict) -> dict:
    """**سطرُ الكتابة وحدةً لا الحرف** (بند ص٢/ب ١): يُنزِّل الأشكالَ على سطرٍ واحد
    بمقياسٍ عامٍّ واحد قبل أن تُكتب الوحدة — ويطبع ما تبدّل من نِسَب.

    وموضعُها **بعد طبقة المالك**: النسبةُ تُحفَظ على الشكل الذي يُدرَّس فعلاً، لا
    على خيالٍ تعلوه يدٌ بعده فتعيد كسرَه.
    """
    before = {f"{ch}/{form}": line_layer.ink(shape)
              for ch, forms in paths.items() for form, shape in forms.items()}
    seated, rep = line_layer.seat(paths)
    sp = rep["spec"]
    unit = sp["unit"]
    print(f"\n📏 سطرُ الكتابة: الوحدةُ {unit} · القمّة {sp['cap']} · الأساس {sp['base']}"
          f" · الخليّة {sp['cell']}² — ومقياسٌ عامٌّ واحد للهجاء كلِّه")
    measured = [r for r in rep["shapes"] if r["ref"] is not None]
    off = max((abs(r["got"] - r["ref"]) for r in measured), default=0)
    moved = sorted(measured, key=lambda r: -abs(
        (before[r["key"]][3] - before[r["key"]][2]) / unit - r["ref"]))[:5]
    # **وما بقي بعيداً عن المرجع يُعَدّ ويُطبع** (مدخلُ ص٢/ج): الارتفاعُ صار عينَ
    # المرجع بالحساب، **والعرضُ شهادةُ الشكل نفسِه** — فهو ما لا يصلحه مقياسٌ
    # منتظم: شكلٌ عرضُه يخالف صفَّه شكلٌ يخالف صفَّه، ويُشتقّ من المرجع اشتقاقاً.
    wide = sorted((abs(r["got_width"] - r["ref_width"]) for r in measured), reverse=True)
    far = [r for r in measured if abs(r["got_width"] - r["ref_width"]) > 0.15]
    print(f"   {len(measured)} شكلاً على نسبة المرجع (أقصى فرقٍ {off:.4f} من الألف)"
          f" · و{len(rep['shapes']) - len(measured)} بلا سندٍ نُقلت بحجمها")
    print(f"   وبقي بعيداً عن المرجع **عرضاً** {len(far)} شكلاً (فوق ٠٫١٥ من الألف)"
          f" — وسيطُ الفرق {wide[len(wide) // 2]:.3f} وأقصاه {wide[0]:.3f}: مدخلُ ص٢/ج")
    for r in moved:
        was = (before[r["key"]][3] - before[r["key"]][2]) / unit
        print(f"   ⤷ {r['key']}: {was:.2f} ⇐ {r['ref']:.2f} من الألف")
    for ch, forms in seated.items():
        paths[ch] = forms
    SEATING.write_text(json.dumps({
        "what": "تحويلُ الجلوس على السطر لكلِّ شكل — `p' = to + (p - from) × scale`",
        "why": "به يُنقَل إلى إطار السطر ما قِيس في الإطار القديم، **وأثقلُه آثارُ"
               " الأطفال المجمَّدة** (`tools/pen_traces.json`): تُنقَل بالتحويل نفسِه"
               " الذي نُقل به نموذجُها فتبقى العلاقةُ بينهما بحرفها — ولا تُعاد"
               " تجربةُ ميدانٍ ولا يُكتب أثرٌ بيد.",
        "tool": "tools/make_paths.py --seat",
        "spec": rep["spec"],
        "shapes": {r["key"]: {"scale": r["scale"], "from": r["from"], "to": r["to"],
                              "kx": r["kx"], "capped": r["capped"]}
                   for r in rep["shapes"]},
    }, ensure_ascii=False), encoding="utf-8")
    return {
        "tool": "tools/line_layer.py",
        "unit": unit, "cap": sp["cap"], "base": sp["base"], "cell": sp["cell"],
        "top": sp["top"], "low": sp["low"],
        "measured": len(measured), "unsupported": len(rep["shapes"]) - len(measured),
        "off": round(off, 4), "far": len(far), "farLimit": 0.15,
        "widthMedian": round(wide[len(wide) // 2], 4),
        "why": "النسبةُ بين الحروف تُحفَظ (أمرُ المالك ١٩ أغسطس ٢٠٢٦): مقياسٌ عامٌّ"
               " واحدٌ للهجاء كلِّه وثلاثةُ خطوطٍ ثابتة، وكلُّ شكلٍ يأخذ نصيبَه من"
               " `tools/naskh_metrics.json` — لا يُكبَّر حرفٌ وحدَه ليملأ خليّتَه.",
    }


def seat_build() -> int:
    """**إعادةُ كتابة وحدة الحروف بلا متصفّح** — من جرد الخيال وطبقةِ المالك.

    **ولا إحداثيَّ يُكتب بيد**: الخيالُ محفوظٌ بجرده (`tools/ghost_paths.json`) وقد
    خرج من العدّة ساعةَ البناء ببصمة إيماءاتها، وطبقةُ المالك تُعاد من ملفّها،
    وطبقةُ السطر حسابٌ محض. **وشرطُ صحّتها معلَنٌ ومحروس**: بصمةُ الإيماءات في الجرد
    تطابق ملفَّها اليوم — فإن تبدّلت إيماءةٌ لزم البناءُ الكاملُ بمتصفّحه.
    """
    if not GHOST_OUT.exists():
        print("لا جردَ للخيال — يلزم البناءُ الكامل (`--build`).")
        return 1
    ghost = json.loads(GHOST_OUT.read_text(encoding="utf-8"))
    if ghost.get("sha") != sha():
        print(f"جردُ الخيال بُني على إيماءةٍ أخرى ({ghost.get('sha')} ≠ {sha()})"
              " — يلزم البناءُ الكامل (`--build`).")
        return 1
    paths, prior = ghost["paths"], paths_module()[1]
    owner_layer.set_ghost(paths)
    hand, owner = owner_layer.layer()
    for ch, family in hand.items():
        paths.setdefault(ch, {}).update(family)
    away = max((row["away"] for row in owner["panel"]), default=0)
    print(f"✍️  طبقةُ المالك: {owner['shapes']} شكلاً من يده تعلو الخيال")
    merged = merge_layer(paths)
    derived = derive_layer(paths)
    seating = seat_layer(paths)
    seating["derived"] = derived
    seating["merged"] = merged["merged"] + merged["named"]
    seating["raised"] = [r["key"] for r in merged["raised"]]
    meta = dict(prior or {}, line=seating)
    meta["owner"] = dict(meta.get("owner") or {}, sha=owner["sha"],
                         shapes=owner["shapes"], passes=owner["passes"], away=away,
                         limit=owner["limit"], ghost=[r["key"] for r in owner["dropped"]])
    OUT.write_text(write_module(paths, meta), encoding="utf-8")
    forms = sum(len(v) for v in paths.values())
    print(f"\nكُتب {OUT.relative_to(ROOT)}: {len(paths)} حرفاً في {forms} شكلاً")
    return 0


def build(port: int, timeout: int, chunk: int = 100, fresh: bool = False) -> int:
    PARTS.mkdir(parents=True, exist_ok=True)
    stamp = part_stamp()
    canon_file = PARTS / "canon.json"
    reuse_file = PARTS / "reuse.json"

    # ١) دفعةُ الحروف: الحروفُ وأشكالُ التهيئة والقانونيّات (ومنها المتغيّراتُ ولام-ألف)
    results = drive("?build=1&part=letters", port, timeout)
    if not results:
        print("لم تصل حصيلةٌ من دفعة الحروف (تحقّق من تشغيل Chrome).")
        return 1
    good = report(results)
    payload = next((r for r in results if "paths" in r), None)
    if not good or not payload:
        return 1
    canon_file.write_text(json.dumps(payload["canon"], ensure_ascii=False), encoding="utf-8")
    total = int(payload.get("wordItems") or 0)
    print(f"\n🧩 دفعةُ الحروف تمّت — قائمةُ عمل الكلمات {total} وحدةً،"
          f" والدفعةُ {chunk}\n")

    # ٢) **ما لم يتبدّل مدخلُه لا يُعاد بناؤه**: تبديلُ هذه الجلسة **فكُّ النقاط**،
    #    فما خلا نصُّه من حرفٍ منقوطٍ لم يمسّه شيء — يُنسَخ من البناء القائم كما هو.
    #    وحدُّه معلَنٌ: أيُّ تبديلٍ آخر في العدّة يُبطِله، **وبصمةُ العدّة في الجزء**
    #    هي التي تحرسه — ومع `--fresh` لا يُنسَخ شيء.
    prior, _ = words_module()
    reuse = {}
    if prior and not fresh:
        reuse = {text: ref for text, ref in prior.items()
                 if not any(ch in DOTTED for ch in text)}
    reuse_file.write_text(json.dumps(reuse, ensure_ascii=False), encoding="utf-8")
    print(f"والمنسوخُ بلا بناءٍ (بلا حرفٍ منقوط): {len(reuse)} من {len(prior or {})}\n")

    # ٣) دفعاتُ الكلمات — كلٌّ بحدَّيها، وجزؤها على القرص ببصمته
    pages = {"/__canon.json": canon_file, "/__reuse.json": reuse_file}
    chunks = []
    for start in range(0, total, chunk):
        stop = min(start + chunk, total)
        part_file = PARTS / f"words-{start:04d}.json"
        if part_file.exists() and not fresh:
            try:
                kept = json.loads(part_file.read_text(encoding="utf-8"))
                # **والجزءُ يحمل حدَّيه**: تبديلُ حجم الدفعة يبدّل ما يغطّيه الاسمُ
                # نفسُه — فلولا الحدّان لَقُرئ جزءُ مئةٍ على أنه جزءُ خمسٍ وعشرين
                # فضاعت خمسٌ وسبعون وحدةً **صامتةً**.
                if kept.get("stamp") == stamp and kept.get("from") == start \
                        and kept.get("to") == stop:
                    chunks.append(kept)
                    print(f"  ⤷ [{start}–{stop}] جزءٌ قائمٌ ببصمته — لا يُعاد")
                    continue
            except json.JSONDecodeError:
                pass
        got = drive(f"?build=1&part=words&from={start}&to={stop}", port, timeout, pages=pages)
        if not got:
            print(f"  ✗ [{start}–{stop}] لم تصل حصيلةٌ — الأجزاءُ الخضرُ محفوظة،"
                  " وإعادةُ التشغيل تكمل من هنا.")
            return 1
        report(got)
        piece = next((r for r in got if "chunk" in r), None)
        if not piece:
            print(f"  ✗ [{start}–{stop}] دفعةٌ بلا حصيلة")
            return 1
        data = {"stamp": stamp, "from": start, "to": stop, **piece["chunk"]}
        part_file.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        chunks.append(data)

    # ٤) التجميع: الكلماتُ من الأجزاء كلِّها، والشكاوى مجموعةً
    words = {}
    glyphs = {}
    failed, failed_pairs, failed_sentences, reports = [], [], [], []
    for piece in chunks:
        words.update(piece.get("words") or {})
        glyphs.update(piece.get("glyphs") or {})
        failed += piece.get("failed") or []
        failed_pairs += piece.get("failedPairs") or []
        failed_sentences += piece.get("failedSentences") or []
        reports += piece.get("report") or []
    for line in failed:
        print(f"  ✗ كلمةٌ لم تُبنَ — {line}")
    print(f"\nالكلماتُ المجمَّعة: {len(words)} من {total}"
          f" · سقطت {len(failed)} كلمةً و{len(failed_pairs)} سطرَ مسافةٍ"
          f" و{len(failed_sentences)} جملة")
    if failed:
        print(f"{len(failed)} كلمةً لم تُبنَ — لا تُكتب وحدةٌ ناقصة.")
        return 1
    payload["words"] = words
    payload["markGlyphs"] = glyphs
    payload["dropped"] = [{"kind": "sentence", "why": why} for why in failed_sentences] \
        + [{"kind": "pair", "why": why} for why in failed_pairs]
    payload["meta"]["failedPairs"] = failed_pairs
    payload["meta"]["failedSentences"] = failed_sentences
    payload["meta"]["words"] = reports
    # **ولا تُكتب وحدةٌ من بناءٍ محدود**: `--only` في العدّة قياسُ مرشّحاتٍ لا بناءُ
    # منهج، ولو كُتبت منه الوحدةُ لخرجت ناقصةَ الحروف صامتةً.
    if payload.get("partial"):
        print(f"بناءٌ محدود بـ«{payload['partial']}» — لا تُكتب منه الوحدة.")
        return 1
    paths = payload["paths"]

    # ————— **٥) طبقةُ المالك تعلو الخيال** (بند ص٦) —————
    #
    # الخيالُ ألّف الشكلَ من مُشكِّل العربية، **وأثرُ يد المالك ألّفه من يدٍ تكتبه**
    # — وهو المرجعُ حين يجتمعان (حكمُه ١٨ أغسطس ٢٠٢٦: «اعتمد ما بعثته لك بعد
    # التنقيح»). فما جاء منه يعلو، **وما لم يصل منه — أو ردَّه فاحصُ المحرّك — يبقى
    # على الخيال بعلّةٍ معلنة** تُكتب في نسب الوحدة فلا يُظَنّ يوماً أنه من يده.
    # **والخيالُ يُجرَد قبل أن يعلوَه**: حصيلةُ المتصفّح هي الخيالُ خالصاً، فتُكتب
    # جرداً يقرؤه `owner_layer` مرجعاً للنِّسَب — فلا يقيس البناءُ إلى نفسه.
    GHOST_OUT.write_text(json.dumps({
        "what": "الخيالُ خالصاً — حصيلةُ عدّة التأليف قبل أن تعلوَها طبقةُ المالك",
        "tool": "tools/make_paths.py --build",
        "sha": sha(),
        "paths": payload["paths"],
    }, ensure_ascii=False), encoding="utf-8")
    owner_layer.set_ghost(payload["paths"])
    hand, owner = owner_layer.layer()
    for ch, family in hand.items():
        paths.setdefault(ch, {}).update(family)
    away = max((row["away"] for row in owner["panel"]), default=0)
    print(f"\n✍️  طبقةُ المالك: {owner['shapes']} شكلاً من يده تعلو الخيال"
          f" — أقصى بُعدٍ عن أثره {away} من {owner['limit']:.0f}")
    for row in owner["dropped"]:
        print(f"  ○ {row['key']}: بقي على الخيال — {row['why']}")

    merged = merge_layer(paths)
    derived = derive_layer(paths)
    seating = seat_layer(paths)
    seating["derived"] = derived
    seating["merged"] = merged["merged"] + merged["named"]
    seating["raised"] = [r["key"] for r in merged["raised"]]

    meta = {
        "tool": "tools/make_paths.html",
        "gesture": "tools/path_anchors.json",
        "sha": sha(),
        "grid": payload["meta"]["grid"],
        "font": "NotoNaskhArabic — نسخٌ مدرسيّ (ق٢)",
        "owner": {
            "file": "tools/owner_shapes.json",
            "sha": owner["sha"],
            "at": "2026-08-18",
            "shapes": owner["shapes"],
            "passes": owner["passes"],
            "away": away,
            "limit": owner["limit"],
            "ghost": [row["key"] for row in owner["dropped"]],
            "why": "أثرُ يد المالك مرجعَ الشكل والحركة (بند ص٦) — والتنقيحُ تكثيفٌ"
                   " ثم تنعيمُ توبين ثم خطوةُ المحرّك، وبُعدُه عن أثره مقيسٌ في"
                   " `owner_layer.py --panel`. وما في `ghost` بقي على الخيال بعلّته.",
        },
        "line": seating,
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
            # **والجسمُ الذي يُنقَر لا يُمشى إيماءتُه صفرُ ضربات** (`tap`): حكمُ المالك
            # في الصفر (١٨ أغسطس ٢٠٢٦) — «نقطةٌ تُنقَر لا دائرةٌ تُرسَم». **وليس شكلاً
            # بلا مسار** بل شكلاً مادّتُه نقرة، وموضعُها مقروءٌ من الخيال لا مكتوبٌ بيد.
            if entry.get("tap"):
                ok(shape == [], f"{ch}/{form}: نقرةٌ بحكم المالك — إيماءتُه بلا ضربات ({shape})")
                continue
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

    # ————— ٣ب) **طبقةُ المالك: ما ادُّعي أنه من يده فهو من يده** (بند ص٦) —————
    #
    # `paths.js` صار طبقتين: خيالٌ مؤلَّفٌ من إيماءةٍ، **وأثرُ يدٍ يعلوه**. فيُحرَس
    # الثاني بحرفه: بصمةُ ملفّ أشكاله في الوحدة **عينُ الملفّ على القرص** (تعديلُ
    # أثره بلا إعادة بناءٍ يحمرّ)، **وكلُّ شكلٍ ادُّعي أنه من يده يطابق ما تُخرجه
    # الطبقةُ اليوم** — فلا يُحرَّر إحداثيٌّ من أثره بيد. وما رُدّ إلى الخيال معلَنٌ
    # بأسمائه في `owner.ghost` **فلا يُدَّعى له نسبٌ ليس له**.
    stamp = (meta or {}).get("owner") or {}
    hand, report = owner_layer.layer()
    # **وطبقةُ السطر تعلوهما معاً** (بند ص٢/ب ١): الوحدةُ تُكتب بعد الجلوس على
    # السطر، فتُقابَل يدُ المالك بيده **بعد أن تجلس** — وإلا شكا الفاحصُ من مقياسٍ
    # هو نفسُه أمرُ المالك. **وهي حسابٌ محضٌ يُعاد**، فالمقابلةُ تبقى مقابلةَ أثرٍ.
    hand, _ = line_layer.seat(hand, unit=(meta or {}).get("line", {}).get("unit"))
    # **والمشتقّاتُ تُستثنى من مقابلة اليد وتُحرَس بحدّها هي** (بند ص٢/ب ٥): جسمُها
    # ليس جسمَ أثره في حرفها بل جسمُ أثره في أختها — فالمقابلةُ الصادقة أن يكون
    # **جسمُ الأختين واحداً في الوحدة نفسِها** ونقطُهما بجدول الحقيقة، وذلك أدناه.
    derived = set((meta or {}).get("line", {}).get("derived") or [])
    # **والمدموجُ كالمشتقّ**: ضربتاه صارتا واحدة بجدول المرجع، فلا يطابق أثرَ يده
    # ضربةً بضربة — **ويُحرَس بعدد ضرباته** أدناه (وهو عينُ ما يقوله المرجع).
    merged = {row["key"]: row["to"] for row in
              ((meta or {}).get("line", {}).get("merged") or [])}
    owned = ({f"{ch}/{form}" for ch, family in hand.items() for form in family}
             - derived - set(merged))
    ok(bool(stamp), f"ونسبُ الوحدة يعلن طبقةَ المالك ({stamp.get('shapes', '—')} شكلاً)")
    ok(stamp.get("sha") == owner_layer.sha(),
       f"وبصمةُ أشكاله في الوحدة عينُ الملفّ ({stamp.get('sha', '—')} = {owner_layer.sha()})"
       + ("" if stamp.get("sha") == owner_layer.sha() else " — تبدّل أثرُه ولم يُعَد البناء"))
    ok(sorted(stamp.get("ghost") or []) == sorted(row["key"] for row in report["dropped"]),
       f"وما بقي على الخيال معلَنٌ بأسمائه ({len(stamp.get('ghost') or [])})")
    # **والمقابلةُ على الأرقام لا على صيغة الكتابة**: الوحدةُ تكتب `480` والطبقةُ
    # تعطي `480.0`، وتُلحِق الوحدةُ بالجزء صفتَه المحسوبة (`ease`) — فيُقابَل ما
    # جاء من يده: مواضعُ نقاطه ومباديه ونقطُه، مقرَّبةً كما تُكتب.
    def bones(ref):
        if not ref:
            return None
        return {"strokes": [[[round(float(v), 1) for v in p] for p in s["points"]]
                            for s in ref["strokes"]],
                "dots": [[round(float(v), 1) for v in d["at"]] for d in ref["dots"]]}

    astray = [key for key in sorted(owned)
              if bones(paths.get(key.split("/")[0], {}).get(key.split("/")[1]))
              != bones(hand[key.split("/")[0]][key.split("/")[1]])]
    ok(not astray, f"وكلُّ شكلٍ من يده في الوحدة عينُ ما تُخرجه طبقتُه ({len(owned)})"
       + (f" — خالف: {'، '.join(astray[:5])}" if astray else ""))

    # ————— ٣ج) **أختان بجسمٍ واحد**: `س` من `ش` و`ض` من `ص` (أمرُ المالك) —————
    ok(len(derived) == len(DERIVED) * len(FORMS),
       f"وأشكالُ الأختين المشتقّة معلَنةٌ في نسب الوحدة ({len(derived)} من"
       f" {len(DERIVED) * len(FORMS)})")
    for rule in DERIVED:
        astray = []
        for form in FORMS:
            got = (paths.get(rule["to"]) or {}).get(form)
            src = (paths.get(rule["from"]) or {}).get(form)
            if not got or not src:
                astray.append(f"{rule['to']}/{form} (ناقص)")
                continue
            if json.dumps(got["strokes"], sort_keys=True) != json.dumps(src["strokes"], sort_keys=True):
                astray.append(f"{rule['to']}/{form} (جسمٌ خالف)")
            elif len(got["dots"]) != rule["dots"]:
                astray.append(f"{rule['to']}/{form} (نقطُه {len(got['dots'])})")
        ok(not astray, f"و{rule['to']} الأربعةُ جسمُها جسمُ {rule['from']} بعينه"
           f" ونقطُها {rule['dots']}" + (f" — خالف: {'، '.join(astray)}" if astray else ""))

    astray = [key for key, want in merged.items()
              if len(((paths.get(key.split("/")[0]) or {}).get(key.split("/")[1])
                      or {"strokes": []})["strokes"]) != want]
    ok(not astray and set(merged) <= set(MERGES),
       f"وما دُمج من الرفعات الزائدة على عدد المرجع ({len(merged)} من {len(MERGES)}"
       " — وما بقي مرفوعٌ إلى ص٢/ج بأرقامه)"
       + (f" — خالف: {'، '.join(astray)}" if astray else ""))

    # ٤) الأجزاءُ بعددها، والدعوى «عينُ شكلٍ آخر» صادقةٌ في الوحدة كذلك
    for ch, forms in letters.items():
        for form, entry in forms.items():
            ref = paths.get(ch, {}).get(form)
            if ref is None:
                continue
            # **وأجزاءُ ما جاء من يده أجزاءُ يده لا أجزاءُ الإيماءة**: الإيماءةُ سيّرت
            # الخيالَ وحدَه، وهو اليومَ تحت أثره — فيُحرَس بمطابقة الطبقة أعلاه.
            if f"{ch}/{form}" in owned or f"{ch}/{form}" in derived \
                    or f"{ch}/{form}" in merged:
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
    ap.add_argument("--seat", action="store_true",
                    help="إعادةُ كتابة وحدة الحروف من جرد الخيال بلا متصفّح")
    ap.add_argument("--sheet", metavar="PNG", help="لوحةُ مراجعةٍ بالعين")
    ap.add_argument("--bare", action="store_true", help="مع --sheet: بلا أرقام العُقَد")
    ap.add_argument("--only", metavar="حروف", help="مع --sheet: حروفٌ بعينها (للتأليف)")
    ap.add_argument("--out", metavar="JSON", help="مع --nodes: ملفُّ الجرد")
    ap.add_argument("--self-test", action="store_true", help="عهدُ الإيماءة والمسار بلا متصفّح")
    ap.add_argument("--port", type=int, default=ports.port_of("make_paths"))
    ap.add_argument("--timeout", type=int, default=180)
    # 🧩 حجمُ دفعة الكلمات، ونزعُ المنسوخ: `--fresh` يبني كلَّ شيء من جديد
    ap.add_argument("--chunk", type=int, default=100, help="عددُ وحدات النسخ في الدفعة")
    ap.add_argument("--fresh", action="store_true", help="بلا نسخٍ من بناءٍ قائم ولا جزءٍ محفوظ")
    args = ap.parse_args()

    if args.self_test:
        return self_test()
    if args.build:
        return build(args.port, args.timeout, args.chunk, args.fresh)
    if args.seat:
        return seat_build()
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
