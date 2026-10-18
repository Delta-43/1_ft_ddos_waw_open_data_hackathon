import type { Source } from '../../api/contract';
import { useT } from '../../i18n/useT';
import { formatWarsawDate } from './formatDate';
import { SourceLabel } from './SourceLabel';
import './provenance.css';

/** Answers: where does this data come from, how fresh is it, and how to cite it. */
export function SourcesDrawer({ sources, id, hidden, notice }: { sources: Source[]; id?: string; hidden?: boolean; notice?: string }) {
  const t = useT();
  const credits = [...new Map(sources.map(source => [source.attribution, source])).values()];
  return (
    <section className="sources-drawer" id={id} aria-label={t('dataSourcesAriaLabel')} hidden={hidden}>
      {notice && <p className="sources-drawer__notice" role="note">{notice}</p>}
      <h3 className="sources-drawer__heading">{t('whereFromHeading')}</h3>
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
                ? t('fetchedShort', { date: formatWarsawDate(source.retrieved_at) })
                : source.mode === 'simulated' ? t('madeForDemo') : t('fetchTimeNotRecorded')}
              {source.data_date && t('dataFromDate', { date: source.data_date })}
            </p>
          </li>
        ))}
      </ul>

      <h3 className="sources-drawer__heading">{t('howOftenHeading')}</h3>
      <p className="sources-drawer__text">
        {t('howOftenText')}
      </p>

      <h3 className="sources-drawer__heading">{t('howToCiteHeading')}</h3>
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
