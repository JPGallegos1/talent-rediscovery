import { parseCsvTalentPool } from "./csv-candidate-records.js";
import { interpretSearchCriteria } from "./search-criteria.js";
import { buildShortlist } from "./shortlist-matches.js";

const shell = document.querySelector("[data-prototype-shell]");
const fileInput = document.querySelector("[data-talent-pool-file]");
const status = document.querySelector("[data-upload-status]");
const previewPanel = document.querySelector("[data-preview-panel]");
const recordCount = document.querySelector("[data-record-count]");
const recordGrid = document.querySelector("[data-record-grid]");
const searchForm = document.querySelector("[data-search-form]");
const searchRequestInput = document.querySelector("[data-search-request]");
const searchSubmit = document.querySelector("[data-search-submit]");
const searchStatus = document.querySelector("[data-search-status]");
const submittedSearch = document.querySelector("[data-submitted-search]");
const submittedSearchRequest = document.querySelector("[data-submitted-search-request]");
const searchCriteria = document.querySelector("[data-search-criteria]");
const shortlistPanel = document.querySelector("[data-shortlist-panel]");
const shortlistCount = document.querySelector("[data-shortlist-count]");
const shortlistGrid = document.querySelector("[data-shortlist-grid]");

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
    updateSearchAvailability();
  } catch (error) {
    talentPool = null;
    updateSearchAvailability();
    setStatus(error instanceof Error ? error.message : "The Talent Pool File could not be parsed.", true);
  }
});

searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!talentPool) {
    setSearchStatus("Upload a Talent Pool File before submitting a Search Request.", true);
    return;
  }

  const searchRequest = searchRequestInput?.value.trim() ?? "";

  if (!searchRequest) {
    setSearchStatus("Enter a Search Request before submitting.", true);
    searchRequestInput?.focus();
    return;
  }

  const criteria = interpretSearchCriteria(searchRequest);
  const shortlist = buildShortlist(talentPool.candidateRecords, criteria);

  renderSubmittedSearch(searchRequest, criteria);
  renderShortlist(shortlist);
  setSearchStatus(`Search Request submitted. Returned ${shortlist.length} ranked Matches in an ephemeral Shortlist.`);
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
  submittedSearch?.setAttribute("hidden", "");
  searchCriteria?.replaceChildren();
  shortlistPanel?.setAttribute("hidden", "");
  shortlistGrid?.replaceChildren();
  if (shortlistCount) {
    shortlistCount.textContent = "";
  }
  updateSearchAvailability();
}

function setStatus(message, isError = false) {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.dataset.state = isError ? "error" : "ready";
}

function updateSearchAvailability() {
  if (searchSubmit) {
    searchSubmit.disabled = !talentPool;
  }

  if (!talentPool) {
    setSearchStatus("Upload a Talent Pool File before submitting a Search Request.");
  } else {
    setSearchStatus("Talent Pool is ready. Submit a natural-language Search Request.");
  }
}

function renderSubmittedSearch(searchRequest, criteria) {
  if (!submittedSearch || !submittedSearchRequest || !searchCriteria) {
    return;
  }

  submittedSearchRequest.textContent = searchRequest;
  searchCriteria.replaceChildren();

  if (!criteria || Object.keys(criteria).length === 0) {
    const emptyLabel = document.createElement("dt");
    emptyLabel.textContent = "Status";

    const empty = document.createElement("dd");
    empty.className = "empty-criteria";
    empty.textContent = "No Search Criteria could be interpreted from this Search Request yet.";
    searchCriteria.append(emptyLabel, empty);
  } else {
    Object.entries(criteria).forEach(([label, value]) => {
      appendDetail(searchCriteria, formatCriteriaLabel(label), formatCriteriaValue(value));
    });
  }

  submittedSearch.hidden = false;
}

function formatCriteriaLabel(label) {
  return label.replaceAll(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function formatCriteriaValue(value) {
  return Array.isArray(value) ? value.join(", ") : value;
}

function renderShortlist(shortlist) {
  if (!shortlistPanel || !shortlistCount || !shortlistGrid) {
    return;
  }

  shortlistCount.textContent = `${shortlist.length} Matches`;
  shortlistGrid.replaceChildren(...shortlist.map((match, index) => createMatchCard(match, index + 1)));
  shortlistPanel.hidden = false;
}

function createMatchCard(match, rank) {
  const { canonicalFields } = match.candidateRecord;
  const card = document.createElement("article");
  card.className = "match-card";

  const heading = document.createElement("div");
  heading.className = "match-heading";

  const titleGroup = document.createElement("div");

  const rankLabel = document.createElement("p");
  rankLabel.className = "match-rank";
  rankLabel.textContent = `Match ${rank}`;

  const title = document.createElement("h3");
  title.textContent = canonicalFields.name || `Candidate Record ${match.candidateRecord.rowNumber}`;

  const role = document.createElement("p");
  role.className = "record-role";
  role.textContent = canonicalFields.currentRole || "Role not provided";

  const strength = document.createElement("strong");
  strength.className = "match-strength";
  strength.textContent = match.strength;

  titleGroup.append(rankLabel, title, role);
  heading.append(titleGroup, strength);

  const action = document.createElement("p");
  action.className = "suggested-action";
  action.textContent = match.suggestedNextAction;

  card.append(
    heading,
    action,
    createListSection("Reasons", match.reasons),
    createEvidenceSection(match.evidence),
    createListSection("Assumptions / gaps / missing information", match.gaps, "assumption-section"),
    createListSection("Risks / validation points", match.risks, "risk-section"),
  );

  return card;
}

function createEvidenceSection(evidence) {
  const section = document.createElement("section");
  section.className = "match-section evidence-section";

  const title = document.createElement("h4");
  title.textContent = "Candidate Record evidence";

  const list = document.createElement("dl");

  evidence.forEach((item) => {
    appendDetail(list, item.label, `${item.value} (${item.matched})`);
  });

  section.append(title, list);
  return section;
}

function createListSection(titleText, items, className = "") {
  const section = document.createElement("section");
  section.className = ["match-section", className].filter(Boolean).join(" ");

  const title = document.createElement("h4");
  title.textContent = titleText;

  const list = document.createElement("ul");

  items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    list.append(listItem);
  });

  section.append(title, list);
  return section;
}

function setSearchStatus(message, isError = false) {
  if (!searchStatus) {
    return;
  }

  searchStatus.textContent = message;
  searchStatus.dataset.state = isError ? "error" : "ready";
}

updateSearchAvailability();
