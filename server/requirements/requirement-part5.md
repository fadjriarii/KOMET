# 📘 KOMET — Requirement Part 5: MBKM Analytics (Detail Card Popup)

> Dokumen ini adalah kelanjutan dari [`requirement-part4.md`](./requirement-part4.md).
> Fitur yang diimplementasikan adalah **6 endpoint analytics detail** untuk setiap card pada Tab MBKM Data —
> ditampilkan sebagai **popup/modal** ketika user mengklik salah satu dari 4 card statistik.
>
> **Target modularitas:** Folder `src/services/mbkm/` akan memiliki **7 file** — konsisten sempurna dengan `students/` dan `graduates/`.

---

## 🔍 Analisis Komprehensif State Project

### 1. Arsitektur Keseluruhan yang Sudah Berjalan

```
server/
├── prisma/
│   ├── schema.prisma              ✅ 3 model: Student, Graduate, MbkmActivity
│   └── migrations/
├── src/
│   ├── config/
│   │   ├── envValidator.js        ✅ Fail-fast env validation
│   │   ├── prisma.js              ✅ Singleton Prisma Client
│   │   └── sevimaApi.js           ✅ Axios + retry/backoff ke SEVIMA
│   ├── controllers/
│   │   ├── studentsController.js  ✅ Dispatcher untuk /api/students/* (6 endpoint)
│   │   ├── graduatesController.js ✅ Dispatcher untuk /api/graduates/* (6 endpoint)
│   │   ├── mbkmController.js      ✅ Dispatcher untuk /api/mbkm/* (2 endpoint saat ini)
│   │   ├── syncController.js      ✅ Entry point sync
│   │   └── sync/
│   │       ├── helpers.js         ✅ Fungsi bantu ETL
│   │       ├── syncStudents.js    ✅ ETL mahasiswa dari SEVIMA
│   │       ├── syncGraduates.js   ✅ ETL kelulusan dari SEVIMA
│   │       ├── syncMbkm.js        ✅ ETL aktivitas MBKM dari SEVIMA
│   │       ├── syncAll.js         ✅ Orchestrator sync semua
│   │       ├── syncStatus.js      ✅ Status job tracker
│   │       └── index.js
│   ├── middlewares/
│   │   └── auth.js                ✅ API Key middleware
│   ├── routes/
│   │   ├── studentsRoutes.js      ✅ GET /api/students/* (6 route)
│   │   ├── graduatesRoutes.js     ✅ GET /api/graduates/* (6 route)
│   │   ├── mbkmRoutes.js          ✅ GET /api/mbkm/* (2 route — perlu di-update)
│   │   └── syncRoutes.js          ✅ POST /api/sync/*
│   ├── services/
│   │   ├── students/              ✅ 7 file modular
│   │   │   ├── filterBuilder.js
│   │   │   ├── filterOptions.js
│   │   │   ├── activeStudents.js    ← detail Card 1
│   │   │   ├── internationalTrend.js ← detail Card 2
│   │   │   ├── intakeTrend.js       ← detail Card 3
│   │   │   ├── declineTrend.js      ← detail Card 4
│   │   │   └── studentList.js       ← tabel
│   │   ├── graduates/             ✅ 7 file modular
│   │   │   ├── filterBuilder.js
│   │   │   ├── filterOptions.js
│   │   │   ├── totalLulusan.js      ← detail Card 1
│   │   │   ├── ipkTrend.js          ← detail Card 2
│   │   │   ├── tepatWaktu.js        ← detail Card 3
│   │   │   ├── keberhasilanStudi.js ← detail Card 4
│   │   │   └── graduateList.js      ← tabel
│   │   ├── mbkm/                  ⚠️ 4 file saat ini — TIDAK KONSISTEN
│   │   │   ├── filterBuilder.js   ✅ Ada
│   │   │   ├── filterOptions.js   ✅ Ada
│   │   │   ├── mbkmSummary.js     ⚠️ Harus di-refactor lalu DIHAPUS
│   │   │   └── mbkmList.js        ✅ Ada
│   │   └── studentDeduplicationService.js ✅ Deduplikasi terpadu
│   ├── utils/
│   │   ├── logger.js              ✅ Custom logger
│   │   └── syncJobTracker.js      ✅ File-based job status
│   └── server.js                  ✅ Express entry point
```

### 2. Status Tab Dashboard

| Tab | Route Prefix | Endpoint Ada | Detail Card (Popup) |
|---|---|---|---|
| **Student Data** | `/api/students/*` | ✅ 6 endpoint | ✅ 4 detail endpoint |
| **Graduate Data** | `/api/graduates/*` | ✅ 6 endpoint | ✅ 4 detail endpoint |
| **MBKM Data** | `/api/mbkm/*` | ✅ 2 endpoint | 🔴 Belum ada — **Target Part 5** |

### 3. Pola Modular yang Wajib Diikuti (Students & Graduates)

Kedua tab yang sudah selesai menggunakan pola yang sama persis:

| Slot | Students (7 file) | Graduates (7 file) |
|---|---|---|
| File 1 | `filterBuilder.js` — shared helper | `filterBuilder.js` — shared helper |
| File 2 | `filterOptions.js` — dropdown filter | `filterOptions.js` — dropdown filter |
| File 3 | `activeStudents.js` — **detail Card 1** | `totalLulusan.js` — **detail Card 1** |
| File 4 | `internationalTrend.js` — **detail Card 2** | `ipkTrend.js` — **detail Card 2** |
| File 5 | `intakeTrend.js` — **detail Card 3** | `tepatWaktu.js` — **detail Card 3** |
| File 6 | `declineTrend.js` — **detail Card 4** | `keberhasilanStudi.js` — **detail Card 4** |
| File 7 | `studentList.js` — tabel | `graduateList.js` — tabel |

> **Pola kunci:** Tidak ada file `*Summary.js` di service layer. Logic summary (kalkulasi 4 card sekaligus) ada **langsung di controller** menggunakan fungsi-fungsi dari file detail yang di-import. Pola inilah yang harus diterapkan di MBKM.

---

## ⚠️ Masalah Inkonsistensi yang Harus Diperbaiki

### Masalah: `mbkmSummary.js` tidak sesuai pola

Saat ini folder `src/services/mbkm/` memiliki file `mbkmSummary.js` yang berisi fungsi-fungsi kalkulasi 4 card sekaligus dalam **1 file gabungan**. Ini **tidak konsisten** dengan pola `students/` dan `graduates/` yang memisahkan setiap logic detail card ke file masing-masing.

**Bandingkan:**
- `graduates/`: `totalLulusan.js` (Card 1), `ipkTrend.js` (Card 2), `tepatWaktu.js` (Card 3), `keberhasilanStudi.js` (Card 4) — **masing-masing file terpisah**
- `mbkm/`: `mbkmSummary.js` — **semua card dalam 1 file** ❌

### Solusi: Refactor + Hapus `mbkmSummary.js`

Fungsi-fungsi yang ada di `mbkmSummary.js` dipindahkan ke file-file baru yang sesuai, lalu `mbkmSummary.js` dihapus. Logic kalkulasi summary di controller menggantikan pemanggilan ke `mbkmSummary.js`.

---

## 🎯 TARGET AKHIR: 7 File Service MBKM (Konsisten)

```
src/services/mbkm/              TARGET AKHIR: 7 file
├── filterBuilder.js    ✅ Ada — file 1 (update: tambah buildStudentFilterFromMbkmQuery)
├── filterOptions.js    ✅ Ada — file 2 (tidak berubah)
├── mbkmRate.js         🆕 Baru — file 3 (detail Card 1: % MBKM vs Eligible)
├── mbkmActivities.js   🆕 Baru — file 4 (detail Card 2: 3 fungsi distribusi dalam 1 file)
├── mbkmEligible.js     🆕 Baru — file 5 (detail Card 3: eligible students per prodi)
├── mbkmMitra.js        🆕 Baru — file 6 (detail Card 4: distribusi mitra)
└── mbkmList.js         ✅ Ada — file 7 (tidak berubah)

⛔ mbkmSummary.js       DIHAPUS (setelah logic dipindah ke controller)
```

