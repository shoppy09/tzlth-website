const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, WidthType, ShadingType, BorderStyle,
  VerticalAlign, PageNumber, PageBreak, LevelFormat, HeadingLevel,
} = require('docx');
const fs = require('fs');

// ── CONSTANTS ────────────────────────────────────────────────────────
const NAVY   = '1D3A5C';
const NAVY2  = '263F6E';
const ORANGE = 'E07020';
const BLUE   = '2471A3';
const RED    = 'C0392B';
const GREEN  = '1E7A40';
const BG_BLUE   = 'EBF5FB';
const BG_ORANGE = 'FEF5EC';
const BG_YELLOW = 'FFFCF0';
const BG_GREEN  = 'F0FAF0';
const BG_GRAY   = 'F7F8FA';
const BG_RED    = 'FEF0EF';
const WHITE  = 'FFFFFF';
const LGRAY  = 'CCCCCC';

const W = 9026; // content width DXA (A4 1" margins)
const NB = { style: BorderStyle.NONE, size: 0, color: WHITE };
const tb = (c) => ({ style: BorderStyle.SINGLE, size: 1, color: c || LGRAY });
const lb = (c, s) => ({ style: BorderStyle.SINGLE, size: s || 20, color: c || NAVY });

// ── TEXT / PARAGRAPH HELPERS ─────────────────────────────────────────
const r = (text, o = {}) => new TextRun({ text, font: 'Arial', size: o.size || 22,
  bold: o.bold || false, color: o.color || '222222', italics: o.italic || false });
const p = (text, o = {}) => new Paragraph({
  spacing: o.sp || { before: 80, after: 80 },
  alignment: o.align || AlignmentType.LEFT,
  children: o.runs || [r(text, o)],
  ...(o.paraOpts || {}),
});
const gap = (b = 120) => new Paragraph({ spacing: { before: b, after: 0 }, children: [r('')] });
const pgBreak = () => new Paragraph({ children: [new PageBreak()] });
const bold = (text, size, color) => r(text, { bold: true, size: size || 22, color: color || NAVY });

// ── SECTION TITLE ─────────────────────────────────────────────────────
function secTitle(text) {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [r(text, { bold: true, size: 24, color: NAVY })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY, space: 4 } },
  });
}

// ── SINGLE-CELL CALLOUT BOX ───────────────────────────────────────────
function callout(paras, bg, leftColor, leftSize) {
  const left = { style: BorderStyle.SINGLE, size: leftSize || 20, color: leftColor || NAVY };
  const side = tb(LGRAY);
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA },
      shading: { fill: bg || BG_GRAY, type: ShadingType.CLEAR },
      borders: { top: side, bottom: side, right: side, left: left },
      margins: { top: 100, bottom: 100, left: 200, right: 160 },
      children: paras,
    })]})]
  });
}

// ── CHAPTER HEADER ────────────────────────────────────────────────────
function chapterHeader(priority, num, title, topic, framework) {
  const lW = 1600; const rW = W - lW;
  const priorityColor = priority.startsWith('P1') ? 'FFB347' : priority.startsWith('P2') ? 'FFD580' : 'A8E6A0';
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [lW, rW],
    rows: [new TableRow({ children: [
      new TableCell({
        width: { size: lW, type: WidthType.DXA },
        shading: { fill: NAVY, type: ShadingType.CLEAR },
        borders: { top: NB, bottom: NB, left: NB, right: NB },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 140, bottom: 140, left: 160, right: 120 },
        children: [
          p('', { runs: [r(priority, { size: 17, bold: true, color: priorityColor })], sp: { before: 0, after: 40 }, align: AlignmentType.CENTER }),
          p('', { runs: [r(`框架${num}`, { size: 38, bold: true, color: WHITE })], sp: { before: 0, after: 40 }, align: AlignmentType.CENTER }),
          p('', { runs: [r(topic, { size: 18, color: 'AACCEE' })], sp: { before: 0, after: 0 }, align: AlignmentType.CENTER }),
        ],
      }),
      new TableCell({
        width: { size: rW, type: WidthType.DXA },
        shading: { fill: NAVY2, type: ShadingType.CLEAR },
        borders: { top: NB, bottom: NB, left: NB, right: NB },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 140, bottom: 140, left: 220, right: 160 },
        children: [
          p('', { runs: [r(title, { size: 28, bold: true, color: WHITE })], sp: { before: 0, after: 60 } }),
          p('', { runs: [r(`【${framework}】`, { size: 20, color: 'AACCEE' })], sp: { before: 0, after: 0 } }),
        ],
      }),
    ]})]
  });
}

// ── FRAMEWORK STRUCTURE BOX ───────────────────────────────────────────
function fwBox(items) {
  const lW = 1400; const rW = W - lW;
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [lW, rW],
    rows: items.map(({ label, text, sub }, i) => new TableRow({ children: [
      new TableCell({
        width: { size: lW, type: WidthType.DXA },
        shading: { fill: NAVY, type: ShadingType.CLEAR },
        borders: { top: tb(WHITE), bottom: tb(WHITE), left: NB, right: NB },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 120, right: 100 },
        children: [p('', { runs: [r(label, { size: 20, bold: true, color: WHITE })], sp: { before: 0, after: 0 }, align: AlignmentType.CENTER })],
      }),
      new TableCell({
        width: { size: rW, type: WidthType.DXA },
        shading: { fill: i % 2 === 0 ? BG_BLUE : 'F0F6FF', type: ShadingType.CLEAR },
        borders: { top: tb(LGRAY), bottom: tb(LGRAY), left: NB, right: NB },
        margins: { top: 100, bottom: 100, left: 180, right: 160 },
        children: [
          p('', { runs: [r(text, { size: 21 })], sp: { before: 0, after: sub ? 40 : 0 } }),
          ...(sub ? [p('', { runs: [r(sub, { size: 19, color: '555555', italic: true })], sp: { before: 0, after: 0 } })] : []),
        ],
      }),
    ]}))
  });
}

// ── COMPARISON TABLE ❌/✅ ─────────────────────────────────────────────
function cmpTable(rows) {
  const c1 = Math.floor(W / 2); const c2 = W - c1;
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [c1, c2],
    rows: [
      new TableRow({ tableHeader: true, children: [
        new TableCell({ width: { size: c1, type: WidthType.DXA }, shading: { fill: RED, type: ShadingType.CLEAR },
          borders: { top: NB, bottom: NB, left: NB, right: tb(WHITE) }, margins: { top: 80, bottom: 80, left: 160, right: 120 },
          children: [p('', { runs: [r('❌  常見錯誤', { size: 21, bold: true, color: WHITE })], sp: { before: 0, after: 0 }, align: AlignmentType.CENTER })] }),
        new TableCell({ width: { size: c2, type: WidthType.DXA }, shading: { fill: GREEN, type: ShadingType.CLEAR },
          borders: { top: NB, bottom: NB, left: NB, right: NB }, margins: { top: 80, bottom: 80, left: 160, right: 120 },
          children: [p('', { runs: [r('✅  改法', { size: 21, bold: true, color: WHITE })], sp: { before: 0, after: 0 }, align: AlignmentType.CENTER })] }),
      ]}),
      ...rows.map(([l, rv], i) => new TableRow({ children: [
        new TableCell({ width: { size: c1, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? BG_RED : 'FFF5F5', type: ShadingType.CLEAR },
          borders: { top: tb(), bottom: tb(), left: NB, right: tb() }, margins: { top: 80, bottom: 80, left: 160, right: 120 },
          children: [p(l, { sp: { before: 0, after: 0 }, size: 20 })] }),
        new TableCell({ width: { size: c2, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? BG_GREEN : 'F5FFF7', type: ShadingType.CLEAR },
          borders: { top: tb(), bottom: tb(), left: NB, right: NB }, margins: { top: 80, bottom: 80, left: 160, right: 120 },
          children: [p(rv, { sp: { before: 0, after: 0 }, size: 20 })] }),
      ]}))
    ]
  });
}

