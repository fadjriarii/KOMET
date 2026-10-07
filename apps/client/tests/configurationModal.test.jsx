import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SYNC_MODULE_KEYS, SYNC_TRIGGER } from '@komet/shared/constants';
import ConfigurationModal from '../src/components/layout/Sidebar/ConfigurationModal';
import { calls, resetApi, respondWith, writesFor } from './apiMock';

vi.mock('../src/services/apiClient', () => import('./apiMock'));

/**
 * Popup ini tidak menyimpan keadaan sync sendiri: progres dan riwayat datang dari
 * `/api/sync/*`. `store` adalah "server"-nya — progres satu job plus isi tabel
 * `sync_runs` — dan `serve` memetakan permintaan ke keadaan itu, termasuk pemangkasan
 * daftar yang di server asli dikerjakan `syncRunLog`.
 */
const store = { status: null, history: [], nextRunId: 13 };

const allDone = SYNC_MODULE_KEYS.map((key) => ({ key, status: 'completed' }));

const entry = (over = {}) => ({
  status: 'idle',
  current_page: 0,
  total_pages: 0,
  total_synced: 0,
  skipped: 0,
  percent: 0,
  ...over,
});

const jobState = (over = {}) => ({
  status: 'idle',
  currentModule: null,
  scope: [...SYNC_MODULE_KEYS],
  progress: Object.fromEntries(SYNC_MODULE_KEYS.map((key) => [key, entry()])),
  startedAt: null,
  finishedAt: null,
  lastError: null,
  overallPercent: 0,
  totals: { synced: 0, skipped: 0 },
  ...over,
});

const run = (id, finishedAt, over = {}) => ({
  id,
  finishedAt,
  trigger: SYNC_TRIGGER.MANUAL,
  actor: 'Dashboard',
  status: 'completed',
  modules: allDone,
  succeeded: SYNC_MODULE_KEYS.length,
  total: SYNC_MODULE_KEYS.length,
  error: null,
  ...over,
});

const seedHistory = () => [
  run(12, '2026-10-07T08:12:00.000Z'),
  run(11, '2026-10-06T21:40:00.000Z', {
    trigger: SYNC_TRIGGER.AUTOMATIC,
    actor: 'API Key',
    status: 'failed',
    modules: [
      { key: 'students', status: 'completed' },
      { key: 'graduates', status: 'failed' },
      { key: 'mbkm', status: 'completed' },
    ],
    succeeded: 2,
    error: 'Sinkronisasi gagal diselesaikan.',
  }),
  run(10, '2026-10-05T03:05:00.000Z', {
    trigger: SYNC_TRIGGER.AUTOMATIC,
    modules: [{ key: 'mbkm', status: 'completed' }],
    succeeded: 1,
    total: 1,
  }),
];

/** POST sync berjalan di background di server asli; di sini ia selesai seketika. */
function completeJob(scope) {
  const keys = Array.isArray(scope) && scope.length ? scope : SYNC_MODULE_KEYS;
  store.status = jobState({
    status: 'completed',
    scope: keys,
    progress: Object.fromEntries(
      SYNC_MODULE_KEYS.map((key) => [
        key,
        entry(
          keys.includes(key)
            ? {
                status: 'completed',
                current_page: 3,
                total_pages: 3,
                total_synced: 2059,
                percent: 100,
              }
            : {},
        ),
      ]),
    ),
    overallPercent: 100,
    finishedAt: new Date().toISOString(),
    totals: { synced: 2059, skipped: 7 },
  });
  store.history = [
    run(store.nextRunId++, new Date().toISOString(), {
      modules: keys.map((key) => ({ key, status: 'completed' })),
      succeeded: keys.length,
      total: keys.length,
    }),
    ...store.history,
  ].slice(0, 5);
}

function serve(url, { method, body }) {
  const path = url.split('?')[0];
  if (path === '/sync/status') return { success: true, data: store.status };
  if (path === '/sync/history') return { success: true, data: store.history };
  if (path.startsWith('/sync/history/')) {
    const id = Number(path.slice('/sync/history/'.length));
    store.history = store.history.filter((row) => row.id !== id);
    return { success: true };
  }
  if (method === 'POST') {
    if (body?.async !== true) throw new Error('popup harus memulai job async');
    completeJob(body.scope);
    return { success: true, message: 'dimulai' };
  }
  throw new Error(`endpoint palsu: ${method} ${path}`);
}

