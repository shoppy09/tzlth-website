const {
  Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign, PageBreak,
} = require('docx');
const {
  pgBreak, gap, secTitle, callout, chapterHeader, fwBox, cmpTable, exBlock,
  rvBox, warnBox, ctaBox, followup, p, r,
  W, NAVY, NAVY2, ORANGE, BLUE, RED, GREEN,
  BG_BLUE, BG_ORANGE, BG_YELLOW, BG_GREEN, BG_GRAY, BG_RED, WHITE, LGRAY,
  NB, tb,
} = require('./generate_p1');

// ── APPENDIX HEADER ───────────────────────────────────────────────────
function appHeader(num, title) {
  return [
    pgBreak(),
    new Paragraph({
      spacing: { before: 0, after: 0 },
      shading: { fill: NAVY2, type: ShadingType.CLEAR },
      children: [
        r(`  附錄${num}`, { size: 20, bold: true, color: 'AACCEE' }),
        r(`　${title}`, { size: 28, bold: true, color: WHITE }),
      ],
    }),
    gap(100),
  ];
}

// ── APPENDIX 1：準備清單 ─────────────────────────────────────────────
function buildA1() {
  const bullet = (text) => p(text, { size: 21, sp: { before: 0, after: 40 } });
  const storyRows = [
    ['我解決過最難的問題', '___', '挑戰題（框架六）、優點題（框架二）'],
    ['我帶過的一個成功專案', '___', '成就題、自我介紹（框架一）'],
    ['我犯過一個錯誤並修正', '___', '失敗題（框架十一）、缺點題（框架三）'],
    ['我和某人意見不合但最後達成共識', '___', '衝突處理、溝通能力題'],
    ['我在資源有限下做出判斷', '___', '壓力應對、決策能力題'],
    ['我主動改善了一個既有流程或狀況', '___', '主動性、創新能力題'],
    ['我學習一個新技能並應用在工作上', '___', '學習能力、轉型動機題'],
  ];
  const w3 = [2800, 2000, W - 4800];

  return [
    ...appHeader('一', '面試前準備清單'),
    secTitle('研究功課'),
    bullet('□  閱讀這家公司的官網「關於我們」頁面，了解使命、產品線、主要客群'),
    bullet('□  找 2–3 篇近期新聞或報導（過去 3 個月內為佳）'),
    bullet('□  看他們的 LinkedIn 頁面，了解近期動態、員工規模與人才組成'),
    bullet('□  找到 JD，把所有關鍵詞抄下來，對應你的能力（這是 ATS 時代的基本動作）'),
    gap(120),
    secTitle('STAR 故事庫'),
    p('準備至少 7 個故事，涵蓋不同面向，可以靈活套用在不同問題：', { size: 22, sp: { before: 0, after: 80 } }),
    new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: w3,
      rows: [
        new TableRow({ tableHeader: true, children: ['故事主題', '關鍵數字（填入你的版本）', '適用題型'].map((h, i) =>
          new TableCell({ width: { size: w3[i], type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR },
            borders: { top: NB, bottom: NB, left: NB, right: tb(WHITE) }, margins: { top: 80, bottom: 80, left: 120, right: 80 },
            children: [p('', { runs: [r(h, { size: 20, bold: true, color: WHITE })], sp: { before: 0, after: 0 } })] })
        )}),
        ...storyRows.map(([story, num, types], i) => new TableRow({ children: [
          new TableCell({ width: { size: w3[0], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? BG_BLUE : WHITE, type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: NB, right: tb() }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, children: [p(story, { sp: { before: 0, after: 0 }, size: 21 })] }),
          new TableCell({ width: { size: w3[1], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? BG_BLUE : WHITE, type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: NB, right: tb() }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [p(num, { sp: { before: 0, after: 0 }, size: 21, color: '888888' })] }),
          new TableCell({ width: { size: w3[2], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? BG_BLUE : WHITE, type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: NB, right: NB }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, children: [p(types, { sp: { before: 0, after: 0 }, size: 20 })] }),
        ]}))
      ]
    }),
    gap(80),
    callout([p('使用說明：「關鍵數字」欄填入你版本的可量化成果。每個故事控制在 90–120 秒口說版本。準備好之後，至少找一個人口說練習一遍。', { size: 21, sp: { before: 0, after: 0 } })], BG_GRAY, NAVY, 12),
    gap(120),
    secTitle('準備你的問題'),
    p('面試結尾的「你有什麼問題嗎？」不只是禮貌性環節——問出好問題，等於再一次展示你的思考深度。', { size: 22, sp: { before: 0, after: 80 } }),
    callout([
      p('第一關（人資面試）——問流程與文化', { runs: [r('第一關（人資面試）——問流程與文化', { size: 21, bold: true, color: NAVY })], sp: { before: 0, after: 50 } }),
      bullet('「這個職位從發 Offer 到上線，大概需要多長時間？」'),
      bullet('「團隊目前的狀態是什麼？是剛組建中，還是已經有穩定的運作節奏？」'),
      bullet('「公司在評估新人的試用期，通常最看重哪幾件事？」'),
      gap(60),
      p('第二關（直屬主管面試）——問工作本質與成長', { runs: [r('第二關（直屬主管面試）——問工作本質與成長', { size: 21, bold: true, color: NAVY })], sp: { before: 0, after: 50 } }),
      bullet('「這個職位目前面對的最大挑戰是什麼？你希望這個人進來之後先解決什麼？」'),
      bullet('「在你的觀察中，在這個職位做得好的人，通常有什麼共同特質？」'),
      bullet('「你理想中，這個職位的人在第一個 90 天應該達成什麼？」'),
      gap(60),
      p('第三關（高層面試）——問方向與視野', { runs: [r('第三關（高層面試）——問方向與視野', { size: 21, bold: true, color: NAVY })], sp: { before: 0, after: 50 } }),
      bullet('「從公司的角度，這個部門 / 職能在未來 2–3 年的重要性會怎麼演變？」'),
      bullet('「你個人認為，這個產業 / 市場目前最值得關注的變化是什麼？」'),
    ], BG_GRAY, NAVY, 12),
  ];
}

