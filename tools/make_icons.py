#!/usr/bin/env python3
"""توليد أيقونات التطبيق (PWA) بالتقاطها من tools/icon.html في Chrome — بلا أي تبعية.

    python3 tools/make_icons.py            # يولّد app/icons/*.png
    python3 tools/make_icons.py --check    # يتحقّق من وجودها وسلامتها بلا توليد

لماذا Chrome: المشروع بلا npm ولا مكتبات صور، وChrome موجود أصلاً لاختبارات الواجهة
(tools/browser_test.py) ويرسم العربية رسماً صحيحاً بحركاتها. الأيقونة مصدرها
`tools/icon.html` وحدها — فلا يُحرَّر ملف PNG يدوياً ولا يُفقَد أصله.
والخطّ خطُّ العلامة في `app/fonts/` لا خطُّ النظام (جلسة «الاسم والشعار»): أيقونةُ
التطبيق وترويستُه علامةٌ واحدة، فلا يفترق رسمُها بين جهازٍ التُقطت عليه وآخر.

ملاحظة: هذه أصول رسومية لا صوت — قيد «لا تلمس app/audio/» لا يمسّها.
"""

import argparse
import http.server
import re
import shutil
import socketserver
import struct
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
ICONS = ROOT / "app" / "icons"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# كل لقطة تُؤخذ بمقاس ٥١٢ (أصغر من ذلك تُهمله نافذة Chrome فتخرج بيضاء)،
# ثم تُصغَّر بـsips المرافق لـmacOS. (اسم الملف، المقاس، الهامش الآمن، حواف مستديرة، خلفية)
MASTER = 512
# و«الخلفية» أرضُ الصفحة تحت العلبة: العلبةُ تملأ المربّع فلا تُرى، **ولا يبقى مع ذلك
# لونُ أخينا مكتوباً في عدّتنا** (كان `#f5a524` — برتقاليُّ اقرأ) — يُقرأ `--brand-2`
# من اللوح، فلو انكشفت الأرضُ يوماً بتبدّل هندسةٍ انكشفت بلوننا لا بلونه.
TARGETS = [
    ("icon-512.png", 512, 0.0, True, None),
    ("icon-192.png", 192, 0.0, True, None),
    ("maskable-512.png", 512, 0.20, False, "--brand-2"),
    ("apple-touch-icon.png", 180, 0.0, False, "--brand-2"),
]


def board_color(name: str) -> str:
    css = (ROOT / "app" / "css" / "app.css").read_text(encoding="utf-8")
    found = re.search(rf"^\s*{name}:\s*(#[0-9A-Fa-f]{{3,8}})\s*;", css, re.M)
    return found.group(1) if found else "#000000"


def png_size(path: Path):
    """(العرض، الارتفاع) من ترويسة PNG — تحقّق بلا مكتبات."""
    data = path.read_bytes()[:24]
    if len(data) < 24 or data[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    return struct.unpack(">II", data[16:24])


def brand_font() -> tuple:
    """خطُّ العلامة **من اللوح**: عائلتُه من `--font-brand`، وملفُّه من إعلان وجهه.

    فلا يُكتب اسمُ خطٍّ في هذه العدّة ولا في `icon.html` — ويومَ يُبدَّل خطُّ العلامة
    تتبعه الأيقونةُ من نفسها. (وقد كان مكتوباً بيدٍ في ثلاثة مواضع حتى الجلسة هـ٢.)
    """
    css = (ROOT / "app" / "css" / "app.css").read_text(encoding="utf-8")
    found = re.search(r"--font-brand:\s*([^;]+);", css)
    family = found.group(1).split(",")[0].strip().strip("'\"") if found else None
    if not family:
        return None, None
    faces = re.findall(r"@font-face\s*\{([^}]*)\}", css, re.S)
    mine = [f for f in faces if re.search(rf"font-family:\s*['\"]{re.escape(family)}['\"]", f)]
    heavy = [f for f in mine if re.search(r"font-weight:[^;]*700", f)] or mine
    url = re.search(r"url\('([^']+)'\)", heavy[0]) if heavy else None
    return family, (url.group(1).replace("../fonts/", "/app/fonts/") if url else None)


def ink_span(path: Path):
    """أوسعُ بُعدٍ يشغله **حبرُ الكلمة** في أيقونةٍ منشورة، نسبةً من ضلعها.

    وحبرُ العلامة في أيقونات العائلة الثلاث أبيضُ على تدرّج ملوّن، فيُقرأ بالبياض.
    """
    from identity_doors import png_pixels          # فكُّ PNG مكتوبٌ مرّةً واحدة
    width, height, data, channels = png_pixels(path)
    left, top, right, bottom = width, height, -1, -1
    for y in range(height):
        for x in range(width):
            at = (y * width + x) * channels
            if min(data[at], data[at + 1], data[at + 2]) > 200:
                left, top = min(left, x), min(top, y)
                right, bottom = max(right, x), max(bottom, y)
    if right < 0:
        return None
    return max(right - left + 1, bottom - top + 1) / width


def family_fill():
    """**نسبةُ الملء من أخوينا لا من ذوق**: ما يشغله حبرُ علامتيهما من علبتيهما.

    فالسؤال الذي يُجيب عنه هذا الرقم: كم يكبر حبرُ الكلمة في مربّع الأيقونة؟ ورقمٌ
    واحد مضبوطٌ لخطٍّ بعينه (٠٫٣٧ لـMarhey) يَقُصُّ علامةَ خطٍّ أعرضَ ويُقزّم علامةَ
    خطٍّ أضيق. فتُقرأ **أيقونتا اقرأ واحسب المنشورتان** ويُؤخذ وسطُهما — فتبقى
    أيقونتُنا في العائلة حضوراً وإن تبدّل رسمُها. وإن غاب المستودعان بقي الحكمُ القديم.
    """
    seen = {}
    for app in ("read", "calc"):
        path = ROOT.parent / app / "app" / "icons" / "icon-192.png"
        if path.exists():
            got = ink_span(path)
            if got:
                seen[app] = got
    if not seen:
        return None, {}
    return sum(seen.values()) / len(seen), seen


def serve(port: int):
    # الجذرُ لا `tools/`: الأيقونةُ تحمّل خطَّ العلامة من `app/fonts/`،
    # وخادمُ بايثون لا يخرج بـ`..` عن مجلده (وهو صوابُه أمنياً).
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(ROOT), **kw)

        def log_message(self, *a):
            pass

    socketserver.TCPServer.allow_reuse_address = True
    return socketserver.TCPServer(("127.0.0.1", port), Handler)


