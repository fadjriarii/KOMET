import { describe, expect, it } from 'vitest';
import {
  PAGINATION_FIELDS,
  RESPONSE_CONTRACTS,
  contractFor,
  contractProblems,
} from '../src/contracts.js';

const CONTRACT = RESPONSE_CONTRACTS['/graduates/list'];
const OK_PAGINATION = Object.fromEntries(PAGINATION_FIELDS.map((key) => [key, 1]));
const row = (overrides = {}) => ({
  ...Object.fromEntries(CONTRACT.rows.map((key) => [key, ''])),
  ...overrides,
});
const page = (rows, pagination = OK_PAGINATION) => ({ data: rows, pagination });

describe('kontrak respons', () => {
  it('setiap kontrak mendaftar field unik dan memakai pagination yang sama', () => {
    for (const [path, contract] of Object.entries(RESPONSE_CONTRACTS)) {
      const lists = [contract.rows, contract.fields, contract.kpis].filter(Boolean);
      expect(lists.length, path).toBeGreaterThan(0);
      for (const list of lists) {
        expect(list.length, path).toBeGreaterThan(0);
        expect(new Set(list).size, path).toBe(list.length);
      }
      if (contract.rows) expect(contract.pagination, path).toEqual(PAGINATION_FIELDS);
    }
  });

  it('ringkasan yang sesuai kontrak tidak menghasilkan masalah', () => {
    for (const [path, contract] of Object.entries(RESPONSE_CONTRACTS)) {
      if (!contract.kpis) continue;
      const payload = Object.fromEntries(
        [...contract.fields, ...contract.kpis].map((key) => [key, '']),
      );
      // `kpis` harus objek terpisah, bukan kunci datar di tingkat atas.
      delete payload.kpis;
      payload.kpis = Object.fromEntries(contract.kpis.map((key) => [key, 1]));
      expect(contractProblems(contract, payload), path).toEqual([]);
    }
  });

  it('KPI yang dibuang, diganti namanya, atau lupa diumumkan tertangkap', () => {
    const contract = RESPONSE_CONTRACTS['/students/summary'];
    const kpis = () => Object.fromEntries(contract.kpis.map((key) => [key, 1]));
    const payload = (overrides = {}) => ({
      success: true,
      summary: {},
      kpiFilterScope: {},
      kpis: kpis(),
      ...overrides,
    });

    const yangDibuang = kpis();
    delete yangDibuang.activeStudentsCount;
    expect(contractProblems(contract, payload({ kpis: yangDibuang }))).toEqual([
      "kpi 'activeStudentsCount' hilang",
    ]);
    expect(contractProblems(contract, payload({ kpis: { ...kpis(), activeStudents: 1 } }))).toEqual(
      ["kpi 'activeStudents' tidak terdaftar"],
    );

    const tanpaKpis = payload();
    delete tanpaKpis.kpis;
    expect(contractProblems(contract, tanpaKpis)).toEqual([
      "field 'kpis' hilang",
      '`kpis` bukan objek',
    ]);
    const tanpaScope = payload();
    delete tanpaScope.kpiFilterScope;
    expect(contractProblems(contract, tanpaScope)).toEqual(["field 'kpiFilterScope' hilang"]);
  });

  it('baris yang sesuai kontrak tidak menghasilkan masalah', () => {
    expect(contractProblems(CONTRACT, page([row()]))).toEqual([]);
  });

  it('kolom yang dibuang atau diganti namanya tertangkap sebagai pelanggaran', () => {
    const missing = row();
    delete missing.ipk;
    expect(contractProblems(CONTRACT, page([missing]))).toEqual(["field 'ipk' hilang dari baris"]);
    expect(contractProblems(CONTRACT, page([row({ program_studi: 'x' })]))).toContain(
      "field 'program_studi' tidak terdaftar",
    );
  });

  it('pagination yang kehilangan kunci tetap dilaporkan walau barisnya kosong', () => {
    expect(contractProblems(CONTRACT, page([], { page: 1, limit: 10 }))).toEqual([
      'pagination.total hilang',
      'pagination.totalPages hilang',
    ]);
  });

  it('`data` yang bukan array adalah pelanggaran paling serius', () => {
    expect(contractProblems(CONTRACT, { data: null })).toEqual(['`data` bukan array']);
  });

  it('endpoint tanpa kontrak tidak diperiksa', () => {
    expect(contractFor('/sync/status')).toBeNull();
    expect(contractProblems(contractFor('/sync/status'), { whatever: true })).toEqual([]);
  });

  it('path dengan query dan awalan /api tetap dikenali', () => {
    expect(contractFor('/api/graduates/list?limit=5&page=2')).toBe(CONTRACT);
    expect(contractFor('/graduates/list')).toBe(CONTRACT);
  });
});
