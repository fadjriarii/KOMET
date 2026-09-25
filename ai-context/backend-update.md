# Analisis Backend Komet — Student Data & Keseluruhan Project
> Dihasilkan: 25 September 2026 | Analis: Antigravity AI

---

## 1. Gambaran Arsitektur Keseluruhan

```
Komet/
├── server/                          # Node.js + Express Backend
│   ├── src/
│   │   ├── server.js                # Entry point, middleware stack, graceful shutdown
│   │   ├── config/                  # prisma.js, sevimaApi.js, envValidator.js
│   │   ├── controllers/             # studentsController, graduatesController, mbkmController
│   │   │   └── sync/                # ETL: syncStudents, syncGraduates, syncMbkm, syncAll
│   │   ├── routes/                  # studentsRoutes, graduatesRoutes, mbkmRoutes, syncRoutes
│   │   ├── services/
│   │   │   ├── students/            # activeStudents, intakeTrend, declineTrend, filterBuilder, filterOptions, studentList
│   │   │   ├── graduates/           # graduateList, graduateDistribution, ipkTrend, totalLulusan, dll.
│   │   │   ├── mbkm/                # mbkmList, mbkmEligible, mbkmActivities, dll.
│   │   │   └── studentDeduplicationService.js
│   │   ├── middlewares/             # auth.js, rateLimiter.js, validator.js (Zod), syncGuard.js
│   │   └── utils/                   # academicUtils, errorHandler, graduateUtils, logger, paginationUtils, queryUtils, syncJobTracker
│   └── prisma/schema.prisma         # Model: Student, Graduate, MbkmActivity
│
└── client/                          # React 19 + Vite + TailwindCSS v4
    └── src/
        ├── modules/students/        # ← FOKUS AKTIF DEVELOPMENT
        │   ├── pages/StudentsPage.jsx
        │   ├── components/          # StudentDataTable, StudentDetailModal, filters/, modals/
        │   ├── hooks/               # useStudentsData, useStudentFilters, useStudentList, useStudentDetailResource, useStudentModalOrigin
        │   ├── services/studentsService.js
        │   └── utils/studentQuery.js
        ├── modules/graduates/
        ├── modules/mbkm/
        ├── modules/overview/
        └── services/apiClient.js
```

**Stack Teknologi:**
- Backend: Node.js + Express 5 + Prisma 6 (MySQL) + Zod + Winston + Helmet + HPP
- Frontend: React 19 + Vite 8 + TailwindCSS 4 + Recharts 3
- Sumber Data: SEVIMA SiakadCloud API (sinkronisasi ETL)

---

## 2. Analisis Keseluruhan Backend

### 2.1 Hal yang Sudah Baik ✅

#### Arsitektur & Struktur
- **Separation of Concerns yang baik**: Controller → Service → Prisma sudah terpisah rapi. Tidak ada logika bisnis di route/controller level, semuanya didelegasikan ke service.
- **Modularisasi sync**: ETL dibagi per domain (`syncStudents`, `syncGraduates`, `syncMbkm`) dengan `syncAll` sebagai orkestrator, mudah di-maintain.
- **Async job pattern** dengan `syncJobTracker`: Sync bisa dijalankan secara async (background) dengan status tracking via file (`sync-state.json`). Ada self-healing: jika server restart saat sync berjalan, status direset ke `failed`.
- **Graceful shutdown**: Mendengarkan SIGTERM/SIGINT, menutup HTTP server lalu Prisma connection secara berurutan.
- **Global error handler + unhandledRejection**: Mencegah silent crash.

#### Security & Middleware
- **Timing-safe API key comparison** (`crypto.timingSafeEqual`): Mencegah timing attack pada autentikasi.
- **Helmet + HPP**: Proteksi header HTTP dan HTTP Parameter Pollution.
- **CORS whitelist**: Hanya origin yang terdaftar di `.env` yang diizinkan.
- **Rate limiter**: statsLimiter (60/mnt) dan syncLimiter (5/mnt) sudah terpasang.
- **Zod validation** pada query parameter: Mencegah injection dan invalid input sebelum masuk controller.
- **Request timeout (30 detik)**: Mencegah hanging request.

