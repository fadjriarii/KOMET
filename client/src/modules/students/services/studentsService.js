import apiClient from '../../../services/apiClient';

export const studentsService = {
  toQueryParams: (filters = {}, pagination = {}) => {
    const params = new URLSearchParams();
    const append = (key, value) => { if (value !== undefined && value !== null && String(value).trim()) params.append(key, String(value).trim()); };
    append('search', filters.search);
    const appendMany = (key, values) => (Array.isArray(values) ? values : [values]).filter(Boolean).forEach((value) => append(key, value));
    appendMany('fakultas', filters.faculty); appendMany('programStudi', filters.prodi); appendMany('jenjang', filters.jenjang);
    appendMany('angkatanTahun', filters.selectedYears);
    appendMany('semester', filters.semester); append('kewarganegaraan', filters.nationality);
    if (Array.isArray(filters.status) && filters.status.length === 0) append('statusKeaktifan', '__ALL__');
    else appendMany('statusKeaktifan', filters.status);
    append('periodeMasuk', filters.periode);
    append('tahunAjaran', filters.tahunAjaran);
    if (filters.tahunAjaran) append('selectedPeriode', filters.tahunAjaran);
    if (pagination.page) append('page', pagination.page); if (pagination.limit) append('limit', pagination.limit);
    return params;
  },
  toQueryString: (filters = {}) => (
    filters instanceof URLSearchParams ? filters.toString() : studentsService.toQueryParams(filters).toString()
  ),
  getSummary: (filters, options) => apiClient.get(`/students/summary${filters ? `?${studentsService.toQueryString(filters)}` : ''}`, options),
  getStudentList: ({ filters, page, limit }, options) => apiClient.get(`/students/students?${studentsService.toQueryParams(filters, { page, limit })}`, options),
  getActiveStudentsDetail: (filters, options) => apiClient.get(`/students/active-students?${studentsService.toQueryString(filters)}`, options),
  getInternationalDetail: (filters, options) => apiClient.get(`/students/international-detail?${studentsService.toQueryString(filters)}`, options),
  getIntakeTrend: (filters, options) => apiClient.get(`/students/intake-trend?${studentsService.toQueryString(filters)}`, options),
  getDeclineTrend: (filters, options) => apiClient.get(`/students/decline-trend?${studentsService.toQueryString(filters)}`, options),
};
