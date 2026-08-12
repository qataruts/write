#!/usr/bin/env python3
"""لوحةُ مرشّحات هوية اللون — «اُكْتُبْ»، الجلسة هـ١ (`FAMILY.md §٩`).

    python3 tools/identity_panel.py              # الأرقامُ واللقطاتُ ولوحةُ العرض
    python3 tools/identity_panel.py --numbers    # الأرقامُ وحدَها (بلا متصفّح)
    python3 tools/identity_panel.py --only indigo
    python3 tools/identity_panel.py --self-test

**ولا يكتب هذا الملفُّ لوناً في التطبيق**: مرشّحاتُه في `tools/palettes.json` تُحقن
في `:root` ساعةَ اللقطة وحدَها (`tools/identity_shots.html`)، و`app/css/app.css` لا
يُمَسّ حتى يحكم المالك بنصٍّ في `docs/REVIEW_IDENTITY.md` — **ويحرس ذلك الفحصُ
الذاتيّ**: ما دام الحكمُ منتظَراً فلوحُ التطبيق يجب أن يبقى لوحَ البذرة، ويومَ يُكتب
الحكمُ ينقلب الشرطُ فيَلزم أن يطابق اللوحُ المرشَّحَ المحكومَ له **بالحرف**. فلا
يُطبَّق لونٌ بلا حكم، ولا يُترَك حكمٌ بلا تطبيق — بلا سطرٍ يُضاف ولا انتباهٍ يُرجى.

**والأرقامُ محسوبةٌ لا مكتوبة، وأرضياتُها من اقرأ نفسِه**: أدنى ما بلغه لوحُ اقرأ في
فصل الحبر وتمايز المراحل ومفارقة ألوان الحكم هو الأرضيةُ التي يُقاس عليها المرشَّح —
فلا رقمَ عتبةٍ يُخترع هنا، والأرضيةُ تتحرّك إن تحرّك لوحُ اقرأ.
"""

import argparse
import http.server
import json
import math
import re
import shutil
import socketserver
import struct
import subprocess
import sys
import tempfile
import threading
import time
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app"
TOOLS = ROOT / "tools"
CSS = APP / "css" / "app.css"
PALETTES = TOOLS / "palettes.json"
PAGE = TOOLS / "identity_shots.html"
OUT = ROOT / "docs" / "identity"
PANEL = ROOT / "docs" / "REVIEW_IDENTITY.md"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# مقاسُ الجهاز: آيباد ١٠٫٩ طولي — من `DEVICE_SIZES` في `browser_test.py` (لا يُكتب مرّتين)
DEVICE_W, DEVICE_H = 820, 1180
GROUNDS = ["warm", "tuned"]
SHIFT = "shift"               # الأرضيةُ الدافئةُ المزاحة — مشتقّةٌ لا مكتوبة (§٣ب)
SCENES = [
    ("map", "الخريطة"),
    ("board", "لوحُ الكتابة — محاولةٌ وإرشادُها"),
    ("celebrate", "الاحتفال"),
]
# رموزُ المراحل الخمس في «اُكْتُبْ» (`DESIGN §٢`)، والمرحلتان الفاتحتان نصُّهما حبرٌ
# داكن لا أبيض — تقرؤه القاعدةُ `.station--join, .station--form { --on-accent }` في
# `app.css`، ولذلك يُقاس تباينُهما على الحبر لا على الأبيض.
STAGE_TOKENS = ["accent-quran", "accent-letters", "accent-skills", "accent-stories", "accent-garden"]
LIGHT_STAGES = {"accent-stories", "accent-garden"}
AA = 4.5


# ————— ١) حسابُ اللون: تباينُ WCAG وفرقُ CIEDE2000 —————

def hex_rgb(value: str):
    v = value.lstrip("#")
    if len(v) == 3:
        v = "".join(c * 2 for c in v)
    return tuple(int(v[i:i + 2], 16) for i in (0, 2, 4))


def _linear(channel: float) -> float:
    c = channel / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(value: str) -> float:
    r, g, b = (_linear(c) for c in hex_rgb(value))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(one: str, two: str) -> float:
    a, b = sorted((luminance(one), luminance(two)), reverse=True)
    return (a + 0.05) / (b + 0.05)


def lab(value: str):
    r, g, b = (_linear(c) for c in hex_rgb(value))
    x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    fx, fy, fz = f(x), f(y), f(z)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def lch(value: str):
    light, a, b = lab(value)
    return light, math.hypot(a, b), math.degrees(math.atan2(b, a)) % 360


def de00(one, two) -> float:
    """CIEDE2000 — يقبل لونين نصّاً أو زوجَي Lab (للفحص الذاتي بمرجع Sharma)."""
    l1, a1, b1 = one if isinstance(one, tuple) else lab(one)
    l2, a2, b2 = two if isinstance(two, tuple) else lab(two)
    c1, c2 = math.hypot(a1, b1), math.hypot(a2, b2)
    cbar = (c1 + c2) / 2
    g = 0.5 * (1 - math.sqrt(cbar ** 7 / (cbar ** 7 + 25 ** 7))) if cbar else 0.5
    a1p, a2p = (1 + g) * a1, (1 + g) * a2
    c1p, c2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h1p = math.degrees(math.atan2(b1, a1p)) % 360 if (a1p or b1) else 0.0
    h2p = math.degrees(math.atan2(b2, a2p)) % 360 if (a2p or b2) else 0.0
    dlp, dcp = l2 - l1, c2p - c1p
    if c1p * c2p == 0:
        dhp = 0.0
    elif abs(h2p - h1p) <= 180:
        dhp = h2p - h1p
    else:
        dhp = h2p - h1p - 360 if h2p - h1p > 180 else h2p - h1p + 360
    dhp = 2 * math.sqrt(c1p * c2p) * math.sin(math.radians(dhp) / 2)
    lbar, cbarp = (l1 + l2) / 2, (c1p + c2p) / 2
    if c1p * c2p == 0:
        hbar = h1p + h2p
    elif abs(h1p - h2p) <= 180:
        hbar = (h1p + h2p) / 2
    else:
        hbar = (h1p + h2p + 360) / 2 if h1p + h2p < 360 else (h1p + h2p - 360) / 2
    t = (1 - 0.17 * math.cos(math.radians(hbar - 30)) + 0.24 * math.cos(math.radians(2 * hbar))
         + 0.32 * math.cos(math.radians(3 * hbar + 6)) - 0.20 * math.cos(math.radians(4 * hbar - 63)))
    dtheta = 30 * math.exp(-(((hbar - 275) / 25) ** 2))
    rc = 2 * math.sqrt(cbarp ** 7 / (cbarp ** 7 + 25 ** 7)) if cbarp else 0.0
    sl = 1 + (0.015 * (lbar - 50) ** 2) / math.sqrt(20 + (lbar - 50) ** 2)
    sc, sh = 1 + 0.045 * cbarp, 1 + 0.015 * cbarp * t
    rt = -math.sin(math.radians(2 * dtheta)) * rc
    return math.sqrt((dlp / sl) ** 2 + (dcp / sc) ** 2 + (dhp / sh) ** 2
                     + rt * (dcp / sc) * (dhp / sh))


def mix(one: str, two: str, part: float) -> str:
    """`color-mix(in srgb, one part%, two)` — تمزج المتصفّحاتُ في sRGB مباشرةً."""
    a, b = hex_rgb(one), hex_rgb(two)
    return "#%02X%02X%02X" % tuple(round(x * part + y * (1 - part)) for x, y in zip(a, b))


def lab_hex(light: float, a: float, b: float) -> tuple:
    """عكسُ `lab()` — ويعيد معه **هل قُصَّ اللونُ إلى حدّ المجال**؟

    فالقصُّ ليس تفصيلاً: لونٌ خرج عن sRGB لا يُكتب كما أُريد له، فمن سكت عنه ادّعى
    إزاحةً لم تقع. ولذلك يُعلَن مع كل قيمةٍ مشتقّة (وتُقاس القيمةُ المكتوبة لا المرادة).
    """
    fy = (light + 16) / 116
    fx, fz = fy + a / 500, fy - b / 200
    f = lambda v: v ** 3 if v ** 3 > 0.008856 else (v - 16 / 116) / 7.787
    x, y, z = f(fx) * 0.95047, f(fy), f(fz) * 1.08883
    channels = (3.2406 * x - 1.5372 * y - 0.4986 * z,
                -0.9689 * x + 1.8758 * y + 0.0415 * z,
                0.0557 * x - 0.2040 * y + 1.0570 * z)
    clipped = any(c < -0.0005 or c > 1.0005 for c in channels)

    def enc(c):
        c = max(0.0, min(1.0, c))
        c = 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
        return round(c * 255)
    return "#%02X%02X%02X" % tuple(enc(c) for c in channels), clipped


# ————— ٢) قراءةُ الألواح: لوحُ التطبيق ولوحا الأخوين —————

def root_tokens(text: str) -> dict:
    """رموزُ اللون في كتلة `:root` الأولى (الوضعُ الفاتح) — قيمُها ألوانٌ نصّية."""
    block = re.search(r":root\s*\{(.*?)\n\}", text, re.S)
    if not block:
        return {}
    return dict(re.findall(r"--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{3,8})\s*;", block.group(1)))


def model_opacity(text: str) -> float:
    """شفافيةُ النموذج على اللوح — **تُقرأ من `app.css` نفسِه** لا تُكتب هنا.

    فالمقيسُ «فصلُ حبر الطفل عن النموذج» يجب أن يقابل ما تراه العينُ حقّاً: النموذجُ
    يُرسم بالحبر عند `.pen-stroke { opacity }`، فلونُه على البطاقة مزيجٌ لا الحبرُ
    كاملاً. ويومَ تُشدّ الشفافيةُ أو تُرخى يتحرّك الرقمُ معها بلا سطرٍ يُعدَّل.
    """
    found = re.search(r"\.pen-stroke\s*\{[^}]*?opacity:\s*([\d.]+)", text, re.S)
    return float(found.group(1)) if found else 0.18


def sibling_palettes(data: dict) -> dict:
    """لوحُ اقرأ يُقرأ حيّاً من مجلده، ولوحُ احسب من التزامٍ مسمّى — ويُقابَل بالمقيَّد.

    وإن غاب مستودعُ احسب عن هذا الجهاز فالقيمُ المقيَّدة في `palettes.json` هي
    المعتمدة، **ويُعلَن أنها مقيَّدةٌ لا مقروءة** — لا يُبنى رقمٌ على مصدرٍ لم يُفتح.
    """
    out = {}
    read_css = (ROOT.parent / "read" / "app" / "css" / "app.css")
    if read_css.exists():
        out["read"] = {"tokens": root_tokens(read_css.read_text(encoding="utf-8")), "live": True}

    calc = data["family"]["calc"]
    recorded = calc["recorded"]
    calc_repo = ROOT.parent / "calc"
    live = None
    if (calc_repo / ".git").exists():
        got = subprocess.run(["git", "-C", str(calc_repo), "show", f"{calc['commit']}:app/css/app.css"],
                             capture_output=True, text=True)
        if got.returncode == 0:
            live = root_tokens(got.stdout)
    out["calc"] = {"tokens": live or recorded, "live": bool(live),
                   "commit": calc["commit"],
                   "matches": None if live is None else all(
                       live.get(k) == v for k, v in recorded.items())}
    return out


# ————— ٣) الأرقام: أرضياتٌ من اقرأ، ثم قياسُ كل مرشَّح عليها —————

def model_color(palette: dict, opacity: float) -> str:
    """لونُ النموذج **كما يُرى**: حبرٌ بشفافيته على البطاقة (لا الحبرُ كاملاً)."""
    return mix(palette["ink"], palette["card"], opacity)


