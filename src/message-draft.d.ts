import type { Match } from "./shortlist-matches.js";

export function canDraftMessageFromSuggestedNextAction(suggestedNextAction: string): boolean;

export function draftMessageFromMatch(match: Match & { searchRequest?: string }): string;
