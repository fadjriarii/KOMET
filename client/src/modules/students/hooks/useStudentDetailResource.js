import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentsService } from '../services/studentsService';

export function useStudentDetailResource({ isOpen, resourceKey, filters, fetcher, errorMessage }) {
  const filterKey = useMemo(() => studentsService.toQueryString(filters), [filters]);
  const query = useQuery({
    queryKey: ['student-detail', resourceKey, filterKey],
    queryFn: ({ signal }) => fetcher(signal),
    enabled: Boolean(isOpen && resourceKey && typeof fetcher === 'function'),
    staleTime: 30_000,
    retry: 1,
    select: (response) => (response?.success ? response : null),
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error ? (query.error.message || errorMessage) : null,
  };
}
