import DistributionBarChart from './DistributionBarChart';
import { getTooltipPayloadItem } from '../../../utils/uiHelpers';
import { formatNumber, formatPercentage } from '@komet/shared/formatters';
import { DIGITAL_BLUE } from '../../../utils/theme';

/** Baris tambahan yang hanya tampil bila nilainya memang ada pada baris data. */
const OPTIONAL_ROWS = [
  { key: 'gpaValue', label: 'Rata-rata IPK' },
  { key: 'percentage', label: 'Persentase', format: formatPercentage },
];

function DistributionTooltip({ active, payload, nameKey, countLabel, countUnit }) {
  if (!active || !payload?.length) return null;
  const data = getTooltipPayloadItem(payload);
  if (!data) return null;
  return (
    <div className="bg-white/95 backdrop-blur-md border border-digital-blue-100 rounded-xl shadow-lg px-3.5 py-2.5 text-xs min-w-[160px] z-50">
      <p className="font-bold text-gray-900 mb-1.5 leading-tight">{data[nameKey]}</p>
      <div className="flex items-center justify-between gap-3 text-gray-600 mb-1">
        <span>{countLabel}:</span>
        <span className="font-bold text-gray-900">
          {formatNumber(data.count)} {countUnit}
        </span>
      </div>
      {OPTIONAL_ROWS.filter(({ key }) => data[key] !== undefined).map(
        ({ key, label, format = (value) => value }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 pt-1 border-t border-gray-100 text-digital-blue-700 font-semibold"
          >
            <span>{label}:</span>
            <span className="bg-digital-blue-50 px-1.5 py-0.5 rounded text-[11px] font-bold">
              {format(data[key])}
            </span>
          </div>
        ),
      )}
    </div>
  );
}

/**
 * Grafik distribusi semua modul. Judul tooltip dibaca dari `nameKey` yang sama
 * dengan sumbu Y — tidak ada lagi rantai tebakan nama field (`name || range || tahun`).
 */
export default function DistributionChart({
  nameKey = 'name',
  countLabel = 'Jumlah',
  countUnit = 'mhs',
  barColor = DIGITAL_BLUE[600],
  ...props
}) {
  return (
    <DistributionBarChart
      {...props}
      nameKey={nameKey}
      barColor={barColor}
      tooltipContent={
        <DistributionTooltip nameKey={nameKey} countLabel={countLabel} countUnit={countUnit} />
      }
    />
  );
}
