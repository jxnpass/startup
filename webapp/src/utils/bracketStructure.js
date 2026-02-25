// src/utils/bracketStructure.js
import { buildRoundRobinSchedule } from "./roundRobin.js";

export const BRACKET_STORAGE_KEY = "bb_bracketDraft";

export function normalizeDraft(raw) {
  const bracketName = (raw?.bracketName ?? "").toString().trim() || "Untitled Bracket";
  const bracketDesc = (raw?.bracketDesc ?? "").toString().trim();

  const type = raw?.type === "roundrobin" ? "roundrobin" : "single";

  const teamCountNum = Number(raw?.teamCount);
  const teamCount = clampInt(teamCountNum, 2, 16);

  // Seeding only applies to single elimination
  let mode = raw?.mode === "random" ? "random" : "seeded";
  if (type === "roundrobin") mode = "random";

  const rrRoundsNum = Number(raw?.rrRounds);
  const rrRounds = Math.max(1, Math.floor(rrRoundsNum || 1));

  const inputNames = Array.isArray(raw?.teamNames) ? raw.teamNames : [];
  const teamNames = Array.from({ length: teamCount }, (_, i) => {
    const v = (inputNames[i] ?? "").toString().trim();
    return v || `Team ${i + 1}`;
  });

  return { bracketName, bracketDesc, type, teamCount, teamNames, mode, rrRounds };
}

export function buildViewModel(rawDraft) {
  const meta = normalizeDraft(rawDraft);

  if (meta.type === "roundrobin") {
    const teamIds = meta.teamNames.map((_, i) => `rr${i + 1}`);
    const teamById = Object.fromEntries(teamIds.map((id, i) => [id, meta.teamNames[i]]));

    const rounds = buildRoundRobinSchedule(teamIds, meta.rrRounds);

    return {
      meta,
      kind: "roundrobin",
      rr: {
        teamIds,
        teamById,
        rounds,
      },
    };
  }

  // single-elimination (keep simple baseline: power-of-two padding + standard seeds)
  const target = nextPowerOfTwo(meta.teamCount);
  let slots = [...meta.teamNames];

  while (slots.length < target) slots.push("BYE");

  if (meta.mode === "random") {
    slots = shuffle(slots);
  } else {
    slots = seedIntoSlots(slots, target);
  }

  const rounds = buildSingleElimRounds(slots);

  return {
    meta,
    kind: "single",
    rounds,
  };
}

function seedOrderFor(target) {
  if (target === 2) return [1, 2];
  if (target === 4) return [1, 4, 2, 3];
  if (target === 8) return [1, 8, 4, 5, 3, 6, 2, 7];
  if (target === 16)
    return [1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11];
  return Array.from({ length: target }, (_, i) => i + 1);
}

function seedIntoSlots(teamNamesOrByes, target) {
  // teamNamesOrByes length == target (may include BYE)
  // For seeded, assume initial list is in seed order (1..n then BYEs at end).
  const order = seedOrderFor(target);
  return order.map((seedNum) => teamNamesOrByes[seedNum - 1] ?? "BYE");
}

function buildSingleElimRounds(slotTeams) {
  const target = slotTeams.length;
  const gridRows = target * 2;

  const teamSlots = slotTeams.map((name, idx) => ({
    id: `t${idx + 1}`,
    name,
  }));

  let matchCounter = 1;
  let winnerCounter = 1;

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

  while (currentRoundMatches.length > 1) {
    roundIndex += 1;
    const span = Math.pow(2, roundIndex + 2);
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
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}