#### Data Layer
- **Database indexing** yang thoughtful: Index pada `statusKeaktifan`, `fakultas`, `programStudi`, `angkatan`, `kewarganegaraan`, dan composite index `(statusKeaktifan, semester)`, `(statusKeaktifan, kewarganegaraan)`.
- **Deduplication service** yang canggih: Menangani duplikat NIM (dengan/tanpa suffix X), re-link relasi Graduate & MbkmActivity sebelum delete, dan cleanup MBKM duplikat.
- **ETL dengan data cleansing**: Filter NIM ber-X, filter "akun lama", normalisasi angkatan/periode/semester/kewarganegaraan dari format SEVIMA API.

#### Kalkulasi & Logika
- **Semester calculation (`hitungSemester`)**: Formula `((tahunAkhir - tahunMasuk) × 2) + (termAkhir - termMasuk) + 1` sudah benar secara akademis.
- **`buildHistory` declineTrend**: Komentar dan logika `changeFromPrev` sudah konsisten (arah: dari titik lama ke titik baru yang lebih baru).
- **Filter cache** pada `filterOptions.js`: TTL 5 menit, mencegah query DB berulang untuk filter options.

---

## 3. Analisis Khusus Student Data

### 3.1 Endpoint Map (Backend ↔ Frontend)

| Endpoint | Metode | Frontend Consumer | Fungsi |
|---|---|---|---|
| `GET /api/students/summary` | `useStudentsData` + `StudentsPage filtered` | Summary 4 KPI card + filterOptions | ✅ |
| `GET /api/students/active-students` | `ActiveStudentsModal` | Breakdown by Prodi/Fakultas/Jenjang | ✅ |
| `GET /api/students/intake-trend` | `IntakeStudentsModal` | Tren intake per tahun akademik | ✅ |
| `GET /api/students/decline-trend` | `DeclineStudentsModal` | Fluktuasi 5 tahun + chart + tabel | ✅ |
| `GET /api/students/students` | `useStudentList` | Tabel paginated + filter | ✅ |

### 3.2 Mapping KPI Response Backend → Frontend

#### ⚠️ BUG KRITIS: Field Name Mismatch — `foreignStudentsRate` vs `foreignRate`

**Backend** (`studentsController.js`, baris 70) mengembalikan:
```json
{
  "kpis": {
    "foreignStudentsRate": "1.2%",   ← nama field di backend
    ...
  }
}
```

**Frontend** (`StudentsPage.jsx`, baris 138) mengonsumsi:
```jsx
value={formatKpiDisplay(displayKpis.foreignRate)}   ← nama field di frontend
```

**Dampak**: Card "Persentase Mahasiswa Internasional" selalu menampilkan `-` (null/undefined) karena key tidak cocok. Ini adalah bug yang menyebabkan KPI Card 2 tidak pernah menampilkan data yang benar.

---

### 3.3 Analisis Kalkulasi Per KPI

#### KPI 1: Total Mahasiswa Aktif
- **Logika**: `prisma.student.count({ where: { ...baseFilter, statusKeaktifan: 'Aktif' } })`
- **Status**: ✅ Benar. Filter default `statusKeaktifan = 'Aktif'` sudah di-enforce di `buildBaseFilter`.

#### KPI 2: Persentase Mahasiswa Internasional (WNA)
- **Formula Backend**: `(totalInternationalStudents / (totalActive + totalForeign)) × 100`
- **⚠️ Bug Logika Formula**: Di `studentsController.js` baris 40–41:
  ```js
  const totalAll = totalActiveStudents + totalInternationalStudents;
  const foreignStudentsRate = totalAll > 0 ? ((totalInternationalStudents / totalAll) * 100).toFixed(1) + '%' : "0.0%";
  ```
  **Masalah**: `totalAll = totalActive + totalForeign` adalah **double-counting**. Mahasiswa WNA yang aktif sudah termasuk dalam `totalActiveStudents`. Formula yang benar adalah:
  ```
  Rate = (totalInternationalStudents / totalActiveStudents) × 100
  ```
  **Formula yang benar** (sesuai yang tertulis di frontend ForeignStudentsModal.jsx):
  > `(Jumlah Mahasiswa Non-WNI Aktif / Total Student Body Aktif) × 100%`

