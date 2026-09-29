import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentsService } from '../services/studentsService';

export function useStudentSummary(queryParams) {
  const queryString = useMemo(
    () => studentsService.toQueryString(queryParams),
    [queryParams]
  );
  const enabled = Boolean(queryParams?.tahunAjaran);
  const query = useQuery({
    queryKey: ['students', 'summary', queryString],
    queryFn: ({ signal }) => studentsService.getSummary(queryParams, { signal }),
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    select: (response) => (response?.success ? response : null),
  });

  return { ...query, error: query.error?.message || null };
}
