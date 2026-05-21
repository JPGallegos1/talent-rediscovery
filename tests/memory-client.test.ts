import { describe, expect, it } from "vitest";
import {
  createMemoryClient,
  type CandidateMemoryContext,
  type MemoryRetrieveResponse,
  type ProposeNoteResponse,
  type MemoryClient,
} from "@recollect/api/memory-client.js";

class FakeMemoryClient implements MemoryClient {
  retrieveMemory(_context: CandidateMemoryContext): Promise<MemoryRetrieveResponse> {
    return Promise.resolve({
      summary: "Fake summary for testing",
      extractedFields: [{ name: "skills_count", value: "3", source: "candidate_records" }],
      gaps: [],
      nextSteps: ["Review candidate."],
    });
  }

  proposeNote(_context: CandidateMemoryContext, _rawInput: string): Promise<ProposeNoteResponse> {
    return Promise.resolve({
      proposedNote: "Fake proposed note",
      sourceType: "typed",
      confidence: "medium",
      reasoning: "Test reasoning.",
    });
  }
}

describe("FakeMemoryClient", () => {
  it("returns predictable retrieve results", async () => {
    const client = new FakeMemoryClient();
    const result = await client.retrieveMemory({ candidateId: "candidate_1" });

    expect(result.summary).toBe("Fake summary for testing");
    expect(result.extractedFields).toHaveLength(1);
  });

  it("returns predictable propose-note results", async () => {
    const client = new FakeMemoryClient();
    const result = await client.proposeNote({ candidateId: "candidate_1" }, "Some input");

    expect(result.proposedNote).toBe("Fake proposed note");
    expect(result.proposedNote).not.toContain("Some input");
  });
});

describe("createMemoryClient", () => {
  it("sends scoped context to /memory/retrieve", async () => {
    let capturedUrl = "";
    let capturedBody = "";

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = url.toString();
      capturedBody = init?.body?.toString() ?? "";
      return new Response(JSON.stringify({
        summary: "test",
        extractedFields: [],
        gaps: [],
        nextSteps: [],
      }), { status: 200 });
    };

    try {
      const client = createMemoryClient("http://memory:8000");
      await client.retrieveMemory({
        candidateId: "candidate_1",
        records: [{ id: "record_1", skills: ["React"] }],
      });

      expect(capturedUrl).toBe("http://memory:8000/memory/retrieve");

      const body = JSON.parse(capturedBody);
      expect(body.context.candidateId).toBe("candidate_1");
      expect(body.context.records).toHaveLength(1);
      expect(body.context.records[0].skills).toEqual(["React"]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("sends context and raw_input to /memory/propose-note", async () => {
    let capturedUrl = "";
    let capturedBody = "";

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = url.toString();
      capturedBody = init?.body?.toString() ?? "";
      return new Response(JSON.stringify({
        proposedNote: "test note",
        sourceType: "typed",
        confidence: "medium",
        reasoning: "test",
      }), { status: 200 });
    };

    try {
      const client = createMemoryClient("http://memory:8000");
      await client.proposeNote(
        { candidateId: "candidate_1" },
        "Prefers remote work",
      );

      expect(capturedUrl).toBe("http://memory:8000/memory/propose-note");

      const body = JSON.parse(capturedBody);
      expect(body.context.candidateId).toBe("candidate_1");
      expect(body.raw_input).toBe("Prefers remote work");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("throws on non-ok response", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response("Service Unavailable", { status: 503 });

    try {
      const client = createMemoryClient("http://memory:8000");
      await expect(client.retrieveMemory({ candidateId: "candidate_1" }))
        .rejects.toThrow("503");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("returns derived outputs that are not persisted", async () => {
    const originalFetch = globalThis.fetch;
    let callCount = 0;

    globalThis.fetch = async (url: RequestInfo | URL) => {
      callCount++;
      return new Response(JSON.stringify({
        summary: `call ${callCount}`,
        extractedFields: [],
        gaps: [],
        nextSteps: [],
      }), { status: 200 });
    };

    try {
      const client = createMemoryClient("http://memory:8000");
      const result1 = await client.retrieveMemory({ candidateId: "candidate_1" });
      const result2 = await client.retrieveMemory({ candidateId: "candidate_1" });

      expect(result1.summary).toBe("call 1");
      expect(result2.summary).toBe("call 2");
      expect(callCount).toBe(2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("strips trailing slash from base URL", async () => {
    let capturedUrl = "";

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: RequestInfo | URL) => {
      capturedUrl = url.toString();
      return new Response(JSON.stringify({
        summary: "test", extractedFields: [], gaps: [], nextSteps: [],
      }), { status: 200 });
    };

    try {
      const client = createMemoryClient("http://memory:8000/");
      await client.retrieveMemory({ candidateId: "candidate_1" });
      expect(capturedUrl).toBe("http://memory:8000/memory/retrieve");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
