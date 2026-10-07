import apiClient from './apiClient';
import { withQuery } from './queryParams';

/**
 * Satu tempat untuk "filter → query string → GET". Sebuah modul service hanya
 * memetakan field dan mendaftar path endpoint-nya; perakit URL tidak boleh
 * ditulis ulang per endpoint lagi.
 */
export function createFilterService({ toQueryParams, summaryPath, listPath, detailPaths = {} }) {
  const toQueryString = (filters = {}) =>
    filters instanceof URLSearchParams ? filters.toString() : toQueryParams(filters).toString();
  const getFiltered = (path, filters, options) =>
    apiClient.get(withQuery(path, toQueryString(filters)), options);

  const details = Object.fromEntries(
    Object.entries(detailPaths).map(([name, path]) => [
      name,
      (filters, options) => getFiltered(path, filters, options),
    ]),
  );

  return {
    toQueryParams,
    toQueryString,
    getSummary: (filters, options) => getFiltered(summaryPath, filters, options),
    getList: ({ filters, page, limit }, options) =>
      apiClient.get(withQuery(listPath, toQueryParams(filters, { page, limit })), options),
    ...details,
  };
}
