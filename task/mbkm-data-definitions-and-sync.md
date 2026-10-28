# TODO: MBKM Data — definisi KPI, sync yang andal, data-driven, logika di server

- Status: Fase 0–4 selesai dan terverifikasi; checklist pengetesan lokal menunggu user. Fase S ditunda ke akhir (keputusan user, 2026-10-27).
- Dibuat: 2026-10-27
- Cakupan: card KPI, popup, tabel, sync SEVIMA, dan service MBKM. UI/UX tidak
  didesain ulang.

## Tujuan

Halaman MBKM Data sudah punya 4 card dan 4 popup, tetapi:

- definisinya tidak punya acuan yang konsisten;
- populasi antar-card berbeda-beda;
- sync SEVIMA rapuh dan membuang banyak field;
- sebagian logika domain ada di frontend.

Tujuannya: setiap angka punya definisi tunggal yang sama di card, popup, dan
tabel; data baru dari SEVIMA langsung tampil tanpa perubahan kode; server
memegang semua keputusan domain, dan client hanya presentasi.

Keputusan user (2026-10-27): partisipan = status **Disetujui + Selesai**; tetap
4 card dengan card ke-4 diganti **Rekognisi ≥ 20 SKS**; **tanpa target** (web ini early warning system); tanpa kolom Pembimbing; ambil **SKS konversi**; kerjakan
seluruh perbaikan data/sync (kunci unik, field tambahan, panel kualitas data,
aturan status dari data). Sisanya diserahkan ke rekomendasi terbaik.

## Temuan utama

**Keamanan (kritis).** Kunci SEVIMA (`X-App-Key`, `X-Secret-Key`) ada di
`ai-context/response-api.json` pada commit `db3a150`, `040d764`, dan `e5e4081`
(25 Sep 2026). Ketiganya ada di `main` dan di GitHub yang sedang **publik**.
Salinan lokal juga ada di `requirements/response-api.json` (di-gitignore).

**Perhitungan** (`apps/server/src/services/mbkm/`):

1. Status partisipan saat ini termasuk Diajukan (`filterBuilder.js:70`).
2. Card Mitra memakai populasi lain: semua status (termasuk Ditolak/Dibatalkan),
   hanya filter periode (`mbkmMitra.js`).
3. Hitungan status, distribusi, dan fakultas dihitung **per aktivitas**,
   sedangkan nilai card dihitung **per mahasiswa** (`mbkmRate.js:47-50`,
   `mbkmActivities.js`). Akibatnya angkanya tidak bisa dijumlahkan dan
   persentase fakultas bisa > 100%.
4. Filter fakultas/prodi memakai kolom aktivitas untuk pembilang, tetapi kolom
   mahasiswa untuk penyebut.
5. Persentase di popup Rate = porsi fakultas dari total partisipan, bukan
   tingkat partisipasi fakultas itu.
6. Eligible: mahasiswa Drop Out/Lulus dengan `periodeTerakhir` kosong dianggap
   aktif selamanya (`mbkmEligibility.js:37-49`).
7. Default periode: data-driven di server, tetapi client memaksa tahun kalender
   (`useMbkmFilters.js:7`, melanggar §5.1). Cache warmup juga memakai kalender
   (`serverWarmup.js:39`).
8. Tabel tanpa periode = semua periode, sedangkan card = periode default.

**Sync** (`controllers/sync/syncMbkm.js`, `mapMbkmRow.js`, `writeMbkmPage.js`):

1. `deleteMany` lalu `createMany` tanpa transaksi: jika gagal di tengah, tabel
   kosong atau parsial.
2. Tidak ada kunci unik. ID aktivitas SEVIMA dibuang; duplikat hanya dibersihkan
   oleh dedup susulan.
3. Field yang dibuang: `id_aktivitas`, `id_status_aktivitas`,
   `id_jenis_kegiatan`, tanggal mulai/selesai, pembimbing, dan relasi
   mata kuliah konversi (SKS).
