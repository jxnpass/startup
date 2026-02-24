// src/utils/bracketDraft.js
// Keeps Create.jsx clean by owning draft state helpers + payload building.

import { BRACKET_STORAGE_KEY, saveBracketToStorage } from "./bracketStructure.js";

export const TEAM_COUNT_MIN = 2;
export const TEAM_COUNT_MAX = 8;

export function createDefaultDraft() {
  return {
    bracketName: "",
    bracketDesc: "",
    type: "single", // "single" | "roundrobin"
    teamCount: 2,
    teamNames: ["Team 1", "Team 2"],
    // single only
    mode: "seeded", // "seeded" | "random"
    // round robin only (how many times each matchup is played)
    roundCount: 1,
  };
}

export function clampTeamCount(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return TEAM_COUNT_MIN;
  return Math.max(TEAM_COUNT_MIN, Math.min(TEAM_COUNT_MAX, Math.floor(v)));
}

export function resizeTeamNames(teamNames, teamCount) {
  const count = clampTeamCount(teamCount);
  const next = Array.from({ length: count }, (_, i) => {
    const current = (teamNames?.[i] ?? "").toString().trim();
    return current || `Team ${i + 1}`;
  });
  return next;
}

/**
 * Converts the Create draft into the payload Bracket.jsx expects.
 * Keeps IDs aligned to your framework:
 * - bracketName, bracketDesc
 * - type: "single" | "roundrobin"
 * - teamCount (<=8)
 * - teamNames: string[]
 * - mode: "seeded" | "random"
 *
 * Extra fields included for future checkpoints:
 * - roundCount (only meaningful for roundrobin)
 */
export function buildBracketPayload(draft) {
  const teamCount = clampTeamCount(draft.teamCount);
  const teamNames = resizeTeamNames(draft.teamNames, teamCount);

  const type = draft.type === "roundrobin" ? "roundrobin" : "single";

  // Seeding not applicable to round robin → enforce "random" to keep bracketStructure consistent
  const mode =
    type === "roundrobin"
      ? "random"
      : draft.mode === "random"
        ? "random"
        : "seeded";

  const roundCountNum = Number(draft.roundCount);
  const roundCount =
    Number.isFinite(roundCountNum) && roundCountNum >= 1
      ? Math.floor(roundCountNum)
      : 1;

  return {
    bracketName: (draft.bracketName ?? "").toString(),
    bracketDesc: (draft.bracketDesc ?? "").toString(),
    type,
    teamCount,
    teamNames,
    mode,
    // extra (future use)
    roundCount,
  };
}

/** Saves to localStorage under the bracket key used by Bracket.jsx */
export function saveDraftToStorage(draft) {
  const payload = buildBracketPayload(draft);
  saveBracketToStorage(payload, BRACKET_STORAGE_KEY);
  return payload;
}
