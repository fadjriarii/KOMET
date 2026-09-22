# 📘 KOMET — Requirement Part 12: Audit & Dokumentasi Keselarasan Fungsional 100% (Student, Graduate, & MBKM Data)

Dokumen ini berisi dokumentasi teknis dan hasil audit analisis keselarasan 100% data contract antara **Backend API Komet** (`server/`) dengan **Frontend UI Components** (`client/`) untuk 3 modul utama: **Student Data**, **Graduate Data**, dan **MBKM Data**.

---

## 1. TAB: STUDENT DATA (DATA MAHASISWA)

### A. Kebutuhan Data & Visualisasi Grafik (Detail Charts)

#### 1. Grafik Sebaran Mahasiswa Aktif (`ActiveStudentsView.jsx`)
- **Fungsi**: Memecah jumlah mahasiswa aktif berdasarkan 3 dimensi (Prodi, Fakultas, Jenjang).
- **Struktur Data Frontend**:
  - `byProdi`: Array `{ name, count, percentage }` (Program Studi, Jumlah mhs aktif, Persentase).
  - `byFaculty`: Array `{ name, count }` (Distribusi per fakultas).
  - `byJenjang`: Array `{ name, count }` (Distribusi S1 vs S2).
- **Status Audit & Backend Alignment**: **SANGAT CUKUP / TERPENUHI 100%**.
  - Endpoint `GET /api/students/active-students` di backend mengembalikan properti `byProdi`, `byFaculty`, `byJenjang`, dan `byYear` secara agregat dinamis hanya untuk mahasiswa berstatus `"Aktif"`.

#### 2. Grafik Tren Mahasiswa Asing (`ForeignStudentsView.jsx`)
- **Fungsi**: Menyajikan diagram area/garis yang melacak rasio mahasiswa asing dari angkatan ke angkatan (longitudinal trend 5+ tahun).
- **Struktur Data Frontend**:
  - Sumbu X: `cohortLabel` / `academicYear` (misal: `"2024/2025"`).
  - Nilai Utama: `percentage` / `rate` (float desimal untuk tinggi garis grafik).
  - Tooltip Detail: `foreignActive` (jumlah mhs asing absolut) dan `totalActive` (total mhs aktif).
- **Status Audit & Backend Alignment**: **TERPENUHI 100%**.
  - Endpoint `GET /api/students/international-trend` mengembalikan objek `trendData` yang memuat `academicYear`, `year`, `foreignActive`, `totalActive`, `percentage`, dan `rate`.

#### 3. Grafik Tren Penerimaan Mahasiswa Baru (`IntakeTrendView.jsx`)
- **Fungsi**: Diagram batang bertumpuk (stacked bar chart) tren penerimaan mahasiswa baru per semester registrasi (Ganjil vs Genap).
- **Struktur Data Frontend**:
  - `ganjil`: Jumlah mhs baru terdaftar di Semester Ganjil.
  - `genap`: Jumlah mhs baru terdaftar di Semester Genap.
  - `intake`: Total pendaftaran tahun itu (`ganjil` + `genap`).
  - `growth`: Persentase pertumbuhan YoY (misal: `"+5.2%"` atau `"-3.1%"`).
- **Status Audit & Backend Alignment**: **TERPENUHI 100%** *(Telah Dipulihkan di Backend)*.
  - Service `intakeTrend.js` dan endpoint `GET /api/students/intake-trend` mengelompokkan mahasiswa berdasarkan digit semester masuk (`"1"` = Ganjil, `"2"` = Genap) dan menyajikan array `rechartsData` berisi `ganjil`, `ganjilPct`, `genap`, `genapPct`, `intake`, `growth`, dan `cohortLabel`.

#### 4. Grafik Indeks Fluktuasi YoY (`IntakeFluctuationView.jsx`)
- **Fungsi**: Grafik batang/garis naik-turun pertumbuhan pendaftaran tahunan YoY.
- **Struktur Data Frontend**:
  - `chartData`: Array `{ year, absolutCount, deltaPercentage, deltaFormatted }`.
  - Supporting properties: `finalAverage`, `isPositive`, `trendBadge`.
- **Status Audit & Backend Alignment**: **TERPENUHI 100%**.
  - Endpoint `GET /api/students/decline-trend` & Rute Alias `/api/students/intake-fluctuation` mengembalikan objek bersarang `fluctuationData` beserta `chartData` dengan pecahan desimal negatif yang kompatibel dengan Recharts.

### B. Kebutuhan Filter & Tabel Data

