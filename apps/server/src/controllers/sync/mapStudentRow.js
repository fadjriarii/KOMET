const { sanitizeProdiName, normalizeJenjang, isAkunLama } = require('./text');
const {
  getPeriodeFromTanggalTransfer,
  formatAngkatan,
  normalizeAcademicPeriod,
  extractPeriode,
  hitungSemester,
} = require('./academicPeriod');
const { isStatusKeluar, mapKewarganegaraan } = require('./codeMaps');
const { STUDENT_STATUS } = require('@komet/shared/constants');

/**
 * Satu baris API → satu baris DB. RULE 1–6 ETL mahasiswa; mengembalikan null
 * bila baris dilewati (NIM kosong). `prodiFakultasMap` dari
 * `getProdiFakultasMap()`, `resolveFakultas` dari sevimaLookup.
 */
function mapStudentRow(attr, prodiFakultasMap, resolveFakultas) {
  // ─── RULE 1: Filter NIM — buang record yang NIM-nya kosong ───
  const nim = (attr.nim || '').trim();
  if (!nim) return null;

  // ─── RULE 2: Normalisasi Nama Program Studi & Lookup Fakultas ───
  const rawProdi = attr.program_studi || '';
  const prodiName = sanitizeProdiName(rawProdi);
  const namaFakultas = resolveFakultas(attr, prodiName, prodiFakultasMap, attr.nama_fakultas);

  // ─── RULE 3: Angkatan & Periode Masuk — Khusus S2 gunakan tanggal_transfer jika ada (atau fallback ke id_periode) ───
  const jenjang = (attr.id_jenjang || 'S1').trim().toUpperCase();
  const tanggalTransfer = (attr.tanggal_transfer || '').trim();
  const periodeFromTransfer =
    jenjang === 'S2' && tanggalTransfer ? getPeriodeFromTanggalTransfer(tanggalTransfer) : '';
  const periodeMasuk = normalizeAcademicPeriod(periodeFromTransfer || attr.id_periode);

  // ─── RULE 4: Periode — field baru "Ganjil"/"Genap" dari digit ke-5 periodeMasuk ───
  const periode = extractPeriode(periodeMasuk);

  // Angkatan = label tahun ajaran masuk (contoh "2026/2027"): nilai
  // kanonis kolom `angkatan`, dihitung sekali di sini.
  const angkatan = formatAngkatan(periodeMasuk);

  // ─── RULE 5: Status Keaktifan & Semester — kalkulasi dinamis berdasarkan status ───
  const idStatus = (attr.id_status_mahasiswa || '').trim();
  const statusName = (attr.status_mahasiswa || '').trim();
  const periodeTerakhir = normalizeAcademicPeriod(attr.id_periode_terakhir);
  const isKeluar =
    isStatusKeluar(idStatus) || /lulus|drop\s*out|keluar|putus\s*studi|meninggal/i.test(statusName);

  let statusKeaktifan = statusName;
  if (!statusKeaktifan) {
    if (idStatus === 'L') statusKeaktifan = STUDENT_STATUS.LULUS;
    else if (idStatus === 'D') statusKeaktifan = 'Drop Out';
    else if (idStatus === 'C') statusKeaktifan = STUDENT_STATUS.CUTI;
    else if (idStatus === 'K') statusKeaktifan = 'Keluar';
    else if (idStatus === 'A') statusKeaktifan = STUDENT_STATUS.AKTIF;
    else statusKeaktifan = isKeluar ? STUDENT_STATUS.LULUS : STUDENT_STATUS.AKTIF;
  }

  // Gunakan periode terakhir untuk mahasiswa keluar maupun aktif bila tersedia;
  // jika kosong, helper memakai periode akademik berjalan sebagai fallback.
  const semesterAktif = hitungSemester(periodeMasuk, periodeTerakhir || null);

  // ─── RULE 6: Kewarganegaraan — konversi ke nama negara spesifik ───
  const kewarganegaraan = mapKewarganegaraan(attr.id_negara || '', attr.nama_negara || '');

  return {
    nim,
    nama: attr.nama || '',
    jenjang: normalizeJenjang(attr.id_jenjang || 'S1'),
    periodeMasuk,
    periodeTerakhir,
    angkatan,
    periode,
    programStudi: prodiName,
    fakultas: namaFakultas,
    statusKeaktifan,
    semester: semesterAktif,
    kewarganegaraan,
    nik: (attr.nik || '').trim(),
    tanggalLahir: (attr.tanggal_lahir || '').trim(),
    // Tandai SEBELUM sanitasi membuang labelnya — dedup butuh info ini.
    isAkunLama: isAkunLama(rawProdi),
  };
}

module.exports = { mapStudentRow };
