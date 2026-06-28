(function () {
  "use strict";

  // ── Modifier catalog ─────────────────────────────────────────
  // Each group has a title and options; first option is the default.
  const MODIFIER_GROUPS = {
    size: {
      title: "Size",
      options: [
        { label: "Regular", delta: 0 },
        { label: "Large", delta: 3 },
      ],
    },
    spice: {
      title: "Spice level",
      options: [
        { label: "Mild", delta: 0 },
        { label: "Medium", delta: 0 },
        { label: "Hot 🌶", delta: 0 },
      ],
    },
    protein: {
      title: "Protein",
      options: [
        { label: "Pork (al pastor)", delta: 0 },
        { label: "Chicken", delta: 0 },
        { label: "Carnitas", delta: 1 },
      ],
    },
    addon: {
      title: "Add-on",
      options: [
        { label: "No add-on", delta: 0 },
        { label: "Extra cheese", delta: 1 },
        { label: "Guacamole", delta: 2 },
      ],
    },
  };

  // order: key -> { name, basePrice, mods (string), unitPrice, qty }
  const order = new Map();
  let lastOrderNum = 142;
  let pickupTime = "ASAP (~20 min)";

  function money(value) {
    return "$" + value;
  }

  function totalCount() {
    let n = 0;
    order.forEach((item) => { n += item.qty; });
    return n;
  }

  function orderSum() {
    let sum = 0;
    order.forEach((item) => { sum += item.unitPrice * item.qty; });
    return sum;
  }

  // ── Render cart ───────────────────────────────────────────────
  function renderOrder(flashKey) {
    const rows = document.getElementById("orderRows");
    const count = document.getElementById("orderCount");
    const total = document.getElementById("orderTotal");
    const clearBtn = document.getElementById("clearOrder");
    const confirmBtn = document.getElementById("confirmOrder");
    const pickupBlock = document.getElementById("pickupBlock");
    const sum = orderSum();

    if (count) count.textContent = String(totalCount());

    if (rows) {
      if (order.size === 0) {
        rows.innerHTML = '<p class="cart-empty">No items yet. Add something from the menu and your demo cart builds here.</p>';
      } else {
        let html = "";
        order.forEach((item, key) => {
          const modsLine = item.mods ? `<small class="or-mods">${item.mods}</small>` : "";
          html +=
            '<div class="order-row"' + (key === flashKey ? ' data-flash="1"' : "") + ">" +
              `<span class="or-name">${item.name}${modsLine}</span>` +
              '<span class="or-qty">' +
                `<button type="button" class="or-step" data-qty-dec="${key}" aria-label="Remove one ${item.name}">−</button>` +
                `<span class="or-qty-val">${item.qty}</span>` +
                `<button type="button" class="or-step" data-qty-inc="${key}" aria-label="Add one ${item.name}">+</button>` +
              "</span>" +
              `<strong>${money(item.unitPrice * item.qty)}</strong>` +
              `<button type="button" class="or-remove" data-qty-remove="${key}" aria-label="Remove ${item.name}">✕</button>` +
            "</div>";
        });
        rows.innerHTML = html;
        const flashed = rows.querySelector('[data-flash="1"]');
        if (flashed) flashed.classList.add("row-flash");
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

    const has = order.size > 0;
    if (clearBtn) clearBtn.hidden = !has;
    if (confirmBtn) confirmBtn.disabled = !has;
    if (pickupBlock) pickupBlock.style.display = has ? "" : "none";

    updateMobileBar(sum);
  }

  function addItem(name, unitPrice, basePrice, mods) {
    const key = mods ? name + " :: " + mods : name;
    if (order.has(key)) {
      order.get(key).qty += 1;
    } else {
      order.set(key, { name, basePrice, mods: mods || "", unitPrice, qty: 1 });
    }
    renderOrder(key);
  }

  function changeQty(key, delta) {
    if (!order.has(key)) return;
    const item = order.get(key);
    item.qty += delta;
    if (item.qty <= 0) order.delete(key);
    renderOrder();
  }

  // ── Mobile cart bar ───────────────────────────────────────────
  function updateMobileBar(sum) {
    const bar = document.getElementById("mobileCartBar");
    const c = document.getElementById("mcbCount");
    const t = document.getElementById("mcbTotal");
    const n = totalCount();
    if (c) c.textContent = n + (n === 1 ? " item" : " items");
    if (t) t.textContent = money(sum);
    if (bar) {
      bar.hidden = n === 0;
      document.body.classList.toggle("cart-bar-on", n > 0);
    }
  }

  // ── Modifier sheet ────────────────────────────────────────────
  let modContext = null; // { name, basePrice, groups:[key], selections:{key:index} }

  function openModifier(name, basePrice, groupKeys) {
    const groups = groupKeys.filter((k) => MODIFIER_GROUPS[k]);
    modContext = { name, basePrice, groups, selections: {} };
    groups.forEach((k) => { modContext.selections[k] = 0; });

    document.getElementById("modTitle").textContent = name;
    const body = document.getElementById("modBody");
    let html = "";
    groups.forEach((k) => {
      const g = MODIFIER_GROUPS[k];
      html += `<div class="mod-group" data-group="${k}">`;
      html += `<p class="mod-group-title">${g.title}</p>`;
      html += '<div class="mod-options">';
      g.options.forEach((opt, i) => {
        const priceTag = opt.delta > 0 ? `<span class="mo-price">+$${opt.delta}</span>` : "";
        html += `<button type="button" class="mod-option${i === 0 ? " is-selected" : ""}" data-group="${k}" data-index="${i}"><span>${opt.label}</span>${priceTag}</button>`;
      });
      html += "</div></div>";
    });
    body.innerHTML = html;

    updateModPrice();
    const overlay = document.getElementById("modifierOverlay");
    overlay.hidden = false;
  }

  function closeModifier() {
    const overlay = document.getElementById("modifierOverlay");
    if (overlay) overlay.hidden = true;
    modContext = null;
  }

  function modUnitPrice() {
    if (!modContext) return 0;
    let price = modContext.basePrice;
    modContext.groups.forEach((k) => {
      const idx = modContext.selections[k];
      price += MODIFIER_GROUPS[k].options[idx].delta;
    });
    return price;
  }

  function modLabel() {
    if (!modContext) return "";
    const parts = [];
    modContext.groups.forEach((k) => {
      const idx = modContext.selections[k];
      const opt = MODIFIER_GROUPS[k].options[idx];
      // skip "neutral" defaults that read oddly in a cart line
      if (opt.label === "No add-on") return;
      parts.push(opt.label.replace(" 🌶", ""));
    });
    return parts.join(" · ");
  }

  function updateModPrice() {
    const el = document.getElementById("modPrice");
    if (el) el.textContent = money(modUnitPrice());
  }

  // ── Category + dietary filtering ──────────────────────────────
  let activeDiet = "all";

  function applyDietFilter() {
    const activePanel = document.querySelector("[data-menu-panel].is-active");
    let visible = 0;
    if (activePanel) {
      activePanel.querySelectorAll("article").forEach((art) => {
        const tags = (art.getAttribute("data-diet") || "").split(/\s+/);
        const show = activeDiet === "all" || tags.indexOf(activeDiet) !== -1;
        art.hidden = !show;
        if (show) visible++;
      });
    }
    const empty = document.getElementById("menuEmpty");
    if (empty) empty.hidden = visible !== 0;
  }

  // ── Kitchen queue ─────────────────────────────────────────────
  const STATES = ["New", "Firing", "Plating", "Ready"];
  let queue = [
    { num: 142, items: ["2× Tacos al Pastor", "1× Agua Fresca"], state: "Firing", age: 4, pickup: "ASAP (~20 min)" },
    { num: 141, items: ["1× Pozole Bowl", "1× Street Corn"], state: "Plating", age: 9, pickup: "6:30 PM" },
    { num: 140, items: ["1× Carnitas Plate"], state: "Ready", age: 12, pickup: "6:15 PM" },
  ];

  function renderQueue(newNum) {
    const wrap = document.getElementById("kitchenQueue");
    if (!wrap) return;
    let html = "";
    queue.forEach((t) => {
      const itemsHtml = t.items.map((i) => `<li>${i}</li>`).join("");
      const isReady = t.state === "Ready";
      const nextLabel = isReady ? "Picked up ✓" : "Bump →";
      html +=
        `<div class="kds-ticket${t.num === newNum ? " is-new" : ""}">` +
          '<div class="kds-top">' +
            `<span class="kds-num">#${t.num}</span>` +
            `<span class="kds-status" data-state="${t.state}">${t.state}</span>` +
          "</div>" +
          `<ul class="kds-items">${itemsHtml}</ul>` +
          '<div class="kds-meta">' +
            `<span>Pickup ${t.pickup}</span><span>${t.age}m ago</span>` +
          "</div>" +
          `<button type="button" class="kds-bump button" data-bump="${t.num}">${nextLabel}</button>` +
        "</div>";
    });
    wrap.innerHTML = html;
    updateKitchenStats();
  }

  function updateKitchenStats() {
    const active = queue.filter((t) => t.state !== "Ready").length;
    const ready = queue.filter((t) => t.state === "Ready").length;
    const avg = queue.length
      ? Math.round(queue.reduce((s, t) => s + t.age, 0) / queue.length)
      : 0;
    const a = document.getElementById("kdsActive");
    const r = document.getElementById("kdsReady");
    const g = document.getElementById("kdsAvg");
    if (a) a.textContent = String(active);
    if (r) r.textContent = String(ready);
    if (g) g.textContent = avg + "m";
  }

  function bumpTicket(num) {
    const t = queue.find((x) => x.num === num);
    if (!t) return;
    const idx = STATES.indexOf(t.state);
    if (t.state === "Ready") {
      queue = queue.filter((x) => x.num !== num); // picked up
    } else {
      t.state = STATES[idx + 1];
    }
    renderQueue();
  }

  function pushTicketToKitchen(num, pickup) {
    const items = [];
    order.forEach((item) => {
      const mods = item.mods ? " (" + item.mods + ")" : "";
      items.push(`${item.qty}× ${item.name}${mods}`);
    });
    queue.unshift({ num, items, state: "New", age: 0, pickup });
    if (queue.length > 6) queue.pop();
    renderQueue(num);
  }

  // ── Confirmation / receipt ────────────────────────────────────
  function buildReceiptText(num) {
    const lines = [];
    lines.push("THE KETTLE HOUSE — demo receipt");
    lines.push("Order #" + num + "   Pickup: " + pickupTime);
    lines.push("--------------------------------");
    order.forEach((item) => {
      const mods = item.mods ? "  [" + item.mods + "]" : "";
      lines.push(`${item.qty}× ${item.name}${mods}` + "  " + money(item.unitPrice * item.qty));
    });
    lines.push("--------------------------------");
    lines.push("TOTAL  " + money(orderSum()));
    lines.push("(Demo only — no payment taken.)");
    return lines.join("\n");
  }

  function showConfirmation() {
    lastOrderNum += 1;
    const num = lastOrderNum;

    document.getElementById("confirmNum").textContent = "Order #" + num;
    document.getElementById("confirmPickup").textContent = pickupTime;
    document.getElementById("confirmReceipt").textContent = buildReceiptText(num);

    // hide the live cart UI, show confirmation
    toggleCartUI(false);
    document.getElementById("orderConfirm").hidden = false;

    // drop a ticket into the kitchen, then clear the working order
    pushTicketToKitchen(num, pickupTime);

    const status = document.getElementById("orderStatus");
    if (status) status.textContent = "Demo order placed. Nothing was sent.";
  }

  function toggleCartUI(show) {
    const ids = ["orderRows", "pickupBlock", "confirmOrder", "clearOrder", "orderStatus"];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = show ? "" : "none";
    });
    const totalRow = document.querySelector(".order-total");
    if (totalRow) totalRow.style.display = show ? "" : "none";
  }

  function resetToNewOrder() {
    order.clear();
    pickupTime = "ASAP (~20 min)";
    document.querySelectorAll("[data-pickup]").forEach((b, i) => b.classList.toggle("is-active", i === 0));
    const hidden = document.getElementById("pickupTime");
    if (hidden) hidden.value = pickupTime;
    document.getElementById("orderConfirm").hidden = true;
    toggleCartUI(true);
    const status = document.getElementById("orderStatus");
    if (status) status.textContent = "Add items from the menu. No data leaves this page.";
    renderOrder();
  }

  // ── Wire up ───────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    // Category tabs
    document.querySelectorAll("[data-menu-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.menuTab;
        document.querySelectorAll("[data-menu-tab]").forEach((tab) => tab.classList.toggle("is-active", tab === button));
        document.querySelectorAll("[data-menu-panel]").forEach((panel) => {
          const active = panel.dataset.menuPanel === target;
          panel.hidden = !active;
          panel.classList.toggle("is-active", active);
        });
        applyDietFilter();
      });
    });

    // Dietary filters
    document.querySelectorAll("[data-diet]").forEach((chip) => {
      chip.addEventListener("click", () => {
        activeDiet = chip.dataset.diet;
        document.querySelectorAll("[data-diet]").forEach((c) => c.classList.toggle("is-active", c === chip));
        applyDietFilter();
      });
    });

    // Add buttons (open modifier sheet if item has modifiers)
    document.querySelectorAll("[data-add-item]").forEach((button) => {
      button.addEventListener("click", () => {
        const name = button.dataset.addItem || "Menu item";
        const price = Number(button.dataset.price || 0);
        const mods = button.dataset.modifiers;

        button.classList.remove("btn-added");
        // force reflow to restart animation
        void button.offsetWidth;
        button.classList.add("btn-added");

        if (mods) {
          openModifier(name, price, mods.split(","));
        } else {
          addItem(name, price, price, "");
          const status = document.getElementById("orderStatus");
          if (status) status.textContent = `${name} added to the demo order.`;
        }
      });
    });

    // Modifier sheet interactions
    const modBody = document.getElementById("modBody");
    if (modBody) {
      modBody.addEventListener("click", (e) => {
        const opt = e.target.closest(".mod-option");
        if (!opt || !modContext) return;
        const group = opt.dataset.group;
        const index = Number(opt.dataset.index);
        modContext.selections[group] = index;
        modBody.querySelectorAll(`.mod-option[data-group="${group}"]`).forEach((o) => {
          o.classList.toggle("is-selected", Number(o.dataset.index) === index);
        });
        updateModPrice();
      });
    }

    const modClose = document.getElementById("modClose");
    if (modClose) modClose.addEventListener("click", closeModifier);
    const overlay = document.getElementById("modifierOverlay");
    if (overlay) {
      overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModifier(); });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay && !overlay.hidden) closeModifier();
    });

    const modAdd = document.getElementById("modAdd");
    if (modAdd) {
      modAdd.addEventListener("click", () => {
        if (!modContext) return;
        const name = modContext.name;
        const unit = modUnitPrice();
        const label = modLabel();
        addItem(name, unit, modContext.basePrice, label);
        const status = document.getElementById("orderStatus");
        if (status) status.textContent = `${name} added to the demo order.`;
        closeModifier();
      });
    }

    // Cart quantity / remove (delegated)
    const rows = document.getElementById("orderRows");
    if (rows) {
      rows.addEventListener("click", (event) => {
        const inc = event.target.closest("[data-qty-inc]");
        const dec = event.target.closest("[data-qty-dec]");
        const rem = event.target.closest("[data-qty-remove]");
        if (inc) changeQty(inc.getAttribute("data-qty-inc"), 1);
        else if (dec) changeQty(dec.getAttribute("data-qty-dec"), -1);
        else if (rem) changeQty(rem.getAttribute("data-qty-remove"), -9999);
      });
    }

    // Pickup time
    document.querySelectorAll("[data-pickup]").forEach((chip) => {
      chip.addEventListener("click", () => {
        pickupTime = chip.dataset.pickup;
        document.querySelectorAll("[data-pickup]").forEach((c) => c.classList.toggle("is-active", c === chip));
        const hidden = document.getElementById("pickupTime");
        if (hidden) hidden.value = pickupTime;
      });
    });

    // Confirm
    const confirm = document.getElementById("confirmOrder");
    if (confirm) {
      confirm.addEventListener("click", () => {
        if (order.size === 0) {
          const status = document.getElementById("orderStatus");
          if (status) status.textContent = "Add an item first, then preview the order.";
          return;
        }
        showConfirmation();
      });
    }

    // Clear cart
    const clearBtn = document.getElementById("clearOrder");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        order.clear();
        renderOrder();
        const status = document.getElementById("orderStatus");
        if (status) status.textContent = "Cart cleared. Add items to start again.";
      });
    }

    // New order after confirmation
    const newOrder = document.getElementById("newOrder");
    if (newOrder) newOrder.addEventListener("click", resetToNewOrder);

    // Copy receipt
    const copyReceipt = document.getElementById("copyReceipt");
    if (copyReceipt) {
      copyReceipt.addEventListener("click", () => {
        const text = document.getElementById("confirmReceipt").textContent;
        const done = () => { copyReceipt.textContent = "Copied ✓"; setTimeout(() => { copyReceipt.textContent = "Copy receipt"; }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(done);
        } else {
          done();
        }
      });
    }

    // Kitchen queue bump
    const kq = document.getElementById("kitchenQueue");
    if (kq) {
      kq.addEventListener("click", (e) => {
        const bump = e.target.closest("[data-bump]");
        if (bump) bumpTicket(Number(bump.getAttribute("data-bump")));
      });
    }

    // Mobile bar smooth-scroll already handled by anchor + smooth scroll
    applyDietFilter();
    renderQueue();
    renderOrder();
  });
})();
