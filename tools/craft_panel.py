#!/usr/bin/env python3
"""**لوحةُ مرشّحات الكرّاسة** — بند الجلسة ٧/٣، على سنّة أبواب الهوية.

    python3 tools/craft_panel.py             # يبني المرشّحات كلَّها ويصوّرها ويقيسها
    python3 tools/craft_panel.py --case kaf  # حالةٌ بعينها
    python3 tools/craft_panel.py --self-test # عهدُ اللوحة: أهي مرشّحاتٌ لا تطبيق؟

## لماذا هذه العدّة؟

`SESSIONS.md` بند الجلسة ٧: «الاتجاهُ هو المادةُ المدرَّسة، فتُقرَّر الحالةُ الحركية
الواحدة **جواباً واحداً بكرّاسة**، **ومرشّحاتُ الخلاف تُصيَّر للمالك** (سنّةُ أبواب
الهوية)، وتُعاد الإيماءاتُ المخالفة ويُعاد البناء».

فالمعروضُ على المالك **ليس وصفاً**: لكلِّ جوابٍ **لقطةٌ حقيقية** مبنيّةٌ من إيماءته
على خيال الحرف نفسِه، **وقياسٌ من المحرّك** الذي سيحكم على الطفل (`craft_measure.mjs`).

## وملفُّ المشروع لا يُمَسّ

كلُّ مرشّحٍ يُبنى من **نسخةٍ مؤقّتة** من `tools/path_anchors.json` تُخدَم للعدّة في
الذاكرة، فلا تدخل إيماءةٌ مقترحةٌ ملفَّ المشروع ولا `app/js/paths.js` **إلا بعد حكم
المالك** (وعندها تُعاد الإيماءةُ ويُعاد البناء بالسائق المعتاد). ويحرس ذلك الفحصُ
الذاتيّ أدناه.

## وشاهدُ الكرّاسة

خطُّ النسخ المدرسيّ المعتمد (ق٢) هو الكرّاسةُ التي في يدنا: منه يُقرأ خيالُ كلِّ
شكلٍ وهيكلُه. **ولا صورةَ كرّاسةٍ ورقية في المستودع** — فما استند إلى عادة التدريس
يُنسب إليها صراحةً في `tools/craft_cases.json`، ولا يُدَّعى شاهدٌ لم يُرَ.
"""

import argparse
import copy
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
CASES = TOOLS / "craft_cases.json"
ANCHORS = TOOLS / "path_anchors.json"
SHOTS = ROOT / "docs" / "craft"
PAGE = ROOT / "docs" / "REVIEW_HANDWRITING.md"

sys.path.insert(0, str(TOOLS))
import make_paths  # noqa: E402  (حظيرةُ العدّة وسائقُها — تبعيةٌ معلَنة)

FORM_AR = {"isolated": "معزول", "initial": "ابتدائي", "medial": "وسطي", "final": "نهائي"}
AR_DIGITS = "٠١٢٣٤٥٦٧٨٩"


def ar(n) -> str:
    """رقمٌ عربيّ — الصفحةُ تُقرأ بعينٍ عربية، والأرقامُ فيها من لغتها."""
    return "".join(AR_DIGITS[int(d)] if d.isdigit() else d for d in str(n))


def cases() -> dict:
    return json.loads(CASES.read_text(encoding="utf-8"))


def variant_anchors(gestures: dict, mark_strokes: bool) -> dict:
    """نسخةُ الإيماءات ومعها إيماءةُ المرشّح — **ولا يُكتب هذا على القرص في `tools/`**."""
    spec = json.loads(ANCHORS.read_text(encoding="utf-8"))
    for key, strokes in gestures.items():
        ch, form = key.split("/")
        entry = spec["letters"][ch][form]
        if "sameAs" in entry:
            sys.exit(f"{key}: شكلٌ يُدَّعى عينَ غيره — لا يُرشَّح له إيماءةٌ مستقلة")
        entry["strokes"] = copy.deepcopy(strokes)
        if mark_strokes:
            entry["markStrokes"] = True
    return spec


def temp_spec(spec: dict) -> Path:
    handle = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8")
    handle.write(json.dumps(spec, ensure_ascii=False))
    handle.close()
    return Path(handle.name)


def build(spec_file: Path, letters: str, port: int, timeout: int) -> tuple:
    """يبني حروفَ المرشّح وحدَها ويعيد (المسارات، سطورُ العدّة) — أو (None، الشكوى)."""
    results = make_paths.drive(f"?build=1&only={letters}", port, timeout, anchors_file=spec_file)
    payload = next((r for r in results if "paths" in r), None)
    if not payload:
        why = " · ".join(r["msg"] for r in results if not r["ok"]) or "لم تصل حصيلةٌ من العدّة"
        return None, why
    return payload["paths"], [r["msg"] for r in results if r["ok"]]


