// src/utils/bracketStructure.js
// Store + normalize + view-model builder for brackets (single elim up to 8 for now).

import { useSyncExternalStore } from "react";

export const BRACKET_STORAGE_KEY = "bb_bracketDraft";
const INTERNAL_EVENT = "bb_bracketDraft_changed";

/**
 * Hook: returns the raw JSON string from localStorage (or null).
 * IMPORTANT: getSnapshot must be stable when nothing changes.
 * Returning parsed objects causes infinite loops because JSON.parse creates new objects.
 */
export function useBracketDraftRaw(key = BRACKET_STORAGE_KEY) {
  function getSnapshot() {
    return localStorage.getItem(key); // string | null (stable)
  }

  function getServerSnapshot() {
    return null;
  }

  function subscribe(callback) {
    function onStorage(e) {
      if (e.key === key) callback(); // other tabs
    }
    function onInternal() {
      callback(); // same tab
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(INTERNAL_EVENT, onInternal);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(INTERNAL_EVENT, onInternal);
    };
  }

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function loadBracketFromStorage(key = BRACKET_STORAGE_KEY) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveBracketToStorage(bracketObj, key = BRACKET_STORAGE_KEY) {
  localStorage.setItem(key, JSON.stringify(bracketObj));
  // same-tab update trigger
  window.dispatchEvent(new Event(INTERNAL_EVENT));
}

/**
 * Expected (minimum) shape:
 * {
 *   bracketName: string,
 *   bracketDesc: string,
 *   type: "single" | "roundrobin",
 *   teamCount: number (2..8),
 *   teamNames: string[],
 *   mode: "seeded" | "random"
 * }
 */
export function normalizeBracket(raw) {
  const bracketName = (raw?.bracketName ?? "").toString().trim();
  const bracketDesc = (raw?.bracketDesc ?? "").toString().trim();

  const type = raw?.type === "roundrobin" ? "roundrobin" : "single";

  const teamCountNum = Number(raw?.teamCount);
  const teamCount = clampInt(teamCountNum, 2, 8);

  const mode = raw?.mode === "random" ? "random" : "seeded";

  const inputNames = Array.isArray(raw?.teamNames) ? raw.teamNames : [];
  const teamNames = Array.from({ length: teamCount }, (_, i) => {
    const v = (inputNames[i] ?? "").toString().trim();
    return v || `Team ${i + 1}`;
  });

  return {
    bracketName: bracketName || "Untitled Bracket",
    bracketDesc,
    type,
    teamCount,
    teamNames,
    mode,
  };
}

export function buildBracketViewModel(rawBracket) {
  const meta = normalizeBracket(rawBracket);

  if (meta.type === "roundrobin") {
    return {
      meta,
      kind: "roundrobin",
      rounds: [],
      note:
        "Round-robin rendering will be implemented next. Settings loaded correctly.",
    };
  }

  const orderedTeams =
    meta.mode === "random" ? shuffle([...meta.teamNames]) : [...meta.teamNames];

  const rounds = buildSingleElimRounds(orderedTeams);

  return {
    meta,
    kind: "single",
    rounds,
  };
}

/**
 * Single elimination rounds with stable IDs:
 * - Teams: t1..t8
 * - Winner placeholders: w1..w7
 * - Matches: m1..m7
 * - Champion placeholder: m16 (kept for compatibility with existing connector util)
 */
function buildSingleElimRounds(teamNames) {
  const n = teamNames.length;
  const target = nextPowerOfTwo(n);

  const padded = [...teamNames];
  while (padded.length < target) padded.push("BYE");

  const teamSlots = padded.map((name, idx) => ({
    id: `t${idx + 1}`,
    name,
  }));

  let matchCounter = 1;
  let winnerCounter = 1;

  // Round 1
  let currentRoundMatches = [];
  for (let i = 0; i < teamSlots.length; i += 2) {
    const a = teamSlots[i];
    const b = teamSlots[i + 1];
    const mId = `m${matchCounter++}`;
    const wId = `w${winnerCounter++}`;

    currentRoundMatches.push({
      matchId: mId,
      winnerId: wId,
      teams: [
        { id: a.id, label: a.name },
        { id: b.id, label: b.name },
      ],
    });
  }

  const rounds = [];
  rounds.push({
    roundId: "round_1",
    title: roundTitle(teamSlots.length),
    groupSize: 2,
    matches: currentRoundMatches,
  });

  // Subsequent rounds
  while (currentRoundMatches.length > 1) {
    const nextMatches = [];
    for (let i = 0; i < currentRoundMatches.length; i += 2) {
      const left = currentRoundMatches[i];
      const right = currentRoundMatches[i + 1];

      const mId = `m${matchCounter++}`;
      const wId = `w${winnerCounter++}`;

      nextMatches.push({
        matchId: mId,
        winnerId: wId,
        teams: [
          { id: left.winnerId, label: "Winner" },
          { id: right.winnerId, label: "Winner" },
        ],
      });
    }

    rounds.push({
      roundId: `round_${rounds.length + 1}`,
      title: roundTitle(nextMatches.length * 2),
      groupSize: 1,
      matches: nextMatches,
    });

    currentRoundMatches = nextMatches;
  }

  // Champion
  rounds.push({
    roundId: "round_champion",
    title: "Champion",
    groupSize: 1,
    matches: [{ matchId: "m16", champion: true }],
  });

  return rounds;
}

function roundTitle(teamsInRound) {
  if (teamsInRound === 8) return "Round of 8";
  if (teamsInRound === 4) return "Semifinals";
  if (teamsInRound === 2) return "Final";
  return `Round of ${teamsInRound}`;
}

function clampInt(v, min, max) {
  const x = Number.isFinite(v) ? Math.floor(v) : min;
  return Math.max(min, Math.min(max, x));
}

function nextPowerOfTwo(x) {
  let p = 1;
  while (p < x) p *= 2;
  return p;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}
