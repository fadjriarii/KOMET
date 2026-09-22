# 📘 KOMET — Requirement Part 2: Graduate Dashboard

> Dokumen ini adalah kelanjutan dari [`requirement-part1.md`](./requirement-part1.md).
> Fitur baru yang diimplementasikan adalah **Tab Lulusan** — dashboard statistik data kelulusan mahasiswa,
> yang berbeda sepenuhnya dari Tab Mahasiswa Aktif yang sudah ada.

---

## 🔍 Analisis Struktur & Data yang Sudah Ada

### Kondisi Database Saat Ini (Hasil Inspeksi)

**Tabel `graduates`** sudah tersedia dengan field:
| Field | Tipe | Isi Contoh |
|---|---|---|
| `id` | Int (PK) | Auto-increment |
| `nim` | String (FK → `students.nim`) | `"21010001"` |
| `jenjang` | String | `"S1"`, `"S2"`, `"Prof"` |
| `statusKelulusan` | String | `"Lulus"`, `"Memuaskan"`, `"Sangat Memuaskan"`, `"Cum Laude"` |
| `tahunLulus` | String | `"2021"`, `"2022"`, `"2023"`, `"2024"`, `"2025"` |
| `ipk` | Float | `3.58` |
| `sksLulus` | Int | `144` |

**Relasi ke `students`** (JOIN tersedia via Prisma):
- `student.nama`, `student.programStudi`, `student.fakultas`
- `student.periodeMasuk` — digunakan untuk menghitung **tahun masuk** (4 digit pertama)
- `student.angkatan` — label angkatan (misal `"2021 Ganjil"`)

### Data yang Ada di Database (Tahun Lulus)
```
Tahun Lulus tersedia: 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025
```

### Jenjang yang Ada
```
S1, S2, Prof
```

### Predikat Kelulusan (`statusKelulusan`) yang Ada
```
"Lulus", "Memuaskan", "Sangat Memuaskan", "Cum Laude", "Aktif"
```

### Penting: Field yang Belum Ada (Perlu Ditambah ke Schema & Sync)
- **`periodeWisuda`** (atau `semesterLulus`): Semester ketika wisuda berlangsung.
  - SEVIMA API mengembalikan `id_periode_akademik` pada endpoint `/kelulusan`.
  - Field ini sudah diambil saat sync (`attr.id_periode_akademik`) tetapi **tidak disimpan** ke database `graduates`.
  - **Solusi**: Tambahkan field `periodeWisuda String` ke model `Graduate` di Prisma, lalu simpan `attr.id_periode_akademik` saat sync.
  - Field ini dibutuhkan sebagai **filter "Semester Kelulusan"** di frontend.

---

## 📐 Definisi Rentang Waktu 5 Tahun

Seluruh statistik pada tab lulusan menggunakan acuan **"5 tahun ke belakang dari tahun lalu"**.

**Aturan:**
```
Tahun Referensi = new Date().getFullYear() - 1
Rentang 5 Tahun = [Tahun Referensi - 4, ..., Tahun Referensi]
```

**Contoh (Tahun Sekarang = 2026):**
```
Tahun Referensi = 2025
Rentang = [2021, 2022, 2023, 2024, 2025]
```

**Contoh (Tahun Sekarang = 2027):**
```
Tahun Referensi = 2026
Rentang = [2022, 2023, 2024, 2025, 2026]
```

> Rentang ini **otomatis bergeser** setiap pergantian tahun tanpa perlu konfigurasi manual.

---

## 🎯 Spesifikasi 4 Card Statistik Lulusan

---

### Card 1: Total Lulusan (5 Tahun Terakhir)

**Isi Card:**
```
S1: {total lulusan S1}    S2: {total lulusan S2}
```

**Logika:**
```
totalS1 = COUNT(graduates WHERE jenjang = 'S1' AND tahunLulus IN rentang5Tahun)
totalS2 = COUNT(graduates WHERE jenjang = 'S2' AND tahunLulus IN rentang5Tahun)
```

**Ketika Card Diklik (Detail Chart):**
- Muncul popup/detail view dengan **2 tab**: `S1` dan `S2`
- Masing-masing tab menampilkan **bar chart** jumlah lulusan per tahun
- Data chart: `[{ tahun: "2021", count: 7 }, { tahun: "2022", count: 7 }, ...]`

---

### Card 2: Rata-rata IPK Lulusan

**Isi Card:**
```
S1: {rata-rata IPK S1}    S2: {rata-rata IPK S2}
```

**Logika:**
```
avgIpkS1 = AVG(graduates.ipk WHERE jenjang = 'S1' AND tahunLulus IN rentang5Tahun)
avgIpkS2 = AVG(graduates.ipk WHERE jenjang = 'S2' AND tahunLulus IN rentang5Tahun)
```

**Ketika Card Diklik (Detail Chart) — 3 Tab:**

1. **Tab "Per Program Studi"**
   - Menampilkan rata-rata IPK per program studi dalam rentang 5 tahun
   - Data: `[{ programStudi: "Informatika", avgIpk: 3.72, count: 45 }, ...]`

2. **Tab "Sarjana (S1)"**
   - Rata-rata IPK S1 per tahun dalam rentang 5 tahun
   - Data: `[{ tahun: "2021", avgIpk: 3.42 }, { tahun: "2022", avgIpk: 3.31 }, ...]`

3. **Tab "Magister (S2)"**
   - Rata-rata IPK S2 per tahun dalam rentang 5 tahun
   - Data: `[{ tahun: "2021", avgIpk: null }, ..., { tahun: "2025", avgIpk: 3.67 }, ...]`

---

### Card 3: Persentase Lulusan Tepat Waktu

**Definisi "Tepat Waktu":**
- **S1:** Tahun Lulus − Tahun Masuk (4 digit `periodeMasuk`) ≤ **4 tahun**
- **S2:** Tahun Lulus − Tahun Masuk ≤ **2 tahun**

**Formula:**
```
A = Jumlah lulusan yang (tahunLulus - tahunMasuk) ≤ batasNormal (S1=4, S2=2)
B = Total seluruh lulusan pada angkatan yang diperhitungkan

% Tepat Waktu = (A / B) × 100%
```

**Acuan Angkatan untuk Card:**
- Ambil data tahun **tahun referensi** (tahun lalu) sebagai angka yang ditampilkan di card
- Contoh (tahun 2026): tampilkan persentase tepat waktu dari seluruh lulusan tahun 2025

