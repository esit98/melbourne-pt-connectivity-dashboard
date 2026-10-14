import { defineConfig } from 'vite';

// Forward only this project's public map services. No admin API or credentials.
const proxy = {
  '^/geoserver/geom30012/(ows|wfs|wms)(\\?|$)': {
    target: 'http://127.0.0.1:8085', changeOrigin: true,
  },
};
export default defineConfig({
  base: process.env.VITE_PUBLICATION_MODE === 'static' ? '/melbourne-pt-connectivity-dashboard/' : '/',
  server: { host: '127.0.0.1', port: 5174, strictPort: true, proxy },
  preview: { host: '127.0.0.1', port: 5174, strictPort: true, proxy },
});