def shot(spec_file: Path, shapes: list, out: Path, port: int, timeout: int, tries: int = 3) -> bool:
    """لقطةُ المرشّح: خيالُ كلِّ شكلٍ وهيكلُه ومسارُه المؤلَّف ببدايته الخضراء.

    **وشهادةُ اللوحة شرطٌ لا زينة** (مراجعةُ الجلسة ٥: «شاهدُ العين الناقصُ شاهدٌ
    كاذب»): اللوحةُ تقيس نفسَها في نافذتها وتقول إن بترت. غير أنّ المتصفّحَ يخرج
    أحياناً بعد التقاط الصورة **قبل أن يصل تقريرُها**، فيُعاد التشغيل حتى تشهد —
    ولا تُقبَل صورةٌ بلا شهادتها.
    """
    out.parent.mkdir(parents=True, exist_ok=True)
    pick = ",".join(shapes)
    window = make_paths.sheet_window(len(shapes))
    for _ in range(tries):
        results = make_paths.drive(f"?sheet=1&tags=0&pick={pick}", port, timeout,
                                   shots=out, window=window, anchors_file=spec_file)
        if not results:
            continue                      # خرج المتصفّحُ قبل تقريره — تُعاد اللقطة
        if out.exists() and all(r["ok"] for r in results):
            return True
        for line in results:
            if not line["ok"]:
                print(f"     — {line['msg']}")
        return False
    return False


def measure(paths: dict, shapes: list) -> dict:
    """يُدخل مساراتِ المرشّح على المحرّك — بلا متصفّح ومن غير ملفّ المنهج."""
    handle = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8")
    handle.write(json.dumps(paths, ensure_ascii=False))
    handle.close()
    try:
        run = subprocess.run(["node", str(TOOLS / "craft_measure.mjs"), handle.name, *shapes],
                             capture_output=True, encoding="utf-8", check=False)
        if run.returncode != 0:
            return {"error": (run.stderr or run.stdout).strip()[:400]}
        return json.loads(run.stdout)
    finally:
        Path(handle.name).unlink(missing_ok=True)


def run_case(case: dict, port: int, timeout: int) -> dict:
    letters = "".join(sorted({s.split("/")[0] for s in case["shapes"]}))
    out = {"case": case, "candidates": []}
    for candidate in case["candidates"]:
        spec = variant_anchors(candidate["gestures"], candidate.get("markStrokes", False))
        spec_file = temp_spec(spec)
        try:
            png = SHOTS / f"{case['id']}-{candidate['id']}.png"
            paths, note = build(spec_file, letters, port, timeout)
            row = {"id": candidate["id"], "png": png, "built": paths is not None}
            if paths is None:
                # **والمرشّحُ الذي لا يُبنى خبرٌ لا صمت**: شكواه بحرفها تُعرَض على
                # المالك — فهي جوابُ العدّة على جوابه، لا سكوتٌ عنه.
                row["why"] = note
                row["shot"] = False
                print(f"  ✗ {case['id']}/{candidate['id']}: لم يُبنَ — {note}")
            else:
                row["measure"] = measure(paths, case["shapes"])
                row["shot"] = shot(spec_file, case["shapes"], png, port, timeout)
                mark = "✓" if row["shot"] else "✗"
                print(f"  {mark} {case['id']}/{candidate['id']}: بُني وقِيس"
                      + ("" if row["shot"] else " — وتعذّرت اللقطة"))
            out["candidates"].append(row)
        finally:
            spec_file.unlink(missing_ok=True)
    return out


# ————— صفحةُ المالك —————
#
# **وأبوابُ الحكم تُحفَظ عند إعادة التوليد** (سنّةُ `identity_doors.py` في الجلسة هـ٢):
# ما يكتبه المالكُ بين العلامتين يبقى كما هو، فلا يمحو تشغيلٌ حكماً.

KEEP_HEAD = "<!-- ⇩ يُحفَظ عند إعادة التوليد — بابُ المالك: {id} ⇩ -->"
KEEP_TAIL = "<!-- ⇧ ينتهي المحفوظ: {id} ⇧ -->"
BLANK = "**الحكم**: ⏳ منتظِرٌ — يُكتب هنا: أيُّ المرشّحَين، وبتاريخه."


def kept(source: str, case_id: str) -> str:
    head, tail = KEEP_HEAD.format(id=case_id), KEEP_TAIL.format(id=case_id)
    if head in source and tail in source:
        return source.split(head, 1)[1].split(tail, 1)[0].strip()
    return BLANK


