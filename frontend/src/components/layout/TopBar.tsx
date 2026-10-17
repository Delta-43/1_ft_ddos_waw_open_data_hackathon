import type { ReactNode } from 'react';
import type { ResponseMode } from '../../api/contract';
import { DataModeBadge } from '../provenance/DataModeBadge';
import './layout.css';

interface TopBarProps {
  mode?: ResponseMode;
  notice?: string;
  onOpenSources?: () => void;
  /** Understood preferences, shown in the bar like Language Explorer's filter tabs. */
  children?: ReactNode;
}

const NO_RESULT_NOTICE = 'Routes, places and their data sources appear after you describe an outing.';

/** Slim fixed bar plus the always-visible notice line. Single screen, so no nav menu. */
export function TopBar({ mode, notice, onOpenSources, children }: TopBarProps) {
  return (
    <div className="top-chrome">
      <header className="top-bar">
        <span className="top-bar__title">Warsaw 2076</span>
        {mode && <DataModeBadge mode={mode} />}
        <div className="top-bar__middle">{children}</div>
        {onOpenSources && (
          <button type="button" className="top-bar__sources" onClick={onOpenSources}>ⓘ Sources</button>
        )}
      </header>
      <p className="notice-banner" role="note">{notice ?? NO_RESULT_NOTICE}</p>
    </div>
  );
}
