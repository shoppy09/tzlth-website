#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SEO Phase 2 — FAQ Schema 注入腳本
邏輯：偵測問句 H2 → 擷取後續段落為答案 → 注入 FAQPage JSON-LD
只處理有問句 H2 且尚未有 FAQPage Schema 的文章

用法：
  python batch_add_faq_schema.py          # dry run，只印不改
  python batch_add_faq_schema.py --write  # 實際寫入
"""

import os
import re
import sys
import json
from glob import glob

BLOG_DIR = os.path.join(os.path.dirname(__file__), 'blog')
MAX_ANSWER_LEN = 500  # JSON-LD 答案最大長度

# 問句 H2 偵測：含問號結尾 或 含問句關鍵詞
QUESTION_H2 = re.compile(
    r'<h2(?:\s[^>]*)?>([^<]*(?:？|嗎|呢|什麼|如何|為什麼|怎麼|哪些|有沒有|可以|需要|是否|幾)[^<]*)</h2>',
    re.IGNORECASE
)

# 段落文字擷取（第一個 <p> 標籤內容）
FIRST_P = re.compile(r'<p[^>]*>(.*?)</p>', re.DOTALL | re.IGNORECASE)
STRIP_TAGS = re.compile(r'<[^>]+>')


def extract_text(html_fragment: str) -> str:
    """移除 HTML 標籤，回傳純文字"""
    text = STRIP_TAGS.sub('', html_fragment)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def find_answer_after(html: str, h2_end_pos: int) -> str:
    """在 H2 結尾位置後找第一個 <p> 段落作為答案"""
    remaining = html[h2_end_pos:]
    m = FIRST_P.search(remaining)
    if not m:
        return ''
    text = extract_text(m.group(1))
    # 截斷過長答案
    if len(text) > MAX_ANSWER_LEN:
        text = text[:MAX_ANSWER_LEN].rstrip() + '...'
    return text


def extract_qa_pairs(html: str) -> list:
    """擷取所有問句 H2 + 對應答案"""
    pairs = []
    for m in QUESTION_H2.finditer(html):
        question = extract_text(m.group(1))
        if not question:
            continue
        # 過濾：CTA 標題不列入（通常含「文章讀完」「想聊聊」「立即」「諮詢」「服務」）
        if any(kw in question for kw in ['文章讀完', '想聊聊', '立即', '諮詢', '服務']):
            continue
        answer = find_answer_after(html, m.end())
        if not answer:
            continue
        pairs.append({'question': question, 'answer': answer})
    return pairs


def build_faq_schema(pairs: list) -> str:
    """產生 FAQPage JSON-LD script 標籤"""
    entities = [
        {
            '@type': 'Question',
            'name': p['question'],
            'acceptedAnswer': {
                '@type': 'Answer',
                'text': p['answer']
            }
        }
        for p in pairs
    ]
    schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': entities
    }
    json_str = json.dumps(schema, ensure_ascii=False, indent=2)
    return f'\n<script type="application/ld+json">\n{json_str}\n</script>'


def process_file(filepath: str, write: bool):
    with open(filepath, encoding='utf-8', errors='ignore') as f:
        html = f.read()

    # Guard: 已有 FAQPage Schema → 跳過
    if 'FAQPage' in html:
        return None

    pairs = extract_qa_pairs(html)
    if not pairs:
        return None

    schema_tag = build_faq_schema(pairs)
    result = {
        'file': os.path.basename(filepath),
        'pairs': pairs,
        'schema': schema_tag,
    }

    if write:
        # 注入在 </head> 前
        new_html = html.replace('</head>', schema_tag + '\n</head>', 1)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_html)

    return result


def main():
    write_mode = '--write' in sys.argv
    mode_label = '【實際寫入】' if write_mode else '【Dry Run — 只印不改】'
    print(f'FAQ Schema 注入腳本 — {mode_label}\n')

    html_files = sorted(glob(os.path.join(BLOG_DIR, '*.html')))
    changes = []

    for fp in html_files:
        r = process_file(fp, write=write_mode)
        if r:
            changes.append(r)

    if not changes:
        print('沒有需要注入的檔案（無問句 H2 或已有 Schema）。')
        return

    print(f'需注入：{len(changes)} 篇\n')
    for i, c in enumerate(changes, 1):
        print(f'{i:02d}. {c["file"]}（{len(c["pairs"])} 個 Q&A）')
        for j, p in enumerate(c['pairs'], 1):
            print(f'    Q{j}：{p["question"]}')
            ans_preview = p['answer'][:80] + '...' if len(p['answer']) > 80 else p['answer']
            print(f'    A{j}：{ans_preview}')
        print()

    if write_mode:
        print(f'✅ 已注入 {len(changes)} 篇 FAQ Schema。請執行 git add + commit + push。')
    else:
        print('=== Dry Run 完成，確認無誤後執行：python batch_add_faq_schema.py --write ===')


if __name__ == '__main__':
    main()