// ── EXAMPLE BLOCK ─────────────────────────────────────────────────────
function exBlock(items) {
  const tW = 680; const cW = W - tW;
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [tW, cW],
    rows: items.map(({ tag, text }, i) => new TableRow({ children: [
      new TableCell({
        width: { size: tW, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR },
        borders: { top: tb(WHITE), bottom: tb(WHITE), left: NB, right: NB },
        verticalAlign: VerticalAlign.TOP, margins: { top: 80, bottom: 80, left: 80, right: 60 },
        children: [p('', { runs: [r(`【${tag}】`, { size: 19, bold: true, color: WHITE })], sp: { before: 0, after: 0 }, align: AlignmentType.CENTER })],
      }),
      new TableCell({
        width: { size: cW, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? 'F5F8FF' : 'F0F5FF', type: ShadingType.CLEAR },
        borders: { top: tb(), bottom: tb(), left: NB, right: NB },
        margins: { top: 80, bottom: 80, left: 180, right: 160 },
        children: [p(text, { sp: { before: 0, after: 0 }, size: 21 })],
      }),
    ]}))
  });
}

// ── RECRUITER VIEW BOX ────────────────────────────────────────────────
const rvBox = (text) => callout([
  p('', { runs: [r('▌ 人資視角', { size: 21, bold: true, color: BLUE })], sp: { before: 0, after: 50 } }),
  p(text, { sp: { before: 0, after: 0 }, size: 21 }),
], BG_BLUE, BLUE, 20);

// ── WARNING BOX ───────────────────────────────────────────────────────
const warnBox = (text) => callout([p(`⚠️  ${text}`, { sp: { before: 0, after: 0 }, size: 21 })], BG_YELLOW, ORANGE, 16);

// ── CTA BOX ───────────────────────────────────────────────────────────
const ctaBox = (title, body, contact) => callout([
  p('', { runs: [r(title, { size: 23, bold: true, color: ORANGE })], sp: { before: 0, after: 60 } }),
  p(body, { sp: { before: 0, after: 60 }, size: 21 }),
  p('', { runs: [r(contact, { size: 22, bold: true, color: NAVY })], sp: { before: 0, after: 0 } }),
], BG_ORANGE, ORANGE, 24);

// ── FOLLOW-UP SECTION ─────────────────────────────────────────────────
function followup(qas) {
  return qas.flatMap(([q, a]) => [
    p('', { runs: [r(q, { size: 22, bold: true, color: NAVY })], sp: { before: 140, after: 50 } }),
    p(`→ ${a}`, { sp: { before: 0, after: 60 }, size: 21 }),
  ]);
}

// ════════════════════════════════════════════════════════════════════════
// CONTENT SECTIONS
// ════════════════════════════════════════════════════════════════════════

function buildCover() {
  const lW = 2200; const rW = W - lW;
  return [
    new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: [W],
      rows: [new TableRow({ children: [new TableCell({
        width: { size: W, type: WidthType.DXA },
        shading: { fill: NAVY, type: ShadingType.CLEAR },
        borders: { top: NB, bottom: NB, left: NB, right: NB },
        margins: { top: 600, bottom: 600, left: 400, right: 400 },
        children: [
          p('', { runs: [r('你說完，面試官才開口', { size: 52, bold: true, color: WHITE })], sp: { before: 0, after: 120 }, align: AlignmentType.LEFT }),
          p('12個讓對方記住你、而不是記住你答案的面試結構', { size: 26, color: 'AACCEE', sp: { before: 0, after: 200 } }),
          p('附完整框架、範例、人資視角與追問應對——從準備到 Offer', { size: 22, color: '8899BB', sp: { before: 0, after: 300 } }),
          p('', { runs: [
            r('CDA 認證職涯發展師　', { size: 22, color: 'BBCCDD' }),
            r('蒲朝棟 Tim', { size: 26, bold: true, color: WHITE }),
          ], sp: { before: 0, after: 80 } }),
          p('職涯停看聽｜LINE：@tzlth', { size: 21, color: 'AABBCC', sp: { before: 0, after: 0 } }),
        ],
      })]})],
    }),
    gap(200),
    callout([
      p('本書包含：', { runs: [r('本書包含：', { size: 22, bold: true, color: NAVY })], sp: { before: 0, after: 80 } }),
      p('・12 則核心面試框架（3P / SCA / RIG / STAR / 3M 等）', { size: 21, sp: { before: 0, after: 40 } }),
      p('・管理職補充框架 3 則', { size: 21, sp: { before: 0, after: 40 } }),
      p('・附錄一～八：準備清單、AI 時代應對、工作表、自評量表、30 天計畫、英文面試、六種背景示範、Offer 比較', { size: 21, sp: { before: 0, after: 40 } }),
      p('・每個框架附追問應對、人資視角、常見錯誤對照', { size: 21, sp: { before: 0, after: 0 } }),
    ], BG_BLUE, NAVY, 12),
    gap(80),
    p('NT$199　版權所有・蒲朝棟 Tim・職涯停看聽　本電子書僅供個人使用，請勿轉載、轉售或公開分享。',
      { size: 18, color: '888888', sp: { before: 0, after: 0 }, align: AlignmentType.CENTER }),
  ];
}

