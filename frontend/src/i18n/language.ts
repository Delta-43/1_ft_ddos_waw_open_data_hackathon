export type Lang = 'en' | 'pl';

const STORAGE_KEY = 'warsaw2076-lang';

function detectDefault(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'pl') return saved;
  } catch {
    // Private browsing or storage disabled: fall through to the browser language.
  }
  return navigator.language.toLowerCase().startsWith('pl') ? 'pl' : 'en';
}

let current: Lang = detectDefault();
const listeners = new Set<() => void>();

export function getLang(): Lang {
  return current;
}

export function setLang(next: Lang): void {
  if (next === current) return;
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Nothing to persist to; the choice still applies for this session.
  }
  document.documentElement.lang = next;
  for (const listener of listeners) listener();
}

/** Subscribe to language changes; returns an unsubscribe function. For React, use `useLang`/`useT` instead. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

document.documentElement.lang = current;
