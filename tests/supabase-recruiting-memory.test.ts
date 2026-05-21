import { describe, expect, it } from "vitest";
import { parseCsvTalentPool } from "@recollect/domain/csv-candidate-records.js";
import { interpretSearchCriteria } from "@recollect/domain/search-criteria.js";
import {
  createRecruitingMemoryRepositoryFromEnv,
  createSupabaseRecruitingMemoryRepository,
} from "@recollect/api/recruiting-memory.js";

class FakeSupabaseClient {
  tables: Record<string, any[]> = {
    candidates: [],
    candidate_records: [],
    candidate_notes: [],
    search_requests: [],
  };
  counters: Record<string, number> = {
    candidates: 1,
    candidate_records: 1,
    candidate_notes: 1,
    search_requests: 1,
  };

  from(table: string) {
    return new FakeSupabaseQuery(this, table);
  }
}

class FakeSupabaseQuery implements PromiseLike<{ data: any; error: null }> {
  private filters: Array<{ column: string; value: unknown }> = [];
  private insertedRows: any[] | null = null;
  private patch: Record<string, unknown> | null = null;
  private orderColumn: string | null = null;

  constructor(private readonly client: FakeSupabaseClient, private readonly table: string) {}

  insert(rows: Record<string, unknown> | Array<Record<string, unknown>>) {
    const rowsToInsert = Array.isArray(rows) ? rows : [rows];
    this.insertedRows = rowsToInsert.map((row) => {
      const storedRow = {
        id: this.nextId(),
        ...row,
      };

      if ((this.table === "candidates" || this.table === "search_requests") && !storedRow.created_at) {
        storedRow.created_at = new Date().toISOString();
      }

      this.client.tables[this.table].push(storedRow);
      return storedRow;
    });

    return this;
  }

  select(_columns = "*") {
    return this;
  }

  update(patch: Record<string, unknown>) {
    this.patch = patch;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  order(column: string, _options?: { ascending?: boolean }) {
    this.orderColumn = column;
    return this;
  }

  async single() {
    const result = await this.execute();

    return { data: Array.isArray(result.data) ? result.data[0] ?? null : result.data, error: null };
  }

  async maybeSingle() {
    return this.single();
  }

  then<TResult1 = { data: any; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute() {
    if (this.patch) {
      const rows = this.matchingRows();

      for (const row of rows) {
        Object.assign(row, this.patch);
      }

      return { data: rows, error: null };
    }

    if (this.insertedRows) {
      return { data: this.insertedRows, error: null };
    }

    let rows = this.matchingRows();

    if (this.orderColumn) {
      rows = [...rows].sort((left, right) => String(left[this.orderColumn ?? ""]).localeCompare(String(right[this.orderColumn ?? ""])));
    }

    return { data: rows, error: null };
  }

  private matchingRows() {
    return this.client.tables[this.table].filter((row) => {
      return this.filters.every((filter) => row[filter.column] === filter.value);
    });
  }

  private nextId() {
    const prefixByTable: Record<string, string> = {
      candidates: "candidate",
      candidate_records: "candidate_record",
      candidate_notes: "candidate_note",
      search_requests: "search_request",
    };
    const next = this.client.counters[this.table];
    this.client.counters[this.table] += 1;

    return `${prefixByTable[this.table]}_${next}`;
  }
}

describe("Supabase recruiting memory repository", () => {
  it("falls back to the in-memory repository when Supabase is not configured", async () => {
    const repository = createRecruitingMemoryRepositoryFromEnv({});
    const parsed = parseCsvTalentPool("Name,Skills\nAda Lovelace,React");
    const result = await repository.importCandidateRecords({
      fileName: "talent-pool.csv",
      candidateRecords: parsed.candidateRecords,
    });

    expect(result.candidates[0].id).toBe("candidate_1");
  });

  it("persists Candidates and Candidate Records without promoting imported profile fields onto Candidate", async () => {
    const client = new FakeSupabaseClient();
    const repository = createSupabaseRecruitingMemoryRepository({ client });
    const parsed = parseCsvTalentPool([
      "Name,Current Role,Skills,Location",
      "Ada Lovelace,Senior React Engineer,React,Remote",
      "Ada Lovelace,Frontend Lead,TypeScript,Remote",
    ].join("\n"));

    const result = await repository.importCandidateRecords({
      fileName: "talent-pool.csv",
      creatorId: "recruiter-1",
      candidateRecords: parsed.candidateRecords,
    });

    expect(result.candidates).toEqual([
      { id: "candidate_1", createdAt: expect.any(String) },
      { id: "candidate_2", createdAt: expect.any(String) },
    ]);
    expect(result.candidates[0]).not.toHaveProperty("name");
    expect(result.candidateRecords[0]).toMatchObject({
      id: "candidate_record_1",
      candidateId: "candidate_1",
      canonicalFields: { name: "Ada Lovelace" },
      provenance: {
        sourceType: "imported",
        sourceReference: { fileName: "talent-pool.csv", rowNumber: 2 },
        creatorId: "recruiter-1",
        confirmerId: null,
        confirmedAt: null,
        uncertainty: null,
        staleness: null,
      },
      possibleDuplicateCandidateRecordIds: ["candidate_record_2"],
    });
    expect(client.tables.candidate_records[0].possible_duplicate_candidate_record_ids).toEqual(["candidate_record_2"]);
  });

  it("persists Search Requests and confirmed Candidate Notes with provenance", async () => {
    const repository = createSupabaseRecruitingMemoryRepository({ client: new FakeSupabaseClient() });
    const parsed = parseCsvTalentPool("Name,Skills\nAda Lovelace,React");
    const imported = await repository.importCandidateRecords({
      fileName: "talent-pool.csv",
      candidateRecords: parsed.candidateRecords,
    });
    const searchCriteria = interpretSearchCriteria("Senior React profiles with fintech experience") ?? {};
    const searchRequest = await repository.createSearchRequest({
      originalText: "Senior React profiles with fintech experience",
      searchCriteria,
      creatorId: "recruiter-1",
    });
    const candidateNote = await repository.confirmCandidateNote({
      candidateId: imported.candidates[0].id,
      content: "Confirmed React fintech context.",
      sourceType: "manual",
      creatorId: "recruiter-1",
      confirmerId: "recruiter-1",
    });

    expect(searchRequest).toMatchObject({
      id: "search_request_1",
      originalText: "Senior React profiles with fintech experience",
      searchCriteria,
      criteriaEditable: false,
      creatorId: "recruiter-1",
    });
    expect(candidateNote).toMatchObject({
      id: "candidate_note_1",
      candidateId: "candidate_1",
      content: "Confirmed React fintech context.",
      provenance: {
        sourceType: "manual",
        creatorId: "recruiter-1",
        confirmerId: "recruiter-1",
        uncertainty: null,
        staleness: null,
      },
    });
    await expect(repository.listCandidateNotes("candidate_1")).resolves.toHaveLength(1);
    await expect(repository.listSearchRequests()).resolves.toHaveLength(1);
  });
});
