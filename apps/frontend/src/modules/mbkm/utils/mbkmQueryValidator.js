const MAX_SEARCH_LENGTH = 100;

export function sanitizeSearchInput(value) {
  if (typeof value !== 'string') return '';
  return value
    .split('')
    .filter((character) => character >= ' ' && character !== '\u007F')
    .join('')
    .trim()
    .substring(0, MAX_SEARCH_LENGTH);
}

export function validateMbkmQueryParams(params = {}) {
  const sanitized = {};

  if (params.search) {
    sanitized.search = sanitizeSearchInput(params.search);
  }

  if (Array.isArray(params.faculty) && params.faculty.length > 0) {
    sanitized.faculty = params.faculty.filter(Boolean);
  } else if (typeof params.faculty === 'string' && params.faculty.trim()) {
    sanitized.faculty = [params.faculty.trim()];
  }

  if (Array.isArray(params.prodi) && params.prodi.length > 0) {
    sanitized.prodi = params.prodi.filter(Boolean);
  } else if (typeof params.prodi === 'string' && params.prodi.trim()) {
    sanitized.prodi = [params.prodi.trim()];
  }

  if (Array.isArray(params.jenjang) && params.jenjang.length > 0) {
    sanitized.jenjang = params.jenjang.filter(Boolean);
  } else if (typeof params.jenjang === 'string' && params.jenjang.trim()) {
    sanitized.jenjang = [params.jenjang.trim()];
  }

  if (Array.isArray(params.angkatan) && params.angkatan.length > 0) {
    sanitized.angkatan = params.angkatan.filter(Boolean);
  } else if (typeof params.angkatan === 'string' && params.angkatan.trim()) {
    sanitized.angkatan = [params.angkatan.trim()];
  }

  if (Array.isArray(params.statusAktivitas) && params.statusAktivitas.length > 0) {
    sanitized.statusAktivitas = params.statusAktivitas.filter(Boolean);
  } else if (typeof params.statusAktivitas === 'string' && params.statusAktivitas.trim()) {
    sanitized.statusAktivitas = [params.statusAktivitas.trim()];
  }

  if (typeof params.periode === 'string' && params.periode.trim()) {
    sanitized.periode = params.periode.trim();
  }

  return { sanitized };
}