4. NIM yang tidak ditemukan dibuatkan mahasiswa palsu berstatus "Aktif",
   dengan `periodeMasuk` kosong karena salah kunci (`writeMbkmPage.js:19`
   → `nimResolver.js:50`). Ini menaikkan angka "Aktif" di Student Data.
5. `statusAktivitas` disimpan mentah (tanpa trim/case); `periode` kosong atau
   `YYYY3` ikut tersimpan; `jenjang` kosong dipaksa `S1`.

**Client** (`apps/client/src/modules/mbkm/`):

- Daftar status aktif disalin di client (`useMbkmKpiDisplay.js:4`).
- Warna status dan jenis ditebak dari kata kunci (`MbkmDataTable.jsx:13-47`).
- Kode periode diurai di client.
- Aturan "filter mana yang tidak mengubah angka" dihitung ulang di client.
- `topN` ditentukan client.
- Helper teks diduplikasi (`toList`, `joinWithAnd`, `scopeLabel`, potongan
  pencarian) padahal sudah ada `formatList`/`kpiLabels`.
- Empat modal ~90% identik.

## Definisi tunggal (ADR 0005)

Satu populasi untuk semua card, popup, dan tabel:

- **Periode terpilih (P):** `periode` eksplisit, atau kedua periode `tahunAjaran`,
  atau tahun ajaran terbaru di data MBKM (default data-driven).
- **Eligible (E):** mahasiswa unik yang aktif dan berada di semester 7 pada
  salah satu periode P. Status per periode memakai proyeksi snapshot yang sama
  dengan Student Data (`studentSnapshot.js` / `snapshotConditions.js`), bukan
  aturan sendiri. Filter mahasiswa: fakultas, prodi, jenjang, angkatan (kolom
  Student).
- **Aktivitas terhitung:** aktivitas pada P dengan kategori status
  `participating` (Disetujui, Selesai), dengan `jenisAktivitas` terisi, yang
  lolos filter aktivitas (jenis, status, pencarian).
- **Partisipan:** mahasiswa unik dalam E yang punya ≥ 1 aktivitas terhitung.
- **Persentase partisipasi** = Partisipan ÷ E × 100. Tidak ada target.
- **Rekognisi ≥ 20 SKS** = partisipan dengan total SKS konversi ≥ 20 pada P
  (SKS = jumlah `sks_mata_kuliah` dari `mata-kuliah-konversi-mbkm` per aktivitas).
  Data SKS hanya tersedia mulai 2024/2025; periode sebelumnya = "tanpa data SKS".
- **Mitra** = mitra unik (nama dinormalisasi) dari aktivitas terhitung milik
  partisipan; ditampilkan di popup Partisipan (tab Per Mitra), bukan card.

Kategori status ditentukan satu tabel aturan di server (`mbkm/statusRules.js`):

| Kategori        | Status                  | Dihitung partisipan?                                                            |
| --------------- | ----------------------- | ------------------------------------------------------------------------------- |
| `participating` | Disetujui, Selesai      | ya                                                                              |
| `pending`       | Diajukan                | tidak, ditampilkan sebagai "menunggu persetujuan"                               |
| `rejected`      | Ditolak                 | tidak                                                                           |
| `cancelled`     | Dibatalkan              | tidak                                                                           |
| `unclassified`  | status baru dari SEVIMA | tidak, sampai ditetapkan; muncul di filter, distribusi, dan Panel Kualitas Data |

Pencocokan status memakai kode SEVIMA bila ada, dan label yang dinormalisasi
(trim, huruf kecil) sebagai cadangan.

## Empat card (diputuskan server, `kpis.cards` seperti Graduate)

| Card                   | Nilai                      | Rincian di subtitle                                                             | Filter yang dibaca                                                                 |
| ---------------------- | -------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Persentase Partisipasi | Partisipan/E               | "X dari Y eligible"                                                             | semua                                                                              |
| Partisipan MBKM        | mahasiswa unik             | Selesai n · Disetujui n (per mahasiswa, status terbaik); menunggu persetujuan m | semua                                                                              |
| Mahasiswa Eligible     | E                          | belum berpartisipasi = E − Partisipan                                           | filter mahasiswa + periode (jenis/status/pencarian disebut lewat `ignoredFilters`) |
| Rekognisi ≥ 20 SKS     | partisipan dengan SKS ≥ 20 | % dari partisipan, < 20 SKS n, tanpa data SKS n                                 | semua                                                                              |

