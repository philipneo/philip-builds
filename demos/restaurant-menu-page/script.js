(function () {
  "use strict";

  // order: { name -> { price, qty } }
  const order = new Map();

  function money(value) {
    return `$${value}`;
  }

  function totalCount() {
    let n = 0;
    order.forEach((item) => { n += item.qty; });
    return n;
  }

  function renderOrder() {
    const rows = document.getElementById("orderRows");
    const count = document.getElementById("orderCount");
    const total = document.getElementById("orderTotal");
    let sum = 0;
    order.forEach((item) => { sum += item.price * item.qty; });

    if (count) count.textContent = String(totalCount());

    if (rows) {
      if (order.size === 0) {
        rows.innerHTML = "<p>No items yet. Add something from the menu.</p>";
      } else {
        let html = "";
        order.forEach((item, name) => {
          html +=
            '<div class="order-row">' +
              `<span class="or-name">${name}</span>` +
              '<span class="or-qty">' +
                `<button type="button" class="or-step" data-qty-dec="${name}" aria-label="Remove one ${name}">−</button>` +
                `<span class="or-qty-val">${item.qty}</span>` +
                `<button type="button" class="or-step" data-qty-inc="${name}" aria-label="Add one ${name}">+</button>` +
              "</span>" +
              `<strong>${money(item.price * item.qty)}</strong>` +
            "</div>";
        });
        rows.innerHTML = html;
      }
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

  function addItem(name, price) {
    if (order.has(name)) {
      order.get(name).qty += 1;
    } else {
      order.set(name, { price, qty: 1 });
    }
    renderOrder();
  }

  function decItem(name) {
    if (!order.has(name)) return;
    const item = order.get(name);
    item.qty -= 1;
    if (item.qty <= 0) order.delete(name);
    renderOrder();
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
        addItem(name, price);
        const status = document.getElementById("orderStatus");
        if (status) status.textContent = `${name} added to the demo order.`;
      });
    });

    // Quantity controls (event delegation on the rows container)
    const rows = document.getElementById("orderRows");
    if (rows) {
      rows.addEventListener("click", (event) => {
        const inc = event.target.closest("[data-qty-inc]");
        const dec = event.target.closest("[data-qty-dec]");
        if (inc) {
          const name = inc.getAttribute("data-qty-inc");
          if (order.has(name)) { order.get(name).qty += 1; renderOrder(); }
        } else if (dec) {
          decItem(dec.getAttribute("data-qty-dec"));
        }
      });
    }

    const confirm = document.getElementById("confirmOrder");
    if (confirm) {
      confirm.addEventListener("click", () => {
        const status = document.getElementById("orderStatus");
        if (status) {
          status.textContent = order.size
            ? "Demo order preview created. Nothing was sent."
            : "Add an item first, then preview the order.";
        }
      });
    }

    renderOrder();
  });
})();
