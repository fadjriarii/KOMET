import { STUDENT_STATUS } from '@komet/shared/constants';

/**
 * Default kartu mahasiswa adalah "hanya Aktif". Urutan atau duplikat pilihan tidak
 * boleh mengubah arti — `status.join() !== 'Aktif'` yang lama bergantung pada
 * keduanya, dan satu nilai default dinyatakan dua kali di file ini.
 */
function isDefaultStatusSelection(status) {
  if (status === undefined || status === null) return true;
  const values = new Set(Array.isArray(status) ? status : [status]);
  return values.size === 1 && values.has(STUDENT_STATUS.AKTIF);
}

/**
 * Menghitung jumlah filter aktif pada form StudentFilterContainer:
 * search, fakultas, prodi, jenjang, angkatan rolling, semester, kewarganegaraan,
 * status keaktifan (hitung hanya bila menyimpang dari default 'Aktif'), dan
 * periode masuk.
 */
export function getStudentActiveFilterCount(values = {}) {
  return [
    values.search,
    values.faculty?.length,
    values.prodi?.length,
    values.jenjang?.length,
    values.selectedYears?.length,
    values.semester?.length,
    values.nationality,
    !isDefaultStatusSelection(values.status),
    values.periode,
  ].filter(Boolean).length;
}
