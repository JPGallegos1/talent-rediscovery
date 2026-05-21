export type CandidateRecordSummary = {
  id: string;
  sourceFile?: string | null;
  skills?: string[];
  role?: string | null;
  yearsExperience?: number | null;
  location?: string | null;
  englishLevel?: string | null;
  industries?: string[];
  availability?: string | null;
};

export type CandidateNoteSummary = {
  id: string;
  content: string;
  createdAt?: string | null;
  sourceType?: string | null;
};

export type CandidateMemoryContext = {
  candidateId: string;
  records?: CandidateRecordSummary[];
  notes?: CandidateNoteSummary[];
  searchRequest?: string | null;
};

export type ExtractedField = {
  name: string;
  value: string;
  source: string;
};

export type MemoryRetrieveResponse = {
  summary: string;
  extractedFields: ExtractedField[];
  gaps: string[];
  nextSteps: string[];
};

export type ProposeNoteResponse = {
  proposedNote: string;
  sourceType: "transcribed" | "typed";
  confidence: "high" | "medium" | "low";
  reasoning: string;
};

export type MemoryClient = {
  retrieveMemory(context: CandidateMemoryContext): Promise<MemoryRetrieveResponse>;
  proposeNote(context: CandidateMemoryContext, rawInput: string): Promise<ProposeNoteResponse>;
};

export function createMemoryClient(baseUrl?: string): MemoryClient {
  const url = (baseUrl ?? process.env.MEMORY_SERVICE_URL ?? "http://localhost:8000").replace(/\/+$/, "");

  async function request<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${url}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Memory service returned ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  return {
    async retrieveMemory(context: CandidateMemoryContext): Promise<MemoryRetrieveResponse> {
      const result = await request<MemoryRetrieveResponse>("/memory/retrieve", { context });
      return result;
    },

    async proposeNote(context: CandidateMemoryContext, rawInput: string): Promise<ProposeNoteResponse> {
      const result = await request<ProposeNoteResponse>("/memory/propose-note", { context, raw_input: rawInput });
      return result;
    },
  };
}
