import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Menggabungkan nama-nama kelas Tailwind secara aman.
 * Fungsi ini adalah utilitas standar pola shadcn-ui: `clsx` untuk
 * penggabungan kondisional, `twMerge` untuk menyelesaikan konflik kelas.
 *
 * @param {...(string|Object|Array)} inputs - Daftar kelas atau objek kondisional
 * @returns {string} Kelas final yang sudah digabung dan di-resolve
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