## Aturan presentasi

Sama dengan Graduate dan Student:

- **R1:** angka = AND semua filter dalam scope card.
- **R2:** tab berisi ≤ 1 kategori disembunyikan (`tabsWithData`).
- **R3:** kombinasi kosong → `isEmpty` + kalimat penjelasan; 0 tetap 0, null = "-".
- **R4:** setiap popup menerima `breakdowns: [{ key, label, items }]` dari
  server, dan client merender tab secara generik. Pengelompokan baru cukup
  ditambah di server.

Popup:

- **Persentase:** tingkat partisipasi per fakultas/prodi (partisipan ÷ eligible
  per grup) dan tren per tahun ajaran (5 tahun). Tanpa garis target.
- **Partisipan:** per jenis aktivitas, per kategori status (per mahasiswa), per
  prodi, per angkatan, dan **per mitra** (mitra teratas, top N dari server).
- **Eligible:** per prodi/fakultas/angkatan, beserta jumlah yang belum
  berpartisipasi.
- **Rekognisi SKS:** per kelompok SKS (≥ 20 / < 20 / tanpa data), per prodi, per
  jenis aktivitas.
- **Kualitas Data (baru):** duplikat yang dibuang saat sync, NIM tanpa
  mahasiswa, status `unclassified`, periode tidak valid/kosong, jenis kosong,
  nama mitra yang mirip, SKS tidak wajar (> 40), aktivitas tanpa data SKS,
  eligible tanpa periode akhir, dan waktu sync terakhir.

Tabel memakai populasi dan periode yang sama dengan card. Server mengirim
`periodeLabel` ("Ganjil 2025/2026") dan `statusCategory`; warna jenis mengikuti
urutan dari server, bukan kata kunci.

## Filter dan tabel

- Filter tetap: Tahun Ajaran (default dari data), Periode, Fakultas, Program
  Studi, Jenis Aktivitas, Status Aktivitas (dengan kategori), Pencarian (NIM,
  nama, mitra). Angkatan dan Jenjang tetap tidak ditampilkan (ADR 0003; semua
  data MBKM = S1).
- **Filter baru "Status Partisipasi":** Berpartisipasi, Belum berpartisipasi,
  Menunggu persetujuan, Belum 20 SKS. "Belum berpartisipasi" menampilkan
  mahasiswa eligible tanpa aktivitas.
- Tabel: Periode → label ("Ganjil 2025/2026"); Status → badge dari kategori;
  Jenis → warna dari urutan server; tambah **Judul Aktivitas**, **SKS
  Konversi**, **Tanggal Mulai–Selesai**, **Dihitung** (✓/✗ + alasan). Kolom
  Pembimbing tidak ditampilkan dan tidak disimpan sebagai kolom (tetap ada di
  `raw`). Populasi dan periode tabel sama dengan card.

## Ketersediaan data SEVIMA (dicek 2026-10-27, GET saja)

| Data                                                                               | Sumber                                                 | Terisi                                          |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| ID aktivitas, periode, prodi, jenjang, jenis (kode + label), status (kode + label) | `aktivitas-mbkm`                                       | 100%                                            |
| Judul aktivitas                                                                    | `aktivitas-mbkm`                                       | 100%                                            |
| Mitra                                                                              | `aktivitas-mbkm`                                       | 96%                                             |
| Tanggal mulai/selesai                                                              | `aktivitas-mbkm`                                       | 100% mulai 2024/2025, 0% sebelumnya             |
| SKS konversi                                                                       | `mata-kuliah-konversi-mbkm` (653 baris, 411 aktivitas) | hampir penuh mulai 2024/2025, kosong sebelumnya |
| Pembimbing                                                                         | `aktivitas-mbkm`                                       | 45% (tidak dipakai)                             |

