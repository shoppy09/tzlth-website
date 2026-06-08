#!/usr/bin/env python3
# migrate_phase29.py — Phase 2.9 Hash-URL → SEO Slug Migration
# 放置位置：C:\Users\USER\Desktop\職涯停看聽_網站\migrate_phase29.py

import json
from pathlib import Path

REPO = Path(r"C:\Users\USER\Desktop\職涯停看聽_網站")
BLOG_DIR = REPO / "blog"
ARTICLES_JSON = BLOG_DIR / "articles.json"
VERCEL_JSON = REPO / "vercel.json"
SITEMAP = REPO / "sitemap.xml"

SLUG_MAP = {
    "69b7ae1bfd897800012532c9": "2026-03-17-low-turnover-rate-career-trap",
    "694aa7aafd89780001d22920": "2025-12-25-boss-weekend-messages-work-boundaries",
    "69e07ed0fd89780001a7a531": "2026-04-18-gen-z-work-values-no-promotion",
    "66d40036fd89780001292ef0": "2024-09-02-overcome-laziness-life-achievement",
    "6941576afd897800010148be": "2025-12-18-salary-negotiation-hr-secrets",
    "69c372ccfd897800012896e8": "2026-03-27-bad-manager-talent-waste",
    "671de505fd89780001be1da2": "2024-10-30-good-job-phrase-termination-warning",
    "69aa6a1dfd89780001730014": "2026-03-07-verbal-promise-get-in-writing",
    "693233dafd89780001ee058d": "2025-12-06-resignation-counter-offer-stay-or-leave",
    "6966f70ffd89780001516701": "2026-01-18-people-pleaser-manager-team-failure",
    "69240d11fd8978000188c5da": "2025-11-25-interview-rejection-hidden-hiring-factors",
    "696234d5fd897800018bac5d": "2026-01-14-salary-negotiation-3-techniques",
    "696070defd897800011f527b": "2026-01-11-quiet-worker-workplace-visibility",
    "69382243fd89780001712321": "2025-12-11-new-job-different-from-interview-probation",
    "69893278fd897800011abd50": "2026-02-11-salary-negotiation-who-speaks-first",
    "6987e7befd89780001be493e": "2026-02-08-nice-person-bad-manager-hurts-team",
    "696c7621fd897800017e62d2": "2026-01-20-incompetent-manager-pua-signs",
    "66f2a984fd89780001db7ede": "2024-09-26-manage-your-boss-communication",
    "69eb669cfd89780001936a12": "2026-04-26-workplace-network-over-boss-dependency",
    "696c84f0fd89780001828486": "2026-01-20-bad-manager-3-characteristics",
}

# ── Step 1: 建立 20 個 SEO slug HTML（複製 + 替換 URL 參照）──
print("=" * 60)
print("Step 1: Creating SEO slug HTML files...")
step1_ok = 0
for hash_id, seo_slug in SLUG_MAP.items():
    src = BLOG_DIR / f"{hash_id}.html"
    dst = BLOG_DIR / f"{seo_slug}.html"
    if not src.exists():
        print(f"  ⚠️  Missing source: {hash_id}.html")
        continue
    html = src.read_text(encoding="utf-8")
    html = html.replace(f"/blog/{hash_id}.html", f"/blog/{seo_slug}.html")
    dst.write_text(html, encoding="utf-8")
    step1_ok += 1
    print(f"  ✅ {hash_id} → {seo_slug}")
print(f"Step 1 完成：{step1_ok}/20 個 HTML 建立")

# ── Step 2: 更新 articles.json（slug 欄位 hex → SEO slug）──
print("\nStep 2: Updating articles.json...")
articles = json.loads(ARTICLES_JSON.read_text(encoding="utf-8"))
step2_ok = 0
for entry in articles:
    if entry.get("slug") in SLUG_MAP:
        old = entry["slug"]
        entry["slug"] = SLUG_MAP[old]
        step2_ok += 1
        print(f"  ✅ {old} → {entry['slug']}")
ARTICLES_JSON.write_text(json.dumps(articles, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Step 2 完成：{step2_ok}/20 筆 articles.json 更新")

# ── Step 3: 更新 vercel.json（新增 20 條 301 redirect）──
print("\nStep 3: Updating vercel.json...")
vercel = json.loads(VERCEL_JSON.read_text(encoding="utf-8"))
new_redirects = [
    {
        "source": f"/blog/{hash_id}.html",
        "destination": f"/blog/{seo_slug}.html",
        "permanent": True
    }
    for hash_id, seo_slug in SLUG_MAP.items()
]
# Prepend before existing redirects (host redirect stays last)
vercel["redirects"] = new_redirects + vercel.get("redirects", [])
VERCEL_JSON.write_text(json.dumps(vercel, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Step 3 完成：新增 {len(new_redirects)} 條 301 redirect rules")

# ── Step 4: 更新 sitemap.xml（hash URL → SEO slug URL）──
print("\nStep 4: Updating sitemap.xml...")
sitemap = SITEMAP.read_text(encoding="utf-8")
step4_ok = 0
for hash_id, seo_slug in SLUG_MAP.items():
    old_url = f"https://www.careerssl.com/blog/{hash_id}.html"
    new_url = f"https://www.careerssl.com/blog/{seo_slug}.html"
    if old_url in sitemap:
        sitemap = sitemap.replace(old_url, new_url)
        step4_ok += 1
SITEMAP.write_text(sitemap, encoding="utf-8")
print(f"Step 4 完成：sitemap.xml 更新 {step4_ok}/20 條 URL")

# ── Step 5: 甲案 — 掃描所有 HTML（含新建的 20 個 slug 檔）──
print("\nStep 5 (甲案): Scanning ALL HTML files for PREV/NEXT hash references...")
html_files = list(BLOG_DIR.glob("*.html"))
print(f"  Total HTML files to scan: {len(html_files)}")
files_modified = 0
total_replacements = 0
for html_file in html_files:
    content = html_file.read_text(encoding="utf-8")
    modified = False
    for hash_id, seo_slug in SLUG_MAP.items():
        old_ref = f"/blog/{hash_id}.html"
        count = content.count(old_ref)
        if count > 0:
            content = content.replace(old_ref, f"/blog/{seo_slug}.html")
            modified = True
            total_replacements += count
    if modified:
        html_file.write_text(content, encoding="utf-8")
        files_modified += 1
print(f"Step 5 完成：掃描 {len(html_files)} 個 HTML，修改 {files_modified} 個檔案，共替換 {total_replacements} 處 PREV/NEXT 鏈結")

print("\n" + "=" * 60)
print("✅ Migration complete.")
print("Next: git commit + push → npx vercel --prod → browser verify 301s")