> **Mengapa Card 4 (mitra) punya file sendiri (`mbkmMitra.js`)?**
> Konsisten dengan pola `graduates/keberhasilanStudi.js` dan `students/declineTrend.js` — setiap detail card punya file service sendiri. Logic mitra (groupBy + sort + slice) layak memiliki file tersendiri agar controller tetap bersih sebagai pure dispatcher.

---

## ⚠️ Temuan Kritis dari Inspeksi Data Riil

### Temuan 1: Field `statusKeaktifan` di `mbkm_activities` BUKAN Enum Status

Field `statusKeaktifan` di tabel `mbkm_activities` **tidak berisi** nilai enum `"Aktif"`, `"Selesai"`, `"Evaluasi"` seperti yang tertulis di requirement-part4. Berdasarkan inspeksi data nyata, field ini berisi **judul aktivitas** (sama dengan `judulAktivitas`):

```json
{
  "nim": "23010023",
  "statusKeaktifan": "Pengalaman Studi di Luar Negeri",
  "jenisAktivitas": "Pertukaran Pelajar (Kampus Merdeka)",
  "judulAktivitas": "Pengalaman Studi di Luar Negeri",
  "statusAktivitas": "Disetujui"
}
```

### Temuan 2: Field `statusAktivitas` adalah Status Sebenarnya

| Field | Nilai yang Ada di DB | Fungsi Sebenarnya |
|---|---|---|
| `statusAktivitas` | `"Diajukan"`, `"Dibatalkan"`, `"Disetujui"`, `"Ditolak"`, `"Selesai"` | ✅ Status proses MBKM yang valid |
| `statusKeaktifan` | Berisi judul aktivitas (string panjang) | ❌ Bukan enum status |
| `jenisAktivitas` | 5 jenis BKP Kampus Merdeka | Kategori jenis kegiatan |

### Temuan 3: Jenis Aktivitas yang Tersedia di Database (5 Jenis)

| Jenis Aktivitas | Count (approx) |
|---|---|
| `"Magang/Praktik Kerja (Kampus Merdeka)"` | 284 |
| `"Penelitian/Riset (Kampus Merdeka)"` | 214 |
| `"Pertukaran Pelajar (Kampus Merdeka)"` | 26 |
| `"Studi/Proyek Independen (Kampus Merdeka)"` | 19 |
| `"Kegiatan Wirausaha (Kampus Merdeka)"` | 6 |

### Temuan 4: Data Mahasiswa Eligible Saat Ini

- **Total mahasiswa semester 7 aktif**: 133 mahasiswa (ini adalah `eligibleCount`)
- **Total record MBKM periode terbaru (20261)**: 137 record

### Temuan 5: Adaptasi Rumus MBKM Wajib ke Data Riil

**Rumus wajib dari user (original):**
```
MBKM = statusKeaktifan = "Aktif" AND jenisAktivitas NOT blank
       DITAMBAH statusKeaktifan = "Selesai" ATAU "Evaluasi"
Eligible = jumlah mahasiswa aktif semester 7 pada periode dipilih
%MBKM = (MBKM / Eligible) × 100%
```

**Adaptasi ke data riil** (karena `statusKeaktifan` di `mbkm_activities` berisi judul bukan enum):
```
MBKM = statusAktivitas IN ["Disetujui", "Selesai"]
       AND jenisAktivitas NOT empty/null
       (pada periode yang dipilih)

Alasan mapping:
  - "Disetujui" ≈ "sedang berjalan/aktif" (setara intent statusKeaktifan="Aktif")
  - "Selesai"   ≈ "telah selesai" (setara intent statusKeaktifan="Selesai")
  - "Evaluasi" dari requirement-part4 tidak ada di DB → diabaikan
  - "Diajukan", "Ditolak", "Dibatalkan" tidak dihitung sebagai peserta aktif MBKM
```

---

## 🎯 Spesifikasi Lengkap 6 Endpoint Analytics

### 🔵 Card 1 → `GET /api/mbkm/analytics/rate`

**Tujuan:** Popup detail Card 1 "% MBKM terhadap Mahasiswa Eligible" — menampilkan persentase partisipasi IKU-2 beserta sebaran data per fakultas.

**Service file:** `src/services/mbkm/mbkmRate.js` (file 3)

**Query Parameters:**
| Parameter | Tipe | Keterangan |
|---|---|---|
| `periode` | string | Periode yang dipilih (default: periode terbaru dari DB) |
| `fakultas` | string (multi) | Filter fakultas (multi-select) |
| `programStudi` | string (multi) | Filter program studi (multi-select) |
| `angkatan` | string (multi) | Filter angkatan (multi-select) |
| `jenjang` | string | Filter jenjang S1/S2 |

**Logika Kalkulasi (dalam `mbkmRate.js`):**
```js
// MBKM count = statusAktivitas Disetujui atau Selesai, jenisAktivitas tidak kosong
const mbkmCount = await prisma.mbkmActivity.count({
    where: {
        periode: selectedPeriode,
        statusAktivitas: { in: ['Disetujui', 'Selesai'] },
        jenisAktivitas: { not: '' },
        // + filter fakultas/programStudi/jenjang jika ada
    }
});

// Breakdown per status untuk participantStats
const disetujuiCount = await prisma.mbkmActivity.count({
    where: { periode: selectedPeriode, statusAktivitas: 'Disetujui', jenisAktivitas: { not: '' } }
});
const selesaiCount = await prisma.mbkmActivity.count({
    where: { periode: selectedPeriode, statusAktivitas: 'Selesai', jenisAktivitas: { not: '' } }
});

// Eligible = mahasiswa semester 7 aktif
const eligibleCount = await prisma.student.count({
    where: { semester: 7, statusKeaktifan: 'Aktif', /* + student filter */ }
});

// % IKU-2
const percentage = eligibleCount > 0
    ? parseFloat(((mbkmCount / eligibleCount) * 100).toFixed(2))
    : 0;
const meetsTarget = percentage >= 20.0;

// Distribusi per fakultas (groupBy di JS setelah fetch)
const facultyGroups = await prisma.mbkmActivity.groupBy({
    by: ['fakultas'],
    _count: true,
    where: { periode: selectedPeriode, statusAktivitas: { in: ['Disetujui', 'Selesai'] }, jenisAktivitas: { not: '' } },
    orderBy: [{ fakultas: 'asc' }]
});
const facultyData = facultyGroups
    .sort((a, b) => b._count - a._count)
    .map(g => ({
        name: g.fakultas,
        count: g._count,
        percentage: `${((g._count / mbkmCount) * 100).toFixed(1)}%`
    }));
```

**Response JSON:**
```json
{
  "success": true,
  "message": "Berhasil memuat analisis partisipasi MBKM vs Mahasiswa Eligible",
  "selectedPeriode": "20261",
  "data": {
    "participantStats": {
      "count": 76,
      "disetujuiCount": 46,
      "selesaiCount": 30
    },
    "eligibleCount": 133,
    "eligibleRate": {
      "percentage": "57.1%",
      "numPercentage": 57.14,
      "meetsTarget": true,
      "targetIku2": 20.0,
      "badge": "Target IKU-2 Tercapai"
    },
    "facultyData": [
      { "name": "Ilmu Kesehatan dan Biosains", "count": 58, "percentage": "76.3%" },
      { "name": "Bisnis dan Manajemen", "count": 18, "percentage": "23.7%" }
    ]
  }
}
```

---

