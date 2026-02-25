// src/utils/roundRobin.js

function isBye(id) {
  return id === "BYE";
}

/**
 * Generates a base single round-robin cycle (n-1 rounds) via circle method.
 * - teamIds: ["rr1","rr2",...]
 * - for odd n: adds BYE
 * returns: rounds: [{ roundIndex, matches: [{matchId,aId,bId}] }]
 */
export function generateBaseRoundRobin(teamIds) {
  let ids = [...teamIds];
  const hadOdd = ids.length % 2 === 1;
  if (hadOdd) ids.push("BYE");

  const n = ids.length;
  const rounds = n - 1;
  const half = n / 2;

  // circle method: fix first, rotate the rest
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

      matches.push({
        // base matchId (we’ll prefix with cycle later if repeating)
        aId,
        bId,
      });
    }

    out.push({ roundIndex: r + 1, matches });

    // rotate
    rot = [rot[rot.length - 1], ...rot.slice(0, rot.length - 1)];
  }

  return out;
}

/**
 * Build rounds up to user requested roundCount.
 * If roundCount > baseRounds, repeat cycles and prefix matchId with cycle.
 */
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
        matchId: `rr_c${cycle}_r${baseRound.roundIndex}_m${idx + 1}`, // stable enough
        aId: m.aId,
        bId: m.bId,
      })),
    });
  }

  return rounds;
}