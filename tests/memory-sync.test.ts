import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  createMemorySync,
  createNoopMemorySync,
  type MemorySync,
} from "@recollect/api/memory-sync.js";
import { createMemoryRecruitingMemoryRepository } from "@recollect/api/recruiting-memory.js";

function captureFetch(): {
  capturedUrl: string;
  capturedBody: string;
  capturedMethod: string;
  capturedHeaders: Record<string, string>;
  restore: () => void;
} {
  const originalFetch = globalThis.fetch;
  const captured: {
    capturedUrl: string;
    capturedBody: string;
    capturedMethod: string;
    capturedHeaders: Record<string, string>;
    restore: () => void;
  } = {
    capturedUrl: "",
    capturedBody: "",
    capturedMethod: "",
    capturedHeaders: {},
    restore() {
      globalThis.fetch = originalFetch;
    },
  };

  globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
    captured.capturedUrl = url.toString();
    captured.capturedMethod = init?.method ?? "GET";
    captured.capturedBody = init?.body?.toString() ?? "";
    captured.capturedHeaders = (init?.headers as Record<string, string>) ?? {};
    return new Response(JSON.stringify({}), { status: 200 });
  };

  return captured;
}

const fakeCandidate = {
  id: "candidate_1",
  createdAt: "2025-01-01T00:00:00Z",
};

const fakeRecord = {
  id: "record_1",
  candidateId: "candidate_1",
  rowNumber: 1,
  canonicalFields: {
    name: "Jane Doe",
    currentRole: "Engineer",
    skills: { raw: "React", terms: ["React"], normalizedTerms: ["react"] },
    yearsExperience: "5",
    location: "New York",
    englishLevel: "native",
    industries: ["tech"],
    availability: "immediate",
    source: "linkedin",
    lastContactDate: "",
    salaryExpectationUsd: "",
    notes: "",
  },
  sourceFields: {},
  sourceFieldMappings: {},
  gaps: [],
  searchTerms: ["react", "engineer"],
  provenance: {
    sourceType: "imported" as const,
    sourceReference: { fileName: "test.csv", rowNumber: 1 },
    creatorId: null,
    createdAt: "2025-01-01T00:00:00Z",
    confirmerId: null,
    confirmedAt: null,
    uncertainty: null,
    staleness: null,
  },
  possibleDuplicateCandidateRecordIds: [],
};

describe("createNoopMemorySync", () => {
  it("syncCandidateImport does nothing", async () => {
    const sync = createNoopMemorySync();
    await expect(sync.syncCandidateImport([], [])).resolves.toBeUndefined();
  });

  it("syncConfirmedNote does nothing", async () => {
    const sync = createNoopMemorySync();
    await expect(
      sync.syncConfirmedNote({
        id: "note_1",
        candidateId: "candidate_1",
        content: "test",
        provenance: {
          sourceType: "manual",
          creatorId: null,
          createdAt: "",
          confirmerId: "user_1",
          confirmedAt: "",
          uncertainty: null,
          staleness: null,
        },
      }),
    ).resolves.toBeUndefined();
  });

  it("syncSearchRequest does nothing", async () => {
    const sync = createNoopMemorySync();
    await expect(
      sync.syncSearchRequest({
        id: "sr_1",
        originalText: "test",
        searchCriteria: {},
        criteriaEditable: false,
        creatorId: null,
        createdAt: "",
      }),
    ).resolves.toBeUndefined();
  });
});