// ── APPENDIX 2：AI 時代面試準備 ──────────────────────────────────────
function buildA2() {
  const sub = (title) => p('', { runs: [r(title, { size: 24, bold: true, color: NAVY })], sp: { before: 160, after: 80 } });
  return [
    ...appHeader('二', 'AI 時代面試準備'),
    p('2024 年起，面試生態出現了幾個結構性改變，是所有求職者都必須提前了解的。這不只是技術工具的更新，而是整個面試流程的重組。', { size: 22, sp: { before: 0, after: 80 } }),
    warnBox('關於 AI 輔助備稿的倫理邊界：2024 年起，越來越多面試官開始能辨識「AI 生成語氣」的特徵。本書的框架是思考工具，不是讓 AI 幫你生成答案的模板。正確的使用方式是：用框架梳理你自己的真實故事，用你自己的語氣說出來。最強的差異化，永遠是你說話時那個不可替代的個人語氣。'),
    gap(120),
    sub('一、ATS 關鍵字篩選：你的 STAR 故事要先過機器這關'),
    p('許多規模稍大的公司，履歷在進入人資手上之前，會先由 ATS（Applicant Tracking System）自動篩選。ATS 的核心邏輯很簡單：掃描你的履歷是否包含 JD 裡的關鍵字。這意味著，你在面試中說的那些精彩 STAR 故事，必須先以文字形式出現在履歷裡，才有機會被看見。', { size: 22, sp: { before: 0, after: 80 } }),
    callout([
      p('ATS 優化的三個動作：', { runs: [r('ATS 優化的三個動作：', { size: 21, bold: true })], sp: { before: 0, after: 60 } }),
      p('① 把 JD 裡出現超過兩次的關鍵字，逐一對應你的履歷，確認有覆蓋到', { size: 21, sp: { before: 0, after: 40 } }),
      p('② 使用直白的職位名稱，不要創意縮寫（例如：「專案管理師」優於「PM 達人」）', { size: 21, sp: { before: 0, after: 40 } }),
      p('③ 避免使用表格、圖表、頁眉頁腳放關鍵資訊——ATS 通常讀不到這些區域', { size: 21, sp: { before: 0, after: 0 } }),
    ], BG_GRAY, NAVY, 12),
    gap(120),
    sub('二、AI 影片初篩面試：你是在對著鏡頭說話，不是和人交談'),
    p('HireVue、Interviewer.AI 等 AI 影片面試工具，已在部分外商和科技公司的第一關大規模普及。你會收到一個連結，錄製回答，由 AI 分析你的語氣、用詞、情緒表達，再產出評分報告給人資。這個環境和真人對談完全不同，沒有互動、沒有表情回饋、有嚴格的時間限制。', { size: 22, sp: { before: 0, after: 80 } }),
    callout([
      p('AI 影片面試的準備重點：', { runs: [r('AI 影片面試的準備重點：', { size: 21, bold: true })], sp: { before: 0, after: 60 } }),
      p('・事前練習：用手機自己錄影，習慣看鏡頭說話的感覺，而不是看螢幕', { size: 21, sp: { before: 0, after: 40 } }),
      p('・開場 10 秒很關鍵：AI 會分析你的表情和開場語氣，不要用「呃」或長時間沉默開頭', { size: 21, sp: { before: 0, after: 40 } }),
      p('・結構清晰優先：AI 傾向給「有清楚邏輯結構的回答」更高分，STAR 框架在這裡格外有用', { size: 21, sp: { before: 0, after: 40 } }),
      p('・說話節奏要穩：不要因為緊張加速說話，清晰比快更重要', { size: 21, sp: { before: 0, after: 0 } }),
    ], BG_GRAY, NAVY, 12),
    gap(120),
    sub('三、壓力面試：當面試官開始質疑你的答案'),
    p('部分顧問公司、外商金融業、以及部分主管職面試，會刻意使用壓力測試（Stress Interview）技巧——目的不是要讓你難堪，而是觀察你在壓力下的反應與思維韌性。', { size: 22, sp: { before: 0, after: 80 } }),
    callout([
      p('常見的壓力手法：', { runs: [r('常見的壓力手法：', { size: 21, bold: true })], sp: { before: 0, after: 50 } }),
      p('・「你的例子聽起來不是很有說服力。」——沉默施壓，或直接質疑你的答案', { size: 21, sp: { before: 0, after: 40 } }),
      p('・「你說的這個，其實是很基礎的做法，你有沒有想過更好的方式？」——逼你防守', { size: 21, sp: { before: 0, after: 40 } }),
      p('・沉默超過 5 秒不說話——測試你是否會慌亂地補充或改變答案', { size: 21, sp: { before: 0, after: 80 } }),
      p('應對策略：', { runs: [r('應對策略：', { size: 21, bold: true })], sp: { before: 0, after: 50 } }),
      p('・保持鎮定：對方的質疑是測試，不是攻擊。深呼吸，不要急著認錯或道歉', { size: 21, sp: { before: 0, after: 40 } }),
      p('・確認對方的問題：「我想確認一下，您是對哪個部分有疑問？」', { size: 21, sp: { before: 0, after: 40 } }),
      p('・維護你的立場，但保持開放：「我理解您的觀點。我當時選擇這個做法，是因為 ___。如果您有其他方式的建議，我很願意聽聽看。」', { size: 21, sp: { before: 0, after: 0 } }),
    ], BG_GRAY, NAVY, 12),
    gap(120),
    sub('四、多對一面試（Panel Interview）'),
    callout([
      p('・眼神分配：回答時先看提問者，再掃視其他人，結尾再回到提問者。不要只盯著一個人，也不要隨機掃視', { size: 21, sp: { before: 0, after: 40 } }),
      p('・不同層級，不同語氣：對技術面試官可以說專業術語；對高層或業務面試官，說商業影響和結果更有共鳴', { size: 21, sp: { before: 0, after: 40 } }),
      p('・進場前確認名字和職稱：你可以事先請 HR 告知出席者的名字和職位', { size: 21, sp: { before: 0, after: 40 } }),
      p('・沉默的面試官：如果某位面試官全程沒有問問題，不要忽視他。結尾可以問：「不知道在座的各位有沒有其他想深入了解的？」', { size: 21, sp: { before: 0, after: 0 } }),
    ], BG_GRAY, NAVY, 12),
    gap(120),
    sub('五、情境題 vs. 行為題：兩種完全不同的答題邏輯'),
    cmpTable([
      ['行為題（BI）：「說一個你曾經...的例子」', '情境題（SI）：「如果你遇到...你會怎麼做？」'],
      ['STAR 框架：用真實發生過的事件回答，有具體時間、人物、結果', '思考框架：說清楚你的判斷邏輯和步驟，不必有真實案例，但要展示你的思維方式'],
    ]),
    gap(80),
    callout([p('情境題的好回答：「遇到這種情況，我會先 ___，原因是 ___；接著我會 ___，判斷依據是 ___⋯⋯」說出決策過程，而不是說「我以前遇過這個，我是這樣做的」（那是 STAR 的邏輯）。', { size: 21, sp: { before: 0, after: 0 } })], BG_BLUE, BLUE, 12),
  ];
}

