import { Marker, type Map } from 'maplibre-gl';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { EXAMPLE_REPORTS, type CityReport, type ReportKind } from '../../data/cityNotes';

/**
 * Feedback about missing services and problems in the city. Examples are invented for the demo;
 * a visitor's own reports are kept in this browser only (privacy rule: nothing personal goes to
 * the backend) and can be deleted. Nothing is sent to the city.
 */
const STORAGE_KEY = 'find-your-way:reports';
const KIND_TEXT: Record<ReportKind, string> = { missing: 'Missing', issue: 'Problem' };

function loadMine(): CityReport[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveMine(reports: CityReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // Private mode or blocked storage: the report still shows until the page closes.
  }
}

function ago(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
}

const triangle = (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M10 2.8 18.2 17H1.8z" fill="currentColor" />
    <path d="M10 8v4.2M10 14.6v.1" stroke="#1d1503" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export function Reports({ map, explore }: { map: Map | null; explore: boolean }) {
  const [open, setOpen] = useState(false);
  const [mine, setMine] = useState<CityReport[]>(loadMine);
  const [agreed, setAgreed] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<string>();
  const [writing, setWriting] = useState(false);
  const [kind, setKind] = useState<ReportKind>('missing');
  const [text, setText] = useState('');
  const panel = useRef<HTMLDivElement>(null);
  const reports = useMemo(() => [...mine, ...EXAMPLE_REPORTS], [mine]);

  // Yellow triangles on the map while the panel is open.
  useEffect(() => {
    if (!map || !open) return;
    const markers = reports.map(report => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `report-marker${report.id === active ? ' report-marker--active' : ''}`;
      el.setAttribute('aria-label', `${KIND_TEXT[report.kind]}: ${report.text}`);
      el.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.8 18.2 17H1.8z" fill="currentColor"/><path d="M10 8v4.2M10 14.6v.1" stroke="#1d1503" stroke-width="1.8" stroke-linecap="round"/></svg>';
      el.addEventListener('click', event => {
        event.stopPropagation();
        setActive(report.id);
        panel.current?.querySelector(`[data-report="${report.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
      return new Marker({ element: el }).setLngLat([report.longitude, report.latitude]).addTo(map);
    });
    return () => markers.forEach(marker => marker.remove());
  }, [map, open, reports, active]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function show(report: CityReport) {
    setActive(report.id);
    // The trip view is the visitor's to explore; the home view stays composed.
    if (map && explore) map.flyTo({ center: [report.longitude, report.latitude], zoom: Math.max(map.getZoom(), 15.8), duration: 900 });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = text.trim();
    if (!value || !map) return;
    const { lng, lat } = map.getCenter();
    const report: CityReport = {
      id: `mine:${Date.now()}`, kind, text: value.slice(0, 280), place: 'Where the map was centred',
      longitude: lng, latitude: lat, reported_at: new Date().toISOString(), agree: 0, origin: 'mine',
    };
    const next = [report, ...mine];
    setMine(next);
    saveMine(next);
    setText('');
    setWriting(false);
    setActive(report.id);
  }

  function remove(id: string) {
    const next = mine.filter(report => report.id !== id);
    setMine(next);
    saveMine(next);
  }

  return (
    <div className={`reports${open ? ' reports--open' : ''}`}>
      {open && (
        <div className="reports__panel" ref={panel} role="dialog" aria-label="Reports about the city">
          <header className="reports__header">
            <div>
              <h2 className="reports__title">What’s missing nearby</h2>
              <p className="reports__sub">Reports from people walking here</p>
            </div>
            <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close reports">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
          </header>
          <ul className="reports__list">
            {reports.map(report => {
              const me = agreed.has(report.id);
              return (
                <li key={report.id} data-report={report.id} className={`report${report.id === active ? ' report--active' : ''}`}>
                  <button type="button" className="report__main" onClick={() => show(report)}>
                    <span className={`report__kind report__kind--${report.kind}`}>{KIND_TEXT[report.kind]}</span>
                    <span className="report__text">{report.text}</span>
                    <span className="report__meta">{report.place} · {ago(report.reported_at)}{report.origin === 'mine' ? ' · yours, on this device' : ''}</span>
                  </button>
                  <div className="report__actions">
                    {report.origin === 'mine' ? (
                      <button type="button" className="report__action" onClick={() => remove(report.id)}>Delete</button>
                    ) : (
                      <button
                        type="button"
                        className={`report__action${me ? ' report__action--on' : ''}`}
                        aria-pressed={me}
                        onClick={() => setAgreed(set => { const next = new Set(set); if (me) next.delete(report.id); else next.add(report.id); return next; })}
                      >
                        Me too · {report.agree + (me ? 1 : 0)}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {writing ? (
            <form className="reports__form" onSubmit={submit}>
              <div className="reports__kinds" role="radiogroup" aria-label="Kind of report">
                {(['missing', 'issue'] as ReportKind[]).map(value => (
                  <button key={value} type="button" role="radio" aria-checked={kind === value} className={`report-kind${kind === value ? ' report-kind--on' : ''}`} onClick={() => setKind(value)}>
                    {value === 'missing' ? 'Something is missing' : 'Something is wrong'}
                  </button>
                ))}
              </div>
              <textarea
                className="reports__input"
                rows={2}
                maxLength={280}
                value={text}
                onChange={event => setText(event.target.value)}
                placeholder="A bench, water, a toilet, a safer crossing…"
                aria-label="Your report"
                autoFocus
              />
              <div className="reports__form-row">
                <span className="reports__fine">Pinned where the map is centred. Saved on this device only.</span>
                <button type="submit" className="reports__save" disabled={!text.trim()}>Save</button>
              </div>
            </form>
          ) : (
            <button type="button" className="reports__add" onClick={() => setWriting(true)}>+ Report something</button>
          )}
          <p className="reports__fine">Examples are invented for the demo. Nothing here is sent to the city.</p>
        </div>
      )}
      <button
        type="button"
        className="reports__button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-label={`Reports about missing services and problems: ${reports.length}`}
      >
        {triangle}
        <span className="reports__count" aria-hidden="true">{reports.length}</span>
      </button>
    </div>
  );
}
