const offers = {
  "Home services": {
    title: "Missed Call Recovery Bot",
    setup: 1200,
    monthly: 350,
    closeRate: 8,
    score: 88,
    promise:
      "Install a simple follow-up workflow that catches missed calls, sends a text within 60 seconds, logs the lead, and reminds the owner until the lead is booked or disqualified.",
    pains: [
      "Owners lose jobs when they are on-site and cannot answer.",
      "Leads go cold quickly after a quote request.",
      "Most teams do not have a clean CRM habit."
    ],
    checklist: [
      "Map the current lead path from call, form, or Facebook message.",
      "Create a Google Sheet or CRM pipeline with lead status fields.",
      "Set up instant text/email follow-up and owner notifications.",
      "Add a daily digest of unresponded leads.",
      "Record before/after metrics for response time and booked jobs."
    ],
    opener: "I noticed a lot of local service businesses lose money on missed calls while crews are out on jobs."
  },
  "Med spas": {
    title: "Consult Booking Reactivator",
    setup: 1800,
    monthly: 500,
    closeRate: 6,
    score: 84,
    promise:
      "Turn old leads and no-shows into booked consults with segmented follow-up, FAQ answers, and a weekly report showing replies, booked appointments, and revenue opportunities.",
    pains: [
      "No-shows and old consult requests are already paid-for demand.",
      "Staff rarely have time for consistent follow-up.",
      "Prospects ask the same safety and pricing questions repeatedly."
    ],
    checklist: [
      "Import old inquiries, consult requests, and no-show lists.",
      "Segment by treatment interest and last contact date.",
      "Draft compliant, human-reviewed text/email sequences.",
      "Connect replies to a booking link or front-desk handoff.",
      "Send a weekly booked-consult and revenue-opportunity report."
    ],
    opener: "A lot of med spas have revenue sitting inside old consult requests and no-show lists."
  },
  "Real estate agents": {
    title: "Open House Follow-Up Engine",
    setup: 950,
    monthly: 300,
    closeRate: 9,
    score: 81,
    promise:
      "Capture open-house visitors, send personalized follow-up within minutes, rank warm buyers and sellers, and create reminders so agents stop losing conversations after Sunday.",
    pains: [
      "Open-house leads are easy to collect and easy to forget.",
      "Agents need speed without sounding robotic.",
      "Warm buyer/seller signals often live in scattered notes."
    ],
    checklist: [
      "Create a mobile-friendly open-house intake form.",
      "Send tailored follow-up based on buyer, seller, or neighbor intent.",
      "Score leads by timeline, budget, and property interest.",
      "Push hot leads into the agent's CRM or calendar.",
      "Prepare a Monday morning priority list."
    ],
    opener: "Open houses create a burst of attention, but most of the money is in the follow-up after everyone leaves."
  },
  "Boutique gyms": {
    title: "Trial Member Conversion System",
    setup: 1100,
    monthly: 325,
    closeRate: 7,
    score: 79,
    promise:
      "Automatically follow up with trial members, answer common questions, collect objections, and alert staff when someone is likely to convert or churn.",
    pains: [
      "Trial members need nudges at exactly the right time.",
      "Front-desk teams are busy during class transitions.",
      "Owners need visibility into why trials do not become members."
    ],
    checklist: [
      "Define the trial-member journey from signup to day seven.",
      "Create check-in messages after first class and before trial end.",
      "Route pricing, schedule, and membership questions to staff.",
      "Track objections in a simple dashboard.",
      "Build a weekly trial-to-member conversion report."
    ],
    opener: "Trial members usually decide fast, and a few timely follow-ups can change the conversion math."
  }
};

const modeProfiles = {
  fast: { multiplier: 1, label: "fast setup", pitchMultiplier: 12 },
  premium: { multiplier: 1.65, label: "premium build", pitchMultiplier: 9 },
  retainer: { multiplier: 0.85, label: "retainer-first", pitchMultiplier: 14 }
};

const state = {
  niche: "Home services",
  mode: "fast",
  leads: JSON.parse(localStorage.getItem("cashflow-opportunity-notes") || "[]")
};

const els = {
  niche: document.querySelector("#niche"),
  goal: document.querySelector("#goal"),
  offerTitle: document.querySelector("#offerTitle"),
  offerCopy: document.querySelector("#offerCopy"),
  setupPrice: document.querySelector("#setupPrice"),
  monthlyPrice: document.querySelector("#monthlyPrice"),
  clientsNeeded: document.querySelector("#clientsNeeded"),
  pitchTarget: document.querySelector("#pitchTarget"),
  closeRate: document.querySelector("#closeRate"),
  score: document.querySelector("#score"),
  painList: document.querySelector("#painList"),
  checklist: document.querySelector("#checklist"),
  messageDraft: document.querySelector("#messageDraft"),
  toast: document.querySelector("#toast"),
  leadRows: document.querySelector("#leadRows")
};

