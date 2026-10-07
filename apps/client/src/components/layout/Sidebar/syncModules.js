import { SYNC_MODULES, SYNC_TRIGGER } from '@komet/shared/constants';

/**
 * Kosakata tampilan sinkronisasi: label modul, label pemicu, dan gaya status.
 * Daftarnya sendiri (`SYNC_MODULES`) hidup di @komet/shared dan dibaca server serta
 * kontrak respons juga, jadi tidak ada lagi daftar modul yang bisa berbeda sendiri.
 */
export const MODULE_LABELS = Object.fromEntries(SYNC_MODULES.map(({ key, label }) => [key, label]));

/** Server mengirim nilainya (`manual` / `automatic`); kata yang dibaca user ada di sini. */
export const TRIGGER_LABELS = {
  [SYNC_TRIGGER.MANUAL]: 'Manual',
  [SYNC_TRIGGER.AUTOMATIC]: 'Automatic',
};

/**
 * `chip` dipakai baris daftar; `glyph` + `logText` dipakai terminal, dan hadirnya
 * `logText` menandai baris mana yang layak masuk log. Kuncinya sama dengan status
 * yang dikirim `/api/sync/status` dan `sync_runs`: `idle` sebelum ada job,
 * `pending` saat job mulai, lalu `running` dan `completed` per modul.
 */
export const SYNC_STATUS = {
  running: {
    label: 'Processing',
    chip: 'bg-digital-blue-100 text-digital-blue-700',
    glyph: '>',
    logText: 'syncing...',
  },
  completed: {
    label: 'Done',
    chip: 'bg-emerald-50 text-emerald-700',
    glyph: '✓',
    logText: 'done',
  },
  pending: { label: 'Queued', chip: 'bg-gray-100 text-gray-500' },
  failed: { label: 'Failed', chip: 'bg-red-50 text-red-700', glyph: '✗', logText: 'failed' },
  idle: { label: 'Ready', chip: 'bg-gray-100 text-gray-500' },
};

/** Status sebuah baris pilihan: di luar cakupan job, angka lama tidak boleh terbaca. */
export const resolveStatus = (row) => (row?.inScope && SYNC_STATUS[row.status]) || SYNC_STATUS.idle;