// ── APPENDIX 3：個人化工作表 ─────────────────────────────────────────
function buildA3() {
  const wsTitle = (t) => p('', { runs: [r(t, { size: 24, bold: true, color: NAVY })], sp: { before: 160, after: 80 } });
  const fillLine = (label, wide) => {
    const lW = 2200; const rW = W - lW;
    return new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: [lW, rW],
      rows: [new TableRow({ children: [
        new TableCell({ width: { size: lW, type: WidthType.DXA }, shading: { fill: BG_GRAY, type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: tb(), right: tb() }, margins: { top: 60, bottom: 60, left: 120, right: 80 }, children: [p(label, { sp: { before: 0, after: 0 }, size: 21 })] }),
        new TableCell({ width: { size: rW, type: WidthType.DXA }, shading: { fill: WHITE, type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: tb(), right: tb() }, margins: { top: 60, bottom: 60, left: 120, right: 80 }, children: [p(wide || '', { sp: { before: 0, after: 0 }, size: 21, color: '999999' })] }),
      ]})]
    });
  };

  return [
    ...appHeader('三', '個人化工作表'),
    p('把框架填成你自己的版本，才是這本書真正的用法。', { size: 22, sp: { before: 0, after: 120 } }),
    wsTitle('工作表一：3P 自我介紹草稿'),
    fillLine('【P1 — Profile：我是什麼人】', '我是一個在______深耕___年的人，核心能力是______'),
    gap(40),
    fillLine('【P2 — Proof：我有什麼證明】', '舉個例子，在前一份工作，我______，結果是______'),
    gap(40),
    fillLine('【P3 — Purpose：我為什麼在這裡】', '我來這裡，是因為______，我相信我在______的能力，能幫助你們______'),
    gap(40),
    fillLine('目標時間：', '___秒（目標：90 秒）'),
    gap(120),
    wsTitle('工作表二：3M 為什麼錄取你備稿表'),
    p('先把目標職位的 JD 拿出來，找出最核心的 3 個能力需求，逐一填入：', { size: 21, sp: { before: 0, after: 80 } }),
    fillLine('【M1】JD 需要能力 1', '我的對應證明（數字 + 情境）：'),
    gap(40),
    fillLine('【M1】JD 需要能力 2', '我的對應證明：'),
    gap(40),
    fillLine('【M1】JD 需要能力 3', '我的對應證明：'),
    gap(40),
    fillLine('【M2】我有一個不一樣的地方', '其他應徵者可能沒有的背景或視角：'),
    gap(40),
    fillLine('【M3】我為什麼真的想來這裡', '我注意到貴公司______，這對我來說很有共鳴，因為______'),
    gap(120),
    wsTitle('工作表三：面試前一天最終確認清單'),
    ...['□  我的 3P 自我介紹可以流暢地說完，不看稿',
       '□  我準備了至少 7 個 STAR 故事，每個都有數字',
       '□  我研究過這家公司的官網、近期新聞、LinkedIn 頁面',
       '□  我把 JD 的關鍵詞抄下來，並對應了我的能力',
       '□  我知道為什麼要去這家公司（不是「廣投碰運氣」）',
       '□  我有 3 個問題可以問面試官（依輪次準備）',
       '□  我知道薪資期待的市場區間，有一個有根據的答案',
       '□  我的離職原因版本清楚、正向、沒有批評前雇主',
       '□  如果是 AI 影片面試：我已練習過對鏡頭說話，熟悉錄製環境',
       '□  視訊面試：環境、光線、音訊、網路已確認（如適用）',
    ].map(item => p(item, { size: 21, sp: { before: 0, after: 40 } })),
  ];
}

