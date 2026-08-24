#!/usr/bin/env python3
"""✍️ **طبقةُ الكيفية** — الضرباتُ والمبادئ ومواضعُ رفع القلم (بند ك٣).

    python3 tools/hand_layer.py --build      # يجمع أضلاعَ الهيكل ضرباتٍ ⇐ tools/hand_layer.json
    python3 tools/hand_layer.py --self-test  # حرّاسُ الكيفية بلا متصفّح
    python3 tools/hand_layer.py --panel      # لوحةُ المقابلة: يدُ المالك ⇐ ضرباتُنا

## السند — حكمُ المالك على لوحة ك٢ (٢٤–٢٥ أغسطس ٢٠٢٦)

> «أشكالُ الحروف والكلمات صحيحة، لكن موقعَ بداية الكتابة أو البدء بعد رفع القلم
> غير دقيقة — يرجى مراجعةُ ما كتبته أنا بيدي لتعلم أين البدء وأين الوقف ورفعُ
> القلم والبدءُ من جديد».
> «يمكن للضربات في الكلمات أن تكون **أقلَّ** من ضرباتي لا مشكلة **لكن ليس أكثر**»
> · «الوقفُ عادةً عند الحروف المقطوعة بطبيعة الحال، **فالقطعُ في الكلمات يذهب
> للحدّ الأدنى ما كان ذلك ممكناً** — أي على الأغلب عند حروف الانقطاع د ز ر و».

⇐ **ثلاثةُ أحكامٍ تولّد كلَّ ما هنا**:

١) **الشكلُ من الفونت** (بند ك٢، مقبولٌ بعينه) — لا يُمَسّ هنا حرفٌ ولا نقطة.
٢) **القطعُ إلى أدناه**: أقلُّ عددِ ضرباتٍ يغطّي أضلاعَ الجسم كلَّها بلا إعادة
   رسمٍ — وهو `max(1, عددُ العقد الفردية ÷ ٢)` في نظرية المسارات (أويلر). فلا
   ترفع اليدُ قلمَها إلا حيث يوجب البناءُ رفعَه.
٣) **يدُ المالك سقفٌ لا أرضية**: ضرباتُنا في كلمةٍ كتبها بيده **لا تزيد** على
   ضرباته، وقد تنقص. ومبدأُ كلِّ ضربةٍ واتجاهُها **يُؤخذان من أثره** حيث وُجد
   (`tools/owner_shapes.json`: ٢٨ حرفاً × ٤ مواضع، وخمسُ كلماتٍ بخطّه).

## كيف تُجمَع الضربة

أضلاعُ الهيكل عقدٌ وحوافُّ (`font_layer.json §pieces`). فلكلِّ جسمٍ رسمٌ بيانيّ:
تُوحَّد أطرافُ الحوافّ عقداً، ثم يُمشى **مشيَ أويلر** من عقدة البداية، **ويُفضَّل
عند التقاطع أقلُّ انعطافاً** — فتخرج الضربةُ كما تخرج من يدٍ تكتب لا كما تخرج من
خوارزمية. وما بقي من حوافَّ يبدأ ضربةً جديدة (رفعُ قلم) — وعددُها هو الأدنى
الممكن بحكم البناء لا باختيارنا.

**ولا إحداثيّ يُكتب بيد**: كلُّ رقمٍ هنا محسوبٌ من الهيكل أو مقيسٌ من أثر المالك.
"""

import argparse
import html
import json
import math
import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
SRC = TOOLS / "font_layer.json"
HAND = TOOLS / "owner_shapes.json"
OUT = TOOLS / "hand_layer.json"
PANEL = TOOLS / "hand_panel.html"

# **حروفُ الانقطاع** — لا تصل بما بعدها فيرفع القلمُ بعدها بطبيعة الرسم (نصُّ المالك).
CUTTERS = set("اآأإدذرزوةى")
FORM_AR = {"isolated": "معزول", "initial": "ابتدائي", "medial": "وسطي", "final": "نهائي"}


# ————— رسمُ الجسم البيانيّ —————

def graph_of(pieces: list, tol: float = 25.0) -> tuple:
    """يعيد (العقد ⇐ حوافُّها، الحوافُّ) لجسمٍ واحد.

    ⚠ **وأطرافُ الأضلاع متجاورةٌ لا متطابقة**: التنحيفُ يخرج عُقَدَه بفروقِ وحدةٍ
    إلى بضعَ عشرةَ (قِيس في «درس»: فجواتُ ١١ و١٦ و١٨ داخلَ حبرٍ واحد) — فالتقريبُ
    الضيّق يفكّك الرسمَ ويترك أكثرَه بلا مشي. ⇐ **والتجاورُ يُقاس من القلم نفسِه**
    (`tol` = رُبعُ عرض ساق الألف حبراً): دونَه أثرُ تنحيفٍ، وفوقَه قد يكون انفصالاً
    — **ولا خطرَ في السخاء** لأنّ انفصالَ الحبر الحقيقيَّ مفصولٌ أصلاً بالأجسام.
    """
    spots = []          # مراكزُ العقد الممسوكة

    def node_key(p):
        for k, c in enumerate(spots):
            if abs(c[0] - p[0]) <= tol and abs(c[1] - p[1]) <= tol:
                return k
        spots.append([p[0], p[1]])
        return len(spots) - 1

    nodes = {}
    edges = []
    for piece in pieces:
        pts = piece["p"]
        a, b = node_key(pts[0]), node_key(pts[-1])
        idx = len(edges)
        edges.append({"a": a, "b": b, "p": pts, "used": False})
        nodes.setdefault(a, []).append(idx)
        nodes.setdefault(b, []).append(idx)
    return nodes, edges, spots


def heading(pts: list, at_start: bool) -> float:
    """زاويةُ خروج الضلع من طرفه — تُقاس على أوّل ما يُقاس به الانعطاف."""
    if at_start:
        a, b = pts[0], pts[min(3, len(pts) - 1)]
    else:
        a, b = pts[-1], pts[max(-4, -len(pts))]
    return math.atan2(b[1] - a[1], b[0] - a[0])


def turn(prev: float, nxt: float) -> float:
    """فرقُ الاتجاه [٠..π] — الأقلُّ أشبهُ بمضيّ اليد."""
    d = abs((nxt - prev + math.pi) % (2 * math.pi) - math.pi)
    return d


