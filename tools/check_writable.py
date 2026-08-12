#!/usr/bin/env python3
"""حارسُ المفكوكية الكتابية — «لا يُطلب كتابةُ عنصرٍ لم يُدرَّس كتابةً».

    python3 tools/check_writable.py              # الفحص الكامل، ويطبع عددَ المحطات محسوباً
    python3 tools/check_writable.py -q           # الأخطاء وحدها
    python3 tools/check_writable.py --self-test  # فحصُ الفاحص: أيمسك المخالفات المزروعة؟

نظيرُ `check_decodable.py` في اقرأ (`METHOD.md §٩.١`)، **وليس هو**: ذاك يحرس ألّا
يُقرأ حرفٌ لم يُدرَّس، وهذا يحرس ألّا **يُكتب** ما لم يُدرَّس كتابةً — والفرقُ ليس
لفظياً: الطفلُ يقرأ «بيت» بعد ثلاث مجموعات، ولا يستطيع كتابتها حتى يتعلّم شكلَ
الباء أوّلَ الكلمة وشكلَ الياء وسطَها. **فالمعرفةُ قراءةً لا تُغني عن الرسم.**

## العناصرُ الخمسة المحروسة (`SESSIONS.md` بند الجلسة ٣)

  · **حرفاً** — لا يُطلب حرفٌ قبل درسه معزولاً.
  · **وشكلَ موقعٍ** — ولا شكلُ موقعٍ قبل درسه (ولا قبل معزوله).
  · **ووصلةً** — ولا كلمةٌ موصولةٌ قبل محطة الوصل. **والوصلةُ في تطبيق كتابةٍ هي
    شكلا طرفيها**: من كتب «با» فقد كتب باءً أوّلَ الكلمة وألفاً آخرَها — فالشرطُ
    الثاني يحرسها بعينها، ويزيده هذا الشرطُ ترتيباً.
  · **وكلمةً** — ولا جملةٌ فيها كلمةٌ لم تُنسَخ قبلها.
  · **وعلامةً** — ولا علامةٌ (شدّةٌ أو تنوينٌ أو همزةٌ أو تاءٌ مربوطة) قبل بطاقة
    تعريفها، وبطاقتُها عند **أوّل كلمةٍ تحملها** (تفصيلُ ق٣ المحسوب).

## ولا يثق بالمولِّد

`curriculum.js` مولَّد، ورسمُ كل كلمة (`letters`) مكتوبٌ فيه. فلو اكتفى هذا الفاحصُ
بقراءته لكان يفحص المولّدَ بنفسِه. فيُعيد **رسمَ كل نصٍّ من `LETTERS` نفسِها** ويقابل
— فخطأٌ في الرسم شكوى، لا صمتٌ.

## والعددُ محسوبٌ لا مكتوب

`METHOD.md §٤`: «~٦٥ محطة تُحسب من بيانات اقرأ آلياً لا تُكتب بيد». فلا رقمَ في هذا
الملف ولا في الوحدة: يُطبع ما تعدّه البنيةُ، ورقمٌ يتغيّر بتغيّر البيانات ليس انحرافاً.
"""

import argparse
import copy
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CURRICULUM = ROOT / "app" / "js" / "curriculum.js"

ISOLATED, INITIAL, MEDIAL, FINAL = "isolated", "initial", "medial", "final"
FORM_NAMES = {ISOLATED: "معزول", INITIAL: "ابتدائي", MEDIAL: "وسطي", FINAL: "نهائي"}


def load() -> dict:
    """جداولُ الوحدة المولَّدة — **قراءةً مباشرة بـ`json.loads`** لا تحليلاً نصّياً هشّاً.

    ولذلك يكتبها المولّدُ بصيغة JSON خالصة (نظيرُ `PATHS` في `paths.js`): فما يقرؤه
    التطبيقُ هو ما يقرؤه الفاحص، حرفاً بحرف.
    """
    src = CURRICULUM.read_text(encoding="utf-8")
    out = {}
    for name in ("STAGES", "GATES", "MARKS", "WORDS", "SENTENCES", "LETTERS", "VARIANTS"):
        block = re.search(rf"export const {name} = ([\[{{].*?\n[\]}}]);", src, re.S)
        if not block:
            sys.exit(f"لم يُقرأ {name} من app/js/curriculum.js — أهي مولَّدة؟")
        try:
            out[name] = json.loads(block.group(1))
        except json.JSONDecodeError as err:
            sys.exit(f"{name} في app/js/curriculum.js ليست JSON صحيحة: {err}")
    return out


