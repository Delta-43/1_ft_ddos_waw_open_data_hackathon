import { Marker, type Map } from "maplibre-gl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Route } from "../api/contract";
import type { Mood } from "./model";
import { Icon } from "./Icon";
export function MapCallouts({
  map,
  route,
  onPlace,
  promotions,
  mood,
}: {
  map: Map;
  route: Route;
  onPlace: (id: string) => void;
  promotions: boolean;
  mood: Mood;
}) {
  const [anchors, setAnchors] = useState<
    {
      id: string;
      name: string;
      category: string;
      order: number;
      element: HTMLDivElement;
    }[]
  >([]);
  useEffect(() => {
    const markers: Marker[] = [];
    const next = route.stops
      .filter((_, i, all) => i === 0 || i === all.length - 1)
      .flatMap((stop) => {
        const p = route.places.find((place) => place.id === stop.place_id);
        if (!p) return [];
        const element = document.createElement("div");
        element.className = "map-callout-anchor";
        markers.push(
          new Marker({ element, anchor: "bottom-left", offset: [18, -22] })
            .setLngLat([p.longitude, p.latitude])
            .addTo(map),
        );
        return [
          {
            id: p.id,
            name: p.name,
            category: p.category,
            order: stop.order,
            element,
          },
        ];
      });
    const position = () =>
      markers.forEach((marker) => {
        const element = marker.getElement();
        const x = map.project(marker.getLngLat()).x;
        const width = element.offsetWidth || 220;
        const left = x + width + 24 > map.getContainer().clientWidth;
        marker.setOffset([left ? -width - 18 : 18, -22]);
        element.dataset.side = left ? "left" : "right";
      });
    setAnchors(next);
    const frame = requestAnimationFrame(position);
    map.on("move", position);
    return () => {
      cancelAnimationFrame(frame);
      map.off("move", position);
      markers.forEach((m) => m.remove());
    };
  }, [map, route]);
  return (
    <>
      {anchors.map((a, i) =>
        createPortal(
          <div className="anchored-stack">
            <button className="map-callout" onClick={() => onPlace(a.id)}>
              <span className="callout-icon">
                <Icon name={a.category === "park" ? "leaf" : "landmark"} />
              </span>
              <span>
                <small>
                  Stop {a.order} · {a.category}
                </small>
                <strong>{a.name}</strong>
              </span>
              <Icon name="arrow-right" size={16} />
            </button>
            {promotions && i === 1 && (
              <div className="promotion-callout">
                <span className="tag">Fictional promotion</span>
                <strong>
                  {mood === "active"
                    ? "A stop for your bike"
                    : mood === "culture"
                      ? "Stories to take home"
                      : "A pause along the way"}
                </strong>
                <p>
                  {mood === "active"
                    ? "Sample workshop · tyre check"
                    : mood === "culture"
                      ? "Sample bookshop · 10% off"
                      : "Sample café · 10% off a refill"}
                  <br />
                  Illustrative offer, not a real business.
                </p>
              </div>
            )}
          </div>,
          a.element,
          a.id,
        ),
      )}
    </>
  );
}
