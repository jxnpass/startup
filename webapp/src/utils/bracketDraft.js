// src/utils/bracketDraft.js
export const BRACKET_DRAFT_KEY = "bb_bracketDraft";

export function saveBracketDraft(draft) {
  localStorage.setItem(BRACKET_DRAFT_KEY, JSON.stringify(draft));
}

export function loadBracketDraft() {
  const raw = localStorage.getItem(BRACKET_DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}