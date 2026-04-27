#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
import_vocus.py
===============
把方格子 (vocus.cc) 上的文章全部爬下來，
轉換成靜態 HTML + articles.json，放進 blog/ 目錄。

用法：
    python import_vocus.py

需要安裝：
    pip install requests beautifulsoup4

輸出：
    blog/articles.json          ← 文章索引（給 blog/index.html 讀）
    blog/<slug>.html            ← 每篇文章的靜態頁面
    import_errors.log           ← 失敗的文章清單
"""

import json
import sys
import time
import math
import logging
import re
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin

# Windows cp950 terminal 無法輸出 emoji，強制改為 UTF-8（IMP-063 追溯修正）
if sys.stdout.encoding and sys.stdout.encoding.lower() in ('cp950', 'big5', 'gbk', 'cp936'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import requests
from bs4 import BeautifulSoup

# ─────────────────────────────────────────────────────────────────────────────
# 設定
# ─────────────────────────────────────────────────────────────────────────────

SALON_ID    = "664af5c0fd89780001198022"   # 從 __NEXT_DATA__ 取得
BLOG_DIR    = Path(__file__).parent / "blog"
TEMPLATE    = BLOG_DIR / "_article_template.html"
OUTPUT_JSON = BLOG_DIR / "articles.json"
ERROR_LOG   = Path(__file__).parent / "import_errors.log"

LIST_API    = "https://api.vocus.cc/api/contents"   # 文章列表 API
ART_BASE    = "https://vocus.cc/article/"           # 個別文章頁面

ARTICLES_PER_PAGE = 10     # API 每頁筆數
REQUEST_DELAY     = 2.0    # 每次請求間隔（秒）

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
    "Accept": "application/json, text/html, */*",
    "Referer": "https://vocus.cc/salon/careerssl",
}

# ─────────────────────────────────────────────────────────────────────────────
# 日誌
# ─────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(ERROR_LOG, encoding="utf-8", mode="w"),
    ],
)
log = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# 網路工具
# ─────────────────────────────────────────────────────────────────────────────

def make_session() -> requests.Session:
    s = requests.Session()
    s.headers.update(HEADERS)
    return s


def safe_get(session: requests.Session, url: str, retries: int = 3, **kwargs) -> requests.Response | None:
    for attempt in range(retries):
        try:
            r = session.get(url, timeout=20, **kwargs)
            if r.status_code == 200:
                return r
            log.warning("HTTP %s  %s (attempt %s/%s)", r.status_code, url, attempt+1, retries)
        except Exception as e:
            log.warning("請求失敗 (%s/%s): %s  %s", attempt+1, retries, e, url)
            time.sleep(3)
    return None


# ─────────────────────────────────────────────────────────────────────────────
# 步驟 1：取得所有文章 ID（透過列表 API）
# ─────────────────────────────────────────────────────────────────────────────

def fetch_all_article_ids(session: requests.Session) -> list[str]:
    """
    呼叫 api.vocus.cc 的列表 API，分頁取得全部 435 篇文章的 _id。
    回傳 list[str]，順序為最新 → 最舊。
    """
    ids: list[str] = []
    page = 1

    # 先取第 1 頁，確認 total count
    r = safe_get(session, LIST_API, params={"num": ARTICLES_PER_PAGE, "page": page, "salonId": SALON_ID})
    if not r:
        log.error("無法連線到列表 API")
        return []

    data = r.json()
    total = data.get("count", 0)
    total_pages = math.ceil(total / ARTICLES_PER_PAGE)
    log.info("方格子共 %d 篇文章，需爬取 %d 頁", total, total_pages)

    def extract_ids(data: dict) -> list[str]:
        result = []
        for item in data.get("contents", []):
            # contentId = article._id 是文章頁面的 URL ID
            # item._id 是列表項的 ID（不同於文章 ID）
            aid = item.get("contentId") or (item.get("article") or {}).get("_id")
            if aid:
                result.append(aid)
        return result

    ids.extend(extract_ids(data))

    for page in range(2, total_pages + 1):
        log.info("列表 API 第 %d/%d 頁", page, total_pages)
        r = safe_get(session, LIST_API, params={"num": ARTICLES_PER_PAGE, "page": page, "salonId": SALON_ID})
        if not r:
            log.error("第 %d 頁取得失敗，略過", page)
            continue
        ids.extend(extract_ids(r.json()))
        time.sleep(REQUEST_DELAY)

    log.info("共取得 %d 個文章 ID", len(ids))
    return ids


# ─────────────────────────────────────────────────────────────────────────────
# 步驟 2：爬取個別文章（從 __NEXT_DATA__ 取內容）
# ─────────────────────────────────────────────────────────────────────────────

def fetch_article(session: requests.Session, article_id: str) -> dict | None:
    """
    爬取單篇文章頁面，從 __NEXT_DATA__.props.pageProps.parsedArticle 取出資料。
    回傳 dict 或 None（失敗時）。
    """
    url = ART_BASE + article_id
    r = safe_get(session, url)
    if not r:
        return None

    soup = BeautifulSoup(r.text, "html.parser")
    nd_tag = soup.find("script", id="__NEXT_DATA__")
    if not nd_tag:
        log.warning("找不到 __NEXT_DATA__: %s", url)
        return None

    try:
        nd = json.loads(nd_tag.string)
    except json.JSONDecodeError as e:
        log.warning("JSON 解析失敗: %s  %s", e, url)
        return None

    pp = nd.get("props", {}).get("pageProps", {})
    art = pp.get("parsedArticle", {})

    if not art:
        log.warning("找不到 parsedArticle: %s", url)
        return None

    # ── 標題 ──────────────────────────────────────────────────────────────────
    title = art.get("title", "").strip()
    if not title:
        title = "未命名文章"

    # ── 日期（用 readyPublishAt 或 createdAt）────────────────────────────────
    raw_date = art.get("readyPublishAt") or art.get("lastPublishAt") or art.get("createdAt") or ""
    date_iso = raw_date[:10] if raw_date else datetime.now().strftime("%Y-%m-%d")

    # ── 標籤 ──────────────────────────────────────────────────────────────────
    tags: list[str] = []
    for t in art.get("tags", []):
        tag_title = t.get("title", "").strip() if isinstance(t, dict) else str(t).strip()
        if tag_title and len(tag_title) < 20 and tag_title not in tags:
            tags.append(tag_title)
    tags = tags[:5]

    # ── 摘要（abstract）───────────────────────────────────────────────────────
    excerpt = (art.get("abstract") or "").strip()
    excerpt = re.sub(r"\s+", " ", excerpt)[:160]

    # ── 閱讀時間 ──────────────────────────────────────────────────────────────
    read_time = art.get("readingTime") or estimate_read_time_from_words(art.get("wordsCount", 0))

    # ── 文章內容（HTML）──────────────────────────────────────────────────────
    content_html = art.get("content", "") or ""
    if not isinstance(content_html, str):
        content_html = ""
    content_html = clean_content(content_html)

    if not content_html:
        content_html = f"<p>{excerpt}</p><p><a href='{url}' target='_blank' rel='noopener'>閱讀原文 →</a></p>"

    return {
        "slug":       article_id,   # 用 vocus 的 24 碼 hex id
        "title":      title,
        "date":       date_iso,
        "excerpt":    excerpt,
        "tags":       tags,
        "body_html":  content_html,
        "read_time":  read_time,
        "source_url": url,
    }


def estimate_read_time_from_words(word_count: int) -> int:
    """中文約 400 字/分鐘"""
    return max(1, math.ceil(word_count / 400))


def clean_content(html: str) -> str:
    """清理方格子文章 HTML：移除廣告佔位符、修正樣式等。"""
    soup = BeautifulSoup(html, "html.parser")

    # 移除廣告佔位符
    for sel in [
        ".why-see-ad-placeholder",
        "[class*='ad-placeholder']",
        "[class*='paywall']",
        "[class*='donate']",
        ".lexical__horizontal-rule",  # 保留視覺分隔線，但移除特定廣告結構
    ]:
        for el in soup.select(sel):
            # 只移除廣告，不移除 hr
            if "ad" in sel or "paywall" in sel or "donate" in sel:
                el.decompose()

    # 把 vocus 的 lexical 段落 class 轉為乾淨的標籤
    for p in soup.find_all(class_=re.compile(r"lexical__paragraph")):
        p.attrs = {}  # 移除所有 class

    for el in soup.find_all(class_=re.compile(r"lexical__heading")):
        # h1 → h2, h2 → h2, h3 → h3
        tag = el.name
        el.attrs = {}

    # 修正圖片：確保有 loading=lazy，路徑加 .jpg/.png（若缺副檔名）
    for img in soup.find_all("img", src=True):
        src = img["src"]
        if src.startswith("//"):
            src = "https:" + src
        img["src"] = src
        img["loading"] = "lazy"
        img.attrs.pop("srcset", None)
        img.attrs.pop("sizes", None)

    # 修正 a 標籤
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("/"):
            a["href"] = urljoin("https://vocus.cc", href)
        if not href.startswith("https://tzlth-website.vercel.app"):
            a["target"] = "_blank"
            a["rel"] = "noopener noreferrer"

    # 移除空白 div（height:300px 等廣告框）
    for div in soup.find_all("div"):
        style = (div.attrs or {}).get("style", "") if hasattr(div, 'attrs') and div.attrs else ""
        if "height: 300" in style or "height:300" in style:
            div.decompose()

    return soup.decode_contents().strip()


# ─────────────────────────────────────────────────────────────────────────────
# 步驟 3：產生 HTML 檔案
# ─────────────────────────────────────────────────────────────────────────────

def format_date_display(date_iso: str) -> str:
    try:
        d = datetime.strptime(date_iso[:10], "%Y-%m-%d")
        return f"{d.year} 年 {d.month} 月 {d.day} 日"
    except Exception:
        return date_iso


def tags_html(tags: list[str]) -> str:
    return "".join(f'<span class="article-tag">{t}</span>' for t in tags)


def make_article_html(template: str, article: dict, prev_art: dict | None, next_art: dict | None) -> str:
    title_short = article["title"][:20] + ("…" if len(article["title"]) > 20 else "")

    prev_url   = f"./{prev_art['slug']}.html" if prev_art else "#"
    prev_title = f"← {prev_art['title'][:28]}…" if prev_art and len(prev_art['title']) > 28 else (f"← {prev_art['title']}" if prev_art else "")
    next_url   = f"./{next_art['slug']}.html" if next_art else "#"
    next_title = f"{next_art['title'][:28]}… →" if next_art and len(next_art['title']) > 28 else (f"{next_art['title']} →" if next_art else "")

    replacements = {
        "{{TITLE}}":        article["title"],
        "{{TITLE_SHORT}}":  title_short,
        "{{SLUG}}":         article["slug"],
        "{{EXCERPT}}":      article["excerpt"],
        "{{DATE_ISO}}":     article["date"],
        "{{DATE_DISPLAY}}": format_date_display(article["date"]),
        "{{READ_TIME}}":    str(article["read_time"]),
        "{{TAGS_HTML}}":    tags_html(article["tags"]),
        "{{CONTENT}}":      article["body_html"],
        "{{PREV_URL}}":     prev_url,
        "{{PREV_TITLE}}":   prev_title,
        "{{NEXT_URL}}":     next_url,
        "{{NEXT_TITLE}}":   next_title,
    }
    html = template
    for k, v in replacements.items():
        html = html.replace(k, v)
    return html


# ─────────────────────────────────────────────────────────────────────────────
# 主流程
# ─────────────────────────────────────────────────────────────────────────────

def main():
    BLOG_DIR.mkdir(parents=True, exist_ok=True)

    if not TEMPLATE.exists():
        log.error("找不到模板：%s", TEMPLATE)
        sys.exit(1)

    with open(TEMPLATE, encoding="utf-8") as f:
        template = f.read()

    session = make_session()

    # ── Step 1：取得所有文章 ID ───────────────────────────────────────────────
    log.info("=== Step 1: 取得文章清單 ===")
    article_ids = fetch_all_article_ids(session)
    if not article_ids:
        log.error("無法取得文章清單，結束。")
        sys.exit(1)

    # ── Step 2：逐篇爬取並即時存檔（支援續跑）─────────────────────────────
    log.info("=== Step 2: 逐篇爬取內容（共 %d 篇）===", len(article_ids))
    articles: list[dict] = []
    failed:   list[str]  = []

    # 載入既有的 articles.json，讓續跑時不需重新讀取已存在的 meta
    existing_meta: dict[str, dict] = {}
    if OUTPUT_JSON.exists():
        try:
            with open(OUTPUT_JSON, encoding="utf-8") as f:
                for item in json.load(f):
                    existing_meta[item["slug"]] = item
            log.info("載入既有 articles.json：%d 篇", len(existing_meta))
        except Exception:
            pass

    for i, aid in enumerate(article_ids, 1):
        html_path = BLOG_DIR / f"{aid}.html"

        # 已有 HTML 且在 meta 中 → 直接跳過，從 meta 讀
        if html_path.exists() and aid in existing_meta:
            m = existing_meta[aid]
            articles.append({
                "slug":      aid,
                "title":     m.get("title", ""),
                "date":      m.get("date", ""),
                "excerpt":   m.get("excerpt", ""),
                "tags":      m.get("tags", []),
                "body_html": "",   # 不需要重新讀 HTML
                "read_time": 5,
            })
            log.info("[%d/%d] SKIP (already exists): %s", i, len(article_ids), aid)
            continue

        log.info("[%d/%d] fetching %s", i, len(article_ids), aid)
        art = fetch_article(session, aid)
        if not art:
            log.error("  FAIL: %s", aid)
            failed.append(aid)
            time.sleep(REQUEST_DELAY)
            continue

        articles.append(art)
        log.info("  done: %s", art["title"][:40].encode('ascii', 'replace').decode())

        # 即時存 HTML（暫無 prev/next，最後再更新）
        html = make_article_html(template, art, None, None)
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html)

        # 即時更新 articles.json（排序後存）
        articles_sorted = sorted(articles, key=lambda a: a["date"], reverse=True)
        index_partial = [
            {"slug": a["slug"], "title": a["title"], "date": a["date"],
             "excerpt": a["excerpt"], "tags": a["tags"]}
            for a in articles_sorted
        ]
        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump(index_partial, f, ensure_ascii=False, indent=2)

        time.sleep(REQUEST_DELAY)

    if not articles:
        log.error("No articles fetched.")
        sys.exit(1)

    # ── Step 3：排序並更新 prev/next 導覽 ───────────────────────────────────
    log.info("=== Step 3: 更新 prev/next 導覽 ===")
    articles.sort(key=lambda a: a["date"], reverse=True)

    # 只重寫有 body_html 的文章（避免覆蓋 SKIP 的文章但 body_html 空掉）
    for i, art in enumerate(articles):
        if not art.get("body_html"):
            continue  # SKIP 的文章不重寫
        prev_art = articles[i - 1] if i > 0 else None
        next_art = articles[i + 1] if i < len(articles) - 1 else None

        html = make_article_html(template, art, prev_art, next_art)
        out_path = BLOG_DIR / f"{art['slug']}.html"
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(html)

    log.info("prev/next updated for %d articles", sum(1 for a in articles if a.get("body_html")))

    # ── Step 4：最終 articles.json ──────────────────────────────────────────
    index = [
        {"slug": a["slug"], "title": a["title"], "date": a["date"],
         "excerpt": a["excerpt"], "tags": a["tags"]}
        for a in articles
    ]
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    log.info("Final articles.json written: %d articles", len(index))

    # ── 結果報告 ─────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("Done!")
    print(f"   Success: {len(articles)} articles")
    print(f"   Failed: {len(failed)} articles")
    if failed:
        print(f"   Error log: {ERROR_LOG}")
        for u in failed:
            print(f"     - {u}")
    print(f"   blog dir: {BLOG_DIR}")
    print(f"   articles.json: {OUTPUT_JSON}")
    print("=" * 60)
    print("Next: run /deploy to push blog/ to Vercel.")


if __name__ == "__main__":
    main()
