import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/create.css';

export default function Create() {
  const navigate = useNavigate();

  const [teamCount, setTeamCount] = useState(2);

  const teams = useMemo(() => {
    return Array.from({ length: teamCount }, (_, i) => ({
      id: i + 1,
      name: `Team ${i + 1}`,
    }));
  }, [teamCount]);

  return (
    <div className="page page-create">
      <h1>Create a Bracket</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          // later: build bracket data and pass it via state/query params
          navigate('/bracket');
        }}
      >
        <ul>
          <h4>Bracket Information</h4>

          <li>
            <label htmlFor="bracketName">Name of Bracket:</label>
            <input type="text" id="bracketName" name="varName" placeholder="Name" />
          </li>

          <li>
            <label htmlFor="bracketDesc">Description:</label>
            <textarea id="bracketDesc" name="varDescription" />
          </li>

          <li>
            <label>Bracket Type:</label>
            <fieldset className="button-group">
              <input type="radio" id="single" name="varRadio" value="Single Elimination" defaultChecked />
              <label htmlFor="single">Single Elimination</label>

              <input type="radio" id="double" name="varRadio" value="Double Elimination" />
              <label htmlFor="double">Double Elimination</label>

              <input type="radio" id="roundrobin" name="varRadio" value="Round Robin" />
              <label htmlFor="roundrobin">Round Robin</label>
            </fieldset>
          </li>

          <li>
            <label htmlFor="teamCount">Number of Teams:</label>
            <input
              type="number"
              id="teamCount"
              min="2"
              max="16"
              step="1"
              value={teamCount}
              onChange={(e) => setTeamCount(Math.max(2, Math.min(16, Number(e.target.value) || 2)))}
            />
          </li>

          <li>
            <label>Team Names:</label>
            <div id="teamNamesContainer">
              {teams.map((t) => (
                <input key={t.id} type="text" name={`varTeam${t.id}`} placeholder={`Team ${t.id}`} />
              ))}
            </div>
          </li>

          <li>
            <label>Seeding:</label>
            <fieldset className="button-group">
              <input type="radio" id="seeded" name="varSeeding" value="Seeded" defaultChecked />
              <label htmlFor="seeded">Seeded</label>

              <input type="radio" id="random" name="varSeeding" value="Random" />
              <label htmlFor="random">Random</label>
            </fieldset>
          </li>

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
            <input type="text" id="editorEmails" name="varEditorEmails" placeholder="comma-separated emails" />
          </li>
        </ul>

        <button type="submit">Create</button>
      </form>
    </div>
  );
}
