#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
batch_cluster_b_links.py — Cluster B 批量內鏈補強腳本 v1.0
建立日期：2026-05-03
用途：
  1. 在 Cluster B 文章 <head> 加入 <meta name="cluster" content="B">
  2. 在 author-box 前插入「延伸閱讀」block（含基石文章連結）
  3. 輸出處理結果摘要

Cluster B 定義：面試 × 薪資談判（56 篇）
關鍵字篩選：面試 / 履歷 / 薪 / 求職 / 找工作 / 投遞 / STAR / 自我介紹 / 反問 / 試用期 / 錄取 / 薪資

執行方式：
  cd C:/Users/USER/Desktop/職涯停看聽_網站
  python batch_cluster_b_links.py [--dry-run] [--limit N]

選項：
  --dry-run   不實際寫入，只印出哪些檔案會被修改
  --limit N   只處理前 N 篇（測試用，預設處理全部）
"""

import json
import re
import os
import sys
import argparse
from pathlib import Path

# ── 設定 ──────────────────────────────────────────────────
BLOG_DIR = Path(__file__).parent / "blog"
ARTICLES_JSON = BLOG_DIR / "articles.json"
PILLAR_SLUG = "pillar-interview-star-salary-guide"
PILLAR_URL = f"/blog/{PILLAR_SLUG}.html"
PILLAR_TITLE = "高薪面試全攻略：STAR-D 框架 × 薪資談判策略（2026 最新版）"

# Cluster B 篩選關鍵字（比對文章 title）
CLUSTER_B_KEYWORDS = [
    '面試', '履歷', '薪', '求職', '找工作', '投遞', 'STAR',
    '自我介紹', '反問', '試用期', '錄取', '薪資'
]

# 延伸閱讀 block 中顯示的支持文章（除基石文章外，最多顯示 2 篇）
SUPPORT_ARTICLES = [
    {
        "url": "/blog/69893278fd897800011abd50.html",
        "title": "面試談薪水，先開口談錢就輸了？揭開薪資談判的心理陷阱"
    },
    {
        "url": "/blog/6943e7d6fd8978000195cc8f.html",
        "title": "面試如何掌握主動權？從「被面試」到「面試公司」的翻轉關鍵"
    }
]

# 延伸閱讀 HTML block 模板
EXTENDED_READING_BLOCK = """
<hr>
<div class="extended-reading-cluster">
  <p style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#C4622D;margin-bottom:12px;font-weight:500;">延伸閱讀</p>
  <p style="font-family:'Playfair Display',serif;font-size:17px;font-weight:600;color:#1C1C1A;margin-bottom:16px;">面試 × 薪資談判完整攻略</p>
  <ul style="list-style:none;padding:0;margin:0;border:1px solid #D8D3C8;border-radius:12px;overflow:hidden;">
    <li style="border-bottom:1px solid #D8D3C8;">
      <a href="{pillar_url}" style="display:flex;align-items:flex-start;gap:10px;padding:14px 20px;color:#3A3A37;text-decoration:none;font-size:15px;line-height:1.5;transition:color .2s;">
        <span style="color:#C4622D;flex-shrink:0;">🔖</span>
        <span>【基石文章】{pillar_title}</span>
      </a>
    </li>
    {support_items}
  </ul>
