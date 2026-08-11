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
"""

import argparse
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PATHS_JS = ROOT / "app" / "js" / "paths.js"
PEN_JS = ROOT / "app" / "js" / "pen.js"
CURRICULUM = ROOT / "app" / "js" / "curriculum.js"

# ————— حدودٌ من العربية نفسِها، لا من الظنّ —————
# أكثرُ ما يُكتب به حرفٌ في النسخ المدرسي: جسمٌ ثم نقطُه. والكافُ والطاءُ أكثرُها
# أجزاءَ جسمٍ (جسمٌ وهمزةٌ/عارضة) — فثلاثةٌ سقفٌ واسع، وما جاوزه خطأُ تأليفٍ لا حرف.
MAX_STROKES = 3
# ولا حرفَ عربيّ فوق ثلاث نقاط (ث ش)، ولا نقطَ في أكثر من ثلاثة مواضع.
MAX_DOTS = 3


def load_tolerance() -> dict:
    """سماحةُ المحرّك ونسبةُ رأس المسار — **تُقرأ من `pen.js` ولا تُكتب هنا**."""
    src = PEN_JS.read_text(encoding="utf-8")
    block = re.search(r"export const TOLERANCE = \{(.*?)\};", src, re.S)
    if not block:
        sys.exit("لم يُقرأ TOLERANCE من app/js/pen.js")
    tol = {k: float(v) for k, v in re.findall(r"(\w+):\s*([0-9.]+)", block.group(1))}
    head = re.search(r"const HEAD_RATIO = ([0-9.]+)", src)
    grid = re.search(r"export const GRID = (\d+)", src)
    tol["head_ratio"] = float(head.group(1)) if head else 0.1
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
    """
    src = CURRICULUM.read_text(encoding="utf-8")
    block = re.search(r"export const STAGES = \[(.*?)\n\];", src, re.S)
    body = block.group(1).strip() if block else ""
    if not body:
        return None
    return set(re.findall(r"letter:\s*'(.)'", body))


def dist(a, b) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def poly_len(points) -> float:
    return sum(dist(points[i - 1], points[i]) for i in range(1, len(points)))


