(function() {
  // ── Email subscription form ──────────────────────────────────────────────
  var form = document.getElementById('emailSubForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = document.getElementById('emailSubInput').value.trim();
      var note  = document.getElementById('emailSubNote');
      if (!email) return;
      var btn = form.querySelector('button');
      btn.disabled = true;
      btn.textContent = '訂閱中…';

      fetch('https://app.kit.com/forms/9309490/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_address: email })
      })
      .then(function(r) {
        if (r.status >= 200 && r.status < 300) {
          note.textContent = '已訂閱！請查收確認信。';
          note.style.color = '#2D7D46';
          form.style.display = 'none';
        } else {
          throw new Error('failed');
        }
      })
      .catch(function() {
        note.textContent = '訂閱失敗，請稍後再試。';
        note.style.color = '#C4622D';
        btn.disabled = false;
        btn.textContent = '免費訂閱';
      });
    });
  }

  // ── Related articles ─────────────────────────────────────────────────────
  var relatedSection = document.getElementById('relatedArticles');
  var relatedGrid    = document.getElementById('relatedGrid');
  if (!relatedSection || !relatedGrid) return;

  var currentSlug = location.pathname.replace(/.*\//, '').replace('.html', '');

  fetch('/blog/articles.json')
    .then(function(r) { return r.json(); })
    .then(function(articles) {
      var others = articles.filter(function(a) { return a.slug !== currentSlug; });
      // Fisher-Yates shuffle
      for (var i = others.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = others[i]; others[i] = others[j]; others[j] = tmp;
      }
      var picks = others.slice(0, 3);
      picks.forEach(function(a) {
        var d = new Date(a.date);
        var dateStr = isNaN(d) ? (a.date || '') : (d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月');
        var tagsHTML = (a.tags || []).slice(0, 2).map(function(t) {
          return '<span class="related-card-tag">' + escHtml(t) + '</span>';
        }).join('');
        var card = document.createElement('a');
        card.href = '/blog/' + a.slug + '.html';
        card.className = 'related-card';
        card.innerHTML =
          '<p class="related-card-date">' + dateStr + '</p>' +
          '<p class="related-card-title">' + escHtml(a.title) + '</p>' +
          '<div class="related-card-tags">' + tagsHTML + '</div>';
        relatedGrid.appendChild(card);
      });
      relatedSection.style.display = 'block';
    })
    .catch(function() {});

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
})();
