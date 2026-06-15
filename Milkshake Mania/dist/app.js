/* Shared site behavior, used on every page: Lucide icon rendering, the
   light/dark theme toggle, and the mobile hamburger menu. Each piece guards
   for missing elements so the same file is safe on all pages. */
(function () {
  "use strict";

  var root = document.documentElement;

  function renderIcons() {
    if (window.lucide) lucide.createIcons();
  }

  // ── Theme toggle ────────────────────────────────────────────────────────
  var themeBtn = document.getElementById("theme-toggle");
  function paintThemeBtn() {
    if (themeBtn) {
      var light = root.classList.contains("theme-light");
      themeBtn.innerHTML = '<i data-lucide="' + (light ? "sun" : "moon") + '"></i>';
    }
    renderIcons();
  }
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      root.classList.toggle("theme-light");
      localStorage.setItem(
        "smm-theme",
        root.classList.contains("theme-light") ? "light" : "dark"
      );
      paintThemeBtn();
    });
  }
  paintThemeBtn(); // also performs the initial lucide.createIcons()

  // ── Mobile hamburger menu ─────────────────────────────────────────────────
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  if (nav && navToggle) {
    var links = nav.querySelector(".nav__links");
    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    navToggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });
    if (links) {
      links.addEventListener("click", function (e) {
        if (e.target.closest("a")) setOpen(false);
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target)) setOpen(false);
    });
  }

  // ── Back-to-top button ────────────────────────────────────────────────────
  var toTop = document.getElementById("toTop");
  if (toTop) {
    window.addEventListener(
      "scroll",
      function () {
        toTop.classList.toggle("show", window.scrollY > 600);
      },
      { passive: true }
    );
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
