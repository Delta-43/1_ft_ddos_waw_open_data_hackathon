import type { Localised } from '../i18n/localised';

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
  /** Short text on the flag itself: the place or what it is, never the deal (that is in the card). */
  short: Localised;
  title: Localised;
  place: Localised;
  detail: Localised;
  when: Localised;
  longitude: number;
  latitude: number;
  /** real: from a real source; mock: invented for the demo. */
  mode: 'real' | 'mock';
  source: Localised;
}

const FICTIONAL = { en: 'Invented for the demo: fictional business and offer', pl: 'Wymyślone na potrzeby demo: fikcyjna firma i oferta' };
const SIM_02 = { en: 'SIM-02 fictional event, demo only', pl: 'Fikcyjne wydarzenie SIM-02, tylko demo' };

export const CITY_FLAGS: CityFlag[] = [
  {
    id: 'waw:event/6', kind: 'event', short: 'Teatr Dramatyczny',
    title: { en: 'Evening performance', pl: 'Spektakl wieczorny' },
    place: { en: 'Teatr Dramatyczny, Palace of Culture', pl: 'Teatr Dramatyczny, Pałac Kultury' },
    detail: { en: 'Listed in the city’s events calendar (category: culture).', pl: 'W miejskim kalendarzu wydarzeń (kategoria: kultura).' },
    when: { en: '5 Dec 2026, 19:00–21:00', pl: '5 gru 2026, 19:00–21:00' },
    longitude: 21.006775, latitude: 52.231915, mode: 'real',
    source: { en: 'Urząd m.st. Warszawy events calendar (CC BY)', pl: 'Kalendarz wydarzeń Urzędu m.st. Warszawy (CC BY)' },
  },
  {
    id: 'sim:event/0', kind: 'event', short: { en: 'Sculpture walk', pl: 'Spacer z rzeźbami' },
    title: { en: 'Pop-up sculpture walk', pl: 'Plenerowy spacer z rzeźbami' },
    place: { en: 'Ujazdów park edge (fictional listing)', pl: 'Skraj Parku Ujazdowskiego (fikcyjne wydarzenie)' },
    detail: { en: 'A guided evening walk past temporary sculptures.', pl: 'Wieczorny spacer z przewodnikiem wśród tymczasowych rzeźb.' },
    when: { en: '19 Oct, 17:00–19:00', pl: '19 paź, 17:00–19:00' },
    longitude: 21.03, latitude: 52.219, mode: 'mock', source: SIM_02,
  },
  {
    id: 'sim:event/1', kind: 'event', short: { en: 'Courtyard concert', pl: 'Koncert na dziedzińcu' },
    title: { en: 'Evening courtyard concert', pl: 'Wieczorny koncert na dziedzińcu' },
    place: { en: 'A courtyard off Ujazdowskie (fictional listing)', pl: 'Dziedziniec przy Alejach Ujazdowskich (fikcyjne wydarzenie)' },
    detail: { en: 'Strings and candles in a quiet courtyard.', pl: 'Smyczki i świece na cichym dziedzińcu.' },
    when: { en: '20 Oct, 19:30–21:00', pl: '20 paź, 19:30–21:00' },
    longitude: 21.0245, latitude: 52.2225, mode: 'mock', source: SIM_02,
  },
  {
    id: 'demo:offer/coffee', kind: 'offer', short: 'Kawiarnia Pod Lipą',
    title: { en: '20% off any oat flat white', pl: '20% zniżki na każde flat white na owsianym' }, place: 'Kawiarnia Pod Lipą',
    detail: { en: 'Show this card at the counter. Today until 14:00.', pl: 'Pokaż tę kartę przy kasie. Dziś do 14:00.' },
    when: { en: 'Today, until 14:00', pl: 'Dziś, do 14:00' },
    longitude: 21.01628, latitude: 52.22371, mode: 'mock', source: FICTIONAL,
  },
  {
    id: 'demo:offer/lunch', kind: 'offer', short: 'Bar Pierogowy',
    title: { en: 'Two plates of pierogi for the price of one', pl: 'Dwa talerze pierogów w cenie jednego' }, place: 'Bar Pierogowy Jazdów',
    detail: { en: 'Lunch menu, eat in or take away.', pl: 'Menu lunchowe, na miejscu lub na wynos.' },
    when: { en: 'Today, 12:00–15:00', pl: 'Dziś, 12:00–15:00' },
    longitude: 21.01742, latitude: 52.22241, mode: 'mock', source: FICTIONAL,
  },
  {
    id: 'demo:tickets/concert', kind: 'tickets', short: { en: 'Chamber concert', pl: 'Koncert kameralny' },
    title: { en: 'Sunday chamber concert, 18:00', pl: 'Niedzielny koncert kameralny, 18:00' }, place: 'Sala Kameralna Ujazdów',
    detail: { en: 'From 40 zł. Last 12 seats, pay at the door.', pl: 'Od 40 zł. Ostatnie 12 miejsc, płatność przy wejściu.' },
    when: { en: 'Today, 18:00', pl: 'Dziś, 18:00' },
    longitude: 21.02427, latitude: 52.22051, mode: 'mock', source: FICTIONAL,
  },
  {
    id: 'demo:offer/lemonade', kind: 'offer', short: 'Ogródek nad Stawem',
    title: { en: 'Buy two lemonades, the third is free', pl: 'Kup dwie lemoniady, trzecia gratis' }, place: 'Ogródek nad Stawem',
    detail: { en: 'Garden café by the pond.', pl: 'Kawiarnia w ogródku nad stawem.' },
    when: { en: 'Today, all day', pl: 'Dziś, cały dzień' },
    longitude: 21.02696, latitude: 52.2191, mode: 'mock', source: FICTIONAL,
  },
  {
    id: 'demo:tickets/night', kind: 'tickets', short: 'Galeria Nocna',
    title: { en: 'Late opening pass', pl: 'Bilet na wieczorne otwarcie' }, place: 'Galeria Nocna',
    detail: { en: '25 zł. Entry after 18:00 with a free audio guide.', pl: '25 zł. Wejście po 18:00, audioprzewodnik gratis.' },
    when: { en: 'Today, 18:00–22:00', pl: 'Dziś, 18:00–22:00' },
    longitude: 21.02025, latitude: 52.2227, mode: 'mock', source: FICTIONAL,
  },
  {
    id: 'demo:offer/bike', kind: 'offer', short: 'Rowerownia Agrykola',
    title: { en: 'Free five-minute bike check', pl: 'Darmowy pięciominutowy przegląd roweru' }, place: 'Rowerownia Agrykola',
    detail: { en: 'Tyres, brakes and chain, no booking.', pl: 'Opony, hamulce i łańcuch, bez rezerwacji.' },
    when: { en: 'Today, 10:00–16:00', pl: 'Dziś, 10:00–16:00' },
    longitude: 21.03182, latitude: 52.21965, mode: 'mock', source: FICTIONAL,
  },
  {
    id: 'demo:offer/records', kind: 'offer', short: 'Płytoteka pod Arkadami',
    title: { en: '15% off second-hand records', pl: '15% zniżki na używane płyty' }, place: 'Płytoteka pod Arkadami',
    detail: { en: 'Jazz and Polish classics.', pl: 'Jazz i polska klasyka.' },
    when: { en: 'This weekend', pl: 'W ten weekend' },
    longitude: 21.02583, latitude: 52.21925, mode: 'mock', source: FICTIONAL,
  },
  {
    id: 'demo:tickets/garden', kind: 'tickets', short: { en: 'Greenhouse tour', pl: 'Zwiedzanie szklarni' },
    title: { en: 'Guided greenhouse tour', pl: 'Zwiedzanie szklarni z przewodnikiem' }, place: 'Szklarnia Pokazowa',
    detail: { en: '15 zł. Every hour from 11:00, 40 minutes.', pl: '15 zł. Co godzinę od 11:00, 40 minut.' },
    when: { en: 'Today, 11:00–17:00', pl: 'Dziś, 11:00–17:00' },
    longitude: 21.02244, latitude: 52.22131, mode: 'mock', source: FICTIONAL,
  },
  {
    id: 'demo:offer/museum-cafe', kind: 'offer', short: 'Herbaciarnia przy Parku',
    title: { en: 'Cake and tea set, 18 zł', pl: 'Zestaw ciasto i herbata, 18 zł' }, place: 'Herbaciarnia przy Parku',
    detail: { en: 'Seasonal plum cake.', pl: 'Sezonowe ciasto ze śliwkami.' },
    when: { en: 'Today, from 12:00', pl: 'Dziś, od 12:00' },
    longitude: 21.03783, latitude: 52.21731, mode: 'mock', source: FICTIONAL,
  },
];