def floors(read_tokens: dict, opacity: float) -> dict:
    """أرضياتُ العائلة — أدنى ما بلغه لوحُ اقرأ نفسُه، محسوبةً لا مكتوبة."""
    accents = [read_tokens[t] for t in STAGE_TOKENS if t in read_tokens]
    func = [read_tokens[t] for t in ("ok", "err", "star") if t in read_tokens]
    ink = read_tokens["ink"]
    model = model_color(read_tokens, opacity)
    return {
        "ink_sep": min(de00(a, model) for a in accents),
        "pairwise": min(de00(a, b) for i, a in enumerate(accents) for b in accents[i + 1:]),
        "functional": min(de00(a, f) for a in accents for f in func),
        "chroma": max(lch(a)[1] for a in accents),
    }


# ————— ٣ب) الأرضيةُ الدافئةُ المزاحة — تُشتقّ بقياسٍ معلَن لا بذوق —————
#
# حكمُ المالك (١٢ أغسطس ٢٠٢٦): الغالبُ نِيليّ، **والأرضيةُ دافئةٌ مزاحة** — تبقى دافئةً
# بالعين وتقيس مخالفةً لورق اقرأ (قيدُ ميثاق الهوية `FAMILY §٩`). وهذه ثلاثةُ مطالبَ في
# عبارة، فتُترجَم ثلاثةَ أرقامٍ لا ثلاثةَ أذواق:
#
#   ١) **«مزاحة»** كم؟ — لا عتبةَ تُخترع: أبعدُ ما في العائلة من سابقةٍ أنّ **احسب** اختار
#      ورقاً لنفسه، فبُعدُ ورقه عن ورق اقرأ هو **خطوةُ أخٍ** — وهي الأرضية. فمن بلغها
#      فقد خالف بمقدارِ ما خالف به أخٌ فعلاً، لا بمقدارِ ما استحسنّا.
#   ٢) **«دافئة»** كيف؟ — الإزاحةُ **في الدفء لا منه**: يُضرب إشباعُ لوح اقرأ في معاملٍ
#      واحد **والإضاءةُ والصبغةُ لا تُمَسّان**. فالورقُ يزداد كِرَميّةً ولا يبرد، وصبغتُه
#      صبغةُ العائلة بعينها.
#   ٣) **وكم بالضبط؟** — **أصغرُ معاملٍ يبلغ خطوةَ الأخ**: لا تُنفَق مخالفةٌ أكثرُ مما
#      يطلبه الميثاق. والمقياسُ على **القيمة الثمانيّة التي تُكتب في اللوح فعلاً** لا على
#      المتّصل الرياضيّ — فما لا يُكتب لا يُقاس.
#
# **وربحٌ يلزم عن (٢) بالبرهان لا بالتجربة**: تباينُ WCAG دالّةُ الإضاءة وحدَها، و`L*`
# دالّةُ الإضاءة النسبية وحدَها — فما دامت `L*` لم تُمَسّ فكلُّ تباينٍ في لوح اقرأ
# **محفوظٌ بعينه**. لا يُشترى الدفءُ بحرفٍ يخفت على طفل.
#
# **والاتجاهُ نفسُه يُبرهَن بالرقم**: للمعامل جهتان — فوق الواحد (أدفأ) ودونه (أبرد).
# والجهةُ الباردة تبلغ خطوةَ اقرأ ثم **تجلس في حِجر احسب** (الرقمُ في اللوحة)، فتخالف
# أخاً وتزاحم أخاً. فسقطت بالقياس لا بالذوق.

SHIFT_GRID = 0.0005          # دقّةُ مسح المعامل
SHIFT_SPAN = 4000            # ومداه — والمسحُ يقف عند أوّل قيمةٍ تبلغ الخطوة


def scale_chroma(value: str, k: float) -> tuple:
    """اللونُ نفسُه إضاءةً وصبغةً، وإشباعُه مضروبٌ في `k`."""
    light, a, b = lab(value)
    return lab_hex(light, a * k, b * k)


def shift_search(paper: str, step: float, sign: int) -> tuple:
    """أصغرُ معاملٍ (في جهةٍ) يبلغ به الورقُ **المكتوبُ** خطوةَ الأخ — ومعه ما دونه.

    وردُّ «ما دونه» ليس زينة: به يُثبَت أنّ المعامل **أصغرُ ما يجوز** لا رقماً مختاراً —
    فالفحصُ الذاتيّ يشهد أنّ آخرَ قيمةٍ قبله تنزل عن الخطوة.
    """
    below = (1.0, paper, 0.0)
    for i in range(1, SHIFT_SPAN + 1):
        k = 1 + sign * i * SHIFT_GRID
        value, _ = scale_chroma(paper, k)
        gap = de00(value, paper)
        if gap >= step:
            return k, value, gap, below
        if value != below[1]:
            below = (k, value, gap)
    return None, None, None, below


def derive_shift(read_tokens: dict, calc_tokens: dict, names: list) -> dict:
    """الأرضيةُ المزاحة كاملةً — قيمُها مشتقّةٌ هنا، ولا تُكتب في `palettes.json` ألبتّة."""
    paper = read_tokens["paper"]
    step = de00(paper, calc_tokens["paper"])
    k, value, gap, below = shift_search(paper, step, +1)
    if k is None:
        raise SystemExit("لم يبلغ المسحُ خطوةَ الأخ — راجع مدى المعامل")

    ground, clipped = {}, []
    for name in names:
        got, clip = scale_chroma(read_tokens[name], k)
        ground[name] = got
        if clip:
            clipped.append(name)

    cool_k, cool_paper, cool_gap, _ = shift_search(paper, step, -1)
    return {
        "k": k, "step": step, "ground": ground, "clipped": clipped, "below": below,
        "paper": value, "paper_read": gap, "paper_calc": de00(value, calc_tokens["paper"]),
        "read_calc": step,
        "cool": None if cool_k is None else {
            "k": cool_k, "paper": cool_paper, "paper_read": cool_gap,
            "paper_calc": de00(cool_paper, calc_tokens["paper"]),
        },
        "reach": {name: lch(ground[name])[1] / lch(read_tokens[name])[1] if lch(read_tokens[name])[1] else 1.0
                  for name in names},
    }


def read_night(text: str) -> dict:
    """كتلةُ اقرأ الليلية — تُقرأ من ملفّه لا تُكتب هنا (نظيرُ `root_tokens` للنهار)."""
    block = re.search(r"@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{(.*?)\n  \}",
                      text, re.S)
    if not block:
        return {}
    return dict(re.findall(r"--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{3,8})\s*;", block.group(1)))


# **ليلُ الهوية إسقاطٌ لا اختيار.** حكمُ المالك وقع على لوح النهار، والليلُ وجهُ اللوح
# نفسِه بعد غروب الشمس — فلا يُختار له لونٌ بذوقٍ لم يُعرَض، ولا يُترَك وجهَ أخيه.
# فيُشتقّ بقاعدتين منشورتين، كلتاهما رقمٌ يُقرأ من اقرأ نفسِه:
#
#   ١) **الأرضية**: ليلُ اقرأ مضروبٌ إشباعُه في **معامل الإزاحة نفسِه** (`k`) الذي أزيح
#      به نهارُنا — فالإزاحةُ واحدةٌ في الوجهين، والإضاءةُ لا تُمَسّ فيبقى كلُّ تباينٍ
#      في ليل اقرأ محفوظاً بعينه (البرهانُ عينُ برهان §٣ب).
#   ٢) **المراحل**: لكلِّ مرحلةٍ **رفعةُ اقرأ لها بعينها** — فرقُ إضاءتها بين نهاره
#      وليله، ونسبةُ إشباعها — تُجرى على مرحلتنا بصبغتها هي. ثم تُرفَع السلَّمُ كلُّها
#      **أصغرَ رفعةٍ تبلغ AA** على ورقنا الليليّ: فلوحُنا أدكنُ من لوحه نهاراً (نِيليٌّ
#      مقابلَ أخضرَ مزرقّ)، فرفعتُه وحدَها لا تكفي أدكنَ مراحلنا.
#
# **ولا تُمَسّ ألوانُ الحكم في الليل كما لم تُمَسّ في النهار**: `--star` و`--ok` و`--err`
# ومشتقّاتُها تبقى قيمَ البذرة الليلية بأعيانها.
NIGHT_LIFT_GRID = 0.5        # دقّةُ مسح الرفعة (في وحدات `L*`)


def derive_night(read_light: dict, read_dark: dict, tokens: dict, shift_ground: dict,
                 k: float, names: list) -> dict:
    """لوحُ الليل كاملاً — أرضيةً ومراحلَ — مشتقّاً بالقاعدتين أعلاه."""
    ground = {}
    clipped = []
    for name in shift_ground:
        got, clip = scale_chroma(read_dark[name], k)
        ground[name] = got
        if clip:
            clipped.append(name)

    plan = {}
    for name in names:
        light_l, light_c, hue = lch(tokens[name])
        was_l, was_c, _ = lch(read_light[name])
        now_l, now_c, _ = lch(read_dark[name])
        ratio = now_c / was_c if was_c else 1.0
        plan[name] = (light_l + (now_l - was_l), light_c * ratio, hue)

    def paint(lift: float) -> dict:
        out = {}
        for name, (light, chroma, hue) in plan.items():
            value, _ = lab_hex(min(97.0, light + lift),
                               chroma * math.cos(math.radians(hue)),
                               chroma * math.sin(math.radians(hue)))
            out[name] = value
        return out

    lift = 0.0
    while lift <= 40:
        accents = paint(lift)
        if min(contrast(v, ground["paper"]) for v in accents.values()) >= AA:
            break
        lift += NIGHT_LIFT_GRID
    else:
        raise SystemExit("لم تبلغ رفعةُ الليل AA — راجع القاعدة")
    below = paint(max(0.0, lift - NIGHT_LIFT_GRID))
    return {
        "ground": ground, "accents": accents, "lift": lift, "clipped": clipped,
        "below": (max(0.0, lift - NIGHT_LIFT_GRID),
                  min(contrast(v, ground["paper"]) for v in below.values())),
        "worst": min(contrast(v, ground["paper"]) for v in accents.values()),
    }


def shift_for(data: dict) -> str:
    """أيُّ مرشَّحٍ يلبس الأرضيةَ المزاحة — من البيان لا من الشيفرة."""
    return data.get("shift", {}).get("for", "")


def grounds_of(data: dict, candidate: str) -> list:
    """أرضياتُ مرشَّحٍ بعينه: الدافئةُ والمعدَّلة للجميع، والمزاحةُ لمن حُكم له."""
    return GROUNDS + ([SHIFT] if candidate == shift_for(data) else [])


def candidate_palette(base_tokens: dict, cand: dict, ground: str, shift: dict = None) -> dict:
    """لوحُ المرشَّح كاملاً كما سيراه المتصفّح: **لوحُ البذرة** ثم ما يبدّله المرشَّح.

    **والقاعدةُ لوحُ اقرأ لا لوحُ التطبيق** — وهذا فرقٌ ظهر يومَ صُبغ اللوح: «الأرضيةُ
    الدافئة كما هي» تعني أرضيةَ العائلة، فلو حُسبت من لوحنا بعد الصبغ لصار عمودُ
    «الدافئة» يعرض أرضيتَنا المزاحة ويسمّيها دافئةَ العائلة — فتكذب اللوحةُ على قارئها
    بعد أن صدقت قبل الحكم.
    """
    palette = dict(base_tokens)
    palette.update(cand["tokens"])
    if ground == "tuned":
        palette.update(cand["ground"])
    elif ground == SHIFT:
        palette.update(shift["ground"])
    return palette


