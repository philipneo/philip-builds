/* Build 06 — Embedding Privacy Review.
   Runs the locked paraphrase gap probe against the real Secure RAG engine,
   entirely in the browser. No network calls. Locked 2026-07-15. */
(function () {
  "use strict";

  /* [query, [acceptable chunk ids — human-judged as answering the query]] */
  var PROBE = [
    ["how do you stop the search from leaking secrets", ["ai-lab-secure-rag--threat-model", "ai-lab-secure-rag--trust", "case-studies-secure-rag--security"]],
    ["what happens when someone asks for private data", ["case-studies-secure-rag--security", "ai-lab-secure-rag--trust", "ai-lab-secure-rag--threat-model"]],
    ["quality assurance process", ["case-studies-secure-rag--qa", "ai-lab--reviewers"]],
    ["vector database experience", ["ai-lab-secure-rag--architecture", "index--learning", "ai-lab--roadmap"]],
    ["how is the retrieval tested", ["ai-lab-retrieval-evals--why", "ai-lab--retrieval-evals", "ai-lab-secure-rag--eval"]],
    ["what ai chatbot is on this site", ["ai-lab--live-system", "portfolio--ai-assistant-title"]],
    ["serverless backend design", ["ai-lab--live-system"]],
    ["measuring search accuracy", ["ai-lab-secure-rag--eval", "ai-lab-retrieval-evals--why", "ai-lab--retrieval-evals"]],
    ["where does the content index come from", ["ai-lab--corpus-explorer", "ai-lab-secure-rag--architecture"]],
    ["provenance of search results", ["ai-lab--corpus-explorer"]],
    ["job interview talking points", ["case-studies-secure-rag--interview"]],
    ["resume bullet points", ["case-studies-secure-rag--resume"]],
    ["what certifications does philip have", ["ai-lab--lp-title"]],
    ["machine learning study plan", ["ai-lab--roadmap", "index--learning"]],
    ["future production hardening", ["case-studies-secure-rag--next", "ai-lab-secure-rag--prototype-production"]],
    ["how does the demo fail gracefully", ["ai-lab-secure-rag--trust", "ai-lab-secure-rag--scope"]],
    ["can i hire you for a website", ["portfolio--contact-title", "portfolio--services-title", "start-project--types"]],
    ["small business landing page examples", ["portfolio--biz-demos-title"]],
    ["what does the eval suite not cover", ["ai-lab-retrieval-evals--limits"]],
    ["lessons learned from building rag", ["case-studies-secure-rag--learned"]]
  ];

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function fillStats(meta) {
    var map = {
      chunks: meta && meta.chunk_count ? String(meta.chunk_count) : "?",
      pages: meta && meta.pages ? String(meta.pages.length) : "?"
    };
    Array.prototype.forEach.call(document.querySelectorAll("[data-epr-stat]"), function (node) {
      var key = node.getAttribute("data-epr-stat");
      if (map[key]) node.textContent = map[key];
    });
  }

  function run() {
    var verdict = document.getElementById("epr-verdict");
    var host = document.getElementById("epr-results");
    if (!verdict || !host) return;

    var engine = typeof globalThis !== "undefined" ? globalThis.PBS_RAG_ENGINE : null;
    var corpus = typeof globalThis !== "undefined" ? globalThis.PBS_CORPUS : null;

    if (!engine || !corpus || engine.CORPUS_ERROR) {
      verdict.textContent = "Probe unavailable: the corpus artifact or retrieval engine failed to load. This is a real failure state — nothing is simulated here.";
      verdict.className = "epr-verdict is-fail";
      return;
    }

    fillStats(engine.META || corpus.meta);

    var titleById = {};
    engine.CORPUS.forEach(function (doc) { titleById[doc.id] = doc.title; });

    var hits = 0;
    var rows = [];
    PROBE.forEach(function (pair) {
      var query = pair[0];
      var accept = pair[1];
      var out = engine.runSearch(query);
      var row = { query: query, state: out.state, rank: -1, top: "" };
      if (out.state === "ok") {
        var ids = out.results.map(function (r) { return r.doc.id; });
        row.top = titleById[ids[0]] || ids[0];
        for (var i = 0; i < ids.length; i++) {
          if (accept.indexOf(ids[i]) !== -1) { row.rank = i + 1; break; }
        }
      }
      if (row.rank !== -1) hits++;
      rows.push(row);
    });

    verdict.textContent = "Measured on this page load: " + hits + " of " + PROBE.length +
      " paraphrase queries answered by keyword retrieval (hit@5). The remaining " +
      (PROBE.length - hits) + " are the gap embeddings would have to close — and the reason this review exists.";
    verdict.className = "epr-verdict " + (hits === PROBE.length ? "is-pass" : "is-mixed");

    var wrap = el("div", "epr-table-wrap");
    wrap.setAttribute("tabindex", "0");
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-label", "Paraphrase probe results");
    var table = el("table", "epr-table");
    var thead = el("thead");
    var headRow = el("tr");
    ["Paraphrase query", "Outcome", "Engine's top result"].forEach(function (label) {
      var th = el("th", "", label);
      th.setAttribute("scope", "col");
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = el("tbody");
    rows.forEach(function (row) {
      var tr = el("tr");
      tr.appendChild(el("td", "epr-q", "“" + row.query + "”"));
      var outcome;
      if (row.state !== "ok" && row.state !== "empty") {
        outcome = el("td", "epr-miss", row.state);
      } else if (row.rank !== -1) {
        outcome = el("td", "epr-hit", "answered · rank " + row.rank);
      } else if (row.state === "empty") {
        outcome = el("td", "epr-miss", "no results at all");
      } else {
        outcome = el("td", "epr-miss", "wrong chunks only");
      }
      tr.appendChild(outcome);
      tr.appendChild(el("td", "epr-top", row.top || "—"));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    host.textContent = "";
    host.appendChild(wrap);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
