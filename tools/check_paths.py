#!/usr/bin/env python3
"""حارسُ المسارات المرجعية — «لا حرفَ يدخل المنهج بلا مسارٍ عابرٍ للفحص».

    python3 tools/check_paths.py              # الفحص الكامل
    python3 tools/check_paths.py -q           # الأخطاء وحدها
    python3 tools/check_paths.py --self-test  # فحصُ الفاحص: أيمسك المخالفات؟

نظيرُ `check_decodable.py` في اقرأ (`METHOD.md §٩.٢`): ذاك يحرس ألّا يُقرأ حرفٌ لم
يُدرَّس، وهذا يحرس ألّا يُكتب حرفٌ بلا مسارٍ سليم. والمقيسُ **بنيةُ المسار** —
والعينُ (أهو داخلَ خيال حرفه؟ وأيقبله المحرّك؟) في `tools/browser_paths.html`
و`tools/test_paths.mjs`.

## أرقامُ هذا الفاحص كلُّها مقروءةٌ من المحرّك لا مكتوبةً هنا

`TOLERANCE` و`HEAD_RATIO` تُقرأ من `app/js/pen.js` نصّاً، فما شُدّت سماحةُ المحرّك
يوماً شُدّ هذا الفاحصُ معها بلا سطرٍ يُعدَّل. وأخصُّها:

**أقصى طولٍ للقطعة الواحدة** (زيادةُ مراجعة المدير للجلسة ١): نافذةُ الرتابة في
`pen.js` **تُرشِّح قطعاً كاملة** — `nearestOn` يقبل القطعةَ إن تداخل مداها مع
النافذة، لا جزءَها الداخل. فقطعةٌ أطولُ من النافذة تُوسّعها من حيث لا يُحتسَب،
**وأخطرُ ذلك عند النزول**: `headSpan` يحرس رأسَ المسار بعُشره، فقطعةٌ تتجاوزه تُعيد
**ثغرةَ ذيل الشكل المغلق** من بابها (وهي التي أسقطت المحرّك في مراجعة الجلسة ١).
فالحدُّ هنا `min(back, len × HEAD_RATIO)` لكل قطعة — من جنس ما يحرسه لا رقماً حرّاً.

**والطيّةُ المعلَنة** (الجلسة ٢ب): صفةٌ في بيانات المسار يقيس بها الشرطُ الثاني
التقدّمَ ذهاباً وإياباً — أيْ **رخصةٌ في الحكم**، فتُفحَص بنيتُها هنا: ضلعان
متقابلان يعودان من حيث بدآ، وطولُ كلٍّ فوق سماحة الارتداد، ولا طيّةَ مزعومةٌ على
قطعةٍ سويّة. (والحكمُ نفسُه — أتُقبَل السنّةُ على خطٍّ واحد؟ — في `test_paths.mjs`
و`pen_traces.json`.)
"""

import argparse
import json
import math
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import line_layer  # noqa: E402  (فرجةُ النقطة تُقاس بعدّة بانيها لا بنسخةٍ ثانية)

ROOT = Path(__file__).resolve().parent.parent
PATHS_JS = ROOT / "app" / "js" / "paths.js"
WORD_PATHS_JS = ROOT / "app" / "js" / "word_paths.js"
PEN_JS = ROOT / "app" / "js" / "pen.js"
CURRICULUM = ROOT / "app" / "js" / "curriculum.js"

# ————— حدودٌ من العربية نفسِها، لا من الظنّ —————
# أكثرُ ما يُكتب به حرفٌ في النسخ المدرسي: جسمٌ ثم نقطُه. والكافُ والطاءُ أكثرُها
# أجزاءَ جسمٍ (جسمٌ وهمزةٌ/عارضة) — فثلاثةٌ سقفٌ واسع، وما جاوزه خطأُ تأليفٍ لا حرف.
MAX_STROKES = 3
# ولا حرفَ عربيّ فوق ثلاث نقاط (ث ش)، ولا نقطَ في أكثر من ثلاثة مواضع.
MAX_DOTS = 3

# ————— جدولُ الحقيقة الإملائية: كم نقطةً لكلّ حرفٍ عربيّ؟ —————
# **والمقيسُ عددُ القيود المنفصلة لا مجموعُ `count`** — وهذه علّةُ م٤ بعينها (عينُ
# المالك، ١٥ أغسطس ٢٠٢٦: «الشين بنقطة واحدة؟!»): كانت نقاطُ العنقود الثلاثيّ تُضَمّ
# قيداً واحداً `{at, count: 3}`، **واللوحُ يرسم دائرةً لكلّ قيدٍ لا لكلّ نقرة**، فرأى
# الطفلُ شيناً بنقطةٍ واحدة يَنقُرها ثلاثاً في موضعٍ واحد. **والمجموعُ كان صحيحاً
# فخُدع الجردُ بالعدّ** — فصار الحارسُ يعدّ المواضع.
DOTS_OF = {
    "ب": 1, "ت": 2, "ث": 3, "ن": 1, "ج": 1, "خ": 1, "ذ": 1, "ز": 1,
    "ش": 3, "ض": 1, "ظ": 1, "غ": 1, "ف": 1, "ق": 2, "ي": 2, "ة": 2,
    # **والصفرُ نقرةٌ بحكم المالك، لا شكلٌ بلا مسار** (١٨ أغسطس ٢٠٢٦،
    # `docs/STROKE_ORDER.md §٢`): «نقطةٌ تُنقَر لا دائرةٌ تُرسَم» — فمادّتُه قيدُ
    # نقرةٍ واحدة، لا نقطةَ إعجامٍ فوق جسم. وقيدُه معدودٌ هنا فلا يمرّ صفرٌ بلا
    # نقرة ولا صفرٌ بنقرتين.
    "٠": 1,
}

# **أشكالٌ مادّتُها نقرةٌ لا مسار** — والقاعدةُ «لا حرفَ بلا مسارٍ مرجعيّ» قائمةٌ على
# ما سواها. **وهي معلَنةٌ بأعيانها** فلا يمرّ شكلٌ فرغ من ضرباته صامتاً: مَن دخل هذه
# القائمة دخلها بحكمٍ مكتوب، ومَن خرج من مساره وليس فيها **يحمرّ**.
TAP_ONLY = {"٠"}


def load_tolerance() -> dict:
    """سماحةُ المحرّك ونسبةُ رأس المسار — **تُقرأ من `pen.js` ولا تُكتب هنا**."""
    src = PEN_JS.read_text(encoding="utf-8")
    block = re.search(r"export const TOLERANCE = \{(.*?)\};", src, re.S)
    if not block:
        sys.exit("لم يُقرأ TOLERANCE من app/js/pen.js")
    tol = {k: float(v) for k, v in re.findall(r"(\w+):\s*([0-9.]+)", block.group(1))}
    # **وأدنى خطوةٍ يفرّقها المحرّك** (`MIN_STEP`): ما دونها يطرحه تبسيطُ نقاط الطفل
    # أصلاً، فلا معنى لأن يُطالَب مسارٌ مرجعيّ بقطعةٍ أدقَّ منها — وهي أرضيةُ الكثافة
    # في عدّة التأليف نفسِها (`stepFor`).
    step = re.search(r"export const MIN_STEP = ([0-9.]+)", src)
    head = re.search(r"const HEAD_RATIO = ([0-9.]+)", src)
    grid = re.search(r"export const GRID = (\d+)", src)
    tol["head_ratio"] = float(head.group(1)) if head else 0.1
    tol["min_step"] = float(step.group(1)) if step else 6.0
    tol["grid"] = float(grid.group(1)) if grid else 1000.0
    return tol


def load_forms() -> list:
    """أسماءُ أشكال المواقع — من `curriculum.js` لا من قائمةٍ ثانية تفترق عنها."""
    src = CURRICULUM.read_text(encoding="utf-8")
    block = re.search(r"export const FORMS = \{(.*?)\};", src, re.S)
    return re.findall(r"'([a-z]+)'", block.group(1)) if block else []


def load_paths() -> dict:
    src = PATHS_JS.read_text(encoding="utf-8")
    body = re.search(r"export const PATHS = (\{.*?\n\});", src, re.S)
    if not body:
        sys.exit("لم يُقرأ PATHS من app/js/paths.js")
    return json.loads(body.group(1))


def taught_letters():
    """الحروفُ المقرَّرة كتابةً — من محطات المنهج.

    **ومطالبةٌ تُطلقها من نفسها**: المنهجُ اليومَ هيكلٌ فارغ (تملؤه الجلسة ٣ اشتقاقاً
    من بيانات اقرأ)، فلا تغطيةَ تُطالَب. فإذا امتلأ ولم يُعرَف منه حرفٌ **حمِرَ الفاحص**
    وطالب بوصله — بلا سطرٍ يُضاف يومئذٍ ولا انتباهٍ يُرجى.

    **وقد أطلقتها فعلاً يومَ امتلأ** (الجلسة ٣): صار `curriculum.js` مولَّداً بصيغة
    JSON خالصة (`"letter": "ب"`) بعد أن كان هيكلاً بيد، فلم يعرفه هذا القارئ وحمِر
    كما وُعد — ولم يُنقَص شيءٌ من حراسته: تُقرأ الصيغتان معاً، فما يُكتب بيدٍ يوماً
    يُقرأ كما يُقرأ المولَّد.
    """
    src = CURRICULUM.read_text(encoding="utf-8")
    block = re.search(r"export const STAGES = \[(.*?)\n\];", src, re.S)
    body = block.group(1).strip() if block else ""
    if not body:
        return None
    return set(re.findall(r"""["']?letter["']?\s*:\s*["'](.)["']""", body))


def dist(a, b) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def poly_len(points) -> float:
    return sum(dist(points[i - 1], points[i]) for i in range(1, len(points)))


