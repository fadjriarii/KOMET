/**
 * @komet/shared - Shared constants used across frontend and backend.
 */

/** Default pagination values */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Academic year rollover month (September = month 9, getMonth() returns 8) */
export const ACADEMIC_YEAR_ROLLOVER_MONTH = 9;

/** HTTP status codes used across the app */
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

/** Student status values */
export const STUDENT_STATUS = {
  AKTIF: 'Aktif',
  CUTI: 'Cuti',
  LULUS: 'Lulus',
  DROP_OUT: 'Drop Out / Dikeluarkan',
  ALL: '__ALL__',
};
