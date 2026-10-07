import { createFilterService } from '../../../services/createFilterService';
import { createQueryParams } from '../../../services/queryParams';
import { createQuerySanitizer } from '../../../utils/querySanitizer';

const sanitizeGraduateQuery = createQuerySanitizer({
  single: ['periodeMasuk'],
  multi: ['faculty', 'prodi', 'jenjang', 'tahunLulus', 'periodeWisuda', 'statusKelulusan'],
});

function toQueryParams(filters = {}, pagination = {}) {
  const { sanitized } = sanitizeGraduateQuery(filters);
  const { params, append, appendMany } = createQueryParams();

  // Nama param mengikuti validator & filterBuilder di server.
  appendMany('fakultas', sanitized.faculty);
  appendMany('programStudi', sanitized.prodi);
  appendMany('jenjang', sanitized.jenjang);
  appendMany('tahunLulus', sanitized.tahunLulus);
  appendMany('periodeWisuda', sanitized.periodeWisuda);
  appendMany('statusKelulusan', sanitized.statusKelulusan);
  append('periodeMasuk', sanitized.periodeMasuk);
  append('search', sanitized.search);
  append('page', pagination.page);
  append('limit', pagination.limit);

  return params;
}

export const graduatesService = createFilterService({
  toQueryParams,
  summaryPath: '/graduates/summary',
  listPath: '/graduates/list',
  detailPaths: {
    getTotalLulusanDetail: '/graduates/total-lulusan',
    getIpkTrendDetail: '/graduates/ipk-trend',
    getTepatWaktuDetail: '/graduates/tepat-waktu',
    getKeberhasilanStudiDetail: '/graduates/keberhasilan-studi',
    getGraduateDistribution: '/graduates/distribution',
  },
});

export default graduatesService;
