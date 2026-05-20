#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SEO Phase 1 — Title 優化腳本（方案 A）
邏輯：取 title 第一句（首個句號前）+ 品牌後綴，縮短至 ≤ 60 字
修改範圍：<title> / og:title / twitter:title（H1 不動）

用法：
  python batch_fix_title_a.py          # dry run，只印不改
  python batch_fix_title_a.py --write  # 實際寫入
"""

import os
import re
import sys
from glob import glob

BLOG_DIR = os.path.join(os.path.dirname(__file__), 'blog')
BRAND = '｜職涯停看聽 Tim'
MAX_LEN = 60
TRIM_LEN = 48  # 超長時保留前 48 字 + …

SENTENCE_END = re.compile(r'[。？！]')


def shorten_title(title: str) -> str:
    """方案 A：取第一句 + 品牌後綴"""
    # 移除尾部品牌
    core = title
    if core.endswith(BRAND):
        core = core[:-len(BRAND)].rstrip()

    # 取第一句（句號/問號/驚嘆號前）
    m = SENTENCE_END.search(core)
    if m:
        first = core[: m.start()]  # 句號前的文字（不含句號）
    else:
        first = core  # 無句號 → 直接用全文

    # 若第一句仍過長，截斷
    if len(first) + len(BRAND) > MAX_LEN:
        first = first[:TRIM_LEN] + '…'

    return first + BRAND


def process_file(filepath: str, write: bool) -> dict | None:
    with open(filepath, encoding='utf-8', errors='ignore') as f:
        html = f.read()

    # 取 <title> 內容
    title_match = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
    if not title_match:
        return None

    old_title = title_match.group(1).strip()
    if len(old_title) <= MAX_LEN:
        return None  # 不需修改

    new_title = shorten_title(old_title)
    if new_title == old_title:
        return None

    result = {
        'file': os.path.basename(filepath),
        'old': old_title,
        'new': new_title,
        'old_len': len(old_title),
        'new_len': len(new_title),
    }

    if write:
        # 同步更新 <title>、og:title、twitter:title
        # 只替換與舊 title 完全一致的 og:title / twitter:title
        new_html = re.sub(
            r'(<title[^>]*>)' + re.escape(old_title) + r'(</title>)',
            r'\g<1>' + new_title + r'\2',
            html, flags=re.IGNORECASE
        )
        new_html = re.sub(
            r'(property=["\']og:title["\'][^>]*content=["\'])' + re.escape(old_title) + r'(["\'])',
            r'\g<1>' + new_title + r'\2',
            new_html, flags=re.IGNORECASE
        )
        new_html = re.sub(
            r'(content=["\'])' + re.escape(old_title) + r'(["\'][^>]*property=["\']og:title["\'])',
            r'\g<1>' + new_title + r'\2',
            new_html, flags=re.IGNORECASE
        )
        new_html = re.sub(
            r'(name=["\']twitter:title["\'][^>]*content=["\'])' + re.escape(old_title) + r'(["\'])',
            r'\g<1>' + new_title + r'\2',
            new_html, flags=re.IGNORECASE
        )
        new_html = re.sub(
            r'(content=["\'])' + re.escape(old_title) + r'(["\'][^>]*name=["\']twitter:title["\'])',
            r'\g<1>' + new_title + r'\2',
            new_html, flags=re.IGNORECASE
        )
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_html)

    return result


def main():
    write_mode = '--write' in sys.argv
    mode_label = '【實際寫入】' if write_mode else '【Dry Run — 只印不改】'
    print(f'Title 優化腳本 方案 A — {mode_label}\n')

    html_files = sorted(glob(os.path.join(BLOG_DIR, '*.html')))
    changes = []

    for fp in html_files:
        r = process_file(fp, write=write_mode)
        if r:
            changes.append(r)

    if not changes:
        print('沒有需要修改的檔案。')
        return

    print(f'需修改：{len(changes)} 篇\n')
    for i, c in enumerate(changes, 1):
        print(f'{i:02d}. {c["file"]}')
        print(f'    舊 [{c["old_len"]}字]：{c["old"]}')
        print(f'    新 [{c["new_len"]}字]：{c["new"]}')
        print()

    if write_mode:
        print(f'✅ 已寫入 {len(changes)} 篇。請執行 git add + commit + push。')
    else:
        print('=== Dry Run 完成，確認無誤後執行：python batch_fix_title_a.py --write ===')


if __name__ == '__main__':
    main()
