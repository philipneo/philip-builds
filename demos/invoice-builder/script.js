(function () {
  "use strict";

  const defaults = [
    { description: "On-site service", quantity: 1, rate: 320 },
    { description: "Materials", quantity: 1, rate: 85 },
    { description: "Trip fee", quantity: 1, rate: 45 }
  ];

  const STATUS_LABELS = { draft: "Draft", sent: "Sent", paid: "Paid" };
  let currentStatus = "draft";

  function money(value) {
    const safe = Number.isFinite(value) ? value : 0;
    return `$${safe.toFixed(2)}`;
  }

  function makeLine(item) {
    const row = document.createElement("div");
    row.className = "line-item";

    const descLabel = document.createElement("label");
    descLabel.textContent = "Description";
    const desc = document.createElement("input");
    desc.className = "line-desc";
    desc.type = "text";
    desc.value = item.description;
    desc.autocomplete = "off";
    descLabel.appendChild(desc);

    const qtyLabel = document.createElement("label");
    qtyLabel.textContent = "Qty";
    const qty = document.createElement("input");
    qty.className = "line-qty";
    qty.type = "number";
    qty.min = "0";
    qty.step = "1";
    qty.inputMode = "decimal";
    qty.value = item.quantity;
    qtyLabel.appendChild(qty);

    const rateLabel = document.createElement("label");
    rateLabel.textContent = "Rate";
    const rate = document.createElement("input");
    rate.className = "line-rate";
    rate.type = "number";
    rate.min = "0";
    rate.step = "1";
    rate.inputMode = "decimal";
    rate.value = item.rate;
    rateLabel.appendChild(rate);

    const amountLabel = document.createElement("label");
    amountLabel.className = "line-amount-label";
    amountLabel.textContent = "Amount";
    const amount = document.createElement("span");
    amount.className = "line-amount";
    amount.textContent = money(Number(item.quantity) * Number(item.rate));
    amountLabel.appendChild(amount);

    const controls = document.createElement("div");
    controls.className = "line-controls";

    const dup = document.createElement("button");
    dup.type = "button";
    dup.className = "line-ctrl dup-line";
    dup.setAttribute("aria-label", "Duplicate line item");
    dup.title = "Duplicate";
    dup.textContent = "Duplicate";

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "line-ctrl remove-line";
    remove.setAttribute("aria-label", "Remove line item");
    remove.title = "Remove";
    remove.textContent = "Remove";

    controls.append(dup, remove);
    row.append(descLabel, qtyLabel, rateLabel, amountLabel, controls);

    row.addEventListener("input", updateInvoice);
    dup.addEventListener("click", () => {
      const clone = makeLine({
        description: desc.value || "Service",
        quantity: qty.value || 0,
        rate: rate.value || 0
      });
      row.after(clone);
      flash(clone);
      updateInvoice();
    });
    remove.addEventListener("click", () => {
      row.classList.add("is-removing");
      window.setTimeout(() => {
        row.remove();
        updateInvoice();
      }, 160);
    });

    return row;
  }

  function flash(el) {
    el.classList.add("just-added");
    window.setTimeout(() => el.classList.remove("just-added"), 700);
  }

  function getRows() {
    return Array.from(document.querySelectorAll(".line-item:not(.is-removing)"));
  }

  function getLines() {
    return getRows().map((row) => {
      const description = row.querySelector(".line-desc").value.trim() || "Service";
      const quantity = Math.max(0, Number(row.querySelector(".line-qty").value || 0));
      const rate = Math.max(0, Number(row.querySelector(".line-rate").value || 0));
      return { description, quantity, rate, total: quantity * rate };
    });
  }

  function writeText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function setAnimatedMoney(id, nextValue) {
    const element = document.getElementById(id);
    if (!element) return;
    const previous = Number(element.dataset.value || 0);
    if (window.PBS && window.PBS.animateValue) {
      window.PBS.animateValue(element, previous, nextValue, "$", "", 2);
    } else {
      element.textContent = money(nextValue);
    }
    element.dataset.value = String(nextValue);
  }

  function setDiscountMoney(nextValue) {
    const element = document.getElementById("discountTotal");
    if (!element) return;
    const previous = Number(element.dataset.value || 0);
    if (window.PBS && window.PBS.animateValue) {
      window.PBS.animateValue(element, previous, nextValue, "-$", "", 2);
    } else {
      element.textContent = `-${money(nextValue)}`;
    }
    element.dataset.value = String(nextValue);
  }

  function applyStatusBadge(el, status) {
    if (!el) return;
    el.classList.remove("status-draft", "status-sent", "status-paid");
    el.classList.add(`status-${status}`);
    el.textContent = STATUS_LABELS[status] || "Draft";
  }

  function setStatus(status) {
    if (!STATUS_LABELS[status]) return;
    currentStatus = status;
    document.querySelectorAll(".status-chip").forEach((chip) => {
      chip.classList.toggle("is-active", chip.dataset.status === status);
      chip.setAttribute("aria-pressed", chip.dataset.status === status ? "true" : "false");
    });
    applyStatusBadge(document.getElementById("previewStatus"), status);
    applyStatusBadge(document.getElementById("phoneStatus"), status);
    const preview = document.getElementById("preview");
    if (preview) preview.classList.toggle("is-paid", status === "paid");
  }

  function updateInvoice() {
    const dateInput = document.getElementById("invoiceDate");
    const taxRate = Math.max(0, Number(document.getElementById("taxRate").value || 0));
    const rawDiscount = Math.max(0, Number(document.getElementById("discount").value || 0));
    const lines = getLines();
    const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
    const discount = Math.min(rawDiscount, subtotal);
    const taxable = Math.max(0, subtotal - discount);
    const tax = taxable * (taxRate / 100);
    const grand = taxable + tax;

    // Discount cap warning
    const warn = document.getElementById("discountWarn");
    if (warn) warn.hidden = !(rawDiscount > subtotal && subtotal > 0);

    // Per-line amounts
    getRows().forEach((row) => {
      const qty = Math.max(0, Number(row.querySelector(".line-qty").value || 0));
      const rate = Math.max(0, Number(row.querySelector(".line-rate").value || 0));
      const amt = row.querySelector(".line-amount");
      if (amt) amt.textContent = money(qty * rate);
    });

    // Line count + empty state
    const lineCount = lines.length;
    writeText("lineCount", `${lineCount} ${lineCount === 1 ? "line" : "lines"}`);
    const lineEmpty = document.getElementById("lineEmpty");
    const lineItems = document.getElementById("lineItems");
    if (lineEmpty) lineEmpty.hidden = lineCount !== 0;
    if (lineItems) lineItems.hidden = lineCount === 0;

    writeText("previewFrom", document.getElementById("fromName").value.trim() || "Your Business");
    writeText("previewTo", document.getElementById("toName").value.trim() || "Customer");
    writeText("previewNumber", document.getElementById("invoiceNumber").value.trim() || "INV-0001");
    writeText("previewDate", dateInput.value ? new Date(`${dateInput.value}T00:00:00`).toLocaleDateString() : "");
    const notes = document.getElementById("invoiceNotes").value.trim();
    writeText("previewNotes", notes || "No notes added.");
    writeText("taxLabel", taxRate ? `Tax (${taxRate}%)` : "Tax (no tax)");

    const previewLines = document.getElementById("previewLines");
    const previewEmpty = document.getElementById("previewEmpty");
    if (previewLines) {
      previewLines.innerHTML = "";
      lines.forEach((line) => {
        const row = document.createElement("div");
        row.className = "preview-row";

        const left = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = line.description;
        const detail = document.createElement("p");
        detail.textContent = `${line.quantity} x ${money(line.rate)}`;
        left.append(name, detail);

        const amount = document.createElement("strong");
        amount.textContent = money(line.total);
        row.append(left, amount);
        previewLines.appendChild(row);
      });
      previewLines.hidden = lineCount === 0;
    }
    if (previewEmpty) previewEmpty.hidden = lineCount !== 0;

    setAnimatedMoney("subtotal", subtotal);
    setDiscountMoney(discount);
    setAnimatedMoney("taxTotal", tax);
    setAnimatedMoney("grandTotal", grand);

    updatePhone(lines, grand, notes);
  }

  function updatePhone(lines, grand, notes) {
    writeText("phoneNumber", document.getElementById("invoiceNumber").value.trim() || "INV-0001");
    writeText("phoneTo", document.getElementById("toName").value.trim() || "Customer");
    writeText("phoneTotal", money(grand));
    writeText("phoneLineCount", String(lines.length));
    writeText("phoneNotes", notes || "No notes added.");

    const phoneLines = document.getElementById("phoneLines");
    if (phoneLines) {
      phoneLines.innerHTML = "";
      if (!lines.length) {
        const empty = document.createElement("p");
        empty.className = "phone-empty";
        empty.textContent = "No line items yet.";
        phoneLines.appendChild(empty);
      } else {
        lines.slice(0, 5).forEach((line) => {
          const r = document.createElement("div");
          const a = document.createElement("span");
          a.textContent = line.description;
          const b = document.createElement("strong");
          b.textContent = money(line.total);
          r.append(a, b);
          phoneLines.appendChild(r);
        });
        if (lines.length > 5) {
          const more = document.createElement("p");
          more.className = "phone-more";
          more.textContent = `+${lines.length - 5} more`;
          phoneLines.appendChild(more);
        }
      }
    }
  }

  function updateNotesCount() {
    const notes = document.getElementById("invoiceNotes");
    writeText("notesCount", String(notes ? notes.value.length : 0));
  }

  function invoiceSummary() {
    const lines = getLines()
      .map((line) => `  ${line.description}: ${line.quantity} x ${money(line.rate)} = ${money(line.total)}`)
      .join("\n");
    const num = document.getElementById("invoiceNumber").value.trim() || "INV-0001";
    const date = document.getElementById("previewDate").textContent || "";
    return [
      `INVOICE ${num}  [${STATUS_LABELS[currentStatus]}]`,
      date ? `Date: ${date}` : "",
      `From: ${document.getElementById("fromName").value.trim() || "Your Business"}`,
      `Bill to: ${document.getElementById("toName").value.trim() || "Customer"}`,
      "",
      "Line items:",
      lines || "  (none)",
      "",
      `Subtotal: ${document.getElementById("subtotal").textContent}`,
      `Discount: ${document.getElementById("discountTotal").textContent}`,
      `${document.getElementById("taxLabel").textContent}: ${document.getElementById("taxTotal").textContent}`,
      `Total due: ${document.getElementById("grandTotal").textContent}`,
      "",
      `Notes: ${document.getElementById("invoiceNotes").value.trim() || "(none)"}`,
      "",
      "Generated by a browser-only demo. Not a real invoice."
    ].filter((line) => line !== "").join("\n");
  }

  function setStatusMessage(text, ok) {
    const status = document.getElementById("copyStatus");
    if (!status) return;
    status.textContent = text;
    status.classList.toggle("is-ok", ok === true);
    status.classList.toggle("is-err", ok === false);
  }

  async function copySummary() {
    if (!getLines().length) {
      setStatusMessage("Add at least one line item before copying.", false);
      return;
    }
    const text = invoiceSummary();
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setStatusMessage("Copied invoice summary to clipboard.", true);
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      if (copied) setStatusMessage("Copied invoice summary with fallback.", true);
      else setStatusMessage("Copy failed. Select the preview text manually.", false);
    }
  }

  function printInvoice() {
    if (!getLines().length) {
      setStatusMessage("Add at least one line item before printing.", false);
      return;
    }
    window.print();
  }

  function rebuildLines(items) {
    const container = document.getElementById("lineItems");
    if (!container) return;
    container.innerHTML = "";
    items.forEach((item) => container.appendChild(makeLine(item)));
  }

  function loadSample() {
    document.getElementById("fromName").value = "North Star Services";
    document.getElementById("toName").value = "Sample Property Group";
    document.getElementById("invoiceNumber").value = "INV-1042";
    document.getElementById("taxRate").value = "7.25";
    document.getElementById("discount").value = "20";
    document.getElementById("invoiceNotes").value = "Payment due within 14 days. Browser-only demo.";
    rebuildLines(defaults);
    setStatus("draft");
    updateNotesCount();
    updateInvoice();
    setStatusMessage("Sample invoice loaded.", true);
  }

  function resetDemo() {
    document.getElementById("fromName").value = "Your Business";
    document.getElementById("toName").value = "Customer";
    document.getElementById("invoiceNumber").value = "INV-0001";
    document.getElementById("taxRate").value = "0";
    document.getElementById("discount").value = "0";
    document.getElementById("invoiceNotes").value = "";
    const dateInput = document.getElementById("invoiceDate");
    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
    rebuildLines([]);
    setStatus("draft");
    updateNotesCount();
    updateInvoice();
    setStatusMessage("Cleared to an empty invoice. Add a line to begin.", true);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById("invoiceDate");
    if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);

    rebuildLines(defaults);

    const form = document.getElementById("invoiceForm");
    if (form) form.addEventListener("input", () => {
      updateNotesCount();
      updateInvoice();
    });

    const addLine = () => {
      const container = document.getElementById("lineItems");
      if (container) {
        const row = makeLine({ description: "New service", quantity: 1, rate: 0 });
        container.appendChild(row);
        flash(row);
        const desc = row.querySelector(".line-desc");
        if (desc) desc.focus();
      }
      updateInvoice();
    };
    document.getElementById("addLine").addEventListener("click", addLine);
    const addFirst = document.getElementById("addFirstLine");
    if (addFirst) addFirst.addEventListener("click", addLine);

    document.querySelectorAll(".status-chip").forEach((chip) => {
      chip.addEventListener("click", () => setStatus(chip.dataset.status));
    });

    document.getElementById("copyInvoice").addEventListener("click", copySummary);
    document.getElementById("printInvoice").addEventListener("click", printInvoice);
    document.getElementById("resetInvoice").addEventListener("click", resetDemo);
    document.getElementById("loadSample").addEventListener("click", loadSample);

    setStatus("draft");
    updateNotesCount();
    updateInvoice();
  });
})();
