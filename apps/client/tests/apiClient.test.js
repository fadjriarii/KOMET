import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The response contract only runs in DEV; this test is about session handling.
vi.mock('@komet/shared/contracts', () => ({
  contractFor: () => null,
  contractProblems: () => [],
}));

let sessionCalls = 0;
let dataCalls = 0;

const response = (status, body = null) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const fetchMock = vi.fn(async (url, options = {}) => {
  if (options.method === 'POST' && url.endsWith('/session/student')) {
    sessionCalls += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return response(204);
  }
  dataCalls += 1;
  return response(200, { success: true });
});

beforeEach(() => {
  sessionCalls = 0;
  dataCalls = 0;
  vi.resetModules();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('apiClient session', () => {
  it('mint satu sesi untuk query paralel, bukan satu per request', async () => {
    const { apiRequest } = await import('../src/services/apiClient.js');

    await Promise.all([apiRequest('/one'), apiRequest('/two'), apiRequest('/three')]);

    expect(sessionCalls).toBe(1);
    expect(dataCalls).toBe(3);
  });
});