Kode status stabil: 1 Diajukan, 2 Disetujui, 5 Selesai, 6 Ditolak, 7 Dibatalkan.
Jenis: A03 Magang, A05 Riset, A10 Pertukaran Pelajar, A08 Studi/Proyek
Independen, A07 Wirausaha. Anomali: 33 baris duplikat di feed API, satu
aktivitas dengan dua mahasiswa, SKS tidak wajar (106, 182, 251).

## Baseline sebelum perbaikan (DB lokal, 2026-10-27, SELECT saja)

- 556 aktivitas tersimpan dari 570 aktivitas unik di API (603 baris); 509 NIM
  unik. Status: Selesai 373, Disetujui 153, Ditolak 14, Dibatalkan 13,
  Diajukan 3.
- Mahasiswa palsu (`periodeMasuk` kosong): 0 saat ini; bug ada di kode.
- Nama mitra: 193 mentah, 184 setelah normalisasi.

| Tahun ajaran | Partisipan | Eligible | Persentase | Mitra |
| ------------ | ---------- | -------- | ---------- | ----- |
| 2026/2027    | 121        | 130      | 93,08%     | 75    |
| 2025/2026    | 116        | 133      | 87,22%     | 68    |
| 2024/2025    | 109        | 145      | 75,17%     | 68    |
| 2023/2024    | 102        | 188      | 54,26%     | 14    |
| 2022/2023    | 7          | 162      | 4,32%      | 6     |

## Task implementasi

### Fase S — Keamanan (dikerjakan pertama, sebagian oleh user)

- [ ] User meminta rotasi `SEVIMA_APP_KEY`/`SEVIMA_SECRET_KEY` ke admin SEVIMA,
      lalu memperbarui `apps/server/.env`.
- [ ] Repo GitHub dijadikan private segera; DeepScan bisa memakai akses private
      atau diganti.
- [x] Hapus kunci dari `requirements/response-api.json` lokal (ganti dengan
      placeholder). Selesai 2026-10-27; tidak ada file lain di working tree yang
      memuat kunci. Commit pembawa kebocoran: `ee214f6` (menambah
      `ai-context/response-api.json`, juga berisi 5 nama mahasiswa dan NIK/tanggal
      lahir) beserta merge `db3a150`, `040d764`, `e5e4081`.
- [ ] Opsional, dengan konfirmasi terpisah: bersihkan riwayat dengan
      `git filter-repo`. Ini destruktif, mengubah semua hash commit, dan butuh
      force push. Rotasi kunci tetap wajib karena riwayat publik bisa sudah
      tersalin.

### Fase 0 — Penemuan data (read-only) dan ADR

- [x] Ambil data nyata `aktivitas-mbkm` dan `mata-kuliah-konversi-mbkm`
      (GET saja) untuk memastikan nama field, kode status, dan format SKS.
      Hasil di bagian "Ketersediaan data SEVIMA" di bawah.
- [x] Script profil read-only (SELECT) untuk baseline anomali, yang menjadi
      acuan sebelum dan sesudah perbaikan. Hasil di bagian "Baseline sebelum
      perbaikan" di bawah.
- [x] Tulis `docs/adr/0005-mbkm-definitions.md` (definisi di atas; tanpa
      target, halaman = early warning system; kriteria 20 SKS; kunci
      `idAktivitas` + `nim`) dan perbarui `requirements/FORMULA.md` secara lokal.

### Fase 1 — Sync yang andal (`controllers/sync/`, `prisma/schema.prisma`)

- [x] Kolom MbkmActivity baru: `idAktivitas`, `idStatusAktivitas`,
      `idJenisKegiatan`, `tanggalMulai`, `tanggalSelesai`, `sksKonversi`, dan
      `raw` (JSON baris asli; field baru SEVIMA otomatis tersimpan di sini).
      Kunci unik = (`idAktivitas`, `nim`): satu aktivitas bisa punya beberapa
      mahasiswa. Terapkan dengan `db push` (ADR 0002).
- [x] Buang duplikat dari feed API sebelum menulis (603 baris, 570 aktivitas
      unik; 31 duplikat identik). Tulis dalam satu transaksi (hapus + isi
      atomik); tidak ada jendela tabel kosong.
