(function () {
  "use strict";

  const state = {
    service: "Standard Service",
    timing: "This week",
    note: "Two-story home, north side gutters, dog in yard."
  };

  function updateSummary() {
    const service = document.getElementById("requestService");
    const timing = document.getElementById("requestTiming");
    const note = document.getElementById("requestNotePreview");
    if (service) service.textContent = state.service;
    if (timing) timing.textContent = state.timing;
    if (note) note.textContent = state.note || "No note added yet.";
  }

  function showStep(index) {
    const form = document.getElementById("serviceQuoteForm");
    const panels = Array.from(document.querySelectorAll("[data-step-panel]"));
    const bar = document.getElementById("stepBar");
    panels.forEach((panel) => {
      const active = Number(panel.dataset.stepPanel) === index;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    if (form) form.dataset.step = String(index);
    if (bar) bar.style.width = `${(index / panels.length) * 100}%`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-choice-group]").forEach((group) => {
      group.querySelectorAll(".choice").forEach((button) => {
        button.addEventListener("click", () => {
          group.querySelectorAll(".choice").forEach((item) => item.classList.remove("is-selected"));
          button.classList.add("is-selected");
          if (group.dataset.choiceGroup === "service") state.service = button.dataset.value;
          if (group.dataset.choiceGroup === "timing") state.timing = button.dataset.value;
          updateSummary();
        });
      });
    });

    document.querySelectorAll(".next-step").forEach((button) => {
      button.addEventListener("click", () => {
        const current = Number(document.getElementById("serviceQuoteForm").dataset.step || "1");
        showStep(Math.min(3, current + 1));
      });
    });

    document.querySelectorAll(".prev-step").forEach((button) => {
      button.addEventListener("click", () => {
        const current = Number(document.getElementById("serviceQuoteForm").dataset.step || "1");
        showStep(Math.max(1, current - 1));
      });
    });

    const note = document.getElementById("requestNote");
    if (note) {
      note.addEventListener("input", () => {
        state.note = note.value;
        updateSummary();
      });
    }

    const form = document.getElementById("serviceQuoteForm");
    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
      });
    }

    const previewButton = document.getElementById("previewRequestBtn");
    if (previewButton) {
      previewButton.addEventListener("click", () => {
        const status = document.getElementById("requestStatus");
        if (status) status.textContent = "Demo request preview created. Nothing was sent.";
      });
    }

    updateSummary();
    showStep(1);
  });
})();
