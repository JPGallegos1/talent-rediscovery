import { parseCsvTalentPool } from "./csv-candidate-records.js";

const shell = document.querySelector("[data-prototype-shell]");
const fileInput = document.querySelector("[data-talent-pool-file]");
const status = document.querySelector("[data-upload-status]");
const previewPanel = document.querySelector("[data-preview-panel]");
const recordCount = document.querySelector("[data-record-count]");
const recordGrid = document.querySelector("[data-record-grid]");

let talentPool = null;

if (shell) {
  shell.dataset.ready = "true";
}

fileInput?.addEventListener("change", async (event) => {
  const [file] = event.target.files;

  clearPreview();

  if (!file) {
    setStatus("No Talent Pool File selected yet.");
    return;
  }

  if (!isCsvFile(file)) {
    setStatus("Unsupported Talent Pool File. Upload a CSV file.", true);
    return;
  }

  try {
    const csvText = await file.text();
    talentPool = parseCsvTalentPool(csvText);
    renderPreview(talentPool.candidateRecords, file.name);
  } catch (error) {
    talentPool = null;
    setStatus(error instanceof Error ? error.message : "The Talent Pool File could not be parsed.", true);
  }
});

function isCsvFile(file) {
  return file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
}

function renderPreview(candidateRecords, fileName) {
  if (!previewPanel || !recordCount || !recordGrid) {
    return;
  }

  setStatus(`Parsed ${candidateRecords.length} Candidate Records from ${fileName}.`);
  recordCount.textContent = `${candidateRecords.length} records`;
  recordGrid.replaceChildren(...candidateRecords.slice(0, 12).map(createRecordCard));
  previewPanel.hidden = false;
}

function createRecordCard(candidateRecord) {
  const { canonicalFields } = candidateRecord;
  const card = document.createElement("article");
  card.className = "record-card";

  const title = document.createElement("h3");
  title.textContent = canonicalFields.name || `Candidate Record ${candidateRecord.rowNumber}`;

  const role = document.createElement("p");
  role.className = "record-role";
  role.textContent = canonicalFields.currentRole || "Role not provided";

  const details = document.createElement("dl");
  appendDetail(details, "Location", canonicalFields.location);
  appendDetail(details, "Experience", formatExperience(canonicalFields.yearsExperience));
  appendDetail(details, "English", canonicalFields.englishLevel);
  appendDetail(details, "Availability", canonicalFields.availability);
  appendDetail(details, "Industries", canonicalFields.industries.join(", "));
  appendDetail(details, "Skills", canonicalFields.skills.terms.join(", "));
  appendDetail(details, "Last contact", canonicalFields.lastContactDate);
  appendDetail(details, "Source", canonicalFields.source);

  const notes = document.createElement("p");
  notes.className = "record-notes";
  notes.textContent = canonicalFields.notes || "No notes preserved for this Candidate Record.";

  card.append(title, role, details, notes);
  return card;
}

function appendDetail(details, label, value) {
  const term = document.createElement("dt");
  term.textContent = label;

  const description = document.createElement("dd");
  description.textContent = value || "Not provided";

  details.append(term, description);
}

function formatExperience(value) {
  if (!value) {
    return "";
  }

  return `${value} years`;
}

function clearPreview() {
  talentPool = null;
  previewPanel?.setAttribute("hidden", "");
  recordGrid?.replaceChildren();
  if (recordCount) {
    recordCount.textContent = "";
  }
}

function setStatus(message, isError = false) {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.dataset.state = isError ? "error" : "ready";
}
