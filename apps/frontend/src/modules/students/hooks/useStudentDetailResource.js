import { studentsService } from '../services/studentsService';
import { useDetailResource } from '../../../hooks/useDetailResource';

export function useStudentDetailResource({
  isOpen,
  resourceKey,
  filters,
  fetcher,
  errorMessage,
  summaryData,
  summaryKey,
}) {
  return useDetailResource({
    namespace: 'students',
    service: studentsService,
    isOpen,
    resourceKey,
    filters,
    fetcher,
    errorMessage,
    summaryData,
    summaryKey,
  });
}
