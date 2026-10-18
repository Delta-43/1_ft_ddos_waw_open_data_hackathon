import type { Lang } from './language';

/**
 * Demo content written in the frontend in both languages (flags, reports, example routes).
 * A plain string reads the same in each: names, a visitor's own words.
 */
export type Localised = string | Record<Lang, string>;

export const localise = (text: Localised, lang: Lang): string => (typeof text === 'string' ? text : text[lang]);
