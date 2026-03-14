import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/create.css";

import { normalizeDraft } from "../utils/bracketStructure.js";
import {
  addBracketToLibrary,
  draftKeyFor,
  progressKeyFor,
  generateBracketId,
} from "../utils/bracketLibrary.js";
import { saveProgress } from "../utils/bracketProgress.js";

export default function Create() {
  const navigate = useNavigate();

  const [type, setType] = useState("single"); // single | roundrobin
  const [teamCount, setTeamCount] = useState(2);
  const [mode, setMode] = useState("seeded"); // seeded | random (single only)
  const [roundCount, setRoundCount] = useState(1);

  const [bracketName, setBracketName] = useState("");
  const [bracketDesc, setBracketDesc] = useState("");
  const [teamNames, setTeamNames] = useState(["Team 1", "Team 2"]);

  useEffect(() => {
    setTeamNames((prev) => {
      const next = [...prev];
      while (next.length < teamCount) next.push(`Team ${next.length + 1}`);
      return next.slice(0, teamCount);
    });
  }, [teamCount]);

  const teams = useMemo(
    () => Array.from({ length: teamCount }, (_, i) => ({ id: i + 1 })),
    [teamCount]
  );

  return (
    <div className="page page-create">
      <h1>Create a Bracket</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();

          const draft = normalizeDraft({
            bracketName,
            bracketDesc,
            type,
            teamCount,
            teamNames,
            mode,
            roundCount,
          });

          const id = generateBracketId();
          localStorage.setItem(draftKeyFor(id), JSON.stringify(draft));
          saveProgress({ scores: {}, sig: {} }, progressKeyFor(id));

          addBracketToLibrary({
            id,
            createdAt: new Date().toISOString(),
            bracketName: draft.bracketName,
            teamCount: draft.teamCount,
            type: draft.type,
            mode: draft.mode,
          });

          navigate(`/bracket/${id}`);
        }}
      >
        <ul>
          <h4>Bracket Information</h4>

          <li>
            <label htmlFor="bracketName">Name of Bracket:</label>
            <input
              type="text"
              id="bracketName"
              placeholder="Name"
              value={bracketName}
              onChange={(e) => setBracketName(e.target.value)}
            />
          </li>

          <li>
            <label htmlFor="bracketDesc">Description:</label>
            <textarea
              id="bracketDesc"
              value={bracketDesc}
              onChange={(e) => setBracketDesc(e.target.value)}
            />
          </li>

          <li>
            <label>Bracket Type:</label>
            <fieldset className="button-group">
              <input
                type="radio"
                id="single"
                name="bracketType"
                checked={type === "single"}
                onChange={() => setType("single")}
              />
              <label htmlFor="single">Single Elimination</label>

              <input
                type="radio"
                id="roundrobin"
                name="bracketType"
                checked={type === "roundrobin"}
                onChange={() => setType("roundrobin")}
              />
              <label htmlFor="roundrobin">Round Robin</label>
            </fieldset>
          </li>

          {type === "roundrobin" && (
            <li>
              <label htmlFor="roundCount">Number of Rounds:</label>
              <input
                type="number"
                id="roundCount"
                min="1"
                max="20"
                value={roundCount}
                onChange={(e) => setRoundCount(Math.max(1, Number(e.target.value) || 1))}
              />
            </li>
          )}

          <li>
            <label htmlFor="teamCount">Number of Teams:</label>
            <input
              type="number"
              id="teamCount"
              min="2"
              max="16"
              value={teamCount}
              onChange={(e) => setTeamCount(Math.max(2, Math.min(16, Number(e.target.value) || 2)))}
            />
          </li>

          <li>
            <label>Team Names:</label>
            <div id="teamNamesContainer">
              {teams.map((t, idx) => (
                <input
                  key={t.id}
                  type="text"
                  placeholder={`Team ${t.id}`}
                  value={teamNames[idx] ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTeamNames((prev) => {
                      const next = [...prev];
                      next[idx] = v;
                      return next;
                    });
                  }}
                />
              ))}
            </div>
          </li>

          {type === "single" && (
            <li>
              <label>Seeding:</label>
              <fieldset className="button-group">
                <input
                  type="radio"
                  id="seeded"
                  name="seeding"
                  checked={mode === "seeded"}
                  onChange={() => setMode("seeded")}
                />
                <label htmlFor="seeded">Seeded</label>

                <input
                  type="radio"
                  id="random"
                  name="seeding"
                  checked={mode === "random"}
                  onChange={() => setMode("random")}
                />
                <label htmlFor="random">Random</label>
              </fieldset>
            </li>
          )}

          <h4> Sharing Options </h4>

          ...
          


        </ul>

        <button type="submit">Create</button>
      </form>
    </div>
  );
}