def seed_tokens(app_tokens: dict, siblings: dict) -> dict:
    """لوحُ البذرة الذي تُقاس عليه المرشّحات: لوحُ اقرأ إن كان مجلدُه متاحاً.

    فما بقي من لوحنا بعد الصبغ ليس أرضيةَ العائلة — وقياسُ مرشَّحٍ على أرضيتنا نحن
    يقيس مرشَّحاً على نفسِه.
    """
    return dict(siblings["read"]["tokens"]) if "read" in siblings else dict(app_tokens)


def measure(palette: dict, siblings: dict, base: dict, opacity: float) -> dict:
    """كلُّ ما يُقاس على لوحٍ واحد — تباينٌ، وفصلُ حبر، وتمايزٌ عن الأخوين وعن الحكم."""
    ink, paper, card = palette["ink"], palette["paper"], palette["card"]
    model = model_color(palette, opacity)
    sibling_tokens = {}
    for app, info in siblings.items():
        for name, value in info["tokens"].items():
            if name.startswith("accent-") or name in ("star", "brand-1", "brand-2", "brand-3"):
                sibling_tokens[f"{app}.{name}"] = value
    func = {name: palette[name] for name in ("ok", "err", "star")}

    stages = {}
    for token in STAGE_TOKENS:
        value = palette[token]
        on = ink if token in LIGHT_STAGES else palette.get("on-accent", "#fff")
        near = min(sibling_tokens.items(), key=lambda kv: de00(value, kv[1]))
        near_f = min(func.items(), key=lambda kv: de00(value, kv[1]))
        stages[token] = {
            "value": value,
            "lch": lch(value),
            "on": on,
            "contrast_on": contrast(value, on),
            "contrast_text": contrast(mix(value, ink, 0.78), card),   # `.lit` وأخواتها
            "ink_sep": de00(value, model),
            "sibling": (near[0], de00(value, near[1])),
            "functional": (near_f[0], de00(value, near_f[1])),
        }
    values = [s["value"] for s in stages.values()]
    return {
        "stages": stages,
        "model": model,
        "pairwise": min(de00(a, b) for i, a in enumerate(values) for b in values[i + 1:]),
        "ink_paper": contrast(ink, paper),
        "soft_paper": contrast(palette["ink-soft"], paper),
        "ink_card": contrast(ink, card),
        "locked_paper": contrast(palette["locked"], paper),
        "paper_read": de00(paper, base["read"]["tokens"]["paper"]),
        "paper_calc": de00(paper, base["calc"]["tokens"]["paper"]),
    }


def build_report(data: dict, app_tokens: dict, siblings: dict, floor: dict,
                 opacity: float, shift: dict, cands: list) -> dict:
    """كلُّ مرشَّحٍ على كل أرضيةٍ يلبسها — حسابٌ خالص بلا متصفّح (تستعمله اللوحةُ وفحصُها)."""
    report = {}
    for cand in cands:
        report[cand["id"]] = {}
        for ground in grounds_of(data, cand["id"]):
            palette = candidate_palette(seed_tokens(app_tokens, siblings), cand, ground, shift)
            m = measure(palette, siblings, siblings, opacity)
            m["palette"] = palette
            m["complaints"] = complaints(m, floor)
            report[cand["id"]][ground] = m
    return report


def complaints(m: dict, floor: dict) -> list:
    """ما نزل عن أرضيةِ اقرأ أو عن AA — بحرفه، فلا يُقرأ رقمٌ ضعيف مدحاً."""
    out = []
    for token, s in m["stages"].items():
        if s["contrast_on"] < AA:
            out.append(f"`{token}`: نصُّه فوقه {s['contrast_on']:.2f}:١ دون AA")
        if s["ink_sep"] < floor["ink_sep"]:
            out.append(f"`{token}`: فصلُ حبر الطفل عن النموذج المرسوم {s['ink_sep']:.1f} دون أرضية اقرأ {floor['ink_sep']:.1f}")
        if s["functional"][1] < floor["functional"]:
            out.append(f"`{token}`: يقارب {s['functional'][0]} بـ{s['functional'][1]:.1f} دون أرضية اقرأ {floor['functional']:.1f}")
        if s["lch"][1] > floor["chroma"]:
            out.append(f"`{token}`: إشباعٌ {s['lch'][1]:.0f} فوق أقصى اقرأ {floor['chroma']:.0f}")
    if m["pairwise"] < floor["pairwise"]:
        out.append(f"تمايزُ المراحل بعضِها عن بعض {m['pairwise']:.1f} دون أرضية اقرأ {floor['pairwise']:.1f}")
    if m["ink_paper"] < 7:
        out.append(f"الحبرُ على الورق {m['ink_paper']:.2f}:١ دون AAA")
    if m["soft_paper"] < AA:
        out.append(f"النصُّ الثانوي على الورق {m['soft_paper']:.2f}:١ دون AA")
    return out


# ————— ٤) اللقطات: التطبيقُ نفسُه في متصفّحٍ حقيقي —————

def png_size(path: Path):
    data = path.read_bytes()[:24]
    if len(data) < 24 or data[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    return struct.unpack(">II", data[16:24])


HOLD_PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d4948445200000001000000010806000000"
    "1f15c4890000000d49444154789c6360000002000100ffff0300000600"
    "0557bfabd40000000049454e44ae426082")


def served_palettes(data: dict, shift: dict, seed: dict) -> bytes:
    """بيانُ المرشّحات كما يُقدَّم للصفحة — **ومعه الأرضيةُ المزاحة مشتقّةً**.

    فالقيمُ لا تُكتب في `palettes.json` (نصُّ البيان نفسِه)، والصفحةُ لا تعرف حساب
    لونٍ — فيُحقن المشتقُّ في الجواب وحدَه. وهو عينُ عهد «أرقامٌ محسوبة لا مكتوبة»:
    ما تراه اللقطةُ خارجٌ من الاشتقاق ساعتَها، لا من رقمٍ نام في ملفّ.
    """
    served = json.loads(json.dumps(data))
    served["shift"] = {**data["shift"], "ground": shift["ground"], "k": shift["k"]}
    # **وقاعدةُ البذرة تُخدَم معها**: الصفحةُ تحقن المرشَّحَ فوق لوحٍ مصبوغٍ اليوم،
    # فلولا حقنُ أرضية العائلة تحتَه لظهر عمودُ «الدافئة» بأرضيتنا نحن.
    served["seed"] = {name: value for name, value in seed.items()
                      if name.startswith("accent-") or name in
                      ("paper", "paper-deep", "card", "ink", "ink-soft", "line", "locked",
                       "brand-1", "brand-2", "brand-3")}
    return json.dumps(served, ensure_ascii=False).encode("utf-8")


def make_server(port: int, state: dict, palettes: bytes):
    """خادمُ `app/` ومعه صفحةُ اللقطات وبيانُ المرشّحات — **وبابُ الحبس**.

    و«بابُ الحبس» (`/__hold`) هو ما يجعل لقطةً بمشهدٍ مسوقٍ ممكنة أصلاً: كروم بلا
    واجهةٍ يلتقط عند اكتمال تحميل الصفحة، والمشهدُ يُبنى بعد التحميل بأحداث إصبع.
    فتُعلَّق صورةٌ واحدة في الصفحة لا تُجاب حتى تنادي الصفحةُ `/__ready` — فيتأخّر
    اكتمالُ التحميل إلى ما بعد اكتمال المشهد، وتقع اللقطةُ على ما أُريد لها.
    """

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(APP), **kw)

        def _send(self, body: bytes, kind: str):
            self.send_response(200)
            self.send_header("Content-Type", kind)
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            path, _, query = self.path.partition("?")
            if path == "/__identity.html":
                return self._send(PAGE.read_bytes(), "text/html; charset=utf-8")
            if path == "/__palettes.json":
                return self._send(palettes, "application/json; charset=utf-8")
            if path == "/__ready":
                if "fail=1" in query:
                    state["failed"] = True
                state["ready"].set()
                return self._send(b"", "text/plain")
            if path == "/__hold":
                state["ready"].wait(timeout=state["timeout"])
                time.sleep(0.25)          # لحظةُ استقرارٍ للرسم بعد آخر تبديل
                return self._send(HOLD_PNG, "image/png")
            return super().do_GET()

        def log_message(self, *a):
            pass

    socketserver.ThreadingTCPServer.allow_reuse_address = True
    return socketserver.ThreadingTCPServer(("127.0.0.1", port), Handler)


def run_chrome(url: str, profile: Path, shot: Path):
    if not Path(CHROME).exists():
        sys.exit(f"لم يُعثر على Chrome في {CHROME}")
    cmd = [CHROME, f"--user-data-dir={profile}", "--no-first-run", "--no-default-browser-check",
           "--headless=new", "--disable-gpu", "--hide-scrollbars",
           # **حركةٌ مخفَّضة**: ومضةُ الإرشاد عندنا حركةٌ في CSS، فلقطةٌ في وسطها تختلف
           # من مرشّحٍ إلى مرشّح بلا سبب. وهذه حالُ طفلٍ يطلب جهازُه تخفيفَ الحركة —
           # ولها في `app.css` قاعدتُها المكتوبة، فاللقطةُ تصوّر حالاً موجودة لا مصنوعة.
           "--force-prefers-reduced-motion",
           f"--screenshot={shot}", f"--window-size={DEVICE_W},{DEVICE_H}", url]
    return subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def png_bytes(path: Path) -> bytes:
    """بايتاتُ الصورة مفكوكةَ الضغط (بلا فكّ مرشّحات الصفوف) — للمقابلة لا للرسم."""
    data = path.read_bytes()
    idat, i = b"", 8
    while i < len(data):
        length = struct.unpack(">I", data[i:i + 4])[0]
        if data[i + 4:i + 8] == b"IDAT":
            idat += data[i + 8:i + 8 + length]
        i += 12 + length
    return zlib.decompress(idat)


def shots_match(one: Path, two: Path) -> float:
    """نسبةُ ما اختلف بين لقطتين — صفرٌ إن تطابقتا بايتاً."""
    a, b = png_bytes(one), png_bytes(two)
    if a == b:
        return 0.0
    if len(a) != len(b):
        return 1.0
    return sum(1 for x, y in zip(a, b) if x != y) / len(a)


def shot_name(candidate: str, ground: str, scene: str) -> str:
    return f"{candidate}-{ground}-{scene}.png"


def capture(base: str, profile: Path, state: dict, candidate: str, ground: str,
            scene: str, timeout: int) -> tuple:
    """لقطةٌ واحدة — و**بملفِّ متصفّحٍ جديد لكلٍّ**، وهذا شرطٌ لا زينة.

    أمسكته اللقطاتُ نفسُها: بملفٍّ مُعاد، يتولّى **عاملُ الخدمة** المسجَّلُ من اللقطة
    السابقة (مجالُه `/`) خدمةَ صفحةِ السَّوق ذاتِها، فيردّ عليها قشرةَ التطبيق —
    فصوّرنا خريطةً فارغة ونحن نظنّنا نصوّر لوحاً مكتوباً عليه. والصورةُ خرجت
    «ناجحة» لأن الصفحةَ التي تحرس المشهدَ لم تُشغَّل أصلاً.
    """
    out = OUT / shot_name(candidate, ground, scene)
    out.unlink(missing_ok=True)
    state["ready"] = threading.Event()
    state["failed"] = False
    state["timeout"] = timeout
    url = f"{base}/__identity.html?candidate={candidate}&ground={ground}&scene={scene}"
    proc = run_chrome(url, profile, out)
    deadline = time.time() + timeout
    while time.time() < deadline and not out.exists():
        time.sleep(0.3)
    proc.kill()
    if state["failed"]:
        return out, "أخفق المشهدُ في الصفحة"
    if not out.exists():
        return out, "لم تُكتب اللقطة"
    # **ولا تُقبَل لقطةٌ لم تُعلن الصفحةُ اكتمالَ مشهدها**: بابُ الحبس يُفتَح بالمهلة
    # أيضاً كي لا يتعلّق العدّاء، فلولا هذا الشرطُ لمرّت صورةٌ لا مشهدَ فيها ناجحةً.
    if not state["ready"].is_set():
        return out, "لم تُعلن الصفحةُ اكتمالَ المشهد (خرجت اللقطةُ بالمهلة)"
    size = png_size(out)
    if size != (DEVICE_W, DEVICE_H):
        return out, f"مقاسٌ غريب {size}"
    return out, None