def walk(nodes: dict, edges: list, spots: list, start: int) -> list:
    """يعيد أقلَّ ما يمكن من ضربات تغطّي أضلاعَ الجسم كلَّها.

    **والحدُّ الأدنى ليس رجاءً بل نظرية**: رسمٌ بيانيٌّ متّصلٌ فيه `k` عقدةً فردية
    يُغطّى بـ`max(1, k/2)` مسارات. فتُزاوَج العقدُ الفردية **بحوافَّ افتراضية**
    (رفعُ قلمٍ معلَنٌ) فيصير الكلُّ زوجيّاً وله دورةُ أويلر، ثم **تُقطَع الدورةُ
    عند الافتراضيات** فتخرج المسارات بعددها الأدنى بعينه.

    ⚠ **والمشيُ الجشِع وحدَه يترك حوافَّ يتيمة** (قِيس: ٥٩٢ وحدةً من ٨٥٩ تجاوزت
    الأدنى) — فالمعتمَدُ **هيرهولزر** بالتراجع والدمج، والتفضيلُ (أقلُّ انعطاف)
    يبقى داخلَه فلا يفسد الصحّةَ ويُحسّن الشكل.
    """
    left = {i for i, e in enumerate(edges)}
    if not left:
        return []
    # **والجسمُ الواحد قد يخرج مكوّنين**: التنحيفُ يقطع وصلةً رفيعةً أحياناً فيبقى
    # الحبرُ واحداً والرسمُ اثنين (قِيس: «س» ٦+٧ عقدة · «ه» ٩+٣) — **فيُمشى كلُّ
    # مكوّنٍ على حدة** وتُرتَّب مكوّناتُه من أيمنِها، وإلا بقي نصفُ الحرف بلا ضربة.
    parts = []
    seen = set()
    for n in nodes:
        if n in seen:
            continue
        stack, comp = [n], set()
        seen.add(n)
        while stack:
            v = stack.pop()
            comp.add(v)
            for i in nodes[v]:
                for w in (edges[i]["a"], edges[i]["b"]):
                    if w not in seen:
                        seen.add(w)
                        stack.append(w)
        parts.append(comp)
    if len(parts) > 1:
        parts.sort(key=lambda c: -max(spots[n][0] for n in c))
        out = []
        for comp in parts:
            sub_nodes = {n: [i for i in nodes[n] if edges[i]["a"] in comp and edges[i]["b"] in comp]
                         for n in comp}
            ids = sorted({i for es in sub_nodes.values() for i in es})
            remap = {old_i: k for k, old_i in enumerate(ids)}
            sub_edges = [dict(edges[i]) for i in ids]
            sub_nodes = {n: [remap[i] for i in es] for n, es in sub_nodes.items()}
            head = start if start in comp else max(comp, key=lambda n: (spots[n][0], -spots[n][1]))
            out.extend(walk(sub_nodes, sub_edges, spots, head))
        return out
    # 🔴 **واليدُ ترجع على أثرها ولا ترفع** (حكمُ المالك ٢٥ أغسطس: «القطعُ يذهب
    # للحدّ الأدنى ما كان ذلك ممكناً»، وأثرُه شاهد: «محفظة» بضربةٍ واحدة وفيها
    # أسنانٌ وعمودُ ظاء): فمن يكتب سنّاً يصعدها **وينزل على أثرها**، ولا يقطع.
    # ⇐ فالحدُّ ليس أويلر (الذي يمنع الرجوع فيفرض رفعاً) بل **ساعي البريد**:
    # تُزاوَج العقدُ الفردية بأقصر الطرق **وتُضاعَف حوافُّها** — فيصير للرسم مسارٌ
    # واحدٌ يغطّي الكلَّ بأقلِّ رجوعٍ ممكن. **فرفعُ القلم = انفصالُ الحبر وحدَه**،
    # وهو عينُ قاعدة المالك: القطعُ عند حروف الانقطاع وما انفصل رسمُه (كالهمزة).
    def edge_len(e):
        return sum(math.dist(e["p"][k], e["p"][k + 1]) for k in range(len(e["p"]) - 1))

    def shortest(src: int, dst: int) -> list:
        """أقصرُ طريقٍ بالحوافّ بين عقدتين — لتضعيفه لا لقطعه."""
        far = {src: 0.0}
        back = {}
        pool = {src}
        while pool:
            v = min(pool, key=lambda n: far[n])
            pool.discard(v)
            if v == dst:
                break
            for i in nodes.get(v, []):
                e = edges[i]
                w = e["b"] if e["a"] == v else e["a"]
                step = far[v] + edge_len(e)
                if step < far.get(w, float("inf")):
                    far[w] = step
                    back[w] = (v, i)
                    pool.add(w)
        path, cur = [], dst
        while cur != src and cur in back:
            prev, i = back[cur]
            path.append(i)
            cur = prev
        return path

    deg = {n: len([i for i in es if i in left]) for n, es in nodes.items()}
    odd = sorted([n for n, d in deg.items() if d % 2 == 1],
                 key=lambda n: (-spots[n][0], spots[n][1]))
    # **مبدأُ اليد طرفٌ، ومنتهاها أيسرُ فردية** — فيبقيان فرديّين ويُزاوَج ما بينهما.
    # 🔴 **والمبدأُ المطلوبُ يُحترَم دائماً** (عطبٌ أمسكه المالك ثلاث مرّات: «خي في
    # أخي تبدأ من المنتصف»): كان المشيُ يُبدل المبدأَ بأوّل عقدةٍ فردية إن لم تكن
    # عقدةُ المبدأ فردية — **فيضيع الحكمُ كلُّه**. ⇐ إن كانت فرديةً بقيت طرفاً
    # وزُوّج ما سواها، **وإن كانت زوجيةً زُوّجت الفردياتُ كلُّها** فيصير للرسم دورةٌ
    # مغلقةٌ **تبدأ حيث شئنا** — والمبدأُ محفوظٌ في الحالين.
    free = []
    if odd:
        if start in odd:
            head = start
            odd.remove(head)
            tail = min(odd, key=lambda n: (spots[n][0], -spots[n][1])) if odd else None
            if tail is not None:
                odd.remove(tail)
            free = [head] + ([tail] if tail is not None else [])
    while len(odd) >= 2:
        a = odd.pop(0)
        b = min(odd, key=lambda n: math.dist(spots[a], spots[n]))
        odd.remove(b)
        for i in shortest(a, b):
            e = edges[i]
            idx = len(edges)
            edges.append({"a": e["a"], "b": e["b"], "p": e["p"], "twin": True})
            nodes.setdefault(e["a"], []).append(idx)
            nodes.setdefault(e["b"], []).append(idx)
            left.add(idx)

    begin = start if start in nodes else (
        free[0] if free else max(nodes, key=lambda n: (spots[n][0], -spots[n][1])))
    # **هيرهولزر على الحوافّ نفسِها** (لا على العقد): تُمشى دويرةٌ حتى الوقوف، ثم
    # يُبحث في خطواتها عن عقدةٍ بقيت لها حوافٌّ **فتُدمَج دويرتُها في موضعها** —
    # فلا حافٌّ تُترَك ولا يُخترَع رفعٌ.
    prev_dir = {}

    def run_from(v: int) -> list:
        seg = []
        cur = v
        while True:
            cand = [i for i in nodes.get(cur, []) if i in left]
            if not cand:
                return seg
            def cost(i):
                e = edges[i]
                h = heading(e["p"], e["a"] == cur)
                d = prev_dir.get(cur)
                # **الاستمرارُ أولى، والرجوعُ على الأثر آخِرُ ما يُختار**.
                bend = 0.0 if d is None else round(turn(d, h), 3)
                return (1 if e.get("twin") else 0, bend, -len(e["p"]))
            i = min(cand, key=cost)
            e = edges[i]
            left.discard(i)
            nxt = e["b"] if e["a"] == cur else e["a"]
            run = e["p"] if e["a"] == cur else list(reversed(e["p"]))
            tail_pt = run[max(-4, -len(run))]
            prev_dir[nxt] = math.atan2(run[-1][1] - tail_pt[1], run[-1][0] - tail_pt[0])
            seg.append((i, cur))
            cur = nxt

    seq = run_from(begin)
    k = 0
    while k < len(seq):
        at = seq[k][1]
        if any(i in left for i in nodes.get(at, [])):
            seq[k:k] = run_from(at)
        else:
            k += 1

    path = []
    for i, frm in seq:
        e = edges[i]
        pts = e["p"] if e["a"] == frm else list(reversed(e["p"]))
        path.extend(pts if not path else pts[1:])
    return [path] if len(path) > 1 else []


