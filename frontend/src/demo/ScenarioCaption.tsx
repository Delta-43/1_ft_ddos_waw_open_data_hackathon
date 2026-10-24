import { useLang } from '../i18n/useT';
import { SCENARIOS } from './scenarios';
import { demoText, fill } from './text';
import type { ScenarioState } from './useScenario';

interface ScenarioCaptionProps {
  state: ScenarioState;
  vars: Record<string, string | number>;
  onToggle: () => void;
  onNext: () => void;
  onReplay: () => void;
  onStop: () => void;
}

const glyph = {
  play: 'M5 3.5l8 4.5-8 4.5z',
  pause: 'M5 3.5v9M11 3.5v9',
  next: 'M3.5 3.5l6 4.5-6 4.5zM12.5 3.5v9',
  replay: 'M3 8a5 5 0 1 0 1.8-3.8M3 2.5v3h3',
  stop: 'M4.5 4.5l7 7m0-7-7 7',
};

/** The narration card of a running scenario: what is happening, progress, and replay controls. */
export function ScenarioCaption({ state, vars, onToggle, onNext, onReplay, onStop }: ScenarioCaptionProps) {
  const text = demoText(useLang());
  const { scenario, step } = state;
  if (scenario === undefined) return null;
  const copy = text.scenario[scenario];
  const total = SCENARIOS[scenario].steps.length;
  const current = copy.steps[Math.min(step, total - 1)];
  const control = (label: string, path: string, onClick: () => void, extra = '') => (
    <button type="button" className={`demo-icon-button${extra}`} onClick={onClick} aria-label={label} title={label}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d={path} fill={path === glyph.play || path === glyph.next ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );

  return (
    <aside className="caption" aria-label={copy.title}>
      <div className="caption__meta">
        <span>{fill(text.scenarioOf, { n: scenario + 1, total: SCENARIOS.length })}</span>
        {SCENARIOS[scenario].mockup && <span className="demo-tag demo-tag--mock">{text.mockTag}</span>}
      </div>
      <div className="caption__text" aria-live="polite" key={`${scenario}-${step}-${state.finished}`}>
        <h2 className="caption__title">{state.finished ? copy.title : current.title}</h2>
        <p className="caption__body">{state.finished ? text.finished : fill(current.body, vars)}</p>
      </div>
      <div className="caption__bar">
        <ol className="caption__dots" aria-label={fill(text.stepOf, { n: Math.min(step + 1, total), total })}>
          {Array.from({ length: total }, (_, index) => (
            <li key={index} className={index < step || state.finished ? 'is-done' : index === step ? 'is-now' : ''} />
          ))}
        </ol>
        <div className="caption__controls">
          {!state.finished && control(state.playing ? text.pause : text.play, state.playing ? glyph.pause : glyph.play, onToggle)}
          {!state.finished && control(text.next, glyph.next, onNext)}
          {control(text.replay, glyph.replay, onReplay)}
          {control(text.stop, glyph.stop, onStop)}
        </div>
      </div>
    </aside>
  );
}
