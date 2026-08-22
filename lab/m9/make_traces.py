# **صانعُ الآثار** — صورُ Hijja ⇒ ملفُّ آثارٍ سطراً سطراً (`.jsonl`).
#
#   python make_traces.py --per 60 --out out/hijja-sample.jsonl     # عيّنةٌ ممثِّلة
#   python make_traces.py --all  --out out/hijja-all.jsonl          # الكلّ
#
# **ينبض ويستأنف** (عهد ١٥ أغسطس): سطرُ تقدّمٍ كلَّ ٥٠٠ صورة، والملفُّ يُلحَق به —
# فإعادةُ التشغيل تقرأ ما تمّ وتتخطّاه، ولا تُعاد دقيقةٌ خضراء.

import argparse
import json
import os
import sys
import time

from PIL import Image

import bridge
import hijja

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, 'data', 'Hijja2')


def done_ids(path):
    got = set()
    if os.path.exists(path):
        with open(path, encoding='utf-8') as fh:
            for line in fh:
                try:
                    got.add(json.loads(line)['id'])
                except Exception:
                    pass
    return got


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--per', type=int, default=60, help='صورةً لكلِّ (حرف × شكل)')
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--out', default='out/hijja-sample.jsonl')
    ap.add_argument('--root', default=ROOT)
    args = ap.parse_args()

    rows = hijja.index(args.root)
    if not args.all:
        rows = hijja.sample(rows, args.per)
    out = os.path.join(HERE, args.out) if not os.path.isabs(args.out) else args.out
    os.makedirs(os.path.dirname(out), exist_ok=True)
    got = done_ids(out)
    todo = [r for r in rows if r[3] not in got]
    print(f'· الصور: {len(rows)} · تمّ سابقاً: {len(got)} · الباقي: {len(todo)}', flush=True)

    t0 = time.time()
    empty = 0
    with open(out, 'a', encoding='utf-8') as fh:
        for i, (path, letter, form, ident) in enumerate(todo, 1):
            im = Image.open(path).convert('L')
            w, h = im.size
            strokes = bridge.image_to_strokes(im.load(), w, h)
            if not strokes:
                empty += 1
            fh.write(json.dumps({
                'id': ident, 'ch': letter, 'form': form, 'src': 'hijja',
                'strokes': [[[round(p[0], 1), round(p[1], 1)] for p in s] for s in strokes],
            }, ensure_ascii=False) + '\n')
            if i % 500 == 0 or i == len(todo):
                fh.flush()
                rate = i / max(time.time() - t0, 1e-9)
                left = (len(todo) - i) / max(rate, 1e-9)
                print(f'  {i}/{len(todo)} · {rate:.0f} صورة/ث · بقي ~{left/60:.1f} د',
                      flush=True)
    print(f'✓ {out} · بلا حبر: {empty}', flush=True)
    return 0


if __name__ == '__main__':
    sys.exit(main())
