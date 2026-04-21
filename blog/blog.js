(function() {
  var ARTICLES_PER_PAGE = 12;
  var currentPage = 0;
  var allArticles = [];
  var filteredArticles = [];
  var activeTag = 'all';
  var searchQuery = '';

  // Load articles data
  fetch('./articles.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      allArticles = data;
      buildTagFilters(data);
      filterAndRender();
    })
    .catch(function() {
      document.getElementById('blogEmpty').style.display = 'block';
      document.getElementById('blogEmpty').querySelector('.blog-empty-title').textContent = '文章載入中，請稍後再試';
    });

  function buildTagFilters(articles) {
    var tagCount = {};
    articles.forEach(function(a) {
      (a.tags || []).slice(0, 3).forEach(function(t) {
        tagCount[t] = (tagCount[t] || 0) + 1;
      });
    });
    var topTags = Object.keys(tagCount).sort(function(a,b){ return tagCount[b]-tagCount[a]; }).slice(0, 8);
    var container = document.getElementById('tagFilter');
    topTags.forEach(function(tag) {
      var btn = document.createElement('button');
      btn.className = 'tag-btn';
      btn.dataset.tag = tag;
      btn.textContent = tag;
      btn.addEventListener('click', function() {
        document.querySelectorAll('.tag-btn').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        activeTag = tag;
        currentPage = 0;
        filterAndRender();
      });
      container.appendChild(btn);
    });
  }

  function filterAndRender() {
    filteredArticles = allArticles.filter(function(a) {
      var matchTag = activeTag === 'all' || (a.tags || []).includes(activeTag);
      var matchSearch = !searchQuery || a.title.includes(searchQuery) || (a.excerpt || '').includes(searchQuery);
      return matchTag && matchSearch;
    });
    document.getElementById('blogGrid').innerHTML = '';
    currentPage = 0;
    renderPage();
  }

  function renderPage() {
    var start = currentPage * ARTICLES_PER_PAGE;
    var end = start + ARTICLES_PER_PAGE;
    var pageArticles = filteredArticles.slice(start, end);
    var grid = document.getElementById('blogGrid');
    var empty = document.getElementById('blogEmpty');
    var loadWrap = document.getElementById('loadMoreWrap');

    if (filteredArticles.length === 0) {
      empty.style.display = 'block';
      loadWrap.style.display = 'none';
      return;
    }
    empty.style.display = 'none';

    pageArticles.forEach(function(article) {
      var card = document.createElement('article');
      card.className = 'blog-card';
      var tagsHTML = (article.tags || []).slice(0, 3).map(function(t) {
        return '<span class="blog-card-tag">' + t + '</span>';
      }).join('');
      card.innerHTML = '<div class="blog-card-body">' +
        '<p class="blog-card-date">' + formatDate(article.date) + '</p>' +
        '<h2 class="blog-card-title">' + escapeHtml(article.title) + '</h2>' +
        '<p class="blog-card-excerpt">' + escapeHtml(article.excerpt || '') + '</p>' +
        '<div class="blog-card-tags">' + tagsHTML + '</div>' +
        '<a href="./' + article.slug + '.html" class="blog-card-link">閱讀全文 →</a>' +
        '</div>';
      grid.appendChild(card);
    });

    currentPage++;
    var hasMore = end < filteredArticles.length;
    loadWrap.style.display = hasMore ? 'block' : 'none';
  }

  document.getElementById('loadMoreBtn').addEventListener('click', function() {
    if (typeof trackLoadMore === 'function') trackLoadMore(currentPage + 1);
    renderPage();
  });

  document.getElementById('tagFilter').querySelector('[data-tag="all"]').addEventListener('click', function() {
    document.querySelectorAll('.tag-btn').forEach(function(b){ b.classList.remove('active'); });
    this.classList.add('active');
    activeTag = 'all';
    currentPage = 0;
    filterAndRender();
  });

  var searchInput = document.getElementById('blogSearch');
  var searchTimer;
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function() {
      searchQuery = searchInput.value.trim();
      currentPage = 0;
      filterAndRender();
    }, 300);
  });

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.getFullYear() + ' 年 ' + (d.getMonth()+1) + ' 月 ' + d.getDate() + ' 日';
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
})();
