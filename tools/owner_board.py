#!/usr/bin/env python3
"""**مِرْسَمةُ المرجع** — لوحُ المالك على الآيباد، ويدُه تُملي الشكلَ والحركةَ معاً.

    python3 tools/owner_board.py            # يفتح المِرسمةَ ويطبع عنوانَها للآيباد
    python3 tools/owner_board.py --check     # مشهدُ متصفّحٍ: الطابورُ والتطبيعُ والعكس
    python3 tools/owner_board.py --self-test # عهدُ المِرسمة بلا متصفّح

## لِمَ أداةٌ ثانيةٌ بخادمٍ ثانٍ؟

خادمُ الفحص (`browser_test.make_server`) يستمع على `127.0.0.1` وحدَه ولا يقبل إلا
`POST /result` — **وكلاهما مقصودٌ فيه**: لا يدخل عليه جارٌ، ولا يُقرأ منه إلا تقريرُ
فحص. والمِرسمةُ تحتاج نقيضَ الاثنين: **الآيبادُ يبلغها على الشبكة المحلية**،
**و«اعتمد» يكتب في ملفٍّ بـ`POST /accept`**. فلو وُسّع خادمُ الفحص لهما لصار كلُّ
فحصٍ في البيت باباً مفتوحاً على الشبكة وكاتباً في ملفّات — **فبيتٌ ثانٍ لهذه وحدَها**،
ويبقى بيتُ الفحص على إغلاقه. (وهي حظيرةُ `browser_test` نفسِها في مُشغِّل Chrome.)

## ما يخرج من هنا

`tools/owner_shapes.json` — **أشكالُ المالك المُقَرَّة**: ضرباتُه بترتيبها واتجاهها
على الشبكة ١٠٠٠×١٠٠٠، مختومةً `origin: owner` وتاريخِها. **وتعديلُ العهد منصوصٌ في
بند ص٥/٤**: «لا إحداثيّ إلا من هيكل الخيال **أو من يد المالك مرجعاً**، ويُختم بمصدره
وتاريخه ويحرسه فاحص».

**ولا تُكتب `path_anchors.json` من هنا**: الإيماءةُ أرقامُ عُقَدٍ على **خيالنا**،
وأثرُ يده **مرجعُ شكلٍ يحلّ محلَّ الخيال** — فالكتابةُ في ملفّ الإيماءات كتابةُ
جوابٍ في دفتر سؤالٍ آخر. **وبناءُ `paths.js` من هذه الطبقة بندُ جلسةٍ تالية** (نصُّ
عقد ص٥: «ولا يُعاد بناءُ paths.js في هذه الجلسة… بعد أن يمرّ المالكُ على دفعته الأولى»)،
وصيغتُها مهيّأةٌ له: `strokes` نقاطٌ على الشبكة و`dots` مواضعُ نقرٍ — وهو عينُ ما في
`PATHS` إلا أنّ `start` أوّلُ النقاط.

## والخصوصيةُ بحالها

المِرسمةُ **صفحةُ تأليفٍ كأختها** (`make_paths.html` بوضعٍ جديد) تُخدَم من `tools/`،
ولا تمسّ وحدةً من وحدات التطبيق: `app/js/pen.js` بلا استيرادٍ ولا `fetch`، وحارساه
(`test_pen.mjs §١` و`browser_pen`) على حالهما — **وهذا الملفُّ لا يكتب في `app/` حرفاً**.
"""

import argparse
import http.server
import json
import re
import socket
import socketserver
import sys
import threading
import time
from datetime import date
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
APP = ROOT / "app"
TOOL_PAGE = TOOLS / "make_paths.html"
ANCHORS = TOOLS / "path_anchors.json"
SHAPES = TOOLS / "owner_shapes.json"
PATHS_JS = APP / "js" / "paths.js"
FORMS = ["isolated", "initial", "medial", "final"]

