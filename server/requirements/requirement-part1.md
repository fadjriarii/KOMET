# 📘 KOMET — Backend Requirement & Implementation Guide

> **Komet** adalah backend REST API untuk sistem dashboard statistik mahasiswa yang terintegrasi dengan **SEVIMA Platform** (SiakadCloud). Data mahasiswa disinkronkan secara berkala dari API SEVIMA, disimpan ke database lokal MySQL, lalu diolah menjadi statistik yang siap dikonsumsi oleh frontend.

---

## 📂 Struktur Project Saat Ini

```
server/
├── prisma/
│   ├── schema.prisma          # Definisi model database (Student, Graduate, MbkmActivity)
│   └── migrations/            # Riwayat migrasi database
├── src/
│   ├── config/
│   │   ├── envValidator.js    # Validasi env variables saat startup (Fail-Fast)
│   │   ├── prisma.js          # Singleton Prisma Client
│   │   └── sevimaApi.js       # Axios instance ke SEVIMA API (dengan retry + backoff)
│   ├── controllers/
│   │   ├── statsController.js # Logika kalkulasi statistik mahasiswa (AKAN DIREFACTOR)
│   │   ├── syncController.js  # Entry point controller sinkronisasi (dispatcher)
│   │   └── sync/
│   │       ├── helpers.js     # Fungsi bantu: sleep, formatAngkatan, hitungSemester, dll.
│   │       ├── syncStudents.js
│   │       ├── syncGraduates.js
│   │       ├── syncMbkm.js
│   │       ├── syncAll.js
│   │       ├── syncStatus.js
│   │       └── index.js
│   ├── middlewares/
│   │   └── auth.js            # API Key middleware (x-api-key / Bearer token)
│   ├── routes/
│   │   ├── statsRoutes.js     # GET /api/stats/student-dashboard
│   │   └── syncRoutes.js      # POST /api/sync/* (protected)
│   ├── utils/
│   │   ├── logger.js          # Custom logger (console + file)
│   │   └── syncJobTracker.js  # Tracker status job sinkronisasi (berbasis file JSON)
│   └── server.js              # Entry point Express.js
├── logs/                      # Output log runtime
├── requirements/              # Dokumen tambahan (mapping.xlsx)
├── .env                       # Environment variables
└── package.json
```

---

## 🧱 Tech Stack

| Layer | Teknologi | Versi | Keterangan |
|---|---|---|---|
| **Runtime** | Node.js | ≥ 18 LTS | JavaScript runtime server-side |
| **Framework** | Express.js | ^5.2.1 | HTTP server & routing |
| **ORM** | Prisma | ^6.19.3 | Abstraksi database MySQL yang type-safe |
| **Database** | MySQL | 8.x | Database relasional utama |
| **HTTP Client** | Axios | ^1.20.0 | Konsumsi SEVIMA API + retry/backoff |
| **Auth** | API Key | — | Header `x-api-key` atau `Authorization: Bearer` |
| **Logging** | Custom Logger | — | Output ke console + file `logs/combined.log` |
| **Dev Tools** | Nodemon | ^3.1.14 | Hot-reload saat development |
| **Env Management** | dotenv | ^17.4.2 | Load `.env` ke `process.env` |

---

## 🗄️ Skema Database (Prisma Schema)

### Model `Student` — Tabel `students`

Menyimpan data pokok setiap mahasiswa yang disinkronkan dari SEVIMA.

