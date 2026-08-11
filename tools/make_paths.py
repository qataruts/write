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
FORMS = ["isolated", "initial", "medial", "final"]

sys.path.insert(0, str(TOOLS))
import browser_test  # noqa: E402  (حظيرةُ الخادم ومُشغِّلُ Chrome — تبعيةٌ معلَنة)


def sha() -> str:
    """بصمةُ ملفّ الإيماءات — تُكتب في `paths.js` فيُعرف أنه بُني منه بعينه."""
    return hashlib.sha1(ANCHORS.read_bytes()).hexdigest()[:12]


def anchors() -> dict:
    return json.loads(ANCHORS.read_text(encoding="utf-8"))


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


def drive(query: str, port: int, timeout: int, shots: Path = None, show: bool = False) -> list:
    """يفتح العدّةَ بوضعٍ من أوضاعها ويعيد ما أرسلته (أو يلتقط صورتها)."""
    results = []
    browser_test.PAGES["/__make_paths.html"] = TOOL_PAGE
    browser_test.PAGES["/__anchors.json"] = ANCHORS
    server = browser_test.make_server(port, results)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    profile = Path(tempfile.mkdtemp(prefix="uktub-paths-"))
    url = f"http://127.0.0.1:{port}/__make_paths.html{query}"
    extra = ["--hide-scrollbars"]
    if shots:
        shots.unlink(missing_ok=True)
        extra += [f"--screenshot={shots}", "--window-size=1600,1700"]
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
            lines.append('    "strokes": [')
            for si, stroke in enumerate(ref["strokes"]):
                start = stroke["start"]
                lines.append(f'     {{ "start": [{num(start[0])}, {num(start[1])}], "points": [')
                rows = chunk(stroke["points"])
                for ri, row in enumerate(rows):
                    lines.append(f'      {row}' + ("," if ri < len(rows) - 1 else ""))
                lines.append("     ] }" + ("," if si < len(ref["strokes"]) - 1 else ""))
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


def build(port: int, timeout: int) -> int:
    results = drive("?build=1", port, timeout)
    if not results:
        print("لم تصل حصيلةٌ من العدّة (تحقّق من تشغيل Chrome).")
        return 1
    good = report(results)
    payload = next((r for r in results if "paths" in r), None)
    if not good or not payload:
        return 1
    paths = payload["paths"]
    meta = {
        "tool": "tools/make_paths.html",
        "gesture": "tools/path_anchors.json",
        "sha": sha(),
        "grid": payload["meta"]["grid"],
        "font": "NotoNaskhArabic — نسخٌ مدرسيّ (ق٢)",
    }
    OUT.write_text(write_module(paths, meta), encoding="utf-8")
    forms = sum(len(v) for v in paths.values())
    print(f"\nكُتب {OUT.relative_to(ROOT)}: {len(paths)} حرفاً في {forms} شكلاً")
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

    # ٤) الأجزاءُ بعددها، والدعوى «عينُ شكلٍ آخر» صادقةٌ في الوحدة كذلك
    for ch, forms in letters.items():
        for form, entry in forms.items():
            ref = paths.get(ch, {}).get(form)
            if ref is None:
                continue
            if entry.get("sameAs"):
                twin = paths[ch].get(entry["sameAs"])
                ok(json.dumps(ref, sort_keys=True) == json.dumps(twin, sort_keys=True),
                   f"{ch}/{form}: مسارُه عينُ «{entry['sameAs']}» كما ادُّعي")
                continue
            ok(len(ref["strokes"]) == len(entry["strokes"]),
               f"{ch}/{form}: أجزاءُ المسار {len(ref['strokes'])} = أجزاءُ الإيماءة {len(entry['strokes'])}")

    print(f"\n{fails} فشل" if fails else "\nعهدُ الإيماءة والمسار قائم")
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser(description="سائقُ عدّة تأليف المسارات المرجعية")
    ap.add_argument("--open", action="store_true", help="العدّةُ لليد في متصفّحٍ مرئيّ")
    ap.add_argument("--nodes", action="store_true", help="جردُ عُقَد الخيال")
    ap.add_argument("--build", action="store_true", help="بناءُ app/js/paths.js")
    ap.add_argument("--sheet", metavar="PNG", help="لوحةُ مراجعةٍ بالعين")
    ap.add_argument("--bare", action="store_true", help="مع --sheet: بلا أرقام العُقَد")
    ap.add_argument("--out", metavar="JSON", help="مع --nodes: ملفُّ الجرد")
    ap.add_argument("--self-test", action="store_true", help="عهدُ الإيماءة والمسار بلا متصفّح")
    ap.add_argument("--port", type=int, default=8791)
    ap.add_argument("--timeout", type=int, default=180)
    args = ap.parse_args()

    if args.self_test:
        return self_test()
    if args.build:
        return build(args.port, args.timeout)
    if args.nodes:
        return nodes(args.port, args.timeout, Path(args.out) if args.out else None)
    if args.sheet:
        out = Path(args.sheet).resolve()
        query = "?sheet=1" + ("&tags=0" if args.bare else "")
        results = drive(query, args.port, args.timeout, shots=out)
        report(results)
        print(f"اللوحة: {out}" if out.exists() else "تعذّرت اللقطة")
        return 0 if out.exists() else 1
    if args.open:
        print("العدّةُ مفتوحةٌ في المتصفّح — أغلِقه لإنهاء الخادم.")
        drive("?open=1", args.port, 3600, show=True)
        return 0
    ap.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
