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

function parseEmails(raw) {
  return raw
    .split(/[\n,;]+/)
    .map((email) => email.trim())
    .filter(Boolean);
}

export default function Create() {
  const navigate = useNavigate();

  const [type, setType] = useState("single"); // single | double | roundrobin
  const [teamCount, setTeamCount] = useState(2);
  const [mode, setMode] = useState("seeded"); // seeded | random (single only)
  const [roundCount, setRoundCount] = useState(1);

  const [bracketName, setBracketName] = useState("");
  const [bracketDesc, setBracketDesc] = useState("");
  const [teamNames, setTeamNames] = useState(["Team 1", "Team 2"]);

  const [editAccess, setEditAccess] = useState("personal");
  const [viewAccess, setViewAccess] = useState("personal");
  const [collaboratorEmails, setCollaboratorEmails] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [pendingBracketId] = useState(() => generateBracketId());

  useEffect(() => {
    setTeamNames((prev) => {
      const next = [...prev];
      while (next.length < teamCount) next.push(`Team ${next.length + 1}`);
      return next.slice(0, teamCount);
    });
  }, [teamCount]);

  useEffect(() => {
    if (copyMessage) {
      const timer = window.setTimeout(() => setCopyMessage(""), 1800);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [copyMessage]);

  const maxTeams = type === "double" ? 8 : 16;

  const teams = useMemo(
    () => Array.from({ length: teamCount }, (_, i) => ({ id: i + 1 })),
    [teamCount]
  );

  useEffect(() => {
    setTeamCount((prev) => Math.min(prev, maxTeams));
  }, [maxTeams]);

  const needsPrivateEmails = editAccess === "private" || viewAccess === "private";
  const hasPublicAccess = editAccess === "public" || viewAccess === "public";
  const shareLink = `${window.location.origin}/bracket/${pendingBracketId}`;

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopyMessage("Link copied.");
    } catch {
      setCopyMessage("Could not copy automatically. You can copy the link manually.");
    }
  }

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
            sharing: {
              editAccess,
              viewAccess,
              collaboratorEmails: parseEmails(collaboratorEmails),
              shareLink,
            },
          });

          const id = pendingBracketId;
          localStorage.setItem(draftKeyFor(id), JSON.stringify(draft));
          saveProgress({ scores: {}, sig: {} }, progressKeyFor(id));

          addBracketToLibrary({
            id,
            createdAt: new Date().toISOString(),
            bracketName: draft.bracketName,
            teamCount: draft.teamCount,
            type: draft.type,
            mode: draft.mode,
            sharing: draft.sharing,
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
                id="double"
                name="bracketType"
                checked={type === "double"}
                onChange={() => setType("double")}
              />
              <label htmlFor="double">Double Elimination</label>

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

          {(type === "single" || type === "double") && (
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

          <h4>Sharing Options</h4>

          <li>
            <label>Public editing enabled:</label>
            <fieldset className="button-group">
              <input
                type="radio"
                id="edit-personal"
                name="editAccess"
                checked={editAccess === "personal"}
                onChange={() => setEditAccess("personal")}
              />
              <label htmlFor="edit-personal">Personal</label>

              <input
                type="radio"
                id="edit-private"
                name="editAccess"
                checked={editAccess === "private"}
                onChange={() => setEditAccess("private")}
              />
              <label htmlFor="edit-private">Private</label>

              <input
                type="radio"
                id="edit-public"
                name="editAccess"
                checked={editAccess === "public"}
                onChange={() => setEditAccess("public")}
              />
              <label htmlFor="edit-public">Public</label>
            </fieldset>
          </li>

          <li>
            <label>Public viewing enabled:</label>
            <fieldset className="button-group">
              <input
                type="radio"
                id="view-personal"
                name="viewAccess"
                checked={viewAccess === "personal"}
                onChange={() => setViewAccess("personal")}
              />
              <label htmlFor="view-personal">Personal</label>

              <input
                type="radio"
                id="view-private"
                name="viewAccess"
                checked={viewAccess === "private"}
                onChange={() => setViewAccess("private")}
              />
              <label htmlFor="view-private">Private</label>

              <input
                type="radio"
                id="view-public"
                name="viewAccess"
                checked={viewAccess === "public"}
                onChange={() => setViewAccess("public")}
              />
              <label htmlFor="view-public">Public</label>
            </fieldset>
          </li>

          {needsPrivateEmails && (
            <li>
              <label htmlFor="collaboratorEmails">Collaborator emails:</label>
              <textarea
                id="collaboratorEmails"
                placeholder="Enter emails separated by commas, semicolons, or new lines"
                value={collaboratorEmails}
                onChange={(e) => setCollaboratorEmails(e.target.value)}
              />
              <small className="sharing-help-text">
                These users can be invited later when email-based collaboration is implemented.
              </small>
            </li>
          )}

          {hasPublicAccess && (
            <li>
              <label htmlFor="publicShareLink">Public share link:</label>
              <div className="share-link-row">
                <input
                  type="text"
                  id="publicShareLink"
                  value={shareLink}
                  readOnly
                />
                <button type="button" className="secondary-action-btn" onClick={copyShareLink}>
                  Copy
                </button>
              </div>
              <small className="sharing-help-text">
                This preview link will work after the bracket is created.
              </small>
              {copyMessage ? <div className="copy-message">{copyMessage}</div> : null}
            </li>
          )}
        </ul>

        <button type="submit">Create</button>
      </form>
    </div>
  );
}
