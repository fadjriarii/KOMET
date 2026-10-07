import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Penjaga anggaran bundle: memisahkan "naik karena fitur" dari "naik karena impor
 * statis yang salah tempat". Batasnya = hasil build saat ini + ruang gerak; naikkan
 * hanya setelah alasannya jelas, jangan setelah angkanya mulai merah.
 */
const ASSETS = join(import.meta.dirname, '../dist/assets');

const RULES = [
  // Chunk lazy per halaman/modul: tab pertama tidak boleh ikut membawa modal
  // tetangga. Lompatan besar = ada impor statis yang menembus batas lazy-load.
  { match: /(?:Page|Modal)[A-Za-z]*-[A-Za-z0-9_-]+\.js$/, maxKb: 60, label: 'chunk halaman/modal' },
  { match: /^index-[A-Za-z0-9_-]+\.js$/, maxKb: 420, label: 'bundle entry' },
];
const TOTAL_MAX_KB = 1150;

let files;
try {
  files = readdirSync(ASSETS).filter((name) => name.endsWith('.js'));
} catch {
  console.error('dist/assets belum ada — jalankan `pnpm build` lebih dulu.');
  process.exit(1);
}

const sizes = files.map((name) => statSync(join(ASSETS, name)).size);
const totalKb = sizes.reduce((sum, size) => sum + size, 0) / 1024;
const problems = [];

for (const [index, name] of files.entries()) {
  const sizeKb = sizes[index] / 1024;
  for (const { match, maxKb, label } of RULES) {
    if (match?.test(name) && sizeKb > maxKb) {
      problems.push(`${name}: ${sizeKb.toFixed(1)} kB > ${maxKb} kB (${label})`);
    }
  }
}
if (totalKb > TOTAL_MAX_KB) {
  problems.push(`total JS ${totalKb.toFixed(0)} kB > ${TOTAL_MAX_KB} kB`);
}

// Ini yang membuat point 1 bermakna: selama chart di-split, entry bisa tetap kecil.
if (!files.some((name) => /^CartesianChart-/.test(name))) {
  problems.push('chunk chart terpisah hilang — recharts kemungkinan besar masuk ke bundle entry.');
}

console.log(`${files.length} chunk JS, total ${totalKb.toFixed(0)} kB.`);
if (problems.length) {
  for (const problem of problems) console.error(`GAGAL ${problem}`);
  process.exit(1);
}
console.log('Semua batas bundle terpenuhi.');
