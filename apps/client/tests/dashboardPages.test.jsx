import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GraduatesPage from '../src/modules/graduates/pages/GraduatesPage';
import MbkmPage from '../src/modules/mbkm/pages/MbkmPage';
import StudentsPage from '../src/modules/students/pages/StudentsPage';
import { callsFor, lastQuery, resetApi, respondWith } from './apiMock';

vi.mock('../src/services/apiClient', () => import('./apiMock'));

const STUDENT_ROW = {
  nim: '20211001',
  nama: 'Mahasiswa Satu',
  angkatan: '2021/2022',
  periode: 'Ganjil',
  periodeMasuk: '20211',
  periodeTerakhir: '20251',
  programStudi: 'Ilmu Komputer',
  fakultas: 'FST',
  jenjang: 'S1',
  semester: 7,
  kewarganegaraan: 'Indonesia',
  statusKeaktifan: 'Aktif',
};

const GRADUATE_ROW = {
  id: 1,
  nim: '20191002',
  nama: 'Lulusan Dua',
  angkatan: '2019/2020',
  programStudi: 'Ilmu Komputer',
  fakultas: 'FST',
  jenjang: 'S1',
  tahunLulus: '2023/2024',
  ipk: 3.5,
  sksLulus: 144,
  statusKeaktifan: 'Aktif',
  predikatLulus: 'Sangat Memuaskan',
  statusKelulusan: 'Lulus',
};

const MBKM_ROW = {
  id: 1,
  nim: '20201003',
  nama: 'Peserta Tiga',
  periode: '20251',
  tahun: '2025/2026',
  angkatan: '2020/2021',
  programStudi: 'Ilmu Komputer',
  fakultas: 'FST',
  jenjang: 'S1',
  statusKeaktifan: 'Aktif',
  jenisAktivitas: 'Magang',
  judulAktivitas: 'Magang Industri',
  mitra: 'PT Mitra',
  statusAktivitas: 'Selesai',
};

const listPayload = (rows, pagination = {}) => ({
  success: true,
  data: rows,
  pagination: { page: 1, limit: 20, total: rows.length, totalPages: 1, ...pagination },
});

const summary = (kpis, extra = {}) => ({
  success: true,
  kpis,
  summary: {},
  filterOptions: { fakultas: ['FST'], programStudi: ['Ilmu Komputer'], jenjang: ['S1'] },
  kpiFilterScope: {},
  ...extra,
});

const OPTIONS = { fakultas: ['FST'], programStudi: ['Ilmu Komputer'], jenjang: ['S1'] };

/**
 * Salinan persis `kpiFilterScope` dari service masing-masing (bukan karangan test):
 * inilah satu-satunya dasar badge "Terfilter" di client.
 */
const POPULATION = [
  'search',
  'fakultas',
  'programStudi',
  'jenjang',
  'angkatan',
  'angkatanTahun',
  'semester',
  'kewarganegaraan',
  'statusKeaktifan',
  'periodeMasuk',
  'tahunAjaran',
];
const tanpa = (...keys) => POPULATION.filter((key) => !keys.includes(key));
const GRADUATE_PARAMS = [
  'search',
  'fakultas',
  'programStudi',
  'jenjang',
  'tahunLulus',
  'periodeWisuda',
  'predikat',
  'angkatanTahun',
];
const ACTIVITY_PARAMS = [
  'search',
  'fakultas',
  'programStudi',
  'angkatan',
  'statusAktivitas',
  'jenjang',
  'periode',
];

