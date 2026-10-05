import { graduatesService } from '../services/graduatesService';
import { useDetailResource } from '../../../hooks/useDetailResource';

export function useGraduateDetailResource({
  isOpen,
  resourceKey,
  filters,
  fetcher,
  errorMessage,
  summaryData,
  summaryKey,
}) {
  return useDetailResource({
    namespace: 'graduates',
    service: graduatesService,
    isOpen,
    resourceKey,
    filters,
    fetcher,
    errorMessage,
    summaryData,
    summaryKey,
  });
}
