/** Transform + opacity popup dari status animasi (macOS Quick Look). */
export function modalStyle(isAnimatingIn, originDelta) {
  const initialTransform = originDelta
    ? `translate3d(${originDelta.dx}px, ${originDelta.dy}px, 0) scale(0.25)`
    : 'translate3d(0, -32px, 0) scale(0.92)';

  return {
    transform: isAnimatingIn ? 'translate3d(0, 0, 0) scale(1)' : initialTransform,
    opacity: isAnimatingIn ? 1 : 0,
    transition: isAnimatingIn
      ? 'transform 1000ms cubic-bezier(0.16, 1, 0.3, 1), opacity 900ms cubic-bezier(0.16, 1, 0.3, 1)'
      : 'transform 700ms cubic-bezier(0.16, 1, 0.3, 1), opacity 600ms cubic-bezier(0.16, 1, 0.3, 1)',
  };
}
