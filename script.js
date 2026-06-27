const root = document.documentElement;

document.body.classList.remove("no-js");
document.body.classList.add("js");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealItems = Array.from(document.querySelectorAll(".reveal"));

function showAll() {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

if ("IntersectionObserver" in window && !prefersReducedMotion.matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.14,
    },
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  showAll();
}

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

updateScrollProgress();
window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);
function handleMotionPreferenceChange() {
  if (prefersReducedMotion.matches) {
    showAll();
    root.style.setProperty("--scroll-progress", "0");
    return;
  }

  requestScrollUpdate();
}

if (typeof prefersReducedMotion.addEventListener === "function") {
  prefersReducedMotion.addEventListener("change", handleMotionPreferenceChange);
} else if (typeof prefersReducedMotion.addListener === "function") {
  prefersReducedMotion.addListener(handleMotionPreferenceChange);
}

const projectBriefButton = document.getElementById("projectBriefButton");
const projectBriefStatus = document.getElementById("projectBriefStatus");

if (projectBriefButton && projectBriefStatus) {
  projectBriefButton.addEventListener("click", () => {
    projectBriefStatus.textContent =
      "Brief ready: business name, current link, services, photos, budget range, and the customer action the page should make easier.";
  });
}
