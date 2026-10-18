import { getLang } from '../../i18n/language';
import { translate } from '../../i18n/translations';

/** "+1 h 21 min" from seconds; null stays unknown. Reads the current language at call time. */
export function formatDuration(seconds: number | null | undefined, prefix = ''): string {
  const lang = getLang();
  if (seconds == null) return translate(lang, 'unknownDuration');
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const h = translate(lang, 'hoursShort');
  const min = translate(lang, 'minutesShort');
  const text = hours === 0 ? `${minutes} ${min}` : rest === 0 ? `${hours} ${h}` : `${hours} ${h} ${String(rest).padStart(2, '0')} ${min}`;
  return prefix + text;
}

/** "3.7 km" or "850 m"; null stays unknown. */
export function formatDistance(metres: number | null | undefined): string {
  if (metres == null) return translate(getLang(), 'unknownDistance');
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres)} m`;
}
