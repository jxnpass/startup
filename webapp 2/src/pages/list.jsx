import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/list.css";

import {
  loadBracketLibrary,
  removeBracketFromLibrary,
  draftKeyFor,
  progressKeyFor,
} from "../utils/bracketLibrary.js";

function readDraft(id) {
  const raw = localStorage.getItem(draftKeyFor(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readProgress(id) {
  const raw = localStorage.getItem(progressKeyFor(id));
  if (!raw) return { scores: {} };
  try {
    return JSON.parse(raw);
  } catch {
    return { scores: {} };
  }
}

function computeStatus(_draft, progress) {
  // Conservative status:
  // Finished if every stored match has 2 filled scores; otherwise In Progress.
  const scores = progress?.scores || {};
  const matchIds = Object.keys(scores);
  if (matchIds.length === 0) return "In Progress";

  for (const mid of matchIds) {
    const entry = scores[mid] || {};
    const vals = Object.values(entry);
    if (vals.length < 2) return "In Progress";
    if (vals[0] === "" || vals[0] == null || vals[1] === "" || vals[1] == null) return "In Progress";
  }
  return "Finished";
}

export default function List() {
  const navigate = useNavigate();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [tick, setTick] = useState(0);

  const library = useMemo(() => loadBracketLibrary(), [tick]);

  const rows = useMemo(() => {
    return library.map((b) => {
      const draft = readDraft(b.id);
      const progress = readProgress(b.id);

      const teamCount = draft?.teamCount ?? b.teamCount ?? "";
      const type = draft?.type ?? b.type ?? "single";
      const mode = draft?.mode ?? b.mode ?? "";

      const typeLabel =
        type === "roundrobin" ? "Round Robin" : `Single Elimination${mode ? ` • ${mode}` : ""}`;

      const status = computeStatus(draft, progress);

      return {
        id: b.id,
        name: draft?.bracketName || b.bracketName || "Untitled Bracket",
        teamCount,
        typeLabel,
        status,
      };
    });
  }, [library]);

  function doDelete(id) {
    removeBracketFromLibrary(id);
    localStorage.removeItem(draftKeyFor(id));
    localStorage.removeItem(progressKeyFor(id));
    setConfirmDeleteId(null);
    setTick((x) => x + 1);
  }

  if (rows.length === 0) {
    return (
      <div className="page page-list">
        <h1>My Brackets</h1>

        <div className="empty-state">
          <p>You don’t have any brackets yet.</p>
          <button className="primary-btn" onClick={() => navigate("/create")}>
            Create a Bracket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-list">
      <h1>My Brackets</h1>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th># of Teams</th>
            <th>Type</th>
            <th>Status</th>
            <th>View</th>
            <th>Delete</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.name}</td>
              <td>{r.teamCount}</td>
              <td>{r.typeLabel}</td>
              <td>
                <span className={r.status === "Finished" ? "status-finished" : "status-progress"}>
                  {r.status}
                </span>
              </td>
              <td>
                <Link to={`/bracket/${r.id}`}>View</Link>
              </td>
              <td>
                <button className="link-btn" onClick={() => setConfirmDeleteId(r.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirmDeleteId ? (
        <div
          className="confirm-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Are you sure you want to delete?</h3>
            <div className="confirm-actions">
              <button className="danger-btn" onClick={() => doDelete(confirmDeleteId)}>
                Yes
              </button>
              <button className="secondary-btn" onClick={() => setConfirmDeleteId(null)}>
                No
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}