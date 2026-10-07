const crypto = require('crypto');
const { readSessionToken } = require('./studentSession');

/**
 * Menandai "siapa" yang mem-rate-limit. Token sesi yang lolos verifikasi signature
 * di-hash menjadi bucket sendiri, jadi satu pengguna tidak berbagi kuota dengan
 * semua orang di belakang NAT yang sama. Token palsu tidak pernah dapat bucket
 * sendiri (signature ditolak → fallback ke IP), sehingga rotating-cookie tidak
 * menjadi jalur pembobolan limiter.
 *
 * Hanya membaca cookie + HMAC lokal; tidak ada query Redis di sini, jadi aman
 * dijalankan sebelum limiter pada setiap request.
 */
function sessionIdentity(req, res, next) {
  const token = readSessionToken(req);
  if (token) {
    req.authSubject = `s:${crypto.createHash('sha256').update(token).digest('hex').slice(0, 32)}`;
  }
  next();
}

module.exports = { sessionIdentity };
