(function () {
  "use strict";

  const PRICES = {
    "Quick Visit": "$79",
    "Standard Service": "$149",
    "Full Service": "$249",
    "Not sure yet": "TBD"
  };

  const TOTAL_STEPS = 4;

  const state = {
    service: "Standard Service",
    timing: "This week",
    note: "Two-story home, north side gutters, dog in yard.",
    name: "Sample Customer",
    contact: "555-0100",
    day: "Tue Jul 7",
    slot: "8–10 AM",
    confirmed: false
  };

  function $(id) { return document.getElementById(id); }

  function priceFor(service) {
    return PRICES[service] || "TBD";
  }

  function appointmentText() {
    return `${state.day} · ${state.slot}`;
  }

  function updateSummary() {
    const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    set("requestService", state.service);
    set("requestTiming", state.timing);
    set("requestSlot", appointmentText());
    set("requestNamePreview", state.name || "—");
    set("requestNotePreview", state.note || "No note added yet.");
    set("requestPrice", priceFor(state.service));
  }

  function showStep(index) {
    const form = $("serviceQuoteForm");
    const panels = Array.from(document.querySelectorAll("[data-step-panel]"));
    const bar = $("stepBar");
    panels.forEach((panel) => {
      const active = Number(panel.dataset.stepPanel) === index;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    if (form) form.dataset.step = String(index);
    if (bar) bar.style.width = `${(index / TOTAL_STEPS) * 100}%`;
    document.querySelectorAll(".step-dot").forEach((dot) => {
      dot.classList.toggle("is-on", Number(dot.dataset.dot) <= index);
    });
  }

  function makeRef() {
    const n = Math.floor(1000 + Math.random() * 9000);
    return `DEMO-${n}`;
  }

  function bindChoiceGroup(group) {
    group.querySelectorAll(".choice").forEach((button) => {
      button.addEventListener("click", () => {
        group.querySelectorAll(".choice").forEach((item) => item.classList.remove("is-selected"));
        button.classList.add("is-selected");
        if (group.dataset.choiceGroup === "service") state.service = button.dataset.value;
        if (group.dataset.choiceGroup === "timing") state.timing = button.dataset.value;
        updateSummary();
      });
    });
  }

  function bindSingleSelect(container, attr, key) {
    if (!container) return;
    container.querySelectorAll(`[${attr}]`).forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) return;
        container.querySelectorAll(`[${attr}]`).forEach((item) => item.classList.remove("is-selected"));
        button.classList.add("is-selected");
        state[key] = button.getAttribute(attr);
        updateSummary();
      });
    });
  }

  function setColumnCount(id, container) {
    const el = $(id);
    if (el && container) el.textContent = String(container.querySelectorAll("[data-lead]").length);
  }

  function refreshDashCounts() {
    setColumnCount("dashNewCount", $("dashColNew"));
    setColumnCount("dashConfirmedCount", $("dashColConfirmed"));
    setColumnCount("dashDoneCount", $("dashColDone"));
    const newCount = $("dashColNew") ? $("dashColNew").querySelectorAll("[data-lead]").length : 0;
    const confirmed = $("dashColConfirmed") ? $("dashColConfirmed").querySelectorAll("[data-lead]").length : 0;
    if ($("dashNew")) $("dashNew").textContent = String(newCount);
    if ($("dashBooked")) $("dashBooked").textContent = String(confirmed + ($("dashColDone") ? $("dashColDone").querySelectorAll("[data-lead]").length : 0));
  }

  function wireLeadButton(btn) {
    btn.addEventListener("click", () => {
      const card = btn.closest("[data-lead]");
      if (!card) return;
      const target = btn.dataset.move;
      if (target === "Confirmed") {
        const dest = $("dashColConfirmed");
        btn.textContent = "Mark done ✓";
        btn.dataset.move = "Done";
        if (dest) dest.appendChild(card);
      } else if (target === "Done") {
        const dest = $("dashColDone");
        card.classList.add("lead-done");
        btn.remove();
        if (dest) dest.appendChild(card);
      }
      card.classList.add("lead-bump");
      setTimeout(() => card.classList.remove("lead-bump"), 320);
      refreshDashCounts();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Choice groups (service / timing)
    document.querySelectorAll("[data-choice-group]").forEach(bindChoiceGroup);

    // Day + slot selection
    bindSingleSelect($("dayGrid"), "data-day", "day");
    bindSingleSelect($("slotGrid"), "data-slot", "slot");

    // Step navigation
    document.querySelectorAll(".next-step").forEach((button) => {
      button.addEventListener("click", () => {
        const current = Number($("serviceQuoteForm").dataset.step || "1");
        showStep(Math.min(TOTAL_STEPS, current + 1));
      });
    });
    document.querySelectorAll(".prev-step").forEach((button) => {
      button.addEventListener("click", () => {
        const current = Number($("serviceQuoteForm").dataset.step || "1");
        showStep(Math.max(1, current - 1));
      });
    });

    // Text inputs
    const note = $("requestNote");
    if (note) note.addEventListener("input", () => { state.note = note.value; updateSummary(); });
    const name = $("requestName");
    if (name) name.addEventListener("input", () => { state.name = name.value; updateSummary(); });
    const contact = $("requestContact");
    if (contact) contact.addEventListener("input", () => { state.contact = contact.value; });

    const form = $("serviceQuoteForm");
    if (form) form.addEventListener("submit", (event) => event.preventDefault());

    // Confirm booking
    const confirmBtn = $("confirmBookingBtn");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        state.confirmed = true;
        const ref = makeRef();
        if ($("confirmRef")) $("confirmRef").textContent = ref;
        if ($("confirmLine")) $("confirmLine").textContent = `${state.service} · ${appointmentText()}`;
        const card = $("confirmCard");
        if (card) card.hidden = false;
        const status = $("requestStatus");
        if (status) {
          status.textContent = "Demo booking confirmed below. Nothing was sent or stored.";
          status.classList.add("is-confirmed");
        }
        const requestCard = $("requestCard");
        if (requestCard) requestCard.classList.add("is-locked");
        if (card && card.scrollIntoView) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }

    // Copy summary
    const copyBtn = $("copySummaryBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const ref = $("confirmRef") ? $("confirmRef").textContent : "DEMO";
        const lines = [
          "Example Service Co. — demo booking",
          `Ref: ${ref}`,
          `Service: ${state.service} (${priceFor(state.service)})`,
          `Timing: ${state.timing}`,
          `Appointment: ${appointmentText()}`,
          `Name: ${state.name}`,
          `Contact: ${state.contact}`,
          `Notes: ${state.note}`,
          "(Fictional demo — not a real booking.)"
        ].join("\n");
        const flash = $("copyFlash");
        const done = () => { if (flash) { flash.textContent = "Copied to clipboard"; setTimeout(() => { flash.textContent = ""; }, 2200); } };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(lines).then(done).catch(() => {
            if (flash) flash.textContent = "Copy not available in this view";
          });
        } else if (flash) {
          flash.textContent = "Copy not available in this view";
        }
      });
    }

    // Reset booking
    const resetBtn = $("resetBookingBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        state.confirmed = false;
        const card = $("confirmCard");
        if (card) card.hidden = true;
        const status = $("requestStatus");
        if (status) {
          status.textContent = "Summary updates live as you move through the flow. No data leaves this page.";
          status.classList.remove("is-confirmed");
        }
        const requestCard = $("requestCard");
        if (requestCard) requestCard.classList.remove("is-locked");
        const flash = $("copyFlash");
        if (flash) flash.textContent = "";
        showStep(1);
      });
    }

    // Dashboard kanban
    document.querySelectorAll(".lead-move").forEach(wireLeadButton);
    refreshDashCounts();

    // Phone mini-flow
    const phoneButtons = Array.from(document.querySelectorAll("[data-phone-package]"));
    const phoneLabel = $("phonePackageLabel");
    const phoneHint = $("phonePackageHint");
    let phonePackage = "Standard Service";
    let phonePrice = "149";
    phoneButtons.forEach((button) => {
      button.addEventListener("click", () => {
        phoneButtons.forEach((item) => item.classList.remove("is-selected"));
        button.classList.add("is-selected");
        phonePackage = button.dataset.phonePackage;
        phonePrice = button.dataset.phonePrice;
        if (phoneLabel) phoneLabel.textContent = `${phonePackage} from $${phonePrice}`;
        if (phoneHint) phoneHint.textContent = "Looks good — tap Book this service";
      });
    });

    const phoneBook = $("phoneBookBtn");
    const phoneStagePick = $("phoneStagePick");
    const phoneStageConfirm = $("phoneStageConfirm");
    const phoneConfirmLine = $("phoneConfirmLine");
    if (phoneBook) {
      phoneBook.addEventListener("click", () => {
        if (phoneConfirmLine) phoneConfirmLine.textContent = `${phonePackage} · $${phonePrice} · earliest window`;
        if (phoneStagePick) phoneStagePick.hidden = true;
        if (phoneStageConfirm) phoneStageConfirm.hidden = false;
      });
    }
    const phoneReset = $("phoneResetBtn");
    if (phoneReset) {
      phoneReset.addEventListener("click", () => {
        if (phoneStageConfirm) phoneStageConfirm.hidden = true;
        if (phoneStagePick) phoneStagePick.hidden = false;
        if (phoneHint) phoneHint.textContent = "Tap a package, then book a window";
      });
    }

    // Package comparison highlight
    const compareCols = Array.from(document.querySelectorAll("[data-compare-col]"));
    function highlightCol(name) {
      compareCols.forEach((c) => c.classList.toggle("is-compare-active", c.dataset.compareCol === name));
      document.querySelectorAll(".compare-cell[data-col]").forEach((cell) => {
        cell.classList.toggle("is-compare-active", cell.dataset.col === name);
      });
    }
    compareCols.forEach((col) => {
      col.addEventListener("click", () => highlightCol(col.dataset.compareCol));
    });
    highlightCol("Standard Service");

    updateSummary();
    showStep(1);
  });
})();