| Field | Tipe | Keterangan |
|---|---|---|
| `nim` | `String` (PK) | Nomor Induk Mahasiswa, unik per mahasiswa |
| `nama` | `String` | Nama lengkap mahasiswa |
| `jenjang` | `String` | Jenjang pendidikan (S1, S2, D3, dll.) |
| `periodeMasuk` | `String` | Kode periode masuk dari SEVIMA (contoh: `"20241"` = semester genap 2024) |
| `angkatan` | `String` | Hasil format dari `periodeMasuk` (contoh: `"2024 Genap"`) |
| `programStudi` | `String` | Nama program studi mahasiswa |
| `fakultas` | `String` | Nama fakultas (di-lookup dari API SEVIMA `/program-studi`) |
| `statusKeaktifan` | `String` | Status mahasiswa: `"Aktif"`, `"Cuti"`, `"Lulus"`, dll. |
| `semester` | `Int` | Semester aktif mahasiswa (dihitung dari `periodeMasuk` vs `periodeTerakhir`) |
| `kewarganegaraan` | `String` | `"WNI"` jika `nama_negara = "indonesia"`, sisanya `"WNA"` |
| `updatedAt` | `DateTime` | Timestamp otomatis saat data diupdate |

### Model `Graduate` — Tabel `graduates`

Menyimpan data kelulusan, berelasi 1-to-1 dengan `Student`.

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | `Int` (PK) | Auto-increment |
| `nim` | `String` (FK unique) | Relasi ke `Student.nim` |
| `jenjang` | `String` | Jenjang saat lulus |
| `statusKelulusan` | `String` | Predikat/status kelulusan |
| `tahunLulus` | `String` | Tahun kelulusan (4 digit) |
| `ipk` | `Float` | IPK saat lulus |
| `sksLulus` | `Int` | Total SKS yang diselesaikan |

### Model `MbkmActivity` — Tabel `mbkm_activities`

Menyimpan aktivitas MBKM mahasiswa, berelasi many-to-one dengan `Student`.

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | `Int` (PK) | Auto-increment |
| `nim` | `String` (FK) | Relasi ke `Student.nim` |
| `periode` | `String` | Periode kegiatan MBKM |
| `programStudi` | `String` | Program studi saat MBKM |
| `fakultas` | `String` | Fakultas saat MBKM |
| `jenjang` | `String` | Jenjang saat MBKM |
| `statusKeaktifan` | `Text` | Status mahasiswa saat MBKM |
| `jenisAktivitas` | `Text` | Jenis kegiatan MBKM |
| `judulAktivitas` | `Text` | Judul/nama kegiatan MBKM |
| `mitra` | `Text` | Nama mitra/institusi MBKM |
| `statusAktivitas` | `String` | Status pelaksanaan kegiatan |

---

## 🌐 API Endpoints yang Ada

### Sync Routes — `POST /api/sync/*` (Protected: butuh API Key)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/sync/students` | Sinkronisasi data mahasiswa dari SEVIMA |
| `POST` | `/api/sync/graduates` | Sinkronisasi data kelulusan dari SEVIMA |
| `POST` | `/api/sync/mbkm` | Sinkronisasi data aktivitas MBKM dari SEVIMA |
| `POST` | `/api/sync/all` | Sinkronisasi keseluruhan (students + graduates + mbkm) |
| `GET` | `/api/sync/status` | Cek status job sinkronisasi yang sedang berjalan |

**Catatan:** Semua endpoint sync mendukung parameter `?async=true` (atau body `{ "async": true }`) untuk menjalankan sinkronisasi di background (non-blocking).

### Stats Routes — `GET /api/stats/*` (Protected: butuh API Key)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/stats/student-dashboard` | Statistik dashboard mahasiswa (total aktif, tren internasional, intake, penurunan MB) |

**Query Parameters yang sudah ada:**
- `?fakultas=...` — Filter berdasarkan fakultas
- `?programStudi=...` — Filter berdasarkan program studi
- `?jenjang=...` — Filter berdasarkan jenjang
- `?periode=2024/2025` — Filter tahun akademik untuk analisis penurunan MB

