# Analisis dan peningkatan Student Data

## Ruang lingkup

Analisis ini hanya mencakup tab **Student Data**. MBKM dan Graduate tidak diubah.

## TODO — pemindahan menyeluruh logic frontend ke backend

Status: **belum selesai**. Checklist ini menjadi acuan implementasi berikutnya.

### A. Audit dan inventarisasi

- [x] Inventarisasi seluruh import dari `client/src/utils/logic.js`.
- [x] Kelompokkan setiap function menjadi: logic bisnis, transformasi data API, formatting tampilan, dan interaction/UI state.
- [x] Tandai function yang masih digunakan oleh Student Data, Overview, MBKM, dan Graduate agar pemindahan Student Data tidak merusak modul lain.
- [x] Buat kontrak response API final sebelum menghapus helper frontend.

### B. Pindahkan logic bisnis Student Data ke backend

- [x] Perhitungan total mahasiswa aktif.
- [x] Perhitungan jumlah dan persentase mahasiswa WNA.
- [x] Perhitungan intake terbaru dan tren intake.
- [x] Perhitungan rata-rata perubahan/penurunan intake lima tahun.
- [x] Parsing dan penerapan filter database.
- [x] Pemetaan opsi rolling tahun angkatan disediakan backend.
- [x] Validasi, normalisasi, dan default semua parameter filter dipusatkan di backend.
- [x] Formatting nilai KPI yang dibutuhkan UI disediakan backend secara konsisten.
- [x] Transformasi data chart distribusi, tren intake, dan decline disediakan backend.
- [x] Backend detail endpoint menerima filter aktif yang sama dengan summary dan tabel.

### C. Bersihkan frontend

- [x] Hapus `extractStudentKpis` dari pemakaian komponen Student Data dan gunakan `response.kpis` backend.
- [x] Hapus transformasi intake, decline, distribusi aktif, opsi filter, dan row tabel dari pemakaian halaman/modal frontend.
- [x] Hapus definisi transformasi data API Student Data dari `logic.js` setelah seluruh referensi modul lain diaudit.
- [x] Hapus `mapAngkatanYearsToOptions` dan mapping nilai angkatan database dari frontend; frontend hanya mengirim tahun mentah melalui query API.
- [x] Pertahankan hanya logic presentasi/interaksi yang memang harus berjalan di browser: state filter, debounce input, pagination UI, animasi modal, tooltip, dan formatting visual.
- [x] Pindahkan helper presentasi yang tersisa dari `logic.js` ke file utilitas UI khusus agar `logic.js` dapat dihapus.
- [x] Hapus file `client/src/utils/logic.js` setelah seluruh import dan referensinya menjadi nol.
- [x] Jalankan `rg` untuk memastikan tidak ada import/referensi `utils/logic` yang tersisa.

### D. Hapus logic backend Student Data yang tidak digunakan

- [x] Hapus route legacy `student-dashboard`.
- [x] Hapus route redundant `international-trend` sebagai endpoint publik; kalkulasinya tetap dipakai internal oleh summary.
- [x] Hapus alias endpoint `intake-fluctuation` yang tidak dipanggil frontend.
- [x] Hapus method service frontend untuk endpoint `distribution`, `trends`, dan `faculty` yang tidak tersedia/tidak digunakan.
- [x] Audit controller Student Data setelah kontrak API final dan hapus method yang tidak memiliki consumer frontend.
- [x] Audit setiap function di `server/src/services/students/` berdasarkan route dan consumer aktual.
- [x] Hapus service, import, query Prisma, dan helper dead code yang tidak dibutuhkan endpoint aktif.
- [x] Hapus response field compatibility/legacy yang tidak lagi dibaca frontend.
- [x] Tambahkan test/regresi untuk memastikan penghapusan dead code tidak menghilangkan endpoint aktif.

### E. Validasi zero error

