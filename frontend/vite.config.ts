import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: process.env.DEV_BIND_HOST || '127.0.0.1',
    port: 5173,
    strictPort: true,
    // Extra host names allowed to reach the dev server, comma-separated (never `true`).
    allowedHosts: (process.env.DEV_ALLOWED_HOSTS ?? '').split(',').filter(Boolean),
    proxy: { '/api': { target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000' } },
  },
});
