# TODO: Graduate Data: kartu Rata-rata Masa Studi Lulusan (termasuk cuti)

- Status: rencana, belum dieksekusi (menunggu instruksi user).
- Dibuat: 2026-10-28
- Cakupan: rumus `requirements/FORMULA.md` §7, riwayat cuti dari SEVIMA,
  kartu ke-5 Graduate Data, dan tata letak 5 kartu.

## Tujuan

Menampilkan rata-rata masa studi lulusan per jenjang untuk Tahun Lulus
terpilih, dengan maksimal 2 semester cuti dikurangkan (batas cuti di i3L),
sebagai kartu baru tanpa membuat tata letak halaman berantakan.

## Keputusan user (2026-10-28)

- Dibuat **kartu ke-5**, bukan digabung ke Tepat Waktu.
- Tata letak 5 kartu harus rapi, tidak ada slot kosong, dan memakai DESIGN.md
  serta antislop.
- **Cuti:** maksimal 2 semester cuti dikurangkan. Cuti ke-3 dan seterusnya
  tetap dihitung. Aturan ini **hanya untuk kartu Masa Studi**; Tepat Waktu dan
  Keberhasilan Studi tetap memakai ADR 0004 tanpa pengurangan cuti.
- **Pindah prodi/mutasi:** masa studi dihitung dari awal di i3L
  (`periodeMasukAwal`, lalu `periodeMasuk`). Semester di kampus asal tidak
  dihitung.
- **Semester pendek (`YYYY3`)** tidak dihitung sebagai semester. Akhir
  studinya dibaca sebagai Genap tahun itu (`20203` → `20202`).
- Pakai `/kelulusan` dan `/mahasiswa`, karena 5 lulusan tidak ada di
  `/kelulusan`.

## Hasil analisis (graphify `7dd41c6`, kode, dan API GET saja)

1. **Semester dihitung project, bukan dari API.**
   - `hitungSemester` (`controllers/sync/academicPeriod/semester.js`) dan
     `studySemesters` (`utils/academic/period.js`, ADR 0004) memakai rumus
     `(tahunAkhir − tahunMasuk) × 2 + (termAkhir − termMasuk) + 1`.
   - Awal studi: `periodeMasukAwal`, yang diisi `transferSemester.js` →
     `buildAwalMap` (rantai pindah prodi di i3L: orang sama, jenjang sama,
     berstatus Transfer/Mutasi, bersambung), lalu `periodeMasuk`.
2. **Periode lulus.** `/kelulusan.id_periode_akademik` (100% terisi) disimpan
   sebagai `graduates.periodeWisuda` (`mapGraduateRow.js`). Nilai ini ada pada
   1127 dari 1132 lulusan.
3. **Selisih 5 lulusan.**
   - `controllers/sync/manualGraduates.js` (`MANUAL_GRADUATES`, hardcode) berisi
     5 NIM yang tidak pernah diterbitkan `/kelulusan`. `periodeWisuda` dan
     `tahunLulus` mereka kosong, jadi masa studi = null.
   - Di `students` (`/mahasiswa.id_periode_terakhir`) kelimanya punya periode
     terakhir `20203`, `20213`, dan `20223` (semester pendek).
4. **Cuti.**
   - `/mahasiswa` tidak punya status cuti. Project mengambilnya dari
     `/perwalian` (`studentCuti.js` → `fetchCutiNims`), hanya untuk periode
     berjalan. Batas ini tercatat sebagai shortcut di `syncStudents.js`.
   - Uji GET: `/perwalian?f-id_periode=P&f-id_status_mahasiswa=C` menyimpan
     riwayat periode lampau. Hasilnya 0–8 baris per periode (2017–2026), cukup
     satu halaman per periode.
   - Semester cuti per mahasiswa = jumlah periode tempat NIM-nya muncul dengan
     status C.
5. **Endpoint yang tidak dipakai:** `/mahasiswa/{id}/aktivitas` selalu kosong,
   dan `/lulusan` tidak ada (404). `/mahasiswa` tidak punya IPK/SKS lulus.

## Task

### Fase 1: Riwayat cuti saat sync mahasiswa

- [ ] `studentCuti.js`: `fetchCutiHistory(periods)`. Untuk setiap periode
      Ganjil/Genap dari periode masuk paling awal di data sampai periode
      berjalan, panggil `/perwalian` dengan status C. Hasilnya
      `Map(nim → Set(periode))`, memakai `paginateSevimaPages`. - Paralel terbatas. - Kalau gagal, sync tetap jalan dan nilai lama dipertahankan.
- [ ] Schema: `Student.semesterCuti Int @default(0)`. Butuh `db push`
      (kolom baru) dengan persetujuan user saat eksekusi (ADR 0002).
- [ ] `syncStudents.js`: isi `semesterCuti` per baris. Status Cuti periode
      berjalan tetap memakai `fetchCutiNims`.
- [ ] Tes: baris ganda per NIM digabung, dan periode gagal tidak
      mengosongkan data.

