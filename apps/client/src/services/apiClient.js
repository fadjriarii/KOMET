/**
 * apiClient.js - Base client untuk request ke Backend API Komet
 */
import { env } from '../config/envValidator.js';
import { contractFor, contractProblems } from '@komet/shared/contracts';
import { CLIENT_REQUEST_TIMEOUT_MS, SESSION_MAX_AGE_SECONDS } from '@komet/shared/constants';

const BASE_URL = env.VITE_API_BASE_URL;
const REQUEST_TIMEOUT_MS = CLIENT_REQUEST_TIMEOUT_MS;
const SESSION_RENEWAL_BUFFER_MS = 10 * 60 * 1000;
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;
// Jarak minimum antar-mint ulang sesi: puluhan query yang 401 serentak cukup satu mint.
const SESSION_REMINT_COOLDOWN_MS = 2000;

let sessionPromise;
let sessionExpiresAt = 0;
let sessionMintedAt = 0;

export function normalizeApiError(data, status) {
  // Redaksi pesan adalah tanggung jawab server (allowlist di `errorCatalog.js`).
  // Client tidak memelihara salinan kebijakan redaksi yang harus berubah bersamaan.
  const message = typeof data?.message === 'string' ? data.message.trim() : '';
  if (status === 401 || status === 403)
    return 'Sesi Anda telah berakhir. Silakan muat ulang halaman.';
  if (status === 404) return 'Data yang diminta tidak ditemukan.';
  if (status >= 500) return 'Terjadi kesalahan server. Silakan coba lagi.';
  return message || 'Permintaan tidak dapat diproses. Periksa masukan Anda dan coba lagi.';
}

function apiError(data, status) {
  const error = new Error(normalizeApiError(data, status));
  error.status = status;
  error.code = data?.code;
  return error;
}

/**
 * Mana yang layak diulang dan mana yang tidak: 4xx hasil keputusan server
 * (validasi, sesi, akses) tidak sembuh karena diulang — itu hanya memperbesar
 * beban saat dashboard sedang bermasalah.
 */
export function isRetryableError(error) {
  if (error?.retryable === false) return false;
  const status = error?.status;
  if (typeof status !== 'number') return true;
  return status >= 500 || status === 429;
}

function mintStudentSession() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  sessionMintedAt = Date.now();
  // BASE_URL sudah mengandung /api (e.g. http://localhost:3000/api),
  // jadi jangan tambahkan /api lagi agar tidak menjadi /api/api/session/student
  sessionPromise = fetch(`${BASE_URL}/session/student`, {
    method: 'POST',
    credentials: 'include',
    signal: controller.signal,
  })
    .finally(() => clearTimeout(timeout))
    .then((response) => {
      if (!response.ok) throw new Error('Student session gagal dibuat.');
      sessionExpiresAt = Date.now() + SESSION_MAX_AGE_MS;
      return response;
    })
    .catch((error) => {
      sessionPromise = undefined;
      sessionExpiresAt = 0;
      if (error.name === 'AbortError')
        throw new Error('Backend session timeout.', { cause: error });
      throw error;
    });
  return sessionPromise;
}

async function ensureStudentSession({ force = false } = {}) {
  const now = Date.now();
  // Renew shortly before the server-side cookie expires, so a dashboard that
  // stays open all day does not start failing its chart calls.
  if (sessionPromise && now < sessionExpiresAt - SESSION_RENEWAL_BUFFER_MS) return sessionPromise;
  // Permintaan pasca-401: mint yang baru dimulai (mungkin milik request lain) sudah
  // cukup untuk kita juga, jadi tidak ada amplifikasi mint saat sesi mati mendadak.
  if (force && sessionPromise && now - sessionMintedAt < SESSION_REMINT_COOLDOWN_MS)
    return sessionPromise;
  return mintStudentSession();
}

export async function apiRequest(endpoint, options = {}) {
  if (!BASE_URL) throw new Error('VITE_API_BASE_URL belum dikonfigurasi.');
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // A server restart clears the local development session store. Retry a
  // single request with a fresh cookie so charts recover without a reload.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await ensureStudentSession({ force: attempt > 0 });
    const controller = options.signal ? null : new AbortController();
    const timeout = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
        signal: options.signal || controller?.signal,
      });
      if (timeout) clearTimeout(timeout);

      const data = await response.json().catch(() => null);
      if (response.status === 401 && attempt === 0 && !options.signal?.aborted) {
        continue;
      }
      if (!response.ok) throw apiError(data, response.status);
      if (import.meta.env.DEV) {
        // Bentuk respons divalidasi terhadap kontrak yang sama dipakai server untuk
        // memeriksa dirinya sendiri; kolom yang berganti nama terlihat saat ditulis.
        const problems = contractProblems(contractFor(endpoint), data);
        if (problems.length) {
          const error = new Error(`Kontrak respons ${endpoint} dilanggar: ${problems.join('; ')}`);
          error.retryable = false;
          throw error;
        }
      }
      return data;
    } catch (error) {
      if (timeout) clearTimeout(timeout);
      if (error.name === 'AbortError') {
        // A caller-provided signal is normally TanStack Query cancelling stale
        // work; preserve it rather than presenting it as a user-facing timeout.
        if (options.signal?.aborted) throw error;
        throw new Error('Request timeout. Silakan coba lagi.', { cause: error });
      }
      throw error;
    }
  }

  throw new Error('Sesi Anda telah berakhir. Silakan muat ulang halaman.');
}

export default {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) =>
    apiRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options) =>
    apiRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};
