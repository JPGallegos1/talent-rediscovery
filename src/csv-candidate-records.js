const canonicalFieldMap = {
  name: ["candidate_name", "name", "full_name", "candidate"],
  currentRole: ["current_role", "role", "title", "job_title"],
  skills: ["skills", "skillset", "technologies"],
  yearsExperience: ["years_experience", "experience_years", "years"],
  location: ["location", "city", "country"],
  englishLevel: ["english_level", "english", "language_level"],
  industries: ["industries", "industry", "sector"],
  availability: ["availability", "notice_period"],
  source: ["source", "origin"],
  lastContactDate: ["last_contact_date", "last_contact", "contacted_at"],
  salaryExpectationUsd: ["salary_expectation_usd", "salary_expectation", "expected_salary"],
  notes: ["notes", "comments", "summary"],
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

  return {
    rowNumber,
    name: pickCanonicalValue(sourceFields, canonicalFieldMap.name),
    currentRole: pickCanonicalValue(sourceFields, canonicalFieldMap.currentRole),
    skills: splitList(pickCanonicalValue(sourceFields, canonicalFieldMap.skills)),
    yearsExperience: pickCanonicalValue(sourceFields, canonicalFieldMap.yearsExperience),
    location: pickCanonicalValue(sourceFields, canonicalFieldMap.location),
    englishLevel: pickCanonicalValue(sourceFields, canonicalFieldMap.englishLevel),
    industries: splitList(pickCanonicalValue(sourceFields, canonicalFieldMap.industries)),
    availability: pickCanonicalValue(sourceFields, canonicalFieldMap.availability),
    source: pickCanonicalValue(sourceFields, canonicalFieldMap.source),
    lastContactDate: pickCanonicalValue(sourceFields, canonicalFieldMap.lastContactDate),
    salaryExpectationUsd: pickCanonicalValue(sourceFields, canonicalFieldMap.salaryExpectationUsd),
    notes: pickCanonicalValue(sourceFields, canonicalFieldMap.notes),
    sourceFields,
  };
}

function pickCanonicalValue(sourceFields, acceptedHeaders) {
  const sourceEntry = Object.entries(sourceFields).find(([header]) =>
    acceptedHeaders.includes(normalizeHeader(header)),
  );

  return sourceEntry?.[1] ?? "";
}

function normalizeHeader(header) {
  return header.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, "_").replaceAll(/^_|_$/g, "");
}

function splitList(value) {
  return value
    .split(/[;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
