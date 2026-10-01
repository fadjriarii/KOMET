import { formatNumber } from '../../../../utils/uiHelpers';

/**
 * Custom Recharts tooltip reusable untuk chart tren kelulusan
 */
export default function GraduateTrendChartTooltip({
  active,
  payload,
  titleKey = 'tahun',
  rows = [],
  footer = null,
  titleAccessory,
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  if (!item) return null;
  const footerValueClassName = typeof footer?.valueClassName === 'function'
    ? footer.valueClassName(item[footer.key], item)
    : footer?.valueClassName || 'font-bold text-digital-blue-700 bg-digital-blue-50 px-2 py-0.5 rounded';

  return (
    <div className="bg-white/98 backdrop-blur-md border border-digital-blue-100 rounded-xl shadow-lg px-4 py-3 text-xs min-w-[180px] z-50">
      <div className="flex items-center justify-between mb-2 gap-3">
        <p className="font-bold text-gray-800">{item[titleKey] || item.year || item.academicYear || item.cohortLabel || item.name}</p>
        {titleAccessory?.(item)}
      </div>

      {rows.map(({ key, label, colorClass, format, indicatorClassName = 'w-3 h-3 rounded-sm' }) => (
        <div key={key} className="flex items-center justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className={`inline-block ${indicatorClassName} ${colorClass}`} />
            {label}
          </span>
          <span className="font-semibold text-gray-800">
            {format ? format(item[key], item) : `${formatNumber(item[key])} lulusan`}
          </span>
        </div>
      ))}

      {footer && (
        <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-gray-100">
          <span className="text-gray-500 font-medium">{footer.label}</span>
          <span className={footerValueClassName}>
            {footer.format ? footer.format(item[footer.key], item) : item[footer.key]}
          </span>
        </div>
      )}
    </div>
  );
}
