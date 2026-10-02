import { mbkmService } from '../services/mbkmService';
import { usePaginatedList } from '../../../hooks/usePaginatedList';

/**
 * useMbkmList - Hook fetch data paginated dari GET /api/mbkm/list
 */
export function useMbkmList(queryParams, { limit = 10 } = {}) {
  return usePaginatedList({ namespace: 'mbkm', service: mbkmService, queryParams, listMethod: mbkmService.getMbkmList, limit });
}
