# TODO: Presentasi data Student Data saat filter tunggal dan kombinasi

- Status: Fase 0–2 selesai (2026-10-26); Fase 3–4 belum.
- Dibuat: 2026-10-26
- Cakupan: card KPI, popup "Lihat Rincian", dan endpoint rincian di tab
  Student Data. Graduates dan MBKM tidak disentuh.

## Tujuan

Halaman Student Data (`apps/client/src/modules/students`) sudah benar dalam kondisi default, tetapi
**rincian (popup "Lihat Rincian") tidak berubah bentuk saat filter dipakai** — hanya angkanya yang
menyempit. Contoh nyata: pilih 1–2 prodi + Status "Semua Status" → popup Total Mahasiswa tetap
tab Per Fakultas / Per Program Studi / Per Jenjang, sehingga hanya muncul 1–2 batang prodi dan
**tidak ada rincian Aktif / Lulus / Cuti / Keluar / DO**. Tidak ada endpoint yang mengembalikan
breakdown per status (`activeStudents.js` hanya `groupBy` prodi/fakultas/jenjang).

Keputusan user (sudah dikonfirmasi):

- Status ≠ satu pilihan (Semua / 2+) → tab **Per Status** jadi default + tab lain jadi **bar bertumpuk per status**.
- Tab yang isinya ≤ 1 batang **disembunyikan otomatis**, diganti dimensi lain.
- Intake & Penurunan: diserahkan ke saya → ditambah **Per Program Studi** dan (Intake) **Status Saat Ini angkatan**.

## Hasil analisis kondisi sekarang

### Filter (sumber: `hooks/useStudentFilters.js`, server `services/students/filterOptions.js`)

| Filter                | Param server      | Tipe                  | Default                                             |
| --------------------- | ----------------- | --------------------- | --------------------------------------------------- |
| Tahun Ajaran (header) | `tahunAjaran`     | single                | **`getCurrentAcademicYear()` — melanggar ADR 0001** |
| Cari Mahasiswa        | `search`          | teks                  | –                                                   |
| Fakultas              | `fakultas`        | multi                 | –                                                   |
| Program Studi         | `programStudi`    | multi                 | –                                                   |
| Jenjang               | `jenjang`         | multi                 | –                                                   |
| Angkatan              | `angkatanTahun`   | multi                 | –                                                   |
| Semester              | `semester`        | multi (`9+`)          | –                                                   |
| Kewarganegaraan       | `kewarganegaraan` | single WNI/WNA        | –                                                   |
| Status Keaktifan      | `statusKeaktifan` | multi, kosong = `ALL` | `Aktif`                                             |
| Periode Masuk         | `periodeMasuk`    | single Ganjil/Genap   | –                                                   |

### Cakupan filter per card (sumber: `services/students/kpiScopes.js`)

| Filter                                   | Total Mhs | Internasional       | Intake              | Penurunan | Tabel |
| ---------------------------------------- | --------- | ------------------- | ------------------- | --------- | ----- |
| Fakultas/Prodi/Jenjang/Search/Periode/TA | ON        | ON                  | ON                  | ON        | ON    |
| Angkatan                                 | ON        | ON                  | ON (card)           | ON (card) | ON    |
| Semester                                 | ON        | ON                  | ON (card)           | off       | ON    |
| Kewarganegaraan                          | ON        | **off** (by design) | ON                  | ON        | ON    |
| Status                                   | ON        | ON (penyebut)       | **off** (by design) | **off**   | ON    |

Aturan tetap: **angka = AND semua filter dalam scope card; badge "Terfilter" = OR**. Tidak diubah.

### Bug/inkonsistensi yang ditemukan

1. Default Tahun Ajaran mahasiswa memakai tahun kalender (`useStudentFilters.js:7`), bukan tahun terbaru di data (ADR 0001). Lulusan sudah benar (`useGraduateFilters.js:145`).
2. `/active-students` tidak memanggil `resolveSnapshotSemesterWhere` → dengan TA + Semester, total modal ≠ angka card (`studentsController.js:37-44`).
3. Numerator card Internasional juga tanpa `resolveSnapshotSemesterWhere` (`internationalTrend.js`) → % salah saat TA + Semester.
4. `/decline-trend` tidak meneruskan `selectedCohortYears` (`studentsController.js:62-66`) → modal fallback beda cabang dari card.
5. `/intake-trend` (COHORT) mengabaikan Semester & Angkatan, sedangkan angka card menghormatinya → tren di modal tidak menandai pilihan user.
6. Status per tahun lampau harus diproyeksikan di JS (`getSnapshotStatus` di `studentSnapshot.js:20`); `groupBy statusKeaktifan` di SQL = status _saat ini_ → salah untuk TA lampau. Breakdown status wajib lewat proyeksi.

