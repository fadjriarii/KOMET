# KOMET — Full-Stack Backend Integration Specification
> **Dokumen Panduan Integrasi UI-to-API & Spesifikasi Payload JSON**
> Fokus Modul: **Student Data**, **Graduate Data**, dan **MBKM Data**

Dokumen ini disusun untuk memudahkan tim pengembang backend membangun API secara manual agar 100% selaras dengan struktur penyerapan data, visualisasi chart, interaksi modal zoom, filter, serta tabel pada frontend aplikasi **KOMET**.

---

## ─── DAFTAR ISI ───
1. **Arsitektur Pengiriman & Penyerapan Data KOMET**
2. **Modul 1: Student Data (Data Mahasiswa)**
   * Penjelasan UI & Alur Kerja
   * Spesifikasi KPI Cards (`GET /api/students/kpis`)
   * Spesifikasi Detail Popups (4 Jenis Popup & Chart)
   * Spesifikasi Filter & Tabel (`GET /api/students/table`)
3. **Modul 2: Graduate Data (Data Lulusan)**
   * Penjelasan UI & Alur Kerja
   * Spesifikasi KPI Cards (`GET /api/graduates/kpis`)
   * Spesifikasi Detail Popups (4 Jenis Popup & Chart)
   * Spesifikasi Filter & Tabel (`GET /api/graduates/table`)
4. **Modul 3: MBKM Data (Data MBKM)**
   * Penjelasan UI & Alur Kerja
   * Spesifikasi KPI Cards (`GET /api/mbkm/kpis`)
   * Spesifikasi Detail Popups (4 Jenis Popup & Chart)
   * Spesifikasi Filter & Tabel (`GET /api/mbkm/table`)

---

## 1. Arsitektur Pengiriman & Penyerapan Data KOMET

Aplikasi KOMET menggunakan dua strategi penyerapan data di sisi frontend:
1. **Data Agregasi Global (KPI & Chart Popups)**: Dimuat sekali saat halaman pertama kali dibuka untuk mengisi kartu metrik utama dan grafik visualisasi detail di dalam popup modal.
2. **Daftar Tabel Terfilter & Paginasi**: Dikueri secara dinamis saat pengguna memasukkan kata kunci pencarian (*search*), mengubah pilihan filter drop-down, mengklik chip filter, atau memindahkan nomor halaman.

### Alur Flow Umum:
```
[Pengguna Membuka Tab]
         │
         ├───> [API Call 1] GET /api/.../kpis ─────────> Isi 4 Kartu Metrik Ringkasan
         ├───> [API Call 2] GET /api/.../distribution ─> Isi Struktur Data Visualisasi Popup Chart
         └───> [API Call 3] GET /api/.../table ────────> Mengisi Tabel & Filter Bawah (Default: Page 1, Limit 50)
```

---

## 2. Modul 1: Student Data (Data Mahasiswa)

### A. Penjelasan UI & Alur Kerja
Tab **Student Data** berfungsi melacak secara longitudinal kondisi mahasiswa aktif, persebaran kewarganegaraan (mahasiswa asing), tren pendaftaran mahasiswa baru (*intake*), serta indeks fluktuasi pendaftaran mahasiswa baru dalam 5 tahun terakhir.

* **4 Kartu Metrik Atas**: Menampilkan ringkasan instan. Jika kartu diklik, modal detail akan muncul dengan efek zoom dinamis dari posisi kartu yang diklik.
* **Filter Bawah**: Pengguna dapat menyaring data berdasarkan Fakultas, Program Studi, Status Keaktifan, Status Kewarganegaraan, Semester, dan Angkatan.
* **Tabel Bawah**: Menampilkan informasi tabular yang mendukung pengurutan kolom (*sorting*) dan penyeretan baris (*drag scroll*).

---

### B. JSON: KPI Cards (`GET /api/students/kpis`)
Endpoint ini mengembalikan angka akumulasi agregat yang akan dipetakan langsung pada 4 kartu metrik paling atas.

