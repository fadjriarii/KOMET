# TODO & Panduan Implementasi Login SSO i3L (Portal + HRIS) di KOMET

> Revisi kedua. Versi awal dokumen ini ditulis untuk **Laravel** (Eloquent, Blade, `Kernel.php`,
> `routes/web.php`) yang **tidak ada** di project ini. Komet adalah **Express 5 + Prisma + React SPA**.
> Konsep dari dokumen lama tetap dipakai (role ditentukan divisi, tanpa tabel user lokal),
> tetapi seluruh turunannya di bawah ini dipetakan ke file yang benar-benar ada di repo ini.

---

## 1. Prinsip desain (baca ini dulu)

Tiga hal dipisahkan secara tegas:

| Concern                                                     | Dipegang oleh                             | Konsekuensi untuk Komet                           |
| ----------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| **Autentikasi** — membuktikan email benar milik si pengguna | **Google Workspace i3L** (OAuth 2.0)      | Komet tidak pernah memverifikasi password sendiri |
| **Direktori** — email ini divisinya apa, aktif atau tidak   | **DB `portal` + `hris`**, dibaca **saja** | Komet tidak menulis apa pun ke DB institusi       |
| **Otorisasi** — boleh akses apa di Komet                    | **Komet**, lewat role di sesi             | UI/UX 100% milik Komet, tidak tergantung portal   |

**Konsekuensi terbesar dari tabel di atas: tidak ada satu baris pun kode login portal yang perlu
atau bisa dipakai ulang.** Yang dipakai ulang hanya _tabelnya_. Jadi "desain UI/UX saya sendiri"
bukan kompromi di sini — memang begitu arsitekturnya.

Yang **TIDAK** diubah dari rencana lama:

- Tidak membuat tabel `users` lokal di Komet.
- Role diturunkan dari **divisi** (QA / IT → admin), bukan dari kolom role lokal.

Yang **DIGANTI** dari rencana lama (`todo.md` versi pertama):

- ~~Form login menerima ketikan email lalu di-`SELECT`~~ → email diambil dari **token Google** di server.
- ~~Cocokkan divisi dengan substring `'qa'` / `'it'` pada nama~~ → cocokkan **`iddepartments`** persis.
- ~~Langkah Laravel (Eloquent/Blade/Kernel)~~ → modul Express + Prisma/mysql2 di bawah.

---

## 2. Alur (sederhana, 10 langkah)

```mermaid
flowchart TD
    A["1. User buka /login di Komet<br/>(halaman rancangan sendiri, di luar MainLayout)"] --> B["2. Klik 'Masuk dengan Google i3L'<br/>→ browser ke accounts.google.com"]
    B --> C["3. Google redirect balik ke SERVER Komet<br/>bawa ?code=&state="]
    C --> D["4. Server: cek state, tukar code ke Google<br/>→ dapat email + klaim token"]
    D --> E{"5. id_token sah?<br/>iss, aud = client_id Komet,<br/>email_verified, hd = i3l.ac.id"}
    E -->|tidak| F["401. Tidak ada sesi."]
    E -->|ya| G["6. Cari email di portal.users<br/>ada? active = 1?"]
    G -->|tidak / nonaktif| F
    G -->|ya| H["7. Telusuri hris: employees →<br/>employments (HANYA yang berlaku sekarang)<br/>→ departments"]
    H --> I{"8. iddepartments<br/>termasuk allowlist QA/IT?"}
    I -->|ya| J["role = admin"]
    I -->|tidak| K["role = user"]
    J --> L["9. Simpan identitas ke sessionStore<br/>+ set cookie (mekanisme yang sudah ada)"]
    K --> L
    L --> M["10. Redirect ke SPA → GET /api/auth/me<br/>→ AuthContext → UserProfile"]
```

Kalimat tunggal yang merangkum: **Google yang membuktikan siapa Anda, portal yang memberi tahu
divisi Anda, Komet yang memutuskan hak akses Anda.**

Akibat dari alur ini (penting): `POST /api/sync/*` hari ini bisa dipicu oleh **sesi anonim mana pun**
(`docs/ARCHITECTURE.md` §6.1, dan itu konsekuensi yang diterima sadar di `docs/ARCHITECTURE.md` §6.3).
Setelah login berjalan, sync menjadi **admin-only**. Itu nilai keamanan nyata dari pekerjaan ini,
lebih besar daripada kehadiran halaman login itu sendiri.

