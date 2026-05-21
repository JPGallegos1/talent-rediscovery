import { createClient } from "@supabase/supabase-js";
import type { CandidateRecord } from "@recollect/domain/csv-candidate-records.js";
import type { SearchCriteria } from "@recollect/domain/search-criteria.js";
import { createMemorySync, createNoopMemorySync, type MemorySync } from "./memory-sync.js";

type ApiEnvironment = Record<string, string | undefined>;

type SupabaseQueryResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

export type SupabaseRecruitingMemoryClient = {
  from(table: string): any;
};

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

type CandidateRow = {
  id: string;
  created_at?: string;
  createdAt?: string;
};

type CandidateRecordRow = {
  id: string;
  candidate_id?: string;
  candidateId?: string;
  row_number?: number;
  rowNumber?: number;
  canonical_fields?: CandidateRecord["canonicalFields"];
  canonicalFields?: CandidateRecord["canonicalFields"];
  source_fields?: CandidateRecord["sourceFields"];
  sourceFields?: CandidateRecord["sourceFields"];
  source_field_mappings?: CandidateRecord["sourceFieldMappings"];
  sourceFieldMappings?: CandidateRecord["sourceFieldMappings"];
  gaps?: CandidateRecord["gaps"];
  search_terms?: string[];
  searchTerms?: string[];
  provenance: Provenance;
  possible_duplicate_candidate_record_ids?: string[];
  possibleDuplicateCandidateRecordIds?: string[];
};

type SearchRequestRow = {
  id: string;
  original_text?: string;
  originalText?: string;
  search_criteria?: SearchCriteria;
  searchCriteria?: SearchCriteria;
  criteria_editable?: boolean;
  criteriaEditable?: boolean;
  creator_id?: string | null;
  creatorId?: string | null;
  created_at?: string;
  createdAt?: string;
};

type CandidateNoteRow = {
  id: string;
  candidate_id?: string;
  candidateId?: string;
  content: string;
  provenance: CandidateNote["provenance"];
};

export function createRecruitingMemoryRepositoryFromEnv(
  env: ApiEnvironment = process.env,
  options: { client?: SupabaseRecruitingMemoryClient; memorySync?: MemorySync } = {},
): RecruitingMemoryRepository {
  const memorySync = options.memorySync ?? (
    env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
      ? createMemorySync(env.MEM0_API_URL)
      : createNoopMemorySync()
  );

  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    return createSupabaseRecruitingMemoryRepository({
      supabaseUrl: env.SUPABASE_URL,
      supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
      client: options.client,
      memorySync,
    });
  }

  return createMemoryRecruitingMemoryRepository({ memorySync });
}