def capture_all(cands: list, port: int, timeout: int, data: dict, shift: dict, seed: dict) -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    state = {"ready": threading.Event(), "failed": False, "timeout": timeout}
    server = make_server(port, state, served_palettes(data, shift, seed))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{port}"
    fails = 0
    try:
        jobs = [("now", "warm")] + [(c["id"], g) for c in cands for g in grounds_of(data, c["id"])]
        for candidate, ground in jobs:
            for scene, title in SCENES:
                profile = Path(tempfile.mkdtemp(prefix="uktub-identity-"))
                try:
                    out, err = capture(base, profile, state, candidate, ground, scene, timeout)
                finally:
                    shutil.rmtree(profile, ignore_errors=True)
                if err:
                    fails += 1
                    print(f"  ✗ {out.name} — {err}")
                else:
                    print(f"  ✓ {out.name} — {title}")
    finally:
        server.shutdown()
    return fails


# ————— ٥) لوحةُ العرض على المالك —————

VERDICT_LINE = re.compile(r"^\*\*الحكم\*\*:\s*(.+?)\s*$", re.M)
WAITING = "(منتظَر)"

# **بابُ المالك يُحفَظ كلُّه لا سطرُه وحدَه.** أوّلُ صياغةٍ حفظت سطرَ الحكم فقط، ثم كتب
# المديرُ رفعَه للمالك في الباب نفسِه — **فكانت إعادةُ التوليد تمحوه صامتةً**. فصار
# المحفوظُ ما بين العلامتين: يقرؤه المولّدُ ويعيد كتابتَه كما هو.
KEPT_OPEN = "<!-- ⇩ يُحفَظ عند إعادة التوليد: بابُ المالك — حكمُه وما يُرفَع إليه ⇩ -->"
KEPT_SHUT = "<!-- ⇧ ينتهي المحفوظ ⇧ -->"
KEPT_BLOCK = re.compile(re.escape(KEPT_OPEN) + r"\n(.*?)\n" + re.escape(KEPT_SHUT), re.S)
# ولوحةٌ سابقةٌ بلا علامتين تُلتقط بمرساتَي بابها، فلا يضيع ما كُتب قبل أن تُوضَع.
KEPT_FIRST = re.compile(r"^والمعرّفاتُ:[^\n]*\n\n(.*?)\n\n> وما دام", re.M | re.S)


def read_kept() -> str:
    """ما كتبته يدٌ في باب المالك — حكمُه، وما رُفع إليه فيه."""
    if not PANEL.exists():
        return f"**الحكم**: {WAITING}"
    text = PANEL.read_text(encoding="utf-8")
    found = KEPT_BLOCK.search(text) or KEPT_FIRST.search(text)
    return found.group(1).strip() if found else f"**الحكم**: {WAITING}"


def read_verdict() -> str:
    """حكمُ المالك إن كُتب — ويُحفَظ عند إعادة توليد اللوحة فلا يمحوه مولّدُها."""
    found = VERDICT_LINE.search(read_kept())
    return found.group(1).strip() if found else WAITING


def parse_verdict(text: str):
    """«mulberry / tuned» ⇐ (المرشَّح، الأرضية)، و`None` ما دام منتظَراً."""
    if not text or text.startswith("("):
        return None
    parts = [p.strip() for p in text.replace("·", "/").split("/")]
    return (parts[0], parts[1] if len(parts) > 1 else "warm")


AR_DIGITS = str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩")


def arnum(n) -> str:
    return str(n).translate(AR_DIGITS)


def free_space_scan(siblings: dict, palette: dict, opacity: float) -> list:
    """**مسحُ الحيّز اللونيّ**: لكلّ نطاقِ صبغةٍ — ما أقصى ما يستطيع لونٌ صالحٌ فيه أن
    يبتعد عن كل لونٍ يحمل معنىً اليوم؟

    فالدعوى «الحيّزُ الحرّ ضيّق» تُثبَت بالمسح لا بالذوق. والمزاحِمُ ثلاثةُ أصناف،
    ولا يُترَك صنفٌ منها وإلا كذب المسح:
      · **ألوانُ الأخوين** — لا يتشارك تطبيقان لوناً غالباً (`FAMILY §٩`).
      · **ألوانُ الحكم عندنا** (صواب/خطأ/إرشاد) — لونُ مرحلةٍ يلتبس بها يكذب على الطفل.
      · **الحبرُ والورقُ والمقفل** — ولولا هذا لأفتى المسحُ بأنّ صبغةَ الحبر نفسِها
        «حيّزٌ حرّ»: بعيدةٌ عن الأخوين، قريبةٌ من كل حرفٍ مكتوب.
    وشرطُ الصلاحية: تباينٌ على الأبيض ≥ AA، وفصلٌ عن النموذج المرسوم فوق أرضية اقرأ.
    """
    model = mix(palette["ink"], palette["card"], opacity)
    taken = [v for info in siblings.values() for name, v in info["tokens"].items()
             if name.startswith("accent-") or name in ("star", "brand-1", "brand-3")]
    taken += [palette[name] for name in ("ok", "err", "star", "ink", "ink-soft", "locked")]
    out = []
    for hue in range(0, 360, 15):
        best = 0.0
        for light in (32, 40, 48):
            for chroma in (24, 32, 40):
                value = lch_hex(light, chroma, hue)
                if contrast(value, "#fff") < AA or de00(value, model) < 27:
                    continue
                best = max(best, min(de00(value, s) for s in taken))
        out.append((hue, best))
    return out


def lch_hex(light: float, chroma: float, hue: float) -> str:
    """لونٌ من (إضاءة، إشباع، صبغة) في CIELAB — للمسح وحدَه، لا يدخل لوحاً."""
    return lab_hex(light, chroma * math.cos(math.radians(hue)),
                   chroma * math.sin(math.radians(hue)))[0]


def swatch(value: str) -> str:
    return f'<code>{value}</code>'