## Desain: aturan presentasi generik (bukan kode per-kombinasi)

Tidak perlu menulis cabang untuk setiap kombinasi filter. Tiga aturan menghasilkan semua kasus:

- **R1 – Angka**: tetap AND semua filter dalam scope card (sudah ada).
- **R2 – Dimensi tersisa**: modal menampilkan satu tab per dimensi; tab **disembunyikan bila hasilnya ≤ 1 item**.
  Hierarki otomatis: 1 prodi → fakultas & jenjang juga 1 → ketiganya hilang tanpa kode khusus.
- **R3 – Silang status**: bila status = Semua atau ≥ 2 status → tab **Per Status** muncul paling depan (default),
  dan semua tab lain menjadi bar bertumpuk dengan seri = status. Status tunggal → bar biasa (perilaku sekarang).
- Tab default = tab terlihat pertama dari urutan: Status → Fakultas → Prodi → Jenjang → Angkatan → Semester → Kewarganegaraan.
- Semua tab tersembunyi (mis. cari 1 NIM) → banner saja + teks "Rincian tidak tersedia untuk 1 mahasiswa; lihat tabel".

### Popup Total Mahasiswa — skenario hasil

| Filter aktif                | Tab terlihat (default **tebal**)                                                       | Bentuk                                                        |
| --------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Default (Aktif)             | **Fakultas**, Prodi, Jenjang, Angkatan, Semester, Kewarganegaraan                      | bar biasa                                                     |
| 2+ prodi + Semua Status     | **Per Status**, Prodi, Angkatan, Semester, Kewarganegaraan (+Fakultas/Jenjang bila >1) | Status: bar total per status; lain: bertumpuk per status      |
| 1 prodi + Semua Status      | **Per Status**, Angkatan, Semester, Kewarganegaraan                                    | angkatan bertumpuk → terlihat lulus/aktif/keluar per angkatan |
| 1 prodi + Aktif             | **Angkatan**, Semester, Kewarganegaraan                                                | bar biasa                                                     |
| 2+ fakultas + Aktif & Lulus | **Per Status** (2 seri), Fakultas, Prodi, …                                            | bertumpuk 2 seri                                              |
| 1 angkatan + Semua Status   | **Per Status**, Fakultas, Prodi, Jenjang, Semester, Kewarganegaraan                    | hasil angkatan per prodi                                      |
| WNA + Semua Status          | **Per Status**, Fakultas, Prodi, … (Kewarganegaraan hilang)                            | bertumpuk                                                     |
| Semester tertentu + Aktif   | Fakultas, Prodi, Jenjang, Angkatan, Kewarganegaraan                                    | bar biasa                                                     |

### Popup Internasional

- Tetap: Diagram Tren 5 tahun + Tabel Riwayat (filter kewarganegaraan tetap diabaikan).
- Tambah **Per Negara** (data `byCountry` sudah dikirim server, belum ditampilkan).
- Tambah **Per Program Studi**: jumlah WNA & % dari total per prodi (tahun terpilih), ikut R2 (hilang bila 1 prodi).

### Popup Intake

- Tetap: tren 5 tahun Ganjil/Genap + tabel. Tahun/semester yang dipilih user **ditandai (highlight)** di chart, banner = angka card.
- Tambah **Per Program Studi**: bar bertumpuk per tahun dengan seri prodi (ikut R2).
- Tambah **Status Saat Ini**: mahasiswa baru tiap tahun dalam window dipecah per status _saat ini_ (retensi: masih Aktif / Lulus / Keluar / DO). Diberi label jelas "status saat ini", bukan snapshot.

### Popup Penurunan

- Tetap: banner rumus + chart + tabel A–E.
- Tambah **Per Program Studi**: tabel prodi × (A–E, rata-rata % perubahan) memakai `getNewStudentDecline` per grup prodi (ikut R2).

### Card (teks)

- Judul status Semua: "Mahasiswa Semua Status" → **"Total Mahasiswa (Semua Status)"**; 2+ status → "Total Mahasiswa (Aktif, Lulus)" (>3 → "Status Terpilih", pola `kpiLabels.js:26`).

## Implementasi (reuse yang ada)

- **Server – breakdown generik**: ubah `getActiveStudentsMultisector` (`services/students/activeStudents.js`)
  menjadi: `findMany` dengan `select` minimal (where dari `buildStudentFilter` → `resolveSnapshotSemesterWhere` → `ensurePopulationFilter`, sama seperti summary),
  proyeksikan tiap baris dengan `projectSnapshotStudent` (`studentSnapshot.js:31`), lalu fungsi murni
  `groupByDimension(rows, key)` → `[{ name, count, percentage, byStatus: { Aktif: n, … } }]`.
  Kembalikan key lama (`byProdi`, `byFaculty`, `byJenjang`) + baru (`byStatus`, `byAngkatan`, `bySemester`, `byNationality`).
  `shortcut: agregasi di memori, aman untuk ribuan baris; pindah ke SQL bila populasi > ~50 ribu.`
  Update kontrak di `packages/shared/src/contracts.js` bila ada untuk endpoint ini.
