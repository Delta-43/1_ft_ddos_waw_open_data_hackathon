import { useT } from '../../i18n/useT';
import type { Key } from '../../i18n/translations';
import './provenance.css';

/** Response-level data mode from contracts/route.schema.json. */
export type DataMode = 'mock' | 'live' | 'cached';

const MODE_KEYS: Record<DataMode, { text: Key; description: Key }> = {
  mock: { text: 'modeMockText', description: 'modeMockDesc' },
  cached: { text: 'modeCachedText', description: 'modeCachedDesc' },
  live: { text: 'modeLiveText', description: 'modeLiveDesc' },
};

/** Visible text label (not colour alone) so the mode is clear in screenshots and to screen readers. */
export function DataModeBadge({ mode }: { mode: DataMode }) {
  const t = useT();
  const { text, description } = MODE_KEYS[mode];
  return (
    <span className={`data-mode-badge data-mode-badge--${mode}`} title={t(description)}>
      {t(text)}
    </span>
  );
}
