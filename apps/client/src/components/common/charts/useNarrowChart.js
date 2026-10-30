import { useEffect, useState } from 'react';

const NARROW_QUERY = '(max-width: 640px)';

/** true di layar ponsel; chart memakai ini untuk merapatkan margin/sumbu. */
export function useNarrowChart() {
  const [isNarrow, setIsNarrow] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(NARROW_QUERY).matches,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia(NARROW_QUERY);
    const handleChange = (event) => setIsNarrow(event.matches);
    media.addEventListener?.('change', handleChange);
    return () => media.removeEventListener?.('change', handleChange);
  }, []);

  return isNarrow;
}
