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
  activeFilterCount,
  isKpiLoading,
}) {
  const kpiScope = useMemo(
    () => matchKpiFilterScope(kpiFilterScope, activeFilterParams),
    [kpiFilterScope, activeFilterParams],
  );

  const actionLabel = activeFilterCount ? 'Lihat Data Terfilter' : 'Lihat Rincian';
  const cardProps = useMemo(
    () => ({ actionLabel, isLoading: isKpiLoading }),
    [actionLabel, isKpiLoading],
  );
  const cards = useMemo(
    () => buildCards({ ...display, kpiScope, openModal, filterValues: filters }),
    [buildCards, display, kpiScope, openModal, filters],
  );
  return { cards, cardProps };
}
