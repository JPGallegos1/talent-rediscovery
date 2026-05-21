const canonicalFieldMap = {
  name: ["candidate_name", "candidate", "contact_name", "full_name", "name"],
  currentRole: ["current_role", "current_title", "job_title", "position", "role", "title"],
  skills: ["core_skills", "skills", "skillset", "stack", "tech_stack", "technologies", "tools"],
  yearsExperience: ["experience", "experience_years", "total_experience", "years", "years_experience", "yrs_exp"],
  location: ["city", "country", "location", "region", "timezone"],
  englishLevel: ["english", "english_level", "english_proficiency", "language_level", "languages"],
  industries: ["domain", "industries", "industry", "sector", "vertical"],
  availability: ["availability", "available_from", "notice", "notice_period", "status"],
  source: ["origin", "pipeline", "source", "source_file"],
  lastContactDate: ["contacted_at", "last_contact", "last_contact_date", "last_contacted", "last_reached_out"],
  salaryExpectationUsd: ["expected_salary", "rate", "salary", "salary_expectation", "salary_expectation_usd"],
  notes: ["comments", "notes", "profile_notes", "recruiter_notes", "summary"],
};

const canonicalFieldLabels = {
  name: "Name",
  currentRole: "Current role",
  skills: "Skills",
  yearsExperience: "Years experience",
  location: "Location",
  englishLevel: "English level",
  industries: "Industries",
  availability: "Availability",
  source: "Source",
  lastContactDate: "Last contact",
  salaryExpectationUsd: "Salary expectation",
  notes: "Notes",
};

const skillAliases = {
  js: "javascript",
  node: "nodejs",
  "node js": "nodejs",
  "node.js": "nodejs",
  postgres: "postgresql",
  ts: "typescript",
};

export function parseCsvTalentPool(csvText) {
  const rows = parseCsvRows(csvText);

  if (rows.length === 0 || rows.every((row) => row.every((value) => value.trim() === ""))) {
    throw new Error("The Talent Pool File is empty.");
  }

  const headers = rows[0].map((header) => header.trim());
  const hasHeader = headers.some(Boolean);

  if (!hasHeader) {
    throw new Error("The Talent Pool File needs a header row.");
  }

  const candidateRecords = rows
    .slice(1)
    .filter((row) => row.some((value) => value.trim() !== ""))
    .map((row, index) => toCandidateRecord(headers, row, index + 2));

  if (candidateRecords.length === 0) {
    throw new Error("The Talent Pool File has headers but no Candidate Records.");
  }

  return {
    headers,
    candidateRecords,
  };
}

function parseCsvRows(csvText) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      if (field.length > 0) {
        throw new Error("The Talent Pool File has invalid CSV quoting.");
      }
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      if (nextChar === "\n") {
        continue;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (inQuotes) {
    throw new Error("The Talent Pool File has an unclosed quoted value.");
  }

  row.push(field);
  rows.push(row);

  return rows;
}

function toCandidateRecord(headers, row, rowNumber) {
  const sourceFields = Object.fromEntries(
    headers.map((header, index) => [header || `Column ${index + 1}`, row[index]?.trim() ?? ""]),
  );
  const sourceFieldMappings = mapCanonicalHeaders(sourceFields);
  const canonicalFields = {
    name: pickCanonicalValue(sourceFields, sourceFieldMappings.name),
    currentRole: pickCanonicalValue(sourceFields, sourceFieldMappings.currentRole),
    skills: normalizeSkills(pickCanonicalValue(sourceFields, sourceFieldMappings.skills)),
    yearsExperience: pickCanonicalValue(sourceFields, sourceFieldMappings.yearsExperience),
    location: pickCanonicalValue(sourceFields, sourceFieldMappings.location),
    englishLevel: pickCanonicalValue(sourceFields, sourceFieldMappings.englishLevel),
    industries: splitList(pickCanonicalValue(sourceFields, sourceFieldMappings.industries)),
    availability: pickCanonicalValue(sourceFields, sourceFieldMappings.availability),
    source: pickCanonicalValue(sourceFields, sourceFieldMappings.source),
    lastContactDate: pickCanonicalValue(sourceFields, sourceFieldMappings.lastContactDate),
    salaryExpectationUsd: pickCanonicalValue(sourceFields, sourceFieldMappings.salaryExpectationUsd),
    notes: pickCanonicalValue(sourceFields, sourceFieldMappings.notes),
  };

  return {
    rowNumber,
    canonicalFields,
    sourceFields,
    sourceFieldMappings,
    gaps: findGaps(canonicalFields),
    searchTerms: buildSearchTerms(canonicalFields, sourceFields),
  };
}

function mapCanonicalHeaders(sourceFields) {
  return Object.fromEntries(
    Object.entries(canonicalFieldMap).map(([canonicalField, acceptedHeaders]) => {
      const sourceHeader = Object.keys(sourceFields).find((header) => acceptedHeaders.includes(normalizeHeader(header)));

      return [canonicalField, sourceHeader ?? ""];
    }),
  );
}

function pickCanonicalValue(sourceFields, sourceHeader) {
  if (!sourceHeader) {
    return "";
  }

  return sourceFields[sourceHeader] ?? "";
}

function normalizeHeader(header) {
  return header.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, "_").replaceAll(/^_|_$/g, "");
}

function splitList(value) {
  return value
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSkills(rawValue) {
  const terms = splitList(rawValue);

  return {
    raw: rawValue,
    terms,
    normalizedTerms: [...new Set(terms.map(normalizeSkillTerm).filter(Boolean))],
  };
}

function normalizeSkillTerm(value) {
  const normalized = value.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, " ").trim();

  return skillAliases[normalized] ?? normalized;
}

function findGaps(canonicalFields) {
  return Object.entries(canonicalFields)
    .filter(([, value]) => isMissingCanonicalValue(value))
    .map(([field]) => ({ field, label: canonicalFieldLabels[field] }));
}

function isMissingCanonicalValue(value) {
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (value && typeof value === "object") {
    return !value.raw;
  }

  return !value;
}

function buildSearchTerms(canonicalFields, sourceFields) {
  const searchableValues = [
    canonicalFields.name,
    canonicalFields.currentRole,
    canonicalFields.location,
    canonicalFields.englishLevel,
    canonicalFields.availability,
    canonicalFields.lastContactDate,
    canonicalFields.notes,
    ...canonicalFields.industries,
    ...canonicalFields.skills.terms,
    ...canonicalFields.skills.normalizedTerms,
    ...Object.entries(sourceFields).flat(),
  ];

  return [...new Set(searchableValues.flatMap((value) => normalizeSearchValue(value)).filter(Boolean))];
}

function normalizeSearchValue(value) {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9.]+/)
    .map((term) => skillAliases[term] ?? term)
    .filter(Boolean);
}
