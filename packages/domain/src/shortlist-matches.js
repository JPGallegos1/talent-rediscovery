const strengthLabels = ["Strong", "Possible", "Weak"];

const skillAliases = {
  js: "javascript",
  node: "nodejs",
  "node js": "nodejs",
  "node.js": "nodejs",
  postgres: "postgresql",
  ts: "typescript",
};

export function buildShortlist(candidateRecords, searchCriteria, options = {}) {
  const limit = options.limit ?? 6;
  const candidateNotes = options.candidateNotes ?? [];

  if (!Array.isArray(candidateRecords) || candidateRecords.length === 0 || !searchCriteria) {
    return [];
  }

  return candidateRecords
    .map((candidateRecord) => evaluateCandidateRecord(candidateRecord, searchCriteria, candidateNotes))
    .filter(({ match }) => match.evidence.length > 0)
    .sort((left, right) => right.rank - left.rank || left.match.candidateRecord.rowNumber - right.match.candidateRecord.rowNumber)
    .slice(0, limit)
    .map(({ match }) => match);
}

function evaluateCandidateRecord(candidateRecord, searchCriteria, candidateNotes) {
  const { canonicalFields } = candidateRecord;
  const evidence = [];
  const reasons = [];
  const gaps = [];
  const risks = [];
  let rank = 0;

  for (const skill of searchCriteria.skills ?? []) {
    const matchedSkill = findSkillEvidence(canonicalFields.skills, canonicalFields.currentRole, skill);

    if (matchedSkill) {
      rank += 3;
      addEvidence(evidence, "skills", "Skills", canonicalFields.skills.raw, `Matched requested skill: ${skill}`);
      reasons.push(`Candidate Record shows ${matchedSkill} for requested ${skill} skill.`);
    } else {
      gaps.push(`No Candidate Record evidence for requested ${skill} skill.`);
    }
  }

  for (const industry of searchCriteria.industry ?? []) {
    const matchedIndustry = findTextEvidence(canonicalFields.industries, industry);

    if (matchedIndustry) {
      rank += 2;
      addEvidence(evidence, "industries", "Industries", canonicalFields.industries.join(", "), `Matched requested industry: ${industry}`);
      reasons.push(`Candidate Record includes ${matchedIndustry} industry context.`);
    } else {
      gaps.push(`No Candidate Record evidence for requested ${industry} industry context.`);
    }
  }

  for (const location of searchCriteria.location ?? []) {
    if (includesNormalized(canonicalFields.location, location)) {
      rank += location.toLowerCase() === "remote" ? 2 : 1;
      addEvidence(evidence, "location", "Location", canonicalFields.location, `Matched requested location: ${location}`);
      reasons.push(`Location evidence matches ${location}.`);
    } else {
      gaps.push(`No Candidate Record evidence for requested ${location} location preference.`);
    }
  }

  if (searchCriteria.languageLevel) {
    const languageMatch = compareEnglishLevel(canonicalFields.englishLevel, searchCriteria.languageLevel);

    if (languageMatch === "match") {
      rank += 2;
      addEvidence(evidence, "englishLevel", "English level", canonicalFields.englishLevel, searchCriteria.languageLevel);
      reasons.push(`English evidence supports ${searchCriteria.languageLevel}.`);
    } else if (languageMatch === "partial") {
      rank += 1;
      addEvidence(evidence, "englishLevel", "English level", canonicalFields.englishLevel, `Partially supports ${searchCriteria.languageLevel}`);
      risks.push(`Validate whether ${canonicalFields.englishLevel} is enough for ${searchCriteria.languageLevel}.`);
    } else {
      gaps.push("Missing or insufficient Candidate Record evidence for the requested English level.");
    }
  }

  if (searchCriteria.seniority) {
    const seniorityEvidence = findSeniorityEvidence(canonicalFields);

    if (seniorityEvidence) {
      rank += 2;
      addEvidence(evidence, "seniority", "Seniority", seniorityEvidence, searchCriteria.seniority);
      reasons.push(`Candidate Record has seniority evidence: ${seniorityEvidence}.`);
    } else {
      gaps.push(`No explicit Candidate Record evidence for ${searchCriteria.seniority} seniority.`);
    }
  }

  if (searchCriteria.availability) {
    if (includesAvailability(canonicalFields.availability, searchCriteria.availability)) {
      rank += 1;
      addEvidence(evidence, "availability", "Availability", canonicalFields.availability, searchCriteria.availability);
      reasons.push(`Availability evidence is compatible with ${searchCriteria.availability}.`);
    } else {
      gaps.push(`No Candidate Record evidence for requested availability: ${searchCriteria.availability}.`);
    }
  }

  rank += addCandidateNoteEvidence(candidateRecord, searchCriteria, candidateNotes, evidence, reasons);

  addRecordGaps(candidateRecord, gaps);
  addRecordRisks(canonicalFields, risks);

  if (reasons.length === 0 && evidence.length > 0) {
    reasons.push("Candidate Record has partial evidence related to the Search Criteria.");
  }

  if (risks.length === 0) {
    risks.push("Validate current interest and availability before recontacting this Candidate.");
  }

  if (gaps.length === 0) {
    gaps.push("No obvious missing requested criteria; still validate details with the Candidate.");
  }

  return {
    rank,
    match: {
      candidateRecord,
      strength: strengthForRank(rank),
      reasons: uniqueStrings(reasons),
      evidence: uniqueEvidence(evidence),
      gaps: uniqueStrings(gaps),
      risks: uniqueStrings(risks),
      suggestedNextAction: suggestNextAction(rank, gaps, risks),
    },
  };
}

