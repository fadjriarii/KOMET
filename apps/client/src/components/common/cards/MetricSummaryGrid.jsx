import { memo } from 'react';
import StatCard from './StatCard';

/**
 * Lima kartu tanpa slot kosong di lebar mana pun: 1 kolom di ponsel, 2 + 2 + 1
 * (kartu terakhir penuh) di tablet, lalu 3 + 2 di desktop lewat grid 6 kolom.
 * Dua kartu baris kedua lebih lebar, cocok untuk subjudul yang panjang.
 */
const FIVE_CARD_SPANS = [
  'lg:col-span-2',
  'lg:col-span-2',
  'lg:col-span-2',
  'lg:col-span-3',
  'sm:col-span-2 lg:col-span-3',
];

/** Memoized, data-driven layout: satu kartu memakai kolom lebih sempit. */
const MetricSummaryGrid = memo(function MetricSummaryGrid({ cards, cardProps }) {
  // Satu kartu tidak perlu dipaksa selebar seperempat grid empat kolom.
  const layout =
    cards.length === 1
      ? 'grid-cols-1 max-w-md'
      : cards.length === 3
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        : cards.length === 5
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
  const spanOf = (index) => (cards.length === 5 ? FIVE_CARD_SPANS[index] : '');
  return (
    <div className={`grid ${layout} gap-4`}>
      {cards.map(({ key, className = '', ...card }, index) => (
        <StatCard
          key={key}
          {...cardProps}
          {...card}
          className={`${spanOf(index)} ${className}`.trim()}
        />
      ))}
    </div>
  );
});

export default MetricSummaryGrid;