def heading(points) -> tuple:
    """اتجاهُ ضلعٍ جملةً: متّجهُ الوحدة من أوّله إلى آخره."""
    vx = points[-1][0] - points[0][0]
    vy = points[-1][1] - points[0][1]
    norm = math.hypot(vx, vy) or 1.0
    return vx / norm, vy / norm


def check_folds(stroke: dict, where: str, tol: dict) -> list:
    """**الطيّةُ المعلَنة**: ضلعان متقابلان، ولا طيّةَ مزعومة على قطعةٍ سويّة.

    الطيّةُ صفةٌ في بيانات المسار (`METHOD.md §٣.١`) يقيس بها الشرطُ الثاني تقدّمَ
    الطفل ذهاباً وإياباً — فهي **رخصةٌ في الحكم**: داخلَها يقسم المحرّكُ المسارَ على
    القمّة فلا يُقرأ العودُ ارتداداً. فدعوى الطيّة على قطعةٍ لا طيّةَ فيها تفتح على
    الحرف باباً لا يُغلَق، ولذلك تُفحَص البنيةُ هنا لا يُوثَق بالمولّد وحدَه.

    والمفحوصُ ثلاثةٌ، **كلُّها من جنس ما تحرسه لا أرقاماً حرّة**:
      · **أرقامٌ سليمة**: `from < apex < to` داخلَ نقاط القطعة، والطيّاتُ لا تتداخل.
      · **ضلعان يشتركان في الحبر**: أدنى مسافةٍ بينهما دون سماحة الانحراف — وهو
        بعينه ما يجعل الموضعَ الواحد يحمل طولين فيلتبس الإسقاط. وقطعةٌ سويّةٌ ضلعاها
        متباعدان فتسقط. (وكان المفحوصُ تقابلَ الاتجاهين، وهو وصفُ الشوكة في الحرف
        لا حدُّ الطيّة — فلمّا امتدّ الحكمُ إلى انطباقات الكلمة صار المقيسُ المكان.)
      · **وضلعٌ يقيسه المحرّك**: أقصرُ من سماحة الارتداد (`back`) يبتلعه سماحُ بلوغِ
        القمّة نفسُه، فلا تُقاس فيه ذهابٌ ولا إياب.
    """
    bad = []
    folds = stroke.get("folds")
    if folds is None:
        return bad
    points = stroke.get("points") or []
    last = len(points) - 1
    if not isinstance(folds, list) or not folds:
        return [f"{where}: `folds` معلنةٌ فارغةً أو ليست قائمة — والطيّةُ تُعلَن أو تُترك"]

    spans = []
    for n, fold in enumerate(folds, 1):
        tag = f"{where} طيّة {n}"
        keys = ("from", "apex", "to")
        if not isinstance(fold, dict) or any(not isinstance(fold.get(k), int) for k in keys):
            bad.append(f"{tag}: أرقامُ نقاطٍ صحيحةٌ لازمة (from وapex وto)")
            continue
        a, mid, b = (fold[k] for k in keys)
        if not (0 <= a < mid < b <= last):
            bad.append(f"{tag}: أرقامُها {a}،{mid}،{b} خارجَ نقاط القطعة أو غيرُ مرتّبة (٠..{last})")
            continue
        spans.append((a, b, tag))

        up = points[a:mid + 1]
        down = points[mid:b + 1]
        rise, fall = poly_len(up), poly_len(down)
        # **والبرهانُ على الطيّة اشتراكُ ضلعيها في الحبر** (حكمُ المدير، ١٣ أغسطس
        # ٢٠٢٦): الطيّةُ صفةٌ تقول «مكانٌ واحد يحمل طولين»، **وذلك يُقاس بالمكان لا
        # بالاتجاه**. وكان المفحوصُ قبلَها تقابلَ الاتجاهين وعودةَ الطرف إلى مبدئه —
        # وهما وصفُ **الشوكة** في الحرف لا حدُّ الطيّة. ولمّا امتدّ الحكمُ إلى
        # انطباقات الكلمة ظهر صنفٌ ثانٍ من «المكان الواحد بطولين»: **شقّان يُمشى
        # حبرُهما مرّتين في اتجاهٍ واحد** بينهما نزهةٌ في حرفٍ آخر (قِيس على «تمر»
        # و«شَمْسْ»). فصار المقيسُ **أدنى مسافةٍ بين الضلعين**: ما دون سماحة
        # الانحراف لا يفرّق المحرّكُ بينهما — وهو بعينه ما يجعل الإعلانَ لازماً.
        # والشوكةُ تعبره من بابه (ضلعاها متلاصقان بعرض الحبر).
        # **ويُستثنى جوارُ القمّة**: الضلعان يلتقيان عندها بحكم البناء، فقياسُ
        # اشتراكهما هناك يقول «مشتركان» عن كلِّ قطعةٍ في الدنيا. فتُقاس المسافةُ بين
        # نقطتين **متباعدتين في الطول** (ضِعفا سماحة الارتداد — مقياسُ المحرّك في
        # «الموضعُ الواحد») — فما دونها جوارُ القلم لنفسه لا انطباق.
        up_at = [poly_len(points[a:k + 1]) for k in range(a, mid + 1)]
        down_at = [poly_len(points[a:k + 1]) for k in range(mid, b + 1)]
        span = tol["back"] * 2
        touch = min((dist(p, q) for p, pl in zip(up, up_at)
                     for q, ql in zip(down, down_at) if ql - pl >= span),
                    default=float("inf"))
        if touch >= tol["lateral"]:
            bad.append(f"{tag}: ضلعاها لا يشتركان في حبر (أدنى مسافةٍ بينهما "
                       f"{touch:.0f} ≥ سماحة الانحراف {tol['lateral']:.0f}) "
                       "— لا تُدَّعى طيّةٌ حيث يفرّق المحرّكُ الموضعين")
        if min(rise, fall) < tol["back"]:
            bad.append(f"{tag}: ضلعٌ طولُه {min(rise, fall):.0f} دون سماحة الارتداد "
                       f"({tol['back']:.0f}) — لا يقيس فيه المحرّكُ ذهاباً ولا إياباً")

    spans.sort()
    for i in range(1, len(spans)):
        if spans[i][0] < spans[i - 1][1]:
            bad.append(f"{spans[i][2]}: تتداخل مع طيّةٍ قبلها — ولا يقع مكانان في مكان")
    return bad


def check_passes(stroke: dict, where: str, tol: dict) -> list:
    """**المرورُ الثاني في الاتجاه نفسِه**: حبرٌ واحد يُمشى مرّتين، ومروران يقيسهما المحرّك.

    وهي الحالةُ الثالثةُ المعلَنة (`METHOD.md §٣.١`، بند ص٢/ز): الطيّةُ **ذهابٌ
    وإياب**، وهذه **مرورٌ ثم مرورٌ في الاتجاه عينه** — وسندُها برهانٌ أويلريّ على
    جسم `ط` و`ظ` الموصولتين (أربعةُ رؤوسٍ فرديّة فلا مسارَ واحد، وأقلُّ إصلاحٍ
    تكرارُ السطر تحت الحلقة). **وهي رخصةٌ في الحكم** كالطيّة: داخلَها يقرأ المحرّكُ
    موضعَ القلم من أقرب المرورين ويُنزّله على مرور طوره — **فدعواها على حبرٍ لا
    يُمشى مرّتين تفتح على الحرف باباً لا يُغلَق**.

    والمفحوصُ أربعةٌ، **كلُّها من جنس ما تحرسه لا أرقاماً حرّة**:
      · **أرقامٌ سليمة**: `from < to ≤ again < until` داخلَ نقاط القطعة.
      · **مروران يشتركان في الحبر**: أدنى مسافةٍ بين المرورين دون سماحة الانحراف —
        وهو بعينه ما يجعل الموضعَ الواحد يحمل طولين فيلتبس الإسقاط.
      · **ورأسا القلم متوافقان**: جداءُ المتّجهين موجب — **وإلّا فهي شوكةٌ أو حلقةٌ
        لا مرورٌ ثانٍ**، وحكمُهما غيرُ حكمه.
      · **ومرورٌ يقيسه المحرّك**: أقصرُ من سماحة الارتداد (`back`) يبتلعه سماحُها.
    **ولا يقع مكانان في مكان**: لا تتداخل المروراتُ بعضُها ببعض ولا مع طيّةٍ معلَنة.
    """
    bad = []
    passes = stroke.get("passes")
    if passes is None:
        return bad
    points = stroke.get("points") or []
    last = len(points) - 1
    if not isinstance(passes, list) or not passes:
        return [f"{where}: `passes` معلنةٌ فارغةً أو ليست قائمة — والمرورُ يُعلَن أو يُترك"]

    keys = ("from", "to", "again", "until")
    spans = []
    for n, span in enumerate(passes, 1):
        tag = f"{where} مرور {n}"
        if not isinstance(span, dict) or any(not isinstance(span.get(k), int) for k in keys):
            bad.append(f"{tag}: أرقامُ نقاطٍ صحيحةٌ لازمة ({' و'.join(keys)})")
            continue
        a, b, c, d = (span[k] for k in keys)
        if not (0 <= a < b <= c < d <= last):
            bad.append(f"{tag}: أرقامُه {a}،{b}،{c}،{d} خارجَ نقاط القطعة أو غيرُ مرتّبة (٠..{last})")
            continue
        spans.append((a, d, tag))

        first, again = points[a:b + 1], points[c:d + 1]
        shortest = min(poly_len(first), poly_len(again))
        if shortest < tol["back"]:
            bad.append(f"{tag}: مرورٌ طولُه {shortest:.0f} دون سماحة الارتداد "
                       f"({tol['back']:.0f}) — لا يقيسه المحرّك")
        # **والبرهانُ على المرور اشتراكُ المرورين في الحبر** — كالطيّة سواءً بسواء:
        # ما دون سماحة الانحراف لا يفرّق المحرّكُ بينهما، وهو علّةُ الإعلان نفسُها.
        touch = min(dist(p, q) for p in first for q in again)
        if touch >= tol["lateral"]:
            bad.append(f"{tag}: مروراه لا يشتركان في حبر (أدنى مسافةٍ بينهما "
                       f"{touch:.0f} ≥ سماحة الانحراف {tol['lateral']:.0f}) "
                       "— لا يُدَّعى مرورٌ حيث يفرّق المحرّكُ الموضعين")
        # **ورأسا القلم متوافقان**: وإلّا فالمرورُ الثاني عودٌ لا مرور — والفيصلُ
        # إشارةُ جداءٍ لا عتبةٌ تُختار (وهو عينُ ما يفصل به الكاشفُ في العدّة).
        if head(points, a, b)[0] * head(points, c, d)[0] \
                + head(points, a, b)[1] * head(points, c, d)[1] <= 0:
            bad.append(f"{tag}: رأسا قلمه متعاكسان — تلك شوكةٌ أو حلقةٌ لا مرورٌ ثانٍ")

    spans.sort()
    for i in range(1, len(spans)):
        if spans[i][0] < spans[i - 1][1]:
            bad.append(f"{spans[i][2]}: يتداخل مع مرورٍ قبله — ولا يقع مكانان في مكان")
    for a, d, tag in spans:
        for fold in (stroke.get("folds") or []):
            if isinstance(fold, dict) and isinstance(fold.get("from"), int) \
                    and isinstance(fold.get("to"), int) \
                    and fold["from"] <= d and a <= fold["to"]:
                bad.append(f"{tag}: يتداخل مع طيّةٍ معلَنة — والطيّةُ أسبقُ، فلا يقع مكانان في مكان")
    return bad


