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
  });
})();
