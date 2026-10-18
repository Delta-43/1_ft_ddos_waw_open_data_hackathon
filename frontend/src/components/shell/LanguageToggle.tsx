import { getLang, setLang } from '../../i18n/language';
import { useLang } from '../../i18n/useT';

/** EN / PL switch for the frontend's own UI chrome. Persisted in localStorage. */
export function LanguageToggle() {
  const lang = useLang();
  return (
    <button
      type="button"
      className="language-toggle"
      aria-label={lang === 'en' ? 'Switch language to Polish' : 'Zmień język na angielski'}
      onClick={() => setLang(getLang() === 'en' ? 'pl' : 'en')}
    >
      <span className={lang === 'en' ? 'language-toggle__active' : undefined}>EN</span>
      <span aria-hidden="true">/</span>
      <span className={lang === 'pl' ? 'language-toggle__active' : undefined}>PL</span>
    </button>
  );
}
