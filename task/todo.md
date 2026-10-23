# TODO: Perbaikan judul dan deskripsi kartu KPI MBKM

- Status: selesai (2026-10-22), verifikasi otomatis dan cek visual lulus.
- Dibuat: 2026-10-22
- Cakupan: empat kartu KPI di tab MBKM Data saja. Students dan Graduates
  tidak disentuh.

## Tujuan

Judul dan subtitle setiap kartu harus menjelaskan data yang sedang
dipresentasikan, baik saat tanpa filter maupun saat filter aktif.

## Analisis perilaku filter (2026/2027)

Baseline: **121 partisipan, 130 eligible, 93,08%, 75 mitra**. Kartu menampilkan
persentase dengan satu desimal (93,1%).

`ON` berarti badge `Terfilter` muncul. `off` berarti badge tidak muncul.
Badge ON tidak berarti angka berubah; badge hanya menandai bahwa ada filter
aktif di scope kartu.

| Filter aktif                               | Partisipan                   | Eligible              | Persentase                       | Mitra                 |
| ------------------------------------------ | ---------------------------- | --------------------- | -------------------------------- | --------------------- |
| Pencarian                                  | ON, pembilang turun          | off, tetap            | ON, pembilang turun              | off, tetap            |
| Fakultas                                   | ON, turun                    | ON, turun             | ON, pembilang dan penyebut turun | off, tetap            |
| Prodi                                      | ON, turun                    | ON, turun             | ON, pembilang dan penyebut turun | off, tetap            |
| Angkatan                                   | ON, sama atau 0              | ON, sama atau 0       | ON, sama atau 0                  | off, tetap            |
| Status aktif (Disetujui/Selesai/Diajukan)  | ON, bisa sama, turun, atau 0 | off, tetap            | ON, pembilang berubah            | off, tetap            |
| Hanya status nonaktif (Ditolak/Dibatalkan) | ON, selalu 0                 | off, tetap            | ON, selalu 0                     | off, tetap            |
| Periode                                    | ON, berubah atau sama        | ON, berubah atau sama | ON, berubah atau sama            | ON, berubah atau sama |
| Tahun ajaran berubah                       | ON, berubah                  | ON, berubah           | ON, berubah                      | ON, berubah           |

Aturan kombinasi:

- Badge = OR: kartu menyala bila minimal satu filter aktif ada di scope-nya.
- Angka = AND: hanya filter yang masuk scope yang mempersempit angka.
- Partisipan dan Persentase selalu menyala begitu ada filter aktif.
- Eligible butuh minimal satu filter populasi (fakultas, prodi, angkatan,
  periode, tahun ajaran).
- Mitra hanya butuh periode atau tahun ajaran.

| Kombinasi                       | P   | E   | R   | M                                            |
| ------------------------------- | --- | --- | --- | -------------------------------------------- |
| Pencarian saja atau status saja | ON  | off | ON  | off                                          |
| Fakultas/prodi/angkatan saja    | ON  | ON  | ON  | off                                          |
| Pencarian/status + fakultas     | ON  | ON  | ON  | off                                          |
| Pencarian + status              | ON  | off | ON  | off                                          |
| Apa pun + periode/tahun ajaran  | ON  | ON  | ON  | ON                                           |
| Semua filter aktif              | ON  | ON  | ON  | ON, tetapi hanya periode yang mengubah angka |

Bukti angka dari data 2026/2027. Badge ditulis `P/E/R/M`.

| Skenario                             | Partisipan | Eligible |   Rate | Mitra | Badge           |
| ------------------------------------ | ---------: | -------: | -----: | ----: | --------------- |
| Baseline                             |        121 |      130 | 93,08% |    75 | off/off/off/off |
| Pencarian `"a"`                      |        116 |      130 | 89,23% |    75 | on/off/on/off   |
| Fakultas Ilmu Kesehatan dan Biosains |        108 |      117 | 92,31% |    75 | on/on/on/off    |
| Prodi Bio Teknologi                  |         38 |       38 |   100% |    75 | on/on/on/off    |
| Angkatan 2023/2024                   |        121 |      130 | 93,08% |    75 | on/on/on/off    |
| Angkatan 2022/2023                   |          0 |        0 |      - |    75 | on/on/on/off    |
| Status Disetujui                     |        121 |      130 | 93,08% |    75 | on/off/on/off   |
| Status Selesai                       |          0 |      130 |     0% |    75 | on/off/on/off   |
| Status Ditolak                       |          0 |      130 |     0% |    75 | on/off/on/off   |
| Periode 20261 (Ganjil)               |        121 |      130 | 93,08% |    75 | on/on/on/on     |
| Periode 20262 (Genap)                |          0 |        0 |      - |     0 | on/on/on/on     |
| Fakultas + pencarian                 |        104 |      117 | 88,89% |    75 | on/on/on/off    |
| Fakultas + status Selesai            |          0 |      117 |     0% |    75 | on/on/on/off    |
| Fakultas + periode Ganjil            |        108 |      117 | 92,31% |    75 | on/on/on/on     |
| Pencarian + status Disetujui         |        116 |      130 | 89,23% |    75 | on/off/on/off   |
| Fakultas + prodi + angkatan          |         38 |       38 |   100% |    75 | on/on/on/off    |

