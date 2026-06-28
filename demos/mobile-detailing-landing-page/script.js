(function () {
  "use strict";

  const state = {
    packageName: "Interior Reset",
    basePrice: 149,
    addons: {
      "Pet hair reset": 35
    }
  };

  function formatMoney(value) {
    return `$${value}`;
  }

  function renderQuote() {
    const packageEl = document.getElementById("selectedPackage");
    const rowsEl = document.getElementById("addonRows");
    const totalEl = document.getElementById("detailTotal");
    if (packageEl) packageEl.textContent = state.packageName;
    if (rowsEl) {
      const rows = Object.entries(state.addons);
      rowsEl.innerHTML = rows.length
        ? rows.map(([name, price]) => `<div class="addon-row"><span>${name}</span><strong>+${formatMoney(price)}</strong></div>`).join("")
        : '<div class="addon-row"><span>No add-ons selected</span><strong>+$0</strong></div>';
    }
    const total = state.basePrice + Object.values(state.addons).reduce((sum, price) => sum + price, 0);
    if (totalEl && window.PBS && window.PBS.animateValue) {
      const previous = Number(totalEl.dataset.value || total);
      window.PBS.animateValue(totalEl, previous, total, "$", "", 0);
      totalEl.dataset.value = String(total);
    } else if (totalEl) {
      totalEl.textContent = formatMoney(total);
      totalEl.dataset.value = String(total);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-package]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-package]").forEach((item) => item.classList.remove("is-selected"));
        button.classList.add("is-selected");
        state.packageName = button.dataset.package || state.packageName;
        state.basePrice = Number(button.dataset.price || state.basePrice);
        const status = document.getElementById("detailStatus");
        if (status) status.textContent = `${state.packageName} selected. Demo quote updated.`;
        renderQuote();
      });
    });

    document.querySelectorAll("[data-addon]").forEach((button) => {
      button.addEventListener("click", () => {
        const name = button.dataset.addon || "";
        const price = Number(button.dataset.price || 0);
        if (state.addons[name]) {
          delete state.addons[name];
          button.classList.remove("is-on");
        } else {
          state.addons[name] = price;
          button.classList.add("is-on");
        }
        renderQuote();
      });
    });

    const saveButton = document.getElementById("saveDetailBtn");
    if (saveButton) {
      saveButton.addEventListener("click", () => {
        const status = document.getElementById("detailStatus");
        if (status) status.textContent = "Demo booking preview created. Nothing was sent.";
      });
    }

    const defaultPackage = document.querySelector('[data-package="Interior Reset"]');
    if (defaultPackage) defaultPackage.classList.add("is-selected");
    renderQuote();

    // ── Phone booking flow: live total ──
    const phone = document.getElementById("glossPhone");
    if (phone) {
      const phoneState = { pkgName: "Interior Reset", pkgPrice: 149, addons: { "Pet hair reset": 35 } };
      const totalEl = document.getElementById("glossPhoneTotal");
      const summaryEl = document.getElementById("glossPhoneSummary");

      const renderPhone = () => {
        const total = phoneState.pkgPrice + Object.values(phoneState.addons).reduce((sum, p) => sum + p, 0);
        if (totalEl) totalEl.textContent = `$${total} demo total`;
        if (summaryEl) {
          const names = Object.keys(phoneState.addons);
          summaryEl.textContent = names.length
            ? `${phoneState.pkgName} + ${names.join(", ")}. Confirm to preview demo booking.`
            : `${phoneState.pkgName}. Confirm to preview demo booking.`;
        }
      };

      phone.querySelectorAll("[data-gloss-pkg]").forEach((button) => {
        button.addEventListener("click", () => {
          phone.querySelectorAll("[data-gloss-pkg]").forEach((item) => item.classList.remove("is-selected"));
          button.classList.add("is-selected");
          phoneState.pkgName = button.dataset.glossPkg;
          phoneState.pkgPrice = Number(button.dataset.price || 0);
          renderPhone();
        });
      });

      phone.querySelectorAll("[data-gloss-addon]").forEach((button) => {
        button.addEventListener("click", () => {
          const name = button.dataset.glossAddon;
          const price = Number(button.dataset.price || 0);
          if (phoneState.addons[name]) {
            delete phoneState.addons[name];
            button.classList.remove("is-selected");
          } else {
            phoneState.addons[name] = price;
            button.classList.add("is-selected");
          }
          renderPhone();
        });
      });

      renderPhone();
    }

    initBuilder();
    initChecklist();
    initCondition();
    initBoard();
  });

  // ── APPOINTMENT BUILDER ──
  function initBuilder() {
    const panel = document.querySelector(".builder-layout");
    if (!panel) return;

    const timeByPackage = {
      "Quick Shine": 45,
      "Interior Reset": 90,
      "Gloss Package": 150
    };

    const b = {
      vehicle: "Sedan",
      vfee: 0,
      pkg: "Interior Reset",
      pkgPrice: 149,
      addons: {},
      slot: "Today · 2:00 PM",
      ref: "GL-" + (1000 + Math.floor(Math.random() * 8999))
    };

    const $ = (id) => document.getElementById(id);
    const refEl = $("woRef");
    if (refEl) refEl.textContent = b.ref;

    function setOn(container, el) {
      container.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-on"));
      el.classList.add("is-on");
    }

    function render() {
      $("woVehicle").textContent = b.vehicle;
      $("woPackage").textContent = b.pkg;
      $("woSlot").textContent = b.slot;
      $("woTime").textContent = (timeByPackage[b.pkg] || 90) + " min";

      const items = Object.entries(b.addons);
      const itemsEl = $("woItems");
      let html = "";
      if (b.vfee > 0) {
        html += `<div class="wo-item"><span>${b.vehicle} size surcharge</span><strong>+$${b.vfee}</strong></div>`;
      }
      html += items.length
        ? items.map(([n, p]) => `<div class="wo-item"><span>${n}</span><strong>+$${p}</strong></div>`).join("")
        : "";
      if (!html) html = '<div class="wo-item is-empty"><span>No add-ons — package only</span><strong>+$0</strong></div>';
      itemsEl.innerHTML = html;

      const addonSum = Object.values(b.addons).reduce((s, p) => s + p, 0);
      const total = b.pkgPrice + b.vfee + addonSum;
      const totalEl = $("woTotal");
      if (totalEl && window.PBS && window.PBS.animateValue) {
        const prev = Number(totalEl.dataset.value || total);
        window.PBS.animateValue(totalEl, prev, total, "$", "", 0);
        totalEl.dataset.value = String(total);
      } else if (totalEl) {
        totalEl.textContent = "$" + total;
        totalEl.dataset.value = String(total);
      }
    }

    document.getElementById("vehicleRow").querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        setOn(document.getElementById("vehicleRow"), chip);
        b.vehicle = chip.dataset.vehicle;
        b.vfee = Number(chip.dataset.vfee || 0);
        const hint = document.getElementById("vehicleHint");
        if (hint) hint.textContent = b.vfee > 0
          ? `${b.vehicle} — +$${b.vfee} size surcharge applied.`
          : `${b.vehicle} — no size surcharge.`;
        render();
      });
    });

    document.getElementById("builderPkgRow").querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        setOn(document.getElementById("builderPkgRow"), chip);
        b.pkg = chip.dataset.bpkg;
        b.pkgPrice = Number(chip.dataset.price || 0);
        render();
      });
    });

    document.getElementById("slotRow").querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        setOn(document.getElementById("slotRow"), chip);
        b.slot = chip.dataset.slot;
        render();
      });
    });

    document.getElementById("builderAddons").querySelectorAll(".badd").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.badd;
        const price = Number(btn.dataset.price || 0);
        if (b.addons[name]) {
          delete b.addons[name];
          btn.classList.remove("is-on");
        } else {
          b.addons[name] = price;
          btn.classList.add("is-on");
        }
        render();
      });
    });

    function workOrderText() {
      const addonSum = Object.values(b.addons).reduce((s, p) => s + p, 0);
      const total = b.pkgPrice + b.vfee + addonSum;
      const lines = [
        "GlossLane — Demo Work Order (not a real booking)",
        "Ref: " + b.ref,
        "Vehicle: " + b.vehicle,
        "Package: " + b.pkg + " ($" + b.pkgPrice + ")",
        "Window: " + b.slot,
        "Est. time: " + ((timeByPackage[b.pkg] || 90)) + " min"
      ];
      if (b.vfee > 0) lines.push("Size surcharge: +$" + b.vfee);
      Object.entries(b.addons).forEach(([n, p]) => lines.push("Add-on: " + n + " (+$" + p + ")"));
      lines.push("Demo total: $" + total);
      return lines.join("\n");
    }

    const copyBtn = document.getElementById("woCopyBtn");
    const statusEl = document.getElementById("woStatus");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const text = workOrderText();
        const done = () => { if (statusEl) statusEl.textContent = "Work order copied to clipboard. Demo only — nothing was sent."; };
        const fail = () => { if (statusEl) statusEl.textContent = "Copy unavailable in this view — here's the demo work order to read."; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(fail);
        } else {
          fail();
        }
      });
    }

    const printBtn = document.getElementById("woPrintBtn");
    if (printBtn) {
      printBtn.addEventListener("click", () => {
        if (statusEl) statusEl.textContent = "Opening print preview for the demo work order…";
        window.print();
      });
    }

    const resetBtn = document.getElementById("woResetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        b.vehicle = "Sedan"; b.vfee = 0; b.pkg = "Interior Reset"; b.pkgPrice = 149;
        b.addons = {}; b.slot = "Today · 2:00 PM";
        b.ref = "GL-" + (1000 + Math.floor(Math.random() * 8999));
        if (refEl) refEl.textContent = b.ref;
        document.querySelectorAll(".builder-addons .badd").forEach((x) => x.classList.remove("is-on"));
        ["vehicleRow", "builderPkgRow", "slotRow"].forEach((rid) => {
          const row = document.getElementById(rid);
          row.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-on"));
          row.querySelector(".chip").classList.add("is-on");
        });
        document.getElementById("builderPkgRow").querySelectorAll(".chip").forEach((c) => {
          if (c.dataset.bpkg === "Interior Reset") { c.classList.add("is-on"); }
          else { c.classList.remove("is-on"); }
        });
        const hint = document.getElementById("vehicleHint");
        if (hint) hint.textContent = "Sedan — no size surcharge.";
        if (statusEl) statusEl.textContent = "Builder reset to defaults. New demo ref assigned.";
        render();
      });
    }

    render();
  }

  // ── ON-SITE CHECKLIST ──
  function initChecklist() {
    const layout = document.querySelector(".checklist-layout");
    if (!layout) return;

    const items = Array.from(layout.querySelectorAll(".check-item"));
    const total = items.length;
    const ringFill = document.getElementById("ringFill");
    const ringPct = document.getElementById("ringPct");
    const ringCount = document.getElementById("ringCount");
    const statusEl = document.getElementById("checkStatus");
    const banner = document.getElementById("handoffBanner");
    const bannerText = document.getElementById("handoffText");
    const circumference = 2 * Math.PI * 52;

    if (ringFill) ringFill.style.strokeDasharray = String(circumference);

    function update() {
      const done = items.filter((i) => i.classList.contains("is-done")).length;
      const pct = Math.round((done / total) * 100);
      if (ringFill) ringFill.style.strokeDashoffset = String(circumference * (1 - done / total));
      if (ringPct) ringPct.textContent = pct + "%";
      if (ringCount) ringCount.textContent = done + " / " + total;
      if (statusEl) {
        statusEl.textContent = done === 0
          ? "Nothing checked yet — tap items as the crew works."
          : done === total
            ? "Every item done. This vehicle is ready for handoff."
            : done + " of " + total + " done — keep going.";
      }
      if (banner) {
        const ready = done === total;
        banner.classList.toggle("is-ready", ready);
        banner.classList.toggle("is-locked", !ready);
        if (bannerText) bannerText.textContent = ready
          ? "Handoff unlocked — demo vehicle ready for pickup."
          : "Handoff locked — finish every item to unlock.";
      }
    }

    items.forEach((item) => {
      item.addEventListener("click", () => {
        item.classList.toggle("is-done");
        update();
      });
    });

    layout.querySelectorAll(".ctab").forEach((tab) => {
      tab.addEventListener("click", () => {
        layout.querySelectorAll(".ctab").forEach((t) => t.classList.remove("is-on"));
        tab.classList.add("is-on");
        const group = tab.dataset.ctab;
        layout.querySelectorAll(".check-list").forEach((list) => {
          list.classList.toggle("is-hidden", list.dataset.group !== group);
        });
      });
    });

    const clearBtn = document.getElementById("checkClearBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        items.forEach((i) => i.classList.remove("is-done"));
        update();
      });
    }

    update();
  }

  // ── VEHICLE CONDITION NOTES ──
  function initCondition() {
    const panel = document.querySelector(".condition-panel");
    if (!panel) return;

    const flags = new Set();
    const note = document.getElementById("conditionNote");
    const noteCount = document.getElementById("noteCount");
    const intakeBody = document.getElementById("intakeBody");
    const intakeTime = document.getElementById("intakeTime");

    function emptyState() {
      intakeBody.innerHTML = '<p class="intake-empty">No condition flags yet. Pick flags on the left and log them to build the intake card.</p>';
      intakeTime.textContent = "Not logged yet";
    }

    panel.querySelectorAll(".flag").forEach((flag) => {
      flag.addEventListener("click", () => {
        const name = flag.dataset.flag;
        if (flags.has(name)) { flags.delete(name); flag.classList.remove("is-on"); }
        else { flags.add(name); flag.classList.add("is-on"); }
      });
    });

    if (note && noteCount) {
      note.addEventListener("input", () => { noteCount.textContent = String(note.value.length); });
    }

    const logBtn = document.getElementById("logConditionBtn");
    if (logBtn) {
      logBtn.addEventListener("click", () => {
        if (flags.size === 0 && (!note || !note.value.trim())) {
          intakeBody.innerHTML = '<p class="intake-empty">Pick at least one flag or add a note, then log it.</p>';
          intakeTime.textContent = "Nothing to log";
          return;
        }
        let html = "";
        flags.forEach((f) => { html += `<div class="intake-flag">${f}</div>`; });
        if (note && note.value.trim()) {
          html += `<p class="intake-note"><span>Crew note</span>${escapeHtml(note.value.trim())}</p>`;
        }
        intakeBody.innerHTML = html;
        const now = new Date();
        const hh = now.getHours();
        const mm = String(now.getMinutes()).padStart(2, "0");
        const ampm = hh >= 12 ? "PM" : "AM";
        const h12 = ((hh + 11) % 12) + 1;
        intakeTime.textContent = "Logged " + h12 + ":" + mm + " " + ampm;
      });
    }

    const clearBtn = document.getElementById("clearConditionBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        flags.clear();
        panel.querySelectorAll(".flag").forEach((f) => f.classList.remove("is-on"));
        if (note) note.value = "";
        if (noteCount) noteCount.textContent = "0";
        emptyState();
      });
    }
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  // ── OWNER SCHEDULE BOARD ──
  function initBoard() {
    const board = document.getElementById("scheduleBoard");
    if (!board) return;

    const stages = ["Up next", "On the road", "Done"];
    const jobs = [
      { id: 1, name: "Maya R.", time: "9:00 AM", pkg: "Interior Reset", price: 149, stage: 2 },
      { id: 2, name: "Dev P.", time: "10:30 AM", pkg: "Gloss Package", price: 249, stage: 1 },
      { id: 3, name: "Lena K.", time: "12:00 PM", pkg: "Quick Shine", price: 79, stage: 0 },
      { id: 4, name: "Omar S.", time: "1:30 PM", pkg: "Interior Reset", price: 149, stage: 0 },
      { id: 5, name: "Tess W.", time: "3:00 PM", pkg: "Gloss Package", price: 249, stage: 0 }
    ];

    const statusEl = document.getElementById("boardStatus");

    function advance(id) {
      const job = jobs.find((j) => j.id === id);
      if (!job || job.stage >= 2) return;
      job.stage += 1;
      if (statusEl) {
        statusEl.textContent = job.stage === 2
          ? `${job.name}'s ${job.pkg} marked done. Demo only.`
          : `${job.name} moved to "${stages[job.stage]}". Demo only.`;
      }
      render();
    }

    function render() {
      board.innerHTML = "";
      stages.forEach((stage, si) => {
        const col = document.createElement("div");
        col.className = "board-col";
        const inStage = jobs.filter((j) => j.stage === si);
        const head = document.createElement("div");
        head.className = "col-head";
        head.innerHTML = `<span>${stage}</span><span class="col-count">${inStage.length}</span>`;
        col.appendChild(head);

        if (inStage.length === 0) {
          const empty = document.createElement("p");
          empty.className = "col-empty";
          empty.textContent = si === 0 ? "All jobs started." : si === 1 ? "No crew on the road." : "Nothing finished yet.";
          col.appendChild(empty);
        }

        inStage.forEach((job) => {
          const card = document.createElement("div");
          card.className = "job-card" + (si === 2 ? " done" : "");
          let btn = "";
          if (si === 0) btn = `<button class="button job-btn" type="button" data-advance="${job.id}">Start job →</button>`;
          else if (si === 1) btn = `<button class="button primary job-btn" type="button" data-advance="${job.id}">Mark done ✓</button>`;
          else btn = `<span class="job-done-tag">Completed</span>`;
          card.innerHTML =
            `<div class="job-top"><span class="job-name">${job.name}</span><span class="job-time">${job.time}</span></div>` +
            `<div class="job-meta">${job.pkg} · <span class="job-price">$${job.price}</span></div>` +
            btn;
          col.appendChild(card);
        });

        board.appendChild(col);
      });

      board.querySelectorAll("[data-advance]").forEach((btn) => {
        btn.addEventListener("click", () => advance(Number(btn.dataset.advance)));
      });

      updateStats();
    }

    function updateStats() {
      const done = jobs.filter((j) => j.stage === 2);
      const active = jobs.filter((j) => j.stage === 1).length;
      const rev = done.reduce((s, j) => s + j.price, 0);
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set("statJobs", String(jobs.length));
      set("statDone", String(done.length));
      set("statActive", String(active));
      const revEl = document.getElementById("statRev");
      if (revEl && window.PBS && window.PBS.animateValue) {
        const prev = Number(revEl.dataset.value || rev);
        window.PBS.animateValue(revEl, prev, rev, "$", "", 0);
        revEl.dataset.value = String(rev);
      } else if (revEl) {
        revEl.textContent = "$" + rev;
        revEl.dataset.value = String(rev);
      }
    }

    render();
  }
})();
