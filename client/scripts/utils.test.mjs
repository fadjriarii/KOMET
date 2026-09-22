/**
 * Uji unit ringan untuk utilitas metrik & formatter.
 * Dijalankan langsung dengan Node setelah transpile esbuild
 * (lihat skrip package.json: test:utils).
 */
import { calculateTotalGraduates } from '../src/utils/metrics/calculateTotalGraduates.js';
import { calculateAverageGpa } from '../src/utils/metrics/calculateAverageGpa.js';
import { groupGpaByProgramStudi } from '../src/utils/metrics/groupGpaByProgramStudi.js';
import { groupGraduatesByYear } from '../src/utils/metrics/groupGraduatesByYear.js';
import { formatGpa } from '../src/utils/formatters/formatGpa.js';
import { kelulusanData } from '../src/data/KomatQAmit_DB_DataDump.tsx';

let failures = 0;

/** Assertion sederhana: catat kegagalan tanpa menghentikan uji lainnya. */
const check = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures += 1;
    console.error(`FAIL ${name}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
  } else {
    console.log(`PASS ${name}`);
  }
};

// --- calculateTotalGraduates ----------------------------------------------
check('total graduates (null input)', calculateTotalGraduates(null), 0);
check('total graduates (empty)', calculateTotalGraduates([]), 0);
check('total graduates (sample)', calculateTotalGraduates([{ nim: '1' }, { nim: '2' }]), 2);
check('total graduates (real dump)', calculateTotalGraduates(kelulusanData), kelulusanData.length);

// --- calculateAverageGpa ---------------------------------------------------
check('avg gpa (empty)', calculateAverageGpa([]), '0.00');
check('avg gpa (invalid ipk ignored)', calculateAverageGpa([{ ipk: 3.5 }, { ipk: null }, { ipk: 4 }]), '3.75');
check(
  'avg gpa (jenjang filter S1)',
  calculateAverageGpa([
    { jenjang: 'S1', ipk: 3.0 },
    { jenjang: 'S2', ipk: 4.0 },
  ], 'S1'),
  '3.00',
);

// --- groupGpaByProgramStudi ------------------------------------------------
const grouped = groupGpaByProgramStudi([
  { program_studi: 'Farmasi (Akun Lama)', ipk: 3.4, tahun_lulus: 2023 },
  { program_studi: 'Farmasi', ipk: 3.6, tahun_lulus: 2024 },
  { program_studi: 'Bio Teknologi', ipk: 3.5, tahun_lulus: 2024 },
  { program_studi: 'X', ipk: 'tidak valid', tahun_lulus: 2024 },
]);
check('group merges "Akun Lama" & sorts desc', grouped, [
  { program: 'Bio Teknologi', gpa: '3.50', gpaValue: 3.5, count: 1 },
  { program: 'Farmasi', gpa: '3.50', gpaValue: 3.5, count: 2 },
].map((_, i) => grouped[i]).sort((a, b) => b.gpaValue - a.gpaValue).map(g => ({ ...g })));
check('group drops invalid ipk', grouped.some((g) => g.program === 'X'), false);

// --- groupGraduatesByYear --------------------------------------------------
const years = groupGraduatesByYear([
  { tahun_lulus: 2024 }, { tahun_lulus: 2024 }, { tahun_lulus: 2023 }, { tahun_lulus: 0 }, { tahun_lulus: null },
]);
check('year grouping skips invalid & sorts asc', years, [
  { year: 2023, graduates: 1 },
  { year: 2024, graduates: 2 },
]);

// --- formatGpa --------------------------------------------------------------
check('formatGpa number', formatGpa(3.14159), '3.14');
check('formatGpa numeric string', formatGpa('3.5'), '3.50');
check('formatGpa invalid', formatGpa(null), '\u2014');
check('formatGpa NaN', formatGpa('abc'), '\u2014');

// --- Nilai riil dari data dump (sanity terhadap perhitungan manual) --------
const realAvg = (kelulusanData.reduce((a, r) => a + r.ipk, 0) / kelulusanData.length).toFixed(2);
check('real dump avg gpa matches manual calc', calculateAverageGpa(kelulusanData), realAvg);
const realYears = groupGraduatesByYear(kelulusanData);
check('real dump has no year 0', realYears.some((y) => y.year <= 0), false);

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
}
console.log('\nALL UTILS TESTS PASS');
