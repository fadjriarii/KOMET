import { mbkmService } from '../services/mbkmService';
import { useDetailResource } from '../../../hooks/useDetailResource';

export function useMbkmDetailResource({
  isOpen,
  resourceKey,
  filters,
  fetcher,
  errorMessage,
  summaryData,
  summaryKey,
}) {
  return useDetailResource({
    namespace: 'mbkm',
    service: mbkmService,
    isOpen,
    resourceKey,
    filters,
    fetcher,
    errorMessage,
    summaryData,
    summaryKey,
  });
}
