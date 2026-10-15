/**
 * kpiSubtitles.js — peramu subtitle 4 kartu KPI dari label filter + angka server.
 * Fungsi murni (teks dipin test `kpiDisplayHooks`); hook hanya menyiapkan inputnya.
 */

/** Card Active: "Total Mahasiswa {status} {demografi}" */
export function buildActiveSubtitle(baseSubtitle, cardTitleFragment, demographicLabel) {
  return demographicLabel
    ? `Total Mahasiswa ${cardTitleFragment} ${demographicLabel}`
    : baseSubtitle;
}

/** Card Foreign: "{n} Mahasiswa International {status}, pada {demografi}" */
export function buildForeignSubtitle(baseSubtitle, foreignCount, statusLabel, demographicLabel) {
  return demographicLabel
    ? `${foreignCount} Mahasiswa International ${statusLabel}, pada ${demographicLabel}`
    : baseSubtitle;
}

/**
 * Card Intake. Semester menang atas angkatan (backend sudah mengiris keduanya
 * bila aktif bersamaan). nonCohortLocation = fakultas + prodi + jenjang (tanpa
 * angkatan & semester); angkatanLabel ditambahkan bila ikut aktif.
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
    const periode = intakeSemesterTerm || 'Ganjil';
    const tahun = intakePeriod || currentTahunAjaran;
    return intakeLocation
      ? `Menjadi Mahasiswa baru Pada periode ${periode} Pada Tahun Ajaran ${tahun}, pada ${intakeLocation}`
      : `Menjadi Mahasiswa baru Pada periode ${periode} Pada Tahun Ajaran ${tahun}`;
  }
  if (selectedSemesters.length > 1) {
    return intakeLocation
      ? `Menjadi Mahasiswa baru pada Semester Terpilih, pada ${intakeLocation}`
      : 'Menjadi Mahasiswa baru pada Semester Terpilih';
  }
  if (selectedYears.length === 1) {
    return nonCohortLocation
      ? `Semester 1, Periode Ganjil Tahun Ajaran ${selectedYears[0]}, pada ${nonCohortLocation}`
      : `Semester 1, Periode Ganjil Tahun Ajaran ${selectedYears[0]}`;
  }
  if (selectedYears.length > 1) {
    return nonCohortLocation
      ? `Semester 1, pada Angkatan Terpilih, ${nonCohortLocation}`
      : 'Semester 1, pada Angkatan Terpilih';
  }
  const intakeYear = intakePeriod || currentTahunAjaran || '';
  if (nonCohortLocation) {
    return intakeYear
      ? `Semester 1, Periode Ganjil Tahun Ajaran ${intakeYear}, pada ${nonCohortLocation}`
      : `Semester 1, pada ${nonCohortLocation}`;
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
      declineTitle: 'Penurunan Mhs Baru (1 Thn)',
      declineBadge: hasEnoughDeclineData ? '1-Year Comp' : 'Data Belum Cukup',
      declineSubtitle: declineDemographicLabel
        ? `Perbandingan dengan tahun sebelumnya, Pada ${declineDemographicLabel}`
        : `Perbandingan dengan tahun sebelumnya pada ${selectedYears[0]}`,
    };
  }
  if (selectedYears.length > 1) {
    return {
      declineTitle: `Penurunan Mhs Baru (${selectedYears.length} Thn)`,
      declineBadge: hasEnoughDeclineData ? `${selectedYears.length}-Year Avg` : 'Data Belum Cukup',
      declineSubtitle: declineDemographicLabel
        ? `Rata-rata Penurunan Mahasiswa Baru dalam ${selectedYears.length} Tahun, Pada ${declineDemographicLabel}`
        : `Rata-rata Penurunan Mahasiswa Baru dalam ${selectedYears.length} Tahun, Pada Angkatan Terpilih`,
    };
  }
  return {
    declineTitle: 'Penurunan Mhs Baru (5 Thn)',
    declineBadge: hasEnoughDeclineData ? '5-Year Avg' : 'Data Belum Cukup',
    declineSubtitle: nonCohortLocation
      ? `Rata-rata Penurunan Mahasiswa Baru dalam 5 Tahun, Pada ${nonCohortLocation}`
      : baseSubtitle,
  };
}