# ————— رسمُ النصّ: قاعدةُ العربية، تُحسب هنا ولا تُقرأ من المولّد —————


def joins_after(ch: str, data: dict) -> bool:
    if ch in data["LETTERS"]:
        return bool(data["LETTERS"][ch]["joins"])
    return bool(data["VARIANTS"].get(ch, {}).get("joins"))


def shape(text: str, data: dict) -> list:
    """كلُّ محرفٍ في موضعه بشكله: يتصل بما قبله إن وصل ما قبله، وبما بعده إن وصل هو."""
    chars = [ch for ch in text if ch in data["LETTERS"] or ch in data["VARIANTS"]]
    out = []
    for i, ch in enumerate(chars):
        tied = i > 0 and joins_after(chars[i - 1], data)
        open_ = joins_after(ch, data) and i + 1 < len(chars)
        form = MEDIAL if (tied and open_) else FINAL if tied else INITIAL if open_ else ISOLATED
        out.append([ch, form])
    return out


def marks_of(text: str, data: dict) -> list:
    """علاماتُ نصّ: كلُّ محرفٍ ليس من الحروف الثمانية والعشرين."""
    return [ch for ch in text if ch != " " and ch not in data["LETTERS"]]


def journey(data: dict) -> list:
    """الرحلةُ بأقسامها كما تبنيها `progress.js`: محطاتٌ وقبل كلٍّ بوابتُها، والختامُ آخِراً."""
    out = []
    for stage in data["STAGES"]:
        for gate in data["GATES"]:
            if gate.get("before") == stage.get("id"):
                out.append({"gate": gate})
        out.append({"stage": stage})
    for gate in data["GATES"]:
        if gate.get("before") == "end":
            out.append({"gate": gate})
    return out


def material(node: dict) -> list:
    return [*node.get("joins", []), *node.get("words", []), *node.get("sentences", [])]


