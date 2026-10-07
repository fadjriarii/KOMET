import { vi } from 'vitest';

/**
 * Tiruan `services/apiClient`: test menentukan isi respons berdasar URL + method,
 * sehingga service, perakit query, dan hook query yang asli tetap ikut teruji.
 * `calls` berisi URL GET (dipakai pemeriksa query), `writes` berisi permintaan
 * method yang mengubah keadaan beserta body-nya.
 */
const state = { respond: () => ({ success: true }) };

export const calls = [];
export const writes = [];

export const get = vi.fn((url) => {
  calls.push(url);
  return Promise.resolve(state.respond(url, { method: 'GET' }) ?? { success: true });
});

function answer(method, url, body) {
  writes.push({ method, url, body });
  return Promise.resolve(state.respond(url, { method, body }) ?? { success: true });
}

export const post = vi.fn((url, body) => answer('POST', url, body));
export const put = vi.fn((url, body) => answer('PUT', url, body));
export const del = vi.fn((url) => answer('DELETE', url));

export function respondWith(respond) {
  state.respond = respond;
}

export function resetApi() {
  calls.length = 0;
  writes.length = 0;
  get.mockClear();
  post.mockClear();
  put.mockClear();
  del.mockClear();
  state.respond = () => ({ success: true });
}

export function callsFor(path) {
  return calls.filter((url) => url.split('?')[0] === path);
}

export function writesFor(path) {
  return writes.filter((write) => write.url.split('?')[0] === path);
}

export function lastQuery(path) {
  return new URLSearchParams((callsFor(path).at(-1) || '').split('?')[1] || '');
}

export const isRetryableError = () => false;

export default { get, post, put, delete: del, isRetryableError };
