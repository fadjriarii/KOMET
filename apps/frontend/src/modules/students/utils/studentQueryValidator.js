/**
 * Student Query Validator - Client-side validation & sanitization
 *
 * Mirrors the backend Zod schema in server/src/middlewares/validator.js.
 * This ensures invalid or malicious query parameters are caught on the
 * client BEFORE they hit the network, providing fail-fast UX and
 * defense-in-depth security.
 */

const MAX_SEARCH_LENGTH = 100;
const MAX_ARRAY_ITEMS = 50;
const ACADEMIC_YEAR_REGEX = /^\d{4}\/\d{4}$/;

/**
 * Sanitize a search string: trim, strip control characters, enforce max length.
 */
export function sanitizeSearch(value) {
  if (typeof value !== 'string') return '';
  return value
    .split('')
    .filter((character) => character >= ' ' && character !== '\u007F')
    .join('')
    .trim()
    .substring(0, MAX_SEARCH_LENGTH);
}

/**
 * Sanitize a single string value: trim and enforce max length.
 */
function sanitizeString(value, maxLength = 255) {
  if (typeof value !== 'string') return '';
  return value.trim().substring(0, maxLength);
}

/**
 * Normalize an array or single value into a sanitized array of strings.
 */
function sanitizeStringArray(value, maxLength = 255) {
  const rawArray = Array.isArray(value)
    ? value
    : value === undefined || value === null
      ? []
      : [value];
  return rawArray
    .filter((item) => typeof item === 'string' && item.trim())
    .map((item) => sanitizeString(item, maxLength))
    .filter(Boolean)
    .slice(0, MAX_ARRAY_ITEMS);
}

/**
 * Validate an academic year string in "YYYY/YYYY" format.
 */
function isValidAcademicYear(value) {
  if (typeof value !== 'string' || !value) return true; // optional
  if (!ACADEMIC_YEAR_REGEX.test(value)) return false;
  const [start, end] = value.split('/').map(Number);
  return end === start + 1;
}

/**
 * Main validator: sanitize + validate student filter params.
 * Returns { valid: boolean, sanitized: object, errors: string[] }
 */
export function validateStudentQueryParams(filters = {}) {
  const errors = [];
  const sanitized = {};

  // Search: sanitize and truncate
  if (filters.search !== undefined && filters.search !== null) {
    sanitized.search = sanitizeSearch(filters.search);
  }

  // Multi-select arrays - include empty arrays as valid (means "no filter" for this field)
  const arrayFields = ['faculty', 'prodi', 'jenjang', 'selectedYears', 'semester', 'status'];
  arrayFields.forEach((field) => {
    if (filters[field] !== undefined && filters[field] !== null) {
      sanitized[field] = sanitizeStringArray(filters[field]);
    } else {
      // Set to empty array if explicitly cleared, so we can distinguish between
      // "not set" and "explicitly all (empty array means no filter)"
      sanitized[field] = [];
    }
  });

  // Single values
  if (filters.nationality !== undefined && filters.nationality !== null) {
    const nationality = sanitizeString(filters.nationality, 20);
    if (nationality && !['WNI', 'WNA'].includes(nationality)) {
      errors.push(`nationality: must be one of WNI, WNA`);
    } else {
      sanitized.nationality = nationality;
    }
  }

  if (filters.periode !== undefined && filters.periode !== null) {
    const periode = sanitizeString(filters.periode, 20);
    if (periode && !['Ganjil', 'Genap'].includes(periode)) {
      errors.push(`periode: must be one of Ganjil, Genap`);
    } else {
      sanitized.periode = periode;
    }
  }

  // Academic year fields
  ['tahunAjaran', 'selectedPeriode'].forEach((field) => {
    if (filters[field] !== undefined && filters[field] !== null) {
      const value = sanitizeString(filters[field], 20);
      if (value && !isValidAcademicYear(value)) {
        errors.push(`${field}: must be in YYYY/YYYY format`);
      } else {
        sanitized[field] = value;
      }
    }
  });

  return { valid: errors.length === 0, sanitized, errors };
}

export default { validateStudentQueryParams, sanitizeSearch };