def strip_lead(pieces: list, pen: float) -> int:
    """🔴 **تُقتلَع شرطةُ الوصل من مبدأ الوصلة** (حكمُ المالك ٢٥ أغسطس ٢٠٢٦:
    «أرى شرطةً قبل الجيم في الدراجة؟؟» · «انظر إلى كتابتك بيدك، هل هناك شرطة؟»
    · «حلّ المشكلة من جذرها»).

    **العلّةُ مقيسة**: خطوطُ النسخ ترسم لحرف الابتداء من أسرة (ج ح خ) وغيرِها
    **شريطاً أفقيّاً داخلاً من يمينه** — مدخلَ وصلٍ لا يصل شيئاً حين يفتح الحرفُ
    كلاماً. قِيس في «أخي»: قطعةٌ من (10148,758) إلى (10023,761) زواياها ١٨٠°
    كلُّها، طولُها ١٢٥ وحدة. **وخطُّ يد المالك لا شرطةَ فيه**، فتُقتلَع.

    ⇐ يُمشى من أيمن طرفٍ حرٍّ ما دام المسارُ أفقيّاً (±٢٠°)، فتُحذف تلك النقاط.
    **ولا يُمَسّ وصلٌ حقيقيّ**: هذا لا يجري إلا على **الجسم الذي يفتح وصلة** —
    وما بين حرفين موصولين داخلَ الوصلة لا يُقارَب.
    """
    if not pieces:
        return 0
    cut = 0
    for _ in range(4):          # قد يتلوها شريطٌ آخر — يُقتلَع حتى ينتهي المدخل
        if len(pieces) < 2:
            break
        x1 = max(q[0] for pc in pieces for q in pc["p"])
        bar = None
        for pc in pieces:
            xs = [q[0] for q in pc["p"]]
            ys = [q[1] for q in pc["p"]]
            wide = max(xs) - min(xs)
            tall = max(ys) - min(ys)
            # **الشريطُ يُعرَف بقياسه**: يلمس أيمنَ الوصلة، ويمتدّ عرضاً نصفَ القلم
            # فأكثر، وارتفاعُه دون خُمسه — فهو خطٌّ أفقيٌّ لا جزءٌ من رسم الحرف.
            if max(xs) >= x1 - pen * 0.25 and wide >= pen * 0.5 and tall <= pen * 0.2:
                bar = pc
                break
        if not bar:
            break
        pieces.remove(bar)
        cut += len(bar["p"])
    return cut


def bridge(nodes: dict, edges: list, spots: list) -> int:
    """يصل مكوّنات الجسم الواحد بقنطرةٍ مستقيمة — **لأنّ حبرَه واحد**.

    الجسمُ مكوّنُ حبرٍ واحدٌ بحكم الحصاد، فأيُّ انفصالٍ في رسمه البيانيّ **أثرُ
    تنحيفٍ لا رفعُ قلم**. والقنطرةُ تمرّ داخلَ الحبر نفسِه فلا تخترع خطّاً.
    """
    made = 0
    while True:
        seen, comps = set(), []
        for n in nodes:
            if n in seen:
                continue
            stack, comp = [n], set()
            seen.add(n)
            while stack:
                v = stack.pop()
                comp.add(v)
                for i in nodes[v]:
                    for w in (edges[i]["a"], edges[i]["b"]):
                        if w not in seen:
                            seen.add(w)
                            stack.append(w)
            comps.append(comp)
        if len(comps) < 2:
            return made
        comps.sort(key=lambda c: -max(spots[n][0] for n in c))
        a, b = comps[0], comps[1]
        _, x, y = min((math.dist(spots[p], spots[q]), p, q) for p in a for q in b)
        idx = len(edges)
        edges.append({"a": x, "b": y, "p": [list(spots[x]), list(spots[y])], "bridge": True})
        nodes.setdefault(x, []).append(idx)
        nodes.setdefault(y, []).append(idx)
        made += 1


