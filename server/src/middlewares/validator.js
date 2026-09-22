const { z } = require('zod');

// Schema pembantu untuk mengizinkan string tunggal atau array of string
const stringOrArray = z.union([z.string(), z.array(z.string())]).optional();

// Schema Query Parameter Mahasiswa (Students)
const studentQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().positive()).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().positive()).optional(),
    search: z.string().max(100).optional(),
    fakultas: stringOrArray,
    programStudi: stringOrArray,
    angkatan: stringOrArray,
    semester: stringOrArray,
    periodeMasuk: z.string().optional(),
    kewarganegaraan: z.string().optional(),
    statusKeaktifan: z.string().optional()
});

// Schema Query Parameter Kelulusan (Graduates)
const graduateQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().positive()).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().positive()).optional(),
    search: z.string().max(100).optional(),
    fakultas: stringOrArray,
    programStudi: stringOrArray,
    tahunLulus: stringOrArray,
    periodeWisuda: stringOrArray,
    statusKelulusan: stringOrArray,
    periodeMasuk: z.string().optional(),
    jenjang: z.string().optional()
});

// Schema Query Parameter MBKM
const mbkmQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().positive()).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().positive()).optional(),
    search: z.string().max(100).optional(),
    fakultas: stringOrArray,
    programStudi: stringOrArray,
    angkatan: stringOrArray,
    statusAktivitas: z.string().optional(),
    jenjang: z.string().optional(),
    periode: z.string().optional()
});

/**
 * Middleware Validator Generic berbasis Zod Schema
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            const formattedErrors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
            return res.status(400).json({
                success: false,
                message: `Validasi query parameter gagal: ${formattedErrors}`
            });
        }
        next();
    };
};

module.exports = {
    studentQuerySchema,
    graduateQuerySchema,
    mbkmQuerySchema,
    validateQuery
};