### 🟡 Card 2 → 3 Sub-Endpoint (semua dalam 1 file `mbkmActivities.js`)

Card 2 "Total Aktivitas MBKM" memiliki **3 tab visualisasi** → 3 endpoint, namun logika kalkulasi disatukan dalam **1 file service** (`mbkmActivities.js`) agar total tetap 7 file. Ini konsisten dengan `ipkTrend.js` di graduates yang juga menyimpan 3 fungsi untuk 3 tab.

**Service file:** `src/services/mbkm/mbkmActivities.js` (file 4)

#### Tab A: `GET /api/mbkm/analytics/activity-distribution`

**Tujuan:** Distribusi peserta berdasarkan jenis aktivitas BKP Kampus Merdeka.

**Logika Kalkulasi:**
```js
const activityGroups = await prisma.mbkmActivity.groupBy({
    by: ['jenisAktivitas'],
    _count: true,
    where: {
        periode: selectedPeriode,
        jenisAktivitas: { not: '' },
        statusAktivitas: { in: ['Disetujui', 'Selesai'] },
    },
    orderBy: [{ jenisAktivitas: 'asc' }]
});
// Sort by count descending di JS
const sorted = activityGroups.sort((a, b) => b._count - a._count);
const total = sorted.reduce((sum, g) => sum + g._count, 0);
const items = sorted.map(g => ({
    name: g.jenisAktivitas,
    count: g._count,
    percentage: `${total > 0 ? ((g._count / total) * 100).toFixed(1) : '0.0'}%`
}));
```

**Response JSON:**
```json
{
  "success": true,
  "message": "Berhasil memuat distribusi jenis aktivitas MBKM",
  "selectedPeriode": "20261",
  "data": {
    "total": 76,
    "items": [
      { "name": "Magang/Praktik Kerja (Kampus Merdeka)", "count": 38, "percentage": "50.0%" },
      { "name": "Penelitian/Riset (Kampus Merdeka)", "count": 28, "percentage": "36.8%" },
      { "name": "Pertukaran Pelajar (Kampus Merdeka)", "count": 6, "percentage": "7.9%" },
      { "name": "Studi/Proyek Independen (Kampus Merdeka)", "count": 3, "percentage": "3.9%" },
      { "name": "Kegiatan Wirausaha (Kampus Merdeka)", "count": 1, "percentage": "1.3%" }
    ]
  }
}
```

#### Tab B: `GET /api/mbkm/analytics/prodi-distribution`

**Tujuan:** Sebaran partisipasi MBKM per program studi.

**Logika Kalkulasi:**
```js
const prodiGroups = await prisma.mbkmActivity.groupBy({
    by: ['programStudi'],
    _count: true,
    where: {
        periode: selectedPeriode,
        jenisAktivitas: { not: '' },
        statusAktivitas: { in: ['Disetujui', 'Selesai'] },
    },
    orderBy: [{ programStudi: 'asc' }]
});
// Sort descending by count di JS
```

**Response JSON:**
```json
{
  "success": true,
  "message": "Berhasil memuat sebaran program studi MBKM",
  "selectedPeriode": "20261",
  "data": {
    "total": 76,
    "items": [
      { "name": "Bio Medis dan Rekayasa Hayati", "count": 22, "percentage": "28.9%" },
      { "name": "Bio Teknologi", "count": 18, "percentage": "23.7%" },
      { "name": "Teknologi Pangan", "count": 14, "percentage": "18.4%" },
      { "name": "Pangan dan Nutrisi", "count": 10, "percentage": "13.2%" }
    ]
  }
}
```

#### Tab C: `GET /api/mbkm/analytics/status-distribution`

**Tujuan:** Distribusi status aktivitas MBKM (semua status, termasuk Ditolak & Dibatalkan untuk Pie Chart).

**Logika Kalkulasi:**
```js
const statusGroups = await prisma.mbkmActivity.groupBy({
    by: ['statusAktivitas'],
    _count: true,
    where: {
        periode: selectedPeriode,
        jenisAktivitas: { not: '' }
        // Tidak filter statusAktivitas — tampilkan SEMUA status
    }
});
const total = statusGroups.reduce((sum, g) => sum + g._count, 0);
```

**Response JSON:**
```json
{
  "success": true,
  "message": "Berhasil memuat status verifikasi dan evaluasi MBKM",
  "selectedPeriode": "20261",
  "data": {
    "total": 137,
    "items": [
      { "name": "Disetujui", "count": 76, "percentage": "55.5%" },
      { "name": "Selesai", "count": 50, "percentage": "36.5%" },
      { "name": "Diajukan", "count": 8, "percentage": "5.8%" },
      { "name": "Ditolak", "count": 2, "percentage": "1.5%" },
      { "name": "Dibatalkan", "count": 1, "percentage": "0.7%" }
    ]
  }
}
```

---

### 🟠 Card 3 → `GET /api/mbkm/analytics/eligible-students`

**Tujuan:** Popup detail Card 3 "Mahasiswa Eligible Semester 7" — total mahasiswa aktif semester 7 beserta sebaran per program studi.

**Service file:** `src/services/mbkm/mbkmEligible.js` (file 5)

**Query Parameters:**
| Parameter | Tipe | Keterangan |
|---|---|---|
| `fakultas` | string (multi) | Filter fakultas |
| `programStudi` | string (multi) | Filter program studi |
| `angkatan` | string (multi) | Filter angkatan |
| `jenjang` | string | Filter jenjang |

**Logika Kalkulasi (dalam `mbkmEligible.js`):**
```js
// Total eligible
const eligibleCount = await prisma.student.count({
    where: {
        semester: 7,
        statusKeaktifan: 'Aktif',
        // + student filter dari query params
    }
});

// Distribusi per program studi (groupBy di students)
const prodiGroups = await prisma.student.groupBy({
    by: ['programStudi'],
    _count: true,
    where: {
        semester: 7,
        statusKeaktifan: 'Aktif',
        // + filter
    },
    orderBy: [{ programStudi: 'asc' }]
});
// Sort descending by count di JS, hitung persentase dari eligibleCount
const prodiData = prodiGroups
    .sort((a, b) => b._count - a._count)
    .map(g => ({
        name: g.programStudi,
        count: g._count,
        percentage: `${eligibleCount > 0 ? ((g._count / eligibleCount) * 100).toFixed(1) : '0.0'}%`
    }));
```

**Response JSON:**
```json
{
  "success": true,
  "message": "Berhasil memuat data mahasiswa eligible semester 7",
  "data": {
    "eligibleCount": 133,
    "prodiData": [
      { "name": "Bio Teknologi", "count": 38, "percentage": "28.6%" },
      { "name": "Bio Medis dan Rekayasa Hayati", "count": 33, "percentage": "24.8%" },
      { "name": "Teknologi Pangan", "count": 24, "percentage": "18.0%" },
      { "name": "Pangan dan Nutrisi", "count": 13, "percentage": "9.8%" },
      { "name": "Manajemen Bisnis Internasional", "count": 13, "percentage": "9.8%" },
      { "name": "Farmasi", "count": 9, "percentage": "6.8%" },
      { "name": "Magister Bio Manajemen", "count": 1, "percentage": "0.8%" }
    ]
  }
}
```

---

### 🟢 Card 4 → `GET /api/mbkm/analytics/mitra-distribution`

**Tujuan:** Popup detail Card 4 "Total Mitra" — total jumlah mitra unik dan top N mitra berdasarkan jumlah penempatan mahasiswa.

**Service file:** `src/services/mbkm/mbkmMitra.js` (file 6)

> **Logika Periode Card 4:** Card 4 di `/api/mbkm/summary` menggunakan data dari `previousPeriode` (semester sebelumnya). Endpoint analytics ini **mengikuti logika yang sama** — default tampilkan data mitra dari periode sebelumnya. User bisa memilih periode tertentu via query param `?periode=`.

