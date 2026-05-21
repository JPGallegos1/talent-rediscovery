const contactActionPattern = /\b(contact|recontact|reach out|message|email)\b/i;

export function canDraftMessageFromSuggestedNextAction(suggestedNextAction) {
  return contactActionPattern.test(String(suggestedNextAction ?? ""));
}

export function draftMessageFromMatch(match) {
  if (!match || typeof match !== "object") {
    throw new Error("A Match is required to draft a message.");
  }

  const suggestedNextAction = match.suggestedNextAction ?? "";

  if (!canDraftMessageFromSuggestedNextAction(suggestedNextAction)) {
    throw new Error("Message drafts are only available for contact or recontact Suggested Next Actions.");
  }

  const candidateRecord = match.candidateRecord;
  const canonicalFields = candidateRecord?.canonicalFields ?? {};
  const candidateName = canonicalFields.name || "there";
  const recruiterContext = buildRecruiterContext(canonicalFields);
  const roleContext = match.searchRequest ? `I'm reaching out because of this role/search context: ${match.searchRequest}` : "I'm reaching out about a role that may be relevant to your background.";
  const candidateContext = recruiterContext ? `I noticed your background includes ${recruiterContext}.` : "I noticed your background may be relevant.";

  return [
    `Hi ${candidateName},`,
    "",
    `${candidateContext} ${roleContext}`,
    "",
    "Would you be open to a quick conversation so I can validate your current interest, availability, and fit before sharing more details?",
    "",
    "Best,",
  ].join("\n");
}

function buildRecruiterContext(canonicalFields) {
  const context = [
    canonicalFields.currentRole,
    formatList(canonicalFields.skills?.terms),
    formatList(canonicalFields.industries),
    canonicalFields.location,
    canonicalFields.englishLevel,
  ].filter(Boolean);

  return context.join("; ");
}

function formatList(values) {
  return Array.isArray(values) && values.length > 0 ? values.join(", ") : "";
}
