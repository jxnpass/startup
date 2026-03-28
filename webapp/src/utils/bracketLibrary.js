// src/utils/bracketLibrary.js
export const BRACKET_LIBRARY_KEY = 'bb_brackets';

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

export function cacheBracketRecord(bracket) {
  if (!bracket?.id) return;

  const draft = bracket.draft && typeof bracket.draft === 'object' ? bracket.draft : null;
  const progress = bracket.progress && typeof bracket.progress === 'object' ? bracket.progress : { scores: {}, sig: {} };

  if (draft) {
    localStorage.setItem(draftKeyFor(bracket.id), JSON.stringify(draft));
  }
  localStorage.setItem(progressKeyFor(bracket.id), JSON.stringify(progress));

  const items = loadBracketLibrary().filter((item) => item.id !== bracket.id);
  items.unshift({
    id: bracket.id,
    createdAt: bracket.createdAt || new Date().toISOString(),
    bracketName: bracket.bracketName || draft?.bracketName || 'Untitled Bracket',
    teamCount: bracket.teamCount || draft?.teamCount || '',
    type: bracket.type || draft?.type || 'single',
    mode: bracket.mode || draft?.mode || '',
    sharing: bracket.sharing || draft?.sharing || {},
  });
  saveBracketLibrary(items);
}

export function cacheBracketList(brackets) {
  const items = [];
  for (const bracket of Array.isArray(brackets) ? brackets : []) {
    cacheBracketRecord(bracket);
    items.push({
      id: bracket.id,
      createdAt: bracket.createdAt || new Date().toISOString(),
      bracketName: bracket.bracketName || bracket?.draft?.bracketName || 'Untitled Bracket',
      teamCount: bracket.teamCount || bracket?.draft?.teamCount || '',
      type: bracket.type || bracket?.draft?.type || 'single',
      mode: bracket.mode || bracket?.draft?.mode || '',
      sharing: bracket.sharing || bracket?.draft?.sharing || {},
    });
  }
  saveBracketLibrary(items);
}

export function generateBracketId() {
  return `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function removeBracketFromLibrary(id) {
  const items = loadBracketLibrary().filter((b) => b.id !== id);
  saveBracketLibrary(items);
  return items;
}

export function clearBracketCache(id) {
  localStorage.removeItem(draftKeyFor(id));
  localStorage.removeItem(progressKeyFor(id));
  removeBracketFromLibrary(id);
}
