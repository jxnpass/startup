import React, { useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/bracket.css";

import { draftKeyFor, progressKeyFor } from "../utils/bracketLibrary.js";
import { useBracketProgressRaw, saveProgress } from "../utils/bracketProgress.js";
import { buildBracketViewModel } from "../utils/bracketStructure.js";
import { drawAllConnections } from "../utils/bracketLines.js";

function readDraft(id) {
  const raw = localStorage.getItem(draftKeyFor(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeParseProgress(raw) {
  if (!raw) return { scores: {}, sig: {} };
  try {
    const p = JSON.parse(raw);
    return {
      scores: p?.scores && typeof p.scores === "object" ? p.scores : {},
      sig: p?.sig && typeof p.sig === "object" ? p.sig : {},
    };
  } catch {
    return { scores: {}, sig: {} };
  }
}

function isByeName(name) {
  return (name ?? "").toString().toUpperCase() === "BYE";
}

export default function Bracket() {
  const { id } = useParams();
  if (!id) {
    return (
      <div className="page page-bracket">
        <p>
          No bracket selected. Go to <Link to="/list">My Brackets</Link>.
        </p>
      </div>
    );
  }

  const draft = useMemo(() => readDraft(id), [id]);
  const vm = useMemo(() => (draft ? buildBracketViewModel(draft) : null), [draft]);

  const pKey = progressKeyFor(id);
  const rawProgress = useBracketProgressRaw(pKey);
  const progress = useMemo(() => safeParseProgress(rawProgress), [rawProgress]);

  useEffect(() => {
    // Redraw lines after DOM settles
    const raf = requestAnimationFrame(() => drawAllConnections());
    const onResize = () => drawAllConnections();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [vm, progress]);

  if (!vm) {
    return (
      <div className="page page-bracket">
        <p>
          Bracket not found. Go to <Link to="/list">My Brackets</Link>.
        </p>
      </div>
    );
  }

  const { meta } = vm;

  return (
    <div className="page page-bracket">
      <div className="bracket-header">
        <h1 className="bracket-title">{meta.bracketName}</h1>
        <p className="bracket-description">{meta.bracketDesc}</p>
        <p className="bracket-description">
          <Link to="/list">← Back to My Brackets</Link>
        </p>
      </div>

      {vm.kind === "roundrobin" ? (
        <RoundRobinView vm={vm} progress={progress} pKey={pKey} />
      ) : (
        <SingleElimView vm={vm} progress={progress} pKey={pKey} />
      )}
    </div>
  );
}

/* ---------------- SINGLE ELIM ---------------- */

function SingleElimView({ vm, progress, pKey }) {
  const { se } = vm;

  // Resolve a teamId into a "signature" (the actual base team id t#) and a display name.
  // winnerIds (w#) resolve from their source match.
  const matchByWinner = useMemo(() => {
    const map = {};
    for (const r of se.rounds) {
      if (!r.matches) continue;
      for (const m of r.matches) map[m.winnerId] = m;
    }
    return map;
  }, [se]);

  function getScore(matchId, teamId) {
    const v = progress?.scores?.[matchId]?.[teamId];
    return v == null ? "" : v;
  }

  function computeWinner(match) {
    const [A, B] = match.teams;

    const aName = resolveTeamName(A.id, match);
    const bName = resolveTeamName(B.id, match);

    // auto-advance BYE
    if (isByeName(aName) && !isByeName(bName)) return { winnerTeamId: B.id };
    if (isByeName(bName) && !isByeName(aName)) return { winnerTeamId: A.id };
    if (isByeName(aName) && isByeName(bName)) return { winnerTeamId: A.id };

    const aRaw = getScore(match.matchId, A.id);
    const bRaw = getScore(match.matchId, B.id);
    const a = aRaw === "" ? null : Number(aRaw);
    const b = bRaw === "" ? null : Number(bRaw);

    const aOk = typeof a === "number" && Number.isFinite(a);
    const bOk = typeof b === "number" && Number.isFinite(b);
    if (!aOk || !bOk) return { winnerTeamId: null };

    if (a > b) return { winnerTeamId: A.id };
    if (b > a) return { winnerTeamId: B.id };
    return { winnerTeamId: null };
  }

  function resolveTeamSig(teamId) {
    // Base teams are t#
    if (teamId.startsWith("t")) return teamId;

    // Winner placeholder w# -> follow its match
    const src = matchByWinner[teamId];
    if (!src) return teamId;

    const w = computeWinner(src).winnerTeamId;
    if (!w) return teamId; // unresolved winner yet
    return resolveTeamSig(w);
  }

  function resolveTeamName(teamId, contextMatch) {
    // if base team t#
    if (teamId.startsWith("t")) {
      const idx = Number(teamId.slice(1)) - 1;
      return se.slots[idx] ?? "Team";
    }

    // winner placeholder w#
    const src = matchByWinner[teamId];
    if (!src) return "Winner";

    const w = computeWinner(src).winnerTeamId;
    if (!w) return "Winner";

    return resolveTeamName(w, contextMatch);
  }

  // Whenever progress changes, clear downstream scores if the participating teams changed.
  useEffect(() => {
    // Build expected signatures for every match slot
    const nextSig = {};
    let changed = false;

    // Copy scores so we can delete entries if needed
    const nextScores = JSON.parse(JSON.stringify(progress.scores || {}));

    for (const r of se.rounds) {
      if (!r.matches) continue;
      for (const m of r.matches) {
        const aId = m.teams[0].id;
        const bId = m.teams[1].id;

        const aSig = resolveTeamSig(aId);
        const bSig = resolveTeamSig(bId);

        nextSig[m.matchId] = { aSig, bSig };

        const prev = progress.sig?.[m.matchId];
        if (prev && (prev.aSig !== aSig || prev.bSig !== bSig)) {
          // participants changed -> wipe this match scores
          delete nextScores[m.matchId];
          changed = true;
        }
      }
    }

    // Also update sig if it differs
    const prevSigRaw = JSON.stringify(progress.sig || {});
    const nextSigRaw = JSON.stringify(nextSig);
    if (prevSigRaw !== nextSigRaw) changed = true;

    if (changed) {
      saveProgress({ scores: nextScores, sig: nextSig }, pKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [se, pKey, rawStable(progress)]);

  function onScoreChange(matchId, teamId, rawValue) {
    const cleaned = rawValue === "" ? "" : rawValue.replace(/[^\d]/g, "");
    const p = safeClone(progress);
    if (!p.scores[matchId]) p.scores[matchId] = {};
    p.scores[matchId][teamId] = cleaned;
    saveProgress(p, pKey);
  }

  // Champion name comes from se.rounds championFrom
  const championName = resolveTeamName(se.rounds[se.rounds.length - 1].championFrom);

  return (
    <div className="bracket-page">
      <div className="bracket-wrapper">
        <svg id="bracket-lines" />
        <div className="bracket">
          {se.rounds.map((r, idx) => {
            if (r.roundId === "round_champion") {
              return (
                <div
                  className="round"
                  key={r.roundId}
                  style={{
                    "--grid-rows": se.gridRows,
                    "--round-depth": idx,
                  }}
                >
                  <h2>{r.title}</h2>
                  <div className="round-grid">
                    <div
                      className="match champion"
                      id="m16"
                      style={{ gridRow: `${Math.floor(se.gridRows / 2) - 1} / span 4` }}
                    >
                      <div className="team">
                        <span>{championName || "Champion"}</span>
                        <span />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                className="round"
                key={r.roundId}
                style={{
                  "--grid-rows": r.gridRows,
                  "--round-depth": r.depth ?? idx,
                }}
              >
                <h2>{r.title}</h2>
                <div className="round-grid">
                  {r.matches.map((m) => {
                    const A = m.teams[0];
                    const B = m.teams[1];

                    const aName = resolveTeamName(A.id, m);
                    const bName = resolveTeamName(B.id, m);

                    const aScore = getScore(m.matchId, A.id);
                    const bScore = getScore(m.matchId, B.id);

                    const winner = computeWinner(m).winnerTeamId;

                    const aWin = winner === A.id;
                    const bWin = winner === B.id;

                    // If either side is BYE, disable score input
                    const disableA = isByeName(aName) || isByeName(bName);
                    const disableB = isByeName(aName) || isByeName(bName);

                    return (
                      <div
                        className="match"
                        id={m.matchId}
                        key={m.matchId}
                        style={{ gridRow: `${m.gridStart} / span ${m.gridSpan}` }}
                      >
                        <div
                          className={"team " + (aWin ? "team-winner" : "")}
                          // IMPORTANT: Only base teams (t#) get DOM ids.
                          // Winner placeholders (w#) are rendered without DOM ids so ids remain unique.
                          id={A.id.startsWith("t") ? A.id : undefined}
                          data-teamid={A.id}
                        >
                          <span>{aName}</span>
                          <input
                            value={aScore}
                            onChange={(e) => onScoreChange(m.matchId, A.id, e.target.value)}
                            inputMode="numeric"
                            disabled={disableA}
                          />
                        </div>

                        <div
                          className={"team " + (bWin ? "team-winner" : "")}
                          id={B.id.startsWith("t") ? B.id : undefined}
                          data-teamid={B.id}
                        >
                          <span>{bName}</span>
                          <input
                            value={bScore}
                            onChange={(e) => onScoreChange(m.matchId, B.id, e.target.value)}
                            inputMode="numeric"
                            disabled={disableB}
                          />
                        </div>

                        {/* Winner slot element for bracket lines */}
                        <div id={m.winnerId} className="winner-slot" aria-hidden="true" />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function safeClone(p) {
  return {
    scores: JSON.parse(JSON.stringify(p?.scores || {})),
    sig: JSON.parse(JSON.stringify(p?.sig || {})),
  };
}

// stable dependency helper: only changes when the JSON changes
function rawStable(obj) {
  return JSON.stringify(obj);
}

/* ---------------- ROUND ROBIN ---------------- */

function RoundRobinView({ vm, progress, pKey }) {
  const { teamById, rounds, teamIds } = vm.rr;

  function getScore(matchId, teamId) {
    const v = progress?.scores?.[matchId]?.[teamId];
    return v == null ? "" : v;
  }

  function onScoreChange(matchId, teamId, rawValue) {
    const cleaned = rawValue === "" ? "" : rawValue.replace(/[^\d]/g, "");
    const p = safeClone(progress);
    if (!p.scores[matchId]) p.scores[matchId] = {};
    p.scores[matchId][teamId] = cleaned;
    saveProgress(p, pKey);
  }

  const standings = useMemo(() => {
    const base = {};
    for (const id of teamIds) {
      base[id] = { id, name: teamById[id], wins: 0, diff: 0 };
    }

    for (const r of rounds) {
      for (const m of r.matches) {
        const aRaw = progress?.scores?.[m.matchId]?.[m.aId];
        const bRaw = progress?.scores?.[m.matchId]?.[m.bId];

        const aScore = aRaw === "" || aRaw == null ? null : Number(aRaw);
        const bScore = bRaw === "" || bRaw == null ? null : Number(bRaw);

        const aOk = typeof aScore === "number" && Number.isFinite(aScore);
        const bOk = typeof bScore === "number" && Number.isFinite(bScore);
        if (!aOk || !bOk) continue;

        base[m.aId].diff += aScore - bScore;
        base[m.bId].diff += bScore - aScore;

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
  }, [teamIds, teamById, rounds, progress]);

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
                  <div className={"team " + (aWin ? "team-winner" : "")}>
                    {aName}
                    <input
                      value={aScoreRaw}
                      onChange={(e) => onScoreChange(m.matchId, m.aId, e.target.value)}
                      inputMode="numeric"
                    />
                  </div>

                  <div className={"team " + (bWin ? "team-winner" : "")}>
                    {bName}
                    <input
                      value={bScoreRaw}
                      onChange={(e) => onScoreChange(m.matchId, m.bId, e.target.value)}
                      inputMode="numeric"
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