// ── APPENDIX 4：自我評估 ─────────────────────────────────────────────
function buildA4() {
  const rows = [
    ['自我介紹（/20）', '20 分：3P 完整、有數字、能流暢說完 90 秒。10 分：內容有但不夠精準。0 分：還是在說工作歷史清單', '___/20'],
    ['STAR 故事庫（/20）', '20 分：7 個故事備齊，每個都有數字且練習過口說。10 分：5 個故事，但有些細節模糊。0 分：靠即興', '___/20'],
    ['公司研究深度（/20）', '20 分：官網、新聞、LinkedIn、JD 關鍵詞全部研究，能說出一個具體的「我注意到」。10 分：大概知道公司做什麼。0 分：沒有特別研究', '___/20'],
    ['轉職 / 離職故事（/15）', '15 分：Pull 框架清楚、正向、有能力連結。8 分：有理由但表達不夠流暢。0 分：還是從「公司不好」說起', '___/15'],
    ['薪資與問題準備（/15）', '15 分：薪資有市場根據、有範圍；問題依輪次準備好 3 題。8 分：有準備但不夠細緻。0 分：完全沒想過', '___/15'],
    ['練習次數（/10）', '10 分：口說練習 3 次以上，至少一次有人幫你聽。5 分：自己練習過 1–2 次。0 分：只在腦子裡想過', '___/10'],
  ];
  const ws = [2000, W - 2000 - 800, 800];
  return [
    ...appHeader('四', '面試準備完成度自我評估'),
    p('在面試前一週做一次自評。每個維度 0–20 分，總分 100 分。', { size: 22, sp: { before: 0, after: 80 } }),
    new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: ws,
      rows: [
        new TableRow({ tableHeader: true, children: ['維度', '評分標準', '你的分數'].map((h, i) =>
          new TableCell({ width: { size: ws[i], type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, borders: { top: NB, bottom: NB, left: NB, right: tb(WHITE) }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, children: [p('', { runs: [r(h, { size: 20, bold: true, color: WHITE })], sp: { before: 0, after: 0 }, align: AlignmentType.CENTER })] })
        )}),
        ...rows.map(([dim, std, score], i) => new TableRow({ children: [
          new TableCell({ width: { size: ws[0], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? BG_BLUE : WHITE, type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: NB, right: tb() }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, children: [p(dim, { sp: { before: 0, after: 0 }, size: 21, bold: true })] }),
          new TableCell({ width: { size: ws[1], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? BG_BLUE : WHITE, type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: NB, right: tb() }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, children: [p(std, { sp: { before: 0, after: 0 }, size: 20 })] }),
          new TableCell({ width: { size: ws[2], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? BG_BLUE : WHITE, type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: NB, right: NB }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [p(score, { sp: { before: 0, after: 0 }, size: 22, bold: true, color: NAVY, align: AlignmentType.CENTER })] }),
        ]}))
      ]
    }),
    gap(80),
    callout([
      p('', { runs: [r('總分：___/100', { size: 26, bold: true, color: NAVY })], sp: { before: 0, after: 80 } }),
      p('85–100：充分準備，可以自信上場', { size: 21, sp: { before: 0, after: 40 } }),
      p('70–84：基本到位，針對扣分維度再強化', { size: 21, sp: { before: 0, after: 40 } }),
      p('55–69：有明顯缺口，建議再給自己 3–5 天準備', { size: 21, sp: { before: 0, after: 40 } }),
      p('54 以下：需要系統性補強，建議用 30 天計畫重新準備', { size: 21, sp: { before: 0, after: 0 } }),
    ], BG_GRAY, NAVY, 12),
    gap(80),
    ctaBox(
      '你的準備分數是多少？',
      '69 分以下：你現在最需要的不是再看一遍這本書，而是一次真實的模擬對話。閉卷練習只能告訴你知不知道，沒辦法告訴你說不說得好。\n70–84 分：基本到位，一次模擬面試可以幫你精準找到最後的缺口。\n85 分以上：你已經準備好了。加一次模擬面試，是把「應該沒問題」變成「確定沒問題」。',
      '預約模擬面試　LINE: @tzlth　｜　NT$1,200 / 60 分鐘'
    ),
  ];
}

// ── APPENDIX 5：30天計畫 ─────────────────────────────────────────────
function buildA5() {
  const week = (title, items) => [
    p('', { runs: [r(title, { size: 22, bold: true, color: NAVY })], sp: { before: 0, after: 60 } }),
    ...items.map(item => p(`・${item}`, { size: 21, sp: { before: 0, after: 40 } })),
    gap(60),
  ];
  return [
    ...appHeader('五', '30 天面試備戰計畫'),
    p('適用：你有一個明確的目標職位，但不確定從哪裡開始準備。', { size: 22, sp: { before: 0, after: 80 } }),
    callout([
      ...week('第一週：認識自己（建立材料庫）', [
        '用框架四的 Pull 框架，寫出你的轉職故事（50–100 字草稿）',
        '列出你過去 5 年最有成就感的 5 件事，找出能力共同點',
        '梳理 STAR 故事庫，先把 7 個主題的關鍵事件寫下來（先有骨架）',
        '寫出你的 3P 自我介紹草稿，讀出來錄音，自己聽一遍',
      ]),
      ...week('第二週：研究市場（對應目標）', [
        '收集 3–5 個目標職位的 JD，把出現超過 2 次的關鍵詞圈出來',
        '研究 2–3 家最想去的公司：官網、新聞、LinkedIn、CakeResume 評價',
        '對照 JD 補完你的 3M 備稿表',
        '用 104 薪資情報、CakeResume 確認目標薪資的市場區間',
      ]),
      ...week('第三週：練習框架（逐題磨透）', [
        '每天練習 2–3 個框架，優先從你最弱的開始',
        '把每個框架的答案口說錄音，聽完找出卡頓和不自然的地方',
        '找一個朋友或找職涯顧問做一次模擬面試',
        '如果是外商：加入 AI 影片面試練習（用手機錄製 3–5 分鐘的模擬回答）',
        '針對你最常說壞的題目（通常是缺點題或轉職動機），反覆練習到流暢',
      ]),
      ...week('第四週：整合演練（收尾確認）', [
        '做一次完整模擬面試（從自我介紹到你有什麼問題，全程 30–45 分鐘）',
        '完成面試準備完成度自評，針對低分維度補強',
        '確認視訊環境（如適用）、準備跟進信草稿（如適合發信的情境）',
        '面試前一天：輕量複習，不要新增材料——休息好比最後一分鐘死背更重要',
      ]),
    ], BG_GRAY, NAVY, 12),
  ];
}

