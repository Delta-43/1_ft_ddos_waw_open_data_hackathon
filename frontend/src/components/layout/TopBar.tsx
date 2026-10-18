import type { ReactNode } from 'react';
import type { ResponseMode } from '../../api/contract';
import { useT } from '../../i18n/useT';
import { DataModeBadge } from '../provenance/DataModeBadge';
import { LanguageToggle } from './LanguageToggle';
import './layout.css';

interface TopBarProps {
  mode?: ResponseMode;
  onOpenSources?: () => void;
  /** Whether the Sources drawer (id "sources-drawer") is open. */
  sourcesOpen?: boolean;
  /** The preferences menu icon, shown next to Sources. */
  children?: ReactNode;
}

/** Slim fixed bar. Single screen, so no nav menu. The response notice lives in the routes panel and Sources drawer. */
export function TopBar({ mode, onOpenSources, sourcesOpen = false, children }: TopBarProps) {
  const t = useT();
  return (
    <div className="top-chrome">
      <header className="top-bar">
        <span className="top-bar__title">{t('appTitle')}</span>
        {mode && <DataModeBadge mode={mode} />}
        <span className="top-bar__spacer" />
        {children}
        <LanguageToggle />
        {onOpenSources && (
          <button
            type="button"
            className="top-bar__sources"
            aria-expanded={sourcesOpen}
            aria-controls="sources-drawer"
            onClick={onOpenSources}
          >
            ⓘ <span className="top-bar__sources-text">{t('sources')}</span>
          </button>
        )}
      </header>
    </div>
  );
}
