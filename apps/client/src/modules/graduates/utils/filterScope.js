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

/**
 * Klausa jujur kartu Keberhasilan Studi: filter tahun lulus, periode lulus,
 * dan status kelulusan tidak mempersempit angka kohort ini (penyebutnya
 * angkatan masuk, bukan peristiwa lulus). Hanya disebut yang aktif:
 * tahun lulus aktif bila beda dari default (tahun terbaru), sisanya bila isi.
 * Tanpa filter aktif = tanpa klausa.
 */
export function studySuccessClause({
  tahunLulus = [],
  periodeWisuda = '',
  predikat = [],
  defaultTahunLulus = '',
} = {}) {
  const names = [];
  const years = cleanList(tahunLulus);
  if (years.length && !(years.length === 1 && years[0] === defaultTahunLulus)) {
    names.push('tahun lulus');
  }
  if (typeof periodeWisuda === 'string' && periodeWisuda.trim() !== '') {
    names.push('periode lulus');
  }
  if (cleanList(predikat).length) names.push('status kelulusan');
  if (!names.length) return '';
  const joined =
    names.length > 2
      ? `${names.slice(0, -1).join(', ')}, dan ${names[names.length - 1]}`
      : names.join(' dan ');
  return `Filter ${joined} tidak mengubah angka ini.`;
}

export function describeScope(selected = {}) {
  const active = SCOPE_DEFS.map((def) => ({ ...def, values: cleanList(selected[def.key]) })).filter(
    (def) => def.values.length > 0,
  );
  if (!active.length) return { label: '', suffix: '' };
  // Semua bagian multi = gabung nama kategorinya, bukan daftar nilainya.
  if (active.every((def) => def.values.length > 1)) {
    const names = active.map((def) => def.name);
    const joined =
      names.length > 2
        ? `${names.slice(0, -1).join(', ')}, dan ${names[names.length - 1]}`
        : names.join(' dan ');
    return { label: `Pada ${joined} terpilih`, suffix: ` pada ${joined} terpilih` };
  }
  const parts = active.map((def) =>
    def.values.length === 1 ? def.single(def.values[0]) : def.multi,
  );
  const label = parts.join(', ');
  return { label: label.charAt(0).toUpperCase() + label.slice(1), suffix: ` ${parts.join(' ')}` };
}
