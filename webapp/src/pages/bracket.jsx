import React, { useEffect, useMemo } from "react";
import "../styles/bracket.css";
import { drawAllConnections } from "../utils/bracketLines.js";
import {
  BRACKET_STORAGE_KEY,
  useBracketDraftRaw,
  buildBracketViewModel,
} from "../utils/bracketStructure.js";

export default function Bracket() {
  // ✅ Subscribe to raw JSON string (stable snapshot)
  const rawJson = useBracketDraftRaw(BRACKET_STORAGE_KEY);

  // ✅ Parse only when the string changes
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

  function roundClassName(index, total) {
    if (index === total - 1) return "round round-1";
    if (index === total - 2) return "round round-2";
    if (index === total - 3) return "round round-4";
    if (index === total - 4) return "round round-8";
    return "round round-16";
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
            {/* optional hidden container for now */}
            <section style={{ display: "none" }}>
              <ul id="teamNamesContainer">
                {meta.teamNames.map((t, i) => (
                  <li key={`${i}-${t}`}>{t}</li>
                ))}
              </ul>
            </section>

            {vm.kind === "roundrobin" ? (
              <section className="round round-16">
                <h2>Round Robin</h2>
                <div className="pair">
                  <div className="pair-inner">
                    <div className="match">
                      <div className="team">{vm.note}</div>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              vm.rounds.map((round, idx) => (
                <section
                  key={round.roundId}
                  className={roundClassName(idx, vm.rounds.length)}
                >
                  <h2>{round.title}</h2>

                  {chunk(round.matches, round.groupSize).map((group, gIdx) => (
                    <div className="pair" key={`${round.roundId}_pair_${gIdx}`}>
                      <div className="pair-inner">
                        {group.map((m) =>
                          m.champion ? (
                            <div
                              className="match champion"
                              id={m.matchId}
                              key={m.matchId}
                            >
                              <div className="team">
                                Champion <input />
                              </div>
                            </div>
                          ) : (
                            <div className="match" id={m.matchId} key={m.matchId}>
                              {m.teams.map((t) => (
                                <div className="team" id={t.id} key={t.id}>
                                  {t.label} <input />
                                </div>
                              ))}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </section>
              ))
            )}
          </div>

          <svg id="bracket-lines" />
        </div>
      </div>
    </div>
  );
}

function chunk(arr, size) {
  if (!size || size <= 0) return [arr];
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
