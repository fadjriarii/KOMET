import { Bar, Cell, LabelList } from 'recharts';
import { DIGITAL_BLUE } from '../../../../utils/theme';
import { formatPercentage } from '@komet/shared/formatters';

/** Seri bar distribusi: sel berwarna + label nilai di kanan. */
export function DistributionSeries({ chartItems, dataKey, labelKey, barColor, labelFormatter }) {
  return (
    <Bar dataKey={dataKey} radius={[0, 6, 6, 0]} maxBarSize={22} animationDuration={800}>
      {chartItems.map((_, index) => (
        <Cell
          key={`cell-${index}`}
          fill={barColor}
          className="hover:opacity-90 transition-opacity cursor-pointer"
        />
      ))}
      {labelKey && (
        <LabelList
          dataKey={labelKey}
          formatter={
            labelFormatter ||
            (labelKey === 'percentage' ? (value) => formatPercentage(value) : undefined)
          }
          position="right"
          style={{ fill: DIGITAL_BLUE[700], fontSize: 11, fontWeight: 700 }}
        />
      )}
    </Bar>
  );
}
