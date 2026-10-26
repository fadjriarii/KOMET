import { useMemo } from 'react';
import { formatDecimal, formatNumber, formatPercentage } from '@komet/shared/formatters';
import { getDemographicContextLabel } from '../../../utils/uiHelpers';
import { describeScope, searchSentence, studySuccessClause } from '../utils/filterScope';
import { jenjangName } from '../components/modals/totalTrendBars';

/**
 * Gabung rincian per jenjang tanpa bullet: dua bagian pakai "dan",
 * tiga atau lebih pakai koma Indonesia ("A, B, dan C").
 */
function joinParts(parts) {
  if (parts.length > 2) return `${parts.slice(0, -1).join(', ')}, dan ${parts[parts.length - 1]}`;
  return parts.join(' dan ');
}

/**
 * Cakupan fakultas di depan kalimat ("Fakultas X: ..." atau
 * "Pada fakultas terpilih: ..."). Tanpa cakupan, kalimat apa adanya.
 */
function withScope(sentence, scope) {
  if (!scope) return sentence;
  return `${scope.charAt(0).toUpperCase()}${scope.slice(1)}: ${sentence}`;
}

/**
 * Butir kohort per jenjang untuk subtitle Keberhasilan Studi. Satu pilihan
 * valid = jenjang itu saja; selain itu semua jenjang yang angkanya bisa
 * diceritakan (ada rate + label angkatan). Tanpa butir = fallback.
 * Satu butir = kalimat tunggal; lebih dari satu = rincian S1, S2, dst.
 * Ekor kalimat menjelaskan kenapa angkatannya paten: yang dinilai adalah
 * kohort terbaru yang masa studi maksimumnya sudah habis, jadi tidak
 * mengikuti filter tahun lulus.
 */
const SUCCESS_TAIL = 'Dinilai dari angkatan terbaru yang masa studi maksimumnya sudah habis.';

function findSuccessAngkatan(ks, rateKey) {
  const direct = `angkatan${rateKey}`;
  if (ks?.[direct] != null) return ks[direct];
  const found = Object.keys(ks ?? {}).find((key) => key.toLowerCase() === `angkatan${rateKey}`);
  return found ? ks[found] : null;
}

function buildSuccessItems(ks = {}, selectedJenjang = [], fallbackS1Rate = null) {
  const list = (Array.isArray(selectedJenjang) ? selectedJenjang : [selectedJenjang]).filter(
    (item) => typeof item === 'string' && item.trim() !== '',
  );
  const rateOf = (rateKey, fb = null) => ks?.[rateKey] ?? fb;
  if (list.length === 1) {
    const rateKey = list[0].toLowerCase();
    const angkatan = findSuccessAngkatan(ks, rateKey);
    if (ks?.[rateKey] != null && angkatan != null) {
      return [{ label: list[0].trim(), rate: ks[rateKey], angkatan }];
    }
    return [];
  }
  // Lebih dari satu jenjang dipilih: jangan menambahkan jenjang yang tidak
  // diminta. Tanpa pilihan (list kosong) = semua jenjang yang punya data.
  const requested = list.map((item) => item.trim().toLowerCase());
  const candidates = requested.length
    ? requested.map((key) => ({
        label: jenjangName(key),
        rate: rateOf(key, key === 's1' ? fallbackS1Rate : null),
        angkatan: findSuccessAngkatan(ks, key),
      }))
    : [
        {
          label: 'S1',
          rate: rateOf('s1', fallbackS1Rate),
          angkatan: findSuccessAngkatan(ks, 's1'),
        },
        { label: 'S2', rate: rateOf('s2'), angkatan: findSuccessAngkatan(ks, 's2') },
        ...Object.keys(ks ?? {})
          .filter(
            (key) =>
              key !== 's1' &&
              key !== 's2' &&
              !key.toLowerCase().startsWith('angkatan') &&
              ks[key] != null,
          )
          .sort()
          .map((key) => ({
            label: jenjangName(key),
            rate: ks[key],
            angkatan: findSuccessAngkatan(ks, key),
          })),
      ];
  // 0% adalah hasil ukur yang sah; hanya null (belum bisa dievaluasi) yang dibuang.
  return candidates.filter((item) => item.rate != null && item.angkatan);
}
function withRest(sentence, rest) {
  if (!rest) return sentence;
  return `${sentence} (${rest})`;
}

