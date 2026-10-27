# TODO: MBKM Data — definisi KPI, sync yang andal, data-driven, logika di server

- Status: Fase 0–1 selesai dan terverifikasi; Fase 2 berikutnya. Fase S ditunda ke akhir (keputusan user, 2026-10-27).
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

- [ ] Satu builder populasi (P, E, aktivitas terhitung, partisipan) dipakai
      summary, semua analytics, dan list. Fakultas/prodi selalu dari kolom
      Student.
- [ ] Eligibility memakai proyeksi snapshot Student Data (DRY), sehingga bug
      Drop Out tanpa periode akhir hilang.
- [ ] `kpis.cards` (value, isEmpty, scope, rincian, `ignoredFilters`) +
      `kpiFilterScope`. Tanpa target.
- [ ] Card 4 **Rekognisi ≥ 20 SKS**: partisipan dengan total `sksKonversi` ≥ 20
      pada P, rincian < 20 SKS dan tanpa data SKS; periode tanpa data SKS sama
      sekali = `isEmpty` dengan penjelasan, bukan 0. Ambang 20 SKS satu konstanta
      server (kriteria, bukan target).
- [ ] Hitungan status dan distribusi per mahasiswa (status terbaik), dengan
      jumlah aktivitas sebagai angka sekunder.
- [ ] Mitra: populasi = aktivitas terhitung; nama dinormalisasi; top N dari
      server.
- [ ] Popup menerima `breakdowns[]`, termasuk tingkat partisipasi per grup
      (bukan porsi).
- [ ] Endpoint `GET /mbkm/data-quality`: duplikat dari feed API, NIM tanpa
      mahasiswa, status `unclassified`, periode tidak valid, jenis kosong, nama
      mitra mirip, SKS tidak wajar (> 40), aktivitas terhitung tanpa data SKS,
      eligible tanpa periode akhir, waktu sync terakhir.
- [ ] Filter **Status Partisipasi** (Berpartisipasi, Belum berpartisipasi,
      Menunggu persetujuan, Belum 20 SKS): opsi dari server, divalidasi di
      `validator.js`, diterapkan di builder populasi.
- [ ] List: periode default sama dengan card; per baris `periodeLabel`,
      `statusCategory`, `judulAktivitas`, `sksKonversi`, `tanggalMulai`,
      `tanggalSelesai`, `counted` + `countedReason` (mis. belum disetujui, bukan
      semester 7, SKS < 20). Mode "Belum berpartisipasi" mengembalikan daftar
      mahasiswa eligible tanpa aktivitas. Perbarui `MBKM_ROW_FIELDS` di
      `packages/shared/src/contracts.js`.
- [ ] Opsi filter: `statusAktivitas` membawa kategori; jenjang dinamis (bukan
      `JENJANGS` S1/S2); periode valid saja.
- [ ] Cache warmup memakai tahun terbaru dari data, bukan kalender.
- [ ] Tes: definisi R1 per kombinasi filter, per-mahasiswa vs per-aktivitas,
      tingkat partisipasi per fakultas ≤ 100%, eligible Drop Out, status
      `unclassified`.

### Fase 3 — Client hanya presentasi (`modules/mbkm/`)

- [ ] `useMbkmFilters` menerima default dari data (pola `useStudentFilters`).
- [ ] `useMbkmKpiDisplay` ditulis ulang di atas `kpis.cards`, memakai
      `formatList` dan helper cakupan bersama. Hapus `ACTIVE_STATUSES`, parsing
      periode, aturan `ignoredFilters`, dan `topN`.
- [ ] Satu komponen modal generik yang merender `breakdowns` (gantikan 4 modal
      yang hampir identik) + popup Kualitas Data.
- [ ] Tabel: badge dari `statusCategory` (peta kategori → warna, pola
      `predikatBadge`), warna jenis dari urutan server, kolom Periode dari
      `periodeLabel`; kolom baru Judul Aktivitas, SKS Konversi, Tanggal
      Mulai–Selesai, Dihitung (✓/✗ + alasan). Tanpa kolom Pembimbing.
- [ ] Filter Status Partisipasi di form filter (opsi dari server); mode
      "Belum berpartisipasi" menampilkan daftar mahasiswa eligible.
- [ ] Card 4 Rekognisi ≥ 20 SKS + popupnya; mitra pindah ke tab Per Mitra di
      popup Partisipan.
- [ ] Tes: hook di atas `cards`, render modal generik, badge dari kategori,
      default tahun dari data.

### Fase 4 — Dokumentasi & verifikasi

- [ ] `docs/ARCHITECTURE.md` bagian MBKM (definisi, matriks filter, aturan
      presentasi, endpoint), CHANGELOG (BREAKING untuk field yang berubah),
      dan file `task/mbkm-data-...md` dengan checklist pengetesan lokal.

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
