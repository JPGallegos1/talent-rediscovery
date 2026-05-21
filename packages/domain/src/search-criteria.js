const skillDictionary = [
  "Backend",
  "Frontend",
  "Full Stack",
  "React",
  "Node.js",
  "TypeScript",
  "JavaScript",
  "Python",
  "FastAPI",
  "Django",
  "AWS",
  "Kubernetes",
  "PostgreSQL",
  "SQL",
  "Data Engineering",
  "Machine Learning",
  "Product Management",
];

const industryDictionary = ["fintech", "healthtech", "ecommerce", "marketplace", "banking", "retail", "saas"];
const locationDictionary = ["remote", "hybrid", "onsite", "colombia", "mexico", "argentina", "chile", "peru", "latam"];

export function interpretSearchCriteria(searchRequest) {
  const normalizedRequest = searchRequest.trim().toLowerCase();

  if (!normalizedRequest) {
    return null;
  }

  const criteria = {
    skills: matchKnownTerms(normalizedRequest, skillDictionary),
    seniority: extractSeniority(normalizedRequest),
    location: matchKnownTerms(normalizedRequest, locationDictionary),
    industry: matchKnownTerms(normalizedRequest, industryDictionary),
    languageLevel: extractLanguageLevel(normalizedRequest),
    availability: extractAvailability(normalizedRequest),
  };

  return Object.fromEntries(Object.entries(criteria).filter(([, value]) => hasCriteriaValue(value)));
}

function matchKnownTerms(normalizedRequest, dictionary) {
  return dictionary.filter((term) => normalizedRequest.includes(term.toLowerCase()));
}

function extractSeniority(normalizedRequest) {
  if (/(staff|principal|architect)\b/.test(normalizedRequest)) {
    return "Staff or Principal";
  }

  if (/(senior|sr\.?|lead)\b/.test(normalizedRequest)) {
    return "Senior or Lead";
  }

  if (/(mid|intermediate)\b/.test(normalizedRequest)) {
    return "Mid-level";
  }

  if (/(junior|jr\.?)\b/.test(normalizedRequest)) {
    return "Junior";
  }

  return "";
}

function extractLanguageLevel(normalizedRequest) {
  if (!normalizedRequest.includes("english")) {
    return "";
  }

  if (/(fluent|advanced|c1|c2|strong)\s+english|english\s+(fluent|advanced|c1|c2|strong)/.test(normalizedRequest)) {
    return "Advanced English";
  }

  if (/(good|b2|upper intermediate)\s+english|english\s+(good|b2|upper intermediate)/.test(normalizedRequest)) {
    return "Good English";
  }

  return "English mentioned";
}

function extractAvailability(normalizedRequest) {
  if (/(available now|immediate|immediately)\b/.test(normalizedRequest)) {
    return "Available now";
  }

  const noticeMatch = normalizedRequest.match(/\b(\d{1,2})\s*(day|days|week|weeks)\b/);

  if (noticeMatch) {
    return `${noticeMatch[1]} ${noticeMatch[2]}`;
  }

  if (normalizedRequest.includes("notice")) {
    return "Notice period mentioned";
  }

  return "";
}

function hasCriteriaValue(value) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}
