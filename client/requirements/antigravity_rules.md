# Antigravity Rules — KOMET Frontend Project

Dokumen ini adalah aturan tetap (SOP Mandatori) bagi Antigravity AI dalam memproses setiap task pada proyek KOMET.

Seluruh pedoman teknis lengkap telah didefinisikan di:
👉 [architecture_guidelines.md](file:///home/fadjri/projects/Komet/client/requirements/architecture_guidelines.md)

---

### 📋 Checklist Wajib Setiap Task:

1. **NO MOCK / DUMMY DATA**:
   - **DILARANG KERAS** membuat atau memasang mock / dummy data palsu yang di-hardcode pada komponen frontend.
   - Saat backend belum terhubung atau sedang memuat data, **WAJIB menggunakan Skeleton Loading** (`Skeleton.jsx` / `isLoading={true}`).

2. **Clean Presenter UI & Zero Inline Logic**:
   - Komponen React (`.jsx`) **HANYA bertindak sebagai pure presenter** (menerima props dan merender UI).
   - **DILARANG** menulis business logic, formula kalkulasi, manipulasi array berulang (`slice`, `filter`, `reduce`), atau pembuatan narasi dinamis langsung di dalam file JSX.
   - **Prioritas Data Backend**: Jika kalkulasi/metrik sudah dihitung oleh backend (lihat [Backend-Documentation.md](file:///home/fadjri/projects/Komet/client/requirements/Backend-Documentation.md)), gunakan langsung field dari backend.
   - **Kesiapan Porting Backend**: Jika logic/transformasi belum tersedia di backend, **WAJIB dipusatkan di [src/utils/logic.js](file:///home/fadjri/projects/Komet/client/src/utils/logic.js)** agar user dapat memindahkannya ke Backend Controller/Service dengan mudah nantinya.

3. **Prinsip DRY & Arsitektur Modular Menyeluruh**:
   - **DILARANG menduplikasi fungsi atau komponen dengan tujuan yang sama** di file berbeda.
   - **Gunakan Komponen Bersama (`src/components/common/`)**:
     - Modal Container: `Modal.jsx`
     - Modal Header 80/20: `ModalSummaryBanner.jsx`
     - Modal Tab Bar: `ModalTabNav.jsx` & hook `useTabTransition.js`
     - Modal Table: `ModalTable.jsx`
     - Cards: `StatCard.jsx`, `ChartCard.jsx`
     - Feedback: `Skeleton.jsx`, `EmptyState.jsx`, `LoadingSpinner.jsx`
     - Tables: `DataTable.jsx`

4. **Konsistensi Visual & Palet Warna (`digital-blue`)**:
   - Gunakan selalu palet `digital-blue` (50–950) baik di Tailwind CSS maupun konstanta chart dari [theme.js](file:///home/fadjri/projects/Komet/client/src/utils/theme.js).
   - Primary Accent: `digital-blue-600`, Active/Text: `digital-blue-700`, Soft Background: `digital-blue-50/100`.
   - Formula / Rumus di dalam paragraf wajib di-highlight dengan tag badge monospace.

5. **Modularitas Domain (`src/modules/<nama_modul>/`)**:
   - Simpan halaman (`pages/`), popup modal (`components/modals/`), hooks (`hooks/`), dan service spesifik (`services/`) di bawah modul domain terkait.

6. **Verifikasi Build**:
   - Selalu pastikan aplikasi berhasil di-build (`npm run build`) tanpa error setelah setiap perubahan.
