export type SearchCriteria = Partial<{
  skills: string[];
  seniority: string;
  location: string[];
  industry: string[];
  languageLevel: string;
  availability: string;
}>;

export function interpretSearchCriteria(searchRequest: string): SearchCriteria | null;
