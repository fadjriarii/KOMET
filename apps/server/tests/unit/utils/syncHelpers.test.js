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
const {
  isAkunLama,
  cleanText,
  normalizeOptionalText,
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

    it('id_negara "MYS" tanpa nama_negara → "Malaysia" dari fallback ISO-3', () => {
      expect(mapKewarganegaraan('MYS', '')).toBe('Malaysia');
    });

    it('nama_negara tersedia → gunakan nama langsung', () => {
      expect(mapKewarganegaraan('', 'Singapura')).toBe('Singapura');
    });

    it('tidak ada data → default "Indonesia"', () => {
      expect(mapKewarganegaraan('', '')).toBe('Indonesia');
      expect(mapKewarganegaraan(null, null)).toBe('Indonesia');
    });

    it('kode tidak dikenali + tanpa nama → default "Indonesia"', () => {
      expect(mapKewarganegaraan('ZZZ', '')).toBe('Indonesia');
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
});
