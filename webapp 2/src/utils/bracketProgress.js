// src/utils/bracketProgress.js
import { useSyncExternalStore } from "react";

const INTERNAL_EVENT = "bb_bracketProgress_changed";

export function useBracketProgressRaw(key) {
  function getSnapshot() {
    return localStorage.getItem(key);
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

export function loadProgress(key) {
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

export function saveProgress(progress, key) {
  localStorage.setItem(key, JSON.stringify(progress));
  window.dispatchEvent(new Event(INTERNAL_EVENT));
}

export function updateScore({ matchId, teamId, value }, key) {
  const p = loadProgress(key);
  if (!p.scores[matchId]) p.scores[matchId] = {};
  p.scores[matchId][teamId] = value;
  saveProgress(p, key);
}