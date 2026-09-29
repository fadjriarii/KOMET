import { useMemo } from 'react';
import {
  getStudentKpiSubtitles,
  getStudentStatusPresentation,
} from '../../../utils/uiHelpers';
import { getTrendStyle } from '../../../utils/theme';

export function useStudentKpiDisplay(summaryData, filters, isLoading) {
  return useMemo(() => {
    const kpis = summaryData?.kpis || {};
    const activeStudentPresentation = getStudentStatusPresentation(filters.selectedStatus);
    const hasEnoughDeclineData = kpis.hasEnoughDeclineData !== false;
    const displaySubtitles = getStudentKpiSubtitles(kpis, activeStudentPresentation.statusLabel);
    if (!hasEnoughDeclineData) {
      displaySubtitles.declineSubtitle = 'Data historis belum cukup untuk perbandingan';
    }
    return {
      kpis,
      activeStudentPresentation,
      displaySubtitles,
      declineTrendStyle: hasEnoughDeclineData
        ? getTrendStyle(kpis.isFluctuationPositive)
        : { textClass: 'text-gray-500', label: 'Data belum cukup' },
      isReady: Boolean(summaryData?.success) && !isLoading,
    };
  }, [filters.selectedStatus, isLoading, summaryData]);
}
