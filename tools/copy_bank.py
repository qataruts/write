#!/usr/bin/env python3
"""**ناسخُ بنك اقرأ** — أصواتُ المنهج تُنسَخ بأعيانها ببصماتها، ولا يُولَّد منها شيء.

    python3 tools/copy_bank.py            # جردٌ يُطبع ولا يُكتب
    python3 tools/copy_bank.py --copy     # ينسخ الناقص ويُحدِّث الفهرس
    python3 tools/copy_bank.py --self-test  # عهدُ النسخ: أكلُّ ملفٍّ عينُ أصله؟

## العهد

`docs/AUDIO_QUEUE.md`: «أصواتُ اقرأ المنسوخة… **توليدُها من جديد يُسمِع الطفلَ
الكلمةَ بصوتين**». وقد نُسخت في الجلسة ٨ يداً (١٢٦ ملفاً، `SEED §١٠`–`§١٢`)، ولم
تكن لها عدّة. **وجلسةُ التوسعة تحتاج مئاتٍ** (بساتينُ اقرأ الخمسمائة وسلّمُ جمله)،
فصار للنسخ أداةٌ تُعيده أبداً بلا يد.

## القاعدة

**المفتاحُ من النصّ في الجهتين** (`sha1` أوّلُ اثنتي عشرة خانة): فمفتاحُ «بابا» عندهم
هو مفتاحُها عندنا حرفاً بحرف — ولذلك **يُنسَخ الملفُّ باسمه ولا يُعاد ترميزُه**، وتُقابَل
بصمةُ المنسوخ ببصمة أصله. **وما لا نصَّ له في بنكهم لا يُخترع له**: يُطبع باسمه.

## وما يُنسَخ؟

`SPOKEN_WORDS` و`SPOKEN_SENTENCES` من منهجنا — وهي **حقلُ `say` بأعيانه**، أي مفتاحُ
الملفّ عند اقرأ (`METHOD.md §٧`). فما لا `say` له «يُنسَخ بالعين ولا يُملى» ولا صوتَ
يُطلب له.
"""

import argparse
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CURRICULUM = ROOT / "app" / "js" / "curriculum.js"
OUT_DIR = ROOT / "app" / "audio"
MANIFEST = OUT_DIR / "manifest.json"


def key_for(text: str) -> str:
    """نظيرُ `key_for` في `generate_audio.py` — والقاعدةُ واحدة في الجهتين."""
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:12]


def read_root(arg: str | None) -> Path:
    """موضعُ «اِقْرَأْ» — المرجعُ الحيّ يُقرأ ولا يُمَسّ."""
    where = Path(arg) if arg else ROOT.parent / "read"
    if not (where / "app" / "audio" / "manifest.json").exists():
        sys.exit(f"لم يُوجد بنكُ «اِقْرَأْ» في {where} — مرِّر موضعَه بـ‎--read <path>‎.")
    return where


def wanted() -> list:
    """نصوصُ المنهج المنطوقة — من الوحدة المولَّدة بقراءةٍ مباشرة لا بتحليلٍ هشّ."""
    src = CURRICULUM.read_text(encoding="utf-8")
    out = []
    for name in ("WORDS", "SENTENCES"):
        block = re.search(rf"export const {name} = (\{{.*?\n\}});", src, re.S)
        if not block:
            sys.exit(f"لم تُقرأ {name} من app/js/curriculum.js")
        for entry in json.loads(block.group(1)).values():
            if entry.get("say"):
                out.append(entry["say"])
    return sorted(set(out))


def bank(read_dir: Path) -> dict:
    """فهرسُ اقرأ مقلوباً: النصُّ ← مفتاحُ ملفّه."""
    have = json.loads((read_dir / "app" / "audio" / "manifest.json").read_text(encoding="utf-8"))
    return {text: key for key, text in have.items()}


