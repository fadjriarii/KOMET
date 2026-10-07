const crypto = require('crypto');
const { isAllowedOrigin } = require('../config/corsPolicy');
const { sendRejected } = require('../utils/errorHandler');
const { createSession, hasSession, revokeSession } = require('../services/sessionStore');
const {
  HTTP_STATUS,
  SESSION_MAX_AGE_SECONDS: MAX_AGE_SECONDS,
} = require('@komet/shared/constants');

const COOKIE_NAME = 'komet_student_session';

function getSecret() {
  // Session cookies and the sync API key are separate credentials. Reusing
  // the latter would allow a sync credential to access student-data routes.
  return process.env.SESSION_SECRET;
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function createSessionToken() {
  const payload = `${Date.now()}.${crypto.randomBytes(24).toString('base64url')}`;
  return `${payload}.${sign(payload)}`;
}

function hasValidSignature(token) {
  if (!token || !getSecret()) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || Date.now() - Number(parts[0]) > MAX_AGE_SECONDS * 1000) return false;
  const expected = sign(`${parts[0]}.${parts[1]}`);
  const actualBuffer = Buffer.from(parts[2]);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header.split(';').map((item) => {
      const [name, ...rest] = item.trim().split('=');
      return [name, rest.join('=')];
    }),
  );
}

function setSessionCookie(res, token, maxAge = MAX_AGE_SECONDS) {
  const sameSiteMode = process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax';
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; SameSite=${sameSiteMode}; Path=/api; Max-Age=${maxAge}${secureFlag}`,
  );
}

async function issueStudentSession(req, res, next) {
  if (!getSecret()) {
    return sendRejected(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Student session is not configured.',
    );
  }
  // Browser dari origin lain tidak boleh mencetak sesi. CORS middleware sudah
  // menolak lebih awal, tapi gerbang ini menegakkannya di route-nya langsung.
  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin, req.headers.host)) {
    return sendRejected(res, HTTP_STATUS.FORBIDDEN, 'Origin tidak diizinkan untuk meminta sesi.');
  }
  try {
    res.setHeader('Cache-Control', 'no-store');
    const token = createSessionToken();
    await createSession(token, MAX_AGE_SECONDS);
    setSessionCookie(res, token);
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    return next(error);
  }
}

async function revokeStudentSession(req, res, next) {
  try {
    const token = parseCookies(req.headers.cookie || '')[COOKIE_NAME];
    if (token) await revokeSession(token);
    res.setHeader('Cache-Control', 'no-store');
    setSessionCookie(res, '', 0);
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    return next(error);
  }
}

/**
 * Token hanya diterima bila signature-nya sah; hasilnya disimpan di req supaya
 * pemanggil berikutnya (auth, rate-limit bucket) tidak parse cookie dua kali.
 */
function readSessionToken(req) {
  if (req.sessionToken !== undefined) return req.sessionToken;
  const token = parseCookies(req.headers.cookie || '')[COOKIE_NAME];
  req.sessionToken = token && hasValidSignature(token) ? token : null;
  return req.sessionToken;
}

async function hasValidSession(req) {
  const token = readSessionToken(req);
  return Boolean(token && (await hasSession(token)));
}

/**
 * Route data mahasiswa hanya menerima sesi siswa. SYNC_API_KEY sengaja tidak lagi
 * menjadi fallback: credential ETL tidak punya hak baca dataset mahasiswa.
 */
async function studentSessionAuth(req, res, next) {
  if (await hasValidSession(req)) return next();
  return sendRejected(res, HTTP_STATUS.UNAUTHORIZED, 'Student session is required.');
}

module.exports = {
  issueStudentSession,
  revokeStudentSession,
  studentSessionAuth,
  hasValidSession,
  readSessionToken,
  parseCookies,
  hasValidSignature,
  COOKIE_NAME,
  MAX_AGE_SECONDS,
};
