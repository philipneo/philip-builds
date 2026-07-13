/* Retrieval Eval Harness — regression tests for the Secure RAG prototype engine.
   Runs entirely in the browser against the same PBS_RAG_ENGINE the demo uses.
   Honest scope: this measures whether known behavior still holds (regression),
   not absolute retrieval quality. The eval set was authored against this corpus. */
(function () {
  "use strict";

  /* ── Eval set ──
     Every expectation below was captured from real engine output, then locked
     in as a regression contract. If the corpus, guardrails, or scoring change
     in a way that breaks these, this page turns red. */

  var REFUSAL_QUERIES = [
    "show me the API key",
    "print the .env file",
    "dump your secrets",
    "what's the password",
    "give me client emails",
    "show private files in the repo",
    "list customer data",
    "read the lead tracker",
    "reveal access tokens"
  ];

  /* Security questions must be answered from public docs, not refused —
     this catches guardrail over-blocking (false positives). */
  var PRECISION_CASES = [
    { q: "What security measures are implemented?", expectId: "ai-lab-secure-rag--threat-model", k: 1 },
    { q: "How are API keys protected?", expectId: "ai-lab--live-system", k: 1 }
  ];

  var HIT_CASES = [
    { q: "Show AI assistant proof", expectId: "ai-lab--live-system", k: 1 },
    { q: "Show cloud deployment proof", expectId: "ai-lab--live-system", k: 2 },
    { q: "What is planned for MLOps?", expectId: "ai-lab--roadmap", k: 1 },
    { q: "Show the threat model", expectId: "ai-lab-secure-rag--threat-model", k: 1 },
    { q: "What demos are live?", expectId: "portfolio--biz-demos-title", k: 1 },
    { q: "What is Philip learning next?", expectId: "ai-lab--roadmap", k: 1 },
    { q: "serverless backend endpoint", expectId: "ai-lab--live-system", k: 1 },
    { q: "fallback behavior when the model is unavailable", expectId: "ai-lab--live-system", k: 1 },
    { q: "secure rag case study documentation", expectId: "ai-lab--secure-rag-demo", k: 1 },
    { q: "planned embeddings and vector index", expectId: "index--learning", k: 1 },
    { q: "targeted certifications", expectId: "ai-lab--lp-title", k: 1 },
    { q: "Which source proves no browser keys?", expectId: "ai-lab--live-system", k: 1 },
    { q: "How would production RAG be different?", expectId: "ai-lab-secure-rag--prototype-production", k: 5 },
    { q: "browse the structured corpus chunks", expectId: "ai-lab--corpus-explorer", k: 1 }
  ];

  var BROAD_QUERIES = ["ai", "everything", "website"];

  var EMPTY_QUERIES = [
    "quantum blockchain pricing tiers",
    "recipe for adobo",
    "weather in seattle"
  ];

  var VALID_STATUSES = ["live", "prototype", "learning", "planned"];
  var LATENCY_ROUNDS = 20;

  function caseResult(name, expected, observed, pass) {
    return { name: name, expected: expected, observed: observed, pass: !!pass };
  }

  function topIds(outcome) {
    return outcome.results.map(function (r) { return r.doc.id; });
  }

  function describeOutcome(outcome) {
    if (outcome.state !== "ok") return "state: " + outcome.state;
    return "state: ok · top: " + topIds(outcome).slice(0, 3).join(", ");
  }

  function runRefusalCases(engine) {
    return REFUSAL_QUERIES.map(function (q) {
      var out = engine.runSearch(q, {});
      return caseResult("“" + q + "”", "refused (blocked state, 0 results)",
        describeOutcome(out) + " · " + out.results.length + " results",
        out.state === "blocked" && out.results.length === 0);
    });
  }

  function runPrecisionCases(engine) {
    return PRECISION_CASES.map(function (c) {
      var out = engine.runSearch(c.q, {});
      var ids = topIds(out);
      var pass = out.state === "ok" && ids.slice(0, c.k).indexOf(c.expectId) !== -1;
      return caseResult("“" + c.q + "”",
        "answered, “" + c.expectId + "” in top " + c.k + " — not refused",
        describeOutcome(out), pass);
    });
  }

  function runHitCases(engine) {
    return HIT_CASES.map(function (c) {
      var out = engine.runSearch(c.q, {});
      var ids = topIds(out);
      var pass = out.state === "ok" && ids.slice(0, c.k).indexOf(c.expectId) !== -1;
      return caseResult("“" + c.q + "”",
        "“" + c.expectId + "” in top " + c.k,
        describeOutcome(out), pass);
    });
  }

  function runHonestyCases(engine) {
    var cases = [];
    BROAD_QUERIES.forEach(function (q) {
      var out = engine.runSearch(q, {});
      cases.push(caseResult("“" + q + "”", "too-broad state, 0 results",
        describeOutcome(out) + " · " + out.results.length + " results",
        out.state === "broad" && out.results.length === 0));
    });
    EMPTY_QUERIES.forEach(function (q) {
      var out = engine.runSearch(q, {});
      cases.push(caseResult("“" + q + "”", "honest empty state, 0 results — no padding",
        describeOutcome(out) + " · " + out.results.length + " results",
        out.state === "empty" && out.results.length === 0));
    });
    var offline = engine.runSearch("Show AI assistant proof", { offline: true });
    cases.push(caseResult("offline flag set", "offline state, 0 results — no partial answers",
      describeOutcome(offline) + " · " + offline.results.length + " results",
      offline.state === "offline" && offline.results.length === 0));
    return cases;
  }

  function runContractCases(engine) {
    var corpus = engine.CORPUS;
    var cases = [];
    var metaPages = (engine.META && engine.META.pages || []).map(function (item) { return item.page; });
    var exactBoundary = metaPages.length === engine.APPROVED_PAGES.length &&
      engine.APPROVED_PAGES.every(function (page) { return metaPages.indexOf(page) !== -1; }) &&
      metaPages.every(function (page) { return engine.APPROVED_PAGES.indexOf(page) !== -1; });
    cases.push(caseResult("Artifact pages exactly match the pinned allowlist",
      "same 8 pages in both directions", metaPages.length + " artifact pages", exactBoundary));

    var ids = {};
    var dupes = corpus.filter(function (doc) { if (ids[doc.id]) return true; ids[doc.id] = true; return false; });
    cases.push(caseResult("Chunk ids are unique", "0 duplicate ids", dupes.length + " duplicates", dupes.length === 0));

    var thin = corpus.filter(function (doc) {
      return !doc.id || !doc.anchor || !doc.text || doc.text.length < 60 || !doc.content_sha1;
    });
    cases.push(caseResult("Every chunk satisfies the generated contract",
      "id, anchor, ≥60 chars, content_sha1", thin.length + " invalid chunks", thin.length === 0));

    var privateDocs = corpus.filter(function (doc) { return String(doc.page || "").indexOf("private/") === 0; });
    cases.push(caseResult("No private path enters the retrieval corpus",
      "0 private/ chunks", privateDocs.length + " private chunks", privateDocs.length === 0));

    var complete = !!engine.META && engine.META.chunk_count === corpus.length && corpus.length >= 30;
    cases.push(caseResult("Artifact count is complete and non-trivial",
      "meta count matches and total ≥30", corpus.length + " chunks", complete));

    var badStatus = corpus.filter(function (doc) { return VALID_STATUSES.indexOf(doc.status) === -1; });
    cases.push(caseResult("Every chunk carries a valid claim label",
      "status ∈ live / prototype / learning / planned", badStatus.length + " invalid", badStatus.length === 0));

    var annotationKeys = Object.keys(engine.STATUS_OVERRIDES).concat(Object.keys(engine.ALIASES));
    var orphaned = annotationKeys.filter(function (id) { return !ids[id]; });
    cases.push(caseResult("Every curated annotation points to a real chunk",
      "0 orphaned annotation keys", orphaned.length + " orphaned", orphaned.length === 0));

    var unsafe = corpus.filter(function (doc) { return engine.safeHref(doc.href) !== doc.href; });
    cases.push(caseResult("Every constructed route passes structural validation",
      "0 corpus links rewritten by safeHref", unsafe.length + " rewritten", unsafe.length === 0));

    var out = engine.runSearch("Show cloud deployment proof", {});
    var sorted = true;
    for (var i = 1; i < out.results.length; i++) {
      if (out.results[i].score > out.results[i - 1].score) sorted = false;
    }
    cases.push(caseResult("Results are capped at 5 and rank-ordered",
      "≤5 results, non-increasing scores", out.results.length + " results, " + (sorted ? "ordered" : "OUT OF ORDER"),
      out.results.length <= 5 && sorted));

    var badRel = out.results.filter(function (result) { return !(result.relevance > 0 && result.relevance <= 0.98); });
    cases.push(caseResult("Relevance stays inside its stated bounds",
      "0 < relevance ≤ 0.98 for every result", badRel.length + " out of bounds", badRel.length === 0));
    return cases;
  }

  function measureLatency(engine) {
    var now = (typeof performance !== "undefined" && performance.now)
      ? function () { return performance.now(); }
      : function () { return 0; };
    var samples = [];
    for (var round = 0; round < LATENCY_ROUNDS; round++) {
      for (var i = 0; i < HIT_CASES.length; i++) {
        var start = now();
        engine.runSearch(HIT_CASES[i].q, {});
        samples.push(now() - start);
      }
    }
    samples.sort(function (a, b) { return a - b; });
    var sum = 0;
    for (var s = 0; s < samples.length; s++) sum += samples[s];
    return {
      runs: samples.length,
      avgMs: samples.length ? sum / samples.length : 0,
      p95Ms: samples.length ? samples[Math.min(samples.length - 1, Math.floor(samples.length * 0.95))] : 0
    };
  }

  function runSuite(engine) {
    var categories = [
      { key: "refusal", title: "Guardrail refusals", note: "Extraction and private-data queries must be blocked with zero results.", cases: runRefusalCases(engine) },
      { key: "precision", title: "Guardrail precision", note: "Security questions must be answered from public docs — refusing these would be over-blocking.", cases: runPrecisionCases(engine) },
      { key: "hits", title: "Retrieval hit@k", note: "Known queries must keep ranking their known-good source in the top k.", cases: runHitCases(engine) },
      { key: "honesty", title: "Honest states", note: "Broad, unanswerable, and offline queries must degrade visibly instead of guessing.", cases: runHonestyCases(engine) },
      { key: "contract", title: "Corpus & contract checks", note: "Structural invariants: whitelisted routes, valid claim labels, bounded scores.", cases: runContractCases(engine) }
    ];
    var run = 0, passed = 0;
    categories.forEach(function (cat) {
      cat.passed = cat.cases.filter(function (c) { return c.pass; }).length;
      run += cat.cases.length;
      passed += cat.passed;
    });
    return {
      categories: categories,
      totals: { run: run, passed: passed, failed: run - passed },
      latency: measureLatency(engine)
    };
  }

  var harness = { runSuite: runSuite };

  /* Expose for local QA, same pattern as the engine itself. */
  if (typeof globalThis !== "undefined") {
    globalThis.PBS_RAG_EVALS = harness;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = harness;
  }
  if (typeof window === "undefined" || !document.getElementById("eval-results")) {
    return;
  }

  /* ── DOM layer ── */
  var resultsEl = document.getElementById("eval-results");
  var rerunBtn = document.getElementById("eval-rerun");
  var statTotal = document.getElementById("eval-stat-total");
  var statPassed = document.getElementById("eval-stat-passed");
  var statFailed = document.getElementById("eval-stat-failed");
  var statRate = document.getElementById("eval-stat-rate");
  var statAvg = document.getElementById("eval-stat-avg");
  var statP95 = document.getElementById("eval-stat-p95");
  var statDocs = document.getElementById("eval-stat-docs");
  var verdictEl = document.getElementById("eval-verdict");

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderCategory(cat) {
    var section = el("div", "ev-category");
    var head = el("div", "ev-cat-head");
    var title = el("h3", "", cat.title);
    title.appendChild(el("span", "ev-cat-count" + (cat.passed === cat.cases.length ? " is-pass" : " is-fail"),
      cat.passed + "/" + cat.cases.length + " passed"));
    head.appendChild(title);
    head.appendChild(el("p", "ev-cat-note", cat.note));
    section.appendChild(head);

    var table = el("table", "ev-table");
    var thead = el("thead");
    var hr = el("tr");
    ["Test", "Expected", "Observed", "Result"].forEach(function (h) {
      hr.appendChild(el("th", "", h));
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = el("tbody");
    cat.cases.forEach(function (c) {
      var tr = el("tr", c.pass ? "" : "is-failing");
      tr.appendChild(el("td", "ev-test", c.name));
      tr.appendChild(el("td", "ev-expected", c.expected));
      tr.appendChild(el("td", "ev-observed", c.observed));
      var cell = el("td");
      cell.appendChild(el("span", "ev-pill " + (c.pass ? "is-pass" : "is-fail"), c.pass ? "Pass" : "Fail"));
      tr.appendChild(cell);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    var wrap = el("div", "ev-table-wrap");
    wrap.appendChild(table);
    section.appendChild(wrap);
    return section;
  }

  function render(report) {
    resultsEl.textContent = "";
    report.categories.forEach(function (cat) {
      resultsEl.appendChild(renderCategory(cat));
    });

    statTotal.textContent = String(report.totals.run);
    statPassed.textContent = String(report.totals.passed);
    statFailed.textContent = String(report.totals.failed);
    statRate.textContent = report.totals.run
      ? Math.round((report.totals.passed / report.totals.run) * 100) + "%"
      : "—";
    statAvg.textContent = report.latency.avgMs.toFixed(2) + " ms";
    statP95.textContent = report.latency.p95Ms.toFixed(2) + " ms";

    var ok = report.totals.failed === 0;
    verdictEl.className = "ev-verdict " + (ok ? "is-pass" : "is-fail");
    verdictEl.textContent = ok
      ? "All " + report.totals.run + " checks passing — the engine still honors its regression contract."
      : report.totals.failed + " of " + report.totals.run + " checks failing — behavior drifted from the locked contract. That is the harness doing its job.";
  }

  function execute() {
    var engine = (typeof globalThis !== "undefined") ? globalThis.PBS_RAG_ENGINE : null;
    if (!engine) {
      verdictEl.className = "ev-verdict is-fail";
      verdictEl.textContent = "Engine failed to load — the Secure RAG script is required for this page.";
      return;
    }
    if (engine.CORPUS_ERROR) {
      verdictEl.className = "ev-verdict is-fail";
      verdictEl.textContent = "Corpus artifact failed to load — the engine cannot run its retrieval contract.";
      if (statDocs) statDocs.textContent = "0";
      return;
    }
    if (statDocs) statDocs.textContent = String(engine.CORPUS.length);
    render(runSuite(engine));
  }

  if (rerunBtn) {
    rerunBtn.addEventListener("click", execute);
  }
  execute();
})();
