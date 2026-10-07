/** Small, database-agnostic building blocks shared by dashboard filters. */

/**
 * Normalisasi nilai query parameter menjadi array, tanpa duplikasi
 * `Array.isArray(x) ? x : [x]`. Nilai kosong → undefined.
 */
const toArray = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  return Array.isArray(value) ? value : [value];
};

function getValues(value) {
  const values = toArray(value);
  return values?.filter((item) => typeof item === 'string' && item.trim()) || null;
}

function addInFilter(where, field, value) {
  const values = getValues(value);
  if (values?.length) where[field] = { in: values };
  return where;
}

function addSearchFilter(where, search, fields = ['nim', 'nama']) {
  const term = typeof search === 'string' ? search.trim().slice(0, 100) : '';
  if (term) where.OR = fields.map((field) => ({ [field]: { contains: term } }));
  return where;
}

function hasFilters(where) {
  return Object.keys(where).length > 0;
}

module.exports = { toArray, getValues, addInFilter, addSearchFilter, hasFilters };