</div>
"""

SUPPORT_ITEM_TEMPLATE = """    <li style="border-bottom:1px solid #D8D3C8;">
      <a href="{url}" style="display:flex;align-items:flex-start;gap:10px;padding:14px 20px;color:#3A3A37;text-decoration:none;font-size:15px;line-height:1.5;transition:color .2s;">
        <span style="color:#C4622D;flex-shrink:0;">→</span>
        <span>{title}</span>
      </a>
    </li>"""

SUPPORT_ITEM_LAST_TEMPLATE = """    <li>
      <a href="{url}" style="display:flex;align-items:flex-start;gap:10px;padding:14px 20px;color:#3A3A37;text-decoration:none;font-size:15px;line-height:1.5;transition:color .2s;">
        <span style="color:#C4622D;flex-shrink:0;">→</span>
        <span>{title}</span>
      </a>
    </li>"""


def is_cluster_b(title: str) -> bool:
    """判斷文章是否屬於 Cluster B"""
    return any(kw in title for kw in CLUSTER_B_KEYWORDS)


def build_extended_reading_block() -> str:
    """生成延伸閱讀 HTML block"""
    support_items = ""
    for i, art in enumerate(SUPPORT_ARTICLES):
        tmpl = SUPPORT_ITEM_LAST_TEMPLATE if i == len(SUPPORT_ARTICLES) - 1 else SUPPORT_ITEM_TEMPLATE
        support_items += tmpl.format(url=art["url"], title=art["title"])
    return EXTENDED_READING_BLOCK.format(
        pillar_url=PILLAR_URL,
        pillar_title=PILLAR_TITLE,
        support_items=support_items
    )


def process_article(slug: str, title: str, dry_run: bool) -> dict:
    """
    處理單篇文章：
    1. 加入 cluster meta tag
    2. 插入 延伸閱讀 block（author-box 前）
    回傳：{'slug': ..., 'status': 'ok'|'skip'|'error', 'reason': ...}
    """
    html_path = BLOG_DIR / f"{slug}.html"

    if not html_path.exists():
        return {"slug": slug, "status": "skip", "reason": "HTML 檔案不存在"}

    try:
        content = html_path.read_text(encoding="utf-8")
    except Exception as e:
        return {"slug": slug, "status": "error", "reason": f"讀取失敗: {e}"}

    original = content
    changed = False

    # ── Step 1：加 cluster meta tag ──────────────────────────
    if 'name="cluster"' not in content:
        # 插入到 <link rel="canonical"> 前（保持 head 整潔）
        canonical_match = re.search(r'<link rel="canonical"', content)
        if canonical_match:
            insert_pos = canonical_match.start()
            cluster_meta = '<meta name="cluster" content="B">\n'
            content = content[:insert_pos] + cluster_meta + content[insert_pos:]
            changed = True
    # else: 已有 cluster meta，跳過

    # ── Step 2：插入 延伸閱讀 block（author-box 前）──────────
    # 跳過基石文章本身
    if slug == PILLAR_SLUG:
        return {"slug": slug, "status": "skip", "reason": "基石文章本身，跳過"}

    # 判斷是否已有延伸閱讀 block
    if 'extended-reading-cluster' in content:
        # 已有延伸閱讀，只做 cluster meta（如果需要的話，上面已處理）
        if changed:
            if not dry_run:
                html_path.write_text(content, encoding="utf-8")
            return {"slug": slug, "status": "ok", "reason": "新增 cluster meta（延伸閱讀已存在）"}
        else:
            return {"slug": slug, "status": "skip", "reason": "cluster meta 和延伸閱讀已存在"}

    # 找到 author-box 插入點
    author_box_match = re.search(r'<div class="author-box">', content)
    if not author_box_match:
        # 嘗試找到 article-cta（有些舊文章可能沒有 author-box）
        article_cta_match = re.search(r'<div class="article-cta">', content)
        if not article_cta_match:
            return {"slug": slug, "status": "skip", "reason": "找不到 author-box 或 article-cta，跳過"}
        insert_pos = article_cta_match.start()
    else:
        insert_pos = author_box_match.start()

    extended_block = build_extended_reading_block()
    content = content[:insert_pos] + extended_block + "\n  " + content[insert_pos:]
    changed = True

    if not dry_run:
        html_path.write_text(content, encoding="utf-8")

    return {"slug": slug, "status": "ok", "reason": "新增 cluster meta + 延伸閱讀 block"}


def main():
    parser = argparse.ArgumentParser(description="Cluster B 批量內鏈補強腳本")
    parser.add_argument("--dry-run", action="store_true", help="不實際寫入，只印出結果")
    parser.add_argument("--limit", type=int, default=0, help="只處理前 N 篇（0 = 全部）")
    args = parser.parse_args()

    if not ARTICLES_JSON.exists():
        print(f"❌ 找不到 articles.json：{ARTICLES_JSON}")
        sys.exit(1)

    articles = json.loads(ARTICLES_JSON.read_text(encoding="utf-8"))
    print(f"📋 總文章數：{len(articles)}")

    # 篩選 Cluster B
    cluster_b_articles = [a for a in articles if is_cluster_b(a.get("title", ""))]
    print(f"🎯 Cluster B 文章數：{len(cluster_b_articles)}")

    if args.limit > 0:
        cluster_b_articles = cluster_b_articles[:args.limit]
        print(f"⚙️  限制處理前 {args.limit} 篇")

    if args.dry_run:
        print("🔍 DRY-RUN 模式：不會實際寫入\n")

    # 處理每篇文章
    results = {"ok": [], "skip": [], "error": []}
    for i, art in enumerate(cluster_b_articles, 1):
        slug = art.get("slug", "")
        title = art.get("title", "")
        result = process_article(slug, title, args.dry_run)
        status = result["status"]
        results[status].append(result)
        icon = {"ok": "✅", "skip": "⏭ ", "error": "❌"}[status]
        print(f"{icon} [{i:2d}] {slug[:50]:<50} | {result['reason']}")

    # 摘要
    print()
    print("=" * 70)
    print(f"✅ 成功修改：{len(results['ok'])} 篇")
    print(f"⏭  跳過：   {len(results['skip'])} 篇")
    print(f"❌ 錯誤：   {len(results['error'])} 篇")
    if args.dry_run:
        print("\n💡 DRY-RUN 完成。移除 --dry-run 後重新執行以實際寫入。")
    else:
        print(f"\n🎉 完成！請執行：python batch_update_all_articles.py")
        print("   接著：npx vercel --prod")


if __name__ == "__main__":
    main()
