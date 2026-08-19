#!/usr/bin/env python3
"""**لوحُ الاتجاه** — كرّاسةُ الخطّاط: من أين يبدأ القلمُ، وإلى أين يمضي، وبأيّ ترتيب.

    python3 tools/direction_board.py                 # يكتب scratch/direction_board.html
    python3 tools/direction_board.py --out X.html    # إلى موضعٍ آخر
    python3 tools/direction_board.py --shot X.png    # ولقطةٌ واحدة معه (Chrome بلا نافذة)
    python3 tools/direction_board.py --only ثعغ      # حروفاً بأعيانها
    python3 tools/direction_board.py --self-test     # عهدُ اللوح بلا متصفّح

## لِمَ لوحٌ ثانٍ و`make_paths.py --sheet` قائم؟

سؤالُ المالك (١٨ أغسطس ٢٠٢٦) بعد أن رضي الشكل: «**هل الاتجاهُ والبدايةُ صحيحة؟
أراها لا تتبع حركةَ يدي**». **ولوحُ `--sheet` لا يجيبه**: يعرض الشكلَ ساكناً — ولا
تُرى الحركةُ في صورةٍ ساكنة إلا بأسهمٍ وأرقام. **وهو يرسم الخيالَ** (`studio()` في
عدّة التأليف) لا **المبنيَّ الذي يعلوه أثرُ يده** — فيُسأل عن شيءٍ ويُعرَض غيرُه.

فهذا اللوحُ يقرأ **`app/js/paths.js` بعينه** (وهو ما يمشيه المحرّكُ ويراه الطفل)
ويرسم لكلِّ شكل:
  · **نقطةَ البداية** ظاهرةً (دائرةٌ مصمتة حيث ينزل القلم)،
  · **وسهمَ الاتجاه** على أوّل الحركة،
  · **وأرقامَ الأجزاء متتابعةً** — ١ للضربة الأولى، ٢ للثانية، ثم النقاطُ بعدها.

⚠ **ولا أرقامَ عُقَدٍ فيه** (حكمُ الإدارة، ١٨ أغسطس): أرقامُ عُقَد الهيكل في لوح
المراجعة **قرأها المالكُ ترتيبَ كتابة** وهي عناوينُ عُقَدٍ لا خطوات (١ ← ٢ ← ٥ ← ٧
صحيحٌ لأنها عناوين) — **فما يُقرأ ترتيباً وهو ليس ترتيباً يُسقَط أو يُفصَل**. وليس
في هذا اللوح رقمٌ إلا ما هو **ترتيبُ كتابةٍ حقّاً**.

**ولا رقمَ يُكتب هنا بيد**: كلُّ إحداثيٍّ من `paths.js`، والسهمُ والقوسُ محسوبان من
نقاطه، والترتيبُ ترتيبُ أجزائه كما يفرضه الشرطُ الرابع في `pen.js`.
"""

import argparse
import json
import math
import re
import subprocess
import sys
import tempfile
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
PATHS_JS = ROOT / "app" / "js" / "paths.js"
OUT = ROOT / "scratch" / "direction_board.html"
GRID = 1000
# **هامشٌ حول الشبكة**: قرصُ الرقم عند نقطةٍ على الحافّة يقع نصفُه خارجَها — والمبتورُ
# لا يُقرأ. فيُوسَّع المنظورُ بقدر قطر القرص، **ولا يُزاح رقمٌ عن موضعه**.
MARGIN = 70
FORMS = ["isolated", "initial", "medial", "final"]
FORM_AR = {"isolated": "معزول", "initial": "ابتدائي", "medial": "وسطي", "final": "نهائي"}

sys.path.insert(0, str(TOOLS))
import browser_test  # noqa: E402  (مُشغِّلُ Chrome — تبعيةٌ معلَنة كما في `make_paths.py`)
import line_layer  # noqa: E402  (أقربُ نقطةٍ من الجسم — عدّةٌ واحدة لا نسختان)


