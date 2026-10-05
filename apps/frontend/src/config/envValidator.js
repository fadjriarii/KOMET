/**
 * envValidator.js - Zod-based fail-fast validation for frontend environment variables.
 *
 * Import this module early (e.g. in main.jsx) so the app crashes immediately
 * on startup if a required VITE_ variable is missing, rather than failing
 * silently inside an API call later.
 */
import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .url('VITE_API_BASE_URL harus berupa URL yang valid (contoh: http://localhost:3000/api)'),
});

function validateEnv() {
  const result = envSchema.safeParse(import.meta.env);

  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `❌ VALIDASI ENV FRONTEND GAGAL!\n\nVariabel berikut bermasalah:\n${messages}\n\nPastikan file .env sudah benar sebelum menjalankan frontend.`,
    );
  }

  return result.data;
}

export const env = validateEnv();
