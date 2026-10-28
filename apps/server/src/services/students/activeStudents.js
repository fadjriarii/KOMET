/**
 * activeStudents.js
 *
 * Menghitung total mahasiswa aktif dan breakdown multisektor untuk modal rincian.
 */

const prisma = require('../../config/prisma');
const { ensurePopulationFilter } = require('./filterBuilder');
const { getRequestedAcademicYear, projectSnapshotStudent } = require('./studentSnapshot');
const { isForeignStudent } = require('./international/nationality');
const { rate } = require('../../utils/percentageUtils');
const { getBounded5YearRollingAcademicYears } = require('../../utils/academicUtils');
const { getSelectedAcademicYear } = require('./filterBuilder');

/**
 * Hitung total mahasiswa aktif sesuai base filter.
 */
async function getTotalActiveStudents(baseFilter) {
  return prisma.student.count({
    where: ensurePopulationFilter(baseFilter),
  });
}

const JENJANG_LABELS = { S1: 'Sarjana (S1)', S2: 'Magister (S2)' };

const byCountDesc = (a, b) => b.count - a.count || a.name.localeCompare(b.name);
const byNameDesc = (a, b) => b.name.localeCompare(a.name);
const bySemesterAsc = (a, b) =>
  Number(a.name.replace(/\D/g, '')) - Number(b.name.replace(/\D/g, ''));

/** Dimensi rincian: kunci respons → nama tampilan baris + urutan. */
const DIMENSIONS = {
  byStatus: { label: (row) => row.statusKeaktifan, sort: byCountDesc },
  byFaculty: { label: (row) => row.fakultas, sort: byCountDesc },
  byProdi: { label: (row) => row.programStudi, sort: byCountDesc },
  byJenjang: { label: (row) => JENJANG_LABELS[row.jenjang] || row.jenjang, sort: byCountDesc },
  byAngkatan: { label: (row) => row.angkatan, sort: byNameDesc },
  bySemester: {
    label: (row) => (Number(row.semester) > 0 ? `Semester ${row.semester}` : null),
    sort: bySemesterAsc,
  },
  byNationality: { label: (row) => (isForeignStudent(row) ? 'WNA' : 'WNI'), sort: byCountDesc },
};

/**
 * Kelompokkan baris (status sudah diproyeksi ke tahun terpilih) per dimensi.
 * Tiap item membawa `byStatus` supaya modal bisa menumpuk bar per status.
 */
function groupStudentRows(rows, selectedAcademicYear = null) {
  const total = rows.length;
  const statusCounts = new Map();
  for (const row of rows) {
    const status = row.statusKeaktifan || 'Lainnya';
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
  }
  const statuses = [...statusCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([status]) => status);

  const result = { totalActiveStudents: total, statuses };
  for (const [key, { label, sort }] of Object.entries(DIMENSIONS)) {
    const groups = new Map();
    for (const row of rows) {
      const name = label(row) || 'Lainnya';
      const status = row.statusKeaktifan || 'Lainnya';
      const group = groups.get(name) || { name, count: 0, byStatus: {} };
      group.count += 1;
      group.byStatus[status] = (group.byStatus[status] || 0) + 1;
      groups.set(name, group);
    }
    result[key] = [...groups.values()]
      .map((group) => ({ ...group, percentage: rate(group.count, total) }))
      .sort(sort);
  }
  // Chart per tahun ajaran = jendela 5 tahun mundur dari tahun terpilih, sama
  // seperti tren intake/internasional; angkatan lebih lama tidak ditampilkan.
  if (selectedAcademicYear) {
    const window = new Set(getBounded5YearRollingAcademicYears([selectedAcademicYear]));
    result.byAngkatan = result.byAngkatan.filter((item) => window.has(item.name));
  }
  return result;
}

/**
 * Breakdown multisektor mahasiswa sesuai filter untuk ActiveStudentsModal.
 * Status per tahun lampau hanya bisa diproyeksi di JS (lihat getSnapshotStatus),
 * jadi baris diambil dengan kolom sempit lalu dikelompokkan di memori.
 * shortcut: agregasi di memori, aman untuk ribuan baris; pindah ke SQL bila populasi > ~50 ribu.
 */
async function getActiveStudentsMultisector(baseFilter, query = {}) {
  const rows = await prisma.student.findMany({
    where: ensurePopulationFilter(baseFilter),
    select: {
      angkatan: true,
      periodeMasuk: true,
      periodeMasukAwal: true,
      periodeTerakhir: true,
      programStudi: true,
      fakultas: true,
      jenjang: true,
      semester: true,
      kewarganegaraan: true,
      idNegara: true,
      statusKeaktifan: true,
      cutiPeriods: { select: { periode: true } },
    },
  });
  const academicYear = getRequestedAcademicYear(query);
  return groupStudentRows(
    rows.map((row) =>
      projectSnapshotStudent(row, academicYear, query.statusKeaktifan, query.periodeAkademik),
    ),
    getSelectedAcademicYear(query),
  );
}

module.exports = { getTotalActiveStudents, getActiveStudentsMultisector, groupStudentRows };
