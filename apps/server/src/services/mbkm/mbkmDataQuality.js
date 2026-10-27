/**
 * mbkmDataQuality.js
 *
 * Panel Kualitas Data MBKM (`GET /api/mbkm/data-quality`): anomali data SEVIMA
 * yang memengaruhi angka, dalam satu bentuk `checks: [{ key, label, count, items }]`
 * supaya client cukup merender daftar. Tidak memuat NIM atau nama mahasiswa.
 */
const prisma = require('../../config/prisma');
const { STUDENT_STATUS } = require('@komet/shared/constants');
const { parsePeriode, toAcademicYear } = require('../../utils/academicUtils');
const { statusRuleOf, UNCLASSIFIED } = require('./statusRules');
const { mitraKey } = require('./population');

/** SKS konversi di atas ini hampir pasti salah input (satu semester ±20 SKS). */
const MAX_REASONABLE_SKS = 40;
const MAX_ITEMS = 20;

const check = (key, label, count, items = []) => ({ key, label, count, items });

/** Laporan sync MBKM terakhir yang selesai (duplikat feed, NIM tanpa mahasiswa). */
async function lastMbkmSync() {
  const runs = await prisma.syncRun.findMany({ orderBy: { id: 'desc' } });
  for (const run of runs) {
    const module = (run.modules || []).find(
      (entry) => entry.key === 'mbkm' && entry.status === 'completed',
    );
    if (module) return { finishedAt: run.finishedAt.toISOString(), report: module.report || null };
  }
  return { finishedAt: null, report: null };
}

function countBy(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

/** Grup nama mitra yang sama setelah dinormalisasi tetapi ditulis berbeda. */
function similarMitra(names) {
  const groups = new Map();
  for (const name of names) {
    const key = mitraKey(name);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, new Set());
    groups.get(key).add(name.trim());
  }
  return [...groups.values()]
    .filter((spellings) => spellings.size > 1)
    .map((spellings) => ({ name: [...spellings].sort().join(' / '), count: spellings.size }));
}

async function getMbkmDataQuality() {
  const [activities, exitWithoutPeriod, sync] = await Promise.all([
    prisma.mbkmActivity.findMany({
      select: {
        periode: true,
        jenisAktivitas: true,
        statusAktivitas: true,
        idStatusAktivitas: true,
        mitra: true,
        sksKonversi: true,
      },
    }),
    prisma.student.count({
      where: {
        periodeTerakhir: '',
        statusKeaktifan: { not: STUDENT_STATUS.AKTIF },
      },
    }),
    lastMbkmSync(),
  ]);

  const unclassified = activities.filter((a) => statusRuleOf(a).category === UNCLASSIFIED);
  const invalidPeriode = activities.filter((a) => !parsePeriode(a.periode));
  const participating = activities.filter((a) => statusRuleOf(a).category === 'participating');
  const withoutSks = countBy(
    participating
      .filter((a) => a.sksKonversi === null)
      .map((a) => toAcademicYear(a.periode) || '-'),
  ).sort((a, b) => b.name.localeCompare(a.name));
  const mitraGroups = similarMitra(activities.map((a) => a.mitra).filter(Boolean));
  const report = sync.report || {};

  return {
    lastSyncAt: sync.finishedAt,
    totalActivities: activities.length,
    checks: [
      check(
        'feedDuplicates',
        'Baris duplikat dari feed SEVIMA (dibuang saat sync)',
        report.feedDuplicates ?? null,
      ),
      check(
        'orphanActivities',
        'Aktivitas dengan NIM yang tidak ada di data mahasiswa',
        report.orphanActivities ?? null,
      ),
      check(
        'unclassifiedStatus',
        'Status aktivitas baru yang belum diklasifikasi',
        unclassified.length,
        countBy(unclassified.map((a) => a.statusAktivitas || '-')),
      ),
      check(
        'invalidPeriode',
        'Aktivitas dengan kode periode tidak valid',
        invalidPeriode.length,
        countBy(invalidPeriode.map((a) => a.periode || '(kosong)')),
      ),
      check(
        'emptyJenis',
        'Aktivitas tanpa jenis aktivitas',
        activities.filter((a) => !a.jenisAktivitas.trim()).length,
      ),
      check(
        'similarMitra',
        'Nama mitra yang mirip (ejaan berbeda)',
        mitraGroups.length,
        mitraGroups.slice(0, MAX_ITEMS),
      ),
      check(
        'unreasonableSks',
        `Aktivitas dengan SKS konversi > ${MAX_REASONABLE_SKS}`,
        activities.filter((a) => a.sksKonversi > MAX_REASONABLE_SKS).length,
      ),
      check(
        'participatingWithoutSks',
        'Aktivitas Disetujui/Selesai tanpa data SKS konversi',
        participating.filter((a) => a.sksKonversi === null).length,
        withoutSks,
      ),
      check(
        'exitWithoutPeriod',
        'Mahasiswa non-aktif tanpa periode akhir (tidak dihitung eligible)',
        exitWithoutPeriod,
      ),
    ],
  };
}

module.exports = { getMbkmDataQuality, MAX_REASONABLE_SKS };
