document.addEventListener("DOMContentLoaded", function() {
  // Announcement bar dismiss
  var announceBar = document.getElementById("announceBar");
  var announceClose = document.getElementById("announceClose");
  if (announceBar && announceClose) {
    if (localStorage.getItem("barDismissed") === "1") {
      announceBar.classList.add("is-hidden");
      document.body.classList.add("bar-dismissed");
    }
    announceClose.addEventListener("click", function() {
      announceBar.classList.add("is-hidden");
      document.body.classList.add("bar-dismissed");
      localStorage.setItem("barDismissed", "1");
    });
  }

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
    // Fallback: after 3s show any remaining hidden reveals (handles non-scrollable preview environments)
    setTimeout(function() {
      reveals.forEach(function(el) {
        if (!el.classList.contains("visible")) { el.classList.add("visible"); }
      });
      countEls.forEach(function(el) { animateCount(el); });
    }, 3000);
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
  var BOOKING_URL = "https://booking.careerssl.com";
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

// ── QUIZ ──
(function() {
  var questions = [
    {
      q: "投出去的履歷，大多數都沒有回音。你覺得最可能的原因是？",
      options: [
        { text: "我的能力其實不夠，跟別人比起來競爭力不足", scores: { L:1, D:1, P:2, N:1 } },
        { text: "履歷的寫法有問題，但我不知道哪裡出了錯", scores: { L:3, D:0, P:0, N:2 } },
        { text: "根本不確定自己在找什麼，方向還沒想清楚", scores: { L:0, D:3, P:1, N:0 } },
        { text: "有一段經歷（空白、被辭退、特殊背景）讓我很難開口說", scores: { L:1, D:0, P:1, N:4 } }
      ]
    },
    {
      q: "面試時，最讓你頭痛的問題是哪一類？",
      options: [
        { text: "「你的優勢是什麼？」——我說得出來，但感覺對方沒被說服", scores: { L:4, D:0, P:0, N:1 } },
        { text: "「你的職涯規劃是什麼？」——我真的不知道，很難回答", scores: { L:0, D:4, P:1, N:0 } },
        { text: "「你為什麼要離開上一份工作？」——我有說不清楚的原因", scores: { L:1, D:0, P:0, N:4 } },
        { text: "面試前就先說服自己不行，根本沒去嘗試", scores: { L:0, D:1, P:4, N:0 } }
      ]
    },
    {
      q: "你目前對「下一步」的感覺，最接近哪一種？",
      options: [
        { text: "清楚知道想去哪，但卡在「如何讓對方看見我」", scores: { L:4, D:0, P:1, N:1 } },
        { text: "還在猶豫要繼續現在的路、還是轉換方向", scores: { L:0, D:4, P:1, N:0 } },
        { text: "知道要動，但每次都拖著、一直沒有行動", scores: { L:0, D:1, P:4, N:0 } },
        { text: "有一段過去讓我覺得自己「先天不良」，很難跟別人競爭", scores: { L:1, D:1, P:1, N:4 } }
      ]
    },
    {
      q: "如果請你用一句話描述你的工作能力，你會怎麼說？",
      options: [
        { text: "我說得出來，但說完對方通常沒什麼反應", scores: { L:4, D:0, P:0, N:1 } },
        { text: "我有能力，但還不確定這些能力適合放在哪個方向", scores: { L:1, D:4, P:0, N:0 } },
        { text: "我說不太出來，不知道自己到底有什麼值得說的", scores: { L:3, D:1, P:2, N:1 } },
        { text: "有一段經歷讓我不知道怎麼開口，怕被扣分", scores: { L:1, D:0, P:1, N:4 } }
      ]
    },
    {
      q: "你上一次「準備好要行動，卻沒行動」，是因為什麼？",
      options: [
        { text: "不知道怎麼讓履歷或自我介紹讓人留下印象", scores: { L:3, D:0, P:1, N:1 } },
        { text: "還在等一個更清楚的方向，不想走錯路", scores: { L:0, D:3, P:2, N:0 } },
        { text: "想動但很難開始，總是有各種理由說服自己再等等", scores: { L:0, D:1, P:4, N:0 } },
        { text: "擔心過去那段經歷會被問到、被否定", scores: { L:0, D:0, P:2, N:4 } }
      ]
    },
    {
      q: "哪一句話，最接近你心裡的聲音？",
      options: [
        { text: "「我做過很多事，但說出來就是沒有說服力。」", scores: { L:5, D:0, P:0, N:0 } },
        { text: "「我不是不想動，是還沒找到讓我有把握的方向。」", scores: { L:0, D:5, P:0, N:0 } },
        { text: "「我知道要做什麼，但每次都卡在開始那一步。」", scores: { L:0, D:0, P:5, N:0 } },
        { text: "「我的背景不是標準路線，不知道怎麼讓人看見我的價值。」", scores: { L:0, D:0, P:0, N:5 } }
      ]
    }
  ];

  var results = {
    L: {
      type: "語言型卡關",
      title: "能力早就在那裡，<br>卡的是<em>說清楚</em>的語言。",
      body: "你不缺能力，缺的是把能力翻譯成對方聽得懂的語言。你在舊產業累積的底層能力是真實的，問題是你還在用自己領域的話說，對方聽不懂——不是你不夠好，是語言沒有對準。這正是職能轉譯矩陣要解決的問題。",
      service: "職場轉型諮詢（90 分鐘・NT$2,000）",
      reason: "90 分鐘深度策略諮詢，用職能轉譯矩陣把你的能力重新說成目標產業的語言，搭配職涯敘事重構建議，諮詢後附完整書面策略報告。"
    },
    D: {
      type: "方向型卡關",
      title: "不是不想動，<br>是還沒找到<em>值得動</em>的方向。",
      body: "你的問題不是執行力，是還沒確認方向值得走。在方向不清楚的狀態下硬逼自己行動，只會更焦慮。你需要的不是更多努力，而是一個框架——幫你看清楚哪條路在你的條件下走得通，再動。",
      service: "職涯諮詢（一對一・60 分鐘・NT$1,500）",
      reason: "以提問為核心的深度對談，幫你把模糊的困境說清楚、看清楚，搭配財務逆推確認方向可行性，諮詢後 24 小時內提供書面摘要。"
    },
    P: {
      type: "心理型卡關",
      title: "技術方法都有了，<br>卡的是<em>那個讓你動不了</em>的東西。",
      body: "你知道要做什麼，但就是沒辦法開始。這不是懶，是有某個心理層面的卡點還沒被命名和解除——可能是完美主義、怕失敗、怕被否定。技術再好，這層沒處理，諮詢結束你還是不會動。",
      service: "職涯諮詢（一對一・60 分鐘・NT$1,500）",
      reason: "以心理障礙前置診斷為核心，先命名卡住你的模式，再給具體可執行的行動方向。不先處理這層，任何方法都落不了地。"
    },
    N: {
      type: "敘事型卡關",
      title: "背景不是標準路線，<br>但這從來不是你的<em>弱點</em>。",
      body: "空白期、被辭退、提早退伍、跨領域——這些在你眼中是包袱的事，都可以被重新說。不是造假，是找到同一件事對雇主有利的角度。你需要的是一套敘事框架，把「說不清楚的過去」變成「有主導感的選擇」。",
      service: "職場轉型諮詢（90 分鐘・NT$2,000）",
      reason: "90 分鐘深度諮詢，用職涯敘事重構法把你背景中的「弱點」重新框架，搭配完整書面策略報告，讓你有據可依地說自己的故事。"
    }
  };

  var scores = { L: 0, D: 0, P: 0, N: 0 };
  var currentQ = 0;

  var introScreen    = document.getElementById("quizIntro");
  var questionsScreen = document.getElementById("quizQuestions");
  var resultScreen   = document.getElementById("quizResult");
  var startBtn       = document.getElementById("quizStart");
  var retakeBtn      = document.getElementById("quizRetake");
  var fillEl         = document.getElementById("quizFill");
  var stepLabel      = document.getElementById("quizStepLabel");
  var questionEl     = document.getElementById("quizQuestion");
  var optionsEl      = document.getElementById("quizOptions");

  if (!startBtn) return;

  function showScreen(screen) {
    [introScreen, questionsScreen, resultScreen].forEach(function(s) { s.classList.add("hidden"); });
    screen.classList.remove("hidden");
  }

  function renderQuestion() {
    var q = questions[currentQ];
    fillEl.style.width = ((currentQ / questions.length) * 100) + "%";
    stepLabel.textContent = "問題 " + (currentQ + 1) + " / " + questions.length;
    questionEl.textContent = q.q;
    optionsEl.innerHTML = "";
    ["A","B","C","D"].forEach(function(letter, i) {
      var opt = q.options[i];
      var btn = document.createElement("button");
      btn.className = "quiz-option";
      btn.innerHTML = '<span class="quiz-option-letter">' + letter + '</span><span>' + opt.text + '</span>';
      btn.addEventListener("click", function() {
        Object.keys(opt.scores).forEach(function(k) { scores[k] += opt.scores[k]; });
        currentQ++;
        if (currentQ < questions.length) { renderQuestion(); } else { showResult(); }
      });
      optionsEl.appendChild(btn);
    });
  }

  function showResult() {
    fillEl.style.width = "100%";
    var winner = Object.keys(scores).reduce(function(a, b) { return scores[a] >= scores[b] ? a : b; });
    var r = results[winner];
    document.getElementById("resultType").textContent = r.type;
    document.getElementById("resultTitle").innerHTML = r.title;
    document.getElementById("resultBody").textContent = r.body;
    document.getElementById("resultService").textContent = r.service;
    document.getElementById("resultReason").textContent = r.reason;
    showScreen(resultScreen);
    resultScreen.scrollIntoView({ behavior: "smooth", block: "start" });

    // Quiz email capture — reset state
    var tagMap = { L: "quiz-語言型卡關", D: "quiz-方向型卡關", P: "quiz-心理型卡關", N: "quiz-敘事型卡關" };
    var currentTag = tagMap[winner] || "quiz-測驗";
    var emailInput  = document.getElementById("quizEmailInput");
    var emailForm   = document.getElementById("quizEmailForm");
    var emailSuccess = document.getElementById("quizEmailSuccess");
    var submitBtn   = document.getElementById("quizEmailSubmit");
    if (emailInput) {
      emailInput.value = "";
      emailForm.classList.remove("hidden");
      emailSuccess.classList.add("hidden");
      submitBtn.disabled = false;
      submitBtn.textContent = "寄給我 →";
    }

    // Submit handler
    if (submitBtn) {
      submitBtn.onclick = function() {
        var email = emailInput.value.trim();
        var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRe.test(email)) { emailInput.focus(); return; }
        submitBtn.disabled = true;
        submitBtn.textContent = "送出中…";
        var fd = new FormData();
        fd.append("email_address", email);
        fd.append("tags[]", currentTag);
        fetch("https://app.kit.com/forms/9309490/subscriptions", {
          method: "POST", body: fd, headers: { "Accept": "application/json" }
        }).then(function() {
          emailForm.classList.add("hidden");
          emailSuccess.classList.remove("hidden");
        }).catch(function() {
          submitBtn.disabled = false;
          submitBtn.textContent = "寄給我 →";
        });
      };
    }
  }

  startBtn.addEventListener("click", function() {
    scores = { L: 0, D: 0, P: 0, N: 0 };
    currentQ = 0;
    showScreen(questionsScreen);
    renderQuestion();
    questionsScreen.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  retakeBtn.addEventListener("click", function() {
    scores = { L: 0, D: 0, P: 0, N: 0 };
    currentQ = 0;
    showScreen(introScreen);
    introScreen.scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
