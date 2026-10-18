/**
 * Notes pinned to the city near the demo routes.
 *
 * Flags: events, shop offers and tickets. One is a real listing from Warsaw open data; two are
 * the team's fictional SIM-02 events (data/fixtures/simulated-events-profile-charging.json); the
 * offers and tickets are invented for the demo, at invented businesses, so no real shop or venue
 * is advertised or impersonated. Every item says which it is.
 *
 * Reports: example feedback about missing services and problems, invented for the demo. Reports
 * a visitor adds stay in their own browser (see components/shell/Reports.tsx).
 */
export type FlagKind = 'event' | 'offer' | 'tickets';

export interface CityFlag {
  id: string;
  kind: FlagKind;
  /** Short text on the flag itself. */
  short: string;
  title: string;
  place: string;
  detail: string;
  when: string;
  longitude: number;
  latitude: number;
  /** real: from a real source; mock: invented for the demo. */
  mode: 'real' | 'mock';
  source: string;
}

const FICTIONAL = 'Invented for the demo: fictional business and offer';

export const CITY_FLAGS: CityFlag[] = [
  {
    id: 'waw:event/6', kind: 'event', short: 'Teatr Dramatyczny',
    title: 'Evening performance', place: 'Teatr Dramatyczny, Palace of Culture',
    detail: 'Listed in the city’s events calendar (category: culture).', when: '5 Dec 2026, 19:00–21:00',
    longitude: 21.006775, latitude: 52.231915, mode: 'real',
    source: 'Urząd m.st. Warszawy events calendar (CC BY)',
  },
  {
    id: 'sim:event/0', kind: 'event', short: 'Sculpture walk',
    title: 'Pop-up sculpture walk', place: 'Ujazdów park edge (fictional listing)',
    detail: 'A guided evening walk past temporary sculptures.', when: '19 Oct, 17:00–19:00',
    longitude: 21.03, latitude: 52.219, mode: 'mock', source: 'SIM-02 fictional event, demo only',
  },
  {
    id: 'sim:event/1', kind: 'event', short: 'Courtyard concert',
    title: 'Evening courtyard concert', place: 'A courtyard off Ujazdowskie (fictional listing)',
    detail: 'Strings and candles in a quiet courtyard.', when: '20 Oct, 19:30–21:00',
    longitude: 21.0245, latitude: 52.2225, mode: 'mock', source: 'SIM-02 fictional event, demo only',
  },
  {
    id: 'demo:offer/coffee', kind: 'offer', short: '−20% oat flat white',
    title: '20% off any oat flat white', place: 'Kawiarnia Pod Lipą',
    detail: 'Show this card at the counter. Today until 14:00.', when: 'Today, until 14:00',
    longitude: 21.01628, latitude: 52.22371, mode: 'mock', source: FICTIONAL,
  },
  {
    id: 'demo:offer/lunch', kind: 'offer', short: '2-for-1 pierogi',
    title: 'Two plates of pierogi for the price of one', place: 'Bar Pierogowy Jazdów',
    detail: 'Lunch menu, eat in or take away.', when: 'Today, 12:00–15:00',
    longitude: 21.01742, latitude: 52.22241, mode: 'mock', source: FICTIONAL,
  },
  {
    id: 'demo:tickets/concert', kind: 'tickets', short: 'Concert · from 40 zł',
    title: 'Sunday chamber concert, 18:00', place: 'Sala Kameralna Ujazdów',
    detail: 'Last 12 seats. Pay at the door.', when: 'Today, 18:00',
    longitude: 21.02427, latitude: 52.22051, mode: 'mock', source: FICTIONAL,
  },
  {
    id: 'demo:offer/lemonade', kind: 'offer', short: 'Lemonade 2+1',
    title: 'Buy two lemonades, the third is free', place: 'Ogródek nad Stawem',
    detail: 'Garden café by the pond.', when: 'Today, all day',
    longitude: 21.02696, latitude: 52.2191, mode: 'mock', source: FICTIONAL,
  },
  {
    id: 'demo:tickets/night', kind: 'tickets', short: 'Night pass · 25 zł',
    title: 'Late opening pass', place: 'Galeria Nocna',
    detail: 'Entry after 18:00 with a free audio guide.', when: 'Today, 18:00–22:00',
    longitude: 21.02025, latitude: 52.2227, mode: 'mock', source: FICTIONAL,
  },
  {
    id: 'demo:offer/bike', kind: 'offer', short: 'Free bike check',
    title: 'Free five-minute bike check', place: 'Rowerownia Agrykola',
    detail: 'Tyres, brakes and chain, no booking.', when: 'Today, 10:00–16:00',
    longitude: 21.03182, latitude: 52.21965, mode: 'mock', source: FICTIONAL,
  },
  {
    id: 'demo:offer/records', kind: 'offer', short: '−15% records',
    title: '15% off second-hand records', place: 'Płytoteka pod Arkadami',
    detail: 'Jazz and Polish classics.', when: 'This weekend',
    longitude: 21.02583, latitude: 52.21925, mode: 'mock', source: FICTIONAL,
  },
  {
    id: 'demo:tickets/garden', kind: 'tickets', short: 'Garden tour · 15 zł',
    title: 'Guided greenhouse tour', place: 'Szklarnia Pokazowa',
    detail: 'Every hour from 11:00, 40 minutes.', when: 'Today, 11:00–17:00',
    longitude: 21.02244, latitude: 52.22131, mode: 'mock', source: FICTIONAL,
  },
  {
    id: 'demo:offer/museum-cafe', kind: 'offer', short: 'Cake + tea 18 zł',
    title: 'Cake and tea set', place: 'Herbaciarnia przy Parku',
    detail: 'Seasonal plum cake.', when: 'Today, from 12:00',
    longitude: 21.03783, latitude: 52.21731, mode: 'mock', source: FICTIONAL,
  },
];

