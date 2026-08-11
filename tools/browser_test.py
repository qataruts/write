#!/usr/bin/env python3
"""تشغيل اختبارات الواجهة في متصفّح حقيقي (Chrome بلا واجهة) بلا أي تبعيات.

    python3 tools/browser_test.py                # فحصُ القشرة: يفتح التطبيق ويطبع التقرير
    python3 tools/browser_test.py --shots o.png  # لقطةٌ للمراجعة البصرية
    python3 tools/browser_test.py --show         # بمتصفّح مرئي لتتبّع ما يجري

**من بذرة اقرأ** (`FAMILY.md §٥`: «`browser_test.py` وعدَدُه») — والمنقولُ **الحظيرةُ
لا السَّوقة**: الخادمُ الذي يخدم `app/` ويضيف صفحاتِ الاختبار من `tools/` وحدها (فلا
تبقى في `app/` صفحةُ اختبارٍ تُخدَم للطفل)، ومُشغِّلُ Chrome، واستقبالُ النتيجة
بـ`POST /result`، **وعدّادُ طلبات الصوت عند الخادم** — وهو شاهدٌ لا يُخفيه شيء.

**وصفحاتُ اقرأ الاثنتان والعشرون لم تُنقَل**: كلٌّ منها تسوق شاشةً من شاشاته. وتُكتب
صفحاتُ «اُكْتُبْ» في جلساتها: **فحصُ خصوصية القلم بصفر طلباتٍ شبكية في الجلسة ١**
(وهو أوّلُ ما يحتاج هذه الحظيرة، ولذلك بقي عدّادُ الطلبات كما هو)، ومحطاتُ التهيئة
في الجلسة ٤، وعدّةُ الأجهزة (`--device`) في الجلسة ١٢.

**وصفحةُ اليوم واحدة**: `browser_test.html` — فحصُ القشرة على تطبيقٍ فارغ: يفتح بلا
خطأ جافاسكربت واحد، وتُرسَم الخريطةُ وعلامتُها، وأهدافُ اللمس ≥ ٦٤ بكسل (`DESIGN §٤`).

ملاحظة: --dump-dom و--virtual-time-budget غير موثوقين مع fetch والصوت،
لذلك تُرسَل النتائج من الصفحة نفسها ثم يُقتل المتصفّح.
"""

import argparse
import http.server
import json
import re
import shutil
import socketserver
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app"
TOOLS = Path(__file__).resolve().parent
PAGES = {
    "/__test.html": TOOLS / "browser_test.html",
    "/__pen.html": TOOLS / "browser_pen.html",
    "/__paths.html": TOOLS / "browser_paths.html",
}
# سَوقةُ الصفحات: `--suite <اسم>` يختار أيَّها يُشغَّل، والافتراضُ فحصُ القشرة.
SUITES = {
    "shell": "/__test.html",       # الجلسة ٠: التطبيق يفتح بلا خطأ جافاسكربت واحد
    "pen": "/__pen.html",          # الجلسة ١: خصوصيةُ القلم — صفرُ طلباتٍ في دورة كتابة
    "paths": "/__paths.html",      # الجلسة ٢: كلُّ حرفٍ يُعرض من مساره ويُحكم عليه
}
# نافذة Chrome بلا واجهة تحجز ٨٧ بكسلاً لإطارٍ وهميّ فوق المنظور — فلولا تعويضها لقِسنا
# جهازاً أقصر من الجهاز. والصفحة تعيد منظورها الحقيقي، والعدّاء يرفض أي انحرافٍ عن المطلوب.
VIEWPORT_PAD = 87
# مقاسات الجهاز الحقيقية (بكسل CSS) — بلاغ المالك عن الآيباد جاء من هذه الأرقام لا من نافذة سطح مكتب
DEVICE_SIZES = [
    ("آيباد ٩٫٧ طولي", "768,1024"),
    ("آيباد ١٠٫٩ طولي", "820,1180"),
    ("آيباد ٩٫٧ عرضي", "1024,768"),
    ("آيباد ١٠٫٩ عرضي", "1180,820"),
    ("آيباد ميني عرضي", "1133,744"),
]
# **أعلامُ الميكروفون الوهميّ لم تُنقَل**: «اُكْتُبْ» لا يلتقط صوتاً ألبتّة.
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
QUEUE_FILE = ROOT / "tools" / "audio_queue.json"