function addCandidateNoteEvidence(candidateRecord, searchCriteria, candidateNotes, evidence, reasons) {
  const confirmedNotes = candidateNotes.filter((note) => {
    return note.candidateId === candidateRecord.candidateId && note.confirmed !== false && note.durable !== false;
  });
  let rank = 0;

  for (const note of confirmedNotes) {
    for (const skill of searchCriteria.skills ?? []) {
      if (includesNormalized(note.content, skill)) {
        rank += 2;
        addEvidence(evidence, "candidateNote", "Candidate Note", note.content, `Matched requested skill: ${skill}`, "Candidate Note");
        reasons.push(`Candidate Note confirms ${skill} context.`);
      }
    }

    for (const industry of searchCriteria.industry ?? []) {
      if (includesNormalized(note.content, industry)) {
        rank += 2;
        addEvidence(evidence, "candidateNote", "Candidate Note", note.content, `Matched requested industry: ${industry}`, "Candidate Note");
        reasons.push(`Candidate Note confirms ${industry} context.`);
      }
    }

    for (const location of searchCriteria.location ?? []) {
      if (includesNormalized(note.content, location)) {
        rank += 1;
        addEvidence(evidence, "candidateNote", "Candidate Note", note.content, `Matched requested location: ${location}`, "Candidate Note");
        reasons.push(`Candidate Note confirms ${location} preference.`);
      }
    }

    if (searchCriteria.availability && includesNormalized(note.content, searchCriteria.availability)) {
      rank += 1;
      addEvidence(evidence, "candidateNote", "Candidate Note", note.content, searchCriteria.availability, "Candidate Note");
      reasons.push(`Candidate Note confirms availability context.`);
    }
  }

  return rank;
}

function findSkillEvidence(skills, currentRole, requestedSkill) {
  const requested = normalizeSkill(requestedSkill);
  const role = normalizeSkill(currentRole);

  if (role && (role.includes(requested) || requested.includes(role))) {
    return currentRole;
  }

  const index = skills.normalizedTerms.findIndex((term) => term === requested || term.includes(requested) || requested.includes(term));

  return index >= 0 ? skills.terms[index] : "";
}

function findTextEvidence(values, requestedValue) {
  return values.find((value) => includesNormalized(value, requestedValue)) ?? "";
}

function includesNormalized(value, requestedValue) {
  return normalizeText(value).includes(normalizeText(requestedValue));
}