**Query Parameters:**
| Parameter | Tipe | Keterangan |
|---|---|---|
| `periode` | string | Periode yang dipilih (default: `previousPeriode` dari periode terbaru DB) |
| `topN` | number | Jumlah top mitra yang ditampilkan (default: 10, min: 1, max: 50) |

**Logika Kalkulasi (dalam `mbkmMitra.js`):**
```js
async function getMitraDistribution(selectedPeriode, topN = 10) {
    // groupBy mitra, exclude kosong dan "-"
    const mitraGroups = await prisma.mbkmActivity.groupBy({
        by: ['mitra'],
        _count: true,
        where: {
            periode: selectedPeriode,
            AND: [{ mitra: { not: '' } }, { mitra: { not: '-' } }]
        },
        orderBy: [{ mitra: 'asc' }]
    });

    const totalPartners = mitraGroups.length;
    const totalPlacements = mitraGroups.reduce((sum, g) => sum + g._count, 0);
    const topMitra = mitraGroups
        .sort((a, b) => b._count - a._count)
        .slice(0, topN)
        .map(g => ({
            name: g.mitra,
            count: g._count,
            percentage: totalPlacements > 0
                ? `${((g._count / totalPlacements) * 100).toFixed(1)}%`
                : '0.0%'
        }));

    return { totalPartners, totalPlacements, mitraData: topMitra };
}
```

**Response JSON:**
```json
{
  "success": true,
  "message": "Berhasil memuat sebaran penempatan mitra industri & riset",
  "selectedPeriode": "20252",
  "data": {
    "totalPartners": 13,
    "totalPlacements": 19,
    "mitraData": [
      { "name": "Taipei Medical University", "count": 4, "percentage": "21.1%" },
      { "name": "Chang Gung University", "count": 3, "percentage": "15.8%" },
      { "name": "Indonesia International Institute for Life-Science", "count": 3, "percentage": "15.8%" }
    ]
  }
}
```

---

## 🗂️ Arsitektur File Akhir (Sepenuhnya Konsisten — Pola 7 File)

```
src/
├── services/
│   └── mbkm/                      AKHIR: 7 file (konsisten dengan students/ dan graduates/)
│       ├── filterBuilder.js       🔄 Update — file 1 (tambah buildStudentFilterFromMbkmQuery)
│       ├── filterOptions.js       ✅ Ada — file 2 (tidak berubah)
│       ├── mbkmRate.js            🆕 Baru — file 3 (Card 1 detail: % MBKM vs Eligible)
│       ├── mbkmActivities.js      🆕 Baru — file 4 (Card 2 detail: 3 fungsi distribusi)
│       ├── mbkmEligible.js        🆕 Baru — file 5 (Card 3 detail: eligible per prodi)
│       ├── mbkmMitra.js           🆕 Baru — file 6 (Card 4 detail: distribusi mitra)
│       └── mbkmList.js            ✅ Ada — file 7 (tidak berubah)
│
│       ⛔ mbkmSummary.js           DIHAPUS (logic summary dipindah ke controller)
│
├── controllers/
│   └── mbkmController.js          🔄 Update — refactor summary handler + tambah 6 handler analytics
│
└── routes/
    └── mbkmRoutes.js              🔄 Update — tambah 6 route /analytics/*
```

### Ringkasan File yang Dibuat/Diubah/Dihapus

| File | Status | Keterangan |
|---|---|---|
| `src/services/mbkm/filterBuilder.js` | 🔄 Update | Tambah export `buildStudentFilterFromMbkmQuery` |
| `src/services/mbkm/mbkmSummary.js` | ⛔ Dihapus | Logic dipindah ke controller langsung |
| `src/services/mbkm/mbkmRate.js` | 🆕 Baru | Card 1 detail: % MBKM + faculty breakdown |
| `src/services/mbkm/mbkmActivities.js` | 🆕 Baru | Card 2 detail: 3 fungsi distribusi (activity, prodi, status) |
| `src/services/mbkm/mbkmEligible.js` | 🆕 Baru | Card 3 detail: eligible students per prodi |
| `src/services/mbkm/mbkmMitra.js` | 🆕 Baru | Card 4 detail: top N mitra + total mitra |
| `src/controllers/mbkmController.js` | 🔄 Update | Refactor getSummary (hapus import mbkmSummary) + tambah 6 handler analytics |
| `src/routes/mbkmRoutes.js` | 🔄 Update | Tambah 6 route baru di bawah prefix `/analytics/` |

> File lain tidak perlu diubah sama sekali.

---

## 📌 Catatan Teknis Penting

### 1. Adaptasi Rumus MBKM (Kritis)

Rumus wajib user mengacu pada field `statusKeaktifan`, namun field tersebut di `mbkm_activities` berisi **judul kegiatan** bukan status enum. Mapping yang benar adalah menggunakan `statusAktivitas`:

| Intent Requirement-Part4 | Implementasi Aktual |
|---|---|
| `statusKeaktifan = "Aktif" AND jenisAktivitas != ""` | `statusAktivitas = "Disetujui" AND jenisAktivitas != ""` |
| `statusKeaktifan = "Selesai"` | `statusAktivitas = "Selesai"` |
| `statusKeaktifan = "Evaluasi"` | Tidak ada di DB — tidak dihitung |

### 2. Sorting di JavaScript (bukan di Prisma/DB)

Prisma dengan MySQL **kadang tidak mendukung** `orderBy: { _count: { _all: 'desc' } }` untuk groupBy. **Solusi aman:** selalu lakukan sorting di JavaScript setelah data diambil:
```js
groups.sort((a, b) => b._count - a._count);
```

### 3. Filter Mitra — Ekslusi Value Tidak Valid

Field `mitra` bisa berisi string kosong `""` atau tanda strip `"-"`. Keduanya harus dieksklusi:
```js
// ✅ Cara yang benar menggunakan AND:
where: {
    AND: [
        { mitra: { not: '' } },
        { mitra: { not: '-' } }
    ]
}
// ❌ Salah: { mitra: { not: '', not: '-' } } — key duplikat, hanya yang terakhir berlaku
```

### 4. Penentuan Periode Default per Endpoint

- **Endpoint analytics Card 1, 2, 3** (`rate`, `activity-distribution`, `prodi-distribution`, `status-distribution`, `eligible-students`): default ke **periode terbaru** dari DB (`getDefaultPeriode`)
- **Endpoint analytics Card 4** (`mitra-distribution`): default ke **periode sebelumnya** dari periode terbaru (`getPreviousPeriode(getDefaultPeriode())`) — konsisten dengan Card 4 di `/summary`

### 5. Helper `buildStudentFilterFromMbkmQuery` di `filterBuilder.js`

Diperlukan untuk endpoint yang query ke tabel `students` (Card 1 & Card 3 analytics). Ditambahkan sebagai export baru di `filterBuilder.js`:
```js
function buildStudentFilterFromMbkmQuery(query) {
    const studentFilter = {};
    if (query.angkatan) {
        const list = Array.isArray(query.angkatan) ? query.angkatan : [query.angkatan];
        if (list.length > 0) studentFilter.angkatan = { in: list };
    }
    if (query.fakultas) {
        const list = Array.isArray(query.fakultas) ? query.fakultas : [query.fakultas];
        if (list.length > 0) studentFilter.fakultas = { in: list };
    }
    if (query.programStudi) {
        const list = Array.isArray(query.programStudi) ? query.programStudi : [query.programStudi];
        if (list.length > 0) studentFilter.programStudi = { in: list };
    }
    if (query.jenjang) studentFilter.jenjang = query.jenjang;
    return studentFilter;
}
module.exports = { buildMbkmFilter, getPaginationParams, getDefaultPeriode, getPreviousPeriode, buildStudentFilterFromMbkmQuery };
```

