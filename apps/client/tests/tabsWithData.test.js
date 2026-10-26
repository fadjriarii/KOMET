import { describe, expect, it } from 'vitest';
import { tabsWithData } from '../src/components/common/modals/tabsWithData';

const TABS = [{ key: 'tren' }, { key: 'predikat' }, { key: 'prodi' }];
const keys = (tabs) => tabs.map((tab) => tab.key);

describe('tabsWithData', () => {
  it('menyembunyikan tab dengan ≤ 1 kategori berdata, tab lain tetap', () => {
    const items = {
      predikat: [{ name: 'Memuaskan', count: 4 }],
      prodi: [
        { name: 'A', count: 3 },
        { name: 'B', count: 0 },
      ],
    };
    expect(keys(tabsWithData(TABS, items))).toEqual(['tren']);
  });

  it('dua kategori berdata atau lebih tetap tampil', () => {
    const items = { predikat: [{ count: 1 }, { count: 2 }], prodi: [] };
    expect(keys(tabsWithData(TABS, items))).toEqual(['tren', 'predikat']);
  });

  it('selama memuat semua tab tampil', () => {
    expect(keys(tabsWithData(TABS, { predikat: [] }, { isLoading: true }))).toEqual(keys(TABS));
  });
});