Temuan:

- Mitra hanya berubah karena periode/tahun ajaran. Pada semua filter lain,
  angkanya tetap 75.
- Mitra memakai populasi berbeda: 75 = semua aktivitas, 74 = kohort eligible,
  72 = semua mahasiswa dengan status aktif, 71 = kohort eligible dengan status
  aktif. Artinya 75 memuat 3 mitra yang hanya muncul dari aktivitas
  Ditolak/Dibatalkan dan 1 mitra dari mahasiswa di luar kohort.
- Eligible dan penyebut Persentase tidak berubah karena pencarian atau status.
- Angkatan bersifat semua-atau-kosong untuk kartu: 2023/2024 menghasilkan
  121/130, tujuh opsi lain menghasilkan 0/0.
- Status Ditolak/Dibatalkan selalu 0 untuk Partisipan dan Persentase karena
  server mengiris status dengan `MBKM_ACTIVE_STATUSES`.
- Status Selesai 0 di 2026/2027 karena tahun itu tidak punya aktivitas Selesai.
- Periode Genap 2026/2027 kosong karena data hanya ada di Ganjil.
- Badge ON tetapi angka sama terlihat pada angkatan 2023/2024, status
  Disetujui, dan periode Ganjil.

## Keputusan final

- Mitra tetap periode-level dan memakai semua aktivitas, semua status, dan
  semua mahasiswa. Angka 75 tidak berubah dan tidak ada perubahan server.
  Subtitle menyebut "periode ini" dan "tidak terpengaruh filter lain".
- Status nonaktif (Ditolak/Dibatalkan) tetap tersedia untuk tabel, tetapi kartu
  Partisipan dan Persentase menampilkan catatan bahwa status itu tidak dihitung
  sebagai peserta.
- Angkatan tetap tersedia untuk tabel. Saat angkatan aktif dan `eligibleCount`
  0, kartu Partisipan/Eligible/Persentase menampilkan catatan bahwa tidak ada
  mahasiswa semester 7 pada angkatan itu.
- Tidak ada perubahan pada agregasi server atau `kpiFilterScope`.

## Masalah teks saat ini

| Kartu      | Judul sekarang     | Subtitle sekarang                                       | Masalah                                                                            |
| ---------- | ------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Partisipan | `Total Partisipan` | `Selesai: 0 • Berjalan: 121`                            | Angka status dihitung per aktivitas, nilai kartu dihitung per mahasiswa unik       |
| Eligible   | `Eligible`         | `Semester 7 Status Aktif`                               | Tidak menyebut periode dan syaratnya                                               |
| Persentase | `Persentase MBKM`  | `121 dari 130 mahasiswa aktif semester 7 · 20261–20262` | Kode periode mentah, bukan bahasa manusia                                          |
| Mitra      | `Mitra`            | `Mitra unik periode 20261–20262`                        | Tidak menjelaskan bahwa filter fakultas/prodi/angkatan/status tidak memengaruhinya |

## Judul baru

Judul tidak berubah saat filter aktif. Status terfilter sudah ditandai badge
`Terfilter` di footer kartu.

| Kartu      | Judul baru               |
| ---------- | ------------------------ |
| Partisipan | `Partisipan MBKM`        |
| Eligible   | `Mahasiswa Eligible`     |
| Persentase | `Persentase Partisipasi` |
| Mitra      | `Mitra MBKM`             |

## Format periode

Ambil dari `summaryData.selectedPeriods`, bukan dari `filterValues.tahunAjaran`.

- Dua periode: `Tahun Ajaran 2026/2027`.
- Satu periode: `Ganjil 2026/2027` atau `Genap 2026/2027`. Label diambil dari
  `summaryData.filterOptions.periodeOptions`.
- Tidak ada periode: bagian periode dihilangkan.

## Aturan subtitle per kartu

Aturan filter mengikuti `kpiFilterScope` dari server:

- `totalParticipants` dan `rate`: semua filter aktivitas.
- `eligible`: fakultas, prodi, angkatan, jenjang, periode, tahun ajaran. Bukan
  pencarian dan bukan status aktivitas. `jenjang` masih ada di scope server
  tetapi sudah tidak ada di UI MBKM.
- `mitra`: periode dan tahun ajaran saja.

### Partisipan MBKM

```
Mahasiswa semester 7 dengan aktivitas MBKM aktif{scope} · {periode}{pencarian}{catatan status}{catatan angkatan}
```

- `scope`: fakultas, prodi, angkatan, dan status yang dipilih.
- `pencarian`: ` · pencarian "ani"` bila ada, dipotong 24 karakter.
- `catatan status`: ` · Ditolak/Dibatalkan tidak dihitung sebagai peserta` bila
  status yang dipilih memuat `Ditolak` atau `Dibatalkan`.
- `catatan angkatan`: ` · tidak ada mahasiswa semester 7 pada angkatan ini`
  bila `selectedAngkatan` aktif dan `eligibleCount === 0`.
- Tanpa filter: `Mahasiswa semester 7 dengan aktivitas MBKM aktif · Tahun Ajaran 2026/2027`
- Dengan fakultas: `... aktif · Fakultas FST · Tahun Ajaran 2026/2027`
- Dengan status Ditolak: `... aktif · Status Ditolak · Tahun Ajaran 2026/2027 · Ditolak/Dibatalkan tidak dihitung sebagai peserta`
- Dengan angkatan kosong: `... aktif · Angkatan 2022/2023 · Tahun Ajaran 2026/2027 · tidak ada mahasiswa semester 7 pada angkatan ini`

### Mahasiswa Eligible

```
Mahasiswa aktif pada semester 7{scope populasi} · {periode}{catatan}{catatan angkatan}
```

- `scope populasi`: fakultas, prodi, angkatan. Status dan pencarian tidak masuk.
- `catatan`: hanya bila pencarian atau status aktif.
  - ` · pencarian tidak mengubah angka ini`
  - ` · status aktivitas tidak mengubah angka ini`
  - ` · pencarian dan status aktivitas tidak mengubah angka ini`
- `catatan angkatan`: ` · tidak ada mahasiswa semester 7 pada angkatan ini`
  bila `selectedAngkatan` aktif dan `eligibleCount === 0`.
- Tanpa filter: `Mahasiswa aktif pada semester 7 · Tahun Ajaran 2026/2027`
- Dengan angkatan kosong: `Mahasiswa aktif pada semester 7 · Angkatan 2022/2023 · Tahun Ajaran 2026/2027 · tidak ada mahasiswa semester 7 pada angkatan ini`

### Persentase Partisipasi

```
{peserta} peserta{catatan pembilang} dari {eligible} mahasiswa eligible{scope populasi} · {periode}{catatan status}{catatan angkatan}
```

- `catatan pembilang`: hanya bila pencarian atau status aktif, karena keduanya
  hanya mempersempit pembilang.
  - ` (pencarian "ani")`
  - ` (Status Selesai)`
  - ` (pencarian "ani", Status Selesai)`
- `catatan status`: ` · Ditolak/Dibatalkan tidak dihitung sebagai peserta` bila
  status yang dipilih memuat `Ditolak` atau `Dibatalkan`.
- `catatan angkatan`: ` · tidak ada mahasiswa semester 7 pada angkatan ini`
  bila `selectedAngkatan` aktif dan `eligibleCount === 0`.
- Tanpa filter: `121 peserta dari 130 mahasiswa eligible · Tahun Ajaran 2026/2027`
- Dengan status Ditolak: `0 peserta (Status Ditolak) dari 130 mahasiswa eligible · Tahun Ajaran 2026/2027 · Ditolak/Dibatalkan tidak dihitung sebagai peserta`

### Mitra MBKM

```
Mitra unik dari seluruh aktivitas periode ini · {periode}{catatan}
```

- `catatan`: ` · tidak terpengaruh filter lain` bila ada filter selain periode
  dan tahun ajaran yang aktif.
- Tanpa filter: `Mitra unik dari seluruh aktivitas periode ini · Tahun Ajaran 2026/2027`
- Dengan fakultas: `... periode ini · Tahun Ajaran 2026/2027 · tidak terpengaruh filter lain`
- Angka tetap 75 karena kartu ini memakai semua aktivitas pada periode, semua
  status, dan semua mahasiswa. Tidak ada perubahan server.

## Penulisan nama filter

