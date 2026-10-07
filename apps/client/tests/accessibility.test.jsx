import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef, useState } from 'react';
import { describe, expect, it } from 'vitest';
import DataTable from '../src/components/common/tables/DataTable';
import Modal from '../src/components/common/modals/Modal';

describe('tabel', () => {
  it('menandai header kolom dan label baris', () => {
    render(
      <DataTable
        columns={[
          { key: 'nim', label: 'NIM' },
          { key: 'nama', label: 'Nama' },
        ]}
        data={[{ nim: 'A1', nama: 'Ana' }]}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'NIM' }).getAttribute('scope')).toBe('col');
    const rowHeader = screen.getByRole('rowheader', { name: 'A1' });
    expect(rowHeader.getAttribute('scope')).toBe('row');
    // Sel data biasa tetap `td`, supaya tidak ikut dianggap label.
    expect(screen.getByRole('cell', { name: 'Ana' }).tagName).toBe('TD');
  });
});

function Harness() {
  const [open, setOpen] = useState(false);
  const opener = useRef(null);
  return (
    <>
      <button type="button" ref={opener} onClick={() => setOpen(true)}>
        Buka rincian
      </button>
      {open ? (
        <Modal isOpen onClose={() => setOpen(false)} title="Rincian Wisudawan">
          <button type="button">Satu</button>
          <button type="button">Dua</button>
        </Modal>
      ) : null}
    </>
  );
}

const openDialog = () => {
  const trigger = screen.getByRole('button', { name: 'Buka rincian' });
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
};

describe('modal dialog', () => {
  it('adalah dialog berlabel yang mengambil fokus lalu mengembalikannya', async () => {
    render(<Harness />);
    const trigger = openDialog();

    const dialog = await screen.findByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent).toBe(
      'Rincian Wisudawan',
    );
    await waitFor(() => expect(document.activeElement).toBe(dialog));

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    // Keyboard tidak boleh kehilangan tempat setelah popup menutup.
    expect(document.activeElement).toBe(trigger);
  });

  it('menahan Tab di dalam panel', async () => {
    render(<Harness />);
    openDialog();
    await screen.findByRole('dialog');

    const last = screen.getByRole('button', { name: 'Dua' });
    const first = screen.getByRole('button', { name: 'Satu' });
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });
});
