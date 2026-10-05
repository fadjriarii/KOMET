const { z } = require('zod');

// Schema pembantu untuk mengizinkan string tunggal atau array of string
const safeString = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[^\u0000-\u001F\u007F]+$/);
const stringOrArray = z.union([safeString, z.array(safeString).max(50)]).optional();
const pageParam = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(100000))
  .optional();
const limitParam = z
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
  topN: z.union([z.string().regex(/^\d+$/), z.number().int()]).optional(),
});

/**
 * Middleware Validator Generic berbasis Zod Schema
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const formattedErrors = result.error.issues
        .map((err) => `${err.path.join('.') || 'query'}: ${err.message}`)
        .join(', ');
      return res.status(400).json({
        success: false,
        message: `Validasi query parameter gagal: ${formattedErrors}`,
      });
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
