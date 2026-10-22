import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7 memindahkan URL database keluar dari schema.prisma. CLI tidak lagi
// memuat .env sendiri, jadi dotenv diimpor di sini. Aplikasi memakai mariadb://;
// Prisma CLI hanya menerima mysql://.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL?.replace(/^mariadb:\/\//, 'mysql://'),
  },
});
