import apiClient from './apiClient';
import { withQuery } from './queryParams';

/**
 * Satu tempat untuk "filter → query string → GET". Sebuah modul service hanya
 * memetakan field dan mendaftar path endpoint-nya; perakit URL tidak boleh
 * ditulis ulang per endpoint lagi.
 *
 * `toCardQueryParams` (opsional) = param yang dibaca kartu dan popup. Tanpanya
 * kartu memakai param yang sama dengan tabel.
 */
export function createFilterService({
  toQueryParams,
  toCardQueryParams = toQueryParams,
  summaryPath,
  listPath,
  detailPaths = {},
}) {
  const stringify =
    (build) =>
    (filters = {}) =>
      filters instanceof URLSearchParams ? filters.toString() : build(filters).toString();
  const toQueryString = stringify(toQueryParams);
  const toCardQueryString = stringify(toCardQueryParams);
  const getCardData = (path, filters, options) =>
    apiClient.get(withQuery(path, toCardQueryString(filters)), options);

  const details = Object.fromEntries(
    Object.entries(detailPaths).map(([name, path]) => [
      name,
      (filters, options) => getCardData(path, filters, options),
    ]),
  );

  return {
    toQueryParams,
    toQueryString,
    toCardQueryString,
    getSummary: (filters, options) => getCardData(summaryPath, filters, options),
    getList: ({ filters, page, limit }, options) =>
      apiClient.get(withQuery(listPath, toQueryParams(filters, { page, limit })), options),
    ...details,
  };
}
