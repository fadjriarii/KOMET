import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7 memindahkan URL database keluar dari schema.prisma. CLI tidak lagi
// memuat .env sendiri, jadi dotenv diimpor di sini. `env()` sengaja tidak
// dipakai: ia melempar saat config dimuat, dan `prisma generate` (postinstall,
// CI tanpa .env) tidak butuh koneksi database.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || 'mysql://placeholder@localhost:3306/placeholder',
  },
});
