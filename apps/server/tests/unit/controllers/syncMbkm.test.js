import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const prisma = require('../../../src/config/prisma');
const {
  mapMbkmRow,
  dedupeMbkmRows,
  sumSksByActivity,
} = require('../../../src/controllers/sync/mapMbkmRow');
const { dedupeMbkmByIdentity } = require('../../../src/services/mbkm/dedupeActivities');
const { buildMbkmRows } = require('../../../src/controllers/sync/writeMbkmPage');
const { replaceMbkmActivities } = require('../../../src/controllers/sync/bulkWrite');
const { statusRuleOf } = require('../../../src/services/mbkm/statusRules');

const originals = {
  findMany: prisma.student.findMany,
  createMany: prisma.student.createMany,
  transaction: prisma.$transaction,
};
afterEach(() => {
  prisma.student.findMany = originals.findMany;
  prisma.student.createMany = originals.createMany;
  prisma.$transaction = originals.transaction;
});

const attr = (overrides = {}) => ({
  id_aktivitas: 2726,
  nim: '2101001',
  nama_mahasiswa: 'Mahasiswa',
  id_jenjang_program_studi: 'S1',
  id_periode: '20261',
  program_studi: 'Bio Teknologi',
  id_jenis_kegiatan: 'A03',
  jenis_kegiatan: 'Magang/Praktik Kerja (Kampus Merdeka)',
  judul_aktivitas: 'Magang',
  nama_mitra: 'PT Mitra',
  id_status_aktivitas: '2',
  status_aktivitas: ' Disetujui ',
  tanggal_mulai: '2026-09-30 00:00:00',
  tanggal_selesai: '2027-01-15',
  nama_pembimbing: '',
  ...overrides,
});

describe('mapMbkmRow', () => {
  it('menyimpan id, kode, tanggal, status ter-trim, dan baris mentah', () => {
    const row = mapMbkmRow(attr(), new Map());
    expect(row).toMatchObject({
      idAktivitas: 2726,
      periode: '20261',
      idJenisKegiatan: 'A03',
      statusAktivitas: 'Disetujui',
      idStatusAktivitas: '2',
      tanggalMulai: '2026-09-30',
      tanggalSelesai: '2027-01-15',
      jenjang: 'S1',
    });
    expect(row.raw.nama_pembimbing).toBe('');
  });

  it('jenjang kosong tidak dipaksa S1; baris tanpa jenis dibuang', () => {
    expect(mapMbkmRow(attr({ id_jenjang_program_studi: '' }), new Map()).jenjang).toBe('');
    expect(mapMbkmRow(attr({ jenis_kegiatan: '' }), new Map())).toBeNull();
  });
});

describe('dedupeMbkmRows dan sumSksByActivity', () => {
  it('satu baris per (idAktivitas, nim); aktivitas kelompok tetap per mahasiswa', () => {
    const rows = [
      { idAktivitas: 1, nim: 'A' },
      { idAktivitas: 1, nim: 'A' },
      { idAktivitas: 1, nim: 'B' },
      { idAktivitas: null, nim: 'C' },
      { idAktivitas: null, nim: 'C' },
    ];
    const { rows: unique, duplicates } = dedupeMbkmRows(rows);
    expect(unique).toHaveLength(4);
    expect(duplicates).toBe(1);
  });

  it('menjumlahkan sks_mata_kuliah per id_aktivitas', () => {
    const totals = sumSksByActivity([
      { id_aktivitas: 9, sks_mata_kuliah: '14' },
      { id_aktivitas: 9, sks_mata_kuliah: '6' },
      { id_aktivitas: 10, sks_mata_kuliah: 'x' },
    ]);
    expect(totals.get(9)).toBe(20);
    expect(totals.has(10)).toBe(false);
  });
});