```json
{
  "success": true,
  "data": {
    "activeStudentsCount": 1284,
    "activeStudentsTrend": "+4.1% dari periode lalu",
    "foreignStudentsRate": "4.8%",
    "foreignStudentsCount": 62,
    "foreignStudentsTotalActive": 1284,
    "foreignStudentsTrend": "+12.2% YoY",
    "intakeCohortCount": 348,
    "intakeCohortTrend": "Kohort Aktif Baru",
    "intakeFluctuationAvg": "-2.4%",
    "isFluctuationPositive": false
  }
}
```

---

### C. JSON: Detail Popups & Chart

#### Popup 1: Rincian Mahasiswa Aktif
* **Trigger**: Klik kartu **Total Mahasiswa Aktif**.
* **Visualisasi**: 
  1. Grafik batang horizontal distribusi mahasiswa aktif per Program Studi.
  2. Grafik batang vertikal per Fakultas.
  3. Grafik donat (*donut chart*) per Jenjang (S1 vs S2).
* **URL**: `GET /api/students/demographics`

```json
{
  "success": true,
  "data": {
    "totalActive": 1284,
    "byProdi": [
      { "name": "Pharmacy", "count": 342, "percentage": "26.6%" },
      { "name": "Biotechnology", "count": 298, "percentage": "23.2%" },
      { "name": "Bioinformatics", "count": 210, "percentage": "16.4%" },
      { "name": "Food Science & Nutrition", "count": 184, "percentage": "14.3%" },
      { "name": "Food Technology", "count": 150, "percentage": "11.7%" },
      { "name": "Biomedicine", "count": 100, "percentage": "7.8%" }
    ],
    "byFaculty": [
      { "name": "Fakultas Farmasi & Teknologi Kesehatan", "count": 442, "percentage": "34.4%" },
      { "name": "Fakultas Life Sciences", "count": 842, "percentage": "65.6%" }
    ],
    "byJenjang": [
      { "name": "Sarjana (S1)", "count": 1184, "percentage": "92.2%" },
      { "name": "Magister (S2)", "count": 100, "percentage": "7.8%" }
    ]
  }
}
```

#### Popup 2: Persentase Mahasiswa Asing
* **Trigger**: Klik kartu **Persentase Mahasiswa Asing**.
* **Visualisasi**: Line Chart tren rasio dan jumlah mahasiswa asing selama 5 tahun terakhir.
* **URL**: `GET /api/students/foreign-trend?years=5`

```json
{
  "success": true,
  "data": [
    { "year": 2020, "count": 38, "percentage": "3.2%", "totalActive": 1180 },
    { "year": 2021, "count": 44, "percentage": "3.6%", "totalActive": 1210 },
    { "year": 2022, "count": 50, "percentage": "4.0%", "totalActive": 1240 },
    { "year": 2023, "count": 57, "percentage": "4.5%", "totalActive": 1260 },
    { "year": 2024, "count": 62, "percentage": "4.8%", "totalActive": 1284 }
  ]
}
```

#### Popup 3: Intake Mahasiswa Baru
* **Trigger**: Klik kartu **Intake Mahasiswa Baru**.
* **Visualisasi**: Area Chart tren pendaftaran mahasiswa baru per tahun masuk.
* **URL**: `GET /api/students/intake-trend?years=5`

```json
{
  "success": true,
  "data": [
    { "year": 2020, "count": 290, "percentage": "100.0%" },
    { "year": 2021, "count": 315, "percentage": "108.6%" },
    { "year": 2022, "count": 330, "percentage": "113.8%" },
    { "year": 2023, "count": 348, "percentage": "120.0%" },
    { "year": 2024, "count": 352, "percentage": "121.4%" }
  ]
}
```

#### Popup 4: Grafik Fluktuasi Intake Mahasiswa Baru
* **Trigger**: Klik kartu **Indeks Fluktuasi Intake**.
* **Visualisasi**: Bar Chart persentase naik/turun (*growth rate*) penerimaan mhs baru dibanding tahun sebelumnya.
* **URL**: `GET /api/students/intake-fluctuation?years=5`

