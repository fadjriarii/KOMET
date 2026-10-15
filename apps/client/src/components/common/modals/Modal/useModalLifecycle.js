import { useEffect, useState } from 'react';
import { useOpenerFocus } from './useOpenerFocus';

/**
 * Siklus hidup popup: timer render/animasi, kunci scroll body, jebakan fokus
 * Tab, dan pengembalian fokus ke pemicu. Mengembalikan status animasi dan ref
 * panel; tidak me-render apa pun.
 */
export function useModalLifecycle(isOpen, onClose, panelRef) {
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.();
        return;
      }
      if (event.key !== 'Tab') return;
      // Daftar focusable sederhana: yang dicari hanya target Tab di dalam panel,
      // dan panel ini tidak punya elemen yang tersembunyi di balik tab terlipat.
      const focusable = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === panelRef.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);

      // Delay 25ms untuk memastikan initial transform terpasang sebelum transisi scale & position
      const renderTimer = setTimeout(() => {
        setIsRendered(true);
      }, 0);
      const timer = setTimeout(() => {
        setIsAnimatingIn(true);
      }, 25);

      return () => {
        clearTimeout(renderTimer);
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      // Trigger animasi penutupan (kembali mengecil ke arah card)
      const closeAnimationTimer = setTimeout(() => {
        setIsAnimatingIn(false);
      }, 0);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 700);

      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(closeAnimationTimer);
        clearTimeout(timer);
      };
    }
  }, [isOpen, onClose, panelRef]);

  // Clean-up overflow & listener saat unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Dialog yang tidak pernah menerima fokus tidak bisa dipakai keyboard: fokus
  // dipindah ke panel saat ia muncul dan dikembalikan ke pemicunya saat menutup.
  useOpenerFocus(isOpen);

  useEffect(() => {
    if (isRendered) panelRef.current?.focus();
  }, [isRendered, panelRef]);

  return { isRendered, isAnimatingIn };
}
