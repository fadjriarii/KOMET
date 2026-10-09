import { createFilterService } from '../../../services/createFilterService';
import { createQueryParams } from '../../../services/queryParams';
import { createQuerySanitizer } from '../../../utils/querySanitizer';

const sanitizeGraduateQuery = createQuerySanitizer({
  single: ['periodeWisuda'],
  multi: ['faculty', 'prodi', 'jenjang', 'tahunLulus', 'predikat', 'angkatan'],
});

function toQueryParams(filters = {}, pagination = {}) {
  const { sanitized } = sanitizeGraduateQuery(filters);
  const { params, append, appendMany } = createQueryParams();

  // Nama param mengikuti validator & filterBuilder di server.
  appendMany('fakultas', sanitized.faculty);
  appendMany('programStudi', sanitized.prodi);
  appendMany('jenjang', sanitized.jenjang);
  appendMany('tahunLulus', sanitized.tahunLulus);
  append('periodeWisuda', sanitized.periodeWisuda);
  appendMany('predikat', sanitized.predikat);
  appendMany('angkatanTahun', sanitized.angkatan);
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
