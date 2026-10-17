import './provenance.css';

/** Response-level data mode from contracts/route.schema.json. */
export type DataMode = 'mock' | 'live' | 'cached';

const MODE_LABELS: Record<DataMode, { text: string; description: string }> = {
  mock: { text: 'Mock data', description: 'Demo fixture, not a real observation or route.' },
  cached: { text: 'Cached', description: 'Fetched earlier and stored; may be out of date.' },
  live: { text: 'Live response', description: 'Fetched for this request; individual inputs may still be estimated.' },
};

/** Visible text label (not colour alone) so the mode is clear in screenshots and to screen readers. */
export function DataModeBadge({ mode }: { mode: DataMode }) {
  const { text, description } = MODE_LABELS[mode];
  return (
    <span className={`data-mode-badge data-mode-badge--${mode}`} title={description}>
      {text}
    </span>
  );
}