- **Server – intake/decline per prodi & status saat ini**: tambah opsi grup `programStudi` pada perhitungan year counts di `intakeTrend.js`; panggil `getNewStudentDecline` per grup. Status saat ini = `groupBy [periodeMasuk, statusKeaktifan]` scope COHORT.
- **Server – internasional per prodi**: tambah `programStudi` ke `groupBy` foreign di `internationalTrend.js`.
- **Client – chart bertumpuk**: tambah prop opsional `series` ke `components/common/charts/DistributionBarChart` (pola `stackId` sudah ada di `TrendBarChart.jsx`). Warna status dari token `utils/theme`.
- **Client – tab**: perluas `STUDENT_DISTRIBUTION_TABS` (`components/common/modals/modalTabs.js`) + `activeDistributions.js`; di `ActiveStudentsModal.jsx` saring tab `items.length > 1`, set tab awal sesuai R3. `useTabTransition` menerima tab hasil saring.

## Task implementasi

### Fase 0 — Bug konsistensi (kecil, dulu)

- [x] Default Tahun Ajaran mahasiswa data-driven (`filterOptions.academicYearOptions[0]`) seperti `useGraduateFilters`; URL tetap menang. Tes client.
- [x] `/active-students` pakai `resolveSnapshotSemesterWhere` → total modal = card saat TA + Semester.
- [x] Numerator internasional pakai `resolveSnapshotSemesterWhere`.
- [x] `/decline-trend` teruskan `selectedCohortYears`.

### Fase 1 — Popup Total Mahasiswa (permintaan utama)

- [x] Server: breakdown generik + `byStatus` per item via proyeksi snapshot; unit test fungsi grouping murni (status lampau terproyeksi Aktif, Lulus tetap Lulus).
- [x] Client: `DistributionBarChart` mode bertumpuk (`series`), legend status, tooltip per status.
- [x] Client: tab Per Status/Angkatan/Semester/Kewarganegaraan; aturan R2 (sembunyi ≤1) & R3 (default Per Status); state kosong 1 mahasiswa.
- [x] Teks judul/banner card "Total Mahasiswa (…)".
- [x] Tes client: visibilitas & urutan tab untuk skenario tabel di atas.

- [x] Tab Per Angkatan dibatasi 5 tahun ajaran mundur dari tahun terpilih
      (`getBounded5YearRollingAcademicYears`), sama seperti tren intake,
      penurunan, dan internasional. Angka card tetap semua angkatan.

### Fase 2 — Popup Intake & Penurunan

- [x] Highlight tahun/semester terpilih di chart intake; banner = angka card.
- [x] Intake: tab Per Program Studi (bertumpuk) + tab Status Saat Ini (retensi).
- [x] Penurunan: tab Per Program Studi (tabel A–E + rata-rata) per prodi.
- [x] Unit test year counts per prodi & decline per grup.
      Semua rincian berasal dari satu endpoint `GET /students/intake-breakdown`
      (`services/students/intakeBreakdown.js`).

### Fase 3 — Popup Internasional

- [ ] Tab Per Negara (pakai `byCountry` yang ada).
- [ ] Tab Per Program Studi (WNA & %), ikut R2.

### Fase 4 — Dokumentasi & penutup

- [ ] Tulis matriks scope + aturan R1–R3 ke `docs/ARCHITECTURE.md` (bagian student) agar tidak bertentangan lagi dengan `ai-context/`.
- [ ] `CHANGELOG.md` bagian Unreleased.

## Verifikasi

- `pnpm --filter @komet/server test`, `pnpm --filter @komet/client test`, `pnpm lint`, `pnpm format:check`, `pnpm build`.
- `RUN_DB_TESTS=1 pnpm --filter @komet/server test` untuk summary live: jumlah `byStatus` = `activeStudentsCount` saat Semua Status.
- Playwright (`playwright-cli`): `pnpm dev`, buka Student Data, jalankan tiap skenario di tabel popup Total Mahasiswa; cek tab terlihat, tab default, total banner = card, jumlah seri bertumpuk = total.

## Di luar cakupan

- Breakdown gender (kolom tidak ada di model `Student`).
- Quirk `angkatan` vs `angkatanTahun` yang saling timpa di `multiSelect.js` (client hanya kirim `angkatanTahun`).
- Mengubah scope card (Intake/Penurunan tetap abaikan status).
