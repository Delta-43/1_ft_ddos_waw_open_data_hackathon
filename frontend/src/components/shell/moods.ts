/**
 * Moods the visitor can switch between. Each one runs a predefined demo track
 * (data/fixtures/simulated-tracks.json) through the real planner, so the route is a street route
 * and only the choice of places is predefined. `accent` colours the pill and the route glow.
 */
import { TRANSIT_EXAMPLE_TRACK, isTransitExample } from '../../api/transitExamples';
import type { Key } from '../../i18n/translations';

export interface Mood {
  id: string;
  label: Key;
  trackId: string;
  accent: string;
  /** Short line under the label, for the tooltip and screen readers. */
  hint: Key;
}

export const MOODS: Mood[] = [
  { id: 'calmer', label: 'moodCalmer', trackId: 'calm-park-museum', accent: '#7fd8c4', hint: 'moodCalmerHint' },
  { id: 'faster', label: 'moodFaster', trackId: 'short-direct-hour', accent: '#ffb35c', hint: 'moodFasterHint' },
  { id: 'relaxing', label: 'moodRelaxing', trackId: 'botanical-sky', accent: '#a6d98a', hint: 'moodRelaxingHint' },
  { id: 'curious', label: 'moodCurious', trackId: 'history-memory', accent: '#e8c27a', hint: 'moodCuriousHint' },
  { id: 'artsy', label: 'moodArtsy', trackId: 'art-gallery-stroll', accent: '#c7a6ff', hint: 'moodArtsyHint' },
  { id: 'bike', label: 'moodBike', trackId: 'bike-green-loop', accent: '#7fc2ff', hint: 'moodBikeHint' },
  // Not a planner track: a car-free example from the timetable (api/transitExamples.ts).
  { id: 'transit', label: 'moodTransit', trackId: TRANSIT_EXAMPLE_TRACK, accent: '#ff9a76', hint: 'moodTransitHint' },
];

export const moodForTrack = (trackId: string | undefined) =>
  MOODS.find(mood => mood.trackId === trackId || (mood.trackId === TRANSIT_EXAMPLE_TRACK && isTransitExample(trackId)));

/**
 * One-tap starting prompts. The label follows the interface language; the query sent to the
 * backend stays English, which the keyword fallback understands when the model is unavailable.
 */
export const SUGGESTIONS: { label: Key; query: string }[] = [
  { label: 'shellSuggestCalm', query: 'Somewhere calm and green, with a museum' },
  { label: 'shellSuggestQuick', query: 'Something quick, under an hour' },
  { label: 'shellSuggestArt', query: 'Art and a little park' },
  { label: 'shellSuggestBike', query: 'A bike ride through the parks' },
];
