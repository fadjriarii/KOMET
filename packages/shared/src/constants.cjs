/**
 * @komet/shared - Shared constants (CJS).
 */

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const ACADEMIC_YEAR_ROLLOVER_MONTH = 9;

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

const STUDENT_STATUS = {
  AKTIF: 'Aktif',
  CUTI: 'Cuti',
  LULUS: 'Lulus',
  DROP_OUT: 'Drop Out / Dikeluarkan',
  ALL: '__ALL__',
};

module.exports = {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  ACADEMIC_YEAR_ROLLOVER_MONTH,
  HTTP_STATUS,
  STUDENT_STATUS,
};
