import './provenance.css';

/**
 * Basemap credit required by OpenFreeMap / OpenMapTiles / OpenStreetMap (ODbL).
 * Shown in the bottom bar instead of MapLibre's floating control, so it never overlaps panels.
 */
export function MapCredits() {
  return (
    <span className="map-credits">
      <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a>{' '}
      <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a>{' '}
      Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
    </span>
  );
}
