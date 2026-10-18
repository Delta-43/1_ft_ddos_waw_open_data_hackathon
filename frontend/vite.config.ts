import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: process.env.DEV_BIND_HOST || '127.0.0.1',
    port: 5173,
    strictPort: true,
    allowedHosts: ['silver-storm', 'silver-storm.wirehair-altair.ts.net'],
    proxy: { '/api': { target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000' } },
  },
});
