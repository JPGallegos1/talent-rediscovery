import type { Candidate, PersistedCandidateRecord, CandidateNote, SearchRequestMemory } from "./recruiting-memory.js";

export type MemorySync = {
  syncCandidateImport(
    candidates: Candidate[],
    records: PersistedCandidateRecord[],
  ): Promise<void>;
  syncConfirmedNote(note: CandidateNote): Promise<void>;
  syncSearchRequest(request: SearchRequestMemory): Promise<void>;
};

export function createMemorySync(apiKey = process.env.MEM0_API_KEY, baseUrl = "https://api.mem0.ai"): MemorySync {
  const url = baseUrl.replace(/\/+$/, "");

  async function sync(body: unknown): Promise<void> {
    if (!apiKey) {
      console.error("mem0 sync skipped: MEM0_API_KEY is not configured");
      return;
    }

    try {
      const response = await fetch(`${url}/v3/memories/add/`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error(`mem0 sync failed: /v3/memories/add/ returned ${response.status}`);
      }
    } catch (error) {
      console.error("mem0 sync error:", error);
    }
  }

  return {
    async syncCandidateImport(candidates, records) {
      await sync({
        app_id: "recollect",
        infer: false,
        messages: [{
          role: "system",
          content: JSON.stringify({
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
          }),
        }],
        metadata: { source: "recollect_candidate_import" },
      });
    },

    async syncConfirmedNote(note) {
      await sync({
        user_id: note.candidateId,
        infer: false,
        messages: [{ role: "system", content: note.content }],
        metadata: {
          source: "recollect_candidate_note",
          noteId: note.id,
          sourceType: note.provenance.sourceType,
          confirmedAt: note.provenance.confirmedAt,
        },
      });
    },

    async syncSearchRequest(request) {
      await sync({
        run_id: request.id,
        infer: false,
        messages: [{ role: "system", content: request.originalText }],
        metadata: {
          source: "recollect_search_request",
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
