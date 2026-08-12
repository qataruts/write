#!/usr/bin/env python3
"""أبوابُ ميثاق الهوية الباقية — «اُكْتُبْ»، الجلسة هـ٢ (`FAMILY.md §٩`).

    python3 tools/identity_doors.py              # القياسُ واللقطاتُ ولوحةُ العرض
    python3 tools/identity_doors.py --numbers    # الأرقامُ وحدَها (بلا متصفّح)
    python3 tools/identity_doors.py --only fonts # بابٌ واحد: fonts · icon · world · night
    python3 tools/identity_doors.py --self-test

**بابُ اللوح حُسم في هـ١** (`indigo / shift`) ولوحتُه في `docs/IDENTITY_COLOR.md`
يولّدها `identity_panel.py`. وهذه الأداةُ للأبواب الباقية: **الأيقونة** و**الاستعارة
البطلة** و**العلامة**، ومعها **وجهُ الليل** المشتقُّ يُعرَض لعينٍ لم ترَه. وتولّد
`docs/REVIEW_IDENTITY.md` — صفحةَ الميثاق التي يطلبها `FAMILY §٩`.

**ولا تكتب هذه الأداةُ في `app/` حرفاً**: المرشَّحُ يُحقن في نسخةٍ معروضة ساعةَ اللقطة
(خطّاً في `@font-face`، أو حبراً في `.station-mark`)، والتطبيقُ يبقى على نائبه المعلَن
حتى يحكم المالك — «لا يُطبَّق شيءٌ قبل الحكم».

**والأرقامُ محسوبةٌ لا مكتوبة، وأرضياتُها من العائلة نفسِها**:
  · بُعدُ رسمٍ عن رسم — تُقابَل صورتا كلمةٍ واحدة بكسلاً بكسل بعد توحيد علبة الحبر.
  · **أرضيةُ التمايز عن أخٍ** = بُعدُ خطّ اقرأ عن خطّ احسب (فرقٌ حكم به مالكان فعلاً).
  · **أرضيةُ التمايز عن خطّ المادّة** = بُعدُ علامة اقرأ عن خطّ مادّتها في بيته.
فلا عتبةَ تُخترع هنا، والأرضيةُ تتحرّك إن تحرّك خطُّ أخٍ.
"""

import argparse
import hashlib
import http.server
import json
import re
import shutil
import socketserver
import struct
import sys
import tempfile
import threading
import time
import zlib
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import identity_panel as P            # noqa: E402  (الحسابُ والسَّوقُ لا يُكتبان مرّتين)

ROOT = P.ROOT
APP = P.APP
TOOLS = P.TOOLS
FONTS = TOOLS / "fonts"
DOORS = TOOLS / "doors.json"
MEASURES = TOOLS / "doors_measures.json"
PANEL = ROOT / "docs" / "REVIEW_IDENTITY.md"
COLOR_PANEL = ROOT / "docs" / "IDENTITY_COLOR.md"
OUT = ROOT / "docs" / "identity" / "doors"
REL = "identity/doors"

# مقاسُ الجهاز نفسُه الذي صُوِّرت به لقطاتُ هـ١ — يُقرأ من موضعه لا يُكتب ثانيةً
DEVICE_W, DEVICE_H = P.DEVICE_W, P.DEVICE_H

CELL = 300           # مقاسُ خلية ورقة القياس — الرقمُ نفسُه في `identity_word.html`
COLS = 6
NORM = 128           # مربّعُ التوحيد الذي تُقابَل فيه العلامتان
INK = 200            # ما دون هذه الإضاءة حبرٌ (الورقةُ بيضاءُ خالصة)

SCENES = P.SCENES    # الخريطة · لوحُ الكتابة · الاحتفال


# ————— ١) الصورة: فكُّ PNG وقياسُ حبره —————

def png_pixels(path: Path):
    """(العرض، الارتفاع، بايتات RGBA/RGB مفكوكةَ المرشِّحات) — بلا مكتبات.

    ولمَ يُفَكّ بالكامل هنا وقد اكتفت هـ١ بالمقابلة الخام؟ لأنّ المقيسَ هناك «أتغيّرت
    الصورة؟» ويكفيه بايتٌ، والمقيسَ هنا **شكلُ الحبر**: أين ابتدأ وأين انتهى وكم
    يتقاطع مع حبرٍ آخر — ولا يُعرَف ذلك إلا ببكسلٍ حقيقيّ.
    """
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise SystemExit(f"ليست PNG: {path}")
    width = height = depth = color = None
    idat = b""
    i = 8
    while i < len(data):
        length = struct.unpack(">I", data[i:i + 4])[0]
        kind = data[i + 4:i + 8]
        body = data[i + 8:i + 8 + length]
        if kind == b"IHDR":
            width, height, depth, color, _, _, interlace = struct.unpack(">IIBBBBB", body)
            if depth != 8 or color not in (2, 6) or interlace:
                raise SystemExit(f"صيغةُ PNG غيرُ متوقَّعة في {path.name}")
        elif kind == b"IDAT":
            idat += body
        elif kind == b"IEND":
            break
        i += 12 + length
    raw = zlib.decompress(idat)
    channels = 4 if color == 6 else 3
    stride = width * channels
    out = bytearray(height * stride)
    prev = bytearray(stride)
    pos = 0
    for y in range(height):
        filt = raw[pos]
        pos += 1
        line = bytearray(raw[pos:pos + stride])
        pos += stride
        if filt == 1:
            for x in range(channels, stride):
                line[x] = (line[x] + line[x - channels]) & 255
        elif filt == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 255
        elif filt == 3:
            for x in range(stride):
                left = line[x - channels] if x >= channels else 0
                line[x] = (line[x] + ((left + prev[x]) >> 1)) & 255
        elif filt == 4:
            for x in range(stride):
                a = line[x - channels] if x >= channels else 0
                b = prev[x]
                c = prev[x - channels] if x >= channels else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return width, height, bytes(out), channels


def pixel(image, x: int, y: int):
    width, _, data, channels = image
    at = (y * width + x) * channels
    return data[at], data[at + 1], data[at + 2]


def cell_ink(image, index: int):
    """حبرُ خليةٍ من ورقة القياس: قناعُه وعلبتُه، وهل فيه لونٌ ليس من حبرنا."""
    width, height, data, channels = image
    col, row = index % COLS, index // COLS
    x0, y0 = col * CELL, row * CELL
    if x0 + CELL > width or y0 + CELL > height:
        raise SystemExit(f"الخلية {index} خارج الورقة ({width}×{height})")
    mask = bytearray(CELL * CELL)
    left, top, right, bottom = CELL, CELL, -1, -1
    count = colored = 0
    for y in range(CELL):
        base = ((y0 + y) * width + x0) * channels
        for x in range(CELL):
            at = base + x * channels
            r, g, b = data[at], data[at + 1], data[at + 2]
            if (r * 299 + g * 587 + b * 114) // 1000 < INK:
                mask[y * CELL + x] = 1
                count += 1
                if max(r, g, b) - min(r, g, b) > 24:
                    colored += 1
                left, top = min(left, x), min(top, y)
                right, bottom = max(right, x), max(bottom, y)
    if count == 0:
        return None
    return {"mask": mask, "box": (left, top, right, bottom), "ink": count, "colored": colored}


def normalized(cell) -> bytes:
    """قناعُ الحبر موحَّدَ العلبة: يُقَصّ إلى حبره ثم يُمدّ إلى مربّعٍ واحد بحفظ نسبته.

    فالمقيسُ **شكلُ الكلمة** لا مقاسُها: خطٌّ أعرضُ حبراً وخطٌّ أضيق قد يكونا رسماً
    واحداً، والعينُ تفرّق بالشكل.
    """
    left, top, right, bottom = cell["box"]
    width, height = right - left + 1, bottom - top + 1
    scale = min(NORM / width, NORM / height)
    ox = (NORM - int(width * scale)) // 2
    oy = (NORM - int(height * scale)) // 2
    out = bytearray(NORM * NORM)
    mask = cell["mask"]
    for y in range(int(height * scale)):
        sy = top + int(y / scale)
        for x in range(int(width * scale)):
            sx = left + int(x / scale)
            if mask[sy * CELL + sx]:
                out[(y + oy) * NORM + x + ox] = 1
    return bytes(out)


def shape_gap(one: bytes, two: bytes) -> float:
    """بُعدُ رسمٍ عن رسم: ما لا يتقاطع من الحبرين ÷ مجموعِهما (٠ تطابقٌ، ١ افتراقٌ تامّ)."""
    both = sum(1 for a, b in zip(one, two) if a and b)
    any_ = sum(1 for a, b in zip(one, two) if a or b)
    return 0.0 if not any_ else 1 - both / any_


