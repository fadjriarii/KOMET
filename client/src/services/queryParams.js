/** Shared URL query serialization primitives; individual services own field mapping only. */
export function createQueryParams() {
  const params = new URLSearchParams();
  const append = (key, value) => {
    if (value !== undefined && value !== null && String(value).trim()) params.append(key, String(value).trim());
  };
  const appendMany = (key, values) => {
    (Array.isArray(values) ? values : [values]).filter(Boolean).forEach((value) => append(key, value));
  };
  return { params, append, appendMany };
}
