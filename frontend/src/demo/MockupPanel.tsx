import { useEffect, useRef } from 'react';
import { useLang } from '../i18n/useT';
import { demoText } from './text';

export type MockTab = 'modes' | 'milestones';

/** Roadmap ideas from the pitch, drawn as a labelled mock-up: nothing here is computed, wired to data or stored. */
export function MockupPanel({ tab, onTab, onClose }: { tab: MockTab; onTab: (tab: MockTab) => void; onClose: () => void }) {
  const { mock, mockTag } = demoText(useLang());
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <section className="mockup" aria-label={mock.title}>
      <header className="mockup__head">
        <span className="demo-tag demo-tag--mock">{mockTag}</span>
        <h2 className="mockup__title">{mock.title}</h2>
        <button ref={close} type="button" className="demo-icon-button" onClick={onClose} aria-label={mock.closeLabel}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      </header>
      <div className="mockup__tabs" role="tablist">
        {(['modes', 'milestones'] as const).map(id => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className="mockup__tab" onClick={() => onTab(id)}>
            {id === 'modes' ? mock.modesTab : mock.milestonesTab}
          </button>
        ))}
      </div>
      {tab === 'modes' ? (
        <ul className="mockup__list">
          {[[mock.accessibility, mock.accessibilityBody], [mock.cool, mock.coolBody]].map(([name, body]) => (
            <li key={name} className="mockup__mode">
              <span className="mockup__switch" aria-hidden="true" />
              <span>
                <strong>{name}</strong>
                <span className="mockup__body">{body}</span>
              </span>
              <span className="demo-tag">{mock.roadmap}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <p className="mockup__body">{mock.milestonesIntro}</p>
          <ul className="mockup__list">
            {mock.milestones.map(item => (
              <li key={item.name} className="mockup__milestone">
                <span className="mockup__row">
                  <strong>{item.name}</strong>
                  <span>{item.done}{item.unit ? ` ${item.unit}` : ''} / {item.of}{item.unit ? ` ${item.unit}` : ''}</span>
                </span>
                <progress className="mockup__bar" max={item.of} value={item.done} aria-label={item.name} />
              </li>
            ))}
          </ul>
          <p className="mockup__fine">{mock.milestonesNote}</p>
        </div>
      )}
      <p className="mockup__fine mockup__fine--label">{mock.note}</p>
    </section>
  );
}