**Isi Card:**
```
S1: {persentase%}    S2: {persentase%}
```

**Ketika Card Diklik (Detail Chart):**
- Chart menampilkan tren persentase tepat waktu per tahun (dalam rentang 5 tahun)
- Data: `[{ tahun: "2021", s1Percentage: 85.7, s2Percentage: null }, ...]`

> **Catatan Implementasi:** "Tepat waktu atau lebih cepat" — lulusan yang selesai kurang dari batas normal juga dihitung sebagai tepat waktu.

---

### Card 4: Persentase Keberhasilan Studi

**Definisi:**
Keberhasilan studi diukur dari angkatan yang sudah melewati **batas maksimal studi**:
- **S1:** batas studi = 7 tahun sejak masuk
- **S2:** batas studi = 4 tahun sejak masuk

**Cara Menentukan Angkatan yang Dihitung:**
```
Angkatan yang dievaluasi = Tahun Referensi (tahun lalu) - Batas Studi
Contoh (Tahun Referensi = 2025):
  - Angkatan S1 yang dievaluasi: tahun masuk 2025 - 7 = 2018 (periodeMasuk startsWith '2018')
  - Angkatan S2 yang dievaluasi: tahun masuk 2025 - 4 = 2021 (periodeMasuk startsWith '2021')
```

**Formula:**
```
A = COUNT(students WHERE periodeMasuk startsWith '{tahunAngkatan}' AND statusKeaktifan = 'Lulus')
B = COUNT(students WHERE periodeMasuk startsWith '{tahunAngkatan}') — total seluruh angkatan tersebut

% Keberhasilan = (A / B) × 100%
```

**Isi Card:**
```
S1: {persentase%}    S2: {persentase%}
```

**Ketika Card Diklik (Detail Chart) — 2 Tab:**
1. **Tab "S1"** — Chart keberhasilan studi S1 per angkatan (5 angkatan ke belakang dari angkatan yang dievaluasi)
2. **Tab "S2"** — Chart keberhasilan studi S2 per angkatan

---

## 🔽 Filter Container (Bawah Card)

Filter ini **mempengaruhi semua 4 card di atasnya** dan tabel di bawahnya.
Ketika salah satu filter aktif → card **tidak dapat diklik** untuk popup detail.

### Filter yang Tersedia:

| Komponen | Tipe | Parameter | Keterangan |
|---|---|---|---|
| Search | Text input | `search` | Cari berdasarkan Nama atau NIM (case-insensitive) |
| Program Studi | Checkbox multi-select | `programStudi[]` | Filter berdasarkan prodi (join ke student) |
| Tahun Lulus | Checkbox multi-select | `tahunLulus[]` | Filter tahun kelulusan (dari tabel graduates) |
| Semester Kelulusan | Checkbox multi-select | `periodeWisuda[]` | Filter berdasarkan periode wisuda (contoh: `"20251"`) |
| Predikat | Checkbox multi-select | `statusKelulusan[]` | Filter predikat: Memuaskan, Sangat Memuaskan, Cum Laude |
| Fakultas | Dropdown single-select | `fakultas` | Filter berdasarkan fakultas |
| Periode Masuk | Dropdown single-select | `periodeMasuk` | Filter periode masuk mahasiswa |
| Jenjang | Dropdown single-select | `jenjang` | Filter S1 / S2 |

---

## 📋 Tabel Lulusan (Bawah Filter)

Mendukung **pagination**.

| Kolom | Source Field |
|---|---|
| No | Nomor urut pagination |
| Nama | `student.nama` |
| NIM | `graduate.nim` |
| Jenjang | `graduate.jenjang` |
| Program Studi | `student.programStudi` |
| Fakultas | `student.fakultas` |
| Tahun Lulus | `graduate.tahunLulus` |
| IPK | `graduate.ipk` |
| Predikat | `graduate.statusKelulusan` |
| Status | `student.statusKeaktifan` |

---

## 🗄️ Perubahan Schema Database

### Tambahan Field `periodeWisuda` pada Model `Graduate`

```prisma
model Graduate {
  id              Int     @id @default(autoincrement())
  nim             String  @unique
  jenjang         String
  statusKelulusan String
  tahunLulus      String
  periodeWisuda   String  @default("")   // ← BARU: kode periode wisuda, misal "20251"
  ipk             Float
  sksLulus        Int
  student         Student @relation(fields: [nim], references: [nim], onDelete: Cascade)

  @@map("graduates")
}
```

**Sumber data:** `attr.id_periode_akademik` dari SEVIMA API endpoint `/kelulusan` — field ini sudah diambil di `syncGraduates.js` tapi belum disimpan.

**Migrasi:** Jalankan `npx prisma migrate dev --name add_periode_wisuda_to_graduates`

---

## 🌐 API Endpoints Baru

Semua endpoint baru berada di bawah prefix `/api/graduates/*` dan dilindungi API Key.

