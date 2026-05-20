export type SerenityMemoryActionName =
  | "retrieveCandidateMemory"
  | "explainProvenance"
  | "showCandidateHistory"
  | "showMemoryGaps"
  | "navigateCandidateMemory"
  | "proposeCandidateNote"
  | "confirmInferredMemory"
  | "confirmCandidateNote";

export type SerenityMemorySourceType = "manual" | "imported" | "transcribed" | "inferred";

export type SerenityMemoryActionRequest = {
  action: SerenityMemoryActionName | string;
  content?: string;
  humanConfirmed?: boolean;
  sourceType?: SerenityMemorySourceType;
};

export type SerenityMemoryPolicyDecision = {
  decision: "act" | "confirm" | "refuse";
  durableWrite: boolean;
  requiresHumanConfirmation: boolean;
  reason: string;
  memoryOrigin?: SerenityMemorySourceType;
};

const readOnlyActions = new Set<string>([
  "retrieveCandidateMemory",
  "explainProvenance",
  "showCandidateHistory",
  "showMemoryGaps",
  "navigateCandidateMemory",
]);

const highRiskActions = new Set([
  "sendMessage",
  "contactCandidate",
  "autoMergeCandidates",
  "deleteMemory",
  "memoryServiceDirectSupabaseAccess",
]);

const sensitiveSignals = ["health", "family", "religion", "politics", "appearance", "financial", "finances"];

const recruitingSignals = [
  "availability",
  "available",
  "candidate",
  "contact",
  "experience",
  "fintech",
  "industry",
  "language",
  "location",
  "notice",
  "preference",
  "preferred",
  "remote",
  "role",
  "skill",
  "skills",
  "senior",
];

export function evaluateSerenityMemoryAction(request: SerenityMemoryActionRequest): SerenityMemoryPolicyDecision {
  if (highRiskActions.has(request.action)) {
    return {
      decision: "refuse",
      durableWrite: false,
      requiresHumanConfirmation: false,
      reason: "Serenity must refuse external, high-risk, or boundary-violating memory actions.",
    };
  }

  if (readOnlyActions.has(request.action)) {
    return {
      decision: "act",
      durableWrite: false,
      requiresHumanConfirmation: false,
      reason: "Read-only Candidate Memory action.",
    };
  }

  if (request.action === "proposeCandidateNote") {
    if (!isRecruitingRelevantMemory(request.content ?? "")) {
      return refuseUnsafeMemory();
    }

    return {
      decision: "act",
      durableWrite: false,
      requiresHumanConfirmation: false,
      reason: "Candidate Note proposals are temporary and require later human confirmation before durable persistence.",
      memoryOrigin: request.sourceType ?? "manual",
    };
  }

  if (request.action === "confirmCandidateNote" || request.action === "confirmInferredMemory") {
    if (!isRecruitingRelevantMemory(request.content ?? "")) {
      return refuseUnsafeMemory();
    }

    return {
      decision: request.humanConfirmed ? "act" : "confirm",
      durableWrite: true,
      requiresHumanConfirmation: true,
      reason: request.humanConfirmed
        ? "Human confirmation is present for a durable Candidate Note write."
        : "Durable Candidate Note writes require explicit human confirmation.",
      memoryOrigin: request.sourceType ?? (request.action === "confirmInferredMemory" ? "inferred" : "manual"),
    };
  }

  return {
    decision: "refuse",
    durableWrite: false,
    requiresHumanConfirmation: false,
    reason: "Unsupported Serenity memory action.",
  };
}

export function isRecruitingRelevantMemory(content: string) {
  const normalized = content.toLowerCase();

  if (sensitiveSignals.some((signal) => normalized.includes(signal))) {
    return false;
  }

  return recruitingSignals.some((signal) => normalized.includes(signal));
}

function refuseUnsafeMemory(): SerenityMemoryPolicyDecision {
  return {
    decision: "refuse",
    durableWrite: false,
    requiresHumanConfirmation: false,
    reason: "Candidate memory must be recruiting-relevant and avoid sensitive personal data.",
  };
}
