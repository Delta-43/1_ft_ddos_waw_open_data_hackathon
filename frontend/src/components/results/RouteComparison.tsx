import { sourceFor, type Metric, type Route, type Source } from '../../api/contract';
import { useT } from '../../i18n/useT';
import type { Key } from '../../i18n/translations';
import { formatDistance, formatDuration } from '../places/format';
import { SourceLabel } from '../provenance/SourceLabel';
import './results.css';

interface RouteComparisonProps {
  routes: Route[];
  sources: Source[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  /** True when the explanation text was written by a model rather than rules or the fixture. */
  explainedByModel: boolean;
  /** The response notice (what is real, estimated or simulated); shown under the heading. */
  notice?: string;
}

/** One card per candidate route, ranked; every metric carries its own source label. */
export function RouteComparison({ routes, sources, selectedId, onSelect, explainedByModel, notice }: RouteComparisonProps) {
  const t = useT();
  const score = (metric: Metric) => (metric.value == null ? t('unknown') : metric.value.toFixed(2));
  const ranked = [...routes].sort((a, b) => a.rank - b.rank);
  return (
    <section className="route-comparison" aria-label={t('routeComparisonAriaLabel')}>
      <h2 className="results__heading">{ranked.length === 1 ? t('routesHeadingOne') : t('routesHeadingMany', { count: ranked.length })}</h2>
      {notice && <p className="route-comparison__notice" role="note">{notice}</p>}
      <ul className="route-comparison__list">
        {ranked.map(route => {
          const selected = route.id === selectedId;
          const metrics: { labelKey: Key; value: string; metric: Metric }[] = [
            { labelKey: 'distanceLabel', value: formatDistance(route.metrics.distance_m.value), metric: route.metrics.distance_m },
            { labelKey: 'timeLabel', value: formatDuration(route.metrics.duration_s.value), metric: route.metrics.duration_s },
            { labelKey: 'green', value: score(route.metrics.green_score), metric: route.metrics.green_score },
            { labelKey: 'quiet', value: score(route.metrics.quiet_score), metric: route.metrics.quiet_score },
          ];
          return (
            <li key={route.id}>
              <button
                type="button"
                className={`route-card${selected ? ' route-card--selected' : ''}`}
                aria-pressed={selected}
                onClick={() => onSelect(route.id)}
              >
                <span className="route-card__title">
                  <span className="route-card__name">{route.name}</span>
                  {route.recommended && <span className="route-card__recommended">{t('recommended')}</span>}
                </span>
                <span className="route-card__metrics">
                  {metrics.map(({ labelKey, value, metric }) => (
                    <span key={labelKey} className="route-card__metric">
                      <span className="route-card__metric-label">{t(labelKey)}</span>
                      <span className="route-card__metric-value">{value}</span>
                      <SourceLabel source={sourceFor(sources, metric.source_id)} compact />
                    </span>
                  ))}
                </span>
                <span className="route-card__explanation">{route.explanation}</span>
                <span className="route-card__note">
                  {route.geometry_kind === 'straight_line' ? t('illustrativeNote') : t('streetRouteNote')}
                  {explainedByModel && t('explainedByAI')}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
