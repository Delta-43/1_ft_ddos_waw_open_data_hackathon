import { Button, Hint, Switch } from '@heathmont/moon-core-tw';
import type { Interpretation } from './interpretPreferences';

export type RequestStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'success' };

type Props = {
  interpretation: Interpretation;
  /** Names of preferences the user switched OFF. */
  off: Set<string>;
  status: RequestStatus;
  onToggle: (name: string) => void;
  onFindRoutes: () => void;
};

/** What the assistant understood, with an on/off switch for each preference. */
export function PreferencesBar({ interpretation, off, status, onToggle, onFindRoutes }: Props) {
  const loading = status.state === 'loading';
  return (
    <section className="grid gap-2" aria-label="Your preferences">
      <h2 className="text-moon-16 font-medium">Your preferences</h2>
      <ul className="grid gap-2">
        {interpretation.preferences.map(({ emoji, name }) => {
          const on = !off.has(name);
          return (
            <li key={name} className="flex items-center justify-between gap-4 px-3 py-2 rounded-moon-s-sm bg-gohan text-moon-14">
              <span className={on ? undefined : 'opacity-moon'}>
                <span aria-hidden="true">{emoji}</span> {name}
              </span>
              {/* Headless UI switch (role="switch", aria-checked). It overwrites aria-labelledby, so name it with aria-label. */}
              <Switch
                size="xs"
                checked={on}
                disabled={loading}
                aria-label={name}
                onChange={() => onToggle(name)}
              />
            </li>
          );
        })}
      </ul>
      <p className="text-moon-12 text-trunks">Mock preferences — fixed example, not yet interpreted by the AI agent.</p>
      <Button size="md" fullWidth disabled={loading} animation={loading ? 'progress' : undefined} onClick={onFindRoutes}>
        {loading ? 'Loading…' : 'Find routes'}
      </Button>
      <div aria-live="polite">
        {loading && <p className="text-moon-12 text-trunks">Looking for routes…</p>}
        {status.state === 'error' && <Hint error className="mt-0 text-moon-14">{status.message}</Hint>}
      </div>
    </section>
  );
}