sys.path.insert(0, str(TOOLS))
import browser_test  # noqa: E402  (مُشغِّلُ Chrome — تبعيةٌ معلَنة كما في make_paths)
import ports  # noqa: E402  (جدولُ المنافذ — تُقرأ من موضعٍ واحد)

# **رأسُ ملفّ الأشكال يقول ما فيه** — سنّةُ `path_anchors.json` نفسُها: ملفُّ بياناتٍ
# يحمل عقدَه معه، فلا يُقرأ يوماً بلا سنده.
HEADER = {
    "what": "أشكالُ المالك المُقَرَّة — **أثرُ يدٍ تكتب العربية صحيحةً، مرجعاً للشكل والحركة معاً**",
    "how": ("لكلِّ شكلٍ ضرباتُ المالك بترتيبها واتجاهها على شبكة ١٠٠٠×١٠٠٠، كتبها فوق خيالنا "
            "الخافت في المِرسمة (tools/owner_board.py). والتطبيعُ معلَنٌ في `norm`: تحويلُ تشابهٍ "
            "يحاذي خطَّي الأساس والقمّة، ثم تنعيمٌ خفيف، ثم عيّناتٌ منتظمة بخطوة المحرّك — "
            "و`max` أقصى ما أزاحه التطبيعُ عن أثره، ولا يُعتمَد ما جاوز `limit` (سماحةُ المحرّك)."),
    "guard": ("`origin: owner` و`at` ختمُ المصدر والتاريخ — تعديلُ عهد «لا إحداثياتٌ تُكتب بيد» "
              "منصوصٌ في SESSIONS.md بند ص٥/٤: العهدُ ضدَّ الرقم المظنون لا ضدَّ المرجع المرسوم. "
              "و`sig` بصمةُ الخيال الذي كُتب فوقه ساعتَها، فإن تبدّل الخيالُ عُرف على أيِّ شيءٍ كُتب."),
    "tool": "tools/owner_board.py (صفحتُها tools/make_paths.html?board=1)",
}


def shapes() -> dict:
    """ملفُّ الأشكال كما هو — أو رأسُه وحدَه إن لم يُكتب بعد."""
    if SHAPES.exists():
        return json.loads(SHAPES.read_text(encoding="utf-8"))
    return {**HEADER, "letters": {}, "words": {}}


def save(data: dict) -> None:
    """**الكتابةُ فوريّةٌ عند الاعتماد** (ص٥/٦) — وبصيغة `path_anchors.json` نفسِها."""
    SHAPES.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")


def done_keys(data: dict) -> list:
    """ما اعتُمد بيده — **مصدرُ الاستئناف**: الملفُّ نفسُه لا ذاكرةُ متصفّح."""
    keys = [f"{ch}/{form}" for ch, forms in data.get("letters", {}).items() for form in forms]
    return keys + [f"كلمة/{text}" for text in data.get("words", {})]


def current_paths() -> dict:
    """`PATHS` المبنيّة اليوم — يُقارَن بها ما يعتمده، ولا تُكتب من هنا."""
    if not PATHS_JS.exists():
        return {}
    body = re.search(r"export const PATHS = (\{.*?\n\});", PATHS_JS.read_text(encoding="utf-8"), re.S)
    return json.loads(body.group(1)) if body else {}


def box_of(strokes: list) -> tuple:
    pts = [p for stroke in strokes for p in stroke]
    if not pts:
        return (0.0, 0.0)
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return (round(max(xs) - min(xs), 1), round(max(ys) - min(ys), 1))