# ————— ٢) جردُ الخطوط: ما في `tools/fonts/` وما عند الأخوين —————

def font_files() -> dict:
    """كلُّ خطٍّ جُرِّب: ملفّاته ووزنُه وهل له محورُ وزنٍ حقيقيّ — **مقروءٌ من القرص**.

    و«محورُ الوزن» لا يُكتب في بيانٍ ولا يُصدَّق دعوى: ملفٌّ واحد يخدم الوزنين معناه
    وجهٌ متغيّر، وملفّان معناهما وزنان مرسومان — وكلاهما وزنٌ حقيقيّ. والذي يُردّ من
    كان له **وزنٌ واحد لا غير**، فغِلَظُه يُصطنع بتشويه رسمه.
    """
    out = {}
    for path in sorted(FONTS.glob("*.woff2")):
        found = re.fullmatch(r"(.+?)-arabic(?:-(\d+))?\.woff2", path.name)
        if not found:
            continue
        slug, weight = found.group(1), found.group(2)
        entry = out.setdefault(slug, {"files": [], "weights": [], "bytes": 0, "axis": False})
        entry["files"].append(path.name)
        entry["bytes"] += path.stat().st_size
        if weight:
            entry["weights"].append(int(weight))
        else:
            entry["axis"] = True
            entry["weights"] = [400, 700]
    for slug, entry in out.items():
        entry["weights"] = sorted(set(entry["weights"]))
        entry["base"] = "/tools/fonts/"
        entry["best"] = next((f for f in entry["files"] if f.endswith("-700.woff2")), entry["files"][0])
        entry["heavy"] = entry["axis"] or 700 in entry["weights"]
    return out


def sibling_fonts(data: dict) -> dict:
    """خطّا العلامتين عند الأخوين وخطُّ مادّتنا — **من مواضعها المنشورة لا من نسخة**."""
    out = {}
    for key, info in (("read", data["brand"]["siblings"]["read"]),
                      ("calc", data["brand"]["siblings"]["calc"]),
                      ("content", data["brand"]["content"])):
        path = (TOOLS / info["file"]).resolve()
        out[key] = {"family": info["family"], "path": path, "there": path.exists(),
                    "note": info["note"], "slug": info["family"].replace(" ", "")}
    return out


# ————— ٣) الخادم: الشجرةُ كلُّها، وأصولُ الأخوين ببابٍ مسمّى —————

def make_server(port: int, state: dict, payload: bytes, extra: dict):
    """يخدم جذرَ المستودع (فيه `app/` و`tools/`)، ومعه بابُ الحبس وبابُ القياس.

    و**أصولُ الأخوين تُخدَم ببابٍ مسمّى** لا بمسارٍ خارج الجذر: خادمُ بايثون لا يخرج
    بـ`..` عن مجلده (وهو صوابُه أمنياً)، فيُعلَن ما يُقرأ من مستودعَي اقرأ واحسب
    ملفّاً ملفّاً — لا يُفتَح لهما بابٌ عامّ.
    """

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(ROOT), **kw)

        def _send(self, body: bytes, kind: str):
            self.send_response(200)
            self.send_header("Content-Type", kind)
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_POST(self):
            if self.path == "/__measure":
                size = int(self.headers.get("Content-Length", 0))
                state["measure"] = json.loads(self.rfile.read(size) or b"{}")
                return self._send(b"", "text/plain")
            self.send_error(404)

        def do_GET(self):
            path, _, query = self.path.partition("?")
            if path == "/__doors.json":
                return self._send(payload, "application/json; charset=utf-8")
            if path == "/__ready":
                if "fail=1" in query:
                    state["failed"] = True
                state["ready"].set()
                return self._send(b"", "text/plain")
            if path == "/__hold":
                state["ready"].wait(timeout=state["timeout"])
                time.sleep(0.25)
                return self._send(P.HOLD_PNG, "image/png")
            if path in extra:
                kind = "image/png" if path.endswith(".png") else "font/woff2"
                return self._send(extra[path].read_bytes(), kind)
            return super().do_GET()

        def log_message(self, *a):
            pass

    socketserver.ThreadingTCPServer.allow_reuse_address = True
    return socketserver.ThreadingTCPServer(("127.0.0.1", port), Handler)


def capture(base: str, state: dict, url: str, out: Path, size: tuple, timeout: int,
            dark: bool = False) -> str:
    """لقطةٌ واحدة **بملفِّ متصفّحٍ جديد** — وشرطُها أن تعلن الصفحةُ اكتمالَ مشهدها.

    (كلا الشرطين درسُ هـ١: ملفٌّ مُعاد يجعل عاملَ الخدمة يردّ قشرةَ التطبيق على صفحة
    السَّوق نفسِها فتخرج صورةٌ «ناجحة» لمشهدٍ لم يُبنَ، ولقطةٌ تخرج بالمهلة صورةٌ بلا مشهد.)
    """
    out.parent.mkdir(parents=True, exist_ok=True)
    out.unlink(missing_ok=True)
    state["ready"] = threading.Event()
    state["failed"] = False
    state["timeout"] = timeout
    state["measure"] = None
    profile = Path(tempfile.mkdtemp(prefix="uktub-doors-"))
    try:
        proc = P.run_chrome(f"{base}{url}", profile, out, size=size, dark=dark)
        deadline = time.time() + timeout
        while time.time() < deadline and not out.exists():
            time.sleep(0.3)
        proc.kill()
        if state["failed"]:
            return "أخفق المشهدُ في الصفحة"
        if not out.exists():
            return "لم تُكتب اللقطة"
        if not state["ready"].is_set():
            return "لم تُعلن الصفحةُ اكتمالَ المشهد (خرجت اللقطةُ بالمهلة)"
        if P.png_size(out) != size:
            return f"مقاسٌ غريب {P.png_size(out)}"
        return ""
    finally:
        shutil.rmtree(profile, ignore_errors=True)


# ————— ٤) بيانُ الصفحة —————

def specimen_list(data: dict, fonts: dict, siblings: dict) -> list:
    """ترتيبُ خلايا ورقة القياس — **هو نفسُه ترتيبُ القصّ في بايثون**، فلا تُقاس خليةٌ بغيرها."""
    word, plain = data["brand"]["word"], data["brand"]["plain"]
    order = []
    for key in ("read", "calc", "content"):
        if siblings[key]["there"]:
            order.append(siblings[key]["slug"])
    order += [c["slug"] for c in data["brand"]["candidates"]]
    order += [d["slug"] for d in data["brand"]["dropped"] if d["slug"] in fonts]
    out = []
    for slug in order:
        out.append({"slug": slug, "text": word, "kind": "word"})
        out.append({"slug": slug, "text": plain, "kind": "plain"})
    return out


def payload_for(data: dict, fonts: dict, siblings: dict, specimens: list) -> tuple:
    """جوابُ `/__doors.json` وقائمةُ الأبواب المسمّاة لأصول الأخوين."""
    served = json.loads(json.dumps(data))
    extra = {}
    table = {slug: dict(info) for slug, info in fonts.items()}
    for key in ("read", "calc", "content"):
        info = siblings[key]
        if not info["there"]:
            continue
        route = f"/__sib/{key}-{info['path'].name}"
        extra[route] = info["path"]
        table[info["slug"]] = {"files": [info["path"].name], "base": route.rsplit("/", 1)[0] + "/",
                               "axis": True, "weights": [400, 700], "heavy": True,
                               "bytes": info["path"].stat().st_size,
                               "best": info["path"].name}
        # المسارُ الكاملُ للأخ يُعلَن كما هو (الصفحةُ تركّب `base + file`)
        table[info["slug"]]["base"] = route[: -len(info["path"].name)]
        served["brand"]["siblings" if key != "content" else "content"]
        if key == "content":
            served["brand"]["content"]["url"] = route
        else:
            served["brand"]["siblings"][key]["url"] = route
    for row in served["icon"]["row"]:
        path = (TOOLS / row["icon"]).resolve()
        row["there"] = path.exists()
        if path.exists():
            route = f"/__sib/icon-{row['app']}.png"
            extra[route] = path
            row["iconUrl"] = route
    served["fonts"] = table
    served["specimens"] = specimens
    return json.dumps(served, ensure_ascii=False).encode("utf-8"), extra


# ————— ٥) القياس —————