export type ReportKind = 'missing' | 'issue';

export interface CityReport {
  id: string;
  kind: ReportKind;
  text: Localised;
  place: Localised;
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
    id: 'ex:1', kind: 'missing',
    text: { en: 'No bench for about 600 m. Hard going for older walkers.', pl: 'Brak ławki na odcinku około 600 m. Ciężko dla starszych pieszych.' },
    place: { en: 'Aleje Ujazdowskie, by the park railings', pl: 'Aleje Ujazdowskie, przy ogrodzeniu parku' }, longitude: 21.0236, latitude: 52.2213,
    reported_at: '2026-10-16T09:12:00+02:00', agree: 14, origin: 'example',
  },
  {
    id: 'ex:2', kind: 'issue',
    text: { en: 'Drinking fountain out of order since last week.', pl: 'Poidełko nie działa od zeszłego tygodnia.' },
    place: { en: 'Park Ujazdowski, main path', pl: 'Park Ujazdowski, główna alejka' }, longitude: 21.0247, latitude: 52.2197,
    reported_at: '2026-10-15T17:40:00+02:00', agree: 9, origin: 'example',
  },
  {
    id: 'ex:3', kind: 'issue',
    text: { en: 'Pedestrian green light is too short to cross with a pram.', pl: 'Zielone światło dla pieszych jest za krótkie, żeby przejść z wózkiem.' },
    place: { en: 'Plac na Rozdrożu crossing', pl: 'Przejście dla pieszych na Placu na Rozdrożu' }, longitude: 21.0219, latitude: 52.2196,
    reported_at: '2026-10-17T08:05:00+02:00', agree: 22, origin: 'example',
  },
  {
    id: 'ex:4', kind: 'missing',
    text: { en: 'No public toilet near the north gate; the nearest is a long walk.', pl: 'Brak publicznej toalety przy północnej bramie; do najbliższej jest daleko.' },
    place: { en: 'Łazienki, north gate', pl: 'Łazienki, brama północna' }, longitude: 21.0322, latitude: 52.2178,
    reported_at: '2026-10-14T13:30:00+02:00', agree: 31, origin: 'example',
  },
  {
    id: 'ex:5', kind: 'issue',
    text: { en: 'Uneven paving stones, easy to trip after dark.', pl: 'Nierówne płyty chodnikowe, po zmroku łatwo się potknąć.' },
    place: { en: 'Agrykola footpath', pl: 'Ścieżka wzdłuż Agrykoli' }, longitude: 21.0301, latitude: 52.2163,
    reported_at: '2026-10-17T19:55:00+02:00', agree: 6, origin: 'example',
  },
  {
    id: 'ex:6', kind: 'missing',
    text: { en: 'Bike racks always full on weekends.', pl: 'W weekendy stojaki rowerowe są zawsze pełne.' },
    place: 'Plac Trzech Krzyży', longitude: 21.0230, latitude: 52.2289,
    reported_at: '2026-10-12T11:20:00+02:00', agree: 11, origin: 'example',
  },
];