def head(points: list, a: int, b: int) -> tuple:
    """**رأسُ القلم في مدىً من المسار**: متّجهُ طرفيه موحَّداً — جهةُ مشيه لا شكلُه."""
    vx, vy = points[b][0] - points[a][0], points[b][1] - points[a][1]
    n = math.hypot(vx, vy) or 1.0
    return vx / n, vy / n


def check_dot_count(dots: list, want: int, tag: str) -> list:
    """**النقاطُ مواضعُ لا نقراتٌ في موضع** — يُعَدُّ القيدُ لا مجموعُ `count`.

    فقيدٌ واحدٌ بعدّةِ ثلاثٍ يمرّ بالمجموع وهو **دائرةٌ واحدةٌ في اللوح**: يراها
    الطفلُ نقطةً فينقرها ثلاثاً في مكانها. والشكوى تسمّي الوجهين (كم موضعاً وكم
    نقرة) فلا يُقرأ العطبُ نقصاً في العدد وهو دمجٌ في الموضع.
    """
    bad = []
    if len(dots) != want:
        total = sum(int(d.get("count", 1)) for d in dots)
        bad.append(f"{tag}: مواضعُ نقطه {len(dots)} والحقيقةُ الإملائية {want}"
                   f" (ومجموعُ نقراته {total}) — والنقاطُ مواضعُ منفصلة لا نقراتٌ في موضع")
    for j, dot in enumerate(dots, 1):
        if int(dot.get("count", 1)) != 1:
            bad.append(f"{tag} نقطة {j}: عدّتُها {dot.get('count')} — ولكلّ نقطةٍ قيدُها"
                       " بموضعها، فلا تُضَمّ نقطتان في واحدة")
    return bad


# ————— **فرجةُ النقطة عن جسم حرفها** — حكمُ المالك (`STROKE_ORDER §٩`) —————
#
# > «**يجب أن تكون هناك مسافةٌ واضحة بين الحرف والنقطة، ولا يجب أن يكونا قريبين
# > من بعض**» (١٩ أغسطس ٢٠٢٦).
#
# **وهذا الحارسُ ثمرةُ الحكم لا تنفيذُه**: التنفيذُ رفعةٌ في `line_layer.lift_dots`
# تُعاد مع كلِّ بناء، **وهذا يمسك ما يجدّ** — نقطةً تقترب من جسمها بتبدّل شكلٍ أو
# مقياسٍ أو مرجع، فلا يُعاد اكتشافُ العطب بالعين مرّةً ثانية.
#
# **وحدُّه محسوبٌ لا مكتوب**: `DOT_CLEARANCE` من بانيها × وحدةِ السطر المعلَنة في
# الوحدة المولَّدة نفسِها — فمن بدّل الحدَّ يوماً بدّله في موضعٍ واحد.
#
# **ونقطٌ خارج نصّ الحكم — معلَنةٌ بأرقامها لا مسكوتٌ عنها**: حكمُ المالك في
# «الحرف ونقطته» وموضعُه نقطٌ **فوق** جسمها؛ ونقطُ الياء تجلس **تحت** جسمها
# وفرجتُها أضيقُ من كلِّ ما فوق. **وخفضُها حكمُ شكلٍ لم يصدر** — فلا تُحرَّك بلا
# أمر. **ولا تمرّ صامتةً**: تُطبع بعددها كلَّ مرّة، **وتُحمَّر إن ضاقت عمّا هي
# عليه اليوم** — فالمعلومُ مثبَّتٌ لا يزداد سوءاً، والمجهولُ ممنوع.
DOT_RULE_EXEMPT = {
    ("ي", "isolated"): 116.9,   # نقطتاها تحت جسمها — بُلِّغت للمدير في بند فرجة النقطة
}

# ————— **وأربعةٌ يقف دونها أمرُ النسبة** — بلاغُ جلسة ص٢/ز، مقيسٌ لا مسكوتٌ عنه —————
#
# **الحدُّ صار من القبول العامل** (`line_layer.dot_clearance`)، فبانَ أنّ أربعةَ
# أشكالٍ **لا تبلغ حدَّها إلا برفعٍ يجاوز هامشَ المطابقة** الذي يحرس **أمرَ النسبة
# المنتهي** (أمرُ المالك ١٩ أغسطس ٢٠٢٦: «يجب حفظ النسبة… لا جدال فيه») — نقطُها
# محسوبةٌ من حبرها في `line_layer.audit`، فرفعُها يُطيل الشكلَ فوق نسبة المرجع.
# **ومتّسعُ كلٍّ منها ٢٤ وحدةً تقريباً، وما يلزمه ٢٤–٥٢.**
#
# ⇐ **وأمرُ النسبة أعلى، فلم تُرفَع** — **والقرارُ للمدير**: أيُشدُّ نصفُ قطر قبول
# النقطة نفسُه (وهو الخيارُ الثاني في بلاغ `STROKE_ORDER §٩هـ`)؟ أم يُوسَّع هامشُ
# المطابقة بأمرِ مالك؟ أم يُعاد اشتقاقُ شكلها فتنخفض قمّةُ جسمها؟
# **وحتى ذلك تُقيَّد بأرقامها**: تُطبع في كلِّ فحص، **وتحمرّ إن ضاقت عمّا هي عليه**.
DOT_FIT_BLOCKED = {
    ("ق", "isolated"): 216.8,
    ("خ", "isolated"): 267.6,
    ("غ", "isolated"): 247.7,
    ("غ", "initial"): 215.1,
    ("غ", "final"): 277.0,
}
DOT_EXEMPT_SLACK = 0.5          # هامشُ التقريب: ما دونه ليس تفاقماً


def check_dot_clearance(paths: dict, unit: float) -> tuple:
    """`(شكاوى، مبلَّغات)` — أتبلغ فرجةُ كلِّ نقطةٍ **نصفَ قطر قبولها العامل**؟

    **والحدُّ العامل لا الثابتُ المكتوب** (عهدُ ١٩ أغسطس ٢٠٢٦): `resolveTolerance`
    يضرب نصفَ قطر قبول النقطة في مقياس المادّة، **فقبولُ `ض/معزول` ٢٣٠ لا ١٤٠**
    وحدُّ الألف الرُّبعيُّ دونه. ⇐ **فيُطلَب الحدُّ من الدالّة التي تحكم به**
    (`line_layer.dot_clearance`) لا من رقمٍ في وثيقة.
    """
    tol = load_tolerance()
    bad, told = [], []
    for ch, shapes in sorted(paths.items()):
        for form, ref in shapes.items():
            dots, strokes = ref.get("dots") or [], ref.get("strokes") or []
            if not dots or not strokes:
                continue          # نقرةٌ بلا جسم: لا جسمَ تُقاس إليه الفرجة
            scale = ref.get("tolerance")
            scale = scale if isinstance(scale, (int, float)) and scale > 0 else 1.0
            want = line_layer.dot_clearance(tol, scale, unit)
            gap = min(line_layer.dot_gap(ref, d["at"]) for d in dots)
            tag = f"«{ch}» {form}"
            spared = DOT_RULE_EXEMPT.get((ch, form))
            blocked = DOT_FIT_BLOCKED.get((ch, form))
            held = spared if spared is not None else blocked
            if held is not None:
                told.append(f"{tag}: فرجتُه {gap:.1f} وحدُّه العامل {want:.0f} — "
                            + ("خارجَ نصّ الحكم (نقطُه تحت جسمه)" if spared is not None
                               else "يقف دونه أمرُ النسبة (بلاغُ ص٢/ز)"))
                if gap < held - DOT_EXEMPT_SLACK:
                    bad.append(f"{tag}: فرجةُ نقطته {gap:.1f} وكانت {held} — "
                               + ("المعفوُّ" if spared is not None else "الموقوفُ")
                               + " مثبَّتٌ لا يزداد ضيقاً")
            elif gap < want - DOT_EXEMPT_SLACK:
                bad.append(f"{tag}: فرجةُ نقطته عن جسمه {gap:.1f} ودونها حدُّها"
                           f" العامل {want:.0f} (نصفُ قطر قبولها بمقياس مادّتها"
                           f" ×{scale:.2f}، وأرضيّةُ المالك"
                           f" {line_layer.DOT_CLEARANCE * unit:.0f})"
                           " — «مسافةٌ واضحة بين الحرف والنقطة» (حكمُ المالك)")
    return bad, told


