import { studentsService } from '../services/studentsService';
import { usePaginatedList } from '../../../hooks/usePaginatedList';

/**
 * useStudentList - Hook fetch data paginated dari GET /api/students/students
 *
 * Mengelola debounce pencarian, pagination, cache, dan retry via TanStack Query.
 */
export function useStudentList(queryParams, { limit = 10 } = {}) {
  return usePaginatedList({
    namespace: 'students',
    service: studentsService,
    queryParams,
    listMethod: studentsService.getStudentList,
    limit,
  });
}