function buildIntro() {
  return [
    pgBreak(),
    p('', { runs: [r('使用說明', { size: 36, bold: true, color: NAVY })], sp: { before: 0, after: 120 } }),
    p('你有沒有準備了很久，進了面試室卻發現說出來的話連自己都不相信？', { size: 22, sp: { before: 0, after: 80 } }),
    p('這不是你的問題——是框架的問題。大多數人從來沒有被教過怎麼系統性地回答面試問題。他們要麼背稿（聽起來像在唸稿），要麼即興（每次說完都覺得沒說到重點）。這本書是為了解決這件事。', { size: 22, sp: { before: 0, after: 80 } }),
    p('這本指南整理了面試中最常出現、也最容易答壞的 12 種核心題型，涵蓋個人貢獻者到管理職所需的完整框架。每一個框架，都是從「面試官真正在評估什麼」這個問題往回設計的，不是從「標準答案長什麼樣子」出發的。', { size: 22, sp: { before: 0, after: 120 } }),
    secTitle('每一則框架的結構'),
    p('・為什麼這題很多人答壞（理解問題的本質）', { size: 21, sp: { before: 0, after: 40 } }),
    p('・高分回答框架（可直接套用的結構）', { size: 21, sp: { before: 0, after: 40 } }),
    p('・範例解析（真實案例改寫，附說明）', { size: 21, sp: { before: 0, after: 40 } }),
    p('・常見錯誤（你可能正在犯的）', { size: 21, sp: { before: 0, after: 40 } }),
    p('・追問應對（最常見的 2–3 個追問與應對方向）', { size: 21, sp: { before: 0, after: 120 } }),
    warnBox('AI 時代補充說明：2024–2025 年起，AI 影片初篩、ATS 關鍵字篩選、作業型面試已在外商與科技業大規模普及。本指南在附錄二新增「AI 時代面試準備」專章，請務必在準備正式面試前閱讀。'),
    gap(120),
    secTitle('12 則框架一覽'),
    buildOverviewTable(),
    gap(120),
    p('本書另含：', { runs: [r('本書另含：', { size: 22, bold: true, color: NAVY })], sp: { before: 0, after: 80 } }),
    p('・管理職補充：應徵主管職專用的 3 個額外框架（管理風格、績效問題、培育部屬）', { size: 21, sp: { before: 0, after: 40 } }),
    p('・個人化工作表：可直接填寫的備稿模板', { size: 21, sp: { before: 0, after: 40 } }),
    p('・面試準備完成度自評：面試前的 100 分自我檢查量表', { size: 21, sp: { before: 0, after: 40 } }),
    p('・30 天備戰計畫：從第一週梳理到面試日的完整節奏', { size: 21, sp: { before: 0, after: 40 } }),
    p('・AI 時代面試準備：ATS 優化、AI 影片面試、壓力面試、多對一面試應對策略', { size: 21, sp: { before: 0, after: 40 } }),
    p('・英文面試提示：外商／科技業英語面試的結構與用語調整', { size: 21, sp: { before: 0, after: 40 } }),
    p('・不同背景應用範例：業務、工程師、財務、教師、醫護、應屆生六種背景示範', { size: 21, sp: { before: 0, after: 120 } }),
    callout([
      p('', { runs: [r('關鍵提醒：', { size: 22, bold: true, color: NAVY }), r('讀完之後，你不需要「背答案」——你需要的，是用這些框架，寫出你自己的版本。', { size: 22 })], sp: { before: 0, after: 60 } }),
      p('📌 先讀，再練，最後驗證。書裡的框架，讀完就能用——但「說出來」和「說得好」之間，還有一段距離。框架幫你知道方向，真人模擬面試幫你知道你現在說得夠不夠好。如果你想在開考前先考一次，書末有模擬面試的服務說明。', { size: 21, sp: { before: 0, after: 0 } }),
    ], BG_BLUE, NAVY, 12),
  ];
}

function buildOverviewTable() {
  const rows = [
    ['一', '自我介紹', '3P（Profile-Proof-Purpose）'],
    ['二', '你的優點是什麼', 'SCA（Skill-Context-Achievement）'],
    ['三', '你的缺點是什麼', 'RIG（Real-Impact-Growth）'],
    ['四', '為什麼想轉換跑道', 'Pull，不是 Push'],
    ['五', '為什麼想來我們公司', '研究 + 連結'],
    ['六', '說一個你遇過最大的挑戰', 'STAR（進階版）'],
    ['七', '你的職涯規劃是什麼', '近 + 遠 + 連結'],
    ['八', '說明一段空白期 / 非典型背景', '誠實 + 意義化 + 未來連結'],
    ['九', '你為什麼離開上一份工作', '永遠說正向原因'],
    ['十', '薪資談判', '錨定 + 範圍 + 開放'],
    ['十一', '說一次你犯過的錯誤 / 失敗經驗', 'RAG（Real-Accountability-Growth）'],
    ['十二', '為什麼我們應該錄取你', '3M（Match-Merit-Motivation）'],
  ];
  const w1 = 800; const w2 = 3600; const w3 = W - w1 - w2;
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [w1, w2, w3],
    rows: [
      new TableRow({ tableHeader: true, children: [
        new TableCell({ width: { size: w1, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, borders: { top: NB, bottom: NB, left: NB, right: tb(WHITE) }, margins: { top: 80, bottom: 80, left: 100, right: 80 }, children: [p('', { runs: [r('框架', { size: 21, bold: true, color: WHITE })], sp: { before: 0, after: 0 }, align: AlignmentType.CENTER })] }),
        new TableCell({ width: { size: w2, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, borders: { top: NB, bottom: NB, left: NB, right: tb(WHITE) }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, children: [p('', { runs: [r('題型', { size: 21, bold: true, color: WHITE })], sp: { before: 0, after: 0 } })] }),
        new TableCell({ width: { size: w3, type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR }, borders: { top: NB, bottom: NB, left: NB, right: NB }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, children: [p('', { runs: [r('核心框架', { size: 21, bold: true, color: WHITE })], sp: { before: 0, after: 0 } })] }),
      ]}),
      ...rows.map(([num, topic, fw], i) => new TableRow({ children: [
        new TableCell({ width: { size: w1, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? NAVY2 : '2E4F7A', type: ShadingType.CLEAR }, borders: { top: tb(WHITE), bottom: tb(WHITE), left: NB, right: tb(WHITE) }, margins: { top: 80, bottom: 80, left: 100, right: 80 }, children: [p('', { runs: [r(num, { size: 21, bold: true, color: WHITE })], sp: { before: 0, after: 0 }, align: AlignmentType.CENTER })] }),
        new TableCell({ width: { size: w2, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? BG_BLUE : WHITE, type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: NB, right: tb() }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, children: [p(topic, { sp: { before: 0, after: 0 }, size: 21 })] }),
        new TableCell({ width: { size: w3, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? BG_BLUE : WHITE, type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: NB, right: NB }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, children: [p(fw, { sp: { before: 0, after: 0 }, size: 21 })] }),
      ]}))
    ]
  });
}

