import type { Source, SourceMode } from '../../api/contract';
import { formatWarsawDate } from './formatDate';
import './provenance.css';

export const SOURCE_MODE_TEXT: Record<SourceMode, string> = {
  real: 'Real',
  historical: 'Historical',
  proxy: 'Proxy',
  simulated: 'Simulated',
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
    return <span className="source-label source-label--unknown">Source unknown</span>;
  }
  const fetched = source.retrieved_at ? ` Fetched ${formatWarsawDate(source.retrieved_at)}.` : '';
  const title = `${MODE_MEANING[source.mode]} ${source.attribution}.${fetched}${source.method ? ` ${source.method}` : ''}`;
  return (
    <span className={`source-label source-label--${source.mode}`} title={title}>
      {SOURCE_MODE_TEXT[source.mode]}
      {!compact && <span className="source-label__name"> · {source.name}</span>}
    </span>
  );
}
