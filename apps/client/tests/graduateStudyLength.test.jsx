import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MetricSummaryGrid from '../src/components/common/cards/MetricSummaryGrid';
import { studyLengthSubtitle } from '../src/modules/graduates/hooks/useGraduateKpiDisplay';

const cards = (count) =>
  Array.from({ length: count }, (_, index) => ({
    key: `card-${index}`,
    title: `Kartu ${index + 1}`,
    value: String(index),
  }));

const gridOf = (count) =>
  render(<MetricSummaryGrid cards={cards(count)} cardProps={{}} />).container.firstChild;

describe('MetricSummaryGrid', () => {
  it('kartu unggulan: 2 kolom × 2 baris di desktop, baris penuh di tablet; sisanya 1 sel', () => {
    const list = cards(5).map((card, index) => ({ ...card, featured: index === 0 }));
    const grid = render(<MetricSummaryGrid cards={list} cardProps={{}} />).container.firstChild;
    expect(grid.className).toContain('lg:grid-cols-4');
    const [featured, ...rest] = [...grid.children].map((child) => child.className);
    expect(featured).toContain('sm:col-span-2');
    expect(featured).toContain('lg:col-span-2');
    expect(featured).toContain('lg:row-span-2');
    rest.forEach((className) => expect(className).not.toContain('span'));
  });

  it('empat kartu tanpa kartu unggulan tetap grid 4 kolom tanpa span', () => {
    const grid = gridOf(4);
    expect(grid.className).toContain('lg:grid-cols-4');
    [...grid.children].forEach((child) => expect(child.className).not.toContain('col-span'));
  });

  it('kartu dengan breakdown menampilkan ubin per kategori, bukan satu angka', () => {
    const list = [
      {
        key: 'study',
        featured: true,
        title: 'Rata-rata Masa Studi Lulusan',
        caption: 'Durasi kelulusan menurut jenjang program',
        breakdown: [
          { key: 's1', label: 'S1', value: '4.1', unit: 'Thn', caption: '8.2 semester' },
          { key: 's2', label: 'S2', value: '2.1', unit: 'Thn', caption: '4.2 semester' },
        ],
        subtitle: 'Kalimat ringkasan.',
      },
    ];
    const { getByText, queryByRole } = render(<MetricSummaryGrid cards={list} cardProps={{}} />);
    expect(getByText('Durasi kelulusan menurut jenjang program')).toBeTruthy();
    expect(getByText('8.2 semester')).toBeTruthy();
    expect(getByText('4.2 semester')).toBeTruthy();
    expect(queryByRole('heading', { level: 3 })).toBeNull();
  });
});

describe('studyLengthSubtitle', () => {
  const scope = { suffix: '', searchSuffix: '' };
  const card = {
    value: 8.18,
    years: 4.09,
    headlineJenjang: 'S1',
    isEmpty: false,
    scope: { phrase: 'pada tahun ajaran 2025/2026' },
    byJenjang: [
      { key: 's1', jenjang: 'S1', label: 'S1', value: 8.18, years: 4.09, count: 125 },
      { key: 's2', jenjang: 'S2', label: 'S2', value: 4.17, years: 2.09, count: 12 },
    ],
  };

  it('jenjang utama dengan tahun, aturan cuti, dan rincian jenjang lain', () => {
    expect(studyLengthSubtitle(card, scope)).toBe(
      'Lulusan S1 rata-rata 8.2 semester (4.1 tahun) pada tahun ajaran 2025/2026, setelah dikurangi maksimal 2 semester cuti. Rincian: S2 4.2 semester.',
    );
  });

  it('kosong atau belum ada di payload: kalimat kombinasi kosong, tidak crash', () => {
    expect(studyLengthSubtitle({ isEmpty: true }, scope)).toContain('Tidak ada lulusan');
    expect(studyLengthSubtitle({}, scope)).toContain('Tidak ada lulusan');
  });
});