// ── APPENDIX 6：英文面試 ─────────────────────────────────────────────
function buildA6() {
  return [
    ...appHeader('六', '英文面試準備（擴充版）'),
    p('適用：應徵外商、科技業、新創，需要用英文進行面試的讀者。', { size: 22, sp: { before: 0, after: 80 } }),
    callout([
      p('好消息：所有框架（3P、SCA、STAR、3M⋯⋯）的邏輯完全適用於英文面試。你不需要學一套新的思考方式，只需要把答案翻譯成英文，並注意幾個語氣差異。', { size: 22, sp: { before: 0, after: 0 } }),
    ], BG_BLUE, BLUE, 12),
    gap(120),
    secTitle('語氣差異：中文版 vs. 英文版'),
    cmpTable([
      ['中文版（台灣本土企業）：「我在後勤領域有 15 年的經驗，主要負責資源調度與團隊管理⋯⋯」', '英文版（外商期待的語氣）："I\'m a supply chain professional with 15 years of experience specializing in cross-functional coordination and resource planning. In my last role, I led a 30-person team and maintained a 100% on-time delivery rate for 5 consecutive years."'],
    ]),
    gap(80),
    p('關鍵差異：英文版直接說「I\'m a ___ professional」，先定位自己；數字緊接在後。中文的含蓄在英文面試中會被解讀為缺乏自信。', { size: 21, color: '555555', italic: true, sp: { before: 0, after: 120 } }),
    secTitle('常見題型英文句型框架'),
    callout([
      p('弱點題（RIG 框架英文版）：', { runs: [r('弱點題（RIG 框架英文版）：', { size: 21, bold: true, color: NAVY })], sp: { before: 0, after: 50 } }),
      p('"One area I\'ve actively worked on is ___. Early in my career, I noticed that ___, which led to ___. Since then, I\'ve been ___, and I\'ve seen real improvement in ___."', { size: 21, italic: true, color: '444444', sp: { before: 0, after: 80 } }),
      p('轉職動機（Pull 框架英文版）：', { runs: [r('轉職動機（Pull 框架英文版）：', { size: 21, bold: true, color: NAVY })], sp: { before: 0, after: 50 } }),
      p('"Through my work in ___, I developed a strong foundation in ___. What drew me toward [new field] is that the core problems here — ___ and ___ — are actually very similar to what I\'ve been solving, just at a different scale and context."', { size: 21, italic: true, color: '444444', sp: { before: 0, after: 80 } }),
      p('失敗經驗（RAG 框架英文版）：', { runs: [r('失敗經驗（RAG 框架英文版）：', { size: 21, bold: true, color: NAVY })], sp: { before: 0, after: 50 } }),
      p('"I\'d like to share a situation where I made a misjudgment. I [what you did], which resulted in [consequence]. Looking back, the issue was that I [what went wrong — your responsibility]. Since then, I\'ve made it a point to [specific behavior change], which has helped me avoid similar situations."', { size: 21, italic: true, color: '444444', sp: { before: 0, after: 0 } }),
    ], BG_GRAY, NAVY, 12),
    gap(120),
    secTitle('英文面試的節奏管理'),
    p('・清晰度比速度更重要：比平常說話速度慢 10–15%，對方更容易完整接收你的意思', { size: 21, sp: { before: 0, after: 40 } }),
    p('・善用停頓：聽完問題後停頓 2–3 秒，傳達你在思考而不是慌張', { size: 21, sp: { before: 0, after: 40 } }),
    p('・沒聽清楚？直接說："Could you clarify what you mean by ___?" 這是溝通能力，不是弱點', { size: 21, sp: { before: 0, after: 40 } }),
    p('・需要時間思考？說："Let me take a moment to think about that." 比馬上說出凌亂的答案好得多', { size: 21, sp: { before: 0, after: 0 } }),
  ];
}