def load_unit() -> float:
    """**وحدةُ السطر** (ارتفاعُ الألف) — من الوحدة المولَّدة نفسِها لا من رقمٍ يُكتب."""
    src = PATHS_JS.read_text(encoding="utf-8")
    hit = re.search(r'export const PATHS_SOURCE = (\{.*\});', src, re.S)
    meta = json.loads(hit.group(1)) if hit else {}
    return float((meta.get("line") or {}).get("unit") or 0.0)


def check(paths: dict, tol: dict, forms: list, letters=None) -> list:
    """كلُّ ما يُخالف — قائمةُ شكاوى، فيصلح الفاحصُ نفسَه للفحص الذاتي."""
    bad = []
    clusters = []
    grid = tol["grid"]

    if letters:
        for ch in sorted(letters):
            if ch not in paths:
                bad.append(f"«{ch}» يُدرَّس كتابةً ولا مسارَ له — لا حرفَ بلا مسار")

    for ch, shapes in paths.items():
        missing = [f for f in forms if f not in shapes]
        if missing:
            bad.append(f"«{ch}»: ينقصه من أشكال المواقع {'، '.join(missing)}")

        for form, ref in shapes.items():
            tag = f"«{ch}» {form}"
            if form not in forms:
                bad.append(f"{tag}: شكلُ موقعٍ لا تعرفه `FORMS`")
            # **وحدُّ الشبكة حدُّ خليّته هو** (بند ص٢/ب ٢، كما في بابِ الكلمات):
            # الشكلُ يجلس في **خليّة السطر** لا في مربّعٍ مفترَض، فمن أعلن صندوقَه
            # قِيس به — ومَن لم يُعلن فشبكتُه ١٠٠٠×١٠٠٠ كما كانت.
            box = ref.get("box") or [grid, grid]
            gw, gh = float(box[0]), float(box[1])
            # **وسماحاتُه بمقياسه هو** (بند ص٢/ب ١، كما في بابِ الكلمات): الشكلُ
            # يحمل `tolerance` — كم يبلغ حبرُه من الحرف الذي كان يملأ شبكتَه —
            # **فبه يُحكَم فبه يُفحَص**، ولا مسطرتان لشكلٍ واحد.
            scale = ref.get("tolerance")
            scale = scale if isinstance(scale, (int, float)) and scale > 0 else 1.0
            stol = {**tol, "start": tol["start"] * scale, "back": tol["back"] * scale,
                    "lateral": tol["lateral"] * scale, "dot": tol["dot"] * scale}
            strokes = ref.get("strokes") or []
            dots = ref.get("dots") or []
            if ch in TAP_ONLY:
                # الصفرُ نقرةٌ بحكم المالك: يُطالَب بضدِّ ما يُطالَب به سواه — **لا
                # ضربةَ له**، ونقرتُه وحدَها مادّتُه.
                if strokes:
                    bad.append(f"{tag}: نقرةٌ بحكم المالك وله {len(strokes)} ضربة"
                               " — «نقطةٌ تُنقَر لا دائرةٌ تُرسَم»")
                if not dots:
                    bad.append(f"{tag}: نقرةٌ بحكم المالك وليس له قيدُ نقرة")
            elif not strokes:
                bad.append(f"{tag}: لا جسمَ له — مسارٌ بلا أجزاء")
            if len(strokes) > MAX_STROKES:
                bad.append(f"{tag}: أجزاءُ جسمه {len(strokes)} وأكثرُ حرفٍ {MAX_STROKES}")
            if sum(int(d.get("count", 1)) for d in dots) > MAX_DOTS:
                bad.append(f"{tag}: نقطُه أكثرُ من {MAX_DOTS} — ولا حرفَ عربيّ كذلك")
            bad += check_dot_count(dots, DOTS_OF.get(ch, 0), tag)

            starts = []
            for i, stroke in enumerate(strokes, 1):
                where = f"{tag} جزء {i}"
                points = stroke.get("points") or []
                if len(points) < 2:
                    bad.append(f"{where}: نقطتان فأكثر لازمتان ({len(points)})")
                    continue
                if not all(len(p) == 2 and all(isinstance(v, (int, float)) for v in p) for p in points):
                    bad.append(f"{where}: نقطةٌ ليست زوجَ أرقام")
                    continue
                # **البدايةُ معلَنة**: هي عينُ المادّة المدرَّسة، فلا تُترك تُستنبَط
                start = stroke.get("start")
                if start is None:
                    bad.append(f"{where}: بلا `start` — والبدايةُ تُعلَن لا تُستنبَط")
                elif dist(start, points[0]) > 0.05:
                    bad.append(f"{where}: `start` ليس أوّلَ نقاطه ({start} ≠ {points[0]})")
                starts.append((f"{where} (جسم)", start or points[0]))

                out = [p for p in points if not (0 <= p[0] <= gw and 0 <= p[1] <= gh)]
                if out:
                    bad.append(f"{where}: {len(out)} نقطةً خارج خليّته ({out[0]})")

                length = poly_len(points)
                if length < stol["start"]:
                    bad.append(f"{where}: طولُه {length:.0f} دون دائرة البداية ({stol['start']:.0f})"
                               " — جزءٌ لا يُكتب")
                # أقصى طولِ قطعة: من نافذة المحرّك ورأسِ مساره (رأسُ الملفّ)
                cap = min(stol["back"], length * tol["head_ratio"])
                for k in range(1, len(points)):
                    step = dist(points[k - 1], points[k])
                    if step > cap + 0.5:
                        bad.append(f"{where}: قطعةٌ طولُها {step:.0f} وأقصى المسموح "
                                   f"{cap:.0f} (نافذةُ الرتابة تُرشِّح قطعاً كاملة)")
                        break
                    if step < 0.05:
                        bad.append(f"{where}: نقطتان متطابقتان عند {points[k]}")
                        break

                bad += check_folds(stroke, where, stol)
                bad += check_passes(stroke, where, stol)

            for j, dot in enumerate(dots, 1):
                where = f"{tag} نقطة {j}"
                at = dot.get("at")
                if not at or len(at) != 2:
                    bad.append(f"{where}: بلا موضع")
                    continue
                if not (0 <= at[0] <= gw and 0 <= at[1] <= gh):
                    bad.append(f"{where}: خارج خليّته ({at})")
                # **النقاطُ بعد الجسم** — قاعدةُ الخطّ المدرسيّ (`METHOD.md §٣.١`)
                if dot.get("after") is not True:
                    bad.append(f"{where}: لا تُعلن `after: true` — والنقاطُ بعد الجسم")
                if not isinstance(dot.get("count"), int) or dot["count"] < 1:
                    bad.append(f"{where}: عددُ نقراتها ليس عدداً صحيحاً موجباً")
                starts.append((where, at))

            # **الأجزاءُ تُميَّز بمباديها**: `pen.js` يعرف قلبَ الترتيب بأقرب جزءٍ إلى
            # موضع النزول، فبدايتان أقربُ من دائرة البداية لا يفرّق بينهما — فيُقرأ
            # ترتيبٌ صحيحٌ خطأً أو خطأٌ صحيحاً. والحدُّ سماحةُ البداية نفسُها.
            #
            # **ويُستثنى نقطةٌ لنقطةٍ في الحرف الواحد** (م٤): العنقودُ الثلاثيُّ (ش ث)
            # نقاطُه على بُعد ٩٥–١١١ — **تركّبها العربيةُ كذلك ولا موضعَ لها سواه**،
            # فكانت القاعدةُ تضمّها فتخرج دائرةً واحدة. وحدُّ النقطة **أدنى خطوةٍ
            # يفرّقها المحرّك** (`MIN_STEP`): ما دونها موضعٌ واحدٌ بيقين، وما فوقها
            # موضعان يفرّقهما أقربُ الأجزاء **المنتظَرة** إلى نزول الطفل.
            # **وحدُّه معلَنٌ لا مسكوتٌ عنه**: سماحةُ النقرة (`dot`) أوسعُ من فجوة
            # العنقود، فنقرةٌ شاردةٌ عن نقطتها قد تقع في سماحة جارتها — والعلاجُ
            # إرشادُ اللوح (يومض موضعُ المنتظَرة) لا تضييقُ السماحة على يد طفلٍ في
            # الخامسة (قرارُ المدير في بند م٤: «وسماحةُ كل نقرةٍ `tol.dot` كما هي»).
            for a in range(len(starts)):
                for b in range(a + 1, len(starts)):
                    gap = dist(starts[a][1], starts[b][1])
                    pair_dots = "نقطة" in starts[a][0] and "نقطة" in starts[b][0]
                    limit = tol["min_step"] if pair_dots else stol["start"]
                    if gap < limit:
                        bad.append(f"{tag}: بدايتا «{starts[a][0]}» و«{starts[b][0]}» "
                                   f"على بُعد {gap:.0f} < {limit:.0f} — لا يفرّق بينهما المحرّك")
                    elif pair_dots and gap < stol["dot"]:
                        clusters.append((gap, tag))

    # **ويُعلَن العددُ ولا يُسكَت عنه** — مجموعاً لا زوجاً زوجاً: أضيقُ فجوةٍ باسم
    # حرفها هي المقيسة، وما فوقها يتّسع.
    if clusters:
        clusters.sort()
        print(f"  ○ عناقيدُ النقاط: {len(clusters)} زوجاً فجوتُه دون سماحة النقرة"
              f" ({stol['dot']:.0f}) — أضيقُها {clusters[0][1]} على {clusters[0][0]:.0f}"
              f" وأوسعُها {clusters[-1][0]:.0f}. مواضعُ منفصلةٌ يفرّقها أقربُ المنتظَرات،"
              " وإرشادُ اللوح يومض موضعَ المنتظَرة منها")
    return bad