### Ringkasan Endpoint

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/graduates/summary` | 4 card + filter options untuk tab lulusan |
| `GET` | `/api/graduates/total-lulusan` | Detail chart Card 1: total lulusan per tahun |
| `GET` | `/api/graduates/ipk-trend` | Detail chart Card 2: IPK per tahun & per prodi |
| `GET` | `/api/graduates/tepat-waktu` | Detail chart Card 3: % tepat waktu per tahun |
| `GET` | `/api/graduates/keberhasilan-studi` | Detail chart Card 4: % keberhasilan studi per angkatan |
| `GET` | `/api/graduates/list` | Tabel lulusan dengan filter + pagination |

---

### `GET /api/graduates/summary`

Endpoint utama yang dipanggil saat halaman pertama dibuka atau filter berubah.

**Query Parameters:**
| Parameter | Tipe | Multi? | Keterangan |
|---|---|---|---|
| `search` | string | Tidak | Cari berdasarkan nama atau NIM |
| `programStudi` | string | Ya | Filter prodi (multi-select) |
| `tahunLulus` | string | Ya | Filter tahun lulus (multi-select) |
| `periodeWisuda` | string | Ya | Filter kode periode wisuda (multi-select) |
| `statusKelulusan` | string | Ya | Filter predikat kelulusan (multi-select) |
| `fakultas` | string | Tidak | Filter fakultas (single-select) |
| `periodeMasuk` | string | Tidak | Filter periode masuk (single-select) |
| `jenjang` | string | Tidak | Filter jenjang: S1 / S2 (single-select) |

**Response:**
```json
{
  "success": true,
  "referenceYear": 2025,
  "yearRange": [2021, 2022, 2023, 2024, 2025],
  "summary": {
    "totalLulusan": {
      "s1": 92,
      "s2": 9
    },
    "avgIpk": {
      "s1": 3.55,
      "s2": 3.67
    },
    "tepatWaktu": {
      "s1": 94.57,
      "s2": 100.0,
      "referenceYear": 2025
    },
    "keberhasilanStudi": {
      "s1": 77.78,
      "s2": null,
      "angkatanS1": "2018",
      "angkatanS2": "2021"
    }
  },
  "filterOptions": {
    "programStudi": ["Bio Informatika", "Bio Medis dan Rekayasa Hayati", ...],
    "tahunLulus": ["2021", "2022", "2023", "2024", "2025"],
    "periodeWisuda": ["20211", "20221", "20231", "20241", "20251"],
    "statusKelulusan": ["Lulus", "Memuaskan", "Sangat Memuaskan", "Cum Laude"],
    "fakultas": ["Bisnis dan Manajemen", "Ilmu Kesehatan dan Biosains", ...],
    "periodeMasuk": ["20141", "20151", "20161", ...],
    "jenjang": ["S1", "S2"]
  }
}
```

---

### `GET /api/graduates/total-lulusan`

Detail chart untuk Card 1 (Total Lulusan).

**Response:**
```json
{
  "success": true,
  "data": {
    "s1": [
      { "tahun": "2021", "count": 7 },
      { "tahun": "2022", "count": 7 },
      { "tahun": "2023", "count": 7 },
      { "tahun": "2024", "count": 65 },
      { "tahun": "2025", "count": 6 }
    ],
    "s2": [
      { "tahun": "2021", "count": 0 },
      { "tahun": "2022", "count": 0 },
      { "tahun": "2023", "count": 0 },
      { "tahun": "2024", "count": 0 },
      { "tahun": "2025", "count": 9 }
    ]
  }
}
```

---

### `GET /api/graduates/ipk-trend`

Detail chart untuk Card 2 (Rata-rata IPK).

**Response:**
```json
{
  "success": true,
  "data": {
    "byProgramStudi": [
      { "programStudi": "Bio Informatika", "avgIpk": 3.58, "count": 12 },
      { "programStudi": "Bio Medis dan Rekayasa Hayati", "avgIpk": 3.42, "count": 8 }
    ],
    "byYearS1": [
      { "tahun": "2021", "avgIpk": 3.42, "count": 7 },
      { "tahun": "2022", "avgIpk": 3.31, "count": 7 },
      { "tahun": "2023", "avgIpk": 3.53, "count": 7 },
      { "tahun": "2024", "avgIpk": 3.62, "count": 65 },
      { "tahun": "2025", "avgIpk": 3.11, "count": 6 }
    ],
    "byYearS2": [
      { "tahun": "2021", "avgIpk": null, "count": 0 },
      { "tahun": "2025", "avgIpk": 3.67, "count": 9 }
    ]
  }
}
```

---

### `GET /api/graduates/tepat-waktu`

Detail chart untuk Card 3 (Lulusan Tepat Waktu).

**Response:**
```json
{
  "success": true,
  "data": {
    "s1": [
      { "tahun": "2021", "tepatWaktu": 7, "total": 7, "percentage": 100.0 },
      { "tahun": "2022", "tepatWaktu": 7, "total": 7, "percentage": 100.0 },
      { "tahun": "2023", "tepatWaktu": 6, "total": 7, "percentage": 85.71 },
      { "tahun": "2024", "tepatWaktu": 62, "total": 65, "percentage": 95.38 },
      { "tahun": "2025", "tepatWaktu": 5, "total": 6, "percentage": 83.33 }
    ],
    "s2": [
      { "tahun": "2025", "tepatWaktu": 9, "total": 9, "percentage": 100.0 }
    ],
    "batasS1": 4,
    "batasS2": 2
  }
}
```

---

### `GET /api/graduates/keberhasilan-studi`

Detail chart untuk Card 4 (Keberhasilan Studi).

**Response:**
```json
{
  "success": true,
  "data": {
    "s1": [
      { "angkatan": "2014", "lulus": 12, "total": 15, "percentage": 80.0 },
      { "angkatan": "2015", "lulus": 18, "total": 20, "percentage": 90.0 },
      { "angkatan": "2016", "lulus": 16, "total": 19, "percentage": 84.21 },
      { "angkatan": "2017", "lulus": 14, "total": 17, "percentage": 82.35 },
      { "angkatan": "2018", "lulus": 7, "total": 9, "percentage": 77.78 }
    ],
    "s2": [
      { "angkatan": "2021", "lulus": 60, "total": 71, "percentage": 84.51 }
    ],
    "batasStudiS1": 7,
    "batasStudiS2": 4,
    "angkatanEvaluasiS1": "2018",
    "angkatanEvaluasiS2": "2021"
  }
}
```

---

### `GET /api/graduates/list`

Tabel lulusan dengan filter lengkap dan pagination.

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
      "nim": "21010001",
      "nama": "Budi Santoso",
      "jenjang": "S1",
      "programStudi": "Bio Informatika",
      "fakultas": "Ilmu Kesehatan dan Biosains",
      "tahunLulus": "2025",
      "ipk": 3.72,
      "statusKelulusan": "Sangat Memuaskan",
      "statusKeaktifan": "Lulus"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 101,
    "totalPages": 6
  }
}
```

---

## 🗂️ Arsitektur File Baru

```
src/
├── controllers/
│   └── graduatesController.js      ← BARU: dispatcher untuk tab lulusan
│
├── services/
│   └── graduates/                  ← BARU: service layer kalkulasi lulusan
│       ├── filterBuilder.js        # Build where clause dari query params graduates
│       ├── filterOptions.js        # Ambil opsi filter dari DB (distinct values)
│       ├── totalLulusan.js         # Kalkulasi total lulusan S1/S2 per tahun
│       ├── ipkTrend.js             # Kalkulasi avg IPK per tahun & per prodi
│       ├── tepatWaktu.js           # Kalkulasi % lulusan tepat waktu S1/S2
│       ├── keberhasilanStudi.js    # Kalkulasi % keberhasilan studi per angkatan
│       └── graduateList.js         # Query tabel lulusan + pagination
│
├── routes/
│   └── graduatesRoutes.js          ← BARU: routing untuk endpoint /api/graduates/*
│
└── server.js                       ← UPDATE: daftarkan graduatesRoutes
```

