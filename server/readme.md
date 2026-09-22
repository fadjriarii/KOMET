# KOMET Backend Server

Komet Backend Server adalah layanan RESTful API berbasis Node.js dan Express.js yang berfungsi sebagai engine analitik dan pengolahan data akademik untuk Dashboard Eksekutif Komet. Service ini mengintegrasikan data dari **Sevima API** (Sistem Informasi Akademik) ke dalam database PostgreSQL/MySQL lokal melalui Prisma ORM, serta menyediakan endpoint analitik untuk Mahasiswa Aktif, Data Kelulusan, dan Kegiatan MBKM (Merdeka Belajar Kampus Merdeka).

---

## 🛠️ Tech Stack & Dependencies

- **Runtime Environment:** [Node.js](https://nodejs.org/) (v18+)
- **Framework:** [Express.js](https://expressjs.com/) (v5.x)
- **Database ORM:** [Prisma ORM](https://www.prisma.io/) (v6.x)
- **Database Engine:** MySQL / MariaDB (via `mysql2`)
- **HTTP Client:** [Axios](https://axios-http.com/) (dengan retry & exponential backoff)
- **Security & Utilities:**
  - `express-rate-limit`: Proteksi DoS & brute-force per IP
  - `cors`: Restriction whitelist origin browser
  - `dotenv`: Pengelolaan environment variables
  - `winston` / Custom Logger: Logging aplikasi dengan log rotation

---

## 👨‍💻 Pembuat (Author)

**Aulia Fadjri**

---

## 🚀 Cara Menjalankan Project secara Local

### 1. Prasyarat System
- Node.js versi 18 ke atas & `npm`
- Database Server MySQL / MariaDB yang sedang berjalan

### 2. Instalasi Dependency
Jalankan perintah berikut di root folder `server/`:
```bash
npm install
```
> *Catatan:* Perintah ini akan secara otomatis menjalankan `npx prisma generate` melalui `postinstall` script.

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan variabel environment berikut pada file `.env`:
```env
PORT=3000
NODE_ENV=development

# Database Connection
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/DB_NAME"

# SEVIMA External API Credentials
SEVIMA_APP_KEY="your-sevima-app-key"
SEVIMA_SECRET_KEY="your-sevima-secret-key"

# Security & Authentication
SYNC_API_KEY="your-secure-random-api-key"
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3001"
```

### 4. Setup Database & Migrasi Prisma
Jalankan perintah untuk mendorong schema Prisma ke database lokal:
```bash
npm run db:push
```

### 5. Jalankan Server
- **Mode Development (dengan Hot Reload / Nodemon):**
  ```bash
  npm run dev
  ```
- **Mode Production:**
  ```bash
  npm start
  ```

---

## 📑 Dokumentasi & Panduan Tahapan Development

- 🔗 **[Documentation.md](file:///home/fadjri/projects/Komet/server/Documentation.md)** — Dokumentasi teknis & spesifikasi endpoint API komprehensif.
- 🔗 **[requirements/requirement-part7.md](file:///home/fadjri/projects/Komet/server/requirements/requirement-part7.md)** — Dokumen Audit Fixes & Response Structure Standardization (3 Tab Utama).
- 🔗 **[requirements/requirement-part8.md](file:///home/fadjri/projects/Komet/server/requirements/requirement-part8.md)** — Dokumen Foreign Students Longitudinal Trend Fix (`ForeignStudentsView.jsx`).
- 🔗 **[requirements/requirement-part9.md](file:///home/fadjri/projects/Komet/server/requirements/requirement-part9.md)** — Dokumen Full Gap Analysis & Backend-Frontend Synchronization (6 Gaps).
- 🔗 **[requirements/requirement-part10.md](file:///home/fadjri/projects/Komet/server/requirements/requirement-part10.md)** — Dokumen 100% Functional Alignment Audit & Comprehensive Mapping (Student, Graduate, MBKM).
- 🔗 **[requirements/requirement-part11.md](file:///home/fadjri/projects/Komet/server/requirements/requirement-part11.md)** — Dokumen Audit Fixes & Response Structure Standardization (Part 11 - Student & Graduate Data).