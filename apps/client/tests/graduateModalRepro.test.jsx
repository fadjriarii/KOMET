import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import TotalGraduatesModal from '../src/modules/graduates/components/modals/TotalGraduatesModal';
import GpaOverviewModal from '../src/modules/graduates/components/modals/GpaOverviewModal';
import OnTimeGraduationModal from '../src/modules/graduates/components/modals/OnTimeGraduationModal';
import CohortTrendChart from '../src/components/common/charts/CohortTrendChart';
import StudySuccessModal from '../src/modules/graduates/components/modals/StudySuccessModal';
import { compactBarLayout } from '../src/components/common/charts/compactBarLayout';
import { useDetail } from '../src/modules/graduates/graduateQueries';

vi.mock('../src/modules/graduates/graduateQueries', () => ({
  useDetail: vi.fn(),
}));

const S1 = (value, extra = {}) => ({ key: 's1', jenjang: 'S1', label: 'S1', value, ...extra });
const SCOPE = { label: '2025/2026', phrase: 'pada tahun ajaran 2025/2026' };

const SUMMARY = {
  success: true,
  kpis: {
    cards: {
      total: { value: 271, isEmpty: false, scope: SCOPE, byJenjang: [S1(271)] },
      gpa: { value: 3.53, count: 271, isEmpty: false, scope: SCOPE, byJenjang: [S1(3.53)] },
      onTime: { value: 75.5, isEmpty: false, scope: SCOPE, byJenjang: [S1(75.5, { batas: 4 })] },
      studySuccess: {
        value: 88.2,
        headlineJenjang: 'S1',
        isEmpty: false,
        ignoredFilters: [],
        byJenjang: [S1(88.2, { angkatan: '2018/2019', batas: 8 })],
      },
    },
  },
  summary: {},
};

const DETAILS = {
  'total-lulusan': {
    byYear: [{ tahun: '2023/2024', s1Count: 46, total: 46 }],
    jenjangs: [{ key: 's1', jenjang: 'S1', label: 'S1', dataKey: 's1Count' }],
  },
  distribution: {
    total: 271,
    byPredikat: [{ name: 'Cum Laude', count: 50, percentage: 18.45 }],
  },
  'ipk-trend': {
    byYear: [{ tahun: '2023/2024', s1AvgIpk: 3.69 }],
    jenjangs: [{ key: 's1', jenjang: 'S1', label: 'S1', dataKey: 's1AvgIpk' }],
    prodiGpaData: [{ name: 'Bio Medis dan Rekayasa Hayati', gpaValue: 3.6, count: 100 }],
    facultyGpaData: [{ name: 'Ilmu Kesehatan dan Biosains', gpaValue: 3.55, count: 271 }],
    gpaBandsData: [{ range: '3.51 - 3.75', count: 100, percentage: 36.9 }],
  },
  'tepat-waktu': {
    s1: [
      {
        cohortLabel: 'Angkatan 2019/2020',
        fastCount: 1,
        onTimeCount: 5,
        lateCount: 2,
        unknownCount: 0,
        total: 8,
        rate: 75,
      },
    ],
    jenjangs: [{ key: 's1', jenjang: 'S1', label: 'S1', batas: 4 }],
  },
  'keberhasilan-studi': {
    s1: [
      {
        angkatan: 2018,
        cohortLabel: 'Angkatan 2018/2019',
        rate: 80,
        successCount: 8,
        intake: 10,
      },
    ],
    jenjangs: [{ key: 's1', jenjang: 'S1', label: 'S1', batas: 8, angkatanEvaluasi: '2018/2019' }],
  },
};

beforeEach(() => {
  vi.mocked(useDetail).mockClear();
  vi.mocked(useDetail).mockImplementation(({ resourceKey }) => ({
    data: DETAILS[resourceKey] ?? null,
    isLoading: false,
    error: null,
  }));
});

function renderModal(Modal, filters = {}) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <Modal isOpen onClose={() => {}} originRect={null} data={SUMMARY} filters={filters} />
    </QueryClientProvider>,
  );
}

describe.each([
  ['total', TotalGraduatesModal, 'mengikuti filter yang sedang aktif'],
  ['gpa', GpaOverviewModal, 'tidak ikut dihitung'],
  ['onTime', OnTimeGraduationModal, 'masa studi standar'],
  ['studySuccess', StudySuccessModal, 'tidak dihitung berhasil'],
])('modal %s dengan payload prodi S1-only', (_name, Modal, phrase) => {
  it('render tanpa throw dan menjelaskan metodologi', async () => {
    renderModal(Modal);
    await waitFor(() => expect(document.body.textContent).toContain(phrase));
  });
});

it.each([
  ['onTime', OnTimeGraduationModal],
  ['studySuccess', StudySuccessModal],
])('modal %s tidak menjadikan daftar `jenjangs` sebagai tab', (_name, Modal) => {
  const { queryByText } = renderModal(Modal);
  expect(queryByText(/Jenjangs/i)).toBeNull();
});