def shoot(url: str, out: Path, size: int, profile: Path, timeout: int) -> bool:
    if out.exists():
        out.unlink()
    cmd = [CHROME, f"--user-data-dir={profile}", "--no-first-run", "--no-default-browser-check",
           "--headless=new", "--disable-gpu", "--hide-scrollbars",
           "--default-background-color=00000000",
           # الوقتُ الافتراضيّ: لا تُلتقط اللقطة حتى يصل خطُّ العلامة ويُعاد قياسُ
           # رفعة حبره — وإلا صُوِّرت الأيقونةُ بمقاييس خطٍّ احتياطيّ ليست مقاييسَه.
           "--virtual-time-budget=4000",
           f"--screenshot={out}", f"--window-size={size},{size}", url]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    deadline = time.time() + timeout
    while time.time() < deadline and not out.exists():
        time.sleep(0.3)
    time.sleep(0.4)          # مهلة كتابة الملف كاملاً
    proc.kill()
    return out.exists()


def check() -> int:
    missing = []
    for name, size, *_ in TARGETS:
        path = ICONS / name
        if not path.exists():
            missing.append(f"{name}: غير موجودة")
            continue
        dims = png_size(path)
        if dims != (size, size):
            missing.append(f"{name}: مقاسها {dims} والمطلوب ({size}, {size})")
    for line in missing:
        print("  ✗ " + line)
    if missing:
        print(f"\n{len(missing)} إخفاق — شغّل python3 tools/make_icons.py")
        return 1
    print(f"✓ أيقونات التطبيق كاملة ({len(TARGETS)} ملفاً بمقاساتها الصحيحة)")
    return 0


def main():
    ap = argparse.ArgumentParser(description="توليد أيقونات «اُكْتُبْ»")
    ap.add_argument("--port", type=int, default=8791)
    ap.add_argument("--timeout", type=int, default=40)
    ap.add_argument("--check", action="store_true", help="تحقّق فقط بلا توليد")
    args = ap.parse_args()

    if args.check:
        return check()

    if not Path(CHROME).exists():
        sys.exit(f"لم يُعثر على Chrome في {CHROME}")

    family, src = brand_font()
    if not family or not src:
        sys.exit("لم يُقرأ خطُّ العلامة من `--font-brand` في app.css")
    fill, seen = family_fill()
    print(f"— خطُّ العلامة من اللوح: {family} ⇐ {src}")
    if fill:
        print("— نسبةُ الملء من أخوينا: "
              + " · ".join(f"{k} {v:.3f}" for k, v in seen.items())
              + f" ⇒ {fill:.3f}")
    else:
        print("— أيقونتا الأخوين غيرُ متاحتين — يبقى الحكمُ القديم (٠٫٣٧ من الحيّز الآمن)")

    ICONS.mkdir(parents=True, exist_ok=True)
    server = serve(args.port)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    profile = Path(tempfile.mkdtemp(prefix="uktub-icons-"))
    made = 0
    try:
        for name, size, pad, round_, bg in TARGETS:
            out = ICONS / name
            url = (f"http://127.0.0.1:{args.port}/tools/icon.html"
                   f"?size={MASTER}&pad={pad}&round={'1' if round_ else '0'}"
                   f"&font={family.replace(' ', '%20')}&src={src}"
                   + (f"&fill={fill:.4f}" if fill else "")
                   + (f"&bg={board_color(bg).replace('#', '%23')}" if bg else ""))
            if not shoot(url, out, MASTER, profile, args.timeout):
                print(f"  ✗ {name} — تعذّرت اللقطة")
                continue
            if size != MASTER:
                subprocess.run(["sips", "-z", str(size), str(size), str(out), "--out", str(out)],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
            if png_size(out) != (size, size):
                print(f"  ✗ {name} — تعذّر التصغير إلى {size} (sips؟)")
                continue
            made += 1
            print(f"  ✓ {name} ({size}×{size})")
    finally:
        server.shutdown()
        shutil.rmtree(profile, ignore_errors=True)

    print(f"\n{made}/{len(TARGETS)} أيقونة في app/icons/")
    return 0 if made == len(TARGETS) else 1


if __name__ == "__main__":
    sys.exit(main())