- **Status**: ❌ Formula salah — denominator menggunakan `total + foreign` bukan `total saja`.

#### KPI 3: Intake Mahasiswa Baru
- **Logika**: Mahasiswa yang `periodeMasuk` sesuai tahun akademik terbaru.
- **⚠️ Potensi Bug**: `getIntakeTrend` menggunakan `baseFilter` yang secara default memiliki `statusKeaktifan = 'Aktif'`. Ini berarti **intake hanya menghitung mahasiswa baru yang SAAT INI masih aktif**, bukan seluruh mahasiswa yang pernah diterima di angkatan tersebut. Mahasiswa baru angkatan 2023 yang sudah lulus/DO tidak terhitung, padahal seharusnya dihitung sebagai intake.
- **Status**: ⚠️ Perlu dikonfirmasi: apakah "Intake" = mahasiswa baru yang sekarang aktif, atau semua yang pernah masuk?

#### KPI 4: Penurunan Mahasiswa Baru (5 Tahun)
- **Formula**: `avg((B-A)/A + (C-B)/B + (D-C)/C + (E-D)/D)` dimana A=terbaru, E=terlama.
- **Terminologi**: Komentar menyebut ini "penurunan" tapi `declinePercentage` bisa positif (artinya peningkatan). Frontend menggunakan `isFluctuationPositive` untuk memilih icon TrendingUp/Down — ini sudah benar.
- **⚠️ Sama seperti KPI 3**: `getIntakeForYear` juga menggunakan `baseFilter` yang mengandung `statusKeaktifan = 'Aktif'`, sehingga kalkulasi historis hanya menghitung mahasiswa yang saat ini masih aktif.
- **Status**: ⚠️ Potensi bias data karena filter status aktif pada data historis.

---

### 3.4 Analisis Filter System

**Filter yang tersedia di frontend:**
- Search (NIM/Nama), Fakultas, Program Studi, Jenjang, Angkatan (multi-year), Semester, Kewarganegaraan, Status Keaktifan, Periode Masuk

**Pemetaan ke backend:**
| Filter UI | Query Param | Backend Field |
|---|---|---|
| `searchQuery` | `search` | `nim`/`nama` (OR) |
| `selectedFaculty` | `fakultas` | `fakultas` |
| `selectedProdi` | `programStudi` | `programStudi` |
| `selectedJenjang` | `jenjang` | `jenjang` |
| `selectedYears[]` | `angkatanTahun` | `angkatan` (startsWith) |
| `selectedSemester` | `semester` | `semester` |
| `selectedNationality` | `kewarganegaraan` | `kewarganegaraan` |
| `selectedStatus` | `statusKeaktifan` | `statusKeaktifan` |
| `selectedPeriode` | `periodeMasuk` | `periodeMasuk` (endsWith '1'/'2') |

**Issue pada validator:** `periode` field tidak ada di `studentQuerySchema` di `validator.js`, meskipun `buildBaseFilter` dan `buildStudentFilter` sudah menangani `periode`. Field ini akan diabaikan oleh validator (tidak diblokir, tapi tidak divalidasi).

**Issue pada `buildStudentFilter` vs `buildBaseFilter`:**
- `buildStudentFilter` dan `buildBaseFilter` **duplicate code** hampir identik (75%+ sama). Seharusnya satu fungsi dengan parameter opsional.

---

### 3.5 Analisis Tabel Mahasiswa (`/api/students/students`)

**Data yang dikembalikan (per row):**
```
nim, nama, angkatan, periode, periodeMasuk, programStudi, fakultas, jenjang, semester, kewarganegaraan, statusKeaktifan
```

**Kolom yang ditampilkan di `StudentDataTable.jsx`:**
- No, NIM, Nama, Program Studi, Fakultas, Angkatan, Periode (periodeMasuk/periode), Semester, Kewarganegaraan, Status Keaktifan

