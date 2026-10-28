import { memo } from 'react';
import StatCard from './StatCard';

/**
 * Kartu unggulan (`featured`) memakan 2 kolom × 2 baris di desktop dan baris
 * penuh di tablet; empat kartu lain mengisi 2 × 2 di sampingnya. Dengan satu
 * kartu unggulan + empat kartu, tidak ada slot kosong di lebar mana pun.
 */
const FEATURED_SPAN = 'sm:col-span-2 lg:col-span-2 lg:row-span-2';

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
      {cards.map(({ key, featured = false, className = '', ...card }) => (
        <StatCard
          key={key}
          {...cardProps}
          {...card}
          className={`${featured ? FEATURED_SPAN : ''} ${className}`.trim()}
        />
      ))}
    </div>
  );
});

export default MetricSummaryGrid;