const ROUTES = {
  students: {
    Page: StudentsPage,
    summaryPath: '/students/summary',
    listPath: '/students/students',
    summaryPayload: summary({
      activeStudentsCount: 1234,
      foreignStudentsCount: 12,
      foreignRate: 0.97,
      intakeCohortCount: 210,
      declinePercentage: -4.2,
      hasEnoughDeclineData: true,
      isFluctuationPositive: false,
      activeStudentStatus: { isAll: false, statuses: ['Aktif'], isCumulative: false },
    }),
    listPayload: listPayload([STUDENT_ROW]),
    extraPaths: { '/students/filter-options': { success: true, data: OPTIONS } },
    cards: [
      { key: 'active', title: 'Mahasiswa Aktif' },
      { key: 'foreign', title: 'Persentase Mahasiswa Internasional' },
      { key: 'intake', title: 'Intake Mahasiswa Baru' },
      { key: 'decline', title: 'Penurunan Mhs Baru (5 Thn)' },
    ],
    scope: {
      active: POPULATION,
      foreign: tanpa('tahunAjaran'),
      intake: tanpa('statusKeaktifan'),
      decline: tanpa('statusKeaktifan'),
    },
    filterCases: [
      { url: '/students?faculty=FST', api: 'fakultas', value: 'FST' },
      { url: '/students?status=Lulus', api: 'statusKeaktifan', value: 'Lulus' },
    ],
    rowLabel: '20211001',
  },
  graduates: {
    Page: GraduatesPage,
    summaryPath: '/graduates/summary',
    listPath: '/graduates/list',
    summaryPayload: summary({
      totalGraduates: 1234,
      totalGraduatesS1: 1000,
      totalGraduatesS2: 234,
      totalScopeLabel: 'Semua Tahun',
      totalScopePhrase: 'di seluruh tahun akademik tercatat',
      averageGpaS1: 3.45,
      averageGpaS2: null,
      onTimeGraduationRateS1: 78.9,
      onTimeGraduationRateS2: 80,
      studySuccessRateS1: 91.2,
    }),
    listPayload: listPayload([GRADUATE_ROW]),
    extraPaths: {},
    cards: [
      { key: 'total', title: 'Total Lulusan' },
      { key: 'gpa', title: 'Rata-rata IPK Lulusan' },
      { key: 'onTime', title: 'Kelulusan Tepat Waktu' },
      { key: 'studySuccess', title: 'Keberhasilan Studi' },
    ],
    scope: {
      total: GRADUATE_PARAMS,
      gpa: GRADUATE_PARAMS,
      onTime: GRADUATE_PARAMS,
      studySuccess: ['search', 'fakultas', 'programStudi', 'jenjang', 'angkatanTahun'],
    },
    filterCases: [
      { url: '/graduates?faculty=FST', api: 'fakultas', value: 'FST' },
      { url: '/graduates?periodeWisuda=Ganjil', api: 'periodeWisuda', value: 'Ganjil' },
    ],
    rowLabel: '20191002',
  },
  mbkm: {
    Page: MbkmPage,
    summaryPath: '/mbkm/summary',
    listPath: '/mbkm/list',
    summaryPayload: summary({
      participationRate: 25.5,
      targetIku2: 20,
      totalParticipants: 300,
      eligibleCount: 1176,
      selesaiCount: 200,
      berjalanCount: 100,
      totalMitra: 42,
    }),
    listPayload: listPayload([MBKM_ROW]),
    extraPaths: {},
    cards: [
      { key: 'rate', title: 'Tingkat Partisipasi MBKM' },
      { key: 'participants', title: 'Total Partisipan MBKM' },
      { key: 'eligible', title: 'Mahasiswa Eligible' },
      { key: 'mitra', title: 'Mitra MBKM & Industri' },
    ],
    scope: {
      rate: ACTIVITY_PARAMS,
      participants: ACTIVITY_PARAMS,
      eligible: ['fakultas', 'programStudi', 'angkatan', 'jenjang'],
      mitra: ['periode'],
    },
    filterCases: [
      { url: '/mbkm?faculty=FST', api: 'fakultas', value: 'FST' },
      { url: '/mbkm?periode=20251', api: 'periode', value: '20251' },
    ],
    rowLabel: '20201003',
  },
};

/**
 * Menjawab hanya path yang terdaftar: request liar membuat test gagal, bukan diam.
 * Nilainya boleh fungsi bila responsnya bergantung pada request (mis. halaman).
 */
