# 📘 KOMET — Requirement Part 8: Foreign Students Longitudinal Trend Fix (ForeignStudentsView.jsx)

> Dokumen ini adalah panduan pengerjaan & perbaikan backend Komet Server khusus untuk menyempurnakan endpoint **`GET /api/students/international-trend`** agar dapat mendukung visualisasi Recharts pada komponen **`ForeignStudentsView.jsx`**.
>
> **Goal:** Memperluas respons backend agar mengembalikan data tren longitudinal multi-tahun (`trendData`) yang memuat `cohortLabel` / `academicYear`, `year`, `foreignActive` (`wnaActiveCount`), `totalActive` (`totalActiveCount`), `percentage`, `rate`, serta breakdown `byCountry`.

---

## 📋 TODOLIST PENGERJAAN PERBAIKAN BACKEND (PART 8)

---

### 🟢 TAHAP 1 — Refactor Service & Controller Backend

- [x] **1.1** **Refactor Service `getInternationalStudentsTrend` (`src/services/students/internationalTrend.js`)**
  - Perluas kalkulasi agar selain menghitung sebaran per negara (`byCountry`), juga menghasilkan array `trendData` longitudinal multi-tahun.
  - Setiap objek dalam `trendData` menyertakan properti standar Recharts (`academicYear`, `cohortLabel`, `year`, `foreignActive`, `totalActive`, `percentage`, `rate`).

- [x] **1.2** **Refactor Controller `getInternationalTrendDetail` (`src/controllers/studentsController.js`)**
  - Gabungkan total mahasiswa asing aktif (`total`), sebaran per negara (`byCountry`), dan tren longitudinal multi-tahun (`trendData`) ke dalam objek respons `data`.

---

### 🟢 TAHAP 2 — Dokumentasi & Verification

- [x] **2.1** **Update Dokumentasi API pada `Documentation.md`**
  - Perbarui contoh response JSON pada seksi `GET /api/students/international-trend` di `Documentation.md`.

- [x] **2.2** **Pengujian Endpoint via Curl**
  - Jalankan pengujian request HTTP `GET /api/students/international-trend` dan verifikasi kelengkapan struktur data `trendData`.

- [x] **2.3** **Tandai TODOLIST Selesai `[x]`**
