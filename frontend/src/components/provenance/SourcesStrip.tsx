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
}

/** Credits line for the sources on screen, with a toggle that opens the full Sources drawer. */
export function SourcesStrip({ sources, mode, generatedAt, open: openProp, onOpenChange }: SourcesStripProps) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => (onOpenChange ? onOpenChange(next) : setOpenState(next));
  const drawerId = useId();
  const credits = [...new Set(sources.filter(source => source.mode !== 'simulated').map(source => source.attribution))];
  const simulated = sources.filter(source => source.mode === 'simulated').length;
  const proxies = sources.filter(source => source.mode === 'proxy').length;

  return (
    <div className="sources-strip">
      <div className="sources-strip__row">
        <DataModeBadge mode={mode} />
        {credits.map(credit => <span key={credit}>{credit}</span>)}
        {proxies > 0 && <span>{proxies} estimated (proxy) {proxies === 1 ? 'input' : 'inputs'}</span>}
        {simulated > 0 && <span>{simulated} simulated {simulated === 1 ? 'input' : 'inputs'}</span>}
        <button
          type="button"
          className="sources-strip__toggle"
          aria-expanded={open}
          aria-controls={drawerId}
          onClick={() => setOpen(!open)}
        >
          {open ? 'Hide sources' : 'Sources ⓘ'}
        </button>
      </div>
      {generatedAt && <p className="sources-strip__meta">Generated {formatWarsawDate(generatedAt)} · we don’t store your requests or location.</p>}
      <SourcesDrawer sources={sources} id={drawerId} hidden={!open} />
    </div>
  );
}
