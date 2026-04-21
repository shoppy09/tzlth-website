#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Batch-update the 10 SEO article HTML files with:
   1. Optimised font loading (media=print onload)
   2. Email subscription box (between author-box and article-cta)
   3. Related articles section (before article-nav)
   4. article-extras.js script tag (before </body>)
   5. Extra CSS for email-sub-box and related-articles
"""
import os, re

BLOG_DIR = r'C:\Users\USER\Desktop\職涯停看聽_網站\blog'

SEO_SLUGS = [
    'resume-no-response',
    'career-change-three-questions',
    'final-round-rejected',
    'resume-achievement-writing',
    'salary-negotiation',
    'five-years-no-strength',
    'interview-strengths-weaknesses',
    'stay-or-leave',
    'cross-industry-transfer',
    'what-is-career-consultant',
]

FONT_OLD = ('<link href="https://fonts.googleapis.com/css2?family=Playfair+'
            'Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;'
            '500&display=swap" rel="stylesheet">')
FONT_NEW = ('<link href="https://fonts.googleapis.com/css2?family=Playfair+'
            'Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;'
            '500&display=swap" rel="stylesheet" media="print" onload="this.media=\'all\'">\n'
            '<noscript><link href="https://fonts.googleapis.com/css2?family=Playfair+'
            'Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;'
            '500&display=swap" rel="stylesheet"></noscript>')

EXTRA_CSS = '''
  /* EMAIL SUBSCRIPTION BOX */
  .email-sub-box { background: var(--white); border: 1px solid var(--border); border-radius: 16px; padding: 36px 40px; text-align: center; margin-bottom: 48px; }
  .email-sub-label { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); margin-bottom: 12px; }
  .email-sub-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 600; color: var(--charcoal); margin-bottom: 8px; }
  .email-sub-sub { font-size: 14px; color: var(--muted); margin-bottom: 24px; }
  .email-sub-form { display: flex; gap: 8px; max-width: 400px; margin: 0 auto; }
  .email-sub-input { flex: 1; padding: 12px 16px; border: 1.5px solid var(--border); border-radius: 8px; font-size: 14px; font-family: inherit; background: var(--cream); color: var(--charcoal); }
  .email-sub-input:focus { outline: none; border-color: var(--accent); }
  .email-sub-btn { background: var(--accent); color: var(--white); border: none; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; white-space: nowrap; transition: opacity .2s; }
  .email-sub-btn:hover { opacity: .88; }
  .email-sub-btn:disabled { opacity: .5; cursor: default; }
  .email-sub-note { font-size: 13px; margin-top: 12px; min-height: 18px; }
  @media (max-width: 480px) { .email-sub-form { flex-direction: column; } .email-sub-box { padding: 28px 20px; } }

  /* RELATED ARTICLES */
  .related-articles { margin-bottom: 48px; }
  .related-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 600; color: var(--charcoal); margin-bottom: 20px; }
  .related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .related-card { background: var(--white); border: 1px solid var(--border); border-radius: 10px; padding: 20px; text-decoration: none; color: inherit; transition: box-shadow .2s, transform .2s; display: block; }
  .related-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); transform: translateY(-2px); }
  .related-card-date { font-size: 11px; color: var(--muted); margin-bottom: 8px; }
  .related-card-title { font-size: 14px; font-weight: 500; color: var(--charcoal); line-height: 1.5; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .related-card-tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .related-card-tag { font-size: 11px; padding: 2px 8px; background: var(--cream); border-radius: 20px; color: var(--muted); }
  @media (max-width: 640px) { .related-grid { grid-template-columns: 1fr; } }'''

EMAIL_SUB_BOX = '''
  <div class="email-sub-box">
    <p class="email-sub-label">週更電子報</p>
    <p class="email-sub-title">每週一篇，職涯清醒一點</p>
    <p class="email-sub-sub">轉職策略、履歷技巧、職場思維，不定期送到信箱。</p>
    <form class="email-sub-form" id="emailSubForm">
      <input type="email" placeholder="your@email.com" required class="email-sub-input" id="emailSubInput">
      <button type="submit" class="email-sub-btn">免費訂閱</button>
    </form>
    <p class="email-sub-note" id="emailSubNote"></p>
  </div>
'''

RELATED_SECTION = '''  <div class="related-articles" id="relatedArticles" style="display:none">
    <h3 class="related-title">你可能也會想看</h3>
    <div class="related-grid" id="relatedGrid"></div>
  </div>

'''

SCRIPT_TAG = '<script src="./article-extras.js"></script>\n'

updated = 0
skipped = 0

for slug in SEO_SLUGS:
    path = os.path.join(BLOG_DIR, slug + '.html')
    if not os.path.exists(path):
        print(f'SKIP (not found): {slug}.html')
        skipped += 1
        continue

    with open(path, encoding='utf-8') as f:
        html = f.read()

    changed = False

    # 1. Font loading optimisation
    if FONT_OLD in html:
        html = html.replace(FONT_OLD, FONT_NEW, 1)
        changed = True

    # 2. Extra CSS (before closing </style>)
    if 'email-sub-box' not in html:
        html = html.replace('</style>', EXTRA_CSS + '\n</style>', 1)
        changed = True

    # 3. Email subscription box (after author-box, before article-cta)
    if 'emailSubForm' not in html:
        # Find the closing of author-box div then the start of article-cta
        marker = '  </div>\n\n  <div class="article-cta">'
        if marker in html:
            html = html.replace(marker,
                '  </div>\n' + EMAIL_SUB_BOX + '\n  <div class="article-cta">', 1)
            changed = True
        else:
            print(f'WARNING: author-box/article-cta marker not found in {slug}.html')

    # 4. Related articles section (before article-nav)
    if 'relatedArticles' not in html:
        nav_marker = '  <nav class="article-nav" aria-label="文章導覽">'
        if nav_marker in html:
            html = html.replace(nav_marker, RELATED_SECTION + nav_marker, 1)
            changed = True
        else:
            print(f'WARNING: article-nav marker not found in {slug}.html')

    # 5. article-extras.js script tag (before </body>)
    if 'article-extras.js' not in html:
        html = html.replace('</body>', SCRIPT_TAG + '</body>', 1)
        changed = True

    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f'Updated: {slug}.html')
        updated += 1
    else:
        print(f'Already up to date: {slug}.html')

print(f'\nDone. Updated {updated}, skipped {skipped}.')
