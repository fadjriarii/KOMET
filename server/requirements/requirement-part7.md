# 📘 KOMET — Requirement Part 7: Audit Fixes & Response Structure Standardization

> Dokumen ini adalah panduan pengerjaan perbaikan backend Komet Server berdasarkan Hasil Audit Kompatibilitas UI Client (3 Tab Utama: Student Data, Graduate Data, dan MBKM Data).
>
> **Goal:** Menyesuaikan struktur JSON response backend agar 100% cocok dengan properti yang dibutuhkan komponen grafik Recharts, kartu metrik, dan tabel di Frontend tanpa mengubah nama rute API.

---

## 📋 TODOLIST PENGERJAAN PERBAIKAN BACKEND

---

### 🟢 TAHAP 1 — Tab Student Data Fixes

- [x] **1.1** **Refactor `GET /api/students/active-students` (`src/services/students/activeStudents.js`)**
  - Ubah response menjadi 3 struktur breakdown:
    - `byProdi`: `[{ name, count, percentage }]`
    - `byFaculty`: `[{ name, count }]`
    - `byJenjang`: `[{ name: "Sarjana (S1)", count }, { name: "Magister (S2)", count }]`

- [x] **1.2** **Refactor `GET /api/students/intake-trend` (`src/services/students/intakeTrend.js`)**
  - Hitung growth rate desimal positif/negatif.
  - Ubah response item chart menjadi: `[{ year: "2024", value: 0.15, label: "+15%" }]`.

---

### 🟢 TAHAP 2 — Tab Graduate Data Fixes

- [x] **2.1** **Refactor `GET /api/graduates/ipk-trend` (`src/services/graduates/ipkTrend.js`)**
  - Ubah properti item `byProgramStudi` dari `programStudi` -> `name` dan `avgIpk` -> `gpaValue`.
  - Tambahkan objek `s1Gpa: { average, count }` & `s2Gpa: { average, count }`.
  - Tambahkan array `facultyGpaData: [{ name, gpaValue }]`.
  - Tambahkan array `gpaBandsData: [{ range: "3.51 - 3.75", count }]`.

- [x] **2.2** **Refactor `GET /api/graduates/tepat-waktu` & `keberhasilan-studi`**
  - Update `src/services/graduates/tepatWaktu.js` & `keberhasilanStudi.js`.
  - Kembalikan array objek komposit lengkap dengan rincian angka absolut:
    `[{ cohort, cohortLabel, tahunLulusTepat, isIncomplete, rateFormatted, fastCount, onTimeCount, lateCount, intake }]`.

- [x] **2.3** **Refactor `GET /api/graduates/list` (`src/services/graduates/graduateList.js`)**
  - Tambahkan field `predikatLulus` pada setiap item data tabel:
    - IPK >= 3.51: `"Dengan Pujian (Cum Laude)"`
    - IPK 3.01 - 3.50: `"Sangat Memuaskan"`
    - IPK <= 3.00: `"Memuaskan"`

---

### 🟢 TAHAP 3 — Tab MBKM Data Fixes

- [x] **3.1** **Refactor `GET /api/mbkm/analytics/*` (`src/services/mbkm/*`)**
  - Samakan format atribut array `activityData`, `prodiData`, dan `statusData` menjadi `{ name, count }`.
  - Petakan status ke 4 kategori warna UI: `'Selesai'`, `'Evaluasi'`, `'Berjalan'`, `'Tunda'`.

- [x] **3.2** **Refactor `GET /api/mbkm/analytics/mitra-distribution` (`src/services/mbkm/mbkmMitra.js`)**
  - Ubah properti `mitra` menjadi `name` (`topMitra: [{ name, count }]`) agar dapat dibaca oleh sumbu Y Recharts (`<YAxis dataKey="name" />`).

---

### 🟢 TAHAP 4 — Dokumentasi & Verification

- [x] **4.1** **Update `Documentation.md` & `readme.md`**
  - Perbarui contoh response JSON di `Documentation.md` sesuai format baru.
- [x] **4.2** **Tandai Semua TODOLIST Selesai dengan `[x]`**
