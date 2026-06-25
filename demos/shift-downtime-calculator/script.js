const STORAGE_KEY = "shift-downtime-entry";

const form = document.querySelector("#downtimeForm");
const output = document.querySelector("#reportOutput");
const totalMinutesEl = document.querySelector("#totalMinutes");
const decimalHoursEl = document.querySelector("#decimalHours");
const adjustedMinutesEl = document.querySelector("#adjustedMinutes");
const toast = document.querySelector("#toast");
const saveStatus = document.querySelector("#saveStatus");

const minuteFields = [
  "break1",
  "lunch",
  "break2",
  "ebb",
  "charging",
  "troubleshooting",
  "other"
];

function minutes(name) {
  const value = Number(form.elements[name].value);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}

function decimalHours(minutesValue) {
  return (minutesValue / 60).toFixed(2);
}

function overlapMinutes(data) {
  if (!data.chargingOverlap) return 0;
  const breakWindow = data.break1 + data.lunch + data.break2;
  return Math.min(data.charging, breakWindow);
}

function collectData() {
  const data = minuteFields.reduce((entry, field) => {
    entry[field] = minutes(field);
    return entry;
  }, {});

  data.shiftLabel = form.elements.shiftLabel.value.trim();
  data.notes = form.elements.notes.value.trim();
  data.chargingOverlap = form.elements.chargingOverlap.checked;
  return data;
}

function buildReport(data) {
  const total = minuteFields.reduce((sum, field) => sum + data[field], 0);
  const overlap = overlapMinutes(data);
  const adjusted = Math.max(0, total - overlap);
  const label = data.shiftLabel || "Shift";
  const notes = data.notes || "No additional notes.";

  return {
    total,
    adjusted,
    text: `${label} EOS downtime report

Break 1: ${data.break1} min
Lunch: ${data.lunch} min
Break 2: ${data.break2} min
EBB: ${data.ebb} min
Charging: ${data.charging} min
Troubleshooting: ${data.troubleshooting} min
Other downtime: ${data.other} min

Total downtime: ${total} min (${decimalHours(total)} hrs)
Adjusted downtime excluding charging overlap: ${adjusted} min (${decimalHours(adjusted)} hrs)
Charging overlap counted out: ${overlap} min

Notes: ${notes}`
  };
}

function render() {
  const data = collectData();
  const report = buildReport(data);
  totalMinutesEl.textContent = `${report.total} min`;
  decimalHoursEl.textContent = decimalHours(report.total);
  adjustedMinutesEl.textContent = `${report.adjusted} min`;
  output.textContent = report.text;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  saveStatus.textContent = "Saved locally";
}

function restoreSavedEntry() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (!saved) return;

  minuteFields.forEach((field) => {
    form.elements[field].value = saved[field] ?? 0;
  });

  form.elements.shiftLabel.value = saved.shiftLabel || "";
  form.elements.notes.value = saved.notes || "";
  form.elements.chargingOverlap.checked = Boolean(saved.chargingOverlap);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1700);
}

async function copyReport() {
  try {
    await navigator.clipboard.writeText(output.textContent);
    showToast("Report copied");
  } catch {
    const range = document.createRange();
    range.selectNodeContents(output);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    showToast("Report selected");
  }
}

form.addEventListener("input", render);
form.addEventListener("reset", () => {
  window.setTimeout(() => {
    localStorage.removeItem(STORAGE_KEY);
    saveStatus.textContent = "Reset";
    render();
  }, 0);
});

document.querySelector("#copyReport").addEventListener("click", copyReport);
document.querySelector("#loadSample").addEventListener("click", () => {
  const sample = {
    break1: 15,
    lunch: 30,
    break2: 15,
    ebb: 8,
    charging: 22,
    troubleshooting: 6,
    other: 4,
    shiftLabel: "AM route",
    notes: "Charging overlapped with lunch. Short troubleshooting note added after handoff.",
    chargingOverlap: true
  };

  minuteFields.forEach((field) => {
    form.elements[field].value = sample[field];
  });

  form.elements.shiftLabel.value = sample.shiftLabel;
  form.elements.notes.value = sample.notes;
  form.elements.chargingOverlap.checked = sample.chargingOverlap;
  render();
  showToast("Sample loaded");
});

restoreSavedEntry();
render();
