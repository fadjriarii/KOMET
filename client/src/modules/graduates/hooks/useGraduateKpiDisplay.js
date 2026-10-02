import { useMemo } from 'react';
import { formatDecimal, formatNumber, formatPercentage } from '../../../utils/uiHelpers';

export function useGraduateKpiDisplay(summaryData, isLoading) {
  return useMemo(() => {
    const kpis = summaryData?.kpis || {};
    const summary = summaryData?.summary || {};

    const s1Total = Number(kpis.totalGraduatesS1) || 0;
    const s2Total = Number(kpis.totalGraduatesS2) || 0;
    const totalCount = Number(kpis.totalGraduates) || 0;
    const s1Gpa = formatDecimal(kpis.averageGpaS1, 2, '0.00');
    const s2Gpa = formatDecimal(kpis.averageGpaS2, 2, '0.00');
    const s1OnTime = formatPercentage(kpis.onTimeGraduationRateS1, 1, '0.0%');
    const s2OnTime = formatPercentage(kpis.onTimeGraduationRateS2, 1, '0.0%');
    const s1StudySuccess = formatPercentage(kpis.studySuccessRateS1, 1, '0.0%');

    const subtitles = {
      total: `S1: ${formatNumber(s1Total)} • S2: ${formatNumber(s2Total)} Wisudawan`,
      gpa: `S1: ${s1Gpa} • S2: ${s2Gpa}`,
      onTime: `S1: ${s1OnTime} • S2: ${s2OnTime}`,
      studySuccess: summary.keberhasilanStudi?.angkatanS1 ? `Evaluasi Angkatan ${summary.keberhasilanStudi.angkatanS1} (S1)` : 'Tingkat Kelulusan Akhir',
    };

    return {
      kpis: {
        totalGraduates: formatNumber(totalCount),
        rawTotalGraduates: totalCount,
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
