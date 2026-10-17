/** Response-level data mode from contracts/route.schema.json. */
export type DataMode = 'mock' | 'live' | 'cached';

/** Moon support colours: krillin (warning), cell, roshi (success). The text differs too, not only the hue. */
const MODE_TONE: Record<DataMode, string> = {
  mock: 'bg-krillin-10 text-krillin',
  cached: 'bg-cell-10 text-cell',
  live: 'bg-roshi-10 text-roshi',
};

const MODE_LABELS: Record<DataMode, { text: string; description: string }> = {
  mock: { text: 'Mock data', description: 'Demo fixture, not a real observation or route.' },
  cached: { text: 'Cached', description: 'Fetched earlier and stored; may be out of date.' },
  live: { text: 'Live response', description: 'Fetched for this request; individual inputs may still be estimated.' },
};

/**
 * Styled like Moon's Tag, but a <span>: Moon's Tag renders a <div>, which is invalid inside the <p> callers use.
 * Visible text label (not colour alone) so the mode is clear in screenshots and to screen readers. */
export function DataModeBadge({ mode }: { mode: DataMode }) {
  const { text, description } = MODE_LABELS[mode];
  return (
    <span
      className={`inline-flex w-fit items-center px-2 py-0.5 rounded-moon-i-xs text-moon-9-caption uppercase font-medium whitespace-nowrap ${MODE_TONE[mode]}`}
      title={description}
    >
      {text}
    </span>
  );
}