**Status mapping**: ✅ Semua kolom yang dirender di frontend tersedia di backend response.

**Potensi Issue — Kolom "Periode" di tabel:**
```jsx
render: (row) => row.periodeMasuk || row.periode || '-'
```
Frontend menampilkan `periodeMasuk` (raw code: "20261") di kolom "Periode". Yang lebih user-friendly seharusnya menampilkan `periode` field (nilai "Ganjil"/"Genap"), bukan kode numerik 5 digit.

**Sorting issue (`orderBy: [{ angkatan: 'desc' }]`):**  
Field `angkatan` disimpan sebagai string `"2026 Ganjil"` bukan angka murni. Sort string `"2026 Genap"` vs `"2026 Ganjil"` akan mengurutkan berdasarkan alfabet, dimana `"G" < "G"` sama (Ganjil < Genap secara alfabet). Ini mungkin tidak konsisten dengan urutan akademis yang diharapkan (Ganjil seharusnya sebelum Genap dalam tahun yang sama).

---

### 3.6 Analisis internationalTrend

**Logika `getInternationalStudentsTrend`:**
- Group mahasiswa per tahun akademik berdasarkan `periodeMasuk`
- Hitung total dan WNA per tahun
- Kembalikan trendData + byCountry

**⚠️ Bug pada byCountry:**
```js
const country = 'WNA'; // ← hardcoded!
countryMap[country] = (countryMap[country] || 0) + 1;
```
`byCountry` selalu mengembalikan `[{ kewarganegaraan: "WNA", count: X }]` — semua negara asing digabung jadi satu. Padahal data `kewarganegaraan` di database menyimpan nama negara spesifik (contoh: "Malaysia", "Vietnam"). Frontend saat ini tidak menampilkan `byCountry` secara detail, tapi data ini tidak berguna jika semua digabung.

---

### 3.7 Analisis `intakeTrend` — Swap Digit Term

**Bug potensial pada `intakeTrend.js`:**
```js
const termDigit = s.periodeMasuk ? s.periodeMasuk.substring(4, 5) : '';
if (termDigit === '2') {
    counts.ganjil += 1;   // digit 2 → Ganjil?
} else if (termDigit === '1') {
    counts.genap += 1;    // digit 1 → Genap?
}
```

**Ini TERBALIK!** Di `helpers.js` (`extractPeriode`) dan seluruh kode lainnya, konvensi adalah:
- Digit ke-5 `1` → **Ganjil** (masuk Agustus)
- Digit ke-5 `2` → **Genap** (masuk Februari)

Tapi di `intakeTrend.js` justru sebaliknya: digit `2` dikategorikan sebagai Ganjil dan digit `1` sebagai Genap. Ini menyebabkan statistik Ganjil/Genap pada chart intake terbalik nilainya.

---

## 4. Analisis Frontend (Client)

### 4.1 Hal yang Sudah Baik ✅
- **Arsitektur per-modul** yang bersih: Setiap domain (students, graduates, mbkm, overview) punya direktori sendiri dengan services, hooks, components, dan utils.
- **Custom hooks** yang terpisah dan reusable: `useStudentsData`, `useStudentFilters`, `useStudentList`, `useStudentDetailResource`, `useStudentModalOrigin`.
- **Debounce pada search** (400ms): Mencegah API call berlebihan saat user mengetik.
- **Stale response protection** dengan `isMounted` flag.
- **Filtered KPI** secara real-time: Saat filter aktif, KPI cards juga diupdate dari `/summary` dengan filter yang sama.
- **Page reset** saat filter berubah: `useStudentList` merefer ke halaman 1 ketika filter berubah.
- **Modal orchestration** via `StudentDetailModal` facade.

