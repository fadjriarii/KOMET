import { useMemo } from 'react';
import { formatDecimal, formatNumber, formatPercentage } from '@komet/shared/formatters';

export function useGraduateKpiDisplay(summaryData, isLoading) {
  return useMemo(() => {
    const kpis = summaryData?.kpis || {};
    const summary = summaryData?.summary || {};

    // Tanpa `Number(...) || 0`: `null` dari server berarti "belum ada data" dan
    // harus terbaca begitu di kartu, bukan sebagai nol yang meyakinkan.
    const s1Gpa = formatDecimal(kpis.averageGpaS1, 2);
    const s2Gpa = formatDecimal(kpis.averageGpaS2, 2);
    const s1OnTime = formatPercentage(kpis.onTimeGraduationRateS1, 1);
    const s2OnTime = formatPercentage(kpis.onTimeGraduationRateS2, 1);
    const s1StudySuccess = formatPercentage(kpis.studySuccessRateS1, 1);

    const subtitles = {
      total: `S1: ${formatNumber(kpis.totalGraduatesS1)} • S2: ${formatNumber(
        kpis.totalGraduatesS2,
      )} Wisudawan`,
      gpa: `S1: ${s1Gpa} • S2: ${s2Gpa}`,
      onTime: `S1: ${s1OnTime} • S2: ${s2OnTime}`,
      studySuccess: summary.keberhasilanStudi?.angkatanS1
        ? `Evaluasi Angkatan ${summary.keberhasilanStudi.angkatanS1} (S1)`
        : 'Tingkat Kelulusan Akhir',
    };

    return {
      kpis: {
        totalGraduates: formatNumber(kpis.totalGraduates),
        averageGpaS1: s1Gpa,
        averageGpaS2: s2Gpa,
        onTimeGraduationRateS1: s1OnTime,
        onTimeGraduationRateS2: s2OnTime,
        studySuccessRateS1: s1StudySuccess,
      },
      summary,
      displaySubtitles: subtitles,
      isReady: Boolean(summaryData?.success) && !isLoading,
    };
  }, [isLoading, summaryData]);
}
