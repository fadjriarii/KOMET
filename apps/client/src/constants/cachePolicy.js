// Satu jendela cache untuk seluruh data dashboard. Ringkasan (angka banner/KPI) dan
// rincian (chart di dialog) memakai nilai yang sama supaya satu dialog tidak pernah
// mencampur snapshot dari dua jendela waktu — sumber bug "angka banner beda dengan chart".
export const DASHBOARD_STALE_TIME_MS = 2 * 60 * 1000;