### Health Check

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/health` | Mengecek status server (uptime + timestamp) |

---

## 🔄 Alur Sinkronisasi Data (ETL Pipeline)

```
SEVIMA API (SiakadCloud)
        │
        │  Axios (dengan retry + exponential backoff)
        ▼
  sevimaApi.js (Axios Instance)
        │
        │  Pagination per halaman (page by page)
        ▼
  syncStudents / syncGraduates / syncMbkm
        │
        │  Transformasi + Filter (isAkunLama, formatAngkatan, hitungSemester, dll.)
        ▼
  processInBatches() → Prisma upsert (25 per batch)
        │
        ▼
  MySQL Database (via Prisma ORM)
        │
        ▼
  syncJobTracker → Simpan status ke logs/sync-state.json
```

---

## 📊 Logika Kalkulasi Statistik (Kondisi Saat Ini — Akan Direfactor)

Saat ini semua logika kalkulasi berada dalam **satu file besar** `statsController.js` (186 baris). Ini adalah kondisi yang perlu dimodularisasi.

### Statistik yang dikalkulasi:

#### 1. `totalActiveStudents`
- **Definisi:** Total mahasiswa dengan `statusKeaktifan === 'Aktif'` dari seluruh data.
- **Scope:** Dipengaruhi filter `fakultas`, `programStudi`, dan `jenjang`.

#### 2. `internationalStudentsTrend`
- **Definisi:** Tren mahasiswa asing (WNA) aktif per tahun akademik.
- **Formula:** `persentase = (wnaAktif / totalAktif) * 100` per tahun akademik.
- **Output:** Array berisi `{ academicYear, wnaActiveCount, totalActiveCount, percentage }` per tahun.
- **Catatan Penting:** Saat ini `intakeCount` dihitung dari **seluruh mahasiswa aktif** di tahun tersebut, bukan hanya semester 1. Ini adalah **bug** yang perlu diperbaiki (lihat Todolist).

#### 3. `intakeTrend`
- **Definisi:** Jumlah mahasiswa baru (semester 1) aktif per tahun akademik.
- **Formula yang benar:** `COUNT(students WHERE semester = 1 AND statusKeaktifan = 'Aktif' AND tahunAkademik = X)`
- **Catatan Penting:** Saat ini perhitungan intake **masih salah** — `intakeCount` menghitung semua mahasiswa aktif, bukan yang semester 1 saja. Ini harus diperbaiki.

#### 4. `newStudentDecline` (Penurunan Mahasiswa Baru)
- **Definisi:** Rata-rata persentase perubahan jumlah mahasiswa baru selama 5 tahun ke belakang dari periode yang dipilih.
- **Variabel:**
  - `A` = intake tahun ke-N (tahun terpilih / terbaru)
  - `B` = intake tahun ke-(N-1)
  - `C` = intake tahun ke-(N-2)
  - `D` = intake tahun ke-(N-3)
  - `E` = intake tahun ke-(N-4)
- **Formula:**
  ```
  % Penurunan MB = rata-rata dari:
    (B - A) / A    ← perubahan dari A ke B
    (C - B) / B    ← perubahan dari B ke C
    (D - C) / C    ← perubahan dari C ke D
    (E - D) / D    ← perubahan dari D ke E
  ```
  Hasilnya dikalikan 100 untuk diubah ke persen.
  - Nilai **negatif** → terjadi **penurunan** mahasiswa baru.
  - Nilai **positif** → terjadi **kenaikan** mahasiswa baru.

---

## 🎯 Kebutuhan Fitur Baru (Target Implementasi)

### Konteks: Apa yang Diinginkan Frontend

Frontend akan menampilkan:

1. **4 Card Statistik Utama:**
   - `totalActiveStudents` — Total mahasiswa aktif keseluruhan
   - `internationalStudentsTrend` — Tren mahasiswa asing (WNA) aktif
   - `intakeTrend` — Tren mahasiswa baru (semester 1) aktif
   - `newStudentDecline` — Penurunan mahasiswa baru 5 tahun

   Setiap card **dapat diklik** untuk melihat detail dalam bentuk chart (ketika tidak ada filter aktif).

2. **Container Filter (Multi-filter):**
   - **Checkbox (multi-select):** Angkatan, Semester
   - **Dropdown (single-select):** Periode Masuk, Kewarganegaraan, Status Keaktifan
   - **Search:** Pencarian berdasarkan NIM atau Nama
   - **Filter:** Fakultas, Program Studi
   - **Tombol Reset Filter**

   Ketika filter diaktifkan → card tidak bisa diklik → angka menyesuaikan dengan filter.

3. **Tabel Mahasiswa** (di bawah filter):
   - Kolom: No, NIM, Nama, Angkatan, Periode, Program Studi, Fakultas, Semester, Kewarganegaraan, Status Keaktifan
   - Data tabel mengikuti filter yang aktif
   - Mendukung **pagination** agar tidak memberatkan browser

### Kebutuhan Backend (yang harus dibuat):

| Kebutuhan | Endpoint Baru |
|---|---|
| Data 4 card statistik + filter options | `GET /api/stats/summary` |
| Detail data card totalActiveStudents (untuk chart) | `GET /api/stats/active-students` |
| Detail data card internationalStudentsTrend (untuk chart) | `GET /api/stats/international-trend` |
| Detail data card intakeTrend (untuk chart) | `GET /api/stats/intake-trend` |
| Detail data card newStudentDecline (untuk chart) | `GET /api/stats/decline-trend` |
| Daftar mahasiswa dengan filter & pagination | `GET /api/stats/students` |

---

## 🔧 Masalah yang Perlu Diperbaiki

### Bug 1: Intake Count Salah
**Lokasi:** [`statsController.js` baris 85](file:///home/fadjri/projects/Komet/server/src/controllers/statsController.js#L79-L87)

```js
// ❌ SALAH: menghitung semua mahasiswa aktif sebagai intake
if (s.statusKeaktifan === 'Aktif') {
    activeByYear[acadYear].intakeCount++; // ini BUKAN hanya semester 1!
}

