import { useMemo } from 'react';
import { formatNumber, formatPercentage } from '@komet/shared/formatters';

export function useMbkmKpiDisplay(summaryData, isLoading) {
  return useMemo(() => {
    const kpis = summaryData?.kpis || {};
    const summary = summaryData?.summary || {};

    // Nilai `null` dari server dibiarkan `null`: `formatNumber` sudah memetakannya
    // ke `-`, sementara `Number(null) || 0` mengubah "belum ada data" menjadi nol.
    const participationRate = formatPercentage(kpis.participationRate, 1);

    const subtitles = {
      rate: `${formatNumber(kpis.totalParticipants)} dari ${formatNumber(
        kpis.eligibleCount,
      )} Mhs Eligible`,
      participants: `Selesai: ${formatNumber(kpis.selesaiCount)} • Berjalan: ${formatNumber(
        kpis.berjalanCount,
      )}`,
      eligible: 'Semester 7 Status Aktif',
      mitra: 'Penempatan MBKM Terverifikasi',
    };

    return {
      kpis: {
        participationRate,
        // Target IKU-2 adalah nilai yang dikirim server, bukan konstanta UI.
        targetIku2: formatPercentage(kpis.targetIku2, 1),
        totalParticipants: formatNumber(kpis.totalParticipants),
        eligibleCount: formatNumber(kpis.eligibleCount),
        selesaiCount: kpis.selesaiCount,
        berjalanCount: kpis.berjalanCount,
        totalMitra: formatNumber(kpis.totalMitra),
      },
      summary,
      displaySubtitles: subtitles,
      isReady: Boolean(summaryData?.success) && !isLoading,
    };
  }, [isLoading, summaryData]);
}
