/**
 * Car-free example outings (public/transit-examples.json, built by
 * scripts/build_transit_examples.py): public transport only, with a grocery stop on the way,
 * computed once from today's ZTM timetable. They are examples, not a live journey planner;
 * the response says so in its mode, notice and sources.
 */
import { asset } from '../demo/mode';
import { getLang } from '../i18n/language';
import { CONTRACT_VERSION, type Route } from './contract';
import type { TrackResponse } from './tracks';

export type LegMode = 'walk' | 'bus' | 'tram' | 'metro' | 'rail' | 'shop';

export interface Leg {
  mode: LegMode;
  from?: string;
  to?: string;
  /** Transit legs */
  line?: string;
  headsign?: string;
  depart?: string;
  arrive?: string;
  stops?: number;
  /** Walk and shop legs */
  minutes?: number;
  metres?: number;
  straight?: boolean;
  name?: string;
  kind?: string;
  opening_hours?: string | null;
  point?: [number, number];
  path?: [number, number][];
}

interface Example {
  id: string;
  track_id: string;
  destination: { name: string; point: [number, number] };
  depart: string;
  arrive: string;
  duration_s: number;
  legs: Leg[];
}

interface ExampleFile { service_date: string; start: string; note: string; examples: Example[] }

/** Track id the mood pill uses for these outings. */
export const TRANSIT_EXAMPLE_TRACK = 'transit-groceries';
export const isTransitExample = (trackId: string | undefined) => !!trackId?.startsWith(TRANSIT_EXAMPLE_TRACK);

let file: Promise<ExampleFile | null> | undefined;
const load = () => (file ??= fetch(asset('transit-examples.json')).then(r => (r.ok ? (r.json() as Promise<ExampleFile>) : null)).catch(() => null));

/** The visible text in the current language; the English note comes from the file itself. */
function text(data: ExampleFile, depart: string) {
  const en = {
    note: data.note,
    notice: `${data.note} Timetable ${data.service_date}, leaving at ${depart}.`,
    groceries: 'Groceries',
    timetable: 'ZTM Warszawa timetable (GTFS by Mikołaj Kuranowski)',
    timetableAttribution: 'Zarząd Transportu Miejskiego w Warszawie; GTFS by Mikołaj Kuranowski',
    method: `Example itinerary computed once from the ${data.service_date} timetable for a ${data.start} start; walking legs drawn straight.`,
    shops: 'OpenStreetMap shops',
    places: 'OpenStreetMap places',
    osm: '© OpenStreetMap contributors (ODbL)',
  };
  if (getLang() === 'en') return en;
  const note = 'Przykładowe trasy wyliczone jednorazowo z rozkładu jazdy na potrzeby demo; to nie jest planer podróży na żywo. Odcinki piesze narysowano jako linie proste.';
  return {
    note,
    notice: `${note} Rozkład z ${data.service_date}, odjazd o ${depart}.`,
    groceries: 'Sklep spożywczy',
    timetable: 'Rozkład jazdy ZTM Warszawa (GTFS: Mikołaj Kuranowski)',
    timetableAttribution: 'Zarząd Transportu Miejskiego w Warszawie; GTFS: Mikołaj Kuranowski',
    method: `Przykładowa trasa wyliczona jednorazowo z rozkładu na ${data.service_date}, start o ${data.start}; odcinki piesze narysowano w linii prostej.`,
    shops: 'Sklepy z OpenStreetMap',
    places: 'Miejsca z OpenStreetMap',
    osm: '© współtwórcy OpenStreetMap (ODbL)',
  };
}

const metres = (a: [number, number], b: [number, number]) =>
  Math.hypot((a[0] - b[0]) * 111_320 * Math.cos((52.22 * Math.PI) / 180), (a[1] - b[1]) * 110_540);

/**
 * The example for `trackId`'s destination, or the one whose destination is nearest to `near`
 * (the current outing's end), as a normal routes response plus `legs`.
 */
export async function transitExample(trackId: string | undefined, near: [number, number] | undefined): Promise<TrackResponse | null> {
  const data = await load();
  if (!data?.examples.length) return null;
  const example = data.examples.find(e => e.track_id === trackId)
    ?? [...data.examples].sort((a, b) => (near ? metres(a.destination.point, near) - metres(b.destination.point, near) : 0))[0];
  const coordinates: [number, number][] = [];
  for (const leg of example.legs) {
    for (const point of leg.path ?? []) {
      const last = coordinates[coordinates.length - 1];
      if (!last || last[0] !== point[0] || last[1] !== point[1]) coordinates.push(point);
    }
  }
  const length = coordinates.slice(1).reduce((sum, point, i) => sum + metres(coordinates[i], point), 0);
  const shop = example.legs.find(leg => leg.mode === 'shop');
  const local = text(data, example.depart);
  const places = [
    ...(shop?.point ? [{ id: `${example.id}:shop`, name: shop.name ?? local.groceries, longitude: shop.point[0], latitude: shop.point[1], category: 'generic' as const, opening_hours: shop.opening_hours ?? null, source_id: 'osm-shops' }] : []),
    { id: `${example.id}:end`, name: example.destination.name, longitude: example.destination.point[0], latitude: example.destination.point[1], category: 'museum' as const, opening_hours: null, source_id: 'osm-places' },
  ];
  const route: Route = {
    id: example.id,
    name: example.destination.name,
    rank: 1,
    recommended: true,
    travel_mode: 'walk',
    explanation: local.note,
    geometry: { type: 'LineString', coordinates },
    geometry_kind: 'street',
    metrics: {
      distance_m: { value: Math.round(length), source_id: 'transit-example' },
      duration_s: { value: example.duration_s, source_id: 'transit-example' },
      green_score: { value: null, source_id: 'transit-example' },
      quiet_score: { value: null, source_id: 'transit-example' },
    },
    stops: places.map((place, index) => ({ order: index + 1, place_id: place.id })),
    places,
  };
  return {
    contract_version: CONTRACT_VERSION,
    mode: 'cached',
    notice: local.notice,
    generated_at: new Date().toISOString(),
    preferences: { interests: ['groceries'], travel_mode: 'walk', max_duration_s: null, priorities: { quiet: 0, green: 0 }, interpreted_by: 'fixture' },
    routes: [route],
    sources: [
      { id: 'transit-example', name: local.timetable, mode: 'real', attribution: local.timetableAttribution, url: 'https://mkuran.pl/gtfs/', method: local.method },
      { id: 'osm-shops', name: local.shops, mode: 'real', attribution: local.osm, url: 'https://www.openstreetmap.org/copyright' },
      { id: 'osm-places', name: local.places, mode: 'real', attribution: local.osm, url: 'https://www.openstreetmap.org/copyright' },
    ],
    applied_itinerary: null,
    track: { id: example.id, title: example.destination.name, summary: local.note, travel_mode: 'walk', simulated: true, picked_by: 'user', reason: '' },
    legs: example.legs,
    depart: example.depart,
    arrive: example.arrive,
  };
}
