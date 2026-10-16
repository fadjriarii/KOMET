import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DetailModalOrchestrator from '../src/components/common/modals/DetailModalOrchestrator';

function Thrower() {
  throw new Error('Cannot access before initialization');
}

describe('DetailModalOrchestrator', () => {
  it('crash render memakai layar error desain, bukan kotak putih', async () => {
    const onClose = vi.fn();
    render(
      <DetailModalOrchestrator
        modalMap={{ boom: Thrower }}
        modalType="boom"
        isOpen
        onClose={onClose}
        originRect={null}
        data={null}
        filters={{}}
      />,
    );

    await waitFor(() => expect(document.body.textContent).toContain('unexpected error'));
    expect(document.body.textContent).toContain('something went sideways');
  });

  it('tombol Tutup menutup popup error', async () => {
    const onClose = vi.fn();
    render(
      <DetailModalOrchestrator
        modalMap={{ boom: Thrower }}
        modalType="boom"
        isOpen
        onClose={onClose}
        originRect={null}
        data={null}
        filters={{}}
      />,
    );

    const closeButton = await screen.findByRole('button', { name: 'Tutup popup' });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
