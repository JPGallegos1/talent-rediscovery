import type { Candidate, PersistedCandidateRecord, CandidateNote, SearchRequestMemory } from "./recruiting-memory.js";

export type MemorySync = {
  syncCandidateImport(
    candidates: Candidate[],
    records: PersistedCandidateRecord[],
  ): Promise<void>;
  syncConfirmedNote(note: CandidateNote): Promise<void>;
  syncSearchRequest(request: SearchRequestMemory): Promise<void>;
};

export function createMemorySync(baseUrl?: string): MemorySync {
  const url = (baseUrl ?? process.env.MEM0_API_URL ?? "http://localhost:8050").replace(/\/+$/, "");

  async function sync(path: string, body: unknown): Promise<void> {
    try {
      const response = await fetch(`${url}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error(`mem0 sync failed: ${path} returned ${response.status}`);
      }
    } catch (error) {
      console.error("mem0 sync error:", error);
    }
  }

  return {
    async syncCandidateImport(candidates, records) {
      await sync("/memory", {
        type: "candidate_import",
        candidates: candidates.map((c) => ({ id: c.id, createdAt: c.createdAt })),
        records: records.map((r) => ({
          id: r.id,
          candidateId: r.candidateId,
          skills: r.canonicalFields.skills.normalizedTerms,
          role: r.canonicalFields.currentRole,
          name: r.canonicalFields.name,
          location: r.canonicalFields.location,
          industries: r.canonicalFields.industries,
        })),
      });
    },

    async syncConfirmedNote(note) {
      await sync("/memory", {
        type: "candidate_note",
        note: {
          id: note.id,
          candidateId: note.candidateId,
          content: note.content,
          sourceType: note.provenance.sourceType,
          confirmedAt: note.provenance.confirmedAt,
        },
      });
    },

    async syncSearchRequest(request) {
      await sync("/memory", {
        type: "search_request",
        searchRequest: {
          id: request.id,
          originalText: request.originalText,
          searchCriteria: request.searchCriteria,
          createdAt: request.createdAt,
        },
      });
    },
  };
}

export function createNoopMemorySync(): MemorySync {
  return {
    async syncCandidateImport() {},
    async syncConfirmedNote() {},
    async syncSearchRequest() {},
  };
}
