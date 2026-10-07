/** Shared URL query serialization primitives; individual services own field mapping only. */
export function createQueryParams() {
  const params = new URLSearchParams();
  const append = (key, value) => {
    if (value !== undefined && value !== null && String(value).trim())
      params.append(key, String(value).trim());
  };
  const appendMany = (key, values) => {
    (Array.isArray(values) ? values : [values])
      .filter(Boolean)
      .forEach((value) => append(key, value));
  };
  return { params, append, appendMany };
}

/** Gabungkan path dengan query string; '?' hanya ada bila ada param. */
export function withQuery(path, params) {
  const qs = params instanceof URLSearchParams ? params.toString() : String(params || '');
  return qs ? `${path}?${qs}` : path;
}
