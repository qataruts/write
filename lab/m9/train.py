# **تدريبُ الشبكة الصغيرة** — ٢٩ صنفاً على `Hijja`، ٣٢×٣٢.
#
#   python train.py --epochs 20
#
# **ينبض ويستأنف** (عهدُ ١٥ أغسطس): سطرُ تقدّمٍ كلَّ حقبة، ونقطةُ تفتيشٍ تُكتب بعد
# كلِّ حقبة — فإعادةُ التشغيل تُكمل من حيث وقفت ولا تُعيد دقيقةً خضراء. وشبكةُ
# الحبر تُبنى مرّةً وتُخزَّن ببصمة مدخلاتها (`ENGINE_PLAN`: «البناءُ تزايديٌّ بالبصمة»).
#
# **والمدخلُ من الجسر لا من الصورة الخام** — فأثرُ Hijja وأثرُ حصادنا يعبران القناةَ
# نفسَها (`bridge.raster`)، فلا يتعلّم النموذجُ فرقَ تأطيرٍ ويظنّه فرقَ خطّ.

import argparse
import hashlib
import json
import os
import sys
import time

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

import bridge
import hijja

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
CLASSES = hijja.CLASSES
IDX = {c: i for i, c in enumerate(CLASSES)}


class Small(nn.Module):
    """شبكةٌ صغيرة — الهدفُ المعلَن ≈٤٥٠ ألف معامل، ويُطبَع المقيسُ لا المقدَّر."""

    def __init__(self, n=len(CLASSES)):
        super().__init__()
        self.b1 = nn.Sequential(nn.Conv2d(1, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(),
                                nn.Conv2d(32, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(),
                                nn.MaxPool2d(2))                       # 16×16
        self.b2 = nn.Sequential(nn.Conv2d(32, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(),
                                nn.Conv2d(64, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(),
                                nn.MaxPool2d(2))                       # 8×8
        self.b3 = nn.Sequential(nn.Conv2d(64, 128, 3, padding=1), nn.BatchNorm2d(128), nn.ReLU(),
                                nn.MaxPool2d(2))                       # 4×4
        self.head = nn.Sequential(nn.Flatten(), nn.Dropout(0.3),
                                  nn.Linear(128 * 4 * 4, 128), nn.ReLU(),
                                  nn.Linear(128, n))

    def forward(self, x):
        return self.head(self.b3(self.b2(self.b1(x))))


def fingerprint(path, extra):
    h = hashlib.sha256()
    h.update(extra.encode())
    with open(path, 'rb') as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()[:16]


def rasters(traces_path):
    """شبكاتُ الحبر مبنيّةً مرّةً ومخزَّنةً ببصمة مدخلاتها."""
    stamp = fingerprint(traces_path, f'raster-v1-{bridge.MARGIN}')
    cache = os.path.join(OUT, f'rasters-{stamp}.npz')
    if os.path.exists(cache):
        z = np.load(cache, allow_pickle=True)
        print(f'· شبكةُ الحبر من البصمة {stamp}: {len(z["y"])} أثراً', flush=True)
        return z['x'], z['y'], list(z['forms'])
    xs = []; ys = []; forms = []
    t0 = time.time()
    with open(traces_path, encoding='utf-8') as fh:
        lines = fh.readlines()
    for i, line in enumerate(lines, 1):
        t = json.loads(line)
        if not t['strokes']:
            continue
        xs.append(np.array(bridge.raster(t['strokes']), dtype=np.float32))
        ys.append(IDX[t['ch']])
        forms.append(t['form'] or '?')
        if i % 5000 == 0 or i == len(lines):
            print(f'  رسمٌ {i}/{len(lines)} · {i/max(time.time()-t0,1e-9):.0f} أثر/ث', flush=True)
    x = np.stack(xs); y = np.array(ys, dtype=np.int64)
    os.makedirs(OUT, exist_ok=True)
    np.savez_compressed(cache, x=x, y=y, forms=np.array(forms))
    print(f'✓ {cache}', flush=True)
    return x, y, forms


def split(y, forms, frac=0.15, seed=9):
    """قسمةٌ طبقيّةٌ بـ(حرف × شكل) — ورقمُها **مطمئنٌّ كاذب**، يُطبع ولا يُحتكَم إليه."""
    rng = np.random.RandomState(seed)
    test = np.zeros(len(y), dtype=bool)
    buckets = {}
    for i, (c, f) in enumerate(zip(y, forms)):
        buckets.setdefault((int(c), f), []).append(i)
    for idxs in buckets.values():
        pick = rng.choice(idxs, max(1, int(len(idxs) * frac)), replace=False)
        test[pick] = True
    return ~test, test


def augment(x):
    """تشويشٌ لطيف: دورانٌ وإزاحةٌ ومقياس — يدُ طفلٍ لا آلة."""
    n = x.shape[0]
    ang = (torch.rand(n) * 2 - 1) * (12 * np.pi / 180)
    sc = 1 + (torch.rand(n) * 2 - 1) * 0.12
    tx = (torch.rand(n) * 2 - 1) * 0.10
    ty = (torch.rand(n) * 2 - 1) * 0.10
    cos = torch.cos(ang) / sc; sin = torch.sin(ang) / sc
    theta = torch.zeros(n, 2, 3)
    theta[:, 0, 0] = cos; theta[:, 0, 1] = -sin; theta[:, 0, 2] = tx
    theta[:, 1, 0] = sin; theta[:, 1, 1] = cos; theta[:, 1, 2] = ty
    grid = F.affine_grid(theta, x.shape, align_corners=False)
    return F.grid_sample(x, grid, align_corners=False, padding_mode='zeros')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--traces', default=os.path.join(OUT, 'hijja-all.jsonl'))
    ap.add_argument('--epochs', type=int, default=20)
    ap.add_argument('--batch', type=int, default=128)
    ap.add_argument('--lr', type=float, default=1.5e-3)
    ap.add_argument('--ckpt', default=os.path.join(OUT, 'small.pt'))
    args = ap.parse_args()

    torch.manual_seed(9)
    x, y, forms = rasters(args.traces)
    tr, te = split(y, forms)
    xt = torch.from_numpy(x).unsqueeze(1)
    yt = torch.from_numpy(y)
    xtr, ytr = xt[tr], yt[tr]
    xte, yte = xt[te], yt[te]
    print(f'· تدريبٌ {len(ytr)} · قسمةُ Hijja الاختبارية {len(yte)}'
          f' · أصنافٌ {len(CLASSES)}', flush=True)

    model = Small()
    params = sum(p.numel() for p in model.parameters())
    print(f'· المعاملاتُ المقيسة: {params:,}', flush=True)
    opt = torch.optim.Adam(model.parameters(), lr=args.lr)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=args.epochs)
    start = 0
    if os.path.exists(args.ckpt):
        st = torch.load(args.ckpt, map_location='cpu')
        model.load_state_dict(st['model']); opt.load_state_dict(st['opt'])
        sched.load_state_dict(st['sched']); start = st['epoch']
        print(f'· استئنافٌ من الحقبة {start}', flush=True)

    for ep in range(start, args.epochs):
        model.train()
        perm = torch.randperm(len(ytr))
        tot = 0.0; hit = 0; t0 = time.time(); seen = 0
        for i in range(0, len(perm), args.batch):
            idx = perm[i:i + args.batch]
            xb = augment(xtr[idx]); yb = ytr[idx]
            opt.zero_grad()
            out = model(xb)
            loss = F.cross_entropy(out, yb, label_smoothing=0.05)
            loss.backward(); opt.step()
            tot += float(loss) * len(idx); hit += int((out.argmax(1) == yb).sum())
            # **النبضُ داخل الحقبة لا عندها** — فحقبةٌ من سبع دقائق صامتةً عمياء.
            seen += len(idx)
            if seen % (args.batch * 40) == 0:
                done = seen / len(perm)
                el = time.time() - t0
                print(f'    · حقبة {ep+1}: {done*100:.0f}٪ · خسارة {tot/seen:.3f}'
                      f' · {el:.0f}ث مضت · ~{el/max(done,1e-9)-el:.0f}ث بقيت', flush=True)
        sched.step()
        model.eval()
        with torch.no_grad():
            acc = 0
            for i in range(0, len(yte), 512):
                acc += int((model(xte[i:i + 512]).argmax(1) == yte[i:i + 512]).sum())
        torch.save({'model': model.state_dict(), 'opt': opt.state_dict(),
                    'sched': sched.state_dict(), 'epoch': ep + 1,
                    'classes': CLASSES}, args.ckpt)
        print(f'  حقبة {ep+1}/{args.epochs} · خسارة {tot/len(ytr):.3f}'
              f' · تدريبٌ {hit/len(ytr)*100:.1f}٪ · قسمةُ Hijja {acc/len(yte)*100:.1f}٪'
              f' · {time.time()-t0:.0f}ث', flush=True)

    # ————— الحجمُ **مقيسٌ لا محسوب**: عائمٌ من الملفّ، ومكمَّمٌ بثمانِ بتّاتٍ حقيقية —————
    bare = {k: v for k, v in model.state_dict().items()}
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
    size = {'params': params, 'float_bytes': os.path.getsize(fp),
            'int8_bytes': os.path.getsize(qp),
            'hijja_split_acc': acc / len(yte)}
    with open(os.path.join(OUT, 'model-size.json'), 'w') as fh:
        json.dump(size, fh, indent=1)
    print(f'✓ الحجمُ المقيس: عائمٌ {size["float_bytes"]/1e6:.2f} م.ب'
          f' · مكمَّمٌ {size["int8_bytes"]/1e3:.0f} ك.ب', flush=True)
    return 0


if __name__ == '__main__':
    sys.exit(main())
