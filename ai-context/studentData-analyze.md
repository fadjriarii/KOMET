# Analisis dan Refactor Student Data

Tanggal audit: 25 September 2026  
Scope: `server/src` dan `client/src/modules/students`, termasuk shared utility yang dipakai Student Data.

## Ringkasan hasil

Student Data sudah memiliki pemisahan dasar yang benar: route menerima request, controller mengorkestrasi response, service menjalankan query/statistik, dan React menampilkan data. Sebelum audit ini, pemisahan tersebut belum sepenuhnya konsisten. Beberapa business rule dan pilihan filter masih dibuat di halaman React, controller terlalu banyak melakukan formatting response, dan sejumlah helper shared berisi fungsi dari beberapa konteks sekaligus.

Refactor tahap ini memindahkan metadata pilihan filter yang bersumber dari business rule ke backend. Endpoint `/api/students/summary` sekarang mengirim `nationalityOptions`, `periodeOptions`, dan `semesterOptions`; `StudentsPage` hanya menggunakan metadata backend tersebut.

## Arsitektur dan modularitas

Backend dipisah menjadi route, validator, controller, filter builder, dan service statistik/list. `filterBuilder.js` menjadi satu sumber filter Prisma untuk tabel dan statistik. Business rule seperti status aktif default, mapping Ganjil/Genap, WNI/WNA, pencarian, agregasi KPI, tren, dan decline berada di backend.

Frontend dipisah menjadi page composition, hooks request/state, service HTTP, filter input, modal, chart, dan shared presentation helpers. Frontend masih memiliki logic UI yang wajar: debounce, loading state, tab modal, label visual, dan urutan tampilan. Tidak ada formula domain atau query database di frontend.

Modularitas sudah baik pada level domain, tetapi belum sempurna. Modal chart terbesar masih menggabungkan konfigurasi Recharts, kolom tabel, tooltip, dan markup. Tahap berikutnya dapat memecahnya menjadi `studentModalConfig.js`, `StudentTrendChart.jsx`, `StudentTrendTooltip.jsx`, dan selector response khusus student.

## Perubahan yang dilakukan

1. Memperbaiki validasi Zod 4 menggunakan `error.issues`.
2. Meneruskan hasil query tervalidasi/tertransformasi ke controller.
3. Membatasi ukuran array filter dan page size untuk mencegah abuse.
4. Menambahkan timeout dan error handling aman pada API client.
5. Memindahkan opsi semester, kewarganegaraan, dan periode masuk dari hardcode React ke response backend.
6. Mempertahankan satu sumber filter di backend melalui `filterBuilder`.
7. Memeriksa referensi helper; `client/src/utils/logic.js` tidak dipakai dan sudah berada dalam status deleted dari perubahan lokal sebelumnya.
8. Membersihkan whitespace error pada `academicUtils.js`.
9. Menambahkan dokumentasi audit ini.

## Audit kode tidak terpakai

Shared helper tidak boleh dihapus hanya berdasarkan folder Student Data karena `uiHelpers.js` juga dipakai modul lain. Penghapusan aman harus berdasarkan seluruh repository. Helper khusus student yang benar-benar tidak direferensikan dapat dipindahkan ke `modules/students/utils`. Endpoint detail juga tidak boleh dihapus hanya karena modal bersifat lazy; endpoint tersebut adalah public contract halaman.

## Pagination

Batas 100 adalah jumlah record per request, bukan batas total data. Dataset satu juta mahasiswa tetap dapat dinavigasi melalui banyak halaman; setiap response hanya membawa maksimal 100 row. Pembatasan ini mencegah memory spike, response besar, timeout, dan abuse request.

Pagination sekarang memakai `skip/take`. Untuk dataset sangat besar, page jauh dapat semakin mahal. Roadmap yang tepat adalah mempertahankan maksimum 100 untuk UI, lalu menambahkan cursor pagination untuk export/infinite scroll dengan cursor stabil berbasis `periodeMasuk, nama, nim` dan index yang sesuai. Jangan mengirim seluruh dataset sekaligus.

## Keamanan dan deploy

Helmet, HPP, CORS allowlist, rate limit, timeout, validasi input, constant-time API key comparison, Prisma parameterized query, health check, dan production-safe error response sudah tersedia. `VITE_SYNC_API_KEY` bukan secret karena semua variable Vite masuk bundle browser; deployment publik sebaiknya memakai proxy/session/token scoped atau membatasi endpoint read-only.

## Verifikasi

- Backend: `npm test` — 5 test files, 41 tests passed.
- Frontend: `npm run lint` — passed.
- Frontend: `npm run build` — passed.
- `git diff --check` — passed.

Build hanya memberikan warning bundle JavaScript sekitar 709 KB. Code splitting modal/chart dengan `import()` adalah peningkatan deploy berikutnya.

## Implementasi rekomendasi lanjutan

Rekomendasi lanjutan sudah mulai diterapkan:

- Tab trend memakai konfigurasi bersama pada `studentTrendConfig.js`; tooltip generik tersedia pada `StudentTrendTooltip.jsx`.
- Validasi query, kombinasi filter, empty result, cursor query, dan contract controller sudah memiliki test terarah.
- Endpoint tabel menerima `cursor` dan mengembalikan `nextCursor` serta `hasNextPage`; pagination offset lama tetap kompatibel.
- Browser tidak lagi mengirim `VITE_SYNC_API_KEY`. Client membuat HttpOnly session cookie dari endpoint `/api/session/student`; API key tetap diterima sementara untuk server-to-server migration.
- Prisma mencatat query yang melampaui `SLOW_QUERY_MS` dan index primary key `nim` digunakan untuk cursor pagination.

## Rekomendasi berikutnya

1. Pecah modal trend menjadi komponen chart, tooltip, dan config bersama.
2. Tambahkan test controller untuk query invalid, kombinasi filter, empty result, dan pagination.
3. Tambahkan contract test response endpoint Student Data.
4. Tambahkan cursor pagination untuk dataset besar.
5. Hilangkan API key dari browser melalui backend-for-frontend atau session auth.
6. Tambahkan slow-query logging dan profiling index.

## Perbaikan koneksi local

Masalah koneksi browser diperbaiki di `client/src/services/apiClient.js`. `credentials: 'include'` sekarang berada pada opsi `fetch`, bukan di dalam HTTP headers. Bootstrap session juga memiliki timeout dan menghapus promise cache ketika gagal. HttpOnly cookie dari `/api/session/student` sekarang dapat dikirim pada request Student Data.

Untuk pengetesan local, jalankan backend dan frontend pada terminal terpisah:

```bash
cd server && npm run dev
cd client && npm run dev
```

Backend `.env` harus memiliki `DATABASE_URL` yang dapat dijangkau, `SESSION_SECRET`, `SYNC_API_KEY`, dan `ALLOWED_ORIGINS` yang memuat origin frontend secara persis. Frontend `.env` harus mengarah ke API backend, biasanya `http://localhost:3000/api`. Pastikan `/api/health` mengembalikan HTTP 200 sebelum menguji Student Data.