function mockModule(name, overrides = {}) {
  const route = ROUTES[name];
  const allowed = {
    [route.summaryPath]: { ...route.summaryPayload, kpiFilterScope: route.scope },
    [route.listPath]: route.listPayload,
    ...route.extraPaths,
    ...overrides,
  };
  respondWith((url) => {
    const path = url.split('?')[0];
    if (!(path in allowed)) throw new Error(`Endpoint tak terduga: ${path}`);
    const value = allowed[path];
    return typeof value === 'function' ? value(url) : value;
  });
  return route;
}

/** `goTo` dipakai test render: mengubah URL tanpa me-remount seluruh halaman. */
function renderPage(Page, initialEntries = ['/']) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let navigate;
  function NavProbe() {
    navigate = useNavigate();
    return null;
  }
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>
        <NavProbe />
        <Page />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { goTo: (to) => act(() => navigate(to)) };
}

const cardOf = (title) => screen.getByText(title).closest('div.relative');
const badgesOf = (title) => within(cardOf(title)).queryAllByText('Terfilter');

/**
 * Kartu KPI masih berstatus skeleton saat request berjalan dan skeleton tidak
 * punya judul; menunggu sampai judulnya ada + tidak ada skeleton di dalamnya.
 */
async function cardsReady(route) {
  await waitFor(() =>
    route.cards.forEach(({ title }) => {
      const card = cardOf(title);
      expect(card, title).not.toBeNull();
      expect(card.querySelector('.animate-pulse'), title).toBeNull();
    }),
  );
}

beforeEach(() => resetApi());

