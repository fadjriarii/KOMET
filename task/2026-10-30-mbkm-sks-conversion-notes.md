# Catatan Konversi SKS MBKM

- Status: catatan riset, bukan plan dan bukan fitur yang sudah disetujui.
- Dibuat: 2026-10-30
- Snapshot: KOMET `main` di `7acc42d`; data SEVIMA dibaca hanya dengan GET
  pada 2026-10-30.
- Tujuan: melengkapi kolom `SKS Konversi` yang kosong pada file anomali MBKM,
  bukan menghitung total SKS kumulatif.

## 1. File yang dianalisis

- Sumber: `tmp/Data_Anomali_MBKM_Filtered_20261.xlsx`
- Ada 164 baris anomali.
- Ada 138 baris dengan `SKS Konversi` kosong.
- 138 baris tersebut punya 138 NIM unik, semuanya jenjang S1.
- File asli tidak diubah.
- Salinan hasil pengisian:
  `tmp/Data_Anomali_MBKM_Filtered_20261_plus_konversi.xlsx`

## 2. Definisi

- **`SKS Konversi`**: SKS hasil konversi untuk satu aktivitas MBKM. Ini yang
  diisi di file anomali.
- **`Total SKS`**: total SKS kumulatif yang sudah ditempuh. Ini berbeda dan
  tidak dipakai untuk mengisi `SKS Konversi`.
- **`SKS Lulus`**: total SKS yang sudah lulus. Ini juga berbeda dari
  `SKS Konversi`.

## 3. Endpoint dan field property

### 3.1 Sumber utama: mata kuliah konversi MBKM

Alur:

1. Cari aktivitas mahasiswa:
   - `GET /siakadcloud/v1/aktivitas-mbkm`
   - Filter: `f-nim`, `f-id_periode`
   - Field yang dipakai:
     - `id_aktivitas`
     - `nim`
     - `id_periode`
     - `judul_aktivitas`
2. Ambil mata kuliah konversi:
   - `GET /siakadcloud/v1/mata-kuliah-konversi-mbkm`
   - Filter: `f-id_aktivitas`
   - Field yang dipakai: **`sks_mata_kuliah`**
   - Alternatif per aktivitas:
     `GET /siakadcloud/v1/aktivitas-mbkm/{id}/mata-kuliah-konversi`
   - Jumlahkan `sks_mata_kuliah` dari semua mata kuliah konversi untuk
     `id_aktivitas` tersebut.

Endpoint ini adalah sumber paling tepat untuk `SKS Konversi` per aktivitas.

Ketersediaan pada snapshot:

| Periode     | Baris konversi |
| ----------- | -------------: |
| 20211-20231 |              0 |
| 20241       |            295 |
| 20242       |              7 |

Karena itu, untuk periode lama sumber utama ini kosong dan harus memakai
cadangan.

### 3.2 Cadangan: nilai MBKM

- `GET /siakadcloud/v1/nilai-mbkm`
- Filter: `f-nim`, `f-id_periode_nilai`
- Field yang dipakai: **`sks_mata_kuliah`**
- Cocokkan dengan:
  - `nim`
  - `id_periode_nilai`
  - `judul_aktivitas`
- Hanya pakai record dengan `is_valid = 1`.
- Jumlahkan `sks_mata_kuliah` jika satu aktivitas punya beberapa mata kuliah.

Ini yang dipakai untuk periode 20211-20231, dan sebagai cadangan jika sumber
utama kosong.

### 3.3 Cadangan total, bukan per aktivitas

Sumber berikut hanya bisa memberi total SKS, bukan SKS satu aktivitas MBKM:

- `GET /siakadcloud/v1/mahasiswa/{nim}/transkrip`
  - Field: `sks_mata_kuliah`, `is_transfer`, `is_lulus`, `is_deleted`
  - Total SKS = jumlah `sks_mata_kuliah` untuk record yang tidak deleted.
  - `is_transfer = 1` menandai SKS transfer/konversi.
- `GET /siakadcloud/v1/mahasiswa/{nim}/perwalian`
  - Field: `sks_total`, `sks_lulus`, `sks_tempuh`, `sks_semester`
  - `sks_total` = total SKS ditempuh.
  - `sks_lulus` = total SKS lulus.

Jangan pakai dua sumber ini untuk mengisi `SKS Konversi` per aktivitas.

### 3.4 Endpoint yang tidak dipakai

- `GET /siakadcloud/v1/nilai-transfer`
  - Field: `sks_mata_kuliah_diakui`, `sks_mata_kuliah_asal`
  - Ini nilai transfer, bukan konversi MBKM.
  - Untuk 5 baris yang masih kosong, tidak ada record pada periode yang sama.
  - Tidak dipakai sebagai cadangan.

## 4. Algoritma pengisian yang dipakai

