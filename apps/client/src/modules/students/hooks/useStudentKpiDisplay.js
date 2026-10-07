import { useMemo } from 'react';
import { getStudentKpiSubtitles, getStudentStatusPresentation } from '../../../utils/uiHelpers';
import { formatNumber, formatPercentage, formatSignedPercentage } from '@komet/shared/formatters';
import { getTrendStyle } from '../../../utils/theme';

export function useStudentKpiDisplay(summaryData, isLoading) {
  return useMemo(() => {
    const rawKpis = summaryData?.kpis || {};
    const kpis = {
      ...rawKpis,
      formattedActiveCount: formatNumber(rawKpis.activeStudentsCount),
      formattedIntakeCount: formatNumber(rawKpis.intakeCohortCount),
      foreignRate: formatPercentage(rawKpis.foreignRate, 1),
      declineAvg: rawKpis.hasEnoughDeclineData
        ? formatSignedPercentage(rawKpis.declinePercentage)
        : '-',
    };
    // Seleksi status dibaca dari snapshot summary yang sama dengan angkanya, bukan
    // dari keadaan URL yang bisa sudah bergeser.
    const activeStudentPresentation = getStudentStatusPresentation(rawKpis.activeStudentStatus);
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
  }, [isLoading, summaryData]);
}
