import { useQuery } from '@tanstack/react-query';
import { queryKey } from '../../../hooks/moduleQueries';
import { studentsService } from '../services/studentsService';

/**
 * Filter options punya endpoint sendiri (bukan bagian summary) karena populasi
 * kolom jarang berubah: di-cache 10 menit, dibuang dari memory setelah 30 menit.
 */
export function useStudentFilterOptions() {
  const query = useQuery({
    queryKey: queryKey('students', 'filter-options'),
    queryFn: ({ signal }) => studentsService.getFilterOptions({ signal }),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (response) => response?.data ?? null,
  });

  return {
    filterOptions: query.data || {},
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message || null,
  };
}
