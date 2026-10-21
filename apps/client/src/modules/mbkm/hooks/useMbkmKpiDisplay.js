import { useMemo } from 'react';
import { formatNumber, formatPercentage } from '@komet/shared/formatters';

export function useMbkmKpiDisplay(summaryData, isLoading) {
  return useMemo(() => {
    const kpis = summaryData?.kpis || {};
    const periods = summaryData?.selectedPeriods || [];
    const periodLabel =
      periods.length > 1
        ? `${periods[0]}–${periods.at(-1)}`
        : summaryData?.selectedPeriode || periods[0] || '';

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
        )} mahasiswa aktif semester 7${periodLabel ? ` · ${periodLabel}` : ''}`,
        participants: `Selesai: ${formatNumber(kpis.selesaiCount)} • Berjalan: ${formatNumber(
          kpis.berjalanCount,
        )}`,
        eligible: 'Semester 7 Status Aktif',
        mitra: periodLabel ? `Mitra unik periode ${periodLabel}` : 'Mitra unik terdata',
      },
      isReady: Boolean(summaryData?.success) && !isLoading,
    };
  }, [isLoading, summaryData]);
}
