export type CandidateRecordGap = {
  field: string;
  label: string;
};

export type CandidateRecord = {
  rowNumber: number;
  canonicalFields: {
    name: string;
    currentRole: string;
    skills: {
      raw: string;
      terms: string[];
      normalizedTerms: string[];
    };
    yearsExperience: string;
    location: string;
    englishLevel: string;
    industries: string[];
    availability: string;
    source: string;
    lastContactDate: string;
    salaryExpectationUsd: string;
    notes: string;
  };
  sourceFields: Record<string, string>;
  sourceFieldMappings: Record<string, string>;
  gaps: CandidateRecordGap[];
  searchTerms: string[];
};

export type TalentPoolParseResult = {
  headers: string[];
  candidateRecords: CandidateRecord[];
};

export function parseCsvTalentPool(csvText: string): TalentPoolParseResult;
