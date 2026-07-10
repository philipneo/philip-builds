(function () {
  "use strict";

  var EMAIL = "philipbuildsstudio@gmail.com";
  var SUBJECT = "Project inquiry — Philip Builds Studio";

  var selectedType = "";
  var selectedDemo = "";

  function buildBody() {
    return [
      "Hi Philip,",
      "",
      "I'm interested in a website or front-end tool.",
      "",
      "Business/project name:",
      "Current website or social link:",
      "What I want built: " + (selectedType || ""),
      "Best demo match: " + (selectedDemo || ""),
      "AI/helper feature wanted (optional):",
      "Backend/model needed now or later (optional):",
      "Timeline:",
      "Budget range:",
      "Notes:",
      "",
      "Thanks.",
    ].join("\n");
  }

  function mailtoHref() {
    return (
      "mailto:" + EMAIL +
      "?subject=" + encodeURIComponent(SUBJECT) +
      "&body=" + encodeURIComponent(buildBody())
    );
  }

  function refreshLinks() {
    var href = mailtoHref();
    ["ctaTop", "ctaMain"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute("href", href);
    });
    var line = document.getElementById("selectedLine");
    if (line) {
      line.textContent = selectedType
        ? "Project type: " + selectedType + "  ·  closest demo: " + selectedDemo
        : "";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var buttons = Array.prototype.slice.call(document.querySelectorAll(".sp-type"));
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var already = btn.classList.contains("is-selected");
        buttons.forEach(function (b) {
          b.classList.remove("is-selected");
          b.setAttribute("aria-pressed", "false");
        });
        if (already) {
          selectedType = "";
          selectedDemo = "";
        } else {
          btn.classList.add("is-selected");
          btn.setAttribute("aria-pressed", "true");
          selectedType = btn.getAttribute("data-type") || "";
          selectedDemo = btn.getAttribute("data-demo") || "";
        }
        refreshLinks();
      });
    });

    // Set the full pre-filled body on the CTAs up front (no-JS fallback keeps subject only).
    refreshLinks();
  });
})();
