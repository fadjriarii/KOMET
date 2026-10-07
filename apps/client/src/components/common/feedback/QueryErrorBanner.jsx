import { AlertCircle } from 'lucide-react';

/**
 * Satu banner kegagalan query untuk semua halaman dashboard.
 *
 * Amber dipakai bila belum ada data sama sekali (backend tidak terjangkau),
 * merah bila data lama masih tampil tapi refresh terakhir gagal. `error` sudah
 * berupa pesan yang disiapkan hook (`query.error?.message`), jadi banner tidak
 * membaca ulang properti `.message` dari objek yang sudah dilepas.
 */
export default function QueryErrorBanner({ error, hasData = false }) {
  if (!error) return null;
  const isOffline = !hasData;
  return (
    <div
      role="alert"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border ${
        isOffline
          ? 'bg-amber-50 border-amber-200/80 text-amber-800'
          : 'bg-red-50 border-red-200/80 text-red-700'
      }`}
    >
      <AlertCircle size={14} aria-hidden="true" />
      <span>
        {isOffline ? 'Backend belum terhubung.' : 'Gagal memuat data terfilter.'} {error}
      </span>
    </div>
  );
}
