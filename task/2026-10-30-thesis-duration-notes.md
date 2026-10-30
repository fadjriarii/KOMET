# Catatan Riset Durasi Skripsi/Tesis

- Status: catatan riset, bukan plan dan bukan fitur yang sudah disetujui.
- Dibuat: 2026-10-30
- Konteks: ada permintaan dari atasan untuk menampilkan berapa lama mahasiswa
  mengerjakan skripsi/tesis. Permintaannya masih ambigu, jadi file ini mencatat
  temuan, definisi, dan pertanyaan terbuka sebelum masuk tahap plan.
- Snapshot: KOMET `main` di `7acc42d`; data SEVIMA dibaca hanya dengan GET pada
  2026-10-30. Tidak ada kode aplikasi yang diubah.

## 1. Permintaan yang dipahami

Kemungkinan permintaan: menghitung dan menampilkan rata-rata jumlah hari yang
dipakai lulusan untuk mengerjakan skripsi/tesis, memakai tanggal mulai dan
tanggal selesai dari SEVIMA.

Yang masih belum jelas:

- Apakah metriknya tentang proses penulisan skripsi/tesis, proses administrasi
  tugas akhir, atau waktu dari proposal sampai kelulusan?
- Apakah populasi hanya lulusan, atau semua mahasiswa yang sudah mulai tugas
  akhir?
- Apakah hanya record `Selesai` yang dihitung?
- Tanggal mulai yang benar itu `tanggal_mulai`, tanggal proposal, bimbingan
  pertama, atau tanggal SK?
- Tanggal selesai yang benar itu `tanggal_selesai`, tanggal sidang, tanggal SK,
  atau tanggal kelulusan?
- Output-nya berupa kartu KPI, tabel detail, rincian per program studi, atau
  ekspor?
- Perbandingannya per tahun ajaran lulus, per periode selesai tugas akhir, atau
  satu angka keseluruhan?

Jangan mengambil keputusan produk sebelum poin-poin ini jelas.

## 2. Definisi yang dipakai dalam analisis

- **TA**: Tugas Akhir, mencakup Skripsi dan Tesis.
- **Punya TA**: NIM lulusan punya minimal satu record di SEVIMA
  `/siakadcloud/v1/tugas-akhir`. Ini belum berarti tugas akhirnya selesai.
- **Tanpa TA**: NIM lulusan tidak punya record TA yang cocok.
- **TA Selesai**: record TA yang dipilih punya `status = "Selesai"` di SEVIMA.
  Ini bukan status kelulusan kampus.
- **Lulusan relevan**: lulusan S1 atau S2. Lulusan `Profesi` dikeluarkan karena
  tidak selalu menyaratkan skripsi/tesis.
- **Durasi tanggal**: `tanggal_selesai - tanggal_mulai`, dalam hari.
- **Durasi periode**: rentang semester inklusif dari `id_periode_mulai` sampai
  `id_periode_selesai`.
- **Deduplikasi**: satu NIM bisa punya lebih dari satu record TA. Analisis
  menyimpan satu record per lulusan, dengan prioritas record yang tanggalnya
  lengkap, lalu periodenya lengkap, lalu status `Selesai`.

## 3. Sumber data dan metode

- Sumber lokal: `graduates.tahunLulus`, `graduates.jenjang`, dan
  `graduates.nim`.
- Sumber SEVIMA: `/siakadcloud/v1/tugas-akhir`, 100 baris per halaman, 1.007
  record saat snapshot: 959 Skripsi dan 48 Tesis.
- Kunci pencocokan: NIM yang dinormalisasi.
- Field yang dipakai:
  - `id_tugas_akhir`
  - `nim`
  - `jenis_tugas_akhir`
  - `status`
  - `nama_tahap`
  - `tanggal_mulai`
  - `tanggal_selesai`
  - `tanggal_pengajuan`
  - `id_periode_mulai`
  - `id_periode_selesai`
  - `tanggal_sk`
- API live sempat mengembalikan HTTP 429 saat probing. Sync berikutnya harus
  memakai delay/window pagination yang sudah ada.
- Tidak ada nama atau NIM yang dicatat di file ini.

## 4. Populasi lulusan per tahun

`graduates.tahunLulus` berisi jumlah berikut. Ada juga 5 lulusan S1 dengan
`tahunLulus` kosong; mereka dikeluarkan dari tabel di bawah. `Profesi` hanya
muncul di 2025/2026.

| Tahun Lulus |  S1 |  S2 | Profesi | Total |
| ----------- | --: | --: | ------: | ----: |
| 2017/2018   |  44 |   0 |       0 |    44 |
| 2018/2019   |  84 |   4 |       0 |    88 |
| 2019/2020   |  79 |   5 |       0 |    84 |
| 2020/2021   |  77 |   4 |       0 |    81 |
| 2021/2022   | 153 |   2 |       0 |   155 |
| 2022/2023   | 157 |   7 |       0 |   164 |
| 2023/2024   | 176 |   4 |       0 |   180 |
| 2024/2025   | 146 |  11 |       0 |   157 |
| 2025/2026   | 125 |  12 |      37 |   174 |

