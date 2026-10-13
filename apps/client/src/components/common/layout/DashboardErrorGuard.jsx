import ErrorPage from '../../../modules/errors/ErrorPage';

/**
 * Penjaga dashboard: saat ringkasan gagal dan belum ada data lama yang bisa
 * ditampilkan, banner kuning di header tidak cukup — pengguna hanya melihat
 * kartu-kartu kosong tanpa tahu kenapa. Seluruh isi halaman diganti layar
 * kegagalan (`modules/errors`), yang memilih teks dan aksinya dari status HTTP:
 *
 *   401 → gagal sesi (coba lagi)   404 → alamat/endpoint salah (pulang)
 *   500 → salah server (lapor IT)  tanpa status/tak terjangkau → coba lagi
 *
 * Kalau ringkasan lama masih ada, isi halaman tetap tampil dan kegagalan
 * refresh ditangani banner seperti sebelumnya.
 */
export default function DashboardErrorGuard({ error, status, hasData, onRetry, children }) {
  if (error && !hasData) {
    return (
      <ErrorPage
        status={status}
        message={error}
        onRetry={onRetry}
        onHome={() => window.location.assign('/students')}
      />
    );
  }
  return children;
}