def rule_line(row: dict, shape: str) -> str:
    if not row.get("built"):
        return "—"
    data = (row.get("measure") or {}).get(shape) or {}
    if data.get("missing"):
        return "لم يُبنَ هذا الشكل"
    if "error" in (row.get("measure") or {}):
        return "تعذّر القياس"
    bits = [f"أجزاء {ar(data['strokes'])}"]
    if data["marks"]:
        bits.append(f"علاماتٌ {ar(data['marks'])} ({ar(data['dots'])} نقرة)")
    if data["folds"]:
        bits.append(f"طيّاتٌ معلَنة {ar(data['folds'])}")
    bits.append("يُقبَل صحيحاً ✓" if data["accepted"] else f"**يُرَدّ صحيحاً «{data['why']}»** ✗")
    bits.append("ويُرَدّ معكوساً ✓" if data["reverseRejected"] else "**ويُقبَل معكوساً** ✗")
    room = f"هامشُ الرجفة {ar(data['drift'])}"
    room += (" ✓" if data["drift"] >= data["floor"]
             else f" — **دون عهد `child-drift` ({ar(data['floor'])})** ✗")
    bits.append(room)
    if data.get("folds"):
        bits.append(("الخطُّ الواحد يُقبَل ✓" if data.get("spine") else "**الخطُّ الواحد يُرَدّ** ✗")
                    + (" · الأثرُ الرطب يُقبَل ✓" if data.get("wet") else " · **الأثرُ الرطب يُرَدّ** ✗"))
    return " · ".join(bits)


def render(results: list, source: str) -> str:
    lines = [
        "# مرجعيةُ الكرّاسة — الحالاتُ الحركية المعلَّقة وجواباها",
        "",
        "> ⚠ **ملفٌّ مولَّد** — لا يُحرَّر بيد إلا **أبوابُ حكم المالك** (يحفظها المولّد):",
        ">",
        ">     python3 tools/craft_panel.py",
        ">",
        "> **الاتجاهُ هو المادةُ المدرَّسة** (`METHOD.md §١`)، فلا يجوز أن تُكتب الحالةُ",
        "> الحركيةُ الواحدة بجوابين في منهجٍ واحد. وهذه الصفحةُ تعرض كلَّ حالةٍ معلَّقة",
        "> **بجوابيها مبنيَّين مصوَّرَين مقيسَين** — ثم يحكم المالك، **ولا تُعاد إيماءةٌ",
        "> ولا يُعاد بناءٌ قبل حكمه**.",
        "",
        "**كيف تُقرأ اللقطة؟** الرماديُّ الباهت خيالُ الحرف بخطّ النسخ المدرسيّ (ق٢)،",
        "والأزرقُ هيكلُه (مسارُ القلم في قلب الحبر)، **والأحمرُ المسارُ المؤلَّف** ونقطتُه",
        "الخضراء **بدايةُ القلم**. فما تراه هو ما سيراه الطفلُ متحركاً وما سيحكم به المحرّك.",
        "",
        "**وشاهدُ الكرّاسة**: خطُّ النسخ المعتمد نفسُه (منه الخيالُ والهيكل) وقياسُ المحرّك.",
        "**ولا صورةَ كرّاسةٍ ورقية في المستودع** — فما استند إلى عادة التدريس مكتوبٌ أنه",
        "كذلك، ولا يُدَّعى شاهدٌ لم يُرَ.",
        "",
    ]
    for index, result in enumerate(results, start=1):
        case = result["case"]
        lines += [f"## {ar(index)}. {case['title']}", "", case["question"], ""]
        cells = []
        for row, candidate in zip(result["candidates"], case["candidates"]):
            name = f"docs/craft/{Path(row['png']).name}"
            body = (f'<a href="craft/{Path(row["png"]).name}">'
                    f'<img src="craft/{Path(row["png"]).name}" width="380" alt="{candidate["title"]}"></a>'
                    if row.get("shot") else "<b>لم تُبنَ لقطةٌ لهذا الجواب</b>")
            cells.append(f'<td align="center" width="50%">{body}<br>'
                         f'<sub>{candidate["title"]}</sub></td>')
        lines += ["<table><tr>", *cells, "</tr></table>", ""]
        for row, candidate in zip(result["candidates"], case["candidates"]):
            lines += [f"### {candidate['title']}", ""]
            lines += [f"- **شاهدُه**: {candidate['witness']}"]
            lines += [f"- **ثمنُه**: {candidate['cost']}"]
            if not row.get("built"):
                lines += [f"- **ولم تبنِه العدّة**: {row.get('why')}", ""]
                continue
            lines += ["- **وقياسُ المحرّك عليه**:", ""]
            lines += ["| الشكل | ما قاله المحرّك |", "|---|---|"]
            for shape in case["shapes"]:
                ch, form = shape.split("/")
                lines.append(f"| {ch} {FORM_AR.get(form, form)} | {rule_line(row, shape)} |")
            lines.append("")
        lines += [KEEP_HEAD.format(id=case["id"]), kept(source, case["id"]),
                  KEEP_TAIL.format(id=case["id"]), ""]
    lines += [
        "## بعد الحكم",
        "",
        "تُعاد الإيماءاتُ المخالفة في `tools/path_anchors.json` بيدِ جلسةِ تنفيذ، ثم",
        "`python3 tools/make_paths.py --build`، ثم تُعاد الحرّاس كلُّها — **والهوامشُ",
        "والعدّةُ تبقى فوق العهد** (`test_paths.mjs`: عهدُ `child-drift`).",
        "",
    ]
    return "\n".join(lines) + "\n"


