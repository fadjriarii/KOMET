import apiClient from '../../../services/apiClient';
import { createFilterService } from '../../../services/createFilterService';
import { createQueryParams } from '../../../services/queryParams';
import { createQuerySanitizer } from '../../../utils/querySanitizer';

const sanitizeGraduateQuery = createQuerySanitizer({
  single: ['periodeWisuda', 'tahunAjaran'],
  multi: ['faculty', 'prodi', 'jenjang', 'selectedTahunLulus', 'predikat', 'selectedAngkatan'],
});

function toQueryParams(filters = {}, pagination = {}) {
  const { sanitized } = sanitizeGraduateQuery(filters);
  const { params, append, appendMany } = createQueryParams();

  // Nama param mengikuti validator & filterBuilder di server.
  appendMany('fakultas', sanitized.faculty);
  appendMany('programStudi', sanitized.prodi);
  appendMany('jenjang', sanitized.jenjang);
  appendMany('tahunLulus', sanitized.selectedTahunLulus);
  append('periodeWisuda', sanitized.periodeWisuda);
  append('tahunAjaran', sanitized.tahunAjaran);
  appendMany('predikat', sanitized.predikat);
  appendMany('angkatanTahun', sanitized.selectedAngkatan);
  append('search', sanitized.search);
  append('page', pagination.page);
  append('limit', pagination.limit);

  return params;
}

export const graduatesService = {
  ...createFilterService({
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
  }),

  getFilterOptions: ({ signal, tahunAjaran } = {}) => {
    const params = tahunAjaran ? `?tahunAjaran=${encodeURIComponent(tahunAjaran)}` : '';
    return apiClient.get(`/graduates/filter-options${params}`, { signal });
  },
};

export default graduatesService;
