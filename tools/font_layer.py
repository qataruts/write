#!/usr/bin/env python3
"""🏗 **طبقةُ الفونت** — هياكلُ المادّة كلِّها من محرّك الخطّ (بند ك٢).

    python3 tools/font_layer.py --build        # يحصد المادّةَ كلَّها ⇐ tools/font_layer.json
    python3 tools/font_layer.py --build --fresh # بلا نسخٍ محفوظ (يُعاد كلُّ شيء)
    python3 tools/font_layer.py --self-test    # الحرّاسُ الأربعة بلا متصفّح
    python3 tools/font_layer.py --panel        # لوحةُ المراجعة الشاملة للمدير
    python3 tools/font_layer.py --list         # جردُ المادّة قبل الحصاد

## السند — مرسومُ «كلُّ ما هو مكتوبٌ من الفونت» (٢٤ أغسطس ٢٠٢٦)

> «كلُّ ما هو مكتوب كلُّه بلا استثناء من الفونت» · «ما زلت تستخدم طريقة بدائية
> لتوصيل الحروف مع بعض وهو ما نحاول تغييره».

⇐ **الشكلُ يُستخرَج من تشكيل محرّك الخطّ للنصّ كاملاً**: الوحدةُ — حرفاً بموضعه
بالوصلة، أو كلمةً، أو جملةً — **تُشكَّل دفعةً واحدة** ثم يُنحَّف حبرُها هيكلاً،
**ولا تركيبَ حرفٍ إلى حرفٍ**. والحصادُ في `make_paths.html §runFontSkel`، وهذا
سائقُه: يجزّئ ويستأنف ويجمع ويحرس.

## المقياسُ واحدٌ للمادّة كلِّها — والنسبةُ محفوظة

أمرُ المالك المنتهي (١٩ أغسطس): «**يجب حفظ النسبة … ولو ظهر حرفُ الدال صغيراً لا
مشكلة**». فكلُّ وحدةٍ تُرسَم بأكبرِ مقاسٍ يسعه لوحُها — **دقّةُ تتبّعٍ لا حكمُ
نِسَب** (حجّةُ `line_layer.py` بعينها) — ثم تُردُّ إحداثياتُها إلى **فضاءٍ واحد**:
جسمُ الحرف فيه `em` واحدةٌ للجميع، وخطُّ الأساس واحدٌ، والمبدأُ حافّةُ الحبر
اليمنى. **فلا وحدةٌ تُكبَّر لتملأ خليّتَها**، والدالُ تخرج صغيرةً كما هي في الخطّ.

## البناءُ تزايديٌّ بالبصمة، وينبض، ويستأنف (عهدُ ١٥ أغسطس)

بصمةُ الوحدة = **بصمةُ الفونت + بصمةُ قسم الحصاد في العدّة + نصُّ الوحدة**. فما
لم تتبدّل بصمتُه لا يُعاد حصادُه، والدفعةُ تُحفَظ فورَ رجوعها، وكلُّ وحدةٍ تطبع
سطرَها. **والعثرةُ تسمّي موضعَها بنصّها** فلا تُعاد الساعةُ لأجل كلمة.

## ما يخرج من هنا — وما لا يخرج

`tools/font_layer.json`: **ملفٌّ وسيط لا يمسّ `app/js` بحال**. وإيماءاتُ الكيفية
(بدايةٌ واتجاهٌ ورفعُ قلمٍ بعقدها) وإعادةُ معايرة الحَكَم **بندُ ك٣** بعد حكم
المالك على اللوحة الشاملة — **والترتيبُ هنا ترتيبُ عرضٍ أوّليّ** لا أكثر:
الأجسامُ من أيمنِها، وكلُّ قطعةٍ من أيمنِ طرفيها فأعلاهما، ورفعُ القلم يُعلَن
على قاعدة المالك المحصورة (مبدأُ جسمٍ جديد رفعٌ، وما اتّصل حبرُه فالقلمُ ماضٍ).

**والمتغيّراتُ** (أ إ آ ؤ ئ ء ة ى) لا تُحصَد مفردةً في هذا البند — حدودُه
«٢٩ حرفاً» — **وهي محصودةٌ في سياقها** داخل كلمات المادّة وجملها.
"""

import argparse
import hashlib
import html
import json
import re
import sys
import tempfile
import time
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
sys.path.insert(0, str(TOOLS))
import make_paths  # noqa: E402  (سائقُ المتصفّح وقراءةُ المنهج — عدّةٌ واحدة لا نسختان)
import ports  # noqa: E402

OUT = TOOLS / "font_layer.json"
PANEL = TOOLS / "font_panel.html"
CACHE = ROOT / "scratch" / "build" / "font_units.json"
FONT = ROOT / "app" / "fonts" / "NotoNaskhArabic-arabic.woff2"
FORMS = ["isolated", "initial", "medial", "final"]
FORM_AR = {"isolated": "معزول", "initial": "ابتدائي", "medial": "وسطي", "final": "نهائي"}
HARAKA = re.compile(r"[ً-ْٰـ]")

