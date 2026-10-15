import { useMemo } from 'react';

/** Vektor dari tengah konten ke tengah card pemanggil (animasi Quick Look). */
export function useOriginDelta(originRect) {
  return useMemo(() => {
    if (!originRect || typeof window === 'undefined') return null;

    const portalTarget = document.getElementById('content-modal-root');
    const targetRect = portalTarget
      ? portalTarget.getBoundingClientRect()
      : { left: 0, top: 64, width: window.innerWidth, height: window.innerHeight - 64 };

    const contentCenterX = targetRect.left + targetRect.width / 2;
    const contentCenterY = targetRect.top + targetRect.height / 2;
    const cardCenterX = originRect.left + originRect.width / 2;
    const cardCenterY = originRect.top + originRect.height / 2;

    return {
      dx: Math.round(cardCenterX - contentCenterX),
      dy: Math.round(cardCenterY - contentCenterY),
    };
  }, [originRect]);
}
