import { useRef, useState, useCallback } from 'react';

/**
 * Custom hook for smooth mouse click-and-drag horizontal scrolling on table containers.
 */
export function useTableDragScroll() {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [scrollStartX, setScrollStartX] = useState(0);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.selectable-text') || e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('a')) {
      return;
    }

    if (!containerRef.current) return;
    setIsDragging(true);
    setDragStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollStartX(containerRef.current.scrollLeft);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - dragStartX) * 1.5;
    containerRef.current.scrollLeft = scrollStartX - walk;
  }, [isDragging, dragStartX, scrollStartX]);

  const handleMouseUpOrLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    containerRef,
    isDragging,
    events: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUpOrLeave,
      onMouseLeave: handleMouseUpOrLeave,
    },
  };
}
