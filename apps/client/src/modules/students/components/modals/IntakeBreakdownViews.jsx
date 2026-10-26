import { BookOpen, Calendar, TrendingDown, TrendingUp } from 'lucide-react';
import DistributionChart from '../../../../components/common/charts/DistributionChart';
import TrendBarChart from '../../../../components/common/charts/TrendBarChart';
import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import ModalTable from '../../../../components/common/modals/ModalTable';
import { CountBadge } from '../../../../components/common/tables/modalCells';
import { formatSignedPercentage } from '@komet/shared/formatters';
import { statusSeries } from './activeDistributions';

const prodiColumn = {
  key: 'name',
  label: 'Program Studi',
  icon: BookOpen,
  cellClassName: 'font-semibold text-gray-900',
};

function SignedChange({ value }) {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 font-medium">-</span>;
  }
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
        positive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-rose-50 text-rose-700 border-rose-200'
      }`}
    >
      {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {formatSignedPercentage(value)}
    </span>
  );
}

const yearColumns = (years) =>
  years.map((tahun) => ({
    key: tahun,
    label: tahun,
    icon: Calendar,
    headerClassName: 'text-right',
    cellClassName: 'text-right',
    render: (row) => <CountBadge value={row.years[tahun]} />,
  }));

/** Intake per prodi: distribusi tahun jangkar + tabel 5 tahun. */
export function IntakeProdiView({ breakdown }) {
  return (
    <div className="space-y-4 pt-1 pb-1">
      <p className="text-xs text-gray-500">Intake semester 1 tahun {breakdown.anchorYear}</p>
      <DistributionChart
        items={breakdown.byProdi}
        countLabel="Intake"
        emptyTitle="Tidak Ada Intake"
      />
      <ModalTable
        columns={[prodiColumn, ...yearColumns(breakdown.years)]}
        data={breakdown.byProdi}
        emptyTitle="Tidak Ada Riwayat Intake"
      />
    </div>
  );
}

/** Angkatan masuk per tahun, dipecah menurut status keaktifan saat ini (retensi). */
export function IntakeStatusChart({ breakdown }) {
  const series = statusSeries(breakdown.statuses);
  // Kunci seri sederhana (s0, s1, …): nama status bisa memuat "/" atau spasi.
  const data = breakdown.statusByYear.map((row) => ({
    tahun: row.tahun,
    total: row.total,
    ...Object.fromEntries(series.map(({ key }, index) => [`s${index}`, row.byStatus[key] || 0])),
  }));
  return (
    <div className="pt-1">
      <p className="text-xs text-gray-500 mb-2">
        Mahasiswa baru tiap tahun menurut status keaktifan saat ini, bukan status pada tahun itu.
      </p>
      <div className="h-52 sm:h-56 md:h-60 w-full">
        <TrendBarChart
          data={data}
          bars={series.map(({ label, color }, index) => ({
            dataKey: `s${index}`,
            name: label,
            color,
            stackId: 'status',
          }))}
          tooltipContent={
            <TrendChartTooltip
              titleKey="tahun"
              rows={series.map(({ label, color }, index) => ({
                key: `s${index}`,
                label,
                color,
              }))}
              footer={{ key: 'total', label: 'Total Masuk' }}
            />
          }
        />
      </div>
    </div>
  );
}

/** Penurunan per prodi: jumlah tiap tahun dalam jendela + rata-rata perubahan. */
export function DeclineProdiTable({ breakdown }) {
  return (
    <div className="pt-1 pb-1">
      <ModalTable
        columns={[
          prodiColumn,
          ...yearColumns(breakdown.years),
          {
            key: 'declinePercentage',
            label: 'Rata-rata Perubahan',
            headerClassName: 'text-right',
            cellClassName: 'text-right',
            render: (row) => <SignedChange value={row.declinePercentage} />,
          },
        ]}
        data={breakdown.byProdi}
        emptyTitle="Tidak Ada Data Penurunan"
      />
    </div>
  );
}