- Satu nilai: tulis namanya. Contoh `Fakultas FST`, `Prodi Ilmu Komputer`,
  `Angkatan 2021/2022`, `Status Disetujui`.
- Lebih dari satu nilai: pakai bentuk ringkas `Fakultas terpilih`,
  `Prodi terpilih`, `Angkatan terpilih`, `Status terpilih`.
- Gabungkan beberapa bagian dengan `·`.

## Task implementasi

- [x] Perbarui `useMbkmKpiDisplay.js` agar menerima `filterValues` dan menyusun
      label periode dari `selectedPeriods`.
- [x] Ganti empat judul kartu di `MbkmPage.jsx`.
- [x] Tambahkan catatan status nonaktif pada Partisipan dan Persentase.
- [x] Tambahkan catatan angkatan kosong pada Partisipan, Eligible, dan
      Persentase.
- [x] Ubah subtitle Mitra menjadi `Mitra unik dari seluruh aktivitas periode ini`
      dan tambahkan catatan `tidak terpengaruh filter lain`.
- [x] Tambahkan test hook untuk tanpa filter, fakultas, pencarian, status
      Ditolak, angkatan kosong, dan Mitra saat fakultas aktif.
- [x] Perbarui test judul kartu MBKM dan tambahkan kasus badge untuk pencarian,
      status, dan angkatan.
- [x] Perbarui `CHANGELOG.md` di bagian `Unreleased`.
- [x] Jalankan verifikasi otomatis dan cek visual di `/mbkm`.

## File yang diubah

1. `apps/client/src/modules/mbkm/hooks/useMbkmKpiDisplay.js`
   - Tambah parameter ketiga `filterValues`.
   - Bentuk label periode dari `selectedPeriods` dan `periodeOptions`.
   - Susun subtitle per kartu sesuai aturan di atas.
   - Tambahkan catatan status nonaktif dan angkatan kosong.
2. `apps/client/src/modules/mbkm/pages/MbkmPage.jsx`
   - Ganti empat `title` pada `buildCards`.
3. `apps/client/tests/kpiDisplayHooks.test.js`
   - Blok baru `useMbkmKpiDisplay`:
     - tanpa filter,
     - filter fakultas,
     - pencarian saja,
     - status Ditolak,
     - angkatan kosong,
     - Mitra saat fakultas aktif.
4. `apps/client/tests/dashboardPages.test.jsx`
   - Perbarui ekspektasi judul kartu MBKM.
   - Tambahkan kasus badge untuk `search`, `statusAktivitas`, dan `angkatan`
     pada `filterCases` MBKM.
5. `CHANGELOG.md`
   - Satu baris di `Unreleased` pada bagian `Changed`.

## Verifikasi

- `pnpm --filter @komet/client test`
- `pnpm lint`
- `pnpm format:check`
- `pnpm build` atau `pnpm verify`
- Playwright di `/mbkm`:
  - tanpa filter,
  - dengan `?faculty=Ilmu%20Kesehatan%20dan%20Biosains` (nilai opsi sebenarnya;
    `FST` bukan nilai data dan menghasilkan 0),
  - pastikan subtitle tidak terpotong dan tinggi keempat kartu tetap sejajar.

## Di luar cakupan

- Tidak mengubah agregasi atau angka dari server.
- Mitra tetap periode-level dan memakai semua aktivitas, semua status, dan
  semua mahasiswa. Kartu ini tidak diubah agar mengikuti fakultas/prodi/
  angkatan/status/pencarian.
- Opsi status dan angkatan tetap tersedia karena tabel masih membutuhkannya.
  Kartu hanya menjelaskan mengapa angkanya 0.
- Tidak membuat opsi periode menjadi data-driven. Genap yang kosong tetap
  ditampilkan sebagai 0 atau `-`.
- Tidak menambahkan kembali rincian `Selesai/Berjalan` ke subtitle. Rincian
  status per aktivitas tetap ada di modal rincian.
- Tidak mengubah kartu Students atau Graduates.

## Catatan risiko

- Empat kartu tetap mengukur populasi yang berbeda. Copy membuat perbedaan itu
  jujur, tetapi tidak menyamakan populasinya.
- Angka bukti berasal dari database dev 2026/2027. Tahun lain bisa berbeda,
  terutama untuk status dan angkatan.
- Badge `Terfilter` menandai scope filter, bukan perubahan angka. Kartu bisa
  menyala walaupun nilainya sama.
- Catatan angkatan dipicu oleh `eligibleCount === 0`. Jika periode yang dipilih
  juga kosong, angka 0 bisa berasal dari periode, bukan dari angkatan.
