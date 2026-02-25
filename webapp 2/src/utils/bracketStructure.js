// src/utils/bracketStructure.js
import { buildRoundRobinSchedule } from "./roundRobin.js";

function clampInt(v, min, max) {
  const x = Number.isFinite(v) ? Math.floor(v) : min;
  return Math.max(min, Math.min(max, x));
}

function nextPow2(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function seedOrderFor(size) {
  if (size === 2) return [1, 2];
  if (size === 4) return [1, 4, 2, 3];
  if (size === 8) return [1, 8, 4, 5, 3, 6, 2, 7];
  return Array.from({ length: size }, (_, i) => i + 1);
}

export function normalizeDraft(raw) {
  const bracketName = (raw?.bracketName ?? "").toString().trim() || "Untitled Bracket";
  const bracketDesc = (raw?.bracketDesc ?? "").toString().trim();
  const type = raw?.type === "roundrobin" ? "roundrobin" : "single";

  const teamCount = clampInt(Number(raw?.teamCount), 2, 8);

  const inputNames = Array.isArray(raw?.teamNames) ? raw.teamNames : [];
  const teamNames = Array.from({ length: teamCount }, (_, i) => {
    const v = (inputNames[i] ?? "").toString().trim();
    return v || `Team ${i + 1}`;
  });

  let mode = raw?.mode === "random" ? "random" : "seeded";
  if (type === "roundrobin") mode = "random";

  const roundCountNum = Number(raw?.roundCount);
  const roundCount = Math.max(1, Math.floor(roundCountNum || 1));

  return { bracketName, bracketDesc, type, teamCount, teamNames, mode, roundCount };
}

function roundTitle(size, roundIdx) {
  // for size=8: roundIdx0=Round of 8, 1=Semifinals, 2=Final
  const teamsThisRound = size / Math.pow(2, roundIdx);
  if (teamsThisRound === 2) return "Final";
  if (teamsThisRound === 4) return "Semifinals";
  if (teamsThisRound === 8) return "Round of 8";
  if (teamsThisRound === 16) return "Round of 16";
  return `Round of ${teamsThisRound}`;
}

function buildSingleElim(teamNames, mode) {
  const size = nextPow2(teamNames.length);
  let slots = [...teamNames];
  while (slots.length < size) slots.push("BYE");

  if (mode === "random") {
    slots = shuffle(slots);
  } else {
    const order = seedOrderFor(size);
    slots = order.map((seed) => slots[seed - 1] ?? "BYE");
  }

  const gridRows = size * 2;

  // First round: teams get ids t1..t<size>
  const firstRoundTeams = slots.map((name, i) => ({ id: `t${i + 1}`, name }));

  const rounds = [];
  let matchCounter = 1;
  let winnerCounter = 1;

  // Build rounds iteratively
  let current = [];
  let span = 4; // first-round match span
  for (let i = 0; i < size / 2; i++) {
    const a = firstRoundTeams[i * 2];
    const b = firstRoundTeams[i * 2 + 1];
    const matchId = `m${matchCounter++}`;
    const winnerId = `w${winnerCounter++}`;

    current.push({
      matchId,
      winnerId,
      gridStart: 1 + i * span,
      gridSpan: span,
      teams: [
        { id: a.id, label: a.name },
        { id: b.id, label: b.name },
      ],
    });
  }

  rounds.push({
    roundId: "round_1",
    title: roundTitle(size, 0),
    gridRows,
    depth: 0,
    matches: current,
  });

  let depth = 1;
  while (current.length > 1) {
    const next = [];
    span *= 2;

    for (let i = 0; i < current.length / 2; i++) {
      const left = current[i * 2];
      const right = current[i * 2 + 1];

      const matchId = `m${matchCounter++}`;
      const winnerId = `w${winnerCounter++}`;

      next.push({
        matchId,
        winnerId,
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
      title: roundTitle(size, rounds.length),
      gridRows,
      depth,
      matches: next,
    });

    current = next;
    depth += 1;
  }

  // Champion column uses id m16 (your lines code expects it)
  const finalWinnerId = current[0]?.winnerId ?? "w1";
  rounds.push({
    roundId: "round_champion",
    title: "Champion",
    gridRows,
    depth,
    championFrom: finalWinnerId,
  });

  return { size, gridRows, rounds, slots };
}

export function buildBracketViewModel(rawDraft) {
  const meta = normalizeDraft(rawDraft);

  if (meta.type === "roundrobin") {
    const teamIds = meta.teamNames.map((_, i) => `rr${i + 1}`);
    const teamById = Object.fromEntries(teamIds.map((id, i) => [id, meta.teamNames[i]]));
    const rounds = buildRoundRobinSchedule(teamIds, meta.roundCount);

    return { meta, kind: "roundrobin", rr: { teamIds, teamById, rounds } };
  }

  const se = buildSingleElim(meta.teamNames, meta.mode);
  return { meta, kind: "single", se };
}