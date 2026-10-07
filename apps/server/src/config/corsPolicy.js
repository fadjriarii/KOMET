/**
 * corsPolicy.js
 *
 * Satu sumber kebenaran untuk origin yang dipercaya. Dipakai middleware CORS dan
 * penerbitan sesi, supaya kebijakan "siapa yang boleh memanggil API ini" tidak
 * punya dua salinan yang bisa berbeda.
 */

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:3001'];

function allowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS;
  const list = raw
    ? raw
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : DEFAULT_ALLOWED_ORIGINS;
  return new Set(list);
}

function originHost(origin) {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

/**
 * Origin diterima bila terdaftar di ALLOWED_ORIGINS, atau sama dengan host yang
 * melayani request (SPA yang di-serve dari origin yang sama dengan API).
 * Request tanpa header Origin (curl, health-check, server-to-server) dianggap non-browser.
 */
function isAllowedOrigin(origin, requestHost) {
  if (!origin) return true;
  if (allowedOrigins().has(origin)) return true;
  const host = originHost(origin);
  return Boolean(host && requestHost && host === requestHost);
}

module.exports = { allowedOrigins, isAllowedOrigin, DEFAULT_ALLOWED_ORIGINS };
