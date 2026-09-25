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
    if (pagination.page) append('page', pagination.page); if (pagination.limit) append('limit', pagination.limit);
    return params;
  },
  getSummary: (params) => apiClient.get(`/students/summary${params ? `?${params instanceof URLSearchParams ? params : studentsService.toQueryParams(params)}` : ''}`),
  getStudentList: ({ filters, page, limit }) => apiClient.get(`/students/students?${studentsService.toQueryParams(filters, { page, limit })}`),
  getActiveStudentsDetail: (params) => apiClient.get(`/students/active-students${params ? `?${new URLSearchParams(params)}` : ''}`),
  getInternationalDetail: (params) => apiClient.get(`/students/international-detail${params ? `?${new URLSearchParams(params)}` : ''}`),
  getIntakeTrend: (params) => apiClient.get(`/students/intake-trend${params ? `?${new URLSearchParams(params)}` : ''}`),
  getDeclineTrend: (params) => apiClient.get(`/students/decline-trend${params ? `?${new URLSearchParams(params)}` : ''}`),
};
