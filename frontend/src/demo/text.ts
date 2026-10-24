import type { Lang } from '../i18n/language';

/** Wording of the static demo's own chrome (banner, scenarios, search, about). English first, Polish alongside. */
export interface ScenarioText {
  title: string;
  blurb: string;
  steps: { title: string; body: string }[];
}

type Bundle = {
  banner: string;
  bannerLong: string;
  scenarios: string;
  search: string;
  about: string;
  close: string;
  pickerTitle: string;
  pickerHint: string;
  play: string;
  pause: string;
  next: string;
  replay: string;
  stop: string;
  stepOf: string; // {n} {total}
  scenarioOf: string; // {n} {total}
  finished: string;
  mockTag: string;
  realTag: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchEmpty: string;
  searchCount: string; // {n}
  searchHint: string;
  scenario: ScenarioText[];
  mock: {
    title: string;
    note: string;
    modesTab: string;
    milestonesTab: string;
    accessibility: string;
    accessibilityBody: string;
    cool: string;
    coolBody: string;
    roadmap: string;
    milestonesIntro: string;
    milestones: { name: string; done: number; of: number; unit: string }[];
    milestonesNote: string;
    closeLabel: string;
  };
  aboutDialog: {
    title: string;
    intro: string;
    team: string;
    teamNote: string;
    people: { name: string; role: string }[];
    data: string;
    dataRows: { name: string; licence: string; used: string }[];
    privacy: string;
    privacyBody: string;
    repo: string;
  };
};