def compare(payload: dict, was: dict) -> list:
    """**وكلُّ شكلٍ يمرّ يُقارَن آلياً بما كان** (ص٥/٧): جهةٌ · ترتيبٌ · نِسَب.

    ولا يُقارَن ما لا مقابلَ له — كلمةٌ أو شكلٌ لم يُبنَ بعد يُقال فيه ذلك ولا يُخترع فرق.
    """
    new = payload["strokes"]
    if not was:
        return [f"لا مقابلَ مبنيّاً — {len(new)} جزءاً جديداً"]
    old = [s["points"] for s in was.get("strokes", [])]
    lines = []
    if len(old) != len(new):
        lines.append(f"**الترتيبُ تبدّل**: {len(old)} جزءاً ⇐ {len(new)}")
    else:
        lines.append(f"الترتيبُ كما كان: {len(new)} جزءاً")
    for i, (a, b) in enumerate(zip(old, new), 1):
        if not a or not b:
            continue
        shift = round(((a[0][0] - b[0][0]) ** 2 + (a[0][1] - b[0][1]) ** 2) ** 0.5, 1)
        # وجهةُ الجزء: زاويةُ أوّله إلى آخره — والانعكاسُ يُقال باسمه لا برقمٍ يُفسَّر
        va = (a[-1][0] - a[0][0], a[-1][1] - a[0][1])
        vb = (b[-1][0] - b[0][0], b[-1][1] - b[0][1])
        flip = va[0] * vb[0] + va[1] * vb[1] < 0
        lines.append(f"  جزء {i}: البدايةُ زاحت {shift} وحدة"
                     + ("  ⚠ **والجهةُ انعكست**" if flip else ""))
    wo, ho = box_of(old)
    wn, hn = box_of(new)
    lines.append(f"النِّسَب: {wo}×{ho} ⇐ {wn}×{hn}")
    return lines


def accept(payload: dict) -> dict:
    """يكتب ما اعتمده بيده، ويطبع فرقَه عمّا كان — **ولا يمرّ ما لم يُقَس قربُه**."""
    kind = payload.get("kind")
    strokes = payload.get("strokes") or []
    dots = payload.get("dots") or []
    norm = payload.get("norm") or {}
    if kind not in ("letter", "digit", "word"):
        return {"ok": False, "why": f"خانةٌ لا تُعرَف: {kind}"}
    if not strokes and not dots:
        return {"ok": False, "why": "لا أثرَ يُعتمَد"}
    if not all(isinstance(s, list) and all(len(p) == 2 for p in s) for s in strokes):
        return {"ok": False, "why": "ضرباتٌ لا تُقرأ نقاطاً"}
    # **والحدُّ يُحرَس هنا كما يُحرَس هناك**: صفحةٌ تُغلق زرَّها، وخادمٌ لا يكتب ما بعُد.
    limit = norm.get("limit")
    if strokes and (limit is None or norm.get("max") is None or norm["max"] > limit):
        return {"ok": False, "why": f"قربُ الرسم {norm.get('max')} جاوز الحدَّ {limit}"}

    data = shapes()
    data.update(HEADER)
    entry = {
        "strokes": strokes,
        "dots": dots,
        "sig": payload.get("sig"),
        "sheet": payload.get("sheet"),
        "norm": norm,
        "origin": "owner",
        "at": date.today().isoformat(),
    }
    if kind == "word":
        entry["note"] = "مسارُ الوصل بيده — دَورُ الكلمات (ص٥/٨)"
        data.setdefault("words", {})[payload["text"]] = entry
        was = None
        title = payload["text"]
    else:
        ch = payload.get("ch")
        form = payload.get("form")
        if not ch or form not in FORMS:
            return {"ok": False, "why": "حرفٌ أو شكلٌ لا يُعرَف"}
        if kind == "digit":
            # **أشكالُ الرقم الأربعة متطابقةٌ بايتاً** — فرسمُه مرّةً يسري عليها،
            # ويُكتب صريحاً في بيانه لا يُترك يُستنبَط.
            entry["twins"] = FORMS
            entry["note"] = "الرقمُ يُرسَم مرّةً — وأشكالُه الأربعة متطابقةٌ فيسري عليها"
        data.setdefault("letters", {}).setdefault(ch, {})[form] = entry
        was = current_paths().get(ch, {}).get(form)
        title = f"{ch}/{form}"
    save(data)

    print(f"\n✍️  اعتُمد بيده: {title}"
          f" — {len(strokes)} جزءاً و{len(dots)} نقرة"
          f" · التطبيعُ ×{norm.get('scale')} وأقصى إزاحةٍ {norm.get('max')} من {limit}")
    for line in compare({"strokes": strokes}, was):
        print("   " + line)
    keys = done_keys(data)
    print(f"   ⇐ {len(keys)} خانةً معتمدةً حتى الآن في {SHAPES.name}", flush=True)
    return {"ok": True, "done": keys, "said": f"اعتُمد ✓ ({len(keys)})"}


