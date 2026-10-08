import { SYNC_MODULES, SYNC_MODULE_KEYS, SYNC_TRIGGER } from '@komet/shared/constants';

/**
 * Kosakata tampilan sinkronisasi: label modul, kelompok pilihan, label pemicu, dan gaya status.
 * Daftarnya sendiri (`SYNC_MODULES`) hidup di @komet/shared dan dibaca server serta
 * kontrak respons juga, jadi tidak ada lagi daftar modul yang bisa berbeda sendiri.
 */
export const MODULE_LABELS = Object.fromEntries(SYNC_MODULES.map(({ key, label }) => [key, label]));

/**
 * Kelompok tampilan kartu "Select Data": baris `>` yang membuka/menutup pilihan di dalamnya.
 * Semua modul hari ini masih satu kelompok; ketika kelompok kedua muncul, `moduleKeys`
 * dipecah eksplisit per kelompok — modul yang tidak disebut di kelompok mana pun tidak
 * akan muncul di kartu, jadi tiap penambahan modul wajib menyebut kelompoknya.
 */
export const MODULE_GROUPS = [{ key: 'student', label: 'Student', moduleKeys: SYNC_MODULE_KEYS }];

/** Server mengirim nilainya (`manual` / `automatic`); kata yang dibaca user ada di sini. */
export const TRIGGER_LABELS = {
  [SYNC_TRIGGER.MANUAL]: 'Manual',
  [SYNC_TRIGGER.AUTOMATIC]: 'Automatic',
};

/**
 * `chip` dipakai rincian riwayat di kolom kanan; `glyph` + `logText` dipakai terminal, dan hadirnya
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