### 6. Refactor `getSummary` di Controller

Setelah `mbkmSummary.js` dihapus, controller `getSummary` harus di-refactor:
- Import `getPersentaseMbkm`, `getTotalMbkmAktif`, `getTotalEligible`, `getTotalMitra` dari file baru (bukan dari `mbkmSummary.js`)
- Fungsi-fungsi tersebut sudah tersedia di masing-masing file baru:
  - `getPersentaseMbkm` → dari `mbkmRate.js` (atau tetap inline di controller sebagai fungsi sederhana)
  - `getTotalMbkmAktif` → tetap di controller (1 baris query sederhana)
  - `getTotalEligible` → dari `mbkmEligible.js`
  - `getTotalMitra` → dari `mbkmMitra.js`

> **Catatan:** Untuk simplisitas refactor dan menjaga controller tetap clean, fungsi-fungsi kalkulasi summary card yang dibutuhkan di `/summary` endpoint dapat di-import dari file-file service baru yang relevan.

### 7. Target IKU-2 dan Badge Logic

```js
const TARGET_IKU2 = 20.0; // Target nasional MBKM >= 20%
const meetsTarget = percentage >= TARGET_IKU2;
const badge = eligibleCount === 0
    ? 'Data Tidak Tersedia'
    : meetsTarget
        ? 'Target IKU-2 Tercapai'
        : 'Target IKU-2 Belum Tercapai';
```

### 8. Konsistensi Format Persentase

Semua persentase dikembalikan dalam dua format:
- String: `"57.1%"` (untuk tampilan langsung di frontend)
- Number: `57.14` (untuk logika/kalkulasi di frontend)

---

## 🔗 Ringkasan Endpoint Baru

| Method | Endpoint | Card | Service File | Deskripsi |
|---|---|---|---|---|
| `GET` | `/api/mbkm/analytics/rate` | Card 1 | `mbkmRate.js` | % MBKM vs Eligible + sebaran per fakultas |
| `GET` | `/api/mbkm/analytics/activity-distribution` | Card 2 Tab A | `mbkmActivities.js` | Distribusi jenis aktivitas BKP |
| `GET` | `/api/mbkm/analytics/prodi-distribution` | Card 2 Tab B | `mbkmActivities.js` | Sebaran per program studi |
| `GET` | `/api/mbkm/analytics/status-distribution` | Card 2 Tab C | `mbkmActivities.js` | Distribusi status aktivitas (Pie Chart) |
| `GET` | `/api/mbkm/analytics/eligible-students` | Card 3 | `mbkmEligible.js` | Sebaran eligible mahasiswa semester 7 per prodi |
| `GET` | `/api/mbkm/analytics/mitra-distribution` | Card 4 | `mbkmMitra.js` | Top N mitra + total mitra unik |

---

## ✅ TODOLIST IMPLEMENTASI — Analytics Detail Card MBKM

> Dikerjakan secara berurutan dari atas ke bawah. Setiap item dikelompokkan per tahap.

---

### 🔵 TAHAP 1 — Persiapan & Verifikasi Data

- [x] **1.1** Baca dan pahami dokumen ini beserta Part 1 s.d. Part 4.

- [x] **1.2** Verifikasi bahwa field `statusKeaktifan` di `mbkm_activities` memang berisi judul (bukan enum), dengan query:
  ```bash
  node -e "
  const p = require('./src/config/prisma');
  p.mbkmActivity.findMany({ take: 5, select: { statusKeaktifan: true, statusAktivitas: true, jenisAktivitas: true } })
    .then(r => console.log(JSON.stringify(r, null, 2))).finally(() => p.\$disconnect());
  "
  ```

- [x] **1.3** Konfirmasi semua nilai `statusAktivitas` yang ada di DB:
  ```bash
  node -e "
  const p = require('./src/config/prisma');
  p.mbkmActivity.groupBy({ by: ['statusAktivitas'], _count: true })
    .then(r => console.log(JSON.stringify(r, null, 2))).finally(() => p.\$disconnect());
  "
  ```

- [x] **1.4** Hitung simulasi Card 1 secara manual untuk memvalidasi kalkulasi:
  ```bash
  node -e "
  const p = require('./src/config/prisma');
  Promise.all([
    p.mbkmActivity.count({ where: { statusAktivitas: { in: ['Disetujui', 'Selesai'] }, jenisAktivitas: { not: '' } } }),
    p.student.count({ where: { semester: 7, statusKeaktifan: 'Aktif' } })
  ]).then(([mbkm, eligible]) => {
    console.log('MBKM count:', mbkm);
    console.log('Eligible:', eligible);
    console.log('Percentage:', ((mbkm / eligible) * 100).toFixed(2) + '%');
  }).finally(() => p.\$disconnect());
  "
  ```

- [x] **1.5** Verifikasi distribusi per jenisAktivitas pada periode terbaru:
  ```bash
  node -e "
  const p = require('./src/config/prisma');
  p.mbkmActivity.groupBy({
    by: ['jenisAktivitas'], _count: true,
    where: { statusAktivitas: { in: ['Disetujui', 'Selesai'] }, jenisAktivitas: { not: '' } },
    orderBy: [{ jenisAktivitas: 'asc' }]
  }).then(r => console.log(JSON.stringify(r, null, 2))).finally(() => p.\$disconnect());
  "
  ```

- [x] **1.6** Verifikasi distribusi mitra pada periode sebelumnya:
  ```bash
  node -e "
  const p = require('./src/config/prisma');
  p.mbkmActivity.groupBy({
    by: ['mitra'], _count: true,
    where: { AND: [{ mitra: { not: '' } }, { mitra: { not: '-' } }] },
    orderBy: [{ mitra: 'asc' }]
  }).then(r => {
    r.sort((a,b) => b._count - a._count);
    console.log(JSON.stringify(r.slice(0, 10), null, 2));
    console.log('Total mitra unik:', r.length);
  }).finally(() => p.\$disconnect());
  "
  ```

---

### 🟡 TAHAP 2 — Buat 4 File Service Baru + Update filterBuilder.js

Semua file baru dibuat di folder: `src/services/mbkm/`

- [x] **2.1** Update `src/services/mbkm/filterBuilder.js` — tambahkan fungsi dan export `buildStudentFilterFromMbkmQuery`:

  Tambahkan fungsi berikut di bawah `getPreviousPeriode`, lalu update `module.exports`:
  ```js
  /**
   * Build student where clause dari query params MBKM
   * (untuk endpoint yang query ke tabel students, seperti eligible students dan rate)
   */
  function buildStudentFilterFromMbkmQuery(query) {
      const studentFilter = {};
      if (query.angkatan) {
          const list = Array.isArray(query.angkatan) ? query.angkatan : [query.angkatan];
          if (list.length > 0) studentFilter.angkatan = { in: list };
      }
      if (query.fakultas) {
          const list = Array.isArray(query.fakultas) ? query.fakultas : [query.fakultas];
          if (list.length > 0) studentFilter.fakultas = { in: list };
      }
      if (query.programStudi) {
          const list = Array.isArray(query.programStudi) ? query.programStudi : [query.programStudi];
          if (list.length > 0) studentFilter.programStudi = { in: list };
      }
      if (query.jenjang) studentFilter.jenjang = query.jenjang;
      return studentFilter;
  }

  module.exports = { buildMbkmFilter, getPaginationParams, getDefaultPeriode, getPreviousPeriode, buildStudentFilterFromMbkmQuery };
  ```