---

## 3. Peta perubahan ke kode yang ada

Sedikit sekali bagian yang benar-benar berubah; sisanya sudah jadi dan tinggal dipakai.

| #     | Berkas saat ini                                                 | Kondisi sekarang                                                                       | Yang ditambahkan                                                            |
| ----- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1     | `apps/server/.env`                                              | hanya 1 `DATABASE_URL`                                                                 | kredensial portal/hris + `GOOGLE_CLIENT_ID/SECRET`                          |
| 2     | `apps/server/src/config/`                                       | `prisma.js`, `redis.js`, `corsPolicy.js`                                               | `directory.js` — koneksi read-only ke portal/hris                           |
| 3     | **baru** `apps/server/src/services/directoryLookup.js`          | —                                                                                      | 1 fungsi: `email → { nama, idusers, active, divisions, isAdmin }`           |
| 4     | `apps/server/src/services/sessionStore.js:19`                   | menyimpan nilai `'1'`                                                                  | menyimpan payload identitas (JSON), TTL tetap                               |
| 5     | `apps/server/src/middlewares/studentSession.js`                 | `issueStudentSession` = mint anonim                                                    | tetap ada; ditambah `issueIdentitySession(req,res,identity)`                |
| **6** | **`apps/server/src/middlewares/syncAuth.js`**                   | sesi **atau** api-key                                                                  | sesi **yang isAdmin** atau api-key ← **perubahan terpenting**               |
| 7     | **baru** `apps/server/src/routes/authRoutes.js`                 | —                                                                                      | `GET /api/auth/google`, `GET /api/auth/google/callback`, `GET /api/auth/me` |
| 8     | `apps/client/src/App.jsx:18`                                    | semua route dibungkus `MainLayout`                                                     | halaman `/login` berada **di luar** bungkus itu                             |
| 9     | **baru** `apps/client/src/services/AuthContext.jsx`             | —                                                                                      | satu-satunya sumber identitas di client                                     |
| 10    | `apps/client/src/components/layout/Navbar/UserProfile.jsx:8-11` | hardcoded `'Dr. Ir. Hendra S.'`, `'Administrator'` (ada komentar "TEMPAT KUSTOMISASI") | baca dari `AuthContext`; tombol "Keluar" (no-op di `:95`) panggil logout    |
| 11    | `apps/client/src/services/apiClient.js:49-74`                   | `mintStudentSession()` otomatis                                                        | hanya dipanggil setelah `/api/auth/me` mengembalikan identitas              |

Yang **tidak** disentuh: signing/verifikasi cookie HMAC, rotasi, revoke, `DELETE /api/session/student`
(`routes/index.js:11`), `sessionIdentity` (bucket rate-limit per sesi), `rateLimiter.js`, seluruh
route data mahasiswa, dan seluruh pipeline sync.

---

## 4. Detail per langkah

### Langkah 1 — Konfigurasi & koneksi read-only

Tambah di `.env` (jangan pernah commit):

```env
# === SSO Google Workspace i3L ===
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."   # dipakai server untuk tukar code

# === Direktori institusi (HAK BACA SAJA) ===
PORTAL_DB_URL="mysql://readonly_user:pass@host:3306/portal"
HRIS_DB_URL="mysql://readonly_user:pass@host:3306/hris"
# Kosongkan bila portal & hris ada di server MySQL yang sama (lihat catatan di bawah)

# === Kebijakan role ===
ADMIN_DEPARTMENT_IDS="4,11"   # iddepartments QA dan IT, ditulis eksplisit
```

Pilihan koneksi — **putuskan setelah verifikasi di §5**:

- **Kalau portal + hris + Komet satu server MySQL yang sama** → cukup **satu** pool koneksi, dan
  query lintas database langsung bisa: `FROM portal.users u JOIN hris.employees e ...`.
  Ini jalur termudah: nol modul tambahan.
- **Kalau host-nya beda** → tidak bisa JOIN. Buat 2 pool, jadi dua query berurutan
  (portal → `idusers`, lalu hris → divisi). Tetap tanpa Prisma schema kedua.

