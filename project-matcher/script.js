(function () {
  "use strict";

  // ── Safe local device memory (no personal data) ───────────────
  var KEY = "pbs.lastMatch";
  function memGet() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; }
  }
  function memSet(obj) {
    try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch (e) { /* private mode / quota */ }
  }
  function memClear() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  // ── Demo registry (href is root-relative so the assistant can reuse it) ──
  var DEMOS = {
    service:    { key: "service",    label: "Service Business Demo",         href: "demos/service-business-landing-page/index.html" },
    restaurant: { key: "restaurant", label: "The Kettle House (restaurant)", href: "demos/restaurant-menu-page/index.html" },
    glosslane:  { key: "glosslane",  label: "GlossLane Mobile Detailing",    href: "demos/mobile-detailing-landing-page/index.html" },
    cleaning:   { key: "cleaning",   label: "Cleaning Quote Calculator",     href: "demos/cleaning-quote-calculator/index.html" },
    command:    { key: "command",    label: "Local Business Command Center", href: "demos/local-business-command-center/index.html" },
    invoice:    { key: "invoice",    label: "Invoice Builder",               href: "demos/invoice-builder/index.html" },
    contractor: { key: "contractor", label: "Contractor Estimate Builder",   href: "demos/contractor-estimate-builder/index.html" },
    booking:    { key: "booking",    label: "Simple Booking Request",        href: "demos/simple-booking-request/index.html" },
  };

  var BUILD_LABEL = {
    site: "a simple, mobile-first site",
    quote: "an interactive quote tool",
    booking: "a booking / intake flow",
    menu: "a menu / order flow",
    dashboard: "a dashboard / command center",
    invoice: "an invoice / client-handoff tool",
  };

  var BIZ_DEFAULT = {
    service: "service",
    restaurant: "restaurant",
    auto: "glosslane",
    cleaning: "cleaning",
    contractor: "contractor",
    operations: "command",
  };

  // A chosen build type can override the business default toward a better-fitting demo.
  var BUILD_DEMO = {
    menu: "restaurant",
    dashboard: "command",
    invoice: "invoice",
    quote: "cleaning",
    booking: "booking",
    // 'site' stays with the business default
  };

  var selections = { biz: "", goal: "", build: "" };

  function pickDemo() {
    if (selections.build && BUILD_DEMO[selections.build]) {
      // Honor strong build intent, but keep auto/contractor flavor where it makes sense.
      if (selections.build === "quote" && selections.biz === "contractor") return DEMOS.contractor;
      if (selections.build === "quote" && selections.biz === "auto") return DEMOS.glosslane;
      return DEMOS[BUILD_DEMO[selections.build]];
    }
    if (selections.biz && BIZ_DEFAULT[selections.biz]) return DEMOS[BIZ_DEFAULT[selections.biz]];
    return DEMOS.command;
  }

  function whyText(demo) {
    var goalBits = {
      inquiries: "make the next step obvious so more visitors reach out",
      pricing: "put pricing and options in front of people fast",
      choose: "let customers self-select the service they want",
      organize: "keep jobs, quotes, and the day in one place",
      invoice: "turn line items into a clean client handoff",
      mobile: "feel right on the phone your customers actually use",
    };
    var goal = goalBits[selections.goal] || "show a clear, useful customer path";
    return "Based on a " + (selections.biz || "local") + " business that wants to " + goal +
      ", " + demo.label + " is the closest concept. It's a fictional, front-end demo you can click through end to end.";
  }

  function renderResult() {
    var demo = pickDemo();
    var build = selections.build ? BUILD_LABEL[selections.build] : "a build scoped to fit";

    document.getElementById("resultDemo").textContent = demo.label;
    document.getElementById("resultWhy").textContent = whyText(demo);
    document.getElementById("resultBuild").textContent = "Suggested build: " + build + ". Next: open the demo, then start a project when it feels right.";
    document.getElementById("resultOpen").setAttribute("href", "../" + demo.href);

    // Qualitative fit label based on how complete the picture is (front-end only).
    const answered = [selections.biz, selections.goal, selections.build].filter(Boolean).length;
    const fitEl = document.getElementById("resultFit");
    if (fitEl) {
      const label = answered >= 3 ? "Strong fit" : (answered === 2 ? "Good starting point" : "Useful concept match");
      fitEl.textContent = label;
      fitEl.setAttribute("data-fit", answered >= 3 ? "strong" : (answered === 2 ? "good" : "concept"));
      fitEl.hidden = false;
    }

    var result = document.getElementById("result");
    result.hidden = false;
    var hint = document.getElementById("matchHint");
    if (hint) hint.hidden = true;

    memSet({ key: demo.key, label: demo.label, href: demo.href, build: selections.build || "" });
    renderMemory();
  }

  function renderMemory() {
    var line = document.getElementById("memoryLine");
    if (!line) return;
    var saved = memGet();
    if (saved && saved.label) {
      line.hidden = false;
      line.innerHTML = "";
      var txt = document.createElement("span");
      txt.textContent = "Remembered on this device: ";
      var a = document.createElement("a");
      a.href = "../" + saved.href;
      a.textContent = saved.label;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Forget";
      btn.addEventListener("click", function () { memClear(); renderMemory(); });
      line.appendChild(txt);
      line.appendChild(a);
      line.appendChild(document.createTextNode(" "));
      line.appendChild(btn);
    } else {
      line.hidden = true;
      line.textContent = "";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".chip[data-q]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var q = chip.getAttribute("data-q");
        var val = chip.getAttribute("data-val");
        var group = chip.parentElement;
        var already = chip.classList.contains("is-selected");
        group.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("is-selected"); });
        if (already) { selections[q] = ""; }
        else { chip.classList.add("is-selected"); selections[q] = val; }
      });
    });

    document.getElementById("matchBtn").addEventListener("click", function () {
      if (!selections.biz && !selections.build) {
        var hint = document.getElementById("matchHint");
        if (hint) { hint.hidden = false; hint.textContent = "Pick at least a business type or a build, then press “See my match.”"; }
        return;
      }
      renderResult();
    });

    document.getElementById("resetBtn").addEventListener("click", function () {
      selections = { biz: "", goal: "", build: "" };
      document.querySelectorAll(".chip.is-selected").forEach(function (c) { c.classList.remove("is-selected"); });
      var result = document.getElementById("result");
      if (result) result.hidden = true;
      var hint = document.getElementById("matchHint");
      if (hint) { hint.hidden = false; hint.textContent = "Pick at least a business type, then press “See my match.”"; }
    });

    renderMemory();
  });
})();
