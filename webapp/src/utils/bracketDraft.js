// src/utils/bracketDraft.js
// Owns draft payload building + creates a new bracket ID record in localStorage + library.

import {
  addBracketToLibrary,
  draftKeyFor,
  progressKeyFor,
  generateBracketId,
} from "./bracketLibrary.js";
import { saveProgress } from "./bracketProgress.js";

export const TEAM_COUNT_MIN = 2;
export const TEAM_COUNT_MAX = 16;

export function createDefaultDraft() {
  return {
    bracketName: "",
    bracketDesc: "",
    type: "single", // "single" | "roundrobin"
    teamCount: 2,
    teamNames: ["Team 1", "Team 2"],
    // single only
    mode: "seeded", // "seeded" | "random"
    // round robin only
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
  return Array.from({ length: count }, (_, i) => {
    const current = (teamNames?.[i] ?? "").toString().trim();
    return current || `Team ${i + 1}`;
  });
}

export function buildBracketPayload(draft) {
  const teamCount = clampTeamCount(draft.teamCount);
  const teamNames = resizeTeamNames(draft.teamNames, teamCount);

  const type = draft.type === "roundrobin" ? "roundrobin" : "single";

  // Seeding not applicable to round robin
  const mode =
    type === "roundrobin"
      ? "random"
      : draft.mode === "random"
        ? "random"
        : "seeded";

  const roundCountNum = Number(draft.roundCount);
  const roundCount =
    Number.isFinite(roundCountNum) && roundCountNum >= 1 ? Math.floor(roundCountNum) : 1;

  return {
    bracketName: (draft.bracketName ?? "").toString(),
    bracketDesc: (draft.bracketDesc ?? "").toString(),
    type,
    teamCount,
    teamNames,
    mode,
    roundCount,
  };
}

/**
 * Creates a NEW bracket:
 * - generates ID
 * - saves draft under bb_bracketDraft:<id>
 * - initializes progress under bb_bracketProgress:<id>
 * - adds entry to bb_brackets
 */
export function createNewBracket(draft) {
  const payload = buildBracketPayload(draft);

  const id = generateBracketId();
  const dKey = draftKeyFor(id);
  const pKey = progressKeyFor(id);

  // ✅ Save draft directly (no dependency on bracketStructure exports)
  localStorage.setItem(dKey, JSON.stringify(payload));

  // initialize empty progress
  saveProgress({ scores: {}, sig: {} }, pKey);

  addBracketToLibrary({
    id,
    createdAt: new Date().toISOString(),
    bracketName: payload.bracketName || "Untitled Bracket",
    teamCount: payload.teamCount,
    type: payload.type,
    mode: payload.mode,
    draftKey: dKey,
    progressKey: pKey,
  });

  return { id, payload };
}