// ✅ BENAR: intake hanya mahasiswa semester 1 yang aktif
if (s.statusKeaktifan === 'Aktif' && s.semester === 1) {
    activeByYear[acadYear].intakeCount++;
}
```

### Bug 2: Struktur Kode Tidak Modular
**Masalah:** Semua logika (query DB, kalkulasi, format response) ada dalam satu controller function besar → sulit di-maintain dan di-test.

**Solusi:** Pisahkan ke dalam **Service Layer** (`src/services/stats/`) dan buat endpoint terpisah per kartu statistik.

### Bug 3: Filter `angkatan` dan `semester` Belum Ada
**Masalah:** Frontend butuh filter multi-select untuk angkatan dan semester, tapi query parameter belum mendukungnya.

---

## 🗂️ Arsitektur Baru yang Diusulkan

```
src/
├── config/
│   ├── envValidator.js     (tidak berubah)
│   ├── prisma.js           (tidak berubah)
│   └── sevimaApi.js        (tidak berubah)
│
├── controllers/
│   ├── sync/               (tidak berubah)
│   │   └── ...
│   ├── syncController.js   (tidak berubah)
│   └── statsController.js  ← REFACTOR: hanya dispatcher ke service
│
├── services/               ← BARU: layer kalkulasi logika bisnis
│   └── stats/
│       ├── filterBuilder.js        # Mem-build where clause Prisma dari query params
│       ├── activeStudents.js       # Logika totalActiveStudents
│       ├── internationalTrend.js   # Logika internationalStudentsTrend
│       ├── intakeTrend.js          # Logika intakeTrend (diperbaiki: semester = 1)
│       ├── declineTrend.js         # Logika newStudentDecline (5 tahun)
│       ├── filterOptions.js        # Fetch opsi dropdown/filter dari DB
│       └── studentList.js          # Query tabel mahasiswa + pagination
│
├── middlewares/
│   └── auth.js             (tidak berubah)
│
├── routes/
│   ├── syncRoutes.js       (tidak berubah)
│   └── statsRoutes.js      ← UPDATE: tambahkan routes baru
│
└── utils/
    ├── logger.js           (tidak berubah)
    └── syncJobTracker.js   (tidak berubah)
