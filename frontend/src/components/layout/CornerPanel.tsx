import { useEffect, useId, type ReactNode } from 'react';
import './layout.css';

interface CornerPanelProps {
  /** Top-left under the title (Preferences) or bottom-left (Sources), mirroring the assistant's corner. */
  corner: 'top-left' | 'bottom-left';
  /** Accessible name of the round button, e.g. "Preferences". */
  label: string;
  icon: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

/**
 * A round button in the same style as the assistant's, with a rounded panel that opens beside it
 * (to the right, away from the screen edge). Escape closes it.
 */
export function CornerPanel({ corner, label, icon, open, onOpenChange, children }: CornerPanelProps) {
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onOpenChange(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  return (
    <div className={`corner corner--${corner}`}>
      <button
        type="button"
        className="round-button"
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
      >
        {icon}
      </button>
      <section id={panelId} className="corner__panel" aria-label={label} hidden={!open}>
        <button type="button" className="corner__close" aria-label={`Close ${label.toLowerCase()}`} onClick={() => onOpenChange(false)}>×</button>
        {children}
      </section>
    </div>
  );
}
