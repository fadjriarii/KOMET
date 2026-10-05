import { useState, useRef } from 'react';

const DEFAULT_WIDTH = 256;

export function useSidebarDrag({ setIsSidebarOpen }) {
  const [dragWidth, setDragWidth] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef(0);
  const hasMovedRef = useRef(false);
  const cooldownUntilRef = useRef(0);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    hasMovedRef.current = false;
    startXRef.current = e.clientX;
    setDragWidth(DEFAULT_WIDTH);

    const handleMouseMove = (moveEvent) => {
      const currentX = moveEvent.clientX;
      const deltaX = currentX - startXRef.current;

      if (Math.abs(deltaX) > 4) {
        hasMovedRef.current = true;
      }

      const newWidth = Math.max(0, Math.min(DEFAULT_WIDTH, currentX));
      setDragWidth(newWidth);
    };

    const handleMouseUp = (upEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      const finalWidth = Math.max(0, Math.min(DEFAULT_WIDTH, upEvent.clientX));
      setIsDragging(false);
      setDragWidth(null);

      // Cooldown 400ms agar tombol floating tidak langsung ter-trigger
      cooldownUntilRef.current = Date.now() + 400;

      // Jika hanya klik atau ditarik < 140px, tutup sidebar
      if (!hasMovedRef.current || finalWidth < 140) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return {
    dragWidth,
    isDragging,
    cooldownUntilRef,
    handleMouseDown,
    DEFAULT_WIDTH,
  };
}