function buildNarrativeSpine() {
  return [
    pgBreak(),
    p('', { runs: [r('框架串聯：讓 12 個答案說同一個故事', { size: 30, bold: true, color: NAVY })], sp: { before: 0, after: 100 } }),
    p('面試是一場敘事工程，不是 12 道獨立的考題。許多人會認真準備每一題，卻忽略了一個致命問題：面試官在你走後，會把所有答案拼在一起看。', { size: 22, sp: { before: 0, after: 80 } }),
    p('如果你在自我介紹（框架一）說自己的核心強項是「跨部門協調」，卻在最大挑戰（框架六）說你在協調上遇到嚴重挫敗、至今沒有改善——對方感受到的是矛盾，而不是成長。', { size: 22, sp: { before: 0, after: 80 } }),
    p('正確的做法是：在準備前，先決定你這次求職的「敘事主軸」——你是誰、你的核心能力是什麼、你走到這裡的原因是什麼。之後的每一道題，都是在用不同的切入角度，強化同一個論點。', { size: 22, sp: { before: 0, after: 120 } }),
    secTitle('建議的準備順序'),
    callout([
      p('① 先寫 P1（你是誰）→ ② 確定 Pull 的轉職敘事 → ③ 選出 3–5 個核心 STAR 故事 → ④ 把故事套入所有框架，確認語氣一致', { size: 22, sp: { before: 0, after: 60 } }),
      p('一致性是面試官信任你的基礎。前後矛盾，比答壞一題更致命。', { size: 22, bold: true, sp: { before: 0, after: 0 } }),
    ], BG_ORANGE, ORANGE, 16),
    gap(120),
    secTitle('實作工具：三步驟建立你的敘事主軸'),
    p('第一步：找出你的「核心關鍵詞」（只能選一個）', { runs: [r('第一步：找出你的「核心關鍵詞」（只能選一個）', { size: 22, bold: true, color: NAVY })], sp: { before: 0, after: 60 } }),
    p('這個詞是你整個求職敘事的重心。它不是職稱，不是形容詞，而是一個能力本質。問自己：「我做過最有成就感的事情，背後共同的能力是什麼？」', { size: 22, sp: { before: 0, after: 60 } }),
    p('範例：「從混亂中建立秩序」、「讓複雜的東西被不同背景的人理解」、「在資源受限的環境下讓事情動起來」', { size: 21, color: '555555', italic: true, sp: { before: 0, after: 120 } }),
    p('第二步：用關鍵詞做一致性檢查', { runs: [r('第二步：用關鍵詞做一致性檢查', { size: 22, bold: true, color: NAVY })], sp: { before: 0, after: 60 } }),
    p('把你的核心關鍵詞代入以下六個最關鍵的框架，確認每一個答案都在強化同一個論點，而不是彼此矛盾：自我介紹（能力定位）、優點（核心能力）、缺點（誠實與自覺）、轉職動機（你為何而來）、最大挑戰（你的判斷邏輯）、為什麼錄取你（差異化理由）。', { size: 22, sp: { before: 0, after: 120 } }),
    p('第三步：找出「矛盾點」並修正', { runs: [r('第三步：找出「矛盾點」並修正', { size: 22, bold: true, color: NAVY })], sp: { before: 0, after: 60 } }),
    p('修改不是要你改變事實，而是調整「切入角度」——同一個故事，可以從不同面向說，只要確保每一個面向都在強化同一個核心關鍵詞。目標：面試官在你走後，把所有你說的話拼在一起，看到的是同一個清晰的人，而不是六個不同版本的你。', { size: 22, sp: { before: 0, after: 120 } }),
    secTitle('準備優先順序：從哪裡開始，效益最高'),
    buildPriorityTable(),
  ];
}

function buildPriorityTable() {
  const rows = [
    ['P1', '一｜自我介紹（3P）', '★★★★★', '極高', '第一印象定錨，答壞影響全局；P3（動機連結）最常被忽略'],
    ['P1', '三｜缺點（RIG）', '★★★★★', '極高', '假缺點（完美主義）是最常見雷區；致命缺點選錯直接出局'],
    ['P1', '六｜最大挑戰（STAR）', '★★★★★', '高', 'Action 部分最關鍵；多數人只列清單，沒說判斷邏輯'],
    ['P1', '十｜薪資談判', '★★★★★', '高（實質影響收入）', '大多數人完全不準備；第一個數字影響整個談判走向'],
    ['P2', '四｜轉職動機（Pull）', '★★★★☆', '高', '轉職者必答；「被推出去」語氣是最常見失分點'],
    ['P2', '九｜離職原因', '★★★★☆', '高', '批評前雇主是最快讓對方失去興趣的答法'],
    ['P2', '十二｜為何錄取你（3M）', '★★★★☆', '中', '收尾題，常被視為重播自介；M2（差異化）最難說清楚'],
    ['P3', '二｜優點（SCA）', '★★★★☆', '中', '說形容詞而非能力是最常見錯誤；Achievement 常被省略'],
    ['P3', '五、七、八、十一｜其餘框架', '★★★☆☆', '低至中', '邏輯相對直接；先把 P1 框架掌握後再補強'],
  ];
  const ws = [600, 2800, 1200, 1200, W - 600 - 2800 - 1200 - 1200];
  const priorityColors = { 'P1': 'D63B2A', 'P2': 'E07020', 'P3': '1E7A40' };
  const priorityBg = { 'P1': 'FEF0EF', 'P2': 'FEF5EC', 'P3': 'F0FAF0' };
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: ws,
    rows: [
      new TableRow({ tableHeader: true, children: ['優先', '框架', '出現頻率', '失分風險', '難點提示'].map((h, i) =>
        new TableCell({ width: { size: ws[i], type: WidthType.DXA }, shading: { fill: NAVY, type: ShadingType.CLEAR },
          borders: { top: NB, bottom: NB, left: NB, right: tb(WHITE) }, margins: { top: 80, bottom: 80, left: 100, right: 80 },
          children: [p('', { runs: [r(h, { size: 20, bold: true, color: WHITE })], sp: { before: 0, after: 0 }, align: AlignmentType.CENTER })] })
      )}),
      ...rows.map(([pri, fw, freq, risk, tip], i) => new TableRow({ children: [
        new TableCell({ width: { size: ws[0], type: WidthType.DXA }, shading: { fill: priorityBg[pri], type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: NB, right: tb() }, margins: { top: 80, bottom: 80, left: 80, right: 60 }, children: [p('', { runs: [r(pri, { size: 20, bold: true, color: priorityColors[pri] })], sp: { before: 0, after: 0 }, align: AlignmentType.CENTER })] }),
        new TableCell({ width: { size: ws[1], type: WidthType.DXA }, shading: { fill: priorityBg[pri], type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: NB, right: tb() }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, children: [p(fw, { sp: { before: 0, after: 0 }, size: 20 })] }),
        new TableCell({ width: { size: ws[2], type: WidthType.DXA }, shading: { fill: priorityBg[pri], type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: NB, right: tb() }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [p(freq, { sp: { before: 0, after: 0 }, size: 18, align: AlignmentType.CENTER })] }),
        new TableCell({ width: { size: ws[3], type: WidthType.DXA }, shading: { fill: priorityBg[pri], type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: NB, right: tb() }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [p(risk, { sp: { before: 0, after: 0 }, size: 20 })] }),
        new TableCell({ width: { size: ws[4], type: WidthType.DXA }, shading: { fill: priorityBg[pri], type: ShadingType.CLEAR }, borders: { top: tb(), bottom: tb(), left: NB, right: NB }, margins: { top: 80, bottom: 80, left: 120, right: 80 }, children: [p(tip, { sp: { before: 0, after: 0 }, size: 20 })] }),
      ]}))
    ]
  });
}

