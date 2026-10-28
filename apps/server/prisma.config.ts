import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7 memindahkan URL database keluar dari schema.prisma. CLI tidak lagi
// memuat .env sendiri, jadi dotenv diimpor di sini. `DATABASE_URL` sengaja
// ditulis mariadb:// agar engine-nya jelas bagi pengembang; Prisma CLI hanya
// menerima mysql://, jadi skemanya diterjemahkan di sini. Driver aplikasi
// (@prisma/adapter-mariadb) menerima mariadb:// apa adanya.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL?.replace(/^mariadb:\/\//, 'mysql://'),
  },
});
