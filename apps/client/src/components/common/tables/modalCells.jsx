import { formatNumber } from '@komet/shared/formatters';

/** Sel tahun akademik: dot biru + teks tebal (dipakai kolom tahun semua tabel tren). */
export function YearDotCell({ value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-digital-blue-500"></span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

/** Badge jumlah "N mhs" biru (dipakai kolom hitung semua tabel tren). */
export function CountBadge({ value }) {
  return (
    <span className="bg-digital-blue-50/80 text-digital-blue-800 px-2.5 py-0.5 rounded-md border border-digital-blue-100 font-semibold">
      {formatNumber(value)} mhs
    </span>
  );
}