def fingerprint(data: dict, fonts: dict, siblings: dict) -> dict:
    """بصمةُ ما قِيس: كلُّ ملفِّ خطٍّ وورقةُ القياس نفسُها.

    فالأرقامُ المحفوظة أدناه **قياسُ ساعتها لا حقيقةٌ أبدية**: إن تبدّل ملفُّ خطٍّ أو
    تبدّلت ورقةُ القياس ولم يُعَد القياسُ، احمرّ الفحصُ الذاتيّ وقال «قياسٌ بائت».
    """
    marks = {}
    for slug, info in sorted(fonts.items()):
        marks[slug] = hashlib.sha256(b"".join((FONTS / f).read_bytes()
                                              for f in sorted(info["files"]))).hexdigest()[:16]
    for key in ("read", "calc", "content"):
        if siblings[key]["there"]:
            marks[f"@{key}"] = hashlib.sha256(siblings[key]["path"].read_bytes()).hexdigest()[:16]
    for name in ("identity_word.html", "doors.json"):
        marks[f"#{name}"] = hashlib.sha256((TOOLS / name).read_bytes()).hexdigest()[:16]
    marks["#cell"] = f"{CELL}x{COLS}x{NORM}x{INK}"
    return marks


def measure_sheet(sheet: Path, specimens: list) -> dict:
    """قراءةُ ورقة القياس: لكلّ خطٍّ حبرُ علامته، وشكلُها موحَّداً، وارتفاعُ حركاتها."""
    image = png_pixels(sheet)
    cells = {}
    for index, one in enumerate(specimens):
        ink = cell_ink(image, index)
        if ink is None:
            raise SystemExit(f"خليةٌ بلا حبر: {one['slug']} / {one['kind']}")
        cells[(one["slug"], one["kind"])] = ink
    out = {}
    for one in specimens:
        if one["kind"] != "word":
            continue
        slug = one["slug"]
        word, plain = cells[(slug, "word")], cells[(slug, "plain")]
        wl, wt, wr, wb = word["box"]
        _, pt, _, pb = plain["box"]
        height = wb - wt + 1
        out[slug] = {
            "shape": normalized(word).hex(),
            "ink": word["ink"],
            "colored": round(word["colored"] / word["ink"], 4),
            "ratio": round((wr - wl + 1) / height, 3),
            # ما علا حروفَ الكلمة وما نزل عنها = مساحةُ التشكيل (الكلمتان في خليّتين
            # متطابقتَي السطر، فخطُّ الأساس فيهما واحد)
            "marks_above": round(max(0, pt - wt) / height, 4),
            "marks_below": round(max(0, wb - pb) / height, 4),
        }
    return out


def gaps(shapes: dict, slug: str, others: list) -> dict:
    mine = bytes.fromhex(shapes[slug]["shape"])
    return {other: round(shape_gap(mine, bytes.fromhex(shapes[other]["shape"])), 4)
            for other in others if other in shapes}


def build_measures(data: dict, fonts: dict, siblings: dict, sheet: Path, specimens: list) -> dict:
    shapes = measure_sheet(sheet, specimens)
    marks = fingerprint(data, fonts, siblings)
    refs = {key: siblings[key]["slug"] for key in ("read", "calc", "content") if siblings[key]["there"]}
    floors = {}
    if "read" in refs and "calc" in refs:
        floors["sibling"] = round(shape_gap(bytes.fromhex(shapes[refs["read"]]["shape"]),
                                            bytes.fromhex(shapes[refs["calc"]]["shape"])), 4)
    if "read" in refs and "content" in refs:
        floors["content"] = round(shape_gap(bytes.fromhex(shapes[refs["read"]]["shape"]),
                                            bytes.fromhex(shapes[refs["content"]]["shape"])), 4)
    out = {"_": "ملفٌّ مولَّد — لا يُحرَّر بيد. يكتبه `python3 tools/identity_doors.py`",
           "fingerprint": marks, "floors": floors, "refs": refs, "fonts": {}}
    for slug, one in shapes.items():
        out["fonts"][slug] = {k: v for k, v in one.items() if k != "shape"}
        out["fonts"][slug]["gap"] = gaps(shapes, slug, list(refs.values()))
        out["fonts"][slug]["bytes"] = fonts[slug]["bytes"] if slug in fonts else None
        out["fonts"][slug]["axis"] = fonts[slug]["axis"] if slug in fonts else None
        out["fonts"][slug]["heavy"] = fonts[slug]["heavy"] if slug in fonts else None
    return out


def claim_faults(data: dict, measures: dict) -> list:
    """**الدعوى تُقابَل بالرقم**: كلُّ خطٍّ رُدّ بعلّةٍ تُقاس يجب أن يشهد له القياس،
    وكلُّ مرشَّحٍ عُرِض يجب أن يعلو الأرضيتين. فمن كتب علّةً لا يصدّقها الرقمُ احمرّ.
    """
    out = []
    fonts = measures["fonts"]
    floors = measures["floors"]
    refs = measures["refs"]
    for cand in data["brand"]["candidates"]:
        slug = cand["slug"]
        if slug not in fonts:
            out.append(f"«{cand['family']}»: لا قياسَ له")
            continue
        one = fonts[slug]
        for key, floor in (("read", "sibling"), ("calc", "sibling")):
            if key in refs and floor in floors and one["gap"].get(refs[key], 1) < floors[floor]:
                out.append(f"«{cand['family']}»: بُعدُه عن خطّ {key} {one['gap'][refs[key]]:.3f}"
                           f" دون أرضية الأخوين {floors[floor]:.3f}")
        if "content" in refs and "content" in floors \
                and one["gap"].get(refs["content"], 1) < floors["content"]:
            out.append(f"«{cand['family']}»: بُعدُه عن خطّ المادّة {one['gap'][refs['content']]:.3f}"
                       f" دون أرضيتها {floors['content']:.3f}")
        if not one["heavy"]:
            out.append(f"«{cand['family']}»: بلا وزنٍ غليظٍ حقيقيّ")
        if one["marks_above"] <= 0.02:
            out.append(f"«{cand['family']}»: لا تعلو حركاتُه حروفَه ({one['marks_above']:.3f})")
        if one["colored"] > 0.01:
            out.append(f"«{cand['family']}»: يرسم حبرَه بألوانه ({one['colored']:.3f})")
    for out_font in data["brand"]["dropped"]:
        slug, test = out_font["slug"], out_font["test"]
        one = fonts.get(slug)
        if one is None:
            continue
        if test == "axis" and one["heavy"]:
            out.append(f"المردودُ «{out_font['family']}» بعلّة الوزن — والقياسُ يقول له وزنٌ غليظ")
        if test == "color" and one["colored"] <= 0.01:
            out.append(f"المردودُ «{out_font['family']}» بعلّة اللون — والقياسُ لا يرى فيه لوناً")
        if test == "sibling":
            near = min((one["gap"].get(refs[k], 1) for k in ("read", "calc") if k in refs), default=1)
            if "sibling" in floors and near >= floors["sibling"]:
                out.append(f"المردودُ «{out_font['family']}» بعلّة القرب من خطّ أخٍ —"
                           f" والقياسُ يبعده {near:.3f} فوق الأرضية {floors['sibling']:.3f}")
        if test == "content" and "content" in refs and "content" in floors \
                and one["gap"].get(refs["content"], 1) >= floors["content"]:
            out.append(f"المردودُ «{out_font['family']}» بعلّة القرب من خطّ المادّة —"
                       f" والقياسُ يبعده {one['gap'][refs['content']]:.3f}")
        if test == "marks" and one["marks_above"] > 0.02:
            out.append(f"المردودُ «{out_font['family']}» بعلّة التشكيل — والقياسُ يرى"
                       f" حركاتِه فوق حروفه ({one['marks_above']:.3f})")
    return out


# ————— ٦) اللقطات —————

