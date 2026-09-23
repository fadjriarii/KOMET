import { useState, useEffect } from 'react';
import { studentsService } from '../services/studentsService';

export function useStudentsData() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSummary() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await studentsService.getSummary();
        if (isMounted && response?.success) {
          setData(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Backend belum terhubung');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, isLoading, error };
}