def pending_texts() -> list:
    """النصوص المنتظِرة في قائمة الانتظار الصوتية (docs/AUDIO_QUEUE.md).

    صفحات الاختبار تستثنيها من فحص «لا لجوء للنطق الآلي»: لا ملف لها بعدُ لأن
    جلسة الصوتيات لم تصرّفها، فاحتياط النطق هو السلوك الصحيح مؤقتاً — وبعد التصريف
    تفرغ القائمة فيعود الفحص صارماً على كل نصّ بلا تعديل في الصفحات.
    """
    if not QUEUE_FILE.exists():
        return []
    try:
        data = json.loads(QUEUE_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []
    return [e["text"] for e in data
            if isinstance(e, dict) and e.get("text") and e.get("status", "pending") != "done"]


def make_server(port: int, results: list):
    # عدّادُ طلبات الصوت **عند الخادم** (حزمة «خفّة التخزين»): الشاهدُ الوحيد على أن
    # ترقيةَ نسخةٍ لا تعيد تنزيل الصوت — فجلبُ عامل الخدمة لا يمرّ بالصفحة فلا تراه،
    # وأثرُه هنا لا يُخفيه شيء. تقرؤه صفحةُ الاختبار على `/__audio_hits.json`.
    hits = {"mp3": 0}

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(APP), **kw)

        def do_GET(self):
            path, _, query = self.path.partition("?")
            if path.startswith("/audio/") and path.endswith(".mp3"):
                hits["mp3"] += 1
            if path == "/__audio_hits.json":
                body = json.dumps(hits).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Cache-Control", "no-store")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            # ترقيةُ نسخةِ عامل الخدمة في بيئة الاختبار (الحزمة ١١): `app/sw.js` **نفسُه**
            # برقم نسخةٍ مرفوع — فتقع الترقية كما تقع على جهاز الطفل (تركيبٌ ثم تفعيلٌ
            # يمحو مخزون السابقة)، ويُقاس عندها بقاءُ التقدّم. لا نسخةَ ثانية من الملف.
            if path == "/sw.js" and "bump=" in query:
                tag = re.sub(r"[^0-9A-Za-z-]", "", query.split("bump=")[1].split("&")[0])
                src = (APP / "sw.js").read_text(encoding="utf-8")
                body = re.sub(r"(const VERSION = '[^']*)'", rf"\1-bump{tag}'", src, count=1)
                raw = body.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/javascript; charset=utf-8")
                self.send_header("Content-Length", str(len(raw)))
                self.end_headers()
                self.wfile.write(raw)
                return
            if path == "/__queue.json":
                body = json.dumps(pending_texts(), ensure_ascii=False).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            page = PAGES.get(path)
            if page:
                body = page.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            super().do_GET()

        def do_POST(self):
            # **النتيجةُ من `/result` وحدَه** (الجلسة ١): كان أيُّ POST يُقرأ نتيجةً،
            # فأمسك ذلك حارسُ خصوصية القلم يومَ جُرِّب سالباً — زُرع في `pen.js` رفعٌ
            # لمسار الطفل، فحلّت حمولتُه محلَّ نتائج الفحص وانهار العدّاء بدل أن
            # يحمرّ. والرفعُ المزروع الآن يُعدّ في العدّاد ويسقط الفحصُ كما ينبغي.
            raw = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            if self.path.partition("?")[0] != "/result":
                self.send_response(404)
                self.end_headers()
                return
            try:
                payload = json.loads(raw.decode("utf-8"))
                if isinstance(payload, list) and all(isinstance(r, dict) for r in payload):
                    results[:] = payload
            except json.JSONDecodeError:
                pass
            self.send_response(204)
            self.end_headers()

        def log_message(self, *a):
            pass

    socketserver.TCPServer.allow_reuse_address = True
    return socketserver.TCPServer(("127.0.0.1", port), Handler)


def run_chrome(url: str, profile: Path, extra: list, show: bool):
    if not Path(CHROME).exists():
        sys.exit(f"لم يُعثر على Chrome في {CHROME}")
    cmd = [CHROME, f"--user-data-dir={profile}", "--no-first-run", "--no-default-browser-check"]
    if not show:
        cmd += ["--headless=new", "--disable-gpu"]
    cmd += extra + [url]
    return subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


