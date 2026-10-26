import { formatList } from '../../../utils/kpiLabels';

/**
 * Frasa cakupan filter untuk subtitle kartu dan banner modal tab Lulusan.
 * Satu pilihan = sebut namanya; lebih dari satu = "pada ... terpilih"
 * tanpa daftar nama supaya kalimat tidak melebar saat data baru masuk dari
 * sync SEVIMA. `label` untuk depan kalimat, `suffix` untuk tengah kalimat.
 * Kosong = tanpa cakupan (teks default). Semua bagian multi = satu frasa
 * gabungan ("pada fakultas dan prodi terpilih").
 */
const cleanList = (values) =>
  (Array.isArray(values) ? values : [values])
    .filter((item) => typeof item === 'string' && item.trim() !== '')
    .map((item) => item.trim());

const SCOPE_DEFS = [
  {
    key: 'faculty',
    name: 'fakultas',
    single: (value) => `Fakultas ${value}`,
    multi: 'pada fakultas terpilih',
  },
  {
    key: 'prodi',
    name: 'prodi',
    single: (value) => `Prodi ${value}`,
    multi: 'pada prodi terpilih',
  },
  {
    key: 'angkatan',
    name: 'angkatan',
    single: (value) => `Angkatan ${value}`,
    multi: 'pada angkatan terpilih',
  },
  {
    key: 'status',
    name: 'status kelulusan',
    single: (value) => `Status ${value}`,
    multi: 'pada status kelulusan terpilih',
  },
  {
    key: 'periode',
    name: 'periode lulus',
    single: (value) => `periode ${value}`,
    multi: 'pada periode lulus terpilih',
  },
];

/**
 * Kalimat pencarian bebas untuk akhir subtitle/banner. Dibatasi 30 karakter
 * supaya ketikan panjang tidak merusak kalimat.
 */
export function searchSentence(search = '', maxLength = 30) {
  const text = typeof search === 'string' ? search.trim() : '';
  if (!text) return '';
  const shown = text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  return `Hasil pencarian "${shown}".`;
}

const IGNORED_FILTER_NAMES = {
  tahunLulus: 'tahun lulus',
  periodeWisuda: 'periode lulus',
  predikat: 'status kelulusan',
};

/**
 * Klausa jujur kartu Keberhasilan Studi: filter event yang aktif tetapi tidak
 * mempersempit angka kohort. Daftarnya diputuskan server
 * (`cards.studySuccess.ignoredFilters`); di sini hanya tata bahasa.
 */
export function ignoredFiltersClause(ignored = []) {
  const names = (ignored || []).map((key) => IGNORED_FILTER_NAMES[key]).filter(Boolean);
  return names.length ? `Filter ${formatList(names)} tidak mengubah angka ini.` : '';
}

export function describeScope(selected = {}) {
  const active = SCOPE_DEFS.map((def) => ({ ...def, values: cleanList(selected[def.key]) })).filter(
    (def) => def.values.length > 0,
  );
  if (!active.length) return { label: '', suffix: '' };
  // Semua bagian multi = gabung nama kategorinya, bukan daftar nilainya.
  if (active.every((def) => def.values.length > 1)) {
    const joined = formatList(active.map((def) => def.name));
    return { label: `Pada ${joined} terpilih`, suffix: ` pada ${joined} terpilih` };
  }
  const parts = active.map((def) =>
    def.values.length === 1 ? def.single(def.values[0]) : def.multi,
  );
  const label = parts.join(', ');
  return { label: label.charAt(0).toUpperCase() + label.slice(1), suffix: ` ${parts.join(' ')}` };
}

/**
 * Frasa cakupan + pencarian untuk banner/subtitle dari nilai filter halaman.
 * `cohort` = Keberhasilan Studi: hanya fakultas/prodi. Angkatan sudah disebut
 * di kalimatnya sendiri, dan status/periode lulus bukan pembentuk kohort.
 */
export function scopeTexts(filters = {}, { cohort = false } = {}) {
  const scope = describeScope({
    faculty: filters.faculty ?? filters.selectedFaculty,
    prodi: filters.prodi ?? filters.selectedProdi,
    ...(cohort
      ? {}
      : {
          angkatan: filters.selectedAngkatan,
          status: filters.predikat ?? filters.selectedStatusKelulusan,
          periode: filters.periodeWisuda ?? filters.selectedPeriodeWisuda,
        }),
  });
  const search = searchSentence(filters.search ?? filters.searchQuery);
  return { ...scope, searchSuffix: search ? ` ${search}` : '' };
}
