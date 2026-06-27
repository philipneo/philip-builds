(function () {
  "use strict";

  window.PBS = window.PBS || {};

  function initReveal() {
    const items = Array.from(document.querySelectorAll(".reveal"));
    if (!items.length) return;

    const showAll = () => items.forEach((item) => item.classList.add("is-visible"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!("IntersectionObserver" in window) || reduce.matches) {
      showAll();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });

    items.forEach((item) => observer.observe(item));
    if (typeof reduce.addEventListener === "function") {
      reduce.addEventListener("change", (event) => {
        if (event.matches) showAll();
      });
    }
  }

  function initCountUp() {
    const items = Array.from(document.querySelectorAll("[data-count-to]"));
    if (!items.length) return;

    const animate = (item) => {
      const end = Number(item.dataset.countTo || "0");
      const prefix = item.dataset.countPrefix || "";
      const suffix = item.dataset.countSuffix || "";
      const start = Number(item.textContent.replace(/[^0-9.-]/g, "")) || 0;
      window.PBS.animateValue(item, start, end, prefix, suffix, 0);
    };

    if (!("IntersectionObserver" in window)) {
      items.forEach(animate);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    items.forEach((item) => observer.observe(item));
  }

  function initStickyNav() {
    const header = document.querySelector("[data-sticky-header], .site-header");
    if (!header) return;
    const update = () => header.classList.toggle("is-scrolled", window.scrollY > 32);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function initTabSwitch() {
    document.querySelectorAll("[data-tabs]").forEach((root) => {
      const buttons = Array.from(root.querySelectorAll("[data-tab-target]"));
      const panels = Array.from(root.querySelectorAll("[data-tab-panel]"));
      const activate = (name) => {
        buttons.forEach((button) => {
          const active = button.dataset.tabTarget === name;
          button.classList.toggle("is-active", active);
          button.setAttribute("aria-selected", active ? "true" : "false");
        });
        panels.forEach((panel) => {
          const active = panel.dataset.tabPanel === name;
          panel.classList.toggle("is-active", active);
          panel.hidden = !active;
        });
      };
      buttons.forEach((button) => button.addEventListener("click", () => activate(button.dataset.tabTarget)));
      if (buttons[0]) activate(buttons[0].dataset.tabTarget);
    });
  }

  function initAccordion() {
    document.querySelectorAll("[data-accordion]").forEach((root) => {
      root.querySelectorAll("[data-accordion-trigger]").forEach((trigger) => {
        trigger.addEventListener("click", () => {
          const panel = trigger.nextElementSibling;
          if (!panel) return;
          const open = trigger.getAttribute("aria-expanded") === "true";
          trigger.setAttribute("aria-expanded", open ? "false" : "true");
          panel.hidden = open;
        });
      });
    });
  }

  function initPhoneScreens() {
    document.querySelectorAll("[data-phone-flow]").forEach((root) => {
      const screens = Array.from(root.querySelectorAll(".pscreen, .phone-pane"));
      if (!screens.length) return;
      let current = Math.max(0, screens.findIndex((screen) => screen.classList.contains("is-active")));
      const show = (index) => {
        current = Math.max(0, Math.min(index, screens.length - 1));
        screens.forEach((screen, idx) => screen.classList.toggle("is-active", idx === current));
      };
      root.querySelectorAll("[data-phone-next]").forEach((button) => {
        button.addEventListener("click", () => show(current + 1));
      });
      root.querySelectorAll("[data-phone-back]").forEach((button) => {
        button.addEventListener("click", () => show(current - 1));
      });
      show(current);
    });
  }

  function initCopy() {
    document.querySelectorAll("[data-copy]").forEach((button) => {
      button.addEventListener("click", () => {
        const sourceId = button.getAttribute("data-copy");
        const source = sourceId ? document.getElementById(sourceId) : null;
        const text = button.getAttribute("data-copy-text") || (source ? (source.innerText || source.textContent || "") : "");
        if (!text) return;

        const statusSel = button.getAttribute("data-copy-status");
        const status = statusSel ? document.querySelector(statusSel) : button.parentElement && button.parentElement.querySelector(".pbs-copy-status");
        const flash = () => {
          if (!status) return;
          status.textContent = status.getAttribute("data-copy-label") || "✓ Copied";
          status.classList.add("is-shown");
          window.setTimeout(() => status.classList.remove("is-shown"), 2200);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(flash).catch(() => fallbackCopy(text, flash));
        } else {
          fallbackCopy(text, flash);
        }
      });
    });
  }

  function fallbackCopy(text, done) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      if (done) done();
    } catch (err) {
      /* no-op: demo only */
    }
  }

  window.PBS.animateValue = function (element, from, to, prefix, suffix, decimals) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const p = prefix || "";
    const s = suffix || "";
    const d = decimals || 0;
    if (reduce.matches) {
      element.textContent = p + Number(to).toFixed(d) + s;
      return;
    }
    const start = performance.now();
    const duration = 520;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Number(from) + (Number(to) - Number(from)) * eased;
      element.textContent = p + value.toFixed(d) + s;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  window.PBS.initReveal = initReveal;
  window.PBS.initCountUp = initCountUp;
  window.PBS.initStickyNav = initStickyNav;
  window.PBS.initTabSwitch = initTabSwitch;
  window.PBS.initAccordion = initAccordion;
  window.PBS.initCopy = initCopy;

  document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("js");
    initReveal();
    initCountUp();
    initStickyNav();
    initTabSwitch();
    initAccordion();
    initPhoneScreens();
    initCopy();
  });
})();