// ── APPENDIX 7：不同背景應用範例 ─────────────────────────────────────
function buildA7() {
  const bgTitle = (t) => p('', { runs: [r(t, { size: 23, bold: true, color: NAVY })], sp: { before: 160, after: 80 } });
  const note = (text) => callout([p(`💡 ${text}`, { size: 21, sp: { before: 0, after: 0 } })], BG_YELLOW, ORANGE, 12);

  return [
    ...appHeader('七', '不同背景的應用範例'),
    p('本書前面的範例以「後勤主任轉供應鏈」與「研究助理轉 PM」為主。這個附錄補充六種常見背景的應用示範。', { size: 22, sp: { before: 0, after: 80 } }),

    bgTitle('一、業務背景：轉職業務主管或企劃'),
    p('背景設定：具 5 年 B2B 業務經驗，年均達成率 115%，現轉職應徵業務主管或行銷企劃。', { size: 20, color: '555555', italic: true, sp: { before: 0, after: 80 } }),
    exBlock([
      { tag: 'P1', text: '我在 B2B 銷售領域深耕 5 年，核心能力是理解客戶的業務痛點，並把產品的解決方案說到讓決策者買單。' },
      { tag: 'P2', text: '在前一份工作，我負責 12 家製造業客戶，過去三年平均達成率 115%，其中有兩個年度是全團隊最高。我一個人從零跑出來的最大客戶，年度合約金額超過 NT$800 萬。' },
      { tag: 'P3', text: '我來這裡，是因為我發現自己在銷售過程中，最有成就感的部分不是成交本身，而是協助客戶清楚定義他們需要解決的問題。這和貴公司主管職要帶團隊找策略方向的需求，我覺得高度吻合。' },
    ]),
    gap(60), note('業務背景應用要點：數字是你最強的武器，不要省。達成率、客戶數、合約金額，每一個都比「客戶關係良好」有力十倍。'),

    bgTitle('二、軟體工程師背景：轉職技術主管或跨域 PM'),
    p('背景設定：後端工程師 7 年，熟悉系統架構設計，主導兩個核心服務重構，現轉職應徵 Engineering Manager 或 Technical PM。', { size: 20, color: '555555', italic: true, sp: { before: 0, after: 80 } }),
    exBlock([
      { tag: 'S', text: '去年我們有一個核心 API 服務，每逢月底結帳高峰期就會出現 P0 故障，每次影響範圍超過 3 萬個活躍用戶，工程團隊已經三度修補，問題仍反覆出現。' },
      { tag: 'T', text: '我自告奮勇主導根本原因分析，目標是在下一個月底前徹底解決，不能再靠打補丁撐過去。' },
      { tag: 'A', text: '我的判斷是，過去的修補都在治標——看 log、修那個地方——但沒有人回頭問「為什麼每次都在這個時間點爆」。我花了兩天做壓力測試後發現，問題根源是資料庫連線池在高並發時被某個未優化的查詢佔滿。我重寫了查詢邏輯，並加入了連線池監控告警。' },
      { tag: 'R', text: '之後三個月底高峰期，該服務零故障，P99 延遲從 2.3 秒降到 0.4 秒。我學到的是：在高壓下最容易犯的錯，是把「快速有效果」和「解決根本問題」混為一談。' },
    ]),
    gap(60), note('工程師背景應用要點：把技術細節翻譯成「影響了多少用戶」「省了多少錢」「縮短了多少時間」，讓非技術主管也能看到成果的重量。'),

    bgTitle('三、財務／會計背景：轉職 FP&A 或管理顧問'),
    p('背景設定：會計師事務所審計 4 年，現轉職應徵企業 FP&A 或商業智能（BI）相關職位。', { size: 20, color: '555555', italic: true, sp: { before: 0, after: 80 } }),
    callout([
      p('在事務所四年，我花了大量時間在財報數字的正確性上，但讓我最投入的，其實是和客戶討論「數字背後代表什麼」的時候——為什麼毛利率下滑？這個費用趨勢如果持續，三年後會發生什麼事？', { size: 22, sp: { before: 0, after: 80 } }),
      p('我後來發現，FP&A 的核心工作，就是我在審計裡最喜歡的那一塊——把財務數據轉化成可以讓管理層做決策的洞察。而且是往前看，不是往後查。審計幫我打好了財務基礎和對數字的精確度要求；現在我想把這個基礎，用在更有預測性和策略性的方向上。', { size: 22, sp: { before: 0, after: 0 } }),
    ], BG_BLUE, BLUE, 12),
    gap(60), note('財務背景應用要點：轉職最大的挑戰是讓對方相信你不只是「數字準確」，而是能「用數字說故事、幫決策」。Pull 框架一定要說清楚你被什麼「拉過來」。'),

    bgTitle('四、教育背景：教師或補教業轉職企業培訓、HR、UX 研究'),
    p('背景設定：高中教師 6 年，現轉職應徵企業內部培訓專員、HR BP，或 UX 研究員。', { size: 20, color: '555555', italic: true, sp: { before: 0, after: 80 } }),
    exBlock([
      { tag: 'S', text: '我最核心的能力是「快速讀懂一個人的學習障礙在哪裡，然後找到最小阻力的路讓他理解」。' },
      { tag: 'C', text: '有一年我接手一個全校放棄的班，平均數學成績在全年級倒數第二。我沒有用補強版的課程——而是花了第一週訪談每個學生，找出他們是在哪個概念節點斷掉的。發現 80% 的同學卡在「分數運算」，而不是代數本身。' },
      { tag: 'A', text: '那一學年末，該班平均分數從全年級倒數第二進步到中段，有 3 位同學在校內競賽拿到名次。這個「診斷學習障礙、找關鍵節點、設計精準介入」的能力，在企業培訓和 UX 研究設計上，完全可以直接平移。' },
    ]),
    gap(60), note('教育背景應用要點：把「教學語言」翻譯成「企業語言」，不要說「我帶過學生」，要說「我設計過讓___人改變行為的介入方案」。'),

    bgTitle('五、醫療／護理背景：轉職醫療科技、健康管理、企業 ESG'),
    p('背景設定：急診護理師 5 年，有 ICU 輪調經驗，現轉職應徵醫療科技公司 BD、數位健康 PM，或企業健康管理顧問。', { size: 20, color: '555555', italic: true, sp: { before: 0, after: 80 } }),
    exBlock([
      { tag: 'M1', text: '這個 PM 職位需要的三件事，我都有實戰基礎：理解臨床流程——我在急診五年，對醫護工作流程的每一個摩擦點，比任何一個沒有臨床背景的 PM 都更直接；跨域溝通——急診室的日常就是在醫師、護理、行政、家屬之間當翻譯；高壓下快速決策——ICU 習慣的工作節奏就是：資訊不完整、時間有限、決策不能等。' },
      { tag: 'M2', text: '我最不一樣的地方是：我能用臨床視角找出醫療科技產品在真實環境裡的使用障礙，這是純商業背景的 PM 很難有的第一手知識。' },
      { tag: 'M3', text: '我研究過你們的遠距監測產品，特別是你們目前正在解決的「讓護理師在班次交接時減少手動紀錄時間」這個問題。這正是我在臨床最常遇到的效率瓶頸，我認為我在這裡能做的，不只是管產品，而是幫你們真正理解使用者。' },
    ]),
    gap(60), note('醫護背景應用要點：你的臨床視角是競爭者幾乎不可能複製的護城河，3M 框架的 M2（差異化）在這裡最關鍵，要大聲說出來。'),

    bgTitle('六、應屆畢業生／無明顯工作成就：如何建立說服力'),
    p('背景設定：大學應屆畢業，有社團幹部、專題研究、打工兼職經驗，無正式工作經歷。', { size: 20, color: '555555', italic: true, sp: { before: 0, after: 80 } }),
    callout([
      p('五大素材來源：', { runs: [r('五大素材來源：', { size: 21, bold: true, color: NAVY })], sp: { before: 0, after: 60 } }),
      p('① 社團幹部：帶人、辦活動、解決衝突、控制預算——這些都是管理能力', { size: 21, sp: { before: 0, after: 40 } }),
      p('② 專題研究／畢業論文：定義問題、收集資料、分析、說服審委——結構化思考的完整展示', { size: 21, sp: { before: 0, after: 40 } }),
      p('③ 打工兼職：服務業、餐飲、零售的實際客戶互動，是比很多面試者更真實的 STAR 素材', { size: 21, sp: { before: 0, after: 40 } }),
      p('④ 競賽、實習、志工：只要有真實挑戰、你的判斷、具體結果，都可以進 STAR 故事庫', { size: 21, sp: { before: 0, after: 40 } }),
      p('⑤ 個人專案：自學技能並做出成果（架設網站、獨立接案、寫 side project）——主動性本身就是最好的能力展示', { size: 21, sp: { before: 0, after: 0 } }),
    ], BG_GRAY, NAVY, 12),
    gap(80),
    p('完整示範：社團財務長的 STAR 故事', { runs: [r('完整示範：社團財務長的 STAR 故事', { size: 21, bold: true, color: NAVY })], sp: { before: 0, after: 60 } }),
    exBlock([
      { tag: 'S', text: '大四擔任系學會財務長，管理 12 萬年度預算，負責 8 個活動的財務規劃與核銷。' },
      { tag: 'T', text: '前三個活動結束後，我發現實際支出比預估高了 40%。照這個速度，第六個活動就會沒有預算。' },
      { tag: 'A', text: '我回頭分析前三個活動的費用明細，找出最大的超支來源——是廠商報價和我們估的不是同一個項目（廠商報含稅，我算未稅）。我重做了預算表，要求之後每次廠商報價都統一格式，並設了 10% 的緩衝金作為風險準備。' },
      { tag: 'R', text: '後五個活動全部在預算內完成，最後結餘 8,000 元，是歷屆財務結餘最高的一屆。我從這件事學到的是：問題通常不在執行，而在定義——事先把「相同的詞是否指同一件事」確認清楚，可以省掉很多後來的麻煩。' },
    ]),
    gap(60), note('應屆畢業生應用要點：沒有工作經驗不等於沒有 STAR 素材。面試官面對應屆生，不是在比你有多少工作年資，而是在看你的思考邏輯和學習潛力。'),
  ];
}

