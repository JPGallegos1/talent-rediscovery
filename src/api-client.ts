import type { CandidateMemory } from "./candidate-memory.js";
import type { CandidateRecord } from "./csv-candidate-records.js";
import type { SearchCriteria } from "./search-criteria.js";

export type ImportTalentPoolResult = {
  imported: {
    candidateCount: number;
    candidateRecordCount: number;
  };
  candidateRecords: CandidateRecord[];
};

export type SearchRequestMemory = {
  id: string;
  originalText: string;
  searchCriteria: SearchCriteria;
  criteriaEditable: false;
  creatorId: string | null;
  createdAt: string;
};

export type CreateSearchRequestResult = {
  searchRequest: SearchRequestMemory;
};

export type CandidateNoteMemory = {
  id: string;
  candidateId: string;
  content: string;
  provenance: {
    sourceType: string;
    creatorId: string | null;
    createdAt: string;
    confirmerId: string;
    confirmedAt: string;
    uncertainty: string | null;
    staleness: string | null;
  };
};

export type ListCandidateNotesResult = {
  candidateNotes: CandidateNoteMemory[];
};

export type GetCandidateMemoryResult = {
  candidateMemory: CandidateMemory;
};

type FetchLike = typeof fetch;

export async function importCsvTalentPool(
  payload: { fileName: string; csvText: string; creatorId?: string | null },
  fetchImpl: FetchLike = fetch,
): Promise<ImportTalentPoolResult> {
  const response = await fetchImpl("/api/talent-pool/import-csv", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null) as { error?: { message?: unknown } } | null;
    const message = typeof error?.error?.message === "string" ? error.error.message : "The Talent Pool File could not be imported.";

    throw new Error(message);
  }

  return response.json() as Promise<ImportTalentPoolResult>;
}

export async function createSearchRequest(
  payload: { searchRequest: string; creatorId?: string | null },
  fetchImpl: FetchLike = fetch,
): Promise<CreateSearchRequestResult> {
  const response = await fetchImpl("/api/search-requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null) as { error?: { message?: unknown } } | null;
    const message = typeof error?.error?.message === "string" ? error.error.message : "The Search Request could not be created.";

    throw new Error(message);
  }

  return response.json() as Promise<CreateSearchRequestResult>;
}

export async function listCandidateNotes(candidateIds: string[], fetchImpl: FetchLike = fetch): Promise<ListCandidateNotesResult> {
  const uniqueCandidateIds = Array.from(new Set(candidateIds.filter(Boolean)));

  if (uniqueCandidateIds.length === 0) {
    return { candidateNotes: [] };
  }

  const noteLists = await Promise.all(
    uniqueCandidateIds.map(async (candidateId) => {
      const response = await fetchImpl(`/api/candidates/${encodeURIComponent(candidateId)}/notes`);

      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: { message?: unknown } } | null;
        const message = typeof error?.error?.message === "string" ? error.error.message : "Candidate Notes could not be loaded.";

        throw new Error(message);
      }

      const payload = await response.json() as ListCandidateNotesResult;

      return payload.candidateNotes;
    }),
  );

  return { candidateNotes: noteLists.flat() };
}

export async function getCandidateMemory(candidateId: string, fetchImpl: FetchLike = fetch): Promise<GetCandidateMemoryResult> {
  const response = await fetchImpl(`/api/candidates/${encodeURIComponent(candidateId)}/memory`);

  if (!response.ok) {
    const error = await response.json().catch(() => null) as { error?: { message?: unknown } } | null;
    const message = typeof error?.error?.message === "string" ? error.error.message : "Candidate Memory could not be loaded.";

    throw new Error(message);
  }

  return response.json() as Promise<GetCandidateMemoryResult>;
}
