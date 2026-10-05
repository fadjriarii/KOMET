import { memo } from 'react';
import StatCard from './StatCard';

/** Memoized, data-driven layout shared by all four-metric dashboards. */
const MetricSummaryGrid = memo(function MetricSummaryGrid({ cards, cardProps }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, ...card }) => (
        <StatCard key={key} {...cardProps} {...card} />
      ))}
    </div>
  );
});

export default MetricSummaryGrid;
