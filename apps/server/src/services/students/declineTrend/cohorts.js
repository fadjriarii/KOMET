const { getAcademicYearStart } = require('../../../utils/academicUtils');
const { calculateChange, average, toPercentage } = require('./stats');

/** Cabang 1 angkatan: bandingkan dengan tahun sebelumnya. */
function declineForSingleCohort(targetYear, yearCounts) {
  const start = getAcademicYearStart(targetYear);
  const prevYear = start !== null ? `${start - 1}/${start}` : null;
  const currentTotal = yearCounts.get(targetYear)?.total ?? 0;
  const previousTotal = prevYear ? yearCounts.get(prevYear)?.total : undefined;
  const change = calculateChange(currentTotal, previousTotal);
  const usedChanges = change !== null ? [change] : [];

  return {
    selectedPeriod: targetYear,
    declinePercentage: average(usedChanges),
    comparisonsUsed: usedChanges.length,
    comparisonsTotal: 1,
    yearsCount: 1,
    history: [
      ...(prevYear
        ? [
            {
              label: 'A',
              academicYear: prevYear,
              intakeCount: previousTotal ?? 0,
              changeFromPrev: null,
            },
          ]
        : []),
      {
        label: prevYear ? 'B' : 'A',
        academicYear: targetYear,
        intakeCount: currentTotal,
        changeFromPrev: toPercentage(change),
      },
    ],
  };
}

/** Cabang N angkatan: rata-rata persentase perubahan tahun terpilih. */
function declineForMultiCohort(selectedCohortYears, yearCounts) {
  const sortedYears = [...selectedCohortYears]
    .filter((y) => getAcademicYearStart(y) !== null)
    .sort((a, b) => getAcademicYearStart(a) - getAcademicYearStart(b));

  const changes = sortedYears.map((academicYear) => {
    const start = getAcademicYearStart(academicYear);
    const prevYear = `${start - 1}/${start}`;
    const currentTotal = yearCounts.get(academicYear)?.total ?? 0;
    const previousTotal = yearCounts.get(prevYear)?.total;
    return calculateChange(currentTotal, previousTotal);
  });
  const usedChanges = changes.filter((change) => change !== null);

  return {
    selectedPeriod: sortedYears.join(', '),
    declinePercentage: average(usedChanges),
    comparisonsUsed: usedChanges.length,
    comparisonsTotal: sortedYears.length,
    yearsCount: sortedYears.length,
    history: sortedYears.map((academicYear, index) => {
      const start = getAcademicYearStart(academicYear);
      const prevYear = `${start - 1}/${start}`;
      const currentTotal = yearCounts.get(academicYear)?.total ?? 0;
      const previousTotal = yearCounts.get(prevYear)?.total;
      return {
        label: String.fromCharCode(65 + index),
        academicYear,
        intakeCount: currentTotal,
        changeFromPrev: toPercentage(calculateChange(currentTotal, previousTotal)),
      };
    }),
  };
}

module.exports = { declineForSingleCohort, declineForMultiCohort };
