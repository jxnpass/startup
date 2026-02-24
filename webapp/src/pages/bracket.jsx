import React, { useEffect, useMemo } from "react";
import "../styles/bracket.css";
import { drawAllConnections } from "../utils/bracketLines.js";
import {
  BRACKET_STORAGE_KEY,
  useBracketDraftRaw,
  buildBracketViewModel,
} from "../utils/bracketStructure.js";

export default function Bracket() {
  const rawJson = useBracketDraftRaw(BRACKET_STORAGE_KEY);

  const rawObj = useMemo(() => {
    if (!rawJson) return null;
    try {
      return JSON.parse(rawJson);
    } catch {
      return null;
    }
  }, [rawJson]);

  const vm = useMemo(() => (rawObj ? buildBracketViewModel(rawObj) : null), [rawObj]);

  useEffect(() => {
    const run = () => requestAnimationFrame(() => drawAllConnections());
    run();
    window.addEventListener("resize", run);
    return () => window.removeEventListener("resize", run);
  }, [vm]);

  if (!rawObj || !vm) {
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
                    <div className="team">{vm.note}</div>
                  </div>
                </div>
              </section>
            ) : (
              vm.rounds.map((round, roundIdx) => {
                const mult = Math.pow(2, roundIdx); // 1,2,4,8...
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
                      {round.matches.map((m) =>
                        m.champion ? (
                          <div
                            className="match champion"
                            id={m.matchId}
                            key={m.matchId}
                            style={{ gridRow: `${m.gridStart} / span ${m.gridSpan}` }}
                          >
                            <div className="team">
                              Champion <input />
                            </div>
                          </div>
                        ) : (
                          <div
                            className="match"
                            id={m.matchId}
                            key={m.matchId}
                            style={{ gridRow: `${m.gridStart} / span ${m.gridSpan}` }}
                          >
                            {m.teams.map((t) => (
                              <div className="team" id={t.id} key={t.id}>
                                {t.label} <input />
                              </div>
                            ))}
                          </div>
                        )
                      )}
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