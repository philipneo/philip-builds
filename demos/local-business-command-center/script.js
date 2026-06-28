(function () {
  // ── no-js → js ──────────────────────────────────────────
  document.body.classList.remove('no-js');
  document.body.classList.add('js');

  // ── reveal on scroll ────────────────────────────────────
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealEls = Array.from(document.querySelectorAll('.reveal'));

  function showAll() {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  if ('IntersectionObserver' in window && !prefersReducedMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    revealEls.forEach(el => observer.observe(el));
  } else {
    showAll();
  }

  if (typeof prefersReducedMotion.addEventListener === 'function') {
    prefersReducedMotion.addEventListener('change', e => { if (e.matches) showAll(); });
  }

  // ── live date in dashboard ───────────────────────────────
  const liveDate = document.getElementById('liveDate');
  const eodDate = document.getElementById('eodDate');
  if (liveDate || eodDate) {
    const now = new Date();
    const short = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const full = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (liveDate) liveDate.textContent = short;
    if (eodDate) eodDate.textContent = full;
  }

  // ── sticky nav active state ──────────────────────────────
  const navLinks = Array.from(document.querySelectorAll('.cc-nav a[href^="#"]'));
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const navObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(l => l.classList.remove('active'));
          const link = navLinks.find(l => l.getAttribute('href') === '#' + entry.target.id);
          if (link) link.classList.add('active');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    sections.forEach(s => navObs.observe(s));
  }

  // ── quote estimator ──────────────────────────────────────
  const qService = document.getElementById('qService');
  const qSize = document.getElementById('qSize');
  const qUrgency = document.getElementById('qUrgency');
  const qTotal = document.getElementById('qTotal');
  const qBreakdown = document.getElementById('qBreakdown');

  function updateQuote() {
    if (!qService || !qTotal) return;

    const base = parseInt(qService.value) || 0;
    const size = parseInt(qSize.value) || 0;
    const urgency = parseInt(qUrgency.value) || 0;
    const baseName = qService.selectedOptions[0].text.split('—')[0].trim();

    let addons = 0;
    const addonLines = [];
    document.querySelectorAll('[data-price]').forEach(cb => {
      if (cb.checked) {
        const p = parseInt(cb.dataset.price);
        addons += p;
        const name = cb.closest('label').querySelector('strong').textContent;
        addonLines.push({ name, price: p });
      }
    });

    const total = base + size + addons + urgency;
    qTotal.textContent = '$' + total;

    // Build breakdown
    let html = '';
    html += `<div class="qb-row"><span>${baseName}</span><span>$${base}</span></div>`;
    if (size > 0) {
      const sizeName = qSize.selectedOptions[0].text.split('(')[1]?.replace(')', '') || 'Size adjustment';
      html += `<div class="qb-row"><span>${sizeName}</span><span>+$${size}</span></div>`;
    }
    addonLines.forEach(a => {
      html += `<div class="qb-row"><span>${a.name}</span><span>+$${a.price}</span></div>`;
    });
    if (urgency > 0) {
      html += `<div class="qb-row"><span>Same-day booking</span><span>+$${urgency}</span></div>`;
    }
    html += `<div class="qb-row total"><span>Estimated total</span><span>$${total}</span></div>`;
    qBreakdown.innerHTML = html;
  }

  if (qService) {
    [qService, qSize, qUrgency].forEach(el => el.addEventListener('change', updateQuote));
    document.querySelectorAll('[data-price]').forEach(cb => cb.addEventListener('change', updateQuote));
    updateQuote();
  }

  // ── job route queue + escalation ─────────────────────────
  const STAGES = ['Queued', 'En route', 'On site', 'Done'];
  const STAGE_PILL = { 'Queued': 'pill-blue', 'En route': 'pill-yellow', 'On site': 'pill-yellow', 'Done': 'pill-green' };

  const routeSeed = [
    { id: 'santos',  name: 'Santos', service: 'Full Detail',     time: '9:30 AM',  value: 249, stage: 3, issue: '' },
    { id: 'morales', name: 'Morales', service: 'Interior Reset', time: '11:15 AM', value: 149, stage: 1, issue: '' },
    { id: 'park',    name: 'Park',    service: 'Exterior Wash',  time: '2:00 PM',  value: 79,  stage: 0, issue: '' },
    { id: 'rivera',  name: 'Rivera',  service: 'Ceramic Coating', time: '4:00 PM', value: 499, stage: 0, issue: '' },
  ];
  const ISSUE_REASONS = ['Gate locked — no access', 'Customer not home', 'Extra soiling — needs more time', 'Payment pending on site'];

  let routeJobs = routeSeed.map(j => ({ ...j }));

  const routeList = document.getElementById('routeList');
  const routeCard = routeList ? routeList.closest('.route-card') : null;
  const routeEmpty = document.getElementById('routeEmpty');
  const routeAdvance = document.getElementById('routeAdvance');
  const routeReset = document.getElementById('routeReset');
  const rmDone = document.getElementById('rmDone');
  const rmActive = document.getElementById('rmActive');
  const rmQueued = document.getElementById('rmQueued');
  const routeBar = document.getElementById('routeBar');
  const routeRevenue = document.getElementById('routeRevenue');
  const routePct = document.getElementById('routePct');
  const escList = document.getElementById('escList');
  const escEmpty = document.getElementById('escEmpty');
  const escCount = document.getElementById('escCount');

  function routeStats() {
    const done = routeJobs.filter(j => j.stage === 3).length;
    const active = routeJobs.filter(j => j.stage > 0 && j.stage < 3).length;
    const queued = routeJobs.filter(j => j.stage === 0).length;
    const collected = routeJobs.filter(j => j.stage === 3).reduce((s, j) => s + j.value, 0);
    const escalations = routeJobs.filter(j => j.issue).length;
    const pct = routeJobs.length ? Math.round((done / routeJobs.length) * 100) : 0;
    return { done, active, queued, collected, escalations, pct };
  }

  function renderRoute() {
    if (!routeList) return;
    const activeIdx = routeJobs.findIndex(j => j.stage > 0 && j.stage < 3);

    routeList.innerHTML = routeJobs.map((j, i) => {
      const stageName = STAGES[j.stage];
      const isActive = j.stage > 0 && j.stage < 3;
      const isDone = j.stage === 3;
      const cls = ['route-job'];
      if (isActive) cls.push('is-active');
      if (isDone) cls.push('is-done');
      if (j.issue) cls.push('is-flagged');
      const marker = isDone ? '✓' : (i + 1);
      const nextLabel = j.stage === 0 ? 'Start' : j.stage === 1 ? 'Arrive' : 'Mark done';
      const advBtn = isDone ? '' :
        `<button type="button" class="route-act route-act-primary" data-route-advance="${j.id}">${nextLabel}</button>`;
      const flagBtn =
        `<button type="button" class="route-act route-act-flag${j.issue ? ' is-on' : ''}" data-route-flag="${j.id}" aria-pressed="${j.issue ? 'true' : 'false'}">${j.issue ? 'Flagged' : 'Flag'}</button>`;
      const meta = j.issue
        ? `<span style="color:var(--red)">⚠ ${j.issue}</span>`
        : `<b>${j.time}</b> · ${j.service} · $${j.value}`;
      return `
        <div class="${cls.join(' ')}" role="listitem">
          <div class="route-job-marker">${marker}</div>
          <div class="route-job-main">
            <div class="route-job-name">${j.name}</div>
            <div class="route-job-meta">${meta}</div>
          </div>
          <div class="route-job-side">
            <span class="pill ${STAGE_PILL[stageName]}">${stageName}</span>
            <div class="route-job-actions">${advBtn}${flagBtn}</div>
          </div>
        </div>`;
    }).join('');

    const st = routeStats();
    if (rmDone) rmDone.textContent = st.done;
    if (rmActive) rmActive.textContent = st.active;
    if (rmQueued) rmQueued.textContent = st.queued;
    if (routeBar) routeBar.style.width = st.pct + '%';
    if (routeRevenue) routeRevenue.textContent = '$' + st.collected + ' collected';
    if (routePct) routePct.textContent = st.pct + '% of route';

    const allDone = st.done === routeJobs.length;
    if (routeCard) routeCard.classList.toggle('is-cleared', allDone);
    if (routeEmpty) routeEmpty.hidden = !allDone;
    if (routeAdvance) routeAdvance.disabled = allDone;

    renderEscalations();
    updateEod();
  }

  function renderEscalations() {
    if (!escList) return;
    const flagged = routeJobs.filter(j => j.issue);
    if (escCount) escCount.textContent = flagged.length + ' open';
    if (!flagged.length) {
      escList.innerHTML = '<div class="escalation-empty" id="escEmpty"><span aria-hidden="true">●</span> No open issues. Flag a job to raise one.</div>';
      return;
    }
    escList.innerHTML = flagged.map(j => `
      <div class="escalation-item">
        <div class="escalation-item-top">
          <span class="escalation-item-name">${j.name} — ${j.service}</span>
          <button type="button" class="escalation-resolve" data-esc-resolve="${j.id}">Resolve</button>
        </div>
        <div class="escalation-item-issue">${j.issue}</div>
      </div>`).join('');
  }

  if (routeList) {
    routeList.addEventListener('click', e => {
      const adv = e.target.closest('[data-route-advance]');
      const flag = e.target.closest('[data-route-flag]');
      if (adv) {
        const job = routeJobs.find(j => j.id === adv.dataset.routeAdvance);
        if (job && job.stage < 3) { job.stage += 1; if (job.stage === 3) job.issue = ''; renderRoute(); }
      } else if (flag) {
        const job = routeJobs.find(j => j.id === flag.dataset.routeFlag);
        if (job) {
          if (job.issue) { job.issue = ''; }
          else { job.issue = ISSUE_REASONS[routeJobs.indexOf(job) % ISSUE_REASONS.length]; if (job.stage === 0) job.stage = 1; }
          renderRoute();
        }
      }
    });
  }

  if (escList) {
    escList.addEventListener('click', e => {
      const btn = e.target.closest('[data-esc-resolve]');
      if (!btn) return;
      const job = routeJobs.find(j => j.id === btn.dataset.escResolve);
      if (job) { job.issue = ''; renderRoute(); }
    });
  }

  if (routeAdvance) {
    routeAdvance.addEventListener('click', () => {
      const job = routeJobs.find(j => j.stage > 0 && j.stage < 3) || routeJobs.find(j => j.stage === 0);
      if (job && job.stage < 3) { job.stage += 1; if (job.stage === 3) job.issue = ''; renderRoute(); }
    });
  }

  if (routeReset) {
    routeReset.addEventListener('click', () => {
      routeJobs = routeSeed.map(j => ({ ...j }));
      renderRoute();
    });
  }

  // ── checklist ────────────────────────────────────────────
  const clItems = Array.from(document.querySelectorAll('.cl-item'));
  const checklistBar = document.getElementById('checklistBar');
  const checklistCount = document.getElementById('checklistCount');
  const progressLabel = document.getElementById('progressLabel');
  const progressEta = document.getElementById('progressEta');
  const sumDone = document.getElementById('sumDone');
  const sumPct = document.getElementById('sumPct');
  const sumNext = document.getElementById('sumNext');
  const sumStatus = document.getElementById('sumStatus');
  const eodDone = document.getElementById('eodDone');
  const eodBadge = document.getElementById('eodBadge');
  const eodNote = document.getElementById('eodNote');
  const eodFollowup = document.getElementById('eodFollowup');
  const eodJobs = document.getElementById('eodJobs');
  const eodRevenue = document.getElementById('eodRevenue');
  const eodEscalations = document.getElementById('eodEscalations');
  const eodPreview = document.getElementById('eodPreview');
  const checklistHint = document.getElementById('checklistHint');

  const checklistLabels = clItems.map(cb => cb.closest('label').querySelector('.checklist-item-text').textContent.trim());

  // Returns true if an item's prerequisite step is satisfied
  function isUnlocked(cb) {
    const needs = cb.dataset.needs;
    if (!needs) return true;
    const prereq = clItems.find(o => o.closest('.checklist-item').dataset.step === needs);
    return prereq ? prereq.checked : true;
  }

  function updateChecklist() {
    const total = clItems.length;
    const done = clItems.filter(cb => cb.checked).length;
    const pct = Math.round((done / total) * 100);

    // Dependency locking + completed styling
    clItems.forEach(cb => {
      const row = cb.closest('.checklist-item');
      const unlocked = isUnlocked(cb);
      cb.disabled = !unlocked && !cb.checked;
      row.classList.toggle('is-locked', cb.disabled);
      row.classList.toggle('done', cb.checked);
    });

    // Mark the next actionable item
    const nextItem = clItems.find(cb => !cb.checked && isUnlocked(cb));
    clItems.forEach(cb => cb.closest('.checklist-item').classList.remove('is-next'));
    if (nextItem) nextItem.closest('.checklist-item').classList.add('is-next');

    if (checklistBar) checklistBar.style.width = pct + '%';
    if (checklistCount) checklistCount.textContent = `${done} / ${total} done`;
    if (progressLabel) progressLabel.textContent = `${pct}% complete`;

    if (progressEta) {
      if (done === total) progressEta.textContent = '✓ All done';
      else if (done === 0) progressEta.textContent = 'Est. finish: —';
      else progressEta.textContent = `${total - done} left`;
    }

    if (checklistHint) {
      checklistHint.textContent = done === total
        ? 'All stages closed out. Nice work — the recap below is ready to copy.'
        : 'Steps unlock in order — finish a stage to open the next.';
    }

    if (sumDone) sumDone.textContent = `${done} of ${total}`;
    if (sumPct) sumPct.textContent = `${pct}%`;
    if (sumNext) sumNext.textContent = nextItem ? checklistLabels[clItems.indexOf(nextItem)] : 'All done!';

    if (sumStatus) {
      if (done === 0) sumStatus.innerHTML = '<span class="pill pill-blue">Not started</span>';
      else if (done === total) sumStatus.innerHTML = '<span class="pill pill-green">Complete</span>';
      else sumStatus.innerHTML = '<span class="pill pill-yellow">In progress</span>';
    }

    updateEod();
  }

  // Build the canonical recap text (also drives preview + copy + print)
  function buildSummary() {
    const total = clItems.length;
    const done = clItems.filter(cb => cb.checked).length;
    const dateStr = eodDate ? eodDate.textContent : 'Today';
    const st = routeStats();
    const followups = Math.max(0, routeJobs.length - st.done);
    const quotes = document.getElementById('eodQuotes')?.textContent || '2 pending';
    const flagged = routeJobs.filter(j => j.issue);

    const lines = [
      `Daily Summary — ${dateStr}`,
      `=================================`,
      `Tasks completed:    ${done} of ${total}`,
      `Jobs closed:        ${st.done} of ${routeJobs.length}`,
      `Revenue collected:  $${st.collected}`,
      `Open quote requests: ${quotes}`,
      `Escalations raised:  ${st.escalations}`,
      `Follow-ups needed:   ${followups}`,
      ``,
      `Route detail:`,
    ];
    routeJobs.forEach(j => {
      const stage = STAGES[j.stage];
      const flag = j.issue ? `  [!] ${j.issue}` : '';
      lines.push(`  - ${j.time}  ${j.name} (${j.service}) — ${stage}${flag}`);
    });
    if (flagged.length) {
      lines.push('');
      lines.push(`Action items:`);
      flagged.forEach(j => lines.push(`  * Follow up with ${j.name}: ${j.issue}`));
    }
    lines.push('');
    lines.push(`Generated by Local Business Command Center demo`);
    lines.push(`Philip Builds Studio — demo only, no data saved`);
    return { text: lines.join('\n'), done, total, st, followups };
  }

  function updateEod() {
    const { text, done, total, st, followups } = buildSummary();

    if (eodDone) eodDone.textContent = `${done} / ${total}`;
    if (eodJobs) eodJobs.textContent = `${st.done} / ${routeJobs.length}`;
    if (eodRevenue) eodRevenue.textContent = '$' + st.collected;
    if (eodEscalations) eodEscalations.textContent = String(st.escalations);
    if (eodFollowup) eodFollowup.textContent = String(followups);
    if (eodPreview) eodPreview.textContent = text;

    const fullyDone = done === total && st.done === routeJobs.length;
    if (eodBadge) {
      if (fullyDone) {
        eodBadge.textContent = 'Complete';
        eodBadge.style.background = 'rgba(16,185,129,0.15)';
        eodBadge.style.color = 'var(--green)';
      } else {
        eodBadge.textContent = 'In Progress';
        eodBadge.style.background = 'rgba(245,158,11,0.15)';
        eodBadge.style.color = 'var(--yellow)';
      }
    }
    if (eodNote) {
      if (fullyDone && st.escalations === 0) {
        eodNote.textContent = 'Day complete. Route cleared, all tasks checked, no open issues. Recap is ready to copy or print.';
      } else if (st.escalations > 0) {
        eodNote.textContent = `${st.escalations} escalation${st.escalations > 1 ? 's' : ''} still open — resolve them in the route panel above before closing out.`;
      } else if (done > 0 || st.done > 0) {
        eodNote.textContent = 'Recap updates live as you advance jobs and check off tasks. Demo only — no data is saved.';
      } else {
        eodNote.textContent = 'Run the route and checklist above to see this summary fill in. Demo only — no data is saved.';
      }
    }
  }

  clItems.forEach(cb => cb.addEventListener('change', updateChecklist));

  const checklistReset = document.getElementById('checklistReset');
  if (checklistReset) {
    checklistReset.addEventListener('click', () => {
      clItems.forEach(cb => { cb.checked = false; });
      updateChecklist();
    });
  }

  // Initial paint: route first (renders queue + escalations + eod), then checklist.
  renderRoute();
  updateChecklist();

  // ── copy + print summary ─────────────────────────────────
  const copyBtn = document.getElementById('copyBtn');
  const copyStatus = document.getElementById('copyStatus');
  const printBtn = document.getElementById('printBtn');

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const { text } = buildSummary();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showCopyStatus()).catch(() => fallbackCopy(text));
      } else {
        fallbackCopy(text);
      }
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => { window.print(); });
  }

  function showCopyStatus() {
    if (!copyStatus) return;
    copyStatus.classList.add('visible');
    setTimeout(() => copyStatus.classList.remove('visible'), 2500);
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showCopyStatus(); } catch (e) {}
    document.body.removeChild(ta);
  }

})();