---

## 🔧 Perubahan pada File yang Sudah Ada

| File | Perubahan |
|---|---|
| `prisma/schema.prisma` | Tambah field `periodeWisuda String @default("")` pada model `Graduate` |
| `src/controllers/sync/syncGraduates.js` | Simpan `item.id_periode_akademik` ke field `periodeWisuda` saat upsert |
| `src/server.js` | Daftarkan `graduatesRoutes` di app |

---

## ✅ TODOLIST IMPLEMENTASI

> Dikerjakan secara berurutan dari atas ke bawah.

---

### 🔵 TAHAP 1 — Persiapan & Schema Database

- [x] **1.1** Baca dan pahami dokumen ini + [`requirement-part1.md`](./requirement-part1.md)

- [x] **1.2** Update `prisma/schema.prisma`: tambahkan field `periodeWisuda String @default("")` pada model `Graduate`:
  ```prisma
  model Graduate {
    id              Int     @id @default(autoincrement())
    nim             String  @unique
    jenjang         String
    statusKelulusan String
    tahunLulus      String
    periodeWisuda   String  @default("")  // ← TAMBAHKAN INI
    ipk             Float
    sksLulus        Int
    student         Student @relation(fields: [nim], references: [nim], onDelete: Cascade)
    @@map("graduates")
  }
  ```

- [x] **1.3** Jalankan migrasi database:
  ```bash
  npx prisma migrate dev --name add_periode_wisuda_to_graduates
  ```

- [x] **1.4** Update `src/controllers/sync/syncGraduates.js` agar menyimpan `periodeWisuda`:
  - Pada bagian `upsert`, tambahkan `periodeWisuda: item.id_periode_akademik || ''` di `update` dan `create`
  - Pastikan field `id_periode_akademik` sudah ada di `validItems.push({ ... })`

- [x] **1.5** Jalankan ulang sync graduates untuk mengisi `periodeWisuda` pada data yang sudah ada:
  ```bash
  curl -X POST http://localhost:3000/api/sync/graduates \
    -H "x-api-key: komet-secret-sync-key-2026"
  ```

- [x] **1.6** Verifikasi data `periodeWisuda` sudah terisi:
  ```bash
  node -e "
  const p = require('./src/config/prisma');
  p.graduate.findMany({ take: 5, select: { nim: true, tahunLulus: true, periodeWisuda: true } })
    .then(r => console.log(r)).finally(() => p.$disconnect());
  "
  ```

---

### 🟡 TAHAP 2 — Buat Service Layer Graduates

Buat folder: `src/services/graduates/`

- [x] **2.1** Buat `src/services/graduates/filterBuilder.js`

  Build Prisma `where` clause untuk query graduates + join ke students.

  ```js
  // src/services/graduates/filterBuilder.js
  // Tugas: Konversi query params ke Prisma where clause untuk tabel graduates

  function buildGraduateFilter(query) {
      const {
          programStudi,
          tahunLulus,
          periodeWisuda,
          statusKelulusan,
          fakultas,
          periodeMasuk,
          jenjang,
          search
      } = query;

      const where = {};

      // Filter langsung di tabel graduates
      if (jenjang) where.jenjang = jenjang;

      if (tahunLulus) {
          const list = Array.isArray(tahunLulus) ? tahunLulus : [tahunLulus];
          if (list.length > 0) where.tahunLulus = { in: list };
      }

      if (periodeWisuda) {
          const list = Array.isArray(periodeWisuda) ? periodeWisuda : [periodeWisuda];
          if (list.length > 0) where.periodeWisuda = { in: list };
      }

      if (statusKelulusan) {
          const list = Array.isArray(statusKelulusan) ? statusKelulusan : [statusKelulusan];
          if (list.length > 0) where.statusKelulusan = { in: list };
      }

      // Filter lewat relasi ke student
      const studentFilter = {};
      if (programStudi) {
          const list = Array.isArray(programStudi) ? programStudi : [programStudi];
          studentFilter.programStudi = { in: list };
      }
      if (fakultas) studentFilter.fakultas = fakultas;
      if (periodeMasuk) studentFilter.periodeMasuk = periodeMasuk;
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

  module.exports = { buildGraduateFilter, getPaginationParams };
  ```

- [x] **2.2** Buat `src/services/graduates/filterOptions.js`

  Ambil semua opsi distinct untuk dropdown dan checkbox filter.

  ```js
  // src/services/graduates/filterOptions.js
  const prisma = require('../../config/prisma');

  async function getGraduateFilterOptions() {
      const [prodiRes, tahunRes, periodeWisudaRes, statusRes, fakultasRes, periodeMasukRes, jenjangRes] = await Promise.all([
          prisma.student.findMany({
              where: { graduate: { isNot: null } },
              select: { programStudi: true },
              distinct: ['programStudi']
          }),
          prisma.graduate.findMany({ select: { tahunLulus: true }, distinct: ['tahunLulus'] }),
          prisma.graduate.findMany({ select: { periodeWisuda: true }, distinct: ['periodeWisuda'] }),
          prisma.graduate.findMany({ select: { statusKelulusan: true }, distinct: ['statusKelulusan'] }),
          prisma.student.findMany({
              where: { graduate: { isNot: null } },
              select: { fakultas: true },
              distinct: ['fakultas']
          }),
          prisma.student.findMany({
              where: { graduate: { isNot: null } },
              select: { periodeMasuk: true },
              distinct: ['periodeMasuk']
          }),
          prisma.graduate.findMany({ select: { jenjang: true }, distinct: ['jenjang'] })
      ]);

      return {
          programStudi: prodiRes.map(r => r.programStudi).filter(Boolean).sort(),
          tahunLulus: tahunRes.map(r => r.tahunLulus).filter(Boolean).sort().reverse(),
          periodeWisuda: periodeWisudaRes.map(r => r.periodeWisuda).filter(Boolean).sort().reverse(),
          statusKelulusan: statusRes.map(r => r.statusKelulusan).filter(v => v && v !== 'Aktif').sort(),
          fakultas: fakultasRes.map(r => r.fakultas).filter(Boolean).sort(),
          periodeMasuk: periodeMasukRes.map(r => r.periodeMasuk).filter(Boolean).sort().reverse(),
          jenjang: jenjangRes.map(r => r.jenjang).filter(v => v === 'S1' || v === 'S2').sort()
      };
  }

  module.exports = { getGraduateFilterOptions };
  ```

