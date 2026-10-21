import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import TotalGraduatesModal from '../src/modules/graduates/components/modals/TotalGraduatesModal';
import GpaOverviewModal from '../src/modules/graduates/components/modals/GpaOverviewModal';
import OnTimeGraduationModal from '../src/modules/graduates/components/modals/OnTimeGraduationModal';
import {
  hasStudySuccessData,
  onTimeTabs,
  selectChartCohorts,
  studySuccessTabs,
  tabsForSelectedJenjang,
  withoutDefaultTahunLulus,
} from '../src/modules/graduates/components/modals/graduateTrendConfig';
import StudySuccessModal from '../src/modules/graduates/components/modals/StudySuccessModal';
import { compactBarLayout } from '../src/components/common/charts/compactBarLayout';
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
  filterOptions: {
    rollingYears: ['2025/2026', '2024/2025'],
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

describe('chart OnTime 5 cohort terakhir', () => {
  it('tidak punya tab tabel riwayat', () => {
    expect(onTimeTabs({ s1: 4, s2: 2, profesi: 1 }).map((tab) => tab.key)).not.toContain('tabel');
  });

  it('memotong ke 5 data terakhir saat tanpa filter tahun eksplisit', () => {
    const cohorts = Array.from({ length: 8 }, (_, index) => ({
      cohortLabel: `Angkatan ${2018 + index}`,
    }));

    expect(selectChartCohorts(cohorts, false)).toHaveLength(5);
    expect(selectChartCohorts(cohorts, false)[0].cohortLabel).toBe('Angkatan 2021');
    expect(selectChartCohorts(cohorts, true)).toBe(cohorts);
  });

  it('tahun lulus default tidak dikirim sebagai filter detail', async () => {
    renderModal(OnTimeGraduationModal, { selectedTahunLulus: ['2025/2026'] });
    await waitFor(() => expect(useDetail).toHaveBeenCalled());

    const { filters } = vi.mocked(useDetail).mock.calls.at(-1)[0];
    expect(filters.selectedTahunLulus).toBeUndefined();
  });

  it('pilihan tahun manual tetap dikirim apa adanya', async () => {
    renderModal(OnTimeGraduationModal, { selectedTahunLulus: ['2022/2023'] });
    await waitFor(() => expect(useDetail).toHaveBeenCalled());

    const { filters } = vi.mocked(useDetail).mock.calls.at(-1)[0];
    expect(filters.selectedTahunLulus).toEqual(['2022/2023']);
  });

  it('Total dan GPA memakai jendela tahun untuk chart, tetapi kartu tetap default', async () => {
    renderModal(TotalGraduatesModal, { selectedTahunLulus: ['2025/2026'] });
    await waitFor(() => expect(useDetail).toHaveBeenCalled());
    const totalCall = vi
      .mocked(useDetail)
      .mock.calls.find(([config]) => config.resourceKey === 'total-lulusan');
    expect(totalCall[0].filters.selectedTahunLulus).toBeUndefined();

    vi.mocked(useDetail).mockClear();
    renderModal(GpaOverviewModal, { selectedTahunLulus: ['2025/2026'] });
    await waitFor(() => expect(useDetail).toHaveBeenCalled());
    const ipkCalls = vi
      .mocked(useDetail)
      .mock.calls.filter(([config]) => config.resourceKey === 'ipk-trend')
      .map(([config]) => config.filters.selectedTahunLulus);
    expect(ipkCalls).toContain(undefined);
    expect(ipkCalls).toContainEqual(['2025/2026']);
  });

  it('helper menghormati pilihan tahun eksplisit', () => {
    const filters = { selectedTahunLulus: ['2022/2023'], faculty: ['FST'] };
    expect(withoutDefaultTahunLulus(filters, '2025/2026')).toBe(filters);
    expect(withoutDefaultTahunLulus(filters, '2022/2023').selectedTahunLulus).toBeUndefined();
  });

  it('tab jenjang mengikuti pilihan filter', () => {
    const tabs = [{ key: 's1' }, { key: 's2' }, { key: 'profesi' }];
    expect(tabsForSelectedJenjang(tabs, ['Profesi']).map((tab) => tab.key)).toEqual(['profesi']);
    expect(tabsForSelectedJenjang(tabs, [])).toHaveLength(3);
  });
});

it('banner studySuccess menyebut filter non-kohort yang aktif tanpa memasukkannya ke cakupan', async () => {
  renderModal(StudySuccessModal, {
    selectedTahunLulus: ['2022/2023'],
    predikat: ['Cum Laude'],
  });
  await waitFor(() =>
    expect(document.body.textContent).toContain(
      'Filter tahun lulus dan status kelulusan tidak mengubah angka ini.',
    ),
  );
  expect(document.body.textContent).not.toContain('Status Cum Laude,');
});

describe('trendBars Total Lulusan (grouped)', () => {
  it('satu batang per jenjang, S1 dulu, warna beda, tanpa stackId', async () => {
    const { trendBars } = await import('../src/modules/graduates/components/modals/totalTrendBars');
    const bars = trendBars([
      { tahun: '2025/2026', s1Count: 40, s2Count: 20, profesiCount: 5, total: 65 },
    ]);
    expect(bars.map((bar) => bar.dataKey)).toEqual(['s1Count', 'profesiCount', 's2Count']);
    expect(new Set(bars.map((bar) => bar.color)).size).toBe(3);
    for (const bar of bars) {
      expect(bar.stackId).toBeUndefined();
      expect(bar.labelPosition).toBe('top');
    }
  });

  it('jenjang baru (S3) otomatis jadi batang keempat', async () => {
    const { trendBars } = await import('../src/modules/graduates/components/modals/totalTrendBars');
    const bars = trendBars([{ tahun: '2026/2027', s1Count: 1, s3Count: 2, total: 3 }]);
    expect(bars.map((bar) => bar.dataKey)).toEqual(['s1Count', 's3Count']);
    expect(bars.at(-1).name).toContain('S3');
    expect(bars.every((bar) => bar.stackId === undefined)).toBe(true);
  });

  it('jenjang yang seluruh periode nol tidak membuat seri kosong', async () => {
    const { trendBars } = await import('../src/modules/graduates/components/modals/totalTrendBars');
    const bars = trendBars([
      { tahun: '2021/2022', s1Count: 10, s2Count: 2, profesiCount: 0, total: 12 },
      { tahun: '2022/2023', s1Count: 12, s2Count: 3, profesiCount: 0, total: 15 },
    ]);
    expect(bars.map((bar) => bar.dataKey)).toEqual(['s1Count', 's2Count']);
  });
});

describe('chart StudySuccess', () => {
  it('tidak punya tab tabel riwayat', () => {
    expect(studySuccessTabs({ s1: 7, s2: 4, profesi: 2 }).map((tab) => tab.key)).not.toContain(
      'tabel',
    );
  });

  it('membedakan kohort kosong dari kohort yang sudah punya data', () => {
    expect(hasStudySuccessData([{ intake: 0, successCount: 0 }])).toBe(false);
    expect(hasStudySuccessData([{ intake: 80, successCount: 37 }])).toBe(true);
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
