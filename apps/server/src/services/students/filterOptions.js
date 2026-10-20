const prisma = require('../../config/prisma');
const { createFilterOptionsSource, numericAsc } = require('../filterOptionsSource');
const { buildStudentFilter } = require('./filterBuilder');
const {
  toAcademicYear,
  get5YearRollingAcademicYears,
  getAcademicYearStart,
} = require('../../utils/academicUtils');
const { formatAcademicYearLabel } = require('@komet/shared/academicYear');
const { STUDENT_STATUS } = require('@komet/shared/constants');

const studentQueries = {
  fakultas: { model: 'student', field: 'fakultas', byCount: true },
  programStudi: { model: 'student', field: 'programStudi', byCount: true },
  angkatan: { model: 'student', field: 'angkatan', desc: true },
  semester: { model: 'student', field: 'semester', comparator: numericAsc },
  periodeMasuk: { model: 'student', field: 'periodeMasuk', desc: true },
  kewarganegaraan: { model: 'student', field: 'kewarganegaraan' },
  statusKeaktifan: { model: 'student', field: 'statusKeaktifan' },
  jenjang: { model: 'student', field: 'jenjang' },
};

function deriveStudentOptions({ angkatan, semester, periodeMasuk }, { selectedStart } = {}) {
  const rollingYears = getRollingYears(angkatan, selectedStart ?? null);
  return {
    rollingYears,
    customYearMeta: getCustomYearMeta(rollingYears),
    academicYears: [...new Set(periodeMasuk.map((value) => toAcademicYear(value)).filter(Boolean))]
      .sort()
      .reverse(),
    nationalityOptions: [
      { value: 'WNI', label: 'WNI' },
      { value: 'WNA', label: 'WNA' },
    ],
    periodeOptions: [
      { value: 'Ganjil', label: 'Ganjil' },
      { value: 'Genap', label: 'Genap' },
    ],
    // Dropdown Tahun Ajaran mengikuti tahun akademik terbaru yang benar-benar
    // tersedia di database, sehingga otomatis bergeser setelah sync Sevima.
    academicYearOptions: get5YearRollingAcademicYears(
      periodeMasuk.map((value) => toAcademicYear(value)).filter(Boolean),
    ).reverse(),
    semesterOptions: getSemesterOptions(semester),
  };
}

function getSemesterOptions(values) {
  // Daftar tetap 1–8 (masa studi normal); 9+ menampung yang molor tanpa
  // memenuhi dropdown. 9+ hanya muncul bila ada datanya di database.
  const options = Array.from({ length: 8 }, (_, index) => ({
    value: String(index + 1),
    label: `Semester ${index + 1}`,
  }));
  if (values.map(Number).some((value) => Number.isInteger(value) && value > 8)) {
    options.push({ value: '9+', label: 'Semester 9+' });
  }
  return options;
}

function getRollingYears(values, selectedStart = null) {
  // Kolom sudah menyimpan label ajaran; rolling dibaca verbatim dari data,
  // tanpa mem-parsing tahun mentah di mana pun. Bila tahun ajaran terpilih,
  // jendela 5 tahun mundur mengikuti tahun itu (bukan data terbaru).
  const labels = [...new Set(values.map(String).filter(Boolean))].sort().reverse();
  const eligible =
    selectedStart === null
      ? labels
      : labels.filter((label) => getAcademicYearStart(label) <= selectedStart);
  return eligible.slice(0, 5);
}

/**
 * Metadata input tahun ajaran kustom penuh ("2021/2022") untuk satu kolom
 * label: batas bawah statis, batas atas = label tertua rolling − 1, plus teks
 * bantuan siap tampil. Frontend hanya merender metadata ini.
 */
