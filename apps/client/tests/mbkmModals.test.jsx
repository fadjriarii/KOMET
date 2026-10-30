import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MbkmBreakdownModal from '../src/modules/mbkm/components/modals/MbkmBreakdownModal';
import {
  badgeVariantForCategory,
  badgeVariantForJenis,
} from '../src/modules/mbkm/utils/mbkmBadges';
import { useDetail } from '../src/modules/mbkm/mbkmQueries';

vi.mock('../src/modules/mbkm/mbkmQueries', () => ({ useDetail: vi.fn() }));

const RATE_DETAIL = {
  periodLabel: 'Tahun Ajaran 2025/2026',
  card: {
    value: 86.47,
    isEmpty: false,
    participants: 115,
    eligible: 133,
    notParticipating: 18,
    pending: 0,
  },
  breakdowns: [
    {
      key: 'fakultas',
      label: 'Per Fakultas',
      kind: 'rate',
      items: [
        { name: 'FST', count: 100, total: 110, percentage: 90.91 },
        { name: 'FEB', count: 0, total: 23, percentage: 0 },
      ],
    },
    // Satu kategori saja: tab disembunyikan (R2).
    {
      key: 'prodi',
      label: 'Per Program Studi',
      kind: 'rate',
      items: [{ name: 'Bio Teknologi', count: 115, total: 133, percentage: 86.47 }],
    },
    {
      key: 'kelompokBaru',
      label: 'Per Kelompok Baru',
      kind: 'share',
      items: [
        { name: 'A', count: 1, percentage: 50 },
        { name: 'B', count: 1, percentage: 50 },
      ],
    },
  ],
};

describe('MbkmBreakdownModal', () => {
  it('merender tab dari breakdowns server; tingkat 0% tetap tampil di tabel', async () => {
    useDetail.mockReturnValue({ data: RATE_DETAIL, isLoading: false, error: null });
    render(<MbkmBreakdownModal cardKey="participation" isOpen onClose={() => {}} filters={{}} />);

    await waitFor(() => expect(screen.getByText('Per Fakultas')).toBeTruthy());
    expect(screen.getByText('Per Kelompok Baru')).toBeTruthy();
    expect(screen.queryByText('Per Program Studi')).toBeNull();
    expect(screen.getByText('FEB')).toBeTruthy();
    expect(screen.getByText('0.0%')).toBeTruthy();
    expect(screen.getByText(/115 dari 133 mahasiswa aktif semester 7 mengikuti MBKM/)).toBeTruthy();
    expect(useDetail).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'getParticipationDetail' }),
    );
  });
});

describe('banner popup MBKM mengikuti cakupan kartu', () => {
  it('menyebut fakultas/prodi, kalimat kartu, dan filter yang hanya untuk tabel', async () => {
    useDetail.mockReturnValue({ data: RATE_DETAIL, isLoading: false, error: null });
    render(
      <MbkmBreakdownModal
        cardKey="participation"
        isOpen
        onClose={() => {}}
        filters={{ faculty: ['FST'], search: 'ani', statusAktivitas: ['Diajukan'] }}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          'Fakultas FST, Tahun Ajaran 2025/2026. 115 dari 133 mahasiswa aktif semester 7 mengikuti MBKM. 18 belum berpartisipasi. Filter pencarian dan status aktivitas hanya menyaring tabel.',
        ),
      ).toBeTruthy(),
    );
  });
});

describe('badge MBKM', () => {
  it('warna status dari kategori server, warna jenis dari urutan opsi server', () => {
    expect(badgeVariantForCategory('participating')).toBe('success');
    expect(badgeVariantForCategory('pending')).toBe('warning');
    expect(badgeVariantForCategory('unclassified')).toBe('default');
    expect(badgeVariantForJenis('Riset', ['Magang', 'Riset'])).toBe('success');
    expect(badgeVariantForJenis('Baru', ['Magang'])).toBe('default');
  });
});
