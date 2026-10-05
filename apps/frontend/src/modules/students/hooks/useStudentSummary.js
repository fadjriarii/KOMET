import { studentsService } from '../services/studentsService';
import { useSummaryQuery } from '../../../hooks/useSummaryQuery';

export function useStudentSummary(queryParams) {
  return useSummaryQuery({
    namespace: 'students',
    service: studentsService,
    queryParams,
    enabled: Boolean(queryParams?.tahunAjaran),
  });
}