function getCustomYearMeta(rollingLabels, minLabel = '2014/2015') {
  const oldest = [...rollingLabels].sort()[0] || null;
  const maxStart = oldest ? Number(oldest.slice(0, 4)) - 1 : null;
  return {
    minLabel,
    maxLabel: maxStart ? formatAcademicYearLabel(maxStart) : null,
    placeholder: maxStart ? formatAcademicYearLabel(maxStart) : minLabel,
    helperText: maxStart
      ? `Tahun ajaran lama tidak ada di atas? Ketik tahun ajaran ${minLabel}–${formatAcademicYearLabel(maxStart)}.`
      : `Ketik tahun ajaran mulai ${minLabel}.`,
    errorText: maxStart
      ? `Hanya ${minLabel}–${formatAcademicYearLabel(maxStart)}.`
      : `Hanya mulai ${minLabel}.`,
  };
}

const studentFilterOptions = createFilterOptionsSource({
  queries: studentQueries,
  derive: deriveStudentOptions,
});

/**
 * Urutkan daftar nilai mengikuti hitungan populasi aktif tahun terpilih
 * (terbanyak dulu; yang tak punya hitungan tetap ada di belakang, alfabetis
 * — opsi tidak boleh hilang hanya karena tahun itu sepi).
 */
function applyCountOrder(values, countedNames) {
  const ranked = countedNames.filter((name) => values.includes(name));
  const rest = values.filter((name) => !countedNames.includes(name)).sort();
  return [...ranked, ...rest];
}

/** Tahun ajaran efektif: yang diminta bila valid, kalau tidak yang terbaru di data. */
async function resolveEffectiveYear(selectedYear) {
  const start = typeof selectedYear === 'string' ? getAcademicYearStart(selectedYear) : null;
  if (start !== null) return selectedYear;
  const latest = await prisma.student.aggregate({ _max: { periodeMasuk: true } });
  return toAcademicYear(latest._max.periodeMasuk);
}

/**
 * Nama fakultas/prodi terurut menurut populasi AKTIF tahun terpilih (definisi
 * sama dengan kartu KPI aktif) — bukan total sepanjang masa semua status.
 */
async function getActiveCountsOrder(tahunAjaran) {
  const where = buildStudentFilter({ statusKeaktifan: 'Aktif', tahunAjaran });
  const [byFaculty, byProdi] = await Promise.all([
    prisma.student.groupBy({ by: ['fakultas'], where, _count: { fakultas: true } }),
    prisma.student.groupBy({ by: ['programStudi'], where, _count: { programStudi: true } }),
  ]);
  const rank = (rows, field) =>
    rows
      .sort(
        (a, b) =>
          b._count[field] - a._count[field] || String(a[field]).localeCompare(String(b[field])),
      )
      .map((row) => row[field])
      .filter(Boolean);
  return { fakultas: rank(byFaculty, 'fakultas'), programStudi: rank(byProdi, 'programStudi') };
}

module.exports = {
  getFilterOptions: async (selectedYear) => {
    const start = typeof selectedYear === 'string' ? getAcademicYearStart(selectedYear) : null;
    const base = await studentFilterOptions.getFilterOptions(false, { selectedStart: start });
    // Cuti tidak selalu ada di DB (mis. sebelum sync pertama), tetapi opsinya
    // harus tetap tersedia. Urutan tetap: Aktif, Cuti, lalu status lain.
    const otherStatuses = base.statusKeaktifan
      .filter((status) => status !== STUDENT_STATUS.AKTIF && status !== STUDENT_STATUS.CUTI)
      .sort();
    const withCuti = {
      ...base,
      statusKeaktifan: [STUDENT_STATUS.AKTIF, STUDENT_STATUS.CUTI, ...otherStatuses],
    };
    const effectiveYear = start !== null ? selectedYear : await resolveEffectiveYear(null);
    if (!effectiveYear) return withCuti;
    const order = await getActiveCountsOrder(effectiveYear);
    return {
      ...withCuti,
      fakultas: applyCountOrder(base.fakultas, order.fakultas),
      programStudi: applyCountOrder(base.programStudi, order.programStudi),
    };
  },
  clearFilterCache: studentFilterOptions.clearFilterCache,
  // Dipakai ulang tab Graduate untuk rolling tahun/angkatan — satu implementasi.
  getRollingYears,
  getCustomYearMeta,
  applyCountOrder,
};