def guide(name: str, fallback: float) -> float:
    """مقياسُ إرشادٍ من `GUIDE` في `pen.js` بعينه — فما يُرسَم هنا ما يراه الطفلُ.

    **ومن كتلته وحدَها**: في `pen.js` جدولان فيهما `dot` — سماحةُ قبول النقرة
    (`TOLERANCE`) ومقياسُ رسمها (`GUIDE`)، **وأخذُ الأول رسماً يجعل النقطةَ أربعةَ
    أضعافها**. فيُقصّ الجدولُ باسمه ثم يُقرأ منه.
    """
    src = (ROOT / "app" / "js" / "pen.js").read_text(encoding="utf-8")
    block = re.search(r"export const GUIDE = \{(.*?)\};", src, re.S)
    hit = re.search(rf"\b{name}:\s*([\d.]+)", block.group(1)) if block else None
    return float(hit.group(1)) if hit else fallback


def paths() -> dict:
    """`PATHS` من الوحدة المولَّدة — قراءةٌ نصّية، ولا نسخةَ ثانية تشيخ."""
    src = PATHS_JS.read_text(encoding="utf-8")
    body = re.search(r"export const PATHS = (\{.*?\n\});", src, re.S)
    if not body:
        sys.exit(f"لم تُقرأ `PATHS` من {PATHS_JS}")
    return json.loads(body.group(1))


def head_of(points: list) -> tuple:
    """**أوّلُ حركةٍ حقيقية**: أوّلُ نقطةٍ تبعد عن المبدأ ما يُرى، وجهتُها منه.

    ولا تُؤخذ النقطةُ التالية بعينها: عيّناتُ المحرّك متقاربة، فسهمٌ عليها يرتجف مع
    أوّل رجفةٍ في الأثر ولا يقول جهةَ الحركة. **والمدى عُشرُ طول الضربة** — نسبةٌ من
    الضربة نفسِها لا رقمٌ مكتوب.
    """
    start = points[0]
    span = 0.0
    for i in range(1, len(points)):
        span += ((points[i][0] - points[i - 1][0]) ** 2
                 + (points[i][1] - points[i - 1][1]) ** 2) ** 0.5
    reach = span * 0.1
    run = 0.0
    for i in range(1, len(points)):
        run += ((points[i][0] - points[i - 1][0]) ** 2
                + (points[i][1] - points[i - 1][1]) ** 2) ** 0.5
        if run >= reach:
            return start, points[i]
    return start, points[-1]


def arrow(a: list, b: list, size: float = 62.0) -> str:
    """رأسُ سهمٍ عند `b` جهتُه من `a` إليه — مثلّثٌ محسوبٌ من النقطتين."""
    dx, dy = b[0] - a[0], b[1] - a[1]
    length = (dx * dx + dy * dy) ** 0.5 or 1.0
    ux, uy = dx / length, dy / length
    tip = (b[0] + ux * size * 0.5, b[1] + uy * size * 0.5)
    left = (tip[0] - ux * size - uy * size * 0.42, tip[1] - uy * size + ux * size * 0.42)
    right = (tip[0] - ux * size + uy * size * 0.42, tip[1] - uy * size - ux * size * 0.42)
    pts = " ".join(f"{p[0]:.1f},{p[1]:.1f}" for p in (tip, left, right))
    return f'<polygon class="arrow" points="{pts}"/>'


def behind(a: list, b: list, step: float = 74.0) -> list:
    """موضعٌ خلفَ المبدأ في عكس جهة الحركة — مقعدُ رقم الضربة."""
    dx, dy = b[0] - a[0], b[1] - a[1]
    length = (dx * dx + dy * dy) ** 0.5 or 1.0
    return [a[0] - (dx / length) * step, a[1] - (dy / length) * step]


def tag(at: list, number: int, kind: str, zoom: float = 1.0) -> str:
    """رقمُ الجزء في قرصه — **وهو ترتيبُ كتابةٍ لا عنوانُ عقدة**."""
    return (f'<circle class="tag {kind}" cx="{at[0]:.1f}" cy="{at[1]:.1f}"'
            f' r="{52 * zoom:.0f}"/>'
            f'<text class="num" x="{at[0]:.1f}" y="{at[1]:.1f}"'
            f' style="font-size:{70 * zoom:.0f}px">{number}</text>')


