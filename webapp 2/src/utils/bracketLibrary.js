// src/utils/bracketLibrary.js
export const BRACKET_LIBRARY_KEY = "bb_brackets";

export function draftKeyFor(id) {
  return `bb_bracketDraft:${id}`;
}

export function progressKeyFor(id) {
  return `bb_bracketProgress:${id}`;
}

export function loadBracketLibrary() {
  const raw = localStorage.getItem(BRACKET_LIBRARY_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveBracketLibrary(items) {
  localStorage.setItem(BRACKET_LIBRARY_KEY, JSON.stringify(items));
}

export function generateBracketId() {
  return `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function addBracketToLibrary(entry) {
  const items = loadBracketLibrary();
  items.unshift(entry);
  saveBracketLibrary(items);
  return items;
}

export function removeBracketFromLibrary(id) {
  const items = loadBracketLibrary().filter((b) => b.id !== id);
  saveBracketLibrary(items);
  return items;
}