// ────────────────────────────────────────────────────────────────────
// FRAMEWORK 1：自我介紹
// ────────────────────────────────────────────────────────────────────
function buildF1() {
  return [
    pgBreak(),
    chapterHeader('P1 必練', '一', '你的前 90 秒，已經決定了今天的結果', '自我介紹', '3P：Profile-Proof-Purpose'),
    gap(120),
    secTitle('為什麼很多人答壞'),
    p('我做模擬面試的時候，有一個計時器——如果應試者在 20 秒內沒有讓我知道「他是誰、他能做什麼」，我就會在記錄表上寫下「定位不清」。這個評語出現，後面說什麼都很難救回來。大多數人的自我介紹，是「我的人生回顧」——從哪裡畢業、做過幾份工作、興趣是什麼。但面試官問自我介紹，真正想聽的是：', { size: 22, sp: { before: 0, after: 80 } }),
    callout([p('「你是誰，你能為我解決什麼問題，你為什麼在這裡？」', { size: 23, bold: true, color: NAVY, align: AlignmentType.CENTER, sp: { before: 0, after: 0 } })], BG_GRAY, LGRAY, 8),
    gap(80),
    p('你的自我介紹，應該是一個「為什麼你是最適合這個職位的人」的簡短論點。', { size: 22, sp: { before: 0, after: 120 } }),
    rvBox('在自我介紹結束的當下，面試官通常已經在評分表上給了第一個分數。他評的不是你的資歷，而是「這個人知不知道自己要來做什麼」。P3（動機連結）說不清楚的應徵者，無論 P1 說得多好，最後印象都是模糊的。'),
    gap(120),
    secTitle('高分框架：3P 結構'),
    fwBox([
      { label: 'P1\nProfile', text: '我是什麼人', sub: '用 1–2 句說你的身份定位，不是工作歷史的列表。「我是一個在 ___(領域) 深耕 ___ 年的 ___(能力核心)，主要聚焦在 ___(你最擅長解決的問題)。」' },
      { label: 'P2\nProof', text: '我有什麼證明', sub: '用 1–2 個具體成果佐證你的 P1。數字最有說服力。「在前一份工作，我 ___，結果是 ___。」' },
      { label: 'P3\nPurpose', text: '我為什麼在這裡', sub: '說明你為什麼對這個職位、這個公司感興趣，並把它連結回你的 P1。「我來這裡，是因為 ___，我相信我的 ___ 能幫助你們 ___。」' },
    ]),
    gap(60),
    callout([p('⏱  控制在 90 秒以內（若面試官指定時間，依指定時間調整；若無說明，90 秒是安全目標）。', { size: 21, sp: { before: 0, after: 0 } })], BG_YELLOW, ORANGE, 12),
    gap(120),
    secTitle('範例解析'),
    p('背景：後勤主任，轉職科技業供應鏈', { size: 20, color: '555555', italic: true, sp: { before: 0, after: 80 } }),
    exBlock([
      { tag: 'P1', text: '我在後勤與供應鏈領域有 15 年的實戰經驗，核心能力是帶領跨功能團隊、在高壓環境下做資源調度決策。' },
      { tag: 'P2', text: '在前一份工作，我管理的年度物料採購規模超過 NT$500 萬，帶領 30 人團隊，連續 5 年達成 100% 的準時交付率。' },
      { tag: 'P3', text: '我來這裡，是因為貴公司在供應鏈架構上的方向讓我很感興趣，我相信我在高壓下的資源調度與跨部門協調能力，能在這個職位上直接發揮作用。' },
    ]),
    gap(80),
    callout([
      p('解析說明：', { runs: [r('解析說明：', { size: 21, bold: true })], sp: { before: 0, after: 50 } }),
      p('・P1 不說職位名稱，說能力核心', { size: 21, sp: { before: 0, after: 30 } }),
      p('・P2 用數字，讓能力有重量（請填入你自己的真實數字）', { size: 21, sp: { before: 0, after: 30 } }),
      p('・P3 表達動機，同時連結回能力——不是「我想來這裡」，而是「我能幫你什麼」', { size: 21, sp: { before: 0, after: 0 } }),
    ], BG_GRAY, NAVY, 12),
    gap(120),
    secTitle('常見錯誤'),
    cmpTable([
      ['從出生地、學校說起', '從你最強的能力核心說起'],
      ['列工作清單', '說能力定位，不是工作歷史'],
      ['結尾說「以上就是我的自我介紹」', '結尾連結到「我為什麼適合這個職位」'],
      ['超過 3 分鐘', '控制在 90 秒，讓對方有問問題的空間'],
    ]),
    gap(120),
    secTitle('最常見的追問'),
    ...followup([
      ['Q：「可以再多說說你在 ___ 這份工作的主要職責嗎？」', '這通常是面試官在聽完你的自我介紹後，對某個點感興趣想深挖。這是好事，不是刁難。用 STAR 的邏輯回答，說情境 + 你的角色 + 一個可量化的成果。不要重新背整個工作說明書，挑最能展示你核心能力的那一個面向說。'],
      ['Q：「你說你擅長 ___，能不能給我一個具體的例子？」', 'P2 就是為了回答這個追問而存在的。直接說你在自我介紹裡準備的那個 P2 故事的完整版。如果你的 P2 只有一句話，對方必然追問；如果你的 P2 有情境 + 數字 + 成果，你就可以說：「當然，我稍早提到的那個例子，完整的背景是這樣……」'],
    ]),
  ];
}

// ────────────────────────────────────────────────────────────────────
// FRAMEWORK 2：優點
// ────────────────────────────────────────────────────────────────────
function buildF2() {
  return [
    pgBreak(),
    chapterHeader('P3 強化', '二', '為什麼說「認真負責」等於什麼都沒說', '你的優點是什麼', 'SCA：Skill-Context-Achievement'),
    gap(120),
    secTitle('為什麼很多人答壞'),
    p('我問過幾百個面試者「你的優點是什麼」，九成的人說出口的第一個詞是「認真」或「有責任感」。你知道面試官聽到第一百次這個詞時，他的表情是什麼嗎——他連筆都沒動。這些詞不是優點，是求職焦慮的產物。真正讓面試官記住的，是說「我自己建了一套流程，讓客訴回應時間從 72 小時縮到 6 小時」的那個人。形容詞不佔記憶體，數字和情境才佔。', { size: 22, sp: { before: 0, after: 80 } }),
    callout([p('面試官真正想聽的優點：「一個你有具體證明的、跟這個職位相關的底層能力。」', { size: 22, bold: true, color: NAVY, sp: { before: 0, after: 0 } })], BG_GRAY, LGRAY, 8),
    gap(120),
    secTitle('高分框架：SCA 結構'),
    fwBox([
      { label: 'S\nSkill', text: '說出能力', sub: '不要說形容詞，說一個具體能力。「我最核心的優點是 ___(能力名稱)。」' },
      { label: 'C\nContext', text: '說出情境', sub: '給一個你使用這個能力的具體情境。「舉個例子，在 ___ 的情況下，我 ___。」' },
      { label: 'A\nAchievement', text: '說出結果', sub: '說這個能力帶來了什麼具體成果。「最後的結果是 ___。」' },
    ]),
    gap(120),
    secTitle('範例解析'),
    p('背景：轉職 PM，優點是系統性思維', { size: 20, color: '555555', italic: true, sp: { before: 0, after: 80 } }),
    callout([
      p('我最核心的優點是「在複雜、多方利害關係人的情境下，把問題拆解清楚並帶著團隊推進」的能力。', { size: 22, sp: { before: 0, after: 80 } }),
      p('舉個例子，之前有一個跨校研究合作專案，我們有 3 個機構、5 位研究員，時間軸不一致，進度一度卡死。我重新畫了整個任務拆解圖，定義了每個人的交付責任與節點，兩週內讓專案恢復正常進度，最後如期交付。', { size: 22, sp: { before: 0, after: 80 } }),
      p('這個「看見整體、拆解問題、讓人動起來」的能力，我認為對 PM 職位最直接相關。', { size: 22, sp: { before: 0, after: 0 } }),
    ], BG_BLUE, BLUE, 12),
    gap(120),
    secTitle('常見錯誤'),
    cmpTable([
      ['說形容詞（認真、有責任感）', '說一個具體、可驗證的能力'],
      ['說太多個優點', '只說一個，說深、說清楚'],
      ['只說能力，沒有例子', '一定要附具體情境和成果'],
    ]),
  ];
}

