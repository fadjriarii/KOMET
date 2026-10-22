import ErrorPage from '../../../modules/errors/ErrorPage';

/**
 * Penjaga dashboard: saat ringkasan gagal dan belum ada data lama yang bisa
 * ditampilkan, seluruh tampilan diganti layar kegagalan penuh (`modules/errors`)
 * yang memilih teks dan aksinya dari status HTTP:
 *
 *   401 → gagal sesi (coba lagi)   404 → alamat/endpoint salah (pulang)
 *   500 → salah server (lapor IT)  tanpa status/tak terjangkau → coba lagi
 *
 * Wrapper `.err-overlay` (fixed, z-100, bg abu) menutupi navbar & sidebar
 * secara visual. Kalau data lama masih ada, isi halaman tetap tampil dan
 * kegagalan refresh ditangani banner (QueryErrorBanner).
 */
export default function DashboardErrorGuard({ error, status, hasData, onRetry, children }) {
  if (error && !hasData) {
    return (
      <div className="err-overlay">
        <ErrorPage
          status={status}
          message={error}
          onRetry={onRetry}
          onHome={() => window.location.assign('/students')}
        />
      </div>
    );
  }
  return children;
}
