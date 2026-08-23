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
في الجلسة ٤ (`--suite warmup`)، وعدّةُ الأجهزة (`--device`) في الجلسة ١٢.

**والافتراضُ فحصُ القشرة**: `browser_test.html` — يفتح بلا خطأ جافاسكربت واحد،
وتُرسَم الخريطةُ وعلامتُها، وأهدافُ اللمس ≥ ٦٤ بكسل (`DESIGN §٤`).

ملاحظة: --dump-dom و--virtual-time-budget غير موثوقين مع fetch والصوت،
لذلك تُرسَل النتائج من الصفحة نفسها ثم يُقتل المتصفّح.
"""

import argparse
import http.server
import json
import os
import re
import shutil
import signal
import socketserver
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ports  # noqa: E402  (جدولُ المنافذ — تُقرأ من موضعٍ واحد، `tools/ports.py`)

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app"
TOOLS = Path(__file__).resolve().parent
PAGES = {
    "/__test.html": TOOLS / "browser_test.html",
    "/__pen.html": TOOLS / "browser_pen.html",
    "/__paths.html": TOOLS / "browser_paths.html",
    "/__warmup.html": TOOLS / "browser_warmup.html",
    "/__field.html": TOOLS / "browser_field.html",
    "/__lesson.html": TOOLS / "browser_lesson.html",
    "/__gate.html": TOOLS / "browser_gate.html",
    "/__forms.html": TOOLS / "browser_forms.html",
    "/__copy.html": TOOLS / "browser_copy.html",
    "/__journey.html": TOOLS / "browser_journey.html",
    "/__parent.html": TOOLS / "browser_parent.html",
    "/__catchup.html": TOOLS / "browser_catchup.html",
    "/__support.html": TOOLS / "browser_support.html",
    "/__welcome.html": TOOLS / "browser_welcome.html",
    "/__device.html": TOOLS / "browser_device.html",
    "/__arena.html": TOOLS / "browser_arena.html",
    "/__arena_shots.html": TOOLS / "arena_shots.html",
}
# سَوقةُ الصفحات: `--suite <اسم>` يختار أيَّها يُشغَّل، والافتراضُ فحصُ القشرة.
SUITES = {
    "shell": "/__test.html",       # الجلسة ٠: التطبيق يفتح بلا خطأ جافاسكربت واحد
    "pen": "/__pen.html",          # الجلسة ١: خصوصيةُ القلم — صفرُ طلباتٍ في دورة كتابة
    "paths": "/__paths.html",      # الجلسة ٢: كلُّ حرفٍ يُعرض من مساره ويُحكم عليه
    "warmup": "/__warmup.html",    # الجلسة ٤: إصبعٌ يعبر محطات التهيئة الستّ بقفلها
    "field": "/__field.html",      # الجلسة م١: جوابُ الجبهة + قياسُ زرّ العودة (بلاغُ الميدان ١)
    "lesson": "/__lesson.html",    # الجلسة ٥: درسُ حرفٍ كامل بحلقته الأربع وقياسِه وصوتِه
    "gate": "/__gate.html",        # الجلسة ٦: بوابةُ الحرف المعزول — الأضعفُ وإعادةٌ بلا حدّ
    "forms": "/__forms.html",      # الجلسة ٧: أشكالُ المواقع بمفاتيحها + تمييزُ المتشابهات
    "copy": "/__copy.html",        # الجلسة ٨: الوصلُ والنسخُ وبطاقاتُ ق٣ وبوابةُ النسخ
    "journey": "/__journey.html",  # الجلسة ٩: الرحلةُ كاملةً — من أوّل تهيئةٍ إلى بوابة الختام
    "parent": "/__parent.html",    # الجلسة ١٠: لوحةُ وليّ الأمر — بوابتُها وخرائطُ اتجاهه ونسختُه
    "catchup": "/__catchup.html",  # الجلسة ل: بوابةُ اللحاق — بابُها من اللوحة، وفتحُها بما أثبتته اليد
    "support": "/__support.html",  # الجلسة د: وضعُ الدعم — المؤشّرُ على الشاشة بلا زحزحةِ بكسل
    "welcome": "/__welcome.html",  # الجلسة ١١: الصفحاتُ الأربع على مقاسات الجهاز الخمسة
    "arena": "/__arena.html",      # الجلسة ص٣: ساحةُ الحصاد — الدورةُ الأربع وتسميتُها العمياء
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
# **بصمةُ صفحاتنا في تقرير النتيجة** (بلاغ العائلة من احسب، `calc@16c37dc`): تُرسِلها كلُّ
# صفحةِ فحصٍ في حمولتها، ويُهمِل `do_POST` ما لا يحملها. عِلّتُها في §تصادم المنفذ أدناه.
REPORT_FROM = "write"


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


def warmup_parts() -> list:
    """محطاتُ التهيئة كما تعلنها وحدتُها المولَّدة — لقطتُها تُفتح على أوّلها،
    ولا تُكتب هنا قائمةٌ ثانية تشيخ (`app/js/warmups.js` يكتبها مولّدُ المسارات)."""
    module = APP / "js" / "warmups.js"
    if not module.exists():
        return []
    return re.findall(r'^  "([^"]+)": \{', module.read_text(encoding="utf-8"), re.M)


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
            #
            # **ولا تُقرَأ نتيجةٌ إلا من صفحتنا** (`REPORT_FROM` — بلاغُ العائلة من احسب،
            # `calc@16c37dc`): «اُكْتُبْ» و«اِقْرَأْ» و«اِحْسِبْ» في مساحة عملٍ واحدة
            # وعدَدُها من بذرةٍ واحدة، فإن سبق جارٌ إلى منفذنا أرسل متصفّحُه تقريرَه
            # **إلى خادمنا** فقرأناه تقريرَنا — أخضرَ كاذباً أو أحمرَ بلا سبب. فالبصمةُ
            # تُغلق البابَ بنيوياً: غريبٌ يُهمَل، وتنتهي المهلةُ بجملة «لم تصل أي نتيجة»
            # الصادقة — وهي أهونُ ما يقع.
            raw = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            if self.path.partition("?")[0] != "/result":
                self.send_response(404)
                self.end_headers()
                return
            try:
                payload = json.loads(raw.decode("utf-8"))
                if isinstance(payload, dict) and payload.get("from") == REPORT_FROM:
                    rows = payload.get("rows")
                    if isinstance(rows, list) and all(isinstance(r, dict) for r in rows):
                        results[:] = rows
            except json.JSONDecodeError:
                pass
            self.send_response(204)
            self.end_headers()

        def log_message(self, *a):
            pass

        # **وقتلُ المتصفّح ليس عطباً في الخادم**: نحن نقتله عند تمام الفحص، فيبقى
        # طلبٌ نصفَ مخدوم فيرتمي `BrokenPipe` أثراً مكدَّساً في المُخرَج — **وأثرٌ
        # مكدَّس في فحصٍ أخضر يُقرأ عطباً**. فتُبتلَع هذه وحدَها ويبقى غيرُها يُقال.
        def handle_one_request(self):
            try:
                super().handle_one_request()
            except (BrokenPipeError, ConnectionResetError):
                self.close_connection = True

    socketserver.TCPServer.allow_reuse_address = True
    try:
        return socketserver.TCPServer(("127.0.0.1", port), Handler)
    except OSError as e:
        # **والمنفذُ المشغول يُقال ولا يُصمَت عنه** (`calc@16c37dc`): كان الخادمُ يرتمي
        # أثراً مكدَّساً عارياً، فيُقرأ عطباً في الشيفرة وهو منفذٌ يشغله جارٌ لحظةً —
        # وأغلى ما يضيع وقتُ من يطارد عطباً لا وجودَ له. فالرسالةُ تسمّي المنفذَ
        # وتدلّ على المخرج.
        sys.exit(f"تعذّر فتحُ خادم الفحص على المنفذ {port}: {e}\n"
                 f"  — منفذٌ مشغولٌ الآن (فحصٌ آخر يعمل؟). جرّب: --port {port + 1}")


# **سابقةُ ملفّ إعدادات كروم عندنا** — بها تُعرَف نسخُنا من نسخ الجيران ومن متصفّح
# المالك الحيّ. واجبُنا من بلاغ العائلة `stale-headless-chrome`: يتيمُ فحصٍ ميتٌ يخطف
# نقرةَ أيقونة كروم عند المالك فيبدو المتصفّحُ معطّلاً.
CHROME_PREFIX = "write-browser-"


def new_profile() -> Path:
    """ملفُّ إعداداتٍ مؤقّت بسابقتنا — فما نطلقه يُعرَف باسمه ويُكنَس وحدَه."""
    return Path(tempfile.mkdtemp(prefix=CHROME_PREFIX))


def our_chromes() -> list:
    """**جردٌ مقصور**: نسخُ كروم التي أطلقناها نحن وحدَها — [(معرّف، ملفُّ الإعدادات)].

    ولا يُقرَّب سواها: يُقرأ **قيمةُ `--user-data-dir` نفسِها** ويُشترَط أن يكون
    اسمُ مجلّدها ببادئتنا — لا «تحوي السلسلة» في سطر الأمر، فعنوانُ صفحةٍ أو راية
    أخرى قد تحملها. ونسخُ الجيران ومتصفّحُ المالك خارج المرمى **بالبناء**.
    """
    proc = subprocess.run(["ps", "-axo", "pid=,command="],
                          capture_output=True, text=True, check=False)
    found = []
    for line in proc.stdout.splitlines():
        pid, _, cmd = line.strip().partition(" ")
        if not pid.isdigit() or "--user-data-dir=" not in cmd:
            continue
        value = cmd.split("--user-data-dir=", 1)[1].split(" ")[0]
        if Path(value).name.startswith(CHROME_PREFIX):
            found.append((int(pid), value))
    return found


def sweep_orphans(loud: bool = False) -> int:
    """كنسُ يتامانا العالقين **عند الإقلاع** — بالمعرّف بعد الجرد، لا بنمطٍ يلتقط الجيران.

    **وقيدُ صنعةٍ من حادثةٍ وقعت** (مراجعة م٣، ١٣ أغسطس ٢٠٢٦): `pkill` بنمطٍ عامّ
    أسقط قوقعتَي انتظارٍ لجلسةٍ جارة. فالقتلُ هنا `os.kill` على **معرّفٍ خرج من
    الجرد أعلاه** — نعرف كم قتلنا ونقوله، ولا نضرب في العمياء.

    والتنظيفُ عند الإقلاع لا عند الخروج وحده: الجلسةُ تُقتَل والفحصُ يُقاطَع
    فيبقى اليتيم.

    ⚠ **وحدُّه المعلَن**: لا يفرّق بين يتيمٍ ميت وأداةٍ لنا تعمل الآن — فأدواتُنا
    تُشغَّل بالتتابع لا معاً (وهو عهدُ التسلسل داخل المستودع نفسُه). ولو فُرِّق
    بالعمر لَنجا يتيمُ الدقيقة الماضية وهو أكثرُها وقوعاً.
    """
    killed = 0
    for pid, where in our_chromes():
        try:
            os.kill(pid, signal.SIGTERM)
            killed += 1
            if loud:
                print(f"  · كُنس يتيمُ فحصٍ عالق: {pid} ({Path(where).name})")
        except (ProcessLookupError, PermissionError):
            pass
    return killed


def run_chrome(url: str, profile: Path, extra: list, show: bool):
    if not Path(CHROME).exists():
        sys.exit(f"لم يُعثر على Chrome في {CHROME}")
    # **والصوتُ يُشغَّل بلا لمسةِ إذن** (الجلسة ٥): سياسةُ التشغيل التلقائي تمنع
    # `play()` بلا إيماءة مستعمل، فيرفض الوعدُ **قبل أن يُطلَب الملفّ أصلاً** — فيُقاس
    # صفرُ طلباتٍ صوتية ويُقرأ «لم يُسمَع من البنك» وهو سليم. والإيماءةُ في يد الطفل
    # لا في يد الفاحص، فتُرفَع هنا ليُقاس **طريقُ الطفل الحقيقيّ**: مفتاحٌ في الفهرس
    # فملفٌّ يُطلَب من الخادم (يعدّه `/__audio_hits.json`).
    cmd = [CHROME, f"--user-data-dir={profile}", "--no-first-run", "--no-default-browser-check",
           "--autoplay-policy=no-user-gesture-required"]
    if not show:
        cmd += ["--headless=new", "--disable-gpu"]
    cmd += extra + [url]
    # **وخطأُ كروم لا يُبتلع عند التشخيص**: `UKTUB_CHROME_LOG=ملف` يفتح بابَه
    # (عثرةُ «لم تصل أي نتيجة» المتكررة، ٢٤ أغسطس ٢٠٢٦ — أداةٌ صامتةٌ عيبُ
    # أداةٍ يُصلَح). والافتراضُ الصامت بحاله.
    log = os.environ.get("UKTUB_CHROME_LOG")
    err = open(log, "ab") if log else subprocess.DEVNULL
    return subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=err)


# ————— مهلةُ السَّوقة: تُشتقّ من طول عملها لا رقمٌ واحدٌ للجميع —————
#
# **العلّة** (قيدُ مراجعة الجلسة ١٠، وبند الجلسة ١٢): كان الافتراضُ ١٤٠ ثانيةً
# **لسَوقةٍ تمشي شاشةً واحدة ولسَوقةٍ تمشي الرحلةَ كلَّها** — فرحلةُ ٣٤٨ عقدةً تنقطع
# عند المهلة وتُطبَع «لم تصل أي نتيجة»، **فتُقرأ الحمرةُ عطباً وهي قِصَرُ مهلة**،
# ويُطارَد عطبٌ لا وجودَ له. وهي قاعدةُ «مهلةٌ تُشتقّ من طول العمل» بعينها — أختُ
# مهلة ولاية عامل الخدمة التي صارت تُشتقّ من عدد بنك الصوت (الجلسة ب).
#
# **والأرضيةُ لا تنزل**: ١٤٠ ثانيةً هي مهلةُ اليوم المجرَّبة على السَّوقات الصغيرة،
# فتبقى **أرضيةً** ويُزاد فوقها بقدر ما تمشي السَّوقةُ من مادّة الشجرة — فلا سَوقةٌ
# تأخذ اليومَ أقلَّ ممّا كانت تأخذ، والطويلةُ وحدَها تتّسع.
FLOOR_TIMEOUT = 140
# لكلِّ سَوقةٍ تمشي مادّةً: (اسمُ ما تمشيه، ثوانٍ لكلّ واحدة) — **والعددُ يُقاس من
# الشجرة لحظةَ التشغيل** (`tree_work` أدناه) لا يُكتب هنا، فمنهجٌ يكبر غداً يوسّع
# مهلتَه من نفسه بلا سطرٍ يُعدَّل.
SUITE_WORK = {
    "journey": ("nodes", 8.0),        # الرحلةُ عقدةً عقدة: كتابةٌ ونقرٌ وانتقال
    "paths": ("forms", 2.0),          # كلُّ شكلِ حرفٍ يُعرَض ويُحكَم عليه
    "warmup": ("warmupShapes", 4.0),  # إصبعٌ يعبر أشكالَ محطات التهيئة
    "welcome": ("frames", 4.0),       # صفحةُ مرجعٍ في إطارٍ بمقاس جهاز
    "device": ("screens", 8.0),       # شاشةُ رحلةٍ تُبنى وتُقاس على مقاسٍ
}


def tree_work() -> dict:
    """ما تمشيه السَّوقاتُ من مادّة الشجرة — **مقيسٌ من البيانات لا مكتوب**.

    المنهجُ يُقرأ بـ`node` من وحداته نفسِها (كما يقرؤه `test_welcome.mjs`)،
    وصفحاتُ المرجع تُجرَد من القرص. وإن تعذّر `node` رجعت المهلةُ إلى أرضيتها
    **وقيل ذلك** — لا مهلةٌ تنكمش صامتةً.
    """
    script = (
        "globalThis.localStorage={getItem:()=>null,setItem(){},removeItem(){}};"
        "const p=await import('./app/js/progress.js');"
        "const {PATHS}=await import('./app/js/paths.js');"
        "const {WARMUPS}=await import('./app/js/warmups.js');"
        "const forms=Object.values(PATHS).reduce((n,f)=>n+Object.keys(f).length,0);"
        "const warmupShapes=Object.values(WARMUPS).reduce((n,w)=>n+w.shapes.length,0);"
        "const types=new Set(p.allNodes().map((n)=>n.type)).size;"
        "console.log(JSON.stringify({nodes:p.allNodes().length,forms,warmupShapes,types}));"
    )
    work = {}
    try:
        out = subprocess.run(["node", "--input-type=module", "-e", script],
                             cwd=ROOT, capture_output=True, text=True, check=True, timeout=60)
        work = json.loads(out.stdout.strip().splitlines()[-1])
    except (OSError, ValueError, subprocess.SubprocessError):
        return {}
    # صفحاتُ المرجع من القرص (`perf-check` عدّةُ قياسٍ لا صفحةَ عرض فلا تُقاس)
    pages = [p for p in sorted((APP / "welcome").glob("*.html")) if p.name != "perf-check.html"]
    work["frames"] = len(pages) * len(DEVICE_SIZES)
    # شاشاتُ عدّة الأجهزة: صفحةُ الجهاز تبني ممثِّلاً لكلّ نوع عقدة وثلاثَ شاشاتٍ
    # عامّة (الخريطة والمراجعة ولوحة وليّ الأمر) — وتُقاس على المقاسات كلِّها.
    work["screens"] = (work.get("types", 0) + 3) * len(DEVICE_SIZES)
    return work


def suite_timeout(suite: str, work: dict) -> tuple:
    """(المهلةُ بالثواني، سطرُ قياسها) — والسطرُ يُطبع فلا تُقرأ مهلةٌ مجهولةُ الأصل."""
    if suite not in SUITE_WORK:
        return FLOOR_TIMEOUT, f"مهلةُ «{suite}»: {FLOOR_TIMEOUT}ث (الأرضية — سَوقةُ شاشةٍ لا تمشي مادّة)"
    unit, rate = SUITE_WORK[suite]
    count = work.get(unit)
    if not count:
        return FLOOR_TIMEOUT, (f"مهلةُ «{suite}»: {FLOOR_TIMEOUT}ث (الأرضية — **تعذّر قياسُ**"
                               f" «{unit}» من الشجرة، فلا تُشتقّ)")
    total = int(FLOOR_TIMEOUT + rate * count)
    return total, (f"مهلةُ «{suite}»: {total}ث = {FLOOR_TIMEOUT} أرضيةً"
                   f" + {rate:g}ث × {count} {unit} (مقيسةً من الشجرة)")


# ————— عدّةُ الأجهزة: الشاشاتُ على مقاسات الميدان الخمسة —————
#
# **وهذا النصفُ غير المنقول من بذرة اقرأ** (`SEED.md`: «`device_main` مُعلَّقةٌ للجلسة
# ١٢»): يومَ نُسخت الحظيرةُ لم تكن في «اُكْتُبْ» شاشةٌ واحدة تُقاس. وقد صارت الرحلةُ
# ٥٥ محطةً، فبُنيت هنا بحدّها.
#
# **ولا قائمةَ شاشاتٍ تُكتب**: `browser_device.html` يبني ممثِّلاً **لكلّ نوع عقدة في
# الرحلة** كما يقرؤها `progress.js` — فنوعٌ يُبنى غداً يدخل القياسَ يومَ يُبنى.
#
# **والقاعدةُ المقيسة** (`DESIGN §٤`): لا فائضَ أفقيَّ في أيّ شاشةٍ على أيّ مقاس — صفحةٌ
# تُسحَب يميناً وشمالاً مكسورةٌ بحكمها. **وشاشةُ اللوح تسع الوضع العرضيّ بلا سحبٍ
# رأسيّ** كذلك: طفلٌ يكتب ثم يسحب ليرى بقيّةَ لوحه ينقطع عن حركته — وأمّا الخريطةُ
# والمراجعةُ ولوحةُ وليّ الأمر فقوائمُ تطول بطبعها، فالسحبُ فيها أصلٌ لا عطب.
# **والفصلُ بينهما بنيويّ**: الصفحةُ تقول أفي الشاشة لوحُ كتابةٍ أم لا (`board`)،
# فلا قائمةُ أسماءِ شاشاتٍ تشيخ (وقائمةُ اقرأ المنسوخة كانت تحمل أسماءَ شاشاته هو).


def window_of(size: str) -> str:
    """مقاسُ نافذةٍ يعطي منظوراً بمقاس الجهاز المطلوب تماماً (مع الإطار الوهميّ)."""
    w, h = (int(x) for x in size.split(","))
    return f"{w},{h + VIEWPORT_PAD}"


def device_main(args) -> int:
    results = []
    server = make_server(args.port, results)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    profile = new_profile()
    base = f"http://127.0.0.1:{args.port}"
    sizes = [("مقاس مطلوب", args.size)] if args.size else DEVICE_SIZES
    runs = []

    try:
        if args.shots:
            out = Path(args.shots).resolve()
            out.unlink(missing_ok=True)
            url = f"{base}/__device.html" + (f"?screen={args.screen}" if args.screen else "")
            proc = run_chrome(url, profile,
                              [f"--screenshot={out}",
                               f"--window-size={window_of(args.size or '768,1024')}",
                               "--hide-scrollbars"], args.show)
            deadline = time.time() + args.timeout
            while time.time() < deadline and not out.exists():
                time.sleep(0.4)
            proc.kill()
            print(f"اللقطة: {out}" if out.exists() else "تعذّرت اللقطة")
            return 0 if out.exists() else 1

        # **ولكلِّ مقاسٍ ملفُّ إعداداتٍ جديد**: كروم لا يُطلِق قفلَ ملفّه لحظةَ قتله،
        # فإعادةُ إطلاقه على الملفّ نفسِه تسقط صامتةً — وقد سقط بها **المقاسُ
        # الخامس وحدَه** أوّلَ تشغيلٍ لهذه العدّة، فقُرئ «لم تصل نتيجة» وهو قفلُ ملف.
        for label, size in sizes:
            results.clear()
            spot = new_profile()
            proc = run_chrome(f"{base}/__device.html", spot,
                              [f"--window-size={window_of(size)}", "--hide-scrollbars"], args.show)
            deadline = time.time() + args.timeout
            while time.time() < deadline and not results:
                time.sleep(0.4)
            proc.kill()
            shutil.rmtree(spot, ignore_errors=True)
            if not results:
                print(f"لم تصل نتيجةٌ من المقاس {label} ({size}) خلال {args.timeout}ث")
                return 1
            runs.append((label, size, list(results)))
    finally:
        server.shutdown()
        shutil.rmtree(profile, ignore_errors=True)

    bad = []
    for label, size, rows in runs:
        vw, vh = (int(x) for x in size.split(","))
        wide = vw > vh
        print(f"\n— {label} ({vw}×{vh}) {'عرضي' if wide else 'طولي'} —")
        if (rows[0]["vw"], rows[0]["vh"]) != (vw, vh):
            got = f"{rows[0]['vw']}×{rows[0]['vh']}"
            print(f"  ✗ المنظورُ الفعليّ {got} لا يطابق المطلوب — عايِر VIEWPORT_PAD")
            bad.append((label, "المنظور", f"جاء {got}"))
        for r in rows:
            if r.get("error"):
                print(f"  ✗ {r['label']}: عطب — {r['error']}")
                bad.append((label, r["id"], r["error"]))
                continue
            over, over_x = r["over"], r["overX"]
            must = wide and r.get("board")
            fail = over_x > 0 or (must and over > 0)
            if fail:
                bad.append((label, r["id"],
                            f"فائض أفقي {over_x}px" if over_x else f"فائض رأسي {over}px"))
            mark = "✗" if fail else ("·" if over else "✓")
            kind = "لوحُ كتابة" if r.get("board") else "قائمةٌ تُسحَب"
            note = (f"{kind} · الطولُ {r['h']}px"
                    + (f" — فائضٌ رأسيّ {over}px" if over else " — يسع الشاشة")
                    + (f" — **فائضٌ أفقيّ {over_x}px**" if over_x else ""))
            print(f"  {mark} {r['label']} [{r['states']} حال · {r.get('kind', '؟')}]: {note}"
                  + (f" · شكوى المحرّك: {r['faults']}" if r.get("faults") else ""))

    if bad:
        print(f"\n{len(bad)} إخفاق:")
        for label, sid, why in bad:
            print(f"  ✗ {label} · {sid}: {why}")
        return 1
    print("\nولا فائضَ أفقيٌّ في شاشةٍ على مقاسٍ من الخمسة، وكلُّ لوحِ كتابةٍ يسع الوضعَ"
          "\nالعرضيّ بلا سحب — والقوائمُ تُسحَب رأسياً بطبعها ولا تُحاسَب عليه.")
    return 0


def main():
    ap = argparse.ArgumentParser(description="فحصُ قشرة «اُكْتُبْ» في متصفّح حقيقي")
    # **ومنفذُنا غيرُ منفذ الجيران** (بلاغُ العائلة من احسب، `calc@16c37dc` — وقد لُدغنا
    # به مرتين في مراجعات المدير): ثلاثةُ تطبيقاتٍ في مساحة عملٍ واحدة وعدَدُها من بذرةٍ
    # واحدة — اقرأ ٨٧٩٠ واحسب ٨٧٩١ **واكتب ٨٧٩٢** — فمنفذٌ مشترك يجعل تشغيلَ أحدها
    # يُفشِل الآخر بلا ذنب، أو يجعله يقرأ تقريرَ جارٍ تقريرَه.
    ap.add_argument("--port", type=int, default=ports.port_of("browser_test"))
    ap.add_argument("--timeout", type=int, default=0,
                    help="ثوانٍ قبل الاستسلام (والافتراضُ مُشتقٌّ من طول السَّوقة)")
    ap.add_argument("--shots", metavar="PNG", help="لقطة للمراجعة البصرية بدل تشغيل الاختبارات")
    ap.add_argument("--show", action="store_true", help="متصفّح مرئي")
    ap.add_argument("--suite", choices=sorted(SUITES), default="shell",
                    help="أيُّ صفحةِ فحصٍ تُشغَّل (القشرة · القلم · المسارات · التهيئة · الميدان)")
    ap.add_argument("--device", action="store_true",
                    help="عدّةُ الأجهزة: شاشاتُ الرحلة على مقاسات الميدان الخمسة")
    ap.add_argument("--size", help="مقاسُ منظورٍ واحد W,H بدل الخمسة (مع --device)")
    ap.add_argument("--screen", help="اسمُ شاشةٍ واحدة في صفحة الجهاز (مع --device --shots)")
    args = ap.parse_args()

    # **نظافةُ كروم عند الإقلاع** — كنسُ يتامانا وحدَهم قبل إطلاق جولةٍ جديدة
    swept = sweep_orphans(loud=True)
    if swept:
        print(f"  · كُنس {swept} يتيماً من جولاتنا السابقة قبل الإقلاع")

    if not args.timeout:
        args.timeout, why = suite_timeout("device" if args.device else args.suite, tree_work())
        print("  · " + why)

    if args.device:
        return device_main(args)

    results = []
    server = make_server(args.port, results)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    profile = new_profile()
    base = f"http://127.0.0.1:{args.port}"

    try:
        if args.shots:
            out = Path(args.shots).resolve()
            out.unlink(missing_ok=True)   # وإلا لعُدَّت لقطةُ تشغيلٍ سابق نجاحاً فوريّاً
            # اللقطةُ تتبع السَّوقة: لقطةُ القلم لوحُه لا خريطتُه
            where = ("/#/warmup/" + (warmup_parts() or ["lines-h"])[0] if args.suite == "warmup"
                     else "/?dev=1#/pen" if args.suite in ("pen", "paths")
                     # **وساحةُ الحصاد صفحةٌ مستقلّة**: لقطتُها من بابها هي لا من
                     # التطبيق، وتُساق إلى خطوتها بـ`--screen` (شاشةُ لقطاتها تسوقها)
                     else f"/__arena_shots.html?at={args.screen or 'intro'}"
                     f"&w={(args.size or '768,1024').split(',')[0]}"
                     f"&h={(args.size or '768,1024').split(',')[1]}"
                     if args.suite == "arena" else "/?dev=1")
            size = args.size or "980,1400"
            # **ونافذةُ كروم تحجز ٨٧ بكسلاً لإطارٍ وهميّ**: فلو طُلب مقاسُ آيباد كما
            # هو لَخرجت اللقطةُ أقصرَ من الجهاز — يُعوَّض كما يُعوَّض في عدّة الأجهزة.
            if args.suite == "arena" and args.size:
                w, h = args.size.split(",")
                size = f"{w},{int(h) + VIEWPORT_PAD}"
            extra = [f"--screenshot={out}", f"--window-size={size}", "--hide-scrollbars"]
            # **والوقتُ الافتراضيّ للساحة**: لقطتُها بعد سَوقٍ يمشي بمهلٍ حقيقية،
            # فيُمنَح كرومُ ميزانيةَ وقتٍ افتراضيّ تكفي الدورةَ (لا صوتَ فيها ولا جلب).
            if args.suite == "arena":
                extra.append("--virtual-time-budget=90000")
            proc = run_chrome(f"{base}{where}", profile, extra, args.show)
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
