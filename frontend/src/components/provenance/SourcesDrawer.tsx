import type { Source } from '../../api/contract';
import { formatWarsawDate } from './formatDate';
import { SourceLabel } from './SourceLabel';

/** Answers: where does this data come from, how fresh is it, and how to cite it. */
export function SourcesDrawer({ sources, id, hidden }: { sources: Source[]; id?: string; hidden?: boolean }) {
  const credits = [...new Map(sources.map(source => [source.attribution, source])).values()];
  return (
    <section className="flex flex-col gap-2 px-4 py-3 rounded-moon-s-md bg-gohan text-bulma ring-1 ring-inset ring-beerus [&[hidden]]:hidden" id={id} aria-label="Data sources" hidden={hidden}>
      <h3 className="mt-1 text-moon-14 font-semibold">Where does this data come from?</h3>
      <ul className="grid gap-2">
        {sources.map(source => (
          <li key={source.id} className="flex flex-col gap-1 pb-2 border-b border-beerus last:border-b-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-moon-14 font-semibold">{source.name}</span>
              <SourceLabel source={source} compact />
            </div>
            {source.method && <p className="text-moon-12">{source.method}</p>}
            <p className="text-moon-12 text-trunks tabular-nums">
              {source.retrieved_at
                ? `Fetched ${formatWarsawDate(source.retrieved_at)}`
                : source.mode === 'simulated' ? 'Made for the demo' : 'Fetch time not recorded'}
              {source.data_date && ` · data from ${source.data_date}`}
            </p>
          </li>
        ))}
      </ul>

      <h3 className="mt-1 text-moon-14 font-semibold">How often is it updated?</h3>
      <p className="text-moon-12">
        Each source shows when it was fetched. Saved snapshots are not updated automatically.
      </p>

      <h3 className="mt-1 text-moon-14 font-semibold">How to cite it?</h3>
      <ul className="grid gap-2">
        {credits.map(source => (
          <li key={source.attribution} className="text-moon-12">
            {source.url ? <a className="underline underline-offset-2 hover:text-trunks" href={source.url} target="_blank" rel="noreferrer">{source.attribution}</a> : source.attribution}
          </li>
        ))}
      </ul>
    </section>
  );
}
