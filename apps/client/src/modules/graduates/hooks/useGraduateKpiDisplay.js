import { useMemo } from 'react';
import { formatDecimal, formatNumber, formatPercentage } from '@komet/shared/formatters';
import { formatList } from '../../../utils/kpiLabels';
import { ignoredFiltersClause, scopeTexts } from '../utils/filterScope';

const SUCCESS_TAIL = 'Dinilai dari angkatan terbaru yang masa studi maksimumnya sudah habis.';
const EMPTY_SENTENCE = 'Tidak ada lulusan untuk kombinasi filter ini.';
const EMPTY_CARDS = { total: {}, gpa: {}, onTime: {}, studySuccess: {} };

const rate = (value) => formatPercentage(value, 1);
const gpa = (value) => formatDecimal(value, 2);

/** "Fakultas X: kalimat" — cakupan di depan kalimat bila ada. */
const withLabel = (label, sentence) => (label ? `${label}, ${sentence}` : sentence);

function totalSubtitle(card, scope) {
  if (card.isEmpty) return EMPTY_SENTENCE;
  const parts = (card.byJenjang || []).map(
    (entry) => `${formatNumber(entry.value)} lulusan ${entry.label}`,
  );
  const phrase = card.scope?.phrase ? ` ${card.scope.phrase}` : '';
  const detail = parts.length > 1 ? `. Terdiri dari ${formatList(parts)}` : '';
  return `Menampilkan ${formatNumber(card.value)} lulusan${scope.suffix}${phrase}${detail}.`;
}

function gpaSubtitle(card, scope) {
  if (card.isEmpty) return EMPTY_SENTENCE;
  const parts = (card.byJenjang || []).map((entry) => `${gpa(entry.value)} (${entry.label})`);
  const phrase = card.scope?.phrase ? ` ${card.scope.phrase}` : '';
  return `IPK rata-rata lulusan${scope.suffix} ${formatList(parts)} dari skala 4.00${phrase}.`;
}

function onTimeSubtitle(card, scope) {
  if (card.isEmpty) return EMPTY_SENTENCE;
  const entries = card.byJenjang || [];
  const phrase = card.scope?.phrase ? ` ${card.scope.phrase}` : '';
  const base = `${rate(card.value)} lulusan${scope.suffix} lulus tepat waktu${phrase}`;
  if (entries.length === 1) return `${base} (dari jenjang ${entries[0].label}).`;
  if (entries.length > 1) {
    return `${base}. Rincian: ${formatList(entries.map((e) => `${e.label} ${rate(e.value)}`))}.`;
  }
  return `${base}.`;
}

/** "Angkatan 2017/2018" atau gabungan "Angkatan 2016/2017 dan 2017/2018 (gabungan)". */
export function angkatanText(entry) {
  const list = entry?.angkatanList?.length ? entry.angkatanList : [entry?.angkatan].filter(Boolean);
  if (list.length > 1) return `Angkatan ${formatList(list)} (gabungan)`;
  return `Angkatan ${list[0] ?? '-'}`;
}

function studySuccessSubtitle(card, scope) {
  const entries = card.byJenjang || [];
  let sentence;
  if (!entries.length) {
    sentence = 'Belum ada angkatan yang masa studi maksimumnya sudah habis.';
  } else if (entries.length === 1) {
    const [entry] = entries;
    sentence = `${rate(entry.value)} mahasiswa ${angkatanText(entry)} (${entry.label}) lulus dalam masa studi maksimum. ${SUCCESS_TAIL}`;
  } else {
    const parts = entries.map((e) => `${e.label} ${rate(e.value)} (${angkatanText(e)})`);
    sentence = `Lulus dalam masa studi maksimum: ${formatList(parts)}. ${SUCCESS_TAIL}`;
  }
  const clause = ignoredFiltersClause(card.ignoredFilters);
  return withLabel(scope.label, clause ? `${sentence} ${clause}` : sentence);
}

/**
 * Teks kartu Graduate Data. Angka, urutan jenjang, label, nilai utama, dan
 * scope kosong semuanya dari server (`kpis.cards`); hook ini hanya menyusun
 * kalimat. null = belum ada data ("-"), 0 tetap angka.
 */
export function useGraduateKpiDisplay(summaryData, isLoading, filterValues = {}) {
  return useMemo(() => {
    const cards = summaryData?.kpis?.cards || EMPTY_CARDS;
    const scope = scopeTexts(filterValues);
    const cohortScope = scopeTexts(filterValues, { cohort: true });
    const withSearch = (sentence, texts = scope) => `${sentence}${texts.searchSuffix}`;

    return {
      kpis: {
        totalGraduates: formatNumber(cards.total.value),
        gpaDisplay: gpa(cards.gpa.value),
        onTimeDisplay: rate(cards.onTime.value),
        studySuccessDisplay: rate(cards.studySuccess.value),
      },
      cards,
      summary: summaryData?.summary || {},
      displaySubtitles: {
        total: withSearch(totalSubtitle(cards.total, scope)),
        totalScope: cards.total.scope?.label || 'Semua Tahun',
        gpa: withSearch(gpaSubtitle(cards.gpa, scope)),
        onTime: withSearch(onTimeSubtitle(cards.onTime, scope)),
        studySuccess: withSearch(
          studySuccessSubtitle(cards.studySuccess, cohortScope),
          cohortScope,
        ),
      },
      isReady: Boolean(summaryData?.success) && !isLoading,
    };
  }, [isLoading, summaryData, filterValues]);
}
