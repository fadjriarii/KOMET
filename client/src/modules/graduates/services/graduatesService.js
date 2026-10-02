import apiClient from '../../../services/apiClient';
import { validateGraduateQueryParams } from '../utils/graduateQueryValidator';
import { createQueryParams } from '../../../services/queryParams';

export const graduatesService = {
  toQueryParams: (filters = {}, pagination = {}) => {
    const { sanitized } = validateGraduateQueryParams(filters);

    const { params, append, appendMany } = createQueryParams();

    // Filter fields aligned with backend validator & filterBuilder
    appendMany('fakultas', sanitized.faculty);
    appendMany('programStudi', sanitized.prodi);
    appendMany('jenjang', sanitized.jenjang);
    appendMany('tahunLulus', sanitized.tahunLulus);
    appendMany('periodeWisuda', sanitized.periodeWisuda);
    appendMany('statusKelulusan', sanitized.statusKelulusan);

    if (sanitized.periodeMasuk) {
      append('periodeMasuk', sanitized.periodeMasuk);
    }

    if (sanitized.search) {
      append('search', sanitized.search);
    }

    // Pagination
    if (pagination.page) append('page', pagination.page);
    if (pagination.limit) append('limit', pagination.limit);

    return params;
  },

  toQueryString: (filters = {}) => (
    filters instanceof URLSearchParams
      ? filters.toString()
      : graduatesService.toQueryParams(filters).toString()
  ),

  getSummary: (filters, options) => {
    const qs = graduatesService.toQueryString(filters);
    return apiClient.get(`/graduates/summary${qs ? `?${qs}` : ''}`, options);
  },

  getTotalLulusanDetail: (filters, options) => {
    const qs = graduatesService.toQueryString(filters);
    return apiClient.get(`/graduates/total-lulusan${qs ? `?${qs}` : ''}`, options);
  },

  getIpkTrendDetail: (filters, options) => {
    const qs = graduatesService.toQueryString(filters);
    return apiClient.get(`/graduates/ipk-trend${qs ? `?${qs}` : ''}`, options);
  },

  getTepatWaktuDetail: (filters, options) => {
    const qs = graduatesService.toQueryString(filters);
    return apiClient.get(`/graduates/tepat-waktu${qs ? `?${qs}` : ''}`, options);
  },

  getKeberhasilanStudiDetail: (filters, options) => {
    const qs = graduatesService.toQueryString(filters);
    return apiClient.get(`/graduates/keberhasilan-studi${qs ? `?${qs}` : ''}`, options);
  },

  getGraduateDistribution: (filters, options) => {
    const qs = graduatesService.toQueryString(filters);
    return apiClient.get(`/graduates/distribution${qs ? `?${qs}` : ''}`, options);
  },

  getGraduateList: ({ filters, page, limit }, options) => {
    const params = graduatesService.toQueryParams(filters, { page, limit });
    return apiClient.get(`/graduates/list?${params.toString()}`, options);
  },
};

export default graduatesService;
