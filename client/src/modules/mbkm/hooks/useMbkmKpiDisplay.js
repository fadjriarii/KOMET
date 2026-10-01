import { useMemo } from 'react';
import { formatNumber } from '../../../utils/uiHelpers';

export function useMbkmKpiDisplay(summaryData, isLoading) {
  return useMemo(() => {
    const kpis = summaryData?.kpis || {};
    const summary = summaryData?.summary || {};

    const totalParticipants = kpis.totalParticipants ?? (summary.persentaseMbkm?.mbkmCount || 0);
    const eligibleCount = kpis.eligibleCount ?? (summary.totalEligible || 0);
    const selesaiCount = kpis.selesaiCount ?? 0;
    const berjalanCount = kpis.berjalanCount ?? (summary.totalMbkmAktif || 0);
    const totalMitra = kpis.totalMitra ?? (summary.totalMitra || 0);

    const ratePct = summary.persentaseMbkm?.percentage ?? 0;
    const participationRate = kpis.participationRate || `${Number(ratePct).toFixed(1)}%`;

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
