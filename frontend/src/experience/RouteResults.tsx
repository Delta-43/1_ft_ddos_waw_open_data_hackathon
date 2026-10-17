import { sourceFor, type RouteResponse } from "../api/contract";
import { SourceLabel } from "../components/provenance/SourceLabel";
import { formatDistance, formatDuration } from "../components/places/format";
import { Icon } from "./Icon";
export function RouteResults({
  result,
  selectedId,
  onSelect,
  onPlace,
  onEdit,
}: {
  result: RouteResponse;
  selectedId?: string;
  onSelect: (id: string) => void;
  onPlace: (id: string) => void;
  onEdit: () => void;
}) {
  const selected = result.routes.find((r) => r.id === selectedId);
  return (
    <div className="route-results">
      <div className="result-heading">
        <div>
          <h2>Your way through Warsaw</h2>
          <p>{result.routes.length} routes to consider</p>
        </div>
        <button
          className="icon-button"
          aria-label="Edit outing"
          onClick={onEdit}
        >
          <Icon name="sliders-horizontal" />
        </button>
      </div>
      <p className="response-notice">{result.notice}</p>
      <div className="route-options">
        {[...result.routes]
          .sort((a, b) => a.rank - b.rank)
          .map((route) => (
            <article
              key={route.id}
              className={`route-option ${selectedId === route.id ? "is-selected" : ""}`}
            >
              <button
                className="route-select"
                aria-pressed={selectedId === route.id}
                onClick={() => onSelect(route.id)}
              >
                <span className="route-name">{route.name}</span>
                {route.recommended && (
                  <span className="tag mood-tag">Best match</span>
                )}
                <span className="route-metrics">
                  <span>
                    <Icon name="clock" size={16} />
                    {formatDuration(route.metrics.duration_s.value)}
                    <SourceLabel
                      source={sourceFor(
                        result.sources,
                        route.metrics.duration_s.source_id,
                      )}
                      compact
                    />
                  </span>
                  <span>
                    <Icon name="footprints" size={16} />
                    {formatDistance(route.metrics.distance_m.value)}
                    <SourceLabel
                      source={sourceFor(
                        result.sources,
                        route.metrics.distance_m.source_id,
                      )}
                      compact
                    />
                  </span>
                </span>
              </button>
              {selectedId === route.id && (
                <div className="route-expanded">
                  <div className="score-row">
                    {(["green_score", "quiet_score"] as const).map((key) => (
                      <span key={key}>
                        {key === "green_score"
                          ? "Green estimate"
                          : "Quiet estimate"}
                        <strong>
                          {route.metrics[key].value === null
                            ? "Unknown"
                            : `${Math.round(route.metrics[key].value! * 100)}/100`}
                        </strong>
                        <SourceLabel
                          source={sourceFor(
                            result.sources,
                            route.metrics[key].source_id,
                          )}
                          compact
                        />
                      </span>
                    ))}
                  </div>
                  <details>
                    <summary>Why this route</summary>
                    <p>{route.explanation}</p>
                  </details>
                  <p className="small muted">
                    {route.geometry_kind === "straight_line"
                      ? "Illustrative straight lines · not navigation"
                      : "Street-following route"}{" "}
                    ·{" "}
                    {result.preferences.interpreted_by === "model"
                      ? "AI interpretation"
                      : result.preferences.interpreted_by === "fixture"
                        ? "Demo interpretation"
                        : "Rule-based interpretation"}
                  </p>
                </div>
              )}
            </article>
          ))}
      </div>
      {selected && (
        <section className="itinerary">
          <h3>
            Along your way <span>{selected.stops.length} stops</span>
          </h3>
          <ol>
            {[...selected.stops]
              .sort((a, b) => a.order - b.order)
              .map((stop) => {
                const place = selected.places.find(
                  (p) => p.id === stop.place_id,
                );
                return (
                  place && (
                    <li key={stop.place_id}>
                      <button onClick={() => onPlace(place.id)}>
                        <span className="stop-number">{stop.order}</span>
                        <span>
                          <strong>{place.name}</strong>
                          <small>
                            {place.category} ·{" "}
                            {place.opening_hours
                              ? "Hours supplied"
                              : "Hours unknown"}
                          </small>
                        </span>
                        <Icon name="arrow-right" size={16} />
                      </button>
                    </li>
                  )
                );
              })}
          </ol>
        </section>
      )}
    </div>
  );
}
