# 📘 KOMET — Requirement Part 4: MBKM Data Dashboard

> Dokumen ini adalah kelanjutan dari [`requirement-part1.md`](./requirement-part1.md), [`requirement-part2.md`](./requirement-part2.md), dan [`requirement-part3.md`](./requirement-part3.md).
> Fitur yang diimplementasikan adalah **Tab MBKM Data** — dashboard statistik data aktivitas MBKM (Merdeka Belajar Kampus Merdeka) mahasiswa I3L.

---

## 🔍 Analisis Keseluruhan Project (State Saat Ini)

### Arsitektur yang Sudah Berjalan

Project **Komet Server** adalah REST API backend berbasis **Node.js + Express.js** yang terintegrasi dengan SEVIMA SiakadCloud. Arsitektur saat ini terdiri dari:

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
│   │   ├── studentsController.js  ✅ Dispatcher untuk /api/students/*
│   │   ├── graduatesController.js ✅ Dispatcher untuk /api/graduates/*
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
│   │   ├── studentsRoutes.js      ✅ GET /api/students/*
│   │   ├── graduatesRoutes.js     ✅ GET /api/graduates/*
│   │   └── syncRoutes.js          ✅ POST /api/sync/*
│   ├── services/
│   │   ├── students/              ✅ 7 service files (filterBuilder, filterOptions, activeStudents, internationalTrend, intakeTrend, declineTrend, studentList)
│   │   ├── graduates/             ✅ 7 service files (filterBuilder, filterOptions, totalLulusan, ipkTrend, tepatWaktu, keberhasilanStudi, graduateList)
│   │   └── studentDeduplicationService.js  ✅ Deduplikasi terpadu
│   ├── utils/
│   │   ├── logger.js              ✅ Custom logger
│   │   └── syncJobTracker.js      ✅ File-based job status
│   └── server.js                  ✅ Express entry point
```

### Status Tab Dashboard

| Tab | Route Prefix | Status |
|---|---|---|
| **Student Data** | `/api/students/*` | ✅ Selesai (Part 1 & Part 3) |
| **Graduate Data** | `/api/graduates/*` | ✅ Selesai (Part 2 & Part 3) |
| **MBKM Data** | `/api/mbkm/*` | 🔴 Belum Dibuat — **Target Part 4** |

### Kondisi Database Tabel `mbkm_activities` (Hasil Inspeksi)

| Field | Tipe | Contoh Data | Catatan |
|---|---|---|---|
| `id` | Int (PK, Auto) | `1`, `2`, `3`, ... | — |
| `nim` | String (FK → students) | `"21010001"` | Re-linked via deduplication |
| `periode` | String | `"20241"`, `"20231"` | Kode periode SEVIMA |
| `programStudi` | String | `"Bio Informatika"` | — |
| `fakultas` | String | `"FTIK"` | — |
| `jenjang` | String | `"S1"`, `"S2"` | — |
| `statusKeaktifan` | Text | `"Aktif"`, `"Selesai"`, `"Evaluasi"` | Status mahasiswa saat MBKM |
| `jenisAktivitas` | Text | `"Magang"`, `"Pertukaran Pelajar"` | Jenis kegiatan MBKM |
| `judulAktivitas` | Text | `"Magang di PT XYZ"` | Judul aktivitas |
| `mitra` | Text | `"PT XYZ"`, `"Universitas ABC"` | Nama perusahaan/instansi mitra |
| `statusAktivitas` | String | `"Aktif"`, `"Selesai"`, `"Evaluasi"` | Status pelaksanaan kegiatan |

### Relasi ke `students`

Via Prisma relation `MbkmActivity.student → Student`:
- `student.nama`, `student.angkatan`, `student.programStudi`, `student.fakultas`
- `student.semester`, `student.statusKeaktifan`

> **Catatan Penting:** Satu mahasiswa dapat memiliki **lebih dari satu** record `MbkmActivity` (relasi many-to-one dari student ke mbkmActivities). Ini berbeda dengan `Graduate` yang one-to-one.

---

## 🎯 Spesifikasi 4 Card Statistik MBKM

### Konsep Periode yang Digunakan

Seluruh card MBKM mengacu pada **periode yang dipilih user**. Jika tidak ada filter periode aktif, maka menggunakan **periode terbaru yang tersedia di database** (periode aktif saat ini).

---

### Card 1: % MBKM terhadap Mahasiswa Eligible

**Isi Card:** Menampilkan persentase mahasiswa yang mengikuti MBKM relatif terhadap mahasiswa yang eligible.

**Definisi:**
```
MBKM      = mahasiswa yang statusKeaktifan = "Aktif" DAN jenisAktivitas NOT NULL/NOT EMPTY
            DITAMBAH mahasiswa dengan statusKeaktifan = "Selesai" ATAU "Evaluasi"
            (difilter berdasarkan periode yang dipilih)

Eligible  = jumlah mahasiswa aktif semester 7 pada periode yang dipilih
            (students WHERE semester = 7 AND statusKeaktifan = "Aktif")

%MBKM     = (MBKM / Eligible) × 100%
```

**Formula Detail:**
```js
// Menghitung MBKM count dari mbkm_activities
const mbkmCount = await prisma.mbkmActivity.count({
    where: {
        periode: selectedPeriode,
        OR: [
            { statusKeaktifan: 'Aktif', jenisAktivitas: { not: '' } },
            { statusKeaktifan: { in: ['Selesai', 'Evaluasi'] } }
        ]
    }
});

// Menghitung Eligible dari students (semester 7 aktif)
const eligibleCount = await prisma.student.count({
    where: {
        semester: 7,
        statusKeaktifan: 'Aktif'
        // Jika filter periode tersedia, filter via mbkmActivities atau angkatan
    }
});

const persentaseMbkm = eligibleCount > 0
    ? parseFloat(((mbkmCount / eligibleCount) * 100).toFixed(2))
    : 0;
```

**Output Card:**
```
% MBKM: {persentaseMbkm}%
({mbkmCount} dari {eligibleCount} mahasiswa eligible)
```

---

### Card 2: Total Mahasiswa Mengikuti MBKM (Saat Ini)

**Isi Card:** Total mahasiswa yang **sedang aktif** mengikuti MBKM pada periode saat ini.

**Definisi:**
```
Total MBKM Aktif = COUNT(mbkm_activities)
    WHERE statusKeaktifan = "Aktif"
    AND jenisAktivitas NOT NULL/NOT EMPTY
    AND periode = periode_terpilih
```

**Formula:**
```js
const totalMbkmAktif = await prisma.mbkmActivity.count({
    where: {
        periode: selectedPeriode,
        statusKeaktifan: 'Aktif',
        jenisAktivitas: { not: '' }
    }
});
```

**Output Card:**
```
Total MBKM: {totalMbkmAktif} mahasiswa
```

---

### Card 3: Mahasiswa Eligible (Sem 7)

**Isi Card:** Jumlah mahasiswa aktif semester 7 yang berhak mengonversi 20 SKS via program MBKM.

**Definisi:**
```
Eligible = COUNT(students)
    WHERE semester = 7
    AND statusKeaktifan = "Aktif"
```

> Catatan: Filter aktif (dari filter container) juga mempengaruhi card ini — jika user memfilter berdasarkan Fakultas, Program Studi, atau Angkatan, angka ini menyesuaikan.

**Formula:**
```js
const eligibleCount = await prisma.student.count({
    where: {
        ...studentFilter,  // dari filter container user
        semester: 7,
        statusKeaktifan: 'Aktif'
    }
});
```

**Output Card:**
```
Eligible Sem 7: {eligibleCount} mahasiswa
```

---

### Card 4: Total Mitra (Semester Sebelumnya)

**Isi Card:** Total keseluruhan mitra yang pernah memberikan kesempatan magang kepada mahasiswa I3L pada **1 semester sebelum semester sekarang**. Jika semester berganti, data otomatis berganti.

**Logika Penentuan Periode Sebelumnya:**
```js
// Periode SEVIMA: "20241" = genap 2024, "20251" = genap 2025
// Format: YYYYS dimana S = 1 (ganjil) atau 2 (genap)? 
// Perlu dikonfirmasi format yang digunakan SEVIMA
// Asumsi: "20241" = semester genap 2024, "20242" = semester ganjil 2024/2025

function getPreviousPeriode(currentPeriode) {
    const year = parseInt(currentPeriode.substring(0, 4));
    const sem = parseInt(currentPeriode.substring(4));
    
    if (sem === 1) {
        // Dari ganjil ke genap tahun sebelumnya
        return `${year - 1}2`;
    } else {
        // Dari genap ke ganjil tahun yang sama
        return `${year}1`;
    }
}
```

**Formula:**
```js
const previousPeriode = getPreviousPeriode(currentPeriode);

// Ambil nilai distinct dari mitra pada semester sebelumnya
const mitraData = await prisma.mbkmActivity.findMany({
    where: {
        periode: previousPeriode,
        mitra: { not: '' }
    },
    select: { mitra: true },
    distinct: ['mitra']
});

const totalMitra = mitraData.length;
```

**Output Card:**
```
Total Mitra: {totalMitra} mitra
(Data semester: {previousPeriode})
```

---

## 🔽 Filter Container MBKM

Filter berada di bawah 4 card dan mempengaruhi **semua card** di atas dan **tabel** di bawahnya.

### Komponen Filter

| Komponen | Tipe | Parameter | Keterangan |
|---|---|---|---|
| Search | Text input | `search` | Cari berdasarkan NIM atau Nama (case-insensitive) |
| Fakultas | Checkbox multi-select | `fakultas[]` | Filter berdasarkan fakultas |
| Program Studi | Checkbox multi-select | `programStudi[]` | Filter berdasarkan program studi |
| Angkatan | Checkbox multi-select | `angkatan[]` | Filter berdasarkan angkatan mahasiswa |
| Status Aktivitas | Dropdown single-select | `statusAktivitas` | Filter: Aktif / Selesai / Evaluasi / dll. |
| Jenjang | Dropdown single-select | `jenjang` | Filter: S1 / S2 |

**Tombol Reset Filter:** Mengembalikan semua filter ke kondisi default (kosong / tidak ada filter).

### Perilaku Filter terhadap Card

Jika **salah satu filter aktif**, maka:
- Angka di semua 4 card menyesuaikan dengan filter yang aktif
- Tabel di bawahnya juga menyesuaikan

---

## 📋 Tabel MBKM (Bawah Filter)

Mendukung **pagination**. Kolom yang ditampilkan:

| No | Field | Source |
|---|---|---|
| 1 | No | Nomor urut pagination |
| 2 | NIM | `mbkmActivity.nim` |
| 3 | Nama | `student.nama` (via join) |
| 4 | Periode | `mbkmActivity.periode` |
| 5 | Angkatan | `student.angkatan` (via join) |
| 6 | Program Studi | `mbkmActivity.programStudi` |
| 7 | Fakultas | `mbkmActivity.fakultas` |
| 8 | Jenjang | `mbkmActivity.jenjang` |
| 9 | Status Keaktifan | `mbkmActivity.statusKeaktifan` |
| 10 | Jenis Aktivitas | `mbkmActivity.jenisAktivitas` |
| 11 | Mitra | `mbkmActivity.mitra` |
| 12 | Status Aktivitas | `mbkmActivity.statusAktivitas` |

---

## 🌐 API Endpoints Baru: `/api/mbkm/*`

Semua endpoint dilindungi API Key (`x-api-key` header).

### Ringkasan Endpoint

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/mbkm/summary` | 4 card statistik + filter options untuk tab MBKM |
| `GET` | `/api/mbkm/list` | Tabel MBKM dengan filter + pagination |

---

### `GET /api/mbkm/summary`

Endpoint utama yang dipanggil saat halaman pertama kali dibuka atau saat filter berubah.

**Query Parameters:**

| Parameter | Tipe | Multi? | Keterangan |
|---|---|---|---|
| `search` | string | Tidak | Cari berdasarkan NIM atau Nama |
| `fakultas` | string | Ya | Filter checkbox multi-select |
| `programStudi` | string | Ya | Filter checkbox multi-select |
| `angkatan` | string | Ya | Filter checkbox multi-select |
| `statusAktivitas` | string | Tidak | Filter dropdown single-select |
| `jenjang` | string | Tidak | Filter dropdown single-select: S1 / S2 |
| `periode` | string | Tidak | Periode yang dipilih (misal: `"20241"`) — default: periode terbaru |

**Response:**
```json
{
  "success": true,
  "selectedPeriode": "20241",
  "previousPeriode": "20231",
  "summary": {
    "persentaseMbkm": {
      "mbkmCount": 45,
      "eligibleCount": 120,
      "percentage": 37.5
    },
    "totalMbkmAktif": 45,
    "totalEligible": 120,
    "totalMitra": 18
  },
  "filterOptions": {
    "periode": ["20241", "20231", "20221"],
    "fakultas": ["FTIK", "FEB", "FH", "FIKES"],
    "programStudi": ["Bio Informatika", "Manajemen", "Hukum"],
    "angkatan": ["2024 Ganjil", "2023 Ganjil", "2022 Ganjil"],
    "statusAktivitas": ["Aktif", "Selesai", "Evaluasi"],
    "jenjang": ["S1", "S2"]
  }
}
```

---

### `GET /api/mbkm/list`

Tabel MBKM dengan filter lengkap dan pagination.

**Query Parameters:** Sama dengan `/summary`, ditambah:

| Parameter | Default | Keterangan |
|---|---|---|
| `page` | `1` | Nomor halaman |
| `limit` | `20` | Jumlah data per halaman (max 100) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "no": 1,
      "nim": "21010001",
      "nama": "Budi Santoso",
      "periode": "20241",
      "angkatan": "2021 Ganjil",
      "programStudi": "Bio Informatika",
      "fakultas": "FIKES",
      "jenjang": "S1",
      "statusKeaktifan": "Aktif",
      "jenisAktivitas": "Magang",
      "mitra": "PT Gojek Indonesia",
      "statusAktivitas": "Aktif"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

## 🗂️ Arsitektur File Baru yang Akan Dibuat

```
src/
├── controllers/
│   └── mbkmController.js          ← BARU: dispatcher untuk /api/mbkm/*
│
├── services/
│   └── mbkm/                      ← BARU: service layer kalkulasi MBKM
│       ├── filterBuilder.js       # Build Prisma where clause dari query params
│       ├── filterOptions.js       # Ambil opsi filter dari DB (distinct values)
│       ├── mbkmSummary.js         # Kalkulasi 4 card: %MBKM, total aktif, eligible, mitra
│       └── mbkmList.js            # Query tabel MBKM + pagination
│
├── routes/
│   └── mbkmRoutes.js              ← BARU: routing untuk /api/mbkm/*
│
└── server.js                      ← UPDATE: daftarkan mbkmRoutes
```

---

## 🔧 Perubahan pada File yang Sudah Ada

| File | Perubahan |
|---|---|
| `src/server.js` | Daftarkan `mbkmRoutes` dengan `app.use('/api/mbkm', mbkmRoutes)` |

---

## 📌 Catatan Teknis Penting

### 1. Hubungan statusKeaktifan di mbkm_activities vs students

Field `statusKeaktifan` di tabel `mbkm_activities` **berbeda** dengan `statusKeaktifan` di tabel `students`. Di MBKM:
- `statusKeaktifan` (mbkm) = status mahasiswa dalam konteks kegiatan MBKM
- `statusAktivitas` (mbkm) = status pelaksanaan kegiatan MBKM itu sendiri

Ketika menghitung Card 1 (% MBKM):
```
MBKM = (statusKeaktifan = "Aktif" AND jenisAktivitas != "") OR (statusKeaktifan IN ["Selesai", "Evaluasi"])
```

### 2. Penentuan Periode Default

Jika user tidak memilih periode, ambil periode terbaru yang tersedia dari database:
```js
const latestPeriode = await prisma.mbkmActivity.findFirst({
    orderBy: { periode: 'desc' },
    select: { periode: true }
});
const defaultPeriode = latestPeriode?.periode || '';
```

### 3. Format Periode SEVIMA

Format periode di SEVIMA: `"YYYYS"` dimana:
- `YYYY` = tahun akademik
- `S` = semester (`1` = ganjil, `2` = genap)

Contoh: `"20241"` = semester ganjil 2024/2025, `"20242"` = semester genap 2024/2025

### 4. Kalkulasi Periode Sebelumnya untuk Card 4

```js
function getPreviousPeriode(currentPeriode) {
    if (!currentPeriode || currentPeriode.length < 5) return null;
    const year = parseInt(currentPeriode.substring(0, 4));
    const sem = parseInt(currentPeriode.substring(4));
    return sem === 1 ? `${year - 1}2` : `${year}1`;
}
```

### 5. Filter Container Mempengaruhi Card

Jika filter aktif:
- **Card 1:** `mbkmCount` difilter berdasarkan `statusAktivitas`, `fakultas`, `programStudi`, `angkatan`, `jenjang`. `eligibleCount` difilter berdasarkan `fakultas`, `programStudi`, `angkatan`, `jenjang` ke tabel `students`.
- **Card 2:** difilter berdasarkan semua filter yang aktif
- **Card 3:** difilter berdasarkan `fakultas`, `programStudi`, `angkatan`, `jenjang` dari tabel `students`
- **Card 4:** **TIDAK DIPENGARUHI** oleh filter container — selalu menampilkan total mitra semester sebelumnya secara keseluruhan

---

## ✅ TODOLIST IMPLEMENTASI — Tab MBKM Data

> Dikerjakan secara berurutan dari atas ke bawah. Setiap item sudah dikelompokkan per tahap.

---

### 🔵 TAHAP 1 — Persiapan & Pemahaman Data

- [x] **1.1** Baca dan pahami dokumen ini beserta seluruh requirement sebelumnya (Part 1, 2, 3)

- [x] **1.2** Inspeksi data `mbkm_activities` di database untuk memahami nilai-nilai yang ada:
  ```bash
  node -e "
  const p = require('./src/config/prisma');
  Promise.all([
    p.mbkmActivity.findMany({ take: 5, select: { nim: true, periode: true, statusKeaktifan: true, jenisAktivitas: true, statusAktivitas: true, mitra: true } }),
    p.mbkmActivity.groupBy({ by: ['statusKeaktifan'], _count: true }),
    p.mbkmActivity.groupBy({ by: ['statusAktivitas'], _count: true }),
    p.mbkmActivity.groupBy({ by: ['periode'], _count: true, orderBy: { periode: 'desc' } })
  ]).then(r => console.log(JSON.stringify(r, null, 2))).finally(() => p.\$disconnect());
  "
  ```

- [x] **1.3** Konfirmasi format periode SEVIMA (apakah `"20241"` = ganjil atau genap) dengan memeriksa data dan dokumentasi SEVIMA.

- [x] **1.4** Konfirmasi nilai-nilai yang mungkin pada field `statusKeaktifan` dan `statusAktivitas` di `mbkm_activities`:
  ```bash
  node -e "
  const p = require('./src/config/prisma');
  Promise.all([
    p.mbkmActivity.findMany({ select: { statusKeaktifan: true }, distinct: ['statusKeaktifan'] }),
    p.mbkmActivity.findMany({ select: { statusAktivitas: true }, distinct: ['statusAktivitas'] }),
    p.mbkmActivity.findMany({ select: { jenisAktivitas: true }, distinct: ['jenisAktivitas'] })
  ]).then(r => console.log(JSON.stringify(r, null, 2))).finally(() => p.\$disconnect());
  "
  ```

- [x] **1.5** Verifikasi relasi join antara `mbkm_activities` dan `students` sudah valid (tidak ada orphan records):
  ```bash
  node -e "
  const p = require('./src/config/prisma');
  p.mbkmActivity.count({ where: { student: { is: null } } })
    .then(n => console.log('Orphan MBKM records:', n))
    .finally(() => p.\$disconnect());
  "
  ```

---

### 🟡 TAHAP 2 — Buat Service Layer MBKM

Buat folder baru: `src/services/mbkm/`

- [x] **2.1** Buat `src/services/mbkm/filterBuilder.js`

  Build Prisma `where` clause dari query params untuk tabel `mbkm_activities`.

  ```js
  // src/services/mbkm/filterBuilder.js
  /**
   * Mem-build Prisma where clause untuk query mbkm_activities
   * berdasarkan query parameters dari request.
   */
  function buildMbkmFilter(query) {
      const { search, fakultas, programStudi, angkatan, statusAktivitas, jenjang, periode } = query;

      const where = {};

      // Filter langsung di tabel mbkm_activities
      if (periode) where.periode = periode;

      if (statusAktivitas) where.statusAktivitas = statusAktivitas;

      if (jenjang) where.jenjang = jenjang;

      if (fakultas) {
          const list = Array.isArray(fakultas) ? fakultas : [fakultas];
          if (list.length > 0) where.fakultas = { in: list };
      }

      if (programStudi) {
          const list = Array.isArray(programStudi) ? programStudi : [programStudi];
          if (list.length > 0) where.programStudi = { in: list };
      }

      // Filter via relasi ke student
      const studentFilter = {};

      if (angkatan) {
          const list = Array.isArray(angkatan) ? angkatan : [angkatan];
          if (list.length > 0) studentFilter.angkatan = { in: list };
      }

      if (search && search.trim()) {
          studentFilter.OR = [
              { nim: { contains: search.trim() } },
              { nama: { contains: search.trim() } }
          ];
      }

      if (Object.keys(studentFilter).length > 0) {
          where.student = studentFilter;
      }

      return where;
  }

  function getPaginationParams(query) {
      const page = Math.max(1, parseInt(query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
      return { page, limit };
  }

  // Helper untuk mendapatkan periode terbaru dari database
  async function getDefaultPeriode(prisma) {
      const latest = await prisma.mbkmActivity.findFirst({
          orderBy: { periode: 'desc' },
          select: { periode: true }
      });
      return latest?.periode || null;
  }

  // Helper untuk menghitung periode sebelumnya
  function getPreviousPeriode(currentPeriode) {
      if (!currentPeriode || currentPeriode.length < 5) return null;
      const year = parseInt(currentPeriode.substring(0, 4));
      const sem = parseInt(currentPeriode.substring(4));
      return sem === 1 ? `${year - 1}2` : `${year}1`;
  }

  module.exports = { buildMbkmFilter, getPaginationParams, getDefaultPeriode, getPreviousPeriode };
  ```

- [x] **2.2** Buat `src/services/mbkm/filterOptions.js`

  Ambil semua opsi distinct untuk dropdown dan checkbox filter.

  ```js
  // src/services/mbkm/filterOptions.js
  const prisma = require('../../config/prisma');

  async function getMbkmFilterOptions() {
      const [periodeRes, fakultasRes, prodiRes, angkatanRes, statusAktivitasRes, jenjangRes] = await Promise.all([
          prisma.mbkmActivity.findMany({
              select: { periode: true },
              distinct: ['periode'],
              orderBy: { periode: 'desc' }
          }),
          prisma.mbkmActivity.findMany({
              select: { fakultas: true },
              distinct: ['fakultas']
          }),
          prisma.mbkmActivity.findMany({
              select: { programStudi: true },
              distinct: ['programStudi']
          }),
          // Ambil angkatan dari relasi student
          prisma.student.findMany({
              where: { mbkmActivities: { some: {} } },
              select: { angkatan: true },
              distinct: ['angkatan'],
              orderBy: { angkatan: 'desc' }
          }),
          prisma.mbkmActivity.findMany({
              select: { statusAktivitas: true },
              distinct: ['statusAktivitas']
          }),
          prisma.mbkmActivity.findMany({
              select: { jenjang: true },
              distinct: ['jenjang']
          })
      ]);

      return {
          periode: periodeRes.map(r => r.periode).filter(Boolean),
          fakultas: fakultasRes.map(r => r.fakultas).filter(Boolean).sort(),
          programStudi: prodiRes.map(r => r.programStudi).filter(Boolean).sort(),
          angkatan: angkatanRes.map(r => r.angkatan).filter(Boolean),
          statusAktivitas: statusAktivitasRes.map(r => r.statusAktivitas).filter(Boolean).sort(),
          jenjang: jenjangRes.map(r => r.jenjang).filter(v => v === 'S1' || v === 'S2').sort()
      };
  }

  module.exports = { getMbkmFilterOptions };
  ```

- [x] **2.3** Buat `src/services/mbkm/mbkmSummary.js`

  Kalkulasi semua 4 card statistik MBKM.

  ```js
  // src/services/mbkm/mbkmSummary.js
  const prisma = require('../../config/prisma');

  /**
   * Card 1: % MBKM terhadap Mahasiswa Eligible
   * MBKM = (statusKeaktifan='Aktif' AND jenisAktivitas != '') OR statusKeaktifan IN ['Selesai','Evaluasi']
   * Eligible = students WHERE semester=7 AND statusKeaktifan='Aktif'
   */
  async function getPersentaseMbkm(whereFilter, selectedPeriode, studentFilter) {
      const mbkmWhere = {
          ...whereFilter,
          periode: selectedPeriode,
          OR: [
              { statusKeaktifan: 'Aktif', jenisAktivitas: { not: '' } },
              { statusKeaktifan: { in: ['Selesai', 'Evaluasi'] } }
          ]
      };

      const eligibleWhere = {
          ...studentFilter,
          semester: 7,
          statusKeaktifan: 'Aktif'
      };

      const [mbkmCount, eligibleCount] = await Promise.all([
          prisma.mbkmActivity.count({ where: mbkmWhere }),
          prisma.student.count({ where: eligibleWhere })
      ]);

      const percentage = eligibleCount > 0
          ? parseFloat(((mbkmCount / eligibleCount) * 100).toFixed(2))
          : 0;

      return { mbkmCount, eligibleCount, percentage };
  }

  /**
   * Card 2: Total Mahasiswa yang Sedang Mengikuti MBKM (Aktif)
   */
  async function getTotalMbkmAktif(whereFilter, selectedPeriode) {
      return prisma.mbkmActivity.count({
          where: {
              ...whereFilter,
              periode: selectedPeriode,
              statusKeaktifan: 'Aktif',
              jenisAktivitas: { not: '' }
          }
      });
  }

  /**
   * Card 3: Total Mahasiswa Eligible (Sem 7 Aktif)
   */
  async function getTotalEligible(studentFilter) {
      return prisma.student.count({
          where: {
              ...studentFilter,
              semester: 7,
              statusKeaktifan: 'Aktif'
          }
      });
  }

  /**
   * Card 4: Total Mitra Semester Sebelumnya (distinct mitra)
   */
  async function getTotalMitra(previousPeriode) {
      if (!previousPeriode) return 0;

      const mitraData = await prisma.mbkmActivity.findMany({
          where: {
              periode: previousPeriode,
              mitra: { not: '' }
          },
          select: { mitra: true },
          distinct: ['mitra']
      });

      return mitraData.length;
  }

  module.exports = { getPersentaseMbkm, getTotalMbkmAktif, getTotalEligible, getTotalMitra };
  ```

- [x] **2.4** Buat `src/services/mbkm/mbkmList.js`

  Query tabel MBKM dengan filter + pagination, menggabungkan data dari `mbkm_activities` dan join ke `students`.

  ```js
  // src/services/mbkm/mbkmList.js
  const prisma = require('../../config/prisma');

  async function getMbkmList(whereFilter, page = 1, limit = 20) {
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
          prisma.mbkmActivity.findMany({
              where: whereFilter,
              select: {
                  nim: true,
                  periode: true,
                  programStudi: true,
                  fakultas: true,
                  jenjang: true,
                  statusKeaktifan: true,
                  jenisAktivitas: true,
                  judulAktivitas: true,
                  mitra: true,
                  statusAktivitas: true,
                  student: {
                      select: {
                          nama: true,
                          angkatan: true
                      }
                  }
              },
              skip,
              take: limit,
              orderBy: [{ periode: 'desc' }, { student: { nama: 'asc' } }]
          }),
          prisma.mbkmActivity.count({ where: whereFilter })
      ]);

      const flatData = data.map((item, index) => ({
          no: skip + index + 1,
          nim: item.nim,
          nama: item.student?.nama || '',
          periode: item.periode,
          angkatan: item.student?.angkatan || '',
          programStudi: item.programStudi,
          fakultas: item.fakultas,
          jenjang: item.jenjang,
          statusKeaktifan: item.statusKeaktifan,
          jenisAktivitas: item.jenisAktivitas,
          mitra: item.mitra,
          statusAktivitas: item.statusAktivitas
      }));

      return {
          data: flatData,
          pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit)
          }
      };
  }

  module.exports = { getMbkmList };
  ```

---

### 🟠 TAHAP 3 — Buat Controller MBKM

- [x] **3.1** Buat `src/controllers/mbkmController.js`

---

### 🟢 TAHAP 4 — Buat Routes & Daftarkan ke Server

- [x] **4.1** Buat `src/routes/mbkmRoutes.js`

- [x] **4.2** Update `src/server.js` — daftarkan `mbkmRoutes`

---

### 🔴 TAHAP 5 — Testing Manual

- [x] **5.1** Jalankan server: `npm run dev`

- [x] **5.2** Test endpoint `/summary` tanpa filter (gunakan periode default)

- [x] **5.3** Test dengan filter `periode` tertentu

- [x] **5.4** Test dengan filter `fakultas` (multi-select checkbox)

- [x] **5.5** Test dengan filter `angkatan` (multi-select checkbox)

- [x] **5.6** Test dengan filter `statusAktivitas` (dropdown single)

- [x] **5.7** Test endpoint tabel `/list` dengan pagination

- [x] **5.8** Test tabel dengan kombinasi filter lengkap

- [x] **5.9** Test dengan filter `search` (cari berdasarkan NIM atau Nama)

- [x] **5.10** Verifikasi Card 4 (total mitra) menggunakan data dari periode **sebelumnya**

- [x] **5.11** Verifikasi Card 1 (% MBKM) dengan kalkulasi manual

---

### 🟣 TAHAP 6 — Validasi & Edge Cases

- [x] **6.1** Handle kasus `eligibleCount = 0` → kembalikan `percentage = 0` (bukan NaN/Infinity)

- [x] **6.2** Handle kasus `periode` tidak ada di database → kembalikan error yang informatif

- [x] **6.3** Handle kasus `previousPeriode` tidak ada data di database → kembalikan `totalMitra = 0`

- [x] **6.4** Handle kasus `jenisAktivitas` kosong (string `""`) saat menghitung Card 1 & Card 2

- [x] **6.5** Pastikan `filterOptions` tidak mengandung nilai kosong/null di semua field

- [x] **6.6** Test edge case filter yang saling bertentangan → mengembalikan `total = 0` tanpa error

- [x] **6.7** Pastikan field `no` (nomor urut) pada tabel mengikuti pagination dengan benar

---

### ⚪ TAHAP 7 — Dokumentasi & Cleanup

- [x] **7.1** Update `requirement-part4.md` ini — tandai semua item yang sudah selesai dengan `[x]`

- [x] **7.2** Konfirmasi ke tim frontend struktur response JSON final untuk endpoint `/api/mbkm/*`

- [x] **7.3** Verifikasi total endpoints di `ENDPOINTS.md` sudah terupdate (tambahkan 2 endpoint MBKM baru)

- [x] **7.4** Tambahkan komentar di setiap file service baru yang menjelaskan fungsinya secara singkat

---

## 🗺️ Ringkasan File yang Akan Dibuat / Diubah

| File | Status | Keterangan |
|---|---|---|
| `src/services/mbkm/filterBuilder.js` | 🆕 Baru | Builder Prisma where clause dari query params MBKM |
| `src/services/mbkm/filterOptions.js` | 🆕 Baru | Ambil opsi filter distinct dari DB |
| `src/services/mbkm/mbkmSummary.js` | 🆕 Baru | Kalkulasi 4 card: %MBKM, total aktif, eligible, mitra |
| `src/services/mbkm/mbkmList.js` | 🆕 Baru | Query tabel MBKM + pagination |
| `src/controllers/mbkmController.js` | 🆕 Baru | Dispatcher endpoint `/api/mbkm/*` |
| `src/routes/mbkmRoutes.js` | 🆕 Baru | Routing `GET /api/mbkm/*` |
| `src/server.js` | 🔄 Update | Daftarkan `mbkmRoutes` |

> File lain tidak perlu diubah.

---

## 🔗 Konsistensi Pola dengan Tab Sebelumnya

Implementasi Tab MBKM mengikuti **pola yang sama** dengan Tab Students dan Tab Graduates:

| Aspek | Students | Graduates | MBKM |
|---|---|---|---|
| Service Layer | `src/services/students/` | `src/services/graduates/` | `src/services/mbkm/` |
| Controller | `studentsController.js` | `graduatesController.js` | `mbkmController.js` |
| Routes | `studentsRoutes.js` | `graduatesRoutes.js` | `mbkmRoutes.js` |
| Auth | API Key | API Key | API Key |
| Filter Builder | ✅ | ✅ | ✅ |
| Filter Options | ✅ | ✅ | ✅ |
| Pagination | ✅ | ✅ | ✅ |
| Error Handling | try/catch + logger | try/catch + logger | try/catch + logger |
