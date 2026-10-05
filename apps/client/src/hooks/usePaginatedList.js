import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

/** Reusable server-side pagination with filter-aware page reset. */
export function usePaginatedList({ namespace, service, queryParams, listMethod, limit = 10 }) {
  const filterKey = useMemo(() => service.toQueryString(queryParams), [service, queryParams]);
  const [pageState, setPageState] = useState(() => ({ filterKey, page: 1 }));
  const page = pageState.filterKey === filterKey ? pageState.page : 1;

  const setPage = useCallback(
    (nextPage) => {
      setPageState((current) => {
        const currentPage = current.filterKey === filterKey ? current.page : 1;
        const resolvedPage = typeof nextPage === 'function' ? nextPage(currentPage) : nextPage;
        return { filterKey, page: Math.max(1, Number(resolvedPage) || 1) };
      });
    },
    [filterKey],
  );

  const query = useQuery({
    queryKey: [namespace, 'list', filterKey, page, limit],
    queryFn: ({ signal }) => listMethod({ filters: queryParams, page, limit }, { signal }),
    select: (response) => (response?.success ? response : null),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey?.[2] === filterKey ? previousData : undefined,
    staleTime: 2 * 60 * 1000,
  });

  return {
    rows: Array.isArray(query.data?.data) ? query.data.data : [],
    pagination: query.data?.pagination || { page: 1, totalPages: 1, total: 0 },
    page,
    setPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message || null,
  };
}
