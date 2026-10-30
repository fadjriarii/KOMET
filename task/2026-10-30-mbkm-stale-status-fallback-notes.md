# Catatan Cadangan Status Stale Menjadi Selesai

- Status: catatan rencana, belum diimplementasikan.
- Dibuat: 2026-10-30
- Snapshot: file anomali MBKM 2026-10-30; data SEVIMA dibaca hanya dengan GET.
- Tujuan: menyusun urutan sumber data untuk menurunkan status `Selesai` pada
  anomali `Status stale`, tanpa mengubah endpoint utama dan tanpa mengubah data
  sumber di SEVIMA.

## 1. Definisi

- **Status utama**: `status_aktivitas` dari `GET /siakadcloud/v1/aktivitas-mbkm`.
  Di aplikasi, nilai ini berasal dari sync `mbkmActivity.statusAktivitas`.
- **Status stale**: baris dengan `Kategori Anomali` mengandung `Status stale`.
  Pada snapshot ini ada **29 baris**.
- **Status turunan**: status `Selesai` yang dihitung dari cadangan, bukan status
  asli dari SEVIMA. Ini hanya untuk pelaporan/anomali, bukan update ke SEVIMA.
- **Tanggal evaluasi**: 2026-10-30.

Semua 29 baris stale pada snapshot ini memiliki `Status Aktivitas = Disetujui`.
Tidak ada baris stale yang statusnya kosong/null.

## 2. Aturan utama yang diusulkan

Endpoint utama tetap yang sekarang:

```text
GET /siakadcloud/v1/aktivitas-mbkm
  -> status_aktivitas
  -> id_status_aktivitas
```

Aturan:

1. Jika `status_aktivitas` sudah `Selesai` (kode `5`), pakai nilai itu.
2. Jika belum `Selesai`, baru pakai cadangan dengan urutan di bawah.
3. Cadangan hanya menurunkan status untuk laporan; tidak menulis balik ke
   SEVIMA.
4. Jika semua cadangan kosong, status tetap `Disetujui` dan masuk daftar
   belum selesai.

> Catatan penting: pada 29 baris stale, `status_aktivitas` berisi `Disetujui`,
> bukan kosong. Jadi "yang sekarang kosong" harus dibaca sebagai "belum
> `Selesai`", bukan "field null". Kalau yang dimaksud benar-benar null, aturan
> ini tidak akan mengubah baris stale mana pun.

## 3. Urutan cadangan status

Urutan yang diusulkan, dari yang paling langsung ke yang paling longgar:

### Cadangan 1 — aktivitas lebih baru berstatus Selesai

- Sumber: `Aktivitas Lebih Baru` yang berasal dari `GET /aktivitas-mbkm`.
- Syarat:
  - ada aktivitas dengan `id_periode` lebih baru; dan
  - `status_aktivitas = Selesai` (kode `5`).
- Aksi: status stale dianggap `Selesai`.
- Alasan: mahasiswa sudah punya aktivitas pengganti yang tuntas.
- Risiko: aktivitas baru bisa merupakan kegiatan berbeda, bukan pengganti
  aktivitas lama. Perlu verifikasi akademik sebelum dianggap pengganti resmi.

### Cadangan 2 — nilai MBKM valid

- Sumber: `GET /siakadcloud/v1/nilai-mbkm`
- Filter: `f-nim`, `f-id_periode_nilai`
- Field yang dipakai:
  - `is_valid`
  - `nilai_huruf`
  - `nilai_angka`
  - `sks_mata_kuliah`
  - `judul_aktivitas`
  - `id_aktivitas`
- Syarat:
  - record cocok dengan NIM + periode + `judul_aktivitas`; dan
  - `is_valid = 1`; dan
  - `nilai_huruf` / `nilai_angka` terisi.
- Aksi: status stale dianggap `Selesai`.
- Alasan: nilai yang sudah valid menandakan aktivitas sudah dinilai dan
  selesai secara akademik.