export function createSupabaseRecruitingMemoryRepository(options: {
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  client?: SupabaseRecruitingMemoryClient;
  memorySync?: MemorySync;
}): RecruitingMemoryRepository {
  const client = options.client ?? createClient(options.supabaseUrl ?? "", options.supabaseServiceRoleKey ?? "");
  const memorySync = options.memorySync ?? createNoopMemorySync();

  return {
    async importCandidateRecords(input) {
      const createdAt = new Date().toISOString();
      const candidateRows = input.candidateRecords.map(() => ({ created_at: createdAt }));
      const insertedCandidates = await unwrap<CandidateRow[]>(
        client.from("candidates").insert(candidateRows).select("id, created_at"),
      );
      const candidates = insertedCandidates.map(toCandidate);
      let insertedRecordIds: string[] = [];

      try {
        const recordRows = input.candidateRecords.map((record, index) => {
          const provenance: Provenance = {
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
          };

          return {
            candidate_id: candidates[index].id,
            row_number: record.rowNumber,
            canonical_fields: record.canonicalFields,
            source_fields: record.sourceFields,
            source_field_mappings: record.sourceFieldMappings,
            gaps: record.gaps,
            search_terms: record.searchTerms,
            provenance,
            possible_duplicate_candidate_record_ids: [],
          };
        });
        const insertedRecords = await unwrap<CandidateRecordRow[]>(
          client.from("candidate_records").insert(recordRows).select("*"),
        );
        insertedRecordIds = insertedRecords.map((record) => record.id);
        const insertedIds = new Set(insertedRecordIds);
        const allRecords = await listSupabaseCandidateRecords(client);

        flagPossibleDuplicates(allRecords);
        await persistDuplicateFlags(client, allRecords);

        const candidateRecords = allRecords.filter((record) => insertedIds.has(record.id));

        scheduleMemorySync(() => memorySync.syncCandidateImport(candidates, candidateRecords));

        return {
          imported: {
            candidateCount: candidates.length,
            candidateRecordCount: candidateRecords.length,
          },
          candidates,
          candidateRecords,
        };
      } catch (error) {
        await rollbackCandidateRecordImport(client, {
          candidateIds: candidates.map((candidate) => candidate.id),
          candidateRecordIds: insertedRecordIds,
        });
        throw error;
      }
    },
    async listCandidateRecords() {
      const records = await listSupabaseCandidateRecords(client);
      flagPossibleDuplicates(records);

      return records;
    },
    async createSearchRequest(input) {
      const row = await unwrap<SearchRequestRow>(
        client
          .from("search_requests")
          .insert({
            original_text: input.originalText,
            search_criteria: input.searchCriteria,
            criteria_editable: false,
            creator_id: input.creatorId ?? null,
          })
          .select("*")
          .single(),
      );

      const searchRequest = toSearchRequest(row);
      scheduleMemorySync(() => memorySync.syncSearchRequest(searchRequest));
      return searchRequest;
    },
    async listSearchRequests() {
      const rows = await unwrap<SearchRequestRow[]>(
        client.from("search_requests").select("*").order("created_at", { ascending: true }),
      );

      return rows.map(toSearchRequest);
    },
    async candidateExists(candidateId) {
      const result = await client.from("candidates").select("id").eq("id", candidateId).maybeSingle() as SupabaseQueryResult<CandidateRow>;

      if (result.error) {
        throw new Error(result.error.message);
      }

      return Boolean(result.data);
    },
    async confirmCandidateNote(input) {
      const now = new Date().toISOString();
      const provenance: CandidateNote["provenance"] = {
        sourceType: input.sourceType,
        creatorId: input.creatorId ?? null,
        createdAt: now,
        confirmerId: input.confirmerId,
        confirmedAt: now,
        uncertainty: null,
        staleness: null,
      };
      const row = await unwrap<CandidateNoteRow>(
        client
          .from("candidate_notes")
          .insert({
            candidate_id: input.candidateId,
            content: input.content,
            provenance,
          })
          .select("*")
          .single(),
      );

      const note = toCandidateNote(row);
      scheduleMemorySync(() => memorySync.syncConfirmedNote(note));
      return note;
    },
    async listCandidateNotes(candidateId) {
      const rows = await unwrap<CandidateNoteRow[]>(
        client.from("candidate_notes").select("*").eq("candidate_id", candidateId).order("id", { ascending: true }),
      );

      return rows.map(toCandidateNote);
    },
  };
}

export function createMemoryRecruitingMemoryRepository(options: { memorySync?: MemorySync } = {}): RecruitingMemoryRepository {
  const memorySync = options.memorySync ?? createNoopMemorySync();
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

      scheduleMemorySync(() => memorySync.syncCandidateImport(importedCandidates, importedCandidateRecords));

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

      scheduleMemorySync(() => memorySync.syncSearchRequest(searchRequest));

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

      scheduleMemorySync(() => memorySync.syncConfirmedNote(candidateNote));

      return candidateNote;
    },
    async listCandidateNotes(candidateId) {
      return candidateNotes.filter((candidateNote) => candidateNote.candidateId === candidateId);
    },
  };
}

function scheduleMemorySync(sync: () => Promise<void>): void {
  try {
    void sync().catch((error) => {
      console.error("mem0 sync error:", error);
    });
  } catch (error) {
    console.error("mem0 sync error:", error);
  }
}

