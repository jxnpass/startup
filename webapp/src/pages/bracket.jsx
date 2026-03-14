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

function safeClone(p) {
  return {
    scores: JSON.parse(JSON.stringify(p?.scores || {})),
    sig: JSON.parse(JSON.stringify(p?.sig || {})),
  };
}

function rawStable(obj) {
  return JSON.stringify(obj);
}

function buildDoubleResolver(de, progress) {
  const matchById = {};
  for (const section of [de.winners, de.losers, de.finals]) {
    for (const round of section) {
      for (const match of round.matches) {
        matchById[match.matchId] = match;
      }
    }
  }

  function getScore(matchId, slotId) {
    const v = progress?.scores?.[matchId]?.[slotId];
    return v == null ? "" : v;
  }

  function resolveName(source) {
    if (!source) return "TBD";
    if (source.type === "team") return de.teamById[source.teamId] ?? "Team";

    const match = matchById[source.matchId];
    if (!match) return source.type === "winner" ? "Winner" : "Loser";

    const winnerSlot = computeWinnerSlot(match);
    const loserSlot = computeLoserSlot(match);
    const slotId = source.type === "winner" ? winnerSlot : loserSlot;
    if (!slotId) return source.type === "winner" ? "Winner" : "Loser";

    const slot = match.teams.find((team) => team.id === slotId);
    return slot ? resolveName(slot.source) : "TBD";
  }

  function resolveSig(source) {
    if (!source) return "";
    if (source.type === "team") return source.teamId;

    const match = matchById[source.matchId];
    if (!match) return "";

    const winnerSlot = computeWinnerSlot(match);
    const loserSlot = computeLoserSlot(match);
    const slotId = source.type === "winner" ? winnerSlot : loserSlot;
    if (!slotId) return "";

    const slot = match.teams.find((team) => team.id === slotId);
    return slot ? resolveSig(slot.source) : "";
  }

  function computeWinnerSlot(match) {
    const [A, B] = match.teams;
    const aName = resolveName(A.source);
    const bName = resolveName(B.source);

    if (isByeName(aName) && !isByeName(bName)) return B.id;
    if (isByeName(bName) && !isByeName(aName)) return A.id;
    if (isByeName(aName) && isByeName(bName)) return A.id;

    const aRaw = getScore(match.matchId, A.id);
    const bRaw = getScore(match.matchId, B.id);
    const a = aRaw === "" ? null : Number(aRaw);
    const b = bRaw === "" ? null : Number(bRaw);

    const aOk = typeof a === "number" && Number.isFinite(a);
    const bOk = typeof b === "number" && Number.isFinite(b);
    if (!aOk || !bOk) return null;
    if (a > b) return A.id;
    if (b > a) return B.id;
    return null;
  }

  function computeLoserSlot(match) {
    const [A, B] = match.teams;
    const aName = resolveName(A.source);
    const bName = resolveName(B.source);

    if (isByeName(aName) && !isByeName(bName)) return A.id;
    if (isByeName(bName) && !isByeName(aName)) return B.id;
    if (isByeName(aName) && isByeName(bName)) return B.id;

    const winner = computeWinnerSlot(match);
    if (!winner) return null;
    return winner === A.id ? B.id : A.id;
  }

  return { matchById, getScore, resolveName, resolveSig, computeWinnerSlot, computeLoserSlot };
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
    const sizeHint = vm?.kind === "single" ? (vm.se?.size ?? 0) : 0;
    const raf = requestAnimationFrame(() => drawAllConnections(sizeHint));
    const onResize = () => drawAllConnections(sizeHint);
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
      </div>

      {vm.kind === "roundrobin" ? (
        <RoundRobinView vm={vm} progress={progress} pKey={pKey} />
      ) : vm.kind === "double" ? (
        <DoubleElimView vm={vm} progress={progress} pKey={pKey} />
      ) : (
        <SingleElimView vm={vm} progress={progress} pKey={pKey} />
      )}
    </div>
  );
}