- [x] **2.3** Buat `src/services/graduates/totalLulusan.js`

  Hitung total lulusan S1 dan S2 dalam rentang 5 tahun.

  ```js
  // src/services/graduates/totalLulusan.js
  const prisma = require('../../config/prisma');

  function getYearRange() {
      const refYear = new Date().getFullYear() - 1;
      return Array.from({ length: 5 }, (_, i) => String(refYear - 4 + i));
  }

  async function getTotalLulusan(whereFilter) {
      const yearRange = getYearRange();
      const baseWhere = { ...whereFilter, tahunLulus: { in: yearRange } };

      const [s1, s2] = await Promise.all([
          prisma.graduate.count({ where: { ...baseWhere, jenjang: whereFilter.jenjang || 'S1' } }),
          prisma.graduate.count({ where: { ...baseWhere, jenjang: whereFilter.jenjang || 'S2' } })
      ]);
      // Jika user sudah filter jenjang, hanya hitung yang relevan
      if (whereFilter.jenjang === 'S1') return { s1, s2: null };
      if (whereFilter.jenjang === 'S2') return { s1: null, s2 };
      return { s1, s2 };
  }

  async function getTotalLulusanByYear(whereFilter) {
      const yearRange = getYearRange();

      const results = await prisma.graduate.groupBy({
          by: ['tahunLulus', 'jenjang'],
          where: { ...whereFilter, tahunLulus: { in: yearRange } },
          _count: true,
          orderBy: { tahunLulus: 'asc' }
      });

      // Pastikan semua tahun tersedia, isi 0 jika tidak ada data
      const s1 = yearRange.map(tahun => {
          const found = results.find(r => r.tahunLulus === tahun && r.jenjang === 'S1');
          return { tahun, count: found ? found._count : 0 };
      });
      const s2 = yearRange.map(tahun => {
          const found = results.find(r => r.tahunLulus === tahun && r.jenjang === 'S2');
          return { tahun, count: found ? found._count : 0 };
      });

      return { s1, s2 };
  }

  module.exports = { getTotalLulusan, getTotalLulusanByYear, getYearRange };
  ```

- [x] **2.4** Buat `src/services/graduates/ipkTrend.js`

  Hitung rata-rata IPK per tahun (S1 & S2) dan per program studi.

  ```js
  // src/services/graduates/ipkTrend.js
  const prisma = require('../../config/prisma');
  const { getYearRange } = require('./totalLulusan');

  async function getAvgIpk(whereFilter) {
      const yearRange = getYearRange();
      const baseWhere = { ...whereFilter, tahunLulus: { in: yearRange } };

      const [s1Agg, s2Agg] = await Promise.all([
          prisma.graduate.aggregate({
              where: { ...baseWhere, jenjang: 'S1' },
              _avg: { ipk: true }
          }),
          prisma.graduate.aggregate({
              where: { ...baseWhere, jenjang: 'S2' },
              _avg: { ipk: true }
          })
      ]);

      return {
          s1: s1Agg._avg.ipk !== null ? parseFloat(s1Agg._avg.ipk.toFixed(2)) : null,
          s2: s2Agg._avg.ipk !== null ? parseFloat(s2Agg._avg.ipk.toFixed(2)) : null
      };
  }

  async function getIpkByYear(whereFilter) {
      const yearRange = getYearRange();
      const results = await prisma.graduate.groupBy({
          by: ['tahunLulus', 'jenjang'],
          where: { ...whereFilter, tahunLulus: { in: yearRange } },
          _avg: { ipk: true },
          _count: true,
          orderBy: { tahunLulus: 'asc' }
      });

      const byYearS1 = yearRange.map(tahun => {
          const found = results.find(r => r.tahunLulus === tahun && r.jenjang === 'S1');
          return {
              tahun,
              avgIpk: found && found._avg.ipk !== null ? parseFloat(found._avg.ipk.toFixed(2)) : null,
              count: found ? found._count : 0
          };
      });
      const byYearS2 = yearRange.map(tahun => {
          const found = results.find(r => r.tahunLulus === tahun && r.jenjang === 'S2');
          return {
              tahun,
              avgIpk: found && found._avg.ipk !== null ? parseFloat(found._avg.ipk.toFixed(2)) : null,
              count: found ? found._count : 0
          };
      });

      return { byYearS1, byYearS2 };
  }

  async function getIpkByProgramStudi(whereFilter) {
      const yearRange = getYearRange();
      const results = await prisma.graduate.findMany({
          where: { ...whereFilter, tahunLulus: { in: yearRange } },
          select: {
              ipk: true,
              student: { select: { programStudi: true } }
          }
      });

      // Kalkulasi avg per prodi
      const prodiMap = {};
      results.forEach(g => {
          const prodi = g.student?.programStudi || 'Unknown';
          if (!prodiMap[prodi]) prodiMap[prodi] = { total: 0, sum: 0 };
          prodiMap[prodi].total++;
          prodiMap[prodi].sum += g.ipk;
      });

      return Object.entries(prodiMap)
          .map(([programStudi, { total, sum }]) => ({
              programStudi,
              avgIpk: parseFloat((sum / total).toFixed(2)),
              count: total
          }))
          .sort((a, b) => b.avgIpk - a.avgIpk);
  }

  module.exports = { getAvgIpk, getIpkByYear, getIpkByProgramStudi };
  ```

