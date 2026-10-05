import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getPreviousPeriode } = require('../../../src/services/mbkm/filterBuilder');

describe('mbkm filter builder', () => {
  it('returns previous periode for valid input', () => {
    expect(getPreviousPeriode('20251')).toBe('20242');
    expect(getPreviousPeriode('20252')).toBe('20251');
  });

  it('returns null when periode is not a string', () => {
    expect(getPreviousPeriode(['20251'])).toBeNull();
  });
});
