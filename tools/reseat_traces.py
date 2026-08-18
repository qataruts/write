#!/usr/bin/env python3
"""**نقلُ آثار الميدان المجمَّدة إلى إطار السطر** — مرّةً واحدةً بعلامتها.

    python3 tools/reseat_traces.py           # ينقل ما لم يُنقَل ويطبع ما فعل
    python3 tools/reseat_traces.py --check   # لا يكتب: يقول أيّها بقي في الإطار القديم

## العلّة

**آثارُ الأطفال في `tools/pen_traces.json` مجمَّدةٌ بأمرٍ** (`origin: field`): لا
يولّدها مولِّدٌ ولا تُكتب بيد، وهي شاهدُ ميدانٍ لا يُعاد. **وقد جلس نموذجُها اليومَ
على سطرٍ واحدٍ للهجاء كلِّه** (`tools/line_layer.py`) — فتبدّل إطارُ الإحداثيات
تحتها: نموذجُ «م» كان مركزُه ٥٠٠ في شبكة ١٠٠٠، وصار على خطّ أساسٍ في خليّة ٢٠٣٥.
**فأثرٌ لم يُنقَل يُقاس إلى نموذجٍ ليس مكانَه**، ويُردّ بـ`start-far` وهو صحيح.

## والنقلُ **بالتحويل الذي نُقل به نموذجُها بعينه**

`tools/line_seating.json` يقيّد لكلِّ شكلٍ `scale` و`from` و`to`، والأثرُ يمرّ به:

```
p' = to + (p − from) × scale
```

⇐ **فالعلاقةُ بين يد الطفل ونموذجه محفوظةٌ بحرفها**: ما كان انحرافُه ١٠٧ يبقى
١٠٧ × المقياس، وما كان مقبولاً يبقى مقبولاً بنسبته. **ولا يُعاد أثرٌ ولا يُلمَس
شكلُه** — إزاحةٌ وتحجيمٌ منتظم لا غير، وهو عينُ ما جرى للنموذج فوقه.

## ولا يُنقَل أثرٌ مرّتين

يُختَم كلُّ منقولٍ بـ`frame: "line"`، **فالتشغيلةُ الثانية لا تجد ما تنقله**.
والمقياسُ يُقيَّد في الأثر نفسِه (`seated`) فيُعرَف بأيّ رقمٍ نُقل.
"""

import json
import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
TRACES = TOOLS / "pen_traces.json"
SEATING = TOOLS / "line_seating.json"


def main() -> int:
    check = "--check" in sys.argv
    if not SEATING.exists():
        print("لا قيدَ لتحويل الجلوس — يُبنى بـ`make_paths.py --seat`.")
        return 1
    seating = json.loads(SEATING.read_text(encoding="utf-8"))["shapes"]
    data = json.loads(TRACES.read_text(encoding="utf-8"))
    moved, stale, ready = [], [], []
    for case in data.get("cases", []):
        if case.get("origin") != "field":
            continue
        if case.get("frame") == "line":
            ready.append(case["id"])
            continue
        rule = seating.get(case.get("ref"))
        if not rule:
            stale.append(case["id"])
            continue
        scale = rule["scale"]
        fx, fy = rule["from"]
        tx, ty = rule["to"]
        if not check:
            case["strokes"] = [[[round(tx + (p[0] - fx) * scale, 1),
                                 round(ty + (p[1] - fy) * scale, 1)] for p in stroke]
                               for stroke in case["strokes"]]
            case["frame"] = "line"
            case["seated"] = scale
        moved.append(case["id"])

    print(f"في إطار السطر سلفاً: {len(ready)} · يُنقَل: {len(moved)}"
          + (f" · بلا تحويلٍ لشكله: {len(stale)}" if stale else ""))
    for one in moved:
        print(f"  ⤷ {one}")
    for one in stale:
        print(f"  ✗ {one}: لا قيدَ لتحويل شكله — لا يُنقَل بالتخمين")
    if check or not moved:
        return 1 if stale else 0
    TRACES.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n",
                      encoding="utf-8")
    print(f"كُتبت {TRACES.name}: {len(moved)} أثراً في إطار السطر")
    return 1 if stale else 0


if __name__ == "__main__":
    raise SystemExit(main())