```

---

## 📡 Spesifikasi API Baru (Detail)

### `GET /api/stats/summary`
Mengembalikan semua angka untuk 4 card + opsi filter. Ini adalah endpoint **utama** yang dipanggil saat halaman pertama kali dibuka atau saat filter berubah.

**Query Parameters:**
| Parameter | Tipe | Multi? | Contoh |
|---|---|---|---|
| `fakultas` | string | Ya (multiple `?fakultas=X&fakultas=Y`) | `?fakultas=FTIK` |
| `programStudi` | string | Ya | `?programStudi=Informatika` |
| `angkatan` | string | Ya | `?angkatan=2023%20Ganjil` |
| `semester` | number | Ya | `?semester=1&semester=3` |
| `periodeMasuk` | string | Tidak | `?periodeMasuk=20241` |
| `kewarganegaraan` | string | Tidak | `?kewarganegaraan=WNA` |
| `statusKeaktifan` | string | Tidak | `?statusKeaktifan=Aktif` |
| `search` | string | Tidak | `?search=Budi` |
| `selectedPeriode` | string | Tidak | `?selectedPeriode=2024/2025` |

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalActiveStudents": 1250,
    "internationalStudentsTrend": {
      "latest": {
        "academicYear": "2024/2025",
        "wnaActiveCount": 12,
        "totalActiveCount": 250,
        "percentage": 4.80
      },
      "trend": [...]
    },
    "intakeTrend": {
      "latest": {
        "academicYear": "2024/2025",
        "intakeCount": 310
      },
      "trend": [...]
    },
    "newStudentDecline": {
      "selectedPeriod": "2024/2025",
      "declinePercentage": -5.23,
      "history": {
        "A": { "academicYear": "2024/2025", "count": 310 },
        "B": { "academicYear": "2023/2024", "count": 325 },
        "C": { "academicYear": "2022/2023", "count": 340 },
        "D": { "academicYear": "2021/2022", "count": 330 },
        "E": { "academicYear": "2020/2021", "count": 315 }
      }
    }
  },
  "filterOptions": {
    "fakultas": ["FTIK", "FEB", "FH", ...],
    "programStudi": ["Informatika", "Manajemen", ...],
    "angkatan": ["2024 Ganjil", "2023 Ganjil", ...],
    "semester": [1, 2, 3, 4, 5, 6, 7, 8],
    "periodeMasuk": ["20241", "20231", ...],
    "kewarganegaraan": ["WNI", "WNA"],
    "statusKeaktifan": ["Aktif", "Cuti", "Lulus", ...]
  }
}
```

---

### `GET /api/stats/active-students`
Detail data untuk chart card **Total Mahasiswa Aktif** (breakdown per tahun akademik).

**Response:**
```json
{
  "success": true,
  "data": [
    { "academicYear": "2020/2021", "activeCount": 980 },
    { "academicYear": "2021/2022", "activeCount": 1050 },
    { "academicYear": "2022/2023", "activeCount": 1100 },
    { "academicYear": "2023/2024", "activeCount": 1200 },
    { "academicYear": "2024/2025", "activeCount": 1250 }
  ]
}
```

---