describe('jendela dan tab diputuskan server', () => {
  it.each([['2025/2026'], ['2022/2023']])(
    'Tahun Lulus %s dikirim apa adanya; server yang memutuskan jendela',
    async (year) => {
      renderModal(OnTimeGraduationModal, { selectedTahunLulus: [year] });
      await waitFor(() => expect(useDetail).toHaveBeenCalled());
      expect(vi.mocked(useDetail).mock.calls.at(-1)[0].filters.selectedTahunLulus).toEqual([year]);
    },
  );

  it('modal IPK cukup satu request', async () => {
    renderModal(GpaOverviewModal, { selectedTahunLulus: ['2025/2026'] });
    await waitFor(() => expect(useDetail).toHaveBeenCalled());
    const keys = new Set(
      vi.mocked(useDetail).mock.calls.map(([config]) => JSON.stringify(config.filters)),
    );
    expect(keys.size).toBe(1);
  });

  it('tab hanya dari jenjangs server: Profesi saja tanpa tab S1/S2 hantu', async () => {
    vi.mocked(useDetail).mockImplementation(({ resourceKey }) => ({
      data:
        resourceKey === 'tepat-waktu'
          ? {
              profesi: [
                { cohortLabel: 'Angkatan 2025/2026', onTimeCount: 3, fastCount: 0, lateCount: 0 },
              ],
              jenjangs: [{ key: 'profesi', jenjang: 'Profesi', label: 'Profesi', batas: 1 }],
            }
          : null,
      isLoading: false,
      error: null,
    }));
    renderModal(OnTimeGraduationModal);
    // Modal dirender lewat portal ke document.body, bukan ke container render.
    await waitFor(() => expect(document.body.textContent).toContain('Jenjang Profesi (≤ 1 Thn)'));
    expect(document.body.textContent).not.toContain('Jenjang S1');
  });
});

it('banner studySuccess menyebut filter event dari server tanpa memasukkannya ke cakupan', async () => {
  const summary = structuredClone(SUMMARY);
  summary.kpis.cards.studySuccess.ignoredFilters = ['tahunLulus', 'predikat'];
  render(
    <QueryClientProvider client={new QueryClient()}>
      <StudySuccessModal
        isOpen
        onClose={() => {}}
        originRect={null}
        data={summary}
        filters={{ predikat: ['Cum Laude'] }}
      />
    </QueryClientProvider>,
  );
  await waitFor(() =>
    expect(document.body.textContent).toContain(
      'Filter tahun lulus dan status kelulusan tidak mengubah angka ini.',
    ),
  );
  expect(document.body.textContent).not.toContain('Status Cum Laude,');
});

describe('trendBars dari jenjangs server', () => {
  it('urutan, label, dan dataKey mengikuti server; warna beda; tanpa stackId', async () => {
    const { trendBars } = await import('../src/modules/graduates/components/modals/totalTrendBars');
    const bars = trendBars([
      { key: 's1', label: 'S1', dataKey: 's1Count' },
      { key: 'profesi', label: 'Profesi', dataKey: 'profesiCount' },
      { key: 's3', label: 'S3', dataKey: 's3Count' },
    ]);
    expect(bars.map((bar) => bar.dataKey)).toEqual(['s1Count', 'profesiCount', 's3Count']);
    expect(bars.map((bar) => bar.name)).toEqual(['Lulusan S1', 'Lulusan Profesi', 'Lulusan S3']);
    expect(new Set(bars.map((bar) => bar.color)).size).toBe(3);
    expect(bars.every((bar) => bar.stackId === undefined)).toBe(true);
  });
});

describe('CohortTrendChart', () => {
  it('angkatan tanpa nilai > 0 menampilkan pesan kosong, bukan chart kosong', () => {
    const { getByText } = render(
      <CohortTrendChart
        cohorts={[{ cohortLabel: 'Angkatan 2020/2021', intake: 0, successCount: 0 }]}
        bars={[{ dataKey: 'intake', name: 'Intake', color: '#000' }]}
        emptyTitle="Belum Ada Kohort"
      />,
    );
    expect(getByText('Belum Ada Kohort')).toBeTruthy();
  });
});

describe('warna kategori OnTime', () => {
  it('tiga kategori memakai urutan palet yang sama dengan chart jenjang', async () => {
    const { OUTCOME_COLORS, JENJANG_COLORS } =
      await import('../src/modules/graduates/components/modals/totalTrendBars');
    expect([OUTCOME_COLORS.onTime, OUTCOME_COLORS.fast, OUTCOME_COLORS.late]).toEqual(
      JENJANG_COLORS.slice(0, 3),
    );
  });
});

describe('compactBarLayout', () => {
  const bars = [{ dataKey: 's1Count' }, { dataKey: 'profesiCount' }, { dataKey: 's2Count' }];

  it('menghapus slot nol dan merapatkan batang yang tersisa', () => {
    const payload = { s1Count: 153, profesiCount: 0, s2Count: 2 };
    const s1 = compactBarLayout({ bars, payload, dataKey: 's1Count', x: 100, width: 20 });
    const s2 = compactBarLayout({ bars, payload, dataKey: 's2Count', x: 140, width: 20 });

    expect(s1).toEqual({ x: 111, width: 18 });
    expect(s2).toEqual({ x: 131, width: 18 });
    expect(s2.x - (s1.x + s1.width)).toBe(2);
  });

  it('mengembalikan null untuk batang bernilai nol', () => {
    expect(
      compactBarLayout({
        bars,
        payload: { s1Count: 10, profesiCount: 0, s2Count: 2 },
        dataKey: 'profesiCount',
        x: 120,
        width: 20,
      }),
    ).toBeNull();
  });

  it('tidak menggeser batang saat semua jenjang terisi', () => {
    const payload = { s1Count: 10, profesiCount: 3, s2Count: 2 };
    expect(compactBarLayout({ bars, payload, dataKey: 's1Count', x: 100, width: 20 })).toEqual({
      x: 101,
      width: 18,
    });
    expect(compactBarLayout({ bars, payload, dataKey: 's2Count', x: 140, width: 20 })).toEqual({
      x: 141,
      width: 18,
    });
  });

  it('menengahkan satu batang yang tersisa', () => {
    expect(
      compactBarLayout({
        bars,
        payload: { s1Count: 10, profesiCount: 0, s2Count: 0 },
        dataKey: 's1Count',
        x: 100,
        width: 20,
      }),
    ).toEqual({ x: 121, width: 18 });
  });
});
