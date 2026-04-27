#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
add_article.py  —  careerssl.com 直接發布腳本（v1.0）
建立日期：2026-04-27
執行者：Claude（Tim 只需提供文字 + 日期 + 標籤）

⚠️ Claude 執行注意事項：
  1. --slug 務必提供英文 readable slug（如 2026-04-28-why-become-manager）
     若不提供，make_slug() 會用中文標題生成含中文字符的 slug（技術可用但 SEO 不友善）
  2. --content-file 可用相對路徑（相對於本腳本所在目錄，即網站根目錄）
  3. 批量發布時，依日期由舊到新呼叫本腳本；所有 HTML 生成後統一 npx vercel --prod
  4. 執行完後刪除暫存 content file（blog/_temp_content.html）
  5. npx vercel --prod 後，執行 python batch_update_all_articles.py 補齊 UI（email 訂閱框等）

批量發布邏輯：
  - articles.json 為 newest-first；新文章 prepend 到最前
  - 每次呼叫同時更新「前一篇」的 article-nav-prev 連結（雙向更新）
  - 由舊到新順序確保 NEXT/PREV 連結正確建立
"""
import json, re, sys, argparse
from datetime import datetime
from pathlib import Path

# Windows cp950 terminal 無法輸出 emoji，強制改為 UTF-8（v1.1）
if sys.stdout.encoding and sys.stdout.encoding.lower() in ('cp950', 'big5', 'gbk', 'cp936'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

BLOG_DIR      = Path(__file__).parent / "blog"
TEMPLATE      = BLOG_DIR / "_article_template.html"
ARTICLES_JSON = BLOG_DIR / "articles.json"


def make_slug(title: str, date: str) -> str:
    """
    生成 date-readable-title 格式 slug。
    注意：若 title 為中文，\\w 會保留中文字符（Python Unicode 行為）。
    Claude 執行時應永遠提供英文 --slug 參數，此函式僅作為 fallback。
    """
    slug = re.sub(r'[^\w\s-]', '', title.lower())
    slug = re.sub(r'[\s_]+', '-', slug).strip('-')[:50]
    if len(slug) < 3:
        slug = datetime.now().strftime('%H%M%S')
    return f"{date}-{slug}"


def html_tags(tags: list) -> str:
    return ''.join(f'<span class="article-tag">{t}</span>' for t in tags)


def estimate_read_time(html: str) -> int:
    text = re.sub(r'<[^>]+>', '', html)
    return max(1, len(text) // 400)


def update_prev_article(prev_slug: str, new_slug: str, new_title: str):
    """
    更新前一篇（目前最新篇）的 article-nav-prev：
    前一篇發布時 PREV href="#"（無更新文章），現在新文章發布後 PREV 應指向新文章。
    import_vocus.py 與 add_article.py 均以 href="#" 標記「無更新篇」，故此處僅匹配 href="#"。
    """
    prev_path = BLOG_DIR / f'{prev_slug}.html'
    if not prev_path.exists():
        print(f'⚠️  找不到前一篇：{prev_slug}.html，略過雙向更新')
        return
    html = prev_path.read_text(encoding='utf-8')
    short_title = new_title[:20] + ('…' if len(new_title) > 20 else '')
    new_html = re.sub(
        r'(<a href=")[#](" class="article-nav-prev"[^>]*>)[^<]*(</a>)',
        rf'\g<1>/blog/{new_slug}.html\g<2>{short_title}\g<3>',
        html, count=1
    )
    if new_html != html:
        prev_path.write_text(new_html, encoding='utf-8')
        print(f'✅ 已更新前一篇 PREV 連結：{prev_slug}.html → {new_slug}')
    else:
        print(f'⚠️  前一篇 PREV 連結未匹配（可能已更新或格式不符），略過')


def main():
    parser = argparse.ArgumentParser(
        description='發布新文章到 careerssl.com（Claude 執行，Tim 提供內容）'
    )
    parser.add_argument('--title', required=True, help='文章標題')
    parser.add_argument(
        '--date',
        default=datetime.now().strftime('%Y-%m-%d'),
        help='發布日期 YYYY-MM-DD（預設今天）'
    )
    parser.add_argument(
        '--slug',
        default=None,
        help='英文 readable slug，強烈建議提供（如 2026-04-28-why-become-manager）；'
             '若不提供，從標題自動生成（中文標題會產生含中文字符的 slug）'
    )
    parser.add_argument('--excerpt', default=None, help='摘要（預設取內文前 160 字）')
    parser.add_argument('--tags',    default='',   help='標籤（逗號分隔，最多 5 個）')
    parser.add_argument(
        '--content-file',
        required=True,
        help='HTML 內容檔案路徑（可用相對路徑，以本腳本所在目錄為基準）'
    )
    args = parser.parse_args()

    # 日期驗證
    try:
        date_obj = datetime.strptime(args.date, '%Y-%m-%d')
    except ValueError:
        print(f'❌ 日期格式錯誤：{args.date}（應為 YYYY-MM-DD）')
        sys.exit(1)

    # 必要檔案存在確認
    if not TEMPLATE.exists():
        print(f'❌ 找不到模板：{TEMPLATE}')
        sys.exit(1)
    if not ARTICLES_JSON.exists():
        print(f'❌ 找不到 articles.json：{ARTICLES_JSON}')
        sys.exit(1)

    # content-file 路徑：相對路徑以腳本目錄為基準（與 BLOG_DIR 行為一致）
    content_path = Path(args.content_file)
    if not content_path.is_absolute():
        content_path = Path(__file__).parent / args.content_file
    if not content_path.exists():
        print(f'❌ 找不到內容檔案：{content_path}')
        sys.exit(1)
    content_html = content_path.read_text(encoding='utf-8')
    if not content_html.strip():
        print('❌ 文章內容不能為空')
        sys.exit(1)

    # Slug 生成
    slug = args.slug or make_slug(args.title, args.date)
    out  = BLOG_DIR / f'{slug}.html'
    if out.exists():
        print(f'⚠️  {slug}.html 已存在，將覆蓋！按 Enter 繼續，Ctrl+C 中止')
        try:
            input()
        except KeyboardInterrupt:
            print('\n已取消')
            sys.exit(0)

    # 計算欄位
    excerpt     = args.excerpt or re.sub(r'<[^>]+>', '', content_html)[:160].strip()
    tags        = [t.strip() for t in args.tags.split(',') if t.strip()][:5]
    title_short = args.title[:25] + ('…' if len(args.title) > 25 else '')
    date_iso    = args.date + 'T00:00:00+08:00'
    date_disp   = date_obj.strftime('%Y年%m月%d日')
    read_time   = estimate_read_time(content_html)

    # PREV/NEXT 邏輯（articles.json 為 newest-first）
    articles   = json.loads(ARTICLES_JSON.read_text(encoding='utf-8'))
    prev_art   = articles[0] if articles else None   # 目前最新篇 → 新文章的 NEXT 方向
    next_url   = f"/blog/{prev_art['slug']}.html" if prev_art else ''
    next_title = (prev_art['title'][:20] + '…') if prev_art and len(prev_art['title']) > 20 \
                 else (prev_art['title'] if prev_art else '')
    prev_url   = '#'     # 新發布時尚無更新篇，標記 # 等待下次發布時更新
    prev_title = ''

    # 套入模板
    html = TEMPLATE.read_text(encoding='utf-8')
    for k, v in {
        '{{SLUG}}':         slug,
        '{{TITLE}}':        args.title,
        '{{TITLE_SHORT}}':  title_short,
        '{{EXCERPT}}':      excerpt,
        '{{DATE_ISO}}':     date_iso,
        '{{DATE_DISPLAY}}': date_disp,
        '{{READ_TIME}}':    str(read_time),
        '{{TAGS_HTML}}':    html_tags(tags),
        '{{CONTENT}}':      content_html,
        '{{PREV_URL}}':     prev_url,
        '{{PREV_TITLE}}':   prev_title,
        '{{NEXT_URL}}':     next_url,
        '{{NEXT_TITLE}}':   next_title,
    }.items():
        html = html.replace(k, v)

    out.write_text(html, encoding='utf-8')
    print(f'✅ blog/{slug}.html 已建立')

    # 雙向更新：前一篇文章的 PREV → 新文章
    if prev_art:
        update_prev_article(prev_art['slug'], slug, args.title)

    # 更新 articles.json（新文章 prepend）
    new_entry = {
        'slug':    slug,
        'title':   args.title,
        'date':    args.date,
        'excerpt': excerpt,
        'tags':    tags
    }
    articles.insert(0, new_entry)
    ARTICLES_JSON.write_text(
        json.dumps(articles, ensure_ascii=False, indent=2),
        encoding='utf-8'
    )
    print(f'✅ articles.json 更新（共 {len(articles)} 篇）')
    print(f'🔗 預期 URL：https://www.careerssl.com/blog/{slug}.html')


if __name__ == '__main__':
    main()
