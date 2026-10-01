import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { graduatesService } from '../services/graduatesService';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { STUDENT_SEARCH_DEBOUNCE_MS } from '../../../constants/debounce';

/**
 * useGraduateList - Hook fetch data paginated dari GET /api/graduates/list
 */
export function useGraduateList(queryParams, { limit = 10 } = {}) {
  const debouncedSearch = useDebouncedValue(queryParams?.search || '', STUDENT_SEARCH_DEBOUNCE_MS);
  const effectiveParams = useMemo(
    () => ({ ...queryParams, search: debouncedSearch }),
    [queryParams, debouncedSearch]
  );
  const filterKey = useMemo(
    () => graduatesService.toQueryString(effectiveParams),
    [effectiveParams]
  );
  const [pageState, setPageState] = useState(() => ({ filterKey, page: 1 }));
  const requestedPage = pageState.filterKey === filterKey ? pageState.page : 1;

  const setPage = useCallback((nextPage) => {
    setPageState((currentState) => {
      const currentPage = currentState.filterKey === filterKey ? currentState.page : 1;
      const page = typeof nextPage === 'function' ? nextPage(currentPage) : nextPage;
      return { filterKey, page };
    });
  }, [filterKey]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['graduates', 'list', filterKey, requestedPage, limit],
    queryFn: ({ signal }) => graduatesService.getGraduateList({
      filters: effectiveParams,
      page: requestedPage,
      limit,
    }, { signal }),
    select: (response) => (response?.success ? response : null),
    placeholderData: (previousData, previousQuery) => (
      previousQuery?.queryKey?.[2] === filterKey ? previousData : undefined
    ),
    staleTime: 2 * 60 * 1000,
  });

  return {
    rows: Array.isArray(data?.data) ? data.data : [],
    pagination: data?.pagination || { page: 1, totalPages: 1, total: 0 },
    page: requestedPage,
    setPage,
    isLoading,
    isFetching,
    error: error?.message || null,
  };
}
