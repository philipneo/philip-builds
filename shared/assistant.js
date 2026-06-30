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

  let aiBackendState = "fallback";

  function setBackendState(state) {
    aiBackendState = state || "fallback";
  }

  function safeEndpoint(value) {
    const endpoint = String(value || "").trim();
    if (!endpoint) return "";
    try {
      if (window.location.protocol === "file:" || /(^|\.)github\.io$/i.test(window.location.hostname)) return "";
      const resolved = new URL(endpoint, window.location.origin);
      const sameOrigin = resolved.origin === window.location.origin;
      if (!sameOrigin || !resolved.pathname.startsWith("/api/")) return "";
      return endpoint.startsWith("/") ? resolved.pathname + resolved.search : resolved.href;
    } catch (e) {
      return "";
    }
  }

  // Public AI config (no secrets). Resolves the endpoint with safe fallbacks.
  // Order: window.PBS_AI_CONFIG.endpoint -> window.PBS_AI_ENDPOINT -> "".
  function aiEndpoint() {
    try {
      const cfg = (typeof window !== "undefined" && window.PBS_AI_CONFIG) ? window.PBS_AI_CONFIG : null;
      if (cfg && typeof cfg === "object") {
        if (cfg.allowModelMode === false) return "";
        if (cfg.endpoint) return safeEndpoint(cfg.endpoint);
      }
      if (typeof window !== "undefined" && window.PBS_AI_ENDPOINT) {
        return safeEndpoint(window.PBS_AI_ENDPOINT);
      }
    } catch (e) { /* private mode */ }
    return "";
  }

  function connectedCopy() {
    if (aiBackendState === "connected") {
      return "AI backend reachable through this site's server endpoint. I am still not human, and I won't invent clients, results, or promises.";
    }
    if (aiBackendState === "unavailable") {
      return "This page is configured for the Vercel AI backend, but the backend is unavailable right now. I am using the rule-based fallback and will not pretend a model answered.";
    }
    if (aiBackendState === "checking") {
      return "This page is checking the Vercel AI backend. Until it confirms a working model response path, I use the rule-based fallback.";
    }
    return "I am currently running as a rule-based assistant. Real AI requires the server-side /api/chat endpoint with a private environment key. No key ever belongs in browser code.";
  }

  const contextCopy = {
    home: {
      label: "Studio Assistant",
      intro: "I can point you to the right demo, tool, or starting package. I use rule-based fallback unless the Vercel AI backend is connected.",
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
      intro: "Tell me what you want built and I'll point you to the closest demo, or to the project email. Nothing sends automatically.",
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
        text: "Honest answer: " + connectedCopy() + " I can point you to the right demo or the Start Project page.",
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
      value.includes("proof") || value.includes("site health") || value.includes("lighthouse") ||
      value.includes("qa") || value.includes("og image") || value.includes("share image") ||
      value.includes("is this live") || value.includes("fake")
    ) {
      return {
        text: "Honest proof lives on the Studio OS page: a live static build, 13 front-end demos with 6 guided walkthroughs, no API keys in the browser, no trackers, and fictional/demo-only labels. No scores or client results are claimed — measured numbers (like a Lighthouse report) only get posted once they're actually recorded.",
        links: [["Open Studio OS", routes.studio], ["See the portfolio", routes.portfolio]]
      };
    }
    if (
      value.includes("this demo") || value.includes("what is this") || value.includes("can you build this") ||
      value.includes("build this") || value.includes("make me one") || value.includes("one like this") ||
      value.includes("is this real") || value.includes("real business") || value.includes("how do i use this") ||
      value.includes("how does this work") || value.includes("walk me through") || value.includes("walkthrough") ||
      value.includes("what should i click") || value.includes("what does this prove") ||
      value.includes("take payment") || value.includes("real payment") || value.includes("book client") ||
      value.includes("can this book") || value.includes("can this take")
    ) {
      return {
        text: "This is a fictional, front-end demo — it shows the interface and flow, but nothing real happens (no payment, booking, or submission). Each flagship demo has a demo brief at the top, a step-by-step walkthrough, and a \"what this proves\" section. A real version can be built and adapted to your business — use the Project Matcher to find the closest concept, or Start a project to send the idea.",
        links: [["Match this to my project", routes.matcher], ["Start a project", routes.start]]
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
        text: "To make model mode real: deploy the site plus api/chat.js on Vercel, set OPENAI_API_KEY in Vercel environment variables, and keep shared/ai-config.js pointed at /api/chat. The key stays server-side — never in the browser. Studio OS and docs/AI_SETUP.md have the exact steps.",
        links: [["Open Studio OS", routes.studio], ["Start a project", routes.start]]
      };
    }
    if (
      value.includes("openai") || value.includes("api key") || value.includes("anthropic") || value.includes("key")
    ) {
      return {
        text: "Honest + safe: API keys never go in front-end JavaScript — anything shipped to the browser is public. The key lives only in Vercel environment variables behind api/chat.js. GitHub Pages cannot run that backend, so it falls back to the rule-based guide.",
        links: [["AI readiness in Studio OS", routes.studio]]
      };
    }
    if (
      value.includes("vercel") || value.includes("netlify") || value.includes("backend") ||
      value.includes("serverless") || value.includes("deploy")
    ) {
      return {
        text: "Model mode runs on a serverless host like Vercel, not GitHub Pages. This frontend calls only the same-origin /api/chat endpoint. If that backend has no private env key or returns an error, the assistant falls back to this rule-based guide.",
        links: [["Open Studio OS", routes.studio], ["Read the path", routes.start]]
      };
    }
    if (
      value.includes("chatbot") || value.includes("assistant") || value.includes("automation") ||
      value.includes("ai website") || value.includes("ai tool") || value.includes("smart site") ||
      value.includes("ai ") || value === "ai" || value.includes("model")
    ) {
      return {
        text: connectedCopy() + " Philip Builds Studio can show a front-end assistant UI with a private-key-only serverless backend and a safe fallback.",
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
    launcher.innerHTML = '<span class="pbs-assistant-mark">PB</span><span class="pbs-assistant-launcher-text"><strong>Demo Assistant</strong><span>Safe guide</span></span>';

    const panel = createElement("section", "pbs-assistant-panel");
    panel.setAttribute("aria-label", "Demo Assistant chat panel");
    panel.innerHTML = `
      <div class="pbs-assistant-head">
        <div class="pbs-assistant-title">
          <span class="pbs-assistant-mark">PB</span>
          <div>
            <strong>${copy.label}</strong>
            <span class="pbs-assistant-badge" aria-live="polite">Rule-based fallback</span>
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
        <p class="pbs-assistant-note">Rule-based fallback. No model call is made until the server-side backend confirms it is available.</p>
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
    const note = panel.querySelector(".pbs-assistant-note");

    const BADGE_TEXT = {
      fallback: "Rule-based fallback",
      checking: "Checking AI backend",
      connected: "AI backend reachable",
      unavailable: "AI backend unavailable"
    };
    const STATUS_NOTE = {
      fallback: "Rule-based fallback. No backend call, no messages saved, and no one is contacted.",
      checking: "Checking the same-origin AI backend. Fallback stays ready if it is unavailable.",
      connected: "AI backend reachable through /api/chat. Model replies still require a successful POST.",
      unavailable: "AI backend unavailable. Using rule-based fallback and not claiming a model replied."
    };
    function setAssistantState(state) {
      const next = state || "fallback";
      setBackendState(next);
      if (!badge) return;
      badge.textContent = BADGE_TEXT[next] || BADGE_TEXT.fallback;
      badge.setAttribute("data-state", next);
      if (note) note.textContent = STATUS_NOTE[next] || STATUS_NOTE.fallback;
    }
    const configuredEndpoint = aiEndpoint();
    setAssistantState(configuredEndpoint ? "checking" : "fallback");

    function checkBackend(endpoint) {
      let settled = false;
      const controller = ("AbortController" in window) ? new AbortController() : null;
      const timer = window.setTimeout(() => { if (!settled && controller) controller.abort(); }, 12000);
      fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller ? controller.signal : undefined
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("backend unavailable"))))
        .then((data) => {
          settled = true;
          window.clearTimeout(timer);
          if (data && data.ok === true && data.mode === "ai") setAssistantState("connected");
          else setAssistantState("unavailable");
        })
        .catch(() => {
          settled = true;
          window.clearTimeout(timer);
          setAssistantState("unavailable");
        });
    }

    if (configuredEndpoint) checkBackend(configuredEndpoint);

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
      if (configuredEndpoint && aiBackendState === "unavailable") {
        setAssistantState("checking");
        checkBackend(configuredEndpoint);
      }
    }

    function closePanel() {
      panel.classList.remove("is-open");
      launcher.setAttribute("aria-expanded", "false");
      launcher.focus({ preventScroll: true });
    }

    function localReply(text, options) {
      const result = recommendationsFor(text);
      if (options && options.degraded) setAssistantState("unavailable");
      addMessage(body, result.text, {
        links: result.links,
        small: options && options.degraded
          ? (options.hint || "AI backend unavailable — using rule-based fallback.")
          : undefined
      });
    }

    function askBackend(endpoint, text) {
      if (aiBackendState === "unavailable") {
        localReply(text, { degraded: true });
        return;
      }
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
        .then((r) => {
          if (r.ok) return r.json();
          // Try to surface a safe hint from the error body (no secrets in response).
          return r.json().then(
            function(errData) { return Promise.reject(errData); },
            function() { return Promise.reject({ error: "bad status" }); }
          );
        })
        .then((data) => {
          done = true;
          window.clearTimeout(timer);
          pending.remove();
          const reply = data && typeof data.reply === "string" ? data.reply.trim() : "";
          if (!reply) { localReply(text, { degraded: true }); return; }
          setAssistantState("connected");
          const links = Array.isArray(data.links) && data.links.length
            ? data.links
            : [["Start a project", routes.start]];
          addMessage(body, reply, {
            links: links,
            small: "Model reply returned through /api/chat."
          });
        })
        .catch((errData) => {
          done = true;
          window.clearTimeout(timer);
          pending.remove();
          // Keep fallback hints safe and specific; no secrets or message contents.
          const upstreamStatus = errData && typeof errData.upstream === "number" ? errData.upstream : 0;
          const upstreamType = errData && typeof errData.upstreamType === "string" ? errData.upstreamType : "";
          let hint;
          if (upstreamStatus === 401) hint = "AI backend unavailable — API key/auth issue.";
          else if (upstreamStatus === 402 || upstreamStatus === 429 || upstreamType === "insufficient_quota") {
            hint = "AI backend unavailable — OpenAI billing or quota issue.";
          }
          localReply(text, { degraded: true, hint: hint });
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