# ————— الخادمُ المحليّ: على الشبكة، ويكتب عند الاعتماد —————


def lan_address() -> str:
    """عنوانُ هذا الجهاز على الشبكة المحلية — يُقرأ من المقبس لا يُكتب بيد."""
    probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        probe.connect(("192.168.1.1", 9))     # لا يُرسَل شيء — يُقرأ منه المسلكُ وحدَه
        return probe.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        probe.close()


def make_server(port: int, results: list, lan: bool):
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(APP), **kw)

        def send_json(self, payload, code=200):
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def send_file(self, path: Path, mime: str):
            body = path.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", f"{mime}; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            path = self.path.partition("?")[0]
            if path in ("/", "/mirsam"):
                # **والتحويلُ يحمل استعلامَ الزائر معه** (عيبٌ أمسكه المالك، ١٩ أغسطس
                # ٢٠٢٦): كان يبتلع `?only=marks` فيفتح الطابورَ الكامل مكانَ المطلوب —
                # فيرسم المالكُ خمسَ كلماتٍ ليست ما طُلب منه.
                extra = self.path.partition("?")[2]
                target = "/__make_paths.html?board=1" + (f"&{extra}" if extra else "")
                self.send_response(302)
                self.send_header("Location", target)
                self.end_headers()
                return
            if path == "/__make_paths.html":
                return self.send_file(TOOL_PAGE, "text/html")
            if path == "/__anchors.json":
                return self.send_file(ANCHORS, "application/json")
            if path == "/__owner.json":
                return self.send_json(shapes())
            if path == "/__done.json":
                return self.send_json({"done": done_keys(shapes())})
            super().do_GET()

        def do_POST(self):
            raw = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            path = self.path.partition("?")[0]
            try:
                payload = json.loads(raw.decode("utf-8"))
            except (json.JSONDecodeError, UnicodeDecodeError):
                return self.send_json({"ok": False, "why": "حمولةٌ لا تُقرأ"}, 400)
            if path == "/accept":
                if not isinstance(payload, dict):
                    return self.send_json({"ok": False, "why": "حمولةٌ لا تُقرأ"}, 400)
                out = accept(payload)
                return self.send_json(out, 200 if out.get("ok") else 400)
            if path == "/result":
                # مشهدُ الفحص يرسل تقريرَه كما ترسله سائرُ صفحاتنا
                if isinstance(payload, dict) and payload.get("from") == browser_test.REPORT_FROM:
                    rows = payload.get("rows")
                    if isinstance(rows, list) and all(isinstance(r, dict) for r in rows):
                        results[:] = rows
                self.send_response(204)
                self.end_headers()
                return
            self.send_response(404)
            self.end_headers()

        def log_message(self, *a):
            pass

        def handle_one_request(self):
            try:
                super().handle_one_request()
            except (BrokenPipeError, ConnectionResetError):
                self.close_connection = True

    socketserver.TCPServer.allow_reuse_address = True
    # **والاستماعُ على الشبكة اختيارٌ معلَن**: `--check` لا يحتاجها فيبقى على الحلقة
    # المحلية، ولوحُ الآيباد وحدَه يفتح البابَ — وبيتُ الفحص لا يُمسّ في الحالين.
    host = "0.0.0.0" if lan else "127.0.0.1"
    try:
        return socketserver.ThreadingTCPServer((host, port), Handler)
    except OSError as e:
        sys.exit(f"تعذّر فتحُ خادم المِرسمة على المنفذ {port}: {e}\n"
                 f"  — منفذٌ مشغولٌ الآن؟ جرّب: --port {port + 1}")


