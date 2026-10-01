import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentsService } from '../services/studentsService';

export function useStudentDetailResource({ isOpen, resourceKey, filters, fetcher, errorMessage, summaryData, summaryKey }) {
  const filterKey = useMemo(() => studentsService.toQueryString(filters), [filters]);
  
  // Check if we already have the data in summary to avoid double fetch
  const hasSummaryData = Boolean(summaryData?.success && summaryData?.summary?.[summaryKey]);
  
  const query = useQuery({
    queryKey: ['student-detail', resourceKey, filterKey],
    queryFn: async ({ signal }) => {
      // If data already exists in summary, return it directly without network call
      if (hasSummaryData) {
        return { success: true, data: summaryData.summary[summaryKey] };
      }
      // Otherwise fetch from detail endpoint
      return fetcher(signal);
    },
    enabled: Boolean(isOpen && resourceKey && typeof fetcher === 'function' && !hasSummaryData),
    staleTime: 30_000,
    retry: 1,
    select: (response) => (response?.success ? response : null),
  });
  
  // If we have summary data, return it directly
  if (hasSummaryData) {
    return {
      data: { success: true, data: summaryData.summary[summaryKey] },
      isLoading: false,
      error: null,
    };
  }
  
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error ? (query.error.message || errorMessage) : null,
  };
}
