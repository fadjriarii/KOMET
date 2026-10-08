import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SyncModulePicker from '../src/components/layout/Sidebar/SyncModulePicker';

// Skenario jangka panjang yang dijanjikan kartu ini: kelompok lain (Lecturer, Staff, ...)
// sudah ditambah, masing-masing dengan tiga pilihan. Yang diuji bentuk kartunya, bukan datanya.
vi.mock('../src/components/layout/Sidebar/syncModules', async (importOriginal) => ({
  ...(await importOriginal()),
  MODULE_GROUPS: [
    { key: 'student', label: 'Student', moduleKeys: ['students', 'graduates', 'mbkm'] },
    {
      key: 'lecturer',
      label: 'Lecturer',
      moduleKeys: ['lecturers', 'lecturer_courses', 'lecturer_books'],
    },
    {
      key: 'staff',
      label: 'Staff',
      moduleKeys: ['employees', 'staff_trainings', 'staff_positions'],
    },
  ],
}));

const KEYS = [
  'students',
  'graduates',
  'mbkm',
  'lecturers',
  'lecturer_courses',
  'lecturer_books',
  'employees',
  'staff_trainings',
  'staff_positions',
];

/** `job` adalah permukaan useSyncJob yang dibaca kartu ini; popup dan server tidak diperlukan. */
function fakeJob() {
  return {
    moduleRows: KEYS.map((key) => ({ key, label: key, inScope: false, status: 'idle' })),
    selected: Object.fromEntries(KEYS.map((key) => [key, true])),
    allSelected: true,
    someSelected: true,
    isRunning: false,
    toggleModule: vi.fn(),
    toggleGroup: vi.fn(),
    toggleAll: vi.fn(),
  };
}

/** Checkbox baris pilihan saja: bukan "Select All", bukan checkbox kelompok. */
const rowBoxes = () =>
  screen.getAllByRole('checkbox', { hidden: true }).filter((box) => {
    const label = box.getAttribute('aria-label');
    return label !== 'Select All' && !label.startsWith('Select every');
  });

describe('kartu Select Data dengan banyak kelompok', () => {
  it('menampung seluruh pilihan di dalam satu kontainer gulir, bukan memanjang', () => {
    const { container } = render(<SyncModulePicker job={fakeJob()} />);
    const scroller = container.querySelector('.overflow-y-auto.custom-scrollbar');

    // Scrollbar-nya gaya bersama se-web ini (index.css), bukan bawaan browser.
    expect(scroller).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /group$/ })).toHaveLength(3);
    expect(rowBoxes()).toHaveLength(KEYS.length);
    for (const box of rowBoxes()) expect(scroller.contains(box)).toBe(true);

    // Rantai flex pengikat tinggi: kolom tumbuh di dalam kartunya sendiri, popup tidak
    // ikut tertarik ke bawah.
    expect(scroller.parentElement.className).toContain('min-h-0');
    expect(scroller.className).toContain('flex-1');
    expect(scroller.className).toContain('min-h-0');
  });

  it('membuka satu kelompok tidak membuka kelompok lain', () => {
    render(<SyncModulePicker job={fakeJob()} />);
    const hiddenRow = { name: 'Select lecturers', hidden: true };

    expect(screen.getByRole('checkbox', hiddenRow).tabIndex).toBe(-1);

    fireEvent.click(screen.getByRole('button', { name: 'Expand Student group' }));
    expect(screen.getByRole('checkbox', hiddenRow).tabIndex).toBe(-1);
    expect(screen.getByRole('checkbox', { name: 'Select students' }).tabIndex).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: 'Expand Lecturer group' }));
    expect(screen.getByRole('checkbox', hiddenRow).tabIndex).toBe(0);
  });
});