1. Baca baris dengan `SKS Konversi` kosong.
2. Ambil `NIM Clean`, `Periode Aktivitas`, dan `Judul Aktivitas`.
3. Untuk periode 20241 dan 20242:
   - cari `id_aktivitas` lewat `/aktivitas-mbkm`;
   - cocokkan `judul_aktivitas`;
   - ambil `/mata-kuliah-konversi-mbkm?f-id_aktivitas=...`;
   - jumlahkan `sks_mata_kuliah`.
4. Jika sumber utama kosong, pakai `/nilai-mbkm` dengan pencocokan
   NIM + periode + judul.
5. Untuk periode 20211-20231, langsung pakai `/nilai-mbkm`.
6. Jika keduanya kosong, biarkan kosong dan beri catatan.
7. Nilai yang sudah ada di file tidak diubah.

## 5. Hasil pengisian

| Sumber                       |   Baris |
| ---------------------------- | ------: |
| Nilai asli file              |      26 |
| `/mata-kuliah-konversi-mbkm` |       4 |
| `/nilai-mbkm`                |     129 |
| Tidak ditemukan              |       5 |
| **Total**                    | **164** |

Dari 138 baris kosong:

- **133 baris berhasil diisi**.
- **5 baris tetap kosong**.

Distribusi 133 nilai yang diisi:

| SKS | Baris |
| --: | ----: |
|  20 |    78 |
|  14 |    49 |
|  13 |     3 |
|   2 |     2 |
|  32 |     1 |

- Rata-rata: **17,45 SKS**
- Minimum: **2 SKS**
- Maksimum: **32 SKS**
- Tidak ada nilai baru yang mendekati 100 SKS.

Nilai **106** dan **251** yang ada di file adalah nilai asli file, bukan hasil
pengisian. Keduanya sudah masuk kategori anomali `SKS > 40`.

## 6. 5 baris yang masih kosong

- 4 baris periode `20242`, semuanya akun lama `XX`.
- 1 baris periode `20211`.

Untuk kelimanya:

- tidak ada record `/nilai-mbkm`;
- tidak ada mata kuliah konversi di `/mata-kuliah-konversi-mbkm`;
- tidak ada record `/nilai-transfer` pada periode yang sama.

Jadi kelimanya perlu dicek manual ke akademik.

## 7. Kolom bantu di file salinan

File salinan menambahkan kolom:

- **`Sumber SKS Konversi`**

Isinya:

- `Nilai asli file`
- `SEVIMA /mata-kuliah-konversi-mbkm`
- `SEVIMA /nilai-mbkm`
- `Tidak ditemukan di /nilai-mbkm maupun /mata-kuliah-konversi-mbkm`

Kolom ini hanya untuk jejak sumber, bukan data akademik baru.

## 8. Catatan teknis

- `/mata-kuliah-konversi-mbkm` tidak punya field `nim`; harus di-join lewat
  `id_aktivitas` dari `/aktivitas-mbkm`.
- `/nilai-mbkm` adalah record nilai, bukan daftar mata kuliah konversi. Bisa
  kosong walaupun mata kuliah konversinya ada.
- Satu aktivitas bisa punya beberapa baris mata kuliah konversi; jumlahkan
  `sks_mata_kuliah` per `id_aktivitas`.
- API SEVIMA bisa mengembalikan HTTP 429; gunakan delay dan retry yang sudah
  ada.
- Dokumentasi HTML SEVIMA mencantumkan endpoint, tetapi schema response tidak
  lengkap. Field di atas diverifikasi dari response API live.
- Tidak ada NIM atau nama mahasiswa yang dicatat di file ini.

## 9. Jawaban singkat untuk pertanyaan endpoint

- **Sumber utama saat ini**:
  `GET /siakadcloud/v1/mata-kuliah-konversi-mbkm`
  dengan filter `f-id_aktivitas`, field **`sks_mata_kuliah`**.
- **Cadangan jika sumber utama kosong**:
  `GET /siakadcloud/v1/nilai-mbkm`
  dengan filter `f-nim` + `f-id_periode_nilai`, field **`sks_mata_kuliah`**.
- **Cadangan total, bukan per aktivitas**:
  `/mahasiswa/{nim}/transkrip` field `sks_mata_kuliah` dengan `is_transfer = 1`,
  atau `/mahasiswa/{nim}/perwalian` field `sks_total` / `sks_lulus`.
- **Jangan pakai** `/nilai-transfer` sebagai cadangan konversi MBKM tanpa
  validasi, karena itu nilai transfer dan tidak punya record pada 5 baris yang
  masih kosong.

## 10. Pertanyaan terbuka

1. Apakah 5 baris yang kosong harus diisi manual, atau dibiarkan sebagai
   anomali?
2. Apakah `/mata-kuliah-konversi-mbkm` bisa diandalkan untuk semua periode
   setelah 20242, atau hanya tersedia pada periode tertentu?
3. Apakah nilai `SKS Konversi` yang sudah ada di file asli berasal dari sumber
   yang sama?
4. Apakah file salinan ini akan dipakai sebagai lampiran resmi, atau hanya
   untuk verifikasi internal?
5. Apakah perlu dibuat proses sync otomatis, atau cukup pengisian manual per
   file anomali?
