(function () {
  "use strict";

  const defaults = [
    { description: "On-site service", quantity: 1, rate: 320 },
    { description: "Materials", quantity: 1, rate: 85 },
    { description: "Trip fee", quantity: 1, rate: 45 }
  ];

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
    descLabel.appendChild(desc);

    const qtyLabel = document.createElement("label");
    qtyLabel.textContent = "Qty";
    const qty = document.createElement("input");
    qty.className = "line-qty";
    qty.type = "number";
    qty.min = "0";
    qty.step = "1";
    qty.value = item.quantity;
    qtyLabel.appendChild(qty);

    const rateLabel = document.createElement("label");
    rateLabel.textContent = "Rate";
    const rate = document.createElement("input");
    rate.className = "line-rate";
    rate.type = "number";
    rate.min = "0";
    rate.step = "1";
    rate.value = item.rate;
    rateLabel.appendChild(rate);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-line";
    remove.setAttribute("aria-label", "Remove line item");
    remove.textContent = "x";

    row.append(descLabel, qtyLabel, rateLabel, remove);

    row.addEventListener("input", updateInvoice);
    remove.addEventListener("click", () => {
      row.remove();
      updateInvoice();
    });

    return row;
  }

  function getLines() {
    return Array.from(document.querySelectorAll(".line-item")).map((row) => {
      const description = row.querySelector(".line-desc").value || "Service";
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

  function updateInvoice() {
    const dateInput = document.getElementById("invoiceDate");
    const taxRate = Math.max(0, Number(document.getElementById("taxRate").value || 0));
    const discount = Math.max(0, Number(document.getElementById("discount").value || 0));
    const lines = getLines();
    const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
    const taxable = Math.max(0, subtotal - discount);
    const tax = taxable * (taxRate / 100);
    const grand = taxable + tax;

    writeText("previewFrom", document.getElementById("fromName").value || "Your Business");
    writeText("previewTo", document.getElementById("toName").value || "Customer");
    writeText("previewNumber", document.getElementById("invoiceNumber").value || "INV-0001");
    writeText("previewDate", dateInput.value ? new Date(`${dateInput.value}T00:00:00`).toLocaleDateString() : "");
    writeText("previewNotes", document.getElementById("invoiceNotes").value || "No notes added.");
    writeText("taxLabel", `Tax (${taxRate}%)`);

    const previewLines = document.getElementById("previewLines");
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
    }

    setAnimatedMoney("subtotal", subtotal);
    setDiscountMoney(discount);
    setAnimatedMoney("taxTotal", tax);
    setAnimatedMoney("grandTotal", grand);
  }

  function invoiceSummary() {
    const lines = getLines()
      .map((line) => `${line.description}: ${line.quantity} x ${money(line.rate)} = ${money(line.total)}`)
      .join("\n");
    return [
      `Invoice ${document.getElementById("invoiceNumber").value || "INV-0001"}`,
      `From: ${document.getElementById("fromName").value || "Your Business"}`,
      `Bill to: ${document.getElementById("toName").value || "Customer"}`,
      "",
      lines,
      "",
      `Total due: ${document.getElementById("grandTotal").textContent}`,
      `Notes: ${document.getElementById("invoiceNotes").value || ""}`
    ].join("\n");
  }

  async function copySummary() {
    const status = document.getElementById("copyStatus");
    const text = invoiceSummary();
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      if (status) status.textContent = "Copied invoice summary to clipboard.";
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
      if (status) status.textContent = copied ? "Copied invoice summary with fallback." : "Copy failed. Select the preview text manually.";
    }
  }

  function resetDemo() {
    document.getElementById("fromName").value = "North Star Services";
    document.getElementById("toName").value = "Sample Property Group";
    document.getElementById("invoiceNumber").value = "INV-1042";
    document.getElementById("taxRate").value = "7.25";
    document.getElementById("discount").value = "20";
    document.getElementById("invoiceNotes").value = "Payment due within 14 days. Browser-only demo.";
    const container = document.getElementById("lineItems");
    if (container) {
      container.innerHTML = "";
      defaults.forEach((item) => container.appendChild(makeLine(item)));
    }
    updateInvoice();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById("invoiceDate");
    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

    const container = document.getElementById("lineItems");
    if (container) defaults.forEach((item) => container.appendChild(makeLine(item)));

    document.querySelector(".builder-panel").addEventListener("input", updateInvoice);

    document.getElementById("addLine").addEventListener("click", () => {
      if (container) container.appendChild(makeLine({ description: "New service", quantity: 1, rate: 0 }));
      updateInvoice();
    });

    document.getElementById("copyInvoice").addEventListener("click", copySummary);
    document.getElementById("printInvoice").addEventListener("click", () => window.print());
    document.getElementById("resetInvoice").addEventListener("click", resetDemo);

    updateInvoice();
  });
})();
