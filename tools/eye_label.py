#!/usr/bin/env python3
"""**العارضُ الأعمى** — وسمُ عين المالك قبل أن يرى حكمَ الآلة (شرطُ ن٣ السابق).

    python3 tools/eye_label.py <ملفّ الحصاد.json>   # يفتح الوسمَ على المتصفح ويطبع تقدّمه
    python3 tools/eye_label.py --self-test           # عهدُ العمى والاستئناف بلا متصفحٍ ولا شبكة

**لماذا أداةٌ ثالثة بعد `field_view` و`clinic`**: العارضُ القائم يطبع في كل خليةٍ
حكمَ المحرّك وشكواه (`field_view.cell`) — **فالوسمُ عليه ليس أعمى**: عينٌ رأت
«✗ ردّ» لا تحكم كما تحكم عينٌ لم تره (صيدُ جلسة ن٣ الأولى). وهذه الأداة نقيضُه
بنيوياً: **لا تعرف الحكمَ أصلاً** — حمولةُ الصفحة تُبنى بقائمة سماحٍ (`BLIND_KEEP`)
لا بقائمة منع، فحقلٌ جديدٌ يحمله التصديرُ غداً محجوبٌ حتى يُسمَّى صراحةً،
**ويحرس ذلك الفحصُ الذاتي**.

**والتقدّم نبضٌ واستئناف** (عهدُ «الأداة تنبض وتستأنف»): كلُّ حكمٍ يُكتب فوراً في
`<الاسم>-eyed.json` كتابةً ذرّية (ملفٌّ مؤقت ثم إحلال)، وإعادةُ التشغيل تُكمل من
أول أثرٍ بلا وسم — فانقطاعُ جلسة وسمٍ في أثرها الأربعين لا يُعيد التسعة والثلاثين.

**ولا يخرج من هنا شيءٌ إلى شبكة**: خادمٌ على `127.0.0.1` وحدَه يقرأ ملفاً حفظه
وليُّ الأمر بيده ويكتب جارَه على القرص. والأثرُ نقاطٌ على شبكة ١٠٠٠×١٠٠٠ —
لا اسمَ طفلٍ فيه ولا صورة.
"""
import argparse
import http.server
import json
import sys
import tempfile
import webbrowser
from pathlib import Path

PORT = 8734  # جارُ العيادة (8733) — بابان متجاوران لا يتزاحمان

# **قائمةُ السماح — هي العمى كلُّه**: ما يبلغ الصفحةَ من كل أثرٍ هذه الحقولُ
# بأسمائها لا غير. حكمُ المحرّك وشكاواه وأرقامُه (`accepted/code/codes/metrics/…`)
# ليست هنا فلا تُرسَل — **والمنعُ بالغياب لا بالحذف**، فحقلٌ يجدّ غداً محجوبٌ بالبناء.
BLIND_KEEP = ('ch', 'form', 'mode', 'strokes', 'who', 'hand', 'tool', 'session')

EYES = ('accept', 'reject')  # وقيمةُ الوسم من حكمَي العين لا غير — والتأجيلُ غيابُ الحقل


def blind_item(item, index):
    """حمولةُ أثرٍ واحدٍ للصفحة: المسموحُ وحدَه + رقمُه + وسمُه القائم إن سبق."""
    out = {k: item[k] for k in BLIND_KEEP if k in item}
    out['i'] = index
    if item.get('eye') in EYES:
        out['eye'] = item['eye']
    return out


def apply_eye(book, index, eye):
    """يضع حكمَ العين في أثره — ويأبى ما ليس حكماً وما ليس أثراً."""
    items = book.get('items') or []
    if not (0 <= index < len(items)):
        raise IndexError(f'لا أثرَ برقم {index}')
    if eye not in EYES:
        raise ValueError(f'ليس حكمَ عين: {eye!r}')
    items[index]['eye'] = eye
    return items[index]


def atomic_write(path: Path, book):
    """كتابةٌ ذرّية: جارٌ مؤقتٌ ثم إحلال — فلا يُقرأ نصفُ ملفٍّ يوماً."""
    tmp = path.with_suffix('.tmp')
    tmp.write_text(json.dumps(book, ensure_ascii=False), encoding='utf-8')
    tmp.replace(path)


def eyed_path(src: Path) -> Path:
    return src.with_name(src.stem + '-eyed.json')


def load_resume(src: Path):
    """يستأنف من الموسوم إن وُجد — وإلا فنسخةُ عملٍ من الأصل."""
    out = eyed_path(src)
    book = json.loads((out if out.exists() else src).read_text(encoding='utf-8'))
    return book, out