Kenapa tidak bikin schema Prisma kedua: Prisma hanya mendukung satu `datasource` per berkas
skema. Untuk beberapa query login yang murni baca, pool `mysql2` biasa jauh lebih murah —
dan `mysql2` **sudah ada di `apps/server/package.json`** (saat ini tidak dipakai kode mana pun).

```js
// apps/server/src/config/directory.js — gambaran, bukan kode final
// Satu pool read-only, connectionLimit kecil, hanya dipakai saat login.
```

### Langkah 2 — Lookup direktori

Satu fungsi, tanpa model, tanpa ORM tambahan:

```sql
-- Asumsi struktur (WAJIB diverifikasi, lihat §5):
SELECT u.idusers, u.name, u.email, u.active,
       d.iddepartments, d.name AS division
FROM   portal.users u
LEFT   JOIN hris.employees    e   ON e.idusers       = u.idusers
LEFT   JOIN hris.employments  emp ON emp.idemployees  = e.idemployees
                                    AND <filter jabatan yang BERLAKU SEKARANG>
LEFT   JOIN hris.departments  d   ON d.iddepartments  = emp.iddepartments
WHERE  u.email = ?;   -- parameter, bukan string concatenation
```

Tiga aturan yang tidak boleh dilanggar di langkah ini:

1. **Jangan pernah mempercayai email yang dikirim klien.** Email masuk ke query ini hanya boleh
   berasal dari `id_token` yang sudah diverifikasi di Langkah 3.
2. **`employments` biasanya berisi riwayat.** Tanpa filter "yang sedang berlaku", orang yang dulu
   QA lalu pindah tetap dapat label QA selamanya → admin permanen. (`todo.md` lama, baris 296-301,
   melakukan ini dengan salah.)
3. **Cocokkan `iddepartments`, bukan nama.** Substring `'it'` juga ada di kata **Universitas**,
   **fasilitas**, **komite**, **unit** → semua itu akan jadi admin.

Keberhasilan lookup = `active` bernilai benar **dan** barisnya ada. Bukan `isset()`: kolom nullable
tidak boleh dihitung sebagai aktif.

### Langkah 3 — Endpoint OAuth (callback di SERVER, bukan di SPA)

Ini mengikuti keputusan yang sudah Anda tulis di `docs/ARCHITECTURE.md` §6.1: kredensial tidak pernah
hidup di JavaScript sisi klien. Token Google tinggal di server; browser hanya punya cookie opaque.

```
GET  /api/auth/google            → redirect ke Google, state acak disimpan di cookie sementara
GET  /api/auth/google/callback   → tukar code, verifikasi, lookup, terbitkan sesi, redirect ke SPA
GET  /api/auth/me                → { name, email, divisions, role } dari sesi (untuk AuthContext)
```

Tukar `code` cukup dengan **`axios`** (`apps/server/src/config/sevimaApi.js:1` sudah memakai
pola yang sama) — tidak perlu menambah dependency.

Daftar pemeriksaan pada `id_token`, semuanya wajib:

| Klaim            | Cek                                                   | Kalau dilewat                                                                                               |
| ---------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `iss`            | `accounts.google.com` / `https://accounts.google.com` | token dari penerbit lain diterima                                                                           |
| **`aud`**        | **== `GOOGLE_CLIENT_ID` Komet**                       | **token untuk aplikasi apa pun bisa dipakai masuk Komet = pintu terbuka untuk seluruh pemilik akun Google** |
| `email_verified` | `true`                                                | email tak terverifikasi jadi identitas                                                                      |
| `hd`             | `i3l.ac.id`                                           | akun Gmail pribadi yang namanya sama disambut                                                               |
| `exp`            | belum kedaluwarsa                                     | replay token lama                                                                                           |

`state` bukan formalitas: tanpa pemeriksaan itu, callback bisa dipaksa mengaitkan sesi
milik penyerang ke browser korban (login CSRF).

### Langkah 4 — Identitas masuk ke sesi

`sessionStore.js` hari ini menulis `'1'` sebagai nilai. Ganti nilainya menjadi payload:

```js
{ idusers, name, email, divisions: [..], role: 'admin'|'user', issuedAt }
```

