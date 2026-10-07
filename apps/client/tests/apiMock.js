import { vi } from 'vitest';

/**
 * Tiruan `services/apiClient`: hanya `get` dan `post` yang dipakai dashboard dan
 * panel sinkronisasi. Test memakai `respondWith` untuk menentukan isi respons
 * berdasar URL, sehingga service, perakit query, dan hook query yang asli tetap
 * ikut teruji.
 */
const state = { respond: () => ({ success: true }) };

export const calls = [];

const call = (url) => {
  calls.push(url);
  return Promise.resolve(state.respond(url) ?? { success: true });
};

export const get = vi.fn(call);
export const post = vi.fn(call);

export function respondWith(respond) {
  state.respond = respond;
}

export function resetApi() {
  calls.length = 0;
  get.mockClear();
  state.respond = () => ({ success: true });
}

export function callsFor(path) {
  return calls.filter((url) => url.split('?')[0] === path);
}

export function lastQuery(path) {
  return new URLSearchParams((callsFor(path).at(-1) || '').split('?')[1] || '');
}

export const isRetryableError = () => false;

export default { get, post, put: vi.fn(), delete: vi.fn() };
