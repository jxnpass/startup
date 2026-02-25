import React, { useEffect, useMemo } from "react";
import "../styles/bracket.css";
import { drawAllConnections } from "../utils/bracketLines.js";

import { loadBracketDraft } from "../utils/bracketDraft.js";
import { buildViewModel } from "../utils/bracketStructure.js";

import {
  BRACKET_PROGRESS_KEY,
  useBracketProgressRaw,
  loadProgress,
  saveProgress,
  updateScore,
  clearMatchScores,
} from "../utils/bracketProgress.js";

export default function Bracket() {
  const rawProgress = useBracketProgressRaw(BRACKET_PROGRESS_KEY);

  const draft = useMemo(() => loadBracketDraft(), []);
  const vm = useMemo(() => (draft ? buildViewModel(draft) : null), [draft]);

  const progress = useMemo(() => {
    if (!rawProgress) return { scores: {}, sig: {} };
    try {
      const parsed = JSON.parse(rawProgress);
      return {
        scores: parsed?.scores && typeof parsed.scores === "object" ? parsed.scores : {},
        sig: parsed?.sig && typeof parsed.sig === "object" ? parsed.sig : {},
      };
    } catch {
      return { scores: {}, sig: {} };
    }
  }, [rawProgress]);

  // Keep lines updated for single-elim
  useEffect(() => {
    if (!vm || vm.kind !== "single") return;
    const run = () => requestAnimationFrame(() => drawAllConnections());
    run();
    window.addEventListener("resize", run);
    return () => window.removeEventListener("resize", run);
  }, [vm, progress]);

  if (!draft || !vm) {
    return (
      <div className="page page-bracket">
        <div className="bracket-header">
          <h1 className="bracket-title">No bracket found</h1>
          <p className="bracket-description">Create a bracket first.</p>
        </div>
      </div>
    );
  }

  const { meta } = vm;

  return (
    <div className="page page-bracket">
      <div className="bracket-header">
        <h1 className="bracket-title">{meta.bracketName}</h1>
        <p className="bracket-description">{meta.bracketDesc || ""}</p>

        <div className="bracket-description" style={{ marginTop: "0.75rem" }}>
          <div>
            <strong>Type:</strong> {meta.type}
          </div>
          <div>
            <strong>Number of Teams:</strong> {meta.teamCount}
          </div>
          <div>
            <strong>Mode:</strong> {meta.mode}
          </div>
          {meta.type === "roundrobin" && (
            <div>
              <strong>Rounds:</strong> {meta.rrRounds}
            </div>
          )}
        </div>
      </div>

      {vm.kind === "roundrobin" ? (
        <RoundRobinView vm={vm} progress={progress} />
      ) : (
        <SingleElimView vm={vm} progress={progress} />
      )}
    </div>
  );
}

/* ---------------------------- ROUND ROBIN VIEW ---------------------------- */

