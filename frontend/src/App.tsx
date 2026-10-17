import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Map } from "maplibre-gl";
import type { Place, RouteResponse } from "./api/contract";
import { MapView } from "./map/MapView";
import { PlaceCard } from "./components/places/PlaceCard";
import { MapCredits } from "./components/provenance/MapCredits";
import { SourceLabel } from "./components/provenance/SourceLabel";
import { Icon } from "./experience/Icon";
import { Planner } from "./experience/Planner";
import { RouteResults } from "./experience/RouteResults";
import { MapCallouts } from "./experience/MapCallouts";
import { History } from "./experience/History";
import { Feedback } from "./experience/Feedback";
import {
  INITIAL_DRAFT,
  MOODS,
  requestFor,
  safeRead,
  safeWrite,
  type Draft,
} from "./experience/model";
import { HISTORICAL_LAYERS, attributionText } from "./map/historicalOverlay";
import fixture from "../../data/fixtures/route-response.json";
import "./experience/experience.css";

type Tool = "history" | "accessibility" | "feedback" | "sources" | null;
const DESKTOP_PADDING = { top: 120, bottom: 130, left: 450, right: 100 };
const MOBILE_PADDING = { top: 220, bottom: 420, left: 25, right: 70 };
const MOBILE_MAP_PADDING = { top: 220, bottom: 160, left: 25, right: 70 };
function useMobile() {
  const [mobile, setMobile] = useState(
    () => matchMedia("(max-width: 760px)").matches,
  );
  useEffect(() => {
    const q = matchMedia("(max-width: 760px)");
    const change = () => setMobile(q.matches);
    q.addEventListener("change", change);
    return () => q.removeEventListener("change", change);
  }, []);
  return mobile;
}
export function App() {
  const [draft, setDraft] = useState<Draft>(INITIAL_DRAFT);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    safeRead(
      "warsaw-theme",
      matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    ),
  );
  const [reduce, setReduce] = useState(false),
    [contrast, setContrast] = useState(false),
    [large, setLarge] = useState(false);
  const [result, setResult] = useState<RouteResponse | null>(null),
    [selectedId, setSelectedId] = useState<string>(),
    [placeId, setPlaceId] = useState<string>();
  const [tab, setTab] = useState<"plan" | "routes">("plan"),
    [tool, setTool] = useState<Tool>(null),
    [historyIndex, setHistoryIndex] = useState(-1);
  const [map, setMap] = useState<Map | null>(null),
    [ar, setAr] = useState(false),
    [promotions, setPromotions] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]),
    [catalogueState, setCatalogueState] = useState("loading"),
    [catalogueRetry, setCatalogueRetry] = useState(0);
  const [canRouteStops, setCanRouteStops] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [feedbackArea, setFeedbackArea] = useState("");
  const [conversation, setConversation] = useState<
    { request: string; answer: string }[]
  >([]);
  const [reply, setReply] = useState(""),
    [lastQuery, setLastQuery] = useState(""),
    [collapsed, setCollapsed] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const requestTimeout = useRef<number | undefined>(undefined);
  const dialog = useRef<HTMLDialogElement>(null);
  const toolRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const mobile = useMobile();
  const selected = result?.routes.find((r) => r.id === selectedId);
  const place = selected?.places.find((p) => p.id === placeId);
  const mood = MOODS.find((m) => m.id === draft.mood)!;
  useLayoutEffect(() => {
    document.documentElement.classList.add("theme-changing");
    document.documentElement.dataset.theme = theme;
    void document.documentElement.offsetHeight;
    const frame = requestAnimationFrame(() =>
      document.documentElement.classList.remove("theme-changing"),
    );
    safeWrite("warsaw-theme", theme);
    return () => cancelAnimationFrame(frame);
  }, [theme]);
  useLayoutEffect(() => {
    document.documentElement.dataset.mood = draft.mood;
  }, [draft.mood]);
  useLayoutEffect(() => {
    document.documentElement.dataset.motion = reduce ? "reduced" : "normal";
    document.documentElement.dataset.contrast = String(contrast);
    document.documentElement.dataset.large = String(large);
    window.dispatchEvent(new Event("warsaw-motion"));
  }, [reduce, contrast, large]);
  useEffect(() => {
    const controller = new AbortController();
    setCatalogueState("loading");
    fetch("/api/places?limit=100", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (!Array.isArray(data.places)) throw new Error();
        setPlaces(data.places);
        setCatalogueState("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setCatalogueState("error");
      });
    fetch("/api/health", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) =>
        setCanRouteStops(data?.capabilities?.ordered_stops === true),
      )
      .catch(() => {});
    return () => controller.abort();
  }, [catalogueRetry]);
  useEffect(
    () => () => {
      abort.current?.abort();
      clearTimeout(requestTimeout.current);
    },
    [],
  );
  useEffect(() => {
    if (ar) dialog.current?.showModal();
    else dialog.current?.close();
  }, [ar]);
  useEffect(() => {
    if (tool) toolRef.current?.focus();
  }, [tool]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTool(null);
        setPlaceId(undefined);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  async function plan() {
    abort.current?.abort();
    clearTimeout(requestTimeout.current);
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setError("");
    requestTimeout.current = window.setTimeout(
      () => controller.abort("timeout"),
      30000,
    );
    try {
      const query = draft.query.trim();
      const contextualDraft = {
        ...draft,
        query:
          query && lastQuery && query !== lastQuery
            ? `Previous outing: ${lastQuery.slice(0, 80)}\nNew request: ${query}`
            : query || lastQuery,
      };
      const request = requestFor(contextualDraft, places, canRouteStops);
      const response = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      if (!response.ok)
        throw new Error(
          response.status === 422
            ? "The route service could not accept those choices. Adjust your outing and try again."
            : `Route service returned ${response.status}. Try again.`,
        );
      const data = (await response.json()) as RouteResponse & {
        applied_itinerary?: {
          destination_place_id: string;
          via_place_ids: string[];
        };
      };
      if (
        !Array.isArray(data.routes) ||
        !Array.isArray(data.sources) ||
        !data.preferences
      )
        throw new Error(
          "The route service returned an incomplete result. Try again.",
        );
      if (
        draft.destination &&
        (!data.applied_itinerary ||
          data.applied_itinerary.destination_place_id !== draft.destination ||
          JSON.stringify(data.applied_itinerary.via_place_ids) !==
            JSON.stringify(draft.stops))
      )
        throw new Error(
          "The service did not confirm your requested stops. Your previous route is unchanged.",
        );
      setResult(data);
      setSelectedId(
        (data.routes.find((r) => r.recommended) ?? data.routes[0])?.id,
      );
      setPlaceId(undefined);
      setLastQuery(
        draft.query || lastQuery || "A museum outing in central Warsaw",
      );
      const best =
        data.routes.find((route) => route.recommended) ?? data.routes[0];
      setConversation((previous) =>
        [
          ...previous,
          {
            request: draft.query || "Update my outing with these preferences",
            answer: best
              ? `Recommended: ${best.name}. ${data.preferences.interpreted_by === "model" ? "Preferences interpreted by AI." : "Preferences interpreted by rules."}`
              : "No routes matched. Try adjusting the time budget.",
          },
        ].slice(-8),
      );
      setDraft((current) =>
        current.query === draft.query ? { ...current, query: "" } : current,
      );
      setReply(
        data.routes.length
          ? `I found ${data.routes.length} ways to spend your afternoon. Compare them below, or adjust your preferences.`
          : "No routes matched. Try a longer time budget or fewer stops.",
      );
      setTab(data.routes.length ? "routes" : "plan");
      setCollapsed(mobile);
    } catch (e) {
      if (abort.current !== controller) return;
      setError(
        controller.signal.aborted
          ? "The request took too long. Try again or explore the labelled demo."
          : e instanceof Error
            ? e.message
            : "Could not reach the route service. Try again or explore the labelled demo.",
      );
    } finally {
      if (abort.current === controller) {
        clearTimeout(requestTimeout.current);
        setBusy(false);
      }
    }
  }
  function loadDemo() {
    abort.current?.abort();
    clearTimeout(requestTimeout.current);
    setBusy(false);
    abort.current = null;
    const data = fixture as RouteResponse;
    setResult(data);
    setSelectedId(data.routes[0]?.id);
    setPlaceId(undefined);
    setTab("routes");
    setReply(
      "These are fictional example routes. Their geometry and scores are simulated.",
    );
    setError("");
    setCollapsed(mobile);
  }
  function selectRoute(id: string) {
    setSelectedId(id);
    setPlaceId(undefined);
  }
  function showPlace(id: string) {
    setPlaceId(id);
    setTool(null);
  }
  function toggleTool(next: Tool) {
    setPlaceId(undefined);
    setTool((current) => (current === next ? null : next));
  }
  return (
    <div
      className={`experience ${collapsed ? "panel-collapsed" : ""} ${ar ? "ar-active" : ""}`}
    >
      <a className="skip-link" href="#planner-main">
        Skip map and go to planner
      </a>
      <MapView
        routes={result?.routes}
        selectedRouteId={selectedId}
        padding={
          mobile
            ? collapsed
              ? MOBILE_MAP_PADDING
              : MOBILE_PADDING
            : DESKTOP_PADDING
        }
        onMapReady={setMap}
        onStopClick={showPlace}
        appearance={`${theme}-${draft.mood}-${reduce}-${contrast}`}
      />
      {map && selected && (
        <MapCallouts
          map={map}
          route={selected}
          onPlace={showPlace}
          promotions={promotions}
          mood={draft.mood}
        />
      )}
      <header className="app-header">
        <a
          className="brand"
          href="#planner-main"
          aria-label="Warsaw 2076 planner"
        >
          <span className="brand-mark">
            <Icon name="route" size={22} />
          </span>
          <span>
            WARSAW <b>2076</b>
          </span>
        </a>
        <div className="city-label">A city that moves with you.</div>
        <nav aria-label="Display and information">
          <button
            className="icon-button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <Icon name={theme === "light" ? "moon" : "sun"} />
          </button>
          <button
            className="icon-button"
            aria-label="Accessibility settings"
            aria-expanded={tool === "accessibility"}
            onClick={() => toggleTool("accessibility")}
          >
            <Icon name="accessibility" />
          </button>
          <button
            className="quiet-button sources-button"
            aria-label="Sources"
            aria-expanded={tool === "sources"}
            onClick={() => toggleTool("sources")}
          >
            <Icon name="layers" size={18} />
            <span>Sources</span>
          </button>
        </nav>
      </header>
      <main
        ref={mainRef}
        id="planner-main"
        tabIndex={-1}
        className="planner-panel"
        aria-label="Outing planner"
      >
        <div className="panel-handle">
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-expanded={!collapsed}
          >
            {collapsed ? "Open planner" : "Show more map"}
            <Icon name="chevron-down" size={16} />
          </button>
        </div>
        <div className="panel-body">
          <div className={`panel-intro ${result ? "has-results" : ""}`}>
            <h1>
              A little more
              <br />
              <span>your kind of city.</span>
            </h1>
            <p>Make room for what you love along the way.</p>
          </div>
          {result && (
            <div className="panel-tabs" aria-label="Planner views">
              <button
                aria-pressed={tab === "plan"}
                onClick={() => setTab("plan")}
              >
                Your outing
              </button>
              <button
                aria-pressed={tab === "routes"}
                onClick={() => setTab("routes")}
              >
                Routes <span>{result.routes.length}</span>
              </button>
            </div>
          )}
          {error && (
            <div className="error-message" role="alert">
              <strong>We couldn’t plan that route.</strong>
              <p>{error}</p>
              <button className="text-action" onClick={loadDemo}>
                Explore demo routes
              </button>
            </div>
          )}
          {reply && (
            <div className="conversation-note">
              <Icon name="sparkles" size={18} />
              <div>
                {lastQuery && (
                  <details>
                    <summary>Your request</summary>
                    <p>{lastQuery}</p>
                  </details>
                )}
                <p>{reply}</p>
                <small>
                  {result?.preferences.interpreted_by === "model"
                    ? "Route assistant · AI-interpreted preferences"
                    : result?.preferences.interpreted_by === "fixture"
                      ? "Demo assistant"
                      : "Route assistant · rule-based"}
                </small>
              </div>
            </div>
          )}
          {tab === "plan" && conversation.length > 0 && (
            <details className="conversation-history">
              <summary>Conversation ({conversation.length})</summary>
              <ol>
                {conversation.map((turn, i) => (
                  <li key={i}>
                    <p>
                      <strong>You</strong>
                      {turn.request}
                    </p>
                    <p>
                      <strong>Route assistant</strong>
                      {turn.answer}
                    </p>
                  </li>
                ))}
              </ol>
              <p className="small muted">
                Kept for this visit only. Follow-ups use your previous request
                and current preferences.
              </p>
            </details>
          )}
          <div role="status" className="sr-only">
            {busy ? "Finding routes" : error || reply}
          </div>
          {tab === "plan" ? (
            <Planner
              draft={draft}
              setDraft={setDraft}
              places={places}
              catalogueState={catalogueState}
              retryCatalogue={() => setCatalogueRetry((n) => n + 1)}
              busy={busy}
              canRouteStops={canRouteStops}
              onPlan={() => void plan()}
              hasResult={!!result}
            />
          ) : (
            result && (
              <RouteResults
                result={result}
                selectedId={selectedId}
                onSelect={selectRoute}
                onPlace={showPlace}
                onEdit={() => setTab("plan")}
              />
            )
          )}
          {result && tab === "plan" && (
            <p className="response-notice">{result.notice}</p>
          )}
          {selected && tab === "routes" && (
            <section className="nearby-ideas">
              <label className="setting-row">
                <span>
                  <strong>Ideas along your route</strong>
                  <small>
                    Fictional promotions matched to {mood.label.toLowerCase()}
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={promotions}
                  onChange={(e) => setPromotions(e.target.checked)}
                />
              </label>
              {promotions && (
                <div className="notice">
                  <span className="tag">Fictional promotion</span>
                  <p>
                    {draft.mood === "active"
                      ? "Sample cycle workshop · free tyre-pressure check."
                      : draft.mood === "culture"
                        ? "Sample bookshop · 10% off a local history guide."
                        : draft.mood === "discover"
                          ? "Sample neighbourhood café · a tasting break."
                          : "Sample park café · 10% off a reusable-cup refill."}
                  </p>
                  <small>
                    Illustrative offer, not a real business or redemption code.
                  </small>
                </div>
              )}
            </section>
          )}
          {!result && !busy && (
            <button className="demo-link text-action" onClick={loadDemo}>
              Explore a labelled demo instead
            </button>
          )}
        </div>
      </main>
      <div className="map-context" role="region" aria-label="Map context">
        <span className="context-dot" />
        <span>
          {selected ? selected.name : "Central Warsaw"}
          <small>
            {selected
              ? `${mood.label} · ${result?.mode === "mock" ? "Simulated route" : selected.geometry_kind === "straight_line" ? "Illustrative geometry" : "Street route"}`
              : "Paper map · explore at your own pace"}
          </small>
        </span>
      </div>
      <nav className="map-tools" aria-label="Explore the city">
        <button
          aria-expanded={tool === "history"}
          onClick={() => toggleTool("history")}
        >
          <Icon name="clock" />
          <span>Through time</span>
          {historyIndex >= 0 && <b>{HISTORICAL_LAYERS[historyIndex].year}</b>}
        </button>
        <button
          aria-expanded={tool === "feedback"}
          onClick={() => toggleTool("feedback")}
        >
          <Icon name="message-square" />
          <span>Improve this place</span>
        </button>
        <button onClick={() => setAr(true)}>
          <Icon name="scan-line" />
          <span>AR preview</span>
          <small>Demo</small>
        </button>
      </nav>
      {place && selected && (
        <aside className="detail-panel" aria-label="Place details">
          <div className="tool-heading">
            <span>Along your route</span>
            <button
              className="icon-button"
              aria-label="Close place details"
              onClick={() => setPlaceId(undefined)}
            >
              <Icon name="x" />
            </button>
          </div>
          <PlaceCard
            place={place}
            source={result?.sources.find((s) => s.id === place.source_id)}
            stop={selected.stops.find((s) => s.place_id === place.id)}
            selected
          />
          <button
            className="quiet-button"
            onClick={() => {
              setFeedbackArea(place.name);
              setPlaceId(undefined);
              setTool("feedback");
            }}
          >
            Suggest an improvement here
          </button>
        </aside>
      )}
      <aside
        ref={toolRef}
        tabIndex={-1}
        className="tool-panel"
        hidden={!tool}
        aria-label={tool ? `${tool} panel` : undefined}
      >
        <div className="tool-heading">
          <span>
            {tool === "history"
              ? "Warsaw, then and now"
              : tool === "feedback"
                ? "City notebook"
                : tool === "sources"
                  ? "Know your data"
                  : "Make yourself comfortable"}
          </span>
          <button
            className="icon-button"
            aria-label="Close panel"
            onClick={() => {
              setTool(null);
              mainRef.current?.focus();
            }}
          >
            <Icon name="x" />
          </button>
        </div>
        <div hidden={tool !== "history"}>
          <History map={map} index={historyIndex} setIndex={setHistoryIndex} />
        </div>
        {tool === "feedback" && (
          <Feedback route={selected} initialArea={feedbackArea} />
        )}
        {tool === "accessibility" && (
          <section>
            <h2>Your comfort, your choice</h2>
            <p>These settings apply to this visit.</p>
            {[
              {
                label: "Reduce motion",
                detail: "Still camera transitions and route highlights",
                value: reduce,
                set: setReduce,
              },
              {
                label: "Increase contrast",
                detail: "Stronger text and control boundaries",
                value: contrast,
                set: setContrast,
              },
              {
                label: "Larger text",
                detail: "More readable interface text",
                value: large,
                set: setLarge,
              },
              {
                label: "Sample promotions",
                detail: "Fictional, preference-matched offers along your route",
                value: promotions,
                set: setPromotions,
              },
            ].map((item) => (
              <label className="setting-row" key={item.label}>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
                <input
                  type="checkbox"
                  checked={item.value}
                  onChange={(e) => item.set(e.target.checked)}
                />
              </label>
            ))}
            <p className="small muted">
              System reduced-motion preferences are always respected. Route
              names and numbered stops accompany every colour. All map places
              are available in the route list.
            </p>
          </section>
        )}
        {tool === "sources" && (
          <section>
            <h2>Real places. Honest context.</h2>
            <p>
              Green and quiet scores are estimates, not measured conditions.
              Opening hours can be unknown.
            </p>
            {result && (
              <>
                <p className="notice">{result.notice}</p>
                <ul className="source-list">
                  {result.sources.map((s) => (
                    <li key={s.id}>
                      <strong>{s.name}</strong>
                      <SourceLabel source={s} />
                      <p>{s.method}</p>
                      <small>{s.attribution}</small>
                      {s.url && /^https?:/.test(s.url) && (
                        <a href={s.url} target="_blank" rel="noreferrer">
                          Visit source
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p>
              Promotions and AR are fictional demonstrations. Feedback stays on
              this device until you export it.
            </p>
            <p className="small">
              3D buildings use available map heights and fallback estimates.
              Their appearance is illustrative.
            </p>
            <MapCredits />
          </section>
        )}
      </aside>
      {historyIndex >= 0 && (
        <div className="historical-credit">
          {attributionText(HISTORICAL_LAYERS[historyIndex])}
        </div>
      )}
      <footer className="app-footer">
        <MapCredits />
        <span>Requests stay private · feedback stays on this device</span>
      </footer>
      <dialog
        ref={dialog}
        className="ar-dialog"
        aria-label="Augmented reality concept preview"
        onCancel={() => setAr(false)}
        onClose={() => setAr(false)}
      >
        <div className="ar-header">
          <span className="tag">AR concept · simulated</span>
          <button className="quiet-button" onClick={() => setAr(false)}>
            <Icon name="x" />
            Close preview
          </button>
        </div>
        <div className="ar-scene">
          <div className="ar-reticle" />
          <div className="ar-title">
            <h2>
              A future layer
              <br />
              on your city.
            </h2>
            <p>
              This map stands in for a camera view.
              <br />
              No camera access or live AR tracking.
            </p>
          </div>
          <div className="ar-place">
            <Icon name="landmark" />
            <div>
              <small>Information overlay · demo</small>
              <strong>
                {selected?.places[0]?.name ?? "A landmark along your route"}
              </strong>
              <p>Discover the story behind this place.</p>
            </div>
          </div>
          <div className="ar-history">
            <Icon name="layers" />
            <div>
              <strong>Look into Warsaw’s past</strong>
              <p>
                Imagine historical imagery aligned with the street in front of
                you.
              </p>
              <button
                className="quiet-button"
                onClick={() => {
                  setHistoryIndex(historyIndex === 0 ? -1 : 0);
                }}
              >
                {historyIndex === 0
                  ? "Return to the present"
                  : "Show the 1935 map overlay"}
              </button>
            </div>
          </div>
          <div className="ar-credits">
            {historyIndex >= 0 && (
              <span>{attributionText(HISTORICAL_LAYERS[historyIndex])} · </span>
            )}
            <MapCredits />
          </div>
          <div className="ar-caption">
            Future interface example · not navigation guidance
          </div>
        </div>
      </dialog>
    </div>
  );
}
