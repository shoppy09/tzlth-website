#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SEO Week 1 批量更新腳本
對 blog/ 下所有 HTML（排除 _article_template.html）補入：
  1. Twitter Card meta tags
  2. dateModified (= datePublished)
  3. author @id
  4. BreadcrumbList JSON-LD
支援 --dry-run 旗標（只印出要改的檔名，不實際寫入）
"""
import os, re, sys, json

# IMP-063: Windows cp950 terminal 無法輸出 emoji，強制改為 UTF-8
if sys.stdout.encoding and sys.stdout.encoding.lower() in ('cp950', 'big5', 'gbk', 'cp936'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

DRY_RUN = '--dry-run' in sys.argv
BLOG_DIR = 'blog'

updated = 0
skipped = 0
already_done = 0

for fname in sorted(os.listdir(BLOG_DIR)):
    if not fname.endswith('.html') or fname == '_article_template.html':
        continue

    path = os.path.join(BLOG_DIR, fname)
    with open(path, encoding='utf-8') as f:
        html = f.read()

    # CRLF 統一
    html = html.replace('\r\n', '\n')
    changed = False

    # ── Guard 1: Twitter Cards ────────────────────────────────────────────────
    if 'twitter:card' not in html:
        og_title = re.search(r'<meta property="og:title" content="([^"]*)">', html)
        og_desc  = re.search(r'<meta property="og:description" content="([^"]*)">', html)
        title_v  = og_title.group(1) if og_title else ''
        desc_v   = og_desc.group(1)  if og_desc  else ''
        tw = (f'\n<meta name="twitter:card" content="summary_large_image">'
              f'\n<meta name="twitter:title" content="{title_v}">'
              f'\n<meta name="twitter:description" content="{desc_v}">'
              f'\n<meta name="twitter:image" content="https://www.careerssl.com/og-image.png">')
        html = re.sub(
            r'(<meta property="og:image" content="[^"]*">)',
            r'\1' + tw,
            html, count=1
        )
        changed = True

    # ── Guard 2: dateModified ─────────────────────────────────────────────────
    if '"dateModified"' not in html:
        m = re.search(r'("datePublished":\s*"([^"]*)")', html)
        if m:
            html = html.replace(
                m.group(1),
                m.group(1) + ',\n  "dateModified": "' + m.group(2) + '"',
                1
            )
            changed = True

    # ── Guard 3: author @id ───────────────────────────────────────────────────
    BEFORE = '    "@type": "Person",\n    "name": "蒲朝棟 Tim"'
    AFTER  = ('    "@type": "Person",\n'
              '    "@id": "https://www.careerssl.com/#person",\n'
              '    "name": "蒲朝棟 Tim"')
    if '"@id": "https://www.careerssl.com/#person"' not in html and BEFORE in html:
        html = html.replace(BEFORE, AFTER, 1)
        changed = True

    # ── Guard 4: BreadcrumbList ───────────────────────────────────────────────
    if 'BreadcrumbList' not in html:
        can = re.search(r'<link rel="canonical" href="([^"]*)">', html)
        ttl = re.search('<title>(.+?)｜職涯停看聽', html)
        if can and ttl:
            title_esc = json.dumps(ttl.group(1).strip())[1:-1]
            url_esc   = json.dumps(can.group(1))[1:-1]
            bc = (
                f'\n<script type="application/ld+json">\n'
                f'{{"@context":"https://schema.org","@type":"BreadcrumbList",'
                f'"itemListElement":['
                f'{{"@type":"ListItem","position":1,"name":"\u9996\u9801","item":"https://www.careerssl.com/"}},'
                f'{{"@type":"ListItem","position":2,"name":"\u6587\u7ae0","item":"https://www.careerssl.com/blog/"}},'
                f'{{"@type":"ListItem","position":3,"name":"{title_esc}","item":"{url_esc}"}}'
                f']}}\n</script>'
            )
            # lambda 避免 re.sub 把 bc 中的 \1 誤解為反向參照
            html = re.sub(
                r'(</script>)(\s*\n\s*<style>)',
                lambda m: m.group(1) + bc + m.group(2),
                html, count=1
            )
            changed = True
        else:
            print(f'WARNING: canonical/title not found in {fname}')

    if changed:
        if not DRY_RUN:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(html)
        print(f'{"[DRY]" if DRY_RUN else "Updated"}: {fname}')
        updated += 1
    else:
        already_done += 1

print(f'\nDone. Updated={updated}, already_done={already_done}, skipped={skipped}')
if DRY_RUN:
    print('[DRY RUN] 沒有實際寫入任何檔案')
