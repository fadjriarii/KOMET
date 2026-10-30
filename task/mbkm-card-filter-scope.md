# TODO: Cakupan filter per kartu di MBKM Data

- Status: **SELESAI** (2026-10-30).
- Dibuat: 2026-10-30
- Cakupan: halaman MBKM Data saja, yaitu empat kartu KPI, tabel, dan popup
  rincian tiap kartu. Students dan Graduates tidak disentuh.
- Plan lengkap: `~/.claude/plans/sekarang-saya-ingin-mengerjakan-humble-hoare.md`

## Masalah

Sekarang semua filter memengaruhi keempat kartu (`KPI_FILTER_SCOPE` di
`apps/server/src/services/mbkm/mbkmCards.js` sama untuk semua kartu), jadi:

- Mencari satu NIM membuat Partisipasi jadi 1/130 dan Total = 1.
- Status Diajukan/Ditolak membuat semua kartu bernilai 0.
- Memilih satu Jenis membuat Bentuk Kegiatan selalu "1 jenis".
- Badge `Terfilter` menyala di keempat kartu untuk filter apa pun.
- Banner popup tidak menyebut cakupan Fakultas/Prodi.
- Tren partisipasi selalu memakai 5 tahun terakhir di data, bukan 5 tahun yang
  berakhir di Tahun Ajaran terpilih.

## Aturan cakupan (disetujui)

| Filter                  | Partisipasi Smt 7               | Total Mhs MBKM | Mitra MBKM | Bentuk Kegiatan           | Tabel |
| ----------------------- | ------------------------------- | -------------- | ---------- | ------------------------- | ----- |
| Tahun Ajaran / Periode  | ✔                               | ✔              | ✔          | ✔                         | ✔     |
| Fakultas, Program Studi | ✔ pembilang + penyebut          | ✔              | ✔          | ✔                         | ✔     |
| Jenis Aktivitas         | ✔ pembilang saja ("… Magang …") | ✔              | ✔          | ✘, jenis terpilih disorot | ✔     |
| Status Aktivitas        | ✘                               | ✘              | ✘          | ✘                         | ✔     |
| Cari                    | ✘                               | ✘              | ✘          | ✘                         | ✔     |

- Kartu selalu memakai definisi partisipan Disetujui/Selesai.
- Jika beberapa filter aktif, kartu menerapkan irisan (AND) dari filter yang
  berlaku untuknya saja.
- Popup selalu memakai cakupan yang sama dengan kartunya.

## Server (`apps/server/src/services/mbkm/`)

- [x] `mbkmCards.js`:
  - [x] Ganti `MBKM_PARAMS` dengan `CARD_PARAMS` (fakultas, programStudi,
        jenisAktivitas, angkatan, jenjang, periode, tahunAjaran).
  - [x] Ubah `KPI_FILTER_SCOPE.jenis` jadi tanpa `jenisAktivitas`.
- [x] `mbkmCards.js`: tambah `cardQuery(query, card)`. Fungsi ini membuang
      `search` dan `statusAktivitas` untuk semua kartu, ditambah
      `jenisAktivitas` untuk `jenis`. Ini satu-satunya sumber aturan.
- [x] `mbkmCards.js`: `buildMbkmCards(population, jenisPopulation = population)`.
      Kartu `jenis` dihitung dari `jenisPopulation` dan, saat ada filter jenis,
      menambah `selected: [{ name, count, percentage }]`.
- [x] `mbkmSummary.js`:
  - [x] Muat populasi dengan `cardQuery(query, 'participation')`.
  - [x] Muat populasi kedua tanpa jenis hanya bila `jenisAktivitas` terisi.
- [x] `mbkmDetails.js`:
  - [x] `getMbkmDetail` memakai `cardQuery(query, card)`, supaya banner = kartu.
  - [x] `rateTrend` memakai jendela 5 tahun yang berakhir di Tahun Ajaran
        terpilih.
- [x] `mbkmList.js`: tetap memakai semua filter (cek saja, tanpa perubahan).
- [x] `controllers/mbkmController.js`: kunci cache `getOrLoad` summary/detail
      memakai query yang sudah dipangkas.

## Client (`apps/client/src/modules/mbkm/`)

- [x] `mbkmService.js` / `mbkmQueries.js`: summary dan detail tidak mengirim
      `search` dan `statusAktivitas`, supaya mengetik di Cari hanya memuat ulang
      tabel.
- [x] `hooks/useMbkmKpiDisplay.js`: tambah klausa filter yang tidak berlaku,
      misalnya "Filter pencarian dan status aktivitas hanya menyaring tabel.".
      Turunkan dari `activeFilterParams` minus `kpiFilterScope[card]`, dan tiru
      tata bahasa `ignoredFiltersClause`
      (`modules/graduates/utils/filterScope.js`).
- [x] `hooks/useMbkmKpiDisplay.js`: kalimat jenis terpilih di kartu Bentuk
      Kegiatan, misalnya "Magang/Praktik Kerja dipilih: 67 mahasiswa (51%).".