def labeled_count(book):
    items = book.get('items') or []
    return sum(1 for it in items if it.get('eye') in EYES), len(items)


def page(book):
    """صفحةُ الوسم: أثرٌ واحدٌ ملءَ العين، وثلاثةُ أفعال — ولا حكمَ آلةٍ في الحمولة."""
    items = book.get('items') or []
    payload = json.dumps([blind_item(it, i) for i, it in enumerate(items)], ensure_ascii=False)
    done, total = labeled_count(book)
    return '''<!doctype html><meta charset="utf-8"><title>الوسم الأعمى</title>
<body dir="rtl">
<style>
  body { font-family: -apple-system, sans-serif; margin: 20px; text-align: center; background: #fff; }
  #board { margin: 8px auto; }
  #tag { font-size: 22px; margin: 6px; } #left { color: #667; font-size: 15px; }
  button { font-size: 22px; min-width: 150px; min-height: 64px; margin: 8px; border-radius: 14px; border: 1px solid #ccd; background: #f6f6fc; }
  #ok { background: #e6f6e6; } #no { background: #fbe7e7; }
  kbd { background: #eee; border-radius: 4px; padding: 1px 6px; font-size: 13px; }
</style>
<div id="tag"></div>
<svg id="board" viewBox="0 0 1000 1000" width="420" height="420">
  <rect x="2" y="2" width="996" height="996" rx="40" fill="#F4F4FF" stroke="#ddd"/>
  <line x1="60" y1="640" x2="940" y2="640" stroke="#ccc" stroke-dasharray="14 12"/>
  <g id="ink"></g>
</svg>
<div>
  <button id="ok">مقبول <kbd>١</kbd></button>
  <button id="no">مردود <kbd>٢</kbd></button>
  <button id="later">أجِّلْه <kbd>٣</kbd></button>
</div>
<div id="left"></div>
<script>
const ITEMS = ''' + payload + ''';
const queue = ITEMS.filter((it) => !it.eye).map((it) => it.i);
let at = 0;
const sv = (n, a) => { const el = document.createElementNS('http://www.w3.org/2000/svg', n);
  for (const k in a) el.setAttribute(k, a[k]); return el; };
function show() {
  const left = document.getElementById('left');
  if (at >= queue.length) {
    document.getElementById('tag').textContent = 'تمّ الوسم — أغلق الصفحة';
    document.getElementById('ink').replaceChildren(); left.textContent = ''; return;
  }
  const it = ITEMS[queue[at]];
  document.getElementById('tag').textContent = `${it.ch ?? '؟'} ${it.form ?? ''} — بعين الأب: أهو صحيحٌ قَدْراً ما؟`;
  left.textContent = `${at + 1} من ${queue.length}` + (it.who ? ` · ${it.who}` : '');
  const g = document.getElementById('ink'); g.replaceChildren();
  for (const st of (it.strokes || [])) {
    if (st.length === 1) g.append(sv('circle', { cx: st[0][0], cy: st[0][1], r: 18, fill: '#3F4C8F' }));
    else g.append(sv('polyline', { points: st.map((p) => p[0] + ',' + p[1]).join(' '),
      fill: 'none', stroke: '#3F4C8F', 'stroke-width': 26,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  }
}
async function judge(eye) {
  if (at >= queue.length) return;
  if (eye) {
    await fetch('/label', { method: 'POST',
      body: JSON.stringify({ i: queue[at], eye }) });
    ITEMS[queue[at]].eye = eye;
  }
  at++; show();
}
document.getElementById('ok').onclick = () => judge('accept');
document.getElementById('no').onclick = () => judge('reject');
document.getElementById('later').onclick = () => judge(null);
addEventListener('keydown', (e) => {
  if (e.key === '1' || e.key === '١') judge('accept');
  if (e.key === '2' || e.key === '٢') judge('reject');
  if (e.key === '3' || e.key === '٣') judge(null);
});
show();
</script>'''


def serve(src: Path):
    book, out = load_resume(src)
    done, total = labeled_count(book)
    print(f'الوسمُ الأعمى: {src.name} ⇐ {out.name} — موسومٌ {done}/{total}')

    class Handler(http.server.BaseHTTPRequestHandler):
        def _send(self, body, kind='text/html'):
            data = body.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', f'{kind}; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            self._send(page(book))

        def do_POST(self):
            if self.path != '/label':
                self.send_error(404)
                return
            raw = self.rfile.read(int(self.headers.get('Content-Length', 0)))
            ask = json.loads(raw)
            apply_eye(book, int(ask['i']), ask['eye'])
            atomic_write(out, book)
            done, total = labeled_count(book)
            print(f'  وُسم {done}/{total}', flush=True)
            self._send('{"ok":true}', 'application/json')

        def log_message(self, *_):
            pass

    server = http.server.HTTPServer(('127.0.0.1', PORT), Handler)
    url = f'http://127.0.0.1:{PORT}/'
    print(f'افتح: {url} — والأحكامُ تُكتب أولاً بأول، وأغلق بـ Ctrl+C متى شئت.')
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        done, total = labeled_count(book)
        print(f'\nوقف الوسمُ على {done}/{total} — والإعادةُ تُكمل من موضعه.')


