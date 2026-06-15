/* Homepage-only behavior: FAQ accordion, interactive blend demo, scroll
   reveal, the live version pill (cached), and the gameplay carousel. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function renderIcons() {
    if (window.lucide) lucide.createIcons();
  }

  // ── FAQ: hover to open (floating panel), leave to close, click to lock ────
  document.querySelectorAll(".faq__item").forEach(function (item) {
    var summary = item.querySelector("summary");
    if (!summary) return;

    var content = document.createElement("div");
    content.className = "faq__content";
    while (summary.nextSibling) content.appendChild(summary.nextSibling);
    item.appendChild(content);
    item.open = true;
    item.classList.remove("is-open");

    var locked = false;
    var closeTimer = null;
    function open() {
      clearTimeout(closeTimer);
      if (!locked) item.classList.add("is-open");
    }
    function scheduleClose() {
      if (locked) return;
      clearTimeout(closeTimer);
      closeTimer = setTimeout(function () {
        item.classList.remove("is-open");
      }, 110);
    }
    [item, content].forEach(function (el) {
      el.addEventListener("mouseenter", open);
      el.addEventListener("mouseleave", scheduleClose);
    });
    summary.addEventListener("click", function (e) {
      e.preventDefault();
      clearTimeout(closeTimer);
      locked = !locked;
      item.classList.toggle("is-open", locked);
    });
  });

  // ── Interactive blend demo ────────────────────────────────────────────────
  (function () {
    var btn = document.getElementById("blendBtn");
    if (!btn) return;
    var moneyEl = document.getElementById("statMoney");
    var blendsEl = document.getElementById("statBlends");
    var comboEl = document.getElementById("statCombo");
    var pops = document.getElementById("cupPops");
    var SEED_MONEY = 15000, SEED_BLENDS = 38;
    var money = SEED_MONEY, blends = SEED_BLENDS, combo = 1, comboTimer = null, seeded = false;

    function fmt(n) {
      if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
      if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
      return "$" + Math.round(n);
    }
    function paint() {
      moneyEl.textContent = fmt(money);
      blendsEl.textContent = blends;
      comboEl.textContent = "×" + combo;
    }
    function seed() {
      if (seeded) return;
      seeded = true;
      var start = null, dur = 900;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        moneyEl.textContent = fmt(SEED_MONEY * e);
        blendsEl.textContent = Math.round(SEED_BLENDS * e);
        if (p < 1) requestAnimationFrame(step);
        else paint();
      }
      requestAnimationFrame(step);
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (e.isIntersecting) { seed(); io.disconnect(); }
        });
      }, { threshold: 0.4 });
      io.observe(btn);
    } else { seed(); }

    btn.addEventListener("click", function () {
      blends++;
      var gain = 250 * combo;
      money += gain;
      combo = Math.min(6, combo + 1);
      clearTimeout(comboTimer);
      comboTimer = setTimeout(function () { combo = 1; paint(); }, 1300);
      paint();
      var pop = document.createElement("span");
      pop.className = "pop";
      pop.textContent = "+" + fmt(gain);
      pops.appendChild(pop);
      setTimeout(function () { pop.remove(); }, 700);
      btn.classList.remove("blend");
      void btn.offsetWidth;
      btn.classList.add("blend");
    });
  })();

  // ── Scroll reveal ─────────────────────────────────────────────────────────
  (function () {
    if (reduce || !("IntersectionObserver" in window)) return;
    var els = document.querySelectorAll(".section, .cta");
    els.forEach(function (el) { el.classList.add("reveal"); });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { io.observe(el); });
  })();

  // ── Live latest version pill (cached in localStorage for ~6h) ─────────────
  (function () {
    var pill = document.getElementById("versionPill");
    if (!pill || !window.fetch) return;
    var CACHE_KEY = "smm-ver-cache";
    var TTL = 6 * 60 * 60 * 1000;

    function show(text, href) {
      pill.querySelector(".version-pill__text").textContent = text;
      if (href) pill.href = href;
      pill.hidden = false;
      renderIcons();
    }

    var cached = null;
    try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch (e) {}
    if (cached && cached.text) {
      show(cached.text, cached.href); // instant paint from cache
      if (Date.now() - cached.t < TTL) return; // still fresh — skip the request
    }

    fetch("https://api.github.com/repos/Strider65710/s657-smm-game/releases")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (rel) {
        var games = rel.filter(function (x) {
          var blob = ((x.tag_name || "") + " " + (x.name || "")).toLowerCase();
          return blob.indexOf("launcher") < 0 && !x.draft;
        });
        if (!games.length) return;
        var latest = games[0];
        var ver = latest.tag_name || latest.name || "";
        var date = latest.published_at
          ? new Date(latest.published_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })
          : "";
        var text = "Now playing " + ver + (date ? " · " + date : "");
        var href = latest.html_url || "https://github.com/Strider65710/s657-smm-game/releases";
        show(text, href);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), text: text, href: href })); } catch (e) {}
      })
      .catch(function () { /* offline or rate-limited — leave whatever we have */ });
  })();

  // ── Gameplay carousel: manual (arrows/dots/swipe) + looping autoplay ──────
  (function () {
    var track = document.getElementById("carTrack");
    var dots = document.getElementById("carDots");
    if (!track) return;
    var slides = Array.prototype.slice.call(track.children);
    if (!slides.length) return;
    var n = slides.length;
    var current = 0;

    function goTo(i) {
      current = (i + n) % n;
      track.scrollTo({ left: slides[current].offsetLeft - track.offsetLeft, behavior: "smooth" });
      setActive(current);
    }
    function setActive(i) {
      Array.prototype.forEach.call(dots.children, function (d, idx) {
        d.classList.toggle("is-active", idx === i);
      });
    }
    slides.forEach(function (_, i) {
      var d = document.createElement("button");
      d.type = "button";
      d.setAttribute("aria-label", "Go to screenshot " + (i + 1));
      d.addEventListener("click", function () { goTo(i); resetAuto(); });
      dots.appendChild(d);
    });
    function syncFromScroll() {
      var best = 0, min = Infinity;
      slides.forEach(function (s, idx) {
        var dist = Math.abs(s.offsetLeft - track.offsetLeft - track.scrollLeft);
        if (dist < min) { min = dist; best = idx; }
      });
      current = best;
      setActive(best);
    }
    track.addEventListener("scroll", function () {
      window.requestAnimationFrame(syncFromScroll);
    });

    function atEnd() { return track.scrollLeft + track.clientWidth >= track.scrollWidth - 4; }
    function atStart() { return track.scrollLeft <= 4; }
    function advance() { if (atEnd()) goTo(0); else goTo(current + 1); }
    function retreat() { if (atStart()) goTo(n - 1); else goTo(current - 1); }

    var prev = document.getElementById("carPrev");
    var next = document.getElementById("carNext");
    if (prev) prev.addEventListener("click", function () { retreat(); resetAuto(); });
    if (next) next.addEventListener("click", function () { advance(); resetAuto(); });

    var timer = null;
    function startAuto() { if (reduce || timer) return; timer = setInterval(advance, 5000); }
    function stopAuto() { clearInterval(timer); timer = null; }
    function resetAuto() { stopAuto(); startAuto(); }

    var carousel = track.closest(".carousel") || track;
    ["mouseenter", "focusin", "touchstart"].forEach(function (ev) {
      carousel.addEventListener(ev, stopAuto, { passive: true });
    });
    ["mouseleave", "focusout", "touchend"].forEach(function (ev) {
      carousel.addEventListener(ev, startAuto, { passive: true });
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopAuto(); else startAuto();
    });

    setActive(0);
    startAuto();
  })();
})();