### Fase 2: Akhir studi untuk 5 lulusan tanpa `/kelulusan`

- [ ] `studySemesters(student, graduate)` urutan akhirnya menjadi: 1. `graduate.periodeWisuda`; 2. `student.periodeTerakhir`; 3. `tahunLulus` sebagai Genap.
- [ ] `YYYY3` dibaca Genap tahun itu, tanpa menambah semester.
- [ ] Laporkan selisih Tepat Waktu dan Keberhasilan Studi sebelum dan sesudah
      (5 lulusan ikut terhitung).
- [ ] Tes: fallback `periodeTerakhir`, `YYYY3`, dan data tidak lengkap = null.

### Fase 3: Perhitungan masa studi (server)

- [ ] `services/graduates/masaStudi.js` mengikuti pola `tepatWaktu.js`. - Masa studi = `studySemesters(...) − min(semesterCuti, 2)`. - Data tidak lengkap dikeluarkan dari pembagi. - Populasi = lulusan Tahun Lulus terpilih dengan `GRADUATE_PARAMS`.
- [ ] `graduateCards.js`: kartu `studyLength`. - `byJenjang`: rata-rata semester, jumlah lulusan, jumlah yang
      dikurangi cuti. - Nilai utama = jenjang dengan lulusan terbanyak (pola
      `studySuccessCard`). - Kosong = null.
- [ ] `graduateSummary.js`: kartu dan `kpiFilterScope.studyLength`.
- [ ] Endpoint detail mengikuti pola `/graduates/tepat-waktu`: - sebaran jumlah semester per jenjang; - rata-rata per prodi; - tren 5 Tahun Lulus.
- [ ] Tes: - rata-rata per jenjang; - cuti 0, 1, dan 3 (dibatasi 2); - pindah prodi memakai `periodeMasukAwal`; - data tidak lengkap dikeluarkan.

### Fase 4: Client dan tata letak 5 kartu (DESIGN.md + antislop core + antislop-layoutmobile)

- [ ] `GraduatesPage.jsx`: urutan Total Lulusan, Rata-rata IPK, **Rata-rata
      Masa Studi**, Tepat Waktu, Keberhasilan Studi.
- [ ] `MetricSummaryGrid.jsx`, cabang 5 kartu. Tidak boleh ada slot kosong di
      lebar mana pun.

      | Lebar | Grid | Susunan |
      | --- | --- | --- |
      | Ponsel | 1 kolom | bertumpuk |
      | Tablet (sm) | 2 kolom | 2 + 2 + 1, kartu terakhir `sm:col-span-2` |
      | Desktop (lg) | 6 kolom | 3 kartu × `col-span-2`, lalu 2 kartu × `col-span-3` |

      Span dikirim lewat `className` `StatCard`. Halaman 3/4 kartu tidak
      berubah.

- [ ] Kartu: - nilai "8.3 semester" (`formatDecimal(·, 1)`); - subjudul "Lulusan S1 rata-rata 8.3 semester (4.2 tahun), setelah
      dikurangi maksimal 2 semester cuti. Rincian: S2 4.1 semester."; - tanpa em dash; - kalimat kosong sama dengan kartu lain.
- [ ] `useGraduateKpiDisplay.js` (subtitle) dan modal baru mengikuti modal
      Graduate yang ada.
- [ ] Tes: - 5 kartu dan urutannya; - kelas span; - subtitle dan kosong; - halaman 4 kartu (Student, MBKM) tidak berubah.

### Fase 5: Dokumentasi dan verifikasi

- [ ] ADR 0004: akhir studi membaca `periodeTerakhir`, dan `YYYY3` dibaca
      Genap.
- [ ] ADR 0006: riwayat cuti dari `/perwalian` dan aturan maksimal 2 cuti
      (khusus Masa Studi).
- [ ] `docs/ARCHITECTURE.md` (matriks filter Graduate), CHANGELOG, dan
      FORMULA.md §7 (sumber cuti).
- [ ] `pnpm verify`; user menjalankan sync mahasiswa dan kelulusan.
- [ ] Probe ulang (GET, angka agregat): jumlah periode cuti per lulusan.
- [ ] Browser (playwright-cli): - screenshot di 375, 768, 1024, dan 1440 px; - tidak ada slot kosong dan tidak ada scroll horizontal; - tinggi kartu rata; - Delivery Gate antislop.

## Di luar cakupan (dicatat)

- `MANUAL_GRADUATES` berisi hardcode IPK/SKS dan nama mahasiswa di komentar
  kode, padahal repo GitHub masih publik. `/perwalian` punya `ipk_lulus` dan
  `sks_lulus` per periode, jadi daftar ini bisa diganti data API. Usulan:
  tugas terpisah di Fase S (keamanan).
- Cuti yang tercatat di NIM lama rantai pindah prodi tidak dijumlahkan ke NIM
  baru. Batasnya: hanya NIM lulusan itu.
