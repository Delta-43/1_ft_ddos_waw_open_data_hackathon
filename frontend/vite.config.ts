import { defineConfig } from 'vite';

// GitHub Pages serves the demo from /<repo>/ (`--mode pages`, see .github/workflows/pages.yml).
export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/1_ft_ddos_waw_open_data_hackathon/' : '/',
  server: {
    host: process.env.DEV_BIND_HOST || '127.0.0.1',
    port: 5173,
    strictPort: true,
    allowedHosts: ['silver-storm', 'silver-storm.wirehair-altair.ts.net'],
    proxy: { '/api': { target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000' } },
  },
}));