- [x] Normalisasi saat menulis: trim status/jenis/mitra, periode tidak valid
      ditandai (tidak dibuang diam-diam), `jenjang` kosong = '' (bukan dipaksa
      S1).
- [x] Hentikan pembuatan mahasiswa palsu untuk MBKM; aktivitas yatim dihitung
      di laporan sync/kualitas data. Perbaiki juga kunci `id_periode` yang
      salah. Cek pemanggil `nimResolver` di modul lain dulu.
- [x] Ambil SKS konversi dari endpoint list `mata-kuliah-konversi-mbkm`
      (±7 halaman, sudah dicek), jumlahkan `sks_mata_kuliah` per
      `id_aktivitas`, simpan di `sksKonversi` (null = tidak ada data).
- [x] `mbkm/statusRules.js`: tabel kategori status (kode dan label) +
      `unclassified`. Dipakai sync dedup (gantikan rank hardcode di
      `studentDeduplicationService.js:26-31`) dan semua perhitungan.
- [x] Tes: mapping baris, transaksi gagal tidak mengosongkan tabel, status baru
      → `unclassified`, NIM yatim tidak membuat mahasiswa.
- [x] **Terapkan skema ke database** (`npx prisma db push --accept-data-loss &&
npx prisma generate`, disetujui user 2026-10-27), lalu sync MBKM beberapa
      kali. Hasil stabil: 603 baris feed − 32 duplikat = 571 ditulis − 15
      duplikat isi = 556 tersimpan; semua punya `idAktivitas` dan `raw`, 400
      dengan SKS, 426 dengan tanggal; 0 yatim, 0 mahasiswa palsu, mahasiswa
      tetap 2.022.

### Fase 2 — Perhitungan server (`services/mbkm/`)

- [x] Satu builder populasi `population.js` (P, E, aktivitas dengan `counted` +
      alasan, partisipan) dipakai summary, popup, dan list. Fakultas, prodi,
      jenjang, dan angkatan dibaca dari kolom Student. Service lama
      (`mbkmRate`, `mbkmActivities`, `mbkmMitra`, `mbkmEligible`) dihapus.
- [x] Eligibility: status non-aktif tanpa periode akhir tidak lagi aktif
      selamanya. Proyeksi tetap per periode di `mbkmEligibility.js`; snapshot
      Student Data per tahun ajaran (Prisma where) tidak dipakai ulang karena
      punya celah yang sama untuk periode akhir kosong. Mahasiswa dimuat sekali
      per populasi.
- [x] `kpis.cards` (`mbkmCards.js`): `rate`, `participants`, `eligible`,
      `recognition`, masing-masing dengan `value`, `isEmpty`, rincian, dan
      `ignoredFilters`; `kpiFilterScope` per kartu. Tanpa target.
- [x] Card 4 Rekognisi ≥ 20 SKS: `RECOGNITION_SKS` di `population.js`;
      `emptyReason` `noParticipants` atau `noSksData` (bukan 0).
- [x] Status dan distribusi per mahasiswa (status terbaik). Jumlah aktivitas
      sebagai angka sekunder tidak dibuat (tidak dibutuhkan popup).
- [x] Mitra: dari aktivitas terhitung, nama dinormalisasi (`mitraKey`), top N + "Lainnya" di server, dihitung per mahasiswa.
- [x] Popup: `GET /mbkm/analytics/:card` mengembalikan `card` + `breakdowns[]`
      (`kind: 'share' | 'rate'`). Rate: per fakultas, per prodi, tren 5 tahun.
      Menggantikan enam endpoint analytics lama.
- [x] `GET /mbkm/data-quality` (`mbkmDataQuality.js`): `lastSyncAt` dan
      `checks[]`. Duplikat feed dan NIM tanpa mahasiswa dibaca dari laporan sync
      terakhir yang kini disimpan di `sync_runs.modules[].report`.
- [x] Filter Status Partisipasi (`participating`, `notParticipating`,
      `pending`, `belowSks`): opsi di `@komet/shared/constants`, divalidasi
      `validator.js`, diterapkan di `mbkmList.js`. Kartu melaporkannya sebagai
      `ignoredFilters`.
