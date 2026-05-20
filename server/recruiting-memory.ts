import type { CandidateRecord } from "../src/csv-candidate-records.js";

export type Candidate = {
  id: string;
  createdAt: string;
};

export type Provenance = {
  sourceType: "imported";
  sourceReference: {
    fileName: string;
    rowNumber: number;
  };
  creatorId: string | null;
  createdAt: string;
  confirmerId: string | null;
  confirmedAt: string | null;
  uncertainty: string | null;
  staleness: string | null;
};

export type PersistedCandidateRecord = CandidateRecord & {
  id: string;
  candidateId: string;
  provenance: Provenance;
  possibleDuplicateCandidateRecordIds: string[];
};

export type CandidateRecordImportInput = {
  fileName: string;
  creatorId?: string | null;
  candidateRecords: CandidateRecord[];
};

export type CandidateRecordImportResult = {
  imported: {
    candidateCount: number;
    candidateRecordCount: number;
  };
  candidates: Candidate[];
  candidateRecords: PersistedCandidateRecord[];
};

export type RecruitingMemoryRepository = {
  importCandidateRecords(input: CandidateRecordImportInput): Promise<CandidateRecordImportResult>;
  listCandidateRecords(): Promise<PersistedCandidateRecord[]>;
};

export function createMemoryRecruitingMemoryRepository(): RecruitingMemoryRepository {
  const candidates: Candidate[] = [];
  const candidateRecords: PersistedCandidateRecord[] = [];
  let nextCandidateId = 1;
  let nextCandidateRecordId = 1;

  return {
    async importCandidateRecords(input) {
      const importedCandidates: Candidate[] = [];
      const importedCandidateRecords: PersistedCandidateRecord[] = [];
      const createdAt = new Date().toISOString();

      for (const record of input.candidateRecords) {
        const candidate: Candidate = {
          id: `candidate_${nextCandidateId}`,
          createdAt,
        };
        nextCandidateId += 1;

        const persistedRecord: PersistedCandidateRecord = {
          ...record,
          id: `candidate_record_${nextCandidateRecordId}`,
          candidateId: candidate.id,
          provenance: {
            sourceType: "imported",
            sourceReference: {
              fileName: input.fileName,
              rowNumber: record.rowNumber,
            },
            creatorId: input.creatorId ?? null,
            createdAt,
            confirmerId: null,
            confirmedAt: null,
            uncertainty: null,
            staleness: null,
          },
          possibleDuplicateCandidateRecordIds: [],
        };
        nextCandidateRecordId += 1;

        candidates.push(candidate);
        candidateRecords.push(persistedRecord);
        importedCandidates.push(candidate);
        importedCandidateRecords.push(persistedRecord);
      }

      flagPossibleDuplicates(candidateRecords);

      return {
        imported: {
          candidateCount: importedCandidates.length,
          candidateRecordCount: importedCandidateRecords.length,
        },
        candidates: importedCandidates,
        candidateRecords: importedCandidateRecords,
      };
    },
    async listCandidateRecords() {
      return candidateRecords;
    },
  };
}

function flagPossibleDuplicates(records: PersistedCandidateRecord[]) {
  for (const record of records) {
    const recordKey = getDuplicateKey(record);
    record.possibleDuplicateCandidateRecordIds = records
      .filter((candidateRecord) => candidateRecord.id !== record.id && getDuplicateKey(candidateRecord) === recordKey)
      .map((candidateRecord) => candidateRecord.id);
  }
}

function getDuplicateKey(record: PersistedCandidateRecord) {
  return record.canonicalFields.name.trim().toLowerCase();
}