beforeEach(() => {
  resetApi();
  respondWith(serve);
  store.status = jobState();
  store.history = seedHistory();
  store.nextRunId = 13;
});

const Wrapper = ({ client, children }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

/** QueryClient hidup di luar render: cache harus bertahan saat popup ditutup-buka. */
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const view = render(
    <Wrapper client={client}>
      <ConfigurationModal isOpen onClose={() => {}} />
    </Wrapper>,
  );
  const reopen = (isOpen) =>
    view.rerender(
      <Wrapper client={client}>
        <ConfigurationModal isOpen={isOpen} onClose={() => {}} />
      </Wrapper>,
    );
  return { view, client, reopen };
}

/** popup terbuka + respons pertama server sudah terbaca */
async function open() {
  const { reopen, ...rest } = mount();
  const dialog = await screen.findByRole('dialog');
  return { dialog, reopen, ...rest };
}

/** Baris riwayat tempat sebuah pill angka berada. */
const rowOf = (dialog, pillText) => within(dialog).getByText(pillText).closest('div').parentElement;

describe('Synchronization modal terhubung ke server', () => {
  it('kolom kiri hanya memuat modul yang benar-benar dikenal /api/sync', async () => {
    const { dialog } = await open();

    expect(within(dialog).getByText('Select Data')).toBeTruthy();
    expect(within(dialog).getByText('Student Data')).toBeTruthy();
    expect(within(dialog).getByText('Graduate Data')).toBeTruthy();
    expect(within(dialog).getByText('MBKM Data')).toBeTruthy();
    // Kosakata mock lama tidak meninggalkan jejak.
    expect(within(dialog).queryByText('Lecturers')).toBeNull();
    expect(within(dialog).queryByText('Cleaning Service')).toBeNull();
    // Select All + tiga modul; tidak ada grup yang perlu dibuka.
    expect(within(dialog).getAllByRole('checkbox')).toHaveLength(4);
    expect(within(dialog).getAllByText('Ready')).toHaveLength(3);
  });

  it('sebelum Sync ditekan, popup hanya membaca status dan riwayat', async () => {
    await open();

    expect([...new Set(calls)].sort()).toEqual(['/sync/history', '/sync/status']);
    expect(writesFor('/sync/students')).toHaveLength(0);
  });

  it('kolom kanan menampilkan riwayat dari server, terbaru paling atas', async () => {
    const { dialog } = await open();

    expect(within(dialog).getByText('Sync History')).toBeTruthy();
    // Belum ada job: tidak ada terminal, tidak ada persentase.
    expect(within(dialog).queryByText('— awaiting command')).toBeNull();
    expect(within(dialog).queryByText(/^\d+%$/)).toBeNull();

    const toggles = within(dialog).getAllByRole('button', { name: /details of/ });
    expect(toggles).toHaveLength(3);
    // Hari, tanggal, tahun, dan jam — urutan terserah server, client tidak menyusun.
    expect(toggles[0].getAttribute('aria-label')).toMatch(
      /^Expand details of \w{3}, \d{2} \w{3} \d{4}, \d{2}:\d{2}$/,
    );

    // Yang dikirim server adalah nilainya (`manual`/`automatic`); label milik client.
    expect(within(dialog).getAllByText('Manual')).toHaveLength(1);
    expect(within(dialog).getAllByText('Automatic')).toHaveLength(2);

    // Angkanya hasil hitungan server, dan penyebutnya ikut apa yang dicakup job.
    expect(within(dialog).getByText('3 / 3 synced')).toBeTruthy();
    expect(within(dialog).getByText('2 / 3 synced')).toBeTruthy();
    expect(within(dialog).getByText('1 / 1 synced')).toBeTruthy();

    const group = toggles[1].parentElement;
    expect(group.firstElementChild.textContent).toBe('2 / 3 synced');
    expect(group.children[1].getAttribute('aria-label')).toMatch(/^Delete the log of/);
    expect(group.lastElementChild).toBe(toggles[1]);
    // Angkanya di kiri ikon >, jadi tempat di belakang waktu bebas untuk label mode.
    const mode = within(toggles[1].closest('div')).getByText('Automatic');
    expect(mode.previousElementSibling.textContent).toMatch(
      /^\w{3}, \d{2} \w{3} \d{4}, \d{2}:\d{2}$/,
    );
  });

  it('detail riwayat dibuka dengan siapa yang sync, pesan gagal, dan status per modul', async () => {
    const { dialog } = await open();

    fireEvent.click(within(dialog).getAllByRole('button', { name: /details of/ })[1]);

    // Baris yang sama: chip kiri dan detail adalah anak-anak satu kontainer.
    const row = rowOf(dialog, '2 / 3 synced');
    // Namanya di baris pertama: terbaca begitu detail dibuka, tanpa menggulir.
    const who = within(row).getByText('Synced by API Key');
    expect(who.parentElement.firstElementChild).toBe(who);
    expect(within(row).getByText('Sinkronisasi gagal diselesaikan.')).toBeTruthy();
    expect(within(row).getByText('Graduate Data')).toBeTruthy();
    expect(within(row).getAllByText('Failed')).toHaveLength(1);
    expect(within(row).getAllByText('Done')).toHaveLength(2);
  });

  it('mengklik bagian mana pun dari baris riwayat membuka detailnya', async () => {
    const { dialog } = await open();

    fireEvent.click(within(dialog).getByText('1 / 1 synced'));

    expect(within(dialog).getByRole('button', { name: /^Collapse details of/ })).toBeTruthy();
    const row = rowOf(dialog, '1 / 1 synced');
    expect(within(row).getByText('Synced by Dashboard')).toBeTruthy();
    // Job satu modul hanya menyebut satu modul di detailnya.
    expect(within(row).getAllByText(/Data$/)).toHaveLength(1);
  });

  it('tong sampah menghapus lewat DELETE tanpa konfirmasi', async () => {
    const { dialog } = await open();

    fireEvent.click(within(dialog).getAllByRole('button', { name: /^Delete the log of/ })[0]);

    await waitFor(() =>
      expect(within(dialog).getAllByRole('button', { name: /details of/ })).toHaveLength(2),
    );
    expect(writesFor('/sync/history/12')[0].method).toBe('DELETE');
    // Menghapus tidak membuka detail: semua baris masih tertutup.
    expect(within(dialog).getAllByRole('button', { name: /^Expand details of/ })).toHaveLength(2);
    expect(within(dialog).queryByText('3 / 3 synced')).toBeNull();

    fireEvent.click(within(dialog).getAllByRole('button', { name: /^Delete the log of/ })[0]);
    await waitFor(() =>
      expect(within(dialog).getAllByRole('button', { name: /details of/ })).toHaveLength(1),
    );
    fireEvent.click(within(dialog).getByRole('button', { name: /^Delete the log of/ }));
    expect(await within(dialog).findByText('No sync recorded yet')).toBeTruthy();
  });

  it('tabel riwayat kosong tampil sebagai keadaan kosong', async () => {
    store.history = [];
    const { dialog } = await open();

    expect(await within(dialog).findByText('No sync recorded yet')).toBeTruthy();
  });

  it('riwayat yang gagal dimuat tidak menyeret seluruh popup rusak', async () => {
    respondWith((url, info) => {
      if (url.split('?')[0] === '/sync/history') throw new Error('Gagal mengambil data.');
      return serve(url, info);
    });
    const { dialog } = await open();

    expect(await within(dialog).findByText('Gagal mengambil data.')).toBeTruthy();
    expect(within(dialog).getByText('Select Data')).toBeTruthy();
    expect(within(dialog).queryByText('No sync recorded yet')).toBeNull();
  });

  it('"Select All" mengosongkan pilihan dan mengunci tombol Sync', async () => {
    const { dialog } = await open();
    const master = within(dialog).getByRole('checkbox', { name: 'Select All' });

    fireEvent.click(master);

    expect(master.checked).toBe(false);
    expect(within(dialog).getByRole('checkbox', { name: 'Select Student Data' }).checked).toBe(
      false,
    );
    expect(within(dialog).getByRole('button', { name: 'Sync 0 modules' }).disabled).toBe(true);
  });

  it('menekan Sync memulai job async dengan scope modul yang dipilih', async () => {
    const { dialog } = await open();

    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Select MBKM Data' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Sync 2 modules' }));

    expect(writesFor('/sync/students')[0].body).toEqual({
      async: true,
      scope: ['students', 'graduates'],
    });
    expect(writesFor('/sync/all')).toHaveLength(0);
    // Kolom kanan berganti ke panel progres, dan barisnya belum ada isinya.
    expect(within(dialog).getByText('0%')).toBeTruthy();
    expect(within(dialog).getByText('— awaiting command')).toBeTruthy();
  });

  it('ketiga modul terpilih memicu satu POST /sync/all', async () => {
    const { dialog } = await open();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Sync 3 modules' }));

    expect(writesFor('/sync/all')[0].body).toEqual({ async: true, scope: [...SYNC_MODULE_KEYS] });
    expect(writesFor('/sync/students')).toHaveLength(0);
  });

  it('job yang sedang berjalan di server langsung tampil saat popup dibuka', async () => {
    store.status = jobState({
      status: 'running',
      currentModule: 'graduates',
      scope: ['students', 'graduates'],
      progress: {
        students: entry({
          status: 'completed',
          current_page: 4,
          total_pages: 4,
          total_synced: 2059,
          skipped: 3,
          percent: 100,
        }),
        graduates: entry({
          status: 'running',
          current_page: 3,
          total_pages: 6,
          total_synced: 600,
          percent: 50,
        }),
        mbkm: entry({ status: 'pending' }),
      },
      overallPercent: 50,
      totals: { synced: 2659, skipped: 3 },
    });
    const { dialog } = await open();

    expect(await within(dialog).findByText('50%')).toBeTruthy();
    expect(within(dialog).getByText('2.659 rows synced · 3 skipped')).toBeTruthy();
    // Terminal hanya menyebut modul yang ikut dicakup job ini.
    expect(within(dialog).getByText('Student Data done')).toBeTruthy();
    expect(within(dialog).getByText('Graduate Data syncing...')).toBeTruthy();
    expect(within(dialog).getAllByText('MBKM Data')).toHaveLength(1);
    // Modul di luar cakupan tidak membaca angka lama: statusnya 'Ready', bukan 'Queued'.
    expect(within(dialog).getAllByText('Ready')).toHaveLength(1);
    expect(within(dialog).queryByText('Queued')).toBeNull();
    // Kucing mengikuti persentase server, bukan langkah animasi lokal.
    expect(dialog.querySelector('img').style.left).toBe('50%');
  });

  it('sync yang selesai tercatat di riwayat paling atas saat popup dibuka lagi', async () => {
    const { dialog, reopen } = await open();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Sync 3 modules' }));
    // Progres dibaca lewat polling 2 detik sekali; inilah test yang harus menunggu.
    expect(await within(dialog).findByRole('button', { name: 'Sync Again' })).toBeTruthy();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    reopen(false);
    reopen(true);

    const again = await screen.findByRole('dialog');
    const toggles = within(again).getAllByRole('button', { name: /details of/ });
    expect(toggles).toHaveLength(4);
    // Baris paling atas adalah sync yang baru saja selesai (bukan seed '3 / 3' yang
    // lama), jadi barisnya yang diambil, bukan angkanya.
    const first = toggles[0].closest('div').parentElement;
    expect(within(first).getByText('3 / 3 synced')).toBeTruthy();
    expect(within(first).getByText('Manual')).toBeTruthy();
    fireEvent.click(within(first).getByRole('button', { name: /^Expand details of/ }));
    expect(within(first).getByText('Synced by Dashboard')).toBeTruthy();
    expect(within(first).getAllByText('Done')).toHaveLength(3);
  });

  it('setelah 100% lalu ditutup, dibuka lagi kembali ke riwayat', async () => {
    const { dialog, reopen } = await open();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Sync 3 modules' }));
    await within(dialog).findByRole('button', { name: 'Sync Again' });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    reopen(false);
    reopen(true);

    const again = await screen.findByRole('dialog');
    expect(within(again).getByText('Sync History')).toBeTruthy();
    expect(within(again).queryByText('— awaiting command')).toBeNull();
  });

  it('seluruh teks popup berbahasa Inggris', async () => {
    const { dialog } = await open();

    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeTruthy();
    expect(within(dialog).getByText(/keeps running in the background/)).toBeTruthy();
    expect(dialog.textContent).not.toMatch(
      /sinkron|pilih|menunggu|siap|tutup|grup|baris|dilewati/i,
    );
  });

  it('memakai kotak popup yang sama dengan popup rincian lain', async () => {
    const { dialog } = await open();

    expect(within(dialog).getByRole('heading', { name: 'Synchronization' })).toBeTruthy();
    expect(dialog.parentElement.className).toContain('max-w-4xl');
    expect(dialog.className).toContain('h-auto max-h-[82vh]');
  });
});