### `GET /api/stats/international-trend`
Detail data untuk chart card **Mahasiswa Asing (WNA)** per tahun akademik.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "academicYear": "2020/2021",
      "wnaActiveCount": 8,
      "totalActiveCount": 980,
      "percentage": 0.82
    },
    ...
  ]
}
```

---

### `GET /api/stats/intake-trend`
Detail data untuk chart card **Intake (Mahasiswa Baru)** — hanya semester 1 aktif per tahun akademik.

**Response:**
```json
{
  "success": true,
  "data": [
    { "academicYear": "2020/2021", "intakeCount": 315 },
    { "academicYear": "2021/2022", "intakeCount": 330 },
    { "academicYear": "2022/2023", "intakeCount": 340 },
    { "academicYear": "2023/2024", "intakeCount": 325 },
    { "academicYear": "2024/2025", "intakeCount": 310 }
  ]
}
```

---

### `GET /api/stats/decline-trend`
Detail data untuk chart card **Penurunan Mahasiswa Baru** (5 tahun terakhir).

**Query Parameter:** `?selectedPeriode=2024/2025` (opsional, default: tahun terbaru)

**Response:**
```json
{
  "success": true,
  "data": {
    "selectedPeriod": "2024/2025",
    "declinePercentage": -5.23,
    "history": [
      { "label": "A", "academicYear": "2024/2025", "intakeCount": 310, "changeFromPrev": null },
      { "label": "B", "academicYear": "2023/2024", "intakeCount": 325, "changeFromPrev": 4.84 },
      { "label": "C", "academicYear": "2022/2023", "intakeCount": 340, "changeFromPrev": 4.62 },
      { "label": "D", "academicYear": "2021/2022", "intakeCount": 330, "changeFromPrev": -2.94 },
      { "label": "E", "academicYear": "2020/2021", "intakeCount": 315, "changeFromPrev": -4.55 }
    ],
    "formula": "avg((B-A)/A + (C-B)/B + (D-C)/C + (E-D)/D)"
  }
}
```

---

### `GET /api/stats/students`
Data tabel mahasiswa dengan filter lengkap dan **pagination**.

**Query Parameters:** Sama dengan `/summary`, ditambah:
| Parameter | Default | Keterangan |
|---|---|---|
| `page` | `1` | Nomor halaman |
| `limit` | `20` | Jumlah data per halaman |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "nim": "23001001",
      "nama": "Budi Santoso",
      "angkatan": "2023 Ganjil",
      "periodeMasuk": "20231",
      "programStudi": "Informatika",
      "fakultas": "FTIK",
      "semester": 5,
      "kewarganegaraan": "WNI",
      "statusKeaktifan": "Aktif"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1250,
    "totalPages": 63
  }
}
```

---

## ✅ TODOLIST IMPLEMENTASI BACKEND

> Dikerjakan secara berurutan dari atas ke bawah. Setiap item sudah dikelompokkan per tahap.

---

### 🔵 TAHAP 1 — Persiapan & Pemahaman Struktur

