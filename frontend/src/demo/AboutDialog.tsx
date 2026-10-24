import { useEffect, useRef } from 'react';
import { useLang } from '../i18n/useT';
import { demoText } from './text';

const REPO = 'https://github.com/Delta-43/1_ft_ddos_waw_open_data_hackathon';

/** Credits: project, hackathon, team, open data and licences, the privacy ruling, and the code licence status. */
export function AboutDialog({ onClose }: { onClose: () => void }) {
  const { aboutDialog: about, close } = demoText(useLang());
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    button.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      // Keep focus inside the dialog while it is open.
      if (event.key === 'Tab') {
        const focusable = Array.from(document.querySelectorAll<HTMLElement>('.about a[href], .about button'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      opener?.focus();
    };
  }, [onClose]);

  return (
    <div className="about-scrim" onClick={event => event.target === event.currentTarget && onClose()}>
      <div className="about" role="dialog" aria-modal="true" aria-labelledby="about-title">
        <header className="about__head">
          <h2 id="about-title" className="about__title">{about.title}</h2>
          <button ref={button} type="button" className="demo-icon-button" onClick={onClose} aria-label={close}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </header>
        <div className="about__scroll">
          <p>{about.intro}</p>
          <h3>{about.team}</h3>
          <ul className="about__list">
            {about.people.map(person => (
              <li key={person.name}><strong>{person.name}</strong> <span>{person.role}</span></li>
            ))}
          </ul>
          <p className="about__fine">{about.teamNote}</p>
          <h3>{about.data}</h3>
          <ul className="about__list">
            {about.dataRows.map(row => (
              <li key={row.name}><strong>{row.name}</strong> <span>{row.licence} · {row.used}</span></li>
            ))}
          </ul>
          <h3>{about.privacy}</h3>
          <p>{about.privacyBody}</p>
          <p><a href={REPO} target="_blank" rel="noreferrer">{about.repo}</a></p>
        </div>
      </div>
    </div>
  );
}
