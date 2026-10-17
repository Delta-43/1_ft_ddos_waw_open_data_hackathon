import type { Source, SourceMode } from '../../api/contract';
import { formatWarsawDate } from './formatDate';

export const SOURCE_MODE_TEXT: Record<SourceMode, string> = {
  real: 'Real',
  historical: 'Historical',
  proxy: 'Proxy',
  simulated: 'Simulated',
};

const BASE = 'source-label self-start inline-block max-w-full px-2 py-0.5 rounded-full text-moon-10-caption uppercase break-words';

/** Modes differ in text AND fill/stroke, never in hue alone. */
const MODE_STYLE: Record<SourceMode, string> = {
  real: 'bg-bulma text-goku',
  historical: 'ring-1 ring-inset ring-bulma text-bulma',
  proxy: 'border border-dashed border-trunks text-bulma',
  simulated: 'ring-1 ring-inset ring-beerus text-trunks',
};

/** Why each mode matters to a visitor; shown as the label's tooltip. */
const MODE_MEANING: Record<SourceMode, string> = {
  real: 'Fetched from a real source.',
  historical: 'Real data, but from the past, not current.',
  proxy: 'An estimate calculated from other data, not a measurement.',
  simulated: 'Invented for the demo.',
};

/**
 * Visible text label for one input's provenance, e.g. "Real · OpenStreetMap places".
 * Modes differ in text and lightness, never colour alone. Unknown sources say so.
 */
export function SourceLabel({ source, compact = false }: { source: Source | undefined; compact?: boolean }) {
  if (!source) {
    return <span className={`${BASE} ${MODE_STYLE.simulated}`}>Source unknown</span>;
  }
  const fetched = source.retrieved_at ? ` Fetched ${formatWarsawDate(source.retrieved_at)}.` : '';
  const title = `${MODE_MEANING[source.mode]} ${source.attribution}.${fetched}${source.method ? ` ${source.method}` : ''}`;
  return (
    <span className={`${BASE} ${MODE_STYLE[source.mode]}`} title={title}>
      {SOURCE_MODE_TEXT[source.mode]}
      {!compact && <span className="normal-case tracking-normal"> · {source.name}</span>}
    </span>
  );
}