- [x] List: periode sama dengan kartu; baris membawa `periodeLabel`,
      `statusCategory`, `sksKonversi`, `totalSks`, tanggal, `counted`,
      `countedReason`. `tahun` dihapus. `MBKM_ROW_FIELDS` diperbarui.
- [x] Opsi filter: `statusAktivitasOptions` (dengan kategori, urut rank),
      jenjang dari data, `statusPartisipasiOptions`. Default periode = kedua
      periode tahun ajaran terbaru di data (kode Ganjil/Genap saja).
- [x] Warmup memakai tahun ajaran terbaru dari data MBKM.
- [x] Tes `mbkmAnalytics.test.js` (18), validator, dan `syncRunLog`. 354 tes
      server lulus.

Hasil di DB lokal (2026-10-27, SELECT saja):

| Tahun ajaran | Partisipan / Eligible | Persentase | Rekognisi ≥ 20 SKS         | Catatan                                                        |
| ------------ | --------------------- | ---------- | -------------------------- | -------------------------------------------------------------- |
| 2026/2027    | 121 / 130             | 93.08%     | 82 (39 < 20)               | sama dengan baseline                                           |
| 2025/2026    | 115 / 133             | 86.47%     | 55 (60 < 20)               | −1: satu mahasiswa hanya Diajukan, kini "menunggu persetujuan" |
| 2024/2025    | 109 / 145             | 75.17%     | 74 (32 < 20, 3 tanpa data) | sama                                                           |
| 2023/2024    | 102 / 188             | 54.26%     | tanpa data SKS             | sama                                                           |
| 2022/2023    | 7 / 162               | 4.32%      | tanpa data SKS             | sama                                                           |

Tingkat partisipasi per fakultas/prodi ≤ 100%; status per mahasiswa menjumlah
ke kartu Partisipan.

### Fase 3 — Client hanya presentasi (`modules/mbkm/`)

- [x] `useMbkmFilters(defaultAcademicYear)`: default dari data (pola
      `useStudentFilters`); sebelum opsi termuat `tahunAjaran` tidak dikirim
      sehingga server memilih tahun terbaru di data.
- [x] `useMbkmKpiDisplay` ditulis ulang di atas `kpis.cards` dan
      `periodLabel` dari server, memakai `formatList`/`joinLabels`. Parsing
      periode, `ACTIVE_STATUSES`, aturan `ignoredFilters`, dan `topN` di client
      dihapus.
- [x] Satu modal generik `MbkmBreakdownModal` (menggantikan 4 modal) dan
      `MbkmDataQualityModal` (tombol "Kualitas Data" di header). Breakdown
      `rate` tampil sebagai tabel supaya grup 0% tetap terlihat.
- [x] Tabel: badge status dari `statusCategory` dan warna jenis dari urutan opsi
      server (`utils/mbkmBadges.js`), kolom Periode dari `periodeLabel`, kolom
      baru Tanggal, Judul Aktivitas, SKS Konversi, Dihitung. Fakultas dan
      angkatan digabung ke sel Prodi dan Nama. Tanpa kolom Pembimbing.
- [x] Filter Status Partisipasi (opsi dari server).
- [x] Card 4 Rekognisi ≥ 20 SKS; mitra menjadi tab Per Mitra di popup
      Partisipan.
- [x] Tes: `kpiDisplayHooks` (bagian MBKM), `dashboardPages` (rute MBKM),
      `mbkmModals.test.jsx` (modal generik, badge). 189 tes client lulus.

### Fase 4 — Dokumentasi & verifikasi

- [x] `docs/ARCHITECTURE.md` bagian "MBKM Data population, cards, and
      details" (definisi, matriks filter, endpoint) dan CHANGELOG (Added,
      Changed, BREAKING di Removed, Fixed).
- [x] `pnpm verify` hijau (format, lint, 34 tes shared, 189 client, 354 server,
      build).
