#!/usr/bin/env python3
"""🔁 **تبديلُ مادّة التطبيق** بطبقتَي الفونت والكيفية (بند ك٤).

    python3 tools/swap_material.py --write     # يكتب app/js/paths.js و word_paths.js

**العقد**: الشكلُ من `font_layer.json` والكيفيةُ من `hand_layer.json`، ويُنقلان إلى
فضاء التطبيق **بمقياسٍ واحدٍ مقيس**: ارتفاعُ الألف في المادّة القديمة على ارتفاعها
في الجديدة — فلا يتبدّل حجمُ الكتابة على اللوح ولا تنقلب معايرةُ الحَكَم.
وخطُّ الأساس يُطابَق، والسماحاتُ القديمة تُنقل كما هي لكلِّ شكل.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
HAND = TOOLS / "hand_layer.json"
PATHS = ROOT / "app/js/paths.js"
WORDS = ROOT / "app/js/word_paths.js"

CELL = 2163.5
LINE = 1361.3
WCELL = 2125.3
WLINE = 1344.7
MARGIN = 81.0


def old_material():
    """يقرأ المادّةَ القائمة من التطبيق نفسِه — للمقياس والسماحات وخطّ الأساس."""
    src = """
    import { PATHS } from './app/js/paths.js';
    const out = { tol: {}, alef: 0 };
    for (const [ch, forms] of Object.entries(PATHS))
      for (const [f, ref] of Object.entries(forms))
        out.tol[ch + '/' + f] = ref.tolerance ?? null;
    const p = PATHS['ا'].isolated.strokes.flatMap(s => s.points).map(q => q[1]);
    out.alef = Math.max(...p) - Math.min(...p);
    console.log(JSON.stringify(out));
    """
    r = subprocess.run(["node", "--input-type=module", "-e", src],
                       capture_output=True, text=True, cwd=ROOT)
    if r.returncode:
        raise SystemExit("تعذّرت قراءة paths.js: " + r.stderr[-300:])
    return json.loads(r.stdout)


def bbox(pts):
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def r1(v):
    return round(v + 0.0, 1)


def convert(unit, scale, base_y, cell_line, left=None, centre_w=None):
    """ينقل وحدةً إلى فضاء التطبيق: مقياسٌ واحد، وخطُّ أساسٍ مطابَق."""
    pts = [q for st in unit["strokes"] for q in st["p"]] + [[d[0], d[1]] for d in unit["dots"]]
    x0, y0, x1, y1 = bbox(pts)
    if left is None:
        left = (centre_w - (x1 - x0) * scale) / 2
    dx = left - x0 * scale
    dy = cell_line - base_y * scale
    put = lambda q: [r1(q[0] * scale + dx), r1(q[1] * scale + dy)]
    strokes = [{"start": put(st["p"][0]), "points": [put(q) for q in st["p"]]}
               for st in unit["strokes"]]
    dots = [{"at": put([d[0], d[1]]), "count": 1, "after": True} for d in unit["dots"]]
    return strokes, dots, (x1 - x0) * scale


def js_ref(ref, indent):
    pad = " " * indent
    out = [f'{pad}"box": [{r1(ref["box"][0])}, {r1(ref["box"][1])}],',
           f'{pad}"line": {r1(ref["line"])},']
    if ref.get("tolerance") is not None:
        out.append(f'{pad}"tolerance": {ref["tolerance"]},')
    out.append(f'{pad}"strokes": [')
    for st in ref["strokes"]:
        pts = ", ".join(f'[{p[0]}, {p[1]}]' for p in st["points"])
        out.append(f'{pad}  {{ "start": [{st["start"][0]}, {st["start"][1]}], "points": [{pts}] }},')
    out.append(f'{pad}],')
    if ref["dots"]:
        ds = ", ".join(f'{{ "at": [{d["at"][0]}, {d["at"][1]}], "count": {d["count"]}, "after": true }}'
                       for d in ref["dots"])
        out.append(f'{pad}"dots": [{ds}],')
    else:
        out.append(f'{pad}"dots": [],')
    return "\n".join(out)


def main():
    hand = json.loads(HAND.read_text(encoding="utf-8"))
    old = old_material()
    units = hand["units"]
    alef = next(u for u in units if u["name"] == "ا/isolated")
    ah = bbox([q for st in alef["strokes"] for q in st["p"]])
    scale = old["alef"] / max(ah[3] - ah[1], 1e-6)
    base_y = hand["space"]["baseline"]
    print(f"المقياسُ المقيس: ارتفاعُ ألف التطبيق {old['alef']:.0f} ÷ ألف الطبقة "
          f"{ah[3] - ah[1]:.0f} = {scale:.4f}")

    letters, words = {}, {}
    for u in units:
        if u["kind"] == "letter":
            ch, form = u["name"].split("/")
            st, dots, _ = convert(u, scale, base_y, LINE, centre_w=CELL)
            letters.setdefault(ch, {})[form] = {
                "box": [CELL, CELL], "line": LINE,
                "tolerance": old["tol"].get(u["name"]), "strokes": st, "dots": dots}
        else:
            st, dots, w = convert(u, scale, base_y, WLINE, left=MARGIN)
            words[u["text"]] = {"box": [w + 2 * MARGIN, WCELL], "line": WLINE,
                                "tolerance": 1, "strokes": st, "dots": dots}
    print(f"حُوّلت: حروفٌ {sum(len(v) for v in letters.values())} شكلاً · "
          f"وحداتُ نسخٍ {len(words)}")
    out = {"letters": letters, "words": words, "scale": scale}
    (TOOLS / "swap_material.json").write_text(json.dumps(out, ensure_ascii=False))
    print("كُتب الوسيطُ tools/swap_material.json — والكتابةُ في app/js بخطوةٍ تالية")
    return 0




def emit():
    """يكتب `app/js/paths.js` و`word_paths.js` من الوسيط — بدمجٍ يحفظ ما لم يُحصَد."""
    data = json.loads((TOOLS / "swap_material.json").read_text(encoding="utf-8"))
    src = """
    import { PATHS } from './app/js/paths.js';
    import { WORD_PATHS } from './app/js/word_paths.js';
    console.log(JSON.stringify({ p: PATHS, w: Object.keys(WORD_PATHS) }));
    """
    r = subprocess.run(["node", "--input-type=module", "-e", src],
                       capture_output=True, text=True, cwd=ROOT)
    old = json.loads(r.stdout)
    kept = 0
    letters = data["letters"]
    for ch, forms in old["p"].items():
        for form, ref in forms.items():
            if letters.get(ch, {}).get(form):
                continue
            letters.setdefault(ch, {})[form] = ref
            kept += 1
    bare_re = re.compile(r"[ً-ْٰ]")
    words = {}
    for key in old["w"]:
        naked = bare_re.sub("", key)
        ref = data["words"].get(naked)
        if ref:
            words[key] = ref
    head_p = (
        "// **المساراتُ المرجعية** لحروف «اُكْتُبْ» — 🔴 **مولَّدةٌ من الفونت وطبقة\n"
        "// الكيفية** (مرسوما ٢٤–٢٥ أغسطس ٢٠٢٦): الشكلُ من تشكيل محرّك الخطّ للنصّ\n"
        "// كاملاً (`tools/font_layer.json`)، والضرباتُ والمبادئ من `hand_layer.json`\n"
        "// — ضربةٌ لكلِّ جسمِ حبر، واليدُ ترجع على أثرها، وفاتحُ الكلام يبدأ من رأسه.\n"
        "//\n"
        "// ⚠ **ملفٌّ مولَّد — لا يُحرَّر بيد**:\n"
        "//   python3 tools/hand_layer.py --build && python3 tools/swap_material.py --write\n"
        "//\n"
        f"// **وما لم يُحصَد بعدُ يبقى من البناء السابق**: الأرقامُ والمتغيّرات ({kept} شكلاً).\n\n"
        "export const PATHS = {\n")
    body = []
    for ch, forms in letters.items():
        body.append(f'  "{ch}": {{')
        for form, ref in forms.items():
            body.append(f'   "{form}": {{')
            body.append(js_ref(ref, 4))
            body.append("   },")
        body.append("  },")
    PATHS.write_text(head_p + "\n".join(body) + "\n};\n", encoding="utf-8")
    head_w = (
        "// **مساراتُ النسخ** — 🔴 **مولَّدةٌ من الفونت وطبقة الكيفية**: الكلمةُ والجملةُ\n"
        "// تُشكَّلان دفعةً واحدةً بمحرّك الخطّ ثم يُستخرج هيكلُهما، والضرباتُ أدناها.\n"
        "//\n"
        "// ⚠ **ملفٌّ مولَّد — لا يُحرَّر بيد**:\n"
        "//   python3 tools/hand_layer.py --build && python3 tools/swap_material.py --write\n\n"
        "export const WORD_PATHS = {\n")
    wbody = []
    for key, ref in words.items():
        wbody.append(f'  "{key}": {{')
        wbody.append(js_ref(ref, 3))
        wbody.append("  },")
    WORDS.write_text(head_w + "\n".join(wbody) + "\n};\n", encoding="utf-8")
    print(f"كُتب: paths.js ({sum(len(v) for v in letters.values())} شكلاً، منها {kept} من القديم)"
          f" · word_paths.js ({len(words)} مدخلاً)")
    return 0


if __name__ == "__main__":
    if "--write" in sys.argv:
        main()
        sys.exit(emit())
    sys.exit(main())
