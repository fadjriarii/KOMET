import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import { formatPercentage } from '@komet/shared/formatters';
import { Bar, Line } from 'recharts';
import { DIGITAL_BLUE } from '../../../../utils/theme';

/** Tooltip chart tren asing: total + WNA + footer rasio. */
export function ForeignChartTooltipContent() {
  return (
    <TrendChartTooltip
      titleKey="academicYear"
      rows={[
        {
          key: 'totalCount',
          label: 'Total Mahasiswa',
          colorClass: 'bg-digital-blue-300 opacity-75',
        },
        {
          key: 'foreignCount',
          label: 'Mahasiswa Asing',
          colorClass: 'bg-digital-blue-700',
          indicatorClassName: 'w-3 h-1.5 rounded-full',
        },
      ]}
      footer={{
        key: 'percentage',
        label: 'Persentase (Rasio)',
        format: formatPercentage,
      }}
    />
  );
}

/** Seri chart: bar total (kiri) + garis rasio % (kanan). */
export function ForeignChartSeries() {
  return (
    <>
      <Bar
        yAxisId="left"
        dataKey="totalCount"
        name="Total Mahasiswa (Orang)"
        fill={DIGITAL_BLUE[300]}
        opacity={0.75}
        radius={[4, 4, 0, 0]}
        maxBarSize={38}
      />
      <Line
        yAxisId="right"
        type="monotone"
        dataKey="percentage"
        name="Rasio Mhs Asing (%)"
        stroke={DIGITAL_BLUE[600]}
        strokeWidth={2.4}
        dot={{ r: 4, fill: 'white', stroke: DIGITAL_BLUE[600], strokeWidth: 2 }}
        activeDot={{ r: 6, fill: DIGITAL_BLUE[600], stroke: 'white', strokeWidth: 2 }}
      />
    </>
  );
}
