import { createFilterService } from '../../../services/createFilterService';
import { createQueryParams } from '../../../services/queryParams';
import { createQuerySanitizer } from '../../../utils/querySanitizer';

const sanitizeMbkmQuery = createQuerySanitizer({
  single: ['periode', 'tahunAjaran', 'topN'],
  multi: ['faculty', 'prodi', 'jenisAktivitas', 'statusAktivitas'],
});

function toQueryParams(filters = {}, pagination = {}) {
  const { sanitized } = sanitizeMbkmQuery(filters);
  const { params, append, appendMany } = createQueryParams();

  appendMany('fakultas', sanitized.faculty);
  appendMany('programStudi', sanitized.prodi);
  appendMany('jenisAktivitas', sanitized.jenisAktivitas);
  appendMany('statusAktivitas', sanitized.statusAktivitas);
  append('periode', sanitized.periode);
  append('tahunAjaran', sanitized.tahunAjaran);
  append('topN', sanitized.topN);
  append('search', sanitized.search);
  append('page', pagination.page);
  append('limit', pagination.limit);

  return params;
}

export const mbkmService = createFilterService({
  toQueryParams,
  summaryPath: '/mbkm/summary',
  listPath: '/mbkm/list',
  detailPaths: {
    getRateDetail: '/mbkm/analytics/rate',
    getActivityDistribution: '/mbkm/analytics/activity-distribution',
    getProdiDistribution: '/mbkm/analytics/prodi-distribution',
    getStatusDistribution: '/mbkm/analytics/status-distribution',
    getEligibleStudents: '/mbkm/analytics/eligible-students',
    getMitraDistribution: '/mbkm/analytics/mitra-distribution',
  },
});

export default mbkmService;
