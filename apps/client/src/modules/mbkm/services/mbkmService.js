import { MBKM_TABLE_ONLY_FILTERS } from '@komet/shared/constants';
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

/** Param kartu dan popup (ADR 0007): pencarian dan status hanya menyaring tabel. */
const toCardQueryParams = (filters = {}) =>
  toQueryParams({
    ...filters,
    ...Object.fromEntries(MBKM_TABLE_ONLY_FILTERS.map((key) => [key, undefined])),
  });

export const mbkmService = createFilterService({
  toQueryParams,
  toCardQueryParams,
  summaryPath: '/mbkm/summary',
  listPath: '/mbkm/list',
  // Satu endpoint per kartu; isi tab (`breakdowns`) ditentukan server.
  detailPaths: {
    getParticipationDetail: '/mbkm/analytics/participation',
    getTotalDetail: '/mbkm/analytics/total',
    getMitraDetail: '/mbkm/analytics/mitra',
    getJenisDetail: '/mbkm/analytics/jenis',
  },
});

export default mbkmService;
