import type { CandidateRecord } from "./csv-candidate-records.js";

export type ImportTalentPoolResult = {
  imported: {
    candidateCount: number;
    candidateRecordCount: number;
  };
  candidateRecords: CandidateRecord[];
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
