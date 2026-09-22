# Dokumen Persyaratan & Laporan Refactoring Backend — Part 3

Dokumen ini mencatat secara menyeluruh seluruh perubahan, refactoring, dan optimasi yang telah diterapkan pada backend Express.js, Prisma, dan MariaDB untuk proyek **Komet Server**.

---

## 1. Refactoring Sinkronisasi Data & Service Deduplikasi Terpadu In-Memory

### A. Latar Belakang & Aturan Utama
Sebelumnya, logika ETL sinkronisasi memfilter data berlabel **"(Akun Lama)"** sehingga kehilangan banyak data. Filter tersebut kini telah **dihapus sepenuhnya** dari seluruh proses sinkronisasi (`Students`, `Graduates`, `MBKM`), sehingga **semua data dari SEVIMA API masuk ke MariaDB terlebih dahulu**.

Setelah data masuk, proses pembersihan duplikat dilakukan melalui **Service Deduplikasi Terpadu** ([`studentDeduplicationService.js`](file:///home/fadjri/projects/Komet/server/src/services/studentDeduplicationService.js)) dengan aturan:

1. **Normalisasi NIM:** Karakter "X" / "x" dihilangkan dari NIM (`nim.toLowerCase().replace(/x/g, '')`).
2. **Pengelompokan (Grouping):** Data dikelompokkan berdasarkan kombinasi `namaBersih` dan `nimBersih`.
3. **Pemeriksaan Duplikat:**
   - **Jika TIDAK DUPLIKAT (`group.length === 1`):** Data **TETAP ADA** (tidak disentuh atau dihapus sama sekali).
   - **Jika DUPLIKAT (`group.length > 1`):** 
     - **Selamatkan 1 Data Utama:** Utamakan NIM yang bersih dari huruf "X" (atau timestamp terbaru).
     - **Re-link Data Relasi:** Semua histori Kelulusan (*Graduate*) & Aktivitas MBKM dari data duplikat sisa **dipindahkan/re-link secara otomatis ke NIM utama yang diselamatkan** agar tidak ada riwayat yang hilang.
     - **Bulk Delete:** Record duplikat sisa dihapus secara masal dalam 1 query tunggal.
4. **Cakupan Penggunaan:** Berlaku untuk semua endpoint sinkronisasi (`/api/sync/students`, `/api/sync/graduates`, `/api/sync/mbkm`, dan `/api/sync/all`).

---

## 2. Refactoring Penamaan File & Folder (`stats` → `students`)

### A. Daftar Perubahan Lokasi & Struktur File
| Komponen | Nama Lama | Nama Baru |
|---|---|---|
| **Services Directory** | `src/services/stats/` | [`src/services/students/`](file:///home/fadjri/projects/Komet/server/src/services/students) |
| **Controller File** | `src/controllers/statsController.js` | [`src/controllers/studentsController.js`](file:///home/fadjri/projects/Komet/server/src/controllers/studentsController.js) |
| **Routes File** | `src/routes/statsRoutes.js` | [`src/routes/studentsRoutes.js`](file:///home/fadjri/projects/Komet/server/src/routes/studentsRoutes.js) |
| **Main Route Entry Point** | `app.use('/api/stats', statsRoutes)` | `app.use('/api/students', studentsRoutes)` (di [`src/server.js`](file:///home/fadjri/projects/Komet/server/src/server.js)) |

---

## 3. Ringkasan Pengujian Endpoints (15/15 Passed ✅)

Seluruh endpoint pada backend Komet telah diuji dan berjalan 100% normal:
1. **Health Check:** `GET /api/health`
2. **Sync Endpoints:** `POST /api/sync/students`, `POST /api/sync/graduates`, `POST /api/sync/mbkm`, `POST /api/sync/all`, `GET /api/sync/status`
3. **Students Endpoints:** `GET /api/students/summary`, `GET /api/students/active-students`, `GET /api/students/international-trend`, `GET /api/students/intake-trend`, `GET /api/students/decline-trend`, `GET /api/students/students`
4. **Graduates Endpoints:** `GET /api/graduates/summary`, `GET /api/graduates/total-lulusan`, `GET /api/graduates/ipk-trend`, `GET /api/graduates/tepat-waktu`, `GET /api/graduates/keberhasilan-studi`, `GET /api/graduates/list`