function SingleElimView({ vm, progress, pKey }) {
  const { se } = vm;

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

    const aName = resolveTeamName(A.id);
    const bName = resolveTeamName(B.id);

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
    if (teamId.startsWith("t")) return teamId;

    const src = matchByWinner[teamId];
    if (!src) return teamId;

    const w = computeWinner(src).winnerTeamId;
    if (!w) return teamId;
    return resolveTeamSig(w);
  }

  function resolveTeamName(teamId) {
    if (teamId.startsWith("t")) {
      const idx = Number(teamId.slice(1)) - 1;
      return se.slots[idx] ?? "Team";
    }

    const src = matchByWinner[teamId];
    if (!src) return "Winner";

    const w = computeWinner(src).winnerTeamId;
    if (!w) return "Winner";

    return resolveTeamName(w);
  }

  useEffect(() => {
    const nextSig = {};
    let changed = false;
    const nextScores = JSON.parse(JSON.stringify(progress.scores || {}));

    for (const r of se.rounds) {
      if (!r.matches) continue;
      for (const m of r.matches) {
        const aSig = resolveTeamSig(m.teams[0].id);
        const bSig = resolveTeamSig(m.teams[1].id);
        nextSig[m.matchId] = { aSig, bSig };

        const prev = progress.sig?.[m.matchId];
        if (prev && (prev.aSig !== aSig || prev.bSig !== bSig)) {
          delete nextScores[m.matchId];
          changed = true;
        }
      }
    }

    if (JSON.stringify(progress.sig || {}) !== JSON.stringify(nextSig)) changed = true;
    if (changed) saveProgress({ scores: nextScores, sig: nextSig }, pKey);
  }, [se, pKey, progress, matchByWinner]);

  function onScoreChange(matchId, teamId, rawValue) {
    const cleaned = rawValue === "" ? "" : rawValue.replace(/[^\d]/g, "");
    const p = safeClone(progress);
    if (!p.scores[matchId]) p.scores[matchId] = {};
    p.scores[matchId][teamId] = cleaned;
    saveProgress(p, pKey);
  }

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
                  style={{ "--grid-rows": se.gridRows, "--round-depth": idx }}
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
                style={{ "--grid-rows": r.gridRows, "--round-depth": r.depth ?? idx }}
              >
                <h2>{r.title}</h2>
                <div className="round-grid">
                  {r.matches.map((m) => {
                    const A = m.teams[0];
                    const B = m.teams[1];
                    const aName = resolveTeamName(A.id);
                    const bName = resolveTeamName(B.id);
                    const aScore = getScore(m.matchId, A.id);
                    const bScore = getScore(m.matchId, B.id);
                    const winner = computeWinner(m).winnerTeamId;
                    const disableScores = isByeName(aName) || isByeName(bName);

                    return (
                      <div
                        className="match"
                        id={m.matchId}
                        key={m.matchId}
                        style={{ gridRow: `${m.gridStart} / span ${m.gridSpan}` }}
                      >
                        <div className={"team " + (winner === A.id ? "team-winner" : "")} id={A.id.startsWith("t") ? A.id : undefined} data-teamid={A.id}>
                          <span>{aName}</span>
                          <input
                            value={aScore}
                            onChange={(e) => onScoreChange(m.matchId, A.id, e.target.value)}
                            inputMode="numeric"
                            disabled={disableScores}
                          />
                        </div>
                        <div className={"team " + (winner === B.id ? "team-winner" : "")} id={B.id.startsWith("t") ? B.id : undefined} data-teamid={B.id}>
                          <span>{bName}</span>
                          <input
                            value={bScore}
                            onChange={(e) => onScoreChange(m.matchId, B.id, e.target.value)}
                            inputMode="numeric"
                            disabled={disableScores}
                          />
                        </div>
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

function DoubleElimView({ vm, progress, pKey }) {
  const { de } = vm;
  const resolver = useMemo(() => buildDoubleResolver(de, progress), [de, progress]);

  useEffect(() => {
    const nextSig = {};
    let changed = false;
    const nextScores = JSON.parse(JSON.stringify(progress.scores || {}));

    for (const section of [de.winners, de.losers, de.finals]) {
      for (const round of section) {
        for (const match of round.matches) {
          const aSig = resolver.resolveSig(match.teams[0].source);
          const bSig = resolver.resolveSig(match.teams[1].source);
          nextSig[match.matchId] = { aSig, bSig };

          const prev = progress.sig?.[match.matchId];
          if (prev && (prev.aSig !== aSig || prev.bSig !== bSig)) {
            delete nextScores[match.matchId];
            changed = true;
          }
        }
      }
    }

    if (JSON.stringify(progress.sig || {}) !== JSON.stringify(nextSig)) changed = true;
    if (changed) saveProgress({ scores: nextScores, sig: nextSig }, pKey);
  }, [de, resolver, progress, pKey]);

  function onScoreChange(matchId, slotId, rawValue) {
    const cleaned = rawValue === "" ? "" : rawValue.replace(/[^\d]/g, "");
    const p = safeClone(progress);
    if (!p.scores[matchId]) p.scores[matchId] = {};
    p.scores[matchId][slotId] = cleaned;
    saveProgress(p, pKey);
  }

  const championMatch = de.finals[de.finals.length - 1]?.matches?.[0];
  const championSlot = championMatch ? resolver.computeWinnerSlot(championMatch) : null;
  const champion = championSlot
    ? resolver.resolveName(championMatch.teams.find((team) => team.id === championSlot)?.source)
    : "Champion";

  function renderSection(title, rounds) {
    return (
      <section className="de-section">
        <h2 className="de-section-title">{title}</h2>
        <div className="de-grid">
          {rounds.map((round) => (
            <div className="de-round" key={round.roundId}>
              <h3>{round.title}</h3>
              <div className="de-round-matches">
                {round.matches.map((match) => {
                  const [A, B] = match.teams;
                  const aName = resolver.resolveName(A.source);
                  const bName = resolver.resolveName(B.source);
                  const winner = resolver.computeWinnerSlot(match);
                  const disableScores = isByeName(aName) || isByeName(bName);

                  return (
                    <div className="de-match" key={match.matchId}>
                      <div className={"team " + (winner === A.id ? "team-winner" : "") }>
                        <span>{aName}</span>
                        <input
                          value={resolver.getScore(match.matchId, A.id)}
                          onChange={(e) => onScoreChange(match.matchId, A.id, e.target.value)}
                          inputMode="numeric"
                          disabled={disableScores}
                        />
                      </div>
                      <div className={"team " + (winner === B.id ? "team-winner" : "") }>
                        <span>{bName}</span>
                        <input
                          value={resolver.getScore(match.matchId, B.id)}
                          onChange={(e) => onScoreChange(match.matchId, B.id, e.target.value)}
                          inputMode="numeric"
                          disabled={disableScores}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="de-page">
      {renderSection("Winners Bracket", de.winners)}
      {de.losers.length ? renderSection("Losers Bracket", de.losers) : null}
      {renderSection("Finals", de.finals)}

      <section className="de-champion-card champion">
        <h2>Champion</h2>
        <div className="team champion-team">
          <span>{champion}</span>
          <span />
        </div>
      </section>
    </div>
  );
}

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
