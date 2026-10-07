import { describe, expect, it, afterEach } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  parseCookies,
  issueStudentSession,
  revokeStudentSession,
  studentSessionAuth,
} = require('../../../src/middlewares/studentSession');
const { syncAuth } = require('../../../src/middlewares/syncAuth');

const savedEnv = { secret: process.env.SESSION_SECRET, key: process.env.SYNC_API_KEY };

function fakeRes() {
  const res = {
    statusCode: 0,
    body: undefined,
    cookieHeaders: [],
    setHeader(name, value) {
      if (name === 'Set-Cookie') res.cookieHeaders.push(value);
    },
    status(code) {
      res.statusCode = code;
      return res;
    },
    send(body) {
      res.body = body;
      return res;
    },
    json(body) {
      res.body = body;
      return res;
    },
  };
  return res;
}

function fakeReq(cookie) {
  return { headers: cookie ? { cookie } : {}, method: 'GET', path: '/test', ip: '127.0.0.1' };
}

async function isAuthorized(middleware, req) {
  let authorized = false;
  await middleware(req, fakeRes(), () => {
    authorized = true;
  });
  return authorized;
}

async function issueSession() {
  process.env.SESSION_SECRET = 'test-session-secret';
  const res = fakeRes();
  await issueStudentSession({ headers: {}, ip: '127.0.0.1' }, res, (error) => {
    throw error;
  });
  return res.cookieHeaders[0].split(';')[0];
}

afterEach(() => {
  process.env.SESSION_SECRET = savedEnv.secret;
  process.env.SYNC_API_KEY = savedEnv.key;
});

describe('student session cookies', () => {
  it('preserves equals signs in cookie values', () => {
    const cookies = parseCookies('theme=light; komet_student_session=abc.def.ghi==');

    expect(cookies).toEqual({
      theme: 'light',
      komet_student_session: 'abc.def.ghi==',
    });
  });

  it('accepts an issued session and rejects it after revocation', async () => {
    const cookie = await issueSession();

    expect(await isAuthorized(studentSessionAuth, fakeReq(cookie))).toBe(true);

    await revokeStudentSession({ headers: { cookie } }, fakeRes(), (error) => {
      throw error;
    });
    expect(await isAuthorized(studentSessionAuth, fakeReq(cookie))).toBe(false);
  });

  it('menolak sesi yang ditandatangani dengan secret lain', async () => {
    const cookie = await issueSession();
    process.env.SESSION_SECRET = 'secret-b';

    expect(await isAuthorized(studentSessionAuth, fakeReq(cookie))).toBe(false);
  });

  it('SYNC_API_KEY tidak punya hak baca route data mahasiswa', async () => {
    process.env.SESSION_SECRET = 'test-session-secret';
    process.env.SYNC_API_KEY = 'sync-key';
    const headers = { 'x-api-key': 'sync-key' };
    const reqWithKey = () => ({ headers, method: 'GET', path: '/api/students/summary', ip: '::1' });

    // Credential sync boleh memicu sinkronisasi, tapi tidak boleh membaca dataset.
    expect(await isAuthorized(syncAuth, reqWithKey())).toBe(true);
    expect(await isAuthorized(studentSessionAuth, reqWithKey())).toBe(false);
  });

  it('menolak penerbitan sesi dari origin yang tidak diizinkan', async () => {
    process.env.SESSION_SECRET = 'test-session-secret';
    const res = fakeRes();

    await issueStudentSession(
      { headers: { origin: 'https://evil.example' }, ip: '127.0.0.1' },
      res,
      (error) => {
        throw error;
      },
    );

    expect(res.statusCode).toBe(403);
    expect(res.cookieHeaders).toHaveLength(0);
  });
});