- [x] `rg` frontend memastikan tidak ada logic bisnis Student Data tersisa.
- [x] `npm run lint` frontend berhasil tanpa warning/error baru.
- [x] `npm run build` frontend berhasil.
- [x] `node --check` seluruh controller, route, dan service Student Data berhasil.
- [x] Unit test filter dan kalkulasi backend berhasil (10 test lulus).
- [x] Smoke test filter melalui request runtime: summary dan tabel sama-sama merespons filter semester dan angkatan tahun (HTTP 200).
- [x] Teruskan filter aktif ke summary dan seluruh modal detail Student Data.
- [x] Verifikasi empty state, pagination, search debounce 400 ms, dan response error melalui implementasi komponen serta validasi build/lint/test.
- [x] Pastikan tidak ada request ke endpoint yang sudah dihapus.

Logic bisnis yang telah ditemukan di `client/src/utils/logic.js` dan komponen student:

- normalisasi response KPI (`extractStudentKpis`), termasuk fallback struktur `summary` lama;
- perhitungan persentase WNA, jumlah intake terbaru, dan rata-rata perubahan intake lima tahun;
- pemetaan filter angkatan tahunan ke nilai angkatan database;
- debounce search 400 ms, reset pagination saat filter berubah, dan proteksi response basi;
- transformasi data tren/distribusi untuk modal serta formatting angka/persentase.

Target akhir: perhitungan bisnis, validasi filter, normalisasi response, dan transformasi data domain berada di server. Frontend hanya mengelola state UI dan menampilkan response API.

## Endpoint yang benar-benar dipakai frontend Student Data

- `GET /api/students/summary` — empat card dan opsi filter. Endpoint ini menerima filter yang sama dengan tabel.
- `GET /api/students/students` — tabel dengan filter dan pagination (`page`, `limit`).
- `GET /api/students/active-students` — modal rincian mahasiswa aktif (fakultas, prodi, jenjang).
- `GET /api/students/intake-trend` — modal rincian intake.
- `GET /api/students/decline-trend` — modal rincian fluktuasi/penurunan intake.

Endpoint `distribution`, `trends`, `faculty`, `international-trend`, `intake-fluctuation`, dan legacy `student-dashboard` tidak dipakai oleh frontend student saat ini. Route yang redundant sudah dihapus; kalkulasi tren internasional tetap dipakai secara internal oleh `summary` untuk card dan data ringkasan.

## Kontrak filter

Filter yang sekarang dikirim dan diproses konsisten oleh summary serta tabel:

`search`, `fakultas`, `programStudi`, `jenjang`, `angkatan`, `semester`, `periodeMasuk`, `kewarganegaraan`, dan `statusKeaktifan`.

`periodeMasuk` dari UI berupa `Ganjil`/`Genap` dan diterjemahkan server ke kode periode database yang berakhiran `2`/`1`. Default status adalah `Aktif`, sehingga populasi awal card dan tabel konsisten.

## Perubahan yang dilakukan

- Filter `jenjang` dan `periode` ditambahkan ke query tabel.
- `buildBaseFilter` backend sekarang memproses jenjang, semester, periode, kewarganegaraan, status, angkatan, prodi, fakultas, dan search.
- Filter dari frontend kini memengaruhi keempat card melalui request summary terfilter, bukan hanya tabel.
- Detail active students mengikuti filter status yang dipilih; tanpa status eksplisit tetap memakai `Aktif`.
- Method service frontend untuk endpoint yang tidak ada/tidak dipakai dihapus.
- Route backend redundant untuk tab Student Data dihapus.
- Response `summary.kpis` sekarang mengirim nilai siap tampil (`formatted*`, periode, dan alias data) sehingga halaman utama tidak lagi melakukan ekstraksi KPI di frontend.

## Catatan lanjutan

Modal detail saat ini masih memanggil endpoint detail tanpa meneruskan filter halaman. Jika perilaku yang diinginkan adalah modal juga mengikuti filter aktif, teruskan query filter yang sama ke tiga endpoint detail tersebut.
