import { useMemo } from 'react';
import { MBKM_TABLE_ONLY_FILTERS } from '@komet/shared/constants';
import { formatNumber, formatPercentage } from '@komet/shared/formatters';
import {
  formatFacultyLabel,
  formatList,
  formatProdiLabel,
  joinLabels,
} from '../../../utils/kpiLabels';

const EMPTY_CARDS = { participation: {}, total: {}, mitra: {}, jenis: {} };
const NO_ACTIVITY =
  'Belum ada mahasiswa dengan aktivitas MBKM Disetujui atau Selesai untuk filter ini.';

/** Nama jenis tanpa keterangan dalam kurung: "Magang/Praktik Kerja (Kampus Merdeka)" → "Magang/Praktik Kerja". */
export const shortJenis = (name = '') => String(name).replace(/\s*\([^)]*\)\s*$/, '');

/** "MBKM", atau nama jenis yang sedang difilter ("Magang/Praktik Kerja"). */
export const activityName = (jenis = []) => {
  const list = (Array.isArray(jenis) ? jenis : [jenis]).filter(Boolean).map(shortJenis);
  return list.length ? formatList(list) : 'MBKM';
};

/** Kalimat cakupan kartu dan popup: "Fakultas X, Tahun Ajaran 2025/2026. " */
export const scopeSentence = ({ faculty, prodi } = {}, periodLabel = '') => {
  const scope = joinLabels(formatFacultyLabel(faculty), formatProdiLabel(prodi), periodLabel);
  return scope ? `${scope}. ` : '';
};

const TABLE_ONLY_NAMES = { search: 'pencarian', statusAktivitas: 'status aktivitas' };
const hasValue = (value) =>
  Array.isArray(value) ? value.length > 0 : Boolean(String(value ?? '').trim());

/**
 * Klausa jujur untuk filter aktif yang tidak dibaca kartu (ADR 0007). `filters`
 * memakai nama param URL (`search`, `statusAktivitas`).
 */
export const tableOnlyClause = (filters = {}) => {
  const names = MBKM_TABLE_ONLY_FILTERS.filter((key) => hasValue(filters[key])).map(
    (key) => TABLE_ONLY_NAMES[key],
  );
  return names.length ? ` Filter ${formatList(names)} hanya menyaring tabel.` : '';
};

/** Jenis yang sedang difilter, disorot di kartu Bentuk Kegiatan yang menghitung semua jenis. */
const selectedJenisClause = (selected = []) => {
  if (!selected.length) return '';
  const items = selected.map(
    (item) =>
      `${shortJenis(item.name)} (${formatNumber(item.count)} mahasiswa, ${formatPercentage(item.percentage, 0)})`,
  );
  return ` Jenis dipilih: ${formatList(items)}.`;
};

export function participationSubtitle(card, activity = 'MBKM') {
  if (card.isEmpty) return 'Tidak ada mahasiswa aktif semester 7 untuk filter ini.';
  const pending = card.pending ? ` ${formatNumber(card.pending)} menunggu persetujuan.` : '';
  // Saat difilter jenis, sisanya belum mengikuti jenis itu, belum tentu belum MBKM sama sekali.
  const rest = activity === 'MBKM' ? 'belum berpartisipasi' : `belum mengikuti ${activity}`;
  return (
    `${formatNumber(card.participants)} dari ${formatNumber(card.eligible)} mahasiswa aktif semester 7 mengikuti ${activity}. ` +
    `${formatNumber(card.notParticipating)} ${rest}.${pending}`
  );
}

export function totalSubtitle(card) {
  if (card.isEmpty) return NO_ACTIVITY;
  return `Mahasiswa semua semester dengan aktivitas Disetujui atau Selesai; ${formatNumber(card.semester7)} di antaranya semester 7.`;
}

export function mitraSubtitle(card) {
  if (card.isEmpty || !card.value) return NO_ACTIVITY;
  const top = card.top
    ? ` Terbanyak: ${card.top.name} (${formatNumber(card.top.count)} mahasiswa).`
    : '';
  return `Mitra unik dari aktivitas ${formatNumber(card.withPartner)} mahasiswa.${top}`;
}

export function jenisSubtitle(card) {
  if (card.isEmpty) return NO_ACTIVITY;
  const [first, second] = card.top || [];
  if (!first) return NO_ACTIVITY;
  const next = second
    ? `, lalu ${shortJenis(second.name)} (${formatNumber(second.count)} mahasiswa)`
    : '';
  return `Terbanyak ${shortJenis(first.name)} (${formatNumber(first.count)} mahasiswa, ${formatPercentage(first.percentage, 0)})${next}.${selectedJenisClause(card.selected)}`;
}

/**
 * Teks kartu MBKM Data. Angka dan kosong atau tidaknya dari server
 * (`kpis.cards`); hook ini hanya menyusun kalimat. null = "-", 0 tetap angka.
 */
export function useMbkmKpiDisplay(summaryData, isLoading, filterValues = {}) {
  return useMemo(() => {
    const cards = summaryData?.kpis?.cards || EMPTY_CARDS;
    const filters = filterValues || {};
    const scope = scopeSentence(
      { faculty: filters.selectedFaculty, prodi: filters.selectedProdi },
      summaryData?.periodLabel || '',
    );
    const tableOnly = tableOnlyClause({
      search: filters.searchQuery,
      statusAktivitas: filters.selectedStatusAktivitas,
    });
    const jenisCount = cards.jenis.value;

    return {
      kpis: {
        participationRate: formatPercentage(cards.participation.value, 1),
        totalStudents: formatNumber(cards.total.value),
        totalMitra: formatNumber(cards.mitra.value),
        jenisCount:
          jenisCount === null || jenisCount === undefined
            ? '-'
            : `${formatNumber(jenisCount)} jenis`,
      },
      displaySubtitles: {
        participation: `${scope}${participationSubtitle(cards.participation, activityName(filters.selectedJenisAktivitas))}${tableOnly}`,
        total: `${scope}${totalSubtitle(cards.total)}${tableOnly}`,
        mitra: `${scope}${mitraSubtitle(cards.mitra)}${tableOnly}`,
        jenis: `${scope}${jenisSubtitle(cards.jenis)}${tableOnly}`,
      },
      isReady: Boolean(summaryData?.success) && !isLoading,
    };
  }, [filterValues, isLoading, summaryData]);
}
