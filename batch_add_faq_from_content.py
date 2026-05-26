"""
Phase 2.6：批量為 hash-URL 文章補 FAQPage Schema
=====================================================
適用對象：slug 為 24位 hex ID 的文章（e.g. 664af7cf1234567890abcdef.html）
排除對象：已有 FAQPage Schema 的文章

策略：
  - Q：從 H1 標題生成問句
  - A：文章第一段落（去 HTML 標籤，HTML 實體解碼，json.dumps 完整 escape）

用法：
  python -X utf8 batch_add_faq_from_content.py           # dry run（預設）
  python -X utf8 batch_add_faq_from_content.py --write   # 實際寫入
"""

import os
import re
import glob
import json
import html as html_lib
import sys
import argparse
from pathlib import Path

BLOG_DIR = Path("blog")
HASH_URL_PATTERN = re.compile(r'^[0-9a-f]{24}\.html$')
FAQ_MARKER = '"@type": "FAQPage"'

# 跳過條件：第一段落為非實質內容時，改取第二段
SKIP_PATTERNS = [
    re.compile(r'^蒲朝棟'),
    re.compile(r'^本文為'),
    re.compile(r'^（本文'),
    re.compile(r'^作者'),
    re.compile(r'^\s*$'),
]


def is_hash_url(filename: str) -> bool:
    return bool(HASH_URL_PATTERN.match(filename))


def already_has_faq(content: str) -> bool:
    return FAQ_MARKER in content


def extract_h1_title(content: str) -> str | None:
    m = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.DOTALL)
    if m:
        return re.sub(r'<[^>]+>', '', m.group(1)).strip()
    return None


def extract_paragraphs(content: str) -> list[str]:
    """從 article-wrap 區域內抓所有 <p> 段落文字（去標籤，HTML 實體解碼）"""
    wrap_m = re.search(r'class="article-wrap"[^>]*>(.*?)(?:</div>\s*</div>|<div class="article-footer)', content, re.DOTALL)
    src = wrap_m.group(1) if wrap_m else content

    paras = []
    for m in re.finditer(r'<p[^>]*>(.*?)</p>', src, re.DOTALL):
        raw = re.sub(r'<[^>]+>', '', m.group(1)).strip()
        raw = html_lib.unescape(raw)
        raw = re.sub(r'\s+', ' ', raw).strip()
        if raw:
            paras.append(raw)
    return paras


def pick_best_paragraph(paras: list[str]) -> str | None:
    """挑第一個「不符合跳過條件」的段落，最多取前 150 字"""
    for para in paras:
        skip = any(p.search(para) for p in SKIP_PATTERNS)
        if not skip and len(para) >= 20:
            return (para[:147] + '...') if len(para) > 150 else para
    return None


def title_to_question(title: str) -> str:
    """將標題轉為問句（若已含問號則直接用；否則包裝為職場情境問句）"""
    clean = title.strip()
    if '？' in clean or '?' in clean:
        return clean
    # 截斷過長標題
    short = clean[:25] if len(clean) > 25 else clean
    return f"職場上遇到「{short}」這種情況，該怎麼辦？"


def safe_json_str(s: str) -> str:
    """完整 JSON string escape（含換行、反斜線、引號等）"""
    return json.dumps(s, ensure_ascii=False)[1:-1]  # 去掉 json.dumps 加的頭尾引號


def build_faq_block(title: str, answer: str) -> str:
    question = title_to_question(title)
    q_escaped = safe_json_str(question)
    a_escaped = safe_json_str(answer)

    return f'''<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {{
      "@type": "Question",
      "name": "{q_escaped}",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "{a_escaped}"
      }}
    }}
  ]
}}
</script>'''


def inject_after_breadcrumb(content: str, faq_block: str) -> str | None:
    """插入點：最後一個 </script>（位於 <style> 之前）之後"""
    style_pos = content.find('<style')
    if style_pos == -1:
        style_pos = len(content)  # fallback：找不到 <style> 就搜全文

    last_script_end = content.rfind('</script>', 0, style_pos)
    if last_script_end == -1:
        return None  # 無法找到插入點

    insert_pos = last_script_end + len('</script>')
    return content[:insert_pos] + '\n' + faq_block + content[insert_pos:]


def process_files(write_mode: bool, preview_count: int = 3):
    all_html = glob.glob(str(BLOG_DIR / '*.html'))
    hash_url_files = [f for f in all_html if is_hash_url(os.path.basename(f))]
    hash_url_files.sort()

    eligible = []
    already_done = 0
    no_h1 = 0
    no_para = 0
    no_insert_point = 0
    errors = []

    for filepath in hash_url_files:
        try:
            with open(filepath, encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            errors.append(f"{filepath}: {e}")
            continue

        if already_has_faq(content):
            already_done += 1
            continue

        title = extract_h1_title(content)
        if not title:
            no_h1 += 1
            continue

        paras = extract_paragraphs(content)
        answer = pick_best_paragraph(paras)
        if not answer:
            answer = f"本文從職涯顧問視角，分析「{title[:20]}」的核心問題，提供實務建議。"

        faq_block = build_faq_block(title, answer)
        new_content = inject_after_breadcrumb(content, faq_block)

        if new_content is None:
            no_insert_point += 1
            continue

        eligible.append((filepath, title, answer, faq_block, new_content))

    # 統計輸出
    print(f"\n{'='*60}")
    print(f"Phase 2.6 FAQPage 批量注入 — {'實際寫入' if write_mode else 'Dry Run'}")
    print(f"{'='*60}")
    print(f"hash-URL 文章總數  : {len(hash_url_files)}")
    print(f"已有 FAQPage（跳過）: {already_done}")
    print(f"無 H1 標題（跳過）  : {no_h1}")
    print(f"無插入點（跳過）    : {no_insert_point}")
    print(f"待注入數量          : {len(eligible)}")
    if errors:
        print(f"讀取錯誤            : {len(errors)}")
        for e in errors[:5]:
            print(f"  {e}")

    # 預覽前 N 篇
    if not write_mode and eligible:
        print(f"\n--- 前 {min(preview_count, len(eligible))} 篇預覽 ---")
        for filepath, title, answer, faq_block, _ in eligible[:preview_count]:
            print(f"\n檔案  : {os.path.basename(filepath)}")
            print(f"標題  : {title}")
            print(f"Q     : {title_to_question(title)}")
            print(f"A     : {answer[:80]}{'...' if len(answer) > 80 else ''}")

    # 實際寫入
    if write_mode:
        success = 0
        fail = 0
        for filepath, title, answer, faq_block, new_content in eligible:
            try:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                success += 1
            except Exception as e:
                print(f"寫入失敗 {filepath}: {e}")
                fail += 1

        print(f"\n寫入結果: 成功 {success} / 失敗 {fail} / 總計 {len(eligible)}")

    return len(eligible)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Phase 2.6 FAQPage 批量注入')
    parser.add_argument('--write', action='store_true', help='實際寫入（不加此參數為 dry run）')
    args = parser.parse_args()

    os.chdir(Path(__file__).parent)
    process_files(write_mode=args.write)
