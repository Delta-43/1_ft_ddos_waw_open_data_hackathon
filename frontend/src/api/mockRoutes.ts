import { getLang } from '../i18n/language';
import { localise, type Localised } from '../i18n/localised';
import { CONTRACT_VERSION, type Place, type Route, type RouteResponse } from './contract';

/**
 * A labelled MOCK response with three candidate routes (A, B, C) for building the route switch
 * without the backend. Turn it on with `?mock` in the URL. Geometry is straight lines between
 * stops and every metric is made up; the response says so in `mode`, `notice` and `sources`.
 */
export const MOCK_ROUTES_ENABLED = new URLSearchParams(window.location.search).has('mock');

const SOURCE_ID = 'mock-demo';

const place = (id: string, name: Localised, longitude: number, latitude: number, category: Place['category']): Place => ({
  id: `mock:${id}`,
  name: localise(name, getLang()),
  longitude,
  latitude,
  category,
  opening_hours: null,
  source_id: SOURCE_ID,
});

function route(id: string, rank: number, name: Localised, explanation: Localised, places: Place[], metrics: [number, number, number, number]): Route {
  const [distance, duration, green, quiet] = metrics; // distance ≈ straight-line length
  return {
    id,
    name: localise(name, getLang()),
    rank,
    recommended: rank === 1,
    travel_mode: 'walk',
    explanation: localise(explanation, getLang()),
    geometry: { type: 'LineString', coordinates: places.map(stop => [stop.longitude, stop.latitude]) },
    geometry_kind: 'straight_line',
    metrics: {
      distance_m: { value: distance, source_id: SOURCE_ID },
      duration_s: { value: duration, source_id: SOURCE_ID },
      green_score: { value: green, source_id: SOURCE_ID },
      quiet_score: { value: quiet, source_id: SOURCE_ID },
    },
    stops: places.map((stop, index) => ({ order: index + 1, place_id: stop.id })),
    places,
  };
}

/**
 * Every mock route starts here, so the three candidates are comparable.
 * Requirement for the live backend (Ola, 2026-10-18, needs Delta's agreement): the start comes
 * from the user's prompt (`preferences.start`) and is the same for every candidate route. If the
 * user also names an end point (`destination_place_id`), every candidate ends there too; only
 * the way between them may differ.
 */
const START = place('start', 'Start: Rondo de Gaulle’a', 21.0222, 52.2318, 'generic');

/** Built on each request, so names and notes are in the language chosen at the time. */
const routes = (): Route[] => [
  route('mock-a', 1, { en: 'Quiet park walk', pl: 'Cichy spacer przez parki' }, { en: 'Mock: through Ujazdów and Łazienki parks, away from main roads.', pl: 'Makieta: przez Park Ujazdowski i Łazienki, z dala od głównych ulic.' }, [
    START,
    place('national-museum', { en: 'National Museum', pl: 'Muzeum Narodowe' }, 21.0247, 52.2317, 'museum'),
    place('ujazdow', { en: 'Ujazdów Castle', pl: 'Zamek Ujazdowski' }, 21.0316, 52.2185, 'museum'),
    place('lazienki', { en: 'Łazienki Park', pl: 'Łazienki Królewskie' }, 21.0355, 52.215, 'park'),
  ], [2200, 1800, 0.7, 0.9]),
  route('mock-b', 2, { en: 'Riverside greenery', pl: 'Zieleń nad Wisłą' }, { en: 'Mock: down to the Vistula boulevards, the greenest stretch.', pl: 'Makieta: w dół na bulwary wiślane, najbardziej zielony odcinek.' }, [
    START,
    place('chopin', { en: 'Chopin Museum', pl: 'Muzeum Fryderyka Chopina' }, 21.0236, 52.2365, 'museum'),
    place('copernicus', { en: 'Copernicus Science Centre', pl: 'Centrum Nauki Kopernik' }, 21.0286, 52.2419, 'museum'),
    place('vistula', { en: 'Vistula Boulevards', pl: 'Bulwary Wiślane' }, 21.0225, 52.2465, 'park'),
  ], [1900, 1560, 0.9, 0.6]),
  route('mock-c', 3, { en: 'Short Saxon Garden hop', pl: 'Krótki skok do Ogrodu Saskiego' }, { en: 'Mock: the shortest walk, but along busier streets.', pl: 'Makieta: najkrótszy spacer, ale ruchliwszymi ulicami.' }, [
    START,
    place('zacheta', { en: 'Zachęta Gallery', pl: 'Zachęta – Narodowa Galeria Sztuki' }, 21.0117, 52.239, 'museum'),
    place('saxon-garden', { en: 'Saxon Garden', pl: 'Ogród Saski' }, 21.0085, 52.24, 'park'),
  ], [1300, 1080, 0.5, 0.3]),
];

/** Resolves like POST /api/routes after a short delay, so the loading state is visible too. */
export function mockRoutes(signal?: AbortSignal): Promise<RouteResponse> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => resolve({
      contract_version: CONTRACT_VERSION,
      mode: 'mock',
      notice: localise({ en: 'MOCK DATA for the route switch demo: made-up scores and straight lines, not walking directions.', pl: 'DANE TESTOWE do demo przełączania tras: zmyślone oceny i linie proste, a nie wskazówki dojścia.' }, getLang()),
      generated_at: new Date().toISOString(),
      preferences: { interests: ['museums'], travel_mode: 'walk', max_duration_s: 3600, priorities: { quiet: 0.7, green: 0.7 }, interpreted_by: 'fixture' },
      routes: routes(),
      sources: [{ id: SOURCE_ID, name: localise({ en: 'Mock route switch demo', pl: 'Testowe demo przełączania tras' }, getLang()), mode: 'simulated', attribution: localise({ en: 'Made-up demo data', pl: 'Zmyślone dane demo' }, getLang()) }],
      applied_itinerary: null,
    }), 600);
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}