- [x] Browser lokal (headless, 2026-10-27): kartu default 2026/2027 = 121 /
      130 / 93,1% / 82; popup Persentase per fakultas 93,1% dan 92,9%; panel
      Kualitas Data terisi.

### Revisi setelah review user (2026-10-27)

Dihapus atas permintaan user, di server dan client:

- [x] Panel Kualitas Data: `GET /mbkm/data-quality`, `mbkmDataQuality.js`,
      tombol header (`MbkmHeaderExtra`), `MbkmDataQualityModal`, dan laporan
      sync di `sync_runs.modules[].report`.
- [x] Filter Status Partisipasi: opsi di `@komet/shared/constants`, validator,
      `statusPartisipasiOptions`, mode tabel di `mbkmList.js`, dan field form.
- [x] Kolom tabel Tanggal Mulai s.d. Selesai dan Dihitung: field
      `tanggalMulai`, `tanggalSelesai`, `counted`, `countedReason` di baris list
      dan `MBKM_ROW_FIELDS`, serta alasan "tidak dihitung" di `population.js`.
      Kolom database tanggal tetap diisi sync (tidak tampil).
- [x] Header MBKM kembali memakai `HeaderAcademicYearFilter` saja, sama dengan
      Graduate Data. Deskripsi halaman dipendekkan karena teks dua baris
      menggeser pemilih tahun ajaran.
- [x] Card 4 kembali menjadi **Mitra MBKM** (keputusan user: aktivitas MBKM
      sah bisa 3 atau 14 SKS, jadi kriteria 20 SKS dihapus). Mitra = nama mitra
      unik (dinormalisasi) dari aktivitas Disetujui/Selesai mahasiswa eligible,
      mengikuti semua filter. Popup: Mitra Teratas dan Mitra per Jenis
      Aktivitas; tab Per Mitra di popup Partisipan dihapus. `RECOGNITION_SKS`,
      `sksGroupOf`, dan `recognitionBreakdowns` dihapus. SKS konversi tetap
      tampil di tabel.

### Revisi kartu (2026-10-28, keputusan user)

- [x] Tiga kartu (Partisipan, Eligible, Persentase) digabung menjadi
      **Partisipasi MBKM Semester 7**: "121 dari 130 mahasiswa aktif semester 7
      mengikuti MBKM. 9 belum berpartisipasi." Saat difilter jenis, kata "MBKM"
      diganti nama jenisnya.
- [x] Kartu baru **Total Mahasiswa MBKM** (semua semester, `allParticipants`
      di `population.js`), dengan popup Per Semester, Per Prodi, dan Per Angkatan.
- [x] **Mitra MBKM** dan kartu baru **Bentuk Kegiatan MBKM** memakai populasi
      semua semester.
- [x] `ignoredFilters` dihapus: semua kartu membaca semua filter.

### Alias nama mitra (2026-10-28)

- [x] `services/mbkm/partnerNames.js`: aturan aman (huruf besar, tanda baca,
      PT/CV/Tbk/Persero, singkatan dalam kurung) + tabel `mbkm_partner_aliases`
      (db push dengan persetujuan user). Nama tampil = `canonical` alias atau
      ejaan terpanjang. Tanpa pencocokan kemiripan (fuzzy).
- [x] Seed `prisma/data/mbkm-partner-aliases.sql`: 3 alias i3L. 190 ejaan →
      181 mitra; i3L di 2025/2026 = 29 mahasiswa (mitra terbanyak).
- [x] Aturan umum tambahan (keputusan user, 2026-10-28): jamak "-s", kode
      mata kuliah (MBKM mata kuliah memang dihitung sebagai mitra), nama pendek
      yang mengawali satu-satunya nama panjang, dan salah ketik satu huruf.
      Nama tampil = kata terbanyak, lalu paling sering, lalu terpanjang.
- [x] Alias BRIN (4 ejaan → "Badan Riset dan Inovasi Nasional (BRIN)").
      190 ejaan → 169 mitra; kartu Mitra 2026/2027 = 68, 2025/2026 = 63.