# الشاشات التي **يجب** أن تسع الوضع العرضي بلا سحب: خطوات الدرس والمهارة والبوابة —
# بطلاتُ «الصندوق الكبير» وشقيقاتُها. وما عداها (قصة، مراجعة، بستان) قوائمُ تطول بطبعها
# فالسحب فيها أصلٌ لا عطب.
LANDSCAPE_MUST_FIT = {
    "lesson-listen", "lesson-harakat", "lesson-trace", "lesson-quiz",
    "skill-rule", "skill-compare", "skill-quiz", "gate", "contrast-compare", "contrast-quiz",
    # شاشةُ الحكم في «كلمات السورة» (الحزمة ١٢): الآيةُ والخياراتُ في نظرةٍ واحدة —
    # طفلٌ يسحب ليرى بقيّة الآية يفقد سياقَ الكلمة التي يبحث عنها.
    "surah-find",
}


# الحروف الممثِّلة لأصناف الأجرام (بلاغ المهمة): ألفٌ طويلة، باءٌ منقوطة تحت، ميمٌ نازلة،
# عينٌ وسطى، غينٌ منقوطة فوق — عليها تُحكَّم المعايرة بالعين بعد أن يحكم عليها العدد.
SAMPLE_LETTERS = "ابمعغ"
# أقصى بقيّةٍ مقبولة بعد الرفعة (بكسل، عند ١٤٤ بكسل حجم خط الصندوق) — تدوير الوحدات لا أكثر.
LIFT_TOLERANCE = 1.0


# **`report_metrics` و`window_of` و`device_main` وصفحتُها (`browser_device.html`) لم
# تُنقَل**: عدّةُ الأجهزة تقيس الفائضَ الرأسيّ والأفقيّ **شاشةً شاشة**، وتعاير توسيطَ
# الحرف البطل — ولا شاشةَ في «اُكْتُبْ» بعدُ. وتملكها **الجلسة ١٢** («صقل الجهاز:
# آيباد ٦/٧ بالقلم والإصبع + `perf_check`»)، و`DEVICE_SIZES` أعلاه باقيةٌ لها:
# مقاساتُ الأجهزة لا تتبدّل بتبدّل المادة.


def main():
    ap = argparse.ArgumentParser(description="فحصُ قشرة «اُكْتُبْ» في متصفّح حقيقي")
    ap.add_argument("--port", type=int, default=8790)
    ap.add_argument("--timeout", type=int, default=140, help="ثوانٍ قبل الاستسلام")
    ap.add_argument("--shots", metavar="PNG", help="لقطة للمراجعة البصرية بدل تشغيل الاختبارات")
    ap.add_argument("--show", action="store_true", help="متصفّح مرئي")
    ap.add_argument("--suite", choices=sorted(SUITES), default="shell",
                    help="أيُّ صفحةِ فحصٍ تُشغَّل (القشرة · القلم)")
    args = ap.parse_args()

    results = []
    server = make_server(args.port, results)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    profile = Path(tempfile.mkdtemp(prefix="uktub-chrome-"))
    base = f"http://127.0.0.1:{args.port}"

    try:
        if args.shots:
            out = Path(args.shots).resolve()
            out.unlink(missing_ok=True)   # وإلا لعُدَّت لقطةُ تشغيلٍ سابق نجاحاً فوريّاً
            # اللقطةُ تتبع السَّوقة: لقطةُ القلم لوحُه لا خريطتُه
            where = "/?dev=1#/pen" if args.suite in ("pen", "paths") else "/?dev=1"
            proc = run_chrome(f"{base}{where}", profile,
                              [f"--screenshot={out}", "--window-size=980,1400", "--hide-scrollbars"],
                              args.show)
            deadline = time.time() + args.timeout
            while time.time() < deadline and not out.exists():
                time.sleep(0.5)
            proc.kill()
            print(f"اللقطة: {out}" if out.exists() else "تعذّرت اللقطة")
            return 0 if out.exists() else 1

        proc = run_chrome(f"{base}{SUITES[args.suite]}", profile, ["--hide-scrollbars"], args.show)
        deadline = time.time() + args.timeout
        while time.time() < deadline:
            time.sleep(0.5)
            if results and results[-1].get("msg", "").startswith(
                    ("لا أخطاء جافاسكربت", "أخطاءُ جافاسكربت", "استثناء", "انتهت المهلة")):
                break
        proc.kill()
    finally:
        server.shutdown()
        shutil.rmtree(profile, ignore_errors=True)

    if not results:
        print("لم تصل أي نتيجة من المتصفّح (تحقّق من تشغيل Chrome).")
        return 1

    failed = [r for r in results if not r["ok"]]
    for r in results:
        print(("  ✓ " if r["ok"] else "  ✗ ") + r["msg"])
    print(f"\n{len(results) - len(failed)}/{len(results)} تحقّقاً ناجحاً"
          + (f" — {len(failed)} إخفاق" if failed else ""))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
