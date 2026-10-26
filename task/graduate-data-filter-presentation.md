# TODO: Graduate Data — perhitungan, presentasi multi-filter, bug, dan pemisahan logika

- Status: bug 1–11 dan 13 diperbaiki, Fase 0 selesai (2026-10-26). selesai (2026-10-26), Fase 0–4 dan bug 1–13.
- Dibuat: 2026-10-26
- Cakupan: card KPI, popup "Lihat Rincian", dan service di tab Graduate Data.
  Student Data dan MBKM hanya tersentuh lewat komponen bersama (reset filter,
  CohortTrendChart).

## Tujuan

Halaman Graduate Data (`apps/client/src/modules/graduates`, server
`apps/server/src/services/graduates`) sudah punya 4 card dan 4 popup, tetapi:

- ada **bug perhitungan** (Tepat Waktu off-by-one, card ≠ modal, D3/D4 null);
- **logika domain bocor ke frontend** (jendela 5 tahun, tahun default, jenjang
  utama, urutan S1-dulu, batas studi, aturan cohort vs event);
- **S1/S2 di-hardcode** di server dan client, melanggar AGENTS §5.2 "Jenjang is dynamic";
- popup tidak menyesuaikan bentuk saat 2–5+ filter aktif.

Hasil akhir yang diinginkan: setiap kombinasi filter menghasilkan angka yang benar
dan konsisten antara card dan popup. Server memegang semua keputusan domain,
client hanya merender dan menyusun teks.

Keputusan user (2026-10-26):

1. Masa studi dihitung **per semester** dari periode masuk ke periode lulus.
2. Keberhasilan Studi = lulus **dalam batas masa studi**: S1 ≤ 8 thn, S2 ≤ 4,
   Profesi ≤ 2. Angkatan yang dievaluasi tetap **TA − batas** (S1 jadi TA − 8).
3. D3/D4 memakai standar nasional: tepat waktu 3/4 thn, masa studi maksimum 5/7 thn.
4. **Semua keputusan domain pindah ke server**; client tidak menghitung apa pun.

## Matriks filter → card (berlaku sekarang, dipertahankan)

Filter cohort: Search, Fakultas, Prodi, Jenjang, Angkatan, Tahun Ajaran (TA).
Filter event: Tahun Lulus (default = tahun lulus terbaru), Predikat, Periode Lulus.

| Filter                                 | Total Lulusan  | Rata-rata IPK | Tepat Waktu | Keberhasilan Studi       |
| -------------------------------------- | -------------- | ------------- | ----------- | ------------------------ |
| Search / Fakultas / Prodi / Jenjang    | on             | on            | on          | on                       |
| Angkatan                               | on             | on            | on          | on (angkatan dievaluasi) |
| TA tanpa Tahun Lulus                   | kumulatif ≤ TA | kumulatif     | kumulatif   | on (jangkar TA − batas)  |
| Tahun Lulus (eksplisit menang atas TA) | on             | on            | on          | **off**                  |
| Predikat / Periode Lulus               | on             | on            | on          | **off**                  |

Angka = AND semua filter dalam scope. Badge "Terfilter" = OR (dari `kpiFilterScope`).

## Aturan presentasi (sama polanya dengan Student Data)

- **R1 Angka:** AND, seperti di atas.
- **R2 Tab satu kategori disembunyikan:**
  - 1 jenjang → hanya tab jenjang itu.
  - 1 predikat → tab Distribusi Predikat hilang.
  - 1 prodi/fakultas → tab Per Prodi/Fakultas hilang.
  - Tab jenjang tanpa data tidak pernah muncul (hilangkan "tab hantu" S1/S2).
