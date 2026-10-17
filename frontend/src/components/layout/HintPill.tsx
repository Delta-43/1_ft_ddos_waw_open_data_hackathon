import type { ReactNode } from 'react';
import './layout.css';

/** First-run hint on a softly moving gradient halo, so it reads as an invitation, not a warning. */
export function HintPill({ children }: { children: ReactNode }) {
  return (
    <p className="hint-pill" role="status">
      <span className="hint-pill__text">{children}</span>
    </p>
  );
}