describe.each(Object.keys(ROUTES))('halaman %s', (name) => {
  it('merender empat kartu KPI dan satu baris tabel dari envelope server', async () => {
    const route = mockModule(name);
    renderPage(route.Page);

    await cardsReady(route);
    await waitFor(() => expect(screen.getByText(route.rowLabel)).toBeTruthy());
    expect(callsFor(route.summaryPath)).toHaveLength(1);
    // Satu-satunya banner, di header.
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('hanya meminta summary + list sekali per muat awal (tanpa cascade)', async () => {
    const route = mockModule(name);
    renderPage(route.Page);

    await waitFor(() => expect(callsFor(route.listPath)).toHaveLength(1));
    expect(callsFor(route.summaryPath)).toHaveLength(1);
    expect(callsFor(route.listPath)).toHaveLength(1);
  });

  it.each(ROUTES[name].filterCases.map((testCase) => [testCase.url, testCase]))(
    'badge "Terfilter" tiap kartu mengikuti scope yang diumumkan server (%s)',
    async (url, { api, value }) => {
      const route = mockModule(name);
      renderPage(route.Page, [url]);

      await cardsReady(route);
      // Param URL diteruskan dengan nama yang dipakai server.
      expect(lastQuery(route.summaryPath).getAll(api)).toEqual([value]);
      for (const { key, title } of route.cards) {
        const claimed = route.scope[key].includes(api);
        expect(badgesOf(title), `${name}:${key}`).toHaveLength(claimed ? 1 : 0);
      }
    },
  );
});

describe('kartu KPI Graduates', () => {
  it('membedakan "tidak ada data" (-) dari nol (0)', async () => {
    respondWith((url) => {
      if (url.startsWith('/graduates/summary')) {
        return summary({
          totalGraduates: null,
          totalGraduatesS1: 0,
          totalGraduatesS2: 0,
          totalScopeLabel: null,
          totalScopePhrase: null,
          averageGpaS1: 0,
          averageGpaS2: null,
          onTimeGraduationRateS1: null,
          onTimeGraduationRateS2: 0,
          studySuccessRateS1: 100,
        });
      }
      return listPayload([GRADUATE_ROW]);
    });
    renderPage(GraduatesPage);

    await cardsReady(ROUTES.graduates);
    // `null` dari server = "-", bukan 0; `0` asli tetap terbaca 0.
    expect(cardOf('Total Lulusan').textContent).toContain('-');
    expect(cardOf('Rata-rata IPK Lulusan').textContent).toContain('0.00');
    expect(cardOf('Rata-rata IPK Lulusan').textContent).toContain('S2: -');
    expect(cardOf('Kelulusan Tepat Waktu').textContent).toContain('-');
  });

  it('satu ketikan lanjutan hanya memicu satu request setelah debounce, bukan per karakter', async () => {
    mockModule('graduates');
    renderPage(GraduatesPage);
    await waitFor(() => expect(callsFor('/graduates/summary')).toHaveLength(1));

    const searchInput = screen.getByLabelText('Cari Lulusan');
    ['a', 'ab', 'abc'].forEach((value) =>
      act(() => fireEvent.change(searchInput, { target: { value } })),
    );
    // Jendela debounce belum lewat: tidak ada request baru sama sekali.
    expect(callsFor('/graduates/summary')).toHaveLength(1);

    await act(() => new Promise((resolve) => setTimeout(resolve, 500)));
    await waitFor(() => expect(callsFor('/graduates/summary')).toHaveLength(2));
    expect(callsFor('/graduates/summary')).toHaveLength(2);
    expect(lastQuery('/graduates/summary').get('search')).toBe('abc');
  });

  it('menampilkan pesan asli dari server ketika summary gagal, bukan teks generik', async () => {
    respondWith((url) =>
      url.startsWith('/graduates/summary')
        ? Promise.reject(new Error('Query terlalu berat untuk dieksekusi.'))
        : listPayload([GRADUATE_ROW]),
    );
    renderPage(GraduatesPage);

    const banner = await screen.findByRole('alert');
    expect(banner.textContent).toContain('Query terlalu berat untuk dieksekusi.');
  });

  it('pindah halaman tidak me-remount kartu dan tidak memicu ulang summary', async () => {
    mockModule('graduates');
    const { goTo } = renderPage(GraduatesPage);
    await cardsReady(ROUTES.graduates);
    const cardTitle = screen.getByText('Total Lulusan');

    goTo('/graduates?page=2');
    await waitFor(() => expect(callsFor('/graduates/list')).toHaveLength(2));

    // Simpul DOM kartu yang masih terhubung = kartu di-update, bukan dibuang lalu
    // dibuat ulang; summary tetap satu request = tidak ada cascade saat URL berubah.
    expect(cardTitle.isConnected).toBe(true);
    expect(callsFor('/graduates/summary')).toHaveLength(1);
    expect(callsFor('/graduates/list')).toHaveLength(2);
  });
});

describe('tabel + pagination Graduates', () => {
  it('memakai header berscope, aria-current di halaman aktif, dan mengirim page ke server', async () => {
    mockModule('graduates', {
      // Server mengirim balik `page` yang sama dengan yang diminta; tanpa itu
      // tombol halaman aktif tidak pernah ikut pindah.
      '/graduates/list': (url) =>
        listPayload([GRADUATE_ROW], {
          page: Number(new URLSearchParams(url.split('?')[1] || '').get('page') || 1),
          total: 21,
          totalPages: 2,
        }),
    });
    renderPage(GraduatesPage);
    await waitFor(() => expect(screen.getByText('20191002')).toBeTruthy());

    const headCell = screen.getByRole('columnheader', { name: 'NIM' });
    expect(headCell.getAttribute('scope')).toBe('col');

    const next = screen.getByLabelText('Halaman berikutnya');
    act(() => fireEvent.click(next));
    // Menunggu DOM, bukan hanya catatan request: baris halaman lama tetap dipakai
    // sampai respons halaman baru tiba, jadi "page=2" bisa tercatat lebih dulu.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Halaman 2' }).getAttribute('aria-current')).toBe(
        'page',
      ),
    );
    expect(lastQuery('/graduates/list').get('page')).toBe('2');
  });
});