def shot_jobs(data: dict, siblings: dict) -> list:
    """كلُّ لقطةٍ تعرضها اللوحة: (اسمُها · رابطُها · مقاسُها · ليلٌ؟ · عنوانُها)."""
    jobs = [
        ("word-sheet.png", "/tools/identity_word.html",
         (COLS * CELL, 0), False, "ورقةُ القياس — كلمةُ العلامة بكلّ خطٍّ جُرِّب"),
        ("fonts-board.png", "/tools/identity_fonts.html", (1180, 940), False,
         "لوحةُ خطّ العلامة — المرشَّحون في شرائحهم"),
        ("icon-row.png", "/tools/identity_row.html", (1060, 460), False,
         "امتحانُ الميثاق — أيقوناتُ العائلة صفّاً"),
    ]
    for one in data["world"]["marks"]:
        jobs.append((f"world-marks-{one['id']}.png",
                     f"/tools/identity_world.html?mode=marks&pick={one['id']}",
                     (DEVICE_W, DEVICE_H), False, f"معالمُ الخريطة — {one['name']}"))
    for one in data["world"]["names"]:
        jobs.append((f"world-names-{one['id']}.png",
                     f"/tools/identity_world.html?mode=names&pick={one['id']}",
                     (DEVICE_W, DEVICE_H), False, f"أسماءُ المراحل — {one['name']}"))
    for one in data["world"]["celebrate"]:
        jobs.append((f"world-celebrate-{one['id']}.png",
                     f"/tools/identity_world.html?mode=celebrate&pick={one['id']}",
                     (DEVICE_W, DEVICE_H), False, f"نكهةُ الاحتفال — {one['name']}"))
    return jobs


def sheet_rows(specimens: list) -> int:
    return (len(specimens) + COLS - 1) // COLS


def night_jobs() -> list:
    return [(f"night-{scene}.png", scene, title) for scene, title in SCENES]


def capture_night(port: int, timeout: int) -> list:
    """وجهُ الليل بلقطاته — **بوسيط `prefers-color-scheme` الحقيقيّ لا بحقنِ ألوان**.

    فالليلُ عندنا كتلةُ `@media` في `app.css`، ولو حُقنت قيمُها في `:root` لصوّرنا ما
    كتبناه نحن لا ما يفعله المتصفّح. فيُشغَّل كروم بوضع الجهاز المظلم (`--force-dark-mode`
    يجعل الوسيطَ يطابق فعلاً)، **ويُقابَل بكسلُ الورق في الصورة بقيمة الورق الليليّ
    المكتوبة في اللوح** — فلو قلب المتصفّحُ الألوانَ من عنده (تغميقٌ آليّ) لافترق الرقمان.
    """
    data = json.loads(P.PALETTES.read_text(encoding="utf-8"))
    css_text = P.CSS.read_text(encoding="utf-8")
    siblings = P.sibling_palettes(data)
    shift = P.derive_shift(siblings["read"]["tokens"], siblings["calc"]["tokens"],
                           data["shift"]["tokens"])
    seed = P.seed_tokens(P.root_tokens(css_text), siblings)
    state = {"ready": threading.Event(), "failed": False, "timeout": timeout}
    server = P.make_server(port, state, P.served_palettes(data, shift, seed))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{port}"
    fails = []
    try:
        for name, scene, title in night_jobs():
            out = OUT / name
            err = None
            profile = Path(tempfile.mkdtemp(prefix="uktub-night-"))
            try:
                got, err = P.capture(base, profile, state, "now", "warm", scene, timeout,
                                     dark=True, out=out)
            finally:
                shutil.rmtree(profile, ignore_errors=True)
            if err:
                fails.append(f"{name} — {err}")
                print(f"  ✗ {name} — {err}")
            else:
                print(f"  ✓ {name} — {title}")
    finally:
        server.shutdown()
    return fails


def night_paper_ok() -> tuple:
    """أوَرَقُ الليل في الصورة هو ورقُ الليل في اللوح؟ (ثلاثُ لقطاتٍ، ركنُ كلٍّ)."""
    want = P.read_night(P.CSS.read_text(encoding="utf-8")).get("paper")
    if not want:
        return None, None
    seen = []
    for name, _, _ in night_jobs():
        path = OUT / name
        if not path.exists():
            return want, None
        image = png_pixels(path)
        seen.append("#%02X%02X%02X" % pixel(image, 3, 3))
    return want, seen


# ————— ٧) لوحةُ العرض —————

AR = P.arnum
KEPT_OPEN = "<!-- ⇩ يُحفَظ عند إعادة التوليد — بابُ المالك: {} ⇩ -->"
KEPT_SHUT = "<!-- ⇧ ينتهي المحفوظ: {} ⇧ -->"
WAITING = "(منتظَر)"
DOOR_KEYS = ["الأيقونة", "الاستعارة", "العلامة", "الليل"]


def kept_block(key: str) -> tuple:
    return KEPT_OPEN.format(key), KEPT_SHUT.format(key)


def read_kept(key: str) -> str:
    """ما كتبته يدٌ في باب مالكٍ بعينه — يُقرأ ويُعاد كما هو عند إعادة التوليد."""
    if not PANEL.exists():
        return f"**الحكم**: {WAITING}"
    head, tail = kept_block(key)
    found = re.search(re.escape(head) + r"\n(.*?)\n" + re.escape(tail),
                      PANEL.read_text(encoding="utf-8"), re.S)
    return found.group(1).strip() if found else f"**الحكم**: {WAITING}"


def verdict(key: str) -> str:
    found = re.search(r"^\*\*الحكم\*\*:\s*(.+?)\s*$", read_kept(key), re.M)
    return found.group(1).strip() if found else WAITING


def door_state(key: str) -> str:
    return "⏳ معروضٌ — والحكمُ منتظَر" if verdict(key) == WAITING else f"✅ **{verdict(key)}**"


def brand_hardcoded() -> list:
    """مواضعُ اسم خطّ العلامة **مكتوبةً بيد** في الشجرة — تُجرَد ولا تُعَدّ بيد.

    فيومَ يحكم المالك بخطٍّ لن يكفيَ تبديلُ رمزٍ في اللوح: هذه المواضعُ تبقى تحمل
    اسمَ النائب، وبعضُها **حرّاسٌ** يصيرون يحرسون خطّاً مهجوراً ويمرّون خضراً
    (وهو دَينٌ أدّاه احسب في جلسته بعينه). فيُعلَن العددُ محسوباً قبل الحكم.
    """
    family = "Marhey"
    places = []
    for path in sorted(set(list(APP.rglob("*.css")) + list(APP.rglob("*.js"))
                              + list(TOOLS.glob("*.html")) + list(TOOLS.glob("*.py")))):
        if not path.exists() or path.name in ("identity_word.html", "identity_fonts.html",
                                              "identity_row.html", "identity_doors.py",
                                              "doors.json"):
            continue
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if family in line and not line.lstrip().startswith(("*", "//", "<!--")):
                places.append(f"`{path.relative_to(ROOT)}:{AR(number)}`")
    return places


def shot_table(rows: list, width: int = 33) -> list:
    out = ["<table><tr>"]
    for name, label in rows:
        out.append(f'<td align="center" width="{width}%"><a href="{REL}/{name}">'
                   f'<img src="{REL}/{name}" width="260" alt="{label}"></a><br><sub>{label}</sub></td>')
    out.append("</tr></table>")
    return out


