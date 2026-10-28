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
  it('lima kartu: 1 kolom ponsel, 2+2+1 tablet, 3+2 desktop tanpa slot kosong', () => {
    const grid = gridOf(5);
    expect(grid.className).toContain('grid-cols-1');
    expect(grid.className).toContain('sm:grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-6');
    const spans = [...grid.children].map((child) => child.className);
    spans.slice(0, 3).forEach((className) => expect(className).toContain('lg:col-span-2'));
    expect(spans[3]).toContain('lg:col-span-3');
    expect(spans[4]).toContain('sm:col-span-2');
    expect(spans[4]).toContain('lg:col-span-3');
  });

  it('empat kartu tetap grid 4 kolom tanpa span', () => {
    const grid = gridOf(4);
    expect(grid.className).toContain('lg:grid-cols-4');
    [...grid.children].forEach((child) => expect(child.className).not.toContain('col-span'));
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
