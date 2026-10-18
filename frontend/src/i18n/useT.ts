import { useSyncExternalStore } from 'react';
import { getLang, subscribe } from './language';
import { translate, type Key } from './translations';

/** Current language, reactive to `setLang` calls anywhere in the app. */
export function useLang() {
  return useSyncExternalStore(subscribe, getLang);
}

/** Translate function bound to the current language; re-renders the caller on language change. */
export function useT() {
  const lang = useLang();
  return (key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars);
}
