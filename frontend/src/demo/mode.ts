/**
 * Static demo mode (`vite build --mode pages`, the GitHub Pages site). There is no backend: every
 * answer is a bundled snapshot of the API's contract-1.0 responses (public/demo/), the basemap is a
 * bundled PMTiles extract, and nothing is stored on the visitor's device. See docs/DEPLOYMENT.md.
 */
export const DEMO = import.meta.env.MODE === 'pages';

/** A file from `public/`, under the site's base path (`/` in development). */
export const asset = (path: string): string => `${import.meta.env.BASE_URL}${path}`;

/** Same, as an absolute URL, for places that resolve it outside the page (map workers). */
export const absoluteAsset = (path: string): string => new URL(asset(path), window.location.href).href;
