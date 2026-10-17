import { sourceFor, type Metric, type Route, type Source } from '../../api/contract';
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
}

const score = (metric: Metric) => (metric.value == null ? 'Unknown' : metric.value.toFixed(2));

/** One card per candidate route, ranked; every metric carries its own source label. */
export function RouteComparison({ routes, sources, selectedId, onSelect, explainedByModel }: RouteComparisonProps) {
  const ranked = [...routes].sort((a, b) => a.rank - b.rank);
  return (
    <section className="route-comparison" aria-label="Route comparison">
      <h2 className="results__heading">{ranked.length} {ranked.length === 1 ? 'route' : 'routes'} · ranked</h2>
      <ul className="route-comparison__list">
        {ranked.map(route => {
          const selected = route.id === selectedId;
          const metrics = [
            { label: 'Distance', value: formatDistance(route.metrics.distance_m.value), metric: route.metrics.distance_m },
            { label: 'Time', value: formatDuration(route.metrics.duration_s.value), metric: route.metrics.duration_s },
            { label: 'Green', value: score(route.metrics.green_score), metric: route.metrics.green_score },
            { label: 'Quiet', value: score(route.metrics.quiet_score), metric: route.metrics.quiet_score },
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
                  {route.recommended && <span className="route-card__recommended">Recommended</span>}
                </span>
                <span className="route-card__metrics">
                  {metrics.map(({ label, value, metric }) => (
                    <span key={label} className="route-card__metric">
                      <span className="route-card__metric-label">{label}</span>
                      <span className="route-card__metric-value">{value}</span>
                      <SourceLabel source={sourceFor(sources, metric.source_id)} compact />
                    </span>
                  ))}
                </span>
                <span className="route-card__explanation">{route.explanation}</span>
                <span className="route-card__note">
                  {route.geometry_kind === 'straight_line' ? 'Illustrative straight lines — not walking directions' : 'Street route from a routing service'}
                  {explainedByModel && ' · explanation written by AI from this route’s data'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