def aside(ref: dict, at: list, dot_r: float, zoom: float) -> list:
    """مقعدُ رقم النقطة: **بجانبها في ضدّ جهة جسمها** — فلا يبتلعها ولا يبتلع أختَها.

    وبُعدُه محسوب: نصفُ قطر النقطة + نصفُ قطر القرص + فُرجةٌ بينهما — فما رُسم
    التصق، وما التصق قُرئ حكماً على الشكل وليس منه.

    **والعنقودُ الثلاثيّ يفرض دورانَ المقعد** (ث · ش · ق · ي): الجهةُ المضادّةُ
    للجسم واحدةٌ لنقاطه كلِّها، فقرصُ الرقم يقع على نقطة أختِه. **فيُدار المقعدُ
    حول نقطته حتى يخلو من كلِّ نقطةٍ في الشكل** — أوّلُ زاويةٍ تخلو، فلا يبعد
    الرقمُ عن نقطته أكثرَ ممّا يلزم.
    """
    _, foot = line_layer.nearest_on_body(ref, at)
    dx, dy = (at[0] - foot[0], at[1] - foot[1]) if foot else (0.0, -1.0)
    length = (dx * dx + dy * dy) ** 0.5 or 1.0
    dx, dy = dx / length, dy / length
    step = dot_r + (52 + 14) * zoom
    clear = dot_r + 52 * zoom
    others = [d["at"] for d in ref.get("dots") or []]
    seat = None
    for turn in range(0, 181, 15):
        for sign in ((1, -1) if turn else (1,)):
            rad = math.radians(turn * sign)
            ux = dx * math.cos(rad) - dy * math.sin(rad)
            uy = dx * math.sin(rad) + dy * math.cos(rad)
            here = [at[0] + ux * step, at[1] + uy * step]
            if all((here[0] - o[0]) ** 2 + (here[1] - o[1]) ** 2 >= clear ** 2
                   for o in others if o is not at):
                seat = here
                break
        if seat:
            break
    return seat or [at[0] + dx * step, at[1] + dy * step]


def cell(ch: str, form: str, ref: dict) -> str:
    """خانةُ شكلٍ واحد: **سطرُه** · مسارُه · بدايتُه · سهمُه · أرقامُ أجزائه بترتيبها.

    **وصندوقُها صندوقُ المادّة** (بند ص٢/ب ٢): الأشكالُ تجلس على سطرٍ واحدٍ في خليّةٍ
    ضلعُها ألفان، **فمن قرأها في شبكةِ ألفٍ رأى رُبعَها**. وعلاماتُ اللوح (السهمُ
    والقرصُ والرقم) **تكبر بمقياس خليّته** وإلا صارت ذَرّاً في لوحٍ ضِعفَي شبكتها.
    """
    box = ref.get("box") or [GRID, GRID]
    span = float(box[1])
    zoom = span / GRID
    body = []
    # **والسطرُ يُرسم في اللوح كما يُرسم للطفل** — فما يراه المالكُ هو ما يراه.
    if ref.get("line") is not None:
        body.append(f'<line class="seat" x1="0" y1="{ref["line"]:.1f}"'
                    f' x2="{box[0]:.1f}" y2="{ref["line"]:.1f}"/>')
    order = 0
    for stroke in ref.get("strokes") or []:
        points = stroke["points"]
        line = " ".join(f"{p[0]:.1f},{p[1]:.1f}" for p in points)
        body.append(f'<polyline class="ink" points="{line}"/>')
        start = stroke.get("start") or points[0]
        a, b = head_of(points)
        body.append(arrow(a, b, 62.0 * zoom))
        body.append(f'<circle class="begin" cx="{start[0]:.1f}" cy="{start[1]:.1f}"'
                    f' r="{26 * zoom:.0f}"/>')
        order += 1
        # **ورقمُ الضربة خلفَ حركتها**: لو وُضع على المبدأ لَغطّى السهمَ الذي يليه —
        # فيُزاح إلى الوراء بقدر قطره في عكس جهة المضيّ، **فيُقرأ الرقمُ ويُرى السهم**.
        body.append(tag(behind(a, b, 74.0 * zoom), order, "stroke", zoom))
    # ————— **النقطةُ بحجمها الحقيقيّ، ورقمُها بجانبها لا فوقها** —————
    #
    # 🔧 **عيبُ عدّةٍ انكشف في حكم فرجة النقطة** (`STROKE_ORDER §٩د`): كانت النقطةُ
    # تُرسَم قرصاً نصفُ قطره ٣٠ **ثم يُوضَع قرصُ الرقم ونصفُ قطره ٥٢ على مركزها
    # نفسِه** — فيبتلعها ويلامس الجسمَ، **فيُرى التصاقٌ ليس في الرسم**. وعلى هذا
    # اللوح تُبنى أحكامُ عين، **فلوحٌ بُني ليُري الحقيقةَ لا يجوز أن يزيّفها**.
    #
    # **والعلاجُ شقّان**: **حجمُها من المحرّك** (`GUIDE.dot` × مقياس المادّة) لا
    # رقمٌ في هذا الملفّ — فما يراه المالكُ هو ما يراه الطفلُ · **ورقمُها يُزاح
    # عنها في ضدّ جهة الجسم**، كما يُزاح رقمُ الضربة خلفَ حركتها.
    dot_r = guide("dot", 34.0) * (ref.get("tolerance") or 1.0)
    for dot in ref.get("dots") or []:
        at = dot["at"]
        body.append(f'<circle class="dot" cx="{at[0]:.1f}" cy="{at[1]:.1f}"'
                    f' r="{dot_r:.0f}"/>')
        order += 1
        body.append(tag(aside(ref, at, dot_r, zoom), order, "dot", zoom))
    name = f"{ch} · {FORM_AR.get(form, form)}"
    # **وللّوح فُسحةٌ حول الخليّة**: أرقامُ الترتيب تُرسَم **خلف** مبدأ الضربة، فمن
    # بدأ عند سقف الخليّة (`ك/ابتدائي`، أعلى الهجاء) خرج رقمُه عنها. وهي فُسحةُ
    # مراجعةٍ بالعين لا خليّةُ كتابة — ولوحُ الطفل يبقى على خليّته.
    pad = 90 * zoom
    return (f'<figure class="cell"><svg viewBox="{-pad:.0f} {-pad:.0f}'
            f' {box[0] + 2 * pad:.0f} {box[1] + 2 * pad:.0f}">'
            + "".join(body) + f'</svg><figcaption>{name}</figcaption></figure>')


