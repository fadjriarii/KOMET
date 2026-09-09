import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Konfigurasi Vite untuk aplikasi KOMET Dashboard.
 * Alias "@" diarahkan ke folder src agar impor modul lebih ringkas.
 * react({ babel: { compact: true } }) menonaktifkan peringatan deoptimisasi file data dump besar.
 */
export default defineConfig({
  plugins: [
    react({
      babel: {
        compact: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

