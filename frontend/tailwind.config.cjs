/** Tailwind 3 config for the Moon Design System (@heathmont/moon-core-tw v10). */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    // Moon components ship their Tailwind classes in compiled JS.
    './node_modules/@heathmont/moon-core-tw/lib/es/**/*.js',
  ],
  presets: [require('@heathmont/moon-core-tw/lib/private/presets/ds-moon-preset')],
};