- [x] **2.5** Buat `src/services/graduates/tepatWaktu.js`

  Hitung persentase lulusan tepat waktu. S1 ≤ 4 tahun, S2 ≤ 2 tahun.

  ```js
  // src/services/graduates/tepatWaktu.js
  const prisma = require('../../config/prisma');
  const { getYearRange } = require('./totalLulusan');

  const BATAS_STUDI = { S1: 4, S2: 2 };

  async function getTepatWaktu(whereFilter) {
      const refYear = new Date().getFullYear() - 1;
      // Hitung % tepat waktu dari seluruh lulusan tahun referensi
      const graduates = await prisma.graduate.findMany({
          where: { ...whereFilter, tahunLulus: String(refYear) },
          select: {
              jenjang: true,
              tahunLulus: true,
              student: { select: { periodeMasuk: true } }
          }
      });

      const calcPct = (jenjang) => {
          const filtered = graduates.filter(g => g.jenjang === jenjang);
          if (filtered.length === 0) return null;
          const tepatWaktu = filtered.filter(g => {
              const tahunMasuk = parseInt(g.student?.periodeMasuk?.substring(0, 4));
              const lamaStudi = parseInt(g.tahunLulus) - tahunMasuk;
              return lamaStudi <= BATAS_STUDI[jenjang];
          }).length;
          return parseFloat(((tepatWaktu / filtered.length) * 100).toFixed(2));
      };

      return {
          s1: whereFilter.jenjang === 'S2' ? null : calcPct('S1'),
          s2: whereFilter.jenjang === 'S1' ? null : calcPct('S2'),
          referenceYear: refYear
      };
  }

  async function getTepatWaktuByYear(whereFilter) {
      const yearRange = getYearRange();
      const graduates = await prisma.graduate.findMany({
          where: { ...whereFilter, tahunLulus: { in: yearRange } },
          select: {
              jenjang: true,
              tahunLulus: true,
              student: { select: { periodeMasuk: true } }
          }
      });

      const calcByYear = (jenjang) => {
          return yearRange.map(tahun => {
              const filtered = graduates.filter(g => g.jenjang === jenjang && g.tahunLulus === tahun);
              if (filtered.length === 0) return { tahun, tepatWaktu: 0, total: 0, percentage: null };
              const tepatWaktu = filtered.filter(g => {
                  const tahunMasuk = parseInt(g.student?.periodeMasuk?.substring(0, 4));
                  return (parseInt(tahun) - tahunMasuk) <= BATAS_STUDI[jenjang];
              }).length;
              return {
                  tahun,
                  tepatWaktu,
                  total: filtered.length,
                  percentage: parseFloat(((tepatWaktu / filtered.length) * 100).toFixed(2))
              };
          });
      };

      return {
          s1: calcByYear('S1'),
          s2: calcByYear('S2'),
          batasS1: BATAS_STUDI.S1,
          batasS2: BATAS_STUDI.S2
      };
  }

  module.exports = { getTepatWaktu, getTepatWaktuByYear };
  ```

- [x] **2.6** Buat `src/services/graduates/keberhasilanStudi.js`

  Hitung % keberhasilan studi berdasarkan angkatan yang sudah melewati batas studi.

  ```js
  // src/services/graduates/keberhasilanStudi.js
  const prisma = require('../../config/prisma');

  const BATAS_STUDI = { S1: 7, S2: 4 };

  function getAngkatanEvaluasi(jenjang) {
      const refYear = new Date().getFullYear() - 1;
      return String(refYear - BATAS_STUDI[jenjang]);
  }

  async function getKeberhasilanStudi(whereFilter) {
      const angkatanS1 = getAngkatanEvaluasi('S1');
      const angkatanS2 = getAngkatanEvaluasi('S2');

      const calcPct = async (angkatan, jenjang) => {
          const [total, lulus] = await Promise.all([
              prisma.student.count({
                  where: { ...whereFilter.student, jenjang, periodeMasuk: { startsWith: angkatan } }
              }),
              prisma.student.count({
                  where: { ...whereFilter.student, jenjang, periodeMasuk: { startsWith: angkatan }, statusKeaktifan: 'Lulus' }
              })
          ]);
          if (total === 0) return null;
          return {
              lulus, total,
              percentage: parseFloat(((lulus / total) * 100).toFixed(2))
          };
      };

      const [s1Data, s2Data] = await Promise.all([
          calcPct(angkatanS1, 'S1'),
          calcPct(angkatanS2, 'S2')
      ]);

      return {
          s1: s1Data ? s1Data.percentage : null,
          s2: s2Data ? s2Data.percentage : null,
          angkatanS1,
          angkatanS2
      };
  }

  async function getKeberhasilanStudiByAngkatan(whereFilter) {
      // Chart: 5 angkatan ke belakang dari angkatan yang dievaluasi, per jenjang
      const calcSeries = async (jenjang) => {
          const evalAngkatan = parseInt(getAngkatanEvaluasi(jenjang));
          const angkatanList = Array.from({ length: 5 }, (_, i) => String(evalAngkatan - 4 + i));

          return Promise.all(angkatanList.map(async (angkatan) => {
              const [total, lulus] = await Promise.all([
                  prisma.student.count({
                      where: { ...whereFilter.student, jenjang, periodeMasuk: { startsWith: angkatan } }
                  }),
                  prisma.student.count({
                      where: { ...whereFilter.student, jenjang, periodeMasuk: { startsWith: angkatan }, statusKeaktifan: 'Lulus' }
                  })
              ]);
              return {
                  angkatan,
                  lulus,
                  total,
                  percentage: total > 0 ? parseFloat(((lulus / total) * 100).toFixed(2)) : null
              };
          }));
      };

      const [s1, s2] = await Promise.all([calcSeries('S1'), calcSeries('S2')]);
      return {
          s1,
          s2,
          batasStudiS1: BATAS_STUDI.S1,
          batasStudiS2: BATAS_STUDI.S2,
          angkatanEvaluasiS1: getAngkatanEvaluasi('S1'),
          angkatanEvaluasiS2: getAngkatanEvaluasi('S2')
      };
  }

  module.exports = { getKeberhasilanStudi, getKeberhasilanStudiByAngkatan };
  ```

