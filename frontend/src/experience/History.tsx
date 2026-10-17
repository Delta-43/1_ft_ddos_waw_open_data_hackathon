import { useEffect, useState } from "react";
import type { Map, ErrorEvent } from "maplibre-gl";
import {
  HISTORICAL_LAYERS,
  showHistoricalLayer,
  attributionText,
} from "../map/historicalOverlay";
import { Icon } from "./Icon";
export function History({
  map,
  index,
  setIndex,
}: {
  map: Map | null;
  index: number;
  setIndex: (n: number) => void;
}) {
  const [opacity, setOpacity] = useState(0.75),
    [status, setStatus] = useState("");
  useEffect(() => {
    if (!map) return;
    showHistoricalLayer(map, index, opacity);
    if (index < 0) {
      setStatus("");
      return;
    }
    const layer = HISTORICAL_LAYERS[index],
      id = `historical-${layer.id}`;
    setStatus("Loading historical imagery…");
    const check = () => {
      if (map.isSourceLoaded(id)) setStatus("Historical imagery loaded");
    };
    const error = (e: ErrorEvent & { sourceId?: string }) => {
      if (e.sourceId === id)
        setStatus(
          "Historical image unavailable. Choose another year or return to Today.",
        );
    };
    map.on("sourcedata", check);
    map.on("error", error);
    const timer = window.setTimeout(() => {
      if (!map.isSourceLoaded(id))
        setStatus(
          "Historical image is taking longer than expected. Try another year or Today.",
        );
    }, 12000);
    check();
    return () => {
      clearTimeout(timer);
      map.off("sourcedata", check);
      map.off("error", error);
    };
  }, [map, index]);
  useEffect(() => {
    if (map) showHistoricalLayer(map, index, opacity, false);
  }, [map, opacity]);
  return (
    <section className="history-content">
      <h2>See the city through time</h2>
      <p>
        Compare today's streets with Warsaw's historical maps and aerial
        photographs.
      </p>
      <div className="timeline" aria-label="Historical year">
        <button
          disabled={!map}
          aria-pressed={index === -1}
          onClick={() => setIndex(-1)}
        >
          Today
        </button>
        {HISTORICAL_LAYERS.map((l, i) => (
          <button
            disabled={!map}
            key={l.id}
            aria-pressed={index === i}
            onClick={() => setIndex(i)}
          >
            {l.year}
          </button>
        ))}
      </div>
      {index >= 0 && (
        <>
          <label htmlFor="history-opacity">
            Then / now · {Math.round(opacity * 100)}% historical
          </label>
          <input
            id="history-opacity"
            type="range"
            min="0"
            max="1"
            step=".05"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
          />
          <p className="history-credit">
            {attributionText(HISTORICAL_LAYERS[index])}
          </p>
        </>
      )}
      <p className="small muted" role="status">
        {!map ? "The map is still loading." : status}
      </p>
      <p className="small muted">
        <Icon name="layers" size={14} /> Historical imagery is a dated visual
        layer, not current street information.
      </p>
    </section>
  );
}
