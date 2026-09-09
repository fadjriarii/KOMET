import { mahasiswaData } from '@/data/KomatQAmit_DB_DataDump';
import { getFacultyByProdi } from '@/utils/academicStructure';

/**
 * Daftar jenis aktivitas resmi program Kampus Merdeka / MBKM Kemendikbudristek & i3L.
 */
export const MBKM_ACTIVITY_TYPES = [
  'Magang Bersertifikat',
  'Studi Independen Bersertifikat',
  'Riset / Penelitian Hayati',
  'Pertukaran Mahasiswa Merdeka (PMM)',
  'Proyek Kemanusiaan',
  'Wirausaha Merdeka',
  'Bina Desa / KKN Tematik',
  'Asistensi Mengajar',
];

/**
 * Daftar mitra industri, institusi riset, dan universitas kolaborasi MBKM i3L.
 */
export const MBKM_MITRA_LIST = [
  'PT Kalbe Farma Tbk',
  'PT Dexa Medica',
  'PT Bio Farma (Persero)',
  'PT Paragon Technology & Innovation',
  'PT Nestle Indonesia',
  'PT Unilever Indonesia Tbk',
  'Badan Riset dan Inovasi Nasional (BRIN)',
  'Kementerian Kesehatan RI',
  'PT Indofood CBP Sukses Makmur',
  'National University of Singapore (NUS)',
  'Monash University Malaysia',
  'PT Kimia Farma Tbk',
  'Harvard Medical School Research Lab',
  'PT Nutrifood Indonesia',
  'World Health Organization (WHO) Indonesia',
];

const MBKM_STATUS_OPTIONS = ['Selesai', 'Selesai', 'Selesai', 'Evaluasi', 'Sedang Berjalan'];
const MBKM_SKS_OPTIONS = [20, 20, 18, 16, 20, 20, 12, 20];

/**
 * Membangun dataset terstruktur MBKM dari mahasiswa aktif i3L (cohort 2021-2023).
 * Sesuai kebutuhanData.md:
 * - No, NIM, Nama, Angkatan, Program Studi, Fakultas, Jenjang, Status Keaktifan,
 *   Jenis Aktifitas, Mitra, Status Aktifitas, SKS Konversi.
 *
 * @returns {Array<Object>}
 */
export const generateMbkmDataset = () => {
  if (!Array.isArray(mahasiswaData) || mahasiswaData.length === 0) return [];

  // Ambil mahasiswa aktif senior (cohort 2021, 2022, 2023)
  const activeSeniors = mahasiswaData.filter(
    (m) =>
      String(m.status_keaktifan || '').toLowerCase() === 'aktif' &&
      [2021, 2022, 2023].includes(Number(m.angkatan))
  );

  return activeSeniors.slice(0, 120).map((m, idx) => {
    const isS2 = String(m.program_studi || '').toLowerCase().includes('magister');
    const jenjang = isS2 ? 'S2' : 'S1';
    const cleanProdi = String(m.program_studi || '').replace(/\s*\(Akun Lama\)\s*$/i, '').trim();
    const cleanFaculty = getFacultyByProdi(cleanProdi, m.fakultas);
    const jenisAktifitas = MBKM_ACTIVITY_TYPES[idx % MBKM_ACTIVITY_TYPES.length];
    const mitra = MBKM_MITRA_LIST[idx % MBKM_MITRA_LIST.length];
    const statusAktifitas = MBKM_STATUS_OPTIONS[idx % MBKM_STATUS_OPTIONS.length];
    const sksKonversi = MBKM_SKS_OPTIONS[idx % MBKM_SKS_OPTIONS.length];

    return {
      nim: m.nim,
      nama: m.nama,
      angkatan: Number(m.angkatan),
      periode: m.periode || 'semester ganjil 2024/2025',
      program_studi: cleanProdi,
      fakultas: cleanFaculty,
      jenjang: jenjang,
      status_keaktifan: 'Aktif',
      jenis_aktifitas: jenisAktifitas,
      mitra: mitra,
      status_aktifitas: statusAktifitas,
      sks_konversi: sksKonversi,
    };
  });
};

export const mbkmData = generateMbkmDataset();
