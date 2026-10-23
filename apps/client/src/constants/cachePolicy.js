// Satu jendela cache untuk seluruh data dashboard. Ringkasan (angka banner/KPI) dan
// rincian (chart di dialog) memakai nilai yang sama supaya satu dialog tidak pernah
// mencampur snapshot dari dua jendela waktu — sumber bug "angka banner beda dengan chart".
// Sync meng-invalidate namespace modul, jadi TTL ini hanya batas atas untuk data
// yang tidak berubah; 5 menit menghindari refetch saat presentasi berpindah tab.
export const DASHBOARD_STALE_TIME_MS = 5 * 60 * 1000;
