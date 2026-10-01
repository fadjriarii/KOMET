import { useMemo } from 'react';
import { formatNumber } from '../../../utils/uiHelpers';

export function useGraduateKpiDisplay(summaryData, isLoading) {
  return useMemo(() => {
    const kpis = summaryData?.kpis || {};
    const summary = summaryData?.summary || {};

    const s1Total = summary.totalLulusan?.s1 ?? 0;
    const s2Total = summary.totalLulusan?.s2 ?? 0;
    const totalCount = kpis.totalGraduates ?? (s1Total + s2Total);

    const s1Gpa = kpis.averageGpaS1 ?? (typeof summary.avgIpk?.s1?.average === 'number' ? summary.avgIpk.s1.average.toFixed(2) : '0.00');
    const s2Gpa = kpis.averageGpaS2 ?? (typeof summary.avgIpk?.s2?.average === 'number' ? summary.avgIpk.s2.average.toFixed(2) : '0.00');

    const s1OnTime = kpis.onTimeGraduationRateS1 ?? (summary.tepatWaktu?.s1 !== null && summary.tepatWaktu?.s1 !== undefined ? `${summary.tepatWaktu.s1}%` : '0.0%');
    const s2OnTime = kpis.onTimeGraduationRateS2 ?? (summary.tepatWaktu?.s2 !== null && summary.tepatWaktu?.s2 !== undefined ? `${summary.tepatWaktu.s2}%` : '0.0%');

    const s1StudySuccess = kpis.studySuccessRateS1 ?? (summary.keberhasilanStudi?.s1 !== null && summary.keberhasilanStudi?.s1 !== undefined ? `${summary.keberhasilanStudi.s1}%` : '0.0%');

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