async function unwrap<T>(query: PromiseLike<SupabaseQueryResult<T>>): Promise<T> {
  const result = await query;

  if (result.error) {
    throw new Error(result.error.message);
  }

  if (result.data === null) {
    throw new Error("Supabase returned no data.");
  }

  return result.data;
}

async function listSupabaseCandidateRecords(client: SupabaseRecruitingMemoryClient) {
  const rows = await unwrap<CandidateRecordRow[]>(
    client.from("candidate_records").select("*").order("row_number", { ascending: true }),
  );

  return rows.map(toCandidateRecord);
}

async function persistDuplicateFlags(client: SupabaseRecruitingMemoryClient, records: PersistedCandidateRecord[]) {
  await Promise.all(
    records.map((record) => {
      return unwrap<Pick<CandidateRecordRow, "id">[]>(
        client
          .from("candidate_records")
          .update({ possible_duplicate_candidate_record_ids: record.possibleDuplicateCandidateRecordIds })
          .eq("id", record.id)
          .select("id"),
      );
    }),
  );
}

async function rollbackCandidateRecordImport(
  client: SupabaseRecruitingMemoryClient,
  rollback: { candidateIds: string[]; candidateRecordIds: string[] },
) {
  try {
    if (rollback.candidateRecordIds.length > 0) {
      await unwrap<Pick<CandidateRecordRow, "id">[]>(
        client.from("candidate_records").delete().in("id", rollback.candidateRecordIds).select("id"),
      );
    }

    if (rollback.candidateIds.length > 0) {
      await unwrap<Pick<CandidateRow, "id">[]>(
        client.from("candidates").delete().in("id", rollback.candidateIds).select("id"),
      );
    }
  } catch (rollbackError) {
    console.error("Supabase Candidate Record import rollback failed", rollbackError);
  }
}

function toCandidate(row: CandidateRow): Candidate {
  return {
    id: row.id,
    createdAt: row.created_at ?? row.createdAt ?? "",
  };
}

function toCandidateRecord(row: CandidateRecordRow): PersistedCandidateRecord {
  return {
    id: row.id,
    candidateId: row.candidate_id ?? row.candidateId ?? "",
    rowNumber: row.row_number ?? row.rowNumber ?? 0,
    canonicalFields: row.canonical_fields ?? row.canonicalFields ?? emptyCanonicalFields(),
    sourceFields: row.source_fields ?? row.sourceFields ?? {},
    sourceFieldMappings: row.source_field_mappings ?? row.sourceFieldMappings ?? {},
    gaps: row.gaps ?? [],
    searchTerms: row.search_terms ?? row.searchTerms ?? [],
    provenance: row.provenance,
    possibleDuplicateCandidateRecordIds: row.possible_duplicate_candidate_record_ids ?? row.possibleDuplicateCandidateRecordIds ?? [],
  };
}

function toSearchRequest(row: SearchRequestRow): SearchRequestMemory {
  return {
    id: row.id,
    originalText: row.original_text ?? row.originalText ?? "",
    searchCriteria: row.search_criteria ?? row.searchCriteria ?? {},
    criteriaEditable: false,
    creatorId: row.creator_id ?? row.creatorId ?? null,
    createdAt: row.created_at ?? row.createdAt ?? "",
  };
}

function toCandidateNote(row: CandidateNoteRow): CandidateNote {
  return {
    id: row.id,
    candidateId: row.candidate_id ?? row.candidateId ?? "",
    content: row.content,
    provenance: row.provenance,
  };
}

function emptyCanonicalFields(): CandidateRecord["canonicalFields"] {
  return {
    name: "",
    currentRole: "",
    skills: {
      raw: "",
      terms: [],
      normalizedTerms: [],
    },
    yearsExperience: "",
    location: "",
    englishLevel: "",
    industries: [],
    availability: "",
    source: "",
    lastContactDate: "",
    salaryExpectationUsd: "",
    notes: "",
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
