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
  if (size === 16) return [1, 16, 8, 9, 4, 13, 5, 12, 3, 14, 6, 11, 2, 15, 7, 10];
  return Array.from({ length: size }, (_, i) => i + 1);
}

export function normalizeDraft(raw) {
  const bracketName = (raw?.bracketName ?? "").toString().trim() || "Untitled Bracket";
  const bracketDesc = (raw?.bracketDesc ?? "").toString().trim();
  const type = raw?.type === "roundrobin" ? "roundrobin" : raw?.type === "double" ? "double" : "single";

  const teamCountMax = type === "double" ? 8 : 16;
  const teamCount = clampInt(Number(raw?.teamCount), 2, teamCountMax);

  const inputNames = Array.isArray(raw?.teamNames) ? raw.teamNames : [];
  const teamNames = Array.from({ length: teamCount }, (_, i) => {
    const v = (inputNames[i] ?? "").toString().trim();
    return v || `Team ${i + 1}`;
  });

  let mode = raw?.mode === "random" ? "random" : "seeded";
  if (type === "roundrobin") mode = "random";

  const roundCountNum = Number(raw?.roundCount);
  const roundCount = Math.max(1, Math.floor(roundCountNum || 1));

  const rawSharing = raw?.sharing ?? {};
  const normalizeAccess = (value) =>
    value === "private" || value === "public" ? value : "personal";
  const collaboratorEmails = Array.isArray(rawSharing?.collaboratorEmails)
    ? rawSharing.collaboratorEmails
        .map((email) => (email ?? "").toString().trim())
        .filter(Boolean)
    : [];
  const shareLink = (rawSharing?.shareLink ?? "").toString().trim();

  const sharing = {
    editAccess: normalizeAccess(rawSharing?.editAccess),
    viewAccess: normalizeAccess(rawSharing?.viewAccess),
    collaboratorEmails,
    shareLink,
  };

  return { bracketName, bracketDesc, type, teamCount, teamNames, mode, roundCount, sharing };
}

function roundTitle(size, roundIdx) {
  const teamsThisRound = size / Math.pow(2, roundIdx);
  if (teamsThisRound === 2) return "Final";
  if (teamsThisRound === 4) return "Semifinals";
  if (teamsThisRound === 8) return "Round of 8";
  if (teamsThisRound === 16) return "Round of 16";
  return `Round of ${teamsThisRound}`;
}

function orderedSlots(teamNames, mode, maxSize = 16) {
  const size = Math.min(nextPow2(teamNames.length), maxSize);
  let slots = [...teamNames];
  while (slots.length < size) slots.push("BYE");

  if (mode === "random") {
    slots = shuffle(slots);
  } else {
    const order = seedOrderFor(size);
    slots = order.map((seed) => slots[seed - 1] ?? "BYE");
  }

  return { size, slots };
}

