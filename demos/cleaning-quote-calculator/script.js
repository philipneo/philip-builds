document.addEventListener('DOMContentLoaded', () => {

  // ── Header scroll class ──
  const header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  // ── Calculator state ──
  const state = {
    bed: 1,
    bath: 1,
    extras: {},   // toggle keys → price
    addons: {},
    urgency: 0,
  };

  const BED_PRICE = 25;
  const BATH_PRICE = 25;

  const ROOM_LABELS = {
    kitchen: 'Kitchen',
    living: 'Living Room',
    office: 'Office',
    dining: 'Dining Room',
  };

  const ADDON_LABELS = {
    deep: 'Deep Clean',
    fridge: 'Inside Fridge',
    oven: 'Inside Oven',
    laundry: 'Laundry Fold',
  };

  function calcTotal() {
    let t = state.bed * BED_PRICE + state.bath * BATH_PRICE;
    Object.values(state.extras).forEach(p => t += p);
    Object.values(state.addons).forEach(p => t += p);
    t += state.urgency;
    return t;
  }

  function buildBreakdown() {
    const rows = [];
    if (state.bed) rows.push({ label: `${state.bed} Bedroom${state.bed > 1 ? 's' : ''}`, price: state.bed * BED_PRICE, addon: false });
    if (state.bath) rows.push({ label: `${state.bath} Bathroom${state.bath > 1 ? 's' : ''}`, price: state.bath * BATH_PRICE, addon: false });
    Object.entries(state.extras).forEach(([k, p]) => rows.push({ label: ROOM_LABELS[k], price: p, addon: false }));
    Object.entries(state.addons).forEach(([k, p]) => rows.push({ label: ADDON_LABELS[k], price: p, addon: true }));
    if (state.urgency) {
      const label = state.urgency === 30 ? 'Next day urgency' : 'Same day urgency';
      rows.push({ label, price: state.urgency, addon: true });
    }
    return rows;
  }

  function renderBreakdown() {
    const el = document.getElementById('calcBreakdown');
    if (!el) return;
    const rows = buildBreakdown();
    el.innerHTML = rows.map(r =>
      `<div class="rb-row${r.addon ? ' rb-addon' : ''}"><span>${r.label}</span><span>$${r.price}</span></div>`
    ).join('');
  }

  let prevTotal = calcTotal();

  function updateTotal() {
    const newTotal = calcTotal();
    const el = document.getElementById('calcTotal');
    if (el && window.PBS && window.PBS.animateValue) {
      window.PBS.animateValue(el, prevTotal, newTotal, '$', '', 0);
    } else if (el) {
      el.textContent = '$' + newTotal;
    }
    prevTotal = newTotal;
    renderBreakdown();
  }

  // ── Counter buttons (bedrooms / bathrooms) ──
  document.querySelectorAll('[data-counter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.counter;  // 'bed' or 'bath'
      const dir = parseInt(btn.dataset.dir, 10);
      const min = 0;
      const max = 8;
      state[key] = Math.min(max, Math.max(min, state[key] + dir));

      const valEl = document.getElementById(key + 'Val');
      const priceEl = document.getElementById(key + 'Price');
      if (valEl) valEl.textContent = state[key];
      if (priceEl) priceEl.textContent = '$' + (state[key] * (key === 'bed' ? BED_PRICE : BATH_PRICE));

      updateTotal();
    });
  });

  // ── Extra rooms / add-on toggles ──
  document.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.toggle;
      const price = parseInt(btn.dataset.price, 10);
      const isRoom = key in ROOM_LABELS;
      const bag = isRoom ? state.extras : state.addons;

      if (bag[key]) {
        delete bag[key];
        btn.classList.remove('is-on');
      } else {
        bag[key] = price;
        btn.classList.add('is-on');
      }
      updateTotal();
    });
  });

  // ── Urgency buttons ──
  document.querySelectorAll('[data-urgency]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-urgency]').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      state.urgency = parseInt(btn.dataset.urgency, 10);
      updateTotal();
    });
  });

  // ── Send / Reset ──
  const sendBtn = document.getElementById('calcSendBtn');
  const sentEl = document.getElementById('calcSent');
  const resetBtn = document.getElementById('calcReset');

  if (sendBtn && sentEl) {
    sendBtn.addEventListener('click', () => {
      sendBtn.classList.add('is-hidden');
      sentEl.style.display = 'block';
      sentEl.classList.add('is-hidden');
      requestAnimationFrame(() => sentEl.classList.remove('is-hidden'));
      setTimeout(() => { sendBtn.style.display = 'none'; }, 220);
    });
  }

  if (resetBtn && sendBtn && sentEl) {
    resetBtn.addEventListener('click', () => {
      sentEl.classList.add('is-hidden');
      sendBtn.style.display = 'block';
      sendBtn.classList.add('is-hidden');
      requestAnimationFrame(() => sendBtn.classList.remove('is-hidden'));
      setTimeout(() => { sentEl.style.display = 'none'; }, 220);
    });
  }

  const dashboardPreviewBtn = document.getElementById('dashboardPreviewBtn');
  const dashboardPreviewStatus = document.getElementById('dashboardPreviewStatus');
  if (dashboardPreviewBtn && dashboardPreviewStatus) {
    dashboardPreviewBtn.addEventListener('click', () => {
      dashboardPreviewStatus.textContent = 'Demo confirmation preview created. Nothing was sent.';
    });
  }

  const phoneEstimateConfirm = document.getElementById('phoneEstimateConfirm');
  if (phoneEstimateConfirm) {
    phoneEstimateConfirm.addEventListener('click', () => {
      const activeNote = phoneEstimateConfirm.closest('.pscreen')?.querySelector('.pf-est-note');
      if (activeNote) activeNote.textContent = 'Demo estimate previewed. Nothing was sent.';
    });
  }

  // ── Initial render ──
  renderBreakdown();

});
