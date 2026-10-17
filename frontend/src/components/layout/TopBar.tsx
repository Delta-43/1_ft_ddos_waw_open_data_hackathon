import type { ReactNode } from 'react';
import type { ResponseMode } from '../../api/contract';
import { DataModeBadge } from '../provenance/DataModeBadge';
import './layout.css';

interface TopBarProps {
  mode?: ResponseMode;
  notice?: string;
  onOpenSources?: () => void;
  /** The preferences menu icon, shown next to Sources. */
  children?: ReactNode;
}

/** Slim fixed bar; once there is a result, the response notice sits underneath. Single screen, so no nav menu. */
export function TopBar({ mode, notice, onOpenSources, children }: TopBarProps) {
  return (
    <div className="top-chrome">
      <header className="top-bar">
        <span className="top-bar__title">Warsaw 2076</span>
        {mode && <DataModeBadge mode={mode} />}
        <span className="top-bar__spacer" />
        {children}
        {onOpenSources && (
          <button type="button" className="top-bar__sources" onClick={onOpenSources}>ⓘ Sources</button>
        )}
      </header>
      {notice && <p className="notice-banner" role="note">{notice}</p>}
    </div>
  );
}
