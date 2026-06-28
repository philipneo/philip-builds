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

  // Public AI config (no secrets). Resolves the endpoint with safe fallbacks.
  // Order: window.PBS_AI_CONFIG.endpoint -> window.PBS_AI_ENDPOINT -> "".
  function aiEndpoint() {
    try {
      const cfg = (typeof window !== "undefined" && window.PBS_AI_CONFIG) ? window.PBS_AI_CONFIG : null;
      if (cfg && typeof cfg === "object") {
        if (cfg.allowModelMode === false) return "";
        if (cfg.endpoint) return String(cfg.endpoint).trim();
      }
      if (typeof window !== "undefined" && window.PBS_AI_ENDPOINT) {
        return String(window.PBS_AI_ENDPOINT).trim();
      }
    } catch (e) { /* private mode */ }
    return "";
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
    "Match me to a demo",
    "Can you build an AI assistant?",
    "Show me tools that help with pricing",
    "How do I make this real AI?",
    "Which demo should I look at?"
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
      (value.includes("real") && value.includes("ai")) || value.includes("are you ai") ||
      value.includes("human") || value.includes("chatgpt") || value.includes("a bot") ||
      value.includes("robot") || value.includes("are you a")
    ) {
      return {
        text: aiEndpoint()
          ? "Honest answer: model-powered mode is available through this site's backend, so some replies may come from a model. I'm still not a human, and I won't claim fake results. I can point you to the right demo or the Start Project page."
          : "Honest answer: I'm currently running as a guided front-end assistant. The site is wired for model mode, but real AI needs a serverless backend with a private API key — it isn't active on GitHub Pages. I'm not a human and don't pretend to be.",
        links: [["Match me to a demo", routes.matcher], ["Start a project", routes.start]]
      };
    }
    if (
      value.includes("what can you build") || value.includes("what do you build") ||
      value.includes("what can you do") || value.includes("services") || value.includes("what can philip")
    ) {
      return {
        text: "Philip builds front-end websites and interactive tools: service pages, quote calculators, booking and menu flows, invoice tools, and operations dashboards. Every demo here is a working, fictional concept. Open the matcher and I'll point you to the closest one.",
        links: [["Open Project Matcher", routes.matcher], ["Browse portfolio", routes.portfolio]]
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
    if (
      value.includes("cleaning") || value.includes("cleaner") || value.includes("maid") ||
      value.includes("house cleaning") || value.includes("janitorial")
    ) {
      return {
        text: "The Cleaning Quote Calculator is the closest fit — a fictional, front-end quote/pricing demo where customers pick rooms, add-ons, and timing for an instant estimate. It also shows the owner-side view.",
        links: [["Open Cleaning Quote", routes.cleaning], ["Match me to a demo", routes.matcher]]
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
    if (
      value.includes("how") && (value.includes("real ai") || value.includes("make this ai") || value.includes("model"))
    ) {
      return {
        text: "To make model mode real: deploy the site + the api/chat.js function on Vercel (or Netlify), set AI_PROVIDER_API_KEY in the host's environment, then flip shared/ai-config.js to point at /api/chat. The key stays server-side — never in the browser. Studio OS and docs/AI_SETUP.md have the exact steps.",
        links: [["Open Studio OS", routes.studio], ["Start a project", routes.start]]
      };
    }
    if (
      value.includes("openai") || value.includes("api key") || value.includes("anthropic") || value.includes("key")
    ) {
      return {
        text: "Honest + safe: API keys never go in front-end JavaScript — anything shipped to the browser is public. The key lives only in a server's environment variables, behind the api/chat.js function. On GitHub Pages there's no server, so the assistant stays in guided mode.",
        links: [["AI readiness in Studio OS", routes.studio]]
      };
    }
    if (
      value.includes("vercel") || value.includes("netlify") || value.includes("backend") ||
      value.includes("serverless") || value.includes("deploy")
    ) {
      return {
        text: "Model mode runs on a serverless host (Vercel/Netlify), not GitHub Pages. The api/chat.js scaffold is ready; deploying it with a private env key and switching the endpoint turns on real model replies — with a graceful fallback to this guided mode if it ever errors.",
        links: [["Open Studio OS", routes.studio], ["Read the path", routes.start]]
      };
    }
    if (
      value.includes("chatbot") || value.includes("assistant") || value.includes("automation") ||
      value.includes("ai website") || value.includes("ai tool") || value.includes("smart site") ||
      value.includes("ai ") || value === "ai" || value.includes("model")
    ) {
      return {
        text: aiEndpoint()
          ? "This assistant is model-ready and an endpoint is configured, so replies can come from a model — with a guided fallback if it errors. Philip builds the front-end assistant UI plus an env-key-only serverless scaffold you can deploy when you want real model mode."
          : "Right now this is a guided front-end assistant — fast, rule-based, and live on a static site with no backend. The same UI is wired for real model mode later: deploy the serverless scaffold with a private key and flip one config value. Keys never touch the browser.",
        links: [["See AI readiness", routes.studio], ["Match me to a demo", routes.matcher], ["Start a project", routes.start]]
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
            <span class="pbs-assistant-badge" aria-live="polite">Guided mode</span>
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
    const badge = panel.querySelector(".pbs-assistant-badge");

    const BADGE_TEXT = {
      guided: "Guided mode",
      ready: "Model-ready",
      model: "Model mode",
      fallback: "Guided fallback"
    };
    function setBadge(state) {
      if (!badge) return;
      badge.textContent = BADGE_TEXT[state] || BADGE_TEXT.guided;
      badge.setAttribute("data-state", state || "guided");
    }
    // Initial state: model-ready only if an endpoint is actually configured.
    setBadge(aiEndpoint() ? "ready" : "guided");

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

    function localReply(text, options) {
      const result = recommendationsFor(text);
      if (options && options.degraded) setBadge("fallback");
      addMessage(body, result.text, {
        links: result.links,
        small: options && options.degraded ? "AI mode unavailable — using guided demo mode." : undefined
      });
    }

    function askBackend(endpoint, text) {
      // Loading state
      const pending = createElement("div", "pbs-assistant-message pbs-assistant-pending");
      pending.appendChild(createElement("p", "", "Thinking…"));
      body.appendChild(pending);
      body.scrollTop = body.scrollHeight;

      let done = false;
      const controller = ("AbortController" in window) ? new AbortController() : null;
      const timer = window.setTimeout(() => { if (!done && controller) controller.abort(); }, 12000);

      // Only non-sensitive context leaves the page. No personal data.
      const payload = {
        message: text.slice(0, 2000),
        page: (typeof location !== "undefined" ? location.pathname : ""),
        lastMatch: (memGet() || {}).label || ""
      };

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
        .then((data) => {
          done = true;
          window.clearTimeout(timer);
          pending.remove();
          const reply = data && typeof data.reply === "string" ? data.reply.trim() : "";
          if (!reply) { localReply(text, { degraded: true }); return; }
          setBadge("model");
          const links = Array.isArray(data.links) && data.links.length
            ? data.links
            : [["Start a project", routes.start]];
          addMessage(body, reply, { links: links });
        })
        .catch(() => {
          done = true;
          window.clearTimeout(timer);
          pending.remove();
          localReply(text, { degraded: true });
        });
    }

    function respond(text) {
      const trimmed = text.trim();
      if (!trimmed) return;
      addMessage(body, trimmed, { user: true });
      const endpoint = aiEndpoint();
      if (endpoint) {
        askBackend(endpoint, trimmed);
      } else {
        window.setTimeout(() => localReply(trimmed), 120);
      }
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
