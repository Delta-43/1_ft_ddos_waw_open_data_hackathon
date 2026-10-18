import type { Lang } from './language';

/**
 * Frontend-authored UI chrome only: labels, headings, buttons, hints, error messages.
 * Content that comes from the backend (route names/explanations, response notices,
 * source attributions/methods, place names/addresses/opening hours) is NOT translated
 * here - it's generated server-side in English, and translating it would need backend
 * i18n support, not a frontend dictionary. See contracts/README.md for what the backend
 * returns as free text.
 */
const en = {
  appTitle: 'Warsaw 2076',
  sources: 'Sources',
  hideSources: 'Hide sources',

  interpretedFixture: 'demo fixture',
  interpretedRules: 'keyword rules',
  interpretedModel: 'AI model',
  preferencesAriaLabel: 'Preferences',
  preferencesTitle: 'Preferences (understood by {by})',
  yourPreferences: 'Your preferences',
  walk: 'Walk',
  bike: 'Bike',
  switchWalkBike: 'Switch between walking and cycling',
  quiet: 'Quiet',
  green: 'Green',
  noTimeLimit: 'No time limit',
  hoursLimit: '≤ {hours} h',

  categoryMuseum: 'Museum',
  categoryLandmark: 'Landmark',
  categoryPark: 'Park',
  categoryGeneric: 'Place',
  categoryAir: 'Air quality station',
  categoryAed: 'Defibrillator (AED)',
  categoryToilet: 'Public toilet',
  categoryEvent: 'Cultural event',
  stopAriaLabel: 'Stop {order}',
  arrive: 'Arrive',
  visit: 'Visit',
  openingHours: 'Opening hours',
  unknown: 'Unknown',
  address: 'Address',
  website: 'Website',
  showOnMap: 'Show on map',

  stopsOnRoute: 'Stops on {name}',
  stops: 'Stops',
  noStopsYet: 'This route has no stops yet.',

  outingAssistantAriaLabel: 'Outing assistant',
  closeAssistant: 'Close assistant',
  conversationAriaLabel: 'Conversation',
  lookingForRoutes: 'Looking for routes…',
  bubbleCta: "What's up for today?",
  openAssistant: 'Open assistant',

  promptLabel: 'What are we exploring today?',
  promptPlaceholder: 'Change your mind? Tell me more…',
  charactersHint: '{count}/{max} characters',
  emptyError: 'Please describe your outing first.',
  findRoutes: 'Find routes',
  findingRoutes: 'Finding routes…',

  chooseRouteAriaLabel: 'Choose a route',
  traitQuietest: 'Quietest',
  traitGreenest: 'Greenest',
  traitShortest: 'Shortest',
  traitBalanced: 'Balanced',
  routeLetterPrefix: 'Route {letter}: ',
  chosen: 'Chosen',
  choose: 'Choose',

  modeMockText: 'Mock data',
  modeMockDesc: 'Demo fixture, not a real observation or route.',
  modeCachedText: 'Cached',
  modeCachedDesc: 'Fetched earlier and stored; may be out of date.',
  modeLiveText: 'Live response',
  modeLiveDesc: 'Fetched for this request; individual inputs may still be estimated.',

  dataFrom: 'Data from',

  sourceReal: 'Real',
  sourceHistorical: 'Historical',
  sourceProxy: 'Proxy',
  sourceSimulated: 'Simulated',
  sourceUnknownLabel: 'Source unknown',
  modeMeaningReal: 'Fetched from a real source.',
  modeMeaningHistorical: 'Real data, but from the past, not current.',
  modeMeaningProxy: 'An estimate calculated from other data, not a measurement.',
  modeMeaningSimulated: 'Invented for the demo.',
  fetchedOn: 'Fetched {date}.',

  dataSourcesAriaLabel: 'Data sources',
  whereFromHeading: 'Where does this data come from?',
  fetchedShort: 'Fetched {date}',
  madeForDemo: 'Made for the demo',
  fetchTimeNotRecorded: 'Fetch time not recorded',
  dataFromDate: ' · data from {date}',
  howOftenHeading: 'How often is it updated?',
  howOftenText: 'Each source shows when it was fetched. Saved snapshots are not updated automatically.',
  howToCiteHeading: 'How to cite it?',

  resultsAriaLabel: 'Results',
  tabRoutes: 'Routes',
  tabStops: 'Stops',

  routeComparisonAriaLabel: 'Route comparison',
  routesHeadingOne: '1 route · ranked',
  routesHeadingMany: '{count} routes · ranked',
  distanceLabel: 'Distance',
  timeLabel: 'Time',
  recommended: 'Recommended',
  illustrativeNote: 'Illustrative straight lines — not walking directions',
  streetRouteNote: 'Street route from a routing service',
  explainedByAI: " · explanation written by AI from this route's data",

  errorInvalidRequest: 'That request was not valid. Describe your outing in 1–1000 characters.',
  errorServer: 'The server returned an error ({code}). Please try again.',
  errorUnreachable: 'Could not reach the route service. Try again.',
  noRoutesMatch: 'No routes match. Try a longer time or fewer stops.',
  recommendedRoute: 'Recommended route',
  recommendedRoutes: 'Recommended routes',

  unknownDuration: 'unknown',
  unknownDistance: 'unknown',
  hoursShort: 'h',
  minutesShort: 'min',

  hintDescribe: 'Describe your outing to see routes',
  hintLocationOff: 'Showing central Warsaw · location off',
  privacyLine: "We don't store your requests or location.",

  resetView: 'Reset view',
  showHistoricalOverlay: 'Show historical map overlay',
  toggleHistoricalOverlay: 'Toggle historical map overlay',
  overlayUnavailable: ' — unavailable right now',
  youAreHere: 'You are here',

  languageToggleAriaLabel: 'Switch language',

  layerAirQuality: 'Air quality stations',
  layerAed: 'Defibrillators (AED)',
  layerToilets: 'Public toilets',
  layerEvents: 'Cultural events',
  layerPlaces: 'Places',

  pinModeReal: 'Real data, fetched at event time',
  pinModeCached: 'Cached open data',
  pinModeMock: 'Mock data',
  pinModeSimulated: 'Simulated data',
  pinModeOther: '{mode} data',
  pinModeSampleSuffix: ' · sample subset',
  unknownSourceText: 'Unknown source',

  rowReading: 'Reading',
  rowAirQualityIndex: 'Air quality index',
  rowReadings: 'Readings',
  rowAccess: 'Access',
  rowHours: 'Hours',
  rowDistrict: 'District',
  rowCategory: 'Category',
  rowStarts: 'Starts',
  rowEnds: 'Ends',
  rowSource: 'Source',
  rowRetrieved: 'Retrieved',
  rowAbout: 'About',

  readingLastUpdated: 'Last updated {time}',
  readingLive: 'Live reading, updated {time}',
  readingCachedAt: 'Cached reading, last updated {time}',
  readingCachedUnknown: 'Cached reading, update time unknown',
} as const;

