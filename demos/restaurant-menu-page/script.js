(function () {
  "use strict";

  const order = [];

  function money(value) {
    return `$${value}`;
  }

  function renderOrder() {
    const rows = document.getElementById("orderRows");
    const count = document.getElementById("orderCount");
    const total = document.getElementById("orderTotal");
    const sum = order.reduce((running, item) => running + item.price, 0);

    if (count) count.textContent = String(order.length);
    if (rows) {
      rows.innerHTML = order.length
        ? order.map((item) => `<div class="order-row"><span>${item.name}</span><strong>${money(item.price)}</strong></div>`).join("")
        : "<p>No items yet. Add something from the menu.</p>";
    }
    if (total && window.PBS && window.PBS.animateValue) {
      const previous = Number(total.dataset.value || 0);
      window.PBS.animateValue(total, previous, sum, "$", "", 0);
      total.dataset.value = String(sum);
    } else if (total) {
      total.textContent = money(sum);
      total.dataset.value = String(sum);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-menu-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.menuTab;
        document.querySelectorAll("[data-menu-tab]").forEach((tab) => tab.classList.toggle("is-active", tab === button));
        document.querySelectorAll("[data-menu-panel]").forEach((panel) => {
          const active = panel.dataset.menuPanel === target;
          panel.hidden = !active;
          panel.classList.toggle("is-active", active);
        });
      });
    });

    document.querySelectorAll("[data-add-item]").forEach((button) => {
      button.addEventListener("click", () => {
        const name = button.dataset.addItem || "Menu item";
        const price = Number(button.dataset.price || 0);
        order.push({ name, price });
        const status = document.getElementById("orderStatus");
        if (status) status.textContent = `${name} added to the demo order.`;
        renderOrder();
      });
    });

    const confirm = document.getElementById("confirmOrder");
    if (confirm) {
      confirm.addEventListener("click", () => {
        const status = document.getElementById("orderStatus");
        if (status) {
          status.textContent = order.length
            ? "Demo order preview created. Nothing was sent."
            : "Add an item first, then preview the order.";
        }
      });
    }

    renderOrder();
  });
})();
