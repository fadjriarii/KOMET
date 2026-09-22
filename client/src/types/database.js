/**
 * Definisi tipe (JSDoc) untuk struktur data dump KomatQAmit.
 * File ini menjadi referensi tipe statis bagi tooling editor dan
 * dokumentasi internal tim pengembang.
 */

/**
 * @typedef {Object} Kelulusan
 * @property {string} nim - Nomor Induk Mahasiswa
 * @property {string} periode - Periode akademik saat data diambil
 * @property {string} nama - Nama lengkap lulusan
 * @property {number} angkatan - Tahun masuk (angkatan)
 * @property {string} program_studi - Nama program studi
 * @property {string} fakultas - Nama fakultas
 * @property {string} jenjang - Jenjang pendidikan ("S1" atau "S2")
 * @property {string} status_keaktifan - Status keaktifan mahasiswa
 * @property {number} tahun_lulus - Tahun kelulusan (0 berarti belum/tidak valid)
 * @property {number} ipk - Indeks Prestasi Kumulatif
 * @property {number} sks_lulus - Total SKS saat lulus
 * @property {string|null} predikat_lulus - Predikat kelulusan
 * @property {string|null} updated_at - Stempel waktu pembaruan data
 */

/**
 * @typedef {Object} Mahasiswa
 * @property {string} nim - Nomor Induk Mahasiswa
 * @property {string} periode - Periode akademik
 * @property {string} nama - Nama lengkap mahasiswa
 * @property {number} angkatan - Tahun masuk (angkatan)
 * @property {string} program_studi - Nama program studi
 * @property {string} fakultas - Nama fakultas
 * @property {string} status_keaktifan - Status keaktifan mahasiswa
 * @property {number} semester - Semester aktif saat ini
 * @property {string} kewarganegaraan - Kewarganegaraan mahasiswa
 * @property {string|null} updated_at - Stempel waktu pembaruan data
 */

/**
 * @typedef {Object} GpaPerProgram
 * @property {string} program - Nama program studi
 * @property {string} gpa - Rata-rata IPK diformat 2 desimal
 * @property {number} gpaValue - Rata-rata IPK dalam bentuk angka
 * @property {number} count - Jumlah lulusan pada program tersebut
 */

/**
 * @typedef {Object} GraduatesPerYear
 * @property {number} year - Tahun kelulusan
 * @property {number} graduates - Jumlah lulusan pada tahun tersebut
 */

export {};