- [x] **2.2** Buat `src/services/mbkm/mbkmRate.js` (Card 1 — % MBKM vs Eligible):

  Fungsi `getMbkmRate(whereFilter, selectedPeriode, studentFilter)`:
  - Query `mbkmActivity.count` WHERE `statusAktivitas IN ['Disetujui','Selesai']` AND `jenisAktivitas != ''` AND periode = selectedPeriode + filter → `mbkmCount`
  - Query `mbkmActivity.count` WHERE `statusAktivitas = 'Disetujui'` AND `jenisAktivitas != ''` → `disetujuiCount`
  - Query `mbkmActivity.count` WHERE `statusAktivitas = 'Selesai'` AND `jenisAktivitas != ''` → `selesaiCount`
  - Query `student.count` WHERE `semester=7` AND `statusKeaktifan='Aktif'` + studentFilter → `eligibleCount`
  - Hitung `percentage = (mbkmCount / eligibleCount) * 100`, handle `eligibleCount = 0` → percentage = 0
  - Hitung `meetsTarget = percentage >= 20.0`, buat `badge` string
  - Query `mbkmActivity.groupBy({ by: ['fakultas'] })` → sort by count desc di JS → map ke `{ name, count, percentage }` → `facultyData`
  - Return `{ participantStats: { count, disetujuiCount, selesaiCount }, eligibleCount, eligibleRate: { percentage, numPercentage, meetsTarget, targetIku2: 20.0, badge }, facultyData }`

  ```js
  // Signature export:
  module.exports = { getMbkmRate };
  ```

- [x] **2.3** Buat `src/services/mbkm/mbkmActivities.js` (Card 2 — 3 fungsi distribusi dalam 1 file):

  - Fungsi `getActivityDistribution(whereFilter, selectedPeriode)`:
    - Query `mbkmActivity.groupBy({ by: ['jenisAktivitas'] })` dengan filter `statusAktivitas IN ['Disetujui','Selesai']` dan `jenisAktivitas != ''`
    - Sort by count desc di JS, hitung total, map ke `{ name, count, percentage }`
    - Return `{ total, items }`
  - Fungsi `getProdiDistribution(whereFilter, selectedPeriode)`:
    - Query `mbkmActivity.groupBy({ by: ['programStudi'] })` dengan filter yang sama
    - Sort by count desc di JS, hitung total, map ke `{ name, count, percentage }`
    - Return `{ total, items }`
  - Fungsi `getStatusDistribution(whereFilter, selectedPeriode)`:
    - Query `mbkmActivity.groupBy({ by: ['statusAktivitas'] })` — **semua status** (tidak filter statusAktivitas)
    - Filter hanya `jenisAktivitas != ''` dan periode
    - Hitung total, sort by count desc, map ke `{ name, count, percentage }`
    - Return `{ total, items }`

  ```js
  // Signature export:
  module.exports = { getActivityDistribution, getProdiDistribution, getStatusDistribution };
  ```

- [x] **2.4** Buat `src/services/mbkm/mbkmEligible.js` (Card 3 — Eligible Students):

  Fungsi `getEligibleStudents(studentFilter)`:
  - Query `student.count` WHERE `semester=7` AND `statusKeaktifan='Aktif'` + studentFilter → `eligibleCount`
  - Query `student.groupBy({ by: ['programStudi'] })` dengan filter yang sama → `prodiGroups`
  - Sort by count desc di JS, hitung persentase dari `eligibleCount`
  - Map ke `{ name, count, percentage }`
  - Return `{ eligibleCount, prodiData }`

  ```js
  // Signature export:
  module.exports = { getEligibleStudents };
  ```

- [x] **2.5** Buat `src/services/mbkm/mbkmMitra.js` (Card 4 — Distribusi Mitra):

  Fungsi `getMitraDistribution(selectedPeriode, topN = 10)`:
  - Query `mbkmActivity.groupBy({ by: ['mitra'] })` WHERE `AND: [{ mitra: { not: '' } }, { mitra: { not: '-' } }]` AND periode = selectedPeriode
  - `totalPartners = mitraGroups.length`
  - `totalPlacements = sum semua _count`
  - Sort by count desc di JS, slice top `topN`, map ke `{ name, count, percentage }`
  - Return `{ totalPartners, totalPlacements, mitraData: topMitra }`

  ```js
  // Signature export:
  module.exports = { getMitraDistribution };
  ```

---

### 🟠 TAHAP 3 — Refactor Controller

Update file: `src/controllers/mbkmController.js`

- [x] **3.1** Update import di bagian atas — ganti import dari `mbkmSummary.js` ke import dari file-file baru:
  ```js
  const { buildMbkmFilter, getPaginationParams, getDefaultPeriode, getPreviousPeriode, buildStudentFilterFromMbkmQuery } = require('../services/mbkm/filterBuilder');
  const { getMbkmFilterOptions } = require('../services/mbkm/filterOptions');
  const { getMbkmRate } = require('../services/mbkm/mbkmRate');
  const { getActivityDistribution, getProdiDistribution, getStatusDistribution } = require('../services/mbkm/mbkmActivities');
  const { getEligibleStudents } = require('../services/mbkm/mbkmEligible');
  const { getMitraDistribution } = require('../services/mbkm/mbkmMitra');
  const { getMbkmList } = require('../services/mbkm/mbkmList');
  const logger = require('../utils/logger');
  ```

  > ⛔ Hapus baris: `const { getPersentaseMbkm, getTotalMbkmAktif, getTotalEligible, getTotalMitra } = require('../services/mbkm/mbkmSummary');`

- [x] **3.2** Refactor handler `getSummary` — gunakan fungsi dari file-file baru:
  ```js
  // GET /api/mbkm/summary — Data 4 card + filter options untuk tab MBKM
  const getSummary = async (req, res) => {
      try {
          const selectedPeriode = req.query.periode || await getDefaultPeriode(prisma);
          const previousPeriode = getPreviousPeriode(selectedPeriode);
          const whereFilter = buildMbkmFilter({ ...req.query, periode: selectedPeriode });
          const studentFilter = buildStudentFilterFromMbkmQuery(req.query);

          const [filterOptions, rateData, totalEligible, totalMitra] = await Promise.all([
              getMbkmFilterOptions(),
              getMbkmRate(whereFilter, selectedPeriode, studentFilter),
              getEligibleStudents(studentFilter),
              getMitraDistribution(previousPeriode, 999) // ambil semua, hanya butuh totalPartners
          ]);

          return res.status(200).json({
              success: true,
              selectedPeriode,
              previousPeriode,
              summary: {
                  persentaseMbkm: {
                      mbkmCount: rateData.participantStats.count,
                      eligibleCount: rateData.eligibleCount,
                      percentage: rateData.eligibleRate.numPercentage
                  },
                  totalMbkmAktif: rateData.participantStats.disetujuiCount,
                  totalEligible: totalEligible.eligibleCount,
                  totalMitra: totalMitra.totalPartners
              },
              filterOptions
          });
      } catch (error) {
          logger.error(`[mbkm/getSummary] Error: ${error.message}`);
          return res.status(500).json({ success: false, message: 'Gagal mengambil summary MBKM.', error: error.message });
      }
  };
  ```

- [x] **3.3** Tambahkan handler `getRate`:
  ```js
  // GET /api/mbkm/analytics/rate — Detail Card 1: % MBKM vs Eligible
  const getRate = async (req, res) => {
      try {
          const selectedPeriode = req.query.periode || await getDefaultPeriode(prisma);
          const whereFilter = buildMbkmFilter({ ...req.query, periode: selectedPeriode });
          const studentFilter = buildStudentFilterFromMbkmQuery(req.query);
          const data = await getMbkmRate(whereFilter, selectedPeriode, studentFilter);
          return res.status(200).json({
              success: true,
              message: 'Berhasil memuat analisis partisipasi MBKM vs Mahasiswa Eligible',
              selectedPeriode,
              data
          });
      } catch (error) {
          logger.error(`[mbkm/getRate] Error: ${error.message}`);
          return res.status(500).json({ success: false, message: 'Gagal mengambil data rate MBKM.', error: error.message });
      }
  };
  ```