export type ReportKind = 'missing' | 'issue';

export interface CityReport {
  id: string;
  kind: ReportKind;
  text: string;
  place: string;
  longitude: number;
  latitude: number;
  /** ISO date with offset. */
  reported_at: string;
  /** How many others said "me too". */
  agree: number;
  /** example: invented for the demo; mine: added in this browser. */
  origin: 'example' | 'mine';
}

export const EXAMPLE_REPORTS: CityReport[] = [
  {
    id: 'ex:1', kind: 'missing', text: 'No bench for about 600 m. Hard going for older walkers.',
    place: 'Aleje Ujazdowskie, by the park railings', longitude: 21.0236, latitude: 52.2213,
    reported_at: '2026-10-16T09:12:00+02:00', agree: 14, origin: 'example',
  },
  {
    id: 'ex:2', kind: 'issue', text: 'Drinking fountain out of order since last week.',
    place: 'Park Ujazdowski, main path', longitude: 21.0247, latitude: 52.2197,
    reported_at: '2026-10-15T17:40:00+02:00', agree: 9, origin: 'example',
  },
  {
    id: 'ex:3', kind: 'issue', text: 'Pedestrian green light is too short to cross with a pram.',
    place: 'Plac na Rozdrożu crossing', longitude: 21.0219, latitude: 52.2196,
    reported_at: '2026-10-17T08:05:00+02:00', agree: 22, origin: 'example',
  },
  {
    id: 'ex:4', kind: 'missing', text: 'No public toilet near the north gate; the nearest is a long walk.',
    place: 'Łazienki, north gate', longitude: 21.0322, latitude: 52.2178,
    reported_at: '2026-10-14T13:30:00+02:00', agree: 31, origin: 'example',
  },
  {
    id: 'ex:5', kind: 'issue', text: 'Uneven paving stones, easy to trip after dark.',
    place: 'Agrykola footpath', longitude: 21.0301, latitude: 52.2163,
    reported_at: '2026-10-17T19:55:00+02:00', agree: 6, origin: 'example',
  },
  {
    id: 'ex:6', kind: 'missing', text: 'Bike racks always full on weekends.',
    place: 'Plac Trzech Krzyży', longitude: 21.0230, latitude: 52.2289,
    reported_at: '2026-10-12T11:20:00+02:00', agree: 11, origin: 'example',
  },
];
