# Audit dan Perbaikan Student Data

Tanggal audit: 25 September 2026

## Cakupan

Audit mencakup alur Student Data pada frontend dan backend:

- Filter dan serialisasi query.
- Validator query dan Prisma filter builder.
- Empat KPI pada halaman Student Data.
- Tabel mahasiswa dan pagination.
- Endpoint rincian mahasiswa aktif, internasional, intake, dan fluktuasi 5 tahun.
- Sinkronisasi konteks status mahasiswa dan periode akademik.

## Temuan dan perbaikan

### 1. Default status tabel tidak sama dengan KPI

KPI menggunakan default `statusKeaktifan = Aktif`, sedangkan tabel sebelumnya tidak mengirim status ketika filter masih default. Akibatnya tabel dapat menampilkan seluruh status sementara KPI hanya menghitung mahasiswa aktif.

Perbaikan dilakukan di `server/src/services/students/filterBuilder.js`: tabel sekarang juga menggunakan `Aktif` ketika status tidak dikirim.

### 2. `Semua Status` masih terkena fallback `Aktif`

Saat pengguna memilih `Semua Status`, frontend mengirim marker internal `__ALL__`. Sebelumnya filter ini menjadi filter kosong sehingga service KPI mengaktifkan fallback `Aktif`, khususnya pada perhitungan mahasiswa internasional.

Perbaikan:

- `client/src/modules/students/services/studentsService.js` mengirim `statusKeaktifan=__ALL__` untuk kondisi semua status.
- `server/src/services/students/filterBuilder.js` mengubah marker tersebut menjadi filter Prisma yang tidak membatasi status.
- Service KPI tidak lagi mengaktifkan fallback `Aktif` pada kondisi tersebut.

Dengan demikian kombinasi seperti `Kewarganegaraan = WNA` dan `Status = Semua Status` memakai populasi yang sama pada tabel dan seluruh KPI.

### 3. Filter pencarian hilang pada kondisi `Semua Status`

Filter builder sebelumnya melakukan return lebih awal ketika menerima marker `__ALL__`. Akibatnya parameter setelah status, termasuk pencarian, tidak diproses.

Perbaikan dilakukan dengan tetap melanjutkan pipeline filter setelah status diproses.

### 4. Filter checkbox multi-pilihan

Filter berikut sekarang mendukung beberapa pilihan sekaligus:

- Fakultas
- Program Studi
- Jenjang
- Semester
- Status Keaktifan
- Angkatan

Kewarganegaraan dan Periode Masuk tetap single-select karena masing-masing memiliki dua pilihan utama.

Frontend mengirim query berulang, misalnya `fakultas=A&fakultas=B`, dan backend memprosesnya sebagai Prisma `in`.

### 5. Status default dan semua status pada UI

- Default status tetap `Aktif`.
- `Aktif` ditampilkan sebagai nilai default normal.
- `Semua Status` adalah checkbox di bagian atas daftar.
- Memilih `Semua Status` mengaktifkan tombol reset dan menghapus pembatasan status.

### 6. Tren periode akademik terbaru

Periode seperti `20261` sekarang dinormalisasi menjadi `2026/2027` meskipun belum ada `20262`. Data terbaru langsung ikut dalam tren.

Tabel fluktuasi juga mengambil satu periode tambahan sebagai pembanding agar tahun tertua pada tabel 5 tahun tetap dapat memiliki persentase perubahan.

### 7. KPI Mahasiswa Aktif pada `Semua Status`

`Semua Status` berlaku untuk tabel, tetapi tidak boleh mengubah definisi KPI `Mahasiswa Aktif`. Sebelumnya filter semua status diteruskan ke KPI sehingga card menghitung seluruh mahasiswa.

Perbaikan dilakukan dengan helper `buildActiveKpiFilter()` pada controller. Jika status yang dipilih adalah `__ALL__`, KPI student body dan KPI mahasiswa internasional tetap menggunakan `statusKeaktifan = Aktif`, sementara filter dimensi lain tetap diterapkan. Endpoint rincian aktif dan internasional menggunakan aturan yang sama.

## Kontrak populasi data

| Kondisi status | Tabel | KPI student body/internasional | KPI intake/fluktuasi |
|---|---|---|---|
| Default | Aktif | Aktif | Riwayat intake sesuai aturan intake |
| Status tertentu | Status terpilih | Status terpilih | Filter dasar yang sama |
| Semua Status | Semua status | Semua status | Filter dasar yang sama |

## Validasi

- Frontend lint berhasil.
- Frontend production build berhasil.
- Backend test: 9 file dan 47 test berhasil.

## Catatan operasional

Setelah perubahan backend, restart server agar filter builder dan service terbaru aktif. Data periode terbaru juga harus sudah masuk melalui proses sinkronisasi.