### 4.2 Hal yang Perlu Diperbaiki ⚠️
- **`displayKpis.foreignRate`** tidak ada (harusnya `foreignStudentsRate`) → Card 2 blank.
- **`getStudentActiveFilterCount`** menghitung `status !== 'Aktif'` sebagai "custom filter aktif", tapi default `selectedStatus` adalah `'Aktif'`. Ini menyebabkan jika user mengubah status ke non-Aktif, filter dihitung sebagai aktif (benar), tapi juga berarti `hasCustomFilters = false` saat status = 'Aktif' meskipun filter lain terisi (correct behavior, tapi logic agak confusing).
- **Kolom "Periode" di tabel** menampilkan raw code `periodeMasuk` (`"20261"`) — seharusnya menampilkan `periode` field (`"Ganjil"` / `"Genap"`).
- **`useStudentDetailResource`**: Modal tidak refresh data saat `filters` berubah (hanya trigger saat `isOpen` berubah). Jika user mengubah filter saat modal terbuka, data modal tidak terupdate.

---

## 5. Ringkasan: Hal Baik vs Perlu Diperbaiki

### ✅ Kelebihan (Pertahankan)
1. Arsitektur modular dan separation of concerns yang baik
2. Security layer lengkap (timing-safe auth, Helmet, HPP, CORS whitelist, rate limiter)
3. Zod validation pada semua query params
4. Async sync job dengan state persistence dan self-healing
5. Database indexing yang thoughtful dan composite
6. Deduplication service yang robust (re-link relasi sebelum delete)
7. ETL data cleansing yang komprehensif dari SEVIMA API
8. Graceful shutdown yang benar
9. Winston logging dengan context
10. Filter cache (5 menit TTL) pada filterOptions
11. Frontend: debounce search, stale response guard, per-module architecture
12. Semester calculation formula yang benar secara akademis

### ❌ Bug / Masalah Kritis (Segera Perbaiki)
1. **[KRITIS] Field mismatch**: Backend `foreignStudentsRate` → Frontend mengonsumsi `foreignRate` → Card 2 selalu blank
2. **[KRITIS] Formula rate WNA salah**: `totalAll = totalActive + totalForeign` (double-count) → seharusnya `totalActive` saja sebagai denominator
3. **[KRITIS] Swap Ganjil/Genap di intakeTrend.js**: Digit '2' → Ganjil dan digit '1' → Genap (terbalik dari konvensi seluruh codebase)
4. **[PENTING] byCountry hardcoded 'WNA'**: Data negara spesifik hilang, semua digabung
5. **[PENTING] Intake & declineTrend filter `statusKeaktifan = 'Aktif'`**: Data historis intake tidak akurat karena mahasiswa yang sudah lulus/DO tidak terhitung

### ⚠️ Peningkatan (Improve Next)
6. **Duplicate code**: `buildStudentFilter` dan `buildBaseFilter` hampir identik → merge dengan parameter
7. **`validator.js`**: Field `periode` tidak ada di `studentQuerySchema`
8. **Sorting `angkatan`**: String sort `"2026 Ganjil"` vs `"2026 Genap"` tidak deterministic secara akademis
9. **Kolom Periode di tabel**: Menampilkan raw code `periodeMasuk` bukan label `periode` (Ganjil/Genap)
10. **Modal refresh**: `useStudentDetailResource` tidak refresh saat filters berubah dengan modal terbuka
11. **In-memory filterCache**: Tidak ada invalidasi cache setelah sync selesai → data stale hingga TTL 5 menit
12. **`angkatan` sort di tabel**: String "2026 Ganjil" > "2026 Genap" secara alfabet benar, tapi "2026 Ganjil" (semester masuk Agustus) seharusnya lebih awal dari "2026 Genap" (masuk Februari) dari perspektif tahun akademik

---

## 6. TODO List — Urutan Prioritas

### 🔴 PRIORITAS 1: Bug Kritis (Fix Sekarang)

- [x] **TODO-01**: Fix field name mismatch KPI 2 — ubah `foreignStudentsRate` di `kpis` object backend (`studentsController.js`) menjadi `foreignRate` ATAU update frontend untuk membaca `foreignStudentsRate`.
  - File: `server/src/controllers/studentsController.js` baris 70
  - Rekomendasi: Ubah backend agar konsisten dengan yang frontend baca (`foreignRate`), karena frontend sudah memiliki logika `displayKpis.foreignRate` di 2 tempat.

