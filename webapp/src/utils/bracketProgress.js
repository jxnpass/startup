// src/utils/bracketProgress.js
// Stores editable match scores + derived state triggers in localStorage.
// Uses a stable snapshot (raw JSON string) to avoid syncExternalStore infinite loops.

import { useSyncExternalStore } from "react";

export const BRACKET_PROGRESS_KEY = "bb_bracketProgress";
const INTERNAL_EVENT = "bb_bracketProgress_changed";

/**
 * Progress shape:
 * {
 *   scores: {
 *     [matchId]: { [teamSlotId]: number|string }   // e.g. scores["m1"]["t1"] = 25
 *   },
 *   sig: {
 *     [matchId]: string                           // participant signature: "Team A||Team B"
 *   }
 * }
 */

export function useBracketProgressRaw(key = BRACKET_PROGRESS_KEY) {
  function getSnapshot() {
    return localStorage.getItem(key); // stable string|null
  }
  function getServerSnapshot() {
    return null;
  }
  function subscribe(callback) {
    function onStorage(e) {
      if (e.key === key) callback();
    }
    function onInternal() {
      callback();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener(INTERNAL_EVENT, onInternal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(INTERNAL_EVENT, onInternal);
    };
  }
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function loadProgress(key = BRACKET_PROGRESS_KEY) {
  const raw = localStorage.getItem(key);
  if (!raw) return { scores: {}, sig: {} };
  try {
    const parsed = JSON.parse(raw);
    return {
      scores: parsed?.scores && typeof parsed.scores === "object" ? parsed.scores : {},
      sig: parsed?.sig && typeof parsed.sig === "object" ? parsed.sig : {},
    };
  } catch {
    return { scores: {}, sig: {} };
  }
}

export function saveProgress(progress, key = BRACKET_PROGRESS_KEY) {
  localStorage.setItem(key, JSON.stringify(progress));
  window.dispatchEvent(new Event(INTERNAL_EVENT));
}

export function updateScore({ matchId, teamId, value }, key = BRACKET_PROGRESS_KEY) {
  const progress = loadProgress(key);
  if (!progress.scores[matchId]) progress.scores[matchId] = {};

  // Store "" for empty to keep controlled input stable
  progress.scores[matchId][teamId] = value;

  saveProgress(progress, key);
}

export function clearMatchScores(progress, matchId) {
  if (progress.scores?.[matchId]) {
    delete progress.scores[matchId];
  }
}