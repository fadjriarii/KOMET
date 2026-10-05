import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  parseCookies,
  issueStudentSession,
  revokeStudentSession,
  studentSessionAuth,
} = require('../../../src/middlewares/studentSession');

describe('student session cookies', () => {
  it('preserves equals signs in cookie values', () => {
    const cookies = parseCookies('theme=light; komet_student_session=abc.def.ghi==');

    expect(cookies).toEqual({
      theme: 'light',
      komet_student_session: 'abc.def.ghi==',
    });
  });

  it('accepts an issued session and rejects it after revocation', async () => {
    const previousSecret = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = 'test-session-secret';
    const headers = {};
    const issueResponse = {
      setHeader: (name, value) => {
        headers[name] = value;
      },
      status: () => issueResponse,
      send: () => undefined,
    };
    await issueStudentSession({}, issueResponse, (error) => {
      throw error;
    });
    const cookie = headers['Set-Cookie'].split(';')[0];

    let authorized = false;
    await studentSessionAuth(
      { headers: { cookie }, method: 'GET', path: '/test', ip: '127.0.0.1' },
      {},
      () => {
        authorized = true;
      },
    );
    expect(authorized).toBe(true);

    const revokeResponse = {
      setHeader: () => undefined,
      status: () => revokeResponse,
      send: () => undefined,
    };
    await revokeStudentSession({ headers: { cookie } }, revokeResponse, (error) => {
      throw error;
    });
    const unauthenticatedResponse = {
      status: () => unauthenticatedResponse,
      json: () => undefined,
    };
    authorized = false;
    await studentSessionAuth(
      { headers: { cookie }, method: 'GET', path: '/test', ip: '127.0.0.1' },
      unauthenticatedResponse,
      () => {
        authorized = true;
      },
    );
    expect(authorized).toBe(false);
    process.env.SESSION_SECRET = previousSecret;
  });
});