const pl: Record<keyof typeof en, string> = {
  appTitle: 'Warsaw 2076',
  sources: 'Źródła',
  hideSources: 'Ukryj źródła',

  interpretedFixture: 'fikcyjne dane demo',
  interpretedRules: 'reguły słów kluczowych',
  interpretedModel: 'model AI',
  preferencesAriaLabel: 'Preferencje',
  preferencesTitle: 'Preferencje (rozpoznane przez {by})',
  yourPreferences: 'Twoje preferencje',
  walk: 'Pieszo',
  bike: 'Rowerem',
  switchWalkBike: 'Przełącz między pieszo i rowerem',
  quiet: 'Cisza',
  green: 'Zieleń',
  noTimeLimit: 'Bez limitu czasu',
  hoursLimit: '≤ {hours} godz.',

  categoryMuseum: 'Muzeum',
  categoryLandmark: 'Zabytek',
  categoryPark: 'Park',
  categoryGeneric: 'Miejsce',
  categoryAir: 'Stacja jakości powietrza',
  categoryAed: 'Defibrylator (AED)',
  categoryToilet: 'Toaleta publiczna',
  categoryEvent: 'Wydarzenie kulturalne',
  stopAriaLabel: 'Przystanek {order}',
  arrive: 'Przyjazd',
  visit: 'Zwiedzanie',
  openingHours: 'Godziny otwarcia',
  unknown: 'Nieznane',
  address: 'Adres',
  website: 'Strona',
  showOnMap: 'Pokaż na mapie',

  stopsOnRoute: 'Przystanki na trasie {name}',
  stops: 'Przystanki',
  noStopsYet: 'Ta trasa nie ma jeszcze przystanków.',

  outingAssistantAriaLabel: 'Asystent wycieczki',
  closeAssistant: 'Zamknij asystenta',
  conversationAriaLabel: 'Rozmowa',
  lookingForRoutes: 'Szukam tras…',
  bubbleCta: 'Co robimy dzisiaj?',
  openAssistant: 'Otwórz asystenta',

  promptLabel: 'Co dziś zwiedzamy?',
  promptPlaceholder: 'Zmieniasz zdanie? Powiedz więcej…',
  charactersHint: '{count}/{max} znaków',
  emptyError: 'Najpierw opisz swoją wycieczkę.',
  findRoutes: 'Znajdź trasy',
  findingRoutes: 'Szukam tras…',

  chooseRouteAriaLabel: 'Wybierz trasę',
  traitQuietest: 'Najcichsza',
  traitGreenest: 'Najzieleńsza',
  traitShortest: 'Najkrótsza',
  traitBalanced: 'Zrównoważona',
  routeLetterPrefix: 'Trasa {letter}: ',
  chosen: 'Wybrana',
  choose: 'Wybierz',

  modeMockText: 'Dane demonstracyjne',
  modeMockDesc: 'Dane przykładowe, nie prawdziwa obserwacja ani trasa.',
  modeCachedText: 'Z pamięci podręcznej',
  modeCachedDesc: 'Pobrane wcześniej i zapisane; mogą być nieaktualne.',
  modeLiveText: 'Odpowiedź na żywo',
  modeLiveDesc: 'Pobrane dla tego zapytania; poszczególne dane mogą być szacunkowe.',

  dataFrom: 'Dane z',

  sourceReal: 'Rzeczywiste',
  sourceHistorical: 'Historyczne',
  sourceProxy: 'Szacunkowe',
  sourceSimulated: 'Symulowane',
  sourceUnknownLabel: 'Źródło nieznane',
  modeMeaningReal: 'Pobrane z rzeczywistego źródła.',
  modeMeaningHistorical: 'Prawdziwe dane, ale z przeszłości, nie aktualne.',
  modeMeaningProxy: 'Szacunek wyliczony z innych danych, nie pomiar.',
  modeMeaningSimulated: 'Wymyślone na potrzeby demo.',
  fetchedOn: 'Pobrane {date}.',

  dataSourcesAriaLabel: 'Źródła danych',
  whereFromHeading: 'Skąd pochodzą te dane?',
  fetchedShort: 'Pobrane {date}',
  madeForDemo: 'Stworzone na potrzeby demo',
  fetchTimeNotRecorded: 'Czas pobrania nie zapisany',
  dataFromDate: ' · dane z {date}',
  howOftenHeading: 'Jak często są aktualizowane?',
  howOftenText: 'Każde źródło pokazuje, kiedy zostało pobrane. Zapisane zrzuty nie są automatycznie aktualizowane.',
  howToCiteHeading: 'Jak je cytować?',

  resultsAriaLabel: 'Wyniki',
  tabRoutes: 'Trasy',
  tabStops: 'Przystanki',

  routeComparisonAriaLabel: 'Porównanie tras',
  routesHeadingOne: '1 trasa · w rankingu',
  routesHeadingMany: '{count} trasy · w rankingu',
  distanceLabel: 'Odległość',
  timeLabel: 'Czas',
  recommended: 'Polecana',
  illustrativeNote: 'Linie orientacyjne — nie są wskazówkami pieszymi',
  streetRouteNote: 'Trasa uliczna z serwisu trasowania',
  explainedByAI: ' · opis napisany przez AI na podstawie danych tej trasy',

  errorInvalidRequest: 'To zapytanie było niepoprawne. Opisz swoją wycieczkę w 1–1000 znakach.',
  errorServer: 'Serwer zwrócił błąd ({code}). Spróbuj ponownie.',
  errorUnreachable: 'Nie udało się połączyć z serwisem trasowania. Spróbuj ponownie.',
  noRoutesMatch: 'Brak pasujących tras. Spróbuj dłuższego czasu lub mniej przystanków.',
  recommendedRoute: 'Polecana trasa',
  recommendedRoutes: 'Polecane trasy',

  unknownDuration: 'nieznany',
  unknownDistance: 'nieznana',
  hoursShort: 'godz.',
  minutesShort: 'min',

  hintDescribe: 'Opisz swoją wycieczkę, aby zobaczyć trasy',
  hintLocationOff: 'Pokazuję centrum Warszawy · lokalizacja wyłączona',
  privacyLine: 'Nie zapisujemy Twoich zapytań ani lokalizacji.',

  resetView: 'Resetuj widok',
  showHistoricalOverlay: 'Pokaż historyczną nakładkę mapy',
  toggleHistoricalOverlay: 'Przełącz historyczną nakładkę mapy',
  overlayUnavailable: ' — niedostępne teraz',
  youAreHere: 'Tu jesteś',

  languageToggleAriaLabel: 'Zmień język',

  layerAirQuality: 'Stacje jakości powietrza',
  layerAed: 'Defibrylatory (AED)',
  layerToilets: 'Toalety publiczne',
  layerEvents: 'Wydarzenia kulturalne',
  layerPlaces: 'Miejsca',

  pinModeReal: 'Dane rzeczywiste, pobrane podczas wydarzenia',
  pinModeCached: 'Zapisane dane otwarte',
  pinModeMock: 'Dane demonstracyjne',
  pinModeSimulated: 'Dane symulowane',
  pinModeOther: 'Dane: {mode}',
  pinModeSampleSuffix: ' · próbka danych',
  unknownSourceText: 'Nieznane źródło',

  rowReading: 'Odczyt',
  rowAirQualityIndex: 'Indeks jakości powietrza',
  rowReadings: 'Pomiary',
  rowAccess: 'Dostęp',
  rowHours: 'Godziny',
  rowDistrict: 'Dzielnica',
  rowCategory: 'Kategoria',
  rowStarts: 'Początek',
  rowEnds: 'Koniec',
  rowSource: 'Źródło',
  rowRetrieved: 'Pobrano',
  rowAbout: 'Opis',

  readingLastUpdated: 'Ostatnia aktualizacja {time}',
  readingLive: 'Odczyt na żywo, zaktualizowano {time}',
  readingCachedAt: 'Zapisany odczyt, ostatnia aktualizacja {time}',
  readingCachedUnknown: 'Zapisany odczyt, czas aktualizacji nieznany',
};

const DICTS: Record<Lang, Record<keyof typeof en, string>> = { en, pl };

export type Key = keyof typeof en;

/** Pure lookup, usable outside React (map controls). Prefer `useT()` inside components. */
export function translate(lang: Lang, key: Key, vars?: Record<string, string | number>): string {
  let text: string = DICTS[lang][key] ?? DICTS.en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}