def min_strokes(nodes: dict, edges: list) -> int:
    """الحدُّ الأدنى النظريّ لعدد الضربات (أويلر) — يُحسب ولا يُكتب."""
    odd = sum(1 for n, es in nodes.items() if len(es) % 2 == 1)
    return max(1, odd // 2)


# ————— أثرُ المالك مرجعاً للمبدأ والاتجاه —————

def hand_book() -> dict:
    if not HAND.exists():
        return {}
    return json.loads(HAND.read_text(encoding="utf-8"))


def bbox(points: list) -> tuple:
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return min(xs), min(ys), max(xs), max(ys)


def to_frame(points: list, src: tuple, dst: tuple) -> list:
    """نقلُ نقاطٍ من صندوقٍ إلى صندوق — لمقابلة أثر المالك بهيكلنا لا لتغييره."""
    sx0, sy0, sx1, sy1 = src
    dx0, dy0, dx1, dy1 = dst
    sw = max(sx1 - sx0, 1e-6)
    sh = max(sy1 - sy0, 1e-6)
    return [[dx0 + (p[0] - sx0) / sw * (dx1 - dx0),
             dy0 + (p[1] - sy0) / sh * (dy1 - dy0)] for p in points]


def hand_start(book: dict, ch: str, form: str) -> list:
    """مبدأُ أوّلِ ضربةٍ بيده لهذا الشكل — بإحداثيات أثره."""
    row = (book.get("letters") or {}).get(ch, {}).get(form)
    if not row or not row.get("strokes"):
        return None
    return row["strokes"][0][0]


def hand_strokes(book: dict, ch: str, form: str) -> list:
    row = (book.get("letters") or {}).get(ch, {}).get(form)
    return row["strokes"] if row and row.get("strokes") else None


# ————— جمعُ الضربات لوحدةٍ —————

def pen_of(payload: dict) -> float:
    """**قلمُ الخطّ مقيسٌ لا مكتوب**: عرضُ ساق الألف حبراً — به تُقاس كلُّ حدود
    هذه الطبقة (تجاورُ العُقَد، وما يُعدّ رجوعاً على الأثر)."""
    alef = next((u for u in payload["units"] if u["name"] == "ا/isolated"), None)
    if not alef or not alef.get("bboxes"):
        return 100.0
    return abs(alef["bboxes"][0][0] - alef["bboxes"][0][2])


def assemble_unit(unit: dict, book: dict, tol: float = 25.0, letters_map: dict = None) -> dict:
    """يعيد الوحدةَ ومعها `strokes` — ضرباتٌ بترتيبها ومبادئها ورفعُ قلمها."""
    letters_map = letters_map or {}
    by_body = {}
    for piece in unit["pieces"]:
        by_body.setdefault(piece["body"], []).append(piece)
    # **الأجسامُ من أيمنِها**: العربيةُ تُكتب يميناً فيساراً، والجسمُ الأيمنُ أوّلاً.
    box_of = {}
    for b, pcs in by_body.items():
        xs = [p[0] for pc in pcs for p in pc["p"]]
        ys = [p[1] for pc in pcs for p in pc["p"]]
        box_of[b] = (min(xs), min(ys), max(xs), max(ys))
    order = sorted(by_body, key=lambda b: -box_of[b][2])

    # 🔴 **والعلامةُ بعد حاملها لا قبلَه** (حكمُ المالك ٢٥ أغسطس ٢٠٢٦: «الهمزةُ فوق
    # الألف وليست قبلها — أقصد بترتيب الضربات: الألفُ أوّلاً ثم الهمزة»). ⇐ جسمٌ
    # صغيرٌ **يعلو مدى جسمٍ آخر أفقياً** علامتُه: شولةُ الكاف وهمزةُ الألف وما
    # جرى مجراهما — **يُؤخَّر إلى ما بعد حامله** مهما كان أيمنَ منه.
    carrier = {}
    for m in list(order):
        mx0, my0, mx1, my1 = box_of[m]
        for c in order:
            if c == m:
                continue
            cx0, cy0, cx1, cy1 = box_of[c]
            # **ومدى الحامل يُوسَّع بعرض القلم**: هيكلُ ساق الألف خيطٌ عرضُه ١٠
            # وحدات والهمزةُ فوقه ٩٥ — فالتقاطعُ الخام يكذب، والحقيقةُ أنّها فوقه.
            reach = tol * 4
            centre = (mx0 + mx1) / 2
            span = (mx1 - mx0) if (cx0 - reach) <= centre <= (cx1 + reach) else -1
            # **والعلامةُ تُعرَف بقِصَرها لا بمساحتها**: همزةُ الألف أعرضُ من ساقه
            # فمساحتُها تقاربه — وارتفاعُها نصفُه (٢٧٥ من ٦١٤) وهي فوقه.
            smaller = (my1 - my0) < (cy1 - cy0) * 0.6
            if span > (mx1 - mx0) * 0.5 and smaller and my1 <= cy0 + (cy1 - cy0) * 0.5:
                carrier[m] = c
                break
    ranked = []
    for b in order:
        if b in carrier:
            continue
        ranked.append(b)
        ranked.extend(m for m in order if carrier.get(m) == b)
    ranked.extend(b for b in order if b not in ranked)
    order = ranked

    hand = None
    if unit["kind"] == "letter":
        hand = hand_strokes(book, unit["text"], unit["form"])

    # 🔴 **قاعدةُ المالك — نصُّها الجامع** (٢٥ أغسطس ٢٠٢٦، بعد ثلاث تصحيحاتٍ متتابعة):
    #
    #     «حين يأتي حرفٌ غيرُ موصول، فإنّ الحرف الذي بعده **يتحوّل إلى حرف أوّلِ
    #      الكلمة** إذا كان في المنتصف، **وحرفٍ مستقلّ** إذا كان في الآخِر».
    #
    # **وتحوُّلُه تحوُّلٌ تامّ: شكلاً ومبدأً معاً** — فخاءُ «أخي» وخاءُ «أختي» كلتاهما
    # خاءُ أوّلِ الكلمة **تبدآن من فوق** كما تبدأ مبتدَأةً في طريقة المالك.
    # **وما يسبقه موصولٌ لا يُمَسّ**: خاءُ الوسط تبدأ من اليمين كما كانت.
    # ⚠ وقد أخطأتِ الإدارةُ فهمَها مرّةً فردّت المبادئَ كلَّها إلى اليمين — فصحّح
    # المالكُ: «الخاءُ في أخي وأختي هي خاءُ أوّلِ الكلمة تبدأ كما تبدأ الخاءُ أوّلَ
    # الكلمة من فوق». **فهذا هو المعتمَد، ولا يُجتهَد فيه بعد اليوم.**
    #
    # ومبدأُ كلِّ جسمٍ مبدأُ حرفه الأوّل (حكمُ المالك ٢٥ أغسطس ٢٠٢٦ على
    # «أخي»: «الضربةُ تبدأ من بداية الخاء فوق وليس على اليمين — فالخاءُ هنا أوّلُ
    # الكلام لأنّ الحرف الذي قبلها غير موصول. عمّم هذا»). ⇐ **الجسمُ وصلةٌ
    # مستقلّة**، وأوّلُ حرفٍ فيها يُكتب كما يُكتب مبتدَأً: من مبدئه هو (رأسُ الخاء
    # فوق) لا من أيمنِ حبر الوصلة. ومبدأُ ذلك الحرف مأخوذٌ من **أثر يد المالك**
    # لذلك الشكل بعينه (`letter_start`)، ويُنزَّل في موضع الحرف داخل الوصلة.
    runs = []
    if unit["kind"] != "letter":
        for word in unit["text"].split():
            i = 0
            while i < len(word):
                j = i
                while j < len(word) - 1 and word[j] not in CUTTERS:
                    j += 1
                runs.append((word[i], form_of(word, i)))
                i = j + 1

    strokes = []
    floor = 0
    for bi in order:
        pieces = by_body[bi]
        # **شرطةُ المدخل تُقتلَع قبل بناء الرسم** — والجسمُ الذي يفتح وصلةً وحدَه.
        if unit["kind"] != "letter" or unit.get("form") in ("initial", "isolated"):
            strip_lead(pieces, tol * 4)
        nodes, edges, spots = graph_of(pieces, tol)
        bridge(nodes, edges, spots)
        # **والحدُّ الأدنى ضربةٌ لكلِّ جسمٍ من الحبر** — لا أكثر: الرجوعُ على الأثر
        # مسموحٌ (يدُ المالك شاهدُه)، فما بقي رفعٌ إلا حيث انفصل الحبرُ فعلاً.
        floor += 1
        pts_all = [p for pc in pieces for p in pc["p"]]
        ours = bbox(pts_all)
        # **مبدأُ الجسم**: أقربُ عقدةٍ إلى مبدأ يد المالك إن وُجد أثرُه، وإلا
        # **الأيمنُ فالأعلى** — وهي قاعدةُ العربية العامّة (`STROKE_ORDER §٢`).
        # 🔴 **مبدأُ الوصلة = مبدأُ حرفها الأوّل بعينه** (حكمُ المالك الجامع، ٢٥
        # أغسطس ٢٠٢٦: «الموضوعُ ليس للخاء وحدها بل **كلّ الحروف**؛ الحروفُ
        # الابتدائية **دائماً مكانُ كتابتها مطابقٌ لما أعطيتك إيّاه**، والحرفُ يمكن
        # أن يكون ابتدائياً أو مستقلاً/نهائياً إذا جاء قبله حرفٌ غيرُ موصول»).
        #
        # **والمطابقةُ بالإزاحة لا بالنسبة**: المادّةُ كلُّها بمقياسٍ واحدٍ وخطِّ
        # أساسٍ واحد (`font_layer §space`) — فالحرفُ داخلَ الكلمة **بحجمه مفرداً**
        # (قِيس على «أخي»: قمّةُ الخاء ٦٢٤ في الكلمة و٦٢٦ مفردةً). فيكفي أن تُزاح
        # صورةُ الحرف أفقيّاً حتى تنطبق حافّتُها اليمنى على حافّة الوصلة، **ثم
        # يُؤخَذ مبدؤه كما هو**. ⚠ والنسبةُ المئوية أخطأت هنا: مبدأُ «خ» عند ٠٫٨٥
        # من عرضها، فلمّا نُسب إلى شريحةٍ مقصوصةٍ وقع **في وسط ما بين الحروف**.
        # **ونافذةُ الرأس قلمٌ ونصف**: رأسُ الحرف ليس نقطةً بل قوسٌ — فأقصى يمينه
        # أخفضُ من قمّته بقليل، والمطلوبُ **القمّة** («من فوق» بنصّ المالك).
        near = tol * 6
        top_x = max(spots[n][0] for n in nodes)
        edge = [n for n in nodes if spots[n][0] >= top_x - near]
        start = min(edge, key=lambda n: spots[n][1])
        # **وبعد اقتلاع الشرطة يصير أيمنُ الوصلة رأسَ حرفها الأوّل** — فمبدؤها
        # أعلى ذلك الرأس: «تبدأ من بداية الخاء فوق وليس على اليمين» (المالك).
        if hand:
            h_pts = [q for st in hand for q in st]
            mapped = to_frame([hand[0][0]], bbox(h_pts), bbox(pts_all))[0]
            start = min(nodes, key=lambda n: (spots[n][0] - mapped[0]) ** 2
                        + (spots[n][1] - mapped[1]) ** 2)
        for path in walk(nodes, edges, spots, start):
            strokes.append({"p": [[round(x, 1), round(y, 1)] for x, y in path],
                            "body": bi, "lift": True})
    out = dict(unit)
    out["strokes"] = strokes
    out["floor"] = floor
    return out


# **حواملُ الهمزة**: همزتُها رسمٌ منفصلٌ عن حاملها في الخطّ — فهي جسمٌ زائد،
# **ويدُ المالك شاهدُه** (رسم «أ» بضربتين لا واحدة).
# **وء المفردةُ جسمٌ بنفسها** — لا حاملَ لها فلا تزيد على كلمتها جسماً إلا كونَها
# منفصلةً عمّا قبلها وبعدها (قِيس: «عباءة» و«قراءة» ثلاثةُ أجسامٍ وأربعة).
HAMZA = set("أإؤئ")
LONE_HAMZA = "ء"


def form_of(word: str, i: int) -> str:
    """موضعُ الحرف في كلمته بقاعدة الوصل — **قاعدةُ المالك بنصّها** (٢٥ أغسطس
    ٢٠٢٦): «الحرفُ يأخذ شكلَ أوّل الكلمة إذا جاء في أوّلها أو في وسطها وقبله حرفٌ
    غيرُ موصول» · «والحرفُ في آخر الكلمة إذا كان قبله غيرُ موصولٍ يأخذ شكلَ
    المستقلّ».

    ⚠ **والوصلُ من جهتين لا جهةٍ واحدة**: كان `after` يقيس وجودَ حرفٍ بعده فقط،
    **فأعطى القاطعَ شكلَ ابتداءٍ لا وجودَ له** (الألفُ في «أسنان» ابتدائيةً!) —
    والصوابُ أن يُسأل: **أيصل هذا الحرفُ بما بعده؟** فالقواطعُ لا تصل.
    """
    # **والهمزةُ المفردة لا تصل من جهةٍ أصلاً** — فهي في عداد غير الموصول هنا
    # (كشفها بيانُ القاعدة على «قراءة»: كانت تُقرأ ابتدائيةً وما بعدها نهائياً).
    lone = CUTTERS | {LONE_HAMZA}
    joined_back = i > 0 and word[i - 1] not in lone
    joins_on = i < len(word) - 1 and word[i] not in lone
    if joined_back and joins_on:
        return "medial"
    if joined_back:
        return "final"
    if joins_on:
        return "initial"
    return "isolated"


def need_bodies(text: str, marks: dict = None) -> int:
    """أدنى أجسامٍ بقاعدة المالك: جسمٌ لكلِّ وصلةٍ متّصلة (تُقطع عند حروف
    الانقطاع)، **وما زاد فمن الحرف نفسِه**: شكلٌ حبرُه جسمان (شولةُ الكاف،
    وهمزةُ الألف) يزيد جسماً — **والزيادةُ تُقرأ من المادّة المحصودة لا تُكتب
    قائمةً** (`font_layer.json`: ك/معزول وك/نهائي جسمان، وحواملُ الهمزة كذلك)."""
    marks = marks or {}
    n = 0
    for word in text.split():
        n += 1
        for i, ch in enumerate(word[:-1]):
            if ch in CUTTERS or ch == LONE_HAMZA:
                n += 1
        for i, ch in enumerate(word):
            # المتغيّراتُ (أ إ آ ؤ ئ) **لم تُحصَد أشكالاً مفردة** في ك٢ فلا سطرَ لها
            # في الخريطة — **وهمزتُها جسمٌ بيقين**: يشهد به رسمُ المالك («أ» ضربتان)
            # وحبرُ الخطّ معاً. ⇐ تُعدّ من حاملها حتى تُحصَد فتُقرأ كسائرها.
            fallback = 2 if ch in HAMZA else 1
            n += max(0, marks.get(f"{ch}/{form_of(word, i)}", fallback) - 1)
    return n


def hand_whole(his: list, ours: dict) -> bool:
    """أَأَثرُه لهذه الكلمة **تامٌّ** أم قصاصةٌ منها؟ — يُقاس ولا يُظَنّ.

    أثرُ المالك للكلمة يُكتب على سطرٍ فيخرج **عريضاً كنسبة كلمتنا**؛ فإن جاء
    طوليّاً فما كُتب إلا بعضُها. (قِيس: «شمس» ٥٫٠٩ و«سلحفاة» ٤٫٣١ عرضاً على
    ارتفاع — و«محفظة» ٠٫٧٠ **بثمانٍ وعشرين نقطة**: قصاصةٌ لا كلمة.) ⇐ فلا
    تُتّخذ سقفاً، **وتُسمّى بنصّها** فلا تُطوى.
    """
    pts = [p for st in his for p in st]
    if not pts:
        return False
    hx0, hy0, hx1, hy1 = bbox(pts)
    ox0, oy0, ox1, oy1 = bbox([p for st in ours["strokes"] for p in st["p"]])
    his_r = (hx1 - hx0) / max(hy1 - hy0, 1e-6)
    our_r = (ox1 - ox0) / max(oy1 - oy0, 1e-6)
    return 0.5 <= his_r / max(our_r, 1e-6) <= 2.0


def build() -> int:
    if not SRC.exists():
        print(f"لا {SRC.relative_to(ROOT)} — تُبنى طبقةُ الفونت أوّلاً (`font_layer.py --build`)")
        return 1
    payload = json.loads(SRC.read_text(encoding="utf-8"))
    book = hand_book()
    tol = pen_of(payload) / 4
    print(f"قلمُ الخطّ {pen_of(payload):.1f} وحدة — وتجاورُ العُقَد رُبعُه ({tol:.1f})")
    units = []
    tally = {"letter": 0, "pair": 0, "word": 0, "sentence": 0}
    over = []
    # **الحروفُ أوّلاً**: مبادئُها من أثر يد المالك، ثم **تُنزَّل مبادئُها في
    # الكلمات والجمل** — فأوّلُ حرفٍ في كلِّ وصلةٍ يبدأ كما يبدأ مبتدَأً بيده.
    letters_map = {}
    todo = ([u for u in payload["units"] if u["kind"] == "letter"]
            + [u for u in payload["units"] if u["kind"] != "letter"])
    for i, unit in enumerate(todo):
        one = assemble_unit(unit, book, tol, letters_map)
        if one["kind"] == "letter":
            letters_map[one["name"]] = one
        units.append(one)
        tally[one["kind"]] = tally.get(one["kind"], 0) + 1
        if len(one["strokes"]) > one["floor"]:
            over.append(one["name"])
        if (i + 1) % 200 == 0:
            print(f"  … جُمعت {i + 1}/{len(todo)} وحدة")
    out = {
        "what": "طبقةُ الكيفية — ضرباتُ المادّة بمبادئها ومواضع رفع القلم (بند ك٣)",
        "how": "أضلاعُ هيكل الفونت مجموعةً مشيَ أويلر بأقلّ انعطاف، والمبدأُ من أثر"
               " المالك حيث وُجد وإلا فالأيمنُ فالأعلى — والقطعُ أدناه الممكن بناءً.",
        "stamp": payload["stamp"],
        "space": payload["space"],
        "counts": tally,
        "units": units,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    total = sum(len(u["strokes"]) for u in units)
    floor = sum(u["floor"] for u in units)
    print(f"\nطبقةُ الكيفية في {OUT.relative_to(ROOT)}: {len(units)} وحدةً · "
          f"{total} ضربةً (والحدُّ الأدنى النظريّ {floor})"
          + (f" · تجاوزت الأدنى: {len(over)}" if over else " · **كلُّها على الأدنى**"))
    return 0


# ————— الحرّاس —————

def self_test() -> int:
    if not OUT.exists():
        print(f"لا {OUT.relative_to(ROOT)} — تُبنى الطبقةُ أوّلاً (`--build`)")
        return 1
    payload = json.loads(OUT.read_text(encoding="utf-8"))
    units = payload["units"]
    book = hand_book()
    fails = 0

    def ok(cond, msg):
        nonlocal fails
        if not cond:
            fails += 1
            print("  ✗", msg)
        else:
            print("  ✓", msg)

    # ١) القطعُ إلى أدناه — بحكم البناء لا باختيارنا
    over = [u["name"] for u in units if len(u["strokes"]) > u["floor"]]
    ok(not over, f"القطعُ إلى أدناه في {len(units)} وحدة — لا ضربةَ زائدةٌ على ما يوجبه"
                 f" البناء" + (f" (تجاوزت: {over[:5]})" if over else ""))

    # ٢) يدُ المالك سقفٌ: كلماتُه بخطّه لا نزيد عليها
    words = (book.get("words") or {})
    strip = lambda s: "".join(c for c in s if c not in "ًٌٍَُِّْٰ")
    pairs = []
    partial = []
    for key, row in words.items():
        one = row.get("isolated", row)
        if not one.get("strokes"):
            continue
        text = strip(key)
        mine = next((u for u in units if u["text"] == text), None)
        if not mine:
            continue
        if not hand_whole(one["strokes"], mine):
            partial.append(text)
            continue
        pairs.append((text, len(one["strokes"]), len(mine["strokes"])))
    bad = [(t, h, m) for t, h, m in pairs if m > h]
    ok(pairs and not bad,
       f"ويدُ المالك سقفٌ لا أرضية في {len(pairs)} كلمةً تامّةً بخطّه: "
       + " · ".join(f"{t} {m}≤{h}" for t, h, m in pairs)
       + (f" — تجاوزت: {bad}" if bad else "")
       + (f" (وقصاصاتٌ لا تُتّخذ سقفاً: {'، '.join(partial)})" if partial else ""))

    # ٣) الأجسامُ على قاعدة الوصل — والقطعُ عند حروف الانقطاع بطبيعته
    marks = {u["name"]: u["bodies"] for u in units if u["kind"] == "letter"}
    wrong = [(u["name"], need_bodies(u["text"], marks), u["bodies"])
             for u in units
             if u["kind"] != "letter" and u["bodies"] != need_bodies(u["text"], marks)]
    ok(not wrong, f"والوقفُ عند حروف الانقطاع وحدَها — أجسامُ {len(units)} وحدةٍ"
                  f" على قاعدة المالك" + (f" (خالفت: {wrong[:4]})" if wrong else ""))

    # ٤) المبدأُ من أثر يده — يُقاس بُعدُه لا يُدَّعى
    gaps = []
    for u in units:
        if u["kind"] != "letter":
            continue
        hs = hand_strokes(book, u["text"], u["form"])
        if not hs or not u["strokes"]:
            continue
        h_pts = [p for st in hs for p in st]
        ours = bbox([p for st in u["strokes"] for p in st["p"]])
        mapped = to_frame([hs[0][0]], bbox(h_pts), ours)[0]
        head = u["strokes"][0]["p"][0]
        span = max(ours[2] - ours[0], ours[3] - ours[1], 1e-6)
        gaps.append(math.dist(head, mapped) / span)
    gaps.sort()
    med = gaps[len(gaps) // 2] if gaps else 1.0
    near = sum(1 for g in gaps if g <= 0.25)
    ok(gaps and med <= 0.25,
       f"ومبدأُ الضربة من أثر يده: وُسطى البُعد {med:.0%} من قطر الشكل في"
       f" {len(gaps)} شكلاً · وداخلَ الرُّبع {near}/{len(gaps)}")

    # ٥) **مبدأُ الوصلة عند رأس حرفها الأوّل** (بعد اقتلاع شرطة المدخل): يُقاس
    #    بُعدُ المبدأ عن أيمن الوصلة — فالرأسُ هناك، والمنتصفُ يحمرّ.
    pen = 102.8
    far, seen = [], 0
    for u in units:
        if u["kind"] == "letter":
            continue
        for st in u["strokes"]:
            bp = [q for x in u["strokes"] if x["body"] == st["body"] for q in x["p"]]
            x1 = max(q[0] for q in bp)
            seen += 1
            if x1 - st["p"][0][0] > pen * 1.8:
                far.append(u["text"][:14])
                break
    ok(seen and len(far) <= seen * 0.08,
       f"ومبدأُ الوصلة عند رأس حرفها الأوّل لا في وسطها: {seen - len(far)}/{seen} ضربةً"
       f" تبدأ في حدود قلمٍ ونصفٍ من أيمن وصلتها"
       + (f" — بعُدت {far[:4]}" if far else ""))

    # ٦) ومجرَّبٌ سالباً: جسمٌ بضربتين حيث تكفي واحدة يحمرّ
    hurt = json.loads(json.dumps(units[:1]))
    hurt[0]["strokes"].append(dict(hurt[0]["strokes"][0]))
    ok(len(hurt[0]["strokes"]) > hurt[0]["floor"],
       "ومجرَّبٌ سالباً: ضربةٌ تُدسّ فوق الأدنى تحمرّ في الحارس الأول")

    print(f"\n{fails} فشل" if fails else "\nطبقةُ الكيفية: الضرباتُ أدناها والمبدأُ من يده")
    return 1 if fails else 0



# ————— لوحةُ المقابلة: يدُ المالك ⇐ ضرباتُنا —————

PAL = ["#7fd1c7", "#f2b544", "#e0685f", "#9bd17f", "#c9a0ff", "#7fb3d1"]


def art(strokes: list, dots: list, band: tuple = None, pen: float = 40.0,
        numbered: bool = True) -> str:
    """رسمُ الضربات بألوانها ومبادئها المرقّمة — **والمقياسُ واحدٌ حيث طُلب**."""
    pts = [p for st in strokes for p in st] + [[d[0], d[1]] for d in dots]
    if not pts:
        return ""
    x0, y0, x1, y1 = bbox(pts)
    if band:
        top, bottom, win = band
        cx = (x0 + x1) / 2
        vx, vy, vw, vh = cx - win / 2, top, win, bottom - top
    else:
        pad = pen * 1.6
        vx, vy, vw, vh = x0 - pad, y0 - pad, (x1 - x0) + 2 * pad, (y1 - y0) + 2 * pad
    out = []
    for i, st in enumerate(strokes):
        c = PAL[i % len(PAL)]
        d = "M " + " L ".join(f"{p[0]:.1f} {p[1]:.1f}" for p in st)
        out.append(f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{pen * 0.5:.1f}"'
                   ' stroke-linecap="round" stroke-linejoin="round"/>')
        hx, hy = st[0]
        out.append(f'<circle cx="{hx:.1f}" cy="{hy:.1f}" r="{pen * 0.55:.1f}" fill="{c}"/>')
        if numbered:
            out.append(f'<circle cx="{hx:.1f}" cy="{hy - pen * 1.15:.1f}" r="{pen * 0.62:.1f}"'
                       f' fill="#14161c" stroke="{c}" stroke-width="{pen * 0.09:.1f}"/>')
            out.append(f'<text x="{hx:.1f}" y="{hy - pen * 0.92:.1f}" fill="{c}"'
                       f' font-size="{pen * 0.9:.0f}" text-anchor="middle"'
                       f' font-family="sans-serif" font-weight="700">{i + 1}</text>')
        ex, ey = st[-1]
        out.append(f'<rect x="{ex - pen * 0.4:.1f}" y="{ey - pen * 0.4:.1f}"'
                   f' width="{pen * 0.8:.1f}" height="{pen * 0.8:.1f}" fill="none"'
                   f' stroke="{c}" stroke-width="{pen * 0.12:.1f}"/>')
    for d in dots:
        out.append(f'<ellipse cx="{d[0]:.1f}" cy="{d[1]:.1f}" rx="{d[2]:.1f}" ry="{d[3]:.1f}"'
                   ' fill="#e0685f"/>')
    return (f'<svg viewBox="{vx:.0f} {vy:.0f} {vw:.0f} {vh:.0f}" preserveAspectRatio="xMidYMid meet"'
            f' style="aspect-ratio:{max(vw, 1):.0f}/{max(vh, 1):.0f}">' + "".join(out) + "</svg>")


def panel() -> int:
    if not OUT.exists():
        print(f"لا {OUT.relative_to(ROOT)} — تُبنى الطبقةُ أوّلاً (`--build`)")
        return 1
    payload = json.loads(OUT.read_text(encoding="utf-8"))
    units = payload["units"]
    book = hand_book()
    by_name = {u["name"]: u for u in units}
    by_text = {}
    for u in units:
        by_text.setdefault(u["text"], u)
    letters = [u for u in units if u["kind"] == "letter"]
    pen = 100.0
    src = json.loads(SRC.read_text(encoding="utf-8")) if SRC.exists() else None
    if src:
        pen = pen_of(src)
    top = min(u["box"][1] for u in letters) - pen
    bottom = max(u["box"][3] for u in letters) + pen
    win = max(u["box"][2] - u["box"][0] for u in letters) + 2 * pen
    band = (top, bottom, win)

    def fig(unit, one=False, label=None):
        strokes = [st["p"] for st in unit["strokes"]]
        body = art(strokes, unit["dots"], band if one else None, pen)
        name = label or unit["text"]
        form = f' <span class="f">{FORM_AR[unit["formial"]]}</span>' if unit.get("formial") else (
            f' <span class="f">{FORM_AR[unit["form"]]}</span>' if unit.get("form") else "")
        return (f'<figure><div class="art">{body}</div><figcaption><b>{html.escape(name)}</b>{form}'
                f'<span class="n">ضربات {len(strokes)} · أجسام {unit["bodies"]}'
                f' · نقاط {len(unit["dots"])}</span></figcaption></figure>')

    order = []
    for ch in [u["text"] for u in letters]:
        pass
    seen = set()
    for u in letters:
        if u["name"] in seen:
            continue
        seen.add(u["name"])
        order.append(u)

    # صفُّ المقابلة: كلماتُ المالك بخطّه إلى جانب ضرباتنا
    strip = lambda t: "".join(c for c in t if c not in "ًٌٍَُِّْٰ")
    rows = []
    for key, row in (book.get("words") or {}).items():
        one = row.get("isolated", row)
        if not one.get("strokes"):
            continue
        mine = by_text.get(strip(key))
        if not mine:
            continue
        his_dots = [[d["at"][0], d["at"][1], 18, 18] if isinstance(d, dict)
                    else [d[0], d[1], 18, 18] for d in (one.get("dots") or [])]
        whole = hand_whole(one["strokes"], mine)
        his = art(one["strokes"], his_dots, None, 34)
        ours = art([st["p"] for st in mine["strokes"]], mine["dots"], None, pen)
        tag = "" if whole else " — <b>قصاصةٌ من أثرك</b> (لا تُتّخذ سقفاً)"
        rows.append(
            '<div class="pair">'
            f'<div><h3>يدُ المالك — {html.escape(key)} · {len(one["strokes"])} ضربة{tag}</h3>'
            f'<div class="art">{his}</div></div>'
            f'<div><h3>ضرباتُنا — {html.escape(strip(key))} · {len(mine["strokes"])} ضربة</h3>'
            f'<div class="art">{ours}</div></div></div>')

    # **الأمثلةُ تُصنَّف بالحالة** (أمرُ المالك ٢٥ أغسطس: «أعطني عدداً أكبر من
    # الأمثلة لكلّ الاحتمالات كي ألاحظ أيَّ خطأ — فالعينُ المتعوّدة على الصواب ترى
    # الخطأ بسرعة»): كلُّ صنفٍ يختبر قاعدةً بعينها، **ويُنتقى من المادّة آلياً**.
    def runs_of(text):
        out = []
        for word in text.split():
            i = 0
            while i < len(word):
                j = i
                while j < len(word) - 1 and word[j] not in CUTTERS:
                    j += 1
                out.append((word[i], form_of(word, i), i))
                i = j + 1
        return out

    W = [u for u in units if u["kind"] == "word"]
    S = [u for u in units if u["kind"] == "sentence"]
    one_run = [u for u in W if len(runs_of(u["text"])) == 1][:18]
    mid_run = [u for u in W if any(i > 0 and f == "initial" for _, f, i in runs_of(u["text"]))][:30]
    lone_end = [u for u in W if any(i > 0 and f == "isolated" for _, f, i in runs_of(u["text"]))][:18]
    hamza = [u for u in W if any(c in HAMZA for c in u["text"])][:18]
    kaf = [u for u in W if "ك" in u["text"]][:14]
    lam_alef = [u for u in units if "لا" in u["text"] and u["kind"] != "letter"][:14]
    buckets = [
        ("٣) كلمةٌ بوصلةٍ واحدة — ضربةٌ واحدةٌ من أوّلها إلى آخرها",
         "لا قاطعَ في وسطها، فاليدُ لا ترفع: تصعد السنَّ وتنزل على أثرها.", one_run),
        ("٤) قاطعٌ في وسط الكلمة ⇐ ما بعده يبدأ كأوّلِ الكلام",
         "قاعدتُك: يأخذ شكلَ الابتداء ولو جاء في المنتصف — <b>ومبدؤه مبدأُ أوّلِ الكلام</b>"
         " (رأسُ الحرف من فوق) لا أيمنُ حبر الوصلة.", mid_run),
        ("٥) وآخِرُ الكلمة بعد قاطعٍ ⇐ شكلُ المستقلّ",
         "الشطرُ الثاني من قاعدتك: حرفٌ في آخر الكلمة قبله غيرُ موصولٍ يأخذ شكلَ المستقلّ.",
         lone_end),
        ("٦) الهمزةُ بعد حاملها",
         "حكمُك: «الألفُ أوّلاً ثم الهمزة» — والعلامةُ تتبع حاملَها في الترتيب.", hamza),
        ("٧) الكافُ وشولتُها",
         "الشولةُ حبرٌ منفصلٌ فهي ضربةٌ بعد جسم الكاف — لا قبله.", kaf),
        ("٨) لام-ألف",
         "رسمٌ واحدٌ من الفونت — لا «لـا» ولا تركيبَ لامٍ وألف.", lam_alef),
        ("٩) جمل", "الوقفُ عند القواطع وحدَها، وكلُّ وصلةٍ تبدأ من مبدأ حرفها الأوّل.", S[:8]),
    ]
    words = W[:12]
    sentences = S[:4]
    total = sum(len(u["strokes"]) for u in units)
    doc = f"""<title>ضرباتُ اُكْتُبْ من يد المالك</title>
<style>
 :root {{ color-scheme: dark; background:#14161c; --ink:#e8e4dc; --bg:#14161c; --card:#1c1f27;
   --line:#3b4250; --soft:#a9b1c0; }}
 body {{ margin:0; padding:26px; background:var(--bg); color:var(--ink);
   font:16px/1.7 -apple-system,"SF Arabic","Noto Naskh Arabic",serif; direction:rtl; }}
 h1 {{ font-size:26px; margin:0 0 6px; }}
 h2 {{ font-size:20px; margin:32px 0 10px; border-bottom:1px solid var(--line); padding-bottom:6px; }}
 h3 {{ font-size:15px; margin:0 0 6px; color:var(--soft); font-weight:600; }}
 p.lead {{ color:var(--soft); margin:0 0 14px; max-width:74ch; }}
 .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:12px; }}
 .wide {{ grid-template-columns:1fr; }}
 figure {{ margin:0; background:var(--card); border:1px solid var(--line); border-radius:10px; padding:9px; }}
 figcaption {{ display:flex; flex-direction:column; gap:2px; margin-top:6px; font-size:14px; }}
 .f {{ color:var(--soft); font-size:13px; }}
 .n {{ color:var(--soft); font-size:12px; font-variant-numeric:tabular-nums; }}
 .art {{ background:#0f1115; border-radius:7px; padding:7px; }}
 svg {{ width:100%; display:block; }}
 .pair {{ display:grid; grid-template-columns:1fr 1fr; gap:14px; background:var(--card);
   border:1px solid var(--line); border-radius:12px; padding:12px; margin-bottom:12px; }}
 .key {{ color:var(--soft); font-size:14px; }}
 b.hit {{ color:#9bd17f; }}
</style>
<h1>ضرباتُ اُكْتُبْ — من يد المالك</h1>
<p class="lead"><b>الشكلُ من الفونت</b> (ك٢، مقبولٌ بعينك) — <b>والكيفيةُ هنا من خطّ يدك</b>:
 مبدأُ كلِّ ضربةٍ أقربُ عقدةٍ إلى مبدئك في أثرك (١١٢ شكلاً بيدك)، والقطعُ إلى أدناه:
 <b class="hit">ضربةٌ واحدةٌ لكلِّ جسمِ حبر</b> — واليدُ ترجع على أثرها في السنّ والعمود
 ولا ترفع، فلا رفعَ إلا حيث انفصل الحبرُ فعلاً (د ذ ر ز و ا … وشولةُ الكاف وهمزةُ الألف).</p>
<p class="key">في كلِّ لوحة: <b>الدائرةُ المرقّمة</b> مبدأُ الضربة بترتيبها · <b>المربّعُ</b> منتهاها ·
 ولونٌ لكلِّ ضربة. المحصود: {len(units)} وحدةً · {total} ضربةً — وهي الحدُّ الأدنى الممكن.</p>

<h2>١) كلماتُك بخطّك — إلى جانب ضرباتنا</h2>
<p class="key">حكمُك: «يمكن أن تكون أقلَّ من ضرباتي لا مشكلة لكن ليس أكثر». والمقيسُ الآن:
 {" · ".join(f"{strip(k)} {len(by_text[strip(k)]['strokes'])}≤{len((v.get('isolated', v))['strokes'])}" for k, v in (book.get('words') or {}).items() if (v.get('isolated', v)).get('strokes') and strip(k) in by_text and hand_whole((v.get('isolated', v))['strokes'], by_text[strip(k)]))}</p>
{"".join(rows)}

<h2>٢) الهجاءُ بمواضعه — بمقياسٍ واحد</h2>
<div class="grid">{"".join(fig(u, one=True) for u in order)}</div>

{"".join(f'<h2>{t}</h2><p class="key">{why}</p><div class="grid{" wide" if len(items) <= 8 else ""}">' + "".join(fig(u) for u in items) + '</div>' for t, why, items in buckets)}
"""
    PANEL.write_text(doc, encoding="utf-8")
    print(f"لوحةُ الكيفية في {PANEL.relative_to(ROOT)} ({len(doc) // 1024} كيلو)")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="طبقةُ الكيفية: ضرباتٌ ومبادئُ ورفعُ قلم")
    ap.add_argument("--build", action="store_true")
    ap.add_argument("--self-test", action="store_true")
    ap.add_argument("--panel", action="store_true")
    args = ap.parse_args()
    if args.build:
        return build()
    if args.self_test:
        return self_test()
    if args.panel:
        return panel()
    ap.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