def panel_text(data: dict, measures: dict, fonts: dict, siblings: dict,
               tokens: dict, extra: dict) -> str:
    lines = []
    add = lines.append
    refs = measures.get("refs", {})
    floors = measures.get("floors", {})
    mf = measures.get("fonts", {})

    add("# هويةُ «اُكْتُبْ» — صفحةُ ميثاق الهوية (`FAMILY.md §٩`)")
    add("")
    add("> ⚠ **ملفٌّ مولَّد** — لا يُحرَّر بيد إلا **أبوابُ حكم المالك** (يحفظها المولّد):")
    add(">")
    add(">     python3 tools/identity_doors.py")
    add(">")
    add("> **إخوةٌ لا توائم**: التشابه في الهيكل صحةٌ والتشابه في الهوية عيب — العظامُ")
    add("> واحدة والوجهُ لكلٍّ. وهذه الصفحةُ تحاسب أبوابَ الميثاق الأربعة: ما قُرّ يُقيَّد")
    add("> بتاريخه، وما ينتظر يُعرَض **مُصيَّراً** ولا يُعتمَد إلا بعين المالك.")
    add("> **ولا يُطبَّق بابٌ قبل حكمه** — والحارسُ على الطرفين.")
    add("")

    # ————— الباب ١: اللوح —————
    add("## ١. اللوح — ✅ مُقَرّ: `indigo / shift` (١٢ أغسطس ٢٠٢٦)")
    add("")
    add("**حِبْرٌ نِيليّ على أرضيةٍ دافئةٍ مُزاحة** — حكمُ المالك في الجلسة هـ١، ولوحتُه")
    add("المصيَّرة كاملةً (٢٤ لقطة · مسحُ الحيّز اللونيّ · اشتقاقُ الأرضية) في")
    add("**[`docs/IDENTITY_COLOR.md`](IDENTITY_COLOR.md)** — وفيها سطرُ حكمه بتاريخه.")
    add("")
    add("| الرمز | القيمة | ما هو |")
    add("|---|---|---|")
    add(f"| `--accent-letters` | <code>{tokens['accent-letters']}</code> | **اللونُ الغالب** — حِبرٌ نِيليّ |")
    add(f"| `--paper` | <code>{tokens['paper']}</code> | الورقُ الدافئ المزاح |")
    add(f"| `--brand-1..3` | <code>{tokens['brand-1']}</code> <code>{tokens['brand-2']}</code>"
        f" <code>{tokens['brand-3']}</code> | سُلَّمُ العلامة وأيقونتُها |")
    add(f"| `--star` | <code>{tokens['star']}</code> | **لونُ حكمٍ لم يُمَسّ**: الإرشادُ والنجوم |")
    add("")
    add("**ويحرسه بابان**: `identity_panel.py --self-test` («لا لونَ قبل الحكم ولا حكمَ بلا")
    add("تطبيق»)، و`tools/test_identity.mjs` (§٥ أدناه: ورقُنا وغالبُنا يخالفان اقرأ).")
    add("")

    # ————— الباب ١ب: الليل —————
    add(f"### ١ب. وجهُ الليل — {door_state('الليل')}")
    add("")
    add("ليلُ الهوية **إسقاطٌ لا اختيار**: حكمُ المالك وقع على لوح النهار، فاشتُقّ الليلُ")
    add("بقاعدتين منشورتين (`identity_panel.py §٣ج`) — الأرضيةُ ليلُ اقرأ مضروبٌ إشباعُه في")
    add("معامل الإزاحة نفسِه والإضاءةُ لا تُمَسّ، والمراحلُ لكلٍّ رفعةُ اقرأ لها بعينها ثم")
    add("**أصغرُ رفعةٍ تبلغ AA** على ورقنا الليليّ. **وهو مطبَّقٌ في اللوح منذ هـ١ وعينُ")
    add("المالك لم ترَه** — فهذه لقطاتُه:")
    add("")
    lines.extend(shot_table([(name, title) for name, _, title in night_jobs()]))
    add("")
    if extra.get("night_paper"):
        want, seen = extra["night_paper"]
        add(f"**واللقطاتُ ليلٌ حقّاً لا صورةٌ مقلوبة**: الوسيطُ `prefers-color-scheme: dark`")
        add(f"يطابق في المتصفّح فعلاً، **وركنُ كلِّ لقطةٍ يُقرأ من الصورة** فيخرج"
            f" {' · '.join(f'<code>{v}</code>' for v in seen)} — وهو ورقُ الليل في اللوح"
            f" <code>{want}</code> بعينه. فلو غمّق المتصفّحُ الصورةَ من عنده لافترق الرقمان.")
        add("")
    add("**والمطلوب سطرٌ واحد**: إن رضيت عينُك وجهَ الليل فالحكمُ `مُقَرّ`؛ وإن رأيتَ فيه")
    add("ما يُصلَح فالإصلاحُ في القاعدة لا في لونٍ يُكتب بيد (`--guide` مثلاً، §٥ من لوحة اللون).")
    add("")
    head, tail = kept_block("الليل")
    add(head)
    add(read_kept("الليل"))
    add(tail)
    add("")

    # ————— الباب ٢: الأيقونة —————
    add(f"## ٢. الأيقونة — {door_state('الأيقونة')}")
    add("")
    add("**امتحانُ الميثاق** (البند ٢): «تُعرَف من لمحةٍ بين أخواتها… ومحكُّها صفُّ أيقونات")
    add("العائلة معاً، وطفلُ سادسةٍ يسمّي كلَّ واحدةٍ بلا تردّد». فصُفَّت بمقاسَي أيقونة")
    add("الآيباد (١٥٢ و٧٦ بكسلاً) على أرضٍ محايدة — **وأصولُ الأخوين ملفّاتُهما المنشورة**")
    add("تُقرأ من مستودعيهما ولا تُمَسّ:")
    add("")
    add(f'<a href="{REL}/icon-row.png"><img src="{REL}/icon-row.png" width="820" alt="امتحانُ الأيقونات"></a>')
    add("")
    add("\n".join(data["icon"]["note"]))
    add("")
    add("**وما تُريه اللقطة**: اللونُ فرّق بالفعل — نِيليٌّ بين برتقاليٍّ وفيروزيّ، وهو ثمرةُ")
    add("هـ١. **والرسمُ لم يفترق بعدُ**: أيقونتُنا اليومَ وأيقونةُ اقرأ **بخطٍّ واحد**")
    add("(Marhey)، فالفارقُ بينهما لونٌ وحدَه — وذلك عينُ ما رفضه الميثاق. فالبابُ الثاني")
    add("**معلَّقٌ على الرابع**: يومَ يُحكَم لخطٍّ تُعاد الأيقوناتُ الأربع به.")
    if extra.get("fit"):
        add("")
        add("**وما تُريه اللقطةُ بالعين**: حبرُ الرقعة أرفعُ وأصغرُ في علبته، فيضعف في")
        add("المقاس الصغير (٧٦) حيث تُرى الأيقونةُ في مجلدٍ أو حافظة — وذلك بابُ الدَّين")
        add("نفسِه أدناه، فالمقاسُ مضبوطٌ لحبر خطٍّ آخر:")
        add("")
        add("**ودَينٌ يُعلَن قبل التنفيذ — مقاسُ الكلمة في العلبة**: نسبتُه في `icon.html`")
        add("رقمٌ ضُبط لـMarhey (٠٫٣٧)، فقُيس حبرُ كلِّ مرشَّحٍ في علبته:")
        add("")
        add("| الخط | عرضُ حبر الكلمة | عرضُ العلبة | ما خرج عنها |")
        add("|---|---|---|---|")
        for cand in data["brand"]["candidates"]:
            got = extra["fit"].get(cand["slug"])
            if not got:
                continue
            mark = "لا شيء" if got["over"] <= 0 else f"**{got['over']:g}px** ⚠"
            add(f"| {cand['family']} | {got['width']:g}px | {got['box']:g}px | {mark} |")
        add("")
        add("(ومن خرج حبرُه قُصَّت علامتُه — يُعالَج يومَ التنفيذ بأن يُقاس المقاسُ بحبر")
        add("الكلمة نفسِها لا برقمٍ ضُبط لخطٍّ بعينه، وهو دَينٌ أدّاه احسب في جلسته.)")
    add("")
    head, tail = kept_block("الأيقونة")
    add(head)
    add(read_kept("الأيقونة"))
    add(tail)
    add("")

    # ————— الباب ٣: الاستعارة —————
    add(f"## ٣. الاستعارةُ البطلة — {door_state('الاستعارة')}")
    add("")
    add("\n".join(data["world"]["note"]))
    add("")
    add("### ٣أ. معالمُ الخريطة")
    add("")
    for one in data["world"]["marks"]:
        add(f"- **{one['name']}** — {one['why']}")
    add("")
    lines.extend(shot_table([(f"world-marks-{one['id']}.png", one["name"])
                             for one in data["world"]["marks"]]))
    add("")
    add("### ٣ب. أسماءُ المراحل")
    add("")
    for one in data["world"]["names"]:
        add(f"- **{one['name']}** — {one['why']}")
    add("")
    lines.extend(shot_table([(f"world-names-{one['id']}.png", one["name"])
                             for one in data["world"]["names"]]))
    add("")
    add("**ويُقال صريحاً**: مراحلُنا الكبرى **أسماؤها من عالمنا بالفعل** («تَهْيِئَةُ اليَد» ·")
    add("«الوَصْلُ وَالنَّسْخ» · «خُفُوتُ النَّمُوذَج») — وإنما المنقولُ عن اقرأ **ترقيمُ مجموعات")
    add("الحروف السبع**، وهو ترتيبُه الذي تعهّدنا باتّباعه (`SEED.md`). فالمرشَّحُ الثاني")
    add("يكسو الترقيمَ نكهةَ العالم، والثالثُ يستبدل به **حروفَ المحطة نفسَها** — وهو")
    add("أنفعُ للطفل وأبعدُ عن الاستعارة معاً، فليختر المالكُ بين النكهة والنفع.")
    add("")
    add("### ٣ج. نكهةُ الاحتفال")
    add("")
    for one in data["world"]["celebrate"]:
        add(f"- **{one['name']}** — {one['why']}")
    add("")
    lines.extend(shot_table([(f"world-celebrate-{one['id']}.png", one["name"])
                             for one in data["world"]["celebrate"]]))
    add("")
    add("**ويُقال صريحاً عن اللقطتين الثانية والثالثة**: يكاد الأثران يتطابقان فيهما —")
    add("لأنّ الإصبعَ المصنوع في العدّة يكتب على المسار المرجعيّ بعينه. **ويدُ طفلٍ حقيقيّ")
    add("تفارقه**، وذلك هو المقصود من الثالث: يرى الطفلُ في ميداليته **يدَه هو** لا نموذجاً")
    add("مرسوماً — والفرقُ بينهما لا يُرى في لقطةٍ آلية، ويُرى في يد طفل.")
    add("")
    add("**والثالثُ لا يمسّ عهداً**: مسارُ الطفل لا يغادر الصفحةَ فضلاً عن الجهاز — تُنسَخ")
    add("عقدُ حبره المرسومةِ على اللوح إلى قرص الميدالية، ولا يُخزَّن ولا يُرسَل")
    add("(`METHOD §٣.٧`، و`pen.js` لا يعرف الشبكة بنيوياً). **ولا نصَّ منطوقاً جديداً في")
    add("المرشّحات الثلاثة**: صوتُ المعلّم واحدٌ للعائلة، والاحتفالُ لا يُنطق فيه جديد.")
    add("")
    head, tail = kept_block("الاستعارة")
    add(head)
    add(read_kept("الاستعارة"))
    add(tail)
    add("")

    # ————— الباب ٤: العلامة —————
    add(f"## ٤. العلامة — {door_state('العلامة')}")
    add("")
    add("«لكل تطبيقٍ رسمُ علامته وخطُّها قرارَ مراجعةٍ يُقَرّ — **وخطُّ Marhey لعلامة اقرأ")
    add("وحدَها فلا يُورَّث بالنسخ**» (`FAMILY §٩.٤`). وعلامتُنا اليومَ بخطّه، فهو **نائبٌ")
    add("مؤقت معلَن** لا قرارَ لوحٍ اتُّخذ.")
    add("")
    add(f'<a href="{REL}/fonts-board.png"><img src="{REL}/fonts-board.png" width="900"'
        ' alt="لوحةُ خطّ العلامة"></a>')
    add("")
    add("**والأرضياتُ من العائلة لا من ذوقٍ** — كم يكفي من الفرق بين خطَّي علامتين؟")
    add("الجوابُ سابقةٌ لا عتبة: **بُعدُ خطّ اقرأ عن خطّ احسب** — فرقٌ حكم به مالكان فعلاً")
    add("وصفّته العائلةُ على شاشةٍ واحدة. وكذلك «ألّا تُشبه العلامةُ خطَّ المادّة»:")
    add("أرضيتُها **بُعدُ علامة اقرأ عن خطّ مادّتها** في بيته.")
    add("")
    if floors:
        add("| الأرضية | ما هي | قيمتُها |")
        add("|---|---|---|")
        if "sibling" in floors:
            add(f"| تمايزُ العلامتين | Marhey (اقرأ) عن Kufam (احسب) | **{floors['sibling'] * 100:.0f}٪** |")
        if "content" in floors:
            add(f"| مفارقةُ خطّ المادّة | Marhey عن Noto Naskh في بيت اقرأ | **{floors['content'] * 100:.0f}٪** |")
        add("")
    add("**والقياسُ نفسُه**: تُصيَّر كلمةُ العلامة «اُكْتُبْ» بكلّ خطٍّ في ورقةٍ واحدة")
    add(f"([`{REL}/word-sheet.png`]({REL}/word-sheet.png))، ثم يُقَصّ حبرُ كلِّ كلمةٍ ويُوحَّد")
    add("مقاسُ علبته، ويُقابَل بحبر الآخر بكسلاً بكسل: **ما لا يتقاطع ÷ مجموعِهما**. فالمقيسُ")
    add("**شكلُ الكلمة** لا مقاسُها — والعينُ تفرّق بالشكل.")
    add("")
    add("| المرشَّح | عن Marhey (اقرأ) | عن Kufam (احسب) | عن خطّ المادّة | وزنٌ غليظ | حِملُه | تشكيلٌ فوق الحروف |")
    add("|---|---|---|---|---|---|---|")
    for cand in data["brand"]["candidates"]:
        one = mf.get(cand["slug"])
        if not one:
            continue
        cell = lambda key: (f"{one['gap'][refs[key]] * 100:.0f}٪"
                            if key in refs and refs[key] in one["gap"] else "—")
        add(f"| **{cand['family']}** | {cell('read')} | {cell('calc')} | {cell('content')} |"
            f" {'✓ محور' if one['axis'] else '✓ وزنان'} | {AR(round(one['bytes'] / 1024))} ك.ب |"
            f" {one['marks_above'] * 100:.0f}٪ من ارتفاع الكلمة |")
    add("")
    for cand in data["brand"]["candidates"]:
        add(f"**{cand['family']}** — *{cand['metaphor']}* ({cand['source']})")
        add("")
        add(f"- **لماذا**: {cand['why']}")
        add(f"- **وما يُخشى منه**: {cand['risk']}")
        add("")
    add(f"**وجُرّب {AR(len(data['brand']['dropped']) + len(data['brand']['candidates']))}"
        f" خطّاً فسقط {AR(len(data['brand']['dropped']))} قبل العرض** — وكلُّ علّةٍ تُقاس")
    add("مقيسةٌ في الجدول أدناه، لا موصوفة:")
    add("")
    add("| الخط | العلّة | شاهدُها |")
    add("|---|---|---|")
    for out_font in data["brand"]["dropped"]:
        one = mf.get(out_font["slug"], {})
        if out_font["test"] == "axis":
            proof = "وزنٌ واحد في مصدره — لا ملفَّ غليظٍ ولا محور"
        elif out_font["test"] == "color":
            proof = f"**{one.get('colored', 0) * 100:.0f}٪** من حبره ليس بلونٍ واحد"
        elif out_font["test"] == "sibling":
            near = min(((one.get("gap", {}).get(refs[k], 1), k) for k in ("read", "calc") if k in refs),
                       default=(1, ""))
            proof = (f"على **{near[0] * 100:.0f}٪** من خطّ أخٍ — دون الأرضية"
                     f" {floors.get('sibling', 0) * 100:.0f}٪")
        elif out_font["test"] == "content":
            proof = (f"على **{one.get('gap', {}).get(refs.get('content', ''), 0) * 100:.0f}٪** من خطّ"
                     f" المادّة — دون الأرضية {floors.get('content', 0) * 100:.0f}٪")
        elif out_font["test"] == "marks":
            proof = (f"لا يعلو حروفَه تشكيلٌ يُذكَر: **{one.get('marks_above', 0) * 100:.0f}٪**"
                     " من ارتفاع الكلمة")
        else:
            proof = "بالعين على ورقة القياس المنشورة"
        add(f"| {out_font['family']} | {out_font['why']} | {proof} |")
    add("")
    add(f"**وملفّاتُ الخطوط كلِّها في `tools/fonts/`** ({AR(len(fonts))} خطّاً) — **لا تُنشَر")
    add("ولا تدخل قشرةَ التطبيق**: منها تُقاس الأرقامُ أعلاه، فتُقرأ العلّةُ من الملفّ لا من")
    add("الذاكرة. **ويُسقَط الخاسرون بعد الحكم** (سنّةُ اقرأ في لوحة خطّها: لا وزنَ ميتاً")
    add("يُصان)، ويبقى المُقَرُّ وحدَه في `app/fonts/`.")
    add("")
    add("**ودَينُ التنفيذ معلَنٌ ومعدود**: اسمُ خطّ العلامة مكتوبٌ بيدٍ في")
    add(f"**{AR(len(extra.get('hardcoded', [])))}** موضعاً في الشجرة — منها حرّاسٌ يصيرون")
    add("يحرسون خطّاً مهجوراً ويمرّون خضراً إن نُسوا:")
    add("")
    add(" · ".join(extra.get("hardcoded", [])) or "—")
    add("")
    add("فيومَ يحكم المالك: يُجلَب الخطُّ إلى `app/fonts/`، ويُبدَّل `--font-brand` وقاعدةُ")
    add("`.brand` (وهي اليومَ تكتب الاسمَ بيدها لا تقرأ الرمز)، وتُعاد الأيقوناتُ الأربع،")
    add("**ويُسقَط ملفُّ النائب من الشجرة ومن قشرة `sw`** (رفعةُ نسخة) — ويحرس ذلك كلَّه")
    add("`test_identity.mjs` (§٥): لا حِملَ لخطّ أخينا في شجرتنا بعد الحكم.")
    add("")
    head, tail = kept_block("العلامة")
    add(head)
    add(read_kept("العلامة"))
    add(tail)
    add("")
    add("> **وطائرُ العلامة** (مؤجَّلٌ من الجلسة ٠): في اقرأ يحطّ «نوري» على رأس ألف")
    add("> «اِقْرَأْ» لأن كسرتَها تحتها، **وألفُ «اُكْتُبْ» ضمّتُها فوقها** فيحجب الطائرُ")
    add("> التشكيلَ الذي هو تمايزُ العلامة. ولم يُعرَض له تركيبٌ هنا: **موضعُه تابعٌ لرسم")
    add("> الخطّ** — فارتفاعُ الضمّة وميلُها يختلفان من مرشَّحٍ إلى مرشَّح، ورسمُ تركيبٍ")
    add("> قبل الحكم رسمٌ يُعاد. فيُفتَح بعد حكم الخطّ، ومعه صفحاتُ الترحيب (الجلسة ١١).")
    add("")

    # ————— الباب ٥: الحارس —————
    add("## ٥. حارسُ الهوية — ✅ `tools/test_identity.mjs`")
    add("")
    add("«فحصٌ في كل تطبيقٍ يثبت أن قيمَ لوحه الأساسية (الورق والغالب) **تخالف** قيمَ اقرأ")
    add("المعلومة — فالوجهُ المستعار يحمرّ يومَ يُنسى لا يومَ يُلاحَظ» (`FAMILY §٩`).")
    add("وأصلُه حارسُ احسب (`calc@9ee001c:tools/test_identity.mjs`) — نُقل بحرّاسه وعُدِّل")
    add("لحالنا، وقيدُه في `SEED.md`.")
    add("")
    add("| الباب | ما يثبته |")
    add("|---|---|")
    add("| الورق | `--paper` و`--paper-deep` يخالفان ورقَ اقرأ قيمةً |")
    add("| الغالب | `--accent-letters` و`--brand-1..3` تفارق غالبَ اقرأ **بُعداً تراه العين** |")
    add("| والغالبُ غالبُنا حقّاً | `--accent` يشير إلى `--accent-letters` — فلا يُقاس رمزٌ ليس هو الغالب |")
    add("| الذهبُ مشتركٌ **بعلّةٍ معلنة** | `--star` عندنا **لونُ حكمٍ** (الإرشاد: `.pen-start`/`.pen-arrow`) لا لونٌ غالب — فيبقى ذهبَ العائلة، ويُشترَط أن يبقى الإرشادُ قارئاً له |")
    add("| خطُّ العلامة | ما دام حكمُ §٤ منتظَراً **لزم أن يبقى النائبُ معلَناً في هذه الصفحة**؛ ويومَ يُكتب الحكمُ ينقلب الشرط: يلزم أن يلبسه اللوحُ وألّا يبقى لخطّ اقرأ حِملٌ في شجرتنا |")
    add("| البصمة | قيمُ اقرأ **من التزامٍ مبصوم**، وتُقابَل بمستودعه إن وُجد (بابٌ نائمٌ يستيقظ ذاتياً) |")
    add("")

    # ————— السجل —————
    add("## ٦. سجلُّ الاعتماد")
    add("")
    add("| الباب | الحال | التاريخ |")
    add("|---|---|---|")
    add("| اللوح | ✅ **`indigo / shift`** — حكمُ المالك على لوحةٍ مصيَّرة، ومطبَّق | ١٢ أغسطس ٢٠٢٦ |")
    add(f"| وجهُ الليل | {door_state('الليل')} — مشتقٌّ ومطبَّق، ولقطاتُه معروضة | — |")
    add(f"| الأيقونة | {door_state('الأيقونة')} — امتحانُ الصفّ لقطةً | — |")
    add(f"| الاستعارة | {door_state('الاستعارة')} — ثلاثةُ أبوابٍ مصيَّرة | — |")
    add(f"| العلامة | {door_state('العلامة')} — {AR(len(data['brand']['candidates']))} خطوطٍ مصيَّرة ومقيسة" f" من {AR(len(data['brand']['candidates']) + len(data['brand']['dropped']))} جُرِّبت | — |")
    add("| حارسُ الهوية | ✅ قائمٌ ومجرَّبٌ سالباً، وفي السَّوقة بالجرد | ١٢ أغسطس ٢٠٢٦ |")
    return "\n".join(lines) + "\n"


