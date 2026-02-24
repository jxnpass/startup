import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/create.css";
import {
  createDefaultDraft,
  clampTeamCount,
  resizeTeamNames,
  saveDraftToStorage,
} from "../utils/bracketDraft.js";

export default function Create() {
  const navigate = useNavigate();

  const [draft, setDraft] = useState(() => createDefaultDraft());

  const teams = useMemo(() => {
    // Used only for rendering team inputs with stable IDs
    return Array.from({ length: draft.teamCount }, (_, i) => ({
      id: i + 1,
      name: draft.teamNames[i] ?? `Team ${i + 1}`,
    }));
  }, [draft.teamCount, draft.teamNames]);

  function setType(nextType) {
    setDraft((d) => {
      const type = nextType === "roundrobin" ? "roundrobin" : "single";

      // If switching to roundrobin: seeding not applicable → hide in UI + force random
      if (type === "roundrobin") {
        return {
          ...d,
          type,
          mode: "random",
          roundCount: d.roundCount || 1,
        };
      }

      // Switching back to single: restore seeded default if somehow invalid
      return {
        ...d,
        type,
        mode: d.mode === "random" ? "random" : "seeded",
      };
    });
  }

  function setTeamCount(nextCountRaw) {
    const nextCount = clampTeamCount(nextCountRaw);
    setDraft((d) => ({
      ...d,
      teamCount: nextCount,
      teamNames: resizeTeamNames(d.teamNames, nextCount),
    }));
  }

  function setTeamName(index, value) {
    setDraft((d) => {
      const next = [...d.teamNames];
      next[index] = value;
      return { ...d, teamNames: next };
    });
  }

  return (
    <div className="page page-create">
      <h1>Create a Bracket</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveDraftToStorage(draft);
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
              name="varName"
              placeholder="Name"
              value={draft.bracketName}
              onChange={(e) =>
                setDraft((d) => ({ ...d, bracketName: e.target.value }))
              }
            />
          </li>

          <li>
            <label htmlFor="bracketDesc">Description:</label>
            <textarea
              id="bracketDesc"
              name="varDescription"
              value={draft.bracketDesc}
              onChange={(e) =>
                setDraft((d) => ({ ...d, bracketDesc: e.target.value }))
              }
            />
          </li>

          <li>
            <label>Bracket Type:</label>
            <fieldset className="button-group">
              <input
                type="radio"
                id="single"
                name="varRadio"
                value="single"
                checked={draft.type === "single"}
                onChange={() => setType("single")}
              />
              <label htmlFor="single">Single Elimination</label>

              <input
                type="radio"
                id="roundrobin"
                name="varRadio"
                value="roundrobin"
                checked={draft.type === "roundrobin"}
                onChange={() => setType("roundrobin")}
              />
              <label htmlFor="roundrobin">Round Robin</label>
            </fieldset>
          </li>

          {/* ✅ Round-robin-only setting */}
          {draft.type === "roundrobin" ? (
            <li>
              <label htmlFor="roundCount">Number of Rounds:</label>
              <input
                type="number"
                id="roundCount"
                name="varRoundCount"
                min="1"
                max="10"
                step="1"
                value={draft.roundCount}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    roundCount: Math.max(1, Math.min(10, Number(e.target.value) || 1)),
                  }))
                }
              />
            </li>
          ) : null}

          <li>
            <label htmlFor="teamCount">Number of Teams:</label>
            <input
              type="number"
              id="teamCount"
              min="2"
              max="8"
              step="1"
              value={draft.teamCount}
              onChange={(e) => setTeamCount(e.target.value)}
            />
          </li>

          <li>
            <label>Team Names:</label>
            <div id="teamNamesContainer">
              {teams.map((t, idx) => (
                <input
                  key={t.id}
                  type="text"
                  name={`varTeam${t.id}`}
                  placeholder={`Team ${t.id}`}
                  value={draft.teamNames[idx] ?? ""}
                  onChange={(e) => setTeamName(idx, e.target.value)}
                />
              ))}
            </div>
          </li>

          {/* ✅ Single-elimination-only setting */}
          {draft.type === "single" ? (
            <li>
              <label>Seeding:</label>
              <fieldset className="button-group">
                <input
                  type="radio"
                  id="seeded"
                  name="varSeeding"
                  value="seeded"
                  checked={draft.mode === "seeded"}
                  onChange={() => setDraft((d) => ({ ...d, mode: "seeded" }))}
                />
                <label htmlFor="seeded">Seeded</label>

                <input
                  type="radio"
                  id="random"
                  name="varSeeding"
                  value="random"
                  checked={draft.mode === "random"}
                  onChange={() => setDraft((d) => ({ ...d, mode: "random" }))}
                />
                <label htmlFor="random">Random</label>
              </fieldset>
            </li>
          ) : null}

          <h4>Additional Options</h4>

          {/* (unchanged for this checkpoint; we’ll wire these later) */}
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
            <label htmlFor="gamesAtOnce">
              Number of Games Played at Same Time:
            </label>
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