- **R3 Nilai utama card (diputuskan server):**
  - Total = jumlah.
  - IPK = rata-rata tertimbang semua lulusan dalam scope.
  - Tepat Waktu = rate tertimbang (sudah ada `overall`).
  - Keberhasilan = jenjang dengan kohort terbesar. Kohort tiap jenjang berbeda,
    jadi rata-rata gabungan tidak bermakna. Jenjang lain tampil di subtitle.
  - 1 jenjang terpilih → nilai jenjang itu.
- **R4 Kombinasi kosong/kontradiktif** (mis. Angkatan 2024 + Tahun Lulus 2023, atau
  predikat yang tidak ada di prodi itu):
  - Server mengirim `isEmpty` per card.
  - Card menampilkan "–" + "Tidak ada lulusan untuk kombinasi filter ini".
  - Keberhasilan tetap dihitung (filter cohort) dan subtitle menyebut angkatan yang dievaluasi.
- **R5 null ≠ 0:** null (tidak ada data/aturan) tampil "–"; 0 tampil "0" / "0%".
- **Jendela:** chart per tahun = 5 tahun lulus / 5 angkatan, berakhir di tahun
  terpilih. Pilihan Tahun Lulus selain default → tampil apa adanya. **Diterapkan di
  server**, client tidak memotong data.
- **Multi angkatan di Keberhasilan:** card = agregat angkatan terpilih yang sudah
  bisa dievaluasi (Σ lulus dalam batas / Σ masuk). Modal menampilkan tepat angkatan terpilih.

## Bug yang diperbaiki

| #   | Bug                                                                                                                       | Lokasi                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | Tepat Waktu off-by-one: lulus semester ke-9 dihitung tepat waktu (`lamaStudi ≤ batas` berbasis tahun)                     | `services/graduates/tepatWaktu.js:31-35`                         |
| 2   | Card pakai `periodeMasuk` sebagai awal studi, modal pakai `angkatan`                                                      | `tepatWaktu.js:40-41`                                            |
| 3   | Keberhasilan menghitung semua yang akhirnya lulus (tanpa batas waktu); kohort dari tahun `periodeMasuk`, bukan `angkatan` | `keberhasilanStudi.js:32,167-200`                                |
| 4   | D3/D4 tanpa batas → null + tab hantu `[]`                                                                                 | `tepatWaktu.js:29`, `keberhasilanStudi.js:32`                    |
| 5   | `firstPresent`/`&&` memperlakukan 0% sebagai kosong                                                                       | `useGraduateKpiDisplay.js:86,99,178-201`, modal GPA/OnTime       |
| 6   | Tab S1/S2 selalu muncul; jenjang terpilih tanpa data → modal kosong                                                       | `graduateTrendConfig.js:48-76`, `useTabTransition.js:16`         |
| 7   | Label `PROFESI` (harus `Profesi`)                                                                                         | `totalTrendBars.js:22` + 6 tempat lain                           |
| 8   | `sanitizeAcademicYear` membuang TA = tahun kalender (melanggar §5.1)                                                      | `useGraduateFilters.js:17`                                       |
| 9   | Efek ganti TA menimpa Tahun Lulus eksplisit; pertama kali dilewati                                                        | `useGraduateFilters.js:174-185`                                  |
| 10  | Reset filter ikut menghapus TA header                                                                                     | `hooks/useDashboardFilters.js` `resetFilters`                    |
| 11  | Banner Keberhasilan mencampur rate dari summary + angkatan dari detail                                                    | `StudySuccessModal.jsx:453-463`                                  |
| 12  | Dua sumber default tahun (summary.filterOptions vs `/filter-options`)                                                     | modal + `graduateSummary.js:52`                                  |
| 13  | Pembulatan tidak konsisten (`toFixed`, rate mentah, persen 0 vs null)                                                     | `ipkTrend.js`, `tepatWaktu.js:191`, `graduateDistribution.js:24` |

## Task implementasi

### Fase 0 — Aturan domain di server (angka berubah, ADR wajib)