const en: Bundle = {
  banner: 'Demo data',
  bannerLong: 'Static snapshot: no backend, no live data',
  scenarios: 'Scenarios',
  search: 'Search places',
  about: 'About and credits',
  close: 'Close',
  pickerTitle: 'Guided scenarios',
  pickerHint: 'Four short, replayable walk-throughs of the pitch. Everything runs from files bundled with this page.',
  play: 'Play',
  pause: 'Pause',
  next: 'Next step',
  replay: 'Replay',
  stop: 'Stop scenario',
  stepOf: 'Step {n} of {total}',
  scenarioOf: 'Scenario {n} of {total}',
  finished: 'Finished. Replay it, pick another scenario, or explore the map yourself.',
  mockTag: 'Mock-up',
  realTag: 'Built',
  searchLabel: 'Search the demo places',
  searchPlaceholder: 'Museum, park, palace…',
  searchEmpty: 'No place matches. Try “park” or “museum”.',
  searchCount: '{n} places in the demo list',
  searchHint: 'Places come from the bundled OpenStreetMap sample (75 named places around Łazienki and Ujazdów).',
  scenario: [
    {
      title: 'A calm museum outing',
      blurb: 'Ask in your own words, compare two routes, open a place card.',
      steps: [
        { title: 'You ask', body: 'The visitor types: “Somewhere calm and green, with a museum.” Nothing leaves your browser; this page matches the words to one of six predefined outings, like the backend’s keyword fallback.' },
        { title: 'Route A, recommended', body: '{first}, then {last}: {dur} on foot, {dist}. The green and quiet figures are estimates from OpenStreetMap, not measurements.' },
        { title: 'Route B, the alternative', body: 'The second route takes {dur} and {dist}. Switch between the routes in the panel to compare them on the map.' },
        { title: 'A card for every stop', body: 'Each stop opens a place card: category, opening hours (or “unknown”), website and a label saying where the data comes from.' },
        { title: 'The destination', body: '{last} is the end of the walk. Try the other moods in the panel, or search for any place in the list.' },
      ],
    },
    {
      title: 'Which open data shaped it',
      blurb: 'Scores, sources, nearby services, and how a different priority changes the answer.',
      steps: [
        { title: 'Start from the calm outing', body: 'The same calm outing as before. What is behind the recommendation?' },
        { title: 'Where the scores come from', body: 'Routes come from OSRM on OpenStreetMap streets. “Green” is the share of the route in or beside an OpenStreetMap park (now {green}). “Quiet” is distance from major roads (now {quiet}). Both are proxies, not measured greenery or noise.' },
        { title: 'Sources, licences, dates', body: 'Every number names its source, mode (real, proxy, cached, simulated) and fetch date. The Sources drawer lists them all.' },
        { title: 'Services along the way', body: 'Public toilets and defibrillators within 300 m of the route, from an OpenStreetMap snapshot of 18 October 2026. Switch them on or off under “Nearby”.' },
        { title: 'Flags on the map', body: 'The small flags near the route are events and offers. One is a real listing from the Warsaw open data portal (CC BY); the others are invented for the demo, and their cards say so.' },
        { title: 'Change the priority, change the answer', body: 'With “Faster” the planner drops the park detours: {dur} and {dist}, green {green}, quiet {quiet} (estimates). Same data, different weights.' },
      ],
    },
    {
      title: 'Car-free, with groceries',
      blurb: 'A real timetable example: walk, ride, shop, ride, walk.',
      steps: [
        { title: 'Start from the calm outing', body: 'The destination is the same {last}. Now without a car.' },
        { title: 'Bus + groceries', body: 'The “Bus + groceries” mood plans walk, bus or tram, a grocery stop and the way on, each leg with its time.' },
        { title: 'From a real timetable', body: 'Times come from the ZTM Warsaw timetable for 18 October 2026. It is one example journey computed in advance, not a live journey planner; walking legs are drawn as straight lines.' },
        { title: 'Sources', body: 'Timetable: ZTM Warszawa, GTFS by Mikołaj Kuranowski. Shops and places: OpenStreetMap (ODbL).' },
      ],
    },
    {
      title: 'Roadmap: modes and milestones',
      blurb: 'Mock-ups only. Ideas from the pitch that are not built.',
      steps: [
        { title: 'Mock-up: accessibility and cool routes', body: 'The pitch lists these as roadmap: step-free paths and rest points, and shade and fountains for hot days. Nothing is computed here, and no dataset is wired in.' },
        { title: 'Mock-up: milestones', body: 'A stretch idea from IDEA.md: achievements for walking and visiting. The numbers are fictional, and by design progress would stay on your own device.' },
        { title: 'Back to what is built', body: 'Everything else in this demo runs on bundled data. Pick another scenario, or search the places.' },
      ],
    },
  ],
  mock: {
    title: 'Roadmap mock-up',
    note: 'Mock-up: not built. Nothing here is computed or stored.',
    modesTab: 'Modes',
    milestonesTab: 'Milestones',
    accessibility: 'Accessibility mode',
    accessibilityBody: 'Step-free paths, rest points at set intervals, toilets on the way.',
    cool: 'Cool route',
    coolBody: 'Favour shade, fountains and drinking water on hot days. Waits for a verified Warsaw tree and fountain dataset.',
    roadmap: 'Roadmap',
    milestonesIntro: 'Fictional progress for a fictional visitor.',
    milestones: [
      { name: 'First 10 km on foot', done: 6.2, of: 10, unit: 'km' },
      { name: 'Five museums', done: 3, of: 5, unit: '' },
      { name: 'Quiet-route regular', done: 4, of: 7, unit: '' },
    ],
    milestonesNote: 'In the planned design, achievements stay in the browser; the server keeps no profiles.',
    closeLabel: 'Close mock-up',
  },
  aboutDialog: {
    title: 'About this demo',
    intro: 'Find YOUR way, project “Warsaw 2076”: a calm, guided way through Warsaw built on open data. Made in 24 hours for the Warsaw Open Data Hackathon 2026 (Challenge 1: Warsaw 2076); it placed first in its track and second overall.',
    team: 'Team',
    teamNote: 'Roles as listed in the repository (AGENTS.md).',
    people: [
      { name: 'Delta (@Delta-43)', role: 'backend, integration, pitch' },
      { name: 'Sonia (@zoey-so)', role: 'backend, data imports and provenance' },
      { name: 'Alban (@kaveOO)', role: 'frontend, map, presentation design' },
      { name: 'Ola (@unicorn-alex)', role: 'frontend, preferences and states' },
      { name: 'Aryna (@Rysia)', role: 'frontend, place cards and data labels' },
    ],
    data: 'Open data and licences',
    dataRows: [
      { name: 'OpenStreetMap contributors', licence: 'ODbL', used: 'places, parks, shops, buildings, map' },
      { name: 'Urząd m.st. Warszawy, dane.um.warszawa.pl', licence: 'CC BY', used: 'toilets, defibrillators, events (cached sample)' },
      { name: 'ZTM Warszawa timetable, GTFS by Mikołaj Kuranowski', licence: 'terms set by the feed publisher', used: 'car-free example, buses and trams' },
      { name: 'OSRM by FOSSGIS (routing.openstreetmap.de)', licence: 'ODbL data', used: 'street routes (computed once)' },
      { name: 'OpenFreeMap / OpenMapTiles', licence: 'OpenMapTiles schema, OSM data', used: 'bundled basemap tiles for central Warsaw' },
      { name: 'Wikipedia summaries', licence: 'CC BY-SA 4.0', used: 'short texts on historic buildings' },
      { name: 'Noto Sans, Barlow Condensed, Titillium Web, Biryani', licence: 'SIL OFL 1.1', used: 'map labels and interface' },
    ],
    privacy: 'Privacy',
    privacyBody: 'This demo stores no user data. It has no backend, makes no calls to other sites, and keeps nothing on your device: not your searches, your language choice, or the city reports you may write (they vanish on reload).',
    repo: 'Source code on GitHub',
  },
};

