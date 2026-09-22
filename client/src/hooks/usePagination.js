import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook to manage table or list pagination state.
 * @param {Array} items - Full list of data items
 * @param {number} [initialPageSize=10] - Initial rows per page
 */
export function usePagination(items = [], initialPageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Ensure current page does not exceed total pages when list changes
  const validPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (validPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, validPage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endIndex = Math.min(validPage * pageSize, totalItems);

  const goToPage = useCallback((page) => {
    setCurrentPage((prev) => {
      const target = typeof page === 'function' ? page(prev) : page;
      return Math.max(1, Math.min(target, totalPages));
    });
  }, [totalPages]);

  const nextPage = useCallback(() => goToPage((p) => p + 1), [goToPage]);
  const prevPage = useCallback(() => goToPage((p) => p - 1), [goToPage]);

  const changePageSize = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  }, []);

  return {
    currentPage: validPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedData,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    setCurrentPage,
  };
}
