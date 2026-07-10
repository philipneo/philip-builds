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
    size: 1,            // multiplier
    sizeLabel: 'Standard home',
    condition: 1,       // multiplier
    conditionLabel: 'Standard clean',
    freq: 1,            // multiplier (discount)
    freqLabel: 'One-time',
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

  function setPressed(button, pressed) {
    button.setAttribute('aria-pressed', String(pressed));
  }

  function selectOne(selector, selected) {
    document.querySelectorAll(selector).forEach(button => {
      const active = button === selected;
      button.classList.toggle('is-active', active);
      setPressed(button, active);
    });
  }

  document.querySelectorAll('[data-toggle]').forEach(button => setPressed(button, button.classList.contains('is-on')));
  ['[data-urgency]', '[data-size]', '[data-condition]', '[data-freq]'].forEach(selector => {
    document.querySelectorAll(selector).forEach(button => setPressed(button, button.classList.contains('is-active')));
  });

  // prep tasks tied to scope keys
  const ROOM_PREP = {
    base: { text: 'Clear floors and walkways so the crew can move freely', tag: 'All' },
    kitchen: { text: 'Empty the sink and clear countertops in the kitchen', tag: 'Kitchen' },
    living: { text: 'Pick up loose items from the living room', tag: 'Living' },
    office: { text: 'Secure documents and cables in the office', tag: 'Office' },
    dining: { text: 'Clear the dining table and chairs', tag: 'Dining' },
  };

  const ADDON_PREP = {
    deep: { text: 'Move small furniture away from baseboards for the deep clean', tag: 'Deep' },
    fridge: { text: 'Remove perishables from the fridge before the visit', tag: 'Fridge' },
    oven: { text: 'Remove racks and trays from the oven', tag: 'Oven' },
    laundry: { text: 'Set out the laundry you want folded', tag: 'Laundry' },
  };

  // ── Pricing ──
  function baseSubtotal() {
    let t = state.bed * BED_PRICE + state.bath * BATH_PRICE;
    Object.values(state.extras).forEach(p => t += p);
    Object.values(state.addons).forEach(p => t += p);
    return t;
  }

  // base rooms+addons scaled by size & condition, then urgency added flat, then frequency discount
  function calcParts() {
    const scaled = Math.round(baseSubtotal() * state.size * state.condition);
    const urgency = state.urgency;
    const preDiscount = scaled + urgency;
    const discount = Math.round(preDiscount * (1 - state.freq));
    const total = preDiscount - discount;
    return { scaled, urgency, preDiscount, discount, total };
  }

  function calcTotal() {
    return calcParts().total;
  }

  // estimated visit time in minutes -> rough heuristic
  function estVisitMinutes() {
    let mins = 45; // base
    mins += state.bed * 18;
    mins += state.bath * 22;
    mins += Object.keys(state.extras).length * 15;
    mins += Object.keys(state.addons).length * 20;
    mins *= state.size;
    mins *= state.condition;
    return Math.round(mins);
  }

  function formatTime(mins) {
    const h = Math.floor(mins / 60);
    const m = Math.round((mins % 60) / 15) * 15;
    if (h <= 0) return `~${Math.max(30, m)} min`;
    if (m === 0) return `~${h} hr`;
    if (m === 60) return `~${h + 1} hr`;
    return `~${h} hr ${m} min`;
  }

  function buildBreakdown() {
    const rows = [];
    if (state.bed) rows.push({ label: `${state.bed} Bedroom${state.bed > 1 ? 's' : ''}`, price: state.bed * BED_PRICE, addon: false });
    if (state.bath) rows.push({ label: `${state.bath} Bathroom${state.bath > 1 ? 's' : ''}`, price: state.bath * BATH_PRICE, addon: false });
    Object.entries(state.extras).forEach(([k, p]) => rows.push({ label: ROOM_LABELS[k], price: p, addon: false }));
    Object.entries(state.addons).forEach(([k, p]) => rows.push({ label: ADDON_LABELS[k], price: p, addon: true }));
    return rows;
  }

  // ── Render: main breakdown ──
  function renderBreakdown() {
    const el = document.getElementById('calcBreakdown');
    if (!el) return;
    const rows = buildBreakdown();
    const parts = calcParts();
    let html = rows.map(r =>
      `<div class="rb-row${r.addon ? ' rb-addon' : ''}"><span>${r.label}</span><span>$${r.price}</span></div>`
    ).join('');

    // adjustment lines
    if (state.size !== 1) {
      html += `<div class="rb-row"><span>${state.sizeLabel} size (×${state.size})</span><span></span></div>`;
    }
    if (state.condition !== 1) {
      html += `<div class="rb-row"><span>${state.conditionLabel} (×${state.condition})</span><span></span></div>`;
    }
    if (parts.urgency) {
      const label = state.urgency === 30 ? 'Next day urgency' : 'Same day urgency';
      html += `<div class="rb-row rb-addon"><span>${label}</span><span>+$${parts.urgency}</span></div>`;
    }
    if (parts.discount) {
      html += `<div class="rb-row rb-discount"><span>${state.freqLabel} discount</span><span>−$${parts.discount}</span></div>`;
    }
    el.innerHTML = html;
  }

  // ── Render: result meta + range + est time ──
  function renderMeta() {
    const meta = document.getElementById('calcMeta');
    if (meta) meta.textContent = `${state.sizeLabel} · ${state.conditionLabel} · ${state.freqLabel}`;

    const total = calcTotal();
    const range = document.getElementById('calcRange');
    if (range) {
      const lo = Math.round(total * 0.94);
      const hi = Math.round(total * 1.06);
      range.textContent = total > 0 ? `Typical range: $${lo}–$${hi}` : 'Select rooms to see a range';
    }

    const t = document.getElementById('calcEstTime');
    if (t) t.textContent = `Est. visit time: ${formatTime(estVisitMinutes())}`;
  }

  // ── Render: live mobile preview ──
  function renderMobilePreview() {
    const scopeEl = document.getElementById('cmpScope');
    const rowsEl = document.getElementById('cmpRows');
    const totalEl = document.getElementById('cmpTotal');
    if (scopeEl) scopeEl.textContent = `${state.sizeLabel} · ${state.conditionLabel}`;

    if (rowsEl) {
      const rows = buildBreakdown();
      const parts = calcParts();
      if (rows.length === 0) {
        rowsEl.innerHTML = '<div class="cmp-empty">No rooms selected yet</div>';
      } else {
        let html = rows.map(r =>
          `<div class="cmp-row${r.addon ? ' cmp-addon' : ''}"><span>${r.label}</span><span>$${r.price}</span></div>`
        ).join('');
        if (parts.urgency) {
          const label = state.urgency === 30 ? 'Next day' : 'Same day';
          html += `<div class="cmp-row cmp-addon"><span>${label}</span><span>+$${parts.urgency}</span></div>`;
        }
        if (parts.discount) {
          html += `<div class="cmp-row cmp-discount"><span>${state.freqLabel}</span><span>−$${parts.discount}</span></div>`;
        }
        rowsEl.innerHTML = html;
      }
    }

    if (totalEl) totalEl.textContent = '$' + calcTotal();
  }

  // ── Render: owner dashboard (live) ──
  let prevOwnerTotal = calcTotal();
  function renderOwnerDashboard() {
    const parts = calcParts();
    const roomsPrice = Math.round((state.bed * BED_PRICE + state.bath * BATH_PRICE + Object.values(state.extras).reduce((a, b) => a + b, 0)) * state.size * state.condition);
    const addonsPrice = Math.round(Object.values(state.addons).reduce((a, b) => a + b, 0) * state.size * state.condition);

    const headline = document.getElementById('ownerHeadline');
    if (headline) {
      headline.textContent = `${state.bed} bed / ${state.bath} bath ${state.conditionLabel.toLowerCase()}`;
    }
    const setText = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
    setText('ownerRooms', '$' + roomsPrice);
    setText('ownerAddons', '$' + addonsPrice);
    setText('ownerTiming', '$' + parts.urgency);
    setText('ownerAdjust', `×${(state.size * state.condition).toFixed(2)}${state.freq !== 1 ? ` · ${state.freqLabel}` : ''}`);
    setText('ownerTotal', '$' + parts.total);
    setText('ownerTime', formatTime(estVisitMinutes()));

    const status = document.getElementById('ownerStatus');
    if (status) {
      status.textContent = parts.total === 0 ? 'Awaiting selection' :
        (state.urgency === 60 ? 'Priority — same day' : 'Ready to review');
    }

    const sync = document.getElementById('ownerSync');
    if (sync && parts.total !== prevOwnerTotal) {
      sync.classList.remove('is-pulse');
      void sync.offsetWidth;
      sync.classList.add('is-pulse');
    }
    prevOwnerTotal = parts.total;
  }

  // ── Render: prep checklist ──
  // preserve checked state across rebuilds by key
  const prepChecked = {};

  function buildPrepTasks() {
    const tasks = [];
    tasks.push({ key: 'base', ...ROOM_PREP.base });
    Object.keys(state.extras).forEach(k => { if (ROOM_PREP[k]) tasks.push({ key: 'room-' + k, ...ROOM_PREP[k] }); });
    Object.keys(state.addons).forEach(k => { if (ADDON_PREP[k]) tasks.push({ key: 'addon-' + k, ...ADDON_PREP[k] }); });
    if (state.condition === 1.4) {
      tasks.push({ key: 'deepcond', text: 'Point out any priority problem areas for the deep clean', tag: 'Deep' });
    }
    if (state.urgency === 60) {
      tasks.push({ key: 'sameday', text: 'Confirm someone can provide entry on short notice', tag: 'Same day' });
    }
    return tasks;
  }

  function renderPrep() {
    const listEl = document.getElementById('prepList');
    const emptyEl = document.getElementById('prepEmpty');
    const titleEl = document.getElementById('prepTitle');
    const subEl = document.getElementById('prepSub');
    const countEl = document.getElementById('prepCount');
    if (!listEl) return;

    if (titleEl) titleEl.textContent = `${state.sizeLabel} — ${state.conditionLabel}`;
    if (subEl) {
      const parts = [];
      parts.push(`${state.bed} bedroom${state.bed !== 1 ? 's' : ''}`);
      parts.push(`${state.bath} bathroom${state.bath !== 1 ? 's' : ''}`);
      const extras = Object.keys(state.extras).map(k => ROOM_LABELS[k].toLowerCase());
      if (extras.length) parts.push(extras.join(', '));
      parts.push(`${state.freqLabel.toLowerCase()} visit`);
      subEl.textContent = parts.join(' · ');
    }

    const tasks = buildPrepTasks();

    if (tasks.length === 0) {
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
      if (countEl) countEl.textContent = '0 / 0';
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    listEl.innerHTML = tasks.map(t => {
      const done = !!prepChecked[t.key];
      return `<li><button class="prep-item${done ? ' is-done' : ''}" type="button" data-prep="${t.key}" aria-pressed="${done}">
        <span class="prep-check" aria-hidden="true">✓</span>
        <span class="prep-text">${t.text}</span>
        <span class="prep-tag">${t.tag}</span>
      </button></li>`;
    }).join('');

    updatePrepCount();
  }

  function updatePrepCount() {
    const countEl = document.getElementById('prepCount');
    const items = document.querySelectorAll('#prepList .prep-item');
    const done = document.querySelectorAll('#prepList .prep-item.is-done').length;
    if (countEl) countEl.textContent = `${done} / ${items.length}`;
  }

  // delegate prep item clicks
  const prepListEl = document.getElementById('prepList');
  if (prepListEl) {
    prepListEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-prep]');
      if (!btn) return;
      const key = btn.dataset.prep;
      prepChecked[key] = !prepChecked[key];
      btn.classList.toggle('is-done', prepChecked[key]);
      btn.setAttribute('aria-pressed', String(!!prepChecked[key]));
      updatePrepCount();
    });
  }

  const prepClearBtn = document.getElementById('prepClearBtn');
  if (prepClearBtn) {
    prepClearBtn.addEventListener('click', () => {
      Object.keys(prepChecked).forEach(k => delete prepChecked[k]);
      document.querySelectorAll('#prepList .prep-item').forEach(b => {
        b.classList.remove('is-done');
        b.setAttribute('aria-pressed', 'false');
      });
      updatePrepCount();
    });
  }

  const prepPrintBtn = document.getElementById('prepPrintBtn');
  if (prepPrintBtn) {
    prepPrintBtn.addEventListener('click', () => window.print());
  }

  // ── Summary (copyable) ──
  function renderSummary(total) {
    const el = document.getElementById('calcSummary');
    if (!el) return;
    const rows = buildBreakdown();
    const parts = calcParts();
    const lines = rows.map(r => `  ${r.label}: $${r.price}`);
    let extra = '';
    extra += `\n  Home size: ${state.sizeLabel} (x${state.size})`;
    extra += `\n  Condition: ${state.conditionLabel} (x${state.condition})`;
    if (parts.urgency) extra += `\n  Timing: ${state.urgency === 30 ? 'Next day' : 'Same day'} (+$${parts.urgency})`;
    extra += `\n  Frequency: ${state.freqLabel}`;
    if (parts.discount) extra += ` (-$${parts.discount})`;
    extra += `\n  Est. visit time: ${formatTime(estVisitMinutes())}`;

    el.textContent =
      'CleanQuote — Demo Estimate\n' +
      '---------------------------\n' +
      (lines.length ? lines.join('\n') : '  (no rooms selected)') +
      extra +
      `\n---------------------------\n  Estimated total: $${total}\n\nDemo only — not a real quote.`;
  }

  // ── Master update ──
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
    renderMeta();
    renderMobilePreview();
    renderOwnerDashboard();
    renderPrep();
    renderSummary(newTotal);
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
        setPressed(btn, false);
      } else {
        bag[key] = price;
        btn.classList.add('is-on');
        setPressed(btn, true);
      }
      updateTotal();
    });
  });

  // ── Urgency buttons ──
  document.querySelectorAll('[data-urgency]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectOne('[data-urgency]', btn);
      state.urgency = parseInt(btn.dataset.urgency, 10);
      updateTotal();
    });
  });

  // ── Size buttons ──
  document.querySelectorAll('[data-size]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectOne('[data-size]', btn);
      state.size = parseFloat(btn.dataset.size);
      state.sizeLabel = btn.dataset.sizeLabel;
      updateTotal();
    });
  });

  // ── Condition buttons ──
  document.querySelectorAll('[data-condition]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectOne('[data-condition]', btn);
      state.condition = parseFloat(btn.dataset.condition);
      state.conditionLabel = btn.dataset.conditionLabel;
      updateTotal();
    });
  });

  // ── Frequency buttons ──
  document.querySelectorAll('[data-freq]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectOne('[data-freq]', btn);
      state.freq = parseFloat(btn.dataset.freq);
      state.freqLabel = btn.dataset.freqLabel;
      updateTotal();
    });
  });

  // ── Reset selections ──
  const resetAllBtn = document.getElementById('calcResetAll');
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {
      state.bed = 1; state.bath = 1;
      state.extras = {}; state.addons = {};
      state.urgency = 0;
      state.size = 1; state.sizeLabel = 'Standard home';
      state.condition = 1; state.conditionLabel = 'Standard clean';
      state.freq = 1; state.freqLabel = 'One-time';
      Object.keys(prepChecked).forEach(k => delete prepChecked[k]);

      const bv = document.getElementById('bedVal'); if (bv) bv.textContent = '1';
      const bp = document.getElementById('bedPrice'); if (bp) bp.textContent = '$25';
      const hv = document.getElementById('bathVal'); if (hv) hv.textContent = '1';
      const hp = document.getElementById('bathPrice'); if (hp) hp.textContent = '$25';

      document.querySelectorAll('[data-toggle]').forEach(b => {
        b.classList.remove('is-on');
        setPressed(b, false);
      });
      selectOne('[data-urgency]', document.querySelector('[data-urgency="0"]'));
      selectOne('[data-size]', document.querySelector('[data-size="1"]'));
      selectOne('[data-condition]', document.querySelector('[data-condition="1"]'));
      selectOne('[data-freq]', document.querySelector('[data-freq="1"]'));

      // reset sent state too
      if (sentEl && sendBtn) {
        sentEl.style.display = 'none';
        sentEl.classList.remove('is-hidden');
        sendBtn.style.display = 'block';
        sendBtn.classList.remove('is-hidden');
      }
      updateTotal();
    });
  }

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
  updateTotal();

});
