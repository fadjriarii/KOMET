# KOMET Frontend — Architecture Guidelines & AI SOP

> **Proyek:** Komet (Kemahasiswaan & Output Monitoring Terpadu) — Frontend Web Application  
> **Lokasi:** `/home/fadjri/projects/Komet/client`  
> **Status Dokumen:** Mandatori / Wajib dibaca oleh Antigravity AI sebelum mengeksekusi prompt apa pun.

---

## 1. Prinsip Utama Arsitektur (Core Architecture)

Aplikasi Komet dibangun untuk visualisasi data berskala besar, analitik akademik, dan monitoring terpadu. Untuk menjaga keberlanjutan proyek yang berjangka panjang, setiap penulisan kode wajib mematuhi:

1. **Feature-Based Modular Architecture:** Seluruh logika bisnis, halaman, hooks, popup detail, dan service spesifik domain dipisahkan ke dalam folder `src/modules/<nama_modul>/`.
2. **DRY (Don't Repeat Yourself):** Komponen UI atau fungsi yang digunakan lebih dari satu kali (Card metrik, Chart wrapper, Modal/Popup, Table, Tab navigation, Button, Badge) **WAJIB** ditarik ke `src/components/common/` atau `src/hooks/`.
3. **Pemisahan Tanggung Jawab (Separation of Concerns):**
   - **UI Component (`.jsx`):** Hanya menangani tampilan dan interaksi pengguna (pure presenter).
   - **Custom Hooks (`.js`):** Menangani state management lokal, filter, dan pemanggilan service.
   - **Services Layer (`.js`):** Menangani HTTP request ke backend API Komet.
   - **Utils Layer (`logic.js`):** Menangani kalkulasi murni, pemformatan angka/tanggal/IPK, transformasi data tabel/chart, dan narasi formula.
4. **Backend-First Data Alignment:** 
   - Jika kalkulasi/metrik sudah dihitung di backend (lihat [Backend-Documentation.md](file:///home/fadjri/projects/Komet/client/requirements/Backend-Documentation.md)), gunakan langsung field response backend.
   - Jika belum ada di backend, buat fungsinya secara terpusat di `src/utils/logic.js` agar siap dipindahkan ke backend service/controller nantinya.

---

## 2. Palet Warna & Standar Visual (Brand Color Palette & Chart Consistency)

Palet warna utama aplikasi Komet menggunakan **Digital Blue** (OKLCH). Seluruh chart, grafik, badge, indikator aktif, dan aksen visual **WAJIB** mengacu pada palet ini secara konsisten:

### CSS Theme Definition (`src/index.css`)
```css
@theme {
  --color-digital-blue-50: oklch(95.13% 0.023 256.10);
  --color-digital-blue-100: oklch(90.17% 0.048 259.10);
  --color-digital-blue-200: oklch(80.72% 0.097 258.14);
  --color-digital-blue-300: oklch(71.49% 0.149 258.39);
  --color-digital-blue-400: oklch(63.31% 0.198 258.73);
  --color-digital-blue-500: oklch(56.35% 0.241 260.82);
  --color-digital-blue-600: oklch(48.02% 0.201 260.48);
  --color-digital-blue-700: oklch(39.11% 0.161 260.13);
  --color-digital-blue-800: oklch(29.89% 0.116 259.04);
  --color-digital-blue-900: oklch(19.67% 0.068 256.39);
  --color-digital-blue-950: oklch(16.49% 0.052 253.90);
}
```

### Panduan Penggunaan Warna:
- **Primary Brand / Primary Button / Active Sidebar Indicator**: `digital-blue-600`
- **Active Backgrounds / Hover Soft Highlights**: `digital-blue-50` atau `digital-blue-100`
- **Text Highlights / Active Nav Text**: `digital-blue-700`
- **Borders / Soft Dividers**: `digital-blue-200`
- **Formula Highlight Badge**: `font-mono font-bold text-digital-blue-900 bg-white/95 border border-digital-blue-200 shadow-2xs`
- **Visualisasi Data & Charts**:
  - Gunakan konstanta terpusat dari `src/utils/theme.js` (`DIGITAL_BLUE` & `CHART_PALETTE`).

---

## 3. Struktur Direktori Standar (Directory Structure)

```
client/
├── requirements/                      # Dokumentasi backend, API spec, dan pedoman arsitektur
│   ├── Backend-Documentation.md
│   ├── architecture_guidelines.md
│   └── antigravity_rules.md
├── src/
│   ├── assets/                        # Logo, ilustrasi, dan aset statis (KOMET.png, dll)
│   ├── components/
│   │   ├── common/                    # Komponen Reusable (Global UI Primitives - DRY)
│   │   │   ├── cards/                 # StatCard, ChartCard
│   │   │   ├── charts/                # ChartWrapper, Recharts presets
│   │   │   ├── feedback/              # LoadingSpinner, EmptyState, Skeleton
│   │   │   ├── modals/                # Modal, ModalSummaryBanner, ModalTabNav, ModalTable
│   │   │   ├── tables/                # DataTable, Pagination
│   │   │   └── ui/                    # Button, Badge, Input, Select
│   │   └── layout/                    # Layout sistem (Navbar, Sidebar, MainLayout)
│   ├── context/                       # Global React Context (NavigationContext)
│   ├── hooks/                         # Global reusable React Hooks (useTabTransition, dll)
│   ├── modules/                       # Fitur / Domain Spesifik
│   │   ├── overview/                  # Modul Overview
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/                 # OverviewPage.jsx
│   │   │   └── services/              # overviewService.js
│   │   ├── students/                  # Modul Student Data
│   │   │   ├── components/
│   │   │   │   ├── modals/            # ActiveStudentsModal, ForeignStudentsModal, IntakeStudentsModal, DeclineStudentsModal
│   │   │   │   └── StudentDetailModal.jsx
│   │   │   ├── hooks/                 # useStudentsData.js
│   │   │   ├── pages/                 # StudentsPage.jsx
│   │   │   └── services/              # studentsService.js
│   │   ├── graduates/                 # Modul Graduate Data
│   │   ├── mbkm/                      # Modul MBKM Data
│   │   └── dosen/                     # Modul Dosen (Tahap Selanjutnya)
│   ├── services/                      # Base HTTP client (apiClient.js)
│   └── utils/                         # Single Source of Truth Logic (logic.js, theme.js)
```

---

## 4. Standar Modularitas Popup Modal (Modal Sub-components)

Setiap popup detail rincian card di seluruh aplikasi **WAJIB** mengikuti susunan blok modular standar:

1. **Container Modal (`Modal.jsx`)**:
   - Menangani backdrop blur khusus area konten, shortcut Escape, dan animasi *quick-look zoom*.
2. **Summary Banner 80/20 (`ModalSummaryBanner.jsx`)**:
   - **Sisi Kiri (80%)**: Paragraf narasi deskripsi dan badge rumus yang di-highlight.
   - **Sisi Kanan (20%)**: Kotak highlight angka KPI utama.
3. **Tab Navigation (`ModalTabNav.jsx` & `useTabTransition.js`)**:
   - Mengelola pergantian tab (misal: *Diagram Tren* vs *Tabel Riwayat*) dengan animasi slide halus.
4. **Tabel Riwayat Modal (`ModalTable.jsx`)**:
   - Menangani sticky header `digital-blue`, baris zebra striping, custom scrollbar, loading skeleton, dan empty state.
5. **Chart Recharts**:
   - Menggunakan `ResponsiveContainer`, `BarChart`/`ComposedChart`, tooltip informatif, dan warna dari `DIGITAL_BLUE`.

---

## 5. Sentralisasi Business Logic & Data Transformation (`src/utils/logic.js`)

Untuk menjaga agar komponen UI (`.jsx`) tetap bersih (*pure presenter*) dan memudahkan **migrasi seluruh kalkulasi bisnis ke Backend API KOMET**:

1. **Single Source of Truth Logic:**
   - Seluruh fungsi kalkulasi metrik, penentuan tahun ajaran, formula akademik, ekstraksi KPI, normalisasi respon backend, dan pemetaan/transformasi data tabel **WAJIB** berada di dalam [`src/utils/logic.js`](file:///home/fadjri/projects/Komet/client/src/utils/logic.js).
2. **Larangan Inline Logic di Komponen:**
   - Dilarang keras menulis parsing data rumit, manipulasi array berulang (`slice`, `filter`, `reduce`), penentuan formula pertumbuhan/fluktuasi, atau pembuatan narasi dinamis langsung di dalam file JSX.
   - Komponen hanya boleh memanggil fungsi helper yang di-ekspor oleh `logic.js`.
3. **Kesiapan Porting Backend:**
   - Fungsi-fungsi di dalam `logic.js` dirancang sebagai *pure functions* murni agar dapat langsung di-copy/paste atau diadaptasi ke Backend Controller/Prisma Service saat endpoint backend disempurnakan.

---

## 6. Protokol Integrasi API Backend

1. Gunakan `apiClient.js` di `src/services/apiClient.js` sebagai single source of truth untuk fetch data HTTP.
2. API Key backend dikirim otomatis via header `x-api-key`.
3. Format standar response backend Komet:
   ```json
   {
     "success": true,
     "summary": { ... },
     "data": [ ... ]
   }
   ```
4. Selalu tangani skenario error (`catch`) dan berikan fallback graceful via Skeleton / EmptyState.

---

## 7. SOP Eksekusi Antigravity AI

Sebelum membuat atau mengubah file:
1. **Gunakan komponen bersama di `src/components/common/`** (seperti `ModalSummaryBanner`, `ModalTabNav`, `ModalTable`, `StatCard`, `Skeleton`).
2. **Pusatkan seluruh kalkulasi dan transformasi data ke `src/utils/logic.js`**.
3. **Pertahankan konsistensi warna brand `digital-blue-*`**.
4. **Pastikan zero-breaking-changes**: Jalankan `npm run build` setelah setiap perubahan.
