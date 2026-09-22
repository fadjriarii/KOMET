import { useEffect } from 'react';

/**
 * Custom hook to detect clicks outside of a referenced DOM element.
 * @param {import('react').RefObject} ref - React ref of the element to monitor
 * @param {() => void} handler - Callback triggered when clicking outside
 * @param {boolean} [enabled=true] - Whether the listener is active
 */
export function useClickOutside(ref, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [ref, handler, enabled]);
}
