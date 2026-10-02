/**
 * apiClient.js - Base client untuk request ke Backend API Komet
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const REQUEST_TIMEOUT_MS = 30000;
const SESSION_RENEWAL_BUFFER_MS = 10 * 60 * 1000;
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;
let sessionPromise;
let sessionExpiresAt = 0;
const TECHNICAL_ERROR_PATTERN = /(prisma|sql|constraint|column|table|stack|\bat\s+\w+\s*\()/i;

export function normalizeApiError(data, status) {
  if (status >= 500) return 'Terjadi kesalahan server. Silakan coba lagi.';
  const message = typeof data?.message === 'string' ? data.message.trim() : '';
  if (message && !TECHNICAL_ERROR_PATTERN.test(message)) return message;
  if (status === 401 || status === 403) return 'Sesi Anda telah berakhir. Silakan muat ulang halaman.';
  if (status === 404) return 'Data yang diminta tidak ditemukan.';
  return 'Permintaan tidak dapat diproses. Periksa masukan Anda dan coba lagi.';
}

async function ensureStudentSession() {
  // Renew shortly before the server-side cookie expires. This also means a
  // dashboard that stays open all day does not start failing its chart calls
  // with an expired session.
  if (!sessionPromise || (sessionExpiresAt > 0 && Date.now() >= sessionExpiresAt - SESSION_RENEWAL_BUFFER_MS)) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
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
        if (error.name === 'AbortError') throw new Error('Backend session timeout.', { cause: error });
        throw error;
      });
  }
  await sessionPromise;
}

function clearStudentSession() {
  sessionPromise = undefined;
  sessionExpiresAt = 0;
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
    await ensureStudentSession();
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
        clearStudentSession();
        continue;
      }
      if (!response.ok) throw new Error(normalizeApiError(data, response.status));
      return data;
    } catch (error) {
      if (timeout) clearTimeout(timeout);
      if (error.name !== 'AbortError') console.error(`[API Error] ${endpoint}:`, error);
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
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};