# **قسمُ الحصاد في العدّة** — تُبصَم حدودُه فيُعرَف أنّ الهياكل خرجت منه بعينه:
# تعديلُ قاعدةِ نقطةٍ أو ترتيبٍ بلا إعادة حصادٍ يحمرّ من نفسه (نظيرُ بصمة الإيماءات).
HARVEST_SECTION = ("function skelOf(", "async function runWordMeasure(")


def dot_limits() -> tuple:
    """حدَّا النقطة **مقروءان من العدّة** — لا رقمَ يُكتب هنا فيشيخ."""
    src = make_paths.TOOL_PAGE.read_text(encoding="utf-8")
    tall = re.search(r"const DOT_TALL = ([\d.]+);", src)
    wide = re.search(r"const DOT_WIDE = ([\d.]+);", src)
    if not tall or not wide:
        raise SystemExit("لم يُعثر على حدَّي النقطة في `make_paths.html`")
    return float(tall.group(1)), float(wide.group(1))

# **القواطعُ**: ما لا يوصل بما بعده — تُقرأ من المنهج لا تُكتب هنا (`joins`).


def font_sha() -> str:
    return hashlib.sha1(FONT.read_bytes()).hexdigest()[:12]


def harvest_sha() -> str:
    src = make_paths.TOOL_PAGE.read_text(encoding="utf-8")
    head = src.find(HARVEST_SECTION[0])
    tail = src.find(HARVEST_SECTION[1], head + 1)
    if head < 0 or tail < 0:
        raise SystemExit("لم يُعثر على قسم الحصاد في `make_paths.html` — بصمتُه لا تُخمَّن")
    return hashlib.sha1(src[head:tail].encode("utf-8")).hexdigest()[:12]


def stamp() -> str:
    return f"{font_sha()}·{harvest_sha()}"


def bare(text: str) -> str:
    """النصُّ مجرَّداً — «لا تشكيل في كل تطبيق اكتب»، ولا تطويلَ يُدَسّ."""
    return re.sub(r"\s+", " ", HARAKA.sub("", text)).strip()


def joins_of() -> dict:
    """`joins` من المنهج — مَن يصل بما بعده ومَن يقطع. لا قائمةَ تُكتب هنا."""
    src = make_paths.CURRICULUM.read_text(encoding="utf-8")
    out = {}
    for name in ("LETTERS", "VARIANTS"):
        body = re.search(rf"export const {name} = (\{{.*?\n\}});", src, re.S)
        if body:
            for ch, info in json.loads(body.group(1)).items():
                out[ch] = bool(info.get("joins"))
    return out


def letters_of() -> list:
    src = make_paths.CURRICULUM.read_text(encoding="utf-8")
    body = re.search(r"export const LETTERS = (\{.*?\n\});", src, re.S)
    return list(json.loads(body.group(1)).keys())


def kinds_of() -> dict:
    """كلُّ وحدةٍ من مادّة النسخ وجنسُها — من `curriculum.js` كما تقرؤه أدواتُ البناء."""
    src = make_paths.CURRICULUM.read_text(encoding="utf-8")
    out = {}
    words = re.search(r"export const WORDS = (\{.*?\n\});", src, re.S)
    if words:
        for text in json.loads(words.group(1)):
            out.setdefault(text, "word")
    stages = re.search(r"export const STAGES = (\[.*?\n\]);", src, re.S)
    if stages:
        for stage in json.loads(stages.group(1)):
            for node in stage.get("nodes", []):
                if stage.get("kind") == "join":
                    for text in node.get("joins", []):
                        out.setdefault(text, "pair")
                    for text in node.get("words", []):
                        out.setdefault(text, "word")
                elif stage.get("kind") == "sentence":
                    for text in node.get("sentences", []):
                        out.setdefault(text, "sentence")
    return out


def material() -> list:
    """المادّةُ كلُّها وحداتٍ مسمّاةً بأجناسها — حروفاً ثم كلماتٍ وأزواجاً وجملاً.

    **٢٩ حرفاً بمواضعها الأربعة بالوصلة** (٢٨ من المنهج ولام-ألفٍ حرفاً معتمداً
    بموضعيه — لا تأتي إلا معزولةً أو نهائية، فاللامُ لا يسبقها وصلٌ إلى ما بعد
    الألف)، **والكلماتُ والأزواجُ والجملُ** كما تقرؤها `make_paths.word_material()`
    بعينها — مصدرٌ واحدٌ لا قائمةٌ ثانية تشيخ. **وكلُّها مجرَّدةٌ من التشكيل.**
    """
    units = []
    for ch in letters_of():
        for form in FORMS:
            units.append({"text": ch, "form": form, "kind": "letter"})
    for form in ("isolated", "final"):
        units.append({"text": "لا", "form": form, "kind": "letter"})
    kinds = kinds_of()
    seen = set()
    for text in make_paths.word_material():
        naked = bare(text)
        if not naked or naked in seen:
            continue
        seen.add(naked)
        units.append({"text": naked, "form": None, "kind": kinds.get(text, "word"),
                      "source": text if naked != text else None})
    return units