```json
{
  "success": true,
  "data": {
    "isPositive": true,
    "intakeFluctuationAvg": "+4.9%",
    "chartData": [
      { "year": "2021", "value": 8.62, "label": "+8.6%" },
      { "year": "2022", "value": 4.76, "label": "+4.8%" },
      { "year": "2023", "value": 5.45, "label": "+5.5%" },
      { "year": "2024", "value": 1.15, "label": "+1.2%" }
    ]
  }
}
```

#### Endpoint Tambahan (Helper/Auxiliary Modul 1):
Aplikasi KOMET juga mendefinisikan rute berikut di dalam `apiClient.js` untuk kelengkapan navigasi fungsional:

##### A. Rincian Daftar Mahasiswa Aktif Terfilter (`GET /api/students/active`)
Mengembalikan daftar mentah mahasiswa dengan status "Aktif" dengan filter opsional.
* **Query Params**: `prodi`, `faculty`, `angkatan`, `jenjang`, `page`, `limit`
```json
{
  "success": true,
  "meta": { "total": 1284, "page": 1, "limit": 50, "totalPages": 26 },
  "data": [
    {
      "nim": "20230104001",
      "nama": "Andi Wijaya",
      "angkatan": 2023,
      "program_studi": "Biotechnology",
      "fakultas": "Fakultas Life Sciences",
      "status_keaktifan": "Aktif",
      "jenjang": "S1"
    }
  ]
}
```

##### B. Metrik Ringkasan Mahasiswa Asing (`GET /api/students/foreign`)
Mengembalikan ringkasan cepat status mahasiswa asing saat ini.
```json
{
  "success": true,
  "data": {
    "count": 62,
    "rate": "4.8%",
    "totalActive": 1284,
    "meetsTarget": true
  }
}
```

##### C. Ringkasan Cohort Intake Pendaftaran (`GET /api/students/intake`)
Mengembalikan data ringkasan pendaftaran kohort baru secara akumulatif.
```json
{
  "success": true,
  "data": {
    "total": 352,
    "changePercentage": "+1.15%",
    "growthDirection": "up"
  }
}
```

---

### D. JSON: Filter & Tabel (`GET /api/students/table`)
Endpoint ini menangani kueri pencarian, filter drop-down multi-pilih, pengurutan, serta paginasi tabel data utama mahasiswa.

* **Query Parameters yang Dikirim oleh Frontend**:
  * `search`: string (pencarian nama/NIM)
  * `status`: string (`Aktif`, `Lulus`, `Keluar`, `Drop Out`, dll)
  * `prodi`: string (Program Studi terpilih)
  * `faculty`: string (Fakultas terpilih)
  * `angkatan`: number (Angkatan masuk)
  * `jenjang`: string (`S1` atau `S2`)
  * `page`: number (default: `1`)
  * `limit`: number (default: `50`)
  * `sortBy`: string (default: `nama`, opsi: `nim`, `angkatan`, `semester`)
  * `sortDir`: string (`asc` atau `desc`)

```json
{
  "success": true,
  "meta": {
    "total": 1284,
    "page": 1,
    "limit": 50,
    "totalPages": 26
  },
  "data": [
    {
      "nim": "20230104001",
      "nama": "Andi Wijaya",
      "angkatan": 2023,
      "periode": "Semester Ganjil 2024/2025",
      "program_studi": "Biotechnology",
      "fakultas": "Fakultas Life Sciences",
      "semester": 3,
      "kewarganegaraan": "WNI",
      "status_keaktifan": "Aktif",
      "jenjang": "S1"
    },
    {
      "nim": "20210201015",
      "nama": "Sarah Jenkins",
      "angkatan": 2021,
      "periode": "Semester Ganjil 2024/2025",
      "program_studi": "Pharmacy",
      "fakultas": "Fakultas Farmasi & Teknologi Kesehatan",
      "semester": 7,
      "kewarganegaraan": "WNA",
      "status_keaktifan": "Aktif",
      "jenjang": "S1"
    }
  ]
}
```

---

## 3. Modul 2: Graduate Data (Data Lulusan)

