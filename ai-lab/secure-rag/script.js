/* Secure RAG Portfolio Search — simulated retrieval engine.
   Everything runs locally in the browser: no network calls, no external services,
   no secrets. The corpus below is hand-curated from public pages of this site only. */
(function () {
  "use strict";

  /* ── Public-content corpus ──
     Each entry mirrors something already published on this site. Status labels:
     live = shipped and visible; prototype = simulated/labeled demo;
     learning = in-progress study; planned = roadmap item, not built. */
  var CORPUS = [
    {
      id: "assistant-live",
      title: "AI Portfolio Assistant (live site feature)",
      status: "live",
      source: "AI Lab · live system",
      href: "../index.html#live-system",
      keywords: ["assistant", "chat", "widget", "live", "proof", "feature", "ux", "portfolio", "ai"],
      summary: "A real assistant runs on this site: browser UI, a same-origin /api/chat backend, and a rule-based fallback when no backend is available. It is Philip's own build, not client work."
    },
    {
      id: "api-chat",
      title: "Same-origin /api/chat serverless backend",
      status: "live",
      source: "AI Lab · cloud layer",
      href: "../index.html#live-system",
      keywords: ["api", "chat", "serverless", "backend", "vercel", "endpoint", "route", "cloud", "deployment", "proof", "function"],
      summary: "The assistant calls a Vercel serverless function on the same origin. The browser never talks to a model provider directly, and deployment logs make the backend debuggable."
    },
    {
      id: "key-handling",
      title: "Server-side API key handling",
      status: "live",
      source: "AI Lab · security layer",
      href: "../index.html#live-system",
      keywords: ["security", "key", "keys", "environment", "variables", "env", "server", "secrets", "protected", "browser", "exposed", "safe", "handling"],
      summary: "The provider key lives in server-side environment variables on Vercel. It never appears in HTML, CSS, or JS shipped to the browser, and secret scans run before AI changes ship."
    },
    {
      id: "fallback-states",
      title: "Fallback behavior and honest backend states",
      status: "live",
      source: "AI Lab · reliability layer",
      href: "../index.html#live-system",
      keywords: ["fallback", "states", "error", "offline", "honest", "quota", "health", "check", "degrade", "reliability"],
      summary: "On static hosting or any backend failure, the assistant drops to rule-based routing instead of faking AI. The UI reports checking / reachable / unavailable states truthfully."
    },
    {
      id: "guardrails",
      title: "Prompt guardrails, route whitelist, and reply sanitizer",
      status: "live",
      source: "AI Lab · security layer",
      href: "../index.html#live-system",
      keywords: ["guardrails", "security", "whitelist", "routes", "sanitizer", "prompt", "safety", "measures", "implemented", "claims", "links"],
      summary: "Assistant links are restricted to known internal pages, prompt rules forbid invented claims, and a sanitizer strips placeholder or external URLs from replies."
    },
    {
      id: "secret-scans",
      title: "Secret scan release checks",
      status: "live",
      source: "AI Lab · release process",
      href: "../index.html#live-system",
      keywords: ["security", "secret", "scan", "release", "checklist", "qa", "measures", "process"],
      summary: "Grep-based secret scans are part of the release checklist before AI-related changes ship, alongside accessibility and Lighthouse checks."
    },
    {
      id: "cloud-deploy",
      title: "Cloud deployment: Vercel serverless + static fallback",
      status: "live",
      source: "AI Lab · cloud layer",
      href: "../index.html#live-system",
      keywords: ["cloud", "deployment", "vercel", "serverless", "github", "pages", "static", "hosting", "deploy", "proof"],
      summary: "The site deploys to Vercel for real backend mode and degrades honestly on static hosting like GitHub Pages, where the backend cannot run."
    },
    {
      id: "neo-labs",
      title: "Neo Labs — the AI/ML engineering lab page",
      status: "live",
      source: "AI Lab",
      href: "../index.html",
      keywords: ["neo", "labs", "lab", "engineering", "roadmap", "ml", "ai", "systems"],
      summary: "Neo Labs is the technical lab inside Philip Builds Studio: live assistant proof, cloud deployment practice, security-aware design, and a labeled learning roadmap."
    },
    {
      id: "demos-live",
      title: "Clickable portfolio demos for fictional local businesses",
      status: "live",
      source: "Portfolio",
      href: "../../portfolio/index.html",
      keywords: ["demos", "portfolio", "live", "clickable", "landing", "pages", "tools", "calculators", "flagship", "command", "center", "websites"],
      summary: "The portfolio is working front-end demos — landing pages, calculators, and tools for fictional local businesses. The flagship is the Local Business Command Center."
    },
    {
      id: "secure-rag-proto",
      title: "Secure RAG Portfolio Search (this page)",
      status: "prototype",
      source: "Neo Labs · lab demo",
      href: "index.html",
      keywords: ["rag", "retrieval", "search", "secure", "vector", "prototype", "index", "ranking", "simulated"],
      summary: "This page — a front-end simulation of a security-aware retrieval layer over public portfolio content. Local keyword ranking today; embeddings and a vector index are planned."
    },
    {
      id: "learning-path",
      title: "Learning path: Python, NumPy, pandas, SQL, scikit-learn, PyTorch",
      status: "learning",
      source: "AI Lab · roadmap",
      href: "../index.html#roadmap",
      keywords: ["learning", "python", "numpy", "pandas", "sql", "scikit-learn", "pytorch", "ml", "next", "studying", "path", "fundamentals"],
      summary: "In-progress study: Python for ML, NumPy, pandas, SQL and data workflows, scikit-learn, PyTorch fundamentals, model evaluation, and cloud deployment patterns."
    },
    {
      id: "mlops-planned",
      title: "Planned MLOps discipline: prompt regression tests + model evaluation",
      status: "planned",
      source: "AI Lab · roadmap",
      href: "../index.html#roadmap",
      keywords: ["mlops", "planned", "evaluation", "evals", "regression", "tests", "prompt", "monitoring", "cost", "latency", "tracking", "next", "discipline"],
      summary: "Planned engineering practice: prompt regression tests, model evaluation, cost and latency tracking, and monitoring for fallback behavior. Labeled planned — not claimed as done."
    },
    {
      id: "inference-api",
      title: "Planned: cloud ML inference API",
      status: "planned",
      source: "AI Lab · roadmap",
      href: "../index.html#roadmap",
      keywords: ["cloud", "ml", "inference", "api", "planned", "model", "deploy", "next"],
      summary: "A roadmap demo: deploying a small model behind a cloud inference API using the same server-side key discipline as /api/chat."
    },
    {
      id: "eval-dashboard",
      title: "Planned: model evaluation dashboard",
      status: "planned",
      source: "AI Lab · roadmap",
      href: "../index.html#roadmap",
      keywords: ["evaluation", "dashboard", "model", "planned", "metrics", "monitoring", "next"],
      summary: "A roadmap demo: a dashboard for model quality, fallback rates, latency, and cost — the visible face of the planned MLOps layer."
    },
    {
      id: "embeddings-plan",
      title: "Planned: real embeddings + vector index for this search",
      status: "planned",
      source: "Secure RAG · roadmap",
      href: "index.html#architecture",
      keywords: ["embeddings", "vector", "database", "index", "planned", "rag", "retrieval", "semantic", "next"],
      summary: "The real version of this page: embedded public content in a vector index with access control, an eval set, and an embedding privacy review before anything is indexed."
    },
    {
      id: "certs-targeted",
      title: "Targeted certifications (none claimed as completed)",
      status: "planned",
      source: "AI Lab · learning path",
      href: "../index.html#roadmap",
      keywords: ["certifications", "certs", "aws", "deeplearning", "google", "nvidia", "planned", "targeted", "credentials", "learning"],
      summary: "Certifications on the roadmap — DeepLearning.AI ML Specialization, AWS ML Engineer Associate, NVIDIA DLI, Google Cloud ML Engineer. All listed as planned or targeted, none claimed as done."
    },
    {
      id: "security-assistant-plan",
      title: "Planned: security-aware assistant demo",
      status: "planned",
      source: "AI Lab · roadmap",
      href: "../index.html#roadmap",
      keywords: ["security", "assistant", "planned", "demo", "aware", "privacy", "next"],
      summary: "A roadmap demo focused on assistant privacy and safety behavior: what the model is allowed to see, say, and refuse."
    }
  ];

  var CLAIM_NOTES = {
    live: { text: "Safe to claim: shipped and visible on this site.", caution: false },
    prototype: { text: "Safe to claim as a labeled prototype — simulated, not production.", caution: false },
    learning: { text: "Claim only as in-progress learning.", caution: true },
    planned: { text: "Claim only as planned — not built yet.", caution: true }
  };

  var STATUS_LABELS = { live: "Live", prototype: "Prototype", learning: "Learning", planned: "Planned" };

  var STOPWORDS = [
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "what", "whats", "which", "who", "whose", "when", "where", "why", "how",
    "do", "does", "did", "can", "could", "should", "would", "will",
    "show", "me", "my", "i", "you", "your", "we", "our", "us",
    "of", "for", "to", "in", "on", "at", "with", "and", "or", "it", "its",
    "this", "that", "these", "those", "there", "here",
    "has", "have", "had", "please", "tell", "about", "any", "some",
    "philip", "philips", "his", "he", "them", "they"
  ];

  var BROAD_TERMS = ["ai", "ml", "tech", "stuff", "things", "everything", "anything", "website", "site", "work"];

  /* Guardrail patterns. Extraction intent = sensitive noun + reveal-style verb.
     Hard blocks cover private-data asks regardless of verb. */
  var SENSITIVE_RE = /(api[\s_-]?keys?|secret\s?keys?|secrets?|passwords?|credentials?|access\s?tokens?|auth\s?tokens?|\.env\b|env\s?file|private\s?keys?)/i;
  var EXTRACTION_RE = /\b(show|reveal|print|dump|leak|expose|give|read|output|paste|display|send|share|list|get|fetch|extract|steal)\b|what('|’)?s the|what is the/i;
  var HARD_BLOCK_RE = /(private\/|private (files?|folders?|notes?|docs?|documents?)|client (emails?|lists?|data|contacts?|names?)|customer (data|lists?|emails?)|personal (data|info|information)|phone numbers?|home address|lead tracker|internal notes?|outreach (list|tracker))/i;

  function tokenize(text) {
    return String(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s\/@.-]/g, " ")
      .split(/[\s\/@.,-]+/)
      .filter(function (t) { return t.length > 1 && STOPWORDS.indexOf(t) === -1; });
  }

  /* Precomputed token sets for title/summary matching. */
  var DOC_TOKENS = CORPUS.map(function (doc) {
    return { title: tokenize(doc.title), summary: tokenize(doc.summary) };
  });

  function classifyQuery(raw) {
    var q = String(raw || "").trim();
    if (!q) return { type: "broad", reason: "Empty query." };
    if (HARD_BLOCK_RE.test(q)) {
      return { type: "blocked", reason: "This query asks for private or personal data. The index only contains public portfolio content, and private files are excluded by construction." };
    }
    var sensitive = SENSITIVE_RE.test(q);
    if (sensitive && EXTRACTION_RE.test(q)) {
      return { type: "blocked", reason: "This query looks like a secret-extraction attempt (a sensitive term plus a reveal-style verb). Refused by design — no secrets exist in this corpus, and the guardrail refuses anyway." };
    }
    var tokens = tokenize(q);
    if (tokens.length === 0) {
      return { type: "broad", reason: "The query has no searchable terms after removing filler words." };
    }
    if (tokens.length === 1 && BROAD_TERMS.indexOf(tokens[0]) !== -1) {
      return { type: "broad", reason: "“" + tokens[0] + "” matches most of the index. A more specific question ranks meaningfully." };
    }
    return {
      type: "ok",
      tokens: tokens,
      note: sensitive ? "Sensitive topic detected — answering from public security documentation only." : ""
    };
  }

  function scoreDoc(doc, docTokens, tokens) {
    var score = 0;
    var matched = [];
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      var best = 0;
      var hit = null;
      for (var k = 0; k < doc.keywords.length; k++) {
        var kw = doc.keywords[k];
        if (kw === t) {
          if (best < 3) { best = 3; hit = kw; }
        } else if (best < 1.8 && Math.min(kw.length, t.length) >= 4 && (kw.indexOf(t) === 0 || t.indexOf(kw) === 0)) {
          best = 1.8; hit = kw;
        }
      }
      if (best < 2.5 && docTokens.title.indexOf(t) !== -1) { best = 2.5; hit = t; }
      if (best === 0 && docTokens.summary.indexOf(t) !== -1) { best = 1; hit = t; }
      if (best > 0) {
        score += best;
        if (hit && matched.indexOf(hit) === -1) matched.push(hit);
      }
    }
    return { score: score, matched: matched };
  }

  function runSearch(raw, options) {
    var opts = options || {};
    var started = (typeof performance !== "undefined" && performance.now) ? performance.now() : 0;
    var verdict = classifyQuery(raw);

    if (verdict.type !== "ok") {
      return { state: verdict.type, reason: verdict.reason, results: [], tookMs: 0, note: "" };
    }
    if (opts.offline) {
      return { state: "offline", reason: "Retrieval index unavailable (simulated). Safe error state: no partial or invented answers.", results: [], tookMs: 0, note: "" };
    }

    var scored = [];
    for (var i = 0; i < CORPUS.length; i++) {
      var res = scoreDoc(CORPUS[i], DOC_TOKENS[i], verdict.tokens);
      if (res.score >= 2.4) {
        scored.push({
          doc: CORPUS[i],
          score: res.score,
          matched: res.matched,
          relevance: Math.min(0.98, res.score / (3 * verdict.tokens.length))
        });
      }
    }
    scored.sort(function (a, b) { return b.score - a.score; });
    scored = scored.slice(0, 5);

    var ended = (typeof performance !== "undefined" && performance.now) ? performance.now() : 0;
    return {
      state: scored.length ? "ok" : "empty",
      reason: scored.length ? "" : "No indexed public content matched. The corpus only covers this site's portfolio and AI Lab — it cannot answer questions outside it, and it will not guess.",
      results: scored,
      tokens: verdict.tokens,
      tookMs: Math.max(0.05, ended - started),
      note: verdict.note
    };
  }

  var engine = {
    CORPUS: CORPUS,
    tokenize: tokenize,
    classifyQuery: classifyQuery,
    scoreDoc: scoreDoc,
    runSearch: runSearch
  };

  /* Expose the pure engine for local QA. No secrets or external services. */
  if (typeof globalThis !== "undefined") {
    globalThis.PBS_RAG_ENGINE = engine;
  }

  /* CommonJS fallback for runtimes that do not treat this file as ESM. */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = engine;
  }
  if (typeof window === "undefined" || !document.getElementById("rag-input")) {
    return;
  }

  /* ── DOM layer ── */
  var form = document.querySelector(".rag-form");
  var input = document.getElementById("rag-input");
  var resultsEl = document.getElementById("rag-results");
  var pipelineEl = document.getElementById("rag-pipeline");
  var tookEl = document.getElementById("rag-took");
  var auditEl = document.getElementById("rag-audit");
  var offlineToggle = document.getElementById("rag-offline-toggle");
  var evalLatency = document.getElementById("rag-eval-latency");
  var evalQueries = document.getElementById("rag-eval-queries");
  var evalBlocks = document.getElementById("rag-eval-blocks");
  var docStat = document.querySelector('[data-rag-stat="docs"]');

  if (docStat) docStat.textContent = String(CORPUS.length);

  var REDUCED_MOTION = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var STEP_DELAY = REDUCED_MOTION ? 0 : 130;
  var pendingTimers = [];
  var sessionQueries = 0;
  var sessionBlocks = 0;
  var offline = false;

  function clearTimers() {
    while (pendingTimers.length) clearTimeout(pendingTimers.pop());
  }

  function later(fn, stepIndex) {
    if (STEP_DELAY === 0) { fn(); return; }
    pendingTimers.push(setTimeout(fn, STEP_DELAY * stepIndex));
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function setStep(name, state, label) {
    var li = pipelineEl.querySelector('[data-step="' + name + '"]');
    if (!li) return;
    li.className = state ? "is-" + state : "";
    li.querySelector(".rag-step-state").textContent = label;
  }

  function resetPipeline() {
    ["parse", "guard", "retrieve", "rank", "claims", "render"].forEach(function (s) {
      setStep(s, "", "idle");
    });
  }

  /* Route whitelist: result links may only point at known internal pages. */
  var ROUTE_WHITELIST = [
    "index.html",
    "index.html#architecture",
    "../index.html",
    "../index.html#live-system",
    "../index.html#roadmap",
    "../../portfolio/index.html",
    "../../index.html",
    "../../start-project/index.html"
  ];

  function safeHref(href) {
    return ROUTE_WHITELIST.indexOf(href) !== -1 ? href : "../index.html";
  }

  function renderStateCard(kind, kicker, title, body, extra) {
    var card = el("div", "rag-state-card" + (kind ? " " + kind : ""));
    var chip = el("span", "rag-state-kicker " + kicker, title);
    card.appendChild(chip);
    var p = el("p");
    p.appendChild(el("strong", "", body.lead + " "));
    p.appendChild(document.createTextNode(body.rest));
    card.appendChild(p);
    if (extra) card.appendChild(extra);
    return card;
  }

  function renderResults(outcome, query) {
    resultsEl.textContent = "";

    if (outcome.note) {
      resultsEl.appendChild(el("div", "rag-guard-note", "Guardrail note: " + outcome.note));
    }

    if (outcome.state === "blocked") {
      var hint = el("p", "rag-why");
      hint.appendChild(el("strong", "", "Safe to ask instead: "));
      hint.appendChild(document.createTextNode("“What security measures are implemented?” or “How are API keys protected?” — the index answers security questions from public docs; it refuses value extraction."));
      resultsEl.appendChild(renderStateCard("is-blocked", "k-blocked", "Query refused",
        { lead: "Guarded response.", rest: outcome.reason }, hint));
      return;
    }
    if (outcome.state === "broad") {
      resultsEl.appendChild(renderStateCard("is-warn", "k-warn", "Query too broad",
        { lead: "Needs a sharper question.", rest: outcome.reason + " Try one of the suggested queries above." }));
      return;
    }
    if (outcome.state === "offline") {
      var alt = el("p", "rag-why");
      alt.appendChild(el("strong", "", "Fallback path: "));
      var lab = el("a", "rag-result-link", "browse the AI Lab directly →");
      lab.href = safeHref("../index.html");
      alt.appendChild(lab);
      resultsEl.appendChild(renderStateCard("is-warn", "k-warn", "Fallback mode",
        { lead: "Index offline (simulated).", rest: outcome.reason + " A production system would alert, log, and degrade exactly this visibly." }, alt));
      return;
    }
    if (outcome.state === "empty") {
      resultsEl.appendChild(renderStateCard("", "k-info", "No results",
        { lead: "Nothing matched.", rest: outcome.reason }));
      return;
    }

    outcome.results.forEach(function (r) {
      var doc = r.doc;
      var card = el("article", "rag-result");

      var head = el("div", "rag-result-head");
      head.appendChild(el("h3", "", doc.title));
      head.appendChild(el("span", "rag-status st-" + doc.status, STATUS_LABELS[doc.status]));
      card.appendChild(head);

      card.appendChild(el("p", "rag-result-sum", doc.summary));

      var meta = el("div", "rag-result-meta");
      var pct = Math.round(r.relevance * 100);
      var scoreWrap = el("span", "rag-score", "Relevance " + pct + "%");
      var bar = el("span", "rag-score-bar");
      var fill = el("i");
      fill.style.width = pct + "%";
      bar.appendChild(fill);
      scoreWrap.appendChild(bar);
      meta.appendChild(scoreWrap);

      var claim = CLAIM_NOTES[doc.status];
      meta.appendChild(el("span", "rag-claim" + (claim.caution ? " is-caution" : ""), claim.text));
      card.appendChild(meta);

      var why = el("p", "rag-why");
      why.appendChild(el("strong", "", "Why this matched: "));
      why.appendChild(document.createTextNode(
        "keyword overlap on " + r.matched.slice(0, 4).map(function (m) { return "“" + m + "”"; }).join(", ") +
        " · source: " + doc.source + " · status label applied before render."
      ));
      card.appendChild(why);

      if (r.matched.length) {
        var kwRow = el("div", "rag-kw-row");
        r.matched.slice(0, 6).forEach(function (m) {
          kwRow.appendChild(el("span", "rag-kw", m));
        });
        card.appendChild(kwRow);
      }

      var link = el("a", "rag-result-link", "Open source page →");
      link.href = safeHref(doc.href);
      card.appendChild(link);

      resultsEl.appendChild(card);
    });
  }

  function appendAudit(query, decision, count) {
    var emptyRow = auditEl.querySelector(".rag-audit-empty");
    if (emptyRow) emptyRow.remove();

    var li = el("li");
    li.appendChild(el("span", "rag-audit-time", new Date().toLocaleTimeString()));
    var q = el("span", "rag-audit-q", "“" + query.slice(0, 80) + "”");
    li.appendChild(q);
    var cls = decision === "served" ? "d-ok" : decision === "refused" ? "d-blocked" : "d-warn";
    li.appendChild(el("span", "rag-audit-decision " + cls,
      decision + (count !== undefined ? " · " + count + " result" + (count === 1 ? "" : "s") : "")));
    auditEl.insertBefore(li, auditEl.firstChild);
    while (auditEl.children.length > 6) auditEl.removeChild(auditEl.lastChild);
  }

  function execute(rawQuery) {
    var query = String(rawQuery || "").trim();
    if (!query) { input.focus(); return; }

    clearTimers();
    resetPipeline();

    var outcome;
    try {
      outcome = runSearch(query, { offline: offline });
    } catch (err) {
      outcome = { state: "empty", reason: "Something went wrong locally. Safe error state: no partial answers.", results: [], tookMs: 0, note: "" };
    }

    sessionQueries += 1;
    evalQueries.textContent = String(sessionQueries);

    var steps;
    if (outcome.state === "blocked") {
      sessionBlocks += 1;
      evalBlocks.textContent = String(sessionBlocks);
      steps = [
        ["parse", "pass", "ok"],
        ["guard", "blocked", "refused"],
        ["retrieve", "skip", "skipped"],
        ["rank", "skip", "skipped"],
        ["claims", "skip", "skipped"],
        ["render", "pass", "guarded"]
      ];
    } else if (outcome.state === "broad") {
      steps = [
        ["parse", "warn", "too broad"],
        ["guard", "pass", "ok"],
        ["retrieve", "skip", "skipped"],
        ["rank", "skip", "skipped"],
        ["claims", "skip", "skipped"],
        ["render", "pass", "hint"]
      ];
    } else if (outcome.state === "offline") {
      steps = [
        ["parse", "pass", "ok"],
        ["guard", "pass", "ok"],
        ["retrieve", "blocked", "offline"],
        ["rank", "skip", "skipped"],
        ["claims", "skip", "skipped"],
        ["render", "pass", "fallback"]
      ];
    } else {
      steps = [
        ["parse", "pass", outcome.tokens.length + " terms"],
        ["guard", "pass", "ok"],
        ["retrieve", "pass", CORPUS.length + " docs"],
        ["rank", outcome.results.length ? "pass" : "warn", outcome.results.length + " kept"],
        ["claims", "pass", "labeled"],
        ["render", "pass", outcome.results.length ? "served" : "empty"]
      ];
    }

    steps.forEach(function (step, idx) {
      later(function () { setStep(step[0], "running", "…"); }, idx);
      later(function () { setStep(step[0], step[1], step[2]); }, idx + 1);
    });

    later(function () {
      renderResults(outcome, query);
      if (outcome.state === "ok" || outcome.state === "empty") {
        tookEl.textContent = "ranked locally in " + outcome.tookMs.toFixed(1) + " ms";
        evalLatency.textContent = outcome.tookMs.toFixed(1) + " ms";
      } else {
        tookEl.textContent = "";
      }
      var decision = outcome.state === "blocked" ? "refused"
        : outcome.state === "broad" ? "too broad"
        : outcome.state === "offline" ? "fallback"
        : "served";
      appendAudit(query, decision, outcome.state === "ok" ? outcome.results.length : outcome.state === "empty" ? 0 : undefined);
    }, steps.length + 1);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    execute(input.value);
  });

  Array.prototype.forEach.call(document.querySelectorAll(".rag-suggest"), function (btn) {
    btn.addEventListener("click", function () {
      input.value = btn.getAttribute("data-rag-query") || "";
      execute(input.value);
      input.focus();
    });
  });

  offlineToggle.addEventListener("click", function () {
    offline = !offline;
    offlineToggle.setAttribute("aria-pressed", offline ? "true" : "false");
    offlineToggle.textContent = offline ? "Index offline — click to restore" : "Simulate: index offline";
    if (offline && input.value.trim()) execute(input.value);
  });
})();
