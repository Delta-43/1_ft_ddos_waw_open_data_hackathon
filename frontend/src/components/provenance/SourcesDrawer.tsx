import type { Source } from '../../api/contract';
import { formatWarsawDate } from './formatDate';
import { SourceLabel } from './SourceLabel';
import './provenance.css';

/** Answers: where does this data come from, how fresh is it, and how to cite it. */
export function SourcesDrawer({ sources, id, hidden }: { sources: Source[]; id?: string; hidden?: boolean }) {
  const credits = [...new Map(sources.map(source => [source.attribution, source])).values()];
  return (
    <section className="sources-drawer" id={id} aria-label="Data sources" hidden={hidden}>
      <h3 className="sources-drawer__heading">Where does this data come from?</h3>
      <ul className="sources-drawer__list">
        {sources.map(source => (
          <li key={source.id} className="sources-drawer__item">
            <div className="sources-drawer__title">
              <span className="sources-drawer__name">{source.name}</span>
              <SourceLabel source={source} compact />
            </div>
            {source.method && <p className="sources-drawer__text">{source.method}</p>}
            <p className="sources-drawer__meta">
              {source.retrieved_at
                ? `Fetched ${formatWarsawDate(source.retrieved_at)}`
                : source.mode === 'simulated' ? 'Made for the demo' : 'Fetch time not recorded'}
              {source.data_date && ` · data from ${source.data_date}`}
            </p>
          </li>
        ))}
      </ul>

      <h3 className="sources-drawer__heading">How often is it updated?</h3>
      <p className="sources-drawer__text">
        Each source shows when it was fetched. Saved snapshots are not updated automatically.
      </p>

      <h3 className="sources-drawer__heading">How to cite it?</h3>
      <ul className="sources-drawer__list">
        {credits.map(source => (
          <li key={source.attribution} className="sources-drawer__text">
            {source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.attribution}</a> : source.attribution}
          </li>
        ))}
      </ul>
    </section>
  );
}
