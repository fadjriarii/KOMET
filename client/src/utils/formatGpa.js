// Format nilai IPK menjadi string dua desimal; kembalikan '—' jika tidak valid
export const formatGpa = (value) => {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(num)) return '—';
  return num.toFixed(2);
};
