import apiClient from '../../../services/apiClient';
import { createFilterService } from '../../../services/createFilterService';
import { createQueryParams } from '../../../services/queryParams';
import { createQuerySanitizer } from '../../../utils/querySanitizer';

const sanitizeStudentQuery = createQuerySanitizer({
  single: ['nationality', 'periode', 'tahunAjaran'],
  multi: ['faculty', 'prodi', 'jenjang', 'selectedYears', 'semester', 'status'],
});

function toQueryParams(filters = {}, pagination = {}) {
  const { sanitized } = sanitizeStudentQuery(filters);
  const { params, append, appendMany } = createQueryParams();

  appendMany('fakultas', sanitized.faculty);
  appendMany('programStudi', sanitized.prodi);
  appendMany('jenjang', sanitized.jenjang);
  appendMany('angkatanTahun', sanitized.selectedYears);
  appendMany('semester', sanitized.semester);
  append('kewarganegaraan', sanitized.nationality);

  // Kosong = "Semua Status" secara eksplisit; bedakan dari tidak mengirim
  // parameter sama sekali, yang berarti server memakai default-nya.
  if (Array.isArray(sanitized.status)) {
    if (sanitized.status.length === 0) append('statusKeaktifan', 'ALL');
    else appendMany('statusKeaktifan', sanitized.status);
  }

  append('periodeMasuk', sanitized.periode);
  // Satu parameter tahun akademik kanonik; `selectedPeriode` hanya diterima server
  // untuk tautan lama yang masih terpasang.
  append('tahunAjaran', sanitized.tahunAjaran);
  append('search', sanitized.search);
  append('page', pagination.page);
  append('limit', pagination.limit);

  return params;
}

export const studentsService = {
  ...createFilterService({
    toQueryParams,
    summaryPath: '/students/summary',
    listPath: '/students/students',
    detailPaths: {
      getActiveStudentsDetail: '/students/active-students',
      getInternationalDetail: '/students/international-detail',
      getIntakeTrend: '/students/intake-trend',
      getDeclineTrend: '/students/decline-trend',
    },
  }),

  getFilterOptions: (options) => apiClient.get('/students/filter-options', options),
};

export default studentsService;
