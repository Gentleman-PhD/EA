/* =====================================================================
   EULER ADVISORY — script.js  (shared, page-agnostic)
   Runs on index.html and services.html. Every hook is guarded so a page
   that lacks a given element simply skips that behaviour.
   Accordions on services.html use native <details> — no JS required.
   ===================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Header hairline on scroll ---------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 12) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- Mobile nav ---------------- */
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileNav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------- Hero mouse-tracking radial light (index only) ---------------- */
  var hero = document.getElementById("hero");
  var heroLight = document.getElementById("hero-light");
  if (hero && heroLight && !reduceMotion) {
    var raf = null, tx = 50, ty = 38;
    var apply = function () {
      heroLight.style.setProperty("--mx", tx.toFixed(2) + "%");
      heroLight.style.setProperty("--my", ty.toFixed(2) + "%");
      raf = null;
    };
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    hero.addEventListener("mouseleave", function () {
      tx = 50; ty = 38;
      if (!raf) raf = requestAnimationFrame(apply);
    });
  }

  /* ---------------- Scroll reveal (ink-setting) ----------------
     .reveal-line elements start fully clipped (zero visible area), so the
     observer watches their unclipped PARENT and staggers the children. */
  var plainReveals = [].slice.call(document.querySelectorAll(".reveal"));
  var lineGroups = [];
  document.querySelectorAll(".reveal-line").forEach(function (el) {
    if (lineGroups.indexOf(el.parentNode) === -1) lineGroups.push(el.parentNode);
  });

  function fireLineGroup(parent) {
    parent.querySelectorAll(".reveal-line").forEach(function (line, i) {
      line.style.transitionDelay = (i * 0.12) + "s";
      line.classList.add("in");
    });
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    plainReveals.forEach(function (el) { el.classList.add("in"); });
    lineGroups.forEach(fireLineGroup);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.hasAttribute("data-line-group")) fireLineGroup(el);
        else el.classList.add("in");
        io.unobserve(el);
      });
    }, { threshold: 0, rootMargin: "0px 0px -10% 0px" });   /* reveal when the top edge clears the bottom 10% of the screen; a ratio threshold left tall grids blank on phones */

    plainReveals.forEach(function (el) { io.observe(el); });
    lineGroups.forEach(function (parent) {
      parent.setAttribute("data-line-group", "");
      io.observe(parent);
    });
  }

  /* ---------------- Challenge & Solution dividers: re-triggering draw ----------------
     A dedicated observer (NOT once) toggles .draw-in every time a row enters or
     leaves the viewport, so the black divider lines redraw on each pass —
     scrolling down from the Hero or up from Section 3. */
  var csRows = [].slice.call(document.querySelectorAll("#challenge-solution .cs-row, #engagements .eng-row, #engagement-process .ep-step, #mandate-standard .ms-row, #euler-standard .es-step, #presence .eng-row"));
  if (csRows.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      csRows.forEach(function (r) { r.classList.add("draw-in"); });
    } else {
      var drawObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("draw-in", entry.isIntersecting);
        });
      }, { threshold: 0.2 });
      csRows.forEach(function (r) { drawObs.observe(r); });
    }
  }

  /* ---------------- Solutions matrix tabs (By Role / By Topic) ---------------- */
  var matrixTabs = [].slice.call(document.querySelectorAll(".matrix-tab"));
  if (matrixTabs.length) {
    matrixTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        matrixTabs.forEach(function (t) { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
        [].slice.call(document.querySelectorAll(".matrix-panel")).forEach(function (p) { p.classList.remove("is-active"); p.hidden = true; });
        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");
        var panel = document.getElementById(tab.getAttribute("aria-controls"));
        if (panel) { panel.classList.add("is-active"); panel.hidden = false; }
      });
    });
  }

  /* ---------------- Latest Insights rail: arrow navigation ----------------
     Scrolls by exactly one card (card width + gap). Arrows disable at each end. */
  var rail = document.getElementById("insights-rail");
  var railArrows = [].slice.call(document.querySelectorAll(".insights-arrow"));
  if (rail && railArrows.length) {
    var stepSize = function () {
      var card = rail.querySelector(".insight-card, .fb-col");
      if (!card) return rail.clientWidth;
      var gap = parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap) || 0;
      return card.getBoundingClientRect().width + gap;
    };
    var syncArrows = function () {
      var maxScroll = rail.scrollWidth - rail.clientWidth - 1;
      railArrows.forEach(function (btn) {
        var dir = parseInt(btn.getAttribute("data-rail-dir"), 10);
        btn.disabled = dir < 0 ? rail.scrollLeft <= 0 : rail.scrollLeft >= maxScroll;
      });
    };
    railArrows.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dir = parseInt(btn.getAttribute("data-rail-dir"), 10);
        rail.scrollBy({ left: dir * stepSize(), behavior: reduceMotion ? "auto" : "smooth" });
      });
    });
    rail.addEventListener("scroll", syncArrows, { passive: true });
    window.addEventListener("resize", syncArrows);
    syncArrows();
  }

  /* ---------------- Thesis metric grid: count-up ----------------
     Observes the GRID (not each number) so all four share a single clock and
     land on their targets on the same frame, regardless of magnitude.
     easeOutQuart => heavy deceleration into the final value. Re-runs on every
     entry, scrolling up or down. Suffixes (+ / %) are separate spans and never animate. */
  var metricGrid = document.querySelector(".metric-grid");
  var metricNums = [].slice.call(document.querySelectorAll(".metric-num"));
  if (metricGrid && metricNums.length) {
    var COUNT_MS = 1300;
    var easeOutQuart = function (t) { return 1 - Math.pow(1 - t, 4); };
    var countFrame = null;

    var runCounts = function () {
      if (reduceMotion) {
        metricNums.forEach(function (el) { el.textContent = el.getAttribute("data-target"); });
        return;
      }
      if (countFrame) cancelAnimationFrame(countFrame);
      var targets = metricNums.map(function (el) {
        return parseFloat(el.getAttribute("data-target")) || 0;
      });
      metricNums.forEach(function (el) { el.textContent = "0"; });

      var startTs = null;
      var step = function (ts) {
        if (startTs === null) startTs = ts;
        var p = Math.min((ts - startTs) / COUNT_MS, 1);
        var eased = easeOutQuart(p);
        metricNums.forEach(function (el, i) {
          el.textContent = p === 1 ? targets[i] : Math.round(eased * targets[i]);
        });
        if (p < 1) countFrame = requestAnimationFrame(step);
      };
      countFrame = requestAnimationFrame(step);
    };

    if (!("IntersectionObserver" in window)) {
      metricNums.forEach(function (el) { el.textContent = el.getAttribute("data-target"); });
    } else {
      var countObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) runCounts();
        });
      }, { threshold: 0.45 });
      countObs.observe(metricGrid);
    }
  }

  /* ---------------- Common Questions accordion ----------------
     One item open at a time. Height is measured from the panel's inner
     content so the transition is exact at any width. */
  var faqTriggers = [].slice.call(document.querySelectorAll(".faq-trigger"));
  if (faqTriggers.length) {
    var closeFaq = function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      var item = btn.closest(".faq-item");
      btn.setAttribute("aria-expanded", "false");
      if (item) item.classList.remove("is-open");
      if (panel) panel.style.maxHeight = null;
    };
    var openFaq = function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      var item = btn.closest(".faq-item");
      btn.setAttribute("aria-expanded", "true");
      if (item) item.classList.add("is-open");
      if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
    };
    faqTriggers.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var isOpen = btn.getAttribute("aria-expanded") === "true";
        faqTriggers.forEach(closeFaq);          // collapse siblings
        if (!isOpen) openFaq(btn);              // toggle
      });
    });
    // Keep an open panel correctly sized if the viewport reflows the text
    window.addEventListener("resize", function () {
      var open = document.querySelector('.faq-trigger[aria-expanded="true"]');
      if (!open) return;
      var panel = document.getElementById(open.getAttribute("aria-controls"));
      if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
    });
  }

  /* ---------------- Research Areas accordion ----------------
     Strict single-open accordion: opening one row closes any other that is open,
     so only one panel is ever visible. Clicking an open row closes it. */
  var raRows = [].slice.call(document.querySelectorAll("#research-areas .ra-row"));
  raRows.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.parentNode;
      var willOpen = !item.classList.contains("open");
      raRows.forEach(function (other) {
        other.parentNode.classList.remove("open");
        other.setAttribute("aria-expanded", "false");
      });
      if (willOpen) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ---------------- Logo grid: graceful typographic fallback ----------------
     If a Logos/* file is ever missing, fall back to a serif wordmark from the
     alt text instead of a broken-image icon. */
  var logoImgs = [].slice.call(document.querySelectorAll(".logo-cell img, .eng-logo-cell img, .logo-strip-item img"));
  function checkLogo(img) {
    // Resolve to the styled cell, not the immediate parent — logos may be wrapped in an <a>.
    var cell = img.closest(".logo-strip-item, .logo-cell, .eng-logo-cell") || img.parentNode;
    // Preserve an author-supplied short fallback label; otherwise derive from alt.
    if (!cell.getAttribute("data-fallback")) cell.setAttribute("data-fallback", img.getAttribute("alt") || "");
    if (img.complete && img.naturalWidth === 0) cell.classList.add("logo-missing");
  }
  logoImgs.forEach(function (img) {
    checkLogo(img);
    img.addEventListener("error", function () {
      img.parentNode.classList.add("logo-missing");
    });
  });
  window.addEventListener("load", function () { logoImgs.forEach(checkLogo); });

  /* ---------------- Line-clamp toggle (See more / Show less) ----------------
     Each .clamp-toggle controls the element named in its aria-controls. Clicking
     toggles the .expanded class (which drops the -webkit-line-clamp) and swaps
     the label. Guarded, so pages without a clamp simply skip this. */
  [].slice.call(document.querySelectorAll(".clamp-toggle")).forEach(function (btn) {
    var target = document.getElementById(btn.getAttribute("aria-controls"));
    if (!target) return;
    btn.addEventListener("click", function () {
      var expanded = target.classList.toggle("expanded");
      btn.setAttribute("aria-expanded", expanded ? "true" : "false");
      btn.textContent = expanded ? "Show less" : "See more";
    });
  });

  /* ---------------- Footer logo: same height as the footer text block ----------------
     On the side-by-side layout the square logo is sized to the text column, from the
     footer links ("Home") down to the email line. On the stacked phone layout
     (max-width: 960px) the CSS size applies instead. */
  var footInner = document.querySelector(".footer-inner");
  var footText = document.querySelector(".footer-text");
  var footLogo = document.querySelector(".footer-logo-img");
  if (footInner && footText && footLogo) {
    var syncFooterLogo = function () {
      if (getComputedStyle(footInner).flexDirection === "column") {
        footLogo.style.height = ""; footLogo.style.width = "";
        return;
      }
      var h = Math.round(footText.getBoundingClientRect().height);
      if (h > 0) { footLogo.style.height = h + "px"; footLogo.style.width = h + "px"; }
    };
    syncFooterLogo();
    if ("ResizeObserver" in window) { new ResizeObserver(syncFooterLogo).observe(footText); }
    else { window.addEventListener("resize", syncFooterLogo); }
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(syncFooterLogo); }
  }

})();