def load_manifest() -> dict:
    if not MANIFEST.exists():
        return {}
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def run(read_dir: Path, do_copy: bool) -> int:
    theirs = bank(read_dir)
    texts = wanted()
    have = load_manifest()
    mine = {text: key for key, text in have.items()}

    missing, copied, absent, mismatched = [], [], [], []
    for text in texts:
        key = key_for(text)
        dest = OUT_DIR / f"{key}.mp3"
        if dest.exists():
            if mine.get(text) != key:
                have[key] = text            # ملفٌّ على القرص وفهرسٌ لا يعلنه — يُعلَن
            continue
        their_key = theirs.get(text)
        if not their_key:
            absent.append(text)             # **لا يُخترع صوتٌ**: يُبلَّغ باسمه
            continue
        if their_key != key:
            mismatched.append(text)         # قاعدةُ المفتاح افترقت — عطبٌ لا يُتجاوَز
            continue
        src = read_dir / "app" / "audio" / f"{their_key}.mp3"
        if not src.exists():
            absent.append(text)
            continue
        missing.append((text, src, dest))

    print(f"منطوقُ المنهج: {len(texts)} نصّاً · في بنكنا سلفاً: "
          f"{len(texts) - len(missing) - len(absent) - len(mismatched)} · "
          f"يُنسَخ: {len(missing)} · لا صوتَ له عندهم: {len(absent)}")

    if mismatched:
        print("✗ قاعدةُ المفتاح افترقت بين البنكين — لا يُنسَخ شيء:")
        for text in mismatched[:5]:
            print(f"    «{text}»")
        return 1

    if do_copy:
        for text, src, dest in missing:
            shutil.copy2(src, dest)
            if sha(src) != sha(dest):
                print(f"✗ «{text}»: المنسوخُ ليس عينَ أصله")
                return 1
            have[key_for(text)] = text
            copied.append(text)
        MANIFEST.write_text(json.dumps(have, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"نُسخ {len(copied)} ملفاً ببصماتها، والفهرسُ فيه {len(have)} مدخلاً")
    elif missing:
        print("  (جردٌ فقط — للنسخ: --copy)")

    if absent:
        print(f"⚠ لا صوتَ لها في بنك اقرأ ({len(absent)}) — تُنسَخ بالعين ولا تُملى:")
        for text in absent[:10]:
            print(f"    «{text}»")
    return 0


def self_test(read_dir: Path) -> int:
    """عهدُ النسخ: كلُّ ملفٍّ في بنكنا **عينُ أصله** عندهم، ومفتاحُه من نصّه."""
    fails = 0
    theirs = bank(read_dir)
    have = load_manifest()
    bad_key = [key for key, text in have.items() if key_for(text) != key]
    print(f"  {'✗' if bad_key else '✓'} مفتاحُ كلِّ مدخلٍ من نصّه ({len(have)} مدخلاً)"
          + (f" — منحرف: {len(bad_key)}" if bad_key else ""))
    fails += bool(bad_key)

    orphan = [key for key in have if not (OUT_DIR / f"{key}.mp3").exists()]
    print(f"  {'✗' if orphan else '✓'} ولكلِّ مدخلٍ ملفُّه على القرص"
          + (f" — غائب: {len(orphan)}" if orphan else ""))
    fails += bool(orphan)

    same, differ = 0, []
    for key, text in have.items():
        their_key = theirs.get(text)
        if not their_key:
            continue
        src = read_dir / "app" / "audio" / f"{their_key}.mp3"
        if not src.exists():
            continue
        if sha(src) == sha(OUT_DIR / f"{key}.mp3"):
            same += 1
        else:
            differ.append(text)
    print(f"  {'✗' if differ else '✓'} وما نُسخ من بنكهم عينُ أصله ببصمته ({same} ملفاً)"
          + (f" — مختلف: {len(differ)}" if differ else ""))
    fails += bool(differ)

    print("\n" + (f"{fails} فشل" if fails else "عهدُ النسخ: لا صوتَ وُلد هنا مرّتين"))
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser(description="نسخُ أصوات المنهج من بنك اقرأ ببصماتها")
    ap.add_argument("--read", metavar="PATH", help="موضع تطبيق اقرأ")
    ap.add_argument("--copy", action="store_true", help="ينسخ الناقص ويحدّث الفهرس")
    ap.add_argument("--self-test", action="store_true", help="عهدُ النسخ")
    args = ap.parse_args()
    read_dir = read_root(args.read)
    if args.self_test:
        return self_test(read_dir)
    return run(read_dir, args.copy)


if __name__ == "__main__":
    sys.exit(main())
