import type { Map } from "maplibre-gl";
const css = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();
export function applyAppearance(map: Map) {
  if (!map.getLayer("background")) return;
  const paint = (
    id: string,
    key: string,
    value: Parameters<Map["setPaintProperty"]>[2],
  ) => {
    if (map.getLayer(id))
      map.setPaintProperty(
        id,
        key as Parameters<Map["setPaintProperty"]>[1],
        value,
      );
  };
  const ground = css("--map-ground"),
    line = css("--map-line");
  paint("background", "background-color", ground);
  for (const [id, token] of [
    ["landuse-residential", "--map-land"],
    ["landcover-wood", "--map-wood"],
    ["landcover-grass", "--map-park"],
    ["park", "--map-park"],
    ["water", "--map-water"],
  ])
    paint(id, "fill-color", css(token));
  for (const id of ["road-major", "road-minor", "road-motorway"])
    paint(id, "line-color", css("--map-road"));
  for (const id of [
    "road-casing",
    "rail",
    "boundary-neighbourhood",
    "boundary-district",
    "building-outline",
  ])
    paint(id, "line-color", line);
  paint("waterway", "line-color", css("--map-water"));
  paint("building-3d", "fill-extrusion-color", [
    "case",
    ["boolean", ["feature-state", "nearRoute"], false],
    css("--map-building"),
    css("--map-land"),
  ]);
  paint("route-buildings", "fill-extrusion-color", css("--map-building"));
  paint("building-roof", "fill-extrusion-color", css("--map-roof"));
  for (const id of ["place-label", "water-label"]) {
    paint(id, "text-color", css("--moon-trunks"));
    paint(id, "text-halo-color", ground);
  }
  map.setSky({
    "sky-color": ground,
    "horizon-color": ground,
    "fog-color": ground,
  });
  paint("route-glow", "line-color", css("--mood"));
  paint("route-line", "line-color", ["case", ["get", "selected"], css("--mood"), css("--moon-trunks")]);
  paint(
    "route-casing",
    "line-color",
    document.documentElement.dataset.theme === "dark" ? "#111918" : "#30544a",
  );
  paint("route-stop", "circle-color", css("--moon-gohan"));
  paint("route-stop", "circle-stroke-color", css("--mood"));
  paint("route-stop-number", "text-color", css("--moon-bulma"));
}