STYLE = """
:root { color-scheme: light; --ink: #1d2330; --line: #cdd4e0; --begin: #c0392b;
        --tagbg: #1d2330; --dot: #2b6cb0; --paper: #faf7f0; }
* { box-sizing: border-box; }
body { margin: 0; padding: 18px; background: #f2f0ea; color: var(--ink);
       font-family: 'Marhey', system-ui, sans-serif; direction: rtl; }
h1 { font-size: 22px; margin: 0 0 6px; }
p.note { margin: 0 0 14px; font-size: 14px; line-height: 1.7; color: #454c5c; }
p.note b { color: var(--begin); }
#board { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.cell { margin: 0; background: var(--paper); border-radius: 10px; position: relative;
        border: 1px solid var(--line); }
.cell svg { display: block; width: 100%; aspect-ratio: 1; }
figcaption { position: absolute; inset-block-start: 6px; inset-inline-start: 10px;
             font-size: 15px; color: #6b7280; }
.ink { fill: none; stroke: var(--ink); stroke-width: 53; stroke-linecap: round;
       stroke-linejoin: round; opacity: .82; }
/* **سطرُ الكتابة** كما يراه الطفلُ على لوحه — خافتٌ متقطّع لا يزاحم الحبر */
.seat { stroke: var(--line); stroke-width: 6; stroke-dasharray: 28 24; }
.arrow { fill: var(--begin); }
.begin { fill: var(--begin); }
.dot { fill: var(--dot); }
.tag { fill: var(--tagbg); opacity: .92; }
.tag.dot { fill: var(--dot); }
.num { fill: #fff; font-size: 64px; text-anchor: middle; dominant-baseline: central; }
"""


def page(built: dict, only: str = None) -> str:
    cells = []
    for ch, family in built.items():
        if only and ch not in only:
            continue
        for form in FORMS:
            if form in family:
                cells.append(cell(ch, form, family[form]))
    head = (
        "<title>لوحُ الاتجاه — اُكْتُبْ</title>"
        f"<style>{STYLE}</style>"
    )
    note = (
        "<h1>لوحُ الاتجاه — من أين يبدأ القلمُ وإلى أين يمضي</h1>"
        "<p class=\"note\">"
        "<b>الدائرةُ الحمراء</b> موضعُ نزول القلم · <b>السهمُ</b> أوّلُ الحركة · "
        "<b>الأرقامُ</b> ترتيبُ الأجزاء كما تُكتب (والنقاطُ آخرَ الكلّ، بالأزرق). "
        f"وهي مقروءةٌ من <code>app/js/paths.js</code> بعينه — {len(cells)} شكلاً. "
        "ولا أرقامَ عُقَدٍ هنا: كلُّ رقمٍ في اللوح ترتيبُ كتابةٍ لا عنوانُ موضع."
        "</p>"
    )
    return f"{head}{note}<div id=\"board\">{''.join(cells)}</div>"


