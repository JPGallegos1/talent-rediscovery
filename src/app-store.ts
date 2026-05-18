import { create } from "zustand";
import type { UIMessage } from "ai";
import type { CandidateRecord } from "./csv-candidate-records.js";
import type { SearchCriteria } from "./search-criteria.js";
import type { Match } from "./shortlist-matches.js";

export type ComparisonReportEvidence = {
  label: string;
  value: string;
  matched: string;
};

export type ComparisonReportMatch = {
  matchId: string;
  candidateRecordLabel: string;
  currentRole: string;
  strength: Match["strength"];
  reasons: string[];
  evidence: ComparisonReportEvidence[];
  gaps: string[];
  risks: string[];
  suggestedNextAction: string;
  differentiators: string[];
};

export type ComparisonReport = {
  searchRequest: string;
  comparedMatchIds: string[];
  sharedEvidence: string[];
  matches: ComparisonReportMatch[];
};

export type CopilotErrorKind = "client" | "server" | "offline";

export type CopilotErrorState = {
  kind: CopilotErrorKind;
  message: string;
  status?: number;
};

type AppStoreState = {
  talentPoolFileName: string | null;
  candidateRecordCount: number;
  candidateRecords: CandidateRecord[];
  searchRequest: string;
  searchCriteria: SearchCriteria | null;
  shortlist: Match[];
  selectedMatchId: string | null;
  copilotMessages: UIMessage[];
  copilotInput: string;
  copilotError: CopilotErrorState | null;
  messageDraftsByMatchId: Record<string, string>;
  comparisonReport: ComparisonReport | null;
};

type AppStoreActions = {
  loadTalentPool: (payload: { talentPoolFileName: string; candidateRecords: CandidateRecord[] }) => void;
  clearTalentPool: () => void;
  applySearchRequest: (payload: { searchRequest: string; searchCriteria: SearchCriteria | null; shortlist: Match[] }) => void;
  selectMatch: (matchId: string | null) => void;
  setCopilotMessages: (messages: UIMessage[]) => void;
  setCopilotInput: (input: string) => void;
  setCopilotError: (error: CopilotErrorState | null) => void;
  setMessageDraft: (matchId: string, draftText: string) => void;
  setComparisonReport: (comparisonReport: ComparisonReport | null) => void;
};

const initialState: AppStoreState = {
  talentPoolFileName: null,
  candidateRecordCount: 0,
  candidateRecords: [],
  searchRequest: "",
  searchCriteria: null,
  shortlist: [],
  selectedMatchId: null,
  copilotMessages: [],
  copilotInput: "",
  copilotError: null,
  messageDraftsByMatchId: {},
  comparisonReport: null,
};

export const useAppStore = create<AppStoreState & AppStoreActions>((set) => ({
  ...initialState,
  loadTalentPool: ({ talentPoolFileName, candidateRecords }) =>
    set({
      talentPoolFileName,
      candidateRecordCount: candidateRecords.length,
      candidateRecords,
      searchRequest: "",
      searchCriteria: null,
      shortlist: [],
      selectedMatchId: null,
      copilotMessages: [],
      copilotInput: "",
      copilotError: null,
      messageDraftsByMatchId: {},
      comparisonReport: null,
    }),
  clearTalentPool: () =>
    set({
      ...initialState,
      copilotMessages: [],
      copilotInput: "",
      copilotError: null,
    }),
  applySearchRequest: ({ searchRequest, searchCriteria, shortlist }) =>
    set({
      searchRequest,
      searchCriteria,
      shortlist,
      selectedMatchId: null,
      messageDraftsByMatchId: {},
      comparisonReport: null,
    }),
  selectMatch: (selectedMatchId) => set({ selectedMatchId }),
  setCopilotMessages: (copilotMessages) => set({ copilotMessages }),
  setCopilotInput: (copilotInput) => set({ copilotInput }),
  setCopilotError: (copilotError) => set({ copilotError }),
  setMessageDraft: (matchId, draftText) =>
    set((state) => ({
      messageDraftsByMatchId: {
        ...state.messageDraftsByMatchId,
        [matchId]: draftText,
      },
    })),
  setComparisonReport: (comparisonReport) => set({ comparisonReport }),
}));