# ————— بابُ الكلمات (الجلسة ٨): مسارُ النسخ بنيةٌ كبنية الحرف بفارقين —————
#
# مسارُ الكلمة يقرؤه `pen.js` كما يقرأ الحرف، فيسري عليه أكثرُ ما يسري على الحرف:
# بداياتٌ معلنة، ونقاطٌ بعد الجسم، ولا نقطتين متطابقتين، ولا نقطةَ خارج الشبكة،
# **وطيّاتٌ مفحوصةُ البنية**. وفارقاه اثنان، وكلاهما من طبيعة الكلمة لا استثناءٌ لها:
#
#   ١) **سقفُ الأجزاء والنقاط يتبع حروفَها**: `MAX_STROKES` ثلاثةٌ لأنّ أكثرَ حرفٍ
#      ثلاثةُ أجزاء — والكلمةُ حروفٌ، فسقفُها ذلك السقفُ **مضروباً في عدد حروفها**
#      (محسوبٌ من رسمها لا مكتوب). وكذلك النقاط.
#   ٢) **سماحتُها سماحتُها هي** (`tolerance` في مسارها): سماحاتُ المحرّك مُعايَرةٌ على
#      حرفٍ يملأ صندوقَه، وحرفُ الكلمة جزءٌ منه — فتُشَدّ بمقياسه. وكلُّ حدٍّ يقرؤه
#      هذا الفاحصُ من المحرّك (طولُ القطعة، ضلعُ الطيّة، تمايزُ المبادئ) **يُشَدّ
#      معها**، وإلا لَحكم على كلمةٍ بسماحةٍ لا تُحكَم بها.


def load_words() -> dict:
    """`WORD_PATHS` من الوحدة المولَّدة — `None` إن لم تُبنَ بعد."""
    if not WORD_PATHS_JS.exists():
        return None
    src = WORD_PATHS_JS.read_text(encoding="utf-8")
    body = re.search(r"export const WORD_PATHS = (\{.*?\n\});", src, re.S)
    return json.loads(body.group(1)) if body else None


def copy_material() -> set:
    """مادّةُ الكتابة التي يطلبها المنهج — وصلاتُ محطة الوصل وكلماتُ جدولها،
    **وجملُ محطة الجمل** (الجلسة ٩): لا جملةَ تُكتب بلا مسارٍ عابرٍ لهذا الفحص."""
    if not CURRICULUM.exists():
        return None
    src = CURRICULUM.read_text(encoding="utf-8")
    stages = re.search(r"export const STAGES = (\[.*?\n\]);", src, re.S)
    words = re.search(r"export const WORDS = (\{.*?\n\});", src, re.S)
    if not stages or not words:
        return None
    out = set(json.loads(words.group(1)))
    for stage in json.loads(stages.group(1)):
        if stage.get("kind") == "join":
            for node in stage.get("nodes", []):
                out.update(node.get("joins", []))
                out.update(node.get("words", []))
        elif stage.get("kind") == "sentence":
            for node in stage.get("nodes", []):
                out.update(node.get("sentences", []))
    return out


def check_words(words: dict, tol: dict, material: set) -> list:
    """بنيةُ مسارات النسخ — بسماحة كلِّ كلمةٍ التي تحملها."""
    bad = []
    stacks = []
    grid = tol["grid"]

    if material:
        for text in sorted(material):
            if text not in words:
                bad.append(f"«{text}» تُطلب نسخاً ولا مسارَ لها — لا كلمةَ بلا مسار")

    for text, ref in words.items():
        tag = f"كلمة «{text}»"
        # **وصندوقُ المادّة يُقرأ منها** (حكمُ المدير، ١٣ أغسطس ٢٠٢٦): مربّعٌ للكلمة
        # **وسطرٌ عريضٌ للجملة** — فحدُّ الشبكة حدُّ صندوقها هي لا مربّعٌ مفترَض.
        box = ref.get("box") or [grid, grid]
        gw, gh = float(box[0]), float(box[1])
        scale = ref.get("tolerance")
        if not isinstance(scale, (int, float)) or not 0 < scale <= 1:
            bad.append(f"{tag}: بلا سماحةٍ في مسارها (`tolerance`) — والسماحةُ تُحمَل لا تُفترَض")
            continue
        line = ref.get("line")
        if not isinstance(line, (int, float)) or not 0 < line < gh:
            bad.append(f"{tag}: بلا سطرِ جلوسٍ على الشبكة (`line`)")
        # حدودُ المحرّك مشدودةً بمقياس الكلمة — فما يحكم به يُفحَص به
        wtol = {**tol, "start": tol["start"] * scale, "back": tol["back"] * scale,
                "lateral": tol["lateral"] * scale}
        letters = [c for c in text if c not in " " and not (0x64B <= ord(c) <= 0x652)]
        strokes = ref.get("strokes") or []
        dots = ref.get("dots") or []
        if not strokes:
            bad.append(f"{tag}: لا جسمَ لها — مسارٌ بلا أجزاء")
        if len(strokes) > MAX_STROKES * max(1, len(letters)):
            bad.append(f"{tag}: أجزاؤها {len(strokes)} وحروفُها {len(letters)}"
                       f" وأكثرُ حرفٍ {MAX_STROKES} أجزاء")
        if sum(int(d.get("count", 1)) for d in dots) > MAX_DOTS * max(1, len(letters)):
            bad.append(f"{tag}: نقطُها أكثرُ ممّا تحتمل حروفُها")
        # **وجدولُ الحقيقة يسري على الكلمة بحروفها** — مجموعُ نقاط حروفها مواضعَ
        # منفصلة، فدمجُ عنقودٍ في الكلمة كدمجه في الحرف سواءً بسواء
        bad += check_dot_count(dots, sum(DOTS_OF.get(c, 0) for c in letters), tag)

        starts = []
        for i, stroke in enumerate(strokes, 1):
            where = f"{tag} جزء {i}"
            points = stroke.get("points") or []
            if len(points) < 2:
                bad.append(f"{where}: نقطتان فأكثر لازمتان ({len(points)})")
                continue
            start = stroke.get("start")
            if start is None:
                bad.append(f"{where}: بلا `start` — والبدايةُ تُعلَن لا تُستنبَط")
            elif dist(start, points[0]) > 0.05:
                bad.append(f"{where}: `start` ليس أوّلَ نقاطه")
            starts.append((where, start or points[0]))
            out = [p for p in points if not (0 <= p[0] <= gw and 0 <= p[1] <= gh)]
            if out:
                bad.append(f"{where}: {len(out)} نقطةً خارج الشبكة ({out[0]})")
            length = poly_len(points)
            cap = max(tol["min_step"], min(wtol["back"], length * tol["head_ratio"]))
            for k in range(1, len(points)):
                step = dist(points[k - 1], points[k])
                if step > cap + 0.5:
                    bad.append(f"{where}: قطعةٌ طولُها {step:.0f} وأقصى المسموح بسماحتها {cap:.0f}")
                    break
                if step < 0.05:
                    bad.append(f"{where}: نقطتان متطابقتان عند {points[k]}")
                    break
            bad += check_folds(stroke, where, wtol)
            bad += check_passes(stroke, where, wtol)

        for j, dot in enumerate(dots, 1):
            where = f"{tag} نقطة {j}"
            at = dot.get("at")
            if not at or len(at) != 2:
                bad.append(f"{where}: بلا موضع")
                continue
            if not (0 <= at[0] <= gw and 0 <= at[1] <= gh):
                bad.append(f"{where}: خارج الشبكة ({at})")
            if dot.get("after") is not True:
                bad.append(f"{where}: لا تُعلن `after: true` — والنقاطُ بعد جسم الكلمة كلِّه")
            starts.append((where, at))

        # **تمايزُ المبادئ — وإعفاءٌ واحدٌ مكتوبٌ بسببه**: القاعدةُ كما في الحرف
        # (بدايتان أقربُ من دائرة البداية لا يفرّق بينهما المحرّك). **ويُستثنى
        # المتراكبان على حرفٍ واحد** (شدّةٌ وحركتُها): العربيةُ تركّبهما بحكم الرسم لا
        # بحكم تأليفنا — لا موضعَ آخرَ لهما — **ويفرّقهما نزولُ الطفل بأقرب الجزأين
        # إليه** (وهو ما يقيسه `down`).
        #
        # **وحدُّ التفريق سماحةُ الارتداد لا اتجاهُ الإزاحة** (الجلسة ٩): كان المقيسُ
        # أن تكون الإزاحةُ **رأسيةً** — وهو وصفُ حالةٍ لا حدُّ محرّك: لمّا اتّسع صندوقُ
        # السطر خرجت الشدّةُ وحركتُها على «الصُّنْبُورُ نَظِيفْ» **قُطرِيّتَين** (٣٦
        # أفقياً و٣١ رأسياً) فسقط الوصفُ وبقي الحالُ حالَه. والحدُّ الصادق كمّيّ:
        # **ما جاوز سماحةَ الارتداد موضعان يفرّقهما أقربُ الجزأين**، وما دونها موضعٌ
        # واحد (وهو نصُّ الشرط الثاني في المحرّك بعينه). ويبقى الإعفاءُ **للضربات
        # وحدَها** — لا للنقطة، فسماحتُها أوسع. **ويُعلَن العددُ ولا يُسكَت عنه.**
        for a in range(len(starts)):
            for b in range(a + 1, len(starts)):
                pa, pb = starts[a][1], starts[b][1]
                gap = dist(pa, pb)
                if gap >= wtol["start"]:
                    continue
                strokes_pair = "جزء" in starts[a][0] and "جزء" in starts[b][0]
                if strokes_pair and gap > wtol["back"]:
                    stacks.append(f"{text}: {gap:.0f}")
                    continue
                # **ونقطةٌ لنقطةٍ كما في الحرف** (م٤): عنقودٌ ثلاثيٌّ في كلمةٍ مواضعُه
                # ثلاثة، وحدُّها أدنى خطوةٍ يفرّقها المحرّك (والعلّةُ وحدُّها مشروحان
                # عند نظيرتها في `check`)
                if "نقطة" in starts[a][0] and "نقطة" in starts[b][0]:
                    if gap >= tol["min_step"]:
                        continue
                bad.append(f"{tag}: بدايتا «{starts[a][0]}» و«{starts[b][0]}» "
                           f"على بُعد {gap:.0f} < {wtol['start']:.0f} — لا يفرّق بينهما المحرّك")
    if stacks:
        print("  ○ مُستثنىً بسببه (ضربتا علامةٍ متراكبتان على حرفٍ واحد، بينهما فوق "
              "سماحة الارتداد — يفرّقهما أقربُ الجزأين إلى نزول الطفل): " + " · ".join(stacks))
    return bad


