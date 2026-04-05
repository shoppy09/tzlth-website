document.addEventListener("DOMContentLoaded", function() {
  // Hamburger menu toggle
  var btn = document.getElementById("hamburgerBtn");
  var nav = document.getElementById("navLinks");
  if (btn && nav) {
    btn.addEventListener("click", function() {
      var isOpen = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", isOpen);
      btn.classList.toggle("active", isOpen);
    });
    // Close menu when a link is clicked
    nav.querySelectorAll("a").forEach(function(link) {
      link.addEventListener("click", function() {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
        btn.classList.remove("active");
      });
    });
  }

  // Scroll reveal + count-up (shared IO support check)
  var reveals = document.querySelectorAll(".reveal");
  var countEls = document.querySelectorAll(".stat-num[data-count]");
  if (!("IntersectionObserver" in window)) {
    reveals.forEach(function(el) { el.classList.add("visible"); });
    countEls.forEach(function(el) { animateCount(el); });
  } else {
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px 50px 0px" });
    reveals.forEach(function(el) { obs.observe(el); });
    if (countEls.length) {
      var countObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      countEls.forEach(function(el) { countObs.observe(el); });
    }
  }

  // Nav active state on scroll
  var sections = document.querySelectorAll("section[id]");
  var navLinks = document.querySelectorAll(".nav-links a[href^='#']");
  function updateActiveNav() {
    var scrollY = window.scrollY + 100;
    sections.forEach(function(section) {
      var top = section.offsetTop;
      var height = section.offsetHeight;
      var id = section.getAttribute("id");
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(function(a) {
          a.classList.toggle("active", a.getAttribute("href") === "#" + id);
        });
      }
    });
  }
  window.addEventListener("scroll", updateActiveNav, { passive: true });
  updateActiveNav();

  // FAQ accordion
  document.querySelectorAll(".faq-question").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var item = btn.closest(".faq-item");
      var isOpen = item.classList.contains("open");
      // Close all
      document.querySelectorAll(".faq-item.open").forEach(function(el) {
        el.classList.remove("open");
        el.querySelector(".faq-question").setAttribute("aria-expanded", "false");
      });
      // Toggle clicked
      if (!isOpen) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  // Back to top
  var topBtn = document.getElementById("backToTop");
  window.addEventListener("scroll", function() {
    topBtn.classList.toggle("visible", window.scrollY > 400);
  }, { passive: true });
  topBtn.addEventListener("click", function() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Count-up animation for hero stats
  function animateCount(el) {
    var target = parseInt(el.dataset.count, 10);
    var suffix = el.dataset.suffix || "";
    var duration = 1200;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(ease * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  // GA click event tracking for CTA buttons
  document.querySelectorAll("a[href*='booking'], a[href*='lin.ee']").forEach(function(a) {
    a.addEventListener("click", function() {
      try {
        if (typeof gtag === "function") {
          var label = a.textContent.trim().substring(0, 40);
          var category = a.href.includes("lin.ee") ? "line" : "booking";
          gtag("event", "cta_click", {
            event_category: category,
            event_label: label,
            value: 1
          });
        }
      } catch (e) {}
    });
  });

  // ── BOOKING SYSTEM WAKE-UP ──
  var BOOKING_URL = "https://my-booking-system.onrender.com/";
  var BOOKING_PING = BOOKING_URL + "favicon.ico";
  var bookingReady = false;
  var overlay = document.getElementById("bookingOverlay");

  // Use Image ping — resolves only on real HTTP 200, unlike no-cors fetch
  function pingBooking(onSuccess) {
    var img = new Image();
    img.onload = function() {
      bookingReady = true;
      if (onSuccess) onSuccess();
    };
    img.onerror = function() {
      // onerror fires for CORS errors too (image loaded but blocked)
      // We treat it as "server responded" since sleep returns no response at all
      bookingReady = true;
      if (onSuccess) onSuccess();
    };
    // Add timestamp to bypass cache
    img.src = BOOKING_PING + "?t=" + Date.now();
    // If no response within 8s, give up this ping cycle
    return setTimeout(function() { img.src = ""; }, 8000);
  }

  // Pre-warm silently on load + retry at 25s
  var warmTimer1 = pingBooking();
  var warmTimer2 = setTimeout(function() { pingBooking(); }, 25000);

  // Intercept booking button clicks
  document.querySelectorAll("a[href*='booking']").forEach(function(a) {
    a.addEventListener("click", function(e) {
      if (bookingReady) return; // already warm, open normally
      e.preventDefault();
      var url = a.href;
      overlay.classList.add("active");

      // Open blank window synchronously (browsers block delayed window.open)
      var win = window.open("about:blank", "_blank", "noopener,noreferrer");

      var startTime = Date.now();
      var maxWait = 55000;
      var pollInterval;

      function navigateAndClose() {
        bookingReady = true;
        clearInterval(pollInterval);
        overlay.classList.remove("active");
        if (win && !win.closed) { win.location.href = url; }
        else { window.location.href = url; } // fallback: same-window if popup blocked
      }

      // Poll every 2.5s using Image ping
      pollInterval = setInterval(function() {
        if (Date.now() - startTime >= maxWait) {
          clearInterval(pollInterval);
          overlay.classList.remove("active");
          if (win && !win.closed) { win.location.href = url; }
          else { window.location.href = url; }
          return;
        }
        var img = new Image();
        img.onload = img.onerror = navigateAndClose;
        img.src = BOOKING_PING + "?t=" + Date.now();
      }, 2500);
    });
  });

  // Close overlay on backdrop click
  overlay.addEventListener("click", function(e) {
    if (e.target === overlay) overlay.classList.remove("active");
  });
});