describe('dedupeMbkmByIdentity', () => {
  const row = (overrides = {}) => ({
    idAktivitas: 1,
    nim: '2101001',
    periode: '20241',
    programStudi: 'Bio Teknologi',
    fakultas: 'Fakultas',
    jenjang: 'S1',
    statusKeaktifan: 'Aktif',
    jenisAktivitas: 'Magang/Praktik Kerja (Kampus Merdeka)',
    idJenisKegiatan: 'A03',
    judulAktivitas: 'Magang',
    mitra: 'PT Mitra',
    statusAktivitas: 'Disetujui',
    idStatusAktivitas: '2',
    tanggalMulai: '2024-01-01',
    tanggalSelesai: '2024-06-30',
    sksKonversi: 20,
    raw: { program_studi: 'Bio Teknologi' },
    ...overrides,
  });

  it('membersihkan NIM xx dan teks akun lama, termasuk di raw', () => {
    const result = dedupeMbkmByIdentity([
      row({
        nim: 'XX2101001',
        programStudi: 'Bio Teknologi (Akun Lama)',
        raw: { program_studi: 'Bio Teknologi (Akun Lama)', catatan: 'akun lama' },
      }),
    ]);

    expect(result).toMatchObject({ total: 1, kept: 1, discarded: 0, oldAccountRows: 1 });
    expect(result.rows[0].nim).toBe('2101001');
    expect(result.rows[0].programStudi).toBe('Bio Teknologi');
    expect(JSON.stringify(result.rows)).not.toMatch(/akun lama/i);
  });

  it('satu NIM + BKP + Mitra sama: pilih data paling lengkap', () => {
    const result = dedupeMbkmByIdentity([
      row({ idAktivitas: 1, nim: 'XX2101001', sksKonversi: null, judulAktivitas: '' }),
      row({ idAktivitas: 2, nim: '2101001', sksKonversi: 20 }),
    ]);

    expect(result).toMatchObject({ total: 2, kept: 1, discarded: 1 });
    expect(result.rows[0].idAktivitas).toBe(2);
  });

  it('kelengkapan sama: pilih tanggal selesai terbaru', () => {
    const result = dedupeMbkmByIdentity([
      row({ idAktivitas: 1, tanggalSelesai: '2024-06-30' }),
      row({ idAktivitas: 2, tanggalSelesai: '2025-06-30' }),
    ]);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].idAktivitas).toBe(2);
  });

  it('BKP atau Mitra berbeda: pertahankan semua sub-group', () => {
    const result = dedupeMbkmByIdentity([
      row({ idAktivitas: 1, mitra: 'PT A' }),
      row({ idAktivitas: 2, mitra: 'PT B' }),
      row({ idAktivitas: 3, jenisAktivitas: 'Studi Independen' }),
    ]);

    expect(result).toMatchObject({ total: 3, kept: 3, discarded: 0 });
    expect(result.rows.map((item) => item.idAktivitas).sort()).toEqual([1, 2, 3]);
  });
});

describe('statusRuleOf', () => {
  it('kode SEVIMA dulu, label sebagai cadangan; status baru = unclassified', () => {
    expect(statusRuleOf({ idStatusAktivitas: '5', statusAktivitas: 'apa saja' }).category).toBe(
      'participating',
    );
    expect(statusRuleOf({ statusAktivitas: ' diajukan ' }).category).toBe('pending');
    expect(statusRuleOf({ idStatusAktivitas: '9', statusAktivitas: 'Ditunda' })).toMatchObject({
      category: 'unclassified',
      rank: 0,
      label: 'Ditunda',
    });
  });
});

describe('buildMbkmRows', () => {
  it('NIM tak dikenal tidak membuat mahasiswa dan dihitung yatim; SKS ikut', async () => {
    prisma.student.findMany = vi.fn(async ({ where }) =>
      where.nim.in.includes('2101001') ? [{ nim: '2101001', statusKeaktifan: 'Aktif' }] : [],
    );
    prisma.student.createMany = vi.fn();
    const known = mapMbkmRow(attr(), new Map());
    const orphan = mapMbkmRow(attr({ nim: '9999999', id_aktivitas: 3000 }), new Map());

    const { rows, orphans } = await buildMbkmRows([known, orphan], new Map([[2726, 20]]));

    expect(prisma.student.createMany).not.toHaveBeenCalled();
    expect(orphans).toBe(1);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ nim: '2101001', statusKeaktifan: 'Aktif', sksKonversi: 20 });
  });
});

describe('replaceMbkmActivities', () => {
  it('hapus dan isi ulang di dalam satu transaksi', async () => {
    const tx = { mbkmActivity: { deleteMany: vi.fn(), createMany: vi.fn() } };
    prisma.$transaction = vi.fn(async (fn) => fn(tx));
    const row = { ...mapMbkmRow(attr(), new Map()), nim: '2101001', sksKonversi: 20 };

    await expect(replaceMbkmActivities([row])).resolves.toBe(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.mbkmActivity.deleteMany).toHaveBeenCalledTimes(1);
    expect(tx.mbkmActivity.createMany.mock.calls[0][0].data[0]).toMatchObject({
      idAktivitas: 2726,
      sksKonversi: 20,
      tanggalMulai: '2026-09-30',
    });
  });

  it('gagal di tengah = transaksi melempar, tidak ada penulisan di luar transaksi', async () => {
    prisma.$transaction = vi.fn(async () => {
      throw new Error('rollback');
    });
    await expect(replaceMbkmActivities([{ nim: 'A' }])).rejects.toThrow('rollback');
  });
});