def key_of(unit: dict) -> str:
    return f"{unit['text']}/{unit['form']}" if unit["form"] else unit["text"]


def load_cache() -> dict:
    if not CACHE.exists():
        return {}
    try:
        got = json.loads(CACHE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    return got if got.get("stamp") == stamp() else {}


def build(port: int, timeout: int, chunk: int, fresh: bool) -> int:
    """يحصد المادّةَ كلَّها — دفعةً دفعةً، ببصمتها، وينبض سطراً سطراً."""
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    units = material()
    mark = stamp()
    cache = {} if fresh else load_cache()
    rows = dict(cache.get("units") or {})
    fell = dict(cache.get("fell") or {})
    todo = [u for u in units if key_of(u) not in rows]
    print(f"🏗 مادّةُ الفونت {len(units)} وحدةً — بصمتُها {mark}")
    print(f"   محفوظٌ ببصمته {len(units) - len(todo)} · يُحصَد الآن {len(todo)}"
          f" · الدفعةُ {chunk}\n")
    started = time.time()
    done = 0
    for start in range(0, len(todo), chunk):
        batch = todo[start:start + chunk]
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False,
                                         encoding="utf-8") as fh:
            json.dump(batch, fh, ensure_ascii=False)
            items = Path(fh.name)
        try:
            got = make_paths.drive("?part=fontskel", port, timeout,
                                   pages={"/__font_items.json": items})
        finally:
            items.unlink(missing_ok=True)
        if not got:
            print(f"  ✗ [{start}–{start + len(batch)}] لم تصل حصيلةٌ — المحصودُ محفوظٌ،"
                  " وإعادةُ التشغيل تكمل من هنا.")
            return 1
        for row in got:
            done += 1
            print(("  ✓ " if row["ok"] else "  ✗ ")
                  + f"[{done}/{len(todo)}] " + row["msg"])
            if row.get("unit"):
                rows[row["unit"]["name"]] = row["unit"]
                fell.pop(row["unit"]["name"], None)
            elif row.get("fell"):
                fell[row["fell"]["name"]] = row["fell"]["why"]
        CACHE.write_text(json.dumps({"stamp": mark, "units": rows, "fell": fell},
                                    ensure_ascii=False), encoding="utf-8")
        print(f"  ⤷ نقطةُ تفتيشٍ محفوظة ({len(rows)} وحدةً) — {round(time.time() - started)}ث")
    return assemble(units, rows, fell, mark)