def shoot(html: Path, png: Path, cells: int) -> bool:
    """لقطةٌ واحدة للّوح — نافذةٌ تُحسب من عدد الصفوف فلا تبتُر."""
    rows = (cells + 3) // 4
    width = 1600
    height = 150 + rows * (width // 4 + 26)
    png.unlink(missing_ok=True)
    profile = Path(tempfile.mkdtemp(prefix=browser_test.CHROME_PREFIX + "board-"))
    proc = browser_test.run_chrome(
        html.resolve().as_uri(), profile,
        ["--hide-scrollbars", f"--screenshot={png}", f"--window-size={width},{height}"], False)
    try:
        proc.wait(timeout=180)
    except subprocess.TimeoutExpired:
        proc.kill()
    return png.exists()


def self_test() -> int:
    """عهدُ اللوح — بلا متصفّح: أيقول ما يدّعيه لكلِّ شكل؟"""
    fails = 0

    def ok(cond, msg):
        nonlocal fails
        if not cond:
            fails += 1
        print(("  ✓ " if cond else "  ✗ ") + msg)

    built = paths()
    shapes = [(ch, f) for ch, fam in built.items() for f in FORMS if f in fam]
    html = page(built)
    ok(len(shapes) > 100, f"اللوحُ يقرأ المبنيَّ نفسَه: {len(shapes)} شكلاً من {PATHS_JS.name}")
    ok(html.count('class="cell"') == len(shapes),
       f"ولكلِّ شكلٍ خانتُه ({html.count('class=\"cell\"')} خانة)")
    ok(html.count('class="begin"') == sum(len(built[c][f].get("strokes") or [])
                                          for c, f in shapes),
       "ولكلِّ ضربةٍ نقطةُ بدايةٍ ظاهرة — لا ضربةَ بلا مبدأ يُرى")
    ok(html.count('class="arrow"') == sum(len(built[c][f].get("strokes") or [])
                                          for c, f in shapes),
       "ولكلِّ ضربةٍ سهمٌ على أوّل حركتها — فالجهةُ تُرى لا تُوصَف")
    parts = sum(len(built[c][f].get("strokes") or []) + len(built[c][f].get("dots") or [])
                for c, f in shapes)
    ok(html.count('class="num"') == parts,
       f"وأرقامُ الأجزاء بعدد الأجزاء ({parts}) — نقطةً كانت أو ضربة")
    # **والسهمُ يقول جهةَ الحركة لا جهةَ العيّنة** — ويُمتحَن وجهين:
    #   · **على مسارٍ مستقيمٍ معكوس**: ينقلب رأساً على عقب (امتحانٌ سالبٌ صريح).
    #   · **وعلى أشكال البيان كلِّها**: يوافق أوّلَ خطوةٍ حقيقية في الضربة — فلو
    #     رُسم من عيّنةٍ ثابتة لَخالف أوّلَ الحركة في المنحنيات.
    # **ولا يبتلع رقمُ النقطة نقطتَه** (`STROKE_ORDER §٩د`): كان قرصُ الرقم
    # (٥٢) يجلس على مركز النقطة (٣٠) فيخفيها ويلامس الجسمَ — **فيُرى التصاقٌ ليس
    # في الرسم**. والامتحانُ قياسٌ: بُعدُ القرص عن مركز النقطة يسع القرصين معاً.
    hidden = []
    for ch, form in shapes:
        ref = built[ch][form]
        zoom = float((ref.get("box") or [GRID, GRID])[1]) / GRID
        dot_r = guide("dot", 34.0) * (ref.get("tolerance") or 1.0)
        for dot in ref.get("dots") or []:
            seat = aside(ref, dot["at"], dot_r, zoom)
            # **ولا نقطةَ في الشكل يبتلعها** — لا نقطتَه وحدَها: عنقودُ الثلاث
            # يجعل رقمَ إحداهنّ على أختها، وهو التزييفُ نفسُه بوجهٍ آخر.
            for other in ref["dots"]:
                span = ((seat[0] - other["at"][0]) ** 2
                        + (seat[1] - other["at"][1]) ** 2) ** 0.5
                if span < dot_r + 52 * zoom:
                    hidden.append(f"{ch}/{form}")
    ok(not hidden, f"ولا يبتلع رقمُ النقطة نقطتَه — {parts and len(shapes)} شكلاً"
       f" وقرصُ كلِّ رقمٍ بجانب نقطته" + ("" if not hidden else " — " + "، ".join(hidden[:3])))
    # **والنقطةُ بحجمها الحقيقيّ**: نصفُ قطرها من `pen.js` × مقياس مادّتها، فما
    # يراه المالكُ في اللوح هو ما يراه الطفلُ في النموذج — ولا رقمَ يُكتب هنا.
    ok(f'r="{guide("dot", 34.0) * (built["ب"]["isolated"].get("tolerance") or 1.0):.0f}"'
       in html,
       f"ونقطةُ الحرف بحجمها الحقيقيّ من `pen.js` (GUIDE.dot {guide('dot', 34.0):.0f}"
       " × مقياس مادّتها) — لا بحجمٍ يُكتب في اللوح")

    line = [[100.0, 500.0], [300.0, 500.0], [500.0, 500.0], [700.0, 500.0]]
    a, b = head_of(line)
    ra, rb = head_of(list(reversed(line)))
    ok(b[0] > a[0] and rb[0] < ra[0],
       "وسهمُ المستقيم المعكوس ينقلب — فهو مقروءٌ من الحركة لا مرسومٌ بيد")
    astray = []
    for ch, form in shapes:
        for stroke in built[ch][form].get("strokes") or []:
            pts = stroke["points"]
            a, b = head_of(pts)
            step = (pts[1][0] - pts[0][0], pts[1][1] - pts[0][1])
            if (b[0] - a[0]) * step[0] + (b[1] - a[1]) * step[1] <= 0:
                astray.append(f"{ch}/{form}")
    ok(len(astray) <= len(shapes) * 0.05,
       f"وسهمُ الضربات يوافق أوّلَ خطوةٍ فيها إلا ما بدأ بالتفافة ({len(astray)} من"
       f" {sum(len(built[c][f].get('strokes') or []) for c, f in shapes)} ضربة)"
       + ("" if not astray else f" — وهي {'، '.join(astray)}"))
    if astray:
        # **والالتفافةُ خبرٌ لا عيب**: يدُ إنسانٍ تُدير القلمَ قبل أن تمضي، فيفترق
        # أوّلُ خطوةٍ عن جهة أوّل عُشرٍ من الضربة. **والسهمُ يقول العُشرَ لا الخطوة**
        # لأنّ الناظرَ يسأل «إلى أين يمضي؟» لا «أين اهتزّت اليدُ أوّلاً؟».
        print(f"  ○ وبدأ بالتفافةٍ قبل أن يمضي: {'، '.join(astray)}"
              " — والسهمُ على العُشر لا على الخطوة الأولى")
    # **ولا رقمَ عقدةٍ في اللوح**: أرقامُه أرقامُ أجزاءٍ، وأكبرُها عددُ أجزاء أكبر شكل
    biggest = max(len(built[c][f].get("strokes") or []) + len(built[c][f].get("dots") or [])
                  for c, f in shapes)
    numbers = [int(n) for n in re.findall(r'class="num"[^>]*>(\d+)<', html)]
    ok(numbers and max(numbers) == biggest,
       f"ولا رقمَ فيه يجاوز عددَ أجزاء أكبر شكل ({biggest}) — فليس فيه رقمُ عقدة")
    print("\n" + ("عهدُ لوح الاتجاه قائم" if not fails else f"{fails} فشل"))
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser(description="لوحُ الاتجاه — بدايةٌ وسهمٌ وأرقامُ أجزاء")
    ap.add_argument("--out", metavar="HTML", default=str(OUT))
    ap.add_argument("--shot", metavar="PNG", help="لقطةٌ واحدة معه")
    ap.add_argument("--only", metavar="حروف", help="حروفاً بأعيانها")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()

    if args.self_test:
        return self_test()

    built = paths()
    html = page(built, args.only)
    out = Path(args.out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    cells = html.count('class="cell"')
    print(f"لوحُ الاتجاه: {cells} شكلاً ⇐ {out}")
    if args.shot:
        png = Path(args.shot).resolve()
        print(f"  اللقطة: {png}" if shoot(out, png, cells) else "  تعذّرت اللقطة")
    return 0


if __name__ == "__main__":
    sys.exit(main())
