/**
 * Kategori status aktivitas MBKM (ADR 0005), satu tabel untuk sync, dedup,
 * dan semua perhitungan. Dicocokkan lewat kode SEVIMA (`id_status_aktivitas`)
 * dulu, label yang dinormalisasi sebagai cadangan. Status baru dari SEVIMA
 * menjadi `unclassified`: tetap tampil di filter dan tabel, tetapi tidak
 * dihitung partisipan sampai diberi aturan di sini.
 */
const MBKM_STATUS_RULES = [
  { code: '5', label: 'Selesai', category: 'participating', rank: 5 },
  { code: '2', label: 'Disetujui', category: 'participating', rank: 4 },
  { code: '1', label: 'Diajukan', category: 'pending', rank: 3 },
  { code: '6', label: 'Ditolak', category: 'rejected', rank: 2 },
  { code: '7', label: 'Dibatalkan', category: 'cancelled', rank: 1 },
];

const UNCLASSIFIED = 'unclassified';
const normalizeLabel = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const byCode = new Map(MBKM_STATUS_RULES.map((rule) => [rule.code, rule]));
const byLabel = new Map(MBKM_STATUS_RULES.map((rule) => [normalizeLabel(rule.label), rule]));

/** Aturan untuk satu aktivitas; status tak dikenal = kategori `unclassified`, rank 0. */
function statusRuleOf({ idStatusAktivitas, statusAktivitas } = {}) {
  return (
    byCode.get(String(idStatusAktivitas ?? '').trim()) ??
    byLabel.get(normalizeLabel(statusAktivitas)) ?? {
      code: String(idStatusAktivitas ?? '').trim(),
      label: String(statusAktivitas ?? '').trim(),
      category: UNCLASSIFIED,
      rank: 0,
    }
  );
}

/** Label status (tersimpan) yang termasuk satu kategori, untuk filter `in` di query. */
const statusLabelsIn = (category) =>
  MBKM_STATUS_RULES.filter((rule) => rule.category === category).map((rule) => rule.label);

module.exports = { MBKM_STATUS_RULES, UNCLASSIFIED, statusRuleOf, statusLabelsIn };