// ── APPENDIX 8：Reference Check + Offer 比較 + 臨場失常 ──────────────
function buildA8() {
  return [
    ...appHeader('八', 'Reference Check、Offer 比較與臨場失常應對'),
    p('', { runs: [r('一、Reference Check：很多人忽略的最後一關', { size: 24, bold: true, color: NAVY })], sp: { before: 0, after: 80 } }),
    p('台灣的外商、科技公司和部分中大型本土企業，在進入 Offer 階段前會進行 Reference Check（推薦人查核）——由 HR 或獵才顧問主動聯絡你提供的推薦人，詢問你的工作表現、工作風格與離職原因。這一關往往被求職者忽略，但它確實有機會翻盤。', { size: 22, sp: { before: 0, after: 80 } }),
    callout([
      p('Reference Check 的五個準備動作：', { runs: [r('Reference Check 的五個準備動作：', { size: 21, bold: true, color: NAVY })], sp: { before: 0, after: 60 } }),
      p('① 提前告知推薦人。至少提前一週說：「我正在應徵 ___ 公司的 ___ 職位，他們可能會聯絡你做 Reference，你方便嗎？」', { size: 21, sp: { before: 0, after: 40 } }),
      p('② 選對推薦人。優先選「能說出具體 STAR 故事」的人，而不只是「職位比你高」的人。', { size: 21, sp: { before: 0, after: 40 } }),
      p('③ 給推薦人素材。告訴推薦人你在面試中強調了哪些能力或故事，讓他的回答和你的答案有一致性。', { size: 21, sp: { before: 0, after: 40 } }),
      p('④ 選三個，不只一個。外商通常要求 2–3 位推薦人，準備三位，讓自己有備援。', { size: 21, sp: { before: 0, after: 40 } }),
      p('⑤ Reference Check 結束後感謝推薦人。無論結果如何，都要發一封簡短的感謝訊息。', { size: 21, sp: { before: 0, after: 0 } }),
    ], BG_GRAY, NAVY, 12),
    gap(120),
    p('', { runs: [r('二、Offer 比較框架：收到多個機會時，怎麼理性決策', { size: 24, bold: true, color: NAVY })], sp: { before: 0, after: 80 } }),
    p('同時有多個 Offer 在手，是職涯中少見但高壓的時刻。以下框架幫助你把比較過程結構化，讓最終決定有據可查，而不只是「當下感覺」。', { size: 22, sp: { before: 0, after: 80 } }),
    (() => {
      const ws = [2200, 800, 1400, 1400, W - 2200 - 800 - 1400 - 1400];
      const rows = [
        ['薪酬包（月薪 + 年終 + 股票 + 福利）', '25%', '___/5', '___/5', '考慮年薪總額，而非只看月薪'],
        ['成長機會（職涯路徑、學習空間、升遷透明度）', '30%', '___/5', '___/5', '問清楚升遷機制和 Review 周期'],
        ['直屬主管與文化契合度', '25%', '___/5', '___/5', '直屬主管比公司品牌更影響日常滿意度'],
        ['工作穩定性與公司財務健康度', '20%', '___/5', '___/5', '新創或虧損公司的風險要納入計算'],
        ['加權總分', '100%', '___分', '___分', '各維度分數 × 權重後加總'],
      ];
      return new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: ws,
        rows: [
          new TableRow({ tableHeader: true, children: ['評估維度', '權重', 'Offer A', 'Offer B', '評分說明'].map((h, i) =>
            new TableCell({ width: { size: ws[i], type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, borders: { top: NB, bottom: NB, left: NB, right: tb(WHITE) }, margins: { top: 80, bottom: 80, left: 100, right: 80 }, children: [p('', { runs: [r(h, { size: 19, bold: true, color: WHITE })], sp: { before: 0, after: 0 }, align: AlignmentType.CENTER })] })
          )}),
          ...rows.map(([dim, w, a, b, note], i) => new TableRow({ children: [
            new TableCell({ width: { size: ws[0], type: WidthType.DXA }, shading: { fill: i === rows.length - 1 ? BG_BLUE : (i % 2 === 0 ? 'F5F8FF' : WHITE), type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: NB, right: tb() }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, children: [p(dim, { sp: { before: 0, after: 0 }, size: 20, bold: i === rows.length - 1 })] }),
            new TableCell({ width: { size: ws[1], type: WidthType.DXA }, shading: { fill: i === rows.length - 1 ? BG_BLUE : (i % 2 === 0 ? 'F5F8FF' : WHITE), type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: NB, right: tb() }, margins: { top: 80, bottom: 80, left: 60, right: 60 }, children: [p(w, { sp: { before: 0, after: 0 }, size: 20, align: AlignmentType.CENTER })] }),
            new TableCell({ width: { size: ws[2], type: WidthType.DXA }, shading: { fill: i === rows.length - 1 ? BG_BLUE : (i % 2 === 0 ? 'F5F8FF' : WHITE), type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: NB, right: tb() }, margins: { top: 80, bottom: 80, left: 60, right: 60 }, children: [p(a, { sp: { before: 0, after: 0 }, size: 22, bold: true, color: NAVY, align: AlignmentType.CENTER })] }),
            new TableCell({ width: { size: ws[3], type: WidthType.DXA }, shading: { fill: i === rows.length - 1 ? BG_BLUE : (i % 2 === 0 ? 'F5F8FF' : WHITE), type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: NB, right: tb() }, margins: { top: 80, bottom: 80, left: 60, right: 60 }, children: [p(b, { sp: { before: 0, after: 0 }, size: 22, bold: true, color: NAVY, align: AlignmentType.CENTER })] }),
            new TableCell({ width: { size: ws[4], type: WidthType.DXA }, shading: { fill: i === rows.length - 1 ? BG_BLUE : (i % 2 === 0 ? 'F5F8FF' : WHITE), type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: NB, right: NB }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, children: [p(note, { sp: { before: 0, after: 0 }, size: 20 })] }),
          ]}))
        ]
      });
    })(),
    gap(120),
    p('', { runs: [r('三、面試中途發揮失常：當場如何應對', { size: 24, bold: true, color: NAVY })], sp: { before: 0, after: 80 } }),
    p('不是每一場面試都會從頭到尾順暢。問題不在於有沒有失誤，而在於你如何在失誤之後繼續。', { size: 22, sp: { before: 0, after: 80 } }),
    callout([
      p('五種臨場失常的應對方式：', { runs: [r('五種臨場失常的應對方式：', { size: 21, bold: true, color: NAVY })], sp: { before: 0, after: 60 } }),
      p('狀況一（某一題說得很差）：不要在心裡反覆演播剛才那題。在下一題開口前，深呼吸一次，把注意力完全帶到新問題上。', { size: 21, sp: { before: 0, after: 40 } }),
      p('狀況二（腦袋空白）：直接說：「讓我想一下。」停頓 3–5 秒，然後說：「我想先確認一下，您問的是 ___，對嗎？」大多數面試官對「能沉著思考再開口」的人評價是正向的。', { size: 21, sp: { before: 0, after: 40 } }),
      p('狀況三（說到一半走錯方向）：直接說：「我想重新整理一下我的答案」——能主動校正方向，本身就是清楚思考的展示，不是弱點。', { size: 21, sp: { before: 0, after: 40 } }),
      p('狀況四（問題和準備的完全不同）：用你準備好的 STAR 故事作為素材，重新包裝切入角度。先說：「這讓我想到一個相關的例子……」', { size: 21, sp: { before: 0, after: 40 } }),
      p('狀況五（面試結束後才想到更好的答案）：在跟進信裡補充：「面試中您問到 ___，我事後覺得我可以補充說明 ___，因為 ___。」', { size: 21, sp: { before: 0, after: 0 } }),
    ], BG_GRAY, NAVY, 12),
  ];
}

