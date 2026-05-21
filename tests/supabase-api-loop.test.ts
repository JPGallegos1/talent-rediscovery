import { describe, expect, it } from "vitest";
import { buildShortlist } from "@recollect/domain/shortlist-matches.js";
import { interpretSearchCriteria } from "@recollect/domain/search-criteria.js";
import { createApiApp } from "@recollect/api/app.js";

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
      const storedRow = { id: this.nextId(), ...row };

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

describe("Supabase-backed API memory loop", () => {
  it("persists the full recruiting memory loop through apps/api when Supabase is configured", async () => {
    const supabaseClient = new FakeSupabaseClient();
    const app = createApiApp({
      env: {
        SUPABASE_URL: "https://recollect.test.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
      },
      supabaseClient,
    });
    const csvText = [
      "Name,Current Role,Skills,Location,English Level,Availability,Last Contact",
      "Ada Lovelace,Senior React Engineer,React,Remote Colombia,Advanced,Available,2025-02-10",
    ].join("\n");

    const importResponse = await app.request("/api/talent-pool/import-csv", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fileName: "talent-pool.csv", csvText, creatorId: "recruiter-1" }),
    });
    const importPayload = await importResponse.json();
    const candidateId = importPayload.candidates[0].id;

    expect(importResponse.status).toBe(201);
    expect(supabaseClient.tables.candidates).toHaveLength(1);
    expect(supabaseClient.tables.candidate_records).toHaveLength(1);
    expect(supabaseClient.tables.candidates[0]).not.toHaveProperty("name");

    const proposalResponse = await app.request("/api/candidate-notes/propose", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        candidateId,
        content: "Confirmed React fintech context and remote preference.",
        sourceType: "manual",
        creatorId: "recruiter-1",
      }),
    });

    expect(proposalResponse.status).toBe(200);
    expect(supabaseClient.tables.candidate_notes).toHaveLength(0);

    const confirmResponse = await app.request("/api/candidate-notes/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        candidateId,
        content: "Confirmed React fintech context and remote preference.",
        sourceType: "manual",
        creatorId: "recruiter-1",
        confirmerId: "recruiter-1",
      }),
    });

    expect(confirmResponse.status).toBe(201);
    expect(supabaseClient.tables.candidate_notes).toHaveLength(1);

    const searchResponse = await app.request("/api/search-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        searchRequest: "Senior React profiles with fintech experience remote Colombia and advanced English",
        creatorId: "recruiter-1",
      }),
    });
    const searchPayload = await searchResponse.json();

    expect(searchResponse.status).toBe(201);
    expect(supabaseClient.tables.search_requests).toHaveLength(1);
    expect(searchPayload.searchRequest).toMatchObject({
      originalText: "Senior React profiles with fintech experience remote Colombia and advanced English",
      criteriaEditable: false,
    });

    const memoryResponse = await app.request(`/api/candidates/${candidateId}/memory`);
    const memoryPayload = await memoryResponse.json();

    expect(memoryResponse.status).toBe(200);
    expect(memoryPayload.candidateMemory).toMatchObject({
      candidateId,
      candidateRecords: [{ candidateId, provenance: { sourceType: "imported" } }],
      candidateNotes: [{ candidateId, provenance: { sourceType: "manual", confirmerId: "recruiter-1" } }],
    });
    expect(memoryPayload.candidateMemory.memoryGaps).toContain("Last contact may be stale: 2025-02-10.");

    const recordsResponse = await app.request("/api/candidate-records");
    const recordsPayload = await recordsResponse.json();
    const notesResponse = await app.request(`/api/candidates/${candidateId}/notes`);
    const notesPayload = await notesResponse.json();
    const criteria = interpretSearchCriteria(searchPayload.searchRequest.originalText);
    const shortlist = buildShortlist(recordsPayload.candidateRecords, criteria, {
      candidateNotes: notesPayload.candidateNotes,
    });

    expect(shortlist[0].strength).toBe("Strong");
    expect(shortlist[0].evidence.map((item) => item.source)).toContain("Candidate Note");
    expect(supabaseClient.tables).not.toHaveProperty("shortlists");
    expect(supabaseClient.tables).not.toHaveProperty("matches");
  });
});
