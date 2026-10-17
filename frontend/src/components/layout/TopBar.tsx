import type { ReactNode } from 'react';
import type { ResponseMode } from '../../api/contract';
import { DataModeBadge } from '../provenance/DataModeBadge';
import './layout.css';

interface TopBarProps {
  mode?: ResponseMode;
  onOpenSources?: () => void;
  /** The preferences menu icon, shown next to Sources. */
  children?: ReactNode;
}

/** Slim fixed bar. Single screen, so no nav menu. The response notice lives in the routes panel and Sources drawer. */
export function TopBar({ mode, onOpenSources, children }: TopBarProps) {
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
    </div>
  );
}