## 5. Cakupan TA per tahun lulus

Hitungan per lulusan unik setelah deduplikasi.

| Tahun Lulus | Lulusan relevan | Punya TA | Tanpa TA | TA `Selesai` | Tanggal lengkap | Periode lengkap |
| ----------- | --------------: | -------: | -------: | -----------: | --------------: | --------------: |
| 2017/2018   |              44 |       39 |        5 |           39 |            0/39 |           39/39 |
| 2018/2019   |              88 |       85 |        3 |           85 |            0/85 |           85/85 |
| 2019/2020   |              84 |       80 |        4 |           80 |            0/80 |           80/80 |
| 2020/2021   |              81 |       79 |        2 |           79 |            0/79 |           79/79 |
| 2021/2022   |             155 |      147 |        8 |          147 |           0/147 |         147/147 |
| 2022/2023   |             164 |       63 |      101 |           63 |            0/63 |           63/63 |
| 2023/2024   |             180 |      180 |        0 |          180 |         180/180 |         180/180 |
| 2024/2025   |             157 |      155 |        2 |          151 |          30/155 |         155/155 |
| 2025/2026   |             137 |      137 |        0 |           53 |          34/137 |          72/137 |

Catatan:

- 2025/2026 punya 37 lulusan `Profesi` tanpa TA. Ini wajar, bukan data hilang.
  Ke-137 lulusan S1/S2 yang relevan semuanya punya record TA.
- 2022/2023 adalah gap cakupan terbesar: 101 dari 164 lulusan tidak punya
  record TA di SEVIMA.
- 2023/2024 punya 6 lulusan dengan lebih dari satu record TA; 2024/2025 punya
  5; 2025/2026 punya 6. Tabel di atas sudah melakukan deduplikasi.

## 6. Mengapa durasi berbasis tanggal tidak bisa diandalkan

### 6.1 2017/2018 sampai 2022/2023

- `tanggal_mulai` dan `tanggal_selesai` praktis kosong.
- `id_periode_mulai` selalu sama dengan `id_periode_selesai`, jadi rentang
  periodenya selalu 1 semester. Itu pola pengisian data, bukan durasi yang
  diukur.
- 2022/2023 hanya punya satu `tanggal_mulai` dan nol `tanggal_selesai` dari 63
  record yang cocok.

### 6.2 2023/2024

- Tanggal lengkap untuk 180 dari 180 lulusan unik.
- Tetapi 150 dari 180 record memakai pasangan tanggal yang sama:
  `2024-02-01` sampai `2024-08-30` (211 hari).
- Ada 17 record lain yang memakai `2023-09-01` sampai `2024-08-30` (364 hari).
- Hanya 13 record yang punya pasangan tanggal lain. Median-nya 347 hari dengan
  rentang 140-940 hari.
- Jadi angka 211 hari adalah batas periode, bukan durasi penulisan skripsi.
  Angka itu tidak boleh ditampilkan sebagai rata-rata durasi tugas akhir.

### 6.3 2024/2025

- Hanya 28 dari 152 record `Selesai` yang punya kedua tanggal (18%).
- Record yang bertanggal punya pasangan tanggal bervariasi; tidak ada pasangan
  default dominan di subset `Selesai`.
- Rata-rata: 172 hari. Median: 136 hari. P25-P75: 119-166 hari. Rentang:
  84-645 hari.
- Sampelnya kecil dan mungkin bias ke record yang kebetulan terisi.

### 6.4 2025/2026

- Hanya 11 dari 54 record `Selesai` yang punya kedua tanggal (20%).
- Record yang bertanggal punya pasangan tanggal bervariasi.
- Rata-rata: 138 hari. Median: 150 hari. P25-P75: 123-157 hari. Rentang:
  52-172 hari.
- Sampelnya terlalu kecil dan terlalu baru untuk angka tahunan yang stabil.

## 7. Estimasi durasi yang tersedia

Ini estimasi, bukan rata-rata populasi.

| Populasi                                           |   n | Rata-rata | Median | P25-P75 | Rentang | Penilaian                           |
| -------------------------------------------------- | --: | --------: | -----: | ------: | ------: | ----------------------------------- |
| 2023/2024, semua `Selesai` bertanggal              | 180 |       242 |    211 | 211-211 | 140-940 | tidak valid; 167 tanggal default    |
| 2023/2024, tanggal non-default                     |  13 |       435 |    347 | 153-571 | 140-940 | terlalu kecil dan banyak outlier    |
| 2024/2025, `Selesai` bertanggal                    |  28 |       172 |    136 | 119-166 |  84-645 | tidak lengkap tetapi bervariasi     |
| 2025/2026, `Selesai` bertanggal                    |  11 |       138 |    150 | 123-157 |  52-172 | sangat kecil                        |
| Gabungan 2024/2025-2025/2026, `Selesai` bertanggal |  39 |       162 |    141 | 120-162 |  52-645 | indikasi terbaik yang tersedia      |
| Gabungan termasuk 2023/2024 non-default            |  52 |       230 |    149 | 127-195 |  52-940 | tidak disarankan; mencampur outlier |

