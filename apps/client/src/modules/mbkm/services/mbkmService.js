import { createFilterService } from '../../../services/createFilterService';
import { createQueryParams } from '../../../services/queryParams';
import { createQuerySanitizer } from '../../../utils/querySanitizer';

const sanitizeMbkmQuery = createQuerySanitizer({
  single: ['periode', 'topN'],
  multi: ['faculty', 'prodi', 'jenjang', 'angkatan', 'statusAktivitas'],
});

function toQueryParams(filters = {}, pagination = {}) {
  const { sanitized } = sanitizeMbkmQuery(filters);
  const { params, append, appendMany } = createQueryParams();

  appendMany('fakultas', sanitized.faculty);
  appendMany('programStudi', sanitized.prodi);
  appendMany('jenjang', sanitized.jenjang);
  appendMany('angkatan', sanitized.angkatan);
  appendMany('statusAktivitas', sanitized.statusAktivitas);
  append('periode', sanitized.periode);
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
    getCombinedDistribution: '/mbkm/distribution',
  },
});

export default mbkmService;
