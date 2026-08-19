#!/usr/bin/env python3
"""**مقاييسُ المرجع الكتابيّ** — الحجمُ والجلوسُ يُقاسان من صفحات `docs/naskh/` (بند ص٢/أ).

    python3 tools/naskh_metrics.py --self-test     # حارسُ الأداة (بلا صور)
    python3 tools/naskh_metrics.py --build         # يقيس الصفحات الستّ → tools/naskh_metrics.json
    python3 tools/naskh_metrics.py --board         # لوحُ التحقّق → scratch/naskh_metrics.png
    python3 tools/naskh_metrics.py --report        # تقريرُ الفرق: نسبتُنا اليوم مقابل المرجع

**لماذا أداةٌ لا عين؟** (`SESSIONS.md` ص٢/أ) — أمرُ المالك (١٩ أغسطس ٢٠٢٦): «اجعل شكلَ الحرف
أقربَ للمرجع… أقصد شكلَ الحروف **وحجمَها**». والحجمُ والجلوسُ رقمان لا انطباعان، فيُقاسان
بالمسطرة من الصفحة: **خطُّ الأساس المنقّط** يمرّ بالصفّ كلِّه، فلكلِّ شكلٍ ارتفاعٌ فوقه ونزولٌ تحته.

**والوحدةُ واحدةٌ للهجاء كلِّه**: ارتفاعُ الألف المعزولة في ص٥٩ = ١٫٠٠ — نظيرُ «الوحدةُ سطرُ
الكتابة لا الحرف» (`STROKE_ORDER §٧د`)، فلا يُنسَب حرفٌ إلى نفسِه.

**وبلا مكتباتٍ خارجية** (سنّةُ `tools/`: صفرُ `pip` في الأداة كلِّها): يُفَكّ الـJPEG بـ`sips`
(أداةُ النظام — تبعيةٌ معلَنة كما مُشغِّلُ Chrome في `browser_test`) إلى BMP، ويُقرأ بـ`struct`.

⚠ **وصورُ `docs/naskh/` محفوظةُ الحقوق وخارجَ المستودع** (`.gitignore`): تُقرأ وتُقاس، ولا تُنسَخ
ولا يخرج في اللوح إلا **الحبرُ المعتَّب** — وهو المقيسُ نفسُه، فرؤيتُه شرطُ التحقّق.
"""

import argparse
import hashlib
import json
import re
import struct
import subprocess
import sys
import zlib
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_paths  # noqa: E402  (جدولُ الحقيقة الإملائية وقارئُ paths.js — من موضعٍ واحد)

ROOT = Path(__file__).resolve().parent.parent
NASKH = ROOT / "docs" / "naskh"
CACHE = ROOT / "tools" / ".cache" / "naskh"
OUT_JSON = ROOT / "tools" / "naskh_metrics.json"
OUT_BOARD = ROOT / "scratch" / "naskh_metrics.png"
# بصمةُ الأداة نفسِها: تغييرُ الشيفرة يُبطل نقاطَ التفتيش المحفوظة فلا يُقاس بعُدّتين.
TOOL_SHA = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()[:12]

# ————— حدودٌ معلَنة، كلُّها مقيسةٌ من الصفحات لا مختارةٌ ذوقاً —————
# **عتبتان لا واحدة، وهذا مفتاحُ الأداة كلِّها**: الخطُّ المنقّط **رماديٌّ أفتحُ من الحبر**
# (أدكنُ بكسلاته ٩١ و١٠٨ في العيّنتين النظيفتين، ومئينُه الخامس ١٢٦)، وحبرُ الحرف أسودُ
# صريح (أدكنُه ٠–١ وجمهورُه دون ٤٠)، والعلامةُ المائية ٢١٦–٢٣٢، والورقُ ٢٤٠.
#   ⇐ فبعتبةِ ١٢٨ **يُرى الخطُّ** فيُكشَف موضعُه، وبعتبةِ ٩٠ **يغيب الخطُّ ويبقى الحرف**
#     فيُقاس الحرفُ وحدَه. **ولا يُمحى شيءٌ بيدٍ ولا يُقصّ من الصورة** — عتبتان لا مقصّ.
INK = 90             # عتبةُ قياس الحرف — دونها الخطُّ المنقّط والعلامةُ المائية
LINE_INK = 128       # عتبةُ كشف الخطّ المنقّط وحدَه
HEADER_Y = 250       # ما فوقه ترويسةُ الصفحة (سطرُها المنقّط البنفسجيّ على y=192 في الستّ كلِّها)
LINE_RUNS = 60       # أقلُّ عددِ شُرَطٍ يجعل السطرَ خطَّ أساس (أعلى ما سواه ٣٧)
LINE_SPAN = 0.72     # ويمتدّ عرضَ الصفحة
LINE_BAND = 3        # سُمكُه، فأسطرُه المتجاورةُ خطٌّ واحد
STRADDLE = 6         # سماحةُ «الجسمُ يعبر خطَّ الأساس»
MIN_BODY = 400       # أقلُّ مساحةِ مركّبٍ يصلح **بذرةَ شكل** (الأرقامُ والأسهمُ دونها)
MIN_PART = 40         # وأقلُّ ما يُحسَب من حبر الشكل — وما دونه غبارُ مسحٍ لا حبر
MIN_DOT = 100        # أقلُّ مساحةِ مركّبٍ يصلح نقطةَ إعجام
SEED_PAD = 25        # مدى بذرة الشكل أفقياً: ما جاوزه فليس من حبره
DOT_SPAN = 0.30      # وعنقودُ النقط لا يتجاوز هذا من ارتفاع الألف (ث ثلاثٌ في مثلّث)
ALIF_PX_HINT = 216   # ارتفاعُ الألف بالبكسل تقريباً — لا يُقاس به شيء، وإنّما يُحَدّ به مدى النقطة
EDGE = 4             # حافّةُ المسح: عمودٌ أسودُ على طرف الورقة في ص٦٢ — ورقٌ لا حبرُ حرف

# ————— جردُ الصفحات: ما فيها من حروفٍ بترتيب صفوفها من أعلى الصفحة —————
# (`STROKE_ORDER §٧ج` — «حلقة هداية · Calligraphy 2»، الصفحات ٥٧–٦٢)
PAGES = [
    {"file": "١.jpg", "page": 57, "rows": ["ب", "ت", "ث", "ن", "ي"]},
    {"file": "٢.jpg", "page": 58, "rows": ["ج", "ح", "خ", "ه", "م"]},
    {"file": "٣.jpg", "page": 59, "rows": ["ا", "د", "ذ", "ر", "ز", "و"]},
    {"file": "٤.jpg", "page": 60, "rows": ["س", "ش", "ص", "ض"]},
    {"file": "٥.jpg", "page": 61, "rows": ["ف", "ق", "ك", "ل"]},
    {"file": "٦.jpg", "page": 62, "rows": ["ط", "ظ", "ع", "غ"]},
]
FORMS = ["isolated", "initial", "medial", "final"]
# والصفُّ يُقرأ من اليمين: معزول ← ابتدائي ← وسطي ← نهائي.

