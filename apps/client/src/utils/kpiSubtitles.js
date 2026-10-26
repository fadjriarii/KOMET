/**
 * kpiSubtitles.js — peramu subtitle 4 kartu KPI dari label filter + angka server.
 * Fungsi murni (teks dipin test `kpiDisplayHooks`); hook hanya menyiapkan inputnya.
 * Aturan jujur: periode/rumus hanya disebut bila datanya ada dari server.
 */

/** Card Active: "Total Mahasiswa {status} {demografi}" */
export function buildActiveSubtitle(baseSubtitle, cardTitleFragment, demographicLabel) {
  return demographicLabel
    ? `Total Mahasiswa ${cardTitleFragment} ${demographicLabel}`
    : baseSubtitle;
}

/** Card Foreign: "{n} Mahasiswa Internasional {status}, pada {demografi}" */
export function buildForeignSubtitle(baseSubtitle, foreignCount, statusLabel, demographicLabel) {
  return demographicLabel
    ? `${foreignCount} Mahasiswa Internasional ${statusLabel}, pada ${demographicLabel}`
    : baseSubtitle;
}

/**
 * Card Intake. Semester menang atas angkatan (backend sudah mengiris keduanya
 * bila aktif bersamaan). Klausa periode hanya tampil bila backend mengirim
 * jenis semesternya; angkatan tidak mengklaim periode (cohort mencakup
 * Ganjil+Genap).
 */
export function buildIntakeSubtitle({
  baseSubtitle,
  selectedSemesters,
  selectedYears,
  nonCohortLocation,
  intakeLocation,
  intakePeriod,
  intakeSemesterTerm,
  currentTahunAjaran,
}) {
  if (selectedSemesters.length === 1) {
    const tahun = intakePeriod || currentTahunAjaran;
    const periode = intakeSemesterTerm
      ? ` pada periode ${intakeSemesterTerm} pada Tahun Ajaran ${tahun}`
      : ` pada Tahun Ajaran ${tahun}`;
    return intakeLocation
      ? `Menjadi mahasiswa baru${periode}, pada ${intakeLocation}`
      : `Menjadi mahasiswa baru${periode}`;
  }
  if (selectedSemesters.length > 1) {
    return intakeLocation
      ? `Menjadi mahasiswa baru pada Semester Terpilih, pada ${intakeLocation}`
      : 'Menjadi mahasiswa baru pada Semester Terpilih';
  }
  if (selectedYears.length === 1) {
    return nonCohortLocation
      ? `Semester 1 Tahun Ajaran ${selectedYears[0]}, pada ${nonCohortLocation}`
      : `Semester 1 Tahun Ajaran ${selectedYears[0]}`;
  }
  if (selectedYears.length > 1) {
    return nonCohortLocation
      ? `Semester 1, pada Angkatan Terpilih, ${nonCohortLocation}`
      : 'Semester 1, pada Angkatan Terpilih';
  }
  const intakeYear = intakePeriod || currentTahunAjaran || '';
  if (nonCohortLocation) {
    return intakeYear
      ? `Semester 1 Tahun Ajaran ${intakeYear}, pada ${nonCohortLocation}`
      : `Semester 1 pada ${nonCohortLocation}`;
  }
  return baseSubtitle;
}

/** Card Decline (kebal dari filter semester). Mengembalikan title/badge/subtitle. */
export function buildDeclineDisplay({
  baseSubtitle,
  selectedYears,
  declineDemographicLabel,
  nonCohortLocation,
  hasEnoughDeclineData,
}) {
  if (selectedYears.length === 1) {
    return {
      declineTitle: 'Trend Intake Mahasiswa Baru (over a 1-year period)',
      declineBadge: hasEnoughDeclineData ? '1-Year Comp' : 'Data Belum Cukup',
      declineSubtitle: declineDemographicLabel
        ? `Perbandingan dengan tahun sebelumnya, pada ${declineDemographicLabel}`
        : `Perbandingan dengan tahun sebelumnya pada ${selectedYears[0]}`,
    };
  }
  if (selectedYears.length > 1) {
    return {
      declineTitle: `Trend Intake Mahasiswa Baru (over a ${selectedYears.length}-year period)`,
      declineBadge: hasEnoughDeclineData ? `${selectedYears.length}-Year Avg` : 'Data Belum Cukup',
      declineSubtitle: declineDemographicLabel
        ? `Rata-rata Penurunan Mahasiswa Baru dalam ${selectedYears.length} Tahun, pada ${declineDemographicLabel}`
        : `Rata-rata Penurunan Mahasiswa Baru dalam ${selectedYears.length} Tahun, pada Angkatan Terpilih`,
    };
  }
  return {
    declineTitle: 'Trend Intake Mahasiswa Baru (over a 5-year period)',
    declineBadge: hasEnoughDeclineData ? '5-Year Avg' : 'Data Belum Cukup',
    declineSubtitle: nonCohortLocation
      ? `Rata-rata Penurunan Mahasiswa Baru dalam 5 Tahun, pada ${nonCohortLocation}`
      : baseSubtitle,
  };
}