def self_test() -> int:
    fails = 0

    def ok(cond, msg):
        nonlocal fails
        if not cond:
            fails += 1
        print(("  ✓ " if cond else "  ✗ ") + msg)

    spec = cases()
    ok(bool(spec.get("cases")), f"الحالاتُ المعروضة {len(spec.get('cases', []))}")
    for case in spec["cases"]:
        ok(len(case["candidates"]) == 2, f"{case['id']}: جوابان متنازعان لا أكثر ولا أقلّ")
        ok(all(c.get("witness") and c.get("cost") for c in case["candidates"]),
           f"{case['id']}: لكلِّ جوابٍ شاهدُه **وثمنُه** — ولا يُعرَض جوابٌ بلا ثمن")
        for candidate in case["candidates"]:
            missing = [s for s in case["shapes"] if s not in candidate["gestures"]]
            ok(not missing, f"{case['id']}/{candidate['id']}: يعلن إيماءةَ كلِّ شكلٍ يُعرَض"
               + (f" — ناقص: {'، '.join(missing)}" if missing else ""))

    # **ولا يُطبَّق مرشّحٌ قبل حكم**: ملفُّ الإيماءات على القرص لا يحمل إيماءةَ مرشّحٍ
    # ولا رايةَ `markStrokes` — فما دام الحكمُ منتظَراً فالمنهجُ على حاله.
    disk = json.loads(ANCHORS.read_text(encoding="utf-8"))
    planted = [f"{ch}/{form}" for ch, forms in disk["letters"].items()
               for form, entry in forms.items() if entry.get("markStrokes")]
    ok(not planted, "ولا رايةَ «العلامةُ ضربة» في ملفّ المشروع — لا يُطبَّق مرشّحٌ قبل حكم"
       + (f" — مزروعة: {'، '.join(planted)}" if planted else ""))

    changed = []
    for case in spec["cases"]:
        current = [c for c in case["candidates"] if "الحاليّ" in c["title"]]
        if not current:
            continue
        for key, strokes in current[0]["gestures"].items():
            ch, form = key.split("/")
            if disk["letters"][ch][form].get("strokes") != strokes:
                changed.append(key)
    ok(not changed, "و«الحاليّ» في كلِّ حالةٍ هو ما في ملفّ المشروع بعينه — لا مرشّحٌ يُنسَب إليه"
       + (f" — يخالف: {'، '.join(changed)}" if changed else ""))

    print("\n" + (f"{fails} فشل" if fails else "عهدُ لوحة المرشّحات قائم"))
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser(description="لوحةُ مرشّحات الكرّاسة لعين المالك")
    ap.add_argument("--case", help="حالةٌ بعينها (معرّفُها في craft_cases.json)")
    ap.add_argument("--self-test", action="store_true", help="عهدُ اللوحة بلا متصفّح")
    ap.add_argument("--port", type=int, default=8793)
    ap.add_argument("--timeout", type=int, default=240)
    args = ap.parse_args()

    if args.self_test:
        return self_test()

    spec = cases()
    chosen = [c for c in spec["cases"] if not args.case or c["id"] == args.case]
    if not chosen:
        sys.exit(f"لا حالةَ بهذا المعرّف: {args.case}")

    results = []
    for case in chosen:
        print(f"\n— {case['title']}")
        results.append(run_case(case, args.port, args.timeout))

    # **والصفحةُ تُكتب كاملةً أو لا تُكتب**: تشغيلُ حالةٍ واحدة لا يمحو أخواتها،
    # فيُعاد بناءُ ما لم يُشغَّل من الصفحة القائمة كما هو.
    source = PAGE.read_text(encoding="utf-8") if PAGE.exists() else ""
    if args.case and source:
        print("\n(حالةٌ واحدة: الصفحةُ لا تُكتب — شغّل بلا `--case` لتوليدها كاملة)")
        return 0
    PAGE.write_text(render(results, source), encoding="utf-8")
    print(f"\nكُتبت {PAGE.relative_to(ROOT)} — {len(results)} حالةً، "
          f"{sum(1 for r in results for c in r['candidates'] if c.get('shot'))} لقطة")
    return 0


if __name__ == "__main__":
    sys.exit(main())