def open_board(port: int) -> int:
    server = make_server(port, [], lan=True)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    host = lan_address()
    print("المِرسمةُ مفتوحة — افتح على الآيباد (وهو على شبكة البيت نفسِها):\n")
    print(f"    http://{host}:{port}/\n")
    print(f"  وعلى هذا الجهاز: http://127.0.0.1:{port}/")
    print(f"  وما تعتمده يُكتب فوراً في {SHAPES.relative_to(ROOT)}"
          f" — وفرقُه عمّا كان يُطبع هنا سطراً سطراً.")
    print("  (Ctrl-C لإغلاق الخادم.)\n", flush=True)
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        print("\nأُغلقت المِرسمة.")
    finally:
        server.shutdown()
    return 0


def check(port: int, timeout: int) -> int:
    """مشهدُ المتصفّح: الطابورُ محسوب، والتطبيعُ لا يبدّل الهوية، والعكسُ يخرج عكساً."""
    import shutil
    import tempfile
    results = []
    server = make_server(port, results, lan=False)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    profile = Path(tempfile.mkdtemp(prefix=browser_test.CHROME_PREFIX + "board-"))
    url = f"http://127.0.0.1:{port}/__make_paths.html?board=1&check=1"
    try:
        proc = browser_test.run_chrome(url, profile, ["--hide-scrollbars"], False)
        deadline = time.time() + timeout
        while time.time() < deadline and not results:
            time.sleep(0.4)
        proc.kill()
    finally:
        server.shutdown()
        shutil.rmtree(profile, ignore_errors=True)
    if not results:
        print("لم تصل حصيلةٌ من المشهد.")
        return 1
    for r in results:
        print(("  ✓ " if r["ok"] else "  ✗ ") + r["msg"])
    bad = sum(1 for r in results if not r["ok"])
    print("\n" + ("مشهدُ المِرسمة أخضر." if not bad else f"{bad} فشل"))
    return 1 if bad else 0


# ————— لقطةُ اللوح بمقاس الآيباد: **بعينه لا بوصفنا** —————
#
# سنّةُ أبواب الهوية (ص٣/٨): ما يُعرَض على المالك يُصيَّر بمقاس جهازه ويُنظَر إليه
# قبل أن يُقال إنه تمّ. **وعلّتُها بلاغُه في صفحة التجربة** (١٧ أغسطس): «مكانُ الكتابة
# مربّعٌ في المنتصف ضيّق» — والقياسُ هنا **نصيبُ اللوح من المنظور** لا وصفُنا له.


def shots(port: int, timeout: int, out: Path) -> int:
    import shutil
    import tempfile
    out.mkdir(parents=True, exist_ok=True)
    sizes = [(name, size) for name, size in browser_test.DEVICE_SIZES if "١٠٫٩" in name]
    results = []
    server = make_server(port, results, lan=False)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    good = []
    try:
        for name, size in sizes:
            png = out / f"mirsam-{size.replace(',', 'x')}.png"
            png.unlink(missing_ok=True)
            results.clear()
            profile = Path(tempfile.mkdtemp(prefix=browser_test.CHROME_PREFIX + "shot-"))
            proc = browser_test.run_chrome(
                f"http://127.0.0.1:{port}/__make_paths.html?board=1&shot=1",
                profile,
                ["--hide-scrollbars", f"--screenshot={png}",
                 f"--window-size={browser_test.window_of(size)}"], False)
            deadline = time.time() + timeout
            while time.time() < deadline and not (png.exists() and results):
                time.sleep(0.4)
            time.sleep(0.8)
            proc.kill()
            shutil.rmtree(profile, ignore_errors=True)
            # **والنصيبُ يُقاس في الشاشة لا يوصَف**: الصفحةُ تقول كم ملأ اللوحُ منها
            rows = list(results) or [{"ok": False, "msg": "لم يصل قياسُ اللوح"}]
            print(f"  {name} ({size}) — {png.name}:")
            for row in rows:
                print(("    ✓ " if row["ok"] else "    ✗ ") + row["msg"])
            good.append(png.exists() and all(r["ok"] for r in rows))
    finally:
        server.shutdown()
    return 0 if good and all(good) else 1


