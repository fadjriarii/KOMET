import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import YearMultiFilter from '../src/components/common/filters/YearMultiFilter';

const CUSTOM_LABEL = 'Tambah Tahun Angkatan';

function renderFilter(props = {}) {
  const onChange = vi.fn();
  render(
    <YearMultiFilter
      id="angkatan-trigger"
      label="Angkatan"
      yearLabel="Angkatan"
      years={['2026', '2025', '2024', '2023', '2022']}
      allowCustom
      customLabel={CUSTOM_LABEL}
      minYear={2014}
      selectedYears={[]}
      onChange={onChange}
      {...props}
    />,
  );
  fireEvent.click(document.getElementById('angkatan-trigger'));
  return { onChange, input: screen.getByLabelText(CUSTOM_LABEL) };
}

/**
 * Checkbox hanya memuat 5 angkatan terbaru, jadi baris kustom adalah satu-satunya
 * jalan ke angkatan lama — dan hanya sampai setahun di bawah pilihan tertua.
 */
describe('tambah tahun angkatan', () => {
  it('menerima tahun antara 2014 dan setahun di bawah pilihan tertua', () => {
    const { onChange, input } = renderFilter();

    fireEvent.change(input, { target: { value: '201' } });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '2017' } });
    expect(onChange).toHaveBeenCalledWith(['2017']);
  });

  it.each(['2013', '2029'])('menolak tahun %s yang di luar kisaran', (value) => {
    const { onChange, input } = renderFilter();
    fireEvent.change(input, { target: { value } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('langsung mencentang tahun yang sudah tampil sebagai pilihan', () => {
    const { onChange, input } = renderFilter();
    fireEvent.change(input, { target: { value: '2022' } });
    expect(onChange).toHaveBeenCalledWith(['2022']);
  });

  it('menampilkan tahun kustom sebagai baris terpilih yang bisa dilepas', () => {
    const { onChange } = renderFilter({ selectedYears: ['2017'] });

    fireEvent.click(screen.getByRole('button', { name: 'Angkatan 2017' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
