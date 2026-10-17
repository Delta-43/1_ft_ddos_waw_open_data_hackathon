import { useId, useState } from 'react';
import type { ResponseMode, Source } from '../../api/contract';
import { DataModeBadge } from './DataModeBadge';
import { formatWarsawDate } from './formatDate';
import { SourcesDrawer } from './SourcesDrawer';
import './provenance.css';

interface SourcesStripProps {
  sources: Source[];
  mode: ResponseMode;
  generatedAt?: string;
  /** Optional control from outside, e.g. a "Sources" button in the top bar. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** "bar": one line for the bottom bar: a count of sources, no mode badge (the top bar shows it). */
  variant?: 'panel' | 'bar';
}

/** Credits line for the sources on screen, with a toggle that opens the full Sources drawer. */
export function SourcesStrip({ sources, mode, generatedAt, open: openProp, onOpenChange, variant = 'panel' }: SourcesStripProps) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => (onOpenChange ? onOpenChange(next) : setOpenState(next));
  const drawerId = useId();
  const bar = variant === 'bar';
  const credits = [...new Set(sources.filter(source => source.mode !== 'simulated').map(source => source.attribution))];
  const simulated = sources.filter(source => source.mode === 'simulated').length;
  const proxies = sources.filter(source => source.mode === 'proxy').length;
  // The bottom bar only has room for a count; names, credits and methods live in the drawer.
  const summary = [
    `${sources.length} ${sources.length === 1 ? 'source' : 'sources'}`,
    proxies > 0 && `${proxies} estimated`,
    simulated > 0 && `${simulated} simulated`,
  ].filter(Boolean).join(' · ');

  return (
    <div className={`sources-strip${bar ? ' sources-strip--bar' : ''}`}>
      <div className="sources-strip__row">
        {bar ? (
          <span className="sources-strip__summary">{summary}</span>
        ) : (
          <>
            <DataModeBadge mode={mode} />
            {credits.map(credit => <span key={credit}>{credit}</span>)}
            {proxies > 0 && <span>{proxies} estimated (proxy) {proxies === 1 ? 'input' : 'inputs'}</span>}
            {simulated > 0 && <span>{simulated} simulated {simulated === 1 ? 'input' : 'inputs'}</span>}
          </>
        )}
        <button
          type="button"
          className="sources-strip__toggle"
          aria-expanded={open}
          aria-controls={drawerId}
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Hide sources' : 'Sources'}
        >
          <span className="sources-strip__toggle-text">{open ? 'Hide sources' : 'Sources'} </span>ⓘ
        </button>
      </div>
      {generatedAt && <p className="sources-strip__meta">Generated {formatWarsawDate(generatedAt)} · we don’t store your requests or location.</p>}
      <SourcesDrawer sources={sources} id={drawerId} hidden={!open} />
    </div>
  );
}
