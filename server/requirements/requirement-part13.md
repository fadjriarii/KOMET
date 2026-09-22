# 📐 KOMET — Requirement Part 13: Senior Backend Architecture Review & Road to Production-Ready

> **Scope Analisis:** Seluruh source code di `src/` dan `prisma/` — *tidak termasuk* file dokumentasi atau folder `requirements/`.
> **Tanggal Review:** 2026-09-21

---

## 1. Ringkasan Arsitektur & Kondisi Codebase (Executive Summary)

### 1.1 Pola Arsitektur

Komet Server mengimplementasikan **Modular Layered Architecture** dengan lapisan yang cukup jelas:

```
HTTP Request
    │
    ▼
[ Routes ]          → Mendelegasikan ke controller, menerapkan middleware
    │
    ▼
[ Controllers ]     → Orkestrasi request/response, memanggil services
    │
    ▼
[ Services ]        → Business logic, agregasi data, kalkulasi statistik
    │
    ▼
[ Prisma ORM ]      → Akses database MySQL
```

Pemisahan ini **sudah ada dan cukup konsisten** di domain `students`, `graduates`, dan `mbkm`. Domain `sync` memiliki struktur sub-folder tersendiri (`controllers/sync/`) yang juga terstruktur baik.

### 1.2 Kekuatan yang Ditemukan

| Area | Temuan Positif |
|---|---|
| **Fail-Fast Env Validation** | `envValidator.js` memvalidasi semua variabel kritis saat startup dan menghentikan proses jika tidak lengkap — praktek produksi yang sangat baik. |
| **Centralized Error Handler** | `sendError()` di `errorHandler.js` dipakai konsisten di semua controller analytics, menyembunyikan stack trace di production. |
| **Retry & Backoff Sevima API** | `sevimaApi.js` memiliki interceptor retry otomatis hingga 8x untuk HTTP 429 dan timeout — penting untuk resiliensi terhadap API eksternal. |
| **Deduplication Engine** | `studentDeduplicationService.js` menggunakan Prisma Transaction untuk re-link relasi Graduate & MBKM sebelum menghapus duplikat — mencegah data orphan. |
| **Parallel Query** | `Promise.all()` digunakan secara ekstensif di seluruh controllers & services untuk meminimalisir total waktu respons (non-blocking I/O). |
| **Modular Services** | Setiap domain memiliki file service terpisah per fungsionalitas (filterBuilder, filterOptions, list, dll.) — mudah di-maintain. |
| **Database Indexing** | Schema Prisma sudah memiliki composite index (`statusKeaktifan, semester`, `statusKeaktifan, kewarganegaraan`, `tahunLulus, jenjang`) — query utama tidak full scan. |
| **In-Memory Caching** | `getProdiFakultasMap()` di `helpers.js` menggunakan cache TTL 1 jam untuk mengurangi pemanggilan API Sevima berulang. |
| **Graceful Shutdown** | `server.js` menangani `SIGTERM`/`SIGINT` dengan menutup HTTP server dan melepas Prisma connection pool secara bersih. |
| **Sync Job Tracker** | `syncJobTracker.js` menyimpan state ke file JSON dan melakukan self-healing saat server restart di tengah proses. |

### 1.3 Penilaian Keseluruhan

Proyek ini berada pada level **"Mature Development / Pre-Production"**. Fondasi arsitektur sudah baik, namun ada beberapa celah di area keamanan (tidak ada `helmet`), konsistensi response sync, logging berbasis I/O blocking, potensi N+1 query di deduplication, dan tidak ada layer validasi input terstandarisasi. Detail temuan ada di Seksi 2.

---

## 2. Evaluasi Kritis & Area Peningkatan

### 2.1 Modularity & Separation of Concerns

**Status: BAIK — dengan satu catatan signifikan**

Pemisahan lapisan sudah benar. Namun ada satu **pelanggaran DRY yang menonjol**:

