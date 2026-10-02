import { useMemo } from 'react';
import { formatNumber, formatPercentage } from '../../../utils/uiHelpers';

export function useMbkmKpiDisplay(summaryData, isLoading) {
  return useMemo(() => {
    const kpis = summaryData?.kpis || {};
    const summary = summaryData?.summary || {};

    const totalParticipants = Number(kpis.totalParticipants) || 0;
    const eligibleCount = Number(kpis.eligibleCount) || 0;
    const selesaiCount = Number(kpis.selesaiCount) || 0;
    const berjalanCount = Number(kpis.berjalanCount) || 0;
    const totalMitra = Number(kpis.totalMitra) || 0;
    const participationRate = formatPercentage(kpis.participationRate, 1, '0.0%');

    const subtitles = {
      rate: `${formatNumber(totalParticipants)} dari ${formatNumber(eligibleCount)} Mhs Eligible`,
      participants: `Selesai: ${formatNumber(selesaiCount)} • Berjalan: ${formatNumber(berjalanCount)}`,
      eligible: 'Semester 7 Status Aktif',
      mitra: 'Penempatan MBKM Terverifikasi',
    };

    return {
      kpis: {
        participationRate,
        totalParticipants: formatNumber(totalParticipants),
        rawTotalParticipants: totalParticipants,
        eligibleCount: formatNumber(eligibleCount),
        rawEligibleCount: eligibleCount,
        selesaiCount,
        berjalanCount,
        totalMitra: formatNumber(totalMitra),
        rawTotalMitra: totalMitra,
      },
      summary,
      displaySubtitles: subtitles,
      isReady: Boolean(summaryData?.success) && !isLoading,
    };
  }, [isLoading, summaryData]);
}
