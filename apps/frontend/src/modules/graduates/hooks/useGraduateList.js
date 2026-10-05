import { graduatesService } from '../services/graduatesService';
import { usePaginatedList } from '../../../hooks/usePaginatedList';

/**
 * useGraduateList - Hook fetch data paginated dari GET /api/graduates/list
 */
export function useGraduateList(queryParams, { limit = 10 } = {}) {
  return usePaginatedList({
    namespace: 'graduates',
    service: graduatesService,
    queryParams,
    listMethod: graduatesService.getGraduateList,
    limit,
  });
}
