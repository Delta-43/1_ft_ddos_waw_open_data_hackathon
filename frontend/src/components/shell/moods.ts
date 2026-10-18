/**
 * Moods the visitor can switch between. Each one runs a predefined demo track
 * (data/fixtures/simulated-tracks.json) through the real planner, so the route is a street route
 * and only the choice of places is predefined. `accent` colours the pill and the route glow.
 */
export interface Mood {
  id: string;
  label: string;
  trackId: string;
  accent: string;
  /** Short line under the label, for the tooltip and screen readers. */
  hint: string;
}

export const MOODS: Mood[] = [
  { id: 'calmer', label: 'Calmer', trackId: 'calm-park-museum', accent: '#7fd8c4', hint: 'Quiet parks, then a small museum' },
  { id: 'faster', label: 'Faster', trackId: 'short-direct-hour', accent: '#ffb35c', hint: 'No detours, about an hour' },
  { id: 'relaxing', label: 'Relaxing', trackId: 'botanical-sky', accent: '#a6d98a', hint: 'A garden walk to the observatory' },
  { id: 'curious', label: 'Curious', trackId: 'history-memory', accent: '#e8c27a', hint: 'A walk through 20th-century history' },
  { id: 'artsy', label: 'Artsy', trackId: 'art-gallery-stroll', accent: '#c7a6ff', hint: 'A gallery and contemporary art' },
  { id: 'bike', label: 'By bike', trackId: 'bike-green-loop', accent: '#7fc2ff', hint: 'Through the parks by bike' },
];

export const moodForTrack = (trackId: string | undefined) => MOODS.find(mood => mood.trackId === trackId);

/** One-tap starting prompts on the opening bubble. */
export const SUGGESTIONS = [
  'Somewhere calm and green, with a museum',
  'Something quick, under an hour',
  'Art and a little park',
  'A bike ride through the parks',
];