**Fungsi `resolveTargetNim()` terduplikasi di dua file berbeda:**

- `src/controllers/sync/syncGraduates.js` — baris 13–42
- `src/controllers/sync/syncMbkm.js` — baris 15–44

Kedua fungsi ini **identik secara logika** (mencari student by NIM, fallback ke NIM bersih, lalu create student baru jika tidak ditemukan) namun punya perbedaan kecil di field `extraData`. Ini adalah kandidat utama untuk diekstrak ke `helpers.js`.

```js
// MASALAH: Kode identik ada di syncGraduates.js (L13-42) DAN syncMbkm.js (L15-44)
async function resolveTargetNim(rawNim, nama, extraData) { ... }
// SOLUSI: Pindahkan ke helpers.js dengan parameter fleksibel
```

**Catatan lain:** `mbkmController.js` (233 baris) adalah controller terpanjang dan melakukan **pemanggilan `prisma` secara langsung** di fungsi `getSummary()` pada baris 17:
```js
// src/controllers/mbkmController.js L17
const prisma = require('../config/prisma');
// ...
const selectedPeriode = req.query.periode || await getDefaultPeriode(prisma);
```
`prisma` seharusnya tidak di-inject ke controller — logika untuk mencari default periode sudah ada di `filterBuilder.js` sebagai `getDefaultPeriode(prisma)`. Idealnya `getDefaultPeriode` tidak perlu menerima `prisma` sebagai argumen (cukup import langsung di dalam service itu sendiri), sehingga controller tidak perlu mengimport `prisma` sama sekali.

---

### 2.2 Zero-Error & Reliability

**Status: MEMADAI — ada 3 area risiko**

#### 🔴 Risiko 1: Unhandled Promise Rejection pada Async Background Job

Di ketiga file sync (`syncStudents.js`, `syncGraduates.js`, `syncMbkm.js`), pola async job menggunakan `setImmediate()`:

```js
// src/controllers/sync/syncStudents.js — L116-119
setImmediate(() => {
    executeSyncStudents()
        .then(() => syncJobTracker.finishJob(true))
        .catch((err) => syncJobTracker.finishJob(false, err.message));
});
```

Jika `syncJobTracker.finishJob()` sendiri melempar error, maka tidak ada handler lagi — ini menjadi **unhandled promise rejection**. Tambahkan `.catch()` terluar:

```js
// SOLUSI YANG DISARANKAN
setImmediate(() => {
    executeSyncStudents()
        .then(() => syncJobTracker.finishJob(true))
        .catch((err) => {
            logger.error('[AsyncJob] Error tidak tertangani:', err.message);
            try { syncJobTracker.finishJob(false, err.message); } catch (_) {}
        });
});
```

#### 🔴 Risiko 2: Format Error Response Tidak Konsisten pada Sync Controllers

Controller analytics menggunakan `sendError()` yang sudah terstandarisasi, tapi **sync controllers menggunakan response manual yang tidak konsisten**:

```js
// src/controllers/sync/syncStudents.js — L148-151 (bukan pakai sendError)
return res.status(500).json({
    success: false,
    error: errorMsg   // ← Pakai key "error", bukan "message"
});
```

Bandingkan dengan `errorHandler.js` yang mengembalikan `{ success: false, message: ... }`. Frontend yang mengonsumsi error message akan mendapat perilaku tidak konsisten.

#### 🟡 Risiko 3: Tidak Ada Global Handler untuk `uncaughtException`

`server.js` sudah menangani SIGTERM/SIGINT, namun tidak ada handler untuk `process.on('uncaughtException')` dan `process.on('unhandledRejection')`. Dalam production, ini bisa menyebabkan server crash tanpa log yang berarti.

```js
// Tambahkan di server.js setelah deklarasi app
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', { reason: reason?.message || reason, promise });
});
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception — Server akan dihentikan:', { error: error.message, stack: error.stack });
    process.exit(1);
});
```