1. **Dropdown Filter Dinamis (`GET /api/students/summary`)**:
   - Backend mengembalikan `filterOptions` yang ditarik secara dinamis dari database untuk `fakultas`, `programStudi`, `angkatan`, `semester`, `statusKeaktifan`, `kewarganegaraan`, dan `periode`.
   - Mengembalikan flat `kpis` object: `activeStudentsCount`, `foreignStudentsRate`, `foreignStudentsCount`, `intakeCohortCount`, `intakeFluctuationAvg`, `isFluctuationPositive`.
2. **Pagination & Search Tabel Mahasiswa (`GET /api/students/students`)**:
   - Pencarian `search` memeriksa kolom NIM dan nama secara case-insensitive (`contains` Prisma).
   - Mengembalikan metadata paginasi: `pagination: { total, page, limit, totalPages }`.
   - Setiap record mahasiswa menyertakan alias `snake_case`: `program_studi`, `status_keaktifan`, `periode`.

---

## 2. TAB: GRADUATE DATA (DATA LULUSAN)

### A. Kebutuhan Data & Visualisasi Grafik (Detail Charts)

#### 1. Grafik Total Lulusan Tahunan (`TotalGraduatesView.jsx`)
- **Fungsi**: Tren wisudawan per tahun akademik dipisah per jenjang studi.
- **Struktur Data Frontend**: Array `{ year, s1, s2 }` atau `{ tahunLulus, s1, s2 }`.
- **Status Audit & Backend Alignment**: **TERPENUHI 100%**.
  - Endpoint `GET /api/graduates/total-lulusan` dan `/graduates/distribution` mengembalikan tren tahunan wisudawan S1 vs S2.

#### 2. Grafik Rata-Rata IPK Lulusan (`GpaOverviewView.jsx`)
- **Fungsi**: Agregasi IPK lulusan menyeluruh (S1/S2), per Prodi, per Fakultas, dan Histogram Kelompok IPK.
- **Struktur Data Frontend**:
  - `s1Gpa` & `s2Gpa`: Rata-rata IPK keseluruhan S1 dan S2.
  - `prodiGpaData`: Array `{ name, gpaValue, count }`.
  - `facultyGpaData`: Array `{ name, gpaValue, count }`.
  - `gpaBandsData`: Histogram rentang IPK (`"< 2.75"`, `"2.75 - 3.00"`, `"3.01 - 3.50"`, `"3.51 - 3.75"`, `"3.76 - 4.00"`) berisi `{ range, count }`.
- **Status Audit & Backend Alignment**: **SANGAT LENGKAP / TERPENUHI 100%**.
  - Endpoint `GET /api/graduates/ipk-trend` mengembalikan seluruh 4 struktur data tersebut secara langsung.

#### 3. Grafik Lulus Tepat Waktu - IKU 1 (`OnTimeGraduationView.jsx`)
- **Fungsi**: Composed chart (batang bertumpuk + garis persentase) kelulusan tepat waktu per kohort angkatan.
- **Struktur Data Frontend**:
  - `cohort` / `cohortLabel` (Sumbu X, misal: `"Angkatan 2021"`).
  - `intake`: Total mahasiswa baru pada angkatan tersebut.
  - `onTimeCount`: Jumlah lulusan tepat waktu (4 thn S1 / 2 thn S2).
  - `fastCount`: Jumlah lulusan lebih cepat.
  - `lateCount`: Jumlah lulusan terlambat.
  - `rateFormatted`: String persentase (misal: `"83.3%"`).
  - `isIncomplete`: Boolean indikator jika angkatan belum menyelesaikan masa studi.
- **Status Audit & Backend Alignment**: **TERPENUHI 100%** *(Telah Dipulihkan di Backend)*.
  - Endpoint `GET /api/graduates/tepat-waktu` meng kalkulasi selisih tahun lulus dan tahun masuk mahasiswa, lalu menyajikan rincian absolut (`fastCount`, `onTimeCount`, `lateCount`, `intake`, `rateFormatted`) di `onTimeCohortData` (S1) dan `onTimeCohortDataS2` (S2).

#### 4. Grafik Keberhasilan Studi (`StudySuccessView.jsx`)
- **Fungsi**: Memetakan persentase kelulusan mahasiswa hingga batas maksimal masa studi (7 thn S1 / 4 thn S2).
- **Struktur Data Frontend**:
  - `cohortLabel` (Tahun angkatan).
  - `intake` / `total` (Total mahasiswa terdaftar pada angkatan tersebut).
  - `successCount` / `lulus` (Jumlah mahasiswa berhasil lulus ≤ 7 thn).
  - `rateFormatted` (Tingkat keberhasilan dalam string persentase).
