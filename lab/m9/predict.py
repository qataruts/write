# **حكمُ النموذج على حالات الامتحان** — يقرأ `out/cases.jsonl` (الميدانُ وشهودُ
# الديون والمصنوعُ ومراجعُنا) ويكتب `out/preds.json`.
#
#   python predict.py
#
# **والأثرُ يُرسم بالطريقة نفسِها** التي رُسمت بها آثارُ التدريب (`bridge.raster`) —
# فلا يُقاس النموذجُ على تأطيرٍ لم يرَ مثلَه. **ولا شبكةَ ولا خدمة**: الوزنُ ملفٌّ
# محليّ، والاستدلالُ في هذا الجهاز — كما يقتضي الشرطُ الرابع.

import json
import os
import sys

import torch
import torch.nn.functional as F

import bridge
from train import Small, CLASSES

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')


def main():
    ckpt = torch.load(os.path.join(OUT, 'small.pt'), map_location='cpu')
    model = Small()
    model.load_state_dict(ckpt['model'])
    model.eval()

    cases = [json.loads(l) for l in open(os.path.join(OUT, 'cases.jsonl'), encoding='utf-8')]
    xs = torch.tensor([bridge.raster(c['strokes']) for c in cases]).unsqueeze(1)
    with torch.no_grad():
        p = F.softmax(model(xs), dim=1)
    out = {}
    for c, row in zip(cases, p):
        order = torch.argsort(row, descending=True)
        out[c['id']] = {
            'top': CLASSES[int(order[0])],
            'conf': float(row[order[0]]),
            'target': c['ch'],
            'target_p': float(row[CLASSES.index(c['ch'])]) if c['ch'] in CLASSES else 0.0,
            'top3': [[CLASSES[int(i)], round(float(row[i]), 3)] for i in order[:3]],
        }
    path = os.path.join(OUT, 'preds.json')
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump({'epoch': ckpt['epoch'], 'byId': out}, fh, ensure_ascii=False, indent=1)
    print(f'✓ {path} · {len(out)} حالة · من الحقبة {ckpt["epoch"]}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
