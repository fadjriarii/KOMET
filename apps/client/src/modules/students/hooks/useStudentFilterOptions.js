import { useQuery } from '@tanstack/react-query';
import { studentsService } from '../services/studentsService';

/**
 * useStudentFilterOptions - Fetch filter options dari endpoint terpisah.
 *
 * Filter options jarang berubah, jadi di-cache dengan staleTime panjang (10 menit).
 * Ini mengurangi beban server dan meningkatkan performa UX.
 */
export function useStudentFilterOptions() {
  const query = useQuery({
    queryKey: ['students', 'filter-options'],
    queryFn: ({ signal }) => studentsService.getFilterOptions({ signal }),
    staleTime: 10 * 60 * 1000, // 10 menit
    gcTime: 30 * 60 * 1000, // 30 menit (formerly cacheTime)
    retry: 2,
    select: (response) => (response?.success && response?.data ? response.data : null),
  });

  return {
    filterOptions: query.data || {},
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message || null,
  };
}
