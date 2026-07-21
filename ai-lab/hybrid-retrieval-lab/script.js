/* Build 07 — Hybrid Retrieval Lab.
   Re-runs the locked Build 06 paraphrase probe against the live engine with
   full ranking metrics (hit@1/3/5, MRR). Entirely local; no network calls.
   Probe set locked 2026-07-15 — keep identical to the Build 06 page. */
(function () {
  "use strict";

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

  function run() {
    var board = document.getElementById("hrl-scoreboard");
    var host = document.getElementById("hrl-results");
    if (!board || !host) return;

    var engine = typeof globalThis !== "undefined" ? globalThis.PBS_RAG_ENGINE : null;
    if (!engine || engine.CORPUS_ERROR) {
      board.textContent = "Probe unavailable: the corpus artifact or retrieval engine failed to load. This is a real failure state, not a simulation.";
      board.className = "epr-verdict is-fail";
      return;
    }

    var titleById = {};
    engine.CORPUS.forEach(function (doc) { titleById[doc.id] = doc.title; });

    var hit1 = 0, hit3 = 0, hit5 = 0, rrSum = 0;
    var rows = [];
    PROBE.forEach(function (pair) {
      var out = engine.runSearch(pair[0]);
      var rank = -1;
      var top = "";
      if (out.state === "ok") {
        var ids = out.results.map(function (r) { return r.doc.id; });
        top = titleById[ids[0]] || ids[0];
        for (var i = 0; i < ids.length; i++) {
          if (pair[1].indexOf(ids[i]) !== -1) { rank = i + 1; break; }
        }
      }
      if (rank === 1) hit1++;
      if (rank >= 1 && rank <= 3) hit3++;
      if (rank >= 1 && rank <= 5) hit5++;
      rrSum += rank > 0 ? 1 / rank : 0;
      rows.push({ query: pair[0], rank: rank, top: top, state: out.state });
    });

    var n = PROBE.length;
    document.getElementById("hrl-hit1").textContent = hit1 + "/" + n;
    document.getElementById("hrl-hit3").textContent = hit3 + "/" + n;
    document.getElementById("hrl-hit5").textContent = hit5 + "/" + n;
    document.getElementById("hrl-mrr").textContent = (rrSum / n).toFixed(2);

    var wrap = el("div", "epr-table-wrap");
    wrap.setAttribute("tabindex", "0");
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-label", "Per-query probe results with ranks");
    var table = el("table", "epr-table");
    var thead = el("thead");
    var hr = el("tr");
    ["Paraphrase query", "Rank of accepted answer", "Engine's top result"].forEach(function (label) {
      var th = el("th", "", label);
      th.setAttribute("scope", "col");
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    var tbody = el("tbody");
    rows.forEach(function (row) {
      var tr = el("tr");
      tr.appendChild(el("td", "epr-q", "“" + row.query + "”"));
      if (row.rank > 0) {
        tr.appendChild(el("td", "epr-hit", "rank " + row.rank));
      } else if (row.state === "empty") {
        tr.appendChild(el("td", "epr-miss", "no results"));
      } else if (row.state !== "ok") {
        tr.appendChild(el("td", "epr-miss", row.state));
      } else {
        tr.appendChild(el("td", "epr-miss", "not in top 5"));
      }
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
