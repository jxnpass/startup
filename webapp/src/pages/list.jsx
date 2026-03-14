import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/list.css";

import {
  loadBracketLibrary,
  removeBracketFromLibrary,
  draftKeyFor,
  progressKeyFor,
} from "../utils/bracketLibrary.js";

import { buildBracketViewModel } from "../utils/bracketStructure.js";

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

function isFilled(v) {
  return !(v === "" || v == null);
}

function anyScoreEntered(progress) {
  const scores = progress?.scores || {};
  for (const mid of Object.keys(scores)) {
    const entry = scores[mid] || {};
    for (const v of Object.values(entry)) {
      if (isFilled(v)) return true;
    }
  }
  return false;
}

function computeStatus(draft, progress) {
  // Status rules:
  // - Not Started (red) if no score entries exist
  // - For Single Elim: show current round title (yellow) until final winner determined
  // - Finished (green) only once Final has a winner (non-tie)
  // - For Round Robin: show Round k (yellow) based on first incomplete round; Finished when all rounds complete

  const started = anyScoreEntered(progress);
  if (!started) return { label: "Not Started", tone: "notstarted" };

  let vm = null;
  try {
    vm = draft ? buildBracketViewModel(draft) : null;
  } catch {
    vm = null;
  }
  if (!vm) return { label: "In Progress", tone: "progress" };

  const scores = progress?.scores || {};
  const scoreFor = (matchId, teamId) => scores?.[matchId]?.[teamId];

  if (vm.kind === "roundrobin") {
    const rounds = vm.rr?.rounds || [];

    const roundComplete = (round) => {
      const matches = round?.matches || [];
      if (matches.length === 0) return true;
      return matches.every((m) => {
        const a = scoreFor(m.matchId, m.aId);
        const b = scoreFor(m.matchId, m.bId);
        return isFilled(a) && isFilled(b);
      });
    };

    for (const r of rounds) {
      if (!roundComplete(r)) return { label: `Round ${r.roundIndex}`, tone: "progress" };
    }
    return { label: "Finished", tone: "finished" };
  }

  // Elimination brackets
  if (vm.kind === "double") {
    const allRounds = [...(vm.de?.winners || []), ...(vm.de?.losers || []), ...(vm.de?.finals || [])];

    const roundComplete = (round) => {
      const matches = round?.matches || [];
      if (matches.length === 0) return true;
      return matches.every((m) => {
        const a = m?.teams?.[0];
        const b = m?.teams?.[1];
        const av = scoreFor(m.matchId, a?.id);
        const bv = scoreFor(m.matchId, b?.id);
        return isFilled(av) && isFilled(bv);
      });
    };

    for (const r of allRounds) {
      if (!roundComplete(r)) return { label: r.title, tone: "progress" };
    }

    const gf = vm.de?.finals?.[vm.de.finals.length - 1]?.matches?.[0];
    if (!gf) return { label: "Finished", tone: "finished" };
    const aRaw = scoreFor(gf.matchId, gf.teams?.[0]?.id);
    const bRaw = scoreFor(gf.matchId, gf.teams?.[1]?.id);
    const aNum = isFilled(aRaw) ? Number(aRaw) : NaN;
    const bNum = isFilled(bRaw) ? Number(bRaw) : NaN;
    const hasWinner = Number.isFinite(aNum) && Number.isFinite(bNum) && aNum !== bNum;
    return hasWinner ? { label: "Finished", tone: "finished" } : { label: "Grand Final", tone: "progress" };
  }

  const se = vm.se;
  const rounds = (se?.rounds || []).filter((r) => r.roundId !== "round_champion");

  const matchComplete = (m) => {
    const teams = m?.teams || [];
    const a = teams[0];
    const b = teams[1];
    const aLabel = (a?.label ?? "").toString().toUpperCase();
    const bLabel = (b?.label ?? "").toString().toUpperCase();
    // BYE auto-advances without scores (only reliably knowable in first round)
    if (aLabel === "BYE" || bLabel === "BYE") return true;
    const av = scoreFor(m.matchId, a?.id);
    const bv = scoreFor(m.matchId, b?.id);
    return isFilled(av) && isFilled(bv);
  };

  const roundComplete = (r) => {
    const matches = r?.matches || [];
    if (matches.length === 0) return true;
    return matches.every(matchComplete);
  };

  for (const r of rounds) {
    if (!roundComplete(r)) return { label: r.title, tone: "progress" };
  }

  // All rounds have scores — only "Finished" once Final produces a winner.
  const finalRound = rounds[rounds.length - 1];
  const finalMatch = finalRound?.matches?.[0];
  if (!finalMatch) return { label: "Finished", tone: "finished" };

  const aId = finalMatch.teams?.[0]?.id;
  const bId = finalMatch.teams?.[1]?.id;
  const aRaw = scoreFor(finalMatch.matchId, aId);
  const bRaw = scoreFor(finalMatch.matchId, bId);

  const aNum = isFilled(aRaw) ? Number(aRaw) : NaN;
  const bNum = isFilled(bRaw) ? Number(bRaw) : NaN;

  const hasWinner = Number.isFinite(aNum) && Number.isFinite(bNum) && aNum !== bNum;
  return hasWinner ? { label: "Finished", tone: "finished" } : { label: "Final", tone: "progress" };
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
        type === "roundrobin"
          ? "Round Robin"
          : type === "double"
          ? `Double Elimination${mode ? ` • ${mode}` : ""}`
          : `Single Elimination${mode ? ` • ${mode}` : ""}`;

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
                <span
                  className={
                    r.status.tone === "finished"
                      ? "status-finished"
                      : r.status.tone === "notstarted"
                      ? "status-notstarted"
                      : "status-progress"
                  }
                >
                  {r.status.label}
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