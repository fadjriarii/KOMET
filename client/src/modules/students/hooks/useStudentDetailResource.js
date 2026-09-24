import { useEffect, useState } from 'react';

export function useStudentDetailResource(isOpen, fetcher, errorMessage) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || typeof fetcher !== 'function') return undefined;

    let isMounted = true;

    async function fetchDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetcher();
        if (isMounted && response?.success) {
          setData(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || errorMessage);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [isOpen, fetcher, errorMessage]);

  return { data, isLoading, error };
}
