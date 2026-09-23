# KOMET Frontend — Architecture Guidelines & AI SOP

> **Proyek:** Komet (Kemahasiswaan & Output Monitoring Terpadu) — Frontend Web Application  
> **Lokasi:** `/home/fadjri/projects/Komet/client`  
> **Status Dokumen:** Mandatori / Wajib dibaca oleh Antigravity AI sebelum mengeksekusi prompt apa pun.

---

## 1. Prinsip Utama Arsitektur (Core Architecture)

Aplikasi Komet dibangun untuk visualisasi data berskala besar, analitik akademik, dan monitoring terpadu. Untuk menjaga keberlanjutan proyek yang berjangka panjang, setiap penulisan kode wajib mematuhi:

1. **Feature-Based Modular Architecture:** Seluruh logika bisnis, halaman, hooks, dan service spesifik domain dipisahkan ke dalam folder `src/modules/<nama_modul>/`.
2. **DRY (Don't Repeat Yourself):** Komponen UI yang digunakan lebih dari satu kali (Card metrik, Chart wrapper, Modal/Popup, Table, Button, Badge) **WAJIB** ditarik ke `src/components/common/`.
3. **Pemisahan Tanggung Jawab (Separation of Concerns):**
   - **UI Component:** Hanya menangani tampilan dan interaksi pengguna.
   - **Custom Hooks:** Menangani state management lokal dan pemanggilan service.
   - **Services Layer:** Menangani HTTP request ke backend API Komet.
   - **Utils Layer:** Menangani kalkulasi murni, pemformatan tanggal/angka/IPK dan tema warna.
4. **Preservasi Logic & Coding Style:** Jangan pernah mengubah logika bisnis atau merombak gaya penulisan yang sudah berjalan tanpa instruksi eksplisit dari user.

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
- **Visualisasi Data & Charts**:
  - **Single Series Chart**: Gunakan `digital-blue-600` (atau gradien `digital-blue-600` ke `digital-blue-400`).
  - **Multi-Series / Category Chart**: Gunakan urutan shade terstruktur (`digital-blue-600`, `digital-blue-400`, `digital-blue-800`, `digital-blue-300`, `digital-blue-500`) dan kombinasikan dengan warna semantik (Emerald untuk positif/lulus tepat waktu, Amber untuk peringatan, Rose untuk drop out/fluctuasi negatif).
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
│   │   ├── common/                    # Komponen Reusable (Global UI Primitives)
│   │   │   ├── cards/                 # StatCard, ChartCard, ContainerCard
│   │   │   ├── charts/                # ChartWrapper, BarChart, LineChart, PieChart
│   │   │   ├── feedback/              # LoadingSpinner, EmptyState, ErrorBoundary, Skeleton
│   │   │   ├── modals/                # Modal, ConfirmDialog, FilterDrawer
│   │   │   ├── tables/                # DataTable, Pagination, TableFilter
│   │   │   └── ui/                    # Button, Badge, Input, Select, Dropdown
│   │   └── layout/                    # Layout sistem (Navbar, Sidebar, Container)
│   │       ├── MainLayout.jsx         # Layout utama dengan sidebar collapsible & responsive margin
│   │       ├── Navbar/                # Navbar, Breadcrumbs, UserProfile
│   │       └── Sidebar/               # Sidebar, SidebarNav, MenuGroup, useSidebarDrag, dll
│   ├── context/                       # Global React Context (Auth, Filter, Theme)
│   ├── hooks/                         # Global reusable React Hooks (useDebounce, useMediaQuery, dll)
│   ├── modules/                       # Fitur / Domain Spesifik
│   │   ├── overview/                  # Modul Overview
│   │   │   ├── components/            # Komponen visualisasi spesifik overview
│   │   │   ├── hooks/                 # Custom hooks (e.g. useOverviewData)
│   │   │   ├── pages/                 # Halaman utama overview (OverviewPage.jsx)
│   │   │   └── services/              # API caller (overviewService.js)
│   │   ├── students/                  # Modul Student Data
│   │   │   ├── components/            # StudentKPIs, StudentTrendChart, StudentTable, dll
│   │   │   ├── hooks/                 # useStudentsData, useStudentFilters
│   │   │   ├── pages/                 # StudentsPage.jsx
│   │   │   └── services/              # studentsService.js
│   │   ├── graduates/                 # Modul Graduate Data
│   │   │   ├── components/            # GraduateSummary, GPADistributionChart, dll
│   │   │   ├── hooks/                 # useGraduatesData
│   │   │   ├── pages/                 # GraduatesPage.jsx
│   │   │   └── services/              # graduatesService.js
│   │   ├── mbkm/                      # Modul MBKM Data
│   │   │   ├── components/            # MbkmParticipationCard, PartnerChart, dll
│   │   │   ├── hooks/                 # useMbkmData
│   │   │   ├── pages/                 # MbkmPage.jsx
│   │   │   └── services/              # mbkmService.js
│   │   └── dosen/                     # Modul Dosen (Tahap Selanjutnya)
│   │       ├── components/            # DosenProfile, TridharmaCharts, dll
│   │       ├── hooks/
│   │       ├── pages/                 # DosenPage.jsx
│   │       └── services/              # dosenService.js
│   ├── routes/                        # Konfigurasi rute navigasi
│   ├── services/                      # Base HTTP client (apiClient.js)
│   └── utils/                         # Helper functions (formatters.js, theme.js, constants.js)
```

---

## 4. Konvensi Penamaan (Naming Conventions)

| Tipe File | Konvensi | Contoh |
|---|---|---|
| **React Components** | `PascalCase.jsx` | `StatCard.jsx`, `StudentsPage.jsx`, `SidebarNav.jsx` |
| **Custom Hooks** | `camelCase.js` (diawali `use`) | `useSidebarDrag.js`, `useStudentsData.js` |
| **Service Files** | `camelCase.js` (diakhiri `Service`) | `studentsService.js`, `apiClient.js` |
| **Utility Files** | `camelCase.js` | `formatters.js`, `theme.js` |
| **Contexts** | `PascalCaseContext.jsx` | `AuthContext.jsx`, `FilterContext.jsx` |
| **CSS Classes** | Tailwind utility classes | `@theme`, `oklch`, `bg-digital-blue-600` |

---

## 5. Aturan Pembuatan Komponen Visualisasi Data

1. **Gunakan `StatCard` untuk KPI**:
   - Letakkan di bagian atas halaman ringkasan data.
   - Sertakan title, value, icon, trend positif/negatif, dan badge bila ada.
2. **Gunakan `ChartCard` sebagai container grafik**:
   - Selalu berikan judul (`title`), deskripsi singkat (`subtitle`), dan slot action (`headerAction` untuk filter tahun/semester).
   - Pastikan grafik responsif (menggunakan `ResponsiveContainer`).
   - Terapkan warna dari `CHART_PALETTE` atau shade `digital-blue`.
3. **Gunakan `DataTable` untuk list detail data**:
   - Wajib menyertakan loading state (`LoadingSpinner`) dan empty state (`EmptyState`).
   - Sertakan pagination jika data lebih dari 10 baris.
4. **Modal/Popup**:
   - Gunakan `Modal.jsx` dengan backdrop blur halus dan animasi masuk 200–300ms.
   - Sediakan tombol tutup (X) dan keyboard escape handler.

---

## 6. Pedoman Rute & Tata Letak Baru (Multi-Layout & Dosen Navigation)

### A. Layout Khusus Mahasiswa vs Layout Khusus Dosen:
- `MainLayout.jsx` bertindak sebagai shell fleksibel.
- Saat modul Dosen diimplementasikan, navigasi sidebar dapat dipisah menjadi:
  - `StudentSidebarNav.jsx` (untuk rute `/students/*`, `/graduates/*`, `/mbkm/*`)
  - `DosenSidebarNav.jsx` (untuk rute `/dosen/*`)
- Keduanya dapat memanfaatkan `MenuGroup.jsx` yang mendukung collapsible accordion.

### B. Nested Sidebar (Sidebar Bersarang):
- Untuk submenu bertingkat (misal: *Dosen -> Tridharma -> Penelitian / Pengabdian*), gunakan `MenuGroup` bertingkat dengan indentasi visual (`pl-4` atau `border-l border-gray-100`) dan toggle status per grup.

---

## 7. Protokol Integrasi API Backend

1. Gunakan `apiClient.js` di `src/services/apiClient.js` sebagai single source of truth untuk fetch data.
2. API Key backend dikirim otomatis via header `x-api-key`.
3. Format standar response backend Komet:
   ```json
   {
     "success": true,
     "summary": { ... },
     "data": [ ... ]
   }
   ```
4. Selalu tangani skenario error (`catch`) dan berikan pesan ramah pengguna.

---

## 8. Sentralisasi Business Logic & Data Transformation (`src/utils/logic.js`)

Untuk menjaga agar komponen UI (`.jsx`) tetap bersih (pure presenter) dan memudahkan **migrasi/replikasi seluruh kalkulasi bisnis ke Backend API KOMET**, aturan ketat berikut berlaku:

1. **Single Source of Truth Logic:**
   - Seluruh fungsi kalkulasi metrik, penentuan tahun ajaran, formula akademik, ekstraksi KPI, normalisasi respon backend, dan pemetaan/transformasi data tabel **WAJIB** berada di dalam [`src/utils/logic.js`](file:///home/fadjri/projects/Komet/client/src/utils/logic.js).
2. **Larangan Inline Logic di Komponen:**
   - Dilarang keras menulis parsing data rumit, manipulasi array berulang (`slice`, `filter`, `reduce`), penentuan formula pertumbuhan/fluktuasi, atau pembuatan narasi dinamis langsung di dalam file JSX.
   - Komponen hanya boleh memanggil fungsi helper yang di-ekspor oleh `logic.js`.
3. **Kategori Logic di `logic.js`:**
   - **Formatting & Visual Utilities:** `formatNumber`, `formatPercent`, `formatGPA`, `formatDateIndo`.
   - **Kalkulasi Akademik:** `getCurrentAcademicYear` (cut-off 1 September).
   - **Ekstraksi & Normalisasi Domain:** `extractStudentKpis`, `getStudentKpiSubtitles`, `getStudentActiveDescription`, `transformForeignTrend`, `transformIntakeTrend`, `transformDeclineHistory`.
   - **Module Normalizers:** `extractOverviewMetrics`, `extractGraduatesSummary`, `extractMbkmSummary`.
4. **Kesiapan Porting Backend:**
   - Fungsi-fungsi di dalam `logic.js` dapat langsung dijadikan acuan/di-copy ke backend service/controller ketika endpoint backend terkait diimplementasikan atau disempurnakan.

---

## 9. SOP Eksekusi Antigravity AI

Sebelum membuat atau mengubah file:
1. **Periksa apakah komponen sudah ada di `src/components/common/`**. Jika sudah ada, gunakan kembali; jangan buat duplikat.
2. **Pusatkan seluruh kalkulasi dan transformasi data ke `src/utils/logic.js`**. Jangan menaruh logic pengolahan data inline di komponen JSX.
3. **Pertahankan konsistensi warna brand**: Gunakan token warna tema `digital-blue-*` (e.g. `bg-digital-blue-600`, `text-digital-blue-700`, `bg-digital-blue-50`) atau konstanta dari `src/utils/theme.js`.
4. **Pastikan zero-breaking-changes**: Jalankan `npm run build` setelah setiap perubahan besar untuk memastikan tidak ada import error atau type issue.