# ————— الفحصُ الذاتي: عهدُ المِرسمة بلا متصفّح —————


def self_test() -> int:
    checks = []

    def ok(cond, msg):
        checks.append((bool(cond), msg))

    page = TOOL_PAGE.read_text(encoding="utf-8")

    # ١) **الطابورُ محسوبٌ من البيان لا مكتوبٌ رقماً**: ٢٨ حرفاً × ٤ + ١٠ أرقام
    spec = json.loads(ANCHORS.read_text(encoding="utf-8"))
    letters = [ch for ch in spec["letters"] if not re.match(r"[٠-٩]", ch)]
    digits = [ch for ch in spec["letters"] if re.match(r"[٠-٩]", ch)]
    ok(len(letters) * len(FORMS) + len(digits) == 122,
       f"الطابورُ محسوبٌ من البيان: {len(letters)}×{len(FORMS)} + {len(digits)} = "
       f"{len(letters) * len(FORMS) + len(digits)} خانة")

    # ٢) **وما يخرج من يده مختومٌ بمصدره وتاريخه** — تعديلُ العهد المنصوص
    data = shapes()
    stamped = [e for forms in data.get("letters", {}).values() for e in forms.values()]
    stamped += list(data.get("words", {}).values())
    ok(all(e.get("origin") == "owner" and e.get("at") for e in stamped),
       f"وكلُّ شكلٍ مقَرٍّ مختومٌ `origin: owner` وتاريخِه ({len(stamped)} شكلاً)")
    ok(HEADER["guard"] in json.dumps(HEADER, ensure_ascii=False),
       "ورأسُ الملفّ يحمل عقدَه: ما هو، وكيف طُبّع، وبأيّ ختمٍ يُقرأ")

    # ٣) **ولا تُكتب `path_anchors.json` ولا `app/` من هنا** — يُقرأ ما يعمل لا ما يُشرَح
    code = re.sub(r"#[^\n]*", " ", re.sub(r'"""[\s\S]*?"""', " ", Path(__file__).read_text(encoding="utf-8"), count=1))
    # **والمسموحُ اثنان يُسمّيان**: ملفُّ الأشكال، **ولقطةٌ في المجلد الذي يسمّيه
    # المستعمل بـ`--shot`** (لا موضعَ في المشروع تختاره الأداةُ لنفسها).
    writes = sorted(set(re.findall(r"(\w+)\.(?:write_text|write_bytes|unlink|open\(['\"]w)", code)))
    ok(set(writes) <= {"SHAPES", "png"},
       f"ولا يكتب إلا في owner_shapes.json ولقطةِ `--shot` — ما كُتب إليه: {writes or 'لا شيء'}")
    # **ويُركَّب اسمُ الممنوع لا يُكتب**: حارسٌ يذكر ما يمنعه حرفاً يُمسِك نفسَه
    # (سنّةُ حارس الخصوصية في `test_pen.mjs`: يُقرأ ما يعمل لا ما يُشرَح).
    forbidden = [name + "." + "write" for name in ("ANCHORS", "PATHS_JS", "APP", "TOOL_PAGE")]
    touched = [t for t in forbidden if t in code]
    ok(not touched, "ولا يمسّ path_anchors.json ولا وحدةً في app/ — تُقرأ ولا تُكتب"
       + (f" — مُسّ {touched}" if touched else ""))

    # ٤) **وحارسُ خصوصية القلم بحاله**: `pen.js` بلا شبكةٍ ولا استيراد — تُقرأ الشيفرةُ
    pen = (APP / "js" / "pen.js").read_text(encoding="utf-8")
    body = re.sub(r"/\*[\s\S]*?\*/", " ", pen)
    body = re.sub(r"(^|\s)//[^\n]*", " ", body)
    net = [t for t in ("fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource",
                       "http://", "https://", ".upload") if t in body.replace("http://www.w3.org/2000/svg", "svg-ns")]
    ok(not net, "وحارسُ خصوصية القلم بحاله: pen.js بلا شبكةٍ" + (f" — وُجد {net}" if net else ""))
    ok(not re.search(r"^\s*import\s", body, re.M),
       "ولا استيرادَ فيه — فقناةُ المِرسمة لا تمسّ وحدةً من وحدات التطبيق")

    # ٥) **والصفحةُ تعرف وضعَها**: مِرسمةٌ ومشهدُها في `make_paths.html` بعينه
    ok("runOwnerBoard" in page and "runOwnerCheck" in page and "qs.has('board')" in page,
       "ووضعُ المِرسمة في صفحة التأليف نفسِها — خيالٌ واحدٌ لا خيالان")
    ok("TOLERANCE.lateral" in page and "origin" not in page.split("runOwnerBoard")[0][-200:],
       "وحدُّ القرب سماحةُ المحرّك نفسُها (TOLERANCE.lateral) لا رقمٌ منثور")

    # ٦) **والاعتمادُ يُردّ إن بعُد** — يُجرَّب سالباً هنا بلا متصفّح
    far = accept_dry({"kind": "letter", "ch": "ط", "form": "isolated",
                      "strokes": [[[0, 0], [100, 100]]], "dots": [],
                      "norm": {"max": 999, "limit": 90}})
    ok(not far.get("ok"), f"وما جاوز الحدَّ يُردّ ولا يُكتب — «{far.get('why')}»")
    empty = accept_dry({"kind": "letter", "ch": "ط", "form": "isolated",
                        "strokes": [], "dots": [], "norm": {}})
    ok(not empty.get("ok"), f"وأثرٌ فارغٌ لا يُعتمَد — «{empty.get('why')}»")

    for good, msg in checks:
        print(("  ✓ " if good else "  ✗ ") + msg)
    bad = sum(1 for good, _ in checks if not good)
    print("\n" + ("المِرسمةُ على عهدها: طابورٌ محسوب، وختمٌ لكلِّ شكل، وقلمٌ بلا شبكة."
                  if not bad else f"{bad} فشل"))
    return 1 if bad else 0


def accept_dry(payload: dict) -> dict:
    """`accept` بلا كتابةٍ — للفحص الذاتي: يُجرَّب الرفضُ ولا يُمَسّ ملفّ."""
    before = SHAPES.read_bytes() if SHAPES.exists() else None
    out = accept(payload)
    if before is None:
        SHAPES.unlink(missing_ok=True)
    else:
        SHAPES.write_bytes(before)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description="مِرسمةُ المرجع — لوحُ المالك على الشبكة المحلية")
    ap.add_argument("--check", action="store_true", help="مشهدُ متصفّحٍ للطابور والتطبيع والعكس")
    ap.add_argument("--shot", metavar="DIR", help="لقطاتُ اللوح بمقاس الآيباد طولاً وعرضاً")
    ap.add_argument("--self-test", action="store_true", help="عهدُ المِرسمة بلا متصفّح")
    ap.add_argument("--port", type=int, default=ports.port_of("owner_board"))
    ap.add_argument("--timeout", type=int, default=180)
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    if args.check:
        return check(args.port, args.timeout)
    if args.shot:
        return shots(args.port, args.timeout, Path(args.shot).resolve())
    return open_board(args.port)


if __name__ == "__main__":
    sys.exit(main())
