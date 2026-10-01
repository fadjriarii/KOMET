import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { graduatesService } from '../services/graduatesService';

export function useGraduateDetailResource({ isOpen, resourceKey, filters, fetcher, errorMessage, summaryData, summaryKey }) {
  const filterKey = useMemo(() => graduatesService.toQueryString(filters), [filters]);
  
  // Check if we already have the data in summary to avoid double fetch
  const hasSummaryData = Boolean(summaryData?.success && summaryData?.summary?.[summaryKey]);
  
  const query = useQuery({
    queryKey: ['graduate-detail', resourceKey, filterKey],
    queryFn: async ({ signal }) => {
      if (hasSummaryData) {
        return { success: true, data: summaryData.summary[summaryKey] };
      }
      return fetcher(signal);
    },
    enabled: Boolean(isOpen && resourceKey && typeof fetcher === 'function' && !hasSummaryData),
    staleTime: 30_000,
    retry: 1,
    select: (response) => (response?.success ? response : null),
  });
  
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
