import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import TotalGraduatesModal from '../src/modules/graduates/components/modals/TotalGraduatesModal';
import GpaOverviewModal from '../src/modules/graduates/components/modals/GpaOverviewModal';
import OnTimeGraduationModal from '../src/modules/graduates/components/modals/OnTimeGraduationModal';
import StudySuccessModal from '../src/modules/graduates/components/modals/StudySuccessModal';
import { useDetail } from '../src/modules/graduates/graduateQueries';

vi.mock('../src/modules/graduates/graduateQueries', () => ({
  useDetail: vi.fn(),
}));

const SUMMARY = {
  success: true,
  kpis: {
    totalGraduates: 271,
    totalGraduatesS1: 271,
    totalGraduatesS2: null,
    totalGraduatesByJenjang: { s1: 271 },
    averageGpaS1: 3.53,
    averageGpaS2: null,
    averageGpaByJenjang: { s1: 3.53 },
    onTimeGraduationRateS1: 75.5,
    onTimeGraduationRateS2: null,
    onTimeByJenjang: { s1: 75.5 },
    studySuccessRateS1: 88.2,
    totalScopeLabel: '2025/2026',
    totalScopePhrase: 'pada tahun ajaran 2025/2026',
  },
  summary: {
    avgIpk: { tahunScope: { phrase: 'pada tahun ajaran 2025/2026' } },
    tepatWaktu: { tahunScope: { phrase: 'pada tahun ajaran 2025/2026' } },
    keberhasilanStudi: { angkatanS1: '2018/2019' },
  },
};

const DETAILS = {
  'total-lulusan': {
    byYear: [{ tahun: '2023/2024', s1Count: 46, total: 46 }],
  },
  distribution: {
    total: 271,
    byPredikat: [{ name: 'Cum Laude', count: 50, percentage: 18.45 }],
  },
  'ipk-trend': {
    byYear: [{ tahun: '2023/2024', s1AvgIpk: 3.69 }],
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
    batasS1: 4,
    s2: [],
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
    batasStudiS1: 7,
    angkatanEvaluasiS1: '2018/2019',
    s2: null,
  },
};

beforeEach(() => {
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

it('banner studySuccess menyebut filter non-kohort yang aktif', async () => {
  renderModal(StudySuccessModal, {
    selectedTahunLulus: ['2022/2023'],
    predikat: ['Cum Laude'],
  });
  await waitFor(() =>
    expect(document.body.textContent).toContain(
      'Filter tahun lulus dan status kelulusan tidak mengubah angka ini.',
    ),
  );
});

describe('trendBars Total Lulusan (stacked)', () => {
  it('satu segmen per jenjang, S1 dulu, warna beda, tanpa kunci statis', async () => {
    const { trendBars } = await import('../src/modules/graduates/components/modals/totalTrendBars');
    const bars = trendBars([
      { tahun: '2025/2026', s1Count: 40, s2Count: 20, profesiCount: 5, total: 65 },
    ]);
    expect(bars.map((bar) => bar.dataKey)).toEqual(['s1Count', 'profesiCount', 's2Count']);
    expect(new Set(bars.map((bar) => bar.color)).size).toBe(3);
    for (const bar of bars) expect(bar.stackId).toBe('total-per-tahun');
  });

  it('jenjang baru (S3) otomatis jadi segmen keempat', async () => {
    const { trendBars } = await import('../src/modules/graduates/components/modals/totalTrendBars');
    const bars = trendBars([{ tahun: '2026/2027', s1Count: 1, s3Count: 2, total: 3 }]);
    expect(bars.map((bar) => bar.dataKey)).toEqual(['s1Count', 's3Count']);
    expect(bars.at(-1).name).toContain('S3');
  });
});
