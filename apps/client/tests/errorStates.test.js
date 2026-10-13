import { describe, expect, it } from 'vitest';
import { buildReportHref, resolveErrorState } from '../src/modules/errors/errorStates';

describe('pemetaan status → teks layar error', () => {
  it('memetakan tiap status yang ditangani ke keadaan sendiri', () => {
    expect(resolveErrorState(401).title).toBe('session expired');
    expect(resolveErrorState(403).title).toBe('access denied');
    expect(resolveErrorState(404).title).toBe('page not found');
    expect(resolveErrorState(408).title).toBe('request timed out');
    expect(resolveErrorState(429).title).toBe('too many requests');
    expect(resolveErrorState(500).title).toBe('internal server error');
    expect(resolveErrorState(503).title).toBe('backend not connected');
  });

  it('5xx lain memakai teks 500; 4xx tak dikenal memakai kode generik', () => {
    expect(resolveErrorState(502).title).toBe('internal server error');
    expect(resolveErrorState(504).title).toBe('internal server error');
    expect(resolveErrorState(400).code).toBeNull();
  });

  it('error jaringan tanpa status = backend belum terhubung, bukan 500', () => {
    expect(resolveErrorState(undefined).code).toBe('503');
    expect(resolveErrorState(null).code).toBe('503');
    expect(resolveErrorState(0).code).toBe('503');
  });

  it('tiap keadaan punya aksi yang bisa dijalankan', () => {
    for (const status of [401, 403, 404, 408, 429, 500, 503, undefined]) {
      const { kind, label } = resolveErrorState(status).action;
      expect(['home', 'retry', 'report']).toContain(kind);
      expect(label).toBeTruthy();
    }
  });

  it('laporan ke tim IT memuat kode status di subject', () => {
    const href = buildReportHref(resolveErrorState(500), 'boom');
    expect(href.startsWith('mailto:')).toBe(true);
    expect(decodeURIComponent(href)).toContain('500 internal server error');
  });
});