def panel_text(data: dict, app_tokens: dict, siblings: dict, floor: dict, report: dict,
               opacity: float, shift: dict) -> str:
    read_tokens = siblings["read"]["tokens"]
    calc_tokens = siblings["calc"]["tokens"]
    lines = []
    add = lines.append

    add("# لوحةُ هوية اللون — «اُكْتُبْ» (الجلسة هـ١)")
    add("")
    add("> ⚠ **ملفٌّ مولَّد** — لا يُحرَّر بيد إلا **سطرُ الحكم** في آخره (يحفظه المولّد):")
    add(">")
    add(">     python3 tools/identity_panel.py")
    add(">")
    add("> والأصلُ عهدُ `FAMILY.md §٩` («إخوةٌ لا توائم»): الهويةُ قرارُ مالكٍ يُعرَض")
    add("> بمرشَّحاتٍ **مصيَّرة** لا يُختار وصفاً بلا عين. وألوانُ «اُكْتُبْ» اليومَ ألوانُ")
    add("> اقرأ نيابةً — معلَنةٌ مؤقتةً منذ الجلسة ٠.")
    add("")

    add("## ١. ما يُحكَم فيه، وما لا يُمَسّ")
    add("")
    add("**يُحكَم فيه**: ألوانُ المراحل الخمس · ألوانُ العلامة (والأيقونةُ تُعاد بها) ·")
    add("**والأرضيةُ الدافئة بحالتيها**: باقيةً كما ورثتها العائلة، أو معدَّلةً لتشدّ الهوية.")
    add("")
    add("**ولا يُمَسّ** — ألوانُ الحكم الوظيفية، لكلٍّ دلالةٌ تعلّمها الطفل:")
    add("")
    add("| الرمز | القيمة | دلالتُه | أين يُرى |")
    add("|---|---|---|---|")
    add(f"| `--ok` | {swatch(app_tokens['ok'])} | صواب | حدُّ البطاقة المستوفاة |")
    add(f"| `--err` | {swatch(app_tokens['err'])} | خطأ | ولا يدخل لوحَ الكتابة ألبتّة |")
    add(f"| `--star` | {swatch(app_tokens['star'])} | **الإرشادُ والنجومُ والفعلُ الرئيس** | نقطةُ البداية وسهمُ الاتجاه |")
    add("")
    add("و**اكتشافٌ يخصّ هذا التطبيق وحدَه**: `--star` عندنا ليس زينةً — `.pen-start` و`.pen-arrow`")
    add("(لسانُ الإرشاد كلُّه في `METHOD §٣.٤`) يقرآنه. فتحريكُه تحريكٌ للإرشاد، ولذلك بقي")
    add("ذهبياً في المرشّحات الثلاثة كلِّها (وهو **بابٌ مفتوح** — انظر §٥).")
    add("")

    add("## ٢. لماذا هذه الثلاثةُ بعينها — الحيّزُ الحرّ محسوباً")
    add("")
    add("لوحُ الأخوين مقروءٌ من مستودعيهما: اقرأ حيّاً من `read/`، واحسب من التزامه")
    add(f"`{siblings['calc']['commit']}`"
        + (" (قُرئ من المستودع وطابق المقيَّد)" if siblings["calc"]["matches"]
           else " (المقيَّدُ في `palettes.json` — المستودعُ غيرُ متاح هنا)") + ".")
    add("")
    add("| التطبيق | لونُه الغالب | الورق | النجمة |")
    add("|---|---|---|---|")
    add(f"| اقرأ | {swatch(read_tokens['accent-letters'])} أخضرُ مزرقّ | {swatch(read_tokens['paper'])} | {swatch(read_tokens['star'])} |")
    add(f"| احسب | {swatch(calc_tokens['accent-quantity'])} أزرقُ هادئ | {swatch(calc_tokens['paper'])} | {swatch(calc_tokens['star'])} |")
    add(f"| **اكتب اليوم** | {swatch(app_tokens['accent-letters'])} **لونُ اقرأ نفسُه** | {swatch(app_tokens['paper'])} | {swatch(app_tokens['star'])} |")
    add("")
    add("وأرضياتُ القبول **ليست عتباتٍ تُخترع**، بل أدنى ما بلغه لوحُ اقرأ نفسُه:")
    add("")
    add(f"- **فصلُ حبر الطفل عن النموذج المرسوم** (ΔE₀₀ بين لون المرحلة والنموذجِ بشفافيته"
        f" `{opacity:g}` كما تقرؤها الأداةُ من `app.css`): أرضيتُه **{floor['ink_sep']:.1f}**")
    add(f"- **تمايزُ المراحل بعضِها عن بعض**: أرضيتُه **{floor['pairwise']:.1f}**")
    add(f"- **مفارقةُ ألوان الحكم** (صواب/خطأ/إرشاد): أرضيتُه **{floor['functional']:.1f}**")
    add(f"- **أقصى إشباع**: **{floor['chroma']:.0f}** — «ممنوع أيُّ لونٍ مشبع صارخ» (`DESIGN §٢`) رقماً لا وصفاً")
    add("")
    add("**ومسحُ الحيّز**: جُرِّب في كل نطاقِ صبغةٍ ما يصلح لوناً غالباً (تباينُه على")
    add("الأبيض ≥ AA وفصلُه عن النموذج فوق الأرضية)، وأُخذ أبعدُ ما فيه عن ألوان اقرأ")
    add("واحسب. فالنطاقاتُ المسكونة تُعرَف بالرقم لا بالذوق:")
    add("")
    scan = free_space_scan(siblings, app_tokens, opacity)
    widest = max(d for _, d in scan)
    add("| نطاقُ الصبغة (Lab°) | أبعدُ ما يبلغه عن الأخوين |")
    add("|---|---|")
    for hue, dist in scan:
        band = "🟩 حرّ" if dist >= widest * 0.9 else ("🟨" if dist >= widest * 0.75 else "🟥 مسكون")
        add(f"| {arnum(hue)}–{arnum(hue + 15)} | {dist:.1f} {band} |")
    add("")
    add("**وحصيلةُ المسح**: نصفُ العجلة الباردُ كلُّه (الأخضرُ والفيروزيُّ والأزرقُ،")
    add("من ١٢٠° إلى ٢٨٥°) **مسكونٌ بأخوين** — هناك بيتُ اقرأ وبيتُ احسب. والحيّزُ")
    add("الباقي قوسٌ واحد من الأرجوان إلى الوردة، وفيه تجلس المرشّحاتُ الثلاث:")
    add("")
    for cand in data["candidates"]:
        dominant = cand["tokens"]["accent-letters"]
        hue = lch(dominant)[2]
        band = min(scan, key=lambda row: min(abs(hue - row[0]), abs(hue - row[0] - 360)))
        near = min(((f"{app}.{name}", value)
                    for app, info in siblings.items() for name, value in info["tokens"].items()
                    if name.startswith("accent-") or name in ("star", "brand-1", "brand-3")),
                   key=lambda kv: de00(dominant, kv[1]))
        add(f"- «{cand['name']}» عند {arnum(round(hue))}° — سعةُ نطاقه **{band[1]:.1f}**،"
            f" وأقربُ أخٍ إليه {near[0]} على **{de00(dominant, near[1]):.1f}**")
    add("")
    add("**والقوسُ الدافئ لم يُؤخَذ وإن اتّسع رقمُه** (١٥–٧٥°): هو بيتُ علامةِ اقرأ")
    add("البرتقالية ونجمتِنا الذهبية معاً — ولونٌ غالبٌ فيه يزاحم النجمةَ التي لا تُمَسّ،")
    add("والأيقونتان تتجاوران على شاشةِ آيبادٍ واحدة (`FAMILY §٩` البند ٢).")
    add("")
    add("**والنطاقُ الأوسع بالرقم لم يُؤخَذ**: القرمزيُّ (٣٤٥–١٥°) أبعدُ ما يكون عن")
    add("الأخوين، لكنّه جارُ `--err` — ولونُ مرحلةٍ يجاور لونَ الخطأ يُفسد دلالةً")
    add("تعلّمها الطفل. فأُخذ منه طرفُه البعيد (التُّوت) لا قلبُه.")
    add("")
    for out in data.get("rejected", []):
        palette = dict(app_tokens)
        palette.update(out["tokens"])
        m = measure(palette, siblings, siblings, opacity)
        worst = min(m["stages"].items(), key=lambda kv: kv[1]["ink_sep"])
        locked = min(((name, de00(s["value"], palette["locked"]))
                      for name, s in m["stages"].items()), key=lambda kv: kv[1])
        add(f"**وجُرّب رابعٌ فسقط بالرقم — «{out['name']}»**: {out['why_tried']}")
        add("")
        add(f"غير أنّ الفاحص ردّه بثلاثة أرقام: `{worst[0]}` **{worst[1]['ink_sep']:.1f}**"
            f" عن النموذج المرسوم (والأرضيةُ {floor['ink_sep']:.1f}) — فحبرُ الطفل لا يفارق"
            f" نموذجَه على اللوح، وهو أوّلُ ما يجب أن يراه · و`{locked[0]}` على"
            f" **{locked[1]:.1f}** من `--locked` — فمحطةٌ مفتوحةٌ تُقرأ مقفلة ·"
            f" وتمايزُ مراحله **{m['pairwise']:.1f}**. فلم يُعرَض، وقيدُه في"
            " `tools/palettes.json` ليُقاس لا ليُروى.")
        add("")
    add("**وأمّا المرشّحاتُ بعضُها من بعض** — فلا يُعرَض على المالك ثلاثةُ أرديةٍ لثوبٍ واحد:")
    add("")
    add("| | " + " | ".join(f"«{c['name']}»" for c in data["candidates"]) + " |")
    add("|---|" + "---|" * len(data["candidates"]))
    for one in data["candidates"]:
        cells = []
        for two in data["candidates"]:
            gap = de00(one["tokens"]["accent-letters"], two["tokens"]["accent-letters"])
            cells.append("—" if one is two else f"{gap:.1f}")
        add(f"| «{one['name']}» | " + " | ".join(cells) + " |")
    add("")

    for cand in data["candidates"]:
        rep = report[cand["id"]]
        add(f"## ٣.{arnum(data['candidates'].index(cand) + 1)} — «{cand['name']}»")
        add("")
        add(f"**الاستعارة**: {cand['metaphor']}")
        add("")
        add(f"**لماذا**: {cand['why']}")
        add("")
        add(f"**وما يُخشى منه**: {cand['risk']}")
        add("")
        add("| المرحلة | اللون | نصُّه فوقه | فصلُه عن النموذج المرسوم | أقربُ أخ | أقربُ لون حكم |")
        add("|---|---|---|---|---|---|")
        for token in STAGE_TOKENS:
            s = rep["warm"]["stages"][token]
            add(f"| {data['stages'][token]} | {swatch(s['value'])} | {s['contrast_on']:.2f}:١ |"
                f" {s['ink_sep']:.1f} | {s['sibling'][0]} {s['sibling'][1]:.1f} |"
                f" {s['functional'][0]} {s['functional'][1]:.1f} |")
        add("")
        add(f"**العلامة**: {swatch(cand['tokens']['brand-1'])} {swatch(cand['tokens']['brand-2'])} "
            f"{swatch(cand['tokens']['brand-3'])} — وبها تُعاد الأيقونةُ بعد الحكم.")
        add("")
        for ground in GROUNDS:
            m = rep[ground]
            title = ("**الأرضيةُ الدافئة كما هي** (موحّدةُ العائلة)" if ground == "warm"
                     else f"**الأرضيةُ معدَّلة** — {cand['ground_note']}")
            add(f"### {title}")
            add("")
            add(f"الورق {swatch(m['palette']['paper'])} · البطاقة {swatch(m['palette']['card'])} ·"
                f" الحبر {swatch(m['palette']['ink'])} — حبرٌ على ورق **{m['ink_paper']:.2f}:١**،"
                f" وثانويٌّ **{m['soft_paper']:.2f}:١**، وبُعدُ الورق عن ورق اقرأ **{m['paper_read']:.1f}**"
                f" وعن ورق احسب **{m['paper_calc']:.1f}**.")
            add("")
            add("<table><tr>")
            for scene, scene_title in SCENES:
                name = shot_name(cand["id"], ground, scene)
                add(f'<td align="center" width="33%"><a href="identity/{name}">'
                    f'<img src="identity/{name}" width="260" alt="{scene_title}"></a>'
                    f'<br><sub>{scene_title}</sub></td>')
            add("</tr></table>")
            add("")
            bad = m["complaints"]
            add("**ما نزل عن أرضيةٍ**:" + ("" if bad else " لا شيء."))
            if bad:
                add("")
                for line in bad:
                    add(f"- ⚠ {line}")
            add("")

    add("## ٤. المقابلة — الشاشةُ الواحدة بألواحها الأربعة")
    add("")
    ruled = parse_verdict(read_verdict())
    add("**على الأرضية الدافئة**" + (
        " — وأوّلُ عمودٍ **لوحُ التطبيق كما هو الآن**: الحكمُ مطبَّقٌ فيه، فمطابقتُه"
        " لعمود المرشَّح المحكوم له شهادةٌ بالصورة على أنّ ما لُبس هو ما حُكم له"
        if ruled else " (وأوّلُ عمودٍ لوحُ اليوم: لونُ اقرأ نيابةً)") + "،")
    add("وأرضيةُ كلِّ مرشَّحٍ المعدَّلة في بابه أعلاه.")
    add("")
    columns = ([("now", "لوحُ التطبيق الآن" if ruled else "لوحُ اليوم")]
               + [(c["id"], c["name"]) for c in data["candidates"]])
    for scene, scene_title in SCENES:
        add(f"**{scene_title}**")
        add("")
        add("<table><tr>")
        for candidate, label in columns:
            name = shot_name(candidate, "warm", scene)
            add(f'<td align="center" width="25%"><a href="identity/{name}">'
                f'<img src="identity/{name}" width="200" alt="{label} — {scene_title}"></a>'
                f'<br><sub>{label}</sub></td>')
        add("</tr></table>")
        add("")

    add("## ٥. سؤالٌ مفتوحٌ يخصّ الذهب")
    add("")
    add("`--star` يحمل اليومَ ثلاثةَ أدوارٍ في «اُكْتُبْ»: **الإرشاد** (نقطةُ البداية والسهم) و**النجوم**")
    add("و**الفعلُ الرئيس** (زرُّ «تابع من هنا» وأخواته). فبقاؤه ذهبياً — وهو نصُّ البند —")
    add("يُبقي أكبرَ مساحةٍ ملوّنة في الخريطة ذهبيةً في المرشّحات الثلاثة كلِّها.")
    add("")
    add("**وثالثةٌ تُقرأ في اللقطات**: طائرُ العائلة نفسُه من الذهب — `mascot()` يرسم ريشَه")
    add("بـ`--star` — فهو واحدٌ في التطبيقات الثلاثة ما دام الذهبُ محفوظاً.")
    add("")
    add("**والبابُ المفتوح** (لا يُفتَح إلا بأمر): يُشقّ `--guide` عن `--star` فيبقى الإرشادُ ذهبياً")
    add("بدلالته ويتحرّر لونُ الفعل الرئيس إلى الهوية — كما فعل احسب (نجمتُه فيروزية).")
    add("**ولم يُفعل اليوم**: البندُ يقول «لا تُمَسّ ألوانُ الحكم»، والإرشادُ منها.")
    add("")

    chosen = next((c for c in data["candidates"] if c["id"] == shift_for(data)), None)
    if chosen:
        rep = report.get(chosen["id"], {})
        add(f"## ٦. الأرضيةُ الدافئةُ المزاحة — لوحةٌ مكمّلة لـ«{chosen['name']}»")
        add("")
        add(f"> **حكمُ المالك في اللوحة أعلاه**: الغالبُ «{chosen['name']}»، **والأرضيةُ دافئةٌ")
        add("> مُزاحة** — تبقى دافئةً بالعين وتقيس مخالفةً لورق اقرأ. وهي أرضيةٌ **لم تكن في")
        add("> اللوحة الأولى**: «الدافئةُ كما هي» بُعدُها عن ورق اقرأ **٠٫٠** فيردّها حارسُ")
        add("> الميثاق القادم (`FAMILY §٩`)، و«المعدَّلة» ورقٌ بارد. فاشتُقّت ثالثةٌ وصُيِّرت")
        add("> **لتُرى قبل أن يُكتب الحكم** — فلا يُعتمد لونٌ لم تره عين.")
        add("")
        add("**والإزاحةُ تُشتقّ بقياسٍ معلَن لا بذوق** — ثلاثةُ مطالبَ في العبارة، ثلاثةُ أرقامٍ في الاشتقاق:")
        add("")
        add(f"1. **كم تُزاح؟** — لا عتبةَ تُخترع. وفي العائلة سابقةٌ واحدة لورقٍ اختار نفسَه:"
            f" **احسب**. فبُعدُ ورقه عن ورق اقرأ **خطوةُ أخٍ** — وهي الأرضية:"
            f" ΔE₀₀ = **{shift['read_calc']:.2f}**. فمن بلغها خالف بمقدارِ ما خالف به أخٌ فعلاً،"
            " لا بمقدارِ ما استُحسن.")
        add(f"2. **كيف تبقى دافئة؟** — الإزاحةُ **في الدفء لا منه**: يُضرب إشباعُ لوح اقرأ في"
            " معاملٍ واحد **والإضاءةُ والصبغةُ لا تُمَسّان**. فالورقُ يزداد كِرَميّةً ولا يبرد،"
            " وصبغتُه صبغةُ العائلة بعينها.")
        add(f"3. **وكم بالضبط؟** — **أصغرُ معاملٍ يبلغ الخطوة**: `k` = **{shift['k']:.3f}**"
            f" ⇐ ورقٌ {swatch(shift['paper'])} على **{shift['paper_read']:.2f}** من ورق اقرأ."
            f" ولا يُنفَق أكثرُ مما يطلبه الميثاق: ما دونه ({shift['below'][0]:.3f} ⇐"
            f" {swatch(shift['below'][1])}) ينزل عن الخطوة بـ**{shift['below'][2]:.2f}**."
            " **والمقياسُ على القيمة الثمانيّة التي تُكتب في اللوح** لا على المتّصل الرياضيّ —"
            " فما لا يُكتب لا يُقاس.")
        add("")
        if shift.get("cool"):
            cool = shift["cool"]
            add(f"**وللمعامل جهتان، وسقطت إحداهما بالرقم**: دون الواحد يبرد الورقُ"
                f" (`k` = {cool['k']:.3f} ⇐ {swatch(cool['paper'])})، فيبلغ خطوةَ اقرأ"
                f" (**{cool['paper_read']:.2f}**) **ثم يجلس في حِجر احسب**: على"
                f" **{cool['paper_calc']:.2f}** من ورقه وحدَه — أي يخالف أخاً ويزاحم أخاً."
                f" والجهةُ الدافئة تبعد عن **الاثنين معاً**: {shift['paper_read']:.2f} عن اقرأ"
                f" و**{shift['paper_calc']:.2f}** عن احسب. فالاتجاهُ حكمُ رقمٍ لا ميلُ عين.")
            add("")
        add("| رمزُ الأرضية | لوحُ اقرأ | المزاح | ΔE₀₀ |")
        add("|---|---|---|---|")
        for name in data["shift"]["tokens"]:
            was = read_tokens[name]
            add(f"| `--{name}` | {swatch(was)} | {swatch(shift['ground'][name])} |"
                f" {de00(shift['ground'][name], was):.2f} |")
        add("")
        pairs = [("الحبرُ على الورق", "ink", "paper"), ("الثانويُّ على الورق", "ink-soft", "paper"),
                 ("الحبرُ على البطاقة", "ink", "card"), ("المقفلُ على الورق", "locked", "paper")]
        drift = max(abs(contrast(shift["ground"][a], shift["ground"][b]) - contrast(read_tokens[a], read_tokens[b]))
                    for _, a, b in pairs)
        add("**وربحٌ يلزم عن (٢) بالبرهان لا بالتجربة**: تباينُ WCAG دالّةُ الإضاءة النسبية")
        add("وحدَها، و`L*` دالّتُها هي الأخرى — فما دامت `L*` لم تُمَسّ فكلُّ تباينٍ في لوح اقرأ")
        add(f"**محفوظٌ بعينه**. والمقيسُ يشهد: أقصى ما تحرّك تباينٌ **{drift:.3f}** (وهو حَفُّ")
        add("التدوير إلى ثماني بتّات):")
        add("")
        add("| التباين | لوحُ اقرأ | المزاح |")
        add("|---|---|---|")
        for label, a, b in pairs:
            add(f"| {label} | {contrast(read_tokens[a], read_tokens[b]):.2f}:١ |"
                f" {contrast(shift['ground'][a], shift['ground'][b]):.2f}:١ |")
        add("")
        if shift["clipped"]:
            add("**وواحدٌ يُعلَن ولا يُخبَّأ — البطاقةُ على جدار المجال**: "
                + " و".join(f"`--{n}`" for n in shift["clipped"])
                + f" يبلغ حدَّ sRGB قبل تمام الإزاحة (وهو عند اقرأ نفسِه على الحدّ: أحمرُه ٢٥٥)،"
                f" فيأخذ ما يسعه المجالُ: **{shift['reach'][shift['clipped'][0]]:.3f}** من"
                f" **{shift['k']:.3f}**. **والمقيسُ ما كُتب لا ما أُريد** — والأرقامُ أعلاه من"
                " القيمة المكتوبة.")
            add("")
        best = {g: min(s["ink_sep"] for s in rep[g]["stages"].values()) for g in rep}
        add(f"**وحصيلةُ الأرضيات الثلاث على «{chosen['name']}»** — وأنفسُها **فصلُ حبر الطفل عن")
        add("النموذج المرسوم**، أوّلُ ما تراه عينُه على اللوح:")
        add("")
        add("| الأرضية | الورق | عن ورق اقرأ | عن ورق احسب | حبرٌ على ورق | أدنى فصلِ حبر | ما نزل عن أرضيةٍ |")
        add("|---|---|---|---|---|---|---|")
        for ground in GROUNDS + [SHIFT]:
            if ground not in rep:
                continue
            m = rep[ground]
            label = {"warm": "الدافئةُ كما هي", "tuned": "المعدَّلة (باردة)", SHIFT: "**المزاحة**"}[ground]
            mark = " ✓" if best[ground] >= floor["ink_sep"] else ""
            add(f"| {label} | {swatch(m['palette']['paper'])} | {m['paper_read']:.1f} |"
                f" {m['paper_calc']:.1f} | {m['ink_paper']:.2f}:١ | {best[ground]:.1f}{mark} |"
                f" {arnum(len(m['complaints']))} |")
        add("")
        add(f"**وأرضيةُ اقرأ في فصل الحبر {floor['ink_sep']:.1f}** — فالمزاحةُ وحدَها تعلوها:")
        add("ورقٌ أدفأ يدفع النموذجَ المرسوم إلى الدفء، فيزداد فصلُه عن حبرٍ نيليٍّ بارد.")
        add("**والشكوى التي كانت على الدافئة سقطت** ولم يُشترَ ذلك بحرفٍ خفت.")
        add("")
        if rep.get(SHIFT):
            bad = rep[SHIFT]["complaints"]
            add("**وما بقي تحت أرضيةٍ في المزاحة**:" + ("" if bad else " لا شيء."))
            if bad:
                add("")
                for line in bad:
                    add(f"- ⚠ {line}")
                add("")
                add("(وهي شكوى بنيويةٌ في كل مرشَّحٍ ذي هويةٍ غالبةٍ واحدة — علّتُها في §٢،")
                add("ولا تخصّ الأرضية: رقمُها واحدٌ في الأرضيات الثلاث.)")
            add("")
        add("**وماذا ترى العينُ؟ — يُقال صريحاً**: الإزاحةُ **صغيرةٌ بالقصد** (لا تُنفَق مخالفةٌ")
        add(f"أكثرُ مما يطلبه الميثاق): {shift['paper_read']:.2f} ΔE₀₀ فرقٌ يُرى إن صُفَّ الورقان")
        add("جنباً إلى جنب — كما في المقابلة أدناه — ولا يُرى وحدَه. **وهذا نصُّ المطلوب**:")
        add("«تبقى دافئةً بالعين وتقيس مخالفة». فمن أراد فرقاً يصرخ فليس هذا بابَه؛ والمزاحةُ")
        add(f"في المقابلة أدفأُ من الدافئة نفسِها لا أبردُ منها (إشباعُ ورقها {lch(shift['paper'])[1]:.1f}")
        add(f"وإشباعُ ورق اقرأ {lch(read_tokens['paper'])[1]:.1f}).")
        add("")
        add(f"### اللقطات — «{chosen['name']}» على الأرضية المزاحة")
        add("")
        add("<table><tr>")
        for scene, scene_title in SCENES:
            name = shot_name(chosen["id"], SHIFT, scene)
            add(f'<td align="center" width="33%"><a href="identity/{name}">'
                f'<img src="identity/{name}" width="260" alt="{scene_title}"></a>'
                f'<br><sub>{scene_title}</sub></td>')
        add("</tr></table>")
        add("")
        add("**والمقابلةُ بالأرضيات الثلاث** — الغالبُ واحدٌ في الأعمدة الثلاثة، والمتبدّلُ الورقُ وحدَه:")
        add("")
        for scene, scene_title in SCENES:
            add(f"**{scene_title}**")
            add("")
            add("<table><tr>")
            for ground, label in (("warm", "الدافئةُ كما هي"), ("tuned", "المعدَّلة (باردة)"),
                                  (SHIFT, "المزاحة")):
                name = shot_name(chosen["id"], ground, scene)
                add(f'<td align="center" width="33%"><a href="identity/{name}">'
                    f'<img src="identity/{name}" width="260" alt="{label} — {scene_title}"></a>'
                    f'<br><sub>{label}</sub></td>')
            add("</tr></table>")
            add("")
        add(f"**والمطلوبُ من هذه اللوحة سطرٌ واحد**: إن رضيت عينُك الأرضيةَ المزاحة فالحكمُ")
        add(f"`{chosen['id']} / {SHIFT}` يُكتب في §٧ أدناه؛ وإن آثرتَ سواها فـ`{chosen['id']} / warm`")
        add(f"أو `{chosen['id']} / tuned`. **ولا يُصبَغ اللوحُ حتى يُكتب** — والحارسُ على الطرفين.")
        add("")

    add("## ٧. حكمُ المالك")
    add("")
    add("يُكتب هنا بمعرّف المرشَّح والأرضية — مثلاً `mulberry / tuned` أو `indigo / warm`،")
    add("والأرضياتُ: `warm` (الدافئةُ كما هي) · `tuned` (المعدَّلة) · "
        f"`{SHIFT}` (**الدافئةُ المزاحة**، §٦ — ولها وحدَها من المرشّحين "
        + (f"`{shift_for(data)}`" if shift_for(data) else "—") + ")،")
    add("والمعرّفاتُ: " + " · ".join(f"`{c['id']}` ({c['name']})" for c in data["candidates"]) + ".")
    add("")
    add(KEPT_OPEN)
    add(read_kept())
    add(KEPT_SHUT)
    add("")
    add("> وما دام الحكمُ منتظَراً فـ`app/css/app.css` يبقى لوحَ البذرة، **يحرسه**")
    add("> `python3 tools/identity_panel.py --self-test`: يحمرّ إن طُبِّق لونٌ بلا حكمٍ")
    add("> مكتوب هنا، ويحمرّ إن كُتب الحكمُ ولم يطابقه اللوحُ حرفاً.")
    return "\n".join(lines) + "\n"


