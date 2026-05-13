import { parseCsvTalentPool } from "./csv-candidate-records.js";
import { canDraftMessageFromSuggestedNextAction, draftMessageFromMatch } from "./message-draft.js";
import { interpretSearchCriteria } from "./search-criteria.js";

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
const messageDraftPanel = document.querySelector("[data-message-draft-panel]");
const messageDraftButton = document.querySelector("[data-message-draft-button]");
const messageDraftTextarea = document.querySelector("[data-message-draft]");
const messageDraftStatus = document.querySelector("[data-message-draft-status]");
const suggestedNextAction = document.querySelector("[data-suggested-next-action]");

let talentPool = null;
let currentSearchRequest = "";
let draftableMatch = null;

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

  currentSearchRequest = searchRequest;
  renderSubmittedSearch(searchRequest, interpretSearchCriteria(searchRequest));
  renderMessageDraftHook();
  setSearchStatus("Search Request submitted. Matching and Shortlist generation are out of scope for this slice.");
});

messageDraftButton?.addEventListener("click", () => {
  if (!draftableMatch || !messageDraftTextarea) {
    return;
  }

  try {
    messageDraftTextarea.value = draftMessageFromMatch(draftableMatch);
    messageDraftTextarea.removeAttribute("hidden");
    setMessageDraftStatus("Draft created for recruiter review. It has not been sent and can be edited before use.");
    messageDraftTextarea.focus();
  } catch (error) {
    setMessageDraftStatus(error instanceof Error ? error.message : "The message draft could not be created.", true);
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
  currentSearchRequest = "";
  draftableMatch = null;
  previewPanel?.setAttribute("hidden", "");
  recordGrid?.replaceChildren();
  if (recordCount) {
    recordCount.textContent = "";
  }
  submittedSearch?.setAttribute("hidden", "");
  searchCriteria?.replaceChildren();
  messageDraftPanel?.setAttribute("hidden", "");
  messageDraftTextarea?.setAttribute("hidden", "");
  if (messageDraftTextarea) {
    messageDraftTextarea.value = "";
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

function setSearchStatus(message, isError = false) {
  if (!searchStatus) {
    return;
  }

  searchStatus.textContent = message;
  searchStatus.dataset.state = isError ? "error" : "ready";
}

function renderMessageDraftHook() {
  if (!messageDraftPanel || !messageDraftButton || !talentPool || !currentSearchRequest) {
    return;
  }

  draftableMatch = createDraftableMatch(talentPool.candidateRecords[0], currentSearchRequest);
  const isDraftable = canDraftMessageFromSuggestedNextAction(draftableMatch.suggestedNextAction);

  if (suggestedNextAction) {
    suggestedNextAction.textContent = draftableMatch.suggestedNextAction;
  }

  messageDraftButton.disabled = !isDraftable;
  messageDraftPanel.hidden = false;
  messageDraftTextarea?.setAttribute("hidden", "");
  if (messageDraftTextarea) {
    messageDraftTextarea.value = "";
  }

  setMessageDraftStatus(
    isDraftable
      ? "This contact-oriented Suggested Next Action can create an editable draft. Review before using; Talent Rediscovery will not send it."
      : "Message drafts are unavailable unless the Suggested Next Action is to contact or recontact.",
  );
}

function createDraftableMatch(candidateRecord, searchRequest) {
  return {
    candidateRecord,
    searchRequest,
    suggestedNextAction: "Recontact this Candidate to validate current interest and availability.",
  };
}

function setMessageDraftStatus(message, isError = false) {
  if (!messageDraftStatus) {
    return;
  }

  messageDraftStatus.textContent = message;
  messageDraftStatus.dataset.state = isError ? "error" : "ready";
}

updateSearchAvailability();
