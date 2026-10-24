import type { TrackResponse } from '../api/tracks';
import { TRANSIT_EXAMPLE_TRACK } from '../api/transitExamples';
import { formatDistance, formatDuration } from '../components/places/format';

/** What a scenario step may do to the app: the same actions a visitor has, nothing else. */
export interface ScenarioApi {
  /** Back to the opening view, forgetting any trip. */
  home(): Promise<void>;
  ask(prompt: string): void;
  chooseTrack(trackId: string): void;
  /** Select the route with this rank-order index (0 = recommended). */
  selectRoute(index: number): void;
  /** Open the place card of the first or last stop, or close it. */
  showStop(which: 'first' | 'last' | null): void;
  setDetails(open: boolean): void;
  setSources(open: boolean): void;
  setAmenities(toilets: boolean, aed: boolean): void;
  setMock(tab: 'modes' | 'milestones' | null): void;
  result(): TrackResponse | null;
  selectedRouteIndex(): number;
  /** Resolves when the visible answer is replaced by one that meets `ready` (or after a timeout). */
  waitForAnswer(ready: (answer: TrackResponse) => boolean): Promise<void>;
}

export interface ScenarioStep {
  run?: (api: ScenarioApi) => void | Promise<void>;
  /** How long the caption stays before the next step, in ms. */
  dwell: number;
}

export interface Scenario {
  id: string;
  /** Built features run on bundled data; mock-ups only illustrate roadmap ideas from the pitch. */
  mockup: boolean;
  steps: ScenarioStep[];
}

const CALM_PROMPT = 'Somewhere calm and green, with a museum';
const askCalm = async (api: ScenarioApi) => {
  await api.home();
  api.ask(CALM_PROMPT);
  await api.waitForAnswer(answer => answer.routes.length > 0);
};

export const SCENARIOS: Scenario[] = [
  {
    id: 'calm-outing',
    mockup: false,
    steps: [
      { run: askCalm, dwell: 4200 },
      { run: api => { api.selectRoute(0); api.setDetails(false); }, dwell: 5200 },
      { run: api => api.selectRoute(1), dwell: 4800 },
      { run: api => { api.selectRoute(0); api.showStop('first'); }, dwell: 5600 },
      { run: api => api.showStop('last'), dwell: 5200 },
    ],
  },
  {
    id: 'open-data',
    mockup: false,
    steps: [
      { run: askCalm, dwell: 3200 },
      { run: api => { api.selectRoute(0); api.showStop(null); api.setDetails(true); }, dwell: 7500 },
      { run: api => api.setSources(true), dwell: 5200 },
      { run: api => { api.setSources(false); api.setAmenities(true, true); }, dwell: 5600 },
      { dwell: 6200 },
      {
        run: async api => {
          api.setAmenities(false, false);
          api.chooseTrack('short-direct-hour');
          await api.waitForAnswer(answer => answer.track?.id === 'short-direct-hour');
          api.setDetails(true);
        },
        dwell: 7800,
      },
    ],
  },
  {
    id: 'car-free',
    mockup: false,
    steps: [
      { run: askCalm, dwell: 3200 },
      {
        run: async api => {
          api.chooseTrack(TRANSIT_EXAMPLE_TRACK);
          await api.waitForAnswer(answer => !!answer.legs);
        },
        dwell: 5600,
      },
      { dwell: 7000 },
      { run: api => api.setSources(true), dwell: 5200 },
    ],
  },
  {
    id: 'roadmap',
    mockup: true,
    steps: [
      { run: async api => { await api.home(); api.setMock('modes'); }, dwell: 8000 },
      { run: api => api.setMock('milestones'), dwell: 8000 },
      { run: api => api.setMock(null), dwell: 4000 },
    ],
  },
];

/** Values a caption may mention, read from what is on screen right now. */
export function captionVars(answer: TrackResponse | null, routeIndex: number): Record<string, string | number> {
  const route = answer ? [...answer.routes].sort((a, b) => a.rank - b.rank)[routeIndex] : undefined;
  const stops = route ? [...route.stops].sort((a, b) => a.order - b.order) : [];
  const nameOf = (id: string | undefined) => route?.places.find(place => place.id === id)?.name ?? '';
  const percent = (value: number | null | undefined) => (value == null ? '–' : `${Math.round(value * 100)}%`);
  return {
    first: nameOf(stops[0]?.place_id),
    last: nameOf(stops[stops.length - 1]?.place_id),
    dur: route ? formatDuration(route.metrics.duration_s.value) : '',
    dist: route ? formatDistance(route.metrics.distance_m.value) : '',
    green: percent(route?.metrics.green_score.value),
    quiet: percent(route?.metrics.quiet_score.value),
  };
}
