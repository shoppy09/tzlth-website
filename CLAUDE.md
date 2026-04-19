# 職涯停看聽網站 - 專案說明

## Preview Hook
當編輯檔案後收到預覽面板的 hook 通知時，不需要在回覆中告知使用者「預覽面板已更新」。直接繼續工作即可，無需任何聲明。

## 強制規則：動手前先確認現況

**以下三種情況，必須先執行對應動作，不得跳過：**

1. **提出網站改善建議前** → 先讀 index.html，比對 `project_website_features.md`，確認該功能是否已存在
2. **修改 index.html 前** → 先確認目標區塊的現有內容，避免覆蓋其他已完成的功能
3. **每次完成修改後** → 立即更新 `memory/project_website_features.md`，將新功能加入清單

## 記憶檔案位置
- 功能清單（最重要）：`C:\Users\USER\.claude\projects\C--Users-USER-Desktop---------\memory\project_website_features.md`
- 網站狀態：`C:\Users\USER\.claude\projects\C--Users-USER-Desktop---------\memory\project_website_status.md`
- KIT 設定：`C:\Users\USER\.claude\projects\C--Users-USER-Desktop---------\memory\project_kit_email_system.md`

---
## ⚡ 跨視窗同步協議（最高優先規則）

> 所有對話視窗共用檔案系統。**文件是各視窗之間唯一的共用記憶。**

### 每次完成任何修改後，必須執行收尾五件事（順序不可省略）：
0. **git commit + git push 到 GitHub**（shoppy09/tzlth-website）
1. **更新本文件「最近修改記錄」**（日期、修改內容、狀態 ✅）← **當場就寫，不等收尾**
2. **更新總部任務清單**：`C:\Users\USER\Desktop\tzlth-hq\dev\tasks.md`（完成項目打勾，新增衍生任務）
3. **更新每日日誌**：`C:\Users\USER\Desktop\tzlth-hq\reports\daily-log.md`
4. **寫入反思日誌**：`C:\Users\USER\Desktop\tzlth-hq\reports\reflection-log.md`（有實質改善價值才寫）

> 未完成收尾五件事 = 任務未完成。修改記錄空白 = 上次沒有收尾。未 push = 儀表板看不到。

### 最近修改記錄

| 日期 | 修改內容 | 執行視窗 | 狀態 |
|------|---------|---------|------|
| 2026-04-20 | #ai-tool 區塊新增「職業倦怠快測」次要卡片（連結至 resume-diagnosis.vercel.app/burnout，含 mobile CSS）| 總部視窗 | ✅ |
| 2026-04-12 | Cookie 政策頁（/cookie-policy.html）上線，首頁加入同意橫幅，頁腳加入連結 | 總部視窗 | ✅ |
| 2026-04-12 | vercel.json 安全標頭確認（7 項完整，含 CSP + HSTS）| 總部視窗 | ✅ |
| 2026-04-11 | GA4 追蹤啟用（G-TK8D1DX7MJ，property 530451281）| 總部視窗 | ✅ |

---
## 總部連結（TZLTH-HQ）
- 系統代號：SYS-01
- 總部路徑：C:\Users\USER\Desktop\tzlth-hq
- HQ 角色：品牌對外門面，所有產品與服務的第一接觸點。負責展示 Tim 的專業定位、客戶案例、導流至 AI 診斷工具與預約系統。
- 存檔規定：每次網站功能更新或上線後，更新 .claude/ 記憶體中的 project_website_features.md 與 project_website_status.md（現有機制維持即可）
- 拉取欄位：.claude/ 記憶體檔案（功能狀態）、最後修改時間（確認近期有無更新）
---
