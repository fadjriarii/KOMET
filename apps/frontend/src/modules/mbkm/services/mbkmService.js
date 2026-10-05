import apiClient from '../../../services/apiClient';
import { validateMbkmQueryParams } from '../utils/mbkmQueryValidator';
import { createQueryParams } from '../../../services/queryParams';

export const mbkmService = {
  toQueryParams: (filters = {}, pagination = {}) => {
    const { sanitized } = validateMbkmQueryParams(filters);

    const { params, append, appendMany } = createQueryParams();

    appendMany('fakultas', sanitized.faculty);
    appendMany('programStudi', sanitized.prodi);
    appendMany('jenjang', sanitized.jenjang);
    appendMany('angkatan', sanitized.angkatan);
    appendMany('statusAktivitas', sanitized.statusAktivitas);

    if (sanitized.periode) {
      append('periode', sanitized.periode);
    }

    if (sanitized.search) {
      append('search', sanitized.search);
    }

    if (pagination.page) append('page', pagination.page);
    if (pagination.limit) append('limit', pagination.limit);

    return params;
  },

  toQueryString: (filters = {}) =>
    filters instanceof URLSearchParams
      ? filters.toString()
      : mbkmService.toQueryParams(filters).toString(),

  getSummary: (filters, options) => {
    const qs = mbkmService.toQueryString(filters);
    return apiClient.get(`/mbkm/summary${qs ? `?${qs}` : ''}`, options);
  },

  getMbkmList: ({ filters, page, limit }, options) => {
    const params = mbkmService.toQueryParams(filters, { page, limit });
    return apiClient.get(`/mbkm/list?${params.toString()}`, options);
  },

  getRateDetail: (filters, options) => {
    const qs = mbkmService.toQueryString(filters);
    return apiClient.get(`/mbkm/analytics/rate${qs ? `?${qs}` : ''}`, options);
  },

  getActivityDistribution: (filters, options) => {
    const qs = mbkmService.toQueryString(filters);
    return apiClient.get(`/mbkm/analytics/activity-distribution${qs ? `?${qs}` : ''}`, options);
  },

  getProdiDistribution: (filters, options) => {
    const qs = mbkmService.toQueryString(filters);
    return apiClient.get(`/mbkm/analytics/prodi-distribution${qs ? `?${qs}` : ''}`, options);
  },

  getStatusDistribution: (filters, options) => {
    const qs = mbkmService.toQueryString(filters);
    return apiClient.get(`/mbkm/analytics/status-distribution${qs ? `?${qs}` : ''}`, options);
  },

  getEligibleStudents: (filters, options) => {
    const qs = mbkmService.toQueryString(filters);
    return apiClient.get(`/mbkm/analytics/eligible-students${qs ? `?${qs}` : ''}`, options);
  },

  getMitraDistribution: (filters, options) => {
    const qs = mbkmService.toQueryString(filters);
    return apiClient.get(`/mbkm/analytics/mitra-distribution${qs ? `?${qs}` : ''}`, options);
  },

  getCombinedDistribution: (filters, options) => {
    const qs = mbkmService.toQueryString(filters);
    return apiClient.get(`/mbkm/distribution${qs ? `?${qs}` : ''}`, options);
  },
};

export default mbkmService;
