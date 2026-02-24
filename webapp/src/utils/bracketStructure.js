// src/utils/bracketStructure.js
import { useSyncExternalStore } from "react";

export const BRACKET_STORAGE_KEY = "bb_bracketDraft";
const INTERNAL_EVENT = "bb_bracketDraft_changed";

export function useBracketDraftRaw(key = BRACKET_STORAGE_KEY) {
  function getSnapshot() {
    return localStorage.getItem(key);
  }
  function getServerSnapshot() {
    return null;
  }
  function subscribe(callback) {
    function onStorage(e) {
      if (e.key === key) callback();
    }
    function onInternal() {
      callback();
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

export function saveBracketToStorage(bracketObj, key = BRACKET_STORAGE_KEY) {
  localStorage.setItem(key, JSON.stringify(bracketObj));
  window.dispatchEvent(new Event(INTERNAL_EVENT));
}

export function normalizeBracket(raw) {
  const bracketName = (raw?.bracketName ?? "").toString().trim();
  const bracketDesc = (raw?.bracketDesc ?? "").toString().trim();
  const type = raw?.type === "roundrobin" ? "roundrobin" : "single";

  const teamCountNum = Number(raw?.teamCount);
  const teamCount = clampInt(teamCountNum, 2, 16);

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

  const target = nextPowerOfTwo(meta.teamCount);

  let slottedTeams;
  if (meta.mode === "random") {
    slottedTeams = padTo(meta.teamNames, target, "BYE");
    slottedTeams = shuffle(slottedTeams);
  } else {
    slottedTeams = seedIntoSlots(meta.teamNames, target);
  }

  const rounds = buildSingleElimRounds(slottedTeams);

  return {
    meta,
    kind: "single",
    targetTeams: target, // used by CSS grid sizing
    rounds,
  };
}

/**
 * Seed placement orders (standard):
 * 8: 1v8, 4v5, 3v6, 2v7 => [1,8,4,5,3,6,2,7]
 * 16: [1,16,8,9,4,13,5,12,2,15,7,10,3,14,6,11]
 */
function seedOrderFor(target) {
  if (target === 2) return [1, 2];
  if (target === 4) return [1, 4, 2, 3];
  if (target === 8) return [1, 8, 4, 5, 3, 6, 2, 7];
  if (target === 16)
    return [1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11];
  return Array.from({ length: target }, (_, i) => i + 1);
}

function seedIntoSlots(teamNames, target) {
  const n = teamNames.length;
  const order = seedOrderFor(target);
  return order.map((seedNum) => (seedNum <= n ? teamNames[seedNum - 1] : "BYE"));
}

function padTo(arr, target, filler) {
  const out = [...arr];
  while (out.length < target) out.push(filler);
  return out;
}

/**
 * Grid placement model:
 * We create a consistent vertical track with rows = targetTeams * 2.
 * Each round uses a span that doubles:
 * - Round 1 match spans 4 rows
 * - Semis span 8 rows
 * - Final spans 16 rows
 *
 * Each match i in a round starts at:
 * gridStart = 1 + i * span
 * gridSpan  = span
 *
 * This guarantees the match blocks are centered at correct midpoints.
 */
function buildSingleElimRounds(slotTeams) {
  const target = slotTeams.length;
  const gridRows = target * 2; // used in CSS

  const teamSlots = slotTeams.map((name, idx) => ({
    id: `t${idx + 1}`,
    name,
  }));

  let matchCounter = 1;
  let winnerCounter = 1;

  // Round 0: build actual matchups
  let roundIndex = 0;
  let currentRoundMatches = [];

  const span0 = Math.pow(2, roundIndex + 2); // 4
  for (let i = 0; i < teamSlots.length / 2; i++) {
    const a = teamSlots[i * 2];
    const b = teamSlots[i * 2 + 1];
    const mId = `m${matchCounter++}`;
    const wId = `w${winnerCounter++}`;

    currentRoundMatches.push({
      matchId: mId,
      winnerId: wId,
      gridStart: 1 + i * span0,
      gridSpan: span0,
      teams: [
        { id: a.id, label: a.name },
        { id: b.id, label: b.name },
      ],
    });
  }

  const rounds = [];
  rounds.push({
    roundId: "round_1",
    title: roundTitle(target),
    gridRows,
    matches: currentRoundMatches,
  });

  // Subsequent rounds
  while (currentRoundMatches.length > 1) {
    roundIndex += 1;
    const span = Math.pow(2, roundIndex + 2); // 8,16,32...
    const nextMatches = [];

    for (let i = 0; i < currentRoundMatches.length / 2; i++) {
      const left = currentRoundMatches[i * 2];
      const right = currentRoundMatches[i * 2 + 1];

      const mId = `m${matchCounter++}`;
      const wId = `w${winnerCounter++}`;

      nextMatches.push({
        matchId: mId,
        winnerId: wId,
        gridStart: 1 + i * span,
        gridSpan: span,
        teams: [
          { id: left.winnerId, label: "Winner" },
          { id: right.winnerId, label: "Winner" },
        ],
      });
    }

    rounds.push({
      roundId: `round_${rounds.length + 1}`,
      title: roundTitle(target / Math.pow(2, roundIndex)),
      gridRows,
      matches: nextMatches,
    });

    currentRoundMatches = nextMatches;
  }

  // Champion column (kept as m16 for connector compatibility)
  rounds.push({
    roundId: "round_champion",
    title: "Champion",
    gridRows,
    matches: [
      {
        matchId: "m16",
        champion: true,
        gridStart: 1 + Math.floor(gridRows / 2) - 2,
        gridSpan: 4,
      },
    ],
  });

  return rounds;
}

function roundTitle(teamsInRound) {
  if (teamsInRound === 16) return "Round of 16";
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