# **جهةُ نقط الإعجام** — حقيقةٌ إملائيةٌ لا قياس: عددُها من `check_paths.DOTS_OF`.
DOTS_UNDER = {"ب", "ي", "ج"}

# **صفوفٌ عددُ أشكالها ليس أربعة** — تُعلَن بأعيانها فلا يُخمَّن:
#   ا: عمودُ «الابتدائي» فيه **نصٌّ** لا شكل («لا تأتي الألف في بداية الكلمة») ⇒ `null`.
#   ه: الصفحةُ ترسم **خمسةَ أشكال** (وسطيٌّ بديل) — يُقيَّد الخامسُ ولا يُدخَل الأربعةَ.
ROW_NOTES = {
    "ا": {"slots": 3, "map": ["isolated", "medial", "final"],
          "gap": "initial", "why": "عمودُ الابتدائي نصٌّ لا شكل: «لا تأتي الألف في بداية الكلمة»"},
    "ه": {"slots": 5, "map": ["isolated", "initial", "medial", "medial_alt", "final"],
          "why": "صفُّ الهاء **خمسةُ أشكالٍ مرسومة** — والوسطيُّ عمودان، فالثاني `medial_alt`"},
}


# ═══════════ ١) قراءةُ الصفحة: sips → BMP → بِتاتُ حبر ═══════════

def _sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def load_ink(path: Path, thr: int = INK) -> tuple:
    """(العرض، الارتفاع، صفوفُ الحبر) — كلُّ صفٍّ `bytes` فيه ١ حيث الحبر.

    **والعتبةُ تُسقط العلامةَ المائية** (رماديةٌ ٢١٦–٢٣٢) وتُبقي الحبرَ (دون ١٠٠).
    """
    CACHE.mkdir(parents=True, exist_ok=True)
    bmp = CACHE / (path.stem + "." + _sha(path) + ".bmp")
    if not bmp.exists():
        for stale in CACHE.glob(path.stem + ".*.bmp"):
            stale.unlink()
        run = subprocess.run(["sips", "-s", "format", "bmp", str(path), "--out", str(bmp)],
                             capture_output=True)
        if run.returncode or not bmp.exists():
            sys.exit(f"لم يفكّ `sips` الصورةَ {path.name}: {run.stderr.decode()[:200]}")
    data = bmp.read_bytes()
    if data[:2] != b"BM":
        sys.exit(f"ليست BMP: {bmp.name}")
    off = struct.unpack("<I", data[10:14])[0]
    width, height = struct.unpack("<ii", data[18:26])
    bpp = struct.unpack("<H", data[28:30])[0]
    comp = struct.unpack("<I", data[30:34])[0]
    if bpp != 24 or comp != 0:
        sys.exit(f"صيغةُ BMP غيرُ متوقَّعة في {bmp.name} (bpp={bpp} comp={comp})")
    top_down = height < 0
    height = abs(height)
    stride = (width * 3 + 3) // 4 * 4
    table = bytes(1 if i < thr else 0 for i in range(256))
    rows = []
    for y in range(height):
        src = off + (y if top_down else height - 1 - y) * stride
        rows.append(data[src:src + width * 3][1::3].translate(table))   # القناةُ الوسطى تكفي
    return width, height, rows


# ═══════════ ٢) خطُّ الأساس المنقّط ═══════════

def row_runs(row: bytes) -> list:
    """[(بداية، نهاية)] لكلِّ شرطةِ حبرٍ متّصلةٍ في السطر — بلا مكتبات ولا حلقةِ بكسل."""
    out, i, n = [], 0, len(row)
    while True:
        a = row.find(1, i)
        if a < 0:
            return out
        b = row.find(0, a + 1)
        if b < 0:
            b = n
        out.append((a, b))
        i = b


def baselines(width: int, height: int, rows: list) -> list:
    """أسطرُ الأساس المنقّطة: تمتدّ عرضَ الصفحة وشُرَطُها كثيرة — وترويسةُ الصفحة تُستثنى."""
    cand = []
    for y in range(HEADER_Y, height):
        runs = row_runs(rows[y])
        if len(runs) < LINE_RUNS:
            continue
        if runs[-1][1] - runs[0][0] < LINE_SPAN * width:
            continue
        cand.append((y, len(runs)))
    out = []
    for y, n in cand:
        if out and y - out[-1][0] <= LINE_BAND + 1:
            if n > out[-1][1]:
                out[-1] = (y, n)
        else:
            out.append((y, n))
    return [y for y, _ in out]


# ═══════════ ٣) المركّبات المتّصلة (بالشُّرَط، لا بالبكسل) ═══════════

def components(rows: list, y0: int, y1: int) -> list:
    """[{x0,x1,y0,y1,area}] — اتّحادُ شُرَطِ الحبر المتلامسة بين سطرٍ وسطر (٨-جوار)."""
    parent = []

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def union(i, j):
        a, b = find(i), find(j)
        if a != b:
            parent[max(a, b)] = min(a, b)

    runs, prev = [], []
    for y in range(y0, y1):
        cur = []
        for a, b in row_runs(rows[y]):
            idx = len(runs)
            parent.append(idx)
            runs.append((y, a, b))
            cur.append((a, b, idx))
            for pa, pb, pidx in prev:
                if pa <= b and a <= pb:            # تلامسٌ أو تجاورٌ قُطريّ
                    union(idx, pidx)
        prev = cur
    boxes = {}
    for idx, (y, a, b) in enumerate(runs):
        r = find(idx)
        box = boxes.get(r)
        if box is None:
            boxes[r] = {"x0": a, "x1": b, "y0": y, "y1": y + 1, "area": b - a}
        else:
            box["x0"] = min(box["x0"], a)
            box["x1"] = max(box["x1"], b)
            box["y1"] = y + 1
            box["area"] += b - a
    return sorted(boxes.values(), key=lambda c: c["x0"])


# ═══════════ ٤) قسمةُ الصفّ أشكالاً ═══════════

def cluster(bodies: list, gap: float) -> list:
    """يُجمَع ما تلاصق أفقياً؛ والفجوةُ حدُّ القسمة."""
    groups = []
    for comp in sorted(bodies, key=lambda c: c["x0"]):
        if groups and comp["x0"] - groups[-1]["x1"] <= gap:
            g = groups[-1]
            g["x0"] = min(g["x0"], comp["x0"])
            g["x1"] = max(g["x1"], comp["x1"])
            g["y0"] = min(g["y0"], comp["y0"])
            g["y1"] = max(g["y1"], comp["y1"])
            g["parts"].append(comp)
        else:
            groups.append({"x0": comp["x0"], "x1": comp["x1"], "y0": comp["y0"],
                           "y1": comp["y1"], "parts": [comp]})
    return groups


