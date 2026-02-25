// src/utils/roundRobin.js
function isBye(id) {
  return id === "BYE";
}

export function generateBaseRoundRobin(teamIds) {
  let ids = [...teamIds];
  if (ids.length % 2 === 1) ids.push("BYE");

  const n = ids.length;
  const rounds = n - 1;
  const half = n / 2;

  let fixed = ids[0];
  let rot = ids.slice(1);

  const out = [];
  for (let r = 0; r < rounds; r++) {
    const left = [fixed, ...rot.slice(0, half - 1)];
    const right = rot.slice(half - 1).slice().reverse();

    const matches = [];
    for (let i = 0; i < half; i++) {
      const aId = left[i];
      const bId = right[i];
      if (isBye(aId) || isBye(bId)) continue;
      matches.push({ aId, bId });
    }

    out.push({ roundIndex: r + 1, matches });
    rot = [rot[rot.length - 1], ...rot.slice(0, rot.length - 1)];
  }

  return out;
}

export function buildRoundRobinSchedule(teamIds, roundCount) {
  const base = generateBaseRoundRobin(teamIds);
  const baseRounds = base.length;
  const target = Math.max(1, Number(roundCount) || baseRounds);

  const rounds = [];
  for (let i = 0; i < target; i++) {
    const cycle = Math.floor(i / baseRounds) + 1;
    const baseRound = base[i % baseRounds];

    rounds.push({
      roundIndex: i + 1,
      matches: baseRound.matches.map((m, idx) => ({
        matchId: `rr_c${cycle}_r${baseRound.roundIndex}_m${idx + 1}`,
        aId: m.aId,
        bId: m.bId,
      })),
    });
  }
  return rounds;
}