import apiClient from '../../../services/apiClient';
import { validateStudentQueryParams } from '../utils/studentQueryValidator';

export const studentsService = {
  toQueryParams: (filters = {}, pagination = {}) => {
    // Validate and sanitize first
    const { sanitized } = validateStudentQueryParams(filters);

    const params = new URLSearchParams();
    const append = (key, value) => {
      if (value !== undefined && value !== null && String(value).trim()) {
        params.append(key, String(value).trim());
      }
    };
    const appendMany = (key, values) => {
      (Array.isArray(values) ? values : [values])
        .filter(Boolean)
        .forEach((value) => append(key, value));
    };

    // Multi-select filters
    appendMany('fakultas', sanitized.faculty);
    appendMany('programStudi', sanitized.prodi);
    appendMany('jenjang', sanitized.jenjang);

    // Cohort year filter
    if (sanitized.selectedYears && sanitized.selectedYears.length) {
      appendMany('angkatanTahun', sanitized.selectedYears);
    }

    // Other multi-select & single-select filters
    appendMany('semester', sanitized.semester);
    append('kewarganegaraan', sanitized.nationality);

    // Status filter: jika array kosong (user klik "Semua Status"), kirim __ALL__ atau ALL
    // agar backend tahu filter dihapus secara eksplisit dan tidak menggunakan default 'Aktif'
    if (Array.isArray(sanitized.status)) {
      if (sanitized.status.length === 0) {
        append('statusKeaktifan', 'ALL');
      } else {
        appendMany('statusKeaktifan', sanitized.status);
      }
    }

    // Periode filter
    if (sanitized.periode) {
      append('periodeMasuk', sanitized.periode);
    }

    // Academic Year
    if (sanitized.tahunAjaran) {
      append('tahunAjaran', sanitized.tahunAjaran);
      append('selectedPeriode', sanitized.tahunAjaran);
    }

    // Search query
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
      : studentsService.toQueryParams(filters).toString()
  ),

  getSummary: (filters, options) => {
    const qs = studentsService.toQueryString(filters);
    return apiClient.get(`/students/summary${qs ? `?${qs}` : ''}`, options);
  },

  getFilterOptions: (options) => apiClient.get('/students/filter-options', options),

  getStudentList: ({ filters, page, limit }, options) => {
    const params = studentsService.toQueryParams(filters, { page, limit });
    return apiClient.get(`/students/students?${params.toString()}`, options);
  },

  getActiveStudentsDetail: (filters, options) => {
    const qs = studentsService.toQueryString(filters);
    return apiClient.get(`/students/active-students${qs ? `?${qs}` : ''}`, options);
  },

  getInternationalDetail: (filters, options) => {
    const qs = studentsService.toQueryString(filters);
    return apiClient.get(`/students/international-detail${qs ? `?${qs}` : ''}`, options);
  },

  getIntakeTrend: (filters, options) => {
    const qs = studentsService.toQueryString(filters);
    return apiClient.get(`/students/intake-trend${qs ? `?${qs}` : ''}`, options);
  },

  getDeclineTrend: (filters, options) => {
    const qs = studentsService.toQueryString(filters);
    return apiClient.get(`/students/decline-trend${qs ? `?${qs}` : ''}`, options);
  },
};

export default studentsService;