def split_row(bodies: list, want: int) -> tuple:
    """يُقسَم الصفُّ إلى `want` شكلاً **بأوسع فجواته** — لا بعتبةٍ تُختار.

    ويُرجَع (المجموعات، فجوةُ القسمة، أضيقُ فجوةٍ داخل شكل) — والأخيرةُ سندُ الثقة.
    """
    if len(bodies) < want:
        return cluster(bodies, 0), None, None
    gaps = []
    order = sorted(bodies, key=lambda c: c["x0"])
    reach = order[0]["x1"]
    for comp in order[1:]:
        gaps.append(max(0, comp["x0"] - reach))
        reach = max(reach, comp["x1"])
    if not gaps:
        return cluster(bodies, 0), None, None
    ranked = sorted(gaps, reverse=True)
    cut = ranked[want - 2] if want >= 2 and len(ranked) >= want - 1 else 0
    inner = ranked[want - 1] if len(ranked) >= want else 0
    return cluster(bodies, max(0, cut - 1)), cut, inner


# ═══════════ ٥) القياس ═══════════

def row_bands(rows: list, lines: list, height: int, width: int) -> list:
    """حدودُ كلِّ صفّ: **أوسعُ فراغٍ خالٍ من الحبر** بين خطَّي أساسٍ متجاورين، لا منتصفَهما.

    **ولمَ لا المنتصف؟** لأنّ عمودَ الظاء يرتفع فوق منتصف ما بينه وبين الطاء — فمنتصفٌ
    هندسيّ يقصّ الحرفَ نصفين. **والفراغُ يقوله الورقُ نفسُه.**
    """
    # وحافّةُ المسح لا تُعَدّ حبراً، وإلّا لم يخلُ سطرٌ في ص٦٢ فلم يُقسَم صفٌّ
    filled = [any(b > EDGE and a < width - EDGE for a, b in row_runs(row)) for row in rows]
    cuts = []
    for a, b in zip([HEADER_Y] + lines, lines):
        best, run, start = None, 0, None
        for y in range(a + 1, b):
            if filled[y]:
                run, start = 0, None
                continue
            if start is None:
                start = y
            run = y - start + 1
            if best is None or run > best[1] - best[0]:
                best = (start, y)
        if best is None:
            sys.exit(f"لا فراغَ بين خطَّي الأساس {a} و{b} — ولا تُقسَم الصفوفُ بلا فراغ")
        cuts.append((best[0] + best[1]) // 2)
    cuts.append(height)
    return list(zip(cuts, cuts[1:]))


def dots_of_shape(letter: str, parts: list, base: int, unit: float) -> list:
    """**نقطُ الإعجام**: تُعرَف بحقيقتها الإملائية (`DOTS_OF` وجهتُها) **وبأنّها أقصى الحبر**
    في جهتها — لا بالجوار، فسهمُ الحرف ورقمُه أقربُ إلى جسمه من نقطته.

    والعنقودُ يُؤخذ كتلةً واحدة (`DOT_SPAN`): فثلاثُ الثاء مثلّثٌ لا صفٌّ واحد.
    """
    want = check_paths.DOTS_OF.get(letter, 0)
    if not want or len(parts) < 2:
        return []
    under = letter in DOTS_UNDER
    core = max(parts, key=lambda c: c["area"])
    pool = [c for c in parts
            if c is not core and c["area"] >= MIN_DOT
            and (c["y0"] >= base if under else c["y1"] <= base)]
    if not pool:
        return []
    edge = max(c["y1"] for c in pool) if under else min(c["y0"] for c in pool)
    span = DOT_SPAN * unit
    keep = (lambda c: c["y0"] >= edge - span) if under else (lambda c: c["y1"] <= edge + span)
    return [c for c in pool if keep(c)]


def measure_page(spec: dict, note: callable) -> dict:
    path = NASKH / spec["file"]
    if not path.exists():
        sys.exit(f"صورةُ المرجع غائبة: {path} — و`docs/naskh/` خارجَ المستودع بحقّ")
    width, height, ruled = load_ink(path, LINE_INK)      # يُرى فيها الخطُّ المنقّط
    lines = baselines(width, height, ruled)
    note(f"    خطوطُ أساسٍ: {len(lines)} على y={lines}")
    if len(lines) != len(spec["rows"]):
        sys.exit(f"ص{spec['page']}: كُشف {len(lines)} خطَّ أساسٍ والصفوفُ {len(spec['rows'])}")
    _, _, rows = load_ink(path, INK)                     # ويغيب فيها فيُقاس الحرفُ وحدَه
    bands = row_bands(rows, lines, height, width)

    out = {"page": spec["page"], "file": spec["file"], "sha": _sha(path),
           "width": width, "height": height, "rows": []}
    for i, letter in enumerate(spec["rows"]):
        base, (y0, y1) = lines[i], bands[i]
        comps = [c for c in components(rows, y0, y1)
                 if c["area"] >= MIN_PART and c["x0"] > EDGE and c["x1"] < width - EDGE]
        seeds = [c for c in comps if c["area"] >= MIN_BODY
                 and c["y0"] <= base + STRADDLE and c["y1"] >= base - STRADDLE]
        want = ROW_NOTES.get(letter, {}).get("slots", 4)
        groups, cut, inner = split_row(seeds, want)
        groups = sorted(groups, key=lambda g: -g["x0"])           # الصفُّ يُقرأ من اليمين
        # **الحبرُ يُنسَب إلى شكلٍ بمدى بذرته لا بمنتصف ما بين عمودين**: سهمُ الحرف ورقمُه
        # ونقطتُه كلُّها في مدى بذرته أو دونه بقليل، **وما جاوزه فليس من حبره** —
        # وبهذا يخرج من الحساب لافتةُ «مراجعة» في ص٥٧ ونصُّ «لا تأتي الألف» في ص٥٩،
        # **بلا استثناءٍ مكتوبٍ لواحدةٍ منهما**.
        row = {"letter": letter, "baseline": base, "band": [y0, y1],
               "cut_gap": cut, "inner_gap": inner, "shapes": [], "loose": []}
        forms = ROW_NOTES.get(letter, {}).get("map", FORMS)
        used = set()
        for j, g in enumerate(groups):
            parts = [c for c in comps
                     if c["x0"] >= g["x0"] - SEED_PAD and c["x1"] <= g["x1"] + SEED_PAD]
            used |= {id(c) for c in parts}
            dots = dots_of_shape(letter, parts, base, ALIF_PX_HINT)
            body = [c for c in parts if c not in dots]
            row["shapes"].append({
                "form": forms[j] if j < len(forms) else f"alt{j - len(forms) + 1}",
                "body": span_of(body), "full": span_of(parts),
                "dots_found": len(dots), "dots_want": check_paths.DOTS_OF.get(letter, 0),
                "dots_box": span_of(dots) if dots else None,
                "parts": len(parts),
            })
        row["loose"] = [c for c in comps if id(c) not in used]
        out["rows"].append(row)
        got = len(groups)
        flag = "" if got == want else f"  ⚠ أشكالُه {got} والمنتظَرُ {want}"
        note(f"    {letter}: y={base} نطاق=[{y0}..{y1}] أشكالٌ={got}"
             f" فجوةُ القسمة={cut} داخلَ الشكل={inner} سائبٌ={len(row['loose'])}{flag}")
    return out


def span_of(comps: list) -> dict:
    return {"x0": min(c["x0"] for c in comps), "x1": max(c["x1"] for c in comps),
            "y0": min(c["y0"] for c in comps), "y1": max(c["y1"] for c in comps)}



def build(pages=None) -> dict:
    """يقيس الصفحات **صفحةً صفحة ويحفظ كلَّ واحدةٍ عند إتمامها** — فالجزءُ الأخضر لا يُعاد
    (عهدُ «الأداةُ تنبض وتستأنف»)."""
    CACHE.mkdir(parents=True, exist_ok=True)
    got = {}
    for spec in PAGES:
        if pages and spec["page"] not in pages:
            continue
        stamp = CACHE / f"page{spec['page']}.json"
        src = NASKH / spec["file"]
        if stamp.exists():
            saved = json.loads(stamp.read_text(encoding="utf-8"))
            if saved.get("sha") == _sha(src) and saved.get("tool") == TOOL_SHA:
                print(f"  ✓ ص{spec['page']} ({spec['file']}) — محفوظةٌ سلفاً، لا تُعاد")
                got[spec["page"]] = saved
                continue
        print(f"  ▸ ص{spec['page']} ({spec['file']}) — تُقاس…", flush=True)
        page = measure_page(spec, lambda m: print(m, flush=True))
        page["tool"] = TOOL_SHA
        stamp.write_text(json.dumps(page, ensure_ascii=False), encoding="utf-8")
        got[spec["page"]] = page
    return got


def alif_unit(pages: dict) -> float:
    """**وحدةُ القياس**: ارتفاعُ الألف المعزولة في ص٥٩ — جسمُها، بلا نقطٍ ولا سهم."""
    for row in pages[59]["rows"]:
        if row["letter"] != "ا":
            continue
        for shape in row["shapes"]:
            if shape["form"] == "isolated":
                return float(shape["body"]["y1"] - shape["body"]["y0"])
    sys.exit("لم تُقَس ألفُ ص٥٩ — ولا وحدةَ قياسٍ بدونها")


# ═══════════ ٦) الضربات: تُنقَل من NASKH_CROSS.md، ولا تُستنبَط من الصورة ═══════════
# **السندُ `docs/NASKH_CROSS.md`** (١٩ أغسطس ٢٠٢٦) — والمقاطعةُ ثلاثةُ أقسام:
#   §١ ما يوافق بناءَنا ⇒ عددُ ضربات المرجع = **عددُ ضرباتنا، يُحسب من `paths.js` ولا يُكتب**.
#   §٢ إحدى وعشرون رفعةً زائدة ⇒ عددُ المرجع **مكتوبٌ في جدولها**.
#   §٣ أربعةٌ حكمَ فيها المالكُ لبنائنا على قراءة الصفحة ⇒ عددُنا.
# وما لم تسمِّه المقاطعةُ يبقى `null` — **لا حكمَ بلا سند**.
CROSS_AGREE = {          # §١ + §٣: عددُ المرجع = عددُنا (يُحسب من paths.js)
    "ب": FORMS, "ت": FORMS, "ن": FORMS, "ي": FORMS, "ر": FORMS, "ز": FORMS,
    "و": FORMS, "ا": FORMS, "ف": FORMS, "ق": FORMS,
    "ج": FORMS, "ح": FORMS, "خ": FORMS,
    "ث": ["isolated", "initial", "medial"],
    "ه": ["isolated", "initial", "final"],
    "م": ["isolated", "initial"],
    "س": ["isolated", "initial", "final"],
    "ش": ["isolated", "initial"],
    "ل": ["isolated", "initial"],
    "ع": ["isolated", "medial", "final"],
    "ص": ["isolated"],
    "ض": ["isolated", "initial"],
    "ط": ["isolated", "initial"],
    "ظ": ["isolated", "initial"],
    "ك": ["isolated", "initial", "medial"],
    "د": ["medial", "final"],       # §٣ — حكمُ المالك مقدَّمٌ على قراءة الصفحة
    "ذ": ["medial", "final"],
}
CROSS_REF = {            # §٢: عددُ المرجع مكتوبٌ في جدول الرفعات الزائدة
    ("ث", "final"): 1, ("ه", "medial"): 1, ("م", "medial"): 1, ("م", "final"): 1,
    ("س", "medial"): 1, ("ش", "medial"): 1, ("ش", "final"): 1,
    ("ل", "medial"): 1, ("ل", "final"): 1,
    ("ع", "initial"): 1, ("غ", "initial"): 1,
    ("ص", "initial"): 1, ("ص", "medial"): 1, ("ص", "final"): 1,
    ("ض", "medial"): 1, ("ض", "final"): 1,
    ("ك", "final"): 2,
    ("ط", "medial"): 2, ("ط", "final"): 2, ("ظ", "medial"): 2, ("ظ", "final"): 2,
}
CROSS_SILENT = {         # ما لم تسمِّه المقاطعةُ في أيٍّ من أقسامها الثلاثة
    ("د", "isolated"), ("د", "initial"), ("ذ", "isolated"), ("ذ", "initial"),
    ("غ", "isolated"), ("غ", "medial"), ("غ", "final"),
}


# 🔑 **وأربعةٌ سمّاها المالكُ بعدده** (`NASKH_CROSS §٥`، ١٩ أغسطس ٢٠٢٦) — **وحكمُه
# مقدَّمٌ على قراءة §٢**: هي قرأت الوسطيَّ ضربةً واحدة، **وهو يميّز مدخلَ الوصل من
# جسم الحرف** فيجعله اثنتين. ⇐ فيُقرأ من هنا لا من الجدول، **ولا يعود البناءُ
# يمحوه** (مُحي مرّةً حين أُعيد `--build`).
CROSS_OWNER = {
    ("ص", "initial"): 1, ("ص", "medial"): 2,
    ("ض", "initial"): 1, ("ض", "medial"): 2,
}


def strokes_of(letter: str, form: str, ours: dict) -> tuple:
    """(عددُ ضربات المرجع، سندُه) — أو (None، علّةُ التعذّر)."""
    if (letter, form) in CROSS_OWNER:
        return CROSS_OWNER[(letter, form)], ("NASKH_CROSS §٥ — حكمُ المالك"
                                             " (مدخلُ الوصل ضربةٌ مستقلّة)")
    if (letter, form) in CROSS_REF:
        return CROSS_REF[(letter, form)], "NASKH_CROSS §٢ (جدولُ الرفعات الزائدة)"
    if form in CROSS_AGREE.get(letter, ()):
        shape = ours.get(letter, {}).get(form)
        if shape is None:
            return None, "موافقٌ في NASKH_CROSS §١ ولا شكلَ له في paths.js"
        sec = "§٣ (حكمُ المالك)" if letter in ("د", "ذ") else "§١ (الموافق)"
        return len(shape["strokes"]), f"NASKH_CROSS {sec} ⇐ عددُنا من paths.js"
    if (letter, form) in CROSS_SILENT:
        return None, "لم تسمِّه NASKH_CROSS في أقسامها الثلاثة — ولا يُخمَّن"
    return None, "خارجَ جرد NASKH_CROSS"


# ═══════════ ٧) الجدول: ١١٢ شكلاً، والمتعذّرُ `null` بعلّته ═══════════

def dots_note(shape: dict) -> dict:
    """**صدقُ عزل النقط يُعلَن، ولا يُسكَت عنه**: عنقودُ النقط قد يُرسَم متلاصقاً فيُعَدّ
    مركّباً واحداً — والصندوقُ صحيحٌ حينئذٍ. **وإنّما يفسد `body_*`** إن لم تُعزَل نقطةٌ
    ألبتّة (فيدخل نقطُه في جسمه) أو عُزل أكثرُ من عدده (فخرج من جسمه ما ليس نقطة).
    """
    found, want = shape["dots_found"], shape["dots_want"]
    trusted = (found == want) or (0 < found < want)
    note = None
    if want and not found:
        note = "لم تُعزَل نقطتُه — فـ`body_*` يشمل نقطَه"
    elif found > want:
        note = f"عُزل {found} مركّباً ونقطُه {want} — فقد يخرج من جسمه ما ليس نقطة"
    elif found < want:
        note = f"نقطُه {want} في {found} مركّبٍ — عنقودٌ متلاصق، والصندوقُ صحيح"
    return {"found": found, "want": want, "body_trusted": trusted, "note": note}


def emit(pages: dict) -> dict:
    """جدولُ ١١٢ شكلاً — **لا ينقص واحد**، والمتعذّرُ `null` بعلّته المكتوبة."""
    unit = alif_unit(pages)
    ours = check_paths.load_paths()
    table, missing, extra = [], [], []
    for spec in PAGES:
        page = pages[spec["page"]]
        rows = {r["letter"]: r for r in page["rows"]}
        for letter in spec["rows"]:
            row = rows[letter]
            found = {s["form"]: s for s in row["shapes"]}
            for form, shape in found.items():
                if form in FORMS:
                    continue
                extra.append({"letter": letter, "form": form, "page": page["page"],
                              "up": round((row["baseline"] - shape["full"]["y0"]) / unit, 4),
                              "down": round((shape["full"]["y1"] - row["baseline"]) / unit, 4),
                              "width": round((shape["full"]["x1"] - shape["full"]["x0"]) / unit, 4),
                              "why": ROW_NOTES.get(letter, {}).get("why", "")})
            for form in FORMS:
                strokes, why = strokes_of(letter, form, ours)
                rec = {"letter": letter, "form": form, "page": page["page"],
                       "strokes": strokes, "strokes_source": why}
                shape = found.get(form)
                if shape is None:
                    note = ROW_NOTES.get(letter, {})
                    rec.update({"up": None, "down": None, "width": None,
                                "body_up": None, "body_down": None, "body_width": None,
                                "measured": False,
                                "why": note.get("why") if note.get("gap") == form
                                       else "لم يُرسَم له شكلٌ في الصفّ"})
                    missing.append(rec)
                else:
                    base, body, full = row["baseline"], shape["body"], shape["full"]
                    rec.update({
                        "up": round((base - full["y0"]) / unit, 4),
                        "down": round((full["y1"] - base) / unit, 4),
                        "width": round((full["x1"] - full["x0"]) / unit, 4),
                        "body_up": round((base - body["y0"]) / unit, 4),
                        "body_down": round((body["y1"] - base) / unit, 4),
                        "body_width": round((body["x1"] - body["x0"]) / unit, 4),
                        "measured": True,
                        "dots": dots_note(shape),
                        "px": {"baseline": base, **{k: full[k] for k in ("x0", "x1", "y0", "y1")}},
                        # **وصندوقُ نقطه بعينه** (ملاحظةُ المالك ٢، `NASKH_CROSS §٥`):
                        # الفرقُ بين `up` و`body_up` **حافّةُ النقطة لا مركزُها**،
                        # ونقطُنا **مركزٌ لا صندوق** — فلا يُقابَل مركزٌ بحافّة.
                        # ⇐ فيُكتب صندوقُ النقط ليُقرأ منه **مركزُها** ويُنزَّل عليه.
                        "dots_px": (dict(shape["dots_box"]) if shape.get("dots_box") else None),
                    })
                table.append(rec)
    return {
        "سند": "docs/naskh/ — «حلقة هداية · Calligraphy 2»، ص٥٧–٦٢ (`STROKE_ORDER §٧ج`)",
        "الوحدة": "ارتفاعُ الألف المعزولة في ص٥٩ = ١٫٠٠ — مقياسٌ واحدٌ للهجاء كلِّه",
        "alif_px": unit,
        "منهج": {
            "عتبة الحرف": INK, "عتبة الخطّ المنقّط": LINE_INK,
            "up": "أعلى حبر الشكل فوق خطّ الأساس ÷ ارتفاع الألف",
            "down": "أدنى حبره تحت خطّ الأساس ÷ ارتفاع الألف",
            "width": "عرضُ حبره ÷ ارتفاع الألف",
            "body_*": "الشكلُ بلا نقط الإعجام — وهو المقيسُ في تقرير الفرق",
            "strokes": "منقولٌ من docs/NASKH_CROSS.md ولا يُستنبَط من الصورة",
        },
        "عدد": len(table),
        "مقيس": sum(1 for r in table if r["measured"]),
        "متعذّر": [{"letter": r["letter"], "form": r["form"], "why": r["why"]} for r in missing],
        "بلا سند ضربات": [{"letter": r["letter"], "form": r["form"], "why": r["strokes_source"]}
                          for r in table if r["strokes"] is None],
        "جسمٌ لم يُنقَّ من نقطه": [{"letter": r["letter"], "form": r["form"], "why": r["dots"]["note"]}
                                  for r in table if r.get("dots") and not r["dots"]["body_trusted"]],
        "أشكال زائدة في الصفحة": extra,
        "الجدول": table,
        "الصفحات": [{"page": p["page"], "file": p["file"], "sha": p["sha"],
                     "baselines": [r["baseline"] for r in p["rows"]],
                     "أشكال": sum(len(r["shapes"]) for r in p["rows"])}
                    for p in (pages[k] for k in sorted(pages))],
    }



# ═══════════ ٨) لوحُ التحقّق ═══════════

FONT = {  # ٣×٥ — يكفي رقماً ونقطةً، فاللوحُ يُقرأ بالعين لا يُقرأ نصّاً
    "0": ("111", "101", "101", "101", "111"), "1": ("010", "110", "010", "010", "111"),
    "2": ("111", "001", "111", "100", "111"), "3": ("111", "001", "111", "001", "111"),
    "4": ("101", "101", "111", "001", "001"), "5": ("111", "100", "111", "001", "111"),
    "6": ("111", "100", "111", "101", "111"), "7": ("111", "001", "010", "010", "010"),
    "8": ("111", "101", "111", "101", "111"), "9": ("111", "101", "111", "001", "111"),
    ".": ("000", "000", "000", "000", "010"), "-": ("000", "000", "111", "000", "000"),
    "/": ("001", "001", "010", "100", "100"), " ": ("000", "000", "000", "000", "000"),
    "*": ("101", "010", "111", "010", "101"),
}


class Canvas:
    def __init__(self, width: int, height: int):
        self.w, self.h = width, height
        self.px = bytearray(b"\xff" * (width * height * 3))

    def dot(self, x: int, y: int, rgb: tuple) -> None:
        if 0 <= x < self.w and 0 <= y < self.h:
            i = (y * self.w + x) * 3
            self.px[i:i + 3] = bytes(rgb)

    def rect(self, x0: int, y0: int, x1: int, y1: int, rgb: tuple) -> None:
        for x in range(x0, x1 + 1):
            self.dot(x, y0, rgb)
            self.dot(x, y1, rgb)
        for y in range(y0, y1 + 1):
            self.dot(x0, y, rgb)
            self.dot(x1, y, rgb)

    def hline(self, x0: int, x1: int, y: int, rgb: tuple, dash: int = 0) -> None:
        for x in range(x0, x1 + 1):
            if dash and (x // dash) % 2:
                continue
            self.dot(x, y, rgb)

    def text(self, x: int, y: int, msg: str, rgb: tuple, scale: int = 2) -> None:
        for ch in msg:
            glyph = FONT.get(ch, FONT[" "])
            for gy, line in enumerate(glyph):
                for gx, bit in enumerate(line):
                    if bit == "1":
                        for sy in range(scale):
                            for sx in range(scale):
                                self.dot(x + gx * scale + sx, y + gy * scale + sy, rgb)
            x += 4 * scale

    def png(self, path: Path) -> None:
        raw = bytearray()
        stride = self.w * 3
        for y in range(self.h):
            raw.append(0)
            raw += self.px[y * stride:(y + 1) * stride]
        def chunk(kind, body):
            return (struct.pack(">I", len(body)) + kind + body
                    + struct.pack(">I", zlib.crc32(kind + body) & 0xFFFFFFFF))
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(
            b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", self.w, self.h, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(bytes(raw), 6))
            + chunk(b"IEND", b""))


BLACK, RED, BLUE, GREEN, GREY = (20, 20, 20), (220, 30, 30), (30, 90, 220), (20, 140, 60), (170, 170, 170)


def board(pages: dict, out: Path = OUT_BOARD, half: int = 2) -> None:
    """لوحُ التحقّق — **شرطُ قبولٍ لا زينة**: يُرى بالعين أنّ الصندوق أحاط بالحرف
    لا بالسهم ولا بالرقم. **والمعروضُ الحبرُ المعتَّب** (وهو المقيسُ نفسُه) لا الصورة."""
    unit = alif_unit(pages)
    cols, order = 3, sorted(pages)
    pw, ph = 0, 0
    inks = {}
    for pg in order:
        spec = next(s for s in PAGES if s["page"] == pg)
        w, h, rows = load_ink(NASKH / spec["file"], INK)
        inks[pg] = (w, h, rows)
        pw, ph = max(pw, w // half), max(ph, h // half)
    rows_n = (len(order) + cols - 1) // cols
    canvas = Canvas(cols * pw, rows_n * ph)
    for i, pg in enumerate(order):
        ox, oy = (i % cols) * pw, (i // cols) * ph
        w, h, ink = inks[pg]
        for y in range(h):                        # تصغيرٌ بالقصوى: الخطُّ الرفيع لا يضيع
            ty = oy + y // half
            for a, b in row_runs(ink[y]):
                for x in range(a, b):
                    canvas.dot(ox + x // half, ty, BLACK)
        for row in pages[pg]["rows"]:
            base = oy + row["baseline"] // half
            canvas.hline(ox, ox + w // half - 1, base, BLUE, dash=6)
            for j, shape in enumerate(row["shapes"], 1):
                bx, fx = shape["body"], shape["full"]
                canvas.rect(ox + fx["x0"] // half, oy + fx["y0"] // half,
                            ox + fx["x1"] // half, oy + fx["y1"] // half, RED)
                if bx != fx:
                    canvas.rect(ox + bx["x0"] // half, oy + bx["y0"] // half,
                                ox + bx["x1"] // half, oy + bx["y1"] // half, GREEN)
                up = (row["baseline"] - fx["y0"]) / unit
                dn = (fx["y1"] - row["baseline"]) / unit
                wd = (fx["x1"] - fx["x0"]) / unit
                label = "%d %02d/%02d/%02d" % (j, round(up * 100), round(dn * 100), round(wd * 100))
                canvas.text(ox + fx["x0"] // half, oy + fx["y0"] // half - 13, label, RED, scale=2)
        canvas.text(ox + 6, oy + 6, str(pg), GREY, scale=4)
    canvas.png(out)
    print(f"  🖼 اللوح: {out}  ({canvas.w}×{canvas.h})")


# ═══════════ ٩) تقريرُ الفرق: نسبتُنا اليوم مقابل نسبة المرجع ═══════════

def our_spans(paths: dict) -> dict:
    """صندوقُ كلِّ شكلٍ عندنا على شبكة ١٠٠٠×١٠٠٠ — الجسمُ وحدَه ثم الجسمُ ونقطُه."""
    out = {}
    for letter, forms in paths.items():
        for form, ref in forms.items():
            xs = [p[0] for st in ref["strokes"] for p in st["points"]]
            ys = [p[1] for st in ref["strokes"] for p in st["points"]]
            if not xs:
                continue
            box = {"h": max(ys) - min(ys), "w": max(xs) - min(xs)}
            dx = [d["at"][0] for d in ref.get("dots") or []]
            dy = [d["at"][1] for d in ref.get("dots") or []]
            box["full_h"] = max(ys + dy) - min(ys + dy)
            box["full_w"] = max(xs + dx) - min(xs + dx)
            out[(letter, form)] = box
    return out


def report(data: dict, top: int = 20) -> None:
    """**تقريرُ الفرق** — لا يعدّل شيئاً: يضع نسبتَنا اليوم بجانب نسبة المرجع ويطبع أشدَّها.

    ⚠ **وحدُّ المقابلة يُقال أوّلاً**: المرجعُ يرسم **حدَّي القلم** (كنتورَ الضربة)،
    ومسارُنا **خطُّ وسطها**. فصندوقُ المرجع أوسعُ بعرض السنّ في كلِّ جهة — **وعرضُ
    السنّ مقيسٌ لا مقدَّر**: عرضُ ألفِ المرجع نفسِه (وهي ضربةٌ مستقيمة، فعرضُها عرضُ سنِّه).
    فتُطبع المقابلةُ خاماً **ومصحَّحةً بالسنّ** معاً، ولا يُخفى أحدُهما.
    """
    paths = check_paths.load_paths()
    spans = our_spans(paths)
    alif = spans.get(("ا", "isolated"))
    if not alif:
        sys.exit("لا ألفَ في paths.js — ولا نسبةَ بلا مرجعٍ للوحدة")
    unit = alif["h"]
    nib = next(r["body_width"] for r in data["الجدول"]
               if r["letter"] == "ا" and r["form"] == "isolated")
    core = 1.0 - nib
    print("\n📐 تقريرُ الفرق — **نسبتُنا اليوم مقابل نسبة المرجع**")
    print(f"   وحدةُ المرجع: ارتفاعُ ألفه {data['alif_px']:.0f} بكسل = ١٫٠٠")
    print(f"   وحدتُنا: ارتفاعُ ألفنا {unit:.1f} من شبكة ١٠٠٠ = ١٫٠٠")
    print(f"   عرضُ سنّ المرجع: {nib:.3f} من ألفه (وهو عرضُ ألفه نفسِها)")
    print("   ⚠ **والجلوسُ لا يُقابَل ألبتّة**: بياناتُنا بلا خطّ أساس — كلُّ شكلٍ يُوسَّط في")
    print("     خليّته (`make_paths.html:289`)، فلا `up` عندنا ولا `down`. **وهذا نفسُه بندُ ص٢/ب**،")
    print("     فالمقابلةُ هنا في الارتفاع والعرض لا غير.\n")
    rows, skipped = [], []
    for rec in data["الجدول"]:
        key = (rec["letter"], rec["form"])
        mine = spans.get(key)
        if not rec["measured"] or mine is None:
            skipped.append((key, "لا قياسَ للمرجع" if not rec["measured"] else "لا شكلَ عندنا"))
            continue
        raw_h, raw_w = rec["body_up"] + rec["body_down"], rec["body_width"]
        ref_h, ref_w = max(0.0, raw_h - nib) / core, max(0.0, raw_w - nib) / core
        our_h, our_w = mine["h"] / unit, mine["w"] / unit
        rows.append({"key": key, "raw_h": raw_h, "raw_w": raw_w, "ref_h": ref_h, "ref_w": ref_w,
                     "our_h": our_h, "our_w": our_w, "dh": our_h - ref_h, "dw": our_w - ref_w,
                     "worst": max(abs(our_h - ref_h), abs(our_w - ref_w))})
    rows.sort(key=lambda r: -r["worst"])
    ratio = [r["our_h"] / r["ref_h"] for r in rows if r["ref_h"] > 0.05]
    over = [r for r in rows if r["dh"] > 0]
    print(f"   قُوبل {len(rows)} شكلاً، وتعذّر {len(skipped)}.")
    print(f"   **وسيطُ نسبةِ ارتفاعِنا إلى ارتفاعه ×{median(ratio):.2f}** —"
          f" وأكبرُ منه {len(over)} شكلاً وأصغرُ {len(rows) - len(over)}.")
    print(f"\n   أشدُّ {top} انحرافاً (بوحدة الألف، والمرجعُ مصحَّحٌ بعرض السنّ):")
    print("   الشكل             ارتفاعُنا  ارتفاعُه     Δ    عرضُنا   عرضُه      Δ")
    for r in rows[:top]:
        print("   %-4s %-11s %7.2f %8.2f %+7.2f %8.2f %8.2f %+7.2f"
              % (r["key"][0], r["key"][1], r["our_h"], r["ref_h"], r["dh"],
                 r["our_w"], r["ref_w"], r["dw"]))
    print("\n   🔴 **وأكبرُ ما عندنا من المرجع** — وهو وجهُ شكوى المالك بعينه"
          " («في الكانفس أكبرُ من اللازم»):")
    for r in sorted(over, key=lambda r: -r["dh"])[:10]:
        print("   %-4s %-11s ارتفاعُنا %.2f والمرجعُ %.2f (×%.2f)"
              % (r["key"][0], r["key"][1], r["our_h"], r["ref_h"],
                 r["our_h"] / r["ref_h"] if r["ref_h"] else 0))
    named = "دمريهع"
    print("\n   👁 **والستّةُ التي سمّاها المالك بعينها** (`STROKE_ORDER §٧`):")
    for ch in named:
        kin = [r for r in rows if r["key"][0] == ch]
        for r in sorted(kin, key=lambda r: FORMS.index(r["key"][1])):
            print("   %-4s %-11s ارتفاعُنا %.2f والمرجعُ %.2f (×%.2f)  عرضُنا %.2f والمرجعُ %.2f"
                  % (r["key"][0], r["key"][1], r["our_h"], r["ref_h"],
                     r["our_h"] / r["ref_h"] if r["ref_h"] else 0, r["our_w"], r["ref_w"]))
    big = [r for r in rows if r["ref_h"] > 1.25]
    if big:
        print(f"\n   ⓘ وفي المرجع نفسِه {len(big)} شكلاً يجاوز ارتفاعُه ألفَه بالربع فأكثر"
              " — **تُنقَل ولا تُصحَّح**، وهي التي لا تسعُها خليّةُ الألف:")
        for r in sorted(big, key=lambda r: -r["ref_h"]):
            print(f"      {r['key'][0]} {r['key'][1]}: {r['ref_h']:.2f}")
    if skipped:
        print("\n   وتعذّر: " + "، ".join(f"{k[0]}/{k[1]} ({w})" for k, w in skipped))



def median(xs: list) -> float:
    xs = sorted(xs)
    return xs[len(xs) // 2] if xs else 0.0


# ═══════════ ١٠) حارسُ الأداة — بلا صورةٍ ولا `sips` ═══════════

def self_test() -> int:
    bad = []

    def ok(cond, msg):
        if not cond:
            bad.append(msg)

    # ١) الشُّرَط
    ok(row_runs(bytes([0, 1, 1, 0, 1, 0])) == [(1, 3), (4, 5)], "row_runs: شُرَطٌ خاطئة")
    ok(row_runs(bytes([1, 1])) == [(0, 2)], "row_runs: شرطةٌ تبلغ آخرَ السطر")
    ok(row_runs(bytes(5)) == [], "row_runs: سطرٌ خالٍ")

    # ٢) خطُّ الأساس المنقّط: يُكشَف ولا يُكشَف معه صفُّ حروف
    W, H = 800, 700
    page = [bytearray(W) for _ in range(H)]
    for x in range(10, 790, 8):                       # شرطاتٌ بدورةٍ ثابتة
        for y in (500, 501):
            page[y][x:x + 4] = b"\x01" * 4
    for x in range(100, 140):                          # حرفٌ عريضٌ لا شُرَطَ فيه
        for y in range(400, 500):
            page[y][x] = 1
    rows = [bytes(r) for r in page]
    ok(baselines(W, H, rows) == [500], f"baselines: كُشف {baselines(W, H, rows)} والمنتظَرُ [500]")

    # ٣) المركّبات
    blob = [bytearray(60) for _ in range(40)]
    for y in range(5, 15):
        blob[y][5:15] = b"\x01" * 10
    for y in range(20, 30):
        blob[y][40:50] = b"\x01" * 10
    comps = components([bytes(r) for r in blob], 0, 40)
    ok(len(comps) == 2, f"components: {len(comps)} والمنتظَرُ ٢")
    ok(comps[0] == {"x0": 5, "x1": 15, "y0": 5, "y1": 15, "area": 100},
       f"components: صندوقٌ خاطئ {comps[0]}")

    # ٤) القسمةُ بأوسع الفجوات
    made = [{"x0": x, "x1": x + 20, "y0": 0, "y1": 10, "area": 200}
            for x in (0, 25, 200, 400)]
    groups, cut, inner = split_row(made, 3)
    ok(len(groups) == 3, f"split_row: {len(groups)} مجموعةً والمنتظَرُ ٣")
    ok(groups[0]["x1"] == 45, "split_row: المتلاصقان لم يُجمَعا")
    ok(cut and inner is not None and cut > inner, "split_row: فجوةُ القسمة ليست أوسعَ من داخل الشكل")

    # ٥) الصفوفُ تُقسَم بالفراغ لا بالمنتصف
    band = [bytearray(50) for _ in range(1100)]
    for y in list(range(350, 396)) + list(range(500, 891)):
        band[y][10:20] = b"\x01" * 10
    got = row_bands([bytes(r) for r in band], [400, 900], 1100, 50)
    ok(got == [(300, 450), (450, 1100)],
       f"row_bands: {got} — والفراغُ ٤٠١..٤٩٩ فقَطعُه ٤٥٠، لا منتصفُ ٤٠٠ و٩٠٠")

    # ٦) النقطُ: أقصى الحبر في جهتها، لا أقربُه
    parts = [{"x0": 0, "x1": 90, "y0": 0, "y1": 100, "area": 4000},    # الجسم
             {"x0": 30, "x1": 50, "y0": 40, "y1": 60, "area": 200},    # سهمٌ داخلَه
             {"x0": 30, "x1": 60, "y0": 110, "y1": 130, "area": 300}]  # نقطةٌ تحته
    dots = dots_of_shape("ب", parts, 100, 200)
    ok(len(dots) == 1 and dots[0]["y0"] == 110, f"dots_of_shape: {dots}")
    ok(dots_of_shape("ح", parts, 100, 200) == [], "dots_of_shape: حرفٌ لا نقطَ له")

    # ٧) جردُ الضربات يغطّي ١١٢ شكلاً بلا تكرارٍ ولا ثغرة
    seen = {}
    for letter in [ch for spec in PAGES for ch in spec["rows"]]:
        for form in FORMS:
            where = []
            if form in CROSS_AGREE.get(letter, ()):
                where.append("§١/§٣")
            if (letter, form) in CROSS_REF:
                where.append("§٢")
            if (letter, form) in CROSS_SILENT:
                where.append("صامت")
            seen[(letter, form)] = where
    ok(len(seen) == 112, f"جردُ الضربات: {len(seen)} شكلاً والمنتظَرُ ١١٢")
    dup = [k for k, v in seen.items() if len(v) > 1]
    hole = [k for k, v in seen.items() if not v]
    ok(not dup, f"جردُ الضربات: مكرَّرٌ في قسمين {dup}")
    ok(not hole, f"جردُ الضربات: بلا قسمٍ {hole}")

    # ٨) كاتبُ PNG يكتب ترويسةً صحيحة
    canvas = Canvas(7, 5)
    canvas.rect(0, 0, 6, 4, RED)
    canvas.text(1, 1, "10", BLACK, scale=1)
    out = CACHE / "selftest.png"
    canvas.png(out)
    raw = out.read_bytes()
    ok(raw[:8] == b"\x89PNG\r\n\x1a\n", "PNG: توقيعٌ خاطئ")
    ok(struct.unpack(">II", raw[16:24]) == (7, 5), "PNG: مقاسٌ خاطئ")
    out.unlink()

    for line in bad:
        print("  ✗ " + line)
    print(f"  {'✅' if not bad else '🔴'} حارسُ الأداة: ثمانيةُ أبوابٍ — "
          f"{'كلُّها خضر' if not bad else str(len(bad)) + ' حمراء'}")
    return 1 if bad else 0


def main() -> int:
    ap = argparse.ArgumentParser(description="مقاييسُ المرجع الكتابيّ — بند ص٢/أ")
    ap.add_argument("--self-test", action="store_true", help="حارسُ الأداة بلا صور")
    ap.add_argument("--build", action="store_true", help="يقيس الصفحات ويكتب الجدول")
    ap.add_argument("--board", action="store_true", help="يصيّر لوحَ التحقّق")
    ap.add_argument("--report", action="store_true", help="يطبع تقريرَ الفرق")
    ap.add_argument("--page", type=int, action="append", help="صفحةٌ بعينها (٥٧–٦٢)")
    ap.add_argument("--top", type=int, default=20, help="كم انحرافاً يُطبع")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    if not (args.build or args.board or args.report):
        ap.print_help()
        return 0
    pages = build(args.page)
    if len(pages) < len(PAGES):
        print("  ⚠ صفحاتٌ ناقصة — لا يُكتب الجدولُ من بعضها")
        return 1
    data = emit(pages)
    if args.build:
        OUT_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"\n  📄 الجدول: {OUT_JSON} — {data['عدد']} شكلاً، مقيسٌ {data['مقيس']}،"
              f" متعذّرٌ {len(data['متعذّر'])}، بلا سندِ ضرباتٍ {len(data['بلا سند ضربات'])}")
        for gap in data["متعذّر"]:
            print(f"     ○ {gap['letter']}/{gap['form']}: {gap['why']}")
    if args.board:
        board(pages)
    if args.report:
        report(data, args.top)
    return 0


if __name__ == "__main__":
    sys.exit(main())