- [x] **TODO-02**: Fix formula persentase WNA — ubah denominator dari `totalActiveStudents + totalInternationalStudents` menjadi `totalActiveStudents` saja.
  - File: `server/src/controllers/studentsController.js` baris 40–41
  - Fix:
    ```js
    // SEBELUM (salah):
    const totalAll = totalActiveStudents + totalInternationalStudents;
    const foreignStudentsRate = totalAll > 0 ? ((totalInternationalStudents / totalAll) * 100).toFixed(1) + '%' : "0.0%";
    
    // SESUDAH (benar):
    const foreignRate = totalActiveStudents > 0
      ? `${((totalInternationalStudents / totalActiveStudents) * 100).toFixed(1)}%`
      : "0.0%";
    ```

- [x] **TODO-03**: Fix swap Ganjil/Genap di `intakeTrend.js` — digit ke-5 `1` = Ganjil, `2` = Genap (konsisten dengan `helpers.js`).
  - File: `server/src/services/students/intakeTrend.js` baris ~32–37
  - Fix:
    ```js
    // SEBELUM (terbalik):
    if (termDigit === '2') { counts.ganjil += 1; }
    else if (termDigit === '1') { counts.genap += 1; }
    
    // SESUDAH (benar):
    if (termDigit === '1') { counts.ganjil += 1; }
    else if (termDigit === '2') { counts.genap += 1; }
    ```

### 🔴 PRIORITAS 2: Bug Logika Data (Fix Segera)

- [x] **TODO-04**: Fix `byCountry` di `internationalTrend.js` — gunakan nama negara sesungguhnya dari field `kewarganegaraan`, bukan hardcoded `'WNA'`.
  - File: `server/src/services/students/internationalTrend.js` baris ~27–31
  - Fix:
    ```js
    // SEBELUM (hardcoded):
    const country = 'WNA';
    countryMap[country] = (countryMap[country] || 0) + 1;
    
    // SESUDAH (per negara):
    const country = s.kewarganegaraan || 'WNA';
    countryMap[country] = (countryMap[country] || 0) + 1;
    ```

- [x] **TODO-05**: Review dan tentukan keputusan bisnis untuk filter `statusKeaktifan` pada kalkulasi intake & decline — apakah "Intake" berarti semua mahasiswa yang pernah masuk (termasuk yang sudah lulus) atau hanya yang aktif saat ini?
  - Jika harus semua: Hapus `statusKeaktifan` dari `baseFilter` saat memanggil `getIntakeTrend` dan `getIntakeForYear`.
  - File: `server/src/controllers/studentsController.js`, `server/src/services/students/intakeTrend.js`, `server/src/services/students/declineTrend.js`
  - **Rekomendasi**: Intake yang tepat adalah **semua** mahasiswa yang masuk di angkatan tersebut (tanpa filter status aktif), karena intake = jumlah penerimaan awal, bukan yang masih aktif.

### 🟡 PRIORITAS 3: Konsistensi & Kualitas Data

- [x] **TODO-06**: Tambah field `periode` ke `studentQuerySchema` di `validator.js` agar parameter ini juga divalidasi.
  - File: `server/src/middlewares/validator.js`
  - Tambahkan: `periode: z.string().optional()` di `studentQuerySchema`

- [x] **TODO-07**: Refactor `buildStudentFilter` dan `buildBaseFilter` menjadi satu fungsi dengan opsi opsional — eliminasi duplicate code ~60 baris.
  - File: `server/src/services/students/filterBuilder.js`
  - Strategi: Buat `buildStudentFilter(query, options = { forStats: false })` — jika `forStats: true`, paksa `statusKeaktifan = 'Aktif'` dan skip `search`.

- [x] **TODO-08**: Fix tampilan kolom "Periode" di tabel mahasiswa frontend — tampilkan `periode` (`"Ganjil"/"Genap"`) bukan raw `periodeMasuk` (`"20261"`).
  - File: `client/src/modules/students/components/StudentDataTable.jsx`
  - Fix:
    ```jsx
    // SEBELUM:
    render: (row) => row.periodeMasuk || row.periode || '-'
    
    // SESUDAH:
    render: (row) => row.periode || '-'
    ```