### A. Penjelasan UI & Alur Kerja
Tab **Graduate Data** melacak keberhasilan akhir dari masa studi mahasiswa di institusi, meliputi akumulasi lulusan, indeks Rata-rata IPK lulusan (S1 vs S2), persentase kelulusan tepat waktu, dan rasio keberhasilan studi jangka panjang (maksimal 7 tahun).

* **4 Kartu Metrik Atas**: Menampilkan jumlah lulusan terdaftar, rata-rata IPK, % Lulus Tepat Waktu (IKU-1), dan % Keberhasilan Studi.
* **Filter Bawah**: Memungkinkan penyaringan data lulusan berdasarkan Tahun Lulus, Periode Wisuda, Fakultas, Program Studi, Jenjang, dan Predikat Kelulusan.
* **Tabel Bawah**: Menampilkan NIM, Nama, Angkatan, Program Studi, IPK Kelulusan, SKS Kelulusan, dan Predikat (Dengan Pujian/Sangat Memuaskan/Memuaskan).

---

### B. JSON: KPI Cards (`GET /api/graduates/kpis`)

```json
{
  "success": true,
  "data": {
    "totalGraduates": 842,
    "totalGraduatesTrend": "+5.8% YoY",
    "averageGpaS1": "3.58",
    "averageGpaS2": "3.72",
    "onTimeGraduationRateS1": "74.2%",
    "onTimeGraduationRateS2": "88.5%",
    "studySuccessRateS1": "94.8%",
    "studySuccessRateS2": "98.2%"
  }
}
```

---

### C. JSON: Detail Popups & Chart

#### Popup 1: Total Lulusan & Tren Tahunan
* **Trigger**: Klik kartu **Total Lulusan**.
* **Visualisasi**: 
  1. Grafik garis (*Line Chart*) tren pertambahan jumlah lulusan per tahun wisuda.
  2. Grafik batang horizontal distribusi predikat kelulusan (*Cum Laude* / *Sangat Memuaskan* / dll).
* **URL**: `GET /api/graduates/distribution`

```json
{
  "success": true,
  "data": {
    "byYear": [
      { "name": "2020", "count": 140, "percentage": "16.6%" },
      { "name": "2021", "count": 155, "percentage": "18.4%" },
      { "name": "2022", "count": 170, "percentage": "20.2%" },
      { "name": "2023", "count": 182, "percentage": "21.6%" },
      { "name": "2024", "count": 195, "percentage": "23.2%" }
    ],
    "byPredikat": [
      { "name": "Dengan Pujian (Cum Laude)", "count": 310, "percentage": "36.8%" },
      { "name": "Sangat Memuaskan", "count": 420, "percentage": "49.9%" },
      { "name": "Memuaskan", "count": 112, "percentage": "13.3%" }
    ]
  }
}
```

#### Popup 2: Analitik & Distribusi IPK Lulusan
* **Trigger**: Klik kartu **Rata-rata IPK Lulusan**.
* **Visualisasi**: 
  1. Grafik batang vertikal perbandingan IPK rata-rata antar Program Studi.
  2. Grafik batang vertikal sebaran IPK rata-rata per Fakultas.
  3. Grafik sebaran distribusi rentang kelompok IPK (*GPA Bands* / histogram).
* **URL**: `GET /api/graduates/gpa`

```json
{
  "success": true,
  "data": {
    "overall": 3.61,
    "S1": 3.58,
    "S2": 3.72,
    "byProdi": [
      { "name": "Bioinformatics", "count": 3.68 },
      { "name": "Biotechnology", "count": 3.62 },
      { "name": "Pharmacy", "count": 3.54 },
      { "name": "Food Science & Nutrition", "count": 3.60 },
      { "name": "Food Technology", "count": 3.51 },
      { "name": "Biomedicine", "count": 3.65 }
    ],
    "byFaculty": [
      { "name": "Fakultas Life Sciences", "count": 3.63 },
      { "name": "Fakultas Farmasi & Teknologi Kesehatan", "count": 3.55 }
    ],
    "bands": [
      { "name": "< 3.00", "count": 12, "percentage": "1.4%" },
      { "name": "3.00 - 3.25", "count": 68, "percentage": "8.1%" },
      { "name": "3.26 - 3.50", "count": 210, "percentage": "24.9%" },
      { "name": "3.51 - 3.75", "count": 342, "percentage": "40.6%" },
      { "name": "3.76 - 4.00", "count": 210, "percentage": "24.9%" }
    ]
  }
}
```