def check(paths: dict, tol: dict, forms: list, letters=None) -> list:
    """كلُّ ما يُخالف — قائمةُ شكاوى، فيصلح الفاحصُ نفسَه للفحص الذاتي."""
    bad = []
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
            strokes = ref.get("strokes") or []
            dots = ref.get("dots") or []
            if not strokes:
                bad.append(f"{tag}: لا جسمَ له — مسارٌ بلا أجزاء")
            if len(strokes) > MAX_STROKES:
                bad.append(f"{tag}: أجزاءُ جسمه {len(strokes)} وأكثرُ حرفٍ {MAX_STROKES}")
            if sum(int(d.get("count", 1)) for d in dots) > MAX_DOTS:
                bad.append(f"{tag}: نقطُه أكثرُ من {MAX_DOTS} — ولا حرفَ عربيّ كذلك")

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

                out = [p for p in points if not (0 <= p[0] <= grid and 0 <= p[1] <= grid)]
                if out:
                    bad.append(f"{where}: {len(out)} نقطةً خارج الشبكة ({out[0]})")

                length = poly_len(points)
                if length < tol["start"]:
                    bad.append(f"{where}: طولُه {length:.0f} دون دائرة البداية ({tol['start']:.0f})"
                               " — جزءٌ لا يُكتب")
                # أقصى طولِ قطعة: من نافذة المحرّك ورأسِ مساره (رأسُ الملفّ)
                cap = min(tol["back"], length * tol["head_ratio"])
                for k in range(1, len(points)):
                    step = dist(points[k - 1], points[k])
                    if step > cap:
                        bad.append(f"{where}: قطعةٌ طولُها {step:.0f} وأقصى المسموح "
                                   f"{cap:.0f} (نافذةُ الرتابة تُرشِّح قطعاً كاملة)")
                        break
                    if step < 0.05:
                        bad.append(f"{where}: نقطتان متطابقتان عند {points[k]}")
                        break

            for j, dot in enumerate(dots, 1):
                where = f"{tag} نقطة {j}"
                at = dot.get("at")
                if not at or len(at) != 2:
                    bad.append(f"{where}: بلا موضع")
                    continue
                if not (0 <= at[0] <= grid and 0 <= at[1] <= grid):
                    bad.append(f"{where}: خارج الشبكة ({at})")
                # **النقاطُ بعد الجسم** — قاعدةُ الخطّ المدرسيّ (`METHOD.md §٣.١`)
                if dot.get("after") is not True:
                    bad.append(f"{where}: لا تُعلن `after: true` — والنقاطُ بعد الجسم")
                if not isinstance(dot.get("count"), int) or dot["count"] < 1:
                    bad.append(f"{where}: عددُ نقراتها ليس عدداً صحيحاً موجباً")
                starts.append((where, at))

            # **الأجزاءُ تُميَّز بمباديها**: `pen.js` يعرف قلبَ الترتيب بأقرب جزءٍ إلى
            # موضع النزول، فبدايتان أقربُ من دائرة البداية لا يفرّق بينهما — فيُقرأ
            # ترتيبٌ صحيحٌ خطأً أو خطأٌ صحيحاً. والحدُّ سماحةُ البداية نفسُها.
            for a in range(len(starts)):
                for b in range(a + 1, len(starts)):
                    gap = dist(starts[a][1], starts[b][1])
                    if gap < tol["start"]:
                        bad.append(f"{tag}: بدايتا «{starts[a][0]}» و«{starts[b][0]}» "
                                   f"على بُعد {gap:.0f} < {tol['start']:.0f} — لا يفرّق بينهما المحرّك")
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
                print(f"  · {ch} {form}: {len(ref['strokes'])} جزءاً"
                      f" · طول {'، '.join(f'{v:.0f}' for v in spans)}"
                      f" · أقصى قطعة {max(steps):.0f}"
                      f" · نقاط {sum(int(d['count']) for d in ref['dots'])}")

    if letters is None:
        if not quiet:
            print("المنهجُ لم يُملأ بعدُ (الجلسة ٣) — فلا تغطيةَ تُطالَب، والمطالبةُ تنطلق يومَ يمتلئ")
    elif not letters:
        print("✗ المنهجُ فيه محطات ولم يُقرأ منه حرفٌ واحد — فلْيوصَل الفاحصُ بشكل المحطات")
        return 1
    elif not quiet:
        print(f"الحروفُ المقرَّرة كتابةً في المنهج: {len(letters)}")

    bad = check(paths, tol, forms, letters)
    for line in bad:
        print("  ✗ " + line)
    print(f"\n{len(bad)} مخالفة" if bad else "\nكلُّ مسارٍ سليمُ البنية: بداياتٌ معلنة،"
          " وأجزاءٌ معقولة، والنقاطُ بعد الجسم، ولا قطعةَ تخدع نافذةَ الرتابة")
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

    def one(ref):
        return {"ب": {f: ref for f in forms}}

    ok(not check(one(sound()), tol, forms), "المسارُ السليم يمرّ بلا شكوى")

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
    ok(any("خارج الشبكة" in b for b in check(one(ref), tol, forms)),
       "ويُمسِك نقطةً خارج الشبكة المعيارية")
    ref = sound()
    ref["strokes"][0]["points"] = [[500.0, 100.0], [500.0, 100.0], [500.0, 160.0]]
    ok(any("طولُه" in b or "متطابقتان" in b for b in check(one(ref), tol, forms)),
       "ويُمسِك جزءاً أقصرَ من دائرة البداية أو فيه نقطتان متطابقتان")

    # ٥) تمايزُ مبادئ الأجزاء
    ref = sound()
    ref["dots"][0]["at"] = [500.0, 120.0]
    ok(any("لا يفرّق بينهما المحرّك" in b for b in check(one(ref), tol, forms)),
       f"ويُمسِك نقطةً تجاور بدايةَ الجسم دون سماحة البداية ({tol['start']:.0f})")

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

    # ٨) وأرقامُه من المحرّك لا من هنا
    src = PEN_JS.read_text(encoding="utf-8")
    ok(f"back: {int(tol['back'])}" in src and f"start: {int(tol['start'])}" in src,
       f"وسماحاتُه مقروءةٌ من `pen.js` نفسِه (بداية {tol['start']:.0f} · ارتداد {tol['back']:.0f})")

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
