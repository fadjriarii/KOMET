# Antigravity Rules — KOMET Frontend Project

Dokumen ini adalah aturan tetap (SOP) bagi Antigravity AI dalam memproses setiap task pada proyek KOMET.

Seluruh pedoman teknis lengkap telah didefinisikan di:
👉 [architecture_guidelines.md](file:///home/fadjri/projects/Komet/client/requirements/architecture_guidelines.md)

### Checklist Wajib Setiap Task:
1. **NO MOCK / DUMMY DATA**:
   - DILARANG KERAS membuat atau memasang mock / dummy data palsu yang di-hardcode pada komponen frontend.
   - Saat backend belum terhubung atau sedang memuat data, **WAJIB menggunakan Skeleton Loading** (`Skeleton.jsx` / `isLoading={true}`).
2. **Konsistensi Palet Warna (`digital-blue`)**:
   - Gunakan selalu palet `digital-blue` (50–950) baik di Tailwind CSS maupun konstanta chart dari [theme.js](file:///home/fadjri/projects/Komet/client/src/utils/theme.js).
   - Primary Accent: `digital-blue-600`, Active/Text: `digital-blue-700`, Soft Background: `digital-blue-50/100`.
3. **Pemeriksaan Komponen Bersama (DRY)**:
   - Selalu gunakan komponen dari `src/components/common/` (seperti `StatCard`, `ChartCard`, `DataTable`, `Modal`, `Button`, `Badge`, `Skeleton`) saat membuat tampilan baru.
4. **Modularitas Domain**:
   - Simpan halaman, hooks, dan service spesifik di bawah `src/modules/<nama_modul>/`.
5. **Integritas Logic & Style**:
   - Jangan mengubah logika yang sudah berfungsi atau gaya coding yang ada tanpa instruksi user.
6. **Verifikasi Build**:
   - Selalu pastikan aplikasi berhasil di-build (`npm run build`) tanpa error setelah melakukan perubahan.