// ────────────────────────────────────────────────────────────────────
// FRAMEWORK 3：缺點
// ────────────────────────────────────────────────────────────────────
function buildF3() {
  return [
    pgBreak(),
    chapterHeader('P1 必練', '三', '面試官聽到「完美主義」的瞬間，已決定不錄取你', '你的缺點是什麼', 'RIG：Real-Impact-Growth'),
    gap(120),
    secTitle('為什麼很多人答壞'),
    p('有一次我面試一位應徵主管職的候選人。他說他的缺點是「太關心部屬的情緒，有時候會忘了自己的工作」。我當場在評分表上寫了四個字：自我覺察低。他後來沒過。那道題，他自己以為答得很好。這題有兩種常見的爛答案：', { size: 22, sp: { before: 0, after: 80 } }),
    p('・假缺點：「我太完美主義了。」「我工作太認真，常常忘了休息。」', { size: 21, sp: { before: 0, after: 40 } }),
    p('・致命缺點：直接說一個會讓你出局的缺點', { size: 21, sp: { before: 0, after: 80 } }),
    callout([p('誠實 + 有在改善 = 高分。面試官評估的是你的自覺與成熟度，不是你有沒有缺點。', { size: 22, bold: true, color: NAVY, sp: { before: 0, after: 0 } })], BG_GRAY, LGRAY, 8),
    gap(80),
    rvBox('有經驗的面試官聽缺點題，根本不是在聽「缺點是什麼」——他在看你「有沒有能力對自己誠實、對問題有所覺察」。說假缺點，他記下的評語通常是：「Self-awareness 不足」。這個評語出現，你幾乎不可能過關。'),
    gap(120),
    secTitle('更難的問題：我要說哪一個缺點？'),
    p('知道「什麼不能說」還不夠。真正的困難是：從哪裡找到那個可以說的缺點？', { size: 22, sp: { before: 0, after: 80 } }),
    callout([
      p('', { runs: [r('第一步：挖掘素材（問一到問三）', { size: 21, bold: true, color: NAVY })], sp: { before: 0, after: 60 } }),
      p('問一：我的主管或同事曾給過我什麼建設性回饋？他人給過你的意見是最真實的素材。', { size: 21, sp: { before: 0, after: 40 } }),
      p('問二：我在什麼情境下需要比別人更多時間才能完成？行為線索，不是性格標籤。', { size: 21, sp: { before: 0, after: 40 } }),
      p('問三：做哪件事時，曾讓同事輕微不耐煩或難以配合？人際摩擦是真實缺點的訊號。', { size: 21, sp: { before: 0, after: 80 } }),
      p('', { runs: [r('第二步：篩選（兩個標準都要通過）', { size: 21, bold: true, color: NAVY })], sp: { before: 0, after: 60 } }),
      p('篩選標準一：不能是 JD 核心技能（應徵業務職，不能說「我怕開口找陌生人」）', { size: 21, sp: { before: 0, after: 40 } }),
      p('篩選標準二：不能觸及人格信任（「情緒管理不好」「有拖延症」一律排除）', { size: 21, sp: { before: 0, after: 0 } }),
    ], BG_GRAY, NAVY, 12),
    gap(120),
    secTitle('高分框架：RIG 結構'),
    fwBox([
      { label: 'R\nReal', text: '說真實的缺點', sub: '說一個真實的、但不致命的缺點。「我一個真實的缺點是 ___。」' },
      { label: 'I\nImpact', text: '說影響', sub: '說這個缺點在哪種情境下曾造成問題。「在 ___ 的情況下，這個缺點讓我 ___。」' },
      { label: 'G\nGrowth', text: '說改善行動', sub: '說你現在怎麼應對這個缺點。「我後來做了 ___，現在的狀況是 ___。」' },
    ]),
    gap(120),
    secTitle('範例解析'),
    callout([
      p('我有一個真實的缺點：在面對模糊、沒有明確規則的情境時，我一開始會想把所有可能性都考慮清楚才行動，導致有時候啟動偏慢。', { size: 22, sp: { before: 0, after: 80 } }),
      p('這在有些需要快速決策的環境裡，確實讓我在剛開始的 1–2 週表現不夠即時。', { size: 22, sp: { before: 0, after: 80 } }),
      p('我後來的應對方式是：在每個任務開始時，先設定一個「夠好就行動」的門檻，而不是「完美才行動」的門檻。這讓我的決策速度快了不少，同時也學會了在行動中修正，而不是行動前先求完美。', { size: 22, sp: { before: 0, after: 0 } }),
    ], BG_BLUE, BLUE, 12),
    gap(120),
    secTitle('常見錯誤'),
    cmpTable([
      ['說假缺點（太完美主義）', '說一個真實但不致命的缺點'],
      ['說致命缺點（不會帶人卻應徵主管）', '選與職位核心能力無關、與人格信任無關的缺點'],
      ['只說缺點，沒說改善', '一定要說你現在怎麼處理它，且是具體的行為改變'],
    ]),
    gap(120),
    secTitle('最常見的追問'),
    ...followup([
      ['Q：「那你有沒有一個例子，是這個缺點真的讓工作出了問題？」', '這是最常見的追問，也是你必須準備的。你說的 RIG 範例已經包含 Impact，直接說出來即可。不要閃躲，直接面對說細節，反而讓對方覺得你誠實。'],
      ['Q：「你覺得你現在改善了多少？還有沒有這個問題？」', '不要說「已經完全改了」。說「我現在處理方式改變了，效果有明顯提升——但我不會說完全沒有，在特別模糊的情境還是需要多一點時間。」誠實的成長曲線，比完美答案更有說服力。'],
      ['Q：「你的主管怎麼看你這個缺點？」', '這題在試探你說的是否是真實的缺點。準備好說：「他給過我類似的回饋，說我在 ___ 情況下確實偏慢，我後來做了 ___ 調整。」這讓你的缺點有外部佐證，不是自說自話。'],
    ]),
  ];
}

