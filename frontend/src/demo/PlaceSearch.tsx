import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Place, Source } from '../api/contract';
import { getJson, WARSAW_BBOX } from '../data/api';
import { useLang, useT } from '../i18n/useT';
import { demoText, fill } from './text';

export interface PlaceList {
  places: Place[];
  sources: Source[];
}

/** The fixture place list, loaded once (the same data as GET /api/places, bundled with the page). */
let list: Promise<PlaceList> | undefined;
export const loadPlaces = (): Promise<PlaceList> => (list ??= getJson<PlaceList>(`/api/places?bbox=${WARSAW_BBOX}&limit=100`));

const plain = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l').toLowerCase();

const CATEGORY_WORDS: Record<string, string> = {
  museum: 'museum muzeum',
  park: 'park garden ogrod',
  landmark: 'landmark historic zabytek',
  generic: 'gallery art sztuka galeria',
};

/** Case- and accent-insensitive search over name and category; names that start with the query come first. */
export function searchPlaces(places: Place[], query: string): Place[] {
  const words = plain(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const scored = places.flatMap(place => {
    const name = plain(place.name);
    const haystack = `${name} ${CATEGORY_WORDS[place.category] ?? ''}`;
    if (!words.every(word => haystack.includes(word))) return [];
    return [{ place, rank: name.startsWith(words[0]) ? 0 : name.includes(words[0]) ? 1 : 2 }];
  });
  return scored.sort((a, b) => a.rank - b.rank || a.place.name.localeCompare(b.place.name, 'pl')).slice(0, 8).map(item => item.place);
}

/** Search box with a result list over the bundled place list. Picking a result flies to it on the map. */
export function PlaceSearch({ onPick }: { onPick: (place: Place, sources: Source[]) => void }) {
  const t = useT();
  const text = demoText(useLang());
  const [data, setData] = useState<PlaceList>();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const results = useMemo(() => (data ? searchPlaces(data.places, query) : []), [data, query]);

  useEffect(() => {
    input.current?.focus();
    void loadPlaces().then(setData).catch(() => setData({ places: [], sources: [] }));
  }, []);
  useEffect(() => setActive(0), [query]);

  const categoryName = (place: Place) =>
    t(place.category === 'museum' ? 'categoryMuseum' : place.category === 'park' ? 'categoryPark' : place.category === 'landmark' ? 'categoryLandmark' : 'categoryGeneric');

  function onKeyDown(event: React.KeyboardEvent) {
    if (!results.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(index => (index + 1) % results.length); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(index => (index - 1 + results.length) % results.length); }
    else if (event.key === 'Enter' && data) { event.preventDefault(); onPick(results[active], data.sources); }
  }

  return (
    <div className="demo-search">
      <label className="demo-search__label" htmlFor={`${listId}-input`}>{text.searchLabel}</label>
      <input
        ref={input}
        id={`${listId}-input`}
        className="demo-search__input"
        type="search"
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={listId}
        aria-activedescendant={results.length ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder={text.searchPlaceholder}
        value={query}
        onChange={event => setQuery(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <ul id={listId} className="demo-search__list" role="listbox" aria-label={text.search}>
        {results.map((place, index) => (
          <li
            key={place.id}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            className={`demo-search__option${index === active ? ' demo-search__option--active' : ''}`}
            onMouseEnter={() => setActive(index)}
            onClick={() => data && onPick(place, data.sources)}
          >
            <span>{place.name}</span>
            <span className="demo-search__kind">{categoryName(place)}</span>
          </li>
        ))}
      </ul>
      <p className="demo-search__note" role="status">
        {query.trim() && data && !results.length ? text.searchEmpty : data ? fill(text.searchCount, { n: data.places.length }) : ''}
      </p>
      <p className="demo-search__note">{text.searchHint}</p>
    </div>
  );
}
