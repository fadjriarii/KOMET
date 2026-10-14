import { useMemo } from 'react';
import { formatDecimal, formatNumber, formatPercentage } from '@komet/shared/formatters';
import { getDemographicContextLabel } from '../../../utils/uiHelpers';

/**
 * Konteks demografis aktif (fakultas/prodi/jenjang) — berlaku untuk semua card.
 */
function buildFilterContext(filterValues = {}) {
  return getDemographicContextLabel(
    filterValues.selectedFaculty,
    filterValues.selectedProdi,
    filterValues.selectedJenjang,
  );
}

/**
 * Tambahkan konteks filter ke subtitle inti.
 * Tanpa konteks → subtitle inti apa adanya.
 */
function withContext(subtitle, context, { wrap = false } = {}) {
  if (!context) return subtitle;
  return wrap ? `${subtitle} (${context})` : `${subtitle} — ${context}`;
}

export function useGraduateKpiDisplay(summaryData, isLoading, filterValues = {}) {
  return useMemo(() => {
    const kpis = summaryData?.kpis || {};
    const summary = summaryData?.summary || {};

    // Tanpa `Number(...) || 0`: `null` dari server berarti "belum ada data" dan
    // harus terbaca begitu di kartu, bukan sebagai nol yang meyakinkan.
    const s1Gpa = formatDecimal(kpis.averageGpaS1, 2);
    const s2Gpa = formatDecimal(kpis.averageGpaS2, 2);
    const byJenjang = kpis.totalGraduatesByJenjang || {};
    const extraJenjangs = Object.keys(byJenjang)
      .filter((key) => key !== 's1' && key !== 's2')
      .sort();
    const extraSubtitle = extraJenjangs
      .map((key) => `${key.toUpperCase()}: ${formatNumber(byJenjang[key])}`)
      .join(' • ');
    const s1OnTime = formatPercentage(kpis.onTimeGraduationRateS1, 1);
    const s2OnTime = formatPercentage(kpis.onTimeGraduationRateS2, 1);
    const s1StudySuccess = formatPercentage(kpis.studySuccessRateS1, 1);

    const demographicContext = buildFilterContext(filterValues);

    // Subtitle inti per card
    const baseTotal = `S1: ${formatNumber(kpis.totalGraduatesS1)} • S2: ${formatNumber(
      kpis.totalGraduatesS2,
    )}${extraSubtitle ? ` • ${extraSubtitle}` : ''} Lulusan`;
    const baseGpa = `S1: ${s1Gpa} • S2: ${s2Gpa}`;
    const baseOnTime = `S1: ${s1OnTime} • S2: ${s2OnTime}`;
    const baseStudySuccess = summary.keberhasilanStudi?.angkatanS1
      ? `Evaluasi Angkatan ${summary.keberhasilanStudi.angkatanS1} (S1)`
      : 'Tingkat Kelulusan Akhir';

    const subtitles = {
      // Card total: semua filter relevan
      total: withContext(baseTotal, demographicContext),
      totalScope: kpis.totalScopeLabel || 'Semua Tahun',
      // Card gpa: semua filter relevan
      gpa: withContext(baseGpa, demographicContext),
      // Card onTime: semua filter relevan
      onTime: withContext(baseOnTime, demographicContext),
      // Card studySuccess: tahunLulus/periodeWisuda/predikat TIDAK relevan (COHORT scope)
      studySuccess: withContext(baseStudySuccess, demographicContext, { wrap: true }),
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
  }, [isLoading, summaryData, filterValues]);
}