// ── CLOSING + SERVICES ───────────────────────────────────────────────
function buildClosing() {
  return [
    pgBreak(),
    callout([
      p('', { runs: [r('最後的話', { size: 34, bold: true, color: NAVY })], sp: { before: 0, after: 120 } }),
      p('說實話，我在輔導求職者的這些年，看過太多人把自己準備得「太完美」——答案背得一字不差，表情也練習到位，進了面試室卻反而更緊張，因為任何一點偏差都讓他們覺得快要崩掉。', { size: 22, sp: { before: 0, after: 80 } }),
      p('框架不是在幫你背答案。它做的事，是讓你在緊張的當下知道「下一句要說的方向是什麼」——不是什麼字，是什麼方向。這一點方向感，在面試室裡的價值超過你想像。', { size: 22, sp: { before: 0, after: 80 } }),
      p('你還是會緊張。這是正常的——緊張代表你在乎。有框架和沒有框架的差別，不在於有沒有感到緊張，而在於緊張的時候有沒有一個結構讓你繼續說下去。', { size: 22, sp: { before: 0, after: 80 } }),
      p('把這些框架用你自己的故事填滿，用你自己的語氣說出來，然後去試試看。', { size: 22, sp: { before: 0, after: 100 } }),
      p('', { runs: [r('那就夠了。', { size: 28, bold: true, color: NAVY })], sp: { before: 0, after: 0 }, align: AlignmentType.RIGHT }),
    ], BG_GRAY, NAVY, 4),
    gap(160),
    pgBreak(),
    p('', { runs: [r('把框架帶進真實對話', { size: 30, bold: true, color: NAVY })], sp: { before: 0, after: 80 } }),
    p('書裡的框架，讀完就能用。但「知道怎麼說」和「在壓力下說得好」之間，還有一段距離。這段距離，不是靠再讀一遍書可以縮短的——它需要真實的對話、即時的回饋、以及一個習慣在你緊張的時候說實話的人。', { size: 22, sp: { before: 0, after: 120 } }),
    callout([
      p('', { runs: [r('① 模擬面試｜NT$1,200 / 60 分鐘', { size: 24, bold: true, color: NAVY })], sp: { before: 0, after: 60 } }),
      p('適合：正在密集準備，想在開考前先考一次的人。', { size: 22, sp: { before: 0, after: 40 } }),
      p('你選擇你要模擬的職位和重點題型，我用接近真實面試的方式進行，即時給你回饋：哪裡說清楚了、哪裡說了但對方可能沒聽進去、哪個地方的判斷邏輯還不夠顯。', { size: 22, sp: { before: 0, after: 40 } }),
      p('一次 60 分鐘的模擬，通常等於你自己對著鏡子練兩到三週的效果——因為你不知道你哪裡說不好，直到有人告訴你。', { size: 22, sp: { before: 0, after: 0 } }),
    ], BG_BLUE, BLUE, 20),
    gap(80),
    callout([
      p('', { runs: [r('② 一對一職涯諮詢｜NT$1,500 起', { size: 24, bold: true, color: NAVY })], sp: { before: 0, after: 60 } }),
      p('適合：對自己的職涯方向有疑問，或需要幫助整理轉職邏輯的人。', { size: 22, sp: { before: 0, after: 40 } }),
      p('如果你還不確定要往哪個方向走、不知道如何說清楚你的轉職動機、或是有多個 Offer 不知道怎麼選——這個諮詢幫你把問題理清楚，讓你帶著更清晰的方向走出去。', { size: 22, sp: { before: 0, after: 0 } }),
    ], BG_BLUE, BLUE, 20),
    gap(80),
    callout([
      p('', { runs: [r('③ 方向快速釐清｜NT$600 / 30 分鐘', { size: 24, bold: true, color: NAVY })], sp: { before: 0, after: 60 } }),
      p('適合：有一個具體問題想快速釐清，不需要完整諮詢的人。', { size: 22, sp: { before: 0, after: 40 } }),
      p('「我要怎麼回答這個面試問題」「這個 Offer 應不應該接」「這份履歷改這裡對嗎」——如果你有一個明確的問題，30 分鐘通常夠用。', { size: 22, sp: { before: 0, after: 0 } }),
    ], BG_BLUE, BLUE, 20),
    gap(120),
    callout([
      p('', { runs: [r('聯絡方式', { size: 24, bold: true, color: NAVY })], sp: { before: 0, after: 60 } }),
      p('LINE 官方帳號：@tzlth（或掃描官網 QR Code）', { size: 22, sp: { before: 0, after: 40 } }),
      p('職涯停看聽', { size: 22, bold: true, sp: { before: 0, after: 0 } }),
    ], BG_ORANGE, ORANGE, 24),
    gap(120),
    p('版權所有・蒲朝棟 Tim・職涯停看聽　本電子書僅供個人使用，請勿轉載、轉售或公開分享。', { size: 18, color: '888888', sp: { before: 0, after: 0 }, align: AlignmentType.CENTER }),
  ];
}

module.exports = { buildA1, buildA2, buildA3, buildA4, buildA5, buildA6, buildA7, buildA8, buildClosing };
