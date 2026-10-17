/** "+1 h 21 min" from seconds; null stays unknown. */
export function formatDuration(seconds: number | null | undefined, prefix = ''): string {
  if (seconds == null) return 'unknown';
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const text = hours === 0 ? `${minutes} min` : rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, '0')} min`;
  return prefix + text;
}

/** "3.7 km" or "850 m"; null stays unknown. */
export function formatDistance(metres: number | null | undefined): string {
  if (metres == null) return 'unknown';
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres)} m`;
}