#### Popup 3: Analitik Kelulusan Tepat Waktu per Angkatan
* **Trigger**: Klik kartu **Lulus Tepat Waktu (IKU-1)**.
* **Visualisasi**: Line Chart tren tingkat kelulusan tepat waktu (*On-Time Graduation Rate*) per kohort/angkatan (S1 = 4 tahun, S2 = 2 tahun).
* **URL**: `GET /api/graduates/on-time?jenjang=S1&maxCohorts=6`

```json
{
  "success": true,
  "data": {
    "aggregate": {
      "rate": "74.2%",
      "numRate": 74.2,
      "totalEvaluated": 580,
      "totalOnTime": 430
    },
    "byCohort": [
      { "cohort": 2017, "total": 90, "onTime": 63, "rate": 70.0 },
      { "cohort": 2018, "total": 95, "onTime": 68, "rate": 71.6 },
      { "cohort": 2019, "total": 100, "onTime": 74, "rate": 74.0 },
      { "cohort": 2020, "total": 110, "onTime": 83, "rate": 75.5 }
    ]
  }
}
```

#### Popup 4: Analitik Keberhasilan Studi per Angkatan
* **Trigger**: Klik kartu **Rasio Keberhasilan Studi**.
* **Visualisasi**: Line Chart tingkat keberhasilan studi (*Study Success Rate*), yaitu mahasiswa lulus di bawah batas masa studi maksimal (S1 = maksimal 7 tahun).
* **URL**: `GET /api/graduates/study-success?jenjang=S1&maxCohorts=6`

```json
{
  "success": true,
  "data": {
    "aggregate": {
      "rate": "94.8%",
      "numRate": 94.8,
      "totalEvaluated": 580,
      "totalSuccess": 550
    },
    "byCohort": [
      { "cohort": 2015, "total": 85, "success": 80, "rate": 94.1 },
      { "cohort": 2016, "total": 90, "success": 85, "rate": 94.4 },
      { "cohort": 2017, "total": 90, "success": 86, "rate": 95.6 },
      { "cohort": 2018, "total": 95, "success": 91, "rate": 95.8 }
    ]
  }
}
```

---

### D. JSON: Filter & Tabel (`GET /api/graduates/table`)

* **Query Parameters yang Dikirim oleh Frontend**:
  * `search`: string (pencarian nama/NIM)
  * `prodi`: string (Program Studi terpilih)
  * `faculty`: string (Fakultas terpilih)
  * `jenjang`: string (`S1` atau `S2`)
  * `angkatan`: number (Tahun angkatan masuk)
  * `tahunLulus`: number (Tahun kelulusan wisuda)
  * `predikat`: string (Sesuai kategori pilihan predikat)
  * `page`: number (default: `1`)
  * `limit`: number (default: `50`)
  * `sortBy`: string (default: `nama`, opsi: `nim`, `ipk`, `tahun_lulus`)
  * `sortDir`: string (`asc` atau `desc`)

```json
{
  "success": true,
  "meta": {
    "total": 842,
    "page": 1,
    "limit": 50,
    "totalPages": 17
  },
  "data": [
    {
      "nim": "20200101005",
      "nama": "Farhan Alkatiri",
      "angkatan": 2020,
      "program_studi": "Pharmacy",
      "fakultas": "Fakultas Farmasi & Teknologi Kesehatan",
      "jenjang": "S1",
      "status_keaktifan": "Lulus",
      "tahun_lulus": 2024,
      "ipk": 3.82,
      "sks_lulus": 144,
      "predikat_lulus": "Dengan Pujian (Cum Laude)"
    },
    {
      "nim": "20200103022",
      "nama": "Dewi Sartika",
      "angkatan": 2020,
      "program_studi": "Bioinformatics",
      "fakultas": "Fakultas Life Sciences",
      "jenjang": "S1",
      "status_keaktifan": "Lulus",
      "tahun_lulus": 2024,
      "ipk": 3.48,
      "sks_lulus": 144,
      "predikat_lulus": "Sangat Memuaskan"
    }
  ]
}
```

