const {
  Document, Packer, Header, Footer, Paragraph, TextRun, PageNumber,
  AlignmentType, BorderStyle,
} = require('docx');
const fs = require('fs');

const { buildCover, buildIntro, buildNarrativeSpine, buildF1, buildF2, buildF3, buildF4, buildF5, buildF6, r, p } = require('./generate_p1');
const { buildF7, buildF8, buildF9, buildF10, buildF11, buildF12, buildManagement } = require('./generate_p2');
const { buildA1, buildA2, buildA3, buildA4, buildA5, buildA6, buildA7, buildA8, buildClosing } = require('./generate_p3');

const NAVY = '1D3A5C';
const LGRAY = 'CCCCCC';

const footer = new Footer({
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: LGRAY, space: 6 } },
      children: [
        new TextRun({ text: '你說完，面試官才開口　｜　蒲朝棟 Tim・職涯停看聽　｜　', font: 'Arial', size: 18, color: '888888' }),
        new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: '888888' }),
      ],
    }),
  ],
});

const allChildren = [
  ...buildCover(),
  ...buildIntro(),
  ...buildNarrativeSpine(),
  ...buildF1(),
  ...buildF2(),
  ...buildF3(),
  ...buildF4(),
  ...buildF5(),
  ...buildF6(),
  ...buildF7(),
  ...buildF8(),
  ...buildF9(),
  ...buildF10(),
  ...buildF11(),
  ...buildF12(),
  ...buildManagement(),
  ...buildA1(),
  ...buildA2(),
  ...buildA3(),
  ...buildA4(),
  ...buildA5(),
  ...buildA6(),
  ...buildA7(),
  ...buildA8(),
  ...buildClosing(),
];

const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0,
          format: 'bullet',
          text: '•',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 560, hanging: 280 } } },
        }],
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    footers: { default: footer },
    children: allChildren,
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('面試高分回答框架12則_電子書.docx', buffer);
  console.log('✅ 完成：面試高分回答框架12則_電子書.docx');
}).catch((err) => {
  console.error('❌ 錯誤：', err);
});
