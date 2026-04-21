// GA4 Event Tracking for Blog
// GA4 ID: G-TK8D1DX7MJ
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-TK8D1DX7MJ');

// 文章 CTA 點擊（預約 / 電子書）
function trackBlogCta(ctaType, articleSlug) {
  if (typeof gtag === 'undefined') return;
  gtag('event', 'blog_cta_click', {
    cta_type: ctaType,
    article_slug: articleSlug || document.location.pathname,
    page_location: document.location.href
  });
}

// 文章上/下一篇導覽點擊
function trackArticleNav(direction, articleSlug) {
  if (typeof gtag === 'undefined') return;
  gtag('event', 'article_nav_click', {
    nav_direction: direction,
    article_slug: articleSlug || document.location.pathname
  });
}

// Blog 列表頁事件（由 blog-index-ga.js 呼叫，或直接在此觸發）
function trackBlogListCta(ctaType) {
  if (typeof gtag === 'undefined') return;
  gtag('event', 'blog_cta_click', {
    cta_type: ctaType,
    location: 'blog_index'
  });
}

function trackLoadMore(pageNum) {
  if (typeof gtag === 'undefined') return;
  gtag('event', 'blog_load_more', {
    page_number: pageNum
  });
}
