#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
排程發布腳本 — publish_scheduled.py
每日由 GitHub Actions 觸發，掃描 blog/scheduled/ 資料夾。
若有今日到期的文章，加入 articles.json 並回傳 exit code 1（觸發後續 deploy）。
若無到期文章，靜默退出（exit code 0）。

使用方式：
  python publish_scheduled.py               # 發布今日到期文章
  python publish_scheduled.py --date 2026-04-29  # 發布指定日期文章（測試用）
"""

import json
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

# 台灣時區 UTC+8
TW_TZ = timezone(timedelta(hours=8))

SCHEDULED_DIR = Path(__file__).parent / "blog" / "scheduled"
ARTICLES_JSON = Path(__file__).parent / "blog" / "articles.json"


def get_publish_date(args):
    """取得發布日期：預設為台灣今日，可透過 --date 參數覆蓋（測試用）"""
    if "--date" in args:
        idx = args.index("--date")
        return args[idx + 1]  # 格式 YYYY-MM-DD
    return datetime.now(TW_TZ).strftime("%Y-%m-%d")


def main():
    today_str = get_publish_date(sys.argv[1:])
    print(f"[publish_scheduled] 檢查日期：{today_str}")

    if not SCHEDULED_DIR.exists():
        print("[publish_scheduled] blog/scheduled/ 資料夾不存在，無排程文章。")
        sys.exit(0)

    # 掃描所有排程檔案，找出今日到期的
    to_publish = []
    for json_file in sorted(SCHEDULED_DIR.glob("*.json")):
        try:
            with open(json_file, encoding="utf-8") as f:
                entry = json.load(f)
            publish_date = entry.get("date", "")
            if publish_date == today_str:
                to_publish.append((json_file, entry))
                print(f"  ✅ 找到到期文章：{json_file.name}（日期：{publish_date}）")
            else:
                print(f"  ⏳ 未到期：{json_file.name}（排程：{publish_date}）")
        except Exception as e:
            print(f"  ⚠️  讀取失敗：{json_file.name} — {e}")

    if not to_publish:
        print("[publish_scheduled] 今日無到期文章，結束。")
        sys.exit(0)

    # 讀取現有 articles.json
    with open(ARTICLES_JSON, encoding="utf-8") as f:
        articles = json.load(f)

    # 將到期文章加入 articles.json 開頭（最新優先）
    for json_file, entry in to_publish:
        slug = entry.get("slug", "")
        # 避免重複加入
        if any(a.get("slug") == slug for a in articles):
            print(f"  ⚠️  {slug} 已存在於 articles.json，跳過。")
        else:
            articles.insert(0, entry)
            print(f"  📰 已加入 articles.json：{slug}")

        # 從 scheduled/ 移除
        json_file.unlink()
        print(f"  🗑️  已移除排程檔：{json_file.name}")

    # 寫回 articles.json
    with open(ARTICLES_JSON, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)
    print(f"[publish_scheduled] articles.json 更新完成，共 {len(articles)} 篇文章。")

    # exit code 1 = 有變更，GH Actions 後續步驟執行 deploy
    sys.exit(1)


if __name__ == "__main__":
    main()
