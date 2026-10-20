import { memo } from 'react';
import StatCard from './StatCard';

/** Memoized, data-driven layout: satu kartu memakai kolom lebih sempit. */
const MetricSummaryGrid = memo(function MetricSummaryGrid({ cards, cardProps }) {
  // Satu kartu tidak perlu dipaksa selebar seperempat grid empat kolom.
  const layout =
    cards.length === 1
      ? 'grid-cols-1 max-w-md'
      : cards.length === 3
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
  return (
    <div className={`grid ${layout} gap-4`}>
      {cards.map(({ key, ...card }) => (
        <StatCard key={key} {...cardProps} {...card} />
      ))}
    </div>
  );
});

export default MetricSummaryGrid;
