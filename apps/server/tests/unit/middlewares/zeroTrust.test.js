import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

process.env.SESSION_SECRET ||= 'zero-trust-test-secret';
process.env.SYNC_API_KEY ||= 'zero-trust-sync-key';
// PrismaClient butuh datasource URL saat konstruksi; test ini tidak pernah mengirim
// query karena setiap request data harus ditolak sebelum sampai ke controller.
process.env.DATABASE_URL ||= 'mysql://test:test@127.0.0.1:3306/komet_test';

const express = require('express');
const {
  issueStudentSession,
  studentSessionAuth,
} = require('../../../src/middlewares/studentSession');
const { sessionIdentity } = require('../../../src/middlewares/sessionIdentity');
const { sessionIssueLimiter } = require('../../../src/middlewares/rateLimiter');

const PROTECTED_ROUTERS = [
  ['/api/students', '../../../src/routes/studentsRoutes'],
  ['/api/graduates', '../../../src/routes/graduatesRoutes'],
  ['/api/mbkm', '../../../src/routes/mbkmRoutes'],
];

let server;
let baseUrl;

beforeAll(async () => {
  const app = express();
  app.use(sessionIdentity);
  app.post('/api/session/student', sessionIssueLimiter, issueStudentSession);
  for (const [prefix, modulePath] of PROTECTED_ROUTERS) {
    app.use(prefix, require(modulePath));
  }
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => {
  server?.close();
});

async function issueSessionCookie() {
  const response = await fetch(`${baseUrl}/api/session/student`, { method: 'POST' });
  expect(response.status).toBe(204);
  const raw = response.headers.get('set-cookie') || '';
  return raw.split(';')[0];
}

describe('zero-trust: route data mahasiswa butuh sesi yang sah', () => {
  it.each(PROTECTED_ROUTERS)(
    '%s memasang studentSessionAuth sebelum route mana pun',
    (prefix, modulePath) => {
      const stack = require(modulePath).stack;
      const guardIndex = stack.findIndex((layer) => layer.handle?.name === studentSessionAuth.name);
      const firstRouteIndex = stack.findIndex((layer) => Boolean(layer.route));

      expect(guardIndex).toBeGreaterThanOrEqual(0);
      expect(firstRouteIndex).toBeGreaterThan(guardIndex);
    },
  );

  it.each([
    '/api/students/summary',
    '/api/students/students',
    '/api/graduates/list',
    '/api/mbkm/analytics/rate',
  ])('%s ditolak tanpa sesi maupun dengan SYNC_API_KEY', async (endpoint) => {
    expect((await fetch(`${baseUrl}${endpoint}`)).status).toBe(401);

    const withSyncKey = await fetch(`${baseUrl}${endpoint}`, {
      headers: { 'x-api-key': process.env.SYNC_API_KEY },
    });
    expect(withSyncKey.status).toBe(401);

    const body = await withSyncKey.json();
    expect(body.message).toBe('Student session is required.');
    // Respons error tidak boleh membawa field diagnostik internal.
    expect(Object.keys(body).sort()).toEqual(['code', 'message', 'statusCode', 'success']);
  });

  it('menolak cookie tanpa signature yang sah', async () => {
    const forged = await fetch(`${baseUrl}/api/students/summary`, {
      headers: { cookie: 'komet_student_session=1.abc.def' },
    });
    expect(forged.status).toBe(401);
  });

  it('memberi sesi sah bucket rate-limit sendiri, bukan bucket IP bersama', async () => {
    const cookie = await issueSessionCookie();

    const authenticated = { headers: { cookie }, ip: '10.0.0.1' };
    sessionIdentity(authenticated, {}, () => undefined);
    expect(authenticated.authSubject).toMatch(/^s:[0-9a-f]{32}$/);

    const anonymous = { headers: { cookie: 'komet_student_session=1.abc.def' }, ip: '10.0.0.1' };
    sessionIdentity(anonymous, {}, () => undefined);
    expect(anonymous.authSubject).toBeUndefined();
  });

  it('penerbitan sesi dibatasi per IP', async () => {
    const statuses = [];
    for (let i = 0; i < 12; i += 1) {
      const response = await fetch(`${baseUrl}/api/session/student`, { method: 'POST' });
      statuses.push(response.status);
    }

    expect(statuses.filter((status) => status === 204).length).toBeLessThanOrEqual(10);
    expect(statuses).toContain(429);
  });
});
