const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const { dedupeMbkmByIdentity } = require('./mbkm/dedupeActivities');
const { STUDENT_STATUS } = require('@komet/shared/constants');

/**
 * Service Deduplikasi Terpadu (Students, Graduates, & MBKM)
 *
 * Empat tahap, berurutan:
 * P. Prune: NIM di DB yang tidak ada di payload API terakhir berarti basi
 *    (mis. mahasiswa dinomor-ulang SEVIMA). Relink relasi ke kembarannya bila
 *    ketemu, selain itu hapus (FK cascade ikut membersihkan anaknya).
 * A. Akun lama `x`/`XX`: grup by NIM-bersih SAJA (tanpa nama — nama legacy
 *    vs baru sering beda ejaan). Bila ada kembaran tanpa-x, yang ber-x dibuang.
 *    Bila tidak ada kembarannya, satu record dipakai dengan NIM hasil hapus-x.
 * B. Orang yang sama, NIM berbeda: dikenali lewat NIK valid ATAU nama +
 *    tanggal lahir yang dinormalisasi, untuk SEMUA jenjang. Yang dibuang hanya
 *    record bertanda akun-lama yang punya kembaran se-jenjang berstatus studi
 *    nyata (bukan Transfer/Mutasi) — dua enrollment paralel yang sah (mis. S1 +
 *    Profesi) tidak pernah digabung.
 * C. NIM lama yang masih Aktif padahal NIM barunya sudah Lulus: dicocokkan
 *    lewat nama + jenjang + kode prodi dan periode wisuda yang sama. NIK/tanggal
 *    lahir lama sering berbeda, jadi tidak bisa mengandalkan tahap B.
 */
