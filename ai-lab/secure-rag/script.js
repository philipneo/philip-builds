/* Secure RAG Portfolio Search — simulated retrieval engine.
   Everything runs locally in the browser: no network calls, no external services,
   no secrets. Search content comes from the generated structured public corpus. */
(function () {
  "use strict";

  var APPROVED_PAGES = [
    "index.html",
    "ai-lab/index.html",
    "ai-lab/secure-rag/index.html",
    "ai-lab/retrieval-evals/index.html",
    "case-studies/index.html",
    "case-studies/secure-rag/index.html",
    "portfolio/index.html",
    "start-project/index.html"
  ];

  var STATUS_BY_PAGE = {
    "ai-lab/secure-rag/index.html": "prototype"
  };
  var STATUS_OVERRIDES = {
    "ai-lab--roadmap": "planned",
    "ai-lab--lp-title": "planned",
    "index--learning": "learning",
    "index--infrastructure": "planned",
    "ai-lab--ops-title": "planned"
  };
  var ALIASES = {
    "ai-lab--roadmap": ["mlops", "evals", "next"],
    "ai-lab--live-system": ["assistant", "serverless", "backend", "api", "keys", "fallback"],
    "ai-lab-secure-rag--threat-model": ["security", "risks", "mitigations"],
    "case-studies-secure-rag--security": ["guardrails", "keys", "private", "refusal"],
    "portfolio--biz-demos-title": ["demos", "websites", "live"],
    "ai-lab--corpus-explorer": ["chunks", "structured", "provenance"],
    "ai-lab--secure-rag-demo": ["documentation", "case", "study"],
    "index--learning": ["embeddings", "vector", "index"]
  };

  function preview(text, limit) {
    var value = String(text || "").replace(/\s+/g, " ").trim();
    if (value.length <= limit) return value;
    var cut = value.slice(0, limit + 1).replace(/\s+\S*$/, "");
    return cut + "…";
  }

  function validateArtifact(artifact) {
    if (!artifact || !artifact.meta || !Array.isArray(artifact.meta.pages) ||
        !Array.isArray(artifact.chunks) || artifact.chunks.length === 0) {
      return "Corpus artifact is missing or malformed.";
    }
    var pages = artifact.meta.pages.map(function (item) { return item && item.page; });
    if (pages.length !== APPROVED_PAGES.length || APPROVED_PAGES.some(function (page) { return pages.indexOf(page) === -1; })) {
      return "Corpus page boundary does not match the pinned allowlist.";
    }
    var ids = {};
    for (var i = 0; i < artifact.chunks.length; i++) {
      var chunk = artifact.chunks[i];
      if (!chunk || !chunk.id || !chunk.title || !chunk.text || chunk.text.length < 60 ||
          !chunk.content_sha1 || APPROVED_PAGES.indexOf(chunk.page) === -1 ||
          !/^[a-z0-9-]+$/.test(chunk.anchor || "") || ids[chunk.id]) {
        return "Corpus chunk contract failed at position " + i + ".";
      }
      ids[chunk.id] = true;
    }
    if (artifact.meta.chunk_count !== artifact.chunks.length || artifact.chunks.length < 30) {
      return "Corpus artifact is incomplete or truncated.";
    }
    return "";
  }

  function constructedHref(chunk) {
    if (!chunk || APPROVED_PAGES.indexOf(chunk.page) === -1 || !/^[a-z0-9-]+$/.test(chunk.anchor || "")) {
      return "";
    }
    return "../../" + chunk.page + "#" + chunk.anchor;
  }

  var ARTIFACT = typeof globalThis !== "undefined" ? globalThis.PBS_CORPUS : null;
  var CORPUS_ERROR = validateArtifact(ARTIFACT);
  var META = CORPUS_ERROR ? null : ARTIFACT.meta;
  var CORPUS = CORPUS_ERROR ? [] : ARTIFACT.chunks.map(function (chunk) {
    return {
      id: chunk.id,
      title: chunk.title,
      text: chunk.text,
      summary: preview(chunk.text, 300),
      status: STATUS_OVERRIDES[chunk.id] || STATUS_BY_PAGE[chunk.page] || "live",
      source: chunk.page_title + " · #" + chunk.anchor,
      href: constructedHref(chunk),
      keywords: (ALIASES[chunk.id] || []).slice(),
      page: chunk.page,
      anchor: chunk.anchor,
      content_sha1: chunk.content_sha1,
      chars: chunk.chars
    };
  });

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
  var SENSITIVE_RE = /(\b(api[\s_-]?keys?|secret\s?keys?|secrets?|passwords?|credentials?|access\s?tokens?|auth\s?tokens?|env\s?files?|private\s?keys?)\b|\.env\b)/i;
  var EXTRACTION_RE = /\b(show|reveal|print|dump|leak|expose|give|read|output|paste|display|send|share|list|get|fetch|extract|steal|tell|retrieve|find|access|grab|copy)\b|what('|’)?s the|what (is|are) (the|your)/i;
  var HARD_BLOCK_RE = /(private\/|private (files?|folders?|notes?|docs?|documents?)|client (emails?|lists?|data|contacts?|names?)|customer (data|lists?|emails?)|personal (data|info|information)|phone numbers?|home address|lead tracker|internal notes?|outreach (list|tracker))/i;

  function tokenize(text) {
    return String(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s\/@.-]/g, " ")
      .split(/[\s\/@.,-]+/)
      .filter(function (t) { return t.length > 1 && STOPWORDS.indexOf(t) === -1; });
  }

  /* Precomputed token sets for title, anchor, and full chunk-text matching. */
  var DOC_TOKENS = CORPUS.map(function (doc) {
    return { title: tokenize(doc.title), anchor: tokenize(doc.anchor), text: tokenize(doc.text) };
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
      if (best < 2 && docTokens.anchor.indexOf(t) !== -1) { best = 2; hit = t; }
      if (best === 0 && docTokens.text.indexOf(t) !== -1) { best = 1; hit = t; }
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
    if (CORPUS_ERROR) {
      return { state: "corpus-error", reason: "Index unavailable. The corpus artifact failed to load, so no results can be served. This is a real failure state, not the simulated offline demo — regenerate it with scripts/build_corpus.py. Unsafe queries are still refused.", results: [], tookMs: 0, note: "" };
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

  function safeHref(href) {
    var match = /^\.\.\/\.\.\/([^#]+)#([a-z0-9-]+)$/.exec(String(href || ""));
    return match && APPROVED_PAGES.indexOf(match[1]) !== -1 ? href : "../index.html";
  }

  var engine = {
    CORPUS: CORPUS,
    DOCS: CORPUS,
    META: META,
    CORPUS_ERROR: CORPUS_ERROR,
    APPROVED_PAGES: APPROVED_PAGES,
    STATUS_OVERRIDES: STATUS_OVERRIDES,
    ALIASES: ALIASES,
    tokenize: tokenize,
    classifyQuery: classifyQuery,
    scoreDoc: scoreDoc,
    runSearch: runSearch,
    safeHref: safeHref
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
  var pageStat = document.querySelector('[data-rag-stat="pages"]');
  var generatedStat = document.querySelector('[data-rag-stat="generated"]');

  if (docStat) docStat.textContent = String(CORPUS.length);
  if (pageStat) pageStat.textContent = META ? String(META.pages.length) : "—";
  if (generatedStat) generatedStat.textContent = META ? META.generated : "unavailable";

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

  function confidenceLabel(relevance) {
    if (relevance >= 0.82) return "High";
    if (relevance >= 0.56) return "Medium";
    return "Low";
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

  if (CORPUS_ERROR) {
    form.setAttribute("aria-disabled", "true");
    input.disabled = true;
    Array.prototype.forEach.call(form.querySelectorAll("button"), function (button) { button.disabled = true; });
    resultsEl.textContent = "";
    resultsEl.appendChild(renderStateCard("is-blocked", "k-blocked", "Index unavailable", {
      lead: "Index unavailable.",
      rest: "The corpus artifact failed to load, so no results can be served. This is a real failure state, not the simulated offline demo — regenerate it with scripts/build_corpus.py. Unsafe queries are still refused."
    }));
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
    if (outcome.state === "corpus-error") {
      resultsEl.appendChild(renderStateCard("is-blocked", "k-blocked", "Index unavailable",
        { lead: "Index unavailable.", rest: outcome.reason }));
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
      meta.appendChild(el("span", "rag-confidence", "Confidence: " + confidenceLabel(r.relevance)));
      meta.appendChild(el("span", "rag-source-inline", "Source boundary: whitelisted public page"));
      meta.appendChild(el("span", "rag-source-inline", "Chunk " + doc.id + " · sha1 " + doc.content_sha1));
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
      link.setAttribute("aria-label", "Open source page: " + doc.title);
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
      outcome = { state: "empty", reason: "Something went wrong locally. Safe error state: no partial answers.", results: [], tokens: [], tookMs: 0, note: "" };
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
    } else if (outcome.state === "corpus-error") {
      steps = [
        ["parse", "pass", "ok"],
        ["guard", "pass", "ok"],
        ["retrieve", "blocked", "artifact error"],
        ["rank", "skip", "skipped"],
        ["claims", "skip", "skipped"],
        ["render", "blocked", "error"]
      ];
    } else {
      steps = [
        ["parse", "pass", outcome.tokens.length + " terms"],
        ["guard", "pass", "ok"],
        ["retrieve", "pass", CORPUS.length + " chunks"],
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
        : outcome.state === "corpus-error" ? "artifact error"
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
