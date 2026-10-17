import { useState } from "react";
import type { Place } from "../api/contract";
import { Icon } from "./Icon";
import { MOODS, type Draft } from "./model";
interface Props {
  draft: Draft;
  setDraft: (draft: Draft) => void;
  places: Place[];
  catalogueState: string;
  retryCatalogue: () => void;
  busy: boolean;
  canRouteStops: boolean;
  onPlan: () => void;
  hasResult: boolean;
}
export function Planner({
  draft,
  setDraft,
  places,
  catalogueState,
  retryCatalogue,
  busy,
  canRouteStops,
  onPlan,
  hasResult,
}: Props) {
  const [mode, setMode] = useState<"conversation" | "destination">(
    "conversation",
  );
  const [search, setSearch] = useState("");
  const change = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const options = places.filter((p) =>
    `${p.name} ${p.address ?? ""}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  const selected = places.find((p) => p.id === draft.destination);
  return (
    <form
      className="planner-form"
      onSubmit={(e) => {
        e.preventDefault();
        onPlan();
      }}
    >
      <div className="segmented" aria-label="Planning method">
        <button
          type="button"
          aria-pressed={mode === "conversation"}
          onClick={() => setMode("conversation")}
        >
          <Icon name="sparkles" size={16} />
          Describe a day
        </button>
        <button
          type="button"
          aria-pressed={mode === "destination"}
          onClick={() => setMode("destination")}
        >
          <Icon name="map-pin" size={16} />
          Pick a place
        </button>
      </div>
      {mode === "conversation" ? (
        <div className="field">
          <label htmlFor="outing-query">
            {hasResult
              ? "What would you like to change?"
              : "What would you like to do?"}
          </label>
          <textarea
            id="outing-query"
            value={draft.query}
            maxLength={450}
            rows={3}
            placeholder="A quiet afternoon. A museum, a walk through the parks…"
            onChange={(e) => change({ query: e.target.value })}
          />
          <button
            className="text-action example"
            type="button"
            onClick={() =>
              change({ query: "A quiet green museum outing on foot" })
            }
          >
            Try a green museum afternoon <Icon name="arrow-right" size={16} />
          </button>
        </div>
      ) : (
        <div className="field">
          <label htmlFor="place-search">Find a destination</label>
          <input
            id="place-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the demo area"
            type="search"
          />
          {catalogueState === "error" ? (
            <p role="alert">
              Places could not load.{" "}
              <button
                type="button"
                className="text-action"
                onClick={retryCatalogue}
              >
                Try again
              </button>
            </p>
          ) : catalogueState === "loading" ? (
            <p role="status">Loading places…</p>
          ) : (
            <>
              <label htmlFor="destination">
                Catalogue places · {options.length} matches
              </label>
              <select
                id="destination"
                value={draft.destination}
                onChange={(e) =>
                  change({
                    destination: e.target.value,
                    stops: draft.stops.filter((id) => id !== e.target.value),
                  })
                }
              >
                <option value="">Choose a place</option>
                {selected && !options.some((p) => p.id === selected.id) && (
                  <option value={selected.id}>{selected.name}</option>
                )}
                {options.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {!options.length && <p>No places match. Try a shorter name.</p>}
            </>
          )}
          <p className="muted small">
            Catalogue coverage: central Warsaw. Locations may not be entrances.
          </p>
        </div>
      )}
      <fieldset className="mood-field">
        <legend>Set the mood</legend>
        <div className="mood-grid">
          {MOODS.map((m) => (
            <button
              type="button"
              key={m.id}
              data-mood={m.id}
              aria-pressed={draft.mood === m.id}
              onClick={() => change({ mood: m.id })}
            >
              <Icon name={m.icon} size={18} />
              <span>{m.label}</span>
              {draft.mood === m.id && <Icon name="check" size={14} />}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="two-fields">
        <fieldset>
          <legend>Travel</legend>
          <div className="segmented">
            <button
              type="button"
              aria-pressed={draft.travel === "walk"}
              onClick={() => change({ travel: "walk" })}
            >
              <Icon name="footprints" size={16} />
              Walk
            </button>
            <button
              type="button"
              aria-pressed={draft.travel === "bike"}
              onClick={() => change({ travel: "bike" })}
            >
              <Icon name="bike" size={16} />
              Bike
            </button>
          </div>
        </fieldset>
        <div className="field">
          <label htmlFor="time-budget">Time available</label>
          <select
            id="time-budget"
            value={draft.minutes}
            onChange={(e) => change({ minutes: Number(e.target.value) })}
          >
            {[60, 120, 180, 240, 360].map((n) => (
              <option value={n} key={n}>
                {n / 60} {n === 60 ? "hour" : "hours"}
              </option>
            ))}
          </select>
        </div>
      </div>
      <details className="customise" open={draft.stops.length > 0 || undefined}>
        <summary>
          Stops & extra preferences <Icon name="plus" size={16} />
        </summary>
        <ol className="stop-editor">
          {draft.stops.map((id, i) => (
            <li key={id}>
              <span>
                {i + 1}.{" "}
                {places.find((p) => p.id === id)?.name ?? "Unknown place"}
              </span>
              <button
                type="button"
                className="icon-button"
                aria-label={`Move stop ${i + 1} earlier`}
                disabled={i === 0}
                onClick={() => {
                  const stops = [...draft.stops];
                  [stops[i - 1], stops[i]] = [stops[i], stops[i - 1]];
                  change({ stops });
                }}
              >
                <Icon name="move-up" size={16} />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove stop ${i + 1}`}
                onClick={() =>
                  change({ stops: draft.stops.filter((_, j) => j !== i) })
                }
              >
                <Icon name="x" size={16} />
              </button>
            </li>
          ))}
        </ol>
        <label htmlFor="add-stop">Add a stop ({draft.stops.length}/5)</label>
        <select
          id="add-stop"
          value=""
          disabled={draft.stops.length >= 5}
          onChange={(e) =>
            e.target.value &&
            change({ stops: [...draft.stops, e.target.value] })
          }
        >
          <option value="">Choose another place</option>
          {places
            .filter(
              (p) => !draft.stops.includes(p.id) && p.id !== draft.destination,
            )
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
        <label htmlFor="comment">Anything else?</label>
        <textarea
          id="comment"
          rows={2}
          maxLength={400}
          value={draft.comment}
          onChange={(e) => change({ comment: e.target.value })}
          placeholder="More green spaces, fewer busy roads…"
        />
      </details>
      {(draft.destination || draft.stops.length > 0) && !canRouteStops && (
        <p className="notice">
          Itinerary draft: destination and stop routing is being connected.
          Clear these choices to plan a general outing.
        </p>
      )}
      {draft.stops.length > 0 && !draft.destination && (
        <p className="notice">Choose a final destination in Pick a place.</p>
      )}
      <button
        className="primary plan-action"
        disabled={
          busy ||
          ((!canRouteStops || !draft.destination) &&
            (Boolean(draft.destination) || draft.stops.length > 0))
        }
        type="submit"
      >
        <Icon name="route" />
        {busy
          ? "Finding your routes…"
          : hasResult
            ? "Update routes"
            : "Find my route"}
        <Icon name="arrow-right" />
      </button>
      <p className="privacy small">
        Your requests and location are not stored on the server.
      </p>
    </form>
  );
}