# ————— ٨) الفحصُ الذاتيّ —————

def self_test() -> int:
    fails = 0

    def ok(cond, msg):
        nonlocal fails
        print(("  ✓ " if cond else "  ✗ ") + msg)
        if not cond:
            fails += 1

    data = json.loads(DOORS.read_text(encoding="utf-8"))
    fonts = font_files()
    siblings = sibling_fonts(data)

    print("\n— قياسُ الصورة (فكُّ PNG وحسابُ الحبر) —")
    square = bytearray(NORM * NORM)
    for y in range(20, 60):
        for x in range(20, 60):
            square[y * NORM + x] = 1
    ok(abs(shape_gap(bytes(square), bytes(square))) < 1e-9, "الشكلُ ونفسُه = صفر")
    other = bytearray(NORM * NORM)
    for y in range(20, 60):
        for x in range(80, 120):
            other[y * NORM + x] = 1
    ok(abs(shape_gap(bytes(square), bytes(other)) - 1) < 1e-9, "شكلان لا يتقاطعان = ١")
    half = bytearray(NORM * NORM)
    for y in range(20, 60):
        for x in range(40, 80):
            half[y * NORM + x] = 1
    ok(abs(shape_gap(bytes(square), bytes(half)) - 2 / 3) < 1e-9,
       "نصفان متقاطعان = ٢/٣ (تقاطعٌ على مجموع)")
    sheet = OUT / "word-sheet.png"
    if sheet.exists():
        got = png_pixels(sheet)
        ok(got[0] == COLS * CELL, f"ورقةُ القياس بعرض شبكتها: {got[0]} = {COLS}×{CELL}")

    print("\n— بيانُ الأبواب —")
    # **والاختيارُ اختيار**: مرشَّحٌ واحد ليس لوحةَ عرضٍ بل أمرَ واقع. وأمّا كم يبلغون
    # فثمرةُ القياس لا عددٌ يُطلَب — من علا الأرضيتين عُرِض، ومن نزل رُدّ ولو بقي واحد.
    ok(len(data["brand"]["candidates"]) >= 2,
       f"مرشّحو العلامة أكثرُ من واحد: {len(data['brand']['candidates'])}"
       f" من {len(data['brand']['candidates']) + len(data['brand']['dropped'])} جُرِّبت")
    slugs = [c["slug"] for c in data["brand"]["candidates"]]
    ok(len(set(slugs)) == len(slugs), "لا معرّفَ مكرّر بين المرشّحين")
    missing = [s for s in slugs if s not in fonts]
    ok(not missing, "وملفُّ كلِّ مرشَّحٍ في `tools/fonts/`" + (f" — ناقص: {missing}" if missing else ""))
    gone = [d["slug"] for d in data["brand"]["dropped"] if d["slug"] not in fonts]
    ok(not gone, "وملفُّ كلِّ مردودٍ كذلك (فعلّتُه تُقاس لا تُروى)"
                 + (f" — ناقص: {gone}" if gone else ""))
    kinds = {k["id"] for k in data["world"]["kinds"]}
    for one in data["world"]["marks"]:
        if not one["set"]:
            continue
        short = kinds - set(one["set"])
        ok(not short, f"معالمُ «{one['name']}»: لكلّ نوع محطةٍ معلمُه"
                      + (f" — ناقص: {short}" if short else ""))
    for key in ("read", "content"):
        ok(siblings[key]["there"], f"مرجعُ الخطّ «{siblings[key]['family']}» في موضعه")

    print("\n— القياسُ المحفوظ: طازجٌ أم بائت؟ —")
    if not MEASURES.exists():
        ok(False, "لا قياسَ محفوظ — شغّل `python3 tools/identity_doors.py`")
        measures = {"fonts": {}, "floors": {}, "refs": {}}
    else:
        measures = json.loads(MEASURES.read_text(encoding="utf-8"))
        now = fingerprint(data, fonts, siblings)
        drift = [k for k, v in now.items() if measures.get("fingerprint", {}).get(k) != v]
        extra_keys = [k for k in measures.get("fingerprint", {}) if k not in now]
        ok(not drift and not extra_keys,
           "بصمةُ المقيس تطابق ما على القرص" + (f" — تبدّل: {drift + extra_keys}" if drift or extra_keys else ""))
        ok(bool(measures.get("floors")), "وأرضياتُ العائلة محسوبةٌ فيه"
           + (f": أخوان {measures['floors'].get('sibling', 0):.3f} · مادّة"
              f" {measures['floors'].get('content', 0):.3f}" if measures.get("floors") else ""))

    print("\n— الدعوى تُقابَل بالرقم —")
    faults = claim_faults(data, measures)
    ok(not faults, "كلُّ علّةٍ مكتوبةٍ يصدّقها القياس"
       + ("" if not faults else " — تُكذّبها: " + "، ".join(faults)))

    print("\n— «لا يُطبَّق بابٌ قبل حكمه» —")
    css_text = P.CSS.read_text(encoding="utf-8")
    tokens = P.root_tokens(css_text)
    ok(PANEL.exists(), "صفحةُ الميثاق `docs/REVIEW_IDENTITY.md` موجودة")
    ok(COLOR_PANEL.exists(), "ولوحةُ اللون `docs/IDENTITY_COLOR.md` في موضعها")
    said = verdict("العلامة")
    stand_in = re.search(r"--font-brand:\s*'([^']+)'", css_text)
    stand_in = stand_in.group(1) if stand_in else ""
    if said == WAITING:
        ok(stand_in == siblings["read"]["family"],
           f"حكمُ العلامة منتظَر ⇐ اللوحُ على نائبه المعلَن «{stand_in}»")
    else:
        want = next((c for c in data["brand"]["candidates"] if c["family"] == said
                     or c["id"] == said), None)
        ok(want is not None, f"الحكمُ «{said}» مرشَّحٌ معروف")
        ok(want is not None and stand_in == want["family"],
           f"واللوحُ يلبسه: `--font-brand` = «{stand_in}»")
    for key in DOOR_KEYS:
        head, tail = kept_block(key)
        text = PANEL.read_text(encoding="utf-8") if PANEL.exists() else ""
        ok(text.count(head) == 1 and text.count(tail) == 1,
           f"بابُ المالك «{key}» واحدٌ لا يتشقّق")

    print("\n— اللقطاتُ المصيَّرة —")
    wanted = {name for name, *_ in shot_jobs(data, siblings)} | {n for n, _, _ in night_jobs()}
    panel = PANEL.read_text(encoding="utf-8") if PANEL.exists() else ""
    if not OUT.exists():
        ok(False, f"مجلدُ اللقطات `docs/{REL}/` مفقود")
    else:
        broken = [n for n in sorted(wanted) if not (OUT / n).exists() or not P.png_size(OUT / n)]
        ok(not broken, f"لقطاتٌ سليمة: {AR(len(wanted))}" + (f" — ناقصة: {broken}" if broken else ""))
        unseen = [n for n in sorted(wanted) if f"{REL}/{n}" not in panel]
        ok(not unseen, "كلُّ لقطةٍ تعرضها الصفحة" + (f" — لا تُعرَض: {unseen}" if unseen else ""))
        orphan = [p.name for p in sorted(OUT.glob("*.png")) if p.name not in wanted]
        ok(not orphan, "لا لقطةَ يتيمة" + (f" — يتيمة: {orphan}" if orphan else ""))
        want_paper, seen = night_paper_ok()
        if seen:
            off = [v for v in seen if v.upper() != (want_paper or "").upper()]
            ok(not off, f"ولقطاتُ الليل ورقُها ورقُ اللوح الليليّ {want_paper}"
                        + (f" — تخالف: {off}" if off else ""))

    print("\n— الصفحةُ مولَّدةٌ لا تُحرَّر بيد —")
    if PANEL.exists() and MEASURES.exists():
        extra = {"hardcoded": brand_hardcoded(), "fit": measures.get("fit"),
                 "night_paper": night_paper_ok() if (OUT / "night-map.png").exists() else None}
        remade = panel_text(data, measures, fonts, siblings, tokens, extra)
        ok(panel == remade, "ما على القرص عينُ ما يخرج من المولّد")
        for key in DOOR_KEYS:
            ok(read_kept(key) in remade, f"وبابُ «{key}» يعود بحرفه")

    print(f"\n{AR(fails)} إخفاق" if fails else "\nالفحصُ الذاتيّ أخضر")
    return 1 if fails else 0