def assemble(units: list, rows: dict, fell: dict, mark: str) -> int:
    """يجمع الوحداتِ في الملفّ الوسيط — **بإزاحةٍ عامّةٍ واحدة** لا تمسّ النسبة.

    الحصادُ يخرج بخطّ أساسٍ صفرٍ ومبدأٍ في حافّة الحبر اليمنى، **فالإحداثياتُ
    سالبة**. فتُزاح المادّةُ كلُّها بإزاحةٍ **واحدة** (لا إزاحةً لكلِّ وحدة!)
    فتصير موجبةً وتبقى الوحداتُ على سطرٍ واحدٍ ومقياسٍ واحد.
    """
    have = [rows[key_of(u)] for u in units if key_of(u) in rows]
    if not have:
        print("لا وحدةَ محصودة")
        return 1
    dx = -min(u["box"][0] for u in have)
    dy = -min(u["box"][1] for u in have)
    for unit in have:
        unit["at"] = [round(dx, 1), round(dy, 1)]
        unit["box"] = [round(unit["box"][0] + dx, 1), round(unit["box"][1] + dy, 1),
                       round(unit["box"][2] + dx, 1), round(unit["box"][3] + dy, 1)]
        for piece in unit["pieces"]:
            piece["p"] = [[round(p[0] + dx, 1), round(p[1] + dy, 1)] for p in piece["p"]]
        unit["dots"] = [[round(d[0] + dx, 1), round(d[1] + dy, 1), d[2], d[3]]
                        for d in unit["dots"]]
    payload = {
        "what": "هياكلُ المادّة كلِّها من محرّك الخطّ — النصُّ يُشكَّل دفعةً واحدة"
                " ويُنحَّف هيكلاً (مرسومُ ٢٤ أغسطس ٢٠٢٦)",
        "tool": "tools/font_layer.py --build (وحصادُه make_paths.html §runFontSkel)",
        "warn": "ملفٌّ وسيط: لا يقرؤه `app/js` — التبديلُ وإيماءاتُ الكيفية بندُ ك٣",
        "stamp": mark,
        "font": "NotoNaskhArabic — نسخٌ مدرسيّ (ق٢)",
        "space": {"em": have[0]["em"], "baseline": round(dy, 1),
                  "origin": "حافّةُ الحبر اليمنى لكلِّ وحدة، وإزاحةٌ عامّةٌ واحدة"},
        "counts": {k: sum(1 for u in have if u["kind"] == k)
                   for k in ("letter", "pair", "word", "sentence")},
        "fell": fell,
        "units": have,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    size = OUT.stat().st_size / 1048576
    print(f"\nوكُتب {OUT.relative_to(ROOT)}: {len(have)} وحدةً ({size:.1f} ميغا)"
          + (f" — وسقط {len(fell)}: {'، '.join(list(fell)[:5])}" if fell else " — بلا سقوط"))
    return 1 if fell else 0


# ————— الحرّاسُ الأربعة —————


def need_of(text: str, joins: dict) -> int:
    """أدنى عددِ أجسامٍ توجبه قاعدةُ الوصل: كلمةٌ = ١ + قواطعُها التي يليها حرف.

    **كما في `word_layer.py`** (حارسُ القواطع، بلاغُ المالك ٢٤ أغسطس: «الدالُ
    موصولةٌ بما بعدها — راقب كلَّ الحروف التي لا توصل») — **والمسافةُ تقطع كذلك**،
    فالجملةُ مجموعُ كلماتها. **والقواطعُ من المنهج** (`joins`) لا من قائمةٍ تُكتب.
    """
    need = 0
    for word in [w for w in bare(text).split(" ") if w]:
        chars = list(word)
        need += 1 + sum(1 for i in range(1, len(chars))
                        if not joins.get(chars[i - 1], False))
    return need


def guards(payload: dict) -> list:
    """(نجح، نصّ) لكلِّ حارس — أربعةٌ لا تُعَدّ حالاتُها بل تُشتقّ من البيانات."""
    units = payload["units"]
    joins = joins_of()
    out = []

    # ١) قاعدةُ الوصل ظاهرةً: كلُّ قاطعٍ يقطع فعلاً
    short = []
    for unit in units:
        need = need_of(unit["text"] if not unit["form"] else unit["text"], joins)
        if unit["form"] in ("medial", "final"):
            need = 1          # الشكلُ الموصولُ أوّلُه جسمٌ واحدٌ بحكم موضعه
        if unit["bodies"] < need:
            short.append(f"«{unit['name']}» ({unit['bodies']}<{need})")
    out.append((not short, f"وكلُّ قاطعٍ يقطع فعلاً في {len(units)} وحدةً محصودة"
                + (f" — مخالفات: {'، '.join(short[:5])}" if short else "")))

    # ٢) ولا «لـا» أبداً — بالقياس لا بالدعوى
    lam = [u for u in units if "لا" in u["text"]]
    broke = [u["name"] for u in lam if u["lig"] is not True]
    tat = [u["name"] for u in units if "ـ" in u["text"] or HARAKA.search(u["text"])]
    out.append((not broke and not tat,
                f"ولام-ألفٍ رسمٌ واحدٌ في {len(lam)} وحدةً تحملها — أضيقُ من «لـا» بالقياس"
                + (f" — سقطت: {'، '.join(broke[:5])}" if broke else "")
                + (f" · وتطويلٌ مدسوس: {'، '.join(tat[:3])}" if tat else "")))

    # ٣) مقياسٌ واحدٌ للمادّة كلِّها — والنسبةُ محفوظة
    ems = {u["em"] for u in units}
    high = {u["name"]: round(u["box"][3] - u["box"][1], 1) for u in units}
    alef = high.get("ا/isolated")
    dal = high.get("د/isolated")
    ratio = round(dal / alef, 2) if alef and dal else None
    # **٠٫٦٤ نصيبُ الدال من الألف في المرجع** (`line_layer.py`) — وكانت ٠٫٩٠ يومَ
    # كُبِّر كلُّ حرفٍ ليملأ خليّتَه. فالنسبةُ تُقاس ولا تُدَّعى.
    out.append((len(ems) == 1 and ratio is not None and 0.45 <= ratio <= 0.80,
                f"ومقياسٌ واحدٌ للمادّة كلِّها ({len(ems)} مقياساً، الجسمُ {sorted(ems)[0]})"
                f" — والدالُ {ratio} من الألف (المرجعُ ٠٫٦٤) فلا حرفَ يملأ خليّتَه"))

    # ٤) حارسُ العلامات ⇐ ٠
    marked = [u["name"] for u in units if HARAKA.search(u["text"])]
    out.append((not marked, f"وحارسُ العلامات {len(marked)} — المادّةُ تُحصَد نصاً مجرَّداً"))
    return out


def body_boxes(unit: dict) -> list:
    """صناديقُ أجسام الوحدة `(عرض، ارتفاع)` — تُجمَع من قطعها بأرقام أجسامها."""
    box = {}
    for piece in unit["pieces"]:
        xs = [q[0] for q in piece["p"]]
        ys = [q[1] for q in piece["p"]]
        got = box.setdefault(piece["body"], [min(xs), max(xs), min(ys), max(ys)])
        got[0] = min(got[0], min(xs))
        got[1] = max(got[1], max(xs))
        got[2] = min(got[2], min(ys))
        got[3] = max(got[3], max(ys))
    return [(b[1] - b[0], b[3] - b[2]) for b in box.values()]


def self_test() -> int:
    if not OUT.exists():
        print(f"لا {OUT.relative_to(ROOT)} — يُبنى أولاً (`--build`)")
        return 1
    payload = json.loads(OUT.read_text(encoding="utf-8"))
    fails = 0

    def ok(cond, msg):
        nonlocal fails
        if not cond:
            fails += 1
        print(("  ✓ " if cond else "  ✗ ") + msg)

    ok(payload.get("stamp") == stamp(),
       f"وبصمةُ الحصاد تطابق الفونتَ وقسمَ العدّة ({payload.get('stamp')})"
       " — تبديلُ أحدهما بلا إعادة حصادٍ يحمرّ")
    units = payload["units"]
    want = material()
    missing = [key_of(u) for u in want if key_of(u) not in {x["name"] for x in units}]
    ok(not missing, f"والمادّةُ كلُّها محصودةٌ {len(units)}/{len(want)}"
       + (f" — ساقطٌ بنصّه: {'، '.join(missing[:5])}" if missing else ""))
    for good, msg in guards(payload):
        ok(good, msg)

    # **وفرجةُ النقطة تُقاس على المادّة كلِّها** — لا تُدَّعى: أعلى نقطةٍ محصودة
    # وأقصرُ ضربةٍ حقيقية، والحدُّ العامل بينهما. (وهي شاهدُ «الحدّ العامل لا
    # الثابت المكتوب» على هذه الطبقة بعينها.)
    # **والمقارنةُ على المحور الحاكم وحدَه**: القاعدةُ شرطان معاً (ارتفاعٌ **و**عرض)،
    # فجسمٌ عريضٌ منبسط ليس نقطةً مهما قصُر — **فلا يُقارَن به**. والحاكمُ إذاً
    # ارتفاعُ ما **لم يُنجِه عرضُه**: أجسامٌ عرضُها دون حدّ العرض، فنجاتُها بطولها.
    em = payload["space"]["em"]
    tall_lim, wide_lim = dot_limits()
    dots = [d[3] * 2 for u in units for d in u["dots"]]
    narrow = [b[3] - b[1] for u in units for b in u.get("bboxes") or []
              if b[2] - b[0] < wide_lim * em]
    tallest = max(dots, default=0) / em
    shortest = min(narrow, default=0) / em
    ok(tallest < tall_lim <= shortest,
       f"وفرجةُ النقطة مقيسة في فضاء الحكم (حبراً لا هيكلاً) وعلى محوره الحاكم:"
       f" أعلى نقطةٍ {tallest:.3f} من الجسم · وأقصرُ ضربةٍ ضيّقة {shortest:.3f}"
       f" · والحدُّ {tall_lim} بينهما ({len(dots)} نقطةً · {len(narrow)} ضربةً ضيّقة)")

    # **وعددُ نقاط كلِّ حرفٍ يُقابَل بالبناء المعتمد** (`paths.js`) — شاهدٌ خارجيّ
    # على أنّ الفونت أعطى نقاطَ الهجاء بأعيانها، لا حارسٌ من الطبقة على نفسها.
    known, _ = make_paths.paths_module()
    seen = {u["name"]: len(u["dots"]) for u in units if u["form"]}
    off = []
    for ch, forms in (known or {}).items():
        for form, shape in forms.items():
            want = sum(d.get("count", 1) for d in shape.get("dots") or [])
            got = seen.get(f"{ch}/{form}")
            if got is not None and got != want:
                off.append(f"{ch}/{FORM_AR[form]} {got}≠{want}")
    ok(not off, f"ونقاطُ الحروف كنقاط `paths.js` في {len(seen)} شكلاً"
       + (f" — تخالف {len(off)}: {'، '.join(off[:6])}" if off else ""))

    # **ومجرَّبٌ سالباً**: وحدةٌ يُنقَص جسمُها تحمرّ، ولام-ألفٍ تُكسَر تحمرّ
    hurt = json.loads(json.dumps(payload))
    joins = joins_of()
    victim = next((u for u in hurt["units"]
                   if not u["form"] and need_of(u["text"], joins) > 1), None)
    if victim:
        victim["bodies"] = need_of(victim["text"], joins) - 1
        ok(not guards(hurt)[0][0],
           f"ونقصُ جسمٍ في «{victim['name']}» يحمرّ — حارسُ القواطع مجرَّبٌ سالباً")
    hurt2 = json.loads(json.dumps(payload))
    lam = next((u for u in hurt2["units"] if "لا" in u["text"]), None)
    if lam:
        lam["lig"] = False
        ok(not guards(hurt2)[1][0],
           f"و«لـا» مدسوسةٌ في «{lam['name']}» تحمرّ — الحارسُ مجرَّبٌ سالباً")
    hurt3 = json.loads(json.dumps(payload))
    grown = next(u for u in hurt3["units"] if u["name"] == "د/isolated")
    grown["box"] = [grown["box"][0], grown["box"][1],
                    grown["box"][2], grown["box"][1] + (
                        next(u for u in hurt3["units"] if u["name"] == "ا/isolated")["box"][3]
                        - next(u for u in hurt3["units"] if u["name"] == "ا/isolated")["box"][1])]
    ok(not guards(hurt3)[2][0],
       "ودالٌ كُبِّرت حتى ساوت الألفَ تحمرّ — وهي علّةُ عهد النسبة بعينها")

    print(f"\n{fails} فشل" if fails else "\nطبقةُ الفونت: المادّةُ كلُّها من الفونت وحرّاسُها خضر")
    return 1 if fails else 0


# ————— لوحةُ المراجعة الشاملة —————

SAMPLE = {"pair": 8, "word": 12, "sentence": 6}


def svg_of(unit: dict, base: float, wide: bool = False,
           band: tuple = None, pen: float = None) -> str:
    """رسمُ الوحدة على سطرها.

    **والقلمُ واحدٌ والمقياسُ واحد** (مرسوما «الحبر الواحد» و«حفظ النسبة»): السُّمكُ
    يأتي مقيساً من الفونت نفسِه (`pen` = عرضُ ساق الألف حبراً) بوحدات الفضاء
    المشترك، فيُصغَّر مع الوحدة ولا يُكتب رقماً يشيخ. **و`band` نافذةُ الحروف
    الواحدة** (قمّةٌ · قاعٌ · عرض): كلُّ حرفٍ يُرسم فيها بمقياسٍ واحد فتظهر نسبتُه
    الحقيقية — الألفُ تطول والدالُ تصغُر ولا يُكبَّر حرفٌ ليملأ خليّتَه.
    """
    x0, y0, x1, y1 = unit["box"]
    span = max(x1 - x0, 1.0)
    sw = pen if pen else span / (440 if wide else 70)
    pad = sw * 4
    if band:
        top, bottom, win = band
        cx = (x0 + x1) / 2
        line = (f'<line x1="{cx - win / 2:.1f}" y1="{base:.1f}" x2="{cx + win / 2:.1f}"'
                f' y2="{base:.1f}" class="base" stroke-width="{sw * 0.4:.1f}"/>')
        body = []
        for piece in unit["pieces"]:
            d = "M " + " L ".join(f"{p[0]:.1f} {p[1]:.1f}" for p in piece["p"])
            body.append(f'<path d="{d}" class="{"lift" if piece["lift"] else "run"}"'
                        f' stroke-width="{sw:.1f}"/>')
            head = piece["p"][0]
            body.append(f'<circle cx="{head[0]:.1f}" cy="{head[1]:.1f}"'
                        f' r="{sw * (1.1 if piece["lift"] else 0.6):.1f}"'
                        f' class="{"start" if piece["lift"] else "go"}"/>')
        for d in unit["dots"]:
            body.append(f'<ellipse cx="{d[0]:.1f}" cy="{d[1]:.1f}" rx="{d[2]:.1f}"'
                        f' ry="{d[3]:.1f}" class="dot"/>')
        return (f'<svg viewBox="{cx - win / 2:.1f} {top:.1f} {win:.1f} {bottom - top:.1f}"'
                f' preserveAspectRatio="xMidYMid meet"'
                f' style="aspect-ratio:{win:.0f}/{bottom - top:.0f}">'
                + line + "".join(body) + "</svg>")
    body = []
    for piece in unit["pieces"]:
        d = "M " + " L ".join(f"{p[0]:.1f} {p[1]:.1f}" for p in piece["p"])
        body.append(f'<path d="{d}" class="{"lift" if piece["lift"] else "run"}"'
                    f' stroke-width="{sw:.1f}"/>')
        head = piece["p"][0]
        body.append(f'<circle cx="{head[0]:.1f}" cy="{head[1]:.1f}"'
                    f' r="{sw * (1.8 if piece["lift"] else 1.0):.1f}"'
                    f' class="{"start" if piece["lift"] else "go"}"/>')
    for d in unit["dots"]:
        body.append(f'<ellipse cx="{d[0]:.1f}" cy="{d[1]:.1f}" rx="{max(d[2], sw):.1f}"'
                    f' ry="{max(d[3], sw):.1f}" class="dot"/>')
    line = (f'<line x1="{x0 - pad:.1f}" y1="{base:.1f}" x2="{x1 + pad:.1f}" y2="{base:.1f}"'
            f' class="base" stroke-width="{sw * 0.4:.1f}"/>')
    w = x1 - x0 + 2 * pad
    h = y1 - y0 + 2 * pad
    return (f'<svg viewBox="{x0 - pad:.1f} {y0 - pad:.1f} {w:.1f} {h:.1f}"'
            f' preserveAspectRatio="xMidYMid meet" style="aspect-ratio:{w:.0f}/{h:.0f}">'
            + line + "".join(body) + "</svg>")


def panel() -> int:
    if not OUT.exists():
        print(f"لا {OUT.relative_to(ROOT)} — تُبنى الطبقةُ أولاً (`--build`)")
        return 1
    payload = json.loads(OUT.read_text(encoding="utf-8"))
    units = payload["units"]
    base = payload["space"]["baseline"]
    by_name = {u["name"]: u for u in units}
    letters = [u for u in units if u["kind"] == "letter"]
    order = []
    for ch in letters_of() + ["لا"]:
        for form in FORMS:
            if f"{ch}/{form}" in by_name:
                order.append(by_name[f"{ch}/{form}"])
    rest = {k: [u for u in units if u["kind"] == k] for k in SAMPLE}
    alef = next((u for u in letters if u["name"] == "ا/isolated"), None)
    unit_h = (alef["box"][3] - alef["box"][1]) if alef else 1
    # **القلمُ يُقاس ولا يُكتب**: عرضُ ساق الألف حبراً هو قلمُ هذا الخطّ — ونصفُه
    # يُرسم به الهيكلُ فيُرى بلا أن يطمس أسنانَ السين. **والنافذةُ واحدةٌ للهجاء**:
    # من أعلى قمّةٍ إلى أعمق نزولٍ في المادّة كلِّها، وعرضُها أوسعُ حرفٍ — فالنسبةُ
    # تُرى بالعين لا تُقرأ في الحاشية.
    pen = abs(alef["bboxes"][0][0] - alef["bboxes"][0][2]) / 2 if alef else 40.0
    top = min(u["box"][1] for u in letters) - pen
    bottom = max(u["box"][3] for u in letters) + pen
    win = max(u["box"][2] - u["box"][0] for u in letters) + 2 * pen
    band = (top, bottom, win)

    def rows(items, wide=False, one=False):
        out = []
        for u in items:
            tall = round((u["box"][3] - u["box"][1]) / unit_h, 2)
            out.append(
                f'<figure><div class="art">'
                f'{svg_of(u, base, wide, band if one else None, pen)}</div>'
                f'<figcaption><b>{html.escape(u["text"])}</b>'
                + (f' <span class="f">{FORM_AR[u["form"]]}</span>' if u["form"] else "")
                + f'<span class="n">أجسام {u["bodies"]} · قطع {len(u["pieces"])}'
                  f' · نقاط {len(u["dots"])} · من الألف ×{tall}</span>'
                  "</figcaption></figure>")
        return "\n".join(out)

    ratios = sorted(((u["name"], round((u["box"][3] - u["box"][1]) / unit_h, 2))
                     for u in letters), key=lambda r: -r[1])
    table = "".join(f"<tr><td>{html.escape(n)}</td><td>{v}</td></tr>" for n, v in ratios)
    counts = payload["counts"]
    fell = payload.get("fell") or {}
    doc = f"""<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8">
<title>طبقةُ الفونت — لوحةُ المراجعة الشاملة</title>
<style>
 :root {{ color-scheme: dark; --ink:#e8e4dc; --bg:#14161c; --card:#1c1f27; --line:#3b4250;
   --run:#7fd1c7; --lift:#f2b544; --dot:#e0685f; }}
 body {{ margin:0; padding:28px; background:var(--bg); color:var(--ink);
   font:16px/1.7 -apple-system,"SF Arabic","Noto Naskh Arabic",serif; }}
 h1 {{ font-size:26px; margin:0 0 6px; }}
 h2 {{ font-size:20px; margin:34px 0 10px; border-bottom:1px solid var(--line); padding-bottom:6px; }}
 p.lead {{ color:#a9b1c0; margin:0 0 18px; max-width:70ch; }}
 .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:14px; }}
 figure {{ margin:0; background:var(--card); border:1px solid var(--line); border-radius:10px;
   padding:10px; }}
 .wide .grid {{ grid-template-columns:1fr; }}
 .art {{ background:#0f1115; border-radius:6px; padding:6px; }}
 svg {{ width:100%; display:block; }}
 path {{ fill:none; stroke-linecap:round; stroke-linejoin:round; }}
 path.run {{ stroke:var(--run); }}
 path.lift {{ stroke:var(--lift); }}
 circle.start {{ fill:var(--lift); }} circle.go {{ fill:var(--run); }}
 ellipse.dot {{ fill:var(--dot); }}
 line.base {{ stroke:#4a5364; stroke-dasharray:2% 1.4%; }}
 figcaption {{ margin-top:8px; font-size:14px; }}
 figcaption .f {{ color:#a9b1c0; }}
 figcaption .n {{ display:block; color:#8d95a5; font-size:12px; }}
 table {{ border-collapse:collapse; font-size:14px; }}
 td {{ border:1px solid var(--line); padding:3px 10px; }}
 .cols {{ columns:5; }}
 .key {{ color:#a9b1c0; font-size:14px; }}
 b.warn {{ color:var(--dot); }}
</style>
<h1>طبقةُ الفونت — لوحةُ المراجعة الشاملة (بند ك٢)</h1>
<p class="lead">كلُّ ما ترى هنا <b>من الفونت</b>: النصُّ يُشكَّل دفعةً واحدة بمحرّك الخطّ
(<code>NotoNaskhArabic</code>) ثم يُنحَّف حبرُه هيكلاً — <b>لا تركيبَ حرفٍ إلى حرف</b>.
والمقياسُ <b>واحدٌ للمادّة كلِّها</b> وخطُّ الأساس واحد (الخطُّ المنقّط)، فالدالُ تخرج
صغيرةً كما هي في الخطّ ولا تُكبَّر لتملأ خليّتَها.</p>
<p class="key">اللون: <b style="color:var(--lift)">ذهبيّ</b> قطعةٌ يبدؤها رفعُ قلم (مبدأُ جسمٍ
جديد — بعد قاطعٍ أو في المبدأ) · <b style="color:var(--run)">أخضر</b> قطعةٌ يمضي إليها القلمُ
موصولاً · <b style="color:var(--dot)">أحمر</b> نقطةٌ بامتدادها. والدائرةُ مبدأُ القطعة.
<b>والترتيبُ هنا عرضٌ أوّليّ</b> — إيماءاتُ الكيفية (بدايةً واتجاهاً ورفعَ قلمٍ بعقدها) بندُ ك٣.</p>
<p class="key">المحصود: حروفٌ {counts['letter']} · أزواج {counts['pair']} · كلمات {counts['word']}
 · جمل {counts['sentence']} — والبصمة <code>{payload['stamp']}</code>.
{'<b class="warn">وسقط: ' + '، '.join(fell) + '</b>' if fell else '<b>بلا سقوط.</b>'}</p>

<h2>١) الحروفُ بمواضعها الأربعة بالوصلة ({len(order)} شكلاً)</h2>
<p class="key">كلُّها بمقياسٍ واحدٍ وسطرٍ واحد — الألفُ تطول والسنُّ يصغُر كما هي الحقيقة،
 ولا حرفَ يُكبَّر ليملأ بطاقتَه.</p>
<div class="grid tight">{rows(order, one=True)}</div>

<h2>٢) الأزواجُ الموصولة (عيّنةٌ من {counts['pair']})</h2>
<div class="grid">{rows(rest['pair'][:SAMPLE['pair']])}</div>

<h2>٣) الكلمات (عيّنةٌ من {counts['word']})</h2>
<div class="grid">{rows(rest['word'][:SAMPLE['word']])}</div>

<h2>٤) الجمل (عيّنةٌ من {counts['sentence']})</h2>
<div class="wide"><div class="grid">{rows(rest['sentence'][:SAMPLE['sentence']], wide=True)}</div></div>

<h2>٥) النسبةُ محفوظة — نصيبُ كلِّ شكلٍ من الألف</h2>
<p class="key">مقياسٌ عامٌّ واحد: لا شكلَ يُكبَّر ليملأ خليّتَه. (الدالُ في المرجع ٠٫٦٤.)</p>
<div class="cols"><table>{table}</table></div>
</html>"""
    PANEL.write_text(doc, encoding="utf-8")
    print(f"لوحةُ المراجعة في {PANEL.relative_to(ROOT)}"
          f" ({PANEL.stat().st_size / 1024:.0f} كيلو) — تُعرَض على المدير بعينه")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="طبقةُ الفونت: هياكلُ المادّة كلِّها")
    ap.add_argument("--build", action="store_true", help="حصادُ المادّة كلِّها")
    ap.add_argument("--self-test", action="store_true", help="الحرّاسُ الأربعة بلا متصفّح")
    ap.add_argument("--panel", action="store_true", help="لوحةُ المراجعة الشاملة")
    ap.add_argument("--list", action="store_true", help="جردُ المادّة قبل الحصاد")
    ap.add_argument("--assemble", action="store_true", help="جمعُ المحفوظ بلا متصفّح")
    ap.add_argument("--fresh", action="store_true", help="بلا نسخٍ محفوظ")
    ap.add_argument("--chunk", type=int, default=24, help="وحداتُ الدفعة الواحدة")
    ap.add_argument("--port", type=int, default=ports.port_of("font_layer"))
    ap.add_argument("--timeout", type=int, default=900)
    args = ap.parse_args()
    if args.list:
        units = material()
        by = {}
        for u in units:
            by[u["kind"]] = by.get(u["kind"], 0) + 1
        print(f"مادّةُ الفونت {len(units)} وحدةً — " + " · ".join(f"{k} {v}" for k, v in by.items()))
        print("بصمتُها " + stamp())
        return 0
    if args.self_test:
        return self_test()
    if args.panel:
        return panel()
    if args.assemble:
        cache = load_cache()
        return assemble(material(), cache.get("units") or {}, cache.get("fell") or {}, stamp())
    if args.build:
        return build(args.port, args.timeout, args.chunk, args.fresh)
    ap.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
