# Rencana: Modularisasi StudentDetailModal

**Context:** `StudentDetailModal.jsx` saat ini 590 baris dan berisi 4 jenis modal detail (active, foreign, intake, decline). Hanya 2 yang lengkap (active, foreign); 2 lainnya belum dikembangkan. Menyimpan semua 4 dalam satu file melanggar prinsip modularitas dan menghambat pengembangan independen per modal.

---

## Target Arsitektur

StudentDetailModal menjadi **thin orchestrator** yang merender sub-komponen berdasarkan `activeModalType`. Setiap jenis modal punya file sendiri.

```
src/modules/students/components/
├── StudentDetailModal.jsx          # Thin wrapper (≈40 baris)
├── StudentActiveDetail.jsx         # Modal Aktif (lengkap, 5-0)
├── StudentForeignDetail.jsx        # Modal Asing (lengkap, 5-0)
├── StudentIntakeDetail.jsx         # Modal Intake (belum jadi, placeholder)
├── StudentDeclineDetail.jsx        # Modal Penurunan (belum jadi, placeholder)
├── StudentBarItem.jsx              # Sudah ada
├── StudentTabPanel.jsx             # Sudah ada
└── TabSkeletonLoader.jsx           # Sudah ada
```

---

## Kontrak Props — Sub-Komponen

Setiap sub-komponen menerima props yang sama:

```tsx
interface StudentDetailProps {
  data: any | null;        // Full API response
  kpis: any;               // Extracted KPIs dari extractStudentKpis
  summary: any | undefined; // data?.summary
  isLoadingDetail: boolean;
  detailError: string | null;
  setIsLoadingDetail: (v: boolean) => void;
  setDetailError: (v: string | null) => void;
  onClose: () => void;
}
```

Setiap sub-komponen **mengelola sendiri** `isLoadingDetail` dan `detailError`-nya (state lokal), kecuali active detail yang perlu fetch API terpisah (`/students/active-students`).

---

## Tanggung Jawab Masing-Masing File

### StudentDetailModal.jsx (Thin Wrapper)
- Import semua sub-komponen
- Kelola state bersama: `isLoadingDetail`, `detailError`, `activeModalType`
- Render sub-komponen berdasarkan `currentModalType`:
  ```jsx
  {currentModalType === 'active' && <StudentActiveDetail ... />}
  {currentModalType === 'foreign' && <StudentForeignDetail ... />}
  {currentModalType === 'intake' && <StudentIntakeDetail ... />}
  {currentModalType === 'decline' && <StudentDeclineDetail ... />}
  ```
- Tetap menggunakan `Modal` wrapper, `showCloseButton={true}`, `originRect`, dll.

### StudentActiveDetail.jsx
- **Pindahkan seluruh** section `{currentModalType === 'active' && ...}` dari StudentDetailModal
- Termasuk: description, KPI count, tabs (Fakultas/Prodi/Jenjang), fetch API detail
- Import hanya: Modal, StudentTabPanel, StudentBarItem, TabSkeletonLoader, StudentService, logic helpers

### StudentForeignDetail.jsx
- **Pindahkan seluruh** section `{currentModalType === 'foreign' && ...}`
- Termasuk: description, percentage, chart (Recharts), table (DataTable)
- Import hanya: Modal, DataTable, EmptyState, logic helpers, theme

### StudentIntakeDetail.jsx
- **Pindahkan** section intake dari StudentDetailModal
- Tambahkan loading/error state handling (saat ini belum ada)
- Placeholder jika data belum tersedia

### StudentDeclineDetail.jsx
- **Pindahkan** section decline dari StudentDetailModal
- Tambahkan loading/error state handling (saat ini belum ada)
- Placeholder jika data belum tersedia

---

## Urutan Eksekusi

1. **Buat StudentDetailModal.jsx baru** (thin wrapper) — backup dulu file lama
2. **Buat StudentActiveDetail.jsx** — pindahkan section active + import dependencies
3. **Buat StudentForeignDetail.jsx** — pindahkan section foreign + import dependencies
4. **Buat StudentIntakeDetail.jsx** — pindahkan section intake + basic structure
5. **Buat StudentDeclineDetail.jsx** — pindahkan section decline + basic structure
6. **Hapus** StudentBarItem.jsx, StudentTabPanel.jsx, TabSkeletonLoader.jsx dari StudentDetailModal (sudah dipakai oleh sub-komponen)
7. **Pastikan** tidak ada broken imports — run `npm run build` dan `npx eslint`

---

## State Management Decision

| State | Owner | Alasan |
|---|---|---|
| `isLoadingDetail` | StudentDetailModal (wrapper) | Dibagikan ke semua sub-komponen; wrapper mengontrol kapan loading dimulai |
| `detailError` | StudentDetailModal (wrapper) | Sama — wrapper menangani error dari semua sub-komponen |
| `activeStudentTab` | Masing-masing sub-komponen | Hanya relevan untuk active modal (3 tabs) |
| `activeForeignTab` | StudentForeignDetail | Hanya relevan untuk foreign modal (2 tabs) |
| `tabSlideDirection` | Masing-masing sub-komponen | Per-tab state |
| `cachedTypeRef` | StudentDetailModal (wrapper) | Dibutuhkan untuk animasi close Modal |

Alternatif: Setiap sub-komponen mengelola state-nya sendiri. Wrapper hanya meneruskan props. Ini lebih bersih dan lebih mudah diuji.

---

## Risk

- **Pindah data fetch**: Active detail fetch API (`/students/active-students`) berpindah dari wrapper ke `StudentActiveDetail`. Pastikan dependency array `useEffect` masih benar.
- **Shared state via props**: Jika `isLoadingDetail` dikelola wrapper, sub-komponen harus menerima setter. Alternatif: biarkan setiap sub-komponen mengelola loading-nya sendiri (lebih terisolasi).
- **Import circular**: Pastikan tidak ada import cycle antara sub-komponen.

---

## Validation

- `npm run build` — tanpa error
- `npx eslint src/modules/students/` — tanpa error
- Pastikan 2 modal yang sudah ada (active, foreign) masih berfungsi setelah refactor
- Pastikan 2 modal placeholder (intake, decline) tidak error saat dibuka
