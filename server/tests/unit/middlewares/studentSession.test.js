import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseCookies } = require('../../../src/middlewares/studentSession');

describe('student session cookies', () => {
  it('preserves equals signs in cookie values', () => {
    const cookies = parseCookies('theme=light; komet_student_session=abc.def.ghi==');

    expect(cookies).toEqual({
      theme: 'light',
      komet_student_session: 'abc.def.ghi=='
    });
  });
});