# ————— ٦) الفحصُ الذاتيّ —————

def self_test() -> int:
    fails = 0

    def ok(cond, msg):
        nonlocal fails
        print(("  ✓ " if cond else "  ✗ ") + msg)
        if not cond:
            fails += 1

    print("\n— حسابُ التباين (WCAG 2.x) —")
    ok(abs(contrast("#000000", "#FFFFFF") - 21) < 1e-9, "أسودُ على أبيض = ٢١:١")
    ok(abs(contrast("#FFFFFF", "#FFFFFF") - 1) < 1e-9, "أبيضُ على أبيض = ١:١")
    ok(abs(contrast("#767676", "#FFFFFF") - 4.54) < 0.01,
       "الرماديُّ الحدّيّ #767676 على أبيض = ٤٫٥٤:١ (حدُّ AA المعروف)")
    ok(abs(contrast("#3D3428", "#FAF4E8") - 11.14) < 0.01, "حبرُ العائلة على ورقها = ١١٫١٤:١")

    print("\n— فرقُ اللون CIEDE2000 (أزواجُ Sharma المرجعية) —")
    pairs = [
        ((50.0, 2.6772, -79.7751), (50.0, 0.0, -82.7485), 2.0425),
        ((50.0, 3.1571, -77.2803), (50.0, 0.0, -82.7485), 2.8615),
        ((50.0, 2.8361, -74.0200), (50.0, 0.0, -82.7485), 3.4412),
        ((50.0, -1.3802, -84.2814), (50.0, 0.0, -82.7485), 1.0000),
        ((60.2574, -34.0099, 36.2677), (60.4626, -34.1751, 39.4387), 1.2644),
        ((22.7233, 20.0904, -46.6940), (23.0331, 14.9730, -42.5619), 2.0373),
    ]
    for one, two, want in pairs:
        got = de00(one, two)
        ok(abs(got - want) < 0.0002, f"ΔE₀₀ = {got:.4f} (المرجع {want})")
    ok(abs(de00("#FFFFFF", "#FFFFFF")) < 1e-9, "اللونُ ونفسُه = صفر")
    ok(mix("#000000", "#FFFFFF", 0.5) == "#808080", "مزجُ النصف بين الأسود والأبيض")

    print("\n— بيانُ المرشّحات —")
    data = json.loads(PALETTES.read_text(encoding="utf-8"))
    app_tokens = root_tokens(CSS.read_text(encoding="utf-8"))
    cands = data["candidates"]
    ok(len(cands) >= 3, f"مرشّحاتٌ مصيَّرة: {len(cands)}")
    held = set(data["held"]["tokens"])
    names = set()
    for cand in cands:
        names.add(cand["id"])
        every = {**cand["tokens"], **cand["ground"]}
        unknown = [k for k in every if k not in app_tokens]
        ok(not unknown, f"«{cand['name']}»: كلُّ رمزٍ يبدّله موجودٌ في لوح التطبيق"
                        + (f" — دخيلٌ: {unknown}" if unknown else ""))
        bad = [k for k in every if k in held]
        ok(not bad, f"«{cand['name']}»: لا يمسّ لونَ حكمٍ وظيفياً"
                    + (f" — مسّ: {bad}" if bad else ""))
        shaped = [v for v in every.values() if not re.fullmatch(r"#[0-9A-Fa-f]{6}", v)]
        ok(not shaped, f"«{cand['name']}»: قيمُه ألوانٌ سليمةُ الصيغة")
        ok(all(t in cand["tokens"] for t in STAGE_TOKENS),
           f"«{cand['name']}»: المراحلُ الخمسُ كلُّها معلَنة")
    ok(len(names) == len(cands), "لا معرّفَ مكرّر")
    for out in data.get("rejected", []):
        unknown = [k for k in out["tokens"] if k not in app_tokens]
        touched = [k for k in out["tokens"] if k in held]
        ok(not unknown and not touched,
           f"المردودُ «{out['name']}»: رموزُه معروفةٌ ولا تمسّ لونَ حكم"
           + (f" — {unknown + touched}" if unknown or touched else ""))

    print("\n— الأرضيةُ الدافئةُ المزاحة: مشتقّةٌ لا مكتوبة —")
    siblings = sibling_palettes(data)
    read_tokens = siblings["read"]["tokens"]
    calc_tokens = siblings["calc"]["tokens"]
    names = data["shift"]["tokens"]
    written = [k for k, v in data["shift"].items()
               if isinstance(v, str) and re.fullmatch(r"#[0-9A-Fa-f]{3,8}", v)]
    ok(not written, "لا لونَ مكتوبٌ في بيان الإزاحة" + (f" — مكتوب: {written}" if written else ""))
    shift = derive_shift(read_tokens, calc_tokens, names)
    again = derive_shift(read_tokens, calc_tokens, names)
    ok(shift["ground"] == again["ground"], "الاشتقاقُ يعيد نفسَه حرفاً")
    ok(shift_for(data) in {c["id"] for c in cands},
       f"الأرضيةُ المزاحة لمرشَّحٍ معروف: «{shift_for(data)}»")
    ok(set(shift["ground"]) == set(names) and all(t in app_tokens for t in names),
       "رموزُها رموزُ أرضيةٍ معروفةٌ في لوح التطبيق")
    ok(not [t for t in names if t in held], "لا تمسّ لونَ حكمٍ وظيفياً")
    ok(all(re.fullmatch(r"#[0-9A-Fa-f]{6}", v) for v in shift["ground"].values()),
       "قيمُها ألوانٌ سليمةُ الصيغة")

    # ١) «مخالفةٌ تُقاس» — خطوةُ أخٍ لا عتبةٌ تُخترع، وأصغرُ ما يبلغها
    ok(abs(shift["step"] - de00(read_tokens["paper"], calc_tokens["paper"])) < 1e-9,
       f"خطوةُ الإزاحة هي بُعدُ ورق احسب عن ورق اقرأ: {shift['step']:.3f}")
    ok(shift["paper_read"] >= shift["step"],
       f"الورقُ المزاح يبلغ الخطوة: {shift['paper_read']:.3f} ≥ {shift['step']:.3f}")
    ok(shift["below"][2] < shift["step"],
       f"وهو **أصغرُ ما يبلغها**: ما دونه {shift['below'][1]} على {shift['below'][2]:.3f} فقط")
    ok(shift["paper_calc"] > shift["step"],
       f"ويبعد عن ورق احسب كذلك: {shift['paper_calc']:.3f} — فليس مخالفةَ أخٍ ومزاحمةَ أخ")

    # ٢) «تبقى دافئة» — الإزاحةُ في الدفء لا منه: إشباعٌ يعلو، وصبغةٌ وإضاءةٌ لا تُمَسّان
    was, now = lch(read_tokens["paper"]), lch(shift["paper"])
    ok(now[1] > was[1] > lch(calc_tokens["paper"])[1],
       f"إشباعُ الورق يعلو ولا ينزل: احسب {lch(calc_tokens['paper'])[1]:.2f}"
       f" · اقرأ {was[1]:.2f} · المزاح {now[1]:.2f}")
    ok(abs(now[2] - was[2]) < 2.5 and abs(now[0] - was[0]) < 0.5,
       f"الصبغةُ والإضاءةُ في موضعهما: صبغة {was[2]:.1f}° ← {now[2]:.1f}° ·"
       f" إضاءة {was[0]:.2f} ← {now[0]:.2f}")
    ok(shift["cool"] and shift["cool"]["paper_calc"] < shift["step"],
       "والجهةُ الباردة مردودةٌ بالرقم: تجلس في حِجر احسب على "
       + (f"{shift['cool']['paper_calc']:.2f}" if shift["cool"] else "—"))

    # ٣) «ولا يُشترى الدفءُ بحرفٍ يخفت» — التباينُ محفوظٌ لأن `L*` لم تُمَسّ
    drift = max((abs(contrast(shift["ground"][a], shift["ground"][b]) - contrast(read_tokens[a], read_tokens[b])), a, b)
                for a, b in (("ink", "paper"), ("ink-soft", "paper"), ("ink", "card"), ("locked", "paper")))
    ok(drift[0] < 0.05, f"كلُّ تباينات اقرأ محفوظة — أقصى انحراف {drift[0]:.3f}"
                        f" (`--{drift[1]}` على `--{drift[2]}`)")
    ok(contrast(shift["ground"]["ink"], shift["ground"]["paper"]) >= 7
       and contrast(shift["ground"]["ink-soft"], shift["ground"]["paper"]) >= AA,
       "حبرُها على ورقها AAA وثانويُّها AA")
    ok(all(n == "card" for n in shift["clipped"]),
       "ولا يُقَصّ إلى حدّ المجال إلا ما هو على حدّه أصلاً"
       + (f" — قُصّ: {shift['clipped']}" if shift["clipped"] else " (ولا شيء)"))

    print("\n— لوحُ احسب عند التزامه المسمّى —")
    calc = siblings["calc"]
    if calc["matches"] is None:
        print("  · مستودعُ احسب غيرُ متاح هنا — القيمُ المقيَّدة هي المعتمدة، ومعلَنٌ ذلك في اللوحة")
    else:
        ok(calc["matches"], f"المقيَّدُ يطابق `calc@{calc['commit']}` حرفاً")

    print("\n— بابُ المالك: ما تكتبه يدٌ لا يمحوه مولّد —")
    panel_now = PANEL.read_text(encoding="utf-8") if PANEL.exists() else ""
    kept = read_kept()
    ok(KEPT_OPEN in panel_now and KEPT_SHUT in panel_now, "علامتا الحفظ في اللوحة")
    ok(bool(VERDICT_LINE.search(kept)), "وسطرُ الحكم داخلَ المحفوظ")
    ok(panel_now.count(KEPT_OPEN) == 1 and panel_now.count(KEPT_SHUT) == 1,
       "ولا علامةَ مكرّرة تشقّ البابَ بابين")
    # وأصدقُ شهادةٍ: أن يُعاد توليدُ اللوحة نصّاً فيخرج المحفوظُ كما هو
    opacity = model_opacity(CSS.read_text(encoding="utf-8"))
    floor = floors(read_tokens, opacity)
    remade = panel_text(data, app_tokens, siblings, floor,
                        build_report(data, app_tokens, siblings, floor, opacity, shift, cands),
                        opacity, shift)
    ok(kept in remade, "وإعادةُ التوليد تردّه بحرفه")
    # وشقُّه الآخر: ما عدا البابَ **مولَّدٌ لا يُحرَّر بيد** — فاللوحةُ على القرص يجب أن
    # تكون عينَ ما يخرج من المولّد اليوم. فمن حرّر فقرةً مولَّدة أو بدّل المولّدَ ولم
    # يُعِد التوليدَ يحمرّ هنا، ولا تُقرَأ لوحةٌ تصف أرقاماً غيرَ التي تُحسب.
    ok(panel_now == remade, "وما عدا البابَ: اللوحةُ على القرص عينُ ما يخرج من المولّد")

    print("\n— «لا لونَ قبل الحكم، ولا حكمَ بلا تطبيق» —")
    ok(PANEL.exists(), "لوحةُ العرض `docs/REVIEW_IDENTITY.md` موجودة")
    verdict = parse_verdict(read_verdict()) if PANEL.exists() else None
    read_css = ROOT.parent / "read" / "app" / "css" / "app.css"
    if verdict is None:
        if read_css.exists():
            seed = root_tokens(read_css.read_text(encoding="utf-8"))
            moved = [t for t in STAGE_TOKENS + ["paper", "ink", "brand-1", "brand-2", "brand-3"]
                     if app_tokens.get(t) != seed.get(t)]
            ok(not moved, "الحكمُ منتظَر ⇐ لوحُ التطبيق لوحُ البذرة لم يُصبَغ"
                          + (f" — تبدّل: {moved}" if moved else ""))
        else:
            print("  · مجلدُ اقرأ غيرُ متاح — تعذّرت مقابلةُ اللوح بالبذرة")
    else:
        chosen = next((c for c in cands if c["id"] == verdict[0]), None)
        ok(chosen is not None, f"الحكمُ «{verdict[0]}» مرشَّحٌ معروف")
        ok(chosen is not None and verdict[1] in grounds_of(data, verdict[0]),
           f"والأرضيةُ «{verdict[1]}» أرضيةٌ يلبسها هذا المرشَّح")
        if chosen and verdict[1] in grounds_of(data, verdict[0]):
            want = dict(chosen["tokens"])
            if verdict[1] == "tuned":
                want.update(chosen["ground"])
            elif verdict[1] == SHIFT:
                want.update(shift["ground"])
            off = [k for k, v in want.items() if app_tokens.get(k) != v]
            ok(not off, f"لوحُ التطبيق مصبوغٌ بـ«{chosen['name']}» ({verdict[1]}) حرفاً"
                        + (f" — يخالف: {off}" if off else ""))

            # **وليلُه إسقاطُ نهاره لا لونٌ ثانٍ**: الكتلةُ الليلية تُقابَل بالاشتقاق
            # (§٣ج) رمزاً رمزاً — فمن كتب فيها لوناً بيده أو نسي إعادةَ اشتقاقها
            # يومَ تحرّك اللوحُ يحمرّ هنا، ولا يبقى وجهُ أخٍ في الليل بعد أن زال نهاراً.
            if read_css.exists():
                night = derive_night(read_tokens, read_night(read_css.read_text(encoding="utf-8")),
                                     chosen["tokens"], shift["ground"], shift["k"], STAGE_TOKENS)
                mine = read_night(CSS.read_text(encoding="utf-8"))
                want_night = {**night["ground"], **night["accents"],
                              "on-accent": night["ground"]["paper"]}
                dark_off = [k for k, v in want_night.items() if mine.get(k) != v]
                ok(not dark_off, f"وليلُه مشتقٌّ بقاعدته (رفعةٌ +{night['lift']:.1f} ⇐"
                                 f" أدنى تباينٍ {night['worst']:.2f})"
                                 + (f" — يخالف: {dark_off}" if dark_off else ""))
                held_dark = [t for t in ("star", "ok", "err") if mine.get(t) != read_night(
                    read_css.read_text(encoding="utf-8")).get(t)]
                ok(not held_dark, "وألوانُ الحكم ليلاً كما ورثها لم تُمَسّ"
                                  + (f" — تبدّل: {held_dark}" if held_dark else ""))

            # **وشهادةٌ بالصورة تُتِمّ شهادةَ الرمز**: لقطةُ التطبيق كما هو اليوم (`now`)
            # يجب أن تطابق لقطةَ المرشَّح المحكوم له وهو محقون — فالرمزُ قد يُكتب صحيحاً
            # ثم يُغلَب (إعلانٌ ثانٍ بعده، أو قاعدةٌ أخصُّ تكتب لوناً فوقه)، والصورةُ لا
            # تُغلَب. **وحدُّها معلَنٌ**: الحقنُ يبدّل `:root` وحدَه، فلونٌ مكتوبٌ بيدٍ في
            # قاعدةٍ أخرى يقع في الصورتين معاً فلا تفترقان — وذلك ما يمسكه حارسُ
            # «لا لونَ منثور» أدناه، جُرِّبا سالباً فأمسك كلٌّ ما لصاحبه.
            drift = []
            for scene, _ in SCENES:
                mine_shot = OUT / shot_name("now", "warm", scene)
                his = OUT / shot_name(verdict[0], verdict[1], scene)
                if mine_shot.exists() and his.exists():
                    gap = shots_match(mine_shot, his)
                    if gap > 0.001:
                        drift.append(f"{scene} {gap * 100:.2f}٪")
            ok(not drift, "ولقطةُ التطبيق اليوم تطابق لقطةَ المرشَّح المحكوم له"
                          + (f" — تفترق: {'، '.join(drift)}" if drift else ""))

    print("\n— «مواضعُ اللوح لا أرقامٌ منثورة» —")
    # نصُّ بند الجلسة: «رموزُ الهوية في لوح `app.css` — مواضعُ `--accent` وأخواتها لا
    # أرقامٌ منثورة». فيُجرَد كلُّ لونٍ مكتوبٍ في `app/` خارج كتلتَي اللوح: ما لم يكن
    # قيمةً من قيم اللوح نفسِه فهو لونٌ **يشيخ صامتاً** يومَ تتحرّك الهوية — وقد شاخ
    # فعلاً يومَ صُبغ اللوح: `.btn--primary` و`.continue` بقيتا على حبر اقرأ، ولم
    # يمسكهما فحصُ الرموز ولا الحارسُ البصريّ (الحقنُ يبدّل `:root` وحدَه فيقع اللونُ
    # المنثور في الصورتين معاً) — فأمسكهما هذا الجرد. **والمعفى معلَنٌ**: الأبيضُ
    # والأسودُ ليسا هويةً.
    NEUTRAL = {"#fff", "#ffffff", "#000", "#000000"}
    css_text = CSS.read_text(encoding="utf-8")
    board = {v.lower() for v in root_tokens(css_text).values()} \
        | {v.lower() for v in read_night(css_text).values()}
    body = css_text
    for block in (re.search(r":root\s*\{(.*?)\n\}", css_text, re.S),
                  re.search(r"@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{(.*?)\n  \}",
                            css_text, re.S)):
        if block:
            body = body.replace(block.group(1), "")
    # **وبابُ الاستثناء واحد ومكتوبٌ في موضعه**: لونُ أداةٍ لا يخصّ الطفلَ (لوحُ مسجّل
    # `?dev=1` مثلاً: أخضرُ سطرٍ وأحمرُه على أرضٍ داكنة، لا يتبعان لوحاً) يُعلَن في سطره
    # بالعلامة أدناه. فما استُثني قيل لِمَ استُثني، ولا يتسلّل استثناءٌ صامت.
    EXEMPT = "لونُ أداةٍ لا هوية"
    stray = sorted({m.group(0).lower() for m in re.finditer(r"#[0-9A-Fa-f]{3,8}\b", body)
                    if EXEMPT not in body[body.rfind("\n", 0, m.start()) + 1:
                                          body.find("\n", m.end()) if body.find("\n", m.end()) > 0
                                          else len(body)]} - board - NEUTRAL)
    ok(not stray, "لا لونَ في `app.css` خارج اللوح إلا معلَنَ العلّة"
                  + (f" — منثور: {stray}" if stray else ""))

    pages = sorted(APP.glob("**/*.html"))
    off = [f"{page.name}:{value}" for page in pages
           for value in re.findall(r'name="theme-color"[^>]*content="(#[0-9A-Fa-f]{3,8})"',
                                   page.read_text(encoding="utf-8"))
           if value.lower() not in board]
    ok(not off, f"ولونُ الواجهة في صفحات `app/` كلِّها ({len(pages)}) من اللوح"
                + (f" — يخالف: {off}" if off else ""))
    manifest = json.loads((APP / "manifest.webmanifest").read_text(encoding="utf-8"))
    ok(manifest["theme_color"].lower() in board and manifest["background_color"].lower() in board,
       f"وبيانُ التطبيق كذلك ({manifest['theme_color']} · {manifest['background_color']})")

    print("\n— اللقطاتُ المصيَّرة —")
    wanted = {shot_name("now", "warm", s) for s, _ in SCENES}
    for cand in cands:
        for ground in grounds_of(data, cand["id"]):
            for scene, _ in SCENES:
                wanted.add(shot_name(cand["id"], ground, scene))
    if not OUT.exists():
        ok(False, "مجلدُ اللقطات `docs/identity/` مفقود")
    else:
        panel = PANEL.read_text(encoding="utf-8") if PANEL.exists() else ""
        missing = [n for n in sorted(wanted)
                   if not (OUT / n).exists() or png_size(OUT / n) != (DEVICE_W, DEVICE_H)]
        ok(not missing, f"لقطاتٌ سليمةٌ بمقاس الجهاز: {len(wanted)}"
                        + (f" — ناقصةٌ أو معطوبة: {missing}" if missing else ""))
        unseen = [n for n in sorted(wanted) if f"identity/{n}" not in panel]
        ok(not unseen, "كلُّ لقطةٍ تعرضها اللوحة" + (f" — لا تُعرَض: {unseen}" if unseen else ""))
        orphan = [p.name for p in sorted(OUT.glob("*.png")) if p.name not in wanted]
        ok(not orphan, "لا لقطةَ يتيمة" + (f" — يتيمة: {orphan}" if orphan else ""))

    print(f"\n{fails} إخفاق" if fails else "\nالفحصُ الذاتيّ أخضر")
    return 1 if fails else 0


