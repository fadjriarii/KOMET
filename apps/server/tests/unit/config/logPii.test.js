import { describe, expect, it, vi, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import { once } from 'node:events';

const require = createRequire(import.meta.url);
const express = require('express');
const logger = require('../../../src/utils/logger');
const { createAccessLogMiddleware } = require('../../../src/config/accessLog');
const { logSlowQuery, slowQueryMs } = require('../../../src/config/slowQueryLog');

// Nilai yang tidak boleh pernah muncul di file log: NIM dan nama mahasiswa.
const PII = ['2020103456', 'RANI PUSPITA'];

const loggedText = (spy) => spy.mock.calls.map((call) => call.map(String).join(' ')).join('\n');

describe('log akses tidak memuat PII', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('query string (search/nim) dipotong dari baris log', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => logger);

    const app = express();
    app.use(createAccessLogMiddleware());
    app.get('/api/students/students', (_req, res) => res.json({ success: true, data: [] }));
    const server = app.listen(0);
    await once(server, 'listening');

    const url = `http://127.0.0.1:${server.address().port}/api/students/students?search=${encodeURIComponent(PII[1])}&nim=${PII[0]}`;
    const response = await fetch(url);
    await response.json();

    // Morgan menulis saat respons selesai; beri kesempatan satu tick sebelum baca.
    await new Promise((resolve) => setTimeout(resolve, 50));
    const text = loggedText(info);
    expect(text).toContain('GET /api/students/students 200');
    for (const value of PII) {
      expect(text).not.toContain(value);
    }
    // Query string utuh juga tidak boleh tertinggal di bentuk ter-encode.
    expect(text).not.toContain('search');

    server.close();
  });
});

describe('SlowQuery tidak memuat nilai bound', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hanya template + durasi yang di-log, params dibuang', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => logger);

    logSlowQuery({
      duration: slowQueryMs + 1,
      query: 'SELECT `nim`, `nama` FROM `students` WHERE `nim` IN (?,?)',
      params: PII,
    });

    const text = JSON.stringify(warn.mock.calls);
    expect(text).toContain('SELECT `nim`, `nama` FROM `students` WHERE `nim` IN (?,?)');
    for (const value of PII) {
      expect(text).not.toContain(value);
    }
  });

  it('query di bawah ambang tidak di-log sama sekali', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => logger);

    logSlowQuery({ duration: slowQueryMs - 1, query: 'SELECT 1', params: PII });

    expect(warn.mock.calls.length).toBe(0);
  });
});
