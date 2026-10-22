import { defineConfig } from 'vitest/config';

// Mengulang transform setiap run membuat worker Vitest melewati batas start 60s
// di mesin dev kecil ini; cache modul filesystem memotong biaya tersebut.
export default defineConfig({
  test: {
    fsModuleCache: true,
    // Unit test mem-mock Prisma dan tidak membuka koneksi, tetapi modul
    // config/prisma.js tetap dieksekusi dan Prisma 7 menolak URL kosong.
    env: {
      DATABASE_URL: 'mariadb://test.invalid:3306/komet_test',
    },
  },
});
