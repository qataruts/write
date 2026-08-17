"""عارضُ آثار الميدان — يرسم ما كتبته اليدُ صفحةً واحدة لتحكم عليه عينٌ ثانية.

    python3 tools/field_view.py <ملفّ الميدان.json> [--out لقطة.png]

**لماذا**: بلاغُ قياس الرفض الكاذب (١٧ أغسطس ٢٠٢٦) يطلب حكمَ عينٍ على كل كتابة.
وحكمُ العين الحاضرة يكتبه وليُّ الأمر سطراً؛ **وهذا يفتح عيناً ثانية** على الأثر
نفسِه بعد الجلسة: كلُّ محاولةٍ برقمها وحرفها وحكمِ المحرّك عليها وشكواه إن ردّها.

**ولا يخرج من هذا شيءٌ إلى شبكة**: يقرأ ملفّاً حفظه وليُّ الأمر بيده، ويكتب صورةً
على القرص. والأثرُ نقاطٌ على شبكة ١٠٠٠×١٠٠٠ — لا اسمَ طفلٍ فيه ولا تقدّم.
"""
import json
import sys
from pathlib import Path

CELL = 260


def cell(item, index):
    """خليّةٌ واحدة: الأثرُ كما رُسم، ورقمُه، وحكمُ المحرّك عليه."""
    strokes = item.get('strokes') or []
    paths = []
    for stroke in strokes:
        pts = ' '.join(f'{x:.0f},{y:.0f}' for x, y in stroke if isinstance(stroke, list))
        if pts:
            paths.append(f'<polyline points="{pts}" fill="none" stroke="#3F4C8F" '
                         f'stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>')
        if len(stroke) == 1:  # نقطةٌ برفعةٍ واحدة
            x, y = stroke[0]
            paths.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="18" fill="#3F4C8F"/>')
    accepted = item.get('kind') != 'fault' and bool(item.get('accepted'))
    verdict = '✓ قَبِل' if accepted else '✗ ردّ'
    code = item.get('code') or (', '.join(item.get('codes') or []) or '')
    metrics = ''
    if item.get('maxLateral') is not None:
        metrics = f"انحراف {item['maxLateral']}/{item.get('lateral', '?')} · تغطية {item.get('coverage', '?')}٪"
    return f'''<figure class="c">
      <svg viewBox="0 0 1000 1000" width="{CELL}" height="{CELL}">
        <rect x="2" y="2" width="996" height="996" rx="40" fill="#F4F4FF" stroke="#ddd"/>
        <line x1="60" y1="640" x2="940" y2="640" stroke="#ccc" stroke-dasharray="14 12"/>
        {''.join(paths)}
      </svg>
      <figcaption>
        <b>{index}</b> · {item.get('ch', '؟')} {item.get('form', '')}
        <span class="{'ok' if accepted else 'no'}">{verdict}</span>
        <small>{code}</small><small>{metrics}</small>
      </figcaption>
    </figure>'''


def build(book):
    items = book.get('items') or []
    cells = ''.join(cell(it, i + 1) for i, it in enumerate(items))
    return f'''<!doctype html><meta charset="utf-8"><body dir="rtl">
    <style>
      body {{ font-family: -apple-system, sans-serif; background: #fff; margin: 18px; }}
      h1 {{ font-size: 18px; margin: 0 0 12px; }}
      .g {{ display: flex; flex-wrap: wrap; gap: 14px; }}
      .c {{ margin: 0; }}
      figcaption {{ font-size: 13px; text-align: center; line-height: 1.5; }}
      .ok {{ color: #1a7f4b; font-weight: 700; }} .no {{ color: #b3261e; font-weight: 700; }}
      small {{ display: block; color: #666; font-size: 11px; }}
    </style>
    <h1>آثارُ الميدان — {len(items)} كتابة (الحكمُ المكتوب حكمُ المحرّك، والعينُ تحكم بنفسها)</h1>
    <div class="g">{cells}</div></body>'''


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        print(__doc__)
        return 2
    book = json.loads(Path(args[0]).read_text(encoding='utf-8'))
    html = build(book)
    out = Path(sys.argv[sys.argv.index('--out') + 1]) if '--out' in sys.argv else Path('/tmp/field.png')
    page_html = Path(str(out.with_suffix('.html')))
    page_html.write_text(html, encoding='utf-8')
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print(f'الصفحةُ في {page_html} — ولا playwright لالتقاطها صورةً')
        return 0
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1180, 'height': 900})
        page.goto(page_html.as_uri())
        page.screenshot(path=str(out), full_page=True)
        browser.close()
    print(f'اللقطة: {out}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