function RoundRobinView({ vm, progress }) {
  const { teamById, rounds, teamIds } = vm.rr;

  // participant signature clearing (prevents stale scores if schedule changes)
  useEffect(() => {
    const current = loadProgress(BRACKET_PROGRESS_KEY);
    let changed = false;

    const sigNow = {};
    for (const r of rounds) {
      for (const m of r.matches) {
        const aName = teamById[m.aId] ?? "";
        const bName = teamById[m.bId] ?? "";
        sigNow[m.matchId] = `${aName}||${bName}`;
      }
    }

    for (const [matchId, sig] of Object.entries(sigNow)) {
      const oldSig = current.sig?.[matchId];
      if (oldSig !== sig) {
        clearMatchScores(current, matchId);
        current.sig[matchId] = sig;
        changed = true;
      }
    }

    for (const oldMatchId of Object.keys(current.sig || {})) {
      if (!(oldMatchId in sigNow)) {
        delete current.sig[oldMatchId];
        delete current.scores[oldMatchId];
        changed = true;
      }
    }

    if (changed) saveProgress(current, BRACKET_PROGRESS_KEY);
  }, [rounds, teamById]);

  function getScore(matchId, teamId) {
    const v = progress.scores?.[matchId]?.[teamId];
    return v == null ? "" : v;
  }

  function onScoreChange(matchId, teamId, rawValue) {
    if (rawValue === "") {
      updateScore({ matchId, teamId, value: "" }, BRACKET_PROGRESS_KEY);
      return;
    }
    const cleaned = rawValue.replace(/[^\d]/g, "");
    updateScore({ matchId, teamId, value: cleaned }, BRACKET_PROGRESS_KEY);
  }

  // standings
  const standings = useMemo(() => {
    const base = {};
    for (const id of teamIds) {
      base[id] = { id, name: teamById[id], wins: 0, diff: 0 };
    }

    for (const r of rounds) {
      for (const m of r.matches) {
        const aRaw = progress.scores?.[m.matchId]?.[m.aId];
        const bRaw = progress.scores?.[m.matchId]?.[m.bId];

        const aScore = aRaw === "" || aRaw == null ? null : Number(aRaw);
        const bScore = bRaw === "" || bRaw == null ? null : Number(bRaw);

        const aOk = typeof aScore === "number" && Number.isFinite(aScore);
        const bOk = typeof bScore === "number" && Number.isFinite(bScore);
        if (!aOk || !bOk) continue;

        base[m.aId].diff += aScore - bScore;
        base[m.bId].diff += bScore - aScore;

        // no ties logic for now: if tie, no wins counted, per your note
        if (aScore > bScore) base[m.aId].wins += 1;
        else if (bScore > aScore) base[m.bId].wins += 1;
      }
    }

    const arr = Object.values(base);
    arr.sort((x, y) => {
      if (y.wins !== x.wins) return y.wins - x.wins;
      if (y.diff !== x.diff) return y.diff - x.diff;
      return x.name.localeCompare(y.name);
    });

    return arr;
  }, [rounds, teamIds, teamById, progress.scores]);

  return (
    <div className="rr-page">
      {rounds.map((r) => (
        <section className="rr-round" key={`rr_${r.roundIndex}`}>
          <h2 className="rr-title">Round {r.roundIndex}</h2>

          <div className="rr-matches">
            {r.matches.map((m) => {
              const aName = teamById[m.aId];
              const bName = teamById[m.bId];

              const aScoreRaw = getScore(m.matchId, m.aId);
              const bScoreRaw = getScore(m.matchId, m.bId);

              const aScore = aScoreRaw === "" ? null : Number(aScoreRaw);
              const bScore = bScoreRaw === "" ? null : Number(bScoreRaw);

              const aOk = typeof aScore === "number" && Number.isFinite(aScore);
              const bOk = typeof bScore === "number" && Number.isFinite(bScore);

              const aWin = aOk && bOk && aScore > bScore;
              const bWin = aOk && bOk && bScore > aScore;

              return (
                <div className="rr-match" key={m.matchId}>
                  <div className={"team " + (aWin ? "team-winner" : "")} id={m.aId}>
                    {aName}
                    <input
                      value={aScoreRaw}
                      onChange={(e) => onScoreChange(m.matchId, m.aId, e.target.value)}
                      inputMode="numeric"
                      aria-label={`Score for ${aName}`}
                    />
                  </div>

                  <div className={"team " + (bWin ? "team-winner" : "")} id={m.bId}>
                    {bName}
                    <input
                      value={bScoreRaw}
                      onChange={(e) => onScoreChange(m.matchId, m.bId, e.target.value)}
                      inputMode="numeric"
                      aria-label={`Score for ${bName}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="rr-standings">
        <h2 className="rr-title">Standings</h2>
        <div className="rr-standings-table">
          <div className="rr-standings-row rr-standings-head">
            <div>Rank</div>
            <div>Team</div>
            <div>Wins</div>
            <div>Point Diff</div>
          </div>

          {standings.map((t, i) => (
            <div className="rr-standings-row" key={t.id}>
              <div>{i + 1}</div>
              <div>{t.name}</div>
              <div>{t.wins}</div>
              <div>{t.diff}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* -------------------------- SINGLE ELIM VIEW -------------------------- */
/* Minimal: keeps your newer grid-based bracket usable; your checkpoint 3 logic
   can be re-dropped in here later if needed. For now we render the bracket and
   keep score inputs + winner highlighting similar to RR. */

function SingleElimView({ vm, progress }) {
  // Simple derived winner logic (BYE auto-advance + higher score wins)
  const derived = useMemo(() => {
    const nameBySlot = {};
    const winnerByW = {};
    const winnerTeamIdByMatch = {};
    const rounds = vm.rounds;

    const first = rounds[0];
    for (const m of first.matches) {
      for (const t of m.teams) {
        if (t.id.startsWith("t")) nameBySlot[t.id] = t.label;
      }
    }

    function resolveName(id) {
      if (id.startsWith("t")) return nameBySlot[id] ?? "";
      if (id.startsWith("w")) return winnerByW[id] ?? "";
      return "";
    }
    function isBye(name) {
      return (name ?? "").toUpperCase() === "BYE";
    }

    for (const r of rounds) {
      for (const m of r.matches) {
        if (m.champion) continue;
        const a = m.teams[0];
        const b = m.teams[1];

        const aName = resolveName(a.id);
        const bName = resolveName(b.id);

        const aRaw = progress.scores?.[m.matchId]?.[a.id];
        const bRaw = progress.scores?.[m.matchId]?.[b.id];

        const aScore = aRaw === "" || aRaw == null ? null : Number(aRaw);
        const bScore = bRaw === "" || bRaw == null ? null : Number(bRaw);

        let winnerName = "";
        let winnerTeamId = "";

        if (isBye(aName) && !isBye(bName)) {
          winnerName = bName;
          winnerTeamId = b.id;
        } else if (!isBye(aName) && isBye(bName)) {
          winnerName = aName;
          winnerTeamId = a.id;
        } else {
          const aOk = typeof aScore === "number" && Number.isFinite(aScore);
          const bOk = typeof bScore === "number" && Number.isFinite(bScore);
          if (aOk && bOk && aScore !== bScore) {
            if (aScore > bScore) {
              winnerName = aName;
              winnerTeamId = a.id;
            } else {
              winnerName = bName;
              winnerTeamId = b.id;
            }
          }
        }

        if (m.winnerId) winnerByW[m.winnerId] = winnerName;
        winnerTeamIdByMatch[m.matchId] = winnerTeamId;
      }
    }

    // champion name is winner of last non-champion match
    const all = [];
    for (const r of rounds) for (const m of r.matches) if (!m.champion) all.push(m);
    const last = all[all.length - 1];
    const championName = last?.winnerId ? winnerByW[last.winnerId] : "";

    return { nameBySlot, winnerByW, winnerTeamIdByMatch, championName };
  }, [vm, progress.scores]);

  function getScore(matchId, teamId) {
    const v = progress.scores?.[matchId]?.[teamId];
    return v == null ? "" : v;
  }

  function onScoreChange(matchId, teamId, rawValue) {
    if (rawValue === "") {
      updateScore({ matchId, teamId, value: "" }, BRACKET_PROGRESS_KEY);
      return;
    }
    const cleaned = rawValue.replace(/[^\d]/g, "");
    updateScore({ matchId, teamId, value: cleaned }, BRACKET_PROGRESS_KEY);
  }

  function displayName(id, fallback) {
    if (id.startsWith("t")) return derived.nameBySlot[id] ?? fallback;
    if (id.startsWith("w")) return derived.winnerByW[id] || fallback || "Winner";
    return fallback || "";
  }

  return (
    <div className="bracket-page">
      <div className="bracket-wrapper">
        <div className="bracket">
          {vm.rounds.map((round) => (
            <section className="round" key={round.roundId} style={{ "--grid-rows": round.gridRows }}>
              <h2>{round.title}</h2>

              <div className="round-grid">
                {round.matches.map((m) =>
                  m.champion ? (
                    <div
                      className="match champion"
                      id={m.matchId}
                      key={m.matchId}
                      style={{ gridRow: `${m.gridStart} / span ${m.gridSpan}` }}
                    >
                      <div className="team">
                        {derived.championName || "Champion"} <input disabled />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="match"
                      id={m.matchId}
                      key={m.matchId}
                      style={{ gridRow: `${m.gridStart} / span ${m.gridSpan}` }}
                    >
                      {m.teams.map((t) => {
                        const isWinner = derived.winnerTeamIdByMatch[m.matchId] === t.id;
                        return (
                          <div
                            className={"team " + (isWinner ? "team-winner" : "")}
                            id={t.id}
                            key={t.id}
                          >
                            {displayName(t.id, t.label)}
                            <input
                              value={getScore(m.matchId, t.id)}
                              onChange={(e) => onScoreChange(m.matchId, t.id, e.target.value)}
                              inputMode="numeric"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        <svg id="bracket-lines" />
      </div>
    </div>
  );
}