- [x] **2.7** Buat `src/services/graduates/graduateList.js`

  Query tabel lulusan dengan filter + pagination.

  ```js
  // src/services/graduates/graduateList.js
  const prisma = require('../../config/prisma');

  async function getGraduateList(whereFilter, page = 1, limit = 20) {
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
          prisma.graduate.findMany({
              where: whereFilter,
              select: {
                  nim: true,
                  jenjang: true,
                  statusKelulusan: true,
                  tahunLulus: true,
                  periodeWisuda: true,
                  ipk: true,
                  sksLulus: true,
                  student: {
                      select: {
                          nama: true,
                          programStudi: true,
                          fakultas: true,
                          statusKeaktifan: true
                      }
                  }
              },
              skip,
              take: limit,
              orderBy: [{ tahunLulus: 'desc' }, { student: { nama: 'asc' } }]
          }),
          prisma.graduate.count({ where: whereFilter })
      ]);

      // Flatten relasi student ke response
      const flatData = data.map(g => ({
          nim: g.nim,
          nama: g.student?.nama || '',
          jenjang: g.jenjang,
          programStudi: g.student?.programStudi || '',
          fakultas: g.student?.fakultas || '',
          tahunLulus: g.tahunLulus,
          ipk: g.ipk,
          statusKelulusan: g.statusKelulusan,
          statusKeaktifan: g.student?.statusKeaktifan || ''
      }));

      return {
          data: flatData,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      };
  }

  module.exports = { getGraduateList };
  ```

---

### 🟠 TAHAP 3 — Buat Controller Graduates

- [x] **3.1** Buat `src/controllers/graduatesController.js`

  ```js
  // src/controllers/graduatesController.js
  const { buildGraduateFilter, getPaginationParams } = require('../services/graduates/filterBuilder');
  const { getGraduateFilterOptions } = require('../services/graduates/filterOptions');
  const { getTotalLulusan, getTotalLulusanByYear, getYearRange } = require('../services/graduates/totalLulusan');
  const { getAvgIpk, getIpkByYear, getIpkByProgramStudi } = require('../services/graduates/ipkTrend');
  const { getTepatWaktu, getTepatWaktuByYear } = require('../services/graduates/tepatWaktu');
  const { getKeberhasilanStudi, getKeberhasilanStudiByAngkatan } = require('../services/graduates/keberhasilanStudi');
  const { getGraduateList } = require('../services/graduates/graduateList');
  const logger = require('../utils/logger');

  // GET /api/graduates/summary
  const getSummary = async (req, res) => {
      try {
          const whereFilter = buildGraduateFilter(req.query);
          const yearRange = getYearRange();
          const refYear = new Date().getFullYear() - 1;

          const [filterOptions, totalLulusan, avgIpk, tepatWaktu, keberhasilan] = await Promise.all([
              getGraduateFilterOptions(),
              getTotalLulusan(whereFilter),
              getAvgIpk(whereFilter),
              getTepatWaktu(whereFilter),
              getKeberhasilanStudi(whereFilter)
          ]);

          return res.status(200).json({
              success: true,
              referenceYear: refYear,
              yearRange,
              summary: {
                  totalLulusan,
                  avgIpk,
                  tepatWaktu,
                  keberhasilanStudi: keberhasilan
              },
              filterOptions
          });
      } catch (error) {
          logger.error(`[graduates/getSummary] Error: ${error.message}`);
          return res.status(500).json({ success: false, message: 'Gagal mengambil summary lulusan.', error: error.message });
      }
  };

  // GET /api/graduates/total-lulusan
  const getTotalLulusanDetail = async (req, res) => {
      try {
          const whereFilter = buildGraduateFilter(req.query);
          const data = await getTotalLulusanByYear(whereFilter);
          return res.status(200).json({ success: true, data });
      } catch (error) {
          logger.error(`[graduates/getTotalLulusanDetail] Error: ${error.message}`);
          return res.status(500).json({ success: false, message: 'Gagal mengambil detail total lulusan.', error: error.message });
      }
  };

  // GET /api/graduates/ipk-trend
  const getIpkTrendDetail = async (req, res) => {
      try {
          const whereFilter = buildGraduateFilter(req.query);
          const [byYear, byProgramStudi] = await Promise.all([
              getIpkByYear(whereFilter),
              getIpkByProgramStudi(whereFilter)
          ]);
          return res.status(200).json({ success: true, data: { ...byYear, byProgramStudi } });
      } catch (error) {
          logger.error(`[graduates/getIpkTrendDetail] Error: ${error.message}`);
          return res.status(500).json({ success: false, message: 'Gagal mengambil tren IPK.', error: error.message });
      }
  };

  // GET /api/graduates/tepat-waktu
  const getTepatWaktuDetail = async (req, res) => {
      try {
          const whereFilter = buildGraduateFilter(req.query);
          const data = await getTepatWaktuByYear(whereFilter);
          return res.status(200).json({ success: true, data });
      } catch (error) {
          logger.error(`[graduates/getTepatWaktuDetail] Error: ${error.message}`);
          return res.status(500).json({ success: false, message: 'Gagal mengambil data tepat waktu.', error: error.message });
      }
  };

  // GET /api/graduates/keberhasilan-studi
  const getKeberhasilanStudiDetail = async (req, res) => {
      try {
          const whereFilter = buildGraduateFilter(req.query);
          const data = await getKeberhasilanStudiByAngkatan(whereFilter);
          return res.status(200).json({ success: true, data });
      } catch (error) {
          logger.error(`[graduates/getKeberhasilanStudiDetail] Error: ${error.message}`);
          return res.status(500).json({ success: false, message: 'Gagal mengambil data keberhasilan studi.', error: error.message });
      }
  };

  // GET /api/graduates/list
  const getGraduates = async (req, res) => {
      try {
          const whereFilter = buildGraduateFilter(req.query);
          const { page, limit } = getPaginationParams(req.query);
          const result = await getGraduateList(whereFilter, page, limit);
          return res.status(200).json({ success: true, ...result });
      } catch (error) {
          logger.error(`[graduates/getGraduates] Error: ${error.message}`);
          return res.status(500).json({ success: false, message: 'Gagal mengambil daftar lulusan.', error: error.message });
      }
  };

  module.exports = {
      getSummary,
      getTotalLulusanDetail,
      getIpkTrendDetail,
      getTepatWaktuDetail,
      getKeberhasilanStudiDetail,
      getGraduates
  };
  ```

---

### 🟢 TAHAP 4 — Buat Routes & Daftarkan ke Server

