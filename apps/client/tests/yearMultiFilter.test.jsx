import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import YearMultiFilter from '../src/components/common/filters/YearMultiFilter';

const CUSTOM_LABEL = 'Tambah Tahun Angkatan';
const META = {
  minLabel: '2014/2015',
  maxLabel: '2021/2022',
  placeholder: '2021/2022',
  helperText: 'Angkatan lama tidak ada di atas? Ketik tahun ajaran 2014/2015–2021/2022.',
  errorText: 'Hanya 2014/2015–2021/2022.',
};

function renderFilter(props = {}) {
  const onChange = vi.fn();
  render(
    <YearMultiFilter
      id="angkatan-trigger"
      label="Angkatan"
      yearLabel="Angkatan"
      years={['2025/2026', '2024/2025', '2023/2024', '2022/2023', '2021/2022']}
      allowCustom
      customLabel={CUSTOM_LABEL}
      customMeta={META}
      selectedYears={[]}
      onChange={onChange}
      {...props}
    />,
  );
  fireEvent.click(document.getElementById('angkatan-trigger'));
  return { onChange, input: screen.getByLabelText(CUSTOM_LABEL) };
}

/**
 * Checkbox hanya memuat 5 label terbaru, jadi baris kustom adalah satu-satunya
 * jalan ke angkatan lama — dan hanya dalam kisaran customMeta server.
 */
describe('tambah tahun angkatan', () => {
  it('menerima label penuh antara minLabel dan maxLabel', () => {
    const { onChange, input } = renderFilter();

    fireEvent.change(input, { target: { value: '2019/202' } });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '2019/2020' } });
    expect(onChange).toHaveBeenCalledWith(['2019/2020']);
  });

  it.each(['2013/2014', '2029/2030', '2019', '2019-2020'])(
    'menolak label %s yang di luar kisaran/format',
    (value) => {
      const { onChange, input } = renderFilter();
      fireEvent.change(input, { target: { value } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onChange).not.toHaveBeenCalled();
    },
  );

  it('langsung mencentang label yang sudah tampil sebagai pilihan', () => {
    const { onChange, input } = renderFilter();
    fireEvent.change(input, { target: { value: '2021/2022' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['2021/2022']);
  });

  it('menampilkan tahun kustom sebagai baris terpilih yang bisa dilepas', () => {
    const { onChange } = renderFilter({ selectedYears: ['2019/2020'] });

    fireEvent.click(screen.getByRole('button', { name: 'Angkatan 2019/2020' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('fallback lokal bila customMeta null', () => {
    const { input } = renderFilter({ customMeta: null });
    expect(input.getAttribute('placeholder')).toBe('2021/2022');
  });
});
