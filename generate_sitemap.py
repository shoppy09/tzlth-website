#!/usr/bin/env python3
"""
generate_sitemap.py — union 策略補全 sitemap.xml

WHY（2026-06-21 建立）：
  發布流程（add_article.py / publish_scheduled.py）原本不更新 sitemap.xml，
  導致每篇新文章都不會進 sitemap（自 2026-04-30 起累積 30 篇缺席）。

設計（union / append，不從頭重生）：
  - 保留 sitemap.xml 現有「全部」entry 原樣（含 Phase 2.9 SEO slug + orphan + 431 hash-URL）
    → 避免「從 articles.json 重生」把 Phase 2.9 遷移的 SEO slug 打回 hash-URL 的回歸。
  - 只「補入」articles.json 中、URL 尚未出現在 sitemap 的文章（priority 0.7 / monthly / lastmod=文章 date）。
  - 冪等：重複執行不會重複加入。
  - 不加入 blog/scheduled/ 的未來文章（它們不在 articles.json，發布時才由 publish_scheduled.py 加入後再呼叫本腳本）。

用法：python generate_sitemap.py   （由發布流程末尾自動呼叫，或手動執行）
"""
import json
import re
from pathlib import Path

REPO = Path(__file__).parent
SITEMAP = REPO / "sitemap.xml"
ARTICLES_JSON = REPO / "blog" / "articles.json"
BASE = "https://www.careerssl.com/blog/"


def main():
    sitemap = SITEMAP.read_text(encoding="utf-8")
    existing_locs = set(re.findall(r"<loc>([^<]+)</loc>", sitemap))

    arts = json.loads(ARTICLES_JSON.read_text(encoding="utf-8"))
    if isinstance(arts, dict):
        arts = arts.get("articles", list(arts.values()))

    new_entries = []
    for a in arts:
        slug = a.get("slug") or a.get("id") or ""
        if not slug:
            continue
        url = f"{BASE}{slug}.html"
        if url in existing_locs:
            continue  # 已在 sitemap（含 431 hash-URL），不重複
        lastmod = a.get("date") or "2026-01-01"
        entry = (
            f'  <url><loc>{url}</loc><lastmod>{lastmod}</lastmod>'
            f'<changefreq>monthly</changefreq><priority>0.7</priority></url>'
        )
        new_entries.append(entry)
        existing_locs.add(url)  # 防同次重複

    if not new_entries:
        print("[generate_sitemap] sitemap 已涵蓋全部 articles.json，無新增。")
        return 0

    # 在 </urlset> 之前插入新 entry（保留現有全部不動）
    insert = "\n".join(new_entries) + "\n"
    updated = sitemap.replace("</urlset>", insert + "</urlset>")
    SITEMAP.write_text(updated, encoding="utf-8")
    print(f"[generate_sitemap] 補入 {len(new_entries)} 筆，sitemap 總 entry：{len(re.findall(r'<loc>', updated))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
