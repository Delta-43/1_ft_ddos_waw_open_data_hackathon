import { useEffect, useRef, useState } from 'react';
import type { Place, Source } from '../api/contract';
import { useLang } from '../i18n/useT';
import { AboutDialog } from './AboutDialog';
import { PlaceSearch } from './PlaceSearch';
import { SCENARIOS } from './scenarios';
import { demoText } from './text';

type Panel = 'scenarios' | 'search' | 'about' | null;

interface DemoBarProps {
  onStartScenario: (index: number) => void;
  onPickPlace: (place: Place, sources: Source[]) => void;
}

const icons = {
  scenarios: 'M5 3.5l8 4.5-8 4.5z',
  search: 'M7 12.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11zM11 11l3.5 3.5',
  about: 'M8 7v5M8 4.6v.1',
};

/** The "Demo data" banner with the scenario picker, place search and credits, kept above the app chrome. */
export function DemoBar({ onStartScenario, onPickPlace }: DemoBarProps) {
  const text = demoText(useLang());
  const [panel, setPanel] = useState<Panel>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (panel !== 'scenarios' && panel !== 'search') return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setPanel(null); };
    const onDown = (event: PointerEvent) => { if (!bar.current?.contains(event.target as Node)) setPanel(null); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [panel]);

  const toggle = (next: Panel) => setPanel(current => (current === next ? null : next));
  const button = (id: Exclude<Panel, null>, label: string) => (
    <button
      type="button"
      className={`demo-bar__button${panel === id ? ' demo-bar__button--on' : ''}`}
      aria-label={label}
      aria-expanded={id === 'about' ? undefined : panel === id}
      aria-haspopup={id === 'about' ? 'dialog' : undefined}
      onClick={() => toggle(id)}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d={icons[id]} fill={id === 'scenarios' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span className={id === 'scenarios' ? 'demo-bar__label demo-bar__label--first' : 'demo-bar__label'}>{label}</span>
    </button>
  );

  return (
    <div className="demo-bar" ref={bar}>
      <div className="demo-bar__strip" role="region" aria-label={text.banner}>
        <span className="demo-bar__badge" title={text.bannerLong}>
          <span className="demo-bar__dot" aria-hidden="true" />
          {text.banner}
        </span>
        <span className="demo-bar__long">{text.bannerLong}</span>
        {button('scenarios', text.scenarios)}
        {button('search', text.search)}
        {button('about', text.about)}
      </div>
      {panel === 'scenarios' && (
        <div className="demo-panel" role="group" aria-label={text.pickerTitle}>
          <h2 className="demo-panel__title">{text.pickerTitle}</h2>
          <p className="demo-panel__hint">{text.pickerHint}</p>
          <ol className="scenario-list">
            {SCENARIOS.map((scenario, index) => (
              <li key={scenario.id}>
                <button
                  type="button"
                  className="scenario-list__item"
                  onClick={() => { setPanel(null); onStartScenario(index); }}
                  aria-label={`${text.play}: ${text.scenario[index].title}`}
                >
                  <span className="scenario-list__n" aria-hidden="true">{index + 1}</span>
                  <span className="scenario-list__text">
                    <span className="scenario-list__title">
                      {text.scenario[index].title}
                      <span className={`demo-tag${scenario.mockup ? ' demo-tag--mock' : ''}`}>{scenario.mockup ? text.mockTag : text.realTag}</span>
                    </span>
                    <span className="scenario-list__blurb">{text.scenario[index].blurb}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
      {panel === 'search' && (
        <div className="demo-panel">
          <PlaceSearch onPick={(place, sources) => { setPanel(null); onPickPlace(place, sources); }} />
        </div>
      )}
      {panel === 'about' && <AboutDialog onClose={() => setPanel(null)} />}
    </div>
  );
}
