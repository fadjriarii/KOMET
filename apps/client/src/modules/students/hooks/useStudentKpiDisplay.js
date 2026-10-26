import { useMemo } from 'react';
import { getStudentKpiSubtitles, getStudentStatusPresentation } from '../../../utils/uiHelpers';
import { buildFilterLabels } from '../../../utils/kpiLabels';
import {
  buildActiveSubtitle,
  buildDeclineDisplay,
  buildForeignSubtitle,
  buildIntakeSubtitle,
} from '../../../utils/kpiSubtitles';
import { formatKpiDisplay } from '../../../utils/uiHelpers';
import { formatNumber, formatPercentage, formatSignedPercentage } from '@komet/shared/formatters';
import { getTrendStyle, INSUFFICIENT_DATA_TREND_STYLE } from '../../../utils/theme';

/** Normalisasi pilihan filter menjadi array terisi (angkatan: string; semester: string/angka). */
function pickStrings(value) {
  return (Array.isArray(value) ? value : [value]).filter(
    (item) => typeof item === 'string' && item.trim() !== '',
  );
}

function pickSemesters(value) {
  return (Array.isArray(value) ? value : [value]).filter(
    (item) => item !== '' && item !== null && item !== undefined,
  );
}

export function useStudentKpiDisplay(summaryData, isLoading, filterValues = {}) {
  return useMemo(() => {
    const rawKpis = summaryData?.kpis || {};
    const kpis = {
      ...rawKpis,
      formattedActiveCount: formatNumber(rawKpis.activeStudentsCount),
      formattedIntakeCount: formatNumber(rawKpis.intakeCohortCount),
      foreignRate: formatPercentage(rawKpis.foreignRate, 1),
      declineAvg: rawKpis.hasEnoughDeclineData
        ? formatKpiDisplay(formatSignedPercentage(rawKpis.declinePercentage))
        : '-',
    };
    const activeStudentPresentation = getStudentStatusPresentation(rawKpis.activeStudentStatus);
    const hasEnoughDeclineData = kpis.hasEnoughDeclineData === true;
    const baseSubtitles = getStudentKpiSubtitles(kpis, activeStudentPresentation.statusLabel);
    if (!hasEnoughDeclineData) {
      baseSubtitles.declineSubtitle = 'Data historis belum cukup untuk perbandingan';
    }

    const selectedYears = pickStrings(filterValues.selectedYears);
    const selectedSemesters = pickSemesters(filterValues.selectedSemester);
    const labels = buildFilterLabels(filterValues);
    const currentTahunAjaran = filterValues.tahunAjaran || kpis.intakePeriod || '';
    const intakeLocation = [labels.location, labels.angkatan].filter(Boolean).join(', ');

    const activeSubtitle = buildActiveSubtitle(
      baseSubtitles.activeSubtitle,
      activeStudentPresentation.statusTitle,
      labels.demographic,
    );
    const foreignSubtitle = buildForeignSubtitle(
      baseSubtitles.foreignSubtitle,
      formatNumber(kpis.foreignStudentsCount ?? 0),
      activeStudentPresentation.statusLabel,
      labels.demographic,
    );
    const intakeSubtitle = buildIntakeSubtitle({
      baseSubtitle: baseSubtitles.intakeSubtitle,
      selectedSemesters,
      selectedYears,
      nonCohortLocation: labels.location,
      intakeLocation,
      intakePeriod: kpis.intakePeriod,
      intakeSemesterTerm: kpis.intakeSemesterTerm,
      currentTahunAjaran,
    });
    const { declineTitle, declineBadge, declineSubtitle } = buildDeclineDisplay({
      baseSubtitle: baseSubtitles.declineSubtitle,
      selectedYears,
      declineDemographicLabel: labels.decline,
      nonCohortLocation: labels.location,
      hasEnoughDeclineData,
    });

    return {
      kpis,
      activeStudentPresentation,
      displaySubtitles: {
        activeSubtitle,
        foreignSubtitle,
        intakeSubtitle,
        declineSubtitle,
      },
      displayTitles: { declineTitle },
      displayBadges: { declineBadge },
      declineTrendStyle: hasEnoughDeclineData
        ? getTrendStyle(kpis.isFluctuationPositive)
        : INSUFFICIENT_DATA_TREND_STYLE,
      isReady: Boolean(summaryData?.success) && !isLoading,
    };
  }, [isLoading, summaryData, filterValues]);
}