function compareEnglishLevel(recordValue, requestedValue) {
  if (!recordValue) {
    return "none";
  }

  const recordRank = englishRank(recordValue);
  const requestedRank = englishRank(requestedValue);

  if (recordRank >= requestedRank) {
    return "match";
  }

  return recordRank > 0 ? "partial" : "none";
}

function englishRank(value) {
  const normalized = normalizeText(value);

  if (/(c2|c1|advanced|fluent|strong)/.test(normalized)) {
    return 3;
  }

  if (/(b2|good|upper intermediate)/.test(normalized)) {
    return 2;
  }

  if (/(b1|intermediate|english mentioned)/.test(normalized)) {
    return 1;
  }

  return 0;
}

function findSeniorityEvidence(canonicalFields) {
  const role = canonicalFields.currentRole;
  const years = Number.parseFloat(canonicalFields.yearsExperience);

  if (/senior|sr\.?|lead|staff|principal|architect/i.test(role)) {
    return role;
  }

  if (Number.isFinite(years) && years >= 6) {
    return `${canonicalFields.yearsExperience} years experience`;
  }

  return "";
}

function includesAvailability(recordValue, requestedValue) {
  const record = normalizeText(recordValue);
  const requested = normalizeText(requestedValue);

  if (!record) {
    return false;
  }

  if (/available now|immediate|immediately/.test(requested)) {
    return /available now|actively looking|open to offers/.test(record);
  }

  const requestedDays = daysFromText(requested);
  const recordDays = daysFromText(record);

  if (requestedDays && recordDays) {
    return recordDays <= requestedDays;
  }

  return record.includes(requested) || /actively looking|open to offers/.test(record);
}

function daysFromText(value) {
  const match = value.match(/(\d{1,2})\s*(day|days|week|weeks)/);

  if (!match) {
    return 0;
  }

  return Number(match[1]) * (match[2].startsWith("week") ? 7 : 1);
}

function addRecordGaps(candidateRecord, gaps) {
  for (const gap of candidateRecord.gaps) {
    if (["name", "source"].includes(gap.field)) {
      continue;
    }

    gaps.push(`Missing Candidate Record field: ${gap.label}.`);
  }
}

function addRecordRisks(canonicalFields, risks) {
  if (/unknown|maybe|not looking/i.test(canonicalFields.availability)) {
    risks.push(`Availability needs validation: ${canonicalFields.availability}.`);
  }

  if (/45|60/.test(canonicalFields.availability)) {
    risks.push(`Notice period may be too long: ${canonicalFields.availability}.`);
  }

  if (isStaleDate(canonicalFields.lastContactDate)) {
    risks.push(`Last contact may be stale: ${canonicalFields.lastContactDate}.`);
  }
}

function isStaleDate(value) {
  const year = Number.parseInt(String(value).slice(0, 4), 10);

  return Number.isFinite(year) && year < 2026;
}

function addEvidence(evidence, field, label, value, matched, source = "Candidate Record") {
  if (!value) {
    return;
  }

  evidence.push({
    source,
    field,
    label,
    value,
    matched,
  });
}

function strengthForRank(rank) {
  if (rank >= 6) {
    return strengthLabels[0];
  }

  if (rank >= 3) {
    return strengthLabels[1];
  }

  return strengthLabels[2];
}

function suggestNextAction(rank, gaps, risks) {
  if (rank >= 6 && risks.length <= 1) {
    return "Prepare a recontact message grounded in the listed evidence.";
  }

  if (gaps.length > 2 || risks.length > 1) {
    return "Validate missing criteria and risks before advancing this Match.";
  }

  return "Save for recruiter review and confirm availability.";
}

function uniqueEvidence(evidence) {
  const seen = new Set();

  return evidence.filter((item) => {
    const key = `${item.source}:${item.field}:${item.value}:${item.matched}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function uniqueStrings(values) {
  return [...new Set(values)];
}

function normalizeSkill(value) {
  const normalized = normalizeText(value);

  return skillAliases[normalized] ?? normalized;
}

function normalizeText(value) {
  return String(value).toLowerCase().replaceAll(/[^a-z0-9]+/g, " ").trim();
}
