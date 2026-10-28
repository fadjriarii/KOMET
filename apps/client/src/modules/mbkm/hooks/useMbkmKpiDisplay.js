import { useMemo } from 'react';
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

/** Kalimat cakupan: "Fakultas X, Tahun Ajaran 2025/2026. " */
const scopeSentence = (filters, periodLabel) => {
  const scope = joinLabels(
    formatFacultyLabel(filters.selectedFaculty),
    formatProdiLabel(filters.selectedProdi),
    periodLabel,
  );
  return scope ? `${scope}. ` : '';
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
  return `Terbanyak ${shortJenis(first.name)} (${formatNumber(first.count)} mahasiswa, ${formatPercentage(first.percentage, 0)})${next}.`;
}

/**
 * Teks kartu MBKM Data. Angka dan kosong atau tidaknya dari server
 * (`kpis.cards`); hook ini hanya menyusun kalimat. null = "-", 0 tetap angka.
 */
export function useMbkmKpiDisplay(summaryData, isLoading, filterValues = {}) {
  return useMemo(() => {
    const cards = summaryData?.kpis?.cards || EMPTY_CARDS;
    const filters = filterValues || {};
    const scope = scopeSentence(filters, summaryData?.periodLabel || '');
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
        participation: `${scope}${participationSubtitle(cards.participation, activityName(filters.selectedJenisAktivitas))}`,
        total: `${scope}${totalSubtitle(cards.total)}`,
        mitra: `${scope}${mitraSubtitle(cards.mitra)}`,
        jenis: `${scope}${jenisSubtitle(cards.jenis)}`,
      },
      isReady: Boolean(summaryData?.success) && !isLoading,
    };
  }, [filterValues, isLoading, summaryData]);
}
