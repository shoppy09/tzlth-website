// tools/resume-quick-check.js
// 外部 JS 檔案（避開 CSP inline script 限制）

document.addEventListener('DOMContentLoaded', () => {
  const textarea   = document.getElementById('resumeText');
  const charCount  = document.getElementById('charCount');
  const checkBtn   = document.getElementById('checkBtn');
  const resultSec  = document.getElementById('resultSection');

  // 字數即時顯示
  textarea.addEventListener('input', () => {
    charCount.textContent = textarea.value.length;
  });

  // 送出評估
  checkBtn.addEventListener('click', async () => {
    const resumeText = textarea.value.trim();
    const jobTitle   = document.getElementById('jobTitle').value.trim();
    if (!resumeText) { alert('請先貼上履歷文字'); return; }

    checkBtn.disabled    = true;
    checkBtn.textContent = '評估中...';
    resultSec.style.display = 'none';

    try {
      const res = await fetch('/api/resume-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobTitle })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      renderResults(data);
      resultSec.style.display = 'block';
      resultSec.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      alert('評估失敗，請稍後再試\n' + e.message);
    } finally {
      checkBtn.disabled    = false;
      checkBtn.textContent = '開始 AI 快評';
    }
  });

  function renderResults(data) {
    const dims = [
      { key: 'structure',      prefix: 'structure',  label: '結構完整度' },
      { key: 'language',       prefix: 'language',   label: '語言精準度' },
      { key: 'position_match', prefix: 'position',   label: '職位匹配度' },
    ];
    dims.forEach(({ key, prefix }) => {
      const item = data[key] || {};
      const score = Math.min(5, Math.max(1, Number(item.score) || 1));
      const pct   = (score / 5) * 100;
      document.getElementById(prefix + 'Bar').style.width    = pct + '%';
      document.getElementById(prefix + 'Score').textContent  = score + ' / 5';
      document.getElementById(prefix + 'Comment').textContent = item.comment || '';
    });
    document.getElementById('overallComment').textContent = data.overall || '';
  }
});
