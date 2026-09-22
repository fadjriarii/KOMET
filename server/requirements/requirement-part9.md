# 📘 KOMET — Requirement Part 9: Full Gap Analysis & Backend-Frontend Synchronization

> Dokumen ini adalah panduan pengerjaan perbaikan backend Komet Server berdasarkan **Analisis Teknis Audit & Gap Analysis Menyeluruh** terhadap 6 kesenjangan (gaps) struktur data, rute API, dan nested properties antara Frontend (`client/`) dan Backend (`server/`).
>
> **Goal:** Menghilangkan semua kesenjangan data, menyelaraskan rute alias API, serta melengkapi respons backend agar seluruh grafik Recharts, kartu metrik (KPI), dan tooltip interaktif di frontend dapat dirender sempurna tanpa error/blank space.

---

## 🔍 HASIL AUDIT & INVESTIGASI 6 GAPS

| ID | Domain | Endpoint / Component | Deskripsi Gap | Solusi Backend |
|---|---|---|---|---|
| **Gap 1** | Student | `GET /api/students/intake-trend` (`IntakeTrendView.jsx`) | Ketiadaan breakdown semester (ganjil/genap) untuk Stacked Bar Chart. | Tambahkan `ganjil`, `ganjilPct`, `genap`, `genapPct`, `intake`, `growth` pada tiap item `rechartsData`. |
| **Gap 2** | Student | `GET /api/students/intake-fluctuation` (`IntakeFluctuationView.jsx`) | Endpoint mismatch (`/decline-trend` vs `/intake-fluctuation`) & properti root (`isPositive`, `finalAverage`, `trendBadge`, `chartData`). | Tambahkan alias rute `/api/students/intake-fluctuation` & sertakan properti `isPositive`, `finalAverage`, `trendBadge`, `chartData`. |
| **Gap 3** | Graduate | `GET /api/graduates/distribution` (`GraduateDataPage.jsx`) | Endpoint `/graduates/distribution` 404 (tidak terdaftar) & ketiadaan breakdown `byPredikat` ("Cum Laude", dll). | Buat endpoint & handler baru `GET /api/graduates/distribution` yang mengembalikan `byYear` dan `byPredikat` (`{ name, count, percentage }`). |
| **Gap 4** | Graduate | `GET /api/graduates/study-success` (`StudySuccessView.jsx`) | Parameter `?jenjang=S1/S2` dan struktur komposit `byCohort` (`{ cohort, cohortLabel, isIncomplete, rateFormatted, successCount, total, intake }`). | Tambahkan alias rute `/api/graduates/study-success` dan format respons `byCohort` komposit lengkap. |
| **Gap 5** | MBKM | `GET /api/mbkm/distribution` (`MbkmDataPage.jsx`) | Endpoint `/mbkm/distribution` 404 saat inisialisasi tab untuk detail modal. | Buat endpoint gabungan `GET /api/mbkm/distribution` yang mengembalikan `{ byActivityType, byProdi, byFaculty, byMitra, byStatus }`. |
| **Gap 6** | MBKM | `GET /api/mbkm/summary` (`MbkmDataPage.jsx`) | Nested property mismatch pada KPI (`persentaseMbkm` vs flat `kpis.totalParticipants`, `kpis.selesaiCount`, `kpis.evaluasiCount`, `kpis.berjalanCount`, `kpis.participationRate`, `kpis.eligibleCount`). | Tambahkan objek `kpis` dengan properti flat pada respons `GET /api/mbkm/summary` untuk backward & frontend compatibility. |

---

## 📋 TODOLIST PENGERJAAN PERBAIKAN BACKEND (PART 9)

---

### 🟢 TAHAP 1 — Tab Student Data Fixes (Gap 1 & Gap 2)

- [x] **1.1** **Refactor `getIntakeTrend` (`src/services/students/intakeTrend.js`) — (Gap 1)**
  - Tambahkan kalkulasi pembagian semester Ganjil (periodeMasuk akhiran '1') & Genap (periodeMasuk akhiran '2').
  - Sertakan `ganjil`, `ganjilPct`, `genap`, `genapPct`, `intake`, `growth` dalam tiap item `rechartsData`.

- [x] **1.2** **Implementasi Rute Alias `/api/students/intake-fluctuation` (`src/controllers/studentsController.js` & `src/routes/studentsRoutes.js`) — (Gap 2)**
  - Daftarkan route `GET /api/students/intake-fluctuation`.
  - Format respons agar mengembalikan: `isPositive`, `finalAverage`, `trendBadge`, dan `chartData` (`[{ year, absolutCount, deltaFormatted, deltaPercentage }]`).
  - Pertahankan rute `/api/students/decline-trend` untuk backward compatibility.

---

### 🟢 TAHAP 2 — Tab Graduate Data Fixes (Gap 3 & Gap 4)

- [x] **2.1** **Implementasi Endpoint `/api/graduates/distribution` (`src/services/graduates/graduateDistribution.js`) — (Gap 3)**
  - Buat service baru `graduateDistribution.js`.
  - Hitung `byYear` (`[{ year, count }]`) dan `byPredikat` (`[{ name: "Dengan Pujian (Cum Laude)", count, percentage }]`).
  - Tambahkan handler `getGraduateDistribution` di `graduatesController.js` & daftarkan rute `GET /api/graduates/distribution` di `graduatesRoutes.js`.

- [x] **2.2** **Implementasi Rute Alias `/api/graduates/study-success` (`src/services/graduates/keberhasilanStudi.js`) — (Gap 4)**
  - Update `keberhasilanStudi.js` agar mendukung parameter `?jenjang=S1/S2`.
  - Format respons `byCohort` komposit: `[{ cohort, cohortLabel, isIncomplete, rateFormatted, successCount, total, intake }]`.
  - Daftarkan rute `GET /api/graduates/study-success` di `graduatesRoutes.js`.

---

### 🟢 TAHAP 3 — Tab MBKM Data Fixes (Gap 5 & Gap 6)

- [x] **3.1** **Implementasi Endpoint Gabungan `/api/mbkm/distribution` (`src/controllers/mbkmController.js` & `src/routes/mbkmRoutes.js`) — (Gap 5)**
  - Buat handler `getMbkmDistributionHandler` di `mbkmController.js` yang menggabungkan seluruh analytics.
  - Kembalikan response gabungan: `{ byActivityType, byProdi, byFaculty, byMitra, byStatus }`.
  - Daftarkan rute `GET /api/mbkm/distribution` di `mbkmRoutes.js`.

- [x] **3.2** **Perbarui Response `GET /api/mbkm/summary` (`src/controllers/mbkmController.js`) — (Gap 6)**
  - Tambahkan objek `kpis` dengan properti flat:
    - `totalParticipants`
    - `selesaiCount`
    - `evaluasiCount`
    - `berjalanCount`
    - `participationRate`
    - `eligibleCount`
  - Pertahankan struktur `summary` bersarang untuk backward compatibility.

---

### 🟢 TAHAP 4 — Testing & Dokumentasi

- [x] **4.1** **Update `Documentation.md` & `readme.md`**
  - Perbarui dokumentasi API dengan rute-rute baru (`/students/intake-fluctuation`, `/graduates/distribution`, `/graduates/study-success`, `/mbkm/distribution`) dan contoh respons ter-update.

- [x] **4.2** **Pengujian via HTTP Curl**
  - Jalankan pengujian `curl` untuk memastikan seluruh 6 endpoint baru/ter-update mengembalikan HTTP 200 OK dengan payload JSON yang tepat.

- [x] **4.3** **Tandai TODOLIST Selesai dengan `[x]`**
