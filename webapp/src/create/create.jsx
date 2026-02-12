import React from 'react';
import './create.css';

export function Create() {
  return (
    <main>
      <body>
        <h1>Create a Bracket</h1>
        <form action="bracket.html" method="post">
          <ul>
            <h4>Bracket Information</h4>

            <li>
              <label for="text">Name of Bracket: </label>
              <input type="text" id="text" name="varName" placeholder="Name" />
            </li>

            <li>
              <label for="textarea">Description: </label>
              <textarea id="textarea" name="varDescription"></textarea>
            </li>

            <li>
              <label>Bracket Type:</label>
              <fieldset class="button-group">
                <input type="radio" id="single" name="varRadio" value="Single Elimination" checked />
                <label for="single">Single Elimination</label>

                <input type="radio" id="double" name="varRadio" value="Double Elimination" />
                <label for="double">Double Elimination</label>

                <input type="radio" id="roundrobin" name="varRadio" value="Round Robin" />
                <label for="roundrobin">Round Robin</label>
              </fieldset>
            </li>

            <li>
              <label for="number">Number of Teams: </label>
              <input type="number" name="varTeamCount" id="number" min="2" max="16" step="1" value="2" />
            </li>

            <li>
              <label for="teamNames">Team Names: (I'll fix this later when doing the JS part lol) </label>
              <div id="teamNamesContainer"></div>
            </li>

            <li>
              <label>Seeding:</label>
              <fieldset class="button-group">
                <input type="radio" id="seeded" name="varSeeding" value="Seeded" checked />
                <label for="seeded">Seeded</label>

                <input type="radio" id="random" name="varSeeding" value="Random" />
                <label for="random">Random</label>
              </fieldset>
            </li>

            <h4>Additional Options</h4>
            
            <li>
              <label for="Color Theme">Select a Color Theme (some will come from a third-party API): </label>
              <select id="select" name="varColorTheme">
                <option selected>Default</option>
                <option>Theme1</option>
                <option>Theme2</option>
                <option>Other Options (API CALL)</option>
              </select>
            </li>

            <li>
              <label for="Datetime Start">Start Date/Time:</label>
              <input type="datetime-local" id="Datetime Start" name="varDatetimeStart" />
            </li>

            <li>
              <label for="TimePerMatch">Time Per Match (minutes): </label>
              <input type="number" id="TimePerMatch" name="varTimePerMatch" />
            </li>

            <li>
              <label for="GamesPerTimepoint">Number of Games Played at Same Time: </label>
              <input type="number" id="GamesPerTimepoint" name="varGamesPerTimepoint" />
            </li>

            <h4>Sharing</h4>

            <li>
              <label for="Viewing">Viewing:</label>
              <select id="select" name="varViewing">
                <option selected>Private</option>
                <option>Public</option>
              </select>
            </li>

            <li>
              <label for="Editors">Editors:</label>
              <select id="select" name="varEditors">
                <option selected>None</option>
                <option>Priviate</option>
                <option>Public</option>
              </select>
            </li>

            <li>
              <label for="Editor Emails">Editor Emails:</label>
              <select id="text" name="varEditorEmails">
              </select>
            </li>

          </ul>

          <button type="submit">Create</button>
        </form>
      </body>
    </main>
  );
}
