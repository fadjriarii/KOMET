import { useMemo } from 'react';
import {
  formatNumber,
  formatPercentage,
  formatSignedPercentage,
  getStudentKpiSubtitles,
  getStudentStatusPresentation,
} from '../../../utils/uiHelpers';
import { getTrendStyle } from '../../../utils/theme';

export function useStudentKpiDisplay(summaryData, filters, isLoading) {
  return useMemo(() => {
    const rawKpis = summaryData?.kpis || {};
    const kpis = {
      ...rawKpis,
      formattedActiveCount: formatNumber(rawKpis.activeStudentsCount),
      formattedForeignCount: formatNumber(rawKpis.foreignStudentsCount),
      formattedIntakeCount: formatNumber(rawKpis.intakeCohortCount),
      foreignRate: formatPercentage(rawKpis.foreignRate, 1, '0.0%'),
      declineAvg: rawKpis.hasEnoughDeclineData
        ? formatSignedPercentage(rawKpis.declinePercentage)
        : '-',
    };
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
