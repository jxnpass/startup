import React, { useEffect, useMemo } from "react";
import "../styles/bracket.css";
import { drawAllConnections } from "../utils/bracketLines.js";
import {
  BRACKET_STORAGE_KEY,
  useBracketDraftRaw,
  buildBracketViewModel,
} from "../utils/bracketStructure.js";

import {
  BRACKET_PROGRESS_KEY,
  useBracketProgressRaw,
  loadProgress,
  saveProgress,
  updateScore,
  clearMatchScores,
} from "../utils/bracketProgress.js";

export default function Bracket() {
  const rawDraftJson = useBracketDraftRaw(BRACKET_STORAGE_KEY);
  const rawProgressJson = useBracketProgressRaw(BRACKET_PROGRESS_KEY);

  const rawDraftObj = useMemo(() => {
    if (!rawDraftJson) return null;
    try {
      return JSON.parse(rawDraftJson);
    } catch {
      return null;
    }
  }, [rawDraftJson]);

  const vm = useMemo(() => (rawDraftObj ? buildBracketViewModel(rawDraftObj) : null), [rawDraftObj]);

  const progress = useMemo(() => {
    // Use tool’s raw snapshot to parse, but fall back safely
    if (!rawProgressJson) return { scores: {}, sig: {} };
    try {
      const parsed = JSON.parse(rawProgressJson);
      return {
        scores: parsed?.scores && typeof parsed.scores === "object" ? parsed.scores : {},
        sig: parsed?.sig && typeof parsed.sig === "object" ? parsed.sig : {},
      };
    } catch {
      return { scores: {}, sig: {} };
    }
  }, [rawProgressJson]);

  // Derive bracket state (names in each slot + winners + styling) from vm + progress
  const derived = useMemo(() => {
    if (!vm || vm.kind !== "single") {
      return {
        nameBySlotId: {},
        winnerByWinnerId: {},
        winnerTeamIdByMatchId: {},
        loserTeamIdByMatchId: {},
        championName: "",
        signatures: {},
      };
    }

    // 1) Collect fixed slot names for t1..tN from first round matches
    const nameBySlotId = {};
    const rounds = vm.rounds;

    const firstRound = rounds[0];
    if (firstRound?.matches) {
      for (const m of firstRound.matches) {
        if (!m.teams) continue;
        for (const t of m.teams) {
          // Only bind team slots t#
          if (typeof t.id === "string" && t.id.startsWith("t")) {
            nameBySlotId[t.id] = t.label;
          }
        }
      }
    }

    // Winner name resolved by winner placeholder id (w#)
    const winnerByWinnerId = {};
    const winnerTeamIdByMatchId = {};
    const loserTeamIdByMatchId = {};

    // Also compute participant signatures per match
    const signatures = {};

    const scores = progress.scores || {};

    function resolveName(teamSlotId) {
      if (!teamSlotId) return "";
      if (teamSlotId.startsWith("t")) return nameBySlotId[teamSlotId] ?? "";
      if (teamSlotId.startsWith("w")) return winnerByWinnerId[teamSlotId] ?? "";
      return "";
    }

    function isBye(name) {
      return (name ?? "").toUpperCase() === "BYE";
    }

    // Walk matches in round order, excluding champion “match”
    for (const round of rounds) {
      for (const m of round.matches) {
        if (m.champion) continue;

        const a = m.teams?.[0];
        const b = m.teams?.[1];
        const aId = a?.id ?? "";
        const bId = b?.id ?? "";

        const aName = resolveName(aId);
        const bName = resolveName(bId);

        const sig = `${aName}||${bName}`;
        signatures[m.matchId] = sig;

        // Determine winner
        const aScoreRaw = scores?.[m.matchId]?.[aId];
        const bScoreRaw = scores?.[m.matchId]?.[bId];

        const aScore = aScoreRaw === "" || aScoreRaw == null ? null : Number(aScoreRaw);
        const bScore = bScoreRaw === "" || bScoreRaw == null ? null : Number(bScoreRaw);

        let winnerName = "";
        let winnerTeamId = "";
        let loserTeamId = "";

        // Auto-advance for BYE
        if (isBye(aName) && !isBye(bName)) {
          winnerName = bName;
          winnerTeamId = bId;
          loserTeamId = aId;
        } else if (!isBye(aName) && isBye(bName)) {
          winnerName = aName;
          winnerTeamId = aId;
          loserTeamId = bId;
        } else if (!isBye(aName) && !isBye(bName)) {
          // Normal score logic: higher score wins if both are numbers and not tied
          const aOk = typeof aScore === "number" && Number.isFinite(aScore);
          const bOk = typeof bScore === "number" && Number.isFinite(bScore);

          if (aOk && bOk && aScore !== bScore) {
            if (aScore > bScore) {
              winnerName = aName;
              winnerTeamId = aId;
              loserTeamId = bId;
            } else {
              winnerName = bName;
              winnerTeamId = bId;
              loserTeamId = aId;
            }
          }
        }

        // Fill winner placeholder
        if (m.winnerId) {
          winnerByWinnerId[m.winnerId] = winnerName;
        }

        winnerTeamIdByMatchId[m.matchId] = winnerTeamId;
        loserTeamIdByMatchId[m.matchId] = loserTeamId;
      }
    }

    // Champion is winner of the last non-champion match
    const allNonChampion = [];
    for (const r of rounds) {
      for (const m of r.matches) if (!m.champion) allNonChampion.push(m);
    }
    const lastMatch = allNonChampion[allNonChampion.length - 1];
    const championName = lastMatch?.winnerId ? (winnerByWinnerId[lastMatch.winnerId] ?? "") : "";

    return {
      nameBySlotId,
      winnerByWinnerId,
      winnerTeamIdByMatchId,
      loserTeamIdByMatchId,
      championName,
      signatures,
    };
  }, [vm, progress.scores]);

  // ✅ Requirement #3: clear downstream scores if participants change
  useEffect(() => {
    if (!vm || vm.kind !== "single") return;

    const current = loadProgress(BRACKET_PROGRESS_KEY);
    let changed = false;

    const nextSig = derived.signatures || {};

    // If a match’s participant signature changed, wipe that match’s scores.
    for (const [matchId, sig] of Object.entries(nextSig)) {
      const oldSig = current.sig?.[matchId];
      if (oldSig !== sig) {
        // participant changed -> clear scores
        clearMatchScores(current, matchId);
        current.sig[matchId] = sig;
        changed = true;
      }
    }

    // Remove sig entries for matches that no longer exist
    for (const oldMatchId of Object.keys(current.sig || {})) {
      if (!(oldMatchId in nextSig)) {
        delete current.sig[oldMatchId];
        delete current.scores[oldMatchId];
        changed = true;
      }
    }

    if (changed) {
      saveProgress(current, BRACKET_PROGRESS_KEY);
    }
  }, [vm, derived.signatures]);

  // Redraw lines after layout + state updates
  useEffect(() => {
    const run = () => requestAnimationFrame(() => drawAllConnections());
    run();
    window.addEventListener("resize", run);
    return () => window.removeEventListener("resize", run);
  }, [vm, progress, derived]);

  if (!rawDraftObj || !vm) {
    return (
      <div className="page page-bracket">
        <div className="bracket-header">
          <h1 className="bracket-title" id="bracketName">
            No bracket found
          </h1>
          <p className="bracket-description" id="bracketDesc">
            Create a bracket first. (Expected localStorage key:{" "}
            <code>{BRACKET_STORAGE_KEY}</code>)
          </p>
        </div>
      </div>
    );
  }

  const { meta } = vm;

  function displayNameForTeamId(teamId, fallbackLabel) {
    if (!teamId) return fallbackLabel ?? "";
    if (teamId.startsWith("t")) return derived.nameBySlotId[teamId] ?? fallbackLabel ?? "";
    if (teamId.startsWith("w")) {
      // winner placeholders show winner if determined, otherwise "Winner"
      return derived.winnerByWinnerId[teamId] || fallbackLabel || "Winner";
    }
    return fallbackLabel ?? "";
  }

  function getScore(matchId, teamId) {
    const v = progress.scores?.[matchId]?.[teamId];
    return v == null ? "" : v;
  }

  function onScoreChange(matchId, teamId, rawValue) {
    // allow empty
    if (rawValue === "") {
      updateScore({ matchId, teamId, value: "" }, BRACKET_PROGRESS_KEY);
      return;
    }

    // allow only digits (keep it friendly)
    const cleaned = rawValue.replace(/[^\d]/g, "");
    updateScore({ matchId, teamId, value: cleaned }, BRACKET_PROGRESS_KEY);
  }

  return (
    <div className="page page-bracket">
      <div className="bracket-header">
        <h1 className="bracket-title" id="bracketName">
          {meta.bracketName}
        </h1>

        <p className="bracket-description" id="bracketDesc">
          {meta.bracketDesc || ""}
        </p>

        <div className="bracket-description" style={{ marginTop: "0.75rem" }}>
          <div>
            <strong>Type:</strong> <span id={meta.type}>{meta.type}</span>
          </div>
          <div>
            <strong>Number of Teams:</strong>{" "}
            <span id="teamCount">{meta.teamCount}</span>
          </div>
          <div>
            <strong>Mode:</strong> <span id={meta.mode}>{meta.mode}</span>
          </div>
        </div>
      </div>

      <div className="bracket-page">
        <div className="bracket-wrapper">
          <div className="bracket">
            {vm.kind === "roundrobin" ? (
              <section className="round">
                <h2>Round Robin</h2>
                <div className="round-grid">
                  <div className="match" style={{ gridRow: "1 / span 4" }}>
                    <div className="team">Round-robin coming next.</div>
                  </div>
                </div>
              </section>
            ) : (
              vm.rounds.map((round, roundIdx) => {
                const mult = Math.pow(2, roundIdx);

                return (
                  <section
                    key={round.roundId}
                    className="round"
                    style={{
                      "--grid-rows": round.gridRows,
                      "--round-depth": roundIdx,
                      "--round-mult": mult,
                    }}
                  >
                    <h2>{round.title}</h2>

                    <div className="round-grid">
                      {round.matches.map((m) => {
                        if (m.champion) {
                          return (
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
                          );
                        }

                        const winnerTeamId = derived.winnerTeamIdByMatchId[m.matchId];
                        const loserTeamId = derived.loserTeamIdByMatchId[m.matchId];

                        return (
                          <div
                            className="match"
                            id={m.matchId}
                            key={m.matchId}
                            style={{ gridRow: `${m.gridStart} / span ${m.gridSpan}` }}
                          >
                            {m.teams.map((t) => {
                              const name = displayNameForTeamId(t.id, t.label);

                              const isWinner = t.id && t.id === winnerTeamId;
                              const isLoser = t.id && t.id === loserTeamId;

                              const teamClass =
                                "team" + (isWinner ? " team-winner" : isLoser ? " team-loser" : "");

                              return (
                                <div className={teamClass} id={t.id} key={t.id}>
                                  {name}
                                  <input
                                    value={getScore(m.matchId, t.id)}
                                    onChange={(e) => onScoreChange(m.matchId, t.id, e.target.value)}
                                    inputMode="numeric"
                                    aria-label={`Score for ${name}`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            )}
          </div>

          <svg id="bracket-lines" />
        </div>
      </div>
    </div>
  );
}