/**
 * contracts.js — bentuk respons yang dijanjikan server dan diharapkan client.
 *
 * Satu daftar untuk dua arah: server memeriksa dirinya lewat `pnpm check:contracts`
 * (memakai `contractProblems` yang sama), client memeriksanya saat development.
 * Aturan penamaan: key = nama kolom Prisma apa adanya (camelCase); field turunan
 * (`tahun`, `predikatLulus`) harus disebut di sini supaya kedua pihak tahu.
 *
 * ponytail: yang berkontrak baru tiga payload tabel — sumber bug "kolom kosong" yang
 * paling sering. Jalur upgrade: tambahkan entri `RESPONSE_CONTRACTS` per endpoint;
 * pemeriksanya tidak perlu ditulis ulang.
 */

export const PAGINATION_FIELDS = ['page', 'limit', 'total', 'totalPages'];

export const STUDENT_ROW_FIELDS = [
  'nim',
  'nama',
  'angkatan',
  'periode',
  'periodeMasuk',
  'periodeTerakhir',
  'programStudi',
  'fakultas',
  'jenjang',
  'semester',
  'kewarganegaraan',
  'statusKeaktifan',
];

export const GRADUATE_ROW_FIELDS = [
  'id',
  'nim',
  'nama',
  'angkatan',
  'programStudi',
  'fakultas',
  'jenjang',
  'tahunLulus',
  'ipk',
  'sksLulus',
  'statusKeaktifan',
  'predikatLulus',
  'statusKelulusan',
];

export const MBKM_ROW_FIELDS = [
  'id',
  'nim',
  'nama',
  'periode',
  'tahun',
  'angkatan',
  'programStudi',
  'fakultas',
  'jenjang',
  'statusKeaktifan',
  'jenisAktivitas',
  'judulAktivitas',
  'mitra',
  'statusAktivitas',
];

/**
 * Envelope ringkasan dashboard. `kpis` = angka kartu (dibaca client lewat nama
 * field, jadi daftarnya dikunci dua arah), `summary` = sumber chart rincian,
 * `kpiFilterScope` = klaim kartu mana yang benar-benar dipersempit filter.
 */
const SUMMARY_ENVELOPE = ['success', 'summary', 'kpis', 'kpiFilterScope'];

const STUDENT_SUMMARY_KPIS = [
  'activeStudentsCount',
  'activeStudentStatus',
  'foreignRate',
  'foreignStudentsCount',
  'intakeCohortCount',
  'declinePercentage',
  'isFluctuationPositive',
  'intakePeriod',
  'declinePeriod',
  'hasEnoughDeclineData',
];

const GRADUATE_SUMMARY_KPIS = [
  'totalGraduates',
  'totalGraduatesS1',
  'totalGraduatesS2',
  'onTimeGraduationRateS1',
  'onTimeGraduationRateS2',
  'studySuccessRateS1',
  'averageGpaS1',
  'averageGpaS2',
];

const MBKM_SUMMARY_KPIS = [
  'totalParticipants',
  'selesaiCount',
  'evaluasiCount',
  'berjalanCount',
  'participationRate',
  'meetsIkuTarget',
  'targetIku2',
  'eligibleCount',
  'totalMitra',
];

/** Key = path tanpa query, relatif terhadap BASE_URL client (sudah termasuk /api). */
export const RESPONSE_CONTRACTS = {
  '/students/students': { rows: STUDENT_ROW_FIELDS, pagination: PAGINATION_FIELDS },
  '/graduates/list': { rows: GRADUATE_ROW_FIELDS, pagination: PAGINATION_FIELDS },
  '/mbkm/list': { rows: MBKM_ROW_FIELDS, pagination: PAGINATION_FIELDS },
  '/students/summary': { fields: SUMMARY_ENVELOPE, kpis: STUDENT_SUMMARY_KPIS },
  '/graduates/summary': {
    fields: [...SUMMARY_ENVELOPE, 'filterOptions'],
    kpis: GRADUATE_SUMMARY_KPIS,
  },
  '/mbkm/summary': {
    fields: [...SUMMARY_ENVELOPE, 'filterOptions'],
    kpis: MBKM_SUMMARY_KPIS,
  },
};

export function contractFor(endpoint) {
  const path = String(endpoint).split('?')[0];
  return RESPONSE_CONTRACTS[path.replace(/^\/api/, '')] || null;
}

/** Mode ringkasan: kunci envelope wajib ada, kunci `kpis` wajib sama persis. */
function shapeProblems(contract, payload) {
  const problems = [];
  for (const key of contract.fields || []) {
    if (!(key in (payload ?? {}))) problems.push(`field '${key}' hilang`);
  }
  if (!contract.kpis) return problems;
  const kpis = payload?.kpis;
  if (!kpis || typeof kpis !== 'object') return [...problems, '`kpis` bukan objek'];
  for (const key of contract.kpis) {
    if (!(key in kpis)) problems.push(`kpi '${key}' hilang`);
  }
  for (const key of Object.keys(kpis)) {
    if (!contract.kpis.includes(key)) problems.push(`kpi '${key}' tidak terdaftar`);
  }
  return problems;
}

/**
 * Daftar pelanggaran kontrak sebuah payload; array kosong = cocok.
 * Dua mode: `rows` untuk payload tabel (`data` = array baris) dan `fields` +
 * `kpis` untuk ringkasan dashboard.
 */
export function contractProblems(contract, payload) {
  if (!contract) return [];
  if (contract.fields || contract.kpis) return shapeProblems(contract, payload);

  const problems = [];
  const rows = payload?.data;

  if (!Array.isArray(rows)) {
    return ['`data` bukan array'];
  }

  if (rows.length > 0) {
    const row = rows[0];
    if (typeof row !== 'object' || row === null) return ['baris pertama bukan objek'];
    for (const key of contract.rows) {
      if (!(key in row)) problems.push(`field '${key}' hilang dari baris`);
    }
    for (const key of Object.keys(row)) {
      if (!contract.rows.includes(key)) problems.push(`field '${key}' tidak terdaftar`);
    }
  }

  if (contract.pagination) {
    for (const key of contract.pagination) {
      if (!(key in (payload.pagination ?? {}))) problems.push(`pagination.${key} hilang`);
    }
  }

  return problems;
}