- [x] Helper baru satu tempat `studySemesters(student, graduate)` di
      `apps/server/src/utils/academic/period.js`. Dihitung dari `periodeMasukAwal || periodeMasuk`
      ke `graduate.periodeWisuda`: `(yL−yM)×2 + (tL−tM) + 1`. Fallback berbasis tahun
      (`(startLulus−startMasuk)×2`) bila periode lulus kosong. Dipakai Tepat Waktu dan Keberhasilan.
- [x] Satu tabel batas di `packages/shared/src/constants.js` (dibaca server):
      `STUDY_LIMITS = { S1: {onTime: 4, max: 8}, S2: {2, 4}, Profesi: {1, 2}, S3: {3, 6}, D3: {3, 5}, D4: {4, 7} }`.
      Gantikan `BATAS_STUDI_TEPAT_WAKTU` dan `COHORT_EVALUATION_LAG`. Kunci jenjang
      dinormalisasi lewat `normalizeJenjang` yang sudah ada di `filterBuilder.js:219`.
- [x] Tepat Waktu: `semesters ≤ onTime × 2`. Card dan modal memakai populasi dan awal studi yang sama.
- [x] Keberhasilan: kohort = `student.angkatan`, pembilang = lulus dengan `semesters ≤ max × 2`,
      angkatan dievaluasi = TA − `max`.
- [x] `docs/adr/0004-graduate-study-length.md`. Update AGENTS §5.2 bila perlu, dan
      `requirements/FORMULA.md` secara lokal (folder ini tidak di-commit).
- [x] Tes: semester ke-8 vs ke-9, Profesi 2 vs 3 semester, fallback tanpa periode,
      D3/D4, lulus > 8 tahun tidak dihitung berhasil.

### Fase 1 — Kontrak API dinamis + DRY di server

- [x] Summary `kpis` per card: `{ value, isEmpty, headlineJenjang, byJenjang: [{ jenjang, label, value, count }] }`.
      Urutan dan label (`Sarjana (S1)`, `Profesi`, …) ditentukan server. Hapus `totalGraduatesS1/S2`,
      `averageGpaS1/S2`, `onTimeGraduationRateS1/S2`, `studySuccessRateS1`.
      Update `packages/shared/src/contracts.js`.
- [x] Detail endpoint mengirim:
  - `jenjangs: [{ jenjang, label, batas }]` (daftar tab, hanya yang berdata);
  - deret yang **sudah dijendela**;
  - `ipkCount`, dan `angkatanEvaluasi` + rate dari sumber yang sama.
- [x] Server memutuskan "Tahun Lulus = default" (sama dengan `rollingYears[0]`) untuk
      jendela tren. Hapus `withoutDefaultTahunLulus` dan `selectChartCohorts` di client.
- [x] Satukan:
  - aturan jangkar TA: `tahunAjaran.js:51` dan `yearJenjangSeries.js:253` → satu fungsi;
  - query `MAX(tahunLulus)` (dipakai 2×) → satu helper;
  - daftar jenjang (4 cara) → `getScopeJenjangs`;
  - pembulatan → `roundedRate` di semua tempat; penyebut 0 → `null`.
- [x] Tes: snapshot kontrak, card = total modal untuk filter yang sama, Profesi-only tanpa kunci s1/s2.
      Catatan: field lama (`totalGraduatesS1`, `averageGpaS1`, …) dan kunci
      `s1`/`s2` di payload popup masih dikirim berdampingan supaya client tetap
      jalan; dihapus di Fase 2 setelah client membaca `kpis.cards` dan `jenjangs`.

### Fase 2 — Client hanya render

- [x] `useGraduateKpiDisplay`, modal, dan `graduateTrendConfig` membaca `byJenjang` / `jenjangs` dari server.
      Hapus hardcode s1/s2, `jenjangName`, `JENJANG_LABEL`, sort S1-dulu, `firstPresent`,
      parsing `batas*`, operator `≤/=`, `hasStudySuccessData`.
