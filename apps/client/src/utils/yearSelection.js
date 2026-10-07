/** Multi-select tahun (angkatan, tahun lulus) — satu implementasi untuk tiga halaman. */
export function toggleYear(selected = [], year) {
  const value = String(year);
  return selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value];
}

export function getYearDisplayText(selected = [], placeholder = 'Pilih Tahun') {
  return selected.length ? selected.join(', ') : placeholder;
}
