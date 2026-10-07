import { describe, expect, it, afterEach } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  sendError,
  sendServerError,
  sendRejected,
  safePublicMessage,
  GENERIC_ERROR_MESSAGE,
} = require('../../../src/utils/errorHandler');
const {
  PUBLIC_ERROR_MESSAGES,
  ERROR_CATALOG,
  isPublicErrorMessage,
} = require('../../../src/utils/errorCatalog');

function fakeRes(headersSent = false) {
  const res = { headersSent, statusCode: 0, body: undefined };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

const savedExpose = process.env.EXPOSE_ERROR_DETAILS;
afterEach(() => {
  process.env.EXPOSE_ERROR_DETAILS = savedExpose;
});

describe('error allowlist', () => {
  it('mengganti pesan yang tidak terdaftar dengan pesan generik', () => {
    expect(safePublicMessage('User was not found for relation student')).toBe(
      GENERIC_ERROR_MESSAGE,
    );
    expect(safePublicMessage(ERROR_CATALOG.DATA_READ_FAILED.message)).toBe(
      ERROR_CATALOG.DATA_READ_FAILED.message,
    );
    // Pesan yang lolos blocklist lama (tidak menyebut sql/prisma) tetap diblok.
    expect(safePublicMessage('Nama prodi Manajemen tidak ditemukan')).toBe(GENERIC_ERROR_MESSAGE);
  });

  it('kode katalog menentukan status dan pesan publik sekaligus', () => {
    const res = sendServerError(
      fakeRes(),
      'DATA_READ_FAILED',
      new Error('connect ECONNREFUSED db:3306'),
      'test',
    );
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      success: false,
      statusCode: 500,
      code: 'DATA_READ_FAILED',
      message: 'Gagal mengambil data.',
    });
  });

  it('kode yang tidak terdaftar gagal keras, bukan diam-diam jadi pesan generik', () => {
    expect(() => sendServerError(fakeRes(), 'typo', new Error('boom'), 'test')).toThrow('typo');
  });

  it('setiap kode katalog punya status HTTP dan pesan yang terdaftar', () => {
    for (const [code, entry] of Object.entries(ERROR_CATALOG)) {
      expect(Number.isInteger(entry.statusCode), code).toBe(true);
      expect(isPublicErrorMessage(entry.message), code).toBe(true);
    }
  });

  it('tidak pernah mengirim field diagnostik kecuali diminta secara eksplisit', () => {
    delete process.env.EXPOSE_ERROR_DETAILS;
    const res = sendError(
      fakeRes(),
      500,
      ERROR_CATALOG.DATA_READ_FAILED.message,
      new Error('connect ECONNREFUSED db:3306'),
      'test',
    );
    expect(res.body).toEqual({
      success: false,
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Gagal mengambil data.',
    });

    process.env.EXPOSE_ERROR_DETAILS = 'true';
    const withDetail = sendError(
      fakeRes(),
      500,
      ERROR_CATALOG.DATA_READ_FAILED.message,
      new Error('boom'),
      'test',
    );
    expect(withDetail.body.error).toBe('boom');
  });

  it('diam saja bila respons sudah dikirim (timeout/abort)', () => {
    const late = fakeRes(true);
    expect(sendServerError(late, 'DATA_READ_FAILED', new Error('slow'), 'test')).toBe(late);
    expect(late.body).toBeUndefined();
    expect(sendRejected(late, 401, 'Student session is required.')).toBe(late);
  });

  it('sendRejected memakai sampul standar dan allowlist', () => {
    const res = sendRejected(fakeRes(), 400, 'Query parameter tidak valid.', 'VALIDATION_FAILED', {
      fields: ['page'],
    });
    expect(res.body).toEqual({
      success: false,
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      message: 'Query parameter tidak valid.',
      fields: ['page'],
    });

    const leaked = sendRejected(fakeRes(), 403, 'CORS: Origin https://evil tidak diizinkan');
    expect(leaked.body.message).toBe(GENERIC_ERROR_MESSAGE);
  });

  it('catalog hanya berisi kalimat (tidak bisa menampung data user)', () => {
    for (const message of PUBLIC_ERROR_MESSAGES) {
      expect(message).not.toMatch(/\$\{|%s|{{/);
      expect(message.length).toBeLessThanOrEqual(90);
    }
  });
});