def run(quiet: bool) -> int:
    tol = load_tolerance()
    forms = load_forms()
    paths = load_paths()
    letters = taught_letters()

    if not quiet:
        print(f"سماحةُ المحرّك المقروءة: بداية {tol['start']:.0f} · ارتداد {tol['back']:.0f}"
              f" · رأسُ المسار {tol['head_ratio']:.2f} · شبكة {tol['grid']:.0f}")
        shapes = sum(len(v) for v in paths.values())
        print(f"المسارات: {len(paths)} حرفاً في {shapes} شكلاً، وأشكالُ المواقع {len(forms)}")
        for ch, forms_of in paths.items():
            for form, ref in forms_of.items():
                spans = [poly_len(s["points"]) for s in ref["strokes"]]
                steps = [max(dist(s["points"][k - 1], s["points"][k])
                             for k in range(1, len(s["points"]))) for s in ref["strokes"]]
                folds = sum(len(s.get("folds") or []) for s in ref["strokes"])
                passes = sum(len(s.get("passes") or []) for s in ref["strokes"])
                # **والشكلُ المنقور لا ضربةَ فيه** (الصفرُ بحكم المالك، ١٨ أغسطس ٢٠٢٦):
                # `max()` على فراغٍ يرمي — وكان الجردُ المسهب يسقط به وحدَه بينما
                # يمرّ `--quiet`. **وحارسٌ يخضرّ في وضعٍ ويرمي في آخر عيبٌ لا طرفة**.
                print(f"  · {ch} {form}: {len(ref['strokes'])} جزءاً"
                      f" · طول {'، '.join(f'{v:.0f}' for v in spans) if spans else '—'}"
                      f" · أقصى قطعة {max(steps):.0f}" if steps else
                      f"  · {ch} {form}: نقرةٌ بلا ضربة"
                      f" · نقاط {sum(int(d['count']) for d in ref['dots'])}")
                if steps:
                    print(f"      نقاط {sum(int(d['count']) for d in ref['dots'])}"
                          + (f" · **طيّة {folds}**" if folds else "")
                          + (f" · **مرورٌ ثانٍ {passes}**" if passes else ""))

    if letters is None:
        if not quiet:
            print("المنهجُ لم يُملأ بعدُ (الجلسة ٣) — فلا تغطيةَ تُطالَب، والمطالبةُ تنطلق يومَ يمتلئ")
    elif not letters:
        print("✗ المنهجُ فيه محطات ولم يُقرأ منه حرفٌ واحد — فلْيوصَل الفاحصُ بشكل المحطات")
        return 1
    elif not quiet:
        print(f"الحروفُ المقرَّرة كتابةً في المنهج: {len(letters)}")

    bad = check(paths, tol, forms, letters)

    # **وفرجةُ النقطة تُقاس مع كلّ فحص** (حكمُ المالك، `STROKE_ORDER §٩`): الوحدةُ
    # تُقرأ من الملفّ المولَّد، **فإن لم يُعلنها الملفُّ طالبت من نفسها** ولم تمرّ
    # صامتة — نمطُ «التعليقُ يُطالِب من نفسه».
    unit = load_unit()
    if not unit:
        bad.append("لم تُعلَن وحدةُ السطر في `PATHS_SOURCE.line.unit`"
                   " — فلا تُقاس فرجةُ النقطة، وحكمُ المالك بلا حارس")
    else:
        dot_bad, dot_told = check_dot_clearance(paths, unit)
        bad += dot_bad
        if not quiet:
            want = line_layer.DOT_CLEARANCE * unit
            print(f"فرجةُ النقطة عن جسمها: حدُّها {want:.0f} وحدة"
                  f" ({line_layer.DOT_CLEARANCE} من ألفِ {unit:.1f}) — حكمُ المالك")
        for line in dot_told:
            print("  ○ " + line)

    # **وبابُ الكلمات يُطالِب يومَ تُبنى وحدتُه** (نمطُ «التعليقُ يُطالِب من نفسه»):
    # ما دامت `word_paths.js` غيرَ مبنيّةٍ فلا مطالبة، ويومَ تُبنى يصير كلُّ ما في
    # محطة الوصل مطالَباً بمساره بلا سطرٍ يُعدَّل هنا.
    words = load_words()
    material = copy_material()
    if words is None:
        if not quiet:
            print("مساراتُ النسخ لم تُبنَ بعد (الجلسة ٨) — والمطالبةُ تنطلق يومَ تُبنى")
    else:
        if not quiet:
            print(f"مساراتُ النسخ: {len(words)} مساراً"
                  + (f"، ومادّةُ النسخ في المنهج {len(material)}" if material else ""))
            for text, ref in list(words.items())[:4]:
                spans = [poly_len(s["points"]) for s in ref["strokes"]]
                print(f"  · «{text}»: {len(ref['strokes'])} قطعةً"
                      f" · سماحتُها ×{ref.get('tolerance')} · سطرُها {ref.get('line')}"
                      f" · أطول قطعةٍ {max(spans):.0f}")
            print(f"  … و{max(0, len(words) - 4)} غيرُها")
        bad += check_words(words, tol, material)

    for line in bad:
        print("  ✗ " + line)
    print(f"\n{len(bad)} مخالفة" if bad else "\nكلُّ مسارٍ سليمُ البنية: بداياتٌ معلنة،"
          " وأجزاءٌ معقولة، والنقاطُ بعد الجسم، ولا قطعةَ تخدع نافذةَ الرتابة،"
          " ولا طيّةَ مزعومةٌ على قطعةٍ سويّة — في الحروف والكلمات جميعاً")
    return 1 if bad else 0


# ————— الفحصُ الذاتي: حارسٌ لا يُجرَّب على ما يُفترض أن يمسكه ليس حارساً —————


