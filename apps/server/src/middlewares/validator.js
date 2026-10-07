const { z } = require('zod');
const { sendRejected } = require('../utils/errorHandler');
const { HTTP_STATUS } = require('@komet/shared/constants');

// Schema pembantu untuk mengizinkan string tunggal atau array of string
// Byte kontrol (0x00-0x1F, 0x7F) ditolak: string ini lanjut ke LIKE/IN di MySQL dan
// bisa dipakai menyamarkan payload injeksi dari pembacaan log.
// eslint-disable-next-line no-control-regex
const WITHOUT_CONTROL_BYTES = /^[^\u0000-\u001F\u007F]+$/;
const safeString = z.string().trim().min(1).max(100).regex(WITHOUT_CONTROL_BYTES);
const stringOrArray = z.union([safeString, z.array(safeString).max(50)]).optional();
// Batas halaman diturunkan dari 100 000: dengan limit maks 100, OFFSET tak boleh
// mencapai jutaan baris yang tetap dibaca lalu dibuang oleh MySQL.
const pageParam = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(1000))
  .optional();
const limitParam = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(100))
  .optional();
// Batas topN diletakkan di schema (bukan clamp per controller) supaya seragam di semua endpoint.
const topNParam = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(100))
  .optional();

// Schema Query Parameter Mahasiswa (Students)
const studentQuerySchema = z.object({
  page: pageParam,
  limit: limitParam,
  cursor: z
    .string()
    .max(200)
    .regex(/^[A-Za-z0-9._~-]+$/)
    .optional(),
  search: z.string().trim().max(100).optional(),
  fakultas: stringOrArray,
  programStudi: stringOrArray,
  angkatan: stringOrArray,
  angkatanTahun: stringOrArray,
  jenjang: stringOrArray,
  semester: stringOrArray,
  periodeMasuk: z.enum(['Ganjil', 'Genap']).optional(),
  periode: z
    .string()
    .max(20)
    .regex(/^\d{4}(\/\d{4})?$/)
    .optional(),
  kewarganegaraan: z.enum(['WNI', 'WNA']).optional(),
  statusKeaktifan: stringOrArray,
  selectedPeriode: z
    .string()
    .max(20)
    .regex(/^\d{4}\/\d{4}$/)
    .optional(),
  tahunAjaran: z
    .string()
    .max(20)
    .regex(/^\d{4}\/\d{4}$/)
    .optional(),
});

// Schema Query Parameter Kelulusan (Graduates)
const graduateQuerySchema = z.object({
  page: pageParam,
  limit: limitParam,
  search: z.string().trim().max(100).optional(),
  fakultas: stringOrArray,
  programStudi: stringOrArray,
  tahunLulus: stringOrArray,
  periodeWisuda: stringOrArray,
  statusKelulusan: stringOrArray,
  periodeMasuk: z
    .string()
    .trim()
    .max(20)
    .regex(/^\d{4}[12]$/)
    .optional(),
  jenjang: stringOrArray,
});

// Schema Query Parameter MBKM
const mbkmQuerySchema = z.object({
  page: pageParam,
  limit: limitParam,
  search: z.string().trim().max(100).optional(),
  fakultas: stringOrArray,
  programStudi: stringOrArray,
  angkatan: stringOrArray,
  statusAktivitas: stringOrArray,
  jenjang: stringOrArray,
  periode: z
    .string()
    .trim()
    .max(20)
    .regex(/^\d{4}[12]$/)
    .optional(),
  topN: topNParam,
});

// Parameter berbentuk `fakultas[]` / `fakultas[0]` adalah pola client yang salah
// (parser `simple` Express tidak pernah mengubahnya jadi array). Ditolak eksplisit
// supaya tidak pernah ada filter yang hilang secara senyap.
const INVALID_PARAM_NAME = /[[\]]/;
const SAFE_ISSUE_PATH = /^[A-Za-z0-9._]+$/;

/**
 * Middleware Validator Generic berbasis Zod Schema
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const offending = Object.keys(req.query).filter((key) => INVALID_PARAM_NAME.test(key));
    if (offending.length > 0) {
      return sendRejected(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Nama query parameter tidak valid.',
        'INVALID_PARAMETER_NAME',
      );
    }

    const result = schema.safeParse(req.query);
    if (!result.success) {
      // Hanya nama field (identitas skema kita) yang dikirim ke client; pesan Zod
      // yang menyebut tipe/konstrain internal tidak pernah keluar.
      const fields = [
        ...new Set(
          result.error.issues
            .map((issue) => issue.path.join('.') || 'query')
            .filter((path) => SAFE_ISSUE_PATH.test(path)),
        ),
      ];
      return sendRejected(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Query parameter tidak valid.',
        'VALIDATION_FAILED',
        {
          fields,
        },
      );
    }
    // Use the parsed value so downstream code only receives validated,
    // transformed values (not arbitrary query keys or oversized values).
    req.query = result.data;
    next();
  };
};

module.exports = {
  studentQuerySchema,
  graduateQuerySchema,
  mbkmQuerySchema,
  validateQuery,
};