// ────────────────────────────────────────────────────────────────────
// FRAMEWORK 4：轉職動機
// ────────────────────────────────────────────────────────────────────
function buildF4() {
  return [
    pgBreak(),
    chapterHeader('P2 次優先', '四', '你的轉職故事，面試官是在聽「逃」還是「選」', '為什麼想轉換跑道', 'Pull，不是 Push'),
    gap(120),
    secTitle('為什麼很多人答壞'),
    p('我聽過一個轉職者，準備了三週的「為什麼轉職」。他背了一段完整的腳本，說自己在前一份工作學到了很多，但覺得「是時候尋求新的挑戰了」。面試官問他：「什麼樣的挑戰？」他愣了三秒，說「各種挑戰」。那三秒，他丟了這份工作。', { size: 22, sp: { before: 0, after: 80 } }),
    callout([p('面試官真正在問的是：「你的轉職是衝動，還是有想清楚？你對新產業是真的感興趣，還是逃離舊的？」', { size: 22, bold: true, color: NAVY, sp: { before: 0, after: 0 } })], BG_GRAY, LGRAY, 8),
    gap(120),
    secTitle('高分框架：Pull，不是 Push'),
    callout([
      p('說你被新的方向「拉過來」，不是被舊環境「推出去」。', { size: 22, bold: true, sp: { before: 0, after: 80 } }),
      p('1. 在前一段職涯，我累積了 ___(能力)，這讓我意識到我對 ___ 有強烈的興趣。', { size: 21, sp: { before: 0, after: 40 } }),
      p('2. 我發現 ___ 這個領域，正好需要 ___(你的底層能力)，而這正是我在前一段職涯裡反覆使用、也最擅長的。', { size: 21, sp: { before: 0, after: 40 } }),
      p('3. 所以這次的轉職，對我來說不是逃離，而是把我累積的能力，帶到一個能更大發揮的地方。', { size: 21, sp: { before: 0, after: 0 } }),
    ], BG_BLUE, BLUE, 20),
    gap(120),
    secTitle('範例解析'),
    p('背景：後勤管理轉供應鏈', { size: 20, color: '555555', italic: true, sp: { before: 0, after: 80 } }),
    callout([
      p('在過去 15 年的後勤管理工作裡，我一直在做的事情其實是：在資源有限的情況下，確保複雜的系統順暢運作。這讓我意識到，我最擅長、也最感興趣的，是「供應鏈與資源調度」這個領域的底層問題。', { size: 22, sp: { before: 0, after: 80 } }),
      p('我後來研究了科技製造業的供應鏈職位，發現兩個領域在本質上高度重疊——都是跨部門協調、都是資源調度、都是在時間壓力下做決策。差別只是在於規模、工具和語言。', { size: 22, sp: { before: 0, after: 80 } }),
      p('所以這次轉職，對我來說是把 15 年的底層能力，帶到一個能更系統化、更大規模發揮的環境。', { size: 22, sp: { before: 0, after: 0 } }),
    ], BG_BLUE, BLUE, 12),
    gap(120),
    secTitle('常見錯誤'),
    cmpTable([
      ['說前公司不好（薪水太低、主管不好）', '只說正向動機，永遠不批評前雇主'],
      ['說「想嘗試新東西」', '說具體的、你被什麼「拉過來」'],
      ['無法說明能力連結', '一定要說舊能力如何在新職位發揮'],
    ]),
    gap(120),
    secTitle('最常見的追問'),
    ...followup([
      ['Q：「你說你對這個領域感興趣，但你之前完全沒有相關經驗，為什麼我們要相信這不只是說說而已？」', '這是最危險的追問，只有一個應對方式：用行動而不是語言來回答。「我理解這個疑慮。我對這個領域的興趣，不只停在說說，我做了 ___（具體行動：旁聽課程、做了 side project、去參加了行業活動、和三個在這個領域工作的人深度訪談）。」光說「我真的有興趣」，對方不會相信；說出你做了什麼，才有說服力。'],
      ['Q：「如果轉職後你發現這個領域和你想像的不一樣，你會怎麼辦？」', '這在考你的風險意識和成熟度。不要說「我不會」。說：「我在決定轉職之前，有做了 ___ 來減少這個風險。當然沒有辦法保證一切都如預期，但我願意用第一年的時間認真嘗試，邊做邊調整，而不是等到「完全確定」才行動。」'],
    ]),
  ];
}

// ────────────────────────────────────────────────────────────────────
// FRAMEWORK 5：為什麼想來我們公司
// ────────────────────────────────────────────────────────────────────
function buildF5() {
  return [
    pgBreak(),
    chapterHeader('P3 強化', '五', '如何讓面試官知道你不是廣投的那一個', '為什麼想來我們公司', '研究 + 連結'),
    gap(120),
    secTitle('為什麼很多人答壞'),
    p('每次問應試者「為什麼想來我們公司」，我在心裡都有一個評分標準：如果他說的任何一句話，換到另一家同性質公司也能成立——那就是零分。你知道有多少人說的是「你們是業界領導品牌」或「福利很好」？幾乎每個人。常見的爛答案：', { size: 22, sp: { before: 0, after: 80 } }),
    p('・「貴公司規模很大，福利很好。」', { size: 21, sp: { before: 0, after: 40 } }),
    p('・「我很欣賞貴公司的文化。」（沒有說清楚是什麼文化）', { size: 21, sp: { before: 0, after: 40 } }),
    p('・「貴公司是業界領導品牌。」（每個公司都可以這樣說）', { size: 21, sp: { before: 0, after: 80 } }),
    p('這些答案顯示你沒有做功課，或你只是廣投，這家只是其中一家。', { size: 22, sp: { before: 0, after: 120 } }),
    secTitle('高分框架：研究 + 連結'),
    callout([
      p('1. 說一個你真的研究過的具體事實（公司的產品特色、近期動態、技術方向、市場定位）', { size: 21, sp: { before: 0, after: 40 } }),
      p('2. 說這個事實讓你感興趣的理由（連結你自己的過去經驗或興趣）', { size: 21, sp: { before: 0, after: 40 } }),
      p('3. 說你覺得你能在這裡貢獻什麼', { size: 21, sp: { before: 0, after: 80 } }),
      p('公式：「我注意到貴公司 ___(具體事實)，這對我來說很有共鳴，因為我在 ___ 的經驗裡 ___，我認為我能在這裡 ___。」', { size: 22, bold: true, color: NAVY, sp: { before: 0, after: 0 } }),
    ], BG_BLUE, BLUE, 20),
    gap(120),
    secTitle('範例解析'),
    p('背景：應徵 B2B SaaS 公司的 PM 職位', { size: 20, color: '555555', italic: true, sp: { before: 0, after: 80 } }),
    callout([
      p('我在研究貴公司的過程中，注意到你們去年開始把產品從單一功能模組轉向整合型平台，這個方向顯示你們正在解決的是「讓不同部門資訊孤島打通」的問題。', { size: 22, sp: { before: 0, after: 80 } }),
      p('這對我來說很有共鳴——我在研究室的工作中，也一直在處理「如何讓複雜的資訊，被不同背景的人理解和使用」這個問題。我認為這和貴公司目前需要的 PM 能力高度重疊。', { size: 22, sp: { before: 0, after: 80 } }),
      p('我希望能把我在跨域溝通與需求轉化上的能力，帶進你們的產品開發流程。', { size: 22, sp: { before: 0, after: 0 } }),
    ], BG_BLUE, BLUE, 12),
    gap(120),
    secTitle('常見錯誤'),
    cmpTable([
      ['說「貴公司規模大、福利好、業界領導」', '說一個你研究過的具體事實，不是通用讚美'],
      ['說「我喜歡貴公司的文化」', '說清楚是什麼文化的哪個面向，以及為什麼和你的風格吻合'],
      ['只說你感興趣，沒說你能貢獻什麼', '回答必須包含「我能為你做什麼」，不只是「我想來」'],
      ['拿一個答案投所有公司', '每家公司的研究 + 連結部分都應客製化'],
    ]),
  ];
}

