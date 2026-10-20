import { useMemo } from 'react';
import { formatNumber, formatPercentage } from '@komet/shared/formatters';

export function useMbkmKpiDisplay(summaryData, isLoading) {
  return useMemo(() => {
    const kpis = summaryData?.kpis || {};
    const periode = summaryData?.selectedPeriode;

    // `null` dari server = tidak ada penyebut; biarkan formatter menampilkan "-".
    const participationRate = formatPercentage(kpis.participationRate, 1);

    return {
      kpis: {
        participationRate,
        totalParticipants: formatNumber(kpis.totalParticipants),
        eligibleCount: formatNumber(kpis.eligibleCount),
      },
      displaySubtitles: {
        rate: `${formatNumber(kpis.totalParticipants)} dari ${formatNumber(
          kpis.eligibleCount,
        )} mahasiswa aktif semester 7${periode ? ` · ${periode}` : ''}`,
        participants: `Selesai: ${formatNumber(kpis.selesaiCount)} • Berjalan: ${formatNumber(
          kpis.berjalanCount,
        )}`,
        eligible: 'Semester 7 Status Aktif',
      },
      isReady: Boolean(summaryData?.success) && !isLoading,
    };
  }, [isLoading, summaryData]);
}
