const MAX_SEARCH_LENGTH = 100;

export function sanitizeSearchInput(value) {
  if (typeof value !== 'string') return '';
  return value
    .split('').filter((character) => character >= ' ' && character !== '\u007F').join('')
    .trim()
    .substring(0, MAX_SEARCH_LENGTH);
}

export function validateGraduateQueryParams(params = {}) {
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

  if (Array.isArray(params.tahunLulus) && params.tahunLulus.length > 0) {
    sanitized.tahunLulus = params.tahunLulus.filter(Boolean);
  } else if (typeof params.tahunLulus === 'string' && params.tahunLulus.trim()) {
    sanitized.tahunLulus = [params.tahunLulus.trim()];
  }

  if (Array.isArray(params.periodeWisuda) && params.periodeWisuda.length > 0) {
    sanitized.periodeWisuda = params.periodeWisuda.filter(Boolean);
  } else if (typeof params.periodeWisuda === 'string' && params.periodeWisuda.trim()) {
    sanitized.periodeWisuda = [params.periodeWisuda.trim()];
  }

  if (Array.isArray(params.statusKelulusan) && params.statusKelulusan.length > 0) {
    sanitized.statusKelulusan = params.statusKelulusan.filter(Boolean);
  } else if (typeof params.statusKelulusan === 'string' && params.statusKelulusan.trim()) {
    sanitized.statusKelulusan = [params.statusKelulusan.trim()];
  }

  if (typeof params.periodeMasuk === 'string' && params.periodeMasuk.trim()) {
    sanitized.periodeMasuk = params.periodeMasuk.trim();
  }

  return { sanitized };
}
