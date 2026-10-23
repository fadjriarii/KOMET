import { useMemo } from 'react';
import { formatNumber, formatPercentage } from '@komet/shared/formatters';

/** Sama dengan `MBKM_ACTIVE_STATUSES` di server; status lain di luar populasi peserta. */
const ACTIVE_STATUSES = new Set(['Disetujui', 'Selesai', 'Diajukan']);
const SEARCH_LIMIT = 24;

const toList = (value) =>
  (Array.isArray(value) ? value : value ? [value] : [])
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => item.trim());

const scopeLabel = (values, prefix) => {
  const list = toList(values);
  if (!list.length) return '';
  return list.length === 1 ? `${prefix} ${list[0]}` : `${prefix} terpilih`;
};

const joinWithAnd = (items) =>
  items.length <= 1 ? items[0] || '' : `${items.slice(0, -1).join(', ')} dan ${items.at(-1)}`;

const periodYear = (code) => {
  const year = Number(String(code).slice(0, 4));
  return Number.isFinite(year) && year > 0 ? `${year}/${year + 1}` : '';
};

const singlePeriodLabel = (code, options) => {
  const option = options.find((item) => item.value === code);
  return [option?.label || code, periodYear(code)].filter(Boolean).join(' ');
};

const buildPeriodLabel = (periods, options) => {
  if (!periods.length) return '';
  if (periods.length === 1) return singlePeriodLabel(periods[0], options);

  const firstYear = periodYear(periods[0]);
  if (firstYear && firstYear === periodYear(periods.at(-1))) {
    return `Tahun Ajaran ${firstYear}`;
  }
  return periods.map((code) => singlePeriodLabel(code, options)).join('–');
};

export function useMbkmKpiDisplay(summaryData, isLoading, filterValues = {}) {
  return useMemo(() => {
    const kpis = summaryData?.kpis || {};
    const filters = filterValues || {};
    const periods = Array.isArray(summaryData?.selectedPeriods) ? summaryData.selectedPeriods : [];
    const periodeOptions = summaryData?.filterOptions?.periodeOptions || [];
    const periodLabel = buildPeriodLabel(periods, periodeOptions);

    const searchTerm = typeof filters.searchQuery === 'string' ? filters.searchQuery.trim() : '';
    const searchLabel = searchTerm
      ? `pencarian "${
          searchTerm.length > SEARCH_LIMIT ? `${searchTerm.slice(0, SEARCH_LIMIT)}...` : searchTerm
        }"`
      : '';

    const statuses = toList(filters.selectedStatusAktivitas);
    const inactiveStatuses = statuses.filter((status) => !ACTIVE_STATUSES.has(status));
    const statusNote = inactiveStatuses.length
      ? `${inactiveStatuses.join('/')} tidak dihitung sebagai peserta`
      : '';

    const populationScope = [
      scopeLabel(filters.selectedFaculty, 'Fakultas'),
      scopeLabel(filters.selectedProdi, 'Prodi'),
    ].filter(Boolean);

    const participantScope = [
      ...populationScope,
      scopeLabel(statuses, 'Status'),
      scopeLabel(filters.selectedJenisAktivitas, 'Jenis Aktivitas'),
    ].filter(Boolean);

    const ignoredFilters = [
      searchTerm ? 'pencarian' : '',
      statuses.length ? 'status aktivitas' : '',
      toList(filters.selectedJenisAktivitas).length ? 'jenis aktivitas' : '',
    ].filter(Boolean);
    const ignoredNote = ignoredFilters.length
      ? `${joinWithAnd(ignoredFilters)} tidak mengubah angka ini`
      : '';

    const rateNumerator = [
      searchLabel,
      statuses.length ? `Status ${statuses.join('/')}` : '',
      scopeLabel(filters.selectedJenisAktivitas, 'Jenis Aktivitas'),
    ].filter(Boolean);
    const rateNumeratorNote = rateNumerator.length ? ` (${rateNumerator.join(', ')})` : '';

    const participants = [
      'Mahasiswa semester 7 dengan aktivitas MBKM aktif',
      ...participantScope,
      periodLabel,
      searchLabel,
      statusNote,
    ]
      .filter(Boolean)
      .join(' · ');

    const eligible = [
      'Mahasiswa aktif pada semester 7',
      ...populationScope,
      periodLabel,
      ignoredNote,
    ]
      .filter(Boolean)
      .join(' · ');

    const rate = [
      `${formatNumber(kpis.totalParticipants)} peserta${rateNumeratorNote} dari ${formatNumber(
        kpis.eligibleCount,
      )} mahasiswa eligible`,
      ...populationScope,
      periodLabel,
      statusNote,
    ]
      .filter(Boolean)
      .join(' · ');

    const hasNonPeriodFilters = Boolean(
      searchTerm ||
      toList(filters.selectedFaculty).length ||
      toList(filters.selectedProdi).length ||
      toList(filters.selectedJenisAktivitas).length ||
      statuses.length,
    );
    const mitra = [
      'Mitra unik dari seluruh aktivitas periode ini',
      periodLabel,
      hasNonPeriodFilters ? 'tidak terpengaruh filter lain' : '',
    ]
      .filter(Boolean)
      .join(' · ');

    // `null` dari server = tidak ada penyebut; biarkan formatter menampilkan "-".
    const participationRate = formatPercentage(kpis.participationRate, 1);

    return {
      kpis: {
        participationRate,
        totalParticipants: formatNumber(kpis.totalParticipants),
        eligibleCount: formatNumber(kpis.eligibleCount),
        totalMitra: formatNumber(kpis.totalMitra),
      },
      displaySubtitles: { rate, participants, eligible, mitra },
      isReady: Boolean(summaryData?.success) && !isLoading,
    };
  }, [filterValues, isLoading, summaryData]);
}
