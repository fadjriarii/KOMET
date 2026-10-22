import { useMemo } from 'react';
import { matchKpiFilterScope } from '../../../utils/kpiScope';

/** Kartu KPI + badge scope: turunan murni summary, filter, dan modal. */
export function useDashboardCards({
  buildCards,
  display,
  kpiFilterScope,
  activeFilterParams,
  openModal,
  filters,
  isKpiLoading,
}) {
  const kpiScope = useMemo(
    () => matchKpiFilterScope(kpiFilterScope, activeFilterParams),
    [kpiFilterScope, activeFilterParams],
  );

  const cardProps = useMemo(() => ({ isLoading: isKpiLoading }), [isKpiLoading]);
  const cards = useMemo(
    () =>
      buildCards({ ...display, kpiScope, openModal, filterValues: filters }).map((card) => ({
        ...card,
        // Card yang metriknya tidak terpengaruh filter tetap menawarkan rincian,
        // bukan "data terfilter"; label panjang juga tidak memenuhi footer.
        actionLabel:
          card.actionLabel ?? (card.isFiltered ? 'Lihat Data Terfilter' : 'Lihat Rincian'),
      })),
    [buildCards, display, kpiScope, openModal, filters],
  );
  return { cards, cardProps };
}
