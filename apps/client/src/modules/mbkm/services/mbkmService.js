import { createFilterService } from '../../../services/createFilterService';
import { createQueryParams } from '../../../services/queryParams';
import { createQuerySanitizer } from '../../../utils/querySanitizer';

const sanitizeMbkmQuery = createQuerySanitizer({
  single: ['periode', 'tahunAjaran', 'topN', 'statusPartisipasi'],
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
  append('statusPartisipasi', sanitized.statusPartisipasi);
  append('search', sanitized.search);
  append('page', pagination.page);
  append('limit', pagination.limit);

  return params;
}

export const mbkmService = createFilterService({
  toQueryParams,
  summaryPath: '/mbkm/summary',
  listPath: '/mbkm/list',
  // Satu endpoint per kartu; isi tab (`breakdowns`) ditentukan server.
  detailPaths: {
    getRateDetail: '/mbkm/analytics/rate',
    getParticipantsDetail: '/mbkm/analytics/participants',
    getEligibleDetail: '/mbkm/analytics/eligible',
    getRecognitionDetail: '/mbkm/analytics/recognition',
    getDataQuality: '/mbkm/data-quality',
  },
});

export default mbkmService;
