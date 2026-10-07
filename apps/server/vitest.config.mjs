import { defineConfig } from 'vitest/config';

// Mengulang transform setiap run membuat worker Vitest melewati batas start 60s
// di mesin dev kecil ini; cache modul filesystem memotong biaya tersebut.
export default defineConfig({
  test: { fsModuleCache: true },
});