describe("createMemorySync", () => {
  beforeEach(() => {
    delete process.env.MEM0_API_URL;
  });

  it("posts candidate import to /memory", async () => {
    const c = captureFetch();

    try {
      const sync = createMemorySync("http://mem0:8050");
      await sync.syncCandidateImport([fakeCandidate], [fakeRecord]);

      expect(c.capturedUrl).toBe("http://mem0:8050/memory");
      expect(c.capturedMethod).toBe("POST");
      expect(c.capturedHeaders["Content-Type"]).toBe("application/json");

      const body = JSON.parse(c.capturedBody);
      expect(body.type).toBe("candidate_import");
      expect(body.candidates).toHaveLength(1);
      expect(body.candidates[0].id).toBe("candidate_1");
      expect(body.records).toHaveLength(1);
      expect(body.records[0].skills).toEqual(["react"]);
    } finally {
      c.restore();
    }
  });

  it("posts confirmed note to /memory", async () => {
    const c = captureFetch();

    try {
      const sync = createMemorySync("http://mem0:8050");
      await sync.syncConfirmedNote({
        id: "note_1",
        candidateId: "candidate_1",
        content: "Prefers remote",
        provenance: {
          sourceType: "manual",
          creatorId: "user_1",
          createdAt: "2025-01-01T00:00:00Z",
          confirmerId: "user_1",
          confirmedAt: "2025-01-01T00:00:00Z",
          uncertainty: null,
          staleness: null,
        },
      });

      const body = JSON.parse(c.capturedBody);
      expect(body.type).toBe("candidate_note");
      expect(body.note.id).toBe("note_1");
      expect(body.note.content).toBe("Prefers remote");
      expect(body.note.sourceType).toBe("manual");
    } finally {
      c.restore();
    }
  });

  it("posts search request to /memory", async () => {
    const c = captureFetch();

    try {
      const sync = createMemorySync("http://mem0:8050");
      await sync.syncSearchRequest({
        id: "sr_1",
        originalText: "React developer fintech",
        searchCriteria: { skills: ["react"], industries: ["fintech"] },
        criteriaEditable: false,
        creatorId: "user_1",
        createdAt: "2025-01-01T00:00:00Z",
      });

      const body = JSON.parse(c.capturedBody);
      expect(body.type).toBe("search_request");
      expect(body.searchRequest.id).toBe("sr_1");
      expect(body.searchRequest.originalText).toBe("React developer fintech");
    } finally {
      c.restore();
    }
  });

  it("logs error instead of throwing on HTTP error", async () => {
    const originalFetch = globalThis.fetch;
    const logs: string[] = [];
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => logs.push(args.map(String).join(" "));

    globalThis.fetch = async () => new Response("Bad Gateway", { status: 502 });

    try {
      const sync = createMemorySync("http://mem0:8050");
      await sync.syncCandidateImport([fakeCandidate], [fakeRecord]);
      expect(logs.some((l) => l.includes("502"))).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
      console.error = originalConsoleError;
    }
  });

  it("logs error instead of throwing on network failure", async () => {
    const originalFetch = globalThis.fetch;
    const logs: string[] = [];
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => logs.push(args.map(String).join(" "));

    globalThis.fetch = async () => {
      throw new Error("ECONNREFUSED");
    };

    try {
      const sync = createMemorySync("http://mem0:8050");
      await sync.syncCandidateImport([fakeCandidate], [fakeRecord]);
      expect(logs.some((l) => l.includes("ECONNREFUSED"))).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
      console.error = originalConsoleError;
    }
  });

  it("strips trailing slash from base URL", async () => {
    const c = captureFetch();

    try {
      const sync = createMemorySync("http://mem0:8050/");
      await sync.syncCandidateImport([fakeCandidate], [fakeRecord]);
      expect(c.capturedUrl).toBe("http://mem0:8050/memory");
    } finally {
      c.restore();
    }
  });

  it("defaults to MEM0_API_URL env var", async () => {
    process.env.MEM0_API_URL = "http://custom:9000";
    const c = captureFetch();

    try {
      const sync = createMemorySync();
      await sync.syncCandidateImport([fakeCandidate], [fakeRecord]);
      expect(c.capturedUrl).toBe("http://custom:9000/memory");
    } finally {
      delete process.env.MEM0_API_URL;
      c.restore();
    }
  });
});

describe("RecruitingMemoryRepository memory sync", () => {
  it("does not fail canonical persistence when injected sync rejects", async () => {
    const logs: string[] = [];
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => logs.push(args.map(String).join(" "));
    const rejectingSync: MemorySync = {
      async syncCandidateImport() {
        throw new Error("mem0 unavailable");
      },
      async syncConfirmedNote() {
        throw new Error("mem0 unavailable");
      },
      async syncSearchRequest() {
        throw new Error("mem0 unavailable");
      },
    };

    try {
      const repository = createMemoryRecruitingMemoryRepository({ memorySync: rejectingSync });
      const result = await repository.importCandidateRecords({
        fileName: "test.csv",
        creatorId: "user_1",
        candidateRecords: [fakeRecord],
      });

      await Promise.resolve();

      expect(result.imported.candidateRecordCount).toBe(1);
      expect(await repository.listCandidateRecords()).toHaveLength(1);
      expect(logs.some((log) => log.includes("mem0 unavailable"))).toBe(true);
    } finally {
      console.error = originalConsoleError;
    }
  });
});