#### 🟡 Risiko 4: Tidak Ada Validasi Input Terstandarisasi

Query parameters dari user (seperti `page`, `limit`, `search`, `angkatan`) diterima tanpa validasi tipe data dan format di layer controller/route. `paginationUtils.js` sudah ada proteksi dasar untuk `page`/`limit`, namun parameter lain seperti `fakultas`, `programStudi`, atau format `tahunLulus` tidak divalidasi sama sekali.

Saat ini sanitasi terbatas pada pemotongan string search:
```js
// src/services/students/filterBuilder.js — L51
const searchTerm = search.trim().substring(0, 100);
```

Tidak ada library validasi seperti **Joi** atau **Zod** yang memvalidasi seluruh shape query params secara deklaratif.

---

### 2.3 Konsistensi Kode

**Status: CUKUP BAIK — beberapa inkonsistensi minor**

#### Inkonsistensi 1: Response `data` pada `intake-trend` Controller

```js
// src/controllers/studentsController.js — L101-102
const intakeTrendData = data.rechartsData || data;
return res.status(200).json({ success: true, data, intakeTrendData });
```

`data` di sini adalah array hasil dari `getIntakeTrend()` yang juga memiliki property tambahan `rechartsData` (karena `Object.assign(trend, { rechartsData })`). Ini adalah pattern yang tidak standar — menambah property ke sebuah Array. Lebih baik kembalikan objek plain dengan struktur eksplisit:
```js
return res.status(200).json({ success: true, trend: data, rechartsData: data.rechartsData });
```

#### Inkonsistensi 2: Penamaan `getInternationalTrendDetail`

```js
// src/controllers/studentsController.js — L89
const data = await getInternationalStudentsTrend(baseFilter);
return res.status(200).json({ success: true, data });
```

`data` di sini adalah objek `{ total, byCountry, trendData }`, namun tidak di-spread. Ini berbeda dengan pola di `getActiveStudentsDetail` yang melakukan spread (`...multisector`). Konsistensi pola response perlu distandarisasi.

#### Inkonsistensi 3: `toAcademicYear()` Didefinisikan di 3 File

```
src/services/students/activeStudents.js    — L13-17
src/services/students/intakeTrend.js       — L10-14
src/services/students/internationalTrend.js — L10-14
```

Ketiga fungsi ini identik dan seharusnya ada di `academicUtils.js`.

#### Inkonsistensi 4: `calculatePredikat()` Didefinisikan di 2 File

```
src/services/graduates/graduateDistribution.js — L10-14
src/services/graduates/graduateList.js         — L9-13
```

Fungsi identik, seharusnya diekstrak ke satu utility atau constants file.

#### Inkonsistensi 5: Alias `prisma.mahasiswa`

```js
// src/config/prisma.js — L4
prisma.mahasiswa = prisma.student;
```

Alias ini tidak digunakan di mana pun dalam codebase (berdasarkan audit seluruh file), sehingga ini **dead code** yang membingungkan.

---

### 2.4 Keamanan (Security Hardening)

**Status: FUNDAMENTAL SUDAH ADA — Perlu Penguatan Signifikan**

#### 🔴 Celah 1: Tidak Ada HTTP Security Headers (`helmet`)

