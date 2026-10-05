import { graduatesService } from '../services/graduatesService';
import { useSummaryQuery } from '../../../hooks/useSummaryQuery';

export function useGraduateSummary(queryParams) {
  return useSummaryQuery({ namespace: 'graduates', service: graduatesService, queryParams });
}