def self_test():
    """عهودُ الأداة الثلاثة بلا شبكةٍ ولا متصفح: العمى، والحكمُ الصارم، والاستئنافُ الذرّي."""
    fails = []

    def ok(cond, name):
        print(('  ✓ ' if cond else '  ✗ ') + name)
        if not cond:
            fails.append(name)

    # مادّةٌ مصنوعة تحمل حقولَ حكم الآلة كلَّها كما يحملها تصديرُ الساحة
    item = {'ch': 'ب', 'form': 'isolated', 'mode': 'free', 'who': 'بنت',
            'strokes': [[[100, 200], [300, 400]], [[500, 500]]],
            'accepted': True, 'code': 'wander', 'codes': ['wander'],
            'metrics': {'coverage': 0.9}, 'maxLateral': 120, 'coverage': 0.9,
            'lateral': 90, 'limit': 1, 'ease': 1, 'coverLimit': 0.6,
            'human': 'x', 'agree': True, 'split': 'a', 'watch': True}
    veiled = blind_item(item, 7)
    machine = {'accepted', 'code', 'codes', 'metrics', 'maxLateral', 'coverage',
               'lateral', 'limit', 'ease', 'coverLimit', 'human', 'agree', 'split', 'watch'}
    ok(not (machine & set(veiled)), 'العمى: لا حقلَ حكمِ آلةٍ يبلغ الصفحة — قائمةُ سماحٍ لا منع')
    ok(veiled['i'] == 7 and veiled['ch'] == 'ب' and veiled['strokes'] == item['strokes'],
       'والمسموحُ يمرّ بحاله: الحبرُ والحرفُ والرقم')
    full_page = page({'items': [item]})
    ok('wander' not in full_page and 'maxLateral' not in full_page,
       'وصفحةُ الوسم نفسُها خاليةٌ من ألفاظ الحكم')

    book = {'items': [dict(item), {'ch': 'ت', 'strokes': [], 'eye': 'accept'}]}
    ok(labeled_count(book) == (1, 2), 'العدّ: موسومٌ واحدٌ من اثنين')
    apply_eye(book, 0, 'reject')
    ok(book['items'][0]['eye'] == 'reject' and labeled_count(book) == (2, 2),
       'والحكمُ يستقرّ في أثره')
    for bad, why in ((('x',), 'حكمٌ ليس من الحكمين'), ((9,), 'رقمٌ بلا أثر')):
        try:
            apply_eye(book, 9 if bad == (9,) else 0, 'x' if bad == ('x',) else 'accept')
            ok(False, f'الصرامة: {why} يُرَدّ')
        except (ValueError, IndexError):
            ok(True, f'الصرامة: {why} يُرَدّ')

    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / 'harvest.json'
        src.write_text(json.dumps({'items': [{'ch': 'ب', 'strokes': []}]}, ensure_ascii=False))
        b1, out = load_resume(src)
        apply_eye(b1, 0, 'accept')
        atomic_write(out, b1)
        b2, out2 = load_resume(src)
        ok(out2 == out and b2['items'][0].get('eye') == 'accept' and not out.with_suffix('.tmp').exists(),
           'الاستئنافُ الذرّي: الإعادةُ تقرأ الموسومَ ولا جارَ مؤقتاً باقياً')

    print('لا حكمَ آلةٍ يسبق العين — والعارضُ الأعمى يفي بعهوده' if not fails
          else f'أخفق {len(fails)}')
    return 1 if fails else 0


def main():
    ap = argparse.ArgumentParser(description='الوسمُ الأعمى لآثار الميدان')
    ap.add_argument('harvest', nargs='?', help='ملفُّ الحصاد (items[] بعُرف الساحة)')
    ap.add_argument('--self-test', action='store_true')
    args = ap.parse_args()
    if args.self_test:
        sys.exit(self_test())
    if not args.harvest:
        ap.error('أعطني ملفَّ الحصاد — أو --self-test')
    serve(Path(args.harvest))


if __name__ == '__main__':
    main()
