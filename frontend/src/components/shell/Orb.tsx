import type { CSSProperties } from 'react';

export type OrbState = 'idle' | 'listening' | 'thinking';

/**
 * The guide's avatar: a small glowing orb that breathes when idle, brightens while listening and
 * spins its ring while thinking. Decorative; the button around it carries the label.
 */
export function Orb({ state = 'idle', accent }: { state?: OrbState; accent?: string }) {
  return (
    <span className={`orb orb--${state}`} style={accent ? ({ '--orb-accent': accent } as CSSProperties) : undefined} aria-hidden="true">
      <span className="orb__halo" />
      <span className="orb__ring" />
      <span className="orb__core" />
      <span className="orb__glint" />
    </span>
  );
}
