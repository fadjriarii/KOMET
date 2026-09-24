import { useState, useEffect, useRef, useMemo } from 'react';
import { studentsService } from '../services/studentsService';
import {
  buildStudentListFilterKey,
  rebuildStudentListParams,
} from '../../../utils/logic';

const SEARCH_DEBOUNCE_MS = 400;

/**
 * useStudentList - Hook fetch data paginated dari GET /api/students/students
 *
 * Mengelola: debounce pencarian, reset halaman saat filter berubah,
 * proteksi respons basi (stale response), loading & error state.
 */
export function useStudentList(queryParams, { limit = 10 } = {}) {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const filterKey = useMemo(
    () => buildStudentListFilterKey(queryParams),
    [queryParams]
  );

  const debouncedFilterKey = useDebouncedValue(filterKey, SEARCH_DEBOUNCE_MS);

  // Reset ke halaman 1 setiap filter berubah
  const prevFilterKeyRef = useRef(filterKey);
  useEffect(() => {
    if (prevFilterKeyRef.current !== filterKey) {
      prevFilterKeyRef.current = filterKey;
      setPage(1);
    }
  }, [filterKey]);

  useEffect(() => {
    let isMounted = true;
    const effectiveParams = rebuildStudentListParams(debouncedFilterKey, page, limit);

    async function fetchList() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await studentsService.getStudentList(effectiveParams);
        if (!isMounted) return;
        if (response?.success) {
          setRows(Array.isArray(response.data) ? response.data : []);
          setPagination({
            page: response.pagination?.page ?? page,
            totalPages: response.pagination?.totalPages ?? 1,
            total: response.pagination?.total ?? 0,
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Backend belum terhubung');
          setRows([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchList();

    return () => {
      isMounted = false;
    };
  }, [debouncedFilterKey, page, limit]);

  return { rows, pagination, page, setPage, isLoading, error };
}

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