const pl: Bundle = {
  banner: 'Dane demo',
  bannerLong: 'Statyczna migawka: bez serwera i danych na żywo',
  scenarios: 'Scenariusze',
  search: 'Szukaj miejsc',
  about: 'O projekcie i źródła',
  close: 'Zamknij',
  pickerTitle: 'Scenariusze z przewodnikiem',
  pickerHint: 'Cztery krótkie scenariusze z prezentacji, do powtórzenia. Wszystko działa z plików dołączonych do tej strony.',
  play: 'Odtwórz',
  pause: 'Wstrzymaj',
  next: 'Następny krok',
  replay: 'Jeszcze raz',
  stop: 'Zakończ scenariusz',
  stepOf: 'Krok {n} z {total}',
  scenarioOf: 'Scenariusz {n} z {total}',
  finished: 'Koniec. Odtwórz jeszcze raz, wybierz inny scenariusz albo poeksploruj mapę sam.',
  mockTag: 'Makieta',
  realTag: 'Działa',
  searchLabel: 'Szukaj w miejscach demo',
  searchPlaceholder: 'Muzeum, park, pałac…',
  searchEmpty: 'Brak wyników. Spróbuj „park” lub „muzeum”.',
  searchCount: 'Miejsc na liście demo: {n}',
  searchHint: 'Miejsca pochodzą z dołączonej próbki OpenStreetMap (75 nazwanych miejsc wokół Łazienek i Ujazdowa).',
  scenario: [
    {
      title: 'Spokojna wycieczka do muzeum',
      blurb: 'Napisz własnymi słowami, porównaj dwie trasy, otwórz kartę miejsca.',
      steps: [
        { title: 'Pytasz', body: 'Odwiedzający pisze: „Gdzieś spokojnie i zielono, z muzeum.” Nic nie opuszcza przeglądarki; ta strona dopasowuje słowa do jednej z sześciu gotowych tras, jak zapasowe dopasowanie słów kluczowych na serwerze.' },
        { title: 'Trasa A, polecana', body: '{first}, potem {last}: {dur} pieszo, {dist}. Wskaźniki zieleni i ciszy to szacunki z OpenStreetMap, nie pomiary.' },
        { title: 'Trasa B, alternatywa', body: 'Druga trasa to {dur} i {dist}. Przełączaj trasy w panelu, żeby porównać je na mapie.' },
        { title: 'Karta każdego przystanku', body: 'Każdy przystanek otwiera kartę miejsca: kategoria, godziny otwarcia (albo „nieznane”), strona i etykieta, skąd pochodzą dane.' },
        { title: 'Cel', body: '{last} kończy spacer. Wypróbuj inne nastroje w panelu albo wyszukaj dowolne miejsce z listy.' },
      ],
    },
    {
      title: 'Jakie otwarte dane to ukształtowały',
      blurb: 'Wskaźniki, źródła, usługi w pobliżu i jak inny priorytet zmienia odpowiedź.',
      steps: [
        { title: 'Zacznij od spokojnej trasy', body: 'Ta sama spokojna trasa. Co stoi za rekomendacją?' },
        { title: 'Skąd się biorą wskaźniki', body: 'Trasy pochodzą z OSRM na ulicach z OpenStreetMap. „Zieleń” to część trasy w parku z OpenStreetMap lub obok niego (teraz {green}). „Cisza” to odległość od głównych dróg (teraz {quiet}). Oba to przybliżenia, nie pomiar zieleni ani hałasu.' },
        { title: 'Źródła, licencje, daty', body: 'Każda liczba ma źródło, tryb (rzeczywiste, przybliżone, z pamięci podręcznej, symulowane) i datę pobrania. Wszystko wypisuje szuflada Źródła.' },
        { title: 'Usługi po drodze', body: 'Toalety publiczne i defibrylatory w promieniu 300 m od trasy, z migawki OpenStreetMap z 18 października 2026. Włączysz je w sekcji „W pobliżu”.' },
        { title: 'Flagi na mapie', body: 'Małe flagi przy trasie to wydarzenia i oferty. Jedna to prawdziwy wpis z portalu otwartych danych Warszawy (CC BY); pozostałe wymyślono na potrzeby demo i ich karty to mówią.' },
        { title: 'Zmień priorytet, zmieni się odpowiedź', body: 'Przy „Szybciej” planer pomija objazdy przez parki: {dur} i {dist}, zieleń {green}, cisza {quiet} (szacunki). Te same dane, inne wagi.' },
      ],
    },
    {
      title: 'Bez samochodu, z zakupami',
      blurb: 'Prawdziwy przykład z rozkładu jazdy: spacer, przejazd, zakupy, przejazd, spacer.',
      steps: [
        { title: 'Zacznij od spokojnej trasy', body: 'Cel ten sam: {last}. Teraz bez samochodu.' },
        { title: 'Autobus + zakupy', body: 'Nastrój „Autobus + zakupy” planuje spacer, autobus lub tramwaj, przystanek na zakupy i dalszą drogę, każdy odcinek z godziną.' },
        { title: 'Z prawdziwego rozkładu', body: 'Godziny pochodzą z rozkładu ZTM Warszawa z 18 października 2026. To jeden przykładowy przejazd policzony wcześniej, nie planer na żywo; odcinki piesze są prostymi liniami.' },
        { title: 'Źródła', body: 'Rozkład: ZTM Warszawa, GTFS: Mikołaj Kuranowski. Sklepy i miejsca: OpenStreetMap (ODbL).' },
      ],
    },
    {
      title: 'Plan rozwoju: tryby i osiągnięcia',
      blurb: 'Tylko makiety. Pomysły z prezentacji, które nie są zbudowane.',
      steps: [
        { title: 'Makieta: dostępność i chłodne trasy', body: 'Prezentacja wymienia je jako plan: trasy bez schodów i miejsca odpoczynku oraz cień i fontanny na upały. Nic tu nie jest liczone i nie ma podłączonego zbioru danych.' },
        { title: 'Makieta: osiągnięcia', body: 'Pomysł dodatkowy z IDEA.md: odznaki za spacery i odwiedziny. Liczby są zmyślone, a postęp zostałby z założenia na Twoim urządzeniu.' },
        { title: 'Wracamy do tego, co działa', body: 'Reszta demo działa na dołączonych danych. Wybierz inny scenariusz albo poszukaj miejsc.' },
      ],
    },
  ],
  mock: {
    title: 'Makieta planu rozwoju',
    note: 'Makieta: nie jest zbudowana. Nic tu nie jest liczone ani zapisywane.',
    modesTab: 'Tryby',
    milestonesTab: 'Osiągnięcia',
    accessibility: 'Tryb dostępności',
    accessibilityBody: 'Ścieżki bez schodów, miejsca odpoczynku co ustalony odcinek, toalety po drodze.',
    cool: 'Chłodna trasa',
    coolBody: 'Cień, fontanny i woda pitna w upał. Czeka na sprawdzony zbiór danych o drzewach i fontannach Warszawy.',
    roadmap: 'Plan',
    milestonesIntro: 'Zmyślony postęp zmyślonego odwiedzającego.',
    milestones: [
      { name: 'Pierwsze 10 km pieszo', done: 6.2, of: 10, unit: 'km' },
      { name: 'Pięć muzeów', done: 3, of: 5, unit: '' },
      { name: 'Stały bywalec cichych tras', done: 4, of: 7, unit: '' },
    ],
    milestonesNote: 'W planowanym projekcie osiągnięcia zostają w przeglądarce; serwer nie trzyma profili.',
    closeLabel: 'Zamknij makietę',
  },
  aboutDialog: {
    title: 'O tym demo',
    intro: 'Find YOUR way, projekt „Warsaw 2076”: spokojny, prowadzony spacer po Warszawie oparty na otwartych danych. Zbudowany w 24 godziny na Warsaw Open Data Hackathon 2026 (wyzwanie 1: Warsaw 2076); zajął pierwsze miejsce w swojej ścieżce i drugie w klasyfikacji ogólnej.',
    team: 'Zespół',
    teamNote: 'Role według repozytorium (AGENTS.md).',
    people: [
      { name: 'Delta (@Delta-43)', role: 'backend, integracja, prezentacja' },
      { name: 'Sonia (@zoey-so)', role: 'backend, import danych i pochodzenie danych' },
      { name: 'Alban (@kaveOO)', role: 'frontend, mapa, projekt prezentacji' },
      { name: 'Ola (@unicorn-alex)', role: 'frontend, preferencje i stany' },
      { name: 'Aryna (@Rysia)', role: 'frontend, karty miejsc i etykiety danych' },
    ],
    data: 'Otwarte dane i licencje',
    dataRows: [
      { name: 'Współtwórcy OpenStreetMap', licence: 'ODbL', used: 'miejsca, parki, sklepy, budynki, mapa' },
      { name: 'Urząd m.st. Warszawy, dane.um.warszawa.pl', licence: 'CC BY', used: 'toalety, defibrylatory, wydarzenia (próbka z pamięci podręcznej)' },
      { name: 'Rozkład ZTM Warszawa, GTFS: Mikołaj Kuranowski', licence: 'warunki wg wydawcy feedu', used: 'przykład bez samochodu, autobusy i tramwaje' },
      { name: 'OSRM (FOSSGIS, routing.openstreetmap.de)', licence: 'dane ODbL', used: 'trasy uliczne (policzone raz)' },
      { name: 'OpenFreeMap / OpenMapTiles', licence: 'schemat OpenMapTiles, dane OSM', used: 'dołączone kafelki mapy centrum Warszawy' },
      { name: 'Streszczenia z Wikipedii', licence: 'CC BY-SA 4.0', used: 'krótkie opisy zabytków' },
      { name: 'Noto Sans, Barlow Condensed, Titillium Web, Biryani', licence: 'SIL OFL 1.1', used: 'etykiety mapy i interfejs' },
    ],
    privacy: 'Prywatność',
    privacyBody: 'To demo nie przechowuje danych użytkownika. Nie ma serwera, nie łączy się z innymi stronami i niczego nie zapisuje na Twoim urządzeniu: ani wyszukiwań, ani wyboru języka, ani zgłoszeń do miasta, które możesz napisać (znikają po odświeżeniu).',
    repo: 'Kod źródłowy na GitHubie',
  },
};

export const demoText = (lang: Lang): Bundle => (lang === 'pl' ? pl : en);
export type DemoText = Bundle;

export const fill = (text: string, vars: Record<string, string | number>): string =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
