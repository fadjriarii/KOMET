import { useMemo } from 'react';
import { getStudentKpiSubtitles, getStudentStatusPresentation } from '../../../utils/uiHelpers';
import { formatNumber, formatPercentage, formatSignedPercentage } from '@komet/shared/formatters';
import { getTrendStyle } from '../../../utils/theme';

const listFormatter = new Intl.ListFormat('id', { style: 'long', type: 'conjunction' });

/**
 * Format daftar fakultas dengan tata bahasa Indonesia:
 * 1: "Fakultas FST"
 * 2: "Fakultas FST dan FK"
 * 3: "Fakultas FST, FK, dan FEB"
 * >3: "Fakultas Terpilih"
 */
function formatFacultyLabel(faculties = []) {
  const list = (Array.isArray(faculties) ? faculties : [faculties]).filter(
    (item) => typeof item === 'string' && item.trim() !== '',
  );
  if (!list.length) return '';
  if (list.length > 3) return 'Fakultas Terpilih';
  const joined = listFormatter.format(list);
  return joined.startsWith('Fakultas ') ? joined : `Fakultas ${joined}`;
}

/**
 * Format daftar prodi:
 * 1: "Prodi Informatika"
 * 2: "Prodi Informatika dan Sistem Informasi"
 * 3: "Prodi Informatika, Sistem Informasi, dan Teknik Komputer"
 * >3: "Prodi Terpilih"
 */
function formatProdiLabel(prodis = []) {
  const list = (Array.isArray(prodis) ? prodis : [prodis]).filter(
    (item) => typeof item === 'string' && item.trim() !== '',
  );
  if (!list.length) return '';
  if (list.length > 3) return 'Prodi Terpilih';
  return `Prodi ${listFormatter.format(list)}`;
}

/**
 * Format daftar jenjang:
 * 1: "Jenjang S1"
 * 2: "Jenjang S1 dan S2"
 * 3: "Jenjang D3, S1, dan S2"
 * >3: "Jenjang Terpilih"
 */
function formatJenjangLabel(jenjangs = []) {
  const list = (Array.isArray(jenjangs) ? jenjangs : [jenjangs]).filter(
    (item) => typeof item === 'string' && item.trim() !== '',
  );
  if (!list.length) return '';
  if (list.length > 3) return 'Jenjang Terpilih';
  return `Jenjang ${listFormatter.format(list)}`;
}

/**
 * Format daftar angkatan:
 * 1: "Angkatan 2021/2022"
 * >1: "Angkatan Terpilih"
 */
function formatAngkatanLabel(years = []) {
  const list = (Array.isArray(years) ? years : [years]).filter(
    (item) => typeof item === 'string' && item.trim() !== '',
  );
  if (!list.length) return '';
  if (list.length > 1) return 'Angkatan Terpilih';
  return `Angkatan ${list[0]}`;
}

/**
 * Format daftar semester:
 * 1: "Semester 5"
 * >1: "Semester Terpilih"
 */
function formatSemesterLabel(semesters = []) {
  const list = (Array.isArray(semesters) ? semesters : [semesters]).filter(
    (item) => item !== '' && item !== null && item !== undefined,
  );
  if (!list.length) return '';
  if (list.length > 1) return 'Semester Terpilih';
  return `Semester ${list[0]}`;
}

/** Gabung label seluruh filter demografis aktif (termasuk semester untuk card Active & Foreign). */
function buildDemographicLabel(filterValues = {}) {
  const parts = [
    formatFacultyLabel(filterValues.selectedFaculty),
    formatProdiLabel(filterValues.selectedProdi),
    formatJenjangLabel(filterValues.selectedJenjang),
    formatAngkatanLabel(filterValues.selectedYears),
    formatSemesterLabel(filterValues.selectedSemester),
  ].filter(Boolean);
  return parts.join(', ');
}

