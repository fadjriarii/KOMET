import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConfigurationModal from '../src/components/layout/Sidebar/ConfigurationModal';
import { resetApi, respondWith } from './apiMock';

vi.mock('../src/services/apiClient', () => import('./apiMock'));

const ALL = ['students', 'graduates', 'mbkm'];

const statusPayload = (data) => (url) =>
  url.startsWith('/sync/status') ? { data } : { success: true };

const RUNNING = {
  status: 'running',
  currentModule: 'students',
  scope: ALL,
  overallPercent: 53,
  totals: { synced: 1803, skipped: 4 },
  progress: {
    students: { status: 'running', percent: 60, total_synced: 1200, skipped: 4 },
    graduates: { status: 'pending', percent: 0, total_synced: 0, skipped: 0 },
    mbkm: { status: 'completed', percent: 100, total_synced: 603, skipped: 0 },
  },
};

const DONE = {
  status: 'completed',
  currentModule: 'all',
  scope: ALL,
  overallPercent: 100,
  totals: { synced: 4217, skipped: 0 },
  finishedAt: '2026-10-05T09:00:44.094Z',
  progress: {
    students: { status: 'completed', percent: 100, total_synced: 2487, skipped: 0 },
    graduates: { status: 'completed', percent: 100, total_synced: 1127, skipped: 0 },
    mbkm: { status: 'completed', percent: 100, total_synced: 603, skipped: 0 },
  },
};

function renderModal() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ConfigurationModal isOpen onClose={() => {}} />
    </QueryClientProvider>,
  );
}

beforeEach(resetApi);

describe('Configuration modal', () => {
  it('membawa tiga modul pilihan dan menandai master checkbox saat salah satu dilepas', async () => {
    respondWith(
      statusPayload({ status: 'idle', scope: [], progress: {}, totals: { synced: 0, skipped: 0 } }),
    );
    renderModal();

    expect(await screen.findByText('3/3 dipilih')).toBeTruthy();
    const master = screen.getByRole('checkbox', { name: /Semua data/ });
    expect(master.checked).toBe(true);
    expect(master.indeterminate).toBe(false);

    fireEvent.click(screen.getByRole('checkbox', { name: /Data MBKM/ }));

    expect(screen.getByText('2/3 dipilih')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Sinkronisasi 2 modul/ })).toBeTruthy();
    expect(master.indeterminate).toBe(true);
  });

  it('merender progres yang dikirim server apa adanya saat panel dibuka di tengah job', async () => {
    respondWith(statusPayload(RUNNING));
    renderModal();

    await waitFor(() => expect(screen.getByText('Progres Sinkronisasi')).toBeTruthy());
    expect(screen.getByText('53%')).toBeTruthy();
    expect(screen.getByText('Menyinkronkan Data Mahasiswa...')).toBeTruthy();
    expect(screen.getByText('1.200 baris')).toBeTruthy();
    expect(screen.getByText('603 baris')).toBeTruthy();
    expect(screen.getByText('Menunggu')).toBeTruthy();
  });

  it('menampilkan spanduk hasil dengan total dari server setelah job selesai', async () => {
    respondWith(statusPayload(DONE));
    renderModal();

    fireEvent.click(await screen.findByRole('button', { name: /Sinkronisasi 3 modul/ }));

    // Spanduk hanya muncul setelah job selesai; status dipantau tiap 2 detik.
    expect(await screen.findByText('4.217 baris tersinkron', {}, { timeout: 9000 })).toBeTruthy();
    await waitFor(() => expect(screen.getByText('100%')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Ulangi' }).disabled).toBe(false);
  });
});