- [x] Teks tetap di client (hanya tata bahasa). Pemisah daftar "A, B, dan C" memakai
      satu helper `Intl.ListFormat` di `utils/kpiLabels.js:8` (gantikan 3 salinan).
      `studySuccessClause` membaca `kpiFilterScope.studySuccess`, bukan daftar sendiri.
- [x] DRY:
  - `CohortTrendChart` (2 salinan) → satu komponen di `components/common/charts`;
  - `describeScope` ×3 → satu pemanggilan;
  - `toFixed` → `formatDecimal`;
  - `'Lulus'` → `STUDENT_STATUS.LULUS`.
- [x] Bug 5–12: sanitize TA tanpa tahun kalender. Efek TA hanya mengikuti bila nilai
      Tahun Lulus masih default. Reset hanya mengosongkan field yang punya `control`
      (berlaku juga untuk Students/MBKM).
      Selesai: field lama (`totalGraduatesS1`, `s1Gpa`, `batasStudiS1`, kunci
      paksa `s1`/`s2`, perlakuan khusus S1/S2) dihapus dari server dan kontrak;
      `summary` graduate kini `{}` dan `kpis` hanya `{ cards }`.

### Fase 3 — Presentasi multi-filter

- [x] R2 di semua popup (jenjang, predikat, prodi, fakultas), memakai pola
      `activeDistributions` dari Student Data.
- [x] Total Lulusan popup: tab baru **Per Program Studi** dan **Per Fakultas**
      (`DistributionChart`, radius sama, tooltip jalan).
- [x] R4 `isEmpty` dan pesan kombinasi kosong di card dan popup. R5 "–" vs "0".
- [x] Keberhasilan multi-angkatan: agregat di card, angkatan terpilih di popup.

### Fase 4 — Dokumentasi & verifikasi

- [x] `docs/ARCHITECTURE.md`: bagian "Graduate Data detail breakdowns under filters"
      (matriks + R1–R5 + batas studi). Juga `CHANGELOG.md` dan
      `task/graduate-data-filter-presentation.md` (format sama dengan task Student).

## File utama

- Server: `services/graduates/{tepatWaktu,keberhasilanStudi,graduateSummary,totalLulusan,ipkTrend,yearJenjangSeries,tahunAjaran,filterBuilder,graduateDistribution}.js`,
  `utils/academic/period.js`, `controllers/graduatesController.js`.
- Shared: `packages/shared/src/{constants,contracts}.js`.
- Client: `modules/graduates/hooks/{useGraduateKpiDisplay,useGraduateFilters}.js`,
  `modules/graduates/components/modals/*`, `modules/graduates/utils/filterScope.js`,
  `hooks/useDashboardFilters.js`, `components/common/charts/` (CohortTrendChart).

## Verifikasi

- `pnpm --filter @komet/server test`, `pnpm --filter @komet/client test`, `pnpm lint`,
  `pnpm format:check`, `pnpm build`.
- `RUN_DB_TESTS=1`: card = total modal untuk 8 kombinasi:
  1. default;
  2. prodi;
  3. jenjang Profesi;
  4. Tahun Lulus + predikat;
  5. Angkatan + Tahun Lulus + Periode;
  6. TA tanpa Tahun Lulus;
  7. Angkatan > Tahun Lulus (kosong);
  8. 5+ filter.
- Playwright (`playwright-cli open --browser=chromium`): tiap kombinasi di atas.
  Cek badge, nilai card, tab yang tampil, tooltip, ujung bar membulat, dan legend
  tidak menimpa bar saat popup pertama kali dibuka.

## Di luar cakupan

- Ambang predikat fallback berbeda untuk S2 (perlu konfirmasi BAAK).
- `getCurrentAcademicYear` di hook MBKM.
- Performa O(Y·J·N) `valuesByYearAndJenjang`, kecuali tersentuh saat penyatuan Fase 1.