---

## 4. Modul 3: MBKM Data (Data MBKM)

### A. Penjelasan UI & Alur Kerja
Tab **MBKM Data** mengukur pencapaian standar nasional Kampus Merdeka di tingkat institusi (IKU-2), yang menargetkan minimal **20.0%** dari total mahasiswa aktif senior (semester 7) berpartisipasi dalam salah satu dari 8 program BKP MBKM dan memperoleh rekognisi penuh setara 20 SKS.

* **4 Kartu Metrik Atas**: % Partisipasi MBKM vs Eligible (IKU-2 Target >= 20%), Total Aktivitas MBKM Aktif (Selesai & Evaluasi), Mahasiswa Eligible Semester 7, dan Mitra Kolaborasi MBKM.
* **Filter Bawah**: Pengguna dapat memfilter tabel berdasarkan Fakultas, Program Studi, Jenis Aktivitas MBKM, Nama Mitra, Status Aktivitas, dan Angkatan.
* **Tabel Bawah**: Detail NIM, Nama, Angkatan, Program Studi, Jenis Kegiatan, Mitra Kerja Sama, SKS Konversi, dan Status Konversi Nilai.

---

### B. JSON: KPI Cards (`GET /api/mbkm/kpis`)

```json
{
  "success": true,
  "data": {
    "totalParticipants": 76,
    "selesaiCount": 46,
    "evaluasiCount": 30,
    "berjalanCount": 22,
    "eligibleCount": 320,
    "participationRate": "23.8%",
    "participationNumRate": 23.8,
    "meetsIkuTarget": true,
    "totalMitra": 15
  }
}
```

---

### C. JSON: Detail Popups & Chart

#### Popup 1: Analisis Partisipasi MBKM vs Mahasiswa Eligible
* **Trigger**: Klik kartu **% MBKM vs Eligible**.
* **Visualisasi**: Grafik batang horizontal perbandingan jumlah aktivitas MBKM sukses di tiap Fakultas demi memastikan ketercapaian target IKU-2 di semua lini.
* **URL**: `GET /api/mbkm/analytics/rate` (Atau disatukan dalam `/api/mbkm/distribution`)

```json
{
  "success": true,
  "data": {
    "participantStats": {
      "count": 76,
      "selesaiCount": 46,
      "evaluasiCount": 30,
      "berjalanCount": 22
    },
    "eligibleCount": 320,
    "eligibleRate": {
      "percentage": "23.8%",
      "numPercentage": 23.8,
      "meetsTarget": true
    },
    "facultyData": [
      { "name": "Fakultas Life Sciences", "count": 42, "percentage": "55.3%" },
      { "name": "Fakultas Farmasi & Teknologi Kesehatan", "count": 34, "percentage": "44.7%" }
    ]
  }
}
```

#### Popup 2: Total Aktivitas MBKM Aktif (Selesai & Evaluasi)
* **Trigger**: Klik kartu **Total Aktivitas MBKM**.
* **Tampilan**: Memiliki 3 tab internal di bagian UI modal:
  * **Tab 1: Distribusi Jenis Aktivitas MBKM** (Grafik batang horizontal sebaran 8 jenis BKP).
  * **Tab 2: Sebaran per Program Studi** (Grafik batang horizontal sebaran per prodi).
  * **Tab 3: Status Verifikasi & Evaluasi** (Grafik donat *status* dokumen dan konversi).
* **URL Komprehensif**: `GET /api/mbkm/distribution`