- [x] **4.1** Buat `src/routes/graduatesRoutes.js`

  ```js
  // src/routes/graduatesRoutes.js
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../middlewares/auth');
  const graduates = require('../controllers/graduatesController');

  router.use(authMiddleware);

  router.get('/summary', graduates.getSummary);
  router.get('/total-lulusan', graduates.getTotalLulusanDetail);
  router.get('/ipk-trend', graduates.getIpkTrendDetail);
  router.get('/tepat-waktu', graduates.getTepatWaktuDetail);
  router.get('/keberhasilan-studi', graduates.getKeberhasilanStudiDetail);
  router.get('/list', graduates.getGraduates);

  module.exports = router;
  ```

- [x] **4.2** Update `src/server.js` — daftarkan routes baru:
  ```js
  const graduatesRoutes = require('./routes/graduatesRoutes');
  // ...
  app.use('/api/graduates', graduatesRoutes);
  ```

---

### 🔴 TAHAP 5 — Testing Manual

- [x] **5.1** Jalankan server: `npm run dev`

- [x] **5.2** Test endpoint `/summary` tanpa filter:
  ```bash
  curl http://localhost:3000/api/graduates/summary \
    -H "x-api-key: komet-secret-sync-key-2026" | jq .
  ```

- [x] **5.3** Test dengan filter jenjang S1:
  ```bash
  curl "http://localhost:3000/api/graduates/summary?jenjang=S1" \
    -H "x-api-key: komet-secret-sync-key-2026" | jq .summary
  ```

- [x] **5.4** Test detail chart total lulusan:
  ```bash
  curl http://localhost:3000/api/graduates/total-lulusan \
    -H "x-api-key: komet-secret-sync-key-2026" | jq .
  ```

- [x] **5.5** Test detail chart IPK trend:
  ```bash
  curl http://localhost:3000/api/graduates/ipk-trend \
    -H "x-api-key: komet-secret-sync-key-2026" | jq .
  ```

- [x] **5.6** Test detail chart tepat waktu:
  ```bash
  curl http://localhost:3000/api/graduates/tepat-waktu \
    -H "x-api-key: komet-secret-sync-key-2026" | jq .
  ```

- [x] **5.7** Test detail chart keberhasilan studi:
  ```bash
  curl http://localhost:3000/api/graduates/keberhasilan-studi \
    -H "x-api-key: komet-secret-sync-key-2026" | jq .
  ```

- [x] **5.8** Test tabel lulusan dengan pagination:
  ```bash
  curl "http://localhost:3000/api/graduates/list?page=1&limit=10" \
    -H "x-api-key: komet-secret-sync-key-2026" | jq .
  ```

- [x] **5.9** Test filter multi-select (predikat + tahun lulus):
  ```bash
  curl "http://localhost:3000/api/graduates/list?statusKelulusan=Cum+Laude&tahunLulus=2024&tahunLulus=2025" \
    -H "x-api-key: komet-secret-sync-key-2026" | jq .pagination
  ```

- [x] **5.10** Test filter fakultas + jenjang:
  ```bash
  curl "http://localhost:3000/api/graduates/summary?jenjang=S1&fakultas=Ilmu+Kesehatan+dan+Biosains" \
    -H "x-api-key: komet-secret-sync-key-2026" | jq .summary
  ```

- [x] **5.11** Verifikasi logika keberhasilan studi secara manual:
  - Tahun sekarang = 2026, referensi = 2025
  - Angkatan evaluasi S1 = 2025 - 7 = **2018**
  - Query manual: `SELECT COUNT(*) FROM students WHERE periodeMasuk LIKE '2018%'`
  - Cocokkan dengan response `/keberhasilan-studi`

---

### 🟣 TAHAP 6 — Validasi & Edge Cases

- [x] **6.1** Handle kasus angkatan evaluasi keberhasilan studi tidak ada datanya (kembalikan `null`)
- [x] **6.2** Handle kasus `periodeWisuda` kosong (sebelum migrasi / data lama) — gunakan `@default("")`
- [x] **6.3** Handle kasus S2 tidak ada di semua tahun rentang 5 tahun (kembalikan array dengan count 0)
- [x] **6.4** Pastikan `filterOptions.statusKelulusan` tidak memasukkan nilai `"Aktif"` (ini anomali data dari SEVIMA)
- [x] **6.5** Pastikan filter `jenjang=S1` pada summary **hanya** menampilkan data S1 di semua 4 card
- [x] **6.6** Verifikasi `periodeWisuda` setelah sync ulang: nilai tidak boleh kosong untuk data baru

---

### ⚪ TAHAP 7 — Dokumentasi & Cleanup

- [x] **7.1** Update `requirement-part2.md` ini — tandai semua item selesai dengan `[x]`
- [x] **7.2** Konfirmasi ke tim frontend struktur response JSON final semua endpoint `/api/graduates/*`
- [x] **7.3** Pastikan tidak ada endpoint yang mereturn data `Prof` (jenjang Profesi) kecuali diminta frontend

---

## 🗺️ Ringkasan File yang Dibuat / Diubah

| File | Status | Keterangan |
|---|---|---|
| `prisma/schema.prisma` | 🔄 Update | Tambah field `periodeWisuda` pada model `Graduate` |
| `src/controllers/sync/syncGraduates.js` | 🔄 Update | Simpan `periodeWisuda` dari field `id_periode_akademik` |
| `src/services/graduates/filterBuilder.js` | 🆕 Baru | Builder where clause Prisma untuk graduates |
| `src/services/graduates/filterOptions.js` | 🆕 Baru | Ambil opsi dropdown/checkbox filter dari DB |
| `src/services/graduates/totalLulusan.js` | 🆕 Baru | Kalkulasi total lulusan S1/S2 per tahun |
| `src/services/graduates/ipkTrend.js` | 🆕 Baru | Kalkulasi rata-rata IPK per tahun & prodi |
| `src/services/graduates/tepatWaktu.js` | 🆕 Baru | Kalkulasi % lulusan tepat waktu S1/S2 |
| `src/services/graduates/keberhasilanStudi.js` | 🆕 Baru | Kalkulasi % keberhasilan studi per angkatan |
| `src/services/graduates/graduateList.js` | 🆕 Baru | Query tabel lulusan + pagination |
| `src/controllers/graduatesController.js` | 🆕 Baru | Dispatcher endpoint `/api/graduates/*` |
| `src/routes/graduatesRoutes.js` | 🆕 Baru | Routing `GET /api/graduates/*` |
| `src/server.js` | 🔄 Update | Daftarkan `graduatesRoutes` |

> File lain tidak perlu diubah.