Tidak ada `helmet` middleware yang terpasang. Tanpa ini, response header tidak menyertakan proteksi seperti:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`

```js
// SOLUSI — Tambahkan di server.js sebelum route mounting
const helmet = require('helmet');
app.use(helmet());
```

#### 🔴 Celah 2: Rate Limiter Menggunakan In-Memory Store (Tidak Aman untuk Multi-Instance)

`express-rate-limit` secara default menggunakan MemoryStore. Di environment production dengan multiple process (PM2 cluster, Docker container scaling), counter rate limit **tidak dishare antar instance**, sehingga efektif batasnya menjadi `max * jumlah_instance`.

```js
// SOLUSI — Gunakan Redis Store atau setidaknya dokumentasikan limitasinya
const RedisStore = require('rate-limit-redis');
// atau gunakan `ioredis` sebagai store
```

#### 🟡 Celah 3: Tidak Ada Proteksi terhadap Parameter Pollution

Meskipun query parameter sudah diproses dengan `Array.isArray()`, tidak ada proteksi terhadap serangan **HTTP Parameter Pollution (HPP)**. Library `hpp` dapat mencegah duplikasi parameter yang bisa menyebabkan perilaku tidak terduga di filtering.

#### 🟡 Celah 4: API Key Perbandingan Bukan Constant-Time

```js
// src/middlewares/auth.js — L22
if (providedKey && providedKey === expectedKey) {
```

Perbandingan string biasa (`===`) rentan terhadap **timing attack** di teori. Untuk keamanan tingkat lanjut, gunakan `crypto.timingSafeEqual()`:

```js
const crypto = require('crypto');
const isValid = providedKey && crypto.timingSafeEqual(
    Buffer.from(providedKey),
    Buffer.from(expectedKey)
);
```

#### 🟢 Hal Baik yang Sudah Ada

- `ALLOWED_ORIGINS` via env untuk CORS whitelist ✅
- `SYNC_API_KEY` untuk authentication ✅
- `search.trim().substring(0, 100)` mencegah input query terlalu panjang ✅
- Error message production vs development dipisah ✅
- IP logging pada unauthorized attempt ✅

---

### 2.5 Kecepatan & Performa

**Status: ADA BOTTLENECK KRITIS DI DEDUPLICATION**

#### 🔴 Bottleneck 1: `deduplicateStudents()` — Full Table Scan + In-Memory Processing

```js
// src/services/studentDeduplicationService.js — L21
const students = await prisma.student.findMany();
```

Fungsi ini mengambil **seluruh baris tabel `students`** ke memori Node.js, lalu melakukan grouping secara in-memory. Dengan data 2488+ mahasiswa ini masih oke, namun **tidak akan skalabel** jika jumlah data tumbuh ke puluhan ribu.

Selain itu, fungsi ini dipanggil **3 kali dalam satu siklus `syncAll`**:
1. Di akhir `executeSyncStudents()` — `syncStudents.js:92`
2. Di akhir `executeSyncGraduates()` — `syncGraduates.js:145`
3. Sekali lagi di `executeSyncAll()` — `syncAll.js:17`

Deduplikasi ketiga ini adalah redundan dan membuang waktu.

```js
// src/controllers/sync/syncAll.js — L17 (panggilan ke-3 yang redundan)
const deduplicationResult = await deduplicateStudents();
```

#### 🔴 Bottleneck 2: N+1 Query Pattern di `syncGraduates.js` dan `syncMbkm.js`

```js
// src/controllers/sync/syncGraduates.js — L102-125
await processInBatches(validItems, 25, async (item) => {
    const targetNim = await resolveTargetNim(...); // ← Ini melakukan 1-2 query SELECT per item
    return prisma.graduate.upsert(...);            // ← Lalu 1 query UPSERT
});
```

Untuk setiap item dalam batch 25, `resolveTargetNim()` melakukan `findUnique` (dan kadang `create`). Artinya satu batch 25 item bisa menghasilkan hingga **75 query database** (25 findUnique + 25 findUnique fallback + 25 upsert). Ini adalah **N+1 pattern** yang klasik.

**Solusi yang Lebih Efisien:** Pra-fetch semua NIM yang ada dalam satu batch menggunakan `findMany` dengan `in` filter, lalu lakukan lookup di memori.

#### 🟡 Bottleneck 3: `filterOptions.js` (Students) — 7 Query Parallel Setiap Hit `/summary`

```js
// src/services/students/filterOptions.js — L4-12
const [fakultasRes, prodiRes, angkatanRes, semesterRes, periodeRes, kewargRes, statusRes] = await Promise.all([
    prisma.student.findMany({ select: { fakultas: true }, distinct: ['fakultas'] }),
    // ... 6 query lainnya
]);
```

7 query dijalankan setiap kali `/api/students/summary` dipanggil, meskipun data filter options tidak berubah antara request. Tidak ada **caching di level service**. Pertimbangkan TTL cache in-memory (5 menit) atau Redis untuk data filter yang relatif statis ini.

#### 🟡 Bottleneck 4: Logger Menggunakan `fs.appendFile()` di Hot Path

```js
// src/utils/logger.js — L30
fs.appendFile(filePath, message + '\n', (err) => { ... });
```

`fs.appendFile` adalah operasi I/O asinkron. Ini lebih baik dari `writeFileSync`, namun di bawah beban tinggi (banyak request bersamaan), log I/O bisa menjadi bottleneck. Solusi standar industri adalah **Winston** atau **Pino** yang menggunakan buffering dan batched writes.

---

### 2.6 Evaluasi DRY (Don't Repeat Yourself)

**Status: PERLU REFACTORING DI 4 LOKASI**

| Kode Duplikat | Lokasi | Solusi |
|---|---|---|
| `toAcademicYear()` | `activeStudents.js`, `intakeTrend.js`, `internationalTrend.js` | Pindah ke `academicUtils.js` |
| `calculatePredikat()` | `graduateDistribution.js`, `graduateList.js` | Pindah ke `src/utils/graduateUtils.js` atau `academicUtils.js` |
| `resolveTargetNim()` | `syncGraduates.js`, `syncMbkm.js` | Pindah ke `sync/helpers.js` |
| Logic build filter multi-select `Array.isArray(x) ? x : [x]` | `filterBuilder.js` students, graduates, mbkm | Ekstrak ke helper `toArray(val)` di `src/utils/queryUtils.js` |

Contoh untuk helper `toArray`:
```js
// src/utils/queryUtils.js (baru)
const toArray = (val) => val === undefined ? undefined : Array.isArray(val) ? val : [val];

// Sebelum di filterBuilder.js (3 file):
if (fakultas) where.fakultas = { in: Array.isArray(fakultas) ? fakultas : [fakultas] };
// Sesudah:
if (fakultas) where.fakultas = { in: toArray(fakultas) };
```

---

### 2.7 Standar Industri (Best Practices)

**Status: BEBERAPA AREA PERLU MODERNISASI**

#### Logger — Custom vs Standar Industri

Logger saat ini adalah **implementasi custom** (`src/utils/logger.js`) yang membangun format log sendiri dan menggunakan `fs.appendFile`. Ini fungsional namun kekurangan fitur-fitur penting:

- Tidak ada **structured logging** (JSON format) untuk parsing oleh log aggregator (Datadog, ELK, Loki)
- Tidak ada **log levels filtering** via env (misal: matikan debug log di production)
- Tidak ada **child logger** dengan context (misalnya: logger per request dengan `requestId`)
- Rotasi log hanya berupa 1 backup file — tidak ada rotasi berdasarkan tanggal

**Rekomendasi:** Ganti dengan **Winston** (mature, community-tested) atau **Pino** (lebih cepat untuk production).

#### Tidak Ada Test Suite

Tidak ditemukan satu pun test file (`*.test.js`, `*.spec.js`) atau test framework di `package.json`. Proyek ini **tidak memiliki unit test maupun integration test**. Ini adalah risiko signifikan saat refactoring atau menambahkan fitur baru.

#### Prisma Client Singleton — Minor Issue

```js
// src/config/prisma.js — L4
prisma.mahasiswa = prisma.student; // dead code, tidak dipakai
```

Selain dead code di atas, Prisma Client singleton tidak mengaktifkan logging query di development mode. Ini berguna untuk debugging:

```js
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error']
});
```

#### `syncJobTracker` — State Berbasis File, Rentan Race Condition

```js
// src/utils/syncJobTracker.js — L43 (writeFileSync — blocking I/O)
fs.writeFileSync(stateFilePath, JSON.stringify(currentState, null, 2), 'utf8');
```

`saveState()` menggunakan **`writeFileSync` yang memblokir event loop** setiap kali ada update progress. Dalam proses sinkronisasi dengan ribuan data, ini bisa dipanggil ratusan kali. Gunakan `fs.writeFile` (async) atau pertimbangkan state management berbasis in-memory saja (tanpa persistence ke file).

#### Tidak Ada API Versioning

Semua endpoint menggunakan path `/api/students/*` tanpa versi. Ketika perlu melakukan breaking change di masa depan, tidak ada mekanisme backward compatibility. Pertimbangkan prefix `/api/v1/`.

---

## 3. Actionable TODO List (Phased Implementation)

---

### 🔴 FASE 1 — Critical Fixes (Keamanan, Zero-Error, Bug Kritis)

- [x] **[SEC-01]** Install dan pasang `helmet` middleware di `server.js` untuk mengaktifkan HTTP security headers standar
  ```bash
  npm install helmet
  ```
  ```js
  // src/server.js — setelah app = express()
  app.use(require('helmet')());
  ```

- [x] **[SEC-02]** Ganti perbandingan API Key di `auth.js` dengan `crypto.timingSafeEqual()` untuk mencegah timing attack

- [x] **[REL-01]** Tambahkan handler `process.on('unhandledRejection')` dan `process.on('uncaughtException')` di `server.js` untuk mencegah server crash tanpa log

- [x] **[REL-02]** Perbaiki error response di sync controllers (`syncStudents.js`, `syncGraduates.js`, `syncMbkm.js`, `syncAll.js`) agar menggunakan `{ success: false, message: ... }` yang konsisten, bukan `{ success: false, error: ... }`

- [x] **[REL-03]** Wrap `syncJobTracker.finishJob()` di dalam blok `try/catch` tambahan di semua async job (`setImmediate`) untuk mencegah unhandled rejection jika tracker sendiri gagal

- [x] **[PERF-01]** Hilangkan pemanggilan `deduplicateStudents()` yang redundan di `syncAll.js` (baris 17) — cukup dipanggil sekali per modul saja

- [x] **[CLEAN-01]** Hapus dead code `prisma.mahasiswa = prisma.student` di `src/config/prisma.js`

---

### 🟡 FASE 2 — Refactoring & Modularity (Struktur Kode, DRY, Konsistensi)

- [x] **[DRY-01]** Ekstrak fungsi `resolveTargetNim()` dari `syncGraduates.js` dan `syncMbkm.js` ke `src/controllers/sync/helpers.js` sebagai satu fungsi generik

- [x] **[DRY-02]** Pindahkan `toAcademicYear()` yang ada di `activeStudents.js`, `intakeTrend.js`, dan `internationalTrend.js` ke `src/utils/academicUtils.js` dan update semua import

- [x] **[DRY-03]** Pindahkan `calculatePredikat()` dari `graduateDistribution.js` dan `graduateList.js` ke `src/utils/graduateUtils.js` (file baru)

- [x] **[DRY-04]** Buat `src/utils/queryUtils.js` berisi helper `toArray(val)` dan gunakan di semua `filterBuilder.js` (students, graduates, mbkm) untuk menggantikan pattern `Array.isArray(x) ? x : [x]`

- [x] **[MOD-01]** Refactor `mbkmController.js` agar tidak melakukan `require('../config/prisma')` langsung — pindahkan `getDefaultPeriode()` agar tidak perlu menerima `prisma` sebagai argumen (import langsung di dalam service)

- [x] **[MOD-02]** Standardisasi response shape untuk `getInternationalTrendDetail` agar konsisten dengan endpoint lain (spread `data` atau gunakan struktur eksplisit)

- [x] **[MOD-03]** Refactor `Object.assign(trend, { rechartsData })` di `intakeTrend.js` (baris 81) — kembalikan objek plain `{ trend, rechartsData }` daripada meng-assign property ke Array

- [x] **[VAL-01]** Install library validasi input (**Joi** atau **Zod**) dan buat schema validasi untuk seluruh query parameter di layer route (`students`, `graduates`, `mbkm`) — mencakup validasi tipe (`page`, `limit` sebagai integer positif), format string (`fakultas`, `programStudi`), dan batas panjang `search` secara deklaratif, menggantikan validasi ad-hoc yang tersebar

- [x] **[SYNC-01]** Pindahkan semua logika guard `syncJobTracker.isRunning()` ke sebuah middleware helper agar tidak duplikat di setiap sync controller

- [x] **[CACHE-01]** Tambahkan TTL in-memory cache (5 menit) di `students/filterOptions.js` dan `graduates/filterOptions.js` untuk mengurangi 7-query hit setiap `/summary` dipanggil

---

### 🟢 FASE 3 — Performance & Best Practices (Optimasi, Logging, Standar Industri)

- [x] **[PERF-02]** Refactor `deduplicateStudents()` untuk menggantikan `findMany()` full table scan dengan pendekatan batch chunk (ambil per halaman 500 baris) untuk skalabilitas jangka panjang

- [x] **[PERF-03]** Refactor `resolveTargetNim()` dalam proses batch sync untuk menggunakan pra-fetch bulk (`findMany` + in-memory Map) guna menghilangkan N+1 query pattern di `syncGraduates.js` dan `syncMbkm.js`

- [x] **[PERF-04]** Ganti `fs.writeFileSync()` di `syncJobTracker.js` (baris 43) dengan `fs.writeFile()` async + debounce untuk mencegah blocking event loop saat sinkronisasi berlangsung

- [x] **[LOG-01]** Ganti custom logger (`src/utils/logger.js`) dengan **Winston** atau **Pino**, lengkap dengan:
  - Structured JSON output untuk environment production
  - Log level filtering via `LOG_LEVEL` env variable
  - File transport dengan rotasi harian (bukan hanya size-based)
  - Console transport dengan warna untuk development

- [x] **[LOG-02]** Tambahkan request logging middleware (Morgan atau Pino-http) di `server.js` untuk mencatat setiap HTTP request dengan `method`, `path`, `statusCode`, dan `responseTime`

- [x] **[TEST-01]** Setup test framework — install **Vitest** atau **Jest** dan buat direktori `tests/` dengan struktur:
  ```
  tests/
  ├── unit/
  │   ├── utils/academicUtils.test.js
  │   ├── services/students/filterBuilder.test.js
  │   └── services/graduates/ipkTrend.test.js
  └── integration/
      └── students.api.test.js
  ```

- [x] **[TEST-02]** Tulis minimal unit test untuk fungsi-fungsi pure/utility yang sudah ada:
  - `toAcademicYear()`, `hitungSemester()`, `formatAngkatan()` di `helpers.js`
  - `calculatePredikat()` di `graduateList.js`
  - `getNewStudentDecline()` di `declineTrend.js`
  - `getPaginationParams()` di `paginationUtils.js`

- [x] **[SEC-03]** Evaluasi implementasi `rate-limit-redis` jika deployment target menggunakan PM2 cluster mode atau multiple container instance

- [x] **[SEC-04]** Install `hpp` (HTTP Parameter Pollution) middleware sebagai layer proteksi tambahan untuk query parameter manipulation

- [x] **[PRISMA-01]** Aktifkan Prisma query logging di mode development di `src/config/prisma.js`:
  ```js
  const prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error']
  });
  ```

- [x] **[API-01]** Pertimbangkan penambahan prefix versioning `/api/v1/` untuk semua endpoint guna mendukung backward compatibility di masa depan
