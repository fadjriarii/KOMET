import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    // Fork pool intermittently gagal menyalakan worker di WSL saat turbo menjalankan
    // task lain paralel ("Timeout waiting for worker to respond"); threads pool stabil
    // dan tetap cepat untuk beberapa file test.
    pool: 'threads',
    // Mesin ini 4 core / 3 GB RAM; turbo sudah menjalankan task lain paralel dan tiap
    // file jsdom membawa environment sendiri. Menjalankan file berurutan membuat task
    // test client tetap ~1 detik dan berhenti merebut worker dari paket lain.
    fileParallelism: false,
    // jsdom di atas WSL bisa makan beberapa detik per render saat task lain berjalan
    // paralel; ceiling default 5 s memicu alarm palsu, bukan menemukan bug.
    testTimeout: 15000,
    // Transform modul dibiarkan antar-run; jsdom + @komet/shared ditransformasi
    // sekali, bukan tiap `vitest run` (hint bawaan vitest).
    fsModuleCache: true,
  },
});