def check(data: dict) -> list:
    """كلُّ ما يُخالف — قائمةُ شكاوى، فيصلح الفاحصُ نفسَه للفحص الذاتي."""
    bad = []
    words, sentences, marks_table = data["WORDS"], data["SENTENCES"], data["MARKS"]

    taught_forms = set()      # «حرف|شكل» ممّا دُرِّس رسماً
    taught_letters = set()    # الحروفُ التي دُرِّس معزولها
    taught_words = set()      # الكلماتُ التي نُسخت
    taught_marks = set()      # العلاماتُ التي فُتحت بطاقتُها
    joined_taught = False     # أمرّ الطفلُ بمحطة الوصل؟
    seen_ids = set()

    # بطاقةُ كل علامةٍ عند عقدةٍ بعينها — يُقابَل بها المشيُ فيما بعد
    card_at = {}
    for entry in marks_table:
        card_at.setdefault(entry["mark"], []).append(entry)
    for mark, entries in card_at.items():
        if len(entries) > 1:
            bad.append(f"العلامة «{mark}» لها {len(entries)} بطاقة — والبطاقةُ عند أوّل كلمةٍ تحملها وحدَها")

    stage_ids = {stage.get("id") for stage in data["STAGES"]}
    for gate in data["GATES"]:
        where = gate.get("before")
        if where != "end" and where not in stage_ids:
            bad.append(f"بوابة «{gate.get('title')}» تقف قبل محطةٍ لا وجودَ لها: {where}")

    for section in journey(data):
        if "gate" in section:
            continue                       # البوابةُ تسأل عمّا مضى ولا تطلب جديداً
        stage = section["stage"]
        kind = stage.get("kind")
        for node in stage.get("nodes", []):
            where = f"{stage.get('id')}:{node.get('part')}"
            if where in seen_ids:
                bad.append(f"{where}: معرّفُ عقدةٍ مكرَّر — ولا تقع عقدتان في موضع")
            seen_ids.add(where)

            # ————— ١) ما تطلبه العقدة: أمدروسٌ كلُّه قبلها؟ —————
            for text in material(node):
                drawn = shape(text, data)
                declared = words.get(text, {}).get("letters") or sentences.get(text, {}).get("letters")
                if declared is not None and [list(pair) for pair in declared] != drawn:
                    bad.append(f"{where}: رسمُ «{text}» في الوحدة يخالف قاعدةَ الوصل — "
                               "والمولِّدُ لا يُصدَّق على رسمه")
                for ch, form in drawn:
                    variant = data["VARIANTS"].get(ch)
                    base = variant["base"] if variant else ch
                    if variant and ch not in taught_marks:
                        continue           # الحرفُ المتغيّر تحرسه بطاقتُه أدناه لا أشكالُ الموقع
                    if base is None:
                        continue           # الهمزةُ المفردة لا أصلَ لها ترسم عليه
                    if base not in taught_letters:
                        bad.append(f"{where}: «{text}» فيها «{base}» ولم يُدرَّس حرفاً بعد")
                    elif f"{base}|{form}" not in taught_forms:
                        bad.append(f"{where}: «{text}» تطلب «{base}» {FORM_NAMES[form]} ولم يُدرَّس")
                for mark in marks_of(text, data):
                    if mark in taught_marks or mark in node.get("marks", []):
                        continue
                    if mark not in card_at:
                        bad.append(f"{where}: «{text}» فيها «{mark}» ولا يعرفها المنهج — "
                                   "لا حرفاً من الثمانية والعشرين ولا علامةً لها بطاقة")
                    else:
                        bad.append(f"{where}: «{text}» فيها العلامة «{mark}» بلا بطاقةِ تعريفٍ قبلها")
                # ومحطةُ الوصل نفسُها تُعلِّمه، فلا تُطالَب به قبلها
                if (len(drawn) > 1 and any(joins_after(ch, data) for ch, _ in drawn[:-1])
                        and not (joined_taught or node.get("joins"))):
                    bad.append(f"{where}: «{text}» موصولةٌ وتُطلب قبل محطة الوصل")

            for text in node.get("sentences", []):
                for key in sentences.get(text, {}).get("words", []):
                    if key not in taught_words:
                        bad.append(f"{where}: جملة «{text}» فيها «{key}» ولم تُنسَخ كلمةً قبلها")

            # ————— ٢) لا إملاءَ بلا صوتٍ في بنك اقرأ —————
            if kind in ("fade", "sentence"):
                for text in node.get("words", []):
                    if not words.get(text, {}).get("say"):
                        bad.append(f"{where}: «{text}» تُملى ولا صوتَ لها في بنك اقرأ")
                for text in node.get("sentences", []):
                    if not sentences.get(text, {}).get("say"):
                        bad.append(f"{where}: جملة «{text}» تُملى ولا صوتَ لها في بنك اقرأ")

            # ————— ٣) النسب: لا مادّةَ بلا موضعٍ من رحلة اقرأ —————
            for text in node.get("words", []):
                if text not in words:
                    bad.append(f"{where}: «{text}» ليست في جدول الكلمات — ولا كلمةَ من خارج بنك اقرأ")
                elif not words[text].get("from"):
                    bad.append(f"{where}: «{text}» بلا نسبٍ إلى رحلة اقرأ")
            for text in node.get("sentences", []):
                if text not in sentences:
                    bad.append(f"{where}: جملة «{text}» ليست في جدول الجمل — ولا جملةَ من خارج سلّم اقرأ")

            # ————— ٤) ثم تُدرَّس العقدةُ ما تدرّسه (بعد أن طُولبت بما قبلها) —————
            for mark in node.get("marks", []):
                entries = card_at.get(mark, [])
                if not entries:
                    bad.append(f"{where}: تفتح العلامة «{mark}» ولا بطاقةَ لها في `MARKS`")
                elif entries[0].get("node") != where:
                    bad.append(f"{where}: بطاقةُ «{mark}» مقيَّدةٌ عند {entries[0].get('node')} لا هنا")
                taught_marks.add(mark)

            if node.get("letter"):
                letter = node["letter"]
                taught_letters.add(letter)
                taught_forms.add(f"{letter}|{ISOLATED}")
                # **غيرُ الواصل ابتدائيُّه عينُ معزوله** — أثبتته عدّةُ الجلسة ٢ بمقابلة
                # بصمتَي القناعين لا بدعوى، فلا يُطلب من طفلٍ أن يتعلّم شكلاً تعلّمه.
                if not joins_after(letter, data):
                    taught_forms.add(f"{letter}|{INITIAL}")

            for letter in node.get("letters", []):
                form = node.get("form")
                if letter not in taught_letters:
                    bad.append(f"{where}: يُدرَّس «{letter}» {FORM_NAMES.get(form, form)} ولم يُدرَّس معزولاً")
                taught_forms.add(f"{letter}|{form}")
                if form == FINAL and not joins_after(letter, data):
                    taught_forms.add(f"{letter}|{MEDIAL}")   # ووسطيُّه عينُ نهائيّه

            if node.get("joins"):
                joined_taught = True
            for text in node.get("words", []):
                taught_words.add(text)
            for mark in node.get("marks", []):
                variant = data["VARIANTS"].get(mark)
                if variant and variant["base"] and f"{variant['base']}|{FINAL}" not in taught_forms:
                    bad.append(f"{where}: العلامة «{mark}» تُرسم على «{variant['base']}» ولم يُدرَّس بعد")

    # ————— ٥) ولا مادّةَ في الجداول لا تصل إلى طفل —————
    used_words = {text for stage in data["STAGES"] for node in stage.get("nodes", [])
                  for text in node.get("words", [])}
    for text in words:
        if text not in used_words:
            bad.append(f"«{text}» في جدول الكلمات ولا محطةَ تطلبها — مادّةٌ لا تصل إلى طفل")
    used_sentences = {text for stage in data["STAGES"] for node in stage.get("nodes", [])
                      for text in node.get("sentences", [])}
    for text in sentences:
        if text not in used_sentences:
            bad.append(f"جملة «{text}» في الجدول ولا محطةَ تطلبها")
    for entry in marks_table:
        if entry.get("node") not in seen_ids:
            bad.append(f"بطاقةُ «{entry.get('mark')}» مقيَّدةٌ عند عقدةٍ لا وجودَ لها: {entry.get('node')}")

    return bad