- **Status Audit & Backend Alignment**: **TERPENUHI 100%** *(Telah Dipulihkan di Backend)*.
  - Endpoint `GET /api/graduates/keberhasilan-studi` dan rute alias `/api/graduates/study-success` mengembalikan array `successCohortData` dan `byCohort` yang memuat rincian kuantitatif absolut `successCount`, `lulus`, `total`, `intake`, dan `rateFormatted`.

### B. Kebutuhan Filter & Tabel Data

1. **Penyaringan Predikat Kelulusan (`GET /api/graduates/list`)**:
   - Filter `predikatLulus` mendukung kategori `"Dengan Pujian (Cum Laude)"`, `"Sangat Memuaskan"`, `"Memuaskan"`, dan `"Cukup"`.
   - Penentuan predikat lulusan dihitung berdasarkan IPK wisudawan (IPK ≥ 3.51 = Cum Laude, IPK ≥ 3.01 = Sangat Memuaskan, sisanya Memuaskan/Cukup).
   - Setiap record wisudawan menyertakan alias `snake_case`: `program_studi`, `tahun_lulus`, `sks_lulus`, `predikat_lulus`, `status_keaktifan`.
2. **KPI Summary Flat Object (`GET /api/graduates/summary`)**:
   - Mengembalikan objek flat `kpis`: `totalGraduates`, `onTimeGraduationRateS1`, `onTimeGraduationRateS2`, `studySuccessRateS1`, `studySuccessRateS2`, `averageGpaS1`, `averageGpaS2`.

---

## 3. TAB: MBKM DATA (DATA MBKM)

### A. Kebutuhan Data & Visualisasi Grafik (Detail Charts)

#### 1. Grafik Tingkat Partisipasi MBKM (`MbkmRateView.jsx`)
- **Fungsi**: Rasio mahasiswa aktif MBKM terhadap mhs eligible (semester 7) per Program Studi / Fakultas.
- **Struktur Data Frontend**: Array per Prodi/Fakultas berisi `{ name, count, totalEligible, rate }`.
- **Status Audit & Backend Alignment**: **TERPENUHI 100%**.
  - Endpoint `GET /api/mbkm/analytics/rate` mengembalikan persentase IKU-2, status pencapaian target IKU-2 (`"Achieved"`), dan sebaran per fakultas/prodi.

#### 2. Grafik Distribusi Aktivitas (`MbkmActiveActivitiesView.jsx`)
- **Fungsi**: Rincian kegiatan MBKM berdasarkan Jenis BKP dan Status Verifikasi.
- **Struktur Data Frontend**:
  - Sebaran BKP: `{ name, count, percentage }`.
  - Sebaran Status Verifikasi: `{ name, count, percentage }`.
- **Status Audit & Backend Alignment**: **TERPENUHI 100%**.
  - Endpoint `GET /api/mbkm/analytics/activity-distribution`, `/prodi-distribution`, dan `/status-distribution` konsisten mengembalikan pasangan kunci `name`, `count`, dan `percentage`.

#### 3. Grafik Jaringan Mitra MBKM (`MbkmPartnersView.jsx`)
- **Fungsi**: Horizontal bar chart Top N mitra penempatan MBKM.
- **Struktur Data Frontend**:
  - `mitraData`: Array `{ name, count, percentage }` di mana `name` adalah nama instansi/perusahaan mitra untuk Recharts `<YAxis dataKey="name" />`.
- **Status Audit & Backend Alignment**: **TERPENUHI 100%**.
  - Endpoint `GET /api/mbkm/analytics/mitra-distribution` mengembalikan `mitraData` dengan properti kunci `name` untuk kemudahan pemetaan sumbu grafik.

### B. Kebutuhan Filter & Tabel Data

1. **Penyaringan Kategori Status MBKM (`GET /api/mbkm/list`)**:
   - Filter query `statusAktivitas` memetakan status verifikasi internal ("Disetujui", "Selesai", "Berjalan", "Diajukan", "Ditolak", "Dibatalkan") ke dalam kategori operasional MBKM secara sinkron.
   - Setiap record MBKM menyertakan alias `snake_case`: `program_studi`, `status_keaktifan`, `jenis_kegiatan`, `aktivitas`, `bentuk_kegiatan`, `instansi`, `status_aktivitas`, `status_kegiatan`, `tahun`, `tahun_kegiatan`.
2. **KPI Summary Flat Object (`GET /api/mbkm/summary`)**:
   - Mengembalikan objek flat `kpis`: `totalParticipants`, `selesaiCount`, `evaluasiCount`, `berjalanCount`, `participationRate`, `meetsIkuTarget`, `eligibleCount`, `totalMitra`.
