import { DIGITAL_BLUE } from '../../../../utils/theme';
import DistributionBarChart from '../../../../components/common/charts/DistributionBarChart';
import { formatNumber, formatPercentage, getTooltipPayloadItem } from '../../../../utils/uiHelpers';

function StudentDistributionTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = getTooltipPayloadItem(payload);
  if (!data) return null;
  return <div className="bg-white/95 backdrop-blur-md border border-digital-blue-100 rounded-xl shadow-lg px-3.5 py-2.5 text-xs min-w-[160px] z-50"><p className="font-bold text-gray-900 mb-1.5 leading-tight">{data.name}</p><div className="flex items-center justify-between gap-3 text-gray-600 mb-1"><span>Jumlah Mahasiswa:</span><span className="font-bold text-gray-900">{formatNumber(data.count)} mhs</span></div><div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-100 text-digital-blue-700 font-semibold"><span>Persentase:</span><span className="bg-digital-blue-50 px-1.5 py-0.5 rounded text-[11px] font-bold">{formatPercentage(data.percentage)}</span></div></div>;
}

export default function StudentDistributionChart(props) {
  return <DistributionBarChart {...props} barColor={props.barColor || DIGITAL_BLUE[600]} tooltipContent={<StudentDistributionTooltip />} />;
}