/** Gabung label demografis yang membatasi tren penurunan (Card Decline kebal semester). */
function buildDeclineDemographicLabel(filterValues = {}) {
  const parts = [
    formatFacultyLabel(filterValues.selectedFaculty),
    formatProdiLabel(filterValues.selectedProdi),
    formatJenjangLabel(filterValues.selectedJenjang),
    formatAngkatanLabel(filterValues.selectedYears),
  ].filter(Boolean);
  return parts.join(', ');
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
        ? formatSignedPercentage(rawKpis.declinePercentage)
        : '-',
    };
    const activeStudentPresentation = getStudentStatusPresentation(rawKpis.activeStudentStatus);
    const hasEnoughDeclineData = kpis.hasEnoughDeclineData !== false;
    const baseSubtitles = getStudentKpiSubtitles(kpis, activeStudentPresentation.statusLabel);
    if (!hasEnoughDeclineData) {
      baseSubtitles.declineSubtitle = 'Data historis belum cukup untuk perbandingan';
    }

    const selectedYears = (
      Array.isArray(filterValues.selectedYears)
        ? filterValues.selectedYears
        : [filterValues.selectedYears]
    ).filter((item) => typeof item === 'string' && item.trim() !== '');

    const selectedSemesters = (
      Array.isArray(filterValues.selectedSemester)
        ? filterValues.selectedSemester
        : [filterValues.selectedSemester]
    ).filter((item) => item !== '' && item !== null && item !== undefined);

    const demographicLabel = buildDemographicLabel(filterValues);
    const declineDemographicLabel = buildDeclineDemographicLabel(filterValues);

    // Filter lokasi selain angkatan dan semester (fakultas, prodi, jenjang)
    const nonCohortLocationParts = [
      formatFacultyLabel(filterValues.selectedFaculty),
      formatProdiLabel(filterValues.selectedProdi),
      formatJenjangLabel(filterValues.selectedJenjang),
    ].filter(Boolean);
    const nonCohortLocation = nonCohortLocationParts.join(', ');

    // 1. Card Active: "Total Mahasiswa {Status} {Demografi}"
    const activeSubtitle = demographicLabel
      ? `Total Mahasiswa ${activeStudentPresentation.cardTitle.replace('Mahasiswa ', '')} ${demographicLabel}`
      : baseSubtitles.activeSubtitle;

    // 2. Card Foreign: "{total} Mahasiswa International {status}, pada {Demografi}"
    const foreignCount = formatNumber(kpis.foreignStudentsCount ?? 0);
    const foreignSubtitle = demographicLabel
      ? `${foreignCount} Mahasiswa International ${activeStudentPresentation.statusLabel}, pada ${demographicLabel}`
      : baseSubtitles.foreignSubtitle;

    // 3. Card Intake:
    // Semester menang atas angkatan (backend sudah mengiris keduanya bila aktif bersamaan).
    // nonCohortLocation = fakultas + prodi + jenjang (tanpa angkatan & semester).
    // angkatanLabel ditambahkan bila angkatan aktif bersamaan dengan semester.
    let intakeSubtitle;
    const currentTahunAjaran =
      filterValues.selectedTahunAjaran || filterValues.tahunAjaran || kpis.intakePeriod || '';
    const angkatanLabel = formatAngkatanLabel(filterValues.selectedYears);
    const intakeLocationParts = [nonCohortLocation, angkatanLabel].filter(Boolean);
    const intakeLocation = intakeLocationParts.join(', ');

    if (selectedSemesters.length === 1) {
      const periode = kpis.intakeSemesterTerm || 'Ganjil';
      const tahun = kpis.intakePeriod || currentTahunAjaran;
      intakeSubtitle = intakeLocation
        ? `Menjadi Mahasiswa baru Pada periode ${periode} Pada Tahun Ajaran ${tahun}, pada ${intakeLocation}`
        : `Menjadi Mahasiswa baru Pada periode ${periode} Pada Tahun Ajaran ${tahun}`;
    } else if (selectedSemesters.length > 1) {
      intakeSubtitle = intakeLocation
        ? `Menjadi Mahasiswa baru pada Semester Terpilih, pada ${intakeLocation}`
        : 'Menjadi Mahasiswa baru pada Semester Terpilih';
    } else if (selectedYears.length === 1) {
      intakeSubtitle = nonCohortLocation
        ? `Semester 1, Periode Ganjil Tahun Ajaran ${selectedYears[0]}, pada ${nonCohortLocation}`
        : `Semester 1, Periode Ganjil Tahun Ajaran ${selectedYears[0]}`;
    } else if (selectedYears.length > 1) {
      intakeSubtitle = nonCohortLocation
        ? `Semester 1, pada Angkatan Terpilih, ${nonCohortLocation}`
        : 'Semester 1, pada Angkatan Terpilih';
    } else {
      const intakeYear = kpis.intakePeriod || currentTahunAjaran || '';
      intakeSubtitle = nonCohortLocation
        ? intakeYear
          ? `Semester 1, Periode Ganjil Tahun Ajaran ${intakeYear}, pada ${nonCohortLocation}`
          : `Semester 1, pada ${nonCohortLocation}`
        : baseSubtitles.intakeSubtitle;
    }

    // 4. Card Decline (kebal dari filter semester):
    let declineTitle = 'Penurunan Mhs Baru (5 Thn)';
    let declineBadge = hasEnoughDeclineData ? '5-Year Avg' : 'Data Belum Cukup';
    let declineSubtitle;

    if (selectedYears.length === 1) {
      declineTitle = 'Penurunan Mhs Baru (1 Thn)';
      declineBadge = hasEnoughDeclineData ? '1-Year Comp' : 'Data Belum Cukup';
      declineSubtitle = declineDemographicLabel
        ? `Perbandingan dengan tahun sebelumnya, Pada ${declineDemographicLabel}`
        : `Perbandingan dengan tahun sebelumnya pada ${selectedYears[0]}`;
    } else if (selectedYears.length > 1) {
      declineTitle = `Penurunan Mhs Baru (${selectedYears.length} Thn)`;
      declineBadge = hasEnoughDeclineData ? `${selectedYears.length}-Year Avg` : 'Data Belum Cukup';
      declineSubtitle = declineDemographicLabel
        ? `Rata-rata Penurunan Mahasiswa Baru dalam ${selectedYears.length} Tahun, Pada ${declineDemographicLabel}`
        : `Rata-rata Penurunan Mahasiswa Baru dalam ${selectedYears.length} Tahun, Pada Angkatan Terpilih`;
    } else {
      declineSubtitle = nonCohortLocation
        ? `Rata-rata Penurunan Mahasiswa Baru dalam 5 Tahun, Pada ${nonCohortLocation}`
        : baseSubtitles.declineSubtitle;
    }

    const displaySubtitles = {
      activeSubtitle,
      foreignSubtitle,
      intakeSubtitle,
      declineSubtitle,
    };

    const displayTitles = {
      declineTitle,
    };

    const displayBadges = {
      declineBadge,
    };

    return {
      kpis,
      activeStudentPresentation,
      displaySubtitles,
      displayTitles,
      displayBadges,
      declineTrendStyle: hasEnoughDeclineData
        ? getTrendStyle(kpis.isFluctuationPositive)
        : { textClass: 'text-gray-500', label: 'Data belum cukup' },
      isReady: Boolean(summaryData?.success) && !isLoading,
    };
  }, [isLoading, summaryData, filterValues]);
}