### 🟡 PRIORITAS 4: Peningkatan UX & Keandalan

- [x] **TODO-09**: Invalidasi `filterOptions` cache setelah sync selesai — saat ini data filter stale hingga 5 menit setelah data baru tersinkronisasi.
  - Strategi: Panggil `getFilterOptions(true)` (force refresh) di `syncStudents` setelah `executeSyncStudents()` berhasil.
  - File: `server/src/controllers/sync/syncStudents.js`, `server/src/services/students/filterOptions.js`

- [x] **TODO-10**: Fix modal data refresh — `useStudentDetailResource` seharusnya re-fetch saat `filters` berubah (bukan hanya saat `isOpen` toggle).
  - File: `client/src/modules/students/hooks/useStudentDetailResource.js`
  - Tambahkan `filters` ke dependency array atau buat hook menerima `filters` sebagai parameter yang memicu re-fetch.

- [x] **TODO-11**: Perbaiki sorting `angkatan` di `studentList.js` agar lebih deterministic secara akademis.
  - Pertimbangan: Ubah format `angkatan` di DB menjadi hanya tahun (`"2026"`) dan gunakan field `periode` yang terpisah untuk Ganjil/Genap. Atau buat computed sort key.
  - File: `server/src/services/students/studentList.js`

### 🟢 PRIORITAS 5: Peningkatan Jangka Panjang

- [x] **TODO-12**: Tambahkan endpoint `GET /api/students/international-detail` yang mengembalikan breakdown per negara yang sesungguhnya (setelah TODO-04 selesai), sehingga modal mahasiswa asing bisa menampilkan pie chart per negara.

- [x] **TODO-13**: Pertimbangkan menambahkan index `periodeMasuk` di schema Prisma — saat ini `intakeTrend` dan `declineTrend` melakukan full table scan dengan filter `periodeMasuk: { startsWith: ... }`.
  - File: `server/prisma/schema.prisma`
  - Tambahkan: `@@index([periodeMasuk])`

- [x] **TODO-14**: Tambahkan unit test untuk `intakeTrend` (khususnya Ganjil/Genap assignment) dan `studentsController.getSummary` (khususnya formula foreignRate).
  - Folder: `server/tests/unit/`

- [x] **TODO-15**: Endpoint & utilitas export siap dikembangkan / data structures sudah distandarisasi untuk kebutuhan export masa depan.

---

## 7. Catatan Tambahan

### Tentang Sync Error
Sinkronisasi menggunakan pola async job + file-based state tracking yang baik. Error saat sync perlu dikonfirmasi dari log file di `server/logs/` untuk menemukan root cause spesifik.

### Tentang Data Mahasiswa Asing
Database menyimpan `kewarganegaraan` dengan nilai seperti `"WNA"` (generic) atau nama negara spesifik tergantung bagaimana `mapKewarganegaraan()` memetakan data dari SEVIMA. Pastikan fungsi `mapKewarganegaraan` di `helpers.js` mengembalikan nama negara spesifik (bukan "WNA") agar TODO-04 dan TODO-12 bisa berfungsi dengan benar.

### Frontend Cards — Nilai yang Dibutuhkan
Untuk referensi, berikut semua field `kpis` yang dikonsumsi frontend (`StudentsPage.jsx`):

```
kpis.formattedActiveCount     → Card 1 value
kpis.foreignRate              → Card 2 value (BUG: backend kirim foreignStudentsRate)
kpis.formattedForeignCount    → Subtitle Card 2 (via getStudentKpiSubtitles)
kpis.formattedIntakeCount     → Card 3 value
kpis.intakePeriod             → Subtitle Card 3
kpis.declineAvg               → Card 4 value
kpis.isFluctuationPositive    → Card 4 icon (TrendingUp/Down)
kpis.declinePeriod            → Subtitle Card 4
kpis.foreignCount             → Subtitle foreignSubtitle
```

Backend HARUS memastikan semua field ini hadir dengan nama yang tepat di response `kpis`.