# ————— الجرد: أرقامٌ محسوبة تُطبع —————


def report(data: dict) -> None:
    stations = sum(len(stage.get("nodes", [])) for stage in data["STAGES"]) + len(data["GATES"])
    print(f"المنهج: {stations} محطة في {len(data['STAGES'])} مرحلة و{len(data['GATES'])} بوابات "
          "— **محسوبةً من البنية لا مكتوبة**")
    for stage in data["STAGES"]:
        load = sum(len(stage_node.get(key, []))
                   for stage_node in stage.get("nodes", [])
                   for key in ("joins", "words", "sentences"))
        line = f"  · {stage.get('id'):8} {len(stage.get('nodes', [])):2} عقدة   {stage.get('title')}"
        print(line + (f"  — {load} مادّة" if load else ""))
    letters = [node["letter"] for stage in data["STAGES"] for node in stage.get("nodes", [])
               if node.get("letter")]
    forms = {f"{letter}|{node.get('form')}" for stage in data["STAGES"]
             for node in stage.get("nodes", []) for letter in node.get("letters", [])}
    print(f"  الحروف: {len(letters)} · أشكالُ مواقعَ مدروسة: {len(forms)} · "
          f"الكلمات: {len(data['WORDS'])} · الجمل: {len(data['SENTENCES'])} · "
          f"العلامات: {len(data['MARKS'])}")


# ————— الفحصُ الذاتي: مخالفاتٌ مزروعة، ولكلٍّ شكواها —————


