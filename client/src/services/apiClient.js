/**
 * apiClient.js - Base client untuk request ke Backend API Komet
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const REQUEST_TIMEOUT_MS = 30000;
let sessionPromise;

async function ensureStudentSession() {
  if (!sessionPromise) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    sessionPromise = fetch(`${BASE_URL}/session/student`, {
      method: 'POST',
      credentials: 'include',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout)).catch((error) => {
      sessionPromise = undefined;
      if (error.name === 'AbortError') throw new Error('Backend session timeout.', { cause: error });
      throw error;
    });
  }
  const response = await sessionPromise;
  if (!response.ok) throw new Error('Student session gagal dibuat.');
}


export async function apiRequest(endpoint, options = {}) {
  if (!BASE_URL) throw new Error('VITE_API_BASE_URL belum dikonfigurasi.');
  await ensureStudentSession();
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Silakan coba lagi.', { cause: error });
    }
    throw error;
  }
}

export default {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};
