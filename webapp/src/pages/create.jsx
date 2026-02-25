import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/create.css";
import { saveBracketDraft } from "../utils/bracketDraft.js";

export default function Create() {
  const navigate = useNavigate();

  const [bracketName, setBracketName] = useState("");
  const [bracketDesc, setBracketDesc] = useState("");

  const [type, setType] = useState("single"); // "single" | "roundrobin"
  const [teamCount, setTeamCount] = useState(2);

  const [mode, setMode] = useState("seeded"); // seeded | random (single only)
  const [rrRounds, setRrRounds] = useState(1);

  const teams = useMemo(() => {
    return Array.from({ length: teamCount }, (_, i) => ({
      id: i + 1,
      name: "",
    }));
  }, [teamCount]);

  const [teamNames, setTeamNames] = useState([]);

  // keep teamNames array sized to teamCount
  React.useEffect(() => {
    setTeamNames((prev) => {
      const next = [...prev];
      while (next.length < teamCount) next.push("");
      return next.slice(0, teamCount);
    });
  }, [teamCount]);

  const baseRR = Math.max(1, teamCount - 1); // typical single round robin

  return (
    <div className="page page-create">
      <h1>Create a Bracket</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();

          const draft = {
            bracketName,
            bracketDesc,
            type, // "single" or "roundrobin"
            teamCount,
            teamNames: teamNames.map((n, i) => (n?.trim() ? n.trim() : `Team ${i + 1}`)),
            mode: type === "roundrobin" ? "random" : mode,
            rrRounds: type === "roundrobin" ? rrRounds : undefined,
          };

          saveBracketDraft(draft);
          navigate("/bracket");
        }}
      >
        <ul>
          <h4>Bracket Information</h4>

          <li>
            <label htmlFor="bracketName">Name of Bracket:</label>
            <input
              type="text"
              id="bracketName"
              value={bracketName}
              onChange={(e) => setBracketName(e.target.value)}
              placeholder="Name"
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
                value="single"
                checked={type === "single"}
                onChange={() => setType("single")}
              />
              <label htmlFor="single">Single Elimination</label>

              <input
                type="radio"
                id="roundrobin"
                name="bracketType"
                value="roundrobin"
                checked={type === "roundrobin"}
                onChange={() => setType("roundrobin")}
              />
              <label htmlFor="roundrobin">Round Robin</label>
            </fieldset>
          </li>

          {type === "roundrobin" && (
            <li>
              <label htmlFor="rrRounds">Number of Rounds:</label>
              <input
                type="number"
                id="rrRounds"
                min="1"
                max="50"
                step="1"
                value={rrRounds}
                onChange={(e) => setRrRounds(Math.max(1, Number(e.target.value) || 1))}
              />
              <div style={{ fontSize: "0.9rem", color: "#4169E1", marginTop: "0.25rem" }}>
                Typical single round robin is {baseRR} rounds (each team plays everyone once).
              </div>
            </li>
          )}

          <li>
            <label htmlFor="teamCount">Number of Teams:</label>
            <input
              type="number"
              id="teamCount"
              min="2"
              max="16"
              step="1"
              value={teamCount}
              onChange={(e) =>
                setTeamCount(Math.max(2, Math.min(16, Number(e.target.value) || 2)))
              }
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

          {/* Seeding only for single elimination */}
          {type === "single" && (
            <li>
              <label>Seeding:</label>
              <fieldset className="button-group">
                <input
                  type="radio"
                  id="seeded"
                  name="seeding"
                  value="seeded"
                  checked={mode === "seeded"}
                  onChange={() => setMode("seeded")}
                />
                <label htmlFor="seeded">Seeded</label>

                <input
                  type="radio"
                  id="random"
                  name="seeding"
                  value="random"
                  checked={mode === "random"}
                  onChange={() => setMode("random")}
                />
                <label htmlFor="random">Random</label>
              </fieldset>
            </li>
          )}

          {/* keep additional options as-is (future checkpoint) */}
          <h4>Additional Options</h4>

          <li>
            <label htmlFor="colorTheme">Select a Color Theme:</label>
            <select id="colorTheme" name="varColorTheme" defaultValue="Default">
              <option>Default</option>
              <option>Theme1</option>
              <option>Theme2</option>
              <option>Other Options (API CALL)</option>
            </select>
          </li>

          <li>
            <label htmlFor="startDate">Start Date/Time:</label>
            <input type="datetime-local" id="startDate" name="varDatetimeStart" />
          </li>

          <li>
            <label htmlFor="timePerMatch">Time Per Match (minutes):</label>
            <input type="number" id="timePerMatch" name="varTimePerMatch" />
          </li>

          <li>
            <label htmlFor="gamesAtOnce">Number of Games Played at Same Time:</label>
            <input type="number" id="gamesAtOnce" name="varGamesPerTimepoint" />
          </li>

          <h4>Sharing</h4>

          <li>
            <label htmlFor="viewing">Viewing:</label>
            <select id="viewing" name="varViewing" defaultValue="Private">
              <option>Private</option>
              <option>Public</option>
            </select>
          </li>

          <li>
            <label htmlFor="editors">Editors:</label>
            <select id="editors" name="varEditors" defaultValue="None">
              <option>None</option>
              <option>Private</option>
              <option>Public</option>
            </select>
          </li>

          <li>
            <label htmlFor="editorEmails">Editor Emails:</label>
            <input
              type="text"
              id="editorEmails"
              name="varEditorEmails"
              placeholder="comma-separated emails"
            />
          </li>
        </ul>

        <button type="submit">Create</button>
      </form>
    </div>
  );
}