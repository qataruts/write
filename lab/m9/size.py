# **الحجمُ والزمنُ مقيسان لا محسوبان** (الشرطُ الرابع) — من أيّ نقطة تفتيش.
#
#   python size.py
#
# **والتكميمُ حقيقيٌّ لا تقدير**: كلُّ موتّرٍ يُقاس بمقياسه الخاصّ ويُخزَّن ثمانِ
# بتّات، ثم **يُقاس الملفُّ على القرص** — فالرقمُ ما يزنه الملفُّ لا ما تقوله معادلة.

import json
import os
import time

import torch

from train import Small

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')

ck = torch.load(os.path.join(OUT, 'small.pt'), map_location='cpu')
model = Small()
model.load_state_dict(ck['model'])
model.eval()
params = sum(p.numel() for p in model.parameters())

bare = model.state_dict()
fp = os.path.join(OUT, 'small-float.pt')
torch.save(bare, fp)
q = {}
for k, v in bare.items():
    if v.dtype == torch.float32 and v.numel() > 64:
        s = float(v.abs().max()) / 127.0 or 1.0
        q[k] = (torch.round(v / s).to(torch.int8), s)
    else:
        q[k] = v
qp = os.path.join(OUT, 'small-int8.pt')
torch.save(q, qp)

# زمنُ حكمٍ واحد — أثرٌ واحدٌ لا دفعة، فذاك حالُ الطفل على اللوح.
x = torch.rand(1, 1, 32, 32)
with torch.no_grad():
    for _ in range(20):
        model(x)
    t0 = time.time()
    for _ in range(200):
        model(x)
    per = (time.time() - t0) / 200

info = {
    'epoch': ck['epoch'],
    'params': params,
    'float_bytes': os.path.getsize(fp),
    'int8_bytes': os.path.getsize(qp),
    'ms_per_judgement': round(per * 1000, 2),
    'threads': torch.get_num_threads(),
}
with open(os.path.join(OUT, 'model-size.json'), 'w') as fh:
    json.dump(info, fh, indent=1)
print(json.dumps(info, indent=1))
print(f'عائمٌ {info["float_bytes"]/1e6:.2f} م.ب · مكمَّمٌ {info["int8_bytes"]/1e3:.0f} ك.ب'
      f' · حكمٌ واحد {info["ms_per_judgement"]:.2f} م.ث')
