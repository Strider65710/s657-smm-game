/*
 * Strider657's Milkshake Mania — Wiki
 * Progressive-enhancement behaviour shared by every page. The wiki is fully
 * readable without JS; this renders the shared sidebar, the theme toggle, the
 * mobile drawer, active-link highlighting, a per-page table of contents,
 * reveal-on-scroll, back-to-top, and the Lucide icons. (The FAQ uses native
 * <details> — no JS needed.)
 *
 * The sidebar is defined ONCE here, so adding a page only means adding a line to
 * NAV below — every page renders the full, current navigation automatically.
 */
(function () {
  "use strict";

  /* ── Navigation model (single source of truth) ─────────────────────── */
  var NAV = [
    { label: "Overview", items: [["index", "Home", "home"]] },
    {
      label: "Core gameplay",
      items: [
        ["blending", "Blending & specials", "blend"],
        ["special-outcomes", "Special outcomes", "sparkles"],
        ["flavors", "Flavors & combos", "ice-cream-cone"],
      ],
    },
    {
      label: "Your business",
      items: [
        ["economy", "Shops & upgrades", "store"],
        ["employee-roles", "Employee roles", "users"],
        ["supplies", "Ingredients & supply chain", "package"],
        ["world", "Locations & world", "globe"],
        ["countries", "Countries", "flag"],
        ["research", "Research", "flask-conical"],
      ],
    },
    {
      label: "Progression",
      items: [
        ["progression", "Levels & activities", "trending-up"],
        ["prestige", "Prestige & eternal upgrades", "gem"],
        ["daily", "Daily special & streak", "calendar-days"],
        ["leveling", "Leveling & XP", "medal"],
        ["achievements", "Achievements & stats", "trophy"],
        ["contracts", "Contracts", "clipboard-list"],
        ["goals", "Goals", "target"],
        ["powerups", "Power-ups", "zap"],
      ],
    },
    {
      label: "Reference",
      items: [
        ["settings", "Settings & saves", "settings"],
        ["tips", "Tips & strategy", "lightbulb"],
        ["shortcuts", "Controls & notation", "keyboard"],
        ["glossary", "Glossary", "book-open"],
        ["faq", "FAQ", "circle-help"],
        ["credits", "Credits", "heart"],
      ],
    },
  ];

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  /* current page key from the filename */
  var path = location.pathname.split("/").pop() || "index.html";
  if (path === "") path = "index.html";
  var current = path.replace(/\.html$/, "") || "index";

  /* ── Render the sidebar ────────────────────────────────────────────── */
  var sidebar = document.getElementById("sidebar");
  if (sidebar) {
    var html = '<nav class="wk-nav">';
    NAV.forEach(function (group) {
      html += '<div class="wk-nav__group">';
      html += '<span class="wk-nav__label">' + esc(group.label) + "</span>";
      group.items.forEach(function (it) {
        var page = it[0],
          text = it[1],
          icon = it[2];
        var active =
          page === current ? ' class="is-active" aria-current="page"' : "";
        html +=
          '<a href="' +
          page +
          '.html" data-page="' +
          page +
          '"' +
          active +
          '><i data-lucide="' +
          icon +
          '"></i> ' +
          esc(text) +
          "</a>";
      });
      html += "</div>";
    });
    html += "</nav>";
    sidebar.innerHTML = html;
  }

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
    document.documentElement.classList.toggle("wk-pre-light", light);
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

  /* close the drawer when a destination is chosen */
  var navLinks = document.querySelectorAll(".wk-nav a[data-page]");
  Array.prototype.forEach.call(navLinks, function (a) {
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

  /* ── Per-section version badges ────────────────────────────────────────
     Every documented section shows the game version(s) it applies to. The
     DEFAULT baseline is "1.2-2,1.3": content that has existed (unchanged)
     since v1.2-2 and is still current in v1.3 shows BOTH badges. Override per
     section in the page HTML:
        <section data-versions="1.3">        … new in v1.3 only
        <section data-versions="1.2-2,1.3">  … existed in v1.2-2, changed in v1.3
        <section data-versions="1.2-2">      … v1.2-2 only (rare)
     The newest entry in the list is highlighted as "current". */
  var WIKI_VERSION = "1.2-2,1.3";
  Array.prototype.forEach.call(
    document.querySelectorAll(".wk-main section > h2"),
    function (h2) {
      if (h2.querySelector(".wk-vers")) return;
      var section = h2.closest("section");
      var raw = (section && section.getAttribute("data-versions")) || WIKI_VERSION;
      var list = raw
        .split(",")
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);
      if (!list.length) return;
      var wrap = document.createElement("span");
      wrap.className = "wk-vers";
      list.forEach(function (v, i) {
        var b = document.createElement("span");
        var latest = i === list.length - 1;
        b.className = "wk-ver" + (latest ? " wk-ver--latest" : "");
        b.textContent = "v" + v;
        b.title = latest ? "Current as of v" + v : "Documented since v" + v;
        wrap.appendChild(b);
      });
      h2.appendChild(wrap);
    },
  );

  /* ── Hover anchor links on section headings ────────────────────────── */
  Array.prototype.forEach.call(
    document.querySelectorAll(".wk-main h2[id], .wk-main h3[id]"),
    function (h) {
      if (h.querySelector(".wk-anchor")) return;
      var a = document.createElement("a");
      a.className = "wk-anchor";
      a.href = "#" + h.id;
      a.setAttribute("aria-label", "Link to this section");
      a.textContent = "#";
      h.appendChild(a);
    },
  );

  /* ── Sidebar filter ────────────────────────────────────────────────── */
  (function sidebarFilter() {
    var nav = document.querySelector(".wk-nav");
    if (!nav) return;
    var box = document.createElement("input");
    box.type = "search";
    box.className = "wk-search";
    box.placeholder = "Filter pages…";
    box.setAttribute("aria-label", "Filter wiki pages");
    nav.parentNode.insertBefore(box, nav);

    var empty = document.createElement("div");
    empty.className = "wk-nav__empty";
    empty.textContent = "No pages match.";
    empty.style.display = "none";
    nav.appendChild(empty);

    box.addEventListener("input", function () {
      var q = box.value.trim().toLowerCase();
      var hits = 0;
      Array.prototype.forEach.call(
        nav.querySelectorAll(".wk-nav__group"),
        function (group) {
          var any = false;
          Array.prototype.forEach.call(
            group.querySelectorAll(":scope > a"),
            function (a) {
              var match = a.textContent.toLowerCase().indexOf(q) !== -1;
              a.style.display = match ? "" : "none";
              if (match) {
                any = true;
                hits++;
              }
            },
          );
          group.style.display = any ? "" : "none";
        },
      );
      empty.style.display = hits ? "none" : "";
    });
  })();
})();
