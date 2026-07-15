const root = document.documentElement;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.body.classList.add("js");

let ticking = false;

function updateScrollProgress() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
  root.style.setProperty("--scroll-progress", progress.toFixed(3));
  ticking = false;
}

function requestScrollUpdate() {
  if (ticking || prefersReducedMotion.matches) {
    return;
  }

  ticking = true;
  window.requestAnimationFrame(updateScrollProgress);
}

function handleMotionPreferenceChange() {
  if (prefersReducedMotion.matches) {
    root.style.setProperty("--scroll-progress", "0");
    return;
  }

  requestScrollUpdate();
}

function initHeroSignals() {
  const tabs = Array.from(document.querySelectorAll("[data-signal-title]"));
  const title = document.getElementById("heroSignalState");
  const copy = document.getElementById("heroSignalCopy");
  const status = document.getElementById("heroSignalStatus");
  const metric = document.getElementById("heroSignalMetric");

  if (!tabs.length || !title || !copy || !status || !metric) {
    return;
  }

  function selectTab(tab) {
    tabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });

    title.textContent = tab.dataset.signalTitle || "";
    copy.textContent = tab.dataset.signalCopy || "";
    status.textContent = tab.dataset.signalState || "";
    metric.textContent = tab.dataset.signalMetric || "";
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => selectTab(tab));
  });
}

function initRoadmapReadout() {
  const readout = document.getElementById("roadmapReadout");
  const buttons = Array.from(document.querySelectorAll("[data-roadmap-detail]"));

  if (!readout || !buttons.length) {
    return;
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      readout.textContent = button.dataset.roadmapDetail || "";
      buttons.forEach((item) => item.classList.toggle("is-selected", item === button));
    });
  });
}

updateScrollProgress();
initHeroSignals();
initRoadmapReadout();

window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);

if (typeof prefersReducedMotion.addEventListener === "function") {
  prefersReducedMotion.addEventListener("change", handleMotionPreferenceChange);
} else if (typeof prefersReducedMotion.addListener === "function") {
  prefersReducedMotion.addListener(handleMotionPreferenceChange);
}
