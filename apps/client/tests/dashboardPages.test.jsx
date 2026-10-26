import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getCurrentAcademicYear } from '@komet/shared/academicYear';
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
  'tahunAjaran',
];
const ACTIVITY_PARAMS = [
  'search',
  'fakultas',
  'programStudi',
  'jenisAktivitas',
  'angkatan',
  'statusAktivitas',
  'jenjang',
  'periode',
  'tahunAjaran',
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
      { key: 'decline', title: 'Trend Intake Mahasiswa Baru (over a 5-year period)' },
    ],
    scope: {
      active: POPULATION,
      foreign: tanpa('kewarganegaraan'),
      intake: tanpa('statusKeaktifan'),
      decline: tanpa('statusKeaktifan', 'semester'),
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
      cards: {
        total: {
          value: 1234,
          isEmpty: false,
          scope: { label: 'Semua Tahun', phrase: 'di seluruh tahun akademik tercatat' },
          byJenjang: [
            { key: 's1', jenjang: 'S1', label: 'S1', value: 1000 },
            { key: 's2', jenjang: 'S2', label: 'S2', value: 234 },
          ],
        },
        gpa: { value: 3.45, count: 1000, isEmpty: false, byJenjang: [] },
        onTime: { value: 79.1, isEmpty: false, byJenjang: [] },
        studySuccess: { value: 91.2, isEmpty: false, ignoredFilters: [], byJenjang: [] },
      },
    }),
    listPayload: listPayload([GRADUATE_ROW]),
    extraPaths: {
      '/graduates/filter-options': {
        success: true,
        data: {
          ...OPTIONS,
          rollingYears: ['2025/2026'],
          rollingAngkatan: ['2022/2023'],
          academicYearOptions: ['2026/2027', '2025/2026'],
          predikatOptions: [],
        },
      },
    },
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
      studySuccess: [
        'search',
        'fakultas',
        'programStudi',
        'jenjang',
        'angkatanTahun',
        'tahunAjaran',
      ],
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
    summaryPayload: summary(
      {
        participationRate: 25.5,
        totalParticipants: 300,
        eligibleCount: 1176,
        selesaiCount: 200,
        berjalanCount: 100,
        evaluasiCount: 0,
        totalMitra: 42,
      },
      {
        selectedPeriods: ['20251'],
        filterOptions: {
          ...OPTIONS,
          jenisAktivitas: ['Magang'],
          periodeOptions: [
            { value: '20251', label: 'Ganjil' },
            { value: '20252', label: 'Genap' },
          ],
        },
      },
    ),
    listPayload: listPayload([MBKM_ROW]),
    extraPaths: {},
    cards: [
      { key: 'totalParticipants', title: 'Partisipan MBKM' },
      { key: 'eligible', title: 'Mahasiswa Eligible' },
      { key: 'rate', title: 'Persentase Partisipasi' },
      { key: 'mitra', title: 'Mitra MBKM' },
    ],
    scope: {
      rate: ACTIVITY_PARAMS,
      totalParticipants: ACTIVITY_PARAMS,
      eligible: ['fakultas', 'programStudi', 'angkatan', 'jenjang', 'periode', 'tahunAjaran'],
      mitra: ['periode', 'tahunAjaran'],
    },
    filterCases: [
      { url: '/mbkm?faculty=FST', api: 'fakultas', value: 'FST' },
      { url: '/mbkm?search=ani', api: 'search', value: 'ani' },
      { url: '/mbkm?statusAktivitas=Disetujui', api: 'statusAktivitas', value: 'Disetujui' },
      { url: '/mbkm?jenisAktivitas=Magang', api: 'jenisAktivitas', value: 'Magang' },
      { url: '/mbkm?periode=20251', api: 'periode', value: '20251' },
      { url: '/mbkm?tahunAjaran=2020/2021', api: 'tahunAjaran', value: '2020/2021' },
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
  it('merender kartu KPI dan satu baris tabel dari envelope server', async () => {
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

describe('tahun ajaran default Students', () => {
  it('memakai tahun ajaran terbaru dari data, bukan tahun kalender', async () => {
    const route = mockModule('students', {
      '/students/filter-options': {
        success: true,
        data: { ...OPTIONS, academicYearOptions: ['2020/2021', '2019/2020'] },
      },
    });
    renderPage(StudentsPage, ['/students']);

    await cardsReady(route);
    expect(callsFor(route.summaryPath)).toHaveLength(1);
    expect(lastQuery(route.summaryPath).get('tahunAjaran')).toBe('2020/2021');
    // Tahun terbaru = default, jadi tidak menyalakan badge "Terfilter".
    for (const { title } of route.cards) expect(badgesOf(title), title).toHaveLength(0);
  });

  it('pilihan tahun ajaran di URL tetap menang', async () => {
    const route = mockModule('students', {
      '/students/filter-options': {
        success: true,
        data: { ...OPTIONS, academicYearOptions: ['2020/2021', '2019/2020'] },
      },
    });
    renderPage(StudentsPage, ['/students?tahunAjaran=2019/2020']);

    await cardsReady(route);
    expect(lastQuery(route.summaryPath).get('tahunAjaran')).toBe('2019/2020');
  });
});

describe('kartu MBKM', () => {
  it('menampilkan empat kartu MBKM dalam urutan partisipan, eligible, persentase, mitra', async () => {
    const route = mockModule('mbkm');
    renderPage(MbkmPage);

    await cardsReady(route);
    const titles = [
      'Partisipan MBKM',
      'Mahasiswa Eligible',
      'Persentase Partisipasi',
      'Mitra MBKM',
    ];
    const grid = cardOf(titles[0]).parentElement;
    expect([...grid.children].map((card) => card.querySelector('p').textContent)).toEqual(titles);
    expect(within(cardOf('Mitra MBKM')).getByText('42')).toBeTruthy();
    expect(screen.queryByText(/Target IKU-2/)).toBeNull();
    expect(screen.queryByText('Mitra MBKM & Industri')).toBeNull();
  });

  it('meneruskan tahun ajaran header ke summary dan membatalkan periode spesifik', async () => {
    const route = mockModule('mbkm');
    renderPage(MbkmPage, ['/mbkm?periode=20251']);

    await cardsReady(route);
    fireEvent.click(screen.getByRole('button', { name: /Tahun Ajaran/i }));
    const option = screen.getAllByRole('option')[1];
    const year = option.textContent.match(/\d{4}\/\d{4}/)[0];
    fireEvent.click(option);

    await waitFor(() => expect(lastQuery(route.summaryPath).get('tahunAjaran')).toBe(year));
    expect(lastQuery(route.summaryPath).get('periode')).toBeNull();
  });

  it('memakai filter BKP tanpa angkatan dan mitra di grid tiga kolom penuh', async () => {
    const route = mockModule('mbkm');
    renderPage(MbkmPage);

    await cardsReady(route);
    expect(screen.queryByLabelText('Jenjang')).toBeNull();
    expect(screen.queryByLabelText('Angkatan')).toBeNull();
    expect(screen.queryByLabelText('Mitra')).toBeNull();
    expect(screen.getByLabelText('Jenis Aktivitas MBKM')).toBeTruthy();
    expect(screen.getByPlaceholderText('Cari berdasarkan NIM, Nama, atau Mitra...')).toBeTruthy();

    const searchWrapper = screen.getByText('Cari Aktivitas MBKM').closest('div');
    expect(searchWrapper.className).toContain('md:col-span-2');

    const firstRow = searchWrapper.parentElement;
    expect(firstRow.className).toContain('md:grid-cols-4');

    const secondRow = firstRow.nextElementSibling;
    expect(secondRow.className).toContain('md:grid-cols-3');
    expect(secondRow.children).toHaveLength(3);
  });

  it('tidak menampilkan kolom jenjang di tabel MBKM', async () => {
    const route = mockModule('mbkm');
    renderPage(MbkmPage);

    await cardsReady(route);
    await screen.findByText('Peserta Tiga');
    expect(screen.queryByRole('columnheader', { name: 'Jenjang' })).toBeNull();
    expect(screen.getByRole('columnheader', { name: 'Program Studi' })).toBeTruthy();
  });

  it('opsi periode MBKM hanya Ganjil/Genap dengan nilai kode periode', async () => {
    const route = mockModule('mbkm');
    renderPage(MbkmPage, ['/mbkm?tahunAjaran=2025/2026']);

    await cardsReady(route);
    fireEvent.click(screen.getByRole('button', { name: /Periode MBKM/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Ganjil' }));

    await waitFor(() => expect(lastQuery(route.summaryPath).get('periode')).toBe('20251'));
  });
});

describe('kartu KPI Graduates', () => {
  it('memuat opsi filter lebih dulu dan langsung memakai Tahun Lulus default', async () => {
    const route = mockModule('graduates');
    renderPage(GraduatesPage);

    await waitFor(() => expect(callsFor('/graduates/filter-options')).toHaveLength(1));
    await waitFor(() => expect(callsFor(route.summaryPath)).toHaveLength(1));

    expect(callsFor(route.listPath)).toHaveLength(1);
    expect(lastQuery(route.summaryPath).get('tahunLulus')).toBe('2025/2026');
    expect(
      callsFor(route.summaryPath).map((url) =>
        new URLSearchParams(url.split('?')[1]).get('tahunLulus'),
      ),
    ).toEqual(['2025/2026']);
  });

  it('kombinasi tanpa lulusan tampil "-" dan dijelaskan; 0 asli tetap 0', async () => {
    respondWith((url) => {
      if (url.startsWith('/graduates/filter-options')) {
        return ROUTES.graduates.extraPaths['/graduates/filter-options'];
      }
      if (url.startsWith('/graduates/summary')) {
        return summary({
          cards: {
            total: { value: null, isEmpty: true, byJenjang: [] },
            gpa: { value: null, isEmpty: true, byJenjang: [] },
            onTime: { value: 0, isEmpty: false, byJenjang: [] },
            studySuccess: { value: null, isEmpty: true, ignoredFilters: [], byJenjang: [] },
          },
        });
      }
      return listPayload([GRADUATE_ROW]);
    });
    renderPage(GraduatesPage);

    await cardsReady(ROUTES.graduates);
    expect(cardOf('Total Lulusan').textContent).toContain(
      'Tidak ada lulusan untuk kombinasi filter ini.',
    );
    expect(cardOf('Rata-rata IPK Lulusan').textContent).toContain('-');
    expect(cardOf('Kelulusan Tepat Waktu').textContent).toContain('0.0%');
  });

  it('memilih tahun ajaran terbaru = default: badge "Terfilter" tidak tertinggal', async () => {
    const route = mockModule('graduates');
    const { goTo } = renderPage(GraduatesPage, ['/graduates?tahunAjaran=2025/2026']);

    await cardsReady(route);
    // Jangkar tahun ajaran sebelumnya = filter aktif, semua kartu membaca paramnya.
    for (const { title } of route.cards) {
      expect(badgesOf(title), title).toHaveLength(1);
    }

    // Kembali ke tahun ajaran terbaru: server memperlakukannya sama dengan tanpa
    // jangkar (default), jadi URL-nya dinormalisasi dan badge wajib padam.
    goTo(`/graduates?tahunAjaran=${getCurrentAcademicYear()}`);
    await waitFor(() => {
      for (const { title } of route.cards) expect(badgesOf(title), title).toHaveLength(0);
    });
    expect(lastQuery(route.summaryPath).getAll('tahunAjaran')).toEqual([]);
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

  it('mengganti isi halaman dengan layar kegagalan saat summary gagal tanpa data lama', async () => {
    respondWith((url) =>
      url.startsWith('/graduates/summary')
        ? Promise.reject(new Error('Query terlalu berat untuk dieksekusi.'))
        : listPayload([GRADUATE_ROW]),
    );
    renderPage(GraduatesPage);

    // Tanpa data lama, bukan banner kecil di header: seluruh halaman jadi layar
    // kegagalan. Pesan asli server tidak dicetak di layar (mentah bagi pengguna),
    // tapi tetap terbawa lewat tooltip judul.
    expect(await screen.findByText('backend not connected')).toBeTruthy();
    const title = screen.getByTitle('Query terlalu berat untuk dieksekusi.');
    expect(title).toBeTruthy();
    expect(document.querySelector('.err-main')).toBeTruthy();
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
