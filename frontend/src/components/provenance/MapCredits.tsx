import { useSyncExternalStore } from 'react';
import { useT } from '../../i18n/useT';
import { pinCredits } from '../../markers/credits';
import './provenance.css';

const LICENCE_SHORT: Record<string, string> = { 'Creative Commons Attribution': 'CC BY' };

interface Credit {
  name: string;
  url?: string;
  licence?: string;
}

/** "Urząd m.st. Warszawy, https://dane.um.warszawa.pl/ (Creative Commons Attribution)" → parts. */
function parseCredit(text: string): Credit {
  const url = text.match(/https?:\/\/[^\s,)]+/)?.[0];
  const licence = text.match(/\(([^)]+)\)\s*$/)?.[1];
  const name = text.split(url ?? '(')[0].replace(/[\s,©]+$/, '').replace(/^©\s*/, '').trim() || text;
  return { name, url, licence: licence && (LICENCE_SHORT[licence] ?? licence) };
}

/**
 * Credits required by the basemap (OpenFreeMap / OpenMapTiles / OpenStreetMap, ODbL) and by
 * every data source shown as pins (e.g. Warsaw open data, CC BY). Shown in the bottom bar
 * instead of MapLibre's floating control, so it never overlaps panels. OpenStreetMap-based
 * pin sources are already covered by the basemap's OpenStreetMap credit.
 */
export function MapCredits() {
  const t = useT();
  const credits = useSyncExternalStore(pinCredits.subscribe, pinCredits.getSnapshot)
    .map(parseCredit)
    .filter(credit => !credit.url?.includes('openstreetmap.org'));
  return (
    <span className="map-credits">
      <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a>{' '}
      <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a>{' '}
      {t('dataFrom')} <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
      {credits.map(credit => (
        <span key={credit.name}>
          {' · '}
          {credit.url ? <a href={credit.url} target="_blank" rel="noreferrer">{credit.name}</a> : credit.name}
          {credit.licence && ` (${credit.licence})`}
        </span>
      ))}
    </span>
  );
}