- [x] **3.4** Tambahkan handler `getActivityDistributionHandler`:
  ```js
  // GET /api/mbkm/analytics/activity-distribution — Detail Card 2 Tab A
  const getActivityDistributionHandler = async (req, res) => {
      try {
          const selectedPeriode = req.query.periode || await getDefaultPeriode(prisma);
          const whereFilter = buildMbkmFilter({ ...req.query, periode: selectedPeriode });
          const data = await getActivityDistribution(whereFilter, selectedPeriode);
          return res.status(200).json({
              success: true,
              message: 'Berhasil memuat distribusi jenis aktivitas MBKM',
              selectedPeriode,
              data
          });
      } catch (error) {
          logger.error(`[mbkm/getActivityDistribution] Error: ${error.message}`);
          return res.status(500).json({ success: false, message: 'Gagal mengambil distribusi aktivitas.', error: error.message });
      }
  };
  ```

- [x] **3.5** Tambahkan handler `getProdiDistributionHandler` (pola sama dengan 3.4, ganti fungsi ke `getProdiDistribution` dan message ke `'Berhasil memuat sebaran program studi MBKM'`).

- [x] **3.6** Tambahkan handler `getStatusDistributionHandler` (pola sama dengan 3.4, ganti fungsi ke `getStatusDistribution` dan message ke `'Berhasil memuat status verifikasi dan evaluasi MBKM'`).

- [x] **3.7** Tambahkan handler `getEligibleStudentsHandler`:
  ```js
  // GET /api/mbkm/analytics/eligible-students — Detail Card 3
  const getEligibleStudentsHandler = async (req, res) => {
      try {
          const studentFilter = buildStudentFilterFromMbkmQuery(req.query);
          const data = await getEligibleStudents(studentFilter);
          return res.status(200).json({
              success: true,
              message: 'Berhasil memuat data mahasiswa eligible semester 7',
              data
          });
      } catch (error) {
          logger.error(`[mbkm/getEligibleStudents] Error: ${error.message}`);
          return res.status(500).json({ success: false, message: 'Gagal mengambil data eligible.', error: error.message });
      }
  };
  ```

- [x] **3.8** Tambahkan handler `getMitraDistributionHandler`:
  ```js
  // GET /api/mbkm/analytics/mitra-distribution — Detail Card 4
  const getMitraDistributionHandler = async (req, res) => {
      try {
          const defaultLatest = await getDefaultPeriode(prisma);
          const previousPeriode = getPreviousPeriode(defaultLatest);
          const selectedPeriode = req.query.periode || previousPeriode;
          const topN = Math.min(50, Math.max(1, parseInt(req.query.topN) || 10));
          const data = await getMitraDistribution(selectedPeriode, topN);
          return res.status(200).json({
              success: true,
              message: 'Berhasil memuat sebaran penempatan mitra industri & riset',
              selectedPeriode,
              data
          });
      } catch (error) {
          logger.error(`[mbkm/getMitraDistribution] Error: ${error.message}`);
          return res.status(500).json({ success: false, message: 'Gagal mengambil data mitra.', error: error.message });
      }
  };
  ```

- [x] **3.9** Update `module.exports` — tambahkan semua handler baru:
  ```js
  module.exports = {
      getSummary,
      getMbkmData,
      getRate,
      getActivityDistributionHandler,
      getProdiDistributionHandler,
      getStatusDistributionHandler,
      getEligibleStudentsHandler,
      getMitraDistributionHandler
  };
  ```

- [x] **3.10** Hapus file `src/services/mbkm/mbkmSummary.js` setelah controller sudah berhasil di-refactor dan server berjalan normal.

---

### 🟢 TAHAP 4 — Update Routes

Update file: `src/routes/mbkmRoutes.js`

- [x] **4.1** Update import controller agar mengambil semua handler baru:
  ```js
  const {
      getSummary,
      getMbkmData,
      getRate,
      getActivityDistributionHandler,
      getProdiDistributionHandler,
      getStatusDistributionHandler,
      getEligibleStudentsHandler,
      getMitraDistributionHandler
  } = require('../controllers/mbkmController');
  ```

- [x] **4.2** Tambahkan 6 route baru setelah route yang sudah ada:
  ```js
  // Analytics endpoints — Detail card popup
  router.get('/analytics/rate', getRate);
  router.get('/analytics/activity-distribution', getActivityDistributionHandler);
  router.get('/analytics/prodi-distribution', getProdiDistributionHandler);
  router.get('/analytics/status-distribution', getStatusDistributionHandler);
  router.get('/analytics/eligible-students', getEligibleStudentsHandler);
  router.get('/analytics/mitra-distribution', getMitraDistributionHandler);
  ```

---

### 🔴 TAHAP 5 — Testing Manual (Verifikasi Zero Error)

- [x] **5.1** Jalankan server dan pastikan tidak ada error saat startup:
  ```bash
  npm run dev
  ```
  Cek log — tidak boleh ada `Cannot find module`, `TypeError`, atau `SyntaxError`.

- [x] **5.2** Pastikan endpoint lama masih berjalan (regresi test PERTAMA):
  ```bash
  curl -s "http://localhost:3000/api/mbkm/summary" \
    -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool

  curl -s "http://localhost:3000/api/mbkm/list" \
    -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  ```
  **Cek:** `success: true`, `summary.persentaseMbkm`, `summary.totalMitra` ada dan valid.

- [x] **5.3** Test `analytics/rate` (default periode terbaru, tanpa filter):
  ```bash
  curl -s "http://localhost:3000/api/mbkm/analytics/rate" \
    -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  ```
  **Cek:**
  - `success: true`
  - `data.eligibleRate.numPercentage` adalah angka valid (bukan NaN/Infinity)
  - `data.facultyData` berisi array (boleh kosong tapi tidak error)
  - `data.participantStats.count` >= 0

- [x] **5.4** Test `analytics/rate` dengan filter `periode` tertentu:
  ```bash
  curl -s "http://localhost:3000/api/mbkm/analytics/rate?periode=20251" \
    -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  ```

- [x] **5.5** Test `analytics/activity-distribution`:
  ```bash
  curl -s "http://localhost:3000/api/mbkm/analytics/activity-distribution" \
    -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  ```
  **Cek:**
  - `data.items` berisi 5 jenis aktivitas (sesuai data nyata di DB)
  - `data.total` = sum dari semua `count` di `items`
  - Total persentase mendekati 100% (toleransi ± 1% akibat pembulatan)

- [x] **5.6** Test `analytics/prodi-distribution`:
  ```bash
  curl -s "http://localhost:3000/api/mbkm/analytics/prodi-distribution" \
    -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  ```
  **Cek:** `data.items` berisi program studi sesuai data yang ada di periode terpilih.

- [x] **5.7** Test `analytics/status-distribution`:
  ```bash
  curl -s "http://localhost:3000/api/mbkm/analytics/status-distribution" \
    -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  ```
  **Cek:** Semua status (`Disetujui`, `Selesai`, `Diajukan`, `Ditolak`, `Dibatalkan`) muncul di `data.items`.

- [x] **5.8** Test `analytics/eligible-students`:
  ```bash
  curl -s "http://localhost:3000/api/mbkm/analytics/eligible-students" \
    -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  ```
  **Cek:** `data.eligibleCount` > 0, `data.prodiData` berisi list, sum count = eligibleCount.

- [x] **5.9** Test `analytics/mitra-distribution` (default previous periode):
  ```bash
  curl -s "http://localhost:3000/api/mbkm/analytics/mitra-distribution" \
    -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  ```
  **Cek:** `data.totalPartners` > 0, `data.mitraData` berisi top 10 mitra.

