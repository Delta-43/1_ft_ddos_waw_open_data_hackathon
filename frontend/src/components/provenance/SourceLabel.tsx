import type { Source, SourceMode } from '../../api/contract';
import { useT } from '../../i18n/useT';
import type { Key } from '../../i18n/translations';
import { formatWarsawDate } from './formatDate';
import './provenance.css';

export const SOURCE_MODE_KEY: Record<SourceMode, Key> = {
  real: 'sourceReal',
  historical: 'sourceHistorical',
  proxy: 'sourceProxy',
  simulated: 'sourceSimulated',
};

/** Why each mode matters to a visitor; shown as the label's tooltip. */
const MODE_MEANING_KEY: Record<SourceMode, Key> = {
  real: 'modeMeaningReal',
  historical: 'modeMeaningHistorical',
  proxy: 'modeMeaningProxy',
  simulated: 'modeMeaningSimulated',
};

/**
 * Visible text label for one input's provenance, e.g. "Real · OpenStreetMap places".
 * Modes differ in text and lightness, never colour alone. Unknown sources say so.
 */
export function SourceLabel({ source, compact = false }: { source: Source | undefined; compact?: boolean }) {
  const t = useT();
  if (!source) {
    return <span className="source-label source-label--unknown">{t('sourceUnknownLabel')}</span>;
  }
  const fetched = source.retrieved_at ? ` ${t('fetchedOn', { date: formatWarsawDate(source.retrieved_at) })}` : '';
  const title = `${t(MODE_MEANING_KEY[source.mode])} ${source.attribution}.${fetched}${source.method ? ` ${source.method}` : ''}`;
  return (
    <span className={`source-label source-label--${source.mode}`} title={title}>
      {t(SOURCE_MODE_KEY[source.mode])}
      {!compact && <span className="source-label__name"> · {source.name}</span>}
    </span>
  );
}
