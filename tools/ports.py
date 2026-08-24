#!/usr/bin/env python3
"""منافذُ أدوات «اُكْتُبْ» — **جدولٌ واحد يُقرأ ولا يُكتب رقمٌ في أداة**.

    python3 tools/ports.py               # يطبع الجدول
    python3 tools/ports.py --self-test   # لا تكرار، ولا رقمَ منثور، ولا منفذَ جار

**العلّة** (بند الجلسة ١٢، وأصلُه أمرُ العائلة من احسب `calc@16c37dc`): ثلاثةُ
تطبيقاتٍ في مساحة عملٍ واحدة **وعدَدُها من بذرةٍ واحدة** — فالأداةُ المنسوخة تأتي
بمنفذ صاحبها معها. و`audio_panel` عندنا بقيت على **٨١١٠ منفذِ «اِقْرَأْ» نفسِه**
فاصطدمت بجارٍ ثلاث مرات، ومعها `make_icons`/`make_paths` على ٨٧٩١ (منفذُ «اِحْسِبْ»)
و`perf_check` على ٨٨٩٩ (منفذُ «اِقْرَأْ»). **والتصادمُ لا يُقرأ تصادماً**: يُقرأ عطباً
في الشيفرة، وأغلى ما يضيع وقتُ من يطارد عطباً لا وجودَ له.

**والعلاجُ جدولٌ لا انتباه**: منفذُ الحظيرة ٨٧٩٢ حصّتُنا من نطاق العائلة (اقرأ ٨٧٩٠ ·
احسب ٨٧٩١ · اكتب ٨٧٩٢)، وسائرُ أدوات الخدمة عندنا في **نطاقٍ خاصّ بنا وحدَنا**
(٨٧٢٠–٨٧٢٩) لا يلمسه جار. وأداةٌ تُكتب غداً بمنفذٍ منثورٍ في نصّها **يُسقِطها الفحصُ
الذاتيّ هنا يومَ تُكتب** — وهذا الملفُّ من سَوقة `test_selftests.mjs` بالجرد.
"""

import argparse
import re
import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parent

# نطاقُ العائلة المشترك: لكلِّ تطبيقٍ حظيرتُه هو ولا يتعدّاها
FAMILY = {8790: "اِقْرَأْ", 8791: "اِحْسِبْ", 8792: "اُكْتُبْ"}
# نطاقُنا الخاص: أدواتُ الخدمة عندنا وحدَنا — لا يعرفه جار
PRIVATE = range(8720, 8730)

PORTS = {
    # الحظيرة: حصّتُنا من نطاق العائلة (وهي وحدَها خارج النطاق الخاص، بحكم القسمة)
    "browser_test": 8792,
    # أدواتُ الخدمة — كلٌّ بمنفذه، فتشغيلُ اثنتين معاً لا يُفشِل إحداهما
    "audio_panel": 8720,
    "craft_panel": 8721,
    "make_paths": 8722,
    "make_icons": 8723,
    "make_welcome_shots": 8724,
    "identity_panel": 8725,
    "identity_doors": 8726,
    "perf_check": 8727,
    "owner_board": 8728,
    "font_layer": 8729,
}


def port_of(tool: str) -> int:
    """منفذُ أداةٍ باسم ملفّها بلا لاحقة — والاسمُ الغريب خطأٌ يُقال لا صفرٌ صامت."""
    if tool not in PORTS:
        raise KeyError(f"لا منفذَ مقيَّدٌ للأداة «{tool}» في tools/ports.py")
    return PORTS[tool]


def self_test() -> int:
    checks = []

    def ok(cond, msg):
        checks.append((bool(cond), msg))

    # ١) لا منفذَ مكرَّر بين أدواتنا
    dupes = [p for p in set(PORTS.values()) if list(PORTS.values()).count(p) > 1]
    ok(not dupes, f"لا منفذَ مكرَّرٌ بين أدواتنا ({len(PORTS)} أداة)"
       + (f" — المكرَّر: {dupes}" if dupes else ""))

    # ٢) ولا منفذَ جارٍ: ما عدا حظيرتَنا، كلُّها في نطاقنا الخاص
    strays = {t: p for t, p in PORTS.items()
              if t != "browser_test" and p not in PRIVATE}
    ok(not strays,
       f"وكلُّ أداةِ خدمةٍ في نطاقنا الخاص {PRIVATE.start}–{PRIVATE.stop - 1}"
       + (f" — الشاردة: {strays}" if strays else ""))
    ok(PORTS["browser_test"] == 8792 and FAMILY[8792] == "اُكْتُبْ",
       "وحظيرتُنا على حصّتنا من نطاق العائلة ٨٧٩٢ (اقرأ ٨٧٩٠ · احسب ٨٧٩١)")

    # ٣) **ولا رقمَ منثورٌ في أداة**: مَن أعلن `--port` قرأه من هنا — والجردُ من
    #    القرص لا قائمةٌ تُكتب، فأداةُ الغد تدخل الحراسةَ يومَ تُكتب.
    files = sorted(f for f in TOOLS.glob("*.py") if f.name != "ports.py")
    declaring = [f for f in files if re.search(r'add_argument\(\s*["\']--port["\']', f.read_text(encoding="utf-8"))]
    ok(declaring, f"وأدواتُ المنفذ المجرودة من القرص: {len(declaring)}"
       f" ({'، '.join(f.stem for f in declaring)})")
    for path in declaring:
        text = path.read_text(encoding="utf-8")
        written = re.findall(r'add_argument\(\s*["\']--port["\'][^)]*default\s*=\s*(\d+)', text)
        reads = "import ports" in text or "from ports import" in text
        ok(reads and not written,
           f"  {path.name}: منفذُه مقروءٌ من الجدول"
           + (f" — رقمٌ منثور: {written}" if written else "")
           + ("" if reads else " — ولا يقرأ الجدول أصلاً"))
        ok(path.stem in PORTS, f"  {path.name}: وله سطرٌ في الجدول")

    for good, msg in checks:
        print(("  ✓ " if good else "  ✗ ") + msg)
    bad = sum(1 for good, _ in checks if not good)
    print("\n" + ("جدولُ المنافذ سليم: لا تكرار، ولا رقمَ منثور، ولا منفذَ جار."
                  if not bad else f"{bad} فشل"))
    return 1 if bad else 0


def main() -> int:
    ap = argparse.ArgumentParser(description="جدولُ منافذ أدوات «اُكْتُبْ»")
    ap.add_argument("--self-test", action="store_true", help="فحصٌ ذاتيّ بلا شبكة")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    for tool, port in sorted(PORTS.items(), key=lambda kv: kv[1]):
        print(f"  {port}  {tool}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