function normNama(value) {
  return (value || '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().toLowerCase();
}

function nimBersih(value) {
  return (value || '').toLowerCase().trim().replace(/x/g, '');
}

function validNik(value) {
  const nik = (value || '').trim();
  return nik.length === 16 && /^\d+$/.test(nik) && new Set(nik).size > 2 ? nik : '';
}

/** Status akhir yang BUKAN riwayat studi di sini — kembaran berstatus ini tidak
 *  boleh menggusur record lama (menyelamatkan lulusan asli). */
function isStatusPindah(status) {
  return /^(transfer|mutasi)$/i.test((status || '').trim());
}

/** Identitas studi untuk mencocokkan NIM lama dengan NIM hasil re-numbering. */
function studiKey(student) {
  const prodi =
    (student.kodeProgramStudi || '').replace(/x/gi, '').trim() || normNama(student.programStudi);
  return [normNama(student.nama), (student.jenjang || '').trim().toLowerCase(), prodi].join('|');
}

/**
 * NIM lama yang sudah digantikan NIM baru yang lulus. NIK/tanggal lahir bisa
 * berbeda karena data lama, jadi kuncinya nama + jenjang + prodi, dan harus
 * dikonfirmasi periode wisuda kembarannya sama dengan periode terakhir NIM lama.
 */
function isLegacyGraduatedTwin(legacy, twin, graduate) {
  if (!legacy || !twin || !graduate) return false;
  if (!legacy.isAkunLama || legacy.statusKeaktifan !== STUDENT_STATUS.AKTIF) return false;
  if (twin.nim === legacy.nim || twin.isAkunLama) return false;
  if (studiKey(legacy) !== studiKey(twin)) return false;
  const lastPeriod = (legacy.periodeTerakhir || '').trim();
  return Boolean(lastPeriod) && lastPeriod === (graduate.periodeWisuda || '').trim();
}

function personKeys(student) {
  const keys = [];
  const nik = validNik(student.nik);
  if (nik) keys.push(`NIK:${nik}`);
  const nama = normNama(student.nama);
  const lahir = (student.tanggalLahir || '').trim();
  if (nama && lahir) keys.push(`Lahir:${nama}|${lahir}`);
  return keys;
}

/** Survivor utama dulu: NIM bersih dari x, lalu bukan akun-lama, lalu updatedAt
 * terbaru. Urutan dua pertama tidak boleh tertukar: baris ber-x adalah shell
 * lama (aturan A) — ia kalah dari data baru tanpa-x MESKIPUN data baru itu
 * berlabel "(Akun Lama)" (kasus 16010010: Lulus vs shell Transfer). */
function survivorFirst(a, b) {
  const aHasX = /x/i.test(a.nim || '');
  const bHasX = /x/i.test(b.nim || '');
  if (aHasX !== bHasX) return aHasX ? 1 : -1;
  if (!!a.isAkunLama !== !!b.isAkunLama) return a.isAkunLama ? 1 : -1;
  return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
}

async function deduplicateStudents({ pruneNims = null } = {}) {
  logger.info('🧹 Memulai proses deduplikasi terpadu (Students, Graduates, MBKM) di memori...');

  // 1. Ambil seluruh data mahasiswa secara bertahap (batch chunking 500 per iterasi) untuk skalabilitas
  const allStudents = [];
  let cursor = null;
  const CHUNK_SIZE = 500;
  let hasMore = true;

  while (hasMore) {
    const queryOptions = {
      take: CHUNK_SIZE,
      orderBy: { nim: 'asc' },
    };

    if (cursor) {
      queryOptions.skip = 1;
      queryOptions.cursor = { nim: cursor };
    }

    const chunk = await prisma.student.findMany(queryOptions);
    if (chunk.length === 0) break;

    allStudents.push(...chunk);
    cursor = chunk[chunk.length - 1].nim;

    if (chunk.length < CHUNK_SIZE) {
      hasMore = false;
    }
  }
  const totalStudentsCount = allStudents.length;
  logger.info(`📦 Berhasil memproses ${totalStudentsCount} data mahasiswa dari database.`);

  const byNim = new Map(allStudents.map((s) => [s.nim, s]));
  const studentNimsToDelete = new Set();
  const relinkPlan = []; // { fromNim, toNim }
  let relinkedGraduatesCount = 0;
  let relinkedMbkmCount = 0;

  const markDeleted = (fromNim, toNim) => {
    if (fromNim === toNim || studentNimsToDelete.has(fromNim)) return;
    studentNimsToDelete.add(fromNim);
    if (toNim && byNim.has(toNim)) relinkPlan.push({ fromNim, toNim });
  };

  // ---- Tahap P: prune NIM basi (tidak dikembalikan API terakhir) ----
  let prunedStudentsCount = 0;
  if (pruneNims) {
    const fresh = new Set([...pruneNims].map((nim) => String(nim)));
    const stale = allStudents.filter((s) => !fresh.has(s.nim));
    // Kelompokkan sesama basi + yang segar lewat kunci orang yang sama.
    const personIndex = new Map();
    for (const s of allStudents) {
      for (const key of personKeys(s)) {
        if (!personIndex.has(key)) personIndex.set(key, []);
        personIndex.get(key).push(s);
      }
    }
    for (const s of stale) {
      const twins = new Set();
      for (const key of personKeys(s)) {
        for (const cand of personIndex.get(key) || []) {
          if (cand.nim !== s.nim && fresh.has(cand.nim)) twins.add(cand);
        }
      }
      const ordered = [...twins].sort(survivorFirst);
      markDeleted(s.nim, ordered.length ? ordered[0].nim : null);
      prunedStudentsCount++;
    }
    if (prunedStudentsCount > 0) {
      logger.info(`🧹 Prune: ${prunedStudentsCount} NIM basi tidak ada di API terakhir.`);
    }
  }

  // ---- Tahap A: akun lama x/XX — grup by NIM-bersih saja ----
  const cleanGroups = new Map();
  for (const s of allStudents) {
    if (studentNimsToDelete.has(s.nim)) continue;
    const key = nimBersih(s.nim);
    if (!cleanGroups.has(key)) cleanGroups.set(key, []);
    cleanGroups.get(key).push(s);
  }
  for (const group of cleanGroups.values()) {
    if (group.length < 2) continue;
    const ordered = [...group].sort(survivorFirst);
    const survivor = ordered[0];
    for (const dup of ordered.slice(1)) markDeleted(dup.nim, survivor.nim);
  }
  // Akun-x tanpa kembaran di API: dipakai dengan NIM hasil hapus-x (salin ke
  // NIM bersih, pindahkan relasi, hapus yang ber-x).
  for (const group of cleanGroups.values()) {
    if (group.length !== 1) continue;
    const [sole] = group;
    const clean = sole.nim.replace(/x/gi, '');
    if (!clean || clean === sole.nim || byNim.has(clean)) continue;
    await prisma.$transaction(async (tx) => {
      await tx.student.create({
        data: {
          nim: clean,
          nama: sole.nama,
          jenjang: sole.jenjang,
          periodeMasuk: sole.periodeMasuk,
          periodeTerakhir: sole.periodeTerakhir,
          angkatan: sole.angkatan,
          periode: sole.periode,
          programStudi: sole.programStudi,
          fakultas: sole.fakultas,
          kodeProgramStudi: sole.kodeProgramStudi,
          idNegara: sole.idNegara,
          statusKeaktifan: sole.statusKeaktifan,
          semester: sole.semester,
          kewarganegaraan: sole.kewarganegaraan,
          nik: sole.nik,
          tanggalLahir: sole.tanggalLahir,
          isAkunLama: false,
        },
      });
      await tx.graduate.updateMany({ where: { nim: sole.nim }, data: { nim: clean } });
      const mbkmRes = await tx.mbkmActivity.updateMany({
        where: { nim: sole.nim },
        data: { nim: clean },
      });
      relinkedMbkmCount += mbkmRes.count;
    });
    studentNimsToDelete.add(sole.nim);
  }

  // ---- Tahap B: orang yang sama lintas NIM (semua jenjang) ----
  // Union-find lewat kunci orang, lalu dalam tiap cluster hanya record
  // bertanda akun-lama yang dibuang — dan hanya bila ada kembaran se-jenjang
  // yang statusnya studi nyata (bukan Transfer/Mutasi).
  const parent = new Map();
  const find = (x) => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r);
    parent.set(x, parent.get(r));
    return r;
  };
  const alive = allStudents.filter((s) => !studentNimsToDelete.has(s.nim));
  for (const s of alive) parent.set(s.nim, s.nim);
  const keyIndex = new Map();
  for (const s of alive) {
    for (const key of personKeys(s)) {
      if (!keyIndex.has(key)) keyIndex.set(key, []);
      keyIndex.get(key).push(s.nim);
    }
  }
  for (const nims of keyIndex.values()) {
    const uniq = [...new Set(nims)];
    for (const other of uniq.slice(1)) {
      const ra = find(uniq[0]);
      const rb = find(other);
      if (ra !== rb) parent.set(rb, ra);
    }
  }
  const clusters = new Map();
  for (const s of alive) {
    const root = find(s.nim);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root).push(s);
  }
  for (const group of clusters.values()) {
    if (group.length < 2) continue;
    for (const legacy of group.filter((s) => s.isAkunLama)) {
      const twin = group
        .filter(
          (s) =>
            s.nim !== legacy.nim &&
            !s.isAkunLama &&
            (s.jenjang || '').toLowerCase().trim() ===
              (legacy.jenjang || '').toLowerCase().trim() &&
            !isStatusPindah(s.statusKeaktifan),
        )
        .sort(survivorFirst)[0];
      // Tanpa kembaran studi-nyata (atau kembarannya justru pindahan), record
      // lama dipakai — data lulus aslinya tidak boleh ikut terbuang.
      if (twin) markDeleted(legacy.nim, twin.nim);
    }
  }

  // ---- Tahap C: NIM lama yang sudah digantikan NIM baru yang lulus ----
  // Re-numbering bisa meninggalkan NIM lama tetap "Aktif" di SEVIMA. NIK dan
  // tanggal lahir lama sering berbeda, jadi konfirmasi lewat nama + jenjang +
  // prodi + periode wisuda, bukan menebak dari nama saja.
  const graduates = await prisma.graduate.findMany({
    select: { nim: true, periodeWisuda: true },
  });
  const graduateByNim = new Map(graduates.map((g) => [g.nim, g]));
  const aliveAfterB = allStudents.filter((s) => !studentNimsToDelete.has(s.nim));
  const graduatedTwinsByKey = new Map();
  for (const s of aliveAfterB) {
    if (s.isAkunLama || !graduateByNim.has(s.nim)) continue;
    const key = studiKey(s);
    if (!graduatedTwinsByKey.has(key)) graduatedTwinsByKey.set(key, []);
    graduatedTwinsByKey.get(key).push(s);
  }

  let reconciledLegacyCount = 0;
  for (const legacy of aliveAfterB) {
    if (!legacy.isAkunLama || legacy.statusKeaktifan !== STUDENT_STATUS.AKTIF) continue;
    const twin = (graduatedTwinsByKey.get(studiKey(legacy)) || [])
      .filter((candidate) =>
        isLegacyGraduatedTwin(legacy, candidate, graduateByNim.get(candidate.nim)),
      )
      .sort(survivorFirst)[0];
    if (!twin) continue;
    markDeleted(legacy.nim, twin.nim);
    reconciledLegacyCount++;
  }
  if (reconciledLegacyCount > 0) {
    logger.info(`🎓 ${reconciledLegacyCount} NIM lama digabung ke NIM lulusannya.`);
  }

  // ---- Eksekusi: relink anak ke survivor, lalu hapus duplikat ----
  for (const { fromNim, toNim } of relinkPlan) {
    await prisma.$transaction(async (tx) => {
      const duplicateGraduate = await tx.graduate.findUnique({ where: { nim: fromNim } });
      if (duplicateGraduate) {
        const survivorGraduate = await tx.graduate.findUnique({ where: { nim: toNim } });
        if (!survivorGraduate) {
          await tx.graduate.update({ where: { id: duplicateGraduate.id }, data: { nim: toNim } });
          relinkedGraduatesCount++;
        } else {
          await tx.graduate.delete({ where: { id: duplicateGraduate.id } });
        }
      }
      const mbkmRes = await tx.mbkmActivity.updateMany({
        where: { nim: fromNim },
        data: { nim: toNim },
      });
      relinkedMbkmCount += mbkmRes.count;
    });
  }

  let deletedStudentsCount = 0;
  if (studentNimsToDelete.size > 0) {
    const deleteRes = await prisma.student.deleteMany({
      where: { nim: { in: [...studentNimsToDelete] } },
    });
    deletedStudentsCount = deleteRes.count;
    logger.success(`🗑️ Berhasil menghapus ${deletedStudentsCount} record mahasiswa duplikat/basi.`);
  } else {
    logger.info('✨ Tidak ada data mahasiswa duplikat yang perlu dihapus.');
  }

  // 5. Pembersihan Duplikat pada Aktivitas MBKM
  const mbkmActivities = await prisma.mbkmActivity.findMany();
  const keptMbkmIds = new Set(dedupeMbkmByIdentity(mbkmActivities).rows.map((row) => row.id));
  const mbkmIdsToDelete = mbkmActivities
    .filter((act) => !keptMbkmIds.has(act.id))
    .map((act) => act.id);

  let deletedMbkmCount = 0;
  if (mbkmIdsToDelete.length > 0) {
    const mbkmDeleteRes = await prisma.mbkmActivity.deleteMany({
      where: { id: { in: mbkmIdsToDelete } },
    });
    deletedMbkmCount = mbkmDeleteRes.count;
    logger.success(`🗑️ Berhasil menghapus ${deletedMbkmCount} record MBKM duplikat.`);
  }

  return {
    totalEvaluatedStudents: totalStudentsCount,
    deletedStudentsCount,
    prunedStudentsCount,
    reconciledLegacyCount,
    relinkedGraduatesCount,
    relinkedMbkmCount,
    deletedMbkmCount,
  };
}

/** Dua baris satu orang: NIK valid sama, atau nama (normalisasi) + tgl lahir sama. */
function isSamePerson(studentA, studentB) {
  if (!studentA || !studentB) return false;
  const nikA = validNik(studentA.nik);
  const nikB = validNik(studentB.nik);
  if (nikA && nikB) return nikA === nikB;

  const namaA = normNama(studentA.nama);
  const namaB = normNama(studentB.nama);
  const tglA = (studentA.tanggalLahir || '').trim();
  const tglB = (studentB.tanggalLahir || '').trim();
  if (namaA && tglA && namaA === namaB && tglA === tglB) return true;

  return false;
}

module.exports = {
  deduplicateStudents,
  isSamePerson,
  survivorFirst,
  personKeys,
  isStatusPindah,
  isLegacyGraduatedTwin,
  validNik,
};
