#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 2.8 — 壞連結掃描腳本（只讀不改）
掃描 blog/*.html 中的所有內部連結，驗證目標檔案是否存在。

WHY：@freeshiuan SEO 框架四步驟之一（壞連結修復）。
     內部死連結影響爬取效率，Google 遇到 404 會降低對該頁面的評分。

偵測範圍：
  1. /blog/SLUG.html → 確認 blog/SLUG.html 存在
  2. /services/SLUG  → 確認 services/SLUG.html 或 services/SLUG/index.html 存在
  3. / (首頁) 及錨點 → 不驗證（永遠存在）
  4. 外部 URL（https://）→ 不驗證（留給 Tim 手動確認）
  5. #anchor → 不驗證

輸出：
  - 壞連結清單（source 文章, 壞連結 href）
  - 統計摘要
"""

import os
import re
from glob import glob
from collections import defaultdict

SITE_DIR = os.path.dirname(os.path.abspath(__file__))
BLOG_DIR = os.path.join(SITE_DIR, 'blog')

# 不驗證的前綴
SKIP_PREFIXES = (
    'http://', 'https://', 'mailto:', 'tel:', 'javascript:',
    '#',  # 錨點
)

# 首頁錨點（確認存在）
HOME_ANCHORS = {'/', '/#services', '/#booking', '/#blog', '/#contact',
                '/#ai-tool', '/#lead', '/#cases', '/#quiz'}


def resolve_path(href, site_dir):
    """將 href 轉換為本地絕對路徑"""
    # 移除 query string 和 fragment
    href_clean = href.split('?')[0].split('#')[0].strip()
    if not href_clean or href_clean == '/':
        return None  # 首頁，跳過

    if href_clean.startswith('/'):
        # 絕對路徑：/blog/xxx.html, /services/xxx, etc.
        local_path = os.path.join(site_dir, href_clean.lstrip('/'))
    else:
        # 相對路徑（少見，但處理）
        local_path = os.path.join(BLOG_DIR, href_clean)

    return os.path.normpath(local_path)


def check_exists(local_path):
    """檢查檔案或目錄是否存在（含 .html 擴展名嘗試）"""
    if os.path.exists(local_path):
        return True
    # 嘗試加 .html
    if os.path.exists(local_path + '.html'):
        return True
    # 嘗試 index.html
    if os.path.exists(os.path.join(local_path, 'index.html')):
        return True
    return False


def analyze_file(filepath):
    """提取所有內部連結並驗證"""
    with open(filepath, encoding='utf-8', errors='ignore') as f:
        html = f.read()

    filename = os.path.basename(filepath)
    broken = []
    total_internal = 0

    # 提取所有 href
    hrefs = re.findall(r'<a\b[^>]*\bhref\s*=\s*["\']([^"\']+)["\']', html, re.IGNORECASE)

    for href in hrefs:
        href = href.strip()

        # 跳過外部連結、錨點、特殊協議
        if any(href.startswith(p) for p in SKIP_PREFIXES):
            continue

        # 跳過首頁錨點
        if href in HOME_ANCHORS:
            continue

        # 只檢查內部路徑
        if href.startswith('/') or not href.startswith('http'):
            total_internal += 1
            local_path = resolve_path(href, SITE_DIR)
            if local_path and not check_exists(local_path):
                broken.append(href)

    return filename, broken, total_internal


def main():
    html_files = sorted(glob(os.path.join(BLOG_DIR, '*.html')))
    html_files = [f for f in html_files if os.path.basename(f) != 'index.html']
    total_files = len(html_files)
    print(f'掃描目標：{total_files} 篇文章\n')

    all_broken = defaultdict(list)   # source_file → [broken_href, ...]
    total_internal_links = 0
    total_broken = 0
    files_with_broken = 0

    # 掃描所有 pillar 頁 + index.html 也納入檢查
    extra_files = sorted(glob(os.path.join(SITE_DIR, 'pillar-*.html')))
    extra_files += [os.path.join(SITE_DIR, 'index.html')]
    all_scan_files = html_files + [f for f in extra_files if os.path.exists(f)]

    for fp in all_scan_files:
        filename, broken, internal_count = analyze_file(fp)
        total_internal_links += internal_count
        if broken:
            all_broken[filename] = broken
            total_broken += len(broken)
            files_with_broken += 1

    # ─── 輸出報告 ───────────────────────────────────────────
    print('=' * 65)
    print('Phase 2.8 — 內部壞連結掃描報告')
    print('=' * 65)
    print(f'  掃描檔案：{len(all_scan_files)} 個（blog + pillar + index）')
    print(f'  內部連結總數：{total_internal_links}')
    print(f'  壞連結數量：{total_broken}')
    print(f'  受影響文章：{files_with_broken} 篇')

    if not all_broken:
        print('\n  ✅ 沒有發現壞連結！')
    else:
        print(f'\n  ❌ 壞連結清單：')
        # 按壞連結數降序排序
        for src, links in sorted(all_broken.items(), key=lambda x: -len(x[1])):
            print(f'\n  [{len(links)} 個壞連結] {src}')
            for link in links[:10]:  # 每篇最多顯示 10 個
                print(f'    → {link}')
            if len(links) > 10:
                print(f'    ... 還有 {len(links) - 10} 個')

        # 壞連結 URL 統計（找出哪些目標被多篇文章連結）
        href_count = defaultdict(list)
        for src, links in all_broken.items():
            for link in links:
                href_count[link].append(src)

        if href_count:
            print(f'\n  最常出現的壞連結目標（被多篇文章連結）：')
            for href, sources in sorted(href_count.items(), key=lambda x: -len(x[1]))[:10]:
                print(f'    {href}（被 {len(sources)} 篇引用）')

    print()
    print('=' * 65)
    print('修復建議')
    print('=' * 65)
    if total_broken == 0:
        print('  ✅ 無需修復，內部連結健康')
    else:
        print('  1. 確認壞連結是否為已刪除頁面 → 若是，移除連結')
        print('  2. 確認是否為路徑錯誤 → 若是，修正 href')
        print('  3. 確認是否為尚未建立頁面 → 若是，建立或移除連結')
        print('  4. 修復後重跑此腳本確認 0 壞連結')


if __name__ == '__main__':
    main()
