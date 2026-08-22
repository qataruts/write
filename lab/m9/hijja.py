# **فهرسُ Hijja** — مجلّدٌ ⇒ (حرفٌ · شكلُ موقع)، وعيّنةٌ ممثِّلةٌ بحصّةٍ ثابتة.
#
# **والشكلُ مقروءٌ من الصور لا مظنون** (تُثبته عينٌ على «ع»): `18.1` معزولةٌ بذيلها ·
# `18.2` ابتدائيةٌ برأسٍ ووصلةٍ يسرى · `18.3` وسطيّةٌ بوصلتين · `18.4` نهائيةٌ بذيلٍ
# ووصلةٍ يمنى. ⇐ **`.1` معزول · `.2` ابتدائي · `.3` وسطي · `.4` نهائي**.
#
# **وغيرُ الموصولةِ آخِرَها** (ا د ذ ر ز و) مجلّدان: `.1` معزول و`.2` نهائي.
# **وما زاد على ذلك** (ألفُ الهمزات الستّة · الهمزةُ بأربعة) **شكلُه غيرُ معروفٍ
# عندنا**، فيدخل تدريبَ المصنِّف بحرفه **ويخرج من مصفوفة الأخوات** — فالمصفوفةُ
# تحتاج شكلاً مسمّى بمرجعٍ نظير. **ولا يُخمَّن شكلٌ ليُبنى عليه حكم.**

import os

LETTERS = {
    '1 alif': 'ا', '2 ba': 'ب', '3 ta': 'ت', '4 tha': 'ث', '5 gim': 'ج',
    '6 ha': 'ح', '7 kha': 'خ', '8 dal': 'د', '9 thal': 'ذ', '10 ra': 'ر',
    '11 zay': 'ز', '12 sin': 'س', '13 shin': 'ش', '14 sad': 'ص', '15 dad': 'ض',
    '16 da': 'ط', '17 za': 'ظ', '18 ayn': 'ع', '19 gayn': 'غ', '20 fa': 'ف',
    '21 qaf': 'ق', '22 kaf': 'ك', '23 lam': 'ل', '24 mim': 'م', '25 non': 'ن',
    '26 ha': 'ه', '27 waw': 'و', '28 ya': 'ي', '29 hamza': 'ء',
}

FORMS = {1: 'isolated', 2: 'initial', 3: 'medial', 4: 'final'}
NO_BACK = set('ادذرزو')          # لا توصل آخرَها: مجلّدان لا أربعة
CLASSES = [LETTERS[k] for k in sorted(LETTERS, key=lambda s: int(s.split()[0]))]

# أسرُ الأخوات — منقولةٌ بعينها من `tools/test_shape.mjs §٢`، ولا تُعاد صياغتُها.
FAMILIES = [['ب', 'ت', 'ث', 'ن', 'ي'], ['ج', 'ح', 'خ'], ['د', 'ذ'], ['ر', 'ز'],
            ['ط', 'ظ'], ['ص', 'ض'], ['ع', 'غ'], ['س', 'ش'], ['ف', 'ق']]
SISTER_OF = {a: [b for b in fam if b != a] for fam in FAMILIES for a in fam}


def form_of(letter, sub):
    """اسمُ الشكل من رقم المجلّد الفرعيّ (`2.3` ⇒ وسطيّ) — أو None إن لم يُعرف."""
    try:
        n = int(str(sub).split('.')[1])
    except (IndexError, ValueError):
        return None
    if letter in NO_BACK:
        return {1: 'isolated', 2: 'final'}.get(n)
    return FORMS.get(n)


def index(root):
    """كلُّ صور المجموعة: [(المسار، الحرف، الشكل أو None، معرِّف)]."""
    rows = []
    for folder in sorted(LETTERS, key=lambda s: int(s.split()[0])):
        letter = LETTERS[folder]
        base = os.path.join(root, folder)
        if not os.path.isdir(base):
            continue
        for sub in sorted(os.listdir(base)):
            if not os.path.isdir(os.path.join(base, sub)):
                continue
            form = form_of(letter, sub)
            for name in sorted(os.listdir(os.path.join(base, sub))):
                if not name.lower().endswith('.png'):
                    continue
                rows.append((os.path.join(base, sub, name), letter, form,
                             f'{sub}/{name[:-4]}'))
    return rows


def sample(rows, per_bucket, seed=9):
    """عيّنةٌ ممثِّلة: حصّةٌ متساويةٌ من كلِّ (حرف × شكل)، باختيارٍ ثابتِ البذرة."""
    import random
    rng = random.Random(seed)
    buckets = {}
    for r in rows:
        buckets.setdefault((r[1], r[2]), []).append(r)
    out = []
    for key in sorted(buckets, key=lambda k: (k[0], str(k[1]))):
        got = buckets[key]
        out.extend(got if len(got) <= per_bucket else rng.sample(got, per_bucket))
    return out
