import type { CSSProperties, KeyboardEvent } from 'react';
import { sourceFor, type Route, type Source } from '../../api/contract';
import { routeColour, routeLetter } from '../../map/routeColours';
import { formatDistance, formatDuration } from '../places/format';

interface RouteSwitchProps {
  routes: Route[];
  sources: Source[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}

/** What can make a route stand out; `better` says which of two values wins. */
const TRAITS: { label: string; value: (route: Route) => number | null; better: (a: number, b: number) => boolean }[] = [
  { label: 'Quietest', value: route => route.metrics.quiet_score.value, better: (a, b) => a > b },
  { label: 'Greenest', value: route => route.metrics.green_score.value, better: (a, b) => a > b },
  { label: 'Shortest', value: route => route.metrics.distance_m.value, better: (a, b) => a < b },
];

/**
 * The most distinctive trait per route, read from its own metrics: each trait goes to the one
 * route that is strictly best at it, at most one trait per route; the rest are "Balanced".
 */
function distinctiveTraits(routes: Route[]): Map<string, string> {
  const traits = new Map<string, string>();
  for (const trait of TRAITS) {
    const known = routes.filter(route => trait.value(route) != null);
    const best = known.find(route => known.every(other => other === route || trait.better(trait.value(route)!, trait.value(other)!)));
    if (best && !traits.has(best.id)) traits.set(best.id, trait.label);
  }
  return traits;
}

/** "Real" or "Proxy" for the route's quiet score, from its own source label. */
function dataLabel(route: Route, sources: Source[]): string {
  const mode = sourceFor(sources, route.metrics.quiet_score.source_id)?.mode ?? 'unknown';
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

/**
 * Candidate routes as A, B, C inside the assistant. Click, or Tab/arrow keys then Enter or Space,
 * makes one the main route on the map.
 */
export function RouteSwitch({ routes, sources, selectedId, onSelect }: RouteSwitchProps) {
  const ranked = [...routes].sort((a, b) => a.rank - b.rank);
  const traits = distinctiveTraits(ranked);

  // Arrow keys move the focus between the routes; Enter or Space (native buttons) selects.
  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    event.preventDefault();
    buttons[(current + step + buttons.length) % buttons.length]?.focus();
  }

  return (
    <section className="route-switch" aria-label="Choose a route">
      <ul className="route-switch__list" onKeyDown={onKeyDown}>
        {ranked.map(route => {
          const selected = route.id === selectedId;
          const letter = routeLetter(ranked, route.id);
          return (
            <li key={route.id}>
              <button
                type="button"
                className={`route-switch__option${selected ? ' route-switch__option--selected' : ''}`}
                style={{ '--route': routeColour(ranked, route.id).line } as CSSProperties}
                aria-pressed={selected}
                onClick={() => onSelect(route.id)}
              >
                <span className="route-switch__letter" aria-hidden="true">{letter}</span>
                <span className="route-switch__text">
                  <span className="route-switch__name">
                    <span className="visually-hidden">Route {letter}: </span>{route.name}
                  </span>
                  <span className="route-switch__summary">
                    {traits.get(route.id) ?? 'Balanced'} · {formatDistance(route.metrics.distance_m.value)} · {formatDuration(route.metrics.duration_s.value)}
                  </span>
                </span>
                <span className="route-switch__chip">{dataLabel(route, sources)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