```json
{
  "success": true,
  "data": {
    "byActivityType": [
      { "name": "Magang Bersertifikat", "count": 18, "percentage": "23.7%" },
      { "name": "Studi Independen Bersertifikat", "count": 14, "percentage": "18.4%" },
      { "name": "Riset / Penelitian Hayati", "count": 12, "percentage": "15.8%" },
      { "name": "Pertukaran Mahasiswa Merdeka (PMM)", "count": 10, "percentage": "13.2%" },
      { "name": "Proyek Kemanusiaan", "count": 8, "percentage": "10.5%" },
      { "name": "Wirausaha Merdeka", "count": 6, "percentage": "7.9%" },
      { "name": "Bina Desa / KKN Tematik", "count": 5, "percentage": "6.6%" },
      { "name": "Asistensi Mengajar", "count": 3, "percentage": "3.9%" }
    ],
    "byProdi": [
      { "name": "Bioinformatics", "count": 22, "percentage": "28.9%" },
      { "name": "Biotechnology", "count": 18, "percentage": "23.7%" },
      { "name": "Pharmacy", "count": 15, "percentage": "19.7%" },
      { "name": "Food Science & Nutrition", "count": 11, "percentage": "14.5%" },
      { "name": "Food Technology", "count": 10, "percentage": "13.2%" }
    ],
    "byFaculty": [
      { "name": "Fakultas Life Sciences", "count": 42, "percentage": "55.3%" },
      { "name": "Fakultas Farmasi & Teknologi Kesehatan", "count": 34, "percentage": "44.7%" }
    ],
    "byMitra": [
      { "name": "Badan Riset dan Inovasi Nasional (BRIN)", "count": 12, "percentage": "15.8%" },
      { "name": "PT Kalbe Farma Tbk", "count": 10, "percentage": "13.2%" },
      { "name": "PT Dexa Medica", "count": 9, "percentage": "11.8%" }
    ],
    "byStatus": [
      { "name": "Selesai", "count": 46, "percentage": "60.5%" },
      { "name": "Evaluasi", "count": 30, "percentage": "39.5%" },
      { "name": "Sedang Berjalan", "count": 22, "percentage": "22.4%" }
    ]
  }
}
```

#### Popup 3: Mahasiswa Eligible Program MBKM (Semester 7)
* **Trigger**: Klik kartu **Mahasiswa Eligible (Sem 7)**.
* **Visualisasi**: Bar Chart sebaran mahasiswa yang saat ini aktif di semester 7 per Program Studi untuk menghitung potensi serapan ketersediaan kandidat.
* **URL**: Gunakan kombinasi `GET /api/mbkm/kpis` dan properti `byProdi` pada `GET /api/mbkm/distribution`.

#### Popup 4: Jaringan Mitra Industri & Riset Kolaborasi MBKM
* **Trigger**: Klik kartu **Mitra Kolaborasi MBKM**.
* **Visualisasi**: Grafik batang horizontal 10 nama instansi mitra kerja sama teratas di mana mahasiswa paling banyak ditempatkan.
* **URL**: `GET /api/mbkm/by-mitra`

```json
{
  "success": true,
  "data": [
    { "name": "Badan Riset dan Inovasi Nasional (BRIN)", "count": 12, "percentage": "15.8%" },
    { "name": "PT Kalbe Farma Tbk", "count": 10, "percentage": "13.2%" },
    { "name": "PT Dexa Medica", "count": 9, "percentage": "11.8%" },
    { "name": "PT Paragon Technology & Innovation", "count": 8, "percentage": "10.5%" },
    { "name": "PT Bio Farma (Persero)", "count": 7, "percentage": "9.2%" },
    { "name": "National University of Singapore (NUS)", "count": 6, "percentage": "7.9%" }
  ]
}
```

#### Endpoint Tambahan (Helper/Auxiliary Modul 3):
Aplikasi KOMET juga mendefinisikan rute berikut di dalam `apiClient.js` untuk fleksibilitas modular:

##### A. Distribusi Berdasarkan Jenis Aktivitas MBKM (`GET /api/mbkm/by-activity`)
Mengembalikan sebaran data berdasarkan 8 jenis aktivitas MBKM (BKP).
```json
{
  "success": true,
  "data": [
    { "name": "Magang Bersertifikat", "count": 18, "percentage": "23.7%" },
    { "name": "Studi Independen Bersertifikat", "count": 14, "percentage": "18.4%" },
    { "name": "Riset / Penelitian Hayati", "count": 12, "percentage": "15.8%" }
  ]
}
```