- [x] **5.10** Test `mitra-distribution` dengan `topN` dan `periode` custom:
  ```bash
  curl -s "http://localhost:3000/api/mbkm/analytics/mitra-distribution?topN=5&periode=20261" \
    -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  ```
  **Cek:** `data.mitraData` berisi maksimal 5 item, `selectedPeriode = "20261"`.

- [x] **5.11** Validasi kalkulasi matematis Card 1 secara manual:
  - Ambil `data.participantStats.count` dari `/analytics/rate`
  - Ambil `data.eligibleCount` dari `/analytics/rate`
  - Hitung manual: `count / eligibleCount * 100`
  - Bandingkan dengan `data.eligibleRate.numPercentage` → harus sama (toleransi ± 0.01%)

- [x] **5.12** Verifikasi bahwa `/api/mbkm/summary` masih mengembalikan angka yang konsisten dengan `/analytics/rate`:
  - `summary.persentaseMbkm.mbkmCount` harus sama dengan `data.participantStats.count` dari `/analytics/rate` (pada periode yang sama)

---

### 🟣 TAHAP 6 — Validasi Edge Cases & Error Handling

- [x] **6.1** Handle `eligibleCount = 0` → `percentage = 0`, `badge = "Data Tidak Tersedia"`, tidak crash.
  - Test: filter dengan angkatan yang tidak ada data eligiblenya.

- [x] **6.2** Handle `periode` yang tidak ada di database → response data kosong (bukan error 500):
  - `{ data: { participantStats: { count: 0 }, eligibleCount: 0, eligibleRate: { numPercentage: 0, meetsTarget: false, badge: "Data Tidak Tersedia" }, facultyData: [] } }`
  - Test: `?periode=99991` (periode tidak valid)

- [x] **6.3** Handle `previousPeriode` yang tidak punya data mitra → `{ totalPartners: 0, totalPlacements: 0, mitraData: [] }`.

- [x] **6.4** Handle `topN` tidak valid (< 1, NaN, > 50) → clamp ke range 1–50.
  - Test: `?topN=0`, `?topN=abc`, `?topN=999`

- [x] **6.5** Pastikan nilai `mitra = ""` atau `mitra = "-"` **tidak muncul** di `mitraData` pada hasil `/mitra-distribution`.

- [x] **6.6** Test semua endpoint dengan query param kosong → harus mengembalikan data global tanpa error.

- [x] **6.7** Test dengan filter `programStudi` yang tidak ada di periode yang dipilih → harus mengembalikan `items: []` dan `total: 0` tanpa error.

- [x] **6.8** Verifikasi bahwa jumlah persentase di `activity-distribution` dan `prodi-distribution` totalnya mendekati 100%:
  ```bash
  node -e "
  // Simulasi validasi: sum semua percentage string
  const items = [
    { percentage: '50.0%' }, { percentage: '36.8%' }, { percentage: '7.9%' },
    { percentage: '3.9%' }, { percentage: '1.3%' }
  ];
  const total = items.reduce((sum, i) => sum + parseFloat(i.percentage), 0);
  console.log('Total:', total.toFixed(1) + '%'); // Harus ~100.0%
  "
  ```

---

### ⚪ TAHAP 7 — Dokumentasi & Cleanup

- [x] **7.1** Update [`ENDPOINTS.md`](./ENDPOINTS.md) — tambahkan 6 endpoint analytics MBKM baru.

- [x] **7.2** Tandai semua item di dokumen ini yang sudah selesai dengan `[x]`.

- [x] **7.3** Konfirmasi struktur response JSON ke tim frontend untuk setiap endpoint analytics.

- [x] **7.4** Tambahkan komentar JSDoc pada setiap fungsi di file-file service baru:
  - `mbkmRate.js` → JSDoc untuk `getMbkmRate`
  - `mbkmActivities.js` → JSDoc untuk `getActivityDistribution`, `getProdiDistribution`, `getStatusDistribution`
  - `mbkmEligible.js` → JSDoc untuk `getEligibleStudents`
  - `mbkmMitra.js` → JSDoc untuk `getMitraDistribution`

- [x] **7.5** Verifikasi final: jalankan **semua** endpoint yang pernah ada (students, graduates, mbkm, sync) dan pastikan tidak ada yang broken:
  ```bash
  # Health
  curl -s http://localhost:3000/api/health | python3 -m json.tool

  # Students
  curl -s "http://localhost:3000/api/students/summary" -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  curl -s "http://localhost:3000/api/students/active-students" -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  curl -s "http://localhost:3000/api/students/international-trend" -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  curl -s "http://localhost:3000/api/students/intake-trend" -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  curl -s "http://localhost:3000/api/students/decline-trend" -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool

  # Graduates
  curl -s "http://localhost:3000/api/graduates/summary" -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  curl -s "http://localhost:3000/api/graduates/total-lulusan" -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  curl -s "http://localhost:3000/api/graduates/ipk-trend" -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  curl -s "http://localhost:3000/api/graduates/tepat-waktu" -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  curl -s "http://localhost:3000/api/graduates/keberhasilan-studi" -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool

  # MBKM (existing — harus tetap berjalan)
  curl -s "http://localhost:3000/api/mbkm/summary" -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  curl -s "http://localhost:3000/api/mbkm/list" -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool

  # MBKM (new analytics)
  curl -s "http://localhost:3000/api/mbkm/analytics/rate" -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  curl -s "http://localhost:3000/api/mbkm/analytics/activity-distribution" -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  curl -s "http://localhost:3000/api/mbkm/analytics/prodi-distribution" -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  curl -s "http://localhost:3000/api/mbkm/analytics/status-distribution" -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  curl -s "http://localhost:3000/api/mbkm/analytics/eligible-students" -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  curl -s "http://localhost:3000/api/mbkm/analytics/mitra-distribution" -H "x-api-key: komet-secret-sync-key-2026" | python3 -m json.tool
  ```

---

## 🗺️ Ringkasan Perbandingan Pola Modular (Students vs Graduates vs MBKM)

| Aspek | Students (Part 1) | Graduates (Part 2) | MBKM (Part 4 + Part 5) |
|---|---|---|---|
| **Jumlah file service** | 7 file | 7 file | **7 file** ✅ |
| **File summary terpisah** | ❌ Tidak ada | ❌ Tidak ada | ❌ Tidak ada (mbkmSummary.js dihapus) |
| **Summary endpoint** | `/summary` (logic di controller) | `/summary` (logic di controller) | `/summary` (logic di controller) |
| **List/Tabel endpoint** | `/students` | `/list` | `/list` |
| **Detail Card 1** | `activeStudents.js` → `/active-students` | `totalLulusan.js` → `/total-lulusan` | `mbkmRate.js` → `/analytics/rate` |
| **Detail Card 2** | `internationalTrend.js` → `/international-trend` | `ipkTrend.js` → `/ipk-trend` | `mbkmActivities.js` → 3 sub-endpoint |
| **Detail Card 3** | `intakeTrend.js` → `/intake-trend` | `tepatWaktu.js` → `/tepat-waktu` | `mbkmEligible.js` → `/analytics/eligible-students` |
| **Detail Card 4** | `declineTrend.js` → `/decline-trend` | `keberhasilanStudi.js` → `/keberhasilan-studi` | `mbkmMitra.js` → `/analytics/mitra-distribution` |
| **Total Endpoint** | 6 | 6 | **8** (2 lama + 6 baru) |
| **Auth** | API Key | API Key | API Key |
| **Error handling** | try/catch + logger | try/catch + logger | try/catch + logger |
| **Filter support** | Query params | Query params | Query params |

> **Catatan:** MBKM memiliki 8 total endpoint (bukan 6) karena Card 2 membutuhkan 3 sub-endpoint untuk 3 tab visualisasi berbeda, namun jumlah **service file tetap konsisten di 7 file** — persis sama dengan students dan graduates.