# ————— ٧) السَّوق —————

def main() -> int:
    ap = argparse.ArgumentParser(description="لوحةُ مرشّحات هوية اللون")
    ap.add_argument("--numbers", action="store_true", help="الأرقامُ وحدَها بلا متصفّح")
    ap.add_argument("--only", help="مرشَّحٌ واحد بمعرّفه")
    ap.add_argument("--self-test", action="store_true", help="فحصُ الأداة نفسِها")
    ap.add_argument("--port", type=int, default=8797)
    ap.add_argument("--timeout", type=int, default=90)
    args = ap.parse_args()
    if args.self_test:
        return self_test()

    data = json.loads(PALETTES.read_text(encoding="utf-8"))
    css_text = CSS.read_text(encoding="utf-8")
    app_tokens = root_tokens(css_text)
    siblings = sibling_palettes(data)
    opacity = model_opacity(css_text)
    floor = floors(siblings["read"]["tokens"], opacity)
    cands = [c for c in data["candidates"] if not args.only or c["id"] == args.only]
    if not cands:
        sys.exit(f"لا مرشَّحَ بهذا المعرّف: {args.only}")

    shift = derive_shift(siblings["read"]["tokens"], siblings["calc"]["tokens"],
                         data["shift"]["tokens"])

    print("— أرضياتُ اقرأ المحسوبة —")
    print(f"  فصلُ الحبر {floor['ink_sep']:.1f} · تمايزُ المراحل {floor['pairwise']:.1f}"
          f" · مفارقةُ ألوان الحكم {floor['functional']:.1f} · أقصى إشباع {floor['chroma']:.0f}")
    print(f"\n— الأرضيةُ المزاحة (مشتقّةٌ لـ«{shift_for(data)}») —")
    print(f"  خطوةُ الأخ {shift['read_calc']:.2f} · المعامل {shift['k']:.3f}"
          f" · ورقٌ {shift['paper']} على {shift['paper_read']:.2f} من اقرأ"
          f" و{shift['paper_calc']:.2f} من احسب"
          + (f" · قُصّ إلى المجال: {shift['clipped']}" if shift["clipped"] else ""))

    report = build_report(data, app_tokens, siblings, floor, opacity, shift, cands)
    for cand in cands:
        print(f"\n— «{cand['name']}» ({cand['id']}) —")
        for ground, m in report[cand["id"]].items():
            print(f"  · الأرضية {ground}: حبرٌ على ورق {m['ink_paper']:.2f}:١ ·"
                  f" تمايزُ المراحل {m['pairwise']:.1f} ·"
                  f" ورقٌ عن اقرأ {m['paper_read']:.1f}")
            for line in m["complaints"]:
                print(f"    ⚠ {line}")

    if args.numbers:
        return 0

    print("\n— اللقطات —")
    fails = capture_all(cands, args.port, args.timeout, data, shift,
                        seed_tokens(app_tokens, siblings))
    if not args.only:
        PANEL.write_text(panel_text(data, app_tokens, siblings, floor, report, opacity, shift),
                         encoding="utf-8")
        print(f"\nاللوحة: {PANEL.relative_to(ROOT)}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
