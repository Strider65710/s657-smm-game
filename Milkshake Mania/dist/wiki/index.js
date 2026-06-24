(function () {
  "use strict";

  /* ── Lucide icons ──────────────────────────────────────────────────── */
  function renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }
  renderIcons();
  window.addEventListener("load", renderIcons);

  /* ── Theme toggle (light / dark), remembered across pages ──────────── */
  var THEME_KEY = "mm-wiki-theme";
  var themeBtn = document.getElementById("themeToggle");

  function applyTheme(theme) {
    var light = theme === "light";
    document.body.classList.toggle("theme-light", light);
    if (themeBtn) {
      var icon = themeBtn.querySelector("i, svg");
      if (icon) icon.setAttribute("data-lucide", light ? "sun" : "moon");
      renderIcons();
    }
  }

  var stored = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch (e) {
    /* private mode — ignore */
  }
  if (stored) {
    applyTheme(stored);
  } else if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  ) {
    applyTheme("light");
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var nowLight = !document.body.classList.contains("theme-light");
      applyTheme(nowLight ? "light" : "dark");
      try {
        localStorage.setItem(THEME_KEY, nowLight ? "light" : "dark");
      } catch (e) {
        /* ignore */
      }
    });
  }

  /* ── Mobile sidebar drawer ─────────────────────────────────────────── */
  var burger = document.getElementById("navBurger");
  var backdrop = document.getElementById("wkBackdrop");

  function closeSidebar() {
    document.body.classList.remove("wk-sidebar-open");
  }
  if (burger) {
    burger.addEventListener("click", function () {
      document.body.classList.toggle("wk-sidebar-open");
    });
  }
  if (backdrop) backdrop.addEventListener("click", closeSidebar);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeSidebar();
  });

  /* ── Active sidebar link (by current filename) ─────────────────────── */
  var path = location.pathname.split("/").pop() || "index.html";
  if (path === "") path = "index.html";
  var current = path.replace(/\.html$/, "") || "index";
  var navLinks = document.querySelectorAll(".wk-nav a[data-page]");
  Array.prototype.forEach.call(navLinks, function (a) {
    if (a.getAttribute("data-page") === current) {
      a.classList.add("is-active");
      a.setAttribute("aria-current", "page");
    }
    // close the drawer when a destination is chosen
    a.addEventListener("click", closeSidebar);
  });

  /* ── Back-to-top button ────────────────────────────────────────────── */
  var toTop = document.getElementById("toTop");
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  function onScroll() {
    if (toTop) toTop.classList.toggle("show", window.scrollY > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ── Reveal-on-scroll ──────────────────────────────────────────────── */
  var reveals = Array.prototype.slice.call(
    document.querySelectorAll(".reveal"),
  );
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ── Per-page table of contents (subheading tree under the active link) ─ */
  (function buildToc() {
    var activeLink = document.querySelector(".wk-nav a.is-active");
    var mainEl = document.querySelector(".wk-main");
    if (!activeLink || !mainEl) return;

    function slug(t) {
      return (t || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }
    function ensureId(el, prefix) {
      if (!el.id) {
        var base = prefix + (slug(el.textContent) || "section");
        var id = base,
          n = 2;
        while (document.getElementById(id)) id = base + "-" + n++;
        el.id = id;
      }
      return el.id;
    }

    var h2s = Array.prototype.slice.call(mainEl.querySelectorAll("h2"));
    if (!h2s.length) return;

    var toc = document.createElement("div");
    toc.className = "wk-toc";
    var entries = [];

    h2s.forEach(function (h2) {
      var a = document.createElement("a");
      a.href = "#" + ensureId(h2, "sec-");
      a.textContent = h2.textContent.trim();
      toc.appendChild(a);
      entries.push({ link: a, el: h2 });

      var section = h2.closest("section");
      if (!section) return;
      Array.prototype.slice
        .call(section.querySelectorAll("h3"))
        .forEach(function (h3) {
          if (h3.closest(".card, .wk-tip, .wk-faq")) return; // skip card/tip headings
          var sa = document.createElement("a");
          sa.href = "#" + ensureId(h3, "sub-");
          sa.className = "wk-toc__sub";
          sa.textContent = h3.textContent.trim();
          toc.appendChild(sa);
          entries.push({ link: sa, el: h3 });
        });
    });

    activeLink.insertAdjacentElement("afterend", toc);
    Array.prototype.forEach.call(toc.querySelectorAll("a"), function (a) {
      a.addEventListener("click", closeSidebar);
    });

    if ("IntersectionObserver" in window) {
      var spy = new IntersectionObserver(
        function (ents) {
          ents.forEach(function (e) {
            if (!e.isIntersecting) return;
            entries.forEach(function (it) {
              it.link.classList.toggle("is-current", it.el === e.target);
            });
          });
        },
        { rootMargin: "-45% 0px -50% 0px" },
      );
      entries.forEach(function (it) {
        spy.observe(it.el);
      });
    }
  })();
})();
