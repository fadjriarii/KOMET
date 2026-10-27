import { useMemo } from 'react';
import { formatNumber, formatPercentage } from '@komet/shared/formatters';
import {
  formatFacultyLabel,
  formatList,
  formatProdiLabel,
  joinLabels,
} from '../../../utils/kpiLabels';

const EMPTY_CARDS = { rate: {}, participants: {}, eligible: {}, mitra: {} };
const NO_ELIGIBLE = 'Tidak ada mahasiswa eligible semester 7 untuk kombinasi filter ini.';

/** Nama filter untuk kalimat "Filter ... tidak mengubah angka ini"; daftarnya dari server. */
const IGNORED_FILTER_NAMES = {
  search: 'pencarian',
  jenisAktivitas: 'jenis aktivitas',
  statusAktivitas: 'status aktivitas',
};

export function ignoredFiltersClause(ignored = []) {
  const names = (ignored || []).map((key) => IGNORED_FILTER_NAMES[key]).filter(Boolean);
  return names.length ? `Filter ${formatList(names)} tidak mengubah angka ini.` : '';
}

/** Kalimat cakupan: "Fakultas X, Tahun Ajaran 2025/2026. " */
const scopeSentence = (filters, periodLabel) => {
  const scope = joinLabels(
    formatFacultyLabel(filters.selectedFaculty),
    formatProdiLabel(filters.selectedProdi),
    periodLabel,
  );
  return scope ? `${scope}. ` : '';
};

const withClause = (sentence, card) =>
  [sentence, ignoredFiltersClause(card.ignoredFilters)].filter(Boolean).join(' ');

export function rateSubtitle(card) {
  if (card.isEmpty) return NO_ELIGIBLE;
  return withClause(
    `${formatNumber(card.participants)} dari ${formatNumber(card.eligible)} mahasiswa eligible berpartisipasi.`,
    card,
  );
}

export function participantsSubtitle(card) {
  if (card.isEmpty) return NO_ELIGIBLE;
  const parts = (card.byStatus || []).map((entry) => `${entry.label} ${formatNumber(entry.value)}`);
  const pending = card.pending ? `${formatNumber(card.pending)} menunggu persetujuan` : '';
  const detail = formatList([...parts, pending]);
  return withClause(detail ? `${detail}.` : 'Belum ada partisipan.', card);
}

export function eligibleSubtitle(card) {
  if (card.isEmpty) return NO_ELIGIBLE;
  return withClause(
    `Mahasiswa aktif semester 7. ${formatNumber(card.notParticipating)} belum berpartisipasi.`,
    card,
  );
}

export function mitraSubtitle(card) {
  if (card.isEmpty) return NO_ELIGIBLE;
  if (!card.value)
    return withClause('Belum ada mitra dari aktivitas Disetujui atau Selesai.', card);
  const top = card.top
    ? ` Terbanyak: ${card.top.name} (${formatNumber(card.top.count)} partisipan).`
    : '';
  return withClause(
    `Mitra unik dari aktivitas ${formatNumber(card.withPartner)} partisipan.${top}`,
    card,
  );
}

/**
 * Teks kartu MBKM Data. Angka, rincian, kosong atau tidak, dan filter yang
 * tidak mengubah angka semuanya dari server (`kpis.cards`); hook ini hanya
 * menyusun kalimat. null = belum ada data ("-"), 0 tetap angka.
 */
export function useMbkmKpiDisplay(summaryData, isLoading, filterValues = {}) {
  return useMemo(() => {
    const cards = summaryData?.kpis?.cards || EMPTY_CARDS;
    const scope = scopeSentence(filterValues || {}, summaryData?.periodLabel || '');

    return {
      kpis: {
        participationRate: formatPercentage(cards.rate.value, 1),
        totalParticipants: formatNumber(cards.participants.value),
        eligibleCount: formatNumber(cards.eligible.value),
        totalMitra: formatNumber(cards.mitra.value),
      },
      displaySubtitles: {
        rate: `${scope}${rateSubtitle(cards.rate)}`,
        participants: `${scope}${participantsSubtitle(cards.participants)}`,
        eligible: `${scope}${eligibleSubtitle(cards.eligible)}`,
        mitra: `${scope}${mitraSubtitle(cards.mitra)}`,
      },
      isReady: Boolean(summaryData?.success) && !isLoading,
    };
  }, [filterValues, isLoading, summaryData]);
}