##### B. Distribusi Berdasarkan Penempatan Mitra (`GET /api/mbkm/by-mitra`)
Mengembalikan sebaran data lengkap untuk seluruh penempatan mahasiswa di instansi mitra aktif.
```json
{
  "success": true,
  "data": [
    { "name": "Badan Riset dan Inovasi Nasional (BRIN)", "count": 12, "percentage": "15.8%" },
    { "name": "PT Kalbe Farma Tbk", "count": 10, "percentage": "13.2%" },
    { "name": "PT Dexa Medica", "count": 9, "percentage": "11.8%" }
  ]
}
```

---

### D. JSON: Filter & Tabel (`GET /api/mbkm/table`)

* **Query Parameters yang Dikirim oleh Frontend**:
  * `search`: string (pencarian nama/NIM)
  * `prodi`: string (Program Studi terpilih)
  * `faculty`: string (Fakultas terpilih)
  * `angkatan`: number (Angkatan masuk mahasiswa)
  * `jenisAktifitas`: string (Salah satu dari 8 tipe BKP MBKM)
  * `mitra`: string (Nama mitra instansi)
  * `statusAktifitas`: string (`Selesai` / `Evaluasi` / `Sedang Berjalan`)
  * `page`: number (default: `1`)
  * `limit`: number (default: `50`)
  * `sortBy`: string (default: `nama`, opsi: `nim`, `sks_konversi`)
  * `sortDir`: string (`asc` atau `desc`)

```json
{
  "success": true,
  "meta": {
    "total": 76,
    "page": 1,
    "limit": 50,
    "totalPages": 2
  },
  "data": [
    {
      "nim": "20210103004",
      "nama": "Aulia Fadjri",
      "angkatan": 2021,
      "semester": 7,
      "periode": "Semester Ganjil 2024/2025",
      "program_studi": "Bioinformatics",
      "fakultas": "Fakultas Life Sciences",
      "jenjang": "S1",
      "status_keaktifan": "Aktif",
      "jenis_aktifitas": "Riset / Penelitian Hayati",
      "mitra": "Badan Riset dan Inovasi Nasional (BRIN)",
      "status_aktifitas": "Selesai",
      "sks_konversi": 20
    },
    {
      "nim": "20210201018",
      "nama": "Zuhal Achmad",
      "angkatan": 2021,
      "semester": 7,
      "periode": "Semester Ganjil 2024/2025",
      "program_studi": "Pharmacy",
      "fakultas": "Fakultas Farmasi & Teknologi Kesehatan",
      "jenjang": "S1",
      "status_keaktifan": "Aktif",
      "jenis_aktifitas": "Magang Bersertifikat",
      "mitra": "PT Kalbe Farma Tbk",
      "status_aktifitas": "Evaluasi",
      "sks_konversi": 18
    }
  ]
}
```

---

## 5. Kesimpulan Penyerapan & Konsumsi Data di Frontend

Dengan memahami spesifikasi JSON di atas:
1. **Response Wrap**: Pastikan seluruh respons API dibungkus dalam properti `"success": true` dan `"data": ...`.
2. **Tabular Numerics**: Pastikan nilai numerik seperti IPK dikirim sebagai tipe data angka desimal (*double/float*) dan persentase dikirim dalam bentuk string berakhiran `%` (contoh: `"23.8%"`) guna mendukung fitur `tabular-nums` pada CSS global frontend.
3. **Optimasi Kueri SQL**: Untuk database relational (misal PostgreSQL), rancang relasi tabel antara tabel `students`, `graduates` (lulusan), `mbkm_enrollments` (aktivitas MBKM), dan `partners` (mitra) dengan indeks yang optimal pada kolom pencarian (`nim`, `nama`, `program_studi`, `angkatan`, `status`).

---
*Dokumen ini siap disalin dan dijadikan referensi utama pengerjaan backend manual Anda!*
