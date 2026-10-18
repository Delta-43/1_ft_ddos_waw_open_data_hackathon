import type { ResponseMode } from '../../api/contract';
import { DataModeBadge } from '../provenance/DataModeBadge';
import './layout.css';

/** No bar (#114): just the site name, top-left over the map, with the answer's data mode. */
export function TopBar({ mode }: { mode?: ResponseMode }) {
  return (
    <header className="site-title">
      <h1 className="site-title__name">Warsaw 2076</h1>
      {mode && <DataModeBadge mode={mode} />}
    </header>
  );
}