# ————— ٩) السَّوق —————

def run(args) -> int:
    data = json.loads(DOORS.read_text(encoding="utf-8"))
    fonts = font_files()
    siblings = sibling_fonts(data)
    specimens = specimen_list(data, fonts, siblings)
    payload, extra_routes = payload_for(data, fonts, siblings, specimens)

    print(f"— الخطوطُ المجرَّبة: {len(fonts)} · خلايا القياس: {len(specimens)}"
          f" ({sheet_rows(specimens)} صفّاً) —")
    for key in ("read", "calc", "content"):
        info = siblings[key]
        print(f"  · مرجع {key}: {info['family']} — "
              + ("مقروءٌ من موضعه" if info["there"] else "**غائبٌ عن هذا الجهاز**"))

    if args.numbers:
        if MEASURES.exists():
            measures = json.loads(MEASURES.read_text(encoding="utf-8"))
            print(f"\n— الأرضيات — أخوان {measures['floors'].get('sibling', 0):.3f}"
                  f" · مادّة {measures['floors'].get('content', 0):.3f}")
            for slug, one in measures["fonts"].items():
                print(f"  {slug:18s} {one['gap']} · تشكيل {one['marks_above']:.2f}"
                      f" · لون {one['colored']:.3f}")
            for line in claim_faults(data, measures):
                print("    ⚠ " + line)
        else:
            print("لا قياسَ محفوظ بعد.")
        return 0

    OUT.mkdir(parents=True, exist_ok=True)
    state = {"ready": threading.Event(), "failed": False, "timeout": args.timeout, "measure": None}
    server = make_server(args.port, state, payload, extra_routes)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{args.port}"
    fails = []
    fit = None
    try:
        print("\n— اللقطات —")
        for name, url, size, dark, title in shot_jobs(data, siblings):
            if args.only and args.only not in name:
                continue
            if name == "word-sheet.png":
                size = (COLS * CELL, sheet_rows(specimens) * CELL)
            err = capture(base, state, url, OUT / name, size, args.timeout, dark)
            if err:
                fails.append(f"{name} — {err}")
                print(f"  ✗ {name} — {err}")
            else:
                print(f"  ✓ {name} — {title}")
                if name == "icon-row.png" and state["measure"]:
                    fit = state["measure"].get("fit")
    finally:
        server.shutdown()

    if not args.only or args.only == "night":
        print("\n— لقطاتُ الليل (بوسيط الجهاز المظلم) —")
        fails += capture_night(args.port + 1, args.timeout)

    sheet = OUT / "word-sheet.png"
    if not sheet.exists():
        print("\nلا ورقةَ قياس — لا يُعاد بناءُ الأرقام.")
        return 1
    print("\n— القياس —")
    measures = build_measures(data, fonts, siblings, sheet, specimens)
    if fit:
        measures["fit"] = fit
    elif MEASURES.exists():
        old = json.loads(MEASURES.read_text(encoding="utf-8"))
        if old.get("fit"):
            measures["fit"] = old["fit"]
    MEASURES.write_text(json.dumps(measures, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"  أرضيةُ الأخوين {measures['floors'].get('sibling', 0):.3f}"
          f" · أرضيةُ المادّة {measures['floors'].get('content', 0):.3f}")
    for line in claim_faults(data, measures):
        print("  ⚠ " + line)

    if not args.only:
        tokens = P.root_tokens(P.CSS.read_text(encoding="utf-8"))
        extra = {"hardcoded": brand_hardcoded(), "fit": measures.get("fit"),
                 "night_paper": night_paper_ok() if (OUT / "night-map.png").exists() else None}
        PANEL.write_text(panel_text(data, measures, fonts, siblings, tokens, extra), encoding="utf-8")
        print(f"\nالصفحة: {PANEL.relative_to(ROOT)}")
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser(description="أبوابُ ميثاق الهوية الباقية")
    ap.add_argument("--numbers", action="store_true", help="الأرقامُ المحفوظة بلا متصفّح")
    ap.add_argument("--only", help="بابٌ واحد بجزءٍ من اسم لقطته: fonts · icon · world · night")
    ap.add_argument("--self-test", action="store_true", help="فحصُ الأداة نفسِها")
    ap.add_argument("--port", type=int, default=8799)
    ap.add_argument("--timeout", type=int, default=90)
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    return run(args)


if __name__ == "__main__":
    sys.exit(main())
