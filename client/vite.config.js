import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import expressApp from '../server/app.js';

/**
 * Konfigurasi Vite untuk aplikasi KOMET Dashboard.
 * Integrasi Express.js backend middleware langsung pada dev server port 3000.
 */
export default defineConfig({
  plugins: [
    react({
      babel: {
        compact: true,
      },
    }),
    {
      name: 'express-backend-middleware',
      configureServer(server) {
        server.middlewares.use(expressApp);
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
