// MOCK interpreter: returns a FIXED set of preferences whatever the prompt says. It is NOT an AI model.
// It stands in for the AI agent (AI-01, owned by Delta) so the frontend flow can be built now.
// When the real endpoint exists, replace the body of interpretPreferences() and keep the Preference shape.

export type Preference = { emoji: string; name: string };

export type Interpretation = {
  source: 'mock';
  preferences: Preference[];
};

const MOCK_PREFERENCES: Preference[] = [
  { emoji: '🏛️', name: 'Museum' },
  { emoji: '🤫', name: 'Quiet streets' },
  { emoji: '🌳', name: 'Green route' },
  { emoji: '🚶', name: 'Walking' },
  { emoji: '⏱️', name: 'Short trip' },
  { emoji: '☕', name: 'Café stop' },
];

export function interpretPreferences(_prompt: string): Interpretation {
  return { source: 'mock', preferences: MOCK_PREFERENCES };
}
