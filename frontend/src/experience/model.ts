import type { Place, Preferences } from "../api/contract";
export const MOODS = [
  {
    id: "calm",
    label: "Quiet & green",
    icon: "leaf",
    description: "Room to breathe",
    quiet: 0.9,
    green: 0.9,
  },
  {
    id: "culture",
    label: "Culture",
    icon: "landmark",
    description: "A little discovery",
    quiet: 0.5,
    green: 0.5,
  },
  {
    id: "discover",
    label: "Explore",
    icon: "compass",
    description: "Take the scenic way",
    quiet: 0.4,
    green: 0.7,
  },
  {
    id: "active",
    label: "Active",
    icon: "bike",
    description: "Keep moving",
    quiet: 0.3,
    green: 0.6,
  },
] as const;
export type Mood = (typeof MOODS)[number]["id"];
export interface Draft {
  query: string;
  comment: string;
  destination: string;
  stops: string[];
  travel: "walk" | "bike";
  minutes: number;
  mood: Mood;
}
export const INITIAL_DRAFT: Draft = {
  query: "",
  comment: "",
  destination: "",
  stops: [],
  travel: "walk",
  minutes: 180,
  mood: "calm",
};
export function requestFor(draft: Draft, places: Place[], structured: boolean) {
  const mood = MOODS.find((m) => m.id === draft.mood)!;
  const query = [
    draft.query.trim() || "Plan a museum outing in central Warsaw.",
    draft.comment.trim() && `Additional preferences: ${draft.comment.trim()}`,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 1000);
  const preferences: Preferences = {
    travel_mode: draft.travel,
    max_duration_s: draft.minutes * 60,
    priorities: { quiet: mood.quiet, green: mood.green },
    interests: ["museums"],
  };
  const known = new Set(places.map((p) => p.id));
  if (draft.destination && !known.has(draft.destination))
    throw new Error("Choose a destination from the catalogue.");
  return {
    query,
    preferences,
    ...(structured && draft.destination
      ? {
          destination_place_id: draft.destination,
          via_place_ids: draft.stops,
          comment: draft.comment.trim(),
        }
      : {}),
  };
}
export function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function safeWrite(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