- [x] Singkatan kata terakhir ("Semen Ind", "Semen Indo" → "PT Semen
      Indonesia") digabung otomatis bila hanya satu mitra cocok. Alias yang
      sudah tertangkap aturan dihapus dari seed dan database; tersisa 3 (i3L
      University, MBKM - BRIN, Research - BRIN), hasil tetap 169 mitra.

Cara menambah alias: tambah baris di file seed, lalu jalankan
`npx prisma db execute --file prisma/data/mbkm-partner-aliases.sql` dari
`apps/server`. Perubahan tampil setelah cache 5 menit, sync, atau restart.

### Checklist pengetesan lokal (untuk user)

- [x] Sync MBKM dari sidebar (2026-10-27): 556 aktivitas, kunci unik, tanpa
      mahasiswa palsu.
- [ ] Posisi pemilih Tahun Ajaran di header sama dengan Student dan Graduate.
- [ ] Default tanpa URL (2026/2027): 93,1% (121 dari 130, 9 belum) / 131
      mahasiswa / 72 mitra / 4 jenis (Magang 67, Riset 56); tabel 137 baris.
- [ ] Tahun 2025/2026: 85,0% (113 dari 133, 1 menunggu persetujuan) / 124
      mahasiswa / 65 mitra.
- [ ] Popup Total Mahasiswa MBKM: Per Semester berisi 7 = 121, 9 = 6, 13 = 2,
      11 = 1, 5 = 1.
- [ ] Satu fakultas: semua kartu, popup, dan tabel menyempit; tab Per Fakultas
      tersembunyi.
- [ ] Satu jenis aktivitas: kartu Partisipasi menyebut nama jenisnya, penyebut
      tetap 130.
- [ ] Periode Genap 2026/2027 (kosong): kartu dan popup menjelaskan kombinasi
      kosong.
- [ ] Popup Mitra: tab Mitra Teratas berisi mitra teratas + "Lainnya".

## File utama

- Server: `services/mbkm/{filterBuilder,mbkmEligibility,mbkmRate,mbkmActivities,mbkmMitra,mbkmEligible,mbkmList,mbkmSummary,filterOptions}.js`,
  `services/mbkm/statusRules.js` (baru), `controllers/sync/{syncMbkm,mapMbkmRow,writeMbkmPage}.js`,
  `controllers/sync/sevimaLookup/nimResolver.js`, `services/studentDeduplicationService.js`,
  `services/serverWarmup.js`, `prisma/schema.prisma`.
- Reuse: `services/students/studentSnapshot.js`, `services/graduates/graduateCards.js`
  (pola `kpis.cards`), `utils/percentageUtils.js`, `utils/academic/period.js`.
- Shared: `packages/shared/src/{constants,contracts}.js`.
- Client: `modules/mbkm/**`, `components/common/modals/tabsWithData.js`, `utils/kpiLabels.js`.

## Verifikasi

- `pnpm verify` (format, lint, test, build).
- Script profil Fase 0 dijalankan sebelum dan sesudah. Selisihnya harus bisa
  dijelaskan oleh definisi baru: Diajukan keluar dari pembilang, mahasiswa
  palsu hilang, dan sebagainya.
- Sync MBKM penuh di lokal, dua kali berturut-turut. Jumlah baris stabil, tanpa
  duplikat (kunci `idAktivitas` + `nim` unik). Sync yang dihentikan di tengah tidak mengosongkan
  tabel.
- Browser:
  - default (tahun terbaru di data);
  - 1 fakultas;
  - 1 jenis + 1 status;
  - pencarian NIM;
  - periode Genap kosong;
  - kombinasi kosong.

  Cek card = popup = total tabel, tab satu kategori tersembunyi, dan Panel
  Kualitas Data terisi.

## Di luar cakupan

- Desain ulang UI/UX (sesuai permintaan user).
- Editor aturan status lewat UI. Status baru tetap otomatis tampil, dan hanya
  "dihitung partisipan atau tidak" yang perlu ditetapkan di `statusRules.js`.
- Menampilkan field baru dari `raw` di tabel secara otomatis (risiko data
  pribadi); field itu tersimpan dan bisa dipilih untuk ditampilkan kemudian.