- Risiko: nilai valid bukan status aktivitas resmi di SEVIMA.
- Catatan: cadangan ini **tidak** memakai status lulus. Syaratnya tetap nilai
  valid.

### Cadangan 3 — mahasiswa sudah lulus

- Sumber di aplikasi, berurutan:
  1. adanya relasi `graduate` (sumber utama);
  2. `tahunLulus` / `tanggalLulus` terisi;
  3. `Status Keaktifan = Lulus` hanya sebagai proxy jika data kelulusan tidak
     tersedia.
- Syarat: salah satu sumber kelulusan di atas terpenuhi.
- Aksi: status stale dianggap `Selesai`.
- Alasan: mahasiswa yang sudah lulus tidak mungkin masih menjalani aktivitas
  MBKM yang stale.
- Perbaikan dari versi sebelumnya: **jangan hanya memakai
  `Status Keaktifan = Lulus`**. Status keaktifan bisa tidak sinkron dengan data
  kelulusan. Relasi `graduate` dan `tahunLulus` lebih kuat.
- Risiko: lulus bisa terjadi setelah aktivitas, jadi ini sinyal kuat tetapi
  bukan bukti bahwa aktivitas tertentu benar-benar selesai.

### Cadangan 4 — tanggal sudah lewat dan mahasiswa tidak terminal

- Sumber tanggal: `GET /siakadcloud/v1/aktivitas-mbkm`
  - `tanggal_mulai`
  - `tanggal_selesai`
- Sumber status mahasiswa:
  - idealnya status pada `tanggal_selesai` (butuh riwayat status);
  - pada workbook ini dipakai `Status Keaktifan` saat snapshot sebagai proxy.
- Syarat:
  - `tanggal_mulai` terisi dan `<=` tanggal evaluasi;
  - `tanggal_selesai` terisi dan `<` tanggal evaluasi (sudah lewat);
  - pada `tanggal_selesai`, mahasiswa **tidak** berstatus:
    - `Lulus`;
    - `Mengundurkan Diri / Keluar`;
    - `DO` / `Drop Out`;
    - `Dibatalkan` bila status aktivitasnya juga dibatalkan.
- Aksi: status stale dianggap `Selesai`.
- Alasan: aktivitas sudah melewati tanggal selesai dan mahasiswa masih aktif
  pada saat itu, jadi aktivitas dianggap tuntas.
- Batasan: workbook hanya punya status saat ini, bukan riwayat status pada
  tanggal selesai. Jika mahasiswa baru keluar/lulus setelah tanggal selesai,
  aturan ini secara historis seharusnya tetap `Selesai`, tetapi data saat ini
  tidak bisa membuktikannya.
- Jangan pakai aturan ini jika `tanggal_mulai` atau `tanggal_selesai` kosong.

## 4. Dampak pada 29 baris stale

Dengan urutan di atas:

| Sumber status                             |  Baris | Nomor baris                |
| ----------------------------------------- | -----: | -------------------------- |
| Utama sudah `Selesai`                     |      0 | -                          |
| Cadangan 1: aktivitas baru `Selesai`      |      7 | 14, 15, 21, 24, 26, 27, 32 |
| Cadangan 2: nilai MBKM valid              |      3 | 18, 19, 20                 |
| Cadangan 3: mahasiswa lulus               |      3 | 22, 23, 25                 |
| Cadangan 4: tanggal lewat, tidak terminal |     14 | 1-11, 16, 17, 28           |
| **Total menjadi `Selesai`**               | **27** |                            |
| Belum selesai                             |      2 | 12, 13                     |

Rincian 2 baris yang belum selesai:

- Keduanya berstatus `Mengundurkan Diri / Keluar`.
- No. 12 periode `20252`, No. 13 periode `20251`.
- Keduanya punya mata kuliah konversi, tetapi tidak memenuhi cadangan tanggal
  karena status terminal.
- Jika riwayat status menunjukkan keduanya masih aktif pada `tanggal_selesai`,
  keduanya bisa ikut menjadi `Selesai` lewat Cadangan 4.