def self_test() -> int:
    tol = load_tolerance()
    forms = load_forms()
    fails = 0

    def ok(cond, msg):
        nonlocal fails
        if not cond:
            fails += 1
        print(("  ✓ " if cond else "  ✗ ") + msg)

    def sound(count=40, step=20.0):
        """مسارٌ سليمٌ يُبنى حسابياً: خطٌّ نازلٌ بقطعٍ متساوية ونقطةٌ بعده."""
        pts = [[500.0, 100.0 + i * step] for i in range(count)]
        return {
            "strokes": [{"start": pts[0], "points": pts}],
            "dots": [{"at": [500.0, 950.0], "count": 1, "after": True}],
        }

    def seg(a, b, count):
        return [[a[0] + (b[0] - a[0]) * i / count, a[1] + (b[1] - a[1]) * i / count]
                for i in range(count + 1)]

    def folded():
        """مسارٌ سليمٌ **فيه طيّة**: ذراعٌ داخلة، فضلعٌ صاعد، فقمّة، فضلعٌ نازلٌ

        يعود بجواره، فذراعٌ خارجة — وهي سنّةُ ـبـ مجرّدةً من حرفها."""
        arm_in = seg([760.0, 620.0], [620.0, 620.0], 5)
        apex = [590.0, 220.0]
        up = seg(arm_in[-1], apex, 12)
        down = seg(apex, [540.0, 620.0], 12)
        arm_out = seg(down[-1], [300.0, 640.0], 8)
        pts = arm_in + up[1:] + down[1:] + arm_out[1:]
        fold = {"from": len(arm_in) - 1, "apex": len(arm_in) + len(up) - 2,
                "to": len(arm_in) + len(up) + len(down) - 3}
        return {
            "strokes": [{"start": pts[0], "points": pts, "folds": [fold]}],
            "dots": [{"at": [520.0, 900.0], "count": 1, "after": True}],
        }

    def one(ref):
        return {"ب": {f: ref for f in forms}}

    ok(not check(one(sound()), tol, forms), "المسارُ السليم يمرّ بلا شكوى")
    ok(not check(one(folded()), tol, forms), "والمسارُ المطويُّ بطيّةٍ معلنةٍ سليمة كذلك")

    # ١) البدايةُ المعلنة
    ref = sound()
    ref["strokes"][0].pop("start")
    ok(any("بلا `start`" in b for b in check(one(ref), tol, forms)),
       "ويُمسِك جزءاً بلا بدايةٍ معلنة")
    ref = sound()
    ref["strokes"][0]["start"] = [400.0, 100.0]
    ok(any("ليس أوّلَ نقاطه" in b for b in check(one(ref), tol, forms)),
       "ويُمسِك بدايةً تخالف أوّلَ النقاط")

    # ٢) أقصى طولِ قطعة — وهو زيادةُ مراجعة الجلسة ١
    ref = sound()
    ref["strokes"][0]["points"][20] = [500.0, 100.0 + 19 * 20 + tol["back"] + 40]
    ok(any("نافذةُ الرتابة" in b for b in check(one(ref), tol, forms)),
       f"ويُمسِك قطعةً تتجاوز حدَّ النافذة ({tol['back']:.0f}) فتخدع رتابةَ المحرّك")
    ref = sound(count=8, step=20.0)     # طولُه ١٤٠، فالحدُّ عُشرُه = ١٤
    ok(any("نافذةُ الرتابة" in b for b in check(one(ref), tol, forms)),
       "ويُمسِك قطعةً تتجاوز عُشرَ مسارٍ قصير (رأسُ المسار — ثغرةُ الذيل)")

    # ٣) النقاطُ بعد الجسم
    ref = sound()
    ref["dots"][0]["after"] = False
    ok(any("النقاطُ بعد الجسم" in b for b in check(one(ref), tol, forms)),
       "ويُمسِك نقطةً لا تُعلن أنها بعد الجسم")

    # ٤) الشبكةُ والتطابقُ والطول
    ref = sound()
    ref["strokes"][0]["points"][5] = [1400.0, 200.0]
    ok(any("خارج خليّته" in b for b in check(one(ref), tol, forms)),
       "ويُمسِك نقطةً خارج خليّة الشكل (بلا صندوقٍ معلَن: الشبكةُ المعيارية)")
    # **وحدُّ الخليّة يُقرأ من الشكل لا يُفترَض**: شكلٌ يعلن صندوقاً أوسعَ تُقبَل
    # فيه النقطةُ نفسُها، وأضيقَ تُردّ — فلو أُهمل الإعلانُ لَحمرّ السطرُ كلُّه.
    wide = sound()
    wide["box"] = [2035.5, 2035.5]
    wide["strokes"][0]["points"][5] = [1400.0, 200.0]
    ok(not any("خارج خليّته" in b for b in check(one(wide), tol, forms)),
       "ولا يردّها إن أعلن الشكلُ خليّةً تسعُها")
    ref = sound()
    ref["strokes"][0]["points"] = [[500.0, 100.0], [500.0, 100.0], [500.0, 160.0]]
    ok(any("طولُه" in b or "متطابقتان" in b for b in check(one(ref), tol, forms)),
       "ويُمسِك جزءاً أقصرَ من دائرة البداية أو فيه نقطتان متطابقتان")

    # ٥) تمايزُ مبادئ الأجزاء
    ref = sound()
    ref["dots"][0]["at"] = [500.0, 120.0]
    ok(any("لا يفرّق بينهما المحرّك" in b for b in check(one(ref), tol, forms)),
       f"ويُمسِك نقطةً تجاور بدايةَ الجسم دون سماحة البداية ({tol['start']:.0f})")

    # ٥ب) **العنقودُ الثلاثيُّ ثلاثةُ مواضع** (م٤) — والدمجُ يُزرَع فيحمرّ باسمه
    def sheen(dots):
        """شينٌ صناعية: جسمُ `sound` نفسُه، ونقاطُها كما تُملى عليها."""
        ref = sound()
        ref["dots"] = [{"at": list(at), "count": n, "after": True} for at, n in dots]
        return {"ش": {f: ref for f in forms}}

    trio = [([500.0, 240.0], 1), ([600.0, 330.0], 1), ([400.0, 330.0], 1)]
    ok(not check(sheen(trio), tol, forms),
       "والشينُ بثلاثة مواضعَ منفصلة تمرّ — وفجواتُها دون سماحة النقرة ولا تُضَمّ")
    merged = check(sheen([([500.0, 300.0], 3)]), tol, forms)
    ok(any("مواضعُ نقطه 1 والحقيقةُ الإملائية 3" in b for b in merged),
       "ويُمسِك **الدمجَ المزروع**: شينٌ بقيدٍ واحدٍ عدّتُه ثلاث — وهي علّةُ الميدان بعينها")
    ok(any("فلا تُضَمّ نقطتان في واحدة" in b for b in merged),
       "ويسمّي وجهَه الثاني: قيدٌ عدّتُه فوق الواحدة")
    ok(any("لا يفرّق بينهما المحرّك" in b
           for b in check(sheen([([500.0, 300.0], 1), ([500.0, 302.0], 1)]), tol, forms)),
       f"ويُمسِك نقطتين دون أدنى خطوةٍ يفرّقها المحرّك ({tol['min_step']:.0f})")
    ok(any("والحقيقةُ الإملائية 3" in b
           for b in check(sheen(trio[:2]), tol, forms)),
       "ويُمسِك شيناً نقصت نقطةٌ من عنقودها")

    # وفي الكلمة كذلك — والمقياسُ مجموعُ حروفها من الجدول
    def word_of(dots):
        pts = [[100.0 + i * 20.0, 500.0] for i in range(30)]
        return {"شَبْ": {
            "strokes": [{"start": pts[0], "points": pts}],
            "dots": [{"at": list(at), "count": n, "after": True} for at, n in dots],
            "line": 700.0, "tolerance": 0.5,
        }}

    quad = trio + [([800.0, 700.0], 1)]
    ok(not [b for b in check_words(word_of(quad), tol, set()) if "نقط" in b or "يفرّق" in b],
       "و«شَبْ» بأربعة مواضع (ش ٣ + ب ١) تمرّ في الكلمة")
    ok(any("والحقيقةُ الإملائية 4" in b
           for b in check_words(word_of([([500.0, 300.0], 3), ([800.0, 700.0], 1)]), tol, set())),
       "ويُمسِك الدمجَ المزروعَ في الكلمة كما يمسكه في الحرف")

    # ٦) اكتمالُ أشكال المواقع والتغطية
    shapes = one(sound())
    shapes["ب"].pop(forms[-1])
    ok(any("ينقصه من أشكال المواقع" in b for b in check(shapes, tol, forms)),
       "ويُمسِك حرفاً نقص شكلٌ من أشكال مواقعه")
    ok(any("لا حرفَ بلا مسار" in b for b in check(one(sound()), tol, forms, {"ب", "م"})),
       "ويُمسِك حرفاً يُدرَّس كتابةً ولا مسارَ له")

    # ٧) كثرةُ الأجزاء والنقاط
    ref = sound()
    ref["strokes"] = ref["strokes"] * (MAX_STROKES + 1)
    ok(any("أجزاءُ جسمه" in b for b in check(one(ref), tol, forms)),
       f"ويُمسِك حرفاً جاوزت أجزاؤه {MAX_STROKES}")
    ref = sound()
    ref["dots"][0]["count"] = MAX_DOTS + 1
    ok(any("ولا حرفَ عربيّ كذلك" in b for b in check(one(ref), tol, forms)),
       f"ويُمسِك نقطاً جاوز {MAX_DOTS}")

    # ٨) الطيّة المعلَنة — رخصةٌ في الحكم فتُفحَص بنيتُها (الجلسة ٢ب)
    ref = sound()
    span = len(ref["strokes"][0]["points"]) - 1
    ref["strokes"][0]["folds"] = [{"from": 0, "apex": span // 2, "to": span}]
    plain = check(one(ref), tol, forms)
    # **والمقيسُ المكانُ لا الاتجاه** (حكمُ المدير، ١٣ أغسطس): قطعةٌ سويّةٌ ضلعاها
    # متباعدان في المكان، فتسقط دعوى الطيّة عليها — وهي عينُ ما كان يُمسَك بالتقابل،
    # ويزيد أنّ **الشقّين المتوازيين في الكلمة** يعبران القاعدةَ بحقٍّ (لا يعبران
    # قاعدةَ التقابل وهما مكانٌ واحد بطولين).
    ok(any("لا يشتركان في حبر" in b for b in plain),
       "ويُمسِك **طيّةً مزعومة على قطعةٍ سويّة** — ضلعاها لا يشتركان في حبر")

    # **والانطباقُ المتوازي طيّةٌ صادقة**: شقّان يُمشى حبرُهما مرّتين في اتجاهٍ واحد
    # (حبرُ الوصل في الكلمة) — يعبر القاعدةَ الجديدة، وكانت القديمةُ تردّه.
    ref = sound()
    pts = ref["strokes"][0]["points"]
    out = [list(p) for p in pts]
    back = [[p[0], p[1] + tol["lateral"] * 0.2] for p in reversed(out[:-1])]
    ref["strokes"][0]["points"] = out + back + [list(p) for p in out[1:]]
    n = len(ref["strokes"][0]["points"]) - 1
    ref["strokes"][0]["start"] = ref["strokes"][0]["points"][0]
    ref["strokes"][0]["folds"] = [{"from": 0, "apex": len(out) + len(back) - 1, "to": n}]
    twin = [b for b in check(one(ref), tol, forms) if "طيّة" in b]
    ok(not twin, "ويقبل **انطباقاً متوازياً** طيّةً — شقّان يشتركان في الحبر"
       + (f" — شكا: {twin[0]}" if twin else ""))

    ref = folded()
    ref["strokes"][0]["folds"] = [{"from": 5, "apex": 3, "to": 9}]
    ok(any("غيرُ مرتّبة" in b for b in check(one(ref), tol, forms)),
       "ويُمسِك طيّةً أرقامُها غيرُ مرتّبة أو خارجَ نقاط القطعة")
    ref = folded()
    ref["strokes"][0]["folds"] = [{"from": 0, "apex": 9999, "to": 10}]
    ok(any("خارجَ نقاط القطعة" in b for b in check(one(ref), tol, forms)),
       "ويُمسِك رقمَ نقطةٍ لا وجودَ لها في القطعة")

    ref = folded()
    fold = dict(ref["strokes"][0]["folds"][0])
    ref["strokes"][0]["folds"] = [fold, {"from": fold["apex"], "apex": fold["to"],
                                         "to": fold["to"] + 4}]
    ok(any("تتداخل مع طيّةٍ قبلها" in b for b in check(one(ref), tol, forms)),
       "ويُمسِك طيّتين متداخلتين — ولا يقع مكانان في مكان")

    ref = folded()
    fold = ref["strokes"][0]["folds"][0]
    ref["strokes"][0]["folds"] = [{"from": fold["apex"] - 1, "apex": fold["apex"],
                                   "to": fold["apex"] + 1}]
    ok(any("دون سماحة الارتداد" in b for b in check(one(ref), tol, forms)),
       f"ويُمسِك ضلعاً أقصرَ من سماحة الارتداد ({tol['back']:.0f}) — لا يقيسه المحرّك")

    ref = folded()
    ref["strokes"][0]["folds"] = []
    ok(any("تُعلَن أو تُترك" in b for b in check(one(ref), tol, forms)),
       "ويُمسِك `folds` معلنةً فارغة — الطيّةُ تُعلَن أو تُترك")

    # ٨ب) **المرورُ الثاني في الاتجاه نفسِه** — الحالةُ الثالثة (بند ص٢/ز)
    #
    # ومادّتُها **جسمُ الطاء مجرَّداً**: سطرٌ يُمشى يساراً، ثمّ نزهةٌ في حلقةٍ تقوم
    # منه وتعود إليه، ثمّ **يُمشى ذلك السطرُ بعينه يساراً مرّةً ثانية**.
    def passed():
        line_in = seg([900.0, 620.0], [420.0, 640.0], 12)
        loop = seg(line_in[-1], [560.0, 240.0], 10) + seg([560.0, 240.0], [840.0, 610.0], 10)[1:]
        line_out = seg([880.0, 625.0], [300.0, 650.0], 14)
        pts = line_in + loop[1:] + line_out
        first, again = len(line_in) - 1, len(line_in) + len(loop) - 1
        return {
            "strokes": [{"start": pts[0], "points": pts, "passes": [
                {"from": 0, "to": first, "again": again, "until": len(pts) - 1}]}],
            "dots": [{"at": [520.0, 900.0], "count": 1, "after": True}],
        }

    ok(not check(one(passed()), tol, forms),
       "والمسارُ ذو المرور الثاني في الاتجاه نفسِه — معلَناً سليماً — يمرّ")

    ref = passed()
    ref["strokes"][0]["passes"] = [{"from": 5, "to": 2, "again": 8, "until": 12}]
    ok(any("غيرُ مرتّبة" in b for b in check(one(ref), tol, forms)),
       "ويُمسِك مروراً أرقامُه غيرُ مرتّبة أو خارجَ نقاط القطعة")

    # **ودعوى المرور على حبرٍ لا يُمشى مرّتين تُردّ** — كما تُردّ دعوى الطيّة على
    # قطعةٍ سويّة: المرورُ رخصةٌ في الحكم، فلا يُدَّعى حيث يفرّق المحرّكُ الموضعين.
    ref = sound()
    span = len(ref["strokes"][0]["points"]) - 1
    ref["strokes"][0]["passes"] = [{"from": 0, "to": span // 3,
                                    "again": span // 2, "until": span}]
    ok(any("لا يشتركان في حبر" in b for b in check(one(ref), tol, forms)),
       "ويُمسِك **مروراً مزعوماً على حبرٍ يُمشى مرّةً** — مرّاه لا يشتركان في حبر")

    # **والشوكةُ ليست مروراً ثانياً**: حبرُها واحدٌ ورأسا قلمها متعاكسان — فمن
    # ادّعاها مروراً ادّعى رخصةَ غيرها، ويحمرّ باسمه.
    ref = folded()
    fold = ref["strokes"][0]["folds"][0]
    ref["strokes"][0].pop("folds")
    ref["strokes"][0]["passes"] = [{"from": fold["from"], "to": fold["apex"],
                                    "again": fold["apex"], "until": fold["to"]}]
    ok(any("رأسا قلمه متعاكسان" in b for b in check(one(ref), tol, forms)),
       "ويُمسِك **شوكةً مدَّعاةً مروراً ثانياً** — رأسا قلمها متعاكسان")

    # **ولا يقع مكانان في مكان**: مرورٌ يتقاطع مع طيّةٍ معلَنة — والطيّةُ أسبقُ.
    ref = passed()
    pts = ref["strokes"][0]["points"]
    span = ref["strokes"][0]["passes"][0]
    ref["strokes"][0]["folds"] = [{"from": span["to"], "apex": span["to"] + 5,
                                   "to": span["again"]}]
    ok(any("يتداخل مع طيّةٍ معلَنة" in b for b in check(one(ref), tol, forms)),
       "ويُمسِك مروراً يتقاطع مع طيّةٍ معلَنة")

    ref = passed()
    span = ref["strokes"][0]["passes"][0]
    ref["strokes"][0]["passes"] = [{"from": span["from"], "to": span["from"] + 1,
                                    "again": span["again"], "until": span["again"] + 1}]
    ok(any("دون سماحة الارتداد" in b for b in check(one(ref), tol, forms)),
       f"ويُمسِك مروراً أقصرَ من سماحة الارتداد ({tol['back']:.0f}) — لا يقيسه المحرّك")

    ref = passed()
    ref["strokes"][0]["passes"] = []
    ok(any("يُعلَن أو يُترك" in b for b in check(one(ref), tol, forms)),
       "ويُمسِك `passes` معلنةً فارغة — المرورُ يُعلَن أو يُترك")

    # ٩) وأرقامُه من المحرّك لا من هنا
    src = PEN_JS.read_text(encoding="utf-8")
    ok(f"back: {int(tol['back'])}" in src and f"start: {int(tol['start'])}" in src,
       f"وسماحاتُه مقروءةٌ من `pen.js` نفسِه (بداية {tol['start']:.0f} · ارتداد {tol['back']:.0f})")

    # ١٠) **وفرجةُ النقطة مجرَّبةٌ سالبةً** (حكمُ المالك، `STROKE_ORDER §٩`):
    #     حارسٌ لم يُجرَّب على ما وُضع له ليس حارساً — فتُنزَّل نقطةُ شكلٍ سليمٍ
    #     حتى تلامس جسمَه ويُنظر أيحمرّ.
    unit = load_unit()
    near = one(sound())
    near["ب"]["isolated"]["dots"][0]["at"] = [500.0, 900.0]      # على الخطّ نفسِه
    hot, _ = check_dot_clearance(near, unit)
    ok(any("مسافةٌ واضحة" in b for b in hot),
       "ويُمسِك نقطةً لصقت بجسم حرفها — «مسافةٌ واضحة بين الحرف والنقطة»")
    far = one(sound())
    far["ب"]["isolated"]["dots"][0]["at"] = [500.0 + line_layer.DOT_CLEARANCE * unit + 1, 950.0]
    ok(not check_dot_clearance(far, unit)[0],
       f"ويمرّ ما بلغ الحدَّ ({line_layer.DOT_CLEARANCE * unit:.0f} وحدة = "
       f"{line_layer.DOT_CLEARANCE} من الألف) — فلا يحمرّ على السليم")
    # **والمعفوُّ مثبَّتٌ لا يزداد ضيقاً**: تُقرَّب نقطةُ ياءٍ معفوّةٍ عمّا هي عليه
    tight = json.loads(json.dumps(load_paths()))
    ref = tight["ي"]["isolated"]
    ref["dots"] = [{**d, "at": [d["at"][0], d["at"][1] - 20]} for d in ref["dots"]]
    ok(any("المعفوُّ مثبَّتٌ" in b for b in check_dot_clearance(tight, unit)[0]),
       "ويُمسِك معفوّاً ضاقت فرجتُه عمّا أُعلنت — فالإعفاءُ تثبيتٌ لا رخصةُ تفاقم")

    # **والحدُّ عاملٌ لا ثابتٌ مكتوب** (عهدُ ١٩ أغسطس): يُجرَّب الفرقُ بعينه —
    # **فرجةٌ تجاوز أرضيّةَ المالك ولا تبلغ نصفَ قطر قبول مادّتها**: تمرّ بمقياس
    # الثابت وتحمرّ بمقياس القبول العامل. **وهذا هو العطبُ الذي كشفه البلاغ.**
    floor = line_layer.DOT_CLEARANCE * unit
    scaled_up = one(sound())
    ref = scaled_up["ب"]["isolated"]
    ref["tolerance"] = 2.0                    # مادّةٌ نصفُ قبولها ٢٨٠ لا ١٤٠
    ref["dots"][0]["at"] = [500.0 + floor + 10, 950.0]
    hot, _ = check_dot_clearance(scaled_up, unit)
    ok(any("حدُّها العامل" in b and "×2.00" in b for b in hot),
       f"ويُمسِك فرجةً فوق أرضيّة المالك ({floor:.0f}) ودون نصفِ قطر قبولها العامل"
       " — **الحدُّ العامل لا الثابتُ المكتوب**")
    ref["tolerance"] = 1.0                    # المادّةُ نفسُها بمقياسها الأصل
    ok(not check_dot_clearance(scaled_up, unit)[0],
       "وتمرّ الفرجةُ عينُها إذا كان قبولُ مادّتها دونها — فالحدُّ يتبع القبولَ لا العكس")

    # **والموقوفُ بأمر النسبة مثبَّتٌ لا يزداد ضيقاً** — كالمعفوّ سواءً بسواء
    held = json.loads(json.dumps(load_paths()))
    ref = held["غ"]["final"]
    ref["dots"] = [{**d, "at": [d["at"][0], d["at"][1] + 20]} for d in ref["dots"]]
    ok(any("الموقوفُ مثبَّتٌ" in b for b in check_dot_clearance(held, unit)[0]),
       "ويُمسِك موقوفاً بأمر النسبة ضاقت فرجتُه — فالوقفُ تثبيتٌ لا رخصةُ تفاقم")

    print(f"\n{fails} فشل" if fails else "\nالفاحصُ يمسك كلَّ ما وُضع له")
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser(description="حارسُ المسارات المرجعية")
    ap.add_argument("-q", "--quiet", action="store_true", help="الأخطاء وحدها")
    ap.add_argument("--self-test", action="store_true", help="فحصُ الفاحص")
    args = ap.parse_args()
    return self_test() if args.self_test else run(args.quiet)


if __name__ == "__main__":
    sys.exit(main())