Object.keys(offers).forEach((name) => {
  const option = document.createElement("option");
  option.value = name;
  option.textContent = name;
  els.niche.append(option);
});

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function activeOffer() {
  const base = offers[state.niche];
  const profile = modeProfiles[state.mode];
  return {
    ...base,
    setup: Math.round(base.setup * profile.multiplier / 50) * 50,
    monthly: Math.round(base.monthly * profile.multiplier / 25) * 25,
    score: Math.min(96, Math.round(base.score + (state.mode === "premium" ? -2 : state.mode === "retainer" ? 4 : 0)))
  };
}

function messageDraft(offer) {
  const niche = state.niche.toLowerCase();
  return `Subject: quick idea for ${niche}

Hi [Name],

${offer.opener}

I build a small ${modeProfiles[state.mode].label} system called "${offer.title}." It helps ${niche} teams respond faster, follow up consistently, and see which leads still need attention.

The first version is intentionally simple:
- capture the lead
- send a fast human-sounding follow-up
- notify the owner or staff
- produce a weekly lead report

Would it be worth a 15 minute call to see if this would be useful? If it is not a fit, I will tell you quickly.

Best,
Philip`;
}

function renderOffer() {
  const offer = activeOffer();
  const goal = Number(els.goal.value) || 3000;
  const clients = Math.max(1, Math.ceil(goal / offer.setup));
  const pitches = Math.ceil(clients * modeProfiles[state.mode].pitchMultiplier);

  els.offerTitle.textContent = offer.title;
  els.offerCopy.textContent = offer.promise;
  els.setupPrice.textContent = `${currency(offer.setup)} setup`;
  els.monthlyPrice.textContent = `${currency(offer.monthly)}/mo support`;
  els.clientsNeeded.textContent = clients;
  els.pitchTarget.textContent = `${pitches} businesses`;
  els.closeRate.textContent = `${offer.closeRate}%`;
  els.score.textContent = offer.score;
  els.messageDraft.value = messageDraft(offer);

  els.painList.replaceChildren(...offer.pains.map((pain) => {
    const li = document.createElement("li");
    li.textContent = pain;
    return li;
  }));

  els.checklist.replaceChildren(...offer.checklist.map((item, index) => {
    const li = document.createElement("li");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `check-${index}`;
    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.textContent = item;
    li.append(checkbox, label);
    return li;
  }));
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.setTimeout(() => els.toast.classList.remove("show"), 1800);
}

async function copyText(text, message) {
  await navigator.clipboard.writeText(text);
  showToast(message);
}

function renderLeads() {
  els.leadRows.replaceChildren(...state.leads.map((lead, index) => {
    const row = document.createElement("tr");
    ["business", "contact", "status"].forEach((key) => {
      const cell = document.createElement("td");
      cell.textContent = lead[key];
      row.append(cell);
    });
    const action = document.createElement("td");
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `Remove ${lead.business}`);
    button.textContent = "x";
    button.addEventListener("click", () => {
      state.leads.splice(index, 1);
      saveLeads();
    });
    action.append(button);
    row.append(action);
    return row;
  }));
}

function saveLeads() {
  localStorage.setItem("cashflow-opportunity-notes", JSON.stringify(state.leads));
  renderLeads();
}

function exportCsv() {
  const header = ["Business", "Contact", "Status"];
  const rows = state.leads.map((lead) => [lead.business, lead.contact, lead.status]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cashflow-opportunity-notes.csv";
  link.click();
  URL.revokeObjectURL(url);
}

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".segment").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.mode = button.dataset.mode;
    renderOffer();
  });
});

els.niche.addEventListener("change", (event) => {
  state.niche = event.target.value;
  renderOffer();
});

els.goal.addEventListener("input", renderOffer);

document.querySelector("#targetDown").addEventListener("click", () => {
  els.goal.value = Math.max(500, Number(els.goal.value) - 500);
  renderOffer();
});

document.querySelector("#targetUp").addEventListener("click", () => {
  els.goal.value = Number(els.goal.value) + 500;
  renderOffer();
});

document.querySelector("#copyMessage").addEventListener("click", () => {
  copyText(els.messageDraft.value, "Message copied");
});

document.querySelector("#refreshMessage").addEventListener("click", renderOffer);

document.querySelector("#copyPack").addEventListener("click", () => {
  const offer = activeOffer();
  const pack = `${offer.title}

Offer:
${offer.promise}

Price:
${currency(offer.setup)} setup + ${currency(offer.monthly)}/mo support

Project message:
${els.messageDraft.value}

Delivery checklist:
${offer.checklist.map((item) => `- ${item}`).join("\n")}`;
  copyText(pack, "Launch pack copied");
});

document.querySelector("#leadForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const business = document.querySelector("#businessName");
  const contact = document.querySelector("#contact");
  const status = document.querySelector("#leadStatus");
  state.leads.unshift({
    business: business.value.trim(),
    contact: contact.value.trim(),
    status: status.value
  });
  business.value = "";
  contact.value = "";
  saveLeads();
  showToast("Lead added");
});

document.querySelector("#exportCsv").addEventListener("click", exportCsv);

document.querySelector("#clearLeads").addEventListener("click", () => {
  state.leads = [];
  saveLeads();
  showToast("Leads cleared");
});

renderOffer();
renderLeads();