def self_test() -> int:
    data = load()
    fails = 0

    def ok(cond, msg):
        nonlocal fails
        if not cond:
            fails += 1
        print(("  ✓ " if cond else "  ✗ ") + msg)

    ok(not check(data), "المنهجُ الحاليّ يعبر الفحص (وإلا فما بعده لا معنى له)")

    def with_(mutate):
        clone = copy.deepcopy(data)
        mutate(clone)
        return check(clone)

    def node_of(clone, stage_id, part):
        for stage in clone["STAGES"]:
            if stage["id"] != stage_id:
                continue
            for node in stage["nodes"]:
                if node["part"] == part:
                    return node
        raise SystemExit(f"لم تُوجد العقدة {stage_id}:{part} — الفحصُ الذاتي على غير مادّته")

    def stage_of(clone, stage_id):
        return next(stage for stage in clone["STAGES"] if stage["id"] == stage_id)

    # ————— ١) الحرف: كلمةٌ فيها حرفٌ لم يُدرَّس كتابةً (معيارُ قبول الجلسة ٣) —————
    def plant_unwritable(clone):
        # «ضِفْدَعْ» من المجموعة السابعة تُدَسّ في درس الباء (المجموعة الأولى): الضادُ
        # والفاءُ والدالُ والعينُ لم تُدرَّس بعدُ — وهو عينُ الخطأ الذي وُلد له الفاحص.
        node_of(clone, "g1", "ب")["words"] = ["ضِفْدَعْ"]
    bad = with_(plant_unwritable)
    ok(any("ولم يُدرَّس حرفاً بعد" in line for line in bad),
       "يُمسِك كلمةً تُطلب كتابةً وفيها حرفٌ لم يُدرَّس بعد (وُلد لها)")

    # ————— ٢) شكلُ الموقع: قبل درسه، وقبل معزوله —————
    def plant_form_before_letter(clone):
        # تُقدَّم محطةُ الشكل الابتدائيّ إلى ما قبل الحروف — وهو عينُ ما يمنعه
        # `METHOD §٤`: «أشكالُ المواقع **بعد إتقان المعزول فقط**».
        stages = clone["STAGES"]
        initial = next(stage for stage in stages if stage["id"] == INITIAL)
        stages.remove(initial)
        stages.insert(next(i for i, s in enumerate(stages) if s["id"] == "g1"), initial)
    ok(any("ولم يُدرَّس معزولاً" in line for line in with_(plant_form_before_letter)),
       "ويُمسِك شكلَ موقعٍ يُدرَّس قبل معزوله")

    def plant_word_before_form(clone):
        # تُنقَل محطةُ النسخ كلُّها إلى ما قبل أشكال المواقع: كلماتُها موصولةٌ فتطلب
        # أشكالاً لم تُدرَّس — وهي علّةُ ترتيب المراحل نفسِها.
        stages = clone["STAGES"]
        join = next(stage for stage in stages if stage["id"] == "join")
        stages.remove(join)
        stages.insert(next(i for i, s in enumerate(stages) if s["id"] == INITIAL), join)
    ok(any("ولم يُدرَّس" in line and FORM_NAMES[INITIAL] in line
           for line in with_(plant_word_before_form)),
       "ويُمسِك كلمةً تطلب شكلَ موقعٍ لم يُدرَّس بعد")

    # ————— ٣) الوصلة: كلمةٌ موصولةٌ قبل محطة الوصل —————
    def plant_join_before_ligature(clone):
        # تُنزَع الوصلاتُ من محطتيهما فلا يُدرَّس الوصل، والكلماتُ بعدهما موصولة
        node_of(clone, "join", "pair").pop("joins")
        node_of(clone, "join", "triple").pop("joins")
    ok(any("موصولةٌ وتُطلب قبل محطة الوصل" in line for line in with_(plant_join_before_ligature)),
       "ويُمسِك كلمةً موصولةً بلا محطة وصلٍ قبلها")

    # ————— ٤) الكلمة: جملةٌ فيها كلمةٌ لم تُنسَخ —————
    def plant_unwritten_word(clone):
        node = node_of(clone, "join", "prep-1")
        node["words"] = node["words"][1:]
    ok(any("ولم تُنسَخ كلمةً قبلها" in line for line in with_(plant_unwritten_word)),
       "ويُمسِك جملةً فيها كلمةٌ لم تُنسَخ قبلها")

    # ————— ٥) العلامة: بلا بطاقةِ تعريف، وبطاقةٌ في غير موضعها —————
    def plant_markless(clone):
        node_of(clone, "join", "sign-shadda").pop("marks")
    bad = with_(plant_markless)
    ok(any("بلا بطاقةِ تعريفٍ قبلها" in line for line in bad),
       "ويُمسِك علامةً تُكتب بلا بطاقةِ تعريف")

    def plant_moved_card(clone):
        for entry in clone["MARKS"]:
            if entry["mark"] == "ّ":
                entry["node"] = "join:w-g1"
    ok(any("مقيَّدةٌ عند" in line for line in with_(plant_moved_card)),
       "ويُمسِك بطاقةً مقيَّدةً عند غير عقدتها — فتفصيلُ ق٣ لا يُكتب بيد")

    # **معيارُ قبول الجلسة ٨ سالباً**: كلمةٌ فيها علامةٌ لم تُدرَّس تُدَسّ **قبل**
    # بطاقةِ تلك العلامة — وهو عينُ ما تمنعه ق٣ («أولُ كلمةٍ تحمل العلامة تفتح
    # بطاقةَ تعريفٍ قصيرة بها قبل كتابتها»).
    def plant_mark_before_card(clone):
        # «سُكَّرْ» (وفيها الشدّة) تُقدَّم إلى محطة كلمات المجموعة الأولى، وبطاقتُها
        # باقيةٌ في موضعها المتأخّر — فتُطلب كتابةُ علامةٍ لم يعرفها الطفلُ بعد.
        node = node_of(clone, "join", "w-g1")
        node["words"] = [*node["words"], "سُكَّرْ"]
    bad = with_(plant_mark_before_card)
    ok(any("بلا بطاقةِ تعريفٍ قبلها" in line and "ّ" in line for line in bad),
       "ويُمسِك كلمةً تُطلب كتابةً وفيها علامةٌ لم تُدرَّس بعد (معيارُ الجلسة ٨)")

    # **والحرفُ المتغيّر علامةٌ كذلك** (ق٣ في الرسم): همزةٌ أو تاءٌ مربوطة تُطلب قبل
    # بطاقتها تُمسَك بعينها — فلا تمرّ «قِرَاءَةْ» في محطةٍ قبل أن تُعرَّف همزتُها.
    def plant_variant_before_card(clone):
        node = node_of(clone, "join", "w-g2")
        node["words"] = [*node["words"], "قِرَاءَةْ"]
    ok(any("بلا بطاقةِ تعريفٍ قبلها" in line for line in with_(plant_variant_before_card)),
       "ويُمسِك حرفاً متغيّراً (همزةً أو تاءً مربوطة) قبل بطاقة تعريفه")

    # ————— ٦) الصوت: إملاءٌ بلا ملفٍّ في بنك اقرأ —————
    def plant_mute_dictation(clone):
        clone["WORDS"][stage_of(clone, "fade")["nodes"][0]["words"][0]]["say"] = None
    ok(any("تُملى ولا صوتَ لها" in line for line in with_(plant_mute_dictation)),
       "ويُمسِك كلمةَ إملاءٍ بلا صوتٍ في بنك اقرأ")

    # ————— ٧) الرسم: لا يُصدَّق المولّدُ على رسمه —————
    def plant_wrong_shape(clone):
        text = stage_of(clone, "fade")["nodes"][0]["words"][0]
        clone["WORDS"][text]["letters"][0][1] = ISOLATED
    ok(any("يخالف قاعدةَ الوصل" in line for line in with_(plant_wrong_shape)),
       "ويُمسِك رسماً في الوحدة يخالف قاعدةَ الوصل")

    # ————— ٨) البنية: معرّفٌ مكرَّر · بوابةٌ في الهواء · مادّةٌ لا تصل إلى طفل —————
    def plant_dupe(clone):
        stage = stage_of(clone, "warm")
        stage["nodes"].append(dict(stage["nodes"][0]))
    ok(any("معرّفُ عقدةٍ مكرَّر" in line for line in with_(plant_dupe)),
       "ويُمسِك معرّفَ عقدةٍ مكرَّراً")

    def plant_loose_gate(clone):
        clone["GATES"][0]["before"] = "nowhere"
    ok(any("تقف قبل محطةٍ لا وجودَ لها" in line for line in with_(plant_loose_gate)),
       "ويُمسِك بوابةً تقف قبل محطةٍ لا وجودَ لها")

    def plant_dead_word(clone):
        clone["WORDS"]["مَاءْ"] = {"say": "مَاءْ", "emoji": None, "from": "lex:home", "letters": []}
    ok(any("ولا محطةَ تطلبها" in line for line in with_(plant_dead_word)),
       "ويُمسِك مادّةً في الجداول لا تصل إلى طفل")

    def plant_alien_word(clone):
        node = node_of(clone, "join", "w-g1")
        node["words"] = [*node["words"], "بَابَاتْ"]
    ok(any("ولا كلمةَ من خارج بنك اقرأ" in line for line in with_(plant_alien_word)),
       "ويُمسِك كلمةً من خارج بنك اقرأ")

    print("\n" + (f"{fails} فشل" if fails else "الفاحصُ يمسك كلَّ ما وُضع له"))
    return 1 if fails else 0


def main() -> int:
    parser = argparse.ArgumentParser(description="لا يُطلب كتابةُ عنصرٍ لم يُدرَّس كتابةً")
    parser.add_argument("-q", "--quiet", action="store_true", help="الأخطاء وحدها")
    parser.add_argument("--self-test", action="store_true", help="فحصُ الفاحص بمخالفاتٍ مزروعة")
    args = parser.parse_args()

    if args.self_test:
        return self_test()

    data = load()
    if not args.quiet:
        report(data)

    bad = check(data)
    for line in bad:
        print("✗", line)
    if bad:
        print(f"\n{len(bad)} مخالفة")
        return 1
    if not args.quiet:
        print("\nلا يُطلب من الطفل كتابةُ شيءٍ لم يُدرَّس كتابةً: "
              "حرفاً ولا شكلَ موقعٍ ولا وصلةً ولا كلمةً ولا علامة")
    return 0


if __name__ == "__main__":
    sys.exit(main())
