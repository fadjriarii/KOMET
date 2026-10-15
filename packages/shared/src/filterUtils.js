/**
 * @komet/shared — Blok pembangun filter query param, dipakai semua modul
 * (students, graduates, mbkm). Jangan tambah salinan `toArray`/`addInFilter`
 * di `apps/*`.
 */

/**
 * Normalisasi nilai query parameter menjadi array, tanpa duplikasi
 * `Array.isArray(x) ? x : [x]`. Nilai kosong → undefined.
 */
export function toArray(value) {
  if (value === undefined || value === null || value === '') return undefined;
  return Array.isArray(value) ? value : [value];
}

function getValues(value) {
  const values = toArray(value);
  return values?.filter((item) => typeof item === 'string' && item.trim()) || null;
}

export function addInFilter(where, field, value) {
  const values = getValues(value);
  if (values?.length) where[field] = { in: values };
  return where;
}

export function addSearchFilter(where, search, fields = ['nim', 'nama']) {
  const term = typeof search === 'string' ? search.trim().slice(0, 100) : '';
  if (term) where.OR = fields.map((field) => ({ [field]: { contains: term } }));
  return where;
}

export function hasFilters(where) {
  return Object.keys(where).length > 0;
}
