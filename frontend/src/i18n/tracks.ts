import type { TrackInfo } from '../api/tracks';
import type { Lang } from './language';

/**
 * Polish titles and summaries for the backend's demo tracks (data/fixtures/simulated-tracks.json),
 * by track id. The backend sends them in English only; an unknown id keeps the backend's text.
 */
const PL: Record<string, Pick<TrackInfo, 'title' | 'summary'>> = {
  'calm-park-museum': {
    title: 'Spokojny spacer przez parki do Muzeum Łowiectwa i Jeździectwa',
    summary: 'Dwa ciche parki, a potem małe muzeum. Domyślna spokojna i zielona wycieczka.',
  },
  'history-memory': {
    title: 'Spacer historyczny do Mauzoleum Walki i Męczeństwa',
    summary: 'Przez Park Ujazdowski do muzeum historii XX wieku.',
  },
  'art-gallery-stroll': {
    title: 'Spacer artystyczny: Dolina Szwajcarska, galeria i sztuka współczesna',
    summary: 'Dolina Szwajcarska, Apteka Sztuki, a na koniec Centrum Sztuki Współczesnej.',
  },
  'bike-green-loop': {
    title: 'Zielona przejażdżka rowerem do Pałacu na Wyspie',
    summary: 'Rowerem przez Agrykolę i Park Belwederski, na koniec Pałac na Wyspie.',
  },
  'short-direct-hour': {
    title: 'Krótki, prosty spacer do Muzeum Łowiectwa i Jeździectwa',
    summary: 'Bez objazdów: najszybszy sensowny spacer do muzeum, około godziny lub krócej.',
  },
  'botanical-sky': {
    title: 'Ogród Botaniczny i Obserwatorium Astronomiczne',
    summary: 'Spacer przez ogród, zakończony przy obserwatorium. Dla miłośników nauki i przyrody.',
  },
};

/** The track with its title and summary in `lang`. */
export function localTrack<T extends TrackInfo | undefined>(track: T, lang: Lang): T {
  const pl = track && lang === 'pl' ? PL[track.id] : undefined;
  return pl ? { ...track, ...pl } : track;
}