- [x] `hooks/useMbkmKpiDisplay.js`: export `scopeSentence` untuk popup.
- [x] `components/modals/MbkmBreakdownModal.jsx`: banner = kalimat cakupan +
      kalimat kartu + klausa filter yang tidak berlaku. Petakan key URL
      `faculty`/`prodi`/`jenisAktivitas`.
- [x] `pages/MbkmPage.jsx`: pastikan badge `Terfilter` per kartu benar lewat
      `kpiScope.<card>`. Seharusnya tanpa kode baru.

## Dokumentasi

- [x] ADR baru `docs/adr/0007-mbkm-card-filter-scope.md` berisi tabel aturan (nomor 0006 sudah dipakai ADR Graduate).
      ADR ini menggantikan bagian cakupan filter di ADR 0003 dan 0005, termasuk
      kontradiksi soal Mitra.
- [x] `docs/ARCHITECTURE.md`: perbarui bagian "MBKM Data population, cards, and
      details".

## Tes

- [x] Server, `apps/server/tests/unit/services/mbkmAnalytics.test.js`:
  - [x] search/status tidak mengubah kartu maupun detail;
  - [x] jenis mengubah pembilang tapi tidak penyebut;
  - [x] kartu jenis mengabaikan filter jenis dan mengisi `selected`;
  - [x] jendela `rateTrend` mengikuti Tahun Ajaran terpilih;
  - [x] `KPI_FILTER_SCOPE` sesuai tabel.
- [x] Client, `tests/dashboardPages.test.jsx`: perbarui `ACTIVITY_PARAMS` dan
      `filterCases`.
  - [x] cari/status: tidak ada badge;
  - [x] jenis: 3 badge, Bentuk Kegiatan tidak;
  - [x] fakultas/periode: 4 badge.
- [x] Client, `tests/kpiDisplayHooks.test.js`: klausa filter yang tidak berlaku
      dan kalimat jenis terpilih.
- [x] Client, `tests/mbkmModals.test.jsx`: banner memuat cakupan.

## Verifikasi

- [x] `pnpm --filter server test`, `pnpm --filter client test`, dan eslint di
      `apps/client`.
- [x] Browser `/mbkm`:
  - [x] Cari NIM: hanya tabel berubah, tanpa badge, kartu tidak loading.
  - [x] Status Diajukan: kartu tetap, tabel menyaring, kartu menyebut bahwa
        status hanya untuk tabel.
  - [x] Jenis Magang: Partisipasi menjadi "… mengikuti Magang", Total/Mitra
        menyala, Bentuk Kegiatan tidak menyala dan menyorot Magang.
  - [x] Fakultas + Prodi + Jenis sekaligus: irisan benar, banner tiap popup =
        kartunya, tren berakhir di Tahun Ajaran terpilih.

## Revisi review (2026-10-30)

Temuan saat review implementasi pertama, semuanya sudah diperbaiki:

- `createFilterService` kehilangan `toQueryString`, sehingga 42 tes client gagal
  dan halaman Students/Graduates ikut rusak. Fungsi itu dikembalikan, lalu
  ditambah `toCardQueryString` untuk kunci query summary dan detail.
- Klausa "hanya menyaring tabel" membaca `filters.search`, padahal key-nya
  `searchQuery`, jadi klausa pencarian tidak pernah tampil. Kartu Bentuk
  Kegiatan juga belum memakai klausa ini.
- Kartu tetap jadi skeleton selama debounce pencarian. Ditambah prop
  `searchFiltersCards={false}` di `DashboardPage` untuk MBKM.
- `selected` di kartu jenis dihitung dari populasi yang salah: persentasenya
  100% di summary, dan di popup berisi semua jenis. Sekarang `selected` diambil
  dari daftar jenis tanpa filter jenis, persentasenya terhadap semua partisipan.
- `rateTrend` mengambil 5 tahun setelah tahun terpilih, karena opsi urut menurun
  dan hanya berisi 5 tahun terakhir. Sekarang memakai `getAcademicYearWindow`
  dari tahun ajaran periode terpilih.
- Cache detail membuat satu namespace per kombinasi filter. Batas
  `MAX_ENTRIES` berlaku per namespace, jadi jumlah namespace tumbuh tanpa batas.
  Sekarang satu namespace per kartu, dan kuncinya tetap memuat jenis untuk
  `selected`.
- Dua populasi di summary dimuat berurutan. Sekarang paralel, bersama opsi
  filter.
- Logika banner popup diduplikasi. Sekarang memakai `scopeSentence` dan
  `tableOnlyClause` yang sama dengan kartu. Daftar filter khusus tabel ada di
  satu tempat: `MBKM_TABLE_ONLY_FILTERS` (`packages/shared/src/constants.js`).
- ADR bentrok dengan nomor 0006 yang sudah dipakai ADR Graduate, dan ditulis
  dalam bahasa Indonesia. Dipindah ke ADR 0007 berbahasa Inggris; ADR 0003 dan
  0005 ditandai "Superseded in part".
- Tes server baru untuk aturan cakupan, `selected`, popup, dan jendela tren
  ditambahkan. Kasus cari/status/tahunAjaran di `dashboardPages` dikembalikan
  dengan asersi "tidak dikirim ke summary, tanpa badge".
