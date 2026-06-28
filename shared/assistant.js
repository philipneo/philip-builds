(function () {
  "use strict";

  const currentScript = document.currentScript;
  const rootPath = currentScript?.dataset.assistantRoot || "";
  const context = currentScript?.dataset.assistantContext || "home";
  const inlineEnabled = currentScript?.dataset.assistantInline === "true";

  const routes = {
    command: "demos/local-business-command-center/index.html",
    service: "demos/service-business-landing-page/index.html",
    glosslane: "demos/mobile-detailing-landing-page/index.html",
    restaurant: "demos/restaurant-menu-page/index.html",
    cleaning: "demos/cleaning-quote-calculator/index.html",
    invoice: "demos/invoice-builder/index.html",
    portfolio: "portfolio/index.html",
    start: "start-project/index.html",
    matcher: "project-matcher/index.html",
    studio: "studio-os/index.html",
    home: "index.html"
  };

  const MAILTO =
    "mailto:philipbuildsstudio@gmail.com?subject=" +
    encodeURIComponent("Project inquiry — Philip Builds Studio");

  // Safe local device memory (no personal data). Set by the Project Matcher.
  function memGet() {
    try { return JSON.parse(localStorage.getItem("pbs.lastMatch") || "null"); } catch (e) { return null; }
  }
  function memClear() {
    try { localStorage.removeItem("pbs.lastMatch"); } catch (e) {}
  }

  const contextCopy = {
    home: {
      label: "Studio Assistant",
      intro: "I can point you to the right demo, tool, or starting package. Front-end demo only.",
      prompt: "Which demo should I look at?"
    },
    portfolio: {
      label: "Demo Assistant",
      intro: "Tell me what kind of workflow you care about and I will route you to a matching demo.",
      prompt: "Help me choose a starting point"
    },
    command: {
      label: "Ops Guide",
      intro: "This page is about quote requests, job status, checklists, and end-of-day summaries.",
      prompt: "Explain this operations dashboard"
    },
    service: {
      label: "Quote Flow Guide",
      intro: "This demo shows how a service page can guide visitors toward a cleaner request.",
      prompt: "I want a cleaner booking flow"
    },
    glosslane: {
      label: "Package Guide",
      intro: "This detailing demo uses package selection, add-ons, and service-area clarity.",
      prompt: "Help me compare detailing packages"
    },
    restaurant: {
      label: "Menu Flow Guide",
      intro: "This restaurant demo shows menu browsing, category tabs, and a browser-only order preview.",
      prompt: "Show me menu flow ideas"
    },
    cleaning: {
      label: "Estimate Guide",
      intro: "This quote demo focuses on room counts, add-ons, urgency, and owner review.",
      prompt: "Show me tools that help with pricing"
    },
    invoice: {
      label: "Handoff Guide",
      intro: "This invoice demo turns line items, tax, discounts, and notes into a cleaner handoff.",
      prompt: "I need help with client handoff"
    },
    start: {
      label: "Project Guide",
      intro: "Tell me what you want built and I'll point you to the closest demo, or to the project email. Front-end demo only — nothing sends automatically.",
      prompt: "Help me start a project"
    }
  };

  const quickPrompts = [
    "I need a site for my service business",
    "Show me tools that help with pricing",
    "I want a cleaner booking flow",
    "Which demo should I look at?",
    "Help me choose a starting point"
  ];

  function route(path) {
    return rootPath + path;
  }

  function recommendationsFor(text) {
    const value = text.toLowerCase();
    if (value.includes("reset") || value.includes("forget")) {
      memClear();
      return {
        text: "Done — I cleared the last match remembered on this device. Nothing else was ever stored.",
        links: [["Open the matcher", routes.matcher]]
      };
    }
    if (
      value.includes("match me") || value.includes("recommend") || value.includes("matcher") ||
      value.includes("what should i build") || value.includes("not sure") || value.includes("help me choose")
    ) {
      return {
        text: "Use the Project Matcher — pick your business type, goal, and build, and it points you to the closest demo. It runs in your browser and remembers your last pick on this device only.",
        links: [["Open Project Matcher", routes.matcher], ["Studio roadmap", routes.studio]]
      };
    }
    if (
      value.includes("hire") || value.includes("contact") || value.includes("project") ||
      value.includes("build me") || value.includes("work with") || value.includes("start a") ||
      value.includes("get started") || value.includes("help me start") || value.includes("how much") ||
      value.includes("email")
    ) {
      return {
        text: "Easiest path: open the Start a Project page, pick the closest project type, and it builds a pre-filled email you can review and send yourself. Nothing is sent automatically and nothing is stored.",
        links: [["Start a project", routes.start], ["Open project email", MAILTO]]
      };
    }
    if (value.includes("restaurant") || value.includes("menu") || value.includes("order")) {
      return {
        text: "The Kettle House restaurant demo is the best fit. It shows menu browsing, category tabs, cart-style behavior, and a lightweight order preview with no payment or real submission.",
        links: [["Open Restaurant Demo", routes.restaurant], ["See Portfolio", routes.portfolio]]
      };
    }
    if (value.includes("invoice") || value.includes("billing") || value.includes("handoff") || value.includes("client")) {
      return {
        text: "Start with the Invoice Builder. It shows how line items, tax, discounts, and notes can become a cleaner client handoff inside a browser-only tool.",
        links: [["Open Invoice Builder", routes.invoice], ["See Practical Tools", routes.portfolio + "#tools-title"]]
      };
    }
    if (value.includes("quote") || value.includes("pricing") || value.includes("price") || value.includes("estimate") || value.includes("calculator")) {
      return {
        text: "Start with the Cleaning Quote Calculator or Service Business demo. They show how pricing, add-ons, and customer intake can be made easier in a simple front-end flow.",
        links: [["Open Cleaning Quote", routes.cleaning], ["Open Service Demo", routes.service]]
      };
    }
    if (value.includes("booking") || value.includes("request") || value.includes("form") || value.includes("service business")) {
      return {
        text: "The Service Business demo is the cleanest starting point for booking and quote flow. For a deeper operator view, compare it with the Command Center.",
        links: [["Open Service Demo", routes.service], ["Open Command Center", routes.command]]
      };
    }
    if (value.includes("detail") || value.includes("detailing") || value.includes("package") || value.includes("car")) {
      return {
        text: "GlossLane is the best match for package-based service pages. It shows premium positioning, add-on selection, service areas, and a phone booking concept.",
        links: [["Open GlossLane", routes.glosslane], ["See Portfolio", routes.portfolio]]
      };
    }
    if (value.includes("dashboard") || value.includes("ops") || value.includes("operations") || value.includes("workflow") || value.includes("schedule")) {
      return {
        text: "The Local Business Command Center is the flagship workflow demo: quote queue, job schedule, checklist, notes, and end-of-day summary in one page.",
        links: [["Open Command Center", routes.command], ["Open Portfolio", routes.portfolio]]
      };
    }
    if (value.includes("website") || value.includes("site") || value.includes("landing")) {
      return {
        text: "Start with the Service Business page or Local Business Command Center. They show how a basic site can become a practical customer path and operator workflow.",
        links: [["Open Service Demo", routes.service], ["Open Command Center", routes.command]]
      };
    }
    return {
      text: "A good starting point is the portfolio showroom. If you want a page, open Service Business or GlossLane. If you want a tool, open Cleaning Quote or Invoice Builder. Ready to build something? Start a project.",
      links: [["Open Portfolio", routes.portfolio], ["Open Cleaning Quote", routes.cleaning], ["Start a project", routes.start]]
    };
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function addMessage(body, text, options) {
    const message = createElement("div", "pbs-assistant-message" + (options?.user ? " is-user" : ""));
    const paragraph = createElement("p", "", text);
    message.appendChild(paragraph);
    if (options?.links?.length) {
      const links = createElement("div", "pbs-assistant-links");
      options.links.forEach(([label, href]) => {
        const link = createElement("a", "", label);
        const isAbsolute = /^(mailto:|https?:|#)/.test(href);
        link.href = isAbsolute ? href : route(href).replace(rootPath + rootPath, rootPath);
        links.appendChild(link);
      });
      message.appendChild(links);
    }
    if (options?.small) message.appendChild(createElement("small", "", options.small));
    body.appendChild(message);
    body.scrollTop = body.scrollHeight;
  }

  function buildAssistant() {
    if (document.querySelector(".pbs-assistant-panel")) return;
    const copy = contextCopy[context] || contextCopy.home;

    const launcher = createElement("button", "pbs-assistant-launcher");
    launcher.type = "button";
    launcher.setAttribute("aria-expanded", "false");
    launcher.innerHTML = '<span class="pbs-assistant-mark">PB</span><span class="pbs-assistant-launcher-text"><strong>Demo Assistant</strong><span>Front-end guide</span></span>';

    const panel = createElement("section", "pbs-assistant-panel");
    panel.setAttribute("aria-label", "Demo Assistant chat panel");
    panel.innerHTML = `
      <div class="pbs-assistant-head">
        <div class="pbs-assistant-title">
          <span class="pbs-assistant-mark">PB</span>
          <div>
            <strong>${copy.label}</strong>
            <span>Demo mode · front-end only</span>
          </div>
        </div>
        <button class="pbs-assistant-close" type="button" aria-label="Close assistant">×</button>
      </div>
      <div class="pbs-assistant-body" aria-live="polite"></div>
      <div class="pbs-assistant-foot">
        <div class="pbs-assistant-chips" aria-label="Quick prompts"></div>
        <form class="pbs-assistant-form" onsubmit="event.preventDefault()">
          <input class="pbs-assistant-input" type="text" autocomplete="off" placeholder="Ask about quotes, demos, tools..." aria-label="Assistant message" />
          <button class="pbs-assistant-send" type="button">Send</button>
        </form>
        <p class="pbs-assistant-note">Fictional guided chat demo. It does not use a backend, save messages, or contact anyone.</p>
      </div>
    `;

    document.body.append(panel, launcher);

    const body = panel.querySelector(".pbs-assistant-body");
    const chips = panel.querySelector(".pbs-assistant-chips");
    const input = panel.querySelector(".pbs-assistant-input");
    const form = panel.querySelector(".pbs-assistant-form");
    const send = panel.querySelector(".pbs-assistant-send");
    const close = panel.querySelector(".pbs-assistant-close");

    addMessage(body, copy.intro, {
      links: [["Match me to a demo", routes.matcher], ["Open portfolio", routes.portfolio]],
      small: "Try a quick prompt below."
    });

    const saved = memGet();
    if (saved && saved.label && saved.href) {
      addMessage(body, "Welcome back — on this device you last matched with " + saved.label + ".", {
        links: [["Continue: " + saved.label, saved.href], ["New match", routes.matcher]],
        small: "Type \"reset\" to forget this."
      });
    }

    quickPrompts.forEach((prompt) => {
      const chip = createElement("button", "pbs-assistant-chip", prompt);
      chip.type = "button";
      chip.addEventListener("click", () => respond(prompt));
      chips.appendChild(chip);
    });

    function openPanel() {
      panel.classList.add("is-open");
      launcher.setAttribute("aria-expanded", "true");
      input.focus({ preventScroll: true });
    }

    function closePanel() {
      panel.classList.remove("is-open");
      launcher.setAttribute("aria-expanded", "false");
      launcher.focus({ preventScroll: true });
    }

    function respond(text) {
      const trimmed = text.trim();
      if (!trimmed) return;
      addMessage(body, trimmed, { user: true });
      const result = recommendationsFor(trimmed);
      window.setTimeout(() => addMessage(body, result.text, { links: result.links }), 120);
    }

    function handleSend() {
      const value = input.value.trim();
      if (!value) return;
      input.value = "";
      respond(value);
    }

    launcher.addEventListener("click", () => {
      if (panel.classList.contains("is-open")) closePanel();
      else openPanel();
    });
    close.addEventListener("click", closePanel);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      handleSend();
    });
    send.addEventListener("click", handleSend);
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.shiftKey) return;
      event.preventDefault();
      handleSend();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && panel.classList.contains("is-open")) closePanel();
    });

    document.querySelectorAll("[data-assistant-open]").forEach((button) => {
      button.addEventListener("click", () => {
        openPanel();
        const prompt = button.getAttribute("data-assistant-open");
        if (prompt) respond(prompt);
      });
    });
  }

  function buildInlinePanel() {
    if (!inlineEnabled || document.querySelector(".pbs-assistant-inline")) return;
    const copy = contextCopy[context] || contextCopy.home;
    const firstSection = document.querySelector("main > section, body > section");
    if (!firstSection) return;
    const panel = createElement("aside", "pbs-assistant-inline");
    panel.innerHTML = `
      <div class="pbs-assistant-inline-inner">
        <p><strong>${copy.label}:</strong> ${copy.intro}</p>
        <button type="button" data-assistant-open="${copy.prompt}">Ask the demo assistant</button>
      </div>
    `;
    firstSection.insertAdjacentElement("afterend", panel);
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildInlinePanel();
    buildAssistant();
  });
})();