// ────────────────────────────────────────────────────────────────────
// FRAMEWORK 6：最大挑戰
// ────────────────────────────────────────────────────────────────────
function buildF6() {
  return [
    pgBreak(),
    chapterHeader('P1 必練', '六', '面試官不在乎你做了什麼，他只想知道你當時怎麼想', '說一個你遇過最大的挑戰', 'STAR：進階版'),
    gap(120),
    secTitle('為什麼很多人答壞'),
    p('問這題的時候，我會特別注意應試者說到 A（行動）的時候，動詞是什麼。如果是「我立刻聯絡了相關部門」「我馬上召開會議」——這些動詞是中性的，告訴我他做了什麼，但沒告訴我他怎麼決定要這樣做。真正讓我記住的回答，是那些在 A 的部分停下來說：「我當時面臨兩個選項——第一個是 ___，第二個是 ___——我選了第二個，因為 ___。」判斷邏輯，才是這道題的核心。', { size: 22, sp: { before: 0, after: 80 } }),
    p('這題考的是你在壓力情境下的判斷力和學習能力，不是你有多能幹。常見的兩種錯誤：', { size: 22, sp: { before: 0, after: 60 } }),
    p('・說假挑戰：說一個輕鬆化解、毫無代價的事件', { size: 21, sp: { before: 0, after: 40 } }),
    p('・只說行動，不說思考：列了一堆「我做了 A、B、C」，但沒說你在那個情境下怎麼判斷、怎麼取捨——而這才是面試官真正想看的', { size: 21, sp: { before: 0, after: 80 } }),
    rvBox('多數人在 A（行動）的部分說的是「我做了什麼」，但面試官真正在計分的是「他怎麼判斷、他在那個時間點的取捨邏輯是什麼」。行動清單得不了高分，判斷邏輯才是分水嶺。'),
    gap(120),
    secTitle('高分框架：STAR 結構（進階版）'),
    fwBox([
      { label: 'S\nSituation', text: '情境', sub: '簡短說明背景，不要超過 2 句。' },
      { label: 'T\nTask', text: '你的任務', sub: '說清楚你的角色和你要達成什麼。' },
      { label: 'A\nAction ★', text: '你的具體行動（重點）', sub: '說你「怎麼想」和「怎麼做」，不只是說你做了什麼。這裡要說明你的判斷邏輯，不只是行動清單。' },
      { label: 'R\nResult', text: '結果 + 學習', sub: '說出具體成果，以及你從這個經歷學到了什麼。後半段「學到什麼」非常關鍵——它顯示你能從經驗中提煉出可遷移的洞察。' },
    ]),
    gap(120),
    secTitle('範例解析'),
    exBlock([
      { tag: 'S', text: '有一次，在年度最大的物資補給任務前 72 小時，主要供應商突然通知無法如期交貨，而我們沒有備援方案。' },
      { tag: 'T', text: '我的任務是在 48 小時內找到替代方案，確保任務不受影響，同時不能超過原本的預算上限。' },
      { tag: 'A', text: '我做了三件事：第一，立刻盤點手上所有可用的庫存，計算出缺口是哪幾項。第二，同步聯絡了 4 家備用供應商進行價格談判，強調緊急性和未來長期合作的可能。第三，向上報告情況，同時提出備案 A、B 選項，讓主管直接決策，省去來回確認的時間。' },
      { tag: 'R', text: '最終在 36 小時內敲定替代供應商，在預算內完成補給，任務如期執行，零缺失。我從這個事件學到的是：應變能力不是靠「快」，而是靠「先把問題結構化再快速行動」。' },
    ]),
    gap(120),
    secTitle('常見錯誤'),
    cmpTable([
      ['說一個毫無代價就解決的「假挑戰」', '說一個真實有壓力、有不確定性、有取捨的事件'],
      ['只列行動，不說判斷過程', 'A 的部分要說「我當時怎麼想、為什麼這樣做」'],
      ['結尾沒有學習', 'R 一定要說你從這件事學到的可遷移洞察'],
      ['事件太老（超過 5 年）或太小', '選近 3–5 年內、工作相關、能體現判斷力的事件'],
    ]),
    gap(120),
    secTitle('最常見的追問'),
    ...followup([
      ['Q：「如果重來，你會做什麼不一樣？」', '這是對你學習能力的深挖。不要說「我會做一樣的事」，也不要全盤否定當時的決定。說：「當時的判斷在資訊有限的情況下是合理的，但現在我會提前做 ___ 這一步——它能讓我更早發現問題。」'],
      ['Q：「你說這個挑戰讓你學到 ___，這之後有沒有機會應用到？」', 'R 的「學習」必須是真的可遷移的洞察，不是泛論。準備一個具體的「後來我把這個學到的用在了 ___ 情境」，讓 R 變成一個可查證的習慣改變，而不是說說而已的感悟。'],
    ]),
    gap(120),
    ctaBox(
      '🎯 Action 說得夠不夠好，只有真人告訴你才知道',
      'STAR 的 A（判斷邏輯）是最難自己評估的部分——你覺得說清楚了，但面試官不一定這樣感覺。模擬面試可以讓你在真正的面試前，先知道這個答案。一次 60 分鐘的模擬，等於你自己練三週的效果。',
      'LINE: @tzlth　｜　模擬面試 NT$1,200 / 60 分鐘'
    ),
  ];
}

module.exports = {
  buildCover, buildIntro, buildNarrativeSpine,
  buildF1, buildF2, buildF3, buildF4, buildF5, buildF6,
  // helpers for part 2
  pgBreak, gap, secTitle, callout, chapterHeader, fwBox, cmpTable, exBlock,
  rvBox, warnBox, ctaBox, followup, p, r,
  W, NAVY, NAVY2, ORANGE, BLUE, RED, GREEN,
  BG_BLUE, BG_ORANGE, BG_YELLOW, BG_GREEN, BG_GRAY, BG_RED, WHITE, LGRAY,
  NB, tb, lb,
};
