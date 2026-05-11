// api/resume-check.js — Vercel Serverless Function (Node.js, CommonJS)
// 若出現 ERR_REQUIRE_ESM，將 require() 改為 await import() 即可

const { GoogleGenAI } = require('@google/genai');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { resumeText, jobTitle } = req.body || {};
  if (!resumeText || typeof resumeText !== 'string' || resumeText.length > 5000) {
    return res.status(400).json({ error: '履歷文字需在 1–5000 字之間' });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const systemInstruction = '你是資深職涯顧問，只回傳三維度快評的 JSON，不加任何說明文字。';
  const prompt = `${jobTitle ? `目標職位：${jobTitle}\n` : ''}請對以下履歷快評，以 JSON 回傳：
${resumeText}

格式（score 為 1-5 整數）：
{"structure":{"score":<整數>,"comment":"<20字內>"},"language":{"score":<整數>,"comment":"<20字內>"},"position_match":{"score":<整數>,"comment":"<20字內>"},"overall":"<40字內>"}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
        maxOutputTokens: 400,
      }
    });
    return res.status(200).json(JSON.parse(response.text));
  } catch (err) {
    console.error('Gemini error:', err.message);
    return res.status(502).json({ error: 'AI 評估失敗，請稍後再試' });
  }
};
