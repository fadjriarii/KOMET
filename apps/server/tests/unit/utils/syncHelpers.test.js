import { describe, it, expect } from 'vitest';
const {
  getPeriodeFromTanggalTransfer,
  formatAngkatan,
  normalizeAcademicPeriod,
  extractPeriode,
  hitungSemester,
  getCurrentAcademicPeriode,
} = require('../../../src/controllers/sync/academicPeriod');
const { isStatusKeluar, mapKewarganegaraan } = require('../../../src/controllers/sync/codeMaps');
const { mapStudentRow } = require('../../../src/controllers/sync/mapStudentRow');
const { createIssueCollector } = require('../../../src/controllers/sync/syncIssues');
const {
  isAkunLama,
  cleanText,
  normalizeOptionalText,
  normalizeProdiCode,
  sanitizeProdiName,
} = require('../../../src/controllers/sync/text');

describe('sync helpers — Data Cleansing & Transformation', () => {
  // ─── getPeriodeFromTanggalTransfer ───
  describe('getPeriodeFromTanggalTransfer', () => {
    it('Ganjil September - Februari -> kode tahun akademik awal', () => {
      expect(getPeriodeFromTanggalTransfer('2024-09-02')).toBe('20241');
      expect(getPeriodeFromTanggalTransfer('2024-12-15')).toBe('20241');
      // Jan & Feb 2025 masih Ganjil TA 2024/2025.
      expect(getPeriodeFromTanggalTransfer('2025-01-10')).toBe('20241');
      expect(getPeriodeFromTanggalTransfer('2025-02-10')).toBe('20241');
    });

    it('Genap Maret - Agustus -> kode tahun akademik awal', () => {
      // Maret adalah bulan pertama Genap, bukan penutup Ganjil.
      expect(getPeriodeFromTanggalTransfer('2025-03-01')).toBe('20242');
      expect(getPeriodeFromTanggalTransfer('2025-04-10')).toBe('20242');
      expect(getPeriodeFromTanggalTransfer('2025-05-20')).toBe('20242');
      expect(getPeriodeFromTanggalTransfer('2025-08-31')).toBe('20242');
    });

    it('memakai aturan yang sama dengan getCurrentAcademicPeriode', () => {
      // Dua implementasi paralel dulu berbeda di bulan Maret; kunci keduanya.
      for (const tanggal of [
        '2024-09-02',
        '2025-01-10',
        '2025-02-10',
        '2025-03-01',
        '2025-08-31',
      ]) {
        const date = new Date(tanggal);
        expect(getPeriodeFromTanggalTransfer(tanggal)).toBe(getCurrentAcademicPeriode(date));
      }
    });

    it('input kosong/invalid -> string kosong', () => {
      expect(getPeriodeFromTanggalTransfer('')).toBe('');
      expect(getPeriodeFromTanggalTransfer(null)).toBe('');
      expect(getPeriodeFromTanggalTransfer('invalid-date')).toBe('');
    });
  });

  // ─── formatAngkatan ───
  describe('formatAngkatan', () => {
    it('digit 1 atau 2 → label ajaran penuh', () => {
      expect(formatAngkatan('20261')).toBe('2026/2027');
      expect(formatAngkatan('20262')).toBe('2026/2027');
    });

    describe('normalizeAcademicPeriod', () => {
      it('normalizes legacy separators and infers the missing term', () => {
        expect(normalizeAcademicPeriod('2014/2')).toBe('20142');
        expect(normalizeAcademicPeriod('2014-1')).toBe('20141');
        expect(normalizeAcademicPeriod('2014')).toBe('20141');
      });
    });

    it('4 digit tahun → label ajaran penuh', () => {
      expect(formatAngkatan('2026')).toBe('2026/2027');
    });

    it('input kosong → string kosong', () => {
      expect(formatAngkatan('')).toBe('');
      expect(formatAngkatan(null)).toBe('');
    });
  });

  // ─── extractPeriode ───
  describe('extractPeriode', () => {
    it('"20251" → "Ganjil"', () => {
      expect(extractPeriode('20251')).toBe('Ganjil');
    });

    it('"20252" → "Genap"', () => {
      expect(extractPeriode('20252')).toBe('Genap');
    });

    it('input pendek → string kosong', () => {
      expect(extractPeriode('2025')).toBe('');
      expect(extractPeriode('')).toBe('');
    });
  });

  // ─── hitungSemester ───
  describe('hitungSemester', () => {
    it('masuk Ganjil 2022, selesai Ganjil 2024 → semester 5', () => {
      // (2024-2022)*2 + (1-1) + 1 = 5
      expect(hitungSemester('20221', '20241')).toBe(5);
    });

    it('masuk Ganjil 2022, selesai Genap 2024 → semester 6', () => {
      // (2024-2022)*2 + (2-1) + 1 = 6
      expect(hitungSemester('20221', '20242')).toBe(6);
    });

    it('masuk Ganjil 2026, selesai Ganjil 2026 (semester 1)', () => {
      // (2026-2026)*2 + (1-1) + 1 = 1
      expect(hitungSemester('20261', '20261')).toBe(1);
    });

    it('input kosong → semester 1 sebagai fallback', () => {
      expect(hitungSemester('')).toBe(1);
      expect(hitungSemester(null)).toBe(1);
    });

    it('periodeTerakhir tidak diberikan → hitung vs periode berjalan saat ini', () => {
      const now = new Date();
      const bulan = now.getMonth() + 1;
      const tahun = now.getFullYear();
      const term = bulan >= 8 ? 1 : 2;
      const currentPeriode = `${tahun}${term}`;

      const tahunMasuk = 2022;
      const termMasuk = 1;
      const tahunAkhir = parseInt(currentPeriode.substring(0, 4));
      const termAkhir = parseInt(currentPeriode.substring(4, 5));
      const expected = (tahunAkhir - tahunMasuk) * 2 + (termAkhir - termMasuk) + 1;

      expect(hitungSemester('20221', null)).toBe(Math.max(1, expected));
    });

    it('menggunakan periode masuk awal untuk mahasiswa transfer', () => {
      expect(hitungSemester('20252', '20252', '20231')).toBe(6);
      expect(hitungSemester('20231', '20252')).toBe(6);
    });
  });

  // ─── getCurrentAcademicPeriode ───
  describe('getCurrentAcademicPeriode', () => {
    it('mengembalikan string 5 digit', () => {
      expect(getCurrentAcademicPeriode()).toMatch(/^\d{5}$/);
    });

    it('September - Februari -> YYYY1 (Ganjil)', () => {
      expect(getCurrentAcademicPeriode(new Date('2026-10-01'))).toBe('20261');
      expect(getCurrentAcademicPeriode(new Date('2026-12-15'))).toBe('20261');
      expect(getCurrentAcademicPeriode(new Date('2027-01-20'))).toBe('20261');
      expect(getCurrentAcademicPeriode(new Date('2027-02-28'))).toBe('20261');
    });

    it('Maret - Agustus -> YYYY2 (Genap)', () => {
      expect(getCurrentAcademicPeriode(new Date('2027-03-01'))).toBe('20262');
      expect(getCurrentAcademicPeriode(new Date('2027-05-15'))).toBe('20262');
      expect(getCurrentAcademicPeriode(new Date('2027-08-31'))).toBe('20262');
    });
  });

  // ─── isStatusKeluar ───
  describe('isStatusKeluar', () => {
    it('status "L" (Lulus) → true', () => {
      expect(isStatusKeluar('L')).toBe(true);
    });

    it('status "D" (Drop Out) → true', () => {
      expect(isStatusKeluar('D')).toBe(true);
    });

    it('status "A" (Aktif) → false', () => {
      expect(isStatusKeluar('A')).toBe(false);
    });

    it('status kosong → false', () => {
      expect(isStatusKeluar('')).toBe(false);
      expect(isStatusKeluar(null)).toBe(false);
    });
  });

  // ─── isAkunLama ───
  describe('isAkunLama', () => {
    it('nama mengandung "Akun Lama" → true (case-insensitive)', () => {
      expect(isAkunLama('Bio Medis dan Rekayasa Hayati (Akun Lama)')).toBe(true);
      expect(isAkunLama('Teknologi Pangan (akun lama)')).toBe(true);
    });

    it('nama mengandung "keterangan akun lama" → true', () => {
      expect(isAkunLama('keterangan akun lama')).toBe(true);
    });

    it('nama normal → false', () => {
      expect(isAkunLama('Bio Teknologi')).toBe(false);
      expect(isAkunLama('Ilmu Kesehatan dan Biosains')).toBe(false);
    });

    it('input kosong/null → false', () => {
      expect(isAkunLama('')).toBe(false);
      expect(isAkunLama(null)).toBe(false);
    });
  });

  // ─── mapKewarganegaraan ───
  describe('mapKewarganegaraan', () => {
    it('id_negara "IDN" + nama_negara "Indonesia" → "Indonesia"', () => {
      expect(mapKewarganegaraan('IDN', 'Indonesia')).toBe('Indonesia');
    });

    it('id_negara tanpa nama_negara: IDN → Indonesia, kode lain → tak diketahui', () => {
      expect(mapKewarganegaraan('IDN', '')).toBe('Indonesia');
      expect(mapKewarganegaraan('MYS', '')).toBe('');
    });

    it('nama_negara tersedia → gunakan nama langsung', () => {
      expect(mapKewarganegaraan('', 'Singapura')).toBe('Singapura');
    });

    it('tidak ada data → "" (tidak diketahui, jangan default Indonesia)', () => {
      expect(mapKewarganegaraan('', '')).toBe('');
      expect(mapKewarganegaraan(null, null)).toBe('');
    });

    it('id_negara menang atas tempat_lahir bila keduanya terisi', () => {
      expect(mapKewarganegaraan('IDN', '', 'France')).toBe('Indonesia');
      expect(mapKewarganegaraan('', 'Singapura', 'Jakarta')).toBe('Singapura');
    });

    it('tempat_lahir dipakai sementara bila id_negara kosong', () => {
      expect(mapKewarganegaraan('', '', 'Beauvais')).toBe('Perancis');
      expect(mapKewarganegaraan('', '', 'France')).toBe('Perancis');
      expect(mapKewarganegaraan('', '', 'Singapore')).toBe('Singapura');
      expect(mapKewarganegaraan('', '', 'Jakarta')).toBe('Indonesia');
    });

    it('NIK valid tanpa id_negara = pasti Indonesia', () => {
      expect(mapKewarganegaraan('', '', 'France', '3201010101010101')).toBe('Indonesia');
    });

    it('NIK placeholder tidak dihitung (lanjut ke tempat lahir)', () => {
      expect(mapKewarganegaraan('', '', 'Beauvais', '0000000000000000')).toBe('Perancis');
      expect(mapKewarganegaraan('', '', '', '123')).toBe('');
    });

    it('kota tak dikenal tampil apa adanya agar terlihat dan dikoreksi', () => {
      expect(mapKewarganegaraan('', '', 'Lyon')).toBe('Lyon');
    });

    it('kode tidak dikenali + tanpa nama → "" (tidak diketahui)', () => {
      expect(mapKewarganegaraan('ZZZ', '')).toBe('');
    });
  });

  // ─── cleanText ───
  describe('cleanText', () => {
    it('membersihkan HTML entities dan lowercase', () => {
      expect(cleanText('Teknik &amp; Informatika ')).toBe('teknik & informatika');
    });

    it('input kosong → string kosong', () => {
      expect(cleanText('')).toBe('');
      expect(cleanText(null)).toBe('');
    });
  });

  // Jaminan jalur tulis: kolom teks bebas boleh kosong dalam SATU bentuk (`''`),
  // sehingga read-path tidak perlu mengenal placeholder sumber lagi.
  describe('normalizeOptionalText', () => {
    it.each([
      ['dash as', '-'],
      ['dash en', '–'],
      ['spasi saja', '  '],
      ['null', null],
      ['undefined', undefined],
    ])('placeholder kosong (%s) → string kosong', (_label, value) => {
      expect(normalizeOptionalText(value)).toBe('');
    });

    it('nilai asli dipangkas dan entity HTML-nya dibersihkan', () => {
      expect(normalizeOptionalText('  PT XYZ &amp; Co ')).toBe('PT XYZ & Co');
    });
  });

  describe('normalizeProdiCode', () => {
    it('XX61101 dan 61101 satu identitas', () => {
      expect(normalizeProdiCode('XX61101')).toBe('61101');
      expect(normalizeProdiCode('61101')).toBe('61101');
      expect(normalizeProdiCode('')).toBe('');
    });
  });

  describe('mapStudentRow lewat kode prodi', () => {
    const nameMap = new Map();
    const resolveFakultas = () => 'Fakultas X';
    const codeMap = new Map([
      ['61101', { nama: 'Magister Bio Manajemen', fakultas: 'Bisnis dan Manajemen' }],
    ]);
    const attr = (overrides) => ({
      nim: '1',
      nama: 'A',
      id_jenjang: 'S1',
      id_periode: '20261',
      id_status_mahasiswa: 'A',
      status_mahasiswa: 'Aktif',
      program_studi: 'Biomanajemen (Akun Lama)',
      id_program_studi: 'XX61101',
      id_negara: 'IDN',
      nama_negara: 'Indonesia',
      ...overrides,
    });

    it('kode dikenal: nama resmi + fakultas dari endpoint', () => {
      const row = mapStudentRow(attr(), nameMap, resolveFakultas, {
        prodiCodeMap: codeMap,
        issues: createIssueCollector(),
      });
      expect(row.programStudi).toBe('Magister Bio Manajemen');
      expect(row.fakultas).toBe('Bisnis dan Manajemen');
      expect(row.kodeProgramStudi).toBe('61101');
      expect(row.idNegara).toBe('IDN');
    });

    it('kode tak dikenal: nama mentah tetap tampil + detector mencatat', () => {
      const issues = createIssueCollector();
      const row = mapStudentRow(
        attr({ id_program_studi: '99999', program_studi: 'Prodi Baru X' }),
        nameMap,
        resolveFakultas,
        { prodiCodeMap: codeMap, issues },
      );
      expect(row.programStudi).toBe('Prodi Baru X');
      expect(row.kodeProgramStudi).toBe('99999');
      expect([...issues.prodiCodes]).toEqual(['99999']);
    });
  });
});
