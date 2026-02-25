import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'bb_username';
const INTERNAL_EVENT = 'bb_username_changed';

export function getUsername() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setUsername(username) {
  const safe = (username || '').trim();
  localStorage.setItem(STORAGE_KEY, safe);

  // Trigger same-tab updates immediately
  window.dispatchEvent(new Event(INTERNAL_EVENT));
}

export function clearUsername() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(INTERNAL_EVENT));
}

function subscribe(callback) {
  function onStorage(e) {
    if (e.key === STORAGE_KEY) callback();
  }
  function onInternal() {
    callback();
  }

  window.addEventListener('storage', onStorage); // other tabs
  window.addEventListener(INTERNAL_EVENT, onInternal); // same tab

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(INTERNAL_EVENT, onInternal);
  };
}

export function useUsername() {
  return useSyncExternalStore(subscribe, getUsername, () => '');
}
