#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SEO 複診腳本 v1.0 — Phase 0 診斷（只讀不改）
掃描 blog/*.html，輸出四項缺口統計：
  A. 圖片 alt text 狀況
  B. <title> 字數（> 60 字）
  C. FAQ Schema 覆蓋率
  D. 問句 H2 候選（FAQ Schema 適用對象）
"""

import os
import re
from glob import glob
from collections import defaultdict

BLOG_DIR = os.path.join(os.path.dirname(__file__), 'blog')

# 問句偵測：中文問句 H2
QUESTION_PATTERNS = re.compile(
    r'<h2[^>]*>([^<]*(?:嗎|呢|什麼|如何|為什麼|怎麼|哪些|有沒有|可以|需要|是否|幾)[^<]*)</h2>',
    re.IGNORECASE
)

def analyze_file(filepath):
    with open(filepath, encoding='utf-8', errors='ignore') as f:
        html = f.read()

    result = {
        'filename': os.path.basename(filepath),
        'img_missing_alt': 0,   # 完全沒有 alt 屬性
        'img_empty_alt': 0,     # alt="" 裝飾性圖片（跳過）
        'img_has_alt': 0,       # 已有 alt 文字
        'title_len': 0,
        'title_text': '',
        'has_faq_schema': False,
        'question_h2_count': 0,
    }

    # A. 圖片 alt 分析
    img_tags = re.findall(r'<img\b[^>]*>', html, re.IGNORECASE)
    for tag in img_tags:
        alt_match = re.search(r'\balt\s*=\s*(["\'])([^"\']*)\1', tag, re.IGNORECASE)
        if alt_match is None:
            result['img_missing_alt'] += 1
        elif alt_match.group(2).strip() == '':
            result['img_empty_alt'] += 1
        else:
            result['img_has_alt'] += 1

    # B. <title> 字數
    title_match = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
    if title_match:
        title_text = title_match.group(1).strip()
        result['title_text'] = title_text
        result['title_len'] = len(title_text)

    # C. FAQ Schema 是否存在
    result['has_faq_schema'] = 'FAQPage' in html

    # D. 問句 H2（FAQ Schema 候選）
    result['question_h2_count'] = len(QUESTION_PATTERNS.findall(html))

    return result


def main():
    html_files = sorted(glob(os.path.join(BLOG_DIR, '*.html')))
    total = len(html_files)
    print(f'掃描目標：{total} 篇文章\n')

    stats = {
        'img_missing_alt_total': 0,
        'img_empty_alt_total': 0,
        'img_has_alt_total': 0,
        'files_with_missing_alt': 0,
        'title_over_60': [],
        'faq_schema_count': 0,
        'question_h2_files': 0,
        'question_h2_total': 0,
    }

    # 詳細列表（只記錄有問題的）
    missing_alt_files = []
    long_title_files = []
    faq_candidates = []

    for fp in html_files:
        r = analyze_file(fp)

        # A. alt text
        stats['img_missing_alt_total'] += r['img_missing_alt']
        stats['img_empty_alt_total'] += r['img_empty_alt']
        stats['img_has_alt_total'] += r['img_has_alt']
        if r['img_missing_alt'] > 0:
            stats['files_with_missing_alt'] += 1
            missing_alt_files.append((r['filename'], r['img_missing_alt']))

        # B. title
        if r['title_len'] > 60:
            stats['title_over_60'].append((r['filename'], r['title_len'], r['title_text']))

        # C. FAQ Schema
        if r['has_faq_schema']:
            stats['faq_schema_count'] += 1

        # D. 問句 H2
        if r['question_h2_count'] > 0:
            stats['question_h2_files'] += 1
            stats['question_h2_total'] += r['question_h2_count']
            faq_candidates.append((r['filename'], r['question_h2_count']))

    # ─── 輸出報告 ───────────────────────────────────────────────
    print('=' * 60)
    print('A. 圖片 alt text 診斷')
    print('=' * 60)
    img_total = stats['img_missing_alt_total'] + stats['img_empty_alt_total'] + stats['img_has_alt_total']
    print(f'  圖片總數：{img_total}')
    print(f'  ✅ 已有 alt 文字：{stats["img_has_alt_total"]}')
    print(f'  ⚠️  alt="" 裝飾性（不需補）：{stats["img_empty_alt_total"]}')
    print(f'  ❌ 缺少 alt 屬性：{stats["img_missing_alt_total"]}（影響 {stats["files_with_missing_alt"]} 篇）')
    if missing_alt_files:
        print(f'\n  缺 alt 最多的前 10 篇：')
        for fn, cnt in sorted(missing_alt_files, key=lambda x: -x[1])[:10]:
            print(f'    {fn}：{cnt} 張')

    print()
    print('=' * 60)
    print('B. <title> 字數診斷（> 60 字 = Google 截斷風險）')
    print('=' * 60)
    print(f'  title > 60 字的文章：{len(stats["title_over_60"])} / {total} 篇')
    if stats['title_over_60']:
        print(f'\n  前 10 篇：')
        for fn, ln, txt in sorted(stats['title_over_60'], key=lambda x: -x[1])[:10]:
            print(f'    [{ln}字] {fn}')
            print(f'    → {txt[:80]}...' if len(txt) > 80 else f'    → {txt}')

    print()
    print('=' * 60)
    print('C. FAQ Schema 覆蓋率')
    print('=' * 60)
    print(f'  已有 FAQPage Schema：{stats["faq_schema_count"]} / {total} 篇')
    print(f'  尚未覆蓋：{total - stats["faq_schema_count"]} 篇')

    print()
    print('=' * 60)
    print('D. 問句 H2 候選（FAQ Schema 適用對象）')
    print('=' * 60)
    print(f'  含問句 H2 的文章：{stats["question_h2_files"]} 篇（共 {stats["question_h2_total"]} 個問句 H2）')
    if faq_candidates:
        print(f'\n  問句 H2 最多的前 10 篇（優先補 Schema）：')
        for fn, cnt in sorted(faq_candidates, key=lambda x: -x[1])[:10]:
            print(f'    {fn}：{cnt} 個問句 H2')

    print()
    print('=' * 60)
    print('總結')
    print('=' * 60)
    print(f'  文章總數：{total}')
    print(f'  A. 需補 alt：{stats["img_missing_alt_total"]} 張圖（{stats["files_with_missing_alt"]} 篇）')
    print(f'  B. title 過長：{len(stats["title_over_60"])} 篇')
    print(f'  C. FAQ Schema 缺口：{total - stats["faq_schema_count"]} 篇（候選 {stats["question_h2_files"]} 篇）')
    print()
    print('建議執行順序（依 ROI）：')
    print('  1. title/meta description 優化（CTR 直接影響）')
    print('  2. alt text 批量補全（上下文推斷法）')
    print('  3. FAQ Schema 注入（有問句 H2 的篇章）')


if __name__ == '__main__':
    main()