Semua 29 baris sudah melewati `tanggal_selesai` pada 2026-10-30. Rentang
`tanggal_selesai`: 2024-01-12 sampai 2026-10-20. Tidak ada tanggal selesai di
masa depan.

## 5. Hubungan dengan SKS kosong

Status `Selesai` tidak otomatis mengisi `SKS Konversi`.

Pada file salinan `..._plus_konversi.xlsx`, 4 baris stale masih punya SKS
kosong:

- No. 21, 26, 27: status menjadi `Selesai` lewat aktivitas baru, tetapi SKS
  aktivitas lama tetap kosong.
- No. 25: status menjadi `Selesai` lewat jalur lulus, tetapi SKS tetap kosong.

Jangan menyalin SKS dari aktivitas baru ke aktivitas lama tanpa konfirmasi,
karena itu aktivitas yang berbeda.

## 6. Yang tidak dipakai sebagai cadangan status

- `GET /siakadcloud/v1/logbook-aktivitas-mahasiswa-mbkm`
  - Total data 155, tetapi **0 dari 29** aktivitas stale punya logbook.
  - Tidak bisa dipakai untuk snapshot ini.
- `GET /siakadcloud/v1/pendaftar-lowongan-aktivitas-mbkm`
  - Total data 0.
- `GET /siakadcloud/v1/mata-kuliah-konversi-mbkm`
  - Hanya memberi `sks_mata_kuliah`, bukan status selesai.
  - 25 dari 29 stale punya konversi, tetapi itu bukan bukti status.
- `GET /siakadcloud/v1/nilai-transfer`
  - Nilai transfer, bukan konversi MBKM.
- Transkrip
  - Sampel periode `20261` tidak memuat mata kuliah konversi; tidak cukup
    andal untuk status.
- Aktivitas baru yang masih `Disetujui`
  - Bukan cadangan `Selesai`; masih berjalan.

## 7. Catatan implementasi

- Jangan mengubah `statusAktivitas` di database dari proses ini tanpa
  keputusan terpisah. Cadangan ini adalah status turunan untuk laporan.
- Jika nanti disimpan, simpan sebagai field terpisah, misalnya
  `statusEfektif` atau `statusSelesaiDerived`, beserta `sumberStatus`.
- Jangan menimpa status asli SEVIMA.
- Jangan memakai `new Date()` untuk menentukan stale; gunakan `tanggal_mulai`,
  `tanggal_selesai`, dan tanggal evaluasi yang eksplisit.
- Jika aturan ini masuk sync, hanya jalankan untuk baris yang belum `Selesai`
  dan idempoten.
- Jangan log NIM, nama, atau judul aktivitas.

## 8. Pertanyaan terbuka

1. Konfirmasi bahwa "status sekarang kosong" berarti "belum `Selesai`", bukan
   field `status_aktivitas` null. Semua 29 stale berisi `Disetujui`.
2. Untuk Cadangan 3, apakah relasi `graduate`/`tahunLulus` sudah tersedia di
   data yang akan dipakai? Kalau belum, `Status Keaktifan` tetap dipakai
   sebagai proxy.
3. Untuk Cadangan 4, apakah ada riwayat status mahasiswa per tanggal? Tanpa
   riwayat, status saat ini dipakai sebagai proxy.
4. Apakah `Mengundurkan Diri / Keluar` yang terjadi setelah `tanggal_selesai`
   tetap dianggap `Selesai`? Secara historis seharusnya ya, tetapi data saat
   ini tidak bisa membuktikan tanggal berubahnya.
5. Apakah status turunan ini hanya untuk file anomali, atau akan disimpan di
   database/aplikasi?

## 9. File terkait

- `tmp/Data_Anomali_MBKM_Filtered_20261.xlsx`
- `tmp/Data_Anomali_MBKM_Filtered_20261_plus_konversi.xlsx`
- `task/2026-10-30-mbkm-sks-conversion-notes.md`
- `docs/adr/0005-mbkm-definitions.md`
- `AGENTS.md` bagian 5.2 tentang populasi lulus
