import { formatNumber } from '../../../../utils/uiHelpers';

export default function StudentTrendTooltip({ active, payload, titleKey, valueKey, valueLabel, secondaryKey, secondaryLabel }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs min-w-[180px]">
      <p className="font-bold text-gray-800 mb-2">{item[titleKey]}</p>
      <div className="flex items-center justify-between gap-4 mb-1">
        <span className="text-gray-500">{valueLabel}</span>
        <span className="font-semibold text-gray-800">{formatNumber(item[valueKey])}</span>
      </div>
      {secondaryKey && (
        <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-gray-100">
          <span className="text-gray-500">{secondaryLabel}</span>
          <span className="font-bold text-digital-blue-700">{item[secondaryKey]}</span>
        </div>
      )}
    </div>
  );
}
