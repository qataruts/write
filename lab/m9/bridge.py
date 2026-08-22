# **جسرُ م٩** — صورةٌ ⇒ أثرٌ يفهمه حَكَمُنا، وأثرٌ ⇒ صورةٌ يفهمها النموذج.
#
# **وهو الطرفُ الأثمن في التجربة** (`ENGINE_PLAN §م٩/أ٢`): ما لم يعبر الطرفان
# القناةَ نفسَها، فكلُّ رقمٍ بعده مقارنةُ مسطرتين لا مقارنةُ حَكَمين.
#
# ————— أ) الصورةُ أثراً —————
# نصُّ البند حرفياً: «المكوّناتُ المتصلة في الصورة، كلُّ مكوّنٍ «ضربة» نقاطُها
# بكسلاتُه الداكنة». **وزيادةٌ واحدةٌ لازمة**: بكسلاتُ المكوّن **تُرتَّب مشياً**
# (أقربُ جارٍ من طرف) لا بترتيب المسح — لأنّ `shapeCloud` في المحرّك **يَصِل بين
# كلِّ نقطتين متتاليتين بخطّ**، فترتيبُ المسح يرسم أوتاراً تعبر الحرف عرضاً فتُفسد
# «الدقّة» (`precision`) بحبرٍ لم يكتبه أحد. **والمشيُ يبقي الوصلَ داخل الحبر.**
#
# ————— ب) الأثرُ صورةً —————
# **قناةٌ واحدة**: أثرُ Hijja وأثرُ حصادنا **كلاهما** يُرسم بهذه الدالّة نفسِها —
# فالنموذجُ لا يرى فرقاً في التأطير والحجم بين تدريبه وامتحانه، ويبقى الفرقُ
# الحقيقيَّ وحدَه (قلمٌ/ورق × إصبعٌ/زجاج).

import math

INK = 160          # عتبةُ الحبر في صور Hijja الرمادية (٠ أسودُ · ٢٥٥ أبيض)
CANON = 1000.0     # الصندوقُ المعياريُّ للأثر المشتقّ من صورة
MARGIN = 2         # هامشُ الرسم في إطار ٣٢×٣٢


def ink_pixels(px, w, h, thresh=INK):
    """بكسلاتُ الحبر: [(x, y), …]."""
    return [(x, y) for y in range(h) for x in range(w) if px[x, y] < thresh]


def components(pixels):
    """المكوّناتُ المتصلة (جوارُ الثمانية) — كلُّ مكوّنٍ ضربة."""
    todo = set(pixels)
    out = []
    while todo:
        seed = todo.pop()
        comp = [seed]
        stack = [seed]
        while stack:
            x, y = stack.pop()
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    q = (x + dx, y + dy)
                    if q in todo:
                        todo.discard(q)
                        comp.append(q)
                        stack.append(q)
        out.append(comp)
    return out


def walk(comp):
    """مشيُ المكوّن: من طرفٍ (أعلى-أيسر) بأقرب جارٍ — فالوصلُ يبقى في الحبر."""
    if len(comp) <= 2:
        return list(comp)
    left = sorted(comp, key=lambda p: (p[1], p[0]))
    cur = left[0]
    rest = set(comp)
    rest.discard(cur)
    path = [cur]
    while rest:
        nxt = min(rest, key=lambda q: (q[0] - cur[0]) ** 2 + (q[1] - cur[1]) ** 2)
        rest.discard(nxt)
        path.append(nxt)
        cur = nxt
    return path


def fit(strokes, span=CANON):
    """يُفرَد الحبرُ في صندوقٍ معياريّ **بمقياسٍ واحدٍ للمحورين** — عهدُ النسبة."""
    pts = [p for s in strokes for p in s]
    if not pts:
        return []
    x0 = min(p[0] for p in pts); x1 = max(p[0] for p in pts)
    y0 = min(p[1] for p in pts); y1 = max(p[1] for p in pts)
    w = max(x1 - x0, 1e-6); h = max(y1 - y0, 1e-6)
    k = span / max(w, h)
    cx = (x0 + x1) / 2; cy = (y0 + y1) / 2
    return [[[span / 2 + (p[0] - cx) * k, span / 2 + (p[1] - cy) * k] for p in s]
            for s in strokes]


def image_to_strokes(px, w, h, thresh=INK):
    """صورةٌ ⇒ ضرباتٌ في الصندوق المعياريّ ١٠٠٠×١٠٠٠ (فارغةٌ إن لا حبر)."""
    comps = components(ink_pixels(px, w, h, thresh))
    if not comps:
        return []
    comps.sort(key=len, reverse=True)
    return fit([[[float(x), float(y)] for x, y in walk(c)] for c in comps])


# ————— ب) الأثرُ صورةً: ٣٢×٣٢، حبرٌ بعرضٍ ثابت —————

def raster(strokes, size=32, margin=MARGIN, width=1.1):
    """أثرٌ ⇒ شبكةُ حبرٍ ٣٢×٣٢ (صفر…١) — قناةُ النموذج الوحيدة للطرفين."""
    grid = [[0.0] * size for _ in range(size)]
    pts = [p for s in strokes for p in s]
    if not pts:
        return grid
    x0 = min(p[0] for p in pts); x1 = max(p[0] for p in pts)
    y0 = min(p[1] for p in pts); y1 = max(p[1] for p in pts)
    w = max(x1 - x0, 1e-6); h = max(y1 - y0, 1e-6)
    span = size - 2 * margin - 1
    k = span / max(w, h)
    ox = margin + (span - w * k) / 2 - x0 * k
    oy = margin + (span - h * k) / 2 - y0 * k

    def dab(fx, fy):
        r = width
        for iy in range(max(0, int(fy - r)), min(size, int(fy + r) + 2)):
            for ix in range(max(0, int(fx - r)), min(size, int(fx + r) + 2)):
                d = math.hypot(ix - fx, iy - fy)
                v = max(0.0, min(1.0, (r + 0.5 - d)))
                if v > grid[iy][ix]:
                    grid[iy][ix] = v

    for s in strokes:
        prev = None
        for p in s:
            fx = p[0] * k + ox; fy = p[1] * k + oy
            if prev is None:
                dab(fx, fy)
            else:
                n = max(1, int(math.hypot(fx - prev[0], fy - prev[1]) * 2))
                for i in range(1, n + 1):
                    dab(prev[0] + (fx - prev[0]) * i / n, prev[1] + (fy - prev[1]) * i / n)
            prev = (fx, fy)
    return grid