Angka gabungan 2024/2025-2025/2026 hanya mencakup sekitar 19% dari seluruh
record `Selesai` di dua tahun tersebut. Angka ini bersifat indikasi, bukan
representatif.

## 8. Kesimpulan awal

- Tidak ada tahun lulus yang sekaligus lengkap dan valid secara makna untuk
  mengukur durasi skripsi/tesis.
- 2017/2018-2022/2023: tanggal tidak bisa dipakai; kode periode selalu sama.
- 2023/2024: field tanggal lengkap, tetapi sebagian besar tanggalnya default
  periode.
- 2024/2025 dan 2025/2026: tanggal bervariasi, tetapi cakupannya rendah dan
  sampelnya kecil.
- Rata-rata per tahun sebaiknya tidak dipublikasikan dengan data saat ini.
- Kalau harus ada angka, opsi paling aman adalah indikasi yang diberi label
  jelas: median 141 hari (rata-rata 162 hari) dari 39 record TA `Selesai` di
  2024/2025-2025/2026, dengan catatan cakupan.
- Untuk tahun-tahun historis, satu-satunya rekonstruksi yang masuk akal adalah
  dari tanggal bimbingan atau ujian, misalnya `tanggal_bimbingan` pertama dan
  terakhir dari `/bimbingan-tugas-akhir`, atau dari arsip akademik.

## 9. Opsi untuk plan berikutnya

### Opsi A: KPI ketat dan bisa dipertanggungjawabkan

- Pakai hanya record dengan kedua tanggal, `status = Selesai`, bukan pasangan
  tanggal default berulang, dan durasi yang masuk akal.
- Tampilkan per tahun hanya jika cakupan minimal 80% dan n minimal 30.
- Hasil: belum ada tahun yang memenuhi syarat. Fitur akan menampilkan state
  kosong atau "data belum lengkap".

### Opsi B: KPI gabungan yang bersifat indikasi

- Pakai record `Selesai` yang punya kedua tanggal dari 2024/2025-2025/2026.
- Tampilkan median dan rata-rata beserta n, cakupan, dan label "indikasi" yang
  eksplisit.
- Hasil: n=39, median 141 hari, rata-rata 162 hari.
- Risiko: bias seleksi dan cakupan rendah.

### Opsi C: Rekonstruksi dari data bimbingan atau ujian

- Pakai `tanggal_bimbingan` paling awal dan paling akhir per NIM sebagai proxy
  periode pengerjaan.
- Cocokkan dengan rentang semester dan status tugas akhir.
- Butuh investigasi kualitas data terpisah sebelum bisa menjadi KPI.

## 10. Pertanyaan terbuka untuk peminta fitur

1. Apa yang sebenarnya ingin diukur dengan "masa pengerjaan skripsi/tesis"?
2. Tanggal mulai yang dipakai: persetujuan proposal, bimbingan pertama, SK,
   atau `tanggal_mulai`?
3. Tanggal selesai yang dipakai: bimbingan terakhir, sidang, SK,
   `tanggal_selesai`, atau kelulusan?
4. Populasinya semua lulusan, hanya S1/S2, hanya `Selesai`, atau semua
   mahasiswa yang sudah mulai tugas akhir?
5. Apakah tugas akhir yang gagal, diulang, atau diganti ikut dihitung?
6. Output-nya per tahun lulus, per periode selesai tugas akhir, per program
   studi, atau satu angka keseluruhan?
7. Apakah harus rata-rata, atau median lebih bisa diterima karena ada outlier?
8. Kalau cakupan data rendah, UI harus bagaimana: sembunyikan angka, tampilkan
   peringatan, atau tetap tampilkan angka indikasi?
9. Apakah bagian akademik bisa menyediakan tanggal proposal/SK atau tanggal
   mulai/selesai tugas akhir yang sudah tervalidasi?
10. Apakah lulusan `Profesi` harus disebutkan sebagai pengecualian di teks
    produk?

## 11. Risiko dan catatan hati-hati

- `status = "Selesai"` di SEVIMA bisa belum diperbarui.
- `tanggal_mulai` dan `tanggal_selesai` sering berupa batas periode atau kosong.
- Cakupan tanggal yang rendah bisa membuat rata-rata bias ke record yang
  kebetulan terisi.
- Satu angka rata-rata menyembunyikan outlier besar; median dan IQR lebih aman.
- Periode historis tidak bisa dibandingkan langsung antar tahun karena kualitas
  data berubah tajam di 2023/2024.
- Gap cakupan TA 2022/2023 perlu penjelasan terpisah sebelum ditampilkan sebagai
  KPI.
- Probing SEVIMA bisa kena HTTP 429; gunakan delay pagination yang sudah ada.