- [x] **1.1** Baca dan pahami seluruh file yang ada, terutama:
  - [`statsController.js`](file:///home/fadjri/projects/Komet/server/src/controllers/statsController.js) — controller lama yang akan direfactor
  - [`schema.prisma`](file:///home/fadjri/projects/Komet/server/prisma/schema.prisma) — struktur tabel database
  - [`helpers.js`](file:///home/fadjri/projects/Komet/server/src/controllers/sync/helpers.js) — fungsi bantu yang sudah ada

- [x] **1.2** Pastikan semua dependency sudah terinstall (`npm install`)

- [x] **1.3** Cek database berjalan dan data sudah ada dengan menjalankan sync (jika belum):
  ```bash
  curl -X POST http://localhost:3000/api/sync/students \
    -H "x-api-key: komet-secret-sync-key-2026"
  ```

- [x] **1.4** Uji endpoint lama masih berjalan dengan benar:
  ```bash
  curl http://localhost:3000/api/stats/student-dashboard \
    -H "x-api-key: komet-secret-sync-key-2026"
  ```

---

### 🟡 TAHAP 2 — Buat Service Layer (Logika Kalkulasi Modular)

Buat folder baru: `src/services/stats/`

- [x] **2.1** Buat `src/services/stats/filterBuilder.js`
- [x] **2.2** Buat `src/services/stats/filterOptions.js`
- [x] **2.3** Buat `src/services/stats/activeStudents.js`
- [x] **2.4** Buat `src/services/stats/internationalTrend.js`
- [x] **2.5** Buat `src/services/stats/intakeTrend.js`
- [x] **2.6** Buat `src/services/stats/declineTrend.js`
- [x] **2.7** Buat `src/services/stats/studentList.js`

---

### 🟠 TAHAP 3 — Refactor & Buat Controller Baru

- [x] **3.1** Buat file baru `src/controllers/statsController.js` (dispatcher ke service layer)

---

### 🟢 TAHAP 4 — Update Routes

- [x] **4.1** Update `src/routes/statsRoutes.js` untuk menambahkan semua endpoint baru
- [x] **4.2** Ganti nama/referensi controller lama (cleanup `statsController.old.js`)

---

### 🔴 TAHAP 5 — Testing Manual (Tanpa Framework)

- [x] **5.1** Jalankan server: `npm run dev`
- [x] **5.2** Test endpoint `/summary` tanpa filter
- [x] **5.3** Test endpoint `/summary` dengan filter `fakultas`
- [x] **5.4** Test endpoint `/summary` dengan multi-select `angkatan`
- [x] **5.5** Test endpoint `/summary` dengan filter `semester` multi-select
- [x] **5.6** Test endpoint detail chart per card
- [x] **5.7** Test endpoint tabel `/students` dengan pagination
- [x] **5.8** Test `/students` dengan kombinasi filter lengkap
- [x] **5.9** Verifikasi bahwa `intake` sekarang sudah benar (hanya mahasiswa semester 1)

---

### 🟣 TAHAP 6 — Validasi & Hardening

- [x] **6.1** Tambahkan validasi input di `filterBuilder.js`
- [x] **6.2** Tambahkan handling edge case di `declineTrend.js`
- [x] **6.3** Tambahkan logging di setiap service function untuk memudahkan debugging
- [x] **6.4** Pastikan `filterOptions` tidak mengembalikan nilai kosong/null
- [x] **6.5** Test edge case filter gabungan (filter yang saling bertentangan)

---

### ⚪ TAHAP 7 — Dokumentasi & Cleanup

- [x] **7.1** Hapus file `statsController.old.js` setelah yakin semua endpoint baru berjalan baik.
- [x] **7.2** Update file `requirement.md` ini untuk menandai item yang sudah selesai (ganti `- [ ]` menjadi `- [x]`).
- [x] **7.3** Buat file `.env.example` yang berisi template env variables tanpa nilai sensitif
- [x] **7.4** Tambahkan komentar di setiap file service baru yang menjelaskan fungsinya dengan singkat.
- [x] **7.5** Konfirmasi ke tim frontend struktur response JSON final untuk setiap endpoint.

---

## 🗺️ Ringkasan File yang Akan Dibuat / Diubah

| File | Status | Keterangan |
|---|---|---|
| `src/services/stats/filterBuilder.js` | 🆕 Baru | Builder filter Prisma dari query params |
| `src/services/stats/filterOptions.js` | 🆕 Baru | Opsi dropdown filter dari DB |
| `src/services/stats/activeStudents.js` | 🆕 Baru | Kalkulasi total mahasiswa aktif |
| `src/services/stats/internationalTrend.js` | 🆕 Baru | Kalkulasi tren mahasiswa WNA |
| `src/services/stats/intakeTrend.js` | 🆕 Baru | Kalkulasi intake (PERBAIKAN BUG semester=1) |
| `src/services/stats/declineTrend.js` | 🆕 Baru | Kalkulasi penurunan MB 5 tahun |
| `src/services/stats/studentList.js` | 🆕 Baru | Query tabel mahasiswa + pagination |
| `src/controllers/statsController.js` | 🔄 Refactor | Dispatcher ke service layer |
| `src/routes/statsRoutes.js` | 🔄 Update | Tambah 5 endpoint baru |
| `.env.example` | 🆕 Baru | Template environment variables |
| `requirement.md` | 🆕 Baru | Dokumen ini |

> File lain tidak perlu diubah sama sekali.
