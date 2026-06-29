/* Philip Builds Studio — shared scroll-reveal + stagger (no deps).
 * Progressive enhancement: if JS is off or reduced-motion is on, content
 * stays fully visible. Auto-targets common section/card selectors so pages
 * don't need per-element classes. */
(function () {
  "use strict";

  function run() {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    var SELECTORS = [
      ".section", ".card",
      ".sp-section", ".sp-pkg", ".sp-type", ".sp-for > div", ".sp-two > div",
      ".match-result",
      ".grid-3 > *", ".grid-2 > *",
      ".chip-group"
    ];
    var els = [];
    SELECTORS.forEach(function (sel) {
      Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) {
        if (els.indexOf(el) === -1) els.push(el);
      });
    });
    if (!els.length) return;

    els.forEach(function (el) {
      el.classList.add("pbs-reveal");
      // light stagger among siblings sharing a parent
      var parent = el.parentElement;
      if (parent) {
        var sibs = Array.prototype.filter.call(parent.children, function (c) {
          return c.classList && c.classList.contains("pbs-reveal");
        });
        var i = sibs.indexOf(el);
        if (i > 0) el.style.transitionDelay = Math.min(i * 60, 240) + "ms";
      }
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -8% 0px" });

    els.forEach(function (el) { io.observe(el); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
