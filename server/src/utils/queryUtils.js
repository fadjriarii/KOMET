/**
 * queryUtils.js
 * 
 * Helper fungsi untuk pengolahan query parameter & Prisma WHERE builder.
 */

/**
 * Normalisasi nilai query parameter ke Array atau undefined.
 * Mencegah duplikasi pengecekan `Array.isArray(x) ? x : [x]`.
 * 
 * @param {any} val 
 * @returns {Array|undefined}
 */
const toArray = (val) => {
    if (val === undefined || val === null || val === '') return undefined;
    return Array.isArray(val) ? val : [val];
};

module.exports = { toArray };