Yang **tidak** berubah: cookie tetap token acak-HMAC, tetap `HttpOnly`, `SameSite`, `Path=/api`,
`Secure` di produksi. Identitas tidak pernah masuk ke cookie maupun localStorage — hanya ke store
sisi server (Redis / in-memory, sama seperti sekarang).

Refresh role: jangan query portal tiap request. Momen paling wajar adalah **saat perpanjangan sesi
yang sudah ada** (`apiClient.js:80`, buffer sebelum kedaluwarsa) → di situ baca ulang portal.
Dengan begitu divisi yang berpindah akan terkoreksi paling lama satu siklus sesi.

### Langkah 5 — Guard

Dua lapis, mengikuti apa yang sudah tersedia:

- **`studentSessionAuth`** (sudah ada, untuk route data mahasiswa) → **tetap**, tetapi
  tidak lagi menerima sesi anonim: sesi harus punya payload identitas.
- **`syncAuth`** (`syncRoutes.js:13`, dipakai semua route `/api/sync/*`) → tambah syarat `role === 'admin'`.
  `SYNC_API_KEY` tetap boleh (ETL/cron), dan `req.syncActor` tetap diturunkan server.

Kombinasi ini menjaga `zeroTrust.test.js` tetap bermakna. Tambah kasus uji baru, jangan ganti yang lama:
sesi anonim → 401; sesi user biasa di `/api/sync/all` → 403; sesi admin → lolos; api-key → lolos.

Kalau ternyata **user biasa tidak butuh memicu/monitor sync sama sekali**, panel sync di Sidebar
juga harus disembunyikan untuk non-admin (bukan cuma ditolak di server) — tampilan yang menolak
akses tanpa alasan terlihat seperti bug.

### Langkah 6 — Sisi client

1. **Halaman `/login`** — sepenuhnya rancangan Anda, bebas. Letakkan **di luar** `MainLayout`
   (`App.jsx:18`), kalau tidak sidebar & navbar ikut ter-render untuk orang yang belum masuk.
2. Tombol "Masuk dengan Google i3L" = anchor ke `GET /api/auth/google`. Tidak ada logika lain
   di halaman ini; **jangan** membuat input email gratisan.
3. `AuthContext` mengisi dirinya dari `GET /api/auth/me` saat app mount.
4. Belum identitas → redirect `/login`. Sudah ada → render dashboard seperti sekarang.
5. `UserProfile.jsx` baca nama/role/inisial dari context; "Keluar" → `DELETE /api/session/student`
   lalu ke `/login`. (Kedua fungsi itu sudah ada di server.)

Versi UI boleh meniru **tata letak** portal (judul, satu tombol besar, footer) tanpa meniru
kode atau domain-nya. Yang tidak boleh ikut ditiru: tab **Guest Login** — lihat §6.

### Langkah 7 — Pengujian

- Unit: verifikasi `id_token` (tiap klaim di atas, satu kasus gagal per klaim),
  pemetaan divisi → role (termasuk nama divisi menjebak: "Fasilitas Universitas" **bukan** admin),
  filter employments aktif.
- Integrasi: callback sah → sesi berisi identitas; user biasa → 403 di `/api/sync/*`.
- Regresi: `zeroTrust.test.js`, `studentSession.test.js` tetap hijau.
- Manual: login dengan akun QA, akun non-QA, akun nonaktif, dan akun Google di luar i3L.

---

## 5. WAJIB diverifikasi sebelum menulis kode

Saya (dan dokumen lama) belum pernah melihat struktur asli DB institusi. Empat hal ini
mengubah bentuk implementasi, dan semuanya bisa dijawab dalam beberapa menit:

```sql
SHOW COLUMNS FROM portal.users;                          -- ada idusers, email, active, name? kolom role?
SHOW COLUMNS FROM hris.employees;                        -- ADANYA kolom idusers = sendi seluruh relasi
SHOW COLUMNS FROM hris.employments;                      -- kolom periode/aktif untuk filter "sekarang"
SELECT iddepartments, name FROM hris.departments
  WHERE LOWER(name) LIKE '%quality%' OR LOWER(name) LIKE '%information%' OR LOWER(name) LIKE '%teknologi%';
SELECT @@hostname;                                       -- apakah portal & hris satu server?
```

Lalu dua pertanyaan non-SQL:

- **Client ID Google**: memakai client ID portal yang sekarang (berarti IT harus menambahkan
  `redirect_uri` origin Komet), atau membuat OAuth client baru khusus Komet?
- **Apakah Komet pernah butuh tulis ke DB portal?** Kalau tidak pernah, user DB-nya cukup `SELECT`
  dan seluruh §6 jadi tidak relevan.

---

## 6. Keluar lingkup (kecuali diminta tegas)

**Login Guest portal** (email+password, registrasi, reCaptcha, approval via email). Membawa fitur
ini ke Komet berarti salah satu dari dua hal buruk: Komet **menulis** ke database institusi
(membatalkan premise read-only, dan ikut bertanggung jawab atas integritas data kampus), atau
Komet membuat tabel user sendiri (membatalkan "tanpa user lokal", dan akun staf ada di dua tempat
yang bisa berbeda isinya).

Jalan tengah yang murah bila memang ada pengguna eksternal nyata: **baca baris guest yang sudah ada
di tabel portal**, sehingga guest yang sudah disetujui di portal otomatis bisa masuk Komet. Anda
mendapat efek yang sama tanpa membangun ulang formulir registrasi, email approval, dan lupa-password.

"Sisa fitur portal" pada umumnya juga perlu diperkecil dulu. Yang dibahas di sini adalah
**autentikasi + identitas** (hanya-baca, hitungan hari). Menyalin modul kepegawaian/akademik/
keuangan portal adalah proyek berbeda yang membutuhkan keputusan arsitektur lebih mendasar.

---

## 7. Checklist

- [ ] §5: kirim keluaran `SHOW COLUMNS` → pastikan `employees.idusers` dan kolom periode di `employments`
- [ ] §5: putuskan satu-server-atau-dua (menentukan 1 pool vs 2 pool)
- [ ] §5: dapatkan OAuth client + `redirect_uri` terdaftar
- [ ] `config/directory.js` — pool read-only
- [ ] `services/directoryLookup.js` — email → identitas + divisi (dengan filter employments aktif)
- [ ] `routes/authRoutes.js` — `/google`, `/google/callback` (verifikasi `aud`!), `/me`
- [ ] `sessionStore.js` — nilai `'1'` → payload identitas
- [ ] `studentSession.js` — `issueIdentitySession`
- [ ] `middlewares/syncAuth.js` — syarat `isAdmin` untuk route sync
- [ ] `envValidator.js` + `.env.example` — kunci baru
- [ ] Client: halaman `/login` di luar `MainLayout` + `AuthContext`
- [ ] Client: `UserProfile.jsx` baca dari context; "Keluar" jadi berfungsi
- [ ] Client: sembunyikan panel sync untuk non-admin
- [ ] Test: unit klaim token, pemetaan divisi, integrasi alur callback, perluasan `zeroTrust`
- [ ] `docs/ARCHITECTURE.md` §6.3 — perbarui catatan "sesi tanpa login per-user", kini sudah tidak benar
- [ ] Audit log percobaan login (gagal karena apa: bukan staf, nonaktif, token tak sah)

---

## 8. Catatan keamanan

1. **Rate limit** `GET /api/auth/google` dan callback. Infrastruktur sudah ada (`rateLimiter.js`).
2. **Jangan** membocorkan hasil lookup: pesan "Email belum terdaftar di sistem kampus" =
   oracle keanggotaan staf. Untuk kegagalan pasca-Google, pesan yang cukup: "Akun Anda tidak
   dikenali di sistem ini. Hubungi IT."
3. **Gagal aman saat portal/hris mati**: tolak login dan log. Jangan fallback ke role dari sesi lama.
4. **`SESSION_SECRET` wajib acak dan terpisah** dari `SYNC_API_KEY` (pemisahan itu sudah dijelaskan
   sengaja di `studentSession.js:13-15` — pertahankan).
5. **CORS**: origin Komet yang baru harus masuk `ALLOWED_ORIGINS`; `isAllowedOrigin` di
   `issueStudentSession` sudah menegakkan ini, jangan dilemahkan.
6. **Parameter query selalu di-bind**, tidak dirakit sebagai string (injection).
7. SSO tidak menghapus kebutuhan `SYNC_API_KEY` untuk ETL/cron — keduanya jalur berbeda.
