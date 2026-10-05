import { mbkmService } from '../services/mbkmService';
import { useSummaryQuery } from '../../../hooks/useSummaryQuery';

export function useMbkmSummary(queryParams) {
  return useSummaryQuery({ namespace: 'mbkm', service: mbkmService, queryParams });
}
