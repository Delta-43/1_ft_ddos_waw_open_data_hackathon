import { useId, useState } from 'react';
import { Chip } from '@heathmont/moon-core-tw';
import type { ResponseMode, Source } from '../../api/contract';
import { DataModeBadge } from './DataModeBadge';
import { formatWarsawDate } from './formatDate';
import { SourcesDrawer } from './SourcesDrawer';

interface SourcesStripProps {
  sources: Source[];
  mode: ResponseMode;
  generatedAt?: string;
}

/** Credits line for the sources on screen, with a toggle that opens the full Sources drawer. */
export function SourcesStrip({ sources, mode, generatedAt }: SourcesStripProps) {
  const [open, setOpen] = useState(false);
  const drawerId = useId();
  const credits = [...new Set(sources.filter(source => source.mode !== 'simulated').map(source => source.attribution))];
  const simulated = sources.filter(source => source.mode === 'simulated').length;
  const proxies = sources.filter(source => source.mode === 'proxy').length;

  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-beerus text-moon-12 text-trunks">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <DataModeBadge mode={mode} />
        {credits.map(credit => <span key={credit}>{credit}</span>)}
        {proxies > 0 && <span>{proxies} estimated (proxy) {proxies === 1 ? 'input' : 'inputs'}</span>}
        {simulated > 0 && <span>{simulated} simulated {simulated === 1 ? 'input' : 'inputs'}</span>}
        <Chip
          size="sm"
          isActive={open}
          // Moon's active/hover text is piccolo, too dark on the dark theme; keep it light.
          className="text-moon-12 text-bulma hover:text-bulma ring-1 ring-inset ring-beerus aria-expanded:ring-bulma"
          aria-expanded={open}
          aria-controls={drawerId}
          onClick={() => setOpen(value => !value)}
        >
          {open ? 'Hide sources' : 'Sources ⓘ'}
        </Chip>
      </div>
      {generatedAt && <p>Generated {formatWarsawDate(generatedAt)} · we don’t store your requests or location.</p>}
      <SourcesDrawer sources={sources} id={drawerId} hidden={!open} />
    </div>
  );
}
