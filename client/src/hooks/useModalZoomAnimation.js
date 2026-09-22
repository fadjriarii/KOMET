import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook managing the macOS-like origin-to-center modal zoom animation.
 * @param {boolean} isOpen - Whether the modal is requested to open
 * @param {DOMRect|null} originRect - Bounding rect of triggering element
 * @param {() => void} onClose - Callback when close animation finishes
 */
export function useModalZoomAnimation(isOpen, originRect, onClose) {
  const [isRendered, setIsRendered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState('center center');
  const [initialTransform, setInitialTransform] = useState('');
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }

      if (originRect) {
        const modalWidth = Math.min(window.innerWidth * 0.94, 1100);
        const modalHeight = Math.min(window.innerHeight * 0.9, 850);
        const modalCenterX = window.innerWidth / 2;
        const modalCenterY = window.innerHeight / 2;

        const cardCenterX = originRect.left + originRect.width / 2;
        const cardCenterY = originRect.top + originRect.height / 2;

        const deltaX = cardCenterX - modalCenterX;
        const deltaY = cardCenterY - modalCenterY;

        const scaleX = originRect.width / modalWidth;
        const scaleY = originRect.height / modalHeight;
        const initialScale = Math.max(0.15, Math.min(scaleX, scaleY, 0.45));

        setInitialTransform(`translate(${deltaX}px, ${deltaY}px) scale(${initialScale})`);
        setTransformOrigin('center center');
      } else {
        setInitialTransform('scale(0.92) translateY(16px)');
        setTransformOrigin('center center');
      }

      setIsRendered(true);
      setIsExpanded(false);

      const frameId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsExpanded(true);
        });
      });

      return () => cancelAnimationFrame(frameId);
    } else if (isRendered) {
      setIsExpanded(false);
      closeTimerRef.current = setTimeout(() => {
        setIsRendered(false);
        if (onClose) onClose();
      }, 350);
    }
  }, [isOpen, originRect]);

  const handleClose = useCallback(() => {
    setIsExpanded(false);
    closeTimerRef.current = setTimeout(() => {
      setIsRendered(false);
      if (onClose) onClose();
    }, 320);
  }, [onClose]);

  return {
    isRendered,
    isExpanded,
    initialTransform,
    transformOrigin,
    handleClose,
  };
}
