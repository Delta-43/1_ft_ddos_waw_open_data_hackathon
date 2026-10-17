// MOCK interpreter: simple keyword matching, NOT an AI model.
// It stands in for the AI agent (AI-01, owned by Delta) so the frontend flow can be built now.
// When the real endpoint exists, replace the body of interpretPreferences() and keep the Preference shape.

export type Preference = { label: string; value: string };

export type Interpretation = {
  source: 'mock';
  preferences: Preference[];
};

const has = (text: string, words: string[]) => words.some(word => text.includes(word));

export function interpretPreferences(prompt: string): Interpretation {
  const text = prompt.toLowerCase();
  const preferences: Preference[] = [];

  if (has(text, ['museum', 'gallery', 'exhibition'])) preferences.push({ label: 'Destination', value: 'Museum' });
  if (has(text, ['quiet', 'calm', 'peaceful', 'silent'])) preferences.push({ label: 'Atmosphere', value: 'Quiet, away from noise' });
  if (has(text, ['green', 'park', 'nature', 'tree'])) preferences.push({ label: 'Surroundings', value: 'Green, via parks and trees' });
  if (has(text, ['short', 'quick', 'brief'])) preferences.push({ label: 'Length', value: 'Short' });
  preferences.push({ label: 'Travel mode', value: has(text, ['bike', 'cycle', 'cycling']) ? 'Cycling' : 'Walking' });

  return { source: 'mock', preferences };
}