function buildSingleElim(teamNames, mode) {
  const { size, slots } = orderedSlots(teamNames, mode, 16);
  const gridRows = size * 2;
  const firstRoundTeams = slots.map((name, i) => ({ id: `t${i + 1}`, name }));

  const rounds = [];
  let matchCounter = 1;
  let winnerCounter = 1;

  let current = [];
  let span = 4;
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

function teamSource(teamId) {
  return { type: "team", teamId };
}

function winnerSource(matchId) {
  return { type: "winner", matchId };
}

function loserSource(matchId) {
  return { type: "loser", matchId };
}

function makeDeMatch(matchId, sourceA, sourceB) {
  return {
    matchId,
    teams: [
      { id: `${matchId}_a`, source: sourceA },
      { id: `${matchId}_b`, source: sourceB },
    ],
  };
}

function buildDoubleElim(teamNames, mode) {
  const { size, slots } = orderedSlots(teamNames, mode, 8);
  const slotTeamIds = slots.map((_, i) => `t${i + 1}`);
  const teamById = Object.fromEntries(slotTeamIds.map((id, i) => [id, slots[i]]));

  const winners = [];
  const losers = [];
  const finals = [];

  if (size === 2) {
    winners.push({
      roundId: "wb_r1",
      title: "Winners Final",
      matches: [makeDeMatch("wb_r1_m1", teamSource("t1"), teamSource("t2"))],
    });

    finals.push({
      roundId: "gf_r1",
      title: "Grand Final",
      matches: [makeDeMatch("gf_r1_m1", winnerSource("wb_r1_m1"), loserSource("wb_r1_m1"))],
    });
  } else if (size === 4) {
    winners.push({
      roundId: "wb_r1",
      title: "Winners Round 1",
      matches: [
        makeDeMatch("wb_r1_m1", teamSource("t1"), teamSource("t2")),
        makeDeMatch("wb_r1_m2", teamSource("t3"), teamSource("t4")),
      ],
    });

    winners.push({
      roundId: "wb_r2",
      title: "Winners Final",
      matches: [makeDeMatch("wb_r2_m1", winnerSource("wb_r1_m1"), winnerSource("wb_r1_m2"))],
    });

    losers.push({
      roundId: "lb_r1",
      title: "Losers Round 1",
      matches: [makeDeMatch("lb_r1_m1", loserSource("wb_r1_m1"), loserSource("wb_r1_m2"))],
    });

    losers.push({
      roundId: "lb_r2",
      title: "Losers Final",
      matches: [makeDeMatch("lb_r2_m1", winnerSource("lb_r1_m1"), loserSource("wb_r2_m1"))],
    });

    finals.push({
      roundId: "gf_r1",
      title: "Grand Final",
      matches: [makeDeMatch("gf_r1_m1", winnerSource("wb_r2_m1"), winnerSource("lb_r2_m1"))],
    });
  } else {
    winners.push({
      roundId: "wb_r1",
      title: "Winners Round 1",
      matches: [
        makeDeMatch("wb_r1_m1", teamSource("t1"), teamSource("t2")),
        makeDeMatch("wb_r1_m2", teamSource("t3"), teamSource("t4")),
        makeDeMatch("wb_r1_m3", teamSource("t5"), teamSource("t6")),
        makeDeMatch("wb_r1_m4", teamSource("t7"), teamSource("t8")),
      ],
    });

    winners.push({
      roundId: "wb_r2",
      title: "Winners Semifinals",
      matches: [
        makeDeMatch("wb_r2_m1", winnerSource("wb_r1_m1"), winnerSource("wb_r1_m2")),
        makeDeMatch("wb_r2_m2", winnerSource("wb_r1_m3"), winnerSource("wb_r1_m4")),
      ],
    });

    winners.push({
      roundId: "wb_r3",
      title: "Winners Final",
      matches: [makeDeMatch("wb_r3_m1", winnerSource("wb_r2_m1"), winnerSource("wb_r2_m2"))],
    });

    losers.push({
      roundId: "lb_r1",
      title: "Losers Round 1",
      matches: [
        makeDeMatch("lb_r1_m1", loserSource("wb_r1_m1"), loserSource("wb_r1_m2")),
        makeDeMatch("lb_r1_m2", loserSource("wb_r1_m3"), loserSource("wb_r1_m4")),
      ],
    });

    losers.push({
      roundId: "lb_r2",
      title: "Losers Round 2",
      matches: [
        makeDeMatch("lb_r2_m1", winnerSource("lb_r1_m1"), loserSource("wb_r2_m1")),
        makeDeMatch("lb_r2_m2", winnerSource("lb_r1_m2"), loserSource("wb_r2_m2")),
      ],
    });

    losers.push({
      roundId: "lb_r3",
      title: "Losers Semifinal",
      matches: [makeDeMatch("lb_r3_m1", winnerSource("lb_r2_m1"), winnerSource("lb_r2_m2"))],
    });

    losers.push({
      roundId: "lb_r4",
      title: "Losers Final",
      matches: [makeDeMatch("lb_r4_m1", winnerSource("lb_r3_m1"), loserSource("wb_r3_m1"))],
    });

    finals.push({
      roundId: "gf_r1",
      title: "Grand Final",
      matches: [makeDeMatch("gf_r1_m1", winnerSource("wb_r3_m1"), winnerSource("lb_r4_m1"))],
    });
  }

  return { size, slots, teamById, winners, losers, finals };
}

export function buildBracketViewModel(rawDraft) {
  const meta = normalizeDraft(rawDraft);

  if (meta.type === "roundrobin") {
    const teamIds = meta.teamNames.map((_, i) => `rr${i + 1}`);
    const teamById = Object.fromEntries(teamIds.map((id, i) => [id, meta.teamNames[i]]));
    const rounds = buildRoundRobinSchedule(teamIds, meta.roundCount);

    return { meta, kind: "roundrobin", rr: { teamIds, teamById, rounds } };
  }

  if (meta.type === "double") {
    const de = buildDoubleElim(meta.teamNames, meta.mode);
    return { meta, kind: "double", de };
  }

  const se = buildSingleElim(meta.teamNames, meta.mode);
  return { meta, kind: "single", se };
}
