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

  const checklistLabels = clItems.map(cb => cb.closest('label').querySelector('.checklist-item-text').textContent.trim());

  function updateChecklist() {
    const total = clItems.length;
    const done = clItems.filter(cb => cb.checked).length;
    const pct = Math.round((done / total) * 100);

    // Style completed rows
    clItems.forEach(cb => {
      const row = cb.closest('.checklist-item');
      if (cb.checked) row.classList.add('done');
      else row.classList.remove('done');
    });

    // Progress bar
    if (checklistBar) checklistBar.style.width = pct + '%';
    if (checklistCount) checklistCount.textContent = `${done} / ${total} done`;
    if (progressLabel) progressLabel.textContent = `${pct}% complete`;

    // ETA
    if (progressEta) {
      if (done === total) {
        progressEta.textContent = '✓ All done';
      } else if (done === 0) {
        progressEta.textContent = 'Est. finish: —';
      } else {
        const remaining = total - done;
        progressEta.textContent = `${remaining} left`;
      }
    }

    // Summary sidebar
    if (sumDone) sumDone.textContent = `${done} of ${total}`;
    if (sumPct) sumPct.textContent = `${pct}%`;

    // Next task
    const nextItem = clItems.find(cb => !cb.checked);
    if (sumNext) {
      sumNext.textContent = nextItem
        ? checklistLabels[clItems.indexOf(nextItem)]
        : 'All done!';
    }

    if (sumStatus) {
      if (done === 0) {
        sumStatus.innerHTML = '<span class="pill pill-blue">Not started</span>';
      } else if (done === total) {
        sumStatus.innerHTML = '<span class="pill pill-green">Complete</span>';
      } else {
        sumStatus.innerHTML = '<span class="pill pill-yellow">In progress</span>';
      }
    }

    // EOD card
    if (eodDone) eodDone.textContent = `${done} / ${total}`;
    if (eodBadge) {
      if (done === total) {
        eodBadge.textContent = 'Complete';
        eodBadge.style.background = 'rgba(16,185,129,0.15)';
        eodBadge.style.color = 'var(--green)';
      } else {
        eodBadge.textContent = 'In Progress';
        eodBadge.style.background = 'rgba(245,158,11,0.15)';
        eodBadge.style.color = 'var(--yellow)';
      }
    }
    if (eodFollowup) {
      eodFollowup.textContent = done >= 6 ? '0' : done >= 4 ? '1' : '2';
    }
    if (eodNote) {
      if (done === total) {
        eodNote.textContent = 'Day complete. All tasks checked. Revenue and follow-ups are up to date.';
      } else if (done > 0) {
        eodNote.textContent = `${total - done} task${total - done > 1 ? 's' : ''} remaining. Keep going — the summary will finalize when all items are checked.`;
      } else {
        eodNote.textContent = 'Update the checklist above to see this summary reflect your progress. Demo only — no data is saved.';
      }
    }
  }

  clItems.forEach(cb => cb.addEventListener('change', updateChecklist));
  updateChecklist();

  // ── copy summary ─────────────────────────────────────────
  const copyBtn = document.getElementById('copyBtn');
  const copyStatus = document.getElementById('copyStatus');

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const done = clItems.filter(cb => cb.checked).length;
      const total = clItems.length;
      const dateStr = eodDate ? eodDate.textContent : 'Today';
      const revenue = document.getElementById('eodRevenue')?.textContent || '$840';
      const quotes = document.getElementById('eodQuotes')?.textContent || '2 pending';
      const followup = eodFollowup?.textContent || '1';

      const text = [
        `Daily Summary — ${dateStr}`,
        `━━━━━━━━━━━━━━━━━`,
        `Tasks completed: ${done} of ${total}`,
        `Est. revenue: ${revenue}`,
        `Jobs scheduled: 3`,
        `Open quote requests: ${quotes}`,
        `Follow-ups needed: ${followup}`,
        ``,
        `Generated by Local Business Command Center demo`,
        `Philip Builds Studio — philipneo.github.io/philip-builds/`,
      ].join('\n');

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showCopyStatus()).catch(() => fallbackCopy(text));
      } else {
        fallbackCopy(text);
      }
    });
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
