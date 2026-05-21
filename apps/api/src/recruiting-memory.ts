import type { CandidateRecord } from "@recollect/domain/csv-candidate-records.js";
import type { SearchCriteria } from "@recollect/domain/search-criteria.js";

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

export type SearchRequestMemory = {
  id: string;
  originalText: string;
  searchCriteria: SearchCriteria;
  criteriaEditable: false;
  creatorId: string | null;
  createdAt: string;
};

export type SearchRequestInput = {
  originalText: string;
  searchCriteria: SearchCriteria;
  creatorId?: string | null;
};

export type CandidateNoteSourceType = "manual" | "imported" | "transcribed" | "inferred";

export type CandidateNote = {
  id: string;
  candidateId: string;
  content: string;
  provenance: {
    sourceType: CandidateNoteSourceType;
    creatorId: string | null;
    createdAt: string;
    confirmerId: string;
    confirmedAt: string;
    uncertainty: string | null;
    staleness: string | null;
  };
};

export type CandidateNoteConfirmationInput = {
  candidateId: string;
  content: string;
  sourceType: CandidateNoteSourceType;
  creatorId?: string | null;
  confirmerId: string;
};

export type RecruitingMemoryRepository = {
  importCandidateRecords(input: CandidateRecordImportInput): Promise<CandidateRecordImportResult>;
  listCandidateRecords(): Promise<PersistedCandidateRecord[]>;
  createSearchRequest(input: SearchRequestInput): Promise<SearchRequestMemory>;
  listSearchRequests(): Promise<SearchRequestMemory[]>;
  candidateExists(candidateId: string): Promise<boolean>;
  confirmCandidateNote(input: CandidateNoteConfirmationInput): Promise<CandidateNote>;
  listCandidateNotes(candidateId: string): Promise<CandidateNote[]>;
};

export function createMemoryRecruitingMemoryRepository(): RecruitingMemoryRepository {
  const candidates: Candidate[] = [];
  const candidateRecords: PersistedCandidateRecord[] = [];
  const searchRequests: SearchRequestMemory[] = [];
  const candidateNotes: CandidateNote[] = [];
  let nextCandidateId = 1;
  let nextCandidateRecordId = 1;
  let nextSearchRequestId = 1;
  let nextCandidateNoteId = 1;

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
    async createSearchRequest(input) {
      const searchRequest: SearchRequestMemory = {
        id: `search_request_${nextSearchRequestId}`,
        originalText: input.originalText,
        searchCriteria: input.searchCriteria,
        criteriaEditable: false,
        creatorId: input.creatorId ?? null,
        createdAt: new Date().toISOString(),
      };
      nextSearchRequestId += 1;
      searchRequests.push(searchRequest);

      return searchRequest;
    },
    async listSearchRequests() {
      return searchRequests;
    },
    async candidateExists(candidateId) {
      return candidates.some((candidate) => candidate.id === candidateId);
    },
    async confirmCandidateNote(input) {
      const now = new Date().toISOString();
      const candidateNote: CandidateNote = {
        id: `candidate_note_${nextCandidateNoteId}`,
        candidateId: input.candidateId,
        content: input.content,
        provenance: {
          sourceType: input.sourceType,
          creatorId: input.creatorId ?? null,
          createdAt: now,
          confirmerId: input.confirmerId,
          confirmedAt: now,
          uncertainty: null,
          staleness: null,
        },
      };
      nextCandidateNoteId += 1;
      candidateNotes.push(candidateNote);

      return candidateNote;
    },
    async listCandidateNotes(candidateId) {
      return candidateNotes.filter((candidateNote) => candidateNote.candidateId === candidateId);
    },
  };
}

function flagPossibleDuplicates(records: PersistedCandidateRecord[]) {
  for (const record of records) {
    const recordKey = getDuplicateKey(record);
    if (!recordKey) {
      record.possibleDuplicateCandidateRecordIds = [];
      continue;
    }

    record.possibleDuplicateCandidateRecordIds = records
      .filter((candidateRecord) => candidateRecord.id !== record.id && getDuplicateKey(candidateRecord) === recordKey)
      .map((candidateRecord) => candidateRecord.id);
  }
}

function getDuplicateKey(record: PersistedCandidateRecord) {
  return record.canonicalFields.name.trim().toLowerCase();
}