/**
 * Nilai utama kartu IPK/tepat waktu: S1 dulu; kalau scope tidak memuat S1
 * (mis. filter Profesi saja membuat S1 null), pakai jenjang lain yang ada
 * nilainya. 0 adalah nilai sah (mis. 0% tepat waktu), hanya null yang dilewati.
 */
function firstPresent(values) {
  return values.find((value) => value != null) ?? null;
}

export function useGraduateKpiDisplay(summaryData, isLoading, filterValues = {}) {
  return useMemo(() => {
    const kpis = summaryData?.kpis || {};
    const summary = summaryData?.summary || {};

    // Data kosong tampil sebagai 0, bukan "-" — keputusan tampilan tab ini.
    const s1Gpa = formatDecimal(kpis.averageGpaS1, 2, '0.00');
    const s2Gpa = formatDecimal(kpis.averageGpaS2, 2, '0.00');
    const byJenjang = kpis.totalGraduatesByJenjang || {};
    const extraJenjangs = Object.keys(byJenjang)
      .filter((key) => key !== 's1' && key !== 's2')
      .sort();
    const gpaByJenjang = kpis.averageGpaByJenjang || {};
    const extraGpaKeys = Object.keys(gpaByJenjang)
      .filter((key) => key !== 's1' && key !== 's2')
      .sort();
    const onTimeByJenjang = kpis.onTimeByJenjang || {};
    const extraOnTimeKeys = Object.keys(onTimeByJenjang)
      .filter((key) => key !== 's1' && key !== 's2')
      .sort();
    // Rincian bernilai 0 tidak ditampilkan, hanya yang ada nilainya.
    // Kalau semuanya 0, tampilkan satu fallback 0 supaya kalimat tidak kosong.
    const withFallback = (parts, fallback) => (parts.length ? parts : [fallback]);
    const extraParts = extraJenjangs
      .filter((key) => byJenjang[key])
      .map((key) => `${formatNumber(byJenjang[key])} lulusan ${jenjangName(key)}`);
    const extraOnTimeParts = extraOnTimeKeys
      .filter((key) => onTimeByJenjang[key] != null)
      .map((key) => `${jenjangName(key)}: ${formatPercentage(onTimeByJenjang[key], 1)}`);
    // Nilai kartu: S1, kalau kosong S2, kalau kosong jenjang lain yang ada.
    const mainGpaRaw = firstPresent([
      kpis.averageGpaS1,
      kpis.averageGpaS2,
      ...extraGpaKeys.map((key) => gpaByJenjang[key]),
    ]);
    const mainOnTimeRaw = firstPresent([
      kpis.onTimeGraduationRateOverall,
      kpis.onTimeGraduationRateS1,
      kpis.onTimeGraduationRateS2,
      ...extraOnTimeKeys.map((key) => onTimeByJenjang[key]),
    ]);
    const s1OnTime = formatPercentage(kpis.onTimeGraduationRateS1, 1, '0.0%');
    const s2OnTime = formatPercentage(kpis.onTimeGraduationRateS2, 1, '0.0%');
    const s1StudySuccess = formatPercentage(kpis.studySuccessRateS1, 1, '0.0%');

    const scope = describeScope({
      faculty: filterValues.selectedFaculty,
      prodi: filterValues.selectedProdi,
      angkatan: filterValues.selectedAngkatan,
      status: filterValues.selectedStatusKelulusan,
      periode: filterValues.selectedPeriodeWisuda,
    });
    // Keberhasilan studi hanya melihat kohort angkatan; status kelulusan dan
    // periode wisuda adalah filter kejadian, bukan pembentuk kohort.
    const successScope = describeScope({
      faculty: filterValues.selectedFaculty,
      prodi: filterValues.selectedProdi,
      angkatan: filterValues.selectedAngkatan,
    });
    // Pencarian bebas menempel di akhir setiap kalimat sebagai kalimat sendiri.
    const searchTail = searchSentence(filterValues.searchQuery);
    const withSearch = (sentence) => (searchTail ? `${sentence} ${searchTail}` : sentence);
    // Basis keberhasilan studi hanya menyebut S1, jadi jenjang tetap ikut
    // di belakang dalam kurung. Basis lain sudah menyebut jenjangnya sendiri.
    const jenjangContext = getDemographicContextLabel(filterValues.selectedJenjang);

    // Subtitle tiap kartu berupa kalimat penjelasan penuh: angka, penyebut,
    // cakupan filter, dan cara hitung — bukan sekadar label dan angka.
    const totalFormatted = formatNumber(kpis.totalGraduates ?? 0);
    const totalScopeLabel = kpis.totalScopeLabel || 'Semua Tahun';
    const totalTahun =
      kpis.totalScopePhrase ||
      (totalScopeLabel === 'Semua Tahun'
        ? 'di seluruh tahun akademik tercatat'
        : `pada tahun ajaran ${totalScopeLabel}`);
    const totalParts = [
      kpis.totalGraduatesS1 ? `${formatNumber(kpis.totalGraduatesS1)} lulusan S1` : null,
      kpis.totalGraduatesS2 ? `${formatNumber(kpis.totalGraduatesS2)} lulusan S2` : null,
      ...extraParts,
    ].filter(Boolean);
    const baseTotal =
      `Menampilkan ${totalFormatted} lulusan${scope.suffix} ${totalTahun}` +
      `${totalParts.length ? `. Terdiri dari ${joinParts(totalParts)}` : ''}.`;
    const gpaSegmen = [
      kpis.averageGpaS1 ? `${s1Gpa} (S1)` : null,
      kpis.averageGpaS2 ? `${s2Gpa} (S2)` : null,
      ...extraGpaKeys
        .filter((key) => gpaByJenjang[key])
        .map((key) => `${formatDecimal(gpaByJenjang[key], 2)} (${jenjangName(key)})`),
    ].filter(Boolean);
    const gpaScopePhrase = summary.avgIpk?.tahunScope?.phrase || '';
    const baseGpa = `IPK rata-rata lulusan${scope.suffix} ${joinParts(
      withFallback(gpaSegmen, `${s1Gpa} (S1) dan ${s2Gpa} (S2)`),
    )} dari skala 4.00${gpaScopePhrase ? ` ${gpaScopePhrase}` : ''}.`;
    const onTimeOverallFmt = formatPercentage(kpis.onTimeGraduationRateOverall, 1, '0.0%');
    const onTimeScopePhrase = summary.tepatWaktu?.tahunScope?.phrase || '';
    const onTimeScopeTail = onTimeScopePhrase ? ` ${onTimeScopePhrase}` : '';
    const onTimeBreakdown = [
      kpis.onTimeGraduationRateS1 != null ? { key: 'S1', text: `S1 ${s1OnTime}` } : null,
      kpis.onTimeGraduationRateS2 != null ? { key: 'S2', text: `S2 ${s2OnTime}` } : null,
      ...extraOnTimeKeys
        .filter((key) => onTimeByJenjang[key] != null)
        .map((key) => ({
          key: jenjangName(key),
          text: `${jenjangName(key)} ${formatPercentage(onTimeByJenjang[key], 1)}`,
        })),
    ].filter(Boolean);
    // Backend lama tanpa angka keseluruhan: format ringkas lama supaya tetap terbaca.
    const legacyOnTimeParts = [
      kpis.onTimeGraduationRateS1 != null ? `S1: ${s1OnTime}` : null,
      kpis.onTimeGraduationRateS2 != null ? `S2: ${s2OnTime}` : null,
      ...extraOnTimeParts,
    ].filter(Boolean);
    let baseOnTime;
    if (kpis.onTimeGraduationRateOverall == null) {
      baseOnTime = joinParts(
        withFallback(legacyOnTimeParts, `S1: ${s1OnTime} dan S2: ${s2OnTime}`),
      );
    } else if (onTimeBreakdown.length === 1) {
      baseOnTime =
        `${onTimeOverallFmt} lulusan${scope.suffix} lulus tepat waktu${onTimeScopeTail} ` +
        `(dari jenjang ${onTimeBreakdown[0].key}).`;
    } else if (onTimeBreakdown.length > 1) {
      baseOnTime =
        `${onTimeOverallFmt} lulusan${scope.suffix} lulus tepat waktu${onTimeScopeTail}. ` +
        `Rincian: ${joinParts(onTimeBreakdown.map((part) => part.text))}.`;
    } else {
      baseOnTime = `${onTimeOverallFmt} lulusan${scope.suffix} lulus tepat waktu${onTimeScopeTail}.`;
    }
    const successItems = buildSuccessItems(
      summary.keberhasilanStudi,
      filterValues.selectedJenjang,
      kpis.studySuccessRateS1,
    );
    const successValueRaw = successItems.length
      ? (successItems.find((item) => item.label === 'S1')?.rate ?? successItems[0].rate)
      : kpis.studySuccessRateS1;
    const successRateFmt = (rate) => formatPercentage(rate, 1, '0.0%');
    let baseStudySuccess;
    if (!successItems.length) {
      baseStudySuccess = withScope(
        withRest('Tingkat Kelulusan Akhir', jenjangContext),
        successScope.label,
      );
    } else if (successItems.length === 1) {
      const [item] = successItems;
      const sentence = `${successRateFmt(item.rate)} mahasiswa Angkatan ${item.angkatan} (${item.label}) lulus dalam masa studi maksimum. ${SUCCESS_TAIL}`;
      baseStudySuccess = successScope.label ? `${successScope.label}, ${sentence}` : sentence;
    } else {
      const parts = successItems.map(
        (item) => `${item.label} ${successRateFmt(item.rate)} (Angkatan ${item.angkatan})`,
      );
      const sentence = `Lulus dalam masa studi maksimum: ${joinParts(parts)}. ${SUCCESS_TAIL}`;
      baseStudySuccess = successScope.label ? `${successScope.label}, ${sentence}` : sentence;
    }
    const successClause = studySuccessClause({
      tahunLulus: filterValues.selectedTahunLulus,
      periodeWisuda: filterValues.selectedPeriodeWisuda,
      predikat: filterValues.selectedStatusKelulusan,
      defaultTahunLulus: summaryData?.filterOptions?.rollingYears?.[0] ?? '',
    });
    if (successClause) baseStudySuccess = `${baseStudySuccess} ${successClause}`;

    const subtitles = {
      // Card total: semua filter relevan
      total: withSearch(baseTotal),
      totalScope: kpis.totalScopeLabel || 'Semua Tahun',
      // Card gpa: semua filter relevan
      gpa: withSearch(baseGpa),
      // Card onTime: semua filter relevan
      onTime: withSearch(baseOnTime),
      // Card studySuccess: tahunLulus/periodeWisuda/predikat TIDAK relevan (COHORT scope)
      studySuccess: withSearch(baseStudySuccess),
    };

    return {
      kpis: {
        totalGraduates: formatNumber(kpis.totalGraduates ?? 0),
        averageGpaS1: s1Gpa,
        averageGpaS2: s2Gpa,
        gpaDisplay: formatDecimal(mainGpaRaw, 2, '0.00'),
        onTimeGraduationRateS1: s1OnTime,
        onTimeGraduationRateS2: s2OnTime,
        onTimeGraduationRateOverall: formatPercentage(kpis.onTimeGraduationRateOverall, 1, '0.0%'),
        onTimeDisplay: formatPercentage(mainOnTimeRaw, 1, '0.0%'),
        studySuccessRateS1: s1StudySuccess,
        studySuccessDisplay: formatPercentage(successValueRaw, 1, '0.0%'),
      },
      summary,
      displaySubtitles: subtitles,
      isReady: Boolean(summaryData?.success) && !isLoading,
    };
  }, [isLoading, summaryData, filterValues]);
}
