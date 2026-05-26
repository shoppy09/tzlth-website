#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SEO 複診腳本 v2.0 — Phase 2.7b 根因診斷（只讀不改）
在 v1.0 基礎上新增：
  E. H2 數量（Phase 2.7 標準：≥3）
  F. 正文字數（CJK 字元數，< 200 = thin content 風險）
  G. 薄內容根因分類（thin / ok / rich）

WHY：93 頁「已爬未收錄」的修復方向取決於根本原因：
  - thin content（CJK < 200）→ 補 H2 + 加正文內容
  - duplicate / near-dup（標題雷同）→ 合併或差異化改寫
  - H2 不足（< 3）→ 補 H2 段落標題即可
"""

import os
import re
from glob import glob
from collections import defaultdict

BLOG_DIR = os.path.join(os.path.dirname(__file__), 'blog')

QUESTION_PATTERNS = re.compile(
    r'<h2[^>]*>([^<]*(?:嗎|呢|什麼|如何|為什麼|怎麼|哪些|有沒有|可以|需要|是否|幾)[^<]*)</h2>',
    re.IGNORECASE
)

CJK_PATTERN = re.compile(r'[一-鿿㐀-䶿 0-⩭f＀-￯]')

THIN_THRESHOLD = 200   # CJK chars < 200 → thin content 風險
OK_THRESHOLD = 500     # CJK chars 200-500 → 可接受但偏短
H2_MIN = 3             # Phase 2.7 標準


def analyze_file(filepath):
    with open(filepath, encoding='utf-8', errors='ignore') as f:
        html = f.read()

    result = {
        'filename': os.path.basename(filepath),
        # Original v1.0 fields
        'img_missing_alt': 0,
        'img_empty_alt': 0,
        'img_has_alt': 0,
        'title_len': 0,
        'title_text': '',
        'has_faq_schema': False,
        'question_h2_count': 0,
        # New v2.0 fields
        'h2_count': 0,
        'cjk_chars': 0,
        'content_tier': '',   # 'thin' / 'short' / 'ok'
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

    # C. FAQ Schema
    result['has_faq_schema'] = 'FAQPage' in html

    # D. 問句 H2
    result['question_h2_count'] = len(QUESTION_PATTERNS.findall(html))

    # E. H2 總數
    result['h2_count'] = len(re.findall(r'<h2\b[^>]*>', html, re.IGNORECASE))

    # F. 正文 CJK 字元數（從 <p> 標籤萃取）
    p_texts = re.findall(r'<p[^>]*>(.*?)</p>', html, re.DOTALL | re.IGNORECASE)
    combined = ' '.join(p_texts)
    clean = re.sub(r'<[^>]+>', '', combined)
    cjk_count = len(CJK_PATTERN.findall(clean))
    result['cjk_chars'] = cjk_count

    # G. 薄內容分類
    if cjk_count < THIN_THRESHOLD:
        result['content_tier'] = 'thin'
    elif cjk_count < OK_THRESHOLD:
        result['content_tier'] = 'short'
    else:
        result['content_tier'] = 'ok'

    return result


def main():
    html_files = sorted(glob(os.path.join(BLOG_DIR, '*.html')))
    # 排除 index.html
    html_files = [f for f in html_files if os.path.basename(f) != 'index.html']
    total = len(html_files)
    print(f'掃描目標：{total} 篇文章\n')

    results = [analyze_file(fp) for fp in html_files]

    # ─── E. H2 數量統計 ─────────────────────────────────────
    h2_lt3 = [r for r in results if r['h2_count'] < H2_MIN]
    h2_zero = [r for r in results if r['h2_count'] == 0]
    h2_one = [r for r in results if r['h2_count'] == 1]
    h2_two = [r for r in results if r['h2_count'] == 2]

    print('=' * 65)
    print('E. H2 數量診斷（Phase 2.7 標準：每篇 ≥ 3 個 H2）')
    print('=' * 65)
    print(f'  H2 = 0：{len(h2_zero)} 篇')
    print(f'  H2 = 1：{len(h2_one)} 篇')
    print(f'  H2 = 2：{len(h2_two)} 篇')
    print(f'  H2 < 3（需補強）：{len(h2_lt3)} 篇 / {total} 篇')
    print(f'  H2 ≥ 3（達標）：{total - len(h2_lt3)} 篇')
    if h2_lt3:
        print(f'\n  H2 不足的前 20 篇（依 H2 數升序）：')
        for r in sorted(h2_lt3, key=lambda x: x['h2_count'])[:20]:
            print(f'    [{r["h2_count"]} H2] {r["filename"]}')

    # ─── F. 正文字數診斷 ───────────────────────────────────
    thin = [r for r in results if r['content_tier'] == 'thin']
    short = [r for r in results if r['content_tier'] == 'short']
    ok = [r for r in results if r['content_tier'] == 'ok']

    print()
    print('=' * 65)
    print('F. 正文字數診斷（CJK 字元，from <p> 標籤）')
    print('=' * 65)
    print(f'  ❌ Thin content（< {THIN_THRESHOLD} CJK 字）：{len(thin)} 篇  ← 主要根因候選')
    print(f'  ⚠️  偏短（{THIN_THRESHOLD}–{OK_THRESHOLD} CJK 字）：{len(short)} 篇')
    print(f'  ✅ 正常（≥ {OK_THRESHOLD} CJK 字）：{len(ok)} 篇')

    if thin:
        print(f'\n  Thin content 前 20 篇（依字數升序）：')
        for r in sorted(thin, key=lambda x: x['cjk_chars'])[:20]:
            print(f'    [{r["cjk_chars"]:4d} CJK, {r["h2_count"]} H2] {r["filename"]}')

    # ─── G. 「已爬未收錄」根因交叉分析 ─────────────────────
    # 有 H2<3 AND thin → 最嚴重，需加內容+H2
    # 有 thin only（H2 其實夠）→ 加正文內容
    # 有 H2<3 only（字數夠）→ 只需補 H2
    both_issue = [r for r in results if r['h2_count'] < H2_MIN and r['content_tier'] == 'thin']
    thin_only = [r for r in results if r['h2_count'] >= H2_MIN and r['content_tier'] == 'thin']
    h2_only = [r for r in results if r['h2_count'] < H2_MIN and r['content_tier'] != 'thin']

    print()
    print('=' * 65)
    print('G. 根因交叉分析（修復方向對照）')
    print('=' * 65)
    print(f'  ① H2 不足 + Thin content（雙重問題）：{len(both_issue)} 篇')
    print(f'     → 修復：補 H2 標題 + 加正文字數')
    print(f'  ② Thin content（H2 已達標）：{len(thin_only)} 篇')
    print(f'     → 修復：加正文字數（或考慮合併相似文章）')
    print(f'  ③ H2 不足（字數正常）：{len(h2_only)} 篇')
    print(f'     → 修復：補 H2 段落標題（Phase 2.7 做法）')
    print(f'  ④ 正常（字數+H2 均達標）：{total - len(both_issue) - len(thin_only) - len(h2_only)} 篇')
    print(f'     → 已爬未收錄若在此類，根因可能是 duplicate content 或技術問題')

    if both_issue:
        print(f'\n  ① 雙重問題清單（前 15 篇）：')
        for r in sorted(both_issue, key=lambda x: x['cjk_chars'])[:15]:
            print(f'    [{r["cjk_chars"]:4d} CJK, {r["h2_count"]} H2] {r["filename"]}')

    # ─── 總結 ────────────────────────────────────────────────
    print()
    print('=' * 65)
    print('總結')
    print('=' * 65)
    print(f'  文章總數：{total}')
    print(f'  E. H2 < 3（需補強）：{len(h2_lt3)} 篇')
    print(f'  F. Thin content（< {THIN_THRESHOLD} CJK）：{len(thin)} 篇')
    print(f'  G. 雙重問題：{len(both_issue)} 篇 | Thin only：{len(thin_only)} 篇 | H2 only：{len(h2_only)} 篇')
    print()
    print('Phase 2.7b 建議執行順序：')
    print(f'  1. 優先處理「① 雙重問題」{len(both_issue)} 篇（批量補 H2；正文視情況加）')
    print(f'  2. 再處理「③ H2 不足」{len(h2_only)} 篇（批量補 H2，成本低）')
    print(f'  3. 評估「② Thin only」{len(thin_only)} 篇（可能為 duplicate，需人工抽查）')


if __name__ == '__main__':
    main()
