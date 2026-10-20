import { useMemo } from 'react';
import { formatNumber, formatPercentage } from '@komet/shared/formatters';

export function useMbkmKpiDisplay(summaryData, isLoading) {
  return useMemo(() => {
    const kpis = summaryData?.kpis || {};
    const periode = summaryData?.selectedPeriode;
    const previousPeriode = summaryData?.previousPeriode;

    // `null` dari server = tidak ada penyebut; biarkan formatter menampilkan "-".
    const participationRate = formatPercentage(kpis.participationRate, 1);

    return {
      kpis: {
        participationRate,
        totalParticipants: formatNumber(kpis.totalParticipants),
        eligibleCount: formatNumber(kpis.eligibleCount),
        totalMitra: formatNumber(kpis.totalMitra),
      },
      displaySubtitles: {
        rate: `${formatNumber(kpis.totalParticipants)} dari ${formatNumber(
          kpis.eligibleCount,
        )} mahasiswa aktif semester 7${periode ? ` · ${periode}` : ''}`,
        participants: `Selesai: ${formatNumber(kpis.selesaiCount)} • Berjalan: ${formatNumber(
          kpis.berjalanCount,
        )}`,
        eligible: 'Semester 7 Status Aktif',
        mitra: previousPeriode ? `Mitra unik periode ${previousPeriode}` : 'Mitra unik terdata',
      },
      isReady: Boolean(summaryData?.success) && !isLoading,
    };
  }, [isLoading, summaryData]);
}
